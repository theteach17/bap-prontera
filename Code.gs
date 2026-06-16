/* Meeting Room Booking System - Secure v13 Final Signature Placeholder Version (Enhanced & Fixed)
   Includes: Conflict Detection, Color Coding, Advanced Email Notifications,
   Admin System, Universal CRUD, Logging, Double-Submit Prevention,
   Email Saving Fix & Update Notifications
*/

// --- Constants ---
const SHEET_ROOMS = "Rooms";
const SHEET_BOOKINGS = "Bookings";
const SHEET_OFFICERS = "Officers";
const SHEET_ADMIN = "Admin";
const SHEET_LOGS = "Logs";
const TEMPLATE_SLIDE_ID = "1w8_7f9mQ7Jzy1R_jSEFDpNQhPfDMGCRpmz7RWA2ZnKw";
const PDF_FOLDER_ID = "1ksLcIacmLQztar0EfhPe4G9WF01KtOf4";
// URL ระบบจริงสำหรับสร้างลิงก์แบบประเมินในอีเมล
// สำคัญ: ใช้ /exec เท่านั้น ไม่ใช้ /dev และใช้รูปแบบ URL ที่เปิดใช้งานจริงของระบบ
const WEB_APP_EXEC_URL = "https://script.google.com/a/macros/g.klaeng.ac.th/s/AKfycbwS0Qk-G1IdZ-94W4aLMJjXT6Otxs1pJ7CZMHFbcjPczhPNXI7yzR_KY7BhyXcR9kkAPA/exec";


// --- Approval Workflow Constants ---
const SHEET_APPROVAL_FLOW = "ApprovalFlow";
const SHEET_APPROVAL_STEPS = "ApprovalSteps";
const SHEET_APPROVAL_LOGS = "ApprovalLogs";
const SHEET_APPROVERS = "Approvers";
const FINAL_SIGNED_MEMO_FOLDER_ID = "1p4G76-WMN4ymui-h-apVyAghZIS2MOaB";
const APPROVAL_TOKEN_TTL_DAYS = 7;
const APPROVAL_STEP_HEADERS = [
  "Approval ID", "Booking ID", "Step No", "Step Name", "Approver Role", "Approver Name",
  "Approver Email", "Status", "Sign Method", "Signature File ID", "Signature Image URL",
  "Signed At", "Comment", "Token", "Token Expire At", "Notify Count", "Last Notified At",
  "Rejected Reason", "Created At", "Updated At", "Approver Position", "Approver Position Short"
];
const APPROVAL_FLOW_HEADERS = [
  "Approval ID", "Booking ID", "Topic", "Room ID", "Room Name", "Requester", "Requester Email",
  "Current Step", "Current Approver Role", "Current Approver Email", "Overall Status",
  "Initial Memo PDF URL", "Final Signed PDF URL", "Final Signed PDF File ID",
  "Created At", "Updated At", "Completed At", "Cancel/Reject Reason"
];
const APPROVAL_LOG_HEADERS = ["Timestamp", "Approval ID", "Booking ID", "Action", "Actor Name", "Actor Email", "Step No", "Details"];
const APPROVER_HEADERS = ["Step No", "Step Name", "Role Key", "Name", "Email", "Active", "Room ID", "Room Name", "Position", "Position Short"];
const STEP1_ROLE_KEY = "ROOM_OFFICER";
const STEP2_ROLE_KEY = "BUILDING_GROUP";
const STEP3_ROLE_KEY = "DEPUTY_BUDGET";
// Final signed memo rendering settings
// ระบบจะวางลายเซ็นตามตำแหน่ง placeholder ใน Google Slides Template โดยตรง
// หากต้องการแนบหน้าสรุปการลงนามดิจิทัลเพิ่มเติม ให้เปลี่ยนเป็น true
const ADD_APPROVAL_SUMMARY_SLIDE = false;
const SIGNATURE_IMAGE_WIDTH = 120;
const SIGNATURE_IMAGE_HEIGHT = 50;


// --- Security, Schema & Validation Constants ---
const SESSION_CACHE_PREFIX = "MRBS_SESSION_";
const SESSION_TTL_SECONDS = 21600; // 6 hours (CacheService maximum)
const EDITABLE_SHEETS = [SHEET_ROOMS, SHEET_OFFICERS, SHEET_ADMIN, SHEET_APPROVERS];
const VIEWABLE_SHEETS = [SHEET_ROOMS, SHEET_OFFICERS, SHEET_ADMIN, SHEET_BOOKINGS, "Evaluate", SHEET_LOGS, SHEET_APPROVERS, SHEET_APPROVAL_FLOW, SHEET_APPROVAL_STEPS, SHEET_APPROVAL_LOGS];
const BOOKING_REQUIRED_HEADERS = [
  "Booking ID", "Timestamp", "Room ID", "Room Name", "Topic", "Requester Name",
  "Start Time", "End Time", "Headcount", "Status",
  "Requester Email", "Eval Sent", "Reminder30MinSent", "SetupDetails", "Layout",
  "EvaluationSummarySent", "Cancel Reason", "Last Updated", "Memo PDF URL",
  "Signature File ID", "Signature Image URL"
];
const ALLOWED_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const MAX_SETUP_FILE_SIZE_BYTES = 2 * 1024 * 1024;


// --- Booking Status Model ---
// สถานะนี้เป็นแกนกลางของระบบจองห้อง เพื่อให้ปฏิทิน การตรวจเวลาชน ระบบลงนาม และ trigger ต่าง ๆ ตีความตรงกัน
const BOOKING_STATUS = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  APPROVAL_ERROR: "Approval Error",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected"
};

const BOOKING_STATUS_LABELS_TH = {
  "Pending Approval": "รอลงนามเอกสาร",
  "Approved": "อนุมัติครบถ้วน",
  "Approval Error": "รอเจ้าหน้าที่ตรวจสอบกระบวนการลงนาม",
  "Cancelled": "ยกเลิกแล้ว",
  "Rejected": "ไม่อนุมัติ/ถูกส่งกลับ"
};

function normalizeBookingStatus_(status) {
  const text = normalizeText_(status);
  const lower = text.toLowerCase();
  if (!text) return BOOKING_STATUS.PENDING_APPROVAL;
  if (lower === "pending approval" || lower === "pending" || lower === "รอลงนามเอกสาร") return BOOKING_STATUS.PENDING_APPROVAL;
  if (lower === "approved" || lower === "อนุมัติครบถ้วน") return BOOKING_STATUS.APPROVED;
  if (lower === "approval error" || lower === "workflow error" || lower === "รอเจ้าหน้าที่ตรวจสอบกระบวนการลงนาม") return BOOKING_STATUS.APPROVAL_ERROR;
  if (lower === "cancelled" || lower === "canceled" || lower === "ยกเลิกแล้ว") return BOOKING_STATUS.CANCELLED;
  if (lower === "rejected" || lower === "ไม่อนุมัติ" || lower === "ไม่อนุมัติ/ถูกส่งกลับ") return BOOKING_STATUS.REJECTED;
  return text;
}

function getBookingStatusLabel_(status) {
  const normalized = normalizeBookingStatus_(status);
  return BOOKING_STATUS_LABELS_TH[normalized] || normalized || "ไม่ทราบสถานะ";
}

function isBookingReleased_(status) {
  const normalized = normalizeBookingStatus_(status);
  return [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED].includes(normalized);
}

function isBookingBlockingRoom_(status) {
  const normalized = normalizeBookingStatus_(status);
  return [
    BOOKING_STATUS.PENDING_APPROVAL,
    BOOKING_STATUS.APPROVED,
    BOOKING_STATUS.APPROVAL_ERROR
  ].includes(normalized);
}

function isBookingVisibleOnCalendar_(status) {
  return isBookingBlockingRoom_(status);
}

function isBookingEligibleForOperationalReminder_(status) {
  return normalizeBookingStatus_(status) === BOOKING_STATUS.APPROVED;
}

function isBookingEligibleForEvaluation_(status) {
  return normalizeBookingStatus_(status) === BOOKING_STATUS.APPROVED;
}

function getBookingCalendarTitle_(topic, requester, status) {
  const normalized = normalizeBookingStatus_(status);
  let prefix = "";
  if (normalized === BOOKING_STATUS.PENDING_APPROVAL) prefix = "[รอลงนาม] ";
  if (normalized === BOOKING_STATUS.APPROVAL_ERROR) prefix = "[รอตรวจสอบ] ";
  return `${prefix}${normalizeText_(topic)} (${normalizeText_(requester)})`;
}

function setBookingStatusByRow_(bookSheet, cols, rowNo, status, reason) {
  const normalized = normalizeBookingStatus_(status);
  bookSheet.getRange(rowNo, cols.status).setValue(normalized);
  if (cols.lastUpdated) bookSheet.getRange(rowNo, cols.lastUpdated).setValue(new Date());
  if (reason !== undefined && reason !== null && cols.cancelReason) {
    bookSheet.getRange(rowNo, cols.cancelReason).setValue(sanitizePlainText_(reason, 1000));
  }
  return normalized;
}

function setBookingStatusById_(bookingId, status, reason) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const data = bookSheet.getDataRange().getValues();
  const safeBookingId = normalizeText_(bookingId);
  for (let i = 1; i < data.length; i++) {
    if (normalizeText_(getCell_(data[i], cols.id)) === safeBookingId) {
      return setBookingStatusByRow_(bookSheet, cols, i + 1, status, reason);
    }
  }
  throw new Error("ไม่พบรายการจองสำหรับอัปเดตสถานะ: " + safeBookingId);
}

function markBookingApprovalError_(bookingId, errorMessage, actor) {
  const reason = "Approval workflow error: " + sanitizePlainText_(errorMessage || "ไม่ทราบสาเหตุ", 900);
  try {
    const status = setBookingStatusById_(bookingId, BOOKING_STATUS.APPROVAL_ERROR, reason);
    logAction(actor || "System", "Booking Approval Error", `Booking ID: ${bookingId} | ${reason}`);
    return status;
  } catch (e) {
    logAction("System", "Booking Approval Error Update Failed", `Booking ID: ${bookingId} | ${e.message} | Original: ${reason}`);
    throw e;
  }
}

function markBookingPendingApproval_(bookingId, reason) {
  const status = setBookingStatusById_(bookingId, BOOKING_STATUS.PENDING_APPROVAL, reason || "เริ่มกระบวนการลงนามเอกสาร");
  logAction("System", "Booking Pending Approval", `Booking ID: ${bookingId}`);
  return status;
}

function markBookingApproved_(bookingId, reason) {
  const status = setBookingStatusById_(bookingId, BOOKING_STATUS.APPROVED, reason || "ลงนามเอกสารครบทุกขั้น");
  logAction("System", "Booking Approved", `Booking ID: ${bookingId}`);
  return status;
}

function markBookingRejected_(bookingId, reason) {
  const status = setBookingStatusById_(bookingId, BOOKING_STATUS.REJECTED, reason || "เอกสารถูกปฏิเสธหรือส่งกลับแก้ไข");
  logAction("System", "Booking Rejected", `Booking ID: ${bookingId} | เหตุผล: ${sanitizePlainText_(reason || "", 500)}`);
  return status;
}


// --- Approval Permission Guards ---
// ใช้เป็นด่านกลางเพื่อไม่ให้ลิงก์ลงนามที่ยังมี token อยู่ สามารถทำงานต่อได้เมื่อรายการจองถูกยกเลิกหรือถูกปฏิเสธแล้ว
const APPROVAL_FLOW_PENDING_STATUSES = [
  "PENDING_ROOM_OFFICER",
  "PENDING_BUILDING_GROUP",
  "PENDING_DEPUTY_DIRECTOR"
];
const APPROVAL_FLOW_TERMINAL_STATUSES = ["COMPLETED", "CANCELLED", "REJECTED", "SUPERSEDED"];
const APPROVAL_STEP_OPEN_STATUSES = ["PENDING", "WAITING"];

function isApprovalFlowPendingStatus_(status) {
  return APPROVAL_FLOW_PENDING_STATUSES.includes(normalizeText_(status));
}

function isApprovalFlowTerminalStatus_(status) {
  return APPROVAL_FLOW_TERMINAL_STATUSES.includes(normalizeText_(status));
}

function isApprovalStepOpenStatus_(status) {
  return APPROVAL_STEP_OPEN_STATUSES.includes(normalizeText_(status));
}

function getBookingStatusById_(bookingId) {
  return getBookingRecordObject_(bookingId).status;
}

function assertBookingCanBeApproved_(bookingId) {
  const status = normalizeBookingStatus_(getBookingStatusById_(bookingId));
  if (status === BOOKING_STATUS.CANCELLED) {
    throw new Error("รายการจองนี้ถูกยกเลิกแล้ว ไม่สามารถลงนามเอกสารได้");
  }
  if (status === BOOKING_STATUS.REJECTED) {
    throw new Error("รายการจองนี้ถูกไม่อนุมัติ/ถูกส่งกลับแล้ว ไม่สามารถลงนามเอกสารได้");
  }
  return status;
}

// --- Helper: Safe Text / HTML / Email ---
function normalizeText_(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function escapeHtml_(value) {
  return normalizeText_(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizePlainText_(value, maxLength) {
  const limit = maxLength || 500;
  return normalizeText_(value).replace(/[\u0000-\u001F\u007F]/g, "").slice(0, limit);
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText_(email));
}

function isSent_(value) {
  return normalizeText_(value).toLowerCase() === "sent";
}

function sameDate_(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function extractDeploymentIdFromUrl_(url) {
  const text = normalizeText_(url);
  // รองรับทั้ง /exec และ /dev และรองรับ URL แบบโดเมนองค์กรหลายรูปแบบ
  // เช่น /macros/s/DEPLOYMENT/exec, /a/macros/domain/s/DEPLOYMENT/exec, /a/domain/macros/s/DEPLOYMENT/dev
  const match = text.match(/\/s\/([^\/\?]+)(?:\/(?:exec|dev))?/i);
  return match ? match[1] : "";
}

function normalizeWebAppBaseUrl_(url) {
  const text = normalizeText_(url);
  if (!text) return "";

  // ตัด query/hash และบังคับให้ลงท้ายเป็น /exec เสมอ เพราะลิงก์ที่ส่งให้ผู้ใช้ต้องเป็น Web App deployment จริง
  const noQuery = text.split("?")[0].split("#")[0].replace(/\/$/, "");

  // กรณีเป็น URL ที่มี /s/DEPLOYMENT/(exec|dev) อยู่แล้ว ให้รักษาโครงสร้าง domain เดิมไว้
  // เพื่อไม่ทำให้ URL จริงขององค์กร เช่น /a/macros/g.klaeng.ac.th/s/... ถูกแปลงผิดรูปแบบ
  if (/\/s\/[^\/\?]+(?:\/(?:exec|dev))?$/i.test(noQuery)) {
    return noQuery.replace(/\/dev$/i, "/exec").replace(/\/exec$/i, "/exec");
  }

  const deploymentId = extractDeploymentIdFromUrl_(text);
  if (deploymentId) {
    return `https://script.google.com/macros/s/${deploymentId}/exec`;
  }

  return noQuery;
}

function getWebAppUrl_() {
  const props = PropertiesService.getScriptProperties();
  const overrideUrl = normalizeText_(props.getProperty("MRBS_WEB_APP_URL_OVERRIDE"));
  if (overrideUrl) return normalizeWebAppBaseUrl_(overrideUrl);

  // ให้ใช้ URL ระบบจริงก่อนเสมอ เพราะ ScriptApp.getService().getUrl() เมื่อ Run จาก Editor มักคืนค่า /dev
  // ซึ่งไม่ควรถูกส่งให้ผู้ใช้งานในอีเมลแบบประเมิน
  if (normalizeText_(WEB_APP_EXEC_URL)) return normalizeWebAppBaseUrl_(WEB_APP_EXEC_URL);

  const serviceUrl = normalizeText_(ScriptApp.getService().getUrl());
  if (!serviceUrl) {
    throw new Error("ยังไม่พบ URL ของ Web App กรุณา Deploy ระบบเป็น Web App ก่อนใช้งานลิงก์แบบประเมิน");
  }
  return normalizeWebAppBaseUrl_(serviceUrl);
}

function buildEvaluationUrl_(bookingId) {
  return `${getWebAppUrl_()}?page=evaluate&bid=${encodeURIComponent(normalizeText_(bookingId))}`;
}

function buildApprovalUrl_(token) {
  return `${getWebAppUrl_()}?page=approve&token=${encodeURIComponent(normalizeText_(token))}`;
}

// ใช้เมื่อต้องการกำหนด URL Web App เองแบบถาวร เช่น หลัง Deploy ใหม่แล้วต้องการล็อก URL ที่ถูกต้อง
// วิธีใช้: เปิด Apps Script > Run > setWebAppUrlOverride แล้วใส่ URL Web App ปัจจุบันในตัวแปรด้านล่างก่อนรัน
function setWebAppUrlOverride() {
  const currentWebAppUrl = WEB_APP_EXEC_URL; // URL ระบบจริงที่ใช้ส่งให้ผู้ใช้งาน
  const url = normalizeWebAppBaseUrl_(currentWebAppUrl);
  if (!url || !extractDeploymentIdFromUrl_(url)) {
    throw new Error("กรุณาใส่ URL Web App ที่ถูกต้องในตัวแปร currentWebAppUrl ก่อนรันฟังก์ชันนี้");
  }
  PropertiesService.getScriptProperties().setProperty("MRBS_WEB_APP_URL_OVERRIDE", url);
  return url;
}

function clearWebAppUrlOverride() {
  PropertiesService.getScriptProperties().deleteProperty("MRBS_WEB_APP_URL_OVERRIDE");
  return "Cleared";
}

function testCurrentEvaluationBaseUrl() {
  const url = getWebAppUrl_();
  console.log(url);
  return url;
}

// --- Helper: Database Schema ---
function ensureDatabaseSchema_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  if (bookSheet) {
    const currentLastColumn = Math.max(bookSheet.getLastColumn(), BOOKING_REQUIRED_HEADERS.length);
    if (bookSheet.getLastColumn() < BOOKING_REQUIRED_HEADERS.length) {
      bookSheet.insertColumnsAfter(bookSheet.getLastColumn(), BOOKING_REQUIRED_HEADERS.length - bookSheet.getLastColumn());
    }
    const headerRange = bookSheet.getRange(1, 1, 1, BOOKING_REQUIRED_HEADERS.length);
    const headers = headerRange.getValues()[0];
    let changed = false;
    const newHeaders = BOOKING_REQUIRED_HEADERS.map((defaultHeader, index) => {
      const existing = normalizeText_(headers[index]);
      if (!existing) {
        changed = true;
        return defaultHeader;
      }
      return existing;
    });
    if (changed) headerRange.setValues([newHeaders]);
  }

  const logSheet = ss.getSheetByName(SHEET_LOGS);
  if (logSheet && logSheet.getLastRow() === 0) {
    logSheet.appendRow(["Timestamp", "User", "Action", "Details"]);
  }

  ensureApprovalSchema_();
}


function ensureSheetWithHeaders_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  if (sheet.getLastColumn() < headers.length) {
    const add = headers.length - Math.max(sheet.getLastColumn(), 1);
    if (sheet.getLastColumn() === 0) {
      sheet.insertColumns(1, headers.length);
    } else if (add > 0) {
      sheet.insertColumnsAfter(sheet.getLastColumn(), add);
    }
  }
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  let changed = false;
  const next = headers.map((h, i) => {
    const existing = normalizeText_(current[i]);
    if (!existing) {
      changed = true;
      return h;
    }
    return existing;
  });
  if (changed || sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([next]);
  return sheet;
}

function ensureApprovalSchema_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetWithHeaders_(ss, SHEET_APPROVAL_FLOW, APPROVAL_FLOW_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_APPROVAL_STEPS, APPROVAL_STEP_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_APPROVAL_LOGS, APPROVAL_LOG_HEADERS);
  const approverSheet = ensureSheetWithHeaders_(ss, SHEET_APPROVERS, APPROVER_HEADERS);
  ensureDefaultApproverRows_(ss, approverSheet);
}

function ensureDefaultApproverRows_(ss, approverSheet) {
  const values = approverSheet.getDataRange().getValues();
  const rows = values.slice(1);
  const hasAnyApprover = rows.some(row => normalizeText_(row[0]) || normalizeText_(row[3]) || normalizeText_(row[4]));

  if (!hasAnyApprover) {
    // Step 1: ผู้รับผิดชอบห้องประชุม เลือกตาม Room ID
    approverSheet.appendRow([1, "ผู้รับผิดชอบห้องประชุม", STEP1_ROLE_KEY, "ผู้รับผิดชอบห้องเกียรติยศ", "", true, "L03", "ห้องเกียรติยศ", "ผู้รับผิดชอบห้องประชุม", "ผู้รับผิดชอบห้องประชุม"]);
    approverSheet.appendRow([1, "ผู้รับผิดชอบห้องประชุม", STEP1_ROLE_KEY, "ผู้รับผิดชอบห้องสมุด 4", "", true, "L04", "ห้องสมุด 4", "ผู้รับผิดชอบห้องประชุม", "ผู้รับผิดชอบห้องประชุม"]);
    // Step 2 เป็นผู้ลงนามประจำ ส่วน Step 3 รองรับทั้งแบบระบุรายห้องและ fallback แบบทุกห้อง
    approverSheet.appendRow([2, "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม", STEP2_ROLE_KEY, "ผู้ลงนามกลุ่มงานอาคารสถานที่และสิ่งแวดล้อม", "", true, "ALL", "ทุกห้อง", "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม", "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม"]);
    approverSheet.appendRow([3, "รองผู้อำนวยการกลุ่มบริหารงบประมาณ", STEP3_ROLE_KEY, "รองผู้อำนวยการกลุ่มบริหารงบประมาณ", "", true, "ALL", "ทุกห้อง", "รองผู้อำนวยการกลุ่มบริหารงบประมาณ", "รองผู้อำนวยการกลุ่มบริหารงบประมาณ"]);
    return;
  }

  const map = getHeaderMap_(approverSheet);
  const stepCol = findColumn_(map, ["Step No"], 1);
  const stepNameCol = findColumn_(map, ["Step Name"], 2);
  const roleCol = findColumn_(map, ["Role Key"], 3);
  const nameCol = findColumn_(map, ["Name", "Approver Name"], 4);
  const activeCol = findColumn_(map, ["Active", "Status"], 6);
  const roomIdCol = findColumn_(map, ["Room ID", "RoomID", "Room"], 7);
  const roomNameCol = findColumn_(map, ["Room Name", "RoomName"], 8);

  let hasStep1 = false;
  let hasFixedStep2 = false;
  let hasStep3 = false;

  for (let i = 1; i < values.length; i++) {
    const rowNo = i + 1;
    const stepNo = parseInt(values[i][stepCol - 1], 10);
    const roleKey = normalizeText_(values[i][roleCol - 1]);
    const roomId = normalizeText_(values[i][roomIdCol - 1]);
    const roomScope = roomId.toLowerCase();
    const isAllOrBlank = !roomScope || roomScope === 'all' || roomScope === '*' || roomScope === 'ทุกห้อง';

    if (stepNo === 1) hasStep1 = true;
    if (stepNo === 2 && isAllOrBlank) hasFixedStep2 = true;
    if (stepNo === 3) hasStep3 = true;

    // Migration จาก v11: แถว Step 2 ที่เคยแยกตามห้อง ให้ย้ายความหมายเป็น Step 1
    // เพื่อให้ตรงกับตรรกะใหม่: ผู้รับผิดชอบห้องประชุมเป็นคนที่เลือกตามห้อง
    if (!hasStep1 && stepNo === 2 && !isAllOrBlank) {
      approverSheet.getRange(rowNo, stepCol).setValue(1);
      approverSheet.getRange(rowNo, stepNameCol).setValue("ผู้รับผิดชอบห้องประชุม");
      approverSheet.getRange(rowNo, roleCol).setValue(STEP1_ROLE_KEY);
      const currentName = normalizeText_(values[i][nameCol - 1]);
      if (!currentName || currentName.includes("ขั้นตอนที่ 2")) {
        approverSheet.getRange(rowNo, nameCol).setValue(`ผู้รับผิดชอบ${normalizeText_(values[i][roomNameCol - 1]) || roomId || 'ห้องประชุม'}`);
      }
      if (!normalizeText_(values[i][activeCol - 1])) approverSheet.getRange(rowNo, activeCol).setValue(true);
      hasStep1 = true;
    }

    if (stepNo === 2 && !isAllOrBlank && roleKey === STEP2_ROLE_KEY) {
      // Step 2 ไม่ใช้เงื่อนไขห้องอีกต่อไป จึงไม่ถือเป็น fixed step2
    }

    if (stepNo === 3 && !roomId) {
      approverSheet.getRange(rowNo, roomIdCol).setValue("ALL");
      approverSheet.getRange(rowNo, roomNameCol).setValue("ทุกห้อง");
    }
  }

  const refreshed = approverSheet.getDataRange().getValues().slice(1);
  const hasStep1After = refreshed.some(row => parseInt(row[stepCol - 1], 10) === 1);
  const hasFixedStep2After = refreshed.some(row => {
    const stepNo = parseInt(row[stepCol - 1], 10);
    const roomId = normalizeText_(row[roomIdCol - 1]).toLowerCase();
    return stepNo === 2 && (!roomId || roomId === 'all' || roomId === '*' || roomId === 'ทุกห้อง');
  });
  const hasStep3After = refreshed.some(row => parseInt(row[stepCol - 1], 10) === 3);

  if (!hasStep1After) {
    approverSheet.appendRow([1, "ผู้รับผิดชอบห้องประชุม", STEP1_ROLE_KEY, "ผู้รับผิดชอบห้องเกียรติยศ", "", true, "L03", "ห้องเกียรติยศ", "ผู้รับผิดชอบห้องประชุม", "ผู้รับผิดชอบห้องประชุม"]);
    approverSheet.appendRow([1, "ผู้รับผิดชอบห้องประชุม", STEP1_ROLE_KEY, "ผู้รับผิดชอบห้องสมุด 4", "", true, "L04", "ห้องสมุด 4", "ผู้รับผิดชอบห้องประชุม", "ผู้รับผิดชอบห้องประชุม"]);
  }
  if (!hasFixedStep2After) {
    approverSheet.appendRow([2, "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม", STEP2_ROLE_KEY, "ผู้ลงนามกลุ่มงานอาคารสถานที่และสิ่งแวดล้อม", "", true, "ALL", "ทุกห้อง", "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม", "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม"]);
  }
  if (!hasStep3After) {
    approverSheet.appendRow([3, "รองผู้อำนวยการกลุ่มบริหารงบประมาณ", STEP3_ROLE_KEY, "รองผู้อำนวยการกลุ่มบริหารงบประมาณ", "", true, "ALL", "ทุกห้อง", "รองผู้อำนวยการกลุ่มบริหารงบประมาณ", "รองผู้อำนวยการกลุ่มบริหารงบประมาณ"]);
  }
}

function getHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    const key = normalizeText_(header).toLowerCase();
    if (key) map[key] = index + 1;
  });
  return map;
}

function findColumn_(headerMap, aliases, fallback) {
  for (let i = 0; i < aliases.length; i++) {
    const key = normalizeText_(aliases[i]).toLowerCase();
    if (headerMap[key]) return headerMap[key];
  }
  return fallback;
}

function getBookingCols_(sheet) {
  const map = getHeaderMap_(sheet);
  return {
    id: findColumn_(map, ["Booking ID"], 1),
    timestamp: findColumn_(map, ["Timestamp"], 2),
    roomId: findColumn_(map, ["Room ID"], 3),
    roomName: findColumn_(map, ["Room Name"], 4),
    topic: findColumn_(map, ["Topic"], 5),
    requester: findColumn_(map, ["Requester Name"], 6),
    start: findColumn_(map, ["Start Time"], 7),
    end: findColumn_(map, ["End Time"], 8),
    headcount: findColumn_(map, ["Headcount"], 9),
    status: findColumn_(map, ["Status (Approved/Cancelled)", "Status"], 10),
    requesterEmail: findColumn_(map, ["Requester Email"], 11),
    evalSent: findColumn_(map, ["Eval Sent"], 12),
    reminder30: findColumn_(map, ["Reminder30MinSent"], 13),
    setupDetails: findColumn_(map, ["SetupDetails"], 14),
    layoutUrl: findColumn_(map, ["Layout"], 15),
    summarySent: findColumn_(map, ["EvaluationSummarySent"], 16),
    cancelReason: findColumn_(map, ["Cancel Reason"], 17),
    lastUpdated: findColumn_(map, ["Last Updated"], 18),
    memoPdfUrl: findColumn_(map, ["Memo PDF URL", "PDF URL", "MemoPdfUrl"], 19),
    signatureFileId: findColumn_(map, ["Signature File ID", "SignatureFileId", "Signature ID"], 20),
    signatureImageUrl: findColumn_(map, ["Signature Image URL", "Signature URL", "SignatureImageUrl"], 21)
  };
}

function getCell_(row, colNumber) {
  return row[colNumber - 1];
}

function buildBookingObjectFromRow_(row, cols) {
  return {
    bookingId: normalizeText_(getCell_(row, cols.id)),
    roomId: normalizeText_(getCell_(row, cols.roomId)),
    roomName: normalizeText_(getCell_(row, cols.roomName)),
    topic: normalizeText_(getCell_(row, cols.topic)),
    requester: normalizeText_(getCell_(row, cols.requester)),
    requesterEmail: normalizeText_(getCell_(row, cols.requesterEmail)),
    start: getCell_(row, cols.start),
    end: getCell_(row, cols.end),
    headcount: Number(getCell_(row, cols.headcount)) || 0,
    status: normalizeBookingStatus_(getCell_(row, cols.status)),
    statusLabel: getBookingStatusLabel_(getCell_(row, cols.status)),
    setupDetails: normalizeText_(getCell_(row, cols.setupDetails)),
    layoutUrl: normalizeText_(getCell_(row, cols.layoutUrl)),
    memoPdfUrl: normalizeText_(getCell_(row, cols.memoPdfUrl)),
    signatureFileId: normalizeText_(getCell_(row, cols.signatureFileId)),
    signatureImageUrl: normalizeText_(getCell_(row, cols.signatureImageUrl))
  };
}


function generateBookingId_(bookSheet, cols) {
  const existingIds = bookSheet.getDataRange().getValues().slice(1).map(row => normalizeText_(getCell_(row, cols.id)));
  let bookingId = "";
  do {
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Bangkok", "yyyyMMddHHmmss");
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    bookingId = `BK-${stamp}-${randomPart}`;
  } while (existingIds.includes(bookingId));
  return bookingId;
}

// --- Helper: Rooms ---
function getActiveRooms_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ROOMS);
  if (!sheet) throw new Error("ไม่พบชีท Rooms");
  const data = sheet.getDataRange().getValues();
  data.shift();

  return data
    .filter(row => row[0])
    .map(row => {
      const status = normalizeText_(row[5]);
      const layoutValue = normalizeText_(row[8]).toLowerCase();
      return {
        roomId: normalizeText_(row[0]),
        roomName: normalizeText_(row[1]),
        location: normalizeText_(row[2]),
        capacity: Number(row[3]) || 0,
        facilities: normalizeText_(row[4]),
        status: status,
        image: normalizeText_(row[6]),
        color: normalizeText_(row[7]) || "#3788d8",
        requireSetup: layoutValue === "active" || layoutValue === "yes" || layoutValue === "ใช่" || layoutValue === "true"
      };
    })
    .filter(room => ["available", "active"].includes(room.status.toLowerCase()));
}

function getRoomById_(roomId) {
  const id = normalizeText_(roomId);
  return getActiveRooms_().find(room => room.roomId === id) || null;
}

// --- Helper: Authentication & Authorization ---
function createSession_(userData) {
  const token = Utilities.getUuid() + "-" + Utilities.getUuid();
  const payload = {
    username: normalizeText_(userData.username),
    name: normalizeText_(userData.name),
    role: normalizeText_(userData.role),
    email: normalizeText_(userData.email),
    createdAt: new Date().toISOString()
  };
  const json = JSON.stringify(payload);
  CacheService.getScriptCache().put(SESSION_CACHE_PREFIX + token, json, SESSION_TTL_SECONDS);
  PropertiesService.getScriptProperties().setProperty(SESSION_CACHE_PREFIX + token, JSON.stringify({
    data: payload,
    expiresAt: Date.now() + (SESSION_TTL_SECONDS * 1000)
  }));
  return token;
}

function getSession_(sessionToken) {
  const token = normalizeText_(sessionToken);
  if (!token) return null;

  const cacheKey = SESSION_CACHE_PREFIX + token;
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) return JSON.parse(cached);

  const stored = PropertiesService.getScriptProperties().getProperty(cacheKey);
  if (!stored) return null;

  const parsed = JSON.parse(stored);
  if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
    PropertiesService.getScriptProperties().deleteProperty(cacheKey);
    return null;
  }

  CacheService.getScriptCache().put(cacheKey, JSON.stringify(parsed.data), SESSION_TTL_SECONDS);
  return parsed.data;
}

function requireUser_(sessionToken, allowedRoles) {
  const user = getSession_(sessionToken);
  if (!user) throw new Error("SESSION_EXPIRED: กรุณาเข้าสู่ระบบใหม่อีกครั้ง");

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error("PERMISSION_DENIED: บัญชีนี้ไม่มีสิทธิ์ดำเนินการดังกล่าว");
  }
  return user;
}

function formatUserForLog_(user) {
  if (!user) return "Guest";
  return `${user.name} (${user.username})`;
}

function formatUserForPublicDisplay_(user) {
  if (!user) return "เจ้าหน้าที่ผู้ดูแลระบบ";
  return normalizeText_(user.name) || "เจ้าหน้าที่ผู้ดูแลระบบ";
}

function refreshSession(sessionToken) {
  const user = requireUser_(sessionToken, []);
  CacheService.getScriptCache().put(SESSION_CACHE_PREFIX + normalizeText_(sessionToken), JSON.stringify(user), SESSION_TTL_SECONDS);
  return user;
}

function logoutSession(sessionToken) {
  const token = normalizeText_(sessionToken);
  if (token) {
    CacheService.getScriptCache().remove(SESSION_CACHE_PREFIX + token);
    PropertiesService.getScriptProperties().deleteProperty(SESSION_CACHE_PREFIX + token);
  }
  return "Success";
}

function assertEditableSheet_(sheetName) {
  const safeName = normalizeText_(sheetName);
  if (!EDITABLE_SHEETS.includes(safeName)) {
    throw new Error("ระบบอนุญาตให้แก้ไขผ่านหน้าจัดการฐานข้อมูลเฉพาะชีท Rooms, Officers และ Admin เท่านั้น เพื่อป้องกันข้อมูลการจอง/ประวัติการใช้งานเสียหาย");
  }
  return safeName;
}

function assertViewableSheet_(sheetName) {
  const safeName = normalizeText_(sheetName);
  if (!VIEWABLE_SHEETS.includes(safeName)) {
    throw new Error("ไม่อนุญาตให้เปิดชีทนี้ผ่านระบบจัดการฐานข้อมูล");
  }
  return safeName;
}


// --- Core Functions ---

function doGet(e) {
  if (e.parameter && e.parameter.page === 'approve') {
    var approveTemplate = HtmlService.createTemplateFromFile('approve');
    approveTemplate.token = e.parameter.token || '';
    return approveTemplate.evaluate()
      .setTitle('ลงนามอนุมัติเอกสารขอใช้ห้องประชุม')
      .setFaviconUrl('https://img2.pic.in.th/pic/logofd3322a65d133ac4.png')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // ตรวจสอบว่ามีพารามิเตอร์ ?page=evaluate ส่งมาหรือไม่
  if (e.parameter && e.parameter.page === 'evaluate') {
    // ส่ง bookingId ไปที่หน้า evaluate ด้วย
    var template = HtmlService.createTemplateFromFile('evaluate');
    template.bookingId = e.parameter.bid || ''; 
    
    return template.evaluate()
      .setTitle('แบบประเมินความพึงพอใจ - Meeting Room System')
      .setFaviconUrl('https://img2.pic.in.th/pic/logofd3322a65d133ac4.png')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // ถ้าไม่มีพารามิเตอร์ ให้แสดงหน้าจองห้องปกติ (โค้ดเดิม)
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Meeting Room Booking System')
    .setFaviconUrl('https://img2.pic.in.th/pic/logofd3322a65d133ac4.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- Helper: Logging ---

function logAction(user, action, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(SHEET_LOGS);

  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_LOGS);
    logSheet.appendRow(["Timestamp", "User", "Action", "Details"]);
  }

  logSheet.appendRow([
    new Date(),
    sanitizePlainText_(user, 200),
    sanitizePlainText_(action, 100),
    sanitizePlainText_(details, 1000)
  ]);
}

// --- Database Connection (Read) ---

function getRoomsData() {
  ensureDatabaseSchema_();
  return getActiveRooms_();
}

function getBookingsData() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_BOOKINGS);
  if (!sheet) throw new Error("ไม่พบชีท Bookings");

  const cols = getBookingCols_(sheet);
  const data = sheet.getDataRange().getValues();
  data.shift();

  return data
    .filter(row => normalizeText_(getCell_(row, cols.id)) && isBookingVisibleOnCalendar_(getCell_(row, cols.status)))
    .map(row => {
      const startObj = new Date(getCell_(row, cols.start));
      const endObj = new Date(getCell_(row, cols.end));
      if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) return null;

      return {
        id: normalizeText_(getCell_(row, cols.id)),
        title: getBookingCalendarTitle_(getCell_(row, cols.topic), getCell_(row, cols.requester), getCell_(row, cols.status)),
        start: startObj.toISOString(),
        end: endObj.toISOString(),
        resourceId: normalizeText_(getCell_(row, cols.roomId)),
        extendedProps: {
          roomName: normalizeText_(getCell_(row, cols.roomName)),
          description: normalizeText_(getCell_(row, cols.topic)),
          requester: normalizeText_(getCell_(row, cols.requester)),
          headcount: Number(getCell_(row, cols.headcount)) || 0,
          roomId: normalizeText_(getCell_(row, cols.roomId)),
          requesterEmail: normalizeText_(getCell_(row, cols.requesterEmail)),
          setupDetails: normalizeText_(getCell_(row, cols.setupDetails)),
          layoutUrl: normalizeText_(getCell_(row, cols.layoutUrl)),
          status: normalizeBookingStatus_(getCell_(row, cols.status)),
          statusLabel: getBookingStatusLabel_(getCell_(row, cols.status))
        }
      };
    })
    .filter(Boolean);
}

// --- Booking Management ---

function cancelBooking(bookingId, sessionToken, cancelReason) {
  ensureDatabaseSchema_();
  const user = requireUser_(sessionToken, ["Admin", "Officer"]);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const data = bookSheet.getDataRange().getValues();
  const safeBookingId = normalizeText_(bookingId);
  const safeReason = sanitizePlainText_(cancelReason || "ไม่ระบุเหตุผล", 500);
  const cancelledByForLog = formatUserForLog_(user);
  const cancelledByForEmail = formatUserForPublicDisplay_(user);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (normalizeText_(getCell_(row, cols.id)) === safeBookingId) {
      const oldStatus = normalizeText_(getCell_(row, cols.status));
      if (normalizeBookingStatus_(oldStatus) === BOOKING_STATUS.CANCELLED) {
        throw new Error("รายการนี้ถูกยกเลิกไปแล้ว");
      }

      const bookingData = {
        bookingId: safeBookingId,
        roomId: normalizeText_(getCell_(row, cols.roomId)),
        roomName: normalizeText_(getCell_(row, cols.roomName)),
        topic: normalizeText_(getCell_(row, cols.topic)),
        requester: normalizeText_(getCell_(row, cols.requester)),
        requesterEmail: normalizeText_(getCell_(row, cols.requesterEmail)),
        headcount: normalizeText_(getCell_(row, cols.headcount)),
        start: getCell_(row, cols.start),
        end: getCell_(row, cols.end),
        cancelReason: safeReason,
        cancelledBy: cancelledByForEmail,
        cancelledAt: new Date()
      };

      setBookingStatusByRow_(bookSheet, cols, i + 1, BOOKING_STATUS.CANCELLED, safeReason);
      logAction(cancelledByForLog, "Cancel Booking", `ยกเลิกการจอง ID: ${safeBookingId} | เหตุผล: ${safeReason}`);
      try {
        cancelApprovalFlowForBooking_(safeBookingId, safeReason, cancelledByForLog);
      } catch (approvalCancelErr) {
        logAction("System", "Approval Cancel Error", `Booking ID: ${safeBookingId} | ${approvalCancelErr.message}`);
      }

      try {
        sendCancellationNotifications_(bookingData);
      } catch (emailErr) {
        logAction("System", "Cancellation Email Error", `Booking ID: ${safeBookingId} | ${emailErr.message}`);
      }

      return { status: BOOKING_STATUS.CANCELLED, bookingId: safeBookingId };
    }
  }
  throw new Error("ไม่พบรายการจอง");
}

// --- Universal CRUD ---

function getSheetNames(sessionToken) {
  requireUser_(sessionToken, ["Admin"]);
  return EDITABLE_SHEETS;
}

function getSheetData(sheetName, sessionToken) {
  requireUser_(sessionToken, ["Admin"]);
  ensureDatabaseSchema_();
  const safeSheetName = assertViewableSheet_(sheetName);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(safeSheetName);
  if (!sheet) throw new Error("Sheet not found");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const formattedData = data.map(row => {
    return row.map((cell, index) => {
      if (safeSheetName === SHEET_ADMIN && index === 1) return ""; // ไม่ส่ง hash รหัสผ่านกลับไปที่ browser
      if (cell instanceof Date) {
        return Utilities.formatDate(cell, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm:ss");
      }
      return cell === null || cell === undefined ? "" : cell;
    });
  });

  return { headers: headers, data: formattedData, editable: EDITABLE_SHEETS.includes(safeSheetName) };
}

function crudDeleteRow(sheetName, rowIndex, sessionToken) {
  const user = requireUser_(sessionToken, ["Admin"]);
  const safeSheetName = assertEditableSheet_(sheetName);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(safeSheetName);
  if (!sheet) throw new Error("Sheet not found");

  const targetRow = parseInt(rowIndex, 10) + 2;
  if (targetRow < 2 || targetRow > sheet.getLastRow()) throw new Error("ตำแหน่งแถวไม่ถูกต้อง");

  if (safeSheetName === SHEET_ADMIN) {
    const values = sheet.getDataRange().getValues();
    const adminRows = values.slice(1).filter(row => normalizeText_(row[3]) === "Admin");
    const targetRole = normalizeText_(sheet.getRange(targetRow, 4).getValue());
    if (targetRole === "Admin" && adminRows.length <= 1) {
      throw new Error("ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้");
    }
  }

  sheet.deleteRow(targetRow);
  logAction(formatUserForLog_(user), "CRUD Delete", `ลบข้อมูลในชีท ${safeSheetName} แถวที่ ${targetRow}`);
  return "Success";
}

// --- Email Logic (Updated) ---

function createEmailTemplate(data, type, officerName = '') {
  const safe = {
    bookingId: escapeHtml_(data.bookingId),
    topic: escapeHtml_(data.topic),
    requester: escapeHtml_(data.requester),
    roomName: escapeHtml_(data.roomName),
    headcount: escapeHtml_(data.headcount),
    startStr: escapeHtml_(data.startStr),
    endStr: escapeHtml_(data.endStr)
  };

  const isUpdate = data.isUpdate || false;
  const primaryColor = type === 'user' ? '#0d6efd' : (type === 'admin' ? '#198754' : '#fd7e14');

  let headerText = '';
  let subText = '';

  if (type === 'user') {
    headerText = isUpdate ? 'แจ้งเตือนการแก้ไขการจอง' : 'ยืนยันการจองห้องประชุม';
    subText = isUpdate ?
       `เรียน ${safe.requester},<br>รายการจองของคุณได้ถูก <strong>แก้ไข</strong> เรียบร้อยแล้ว รายละเอียดล่าสุดดังนี้:` :
       `เรียน ${safe.requester},<br>การจองของคุณได้รับการยืนยันเรียบร้อยแล้ว รายละเอียดดังนี้:`;
  } else if (type === 'admin') {
    headerText = isUpdate ? 'เอกสารบันทึกข้อความกรณีแก้ไขการจอง' : 'เอกสารบันทึกข้อความการจองห้องประชุมใหม่';
    subText = isUpdate ?
      `เรียนทีมผู้ดูแลระบบ,<br>มีการ <strong>แก้ไข</strong> รายการจองห้องประชุม และระบบได้แนบไฟล์ PDF บันทึกข้อความไว้ในอีเมลฉบับนี้ รายละเอียดล่าสุดดังนี้:` :
      `เรียนทีมผู้ดูแลระบบ,<br>มีการจองห้องประชุมใหม่ และระบบได้แนบไฟล์ PDF บันทึกข้อความไว้ในอีเมลฉบับนี้ รายละเอียดดังนี้:`;
  } else {
    headerText = isUpdate ? 'แจ้งเตือนการแก้ไขข้อมูลการจอง' : 'แจ้งเตือนการจองห้องประชุมใหม่';
    subText = isUpdate ?
      `เรียน ${escapeHtml_(officerName)},<br>มีการ <strong>แก้ไข</strong> รายการจองห้องประชุมภายใต้การดูแลของคุณ รายละเอียดล่าสุดดังนี้:` :
      `เรียน ${escapeHtml_(officerName)},<br>มีการจองห้องประชุมภายใต้การดูแลของคุณ รายละเอียดดังนี้:`;
  }

  const shouldShowMemoLink = type === 'admin' && data.memoPdfUrl;

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px;">📅 ${headerText}</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #333;">${subText}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #666; width: 30%;"><strong>รหัสการจอง:</strong></td>
            <td style="padding: 10px; color: #333;">${safe.bookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #666;"><strong>หัวข้อ:</strong></td>
            <td style="padding: 10px; color: #333; font-weight: bold;">${safe.topic}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #666;"><strong>ห้องประชุม:</strong></td>
            <td style="padding: 10px; color: #333;">${safe.roomName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #666;"><strong>ผู้จอง:</strong></td>
            <td style="padding: 10px; color: #333;">${safe.requester} (${safe.headcount} ท่าน)</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #666;"><strong>เวลาเริ่ม:</strong></td>
            <td style="padding: 10px; color: #198754;">${safe.startStr}</td>
          </tr>
          <tr>
            <td style="padding: 10px; color: #666;"><strong>เวลาสิ้นสุด:</strong></td>
            <td style="padding: 10px; color: #dc3545;">${safe.endStr}</td>
          </tr>
        </table>
        ${shouldShowMemoLink ? `
        <div style="margin-top: 25px; text-align: center;">
          <a href="${escapeHtml_(data.memoPdfUrl)}" style="display: inline-block; background-color: #198754; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold;">เปิดไฟล์ PDF บันทึกข้อความ</a>
        </div>` : ''}
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
          <p>ระบบจองห้องประชุมอัตโนมัติ (Meeting Room Booking System)</p>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 🚀 NEW FEATURES: AUTOMATED EMAIL REMINDERS
// ==========================================

// --- Configuration Helper ---
const EMAIL_THEME = {
  primary: '#0d6efd',    // สีหลัก (Blue)
  secondary: '#6c757d',  // สีรอง (Gray)
  success: '#198754',    // สีสถานะปกติ (Green)
  warning: '#ffc107',    // สีแจ้งเตือน (Yellow)
  danger: '#dc3545',     // สีเร่งด่วน (Red)
  bg: '#f8f9fa'          // สีพื้นหลัง
};

// --- Feature 1: Daily Summary to Admins ---
// Trigger: ตั้งค่าให้รัน "ทุกวัน" เวลา "07:00 น."
function sendDailySummaryToAdmins() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const adminRecipients = getAdminNotificationRecipients_();
  const adminEmails = uniqueEmailList_([adminRecipients.to, adminRecipients.cc]).join(',');

  if (!adminEmails) {
    console.log("No admin emails found.");
    return;
  }

  const cols = getBookingCols_(bookSheet);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = bookSheet.getDataRange().getValues().slice(1);
  const todaysBookings = bookings
    .filter(row => {
      const status = getCell_(row, cols.status);
      if (!isBookingVisibleOnCalendar_(status)) return false;
      const startDate = new Date(getCell_(row, cols.start));
      if (isNaN(startDate.getTime())) return false;
      const checkDate = new Date(startDate);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() === today.getTime();
    })
    .sort((a, b) => new Date(getCell_(a, cols.start)) - new Date(getCell_(b, cols.start)));

  const dateStr = today.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  let emailBody = '';

  if (todaysBookings.length > 0) {
    let rowsHtml = '';
    todaysBookings.forEach(row => {
      const booking = buildBookingObjectFromRow_(row, cols);
      const timeStart = new Date(booking.start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const timeEnd = new Date(booking.end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const statusLabel = getBookingStatusLabel_(booking.status);

      rowsHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; color: ${EMAIL_THEME.primary}; font-weight:bold; white-space:nowrap;">${timeStart} - ${timeEnd}</td>
          <td style="padding: 12px;">
            <div style="font-weight:bold; color:#333;">${escapeHtml_(booking.topic)}</div>
            <div style="font-size:12px; color:#666;">📍 ${escapeHtml_(booking.roomName)} | ${escapeHtml_(statusLabel)}</div>
          </td>
          <td style="padding: 12px; text-align:right;">${escapeHtml_(booking.requester)}</td>
        </tr>
      `;
    });

    emailBody = `
      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <p style="margin-bottom: 15px; color: #333;">เรียน เจ้าหน้าที่ผู้ดูแลระบบ,<br>ขอสรุปรายการจองห้องประชุมประจำวันที่ <strong>${escapeHtml_(dateStr)}</strong> ดังนี้:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead style="background-color: ${EMAIL_THEME.bg}; color: #555;">
            <tr>
              <th style="padding: 10px; text-align:left;">เวลา</th>
              <th style="padding: 10px; text-align:left;">รายละเอียดห้อง/หัวข้อ/สถานะ</th>
              <th style="padding: 10px; text-align:right;">ผู้จอง</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="margin-top: 20px; text-align:center;">
          <a href="${escapeHtml_(getWebAppUrl_())}" style="background-color: ${EMAIL_THEME.primary}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px;">เข้าสู่ระบบจัดการ</a>
        </div>
      </div>
    `;
  } else {
    emailBody = `
      <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; text-align: center; border: 1px dashed #ccc;">
        <h3 style="color: #666; margin: 0;">🌴 วันนี้ไม่มีรายการจองห้องประชุม</h3>
        <p style="color: #999; font-size: 14px; margin-top: 10px;">ประจำวันที่ ${escapeHtml_(dateStr)}</p>
      </div>
    `;
  }

  MailApp.sendEmail({
    to: adminEmails,
    subject: `📅 สรุปการใช้ห้องประชุมประจำวัน (${dateStr})`,
    htmlBody: createBaseEmailTemplate('Daily Summary', emailBody, EMAIL_THEME.primary),
    name: "Meeting Room System"
  });
}

// --- Feature 2a: 1 Day Advance Reminder ---
// Trigger: ตั้งค่าให้รัน "ทุกวัน" เวลา "08:00 น."
function sendOneDayAdvanceReminder() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const bookings = bookSheet.getDataRange().getValues().slice(1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  bookings.forEach(row => {
    if (!isBookingEligibleForOperationalReminder_(getCell_(row, cols.status))) return;
    const startDate = new Date(getCell_(row, cols.start));
    if (isNaN(startDate.getTime())) return;
    const checkDate = new Date(startDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate.getTime() === tomorrow.getTime()) {
      sendReminderEmail(row, cols, '1_day_advance');
    }
  });
}

// --- Feature 2b: 30 Minutes Before Reminder ---
// Trigger: แนะนำให้ตั้งค่ารัน "ทุกๆ 5 หรือ 10 นาที"
function sendUrgentReminders() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const bookings = bookSheet.getDataRange().getValues();
  const now = new Date();
  const bufferTime = 30 * 60 * 1000;

  for (let i = 1; i < bookings.length; i++) {
    const row = bookings[i];
    if (!normalizeText_(getCell_(row, cols.id))) continue;
    if (!isBookingEligibleForOperationalReminder_(getCell_(row, cols.status))) continue;
    if (isSent_(getCell_(row, cols.reminder30))) continue;

    const startDate = new Date(getCell_(row, cols.start));
    if (isNaN(startDate.getTime())) continue;

    const timeDiff = startDate.getTime() - now.getTime();
    const isToday = startDate.toDateString() === now.toDateString();
    if (isToday && timeDiff > 0 && timeDiff <= bufferTime) {
      sendReminderEmail(row, cols, '30_min_urgent');
      bookSheet.getRange(i + 1, cols.reminder30).setValue('Sent');
    }
  }
}

// --- Helper: Send Specific Reminder Logic ---
function sendReminderEmail(bookingRow, bookingCols, type) {
  const booking = buildBookingObjectFromRow_(bookingRow, bookingCols);
  const officerRecipients = getOfficerRecipientsForRoom_(booking.roomId);

  const recipients = uniqueEmailList_([booking.requesterEmail, officerRecipients.to, officerRecipients.cc]);
  if (recipients.length === 0) return;

  const fmtDate = new Date(booking.start).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = `${new Date(booking.start).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})} - ${new Date(booking.end).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}`;

  let subject, title, color, subMsg;
  if (type === '1_day_advance') {
    subject = `🔔 แจ้งเตือนล่วงหน้า 1 วัน: ${booking.topic}`;
    title = 'เตรียมความพร้อมก่อนการประชุม';
    color = EMAIL_THEME.primary;
    subMsg = `ระบบขอแจ้งเตือนรายการจองห้องประชุมที่จะมาถึงใน <strong>วันพรุ่งนี้ (${escapeHtml_(fmtDate)})</strong>`;
  } else {
    subject = `⏰ อีก 30 นาทีเริ่มการประชุม: ${booking.topic}`;
    title = 'ใกล้ถึงเวลาการประชุมแล้ว';
    color = EMAIL_THEME.danger;
    subMsg = `ระบบขอแจ้งเตือนรายการจองห้องประชุมที่จะเริ่มในอีก <strong>30 นาที</strong>`;
  }

  const bodyHtml = `
    <div style="text-align: center; margin-bottom: 20px;">
      <p style="font-size: 16px; color: #555;">${subMsg}</p>
    </div>
    <div style="background-color: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
       <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color:#888; width: 30%;">หัวข้อ:</td><td style="padding: 8px; font-weight:bold; font-size:16px;">${escapeHtml_(booking.topic)}</td></tr>
          <tr><td style="padding: 8px; color:#888;">ห้องประชุม:</td><td style="padding: 8px;">${escapeHtml_(booking.roomName)}</td></tr>
          <tr><td style="padding: 8px; color:#888;">เวลา:</td><td style="padding: 8px; color:${color}; font-weight:bold;">${escapeHtml_(fmtTime)} (${escapeHtml_(fmtDate)})</td></tr>
          <tr><td style="padding: 8px; color:#888;">ผู้จอง:</td><td style="padding: 8px;">${escapeHtml_(booking.requester)}</td></tr>
       </table>
    </div>
    <div style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
      กรุณาตรวจสอบความพร้อมของห้องและอุปกรณ์ก่อนถึงเวลาการประชุม
    </div>
  `;

  MailApp.sendEmail({
    to: recipients.join(','),
    subject: subject,
    htmlBody: createBaseEmailTemplate(title, bodyHtml, color),
    name: "Meeting Room System"
  });
}

function createBaseEmailTemplate(headerTitle, contentHtml, headerColor) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:'Prompt', sans-serif, Arial;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; font-family: sans-serif;">
        <div style="background-color: ${headerColor}; padding: 25px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 600;">${headerTitle}</h2>
        </div>
        
        <div style="padding: 30px;">
          ${contentHtml}
        </div>
        
        <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 11px; color: #888;">
          <p style="margin:0;">ระบบจองห้องประชุมอัตโนมัติ (Meeting Room Booking System)</p>
          <p style="margin:5px 0 0 0;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==========================================
// 🚀 NEW FEATURES: POST-MEETING EVALUATION
// ==========================================

// --- Feature 3: Send Evaluation Email (Robust Version) ---
// Trigger: ตั้งค่าให้รัน "ทุกชั่วโมง" หรือ "ทุกวัน" ก็ได้ (แนะนำ "ทุกชั่วโมง")
function sendPostMeetingSurvey() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const bookings = bookSheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < bookings.length; i++) {
    const row = bookings[i];
    const endTime = new Date(getCell_(row, cols.end));
    const status = normalizeText_(getCell_(row, cols.status));
    const userEmail = normalizeText_(getCell_(row, cols.requesterEmail));
    const evalSentStatus = normalizeText_(getCell_(row, cols.evalSent));
    const bookingId = normalizeText_(getCell_(row, cols.id));
    const topic = normalizeText_(getCell_(row, cols.topic));
    const roomName = normalizeText_(getCell_(row, cols.roomName));

    if (!bookingId || isNaN(endTime.getTime())) continue;

    if (isBookingEligibleForEvaluation_(status) && userEmail && endTime < now && !isSent_(evalSentStatus)) {
      try {
        sendEvaluationEmail(userEmail, bookingId, topic, roomName);
        bookSheet.getRange(i + 1, cols.evalSent).setValue("Sent");
        console.log(`Sent survey to ${bookingId}`);
      } catch (e) {
        console.error(`Failed to send/update ${bookingId}: ${e.message}`);
      }
    }
  }
}

function sendEvaluationEmail(email, bookingId, topic, roomName) {
  const evalLink = buildEvaluationUrl_(bookingId);
  const safeTopic = escapeHtml_(topic);
  const safeRoomName = escapeHtml_(roomName);
  const subject = `⭐ ขอเชิญประเมินความพึงพอใจ: ${topic}`;

  const htmlBody = `
    <div style="font-family: 'Prompt', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #6610f2; padding: 25px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 22px;">แบบประเมินความพึงพอใจ</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Satisfaction Survey</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #333;">เรียน ผู้ใช้บริการ,</p>
        <p style="color: #555; line-height: 1.6;">
          การประชุมหัวข้อ <strong>"${safeTopic}"</strong> ณ <strong>${safeRoomName}</strong> ได้สิ้นสุดลงแล้ว<br>
          ขอความร่วมมือท่านสละเวลาเพียงเล็กน้อย เพื่อประเมินความพึงพอใจและให้ข้อเสนอแนะ เพื่อการพัฒนาการบริการให้ดียิ่งขึ้นครับ
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${evalLink}" style="background-color: #ffc107; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ทำแบบประเมิน (คลิกที่นี่)
          </a>
        </div>
        <p style="font-size: 13px; color: #999; text-align: center;">
          *ลิงก์นี้สามารถส่งต่อให้ผู้เข้าร่วมประชุมท่านอื่นร่วมประเมินได้<br>
          *แบบประเมินมีอายุ 5 วันหลังสิ้นสุดการประชุม
        </p>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: "Meeting Room System"
  });
}



function getEvaluationAvailabilityForBooking_(row, cols) {
  const status = normalizeText_(getCell_(row, cols.status));
  const requesterEmail = normalizeText_(getCell_(row, cols.requesterEmail));
  const endTime = new Date(getCell_(row, cols.end));
  const now = new Date();

  const normalizedStatus = normalizeBookingStatus_(status);
  if (normalizedStatus === BOOKING_STATUS.CANCELLED) {
    return { canSend: false, statusLabel: "ยกเลิกแล้ว", reason: "รายการจองนี้ถูกยกเลิกแล้ว" };
  }
  if (normalizedStatus === BOOKING_STATUS.REJECTED) {
    return { canSend: false, statusLabel: "ไม่อนุมัติ", reason: "รายการจองนี้ไม่ผ่านการอนุมัติ จึงไม่สามารถส่งแบบประเมินได้" };
  }
  if (normalizedStatus === BOOKING_STATUS.PENDING_APPROVAL) {
    return { canSend: false, statusLabel: "รอลงนาม", reason: "รายการนี้ยังลงนามเอกสารไม่ครบ จึงยังไม่สามารถส่งแบบประเมินได้" };
  }
  if (normalizedStatus === BOOKING_STATUS.APPROVAL_ERROR) {
    return { canSend: false, statusLabel: "รอตรวจสอบ", reason: "รายการนี้อยู่ระหว่างให้เจ้าหน้าที่ตรวจสอบกระบวนการลงนาม จึงยังไม่สามารถส่งแบบประเมินได้" };
  }
  if (!isBookingEligibleForEvaluation_(normalizedStatus)) {
    return { canSend: false, statusLabel: getBookingStatusLabel_(normalizedStatus), reason: "สถานะรายการนี้ยังไม่พร้อมสำหรับการประเมิน" };
  }
  if (!isValidEmail_(requesterEmail)) {
    return { canSend: false, statusLabel: "ไม่มีอีเมลผู้จอง", reason: "รายการนี้ไม่มีอีเมลผู้จองที่ถูกต้อง" };
  }
  if (isNaN(endTime.getTime())) {
    return { canSend: false, statusLabel: "เวลาไม่ถูกต้อง", reason: "ข้อมูลเวลาสิ้นสุดการประชุมไม่ถูกต้อง" };
  }
  if (now < endTime) {
    return { canSend: false, statusLabel: "ยังไม่ถึงเวลาประเมิน", reason: "แบบประเมินจะส่งได้หลังสิ้นสุดการประชุมเท่านั้น" };
  }

  const diffDaysAfterEnd = (now.getTime() - endTime.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDaysAfterEnd > 5) {
    return { canSend: false, statusLabel: "หมดอายุแล้ว", reason: "แบบประเมินหมดอายุแล้ว เนื่องจากเกิน 5 วันหลังสิ้นสุดการประชุม" };
  }

  return { canSend: true, statusLabel: "พร้อมส่ง", reason: "สามารถส่งลิงก์แบบประเมินใหม่ได้" };
}

function getBookingOptionsForEvaluationResend(sessionToken) {
  ensureDatabaseSchema_();
  requireUser_(sessionToken, ['Admin']);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_BOOKINGS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const cols = getBookingCols_(sheet);
  const rows = sheet.getDataRange().getValues().slice(1);

  return rows
    .filter(row => normalizeText_(getCell_(row, cols.id)))
    .map(row => {
      const bookingId = normalizeText_(getCell_(row, cols.id));
      const roomName = normalizeText_(getCell_(row, cols.roomName));
      const topic = normalizeText_(getCell_(row, cols.topic));
      const requester = normalizeText_(getCell_(row, cols.requester));
      const requesterEmail = normalizeText_(getCell_(row, cols.requesterEmail));
      const bookingStatus = normalizeBookingStatus_(getCell_(row, cols.status));
      const evalSent = normalizeText_(getCell_(row, cols.evalSent));
      const startValue = getCell_(row, cols.start);
      const endValue = getCell_(row, cols.end);
      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      const startStr = isNaN(startDate.getTime()) ? normalizeText_(startValue) : startDate.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
      const endStr = isNaN(endDate.getTime()) ? normalizeText_(endValue) : endDate.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
      const availability = getEvaluationAvailabilityForBooking_(row, cols);
      return {
        bookingId: bookingId,
        label: `${bookingId} | ${endStr} | ${roomName} | ${topic} | ${requester} | ${requesterEmail || 'ไม่มีอีเมล'} | ${availability.statusLabel}`,
        bookingStatus: bookingStatus,
        evalSent: evalSent,
        roomName: roomName,
        topic: topic,
        requester: requester,
        requesterEmail: requesterEmail,
        startStr: startStr,
        endStr: endStr,
        canSend: availability.canSend,
        statusLabel: availability.statusLabel,
        reason: availability.reason,
        evaluationUrl: buildEvaluationUrl_(bookingId)
      };
    })
    .filter(item => item.canSend === true)
    .sort((a, b) => b.bookingId.localeCompare(a.bookingId));
}

function resendEvaluationEmailForBooking(bookingId, sessionToken) {
  const user = requireUser_(sessionToken, ['Admin']);
  ensureDatabaseSchema_();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const data = bookSheet.getDataRange().getValues();
  const safeBookingId = normalizeText_(bookingId);
  let foundRow = null;
  let rowNo = -1;

  for (let i = 1; i < data.length; i++) {
    if (normalizeText_(getCell_(data[i], cols.id)) === safeBookingId) {
      foundRow = data[i];
      rowNo = i + 1;
      break;
    }
  }

  if (!foundRow) throw new Error("ไม่พบเลขที่การจองนี้");

  const availability = getEvaluationAvailabilityForBooking_(foundRow, cols);
  if (!availability.canSend) throw new Error(availability.reason);

  const userEmail = normalizeText_(getCell_(foundRow, cols.requesterEmail));
  const topic = normalizeText_(getCell_(foundRow, cols.topic));
  const roomName = normalizeText_(getCell_(foundRow, cols.roomName));
  const requester = normalizeText_(getCell_(foundRow, cols.requester));

  sendEvaluationEmail(userEmail, safeBookingId, topic, roomName);

  if (cols.evalSent) bookSheet.getRange(rowNo, cols.evalSent).setValue("Sent");
  if (cols.lastUpdated) bookSheet.getRange(rowNo, cols.lastUpdated).setValue(new Date());

  logAction(formatUserForLog_(user), "Resend Evaluation Email", `ส่งลิงก์แบบประเมินใหม่ Booking ID: ${safeBookingId} | ผู้จอง: ${requester} | Email: ${userEmail}`);
  return {
    success: true,
    bookingId: safeBookingId,
    requester: requester,
    email: userEmail,
    topic: topic,
    roomName: roomName,
    evaluationUrl: buildEvaluationUrl_(safeBookingId),
    message: "ส่งลิงก์แบบประเมินใหม่ให้ผู้จองเรียบร้อยแล้ว"
  };
}

function getEvaluationUrlForBooking(bookingId, sessionToken) {
  requireUser_(sessionToken);
  return buildEvaluationUrl_(bookingId);
}

// --- Backend Logic for Evaluation Form ---

function getBookingDetailsForEval(bookingId) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const bookings = bookSheet.getDataRange().getValues();
  const booking = bookings.find(r => normalizeText_(getCell_(r, cols.id)) === normalizeText_(bookingId));

  if (!booking) throw new Error("ไม่พบข้อมูลการจอง");
  const bookingStatus = normalizeBookingStatus_(getCell_(booking, cols.status));
  if (bookingStatus === BOOKING_STATUS.CANCELLED) {
    return { error: "CANCELLED", message: "รายการจองนี้ถูกยกเลิกแล้ว" };
  }
  if (bookingStatus === BOOKING_STATUS.REJECTED) {
    return { error: "REJECTED", message: "รายการจองนี้ไม่ผ่านการอนุมัติ จึงไม่เปิดให้ประเมิน" };
  }
  if (bookingStatus === BOOKING_STATUS.PENDING_APPROVAL) {
    return { error: "PENDING_APPROVAL", message: "รายการนี้ยังอยู่ระหว่างรอลงนามเอกสาร" };
  }
  if (bookingStatus === BOOKING_STATUS.APPROVAL_ERROR) {
    return { error: "APPROVAL_ERROR", message: "รายการนี้อยู่ระหว่างเจ้าหน้าที่ตรวจสอบกระบวนการลงนาม" };
  }
  if (bookingStatus !== BOOKING_STATUS.APPROVED) {
    return { error: "NOT_APPROVED", message: "รายการนี้ยังไม่อยู่ในสถานะอนุมัติครบถ้วน" };
  }

  const endTime = new Date(getCell_(booking, cols.end));
  const now = new Date();
  if (isNaN(endTime.getTime())) throw new Error("รูปแบบเวลาสิ้นสุดการประชุมไม่ถูกต้อง");

  if (now < endTime) {
    return { error: "NOT_READY", message: "แบบประเมินจะเปิดให้กรอกหลังสิ้นสุดการประชุม" };
  }

  const diffDaysAfterEnd = (now.getTime() - endTime.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDaysAfterEnd > 5) {
    return { error: "EXPIRED", message: "แบบประเมินนี้หมดอายุแล้ว (เกิน 5 วันหลังจบการประชุม)" };
  }

  const evalSheet = ss.getSheetByName("Evaluate");
  let count = 0;
  if (evalSheet) {
    const evals = evalSheet.getDataRange().getValues();
    count = evals.filter(r => normalizeText_(r[1]) === normalizeText_(bookingId)).length;
  }

  return {
    bookingId: normalizeText_(getCell_(booking, cols.id)),
    roomName: normalizeText_(getCell_(booking, cols.roomName)),
    topic: normalizeText_(getCell_(booking, cols.topic)),
    requester: normalizeText_(getCell_(booking, cols.requester)),
    dateStr: new Date(getCell_(booking, cols.start)).toLocaleDateString('th-TH', { dateStyle: 'long' }),
    evalCount: count
  };
}

function submitEvaluation(form) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const bookings = bookSheet.getDataRange().getValues();
  const booking = bookings.find(r => normalizeText_(getCell_(r, cols.id)) === normalizeText_(form.bookingId));

  if (!booking) throw new Error("ไม่พบข้อมูลการจอง");
  const bookingStatus = normalizeBookingStatus_(getCell_(booking, cols.status));
  if (bookingStatus === BOOKING_STATUS.CANCELLED) throw new Error("รายการจองนี้ถูกยกเลิกแล้ว");
  if (bookingStatus === BOOKING_STATUS.REJECTED) throw new Error("รายการจองนี้ไม่ผ่านการอนุมัติ จึงไม่สามารถประเมินได้");
  if (bookingStatus !== BOOKING_STATUS.APPROVED) throw new Error("รายการนี้ยังลงนามเอกสารไม่ครบหรืออยู่ระหว่างเจ้าหน้าที่ตรวจสอบ จึงยังไม่สามารถประเมินได้");

  const endTime = new Date(getCell_(booking, cols.end));
  const now = new Date();
  if (now < endTime) throw new Error("แบบประเมินจะเปิดให้กรอกหลังสิ้นสุดการประชุม");
  if ((now.getTime() - endTime.getTime()) / (1000 * 60 * 60 * 24) > 5) {
    throw new Error("แบบประเมินนี้หมดอายุแล้ว");
  }

  let sheet = ss.getSheetByName("Evaluate");
  if (!sheet) {
    sheet = ss.insertSheet("Evaluate");
    sheet.appendRow([
      "Timestamp", "Booking ID", "Room Name", "Rater Name (ชื่อผู้ประเมิน - Optional)",
      "Q1 ความสะอาด", "Q2 ที่นั่ง", "Q3 เครื่องเสียง", "Q4 อุปกรณ์", "Q5 แสง/แอร์",
      "Q6 อินเทอร์เน็ต", "Q7 ขนาดห้อง", "Q8 เจ้าหน้าที่", "Q9 การจอง", "Q10 ภาพรวม",
      "Suggestions (ข้อเสนอแนะ)", "Total Score (คะแนนรวม)"
    ]);
  }

  const scores = [];
  for (let i = 1; i <= 10; i++) {
    const score = parseInt(form["q" + i], 10);
    if (isNaN(score) || score < 1 || score > 5) throw new Error("กรุณาให้คะแนนให้ครบทุกข้อ");
    scores.push(score);
  }
  const totalScore = scores.reduce((a, b) => a + b, 0);

  sheet.appendRow([
    new Date(),
    normalizeText_(form.bookingId),
    normalizeText_(getCell_(booking, cols.roomName)),
    sanitizePlainText_(form.raterName || "Anonymous", 100),
    scores[0], scores[1], scores[2], scores[3], scores[4],
    scores[5], scores[6], scores[7], scores[8], scores[9],
    sanitizePlainText_(form.suggestion, 1000),
    totalScore
  ]);

  return "Success";
}

// --- New Helper: File Upload ---
function validateBase64Upload_(base64Data, filename) {
  const splitBase = normalizeText_(base64Data).split(',');
  if (splitBase.length !== 2) throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");

  const type = splitBase[0].split(';')[0].replace('data:', '');
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(type)) {
    throw new Error("อนุญาตเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น");
  }

  const bytes = Utilities.base64Decode(splitBase[1]);
  if (bytes.length > MAX_SETUP_FILE_SIZE_BYTES) {
    throw new Error("ไฟล์มีขนาดใหญ่เกิน 2MB");
  }

  return {
    type: type,
    bytes: bytes,
    filename: sanitizePlainText_(filename || `setup_${new Date().getTime()}`, 150)
  };
}

function uploadSetupFileToDrive(base64Data, filename) {
  if (!base64Data) return '';
  try {
    const validated = validateBase64Upload_(base64Data, filename);
    const blob = Utilities.newBlob(validated.bytes, validated.type, validated.filename);

    const folderName = "MeetingRoom_SetupFiles";
    let folders = DriveApp.getFoldersByName(folderName);
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const file = folder.createFile(blob);
    return file.getUrl();
  } catch (e) {
    console.error("File upload error: " + e.message);
    throw new Error(e.message);
  }
}

function uploadSignatureImageToDrive_(signatureBase64, bookingId) {
  const safeSignature = normalizeText_(signatureBase64);
  if (!safeSignature || !safeSignature.startsWith("data:image/png;base64,")) {
    throw new Error("ไม่พบลายเซ็นผู้จอง หรือรูปแบบลายเซ็นไม่ถูกต้อง");
  }
  if (!PDF_FOLDER_ID) {
    throw new Error("ยังไม่ได้กำหนด PDF_FOLDER_ID สำหรับจัดเก็บไฟล์ลายเซ็น");
  }

  const base64Part = safeSignature.split(',')[1];
  if (!base64Part) throw new Error("รูปแบบลายเซ็นไม่ถูกต้อง");

  const bytes = Utilities.base64Decode(base64Part);
  const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
  const fileName = `ลายเซ็น_${sanitizePlainText_(bookingId, 80)}_${Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Bangkok", "yyyyMMddHHmmss")}.png`;
  const file = folder.createFile(Utilities.newBlob(bytes, 'image/png', fileName));
  return {
    fileId: file.getId(),
    url: file.getUrl(),
    name: fileName
  };
}

function getSignatureImageBlobForMemo_(formObject) {
  const signatureBase64 = normalizeText_(formObject.signatureBase64);
  if (signatureBase64) {
    if (!signatureBase64.startsWith("data:image/png;base64,")) {
      throw new Error("รูปแบบลายเซ็นไม่ถูกต้อง");
    }
    const base64Part = signatureBase64.split(',')[1];
    if (!base64Part) throw new Error("รูปแบบลายเซ็นไม่ถูกต้อง");
    return Utilities.newBlob(Utilities.base64Decode(base64Part), 'image/png', 'signature.png');
  }

  const signatureFileId = normalizeText_(formObject.signatureFileId);
  if (signatureFileId) {
    try {
      return DriveApp.getFileById(signatureFileId).getBlob().setName('signature.png');
    } catch (e) {
      throw new Error("ไม่สามารถเปิดไฟล์ลายเซ็นเดิมเพื่อสร้าง PDF ได้: " + e.message);
    }
  }

  throw new Error("ไม่พบลายเซ็นผู้จอง จึงไม่สามารถสร้าง PDF บันทึกข้อความได้");
}

function extractDriveFileId_(url) {
  const text = normalizeText_(url);
  if (!text) return '';
  let match = text.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  match = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  match = text.match(/[-\w]{25,}/);
  return match ? match[0] : '';
}

function copyExistingMemoPdf_(bookingId, existingMemoPdfUrl) {
  const sourceFileId = extractDriveFileId_(existingMemoPdfUrl);
  if (!sourceFileId) {
    throw new Error("ไม่พบ fileId ของไฟล์ PDF เดิมในช่อง Memo PDF URL");
  }
  const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
  const sourceFile = DriveApp.getFileById(sourceFileId);
  const pdfName = `บันทึกข้อความ_${sanitizePlainText_(bookingId, 80)}_สร้างใหม่_${Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Bangkok", "yyyyMMddHHmmss")}.pdf`;
  const newFile = folder.createFile(sourceFile.getBlob().setName(pdfName));
  try {
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    console.warn("ไม่สามารถตั้งค่าแชร์ PDF เป็น anyone-with-link ได้: " + shareErr.message);
  }
  return {
    blob: newFile.getBlob().setName(pdfName),
    url: newFile.getUrl(),
    fileId: newFile.getId(),
    name: pdfName,
    method: 'COPY_EXISTING_PDF'
  };
}

// --- New Feature: ส่งผลประเมินสรุป (ตั้ง Trigger เป็นรายวัน) ---
function sendEvaluationSummary() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const evalSheet = ss.getSheetByName("Evaluate");
  if (!evalSheet) return;

  const cols = getBookingCols_(bookSheet);
  const bookings = bookSheet.getDataRange().getValues();
  const evals = evalSheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < bookings.length; i++) {
    const row = bookings[i];
    const bId = normalizeText_(getCell_(row, cols.id));
    const status = normalizeText_(getCell_(row, cols.status));
    const reqEmail = normalizeText_(getCell_(row, cols.requesterEmail));
    const endTime = new Date(getCell_(row, cols.end));
    const summarySent = normalizeText_(getCell_(row, cols.summarySent));

    if (!bId || !isBookingEligibleForEvaluation_(status) || !reqEmail || isNaN(endTime.getTime())) continue;

    const diffDaysAfterEnd = (now.getTime() - endTime.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDaysAfterEnd > 5 && !isSent_(summarySent)) {
      const bookingEvals = evals.filter(e => normalizeText_(e[1]) === bId);

      if (bookingEvals.length > 0) {
        let totalScore = 0;
        const maxScore = bookingEvals.length * 50;
        const suggestions = [];

        bookingEvals.forEach(ev => {
          totalScore += parseInt(ev[15] || 0, 10);
          if (normalizeText_(ev[14])) suggestions.push(`- ${escapeHtml_(ev[14])}`);
        });

        const avgScore = (totalScore / bookingEvals.length).toFixed(2);
        const avgPercent = ((totalScore / maxScore) * 100).toFixed(2);
        const subject = `📊 สรุปผลการประเมินความพึงพอใจ: ${normalizeText_(getCell_(row, cols.topic))}`;
        const sugHtml = suggestions.length > 0 ? suggestions.join('<br>') : 'ไม่มีผู้แสดงข้อคิดเห็นเพิ่มเติม';

        const htmlBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h2 style="color: #6610f2; text-align: center;">สรุปผลประเมินห้องประชุม</h2>
            <p>เรียน คุณ${escapeHtml_(getCell_(row, cols.requester))},</p>
            <p>ระบบขอแจ้งสรุปผลการประเมินความพึงพอใจจากการใช้งานห้องประชุม <strong>${escapeHtml_(getCell_(row, cols.roomName))}</strong> (หัวข้อ: ${escapeHtml_(getCell_(row, cols.topic))}) ดังนี้:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">ผู้ร่วมตอบแบบประเมิน:</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${bookingEvals.length} ท่าน</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;">คะแนนความพึงพอใจเฉลี่ย:</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #198754;">${avgScore} / 50 (${avgPercent}%)</td></tr>
            </table>
            <h4 style="margin-top: 20px;">ข้อเสนอแนะเพิ่มเติม:</h4>
            <div style="color: #555; font-size: 14px; background: #f9f9f9; padding: 15px; border-radius: 5px;">${sugHtml}</div>
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">ขอบคุณที่ใช้บริการ Meeting Room Booking System</p>
          </div>
        `;

        MailApp.sendEmail({ to: reqEmail, subject: subject, htmlBody: htmlBody, name: "Meeting Room System" });
      }
      bookSheet.getRange(i + 1, cols.summarySent).setValue("Sent");
    }
  }
}

// ==========================================
// 🔐 SECURITY & AUTHENTICATION (อัปเกรดความปลอดภัย SHA-256)
// ==========================================

// --- ฟังก์ชันเข้ารหัสผ่าน (SHA-256) ---
function hashPassword(password) {
  if (!password) return '';
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

// --- ฟังก์ชันเข้าสู่ระบบ (อัปเดตให้รองรับการเช็ค Hash) ---
function checkLogin(username, password) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ADMIN);
  if (!sheet) throw new Error("ไม่พบชีท Admin");

  const data = sheet.getDataRange().getValues();
  data.shift();

  const safeUsername = normalizeText_(username);
  const hashedPassword = hashPassword(password);
  const user = data.find(row => normalizeText_(row[0]) === safeUsername && normalizeText_(row[1]) === hashedPassword);

  if (user) {
    const userData = {
      username: normalizeText_(user[0]),
      name: normalizeText_(user[2]),
      role: normalizeText_(user[3]),
      email: normalizeText_(user[4])
    };
    const token = createSession_(userData);
    logAction(formatUserForLog_(userData), "Login", "เข้าสู่ระบบสำเร็จ");
    return Object.assign({}, userData, { token: token });
  }
  throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
}

// --- ฟังก์ชันบันทึกข้อมูลแบบครอบจักรวาล (อัปเดตให้เข้ารหัสผ่านอัตโนมัติเมื่อเพิ่ม/แก้แอดมิน) ---
function crudSaveRow(sheetName, rowData, rowIndex, sessionToken) {
  const user = requireUser_(sessionToken, ["Admin"]);
  const safeSheetName = assertEditableSheet_(sheetName);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(safeSheetName);
  if (!sheet) throw new Error("Sheet not found");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowNo = parseInt(rowIndex, 10) + 2;

  const rowValues = headers.map((h, index) => {
    let val = rowData[h];

    if (safeSheetName === SHEET_ADMIN && index === 1) {
      if (!val && parseInt(rowIndex, 10) === -1) {
        throw new Error("กรุณากำหนดรหัสผ่านสำหรับบัญชีใหม่");
      }
      if (!val && parseInt(rowIndex, 10) >= 0) {
        return sheet.getRange(rowNo, index + 1).getValue(); // เว้นว่าง = คงรหัสเดิม
      }
      if (val && val.toString().length !== 64) {
        val = hashPassword(val.toString());
      }
    }

    if (safeSheetName === SHEET_ROOMS && index === 3) {
      const capacity = parseInt(val, 10);
      if (isNaN(capacity) || capacity < 1) throw new Error("Capacity ต้องเป็นตัวเลขมากกว่า 0");
      val = capacity;
    }

    return sanitizePlainText_(val, 1000);
  });

  if (safeSheetName === SHEET_ADMIN) {
    const roleIndex = headers.findIndex(h => normalizeText_(h).toLowerCase() === "role");
    const newRole = roleIndex >= 0 ? normalizeText_(rowValues[roleIndex]) : "";
    if (!["Admin", "Officer"].includes(newRole)) throw new Error("Role ต้องเป็น Admin หรือ Officer เท่านั้น");

    if (parseInt(rowIndex, 10) >= 0) {
      const values = sheet.getDataRange().getValues();
      const adminCount = values.slice(1).filter(row => normalizeText_(row[3]) === "Admin").length;
      const currentRole = normalizeText_(sheet.getRange(rowNo, 4).getValue());
      if (currentRole === "Admin" && newRole !== "Admin" && adminCount <= 1) {
        throw new Error("ไม่สามารถลดสิทธิ์ผู้ดูแลระบบคนสุดท้ายได้");
      }
    }
  }

  if (parseInt(rowIndex, 10) === -1) {
    sheet.appendRow(rowValues);
    logAction(formatUserForLog_(user), "CRUD Add", `เพิ่มข้อมูลในชีท ${safeSheetName}`);
  } else {
    if (rowNo < 2 || rowNo > sheet.getLastRow()) throw new Error("ตำแหน่งแถวไม่ถูกต้อง");
    sheet.getRange(rowNo, 1, 1, rowValues.length).setValues([rowValues]);
    logAction(formatUserForLog_(user), "CRUD Edit", `แก้ไขข้อมูลในชีท ${safeSheetName} แถวที่ ${rowNo}`);
  }
  return "Success";
}

// --- ฟังก์ชันเครื่องมือ: สำหรับแปลงรหัสผ่านเดิมทั้งหมดให้เป็น Hash (ใช้รันแค่ครั้งเดียว) ---
function convertExistingPasswordsToHash() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ADMIN);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  
  // เริ่มลูปที่แถว 2 (Index 1) เพื่อข้าม Header
  for (let i = 1; i < data.length; i++) {
    let currentPassword = data[i][1]; // คอลัมน์ B (รหัสผ่าน)
    
    // หากมีรหัสผ่าน และความยาวยังไม่ใช่ 64 (หมายถึงยังเป็นข้อความธรรมดา) ให้ทำการเข้ารหัสและเขียนทับลงไป
    if (currentPassword && currentPassword.toString().length !== 64) {
      let newHashedPassword = hashPassword(currentPassword.toString());
      sheet.getRange(i + 1, 2).setValue(newHashedPassword);
    }
  }
  console.log("เข้ารหัสผ่านในฐานข้อมูลเสร็จสมบูรณ์แล้ว!");
}

function saveBooking(formObject, sessionToken) {
  ensureDatabaseSchema_();
  const lock = LockService.getScriptLock();
  let memoPdfFileIdForRollback = "";
  let signatureFileIdForRollback = "";
  let databaseWritten = false;
  try {
    if (!lock.tryLock(10000)) throw new Error("ขณะนี้มีผู้ใช้งานระบบจำนวนมาก กรุณาลองใหม่อีกครั้ง");

    const isEdit = formObject.isEdit === true || formObject.isEdit === "true";
    const sessionUser = getSession_(sessionToken);
    if (isEdit && !sessionUser) {
      throw new Error("SESSION_EXPIRED: การแก้ไขรายการจองต้องเข้าสู่ระบบเจ้าหน้าที่ก่อน");
    }
    const currentUser = sessionUser ? formatUserForLog_(sessionUser) : "Guest";

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
    if (!bookSheet) throw new Error("ไม่พบชีท Bookings");
    const cols = getBookingCols_(bookSheet);

    const room = getRoomById_(formObject.roomId);
    if (!room) throw new Error("ไม่พบห้องประชุม หรือห้องนี้ไม่ได้เปิดให้จอง");

    const topic = sanitizePlainText_(formObject.topic, 300);
    const requester = sanitizePlainText_(formObject.requester, 150);
    const requesterEmail = normalizeText_(formObject.requesterEmail);
    const setupDetails = sanitizePlainText_(formObject.setupDetails, 1000);
    const headcount = parseInt(formObject.headcount, 10);
    const signatureBase64 = normalizeText_(formObject.signatureBase64);

    if (!topic) throw new Error("กรุณาระบุหัวข้อการประชุม");
    if (!requester) throw new Error("กรุณาระบุชื่อผู้จอง");
    if (!isValidEmail_(requesterEmail)) throw new Error("รูปแบบอีเมลผู้จองไม่ถูกต้อง");
    if (isNaN(headcount) || headcount < 1) throw new Error("จำนวนผู้เข้าประชุมต้องเป็นตัวเลขมากกว่า 0");
    if (room.capacity > 0 && headcount > room.capacity) {
      throw new Error(`จำนวนผู้เข้าประชุม (${headcount} คน) เกินความจุของห้อง ${room.roomName} (${room.capacity} คน)`);
    }
    if (!signatureBase64 || !signatureBase64.startsWith("data:image/png;base64,")) {
      throw new Error("ไม่พบลายเซ็นผู้จอง หรือรูปแบบลายเซ็นไม่ถูกต้อง จึงไม่สามารถสร้างบันทึกข้อความได้");
    }

    const newStart = new Date(formObject.startTime);
    const newEnd = new Date(formObject.endTime);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) throw new Error("รูปแบบวันเวลาไม่ถูกต้อง");
    if (newEnd <= newStart) throw new Error("เวลาสิ้นสุดการประชุมต้องอยู่หลังเวลาเริ่มต้น");

    const now = new Date();
    if (!isEdit && newStart.getTime() < now.getTime() - (5 * 60 * 1000)) {
      throw new Error("ไม่สามารถจองย้อนหลังได้");
    }

    const bookingIdForEdit = normalizeText_(formObject.bookingId);
    const existingBookings = bookSheet.getDataRange().getValues();
    let existingRowIndex = -1;
    let existingLayoutUrl = "";

    for (let i = 1; i < existingBookings.length; i++) {
      const row = existingBookings[i];
      const bId = normalizeText_(getCell_(row, cols.id));
      if (isEdit && bId === bookingIdForEdit) {
        existingRowIndex = i + 1;
        existingLayoutUrl = normalizeText_(getCell_(row, cols.layoutUrl));
      }

      const existingRoomId = normalizeText_(getCell_(row, cols.roomId));
      const existingStart = new Date(getCell_(row, cols.start));
      const existingEnd = new Date(getCell_(row, cols.end));
      const status = normalizeText_(getCell_(row, cols.status));

      if (!bId || isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) continue;

      if (existingRoomId === room.roomId && isBookingBlockingRoom_(status) && bId !== bookingIdForEdit) {
        if (newStart.getTime() < existingEnd.getTime() && newEnd.getTime() > existingStart.getTime()) {
          throw new Error(`ห้องไม่ว่างในช่วงเวลาดังกล่าว (ชนกับรายการ: ${normalizeText_(getCell_(row, cols.topic))} เวลา ${existingStart.toLocaleTimeString('th-TH',{hour:'2-digit', minute:'2-digit'})} - ${existingEnd.toLocaleTimeString('th-TH',{hour:'2-digit', minute:'2-digit'})})`);
        }
      }
    }

    if (isEdit && existingRowIndex === -1) throw new Error("ไม่พบรายการจองที่ต้องการแก้ไข");
    if (room.requireSetup && !formObject.setupFileBase64 && !existingLayoutUrl) {
      throw new Error("ห้องนี้กำหนดให้แนบไฟล์รูปแบบการจัดโต๊ะหรืออุปกรณ์เพิ่มเติม");
    }

    const timeDiff = newStart.getTime() - now.getTime();
    const reminderStatus = ""; // จะถูกตั้งเป็น Sent เฉพาะเมื่อ trigger ส่งแจ้งเตือนด่วนจริงแล้วเท่านั้น

    let fileUrl = "";
    let layoutBlob = null;
    if (formObject.setupFileBase64) {
      validateBase64Upload_(formObject.setupFileBase64, formObject.setupFileName);
      const splitBase = formObject.setupFileBase64.split(',');
      const type = splitBase[0].split(';')[0].replace('data:', '');
      const byteCharacters = Utilities.base64Decode(splitBase[1]);
      layoutBlob = Utilities.newBlob(byteCharacters, type, sanitizePlainText_(formObject.setupFileName || "layout", 150));
    }

    const bookingId = isEdit ? bookingIdForEdit : generateBookingId_(bookSheet, cols);

    // เก็บไฟล์ลายเซ็นไว้ใน Drive เพื่อให้ Admin สามารถสร้าง PDF บันทึกข้อความใหม่จากเลขที่การจองได้ภายหลัง
    const signatureResult = uploadSignatureImageToDrive_(signatureBase64, bookingId);
    signatureFileIdForRollback = signatureResult.fileId || "";

    const normalizedForm = Object.assign({}, formObject, {
      topic: topic,
      requester: requester,
      requesterEmail: requesterEmail,
      headcount: headcount,
      roomId: room.roomId,
      roomName: room.roomName,
      setupDetails: setupDetails,
      signatureBase64: signatureBase64,
      signatureFileId: signatureResult.fileId
    });

    // บันทึกข้อความเป็นเอกสารหลักของกระบวนการจอง จึงต้องสร้างให้สำเร็จก่อนเขียนฐานข้อมูล
    // หากสร้างไม่สำเร็จ ระบบจะหยุดทันที ไม่แจ้งสำเร็จหลอก และไม่บันทึกรายการจองใหม่ที่เอกสารไม่ครบ
    const memoResult = generatePDFMemo(normalizedForm, bookingId, newStart, newEnd);
    if (!memoResult || !memoResult.blob || !memoResult.url) {
      throw new Error("ไม่สามารถสร้างไฟล์ PDF บันทึกข้อความได้ กรุณาตรวจสอบ Template Slide, โฟลเดอร์ PDF และสิทธิ์การเข้าถึง Drive");
    }
    memoPdfFileIdForRollback = memoResult.fileId || "";

    if (formObject.setupFileBase64) {
      fileUrl = uploadSetupFileToDrive(formObject.setupFileBase64, formObject.setupFileName);
    }

    const fmtOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' };

    if (isEdit) {
      bookSheet.getRange(existingRowIndex, cols.roomId).setValue(room.roomId);
      bookSheet.getRange(existingRowIndex, cols.roomName).setValue(room.roomName);
      bookSheet.getRange(existingRowIndex, cols.topic).setValue(topic);
      bookSheet.getRange(existingRowIndex, cols.requester).setValue(requester);
      bookSheet.getRange(existingRowIndex, cols.start).setValue(newStart);
      bookSheet.getRange(existingRowIndex, cols.end).setValue(newEnd);
      bookSheet.getRange(existingRowIndex, cols.headcount).setValue(headcount);
      bookSheet.getRange(existingRowIndex, cols.requesterEmail).setValue(requesterEmail);
      bookSheet.getRange(existingRowIndex, cols.reminder30).setValue(reminderStatus);
      bookSheet.getRange(existingRowIndex, cols.setupDetails).setValue(setupDetails);
      bookSheet.getRange(existingRowIndex, cols.lastUpdated).setValue(new Date());
      bookSheet.getRange(existingRowIndex, cols.memoPdfUrl).setValue(memoResult.url);
      bookSheet.getRange(existingRowIndex, cols.signatureFileId).setValue(signatureResult.fileId);
      bookSheet.getRange(existingRowIndex, cols.signatureImageUrl).setValue(signatureResult.url);
      if (fileUrl) bookSheet.getRange(existingRowIndex, cols.layoutUrl).setValue(fileUrl);
      setBookingStatusByRow_(bookSheet, cols, existingRowIndex, BOOKING_STATUS.PENDING_APPROVAL, "แก้ไขรายการและเริ่มกระบวนการลงนามใหม่");
      if (cols.evalSent) bookSheet.getRange(existingRowIndex, cols.evalSent).setValue('');
      if (cols.summarySent) bookSheet.getRange(existingRowIndex, cols.summarySent).setValue('');
      databaseWritten = true;

      logAction(currentUser, "Update Booking", `แก้ไขการจอง ID: ${bookingIdForEdit} และสร้าง PDF บันทึกข้อความ: ${memoResult.url}`);

      const notificationReport = sendEmailNotifications({
        bookingId: bookingIdForEdit,
        topic: topic,
        requester: requester,
        requesterEmail: requesterEmail,
        roomName: room.roomName,
        roomId: room.roomId,
        startStr: newStart.toLocaleString('th-TH', fmtOptions),
        endStr: newEnd.toLocaleString('th-TH', fmtOptions),
        headcount: headcount,
        isUpdate: true,
        memoPdfUrl: memoResult.url,
        memoPdfFileId: memoResult.fileId,
        memoPdfName: memoResult.name
      }, memoResult.blob, layoutBlob);

      const approvalReport = startApprovalWorkflowSafely_(bookingIdForEdit, currentUser, "UPDATE_BOOKING");
      const approvalWarning = approvalReport.created ? "" : " ระบบรับการจองและกันห้องไว้แล้ว แต่กระบวนการลงนามมีปัญหา ระบบตั้งสถานะเป็น Approval Error กรุณาให้ผู้ดูแลระบบตรวจสอบ";

      return {
        status: "Updated",
        bookingId: bookingIdForEdit,
        memoPdfUrl: memoResult.url,
        notificationReport: notificationReport,
        approvalReport: approvalReport,
        emailWarning: (notificationReport.adminSent ? "" : "บันทึกข้อมูลและสร้าง PDF สำเร็จแล้ว แต่ส่งอีเมลแนบ PDF ถึงรายชื่อในชีท Admin ไม่สำเร็จ กรุณาตรวจสอบชีท Logs") + approvalWarning
      };
    }

    const timestamp = new Date();
    bookSheet.appendRow([
      bookingId,
      timestamp,
      room.roomId,
      room.roomName,
      topic,
      requester,
      newStart,
      newEnd,
      headcount,
      BOOKING_STATUS.PENDING_APPROVAL,
      requesterEmail,
      '',
      reminderStatus,
      setupDetails,
      fileUrl,
      '',
      '',
      '',
      memoResult.url,
      signatureResult.fileId,
      signatureResult.url
    ]);

    databaseWritten = true;

    logAction(currentUser, 'New Booking', `จองห้อง ${room.roomName} โดย ${requester} และสร้าง PDF บันทึกข้อความ: ${memoResult.url}`);

    const notificationReport = sendEmailNotifications({
      bookingId: bookingId,
      topic: topic,
      requester: requester,
      requesterEmail: requesterEmail,
      roomName: room.roomName,
      roomId: room.roomId,
      startStr: newStart.toLocaleString('th-TH', fmtOptions),
      endStr: newEnd.toLocaleString('th-TH', fmtOptions),
      headcount: headcount,
      isUpdate: false,
      memoPdfUrl: memoResult.url,
      memoPdfFileId: memoResult.fileId,
      memoPdfName: memoResult.name
    }, memoResult.blob, layoutBlob);

    const approvalReport = startApprovalWorkflowSafely_(bookingId, currentUser, "NEW_BOOKING");
    const approvalWarning = approvalReport.created ? "" : " ระบบรับการจองและกันห้องไว้แล้ว แต่กระบวนการลงนามมีปัญหา ระบบตั้งสถานะเป็น Approval Error กรุณาให้ผู้ดูแลระบบตรวจสอบ";

    return {
      status: "Saved",
      bookingId: bookingId,
      memoPdfUrl: memoResult.url,
      notificationReport: notificationReport,
      approvalReport: approvalReport,
      emailWarning: (notificationReport.adminSent ? "" : "บันทึกข้อมูลและสร้าง PDF สำเร็จแล้ว แต่ส่งอีเมลแนบ PDF ถึงรายชื่อในชีท Admin ไม่สำเร็จ กรุณาตรวจสอบชีท Logs") + approvalWarning
    };
  } catch (error) {
    // หากสร้าง PDF แล้วแต่เกิดปัญหาก่อนบันทึกฐานข้อมูล ให้ย้าย PDF ที่สร้างค้างไว้ลงถังขยะเพื่อลดไฟล์กำพร้า
    if (memoPdfFileIdForRollback && !databaseWritten) {
      try { DriveApp.getFileById(memoPdfFileIdForRollback).setTrashed(true); } catch (cleanupErr) {}
    }
    if (signatureFileIdForRollback && !databaseWritten) {
      try { DriveApp.getFileById(signatureFileIdForRollback).setTrashed(true); } catch (cleanupErr) {}
    }
    throw new Error(error.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// 🚀 [ปรับปรุงใหม่] เพิ่มพารามิเตอร์ที่ 3 (layoutBlob) เพื่อรับไฟล์ผังการจัดโต๊ะมาแนบอีเมล
function extractEmailList_(value) {
  return normalizeText_(value)
    .split(/[;,\s]+/)
    .map(e => e.trim())
    .filter(e => isValidEmail_(e));
}

function uniqueEmailList_(emails) {
  const seen = {};
  const output = [];
  (emails || []).forEach(email => {
    extractEmailList_(email).forEach(clean => {
      const key = clean.toLowerCase();
      if (!seen[key]) {
        seen[key] = true;
        output.push(clean);
      }
    });
  });
  return output;
}

function getAdminNotificationRecipients_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const adminSheet = ss.getSheetByName(SHEET_ADMIN);
  if (!adminSheet || adminSheet.getLastRow() < 2) {
    return { to: '', cc: '', all: [], adminEmails: [], ccEmails: [], sourceRows: 0 };
  }

  const values = adminSheet.getDataRange().getValues();
  const headers = values[0].map(h => normalizeText_(h).toLowerCase());
  const roleIndex = headers.indexOf('role') >= 0 ? headers.indexOf('role') : 3;
  const emailIndex = headers.indexOf('email') >= 0 ? headers.indexOf('email') : 4;

  const adminEmails = [];
  const otherEmails = [];

  values.slice(1).forEach(row => {
    const role = normalizeText_(row[roleIndex]).toLowerCase();
    const emails = extractEmailList_(row[emailIndex]);
    if (emails.length === 0) return;

    const isMainAdmin = role === 'admin' || role.includes('admin') || role.includes('ผู้ดูแล') || role.includes('ธุรการ');
    if (isMainAdmin) {
      adminEmails.push(...emails);
    } else {
      otherEmails.push(...emails);
    }
  });

  let toList = uniqueEmailList_(adminEmails);
  let ccList = uniqueEmailList_(otherEmails);

  // ถ้าไม่มีแถว Role=Admin จริง ๆ ให้ใช้รายชื่ออีเมลแรกในชีท Admin เป็น To และที่เหลือเป็น Cc
  // เพื่อป้องกันระบบเงียบหายจากการสะกด Role ไม่ตรง เช่น admin / ADMIN / เว้นวรรค / ข้อความไทย
  if (toList.length === 0) {
    const allFromSheet = uniqueEmailList_(values.slice(1).flatMap(row => extractEmailList_(row[emailIndex])));
    if (allFromSheet.length > 0) {
      toList = [allFromSheet[0]];
      ccList = allFromSheet.slice(1);
    }
  }

  const toLookup = {};
  toList.forEach(email => toLookup[email.toLowerCase()] = true);
  ccList = uniqueEmailList_(ccList).filter(email => !toLookup[email.toLowerCase()]);

  return {
    to: toList.join(','),
    cc: ccList.join(','),
    all: uniqueEmailList_(toList.concat(ccList)),
    adminEmails: toList,
    ccEmails: ccList,
    sourceRows: Math.max(values.length - 1, 0)
  };
}

function getOfficerRecipientsForRoom_(roomId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const officerSheet = ss.getSheetByName(SHEET_OFFICERS);
  if (!officerSheet || officerSheet.getLastRow() < 2) return { to: '', cc: '', names: [] };

  const safeRoomId = normalizeText_(roomId);
  const rows = officerSheet.getDataRange().getValues().slice(1);
  const emails = [];
  const names = [];

  rows.forEach(row => {
    const name = normalizeText_(row[0]);
    const assignedRooms = normalizeText_(row[2]).split(',').map(r => r.trim()).filter(Boolean);
    if (!assignedRooms.includes(safeRoomId)) return;

    const rowEmails = extractEmailList_(row[1]);
    rowEmails.forEach(email => emails.push(email));
    if (name) names.push(name);
  });

  const uniqueEmails = uniqueEmailList_(emails);
  return {
    to: uniqueEmails.length > 0 ? uniqueEmails[0] : '',
    cc: uniqueEmails.length > 1 ? uniqueEmails.slice(1).join(',') : '',
    names: names
  };
}

function getMemoPdfBlobForEmail_(data, fallbackBlob) {
  const pdfName = sanitizePlainText_(data.memoPdfName || `บันทึกข้อความ_${data.bookingId}.pdf`, 150) || `บันทึกข้อความ_${data.bookingId}.pdf`;

  if (data.memoPdfFileId) {
    try {
      return DriveApp.getFileById(data.memoPdfFileId).getBlob().setName(pdfName);
    } catch (e) {
      logAction('System', 'Memo PDF Blob Fallback', `เปิด PDF จาก fileId ไม่สำเร็จ Booking ID: ${data.bookingId} | ${e.message}`);
    }
  }

  if (fallbackBlob) {
    try {
      return fallbackBlob.setName(pdfName);
    } catch (e) {
      throw new Error('เตรียมไฟล์แนบ PDF ไม่สำเร็จ: ' + e.message);
    }
  }

  throw new Error('ไม่พบไฟล์ PDF สำหรับแนบอีเมล Admin');
}

function sendAdminMemoEmail_(data, pdfBlob, layoutBlob) {
  const adminRecipients = getAdminNotificationRecipients_();
  if (!adminRecipients.to) {
    throw new Error(`ไม่พบอีเมลผู้รับในชีท ${SHEET_ADMIN}`);
  }

  const isUpdate = data.isUpdate || false;
  const subjectAdminPrefix = isUpdate ? 'เอกสารคำขอแก้ไขการจอง' : 'เอกสารคำขอจองห้องประชุมใหม่';
  const memoBlob = getMemoPdfBlobForEmail_(data, pdfBlob);

  const attachments = [memoBlob];
  if (layoutBlob) attachments.push(layoutBlob);

  const mailOptionsAdmin = {
    to: adminRecipients.to,
    subject: `[${subjectAdminPrefix}] ${data.roomName}: ${data.topic}`,
    htmlBody: createEmailTemplate(data, 'admin', 'ทีมผู้ดูแลระบบ'),
    name: 'Meeting Room System',
    attachments: attachments
  };
  if (adminRecipients.cc) mailOptionsAdmin.cc = adminRecipients.cc;

  MailApp.sendEmail(mailOptionsAdmin);

  logAction('System', 'Admin Memo Email Sent', `Booking ID: ${data.bookingId} | To: ${adminRecipients.to}${adminRecipients.cc ? ' | Cc: ' + adminRecipients.cc : ''} | Attachments: ${attachments.length}`);
  return adminRecipients;
}

function sendEmailNotifications(data, pdfBlob = null, layoutBlob = null) {
  const isUpdate = data.isUpdate || false;
  const subjectUserPrefix = isUpdate ? '✏️ แก้ไขการจองห้องประชุม' : '✅ ยืนยันการจองห้องประชุม';
  const subjectOfficerPrefix = isUpdate ? '📝 มีการแก้ไขการจอง' : '📢 มีการจองห้องใหม่';

  const report = {
    adminSent: false,
    requesterSent: false,
    officerSent: false,
    adminTo: '',
    adminCc: '',
    officerTo: '',
    officerCc: '',
    errors: []
  };

  // 1) Admin sheet ต้องได้อีเมลแนบ PDF ก่อนเสมอ และต้องเป็นอีเมลฉบับเดียวเท่านั้น
  // To = แถว Role Admin ในชีท Admin, Cc = รายชื่ออื่นในชีท Admin
  try {
    const adminRecipients = sendAdminMemoEmail_(data, pdfBlob, layoutBlob);
    report.adminSent = true;
    report.adminTo = adminRecipients.to;
    report.adminCc = adminRecipients.cc;
  } catch (adminErr) {
    report.errors.push('Admin memo email: ' + adminErr.message);
    logAction('System', 'Admin Memo Email Error', `Booking ID: ${data.bookingId} | ${adminErr.message}`);
  }

  // 2) ผู้จอง: ส่งอีเมลยืนยัน/แจ้งแก้ไขเท่านั้น ไม่แนบบันทึกข้อความ
  if (isValidEmail_(data.requesterEmail)) {
    try {
      MailApp.sendEmail({
        to: data.requesterEmail,
        subject: `${subjectUserPrefix}: ${data.topic}`,
        htmlBody: createEmailTemplate(data, 'user'),
        name: 'Meeting Room System'
      });
      report.requesterSent = true;
    } catch (userErr) {
      report.errors.push('Requester email: ' + userErr.message);
      logAction('System', 'Requester Email Error', `Booking ID: ${data.bookingId} | ${userErr.message}`);
    }
  }

  // 3) Officers: แจ้งเฉพาะผู้รับผิดชอบห้องนั้น ๆ และไม่แนบไฟล์ PDF/ผังการจัดโต๊ะ
  const officerRecipients = getOfficerRecipientsForRoom_(data.roomId);
  if (officerRecipients.to) {
    try {
      const mailOptionsOfficer = {
        to: officerRecipients.to,
        subject: `${subjectOfficerPrefix}: ${data.roomName} (${data.topic})`,
        htmlBody: createEmailTemplate(data, 'officer', 'เจ้าหน้าที่ผู้รับผิดชอบห้องประชุม'),
        name: 'Meeting Room System'
      };
      if (officerRecipients.cc) mailOptionsOfficer.cc = officerRecipients.cc;
      MailApp.sendEmail(mailOptionsOfficer);
      report.officerSent = true;
      report.officerTo = officerRecipients.to;
      report.officerCc = officerRecipients.cc;
    } catch (officerErr) {
      report.errors.push('Officer email: ' + officerErr.message);
      logAction('System', 'Officer Email Error', `Booking ID: ${data.bookingId} | ${officerErr.message}`);
    }
  }

  return report;
}

function buildCancellationEmailHtml_(data, recipientType) {
  const safe = {
    bookingId: escapeHtml_(data.bookingId),
    roomName: escapeHtml_(data.roomName),
    topic: escapeHtml_(data.topic),
    requester: escapeHtml_(data.requester),
    headcount: escapeHtml_(data.headcount),
    reason: escapeHtml_(data.cancelReason),
    cancelledBy: escapeHtml_(data.cancelledBy),
    startStr: escapeHtml_(new Date(data.start).toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })),
    endStr: escapeHtml_(new Date(data.end).toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }))
  };

  const intro = recipientType === 'user'
    ? `เรียน ${safe.requester},<br>รายการจองห้องประชุมของท่านถูกยกเลิกแล้ว รายละเอียดดังนี้:`
    : `เรียนเจ้าหน้าที่ผู้รับผิดชอบห้องประชุม,<br>มีรายการจองห้องประชุมภายใต้การดูแลของท่านถูกยกเลิกแล้ว รายละเอียดดังนี้:`;

  const contentHtml = `
    <p style="font-size: 16px; color: #333; line-height: 1.7;">${intro}</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color:#666; width:32%;"><strong>รหัสการจอง:</strong></td><td style="padding: 10px;">${safe.bookingId}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color:#666;"><strong>หัวข้อ:</strong></td><td style="padding: 10px; font-weight:bold;">${safe.topic}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color:#666;"><strong>ห้องประชุม:</strong></td><td style="padding: 10px;">${safe.roomName}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color:#666;"><strong>ผู้จอง:</strong></td><td style="padding: 10px;">${safe.requester} (${safe.headcount} ท่าน)</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color:#666;"><strong>เวลาเริ่ม:</strong></td><td style="padding: 10px; color:#198754;">${safe.startStr}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color:#666;"><strong>เวลาสิ้นสุด:</strong></td><td style="padding: 10px; color:#dc3545;">${safe.endStr}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color:#666;"><strong>เหตุผลการยกเลิก:</strong></td><td style="padding: 10px; color:#dc3545; font-weight:bold;">${safe.reason}</td></tr>
      <tr><td style="padding: 10px; color:#666;"><strong>ผู้ดำเนินการยกเลิก:</strong></td><td style="padding: 10px;">${safe.cancelledBy}</td></tr>
    </table>
    <div style="margin-top: 25px; text-align:center; font-size: 12px; color:#999;">ระบบจองห้องประชุมอัตโนมัติ (Meeting Room Booking System)</div>
  `;

  return createBaseEmailTemplate('แจ้งยกเลิกการจองห้องประชุม', contentHtml, EMAIL_THEME.danger);
}

function sendCancellationNotifications_(data) {
  const subject = `❌ แจ้งยกเลิกการจองห้องประชุม: ${data.topic}`;

  if (isValidEmail_(data.requesterEmail)) {
    MailApp.sendEmail({
      to: data.requesterEmail,
      subject: subject,
      htmlBody: buildCancellationEmailHtml_(data, 'user'),
      name: "Meeting Room System"
    });
  }

  const officerRecipients = getOfficerRecipientsForRoom_(data.roomId);
  if (officerRecipients.to) {
    const mailOptionsOfficer = {
      to: officerRecipients.to,
      subject: subject,
      htmlBody: buildCancellationEmailHtml_(data, 'officer'),
      name: "Meeting Room System"
    };
    if (officerRecipients.cc) mailOptionsOfficer.cc = officerRecipients.cc;
    MailApp.sendEmail(mailOptionsOfficer);
  }
}



// --- Staff Dashboard ---
function getDashboardData(sessionToken) {
  ensureDatabaseSchema_();
  requireUser_(sessionToken, ["Admin", "Officer"]);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const evalSheet = ss.getSheetByName("Evaluate");
  const rooms = getActiveRooms_();
  const roomMap = {};
  rooms.forEach(room => roomMap[room.roomId] = room);

  const cols = getBookingCols_(bookSheet);
  const rows = bookSheet.getDataRange().getValues().slice(1).filter(row => normalizeText_(getCell_(row, cols.id)));
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const activeRows = rows.filter(row => isBookingBlockingRoom_(getCell_(row, cols.status)));
  const approvedRows = rows.filter(row => normalizeBookingStatus_(getCell_(row, cols.status)) === BOOKING_STATUS.APPROVED);
  const pendingApprovalRows = rows.filter(row => normalizeBookingStatus_(getCell_(row, cols.status)) === BOOKING_STATUS.PENDING_APPROVAL);
  const approvalErrorRows = rows.filter(row => normalizeBookingStatus_(getCell_(row, cols.status)) === BOOKING_STATUS.APPROVAL_ERROR);
  const cancelledRows = rows.filter(row => normalizeBookingStatus_(getCell_(row, cols.status)) === BOOKING_STATUS.CANCELLED);
  const rejectedRows = rows.filter(row => normalizeBookingStatus_(getCell_(row, cols.status)) === BOOKING_STATUS.REJECTED);
  const todayRows = activeRows.filter(row => {
    const start = new Date(getCell_(row, cols.start));
    return !isNaN(start.getTime()) && start >= todayStart && start < todayEnd;
  });
  const upcomingRows = activeRows.filter(row => {
    const start = new Date(getCell_(row, cols.start));
    return !isNaN(start.getTime()) && start >= now;
  });
  const waitingEvalRows = approvedRows.filter(row => {
    const end = new Date(getCell_(row, cols.end));
    return !isNaN(end.getTime()) && end < now && !isSent_(getCell_(row, cols.evalSent));
  });

  const usageByRoom = {};
  rooms.forEach(room => {
    usageByRoom[room.roomId] = {
      roomId: room.roomId,
      roomName: room.roomName,
      count: 0,
      hours: 0
    };
  });

  activeRows.forEach(row => {
    const roomId = normalizeText_(getCell_(row, cols.roomId));
    const start = new Date(getCell_(row, cols.start));
    const end = new Date(getCell_(row, cols.end));
    if (!usageByRoom[roomId]) {
      usageByRoom[roomId] = {
        roomId: roomId,
        roomName: normalizeText_(getCell_(row, cols.roomName)),
        count: 0,
        hours: 0
      };
    }
    usageByRoom[roomId].count += 1;
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
      usageByRoom[roomId].hours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
  });

  let evalCount = 0;
  let evalTotal = 0;
  if (evalSheet && evalSheet.getLastRow() > 1) {
    const evalRows = evalSheet.getDataRange().getValues().slice(1);
    evalRows.forEach(row => {
      const total = parseInt(row[15], 10);
      if (!isNaN(total)) {
        evalCount += 1;
        evalTotal += total;
      }
    });
  }

  return {
    generatedAt: new Date().toLocaleString('th-TH'),
    totalBookings: rows.length,
    activeBookings: activeRows.length,
    approvedBookings: approvedRows.length,
    pendingApprovalBookings: pendingApprovalRows.length,
    approvalErrorBookings: approvalErrorRows.length,
    cancelledBookings: cancelledRows.length,
    rejectedBookings: rejectedRows.length,
    todayBookings: todayRows.length,
    upcomingBookings: upcomingRows.length,
    waitingEvaluation: waitingEvalRows.length,
    averageEvaluationScore: evalCount > 0 ? (evalTotal / evalCount).toFixed(2) : "-",
    usageByRoom: Object.keys(usageByRoom).map(key => ({
      roomId: usageByRoom[key].roomId,
      roomName: usageByRoom[key].roomName,
      count: usageByRoom[key].count,
      hours: usageByRoom[key].hours.toFixed(2)
    })).sort((a, b) => b.count - a.count),
    nextBookings: upcomingRows
      .sort((a, b) => new Date(getCell_(a, cols.start)) - new Date(getCell_(b, cols.start)))
      .slice(0, 5)
      .map(row => ({
        bookingId: normalizeText_(getCell_(row, cols.id)),
        roomName: normalizeText_(getCell_(row, cols.roomName)),
        topic: normalizeText_(getCell_(row, cols.topic)),
        requester: normalizeText_(getCell_(row, cols.requester)),
        status: normalizeBookingStatus_(getCell_(row, cols.status)),
        statusLabel: getBookingStatusLabel_(getCell_(row, cols.status)),
        start: new Date(getCell_(row, cols.start)).toLocaleString('th-TH'),
        end: new Date(getCell_(row, cols.end)).toLocaleString('th-TH')
      }))
  };
}

// ==========================================
// 🧾 ADMIN: MANUAL MEMO PDF GENERATION
// ==========================================

function getBookingOptionsForMemo(sessionToken) {
  ensureDatabaseSchema_();
  requireUser_(sessionToken, ['Admin']);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_BOOKINGS);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const cols = getBookingCols_(sheet);
  const rows = sheet.getDataRange().getValues().slice(1);

  return rows
    .filter(row => normalizeText_(getCell_(row, cols.id)))
    .map(row => {
      const bookingId = normalizeText_(getCell_(row, cols.id));
      const roomName = normalizeText_(getCell_(row, cols.roomName));
      const topic = normalizeText_(getCell_(row, cols.topic));
      const requester = normalizeText_(getCell_(row, cols.requester));
      const status = normalizeBookingStatus_(getCell_(row, cols.status));
      const startValue = getCell_(row, cols.start);
      const startDate = new Date(startValue);
      const startStr = isNaN(startDate.getTime()) ? normalizeText_(startValue) : startDate.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
      const hasSignature = !!normalizeText_(getCell_(row, cols.signatureFileId));
      const hasMemoPdf = !!normalizeText_(getCell_(row, cols.memoPdfUrl));
      return {
        bookingId: bookingId,
        label: `${bookingId} | ${startStr} | ${roomName} | ${topic} | ${requester} | ${getBookingStatusLabel_(status)}`,
        status: status,
        statusLabel: getBookingStatusLabel_(status),
        roomName: roomName,
        topic: topic,
        requester: requester,
        startStr: startStr,
        hasSignature: hasSignature,
        hasMemoPdf: hasMemoPdf
      };
    })
    .sort((a, b) => b.bookingId.localeCompare(a.bookingId));
}

function findBookingRowById_(bookSheet, cols, bookingId) {
  const safeBookingId = normalizeText_(bookingId);
  if (!safeBookingId) throw new Error('กรุณาเลือกเลขที่การจอง');

  const data = bookSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeText_(getCell_(data[i], cols.id)) === safeBookingId) {
      return { rowNo: i + 1, row: data[i] };
    }
  }
  throw new Error('ไม่พบเลขที่การจองที่เลือก');
}

function adminGenerateMemoPdf(bookingId, sessionToken) {
  ensureDatabaseSchema_();
  const user = requireUser_(sessionToken, ['Admin']);
  const currentUser = formatUserForLog_(user);

  const lock = LockService.getScriptLock();
  let memoPdfFileIdForRollback = '';
  let databaseWritten = false;

  try {
    if (!lock.tryLock(10000)) throw new Error('ขณะนี้มีผู้ใช้งานระบบจำนวนมาก กรุณาลองใหม่อีกครั้ง');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
    if (!bookSheet) throw new Error('ไม่พบชีท Bookings');

    const cols = getBookingCols_(bookSheet);
    const found = findBookingRowById_(bookSheet, cols, bookingId);
    const row = found.row;
    const rowNo = found.rowNo;

    const safeBookingId = normalizeText_(getCell_(row, cols.id));
    const startDate = new Date(getCell_(row, cols.start));
    const endDate = new Date(getCell_(row, cols.end));
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('ข้อมูลวันเวลาในรายการจองไม่ถูกต้อง จึงไม่สามารถสร้าง PDF ได้');
    }

    const signatureFileId = normalizeText_(getCell_(row, cols.signatureFileId));
    const existingMemoPdfUrl = normalizeText_(getCell_(row, cols.memoPdfUrl));

    let memoResult = null;
    let method = 'REGENERATE_FROM_TEMPLATE';

    if (signatureFileId) {
      const formObject = {
        bookingId: safeBookingId,
        topic: sanitizePlainText_(getCell_(row, cols.topic), 300),
        requester: sanitizePlainText_(getCell_(row, cols.requester), 150),
        requesterEmail: normalizeText_(getCell_(row, cols.requesterEmail)),
        headcount: parseInt(getCell_(row, cols.headcount), 10) || 0,
        roomId: normalizeText_(getCell_(row, cols.roomId)),
        roomName: normalizeText_(getCell_(row, cols.roomName)),
        setupDetails: sanitizePlainText_(getCell_(row, cols.setupDetails), 1000),
        signatureFileId: signatureFileId
      };
      memoResult = generatePDFMemo(formObject, safeBookingId, startDate, endDate);
    } else if (existingMemoPdfUrl) {
      // รายการเก่าที่สร้างก่อนระบบเก็บลายเซ็นไว้ อาจสร้างใหม่จาก Template ไม่ได้
      // จึงทำสำเนาจาก PDF เดิมแทน เพื่อให้เจ้าหน้าที่ได้ไฟล์ PDF ใหม่โดยไม่ต้องส่งอีเมล
      memoResult = copyExistingMemoPdf_(safeBookingId, existingMemoPdfUrl);
      method = memoResult.method || 'COPY_EXISTING_PDF';
    } else {
      throw new Error('รายการนี้ไม่มีไฟล์ลายเซ็นที่จัดเก็บไว้ และไม่มี Memo PDF URL เดิมให้ทำสำเนา จึงไม่สามารถสร้าง PDF ใหม่ได้');
    }

    if (!memoResult || !memoResult.url || !memoResult.fileId) {
      throw new Error('สร้าง PDF ไม่สำเร็จ กรุณาตรวจสอบ Template Slide, PDF_FOLDER_ID และสิทธิ์ Drive');
    }

    memoPdfFileIdForRollback = memoResult.fileId;
    bookSheet.getRange(rowNo, cols.memoPdfUrl).setValue(memoResult.url);
    bookSheet.getRange(rowNo, cols.lastUpdated).setValue(new Date());
    databaseWritten = true;

    logAction(currentUser, 'Admin Generate Memo PDF', `สร้าง PDF บันทึกข้อความใหม่ Booking ID: ${safeBookingId} | Method: ${method} | URL: ${memoResult.url}`);

    return {
      status: 'Success',
      bookingId: safeBookingId,
      memoPdfUrl: memoResult.url,
      memoPdfFileId: memoResult.fileId,
      memoPdfName: memoResult.name,
      method: method,
      message: method === 'COPY_EXISTING_PDF'
        ? 'สร้างไฟล์ PDF ใหม่โดยทำสำเนาจากไฟล์เดิมแล้ว เนื่องจากรายการนี้ยังไม่มีไฟล์ลายเซ็นที่ระบบจัดเก็บไว้'
        : 'สร้างไฟล์ PDF บันทึกข้อความใหม่จาก Template แล้ว'
    };
  } catch (error) {
    if (memoPdfFileIdForRollback && !databaseWritten) {
      try { DriveApp.getFileById(memoPdfFileIdForRollback).setTrashed(true); } catch (cleanupErr) {}
    }
    throw new Error(error.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ==========================================
// 📄 PDF GENERATION & UTILS
// ==========================================

function generatePDFMemo(formObject, bookingId, newStart, newEnd) {
  if (!formObject.signatureBase64 && !formObject.signatureFileId) {
    throw new Error("ไม่พบลายเซ็นผู้จอง จึงไม่สามารถสร้าง PDF บันทึกข้อความได้");
  }
  if (!TEMPLATE_SLIDE_ID) {
    throw new Error("ยังไม่ได้กำหนด TEMPLATE_SLIDE_ID สำหรับสร้างบันทึกข้อความ");
  }
  if (!PDF_FOLDER_ID) {
    throw new Error("ยังไม่ได้กำหนด PDF_FOLDER_ID สำหรับจัดเก็บบันทึกข้อความ");
  }

  let copyFile = null;
  try {
    const templateFile = DriveApp.getFileById(TEMPLATE_SLIDE_ID);
    const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
    copyFile = templateFile.makeCopy(`TEMP_บันทึกข้อความ_${bookingId}`, folder);
    const presentation = SlidesApp.openById(copyFile.getId());

    const formatDateTime = (dateObj) => {
        return dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) +
               ' เวลา ' + dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const officerSheet = ss.getSheetByName(SHEET_OFFICERS);
    let officerName = "-";

    if (officerSheet) {
      const officersData = officerSheet.getDataRange().getValues();
      officersData.shift();
      const foundOfficer = officersData.find(row => {
        if (!row[2]) return false;
        const assignedRooms = row[2].toString().split(',').map(r => r.trim());
        return assignedRooms.includes(formObject.roomId.toString());
      });
      if (foundOfficer) officerName = foundOfficer[0];
    }

    // ให้ชื่อผู้รับผิดชอบห้องในบันทึกข้อความอ้างอิงฐานข้อมูล Approvers เป็นหลัก
    // เพื่อให้สอดคล้องกับ workflow ลงนามจริง และยัง fallback ไป Officers ตามพฤติกรรมเดิมหากยังไม่ได้ตั้งค่า Approvers
    try {
      const roomOfficerConfig = getApproverConfig_(1, { roomId: formObject.roomId, roomName: formObject.roomName });
      if (roomOfficerConfig && roomOfficerConfig.name) officerName = roomOfficerConfig.name;
    } catch (roomOfficerLookupErr) {
      console.warn('ไม่สามารถอ่านผู้รับผิดชอบห้องจาก Approvers ได้ จึงใช้ข้อมูล Officers เดิม: ' + roomOfficerLookupErr.message);
    }

    const safeReplace = (key, value) => {
      presentation.replaceAllText(key, value ? value.toString() : '-');
    };

    safeReplace('{{BOOKINGNUMBER}}', bookingId);
    safeReplace('{{DATENOW}}', toThaiDateString(new Date()));
    safeReplace('{{GUESTNAME}}', formObject.requester);
    safeReplace('{{ROOM}}', formObject.roomName);
    safeReplace('{{MEETINGTOPIC}}', formObject.topic);
    safeReplace('{{PEOPLE}}', formObject.headcount);
    safeReplace('{{START}}', formatDateTime(newStart));
    safeReplace('{{END}}', formatDateTime(newEnd));
    safeReplace('{{GUESTEMAIL}}', formObject.requesterEmail);
    safeReplace('{{ROOMOFFICER}}', officerName);

    let layoutText = "ไม่มีระบุ";
    if (formObject.setupDetails || formObject.setupFileBase64) {
      layoutText = formObject.setupDetails ? formObject.setupDetails : "มีแนบไฟล์รูปแบบการจัดโต๊ะ";
    }
    safeReplace('{{LAYOUT}}', layoutText);

    let signatureInserted = false;
    const slides = presentation.getSlides();
    slides.forEach(slide => {
      const elements = slide.getPageElements();
      elements.forEach(element => {
        if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
          const shape = element.asShape();
          const text = shape.getText().asString();
          if (text.includes('{{GUESTSIGNATURE}}')) {
            const shapeLeft = shape.getLeft();
            const shapeTop = shape.getTop();
            const shapeWidth = shape.getWidth();
            const shapeHeight = shape.getHeight();
            const imgWidth = 120;
            const imgHeight = 50;
            const centerX = shapeLeft + (shapeWidth / 2);
            const centerY = shapeTop + (shapeHeight / 2);
            const insertX = centerX - (imgWidth / 2);
            const insertY = centerY - (imgHeight / 2) - 10;

            shape.getText().setText('');
            const imageBlob = getSignatureImageBlobForMemo_(formObject);
            slide.insertImage(imageBlob, insertX, insertY, imgWidth, imgHeight);
            signatureInserted = true;
          }
        }
      });
    });

    if (!signatureInserted) {
      throw new Error("ไม่พบ placeholder {{GUESTSIGNATURE}} ใน Template Slide จึงไม่สามารถวางลายเซ็นได้");
    }

    // PDF ฉบับแรกยังไม่ผ่านกระบวนการลงนามครบ จึงต้องล้าง placeholder กลุ่มลายเซ็น/ชื่อ/ตำแหน่งของผู้อนุมัติออกให้หมด
    // เพื่อไม่ให้ Template ที่เพิ่ม field ใหม่มีข้อความ {{...}} ค้างในเอกสารก่อนอนุมัติ
    clearUnusedFinalMemoPlaceholders_(presentation);

    presentation.saveAndClose();
    Utilities.sleep(3000);

    const pdfName = `บันทึกข้อความ_${bookingId}.pdf`;
    const pdfBlob = copyFile.getAs(MimeType.PDF).setName(pdfName);
    const pdfFile = folder.createFile(pdfBlob);
    try {
      pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      console.warn("ไม่สามารถตั้งค่าแชร์ PDF เป็น anyone-with-link ได้: " + shareErr.message);
    }

    copyFile.setTrashed(true);

    return {
      blob: pdfBlob,
      url: pdfFile.getUrl(),
      fileId: pdfFile.getId(),
      name: pdfName
    };
  } catch(e) {
    if (copyFile) {
      try { copyFile.setTrashed(true); } catch (cleanupErr) {}
    }
    console.error("PDF Generation Error: " + e.message);
    throw new Error("สร้าง PDF บันทึกข้อความไม่สำเร็จ: " + e.message);
  }
}

function toThaiDateString(date) {
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const d = date.getDate();
    const m = thaiMonths[date.getMonth()];
    const y = date.getFullYear() + 543;
    
    // คืนค่าเป็นเลขอารบิกทั้งหมดตามปกติ (เช่น 18 มีนาคม 2569) เพื่อความสม่ำเสมอของเอกสาร
    return `${d} ${m} ${y}`;
}


// ==========================================
// APPROVAL WORKFLOW & DIGITAL SIGNATURES
// ==========================================

function getApprovalFlowCols_(sheet) {
  const map = getHeaderMap_(sheet);
  return {
    approvalId: findColumn_(map, ["Approval ID"], 1),
    bookingId: findColumn_(map, ["Booking ID"], 2),
    topic: findColumn_(map, ["Topic"], 3),
    roomId: findColumn_(map, ["Room ID"], 4),
    roomName: findColumn_(map, ["Room Name"], 5),
    requester: findColumn_(map, ["Requester"], 6),
    requesterEmail: findColumn_(map, ["Requester Email"], 7),
    currentStep: findColumn_(map, ["Current Step"], 8),
    currentApproverRole: findColumn_(map, ["Current Approver Role"], 9),
    currentApproverEmail: findColumn_(map, ["Current Approver Email"], 10),
    overallStatus: findColumn_(map, ["Overall Status"], 11),
    initialMemoPdfUrl: findColumn_(map, ["Initial Memo PDF URL"], 12),
    finalSignedPdfUrl: findColumn_(map, ["Final Signed PDF URL"], 13),
    finalSignedPdfFileId: findColumn_(map, ["Final Signed PDF File ID"], 14),
    createdAt: findColumn_(map, ["Created At"], 15),
    updatedAt: findColumn_(map, ["Updated At"], 16),
    completedAt: findColumn_(map, ["Completed At"], 17),
    reason: findColumn_(map, ["Cancel/Reject Reason"], 18)
  };
}

function getApprovalStepCols_(sheet) {
  const map = getHeaderMap_(sheet);
  return {
    approvalId: findColumn_(map, ["Approval ID"], 1),
    bookingId: findColumn_(map, ["Booking ID"], 2),
    stepNo: findColumn_(map, ["Step No"], 3),
    stepName: findColumn_(map, ["Step Name"], 4),
    approverRole: findColumn_(map, ["Approver Role"], 5),
    approverName: findColumn_(map, ["Approver Name"], 6),
    approverEmail: findColumn_(map, ["Approver Email"], 7),
    status: findColumn_(map, ["Status"], 8),
    signMethod: findColumn_(map, ["Sign Method"], 9),
    signatureFileId: findColumn_(map, ["Signature File ID"], 10),
    signatureImageUrl: findColumn_(map, ["Signature Image URL"], 11),
    signedAt: findColumn_(map, ["Signed At"], 12),
    comment: findColumn_(map, ["Comment"], 13),
    token: findColumn_(map, ["Token"], 14),
    tokenExpireAt: findColumn_(map, ["Token Expire At"], 15),
    notifyCount: findColumn_(map, ["Notify Count"], 16),
    lastNotifiedAt: findColumn_(map, ["Last Notified At"], 17),
    rejectedReason: findColumn_(map, ["Rejected Reason"], 18),
    createdAt: findColumn_(map, ["Created At"], 19),
    updatedAt: findColumn_(map, ["Updated At"], 20),
    approverPosition: findColumn_(map, ["Approver Position", "Position", "ตำแหน่ง"], 21),
    approverPositionShort: findColumn_(map, ["Approver Position Short", "Position Short", "ตำแหน่งแบบย่อ"], 22)
  };
}

function getApproverCols_(sheet) {
  const map = getHeaderMap_(sheet);
  return {
    stepNo: findColumn_(map, ["Step No"], 1),
    stepName: findColumn_(map, ["Step Name"], 2),
    roleKey: findColumn_(map, ["Role Key"], 3),
    name: findColumn_(map, ["Name", "Approver Name"], 4),
    email: findColumn_(map, ["Email", "Approver Email"], 5),
    active: findColumn_(map, ["Active", "Status"], 6),
    roomId: findColumn_(map, ["Room ID", "RoomID", "Room"], 7),
    roomName: findColumn_(map, ["Room Name", "RoomName"], 8),
    position: findColumn_(map, ["Position", "Approver Position", "ตำแหน่ง"], 9),
    positionShort: findColumn_(map, ["Position Short", "Approver Position Short", "ตำแหน่งแบบย่อ"], 10)
  };
}

function isApproverActive_(value) {
  const text = normalizeText_(value).toLowerCase();
  return !['false', 'inactive', 'no', '0', 'ปิด', 'ไม่ใช้งาน'].includes(text);
}

function roomMatchesApprover_(approver, booking) {
  const targetRoomId = normalizeText_(booking && booking.roomId).toLowerCase();
  const targetRoomName = normalizeText_(booking && booking.roomName).toLowerCase();
  const roomIdText = normalizeText_(approver.roomId);
  const roomNameText = normalizeText_(approver.roomName);

  const ids = roomIdText.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const names = roomNameText.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const hasRoomCondition = ids.length > 0 || names.length > 0;

  if (!hasRoomCondition) return { matched: true, score: 1, scope: 'BLANK' };
  if (ids.includes('all') || ids.includes('*') || names.includes('ทุกห้อง') || names.includes('all') || names.includes('*')) {
    return { matched: true, score: 2, scope: 'ALL' };
  }
  if (targetRoomId && ids.includes(targetRoomId)) return { matched: true, score: 4, scope: 'ROOM_ID' };
  if (targetRoomName && names.some(name => targetRoomName.includes(name) || name.includes(targetRoomName))) {
    return { matched: true, score: 3, scope: 'ROOM_NAME' };
  }
  return { matched: false, score: 0, scope: 'NO_MATCH' };
}

function isDeputyRoleKey_(roleKey) {
  const key = normalizeText_(roleKey).toUpperCase();
  return !key || key === STEP3_ROLE_KEY || key.indexOf('DEPUTY_') === 0;
}

function getApproverPosition_(approver, fallbackText) {
  return normalizeText_(approver && approver.position) || normalizeText_(fallbackText) || normalizeText_(approver && approver.stepName) || normalizeText_(approver && approver.name);
}

function getApproverPositionShort_(approver, fallbackText) {
  return normalizeText_(approver && approver.positionShort) || getApproverPosition_(approver, fallbackText);
}

function getApproverConfigs_(stepNo, booking) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_APPROVERS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const cols = getApproverCols_(sheet);
  const rows = sheet.getDataRange().getValues().slice(1);
  const step = parseInt(stepNo, 10);
  const matched = [];

  rows.forEach((row, index) => {
    if (parseInt(getCell_(row, cols.stepNo), 10) !== step) return;
    if (!isApproverActive_(getCell_(row, cols.active))) return;
    const approver = {
      stepNo: step,
      stepName: normalizeText_(getCell_(row, cols.stepName)),
      roleKey: normalizeText_(getCell_(row, cols.roleKey)),
      name: normalizeText_(getCell_(row, cols.name)),
      email: normalizeText_(getCell_(row, cols.email)),
      roomId: normalizeText_(getCell_(row, cols.roomId)),
      roomName: normalizeText_(getCell_(row, cols.roomName)),
      position: normalizeText_(getCell_(row, cols.position)),
      positionShort: normalizeText_(getCell_(row, cols.positionShort)),
      rowOrder: index
    };

    const match = roomMatchesApprover_(approver, booking || {});
    const roleKeyUpper = normalizeText_(approver.roleKey).toUpperCase();

    if (step === 1) {
      // Step 1 ต้องเลือกตามห้องประชุมเท่านั้น เพื่อให้ได้ผู้รับผิดชอบห้องนั้น ๆ
      if (roleKeyUpper && roleKeyUpper !== STEP1_ROLE_KEY) return;
      if (match.matched && (match.scope === 'ROOM_ID' || match.scope === 'ROOM_NAME')) {
        matched.push(Object.assign(approver, { matchScore: match.score, matchScope: match.scope }));
      }
      return;
    }

    if (step === 2) {
      // Step 2 เป็นผู้ลงนามกลางของทุกห้อง จึงรับเฉพาะ ALL, *, ทุกห้อง หรือเว้นว่าง
      if (roleKeyUpper && roleKeyUpper !== STEP2_ROLE_KEY) return;
      if (match.matched && (match.scope === 'ALL' || match.scope === 'BLANK')) {
        matched.push(Object.assign(approver, { matchScore: match.score, matchScope: match.scope }));
      }
      return;
    }

    if (step === 3) {
      // Step 3 รองรับรองผู้อำนวยการตามห้องก่อน แล้ว fallback ไป ALL/ว่างเมื่อไม่มีรายห้อง
      // รองรับทั้ง DEPUTY_BUDGET, DEPUTY_GENERAL และ Role Key กลุ่ม DEPUTY_* ในอนาคต
      if (!isDeputyRoleKey_(roleKeyUpper)) return;
      if (match.matched && ['ROOM_ID', 'ROOM_NAME', 'ALL', 'BLANK'].includes(match.scope)) {
        matched.push(Object.assign(approver, { matchScore: match.score, matchScope: match.scope }));
      }
      return;
    }

    if (match.matched) {
      matched.push(Object.assign(approver, { matchScore: match.score, matchScope: match.scope }));
    }
  });

  matched.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.rowOrder - b.rowOrder;
  });
  return matched;
}

function getApproverConfig_(stepNo, booking) {
  const list = getApproverConfigs_(stepNo, booking);
  return list.length ? list[0] : null;
}

function validateApprovalApproverConfig(sessionToken) {
  const user = requireUser_(sessionToken, ['Admin']);
  ensureDatabaseSchema_();
  const rooms = getRoomsData();
  const results = [];

  rooms.forEach(room => {
    const bookingRoom = { roomId: room.roomId, roomName: room.roomName };
    const step1 = getApproverConfigs_(1, bookingRoom)[0] || null;
    results.push({
      stepNo: 1,
      roomId: room.roomId,
      roomName: room.roomName,
      selectedName: step1 ? step1.name : '',
      selectedEmail: step1 ? step1.email : '',
      selectedPosition: step1 ? getApproverPosition_(step1, 'ผู้รับผิดชอบห้องประชุม') : '',
      matchScope: step1 ? step1.matchScope : 'NO_CONFIG',
      warning: step1 && step1.email ? '' : 'ยังไม่ได้ตั้งค่าอีเมลผู้รับผิดชอบห้องประชุมสำหรับห้องนี้'
    });

    const step3 = getApproverConfigs_(3, bookingRoom)[0] || null;
    results.push({
      stepNo: 3,
      roomId: room.roomId,
      roomName: room.roomName,
      selectedName: step3 ? step3.name : '',
      selectedEmail: step3 ? step3.email : '',
      selectedPosition: step3 ? getApproverPosition_(step3, step3.stepName) : '',
      matchScope: step3 ? step3.matchScope : 'NO_CONFIG',
      warning: step3 && step3.email ? '' : 'ยังไม่ได้ตั้งค่าอีเมลรองผู้อำนวยการที่รับผิดชอบห้องนี้'
    });
  });

  const step2 = getApproverConfigs_(2, { roomId: 'ALL', roomName: 'ทุกห้อง' })[0] || null;
  results.push({
    stepNo: 2,
    roomId: 'ALL',
    roomName: 'ทุกห้อง',
    selectedName: step2 ? step2.name : '',
    selectedEmail: step2 ? step2.email : '',
    selectedPosition: step2 ? getApproverPosition_(step2, 'กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม') : '',
    matchScope: step2 ? step2.matchScope : 'NO_CONFIG',
    warning: step2 && step2.email ? '' : 'ยังไม่ได้ตั้งค่าอีเมลกลุ่มงานอาคารสถานที่และสิ่งแวดล้อม'
  });

  logAction(formatUserForLog_(user), 'Validate Approval Approver Config', `ตรวจสอบผู้ลงนาม Approval จำนวน ${results.length} รายการ`);
  return results;
}

// Backward-compatible alias สำหรับโค้ดหน้าเว็บ/ทริกเกอร์เก่าที่อาจยังเรียกชื่อเดิม
function validateRoomBasedStep2Config_(sessionToken) {
  return validateApprovalApproverConfig(sessionToken);
}

function getBookingRecordObject_(bookingId) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(sheet);
  const data = sheet.getDataRange().getValues();
  const safeId = normalizeText_(bookingId);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (normalizeText_(getCell_(row, cols.id)) === safeId) {
      return {
        rowNo: i + 1,
        bookingId: safeId,
        roomId: normalizeText_(getCell_(row, cols.roomId)),
        roomName: normalizeText_(getCell_(row, cols.roomName)),
        topic: normalizeText_(getCell_(row, cols.topic)),
        requester: normalizeText_(getCell_(row, cols.requester)),
        requesterEmail: normalizeText_(getCell_(row, cols.requesterEmail)),
        headcount: normalizeText_(getCell_(row, cols.headcount)),
        start: getCell_(row, cols.start),
        end: getCell_(row, cols.end),
        status: normalizeBookingStatus_(getCell_(row, cols.status)),
        setupDetails: normalizeText_(getCell_(row, cols.setupDetails)),
        layoutUrl: normalizeText_(getCell_(row, cols.layoutUrl)),
        initialMemoPdfUrl: normalizeText_(getCell_(row, cols.memoPdfUrl)),
        signatureFileId: normalizeText_(getCell_(row, cols.signatureFileId)),
        signatureImageUrl: normalizeText_(getCell_(row, cols.signatureImageUrl))
      };
    }
  }
  throw new Error("ไม่พบเลขที่การจอง: " + safeId);
}

function createApprovalId_() {
  return 'AP-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Bangkok', 'yyyyMMddHHmmss') + '-' + Math.floor(1000 + Math.random() * 9000);
}

function createApprovalToken_() {
  return Utilities.getUuid() + '-' + Utilities.getUuid();
}

function logApproval_(approvalId, bookingId, action, actorName, actorEmail, stepNo, details) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_APPROVAL_LOGS);
  sheet.appendRow([
    new Date(), approvalId, bookingId, sanitizePlainText_(action, 120), sanitizePlainText_(actorName, 200),
    sanitizePlainText_(actorEmail, 200), stepNo || '', sanitizePlainText_(details, 1000)
  ]);
}

function getStepOneOfficerConfig_(booking) {
  const config = getApproverConfig_(1, booking);
  if (config) {
    return {
      stepNo: 1,
      stepName: config.stepName || "ผู้รับผิดชอบห้องประชุม",
      roleKey: config.roleKey || STEP1_ROLE_KEY,
      name: config.name || "ผู้รับผิดชอบห้องประชุม",
      email: config.email || '',
      roomId: config.roomId || booking.roomId || '',
      roomName: config.roomName || booking.roomName || '',
      position: getApproverPosition_(config, "ผู้รับผิดชอบห้องประชุม"),
      positionShort: getApproverPositionShort_(config, "ผู้รับผิดชอบห้องประชุม")
    };
  }
  return {
    stepNo: 1,
    stepName: "ผู้รับผิดชอบห้องประชุม",
    roleKey: STEP1_ROLE_KEY,
    name: `ยังไม่ได้ตั้งค่าผู้รับผิดชอบ${booking.roomName || booking.roomId || 'ห้องประชุม'}`,
    email: '',
    roomId: booking.roomId || '',
    roomName: booking.roomName || '',
    position: "ผู้รับผิดชอบห้องประชุม",
    positionShort: "ผู้รับผิดชอบห้องประชุม"
  };
}

function resolveApprovalStepConfigs_(booking) {
  const adminFallback = getAdminNotificationRecipients_();
  const step1 = getStepOneOfficerConfig_(booking);
  const step2 = getApproverConfig_(2, booking) || {
    stepNo: 2,
    stepName: "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม",
    roleKey: STEP2_ROLE_KEY,
    name: "ยังไม่ได้ตั้งค่าผู้ลงนามกลุ่มงานอาคารสถานที่และสิ่งแวดล้อม",
    email: '',
    roomId: 'ALL',
    roomName: 'ทุกห้อง',
    position: "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม",
    positionShort: "กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม"
  };
  const step3 = getApproverConfig_(3, booking) || {
    stepNo: 3,
    stepName: "รองผู้อำนวยการ",
    roleKey: STEP3_ROLE_KEY,
    name: "ยังไม่ได้ตั้งค่ารองผู้อำนวยการที่รับผิดชอบห้องประชุมนี้",
    email: '',
    roomId: booking.roomId || 'ALL',
    roomName: booking.roomName || 'ทุกห้อง',
    position: "รองผู้อำนวยการ",
    positionShort: "รองผู้อำนวยการ"
  };

  [step1, step2, step3].forEach(step => {
    step.position = getApproverPosition_(step, step.stepName);
    step.positionShort = getApproverPositionShort_(step, step.position);
    step.email = uniqueEmailList_([step.email]).join(',');
    if (!step.email && adminFallback.to) {
      step.email = uniqueEmailList_([adminFallback.to, adminFallback.cc].filter(Boolean)).join(',');
      step.name = step.name + " (ส่งสำรองถึง Admin เนื่องจากยังไม่ได้ตั้งค่าอีเมลผู้ลงนาม)";
    }
  });

  logApproval_('', booking.bookingId, 'RESOLVE_APPROVAL_STEPS', 'System', '', '',
    `Step1=${step1.name || '-'} | Step1Email=${step1.email || '-'} | Step1Scope=${step1.matchScope || '-'} | BookingRoom=${booking.roomId}/${booking.roomName} | Step2=${step2.name || '-'} | Step2Email=${step2.email || '-'} | Step3=${step3.name || '-'} | Step3Email=${step3.email || '-'} | Step3Role=${step3.roleKey || '-'} | Step3Scope=${step3.matchScope || '-'}`);
  return [step1, step2, step3];
}

function cancelApprovalFlowForBooking_(bookingId, reason, actor, keepApprovalId) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const flowSheet = ss.getSheetByName(SHEET_APPROVAL_FLOW);
  const stepSheet = ss.getSheetByName(SHEET_APPROVAL_STEPS);
  const fCols = getApprovalFlowCols_(flowSheet);
  const sCols = getApprovalStepCols_(stepSheet);
  const flows = flowSheet.getDataRange().getValues();
  const steps = stepSheet.getDataRange().getValues();
  const safeBookingId = normalizeText_(bookingId);
  const safeKeepApprovalId = normalizeText_(keepApprovalId || "");
  const safeReason = sanitizePlainText_(reason || "ยกเลิกการจอง", 1000);
  let cancelledCount = 0;

  for (let i = 1; i < flows.length; i++) {
    const row = flows[i];
    const approvalId = normalizeText_(getCell_(row, fCols.approvalId));
    const flowBookingId = normalizeText_(getCell_(row, fCols.bookingId));
    const flowStatus = normalizeText_(getCell_(row, fCols.overallStatus));

    if (flowBookingId !== safeBookingId) continue;
    if (safeKeepApprovalId && approvalId === safeKeepApprovalId) continue;
    if (isApprovalFlowTerminalStatus_(flowStatus)) continue;

    flowSheet.getRange(i + 1, fCols.overallStatus).setValue("CANCELLED");
    flowSheet.getRange(i + 1, fCols.updatedAt).setValue(new Date());
    flowSheet.getRange(i + 1, fCols.reason).setValue(safeReason);

    for (let j = 1; j < steps.length; j++) {
      const stepApprovalId = normalizeText_(getCell_(steps[j], sCols.approvalId));
      const stepStatus = normalizeText_(getCell_(steps[j], sCols.status));
      if (stepApprovalId === approvalId && isApprovalStepOpenStatus_(stepStatus)) {
        stepSheet.getRange(j + 1, sCols.status).setValue("CANCELLED");
        if (sCols.comment) stepSheet.getRange(j + 1, sCols.comment).setValue(safeReason);
        if (sCols.updatedAt) stepSheet.getRange(j + 1, sCols.updatedAt).setValue(new Date());
      }
    }

    cancelledCount++;
    logApproval_(approvalId, safeBookingId, "CANCEL_APPROVAL_FLOW", actor || "System", "", "", safeReason);
  }

  if (cancelledCount === 0) {
    logApproval_("", safeBookingId, "CANCEL_APPROVAL_FLOW_NO_ACTIVE_FLOW", actor || "System", "", "", safeReason);
  }
  return { cancelledCount: cancelledCount };
}


// ใช้รันจาก Apps Script Editor ครั้งเดียวหลัง deploy หากเคยมีรายการ Cancelled ก่อนแก้ไขชุดนี้
// ฟังก์ชันนี้จะปิด ApprovalFlow/ApprovalSteps ที่ยังเปิดอยู่ของรายการจองที่ถูกยกเลิกแล้ว โดยไม่แตะรายการที่ Completed/Rejected/Superseded
function repairCancelledBookingApprovalFlows() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookSheet = ss.getSheetByName(SHEET_BOOKINGS);
  const cols = getBookingCols_(bookSheet);
  const rows = bookSheet.getDataRange().getValues();
  const repaired = [];
  for (let i = 1; i < rows.length; i++) {
    const bookingId = normalizeText_(getCell_(rows[i], cols.id));
    const status = normalizeBookingStatus_(getCell_(rows[i], cols.status));
    if (!bookingId || status !== BOOKING_STATUS.CANCELLED) continue;
    const result = cancelApprovalFlowForBooking_(bookingId, "ซ่อมข้อมูล: รายการจองถูกยกเลิกแล้ว", "System Repair");
    if (result.cancelledCount > 0) {
      repaired.push({ bookingId: bookingId, cancelledFlows: result.cancelledCount });
    }
  }
  logAction("System Repair", "Repair Cancelled Approval Flows", "จำนวนรายการที่ซ่อม: " + repaired.length);
  return { repairedCount: repaired.length, repaired: repaired };
}

function supersedeApprovalFlowsForBooking_(bookingId, reason, actor, keepApprovalId) {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const flowSheet = ss.getSheetByName(SHEET_APPROVAL_FLOW);
  const stepSheet = ss.getSheetByName(SHEET_APPROVAL_STEPS);
  const fCols = getApprovalFlowCols_(flowSheet);
  const sCols = getApprovalStepCols_(stepSheet);
  const flows = flowSheet.getDataRange().getValues();
  const steps = stepSheet.getDataRange().getValues();
  const safeBookingId = normalizeText_(bookingId);
  for (let i = 1; i < flows.length; i++) {
    const row = flows[i];
    const status = normalizeText_(getCell_(row, fCols.overallStatus));
    if (normalizeText_(getCell_(row, fCols.bookingId)) === safeBookingId && !['CANCELLED', 'REJECTED', 'SUPERSEDED'].includes(status)) {
      const approvalId = normalizeText_(getCell_(row, fCols.approvalId));
      if (keepApprovalId && approvalId === normalizeText_(keepApprovalId)) continue;
      flowSheet.getRange(i + 1, fCols.overallStatus).setValue('SUPERSEDED');
      flowSheet.getRange(i + 1, fCols.updatedAt).setValue(new Date());
      flowSheet.getRange(i + 1, fCols.reason).setValue(reason);
      for (let j = 1; j < steps.length; j++) {
        if (normalizeText_(getCell_(steps[j], sCols.approvalId)) === approvalId && isApprovalStepOpenStatus_(normalizeText_(getCell_(steps[j], sCols.status)))) {
          stepSheet.getRange(j + 1, sCols.status).setValue('SUPERSEDED');
          stepSheet.getRange(j + 1, sCols.updatedAt).setValue(new Date());
        }
      }
      logApproval_(approvalId, safeBookingId, 'SUPERSEDE_APPROVAL_FLOW', actor || 'System', '', '', reason);
    }
  }
}

function startApprovalWorkflowSafely_(bookingId, actor, reason) {
  try {
    const result = createApprovalFlowForBooking_(bookingId, actor || 'System', reason || 'AUTO');
    if (result && result.created) {
      markBookingPendingApproval_(bookingId, 'เริ่มกระบวนการลงนามเอกสาร: ' + (result.approvalId || ''));
    }
    return result;
  } catch (e) {
    logAction('System', 'Approval Workflow Start Error', `Booking ID: ${bookingId} | ${e.message}`);
    try {
      markBookingApprovalError_(bookingId, e.message, actor || 'System');
    } catch (statusErr) {
      logAction('System', 'Approval Workflow Status Error', `Booking ID: ${bookingId} | ${statusErr.message}`);
    }
    return { created: false, error: e.message };
  }
}

function createApprovalFlowForBooking_(bookingId, actor, reason) {
  ensureDatabaseSchema_();
  const booking = getBookingRecordObject_(bookingId);
  const bookingStatus = normalizeBookingStatus_(booking.status);
  if (bookingStatus === BOOKING_STATUS.CANCELLED) return { created: false, message: 'รายการถูกยกเลิกแล้ว' };
  if (bookingStatus === BOOKING_STATUS.REJECTED) return { created: false, message: 'รายการนี้ถูกปฏิเสธแล้ว หากต้องการจองใหม่ควรสร้างรายการใหม่' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const flowSheet = ss.getSheetByName(SHEET_APPROVAL_FLOW);
  const stepSheet = ss.getSheetByName(SHEET_APPROVAL_STEPS);
  const approvalId = createApprovalId_();
  const now = new Date();
  const steps = resolveApprovalStepConfigs_(booking);
  if (!Array.isArray(steps) || steps.length !== 3) throw new Error('ไม่สามารถกำหนดผู้ลงนามได้ครบ 3 ขั้น');
  steps.forEach(step => {
    if (!step.stepNo || !step.stepName || !step.roleKey || !step.name || !isValidEmail_(step.email)) {
      throw new Error(`ข้อมูลผู้ลงนามขั้นที่ ${step.stepNo || '-'} ไม่ครบถ้วนหรืออีเมลไม่ถูกต้อง`);
    }
  });
  const first = steps[0];

  flowSheet.appendRow([
    approvalId, booking.bookingId, booking.topic, booking.roomId, booking.roomName, booking.requester, booking.requesterEmail,
    1, first.stepName, first.email, 'PENDING_ROOM_OFFICER', booking.initialMemoPdfUrl, '', '', now, now, '', ''
  ]);

  steps.forEach(step => {
    const token = createApprovalToken_();
    const expire = new Date(now.getTime() + APPROVAL_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    stepSheet.appendRow([
      approvalId, booking.bookingId, step.stepNo, step.stepName, step.roleKey, step.name, step.email,
      step.stepNo === 1 ? 'PENDING' : 'WAITING', '', '', '', '', '', token, expire, 0, '', '', now, now,
      step.position || step.stepName || '', step.positionShort || step.position || step.stepName || ''
    ]);
  });

  supersedeApprovalFlowsForBooking_(bookingId, 'สร้างกระบวนการลงนามใหม่: ' + (reason || ''), actor || 'System', approvalId);
  logApproval_(approvalId, booking.bookingId, 'CREATE_APPROVAL_FLOW', actor || 'System', '', 1, 'เริ่มกระบวนการลงนามเอกสาร');
  sendApprovalRequestEmail_(approvalId, 1);
  return { created: true, approvalId: approvalId, currentStep: 1 };
}

function findApprovalFlowById_(approvalId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_APPROVAL_FLOW);
  const cols = getApprovalFlowCols_(sheet);
  const data = sheet.getDataRange().getValues();
  const safeId = normalizeText_(approvalId);
  for (let i = 1; i < data.length; i++) {
    if (normalizeText_(getCell_(data[i], cols.approvalId)) === safeId) {
      return { sheet: sheet, cols: cols, rowNo: i + 1, row: data[i] };
    }
  }
  throw new Error('ไม่พบ Approval ID: ' + safeId);
}

function findApprovalStepByToken_(token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_APPROVAL_STEPS);
  const cols = getApprovalStepCols_(sheet);
  const data = sheet.getDataRange().getValues();
  const safeToken = normalizeText_(token);
  for (let i = 1; i < data.length; i++) {
    if (normalizeText_(getCell_(data[i], cols.token)) === safeToken) {
      return { sheet: sheet, cols: cols, rowNo: i + 1, row: data[i] };
    }
  }
  throw new Error('ลิงก์ลงนามไม่ถูกต้องหรือหมดอายุ');
}

function getApprovalStepsForApproval_(approvalId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_APPROVAL_STEPS);
  const cols = getApprovalStepCols_(sheet);
  const rows = sheet.getDataRange().getValues().slice(1);
  return rows.filter(row => normalizeText_(getCell_(row, cols.approvalId)) === normalizeText_(approvalId)).map(row => ({
    approvalId: normalizeText_(getCell_(row, cols.approvalId)),
    bookingId: normalizeText_(getCell_(row, cols.bookingId)),
    stepNo: parseInt(getCell_(row, cols.stepNo), 10),
    stepName: normalizeText_(getCell_(row, cols.stepName)),
    approverRole: normalizeText_(getCell_(row, cols.approverRole)),
    approverName: normalizeText_(getCell_(row, cols.approverName)),
    approverEmail: normalizeText_(getCell_(row, cols.approverEmail)),
    status: normalizeText_(getCell_(row, cols.status)),
    signMethod: normalizeText_(getCell_(row, cols.signMethod)),
    signatureFileId: normalizeText_(getCell_(row, cols.signatureFileId)),
    signatureImageUrl: normalizeText_(getCell_(row, cols.signatureImageUrl)),
    signedAt: getCell_(row, cols.signedAt),
    comment: normalizeText_(getCell_(row, cols.comment)),
    token: normalizeText_(getCell_(row, cols.token)),
    approverPosition: normalizeText_(getCell_(row, cols.approverPosition)),
    approverPositionShort: normalizeText_(getCell_(row, cols.approverPositionShort))
  })).sort((a, b) => a.stepNo - b.stepNo);
}

function getApprovalDetailsByToken(token) {
  ensureDatabaseSchema_();
  const step = findApprovalStepByToken_(token);
  const sCols = step.cols;
  const approvalId = normalizeText_(getCell_(step.row, sCols.approvalId));
  const flow = findApprovalFlowById_(approvalId);
  const fCols = flow.cols;
  const flowBookingId = normalizeText_(getCell_(flow.row, fCols.bookingId));
  const stepBookingId = normalizeText_(getCell_(step.row, sCols.bookingId));
  const bookingId = flowBookingId || stepBookingId;
  const booking = getBookingRecordObject_(bookingId);
  const status = normalizeText_(getCell_(step.row, sCols.status));
  const expireAt = new Date(getCell_(step.row, sCols.tokenExpireAt));
  const flowStatus = normalizeText_(getCell_(flow.row, fCols.overallStatus));
  let available = true;
  let message = '';

  if (stepBookingId && flowBookingId && stepBookingId !== flowBookingId) {
    available = false;
    message = 'ข้อมูลลิงก์ลงนามไม่สอดคล้องกับรายการจอง กรุณาติดต่อผู้ดูแลระบบ';
  } else {
    try {
      assertBookingCanBeApproved_(bookingId);
    } catch (e) {
      available = false;
      message = e.message;
    }
  }

  if (available && !isApprovalFlowPendingStatus_(flowStatus)) {
    available = false;
    message = 'เอกสารนี้ไม่ได้อยู่ระหว่างรอลงนามแล้ว สถานะปัจจุบัน: ' + flowStatus;
  } else if (available && status !== 'PENDING') {
    available = false;
    message = 'ขั้นตอนนี้ไม่อยู่ในสถานะรอลงนามแล้ว สถานะปัจจุบัน: ' + status;
  } else if (available && (isNaN(expireAt.getTime()) || expireAt < new Date())) {
    available = false;
    message = 'ลิงก์ลงนามหมดอายุแล้ว กรุณาติดต่อผู้ดูแลระบบให้ส่งลิงก์ใหม่';
  }

  return {
    available: available,
    message: message,
    token: normalizeText_(token),
    approvalId: approvalId,
    bookingId: bookingId,
    stepNo: parseInt(getCell_(step.row, sCols.stepNo), 10),
    stepName: normalizeText_(getCell_(step.row, sCols.stepName)),
    approverName: normalizeText_(getCell_(step.row, sCols.approverName)),
    approverEmail: normalizeText_(getCell_(step.row, sCols.approverEmail)),
    topic: booking.topic,
    roomName: booking.roomName,
    requester: booking.requester,
    requesterEmail: booking.requesterEmail,
    headcount: booking.headcount,
    bookingStatus: booking.status,
    bookingStatusLabel: getBookingStatusLabel_(booking.status),
    startStr: new Date(booking.start).toLocaleString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Bangkok' }),
    endStr: new Date(booking.end).toLocaleString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Bangkok' }),
    initialMemoPdfUrl: booking.initialMemoPdfUrl,
    steps: getApprovalStepsForApproval_(approvalId).map(s => ({ stepNo:s.stepNo, stepName:s.stepName, status:s.status, signedAt:s.signedAt ? new Date(s.signedAt).toLocaleString('th-TH') : '', approverName:s.approverName }))
  };
}

function uploadApprovalSignature_(base64Data, filename, approvalId, stepNo) {
  if (!base64Data) throw new Error('ไม่พบข้อมูลลายเซ็น');
  const splitBase = base64Data.split(',');
  const meta = splitBase[0];
  const mime = meta.split(';')[0].replace('data:', '');
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(mime)) {
    throw new Error('รองรับลายเซ็นเฉพาะไฟล์ PNG/JPG หรือการวาดบนหน้าจอเท่านั้น');
  }
  const bytes = Utilities.base64Decode(splitBase[1]);
  if (bytes.length > 1024 * 1024) throw new Error('ไฟล์ลายเซ็นต้องมีขนาดไม่เกิน 1MB');
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const safeName = sanitizePlainText_(filename || `signature_${approvalId}_${stepNo}.${ext}`, 120);
  const blob = Utilities.newBlob(bytes, mime, safeName);
  const folder = DriveApp.getFolderById(FINAL_SIGNED_MEMO_FOLDER_ID);
  const file = folder.createFile(blob).setName(`ลายเซ็น_${approvalId}_ขั้นตอน${stepNo}_${safeName}`);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return { fileId: file.getId(), url: file.getUrl(), blob: blob };
}

function submitApprovalSignature(formObject) {
  ensureDatabaseSchema_();
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error('ขณะนี้มีผู้ใช้งานระบบจำนวนมาก กรุณาลองใหม่อีกครั้ง');
    const token = normalizeText_(formObject.token);
    const mode = normalizeText_(formObject.action || 'approve');
    const signerName = sanitizePlainText_(formObject.signerName, 200);
    const signerEmail = normalizeText_(formObject.signerEmail);
    const comment = sanitizePlainText_(formObject.comment, 1000);
    if (!signerName) throw new Error('กรุณาระบุชื่อผู้ลงนาม');
    if (!isValidEmail_(signerEmail)) throw new Error('กรุณาระบุอีเมลผู้ลงนามให้ถูกต้อง');

    const step = findApprovalStepByToken_(token);
    const sCols = step.cols;
    const approvalId = normalizeText_(getCell_(step.row, sCols.approvalId));
    const stepBookingId = normalizeText_(getCell_(step.row, sCols.bookingId));
    const stepNo = parseInt(getCell_(step.row, sCols.stepNo), 10);
    const status = normalizeText_(getCell_(step.row, sCols.status));
    const expireAt = new Date(getCell_(step.row, sCols.tokenExpireAt));
    const flow = findApprovalFlowById_(approvalId);
    const fCols = flow.cols;
    const flowBookingId = normalizeText_(getCell_(flow.row, fCols.bookingId));
    const bookingId = flowBookingId || stepBookingId;
    const flowStatus = normalizeText_(getCell_(flow.row, fCols.overallStatus));

    if (stepBookingId && flowBookingId && stepBookingId !== flowBookingId) {
      throw new Error('ข้อมูลลิงก์ลงนามไม่สอดคล้องกับรายการจอง กรุณาติดต่อผู้ดูแลระบบ');
    }
    assertBookingCanBeApproved_(bookingId);
    if (!isApprovalFlowPendingStatus_(flowStatus)) {
      throw new Error('เอกสารนี้ไม่ได้อยู่ระหว่างรอลงนามแล้ว สถานะปัจจุบัน: ' + flowStatus);
    }
    if (status !== 'PENDING') throw new Error('ขั้นตอนนี้ไม่อยู่ในสถานะรอลงนามแล้ว');
    if (isNaN(expireAt.getTime()) || expireAt < new Date()) throw new Error('ลิงก์ลงนามหมดอายุแล้ว');

    if (mode === 'reject') {
      if (!comment) throw new Error('กรุณาระบุเหตุผลที่ไม่อนุมัติหรือส่งกลับแก้ไข');
      step.sheet.getRange(step.rowNo, sCols.status).setValue('REJECTED');
      step.sheet.getRange(step.rowNo, sCols.comment).setValue(comment);
      step.sheet.getRange(step.rowNo, sCols.signedAt).setValue(new Date());
      step.sheet.getRange(step.rowNo, sCols.updatedAt).setValue(new Date());
      rejectApprovalFlow_(approvalId, bookingId, stepNo, comment, signerName, signerEmail);
      return { status: 'REJECTED', message: 'บันทึกการไม่อนุมัติเรียบร้อยแล้ว' };
    }

    const signatureBase64 = normalizeText_(formObject.signatureBase64);
    if (!signatureBase64) throw new Error('กรุณาลงลายเซ็นหรือแนบรูปลายเซ็นก่อนอนุมัติ');
    const sig = uploadApprovalSignature_(signatureBase64, formObject.signatureFileName || 'signature.png', approvalId, stepNo);
    const method = normalizeText_(formObject.signatureMethod || 'draw');

    step.sheet.getRange(step.rowNo, sCols.status).setValue('SIGNED');
    step.sheet.getRange(step.rowNo, sCols.approverName).setValue(signerName);
    step.sheet.getRange(step.rowNo, sCols.approverEmail).setValue(signerEmail);
    step.sheet.getRange(step.rowNo, sCols.signMethod).setValue(method);
    step.sheet.getRange(step.rowNo, sCols.signatureFileId).setValue(sig.fileId);
    step.sheet.getRange(step.rowNo, sCols.signatureImageUrl).setValue(sig.url);
    step.sheet.getRange(step.rowNo, sCols.signedAt).setValue(new Date());
    step.sheet.getRange(step.rowNo, sCols.comment).setValue(comment);
    step.sheet.getRange(step.rowNo, sCols.updatedAt).setValue(new Date());

    logApproval_(approvalId, bookingId, 'SIGN_APPROVED', signerName, signerEmail, stepNo, comment || 'ลงนามอนุมัติ');
    return advanceApprovalStep_(approvalId, stepNo, signerName, signerEmail);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function rejectApprovalFlow_(approvalId, bookingId, stepNo, reason, actorName, actorEmail) {
  const flow = findApprovalFlowById_(approvalId);
  const c = flow.cols;
  flow.sheet.getRange(flow.rowNo, c.overallStatus).setValue('REJECTED');
  flow.sheet.getRange(flow.rowNo, c.updatedAt).setValue(new Date());
  flow.sheet.getRange(flow.rowNo, c.reason).setValue(reason);
  try { markBookingRejected_(bookingId, reason); } catch (e) { logAction('System', 'Booking Reject Status Error', `Booking ID: ${bookingId} | ${e.message}`); }
  logApproval_(approvalId, bookingId, 'REJECT_APPROVAL_FLOW', actorName, actorEmail, stepNo, reason);
  sendApprovalRejectedEmail_(approvalId, reason);
}

function advanceApprovalStep_(approvalId, completedStepNo, actorName, actorEmail) {
  const currentFlow = findApprovalFlowById_(approvalId);
  const currentFlowCols = currentFlow.cols;
  const currentBookingId = normalizeText_(getCell_(currentFlow.row, currentFlowCols.bookingId));
  assertBookingCanBeApproved_(currentBookingId);
  const currentFlowStatus = normalizeText_(getCell_(currentFlow.row, currentFlowCols.overallStatus));
  if (!isApprovalFlowPendingStatus_(currentFlowStatus)) {
    throw new Error('เอกสารนี้ไม่ได้อยู่ระหว่างรอลงนามแล้ว สถานะปัจจุบัน: ' + currentFlowStatus);
  }

  const nextStep = completedStepNo + 1;
  if (nextStep <= 3) {
    const flow = findApprovalFlowById_(approvalId);
    const c = flow.cols;
    const statusMap = {2:'PENDING_BUILDING_GROUP', 3:'PENDING_DEPUTY_DIRECTOR'};
    const stepSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_APPROVAL_STEPS);
    const sCols = getApprovalStepCols_(stepSheet);
    const data = stepSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalizeText_(getCell_(data[i], sCols.approvalId)) === approvalId && parseInt(getCell_(data[i], sCols.stepNo), 10) === nextStep) {
        stepSheet.getRange(i + 1, sCols.status).setValue('PENDING');
        stepSheet.getRange(i + 1, sCols.updatedAt).setValue(new Date());
        flow.sheet.getRange(flow.rowNo, c.currentStep).setValue(nextStep);
        flow.sheet.getRange(flow.rowNo, c.currentApproverRole).setValue(normalizeText_(getCell_(data[i], sCols.stepName)));
        flow.sheet.getRange(flow.rowNo, c.currentApproverEmail).setValue(normalizeText_(getCell_(data[i], sCols.approverEmail)));
        flow.sheet.getRange(flow.rowNo, c.overallStatus).setValue(statusMap[nextStep]);
        flow.sheet.getRange(flow.rowNo, c.updatedAt).setValue(new Date());
        sendApprovalRequestEmail_(approvalId, nextStep);
        return { status: 'SIGNED', message: 'ลงนามเรียบร้อยแล้ว และระบบส่งต่อเอกสารไปยังลำดับถัดไปแล้ว', nextStep: nextStep };
      }
    }
  }
  const finalResult = finalizeApprovalFlow_(approvalId, actorName, actorEmail);
  return { status: 'COMPLETED', message: 'ลงนามครบทุกลำดับแล้ว ระบบสร้าง PDF ฉบับสมบูรณ์และแจ้งผู้จองเรียบร้อย', finalPdfUrl: finalResult.url };
}

function sendApprovalRequestEmail_(approvalId, stepNo) {
  const flow = findApprovalFlowById_(approvalId);
  const f = flow.cols;
  const stepSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_APPROVAL_STEPS);
  const sCols = getApprovalStepCols_(stepSheet);
  const data = stepSheet.getDataRange().getValues();
  let rowNo = -1, row;
  for (let i = 1; i < data.length; i++) {
    if (normalizeText_(getCell_(data[i], sCols.approvalId)) === approvalId && parseInt(getCell_(data[i], sCols.stepNo), 10) === parseInt(stepNo, 10)) {
      rowNo = i + 1;
      row = data[i];
      break;
    }
  }
  if (!row) throw new Error('ไม่พบขั้นตอนลงนามที่ต้องการแจ้งเตือน');
  const recipients = uniqueEmailList_([normalizeText_(getCell_(row, sCols.approverEmail))]);
  if (recipients.length === 0) throw new Error('ไม่พบอีเมลผู้ลงนามในขั้นตอนที่ ' + stepNo);
  const token = normalizeText_(getCell_(row, sCols.token));
  const url = buildApprovalUrl_(token);
  const bookingId = normalizeText_(getCell_(flow.row, f.bookingId));
  const topic = normalizeText_(getCell_(flow.row, f.topic));
  const roomName = normalizeText_(getCell_(flow.row, f.roomName));
  const stepName = normalizeText_(getCell_(row, sCols.stepName));
  const content = `
    <p style="font-size:16px; color:#333; line-height:1.7;">เรียนผู้เกี่ยวข้อง,<br>มีเอกสารขอใช้ห้องประชุมรอลงนามในขั้นตอน <strong>${escapeHtml_(stepName)}</strong></p>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <tr><td style="padding:8px; color:#666; width:32%;">รหัสการจอง:</td><td style="padding:8px; font-weight:bold;">${escapeHtml_(bookingId)}</td></tr>
      <tr><td style="padding:8px; color:#666;">หัวข้อ:</td><td style="padding:8px;">${escapeHtml_(topic)}</td></tr>
      <tr><td style="padding:8px; color:#666;">ห้องประชุม:</td><td style="padding:8px;">${escapeHtml_(roomName)}</td></tr>
    </table>
    <div style="text-align:center; margin:28px 0;">
      <a href="${escapeHtml_(url)}" style="background:#0d6efd; color:white; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:bold;">เปิดหน้าลงนามเอกสาร</a>
    </div>
    <p style="font-size:12px; color:#999; text-align:center;">ลิงก์นี้ใช้ได้เฉพาะขั้นตอนนี้และจะหมดอายุภายใน ${APPROVAL_TOKEN_TTL_DAYS} วัน</p>
  `;
  const to = recipients[0];
  const cc = recipients.slice(1).join(',');
  const options = { to: to, subject: `🖊️ เอกสารรอลงนาม: ${topic}`, htmlBody: createBaseEmailTemplate('เอกสารขอใช้ห้องประชุมรอลงนาม', content, EMAIL_THEME.primary), name: 'Meeting Room System' };
  if (cc) options.cc = cc;
  MailApp.sendEmail(options);
  const count = parseInt(getCell_(row, sCols.notifyCount), 10) || 0;
  stepSheet.getRange(rowNo, sCols.notifyCount).setValue(count + 1);
  stepSheet.getRange(rowNo, sCols.lastNotifiedAt).setValue(new Date());
  logApproval_(approvalId, bookingId, 'SEND_APPROVAL_EMAIL', 'System', to + (cc ? ',' + cc : ''), stepNo, 'ส่งอีเมลแจ้งเตือนลงนาม');
  return true;
}

function insertImageAtPlaceholder_(presentation, placeholder, imageBlob, width, height, options) {
  // วางรูปลายเซ็นลงตำแหน่งเดียวกับกล่องข้อความ placeholder ใน Google Slides Template
  // จุดประสงค์คือให้ผู้ดูแลสามารถเลื่อนตำแหน่งลายเซ็นได้จาก Template โดยไม่ต้องแก้โค้ด
  const opt = options || {};
  const targetWidth = width || SIGNATURE_IMAGE_WIDTH;
  const targetHeight = height || SIGNATURE_IMAGE_HEIGHT;
  const offsetX = opt.offsetX || 0;
  const offsetY = opt.offsetY || 0;
  const replaceAll = opt.replaceAll === true;
  let insertedCount = 0;

  presentation.getSlides().forEach(slide => {
    slide.getPageElements().forEach(element => {
      if (!replaceAll && insertedCount > 0) return;
      if (element.getPageElementType() !== SlidesApp.PageElementType.SHAPE) return;

      const shape = element.asShape();
      const textRange = shape.getText();
      const text = textRange.asString();
      if (text.indexOf(placeholder) < 0) return;

      const left = shape.getLeft();
      const top = shape.getTop();
      const boxWidth = shape.getWidth();
      const boxHeight = shape.getHeight();
      const imageLeft = left + (boxWidth - targetWidth) / 2 + offsetX;
      const imageTop = top + (boxHeight - targetHeight) / 2 + offsetY;

      // ล้าง placeholder ออกก่อนแทรกรูป เพื่อไม่ให้ตัวอักษรสีน้ำเงินติดไปใน PDF
      textRange.setText('');
      slide.insertImage(imageBlob, imageLeft, imageTop, targetWidth, targetHeight);
      insertedCount++;
    });
  });

  return insertedCount > 0;
}

function clearTextPlaceholder_(presentation, placeholder, replacement) {
  // ใช้ล้าง placeholder ที่ไม่ใช่รูปภาพ เช่น {{APPROVAL_CHECK}} / {{REJECT_CHECK}}
  // และใช้เป็น fallback เพื่อไม่ให้ placeholder หลุดไปใน PDF
  const replaceValue = replacement === undefined || replacement === null ? '' : String(replacement);
  try {
    presentation.replaceAllText(placeholder, replaceValue);
  } catch (e) {}

  presentation.getSlides().forEach(slide => {
    slide.getPageElements().forEach(element => {
      if (element.getPageElementType() !== SlidesApp.PageElementType.SHAPE) return;
      try {
        const shape = element.asShape();
        const text = shape.getText().asString();
        if (text.indexOf(placeholder) >= 0) {
          shape.getText().setText(text.split(placeholder).join(replaceValue));
        }
      } catch (err) {}
    });
  });
}

function clearUnusedFinalMemoPlaceholders_(presentation) {
  const placeholders = [
    '{{GUESTSIGNATURE}}',
    '{{ROOMOFFICER_SIGNATURE}}',
    '{{BUILDING_SIGNATURE}}',
    '{{DEPUTY_SIGNATURE}}',
    '{{ROOMOFFICER_NAME}}',
    '{{ROOMOFFICER_POSITION}}',
    '{{ROOMOFFICER_SIGN_DATE}}',
    '{{BUILDING_NAME}}',
    '{{BUILDING_POSITION}}',
    '{{BUILDING_POSITION }}',
    '{{BUILDING_SIGN_DATE}}',
    '{{DEPUTY_NAME}}',
    '{{DEPUTY_POSITION}}',
    '{{DEPUTY_POSITION }}',
    '{{DEPUTY_SIGN_DATE}}',
    '{{DEPUTY_POSITION_SHORT}}',
    '{{APPROVAL_CHECK}}',
    '{{REJECT_CHECK}}'
  ];
  placeholders.forEach(ph => clearTextPlaceholder_(presentation, ph, ''));
}

function addApprovalSummarySlide_(presentation, booking, steps) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.insertTextBox('สรุปการลงนามดิจิทัลเอกสารขอใช้ห้องประชุม', 40, 30, 650, 30).getText().getTextStyle().setFontSize(18).setBold(true);
  slide.insertTextBox(`รหัสการจอง: ${booking.bookingId}\nหัวข้อ: ${booking.topic}\nห้องประชุม: ${booking.roomName}\nผู้จอง: ${booking.requester}`, 40, 70, 650, 80).getText().getTextStyle().setFontSize(11);
  let y = 170;
  steps.forEach(step => {
    slide.insertTextBox(`${step.stepNo}. ${step.stepName}\nผู้ลงนาม: ${step.approverName || '-'}\nวันเวลา: ${step.signedAt ? new Date(step.signedAt).toLocaleString('th-TH') : '-'}\nความเห็น: ${step.comment || '-'}`, 40, y, 360, 90).getText().getTextStyle().setFontSize(10);
    if (step.signatureFileId) {
      try {
        const blob = DriveApp.getFileById(step.signatureFileId).getBlob();
        slide.insertImage(blob, 430, y + 5, 150, 55);
      } catch(e) {}
    }
    y += 105;
  });
  slide.insertTextBox('เอกสารนี้ผ่านกระบวนการลงนามดิจิทัลในระบบ Meeting Room Booking System', 40, 500, 650, 30).getText().getTextStyle().setFontSize(9).setForegroundColor('#666666');
}

function generateFinalSignedMemoPdf_(approvalId) {
  const flow = findApprovalFlowById_(approvalId);
  const f = flow.cols;
  const bookingId = normalizeText_(getCell_(flow.row, f.bookingId));
  const booking = getBookingRecordObject_(bookingId);
  const steps = getApprovalStepsForApproval_(approvalId);
  let copyFile = null;
  try {
    const templateFile = DriveApp.getFileById(TEMPLATE_SLIDE_ID);
    const folder = DriveApp.getFolderById(FINAL_SIGNED_MEMO_FOLDER_ID);
    copyFile = templateFile.makeCopy(`TEMP_เอกสารลงนามครบ_${bookingId}`, folder);
    const presentation = SlidesApp.openById(copyFile.getId());
    const formatDateTime = (d) => new Date(d).toLocaleDateString('th-TH', {year:'numeric', month:'long', day:'numeric'}) + ' เวลา ' + new Date(d).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}) + ' น.';
    const safeReplace = (key, value) => { try { presentation.replaceAllText(key, value ? value.toString() : '-'); } catch(e) {} };
    const safeReplaceAllVariants = (keys, value) => keys.forEach(key => safeReplace(key, value));
    const stepPosition = (step, fallback) => normalizeText_(step && step.approverPosition) || normalizeText_(fallback) || normalizeText_(step && step.stepName) || '-';
    const stepPositionShort = (step, fallback) => normalizeText_(step && step.approverPositionShort) || stepPosition(step, fallback);
    safeReplace('{{BOOKINGNUMBER}}', booking.bookingId);
    safeReplace('{{DATENOW}}', toThaiDateString(new Date()));
    safeReplace('{{GUESTNAME}}', booking.requester);
    safeReplace('{{ROOM}}', booking.roomName);
    safeReplace('{{MEETINGTOPIC}}', booking.topic);
    safeReplace('{{PEOPLE}}', booking.headcount);
    safeReplace('{{START}}', formatDateTime(booking.start));
    safeReplace('{{END}}', formatDateTime(booking.end));
    safeReplace('{{GUESTEMAIL}}', booking.requesterEmail);
    safeReplace('{{LAYOUT}}', booking.setupDetails || 'ไม่มีระบุ');
    const roomOfficer = steps.find(s => s.stepNo === 1) || {};
    const building = steps.find(s => s.stepNo === 2) || {};
    const deputy = steps.find(s => s.stepNo === 3) || {};
    safeReplace('{{ROOMOFFICER}}', roomOfficer.approverName || roomOfficer.stepName || '-');
    safeReplace('{{ROOMOFFICER_NAME}}', roomOfficer.approverName || '-');
    safeReplace('{{ROOMOFFICER_POSITION}}', stepPosition(roomOfficer, 'ผู้รับผิดชอบห้องประชุม'));
    safeReplace('{{ROOMOFFICER_SIGN_DATE}}', roomOfficer.signedAt ? toThaiDateString(new Date(roomOfficer.signedAt)) : '-');
    safeReplace('{{BUILDING_NAME}}', building.approverName || '-');
    safeReplaceAllVariants(['{{BUILDING_POSITION}}', '{{BUILDING_POSITION }}'], stepPosition(building, 'กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม'));
    safeReplace('{{BUILDING_SIGN_DATE}}', building.signedAt ? toThaiDateString(new Date(building.signedAt)) : '-');
    safeReplace('{{DEPUTY_NAME}}', deputy.approverName || '-');
    safeReplaceAllVariants(['{{DEPUTY_POSITION}}', '{{DEPUTY_POSITION }}'], stepPosition(deputy, deputy.stepName || 'รองผู้อำนวยการ'));
    safeReplace('{{DEPUTY_POSITION_SHORT}}', stepPositionShort(deputy, deputy.stepName || 'รองผู้อำนวยการ'));
    safeReplace('{{DEPUTY_SIGN_DATE}}', deputy.signedAt ? toThaiDateString(new Date(deputy.signedAt)) : '-');

    // แสดงผลว่าเอกสารผ่านการอนุญาตแล้วใน Template
    // ใช้เครื่องหมาย / แบบตัวอักษรธรรมดาในช่องอนุญาต เพื่อความเป็นทางการและไม่ให้ Gmail/Drive แปลงเป็น emoji
    // ช่องไม่อนุญาตปล่อยว่าง เพื่อลดกรอบ/สัญลักษณ์รบกวนใน PDF
    clearTextPlaceholder_(presentation, '{{APPROVAL_CHECK}}', '/');
    clearTextPlaceholder_(presentation, '{{REJECT_CHECK}}', '');

    // วางลายเซ็นผู้จองและผู้ลงนามตามตำแหน่ง placeholder ใน Slide Template
    // หากต้องการเลื่อนตำแหน่ง ให้เลื่อนกล่อง placeholder ใน Google Slides ได้โดยตรง
    if (booking.signatureFileId) {
      try {
        insertImageAtPlaceholder_(presentation, '{{GUESTSIGNATURE}}', DriveApp.getFileById(booking.signatureFileId).getBlob(), SIGNATURE_IMAGE_WIDTH, SIGNATURE_IMAGE_HEIGHT, { offsetY: 0 });
      } catch(e) {
        console.warn('ไม่สามารถวางลายเซ็นผู้จองได้: ' + e.message);
      }
    }

    [
      ['{{ROOMOFFICER_SIGNATURE}}', roomOfficer],
      ['{{BUILDING_SIGNATURE}}', building],
      ['{{DEPUTY_SIGNATURE}}', deputy]
    ].forEach(pair => {
      const placeholder = pair[0];
      const step = pair[1] || {};
      if (step.signatureFileId) {
        try {
          insertImageAtPlaceholder_(presentation, placeholder, DriveApp.getFileById(step.signatureFileId).getBlob(), SIGNATURE_IMAGE_WIDTH, SIGNATURE_IMAGE_HEIGHT, { offsetY: 0 });
        } catch(e) {
          console.warn('ไม่สามารถวางลายเซ็นที่ ' + placeholder + ': ' + e.message);
        }
      }
    });

    // ล้าง placeholder ที่อาจเหลืออยู่ เพื่อไม่ให้ข้อความสีน้ำเงินหลุดไปใน PDF
    clearUnusedFinalMemoPlaceholders_(presentation);

    if (ADD_APPROVAL_SUMMARY_SLIDE === true) {
      addApprovalSummarySlide_(presentation, booking, steps);
    }
    presentation.saveAndClose();
    Utilities.sleep(3000);
    const pdfName = `บันทึกข้อความลงนามครบถ้วน_${bookingId}.pdf`;
    const pdfBlob = copyFile.getAs(MimeType.PDF).setName(pdfName);
    const pdfFile = folder.createFile(pdfBlob).setName(pdfName);
    try { pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
    copyFile.setTrashed(true);
    return { url: pdfFile.getUrl(), fileId: pdfFile.getId(), blob: pdfBlob, name: pdfName };
  } catch (e) {
    if (copyFile) { try { copyFile.setTrashed(true); } catch(cleanupErr) {} }
    throw new Error('สร้าง PDF ฉบับลงนามครบถ้วนไม่สำเร็จ: ' + e.message);
  }
}

function finalizeApprovalFlow_(approvalId, actorName, actorEmail) {
  const result = generateFinalSignedMemoPdf_(approvalId);
  const flow = findApprovalFlowById_(approvalId);
  const c = flow.cols;
  flow.sheet.getRange(flow.rowNo, c.overallStatus).setValue('COMPLETED');
  flow.sheet.getRange(flow.rowNo, c.finalSignedPdfUrl).setValue(result.url);
  flow.sheet.getRange(flow.rowNo, c.finalSignedPdfFileId).setValue(result.fileId);
  flow.sheet.getRange(flow.rowNo, c.completedAt).setValue(new Date());
  flow.sheet.getRange(flow.rowNo, c.updatedAt).setValue(new Date());
  const bookingId = normalizeText_(getCell_(flow.row, c.bookingId));
  try { markBookingApproved_(bookingId, 'ลงนามเอกสารครบทุกขั้นแล้ว | Final PDF: ' + result.url); } catch (e) { logAction('System', 'Booking Approved Status Error', `Booking ID: ${bookingId} | ${e.message}`); }
  logApproval_(approvalId, bookingId, 'GENERATE_FINAL_PDF', actorName || 'System', actorEmail || '', 3, result.url);
  sendApprovalCompletedEmail_(approvalId, result.url);
  return result;
}

function sendApprovalCompletedEmail_(approvalId, finalPdfUrl) {
  const flow = findApprovalFlowById_(approvalId);
  const c = flow.cols;
  const requesterEmail = normalizeText_(getCell_(flow.row, c.requesterEmail));
  if (!isValidEmail_(requesterEmail)) return;
  const bookingId = normalizeText_(getCell_(flow.row, c.bookingId));
  const topic = normalizeText_(getCell_(flow.row, c.topic));
  const roomName = normalizeText_(getCell_(flow.row, c.roomName));
  const requester = normalizeText_(getCell_(flow.row, c.requester));
  const content = `
    <p style="font-size:16px; color:#333; line-height:1.7;">เรียน ${escapeHtml_(requester)},<br>เอกสารบันทึกข้อความขอใช้ห้องประชุมของท่านผ่านการลงนามครบถ้วนแล้ว</p>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <tr><td style="padding:8px; color:#666; width:30%;">รหัสการจอง:</td><td style="padding:8px; font-weight:bold;">${escapeHtml_(bookingId)}</td></tr>
      <tr><td style="padding:8px; color:#666;">หัวข้อ:</td><td style="padding:8px;">${escapeHtml_(topic)}</td></tr>
      <tr><td style="padding:8px; color:#666;">ห้องประชุม:</td><td style="padding:8px;">${escapeHtml_(roomName)}</td></tr>
    </table>
    <div style="text-align:center; margin:28px 0;"><a href="${escapeHtml_(finalPdfUrl)}" style="background:#198754; color:white; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:bold;">เปิดไฟล์เอกสารที่ลงนามครบถ้วน</a></div>
  `;
  MailApp.sendEmail({ to: requesterEmail, subject: `✅ เอกสารลงนามครบถ้วน: ${topic}`, htmlBody: createBaseEmailTemplate('เอกสารลงนามครบถ้วนแล้ว', content, EMAIL_THEME.success), name: 'Meeting Room System' });
  logApproval_(approvalId, bookingId, 'SEND_COMPLETION_EMAIL', 'System', requesterEmail, 3, finalPdfUrl);
}

function sendApprovalRejectedEmail_(approvalId, reason) {
  const flow = findApprovalFlowById_(approvalId);
  const c = flow.cols;
  const requesterEmail = normalizeText_(getCell_(flow.row, c.requesterEmail));
  if (!isValidEmail_(requesterEmail)) return;
  const topic = normalizeText_(getCell_(flow.row, c.topic));
  const content = `<p>เอกสารขอใช้ห้องประชุมหัวข้อ <strong>${escapeHtml_(topic)}</strong> ไม่ได้รับการอนุมัติหรือถูกส่งกลับแก้ไข</p><p><strong>เหตุผล:</strong> ${escapeHtml_(reason)}</p>`;
  MailApp.sendEmail({ to: requesterEmail, subject: `⚠️ เอกสารถูกส่งกลับ/ไม่อนุมัติ: ${topic}`, htmlBody: createBaseEmailTemplate('เอกสารถูกส่งกลับ/ไม่อนุมัติ', content, EMAIL_THEME.warning), name: 'Meeting Room System' });
}

function sendPendingApprovalReminders() {
  ensureDatabaseSchema_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stepSheet = ss.getSheetByName(SHEET_APPROVAL_STEPS);
  const cols = getApprovalStepCols_(stepSheet);
  const rows = stepSheet.getDataRange().getValues();
  const now = new Date();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (normalizeText_(getCell_(row, cols.status)) !== 'PENDING') continue;
    const last = new Date(getCell_(row, cols.lastNotifiedAt));
    if (isNaN(last.getTime()) || now.getTime() - last.getTime() >= 24 * 60 * 60 * 1000) {
      try { sendApprovalRequestEmail_(normalizeText_(getCell_(row, cols.approvalId)), parseInt(getCell_(row, cols.stepNo), 10)); } catch(e) { logAction('System', 'Approval Reminder Error', e.message); }
    }
  }
}

function getApprovalAdminOverview(sessionToken) {
  ensureDatabaseSchema_();
  requireUser_(sessionToken, ['Admin', 'Officer']);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const flowSheet = ss.getSheetByName(SHEET_APPROVAL_FLOW);
  const cols = getApprovalFlowCols_(flowSheet);
  const rows = flowSheet.getDataRange().getValues().slice(1).filter(row => normalizeText_(getCell_(row, cols.approvalId)));
  return rows.map(row => ({
    approvalId: normalizeText_(getCell_(row, cols.approvalId)),
    bookingId: normalizeText_(getCell_(row, cols.bookingId)),
    topic: normalizeText_(getCell_(row, cols.topic)),
    roomName: normalizeText_(getCell_(row, cols.roomName)),
    requester: normalizeText_(getCell_(row, cols.requester)),
    currentStep: normalizeText_(getCell_(row, cols.currentStep)),
    currentApproverRole: normalizeText_(getCell_(row, cols.currentApproverRole)),
    currentApproverEmail: normalizeText_(getCell_(row, cols.currentApproverEmail)),
    status: normalizeText_(getCell_(row, cols.overallStatus)),
    finalSignedPdfUrl: normalizeText_(getCell_(row, cols.finalSignedPdfUrl)),
    updatedAt: getCell_(row, cols.updatedAt) instanceof Date ? Utilities.formatDate(getCell_(row, cols.updatedAt), Session.getScriptTimeZone() || 'Asia/Bangkok', 'yyyy-MM-dd HH:mm') : normalizeText_(getCell_(row, cols.updatedAt))
  })).reverse().slice(0, 50);
}

function resendCurrentApprovalLinkByAdmin(approvalId, sessionToken) {
  const user = requireUser_(sessionToken, ['Admin']);
  const flow = findApprovalFlowById_(approvalId);
  const c = flow.cols;
  const status = normalizeText_(getCell_(flow.row, c.overallStatus));
  if (!['PENDING_ROOM_OFFICER', 'PENDING_BUILDING_GROUP', 'PENDING_DEPUTY_DIRECTOR'].includes(status)) throw new Error('เอกสารนี้ไม่ได้อยู่ในสถานะรอลงนาม');
  const stepNo = parseInt(getCell_(flow.row, c.currentStep), 10);
  sendApprovalRequestEmail_(approvalId, stepNo);
  logApproval_(approvalId, normalizeText_(getCell_(flow.row, c.bookingId)), 'ADMIN_RESEND_APPROVAL_LINK', formatUserForLog_(user), '', stepNo, 'ส่งลิงก์ลงนามซ้ำจากหน้า Admin');
  return 'ส่งลิงก์ลงนามซ้ำเรียบร้อยแล้ว';
}

function adminCreateApprovalFlowForBooking(bookingId, sessionToken) {
  const user = requireUser_(sessionToken, ['Admin']);
  const result = startApprovalWorkflowSafely_(bookingId, formatUserForLog_(user), 'ADMIN_CREATE_OR_RESET');
  if (!result.created) throw new Error(result.error || result.message || 'สร้างกระบวนการลงนามใหม่ไม่สำเร็จ');
  return result;
}

function testAuth() {
  SlidesApp.create("Test Permission");
}

/**
 * Run once from Apps Script Editor before production use.
 * Creates/repairs Approval sheets and default Approvers rows.
 */
function setupApprovalSystem() {
  ensureDatabaseSchema_();
  return "สร้าง/ตรวจสอบชีทระบบ Approval และคอลัมน์ที่จำเป็นเรียบร้อยแล้ว";
}
