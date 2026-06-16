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
