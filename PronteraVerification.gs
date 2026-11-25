/** QR encoding is entirely local: no document data or verification token sent to a QR service. */
function pronteraQrPng_(text){
  if(typeof text!=='string'||text.length>500||/[^\x20-\x7e]/.test(text))throw new Error('QR payload invalid');
  const q=new PronteraQrLibrary.QRCode(-1,PronteraQrLibrary.levels.M);q.addData(text);q.make();const n=q.getModuleCount(),scale=4,size=(n+8)*scale,raw=[];
  for(let y=0;y<size;y++){raw.push(0);for(let x=0;x<size;x++){const r=Math.floor(y/scale)-4,c=Math.floor(x/scale)-4;raw.push(r>=0&&c>=0&&r<n&&c<n&&q.isDark(r,c)?0:255);}}
  const u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
  const crc=bytes=>{let c=0xffffffff;for(const v of bytes){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
  const chunk=(name,data)=>{const type=name.split('').map(c=>c.charCodeAt(0)),body=type.concat(data);return u32(data.length).concat(body,u32(crc(body)));};
  const z=[0x78,0x01];let a=1,b=0;for(let i=0;i<raw.length;i+=65535){const len=Math.min(65535,raw.length-i),last=i+len===raw.length;z.push(last?1:0,len&255,len>>>8,(~len)&255,((~len)>>>8)&255);for(let k=i;k<i+len;k++){const v=raw[k];z.push(v);a=(a+v)%65521;b=(b+a)%65521;}}z.push(...u32((b<<16)|a));
  return [137,80,78,71,13,10,26,10].concat(chunk('IHDR',u32(size).concat(u32(size),[8,0,0,0,0])),chunk('IDAT',z),chunk('IEND',[]));
}
const PRONTERA_VERIFY_HEADERS=['Token Hash','Approval ID','Booking ID','Final File ID','Created At'];
function pronteraVerificationSheet_(create){const ss=SpreadsheetApp.getActiveSpreadsheet();let s=ss.getSheetByName('PronteraVerification');if(!s&&create){s=ss.insertSheet('PronteraVerification');s.appendRow(PRONTERA_VERIFY_HEADERS);}if(s&&s.getRange(1,1,1,PRONTERA_VERIFY_HEADERS.length).getValues()[0].some((v,i)=>v!==PRONTERA_VERIFY_HEADERS[i]))throw new Error('VERIFY_SCHEMA_INVALID');return s;}
/** Optional QR placeholder in a copy of the final template; fit into the configured square. */
function pronteraAddVerificationQr_(presentation){
  if(!pronteraFlag_('PRONTERA_QR_ENABLED')){clearTextPlaceholder_(presentation,'{{PRONTERA_QR}}','');return null;}
  const matches=[];presentation.getSlides().forEach(slide=>slide.getPageElements().forEach(el=>{if(el.getPageElementType()===SlidesApp.PageElementType.SHAPE&&el.asShape().getText().asString().includes('{{PRONTERA_QR}}'))matches.push({slide:slide,shape:el.asShape()});}));
  if(matches.length!==1)throw new Error('Template ต้องมี {{PRONTERA_QR}} หนึ่งตำแหน่ง');const item=matches[0],shape=item.shape,size=Math.min(shape.getWidth(),shape.getHeight());if(size<90)throw new Error('พื้นที่ QR ต้องมีขนาดอย่างน้อย 90 × 90 pt');
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,''),url=getWebAppUrl_()+'?page=verify&v='+encodeURIComponent(token),bytes=pronteraQrPng_(url).map(x=>x>127?x-256:x);
  const blob=Utilities.newBlob(bytes,'image/png','verification.png');shape.getText().setText('');item.slide.insertImage(blob,shape.getLeft()+(shape.getWidth()-size)/2,shape.getTop()+(shape.getHeight()-size)/2,size,size);return {hash:hashPassword(token)};
}
/** A QR is valid only when its exact final file is the current completed workflow. */
function getPronteraVerification(token){requirePronteraPrincipal_();const t=normalizeText_(token);if(!/^[a-f0-9]{64}$/i.test(t))return {valid:false,message:'ไม่พบหลักฐานที่ตรวจสอบได้'};const sheet=pronteraVerificationSheet_(false);if(!sheet)return {valid:false,message:'ไม่พบหลักฐานที่ตรวจสอบได้'};const h=hashPassword(t),matches=sheet.getDataRange().getValues().slice(1).filter(r=>String(r[0])===h);if(matches.length!==1)return {valid:false,message:'ไม่พบหลักฐานที่ตรวจสอบได้'};const r=matches[0],flow=findApprovalFlowById_(r[1]),c=flow.cols,booking=getBookingRecordObject_(r[2]);if(normalizeText_(getCell_(flow.row,c.bookingId))!==r[2]||normalizeText_(getCell_(flow.row,c.overallStatus))!=='COMPLETED'||normalizeText_(getCell_(flow.row,c.finalSignedPdfFileId))!==String(r[3])||booking.status!==BOOKING_STATUS.APPROVED)return {valid:false,message:'เอกสารนี้ไม่ได้เป็นฉบับอนุมัติที่มีผลอยู่ในปัจจุบัน'};validateApprovalCompletionSequence_(r[1]);return {valid:true,bookingId:booking.bookingId,room:booking.roomName,completedAt:Utilities.formatDate(new Date(getCell_(flow.row,c.completedAt)),'Asia/Bangkok','dd/MM/yyyy HH:mm'),message:'พบเอกสารฉบับอนุมัติในระบบ'};}
