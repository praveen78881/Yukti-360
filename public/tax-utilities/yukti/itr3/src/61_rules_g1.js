/* =====================================================================
   ITR-3 · AY 2026-27 — validation-rule batch g1 (Phase 6, rules-enforcer).
   Registered via ruleset(fn); runRules() runs it with its own A/Dd
   collectors. A(n,cond,msg) fires when cond (the "valid" assertion) is
   FALSE. Reads are guarded (RG / (X||{})); nothing throws. Schema keys
   verified against the section exporters (70_sec_*.js) and the built
   test return. Serials are ITR-3 rules.json Category-A serials.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2",{})||{};
  const AI=RG(G2,"AuditInfo",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";                 /* old = 10-IEA opt-out */
  const sysISO=(function(){try{return new Date().toISOString().slice(0,10);}catch(e){return "9999-12-31";}})();

  /* =============================================================
     PART A — GENERAL / AUDIT
     ============================================================= */
  /* 17 — date of the audit report cannot be after the system date */
  RG(AI,"AuditDetails",[]).forEach((r,i)=>{
    A(17,!r.DateOfAudit||String(r.DateOfAudit)<=sysISO,"Part A-Gen: the date of the audit report (row "+(i+1)+") cannot be after the system date.");});
  /* 26 — due date 31 October selected: Schedule IF / 5A / audit details must be present */
  A(26,FS.ItrFilingDueDate!=="2026-10-31"||!!I.ScheduleIF||!!I.Schedule5A2014||RG(AI,"AuditDetails",[]).length>0,
    "Due date of 31 October is selected — fill Schedule IF, Schedule 5A or the audit details in Part A-Gen.");

  /* =============================================================
     PART A — MANUFACTURING / TRADING ACCOUNT
     ============================================================= */
  if(I.ManufacturingAccount){const cs=RG(I,"ManufacturingAccount.ClosingStock",{});
    A(65,REQ(cs.ClsngStckTotal,N(cs.ClsngStckRawMaterial)+N(cs.ClsngStckWrkInPrgrs)),
      "Manufacturing Account: total closing stock (2iii) must equal raw material (2i) + work-in-progress (2ii).");}
  if(I.TradingAccount){const T=I.TradingAccount,ec=RG(T,"ExciseCustomsVAT",{});
    A(71,REQ(ec.TotExciseCustomsVAT,["UnionExciseDuty","ServiceTax","VATorSaleTax","CentralGoodServiceTax","StateGoodServiceTax","IntegratedGoodServiceTax","UnionTerrGoodServiceTax","OthDutyTaxCess"].reduce((a,k)=>a+N(ec[k]),0)),
      "Trading Account: total duties/taxes (4C(ix)) must equal the sum of 4C(i) to 4C(viii).");
    A(77,N(T.IncomeIntradayTrd)<=N(T.TurnoverIntradayTrd),
      "Trading Account: income from intraday trading (12b) cannot exceed the turnover from intraday trading (12a).");}

  /* =============================================================
     PART A — P&L
     ============================================================= */
  if(I.PARTA_PL){const pl=I.PARTA_PL;
    const rt=RG(pl,"DebitsToPL.RatesTaxesPays.ExciseCustomsVAT",{});
    A(89,REQ(rt.TotExciseCustomsVAT,["UnionExciseDuty","ServiceTax","VATorSaleTax","Cess","CentralGoodServiceTax","StateGoodServiceTax","IntegratedGoodServiceTax","UnionTerrGoodServiceTax","OthDutyTaxCess"].reduce((a,k)=>a+N(rt[k]),0)),
      "Part A-P&L: total rates and taxes (44x) must equal the sum of 44i to 44ix.");
    const p44=RG(pl,"PersumptiveInc44AD",{});
    A(99,REQ(p44.TotPersumptiveInc44AD,N(p44.PersumptiveInc44AD6Per)+N(p44.PersumptiveInc44AD8Per)),
      "Part A-P&L: presumptive income u/s 44AD (61(ii)) must equal 61(ii)A + 61(ii)B.");
    A(105,RG(pl,"NatOfBus44AD",[]).length===0||N(p44.TotPersumptiveInc44AD)>0,
      "Part A-P&L: a business code u/s 44AD is selected — income u/s 44AD must be declared.");
    const p44ada=RG(pl,"PersumptiveInc44ADA",{});
    A(111,N(p44ada.TotPersumptiveInc44ADA)<=N(p44ada.GrsReceipt),
      "Part A-P&L: presumptive income u/s 44ADA cannot exceed gross receipts (62i).");
    A(117,RSUM(RG(pl,"GoodsDtlsUs44AE",[]),"HoldingPeriod")<=120,
      "Part A-P&L: the total number of months in the 44AE goods-carriage table cannot exceed 120.");
    const nb=RG(pl,"NoBooksOfAccPL",{});
    A(124,N(nb.GrossProfit)<=N(nb.GrossReceipt),
      "Part A-P&L: business gross profit (64i(b)) cannot exceed business gross receipts (64i(a)).");
    RG(pl,"DebitsToPL.BadDebtDtls.BadDebtAmtDtls",[]).forEach((r,i)=>{
      A(131,!N(r.Amount)||(!!r.PAN||!!r.Aadhaar),"Part A-P&L: bad debt (47i) row "+(i+1)+" needs a PAN or Aadhaar.");});
    RG(pl,"NonResidentPLDetails",[]).forEach((r,i)=>{
      A(143,r.Section!=="44B"||N(r.NetProfit)>=N(r.GrossReceipt)*0.075-1,
        "Part A-P&L: for section 44B, net profit (66(ii)) cannot be less than 7.5% of gross receipts (row "+(i+1)+").");});
    A(137,N(p44ada.GrsReceipt)<=7500000||AI.LiableSec44ABflg==="Y",
      "Part A-P&L: gross receipts u/s 44ADA exceed Rs.75,00,000 — a tax audit u/s 44AB is mandatory.");}

  /* =============================================================
     PART A — OTHER INFORMATION (OI)
     ============================================================= */
  if(I.PARTA_OI){const oi=I.PARTA_OI,d40=RG(oi,"AmtDisallUs40",{});
    A(155,REQ(d40.TotAmtDisallUs40,["NonCompChapXVIIBAmt","NonComp40aiiChapXVIIBAmt","NonComp40aibChapXVIIBAmt","NonComp40aiiiChapXVIIBAmt","TaxAmtOnProfits","WTAmt","RolyatyOrServiceFee","IntSalBonPartner","OthDisallow"].reduce((a,k)=>a+N(d40[k]),0)),
      "Part A-OI: total disallowable u/s 40 (8Aj) must equal the sum of 8Aa to 8Ai.");}

  /* =============================================================
     SCHEDULE BP
     ============================================================= */
  if(I.ITR3ScheduleBP){const P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{});
    A(246,REQ(P.AdjustedPLOthThanSpecBus,N(P.BalancePLOthThanSpecBus)+N(P.TotExpDebPL)),
      "Schedule BP: A10 (adjusted profit/loss) must equal 6 + 9.");
    A(298,N(RG(P,"DeemedChrgblIncUndrRule8"))>=Math.round(N(RG(P,"ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule8"))*0.40)-1,
      "Schedule BP: deemed income chargeable under Rule 8 (37e) must be at least 40% of the Rule 8 profit (4b(v)).");
    const dp=N(RG(P,"DeemedProfitBusUs.Section44AD"))+N(RG(P,"DeemedProfitBusUs.Section44ADA"))+N(RG(P,"DeemedProfitBusUs.Section44AE"));
    A(283,dp<=0||!!I.PARTA_BS,
      "Schedule BP: presumptive income (35 i/ii/iii) is disclosed — the Balance Sheet particulars (regular books or no-account case) are mandatory.");
    if(I.PARTA_OI)A(277,REQ(P.ExpDebToPLExemptIncDisAllwUs14A,RG(I,"PARTA_OI.AmountOfExpDisAllwUs14A")),
      "Schedule BP: expenditure disallowable u/s 14A (8b) must equal item 16 of Schedule Part A-OI.");}

  /* =============================================================
     SCHEDULE CFL — carry forward of losses
     ============================================================= */
  if(I.ScheduleCFL&&I.ITR3ScheduleBP){
    A(239,REQ(RG(I,"ScheduleCFL.CurrentAYloss.LossSummaryDetail.LossFrmSpecifiedBusCF"),Math.max(0,-N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.PLFrmSpecifiedBus")))),
      "Schedule CFL: current-year specified-business loss must equal C48 of Schedule BP (loss only).");}

  /* =============================================================
     SCHEDULE DPM — plant & machinery blocks
     ============================================================= */
  if(I.ScheduleDPM){["Rate15","Rate30","Rate40","Rate45"].forEach(blk=>{
    const o=RG(I,"ScheduleDPM.PlantMachinery."+blk+".DepreciationDetail",{});
    if(!o||typeof o!=="object"||!Object.keys(o).length)return;const L="Schedule DPM "+blk+": ";
    A(313,REQ(o.Total,N(o.WDVFirstDay)+N(o.AdjustmentSec115BAC)),L+"item 3 must equal 3a + 3b.");
    A(305,REQ(o.HalfRateDeprAmt,Math.max(0,N(o.AdditionsLessThan180Days)-N(o.RealizationPeriodLessThan180days))),L+"item 9 (amount at half rate) must equal 7 - 8, or zero if negative.");});}

  /* =============================================================
     SCHEDULE CG — equity/MF on STT (short term) deduction total
     ============================================================= */
  if(I.ScheduleCGFor23){
    RG(I,"ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT",[]).forEach((row,i)=>{
      const d=RG(row,"EquityMFonSTTDtls.DeductSec48",{});
      A(370,REQ(d.TotalDedn,N(d.AquisitCost)+N(d.ImproveCost)+N(d.ExpOnTrans)),
        "Schedule CG: A3b(iv) total deduction (equity/MF STT block "+(i+1)+") must equal bi + bii + biii.");});}

  /* =============================================================
     SCHEDULE BFLA — total income after set-off
     ============================================================= */
  if(I.ScheduleBFLA){const bf=I.ScheduleBFLA;
    var BFROWS=["Salary","HP","BusProfExclSpecProf","SpeculativeInc","SpecifiedInc","STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate","OthSrcExclRaceHorse","OthSrcRaceHorse","IncOSDTAA"];
    A(588,REQ(bf.IncomeOfCurrYrAftCYLABFLA,BFROWS.reduce((a,k)=>a+N(RG(bf,k+".IncBFLA.IncOfCurYrAfterSetOffBFLosses")),0)),
      "Schedule BFLA: total income after set-off (xvi) must equal the sum of column 5 (5i to 5xiv).");}

  /* =============================================================
     SCHEDULE VIA + SUB-SCHEDULES — deductions (within-schedule sums)
     ============================================================= */
  if(I.ScheduleVIA){const U=RG(I,"ScheduleVIA.UsrDeductUndChapVIA",{}),Dn=RG(I,"ScheduleVIA.DeductUndChapVIA",{});
    A(826,REQ(U.Section80CCC,RSUM(RG(U,"PensionContribution80CCC",[]),"Amount")),
      "Schedule VI-A: 80CCC amount must equal the sum of the individual pension-contribution rows.");
    if(I.Schedule80DD)A(672,newR||REQ(RG(I,"Schedule80DD.DeductionAmount"),Dn.Section80DD),
      "Old regime: the 80DD deduction must equal the amount claimed at 80DD in Schedule VI-A.");}
  if(I.Schedule80C)A(695,REQ(I.Schedule80C.TotalAmt,RSUM(RG(I,"Schedule80C.Schedule80CDtls",[]),"Amount")),
    "Schedule 80C: the total deduction must equal the sum of the individual 80C rows.");

  /* =============================================================
     SCHEDULE TPSA — secondary adjustment
     ============================================================= */
  if(I.ScheduleTPSA){RG(I,"ScheduleTPSA.DtlsTaxesPaid",[]).forEach((r,i)=>{
    A(886,!r.DateDep||String(r.DateDep)<=sysISO,"Schedule TPSA: the date on which tax is deposited (row "+(i+1)+") cannot be after the system date.");});}
});
