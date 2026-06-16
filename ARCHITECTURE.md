# สถาปัตยกรรมระบบ

## ส่วนประกอบหลัก

ระบบประกอบด้วย 4 ชั้น

1. **Client UI**: `index.html`, `javascript.html`, `stylesheet.html`, `approve.html`, `evaluate.html`
2. **Server Logic**: `Code.gs`
3. **Database**: Google Sheets หลายชีท เช่น `Rooms`, `Bookings`, `ApprovalFlow`, `ApprovalSteps`
4. **Google Services**: Drive สำหรับไฟล์, Slides สำหรับ template PDF, MailApp สำหรับอีเมล

## หน้าเว็บหลัก

`doGet()` เป็น entry point ของ Web App

- ไม่มี `page` หรือ `page=index` → หน้า `index.html`
- `?page=approve&token=...` → หน้า `approve.html`
- `?page=evaluate&bid=...` → หน้า `evaluate.html`

## Flow การจอง

```text
index.html / javascript.html
↓ google.script.run.saveBooking()
Code.gs / saveBooking()
↓
Bookings + Drive + Slides + Mail
↓
ApprovalFlow / ApprovalSteps
```

## Flow การลงนาม

```text
approve.html
↓ getApprovalDetailsByToken(token)
ตรวจ token + flow + step + booking status
↓
submitApprovalSignature()
ตรวจซ้ำก่อนบันทึกจริง
↓
advanceApprovalStep_()
↓
finalizeApprovalFlow_() เมื่อครบทุกขั้น
```

## Flow การประเมิน

```text
sendPostMeetingSurvey()
↓
ส่งลิงก์ evaluate
↓
evaluate.html
↓
getBookingDetailsForEval()
↓
submitEvaluation()
↓
Evaluate sheet
↓
sendEvaluationSummary()
```

## จุดควบคุมความถูกต้อง

| จุดควบคุม | ฟังก์ชัน |
|---|---|
| ตรวจเวลาชน | `saveBooking()` + `isBookingBlockingRoom_()` |
| ตรวจสถานะการแสดงปฏิทิน | `getBookingsData()` + `isBookingVisibleOnCalendar_()` |
| ตรวจสิทธิ์ลงนาม | `getApprovalDetailsByToken()` + `assertBookingCanBeApproved_()` |
| ป้องกัน submit หลังยกเลิก | `submitApprovalSignature()` + `assertBookingCanBeApproved_()` |
| ปิด workflow หลังยกเลิก | `cancelApprovalFlowForBooking_()` |
| เปลี่ยนเป็น Approved | `finalizeApprovalFlow_()` |

## หลักการ transaction

`saveBooking()` ใช้ `LockService` เพื่อป้องกันการจองชนกันขณะบันทึกพร้อมกัน และมีตัวแปร rollback สำหรับไฟล์บางส่วนที่สร้างแล้วหากเกิด error ระหว่างทาง

อย่างไรก็ตาม Google Apps Script ไม่ใช่ฐานข้อมูล transaction จริง จึงต้องมี log และฟังก์ชันซ่อมข้อมูล เช่น `repairCancelledBookingApprovalFlows()` สำหรับกรณีข้อมูลเก่าหรือ edge case
