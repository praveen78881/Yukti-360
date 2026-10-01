/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_10 (Phase 6).
   Serial range A457–A506:
     · A457            — Schedule 115AD(1)(b)(iii)-proviso (Schedule115AD)
     · A458–A461       — Schedule VDA (ScheduleVDA)
     · A462–A500       — Schedule OS (ScheduleOS)
     · A501–A506       — Schedule CYLA (ScheduleCYLA)
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N()); nothing throws. Keys are the built-return ITR6 schema
   paths (I = Object.values(buildReturn().ITR)[0]); paths verified against
   sources/ITR-6/ITR-6_2026_Main_V1_0_schema.json and the built sections
   (70_sec_cg / 70_sec_os / 70_sec_loss / 70_sec_bp / 70_sec_hp), with the
   schedule semantics from books/ITR-6/OS.md and books/ITR-6/CYLA_BFLA.md.
   Encoded from each rule's own text (constitution rule 6).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */

  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const resNRI = String(RG(FS,"ResidentialStatus",""))==="NRI";
  const opted115BAB = String(RG(FS,"Section115BA",""))==="115BAB";

  /* =====================================================================
     Schedule 115AD — 115AD(1)(b)(iii)-proviso LTCG table (NR only).
     ===================================================================== */
  if(I.Schedule115AD){
    const SAD=RG(I,"Schedule115AD",{})||{};
    const rows=RG(SAD,"Schedule115ADDtls",[])||[];

    /* A457 — the Total row equals the column-wise sum of the individual rows. */
    A(457,
      REQ(SAD.SaleValue115AD,           RSUM(rows,"TotSaleValue")) &&
      REQ(SAD.CostAcqWithoutIndx115AD,  RSUM(rows,"CostAcqWithoutIndx")) &&
      REQ(SAD.AcquisitionCost115AD,     RSUM(rows,"AcquisitionCost")) &&
      REQ(SAD.LTCGBeforelowerB1B2115AD, RSUM(rows,"LTCGBeforelower6and11")) &&
      REQ(SAD.FairMktValueCapAst115AD,  RSUM(rows,"TotFairMktValueCapAst")) &&
      REQ(SAD.ExpExclCnctTransfer115AD, RSUM(rows,"ExpExclCnctTransfer")) &&
      REQ(SAD.Deductions115AD,          RSUM(rows,"TotalDeductions")) &&
      REQ(SAD.Balance115AD,             RSUM(rows,"Balance")),
      "Schedule 115AD(1)(b)(iii)-proviso: each column Total must equal the sum of its individual rows.");
  }

  /* =====================================================================
     Schedule VDA — virtual digital assets (s.115BBH).
     Rows: AcquisitionCost (Sl.5), ConsidReceived (Sl.6), IncomeFromVDA
     (Sl.7); HeadUndIncTaxed BI=Business, CG=Capital Gain. Totals
     TotIncBusiness (A) / TotIncCapGain (B).
     ===================================================================== */
  if(I.ScheduleVDA){
    const VDA=RG(I,"ScheduleVDA",{})||{};
    const vrows=RG(VDA,"ScheduleVDADtls",[])||[];

    /* A458 — Sl.7 (income) = Sl.6 (consideration) − Sl.5 (cost), per row, but
       "enter nil in case of loss" (VDA.md; the schema floors IncomeFromVDA at 0)
       — a VDA loss is neither set off nor carried. Comparing against the raw
       (possibly negative) difference false-fired on a loss row. */
    vrows.forEach(function(r,i){
      if(!r) return;
      A(458, REQ(r.IncomeFromVDA, Math.max(0, N(r.ConsidReceived)-N(r.AcquisitionCost))),
        "Schedule VDA: row "+(i+1)+" — income (Sl.7) must equal consideration (Sl.6) minus cost of acquisition (Sl.5).");
    });

    /* A459 — A = Σ positive Sl.7 where head of income is Business. */
    A(459, REQ(VDA.TotIncBusiness,
        vrows.reduce((s,r)=>s+((r&&String(r.HeadUndIncTaxed)==="BI")?Math.max(0,N(r.IncomeFromVDA)):0),0)),
      "Schedule VDA: 'A' (total positive business income in Col.7) must equal the sum of Col.7 for rows whose head is Business Income.");

    /* A460 — B = Σ positive Sl.7 where head of income is Capital Gain. */
    A(460, REQ(VDA.TotIncCapGain,
        vrows.reduce((s,r)=>s+((r&&String(r.HeadUndIncTaxed)==="CG")?Math.max(0,N(r.IncomeFromVDA)):0),0)),
      "Schedule VDA: 'B' (total positive capital gain in Col.7) must equal the sum of Col.7 for rows whose head is Capital Gain.");

    /* A461 — neither date of acquisition nor date of transfer after 31/03/2026. */
    vrows.forEach(function(r,i){
      if(!r) return;
      const da=r.DateofAcquisition, dt=r.DateofTransfer;
      A(461, (!S0(da) || da<="2026-03-31") && (!S0(dt) || dt<="2026-03-31"),
        "Schedule VDA: row "+(i+1)+" — date of acquisition/transfer cannot be after 31st March of the financial year (31/03/2026).");
    });
  }

  /* =====================================================================
     Schedule OS — income from other sources.
     ===================================================================== */
  if(I.ScheduleOS){
    const OS=RG(I,"ScheduleOS",{})||{};
    const io=RG(OS,"IncOthThanOwnRaceHorse",{})||{};
    const ded=RG(io,"Deductions",{})||{};
    const horse=RG(OS,"IncFromOwnHorse",{})||{};
    const og=RG(io,"OthersGrossDtls",[])||[];          /* 2c rows */
    const pg=RG(io,"PTIOthersGrossDtls",[])||[];        /* 2d rows */
    const dtaaRows=RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])||[];

    /* DTAA counting: for a non-resident only TRC-certified rows count toward
       the special-rate leg (OS.md; matches the section's counts() gate). */
    const counts=r=>!resNRI || (r&&String(r.TaxRescertifiedFlag)==="Y");
    /* Σ DTAAamt for a nature. onlyCount=true applies the NR/TRC gate. */
    const dtNat=(nat,onlyCount)=>dtaaRows.reduce((s,r)=>
      s+((r&&String(r.NatureOfIncome)===nat&&(!onlyCount||counts(r)))?N(r.DTAAamt):0),0);
    /* DTAA6 = the item-1-attributable DTAA portion (natures 1ai,1aiii,1b,1c,1d). */
    const ITEM1_NAT=["1ai","1aiii","1b","1c","1d"];
    const dtaa6=dtaaRows.reduce((s,r)=>
      s+((r&&counts(r)&&ITEM1_NAT.indexOf(String(r.NatureOfIncome))>=0)?N(r.DTAAamt):0),0);
    /* Σ SourceAmount in 2c/2d rows carrying a given section code. */
    const codeSum=(arr,code)=>(arr||[]).reduce((s,r)=>
      s+((r&&String(r.SourceDescription)===code)?N(r.SourceAmount):0),0);
    const hasCode=(arr,code)=>(arr||[]).some(r=>r&&String(r.SourceDescription)===code&&N(r.SourceAmount)!==0);

    const div_i=N(io.DividendOthThan22e), div_ii=N(io.Dividend22e), div_iii=N(io.Dividend22f);

    /* A462 — a non-resident cannot offer income u/s 115BBF (codes 5BBF / PTI_5BBF at 2c/2d). */
    A(462, !resNRI || !(hasCode(og,"5BBF")||hasCode(pg,"PTI_5BBF")),
      "Schedule OS: a non-resident cannot offer income under section 115BBF.");

    /* A463 — Sl.1 gross income at normal rates = 1a + 1b + 1c + 1d + 1e. */
    A(463, REQ(io.GrossIncChrgblTaxAtAppRate,
        N(io.DividendGross)+N(io.InterestGross)+N(io.RentFromMachPlantBldgs)+N(io.Tot562x)+N(io.AnyOtherIncome)),
      "Schedule OS: Sl.1 (gross amount chargeable at normal applicable rates) must equal 1a + 1b + 1c + 1d + 1e.");

    /* A464 — Sl.3d deduction u/s 57 = 3a + 3b + 3c. */
    A(464, REQ(ded.TotDeductions, N(ded.Expenses)+N(ded.Depreciation)+N(ded.IntExp57)),
      "Schedule OS: Sl.3d (deduction u/s 57) must equal 3a + 3b + 3c.");

    /* A465 — depreciation (3b) restricted to the 1c rental income. */
    A(465, N(ded.Depreciation) <= Math.max(0,N(io.RentFromMachPlantBldgs)),
      "Schedule OS: the depreciation deduction at 3b is restricted to the rental income from machinery/plant/buildings at 1c.");

    /* A466 — Sl.7 = 2 + 6 (6 taken as nil if negative). */
    A(466, REQ(OS.TotOthSrcNoRaceHorse, N(io.IncChargeableSpecialRates)+Math.max(0,N(io.BalanceNoRaceHorse))),
      "Schedule OS: Sl.7 (income from other sources other than owning race horses) must equal Sl.2 + Sl.6.");

    /* A467 — Sl.8e balance = 8a − 8b + 8c + 8d. */
    A(467, REQ(horse.BalanceOwnRaceHorse,
        N(horse.Receipts)-N(horse.DeductSec57)+N(horse.AmtNotDeductibleUs58)+N(horse.ProfitChargTaxUs59)),
      "Schedule OS: Sl.8e (balance) must equal 8a − 8b + 8c + 8d.");

    /* A468 — Sl.9 = 7 + 8e (8e taken as nil if negative). */
    A(468, REQ(OS.IncChargeableFrmOthSrc, N(OS.TotOthSrcNoRaceHorse)+Math.max(0,N(horse.BalanceOwnRaceHorse))),
      "Schedule OS: Sl.9 (income under the head Other Sources) must equal Sl.7 + Sl.8e (8e as nil if negative).");

    /* A469 — Sl.2d PTI at special rate = Σ of its dropdown rows. */
    A(469, REQ(io.PassThrIncOSChrgblSplRate, RSUM(pg,"SourceAmount")),
      "Schedule OS: Sl.2d (pass-through income at special rates) must equal the sum of all its dropdown rows.");

    /* A470 — Sl.1d 56(2)(x) income = 1di + 1dii + 1diii + 1div + 1dv. */
    A(470, REQ(io.Tot562x, Math.max(0, N(io.Aggrtvaluewithoutcons562x)+N(io.Immovpropwithoutcons562x)
        +N(io.Immovpropinadeqcons562x)+N(io.Anyotherpropwithoutcons562x)+N(io.Anyotherpropinadeqcons562x))),
      "Schedule OS: Sl.1d (income u/s 56(2)(x)) must equal 1di + 1dii + 1diii + 1div + 1dv.");

    /* A471 — Sl.6 = 1(after reducing the DTAA portion) − 3 + 4 + 5. */
    A(471, REQ(io.BalanceNoRaceHorse,
        N(io.GrossIncChrgblTaxAtAppRate)-dtaa6-N(ded.TotDeductions)+N(io.AmtNotDeductibleUs58)+N(io.ProfitChargTaxUs59)),
      "Schedule OS: Sl.6 (net income at normal rates) must equal Sl.1 (net of the DTAA portion) − Sl.3 + Sl.4 + Sl.5.");

    /* A472 — Sl.2 special-rate income = 2ai + 2aii + 2b + 2c + 2d + (2e related to Sl.1). */
    A(472, REQ(io.IncChargeableSpecialRates,
        Math.max(0, N(io.LtryPzzlChrgblUs115BB)+N(io.IncChrgblUs115BBJ)+N(io.IncChrgblUs115BBE)
          +N(io.OthersGross)+N(io.PassThrIncOSChrgblSplRate)+dtaa6)),
      "Schedule OS: Sl.2 (income chargeable at special rate) must equal 2ai + 2aii + 2b + 2c + 2d + the 2e elements related to Sl.1.");

    /* A473 — Sl.2e column 10 (applicable rate) = lower of column 6 (treaty) and column 9 (IT-Act). */
    dtaaRows.forEach(function(r,i){
      if(!r) return;
      const appl=r.ApplicableRate, tr=N(r.RateAsPerTreaty), it=N(r.RateAsPerITAct);
      if(!S0(appl) || !(tr>0) || !(it>0)) return;       /* both rates present & positive */
      A(473, Math.abs(N(appl)-Math.min(tr,it))<=0.01,
        "Schedule OS: Sl.2e row "+(i+1)+" — the applicable rate (col.10) must be the lower of the treaty rate (col.6) and the IT-Act rate (col.9).");
    });

    /* A474 — Sl.1b interest, gross = bi + bii + biii + biv + bv (+bvi). */
    A(474, REQ(io.InterestGross,
        N(io.IntrstFrmSavingBank)+N(io.IntrstFrmTermDeposit)+N(io.IntrstFrmIncmTaxRefund)
        +N(io.NatofPassThrghIncome)+N(io.IntrstFrmOthers)),
      "Schedule OS: Sl.1b (interest, gross) must equal the sum of its sub-lines (bi + bii + biii + biv + bv).");

    /* A475 — Sl.10 quarterly Dividend referred in 1a(i) = 1a(i) − DTAA(1ai subject to TRC)
       − adj 57(1) exp, where adj = MAX(0, 3c interest − deemed dividend u/s 2(22e) at 1a(ii)). */
    {
      const exp475 = div_i - dtNat("1ai",true) - Math.max(0, N(ded.IntExp57)-div_ii);
      A(475, !(exp475>0) || REQ(RDR(RG(OS,"DividendIncUs115BBDA",{})), exp475),
        "Schedule OS: the quarterly break-up of dividend referred in 1a(i) must equal 1a(i) − DTAA (subject to TRC) − adjusted expenditure u/s 57(1).");
    }

    /* A476 — Sl.10 quarterly winnings from lotteries etc. = 2ai. */
    A(476, REQ(RDR(RG(OS,"IncFrmLottery",{})), N(io.LtryPzzlChrgblUs115BB)),
      "Schedule OS: the quarterly break-up of winnings from lotteries/crossword puzzles etc. must equal Sl.2ai.");

    /* A477 — Sl.10 quarterly winnings from online games (115BBJ) = 2aii. */
    A(477, REQ(RDR(RG(OS,"IncFrmOnGames",{})), N(io.IncChrgblUs115BBJ)),
      "Schedule OS: the quarterly break-up of winnings from online games u/s 115BBJ must equal Sl.2aii.");

    /* A478 — Sl.10 quarterly dividend under proviso to 115A(1)(a)(A) @10% (IFSC unit)
       = dividend selected at 2c and 2d (codes 5A1aA / PTI_5A1aA). */
    A(478, REQ(RDR(RG(OS,"DividendIncUs115A1aA",{})), codeSum(og,"5A1aA")+codeSum(pg,"PTI_5A1aA")),
      "Schedule OS: the quarterly break-up of dividend under proviso to 115A(1)(a)(A) @10% must equal the dividend selected at Sl.2c and Sl.2d.");

    /* A479 — Sl.10 quarterly dividend u/s 115A(1)(a)(i) @20% = 2c and 2d (5A1ai / PTI_5A1ai). */
    A(479, REQ(RDR(RG(OS,"DividendIncUs115A1ai",{})), codeSum(og,"5A1ai")+codeSum(pg,"PTI_5A1ai")),
      "Schedule OS: the quarterly break-up of dividend u/s 115A(1)(a)(i) @20% must equal the dividend selected at Sl.2c and Sl.2d.");

    /* A480 — Σ 2e Col-2 amounts of nature 2aii must not exceed 2aii (115BBJ). */
    A(480, dtNat("2aii",false) <= N(io.IncChrgblUs115BBJ)+1,
      "Schedule OS: in table 2e, the total amount of income for 2aii must not exceed Sl.2aii (winnings from online games u/s 115BBJ).");

    /* A481 — Σ 2e Col-2 amounts of nature 1a(i) must not exceed 1a(i). */
    A(481, dtNat("1ai",false) <= div_i+1,
      "Schedule OS: in table 2e, the total amount of income for 1a(i) must not exceed Sl.1a(i) (dividend income other than (ii)).");

    /* A482 — Σ 2e Col-2 amounts of nature 1b must not exceed 1b. */
    A(482, dtNat("1b",false) <= N(io.InterestGross)+1,
      "Schedule OS: in table 2e, the total amount of income for 1b must not exceed Sl.1b (interest, gross).");

    /* A483 — Σ 2e Col-2 amounts of nature 1c must not exceed 1c. */
    A(483, dtNat("1c",false) <= N(io.RentFromMachPlantBldgs)+1,
      "Schedule OS: in table 2e, the total amount of income for 1c must not exceed Sl.1c (rental income from machinery/plant/buildings).");

    /* A484 — Σ 2e Col-2 amounts of nature 1d must not exceed 1d. */
    A(484, dtNat("1d",false) <= N(io.Tot562x)+1,
      "Schedule OS: in table 2e, the total amount of income for 1d must not exceed Sl.1d (income u/s 56(2)(x)).");

    /* A485 — Σ 2e Col-2 amounts of nature 2ai must not exceed 2ai. */
    A(485, dtNat("2ai",false) <= N(io.LtryPzzlChrgblUs115BB)+1,
      "Schedule OS: in table 2e, the total amount of income for 2ai must not exceed Sl.2ai (winnings from lotteries etc. u/s 115BB).");

    /* A486 — Σ 2e Col-2 amounts of nature 2c must not exceed 2c. */
    A(486, dtNat("2c",false) <= N(io.OthersGross)+1,
      "Schedule OS: in table 2e, the total amount of income for 2c must not exceed Sl.2c (any other income chargeable at special rate).");

    /* A487 — Σ 2e Col-2 amounts of nature 2d must not exceed 2d. */
    A(487, dtNat("2d",false) <= N(io.PassThrIncOSChrgblSplRate)+1,
      "Schedule OS: in table 2e, the total amount of income for 2d must not exceed Sl.2d (pass-through income at special rates).");

    /* A488 — opting 115BAB ⇒ no deduction at 3d or at 8b. */
    A(488, !opted115BAB || (N(ded.TotDeductions)===0 && N(horse.DeductSec57)===0),
      "Schedule OS: deduction at Sl.3d or Sl.8b is not allowed when the benefit of lower taxation u/s 115BAB is opted.");

    /* A489 — Sl.1a = 1a(i) + 1a(ii) + 1a(iii). */
    A(489, REQ(io.DividendGross, div_i+div_ii+div_iii),
      "Schedule OS: Sl.1a must equal 1a(i) + 1a(ii) + 1a(iii).");

    /* A490 — Sl.10 quarterly dividend u/s 115AC @10% = 2c and 2d (5AC1abD / PTI_5AC1abD). */
    A(490, REQ(RDR(RG(OS,"DividendIncUs115AC",{})), codeSum(og,"5AC1abD")+codeSum(pg,"PTI_5AC1abD")),
      "Schedule OS: the quarterly break-up of dividend u/s 115AC @10% must equal the dividend selected at Sl.2c and Sl.2d.");

    /* A491 — Sl.10 quarterly dividend (FII) u/s 115AD(1)(i) @20% = 2c and 2d (5AD1iDiv / PTI_5AD1iDiv). */
    A(491, REQ(RDR(RG(OS,"DividendIncUs115AD1iDiv",{})), codeSum(og,"5AD1iDiv")+codeSum(pg,"PTI_5AD1iDiv")),
      "Schedule OS: the quarterly break-up of dividend received by a FII u/s 115AD(1)(i) @20% must equal the dividend selected at Sl.2c and Sl.2d.");

    /* A492 — Sl.10 quarterly dividend (specified fund) u/s 115AD(1)(i) @10% = 2c and 2d (5AD1IBd / PTI_5AD1IBd). */
    A(492, REQ(RDR(RG(OS,"DividendIncUs115AD1IBd",{})), codeSum(og,"5AD1IBd")+codeSum(pg,"PTI_5AD1IBd")),
      "Schedule OS: the quarterly break-up of dividend received by a specified fund u/s 115AD(1)(i) @10% must equal the dividend selected at Sl.2c and Sl.2d.");

    /* A493 — interest expenditure u/s 57(1) (3c) must not exceed 20% of (1a(i) + 1a(ii)). */
    A(493, N(ded.IntExp57) <= 0.20*(div_i+div_ii)+1,
      "Schedule OS: interest expenditure u/s 57(1) cannot exceed 20% of the dividend income at Sl.1a(i) + Sl.1a(ii).");

    /* A494 — Sl.2c any other income at special rate = Σ of its dropdown rows. */
    A(494, REQ(io.OthersGross, RSUM(og,"SourceAmount")),
      "Schedule OS: Sl.2c (any other income chargeable at special rate) must equal the sum of all its dropdown rows.");

    /* A495 — Sl.2e amount chargeable at special DTAA rates = Σ of its dropdown rows. */
    A(495, REQ(RG(io,"IncChargblSplRateOS.TotalAmtTaxUsDTAASchOs"),
        dtaaRows.reduce((s,r)=>s+(counts(r)?N(r&&r.DTAAamt):0),0)),
      "Schedule OS: Sl.2e (amount chargeable at special rates as per DTAA) must equal the sum of all its dropdown rows.");

    /* A496 — expenses/deduction u/s 57 other than interest claimed ⇒ the corresponding
       income must be offered under the head Other Sources. */
    A(496, !(N(ded.Expenses)>0 || N(ded.Depreciation)>0) || N(io.GrossIncChrgblTaxAtAppRate)>0,
      "Schedule OS: when expenses/deduction u/s 57 (other than interest) are claimed, the corresponding income must be offered under the head Other Sources.");

    /* A497 — Sl.2b income chargeable u/s 115BBE = bi + bii + biii + biv + bv + bvi. */
    A(497, REQ(io.IncChrgblUs115BBE, Math.max(0, N(io.CashCreditsUs68)+N(io.UnExplndInvstmntsUs69)
        +N(io.UnExplndMoneyUs69A)+N(io.UnDsclsdInvstmntsUs69B)+N(io.UnExplndExpndtrUs69C)+N(io.AmtBrwdRepaidOnHundiUs69D))),
      "Schedule OS: Sl.2b (income chargeable u/s 115BBE) must equal bi + bii + biii + biv + bv + bvi.");

    /* A498 — to offer income u/s 115BBF the taxpayer must be a resident. */
    A(498, !(hasCode(og,"5BBF")||hasCode(pg,"PTI_5BBF")) || !resNRI,
      "Schedule OS: income u/s 115BBF can be offered only by a resident (and only if in receipt of such income).");

    /* A499 — Sl.10 quarterly dividend referred in 1a(iii) = 1a(iii) − DTAA of 1a(iii) subject to TRC. */
    {
      const exp499 = div_iii - dtNat("1aiii",true);
      A(499, !(exp499>0) || REQ(RDR(RG(OS,"DividendIncUs115BBDAaiii",{})), exp499),
        "Schedule OS: the quarterly break-up of dividend referred in 1a(iii) must equal 1a(iii) − DTAA of 1a(iii) (subject to TRC).");
    }

    /* A500 — buy-back loss claimed in Schedule CG ⇒ dividend at 1a(iii) must be filled. */
    const bbST=N(RG(I,"ScheduleCG.ShortTermCapGain.CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
    const bbLT=N(RG(I,"ScheduleCG.LongTermCapGain.CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
    A(500, !(bbST!==0 || bbLT!==0) || N(io.Dividend22f)>0,
      "Schedule OS: fill the dividend details at Sl.1a(iii) when a buy-back loss is claimed in Schedule CG.");
  }

  /* =====================================================================
     Schedule CYLA — current-year loss set-off.
     Column 2 = HP-loss set-off; column 3 = business-loss set-off; column 4
     = other-sources-loss set-off. Row i = the incoming current-year losses
     (TotalCurYr); row xvi = TotalLossSetOff; row xvii = LossRemAftSetOff.
     ===================================================================== */
  if(I.ScheduleCYLA){
    const CY=RG(I,"ScheduleCYLA",{})||{};
    const curYr=RG(CY,"TotalCurYr",{})||{};
    const totSet=RG(CY,"TotalLossSetOff",{})||{};
    const remAft=RG(CY,"LossRemAftSetOff",{})||{};

    /* the 14 live head rows (ii..xv), in schema-key order */
    const HEADS=["HP","BusProfExclSpecProf","ProfGainUs115B","SpeculationIncome","SpecifiedBusIncome",
      "STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate",
      "OthSrcExclRaceHorseLottery","ProfitFrmRaceHorse","IncOSDTAA"];

    /* A501 — 3i (business loss to be set off) = Sl.2vi of Table E of Schedule BP. */
    A(501, REQ(curYr.TotBusLoss, RG(I,"CorpScheduleBP.BusSetoffCurrYr.LossRemainSetOffOnBus")),
      "Schedule CYLA: 3i (business loss) must equal Sl.2vi of Table E of Schedule BP.");

    /* A502 — 2xvi (total HP-loss set off) cannot exceed Rs.2,00,000. */
    A(502, N(totSet.TotHPlossCurYrSetoff) <= 200000,
      "Schedule CYLA: Sl.2xvi (total house-property loss set off) cannot be more than Rs.2,00,000.");

    /* A503 — 2i (HP loss to be set off) = the HP loss at Sl.3 of Schedule HP. */
    A(503, REQ(curYr.TotHPlossCurYr, Math.max(0, -N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP")))),
      "Schedule CYLA: the HP loss at Sl.2i must equal Sl.3 of Schedule HP.");

    /* A504 — the other-sources loss (row i, col 4) = the loss at Sl.6 of Schedule OS. */
    A(504, REQ(curYr.TotOthSrcLossNoRaceHorse,
        Math.max(0, -N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),
      "Schedule CYLA: the other-sources loss must equal the loss specified at Sl.6 of Schedule OS.");

    /* A505 — 4xvi (total other-sources loss set off) = Σ of the per-head col-4 set-offs. */
    A(505, REQ(totSet.TotOthSrcLossNoRaceHorseSetoff,
        HEADS.reduce((s,k)=>s+N(RG(CY,k+".IncCYLA.OthSrcLossNoRaceHorseSetoff")),0)),
      "Schedule CYLA: Sl.4xvi (total other-sources loss set off) must equal the sum of the per-head set-offs (4ii..4xv).");

    /* A506 — 2xvii (HP loss remaining after set-off) = 2i − 2xvi. */
    A(506, REQ(remAft.BalHPlossCurYrAftSetoff, N(curYr.TotHPlossCurYr)-N(totSet.TotHPlossCurYrSetoff)),
      "Schedule CYLA: Sl.2xvii (house-property loss remaining after set-off) must equal 2i − 2xvi.");
  }
});
