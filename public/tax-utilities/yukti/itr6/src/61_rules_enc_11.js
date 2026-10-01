/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_11 (Phase 6).
   Serial range A507–A556 — the loss chain: Schedule CYLA (A507–A527),
   Schedule BFLA (A528–A555) and Schedule CFL (A556).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG / N /
   (X||{})); nothing throws. Keys are the built-return ITR6 schema paths
   (ScheduleCYLA / ScheduleBFLA / ScheduleCFL, and the cross-schedule feeds
   CorpScheduleBP / ScheduleCG / ScheduleOS / ITRScheduleUD), taken from
   sources/ITR-6 schema, books/ITR-6/CYLA_BFLA.md, CFL.md and
   Unabsorbed_Depreciation.md, and the built section 70_sec_loss. Encoded
   from each rule's own text (constitution rule 6). REQ(a,b) is |a−b| ≤ 1;
   a zero-skeleton foots 0==0, so an empty return never fires.

   Note on A551: its rule text cites CFL "11(xvii)", but semantically the
   BFLA col-2 amount set off equals CFL row xviii ("Adjustment of above
   losses in Schedule BFLA") — the value BFLA feeds back — not row xvii
   (total b/f before set-off), which equals the set-off only when the loss
   is fully utilised. Encoding against xvii would fire on a lawful,
   partially-utilised return. It is therefore encoded against row xviii
   (AdjTotBFLossInBFLA), consistent with A528/A554/A555 and CYLA_BFLA.md §8.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};

  /* =====================================================================
     Schedule CYLA — current-year loss adjustment (A507–A527).
     Fifteen live head rows (ii–xv), five columns:
       1 IncOfCurYrUnderThatHead · 2 HPlossCurYrSetoff · 3 BusLossSetoff ·
       4 OthSrcLossNoRaceHorseSetoff · 5 IncOfCurYrAfterSetOff.
     Row objects are <Head>.IncCYLA; columns absent on a row read 0.
     ===================================================================== */
  if(I.ScheduleCYLA){
    const CY=RG(I,"ScheduleCYLA",{})||{};
    const TCY=RG(CY,"TotalCurYr",{})||{};
    const TLS=RG(CY,"TotalLossSetOff",{})||{};
    const LRA=RG(CY,"LossRemAftSetOff",{})||{};
    const cyc=k=>RG(CY,k+".IncCYLA",{})||{};
    /* head objects in Sl.No row order ii … xv */
    const CROWS=["HP","BusProfExclSpecProf","ProfGainUs115B","SpeculationIncome",
      "SpecifiedBusIncome","STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate",
      "LTCG12_5Per","LTCGDTAARate","OthSrcExclRaceHorseLottery","ProfitFrmRaceHorse","IncOSDTAA"];
    const CLBL=["house property","business (excl. speculation/specified)","115B life-insurance business",
      "speculative business","specified business","STCG @20%","STCG @30%","STCG at applicable rates",
      "STCG at DTAA rates","LTCG @12.5%","LTCG at DTAA rates","other sources (normal)",
      "race horses","other sources (DTAA)"];

    /* A507 — 3xvii (business loss remaining) = 3i − 3xvi (total in − total set off). */
    A(507, REQ(LRA.BalBusLossAftSetoff, N(TCY.TotBusLoss)-N(TLS.TotBusLossSetoff)),
      "Schedule CYLA: 3xvii (business loss remaining after set-off) must equal 3i − 3xvi.");

    /* A508 — 4xvii (other-sources loss remaining) = 4i − 4xvi. */
    A(508, REQ(LRA.BalOthSrcLossNoRaceHorseAftSetoff, N(TCY.TotOthSrcLossNoRaceHorse)-N(TLS.TotOthSrcLossNoRaceHorseSetoff)),
      "Schedule CYLA: 4xvii (other-sources loss remaining after set-off) must equal 4i − 4xvi.");

    /* A509 — per row, col 5 = col 1 − col 2 − col 3 − col 4. */
    CROWS.forEach(function(k,i){ const o=cyc(k);
      A(509, REQ(o.IncOfCurYrAfterSetOff, N(o.IncOfCurYrUnderThatHead)-N(o.HPlossCurYrSetoff)-N(o.BusLossSetoff)-N(o.OthSrcLossNoRaceHorseSetoff)),
        "Schedule CYLA: current-year income remaining after set-off (column 5) of row "+CLBL[i]+" must equal column 1 − 2 − 3 − 4.");
    });

    /* A510 — 1v Speculative income = 3ii of Table E, Schedule BP. */
    A(510, REQ(cyc("SpeculationIncome").IncOfCurYrUnderThatHead, RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpeculativeInc.IncOfCurYrAfterSetOff")),
      "Schedule CYLA: 1v (speculative income) must equal 3ii of Table E of Schedule BP.");

    /* A511 — 1vi Specified-business income = 3iii of Table E, Schedule BP. */
    A(511, REQ(cyc("SpecifiedBusIncome").IncOfCurYrUnderThatHead, RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpecifiedInc.IncOfCurYrAfterSetOff")),
      "Schedule CYLA: 1vi (specified-business income) must equal 3iii of Table E of Schedule BP.");

    /* A512 — 1vii STCG@20% = 8ii of item E, Schedule CG. */
    A(512, REQ(cyc("STCG20Per").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcg20Per.CurrYrCapGain")),
      "Schedule CYLA: 1vii (STCG @20%) must equal 8ii of item E of Schedule CG.");

    /* A513 — 1viii STCG@30% = 8iii of item E, Schedule CG. */
    A(513, REQ(cyc("STCG30Per").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcg30Per.CurrYrCapGain")),
      "Schedule CYLA: 1viii (STCG @30%) must equal 8iii of item E of Schedule CG.");

    /* A514 — 1ix STCG at applicable rates = 8iv of item E, Schedule CG. */
    A(514, REQ(cyc("STCGAppRate").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcgAppRate.CurrYrCapGain")),
      "Schedule CYLA: 1ix (STCG at applicable rates) must equal 8iv of item E of Schedule CG.");

    /* A515 — 1x STCG at DTAA rates = 8v of item E, Schedule CG. */
    A(515, REQ(cyc("STCGDTAARate").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcgDTAARate.CurrYrCapGain")),
      "Schedule CYLA: 1x (STCG at special/DTAA rates) must equal 8v of item E of Schedule CG.");

    /* A516 — 1xi LTCG@12.5% = 8vi of item E, Schedule CG. */
    A(516, REQ(cyc("LTCG12_5Per").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InLtcg12_5Per.CurrYrCapGain")),
      "Schedule CYLA: 1xi (LTCG @12.5%) must equal 8vi of item E of Schedule CG.");

    /* A517 — 1xii LTCG at DTAA rates = 8vii of item E, Schedule CG. */
    A(517, REQ(cyc("LTCGDTAARate").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InLtcgDTAARate.CurrYrCapGain")),
      "Schedule CYLA: 1xii (LTCG at special/DTAA rates) must equal 8vii of item E of Schedule CG.");

    /* A518 — 1xiii Other-sources (normal) income = 6 of Schedule OS (nil if negative). */
    A(518, REQ(cyc("OthSrcExclRaceHorseLottery").IncOfCurYrUnderThatHead, Math.max(0,N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),
      "Schedule CYLA: 1xiii (other-sources income at normal rates) must equal item 6 of Schedule OS.");

    /* A519 — 1xiv Profit from owning/maintaining race horses = 8e of Schedule OS (nil if negative). */
    A(519, REQ(cyc("ProfitFrmRaceHorse").IncOfCurYrUnderThatHead, Math.max(0,N(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse")))),
      "Schedule CYLA: 1xiv (profit from owning and maintaining race horses) must equal 8e of Schedule OS.");

    /* A520 — 1iii Business income = A38 of Schedule BP, only when A38 is positive. */
    var A38=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C"));
    A(520, A38<=0 || REQ(cyc("BusProfExclSpecProf").IncOfCurYrUnderThatHead, A38),
      "Schedule CYLA: 1iii (business income) must equal A38 of Schedule BP when A38 is positive.");

    /* A521 — 1iv 115B income = E3iv of Schedule BP (Table E row iv, column 3). */
    A(521, REQ(cyc("ProfGainUs115B").IncOfCurYrUnderThatHead, RG(I,"CorpScheduleBP.BusSetoffCurrYr.ProfGainUs115B.IncOfCurYrAfterSetOff")),
      "Schedule CYLA: 1iv (115B life-insurance income) must equal E3iv of Schedule BP.");

    /* A522 — 2xvi (total HP loss set off) = sum of column 2 over rows iii … xv. */
    A(522, REQ(TLS.TotHPlossCurYrSetoff, CROWS.slice(1).reduce(function(a,k){return a+N(cyc(k).HPlossCurYrSetoff);},0)),
      "Schedule CYLA: 2xvi (total HP loss set off) must equal 2iii + 2iv + … + 2xv.");

    /* A523 — 3xvi (total business loss set off) = 3ii + 3vii + 3viii + … + 3xv
       (the rows that carry a business-loss column: ii and vii–xv). */
    var busIdx=[0,5,6,7,8,9,10,11,12,13];
    A(523, REQ(TLS.TotBusLossSetoff, busIdx.reduce(function(a,i){return a+N(cyc(CROWS[i]).BusLossSetoff);},0)),
      "Schedule CYLA: 3xvi (total business loss set off) must equal 3ii + 3vii + 3viii + 3ix + 3x + 3xi + 3xii + 3xiii + 3xiv + 3xv.");

    /* A524 — 1xv Other-sources (DTAA) income = 2e of Schedule OS. */
    A(524, REQ(cyc("IncOSDTAA").IncOfCurYrUnderThatHead, RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.TotalAmtTaxUsDTAASchOs")),
      "Schedule CYLA: 1xv (other-sources income at special/DTAA rates) must equal 2e of Schedule OS.");

    /* A525 — normal OS loss must be set off first against (i) race-horse profit
       and (ii) OS-DTAA income: if OS loss remains, those two rows must be fully
       absorbed (no income left there that the loss could have taken). */
    A(525, N(LRA.BalOthSrcLossNoRaceHorseAftSetoff)<=0 ||
        (N(cyc("ProfitFrmRaceHorse").IncOfCurYrAfterSetOff)<=0 && N(cyc("IncOSDTAA").IncOfCurYrAfterSetOff)<=0),
      "Schedule CYLA: normal other-sources loss must be set off first against race-horse profit and other-sources DTAA income.");

    /* A526 — a HP loss may not be carried forward while income is available and
       the ₹2,00,000 cap is not yet reached: if HP loss remains, either the cap
       is hit or no non-HP income remains to absorb it. */
    var incRemNonHP=CROWS.slice(1).reduce(function(a,k){return a+N(cyc(k).IncOfCurYrAfterSetOff);},0);
    A(526, N(LRA.BalHPlossCurYrAftSetoff)<=0 || N(TLS.TotHPlossCurYrSetoff)>=200000 || incRemNonHP<=0,
      "Schedule CYLA: the current-year house-property loss is not fully set off although income is available and the ₹2,00,000 cap is not reached.");

    /* A527 — per row, column 2 + 3 + 4 must not exceed column 1. */
    CROWS.forEach(function(k,i){ var o=cyc(k);
      A(527, N(o.HPlossCurYrSetoff)+N(o.BusLossSetoff)+N(o.OthSrcLossNoRaceHorseSetoff) <= N(o.IncOfCurYrUnderThatHead)+1,
        "Schedule CYLA: the loss set off (columns 2 + 3 + 4) of row "+CLBL[i]+" cannot exceed its income (column 1).");
    });
  }

  /* =====================================================================
     Schedule BFLA — brought-forward loss adjustment (A528–A555).
     Fourteen live head rows (i … xiv), five columns:
       1 IncOfCurYrUndHeadFromCYLA · 2 BFlossPrevYrUndSameHeadSetoff ·
       3 BFUnabsorbedDeprSetoff · 4 BFAllUs35Cl4Setoff ·
       5 IncOfCurYrAfterSetOffBFLosses.  Column 2 is absent on the two
     other-sources rows (xii OS normal, xiv OS DTAA).
     ===================================================================== */
  if(I.ScheduleBFLA){
    const BF=RG(I,"ScheduleBFLA",{})||{};
    const BFT=RG(BF,"TotalBFLossSetOff",{})||{};
    const bfr=k=>RG(BF,k+".IncBFLA",{})||{};
    /* head objects in Sl.No row order i … xiv */
    const BROWS=["HP","BusProfExclSpecProf","ProfGainUs115B","SpeculationIncome",
      "SpecifiedBusIncome","STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate",
      "LTCG12_5Per","LTCGDTAARate","OthSrcExclRaceHorse","ProfitFrmRaceHorse","IncOSDTAA"];
    const BLBL=["house property","business (excl. speculation/specified)","115B life-insurance business",
      "speculative business","specified business","STCG @20%","STCG @30%","STCG at applicable rates",
      "STCG at DTAA rates","LTCG @12.5%","LTCG at DTAA rates","other sources (normal)",
      "race horses","other sources (DTAA)"];
    /* CFL summary rows read back for the brought-forward cross-checks */
    const cflAdj=RG(I,"ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail",{})||{};
    /* matching CYLA column-5 reader for the A537–A550 feed */
    const cyr=k=>RG(I,"ScheduleCYLA."+k+".IncCYLA",{})||{};

    /* A528 — 2(i) brought-forward HP loss = 4(xviii) of CFL. */
    A(528, REQ(bfr("HP").BFlossPrevYrUndSameHeadSetoff, cflAdj.TotalHPPTILossCF),
      "Schedule BFLA: 2(i) brought-forward house-property loss must equal 4(xviii) of Schedule CFL.");

    /* A529 — per row, column 2 + 3 + 4 must not exceed column 1. */
    BROWS.forEach(function(k,i){ var o=bfr(k);
      A(529, N(o.BFlossPrevYrUndSameHeadSetoff)+N(o.BFUnabsorbedDeprSetoff)+N(o.BFAllUs35Cl4Setoff) <= N(o.IncOfCurYrUndHeadFromCYLA)+1,
        "Schedule BFLA: the set-off (columns 2 + 3 + 4) of row "+BLBL[i]+" cannot exceed its income (column 1).");
    });

    /* A530 — 2(xv) total brought-forward loss set off must not exceed the sum of
       CFL row xviii (adjustment in BFLA) across columns 4c/5c/6/7/8/9/10/11. */
    var cflAdjSum=N(cflAdj.TotalHPPTILossCF)+N(cflAdj.BroughtFrwdBusLossSetOffDrYr)+N(cflAdj.LossFrmSpecBusCF)
      +N(cflAdj.LossFrmSpecifiedBusCF)+N(cflAdj.LossFrmLifeInsBusUs115B)+N(cflAdj.TotalSTCGPTILossCF)
      +N(cflAdj.TotalLTCGPTILossCF)+N(cflAdj.OthSrcLossRaceHorseCF);
    A(530, N(BFT.TotBFLossSetoff) <= cflAdjSum+1,
      "Schedule BFLA: 2(xv) total brought-forward loss set off cannot exceed 4xviii + 5cxviii + 6xviii + 7xviii + 8xviii + 9xviii + 10xviii + 11xviii of Schedule CFL.");

    /* A531 — per row, column 5 = column 1 − 2 − 3 − 4. */
    BROWS.forEach(function(k,i){ var o=bfr(k);
      A(531, REQ(o.IncOfCurYrAfterSetOffBFLosses, N(o.IncOfCurYrUndHeadFromCYLA)-N(o.BFlossPrevYrUndSameHeadSetoff)-N(o.BFUnabsorbedDeprSetoff)-N(o.BFAllUs35Cl4Setoff)),
        "Schedule BFLA: income remaining after set-off (column 5) of row "+BLBL[i]+" must equal column 1 − 2 − 3 − 4.");
    });

    /* A532 — per row, column 5 must not exceed column 1. */
    BROWS.forEach(function(k,i){ var o=bfr(k);
      A(532, N(o.IncOfCurYrAfterSetOffBFLosses) <= N(o.IncOfCurYrUndHeadFromCYLA)+1,
        "Schedule BFLA: income remaining after set-off (5) of row "+BLBL[i]+" cannot exceed its income (1).");
    });

    /* A533 — 2xv (total brought-forward loss set off) = sum of column 2 over the
       rows that carry it (i … xi and xiii; the two OS rows have no column 2). */
    var bfLossIdx=[0,1,2,3,4,5,6,7,8,9,10,12];
    A(533, REQ(BFT.TotBFLossSetoff, bfLossIdx.reduce(function(a,i){return a+N(bfr(BROWS[i]).BFlossPrevYrUndSameHeadSetoff);},0)),
      "Schedule BFLA: 2xv must equal 2i + 2ii + 2iii + 2iv + 2v + 2vi + 2vii + 2viii + 2ix + 2x + 2xi + 2xiii.");

    /* A534 — 5xvi (income remaining, gross total income) = sum of column 5 over
       rows i … xiv. */
    A(534, REQ(BF.IncomeOfCurrYrAftCYLABFLA, BROWS.reduce(function(a,k){return a+N(bfr(k).IncOfCurYrAfterSetOffBFLosses);},0)),
      "Schedule BFLA: 5xvi (current-year income remaining after set-off) must equal the sum of 5i … 5xiv.");

    /* A535 — 4xv (total s.35(4) allowance set off) = total of Col 7 of Schedule UD. */
    A(535, REQ(BFT.TotAllUs35cl4Setoff, RG(I,"ITRScheduleUD.TotCurYrAllowSetoffInc")),
      "Schedule BFLA: 4xv (total brought-forward allowance u/s 35(4) set off) must equal the total of Col 7 of Schedule UD.");

    /* A536 — 3xv (total brought-forward depreciation set off) = total of Col 4 of Schedule UD. */
    A(536, REQ(BFT.TotUnabsorbedDeprSetoff, RG(I,"ITRScheduleUD.TotCurYrdepritSetoffInc")),
      "Schedule BFLA: 3xv (total brought-forward depreciation set off) must equal the total of Col 4 of Schedule UD.");

    /* A537–A550 — BFLA column 1 of each row = matching CYLA column 5.
       [BFLA head, CYLA head, label] — the OS-normal keys differ by schedule. */
    var FEED=[
      [537,"HP","HP","house property"],
      [538,"BusProfExclSpecProf","BusProfExclSpecProf","business"],
      [539,"ProfGainUs115B","ProfGainUs115B","115B life-insurance business"],
      [540,"SpeculationIncome","SpeculationIncome","speculative business"],
      [541,"SpecifiedBusIncome","SpecifiedBusIncome","specified business"],
      [542,"STCG20Per","STCG20Per","STCG @20%"],
      [543,"STCG30Per","STCG30Per","STCG @30%"],
      [544,"STCGAppRate","STCGAppRate","STCG at applicable rates"],
      [545,"STCGDTAARate","STCGDTAARate","STCG at DTAA rates"],
      [546,"LTCG12_5Per","LTCG12_5Per","LTCG @12.5%"],
      [547,"LTCGDTAARate","LTCGDTAARate","LTCG at DTAA rates"],
      [548,"OthSrcExclRaceHorse","OthSrcExclRaceHorseLottery","other sources (normal)"],
      [549,"ProfitFrmRaceHorse","ProfitFrmRaceHorse","race horses"],
      [550,"IncOSDTAA","IncOSDTAA","other sources (DTAA)"]];
    FEED.forEach(function(f){
      A(f[0], REQ(bfr(f[1]).IncOfCurYrUndHeadFromCYLA, cyr(f[2]).IncOfCurYrAfterSetOff),
        "Schedule BFLA: column 1 (income) of row "+f[3]+" must equal the matching Schedule CYLA column 5 (income remaining after current-year set-off).");
    });

    /* A551 — 2(xiii) race-horse brought-forward loss set off = CFL row xviii
       (BFLA adjustment), race-horse column. (See header note re: xvii vs xviii.) */
    A(551, REQ(bfr("ProfitFrmRaceHorse").BFlossPrevYrUndSameHeadSetoff, cflAdj.OthSrcLossRaceHorseCF),
      "Schedule BFLA: 2(xiii) brought-forward race-horse loss set off must equal the race-horse column of the Schedule CFL 'adjustment in BFLA' row.");

    /* A552 — 3xv (total brought-forward depreciation set off) = sum of column 3
       over rows i … xiv. */
    A(552, REQ(BFT.TotUnabsorbedDeprSetoff, BROWS.reduce(function(a,k){return a+N(bfr(k).BFUnabsorbedDeprSetoff);},0)),
      "Schedule BFLA: 3xv must equal the sum of 3i … 3xiv.");

    /* A553 — 4xv (total s.35(4) allowance set off) = sum of column 4 over rows i … xiv. */
    A(553, REQ(BFT.TotAllUs35cl4Setoff, BROWS.reduce(function(a,k){return a+N(bfr(k).BFAllUs35Cl4Setoff);},0)),
      "Schedule BFLA: 4xv must equal the sum of 4i … 4xiv.");

    /* A554 — 2(vi+vii+viii+ix+x+xi) capital brought-forward loss set off =
       9(xviii) + 10(xviii) of CFL (STCG + LTCG adjustments in BFLA). */
    var capBF=[5,6,7,8,9,10].reduce(function(a,i){return a+N(bfr(BROWS[i]).BFlossPrevYrUndSameHeadSetoff);},0);
    A(554, REQ(capBF, N(cflAdj.TotalSTCGPTILossCF)+N(cflAdj.TotalLTCGPTILossCF)),
      "Schedule BFLA: 2(vi+vii+viii+ix+x+xi) must equal 9(xviii) + 10(xviii) of Schedule CFL.");

    /* A555 — 2(ii+iii+iv+v) business brought-forward loss set off =
       xviii(5+6+7+8) of CFL (business + speculative + specified + 115B). */
    var busBF=[1,2,3,4].reduce(function(a,i){return a+N(bfr(BROWS[i]).BFlossPrevYrUndSameHeadSetoff);},0);
    A(555, REQ(busBF, N(cflAdj.BroughtFrwdBusLossSetOffDrYr)+N(cflAdj.LossFrmSpecBusCF)+N(cflAdj.LossFrmSpecifiedBusCF)+N(cflAdj.LossFrmLifeInsBusUs115B)),
      "Schedule BFLA: 2(ii+iii+iv+v) (brought-forward business loss) must equal xviii(5+6+7+8) of Schedule CFL.");
  }

  /* =====================================================================
     Schedule CFL — carry forward of losses (A556).
     ===================================================================== */
  if(I.ScheduleCFL){
    /* A556 — current-year speculative loss in CFL (row xix, column 6) = the
       speculative-loss magnitude of Schedule BP (B43, AdjustedPLFrmSpecuBus,
       carried when negative). */
    var B43=N(RG(I,"CorpScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus"));
    A(556, REQ(RG(I,"ScheduleCFL.CurrentAYloss.LossSummaryDetail.LossFrmSpecBusCF"), Math.max(0,-B43)),
      "Schedule CFL: the current-year speculative loss must equal the speculative-loss (B43) figure of Schedule BP.");
  }
});
