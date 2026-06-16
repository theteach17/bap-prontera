# Integrity Report

## ไฟล์ source ที่ตรวจพบ

| ไฟล์ | สถานะ |
|---|---|
| `Code.gs` | มีอยู่ |
| `index.html` | มีอยู่ |
| `javascript.html` | มีอยู่ |
| `stylesheet.html` | มีอยู่ |
| `approve.html` | มีอยู่ |
| `evaluate.html` | มีอยู่ |
| `appsscript.json` | มีอยู่ |

## จำนวนฟังก์ชัน

`Code.gs` มีฟังก์ชันทั้งหมด **150** ฟังก์ชัน

## Static syntax check

ตรวจโดยคัดลอก `Code.gs` เป็น `.js` แล้วใช้ `node --check` ผลคือผ่าน

ไฟล์ฝั่ง client ที่ตรวจ script ผ่าน

- `javascript.html`
- `approve.html`
- `evaluate.html`

หมายเหตุ: การตรวจนี้เป็น static syntax check ไม่ใช่การรันจริงใน Apps Script environment จึงยังต้องทดสอบกับ Google Sheet, Drive, Slides, MailApp และ deployment จริง

## ฟังก์ชันที่เพิ่มหลังแก้ cancel approval guard

- `assertBookingCanBeApproved_()`
- `getBookingStatusById_()`
- `isApprovalFlowPendingStatus_()`
- `isApprovalFlowTerminalStatus_()`
- `isApprovalStepOpenStatus_()`
- `repairCancelledBookingApprovalFlows()`

## ฟังก์ชันสำคัญที่ต้องมีเสมอ

- `saveBooking()`
- `getBookingsData()`
- `cancelBooking()`
- `getApprovalDetailsByToken()`
- `submitApprovalSignature()`
- `finalizeApprovalFlow_()`
- `rejectApprovalFlow_()`
- `sendPostMeetingSurvey()`
- `sendEvaluationSummary()`
- `getDashboardData()`
- `adminCreateApprovalFlowForBooking()`
- `resendCurrentApprovalLinkByAdmin()`
