/* =====================================================================
   EXPORT helpers — a schema-clean serializer. Every leaf written is a
   verbatim schema key: the state subtree mirrors the schema shape and the
   engine only ever writes schema keys, so a guided copy is exact. Numbers
   are coerced to whole rupees; empty branches/strings are dropped.
   ===================================================================== */
function _acEnum(v,allowed,def){ const t=st0(v); return allowed.indexOf(t)>=0?t:def; }
function _acClean(v){
  if(Array.isArray(v)) return _acRows(v);
  if(v&&typeof v==="object"){
    const o={}; for(const k of Object.keys(v)){ const c=_acClean(v[k]); if(c!==undefined) o[k]=c; }
    return Object.keys(o).length?o:undefined;
  }
  if(typeof v==="number") return R(v);
  const t=st0(v); return t===""?undefined:t;
}
function _acRows(a){
  if(!Array.isArray(a)) return undefined;
  const out=a.map(_acClean).filter(v=>v!==undefined);
  return out.length?out:undefined;
}
/* overlay src onto dst (the SKEL / required skeleton subtree), adding arrays
   and optional leaves from state without ever creating an empty object. */
function _acOverlay(dst,src){
  if(!dst||src==null||typeof src!=="object") return;
  for(const k of Object.keys(src)){
    const v=src[k];
    if(Array.isArray(v)){ const r=_acRows(v); if(r) dst[k]=r; }
    else if(v&&typeof v==="object"){
      if(_acClean(v)===undefined) continue;
      if(dst[k]==null||typeof dst[k]!=="object"||Array.isArray(dst[k])) dst[k]={};
      _acOverlay(dst[k],v);
    }
    else if(typeof v==="number") dst[k]=R(v);
    else { const t=st0(v); if(t!=="") dst[k]=t; }
  }
}
/* one QD row: integer columns via R, PercentYld kept as a number */
function _acQrow(r){
  if(!r||typeof r!=="object") return undefined; const o={};
  const put1=(k,fn)=>{ const v=r[k]; if(v!=null&&st0(v)!=="") o[k]=fn(v); };
  put1("ItemName",st0); put1("UnitOfMeasure",st0);
  ["OpeningStock","PurchaseQty","PrevYrConsum","PrevyrManfact","SaleQty","ClgStock","yldFinisProd","AnyShortExces"].forEach(k=>put1(k,x=>R(x)));
  put1("PercentYld",x=>N(x));
  return Object.keys(o).length?o:undefined;
}
function _acQrows(a){ if(!Array.isArray(a))return undefined; const out=a.map(_acQrow).filter(v=>v!==undefined); return out.length?out:undefined; }
/* the required-leaf skeleton for Part A-OI (zeros + enum defaults) */
function _acOIskel(){
  const zobj=keys=>{ const x={}; keys.forEach(k=>x[k]=0); return x; };
  return {
    MethodOfAcct:"MERC", ChangeInAcctMethFlg:"N", ProfDeviatDueAcctMeth:0, DecProOrIncLossUs145_2:0,
    MethodOfValClgStk:{ValRawMaterial:"1",ValFinishedGoods:"1",ChngStockValMetFlg:"N",EffectOnPL:0,DecProOrIncLossUs145_A:0},
    NoCredToPLAmt:zobj(OI_NC5.map(r=>r[0]).concat("TotNoCredToPLAmt")),
    AmtDisallUs36:zobj(OI36.map(r=>r[0]).concat("TotAmtDisallUs36")),
    AmtDisallUs37:zobj(OI37.map(r=>r[0]).concat("TotAmtDisallUs37")),
    AmtDisallUs40:zobj(OI40.map(r=>r[0]).concat("TotAmtDisallUs40")),
    AmtDisallUs40A:zobj(OI40A.map(r=>r[0]).concat("TotAmtDisallUs40A")),
    AmtDisallUs43BPyNowAll:{AmtUs43B:zobj(OI43.slice(0,7).map(r=>r[0]).concat("TotAmtUs43b"))},
    AmtDisall43B:{AmtUs43B:zobj(OI43.slice(0,8).map(r=>r[0]).concat("TotAmtUs43b"))},
    AmtExciseCustomsVATOutstanding:{ExciseCustomsVAT:{TotExciseCustomsVAT:0}},
    DeemedProfUs33ABs:0, ProfTaxAmtUs41:0, PriorAmtIncCrDrPL:0, AmountOfExpDisAllwUs14A:0, ScheduleTPSAFlg:"N"
  };
}
function _acOI(j){
  const A=S.accounts||{}, sk=_acOIskel();
  const st=deep(A.oi||{});
  try{ if(st.AmtDisallUs36) delete st.AmtDisallUs36.NoOfEmployeesEmployed; }catch(e){}
  _acOverlay(sk,st);
  sk.MethodOfAcct=_acEnum(RG(A,"oi.MethodOfAcct"),["MERC","CASH"],"MERC");
  sk.ChangeInAcctMethFlg=_acEnum(RG(A,"oi.ChangeInAcctMethFlg"),["Y","N"],"N");
  sk.MethodOfValClgStk.ValRawMaterial=_acEnum(RG(A,"oi.MethodOfValClgStk.ValRawMaterial"),["1","2","3"],"1");
  sk.MethodOfValClgStk.ValFinishedGoods=_acEnum(RG(A,"oi.MethodOfValClgStk.ValFinishedGoods"),["1","2","3"],"1");
  sk.MethodOfValClgStk.ChngStockValMetFlg=_acEnum(RG(A,"oi.MethodOfValClgStk.ChngStockValMetFlg"),["Y","N"],"N");
  sk.ScheduleTPSAFlg=_acEnum(RG(A,"oi.ScheduleTPSAFlg"),["Y","N"],"N");
  const eIn=N(RG(A,"oi.AmtDisallUs36.NoOfEmployeesEmployed.DeployedInIndia")), eOut=N(RG(A,"oi.AmtDisallUs36.NoOfEmployeesEmployed.DeployedOutSideIndia"));
  if(eIn||eOut) sk.AmtDisallUs36.NoOfEmployeesEmployed={DeployedInIndia:R(eIn),DeployedOutSideIndia:R(eOut),Total:R(eIn)+R(eOut)};
  j.PARTA_OI=sk;
}
function _acOL(j){
  const A=S.accounts||{};
  const sk={
    OpeningBal:{CashInHand:0,CashInBank:0,TotalOpenBal:0},
    Receipts:{Interest:0,Dividend:0,TotalSaleofAssets:0,RlznDuesDebtors:0,TotOthersReceiptsOnly:0,TotalOfReceipts:0},
    TotalOpenReceipts:0,
    Payments:{RepaymentSecuredloan:0,RepaymentUnsecuredloan:0,RepaymentCreditors:0,Commission:0,TotalOthersPayments:0,TotalPayments:0},
    ClosingStock:{CashInHand:0,CashInBank:0,TotalClBal:0},
    TotalClPaymnts:0
  };
  _acOverlay(sk,A.ol||{});
  j.PARTA_OL=sk;
}
function _acQD(j){
  const A=S.accounts||{}, qd=A.qd||{};
  const trd=_acQrows(qd.trd), raw=_acQrows(qd.raw), fin=_acQrows(qd.fin);
  const o={};
  if(trd) o.TradingConcern={QuantitDet:trd};
  if(raw||fin) o.ManfactrConcern={RawMaterial:raw?{QuantitDet:raw}:{}, FinishrByProd:fin?{QuantitDet:fin}:{}};
  if(Object.keys(o).length) j.PARTA_QD=o;
}
const _acOIon=A=>!!(A&&(A.oiOn||_accHas(A.oi)));
const _acOLon=A=>!!(A&&(A.olOn||_accHas(A.ol)));
/* TradingAccountIndAS required-leaf skeleton (its schema requires more input
   leaves than the regular Trading Account) */
function _acTrdiasSkel(){
  return { GrossRcptFromProfession:0, OpngStckOfFinishedStcks:0, Purchases:0, CarriageInward:0, PowerAndFuel:0,
    TotOthDirectExpenses:0, OperatingRevenueTotal:0, SalesGrossReceiptsTotal:0, TotRevenueFrmOperations:0,
    TardingAccTotCred:0, GrossProfitFrmBusProf:0,
    ExciseCustomsVAT:{CentralGoodServiceTax:0,StateGoodServiceTax:0,IntegratedGoodServiceTax:0,UnionTerrGoodServiceTax:0,TotExciseCustomsVAT:0} };
}

/* PARTA_PLIndAS (schema-required, always filed): overlay CreditsToPL /
   DebitsToPL onto SKEL; the OtherComprnsvInc block is OPTIONAL, so emit it
   only when it carries real OCI data — and then with every required leaf,
   since SKEL does not carry the OCI skeleton. */
function _acPLias(j, plias){
  plias=plias||{};
  const oci=plias.OtherComprnsvInc;
  const rest=deep(plias); try{ delete rest.OtherComprnsvInc; }catch(e){}
  _acOverlay(j.PARTA_PLIndAS, rest);
  if(oci&&typeof oci==="object"){
    const probe=deep(oci);
    try{ delete probe.TotalComprIncome;
      if(probe.ItemsNotReclsfdPnL){ delete probe.ItemsNotReclsfdPnL.OthersTotal; delete probe.ItemsNotReclsfdPnL.TotalNotPnL; }
      if(probe.ItemsReclsfdPnL){ delete probe.ItemsReclsfdPnL.OthersTotal; delete probe.ItemsReclsfdPnL.TotalPnL; }
    }catch(e){}
    if(_accHas(probe)){
      const osk={ ItemsNotReclsfdPnL:{ChangesInSurplus:0,ReMesDefinedBenftPlans:0,EquityOCI:0,FairValFVTPl:0,ShareOfOtherComprInc:0,OthersTotal:0,IncomeTaxNotPnL:0,TotalNotPnL:0},
                  ItemsReclsfdPnL:{ExchangeDiff:0,DebtsOCI:0,EffecPortionGainnLoss:0,ShareOCI:0,OthersTotal:0,IncomeTaxReclsPnL:0,TotalPnL:0},
                  TotalComprIncome:0 };
      _acOverlay(osk, oci);
      j.PARTA_PLIndAS.OtherComprnsvInc=osk;
    }
  }
}

function expAccounts(j){
  const A=S.accounts||{};
  /* the four schema-required blocks: overlay live values onto the SKEL zero
     skeleton already present in j (SKEL carries every required leaf). */
  _acOverlay(j.PARTA_BSFor6FrmAY13, A.bs);
  _acOverlay(j.PARTA_BSIndAS,       A.bsias);
  _acOverlay(j.PARTA_PL,            A.pl);
  _acPLias(j, A.plias);
  /* optional blocks — emitted only when they carry data */
  if(_accHas(A.mfg))    j.ManufacturingAccount     =_acClean(A.mfg);
  if(_accHas(A.trd))    j.TradingAccount            =_acClean(A.trd);
  if(_accHas(A.mfgias)) j.ManufacturingAccountIndAS =_acClean(A.mfgias);
  /* TradingAccountIndAS requires input leaves the engine does not write
     (GST fields, opening stock, purchases, carriage, power) — overlay onto
     a required-leaf skeleton so every mandatory leaf is present. */
  if(_accHas(A.trdias)){ const tsk=_acTrdiasSkel(); _acOverlay(tsk,A.trdias); j.TradingAccountIndAS=tsk; }
  if(_acOIon(A)) _acOI(j);
  if(_accHas(A.qd)) _acQD(j);
  if(_acOLon(A)) _acOL(j);
}
