/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_06 (Phase 6).
   Serial range A257–A306 (Schedule BP tail + Schedule DPM + Schedule DOA
   + Schedule DEP). Registered via ruleset(fn); runRules() invokes it with
   (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond —
   the "this return is lawful" assertion — is FALSE.

   Every read is guarded (RG default 0 / (X||{}) / N()); nothing throws.
   Keys are the built-return ITR6 schema paths (I = the ITR6 root), taken
   from sources/ITR-6 schema and the built section forms/ITR-6/src/70_sec_bp.js
   (exp() paths) and books/ITR-6/BP.md, DPM_DOA.md, DEP_DCG.md. Encoded from
   each rule's own text (constitution rule 6).

   Coverage (50 ENF serials, no NA/OFFLINE in range):
     A257–A269  CorpScheduleBP (presumptive/rule-7-8 tie-ups + cross-schedule)
     A270–A286  ScheduleDPM (plant & machinery block working)
     A287–A303  ScheduleDOA (other-assets block working)
     A304–A306  ScheduleDEP (depreciation summary totals)
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";          /* present / non-blank */

  /* ---- shared reads (Part A General — for the concessional-regime and
     business-organisation event gates) ---- */
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2For6",{})||{};
  const opted115=S0(FS.Section115BA)&&FS.Section115BA!=="NA";  /* 115BA/115BAA/115BAB */
  const busOrgRows=RG(G2,"BusOrganisation",[])||[];
  const hasBusOrgPY=Array.isArray(busOrgRows)&&busOrgRows.some(function(r){
    return r&&S0(r.DateOfBusinessOrg)&&r.DateOfBusinessOrg>="2025-04-01"&&r.DateOfBusinessOrg<="2026-03-31";
  });

  /* =====================================================================
     Schedule BP (CorpScheduleBP) — A257–A269
     ===================================================================== */
  if(I.CorpScheduleBP){
    const BA=RG(I,"CorpScheduleBP.BusinessIncOthThanSpec",{})||{};
    const IR=RG(BA,"ProfitLossInclRefrdSec",{})||{};   /* item 4a per section */
    const DP=RG(BA,"DeemedProfitBusUs",{})||{};          /* item 36 per section */
    const PF=RG(BA,"ProfitFrmActCvrd",{})||{};           /* item 4c rule 7/7A/7B/8 */
    const IRC=RG(BA,"IncRecCredPLOthHeadDtls",{})||{};   /* item 3a…3e */

    /* A257 — item 36(i)…36(ix) must match item 4a(i)…4a(ix) per section. */
    [["Section44AE","ProfitLossUs44AE","44AE"],["Section44B","ProfitLossUs44B","44B"],
     ["Section44BB","ProfitLossUs44BB","44BB"],["Section44BBA","ProfitLossUs44BBA","44BBA"],
     ["Section44BBB","ProfitLossUs44BBB","44BBB"],["Section44BBC","ProfitLossUs44BBC","44BBC"],
     ["Section44BBD","ProfitLossUs44BBD","44BBD"],["Section44D","ProfitLossUs44D","44D"],
     ["Section44DA","ProfitLossUs44DA","44DA"],["ChapterXIIG","ProfitChapterXIIG","Chapter-XII-G"],
     ["FirstSchTActOther","FirstSchITActOthr115B","First Schedule (other than 115B)"]
    ].forEach(function(x){
      A(257, REQ(N(DP[x[0]]), N(IR[x[1]])),
        "Schedule BP: item 36 (deemed profit u/s "+x[2]+") must match item 4a (profit included in book profit u/s "+x[2]+").");
    });

    /* A258 — item 23 (other addition u/s 28–44DB) should be at least the sum
       of Part A-OI 5a–5d (amounts not credited to P&L within scope of s.28). */
    const oi5=N(RG(I,"PARTA_OI.NoCredToPLAmt.Section28Items"))+N(RG(I,"PARTA_OI.NoCredToPLAmt.ProformaCreditsDue"))
      +N(RG(I,"PARTA_OI.NoCredToPLAmt.PrevYrEscalClaim"))+N(RG(I,"PARTA_OI.NoCredToPLAmt.OthItemInc"));
    A(258, N(BA.OthItemDisallowUs28To44DA)>=oi5-1,
      "Schedule BP: item 23 must be at least the sum of amounts at 5a to 5d of Part A-OI.");

    /* A259 — item 36(vi) (44D) must equal the P&L 62(b) 'Net Profit u/s 44D'
       (the 44D row of the no-account / foreign-company case). */
    let pl44D=0;
    (RG(I,"PARTA_PL.NoBooksOfAccPLDetails",[])||[]).forEach(function(r){
      if(r&&String(r.Section==null?"":r.Section).replace(/\s/g,"")==="44D")pl44D+=N(r.NetProfit);
    });
    A(259, REQ(N(DP.Section44D), pl44D),
      "Schedule BP: item 36(vi) must equal item 62(b) 'Net Profit u/s 44D' of Schedule P&L.");

    /* A260 — having opted for 115BA/115BAA/115BAB (or having filed form
       10-IB/10-IC/10-ID), item 28 (deduction u/s 32AC) cannot be filled. */
    const trig260=opted115||S0(FS["115BAFormFiledDate"]);
    A(260, !trig260 || !N(BA.Amt32AC),
      "Schedule BP: with section 115BA/115BAA/115BAB opted, item 28 (amount allowable u/s 32AC) cannot be filled.");

    /* A261 — item 38a (Income chargeable under Rule 7) must equal item 4c(i)
       (Profit from activities covered under rule 7). */
    A(261, REQ(N(BA.ChrgblIncUndrRule7), N(PF.ProfitFrmActCvrdUndrRule7)),
      "Schedule BP: item 38a (income chargeable under Rule 7) must equal item 4c(i) (profit from activities covered under rule 7).");

    /* A262 — item 38b (Deemed income under Rule 7A) must be at least 35% of
       item 4c(ii) (Profit from activities covered under rule 7A). */
    A(262, N(BA.DeemedChrgblIncUndrRule7A) >= 0.35*N(PF.ProfitFrmActCvrdUndrRule7A) - 1,
      "Schedule BP: item 38b (deemed income under Rule 7A) must be at least 35% of item 4c(ii).");

    /* A263 — item 38c (Deemed income under Rule 7B(1)) must be at least 25% of
       item 4c(iii). */
    A(263, N(BA.DeemedChrgblIncUndrRule7B1) >= 0.25*N(PF.ProfitFrmActCvrdUndrRule7B1) - 1,
      "Schedule BP: item 38c (deemed income under Rule 7B(1)) must be at least 25% of item 4c(iii).");

    /* A264 — item 38d (Deemed income under Rule 7B(1A)) must be at least 40% of
       item 4c(iv). */
    A(264, N(BA.DeemedChrgblIncUndrRule7B1A) >= 0.40*N(PF.ProfitFrmActCvrdUndrRule7B1A) - 1,
      "Schedule BP: item 38d (deemed income under Rule 7B(1A)) must be at least 40% of item 4c(iv).");

    /* A265 — item 38e (Deemed income under Rule 8) must be at least 40% of
       item 4c(v) (Profit from activities covered under rule 8). */
    A(265, N(BA.DeemedChrgblIncUndrRule8) >= 0.40*N(PF.ProfitFrmActCvrdUndrRule8) - 1,
      "Schedule BP: item 38e (deemed income under Rule 8) must be at least 40% of item 4c(v).");

    /* A266 — item C44 (Net P/L from specified business per P&L) must equal
       item 2b (Net P/L from specified business u/s 35AD included in 1). */
    A(266, REQ(N(RG(I,"CorpScheduleBP.IncSpecifiedBusiness.NetPLFrmSpecifiedBus")), N(BA.NetProfLossSpecifiedBus)),
      "Schedule BP: item C44 must equal item 2b 'Net profit or loss from specified business as per profit or loss account'.");

    /* A267 — item 3f (u/s 115BBH, net of cost of acquisition) must match the
       Total 'A' (business income) of Schedule VDA. */
    A(267, REQ(N(BA.PLUs44sChapXIIGOthrUs115B), N(RG(I,"ScheduleVDA.TotIncBusiness"))),
      "Schedule BP: item 3f (u/s 115BBH) must match Sl. No. A 'Total' of Schedule VDA.");

    /* A268 — item A19 (interest disallowable u/s 23 MSMED Act) must equal
       item 17 of Part A-OI. */
    A(268, REQ(N(BA.InterestDisAllowUs23SMEAct), N(RG(I,"PARTA_OI.InterestDisAllowUs23SMEAct"))),
      "Schedule BP: item A19 must equal Sl. No. 17 of Part A-OI.");

    /* A269 — sum of item 3 (3a…3f) cannot exceed the revenue of Schedule P&L /
       Trading Account. */
    const sum3=N(IRC.HouseProperty)+N(IRC.CapitalGains)+N(IRC.OtherSources)
      +N(IRC.UnderSec115BBF)+N(IRC.UnderSec115BBG)+N(BA.PLUs44sChapXIIGOthrUs115B);
    const rev=Math.max(N(RG(I,"PARTA_PL.CreditsToPL.TotCreditsToPL")),N(RG(I,"PARTA_PLIndAS.CreditsToPL.TotCreditsToPL")),
      N(RG(I,"TradingAccount.TardingAccTotCred")),N(RG(I,"TradingAccount.TotRevenueFrmOperations")));
    A(269, sum3 <= rev + 1,
      "Schedule BP: the sum of item 3 (A3) cannot be greater than the revenue in Schedule P&L / Trading Account.");
  }

  /* =====================================================================
     Schedule DPM (plant & machinery) — A270–A286
     ===================================================================== */
  if(I.ScheduleDPM){
    let anyDPMProp=false;
    [{p:"Rate15",r:15,half:true,s18:279},{p:"Rate30",r:30,half:true,s18:280},
     {p:"Rate40",r:40,half:true,s18:281},{p:"Rate45",r:45,half:false,s18:282}
    ].forEach(function(blk){
      const dd=RG(I,"ScheduleDPM.PlantMachinery."+blk.p+".DepreciationDetail",{})||{};
      const wdv=N(dd.WDVFirstDay), add180=N(dd.AdditionsGrThan180Days), realTot=N(dd.RealizationTotalPeriod);
      const addLess=N(dd.AdditionsLessThan180Days), realLess=N(dd.RealizationPeriodDuringYear);
      const full=N(dd.FullRateDeprAmt), half=N(dd.HalfRateDeprAmt);
      const depFull=N(dd.DepreciationAtFullRate), depHalf=N(dd.DepreciationAtHalfRate);
      const a12=N(dd.AddlnDeprOnGT180DayAdditions), a13=N(dd.AddlnDeprDuringYearAdditions), a14=N(dd.AddlnDeprOnLessThan180DayAdditions);
      const tot=N(dd.TotalDepreciation), disallow=N(dd.DepDisAllowUs38_2), net=N(dd.NetAggregateDepreciation);
      const prop=N(dd.ProportionateAggDepreciation), expTr=N(dd.ExpdrOnTrforSaleAsset), cg=N(dd.CapGainUs50), wdvLast=N(dd.WDVLastDay);
      if(prop>0)anyDPMProp=true;

      /* A270 — item 6 = MAX(0, 3+4−5). */
      A(270, REQ(full, Math.max(0, wdv+add180-realTot)),
        "Schedule DPM ("+blk.r+"%): item 6 (amount at full rate) must equal 3 + 4 − 5, or 0 if negative.");
      /* A271 — item 9 = MAX(0, 7−8) (half-rate blocks only). */
      if(blk.half)A(271, REQ(half, Math.max(0, addLess-realLess)),
        "Schedule DPM ("+blk.r+"%): item 9 (amount at half rate) must equal 7 − 8, or 0 if negative.");
      /* A272 — item 15 = 10+11+12+13+14. */
      A(272, REQ(tot, depFull+depHalf+a12+a13+a14),
        "Schedule DPM ("+blk.r+"%): item 15 (total depreciation) must equal 10 + 11 + 12 + 13 + 14.");
      /* A273 — item 17 = 15 − 16. */
      A(273, REQ(net, tot-disallow),
        "Schedule DPM ("+blk.r+"%): item 17 (net aggregate depreciation) must equal 15 − 16.");
      /* A274 — no additional depreciation if 115BA/115BAA/115BAB opted. */
      A(274, !opted115 || (a12===0&&a13===0&&a14===0),
        "Schedule DPM ("+blk.r+"%): additional depreciation is not allowed when section 115BA/115BAA/115BAB is opted.");
      /* A275 — depreciation cannot exceed 40% under the concessional regime:
         the 45% block claims no depreciation. */
      if(blk.r===45)A(275, !opted115 || (depFull===0&&depHalf===0&&tot===0),
        "Schedule DPM: depreciation cannot be claimed above 40% (the 45% block must be nil) when section 115BA/115BAA/115BAB is opted.");
      /* A276 — item 10 = ROUND(6 × rate / 100). (45% block skipped when the
         concessional regime bars it — governed by A275.) */
      if(!(blk.r===45&&opted115))A(276, REQ(depFull, Math.round(full*blk.r/100)),
        "Schedule DPM ("+blk.r+"%): item 10 (depreciation at full rate) must match the rate at Sl. No. 2.");
      /* A277 — item 11 = ROUND(9 × rate / 200) (half-rate blocks only). */
      if(blk.half)A(277, REQ(depHalf, Math.round(half*blk.r/200)),
        "Schedule DPM ("+blk.r+"%): item 11 (depreciation at half rate) must match the rate at Sl. No. 2 (half rate).");
      /* A278 — item 20 = 5 + 8 − 3 − 4 − 7 − 19 (the schema floors a continuing
         block at 0; a negative is entered only when the block ceases — accept
         either the raw figure or its floored value). */
      const dpmCg=realTot+realLess-wdv-add180-addLess-expTr;
      A(278, REQ(cg, dpmCg) || REQ(cg, Math.max(0, dpmCg)),
        "Schedule DPM ("+blk.r+"%): item 20 (capital gain u/s 50) must equal 5 + 8 − 3 − 4 − 7 − 19.");
      /* A279/A280/A281/A282 — item 18 cannot exceed item 17 (per rate block). */
      A(blk.s18, prop<=net,
        "Schedule DPM ("+blk.r+"%): item 18 (proportionate aggregate depreciation) cannot be more than item 17 (net aggregate depreciation).");
      /* A284 — where consideration exceeds opening WDV + additions, item 20
         must not be less than 5 + 8 − 3 − 4 − 7 − 19. */
      const excess=(realTot+realLess)-(wdv+add180+addLess);
      A(284, excess<=0 || cg >= (realTot+realLess-wdv-add180-addLess-expTr)-1,
        "Schedule DPM ("+blk.r+"%): capital gain u/s 50 (item 20) cannot be less than 5 + 8 − 3 − 4 − 7 − 19 when consideration exceeds opening WDV and additions.");
      /* A285 — if item 20 (capital gain) is non-zero, items 10–18 and 21 = 0. */
      A(285, cg===0 || (depFull===0&&depHalf===0&&a12===0&&a13===0&&a14===0&&tot===0&&disallow===0&&net===0&&prop===0&&wdvLast===0),
        "Schedule DPM ("+blk.r+"%): when capital gain u/s 50 (item 20) is non-zero, items 10–18 and 21 must all be 0.");
      /* A286 — if item 20 is 0, item 21 = 7 − 8 + 3 + 4 − 5 − 15. */
      A(286, cg!==0 || REQ(wdvLast, addLess-realLess+wdv+add180-realTot-tot),
        "Schedule DPM ("+blk.r+"%): when capital gain u/s 50 is 0, item 21 (closing WDV) must equal 7 − 8 + 3 + 4 − 5 − 15.");
    });
    /* A283 — item 18 (proportionate depreciation) is filled only for a
       business-organisation event within the same previous year. */
    A(283, !anyDPMProp || hasBusOrgPY,
      "Schedule DPM: item 18 (proportionate aggregate depreciation) is filled but there is no business-organisation event within the same previous year.");
  }

  /* =====================================================================
     Schedule DOA (other assets) — A287–A303
     ===================================================================== */
  if(I.ScheduleDOA){
    let anyDOAProp=false;
    [{p:"Building.Rate5",r:5,s15:294,lbl:"5% building"},{p:"Building.Rate10",r:10,s15:295,lbl:"10% building"},
     {p:"Building.Rate40",r:40,s15:296,lbl:"40% building"},{p:"FurnitureFittings.Rate10",r:10,s15:297,lbl:"10% furniture & fittings"},
     {p:"IntangibleAssets.Rate25",r:25,s15:298,lbl:"25% intangible assets"},{p:"Ships.Rate20",r:20,s15:299,lbl:"20% ships"}
    ].forEach(function(blk){
      const dd=RG(I,"ScheduleDOA."+blk.p+".DepreciationDetail",{})||{};
      const wdv=N(dd.WDVFirstDay), add180=N(dd.AdditionsGrThan180Days), realTot=N(dd.RealizationTotalPeriod);
      const addLess=N(dd.AdditionsLessThan180Days), realLess=N(dd.RealizationPeriodDuringYear);
      const full=N(dd.FullRateDeprAmt), half=N(dd.HalfRateDeprAmt);
      const depFull=N(dd.DepreciationAtFullRate), depHalf=N(dd.DepreciationAtHalfRate);
      const tot=N(dd.TotalDepreciation), disallow=N(dd.DepDisAllowUs38_2), net=N(dd.NetAggregateDepreciation);
      const prop=N(dd.ProportionateAggDepreciation), expTr=N(dd.ExpdrOnTrforSaleAsset), cg=N(dd.CapGainUs50), wdvLast=N(dd.WDVLastDay);
      if(prop>0)anyDOAProp=true;

      /* A287 — item 17 = 5 + 8 − 3 − 4 − 7 − 16 (the schema floors a continuing
         block at 0; a negative is entered only when the block ceases — accept
         either the raw figure or its floored value). */
      const doaCg=realTot+realLess-wdv-add180-addLess-expTr;
      A(287, REQ(cg, doaCg) || REQ(cg, Math.max(0, doaCg)),
        "Schedule DOA ("+blk.lbl+"): item 17 (capital gain u/s 50) must equal 5 + 8 − 3 − 4 − 7 − 16.");
      /* A288 — item 6 = MAX(0, 3 + 4 − 5). */
      A(288, REQ(full, Math.max(0, wdv+add180-realTot)),
        "Schedule DOA ("+blk.lbl+"): item 6 (amount at full rate) must equal 3 + 4 − 5, or 0 if negative.");
      /* A289 — item 9 = MAX(0, 7 − 8). */
      A(289, REQ(half, Math.max(0, addLess-realLess)),
        "Schedule DOA ("+blk.lbl+"): item 9 (amount at half rate) must equal 7 − 8, or 0 if negative.");
      /* A290 — item 12 = 10 + 11. */
      A(290, REQ(tot, depFull+depHalf),
        "Schedule DOA ("+blk.lbl+"): item 12 (total depreciation) must equal 10 + 11.");
      /* A291 — item 14 = 12 − 13. */
      A(291, REQ(net, tot-disallow),
        "Schedule DOA ("+blk.lbl+"): item 14 (net aggregate depreciation) must equal 12 − 13.");
      /* A292 — item 10 = ROUND(6 × rate / 100). */
      A(292, REQ(depFull, Math.round(full*blk.r/100)),
        "Schedule DOA ("+blk.lbl+"): item 10 (depreciation at full rate) must match the rate at Sl. No. 2.");
      /* A293 — item 11 = ROUND(9 × rate / 200). */
      A(293, REQ(depHalf, Math.round(half*blk.r/200)),
        "Schedule DOA ("+blk.lbl+"): item 11 (depreciation at half rate) must match the rate at Sl. No. 2 (half rate).");
      /* A294/A295/A296/A297/A298/A299 — item 15 cannot exceed item 14. */
      A(blk.s15, prop<=net,
        "Schedule DOA ("+blk.lbl+"): item 15 (proportionate aggregate depreciation) cannot be more than item 14 (net aggregate depreciation).");
      /* A301 — where consideration exceeds opening WDV + additions, item 17
         must not be less than 5 + 8 − 3 − 4 − 7 − 16. */
      const excess=(realTot+realLess)-(wdv+add180+addLess);
      A(301, excess<=0 || cg >= (realTot+realLess-wdv-add180-addLess-expTr)-1,
        "Schedule DOA ("+blk.lbl+"): capital gain u/s 50 (item 17) cannot be less than 5 + 8 − 3 − 4 − 7 − 16 when consideration exceeds opening WDV and additions.");
      /* A302 — if item 17 is non-zero, items 10–15 and 18 = 0. */
      A(302, cg===0 || (depFull===0&&depHalf===0&&tot===0&&disallow===0&&net===0&&prop===0&&wdvLast===0),
        "Schedule DOA ("+blk.lbl+"): when capital gain u/s 50 (item 17) is non-zero, items 10–15 and 18 must all be 0.");
      /* A303 — if item 17 is 0, item 18 = 7 − 8 + 3 + 4 − 5 − 12. */
      A(303, cg!==0 || REQ(wdvLast, addLess-realLess+wdv+add180-realTot-tot),
        "Schedule DOA ("+blk.lbl+"): when capital gain u/s 50 is 0, item 18 (closing WDV) must equal 7 − 8 + 3 + 4 − 5 − 12.");
    });
    /* A300 — item 15 (proportionate depreciation) is filled only for a
       business-organisation event within the same previous year. */
    A(300, !anyDOAProp || hasBusOrgPY,
      "Schedule DOA: item 15 (proportionate aggregate depreciation) is filled but there is no business-organisation event within the same previous year.");
  }

  /* =====================================================================
     Schedule DEP (summary of depreciation) — A304–A306
     ===================================================================== */
  if(I.ScheduleDEP){
    const PM=RG(I,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary",{})||{};
    const BL=RG(I,"ScheduleDEP.SummaryFromDeprSch.BuildingSummary",{})||{};
    const SU=RG(I,"ScheduleDEP.SummaryFromDeprSch",{})||{};

    /* A304 — total depreciation on plant & machinery = 1a + 1b + 1c + 1d. */
    A(304, REQ(N(PM.TotPlntMach), N(PM.DeprBlockTot15Percent)+N(PM.DeprBlockTot30Percent)+N(PM.DeprBlockTot40Percent)+N(PM.DeprBlockTot45Percent)),
      "Schedule DEP: total depreciation on plant and machinery (1e) must equal 1a + 1b + 1c + 1d.");
    /* A305 — total depreciation on building = 2a + 2b + 2c. */
    A(305, REQ(N(BL.TotBuildng), N(BL.DeprBlockTot5Percent)+N(BL.DeprBlockTot10Percent)+N(BL.DeprBlockTot40Percent)),
      "Schedule DEP: total depreciation on building (2d) must equal 2a + 2b + 2c.");
    /* A306 — total depreciation = 1e + 2d + 3 + 4 + 5. */
    A(306, REQ(N(SU.TotalDepreciation), N(PM.TotPlntMach)+N(BL.TotBuildng)+N(SU.FurnitureSummary)+N(SU.IntangibleAssetSummary)+N(SU.ShipsSummary)),
      "Schedule DEP: total depreciation must equal 1e + 2d + 3 + 4 + 5.");
  }
});
