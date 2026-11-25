# R1.1 audit report — 25 November 2026

Audited the supplied R1 ZIP against baseline `1bd2ac1891eb6c9c76ba09184070f34ad6839a89`. This is a corrected full-source rollout candidate, not a verified production deployment.

| Finding | R1.1 action |
|---|---|
| Saved-profile receipt lookup before identity check | Verify requester identity first |
| Old approvals potentially usable during failed booking edit | Mark Approval Error and invalidate previous flow before data mutation; explicit edit recovery marker |
| Booking already persisted but mail/log failure returned failure | Best-effort side effects and explicit committed-result warning |
| First approval email failure | Preserve valid workflow and expose warning; admin resend/inbox recovery |
| Duplicate token/current-step mismatch | Fail closed; check step index and generated approval ID collision |
| False completion/status repair | Require final PDF evidence and successful booking status update |
| Multiple configured approver emails | Validate configured list for create and resume |
| Empty/ambiguous credentials and role revocation | Reject invalid login and recheck active role |
| Spreadsheet formula injection via logs/reasons | Escape formula-leading text |
| Survey window mismatch and concurrent submit | Align time window and serialize evaluation submission |
| Expired approval link resent without renewal | Lock resend and renew expired/missing token |
| Case-variant metadata headers | Case-insensitive lookup |
| No read-only live preflight | Editor-only `pronteraProductionPreflight` |

## Verification
- `node tests/regression.cjs`: 85 check groups passed on repeated independent process runs. See TEST_REPORT.txt. Static syntax and manifest parse included.
- Instrumented entry counts: 238/238 declared server functions invoked at least once. Some entries exercise rejection paths only. This is not statement, branch, path or exhaustive condition coverage.
- Expanded tests run actual application logic for booking, approval, Slides shape placement, PDF generation calls, reminders, evaluation, CRUD, triggers and repair atop simulated GAS APIs. They do not invoke Google's real APIs. HTML RPC names and embedded JS syntax are checked; no interactive browser session was run.
- Manifest byte-identical to original supplied baseline. No changes to live repository, Sheet, Drive, deployment or trigger.

## Remaining risks / not verified
- Actual Slides rendering and layout, Workspace identity from deployed web app, ACL/inherited access and write permissions, real email delivery, OAuth, browser behavior, concurrent real GAS executions, quotas and runtime trigger schedules remain untested. Preflight checks only the items listed in its result.
- Sheets multi-write operations are not atomic. The edit barrier fails closed, but an interrupted write may require reconciliation. Email/PDF side effects are synchronous, not an exactly-once transaction. No durable outbox/worker.
- Receipt covers retries of new booking from same form; reload/edit retries not covered. Legacy token-only signing, password login and broader document sharing remain possible until relevant flags are safely enabled.
- Roadmap items not implemented in R1 remain out of scope. No certification of zero defects or complete production readiness.
