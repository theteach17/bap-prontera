# R2 — 25 พฤศจิกายน 2569

- Redesign app shell, navigation, three-step booking, request timeline, profile and shared visual design.
- Added optional final PDF worker, maintenance blocking, QR, room display and weekly planner; analytics.
- 102 mock/static checks, 15 Chromium mocked checks and QR decode passed. See R2_REQUIREMENTS.md for incomplete scope and runtime gates.

# R1.1 — Production risk audit (25 November 2026)

- Require matching Workspace identity before saved-signature receipt recovery.
- Invalidate prior approval workflows before an edit writes booking data; mark Approval Error on interrupted edit. Protect current step and reject duplicate tokens; check generated approval IDs for collisions.
- Preserve committed booking on notification/log failures; return explicit warnings and preserve workflow recovery; support multiple configured approver emails.
- Require final PDF evidence for status repair and avoid reporting completed approval when booking update fails.
- Reject invalid/ambiguous legacy credentials; sanitize log/reason spreadsheet text; lock evaluation submission and align survey windows.
- Serialize admin resend and renew expired tokens. Match metadata headers case-insensitively.
- Add read-only `pronteraProductionPreflight()`; expand mocked regression suite from 42 to 85 checks and instrument 238 server function entries.
- Keep manifest, UI source, trigger handler names and existing production resource defaults unchanged from R1.

See `AUDIT_R1_1.md`, `DIRECT_PRODUCTION.md`, `TEST_REPORT.txt`. No production runtime test or deployment was performed.

---

# Changelog

## Current Documented Version

สถานะ: ทดสอบ flow สำคัญผ่านแล้วตามรายงานผู้ใช้

### ปรับปรุงเอกสาร

- สร้าง `README.md` ฉบับสมบูรณ์
- สร้าง `CONTEXT.md` เพื่อเก็บบริบทและเหตุผลการออกแบบ
- เพิ่มเอกสารใน `docs/` สำหรับ architecture, schema, function map, operations, triggers, test plan และ troubleshooting

## Cancel Approval Guard Fix

### แก้ไขสำคัญ

- แก้ `cancelApprovalFlowForBooking_()` ให้ไม่ error จาก `keepApprovalId`
- เมื่อยกเลิก booking ให้ปิด active `ApprovalFlow` เป็น `CANCELLED`
- เปลี่ยน `ApprovalSteps` ที่ยัง `PENDING/WAITING` เป็น `CANCELLED`
- เพิ่ม guard ใน `getApprovalDetailsByToken()` เพื่อไม่เปิดฟอร์มลงนามหาก booking เป็น `Cancelled` หรือ `Rejected`
- เพิ่ม guard ใน `submitApprovalSignature()` เพื่อป้องกัน submit หลังรายการถูกยกเลิก แม้เปิดหน้าอนุมัติค้างไว้
- เพิ่ม `repairCancelledBookingApprovalFlows()` สำหรับซ่อมข้อมูลเก่า

## Status Workflow Fix

### แก้ไขสำคัญ

- เพิ่ม `BOOKING_STATUS` model กลาง
- เปลี่ยนการจองใหม่เป็น `Pending Approval` แทน `Approved`
- กำหนดให้ `Approval Error` ยังแสดงในปฏิทินและกันห้อง
- ให้ reminder/evaluation ทำงานเฉพาะ `Approved`
- เพิ่ม helper กลางสำหรับการตีความ status
- แก้การเรียก `requireAdmin_()` ที่ไม่มีอยู่จริงให้ใช้ `requireUser_(sessionToken, ['Admin'])`

## Original System

ระบบเดิมรองรับ

- จองห้องประชุม
- ตรวจชนเวลา
- สร้าง memo PDF
- ส่งอีเมล
- admin CRUD
- dashboard
- แบบประเมิน
- approval workflow 3 ขั้น

## Next Generation R1 — 2026-11-25

- Added SignatureService.gs, PronteraServices.gs, PronteraOperations.gs, SignatureComponents.html.
- Saved-signature profiles and private version snapshots, verified Workspace use, optional strict flags; first-use and change UI on booking and approval pages.
- Booking conflict exclusion fix, durable submission receipt, shared cancellation/repair lock, session expiry and role verification, private helper RPCs, limited calendar fields, strict snapshot integrity for final PDF.
- Workspace login, scoped My Bookings/Approval Inbox, availability finder, mobile agenda, preparation queue, health summary, range payload and approval overview batch join.
- Test mode and documented config overrides, 42 offline checks. No production runtime tests or deployment.
- R1 is a bounded controlled-release candidate. Background job queue and other remaining roadmap items documented in README.
