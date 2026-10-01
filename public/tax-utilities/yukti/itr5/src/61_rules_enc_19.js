/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 19.
   Serials 782–823 (books/ITR-5/rules.json): the Part B-TI total-income
   roll-up and the Part B-TTI tax-paid tie-outs, with their cross-links
   to Schedules HP, BP, CG, OS, CYLA, BFLA, VI-A, SI, EI, AMT, AMTC and
   IT/TDS/TCS.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Schema keys come from forms/ITR-5/src/70_sec_tax.js exp() — the Part B
   blocks are keyed "PartB-TI" (hyphen) and "PartB_TTI" — cross-checked
   against the source schedules' exp() (70_sec_hp / _bp / _cg / _os /
   _loss / _ded / _si / _ei / _amt / _paid).
   Every block guards to a no-op when its schedule is absent; nested reads
   go through RG (default 0) so nothing throws. Part B-TI items that are
   floored ("nil in case of loss") are compared with MAX(0,·) so the check
   is silent on a lawful loss return. Equality uses REQ (±1 tolerance).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const M0=x=>Math.max(0,N(x));                 /* floor at nil (loss → 0) */
  const rnd10=x=>Math.round(N(x)/10)*10;        /* round to the nearest ten */

  /* ===================================================================
     PART B-TI — computation of total income (782–815, 821)
     Block "PartB-TI": read each item via g("path") relative to the block.
     =================================================================== */
  if(I["PartB-TI"]){
    const TI=I["PartB-TI"];
    const g=(p)=>N(RG(TI,p,0));
    const CGp="CapGain.", OSp="IncFromOS.", BPp="ProfBusGain.", VIp="DeductionsUndSchVIADtl.";

    /* ---- 782: 3a(v) Total Short-term = 3ai + 3aii + 3aiii + 3aiv ---- */
    A(782,REQ(g(CGp+"ShortTerm.TotalShortTerm"),
        g(CGp+"ShortTerm.ShortTerm20Per")+g(CGp+"ShortTerm.ShortTerm30Per")+
        g(CGp+"ShortTerm.ShortTermAppRate")+g(CGp+"ShortTerm.ShortTermSplRateDTAA")),
      "Part B-TI: 3a(v) Total short-term capital gains must equal 3a(i) + 3a(ii) + 3a(iii) + 3a(iv).");
    /* ---- 783: 3b(iv/iii) Total Long-term = bi + bii ---- */
    A(783,REQ(g(CGp+"LongTerm.TotalLongTerm"),
        g(CGp+"LongTerm.LongTerm12_5Per")+g(CGp+"LongTerm.LongTermSplRateDTAA")),
      "Part B-TI: 3b Total long-term capital gains must equal 3b(i) + 3b(ii).");
    /* ---- 784: 3c Sum of ST & LT = 3a(v) + 3b(iii) (nil if loss) ---- */
    A(784,REQ(g(CGp+"ShortTermLongTermTotal"),
        M0(g(CGp+"ShortTerm.TotalShortTerm")+g(CGp+"LongTerm.TotalLongTerm"))),
      "Part B-TI: 3c (sum of short-term and long-term capital gains) must equal 3a(v) + 3b(iii), taken as nil if a loss.");
    /* ---- 785: 4d Total other sources = 4a + 4b + 4c (nil if loss) ---- */
    A(785,REQ(g(OSp+"TotIncFromOS"),
        M0(g(OSp+"OtherSrcThanOwnRaceHorse")+g(OSp+"IncChargblSplRate")+g(OSp+"FromOwnRaceHorse"))),
      "Part B-TI: 4d Total income from other sources must equal 4a + 4b + 4c, taken as nil if a loss.");
    /* ---- 786: 5 Total head-wise income = 1 + 2v + 3e + 4d ---- */
    A(786,REQ(g("TotalTI"),
        g("IncomeFromHP")+g(BPp+"TotProfBusGain")+g(CGp+"TotalCapGains")+g(OSp+"TotIncFromOS")),
      "Part B-TI: item 5 (total of head-wise income) must equal 1 + 2v + 3e + 4d.");
    /* ---- 798: 9 Gross total income = 7 − 8 (i.e. 5 − 6 − 8), nil if negative ---- */
    A(798,REQ(g("GrossTotalIncome"),
        M0(g("BalanceAfterSetoffLosses")-g("BroughtFwdLossesSetoff"))),
      "Part B-TI: item 9 (gross total income) must equal item 7 minus item 8 (5 − 6 − 8), taken as nil if negative.");
    /* ---- 800: 13 Total income = round-to-ten of MAX(0, 9 − 11c − 12) ---- */
    A(800,REQ(g("TotalIncome"),
        Math.max(0,rnd10(g("GrossTotalIncome")-g(VIp+"TotDeductUndSchVIA")-g("DeductionsUnder10Aor10AA")))),
      "Part B-TI: item 13 (total income) must equal gross total income minus the Chapter VI-A and 10AA deductions, rounded off to the nearest ten.");
    /* ---- 809: 11c Total Chapter VI-A = MIN(11a + 11b, MAX(0, 9 − 10)) ---- */
    A(809,REQ(g(VIp+"TotDeductUndSchVIA"),
        Math.min(g(VIp+"PartBchapterVIA")+g(VIp+"PartCchapterVIA"),
                 M0(g("GrossTotalIncome")-g("IncChargeTaxSplRate111A112")))),
      "Part B-TI: item 11(c) (total Chapter VI-A deduction) must equal 11a + 11b, limited to (9 − 10).");
    /* ---- 813: 7 Balance after current-year set-off = 5 − 6 (nil if negative) ---- */
    A(813,REQ(g("BalanceAfterSetoffLosses"),M0(g("TotalTI")-g("CurrentYearLoss"))),
      "Part B-TI: item 7 (balance after set-off of current-year losses) must equal item 5 minus item 6.");
    /* ---- 815: 3e Total capital gains = 3c + 3d ---- */
    A(815,REQ(g(CGp+"TotalCapGains"),
        g(CGp+"ShortTermLongTermTotal")+g(CGp+"CapGains30Per115BBH")),
      "Part B-TI: item 3e (total capital gains) must equal 3c (sum of ST/LT gains) + 3d (gain chargeable @30% u/s 115BBH).");

    /* ---- 799: if 10AA claimed at item 12 then Schedule 10AA must be filled ---- */
    A(799,!(g("DeductionsUnder10Aor10AA")>0)||!!I.Schedule10AA,
      "Part B-TI: a deduction u/s 10AA is claimed at item 12 but Schedule 10AA is not filled.");
    /* ---- 802: if Part-B Chapter VI-A claimed at 11a then Schedule VI-A must be filled ---- */
    A(802,!(g(VIp+"PartBchapterVIA")>0)||!!I.ScheduleVIA,
      "Part B-TI: a Part-B Chapter VI-A deduction is claimed at item 11a but Schedule VI-A is not filled.");
    /* ---- 803: if Part-C Chapter VI-A claimed at 11b then Schedule VI-A must be filled ---- */
    A(803,!(g(VIp+"PartCchapterVIA")>0)||!!I.ScheduleVIA,
      "Part B-TI: a Part-C Chapter VI-A deduction is claimed at item 11b but Schedule VI-A is not filled.");

    /* ---- 787: 1 House property = Sl.3 of Schedule HP (nil if loss) ---- */
    if(I.ScheduleHP)
      A(787,REQ(g("IncomeFromHP"),M0(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP",0))),
        "Part B-TI: item 1 (income from house property) must equal the income chargeable at Sl.3 of Schedule HP, taken as nil if a loss.");

    /* ---- 788/789/790/801: 2i/2ii/2iii/2iv against Schedule BP ---- */
    if(I.CorpScheduleBP){
      A(788,REQ(g(BPp+"ProfGainNoSpecBus"),
          M0(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C",0))),
        "Part B-TI: item 2(i) (business other than speculative/specified) must equal A37 of Schedule BP, taken as nil if a loss.");
      A(789,REQ(g(BPp+"ProfGainSpecBus"),
          M0(RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpeculativeInc.IncOfCurYrAfterSetOff",0))),
        "Part B-TI: item 2(ii) (speculative business) must equal E3(ii) of Table E of Schedule BP, taken as nil if a loss.");
      A(790,REQ(g(BPp+"ProfGainSpecifiedBus"),
          M0(RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpecifiedInc.IncOfCurYrAfterSetOff",0))),
        "Part B-TI: item 2(iii) (specified business) must equal E3(iii) of Table E of Schedule BP, taken as nil if a loss.");
      A(801,REQ(g(BPp+"IncChrgblTaxSplRate"),
          M0(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBF",0)+
             RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBG",0)+
             RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBH",0))),
        "Part B-TI: item 2(iv) (business income at special rate) must equal the sum of 3d + 3e + 3f (115BBF/115BBG/115BBH) of Schedule BP.");
    }

    /* ---- 791/792/811/812/814/817/818: capital-gains rows against Table E of Schedule CG ---- */
    if(I.ScheduleCG){
      const E="ScheduleCG.CurrYrLosses.";
      A(817,REQ(g(CGp+"ShortTerm.ShortTerm20Per"),RG(I,E+"InStcg20Per.CurrYrCapGain",0)),
        "Part B-TI: 3a(i) short-term chargeable @20% must equal 8(ii) of Table E of Schedule CG.");
      A(791,REQ(g(CGp+"ShortTerm.ShortTerm30Per"),RG(I,E+"InStcg30Per.CurrYrCapGain",0)),
        "Part B-TI: 3a(ii) short-term chargeable @30% must equal 8(iii) of Table E of Schedule CG.");
      A(792,REQ(g(CGp+"ShortTerm.ShortTermAppRate"),RG(I,E+"InStcgAppRate.CurrYrCapGain",0)),
        "Part B-TI: 3a(iii) short-term chargeable at applicable rate must equal 8(iv) of Table E of Schedule CG.");
      A(811,REQ(g(CGp+"ShortTerm.ShortTermSplRateDTAA"),RG(I,E+"InStcgDTAARate.CurrYrCapGain",0)),
        "Part B-TI: 3a(iv) short-term chargeable at special rates as per DTAA must equal 8(v) of Table E of Schedule CG.");
      A(818,REQ(g(CGp+"LongTerm.LongTerm12_5Per"),RG(I,E+"InLtcg12_5Per.CurrYrCapGain",0)),
        "Part B-TI: 3b(i) long-term chargeable @12.5% must equal 8(vi) of Table E of Schedule CG.");
      A(812,REQ(g(CGp+"LongTerm.LongTermSplRateDTAA"),RG(I,E+"InLtcgDTAARate.CurrYrCapGain",0)),
        "Part B-TI: 3b(ii) long-term chargeable at special rates as per DTAA must equal the DTAA long-term row of Table E of Schedule CG.");
      A(814,REQ(g(CGp+"CapGains30Per115BBH"),RG(I,"ScheduleCG.IncmFromVDATrnsf",0)),
        "Part B-TI: 3d (capital gain chargeable @30% u/s 115BBH) must equal C2 (income from transfer of VDA) of Schedule CG.");
    }

    /* ---- 793/794/795: other-sources rows against Schedule OS ---- */
    if(I.ScheduleOS){
      A(793,REQ(g(OSp+"OtherSrcThanOwnRaceHorse"),
          M0(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse",0))),
        "Part B-TI: item 4a (income other than from owning race horses) must equal item 6 of Schedule OS, taken as nil if a loss.");
      A(794,REQ(g(OSp+"IncChargblSplRate"),
          N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargeableSpecialRates",0))),
        "Part B-TI: item 4b (income chargeable at special rate) must equal item 2 of Schedule OS.");
      A(795,REQ(g(OSp+"FromOwnRaceHorse"),
          M0(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse",0))),
        "Part B-TI: item 4c (income from owning and maintaining race horses) must equal item 8e of Schedule OS, taken as nil if a loss.");
    }

    /* ---- 796: 6 Current-year loss set off = 2xvi + 3xvi + 4xvi of Schedule CYLA ---- */
    if(I.ScheduleCYLA)
      A(796,REQ(g("CurrentYearLoss"),
          RG(I,"ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff",0)+
          RG(I,"ScheduleCYLA.TotalLossSetOff.TotBusLossSetoff",0)+
          RG(I,"ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff",0)),
        "Part B-TI: item 6 (current-year losses set off) must equal the total of 2xvi, 3xvi and 4xvi of Schedule CYLA.");
    /* ---- 797: 8 Brought-forward loss set off = 2xv + 3xv + 4xv of Schedule BFLA ---- */
    if(I.ScheduleBFLA)
      A(797,REQ(g("BroughtFwdLossesSetoff"),
          RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff",0)+
          RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotUnabsorbedDeprSetoff",0)+
          RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotAllUs35cl4Setoff",0)),
        "Part B-TI: item 8 (brought-forward losses set off) must equal the total of 2xv, 3xv and 4xv of Schedule BFLA.");

    /* ---- 804: 12 Deduction u/s 10AA cannot exceed the Schedule 10AA total ---- */
    if(I.Schedule10AA)
      A(804,g("DeductionsUnder10Aor10AA")<=N(RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub",0))+1,
        "Part B-TI: the deduction u/s 10AA at item 12 cannot be more than the total deduction claimed in Schedule 10AA.");
    /* ---- 805: 15 Net agricultural income = 2v of Schedule EI when that exceeds ₹5,000 ---- */
    if(I.ScheduleEI){const ei2v=N(RG(I,"ScheduleEI.NetAgriIncOrOthrIncRule7",0));
      A(805,REQ(g("NetAgricultureIncomeOrOtherIncomeForRate"),ei2v>5000?ei2v:0),
        "Part B-TI: item 15 (net agricultural income for rate purposes) must equal Sl.2v of Schedule EI when that amount exceeds ₹5,000.");}
    /* ---- 806: 10 Income at special rate included in GTI = total income of Schedule SI ---- */
    if(I.ScheduleSI)
      A(806,REQ(g("IncChargeTaxSplRate111A112"),N(RG(I,"ScheduleSI.TotSplRateInc",0))),
        "Part B-TI: item 10 (income chargeable at special rates) must match the total of the income column of Schedule SI.");
    /* ---- 807/808: 11a/11b = Sl.1/Sl.2 of Schedule VI-A ---- */
    if(I.ScheduleVIA){
      A(807,REQ(g(VIp+"PartBchapterVIA"),N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartBchapterVIA",0))),
        "Part B-TI: item 11a (deduction under Chapter VI-A, Part B) must equal Sl.1 of Schedule VI-A.");
      A(808,REQ(g(VIp+"PartCchapterVIA"),N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA",0))),
        "Part B-TI: item 11b (deduction under Chapter VI-A, Part C) must equal Sl.2 of Schedule VI-A.");
    }
    /* ---- 810: 18 Deemed total income u/s 115JC = Sl.3 of Schedule AMT ---- */
    if(I.ScheduleAMT)
      A(810,REQ(g("DeemedTotIncSec115JC"),N(RG(I,"ScheduleAMT.AdjustedUnderSec115JC",0))),
        "Part B-TI: item 18 (deemed total income under section 115JC) must equal the adjusted total income at Sl.3 of Schedule AMT.");

    /* ---- 821: tax computed in Part B-TTI but the gross total income is nil ---- */
    if(I.PartB_TTI)
      A(821,!(N(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability",0))>0)||g("GrossTotalIncome")>0,
        "A tax computation is disclosed in Part B-TTI while the gross total income in Part B-TI is nil.");
  }

  /* ===================================================================
     PART B-TTI — computation of tax liability (819, 820, 822, 823)
     Block "PartB_TTI"; the tax ladder sits under ComputationOfTaxLiability.
     =================================================================== */
  if(I.PartB_TTI){
    const c=(p)=>N(RG(I,"PartB_TTI.ComputationOfTaxLiability."+p,0));
    const paid=(p)=>N(RG(I,"PartB_TTI.TaxPaid.TaxesPaid."+p,0));

    /* ---- 823 (second limb): 1d Total tax on deemed total income = 1a + 1b + 1c ---- */
    A(823,REQ(c("TaxPayableOnDeemedTI.TotalTax"),
        c("TaxPayableOnDeemedTI.TaxDeemedTISec115JC")+c("TaxPayableOnDeemedTI.Surcharge")+c("TaxPayableOnDeemedTI.EducationCess")),
      "Part B-TTI: item 1d (total tax payable on deemed total income) must equal 1a + 1b + 1c.");

    /* ---- 819: 1a Tax on deemed total income u/s 115JC = Sl.4 of Schedule AMT ---- */
    if(I.ScheduleAMT)
      A(819,REQ(c("TaxPayableOnDeemedTI.TaxDeemedTISec115JC"),N(RG(I,"ScheduleAMT.TaxPayableUnderSec115JC",0))),
        "Part B-TTI: item 1a (tax payable on deemed total income under section 115JC) must equal Sl.4 of Schedule AMT.");
    /* ---- 820: 4 Credit u/s 115JD = Sl.5 of Schedule AMTC (only when 2g > 1d) ---- */
    if(I.ScheduleAMTC)
      A(820,!(c("TaxPayableOnTI.GrossTaxLiability")>c("TaxPayableOnDeemedTI.TotalTax"))
           ||REQ(c("CreditUS115JD"),N(RG(I,"ScheduleAMTC.TaxSection115JD",0))),
        "Part B-TTI: item 4 (credit u/s 115JD of tax paid in earlier years) must equal Sl.5 of Schedule AMTC when 2g exceeds 1d.");

    /* ---- 822 (first limb): 10a + 10d = total of Schedule IT ---- */
    if(I.ScheduleIT)
      A(822,REQ(paid("AdvanceTax")+paid("SelfAssessmentTax"),N(RG(I,"ScheduleIT.TotalTaxPayments",0))),
        "Part B-TTI: 10a (advance tax) plus 10d (self-assessment tax) must equal the total tax paid in Schedule IT.");
    /* ---- 822 (second limb): 10b TDS = total claimed of Schedule TDS(1) + TDS(2) ---- */
    if(I.ScheduleTDS2||I.ScheduleTDS3)
      A(822,REQ(paid("TDS"),
          N(RG(I,"ScheduleTDS2.TotalTDSonOthThanSals",0))+N(RG(I,"ScheduleTDS3.TotalTDS3OnOthThanSal",0))),
        "Part B-TTI: item 10b (TDS) must equal the total claimed in Schedule TDS(1) and Schedule TDS(2).");
    /* ---- 823 (first limb): 10c TCS = total of Schedule TCS ---- */
    if(I.ScheduleTCS)
      A(823,REQ(paid("TCS"),N(RG(I,"ScheduleTCS.TotalSchTCS",0))),
        "Part B-TTI: item 10c (TCS) must equal the total in Schedule TCS.");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     816 — Part B-TTI, tax payable u/s 115TD after adjustment of refund
           at Sl.14 = Sl.13 − Sl.12. The Part B-TTI section (70_sec_tax.js)
           exports no section-115TD tax ladder (accreted-income tax of a
           trust is Schedule 115TD, owned by the "other" section, and the
           Part B-TTI 115TD sub-block with Sl.12/13/14 is not represented
           in this form's schema export). With no schema field to read, the
           assertion is not offline-checkable. Left to the 115TD schedule's
           own audit.
     ------------------------------------------------------------------ */
});
