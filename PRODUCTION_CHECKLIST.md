# R1.1 audit notice

The offline checks below do not replace real Workspace/Drive/Slides/MailApp verification. For an intentionally direct rollout without a separate database, follow `DIRECT_PRODUCTION.md` first, preserve the old deployment version, and run the read-only editor preflight before deploying. R1.1 has 85 offline test groups and 238/238 server function entries, not exhaustive branch coverage. Unexecuted real-runtime checklist items remain unverified.

---

# Prontera R1 — Production Acceptance Checklist

ทุกข้อเป็น **งานตรวจรับที่ยังต้องทำบน test deployment จริง** เว้นแต่ระบุว่า offline ผ่าน. อย่าใช้ข้อมูลจริงเพื่อทดสอบความผิดพลาดแบบจงใจ.

| ID | สิ่งที่ทดสอบ | Expected result |
|---|---|---|
| B01 | จองใหม่แบบ legacy, flags off | PDF ตั้งต้นครบ, Pending Approval, email/workflow ตามเดิม |
| B02 | จองช่วงเวลาชนพร้อมกัน 2 browser | สำเร็จเพียง 1 รายการ, อีกรายการถูกแจ้งห้องไม่ว่าง |
| B03 | เริ่มตรงกับเวลาสิ้นสุดรายการก่อน | อนุญาตตาม half-open interval เดิม |
| B04 | ตัด connection หลังเขียน booking แล้ว retry ในแบบฟอร์มเดิมโดยไม่เปลี่ยน payload | Booking ID เดิม, ไม่มี row หรือ email ใหม่ |
| B05 | Approval Error / Pending Approval | ยังกันห้องและไม่ส่ง operational reminder/assessment |
| B06 | เจ้าหน้าที่แก้ไข booking | workflow เดิม SUPERSEDED; ข้อมูลใหม่ถูกต้อง; token เดิมใช้ไม่ได้ |
| B07 | ยกเลิกพร้อมอนุมัติ | ไม่มี booking ฟื้นกลับเป็น Approved หลัง Cancelled; token เดิมใช้ไม่ได้ |
| B08 | วันเวลา 24h, ข้ามวัน, เขตเวลาไทย | Sheet/Calendar/PDF/Email ตรงกัน; วันที่ผิดถูกปฏิเสธ |
| B09 | อัปโหลด setup file | จำกัดขนาด, ไฟล์ถูกเก็บในโฟลเดอร์ที่กำหนดและผู้เกี่ยวข้องเปิดได้ |
| S01 | บัญชีผู้จองเปิดหน้า profile, flags off | แสดง Workspace email ที่ตรงกับบัญชีจริง |
| S02 | สร้าง vault | My Drive ของ deployer, ไม่มี viewer/editor อื่น, private; rerun ไม่สร้างซ้ำ |
| S03 | วาด PNG และ import JPG/PNG บนมือถือ/desktop | แสดงภาพใน canvas, บันทึกเมื่อ consent, ได้ version 1 |
| S04 | ผู้จองครั้งถัดไป | ใช้ profile เดิมได้โดยไม่วาดใหม่; ต้องกด confirm ลงนาม |
| S05 | เปลี่ยน signature version | version เพิ่ม, row เก่าและ snapshot เก่ายังอยู่; เอกสารเก่าไม่เปลี่ยน |
| S06 | เปลี่ยนลายเซ็นจากอีก tab ระหว่างรอยืนยัน | ปฏิเสธ stale profile ID; โหลด/ยืนยันใหม่ |
| S07 | เปิด token ของคนอื่นด้วยบัญชีผิด | saved signature ถูกปฏิเสธเสมอ; strict approval เปิดแล้วเปิดหน้า/submit ไม่ได้ |
| S08 | เปิด token โดย identity ว่าง | ไม่ใช้ saved signature; strict approval เปิดแล้วปฏิเสธ |
| S09 | ผู้ลงนามขั้น 1-3 บันทึกลายเซ็นครั้งแรกและอนุมัติ | เอกสารเดินขั้นเดิม; ขั้นถัดไปไม่สามารถลงนามล่วงหน้า |
| S10 | ผู้อนุมัติเปลี่ยนลายเซ็นหลังลงนามขั้น 1 ก่อนสร้าง Final PDF | Final PDF ใช้ snapshot version เดิม; ลายเซ็นครบ 4 ตำแหน่ง |
| S11 | ใน test เท่านั้น: เปลี่ยน bytes ของ snapshot หรือเอา placeholder ออก | final PDF ไม่เปลี่ยนเป็น approved หาก saved-profile signature ตรวจไม่ผ่าน; รายการกันห้องและเข้า Approval Error |
| S12 | กู้คืนจาก Approval Error ด้วย Admin workflow recovery | ไม่สูญเสียลายเซ็นที่เคยบันทึก; final PDF ถูกสร้างหลังแก้สาเหตุ |
| S13 | เจ้าหน้าที่พยายามใช้ saved signature ของผู้จองรายอื่น | ไม่สามารถใช้จากบัญชีผิด หรือแก้ requester email เพื่อใช้ลายเซ็นแทนผู้จองเดิม |
| S14 | ตรวจ raw signature ACL และ Spreadsheet sharing | ผู้ใช้ทั่วไปเปิด profile/snapshot Drive link ไม่ได้; Sheet/Script มีเฉพาะ trusted editors |
| A01 | Login แบบเดิมและ Workspace | มี role เท่ากับ Admin sheet; user ไม่ provision เข้า staff ไม่ได้ |
| A02 | เปลี่ยน role/deactivate และใช้ session เดิม | requireUser_ ปฏิเสธสิทธิ์เดิม |
| A03 | Session หมดอายุ 6h | ไม่ต่อ absolute TTL จาก refresh |
| A04 | บุคลากรทั่วไปเรียก admin repair | ถูกปฏิเสธ; ไม่มี data changes |
| U01 | Calendar desktop, iOS, Android | Month/Week/Day/List เปิดได้, แสดง status/ห้อง; UI ไม่ล้น |
| U02 | ค้นหาห้องว่าง | ความจุและ status overlap ตรงกับ final save; หากมีคนจองก่อน save ระบบปฏิเสธ |
| U03 | My Bookings | เห็นเฉพาะ requester email ตรง Workspace, ไม่แสดงข้อมูลบัญชีอื่น |
| U04 | Approval Inbox | เห็นเฉพาะ pending step ที่ assigned, token หมดอายุไม่มีลิงก์, ลิงก์เดิมยังใช้ได้เมื่อสิทธิ์ตรง |
| U05 | Room Preparation Queue | Approved เท่านั้น; สถานะงานแยก, แก้ booking แล้ว revision เดิมไม่ถูกนำมาใช้ |
| U06 | Health Check | แสดงจำนวนข้อผิดปกติโดยไม่แก้ข้อมูลหรือเปิดเผย token |
| E01 | แบบประเมิน Approved หลังจบใน 5 วัน, คะแนน 1–5 | บันทึกตามนโยบายเดิม; Pending/Cancelled/Rejected ปฏิเสธ |
| E02 | Trigger ทั้งหมด | รันโดยเจ้าของเดิม, เวลาตามกำหนด; ไม่ส่งซ้ำ |
| E03 | Test Mode | ไม่มี mail ส่งออกจริง, สร้างไฟล์เฉพาะ test resources |
| P01 | วัดเวลา p50/p95 Calendar, booking, approval และ final PDF | เปรียบเทียบ baseline; ไม่มี performance regression ที่ยอมรับไม่ได้ |
| R01 | rollback deployment ใน test | URL เดิมและข้อมูลเดิมอ่านได้; extra sheets/columns ยังอยู่ |

## Stop conditions

หยุด rollout หากพบ double booking, duplicate booking, ข้อมูลถูกแก้โดยไม่มีสิทธิ์, PDF ขาดลายเซ็น, wrong signer identity, token ใช้งานข้ามขั้น, ACL ของ vault ไม่ private, อีเมลทดสอบออกไปยังผู้รับจริง, approval/booking state ไม่ตรง หรือการใช้งานเดิมเสียหาย. ปิด flags และ rollback ตาม `ROLLBACK.md` ก่อนดำเนินงานต่อ.

## Offline test results

ดู `TEST_REPORT.txt`. Node test จำลอง Sheets, Drive, Session, Lock และ properties; ขณะทดสอบ booking/approval จำลอง Slides PDF rendering และ MailApp side effects. ไม่ได้ทดสอบ browser interaction, real OAuth identity, trigger UID, true concurrent execution, shared-drive inheritance หรือ PDF template จริง. ต้องตรวจรายการทั้งหมดข้างต้นในสภาพแวดล้อมจริงก่อน production enable.
