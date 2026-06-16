# คู่มือผู้ดูแลระบบ

## งานหลังติดตั้งครั้งแรก

1. เปิด Apps Script project
2. วางไฟล์ระบบให้ครบ
3. Save และ Deploy
4. รัน `testAuth()` เพื่อให้สิทธิ์ Google services
5. รัน `setupApprovalSystem()` เพื่อตรวจ schema ระบบอนุมัติ
6. ตรวจชีท `Approvers` ให้มีผู้ลงนามครบทุกขั้น
7. ตั้ง trigger ตาม `docs/TRIGGERS.md`
8. ทดสอบจองจริงอย่างน้อย 1 รายการ

## การตั้งค่าผู้ลงนาม

ผู้ลงนามอยู่ในชีท `Approvers`

- Step 1: ผู้รับผิดชอบห้องประชุม ใช้ `Role Key = ROOM_OFFICER` และควรผูก `Room ID` ให้ถูกต้อง
- Step 2: กลุ่มงานอาคารสถานที่และสิ่งแวดล้อม ใช้ `Role Key = BUILDING_GROUP`
- Step 3: รองผู้อำนวยการ ใช้ `Role Key = DEPUTY_BUDGET` หรือ role deputy อื่นตาม config

ค่า `Active` ต้องเป็น true/yes/active/ใช่ จึงจะถูกเลือกใช้งาน

## การดูแลสถานะ Approval Error

เมื่อพบรายการ `Approval Error`

1. เปิด dashboard หรือชีท `Bookings` ดู Booking ID
2. เปิด `ApprovalLogs` เพื่อหาข้อความ error เช่น หา approver ไม่เจอ ส่งอีเมลไม่ได้ หรือสร้าง flow ไม่ครบ
3. ตรวจชีท `Approvers`, Template ID, Folder ID, Web App URL และอีเมลผู้ลงนาม
4. แก้สาเหตุ
5. ใช้ปุ่มในหน้า admin หรือรัน workflow ใหม่ผ่าน `adminCreateApprovalFlowForBooking()`
6. เมื่อสร้าง flow สำเร็จ สถานะควรกลับเป็น `Pending Approval`

## การยกเลิกรายการจอง

ควรยกเลิกผ่านหน้าเว็บหรือฟังก์ชัน `cancelBooking()` เท่านั้น เพื่อให้ระบบปิดทั้ง `Bookings`, `ApprovalFlow` และ `ApprovalSteps` พร้อมกัน

หลังยกเลิกแล้ว ลิงก์ลงนามเดิมต้องเปิดฟอร์มไม่ได้ หากพบข้อมูลเก่าที่ผิด ให้รัน

```javascript
repairCancelledBookingApprovalFlows()
```

## การแก้ไขรายการจอง

เมื่อแก้ไขรายการจอง ระบบจะสร้าง workflow ใหม่ และ flow เดิมจะเป็น `SUPERSEDED` ลิงก์ลงนามเดิมจึงใช้ไม่ได้ นี่เป็นพฤติกรรมที่ถูกต้อง

## การตรวจ URL ระบบ

ถ้าอีเมลเปิดลิงก์ approve/evaluate ไม่ถูกต้อง ให้ตรวจ

```javascript
testCurrentEvaluationBaseUrl()
```

ถ้าต้องการล็อก URL ให้แก้ `WEB_APP_EXEC_URL` ใน `Code.gs` แล้วรัน

```javascript
setWebAppUrlOverride()
```

## การสำรองข้อมูล

ควรสำรอง

1. Apps Script source files
2. Google Sheet ฐานข้อมูล
3. Google Slides Template
4. Drive folders ที่เก็บ PDF และลายเซ็น

ก่อนแก้โค้ดทุกครั้งควร copy project หรือดาวน์โหลด source เดิมไว้
