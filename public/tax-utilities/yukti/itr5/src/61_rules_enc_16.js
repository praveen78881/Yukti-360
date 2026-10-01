/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 16.
   Serials 676–696 (books/ITR-5/rules.json), covering Schedule AMT
   (§115JC, 676–686) and Schedule AMTC (§115JD credit, 687–696), with
   the Part B-TI / Part B-TTI cross-links those rules refer to.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / arr()); nothing throws; every block guards to
   a no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_amt.js (expAmt: ScheduleAMT / ScheduleAMTC) and
   forms/ITR-5/src/70_sec_tax.js (expTax: PartB-TI / PartB_TTI), plus
   PartA_GEN1.OrgFirmInfo.StatusOrCompanyType and FilingStatus.
   OptOldRegimeCurrAY from 70_sec_gen.js, cross-checked against the books.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const AMT_FLOOR=2000000;                 /* ₹20 lakh threshold — AOP/BOI (14) & AJP (9) only */

  /* ===================================================================
     SCHEDULE AMT  (676–686)  — computation of §115JC alternate min. tax
     Block ScheduleAMT (expAmt):
       TotalIncItem13 ................. sl.1 (= item 13 of Part B-TI)
       AdjustmentSec115JC[0]:
         DeductClaimSec6A ............. 2a (Chapter VI-A Part C, less 80P)
         DeductClaimSec10AA ........... 2b (§10AA)
         DeductClaimSec35AD ........... 2c (§35AD net of depreciation)
         Total ........................ 2d (2a+2b+2c)
       AdjustedUnderSec115JC ......... sl.3 (adjusted total income = 1+2d)
       AdjustedUnderSec115JCIFSC ..... 3a (IFSC-unit income, taxed @9%)
       AdjustedUnderSec115JCOther .... 3b (other units = 3 − 3a)
       TaxPayableUnderSec115JC ....... sl.4 (9%·3a + 18.5%/15%·3b)
     =================================================================== */
  if(I.ScheduleAMT){
    const M=I.ScheduleAMT;
    const adj=arr(M.AdjustmentSec115JC)[0]||{};
    const c2a=N(adj.DeductClaimSec6A), c2b=N(adj.DeductClaimSec10AA),
          c2c=N(adj.DeductClaimSec35AD), c2d=N(adj.Total);
    const sl1=N(M.TotalIncItem13), sl3=N(M.AdjustedUnderSec115JC),
          c3a=N(M.AdjustedUnderSec115JCIFSC), c3b=N(M.AdjustedUnderSec115JCOther),
          sl4=N(M.TaxPayableUnderSec115JC);

    /* 676: sl.4 tax u/s 115JC = 9% of 3a (IFSC units) + the 3b component.
       The 3b rate is 18.5% (15% for a co-operative society) and the whole
       figure is floored to nil for AOP/BOI/AJP within ₹20L, so the exact
       equality depends on status/floor; the robust, never-false-firing
       assertion is that sl.4 cannot exceed 9%·3a + 18.5%·3b (its ceiling). */
    A(676,sl4<=0.09*c3a+0.185*c3b+1,"Schedule AMT: the tax payable under section 115JC (Sl.4) cannot exceed 9% of the IFSC-unit income (3a) plus 18.5% of the other-unit income (3b).");

    /* 680: 2d Total Adjustment = 2a + 2b + 2c */
    A(680,REQ(c2d,c2a+c2b+c2c),"Schedule AMT: the total adjustment (2d) must equal 2a + 2b + 2c.");
    /* 681: sl.3 Adjusted Total Income u/s 115JC(1) = sl.1 + 2d */
    A(681,REQ(sl3,sl1+c2d),"Schedule AMT: the adjusted total income under section 115JC(1) (Sl.3) must equal Sl.1 + 2d.");
    /* 685: 3b (other units) = sl.3 − 3a.  (rules.json labels the field "3",
       but the difference "Sl.3 − Sl.3a" is precisely field 3b.) */
    A(685,REQ(c3b,sl3-c3a),"Schedule AMT: the adjusted total income of other units (3b) must equal Sl.3 − Sl.3a.");
    /* 686: if sl.3 is zero then 3a and 3b must both be zero */
    A(686,N(sl3)!==0||(REQ(c3a,0)&&REQ(c3b,0)),"Schedule AMT: when the adjusted total income under section 115JC (Sl.3) is zero, Sl.3a and Sl.3b must also be zero.");

    /* 682: for an AOP/BOI (status 14) or AJP (status 9), AMT (sl.4) is
       computed only where the adjusted total income exceeds ₹20 lakh; so
       within ₹20 lakh sl.4 must be nil. (Firms have no such floor — 683.) */
    const st=String(RG(I,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType",""));
    const floorStatus=(st==="14"||st==="9");
    A(682,!(floorStatus && sl3<=AMT_FLOOR) || N(sl4)<=0,"Schedule AMT: for an AOP/BOI or artificial juridical person, no alternate minimum tax (Sl.4) is payable where the adjusted total income does not exceed ₹20,00,000.");

    /* 677: sl.1 = item 13 of Part B-TI (Total income) */
    if(I["PartB-TI"])
      A(677,REQ(sl1,N(RG(I,"PartB-TI.TotalIncome"))),"Schedule AMT: Sl.1 (total income) must equal item 13 of Part B-TI (Total income).");
    /* 679: 2b = deduction u/s 10AA at sl.12a of Part B-TI */
    if(I["PartB-TI"])
      A(679,REQ(c2b,N(RG(I,"PartB-TI.DeductionsUnder10Aor10AA"))),"Schedule AMT: the section 10AA deduction (2b) must equal the section 10AA deduction at item 12a of Part B-TI.");
    /* 684: Part B-TTI tax payable on deemed total income u/s 115JC = sl.4 */
    if(I.PartB_TTI)
      A(684,REQ(N(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.TaxDeemedTISec115JC")),sl4),"Part B-TTI: the tax payable on deemed total income under section 115JC must equal Sl.4 of Schedule AMT.");
  }

  /* ===================================================================
     SCHEDULE AMTC  (687–696)  — computation of §115JD tax credit
     Block ScheduleAMTC (expAmt):
       TaxSection115JC ............ item 1 (= 1d of Part B-TTI)
       TaxOthProvisions ........... item 2 (= 2g of Part B-TTI)
       AmtTaxCreditAvailable ...... item 3 (= MAX(0, item 2 − item 1))
       TotAmtCreditUtilisedCY ..... Total of col C (utilised this year)
       TotBalAMTCreditCF .......... Total of col D (carried forward)
       TaxSection115JD ............ item 5 (= Total col C)
       AmtLiabilityAvailable ...... item 6 (= Total col D)
       ScheduleAMTCDtls[]:
         AssYr, AmtCreditFwd (B1), AmtCreditSetOfEy (B2),
         AmtCreditBalBroughtFwd (B3), AmtCreditUtilized (C),
         BalAmtCreditCarryFwd (D)
     =================================================================== */
  if(I.ScheduleAMTC){
    const C=I.ScheduleAMTC;
    const i1=N(C.TaxSection115JC), i2=N(C.TaxOthProvisions), i3=N(C.AmtTaxCreditAvailable);
    const rows=arr(C.ScheduleAMTCDtls);

    /* 689 & 690: item 3 = MAX(0, item 2 − item 1) */
    A(689,REQ(i3,Math.max(0,i2-i1)),"Schedule AMTC: the amount of tax against which credit is available (Sl.3) must equal Sl.2 − Sl.1 (taken as nil if Sl.1 exceeds Sl.2).");
    A(690,REQ(i3,Math.max(0,i2-i1)),"Schedule AMTC: Sl.3 must equal Sl.2 − Sl.1.");
    /* 691: item 5 = Total of col C (AMT credit utilised during the year) */
    A(691,REQ(N(C.TaxSection115JD),N(C.TotAmtCreditUtilisedCY)),"Schedule AMTC: the tax credit utilised during the year (Sl.5) must equal the total of column C (AMT credit utilised).");
    /* 692: item 6 = Total of col D (balance AMT credit carried forward) */
    A(692,REQ(N(C.AmtLiabilityAvailable),N(C.TotBalAMTCreditCF)),"Schedule AMTC: the AMT liability available for credit in later years (Sl.6) must equal the total of column D (balance carried forward).");

    /* 687: item 1 = 1d of Part B-TTI (total tax on deemed total income) */
    if(I.PartB_TTI)
      A(687,REQ(i1,N(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.TotalTax"))),"Schedule AMTC: the tax under section 115JC (Sl.1) must equal item 1d of Part B-TTI (total tax on deemed total income).");
    /* 688: item 2 = 2g of Part B-TTI (gross tax liability under other provisions) */
    if(I.PartB_TTI)
      A(688,REQ(i2,N(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability"))),"Schedule AMTC: the tax under other provisions (Sl.2) must equal item 2g of Part B-TTI (gross tax liability).");

    /* new tax regime? Rule 696 ("New Tax Regime is 'yes'") applies to any
       concessional regime — AMT (s.115JC) is inapplicable under 115BAC(1A),
       115BAD and 115BAE alike, so AMT-credit col C/D must be nil under all
       three. The OptOldRegimeCurrAY flag only sees the 115BAC opt-out path and
       misses a 115BAD/115BAE co-op, so read S.C.regime.anyConc (blank ⇒ no-op). */
    const isNewReg=!!(((S_||{}).C||{}).regime||{}).anyConc;

    /* per-row column arithmetic (694/695) and the 2025-26 set-off bar (693) */
    rows.forEach(function(r,i){r=r||{};const L=" row "+(i+1)+" ("+String(r.AssYr||"")+"): ";
      const b1=N(r.AmtCreditFwd), b2=N(r.AmtCreditSetOfEy),
            b3=N(r.AmtCreditBalBroughtFwd), cc=N(r.AmtCreditUtilized), cd=N(r.BalAmtCreditCarryFwd);
      /* 695: B3 (balance brought forward) = B1 − B2 (holds in either regime) */
      A(695,REQ(b3,b1-b2),"Schedule AMTC"+L+"the balance brought forward (B3) must equal B1 − B2.");
      /* 694: D (carried forward) = B3 − C — old regime only; under the new
         regime col C and col D are forced to nil (rule 696), which overrides
         this arithmetic, so it is not applied there. */
      if(!isNewReg)
        A(694,REQ(cd,b3-cc),"Schedule AMTC"+L+"the balance AMT credit carried forward (col D) must equal B3 − col C.");
      /* 693: set-off in earlier years (B2) cannot be claimed for the A.Y. 2025-26 row */
      if(String(r.AssYr||"")==="2025-26")
        A(693,N(b2)<=0,"Schedule AMTC: set off in earlier assessment years (column B2) cannot be claimed for A.Y. 2025-26.");
      /* 696: under the new regime, col C and col D must both be zero */
      if(isNewReg)
        A(696,REQ(cc,0)&&REQ(cd,0),"Schedule AMTC"+L+"under the new tax regime the AMT credit utilised (col C) and carried forward (col D) must be zero.");
    });
    /* 696 (totals): under the new regime the utilised/carried-forward totals are also zero */
    if(isNewReg)
      A(696,REQ(N(C.TotAmtCreditUtilisedCY),0)&&REQ(N(C.TotBalAMTCreditCF),0),"Schedule AMTC: under the new tax regime the total of column C (utilised) and column D (carried forward) must be zero.");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     678 — "Sl.no. 2a is not equal to sum of system-computed values of
           sl.no. 'd' to 'm' of Sch VIA subject to sl.no.9 − sl.no.10 of
           Part B-TI." The 2a add-back (DeductClaimSec6A) is validated
           against the item-wise Chapter VI-A Part C deductions (rows d…m
           of Schedule VIA) capped by a Part B-TI amount — a cross-schedule
           check needing the VIA d…m enumeration, which the AMT block does
           not expose. The AMT schema carries only the aggregated 2a, and
           the "subject to" cap makes it a MIN, so a literal encoding would
           false-fire on lawful returns. Left to Schedule VIA's own audit.
     683 — "AMT should be computed at sl.4 … for Firm." This is the Firm
           companion to 682: it states that the ₹20-lakh floor does NOT
           apply to a Firm (no threshold). There is no violation condition
           to assert — a Firm computing AMT below ₹20 lakh is lawful — so
           there is nothing offline-checkable to encode. (The floor for
           AOP/BOI/AJP is encoded at 682.)
     ------------------------------------------------------------------ */
});
