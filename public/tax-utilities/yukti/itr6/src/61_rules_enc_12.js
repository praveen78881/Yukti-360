/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_12 (Phase 6).
   Serial range A557–A606. Schedules covered (census block paths):
     A557–A568  ScheduleCFL        (carry-forward of losses)
     A569–A574  ITRScheduleUD      (unabsorbed depreciation / s.35(4))
     A575–A577  ScheduleICDS       (+ the 115BA/BAA/BAB regime gate at A577)
     A578–A588  Schedule80GGB      (contributions to political parties)
     A589–A598  Schedule80GGC      (contributions to political parties)
     A599–A603  Schedule80IAC      (eligible start-up deduction)
     A604–A606  Schedule80LA       (OBU / IFSC unit deduction)
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N()); nothing throws. Keys taken from the CBDT ITR-6 schema
   (sources/ITR-6/…schema.json) and the books CFL / Unabsorbed_Depreciation /
   ICDS / 80GGB / 80GGC / 80IAC / 80LA. Encoded from each rule's own text
   (constitution rule 6).

   Note on the source text: the rules.json text for the 80GGB / 80GGC gate
   rules wraps across serial boundaries (each fragment carries the tail of
   the previous rule and the head of the next). A577 (census-tagged
   ScheduleICDS) actually carries the 80GGB regime-gate; A588 (census-tagged
   Schedule80GGB) carries the 80GGC regime-gate. Both are encoded under the
   schedule they actually govern, and every serial gets a real (non-vacuous)
   guarded check — reconciled against the schedule books.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const SUM=(arr,k)=>(Array.isArray(arr)?arr:[]).reduce((a,r)=>a+N(r&&r[k]),0);
  const nz=v=>{const x=N(v);return x>0?x:0;};            /* positive part */
  const lossMag=v=>{const x=N(v);return x<0?-x:0;};      /* loss magnitude of a signed net figure */

  /* ---- Part A General reads (filing-status flags, for the regime gates) ---- */
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const sec115=String(FS.Section115BA||"");
  const secCur=String(FS.SectionCurrAY||"");
  /* opted any concessional regime (115BA / 115BAA / 115BAB) — bars 80GGB/80GGC */
  const optedConc=(S0(sec115)&&sec115!=="NA")||S0(secCur);
  /* opted 115BAA / 115BA (drives the b/f-loss & depreciation 115BAA adjustment) */
  const opted115BAA=(sec115==="115BAA"||sec115==="115BA"||secCur==="115BAA"||secCur==="115BA");

  /* Gross Total Income (Part B-TI) — null when the block is absent, so the
     GTI-zero rules stay silent on a partially-built return. */
  const GTI=RG(I,"PartB-TI.GrossTotalIncome",null);

  /* Schedule VI-A "amount claimed" column (UsrDeductUndChapVIA) */
  const VIA=RG(I,"ScheduleVIA.UsrDeductUndChapVIA",{})||{};

  /* =====================================================================
     Schedule CFL — carry forward of losses (A557–A568).
     Current-year row (xix) = CurrentAYloss.LossSummaryDetail; it is
     assembled from this year's schedules, so on a lawful return it equals
     the derived source value. Books: CFL.md §5, CYLA_BFLA.md, CG.md,
     OS.md, BP.md.
     ===================================================================== */
  if(I.ScheduleCFL){
    const CY=RG(I,"ScheduleCFL.CurrentAYloss.LossSummaryDetail",{})||{};

    /* A557 — CFL current-year specified-business (s.35AD) loss (7xix) =
       loss part of "Income from specified business u/s 35AD" (BP C49). */
    A(557, REQ(CY.LossFrmSpecifiedBusCF,
        lossMag(RG(I,"CorpScheduleBP.IncSpecifiedBusiness.ProfitLossSpecifiedBusFinal"))),
      "Schedule CFL: current-year loss from specified business (7xix) must equal the loss in 'Income from specified business u/s 35AD' of Schedule BP.");

    /* A558 — CFL current-year STCG loss (9xix) = Table E (loss remaining
       after set off) of the short-term rate buckets of Schedule CG. */
    const LR=RG(I,"ScheduleCG.CurrYrLosses.LossRemainSetOff",{})||{};
    A(558, REQ(CY.TotalSTCGPTILossCF,
        N(LR.StclSetoff20Per)+N(LR.StclSetoff30Per)+N(LR.StclSetoffAppRate)+N(LR.StclSetoffDTAARate)),
      "Schedule CFL: current-year short-term capital loss (9xix) must equal Table E (short-term loss remaining after set off) of Schedule CG.");

    /* A559 — CFL current-year LTCG loss (10xix) = Table E (loss remaining
       after set off) of the long-term rate buckets of Schedule CG. */
    A(559, REQ(CY.TotalLTCGPTILossCF,
        N(LR.LtclSetOff12_5Per)+N(LR.LtclSetOffDTAARate)),
      "Schedule CFL: current-year long-term capital loss (10xix) must equal Table E (long-term loss remaining after set off) of Schedule CG.");

    /* A560 — CFL current-year HP loss (4xix) = 2xvii of Schedule CYLA
       (house-property loss remaining after current-year set off). */
    A(560, REQ(CY.TotalHPPTILossCF,
        N(RG(I,"ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff"))),
      "Schedule CFL: current-year house-property loss (4xix) must equal Sl. No. 2xvii of Schedule CYLA.");

    /* A561 — CFL current-year race-horse loss (11xix) = loss part of 8e
       of Schedule OS (owning & maintaining race horses). */
    A(561, REQ(CY.OthSrcLossRaceHorseCF,
        lossMag(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse"))),
      "Schedule CFL: current-year loss from owning & maintaining race horses (11xix) must equal Sl. No. 8e of Schedule OS.");

    /* A562 — CFL current-year life-insurance u/s 115B loss (8xix) = loss
       part of 4b of Schedule BP. */
    A(562, REQ(CY.LossFrmLifeInsBusUs115B,
        lossMag(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.PLUs44sChapXIIGUs115B"))),
      "Schedule CFL: current-year loss from life-insurance business u/s 115B (8xix) must equal Sl. No. 4b of Schedule BP.");

    /* A563 — CFL current-year business loss 5c (xix) = 3xvii of Schedule
       CYLA (business loss remaining after current-year set off). */
    A(563, REQ(CY.BroughtFrwdBusLossSetOffDrYr,
        N(RG(I,"ScheduleCYLA.LossRemAftSetOff.BalBusLossAftSetoff"))),
      "Schedule CFL: current-year business loss (xix, 5c) must equal Sl. No. 3xvii of Schedule CYLA.");

    /* Per-assessment-year rows (i–xvi), each wrapping a CarryFwdLossDetail. */
    const CFLYEARS=["LossCFFromPrev9thYearFromAY","LossCFFromPrev8thYearFromAY",
      "LossCFFromPrev7thYearFromAY","LossCFFromPrev6thYearFromAY","LossCFFromPrev5thYearFromAY",
      "LossCFFromPrev4thYearFromAY","LossCFFromPrev3rdYearFromAY","LossCFFromPrev2ndYearFromAY",
      "LossCFFromPrevYrToAY","LossCFCurrentAssmntYear","LossCFCurrentAssmntYear2021",
      "LossCFCurrentAssmntYear2022","LossCFCurrentAssmntYear2023","LossCFCurrentAssmntYear2024",
      "LossCFCurrentAssmntYear2025","LossCFCurrentAssmntYear2026"];
    const yrows=CFLYEARS.map(k=>RG(I,"ScheduleCFL."+k+".CarryFwdLossDetail",{})||{});

    /* A564 — 5b (amount adjusted on opting 115BAA/115BA) can be entered only
       if the assessee has opted for taxation u/s 115BAA/115BA. */
    A(564, opted115BAA || yrows.every(r=>N(r.AmtAdjAccOptTaxUs115BAA_115BA)===0),
      "Schedule CFL: the amount at 5b (adjustment on opting u/s 115BAA) can be entered only when the assessee opts for taxation u/s 115BAA.");

    /* A565 — 5c = 5a − 5b, per year row. */
    A(565, yrows.every(r=>REQ(r.BroughtFrwdBusLossSetOffDrYr,
        N(r.BroughtFrwrdBusLoss)-N(r.AmtAdjAccOptTaxUs115BAA_115BA))),
      "Schedule CFL: 5c (brought-forward business loss available for set off) must equal 5a − 5b for every assessment-year row.");

    /* A567 — total of brought-forward losses (xvii) = the sum of the
       individual assessment-year fields, per column. */
    const TB=RG(I,"ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail",{})||{};
    const CFLCOLS=["TotalHPPTILossCF","BroughtFrwdBusLossSetOffDrYr","LossFrmSpecBusCF",
      "LossFrmSpecifiedBusCF","LossFrmLifeInsBusUs115B","TotalSTCGPTILossCF",
      "TotalLTCGPTILossCF","OthSrcLossRaceHorseCF"];
    A(567, CFLCOLS.every(c=>REQ(TB[c], SUM(yrows,c))),
      "Schedule CFL: the total of brought-forward losses of earlier years (xvii) must equal the sum of the individual assessment-year fields for every column.");

    /* A566 — xxi = xix − xx, per column. */
    const DU=RG(I,"ScheduleCFL.CurrentYearDistrUnitHolder.LossSummaryDetail",{})||{};
    const CFC=RG(I,"ScheduleCFL.CurrentYearLossCF.LossSummaryDetail",{})||{};
    A(566, CFLCOLS.every(c=>REQ(CFC[c], N(CY[c])-N(DU[c]))),
      "Schedule CFL: current-year losses to be carried forward (xxi) must equal xix − xx for every column.");

    /* A568 — xxii = xvii − xviii + xxi, restricted to 0 if negative, per column. */
    const AB=RG(I,"ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail",{})||{};
    const TS=RG(I,"ScheduleCFL.TotalLossCFSummary.LossSummaryDetail",{})||{};
    A(568, CFLCOLS.every(c=>REQ(TS[c], Math.max(0, N(TB[c])-N(AB[c])+N(CFC[c])))),
      "Schedule CFL: total loss carried forward to future years (xxii) must equal xvii − xviii + xxi (restricted to 0 if negative) for every column.");
  }

  /* =====================================================================
     Schedule UD — unabsorbed depreciation & s.35(4) allowance (A569–A574).
     Columns: 3 AmtBFUD · 3a AmtAdjOptTaxUs115BAA · 4 AmtDeprSOCY ·
     5 BalCFNY · 6 AmtBFUAllow · 7 AmtAllowSOCY · 8 AllowBalCFNY.
     Book: Unabsorbed_Depreciation.md.
     ===================================================================== */
  if(I.ITRScheduleUD){
    const UDROWS=RG(I,"ITRScheduleUD.ScheduleUD",[])||[];
    const UD=RG(I,"ITRScheduleUD",{})||{};

    /* A569 — 3a can be entered only if the assessee opts for taxation u/s 115BAA. */
    A(569, opted115BAA || UDROWS.every(r=>N(r&&r.AmtAdjOptTaxUs115BAA)===0),
      "Schedule UD: the amount at 3a (adjustment on opting u/s 115BAA) can be entered only when the assessee opts for taxation u/s 115BAA.");

    /* A570 — 4 (depreciation set off) cannot exceed 3 − 3a in any row. */
    A(570, UDROWS.every(r=>N(r&&r.AmtDeprSOCY) <= N(r&&r.AmtBFUD)-N(r&&r.AmtAdjOptTaxUs115BAA)+1),
      "Schedule UD: depreciation set off (col 4) cannot exceed col 3 − col 3a in any row.");

    /* A571 — 5 = 3 − 3a − 4 (balance c/f, floored at 0). */
    A(571, UDROWS.every(r=>REQ(r&&r.BalCFNY,
        Math.max(0, N(r&&r.AmtBFUD)-N(r&&r.AmtAdjOptTaxUs115BAA)-N(r&&r.AmtDeprSOCY)))),
      "Schedule UD: balance carried forward (col 5) must equal col 3 − col 3a − col 4.");

    /* A572 — 8 = 6 − 7 (allowance balance c/f, floored at 0). */
    A(572, UDROWS.every(r=>REQ(r&&r.AllowBalCFNY,
        Math.max(0, N(r&&r.AmtBFUAllow)-N(r&&r.AmtAllowSOCY)))),
      "Schedule UD: allowance balance carried forward (col 8) must equal col 6 − col 7.");

    /* A573 — the sum of the individual rows must match the Total-row value
       for each column. Columns 5 and 8 mix the separate current-year
       balances into their totals (per the sheet formula), so are validated
       per-row by A571/A572; here the plain-sum columns (3, 3a, 4, 6, 7). */
    A(573,
      REQ(UD.TotBFUDepritAmt,          SUM(UDROWS,"AmtBFUD")) &&
      REQ(UD.TotAmtAdjOptTaxUs115BAA,  SUM(UDROWS,"AmtAdjOptTaxUs115BAA")) &&
      REQ(UD.TotCurYrdepritSetoffInc,  SUM(UDROWS,"AmtDeprSOCY")) &&
      REQ(UD.TotBFUAllowAmt,           SUM(UDROWS,"AmtBFUAllow")) &&
      REQ(UD.TotCurYrAllowSetoffInc,   SUM(UDROWS,"AmtAllowSOCY")),
      "Schedule UD: the sum of the individual rows must match the total-row value for every column (3 to 8).");

    /* A574 — depreciation set off (col 4) for the current assessment year
       cannot exceed 12iii of Schedule BP. */
    const bp12iii=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.DepreciationAllowITAct32.TotDeprAllowITAct"));
    const curRow=UDROWS.filter(r=>r&&String(r.AssYr)==="2026-27");
    A(574, curRow.every(r=>N(r.AmtDeprSOCY) <= bp12iii+1),
      "Schedule UD: depreciation set off for the current assessment year cannot exceed Sl. No. 12iii of Schedule BP.");
  }

  /* =====================================================================
     Schedule ICDS — effect of ICDS on profit (A575–A576). Book: ICDS.md.
     Ten standard rows (each IncreaseInProfit/DecreaseInProfit/NetEffect)
     and the total row XI (IncreaseInProfit/DecreaseInProfit).
     ===================================================================== */
  if(I.ScheduleICDS){
    const ICD=RG(I,"ScheduleICDS",{})||{};
    const ICDSITEMS=["AccPolicyAmtDetl","InventoriesValueDetl","ConstContractsAmtDetl",
      "RevenueRcgAmtDetl","TangibleFixedAssetDetl","ForeignExgRatesDetl","GovtGrantsDetl",
      "SecuritiesDetl","BorrowingCostsDetl","ProvAssetsDetl"];
    const items=ICDSITEMS.map(k=>RG(ICD,k,{})||{});
    const TN=RG(ICD,"TotalNetAmtDetl",{})||{};

    /* A575 — XI (total) = the sum of rows I to X, if positive (both halves). */
    A(575,
      REQ(TN.IncreaseInProfit, Math.max(0, SUM(items,"IncreaseInProfit"))) &&
      REQ(TN.DecreaseInProfit, Math.max(0, SUM(items,"DecreaseInProfit"))),
      "Schedule ICDS: Sl. No. XI must equal the sum of Sl. No. I to X (if positive).");

    /* A576 — col 5 (Net effect) = col 3 − col 4, for every standard row. */
    A(576, items.every(r=>REQ(r.NetEffect, N(r.IncreaseInProfit)-N(r.DecreaseInProfit))),
      "Schedule ICDS: the Net Effect (col 5) must equal Increase (col 3) − Decrease (col 4) for every row.");
  }

  /* =====================================================================
     Schedule 80GGB — contributions to political parties (A577–A588).
     Book: 80GGB.md. Row leaves: DonationDate, DonationAmtCash (iii),
     DonationAmtOtherMode (iv), DonationAmt (v/total), EligibleDonationAmt
     (vi), PoliticalPartyName, PoliticalPartyPAN, TransactionRefNum (ix),
     IFSCCode (x). Cash is never eligible.
     ===================================================================== */
  if(I.Schedule80GGB){
    const G=RG(I,"Schedule80GGB",{})||{};
    const rows=RG(G,"Schedule80GGBDetails",[])||[];

    /* A577 — with a concessional regime (115BA/115BAA/115BAB) opted in Part
       A General, Schedule 80GGB is not to be filled (totals forced to 0). */
    A(577, !optedConc || (N(G.TotalDonationsUs80GGB)===0 && N(G.TotalEligibleDonationAmt80GGB)===0),
      "Schedule 80GGB: having opted for taxation u/s 115BA/115BAA/115BAB, Schedule 80GGB is not required to be filled — its total donation and eligible amount must be nil.");

    /* A578 — cash contribution (iii) earns no deduction, so the eligible
       amount (vi) cannot exceed the other-mode contribution (iv). */
    A(578, rows.every(r=>N(r&&r.EligibleDonationAmt) <= N(r&&r.DonationAmtOtherMode)+1),
      "Schedule 80GGB: a contribution in cash is not eligible — the eligible amount cannot exceed the contribution in other mode for any row.");

    /* A579 — (v) Total contribution = (iii) cash + (iv) other mode. */
    A(579, rows.every(r=>REQ(r&&r.DonationAmt, N(r&&r.DonationAmtCash)+N(r&&r.DonationAmtOtherMode))),
      "Schedule 80GGB: the total contribution must equal contribution in cash + contribution in other mode for every row.");

    /* A580 — total A (donation in cash) = sum of column iii. */
    A(580, REQ(G.TotalDonationAmtCash80GGB, SUM(rows,"DonationAmtCash")),
      "Schedule 80GGB: 'Donation in cash' total must equal the sum of column iii.");

    /* A581 — total B (donation in other mode) = sum of column iv. */
    A(581, REQ(G.TotalDonationAmtOtherMode80GGB, SUM(rows,"DonationAmtOtherMode")),
      "Schedule 80GGB: 'Donation in other mode' total must equal the sum of column iv.");

    /* A582 — total C (total donation) = sum of column v. */
    A(582, REQ(G.TotalDonationsUs80GGB, SUM(rows,"DonationAmt")),
      "Schedule 80GGB: 'Total Donation' must equal the sum of column v.");

    /* A583 — if Gross Total Income is zero, eligible amount cannot exceed 0. */
    A(583, GTI===null || N(GTI)!==0 || N(G.TotalEligibleDonationAmt80GGB)<=0,
      "Schedule 80GGB: when Gross Total Income (Part B-TI) is zero, the eligible amount of donation cannot be more than 0.");

    /* A585 — deduction only for contributions made 01.04.2025 to 31.03.2026. */
    A(585, rows.every(r=>!S0(r&&r.DonationDate) || (r.DonationDate>="2025-04-01" && r.DonationDate<="2026-03-31")),
      "Schedule 80GGB: deduction u/s 80GGB is available only for contributions made between 01/04/2025 and 31/03/2026.");

    /* A586 — if contribution in other mode > 0, the transaction reference
       number and the IFSC code of bank are mandatory. */
    A(586, rows.every(r=>N(r&&r.DonationAmtOtherMode)<=0 || (S0(r&&r.TransactionRefNum) && S0(r&&r.IFSCCode))),
      "Schedule 80GGB: when a contribution is made in other mode, the transaction reference number and the IFSC code of bank are mandatory.");

    /* A587 — name and PAN of the political party are necessary to claim 80GGB. */
    A(587, rows.every(r=>N(r&&r.DonationAmt)<=0 || (S0(r&&r.PoliticalPartyName) && S0(r&&r.PoliticalPartyPAN))),
      "Schedule 80GGB: the name and PAN of the political party are mandatory to claim deduction u/s 80GGB.");
  }

  /* A588 — with a concessional regime opted, Schedule 80GGC is not to be
     filled (regime gate carried at this boundary serial). */
  if(I.Schedule80GGC){
    const C=RG(I,"Schedule80GGC",{})||{};
    A(588, !optedConc || (N(C.TotalDonationsUs80GGC)===0 && N(C.TotalEligibleDonationAmt80GGC)===0),
      "Schedule 80GGC: having opted for taxation u/s 115BA/115BAA/115BAB, Schedule 80GGC is not required to be filled — its total contribution and eligible amount must be nil.");
  }

  /* =====================================================================
     Schedule 80GGC — contributions to political parties (A589–A598).
     Book: 80GGC.md. Same shape as 80GGB.
     ===================================================================== */
  if(I.Schedule80GGC){
    const C=RG(I,"Schedule80GGC",{})||{};
    const rows=RG(C,"Schedule80GGCDetails",[])||[];

    /* A589 — cash contribution is not eligible; eligible (vi) ≤ other mode (iv). */
    A(589, rows.every(r=>N(r&&r.EligibleDonationAmt) <= N(r&&r.DonationAmtOtherMode)+1),
      "Schedule 80GGC: a contribution in cash is not eligible — the eligible amount cannot exceed the contribution in other mode for any row.");

    /* A590 — (v) Total = (iii) cash + (iv) other mode. */
    A(590, rows.every(r=>REQ(r&&r.DonationAmt, N(r&&r.DonationAmtCash)+N(r&&r.DonationAmtOtherMode))),
      "Schedule 80GGC: the total contribution must equal contribution in cash + contribution in other mode for every row.");

    /* A591 — total A (contribution in cash) = sum of column iii. */
    A(591, REQ(C.TotalDonationAmtCash80GGC, SUM(rows,"DonationAmtCash")),
      "Schedule 80GGC: 'Contribution in cash' total must equal the sum of column iii.");

    /* A592 — total B (contribution in other mode) = sum of column iv. */
    A(592, REQ(C.TotalDonationAmtOtherMode80GGC, SUM(rows,"DonationAmtOtherMode")),
      "Schedule 80GGC: 'Contribution in other mode' total must equal the sum of column iv.");

    /* A593 — total C (total contribution) = sum of column v. */
    A(593, REQ(C.TotalDonationsUs80GGC, SUM(rows,"DonationAmt")),
      "Schedule 80GGC: 'Total Contribution' must equal the sum of column v.");

    /* A594 — if Gross Total Income is zero, eligible amount cannot exceed 0. */
    A(594, GTI===null || N(GTI)!==0 || N(C.TotalEligibleDonationAmt80GGC)<=0,
      "Schedule 80GGC: when Gross Total Income (Part B-TI) is zero, the eligible amount of contribution cannot be more than 0.");

    /* A596 — deduction only for contributions made 01.04.2025 to 31.03.2026. */
    A(596, rows.every(r=>!S0(r&&r.DonationDate) || (r.DonationDate>="2025-04-01" && r.DonationDate<="2026-03-31")),
      "Schedule 80GGC: deduction u/s 80GGC is available only for contributions made between 01/04/2025 and 31/03/2026.");

    /* A597 — if contribution in other mode > 0, ref number and IFSC mandatory. */
    A(597, rows.every(r=>N(r&&r.DonationAmtOtherMode)<=0 || (S0(r&&r.TransactionRefNum) && S0(r&&r.IFSCCode))),
      "Schedule 80GGC: when a contribution is made in other mode, the transaction reference number and the IFSC code of bank are mandatory.");

    /* A598 — name and PAN of the political party are necessary to claim 80GGC. */
    A(598, rows.every(r=>N(r&&r.DonationAmt)<=0 || (S0(r&&r.PoliticalPartyName) && S0(r&&r.PoliticalPartyPAN))),
      "Schedule 80GGC: the name and PAN of the political party are mandatory to claim deduction u/s 80GGC.");
  }

  /* =====================================================================
     Schedule 80IAC — eligible start-up deduction (A599–A603). Book: 80IAC.md.
     Single object: DateIncrpStrup, NatureOfBusiness, InterMnstBoardCertNum,
     FstAYDeduction, AmtDedCurAY (Sl. No. 6).
     ===================================================================== */
  if(I.Schedule80IAC){
    const IA=RG(I,"Schedule80IAC",{})||{};

    /* A599 — if the amount of deduction claimed > 0, the remaining fields
       (date of incorporation, nature of business, board certificate number,
       first AY of deduction) are mandatory. */
    A(599, N(IA.AmtDedCurAY)<=0 ||
        (S0(IA.DateIncrpStrup)&&S0(IA.NatureOfBusiness)&&S0(IA.InterMnstBoardCertNum)&&S0(IA.FstAYDeduction)),
      "Schedule 80IAC: when a deduction amount is claimed, the date of incorporation, nature of business, board certificate number and first assessment year of deduction are mandatory.");

    /* A600 — deduction may be claimed only by entities incorporated on/after
       01/04/2016. */
    A(600, !S0(IA.DateIncrpStrup) || IA.DateIncrpStrup>="2016-04-01",
      "Schedule 80IAC: the deduction can be claimed only by an entity whose date of incorporation is on or after 01/04/2016.");

    /* A601 — Schedule 80IAC is enabled only when DPIIT start-up = Yes in
       Part A General. */
    A(601, FS.StartUpDPIITFlag==="Y" || N(IA.AmtDedCurAY)<=0 &&
        !S0(IA.DateIncrpStrup)&&!S0(IA.NatureOfBusiness)&&!S0(IA.InterMnstBoardCertNum)&&!S0(IA.FstAYDeduction),
      "Schedule 80IAC: this schedule is enabled only when 'Whether you are recognized as start up by DPIIT' is Yes in Part A General.");

    /* A602 — the 80-IAC value in Schedule VI-A (Sl. No. 2d) cannot exceed
       AmtDedCurAY (Sl. No. 6 of this schedule). */
    A(602, N(VIA.Section80IAC) <= N(IA.AmtDedCurAY)+1,
      "Schedule 80IAC: the 80-IAC value in Schedule VI-A (Sl. No. 2d) cannot exceed the amount of deduction at Sl. No. 6 of Schedule 80-IAC.");
  }

  /* A603 — 80-IAC claimed in Schedule VI-A (Sl. No. 2d) but Schedule 80-IAC
     not filled → error. Keyed on VI-A so it fires when the schedule is absent. */
  if(I.ScheduleVIA){
    A(603, N(VIA.Section80IAC)<=0 || (I.Schedule80IAC && N(RG(I,"Schedule80IAC.AmtDedCurAY"))>0),
      "Schedule 80IAC: deduction u/s 80-IAC is claimed in Schedule VI-A at Sl. No. 2d but Schedule 80-IAC is not filled.");
  }

  /* =====================================================================
     Schedule 80LA — OBU / IFSC unit deduction (A604–A606). Book: 80LA.md.
     Row leaves: SubSecDedClmd (item 2), EntityType (3), IncmTypeUnt (4),
     RegGNTAuth (5), RegDate (6), RegNumber (7), FstAYDeduction (8),
     AmtDedCurAY (9).
     ===================================================================== */
  if(I.Schedule80LA){
    const rows=RG(I,"Schedule80LA.Schedule80LADtls",[])||[];

    /* A604 — if amount claimed > 0, the sub-section (item 2) must be selected. */
    A(604, rows.every(r=>N(r&&r.AmtDedCurAY)<=0 || S0(r&&r.SubSecDedClmd)),
      "Schedule 80LA: when a deduction amount is claimed, the sub-section under which the deduction is claimed must be selected.");

    /* A605 — if the amount (Sl. No. 8/9) > 0, items 1 to 7 must all be filled. */
    A(605, rows.every(r=>N(r&&r.AmtDedCurAY)<=0 ||
        (S0(r&&r.SubSecDedClmd)&&S0(r&&r.EntityType)&&S0(r&&r.IncmTypeUnt)&&
         S0(r&&r.RegGNTAuth)&&S0(r&&r.RegDate)&&S0(r&&r.RegNumber)&&S0(r&&r.FstAYDeduction))),
      "Schedule 80LA: when a deduction amount is claimed, items 1 to 7 (sub-section, type of entity, type of income, registration authority, date, number and first assessment year) must all be filled.");

    /* A606 — type of entity is enabled based on the sub-section chosen:
       80LA(1) applies to a scheduled/foreign bank's OBU in SEZ; 80LA(1A)
       applies to a Unit of an IFSC. Fires only when both are present and
       inconsistent, so a lawful pairing never fires. */
    A(606, rows.every(function(r){
        if(!r||!S0(r.SubSecDedClmd)||!S0(r.EntityType)) return true;
        if(r.SubSecDedClmd==="80LA(1)")  return r.EntityType==="SchdBankSEZ"||r.EntityType==="FrgnBankSEZ";
        if(r.SubSecDedClmd==="80LA(1A)") return r.EntityType==="UntIFSC";
        return true;
      }),
      "Schedule 80LA: the type of entity must be consistent with the sub-section under which the deduction is claimed (80LA(1) for a bank's OBU in SEZ; 80LA(1A) for a Unit of an IFSC).");
  }

  /* =====================================================================
     Schedule VI-A → schedule-mandatory back-references (A584 / A595).
     Keyed on VI-A so they fire even when the donation schedule is absent.
     ===================================================================== */
  if(I.ScheduleVIA){
    /* A584 — if 80GGB is claimed in Schedule VI-A, Schedule 80GGB is mandatory. */
    A(584, N(VIA.Section80GGB)<=0 ||
        (I.Schedule80GGB && (N(RG(I,"Schedule80GGB.TotalEligibleDonationAmt80GGB"))>0 ||
          (RG(I,"Schedule80GGB.Schedule80GGBDetails",[])||[]).length>0)),
      "Schedule 80GGB: deduction u/s 80GGB is claimed in Schedule VI-A but Schedule 80GGB is not filled.");

    /* A595 — if 80GGC is claimed in Schedule VI-A, Schedule 80GGC is mandatory. */
    A(595, N(VIA.Section80GGC)<=0 ||
        (I.Schedule80GGC && (N(RG(I,"Schedule80GGC.TotalEligibleDonationAmt80GGC"))>0 ||
          (RG(I,"Schedule80GGC.Schedule80GGCDetails",[])||[]).length>0)),
      "Schedule 80GGC: deduction u/s 80GGC is claimed in Schedule VI-A but Schedule 80GGC is not filled.");
  }
});
