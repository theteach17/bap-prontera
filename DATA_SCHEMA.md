# โครงสร้างข้อมูล Google Sheets

## `Rooms`

ใช้เก็บข้อมูลห้องประชุมที่เปิดให้จอง

| Column | ความหมาย |
|---|---|
| `Room ID` | รหัสห้อง เช่น L03, L04 |
| `Room Name` | ชื่อห้อง |
| `Location` | อาคาร/สถานที่ |
| `Capacity` | ความจุ |
| `Facilities` | อุปกรณ์ เช่น LED, HDMI, SOUND |
| `Status` | `Available` หรือ `Active` จึงจะถูกโหลด |
| `Image_URL` | รูปภาพห้อง |
| `Hex Code` | สีประจำห้องบนปฏิทิน |
| `Layout` | ถ้า `Active/Yes/ใช่/true` จะบังคับแนบไฟล์รูปแบบการจัดสถานที่ |

## `Bookings`

หัวตารางที่ระบบต้องใช้ตาม `BOOKING_REQUIRED_HEADERS`

| Column | ความหมาย |
|---|---|
| `Booking ID` | รหัสการจอง เช่น BK-yyyyMMddHHmmss-random |
| `Timestamp` | วันเวลาที่บันทึก |
| `Room ID` | รหัสห้อง |
| `Room Name` | ชื่อห้อง |
| `Topic` | หัวข้อการประชุม |
| `Requester Name` | ผู้จอง |
| `Start Time` | เวลาเริ่ม |
| `End Time` | เวลาสิ้นสุด |
| `Headcount` | จำนวนผู้เข้าร่วม |
| `Status` | สถานะการจองตาม State Model |
| `Requester Email` | อีเมลผู้จอง |
| `Eval Sent` | flag ว่าส่งแบบประเมินแล้วหรือยัง |
| `Reminder30MinSent` | flag ว่าส่งแจ้งเตือนเร่งด่วนแล้วหรือยัง |
| `SetupDetails` | รายละเอียดการจัดสถานที่ |
| `Layout` | URL ไฟล์ layout/แนบเพิ่มเติม |
| `EvaluationSummarySent` | flag ว่าส่งสรุปประเมินแล้วหรือยัง |
| `Cancel Reason` | เหตุผลยกเลิก/ปฏิเสธ/approval error |
| `Last Updated` | เวลาแก้ไขล่าสุด |
| `Memo PDF URL` | URL บันทึกข้อความตั้งต้น |
| `Signature File ID` | file id ลายเซ็นผู้จอง |
| `Signature Image URL` | URL ลายเซ็นผู้จอง |

## `ApprovalFlow`

เก็บภาพรวม workflow หนึ่งชุดต่อหนึ่งกระบวนการลงนาม

| Column | ความหมาย |
|---|---|
| `Approval ID` | รหัส workflow เช่น AP-yyyyMMddHHmmss-random |
| `Booking ID` | อ้างถึงรายการจอง |
| `Topic` | หัวข้อ |
| `Room ID` | รหัสห้อง |
| `Room Name` | ชื่อห้อง |
| `Requester` | ผู้จอง |
| `Requester Email` | อีเมลผู้จอง |
| `Current Step` | step ปัจจุบัน |
| `Current Approver Role` | role ของผู้ลงนามปัจจุบัน |
| `Current Approver Email` | อีเมลผู้ลงนามปัจจุบัน |
| `Overall Status` | สถานะ workflow เช่น PENDING_ROOM_OFFICER, COMPLETED, CANCELLED |
| `Initial Memo PDF URL` | เอกสารก่อนลงนามครบ |
| `Final Signed PDF URL` | เอกสารหลังลงนามครบ |
| `Final Signed PDF File ID` | file id ของ PDF ฉบับสมบูรณ์ |
| `Created At` | เวลาสร้าง flow |
| `Updated At` | เวลาอัปเดตล่าสุด |
| `Completed At` | เวลาจบกระบวนการ |
| `Cancel/Reject Reason` | เหตุผลยกเลิกหรือไม่อนุมัติ |

## `ApprovalSteps`

เก็บข้อมูลผู้ลงนามรายขั้น

| Column | ความหมาย |
|---|---|
| `Approval ID` | อ้างถึง flow |
| `Booking ID` | อ้างถึง booking |
| `Step No` | 1, 2, 3 |
| `Step Name` | ชื่อขั้นตอน |
| `Approver Role` | role key |
| `Approver Name` | ชื่อผู้ลงนาม |
| `Approver Email` | อีเมลผู้ลงนาม |
| `Status` | WAITING, PENDING, SIGNED, REJECTED, CANCELLED, SUPERSEDED |
| `Sign Method` | draw หรือ upload |
| `Signature File ID` | file id ลายเซ็น |
| `Signature Image URL` | URL ลายเซ็น |
| `Signed At` | เวลาลงนาม |
| `Comment` | ความเห็น |
| `Token` | token สำหรับลิงก์ลงนาม |
| `Token Expire At` | วันหมดอายุ token |
| `Notify Count` | จำนวนครั้งที่ส่งอีเมลแจ้ง |
| `Last Notified At` | เวลาส่งอีเมลล่าสุด |
| `Rejected Reason` | เหตุผลไม่อนุมัติ |
| `Created At` | เวลาสร้าง step |
| `Updated At` | เวลาอัปเดต step |
| `Approver Position` | ตำแหน่งเต็ม |
| `Approver Position Short` | ตำแหน่งย่อ |

## `Approvers`

ตั้งค่าผู้ลงนาม

| Column | ความหมาย |
|---|---|
| `Step No` | ขั้นที่ 1, 2, 3 |
| `Step Name` | ชื่อขั้น |
| `Role Key` | เช่น ROOM_OFFICER, BUILDING_GROUP, DEPUTY_BUDGET |
| `Name` | ชื่อผู้ลงนาม |
| `Email` | อีเมลผู้ลงนาม |
| `Active` | true/yes/active/ใช่ = เปิดใช้งาน |
| `Room ID` | ห้องที่รับผิดชอบ หรือ ALL |
| `Room Name` | ชื่อห้อง |
| `Position` | ตำแหน่งเต็ม |
| `Position Short` | ตำแหน่งย่อ |

## `Evaluate`

เก็บผลแบบประเมินหลังใช้งาน ระบบเขียนโดย `submitEvaluation()` ประกอบด้วย Booking ID รายละเอียดการจอง คะแนน 10 ข้อ ข้อเสนอแนะ คะแนนรวม และเวลาส่ง

## `Logs`

เก็บ log ทั่วไปจาก `logAction()` เช่น การจอง การยกเลิก error จากอีเมลหรือ approval

## `ApprovalLogs`

เก็บ log เฉพาะ workflow ลงนาม เช่น resolve approvers, create flow, send approval email, signed, generate final PDF, cancel flow
