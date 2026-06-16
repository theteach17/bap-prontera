# CONTEXT.md - บริบทระบบจองห้องประชุม Prontera เวอร์ชันปัจจุบัน

เอกสารนี้ใช้เป็นบันทึกบริบทสำหรับผู้ดูแลระบบ นักพัฒนา หรือ AI ที่ต้องเข้ามาแก้ไขระบบในอนาคต โดยสรุปเหตุผลการออกแบบ รากปัญหาที่เคยพบ และกฎที่ต้องรักษาไว้เพื่อไม่ให้ระบบเสียความถูกต้องเชิงกระบวนการ

## สถานะล่าสุดของระบบ

ระบบเวอร์ชันนี้คือชุดที่พัฒนาต่อจาก `bap-prontera-cancel-approval-guard-fixed` และได้รับการยืนยันจากการทดสอบจริงแล้วว่า

1. จองห้องสำเร็จและส่งอีเมลให้ผู้รับผิดชอบลงนามถูกต้อง
2. แก้ไขการจองแล้วมีการสร้างลิงก์ลงนามใหม่ และลิงก์ลงนามเดิมใช้ไม่ได้ตามที่คาดหวัง
3. ยกเลิกรายการจองแล้ว ผู้รับผิดชอบไม่สามารถเปิดฟอร์มลงนามจากลิงก์เดิมได้อีก
4. กรณีเปิดหน้าอนุมัติค้างไว้แล้วรายการถูกยกเลิก ระบบมี guard ใน `submitApprovalSignature()` ป้องกันไม่ให้ submit ลายเซ็นภายหลัง

## แนวคิดใหญ่ของระบบ

ระบบนี้แยกความจริงออกเป็น 2 ชั้น

### 1. Booking Layer

เก็บว่ามีผู้ยื่นคำขอใช้ห้องในช่วงเวลาหนึ่งแล้วหรือไม่ ใช้เป็นตัวตัดสินเรื่องปฏิทินและการกันห้อง

ข้อมูลหลักอยู่ในชีท `Bookings`

### 2. Approval Layer

เก็บว่าบันทึกข้อความของ booking นั้นเดินกระบวนการลงนามถึงขั้นใดแล้ว

ข้อมูลหลักอยู่ในชีท

- `ApprovalFlow`
- `ApprovalSteps`
- `ApprovalLogs`
- `Approvers`

## กฎที่ต้องรักษาเสมอ

### Rule 1: รายการที่รับจองแล้วต้องกันห้องทันที

`Pending Approval`, `Approved` และ `Approval Error` ต้องกันห้องทั้งหมด เพราะทั้งสามสถานะหมายความว่า “มีคำขอใช้ห้องช่วงเวลานั้นแล้ว”

```javascript
isBookingBlockingRoom_(status)
```

คือ helper กลางที่ใช้กำหนดเรื่องนี้ ห้ามเขียนเงื่อนไขสถานะใหม่แยกเองในฟังก์ชันอื่น

### Rule 2: Cancelled และ Rejected เท่านั้นที่ปล่อยห้อง

สถานะที่ไม่กันห้องมีเพียง

- `Cancelled`
- `Rejected`

ถ้ารายการเป็น `Approval Error` ห้ามปล่อยห้อง เพราะความผิดเกิดที่ workflow หรือระบบ ไม่ใช่ผู้ใช้ยกเลิกการจอง

### Rule 3: Reminder และแบบประเมินต้องส่งเฉพาะ Approved

แม้ `Pending Approval` และ `Approval Error` จะกันห้อง แต่ยังไม่ควรส่ง reminder ปฏิบัติการหรือแบบประเมินหลังใช้ห้อง เพราะเอกสารยังไม่สมบูรณ์

ใช้ helper ต่อไปนี้เท่านั้น

```javascript
isBookingEligibleForOperationalReminder_()
isBookingEligibleForEvaluation_()
```

### Rule 4: Booking Status ต้องเป็นด่านสุดท้ายของหน้าลงนาม

หาก `Bookings.Status` เป็น `Cancelled` หรือ `Rejected` ต้องห้ามเปิดฟอร์มลงนามและห้าม submit ลายเซ็น แม้ token หรือ step จะยังดูเหมือนใช้งานได้

จุดป้องกันอยู่ที่

```javascript
getApprovalDetailsByToken()
submitApprovalSignature()
assertBookingCanBeApproved_()
```

### Rule 5: การแก้ไขการจองต้องใช้ SUPERSEDED ไม่ใช่ CANCELLED

เมื่อแก้ไขรายการจองและสร้าง workflow ใหม่ flow เดิมต้องถูกปิดด้วย `SUPERSEDED` เพื่อบอกว่า “ถูกแทนที่ด้วยกระบวนการใหม่” ไม่ใช่ถูกยกเลิกจากการไม่ใช้ห้อง

ฟังก์ชันที่เกี่ยวข้อง

```javascript
supersedeApprovalFlowsForBooking_()
adminCreateApprovalFlowForBooking()
```

### Rule 6: การยกเลิกการจองต้องใช้ CANCELLED

เมื่อรายการจองถูกยกเลิกจริง ต้องปิด active flow ด้วย `CANCELLED` และปิด step ที่ยัง `PENDING` หรือ `WAITING` เป็น `CANCELLED` แต่ไม่ทับ step ที่เป็น `SIGNED` เพื่อเก็บ audit trail

ฟังก์ชันที่เกี่ยวข้อง

```javascript
cancelBooking()
cancelApprovalFlowForBooking_()
repairCancelledBookingApprovalFlows()
```

## รากปัญหาที่เคยแก้แล้ว

### ปัญหา: จองแล้วสถานะ Approved เร็วเกินไป

เดิมระบบมีแนวโน้มตั้ง booking เป็น `Approved` ตั้งแต่บันทึกจองสำเร็จ ทั้งที่เอกสารยังลงนามไม่ครบ จึงปรับเป็น `Pending Approval` แล้วให้ `finalizeApprovalFlow_()` เปลี่ยนเป็น `Approved` เมื่อครบทุกขั้น

### ปัญหา: Approval Error ควรยังกันห้อง

หลังวิเคราะห์ร่วมกัน สรุปว่า `Approval Error` ต้องกันห้อง เพราะเป็นความผิดปกติของ workflow หลังผู้ใช้จองเข้ามาแล้ว ไม่ใช่การยกเลิกคำขอ

### ปัญหา: ยกเลิก booking แล้วลิงก์ลงนามยังเปิดได้

พบว่ารากหนึ่งคือ `cancelApprovalFlowForBooking_()` มีการอ้าง `keepApprovalId` โดยไม่ได้รับ parameter ทำให้มีโอกาสปิด flow ไม่สำเร็จแบบถูก catch ไว้ใน log อีกส่วนคือหน้าอนุมัติยังไม่ได้ตรวจ `Bookings.Status` เป็นด่านสุดท้าย จึงเพิ่ม guard ทั้งตอนเปิดหน้าและตอน submit

## ลำดับ flow ปัจจุบันที่ถือว่าถูกต้อง

### Booking created

```text
saveBooking()
↓
Status = Pending Approval
↓
Initial Memo PDF
↓
createApprovalFlowForBooking_()
↓
Step 1 = PENDING, Step 2-3 = WAITING
↓
sendApprovalRequestEmail_()
```

### Approval completed

```text
submitApprovalSignature()
↓
advanceApprovalStep_()
↓
ถ้าครบทุก step
↓
finalizeApprovalFlow_()
↓
generateFinalSignedMemoPdf_()
↓
markBookingApproved_()
↓
sendApprovalCompletedEmail_()
```

### Booking cancelled

```text
cancelBooking()
↓
setBookingStatusByRow_(Cancelled)
↓
cancelApprovalFlowForBooking_()
↓
Flow active = CANCELLED
↓
Steps PENDING/WAITING = CANCELLED
↓
sendCancellationNotifications_()
```

### Approval rejected

```text
submitApprovalSignature(action=reject)
↓
rejectApprovalFlow_()
↓
ApprovalFlow = REJECTED
↓
markBookingRejected_()
↓
sendApprovalRejectedEmail_()
```

## จุดที่ไม่ควรแก้โดยไม่ตรวจผลกระทบ

1. `BOOKING_STATUS` และ helper ที่เกี่ยวข้อง
2. `saveBooking()` เพราะเป็น transaction หลักของระบบ
3. `cancelApprovalFlowForBooking_()` เพราะเกี่ยวกับความปลอดภัยของลิงก์ลงนามหลังยกเลิก
4. `submitApprovalSignature()` เพราะเป็นจุดที่เขียนลายเซ็นและเลื่อน workflow จริง
5. `finalizeApprovalFlow_()` เพราะเป็นจุดเปลี่ยนสถานะเป็น `Approved`
6. `getBookingsData()` เพราะเกี่ยวกับการแสดงปฏิทินและการกันห้อง
7. `sendPostMeetingSurvey()` และ `sendEvaluationSummary()` เพราะต้องไม่ทำงานกับรายการที่ยังไม่อนุมัติครบ

## แนวทางแก้ไขในอนาคต

เมื่อพบปัญหาใหม่ ให้ตรวจตามลำดับนี้ก่อน

1. สถานะใน `Bookings` คืออะไร
2. มี `ApprovalFlow` active กี่รายการสำหรับ Booking ID เดียวกัน
3. `ApprovalSteps` ของ flow ปัจจุบันมี step ไหนเป็น `PENDING`
4. token ของ step ตรงกับ flow ปัจจุบันหรือเป็น flow ที่ `SUPERSEDED/CANCELLED`
5. helper กลางตีความ status อย่างไร
6. trigger หรือ email function อ่าน status ด้วย helper หรือยัง

## จำนวนฟังก์ชันใน Code.gs

เวอร์ชันนี้มีฟังก์ชันทั้งหมด `150` ฟังก์ชัน ดูรายละเอียดใน `docs/FUNCTION_MAP.md`
