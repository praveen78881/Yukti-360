/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_02 (Phase 6).
   Serial range A58–A108. Continues the reference batch 61_rules_enc_01.js:
   the residual Part A-General "other details" / representative / secondary-
   address checks (A58–A64), the 6(iv) Part-B-TI carve-out for 10(23C)
   exemptions (A65), and the arithmetic-consistency + exemption-gating rules
   of Schedule I / IA / D / DA (A66–A84), Schedule J (A85–A97) and Part A-BS
   (A98–A108). Registered via ruleset(fn); runRules() invokes it with
   (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond —
   the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / (X||{}) / N()); nothing throws. Keys are the built-return ITR7 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths and enum codes
   were taken from sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json, the books
   (PI.md, Audit.md, BALANCE_SHEET.md, PART_B_TI_TTI.md) and the built
   sections (70_sec_who / _app / _funds / _tax / _bank). Encoded from each
   rule's own text (constitution rule 6).

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Reconciliation note (rule text vs the built column formula). A94 is written
   "A1(7) = (1+2+4)−3"; the CBDT corpus-movement sheet — and this form's
   builder (70_sec_funds.js) — define the closing balance as (1+2+5)−3, i.e.
   opening + received + TOTAL deposited-back (col 5) − applied. The "(4)" in
   the rule text is the line-wrap slip for the total-deposited-back column (5);
   A94 below mirrors the built column so it stays silent on a lawful return and
   fires only on a genuinely inconsistent closing balance.

   Serials in A58–A108 NOT encoded here, and why:
     A61 — NA (PAN in the return must equal the uploader's PAN — the portal's
            uploader identity; the built return does not carry it).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const EQ=(a,b)=>Math.abs(N(a)-N(b))<=1;               /* integer-schema equality (₹1 tol) */
  const LE=(a,b)=>N(a)<=N(b)+1;                         /* a not greater than b */
  const SM=(arr,k)=>(arr||[]).reduce((s,r)=>s+N(r&&r[k]),0);
  const inList=(v,arr)=>arr.indexOf(v)>=0;

  /* ---- Part A-General reads (guarded) ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const ADDR= RG(OI,"Address",{})||{};
  const ALT = RG(OI,"AlternateAddress",{})||{};
  const FS  = RG(G1,"FilingStatus",{})||{};
  const REP = RG(FS,"AssesseeRep",{})||{};
  const G2  = RG(I,"PartA_GEN2",{})||{};
  const OD  = RG(G2,"OtherDetailsFor7",{})||{};
  const U15 = RG(OD,"OtherDetailsUs2_15",{})||{};
  const VDEC= RG(RG(I,"Verification",{})||{},"Declaration",{})||{};
  const exsec = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);

  /* exemption sets (same codes as enc_01) */
  const EX_23C   = ["23CIV","23CV","23CVI","23CVIA"];
  const EXEM_I   = ["11","23CIV","23CV","23CVI","23CVIA","21","2135I"]; /* s.11 / 10(23C)(iv..via) / 10(21) / 10(21)r.w.s.35 */
  const EXEM_J   = ["11","23CIV","23CV","23CVI","23CVIA"];              /* s.11 / 10(23C)(iv..via) */

  /* ===================== Part A-General (A58–A64) ===================== */

  /* A58 — if any of A26(a)/(b)/(c)/(d) is "Yes", then A26 must be "Yes". */
  const a26sub = OD.Clause15Sec2ProvisioFlag==="Y" || OD.SubClauseiSec12AViolateFlag==="Y" ||
                 OD.SubClauseiiSec12AViolateFlag==="Y" || OD.SubSec1Sec12AViolateFlag==="Y";
  A(58, !a26sub || OD.ProvisionsSec1310Applcbl==="Y",
    "Schedule PI (A26): when any of A26(a)/(b)/(c)/(d) is answered Yes, A26 (twenty-second proviso to 10(23C) / section 13(10) applicable) must also be Yes.");

  /* A59 — A23(i) = Yes ⇒ A23 i(a)(i) and A23 i(b)(i) are mandatory. */
  A(59, U15.CharitablePurposeOfGeneralPublic!=="Y" ||
      (S0(U15.ActivityNature2_15) && S0(U15.ActivityRendering2_15)),
    "Part A-General 2 (A23): when A23(i) is Yes, both A23 i(a)(i) (activity in the nature of trade/commerce) and A23 i(b)(i) (rendering of service) must be answered.");

  /* A60 — the representative assessee's email/contact must not match the taxpayer's. */
  const repEmail=String(REP.RepEmailID==null?"":REP.RepEmailID).trim().toLowerCase();
  const taxEmail=String(ADDR.EmailAddress==null?"":ADDR.EmailAddress).trim().toLowerCase();
  const repMob=String(REP.RepMobileNo==null?"":REP.RepMobileNo).replace(/\D/g,"");
  const taxMob=String(ADDR.MobileNo==null?"":ADDR.MobileNo).replace(/\D/g,"");
  A(60, (repEmail==="" || repEmail!==taxEmail) && (repMob==="" || repMob!==taxMob),
    "Part A-General: the email ID and contact number of the representative assessee must not be the same as the taxpayer's email ID and contact number.");

  /* A62 — verification capacity "Representative" ⇒ representative name, email, contact mandatory. */
  A(62, VDEC.Capacity!=="RE" || (S0(REP.RepName) && S0(REP.RepEmailID) && S0(REP.RepMobileNo)),
    "Part A-General: when the Verification capacity is 'Representative Assessee', the name, email ID and contact number of the representative assessee are mandatory.");

  /* A63 — the secondary-address question in Part A-General must be provided. */
  A(63, S0(OI.SecondaryAdd),
    "Part A-General: the secondary address information (whether the secondary address is the same as the primary address) must be provided in the return.");

  /* A64 — secondary address "not same as primary" (SecondaryAdd = No) ⇒ it must actually differ. */
  const _addrKey=a=>[a.ResidenceNo,a.ResidenceName,a.RoadOrStreet,a.LocalityOrArea,
      a.CityOrTownOrDistrict,a.StateCode,a.CountryCode,a.PinCode,a.ZipCode]
      .map(x=>String(x==null?"":x).trim().toLowerCase()).join("|");
  const altFilled = _addrKey(ALT)!=="||||||||";
  A(64, OI.SecondaryAdd!=="N" || !altFilled || _addrKey(ALT)!==_addrKey(ADDR),
    "Part A-General: when the secondary address is marked as NOT the same as the primary address, the secondary address must not be identical to the primary address.");

  /* ===================== Part B-TI (A65) ===================== */
  if(I.PartB_TI){
    const TID = RG(I,"PartB_TI.TIDeductions",{})||{};
    /* A65 — exemption is 10(23C)(iv)/(v)/(vi)/(via) ⇒ 6(iv) of Part-B1 (amount deemed applied
       under clause (2) of Explanation to s.11(1)) must not be greater than zero. */
    A(65, !inList(exsec,EX_23C) || LE(TID.AmtDeemedForCharitable,0),
      "Part B-TI: with exemption claimed under Section 10(23C)(iv)/(v)/(vi)/(via), item 6(iv) of Part B1 (amount deemed to have been applied under clause (2) of Explanation to section 11(1)) cannot be greater than zero.");
  }

  /* ===================== Schedule I (A66–A72) ===================== */
  if(I.ITRScheduleI){
    const SI = RG(I,"ITRScheduleI",{})||{};
    const rows = RG(SI,"ScheduleI",[])||[];
    /* A66 — (5) Balance = (2) − (4). */
    A(66, rows.every(r=>!r||EQ(r.BalanceAfterPY, N(r.AmountAccumlated)-N(r.AmountAppliedPreviousYear))),
      "Schedule I: Balance (col 5) must equal amount accumulated (col 2) minus amount applied up to the beginning of the previous year (col 4).");
    /* A67 — (11) Balance = (7) − (8) − (9) − (10). */
    A(67, rows.every(r=>!r||EQ(r.BalanceAmount,
        N(r.BalAvailApp)-N(r.AmountAppliedDuringYear)-N(r.AmountAppliedDuringYearOtherPurpose)-N(r.AmountCreditedTrust))),
      "Schedule I: Balance (col 11) must equal the balance available for application (col 7) minus cols 8, 9 and 10.");
    /* A68 — (8)+(9)+(10) not greater than (7). */
    A(68, rows.every(r=>!r||LE(N(r.AmountAppliedDuringYear)+N(r.AmountAppliedDuringYearOtherPurpose)+N(r.AmountCreditedTrust), N(r.BalAvailApp))),
      "Schedule I: the sum of cols 8, 9 and 10 cannot be greater than the balance available for application (col 7).");
    /* A69 — (12)+(13)+(14) not greater than (11). */
    A(69, rows.every(r=>!r||LE(N(r.AmountInvested)+N(r.AmountInvestedInOtherMode)+N(r.AmountNotUtilized), N(r.BalanceAmount))),
      "Schedule I: the sum of cols 12, 13 and 14 cannot be greater than the balance (col 11).");
    /* A70 — (15) Amount deemed income u/s 11(3) = (9)+(10)+(13)+(14). */
    A(70, rows.every(r=>!r||EQ(r.AmountDeemedUs11,
        N(r.AmountAppliedDuringYearOtherPurpose)+N(r.AmountCreditedTrust)+N(r.AmountInvestedInOtherMode)+N(r.AmountNotUtilized))),
      "Schedule I: amount deemed to be income within the meaning of section 11(3) (col 15) must equal cols 9 + 10 + 13 + 14.");
    /* A71 — Schedule I allowed only under s.11 / 10(23C)(iv..via) / 10(21) / 10(21) r.w.s. 35. */
    A(71, inList(exsec,EXEM_I),
      "Schedule I: values can be entered only when the section under which exemption is claimed is Section 11, 10(23C)(iv)/(v)/(vi)/(via), 10(21) or 10(21) read with section 35.");
    /* A72 — (7) Balance available = (5) − (6). */
    A(72, rows.every(r=>!r||EQ(r.BalAvailApp, N(r.BalanceAfterPY)-N(r.AmtTxdErlAssYr))),
      "Schedule I: balance available for application (col 7) must equal Balance (col 5) minus amount taxed in earlier assessment years (col 6).");
  }

  /* ===================== Schedule IA (A73–A76) ===================== */
  if(I.ITRScheduleIA){
    const IA = RG(I,"ITRScheduleIA",{})||{};
    const rows = RG(IA,"YrOfAccDtls",[])||[];
    /* A73 — row Total (E) = sum of the assessment-year columns (A+B+C+D). */
    A(73, rows.every(r=>!r||EQ(r.Total, N(r.AssYr22_23)+N(r.AssYr23_24)+N(r.AssYr24_25)+N(r.AssYr25_26))),
      "Schedule IA: the row Total (Sl. No. E) must equal the sum of the assessment-year columns (A + B + C + D).");
    /* A74 — Schedule I col 6 total = Schedule IA grand total. */
    if(I.ITRScheduleI)
      A(74, EQ(RG(I,"ITRScheduleI.TotAmtTxdErlAssYr",0), IA.GrandTotal),
        "Schedule IA: the total of column 6 of Schedule I (amount taxed in earlier assessment years) must equal the grand total of Schedule IA.");
    /* A75 — Schedule IA allowed only under s.11 / 10(23C)(iv..via) / 10(21) / 10(21) r.w.s. 35. */
    A(75, inList(exsec,EXEM_I),
      "Schedule IA: values can be entered only when the section under which exemption is claimed is Section 11, 10(23C)(iv)/(v)/(vi)/(via), 10(21) or 10(21) read with section 35.");
    /* A76 — grand Total = sum of the rows' Total column. */
    A(76, EQ(IA.GrandTotal, SM(rows,"Total")),
      "Schedule IA: the field 'Total' (grand total) must equal the sum of the 'Total' column across the rows.");
  }

  /* ===================== Schedule D (A77–A80) ===================== */
  if(I.ITRScheduleD){
    const SD = RG(I,"ITRScheduleD",{})||{};
    const rows = RG(SD,"ScheduleD",[])||[];
    /* A77 — Schedule D allowed only when exemption is claimed under Section 11. */
    A(77, exsec==="11",
      "Schedule D: values can be entered only when the exemption is claimed under Section 11.");
    /* A78 — (8) deemed income u/s 11(1B) = (6) − (7). */
    A(78, rows.every(r=>!r||EQ(r.AmountNotAppliedCurrAY, N(r.AmountToBeApplied)-N(r.AmountAppliedCurrAY))),
      "Schedule D: the amount which could not be applied and is deemed income u/s 11(1B) (col 8) must equal col 6 minus col 7.");
    /* A79 — (9) balance to apply FY 2026-27 onwards = (4) − (6). */
    A(79, rows.every(r=>!r||EQ(r.BalanceAmount, N(r.OutOfDeemedAmtReqApp)-N(r.AmountToBeApplied))),
      "Schedule D: the balance amount to be applied in FY 2026-27 onwards (col 9) must equal col 4 minus col 6.");
    /* A80 — reason "Any other reason" (code 2) ⇒ year deemed applied (col 1) is FY 2024-25 or 2025-26. */
    A(80, rows.every(r=>!r||String(r.DeemedApplicationReason)!=="2" || inList(String(r.AppliedYear),["6","7"])),
      "Schedule D: when the reason of deeming is 'Any other reason', the year in which income is deemed to be applied (col 1) must be FY 2024-25 or FY 2025-26.");
  }

  /* ===================== Schedule DA (A81–A84) ===================== */
  if(I.ITRScheduleDA){
    const DA = RG(I,"ITRScheduleDA",{})||{};
    const rows = RG(DA,"YrOfAccumDtls",[])||[];
    /* A81 — row Total (F) = sum of the assessment-year columns (A+B+C+D+E). */
    A(81, rows.every(r=>!r||EQ(r.Total, N(r.AssYrPriorToAY)+N(r.AssYr22_23)+N(r.AssYr23_24)+N(r.AssYr24_25)+N(r.AssYr25_26))),
      "Schedule DA: the row Total (Sl. No. F) must equal the sum of the assessment-year columns (A + B + C + D + E).");
    /* A82 — Schedule D col 5 total = Schedule DA grand total. */
    if(I.ITRScheduleD)
      A(82, EQ(RG(I,"ITRScheduleD.TotAmtTxdErlAssYr",0), DA.GrandTotal),
        "Schedule DA: the total of column 5 of Schedule D (amount taxed in earlier assessment years) must equal the grand total of Schedule DA.");
    /* A83 — Schedule DA allowed only when exemption is claimed under Section 11. */
    A(83, exsec==="11",
      "Schedule DA: values can be entered only when the exemption is claimed under Section 11.");
    /* A84 — grand Total = sum of the rows' Total column. */
    A(84, EQ(DA.GrandTotal, SM(rows,"Total")),
      "Schedule DA: the field 'Total' (grand total) must equal the sum of the 'Total' column across the rows.");
  }

  /* ===================== Schedule J (A85–A97) ===================== */
  if(I.ITRScheduleJ){
    const SJ = RG(I,"ITRScheduleJ",{})||{};
    const us115 = RG(SJ,"ScheduleJUs11_5",{})||{};
    const us133 = RG(SJ,"ScheduleJUs13_3",{})||{};
    const othI  = RG(SJ,"ScheduleJOtherInvstmts",{})||{};
    const vcT   = RG(SJ,"ScheduleJVoluntaryContribution",{})||{};
    const a1    = RG(SJ,"ScheduleJ_A1.ScheduleJ_A1Dtls",[])||[];
    const a2    = RG(SJ,"ScheduleJ_A2.ScheduleJ_A2Dtls",[])||[];

    /* A85 — table B (11(5) investments): Total 'Amount of Investment' = sum of rows. */
    A(85, EQ(us115.TotalInvestmentAmt, SM(RG(us115,"ScheduleJUs11_5Dtls",[])||[],"AmtOfInvestment")),
      "Schedule J: in the table of investments/deposits made under section 11(5), the Total of column B(4) 'Amount of Investment' must equal the sum of the rows.");
    /* A86 — table C (13(3)): Total 'Total value of the investment' = sum of rows. */
    A(86, EQ(us133.TotalValueOfInvestment, SM(RG(us133,"ScheduleJUs13_3Dtls",[])||[],"NominalaValueOfInvestment")),
      "Schedule J: in table C, the Total of 'Total value of the investment' must equal the sum of the rows.");
    /* A87 — table C (13(3)): Total 'Income from the investment' = sum of rows. */
    A(87, EQ(us133.TotalIncFromInvestment, SM(RG(us133,"ScheduleJUs13_3Dtls",[])||[],"IncFromInvestment")),
      "Schedule J: in table C, the Total of 'Income from the investment' must equal the sum of the rows.");
    /* A88 — table D (other investments): Total 'Total value of the investment' = sum of rows. */
    A(88, EQ(othI.TotalValueOfInvestment, SM(RG(othI,"ScheduleJOtherInvstmtsDtls",[])||[],"NominalaValueOfInvestment")),
      "Schedule J: in table D, the Total of 'Total value of the investment' must equal the sum of the rows.");
    /* A89 — table E: Total 'Value of contribution/donation' = sum of rows. */
    A(89, EQ(vcT.TotalValueOfContribution, SM(RG(vcT,"ScheduleJVoluntaryContributionDtls",[])||[],"ValueOfContribution")),
      "Schedule J: in table E, the Total of 'Value of contribution/donation' must equal the sum of the rows.");
    /* A90 — table E: Total 'Value of contribution applied towards objective' = sum of rows. */
    A(90, EQ(vcT.TotalValOfContrbnAppdTwrdsObj, SM(RG(vcT,"ScheduleJVoluntaryContributionDtls",[])||[],"ValueOfContributionObj")),
      "Schedule J: in table E, the Total of 'Value of contribution applied towards objective' must equal the sum of the rows.");
    /* A91 — table E: Total 'Amount out of (3) invested in modes u/s 11(5)' = sum of rows. */
    A(91, EQ(vcT.TotalAmtInvestedUs11, SM(RG(vcT,"ScheduleJVoluntaryContributionDtls",[])||[],"AmtInvestedUs11")),
      "Schedule J: in table E, the Total of 'Amount out of (3) invested in modes prescribed under section 11(5)' must equal the sum of the rows.");
    /* A92 — table E: Total 'Balance to be treated as income u/s 11(3)' = sum of rows. */
    A(92, EQ(vcT.TotalBalIncUs11, SM(RG(vcT,"ScheduleJVoluntaryContributionDtls",[])||[],"BalIncUs11")),
      "Schedule J: in table E, the Total of 'Balance to be treated as income under section 11(3)' must equal the sum of the rows.");
    /* A93 — Schedule J allowed only under s.11 / 10(23C)(iv..via). */
    A(93, inList(exsec,EXEM_J),
      "Schedule J: values can be entered only when the section under which exemption is claimed is Section 11 or 10(23C)(iv)/(v)/(vi)/(via).");
    /* A94 — A1(7) closing balance = (1) + (2) + (5) − (3)  [see reconciliation note above]. */
    A(94, a1.every(r=>!r||EQ(r.ClosingBlc, N(r.OpeningBlc)+N(r.ReceivedCorpus)+N(r.TotAmtDepositedBack)-N(r.AppliedPY))),
      "Schedule J: A1(7) (closing balance of corpus) must equal opening (1) + received (2) + total deposited back (5) minus applied (3).");
    /* A95 — A2(7) closing balance of loans = (1) + (2) − (6). */
    A(95, a2.every(r=>!r||EQ(r.ClosingBlc, N(r.OpeningBlc)+N(r.LoanBorrow)-N(r.TotRepOfLoan))),
      "Schedule J: A2(7) (closing balance of loans and borrowings) must equal opening (1) + amount taken (2) minus total repaid (6).");
    /* A96 — A1(10) = (7) − (8) − (9). */
    A(96, a1.every(r=>!r||EQ(r.Investment_11_5_Other, N(r.ClosingBlc)-N(r.Investment_11_5)-N(r.AmtTxdAssYr22_23))),
      "Schedule J: A1(10) (amount invested in modes other than section 11(5)) must equal closing balance (7) minus col 8 minus col 9.");
    /* A97 — A1(8) + A1(9) not greater than A1(7). */
    A(97, a1.every(r=>!r||LE(N(r.Investment_11_5)+N(r.AmtTxdAssYr22_23), N(r.ClosingBlc))),
      "Schedule J: the sum of A1(8) and A1(9) cannot be greater than the closing balance A1(7).");
  }

  /* ===================== Part A-BS (A98–A108) ===================== */
  if(I.PARTA_BS){
    const OWN = RG(I,"PARTA_BS.SourcesOfFund.OwnFund",{})||{};
    const LTB = RG(I,"PARTA_BS.SourcesOfFund.LongTermBorrowings",{})||{};
    const SF  = RG(I,"PARTA_BS.SourcesOfFund",{})||{};
    const FA  = RG(I,"PARTA_BS.ApplicationOfFunds.FixedAsset",{})||{};
    const CLA = RG(I,"PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv",{})||{};
    const CA  = RG(CLA,"CurrentAssets",{})||{};
    const CCE = RG(CA,"CashNCashEquivalents",{})||{};
    const CLP = RG(CLA,"CurrLiabilitiesProviosions",{})||{};
    const CL  = RG(CLP,"CurrLiability",{})||{};

    /* A98 — A1 f(iii) Total = sum of the 'Any other reserve' rows. */
    A(98, EQ(OWN.TotalOtherReserve, SM(RG(OWN,"OtherReserve",[])||[],"Amount")),
      "Part A-BS: the Total 'A1 f(iii)' (any other reserve) must equal the sum of the individual other-reserve amounts.");
    /* A99 — A1(g) Total fund = a+b+c+d+e+f. */
    A(99, EQ(OWN.TotalFund, N(OWN.Corpus80G)+N(OWN.OtherCorpus)+N(OWN.AccumulatedInc)+
        N(OWN.AccumulatedIncUS10_11)+N(OWN.BalDeemedInc)+N(OWN.TotalOtherReserve)),
      "Part A-BS: Total Fund 'A(1)(g)' must equal the sum of A(1)(a+b+c+d+e+f).");
    /* A100 — A2(c) Total loan funds = a+b. */
    A(100, EQ(LTB.TotalLoanFund, N(LTB.SecuredLoan)+N(LTB.UnSecuredLoan)),
      "Part A-BS: Total Loan Funds 'A2(c)' must equal the sum of A2(a+b) (secured + unsecured loans).");
    /* A101 — A (Sources of funds) = 1g + 2c + 3. */
    A(101, EQ(SF.TotSourceFund, N(OWN.TotalFund)+N(LTB.TotalLoanFund)+N(SF.Advances)),
      "Part A-BS: Sources of Funds 'A' must equal the sum of A(1g + 2c + 3).");
    /* A102 — B1c Net fixed assets = 1a − 1b. */
    A(102, EQ(FA.NetBlock, N(FA.GrossBlock)-N(FA.Depreciation)),
      "Part A-BS: Net Fixed Assets 'B1c' must equal Gross Block (1a) minus Depreciation (1b).");
    /* A103 — B3(a)(iiiD) Total cash = iiiA + iiiB + iiiC. */
    A(103, EQ(CCE.TotCashNCashEquivalents, N(CCE.BalWithBanks)+N(CCE.CashInHand)+N(CCE.Others)),
      "Part A-BS: Total cash and cash equivalents 'B3(a)(iiiD)' must equal the sum of B3(a)(iiiA + iiiB + iiiC).");
    /* A104 — B3(a)(v) Total current assets = i + ii + iiiD + iv. */
    A(104, EQ(CA.TotCurrAssets, N(CA.Inventory)+N(CA.SundryDebtor)+N(CCE.TotCashNCashEquivalents)+N(CA.OtherCurrAssets)),
      "Part A-BS: Total current assets 'B3(a)(v)' must equal the sum of B3(a)(i + ii + iiiD + iv).");
    /* A105 — B3(c) Total = av + b. */
    A(105, EQ(CLA.Total, N(CA.TotCurrAssets)+N(CLA.LoansandAdvances)),
      "Part A-BS: 'B3(c)' must equal the sum of B3(a v) and B3(b) (total current assets + loans and advances).");
    /* A106 — B3(d)(iC) Total current liabilities = iA + iB. */
    A(106, EQ(CL.TotalCurrLiabilitiesProviosions, N(CL.SundryCreditor)+N(CL.OtherPayable)),
      "Part A-BS: 'B3(d)(iC)' must equal the sum of B3(d)(iA + iB) (sundry creditors + other payables).");
    /* A107 — B3(d)(iii) = iC + ii. */
    A(107, EQ(CLP.TotCurrLiabilitiesandprovisions, N(CL.TotalCurrLiabilitiesProviosions)+N(CLP.Provisions)),
      "Part A-BS: 'B3(d)(iii)' must equal the sum of B3(d)(iC + ii) (total current liabilities + provisions).");
    /* A108 — B3(e) Net current assets = 3c − 3diii. */
    A(108, EQ(CLA.NetCurrAssets, N(CLA.Total)-N(CLP.TotCurrLiabilitiesandprovisions)),
      "Part A-BS: Net Current Assets 'B3(e)' must equal B3(c) minus B3(d)(iii).");
  }
});
