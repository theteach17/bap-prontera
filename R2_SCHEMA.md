# R2 additive database schema

Existing R1.1 schemas are unchanged (see R1_SCHEMA.md). These are created only when the associated feature is used or explicitly initialized. Keep all columns in this order; do not pre-fill fake records in Production.

- `PronteraJobs`: Job ID, Booking ID, Approval ID, State, Attempts, Next Run, Updated At, Last Error. States QUEUED, RUNNING, RETRY, DONE, FAILED, SUPERSEDED. Created by setupPronteraFinalWorker. ID `FINAL:<approvalId>`; no manual queue mutation while worker active.
- `RoomMaintenance`: ID, Room ID, Start Time, End Time, Reason, Status, Created At, Actor. ACTIVE/CANCELLED; half-open ranges; guarded by same ScriptLock as booking. Created on first admin maintenance window.
- `PronteraVerification`: Token Hash, Approval ID, Booking ID, Final File ID, Created At. Hash only, no raw verification token. Created on first final PDF generated with QR enabled. Verify current completed workflow + approved booking + final file reference, not PDF content.

No schema migration executes during read-only preflight. Do not delete added sheets when reverting the deployment; reconcile active jobs and maintenance before rollback.
