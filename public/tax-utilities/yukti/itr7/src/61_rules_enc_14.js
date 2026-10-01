/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-B validation rules, batch enc_14 (Phase 6).
   ADVISORY (non-blocking) rules — rules.json objects with cat=="B".
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   Dd(n,cond,msg) raises a NON-blocking advisory when cond — the "this
   return is lawful" assertion — is FALSE. Every message is prefixed
   "[B] ". Every read is guarded (RG / (X||{}) / N()); nothing throws.
   Keys are the built-return ITR7 schema paths (I = that root), taken
   from the built sections (70_sec_bodies/os/vda/fa/paid/who + Part B-TI)
   and sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json, and the books
   Schedule_PP.md / Schedule_ET.md / Schedule_OS.md / TDS.md / PART_B_TI_TTI.md.
   Encoded from each rule's own re-joined text (the rules.json line-wrap
   offsets each serial by ~one physical line; the assertions below read
   the RE-JOINED semantic rule, not the raw fragment).

   Census (books/ITR-7/rule_census.md, Category-B census, 33 serials):
     ENFORCED-target advisory (28) — encoded here as Dd():
       B1  B2  B4  B5  B6  B7  B8  B10 B11 B12 B13 B14 B15 B17
       B18 B19 B20 B21 B22 B23 B24 B25 B26 B29 B30 B31 B32 B33
     SKIPPED as NA (5, per census — nothing to encode offline):
       B3  — audit u/s 92E ⇒ Form 3CEB is a SEPARATE form (not in the return).
       B9  — 13A exemption barred if filed after due date — portal timestamp.
       B16 — 10(47) exemption barred if filed after due date — portal timestamp.
       B27 — TDS in another person's hands allowed only if THEY declare it in
              their own (external) ITR — no in-return field.
       B28 — TCS in another person's hands — same, external return.
   RE-FILED OFFLINE-IMPOSSIBLE: none. (B30–B33 — 194S/194B/194BB/194BA gross
     vs income — which ITR-6 re-filed OFFLINE-IMPOSSIBLE for lack of an income
     sub-nature on its TDS rows — ARE offline-checkable here: ITR-7's
     ScheduleTDS2/TDS3 rows carry `TDSSection` (94S / 94B / 4BB / 94BA…), so
     the section-tagged gross receipts can be summed and compared to the
     matching income line. Hence encoded, not re-filed.)
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const inList=(v,arr)=>arr.indexOf(v)>=0;

  /* ---- Part A General reads (guarded) ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const FS  = RG(G1,"FilingStatus",{})||{};
  const G2  = RG(I,"PartA_GEN2",{})||{};
  const OD  = RG(G2,"OtherDetailsFor7",{})||{};
  const U215= RG(OD,"OtherDetailsUs2_15",{})||{};

  const exsec    = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);
  const resident = FS.ResidentialStatus!=="NRI";        /* RES (not NRI) — cf. A40 */
  /* GPU u/s 2(15): summation of the percentage-of-receipt sub-fields */
  const gpuSum   = N(U215.PercntNatureOfTrade)+N(U215.PercntAnyTrade);

  /* TDS gross (col 11) summed over the section-tagged rows of both other-than-
     salary tables — ScheduleTDS2 (Form 16A) + ScheduleTDS3 (Form 16B/C/D/E). */
  const tdsRows = []
    .concat(RG(I,"ScheduleTDS2.TDSOthThanSalaryDtls",[])||[])
    .concat(RG(I,"ScheduleTDS3.TDS3onOthThanSalDtls",[])||[]);
  const tdsGross = codes => tdsRows.reduce((a,r)=>
    (r && inList(String(r.TDSSection==null?"":r.TDSSection),codes)) ? a+N(r.GrossAmount) : a, 0);

  /* =====================================================================
     Part A-General — the change-of-objects and GPU 2(15) advisories.
     (OtherDetailsFor7 lives on PartA_GEN2, always present; the assertions
     fire only on the specific claim, so they are silent otherwise.)
     ===================================================================== */
  /* B2 — exemption u/s 11 claimed although objects/activities changed in the
     year AND fresh registration was not applied for and/or not granted. */
  Dd(2, !(exsec==="11" && OD.ChangeInActivitiesDuringYr==="Y")
        || (OD.FreshRegSec12A==="Y" && OD.FreshRegGrantedUs12AA==="Y"),
    "[B] Part A-General: exemption u/s 11 is claimed even though there is a change in the objects/activities during the year and the trust/institution has not applied for fresh registration and/or the fresh registration has not been granted.");

  /* B1 — exemption u/s 11 with GPU activity u/s 2(15) whose receipts exceed
     20% ⇒ income is computed per s. 13(10) and Part B-3 of Part B-TI applies. */
  Dd(1, !(exsec==="11" && gpuSum>20) || OD.ProvisionsSec1310Applcbl==="Y",
    "[B] Part B-TI: exemption is claimed u/s 11 with general-public-utility (GPU) activity u/s 2(15) whose summation of percentage of receipts exceeds 20% — income should be computed per s. 13(10) and Part B-3 of Part B-TI is applicable.");

  /* B25 — exemption u/s 10(23C)(iv)/(v) with GPU u/s 2(15) receipts > 20%
     ⇒ 22nd proviso to s. 10(23C) and Part B-3 of Part B-TI applies. */
  Dd(25, !(inList(exsec,["23CIV","23CV"]) && gpuSum>20) || OD.ProvisionsSec1310Applcbl==="Y",
    "[B] Part B-TI: exemption is claimed u/s 10(23C)(iv)/(v) with GPU activity u/s 2(15) whose summation of percentage of receipts exceeds 20% — income should be computed per the twenty-second proviso to s. 10(23C) and Part B-3 of Part B-TI is applicable.");

  /* =====================================================================
     Schedule PP — political party, exemption u/s 13A (I.SchedulePP)
     ===================================================================== */
  if(I.SchedulePP){
    const PP=RG(I,"SchedulePP",{})||{};
    /* B4 — 13A: books of account and other documents must be maintained. */
    Dd(4, PP.BooksOfAccMaintained==="Y",
      "[B] Schedule PP: exemption u/s 13A is not allowed if the political party does not maintain books of account and other documents.");
    /* B5 — 13A: where a voluntary contribution above ₹20,000 (other than by
       electoral bond) is received, a record of each must be maintained. */
    Dd(5, PP.VoluntaryContribution!=="Y" || PP.VoluntaryContributionElecBond==="Y",
      "[B] Schedule PP: exemption u/s 13A is not allowed if the political party does not maintain a record of each voluntary contribution (other than by electoral bond) in excess of ₹20,000.");
    /* B6 — 13A: the accounts of the political party must be audited. */
    Dd(6, PP.AccountsAudited==="Y",
      "[B] Schedule PP: exemption u/s 13A is not allowed if the accounts of the political party are not audited by an accountant.");
    /* B7 — 13A: no donation above ₹2,000 received otherwise than by account-
       payee cheque/draft/bank/ECS/electoral bond. */
    Dd(7, PP.DonExceElectoralBond!=="Y",
      "[B] Schedule PP: exemption u/s 13A is not allowed if the political party has received any donation exceeding ₹2,000 otherwise than by an account-payee cheque/draft, bank/electronic clearing system or electoral bond.");
    /* B8 — 13A: the report u/s 29C(3) of the RP Act, 1951 must be submitted. */
    Dd(8, PP.ReportUs29==="Y",
      "[B] Schedule PP: exemption u/s 13A is not allowed if the political party has not submitted the report under sub-section (3) of section 29C of the Representation of the People Act, 1951.");
    /* B20 — 13A: the party must be registered u/s 29A of the RP Act, 1951. */
    Dd(20, PP.RegisterUS29A==="Y",
      "[B] Schedule PP: exemption u/s 13A is not allowed if the political party is not registered under section 29A of the Representation of the People Act, 1951.");
    /* B21 — 13A: if registered u/s 29A, the registration number and date must
       both be furnished. */
    Dd(21, PP.RegisterUS29A!=="Y" || (S0(PP.RegisterNum) && S0(PP.DateRegisterUS29A)),
      "[B] Schedule PP: exemption u/s 13A is not allowed if the political party is registered u/s 29A of the RP Act, 1951 but does not furnish the registration number and date of registration.");
    /* B24 — 13A: if the 29C(3) report is answered 'Yes', its date of
       submission must be furnished. */
    Dd(24, PP.ReportUs29!=="Y" || S0(PP.SubmissionDate),
      "[B] Schedule PP: exemption u/s 13A is not allowed if the report u/s 29C(3) is answered 'yes' but the date of submission of the report is not furnished.");
  }

  /* =====================================================================
     Schedule ET — electoral trust, exemption u/s 13B (I.ScheduleET)
     ===================================================================== */
  if(I.ScheduleET){
    const ET=RG(I,"ScheduleET",{})||{};
    const VD=RG(ET,"VoluntaryContributionDtls",{})||{};
    /* B10 — 13B: books of account and other documents must be maintained. */
    Dd(10, ET.BooksOfAccMaintained==="Y",
      "[B] Schedule ET: exemption u/s 13B is not allowed if the electoral trust does not maintain books of account and other documents.");
    /* B11 — 13B: a record of each political party to whom the distributable
       contributions were distributed must be maintained. */
    Dd(11, ET.RecordsMaintainedWithPAN==="Y",
      "[B] Schedule ET: exemption u/s 13B is not allowed if the electoral trust does not maintain a record of each political party to whom the sums were distributed.");
    /* B12 — 13B: the accounts must be audited (rule 17CA(12)). */
    Dd(12, ET.AccountsAudited==="Y",
      "[B] Schedule ET: exemption u/s 13B is not allowed if the electoral trust has not got its accounts audited.");
    /* B13 — 13B: the list of contributors and of political parties to whom
       sums were distributed must be furnished (rule 17CA(14)). */
    Dd(13, ET.ReportAsPerRule17CA==="Y",
      "[B] Schedule ET: exemption u/s 13B is not allowed if the electoral trust has not furnished the list of contributors and of political parties to whom sums were distributed to the Commissioner/Director of Income-tax.");
    /* B14 — Sl. 6(iv) amount distributed to political parties must be ≥ 95% of
       the total contributions received in the FY together with the surplus
       brought forward (item iii = i + ii). */
    Dd(14, N(VD.AmtDistToPoliticalParties) >= 0.95*N(VD.TotalAfterVoluntaryContribution) - 1,
      "[B] Schedule ET: Sl. No. 6(iv) — amount distributed to political parties should be greater than 95% of the total contributions received during the financial year together with the surplus brought forward.");
    /* B15 — Sl. 6(v) admin/management spend ≤ 5% of contributions received in
       the year (item ii), and capped at ₹5,00,000 in the first year of
       incorporation / ₹3,00,000 in a subsequent year. */
    const firstYr = OD.FirstReturnFlag==="Y";
    const admAllowed = Math.min(0.05*N(VD.VoluntaryContributionDuringYr), firstYr?500000:300000);
    Dd(15, N(VD.AmtSpentOnManagingAffairs) <= admAllowed + 1,
      "[B] Schedule ET: the amount spent on administrative and management functions of the trust should not exceed 5% of the total contributions and is restricted to ₹5,00,000 in the first year of incorporation or ₹3,00,000 in a subsequent year.");
  }

  /* =====================================================================
     Part B-TI (Part-B1) — I.PartB_TI  (B18, B26)
     ===================================================================== */
  if(I.PartB_TI){
    const B1=RG(I,"PartB_TI",{})||{};
    const TID=RG(B1,"TIDeductions",{})||{};
    /* B18 — exemption u/s 11 or 10(23C)(iv)/(v)/(vi)/(via) must not be claimed
       against the Additions at Sl. 7ix of Part B1: the deductions/application
       (item 6vii) cannot exceed the income to be applied (item 6), which by
       construction excludes those additions. */
    Dd(18, N(TID.TotalDeductions) <= N(B1.IncToBeApplied) + 1,
      "[B] Part B-TI (Part B1): exemptions u/s 11 or 10(23C)(iv)/(v)/(vi)/(via) should not be claimed against the additions at Sl. No. 7ix — the total deductions/application (6vii) cannot exceed the income to be applied (item 6).");
    /* B26 — a return whose income fields are all zero. Silent on an empty
       return (Part B-TI absent); fires when Part B-TI is present but every
       gross-income figure reads zero. */
    const incTot = N(B1.VcCorpusSec11)
      + N(RG(B1,"VoluntaryContributions.TotIncFromVC"))
      + N(B1.AggregateIncomeUs1112) + N(B1.IncToBeApplied)
      + N(B1.GrossIncome) + N(B1.TotalTI) + N(B1.TotalIncome)
      + N(B1.IncomeFromHP) + N(RG(B1,"CapGain.TotalCapGains"))
      + N(RG(B1,"IncFromOS.TotIncFromOS"));
    Dd(26, incTot > 0,
      "[B] Part B-TI: the return carries '0' values in all income fields — verify the statement of income before uploading.");
  }

  /* =====================================================================
     Part B-TI (Part-B2, 13A/13B & 10(21)…) — I.PartB_TI2  (B17, B19)
     ===================================================================== */
  if(I.PartB_TI2){
    const B2=RG(I,"PartB_TI2",{})||{};
    /* B17 — a political party (exemption u/s 13A) is not allowed to claim the
       13A exemption against income from Business or Profession (Part B2 7ii). */
    Dd(17, exsec!=="13A" || N(RG(B2,"ProfBusGain.ProfGainNoSpecBus")) <= 0,
      "[B] Part B-TI (Part B2): a political party is not allowed to claim exemption u/s 13A in respect of income from Business or Profession.");
    /* B19 — political-party exemption at field 4 (ExemptionUs13_A) should not
       exceed the voluntary contribution (item 6) plus the heads of income
       (item 7v). */
    Dd(19, N(B2.ExemptionUs13_A) <= N(B2.VoluntaryContributions) + N(B2.TotIncNotPart7And11Abv) + 1,
      "[B] Part B-TI (Part B2): the exemption claimed by a political party at field 4 should not be more than the voluntary contribution and the heads of income.");
  }

  /* =====================================================================
     Part B-TI (Part-B3, income at MMR) — I.PartB_TI3  (B23)
     ===================================================================== */
  if(I.PartB_TI3){
    const CIC=RG(I,"PartB_TI3.ComputationIncChargeable",{})||{};
    /* B23 — expenditure at Sl. 2 must not be claimed against the additions at
       Sl. 4(vii): the net income before additions [(1) − (2) + (3x)] cannot be
       negative. */
    Dd(23, N(CIC.TotIncPrevYr) - N(CIC.TotExpIncur) + N(RG(CIC,"ExpDisallowed.TotExpDisall")) >= -1,
      "[B] Part B-TI (Part B3): the expenditure at Sl. No. 2 should not be claimed against the additions at Sl. No. 4(vii) — the net income before additions cannot be negative.");
  }

  /* =====================================================================
     Schedule OS — I.ScheduleOS  (B22, B29, B31, B32, B33)
     ===================================================================== */
  if(I.ScheduleOS){
    const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    /* B22 — the 57 deduction (Sl. 3a "Expenses") cannot be filled where the
       normal-rate income belongs only to Sl. 1(e) "Income due to disallowance
       of exemption under clauses of s. 10" (IncDisallwnExmpUs10). */
    const disall=N(io.IncDisallwnExmpUs10), normGross=N(io.GrossIncChrgblTaxAtAppRate);
    Dd(22, !(disall>0 && normGross===disall) || N(RG(io,"Deductions.Expenses"))<=0,
      "[B] Schedule OS: Sl. No. 3a 'Deductions under section 57' is not allowed to be filled where the income belongs to Sl. No. 1(e) 'Income due to disallowance of exemption under clauses of section 10' only.");
    /* B29 — for a resident taxpayer, DTAA benefit is not available in the rate
       of taxation (the OS special-rate-as-per-DTAA table is for non-residents);
       residents may instead claim DTAA relief under Schedule TR / FSI. */
    const osDTAA=N(RG(io,"IncChargblSplRateOS.TotalOSGrossChargblSplRate"));
    Dd(29, !resident || osDTAA<=0,
      "[B] Schedule OS: for a resident taxpayer DTAA benefit is not available in the rate of taxation, and the claim may not be allowed — residents may claim DTAA benefit under Schedule TR / FSI. Please re-check the claim.");
    /* B31 — 194B gross receipts (Schedule TDS) must not exceed the 115BB
       winnings income (Sl. 2ai, LtryPzzlChrgblUs115BB). */
    Dd(31, tdsGross(["94B","94B-P"]) <= N(io.LtryPzzlChrgblUs115BB) + 1,
      "[B] Schedule OS: the gross receipts on which TDS u/s 194B has been deducted (Schedule TDS) are higher than the income shown under winnings from lotteries/crossword puzzles/races/card games chargeable u/s 115BB.");
    /* B33 — 194BA gross receipts (Schedule TDS) must not exceed the 115BBJ
       online-games winnings income (Sl. 2aii, IncChrgblUs115BBJ). */
    Dd(33, tdsGross(["94BA","4BA1","4BA2"]) <= N(io.IncChrgblUs115BBJ) + 1,
      "[B] Schedule OS: the gross receipts on which TDS u/s 194BA has been deducted (Schedule TDS) are higher than the income shown under winnings from online games chargeable u/s 115BBJ.");
    /* B32 — 194BB gross receipts (Schedule TDS) must not exceed the race-horse
       receipts (Sl. 8a, IncFromOwnHorse.Receipts). */
    Dd(32, tdsGross(["4BB"]) <= N(RG(I,"ScheduleOS.IncFromOwnHorse.Receipts")) + 1,
      "[B] Schedule OS: the gross receipts on which TDS u/s 194BB has been deducted (Schedule TDS) are higher than the income shown under income from the activity of owning and maintaining race horses.");
  }

  /* =====================================================================
     Schedule VDA — I.ScheduleVDA  (B30)
     ===================================================================== */
  if(I.ScheduleVDA){
    const vdaInc=N(RG(I,"ScheduleVDA.TotIncBusiness"))+N(RG(I,"ScheduleVDA.TotIncCapGain"));
    /* B30 — 194S gross receipts (Schedule TDS) must not exceed the total
       income from Virtual Digital Assets shown in the return. */
    Dd(30, tdsGross(["94S","94S-P"]) <= vdaInc + 1,
      "[B] Schedule VDA: the gross receipts on which TDS u/s 194S has been deducted (Schedule TDS) are higher than the total receipts shown under Income from Virtual Digital Assets in the return of income.");
  }
});
