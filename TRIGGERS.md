# Trigger Setup

Trigger ต้องตั้งเองใน Apps Script เพราะ `appsscript.json` ไม่สามารถสร้าง installable triggers ให้โดยอัตโนมัติ

## Trigger ที่แนะนำ

| ฟังก์ชัน | ชนิด Trigger | ความถี่แนะนำ | หมายเหตุ |
|---|---|---|---|
| `sendDailySummaryToAdmins` | Time-driven | ทุกวันช่วงเช้า | ส่งสรุปรายการจองวันนี้ให้ admin |
| `sendOneDayAdvanceReminder` | Time-driven | ทุกวันช่วงเช้า | เตือนผู้เกี่ยวข้องล่วงหน้า 1 วัน |
| `sendUrgentReminders` | Time-driven | ทุก 5, 10 หรือ 15 นาที | ส่งเตือนก่อนประชุมประมาณ 30 นาที |
| `sendPostMeetingSurvey` | Time-driven | ทุก 1 ชั่วโมง หรือวันละหลายครั้ง | ส่งแบบประเมินหลังประชุมจบ |
| `sendEvaluationSummary` | Time-driven | ทุกวันช่วงเย็น | ส่งสรุปผลประเมินหลังครบช่วงเวลา |
| `sendPendingApprovalReminders` | Time-driven | ทุก 6–12 ชั่วโมง หรือวันละครั้ง | เตือนผู้ลงนามที่ยังค้างอยู่ |

## วิธีตั้ง Trigger

1. เปิด Apps Script Editor
2. ไปที่เมนู Triggers
3. กด Add Trigger
4. เลือกฟังก์ชัน
5. เลือก event source เป็น Time-driven
6. เลือกความถี่ตามตาราง
7. Save
8. อนุญาตสิทธิ์หากระบบถาม

## ข้อควรระวัง

- อย่าตั้ง trigger ถี่เกินจำเป็น เพราะอาจกระทบ quota
- `sendUrgentReminders` ถี่ได้กว่าฟังก์ชันอื่น แต่ควรเริ่มที่ทุก 10–15 นาที
- หากระบบส่งอีเมลซ้ำ ให้ตรวจ flag ใน `Bookings` เช่น `Eval Sent`, `Reminder30MinSent`, `EvaluationSummarySent`
- ฟังก์ชัน reminder และ evaluation ปัจจุบันควรทำงานเฉพาะ `Approved` เท่านั้น
