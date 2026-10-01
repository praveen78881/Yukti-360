/* =====================================================================
   ITR-3 · AY 2026-27 — Category-A validation rules, batch g0 (Phase 6).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires when cond (the "valid" assertion) is FALSE.
   Reads are guarded (RG / (X||{})); nothing throws. Regime is read from
   the built return (FilingStatus.OptOldRegimeCurrAY), mirroring 60_rules.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";                 /* new regime is default; old = 10-IEA opt-out */
  const emps=RG(I,"ScheduleS.Salaries",[])||[];
  const PENS=["PE","PESG","PEPS","PEO"];                  /* pensioner employer categories */
  const allPens=emps.length>0 && emps.every(e=>PENS.indexOf(e&&e.NatureOfEmployment)>=0);
  const dpmDep=o=>{const p=N(RG(o,"ProportionateAggDepreciation"));return p>0?p:N(RG(o,"NetAggregateDepreciation"));};

  /* ---------------- Part A General ---------------- */
  A(25,!!FS.ItrFilingDueDate,"Part A General: the applicable due date for filing the return must be selected.");
  A(45,FS.OptOldRegimeCurrAY!=="Y"||FS.IncFrmBusOrProf!=="Y"||(FS.F10IEAAckNoCurrAYOldTax&&FS.F10IEADateCurrAYOldTax),"Opting the old regime for the current AY (business filer) needs the Form 10-IEA acknowledgement number and date.");

  /* ---------------- Manufacturing Account ---------------- */
  if(I.ManufacturingAccount){const m=RG(I,"ManufacturingAccount.OpeningInventory",{});
    A(64,REQ(RG(m,"TotalDebtsManfctrngAcc"),N(RG(m,"OpngInvntryTotal"))+N(RG(m,"Purchases"))+N(RG(m,"DirectWages"))+N(RG(m,"DirectExpenses"))+N(RG(m,"TotalFactoryOverheads"))),"Part A-Manufacturing: total debits (1F) must equal 1Aiii + B + C + D + 1Evii.");
  }

  /* ---------------- Trading Account ---------------- */
  if(I.TradingAccount){const t=I.TradingAccount;
    A(70,REQ(t.SalesGrossReceiptsTotal,N(t.SaleOfGoods)+N(t.SaleOfServices)+N(t.OperatingRevenueTotal)),"Part A-Trading: 4A(iv) must equal 4A(i) + 4A(ii) + 4A(iiic).");
  }

  /* ---------------- Profit & Loss ---------------- */
  if(I.PARTA_PL){const pl=I.PARTA_PL;
    A(83,RG(pl,"DebitsToPL.EmployeeComp.AnyCompPaidToNonRes")!=="Yes"||N(RG(pl,"DebitsToPL.EmployeeComp.AmtPaidToNonRes"))>0,"Part A-P&L: if 22xiia is Yes then 22xiib (amount paid to non-residents) must be filled.");
    A(98,REQ(RG(pl,"PersumptiveInc44AD.GrsTrnOverOrReceipt"),N(RG(pl,"PersumptiveInc44AD.GrsTrnOverBank"))+N(RG(pl,"PersumptiveInc44AD.GrsTotalTrnOverInCash"))+N(RG(pl,"PersumptiveInc44AD.GrsTrnOverAnyOthMode"))),"Part A-P&L: 61(i) gross turnover/receipts must equal 61ia + 61ib + 61ic.");
    A(104,N(RG(pl,"PersumptiveInc44ADA.TotPersumptiveInc44ADA"))>=Math.floor(0.5*N(RG(pl,"PersumptiveInc44ADA.GrsReceipt")))-1,"Part A-P&L: 62ii cannot be less than 50% of 62i.");
    A(110,!N(RG(pl,"TotalPrsumptvIncUs44E"))||RG(pl,"NatOfBus44AE",[]).length>0,"Part A-P&L: nature of business must be filled when 44AE presumptive income (63ii) is greater than zero.");
    A(116,REQ(RG(pl,"TotalPrsumptvIncUs44E"),RSUM(RG(pl,"GoodsDtlsUs44AE",[]),"PresumptiveIncome")),"Part A-P&L: 63(ii) total 44AE presumptive income must equal the per-carriage breakup.");
    A(123,REQ(RG(pl,"NoBooksOfAccPL.NetProfitPrf"),N(RG(pl,"NoBooksOfAccPL.GrossProfitPrf"))-N(RG(pl,"NoBooksOfAccPL.ExpensesPrf"))),"Part A-P&L: 64(ii)(d) must equal 64(ii)(b) − 64(ii)(c).");
    A(129,REQ(RG(pl,"NetIncomeFrmSpecActivity"),N(RG(pl,"GrossProfit"))-N(RG(pl,"Expenditure"))),"Part A-P&L: 65iv (net income from speculative activity) must equal 65ii − 65iii.");
    A(136,REQ(RG(pl,"PersumptiveInc44ADA.GrsReceipt"),N(RG(pl,"PersumptiveInc44ADA.GrsTrnOverBank44ADA"))+N(RG(pl,"PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA"))+N(RG(pl,"PersumptiveInc44ADA.GrsTrnOverAnyOthMode44ADA"))),"Part A-P&L: 62(i) gross receipts u/s 44ADA must equal 62(i)a + 62(i)b + 62(i)c.");
    RG(pl,"NonResidentPLDetails",[]).forEach(r=>{if(r&&r.Section==="44BBD")A(142,N(r.NetProfit)>=Math.floor(0.25*N(r.GrossReceipt))-1,"Part A-P&L: for 44BBD, net profit (66ii) cannot be less than 25% of gross receipts/turnover.");});
  }

  /* ---------------- Schedule OI ---------------- */
  if(I.PARTA_OI){const oi=I.PARTA_OI;
    A(148,REQ(RG(oi,"DeemedProfUs33ABs"),N(RG(oi,"DeemedProfUs33AB"))+N(RG(oi,"DeemedProfUs33ABA"))),"Schedule OI: 13 must equal 13i + 13ii.");
    A(154,REQ(RG(oi,"AmtDisallUs37.TotAmtDisallUs37"),["CapitalNatureExp","PersonalExp","BusOrProfessnExp","PoliticPartyExp","LawVoilatPenalExp","OthPenalFineExp","OffenceExp","ContigentLiability","OthAmtNotAllowUs37"].reduce((a,k)=>a+N(RG(oi,"AmtDisallUs37."+k)),0)),"Schedule OI: 7j must equal the sum of 7a to 7i.");
  }

  /* ---------------- Schedule Salary ---------------- */
  if(I.ScheduleS){const sc=I.ScheduleS;const H=RG(sc,"Section10_13A",null);const s17_1=RSUM(emps,e=>RG(e,"Salarys.Salary"));
    if(H&&typeof H==="object")A(208,N(H.DtlsSalUsSec171)<=s17_1+1&&N(H.ActlHRARecv)<=s17_1+1,"Schedule Salary: salary+DA in the 10(13A) table and the actual HRA received cannot exceed salary as per section 17(1).");
  }

  /* ---------------- Schedule BP ---------------- */
  if(I.ITR3ScheduleBP){const P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{});
    A(245,REQ(P.TotExpDebPL,["Salary","HouseProperty","CapitalGains","OtherSources","Us115BBF","Us115BBG","115BBH"].reduce((a,k)=>a+N(RG(P,"ExpDebToPLOthHeadDtls."+k)),0)+N(P.ExpDebToPLExemptInc)+N(P.ExpDebToPLExemptIncDisAllwUs14A)),"Schedule BP: A9 must equal 7a…7g + 8a + 8b.");
    A(265,REQ(P.NetPLBusOthThanSpec7A7B7C,N(P.ChrgblIncUndrRule7)+N(P.DeemedChrgblIncUndrRule7A)+N(P.DeemedChrgblIncUndrRule7B1)+N(P.DeemedChrgblIncUndrRule7B1A)+N(P.DeemedChrgblIncUndrRule8)+N(P.IncomeOtherThanRule)),"Schedule BP: A37 must equal 37a + 37b + 37c + 37d + 37e + 37f.");
    A(276,REQ(RG(I,"ITR3ScheduleBP.BusSetoffCurrYr.LossRemainSetOffOnBus"),Math.max(0,N(RG(I,"ITR3ScheduleBP.BusSetoffCurrYr.LossSetOffOnBusLoss"))-N(RG(I,"ITR3ScheduleBP.BusSetoffCurrYr.TotLossSetOffOnBus")))),"Schedule BP: E(v) loss remaining after set off must equal E(i) − E(iv).");
    A(282,N(RG(P,"IncRecCredPLOthHeadDtls.Salary"))<=N(RG(I,"ScheduleS.TotalGrossSalary"))+1,"Schedule BP: A3a (income relatable to salary) cannot exceed the income offered in Schedule Salary.");
    A(297,N(P.DeemedChrgblIncUndrRule7B1A)>=Math.round(0.4*N(RG(P,"ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7B1")))-1,"Schedule BP: 37d (deemed income under Rule 7B(1A)) must be at least 40% of 4b(iv).");
    A(911,!I.ScheduleIF||N(RG(P,"IncCredPL.FirmShareInc"))<=N(RG(I,"ScheduleIF.TotalProfitShareAmt"))+1,"Schedule BP: A5a (share of income from firm) cannot exceed the profit-share column of Schedule IF.");
  }

  /* ---------------- Depreciation (DPM / DOA / DEP / DCG) ---------------- */
  if(I.ScheduleDPM){[["Rate15",15],["Rate30",30],["Rate40",40],["Rate45",45]].forEach(function(x){
    const blk=x[0],rate=x[1];const o=RG(I,"ScheduleDPM.PlantMachinery."+blk+".DepreciationDetail",null);
    if(!o||typeof o!=="object")return;
    A(304,REQ(o.FullRateDeprAmt,Math.max(0,N(o.Total)+N(o.AdditionsGrThan180Days)-N(o.RealizationTotalPeriod))),"Schedule DPM "+blk+": Sl.6 (amount at full rate) must equal 3 + 4 − 5 (nil if negative).");
    A(312,REQ(o.DepreciationAtHalfRate,Math.round(N(o.HalfRateDeprAmt)*rate/200)),"Schedule DPM "+blk+": depreciation at half rate (Sl.11) must be the block half-rate applied to Sl.9.");
  });}
  if(I.ScheduleDOA){Object.keys(I.ScheduleDOA).forEach(function(cat){const co=I.ScheduleDOA[cat];if(!co||typeof co!=="object")return;
    Object.keys(co).forEach(function(rk){const o=co[rk]&&co[rk].DepreciationDetail;if(!o||typeof o!=="object")return;
      A(319,REQ(o.NetAggregateDepreciation,Math.max(0,N(o.TotalDepreciation)-N(o.DepDisAllowUs38_2))),"Schedule DOA "+cat+" "+rk+": Sl.14 must equal 12 − 13.");
    });});}
  if(I.ScheduleDEP&&I.ScheduleDPM)
    A(328,REQ(RG(I,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot15Percent"),dpmDep(RG(I,"ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail",{}))),"Schedule DEP: the plant & machinery @15% block must equal Sl.17i/18i of Schedule DPM.");
  if(I.ScheduleDEP&&I.ScheduleDOA){const ff=RG(I,"ScheduleDOA.FurnitureFittings",{});let furn=0;
    Object.keys(ff).forEach(function(rk){const o=ff[rk]&&ff[rk].DepreciationDetail;if(o&&typeof o==="object")furn+=dpmDep(o);});
    A(335,REQ(RG(I,"ScheduleDEP.SummaryFromDeprSch.FurnitureSummary"),furn),"Schedule DEP: furniture & fittings must equal Sl.14v/15v of Schedule DOA.");}
  if(I.ScheduleDCG&&I.ScheduleDPM)
    A(344,REQ(RG(I,"ScheduleDCG.SummaryFromDeprSchCG.PlantMachinerySummaryCG.DeprBlockTot45Percent"),RG(I,"ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.CapGainUs50")),"Schedule DCG: 1d must equal Sl.20iv of Schedule DPM.");

  /* ---------------- Schedule CG ---------------- */
  if(I.ScheduleCGFor23){const cg=I.ScheduleCGFor23,ST=RG(cg,"ShortTermCapGainFor23",{}),LT=RG(cg,"LongTermCapGain23",{});
    const sl=RG(ST,"SlumpSaleInStcg",{});
    A(369,REQ(sl.CapgainonAssets,N(sl.FullConsideration)-N(sl.NetWorthOfDivision)),"Schedule CG: A2c (STCG from slump sale) must equal 2aiii − 2b.");
    const ltLand=RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]);
    ltLand.forEach(function(d,i){const L="B1 property "+(i+1)+": ";
      A(387,REQ(d.CapgainonAssets,N(d.Balance)-N(RG(d,"ExemptionOrDednUs54.ExemptionGrandTotal"))),L+"B1e must equal 1c − 1d.");
      A(435,!(N(d.FullConsideration50C)||N(d.AquisitCost))||(!!d.DateofSale&&!!d.DateofPurchase),L+"date of sale and date of purchase are mandatory when the consideration/cost is entered.");
    });
    A(394,REQ(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets"),N(RG(LT,"SaleOfEquityShareUs112A.BalanceCG"))-N(RG(LT,"SaleOfEquityShareUs112A.DeductionUs54F"))),"Schedule CG: B4c must equal 4a − 4b.");
    const b9=RG(LT,"SaleofAssetNADtls.SaleofAssetNA.DeductSec48",{});
    A(406,REQ(b9.TotalDedn,N(b9.AquisitCost)+N(b9.ImproveCost)+N(b9.ExpOnTrans)),"Schedule CG: B9biv total must equal bi + bii + biii.");
    A(466,!ltLand.length||REQ(RG(LT,"SaleofLandBuild.TotalLTCGImmblPrprty"),RSUM(ltLand,"CapgainonAssets")),"Schedule CG: B1g must equal the sum of the capital gains on each land/building property.");
  }

  /* ---------------- Set-off & carry-forward (CYLA / CFL) ---------------- */
  if(I.ScheduleCYLA){const cy=I.ScheduleCYLA;
    if(I.ScheduleOS)A(553,REQ(RG(cy,"TotalCurYr.TotOthSrcLossNoRaceHorse"),Math.max(0,-N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),"Schedule CYLA: the other-sources loss must equal the loss in Schedule OS.");
    if(I.ScheduleCGFor23)A(566,REQ(RG(cy,"STCGDTAARate.IncCYLA.IncOfCurYrUnderThatHead"),RG(I,"ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.CurrYrCapGain")),"Schedule CYLA: STCG taxable at special DTAA rate must equal Sl.8 of item E of Schedule CG.");
  }
  if(I.ScheduleCFL){const cf=I.ScheduleCFL;
    if(I.ScheduleCYLA)A(617,REQ(RG(cf,"CurrentAYloss.LossSummaryDetail.TotalHPPTILossCF"),RG(I,"ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff")),"Schedule CFL: current-year house-property loss must equal the HP loss remaining after set-off in CYLA.");
    if(I.ITR3ScheduleBP)A(238,REQ(RG(cf,"CurrentAYloss.LossSummaryDetail.LossFrmSpecBusCF"),Math.max(0,-N(RG(I,"ITR3ScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus")))),"Schedule CFL: current-year speculative loss must equal B42 of Schedule BP.");
  }

  /* ---------------- Deductions (VI-A and sub-schedules) ---------------- */
  const VD=RG(I,"ScheduleVIA.DeductUndChapVIA",{});
  A(624,newR||RG(I,"ITR3ScheduleUD.ScheduleUD",[]).every(r=>!N(r&&r.AdjustAccTax115BACAmt)),"Schedule UD: the amount adjusted on opting for taxation u/s 115BAC (3a) cannot be more than zero in the old regime.");
  A(759,!N(VD.Section80G)||(!!I.Schedule80G&&FS.OptOldRegimeCurrAY==="Y"),"Deduction u/s 80G needs the details in Schedule 80G and is available only in the old regime.");
  A(777,!N(VD.Section80CCDEmployer)||!allPens,"Deduction u/s 80CCD(2) cannot be claimed when every employer category is a pensioner category.");
  if(I.Schedule80G)A(641,REQ(RG(I,"Schedule80G.TotalDonationsUs80G"),N(RG(I,"Schedule80G.TotalDonationsUs80GCash"))+N(RG(I,"Schedule80G.TotalDonationsUs80GOtherMode"))),"Schedule 80G: total donation (C) must equal donation in cash plus donation in other mode.");
  if(I.Schedule80GGC)A(667,REQ(RG(I,"Schedule80GGC.TotalEligibleDonationAmt80GGC"),Math.min(RSUM(RG(I,"Schedule80GGC.Schedule80GGCDetails",[]),"EligibleDonationAmt"),N(RG(I,"PartB-TI.GrossTotalIncome")))),"Schedule 80GGC: eligible amount (D) must equal the sum of individual amounts restricted to GTI.");
  if(I.Schedule80U)A(680,!(N(I.Schedule80U.DeductionAmount)||I.Schedule80U.UDIDNum||I.Schedule80U.Form10IAAckNum)||(I.Schedule80U.NatureOfDisability&&I.Schedule80U.TypeOfDisability),"Schedule 80U: nature and type of disability (i and ii) are mandatory when any row is filled.");
  if(I.Schedule80D){const sd=RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{});
    A(722,REQ(RG(sd,"Sec80DSelfFamHIDtls.TotalPayments"),RSUM(RG(sd,"Sec80DSelfFamHIDtls.Sch80DInsDtls",[]),"HealthInsAmt"))&&REQ(RG(sd,"Sec80DParentsHIDtls.TotalPayments"),RSUM(RG(sd,"Sec80DParentsHIDtls.Sch80DInsDtls",[]),"HealthInsAmt")),"Schedule 80D: the health-insurance policy rows must sum to the premium entered under Health insurance.");
  }
  if(I.Schedule80EE)A(734,REQ(RG(I,"Schedule80EE.TotalInterest80EE"),RSUM(RG(I,"Schedule80EE.Schedule80EEDtls",[]),"Interest80EE")),"Schedule 80EE: the individual interest rows must sum to the total interest u/s 80EE.");

  /* ---------------- Part B, AMTC, TPSA, SI ---------------- */
  if(I.ScheduleAMTC&&I.PartB_TTI)A(841,REQ(RG(I,"ScheduleAMTC.TaxOthProvisions"),RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability")),"Schedule AMTC: Sl.2 must equal Sl.2i of Part B-TTI.");
  A(885,RG(I,"PARTA_OI.ScheduleTPSAFlg")!=="Y"||!!I.ScheduleTPSA,"Schedule OI: option under section 92CE(2A) is Yes — Schedule TPSA must be filled.");
  if(I.PartB_TTI)A(961,REQ(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.TDS"),N(RG(I,"ScheduleTDS1.TotalTDSonSalaries"))+N(RG(I,"ScheduleTDS2.TotalTDSonOthThanSals"))+N(RG(I,"ScheduleTDS3.TotalTDS3OnOthThanSal")))&&REQ(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.TCS"),RG(I,"ScheduleTCS.TotalSchTCS"))&&REQ(N(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax"))+N(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax")),RG(I,"ScheduleIT.TotalTaxPayments")),"Part B-TTI: the tax payments claimed must equal the claims in Schedule TDS/TCS/IT.");
});
