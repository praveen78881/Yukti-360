/* =====================================================================
   IMPORT — inverse of the exporter. The state subtree equals the schema
   shape, so a raw copy back into S.accounts round-trips to the byte; QD's
   three helper arrays are the only remapping. Totals are re-derived by the
   engine on the following compute(), so the round-trip is identity.
   ===================================================================== */
function impAccounts(I6){
  const read=[]; if(!I6||typeof I6!=="object") return read;
  const A=S.accounts=S.accounts||{};
  const cp=(k,ns,flag,label)=>{ const b=I6[k]; if(b!=null&&typeof b==="object"){ A[ns]=deep(b); if(flag)A[flag]=true; if(label)read.push(label); return true; } return false; };
  cp("PARTA_BSFor6FrmAY13","bs","bsOn","Part A — Balance Sheet");
  cp("PARTA_BSIndAS","bsias","biasOn",null);
  cp("PARTA_PL","pl","plOn","Part A — Statement of Profit and Loss");
  cp("PARTA_PLIndAS","plias","pliasOn",null);
  cp("ManufacturingAccount","mfg","mfgOn","Part A — Manufacturing Account");
  cp("TradingAccount","trd","trdOn","Part A — Trading Account");
  cp("ManufacturingAccountIndAS","mfgias","mfgiasOn",null);
  cp("TradingAccountIndAS","trdias","trdiasOn",null);
  if(cp("PARTA_OI","oi","oiOn","Part A — Other Information (OI)")) {}
  const qd=I6.PARTA_QD;
  if(qd&&typeof qd==="object"){
    A.qd={ trd:RG(qd,"TradingConcern.QuantitDet",[])||[],
           raw:RG(qd,"ManfactrConcern.RawMaterial.QuantitDet",[])||[],
           fin:RG(qd,"ManfactrConcern.FinishrByProd.QuantitDet",[])||[] };
    A.qdOn=true; read.push("Part A — Quantitative Details (QD)");
  }
  if(cp("PARTA_OL","ol","olOn","Part A — Receipt & Payment (company under liquidation)")) {}
  /* infer the screen basis so the imported set shows on the right path */
  if(_accHas(A.ol)) A.basis="ol";
  else if(_accHas(A.bsias)&&!_accHas(A.bs)) A.basis="ias";
  else if(!st0(A.basis)) A.basis="reg";
  return read;
}
