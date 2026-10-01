/* =====================================================================
   Phase 2 wiring — builds SECS in screen order and drives the whole form
   from the per-section registrations. Loaded last of the form parts.
   Central compute order (CLAUDE.md / ITR-2 reference) for a trust return:
   receipts (VC → AI) and the income heads (HP/CG/OS/OA/BP → CYLA) → the
   application & accumulation of income (A / I / IA / D / DA) → the balance
   sheet & funds → the special-body schedules → special-rate/accreted income
   (SI / 115BBI / 115TD) → foreign → Part B → interest. Sections carry an
   `order`; the `tax` section does the Part B roll-up into the footer contract
   S.C.{gti,ti,tax,int}. Modelled on forms/ITR-6/src/90_wiring.js.
   ===================================================================== */
const SECS = SCREEN_ORDER.map(id=>_SECREG.filter(r=>r.id===id).pop()).filter(Boolean)
  .map(r=>({id:r.id,t:r.t,ref:r.ref,f:r.f,s:r.s||(()=>"")}));

/* compute() — a 2-pass fixpoint over the section engines. Some feeds run
   "forward" against screen order (application caps read total income, 115TD
   accreted income reads the balance sheet, Part B reads every head); running
   every engine twice lets a value produced late in pass 1 reach an
   earlier-ordered engine in pass 2, so the whole computation converges.
   Engines assign (never accumulate) into S / S.C, so a second pass is
   idempotent once the fixpoint is reached. S.C is reset once, before the
   passes; the last pass is the one that records engine errors. */
function compute(){
  S.C={};                                   /* rebuilt every compute() call */
  const engs=_SECREG.filter(r=>r.eng).sort((a,b)=>((a.corder||a.order||50)-(b.corder||b.order||50))); /* corder = compute order (defaults to screen order); lets e.g. SI compute after CYLA/BFLA */
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

/* buildReturn() — the schema envelope is {ITR:{ITR7:{...}}}; the ITR7 object
   is built from the required-key skeleton and each section's export writer
   fills its block(s). Root schema block: ITR7. */
function buildReturn(){
  compute();
  const j=deep(SKEL);
  for(const r of _SECREG){ if(r.exp){ try{ r.exp(j); }catch(e){ (S.C._errs=S.C._errs||[]).push("exp "+r.id+": "+e.message);} } }
  return {ITR:{ITR7:j}};
}

/* importReturn(I) — the inverse: unwrap the ITR7 object (from either {ITR7:..}
   or the bare block) and let each section's import reader pull its keys back
   into S. Returns the flat list of what was read. */
function importReturn(I){
  const read=[];
  const I7=(I&&I.ITR7)?I.ITR7:I;
  for(const r of _SECREG){ if(r.imp){ try{ const got=r.imp(I7); if(Array.isArray(got)) read.push.apply(read,got);}catch(e){} } }
  compute();
  return read;
}

/* runRules / auditRules are defined in 60_rules.js (loaded before this file);
   these guards only fire if that file were ever absent, keeping the shell
   contract satisfied. */
if(typeof runRules!=="function"){ function runRules(I,S_){ return []; } }
if(typeof auditRules!=="function"){ function auditRules(b){ return []; } }
