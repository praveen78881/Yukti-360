/* =====================================================================
   ITR-3 · AY 2026-27 — validation rules, batch g2 (Phase 6).
   Encoded from rules.json Category-A serials, one A(serial, assertion,
   message) per checkable rule. The assertion is what holds for a VALID
   return, so A() fires only when it is FALSE. Reads are guarded (RG /
   N / (X||{})) so nothing throws. Recomputes its own locals from I/S_
   (the 60_rules locals are not in this closure's scope).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const PI=RG(I,"PartA_GEN1.PersonalInfo",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2.AuditInfo",{})||{};
  const res=FS.ResidentialStatus||"RES";
  const resAny=res==="RES"||res==="RNOR";
  const ind=PI.Status==="I", huf=PI.Status==="H";
  const age=(S_&&S_.C&&S_.C.tax&&N(S_.C.tax.age))||0;

  /* =============================================================
     PART A — GENERAL  (filing status / regime opt-out)
     ============================================================= */
  /* A27 — 30-Nov due date needs Schedule IF / 5A / audit details */
  A(27,FS.ItrFilingDueDate!=="2026-11-30"||!!(I.ScheduleIF||I.Schedule5A2014||(RG(G2,"AuditDetails",[])||[]).length),
    "Due date 30 November is selected — fill Schedule IF or Schedule 5A or the audit details in Part A General.");
  /* A41 — 10IEA earlier-AY 'Yes' needs the 10IEA earlier-year details */
  A(41,FS.Form10IEAEarlierAYOldRegime!=="Y"||!!(FS.Form10IEAAssYear&&FS.Form10IEAEarlierAYAckOldRegime),
    "Form 10-IEA filed in an earlier year is 'Yes' — the assessment year and acknowledgement number of that Form 10-IEA must be given.");

  /* =============================================================
     PART A — BALANCE SHEET
     ============================================================= */
  if(I.PARTA_BS){const adv=RG(I,"PARTA_BS.FundSrc.Advances",{});
    A(60,REQ(adv.TotalAdvances,N(adv.FromPrsn)+N(adv.FromOthers)),"Part A-BS: total of advances must equal the sum of amounts from persons u/s 40A(2)(b) and from others.");
  }

  /* =============================================================
     MANUFACTURING / TRADING ACCOUNT
     ============================================================= */
  if(I.ManufacturingAccount){const m=I.ManufacturingAccount;
    A(66,REQ(m.CostOfGoodsPrdcd,N(RG(m,"OpeningInventory.TotalDebtsManfctrngAcc"))-N(RG(m,"ClosingStock.ClsngStckTotal"))),
      "Manufacturing Account: cost of goods produced (Sl.No.3) must equal total debits (1F) minus closing stock (2).");
  }
  if(I.TradingAccount){const t=I.TradingAccount;
    A(72,REQ(t.TotRevenueFrmOperations,N(t.SalesGrossReceiptsTotal)+N(t.GrossRcptFromProfession)+N(RG(t,"ExciseCustomsVAT.TotExciseCustomsVAT"))),
      "Trading Account: total revenue from operations (4D) must equal 4A(iv) + 4B + 4C(ix).");
    A(78,N(t.IncomeFutureTrd)<=N(t.TurnoverFutureTrd),
      "Trading Account: income from Futures & Options (12d) cannot exceed the F&O turnover (12c).");
  }

  /* =============================================================
     PART A — P&L  (other expenses, presumptive, no-account case)
     ============================================================= */
  if(I.PARTA_PL){const pl=I.PARTA_PL,ad=RG(pl,"PersumptiveInc44AD",{}),nb=RG(pl,"NoBooksOfAccPL",{});
    A(90,REQ(RG(pl,"DebitsToPL.OtherExpenses"),RSUM(RG(pl,"DebitsToPL.OtherExpensesDtls",[]),"Amount")),
      "Part A-P&L: other expenses (46) must equal the sum of the individual expense rows.");
    A(100,N(ad.PersumptiveInc44AD6Per)+1>=0.06*N(ad.GrsTrnOverBank),
      "Part A-P&L: presumptive income at 61(ii)(A) cannot be less than 6% of 61(i)(A).");
    A(106,!(N(ad.GrsTrnOverOrReceipt)>0||N(ad.TotPersumptiveInc44AD)>0)||(RG(pl,"NatOfBus44AD",[])||[]).length>0,
      "Part A-P&L: nature of business must be filled when presumptive turnover or income u/s 44AD (61) is greater than zero.");
    A(125,N(nb.GrossProfitPrf)<=N(nb.GrossReceiptPrf),
      "Part A-P&L: profession gross profit (64(ii)(b)) cannot exceed profession gross receipts (64(ii)(a)).");
    A(138,N(ad.GrsTrnOverOrReceipt)<=30000000||G2.LiableSec44ABflg==="Y",
      "Part A-P&L: gross receipts u/s 44AD exceed Rs.3 crore — a tax audit u/s 44AB is mandatory.");
    /* A118 — 44AE goods carriage: for tonnage <= 12MT the presumptive income
       cannot be below the statutory Rs.7,500/month minimum */
    (RG(pl,"GoodsDtlsUs44AE",[])||[]).forEach((r,i)=>{
      A(118,N(r.TonnageCapacity)>12||N(r.PresumptiveIncome)+1>=7500*N(r.HoldingPeriod),
        "Part A-P&L: for a goods carriage of 12MT or less (44AE), the presumptive income (column 5) cannot be less than Rs.7,500 per month (column 4).");
    });
    /* A132 — registration numbers of goods carriages must be unique */
    const regs=(RG(pl,"GoodsDtlsUs44AE",[])||[]).map(r=>String(r.RegNumberGoodsCarriage||"")).filter(Boolean);
    A(132,new Set(regs).size===regs.length,"Part A-P&L: the registration number of a goods carriage cannot be repeated in the 44AE table.");
    /* A144 — 44BB non-resident: net profit >= 10% of gross receipts */
    (RG(pl,"NonResidentPLDetails",[])||[]).forEach((r,i)=>{
      A(144,r.Section!=="44BB"||N(r.NetProfit)+1>=0.10*N(r.GrossReceipt),
        "Part A-P&L: under section 44BB the net profit (66(ii)) cannot be less than 10% of gross receipts/turnover.");
    });
  }

  /* =============================================================
     PART A — OI  (ICDS deviation / section 40A total)
     ============================================================= */
  if(I.PARTA_OI){const oi=I.PARTA_OI;
    if(I.ScheduleICDS)A(150,REQ(oi.ProfDeviatDueAcctMeth,RG(I,"ScheduleICDS.TotalNetAmtDetl.IncreaseInProfit")),
      "Part A-OI: increase in profit due to ICDS deviation (3a) must equal the total increase in Schedule ICDS.");
    const d=RG(oi,"AmtDisallUs40A",{});
    A(156,REQ(d.TotAmtDisallUs40A,N(d.AmtPaidUs40A2b)+N(d.AmtGT20kCash)+N(d.ProvPmtGrat)+N(d.ContToSetupTrust)+N(d.OthDisallow)),
      "Part A-OI: total disallowable u/s 40A (9f) must equal the sum of 9a to 9e.");
  }

  /* =============================================================
     SCHEDULE BP  (arithmetic + cross-links to P&L / OI / HP)
     ============================================================= */
  if(I.ITR3ScheduleBP){const P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{});
    /* A249 — A26 = sum of items 14..25 */
    A(249,REQ(P.TotAfterAddToPLDeprOthSpecInc,
      N(P.AmtDebPLDisallowUs36)+N(P.AmtDebPLDisallowUs37)+N(P.AmtDebPLDisallowUs40)+N(P.AmtDebPLDisallowUs40A)
      +N(P.AmtDebPLDisallowUs43B)+N(P.InterestDisAllowUs23SMEAct)+N(P.DeemIncUs41)+N(P.DeemIncUs3380HHD80IA)
      +N(P.DeemIncUs43CA)+N(P.OthItemDisallowUs28To44DA)+N(P.AnyOthIncNotInclInExpDisallowPL)+N(P.IncProfDecLossAccICDSAdj)),
      "Schedule BP: A26 must equal the sum of items A14 to A25.");
    /* A278 — 32(1)(i) only for power-sector business (code 05001 / 06008) */
    A(278,!N(RG(P,"DepreciationAllowITAct32.DepreciationAllowUs32_1_i"))||
      (RG(I,"PartA_GEN2.NatOfBus.NatureOfBusiness",[])||[]).some(b=>b.Code==="05001"||b.Code==="06008"),
      "Schedule BP: depreciation u/s 32(1)(i) can be claimed only where a power-sector business (code 05001 or 06008) is carried on.");
    if(I.PARTA_PL){
      A(112,REQ(RG(P,"DeemedProfitBusUs.Section44AD"),RG(I,"PARTA_PL.PersumptiveInc44AD.TotPersumptiveInc44AD")),
        "Schedule BP: 35(i) (section 44AD) must equal the presumptive income u/s 44AD in the P&L (61ii).");
      A(293,REQ(RG(P,"DeemedProfitBusUs.Section44AE"),RG(I,"PARTA_PL.TotalPrsumptvIncUs44E")),
        "Schedule BP: 35(iii) (section 44AE) must equal the total presumptive income u/s 44AE in the P&L (63ii).");
    }
    if(I.PARTA_OI)A(259,REQ(P.AmtDisallUs40NowAllow,RG(I,"PARTA_OI.AmtDisallUs40.AmtDisallUs40PyNowAll")),
      "Schedule BP: A29 (amount disallowed u/s 40 in an earlier year, now allowable) must equal 8B of Part A-OI.");
    if(I.ScheduleHP)A(241,N(RG(P,"IncRecCredPLOthHeadDtls.HouseProperty"))<=Math.max(0,N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP"))),
      "Schedule BP: the house-property amount reduced at A3b cannot exceed the income offered under Schedule HP.");
    A(299,REQ(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.NetPLFrmSpecifiedBus"),P.NetPLFromSpecifiedBus),
      "Schedule BP: C43 must equal item 2b (net profit from specified business as per the P&L account).");
  }

  /* =============================================================
     SCHEDULE DPM / DOA / DEP / ESR  (per-block arithmetic)
     ============================================================= */
  function dval(b){b=b||{};const d=RG(b,"DepreciationDetail",{})||{};const pro=N(d.ProportionateAggDepreciation);return pro>0?pro:N(d.NetAggregateDepreciation);}
  if(I.ScheduleDPM){["Rate15","Rate30","Rate40","Rate45"].forEach(blk=>{
    const d=RG(I,"ScheduleDPM.PlantMachinery."+blk+".DepreciationDetail",{});if(!d||!Object.keys(d).length)return;
    const L="Schedule DPM "+blk+": ";
    A(306,REQ(d.TotalDepreciation,N(d.DepreciationAtFullRate)+N(d.DepreciationAtHalfRate)+N(d.AddlnDeprOnGT180DayAdditions)+N(d.AddlnDeprOnLessThan180DayAdditions)+N(d.AddlnDeprOnAssetLessThan180Days)),
      L+"Sl.No.15 must equal the sum of Sl.No.10 + 11 + 12 + 13 + 14.");
    A(315,N(d.ProportionateAggDepreciation)<=N(d.NetAggregateDepreciation),
      L+"proportionate depreciation (18) must be out of the net aggregate depreciation (17).");
  });}
  if(I.ScheduleDOA){["Building.Rate5","Building.Rate10","Building.Rate40","FurnitureFittings.Rate10","IntangibleAssets.Rate25","Ships.Rate20"].forEach(blk=>{
    const d=RG(I,"ScheduleDOA."+blk+".DepreciationDetail",{});if(!d||!Object.keys(d).length)return;
    A(321,REQ(d.WDVLastDay,Math.max(0,N(d.FullRateDeprAmt)+N(d.HalfRateDeprAmt)-N(d.TotalDepreciation))),
      "Schedule DOA "+blk+": Sl.No.18 (WDV at year-end) must equal Sl.No.(6 + 9 - 12).");
  });}
  if(I.ScheduleDEP){const dep=RG(I,"ScheduleDEP.SummaryFromDeprSch",{});
    if(I.ScheduleDPM)A(331,REQ(RG(dep,"PlantMachinerySummary.DeprBlockTot45Percent"),dval(RG(I,"ScheduleDPM.PlantMachinery.Rate45"))),
      "Schedule DEP: the 45% plant & machinery block must equal Sl.No.17iv/18iv (as applicable) of Schedule DPM.");
    if(I.ScheduleDOA)A(337,REQ(N(dep.ShipsSummary),dval(RG(I,"ScheduleDOA.Ships.Rate20"))),
      "Schedule DEP: the ships block must equal Sl.No.14vii/15vii (as applicable) of Schedule DOA.");
  }
  if(I.ScheduleESR){const secs=["Section35_1_i","Section35_1_ii","Section35_1_iia","Section35_1_iii","Section35_1_iv","Section35_2AA","Section35_2AB","Section35_CCC","Section35_CCD"];
    A(353,REQ(RG(I,"ScheduleESR.DeductionUs35.TotUs35.DeductUs35.AmtUs35Allowable"),
      secs.reduce((a,s)=>a+N(RG(I,"ScheduleESR.DeductionUs35."+s+".DeductUs35.AmtUs35Allowable")),0)),
      "Schedule ESR: the total deduction u/s 35 (x) must equal the sum of items i to ix.");
  }

  /* =============================================================
     SCHEDULE CG  (conditional / totals / set-off caps)
     ============================================================= */
  if(I.ScheduleCGFor23){const cg=I.ScheduleCGFor23,LT=cg.LongTermCapGain23||{},E=cg.CurrYrLosses||{};
    (RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[])||[]).forEach((d,i)=>{
      A(362,N(d.FullConsideration50C)>0||!N(d.TotalDedn),
        "Schedule CG: with a nil full value of consideration at B1a(iii), the expenses/deductions at B1b(iv) cannot be claimed (LTCG land/building "+(i+1)+").");
    });
    /* A460 — total set-off of the 30% STCL cannot exceed the 30% loss available */
    A(460,N(RG(E,"TotLossSetOff.StclSetoff30Per"))<=N(RG(E,"InLossSetOff.StclSetoff30Per"))+1,
      "Schedule CG, Table E: the set-off claimed of the 30% short-term capital loss cannot exceed the 30% loss available for set-off.");
  }
  if(I.Schedule112A){const S12=I.Schedule112A,rows=RG(S12,"Schedule112ADtls",[])||[];
    A(491,REQ(S12.SaleValue112A,RSUM(rows,"TotSaleValue"))
      &&REQ(S12.CostAcqWithoutIndx112A,RSUM(rows,"CostAcqWithoutIndx"))
      &&REQ(S12.AcquisitionCost112A,RSUM(rows,"AcquisitionCost"))
      &&REQ(S12.LTCGBeforelowerB1B2112A,RSUM(rows,"LTCGBeforelower6and11"))
      &&REQ(S12.FairMktValueCapAst112A,RSUM(rows,"TotFairMktValueCapAst"))
      &&REQ(S12.ExpExclCnctTransfer112A,RSUM(rows,"ExpExclCnctTransfer"))
      &&REQ(S12.Deductions112A,RSUM(rows,"TotalDeductions"))
      &&REQ(S12.Balance112A,RSUM(rows,"Balance")),
      "Schedule 112A: the totals of columns 6, 7, 8, 9, 11, 12, 13 and 14 must equal the sum of the individual row amounts.");
  }

  /* =============================================================
     SCHEDULE CYLA  (cross-link to Schedule CG Table E)
     ============================================================= */
  if(I.ScheduleCYLA&&I.ScheduleCGFor23&&RG(I,"ScheduleCYLA.STCG20Per")){
    A(582,REQ(RG(I,"ScheduleCYLA.STCG20Per.IncCYLA.IncOfCurYrUnderThatHead"),RG(I,"ScheduleCGFor23.CurrYrLosses.InStcg20Per.CurrYrCapGain")),
      "Schedule CYLA: short-term capital gain @20% must equal Sl.No.8ii of item E of Schedule CG.");
  }

  /* =============================================================
     SCHEDULE VIA + 80D  (deductions)
     ============================================================= */
  if(I.ScheduleVIA){const Dn=RG(I,"ScheduleVIA.DeductUndChapVIA",{});
    A(764,!N(Dn.Section80TTB)||(resAny&&ind&&age>=60),"80TTB is allowed only to a resident senior/super-senior citizen.");
    A(827,!N(Dn.Section80CCC)||(function(){const r=RG(I,"ScheduleVIA.UsrDeductUndChapVIA.PensionContribution80CCC",[])||[];return r.length>0&&r.every(x=>x.TypeofIdentifier&&x.NameofIdentifier&&N(x.Amount));})(),
      "80CCC is claimed — at least one row with the type of identifier, the identifier number/name and the amount is mandatory.");
  }
  if(I.Schedule80D){const d=RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{});
    A(711,!N(d.SelfAndFamily)||d.SeniorCitizenFlag!=="Y","80D: the 'Self and Family' amount (1a) can be claimed only where the senior-citizen question at Sl.No.1 is answered 'No'.");
    A(718,!N(d.EligibleAmountOfDedn)||(!!d.SeniorCitizenFlag&&!!d.ParentsSeniorCitizenFlag),"80D: the questions at Sl.No.1 and Sl.No.2 must be answered to claim the deduction.");
    const ins=RG(d,"Sec80DSelfFamHIDtls.Sch80DInsDtls",[])||[];
    A(724,!N(d.HealthInsPremSlfFam)||(ins.length>0&&ins.every(r=>r.InsurerName&&r.PolicyNo)),
      "80D: the insurer's name and policy number must be provided for the health-insurance premium at Sl.No.1b(i).");
  }

  /* =============================================================
     SCHEDULE SALARY  (16(ii) entertainment allowance cap)
     ============================================================= */
  if(I.ScheduleS){
    A(173,N(I.ScheduleS.EntertainmntalwncUs16ii)<=5000,"Schedule Salary: entertainment allowance u/s 16(ii) is limited to Rs.5,000 (or one-fifth of basic salary, whichever is less).");
  }

  /* =============================================================
     SCHEDULE FSI  (foreign salary vs Schedule Salary)
     ============================================================= */
  if(I.ScheduleFSI&&I.ScheduleS){const gross=N(RG(I,"ScheduleS.TotalGrossSalary"));
    (RG(I,"ScheduleFSI.ScheduleFSIDtls",[])||[]).forEach((b,i)=>{
      A(890,!N(RG(b,"IncFromSal.TaxReliefinInd"))||gross>=N(RG(b,"IncFromSal.IncFrmOutsideInd")),
        "Schedule FSI country "+(i+1)+": where tax relief is claimed against salary, the gross salary in Schedule Salary cannot be less than the foreign salary shown.");
    });
  }

  /* =============================================================
     PART B-TI  (cross-links)
     ============================================================= */
  {const ti=RG(I,"PartB-TI",{})||{};
    if(I.ScheduleCGFor23)A(923,REQ(RG(ti,"CapGain.ShortTerm.ShortTerm30Per"),RG(I,"ScheduleCGFor23.CurrYrLosses.InStcg30Per.CurrYrCapGain")),
      "Part B-TI: short-term capital gain chargeable @30% must equal Sl.No.8iii of item E of Schedule CG.");
    A(938,!N(RG(ti,"DeductionsUndSchVIADtl.PartCchapterVIA"))||(!!I.ScheduleVIA&&N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA"))>0),
      "Part B-TI: a deduction at Sl.No.12(b) requires Part C of Chapter VI-A to be filled.");
  }

  /* =============================================================
     SCHEDULE EI  (agricultural income under rules 7/7A/7B/8)
     ============================================================= */
  if(I.ScheduleEI&&I.ITR3ScheduleBP){
    A(995,REQ(RG(I,"ScheduleEI.AgriIncRule7and8"),RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.BalIncDeemedFrmAgri")),
      "Schedule EI: agricultural income relating to rules 7, 7A, 7B(1), 7B(1A) and 8 (2iv) must equal Sl.No.38 of Schedule BP.");
  }
});
