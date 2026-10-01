/* =====================================================================
   Phase 4 wiring — builds SECS in screen order and drives the whole
   form from the per-section registrations. Loaded last of the form parts.
   Central compute order (CLAUDE.md / ITR-2 reference): income heads →
   losses → deductions → special rates → tax → interest. Sections carry an
   `order`; the `tax` section (order 90) does the Part D roll-up into the
   footer contract S.C.{gti,ti,tax,int}.
   ===================================================================== */
const SECS = SCREEN_ORDER.map(id=>_SECREG.filter(r=>r.id===id).pop()).filter(Boolean)
  .map(r=>({id:r.id,t:r.t,ref:r.ref,f:r.f,s:r.s||(()=>"")}));

/* the schema's top-level ITR key for this form, derived from FORM.id
   ("ITR-4" -> "ITR4"), so buildReturn/importReturn stay form-agnostic. */
const _ITRKEY=(window.FORM&&window.FORM.id?window.FORM.id:"").replace(/-/g,"");

function compute(){
  S.C={};                                   /* rebuilt every pass */
  const engs=_SECREG.filter(r=>r.eng).sort((a,b)=>(a.order||50)-(b.order||50));
  for(const r of engs){ try{ r.eng(); }catch(e){ (S.C._errs=S.C._errs||[]).push(r.id+": "+e.message); } }
  /* footer contract — a section (usually tax) sets these; default to 0 so the shell paints */
  S.C.gti = S.C.gti||0;
  S.C.ti  = S.C.ti ||0;
  S.C.tax = S.C.tax|| {gross:0, regime:(typeof isNew==="function"&&isNew())?"New":"Old", rebate:0};
  S.C.int = S.C.int|| {refund:0, balance:0, net:0};
  S.C.checks = engChecks();
}

function engChecks(){
  let out=[];
  for(const r of _SECREG){ if(r.chk){ try{ const c=r.chk(); if(Array.isArray(c)) out=out.concat(c);}catch(e){} } }
  return out;
}

function buildReturn(){
  compute();
  const j=deep(SKEL);
  for(const r of _SECREG){ if(r.exp){ try{ r.exp(j); }catch(e){ (S.C._errs=S.C._errs||[]).push("exp "+r.id+": "+e.message);} } }
  const w={}; w[_ITRKEY]=j; return {ITR:w};
}

function importReturn(I){
  const read=[];
  const I4=(I&&I[_ITRKEY])?I[_ITRKEY]:I;
  for(const r of _SECREG){ if(r.imp){ try{ const got=r.imp(I4); if(Array.isArray(got)) read.push.apply(read,got);}catch(e){} } }
  compute();
  return read;
}

/* Phase 6 fills these; keep the shell contract satisfied until then. */
if(typeof runRules!=="function"){ function runRules(I,S_){ return []; } }
if(typeof auditRules!=="function"){ function auditRules(b){ return []; } }
