# Project Prontera — Next Generation R1.1

ชุด Source Code ฉบับเต็มสำหรับ GitHub branch `upgrade269` / Google Apps Script + Google Workspace + Google Sheets

- Baseline: `1bd2ac1891eb6c9c76ba09184070f34ad6839a89` (ZIP ที่ผู้ใช้ส่งมา)
- Release: **R1.1 Audited Controlled Rollout Candidate** — 25 พฤศจิกายน 2569
- ผ่าน Offline Static + Mocked GAS Regression 85 checks; instrumented server function entry 238/238 (ไม่ใช่ branch coverage) (`tests/regression.cjs`, `TEST_REPORT.txt`)
- ยังไม่ผ่านการทดสอบกับ Production Google Workspace, Google Slides Template, Drive ACL, Trigger หรือ Browser จริง จึงแนะนำ Test Deployment ก่อนเสมอ หากเลือกฐานจริงโดยไม่สร้าง Sandbox ให้ทำตาม `DIRECT_PRODUCTION.md` และยอมรับความเสี่ยงที่เหลือ
- ไม่เปลี่ยนแปลงระบบ Production, GitHub หรือข้อมูลจริงจากการจัดทำชุดนี้

## 1. ขอบเขตที่ส่งมอบ

- Signature Profile สำหรับผู้จองและผู้ลงนาม 3 ขั้น: วาดหรืออัปโหลด PNG/JPG ครั้งแรก (UI แปลงเป็น PNG), ยืนยันและบันทึก, เปลี่ยนลายเซ็นได้, ใช้ลายเซ็นที่บันทึกไว้จาก Server หลังยืนยันแต่ละครั้ง
- Private Signature Vault, append-only version metadata, SHA-256, document-specific Snapshot, ตรวจ hash ของ Snapshot จากเวอร์ชันเดิมเมื่อสร้าง Final PDF; ไม่ส่ง raw image/file ID ของ Profile ให้ Client, ไม่มี API ให้ Admin เรียกใช้ลายเซ็นของผู้อื่นโดยใช้ email/file ID
- Workspace login สำหรับบัญชีเจ้าหน้าที่ที่มี email และ role เดิมในชีท Admin; My Bookings และ Approval Inbox ตรวจสอบ Workspace Identity ฝั่ง Server
- Lock สำหรับ cancel/repair, ตรวจ booking overlap, server receipt แบบ durable สำหรับการส่งใหม่ซ้ำจากแบบฟอร์มที่ยังเปิดอยู่, ปรับ session expiration และ recheck role, approval action allowlist, private helper RPCs, ลดข้อมูลส่วนบุคคลที่ส่งไปปฏิทินบุคคลทั่วไป
- Room Finder, Calendar range response, Mobile Agenda, หน้ายืนยันแสดง Booking ID, Batch map สำหรับ Admin Approval Overview, ปรับ CSS มือถือ
- Room Preparation Queue และ Operational Status แยกจาก Approval; Health Summary แบบ read-only
- Test Mode แยก config Drive/Slides และระงับ email
- รักษา GAS, Sheets, Drive, Slides, MailApp, ลำดับอนุมัติ 3 ขั้น, Booking Status, PDF Template และ trigger names เดิม

**ยังไม่อยู่ใน R1:** การแยก PDF/Email/Workflow ไป Durable Job Queue/Worker, full guided-form/admin center redesign, full source modularization, notification center/outbox, recurring booking, room maintenance blocking, QR verification, kiosk/digital display, PWA, advanced analytics และ migration ไปสู่ passwordless อย่างบังคับทั้งระบบ การทำรายการเหล่านี้โดยไม่มี integration baseline เพิ่มความเสี่ยงต่อ Production จึงไม่ถือว่า R1 ครบทุกข้อเสนอระยะยาว

## 2. ไฟล์ที่ใช้ใน GAS

อัปโหลด/อัปเดตไฟล์เหล่านี้ให้ครบพร้อมกัน **ไม่ใช่เฉพาะ Code.gs**

- `Code.gs`
- `SignatureService.gs`
- `PronteraServices.gs`
- `PronteraOperations.gs`
- `index.html`
- `javascript.html`
- `stylesheet.html`
- `approve.html`
- `evaluate.html` (คงเดิม)
- `SignatureComponents.html`
- `appsscript.json` (คงเดิม)

ไฟล์ Markdown, `TEST_REPORT.txt`, `tests/` เป็นเอกสาร/ชุดทดสอบของ GitHub ไม่ใช่ Apps Script source files. `.claspignore` ช่วยจำกัดการ push ในกรณีใช้ clasp; ตรวจ `clasp status` ก่อน push. ชุดนี้ไม่รวม `.clasp.json` และไม่เปลี่ยน Script ID ของระบบ

## 3. ตรวจรับก่อนอัปโหลด GitHub / Pull GAS

1. ดาวน์โหลดสำรอง repository เดิม และบันทึก HEAD commit. เก็บสำเนา Code/manifest ของ Apps Script ที่ deploy อยู่จริงด้วย เนื่องจาก GitHub HEAD อาจไม่ตรง Deployment.
2. สำรอง Google Sheets ทั้งไฟล์, Script Properties, Deployment ID/version, Trigger owner/handler/schedule, Drive folder และ Slides Template ACL; ไม่ต้องส่งข้อมูลส่วนบุคคลหรือ token ให้ ChatGPT.
3. แตก ZIP นี้ ตรวจรายการไฟล์. แนะนำให้ commit ไป development branch ก่อน; เมื่อทดสอบแล้วจึง merge/อัปโหลดเข้า `upgrade269` ตามกระบวนการที่โรงเรียนใช้. อย่า overwrite `.clasp.json` ของ project เดิม.
4. หากต้องการตรวจ Offline ซ้ำ เปิด Terminal ใน directory ที่มี `Code.gs` แล้วรัน `node tests/regression.cjs` (Node.js 18+ ไม่ต้องลง dependency เพิ่ม). ตรวจว่า exit code 0.
5. ใช้ไฟล์ Source ทั้ง 11 ไฟล์พร้อมกัน ห้าม Deploy เพียงบางส่วน เพราะมี dependency ข้ามไฟล์.

## 4. Test Deployment แยกจาก Production (แนวทางที่ปลอดภัยที่สุด)

หากเลือกไม่ทำ Sandbox ให้ใช้ `DIRECT_PRODUCTION.md` แทนขั้นตอนส่วนนี้ โดยต้องตรวจ Preflight และทยอยเปิด feature ตามผลตรวจจริง; ไม่ถือว่าผ่าน integration test ล่วงหน้า.

1. สร้างสำเนา Spreadsheet และ bound Apps Script project ใหม่สำหรับทดสอบ. ใช้ headers เหมือนจริง แต่ลบข้อมูลจอง/ลายเซ็น/Approval Token เดิมออกจาก **สำเนาทดสอบเท่านั้น**; เตรียม Rooms, Officers, Approvers และ Admin เป็นบัญชีทดสอบในโดเมนโรงเรียน. ห้ามใช้ข้อมูล live หรือ folder/template live ในการทดสอบ.
2. ทำสำเนา Slides Template และสร้างโฟลเดอร์ทดสอบแยก 3 โฟลเดอร์: initial PDF, final PDF, setup files; ตั้ง ACL เฉพาะผู้ทดสอบ. ตรวจ template มี placeholders ลายเซ็นทั้ง 4 ตำแหน่ง.
3. Pull code ทั้งชุดเข้า test project. ตั้ง Script Properties ตามตารางด้านล่าง **ก่อนกด Run ฟังก์ชันใดที่สร้างไฟล์หรือส่งเมล**. อย่าคัดลอก `PRONTERA_SIGNATURE_VAULT_ID` จาก Production.

| Script Property | ค่าใน Test project |
|---|---|
| `PRONTERA_TEST_MODE` | `true` |
| `PRONTERA_TEMPLATE_SLIDE_ID` | ID ของ Slides Template ทดสอบ |
| `PRONTERA_PDF_FOLDER_ID` | ID ของโฟลเดอร์ initial PDF ทดสอบ |
| `PRONTERA_FINAL_SIGNED_MEMO_FOLDER_ID` | ID ของโฟลเดอร์ final PDF ทดสอบ |
| `PRONTERA_SETUP_FOLDER_ID` | ID ของโฟลเดอร์ setup ทดสอบ (ชื่อต่างจาก `MeetingRoom_SetupFiles`) |
| `PRONTERA_WORKSPACE_DOMAIN` | `g.klaeng.ac.th` หรือโดเมนที่ได้รับอนุญาตจริง |
| `MRBS_WEB_APP_URL_OVERRIDE` | URL `/exec` ของ test deployment เท่านั้น (ตั้งหลัง deploy) |
| `PRONTERA_SIGNATURE_ENABLED` | ยังไม่ต้องตั้ง หรือ `false` |

4. Deploy test เป็น Web app: Execute as **Me (ผู้ Deploy)**, Who has access **บุคลากรภายในโดเมน** ตาม manifest. ใช้ URL test `/exec`. ตั้ง `MRBS_WEB_APP_URL_OVERRIDE` ให้ถูกต้อง. Test Mode ระงับ MailApp ทั้งหมด (ผลส่งใน UI เป็น simulated success, ไม่ใช่การส่งจริง); ใช้ Approval Inbox หรือข้อมูล test flow เพื่อเปิดลิงก์ลงนาม ไม่ต้องสร้าง trigger ใน test จนกว่าจะตรวจเส้นทางหลักครบ.
5. ใช้บัญชีผู้ Deploy รัน `setupApprovalSystem` เฉพาะเมื่อชีททดสอบยังไม่พร้อม (ฟังก์ชันเดิมอาจเพิ่ม Approver default). จากนั้นรัน `setupPronteraSignatureVault` ใน Apps Script Editor. ฟังก์ชันสร้างโฟลเดอร์ private ใน My Drive ของผู้ Deploy + ชีท SignatureProfiles แบบ idempotent โดยไม่เปิด feature เอง. ต้องได้ `ready:true`.
6. ให้ผู้จองและผู้ลงนามทั้ง 3 ขั้นเปิด test web app จากบัญชีจริงของแต่ละคน แล้วกดเมนู **ลายเซ็น**. ขณะยังไม่ enable ระบบจะแสดงว่าอ่าน Workspace email ได้หรือไม่. หากอ่านไม่ได้ (Session.getActiveUser().getEmail() ว่าง) ห้ามแก้ให้เชื่ออีเมลที่พิมพ์เองหรือใช้ Effective User แทน. ต้องแก้ deployment/domain identity ก่อนเปิด feature.
7. ตั้ง `PRONTERA_SIGNATURE_ENABLED=true` ใน test project. ทดสอบผู้จองสร้างลายเซ็นใหม่, จองครั้งแรกและครั้งถัดไป, ยืนยันทุกครั้ง, เปลี่ยนลายเซ็น, เปิดเอกสารเก่า; ผู้ลงนามทั้ง 3 ขั้นทดสอบตาม `PRODUCTION_CHECKLIST.md`. Profile bytes ไม่ส่งกลับ Client; UI แสดงสถานะ/เวอร์ชัน ไม่แสดงรูปเดิมเพื่อไม่เปิดช่องคัดลอกผ่านหน้าเว็บ. ภาพที่วาดหรืออัปโหลดใหม่แสดงใน canvas ก่อนบันทึก.
8. หลังยืนยัน identity ของทุกบัญชีแล้ว ทดสอบเพิ่ม `PRONTERA_STRICT_APPROVAL_IDENTITY=true`, `PRONTERA_STRICT_REQUESTER_IDENTITY=true`, `PRONTERA_STRICT_PDF_SIGNATURES=true` ทีละค่า. ทดสอบ SSO บัญชีเจ้าหน้าที่ทุก role ก่อนตั้ง `PRONTERA_WORKSPACE_ONLY_STAFF=true`.
9. ทดสอบ Trigger และ email แยกต่างหากด้วยข้อมูลสังเคราะห์และผู้รับเฉพาะ test. หากต้องการทดสอบการส่งจริง ให้ใช้ project ทดสอบที่ตั้งค่าทรัพยากรและ recipient ทุกตำแหน่งเป็น test และตรวจว่าไม่มีข้อมูลจริง จากนั้นจึงปิด Test Mode ชั่วคราว; **ห้ามปิด Test Mode บนสำเนาที่มีผู้รับหรือไฟล์ Production**. คืนค่า `true` หลังทดสอบ.

## 5. Controlled Production Rollout

1. หลังผ่าน checklist ให้ Pull/อัปโหลด Source Code ชุดเต็มเข้า GAS project เดิม. ตรวจว่าใช้ Spreadsheet, Script ID, Slides, Drive, URL และ owner เดิม. **ห้ามนำ test Script Properties หรือ Test Mode เข้าสู่ Production**.
2. ตรวจว่า `PRONTERA_TEST_MODE` ไม่ใช่ `true`; flags ใหม่ทั้งหมดยังเป็น `false` หรือไม่ได้ตั้ง. Source เดิมจะใช้ manual signature ตามเดิม; การแก้ foundation, calendar, Workspace tools และ room operations เริ่มใช้งานทันทีเมื่อ Deploy ใหม่. ตรวจ regression ของงานเดิมก่อน.
3. Deploy เป็น **New version ของ deployment เดิม** เพื่อรักษา URL `/exec` และลิงก์ token เดิม. บันทึก version เดิมไว้เพื่อ rollback. ไม่ต้องเปลี่ยน Execute as หรือ access โดยพลการ.
4. ใช้บัญชี deployer รัน `setupPronteraSignatureVault` ใน Production เท่านั้นหลังตรวจ ACL ของ spreadsheet/Drive. รันครั้งเดียวแล้วตรวจว่าชีทและ Vault private. ถ้าฟังก์ชันแจ้ง SIGNATURE_VAULT_UNSAFE ให้หยุด; อย่าผ่อนสิทธิ์ vault เพื่อให้ผ่าน.
5. ตรวจ identity จาก web app ด้วยบัญชีผู้จองและผู้ลงนามจริงทุกระดับ. ตั้ง `PRONTERA_SIGNATURE_ENABLED=true` เมื่อผ่านการทดสอบ. เริ่มจองรายการควบคุมและลงนามครบ 3 ขั้น; ตรวจ PDF ทุกลายเซ็น. Feature enabled จะป้องกัน iframe embedding ด้วย XFrameOptions DEFAULT.
6. เมื่อมั่นใจว่า identity จริงพร้อม ให้ทยอยเปิด flags strict ทีละค่า (ตารางถัดไป). อย่าเปิดทั้งหมดพร้อมกัน. ตรวจรายการค้างเดิมและงานใหม่ก่อนเปิด strict PDF.
7. ตรวจ Executions, Log, ApprovalLogs และหน้าตรวจสุขภาพระบบ. ตรวจ Trigger ก่อนติดตั้งอะไรเพิ่ม. R1 ไม่ต้องมี Trigger ใหม่สำหรับ Signature/Operations และไม่เปลี่ยนชื่อ handler เดิม.

### Feature flags และ properties (Production)

| Property | Default | ผล/เงื่อนไข |
|---|---|---|
| `PRONTERA_SIGNATURE_ENABLED` | false | เปิด reusable signature; ต้อง setup vault และ identity preflight; เมื่อเปิด manual signature ใหม่ก็เก็บใน vault; ป้องกัน embedding |
| `PRONTERA_SIGNATURE_VAULT_ID` | ไม่มี | ถูกตั้งโดย setup function; เก็บเป็น private My Drive ของ deployer; ห้ามแก้/ลบเอง |
| `PRONTERA_WORKSPACE_DOMAIN` | g.klaeng.ac.th | โดเมนอนุญาตให้ใช้ Workspace features |
| `PRONTERA_STRICT_APPROVAL_IDENTITY` | false | ตรวจ email Workspace ตรงกับ Approver ที่ถูกกำหนดสำหรับทั้ง approve/reject และเปิดหน้า token; saved profile ตรวจตัวตนเสมอแม้ flag false |
| `PRONTERA_STRICT_REQUESTER_IDENTITY` | false | ผู้จองใหม่ต้องใช้อีเมลบัญชี Workspace ตรงกับ request; ไม่บังคับ legacy officer edit |
| `PRONTERA_STRICT_PDF_SIGNATURES` | false | ทุกลายเซ็นใน final PDF ต้องอ่านได้และพบ placeholder; saved-profile signatures ตรวจเสมอแม้ flag false |
| `PRONTERA_WORKSPACE_ONLY_STAFF` | false | ปิด password login และ bind session กับ email Workspace; ทดสอบทุก role ก่อนเปิด |
| `PRONTERA_DOMAIN_DOCUMENTS` | false | เปลี่ยนการแชร์ไฟล์เอกสารที่สร้างใหม่เป็น domain-with-link; ต้อง audit ACL และ inherited permissions ก่อน เพราะเอกสารเก่า/โฟลเดอร์เดิมไม่ได้ migrate |
| `PRONTERA_GUARD_LEGACY_TRIGGERS` | false | จำกัด handler legacy ให้ trigger UID ที่ตรง owner/handler หรือ deployer; เปิดเมื่อทดสอบ trigger จริงทุกตัวแล้วเท่านั้น |
| `PRONTERA_TEST_MODE` | false | ใช้เฉพาะ test project; suppress mail และบังคับ config แยก |
| `PRONTERA_TEMPLATE_SLIDE_ID`, `PRONTERA_PDF_FOLDER_ID`, `PRONTERA_FINAL_SIGNED_MEMO_FOLDER_ID`, `PRONTERA_SETUP_FOLDER_ID` | Production เดิม | Optional override; ห้ามเปลี่ยนหากไม่ต้องการย้ายทรัพยากร |

## 6. OAuth scopes (manifest ไม่เปลี่ยน)

- `https://www.googleapis.com/auth/spreadsheets` — อ่าน/เขียน Sheets
- `https://www.googleapis.com/auth/drive` — Drive files, ACL, Signature Vault, PDF
- `https://www.googleapis.com/auth/script.send_mail` — MailApp
- `https://www.googleapis.com/auth/presentations` — Slides Template/PDF
- `https://www.googleapis.com/auth/script.external_request` — scope เดิม
- `https://www.googleapis.com/auth/userinfo.email` — Workspace identity
- `https://www.googleapis.com/auth/script.scriptapp` — trigger management

หาก OAuth consent เปลี่ยน/ผู้ Deploy ถูกเปลี่ยนบัญชี ต้องตรวจสิทธิ์ใหม่ทั้งหมด ไม่ควรแก้ executeAs ให้เป็นผู้ใช้แต่ละคนโดยไม่ประเมิน Drive/Sheets permission

## 7. Trigger setup

ตรวจ `TRIGGERS.md` และรายการ Trigger จริงใน Apps Script Editor ก่อนติดตั้ง; คง handler และ schedule เดิม ไม่ติดตั้งซ้ำ. Daily Approval Digest ใหม่ใน baseline มี installer อยู่แล้ว; หากใช้อยู่ให้คง `sendDailyPendingApprovalDigest` และตรวจว่า legacy `sendPendingApprovalReminders` ไม่ส่งซ้ำ. ไม่รัน installer อัตโนมัติจากชุด R1. ถ้าจำเป็นต้องสร้าง ให้เลือก Time-driven และ schedule ตามคู่มือเดิม; Daily Digest ใกล้ 08:15 Bangkok. `PRONTERA_GUARD_LEGACY_TRIGGERS` เปิดหลังตรวจว่าทุก Trigger รันสำเร็จเท่านั้น.

## 8. Limitations และ Rollback

ดู `ROLLBACK.md`, `PRODUCTION_CHECKLIST.md`, `R1_SCHEMA.md`. GAS มีข้อจำกัดทั่วไปประมาณ 6 นาทีต่อ execution, daily email/service quotas, concurrent executions, properties storage, Cache eviction และ trigger runtime quota ตามประเภทบัญชี; ตรวจ quota ของ Workspace จริง. Calendar range filter ลด payload แต่ยังอ่านข้อมูล Bookings ทั้งชีท; PDF generation และ MailApp ยัง synchronous. ไม่รับรอง latency ที่ไม่ได้ benchmark. Google Sheets ไม่ใช่ transactional database, ระบบยังต้องการ reconciliation เมื่อ partial failure. Receipt ป้องกันการส่งซ้ำเฉพาะคำขอใหม่ในแบบฟอร์มเดิมที่มี Web Crypto, ไม่คงอยู่เมื่อปิด/refresh หน้าและไม่รองรับ edit idempotency. Existing password login ยังเป็น SHA-256 legacy จนกว่าจะบังคับ Workspace-only. Existing shared files/old signature images ไม่ได้รับ ACL migration อัตโนมัติ. Spreadsheet editors, GAS project editors, deployer/Drive owner เป็น trusted administrators; ห้ามให้บุคลากรทั่วไปเป็น editor ของฐานข้อมูลหรือ vault. Shared emails/fallback approver names ต้องตรวจนโยบายการมอบหมายให้ชัดเจน (เมื่อ configured email หลายคน ระบบบันทึก email ที่ยืนยันได้ แต่ชื่ออาจเป็นชื่อที่ผู้ลงนามระบุเอง). Electronic signature รูปภาพ ไม่ใช่ cryptographic PKI signature.

ถ้าพบข้อผิดพลาด ให้หยุด rollout ปิด flags ที่เพิ่งเปิด ตรวจรายการที่ค้างและ rollback deployment version ตามคู่มือ ห้าม restore database ทั้งไฟล์ทับคำขอที่เกิดหลัง backup.
