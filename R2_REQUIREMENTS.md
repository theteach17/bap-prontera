# R2 Requirement Traceability / Release Gate

สถานะ `Implemented / mock-tested` หมายถึงมีโค้ดและหลักฐานจำลอง ไม่ใช่ผ่านการตรวจรับ Production. `Partial` หมายถึงยังมีข้อกำหนดที่ไม่ครบ. `Open` หมายถึงยังไม่ดำเนินการหรือยังไม่มีหลักฐานยืนยัน.

| Requirement | Status | Evidence / ข้อจำกัด |
|---|---|---|
| GAS + Workspace + Sheets / 3-step approvals / existing data | Implemented / mock-tested | Code.gs, appsscript.json; R1.1 regression retained. Runtime verification required. |
| Booking overlap, receipt, session, role checks, token sequence, recovery | Partial | R1.1 code + tests; receipt within same browser form only, no all-branch/race/transaction guarantees. |
| Strict identity / SSO / RBAC / file access | Partial | SignatureService.gs, PronteraServices.gs; optional flags; migration from legacy password and full ACL audit open. |
| Signature enrollment, reuse, change, version snapshot, hash checks | Implemented / mock-tested | SignatureService.gs, SignatureComponents.html; requires Vault + actual Workspace. |
| Complete visual redesign / navigation / homepage / responsive | Implemented / mock-tested | index.html, stylesheet.html, Experience.html; browser smoke checks; actual CDN/calendar visual verification open. |
| Smart room finder, calendar filter, three-step booking wizard, review | Implemented / mock-tested | Code.gs, javascript.html, Experience.html; real browser with actual RPC pending. |
| My Bookings, Approval Center, timeline, signature profile | Implemented / mock-tested | PronteraServices.gs, Experience.html; identity required. |
| Admin Center, Dashboard, approval and evaluation UI | Partial | New shell, tabs, dashboard, common style; approval/evaluation retain core controls; full UX/UAT/accessibility audit pending. |
| Loading, empty/error states, keyboard / accessibility | Partial | Shared components, focus/reduced motion, wizard validation; full WCAG audit open. |
| Calendar range response / batch reads | Partial | R1.1 retained; full Sheets scans remain. |
| Cache redesign / lock minimization / benchmark | Open | No measured GAS benchmark, full lock minimization or comprehensive caching. |
| Durable Job Queue / Final PDF async / retry / worker health | Implemented / mock-tested | PronteraWorker.gs; optional, final PDF only, lock held during generation. |
| Initial PDF async / full Notification Outbox / all-job recovery | Open | Initial PDF and mail remain synchronous. |
| Room preparation and status | Implemented / mock-tested | PronteraOperations.gs, existing status logic separate from approval. |
| Room maintenance blocking | Implemented / mock-tested | PronteraMaintenance.gs; flag, no automatic cancellation. |
| Recurring booking | Partial | PronteraPlanning.gs: 2–12 week plan, separate signed submissions, no batch reservation or atomic series. |
| In-app notifications | Partial | Approval inbox exists; no standalone notification center/read receipts/outbox. |
| QR document verification | Implemented / mock-tested | PronteraVerification.gs, PronteraQrLibrary.gs, verify.html; decoded PNG; actual Slides template and printed scan pending. |
| Digital room display | Implemented / mock-tested | display.html, domain-only, scheduled status not real occupancy. Upcoming maintenance not displayed separately. |
| PWA / offline service worker | Open | GAS iframe hosting constraints; responsive web app only. |
| Analytics per room and approval duration | Partial | PronteraAnalytics.gs; rolling 30 days approved hours and completed approval time; no capacity/time denominator, demand heatmap or enhanced satisfaction analytics. |
| System Health / Error Monitoring | Partial | PronteraOperations.gs, worker health; centralized error event dashboard not complete. |
| Full modularization | Partial | Added service modules; Code.gs remains large. |
| Static / mock regression / browser smoke / QR decode | Passed (limited) | TEST_REPORT_R2.txt: 102; BROWSER_TEST_R2.txt: 15; QR_TEST_R2.txt: 1. 265/265 function entries, not branch coverage. |
| Integration / concurrency / GAS quota / live mail / ACL / UAT | Open | No real Google runtime available in test environment; preflight and controlled acceptance mandatory. |
| Complete Master Plan / final Production acceptance | **NOT PASSED** | R2 is a release candidate with explicit open scope; no claim of complete production readiness. |

No live data, deployed version, GitHub, trigger, or Drive resource was changed by this packaging step. Decisions: final PDF worker only; weekly recurring planner instead of batch booking; optional flags off by default; QR only new final PDF after enabling; no PWA/offline claim. See README for installation, OAuth, trigger and rollback.
