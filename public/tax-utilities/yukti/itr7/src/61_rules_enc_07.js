/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_07 (Phase 6).
   Serial range A309–A358 — the arithmetic-consistency and cross-schedule
   rules of Schedule OS (A309–A325), Schedule VDA (A326–A329), Schedule BP
   / CorpScheduleBP (A330–A353) and Schedule CYLA (A354–A358). Registered
   via ruleset(fn); runRules() invokes it with (I,S_,A,Dd). A(n,cond,msg)
   fires (pushes a Category-A block) when cond — the "this return is lawful"
   assertion — is FALSE. Every read is guarded (RG / N() / (X||{})); nothing
   throws. Keys are the built-return ITR7 schema paths (I = the ITR7 block);
   the paths and enum codes were taken from
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json and the built sections
   70_sec_os.js (expOs), 70_sec_vda.js (expVda), 70_sec_bp.js (expBp),
   70_sec_cyla.js (expCyla), plus 70_sec_vc.js / 70_sec_cg.js / 70_sec_si.js
   for the cross-schedule reads.

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Every serial A309–A358 is ENFORCED (rule_census.md) — all 50 are encoded
   here; none are NA/OFFLINE. Where the built-return floors a value (item 7 =
   2 + MAX(0,6); item 9 = 7 + MAX(0,8e); VDA Col 7 = MAX(0, Col6−Col5); Part
   D = A36 + MAX(0,B40) + MAX(0,C46) + A3d) the "lawful" assertion carries the
   same flooring, so it is silent on a self-consistent return and fires only
   on a genuine inconsistency. Each schedule block enters only under its own
   if(<block>) guard, so it stays silent when the schedule is absent (as on
   the resident charitable-trust test client, whose HP/BP/CG/OS/CYLA are nil).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const EQ  = (a,b)=>Math.abs(N(a)-N(b))<=1;              /* rupee-tolerance equality */
  const M0  = v=>Math.max(0,N(v));                         /* floored at nil */
  const qsum= o=>{const d=((o||{}).DateRange)||{};          /* Σ of an item-10 DateRange block */
                  return Object.keys(d).reduce((s,k)=>s+N(d[k]),0);};
  const sumBy=(arr,pred,fld)=>(arr||[]).reduce((s,r)=>s+(r&&pred(r)?N(r[fld]):0),0);

  /* residential status gates whether a 2e DTAA row counts (NRI ⇒ only TRC=Yes). */
  const resNRI = String(RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus","RES"))==="NRI";
  /* section under which exemption is claimed (Part A-General). */
  const exsec  = String(RG(I,"PartA_GEN1.OrgFirmInfo.SecExemptionClaimed",""));

  /* ==================================================================
     Schedule OS — A309–A319, A321–A325 (A320 is cross-schedule, below).
     ================================================================== */
  const OS = RG(I,"ScheduleOS",null);
  if(OS){
    const io  = RG(OS,"IncOthThanOwnRaceHorse",{})||{};
    const ded = RG(io,"Deductions",{})||{};
    const rh  = RG(OS,"IncFromOwnHorse",{})||{};
    const dt  = RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])||[];
    const spl = RG(io,"OthersGrossDtls",[])||[];
    const pti = RG(io,"PTIOthersGrossDtls",[])||[];
    const cnt = r=>resNRI ? (String(r.TaxRescertifiedFlag)==="Y") : true;   /* 2e counted row */
    const codeSum = code=> sumBy(spl,r=>String(r.SourceDescription)===code,"SourceAmount")
                         + sumBy(pti,r=>String(r.SourceDescription)==="PTI_"+code,"SourceAmount");
    /* DTAA attributable to the item-1 normal lines (moved from item 6 to item 2). */
    const ITEM1NAT = ["1ai","1aiii","1b","1c","1d"];
    const dtaa6  = sumBy(dt,r=>cnt(r)&&ITEM1NAT.indexOf(String(r.NatureOfIncome))>=0,"DTAAamt");
    const dtaa1ai   = sumBy(dt,r=>cnt(r)&&String(r.NatureOfIncome)==="1ai","DTAAamt");
    const dtaa1aiii = sumBy(dt,r=>cnt(r)&&String(r.NatureOfIncome)==="1aiii","DTAAamt");

    /* A309 — item 6 (BalanceNoRaceHorse) = 1 (excl. its DTAA) − 3 + 4 + 5. */
    A(309, EQ(io.BalanceNoRaceHorse,
        N(io.GrossIncChrgblTaxAtAppRate) - dtaa6 - N(ded.TotDeductions)
        + N(io.AmtNotDeductibleUs58) + N(io.ProfitChargTaxUs59)),
      "Schedule OS: item 6 (net income at normal rates) must equal item 1 (less the DTAA moved to item 2) − item 3 + item 4 + item 5.");
    /* A310 — item 7 = 2 + 6 (item 6 taken as nil if negative). */
    A(310, EQ(OS.TotOthSrcNoRaceHorse, N(io.IncChargeableSpecialRates) + M0(io.BalanceNoRaceHorse)),
      "Schedule OS: item 7 (income from other sources other than race horses) must equal item 2 + item 6.");
    /* A311 — 8e = 8a − 8b + 8c + 8d. */
    A(311, EQ(rh.BalanceOwnRaceHorse,
        N(rh.Receipts) - N(rh.DeductSec57) + N(rh.AmtNotDeductibleUs58) + N(rh.ProfitChargTaxUs59)),
      "Schedule OS: item 8(e) balance must equal receipts (8a) − deductions u/s 57 (8b) + amounts not deductible u/s 58 (8c) + profits chargeable u/s 59 (8d).");
    /* A312 — item 9 = 7 + 8e (8e taken as nil if negative). */
    A(312, EQ(OS.IncChargeableFrmOthSrc, N(OS.TotOthSrcNoRaceHorse) + M0(rh.BalanceOwnRaceHorse)),
      "Schedule OS: item 9 (income from other sources) must equal item 7 + item 8(e).");
    /* A313 — 1a = 1a(i) + 1a(ii) + 1a(iii). */
    A(313, EQ(io.DividendGross, N(io.DividendOthThan22e) + N(io.Dividend22e) + N(io.Dividend22f)),
      "Schedule OS: item 1a (dividends, gross) must equal 1a(i) + 1a(ii) + 1a(iii).");
    /* A314 — depreciation (3b) only where rental income (1c) is offered. */
    A(314, N(ded.Depreciation)<=0 || N(io.RentFromMachPlantBldgs)>0,
      "Schedule OS: depreciation (item 3b) can be claimed only where rental income is offered at item 1c.");
    /* A315 — quarterly 115A(1)(a)(i) dividend @20% = 2c/2d income at that head. */
    A(315, EQ(qsum(OS.DividendIncUs115A1ai), codeSum("5A1ai")),
      "Schedule OS: the item-10 quarterly break-up of dividend u/s 115A(1)(a)(i) @20% must equal the 115A(1)(a)(i) dividend income selected at 2c/2d.");
    /* A316 — quarterly 115AC dividend @10% = 2c/2d 115AC(1)(b) GDR dividend. */
    A(316, EQ(qsum(OS.DividendIncUs115AC), codeSum("5AC1abD")),
      "Schedule OS: the item-10 quarterly break-up of dividend u/s 115AC @10% must equal the 115AC dividend income selected at 2c/2d.");
    /* A317 — quarterly FII 115AD(1)(i) dividend @20% = 2c/2d 115AD(1)(i) dividend. */
    A(317, EQ(qsum(OS.DividendIncUs115AD1iDiv), codeSum("5AD1iDiv")),
      "Schedule OS: the item-10 quarterly break-up of FII dividend u/s 115AD(1)(i) @20% must equal the 115AD(1)(i) dividend income selected at 2c/2d.");
    /* A318 — quarterly 1a(i) dividend = 1a(i) − DTAA (TRC) − adjusted interest u/s 57(1).
       Adjusted interest u/s 57(1) = MAX(0, 3c interest u/s 57(1) − deemed dividend 2(22)(e) at 1a(ii)). */
    A(318, EQ(qsum(OS.DividendIncUs115BBDA),
        N(io.DividendOthThan22e) - dtaa1ai - Math.max(0, N(ded.IntExp57) - N(io.Dividend22e))),
      "Schedule OS: the item-10 quarterly break-up of dividend at 1a(i) must equal 1a(i) − DTAA for dividend subject to TRC − adjusted interest expenditure u/s 57(1).");
    /* A319 — quarterly winnings (lotteries etc. 2(24)(ix)) = 2a(i) 115BB. */
    A(319, EQ(qsum(OS.IncFrmLottery), N(io.LtryPzzlChrgblUs115BB)),
      "Schedule OS: the item-10 quarterly break-up of winnings from lotteries, puzzles, races, games etc. must equal item 2a(i) (winnings chargeable u/s 115BB).");
    /* A321 — quarterly winnings from online games = 2a(ii) 115BBJ. */
    A(321, EQ(qsum(OS.IncFrmOnGames), N(io.IncChrgblUs115BBJ)),
      "Schedule OS: the item-10 quarterly break-up of winnings from online games u/s 115BBJ must equal item 2a(ii).");
    /* A322 — quarterly IFSC dividend under proviso to 115A(1)(a)(A) @10% = 2c/2d. */
    A(322, EQ(qsum(OS.DividendIncUs115A1aA), codeSum("5A1aA")),
      "Schedule OS: the item-10 quarterly break-up of IFSC-unit dividend under the proviso to 115A(1)(a)(A) @10% must equal the income selected at 2c/2d.");
    /* A323 — quarterly 1a(iii) dividend = 1a(iii) 2(22)(f) − DTAA (TRC). */
    A(323, EQ(qsum(OS.DividendIncUs115BBDAaiii), N(io.Dividend22f) - dtaa1aiii),
      "Schedule OS: the item-10 quarterly break-up of dividend at 1a(iii) must equal 1a(iii) (dividend u/s 2(22)(f)) − DTAA for dividend subject to TRC.");
    /* A325 — interest expenditure u/s 57(1) ≤ 20% of dividend at 1a(i) + 1a(ii). */
    A(325, N(ded.IntExp57) <= 0.20*(N(io.DividendOthThan22e) + N(io.Dividend22e)) + 1,
      "Schedule OS: interest expenditure u/s 57(1) cannot exceed 20% of the dividend income at 1a(i) + 1a(ii).");
  }

  /* A320 — cross-schedule: 2c anonymous donation u/s 115BBC ≥ Schedule VC Diii,
     when the exemption in Part A-General is 10(23C)(iiiad) or 10(23C)(iiiae).
     Guarded at top level (a missing Schedule OS is itself the violation). */
  {
    const io2 = RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const anon = sumBy(RG(io2,"OthersGrossDtls",[])||[],   r=>String(r.SourceDescription)==="5BBC","SourceAmount")
               + sumBy(RG(io2,"PTIOthersGrossDtls",[])||[],r=>String(r.SourceDescription)==="PTI_5BBC","SourceAmount");
    const vcDiii = N(RG(I,"ScheduleVC.AnonymousDonations.AnonymousDonations115BBC",0));
    A(320, ["23CIIIAD","23CIIIAE"].indexOf(exsec)<0 || anon >= vcDiii-1,
      "Schedule OS: with exemption u/s 10(23C)(iiiad)/(iiiae), the anonymous donation u/s 115BBC at item 2c must be at least Diii of Schedule VC.");
  }

  /* A324 — cross-schedule: a buy-back loss claimed in Schedule CG (short-term
     or long-term CapitalLossBuyBackShares) requires the corresponding dividend
     to be offered in Schedule OS (item 1a). */
  {
    const bbST = N(RG(I,"ScheduleCG.ShortTermCapGain.CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0));
    const bbLT = N(RG(I,"ScheduleCG.LongTermCapGain.CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0));
    const hasBB = bbST!==0 || bbLT!==0;
    A(324, !hasBB || N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.DividendGross",0))>0,
      "Schedule OS: where a buy-back loss is claimed in Schedule CG, the details of dividend must be filled in Schedule OS.");
  }

  /* ==================================================================
     Schedule VDA — A326–A329.
     ================================================================== */
  const VDA = RG(I,"ScheduleVDA",null);
  if(VDA){
    const rows = RG(VDA,"ScheduleVDADtls",[])||[];
    /* A326 — Col 7 income = Col 6 − Col 5 (a loss is entered as nil). */
    A(326, rows.every(r=>!r || EQ(r.IncomeFromVDA, Math.max(0, N(r.ConsidReceived) - N(r.AcquisitionCost)))),
      "Schedule VDA: income (Col 7) must equal consideration received (Col 6) − cost of acquisition (Col 5), a loss being taken as nil.");
    /* A327 — A Total = Σ Col 7 where head = Business Income. */
    A(327, EQ(VDA.TotIncBusiness, sumBy(rows,r=>String(r.HeadUndIncTaxed)==="BI","IncomeFromVDA")),
      "Schedule VDA: total A must equal the sum of Col 7 for rows whose head of income (Col 4) is Business Income.");
    /* A328 — B Total = Σ Col 7 where head = Capital Gain. */
    A(328, EQ(VDA.TotIncCapGain, sumBy(rows,r=>String(r.HeadUndIncTaxed)==="CG","IncomeFromVDA")),
      "Schedule VDA: total B must equal the sum of Col 7 for rows whose head of income (Col 4) is Capital Gain.");
    /* A329 — dates of acquisition / transfer not after 31 March of the FY. */
    A(329, rows.every(r=>!r ||
        ((!r.DateofAcquisition || String(r.DateofAcquisition)<="2026-03-31") &&
         (!r.DateofTransfer   || String(r.DateofTransfer)  <="2026-03-31"))),
      "Schedule VDA: the date of acquisition or date of transfer cannot be after 31 March of the financial year.");
  }

  /* ==================================================================
     Schedule BP (CorpScheduleBP) — A330–A353.
     ================================================================== */
  const BP = RG(I,"CorpScheduleBP",null);
  if(BP){
    const a   = RG(BP,"BusinessIncOthThanSpec",{})||{};
    const ir  = RG(a,"IncRecCredPLOthHeadDtls",{})||{};
    const ic  = RG(a,"IncCredPL",{})||{};
    const ed2 = RG(a,"ExpDebToPLOthHeadsInc",{})||{};
    const dep = RG(a,"DepreciationAllowITAct32",{})||{};
    const dpb = RG(a,"DeemedProfitBusUs",{})||{};
    const sb  = RG(BP,"SpecBusinessInc",{})||{};
    const sc  = RG(BP,"IncSpecifiedBusiness",{})||{};
    const be  = RG(BP,"BusSetoffCurrYr",{})||{};

    /* A330 — A6 balance = 1 − 2a − 2b − 3a − 3b − 3c − 3d − 4 − 5d. */
    A(330, EQ(a.BalancePLOthThanSpecBus,
        N(a.ProfBfrTaxPL) - N(a.NetPLFromSpecBus) - N(a.NetProfLossSpecifiedBus)
        - N(ir.HouseProperty) - N(ir.CapitalGains) - N(ir.OtherSources) - N(ir.UnderSec115BBH)
        - N(a.PLUs44sChapXIIG) - N(ic.TotExempInc)),
      "Schedule BP: item A6 (balance) must equal 1 − 2a − 2b − 3a − 3b − 3c − 3d − 4 − 5d.");
    /* A331 — total expenses (item 8) = 7a + 7b + 7c + 7d. */
    A(331, EQ(a.TotExpDebPL,
        N(ed2.HouseProperty) + N(ed2.CapitalGains) + N(ed2.OtherSources) + N(ed2.UnderSec115BBH)),
      "Schedule BP: the total of expenses considered under other heads must equal 7a + 7b + 7c + 7d.");
    /* A332 — adjusted profit/loss = 6 + 8 (balance + total expenses). */
    A(332, EQ(a.AdjustedPLOthThanSpecBus, N(a.BalancePLOthThanSpecBus) + N(a.TotExpDebPL)),
      "Schedule BP: adjusted profit or loss must equal item 6 + item 8.");
    /* A333 — 12(iii) total depreciation = 12i + 12ii. */
    A(333, EQ(dep.TotDeprAllowITAct,
        N(dep.DepreciationAllowUs32_1_ii) + N(dep.DepreciationAllowUs32_1_i)),
      "Schedule BP: total depreciation allowable under the Income-tax Act (12iii) must equal 12i + 12ii.");
    /* A334 — profit/loss after depreciation = adjusted PL + depreciation debited − 12iii. */
    A(334, EQ(a.AdjustPLAfterDeprOthSpecInc,
        N(a.AdjustedPLOthThanSpecBus) + N(a.DepreciationDebPLCosAct) - N(dep.TotDeprAllowITAct)),
      "Schedule BP: profit or loss after adjustment for depreciation must equal adjusted profit/loss + depreciation debited to the accounts − 12iii.");
    /* A335 — total after additions = profit after depreciation + Σ(items 14–24). */
    const ADD = ["AmtDebPLDisallowUs36","AmtDebPLDisallowUs37","AmtDebPLDisallowUs40","AmtDebPLDisallowUs40A",
      "AmtDebPLDisallowUs43B","InterestDisAllowUs23SMEAct","DeemIncUs41","Total33ABto35ABB","DeemIncUs43CA",
      "OthItemDisallowUs28To44DA","AnyOthIncNotInclInExpDisallowPL"];
    A(335, EQ(a.TotAfterAddToPLDeprOthSpecInc,
        N(a.AdjustPLAfterDeprOthSpecInc) + ADD.reduce((s,k)=>s+N(a[k]),0)),
      "Schedule BP: the total after additions must equal profit/loss after depreciation + the sum of the addition items (14–24).");
    /* A336 — total deductions = Σ(items 26–32). */
    const DED = ["DeductUs32_1_iii","Amt32AC","DebPLUs35ExcessAmt","AmtDisallUs40NowAllow",
      "AmtDisallUs43BNowAllow","AnyOthAmtAllDeduct","DecProfIncLossAccICDSAdj"];
    A(336, EQ(a.TotDeductionAmts, DED.reduce((s,k)=>s+N(a[k]),0)),
      "Schedule BP: the total of the deduction items must equal the sum of items 26 to 32.");
    /* A337 — income = total after additions − total deductions. */
    A(337, EQ(a.PLAftAdjDedBusOthThanSpec,
        N(a.TotAfterAddToPLDeprOthSpecInc) - N(a.TotDeductionAmts)),
      "Schedule BP: income (item 34) must equal the total after additions − the total deductions.");
    /* A338 — net P/L other than speculative/specified = income + deemed presumptive profit. */
    A(338, EQ(a.NetPLAftAdjBusOthThanSpec,
        N(a.PLAftAdjDedBusOthThanSpec) + N(dpb.TotDeemedProfitBusUs)),
      "Schedule BP: net profit/loss from business other than speculative and specified business must equal item 33 + item 34.");
    /* A339 — B40 speculative income = 37 + 38 − 39. */
    A(339, EQ(sb.AdjustedPLFrmSpecuBus,
        N(sb.NetPLFrmSpecBus) + N(sb.AdditionUs28to44DA) - N(sb.DeductUs28to44DA)),
      "Schedule BP: income from speculative business (B40) must equal 37 + 38 − 39.");
    /* A340 — C44 profit/loss from specified business = 41 + 42 − 43. */
    A(340, EQ(sc.ProfitLossSpecifiedBusiness,
        N(sc.NetPLFrmSpecifiedBus) + N(sc.AddSec28to44DA) - N(sc.DedSec28to44DAOTDedSec35AD)),
      "Schedule BP: profit or loss from specified business (C44) must equal 41 + 42 − 43.");
    /* A341 — C46 income from specified business = 44 − 45. */
    A(341, EQ(sc.ProfitLossSpecifiedBusFinal, N(sc.ProfitLossSpecifiedBusiness) - N(sc.DedSec35AD)),
      "Schedule BP: income from specified business (C46) must equal 44 − 45.");
    /* A342 — D48 = A36 + B40 + C46 + A3d (B40/C46 taken as nil if negative). */
    A(342, EQ(BP.IncChrgUnHdProftGain,
        N(a.NetPLBusOthThanSpec7A7B7C) + M0(sb.AdjustedPLFrmSpecuBus) + M0(sc.ProfitLossSpecifiedBusFinal) + N(ir.UnderSec115BBH)),
      "Schedule BP: income chargeable under 'Profits and gains from business or profession' (D48) must equal A36 + B40 + C46 + A3d.");
    /* A343 — capital-gains income removed from BP (A3b) must be offered under Schedule CG. */
    A(343, N(ir.CapitalGains) <= N(RG(I,"ScheduleCG.IncChargeableHeadCapGain",0)) + 1,
      "Schedule BP: the capital-gains income reduced at A3b must be offered under Schedule CG — the capital gains shown there cannot be less than the amount reduced from BP A3b.");
    /* A344 — other-sources income removed from BP (A3c) must be offered under Schedule OS. */
    A(344, N(ir.OtherSources) <= N(RG(I,"ScheduleOS.IncChargeableFrmOthSrc",0)) + 1,
      "Schedule BP: the other-sources income reduced at A3c must be offered under Schedule OS — the income shown there cannot be less than the amount reduced from BP A3c.");
    /* A345 — Table E: income remaining after set off = income of current year − business loss set off. */
    const spI = RG(be,"SpeculativeInc",null), sfI = RG(be,"SpecifiedInc",null);
    A(345, (!spI || EQ(spI.IncOfCurYrAfterSetOff, N(spI.IncOfCurYrUnderThatHead) - N(spI.BusLossSetoff)))
        && (!sfI || EQ(sfI.IncOfCurYrAfterSetOff, N(sfI.IncOfCurYrUnderThatHead) - N(sfI.BusLossSetoff))),
      "Schedule BP (Table E): business income remaining after set off must equal the income of the current year − the business loss set off.");
    /* A346 — specified-business income/loss entered ⇒ a 35AD(5) clause must be selected. */
    const specifiedActive =
        N(a.NetProfLossSpecifiedBus)!==0 || N(sc.NetPLFrmSpecifiedBus)!==0 ||
        N(sc.AddSec28to44DA)!==0 || N(sc.DedSec28to44DAOTDedSec35AD)!==0 || N(sc.DedSec35AD)!==0 ||
        N(sc.ProfitLossSpecifiedBusiness)!==0 || N(sc.ProfitLossSpecifiedBusFinal)!==0;
    const clauses = RG(sc,"DedUs35ADSubSec5Dtls",[])||[];
    A(346, !specifiedActive || clauses.some(c=>c && String(c.DedUs35ADSubSec5||"").trim()!==""),
      "Schedule BP: when income or loss from specified business is entered, the nature of the specified business (clause of section 35AD(5)) cannot be blank.");
    /* A347 — E(iv) total loss set off = E(ii) + E(iii). */
    A(347, EQ(be.TotLossSetOffOnBus,
        N(RG(be,"SpeculativeInc.BusLossSetoff",0)) + N(RG(be,"SpecifiedInc.BusLossSetoff",0))),
      "Schedule BP: E(iv) total loss set off must equal E(ii) + E(iii).");
    /* A348 — E(v) loss remaining = E(i) − E(iv). */
    A(348, EQ(be.LossRemainSetOffOnBus, N(be.LossSetOffOnBusLoss) - N(be.TotLossSetOffOnBus)),
      "Schedule BP: E(v) loss remaining after set off must equal E(i) − E(iv).");
    /* A349 — A3c = A3(c)(i) + A3(c)(ii). */
    A(349, EQ(ir.OtherSources, N(ir.Dividend) + N(ir.OtherThanDividend)),
      "Schedule BP: item A3c (other sources) must equal A3(c)(i) + A3(c)(ii).");
    /* A350 — A3d (115BBH, net of cost) = Schedule VDA total A. */
    A(350, EQ(ir.UnderSec115BBH, N(RG(I,"ScheduleVDA.TotIncBusiness",0))),
      "Schedule BP: the amount at A3d (u/s 115BBH, net of cost of acquisition) must match total A of Schedule VDA.");
    /* A351 — A3d = the 115BBH business income shown in Schedule SI (SecCode 5BBHi). */
    A(351, EQ(ir.UnderSec115BBH,
        sumBy(RG(I,"ScheduleSI.SplCodeRateTax",[])||[], r=>String(r.SecCode)==="5BBHi","SplRateInc")),
      "Schedule BP: item A3d must equal the income under the head business or profession for tax on VDA u/s 115BBH shown in Schedule SI.");
    /* A352 — dividend removed from BP (A3c(i)) not more than Schedule OS item 1a. */
    A(352, N(ir.Dividend) <= N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.DividendGross",0)) + 1,
      "Schedule BP: the dividend income reduced at A3c(i) cannot be more than item 1a of Schedule OS.");
    /* A353 — 5c dividend income cannot be more than zero. */
    A(353, N(RG(ic,"OtherExmptIncDtl.OperatingDividendAmt",0)) <= 0,
      "Schedule BP: the dividend income at item 5c cannot be more than zero.");
  }

  /* ==================================================================
     Schedule CYLA — A354–A358.
     ================================================================== */
  const CY = RG(I,"ScheduleCYLA",null);
  if(CY){
    const HEADS = ["HP","BusProfExclSpecProf","SpeculationIncome","SpecifiedBusIncome","STCG20Per",
      "STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate",
      "OthSrcExclRaceHorseLottery","ProfitFrmRaceHorse","IncOSDTAA"];
    const leaf = (h,l)=>N(RG(CY,h+".IncCYLA."+l,0));
    const tl = RG(CY,"TotalLossSetOff",{})||{};
    const tc = RG(CY,"TotalCurYr",{})||{};
    const lr = RG(CY,"LossRemAftSetOff",{})||{};

    /* A354 — xiv col 2 (HP loss set off) = Σ col-2 rows, capped at Rs 2,00,000. */
    A(354, EQ(tl.TotHPlossCurYrSetoff,
        Math.min(HEADS.reduce((s,h)=>s+leaf(h,"HPlossCurYrSetoff"),0), 200000)),
      "Schedule CYLA: total HP loss set off (column 2, row xiv) must equal the sum of column 2, capped at Rs 2,00,000.");
    /* A355 — xiv col 3 (business loss set off) = Σ col-3 rows. */
    A(355, EQ(tl.TotBusLossSetoff, HEADS.reduce((s,h)=>s+leaf(h,"BusLossSetoff"),0)),
      "Schedule CYLA: total business loss set off (column 3, row xiv) must equal the sum of column 3.");
    /* A356 — xiv col 4 (other-sources loss set off) = Σ col-4 rows. */
    A(356, EQ(tl.TotOthSrcLossNoRaceHorseSetoff, HEADS.reduce((s,h)=>s+leaf(h,"OthSrcLossNoRaceHorseSetoff"),0)),
      "Schedule CYLA: total other-sources loss set off (column 4, row xiv) must equal the sum of column 4.");
    /* A357 — xv col 2 (HP loss remaining) = loss to be adjusted (col 2) − xiv col 2. */
    A(357, EQ(lr.BalHPlossCurYrAftSetoff, N(tc.TotHPlossCurYr) - N(tl.TotHPlossCurYrSetoff)),
      "Schedule CYLA: HP loss remaining after set off (column 2, row xv) must equal the loss to be adjusted (column 2) − row xiv column 2.");
    /* A358 — xv col 3 (business loss remaining) = loss to be adjusted (col 3) − xiv col 3. */
    A(358, EQ(lr.BalBusLossAftSetoff, N(tc.TotBusLoss) - N(tl.TotBusLossSetoff)),
      "Schedule CYLA: business loss remaining after set off (column 3, row xv) must equal the loss to be adjusted (column 3) − row xiv column 3.");
  }
});
