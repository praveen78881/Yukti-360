/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_08 (Phase 6).
   Serial range A359–A408:
     · A359–A378 — Schedule CYLA (ScheduleCYLA): the current-year loss
                   set-off matrix — the "loss remaining" identity (col 4),
                   the three "loss to be adjusted" feeds (HP/BP/OS), the
                   col-1 income feeds (BP Table E, CG item E, OS 6/8e/2e),
                   the col-5 identity, the set-off-ordering rule and the
                   per-row col2+3+4 ≤ col1 constraint.
     · A379–A383 — Schedule PTI (SchedulePTI): the col-9 = col-7 − col-8
                   identity, the short-/long-term/other-sources subtotals,
                   and the receiving-schedule ≥ Σ-PTI lower bound (A383).
     · A384–A408 — Schedule SI (ScheduleSI): the special-rate feeds from
                   Schedule OS (2ai/2b/2e and the per-code 2c/2d lines), the
                   tax = rate × income identity, the tax-not-null rule, the
                   115AD/PTI-STCG@30% ≤ CYLA 5vi feed, and the two block
                   totals.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG / N /
   (X||{})); nothing throws. Keys are the built-return ITR7 schema paths
   (I = Object.values(buildReturn().ITR)[0]); every path was verified against
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json and the schedule books
   (books/ITR-7/Schedule_CYLA.md / Schedule_PTI.md / Schedule_SI.md /
   Schedule_OS.md / Schedule_CG.md / Schedule_BP.md / Schedule_HP.md).
   Encoded from each rule's own text (constitution rule 6).

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment. (e.g. A370's
   "…should be equal" is completed by A371's "to Sl.No.6 of Schedule OS…";
   A383's ">= sum of [9(i)…]" is completed by the head of A384; A386's
   "…Sl.No.2e of schedule" is completed by A387's leading "OS".)

   Cross-schedule "should match … after reducing DTAA income, if any" feeds
   (A384–A386, A389, A392–A408) are auto-populated as (source − DTAA), so on a
   lawful return SI[head] ≤ the gross figure in the feeding schedule. They are
   encoded as the safe upper bound  SI ≤ source (±1): silent on every lawful
   return, firing only when the SI head OVER-states the feeding schedule.
   Same-schedule arithmetic identities and totals use REQ (|a−b| ≤ 1).

   Every serial A359–A408 is ENFORCED-target in books/ITR-7/rule_census.md;
   none is NA/OFFLINE in this range, and none was re-filed OFFLINE-IMPOSSIBLE
   (every target field exists on the built return). Note on the A401/A402
   duplicate: rules.json carries the same "115AD(1)(i) … 2c of Schedule OS"
   text at both serials; Schedule-OS 2c ships both the interest code `5AD1i`
   and the dividend code `5AD1iDiv`, so A401 is keyed to the interest line and
   A402 to the dividend line.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const LE=(si,src)=>N(si)<=N(src)+1;                    /* safe upper bound */

  /* =====================================================================
     Schedule CYLA — current-year loss set-off (A359–A378).
     Head object: ScheduleCYLA.<Head>.IncCYLA.{IncOfCurYrUnderThatHead (col 1),
     HPlossCurYrSetoff (col 2), BusLossSetoff (col 3),
     OthSrcLossNoRaceHorseSetoff (col 4), IncOfCurYrAfterSetOff (col 5)}.
     TotalCurYr = the three "loss to be adjusted" feeds (row 6);
     TotalLossSetOff / LossRemAftSetOff = the xiv / xv total rows.
     ===================================================================== */
  if(I.ScheduleCYLA){
    const CY=RG(I,"ScheduleCYLA",{})||{};
    const TCY=RG(CY,"TotalCurYr",{})||{};
    const TLS=RG(CY,"TotalLossSetOff",{})||{};
    const LRA=RG(CY,"LossRemAftSetOff",{})||{};
    const cyc=k=>RG(CY,k+".IncCYLA",{})||{};
    /* the thirteen live head rows (i … xiii), in schema-key order */
    const CROWS=["HP","BusProfExclSpecProf","SpeculationIncome","SpecifiedBusIncome",
      "STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate",
      "OthSrcExclRaceHorseLottery","ProfitFrmRaceHorse","IncOSDTAA"];
    const CLBL=["house property","business (excl. speculation/specified)","speculative business",
      "specified business","STCG @20%","STCG @30%","STCG at applicable rates","STCG at DTAA rates",
      "LTCG @12.5%","LTCG at DTAA rates","other sources (normal)","race horses","other sources (DTAA)"];

    /* A359 — 4(xv) loss remaining = "loss to be adjusted" col 4 − 4(xiv). */
    A(359, REQ(LRA.BalOthSrcLossNoRaceHorseAftSetoff, N(TCY.TotOthSrcLossNoRaceHorse)-N(TLS.TotOthSrcLossNoRaceHorseSetoff)),
      "Schedule CYLA: the loss remaining after set-off (xv) of column 4 must equal the loss to be adjusted (column 4) − 4(xiv).");

    /* A360 — "loss to be adjusted" col 2 = Sl.No.3 of Schedule HP (the HP loss, nil if a profit). */
    A(360, REQ(TCY.TotHPlossCurYr, Math.max(0,-N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP")))),
      "Schedule CYLA: the house-property loss to be set off (column 2) must equal Sl.No.3 of Schedule HP when there is a loss under House Property.");

    /* A361 — "loss to be adjusted" col 3 = Sl.No.2v of item E of Schedule BP (residual business loss). */
    A(361, REQ(TCY.TotBusLoss, RG(I,"CorpScheduleBP.BusSetoffCurrYr.LossRemainSetOffOnBus")),
      "Schedule CYLA: the business loss to be set off (column 3) must equal Sl.No.2v of item E of Schedule BP when there is a loss under PGBP.");

    /* A362 — "loss to be adjusted" col 4 = Sl.No.6 of Schedule OS (the OS loss, nil if a profit). */
    A(362, REQ(TCY.TotOthSrcLossNoRaceHorse, Math.max(0,-N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),
      "Schedule CYLA: the other-sources loss to be set off (column 4) must equal Sl.No.6 of Schedule OS when it is a loss.");

    /* A363 — col 5 (income remaining after set-off) = col 1 − col 2 − col 3 − col 4, on every head row. */
    CROWS.forEach(function(k,i){ var o=cyc(k);
      A(363, REQ(o.IncOfCurYrAfterSetOff, N(o.IncOfCurYrUnderThatHead)-N(o.HPlossCurYrSetoff)-N(o.BusLossSetoff)-N(o.OthSrcLossNoRaceHorseSetoff)),
        "Schedule CYLA: current-year income remaining after set-off (column 5) of row "+CLBL[i]+" must equal column 1 − 2 − 3 − 4.");
    });

    /* A364 — 1(iii) Speculative income = Sl.No.3ii of Table E of Schedule BP. */
    A(364, REQ(cyc("SpeculationIncome").IncOfCurYrUnderThatHead, RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpeculativeInc.IncOfCurYrAfterSetOff")),
      "Schedule CYLA: 1(iii) speculative income must equal Sl.No.3ii of Table E of Schedule BP.");

    /* A365 — 1(iv) Specified-business income = Sl.No.3iii of Table E of Schedule BP. */
    A(365, REQ(cyc("SpecifiedBusIncome").IncOfCurYrUnderThatHead, RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpecifiedInc.IncOfCurYrAfterSetOff")),
      "Schedule CYLA: 1(iv) specified-business income must equal Sl.No.3iii of Table E of Schedule BP.");

    /* A366 — 1(vi) STCG @30% = Sl.No.8iii of item E of Schedule CG. */
    A(366, REQ(cyc("STCG30Per").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcg30Per.CurrYrCapGain")),
      "Schedule CYLA: 1(vi) short-term capital gain @30% must equal Sl.No.8iii of item E of Schedule CG.");

    /* A367 — 1(vii) STCG at applicable rates = Sl.No.8iv of item E of Schedule CG. */
    A(367, REQ(cyc("STCGAppRate").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcgAppRate.CurrYrCapGain")),
      "Schedule CYLA: 1(vii) short-term capital gain taxable at applicable rates must equal Sl.No.8iv of item E of Schedule CG.");

    /* A368 — 1(viii) STCG at special rates as per DTAA = Sl.No.8v of item E of Schedule CG. */
    A(368, REQ(cyc("STCGDTAARate").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcgDTAARate.CurrYrCapGain")),
      "Schedule CYLA: 1(viii) short-term capital gain taxable at special rates in India as per DTAA must equal Sl.No.8v of item E of Schedule CG.");

    /* A369 — 1(x) LTCG at special rates as per DTAA = Sl.No.8vii of item E of Schedule CG. */
    A(369, REQ(cyc("LTCGDTAARate").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InLtcgDTAARate.CurrYrCapGain")),
      "Schedule CYLA: 1(x) long-term capital gain taxable at special rates in India as per DTAA must equal Sl.No.8vii of item E of Schedule CG.");

    /* A370 — 1(xi) Other-source income (excl. race horses & special-rate income) = Sl.No.6 of Schedule OS (nil if a loss). */
    A(370, REQ(cyc("OthSrcExclRaceHorseLottery").IncOfCurYrUnderThatHead, Math.max(0,N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),
      "Schedule CYLA: 1(xi) other-source income (excluding profit from owning race horses and amount chargeable to special rate) must equal Sl.No.6 of Schedule OS.");

    /* A371 — 1(xii) Profit from owning/maintaining race horses = Sl.No.8e of Schedule OS (nil if a loss). */
    A(371, REQ(cyc("ProfitFrmRaceHorse").IncOfCurYrUnderThatHead, Math.max(0,N(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse")))),
      "Schedule CYLA: 1(xii) profit from the activity of owning and maintaining race horses must equal Sl.No.8e of Schedule OS.");

    /* A372 — 1(ii) Business income = A36 of Schedule BP, only when A36 is positive. */
    var A36=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C"));
    A(372, A36<=0 || REQ(cyc("BusProfExclSpecProf").IncOfCurYrUnderThatHead, A36),
      "Schedule CYLA: 1(ii) business income must equal A36 of Schedule BP when A36 is positive.");

    /* A373 — 1(i) Income from House property = Sl.No.3 of Schedule HP (nil if a loss). */
    A(373, REQ(cyc("HP").IncOfCurYrUnderThatHead, Math.max(0,N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP")))),
      "Schedule CYLA: 1(i) income from house property must equal Sl.No.3 of Schedule HP when there is a profit under House Property.");

    /* A374 — normal OS loss must be set off FIRST against race-horse profit and OS-DTAA income:
       if OS loss remains unabsorbed, neither of those two rows may have income left after set-off. */
    A(374, N(LRA.BalOthSrcLossNoRaceHorseAftSetoff)<=0 ||
        (N(cyc("ProfitFrmRaceHorse").IncOfCurYrAfterSetOff)<=0 && N(cyc("IncOSDTAA").IncOfCurYrAfterSetOff)<=0),
      "Schedule CYLA: normal other-sources loss must be set off first against profit from owning and maintaining race horses and other-sources income taxable at special rates as per DTAA.");

    /* A375 — per row, col 2 + col 3 + col 4 must not exceed col 1. */
    CROWS.forEach(function(k,i){ var o=cyc(k);
      A(375, N(o.HPlossCurYrSetoff)+N(o.BusLossSetoff)+N(o.OthSrcLossNoRaceHorseSetoff) <= N(o.IncOfCurYrUnderThatHead)+1,
        "Schedule CYLA: the loss set off (columns 2 + 3 + 4) of row "+CLBL[i]+" cannot exceed that row's income (column 1).");
    });

    /* A376 — 1(v) STCG @20% = Sl.No.8ii of item E of Schedule CG. */
    A(376, REQ(cyc("STCG20Per").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InStcg20Per.CurrYrCapGain")),
      "Schedule CYLA: 1(v) short-term capital gain @20% must equal Sl.No.8ii of item E of Schedule CG.");

    /* A377 — 1(ixb) LTCG @12.5% = Sl.No.8vi of item E of Schedule CG. */
    A(377, REQ(cyc("LTCG12_5Per").IncOfCurYrUnderThatHead, RG(I,"ScheduleCG.CurrYrLosses.InLtcg12_5Per.CurrYrCapGain")),
      "Schedule CYLA: 1(ixb) long-term capital gain @12.5% must equal Sl.No.8vi of item E of Schedule CG.");

    /* A378 — 1(xiii) Other-sources income at special rates as per DTAA = Sl.No.2e of Schedule OS. */
    A(378, REQ(cyc("IncOSDTAA").IncOfCurYrUnderThatHead, RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.TotalOSGrossChargblSplRate")),
      "Schedule CYLA: 1(xiii) income from other sources taxable at special rates in India as per DTAA must equal Sl.No.2e of Schedule OS.");
  }

  /* =====================================================================
     Schedule PTI — pass-through income (A379–A383). SchedulePTIDtls[] is one
     object per business trust / investment fund; each head object carries
     AmountOfInc (col 7), CurrYrLossShareByInvstFund (col 8, HP & CG objects
     only), NetIncomeLoss (col 9), TDSAmount (col 10).
     ===================================================================== */
  if(I.SchedulePTI){
    const pti=arr(RG(I,"SchedulePTI.SchedulePTIDtls",[]));

    /* A379 — col 9 (Net Income/Loss) = col 7 (income) − col 8 (loss share) on every head row. */
    pti.forEach(function(f,i){ if(!f) return;
      var heads=[
        ["house property",              RG(f,"IncFromHP",null)],
        ["capital gains — short term",  RG(f,"CapitalGainsPTI.ShortTermCG",null)],
        ["STCG 111A",                   RG(f,"CapitalGainsPTI.STCG_Sec111A",null)],
        ["STCG others",                 RG(f,"CapitalGainsPTI.STCG_Others",null)],
        ["capital gains — long term",   RG(f,"CapitalGainsPTI.LongTermCG",null)],
        ["LTCG 112A",                   RG(f,"CapitalGainsPTI.LTCG_Sec112A",null)],
        ["LTCG others",                 RG(f,"CapitalGainsPTI.LTCG_Others",null)],
        ["other sources",              RG(f,"IncOthSrc",null)],
        ["other sources — dividend",   RG(f,"OS_Dividend",null)],
        ["other sources — others",     RG(f,"OS_Others",null)]
      ];
      heads.forEach(function(h){ var o=h[1]; if(!o||typeof o!=="object") return;
        A(379, REQ(o.NetIncomeLoss, N(o.AmountOfInc)-N(o.CurrYrLossShareByInvstFund)),
          "Schedule PTI (fund "+(i+1)+", "+h[0]+"): column 9 (Net Income/Loss) must equal column 7 − column 8.");
      });
    });

    /* A380 — Sl.No.iia "Short Term" = ai (111A) + aii (Others). */
    pti.forEach(function(f,i){ if(!f) return; var cg=RG(f,"CapitalGainsPTI",{})||{};
      A(380, REQ(RG(cg,"ShortTermCG.AmountOfInc"), N(RG(cg,"STCG_Sec111A.AmountOfInc"))+N(RG(cg,"STCG_Others.AmountOfInc"))),
        "Schedule PTI (fund "+(i+1)+"): Sl.No.iia Short Term must equal the sum of ai (Section 111A) and aii (Others).");
    });

    /* A381 — Sl.No.iib "Long Term" = bi (112A) + bii (other than 112A). */
    pti.forEach(function(f,i){ if(!f) return; var cg=RG(f,"CapitalGainsPTI",{})||{};
      A(381, REQ(RG(cg,"LongTermCG.AmountOfInc"), N(RG(cg,"LTCG_Sec112A.AmountOfInc"))+N(RG(cg,"LTCG_Others.AmountOfInc"))),
        "Schedule PTI (fund "+(i+1)+"): Sl.No.iib Long Term must equal the sum of bi (Section 112A) and bii (Sections other than 112A).");
    });

    /* A382 — Sl.No.iii "Other Sources" = a (Dividend) + b (Others). */
    pti.forEach(function(f,i){ if(!f) return;
      A(382, REQ(RG(f,"IncOthSrc.AmountOfInc"), N(RG(f,"OS_Dividend.AmountOfInc"))+N(RG(f,"OS_Others.AmountOfInc"))),
        "Schedule PTI (fund "+(i+1)+"): Sl.No.iii Other Sources must equal the sum of a (Dividend) and b (Others).");
    });

    /* A383 — Σ over the receiving schedules [Schedule AI 9a + Schedule HP 2 + CG A8 + CG B11 + OS 2d]
       must be at least the Σ over all funds of PTI net income 9(i) + 9(iia) + 9(iib) + 9(iii). */
    var ptiSum=0;
    pti.forEach(function(f){ if(!f) return;
      ptiSum += N(RG(f,"IncFromHP.NetIncomeLoss"))
              + N(RG(f,"CapitalGainsPTI.ShortTermCG.NetIncomeLoss"))
              + N(RG(f,"CapitalGainsPTI.LongTermCG.NetIncomeLoss"))
              + N(RG(f,"IncOthSrc.NetIncomeLoss"));
    });
    var recv = N(RG(I,"ScheduleAI.PassThroughIncome"))
             + N(RG(I,"ScheduleHP.PassThroghIncome"))
             + N(RG(I,"ScheduleCG.ShortTermCapGain.PassThrIncNatureSTCG"))
             + N(RG(I,"ScheduleCG.LongTermCapGain.PassThrIncNatureLTCG"))
             + N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.PassThrIncOSChrgblSplRate"));
    A(383, recv >= ptiSum-1,
      "Schedule PTI: the sum of [Sl.No.9a of Schedule AI + Sl.No.2 of Schedule HP + A8 and B11 of Schedule CG + Sl.No.2d of Schedule OS] must be at least the sum of [9(i)+9(ii)(a)+9(ii)(b)+9(iii)] of Schedule PTI over all business trusts / investment funds.");
  }

  /* =====================================================================
     Schedule SI — income chargeable at special rates (A384–A408).
     SplCodeRateTax[] is keyed by the schema SecCode; each row carries
     SplRateInc (col i income), SplRatePercent (rate %) and SplRateIncTax
     (col ii tax). Block totals TotSplRateInc / TotSplRateIncTax.
     ===================================================================== */
  if(I.ScheduleSI){
    const siRows=arr(RG(I,"ScheduleSI.SplCodeRateTax",[]));
    const siInc=function(code){ var t=0; siRows.forEach(function(r){ if(r&&r.SecCode===code) t+=N(r.SplRateInc); }); return t; };
    const OS=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const os2c=function(code){ var t=0; arr(RG(OS,"OthersGrossDtls",[])).forEach(function(r){ if(r&&r.SourceDescription===code) t+=N(r.SourceAmount); }); return t; };
    const os2d=function(code){ var t=0; arr(RG(OS,"PTIOthersGrossDtls",[])).forEach(function(r){ if(r&&r.SourceDescription===code) t+=N(r.SourceAmount); }); return t; };

    /* --- A384–A386 : SI head ≤ the OS feeding line (after DTAA), only when Schedule OS is present. --- */
    if(I.ScheduleOS){
      A(384, LE(siInc("5BB"), N(RG(OS,"LtryPzzlChrgblUs115BB"))),
        "Schedule SI: 115BB (winnings from lotteries, puzzles, races, games etc.) cannot exceed the corresponding income at Sl.No.2a(i) of Schedule OS (net of DTAA).");
      A(385, LE(siInc("5BBE"), N(RG(OS,"IncChrgblUs115BBE"))),
        "Schedule SI: 115BBE (income u/s 68/69/69A/69B/69C/69D) cannot exceed the corresponding income at Sl.No.2b of Schedule OS.");
      A(386, LE(siInc("DTAAOS"), N(RG(OS,"IncChargblSplRateOS.TotalOSGrossChargblSplRate"))),
        "Schedule SI: income from other sources chargeable at special rates in India as per DTAA cannot exceed the corresponding income at Sl.No.2e of Schedule OS.");
    }

    /* --- A387 : tax (col ii) = rate × income (col i), for every head EXCEPT the treaty-rate
       DTAA heads and the three ₹1,25,000-s.112A-exemption heads (2A / PTI-112A / 115AD(1)(b)(iii)
       proviso), whose col-ii tax is legitimately reduced below rate × income. --- */
    const SKIP387=["DTAASTCG","DTAALTCG","DTAAOS","2A","PTI_LTCG12_5P112A","5ADiiiP"];
    siRows.forEach(function(r){ if(!r||SKIP387.indexOf(r.SecCode)>=0) return;
      A(387, REQ(r.SplRateIncTax, Math.round(N(r.SplRateInc)*N(r.SplRatePercent)/100)),
        "Schedule SI: for head "+(r.SecCode||"?")+" the tax thereon (column ii) must equal the taxable income (column i) multiplied by the special rate for that head.");
    });

    /* --- A388 : tax (col ii) cannot be null when income (col i) > 0. --- */
    siRows.forEach(function(r){ if(!r) return;
      A(388, !(N(r.SplRateInc)>0) || (r.SplRateIncTax!=null && String(r.SplRateIncTax).trim()!==""),
        "Schedule SI: the tax computed (column ii) cannot be null when the income (column i) is greater than zero.");
    });

    /* --- A389 : 115AD STCG for FIIs (STT not paid) @30% + PTI-STCG @30% ≤ CYLA 5(vi) (STCG30Per, col 5). --- */
    A(389, !I.ScheduleCYLA || LE(siInc("5ADii")+siInc("PTI_STCG30P"), RG(I,"ScheduleCYLA.STCG30Per.IncCYLA.IncOfCurYrAfterSetOff")),
      "Schedule SI: the sum of income u/s 115AD (STCG for FIIs where STT not paid) and pass-through STCG chargeable @30% cannot exceed the corresponding income at Sl.No.5(vi) of Schedule CYLA.");

    /* --- A390 : total income (col i) = sum of the individual head rows. --- */
    var totInc=0; siRows.forEach(function(r){ if(r) totInc+=N(r.SplRateInc); });
    A(390, REQ(RG(I,"ScheduleSI.TotSplRateInc"), totInc),
      "Schedule SI: the total of Income (i) must equal the sum of the individual special-rate line items.");

    /* --- A391 : total tax (col ii) = sum of the individual head-row taxes. --- */
    var totTax=0; siRows.forEach(function(r){ if(r) totTax+=N(r.SplRateIncTax); });
    A(391, REQ(RG(I,"ScheduleSI.TotSplRateIncTax"), totTax),
      "Schedule SI: the total of all tax on special incomes at 'Tax Thereon' (ii) must equal the sum of the tax on the individual line items.");

    /* --- A392–A408 : each per-section special income in Schedule SI must match (≤, after DTAA) the
       corresponding line at Sl.No.2c (A392–A404) / Sl.No.2d (A405–A408) of Schedule OS. Only when
       Schedule OS is present, so an absent source never false-fires. --- */
    if(I.ScheduleOS){
      A(392, LE(siInc("5A1ai"),    os2c("5A1ai")),
        "Schedule SI: special income u/s 115A(1)(a)(i) (other than the proviso to 115A(1)(a)(A)) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(393, LE(siInc("5A1aii"),   os2c("5A1aii")),
        "Schedule SI: special income u/s 115A(1)(a)(ii) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(394, LE(siInc("5A1aiia"),  os2c("5A1aiia")),
        "Schedule SI: special income u/s 115A(1)(a)(iia) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(395, LE(siInc("5A1aiiaa"), os2c("5A1aiiaa")),
        "Schedule SI: special income u/s 115A(1)(a)(iiaa) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(396, LE(siInc("5A1aiiab"), os2c("5A1aiiab")),
        "Schedule SI: special income u/s 115A(1)(a)(iiab) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(397, LE(siInc("5A1aiiac"), os2c("5A1aiiac")),
        "Schedule SI: special income u/s 115A(1)(a)(iiac) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(398, LE(siInc("5A1aiii"),  os2c("5A1aiii")),
        "Schedule SI: special income u/s 115A(1)(a)(iii) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(399, LE(siInc("5A1bA"),    os2c("5A1bA")),
        "Schedule SI: special income u/s 115A(1)(b) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(400, LE(siInc("5AC1ab"),   os2c("5AC1ab")),
        "Schedule SI: special income u/s 115AC(1)(a) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(401, LE(siInc("5AD1i"),    os2c("5AD1i")),
        "Schedule SI: special income u/s 115AD(1)(i) (interest/other) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(402, LE(siInc("5AD1iDiv"), os2c("5AD1iDiv")),
        "Schedule SI: special income u/s 115AD(1)(i) (dividend) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(403, LE(siInc("5BBA"),     os2c("5BBA")),
        "Schedule SI: special income u/s 115BBA must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(404, LE(siInc("5BBC"),     os2c("5BBC")),
        "Schedule SI: special income u/s 115BBC must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(405, LE(siInc("PTI_5A1ai"),    os2d("PTI_5A1ai")),
        "Schedule SI: special income u/s 115A(1)(a)(i) must match the corresponding pass-through income at Sl.No.2d of Schedule OS.");
      A(406, LE(siInc("PTI_5A1aii"),   os2d("PTI_5A1aii")),
        "Schedule SI: special income u/s 115A(1)(a)(ii) must match the corresponding pass-through income at Sl.No.2d of Schedule OS.");
      A(407, LE(siInc("PTI_5A1aiia"),  os2d("PTI_5A1aiia")),
        "Schedule SI: special income u/s 115A(1)(a)(iia) must match the corresponding pass-through income at Sl.No.2d of Schedule OS.");
      A(408, LE(siInc("PTI_5A1aiiaa"), os2d("PTI_5A1aiiaa")),
        "Schedule SI: special income u/s 115A(1)(a)(iiaa) must match the corresponding pass-through income at Sl.No.2d of Schedule OS.");
    }
  }
});
