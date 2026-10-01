/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_06 (Phase 6).
   Serial range A259–A308 (all ENFORCED per books/ITR-7/rule_census.md):
   Schedule CG arithmetic / set-off matrix (A259–A297) and Schedule OS
   income build-up (A298–A308). Registered via ruleset(fn); runRules()
   invokes it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A
   block) when cond — the "this return is lawful" assertion — is FALSE.
   Every read is guarded (RG / (X||{}) / N()); nothing throws. Keys are the
   built-return ITR7 schema paths (I = Object.values(buildReturn().ITR)[0]);
   the paths, the Table-E buckets and the special-rate codes were taken from
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json, books/ITR-7/Schedule_CG.md,
   Schedule_OS.md, Schedule_CYLA.md, Schedule_SI.md, Schedule_VDA.md and the
   built section 70_sec_cg.js / 70_sec_os.js. Encoded from each rule's own
   text (constitution rule 6), re-joined across the rules.json line-wrap.

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Serials in A259–A308 NOT encoded here, re-filed OFFLINE-IMPOSSIBLE (never
   faked — the target field/table does not exist in the built return):
     A293 — "sum of improve cost in each L&B block = sum of all improve costs
            for such block" needs an itemised cost-of-improvement breakdown;
            the built LTCG land block carries only the single aggregate leaf
            CostOfImprovements.ImproveCost, so there is no per-item list to sum.
     A295 — Table D presence check on items 1aiv/1civ/1div with sub-details
            iva/ivb/ivc; those item letters do not resolve to any leaf of the
            built DeducClaimInfo (54D/54EC/54G/54GA) tables.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const EQ=(a,b)=>Math.abs(N(a)-N(b))<=1;               /* money equality (±1) */
  const sumDR=o=>{o=o||{};return N(o.Upto15Of6)+N(o.Up16Of6To15Of9)+N(o.Up16Of9To15Of12)+
    N(o.Up16Of12To15Of3)+N(o.Up16Of3To31Of3);};        /* a Table-F/quarter DateRange total */

  /* =================================================================
     Schedule CG · A259–A297
     ================================================================= */
  if(I.ScheduleCG){
    const CG = RG(I,"ScheduleCG",{})||{};
    const ST = RG(CG,"ShortTermCapGain",{})||{};
    const LT = RG(CG,"LongTermCapGain",{})||{};
    const stLand = RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])||[];
    const ltLand = RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[])||[];

    /* A259 — A2 slump sale (STCG): full value of consideration (aiii) = higher of ai / aii. */
    const ssS = RG(ST,"SlumpSaleInStcg",{})||{};
    A(259, EQ(ssS.FullConsideration, Math.max(N(ssS.FMV11UAEii),N(ssS.FMV11UAEiii))),
      "Schedule CG: for STCG slump sale, A2aiii (full value of consideration) must equal the higher of A2ai and A2aii.");

    /* A260 — B2 slump sale (LTCG): full value of consideration (aiii) = higher of ai / aii. */
    const ssL = RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg",{})||{};
    A(260, EQ(ssL.FullConsideration, Math.max(N(ssL.FMV11UAEii),N(ssL.FMV11UAEiii))),
      "Schedule CG: for LTCG slump sale, B2aiii (full value of consideration) must equal the higher of B2ai and B2aii.");

    /* A261 — STCG land block: A1 biv Total = sum of A1(bi + bii + biii). */
    A(261, stLand.every(p=>!p||EQ(p.TotalDedn, N(p.AquisitCost)+N(p.ImproveCost)+N(p.ExpOnTrans))),
      "Schedule CG: STCG Sl. No. A1 biv (Total deduction) must equal the sum of A1(bi + bii + biii).");

    /* A262 — STCG land block: A1e = A1c − A1d only if 1c > 1d; if (1c − 1d) is negative A1e = 0;
       if 1c < 0 then A1e = 1c. */
    A(262, stLand.every(p=>{ if(!p) return true;
        const c=N(p.Balance), d=N(RG(p,"ExemptionOrDednUs54.ExemptionGrandTotal",0)), e=N(p.CapgainonAssets);
        const exp = c<0 ? c : (c>d ? c-d : 0);
        return EQ(e,exp); }),
      "Schedule CG: STCG A1e must equal A1c − A1d when A1c > A1d, 0 when the difference is negative, and A1c when A1c is negative.");

    /* A263 — Part C: C3 (income under head Capital Gains) = C1 (sum of CG incomes) + C2 (VDA). */
    A(263, EQ(CG.IncChargeableHeadCapGain, N(CG.SumOfCGIncm)+N(CG.IncmFromVDATrnsf)),
      "Schedule CG: C3 (income chargeable under the head Capital Gains) must equal C1 (sum of capital-gain incomes) + C2 (income from transfer of VDA).");

    /* A264 — Part C: C2 (income from transfer of VDA) = Sl. No. B of Schedule VDA. */
    if(I.ScheduleVDA){
      A(264, EQ(CG.IncmFromVDATrnsf, RG(I,"ScheduleVDA.TotIncCapGain",0)),
        "Schedule CG: C2 (income from transfer of VDA) must equal Sl. No. B of Schedule VDA.");
    }

    /* A265 / A270 — VDA capital-gain income vs 115BBH(ii) of Schedule SI. */
    if(I.ScheduleSI){
      const siRows = RG(I,"ScheduleSI.SplCodeRateTax",[])||[];
      const vdaCG  = siRows.reduce((a,r)=>a+(r&&String(r.SecCode)==="5BBHii"?N(r.SplRateInc):0),0);
      /* A265 — C2 = 115BBH(ii) "Income under head Capital Gain" of Schedule SI. */
      A(265, EQ(CG.IncmFromVDATrnsf, vdaCG),
        "Schedule CG: C2 (income from transfer of VDA) must equal 115BBH(ii) — income under head Capital Gain — of Schedule SI.");
      /* A270 — Table F VDA @30% row (Σ quarters) = 115BBH(ii) income of Schedule SI. */
      A(270, EQ(sumDR(RG(CG,"AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange",{})), vdaCG),
        "Schedule CG: Table F 'Capital gains on transfer of VDA taxable @ 30%' must equal 115BBH(ii) income under head Capital Gain of Schedule SI.");
    }

    /* A266–A269, A272, A273 — Table F rate-bucket total (Σ quarters) = Schedule CYLA col-5
       (income remaining after set off) of the matching head. */
    if(I.ScheduleCYLA){
      const CY = RG(I,"ScheduleCYLA",{})||{};
      const tf   = b=>sumDR(RG(CG,"AccruOrRecOfCG."+b+".DateRange",{}));
      const cyla = h=>N(RG(CY,h+".IncCYLA.IncOfCurYrAfterSetOff",0));
      /* A266 — STCG @30% (Table F) = 5vi of Schedule CYLA. */
      A(266, EQ(tf("ShortTermUnder30Per"), cyla("STCG30Per")),
        "Schedule CG: Table F 'Short-term capital gain taxable @ 30%' must equal Sl. No. 5vi of Schedule CYLA.");
      /* A267 — STCG applicable rates (Table F) = 5vii of Schedule CYLA. */
      A(267, EQ(tf("ShortTermUnderAppRate"), cyla("STCGAppRate")),
        "Schedule CG: Table F 'Short-term capital gains taxable at applicable rates' must equal Sl. No. 5vii of Schedule CYLA.");
      /* A268 — STCG DTAA rates (Table F) = 5viii of Schedule CYLA. */
      A(268, EQ(tf("ShortTermUnderDTAARate"), cyla("STCGDTAARate")),
        "Schedule CG: Table F 'Short-term capital gains taxable at DTAA rates' must equal Sl. No. 5viii of Schedule CYLA.");
      /* A269 — LTCG DTAA rates (Table F) = 5x of Schedule CYLA. */
      A(269, EQ(tf("LongTermUnderDTAARate"), cyla("LTCGDTAARate")),
        "Schedule CG: Table F 'Long-term capital gains taxable at DTAA rates' must equal Sl. No. 5x of Schedule CYLA.");
      /* A272 — STCG @20% (Table F) = 5v of Schedule CYLA. */
      A(272, EQ(tf("ShortTermUnder20Per"), cyla("STCG20Per")),
        "Schedule CG: Table F 'Short-term capital gain taxable @ 20%' (quarter break-up) must equal Sl. No. 5v of Schedule CYLA.");
      /* A273 — LTCG @12.5% (Table F) = 5ix of Schedule CYLA. */
      A(273, EQ(tf("LongTermUnder12_5Per"), cyla("LTCG12_5Per")),
        "Schedule CG: Table F 'Long-term capital gains taxable at the rate of 12.5%' must equal Sl. No. 5ix of Schedule CYLA.");
    }

    /* A271 — A3 STCG @20% (111A and 115AD(1)(b)(ii)) can only be entered once each
       (no duplicate section code in the EquityMFonSTT table). */
    const eqMF = RG(ST,"EquityMFonSTT",[])||[];
    A(271, (function(){ const codes=eqMF.filter(x=>x&&S0(x.MFSectionCode)).map(x=>String(x.MFSectionCode));
        return new Set(codes).size===codes.length; })(),
      "Schedule CG: STCG @20% — 111A and 115AD(1)(b)(ii) can each be entered only once in the A3 table.");

    /* --- A274 / A275 — Table E row ii (STCG @20%) current-year income = A3ie + A3iie + A4a + A8a
       − A(A)@20%. The buy-back amount is stored negative, so it is added. --- */
    const eqSum = RSUM(RG(ST,"EquityMFonSTT",[]), r=>N(RG(r,"EquityMFonSTTDtls.CapgainonAssets",0)));
    const bbST  = RG(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls",[])||[];
    const bbAtST= code=>bbST.reduce((a,x)=>a+(x&&String(x.Rate)===code?N(x.Amount):0),0);
    const st20  = eqSum + N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTPaid",0)) + N(ST.PassThrIncNatureSTCG20Per) + bbAtST("STL20");
    const inc20 = N(RG(CG,"CurrYrLosses.InStcg20Per.CurrYearIncome",0));
    A(274, EQ(inc20, Math.max(0,st20)),
      "Schedule CG: Table E STCG @20% current-year income must equal A3ie + A3iie + A4a + A8a less the buy-back loss taxable at 20%.");
    A(275, EQ(inc20, Math.max(0,st20)),
      "Schedule CG: Table E row ii (STCG @20%) must equal the sum of A3e + A4a + A8a less the buy-back loss taxable at 20%.");

    /* --- A276 / A277 — Table E row vi (LTCG @12.5%) current-year income = B1g + B2e + B3c + B4 +
       B5 + B6c + B7 + B8e + B9 + B10(a1+a2) less B(A)@12.5% (the buy-back total is stored negative). --- */
    const lt125 =
        N(RG(LT,"SaleofLandBuild.TotalLTCGImmblPrprty",0))
      + N(RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.CapgainonAssets",0))
      + N(RG(LT,"Proviso112Applicable.Proviso112Applicabledtls.BalanceCG",0))
      + N(RG(LT,"SaleOfEquityShareUs112A.SaleOfEquityShareUs112AAmt",0))
      + N(RG(LT,"NRIProvisoSec48.BalanceCG",0))
      + RSUM(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[]), r=>N(r.BalanceCG))
      + N(RG(LT,"NRISaleOfEquityShareUs112A.NRISaleOfEquityShareUs112AAmt",0))
      + N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets",0))
      + N(LT.TotalAmtDeemedLtcg)
      + N(LT.PassThrIncNatureLTCGUs112A12_5Per) + N(LT.PassThrIncNatureLTCG12_5Per)
      + N(RG(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0));
    const inc125 = N(RG(CG,"CurrYrLosses.InLtcg12_5Per.CurrYearIncome",0));
    A(276, EQ(inc125, Math.max(0,lt125)),
      "Schedule CG: Table E Ei6 (LTCG @12.5% income) must equal B1g + B2e + B3c + B4 + B5 + B6c + B7 + B8e + B9 + B10a1 + B10a2 less the buy-back loss taxable at 12.5%.");
    A(277, EQ(inc125, Math.max(0,lt125)),
      "Schedule CG: Table E row vi (LTCG @12.5%) must equal B1g + B2e + B3c + B4 + B5 + B6c + B7 + B8e + B9 + B10a1 + B10a2 less the buy-back loss taxable at 12.5%.");

    /* --- A278–A283 — Table E: on each gain row the loss set off claimed against it may not
       exceed that row's income available for set off (its current-year income). --- */
    const CL = RG(CG,"CurrYrLosses",{})||{};
    const rowSet=(node,keys)=>keys.reduce((a,k)=>a+N((node||{})[k]),0);
    const r278=RG(CL,"InStcg20Per",{})||{};
    A(278, rowSet(r278,["StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate"]) <= N(r278.CurrYearIncome)+1,
      "Schedule CG: Table E — loss set off against STCG @20% cannot exceed the income available for set off.");
    const r279=RG(CL,"InStcg30Per",{})||{};
    A(279, rowSet(r279,["StclSetoff20Per","StclSetoffAppRate","StclSetoffDTAARate"]) <= N(r279.CurrYearIncome)+1,
      "Schedule CG: Table E — loss set off against STCG @30% cannot exceed the income available for set off.");
    const r280=RG(CL,"InStcgAppRate",{})||{};
    A(280, rowSet(r280,["StclSetoff20Per","StclSetoff30Per","StclSetoffDTAARate"]) <= N(r280.CurrYearIncome)+1,
      "Schedule CG: Table E — loss set off against STCG at applicable rates cannot exceed the income available for set off.");
    const r281=RG(CL,"InStcgDTAARate",{})||{};
    A(281, rowSet(r281,["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate"]) <= N(r281.CurrYearIncome)+1,
      "Schedule CG: Table E — loss set off against STCG at DTAA rates cannot exceed the income available for set off.");
    const r282=RG(CL,"InLtcg12_5Per",{})||{};
    A(282, rowSet(r282,["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate","LtclSetOffDTAARate"]) <= N(r282.CurrYearIncome)+1,
      "Schedule CG: Table E — loss set off against LTCG @12.5% cannot exceed the income available for set off.");
    const r283=RG(CL,"InLtcgDTAARate",{})||{};
    A(283, rowSet(r283,["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate","LtclSetOff12_5Per"]) <= N(r283.CurrYearIncome)+1,
      "Schedule CG: Table E — loss set off against LTCG at DTAA rates cannot exceed the income available for set off.");

    /* --- A284–A289 — Table E: the total of each loss bucket set off (row viii) may not exceed
       the loss available for set off (row i). --- */
    const TL = RG(CL,"TotLossSetOff",{})||{};
    const IL = RG(CL,"InLossSetOff",{})||{};
    A(284, N(TL.StclSetoff20Per)   <= N(IL.StclSetoff20Per)+1,
      "Schedule CG: Table E — total set off of STCL @20% cannot exceed the loss available for set off.");
    A(285, N(TL.StclSetoff30Per)   <= N(IL.StclSetoff30Per)+1,
      "Schedule CG: Table E — total set off of STCL @30% cannot exceed the loss available for set off.");
    A(286, N(TL.StclSetoffAppRate) <= N(IL.StclSetoffAppRate)+1,
      "Schedule CG: Table E — total set off of STCL at applicable rates cannot exceed the loss available for set off.");
    A(287, N(TL.StclSetoffDTAARate)<= N(IL.StclSetoffDTAARate)+1,
      "Schedule CG: Table E — total set off of STCL at DTAA rates cannot exceed the loss available for set off.");
    A(288, N(TL.LtclSetOff12_5Per) <= N(IL.LtclSetOff12_5Per)+1,
      "Schedule CG: Table E — total set off of LTCL @12.5% cannot exceed the loss available for set off.");
    A(289, N(TL.LtclSetOffDTAARate)<= N(IL.LtclSetOffDTAARate)+1,
      "Schedule CG: Table E — total set off of LTCL at DTAA rates cannot exceed the loss available for set off.");

    /* A290 — Table F Sl. No. 10 (VDA) quarter break-up total = C2 (income from transfer of VDA). */
    A(290, EQ(sumDR(RG(CG,"AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange",{})), N(CG.IncmFromVDATrnsf)),
      "Schedule CG: Table F VDA quarter break-up must total to Sl. No. C2 (income from transfer of VDA).");

    /* A291 — LTCG B1d: amount invested u/s 54EC must not exceed Rs. 50,00,000. */
    A(291, (RG(CG,"DeducClaimInfo.DeducClaimDtlsUs54EC",[])||[]).every(r=>!r||N(r.AmtInvested)<=5000000),
      "Schedule CG: B1d — amount invested u/s 54EC cannot exceed Rs. 50,00,000.");

    /* A292 — Table E: the entire current-year loss must be set off against the gains available for
       set off (no loss may remain while a gain it could absorb remains). A STCL can absorb any
       remaining gain; a LTCL can absorb only a remaining long-term gain. */
    const remKeys=["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate","LtclSetOff12_5Per","LtclSetOffDTAARate"];
    const RM=RG(CL,"LossRemainSetOff",{})||{};
    const remSTCL=["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate"].reduce((a,k)=>a+N(RM[k]),0);
    const remLTCL=["LtclSetOff12_5Per","LtclSetOffDTAARate"].reduce((a,k)=>a+N(RM[k]),0);
    const remGainAll=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"]
        .reduce((a,k)=>a+N(RG(CL,k+".CurrYrCapGain",0)),0);
    const remGainLT=N(RG(CL,"InLtcg12_5Per.CurrYrCapGain",0))+N(RG(CL,"InLtcgDTAARate.CurrYrCapGain",0));
    void remKeys;
    A(292, !((remSTCL>1 && remGainAll>1) || (remLTCL>1 && remGainLT>1)),
      "Schedule CG: Table E — the entire current-year capital loss must be set off against the gains available for set off.");

    /* A294 — A(A): buy-back loss total (STCG) = sum of the per-rate (20% / 30% / applicable) amounts. */
    A(294, EQ(RG(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0),
              RSUM(RG(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls",[]), r=>N(r.Amount))),
      "Schedule CG: A(A) — the buy-back loss total must equal the sum of the amounts entered against the 20% / 30% / applicable-rate drop-downs.");

    /* A296 — LTCG B1: total deduction u/s 54 (per land block) = sum of the individual deductions. */
    A(296, ltLand.every(p=>{ if(!p) return true;
        const ex=RG(p,"ExemptionOrDednUs54",{})||{};
        return EQ(ex.ExemptionGrandTotal, RSUM(ex.ExemptionOrDednUs54Dtls, r=>N(r.ExemptionAmount))); }),
      "Schedule CG: LTCG B1 — total deduction u/s 54 must equal the sum of the deductions mentioned.");

    /* A297 — date of sale/transfer of land or building (A1 or B1) cannot be after 31 March of the FY. */
    const okSale=arr=>arr.every(p=>!p||!S0(p.DateofSale)||String(p.DateofSale)<="2026-03-31");
    A(297, okSale(stLand) && okSale(ltLand),
      "Schedule CG: the date of sale/transfer of land or building in A1 or B1 cannot be after 31 March of the financial year.");
  }

  /* =================================================================
     Schedule OS · A298–A308
     ================================================================= */
  if(I.ScheduleOS){
    const OS = RG(I,"ScheduleOS",{})||{};
    const O1 = RG(OS,"IncOthThanOwnRaceHorse",{})||{};

    /* A298 — item 1 (gross income at normal rates) = 1a + 1b + 1c + 1d + 1e. */
    A(298, EQ(O1.GrossIncChrgblTaxAtAppRate,
              N(O1.DividendGross)+N(O1.InterestGross)+N(O1.RentFromMachPlantBldgs)+N(O1.Tot562x)+N(O1.AnyOtherIncome)),
      "Schedule OS: item 1 (gross income chargeable at normal applicable rates) must equal 1a + 1b + 1c + 1d + 1e.");

    /* A299 — 1b Interest Gross = savings bank + deposits + income-tax refund + pass-through + others. */
    A(299, EQ(O1.InterestGross,
              N(O1.IntrstFrmSavingBank)+N(O1.IntrstFrmTermDeposit)+N(O1.IntrstFrmIncmTaxRefund)+
              N(O1.NatofPassThrghIncome)+N(O1.IntrstFrmOthers)),
      "Schedule OS: 1b Interest Gross must equal the sum of interest from savings bank, deposits, income-tax refund, pass-through income and others.");

    /* A300 — 1d = di + dii + diii + div + dv. */
    A(300, EQ(O1.Tot562x,
              N(O1.Aggrtvaluewithoutcons562x)+N(O1.Immovpropwithoutcons562x)+N(O1.Immovpropinadeqcons562x)+
              N(O1.Anyotherpropwithoutcons562x)+N(O1.Anyotherpropinadeqcons562x)),
      "Schedule OS: 1d (income u/s 56(2)(x)) must equal the sum of di + dii + diii + div + dv.");

    /* A301 — 1e "Any other income" total = sum of the individual values entered. */
    A(301, EQ(O1.AnyOtherIncome,
              N(O1.IncDisallwnExmpUs10)+N(O1.SumRecdPrYrBusTRU562xii)+
              RSUM(RG(O1,"OthersInc.OthersIncDtls",[]), r=>N(r.OthAmount))),
      "Schedule OS: 1e 'Any other income' total must equal the sum of the individual values entered.");

    /* A302 — item 2 (income at special rates) = 2ai + 2aii + 2b + 2c + 2d + 2e. */
    A(302, EQ(O1.IncChargeableSpecialRates,
              N(O1.LtryPzzlChrgblUs115BB)+N(O1.IncChrgblUs115BBJ)+N(O1.IncChrgblUs115BBE)+
              N(O1.OthersGross)+N(O1.PassThrIncOSChrgblSplRate)+
              N(RG(O1,"IncChargblSplRateOS.TotalOSGrossChargblSplRate",0))),
      "Schedule OS: item 2 (income chargeable at special rates) must equal 2ai + 2aii + 2b + 2c + 2d + 2e.");

    /* A303 — 2b (115BBE) = 68 + 69 + 69A + 69B + 69C + 69D. */
    A(303, EQ(O1.IncChrgblUs115BBE,
              N(O1.CashCreditsUs68)+N(O1.UnExplndInvstmntsUs69)+N(O1.UnExplndMoneyUs69A)+
              N(O1.UnDsclsdInvstmntsUs69B)+N(O1.UnExplndExpndtrUs69C)+N(O1.AmtBrwdRepaidOnHundiUs69D)),
      "Schedule OS: income chargeable u/s 115BBE must equal the sum of cash credits u/s 68, unexplained investments u/s 69, money u/s 69A, investments u/s 69B, expenditure u/s 69C and hundi u/s 69D.");

    /* A304 — 2c "Any other income chargeable at special rate" = sum of the amount column. */
    A(304, EQ(O1.OthersGross, RSUM(RG(O1,"OthersGrossDtls",[]), r=>N(r.SourceAmount))),
      "Schedule OS: 2c (any other income chargeable at special rate) must equal the sum of the individual amounts entered.");

    /* A305 — 2d pass-through income at special rates = sum of the amount column. */
    A(305, EQ(O1.PassThrIncOSChrgblSplRate, RSUM(RG(O1,"PTIOthersGrossDtls",[]), r=>N(r.SourceAmount))),
      "Schedule OS: 2d (pass-through income from other sources at special rates) must equal the sum of the individual amounts entered.");

    /* A306 — 2e = sum of the "Amount of income" column of the DTAA table. */
    const dtaa = RG(O1,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])||[];
    A(306, EQ(N(RG(O1,"IncChargblSplRateOS.TotalOSGrossChargblSplRate",0)), RSUM(dtaa, r=>N(r.DTAAamt))),
      "Schedule OS: 2e must equal the sum of the amounts of income entered in column 2 of the DTAA table.");

    /* A307 — 2e applicable rate (col 10) = lower of Rate as per Treaty (col 6) and Rate as per I.T. Act (col 9). */
    A(307, dtaa.every(r=>{ if(!r) return true;
        if(!(N(r.RateAsPerTreaty)>0 || N(r.RateAsPerITAct)>0 || N(r.ApplicableRate)>0)) return true;
        return EQ(r.ApplicableRate, Math.min(N(r.RateAsPerTreaty), N(r.RateAsPerITAct))); }),
      "Schedule OS: 2e applicable rate (col 10) must be the lower of the rate as per treaty and the rate as per the Income-tax Act.");

    /* A308 — 3d = 3a + 3b + 3ci (total section-57 deductions). */
    const D = RG(O1,"Deductions",{})||{};
    A(308, EQ(D.TotDeductions, N(D.Expenses)+N(D.Depreciation)+N(D.IntExp57)),
      "Schedule OS: 3d (total deductions under section 57) must equal 3a + 3b + 3ci.");
  }
});
