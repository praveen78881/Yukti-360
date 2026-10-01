/* =====================================================================
   ITR-5 · AY 2026-27 — Category-B (advisory) validation rules, batch 22.
   Serials 30-57 of books/ITR-5/rules.json (filter cat=="B"). These are
   advisory / "may be defective u/s 139(9)" disclosure rules spanning many
   schedules (EI, OS, P&L, VI-A/80G, Part A General, CFL, Part B-TI/TTI,
   TDS/TCS, FSI/FA/foreign).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   THIS BATCH IS CATEGORY-B: it uses Dd(n,cond,msg), NOT A(...). Dd raises
   an ADVISORY notice (category "D") when cond (the "lawful" assertion) is
   FALSE; it never blocks a lawful return.
   Reads are guarded (RG / (X||{}) / arr()); nothing throws; every block
   guards to a no-op when its schedule is absent, and every assertion is
   written so it is silent (0 fire) on a lawful return.
   Schema keys were taken from the owning section exp() functions:
   70_sec_gen.js (PartA_GEN1/GEN2), 70_sec_tax.js (PartB_TTI / PartB-TI),
   70_sec_paid.js (ScheduleTDS2/TDS3 · TDSSection/GrossAmount),
   70_sec_os.js (ScheduleOS), 70_sec_cg.js (ScheduleVDA),
   70_sec_other.js (ScheduleIF) and 70_sec_pl.js (PARTA_PL),
   cross-checked against the rule text in books/ITR-5/rules.json.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const st=v=>String(v==null?"":v);

  /* Σ GrossAmount over Schedule TDS2 + TDS3 rows whose TDSSection is in `codes`.
     Reads both schedules safely; returns 0 when neither is present. */
  function tdsGross(codes){
    const set={};codes.forEach(c=>set[c]=1);
    const rows=arr(RG(I,"ScheduleTDS2.TDSOthThanSalaryDtls",[]))
      .concat(arr(RG(I,"ScheduleTDS3.TDS3onOthThanSalDtls",[])));
    return rows.reduce((a,r)=>a+((r&&set[st(r.TDSSection)])?N(r.GrossAmount):0),0);
  }

  /* ===================================================================
     SERIAL 35 — Part A General / Part B-TTI
     "LEI details (Sl.No.Q) are mandatory if the Refund at Part B-TTI is
     ₹50 crore or more."  Lawful: refund below ₹50 cr, OR an LEI number is
     present.  (₹50 crore = 500,000,000.)
     =================================================================== */
  if(I.PartB_TTI){
    const refund=N(RG(I,"PartB_TTI.Refund.RefundDue",0));
    const lei=st(RG(I,"PartA_GEN1.FilingStatus.LEIDtls.LEINumber","")).trim();
    Dd(35, refund<500000000 || lei!=="",
      "Part A-General: the Legal Entity Identifier (LEI) details (Sl.No.Q) are required because the refund (Part B-TTI) is ₹50 crore or more.");
  }

  /* ===================================================================
     SERIAL 36 — Part A General (audit half, PartA_GEN2)
     "Since a2i is 'Yes' (turnover in the ₹1-10 cr band) and either a2ii or
     a2iii is 'More than 5%', you are liable to audit u/s 44AB."
     a2i = TotalSalesExcOneCr ("Upto10CR"); a2ii = AgrOFAllAmtsRcvd,
     a2iii = AgrOFAllPayMade ("MoreThan5Per").  Lawful: LiableSec44ABflg="Y"
     whenever that combination holds.  Only applies when the assessee is not
     declaring income under a presumptive section (IncDclrdUs="N").
     =================================================================== */
  if(I.PartA_GEN2){
    const g2=I.PartA_GEN2||{};
    const cashCross = st(g2.IncDclrdUs)==="N"
      && st(g2.TotalSalesExcOneCr)==="Upto10CR"
      && (st(g2.AgrOFAllAmtsRcvd)==="MoreThan5Per" || st(g2.AgrOFAllPayMade)==="MoreThan5Per");
    Dd(36, !cashCross || st(g2.LiableSec44ABflg)==="Y",
      "Part A-General: turnover is in the ₹1-10 crore band and cash receipts or cash payments exceed 5%, so the assessee is liable to audit u/s 44AB (a3 'Liable to audit u/s 44AB' should be 'Yes').");
  }

  /* ===================================================================
     SERIALS 46-49 — Schedule TDS vs return income
     The gross receipts shown in Schedule TDS against a TDS section should
     not be higher than the corresponding receipts / income declared in the
     return.  Each block is gated on the income schedule being present, so
     an absent schedule is a no-op.  Lawful: TDS gross <= declared amount.
     TDS section codes (70_sec_paid.js TDSSEC_PAID):
       194S  = "94S"/"94S-P"  · 194B  = "94B"/"94B-P"
       194BB = "4BB"          · 194BA = "94BA"/"94BA-P"
     =================================================================== */
  /* 46 — 194S (transfer of virtual digital asset): TDS gross must not exceed
     the total consideration received shown in Schedule VDA (Col.6). */
  if(I.ScheduleVDA){
    const vdaConsid=RSUM(arr(RG(I,"ScheduleVDA.ScheduleVDADtls",[])),"ConsidReceived");
    Dd(46, tdsGross(["94S","94S-P"])<=vdaConsid+1,
      "Schedule TDS: the gross receipts on which TDS u/s 194S (transfer of virtual digital asset) has been deducted are higher than the total consideration for VDA shown in the return (Schedule VDA).");
  }
  if(I.ScheduleOS){
    const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    /* 47 — 194B (winnings from lottery/crossword) vs 2a(i) u/s 115BB. */
    Dd(47, tdsGross(["94B","94B-P"])<=N(io.LtryPzzlChrgblUs115BB)+1,
      "Schedule TDS: the gross receipts on which TDS u/s 194B (winnings from lotteries, crossword puzzles, etc.) has been deducted are higher than the winnings chargeable u/s 115BB shown in Schedule OS (item 2a(i)).");
    /* 48 — 194BB (winnings from horse race) vs Schedule OS item 8a receipts. */
    const rhReceipts=N(RG(I,"ScheduleOS.IncFromOwnHorse.Receipts",0));
    Dd(48, tdsGross(["4BB"])<=rhReceipts+1,
      "Schedule TDS: the gross receipts on which TDS u/s 194BB (winnings from horse races) has been deducted are higher than the receipts from owning and maintaining race horses shown in Schedule OS (item 8a).");
    /* 49 — 194BA (winnings from online games) vs 2a(ii) u/s 115BBJ. */
    Dd(49, tdsGross(["94BA","94BA-P"])<=N(io.IncChrgblUs115BBJ)+1,
      "Schedule TDS: the gross receipts on which TDS u/s 194BA (winnings from online games) has been deducted are higher than the winnings from online games chargeable u/s 115BBJ shown in Schedule OS.");
  }

  /* ===================================================================
     SERIAL 55 — Schedule IF vs Schedule P&L
     "Total of the column 'Amount of interest due or received' in Schedule
     IF should equal Sl.No.14xi(b) of Schedule Profit & Loss Account."
     14xi(b) = PARTA_PL.CreditsToPL.OthIncome.AmtofInterest.
     Lawful: the two are equal (±1).
     =================================================================== */
  if(I.ScheduleIF){
    const ifTot = RSUM(arr(RG(I,"ScheduleIF.PartnerFirmDetails",[])),"IntrstAmtDueOrRecv");
    const plInt = N(RG(I,"PARTA_PL.CreditsToPL.OthIncome.AmtofInterest",0));
    Dd(55, REQ(ifTot,plInt),
      "Schedule IF: the total of the column 'Amount of interest due or received' must equal Sl.No.14xi(b) (interest due/received from partnership firm) of Schedule Profit & Loss Account.");
  }

  /* ===================================================================
     SERIAL 56 — Schedule OS item 3C(i)
     "Interest expenditure u/s 57(1) at 3C(i) should not be more than 20% of
     the dividend income included in total income."  The dividend for this
     purpose is the minimum of the temporary calculated values in serial 57;
     here it is bounded by the two components that are directly available in
     the schema — 1a (1ai + 1aii) of Schedule OS, and (13 - 14) of Part B-TI
     plus the eligible interest.  Both bounds are >= the true minimum, so the
     check is a valid upper bound that is silent on every lawful return.
     (The BFLA 5xiii component of serial 57 is not encoded because it is a
     derived cross-schedule intermediate and would risk false-firing.)
     =================================================================== */
  if(I.ScheduleOS){
    const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const intExp=N(RG(io,"Deductions.IntExp57",0));                /* 3C(i) */
    let divForPurpose=N(io.DividendOthThan22e)+N(io.Dividend22e);  /* 1a(i)+1a(ii) */
    if(I["PartB-TI"]){                                             /* tighten with (13-14) of Part B-TI */
      const btiComp=Math.max(0,N(RG(I,"PartB-TI.TotalIncome",0))-N(RG(I,"PartB-TI.IncChargeableTaxSplRates",0)))+intExp;
      divForPurpose=Math.min(divForPurpose,btiComp);
    }
    Dd(56, intExp<=0.20*divForPurpose+1,
      "Schedule OS: the interest expenditure u/s 57(1) at Sl.No.3C(i) cannot be more than 20% of the dividend income included in the total income (computed without considering the deduction claimed in Schedule OS).");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     Reason codes: FORM = requires a form-filing / portal-DB state with no
     offline schema field; EXT = depends on another taxpayer's return or an
     external database (AIS/26AS); CTX = the audit/mandate cannot be
     determined offline from the schema alone (presumptive-election context);
     FRAG = truncated rules.json fragment with no determinate assertion;
     FALSE-FIRE = the only available schema field would false-fire on a
     lawful return.

     30 — EI: amount u/s 10(23FF) > 0 -> "please fill Form 10-II". FORM. EI
          exposes only Category/SubCategory codes; there is no schema field
          for whether Form 10-II has been filed, and the action is a nudge.
     31 — P&L: "audit information is mandatory if profit is less than 8% of
          gross turnover". CTX. Whether audit u/s 44AB is mandatory turns on
          the 44AD presumptive election and turnover thresholds, none of
          which can be derived from a bare profit-vs-8%-turnover comparison;
          a literal check would false-fire on lawful non-presumptive returns.
     32 — Part A General (co-operative society, 115BAD): option "No" to
          "opted for 115BAD in earlier years and filed Form 10-IF within due
          date". FORM/FRAG. Earlier-year option and within-due-date filing
          are portal-DB state; the entry is a truncated condition fragment.
     33 — Part A General (co-operative society, 115BAD): earlier-year benefit
          not provided + option "Yes" to Form 10-IF-within-due-date. FORM/
          FRAG. Same portal-DB / earlier-year filing state; fragment.
     34 — co-operative-society 115BAD tail + "EI: amount u/s 10(4D) > 0 ->
          please fill Form 10-IK or Form 10-IG". FORM. Form-filing advisory
          and earlier-year DB state; no offline schema field.
     37 — OS: "Dividend income in Schedule OS is more than income reduced
          from Schedule BP". FRAG. Ambiguous fragment; there is no
          determinate schema field for "income reduced from Schedule BP", so
          no checkable arithmetic assertion can be formed.
     38 — Part B-TI: "Nil return - please check AIS / 26AS before
          proceeding". EXT. AIS/26AS comparison plus a soft nudge; no
          in-return assertion.
     39 — Schedule TDS: TDS credited in another person's hands is allowed
          only if that other person declares it in their ITR. EXT. Depends
          on a third party's return / department database.
     40 — Schedule TCS: TCS credited in another person's hands is allowed
          only if that other person declares it in their ITR. EXT. Same as 39.
     41 — OS/EI: "for resident taxpayers DTAA rate benefit is not available,
          please re-check; residents may claim DTAA under Schedule TR and
          FSI". CTX. Soft re-check nudge; residents may lawfully claim DTAA
          relief via Schedule TR/FSI, so there is no crisp offline assertion
          that would stay silent on lawful returns.
     42 — Part A General (co-operative society, 115BAE) opening fragment.
          FORM/FRAG. Earlier-AY (2024-25/2025-26) benefit + option state.
     43 — co-operative-society 115BAE, option "No" to "exercised 115BAE in
          A.Y 2024-25 or 2025-26". FORM/FRAG. Earlier-AY DB/option state.
     44 — co-operative-society 115BAE tail + "CG Table E: entire loss should
          be set off with the gains available for set off". The 115BAE part
          is earlier-AY DB state (FORM/FRAG); the CG-Table-E part requires
          re-computing the full inter-head/intra-head set-off matrix to know
          how much gain remains available against each loss — it is not a
          single-field arithmetic assertion, and any partial encoding would
          false-fire (FALSE-FIRE).
     45 — OS/EI: "if DTAA is claimed, non-residents are required to file Form
          10F". FORM. No schema field records whether Form 10F was filed.
     50 — Part A General: "the details of Form 10IEA should match the details
          in Schedule Part A General". EXT/FORM. Matching Form 10IEA against
          the department database; no offline assertion.
     51 — Part A General: "Form 10IEA details are either not mentioned or not
          matching with the database". EXT/FORM. Database match; external.
     52 — Schedule CFL: "current-year losses to be carried forward should not
          be more than ZERO if the return is filed u/s 139(4)". FALSE-FIRE.
          The schema's ScheduleCFL.CurrentYearLossCF (xxi) is a single
          summed figure that bundles house-property loss (s.71B) and
          unabsorbed depreciation — both lawfully carried forward in a
          belated return — with the business/speculation/capital losses that
          s.80 actually bars. There is no per-head breakdown of the
          current-year carry-forward in the schema, so a blanket check would
          false-fire on a lawful belated return that carries forward only
          house-property loss or unabsorbed depreciation.
     53 — 80G: "deduction u/s 80G shall be claimed against valid Donee PANs
          only". EXT. "Valid" means the donee is an approved/registered
          institution in the department database; PAN validity is a DB check,
          not an offline schema assertion (a mere format check would not
          capture "valid donee").
     54 — P&L: "for a profession, if turnover < ₹50/75 lakh and profit
          offered < 50%, audit information u/s 44AB (44ADA) is mandatory".
          CTX. Whether audit is mandatory depends on the 44ADA presumptive
          election; a bare turnover/profit comparison would false-fire on
          lawful non-presumptive professional returns.
     57 — "Temporary calculate ..." — NON-RULE NOTE. The a/b/c "temporary
          calculated values" are the computation detail for serial 56 (the
          minimum used to compute the dividend for the 20% cap), already
          reflected there; the trailing "P&L: loss is claimed without
          maintaining regular books of accounts and audit report u/s 44AB"
          references book-maintenance state with no offline schema field.
     ------------------------------------------------------------------ */
});
