/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 20.
   Serials 824–866 (books/ITR-5/rules.json), covering Part B-TTI
   (computation of tax liability + taxes paid / refund), Schedule TDS
   (schema ScheduleTDS2 = sheet "Schedule TDS 1"; ScheduleTDS3 = sheet
   "Schedule TDS 2"), Schedule TCS and Schedule IT.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / arr); nothing throws; every block guards to a
   no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_tax.js  (PartB_TTI.ComputationOfTaxLiability /
   PartB_TTI.TaxPaid / PartB_TTI.Refund / AssetOutsideIndiaFlg) and
   forms/ITR-5/src/70_sec_paid.js (ScheduleTDS2 / ScheduleTDS3 /
   ScheduleTCS / ScheduleIT — expPaid + engPaid), cross-checked against
   the books.  Note: Part B-TTI is keyed "PartB_TTI" (underscore), NOT
   "PartB-TTI"; Schedule TR is keyed "ScheduleTR1".
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const FYEND="2026-03-31";                 /* 31 Mar of PY 2025-26 (AY 2026-27) */
  const has=s=>String(s==null?"":s).trim()!=="";
  const TANre=/^[A-Z]{4}[0-9]{5}[A-Z]$/;    /* 4 letters · 5 digits · 1 letter */
  const is194N=s=>["94N","94N-F","94N-C","94N-FT"].indexOf(String(s||""))>=0;

  /* ===================================================================
     PART B-TTI  (824–841)   block key: I.PartB_TTI
     CTL = I.PartB_TTI.ComputationOfTaxLiability
       1d  TaxPayableOnDeemedTI.TotalTax        (tax on deemed total income)
       2a  TaxPayableOnTI.TaxAtNormalRates
       2b  TaxPayableOnTI.TaxAtSpecialRates
       2c  TaxPayableOnTI.RebateOnAgriInc
       2d  TaxPayableOnTI.TaxPayableOnTotInc
       2eiv TaxPayableOnTI.TotalSurcharge
       2f  TaxPayableOnTI.EducationCess
       2g  TaxPayableOnTI.GrossTaxLiability
       3   GrossTaxPayable        4  CreditUS115JD     5  TaxPaidUnderCredit
       6a  TaxRelief.Section90    6b TaxRelief.Section91  6c TaxRelief.TotTaxRelief
       7   NetTaxLiability
       8a  IntrstPay.IntrstPayUs234A  8b …234B  8c …234C
       8d  IntrstPay.LateFilingFee234F   234-I fee: IntrstPay.FeeFurnish234I
       8e  IntrstPay.TotalIntrstPay
       9   AggregateTaxInterestLiability
     TaxPaid.TaxesPaid: AdvanceTax(10a) TDS(10b) TCS(10c) SelfAssessmentTax(10d)
                        TotalTaxesPaid(10e)     TaxPaid.BalTaxPayable(11)
     Refund.RefundDue(12)
     =================================================================== */
  if(I.PartB_TTI){
    const B=I.PartB_TTI;
    const g=(p,d)=>N(RG(B,p,d===undefined?0:d));
    /* 824: 2d Tax payable on total income = 2a + 2b − 2c */
    A(824,REQ(g("ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc"),
      g("ComputationOfTaxLiability.TaxPayableOnTI.TaxAtNormalRates")+
      g("ComputationOfTaxLiability.TaxPayableOnTI.TaxAtSpecialRates")-
      g("ComputationOfTaxLiability.TaxPayableOnTI.RebateOnAgriInc")),
      "Part B-TTI: item 2d (tax payable on total income) must equal 2a + 2b − 2c.");
    /* 825: 2g Gross tax liability = 2d + 2eiv + 2f */
    A(825,REQ(g("ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability"),
      g("ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc")+
      g("ComputationOfTaxLiability.TaxPayableOnTI.TotalSurcharge")+
      g("ComputationOfTaxLiability.TaxPayableOnTI.EducationCess")),
      "Part B-TTI: item 2g (gross tax liability) must equal 2d + 2eiv + 2f.");
    /* 826/827: relief 6a/6b tie back to Schedule TR (only when Schedule TR present) */
    if(I.ScheduleTR1){
      A(826,REQ(g("ComputationOfTaxLiability.TaxRelief.Section90"),
        N(RG(I,"ScheduleTR1.TaxReliefOutsideIndiaDTAA",0))),
        "Part B-TTI: item 6a (relief u/s 90/90A) must equal the DTAA tax relief (Sl.no.2) in Schedule TR.");
      A(827,REQ(g("ComputationOfTaxLiability.TaxRelief.Section91"),
        N(RG(I,"ScheduleTR1.TaxReliefOutsideIndiaNotDTAA",0))),
        "Part B-TTI: item 6b (relief u/s 91) must equal the non-DTAA tax relief (Sl.no.3) in Schedule TR.");
    }
    /* 828: 6c Total relief = 6a + 6b */
    A(828,REQ(g("ComputationOfTaxLiability.TaxRelief.TotTaxRelief"),
      g("ComputationOfTaxLiability.TaxRelief.Section90")+
      g("ComputationOfTaxLiability.TaxRelief.Section91")),
      "Part B-TTI: item 6c (total tax relief) must equal 6a (section 90/90A) + 6b (section 91).");
    /* 829: 8e Total interest and fee = 234A + 234B + 234C + 234F + 234-I */
    A(829,REQ(g("ComputationOfTaxLiability.IntrstPay.TotalIntrstPay"),
      g("ComputationOfTaxLiability.IntrstPay.IntrstPayUs234A")+
      g("ComputationOfTaxLiability.IntrstPay.IntrstPayUs234B")+
      g("ComputationOfTaxLiability.IntrstPay.IntrstPayUs234C")+
      g("ComputationOfTaxLiability.IntrstPay.LateFilingFee234F")+
      g("ComputationOfTaxLiability.IntrstPay.FeeFurnish234I")),
      "Part B-TTI: item 8e (total interest and fee payable) must equal interest u/s 234A + 234B + 234C + fee u/s 234F + fee u/s 234-I.");
    /* 830: 9 Aggregate liability = 7 + 8e */
    A(830,REQ(g("ComputationOfTaxLiability.AggregateTaxInterestLiability"),
      g("ComputationOfTaxLiability.NetTaxLiability")+
      g("ComputationOfTaxLiability.IntrstPay.TotalIntrstPay")),
      "Part B-TTI: item 9 (aggregate liability) must equal item 7 (net tax liability) + item 8e (total interest and fee payable).");
    /* 831: 10e Total taxes paid = advance + TDS + TCS + self-assessment */
    A(831,REQ(g("TaxPaid.TaxesPaid.TotalTaxesPaid"),
      g("TaxPaid.TaxesPaid.AdvanceTax")+g("TaxPaid.TaxesPaid.TDS")+
      g("TaxPaid.TaxesPaid.TCS")+g("TaxPaid.TaxesPaid.SelfAssessmentTax")),
      "Part B-TTI: item 10e (total taxes paid) must equal advance tax + TDS + TCS + self-assessment tax.");
    /* 832: 12 Refund = ROUND(MAX(0, 10e − 9), −1) — the utility rounds refund to the
       nearest ₹10 (§288B, book L98), so compare against that ₹10-rounded difference. */
    A(832,REQ(g("Refund.RefundDue"),
      Math.round(Math.max(0,g("TaxPaid.TaxesPaid.TotalTaxesPaid")-g("ComputationOfTaxLiability.AggregateTaxInterestLiability"))/10)*10,6),
      "Part B-TTI: item 12 (refund) must equal item 10e (total taxes paid) − item 9 (aggregate liability), rounded to the nearest ₹10.");
    /* 833: 11 Amount payable = ROUND(MAX(0, 9 − 10e), −1) — nearest ₹10 (§288B, book L97). */
    A(833,REQ(g("TaxPaid.BalTaxPayable"),
      Math.round(Math.max(0,g("ComputationOfTaxLiability.AggregateTaxInterestLiability")-g("TaxPaid.TaxesPaid.TotalTaxesPaid"))/10)*10,6),
      "Part B-TTI: item 11 (amount payable) must equal item 9 (aggregate liability) − item 10e (total taxes paid), rounded to the nearest ₹10.");
    /* 834: 3 Gross tax payable = higher of 1d (tax on deemed TI) and 2g */
    A(834,REQ(g("ComputationOfTaxLiability.GrossTaxPayable"),
      Math.max(g("ComputationOfTaxLiability.TaxPayableOnDeemedTI.TotalTax"),
               g("ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability"))),
      "Part B-TTI: item 3 (gross tax payable) must equal the higher of item 1d (tax on deemed total income) and item 2g (gross tax liability).");
    /* 835: 5 Tax payable after §115JD credit = 3 − 4 */
    A(835,REQ(g("ComputationOfTaxLiability.TaxPaidUnderCredit"),
      g("ComputationOfTaxLiability.GrossTaxPayable")-g("ComputationOfTaxLiability.CreditUS115JD")),
      "Part B-TTI: item 5 (tax payable after credit u/s 115JD) must equal item 3 − item 4.");
    /* 836: 7 Net tax liability = MAX(0, 5 − 6c) — floored per book PARTB_TI_TTI.md:120 L82
       (L82 = MAX(TaxPayAfterCreditUs115JD − TotTaxRelief, 0)); tax.js emits n0(net) so a loss
       year with s.90/91 relief > tax exports 0, which strict equality would have false-fired. */
    A(836,REQ(g("ComputationOfTaxLiability.NetTaxLiability"),
      Math.max(0,g("ComputationOfTaxLiability.TaxPaidUnderCredit")-g("ComputationOfTaxLiability.TaxRelief.TotTaxRelief"))),
      "Part B-TTI: item 7 (net tax liability) must equal item 5 − item 6c (nil if negative).");
    /* 837/838: advance vs self-assessment split of Schedule IT by date of deposit.
       Advance = challans up to 31-03-2026; self-assessment = challans after 31-03-2026. */
    if(I.ScheduleIT){
      const it=arr(RG(I,"ScheduleIT.TaxPayment",[]));
      const adv=RSUM(it.filter(c=>c&&!(String(c.DateDep||"")>FYEND)),"Amt");
      const sat=RSUM(it.filter(c=>c&&String(c.DateDep||"")>FYEND),"Amt");
      A(837,REQ(g("TaxPaid.TaxesPaid.AdvanceTax"),adv),
        "Part B-TTI: advance tax (10a) must equal the total of Schedule IT challans deposited on or before 31 March 2026.");
      A(838,REQ(g("TaxPaid.TaxesPaid.SelfAssessmentTax"),sat),
        "Part B-TTI: self-assessment tax (10d) must equal the total of Schedule IT challans deposited after 31 March 2026.");
    }
    /* 840: if the foreign-asset flag (item 17) is YES, Schedule FA is mandatory */
    A(840,String(RG(B,"AssetOutsideIndiaFlg",""))!=="YES"||(I.ScheduleFA&&typeof I.ScheduleFA==="object"),
      "Part B-TTI: item 17 (asset outside India) is Yes, so Schedule FA is mandatory and must be filled.");
  }

  /* ===================================================================
     SCHEDULE IT  (843)   block key: I.ScheduleIT
     TotalTaxPayments = Σ TaxPayment[].Amt
     =================================================================== */
  if(I.ScheduleIT){
    const it=arr(RG(I,"ScheduleIT.TaxPayment",[]));
    A(843,REQ(N(RG(I,"ScheduleIT.TotalTaxPayments",0)),RSUM(it,"Amt")),
      "Schedule IT: the Total field must equal the sum of Column 5 (Amount) over all challan rows.");
  }

  /* ===================================================================
     SCHEDULE TDS  (844–859)
     sheet "Schedule TDS 1" -> block I.ScheduleTDS2 (deductor by TAN)
        rows: TDSOthThanSalaryDtls   total: TotalTDSonOthThanSals
     sheet "Schedule TDS 2" -> block I.ScheduleTDS3 (buyer/tenant by PAN)
        rows: TDS3onOthThanSalDtls   total: TotalTDS3OnOthThanSal
     Row: TDSCreditName("O"/"S") · PANofOtherPerson · TANOfDeductor |
          PANOfBuyerTenant · TDSSection · DeductedYr · BroughtFwdTDSAmt ·
          GrossAmount(col11) · HeadOfIncome(col12) · AmtCarriedFwd(col13) ·
          TaxDeductCreditDtls{ TaxClaimedOwnHands(col9) · TaxDeductedOwnHands ·
            TaxDeductedTDS(other hands) · TaxClaimedTDS(other hands) }
     =================================================================== */
  function tdsBlock(blk,rowsKey,totKey,isTDS1,sheet,S){
    if(!blk) return;
    const rows=arr(RG(blk,rowsKey,[]));
    /* 848/849: Total = Σ col.9 (claimed in own hands) */
    A(S.total,REQ(N(RG(blk,totKey,0)),
      RSUM(rows,r=>N(RG(r,"TaxDeductCreditDtls.TaxClaimedOwnHands",0)))),
      sheet+": the Total field must equal the sum of Column 9 (claimed in own hands) over all rows.");
    rows.forEach(function(r,i){r=r||{};const L=" "+sheet+" row "+(i+1)+": ";
      const c=RG(r,"TaxDeductCreditDtls",{})||{};
      const claimOwn=N(c.TaxClaimedOwnHands),dedOwn=N(c.TaxDeductedOwnHands),
            dedTds=N(c.TaxDeductedTDS),claimTds=N(c.TaxClaimedTDS);
      const bf=N(r.BroughtFwdTDSAmt),gross=N(r.GrossAmount),sec=String(r.TDSSection||"");
      const other=String(r.TDSCreditName||"")==="O";
      const dedId=isTDS1?String(r.TANOfDeductor||""):String(r.PANOfBuyerTenant||"");
      /* 844 (TDS 1 only): a TAN, when present, must be a valid 10-char TAN */
      if(isTDS1) A(844,!has(r.TANOfDeductor)||TANre.test(String(r.TANOfDeductor||"").toUpperCase()),
        "Schedule TDS 1"+" row "+(i+1)+": a valid ten-character TAN of the deductor must be entered.");
      /* 845/846: TDS claimed (own hands) cannot exceed tax deducted (own hands) + b/f */
      A(S.claimDed,claimOwn<=dedOwn+bf+1,
        L+"the amount of TDS claimed cannot be more than the tax deducted (plus any brought-forward TDS).");
      /* 847: if brought-forward TDS is claimed, the year of deduction must be given */
      A(847,!(bf>0)||N(r.DeductedYr)>0,
        L+"the financial year of deduction must be selected when brought-forward TDS is claimed.");
      /* 851: b/f TDS and current-FY TDS cannot be entered in the same row */
      A(851,!(bf>0&&dedOwn>0),
        L+"unclaimed TDS brought forward and TDS of the current financial year must be entered in different rows.");
      /* 852 (TDS 1 only): claimed (col.9) cannot exceed gross (col.11), except for 194N */
      if(isTDS1&&gross>0) A(852,is194N(sec)||claimOwn<=gross+1,
        "Schedule TDS 1"+" row "+(i+1)+": TDS credit claimed (Col.9) cannot be more than the gross amount disclosed (Col.11), except for section 194N.");
      /* 853/854: if TDS is claimed, gross amount (col.11) and head of income (col.12)
         are mandatory (except section 194N in TDS 1) */
      if(claimOwn>0&&!(isTDS1&&is194N(sec)))
        A(S.grossHead,gross>0&&has(r.HeadOfIncome),
          L+"the gross amount (Col.11) and head of income (Col.12) must be filled when TDS is claimed.");
      /* 855: if the credit relates to another person, that person's PAN is mandatory */
      A(855,!other||has(r.PANofOtherPerson)||has(r.AadhaarOfOtherPerson),
        L+"the PAN (or Aadhaar) of the other person is mandatory when the TDS credit relates to another person.");
      /* 856: if the credit relates to another person, the deductor's TAN / buyer's PAN must be filled */
      A(856,!other||has(dedId),
        L+(isTDS1?"the TAN of the deductor":"the PAN of the tenant/buyer/deductor")+" must be filled when the TDS credit relates to another person.");
      /* 857: col.13 carried forward = col.6 + col.7 + col.8 − col.9 − col.10, floored at nil
         = MAX(0, b/f + deducted-own + deducted-other − claimed-own − claimed-other) */
      A(857,REQ(N(r.AmtCarriedFwd),Math.max(0,bf+dedOwn+dedTds-claimOwn-claimTds)),
        L+"the TDS credit being carried forward (Col.13) must equal Col.6 + Col.7 + Col.8 − Col.9 − Col.10.");
      /* 858: column 2 dropdown (TDS credit relating to self/other) must be selected */
      A(858,String(r.TDSCreditName||"")==="S"||other,
        L+"the applicable dropdown in Column 2 (TDS credit relating to self / other person) must be selected.");
      /* 859: the section under which TDS is deducted is mandatory */
      A(859,has(r.TDSSection),
        L+"the section under which TDS is deducted must be selected.");
    });
  }
  tdsBlock(I.ScheduleTDS2,"TDSOthThanSalaryDtls","TotalTDSonOthThanSals",true,"Schedule TDS 1",
    {total:848,claimDed:845,grossHead:853});
  tdsBlock(I.ScheduleTDS3,"TDS3onOthThanSalDtls","TotalTDS3OnOthThanSal",false,"Schedule TDS 2",
    {total:849,claimDed:846,grossHead:854});

  /* ===================================================================
     SCHEDULE TCS  (860–866)   block key: I.ScheduleTCS
     TotalSchTCS = Σ TCSClaimedThisYearDtls.TCSAmtCollOwnHands (col 7i)
     Row: EmployerOrDeductorOrCollectDetl{ TCSCreditName("O"/"S") · TAN ·
            PANofOtherPerson } · DeductedYr · BroughtFwdTCSAmt(col5) ·
          TCSCurrFYDtls{ TCSAmtCollOwnHands · TCSAmtCollOthrHands }(col6) ·
          TCSClaimedThisYearDtls{ TCSAmtCollOwnHands ·
            TCSAmtCollOthrHands{ TaxClaimedTCS · PANOfOthrPrsn } }(col7) ·
          AmtCarriedFwd(col8)
     =================================================================== */
  if(I.ScheduleTCS){
    const rows=arr(RG(I,"ScheduleTCS.TCSDetails",[]));
    /* 860: Total col 7(i) = Σ claimed in own hands */
    A(860,REQ(N(RG(I,"ScheduleTCS.TotalSchTCS",0)),
      RSUM(rows,r=>N(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHands",0)))),
      "Schedule TCS: the Total field must equal the sum of Column 7(i) (claimed in own hands) over all rows.");
    rows.forEach(function(r,i){r=r||{};const L=" Schedule TCS row "+(i+1)+": ";
      const bf=N(r.BroughtFwdTCSAmt);
      const collOwn=N(RG(r,"TCSCurrFYDtls.TCSAmtCollOwnHands",0)),
            collOth=N(RG(r,"TCSCurrFYDtls.TCSAmtCollOthrHands",0));
      const claimOwn=N(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHands",0)),
            claimOth=N(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TaxClaimedTCS",0));
      const cName=String(RG(r,"EmployerOrDeductorOrCollectDetl.TCSCreditName",""));
      const tan=String(RG(r,"EmployerOrDeductorOrCollectDetl.TAN",""));
      const othPan=RG(r,"EmployerOrDeductorOrCollectDetl.PANofOtherPerson","");
      const claimOthPan=RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn","");
      /* 861: b/f TCS and current-FY TCS cannot be entered in the same row */
      A(861,!(bf>0&&(collOwn>0||collOth>0)),
        L+"unclaimed TCS brought forward and TCS of the current financial year must be entered in different rows.");
      /* 862: TCS claimed (own + other) cannot exceed b/f + collected (own + other) */
      A(862,(claimOwn+claimOth)<=bf+collOwn+collOth+1,
        L+"the TCS claimed in own hands and in the hands of any other person cannot exceed the TCS brought forward plus the TCS collected.");
      /* 863: if credit relates to / is claimed in another person's hands, that person's PAN is required */
      A(863,!(cName==="O"||claimOth>0)||has(othPan)||has(claimOthPan),
        L+"the PAN of the other person is mandatory when the TCS credit relates to, or is claimed in the hands of, another person.");
      /* 864: column 2(i) dropdown (TCS credit relating to self/other) must be selected */
      A(864,cName==="S"||cName==="O",
        L+"the applicable dropdown in Column 2(i) (TCS credit relating to self / other person) must be selected.");
      /* 865: the collector's TAN must be provided (valid 10-char TAN) */
      A(865,has(tan)&&TANre.test(tan.toUpperCase()),
        L+"a valid ten-character Tax deduction and collection account number of the collector must be provided.");
      /* 866: col.8 carried forward = col.5 + col.6 − col.7, floored at nil
         = MAX(0, b/f + collected(own+other) − claimed(own+other)) */
      A(866,REQ(N(r.AmtCarriedFwd),Math.max(0,bf+collOwn+collOth-claimOwn-claimOth)),
        L+"the TCS credit being carried forward (Col.8) must equal Col.5 + Col.6 − Col.7.");
    });
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     839 — Part B-TTI Sl.no.15 "Net refund after adjustment as per Sl.no.14"
           = Sl.no.12 − Sl.no.13.  The refund block exported to the schema
           carries only RefundDue (item 12); items 13, 14 and 15 (refund
           adjustments) have no schema field, so the assertion cannot be
           evaluated offline.
     841 — 234-I revised-return fee shall be Rs.1000 if the ITR is filed
           after 31/12/2026 u/s 139(5) and total income ≤ Rs.5 lakh.
     842 — 234-I revised-return fee shall be Rs.5000 if the ITR is filed
           after 31/12/2026 u/s 139(5) and total income > Rs.5 lakh.
           Both depend on the actual date of e-filing ("filed after
           31/12/2026"), which is a submission-time value set by the portal
           and is not present in the offline return schema; the fee cannot
           be recomputed here without it.
     850 — "If TDS is claimed then the corresponding receipts/income should
           be offered for taxation."  This requires cross-matching each TDS
           entry against the income schedules / Form 26AS / AIS-TIS; there
           is no direct, verifiable schema linkage between a TDS row and the
           income it relates to, so a literal encoding would false-fire.
           Left to the portal's 26AS/AIS reconciliation.
     ------------------------------------------------------------------ */
});
