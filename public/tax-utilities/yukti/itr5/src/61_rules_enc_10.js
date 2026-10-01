/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 10.
   Serials 451–500 (books/ITR-5/rules.json), covering Schedule 112A,
   Schedule 115AD(1)(iii) proviso, Schedule VDA and Schedule OS.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / (X||{})); nothing throws; every block guards
   to a no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_cg.js (scripBlock / ScheduleVDA) and
   70_sec_os.js (expOs), cross-checked against the books.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const FYEND="2026-03-31";                                 /* 31 Mar of PY 2025-26 (AY 2026-27) */
  const isISO=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""));

  /* ===================================================================
     SCHEDULE 112A  (451–458)  and  SCHEDULE 115AD(1)(iii) proviso (459–466)
     The two tables share identical column math (engScrip / scripBlock).
     Columns: 4 NumSharesUnits · 5 SalePricePerShareUnit · 6 TotSaleValue ·
     7 CostAcqWithoutIndx · 8 AcquisitionCost · 9 LTCGBeforelower6and11 ·
     10 FairMktValuePerShareunit · 11 TotFairMktValueCapAst ·
     12 ExpExclCnctTransfer · 13 TotalDeductions · 14 Balance.
     ShareOnOrBefore: "BE" (on/before 31-01-2018) | "AE" (after).
     =================================================================== */
  function scrip(blk,rowsKey,suf,S){
    const rows=arr(RG(blk,rowsKey,[]));
    /* ---- per-row column arithmetic ---- */
    rows.forEach(function(r,i){r=r||{};const L=" scrip "+(i+1)+": ";const pre=String(r.ShareOnOrBefore||"")==="BE";
      const c4=N(r.NumSharesUnits),c5=N(r.SalePricePerShareUnit),c6=N(r.TotSaleValue),
            c7=N(r.CostAcqWithoutIndx),c8=N(r.AcquisitionCost),c9=N(r.LTCGBeforelower6and11),
            c10=N(r.FairMktValuePerShareunit),c11=N(r.TotFairMktValueCapAst),c12=N(r.ExpExclCnctTransfer),
            c13=N(r.TotalDeductions),c14=N(r.Balance);
      A(S[0],REQ(c7,Math.max(c8,c9)),"Schedule "+suf+L+"Col.7 (cost of acquisition without indexation) must be the higher of Col.8 and Col.9.");
      A(S[1],REQ(c9,Math.min(c6,c11)),"Schedule "+suf+L+"Col.9 (asset acquired before 01.02.2018) must be the lower of Col.6 and Col.11.");
      A(S[2],REQ(c13,c7+c12),"Schedule "+suf+L+"Col.13 (total deductions) must equal Col.7 + Col.12.");
      A(S[3],REQ(c14,c6-c13),"Schedule "+suf+L+"Col.14 (balance) must equal Col.6 − Col.13.");
      if(!pre)A(S[5],!(c4>0)&&!(c5>0)&&!(c11>0),"Schedule "+suf+L+"Col.4, Col.5 and Col.11 cannot be greater than zero when the share/unit was acquired after 31.01.2018.");
      if(pre){A(S[6],REQ(c6,c4*c5),"Schedule "+suf+L+"Col.6 (total sale value) must equal Col.4 × Col.5 for shares/units acquired on or before 31.01.2018.");
        A(S[7],REQ(c11,c4*c10),"Schedule "+suf+L+"Col.11 (total FMV u/s 55(2)(ac)) must equal Col.4 × Col.10 for shares/units acquired on or before 31.01.2018.");}
    });
    /* ---- 455/463: the eight column totals must equal the sum over rows ---- */
    const tot=(k)=>N(RG(blk,k,0));
    const sum=(f)=>RSUM(rows,f);
    A(S[4],
      REQ(tot("SaleValue"+suf),sum("TotSaleValue"))&&
      REQ(tot("CostAcqWithoutIndx"+suf),sum("CostAcqWithoutIndx"))&&
      REQ(tot("AcquisitionCost"+suf),sum("AcquisitionCost"))&&
      REQ(tot("LTCGBeforelowerB1B2"+suf),sum("LTCGBeforelower6and11"))&&
      REQ(tot("FairMktValueCapAst"+suf),sum("TotFairMktValueCapAst"))&&
      REQ(tot("ExpExclCnctTransfer"+suf),sum("ExpExclCnctTransfer"))&&
      REQ(tot("Deductions"+suf),sum("TotalDeductions"))&&
      REQ(tot("Balance"+suf),sum("Balance")),
      "Schedule "+suf+": the totals of Col.6, 7, 8, 9, 11, 12, 13 and 14 must equal the sum of the per-scrip rows.");
  }
  if(I.Schedule112A) scrip(I.Schedule112A,"Schedule112ADtls","112A",[451,452,453,454,455,456,457,458]);
  if(I.Schedule115AD) scrip(I.Schedule115AD,"Schedule115ADDtls","115AD",[459,460,461,462,463,464,465,466]);

  /* ===================================================================
     SCHEDULE VDA  (467–470)
     Row: DateofAcquisition · DateofTransfer · HeadUndIncTaxed (BI|CG) ·
     AcquisitionCost (5) · ConsidReceived (6) · IncomeFromVDA (7).
     Totals: TotIncBusiness (A) · TotIncCapGain (B).
     =================================================================== */
  if(I.ScheduleVDA){const V=I.ScheduleVDA,vr=arr(RG(V,"ScheduleVDADtls",[]));
    vr.forEach(function(r,i){r=r||{};const L=" row "+(i+1)+": ";
      /* 467: Col.7 = MAX(0, Col.6 − Col.5) — nil in case of loss */
      A(467,REQ(N(r.IncomeFromVDA),Math.max(0,N(r.ConsidReceived)-N(r.AcquisitionCost))),"Schedule VDA"+L+"income from transfer (Col.7) must equal Col.6 − Col.5, taken as nil in case of a loss.");
      /* 470: neither date can be after 31 March of the financial year */
      A(470,(!isISO(r.DateofAcquisition)||String(r.DateofAcquisition)<=FYEND)&&(!isISO(r.DateofTransfer)||String(r.DateofTransfer)<=FYEND),"Schedule VDA"+L+"the date of acquisition and the date of transfer cannot be after 31 March of the financial year.");
    });
    /* 468/469: SUMIF by head of income (Col.4) of the positive Col.7 amounts */
    A(468,REQ(N(V.TotIncBusiness),RSUM(vr.filter(r=>r&&String(r.HeadUndIncTaxed||"")==="BI"),"IncomeFromVDA")),"Schedule VDA: Total A must equal the sum of Col.7 for the rows where the head of income (Col.4) is Business income.");
    A(469,REQ(N(V.TotIncCapGain),RSUM(vr.filter(r=>r&&String(r.HeadUndIncTaxed||"")==="CG"),"IncomeFromVDA")),"Schedule VDA: Total B must equal the sum of Col.7 for the rows where the head of income (Col.4) is Capital Gain.");
  }

  /* ===================================================================
     SCHEDULE OS  (471–500)
     =================================================================== */
  if(I.ScheduleOS){const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const ded=RG(io,"Deductions",{})||{};
    const dtRows=arr(RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]));
    /* residency gate (T3): MID(ResidentialStatus,1,3)="RES" → resident, else NRI */
    const res=String(RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus","RES"));
    const nri=res.slice(0,3).toUpperCase()!=="RES";
    const counts=r=>!nri||String((r&&r.TaxRescertifiedFlag)||"").charAt(0).toUpperCase()==="Y";
    const dtaaNat=nat=>dtRows.filter(r=>r&&String(r.NatureOfIncome||"")===nat).reduce((a,r)=>a+N(r.DTAAamt),0);
    const qsum=o=>{const dr=RG(I,"ScheduleOS."+o+".DateRange",{})||{};
      return ["Upto15Of6","Up16Of6To15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"].reduce((a,k)=>a+N(dr[k]),0);};

    /* 471: item 1 = 1a + 1b + 1c + 1d + 1e */
    A(471,REQ(N(io.GrossIncChrgblTaxAtAppRate),N(io.DividendGross)+N(io.InterestGross)+N(io.RentFromMachPlantBldgs)+N(io.Tot562x)+N(io.AnyOtherIncome)),"Schedule OS: item 1 (gross income at normal applicable rates) must equal 1a + 1b + 1c + 1d + 1e.");
    /* 472: 3d = 3a + 3b + 3c (Expenses + Depreciation + eligible interest u/s 57) */
    A(472,REQ(N(ded.TotDeductions),N(ded.Expenses)+N(ded.Depreciation)+N(ded.IntExp57)),"Schedule OS: item 3d (total deductions u/s 57) must equal 3a + 3b + 3c.");
    /* 473: depreciation (3b) cannot be claimed when rental income 1c is nil */
    A(473,N(io.RentFromMachPlantBldgs)>0||N(ded.Depreciation)<=0,"Schedule OS: the depreciation deduction (3b) cannot be more than zero when the rental income from machinery, plant, buildings (1c) is zero.");
    /* 474: item 7 = item 2 + item 6 (item 6 taken as nil if negative) */
    A(474,REQ(N(RG(I,"ScheduleOS.TotOthSrcNoRaceHorse")),N(io.IncChargeableSpecialRates)+Math.max(0,N(io.BalanceNoRaceHorse))),"Schedule OS: item 7 (income from other sources other than race horses) must equal item 2 + item 6, with item 6 taken as nil if negative.");
    /* 475: 8e balance = 8a − 8b + 8c + 8d */
    const rh=RG(I,"ScheduleOS.IncFromOwnHorse",null);
    if(rh&&typeof rh==="object")
      A(475,REQ(N(rh.BalanceOwnRaceHorse),N(rh.Receipts)-N(rh.DeductSec57)+N(rh.AmtNotDeductibleUs58)+N(rh.ProfitChargTaxUs59)),"Schedule OS: item 8e (balance on owning/maintaining race horses) must equal 8a − 8b + 8c + 8d.");
    const e8=rh?N(rh.BalanceOwnRaceHorse):0;
    /* 476: item 9 = item 7 + item 8e (a race-horse loss is not set off here) */
    A(476,REQ(N(RG(I,"ScheduleOS.IncChargeableFrmOthSrc")),N(RG(I,"ScheduleOS.TotOthSrcNoRaceHorse"))+Math.max(0,e8)),"Schedule OS: item 9 (income from other sources) must equal item 7 + item 8e.");
    /* 477: 2d PTI special-rate total = Σ of the individual amounts */
    A(477,REQ(N(io.PassThrIncOSChrgblSplRate),RSUM(arr(RG(io,"PTIOthersGrossDtls",[])),"SourceAmount")),"Schedule OS: the pass-through income chargeable at special rates (2d) must equal the sum of the individual amounts entered.");
    /* 478: 1d = di + dii + diii + div + dv */
    A(478,REQ(N(io.Tot562x),N(io.Aggrtvaluewithoutcons562x)+N(io.Immovpropwithoutcons562x)+N(io.Immovpropinadeqcons562x)+N(io.Anyotherpropwithoutcons562x)+N(io.Anyotherpropinadeqcons562x)),"Schedule OS: item 1d [income u/s 56(2)(x)] must equal di + dii + diii + div + dv.");
    /* 479: not mappable — see the not-mappable note at the foot of this batch. */
    /* 480–486: in table 2e, the sum of Col.2 (Amount of income) for each item
       code cannot exceed the corresponding parent field. */
    A(480,dtaaNat("1ai")<=N(io.DividendOthThan22e)+1,"Schedule OS table 2e: the amounts of income shown against 1a(i) cannot exceed 1a(i) dividend income.");
    A(481,dtaaNat("1b")<=N(io.InterestGross)+1,"Schedule OS table 2e: the amounts of income shown against 1b cannot exceed 1b interest, gross.");
    A(482,dtaaNat("1c")<=N(io.RentFromMachPlantBldgs)+1,"Schedule OS table 2e: the amounts of income shown against 1c cannot exceed 1c rental income from machinery, plant, buildings, gross.");
    A(483,dtaaNat("1d")<=N(io.Tot562x)+1,"Schedule OS table 2e: the amounts of income shown against 1d cannot exceed 1d income of the nature referred to in section 56(2)(x).");
    A(484,dtaaNat("2ai")<=N(io.LtryPzzlChrgblUs115BB)+1,"Schedule OS table 2e: the amounts of income shown against 2a cannot exceed 2a winnings from lotteries, crossword puzzles etc. chargeable u/s 115BB.");
    A(485,dtaaNat("2c")<=N(io.OthersGross)+1,"Schedule OS table 2e: the amounts of income shown against 2c cannot exceed 2c any other income chargeable at special rate.");
    A(486,dtaaNat("2d")<=N(io.PassThrIncOSChrgblSplRate)+1,"Schedule OS table 2e: the amounts of income shown against 2d cannot exceed 2d pass-through income chargeable at special rates.");
    /* 487: item 6 = 1 − 3 + 4 + 5 − DTAA(items in 1) */
    const dtaaItem1=dtRows.filter(r=>r&&counts(r)&&["1ai","1aiii","1b","1c","1d"].indexOf(String(r.NatureOfIncome||""))>=0).reduce((a,r)=>a+N(r.DTAAamt),0);
    A(487,REQ(N(io.BalanceNoRaceHorse),N(io.GrossIncChrgblTaxAtAppRate)-N(ded.TotDeductions)+Math.max(0,N(io.AmtNotDeductibleUs58))+N(io.ProfitChargTaxUs59)-dtaaItem1),"Schedule OS: item 6 (net income at normal rates) must equal item 1 − 3 + 4 + 5 − the DTAA amounts relating to item 1.");
    /* 488: 2e applicable rate (Col.10) = lower of treaty (Col.6) and I.T.-Act (Col.9) */
    dtRows.forEach(function(r,i){r=r||{};
      if(r.ApplicableRate!=null&&r.ApplicableRate!==""&&typeof r.ApplicableRate==="number")
        A(488,Math.abs(N(r.ApplicableRate)-Math.min(N(r.RateAsPerTreaty),N(r.RateAsPerITAct)))<0.01,"Schedule OS table 2e row "+(i+1)+": the applicable rate (Col.10) must be the lower of the rate as per treaty and the rate as per the I.T. Act.");
    });
    /* 489: item 2 = MAX(0, 2a(i)+2a(ii)+2b+2c+2d + DTAA parts on normal-rate codes) */
    const dtaaSpecial=dtRows.filter(r=>r&&counts(r)&&["56i","56i_f","56","562iii","562x"].indexOf(String(r.ItemNoincl||""))>=0).reduce((a,r)=>a+N(r.DTAAamt),0);
    A(489,REQ(N(io.IncChargeableSpecialRates),Math.max(0,N(io.LtryPzzlChrgblUs115BB)+N(io.IncChrgblUs115BBJ)+N(io.IncChrgblUs115BBE)+N(io.OthersGross)+N(io.PassThrIncOSChrgblSplRate)+dtaaSpecial)),"Schedule OS: item 2 (income at special rates) must equal the sum of 2a(i) + 2a(ii) + 2b + 2c + 2d + 2e (elements relating to item 1), floored at nil.");
    /* 490: 1b = bi + bii + biii + biv + bv */
    A(490,REQ(N(io.InterestGross),N(io.IntrstFrmSavingBank)+N(io.IntrstFrmTermDeposit)+N(io.IntrstFrmIncmTaxRefund)+N(io.NatofPassThrghIncome)+N(io.IntrstFrmOthers)),"Schedule OS: item 1b (interest, gross) must equal bi + bii + biii + biv + bv.");
    /* 491: item 10 quarterly break-up of 115BB winnings = 2a(i) */
    A(491,REQ(qsum("IncFrmLottery"),N(io.LtryPzzlChrgblUs115BB)),"Schedule OS: the quarterly break-up (item 10) of winnings from lotteries etc. u/s 115BB must equal item 2a(i).");
    /* 492: interest expenditure on dividend (3c) can be claimed only if a
       dividend is declared in 1a(i) or 1a(ii) */
    A(492,N(RG(ded,"UsrIntExp57"))<=0||N(io.DividendOthThan22e)>0||N(io.Dividend22e)>0,"Schedule OS: the interest expenditure u/s 57(1) at 3c can be claimed only if a dividend is declared at 1a(i) or 1a(ii).");
    /* 493: 2c any-other-special-rate total = Σ of the individual amounts */
    A(493,REQ(N(io.OthersGross),RSUM(arr(RG(io,"OthersGrossDtls",[])),"SourceAmount")),"Schedule OS: item 2c (income chargeable at special rates) must equal the sum of the individual amounts entered.");
    /* 494: interest expenditure on dividend u/s 57(1) at 3c ≤ 20% of that dividend income */
    A(494,N(ded.IntExp57)<=0.20*(N(io.DividendOthThan22e)+N(io.Dividend22e))+1,"Schedule OS: the interest expenditure u/s 57(1) at 3c cannot be more than 20% of the dividend income included in the total income.");
    /* 495: 1a = 1a(i) + 1a(ii) + 1a(iii) */
    A(495,REQ(N(io.DividendGross),N(io.DividendOthThan22e)+N(io.Dividend22e)+N(io.Dividend22f)),"Schedule OS: item 1a (dividend, gross) must equal 1a(i) + 1a(ii) + 1a(iii).");
    /* 496–499: not mappable — see the not-mappable note at the foot of this batch. */
    /* 500: 2b = bi + bii + biii + biv + bv + bvi (68/69/69A/69B/69C/69D) */
    A(500,REQ(N(io.IncChrgblUs115BBE),N(io.CashCreditsUs68)+N(io.UnExplndInvstmntsUs69)+N(io.UnExplndMoneyUs69A)+N(io.UnDsclsdInvstmntsUs69B)+N(io.UnExplndExpndtrUs69C)+N(io.AmtBrwdRepaidOnHundiUs69D)),"Schedule OS: item 2b (income chargeable u/s 115BBE) must equal bi + bii + biii + biv + bv + bvi.");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     479 — "Taxpayer is a non-resident and showing income under section
           115BBF" : the rules.json entry is a truncated condition fragment
           with no checkable assertion, and 115BBF (royalty on patents) is
           not a distinct Schedule-OS line in the ITR-5 schema.
     496–499 — item-10 quarterly break-up of a specific dividend category
           (115A(1)(a)(i) / 115AC / 115AD(1)(i) FII @20% / specified fund
           @10%) "should be equal to Sl. No. 2c and 2d". The schema does not
           link a specific item-10 dividend category to a specific 2c/2d
           source-code amount (the 2c/2d rows carry OS/PTI section codes with
           no verifiable enum→category mapping), so a literal encoding would
           false-fire on lawful returns. Left to the schedule's own audit.
     ------------------------------------------------------------------ */
});
