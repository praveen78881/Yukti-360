/* =====================================================================
   ITR-6 · AY 2026-27 — the department's validation rules (Phase 6).
   runRules(I,S_) returns [{cat:"A"|"D", n, msg}] — one entry per rule
   that is VIOLATED. I is the built ITR6 object (schema keys); S_ is the
   live state. Serials are the ITR-6 rules.json serials (A#, D#).

   This scaffold ships the runRules DRIVER only: it sets up the A/Dd
   collectors and runs every rule batch registered by a 61_rules_*.js
   file through ruleset(). The rule bodies are encoded in those disjoint
   files in Phase 6 (parallel encoding, no conflicts), each from the
   rule's own text (constitution rule 6), with guarded reads (RG /
   (X||{})) so nothing throws.

   auditRules(b) is the form's own arithmetic self-audit — NOT the
   department rules — mirroring ITR-3's auditRules, keyed to ITR-6.
   ===================================================================== */

function runRules(I,S_){
  const out=[];
  const A=(n,cond,msg)=>{if(!cond)out.push({cat:"A",n:n,msg:msg});};
  const Dd=(n,cond,msg)=>{if(!cond)out.push({cat:"D",n:n,msg:msg});};
  I=I||{};
  /* Phase 6 rule batches (61_rules_*.js) run here with the A/Dd collectors,
     each guarded so a throwing batch never breaks the export gate. */
  if(typeof _RULEBATCHES!=="undefined")_RULEBATCHES.forEach(rb=>{try{rb(I,S_,A,Dd);}catch(e){}});
  return out;
}

/* =====================================================================
   auditRules(b) — the form's own arithmetic audit on the built return.
   Belt-and-braces checks on the Part B roll-up; returns messages.
   Keyed to ITR-6: root ITR6, blocks "PartB-TI" (hyphen) and "PartB_TTI"
   (underscore). A company gets no section 87A rebate, so the gross-tax
   roll-up is tax-on-total-income + total surcharge + cess.
   ===================================================================== */
function auditRules(b){
  const out=[];
  const j=(b&&b.ITR&&(b.ITR.ITR6||b.ITR[Object.keys(b.ITR)[0]]))||{};
  const g=(p,d)=>{let o=j;for(const k of p.split(".")){if(o&&k in o)o=o[k];else return d===undefined?0:d;}return o==null?(d===undefined?0:d):o;};
  const R_=(w,l,r,t)=>{if(Math.abs(N(l)-N(r))>(t||1))out.push(w+" (out by "+F(N(l)-N(r))+")");};
  R_("total income is not gross total income less Chapter VI-A and 10AA",g("PartB-TI.TotalIncome"),
    Math.max(0,Math.round((g("PartB-TI.GrossTotalIncome")-g("PartB-TI.DeductionsUndSchVIADtl.TotDeductUndSchVIA")-g("PartB-TI.DeductionsUnder10Aor10AA"))/10)*10),10);
  const C="PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.";
  R_("gross tax liability does not add up",g(C+"GrossTaxLiability"),
    Math.max(0,g(C+"TaxPayableOnTotInc"))+g(C+"TotalSurcharge")+g(C+"EducationCess"),2);
  R_("the taxes paid do not add up",g("PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid"),
    g("PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax")+g("PartB_TTI.TaxPaid.TaxesPaid.TDS")
    +g("PartB_TTI.TaxPaid.TaxesPaid.TCS")+g("PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax"));
  return out;
}
