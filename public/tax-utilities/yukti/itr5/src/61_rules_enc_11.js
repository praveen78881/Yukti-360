/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 11.
   Serials 501–532 (books/ITR-5/rules.json), covering Schedule OS item-10
   quarterly reconciliations (501–503) and Schedule CYLA — set-off of the
   current year's losses (504–532).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / (X||{})); nothing throws; every block guards
   to a no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_os.js (expOs — ScheduleOS) and
   forms/ITR-5/src/70_sec_loss.js (expLoss — ScheduleCYLA), with the
   cross-schedule source figures read (never written) from
   70_sec_hp.js (ScheduleHP.TotalIncomeChargeableUnHP),
   70_sec_bp.js (CorpScheduleBP.BusinessIncOthThanSpec / BusSetoffCurrYr)
   and 70_sec_cg.js (ScheduleCG.CurrYrLosses — item E). Cross-checked
   against the books.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];

  /* ===================================================================
     SCHEDULE OS · item 10 — quarterly break-up reconciliations (501-503)
     Each item-10 row is exported as ScheduleOS.<Obj>.DateRange with the
     five standard period leaves; the annual figure it feeds lives in
     ScheduleOS.IncOthThanOwnRaceHorse. (Rule 491 in batch 10 tied the
     lottery row to 2a(i); these tie the online-games row to 2a(ii) and
     the 3b dividend row to 1a(iii).)
     =================================================================== */
  if(I.ScheduleOS){
    const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const qsum=o=>{const dr=RG(I,"ScheduleOS."+o+".DateRange",{})||{};
      return ["Upto15Of6","Up16Of6To15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"].reduce((a,k)=>a+N(dr[k]),0);};
    /* 501: quarterly break-up of winnings from online games (item 10) = 2a(ii) u/s 115BBJ */
    A(501,REQ(qsum("IncFrmOnGames"),N(io.IncChrgblUs115BBJ)),"Schedule OS: the quarterly break-up (item 10) of winnings from any online game chargeable u/s 115BBJ must equal item 2a(ii).");
    /* 502: not mappable — see the not-mappable note at the foot of this batch. */
    /* 503: quarterly break-up of dividend at 3b = 1a(iii) dividend u/s 2(22)(f) */
    A(503,REQ(qsum("DividendIncUs115BBDAaiii"),N(io.Dividend22f)),"Schedule OS: the quarterly break-up (item 10, row 3b) of dividend income referred in Sl. No. 1a(iii) must equal item 1a(iii).");
  }

  /* ===================================================================
     SCHEDULE CYLA · set-off of the current year's losses (504-532)
     Per-head blocks (each {IncCYLA:{...}}) keyed by the schema block name;
     column meanings: 1 IncOfCurYrUnderThatHead · 2 HPlossCurYrSetoff ·
     3 BusLossSetoff · 4 OthSrcLossNoRaceHorseSetoff · 5 IncOfCurYrAfterSetOff.
     Row-i "loss to be set off": TotalCurYr.{TotHPlossCurYr, TotBusLoss,
     TotOthSrcLossNoRaceHorse}. Row-xvi totals: TotalLossSetOff.*. Row-xvii
     remaining: LossRemAftSetOff.*.
     =================================================================== */
  if(I.ScheduleCYLA){
    const CY=I.ScheduleCYLA;
    const blk=k=>RG(CY,k+".IncCYLA",{})||{};
    /* the thirteen CYLA head-block keys, book row order (70_sec_loss.js LOSS_ROWS[2]) */
    const KEYS=["HP","BusProfExclSpecProf","SpeculationIncome","SpecifiedBusIncome",
      "STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate",
      "OthSrcExclRaceHorseLottery","ProfitFrmRaceHorse","IncOSDTAA"];

    const tHP =N(RG(CY,"TotalCurYr.TotHPlossCurYr"));
    const tBus=N(RG(CY,"TotalCurYr.TotBusLoss"));
    const tOS =N(RG(CY,"TotalCurYr.TotOthSrcLossNoRaceHorse"));
    const sHP =N(RG(CY,"TotalLossSetOff.TotHPlossCurYrSetoff"));
    const sBus=N(RG(CY,"TotalLossSetOff.TotBusLossSetoff"));
    const sOS =N(RG(CY,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"));
    const rHP =N(RG(CY,"LossRemAftSetOff.BalHPlossCurYrAftSetoff"));
    const rBus=N(RG(CY,"LossRemAftSetOff.BalBusLossAftSetoff"));
    const rOS =N(RG(CY,"LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff"));
    /* per-head sums of each set-off column (blocks without a column read 0) */
    const sumHP =KEYS.reduce((a,k)=>a+N(blk(k).HPlossCurYrSetoff),0);
    const sumBus=KEYS.reduce((a,k)=>a+N(blk(k).BusLossSetoff),0);
    const sumOS =KEYS.reduce((a,k)=>a+N(blk(k).OthSrcLossNoRaceHorseSetoff),0);

    /* --- internal CYLA arithmetic (all within Schedule CYLA) --- */
    /* 504: total HP loss set off (2xvi) cannot exceed ₹2,00,000 (s.71(3A)) */
    A(504,sHP<=200001,"Schedule CYLA: the total house-property loss set off at 2xvi cannot exceed ₹2,00,000.");
    /* 508: 2xvi = Σ column-2 HP loss set off, up to ₹2,00,000 */
    A(508,REQ(sHP,Math.min(sumHP,200000)),"Schedule CYLA: the total house-property loss set off at 2xvi must equal the sum of the column-2 set-offs, to a maximum of ₹2,00,000.");
    /* 509: 3xvi = Σ column-3 business loss set off */
    A(509,REQ(sBus,sumBus),"Schedule CYLA: the total business loss set off at 3xvi must equal the sum of the column-3 set-offs.");
    /* 510: 4xvi (column 4) = Σ of the per-row column-4 set-offs (ii … xv) */
    A(510,REQ(sOS,sumOS),"Schedule CYLA: the total loss set off at xvi of column 4 must equal the sum of the per-row column-4 set-offs.");
    /* 511: 2xvii = 2i − 2xvi */
    A(511,REQ(rHP,tHP-sHP),"Schedule CYLA: the house-property loss remaining after set-off (2xvii) must equal 2i − 2xvi.");
    /* 512: 3xvii = 3i − 3xvi */
    A(512,REQ(rBus,tBus-sBus),"Schedule CYLA: the business loss remaining after set-off (3xvii) must equal 3i − 3xvi.");
    /* 513: 4xvii = 4i − 4xvi */
    A(513,REQ(rOS,tOS-sOS),"Schedule CYLA: the loss remaining after set-off (4xvii) of column 4 must equal 4i − 4xvi.");
    /* 514 & 527: per head, col5 = col1 − col2 − col3 − col4; and col2+col3+col4 ≤ col1 */
    KEYS.forEach(function(k){const b=blk(k);
      const c1=N(b.IncOfCurYrUnderThatHead),c2=N(b.HPlossCurYrSetoff),
            c3=N(b.BusLossSetoff),c4=N(b.OthSrcLossNoRaceHorseSetoff),c5=N(b.IncOfCurYrAfterSetOff);
      A(514,REQ(c5,c1-c2-c3-c4),"Schedule CYLA ["+k+"]: the current year's income remaining after set-off (col 5) must equal col 1 − col 2 − col 3 − col 4.");
      A(527,c2+c3+c4<=c1+1,"Schedule CYLA ["+k+"]: the sum of the set-offs (col 2 + col 3 + col 4) cannot exceed the income of the current year (col 1).");
    });
    /* 528: under the new tax regime a house-property loss cannot be set off (rule 2640) */
    const newReg=String(RG(I,"PartA_GEN1.FilingStatus.OptOldRegimeCurrAY",""))==="N";
    A(528,!newReg||sHP<=1,"Schedule CYLA: under the new tax regime a house-property loss cannot be adjusted against any other head.");

    /* --- CYLA col-1 income / row-i loss = its source schedule figure --- */
    /* 505: HP loss to be set off (2i) = Schedule HP income when it is a loss */
    if(I.ScheduleHP)
      A(505,REQ(tHP,Math.max(0,-N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP")))),"Schedule CYLA: the house-property loss claimed at 2i must equal the loss shown in Schedule HP.");
    /* OS-sourced rows (507, 522, 523, 524) */
    if(I.ScheduleOS){
      const os6=N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse"));
      /* 507: OS loss to be set off (4i) = Sl.No.6 of Schedule OS when it is a loss */
      A(507,REQ(tOS,Math.max(0,-os6)),"Schedule CYLA: the other-sources loss at 4i must equal Sl. No. 6 of Schedule OS when it is a loss.");
      /* 522: normal OS income (1xiii) = Sl.No.6 of Schedule OS */
      A(522,REQ(N(blk("OthSrcExclRaceHorseLottery").IncOfCurYrUnderThatHead),Math.max(0,os6)),"Schedule CYLA: the other-sources income at 1xiii must equal Sl. No. 6 of Schedule OS.");
      /* 523: race-horse income (1xiv) = Sl.No.8e of Schedule OS */
      A(523,REQ(N(blk("ProfitFrmRaceHorse").IncOfCurYrUnderThatHead),Math.max(0,N(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse")))),"Schedule CYLA: the profit from owning/maintaining race horses at 1xiv must equal Sl. No. 8e of Schedule OS.");
      /* 524: OS-DTAA income = Sl.No.2e of Schedule OS */
      A(524,REQ(N(blk("IncOSDTAA").IncOfCurYrUnderThatHead),Math.max(0,N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.TotalAmtTaxUsDTAASchOs")))),"Schedule CYLA: the other-sources income taxable at special rates as per DTAA must equal Sl. No. 2e of Schedule OS.");
    }
    /* BP-sourced rows (506, 515, 516, 517) */
    if(I.CorpScheduleBP){
      /* 506: business loss to be set off (3i) = 2vi of Table E of Schedule BP */
      A(506,REQ(tBus,N(RG(I,"CorpScheduleBP.BusSetoffCurrYr.LossRemainSetOffOnBus"))),"Schedule CYLA: the business loss at 3i must equal Sl. No. 2vi of Table E of Schedule BP.");
      /* 515: business income (1iii) = A37 of Schedule BP, only when A37 is positive */
      A(515,REQ(N(blk("BusProfExclSpecProf").IncOfCurYrUnderThatHead),Math.max(0,N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C")))),"Schedule CYLA: the business income at 1iii must equal A37 of Schedule BP (only when A37 is positive).");
      /* 516: speculative income = 3ii of Table E of Schedule BP */
      A(516,REQ(N(blk("SpeculationIncome").IncOfCurYrUnderThatHead),Math.max(0,N(RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpeculativeInc.IncOfCurYrAfterSetOff")))),"Schedule CYLA: the speculative income must equal Sl. No. 3ii of Table E of Schedule BP.");
      /* 517: specified-business income = 3iii of Table E of Schedule BP */
      A(517,REQ(N(blk("SpecifiedBusIncome").IncOfCurYrUnderThatHead),Math.max(0,N(RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpecifiedInc.IncOfCurYrAfterSetOff")))),"Schedule CYLA: the specified-business income must equal Sl. No. 3iii of Table E of Schedule BP.");
    }
    /* CG-sourced rows (518, 519, 520, 521, 531, 532) — item E of Schedule CG */
    if(I.ScheduleCG){
      const cg=k=>N(RG(I,"ScheduleCG.CurrYrLosses."+k+".CurrYrCapGain"));
      /* 531: STCG @20% = 8ii of item E */
      A(531,REQ(N(blk("STCG20Per").IncOfCurYrUnderThatHead),cg("InStcg20Per")),"Schedule CYLA: the short-term capital gain taxable @20% must equal item E of Schedule CG (STCG @20%).");
      /* 518: STCG @30% = item E */
      A(518,REQ(N(blk("STCG30Per").IncOfCurYrUnderThatHead),cg("InStcg30Per")),"Schedule CYLA: the short-term capital gain taxable @30% must equal item E of Schedule CG (STCG @30%).");
      /* 519: STCG at applicable rates = 8iv of item E */
      A(519,REQ(N(blk("STCGAppRate").IncOfCurYrUnderThatHead),cg("InStcgAppRate")),"Schedule CYLA: the short-term capital gain taxable at applicable rates must equal Sl. No. 8iv of item E of Schedule CG.");
      /* 520: STCG at DTAA special rate = 8v of item E */
      A(520,REQ(N(blk("STCGDTAARate").IncOfCurYrUnderThatHead),cg("InStcgDTAARate")),"Schedule CYLA: the short-term capital gain taxable at special rates as per DTAA must equal Sl. No. 8v of item E of Schedule CG.");
      /* 521: LTCG at DTAA special rate = 8viii of item E */
      A(521,REQ(N(blk("LTCGDTAARate").IncOfCurYrUnderThatHead),cg("InLtcgDTAARate")),"Schedule CYLA: the long-term capital gain taxable at special rates as per DTAA must equal Sl. No. 8viii of item E of Schedule CG.");
      /* 532: LTCG @12.5% = 8vi of item E */
      A(532,REQ(N(blk("LTCG12_5Per").IncOfCurYrUnderThatHead),cg("InLtcg12_5Per")),"Schedule CYLA: the long-term capital gain taxable @12.5% must equal Sl. No. 8vi of item E of Schedule CG.");
    }
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     502 — item-10 quarterly break-up of "Dividend income under proviso to
           sec 115A(1)(a)(A) @10% (incl. PTI)" "should be equal to Sl. No.
           2c and 2d of Schedule OS". As with 496–499 in batch 10, the
           schema does not link this specific item-10 dividend category to a
           particular 2c/2d source-code amount (the 2c/2d rows carry OS/PTI
           section codes with no verifiable enum→category mapping), so a
           literal encoding would false-fire on lawful returns.
     525 — "Normal OS loss should be set off first against (i) profit from
           owning/maintaining race horses & (ii) OS-DTAA income." This is a
           set-off ORDERING / priority rule of the greedy set-off walk, not
           a static arithmetic identity; it cannot be asserted from the
           exported per-head figures without re-deriving the walk, and any
           proxy would false-fire around the head-priority. Left to the
           schedule's own engine (CY_ORDER_OS in 70_sec_loss.js).
     526 — "Whole house-property loss can be set off against any head in
           case income is more than loss." A completeness rule about the
           greedy walk; whether the "whole" loss is absorbed also depends on
           the ₹2,00,000 s.71(3A) cap and the new-regime lapse, so a static
           equality would false-fire (a lawful return legitimately carries
           the excess over ₹2,00,000 to CFL). Not offline-checkable as an
           identity.
     529 — "Whole business loss can be set off against any head in case
           income is more than loss." Same completeness/ordering nature as
           526; not a verifiable static identity without re-deriving the
           set-off walk.
     530 — "Whole OS loss can be set off against any head in case income is
           more than loss." Same completeness/ordering nature as 526/529;
           not a verifiable static identity (a normal OS loss not set off
           here lawfully lapses).
     ------------------------------------------------------------------ */
});
