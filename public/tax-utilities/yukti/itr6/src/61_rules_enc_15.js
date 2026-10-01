/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_15 (Phase 6).
   Serial range A710–A759:
     A710–A713  Schedule TR (ScheduleTR1)  — foreign tax relief cross-checks
     A714–A715  Schedule GST (ScheduleGST) — GSTIN / turnover pairing
     A716–A754  Part B-TI  ("PartB-TI", hyphen) — head totals, cross-schedule
                consistency (Sch BP/CG/OS/SI/MAT/EI/CYLA/BFLA/CFL/VIA/10AA/HP)
     A755–A759  Part B-TTI (PartB_TTI) — tax-on-total-income roll-up & TR relief
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG / N /
   REQ / (X||{})); nothing throws. Keys are the built-return ITR6 schema
   paths, taken from the built sections (70_sec_tax = PartB-TI/PartB_TTI,
   70_sec_fa = FSI/TR1, 70_sec_other = GST, 70_sec_bp = CorpScheduleBP,
   70_sec_cg/os/si/mat/ei/loss/ded/hp/paid) and verified against
   sources/ITR-6 schema. Encoded from each rule's own text (constitution
   rule 6). Census: every serial A710–A759 is ENF (none NA/OFFLINE).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */

  /* =====================================================================
     Schedule TR (ScheduleTR1) — foreign-tax relief.
     ===================================================================== */
  if(I.ScheduleTR1){
    const TR=RG(I,"ScheduleTR1",{})||{};
    const trRows=RG(TR,"ScheduleTR",[])||[];

    /* A710 — Sl.2 + Sl.3 (relief DTAA + relief non-DTAA) must equal the sum
       total of column 1d (total tax relief available outside India). */
    A(710, REQ(N(TR.TaxReliefOutsideIndiaDTAA)+N(TR.TaxReliefOutsideIndiaNotDTAA),
               TR.TotalTaxReliefOutsideIndia),
      "Schedule TR: Sl. No. 2 + 3 must equal the sum total of column 1d (total tax relief available outside India).");

    /* A711 — Schedule TR is not applicable for a non-resident company. */
    A(711, RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus","")!=="NRI",
      "Schedule TR: Schedule TR is not applicable for non-residents.");

    /* Per-country totals of Schedule FSI (Col C = tax paid, Col E = relief). */
    const fsiPaid={}, fsiRelief={};
    (RG(I,"ScheduleFSI.ScheduleFSIDtls",[])||[]).forEach(function(cr){
      if(!cr)return; const cc=cr.CountryCodeExcludingIndia; if(!S0(cc))return;
      const t=RG(cr,"TotalCountryWise",{})||{};
      fsiPaid[cc]=(fsiPaid[cc]||0)+N(t.TaxPaidOutsideInd);
      fsiRelief[cc]=(fsiRelief[cc]||0)+N(t.TaxReliefinInd);
    });

    /* A712 — Col C (total taxes paid outside India) must equal the total of
       Col. C of Schedule FSI for each country. */
    trRows.forEach(function(r){
      if(!r)return; const cc=r.CountryCodeExcludingIndia;
      A(712, REQ(r.TaxPaidOutsideIndia, fsiPaid[cc]||0),
        "Schedule TR: Col C (total taxes paid outside India) for country "+(S0(cc)?cc:"?")+
        " must equal the total of Col. C of Schedule FSI for that country.");
    });

    /* A713 — Col d (total tax relief available) must equal the total of
       Col. E of Schedule FSI for each country. */
    trRows.forEach(function(r){
      if(!r)return; const cc=r.CountryCodeExcludingIndia;
      A(713, REQ(r.TaxReliefOutsideIndia, fsiRelief[cc]||0),
        "Schedule TR: Col d (total tax relief available) for country "+(S0(cc)?cc:"?")+
        " must equal the total of Col. E of Schedule FSI for that country.");
    });
  }

  /* =====================================================================
     Schedule GST (ScheduleGST) — GSTIN / annual-turnover pairing.
     ===================================================================== */
  if(I.ScheduleGST){
    (RG(I,"ScheduleGST.TurnoverGrsRcptForGSTIN",[])||[]).forEach(function(r,i){
      if(!r)return;
      /* A714 — GSTIN filled ⇒ annual value of outward supplies mandatory. */
      A(714, !S0(r.GSTINNo) || S0(r.AmtTurnGrossRcptGSTIN),
        "Schedule GST: row "+(i+1)+" — when GSTIN No. is filled the 'Annual Value of Outward Supplies as per the GST Return Filed' is mandatory.");
      /* A715 — annual value filled ⇒ GSTIN mandatory. */
      A(715, !S0(r.AmtTurnGrossRcptGSTIN) || S0(r.GSTINNo),
        "Schedule GST: row "+(i+1)+" — when 'Annual Value of Outward Supplies as per the GST Return Filed' is filled the GSTIN No. is mandatory.");
    });
  }

  /* =====================================================================
     Part B-TI ("PartB-TI", hyphen).
     ===================================================================== */
  if(I["PartB-TI"]){
    const PB=RG(I,"PartB-TI",{})||{};
    const BG=RG(PB,"ProfBusGain",{})||{};
    const CGp=RG(PB,"CapGain",{})||{};
    const ST=RG(CGp,"ShortTerm",{})||{};
    const LT=RG(CGp,"LongTerm",{})||{};
    const OSp=RG(PB,"IncFromOS",{})||{};
    const VIAp=RG(PB,"DeductionsUndSchVIADtl",{})||{};

    const gti=N(PB.GrossTotalIncome);
    const splInc=N(PB.IncChargeTaxSplRate111A112);   /* item 10 */
    const splCalc=N(PB.IncChargeableTaxSplRates);    /* item 14 */
    const viaTot=N(VIAp.TotDeductUndSchVIA);         /* item 11c */
    const us10AA=N(PB.DeductionsUnder10Aor10AA);     /* item 12 */

    /* A716 — 2v Total = 2i + 2ia + 2ii + 2iii + 2iv. */
    A(716, REQ(BG.TotProfBusGain, N(BG.ProfGainNoSpecBus)+N(BG.IncmForeignCompRule10TIA)
        +N(BG.ProfGainSpecBus)+N(BG.ProfGainSpecifiedBus)+N(BG.IncChrgblTaxSplRate)),
      "Part B-TI: '2v' Total must equal 2i + 2ia + 2ii + 2iii + 2iv.");

    /* A717 — 3a(v) Total Short-term = ai + aii + aiii + aiv. */
    A(717, REQ(ST.TotalShortTerm, N(ST.ShortTerm20Per)+N(ST.ShortTerm30Per)
        +N(ST.ShortTermAppRate)+N(ST.ShortTermSplRateDTAA)),
      "Part B-TI: '3a(v)' Total Short-term must equal 3ai + 3aii + 3aiii + 3aiv.");

    /* A718 — 3b(iii) Total Long-term = bi + bii. */
    A(718, REQ(LT.TotalLongTerm, N(LT.LongTerm12_5Per)+N(LT.LongTermSplRateDTAA)),
      "Part B-TI: '3b(iii)' Total Long-term must equal 3bi + 3bii.");

    /* A719 — 3c Total capital gains = 3av + 3biii. */
    A(719, REQ(CGp.ShortTermLongTermTotal, N(ST.TotalShortTerm)+N(LT.TotalLongTerm)),
      "Part B-TI: '3c' (sum of short-term/long-term capital gains) must equal 3av + 3biii.");

    /* A720 — 4d Total = 4a + 4b + 4c. */
    A(720, REQ(OSp.TotIncFromOS, N(OSp.OtherSrcThanOwnRaceHorse)+N(OSp.IncChargblSplRate)
        +N(OSp.FromOwnRaceHorse)),
      "Part B-TI: '4d' Total must equal 4a + 4b + 4c.");

    /* A721 — 5 Total = 1 + 2v + 3e + 4d. */
    A(721, REQ(PB.TotalTI, N(PB.IncomeFromHP)+N(BG.TotProfBusGain)
        +N(CGp.TotalCapGains)+N(OSp.TotIncFromOS)),
      "Part B-TI: Sl. No. 5 (Total) must equal 1 + 2v + 3e + 4d.");

    /* A722 — 2i = A38 of Schedule BP. */
    A(722, REQ(BG.ProfGainNoSpecBus, RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C",0)),
      "Part B-TI: '2i' (profits/gains from business other than speculative/specified) must equal A38 of Schedule BP.");

    /* A723–A728 — STCG/LTCG rows: if >0, Table E of Schedule CG is mandatory
       and the amount must equal Item E row 8 (current year's gain remaining
       after set off) of the matching category. */
    const CGE=RG(I,"ScheduleCG.CurrYrLosses",{})||{};
    A(723, N(ST.ShortTerm20Per)<=0 || (I.ScheduleCG && REQ(ST.ShortTerm20Per, RG(CGE,"InStcg20Per.CurrYrCapGain",0))),
      "Part B-TI: '3ai' short-term @20% requires Table E of Schedule CG and must equal 8ii of item E of Schedule CG.");
    A(724, N(ST.ShortTerm30Per)<=0 || (I.ScheduleCG && REQ(ST.ShortTerm30Per, RG(CGE,"InStcg30Per.CurrYrCapGain",0))),
      "Part B-TI: '3aii' short-term @30% requires Table E of Schedule CG and must equal 8iii of item E of Schedule CG.");
    A(725, N(ST.ShortTermAppRate)<=0 || (I.ScheduleCG && REQ(ST.ShortTermAppRate, RG(CGE,"InStcgAppRate.CurrYrCapGain",0))),
      "Part B-TI: '3aiii' STCG at applicable rate requires Table E of Schedule CG and must equal 8iv of item E of Schedule CG.");
    A(726, N(ST.ShortTermSplRateDTAA)<=0 || (I.ScheduleCG && REQ(ST.ShortTermSplRateDTAA, RG(CGE,"InStcgDTAARate.CurrYrCapGain",0))),
      "Part B-TI: '3aiv' STCG at special rates as per DTAA requires Table E of Schedule CG and must equal 8v of item E of Schedule CG.");
    A(727, N(LT.LongTerm12_5Per)<=0 || (I.ScheduleCG && REQ(LT.LongTerm12_5Per, RG(CGE,"InLtcg12_5Per.CurrYrCapGain",0))),
      "Part B-TI: '3bi' long-term @12.5% requires Table E of Schedule CG and must equal 8vi of item E of Schedule CG.");
    A(728, N(LT.LongTermSplRateDTAA)<=0 || (I.ScheduleCG && REQ(LT.LongTermSplRateDTAA, RG(CGE,"InLtcgDTAARate.CurrYrCapGain",0))),
      "Part B-TI: '3biii' LTCG at special rates as per DTAA requires Table E of Schedule CG and must equal 8vii of item E of Schedule CG.");

    /* A729 — 4a > 0 ⇒ Schedule OS mandatory and 4a = Sl. 6 of Schedule OS. */
    A(729, N(OSp.OtherSrcThanOwnRaceHorse)<=0 ||
        (I.ScheduleOS && REQ(OSp.OtherSrcThanOwnRaceHorse, RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse",0))),
      "Part B-TI: '4a' requires Schedule OS to be filled and must equal Sl. No. 6 of Schedule OS.");

    /* A730 — 4b > 0 ⇒ Schedule OS mandatory and 4b = Sl. 2 of Schedule OS. */
    A(730, N(OSp.IncChargblSplRate)<=0 ||
        (I.ScheduleOS && REQ(OSp.IncChargblSplRate, RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargeableSpecialRates",0))),
      "Part B-TI: '4b' requires Schedule OS to be filled and must equal Sl. No. 2 of Schedule OS.");

    /* A731 — 4c > 0 ⇒ Schedule OS mandatory and 4c = Sl. 8e of Schedule OS. */
    A(731, N(OSp.FromOwnRaceHorse)<=0 ||
        (I.ScheduleOS && REQ(OSp.FromOwnRaceHorse, RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse",0))),
      "Part B-TI: '4c' requires Schedule OS to be filled and must equal Sl. No. 8e of Schedule OS.");

    /* A732 — 6 Losses of current year set off = 2xvi + 3xvi + 4xvi of Sch CYLA. */
    const CYT=RG(I,"ScheduleCYLA.TotalLossSetOff",{})||{};
    A(732, REQ(PB.CurrentYearLoss, N(CYT.TotHPlossCurYrSetoff)+N(CYT.TotBusLossSetoff)+N(CYT.TotOthSrcLossNoRaceHorseSetoff)),
      "Part B-TI: Sl. No. 6 (losses of current year set off) must equal the total of 2xvi, 3xvi and 4xvi of Schedule CYLA.");

    /* A733 — 8 Brought forward losses set off = 2xv + 3xv + 4xv of Sch BFLA. */
    const BFT=RG(I,"ScheduleBFLA.TotalBFLossSetOff",{})||{};
    A(733, REQ(PB.BroughtFwdLossesSetoff, N(BFT.TotBFLossSetoff)+N(BFT.TotUnabsorbedDeprSetoff)+N(BFT.TotAllUs35cl4Setoff)),
      "Part B-TI: Sl. No. 8 (brought-forward losses set off) must equal the total of 2xv, 3xv and 4xv of Schedule BFLA.");

    /* A734 — 9 GTI = 5 − 6 − 8, restricted to zero if negative. */
    A(734, REQ(gti, Math.max(0, N(PB.TotalTI)-N(PB.CurrentYearLoss)-N(PB.BroughtFwdLossesSetoff))),
      "Part B-TI: Gross Total Income (Sl. No. 9) must equal head-wise total (5) − current-year losses set off (6) − brought-forward losses set off (8), restricted to zero if negative.");

    /* A735 — deduction u/s 10AA claimed ⇒ Schedule 10AA must be filled. */
    A(735, us10AA<=0 || !!I.Schedule10AA,
      "Part B-TI: when deduction u/s 10AA is claimed, Schedule 10AA must be filled.");

    /* A736 — 13 Total Income = round-off of MAX(0, GTI − Chapter VI-A − 10AA). */
    A(736, REQ(PB.TotalIncome, Math.max(0, Math.round((gti-viaTot-us10AA)/10)*10), 10),
      "Part B-TI: Total Income (13) must equal GTI minus Chapter VI-A deductions and deduction u/s 10AA, after rounding-off.");

    /* A737 — deduction at 11b claimed ⇒ Schedule VI-A Part C must be filled. */
    A(737, N(VIAp.PartCchapterVIA)<=0 ||
        (I.ScheduleVIA && N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA",0))>0),
      "Part B-TI: when a deduction is claimed at Sl. No. 11b, Schedule VI-A Part C must be filled.");

    /* A738 — 12 deduction u/s 10AA = Schedule 10AA total, capped at 9 − 10 − 11c. */
    A(738, REQ(us10AA, RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub",0)) &&
        us10AA <= Math.max(0, gti-splInc-viaTot)+1,
      "Part B-TI: deduction u/s 10AA must be consistent with Schedule 10AA and cannot exceed Sl. No. 9 − 10 − 11c of Part B-TI.");

    /* A739 — 16 Net agricultural / other income for rate = Sl. 2v of Schedule EI. */
    A(739, REQ(PB.NetAgricultureIncomeOrOtherIncomeForRate, RG(I,"ScheduleEI.NetAgriIncOrOthrIncRule7",0)),
      "Part B-TI: Sl. No. 16 (net agricultural income / other income for rate purpose) must equal Sl. No. 2v of Schedule EI.");

    /* A740 — 11b Chapter VI-A Part C = Sl. No. 2 of Schedule VI-A. */
    A(740, REQ(VIAp.PartCchapterVIA, RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA",0)),
      "Part B-TI: Chapter VI-A Part-C deduction must equal Sl. No. 2 of Schedule VI-A.");

    /* A741 — 11c Total (11a + 11b) = 11a + 11b, limited to 9 − 10. */
    A(741, REQ(viaTot, Math.min(N(VIAp.PartBchapterVIA)+N(VIAp.PartCchapterVIA), Math.max(0, gti-splInc))),
      "Part B-TI: '11(c)' Total must equal 11a + 11b, limited to Sl. No. 9 − 10.");

    /* A742 — 2ii Profits/gains from speculative business = E3(ii) of Table E, Sch BP. */
    A(742, REQ(BG.ProfGainSpecBus, RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpeculativeInc.IncOfCurYrAfterSetOff",0)),
      "Part B-TI: '2ii' (profits/gains from speculative business) must equal E3(ii) at Table E of Schedule BP.");

    /* A743 — 2iii Profits/gains from specified business = E3(iii) of Table E, Sch BP. */
    A(743, REQ(BG.ProfGainSpecifiedBus, RG(I,"CorpScheduleBP.BusSetoffCurrYr.SpecifiedInc.IncOfCurYrAfterSetOff",0)),
      "Part B-TI: '2iii' (profits/gains from specified business) must equal E3(iii) at Table E of Schedule BP.");

    /* A744 — 2iv income offered u/s 115BBF/115BBG/115BBH/115B = A3d + A3e + A3f + 3iv of Table E. */
    A(744, REQ(BG.IncChrgblTaxSplRate,
        N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBF",0))
       +N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBG",0))
       +N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.PLUs44sChapXIIGOthrUs115B",0))
       +N(RG(I,"CorpScheduleBP.BusSetoffCurrYr.ProfGainUs115B.IncOfCurYrAfterSetOff",0))),
      "Part B-TI: '2iv' income offered u/s 115BBF/115BBG/115BBH/115B must equal A3d + A3e + A3f + 3iv of Table E of Schedule BP.");

    /* A745 — deemed income u/s 115JB = Sl. No. 9 of Schedule MAT. */
    A(745, REQ(PB.DeemedTotIncSec115JB, RG(I,"ScheduleMAT.DeemedTotalIncUs115JB",0)),
      "Part B-TI: deemed income under section 115JB must equal Sl. No. 9 of Schedule MAT.");

    /* A746 — 11a Chapter VI-A Part B = Sl. No. 1 of Schedule VI-A. */
    A(746, REQ(VIAp.PartBchapterVIA, RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartBchapterVIA",0)),
      "Part B-TI: Chapter VI-A Part-B deduction must equal Sl. No. 1 of Schedule VI-A.");

    /* A747 — 17 Losses of current year carried forward = sum of row xxi of Sch CFL. */
    const CFx=RG(I,"ScheduleCFL.CurrentYearLossCF.LossSummaryDetail",{})||{};
    A(747, REQ(PB.LossesOfCurrentYearCarriedFwd,
        N(CFx.TotalHPPTILossCF)+N(CFx.BroughtFrwdBusLossSetOffDrYr)+N(CFx.LossFrmSpecBusCF)
       +N(CFx.LossFrmSpecifiedBusCF)+N(CFx.LossFrmLifeInsBusUs115B)+N(CFx.TotalSTCGPTILossCF)
       +N(CFx.TotalLTCGPTILossCF)+N(CFx.OthSrcLossRaceHorseCF)),
      "Part B-TI: Sl. No. 17 (losses of current year to be carried forward) must equal the sum total of row xxi of Schedule CFL.");

    /* A748 — 14 income chargeable at special rate = sum total of special incomes of Sch SI. */
    A(748, REQ(splCalc, RG(I,"ScheduleSI.TotSplRateInc",0)),
      "Part B-TI: Sl. No. 14 (income chargeable at special rate u/s 111A/112/112A etc.) must equal the sum total of special incomes of Schedule SI.");

    /* A749 — 15 income at normal rates = 13 − 14 (after rounding-off). */
    A(749, REQ(PB.IncChargeableTaxNormalRates, Math.max(0, N(PB.TotalIncome)-splCalc)),
      "Part B-TI: Sl. No. 15 (income chargeable at normal rates) must equal Sl. No. 13 − Sl. No. 14, after rounding-off.");

    /* A750 — 1 Income from house property = Sl. No. 3 of Schedule HP. */
    A(750, REQ(PB.IncomeFromHP, RG(I,"ScheduleHP.TotalIncomeChargeableUnHP",0)),
      "Part B-TI: Sl. No. 1 (income from house property) must equal Sl. No. 3 of Schedule HP.");

    /* A751 — 10 income at special rate included in 9 = total of Sl. (i) of Sch SI. */
    A(751, REQ(splInc, RG(I,"ScheduleSI.TotSplRateInc",0)),
      "Part B-TI: Sl. No. 10 (income chargeable at special rate included in 9) must equal the total of Sl. No. (i) of Schedule SI.");

    /* A752 — 3d Capital gain @30% u/s 115BBH = C2 of Schedule CG. */
    A(752, REQ(CGp.CapGains30Per115BBH, RG(I,"ScheduleCG.IncmFromVDATrnsf",0)),
      "Part B-TI: capital gain chargeable @30% u/s 115BBH must equal Sl. No. C2 of Schedule CG.");

    /* A753 — 3e Total Capital Gains = 3c + 3d. */
    A(753, REQ(CGp.TotalCapGains, N(CGp.ShortTermLongTermTotal)+N(CGp.CapGains30Per115BBH)),
      "Part B-TI: 'Total Capital Gains' must equal 3c (sum of short-term/long-term) + 3d (capital gain @30% u/s 115BBH).");

    /* A754 — 2ia income of foreign company from raw diamonds (Rule 10TIA) = E3(iva). */
    A(754, REQ(BG.IncmForeignCompRule10TIA, RG(I,"CorpScheduleBP.BusSetoffCurrYr.IncmForeignCompRule10TIA.IncOfCurYrAfterSetOff",0)),
      "Part B-TI: '2ia' (income of foreign company from eligible business of selling raw diamonds, Rule 10TIA) must equal E3(iva) at Table E of Schedule BP.");
  }

  /* =====================================================================
     Part B-TTI (PartB_TTI).
     ===================================================================== */
  if(I.PartB_TTI){
    const CTL=RG(I,"PartB_TTI.ComputationOfTaxLiability",{})||{};
    const TP=RG(CTL,"TaxPayableOnTI",{})||{};

    /* A755 — 2b (tax at special rates) = total of Col. (ii) of Schedule SI. */
    A(755, REQ(TP.TaxAtSpecialRates, RG(I,"ScheduleSI.TotSplRateIncTax",0)),
      "Part B-TTI: Sl. No. 2b must equal the total of Col. (ii) of Schedule SI.");

    /* A756 — tax credit in Part B-TTI (advance tax + self-assessment tax) must be
       consistent with the claims made in Schedule IT. */
    A(756, REQ(N(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax",0))+N(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax",0)),
               RG(I,"ScheduleIT.TotalTaxPayments",0)),
      "Part B-TTI: the tax credit shown (advance tax + self-assessment tax) must be consistent with the claims made in Schedule IT.");

    /* A757 — 2c = 2a + 2b. */
    A(757, REQ(TP.TaxPayableOnTotInc, N(TP.TaxAtNormalRates)+N(TP.TaxAtSpecialRates)),
      "Part B-TTI: Sl. No. 2c must equal 2a + 2b.");

    /* A758 — 2f Gross tax liability = 2c + 2diii + 2e. */
    A(758, REQ(TP.GrossTaxLiability, Math.max(0, N(TP.TaxPayableOnTotInc))+N(TP.TotalSurcharge)+N(TP.EducationCess), 2),
      "Part B-TTI: Sl. No. 2f (gross tax liability) must equal 2c + 2diii + 2e.");

    /* A759 — 6a Tax relief u/s 90/90A = Sl. No. 2 of Schedule TR. */
    A(759, REQ(RG(CTL,"TaxRelief.Section90",0), RG(I,"ScheduleTR1.TaxReliefOutsideIndiaDTAA",0)),
      "Part B-TTI: tax relief claimed u/s 90/90A at Sl. No. 6a must equal the amount at Sl. No. 2 of Schedule TR.");
  }
});
