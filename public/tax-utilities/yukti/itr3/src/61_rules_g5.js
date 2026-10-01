/* =====================================================================
   ITR-3 · AY 2026-27 — validation rule batch g5 (Phase 6).
   Category-A checkable rules encoded as ruleset(fn); runRules() runs
   this with its A/Dd collectors. A(n,cond,msg) fires when cond is
   FALSE (cond = the assertion that holds for a VALID return). All reads
   are guarded (RG / N / presence checks); nothing throws. Serials are
   the ITR-3 rules.json serials.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var PI=RG(I,"PartA_GEN1.PersonalInfo",{})||{};
  var FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  var G2=RG(I,"PartA_GEN2.AuditInfo",{})||{};
  var ti=RG(I,"PartB-TI",{})||{};
  var tti=RG(I,"PartB_TTI",{})||{};
  var CTL=RG(tti,"ComputationOfTaxLiability",{})||{};
  var newR=FS.OptOldRegimeCurrAY!=="Y";

  /* =============================================================
     PART A — GENERAL / AUDIT (13, 24, 30)
     ============================================================= */
  A(13,G2.LiableSec44ABflg!=="Y"||G2.AuditAccountantFlg!=="Y"||
     (!!RG(G2,"AudFrmName","")&&!!RG(G2,"AuditReportFurnishDate","")),
     "Liable to audit u/s 44AB with accounts audited by an accountant — the auditor's name and audit-report furnishing date are mandatory.");
  A(24,G2.LiableSec44ABflg!=="Y"||!!RG(G2,"Cndnfor44AB",""),
     "Liable to audit u/s 44AB — the condition by virtue of which you are liable must be selected.");
  A(30,!(G2.TotalSalesExcOneCr==="Upto10CR"&&(G2.AgrOFAllAmtsRcvd==="MoreThan5Per"||G2.AgrOFAllPayMade==="MoreThan5Per"))||G2.LiableSec44ABflg==="Y",
     "Turnover in the Rs.1cr-10cr band with cash receipts or payments above 5% — you are liable to audit u/s 44AB.");

  /* =============================================================
     PART A — MANUFACTURING ACCOUNT (63)
     ============================================================= */
  if(I.ManufacturingAccount){var oi=RG(I,"ManufacturingAccount.OpeningInventory",{});
    A(63,REQ(oi.TotalFactoryOverheads,N(oi.IndirectWages)+N(oi.FactoryRentAndRates)+N(oi.FactoryInsurance)+N(oi.FactoryFuelAndPower)+N(oi.FactoryGeneralExpenses)+N(oi.DeprctnOfFactoryMachinery)),
      "Manufacturing Account: total factory overheads (1Evii) must equal the sum of its break-up (i to vi).");
  }

  /* =============================================================
     PART A — TRADING ACCOUNT (69, 75)
     ============================================================= */
  if(I.TradingAccount){var tr=I.TradingAccount;
    A(69,REQ(tr.OperatingRevenueTotal,RSUM(RG(tr,"OtherOperatingRevenueDtls",[]),"OperatingRevenueAmt")),
      "Trading Account: total other operating revenue must equal the sum of the individual rows.");
    A(75,REQ(tr.GrossProfitFrmBusProf,N(tr.TardingAccTotCred)-(N(tr.OpngStckOfFinishedStcks)+N(tr.Purchases)+N(tr.DirectExpenses)+N(RG(tr,"DutyTaxPay.ExciseCustomsVAT.TotExciseCustomsVAT"))+N(tr.GoodsCostPrdcdFrmMA))),
      "Trading Account: gross profit (Sl.No.12) must equal total credits minus opening stock, purchases, direct expenses, duties (10xii) and cost of goods produced.");
  }

  /* =============================================================
     PART A — P&L (82, 94, 103, 109, 115, 122, 128, 135, 141->skip, 147)
     ============================================================= */
  if(I.PARTA_PL){var pl=I.PARTA_PL,cr=RG(pl,"CreditsToPL",{}),db=RG(pl,"DebitsToPL",{});
    A(82,REQ(cr.TotCreditsToPL,N(cr.GrossProfitTrnsfFrmTrdAcc)+N(RG(cr,"OthIncome.TotOthIncome"))),
      "Part A-P&L: total credits to profit and loss account (15) must equal 13 + 14xii.");
    A(94,REQ(db.PBT,N(db.PBIDTA)-N(RG(db,"InterestExpdrtDtls.InterestExpdr"))-N(db.DepreciationAmort)),
      "Part A-P&L: net profit before taxes (53) must equal profit before interest/depreciation/taxes (50) minus total interest (51iii) minus depreciation (52).");
    var p44AD=RG(pl,"PersumptiveInc44AD",{});
    A(103,N(p44AD.TotPersumptiveInc44AD)<=N(p44AD.GrsTrnOverOrReceipt)+1,
      "Part A-P&L: income disclosed u/s 44AD cannot be more than the gross turnover/receipts.");
    A(109,!RG(pl,"NatOfBus44AE",[]).length||N(pl.TotalPrsumptvIncUs44E)>0,
      "Part A-P&L: a business code u/s 44AE is selected — presumptive income u/s 44AE must be declared.");
    A(115,!N(pl.TotalPrsumptvIncUs44E)||RG(pl,"GoodsDtlsUs44AE",[]).length>0,
      "Part A-P&L: presumptive income from goods carriage u/s 44AE (63ii) needs the goods-carriage details table (63i).");
    var nba=RG(pl,"NoBooksOfAccPL",{});
    if(pl.NoBooksOfAccPL){
      A(122,REQ(nba.NetProfit,N(nba.GrossProfit)-N(nba.Expenses)),
        "Schedule P&L: business net profit (64i d) must equal 64i b minus 64i c.");
      A(128,REQ(nba.TotBusinessProfession,N(nba.NetProfit)+N(nba.NetProfitPrf)),
        "Schedule P&L: total profit (64iii) must equal 64i d plus 64ii d.");
    }
    A(135,!(N(p44AD.GrsTrnOverOrReceipt)>20000000&&N(p44AD.GrsTotalTrnOverInCash)>0.05*N(p44AD.GrsTrnOverOrReceipt))||G2.LiableSec44ABflg==="Y",
      "Gross receipts u/s 44AD exceed Rs.2 crore with cash receipts above 5% of total receipts — a tax audit u/s 44AB is mandatory.");
    RG(db,"BadDebtDtls.OthersPANNotAvlblDtl",[]).forEach(function(r,idx){
      A(147,!(N(r.Amount)>100000)||(!!RG(r,"Name","")&&!!RG(r,"FlatDoorBlockNumber","")&&!!RG(r,"TownCityDistrict","")),
        "Part A-P&L bad debtor "+(idx+1)+": where PAN/Aadhaar is not available and the amount exceeds Rs.1 lakh, the name and address are mandatory.");
    });
  }

  /* =============================================================
     SCHEDULE OI (153, 159)
     ============================================================= */
  if(I.PARTA_OI){var d36=RG(I,"PARTA_OI.AmtDisallUs36",{});
    A(153,REQ(d36.TotAmtDisallUs36,["StkInsurPrem","EmpHealthInsurPrem","EmpBonusCommSum","IntOnBorrCap","ZeroCoupBondDisc","RecogPFContribAmt","AppSuperAnnFundAmt","PensionSchemeSec80CCD","AppGratFundAmt","OthFundAmt","EmpContributionCredits","BadDebtDoubtAmt","BadDebtDoubtProvn","SpecResrvTranfr","FamPlanPromoExp","SecuritiesPaidAmt","MrktLossOthExpLossICDS","OthDisallowances"].reduce(function(a,k){return a+N(d36[k]);},0)),
      "Schedule OI: total amount disallowable u/s 36 (6s) must equal the sum of 6a to 6r.");
    var oe12=RG(I,"PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT",{});
    A(159,REQ(oe12.TotExciseCustomsVAT,["UnionExciseDuty","ServiceTax","VATorSaleTax","CentralGoodServiceTax","StateGoodServiceTax","IntegratedGoodServiceTax","UnionTerrGoodServiceTax","OthDutyTaxCess"].reduce(function(a,k){return a+N(oe12[k]);},0)),
      "Schedule OI: item 12i must equal the sum of 12a to 12h.");
  }

  /* =============================================================
     SCHEDULE BP (244, 263, 275, 296)
     ============================================================= */
  if(I.ITR3ScheduleBP){var P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{});
    var h3=RG(P,"IncRecCredPLOthHeadDtls",{}),fc=RG(P,"ProfitFrmActCvrd",{}),prs=RG(P,"ProfitLossInclRefrdSec",{});
    var sum3=N(h3.Salary)+N(h3.HouseProperty)+N(h3.CapitalGains)+(N(h3.Dividend)+N(h3.OtherThanDividend))+N(h3.Us115BBF)+N(h3.Us115BBG)+N(h3["115BBH"]);
    var _4a=["ProfitLossUs44AD","ProfitLossUs44ADA","ProfitLossUs44AE","ProfitLossUs44B","ProfitLossUs44BB","ProfitLossUs44BBA","ProfitLossUs44BBC","ProfitLossUs44BBD","ProfitLossUs44DA"].reduce(function(a,k){return a+N(prs[k]);},0);
    var _4b=N(fc.ProfitFrmActCvrdUndrRule7)+N(fc.ProfitFrmActCvrdUndrRule7A)+N(fc.ProfitFrmActCvrdUndrRule7B1)+N(fc.ProfitFrmActCvrdUndrRule7B1A)+N(fc.ProfitFrmActCvrdUndrRule8);
    A(244,REQ(P.BalancePLOthThanSpecBus,N(P.ProfBfrTaxPL)-N(P.NetPLFromSpecBus)-N(P.NetPLFromSpecifiedBus)-sum3-_4a-_4b-N(RG(P,"IncCredPL.TotExempIncPL"))-N(P.IncCredPLNotChargable)),
      "Schedule BP: A6 must equal 1 - 2a - 2b - (3a to 3g) - 4a - 4b - 5d - 5A.");
    var dp=RG(P,"DeemedProfitBusUs",{});
    A(263,REQ(dp.TotDeemedProfitBusUs,["Section44AD","Section44ADA","Section44AE","Section44B","Section44BB","Section44BBA","Section44BBC","Section44BBD","Section44DA"].reduce(function(a,k){return a+N(dp[k]);},0)),
      "Schedule BP: A35viii must equal the sum of A35i to A35vii.");
    var E=RG(I,"ITR3ScheduleBP.BusSetoffCurrYr",{});
    A(275,REQ(E.TotLossSetOffOnBus,N(RG(E,"SpeculativeInc.BusLossSetoff"))+N(RG(E,"SpecifiedInc.BusLossSetoff"))),
      "Schedule BP: Eiv total loss set off must equal the speculative-business plus specified-business set-off amounts.");
    A(296,N(P.DeemedChrgblIncUndrRule7B1)>=0.25*N(fc.ProfitFrmActCvrdUndrRule7B1)-1,
      "Schedule BP: deemed income chargeable under Rule 7B(1) (37c) must be at least 25% of the amount at 4b(iii).");
  }

  /* =============================================================
     SCHEDULE DOA (318, 324)
     ============================================================= */
  if(I.ScheduleDOA){var doa=I.ScheduleDOA;
    var checkDD=function(dd,lbl){if(!dd||typeof dd!=="object")return;
      A(318,REQ(dd.TotalDepreciation,N(dd.DepreciationAtFullRate)+N(dd.DepreciationAtHalfRate)),
        "Schedule DOA "+lbl+": total depreciation (12) must equal full-rate (10) plus half-rate (11) depreciation.");
      A(324,N(dd.ProportionateAggDepreciation)<=N(dd.NetAggregateDepreciation)+1,
        "Schedule DOA "+lbl+": proportionate depreciation (15) cannot exceed net aggregate depreciation (14).");
    };
    Object.keys(doa).forEach(function(cls){var v=doa[cls];if(!v||typeof v!=="object")return;
      if(v.DepreciationDetail)checkDD(v.DepreciationDetail,cls);
      else Object.keys(v).forEach(function(rt){var rb=v[rt];if(rb&&typeof rb==="object"&&rb.DepreciationDetail)checkDD(rb.DepreciationDetail,cls+" "+rt);});
    });
  }

  /* =============================================================
     SCHEDULE CG (359, 365, 380, 386, 472)
     ============================================================= */
  if(I.ScheduleCGFor23){var cg=I.ScheduleCGFor23,ST=RG(cg,"ShortTermCapGainFor23",{}),LT=RG(cg,"LongTermCapGain23",{});
    RG(ST,"EquityMFonSTT",[]).forEach(function(r,idx){var dt=RG(r,"EquityMFonSTTDtls",{}),ds=RG(dt,"DeductSec48",{});
      A(359,N(dt.FullConsideration)>0||!N(ds.TotalDedn),
        "Schedule CG A3 row "+(idx+1)+": with a nil full value of consideration, deductions/expenses cannot be claimed.");
    });
    var b9=RG(LT,"SaleofAssetNADtls.SaleofAssetNA",{}),b9d=RG(b9,"DeductSec48",{});
    A(365,N(b9.FullConsideration)>0||!N(b9d.TotalDedn),
      "Schedule CG B9: with a nil full value of consideration, deductions/expenses cannot be claimed.");
    var a6=RG(ST,"SaleOnOtherAssets.DeductSec48",{});
    A(380,REQ(a6.TotalDedn,N(a6.AquisitCost)+N(a6.ImproveCost)+N(a6.ExpOnTrans)),
      "Schedule CG A6biv: total deductions must equal the sum of A6(bi + bii + biii).");
    RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]).forEach(function(r,idx){
      A(386,REQ(r.Balance,N(r.FullConsideration50C)-N(r.TotalDedn)),
        "Schedule CG B1 property "+(idx+1)+": B1c balance must equal B1(aiii - biv).");
      var ex=RG(r,"ExemptionOrDednUs54",{});
      A(472,REQ(ex.ExemptionGrandTotal,RSUM(RG(ex,"ExemptionOrDednUs54Dtls",[]),"ExemptionAmount")),
        "Schedule CG B1 property "+(idx+1)+": B1d total deduction must equal the sum of the deduction rows (B1di to B1dvii).");
    });
  }

  /* =============================================================
     SCHEDULE CYLA (565)
     ============================================================= */
  if(I.ScheduleCYLA&&I.ScheduleCGFor23){
    A(565,REQ(RG(I,"ScheduleCYLA.STCGAppRate.IncCYLA.IncOfCurYrUnderThatHead"),RG(I,"ScheduleCGFor23.CurrYrLosses.InStcgAppRate.CurrYrCapGain")),
      "Schedule CYLA: short-term capital gain taxable at applicable rates must equal item E 8iv of Schedule CG.");
  }

  /* =============================================================
     SCHEDULE CFL (622)
     ============================================================= */
  if(I.ScheduleCFL){var cf=I.ScheduleCFL;
    var yrs=["LossCFCurrentAssmntYear","LossCFCurrentAssmntYear2022","LossCFCurrentAssmntYear2023","LossCFCurrentAssmntYear2024","LossCFCurrentAssmntYear2025"];
    ["TotalHPPTILossCF","BusLossOthThanSpecLossCF","LossFrmSpecBusCF","LossFrmSpecifiedBusCF","TotalSTCGPTILossCF","TotalLTCGPTILossCF","OthSrcLossRaceHorseCF"].forEach(function(f){
      A(622,REQ(RG(cf,"TotalOfBFLossesEarlierYrs.LossSummaryDetail."+f),yrs.reduce(function(a,y){return a+N(RG(cf,y+".CarryFwdLossDetail."+f));},0)),
        "Schedule CFL: total brought-forward loss ("+f+") must equal the sum over the individual assessment years.");
    });
  }

  /* =============================================================
     SCHEDULE ICDS (630)
     ============================================================= */
  if(I.ScheduleICDS){var blks=["AccPolicyAmtDetl","InventoriesValueDetl","ConstContractsAmtDetl","RevenueRcgAmtDetl","TangibleFixedAssetDetl","ForeignExgRatesDetl","GovtGrantsDetl","SecuritiesDetl","BorrowingCostsDetl","ProvAssetsDetl"];
    var tot=RG(I,"ScheduleICDS.TotalNetAmtDetl",{});
    A(630,REQ(tot.IncreaseInProfit,blks.reduce(function(a,k){return a+N(RG(I,"ScheduleICDS."+k+".IncreaseInProfit"));},0))&&
          REQ(tot.DecreaseInProfit,blks.reduce(function(a,k){return a+N(RG(I,"ScheduleICDS."+k+".DecreaseInProfit"));},0)),
      "Schedule ICDS: item XI must equal the sum of items I to X.");
  }

  /* =============================================================
     SCHEDULE 80GGC / 80U / 80-IB / 80D (663, 679, 691, 714, 721)
     ============================================================= */
  if(I.Schedule80GGC){
    A(663,REQ(RG(I,"Schedule80GGC.TotalEligibleDonationAmt80GGC"),RSUM(RG(I,"Schedule80GGC.Schedule80GGCDetails",[]),"EligibleDonationAmt")),
      "Schedule 80GGC: total eligible amount of contribution (D) must equal the total of column vi.");
  }
  if(I.Schedule80U){
    A(679,REQ(RG(I,"Schedule80U.DeductionAmount"),RG(I,"ScheduleVIA.DeductUndChapVIA.Section80U")),
      "Schedule 80U: the deduction amount must equal the 80U value carried into Chapter VI-A (Part CA & D).");
  }
  if(I.Schedule80_IB){var ib=I.Schedule80_IB;
    var ibSum=["DeductMinOilUs80_IB_9_Und","DeductHousUs80_IB_10_Und","DeductFruitVegUs80_IB_11A_Und","DeductFoodGrainUs80_IB_11A_Und"].reduce(function(a,k){return a+RSUM(RG(ib,k+".Sch80DeductAmtDtls",[]),"DeductAmountSec80");},0);
    A(691,REQ(ib.TotSchedule80_IB,ibSum),
      "Schedule 80-IB: total deduction u/s 80-IB must equal the total of the individual sub-clause amounts (a to d).");
  }
  if(I.Schedule80D){var d80=RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{});
    A(714,!N(d80.ParentsSeniorCitizen)||RG(d80,"ParentsSeniorCitizenFlag")==="Y",
      "Schedule 80D: the parents senior-citizen amount (2b) can be claimed only if the senior-citizen option at 2 is 'Yes'.");
    if(d80.Sec80DSelfFamHIDtls){
      A(721,REQ(d80.HealthInsPremSlfFam,RSUM(RG(d80,"Sec80DSelfFamHIDtls.Sch80DInsDtls",[]),"HealthInsAmt")),
        "Schedule 80D: the health-insurance policy rows must add up to the health-insurance premium at 2a.");
    }
  }

  /* =============================================================
     SCHEDULE SI / AMT / AMTC (840, 867, 960)
     ============================================================= */
  if(I.ScheduleSI){
    A(867,REQ(N(ti.IncChargeableTaxSplRates),RG(I,"ScheduleSI.TotSplRateInc")),
      "Part B-TI: income chargeable at special rate (Sl.No.11) must equal the total of Sl.No.(i) of Schedule SI.");
  }
  if(I.ScheduleAMT){
    A(960,REQ(RG(CTL,"TaxPayableOnDeemedTI.TaxDeemedTISec115JC"),RG(I,"ScheduleAMT.TaxPayableUnderSec115JC")),
      "Part B-TTI: tax payable on deemed total income u/s 115JC must equal the tax ascertained in Schedule AMT.");
  }
  if(I.ScheduleAMTC){
    A(840,REQ(RG(I,"ScheduleAMTC.TaxSection115JC"),RG(CTL,"TaxPayableOnDeemedTI.TotalTax")),
      "Schedule AMTC: item 1 must equal item 1d of Part B-TTI (total tax on deemed total income).");
  }

  /* =============================================================
     SCHEDULE ESOP (909)
     ============================================================= */
  if(I.ScheduleESOP){var es=I.ScheduleESOP;
    Object.keys(es).forEach(function(k){if(k.slice(-5)!=="_Type")return;var y=es[k];if(!y||typeof y!=="object")return;
      A(909,RG(y,"ScheduleESOPEventDtls.CeasedEmployee")!=="Y"||REQ(y.TaxPayableCurrentAY,y.TaxDeferredBFEarlierAY),
        "Schedule ESOP "+(y.AssessmentYear||"")+": on cessation of employment (5 = Yes), tax payable in the current AY (7) must be the tax deferred brought forward (3).");
    });
  }

  /* =============================================================
     PART B-TI (926, 947)
     ============================================================= */
  if(I.ScheduleCGFor23){
    A(926,REQ(RG(ti,"CapGain.LongTerm.LongTermSplRateDTAA"),RG(I,"ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.CurrYrCapGain")),
      "Part B-TI: long-term income chargeable as per DTAA must equal item E 8vii of Schedule CG.");
  }
  A(947,!N(ti.IncChargeableTaxSplRates)||!!I.ScheduleSI,
    "Part B-TI: income chargeable to tax at a special rate is shown — Schedule SI must be filled with the details.");
});
