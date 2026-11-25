/** Saved signatures: only the verified Workspace principal can access their profile.
 * All profile and snapshot bytes stay in a dedicated private My Drive folder.
 * No client-supplied file ID or email is used to look up a reusable signature.
 */
const PRONTERA_SIGNATURE_HEADERS = ['Signature ID','User Email','Version','File ID','SHA256','Created At'];
const PRONTERA_SIGNATURE_SHEET = 'SignatureProfiles';
const PRONTERA_VAULT_KEY = 'PRONTERA_SIGNATURE_VAULT_ID';

function pronteraFlag_(name) {
  return PropertiesService.getScriptProperties().getProperty(name) === 'true';
}
function pronteraPrincipal_() {
  const email = normalizeText_(Session.getActiveUser().getEmail()).toLowerCase();
  const domain = normalizeText_(PropertiesService.getScriptProperties().getProperty('PRONTERA_WORKSPACE_DOMAIN') || 'g.klaeng.ac.th').toLowerCase();
  return isValidEmail_(email) && email.split('@')[1] === domain ? email : '';
}
function requirePronteraPrincipal_() {
  const email = pronteraPrincipal_();
  if (!email) throw new Error('IDENTITY_UNAVAILABLE: กรุณาเปิดระบบด้วยบัญชี Google Workspace ของโรงเรียน');
  return email;
}
function requirePronteraEditor_() {
  const active = normalizeText_(Session.getActiveUser().getEmail()).toLowerCase();
  const effective = normalizeText_(Session.getEffectiveUser().getEmail()).toLowerCase();
  if (!active || active !== effective) throw new Error('PERMISSION_DENIED: เฉพาะบัญชีผู้ติดตั้งระบบ');
}
/** Optional strict approval identity for both manual and saved signature paths. */
function pronteraApproverIdentity_(expected, required) {
  if (!required && !pronteraFlag_('PRONTERA_STRICT_APPROVAL_IDENTITY')) return '';
  const email = requirePronteraPrincipal_();
  if (!uniqueEmailList_([expected]).map(e => e.toLowerCase()).includes(email)) throw new Error('PERMISSION_DENIED: บัญชีนี้ไม่ใช่ผู้มีสิทธิ์ลงนามในขั้นตอนนี้');
  return email;
}
/** Reject any vault shared with other accounts; never fall back to a public folder. */
function pronteraAssertPrivate_(item) {
  const owner = item.getOwner();
  const effective = normalizeText_(Session.getEffectiveUser().getEmail()).toLowerCase();
  if (!owner || normalizeText_(owner.getEmail()).toLowerCase() !== effective || item.getSharingAccess() !== DriveApp.Access.PRIVATE || item.getEditors().length || item.getViewers().length) {
    throw new Error('SIGNATURE_VAULT_UNSAFE: ตรวจสอบสิทธิ์โฟลเดอร์ลายเซ็นกับผู้ดูแลระบบ');
  }
}
function pronteraVault_() {
  const id = PropertiesService.getScriptProperties().getProperty(PRONTERA_VAULT_KEY);
  if (!id) throw new Error('SIGNATURE_VAULT_NOT_CONFIGURED: ติดต่อผู้ดูแลระบบ');
  const folder = DriveApp.getFolderById(id);
  pronteraAssertPrivate_(folder);
  return folder;
}
/** Editor only: create isolated vault and schema; never enables the feature automatically. */
function setupPronteraSignatureVault() {
  requirePronteraEditor_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('ระบบกำลังทำงาน กรุณาลองใหม่');
  try {
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty(PRONTERA_VAULT_KEY)) {
      const folder = DriveApp.getRootFolder().createFolder('Prontera Private Signature Vault');
      pronteraAssertPrivate_(folder);
      props.setProperty(PRONTERA_VAULT_KEY, folder.getId());
    }
    pronteraVault_();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(PRONTERA_SIGNATURE_SHEET)) ss.insertSheet(PRONTERA_SIGNATURE_SHEET).appendRow(PRONTERA_SIGNATURE_HEADERS);
    pronteraProfileSheet_();
    return {ready:true, enabled:pronteraFlag_('PRONTERA_SIGNATURE_ENABLED')};
  } finally { lock.releaseLock(); }
}
function pronteraProfileSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRONTERA_SIGNATURE_SHEET);
  if (!sheet || sheet.getLastRow() < 1) throw new Error('SIGNATURE_SCHEMA_NOT_CONFIGURED');
  const headers = sheet.getRange(1,1,1,PRONTERA_SIGNATURE_HEADERS.length).getValues()[0];
  if (headers.some((h,i)=>h !== PRONTERA_SIGNATURE_HEADERS[i])) throw new Error('SIGNATURE_SCHEMA_INVALID');
  return sheet;
}
/** Append-only versions. Existing documents keep a separate immutable snapshot. */
function pronteraLatestProfile_(email) {
  const rows = pronteraProfileSheet_().getDataRange().getValues().slice(1);
  const matches = rows.filter(r=>normalizeText_(r[1]).toLowerCase() === email);
  if (!matches.length) return null;
  const ordered=matches.sort((a,b)=>Number(b[2])-Number(a[2]));
  if(ordered.length>1&&Number(ordered[0][2])===Number(ordered[1][2]))throw new Error("SIGNATURE_VERSION_DUPLICATE");
  const row = ordered[0];
  if (!row[0] || !Number.isInteger(Number(row[2])) || Number(row[2])<1 || !row[3] || !row[4]) throw new Error('SIGNATURE_PROFILE_INVALID');
  return {id:String(row[0]),email:email,version:Number(row[2]),fileId:String(row[3]),hash:String(row[4]),createdAt:new Date(row[5]).toISOString()};
}
function pronteraHexDigest_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(b=>((b+256)%256).toString(16).padStart(2,'0')).join('');
}
/** Accept only bounded PNG produced by the client canvas (including imported JPG). */
function pronteraPng_(data) {
  const text = String(data || '');
  if (text.length > 1400000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(text)) throw new Error('กรุณาใช้ภาพ PNG ขนาดไม่เกิน 1 MB');
  const bytes = Utilities.base64Decode(text.split(',')[1]);
  const b = bytes.map(x=>(x+256)%256);
  if (b.length < 33 || b.length > 1048576 || [137,80,78,71,13,10,26,10].some((v,i)=>b[i]!==v) || b.slice(12,16).join(',') !== '73,72,68,82') throw new Error('ไฟล์ PNG ไม่ถูกต้อง');
  const width = b[16]*16777216+b[17]*65536+b[18]*256+b[19], height=b[20]*16777216+b[21]*65536+b[22]*256+b[23];
  if (width<1||height<1||width>1600||height>800) throw new Error('ขนาดภาพลายเซ็นไม่ถูกต้อง');
  return bytes;
}
function pronteraPrivateFile_(bytes,name,mime) {
  const folder=pronteraVault_();
  const file=folder.createFile(Utilities.newBlob(bytes,mime||'image/png',name));
  try { pronteraAssertPrivate_(file); return file; }
  catch(e) { try{file.setTrashed(true);}catch(ignore){} throw e; }
}
function pronteraReadProfile_(profile) {
  const folder=pronteraVault_();
  const file=DriveApp.getFileById(profile.fileId);
  pronteraAssertPrivate_(file);
  const parents=file.getParents(); let belongs=false;
  while(parents.hasNext()) if(parents.next().getId()===folder.getId()) belongs=true;
  if(!belongs || file.getName()!=='profile-'+profile.id+'.png' || file.getSize()>1048576) throw new Error('SIGNATURE_FILE_INVALID');
  const bytes=file.getBlob().getBytes();
  if(pronteraHexDigest_(bytes)!==profile.hash) throw new Error('SIGNATURE_HASH_MISMATCH');
  return bytes;
}
/** Public RPC: return metadata for current account only. No file ID, bytes or URL. */
function getPronteraSignatureProfile() {
  const enabled=pronteraFlag_('PRONTERA_SIGNATURE_ENABLED'), email=pronteraPrincipal_();
  if(!enabled||!email) return {enabled:enabled,available:!!email,email:email,hasSignature:false};
  pronteraVault_();
  const profile=pronteraLatestProfile_(email);
  return {enabled:true,available:true,email:email,hasSignature:!!profile,version:profile?profile.version:0,signatureId:profile?profile.id:'',updatedAt:profile?profile.createdAt:''};
}
/** Public RPC: create/replace only current account's signature with optimistic version check. */
function savePronteraSignatureProfile(data, expectedId, confirmed) {
  if(!pronteraFlag_('PRONTERA_SIGNATURE_ENABLED')||confirmed!==true) throw new Error('กรุณายืนยันการบันทึกลายเซ็น');
  const email=requirePronteraPrincipal_(), bytes=pronteraPng_(data);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000)) throw new Error('ระบบกำลังทำงาน กรุณาลองใหม่');
  try {
    const old=pronteraLatestProfile_(email);
    if(String(expectedId||'')!==(old?old.id:'')) throw new Error('ลายเซ็นมีการเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่');
    const id=Utilities.getUuid(), version=old?old.version+1:1;
    const file=pronteraPrivateFile_(bytes,'profile-'+id+'.png');
    // Do not delete on ambiguous append failure: a committed row must retain its file.
    pronteraProfileSheet_().appendRow([id,email,version,file.getId(),pronteraHexDigest_(bytes),new Date()]);
    return {enabled:true,available:true,email:email,hasSignature:true,signatureId:id,version:version};
  } finally {lock.releaseLock();}
}
/** Resolve a consented profile under the caller's existing booking/approval lock. */
function pronteraResolveSignature_(form, expectedEmails) {
  if(form.useSavedSignature!==true) return null;
  if(!pronteraFlag_('PRONTERA_SIGNATURE_ENABLED')||form.signatureConfirmed!==true) throw new Error('กรุณายืนยันการลงนามด้วยลายเซ็นส่วนบุคคล');
  const email=pronteraApproverIdentity_(expectedEmails,true), p=pronteraLatestProfile_(email);
  if(!p||p.id!==String(form.signatureProfileId||'')) throw new Error('ลายเซ็นมีการเปลี่ยนแปลง กรุณาเปิดหน้ายืนยันใหม่');
  const bytes=pronteraReadProfile_(p);
  return {profile:p,bytes:bytes,data:'data:image/png;base64,'+Utilities.base64Encode(bytes)};
}
/** Snapshot has its own file ID and never references the mutable profile pointer. */
function pronteraSignatureSnapshot_(resolved, reference) {
  const name='snapshot-'+resolved.profile.id+'-'+Utilities.getUuid()+'.png';
  const file=pronteraPrivateFile_(resolved.bytes,name);
  return {fileId:file.getId(),url:file.getUrl(),name:name,profileId:resolved.profile.id,version:resolved.profile.version};
}
/** Verify a historical snapshot against its immutable profile version, not the current version. */
function pronteraSnapshotBlob_(fileId,versionRef) {
  const parts=String(versionRef||'').split(':');
  if(parts.length!==2||!parts[0]||!Number.isInteger(Number(parts[1])))throw new Error('SIGNATURE_VERSION_INVALID');
  const rows=pronteraProfileSheet_().getDataRange().getValues().slice(1).filter(r=>String(r[0])===parts[0]&&Number(r[2])===Number(parts[1]));
  if(rows.length!==1)throw new Error('SIGNATURE_VERSION_NOT_FOUND');
  const folder=pronteraVault_(),file=DriveApp.getFileById(fileId);
  pronteraAssertPrivate_(file);
  const parents=file.getParents();let belongs=false;
  while(parents.hasNext())if(parents.next().getId()===folder.getId())belongs=true;
  if(!belongs||!file.getName().startsWith('snapshot-'+parts[0]+'-')||file.getSize()>1048576)throw new Error('SIGNATURE_SNAPSHOT_INVALID');
  const blob=file.getBlob();
  if(pronteraHexDigest_(blob.getBytes())!==String(rows[0][4]))throw new Error('SIGNATURE_SNAPSHOT_HASH_MISMATCH');
  return blob;
}
