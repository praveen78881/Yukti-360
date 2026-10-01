/* =====================================================================
   Phase 2/4 wiring — seeds the placeholder sections so the whole form
   boots with its full structure, builds SECS in screen order, and drives
   compute / buildReturn / importReturn from the per-section registrations.
   Loaded last of the form parts.
   Central compute order (CLAUDE.md / reference): income heads → losses →
   deductions → special rates → tax → interest. Sections carry an `order`
   (screen) and optional `corder` (compute); the `tax` section rolls the
   Part B figures into the footer contract S.C.{gti,ti,tax,int}.
   ===================================================================== */

/* Phase 2 bootstrap: a placeholder registration for every section in
   FORM.SECTIONS so the form always boots with its 18-section structure.
   Real section-builders call reg() later with the same id; SECS below
   resolves each id to the LAST registration, so a real section overrides
   its placeholder. (Only seed an id no real section has already registered,
   so this stays forward-compatible once section files are added.) */
SECTIONS.forEach(({id,t,ref})=>{
  if(_SECREG.some(r=>r.id===id)) return;
  reg({id,t,ref,f:()=>note("<b>"+esc(t)+"</b> — being built (Phase 4)."),s:()=>""});
});

/* SECS — the screen-order view the shell paints. Last registration per id wins. */
const SECS = SCREEN_ORDER.map(id=>_SECREG.filter(r=>r.id===id).pop()).filter(Boolean)
  .map(r=>({id:r.id,t:r.t,ref:r.ref,f:r.f,s:r.s||(()=>"")}));

function compute(){
  /* Two-pass (fixpoint) compute. The section engines form a DAG when sorted by
     corder, except for a few forward dependencies where a producer sits AFTER a
     consumer: `other` (28) publishes S.C.other.pti consumed by hp (6) / cg (26) /
     os (27); `bp` (25) publishes S.C.icds consumed by oi (6). A single pass would
     feed those consumers a stale (empty) value. Every engine assigns a FRESH
     object to its own S.C namespace and never accumulates into S.C (no += / push),
     so re-running the whole set is idempotent: pass 1 populates every producer,
     pass 2 lets each consumer read the resolved value, and a further pass would be
     identical. We loop to a fixpoint (max 3 passes) and stop as soon as S.C is
     stable, which both proves and guarantees idempotence for this DAG. */
  S.C={};
  const engs=_SECREG.filter(r=>r.eng).sort((a,b)=>((a.corder||a.order||50)-(b.corder||b.order||50))); /* corder = compute order (defaults to screen order) */
  const runPass=()=>{ delete S.C._errs; for(const r of engs){ try{ r.eng(); }catch(e){ (S.C._errs=S.C._errs||[]).push(r.id+": "+e.message); } } };
  let prev=null;
  for(let pass=0; pass<3; pass++){
    runPass();
    let snap; try{ snap=JSON.stringify(S.C); }catch(e){ snap=null; }
    if(snap!=null && snap===prev) break;   /* reached the fixpoint — further passes are identical */
    prev=snap;
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

function buildReturn(){
  compute();
  const j=deep(SKEL);
  for(const r of _SECREG){ if(r.exp){ try{ r.exp(j); }catch(e){ (S.C._errs=S.C._errs||[]).push("exp "+r.id+": "+e.message);} } }
  return {ITR:{ITR5:j}};
}

/* importReturn — the inverse. The shell hands us the inner ITR5 object; be
   tolerant of a whole { ITR: { ITR5 } } wrapper or a bare ITR5 object.
   Return-detection: an ITR-5 return is recognised by its PartA_GEN1 root. */
function importReturn(I){
  const read=[];
  const I5=(I&&I.ITR&&I.ITR.ITR5)?I.ITR.ITR5:((I&&I.ITR5)?I.ITR5:I);
  for(const r of _SECREG){ if(r.imp){ try{ const got=r.imp(I5); if(Array.isArray(got)) read.push.apply(read,got);}catch(e){} } }
  compute();
  return read;
}

/* runRules/auditRules are the live driver in 60_rules.js (loads before this file). */
