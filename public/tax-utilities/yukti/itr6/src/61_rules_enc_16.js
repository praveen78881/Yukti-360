/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_16 (Phase 6).
   Serial range A760–A812 (Part B-TTI tax computation & taxes-paid roll-up,
   Schedule TR/MAT/MATC/115TD/IT cross-checks, Schedule TDS2/TDS3, Schedule
   TCS, Schedule FA, Schedule 80G). Registered via ruleset(fn); runRules()
   invokes it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A
   block) when cond — the "this return is lawful" assertion — is FALSE.
   Every read is guarded (RG / (X||{}) / N()); nothing throws. Keys are the
   built-return ITR6 schema paths; they were taken from the ITR-6 schema and
   the owning sections (70_sec_tax / 70_sec_mat / 70_sec_paid / 70_sec_ded /
   70_sec_fa / 70_sec_bank). The arithmetic mirrors the builder's own
   formulae, so a lawfully-built return is SILENT and a tampered/imported
   figure fires. Encoded from each rule's own text (constitution rule 6).

   Serials in A760–A812 NOT encoded here, and why:
     A765 — OFFLINE-IMPOSSIBLE (IFSC must tally with the live RBI IFSC
            database; no offline table shipped) — census OFF, skipped.
     A783 / A784 — NA (234-I fee keyed to the actual portal filing
            timestamp; not derivable offline) — census NA, skipped.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const U=v=>String(v==null?"":v).trim().toUpperCase();

  /* ===================================================================
     PART B-TTI — computation of tax liability & taxes-paid roll-up.
     Sl. numbers per the return: 1a-d deemed-income (115JB), 2f gross tax
     liability, 3 gross tax payable, 4 115JAA credit, 5 after-credit,
     6a/6b/6c relief, 7 net tax liability, 8a-8da/8e interest & fee,
     9 aggregate liability, 10a-10e taxes paid, 11 payable, 12 refund,
     13-15 the 115TD adjustment.
     =================================================================== */
  if(I.PartB_TTI){
    const CTL=RG(I,"PartB_TTI.ComputationOfTaxLiability",{})||{};
    const DTI=RG(CTL,"TaxPayableOnDeemedTI",{})||{};      /* 1a-1d */
    const TOI=RG(CTL,"TaxPayableOnTI",{})||{};            /* 2f    */
    const REL=RG(CTL,"TaxRelief",{})||{};                 /* 6a-6c */
    const INT=RG(CTL,"IntrstPay",{})||{};                 /* 8a-8e */
    const TP=RG(I,"PartB_TTI.TaxPaid",{})||{};
    const TPd=RG(TP,"TaxesPaid",{})||{};                  /* 10a-10e */
    const RFD=RG(I,"PartB_TTI.Refund",{})||{};            /* 12 */

    /* A761 — 6c "Total Tax Relief" = 6a (relief u/s 90/90A) + 6b (relief u/s 91). */
    A(761, REQ(REL.TotTaxRelief, N(REL.Section90)+N(REL.Section91)),
      "Part B-TTI: total tax relief (6c) must equal relief u/s 90/90A (6a) plus relief u/s 91 (6b).");

    /* A762 — 8e "Total interest & fee payable" = 8a + 8b + 8c + 8d + 8da. */
    A(762, REQ(INT.TotalIntrstPay, N(INT.IntrstPayUs234A)+N(INT.IntrstPayUs234B)
        +N(INT.IntrstPayUs234C)+N(INT.LateFilingFee234F)+N(INT.FeeFurnish234I)),
      "Part B-TTI: total interest & fee payable (8e) must equal 234A + 234B + 234C + 234F + 234I fee.");

    /* A763 — 9 "Aggregate liability" = 7 (net tax liability) + 8e. */
    A(763, REQ(CTL.AggregateTaxInterestLiability, N(CTL.NetTaxLiability)+N(INT.TotalIntrstPay)),
      "Part B-TTI: aggregate tax & interest liability (9) must equal net tax liability (7) plus total interest & fee payable (8e).");

    /* A764 — 10e "Total taxes paid" = 10a + 10b + 10c + 10d. */
    A(764, REQ(TPd.TotalTaxesPaid, N(TPd.AdvanceTax)+N(TPd.TDS)+N(TPd.TCS)+N(TPd.SelfAssessmentTax)),
      "Part B-TTI: total taxes paid (10e) must equal advance tax + TDS + TCS + self-assessment tax.");

    /* A766 — 12 "Refund" = 10e − 9, only if the difference is positive. The
       refund (and the amount payable) is rounded to the nearest ten under
       s.288B, while item 9 (aggregate liability) is carried to the rupee — so
       the comparison must round the difference to the nearest ten, else a
       difference that is not a multiple of ten (e.g. 9,69,364 → 9,69,360)
       false-fires against the exact 10e − 9. */
    A(766, REQ(RFD.RefundDue, Math.round(Math.max(0, N(TPd.TotalTaxesPaid)-N(CTL.AggregateTaxInterestLiability))/10)*10),
      "Part B-TTI: refund (12) must equal total taxes paid (10e) minus aggregate liability (9), when positive.");

    /* A767 — 11 "Amount payable" = 9 − 10e, only if the difference is positive
       (also rounded to the nearest ten under s.288B, as at A766). */
    A(767, REQ(TP.BalTaxPayable, Math.round(Math.max(0, N(CTL.AggregateTaxInterestLiability)-N(TPd.TotalTaxesPaid))/10)*10),
      "Part B-TTI: amount payable (11) must equal aggregate liability (9) minus total taxes paid (10e), when positive.");

    /* A768 — 3 "Gross tax payable" = higher of 1d and 2f. */
    A(768, REQ(CTL.GrossTaxPayable, Math.max(N(DTI.TotalTax), N(TOI.GrossTaxLiability))),
      "Part B-TTI: gross tax payable (3) must be the higher of total tax on deemed income u/s 115JB (1d) and gross tax liability (2f).");

    /* A769 — 5 "Tax payable after credit u/s 115JAA" = 3 − 4. */
    A(769, REQ(CTL.TaxPayableAfterCredUs115JAA, N(CTL.GrossTaxPayable)-N(CTL.CredUs115JAATaxPaid)),
      "Part B-TTI: tax payable after 115JAA credit (5) must equal gross tax payable (3) minus 115JAA credit (4).");

    /* A770 — 7 "Net tax liability" = 5 − 6c. */
    A(770, REQ(CTL.NetTaxLiability, N(CTL.TaxPayableAfterCredUs115JAA)-N(REL.TotTaxRelief)),
      "Part B-TTI: net tax liability (7) must equal tax payable after 115JAA credit (5) minus total tax relief (6c).");

    /* A773 — 4 "115JAA credit" cannot be claimed if 2f (gross tax liability)
       is less than 1d (total tax on deemed income u/s 115JB). */
    A(773, N(TOI.GrossTaxLiability) >= N(DTI.TotalTax) || N(CTL.CredUs115JAATaxPaid) <= 0,
      "Part B-TTI: credit u/s 115JAA (4) cannot be claimed when gross tax liability (2f) is less than total tax on deemed income u/s 115JB (1d).");

    /* A774 — 1d "Total tax payable on deemed total income u/s 115JB"
       = 1a (tax on deemed income) + 1b (surcharge) + 1c (cess). */
    A(774, REQ(DTI.TotalTax, N(DTI.TaxDeemedTISec115JB)+N(DTI.Surcharge)+N(DTI.EducationCess)),
      "Part B-TTI: total tax on deemed total income u/s 115JB (1d) must equal tax on deemed income (1a) plus surcharge (1b) plus cess (1c).");
  }

  /* A760 — 6b (relief u/s 91) = Sl. No. 3 of Schedule TR (tax relief for a
     country with which there is NO DTAA). */
  if(I.ScheduleTR1){
    A(760, REQ(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section91"),
        RG(I,"ScheduleTR1.TaxReliefOutsideIndiaNotDTAA")),
      "Part B-TTI: tax relief claimed u/s 91 (6b) must equal Sl. No. 3 of Schedule TR (relief for a country with no DTAA).");
  }

  /* A771 — 1a (tax payable on deemed total income u/s 115JB) = Sl. No. 10 of
     Schedule MAT (tax payable u/s 115JB). */
  if(I.ScheduleMAT){
    A(771, REQ(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.TaxDeemedTISec115JB"),
        RG(I,"ScheduleMAT.TaxPayableUs115JB")),
      "Part B-TTI: tax payable on deemed total income u/s 115JB (1a) must equal Sl. No. 10 of Schedule MAT.");
  }

  /* A772 — 4 (credit u/s 115JAA of tax paid in earlier years) = Sl. No. 5 of
     Schedule MATC (amount of tax credit u/s 115JAA utilised during the year). */
  if(I.ScheduleMATC){
    A(772, REQ(RG(I,"PartB_TTI.ComputationOfTaxLiability.CredUs115JAATaxPaid"),
        RG(I,"ScheduleMATC.AmtTaxCredUs115JAA")),
      "Part B-TTI: credit u/s 115JAA (4) must equal Sl. No. 5 of Schedule MATC.");
  }

  /* A779/A780/A781 — the 115TD adjustment (Sl. 13-15). */
  if(I.Schedule115TD){
    const TP=RG(I,"PartB_TTI.TaxPaid",{})||{};
    const refund=N(RG(I,"PartB_TTI.Refund.RefundDue"));
    /* A779 — 13 "Net tax payable on 115TD income incl. interest u/s 115TE"
       = Sl. No. 12 of Schedule 115TD (net amount payable/refundable). */
    A(779, REQ(TP.NetTaxPayable115TD, RG(I,"Schedule115TD.NetPaybleRefble")),
      "Part B-TTI: net tax payable on 115TD income incl. interest u/s 115TE (13) must equal Sl. No. 12 of Schedule 115TD.");
    /* A780 — 14 "Tax payable u/s 115TD after adjustment of refund" = 13 − 12. */
    A(780, REQ(TP.TaxPayable115TD, Math.max(0, N(TP.NetTaxPayable115TD)-refund)),
      "Part B-TTI: tax payable u/s 115TD after adjustment of refund (14) must equal Sl. No. 13 less Sl. No. 12.");
    /* A781 — 15 "Net refund after adjustment" = 12 − 13. */
    A(781, REQ(TP.NetRefundAdjust, Math.max(0, refund-N(TP.NetTaxPayable115TD))),
      "Part B-TTI: net refund after adjustment (15) must equal Sl. No. 12 less Sl. No. 13.");
  }

  /* A782 — Schedule FA must be filled if Sl. No. 17 of Part B-TTI
     ("Do you have assets outside India?") is answered "Yes". */
  const faFilled=(function(){
    const fa=RG(I,"ScheduleFA",{})||{};
    return Object.keys(fa).some(function(k){const v=fa[k];return Array.isArray(v)&&v.length>0;});
  })();
  A(782, RG(I,"PartB_TTI.AssetOutsideIndiaFlg")!=="Y" || faFilled,
    "Part B-TTI: Schedule FA must be filled when 'do you have assets located outside India?' (Sl. No. 17) is answered Yes.");

  /* ===================================================================
     SCHEDULE IT — advance vs self-assessment split by date of deposit, and
     the arithmetical total. Advance tax (10a) is a challan dated on/before
     31-Mar-2026; self-assessment tax (10d) is dated after 31-Mar-2026.
     =================================================================== */
  if(I.ScheduleIT){
    const IT=RG(I,"ScheduleIT",{})||{};
    const chln=RG(IT,"TaxPayment",[])||[];
    const YE="2026-03-31";
    const adv=chln.reduce((a,c)=>a+(c&&S0(c.DateDep)&&String(c.DateDep)<=YE?N(c.Amt):0),0);
    const sat=chln.reduce((a,c)=>a+(c&&S0(c.DateDep)&&String(c.DateDep)>YE?N(c.Amt):0),0);

    /* A775 — 10a advance tax = Σ Schedule IT amounts deposited up to 31-Mar-2026. */
    A(775, REQ(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax"), adv),
      "Part B-TTI: advance tax (10a) must equal the total of Schedule IT challans deposited on or before 31/03/2026.");

    /* A776 — 10d self-assessment tax = Σ Schedule IT amounts deposited after 31-Mar-2026. */
    A(776, REQ(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax"), sat),
      "Part B-TTI: self-assessment tax (10d) must equal the total of Schedule IT challans deposited after 31/03/2026.");

    /* A785 — Schedule IT total (col 5) = sum of the individual challan amounts. */
    A(785, REQ(IT.TotalTaxPayments, chln.reduce((a,c)=>a+N(c&&c.Amt),0)),
      "Schedule IT: the total of tax paid (col 5) must equal the sum of the individual challan amounts.");
  }

  /* ===================================================================
     SCHEDULE TDS2 (Form 16A) & TDS3 (Form 16B/16C/16D). Column map:
       col 6  = BroughtFwdTDSAmt
       col 7  = TaxDeductCreditDtls.TaxDeductedOwnHands
       col 8  = TaxDeductCreditDtls.TaxDeductedTDS
       col 9  = TaxDeductCreditDtls.TaxClaimedOwnHands  (TDS credit claimed this year)
       col 10 = TaxDeductCreditDtls.TaxClaimedTDS
       col 11 = GrossAmount
       col 13 = AmtCarriedFwd
     A "used" row has any of claimed/deducted/brought-forward.
     =================================================================== */
  const TDS2=RG(I,"ScheduleTDS2.TDSOthThanSalaryDtls",[])||[];
  const TDS3=RG(I,"ScheduleTDS3.TDS3onOthThanSalDtls",[])||[];
  const tdsUsed=r=>{const c=RG(r,"TaxDeductCreditDtls",{})||{};
    return N(c.TaxClaimedOwnHands)||N(c.TaxDeductedOwnHands)||N(r.BroughtFwdTDSAmt)||N(c.TaxDeductedTDS);};

  /* A778 — 10b TDS = Σ col 9 (own-hands credit claimed) of Schedule TDS2 & TDS3. */
  if(I.ScheduleTDS2||I.ScheduleTDS3){
    const claimedTDS=arr=>(arr||[]).reduce((a,r)=>a+N(RG(r,"TaxDeductCreditDtls.TaxClaimedOwnHands")),0);
    A(778, REQ(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.TDS"), claimedTDS(TDS2)+claimedTDS(TDS3)),
      "Part B-TTI: TDS (10b) must equal the sum of the TDS credit claimed this year (col 9) across Schedule TDS2 & TDS3.");
  }

  /* A788 — total "TDS credit claimed this year" = sum of the individual rows. */
  if(I.ScheduleTDS2){
    A(788, REQ(RG(I,"ScheduleTDS2.TotalTDSonOthThanSals"),
        TDS2.reduce((a,r)=>a+N(RG(r,"TaxDeductCreditDtls.TaxClaimedOwnHands")),0)),
      "Schedule TDS2: the total TDS credit claimed this year must equal the sum of the individual rows.");
  }
  if(I.ScheduleTDS3){
    A(788, REQ(RG(I,"ScheduleTDS3.TotalTDS3OnOthThanSal"),
        TDS3.reduce((a,r)=>a+N(RG(r,"TaxDeductCreditDtls.TaxClaimedOwnHands")),0)),
      "Schedule TDS3: the total TDS credit claimed this year must equal the sum of the individual rows.");
  }

  /* Row-level TDS checks (A787, A789-A798), applied to both TDS2 and TDS3. */
  [{arr:TDS2,tag:"TDS2",buyer:false},{arr:TDS3,tag:"TDS3",buyer:true}].forEach(function(T){
    T.arr.forEach(function(r,i){
      if(!r||!tdsUsed(r)) return;
      const c=RG(r,"TaxDeductCreditDtls",{})||{};
      const lbl=T.tag+" row "+(i+1);

      /* A787 — year of tax deduction cannot be 0/null when TDS is brought forward. */
      A(787, !(N(r.BroughtFwdTDSAmt)>0) || (S0(r.DeductedYr)&&N(r.DeductedYr)>0),
        "Schedule "+lbl+": the year of tax deduction cannot be 0 or blank when there is TDS brought forward.");

      /* A789 — unclaimed TDS brought forward and current-FY TDS must be in different rows. */
      A(789, !(N(r.BroughtFwdTDSAmt)>0 && (N(c.TaxDeductedOwnHands)>0||N(c.TaxDeductedTDS)>0)),
        "Schedule "+lbl+": unclaimed TDS brought forward and TDS of the current financial year must be entered in different rows.");

      /* A790 — TDS credit claimed this year (col 9) cannot exceed the gross amount (col 11). */
      A(790, !(N(c.TaxClaimedOwnHands)>0) || N(c.TaxClaimedOwnHands) <= N(r.GrossAmount),
        "Schedule "+lbl+": TDS credit claimed this year (col 9) cannot be more than the gross amount disclosed (col 11).");

      /* A791/A792 — if TDS is claimed, the corresponding gross amount and head of income are mandatory. */
      A(T.buyer?792:791, !(N(c.TaxClaimedOwnHands)>0) || (S0(r.GrossAmount)&&S0(r.HeadOfIncome)),
        "Schedule "+lbl+": when TDS credit is claimed, the corresponding gross amount and head of income are mandatory.");

      /* A793 — TDS claimed cannot exceed TDS deducted on that person (16A / TDS2 only). */
      if(!T.buyer){
        A(793, N(c.TaxClaimedOwnHands) <= N(c.TaxDeductedOwnHands)+N(c.TaxDeductedTDS)+N(r.BroughtFwdTDSAmt),
          "Schedule "+lbl+": TDS claimed from the other person cannot exceed the TDS deducted on such person.");
      }

      /* A794 — "TDS credit relating to other person" selected but PAN of other person not provided. */
      A(794, r.TDSCreditName!=="O" || S0(r.PANofOtherPerson),
        "Schedule "+lbl+": TDS credit relating to another person is selected but the PAN of the other person is not provided.");

      /* A795 — other-person credit selected ⇒ TAN of deductor (16A) / PAN of tenant-buyer (16B/C/D) required. */
      A(795, r.TDSCreditName!=="O" || (T.buyer ? S0(r.PANOfBuyerTenant) : S0(r.TANOfDeductor)),
        "Schedule "+lbl+": when TDS credit relates to another person, the TAN of the deductor / PAN of the tenant or buyer must be filled.");

      /* A796 — the applicable dropdown in column 2 (credit relating to self/other) must be selected. */
      A(796, S0(r.TDSCreditName),
        "Schedule "+lbl+": the applicable dropdown in column 2 (TDS credit relating to self/other person) must be selected.");

      /* A797 — the applicable dropdown in column 4a (TDS section) must be selected. */
      A(797, S0(r.TDSSection),
        "Schedule "+lbl+": the applicable dropdown in column 4a (section under which tax is deducted) must be selected.");

      /* A798 — col 13 carried forward = col 6 + 7 + 8 − 9 − 10, floored at 0. */
      A(798, REQ(r.AmtCarriedFwd, Math.max(0, N(r.BroughtFwdTDSAmt)+N(c.TaxDeductedOwnHands)
          +N(c.TaxDeductedTDS)-N(c.TaxClaimedOwnHands)-N(c.TaxClaimedTDS))),
        "Schedule "+lbl+": TDS credit carried forward (col 13) must equal col 6 + 7 + 8 − 9 − 10.");
    });
  });

  /* ===================================================================
     SCHEDULE TCS. Column map:
       col 5   = BroughtFwdTCSAmt
       col 6   = TCSCurrFYDtls.TCSAmtCollOwnHands + TCSCurrFYDtls.TCSAmtCollOthrHands
       col 7(i)= TCSClaimedThisYearDtls.TCSAmtCollOwnHands           (claimed own hands)
       col 7   = 7(i) + TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TaxClaimedTCS
       col 8   = AmtCarriedFwd
     =================================================================== */
  const TCS=RG(I,"ScheduleTCS.TCSDetails",[])||[];
  const tcsClaimOwn=r=>N(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHands"));
  const tcsClaimOth=r=>N(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TaxClaimedTCS"));
  const tcsCollOwn=r=>N(RG(r,"TCSCurrFYDtls.TCSAmtCollOwnHands"));
  const tcsCollOth=r=>N(RG(r,"TCSCurrFYDtls.TCSAmtCollOthrHands"));
  const tcsUsed=r=>tcsClaimOwn(r)||tcsCollOwn(r)||tcsCollOth(r)||N(r.BroughtFwdTCSAmt);

  if(I.ScheduleTCS){
    /* A777 — 10c TCS = Σ col 7(i) "claimed in own hands" of Schedule TCS. */
    A(777, REQ(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.TCS"), TCS.reduce((a,r)=>a+tcsClaimOwn(r),0)),
      "Part B-TTI: TCS (10c) must equal the sum of col 7(i) (TCS claimed in own hands) of Schedule TCS.");

    /* A799 — total of col 7(i) "claimed in own hands" = sum of the individual rows. */
    A(799, REQ(RG(I,"ScheduleTCS.TotalSchTCS"), TCS.reduce((a,r)=>a+tcsClaimOwn(r),0)),
      "Schedule TCS: the total of col 7(i) (claimed in own hands) must equal the sum of the individual rows.");

    TCS.forEach(function(r,i){
      if(!r||!tcsUsed(r)) return;
      const lbl="TCS row "+(i+1);
      const det=RG(r,"EmployerOrDeductorOrCollectDetl",{})||{};

      /* A800 — unclaimed TCS brought forward and current-FY TCS cannot be in the same row. */
      A(800, !(N(r.BroughtFwdTCSAmt)>0 && (tcsCollOwn(r)>0||tcsCollOth(r)>0)),
        "Schedule "+lbl+": TCS brought forward and TCS collected in the current financial year cannot be entered in the same row.");

      /* A801 — TCS claimed (own + other hands) cannot exceed brought forward + collected (own + other). */
      A(801, tcsClaimOwn(r)+tcsClaimOth(r) <= N(r.BroughtFwdTCSAmt)+tcsCollOwn(r)+tcsCollOth(r),
        "Schedule "+lbl+": TCS claimed in own hands and in another person's hands cannot exceed TCS brought forward plus TCS collected in own and other hands.");

      /* A802 — other-person credit selected / claimed in another's hand but PAN not provided. */
      A(802, (det.TCSCreditName!=="O" || S0(det.PANofOtherPerson)) &&
             (!(tcsClaimOth(r)>0) || S0(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn"))),
        "Schedule "+lbl+": TCS credit relating to / claimed in another person's hands is selected but the PAN of the other person is not provided.");

      /* A803 — the applicable dropdown in column 2(i) (credit relating to self/other) must be selected. */
      A(803, S0(det.TCSCreditName),
        "Schedule "+lbl+": the applicable dropdown in column 2(i) (TCS credit relating to self/other person) must be selected.");

      /* A804 — the tax deduction & tax collection account number of the collector must be provided. */
      A(804, S0(det.TAN),
        "Schedule "+lbl+": the tax deduction and tax collection account number of the collector must be provided.");

      /* A805 — col 8 carried forward = col 5 + col 6 − col 7, floored at 0. */
      A(805, REQ(r.AmtCarriedFwd, Math.max(0, N(r.BroughtFwdTCSAmt)+tcsCollOwn(r)+tcsCollOth(r)
          -tcsClaimOwn(r)-tcsClaimOth(r))),
        "Schedule "+lbl+": TCS credit carried forward (col 8) must equal col 5 + col 6 − col 7.");
    });
  }

  /* ===================================================================
     SCHEDULE FA — A786: if any field of an entry (Sl. No. A1-A4, B, C, D,
     E, F, G) is filled, the remaining fields of that entry must also be
     filled. A row is "started" if any field is present; the minimal
     identifying key that must not be left blank is the country. Encoded as:
     a started row must carry its country code.
     =================================================================== */
  if(I.ScheduleFA){
    const FA=RG(I,"ScheduleFA",{})||{};
    Object.keys(FA).forEach(function(tbl){
      const rows=FA[tbl];
      if(!Array.isArray(rows)) return;
      rows.forEach(function(r,i){
        if(!r||typeof r!=="object") return;
        const started=Object.keys(r).some(function(k){const v=r[k];
          return v!=null && v!=="" && !(typeof v==="object");});
        if(!started) return;
        A(786, S0(r.CountryCodeExcludingIndia)||S0(r.CountryName),
          "Schedule FA ("+tbl+" row "+(i+1)+"): an entry is partly filled — the remaining mandatory fields of that entry (including the country) must also be filled.");
      });
    });
  }

  /* ===================================================================
     SCHEDULE 80G — donation details and their totals.
     =================================================================== */
  const CATS=[
    {k:"Don100Percent",           tot:"TotDon100Percent",         cash:"TotDon100PercentCash",         oth:"TotDon100PercentOtherMode"},
    {k:"Don50PercentNoApprReqd",  tot:"TotDon50PercentNoApprReqd", cash:"TotDon50PercentNoApprReqdCash", oth:"TotDon50PercentNoApprReqdOtherMode"},
    {k:"Don100PercentApprReqd",   tot:"TotDon100Percent",         cash:"TotDon100PercentApprReqdCash", oth:"TotDon100PercentApprReqdOtherMode"},
    {k:"Don50PercentApprReqd",    tot:"TotDon50PercentApprReqd",   cash:"TotDon50PercentApprReqdCash",   oth:"TotDon50PercentApprReqdOtherMode"}
  ];

  /* A806 — 80G deduction claimed in Sl. No. (a) of Schedule VI-A ⇒ Schedule 80G must be filled. */
  const clm80G=Math.max(N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80G")),
                        N(RG(I,"ScheduleVIA.UsrDeductUndChapVIA.Section80G")));
  A(806, clm80G<=0 || N(RG(I,"Schedule80G.TotalDonationsUs80G"))>0 || N(RG(I,"Schedule80G.TotalEligibleDonationsUs80G"))>0,
    "Schedule 80G: when a deduction u/s 80G is claimed in Sl. No. (a) of Schedule VI-A, the details in Schedule 80G are mandatory.");

  if(I.Schedule80G){
    const G8=RG(I,"Schedule80G",{})||{};
    const asPAN=U(RG(I,"PartA_GEN1.OrgFirmInfo.PAN"));
    const verPAN=U(RG(I,"Verification.Declaration.AssesseeVerPAN"));

    /* A807 (donee PAN ≠ assessee/verification PAN) & A809 (cash donation ≤ 2000)
       & A810 (per-category total = cash + other mode) — over all four categories. */
    CATS.forEach(function(cat){
      const blk=RG(G8,cat.k,{})||{};
      (RG(blk,"DoneeDetail",[])||[]).forEach(function(d,i){
        if(!d) return;
        const dp=U(d.DoneePAN);
        /* A807 */
        A(807, !S0(d.DoneePAN) || (dp!==asPAN && dp!==verPAN),
          "Schedule 80G ("+cat.k+" row "+(i+1)+"): the donee PAN cannot be the same as the assessee PAN or the PAN at verification.");
        /* A809 */
        A(809, N(d.DonationAmtCash) <= 2000,
          "Schedule 80G ("+cat.k+" row "+(i+1)+"): the amount donated in cash cannot exceed Rs. 2,000.");
      });
      /* A810 */
      A(810, REQ(blk[cat.tot], N(blk[cat.cash])+N(blk[cat.oth])),
        "Schedule 80G ("+cat.k+"): the total donation must equal the sum of donation in cash and donation in other mode.");
    });

    /* A808 — total eligible donations (E) cannot exceed total donations (E). */
    A(808, N(G8.TotalEligibleDonationsUs80G) <= N(G8.TotalDonationsUs80G)+1,
      "Schedule 80G: the total eligible amount of donations (E) cannot be more than the total donations (E).");

    /* A811 — total donations at E = sum of the four category totals (Aix + Bix + Cix + Dx). */
    A(811, REQ(G8.TotalDonationsUs80G,
        N(RG(G8,"Don100Percent.TotDon100Percent"))+N(RG(G8,"Don50PercentNoApprReqd.TotDon50PercentNoApprReqd"))
        +N(RG(G8,"Don100PercentApprReqd.TotDon100Percent"))+N(RG(G8,"Don50PercentApprReqd.TotDon50PercentApprReqd"))),
      "Schedule 80G: total donations at E must equal the sum of the totals at A, B, C and D.");

    /* A812 — deduction claimed u/s 80G cannot exceed the eligible amount of donations (E).
       (The eligible amount E is the qualifying ceiling for the deduction; a claim above
       it is a claim beyond the qualifying limit.) */
    A(812, clm80G <= N(G8.TotalEligibleDonationsUs80G)+1,
      "Schedule 80G: the deduction claimed u/s 80G cannot exceed the qualifying limit (the total eligible amount of donations, E).");
  }
});
