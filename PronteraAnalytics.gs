/** Aggregate approved reservation time intersecting a rolling 30-day window. No PII returned. */
function pronteraAnalyticsAggregate_(rows,bc,flows,fc,now){
  const end=now.getTime(),start=end-30*86400000,rooms=new Map(),approved=new Set(),latest=new Map();let count=0,millis=0;
  rows.forEach(r=>{
    if(normalizeBookingStatus_(getCell_(r,bc.status))!==BOOKING_STATUS.APPROVED)return;
    const id=normalizeText_(getCell_(r,bc.id)),room=normalizeText_(getCell_(r,bc.roomId)),a=pronteraDate_(getCell_(r,bc.start)).getTime(),b=pronteraDate_(getCell_(r,bc.end)).getTime();
    if(!id||!room||approved.has(id)||!Number.isFinite(a)||!Number.isFinite(b)||b<=a)return;
    approved.add(id);const overlap=Math.min(end,b)-Math.max(start,a);if(overlap<=0)return;
    count++;millis+=overlap;const v=rooms.get(room)||{name:normalizeText_(getCell_(r,bc.roomName))||room,count:0,millis:0};v.count++;v.millis+=overlap;rooms.set(room,v);
  });
  flows.forEach(r=>{const id=normalizeText_(getCell_(r,fc.bookingId)),created=pronteraDate_(getCell_(r,fc.createdAt)).getTime(),completed=pronteraDate_(getCell_(r,fc.completedAt)).getTime();if(!approved.has(id)||normalizeText_(getCell_(r,fc.overallStatus))!=='COMPLETED'||!Number.isFinite(created)||!Number.isFinite(completed)||completed<created||completed<start||completed>end)return;const old=latest.get(id);if(!old||created>old.created)latest.set(id,{created:created,elapsed:completed-created});});
  const round=x=>Math.round(x/36000)/100,delays=[...latest.values()];return {count:count,hours:round(millis),approvalCount:delays.length,approvalHours:delays.length?round(delays.reduce((a,v)=>a+v.elapsed,0)/delays.length):null,rooms:[...rooms.values()].map(r=>({name:r.name,count:r.count,hours:round(r.millis)})).sort((a,b)=>b.hours-a.hours)};
}
/** Staff-only analytics; the range is fixed to bound query complexity and disclosure. */
function getPronteraAnalytics(sessionToken){
  requireUser_(sessionToken,['Admin','Officer']);const ss=SpreadsheetApp.getActiveSpreadsheet(),b=ss.getSheetByName(SHEET_BOOKINGS),f=ss.getSheetByName(SHEET_APPROVAL_FLOW);return pronteraAnalyticsAggregate_(b.getDataRange().getValues().slice(1),getBookingCols_(b),f.getDataRange().getValues().slice(1),getApprovalFlowCols_(f),new Date());
}
