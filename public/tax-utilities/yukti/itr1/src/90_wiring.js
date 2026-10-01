/* =====================================================================
   Wiring — builds SECS in screen order and drives the whole form from the
   per-section registrations. Loaded last of the form parts.
   Central compute order for an ITR-1 individual: the income heads
   (salary -> house property -> other sources) feed the gross total income;
   Chapter-VI-A deductions and exempt income adjust it; the `tax` section
   does the Part B roll-up into the footer contract S.C.{gti,ti,tax,int};
   taxes paid and the bank/verification block close the return. Sections
   carry an `order` (screen order) and a `corder` (compute order).
   Modelled on forms/ITR-7/src/90_wiring.js.
   ===================================================================== */
const SECS = SCREEN_ORDER.map(id=>_SECREG.filter(r=>r.id===id).pop()).filter(Boolean)
  .map(r=>({id:r.id,t:r.t,ref:r.ref,f:r.f,s:r.s||(()=>"")}));

/* compute() — a 2-pass fixpoint over the section engines in compute order.
   Some feeds run against screen order (interest reads the balance of tax,
   Part B reads every head, 87A reads the total income): running every engine
   twice lets a value produced late in pass 1 reach an earlier-ordered engine
   in pass 2, so the whole computation converges. Engines assign (never
   accumulate) into S / S.C, so a second pass is idempotent once the fixpoint
   is reached. S.C is reset once, before the passes; the last pass is the one
   that records engine errors. */
function compute(){
  S.C={};                                   /* rebuilt every compute() call */
  const engs=_SECREG.filter(r=>r.eng).sort((a,b)=>((a.corder||a.order||50)-(b.corder||b.order||50))); /* corder = compute order (defaults to screen order); lets e.g. tax compute after every head */
  for(let pass=0;pass<2;pass++){
    const last=pass===1;
    for(const r of engs){ try{ r.eng(); }catch(e){ if(last)(S.C._errs=S.C._errs||[]).push(r.id+": "+e.message); } }
  }
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

/* buildReturn() — the schema envelope is {ITR:{ITR1:{...}}}; the ITR1 object
   is built from the required-key skeleton and each section's export writer
   fills its block(s). Root schema block: ITR1. */
function buildReturn(){
  compute();
  const j=deep(SKEL);
  for(const r of _SECREG){ if(r.exp){ try{ r.exp(j); }catch(e){ (S.C._errs=S.C._errs||[]).push("exp "+r.id+": "+e.message);} } }
  return {ITR:{ITR1:j}};
}

/* importReturn(I) — the inverse: unwrap the ITR1 object (from either {ITR1:..}
   or the bare block) and let each section's import reader pull its keys back
   into S. Returns the flat list of what was read. */
function importReturn(I){
  const read=[];
  const I1=(I&&I.ITR1)?I.ITR1:I;
  for(const r of _SECREG){ if(r.imp){ try{ const got=r.imp(I1); if(Array.isArray(got)) read.push.apply(read,got);}catch(e){} } }
  compute();
  return read;
}

/* runRules / auditRules are defined in 60_rules.js (loaded before this file);
   these guards only fire if that file were ever absent, keeping the shell
   contract satisfied. */
if(typeof runRules!=="function"){ function runRules(I,S_){ return []; } }
if(typeof auditRules!=="function"){ function auditRules(b){ return []; } }
