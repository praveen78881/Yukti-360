/* =====================================================================
   ITR-1 · A.Y. 2026-27 — the rule driver (the rule bodies arrive later).
   runRules(I,S_) returns [{cat:"A"|"D", n, msg}] — one entry per rule whose
   lawful assertion is FALSE (a violation). I is the built ITR1 object (schema
   keys); S_ is the live state. Every actual CBDT check lives in the
   61_rules_*.js ruleset() batches (Category A blocking, Category D advisory),
   registered into _RULEBATCHES (08_registry.js); they are encoded later from
   each rule's own text, with guarded reads (RG / (X||{})).

   This scaffold ships the DRIVER only. Fault tolerance is PER RULE, following
   the fixed forms/ITR-7/src/60_rules.js: each A()/Dd() assertion is evaluated
   inside its own try/catch, so one rule that throws (e.g. on a wrong-typed
   imported field) is skipped — and recorded as an advisory — without aborting
   the sibling rules that follow it in the same batch. A rule may pass its
   condition either as a value (evaluated eagerly by the batch) or as a thunk
   `()=>cond` (evaluated here, which gives a throwing rule true per-rule
   isolation). A batch-level try/catch is retained only as a backstop for a
   fault in a batch's shared setup.

   RG / N / RSUM / REQ / isNew and the other helpers come from the shell
   (shell/shell.js); the rules do not redefine them.
   ===================================================================== */
function runRules(I,S_){
  I=I||{};
  const out=[];
  const fire=(cat,n,cond,msg)=>{
    let c;
    try{ c=(typeof cond==="function")?cond():cond; }
    catch(e){ out.push({cat:"D", n:n, msg:"[rule "+n+" skipped — "+((e&&e.message)||e)+"]"}); return; }  /* a throwing rule is skipped & recorded, never aborts its siblings */
    if(!c) out.push({cat:cat, n:n, msg:msg});
  };
  const A =(n,cond,msg)=>fire("A",n,cond,msg);   /* Category A — return not allowed to upload */
  const Dd=(n,cond,msg)=>fire("D",n,cond,msg);   /* Category D — advisory / may be defective u/s 139(9) */
  if(typeof _RULEBATCHES!=="undefined"){
    _RULEBATCHES.forEach(rb=>{ try{ rb(I,S_,A,Dd); }catch(e){ /* backstop: a fault in a batch's shared setup skips the rest of THAT batch only, never the other batches */ } });
  }
  return out;
}

/* =====================================================================
   auditRules(b) — the form's OWN arithmetic audit on the built return
   (belt-and-braces roll-up checks), returning string messages, [] when the
   return agrees with itself. This is NOT the department's validation rules
   (that is runRules); the shell calls this separately as the "does not agree
   with itself" gate, so it carries no Category-D advisories. Keyed to
   ITR-1's ITR1_TaxComputation and TaxPaid blocks. The section-builder phase
   fills the figures these check; until then the return has zeros and the
   audit is silent.
   ===================================================================== */
function auditRules(b){
  const out=[];
  const j=(b&&b.ITR&&(b.ITR.ITR1||b.ITR[Object.keys(b.ITR)[0]]))||{};
  const g=(p,d)=>{let o=j;for(const k of p.split(".")){if(o&&k in o)o=o[k];else return d===undefined?0:d;}return o==null?(d===undefined?0:d):o;};
  const R_=(w,l,r,t)=>{if(Math.abs(N(l)-N(r))>(t||1))out.push(w+" (out by "+(N(l)-N(r))+")");};
  const T="ITR1_TaxComputation.";
  /* tax payable after 87A rebate = total tax payable less the rebate (floored at 0) */
  R_("tax payable after rebate does not agree with total tax payable less rebate 87A",g(T+"TaxPayableOnRebate"),
    Math.max(0,g(T+"TotalTaxPayable")-g(T+"Rebate87A")),2);
  /* gross tax liability = tax payable after rebate + 4% health & education cess */
  R_("gross tax liability does not add up",g(T+"GrossTaxLiability"),
    g(T+"TaxPayableOnRebate")+g(T+"EducationCess"),2);
  /* net tax liability = gross tax liability less relief u/s 89 (floored at 0) */
  R_("net tax liability is not gross tax liability less relief u/s 89",g(T+"NetTaxLiability"),
    Math.max(0,g(T+"GrossTaxLiability")-g(T+"Section89")),2);
  /* total interest & fee = 234A + 234B + 234C + 234F + 234-I */
  R_("total interest payable does not add up",g(T+"TotalIntrstPay"),
    g(T+"IntrstPay.IntrstPayUs234A")+g(T+"IntrstPay.IntrstPayUs234B")+g(T+"IntrstPay.IntrstPayUs234C")
    +g(T+"IntrstPay.LateFilingFee234F")+g(T+"IntrstPay.FeeFurnish234I"),2);
  /* aggregate tax + interest = net tax liability + total interest payable */
  R_("aggregate tax plus interest does not add up",g(T+"TotTaxPlusIntrstPay"),
    g(T+"NetTaxLiability")+g(T+"TotalIntrstPay"),2);
  /* taxes paid = advance + TDS + TCS + self-assessment */
  R_("the taxes paid do not add up",g("TaxPaid.TaxesPaid.TotalTaxesPaid"),
    g("TaxPaid.TaxesPaid.AdvanceTax")+g("TaxPaid.TaxesPaid.TDS")
    +g("TaxPaid.TaxesPaid.TCS")+g("TaxPaid.TaxesPaid.SelfAssessmentTax"));
  return out;
}
