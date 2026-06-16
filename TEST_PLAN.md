# แผนทดสอบระบบหลังติดตั้ง

## 1. ทดสอบการจองใหม่

เงื่อนไขก่อนทดสอบ: ห้องมีสถานะ Available, Approvers ครบ, Template/Folder ใช้ได้

ขั้นตอน

1. เปิดหน้า Web App
2. เลือกห้องและเวลาที่ว่าง
3. กรอกหัวข้อ ผู้จอง อีเมล จำนวนคน
4. ลงลายเซ็นผู้จอง
5. แนบ layout หากห้องกำหนด `Layout = Active`
6. กดบันทึก

ผลที่คาดหวัง

- บันทึกสำเร็จ
- รายการขึ้นปฏิทินทันที
- `Bookings.Status = Pending Approval`
- สร้าง Memo PDF URL
- มี `ApprovalFlow` 1 รายการ
- มี `ApprovalSteps` 3 รายการ
- Step 1 = PENDING, Step 2-3 = WAITING
- ผู้ลงนาม Step 1 ได้อีเมล

## 2. ทดสอบจองชนเวลา

1. จองห้องเดิมช่วงเวลาเดิมหรือทับซ้อน
2. ระบบต้องปฏิเสธและแจ้งว่าห้องไม่ว่าง

ต้องทดสอบกับสถานะที่กันห้อง ได้แก่

- `Pending Approval`
- `Approved`
- `Approval Error`

และต้องไม่กันห้องกับ

- `Cancelled`
- `Rejected`

## 3. ทดสอบการแก้ไขการจอง

1. สร้างรายการจองใหม่
2. ได้ลิงก์ลงนามฉบับแรก
3. Login เป็น Admin/Officer
4. แก้ไขข้อมูลการจอง
5. ตรวจว่าอีเมลลงนามใหม่ถูกส่ง
6. เปิดลิงก์เก่า

ผลที่คาดหวัง

- Flow เดิมเป็น `SUPERSEDED`
- ลิงก์เก่าไม่สามารถลงนามได้
- Flow ใหม่เดินต่อได้ตามปกติ

## 4. ทดสอบการยกเลิกก่อนลงนาม

1. จองห้องใหม่
2. ได้ลิงก์ Step 1
3. Login เป็น Admin/Officer แล้วยกเลิกรายการ
4. เปิดลิงก์ Step 1 เดิม

ผลที่คาดหวัง

- `Bookings.Status = Cancelled`
- `ApprovalFlow.Overall Status = CANCELLED`
- Step ที่ยัง PENDING/WAITING เป็น `CANCELLED`
- หน้า approve แสดงข้อความว่ารายการถูกยกเลิกแล้ว
- ไม่แสดง canvas หรือปุ่ม submit สำหรับลงนาม

## 5. ทดสอบเปิดหน้าอนุมัติค้างไว้แล้วค่อยยกเลิก

1. เปิดลิงก์ลงนาม Step 1 ค้างไว้
2. อีกหน้าหนึ่ง Login เป็น Admin/Officer แล้วยกเลิกรายการ
3. กลับไปหน้าอนุมัติที่เปิดค้างไว้ แล้วกด submit ลายเซ็น

ผลที่คาดหวัง

- ระบบปฏิเสธก่อนบันทึกลายเซ็น
- ไม่เลื่อน step
- ไม่สร้าง PDF final
- แสดง error ว่ารายการถูกยกเลิกแล้ว

## 6. ทดสอบลงนามครบ 3 ขั้น

1. จองใหม่
2. Step 1 ลงนาม
3. Step 2 ลงนาม
4. Step 3 ลงนาม

ผลที่คาดหวัง

- ทุก step เป็น `SIGNED`
- `ApprovalFlow = COMPLETED`
- `Bookings.Status = Approved`
- สร้าง Final Signed PDF URL
- ส่งอีเมลแจ้งผู้จอง

## 7. ทดสอบการไม่อนุมัติ

1. จองใหม่
2. เปิดลิงก์ step ที่กำลัง PENDING
3. กด reject พร้อมเหตุผล

ผลที่คาดหวัง

- `ApprovalFlow = REJECTED`
- `Bookings.Status = Rejected`
- รายการไม่กันห้อง
- ลิงก์ลงนามอื่นเปิดไม่ได้
- ส่งอีเมลแจ้งผู้จอง

## 8. ทดสอบแบบประเมิน

1. ใช้รายการที่ `Approved`
2. ให้เวลาสิ้นสุดผ่านไปแล้ว
3. รัน `sendPostMeetingSurvey()` หรือรอ trigger
4. เปิดลิงก์ evaluate
5. ส่งแบบประเมิน
6. ตรวจชีท `Evaluate`
7. รัน `sendEvaluationSummary()` ตามช่วงเวลา

ผลที่คาดหวัง

- แบบประเมินเปิดได้เฉพาะช่วงเวลาที่ระบบอนุญาต
- บันทึกคะแนน 10 ข้อได้
- ส่ง summary ได้เพียงครั้งเดียวตาม flag

## 9. ทดสอบ Dashboard

ตรวจว่า dashboard แยกจำนวนสถานะได้ถูกต้อง

- Approved
- Pending Approval
- Approval Error
- Cancelled
- Rejected

## 10. ทดสอบฟังก์ชันซ่อมข้อมูล

กรณีมีข้อมูลเก่าที่ `Bookings.Status = Cancelled` แต่ `ApprovalFlow` ยัง active ให้รัน

```javascript
repairCancelledBookingApprovalFlows()
```

ผลที่คาดหวัง

- active flow ของ booking ที่ยกเลิกถูกเปลี่ยนเป็น `CANCELLED`
- step ที่ยัง PENDING/WAITING ถูกเปลี่ยนเป็น `CANCELLED`
- step ที่ `SIGNED` ไม่ถูกทับ
