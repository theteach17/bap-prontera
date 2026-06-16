# Troubleshooting

## จองสำเร็จแต่ไม่มีอีเมลลงนาม

สาเหตุที่เป็นไปได้

- อีเมลผู้ลงนามใน `Approvers` ว่างหรือผิด
- MailApp quota เต็ม
- Web App URL ไม่ถูกต้อง
- `ApprovalFlow` ถูกสร้างแต่ `sendApprovalRequestEmail_()` error

แนวทางตรวจ

1. ดู `ApprovalLogs`
2. ตรวจ `Approvers`
3. รัน `testCurrentEvaluationBaseUrl()`
4. ให้ admin ส่งลิงก์ซ้ำผ่านหน้า admin หรือ `resendCurrentApprovalLinkByAdmin()`

## ลิงก์ลงนามเปิดไม่ได้

สาเหตุที่เป็นไปได้

- token หมดอายุ
- step ไม่ใช่ `PENDING`
- flow เป็น `SUPERSEDED`, `CANCELLED`, `REJECTED`, `COMPLETED`
- booking เป็น `Cancelled` หรือ `Rejected`

แนวทางตรวจ

1. ดู `ApprovalSteps.Status`
2. ดู `ApprovalFlow.Overall Status`
3. ดู `Bookings.Status`
4. ตรวจว่าเป็นลิงก์จากอีเมลล่าสุดหรือไม่

## รายการถูกยกเลิกแต่ยังเปิดลิงก์ลงนามได้

ในเวอร์ชันปัจจุบันไม่ควรเกิด หากเป็นข้อมูลเก่าก่อนอัปเดต ให้รัน

```javascript
repairCancelledBookingApprovalFlows()
```

ถ้ายังเกิดอีก ให้ตรวจ log จาก `cancelApprovalFlowForBooking_()`

## ปฏิทินไม่แสดงรายการ

ตรวจว่า `Bookings.Status` เป็นสถานะที่แสดงในปฏิทินหรือไม่

แสดงในปฏิทิน:

- `Pending Approval`
- `Approved`
- `Approval Error`

ไม่แสดงทั่วไป:

- `Cancelled`
- `Rejected`

## จองซ้ำช่วงเวลาเดิมได้ผิดปกติ

ตรวจว่ารายการเดิมมี status ที่กันห้องหรือไม่ และฟังก์ชันตรวจชนใช้ `isBookingBlockingRoom_()` หรือไม่

## สร้าง PDF ไม่สำเร็จ

ตรวจ

- `TEMPLATE_SLIDE_ID`
- placeholder ใน Google Slides Template
- `PDF_FOLDER_ID`
- สิทธิ์ Drive/Slides ของ account deploy
- quota และขนาดไฟล์

## แบบประเมินไม่ถูกส่ง

แบบประเมินควรส่งเฉพาะรายการ `Approved` เท่านั้น ตรวจ

- `Bookings.Status`
- `Eval Sent`
- เวลาสิ้นสุดประชุม
- trigger `sendPostMeetingSurvey`

## Dashboard ตัวเลขไม่ตรง

ตรวจว่า status ในชีทสะกดตรงกับ model หรือไม่ ระบบรองรับบางคำไทย/อังกฤษผ่าน `normalizeBookingStatus_()` แต่ควรใช้ค่าหลักให้สม่ำเสมอ
