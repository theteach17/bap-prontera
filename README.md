# Project Prontera — Next Generation R2

**Release candidate สำหรับ Controlled Production Rollout — ยังไม่ผ่านการตรวจรับ Runtime จริง**

ฐานการพัฒนา: `Prontera_NextGen_R1_1_Upgrade269.zip` จากระบบเดิม `upgrade269` (baseline 1bd2ac189). คง Google Apps Script, Google Sheets, Google Workspace, Drive, Slides, MailApp, กระบวนการอนุมัติสามขั้น และสถานะเดิม ไม่มีการเปลี่ยน Deployment หรือฐานจริงในการจัดทำ ZIP นี้

## ขอบเขตและหลักฐาน

- หน้าใหม่: Sidebar/Navigation, หน้าแรก, Room Finder, ปฏิทิน, แบบฟอร์ม 3 ขั้น, My Bookings พร้อม Timeline, Approval Center, Signature Profile, Admin Center, Dashboard, หน้าพิจารณาและประเมิน, Digital Room Display, QR Verification.
- คงระบบ Signature Vault, Profile, SHA-256, Snapshot และ Workspace login จาก R1.1.
- เพิ่ม Final PDF Worker แบบ durable queue, retry จำกัด 3 ครั้ง, heartbeat, ตรวจสถานะและลายเซ็นก่อนประมวลผล; ไม่เปลี่ยนสถานะเป็น Approved จนสร้าง PDF สำเร็จ. เอกสารขั้นแรก/การแจ้งเตือนยัง synchronous; ยังไม่ใช่ Notification Outbox หรือ background architecture เต็มรูปแบบ.
- เพิ่ม Maintenance Blocking แบบไม่ยกเลิกการจองเดิม, recurring weekly planner (ยื่นและลงนามทีละรายการ), QR code แบบ local encoder, analytics ชั่วโมงจองและเวลาอนุมัติ, จอแสดงสถานะห้อง.
- `R2_REQUIREMENTS.md` เป็นบัญชีตรวจรับข้อกำหนดและงานคงเหลือ. **ไม่ถือว่าครบ Master Plan ทั้งหมด**; PWA/service worker, batch recurring series, full outbox, initial-PDF queue, performance benchmark และการตรวจรับ Production ยังไม่เสร็จ.
- `TEST_REPORT_R2.txt`: 102 checks ผ่าน, function entry coverage 265/265 (เฉพาะ function declarations ที่ instrumented, ไม่ใช่ branch coverage). `BROWSER_TEST_R2.txt`: 15 checks Chromium โดย mock RPC/FullCalendar/Flatpickr/SweetAlert. `QR_TEST_R2.txt`: ถอดรหัส QR จากภาพที่วางใน final-PDF simulation ได้. ไม่ใช่การทดสอบ Google Workspace/Slides/PDF จริง.
- เอกสาร R1.1 เดิมใน `docs/R1_1/` และเอกสาร baseline เดิมใช้เป็นประวัติอ้างอิงเท่านั้น; ให้ยึด README นี้สำหรับ R2.

## 1. สำรองและเตรียมติดตั้ง

1. เก็บ source ของ Apps Script ที่ใช้งานจริง, Git commit, version ของ deployment, URL `/exec`, รายการ Trigger และเจ้าของ Trigger, Script Properties (ไม่เผยแพร่ secret), สำเนา Sheets, สิทธิ์ Drive และ Slides Template. อย่าคิดว่า backup R1.1 ก่อนหน้านี้ครอบคลุมรายการใหม่ทั้งหมด.
2. แตก ZIP และอัปโหลดไป GitHub ใน development branch ก่อนถ้าทำได้ ตรวจ diff แล้วจึงนำขึ้น `upgrade269`. อย่า overwrite `.clasp.json` หรือ Script ID ของระบบเดิม. ใช้ `.claspignore` และตรวจ `clasp status` ก่อน push.
3. Pull/อัปเดต **ทุกไฟล์ .gs, .html และ appsscript.json ที่ root พร้อมกัน**. ไฟล์ docs และ tests ไม่ใช่ GAS source. การบันทึก HEAD อาจทำให้ Trigger เดิมใช้ code ใหม่ก่อน Deploy; ควรเลือกเวลาคนใช้น้อยและเฝ้าดู Executions.
4. ตรวจค่า flags ตามตารางด้านล่าง. หากมี feature ที่ใช้งานอยู่แล้ว ให้ประเมินผลของการเปลี่ยนค่า ไม่ปิดระบบหรือทิ้งคิวโดยพลการ. สำหรับสถานะที่ผู้ใช้รายงานล่าสุด (8 flags false) ให้คงเดิมและ 3 flags ใหม่เป็น false/unset.
5. รัน `pronteraProductionPreflight` จาก Editor ด้วยบัญชี deployer. ต้องได้ ready:true; นี่เป็น read-only ไม่ทดสอบสิทธิ์เขียนหรือสร้าง PDF จริง. หากผิดพลาด หยุดก่อน Deploy.
6. แนะนำ Test Deployment/สำเนาฐานข้อมูลก่อน. หากเลือกฐานจริงโดยตรง ให้ทำ controlled rollout ตามหัวข้อ 3 และยอมรับว่ายังมี runtime risk. ห้ามเปิดทุก flag พร้อมกัน.

## 2. Script Properties

| Key | ค่าเริ่มต้นสำหรับ rollout |
|---|---|
| PRONTERA_TEST_MODE | false |
| PRONTERA_SIGNATURE_ENABLED | false |
| PRONTERA_STRICT_APPROVAL_IDENTITY | false |
| PRONTERA_STRICT_REQUESTER_IDENTITY | false |
| PRONTERA_STRICT_PDF_SIGNATURES | false |
| PRONTERA_WORKSPACE_ONLY_STAFF | false |
| PRONTERA_DOMAIN_DOCUMENTS | false |
| PRONTERA_GUARD_LEGACY_TRIGGERS | false |
| PRONTERA_FINAL_WORKER_ENABLED | false |
| PRONTERA_MAINTENANCE_ENABLED | false |
| PRONTERA_QR_ENABLED | false |

ค่า unset เทียบเท่า false. `PRONTERA_WORKSPACE_DOMAIN` default `g.klaeng.ac.th`; ตรวจให้ตรงโดเมนจริง. `PRONTERA_SIGNATURE_VAULT_ID` สร้างผ่าน setup เท่านั้น. `PRONTERA_FINAL_WORKER_HEARTBEAT` เขียนโดย Worker ห้ามตั้งค่าเทียม. `MRBS_WEB_APP_URL_OVERRIDE` ต้องเป็น URL `/exec` ของ deployment ที่ถูกต้อง. ค่าทรัพยากรเดิมไม่ถูกเปลี่ยนอัตโนมัติ.

หากทำ sandbox: ตั้ง `PRONTERA_TEST_MODE=true`, `PRONTERA_TEMPLATE_SLIDE_ID`, `PRONTERA_PDF_FOLDER_ID`, `PRONTERA_FINAL_SIGNED_MEMO_FOLDER_ID`, `PRONTERA_SETUP_FOLDER_ID`, `MRBS_WEB_APP_URL_OVERRIDE` เป็นทรัพยากรทดสอบทั้งหมดก่อน Run. ไม่คัดลอก Vault ID ของ Production. Test Mode ระงับ MailApp ผ่าน wrapper; ไม่ใช่หลักประกันความปลอดภัยหากยังอ้างอิงทรัพยากร Production โดยตรง.

## 3. Controlled rollout ฐานจริง

1. Deploy > Manage deployments > Edit > New version บน deployment เดิม; คง Execute as และ access (USER_DEPLOYING, DOMAIN) และ URL เดิม. อย่าใช้ New deployment ถ้าต้องรักษาลิงก์เดิม.
2. เปิด URL จริงหลัง Deploy ด้วยบัญชีที่ได้รับอนุญาต (Incognito หากต้องการ). ตรวจ sidebar, room catalog, ปฏิทิน, มือถือ, wizard 3 ขั้น, dashboard, Admin, profile, My Bookings, Approval Center, หน้า approve/evaluate และรายการเก่าที่ยังรออนุมัติ. ยังไม่เปลี่ยนข้อมูลจริงในช่วง read-only smoke test.
3. สร้างคำขอทดสอบที่ได้รับอนุญาตในช่วงเวลาห้องว่างจริง หัวข้อชัดเจนว่าทดสอบ. ใช้ผู้ลงนามจริงที่ยินยอมทั้งสามขั้น ตรวจ Booking ID, การกันห้อง, PDF, อีเมล, ลิงก์เดิม, Final PDF, สถานะและแบบประเมิน. ตรวจ Executions. ห้ามทดสอบการลงนามแทนบุคคลอื่น. หากผิดปกติหยุด rollout.
4. ตรวจ Workspace identity ของแต่ละบัญชีผ่าน `getPronteraReadiness` จาก Web App (หน้า Profile) ไม่ใช่จาก Editor เพียงอย่างเดียว. เมื่อยืนยันแล้วให้ deployer รัน `setupPronteraSignatureVault` จาก Editor; ตรวจ private folder และชีท SignatureProfiles; เปิด `PRONTERA_SIGNATURE_ENABLED=true` แล้วรัน preflight ซ้ำ. ทดสอบบันทึก เปลี่ยนลายเซ็น ลงนามครั้งถัดไป และ Final PDF ยังใช้ snapshot เดิม. เปิด strict flags ทีละตัวหลังตรวจรับสิทธิ์ของผู้ใช้จริง; เปิด domain sharing เมื่อทดสอบผู้รับไฟล์ครบ. ไม่ลบผู้ใช้เดิมก่อนตรวจรับ SSO.
5. Final Worker (optional): รัน `setupPronteraFinalWorker` ด้วย deployer ขณะ flag false; ตรวจมี trigger `runPronteraFinalWorker_` เพียงหนึ่งตัว ทุก 1 นาที. รอ heartbeat จริงหรือรัน `runPronteraFinalWorkerNow` ใน Editor ขณะ flag ยัง false; จากนั้นเปิด `PRONTERA_FINAL_WORKER_ENABLED=true`, รัน preflight ซ้ำ. ทดสอบคำขอใหม่อนุมัติขั้น 3: ยัง Pending Approval จน Worker สร้าง PDF เสร็จ; Admin ดู Worker Health, heartbeat, queue, retry, failed. ถ้า heartbeat เก่า >3 นาที การส่งใหม่ fallback เป็น sync. การ retry ไม่เกิน 3; หาก FAILED ให้ตรวจ PDF/ApprovalFlow/Booking ก่อนใช้ admin recovery เดิม ห้ามกดซ้ำไม่ตรวจหลักฐาน. คิวไม่ได้รับประกัน exactly-once ของผลข้างเคียง Drive/Mail.
6. Maintenance: เปิด `PRONTERA_MAINTENANCE_ENABLED=true`, Admin สร้างช่วงปิดห้องที่ไม่มีรายการกันห้องอยู่; ตรวจ Room Finder และ saveBooking ว่าปฏิเสธช่วงทับซ้อน, จากนั้นยกเลิกช่วงปิดทดสอบ. ชีท RoomMaintenance สร้างเมื่อบันทึกครั้งแรก. ไม่มีการยกเลิก booking เดิมอัตโนมัติ.
7. QR: สำรอง Slides template, จัดวาง text shape `{{PRONTERA_QR}}` เพียงหนึ่งตำแหน่ง ขนาด >=90×90 pt ไม่ทับลายเซ็นหรือข้อมูลสำคัญ. เปิด `PRONTERA_QR_ENABLED=true` หลังทดสอบ template, รัน preflight. สร้างคำขอใหม่ ลงนามครบ, สแกน QR จาก PDF ที่ได้จริงด้วยบัญชี Workspace, ตรวจว่าเอกสารที่ยกเลิก/ถูกแทนที่ไม่ valid. QR ตรวจสถานะและไฟล์อ้างอิงในระบบ ไม่ใช่ PKI หรือ proof ว่ากระดาษไม่ถูกปลอม. ไม่มีการออก QR ย้อนหลังอัตโนมัติ.
8. ตรวจ recurring planner ว่าแผน 2–12 สัปดาห์คำนวณถูกต้องและแต่ละวันต้องยื่นคำขอแยก, Digital Room Display แสดงเวลา/สถานะถูกต้อง (ไม่ใช่เซ็นเซอร์), Dashboard เทียบชั่วโมงจองกับตัวอย่างจริง. ตรวจหน้าประเมินและการแจ้งเตือนเดิม.
9. เฝ้าดู trigger execution, Drive ACL, mail, quota, latency และความถูกต้องของข้อมูล; อย่าประกาศผ่าน Production Acceptance จนทุกกรณีสำคัญผ่านจริง.

## 4. Trigger / OAuth

คง triggers เดิมทั้งหมด ไม่เรียกตัวติดตั้งเดิมโดยไม่จำเป็น. Worker ใหม่เป็น trigger เดียวที่เพิ่มได้ด้วย `setupPronteraFinalWorker` เท่านั้น (optional), เจ้าของต้องเป็น deployer. ระวัง trigger เก่าใช้ HEAD แม้ rollback Deployment. Manifest byte-identical กับ R1.1:

- `https://www.googleapis.com/auth/spreadsheets` — database
- `https://www.googleapis.com/auth/drive` — Drive PDF, template, vault
- `https://www.googleapis.com/auth/script.send_mail` — email
- `https://www.googleapis.com/auth/presentations` — Slides PDF
- `https://www.googleapis.com/auth/script.external_request` — existing external requests
- `https://www.googleapis.com/auth/userinfo.email` — identity
- `https://www.googleapis.com/auth/script.scriptapp` — trigger management

ไม่เพิ่ม scope ใหม่. หาก Google ขอ authorize ให้ตรวจบัญชีและ scopes ก่อนอนุญาต.

## 5. ทดสอบ Offline ซ้ำ

- `node tests/regression.cjs` (Node.js 18+, built-ins only).
- `python tests/browser_mock.py` (Python Playwright, Chromium, local Bootstrap CSS/JS; กำหนด `CHROMIUM`, `PRONTERA_BOOTSTRAP_CSS`, `PRONTERA_BOOTSTRAP_JS` ตามเครื่อง). Calendar, picker, dialogs, RPC เป็น mock; ไม่ได้ทดสอบ CDN จริง.
- `python tests/qr_decode.py` (Node.js + Python OpenCV) ทดสอบ decode QR จาก final generation simulation.
- Test output ใน root; mock ไม่ส่งอีเมลจริงหรือเข้าถึง Google. อ่าน `R2_REQUIREMENTS.md` สำหรับ coverage ที่ยังไม่ครบ.

## 6. Stop / Rollback

หยุดเปิด feature ทันทีหากเปิดหน้าไม่ได้, auth fail, booking/approval status ผิด, PDF ลายเซ็นไม่ครบ, เมลผิดผู้รับ, queue ค้าง/failed หรือ quota error. เก็บ booking ID, timestamp, Execution Log โดยไม่เปิดเผย token/signature. ตรวจความถูกต้องของ workflow ก่อน retry.

- Rollback Web App ด้วย Deploy > Manage deployments > Edit > เลือก version ก่อนหน้า > Deploy. Rollback source HEAD แยกต่างหากจาก snapshot Git/GAS เพื่อให้ trigger ใช้โค้ดเดิม. ตรวจ Trigger และ flags หลัง rollback.
- ก่อนปิด Worker ให้ระงับการส่งคำขอ/การลงนามตามขั้นตอนที่ได้รับอนุมัติและตรวจ queued/running/retry/failed ทั้งหมด; drain หรือกู้คืนผ่าน Admin อย่างมีหลักฐาน. การปิด flag ทำให้คิวเดิมหยุด ไม่ประมวลผลอัตโนมัติ. ไม่ลบชีทหรือไฟล์.
- หาก rollback ไป code ที่ไม่รองรับ maintenance ให้ตรวจช่วงปิดที่ยังมีผลและกำหนดมาตรการกันห้องด้วยวิธีที่อนุมัติแล้วก่อน; อย่าเปิดห้องโดยไม่ตั้งใจ.
- ห้าม restore สำเนา Sheets เก่าทับรายการใหม่. ใช้ backup สำหรับตรวจเทียบและแก้เฉพาะรายการที่ผิดด้วยความอนุมัติ. รักษา snapshot ลายเซ็น, QR registry, queue และ audit trail.

## 7. ข้อจำกัด GAS / Quota

GAS มี execution limit โดยทั่วไป 6 นาทีต่อครั้ง; quota MailApp, Trigger total runtime, Properties, Sheets, Drive และ Slides แตกต่างตามบัญชีและเปลี่ยนได้. Worker ทำครั้งละหนึ่งงานและยังใช้ ScriptLock ระหว่าง final PDF เพื่อความถูกต้อง; ไม่รับประกัน latency/throughput. Sheet ไม่ใช่ transactional DB; process อาจถูกตัดกลาง write และต้อง reconcile. Background initial PDF, full notification outbox, PWA offline, series transaction และ full production performance benchmark ยังไม่เสร็จ. ผล Mock/Chromium ไม่สามารถรับรองว่าไม่มี runtime defect หรือทุก branch ผ่าน.
