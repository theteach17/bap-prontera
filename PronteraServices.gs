/** Foundation helpers, with explicit Bangkok interpretation for timezone-less form values. */
function pronteraDate_(value) {
  if(value===null||value===undefined||value==='')return new Date(NaN);
  if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    const d=new Date(value+'+07:00');
    if(!Number.isFinite(d.getTime())||new Date(d.getTime()+25200000).toISOString().slice(0,value.length)!==value) return new Date(NaN);
    return d;
  }
  return new Date(value);
}
function pronteraRange_(start,end) {
  const a=pronteraDate_(start),b=pronteraDate_(end);
  if(!start||!end||!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||b<=a) throw new Error('กรุณาระบุวันเวลาเริ่มต้นและสิ้นสุดให้ถูกต้อง');
  return {start:a,end:b};
}
function pronteraOverlaps_(a,b,c,d){return a.getTime()<d.getTime()&&b.getTime()>c.getTime();}
/** Add optional metadata without shifting legacy headers. Caller holds ScriptLock. */
function pronteraColumn_(sheet,label) {
  const last=sheet.getLastColumn(), headers=sheet.getRange(1,1,1,last).getValues()[0];
  const matches=headers.reduce((a,v,i)=>normalizeText_(v).toLowerCase()===label.toLowerCase()?a.concat(i+1):a,[]);
  if(matches.length>1)throw new Error('หัวตารางซ้ำ: '+label);
  if(matches.length){if(matches[0]<=BOOKING_REQUIRED_HEADERS.length)throw new Error("คอลัมน์ metadata อยู่ในพื้นที่ข้อมูลเดิม");return matches[0];}
  if(last>=sheet.getMaxColumns())sheet.insertColumnsAfter(sheet.getMaxColumns(),1);
  sheet.getRange(1,last+1).setValue(label);return last+1;
}
function pronteraReceipt_(form) {
  const id=normalizeText_(form.submissionId).toLowerCase();
  if(!id)return null;
  if(!/^[0-9a-f]{32}$/.test(id))throw new Error('รหัสส่งคำขอไม่ถูกต้อง');
  const values=['topic','requester','requesterEmail','headcount','roomId','startTime','endTime','setupDetails','setupFileName','setupFileBase64','useSavedSignature','signatureProfileId'].map(k=>String(form[k]==null?'':form[k]));
  return {id:id,value:id+':'+hashPassword(JSON.stringify(values))};
}
/** Read-only availability; save always rechecks under lock. */
function getPronteraAvailableRooms(start,end,headcount) {
  const range=pronteraRange_(start,end), count=Number(headcount);
  if(!Number.isInteger(count)||count<1)throw new Error('กรุณาระบุจำนวนผู้เข้าประชุม');
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BOOKINGS), cols=getBookingCols_(sheet), busy=pronteraMaintenanceBusy_(range.start,range.end);
  sheet.getDataRange().getValues().slice(1).forEach(row=>{
    if(!normalizeText_(getCell_(row,cols.id))||!isBookingBlockingRoom_(getCell_(row,cols.status)))return;
    const a=new Date(getCell_(row,cols.start)),b=new Date(getCell_(row,cols.end));
    if(Number.isFinite(a.getTime())&&Number.isFinite(b.getTime())&&pronteraOverlaps_(range.start,range.end,a,b))busy.add(normalizeText_(getCell_(row,cols.roomId)));
  });
  return getActiveRooms_().filter(r=>(r.capacity<=0||r.capacity>=count)&&!busy.has(r.roomId)).map(r=>({roomId:r.roomId,roomName:r.roomName,capacity:r.capacity,requireSetup:r.requireSetup}));
}
/** Workspace login for already provisioned staff; never grants roles from client data. */
function loginPronteraWorkspace() {
  const email=requirePronteraPrincipal_();
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ADMIN);
  const rows=sheet.getDataRange().getValues().slice(1).filter(r=>normalizeText_(r[4]).toLowerCase()===email&&['Admin','Officer'].includes(normalizeText_(r[3])));
  if(rows.length!==1)throw new Error('บัญชีนี้ยังไม่ได้รับสิทธิ์เจ้าหน้าที่ หรือมีข้อมูลซ้ำ');
  const r=rows[0],user={username:normalizeText_(r[0]),name:normalizeText_(r[2]),role:normalizeText_(r[3]),email:email,authProvider:'workspace'};
  return Object.assign({},user,{token:createSession_(user)});
}
/** Personal request history by verified email, not by a client-supplied identity. */
function getPronteraMyBookings() {
  const email=requirePronteraPrincipal_(),ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName(SHEET_BOOKINGS),c=getBookingCols_(sheet);
  const fs=ss.getSheetByName(SHEET_APPROVAL_FLOW), fc=getApprovalFlowCols_(fs), latest=new Map();
  fs.getDataRange().getValues().slice(1).forEach(r=>{
    if(normalizeText_(getCell_(r,fc.overallStatus))==='SUPERSEDED')return;
    const id=normalizeText_(getCell_(r,fc.bookingId)), old=latest.get(id);
    if(!old||new Date(getCell_(r,fc.createdAt))>=new Date(getCell_(old,fc.createdAt)))latest.set(id,r);
  });
  const stepSheet=ss.getSheetByName(SHEET_APPROVAL_STEPS),stepCols=getApprovalStepCols_(stepSheet),timelines=new Map();
  stepSheet.getDataRange().getValues().slice(1).forEach(r=>{const id=normalizeText_(getCell_(r,stepCols.approvalId)),n=Number(getCell_(r,stepCols.stepNo));if(!id||n<1||n>3||!Number.isInteger(n))return;const timeline=timelines.get(id)||['','',''];timeline[n-1]=normalizeText_(getCell_(r,stepCols.status));timelines.set(id,timeline);});
  return sheet.getDataRange().getValues().slice(1).filter(r=>normalizeText_(getCell_(r,c.requesterEmail)).toLowerCase()===email).sort((a,b)=>new Date(getCell_(b,c.start))-new Date(getCell_(a,c.start))).slice(0,100).map(r=>{
    const id=normalizeText_(getCell_(r,c.id)),f=latest.get(id), d=new Date(getCell_(r,c.start));
    return {id:id,topic:normalizeText_(getCell_(r,c.topic)),room:normalizeText_(getCell_(r,c.roomName)),start:Number.isFinite(d.getTime())?Utilities.formatDate(d,'Asia/Bangkok','dd/MM/yyyy HH:mm'):'-',status:getBookingStatusLabel_(getCell_(r,c.status)),step:f?Number(getCell_(f,fc.currentStep))||0:0,timeline:f?(timelines.get(normalizeText_(getCell_(f,fc.approvalId)))||[]):[]};
  });
}
/** Assigned pending approvals only; expired or cancelled tokens are not returned. */
function getPronteraApprovalInbox() {
  const email=requirePronteraPrincipal_(),ss=SpreadsheetApp.getActiveSpreadsheet(),s=ss.getSheetByName(SHEET_APPROVAL_STEPS),c=getApprovalStepCols_(s),f=ss.getSheetByName(SHEET_APPROVAL_FLOW),fc=getApprovalFlowCols_(f),b=ss.getSheetByName(SHEET_BOOKINGS),bc=getBookingCols_(b);
  const flows=new Map(f.getDataRange().getValues().slice(1).map(r=>[normalizeText_(getCell_(r,fc.approvalId)),r]));
  const bookings=new Map(b.getDataRange().getValues().slice(1).map(r=>[normalizeText_(getCell_(r,bc.id)),r]));
  return s.getDataRange().getValues().slice(1).flatMap(r=>{
    if(getCell_(r,c.status)!=='PENDING'||!uniqueEmailList_([getCell_(r,c.approverEmail)]).map(x=>x.toLowerCase()).includes(email))return [];
    const flow=flows.get(normalizeText_(getCell_(r,c.approvalId))), id=normalizeText_(getCell_(r,c.bookingId)),book=bookings.get(id), step=Number(getCell_(r,c.stepNo)), exp=new Date(getCell_(r,c.tokenExpireAt));
    if(!flow||!book||normalizeText_(getCell_(flow,fc.bookingId))!==id||!isApprovalFlowPendingStatus_(getCell_(flow,fc.overallStatus))||Number(getCell_(flow,fc.currentStep))!==step||!isBookingBlockingRoom_(getCell_(book,bc.status)))return [];
    const date=new Date(getCell_(book,bc.start)),token=normalizeText_(getCell_(r,c.token));
    return [{id:id,topic:normalizeText_(getCell_(book,bc.topic)),room:normalizeText_(getCell_(book,bc.roomName)),start:Number.isFinite(date.getTime())?Utilities.formatDate(date,'Asia/Bangkok','dd/MM/yyyy HH:mm'):'-',sort:Number.isFinite(date.getTime())?date.getTime():0,step:step,url:token&&exp>new Date()?buildApprovalUrl_(token):''}];
  }).sort((a,b)=>a.sort-b.sort).slice(0,100);
}

/** Escape spreadsheet formula prefixes in human-entered text. */
function pronteraSheetText_(value){const s=String(value??" ");return /^[=+@-]/.test(s)?"'"+s:s;}
/** Test mode requires isolated Drive resources; production defaults are preserved. */
function pronteraConfig_(key,productionDefault){
  const value=normalizeText_(PropertiesService.getScriptProperties().getProperty(key));
  if(pronteraFlag_('PRONTERA_TEST_MODE')&&(!value||value===productionDefault))throw new Error('TEST_MODE: กรุณาตั้งค่า '+key+' ให้เป็นทรัพยากรทดสอบ');
  return value||productionDefault;
}
/** Central mail boundary: suppress all outgoing mail in a copied test system. */
function pronteraSendMail_(options){
  if(pronteraFlag_('PRONTERA_TEST_MODE')){console.log('TEST_MODE: mail suppressed');return;}
  return MailApp.sendEmail(options);
}
/** Optional domain-only sharing of newly generated documents, not the vault. */
function pronteraShareDocument_(file){
  if(pronteraFlag_('PRONTERA_TEST_MODE'))return;
  file.setSharing(pronteraFlag_('PRONTERA_DOMAIN_DOCUMENTS')?DriveApp.Access.DOMAIN_WITH_LINK:DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
}
/** Read-only deployment diagnostic for the signed-in Workspace account. */
function getPronteraReadiness(){
  const email=pronteraPrincipal_();
  return {identityAvailable:!!email,email:email,signatureEnabled:pronteraFlag_('PRONTERA_SIGNATURE_ENABLED'),strictApproval:pronteraFlag_('PRONTERA_STRICT_APPROVAL_IDENTITY'),testMode:pronteraFlag_('PRONTERA_TEST_MODE')};
}

/** Optional guard for public legacy trigger handler names. Validate trigger UID against the owner's installed trigger. */
function pronteraGuardTrigger_(event,handler){
  if(!pronteraFlag_('PRONTERA_GUARD_LEGACY_TRIGGERS'))return;
  if(event && event.triggerUid && ScriptApp.getProjectTriggers().some(t=>String(t.getUniqueId())===String(event.triggerUid)&&t.getHandlerFunction()===handler))return;
  requirePronteraEditor_();
}

/** Audit failure must not mask a committed booking or prevent its workflow. */
function pronteraBestEffortLog_(actor,action,details){
  try { logAction_(actor,action,details); } catch(e) { console.error('Prontera log failure: '+action+' | '+e.message); }
}
/** Notification is a post-commit side effect; return explicit warning on unexpected failures. */
function pronteraBookingNotifications_(data,pdf,layout){
  try { return sendEmailNotifications_(data,pdf,layout); }
  catch(e) { pronteraBestEffortLog_('System','Booking notification error',data.bookingId+' | '+e.message);return {adminSent:false,requesterSent:false,officerSent:false,errors:[String(e.message)]}; }
}

/** Read-only production preflight. Runs in Editor only; never invokes migrations or sends email. */
function pronteraProductionPreflight(){
  requirePronteraEditor_();
  const checks=[];
  const check=(name,fn)=>{try{const detail=fn();checks.push({name:name,ok:true,detail:String(detail||'OK')});}catch(e){checks.push({name:name,ok:false,detail:String(e.message||e)});}};
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  check('Bound spreadsheet',()=>{if(!ss)throw new Error('No active spreadsheet');return ss.getName();});
  check('Timezone',()=>{if(Session.getScriptTimeZone()!=='Asia/Bangkok'||ss.getSpreadsheetTimeZone()!=='Asia/Bangkok')throw new Error('Script and spreadsheet must both use Asia/Bangkok');});
  [SHEET_ROOMS,SHEET_BOOKINGS,SHEET_OFFICERS,SHEET_ADMIN,SHEET_APPROVERS,SHEET_APPROVAL_FLOW,SHEET_APPROVAL_STEPS].forEach(name=>check('Sheet '+name,()=>{const s=ss.getSheetByName(name);if(!s||s.getLastRow()<1)throw new Error('Missing header or sheet');return s.getLastColumn()+' columns';}));
  check('Bookings schema',()=>{const s=ss.getSheetByName(SHEET_BOOKINGS),c=getBookingCols_(s);if(s.getLastColumn()<BOOKING_REQUIRED_HEADERS.length||new Set(Object.values(c)).size!==Object.keys(c).length)throw new Error('Incomplete or conflicting booking columns');const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(x=>normalizeText_(x).toLowerCase()).filter(Boolean);if(new Set(h).size!==h.length)throw new Error('Duplicate headers');});
  check('Initial/final PDF template',()=>{const p=SlidesApp.openById(pronteraConfig_('PRONTERA_TEMPLATE_SLIDE_ID',TEMPLATE_SLIDE_ID));const shapes=p.getSlides().flatMap(slide=>slide.getPageElements().filter(e=>e.getPageElementType()===SlidesApp.PageElementType.SHAPE).map(e=>e.asShape().getText().asString()));const required=['{{GUESTSIGNATURE}}','{{ROOMOFFICER_SIGNATURE}}','{{BUILDING_SIGNATURE}}','{{DEPUTY_SIGNATURE}}'];const missing=required.filter(k=>!shapes.some(t=>t.includes(k)));if(missing.length)throw new Error('Missing placeholders: '+missing.join(', '));return '4 signature placeholders found';});
  if(pronteraFlag_('PRONTERA_QR_ENABLED'))check('QR template placeholder',()=>{const p=SlidesApp.openById(pronteraConfig_('PRONTERA_TEMPLATE_SLIDE_ID',TEMPLATE_SLIDE_ID));const m=p.getSlides().flatMap(slide=>slide.getPageElements().filter(e=>e.getPageElementType()===SlidesApp.PageElementType.SHAPE).map(e=>e.asShape())).filter(s=>s.getText().asString().includes('{{PRONTERA_QR}}'));if(m.length!==1||Math.min(m[0].getWidth(),m[0].getHeight())<90)throw new Error('QR requires one placeholder at least 90x90 pt');});
  check('Initial PDF folder access',()=>DriveApp.getFolderById(pronteraConfig_('PRONTERA_PDF_FOLDER_ID',PDF_FOLDER_ID)).getName());
  check('Final PDF folder access',()=>DriveApp.getFolderById(pronteraConfig_('PRONTERA_FINAL_SIGNED_MEMO_FOLDER_ID',FINAL_SIGNED_MEMO_FOLDER_ID)).getName());
  check('Test mode OFF for production',()=>{if(pronteraFlag_('PRONTERA_TEST_MODE'))throw new Error('TEST_MODE is enabled');});
  check('Signature vault when enabled',()=>{if(!pronteraFlag_('PRONTERA_SIGNATURE_ENABLED'))return 'Feature disabled';pronteraVault_();pronteraProfileSheet_();return 'Private vault and signature headers verified';});
  if(pronteraFlag_('PRONTERA_FINAL_WORKER_ENABLED'))check('Final worker readiness',()=>{if(!pronteraJobSheet_(false))throw new Error('Missing PronteraJobs');const heartbeat=Number(PropertiesService.getScriptProperties().getProperty('PRONTERA_FINAL_WORKER_HEARTBEAT'));if(!heartbeat||Date.now()-heartbeat>180000||heartbeat>Date.now()+60000)throw new Error('Worker heartbeat stale');if(ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='runPronteraFinalWorker_').length!==1)throw new Error('Expected exactly one worker trigger');});
  if(pronteraFlag_('PRONTERA_MAINTENANCE_ENABLED'))check('Maintenance schema',()=>{pronteraMaintenanceRows_();return 'OK or not initialized yet';});
  const result={ready:checks.every(x=>x.ok),checks:checks,limitation:'Read-only checks only; actual web-app identity, document rendering, mail, concurrency and trigger runtime still require verification.'};
  console.log(JSON.stringify(result));return result;
}
