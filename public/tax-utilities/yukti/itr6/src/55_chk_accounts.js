/* =====================================================================
   CHECKS — this section's own screen validations (not department rules).
   ===================================================================== */
function chkAccounts(){
  const out=[]; const A=S.accounts||{}, C=S.C.accounts||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"accounts"});
  const basis=st0(A.basis)||"reg";
  if(basis==="ol"){
    if(_accHas(A.ol)&&C.olMismatch)
      add("err","Receipt & payment account does not tie","Total of opening balance and receipts (₹"+F(C.olIn)+") must equal the total of closing balance and payments (₹"+F(C.olOut)+").");
    return out;
  }
  const ias=basis==="ias";
  const mism=ias?C.biasMismatch:C.bsMismatch;
  const el=ias?C.biasTotEL:C.bsTotEL, as=ias?C.biasTotAsset:C.bsTotAsset;
  if((el||as)&&mism)
    add("err","Balance Sheet does not balance","Total Equity & Liabilities (₹"+F(el)+") must equal Total Assets (₹"+F(as)+").");
  else if(el&&as)
    add("ok","Balance Sheet balances","Both sides foot to ₹"+F(el)+".");
  const pbt=ias?C.pbtIndAs:C.pbt;
  if(N(pbt)!==0) add("ok","P&L profit before tax","₹"+F(pbt)+" (P&L item 53) — enter the same figure at Schedule BP item 1.");
  if(_acOIon(A)&&!st0(RG(A,"oi.MethodOfAcct")))
    add("warn","Part A-OI method of accounting unanswered","State the method of accounting (item 1) — defaults to Mercantile on export.");
  return out;
}

/* ---- register (overrides the boot stub for "accounts") ---------------- */
reg({id:"accounts", t:"Audited accounts", ref:"BS · Mfg/Trading · P&L · Ind-AS · OI · QD · OL",
  f:secAccounts,
  s:()=>{ const C=S.C.accounts||{}; const el=C.bsTotEL||C.biasTotEL||0; const pbt=C.pbt||C.pbtIndAs||0;
    return el?(CR(el)+(( (C.bsMismatch&&C.bsTotEL)||(C.biasMismatch&&C.biasTotEL))?" ⚠":"")):(pbt?"PBT "+CR(pbt):""); },
  eng:engAccounts, exp:expAccounts, imp:impAccounts, chk:chkAccounts, order:15, corder:15});
