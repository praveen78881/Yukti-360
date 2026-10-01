/* =====================================================================
   ITR-5 · Section "regime" — SINGLE SOURCE OF TRUTH for the tax regime
   (engine-only, hidden; no screen slot). Compute order 3 — runs BEFORE
   every consumer (bp=25, ded=50, amt=54, tax=60) so ded/bp/amt/tax and
   the rule gates can all read one resolved regime object instead of each
   re-deriving eligibility (and the shell isNew(), which only sees 115BAC).

   PUBLISHES S.C.regime = {
     st, sub, subC,          identity (status code / substatus / first char)
     isCoop, canBAC,         eligibility buckets
     is115BAC,   // canBAC (non-coop AOP/BOI status 14, or AJP status 9) && S.fs.optout!=="Yes"
     is115BAD,   // isCoop && S.fs.newTaxRegime==="Y"
     is115BAE,   // isCoop && (S.fs.baeYes==="Y" || S.fs.baeNo==="Y")
     anyConc     // is115BAC || is115BAD || is115BAE
   }

   Eligibility mirrors 70_sec_gen.js:170-172 EXACTLY:
     subC = st0(S.pi.substatus).charAt(0)
     isCoop = (st==="14" && (subC==="1"||subC==="3"))
     canBAC = ((st==="14" && !isCoop) || st==="9")
   Flag keys are the ones 70_sec_tax.js taxStatus() already reads at :60-61:
     S.fs.optout ("Yes"=old, master 115BAC switch), S.fs.newTaxRegime ("Y"),
     S.fs.baeYes / S.fs.baeNo ("Y").
   st0 (shell.js) = v=>String(v==null?"":v).trim(), so st0(undefined)="".
   Every read is guarded ((S.pi||{}), (S.fs||{})) — never throws on empty boot.

   GTI CONTRIBUTION: none — this section publishes only the regime object.
   CONSUMERS read S.C.regime.{is115BAC,is115BAD,is115BAE,anyConc} and apply
   their own book-correct bars.
   ===================================================================== */

function engRegime(){
  const pi=S.pi||{}, fs=S.fs||{};
  const st=st0(pi.status);
  const sub=st0(pi.substatus);
  const subC=sub.charAt(0);
  const isCoop=(st==="14" && (subC==="1"||subC==="3"));
  const canBAC=((st==="14" && !isCoop) || st==="9");
  const is115BAC = canBAC && fs.optout!=="Yes";
  const is115BAD = isCoop && fs.newTaxRegime==="Y";
  const is115BAE = isCoop && (fs.baeYes==="Y" || fs.baeNo==="Y");
  const anyConc  = is115BAC || is115BAD || is115BAE;
  S.C=S.C||{};
  S.C.regime={st, sub, subC, isCoop, canBAC, is115BAC, is115BAD, is115BAE, anyConc};
}

/* ---- register — engine only, compute order 3 (before bp/ded/amt/tax);
   order 999 keeps it out of any visible screen slot ------------------- */
reg({id:"regime", t:"", ref:"", f:()=>"", s:{},
  eng:engRegime, exp:()=>{}, imp:()=>{}, chk:()=>[], order:999, corder:3});
