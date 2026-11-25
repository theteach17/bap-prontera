# R2.1 — Calendar-first / Date-first booking hotfix

สถานะ: Release candidate ที่ทดสอบ Offline แล้ว ไม่ใช่ผลรับรอง Production

## ขอบเขตและเหตุผล
แก้ปัญหาที่พบหลัง Deploy R2 โดยยกปฏิทินเป็นองค์ประกอบแรก ตัด Banner และ Wizard ออก ใช้แบบฟอร์มหน้าเดียว เริ่มจากวันที่และเวลา จากนั้นระบุจำนวนคน เลือกห้อง กรอกข้อมูลการประชุมและยืนยันการลงนามตามระบบเดิม ไม่เปลี่ยน Business Logic ฝั่ง Server

- `index.html`: โครงหน้าแรกและแบบฟอร์มใหม่ พร้อม native date inputs, ช่อง HH:mm แบบ 24 ชั่วโมง, เลือกวันสิ้นสุด (รองรับข้ามวัน), สถานะห้องว่างและปุ่มตรวจสอบซ้ำ
- `Experience.html`: ควบคุมวันเวลา, sync ค่า `startTime`/`endTime` เดิม, ค้นหาห้องว่างหลังเปลี่ยนวันเวลา/จำนวนคน, ป้องกันผลค้นหาเก่าทับผลล่าสุด, รักษาข้อมูลแก้ไขและไฟล์แนบเดิม
- `javascript.html`: เริ่ม Calendar แยกจาก Room Sidebar/Tooltip, แจ้ง RPC error พร้อมปุ่ม retry, fallback month view หาก FullCalendar โหลดหรือ initialize ไม่สำเร็จ, เก็บขั้นตอนยืนยัน/ลงนามเดิม, แปลงเวลาในฟอร์มเป็น Asia/Bangkok
- `stylesheet.html`: Calendar-first, แบบฟอร์มแบ่งกลุ่มข้อมูลในหน้าเดียว, responsive, ปุ่มหลักอ่านชัดและเข้าถึงง่าย

การค้นหาห้องว่างเป็น read-only ไม่ใช่การจอง; Server ยังคงตรวจเวลาชน ความจุ สถานะ และสิทธิ์ก่อนบันทึกจริง. ถ้าค้นหาไม่ได้ ผู้ใช้สามารถ retry หรือเลือกห้องเพื่อให้ Server ตรวจสอบก่อนบันทึก. ตอนแก้ไขรายการเดิมไม่ใช้ผลค้นหาที่นับรายการตัวเองเป็นการชน; Server ตรวจการชนโดยยกเว้น Booking ID เดิม. Native date picker แสดงรูปแบบวันที่ตาม locale ของ Browser; มีบรรทัดสรุปวันที่ภาษาไทย/เวลาไทยกำกับ. ช่องเวลาเป็น HH:mm พิมพ์ได้ทุกนาที ไม่ใช้ Flatpickr. ใน fallback mode มีมุมมองเดือนเท่านั้น; หาก FullCalendar โหลดปกติยังมีมุมมองเดิม. ไม่มีการเพิ่มหรือลบชีท ไม่แก้ Script Properties, Trigger, OAuth scopes หรือ Workflow.

## การติดตั้ง (R2 เดิมหรือ R1.1 ที่ Rollback แล้ว)
1. บันทึก Version ที่เสถียรและสำรอง Source Code ปัจจุบัน/Google Sheets; เก็บ URL เดิมและรายการ Trigger. หาก R2 ยังเสียหายให้ Rollback Deployment ก่อน.
2. หาก HEAD ของ Apps Script เป็น R2 ตรงกับไฟล์ต้นฉบับ ให้แทนเฉพาะ 4 HTML ที่ระบุข้างต้นพร้อมกัน. หาก HEAD เป็น R1.1 หรือไม่แน่ใจ ให้ใช้ทุกไฟล์ .gs, .html, appsscript.json ที่ root ใน ZIP; อย่าอัปโหลด docs/tests เป็น GAS files. ห้ามเปลี่ยน Script ID.
3. คง Feature Flags 11 รายการตามสถานะก่อนทดสอบ (สำหรับ rollout ที่ทุก Flag เป็น false ให้คง false) ไม่สร้าง Trigger ไม่สร้าง Vault ไม่ปรับฐานข้อมูล. OAuth scopes และ quota ข้อจำกัด GAS อยู่ใน README เดิม; ไม่เพิ่ม scope หรือ trigger ใน hotfix.
4. เปิด Test deployment (/dev) ด้วยบัญชี editor ที่ได้รับอนุญาตก่อน (ยังใช้ฐานจริง จึงตรวจหน้าจอและข้อมูลแบบอ่านอย่างเดียว ไม่กดยืนยันลงนาม/ส่งคำขอ) ตรวจว่าปฏิทินและรายการเดิมแสดงผล, เลือกวันที่จากปฏิทิน, เปิดจากปุ่มจอง, เลือกวัน/เวลา, เปลี่ยนจำนวนคน, เลือกห้อง, แนบไฟล์ทดสอบ, ดูบนมือถือ และทดสอบปิด/เปิดใหม่. ตรวจ Browser Console และ GAS Executions. ถ้าผิดพลาดอย่า Deploy.
5. เมื่อผ่าน ให้ Manage deployments > Edit deployment เดิม > New version > Deploy (ไม่สร้าง URL ใหม่). Smoke test การจองจริงโดยบัญชีที่ได้รับอนุญาตตามนโยบายหน่วยงาน. ตรวจ PDF/Email/Approval ครบทั้งสามระดับ; อย่าเปิด Feature Flags เพิ่มในระหว่างทดสอบ.
6. ถ้าพบข้อผิดพลาด กระทบผู้ใช้งาน ให้เลือก Version ที่เสถียรใน Manage deployments แล้ว Deploy. Rollback deployment ไม่ย้อน HEAD ที่ Trigger อาจใช้งาน: คืน Source Code ให้ตรงกับรุ่นที่เสถียรหากจำเป็น. ไม่เขียนทับฐานข้อมูลจริงด้วย backup โดยอัตโนมัติ.

## ผลการตรวจสอบ
- `TEST_REPORT_R2_1.txt`: 102 offline server/static checks ผ่าน; 265/265 function entry ไม่ใช่ branch coverage. ตรวจว่า .gs และ manifest ทุกไฟล์เท่ากับ R2 byte-for-byte.
- `BROWSER_TEST_R2_1.txt`: 22 browser checks ผ่าน (Chromium + native date field + DOM fallback calendar, mock GAS RPC, FullCalendar, SweetAlert). จำลอง RPC failure และ Tooltip failure. ตรวจหน้าตาจาก screenshots offline. ไม่ได้ทดสอบ FullCalendar CDN จริง, Browser ของโรงเรียน, GAS runtime, PDF/Email หรือ Workspace Identity จริง; ไม่มีหลักฐานยืนยัน root cause ของปฏิทิน Production เพราะไม่มี Console Log จริง.
- งานคงเหลือ Master Plan เดิมอยู่ใน R2_REQUIREMENTS.md; hotfix นี้ไม่อ้างว่าพัฒนาส่วนนั้นเสร็จ
