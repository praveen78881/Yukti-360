/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_13 (Phase 6).
   Serial range A609–A661 — Part B-TI (Part-B3 · MMR regime), Part B-TTI (the
   tax ladder), Schedule FA presence, Schedule IT, Schedule TDS (both tables)
   and Schedule TCS. Registered via ruleset(fn); runRules() invokes it with
   (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond — the
   "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / (X||{}) / N()); nothing throws.

   Paths and enum codes were taken from the built section engines
   (70_sec_tax.js — Part B-TI/TI2/TI3/TTI; 70_sec_paid.js — Schedule
   IT/TDS2/TDS3/TCS; 70_sec_vc.js — Schedule VC/AI; 70_sec_app.js — Schedule A;
   70_sec_si.js — Schedule SI/115TD; 70_sec_fa.js — Schedule TR1/FA) and
   confirmed against sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json and
   books/ITR-7/{PART_B_TI_TTI,IT,TDS,TCS,Schedule_FA}.md.

   The SHEET↔SCHEMA offset for the TDS/TCS rules (books/ITR-7/TDS.md §0):
     rule "Schedule TDS1" (15B1, Form 16A, deductor by TAN) → block ScheduleTDS2
     rule "Schedule TDS2" (15B2, Form 16B/C/D/E, buyer PAN)  → block ScheduleTDS3
     rule "Schedule TCS"  (18C1, Form 27D)                   → block ScheduleTCS

   The A609–A617 rules all target Part-B3 (PartB_TI3), which the built return
   emits ONLY when the filing status is the 22nd-proviso/13(10) MMR regime; each
   enters under if(I.PartB_TI3){...} and stays silent for the ordinary 11/12
   (Part-B1) trust. Likewise every Part B-TTI / Schedule block enters only under
   its own if(I.<block>){...}.

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule.

   Serials in A609–A661 NOT encoded here, and why (they stay bucketed in the
   census — NA, resolved at the portal by the filing timestamp, never faked):
     A637 — NA (234F fee only if filed after the due date — needs the portal
            filing timestamp; the built return does not carry it).
     A639/A640 — NA (234-I revised-return fee keyed to filing after 31/12/2026 —
            needs the portal filing timestamp).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const NR   = (o,p)=>N(RG(o||{},p,0));                 /* guarded numeric read (default 0) */
  const S0   = v=>v!=null&&String(v).trim()!=="";       /* "present / non-blank" */
  const EQ   = (a,b,t)=>Math.abs(N(a)-N(b))<=(t==null?1:t);
  const roundTen = v=>Math.round(v/10)*10;
  const arr  = (o,p)=>{const x=RG(o||{},p,[]);return Array.isArray(x)?x:[];};

  /* =================================================================
     A609–A617 · Part-B3 (PartB_TI3) — MMR regime.  Only present when the
     22nd-proviso / s.13(10) computation is filed.
     ================================================================= */
  if(I.PartB_TI3){
    const B3  = RG(I,"PartB_TI3.ComputationIncChargeable",{})||{};
    const CGb = RG(B3,"IncNotForming.CapGain",{})||{};
    const cgE = (leaf)=>NR(I,"ScheduleCG.CurrYrLosses."+leaf+".CurrYrCapGain"); /* item E after set-off */

    /* --- the capital-gain rate/DTAA cross-checks: a positive Part-B3 CG bucket
       requires Schedule CG (item E) to be filled and to carry the same figure. */
    /* A616 — 7(iii)(ai) STCG @20% > 0 ⇒ Table E of Sch CG filled and equal (8ii of item E). */
    A(616, NR(CGb,"ShortTerm.ShortTerm20Per")<=0 ||
        (!!I.ScheduleCG && EQ(NR(CGb,"ShortTerm.ShortTerm20Per"), cgE("InStcg20Per"))),
      "Part B-TI (Part-B3): short-term capital gain chargeable @20% must be filled in Table E of Schedule CG and equal 8ii of item E of Schedule CG.");
    /* A609 — 7(iii)(aiv) STCG at special rates as per DTAA > 0 ⇒ Table E filled and equal (8v of item E). */
    A(609, NR(CGb,"ShortTerm.ShortTermSplRateDTAA")<=0 ||
        (!!I.ScheduleCG && EQ(NR(CGb,"ShortTerm.ShortTermSplRateDTAA"), cgE("InStcgDTAARate"))),
      "Part B-TI (Part-B3): short-term capital gain at special rates as per DTAA must be filled in Table E of Schedule CG and equal the corresponding figure of item E of Schedule CG.");
    /* A617 — 7(iii)(bi) LTCG @12.5% > 0 ⇒ Table E filled and equal (8vi of item E). */
    A(617, NR(CGb,"LongTerm.LongTerm12_5Per")<=0 ||
        (!!I.ScheduleCG && EQ(NR(CGb,"LongTerm.LongTerm12_5Per"), cgE("InLtcg12_5Per"))),
      "Part B-TI (Part-B3): long-term capital gain chargeable @12.5% must be filled in Table E of Schedule CG and equal 8vi of item E of Schedule CG.");
    /* A610 — 7(iii)(bii) LTCG at special rates as per DTAA > 0 ⇒ Table E filled and equal. */
    A(610, NR(CGb,"LongTerm.LongTermSplRateDTAA")<=0 ||
        (!!I.ScheduleCG && EQ(NR(CGb,"LongTerm.LongTermSplRateDTAA"), cgE("InLtcgDTAARate"))),
      "Part B-TI (Part-B3): long-term capital gain at special rates as per DTAA must be filled in Table E of Schedule CG and equal the corresponding figure of item E of Schedule CG.");

    /* A611 — item 13 (income chargeable u/s 22nd proviso to 10(23C) / 13(10))
       = item 9 (Total Income) − 10 (special-rate) − 11 (115BBC) − 12 (115BBI). */
    A(611, EQ(NR(B3,"IncChagrgSec13"),
        NR(B3,"TotalInc")-NR(B3,"IncIncludedChargRateSpec")-NR(B3,"AnonymousDonation")-NR(B3,"IncChargSec115BBI")),
      "Part B-TI (Part-B3): the income chargeable to tax under the twenty-second proviso to 10(23C) / section 13(10) (Sl. 13) must equal Sl. (9 − 10 − 11 − 12).");

    /* A612 — Part-B3 is allowed only if exemption is claimed u/s 11 or
       10(23C)(iv)/(v)/(vi)/(via) AND Part A-General A26 (22nd proviso/13(10)) = Yes. */
    const exsec = String(RG(I,"PartA_GEN1.OrgFirmInfo.SecExemptionClaimed","")||"");
    const a26   = String(RG(I,"PartA_GEN2.OtherDetailsFor7.ProvisionsSec1310Applcbl","")||"");
    const EX_B3 = ["11","23CIV","23CV","23CVI","23CVIA"];
    A(612, (EX_B3.indexOf(exsec)>=0) && a26==="Y",
      "Part B-TI (Part-B3): values may be entered only if exemption is claimed u/s 11 or 10(23C)(iv)/(v)/(vi)/(via) and Part A-General A26 (twenty-second proviso / section 13(10)) is answered 'Yes'.");

    /* A613 — item 1 (Total income other than Sl. 7) ≥ (C − Ai − Bi) of Schedule VC
       + Sl. 10 "Total" of Schedule AI. */
    const vcC  = NR(I,"ScheduleVC.TotalContribution");
    const vcAi = NR(I,"ScheduleVC.Local.CorpusFundDonation");
    const vcBi = NR(I,"ScheduleVC.Foreign.CorpusFundDonation");
    const aiT  = NR(I,"ScheduleAI.TotalofAggregateIncomes");
    A(613, NR(B3,"TotIncPrevYr") >= (vcC-vcAi-vcBi)+aiT-1,
      "Part B-TI (Part-B3): total income for the year other than Sl. 7 (Sl. 1) must be at least (C − Ai − Bi) of Schedule VC plus Sl. 10 'Total' of Schedule AI.");
    /* A614 — item 2 (Total expenditure incurred in India for the objects) ≤
       Sl. G "Revenue" column of Schedule A. */
    A(614, NR(B3,"TotExpIncur") <= NR(I,"ScheduleA.TotAmountAllowedApplication.Revenue")+1,
      "Part B-TI (Part-B3): total expenditure incurred in India for the objects (Sl. 2) cannot exceed the Revenue column of Sl. G of Schedule A.");
    /* A615 — item 1 > 0 ⇒ Schedule VC and Schedule AI must be filled. */
    A(615, NR(B3,"TotIncPrevYr")<=0 || (!!I.ScheduleVC && !!I.ScheduleAI),
      "Part B-TI (Part-B3): Sl. 1 is greater than zero but Schedule VC or Schedule AI is not filled.");
  }

  /* =================================================================
     A618–A636 · Part B-TTI — the tax ladder (arithmetic self-consistency
     and the interest gate).
     ================================================================= */
  if(I.PartB_TTI){
    const CT = RG(I,"PartB_TTI.ComputationOfTaxLiability",{})||{};

    const t1a=NR(CT,"TaxPayableOnTI.TaxAtNormalRates");
    const t1b=NR(CT,"TaxPayableOnTI.TaxAtSpecialRates");
    const t1c=NR(CT,"TaxPayableOnTI.DonationUs115BC");
    const t1d=NR(CT,"TaxPayableOnTI.TaxIncChargUs115BBI");
    const t1e=NR(CT,"TaxPayableOnTI.TaxAtMarginalRate");
    const t1f=NR(CT,"TaxPayableOnTI.RebateOnAgricultureInc");
    const t1g=NR(CT,"TaxPayableOnTI.TaxPayableOnTotInc");
    /* A618 — 1g = MAX(0, 1a + 1b + 1c + 1d + 1e − 1f). */
    A(618, EQ(t1g, Math.max(0, t1a+t1b+t1c+t1d+t1e-t1f)),
      "Part B-TTI: Tax Payable on Total Income (1g) must equal the sum (1a + 1b + 1c + 1d + 1e − 1f).");

    /* A619 — 2(i) = 25% of the 115BBE tax in Schedule SI (SecCode 5BBE, col I). */
    const bbeTax = arr(I,"ScheduleSI.SplCodeRateTax")
      .reduce((a,r)=>a+(String((r||{}).SecCode)==="5BBE"?N((r||{}).SplRateIncTax):0),0);
    A(619, EQ(NR(CT,"Surcharge25ofSI"), Math.round(bbeTax*0.25)),
      "Part B-TTI: Sl. 2(i) must equal 25% of the tax on income chargeable u/s 115BBE in Schedule SI.");
    /* A620 — 2(iii) Total surcharge = 2(i) + 2(ii). */
    A(620, EQ(NR(CT,"TotalSurcharge"), NR(CT,"Surcharge25ofSI")+NR(CT,"SurchargeOnTaxPayable")),
      "Part B-TTI: total surcharge (2iii) must equal the sum of 2(i) and 2(ii).");
    /* A621 — 4 Gross tax liability = 1g + 2iii + 3. */
    A(621, EQ(NR(CT,"GrossTaxLiability"), t1g+NR(CT,"TotalSurcharge")+NR(CT,"EducationCess")),
      "Part B-TTI: gross tax liability (4) must equal the sum of 1g, 2iii and 3.");

    /* A622 — 5a Section 90/90A = Sl. 2 (DTAA) of Schedule TR. */
    A(622, EQ(NR(CT,"TaxRelief.Section90"), I.ScheduleTR1?NR(I,"ScheduleTR1.TaxReliefOutsideIndiaDTAA"):0),
      "Part B-TTI: tax relief u/s 90/90A (5a) must equal Sl. 2 (DTAA) of Schedule TR.");
    /* A623 — 5b Section 91 = Sl. 3 (non-DTAA) of Schedule TR. */
    A(623, EQ(NR(CT,"TaxRelief.Section91"), I.ScheduleTR1?NR(I,"ScheduleTR1.TaxReliefOutsideIndiaNotDTAA"):0),
      "Part B-TTI: tax relief u/s 91 (5b) must equal Sl. 3 (non-DTAA) of Schedule TR.");
    /* A624 — 5c Total tax relief = 5a + 5b. */
    A(624, EQ(NR(CT,"TaxRelief.TotTaxRelief"), NR(CT,"TaxRelief.Section90")+NR(CT,"TaxRelief.Section91")),
      "Part B-TTI: total tax relief (5c) must equal the sum of 5a and 5b.");
    /* A625 — 6 Net tax liability = MAX(0, 4 − 5c). */
    A(625, EQ(NR(CT,"NetTaxLiability"), Math.max(0, NR(CT,"GrossTaxLiability")-NR(CT,"TaxRelief.TotTaxRelief"))),
      "Part B-TTI: net tax liability (6) must equal gross tax liability (4) less total tax relief (5c).");

    /* A626 — 7e Total interest & fee = 7a + 7b + 7c + 7d + 7da. */
    const i7 = NR(CT,"IntrstPay.IntrstPayUs234A")+NR(CT,"IntrstPay.IntrstPayUs234B")+
               NR(CT,"IntrstPay.IntrstPayUs234C")+NR(CT,"IntrstPay.LateFilingFee234F")+
               NR(CT,"IntrstPay.FeeFurnish234I");
    A(626, EQ(NR(CT,"IntrstPay.TotalIntrstPay"), i7),
      "Part B-TTI: total interest and fee payable (7e) must equal the sum of 7a + 7b + 7c + 7d + 7da.");
    /* A627 — 8 Aggregate liability = 6 + 7e. */
    A(627, EQ(NR(CT,"AggregateTaxInterestLiability"), NR(CT,"NetTaxLiability")+NR(CT,"IntrstPay.TotalIntrstPay")),
      "Part B-TTI: aggregate liability (8) must equal net tax liability (6) plus total interest and fee (7e).");

    const p9a=NR(I,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax");
    const p9b=NR(I,"PartB_TTI.TaxPaid.TaxesPaid.TDS");
    const p9c=NR(I,"PartB_TTI.TaxPaid.TaxesPaid.TCS");
    const p9d=NR(I,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax");
    const p9e=NR(I,"PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid");
    /* A628 — 9e Total taxes paid = 9a + 9b + 9c + 9d. */
    A(628, EQ(p9e, p9a+p9b+p9c+p9d),
      "Part B-TTI: total taxes paid (9e) must equal advance tax + TDS + TCS + self-assessment tax (9a + 9b + 9c + 9d).");

    const agg=NR(CT,"AggregateTaxInterestLiability");
    const net115TD=NR(I,"PartB_TTI.Refund.NetTaxPyblOn115TDInc");  /* Sl.12 — its own line (A635) */
    /* A629 — 10 Amount payable = 8 − 9e (if positive, rounded to the nearest ten). */
    A(629, EQ(NR(I,"PartB_TTI.TaxPaid.BalTaxPayable"), roundTen(Math.max(0, agg-p9e)), 10),
      "Part B-TTI: amount payable (10) must equal aggregate liability (8) less total taxes paid (9e).");
    /* A630 — 11 Refund = 9e − 8 (if positive, rounded to the nearest ten). The
       115TD net payable (Sl.12 / NetTaxPyblOn115TDInc) is a self-contained charge
       with its own challans and does NOT net against the income-tax refund. */
    A(630, EQ(NR(I,"PartB_TTI.Refund.RefundDue"), roundTen(Math.max(0, p9e-agg)), 10),
      "Part B-TTI: refund (11) must equal total taxes paid (9e) less aggregate liability (8).");

    /* A631 — 9a Advance tax = Σ Schedule IT challans deposited 01/04/2025–31/03/2026. */
    const itAdv = arr(I,"ScheduleIT.TaxPayment").reduce((a,c)=>{
      const d=String((c||{}).DateDep||"");return a+((d>="2025-04-01"&&d<="2026-03-31")?N((c||{}).Amt):0);},0);
    A(631, EQ(p9a, itAdv),
      "Part B-TTI: advance tax (9a) must equal the total of Schedule IT challans deposited between 01/04/2025 and 31/03/2026.");
    /* A632 — 9d Self-assessment tax = Σ Schedule IT challans deposited after 31/03/2026. */
    const itSat = arr(I,"ScheduleIT.TaxPayment").reduce((a,c)=>{
      const d=String((c||{}).DateDep||"");return a+((d>"2026-03-31")?N((c||{}).Amt):0);},0);
    A(632, EQ(p9d, itSat),
      "Part B-TTI: self-assessment tax (9d) must equal the total of Schedule IT challans deposited after 31/03/2026.");
    /* A633 — 9b TDS = total of column 9 of Schedule TDS1 + column 9 of Schedule TDS2. */
    A(633, EQ(p9b, NR(I,"ScheduleTDS2.TotalTDSonOthThanSals")+NR(I,"ScheduleTDS3.TotalTDS3OnOthThanSal")),
      "Part B-TTI: TDS (9b) must equal the sum of column 9 of Schedule TDS1 and column 9 of Schedule TDS2.");
    /* A634 — 9c TCS = total of column 7(i) of Schedule TCS. */
    A(634, EQ(p9c, NR(I,"ScheduleTCS.TotalSchTCS")),
      "Part B-TTI: TCS (9c) must equal the total of column 7(i) of Schedule TCS.");

    /* A635 — 12 Net tax payable on 115TD income = Sl. 12 of Schedule 115TD. */
    A(635, EQ(net115TD, I.Schedule115TD?NR(I,"Schedule115TD.NetPaybleRefble"):0),
      "Part B-TTI: net tax payable on 115TD income including interest u/s 115TE (Sl. 12) must match Sl. 12 of Schedule 115TD.");

    /* A636 — 234A/234B/234C not computed if Tax Payable on Total Income (1g) is 0. */
    A(636, t1g>0 || (NR(CT,"IntrstPay.IntrstPayUs234A")===0 && NR(CT,"IntrstPay.IntrstPayUs234B")===0 && NR(CT,"IntrstPay.IntrstPayUs234C")===0),
      "Part B-TTI: interest u/s 234A, 234B and 234C cannot be computed when the tax payable on total income (1g) is zero.");

    /* A638 — Schedule FA must be filled if Part B-TTI Sl. 14 (assets outside India) = Yes. */
    A(638, String(RG(I,"PartB_TTI.AssetOutsideIndiaFlg",""))!=="YES" || !!I.ScheduleFA,
      "Part B-TTI: Schedule FA must be filled when Sl. 14 (assets held outside India) is answered 'Yes'.");
  }

  /* =================================================================
     A641 · Schedule IT — the "Total" of Column 5 (Amount) equals the row sum.
     ================================================================= */
  if(I.ScheduleIT){
    const itSum = arr(I,"ScheduleIT.TaxPayment").reduce((a,c)=>a+N((c||{}).Amt),0);
    A(641, EQ(NR(I,"ScheduleIT.TotalTaxPayments"), itSum),
      "Schedule IT: the Total of Column 5 (Amount) must equal the sum of the amounts entered in the individual rows.");
  }

  /* =================================================================
     A642–A654 · Schedule TDS (both credit tables).
       rule "Schedule TDS1" → block ScheduleTDS2 (Form 16A, deductor by TAN)
       rule "Schedule TDS2" → block ScheduleTDS3 (Form 16B/C/D/E, buyer by PAN)
     ================================================================= */
  /* per-row available/claimed (rule A654 col 13 = 6 + 7 + 8(ii) − 9 − 10) */
  const tdsAvail = r=>{const c=RG(r||{},"TaxDeductCreditDtls",{})||{};
    return N(r&&r.BroughtFwdTDSAmt)+N(c.TaxDeductedOwnHands)+N(c.TaxDeductedTDS);};
  const tdsClaimd= r=>{const c=RG(r||{},"TaxDeductCreditDtls",{})||{};
    return N(c.TaxClaimedOwnHands)+N(c.TaxClaimedTDS);};
  const tdsClaimOwn=r=>N(RG(r||{},"TaxDeductCreditDtls.TaxClaimedOwnHands",0));

  /* ---- table-specific serials ---- */
  if(I.ScheduleTDS2){                                    /* rule "Schedule TDS1" (Form 16A, TAN) */
    const rows=arr(I,"ScheduleTDS2.TDSOthThanSalaryDtls");
    let okSplit=true, okDed=true, okTan=true;
    rows.forEach(r=>{ r=r||{}; const c=RG(r,"TaxDeductCreditDtls",{})||{};
      if(N(r.BroughtFwdTDSAmt)>0 && (N(c.TaxDeductedOwnHands)>0||N(c.TaxDeductedIncome)>0||N(c.TaxDeductedTDS)>0)) okSplit=false;
      if(tdsClaimd(r) > tdsAvail(r)+1) okDed=false;
      if(!S0(r.TANOfDeductor)) okTan=false; });
    /* A642 — b/f and current-FY TDS in different rows. */
    A(642, okSplit,
      "Schedule TDS1: unclaimed TDS brought forward and the current-year TDS must be shown in different rows.");
    /* A645 — amount of TDS claimed this year not more than tax deducted. */
    A(645, okDed,
      "Schedule TDS1: the amount of TDS claimed this year cannot exceed the tax deducted (plus any brought forward).");
    /* A646 — TAN of the deductor must be provided. */
    A(646, okTan,
      "Schedule TDS1: the TAN of the deductor must be provided for every TDS row.");
    /* A650 — 15b(i) Total of Column 9 equals the sum of the individual amounts. */
    A(650, EQ(NR(I,"ScheduleTDS2.TotalTDSonOthThanSals"), rows.reduce((a,r)=>a+tdsClaimOwn(r),0)),
      "Schedule TDS (15b(i)): the Total of Column 9 (Amount) must equal the sum of the individual amounts.");
  }

  if(I.ScheduleTDS3){                                    /* rule "Schedule TDS2" (Form 16B/C/D/E, PAN) */
    const rows=arr(I,"ScheduleTDS3.TDS3onOthThanSalDtls");
    let okSplit=true, okDed=true, okPan=true;
    rows.forEach(r=>{ r=r||{}; const c=RG(r,"TaxDeductCreditDtls",{})||{};
      if(N(r.BroughtFwdTDSAmt)>0 && (N(c.TaxDeductedOwnHands)>0||N(c.TaxDeductedIncome)>0||N(c.TaxDeductedTDS)>0)) okSplit=false;
      if(tdsClaimd(r) > tdsAvail(r)+1) okDed=false;
      if(!S0(r.PANOfBuyerTenant)) okPan=false; });
    /* A643 — b/f and current-FY TDS in different rows. */
    A(643, okSplit,
      "Schedule TDS2: unclaimed TDS brought forward and the current-year TDS must be shown in different rows.");
    /* A644 — amount of TDS claimed this year not more than tax deducted. */
    A(644, okDed,
      "Schedule TDS2: the amount of TDS claimed this year cannot exceed the tax deducted (plus any brought forward).");
    /* A647 — PAN of the buyer / tenant must be provided (there is no TAN here). */
    A(647, okPan,
      "Schedule TDS2: the PAN of the buyer / tenant must be provided for every TDS row.");
    /* A651 — 15b(ii) Total of Column 9 equals the sum of the individual amounts. */
    A(651, EQ(NR(I,"ScheduleTDS3.TotalTDS3OnOthThanSal"), rows.reduce((a,r)=>a+tdsClaimOwn(r),0)),
      "Schedule TDS (15b(ii)): the Total of Column 9 (Amount) must equal the sum of the individual amounts.");
  }

  /* ---- serials common to BOTH tables (evaluated over the union of rows) ---- */
  if(I.ScheduleTDS2 || I.ScheduleTDS3){
    const allRows = arr(I,"ScheduleTDS2.TDSOthThanSalaryDtls")
      .concat(arr(I,"ScheduleTDS3.TDS3onOthThanSalDtls"));
    let okYr=true, okGross9=true, okGrossHead=true, okDrop=true, okCf=true;
    allRows.forEach(r=>{ r=r||{}; const c=RG(r,"TaxDeductCreditDtls",{})||{};
      const bf=N(r.BroughtFwdTDSAmt), claimOwn=N(c.TaxClaimedOwnHands);
      /* A648 — FY of deduction present when brought-forward TDS is claimed */
      if(bf>0 && !S0(r.DeductedYr)) okYr=false;
      /* A649 — TDS claimed (col 9) not more than gross amount (col 11), when disclosed */
      if(N(r.GrossAmount)>0 && claimOwn>N(r.GrossAmount)) okGross9=false;
      /* A652 — gross amount and head of income filled when TDS is claimed */
      if(claimOwn>0 && (!(N(r.GrossAmount)>0)||!S0(r.HeadOfIncome))) okGrossHead=false;
      /* A653 — applicable dropdown in column 2 (TDS credit relating to) selected */
      if(!(String(r.TDSCreditName)==="S"||String(r.TDSCreditName)==="O")) okDrop=false;
      /* A654 — col 13 carried forward = col 6 + 7 + 8(ii) − 9 − 10 */
      if(!EQ(N(r.AmtCarriedFwd), Math.max(0, tdsAvail(r)-tdsClaimd(r)))) okCf=false; });
    A(648, okYr,
      "Schedule TDS1 & TDS2: the financial year in which tax was deducted must be given when brought-forward TDS is claimed.");
    A(649, okGross9,
      "Schedule TDS1 & TDS2: the TDS credit claimed this year (column 9) cannot be more than the gross amount disclosed (column 11).");
    A(652, okGrossHead,
      "Schedule TDS1 & TDS2: when TDS credit is claimed, the corresponding gross amount and head of income must be filled.");
    A(653, okDrop,
      "Schedule TDS: the applicable dropdown in column 2 (TDS credit relating to) must be selected.");
    A(654, okCf,
      "Schedule TDS: the TDS credit being carried forward (column 13) must equal column 6 + 7 + 8(ii) − 9 − 10.");
  }

  /* =================================================================
     A655–A661 · Schedule TCS (18C1, Form 27D → block ScheduleTCS).
     ================================================================= */
  if(I.ScheduleTCS){
    const rows=arr(I,"ScheduleTCS.TCSDetails");
    let okSame=true, okCap=true, okOth=true, okDrop=true, okTan=true, okCf=true;
    let sumOwn=0;
    rows.forEach(r=>{
      r=r||{};
      const det=RG(r,"EmployerOrDeductorOrCollectDetl",{})||{};
      const bf=N(r.BroughtFwdTCSAmt);
      const collOwn=NR(r,"TCSCurrFYDtls.TCSAmtCollOwnHands");
      const collOth=NR(r,"TCSCurrFYDtls.TCSAmtCollOthrHands");
      const claimOwn=NR(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHands");
      const claimOth=NR(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TaxClaimedTCS");
      const othPan=RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn","");
      sumOwn+=claimOwn;
      /* A656 — b/f and current-FY TCS not in the same row. */
      if(bf>0 && (collOwn>0||collOth>0)) okSame=false;
      /* A657 — claimed (own + other) not more than (b/f + collected own + collected other). */
      if(claimOwn+claimOth > bf+collOwn+collOth+1) okCap=false;
      /* A658 — other-person PAN required when credit relates to / is claimed in another's hands. */
      if(String(det.TCSCreditName)==="O" && !S0(det.PANofOtherPerson)) okOth=false;
      if(claimOth>0 && !S0(othPan)) okOth=false;
      /* A659 — column 2(i) dropdown selected. */
      if(!(String(det.TCSCreditName)==="S"||String(det.TCSCreditName)==="O")) okDrop=false;
      /* A660 — TAN of the collector provided. */
      if(!S0(det.TAN)) okTan=false;
      /* A661 — column 8 carried forward = column 5 + 6 − 7. */
      if(!EQ(N(r.AmtCarriedFwd), Math.max(0, bf+collOwn+collOth-claimOwn-claimOth))) okCf=false;
    });
    /* A655 — total of column 7(i) equals the sum of the individual values. */
    A(655, EQ(NR(I,"ScheduleTCS.TotalSchTCS"), sumOwn),
      "Schedule TCS: the total of column 7(i) (Claimed in own hands) must equal the sum of the individual values.");
    /* A656 — b/f and current-FY TCS in different rows. */
    A(656, okSame,
      "Schedule TCS: unclaimed TCS brought forward and the current-year TCS cannot be entered in the same row.");
    /* A657 — claimed cannot exceed available TCS. */
    A(657, okCap,
      "Schedule TCS: TCS claimed in own hands and in another person's hands cannot exceed the TCS brought forward plus TCS collected in own and other hands.");
    /* A658 — other-person PAN present. */
    A(658, okOth,
      "Schedule TCS: the PAN of the other person must be provided when the TCS credit relates to, or is claimed in, another person's hands.");
    /* A659 — column 2(i) dropdown selected. */
    A(659, okDrop,
      "Schedule TCS: the applicable dropdown in column 2(i) must be selected.");
    /* A660 — collector's TAN provided. */
    A(660, okTan,
      "Schedule TCS: the tax deduction and collection account number (TAN) of the collector must be provided.");
    /* A661 — column 8 carried forward = 5 + 6 − 7. */
    A(661, okCf,
      "Schedule TCS: the TCS credit being carried forward (column 8) must equal column 5 + column 6 − column 7.");
  }
});
