# R1.1 — ทางเลือก Deploy ฐานจริงแบบควบคุม (ไม่ต้องสร้าง Sandbox)

**คำเตือน:** Offline mock tests ไม่ใช่การรับรอง Production. การไม่ใช้ฐานแยกเพิ่มความเสี่ยง และยังต้องตรวจการทำงานจริงหลัง Deploy โดยใช้รายการจองที่ได้รับอนุญาต. ห้ามเปิด flags ทั้งหมดพร้อมกัน. หากไม่พร้อมสำรอง/ย้อนกลับ ให้หยุดก่อน Deploy.

## 1. ก่อน Pull
- สำรอง Spreadsheet จริงทั้งไฟล์ (รวม headers), source GAS ที่ deploy จริง, Script Properties, Deployment ID และ version เดิม, trigger owner/handler/schedule. เก็บสำรองไว้เป็นส่วนตัว. ไม่จำเป็นต้องสร้างฐาน Sandbox หรือผูกสำเนาเข้ากับ GAS.
- อัปโหลด source R1.1 ครบทั้ง 11 GAS/HTML/manifest files ตาม README ลง GitHub; ใช้ branch upgrade269 ตามระบบของคุณ. ไม่เปลี่ยน .clasp.json, Script ID, executeAs, access, URL หรือ resource IDs เดิม.
- Pull ลง bound GAS project เดิม และบันทึก source. ยังไม่ Deploy version ใหม่. โปรดทราบว่า installable triggers อาจรัน source ล่าสุดแม้ยังไม่ Deploy web app ใหม่ จึงควรทำช่วงใช้งานน้อยและติดตาม Executions ตั้งแต่ Pull.
- ตรวจ Script Properties: `PRONTERA_TEST_MODE` ต้องไม่มีค่าหรือ `false`; flags ใหม่ทั้งหมดไม่มีค่าหรือ `false` (รายการใน README); เก็บค่าเดิมก่อนปรับ. ไม่ใส่ test IDs. ไม่รัน trigger installer หรือ setupApprovalSystem โดยไม่จำเป็น.

## 2. ตรวจแบบอ่านอย่างเดียวก่อน Deploy
ใน Apps Script Editor ของ project จริง เลือก `pronteraProductionPreflight` → Run ด้วยบัญชี deployer → Execution log.
- `ready:true` หมายถึงผ่านรายการตรวจเชิงอ่านที่แสดงเท่านั้น: spreadsheet, timezone, ชีทหลัก 7 ชีทมี headers, Booking schema check, signature placeholders 4 ตัว, initial/final PDF folder read access, Test Mode, vault/profile headers เมื่อเปิด signature.
- `ready:false` หรือ error: หยุดและแก้ตาม check ที่ไม่ผ่านก่อน Deploy. ไม่เปลี่ยน ACL ให้เป็น public เพื่อผ่าน preflight.
- Preflight ไม่สร้างไฟล์ ไม่เพิ่มแถว ไม่ส่งอีเมล ไม่ติดตั้ง trigger. ไม่ยืนยัน write permission, PDF rendering, web-app Workspace identity, email delivery, simultaneous executions หรือ quotas.

## 3. Deploy รอบแรก
Deploy → Manage deployments → แก้ deployment เดิม → New version. รักษา URL `/exec` และผู้ Deploy/สิทธิ์เดิม. เปิดหน้าเว็บและปฏิทิน ตรวจสถานะเดิม ตรวจ Admin/Officer login, จองรายการจริงที่ได้รับอนุญาตหนึ่งรายการและลงนามแบบเดิมครบ 3 ขั้น ตรวจ initial/final PDF, email, status/approval logs และ Executions. หากมีข้อผิดพลาดหยุด rollout; ดู ROLLBACK.md. ยังไม่เปิด reusable signature.

## 4. เปิดระบบลายเซ็นแบบค่อยเป็นค่อยไป
- ให้ผู้จองและผู้อนุมัติแต่ละระดับเปิดเว็บด้วยบัญชี Workspace ของตนเอง ตรวจเมนูลายเซ็นว่าระบบอ่าน email ได้ตรงบัญชี. หากไม่พร้อม ห้ามเปิด flags strict/อย่าผ่อนการยืนยันตัวตน.
- ตรวจว่า Spreadsheet และ project editors เป็นผู้ดูแลที่ไว้ใจได้. รัน `setupPronteraSignatureVault` ด้วยบัญชี deployer เท่านั้น (ขั้นตอนนี้สร้าง Vault/ชีทและตั้ง property จริง ไม่ใช่ read-only). ตรวจผลและสิทธิ์ private.
- ตั้ง `PRONTERA_SIGNATURE_ENABLED=true` หลัง identity/vault พร้อม; รัน `pronteraProductionPreflight` อีกครั้ง. หากล้มเหลวคืน flag เป็น false.
- จองและอนุมัติรายการที่ได้รับอนุญาตด้วย signature ใหม่และใช้ซ้ำ ทดสอบเปลี่ยนลายเซ็น ตรวจว่าเอกสารเดิมไม่เปลี่ยน และ Final PDF ของรายการที่ค้างยังใช้ Snapshot เดิม. ตรวจข้อผิดพลาดใน Executions. อย่าส่งเมลทดสอบไปยังบุคคลที่ไม่ได้ร่วมทดสอบ.
- เปิด strict identity, strict PDF, Workspace-only และ domain documents ทีละ flag เฉพาะหลังตรวจบัญชี/เอกสารเก่า/สิทธิ์จริงครบ. Legacy token-only approval และ password login ยังคงอยู่เมื่อ flags ที่เกี่ยวข้องปิด.
- Trigger guard ต้องตรวจ owner, handler และการรันตามเวลาเดิมก่อนเปิด. ไม่ติดตั้ง trigger ซ้ำ.

## 5. Rollback
ปิด flags ที่เปิดล่าสุด; rollback ไป deployment version เดิมใน Manage deployments. หากมี trigger error ต้องคืน source ล่าสุดใน editor ด้วย (rollback web deployment อย่างเดียวไม่เปลี่ยน source ที่ trigger ใช้). ตรวจว่ารายการที่เกิดหลัง rollout ยังอยู่; ห้าม restore Spreadsheet สำรองทับฐานจริงโดยอัตโนมัติ. เก็บ Vault, Snapshot และคอลัมน์ใหม่ไว้เพื่อหลักฐาน. ตรวจ Approval Error และ reconcile รายการทีละรายการ. อ่าน ROLLBACK.md ประกอบ.
