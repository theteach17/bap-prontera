/** Operational tasks are separate from booking/approval states, append-only for audit. */
const PRONTERA_OPERATIONS_HEADERS=['Booking ID','Revision','Operational Status','Updated At','Actor'];
const PRONTERA_OPERATION_STATES=['WAITING_SETUP','IN_PROGRESS','READY','COMPLETED'];
function pronteraOperationRevision_(booking) {
  return hashPassword(JSON.stringify([booking.bookingId,booking.memoPdfUrl,String(booking.start),String(booking.end),booking.roomId,booking.setupDetails,booking.layoutUrl]));
}
function pronteraOperationsSheet_(create) {
  const ss=SpreadsheetApp.getActiveSpreadsheet();let s=ss.getSheetByName('RoomOperations');
  if(!s&&create){s=ss.insertSheet('RoomOperations');s.appendRow(PRONTERA_OPERATIONS_HEADERS);}
  if(s){const h=s.getRange(1,1,1,PRONTERA_OPERATIONS_HEADERS.length).getValues()[0];if(h.some((v,i)=>v!==PRONTERA_OPERATIONS_HEADERS[i]))throw new Error('ROOM_OPERATIONS_SCHEMA_INVALID');}
  return s;
}
function pronteraOperationIndex_(){
  const sheet=pronteraOperationsSheet_(false),index=new Map();
  if(sheet)sheet.getDataRange().getValues().slice(1).forEach(r=>index.set(String(r[0])+':'+String(r[1]),r));
  return index;
}
/** Read upcoming approved meetings and operational state, no edits to Bookings. */
function getPronteraRoomOperations(sessionToken) {
  requireUser_(sessionToken,['Admin','Officer']);
  const s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BOOKINGS),c=getBookingCols_(s),index=pronteraOperationIndex_(),now=new Date();
  const from=new Date(now.getTime()-86400000),to=new Date(now.getTime()+7*86400000);
  return s.getDataRange().getValues().slice(1).filter(r=>normalizeBookingStatus_(getCell_(r,c.status))===BOOKING_STATUS.APPROVED).map(r=>buildBookingObjectFromRow_(r,c)).filter(b=>pronteraOverlaps_(from,to,new Date(b.start),new Date(b.end))).sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,100).map(b=>{
    const revision=pronteraOperationRevision_(b),last=index.get(b.bookingId+':'+revision);
    return {id:b.bookingId,revision:revision,topic:b.topic,room:b.roomName,start:Utilities.formatDate(new Date(b.start),'Asia/Bangkok','dd/MM/yyyy HH:mm'),headcount:b.headcount,setupDetails:b.setupDetails,layoutUrl:sanitizeDriveViewUrl_(b.layoutUrl),state:last&&PRONTERA_OPERATION_STATES.includes(last[2])?last[2]:'WAITING_SETUP'};
  });
}
/** Explicitly record task state; compare revision and prior state under booking lock. */
function setPronteraRoomOperation(bookingId,revision,expected,next,sessionToken){
  const user=requireUser_(sessionToken,['Admin','Officer']);
  if(!PRONTERA_OPERATION_STATES.includes(next)||!PRONTERA_OPERATION_STATES.includes(expected))throw new Error('สถานะงานจัดห้องไม่ถูกต้อง');
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw new Error('ระบบกำลังดำเนินการ');
  try{
    const s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BOOKINGS),c=getBookingCols_(s),found=findBookingRowById_(s,c,bookingId),b=buildBookingObjectFromRow_(found.row,c);
    if(b.status!==BOOKING_STATUS.APPROVED||pronteraOperationRevision_(b)!==revision)throw new Error('ข้อมูลการจองเปลี่ยนแปลง กรุณาโหลดใหม่');
    const old=pronteraOperationIndex_().get(b.bookingId+':'+revision),state=old?String(old[2]):'WAITING_SETUP';
    if(state!==expected)throw new Error('สถานะงานมีการเปลี่ยนแปลง กรุณาโหลดใหม่');
    if(next===state)return {state:state};
    pronteraOperationsSheet_(true).appendRow([b.bookingId,revision,next,new Date(),pronteraSheetText_(user.email||user.username)]);
    return {state:next};
  }finally{lock.releaseLock();}
}
/** Non-mutating integrity summary for staff, omits credentials and tokens. */
function getPronteraSystemHealth(sessionToken){
  requireUser_(sessionToken,['Admin','Officer']);
  const ss=SpreadsheetApp.getActiveSpreadsheet(),b=ss.getSheetByName(SHEET_BOOKINGS),f=ss.getSheetByName(SHEET_APPROVAL_FLOW),s=ss.getSheetByName(SHEET_APPROVAL_STEPS),bc=getBookingCols_(b),fc=getApprovalFlowCols_(f),sc=getApprovalStepCols_(s);
  const bookings=b.getDataRange().getValues().slice(1).filter(r=>normalizeText_(getCell_(r,bc.id))),flows=f.getDataRange().getValues().slice(1),steps=s.getDataRange().getValues().slice(1),ids=new Set(),duplicateIds=new Set(),activeCounts=new Map();
  bookings.forEach(r=>{const id=normalizeText_(getCell_(r,bc.id));if(ids.has(id))duplicateIds.add(id);ids.add(id);});
  flows.forEach(r=>{if(isApprovalFlowPendingStatus_(getCell_(r,fc.overallStatus))){const id=normalizeText_(getCell_(r,fc.bookingId));activeCounts.set(id,(activeCounts.get(id)||0)+1);}});
  const flowIds=new Set(flows.map(r=>normalizeText_(getCell_(r,fc.approvalId))));
  let expired=0;steps.forEach(r=>{if(normalizeText_(getCell_(r,sc.status))==='PENDING'){const d=new Date(getCell_(r,sc.tokenExpireAt));if(!Number.isFinite(d.getTime())||d<new Date())expired++;}});
  return {bookingCount:bookings.length,approvalError:bookings.filter(r=>normalizeBookingStatus_(getCell_(r,bc.status))===BOOKING_STATUS.APPROVAL_ERROR).length,duplicateBookingIds:duplicateIds.size,multiplePendingFlows:[...activeCounts.values()].filter(n=>n>1).length,orphanFlows:flows.filter(r=>normalizeText_(getCell_(r,fc.approvalId))&&!ids.has(normalizeText_(getCell_(r,fc.bookingId)))).length,orphanSteps:steps.filter(r=>normalizeText_(getCell_(r,sc.approvalId))&&!flowIds.has(normalizeText_(getCell_(r,sc.approvalId)))).length,expiredPendingTokens:expired,signatureEnabled:pronteraFlag_('PRONTERA_SIGNATURE_ENABLED'),testMode:pronteraFlag_('PRONTERA_TEST_MODE')};
}
