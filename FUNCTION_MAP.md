# Function Map

ไฟล์ `Code.gs` เวอร์ชันนี้มีฟังก์ชันทั้งหมด **150** ฟังก์ชัน รายการด้านล่างจัดกลุ่มตามหน้าที่ พร้อมเลขบรรทัดโดยประมาณในไฟล์
## Booking Status Model
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `normalizeBookingStatus_()` | 86 | helper ภายในระบบ |
| `getBookingStatusLabel_()` | 98 | helper ภายในระบบ |
| `isBookingReleased_()` | 103 | helper ภายในระบบ |
| `isBookingBlockingRoom_()` | 108 | helper ภายในระบบ |
| `isBookingVisibleOnCalendar_()` | 117 | helper ภายในระบบ |
| `isBookingEligibleForOperationalReminder_()` | 121 | helper ภายในระบบ |
| `isBookingEligibleForEvaluation_()` | 125 | helper ภายในระบบ |
| `getBookingCalendarTitle_()` | 129 | helper ภายในระบบ |
| `setBookingStatusByRow_()` | 137 | helper ภายในระบบ |
| `setBookingStatusById_()` | 147 | helper ภายในระบบ |
| `markBookingApprovalError_()` | 162 | helper ภายในระบบ |
| `markBookingPendingApproval_()` | 174 | helper ภายในระบบ |
| `markBookingApproved_()` | 180 | helper ภายในระบบ |
| `markBookingRejected_()` | 186 | helper ภายในระบบ |

## Approval Guard / Cancel Safety
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `isApprovalFlowPendingStatus_()` | 203 | helper ภายในระบบ |
| `isApprovalFlowTerminalStatus_()` | 207 | helper ภายในระบบ |
| `isApprovalStepOpenStatus_()` | 211 | helper ภายในระบบ |
| `getBookingStatusById_()` | 215 | helper ภายในระบบ |
| `assertBookingCanBeApproved_()` | 219 | helper ภายในระบบ |
| `cancelApprovalFlowForBooking_()` | 3177 | helper ภายในระบบ |
| `repairCancelledBookingApprovalFlows()` | 3228 | ซ่อมข้อมูลเก่าที่ booking ถูกยกเลิกแต่ flow ยัง active |

## Common Utilities and URL
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `normalizeText_()` | 231 | helper ภายในระบบ |
| `escapeHtml_()` | 235 | helper ภายในระบบ |
| `sanitizePlainText_()` | 244 | helper ภายในระบบ |
| `isValidEmail_()` | 249 | helper ภายในระบบ |
| `isSent_()` | 253 | helper ภายในระบบ |
| `sameDate_()` | 257 | helper ภายในระบบ |
| `extractDeploymentIdFromUrl_()` | 261 | helper ภายในระบบ |
| `normalizeWebAppBaseUrl_()` | 269 | helper ภายในระบบ |
| `getWebAppUrl_()` | 290 | helper ภายในระบบ |
| `buildEvaluationUrl_()` | 306 | helper ภายในระบบ |
| `buildApprovalUrl_()` | 310 | helper ภายในระบบ |
| `setWebAppUrlOverride()` | 316 | บันทึก Web App URL หลักใน Script Properties |
| `clearWebAppUrlOverride()` | 326 | ลบ Web App URL override |
| `testCurrentEvaluationBaseUrl()` | 331 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |

## Schema and Sheet Mapping
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `ensureDatabaseSchema_()` | 338 | helper ภายในระบบ |
| `ensureSheetWithHeaders_()` | 369 | helper ภายในระบบ |
| `ensureApprovalSchema_()` | 394 | helper ภายในระบบ |
| `ensureDefaultApproverRows_()` | 403 | helper ภายในระบบ |
| `getHeaderMap_()` | 488 | helper ภายในระบบ |
| `findColumn_()` | 498 | helper ภายในระบบ |
| `getBookingCols_()` | 506 | helper ภายในระบบ |
| `getCell_()` | 533 | helper ภายในระบบ |
| `buildBookingObjectFromRow_()` | 537 | helper ภายในระบบ |
| `generateBookingId_()` | 559 | helper ภายในระบบ |

## Rooms
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `getActiveRooms_()` | 571 | helper ภายในระบบ |
| `getRoomById_()` | 598 | helper ภายในระบบ |
| `getRoomsData()` | 755 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |

## Authentication and Admin CRUD
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `createSession_()` | 604 | helper ภายในระบบ |
| `getSession_()` | 622 | helper ภายในระบบ |
| `requireUser_()` | 643 | helper ภายในระบบ |
| `formatUserForLog_()` | 653 | helper ภายในระบบ |
| `formatUserForPublicDisplay_()` | 658 | helper ภายในระบบ |
| `refreshSession()` | 663 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `logoutSession()` | 669 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `assertEditableSheet_()` | 678 | helper ภายในระบบ |
| `assertViewableSheet_()` | 686 | helper ภายในระบบ |
| `hashPassword()` | 1749 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `checkLogin()` | 1763 | ตรวจ login admin/officer |
| `getSheetNames()` | 859 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `getSheetData()` | 864 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `crudSaveRow()` | 1791 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `crudDeleteRow()` | 888 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `convertExistingPasswordsToHash()` | 1852 | แปลงรหัสผ่านเดิมเป็น hash |

## Web Routing and Logs
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `doGet()` | 697 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `include()` | 730 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `logAction()` | 736 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |

## Booking Management
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `getBookingsData()` | 760 | ส่งข้อมูล event ไปแสดงบนปฏิทิน |
| `cancelBooking()` | 802 | ยกเลิกรายการจองและปิด approval flow ที่เกี่ยวข้อง |
| `saveBooking()` | 1872 | บันทึก/แก้ไขรายการจอง ตรวจเวลาชน สร้าง PDF และเริ่ม workflow |

## Email and Notifications
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `createEmailTemplate()` | 914 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `sendDailySummaryToAdmins()` | 1011 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `sendOneDayAdvanceReminder()` | 1100 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `sendUrgentReminders()` | 1125 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `sendReminderEmail()` | 1153 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `createBaseEmailTemplate()` | 1201 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `sendPostMeetingSurvey()` | 1231 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `sendEvaluationEmail()` | 1263 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `extractEmailList_()` | 2124 | helper ภายในระบบ |
| `uniqueEmailList_()` | 2131 | helper ภายในระบบ |
| `getAdminNotificationRecipients_()` | 2146 | helper ภายในระบบ |
| `getOfficerRecipientsForRoom_()` | 2201 | helper ภายในระบบ |
| `getMemoPdfBlobForEmail_()` | 2229 | helper ภายในระบบ |
| `sendAdminMemoEmail_()` | 2251 | helper ภายในระบบ |
| `sendEmailNotifications()` | 2279 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `buildCancellationEmailHtml_()` | 2347 | helper ภายในระบบ |
| `sendCancellationNotifications_()` | 2382 | helper ภายในระบบ |

## Evaluation
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `getEvaluationAvailabilityForBooking_()` | 1304 | helper ภายในระบบ |
| `getBookingOptionsForEvaluationResend()` | 1344 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `resendEvaluationEmailForBooking()` | 1393 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `getEvaluationUrlForBooking()` | 1441 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `getBookingDetailsForEval()` | 1448 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `submitEvaluation()` | 1504 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `sendEvaluationSummary()` | 1680 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |

## Drive Upload and PDF Assets
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `validateBase64Upload_()` | 1559 | helper ภายในระบบ |
| `uploadSetupFileToDrive()` | 1580 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `uploadSignatureImageToDrive_()` | 1599 | helper ภายในระบบ |
| `getSignatureImageBlobForMemo_()` | 1622 | helper ภายในระบบ |
| `extractDriveFileId_()` | 1645 | helper ภายในระบบ |
| `copyExistingMemoPdf_()` | 1656 | helper ภายในระบบ |

## Dashboard and Memo
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `getDashboardData()` | 2410 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `getBookingOptionsForMemo()` | 2528 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `findBookingRowById_()` | 2568 | helper ภายในระบบ |
| `adminGenerateMemoPdf()` | 2581 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `generatePDFMemo()` | 2673 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `toThaiDateString()` | 2807 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |

## Approver Configuration
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `getApprovalFlowCols_()` | 2822 | helper ภายในระบบ |
| `getApprovalStepCols_()` | 2846 | helper ภายในระบบ |
| `getApproverCols_()` | 2874 | helper ภายในระบบ |
| `isApproverActive_()` | 2890 | helper ภายในระบบ |
| `roomMatchesApprover_()` | 2895 | helper ภายในระบบ |
| `isDeputyRoleKey_()` | 2916 | helper ภายในระบบ |
| `getApproverPosition_()` | 2921 | helper ภายในระบบ |
| `getApproverPositionShort_()` | 2925 | helper ภายในระบบ |
| `getApproverConfigs_()` | 2929 | helper ภายในระบบ |
| `getApproverConfig_()` | 2998 | helper ภายในระบบ |
| `validateApprovalApproverConfig()` | 3003 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `validateRoomBasedStep2Config_()` | 3053 | helper ภายในระบบ |
| `getBookingRecordObject_()` | 3057 | helper ภายในระบบ |
| `createApprovalId_()` | 3090 | helper ภายในระบบ |
| `createApprovalToken_()` | 3094 | helper ภายในระบบ |
| `logApproval_()` | 3098 | helper ภายในระบบ |
| `getStepOneOfficerConfig_()` | 3108 | helper ภายในระบบ |
| `resolveApprovalStepConfigs_()` | 3136 | helper ภายในระบบ |

## Approval Workflow
| ฟังก์ชัน | บรรทัด | หน้าที่โดยย่อ |
|---|---:|---|
| `supersedeApprovalFlowsForBooking_()` | 3248 | helper ภายในระบบ |
| `startApprovalWorkflowSafely_()` | 3278 | helper ภายในระบบ |
| `createApprovalFlowForBooking_()` | 3296 | helper ภายในระบบ |
| `findApprovalFlowById_()` | 3338 | helper ภายในระบบ |
| `findApprovalStepByToken_()` | 3352 | helper ภายในระบบ |
| `getApprovalStepsForApproval_()` | 3366 | helper ภายในระบบ |
| `getApprovalDetailsByToken()` | 3391 | โหลดข้อมูลหน้าลงนามและตรวจ token/สถานะ |
| `uploadApprovalSignature_()` | 3455 | helper ภายในระบบ |
| `submitApprovalSignature()` | 3474 | บันทึกการลงนามหรือการไม่อนุมัติ พร้อม guard ก่อน submit |
| `rejectApprovalFlow_()` | 3542 | ปิด workflow แบบไม่อนุมัติและเปลี่ยน booking เป็น Rejected |
| `advanceApprovalStep_()` | 3553 | helper ภายในระบบ |
| `sendApprovalRequestEmail_()` | 3589 | helper ภายในระบบ |
| `insertImageAtPlaceholder_()` | 3636 | helper ภายในระบบ |
| `clearTextPlaceholder_()` | 3674 | helper ภายในระบบ |
| `clearUnusedFinalMemoPlaceholders_()` | 3696 | helper ภายในระบบ |
| `addApprovalSummarySlide_()` | 3720 | helper ภายในระบบ |
| `generateFinalSignedMemoPdf_()` | 3738 | helper ภายในระบบ |
| `finalizeApprovalFlow_()` | 3832 | ปิด workflow เมื่อเซ็นครบและเปลี่ยน booking เป็น Approved |
| `sendApprovalCompletedEmail_()` | 3848 | helper ภายในระบบ |
| `sendApprovalRejectedEmail_()` | 3870 | helper ภายในระบบ |
| `sendPendingApprovalReminders()` | 3880 | ส่งเตือนผู้ลงนามที่ค้างอยู่ |
| `getApprovalAdminOverview()` | 3897 | ฟังก์ชันที่ถูกเรียกจาก client, trigger หรือ admin |
| `resendCurrentApprovalLinkByAdmin()` | 3919 | ส่งลิงก์ลงนามปัจจุบันซ้ำโดย admin |
| `adminCreateApprovalFlowForBooking()` | 3931 | ให้ admin สร้าง/reset workflow ใหม่ |
| `testAuth()` | 3938 | ทดสอบสิทธิ์ Google services |
| `setupApprovalSystem()` | 3946 | ตั้งค่า schema ระบบอนุมัติ |
