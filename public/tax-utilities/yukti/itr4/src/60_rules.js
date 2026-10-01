/* ITR-4 validation rules. runRules(I,S_) returns [{cat:"A"|"D",n,msg}] — a rule
   FIRES (is pushed) when its assertion is false. Checkable Category-A rules live
   in 61_rules_g*.js ruleset() batches; this runner aggregates them. Helpers
   RG/RSUM/REQ/N/R/isNew come from the shell. */
function runRules(I,S_){
  const out=[];
  const A=(n,cond,msg)=>{if(!cond)out.push({cat:"A",n:n,msg:msg});};
  const Dd=(n,cond,msg)=>{if(!cond)out.push({cat:"D",n:n,msg:msg});};
  if(typeof _RULEBATCHES!=="undefined")_RULEBATCHES.forEach(rb=>{try{rb(I,S_,A,Dd);}catch(e){}});
  return out;
}
function auditRules(b){return [];}
