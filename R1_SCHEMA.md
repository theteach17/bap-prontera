# R1 Schema — Additive changes only

## Existing Sheets

รักษา Rooms, Bookings, Officers, Admin, Approvers, ApprovalFlow, ApprovalSteps, Evaluate, Logs, ApprovalLogs และสถานะเดิม. ไม่ลบ/ย้ายคอลัมน์เดิม.

`Bookings` เพิ่มคอลัมน์ท้ายแบบ lazy migration ขณะบันทึกใต้ ScriptLock:
- `Prontera Submission Receipt`: random submission ID 128-bit + SHA-256 fingerprint ของข้อมูลคำขอที่ไม่รวมรูปวาด. ใช้คืน Booking ID เดิมเมื่อ retry. คอลัมน์นี้ไม่ใช่ authorization token และไม่เปิดผ่าน Calendar API.
- `Prontera Signature Version`: profile ID + version ณ ตอนลงนาม. `Signature File ID` เดิมอ้าง Snapshot แยกจาก profile. เมื่อแก้ไข booking จะบันทึกหลักฐานของการแก้ไขครั้งใหม่และคงไฟล์เก่าไว้; log บันทึก profile version ที่ใช้. การย้อนกลับเป็น manual signature จะล้าง version metadata ของ booking ปัจจุบันเท่านั้น.

`ApprovalSteps` ไม่เพิ่มคอลัมน์: `Sign Method` เดิมใช้ `profile:<UUID>:<version>` เมื่อใช้ saved signature; `Signature File ID` และ `Signature Image URL` เดิมอ้าง Snapshot private. `Signed At`, Approver Email/Name และ ApprovalLogs เป็น audit ของการลงนาม. รูปแบบ legacy `draw` / `upload` ยังรองรับ.

## SignatureProfiles (สร้างเมื่อ run setupPronteraSignatureVault)

| Column | Definition |
|---|---|
| Signature ID | UUID ต่อ version |
| User Email | Workspace principal จาก Session.getActiveUser |
| Version | ลำดับ version ของ account, ไม่ overwrite |
| File ID | profile PNG ใน private vault |
| SHA256 | digest ของ bytes |
| Created At | วันเวลาสร้าง version |

Append-only; เลือก version ล่าสุดด้วยเลข version สูงสุด; version ซ้ำให้ error. ไม่มี raw image ใน Sheet. Snapshot มี file ID แยก และตรวจ digest กับ version เดิมเมื่อสร้าง final PDF. ไม่ลบ versions/snapshots โดยอัตโนมัติ. Trusted admin ต้องกำหนด retention/backup ตามนโยบายเอกสารและ PDPA ของหน่วยงานก่อนลบ.

## RoomOperations (สร้างเมื่อบันทึกสถานะครั้งแรก)

`Booking ID`, `Revision` (hash จาก booking revision/memo/start/end/room/layout), `Operational Status`, `Updated At`, `Actor`. Append-only, optimistic state check. สถานะ `WAITING_SETUP`, `IN_PROGRESS`, `READY`, `COMPLETED` ไม่ไปเปลี่ยน Booking Status หรือ Approval Status. หากมีการแก้ booking หรือ regenerate memo ระบบอาจถือว่าเป็น revision ใหม่และกลับไปรอจัดเตรียม.

## Existing business invariants

Pending Approval, Approved, Approval Error กันห้อง; Cancelled, Rejected ปล่อยห้อง. เฉพาะ Approved ส่ง operational reminder/evaluation ตามเวลา. Cancelled/Rejected ไม่สามารถลงนาม. แก้ไขสร้าง flow ใหม่และ SUPERSEDED เดิม. Approval 3 ขั้นตาม configuration จริงใน Approvers; R1 ไม่เปลี่ยนลำดับหรือสิทธิ์เชิงธุรกิจ. ไม่แยก REJECTED กับ RETURNED ใน R1.
