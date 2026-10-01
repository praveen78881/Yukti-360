/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_10 (Phase 6).
   Serial range A459–A508 (ENFORCED-target only per books/ITR-7/rule_census.md):
     · A459–A461 — Schedule FSI (foreign-source income vs the head offered)
     · A462–A467 — Schedule TR (foreign-tax-relief totals vs FSI, non-resident)
     · A468       — Schedule SH (unlisted-equity-share flag ⇒ details)
     · A469–A508 — Part B-TI, Part-B1 (`PartB_TI`) internal roll-ups and the
                    cross-schedule equalities that feed each line.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this return
   is lawful" assertion — is FALSE. Every read is guarded (RG / N / (X||{}));
   nothing throws. Keys are the built-return ITR7 schema paths
   (I = Object.values(buildReturn().ITR)[0]); paths + Sl.-No. ↔ key mapping were
   taken from sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json and
   books/ITR-7/PART_B_TI_TTI.md, Schedule_A/AI/VC/J/HP/OS/CG/SI/CYLA/115BBI/BP.md
   (each schedule wrapper name confirmed against definition ITR7). Encoded from
   each rule's own RE-JOINED text (the rules.json line-wrap offsets each serial
   by ~one clause; A(n) below asserts the re-joined semantic rule).

   Official Part-B1 Sl.-No. numbering used below (pinned by A484/A507/A508):
     1=VcCorpusSec11 · 2=VoluntaryContributions.TotIncFromVC · 3=AggregateIncomeUs1112
     4=AmtForCharitableUs111 · 5=IncToBeApplied · 6(i..vii)=TIDeductions.*
     7(i..ix)=TIAdditions.* · 8=IncChargeableUs11_4 · 9=GrossIncome
     10i=IncomeFromHP · 10ii=ProfBusGain.ProfGainNoSpecBus
     10iii(Av)=CapGain.ShortTerm.TotalShortTerm · 10iii(Biii)=CapGain.LongTerm.TotalLongTerm
     10iii(C)=CapGain.ShortTermLongTermTotal · 10iii(D)=CapGain.CapGains30Per115BBH
     10iii(E)=CapGain.TotalCapGains · 10iv=IncFromOS.TotIncFromOS · 10v=TotIncNotPart7And11Abv
     12=CurrentYearLoss · 13=TotalIncome · 14=IncChargeableTaxSplRates
     15=DonationsUs115BBC · 16=IncChargUs115BBIIncld13 · 17=AggIncothSpecInc115BBI

   Serials in A459–A508 NOT encoded here (re-filed OFFLINE-IMPOSSIBLE — the
   target is a composite/derived figure that the built return does NOT
   materialise as a single schema key, so no faithful non-vacuous offline check
   exists; never faked):
     A469 / A470 — 6(v) ≤ 15% of ((Sl.1 + Sl.3) − "A1 of Schedule A"): the
            accumulation base "A1 of Schedule A" is not a materialised key, and
            the boundary-exact "≤" would false-fire on any mis-stated base.
     A474 — Sl.1 == "C − Ai − Bi + E of Schedule VC": a composite Schedule-VC
            derivation, not a single materialised VC key.
     A475 — Sl.3 == "Sum of 10 of Schedule AI": the built Sl.3
            (AggregateIncomeUs1112) folds in voluntary contributions and does
            NOT equal Schedule-AI's aggregate (TotalofAggregateIncomes); the
            "aggregate excluding VC" line the rule names is not materialised.
     A492 — Sl.11 == (9 + 10): the schema collapses Sl.9 and Sl.11 into the one
            key GrossIncome, so Sl.11 is not independently stored.
     A507 — Sl.5 == "[1 + 3 − 4 − (A1 − A1a of Schedule A)]": a composite
            self-formula over Schedule-A A1/A1a, not reconstructable from the
            materialised keys to a silent equality.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const eq =(a,b)=>Math.abs(N(a)-N(b))<=1;                 /* rupee-tolerant equality */
  const sum=(arr,f)=>(arr||[]).reduce((a,r)=>a+(r?N(f(r)):0),0);

  /* ---- Part A-General reads (guarded), shared by A465/A468/A473/A495 ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const FS  = RG(G1,"FilingStatus",{})||{};
  const exsec= String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);
  const regITA = RG(G1,"RegApprUnderITADtls",[])||[];
  const regHas = code=>regITA.some(r=>r && String(r.SectionRegistered)===code);
  const EX_23C = ["23CIV","23CV","23CVI","23CVIA"];
  const is1112 = (exsec==="11" || EX_23C.indexOf(exsec)>=0);        /* the ss.11 / 10(23C) exemption family */

  /* head income under each head, whichever Part B-TI regime is live */
  const headHP=()=>Math.max(N(RG(I,"PartB_TI.IncomeFromHP")),N(RG(I,"PartB_TI2.IncomeFromHP")),
                            N(RG(I,"PartB_TI3.ComputationIncChargeable.IncNotForming.IncFromHP")));
  const headCG=()=>Math.max(N(RG(I,"PartB_TI.CapGain.TotalCapGains")),N(RG(I,"PartB_TI2.CapGain.TotalCapGains")),
                            N(RG(I,"PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain.TotalCapGains")));
  const headOS=()=>Math.max(N(RG(I,"PartB_TI.IncFromOS.TotIncFromOS")),N(RG(I,"PartB_TI2.IncFromOS.TotIncFromOS")),
                            N(RG(I,"PartB_TI3.ComputationIncChargeable.IncNotForming.IncOS")));

  /* =================== Schedule FSI (A459–A461) =================== */
  if(I.ScheduleFSI){
    const fr = RG(I,"ScheduleFSI.ScheduleFSIDtls",[])||[];
    /* A459 — relief claimed against House Property ⇒ HP income offered ≥ HP income shown in FSI. */
    const fHP = sum(fr,r=>N((r.IncFromHP||{}).TaxReliefinInd)>0 ? N((r.IncFromHP||{}).IncFrmOutsideInd) : 0);
    A(459, fHP<=0 || headHP()>=fHP,
      "Schedule FSI: where tax relief is claimed against House Property, the House Property income offered must not be less than the House Property income shown in Schedule FSI.");
    /* A460 — relief claimed against Capital Gains ⇒ CG income offered ≥ CG income shown in FSI. */
    const fCG = sum(fr,r=>N((r.IncCapGain||{}).TaxReliefinInd)>0 ? N((r.IncCapGain||{}).IncFrmOutsideInd) : 0);
    A(460, fCG<=0 || headCG()>=fCG,
      "Schedule FSI: where tax relief is claimed against Capital Gains, the Capital Gains income offered must not be less than the Capital Gains income shown in Schedule FSI.");
    /* A461 — relief claimed against Other Sources ⇒ OS income offered ≥ OS income shown in FSI. */
    const fOS = sum(fr,r=>N((r.IncOthSrc||{}).TaxReliefinInd)>0 ? N((r.IncOthSrc||{}).IncFrmOutsideInd) : 0);
    A(461, fOS<=0 || headOS()>=fOS,
      "Schedule FSI: where tax relief is claimed against Other Sources, the Other Sources income offered must not be less than the Other Sources income shown in Schedule FSI.");
  }

  /* =================== Schedule TR (A462–A467) =================== */
  if(I.ScheduleTR1){
    const T1 = RG(I,"ScheduleTR1",{})||{};
    const tr = RG(T1,"ScheduleTR",[])||[];
    const rDTAA = sum(tr,r=>["90","90A"].indexOf(String(r.ReliefClaimedUsSection))>=0 ? N(r.TaxReliefOutsideIndia) : 0);
    const r91   = sum(tr,r=>String(r.ReliefClaimedUsSection)==="91" ? N(r.TaxReliefOutsideIndia) : 0);
    const rAll  = sum(tr,r=>N(r.TaxReliefOutsideIndia));
    /* A462 — Sl.2 (DTAA relief) = total of col 1(d) where section is 90/90A. */
    A(462, eq(T1.TaxReliefOutsideIndiaDTAA, rDTAA),
      "Schedule TR: the total tax relief for countries where DTAA is applicable (Sl. 2) must equal the total of column 1(d) for countries where relief is claimed u/s 90/90A.");
    /* A463 — Sl.3 (non-DTAA relief) = total of col 1(d) where section is 91. */
    A(463, eq(T1.TaxReliefOutsideIndiaNotDTAA, r91),
      "Schedule TR: the total tax relief for countries where DTAA is not applicable (Sl. 3) must equal the total of column 1(d) for countries where relief is claimed u/s 91.");
    /* A464 — Sl.2 + Sl.3 = total of column 1(d). */
    A(464, eq(N(T1.TaxReliefOutsideIndiaDTAA)+N(T1.TaxReliefOutsideIndiaNotDTAA), rAll),
      "Schedule TR: Sl. 2 + Sl. 3 must equal the total of column 1(d).");
    /* A465 — Schedule TR is not applicable for non-residents. */
    A(465, String(FS.ResidentialStatus)!=="NRI",
      "Schedule TR is not applicable for non-residents.");
    if(I.ScheduleFSI){
      const fr = RG(I,"ScheduleFSI.ScheduleFSIDtls",[])||[];
      /* A466 — Col C (total taxes paid outside India) = total of Col C of Schedule FSI across countries. */
      A(466, eq(T1.TotalTaxOutsideIndia, sum(fr,r=>N((r.TotalCountryWise||{}).TaxPaidOutsideInd))),
        "Schedule TR: total taxes paid outside India (Col C) must equal the total of Col C of Schedule FSI in respect of each country.");
      /* A467 — Col d (total tax relief available) = total of Col e of Schedule FSI across countries. */
      A(467, eq(T1.TotalTaxReliefOutsideIndia, sum(fr,r=>N((r.TotalCountryWise||{}).TaxReliefinInd))),
        "Schedule TR: total tax relief available (Col d) must equal the total of Col e of Schedule FSI in respect of each country.");
    }
  }

  /* =================== Schedule SH (A468) =================== */
  {
    const sh = RG(I,"ScheduleSH",{})||{};
    const shHas = (RG(sh,"ShrhldngUnlistedCompany.DtlsSHEndPreviousYearUC",[])||[]).length>0
               || (RG(sh,"ShrhldngUnlistedCompany.DtlsEquityShareEndPrvYr",[])||[]).length>0
               || (RG(sh,"ShrhldngUnlistedCompany.SHDtlsAnyTimePrevYearUC",[])||[]).length>0;
    /* A468 — flag "held unlisted equity shares during the year" = Y ⇒ the share details must be filled. */
    A(468, String(FS.HeldUnlistedEqShrPrYrFlg)!=="Y" || shHas,
      "Schedule SH: unlisted equity shares were held during the year (flag Yes), so the details of such shares must be filled.");
  }

  /* =================== Part B-TI · Part-B1 (A469–A508) =================== */
  if(I.PartB_TI){
    const P  = I.PartB_TI;
    const p  = k=>N(RG(P,k));
    const D  = RG(P,"TIDeductions",{})||{};
    const AD = RG(P,"TIAdditions",{})||{};
    const ST = RG(P,"CapGain.ShortTerm",{})||{};
    const LT = RG(P,"CapGain.LongTerm",{})||{};

    /* the cross-schedule counterpart figures (guarded; 0 when the schedule is absent) */
    const schAG    = N(RG(I,"ScheduleA.TotAmountAllowedApplication.Total"));       /* G of Schedule A */
    const jRepay   = N(RG(I,"ITRScheduleJ.ScheduleJ_A2.TotRepayment"));            /* A2(4) of Schedule J */
    const jDepBack = N(RG(I,"ITRScheduleJ.ScheduleJ_A1.TotAmtDepositedBack"));     /* A1(4) of Schedule J */
    const schDpy   = sum(RG(I,"ITRScheduleD.ScheduleD",[]),r=>/2025/.test(String(r.AppliedYear))?N(r.AmountAppliedPY):0);   /* col 2 of Schedule D, FY 2025-26 */
    const schIacc  = sum(RG(I,"ITRScheduleI.ScheduleI",[]),r=>/202[56]/.test(String(r.AccumlatedYear))?N(r.AmountAccumlated):0);/* col 2 of Schedule I, FY 2025-26 */
    const vcDiii   = N(RG(I,"ScheduleVC.AnonymousDonations.AnonymousDonations115BBC"));   /* Diii of Schedule VC */
    const hpTot    = N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP"));              /* Sl.3 of Schedule HP */
    const bpD      = N(RG(I,"CorpScheduleBP.IncChrgUnHdProftGain"));               /* D (=D48) of Schedule BP */
    const osTot    = N(RG(I,"ScheduleOS.IncChargeableFrmOthSrc"));                 /* Sl.9 of Schedule OS */
    const cylaTot  = N(RG(I,"ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff"))
                   + N(RG(I,"ScheduleCYLA.TotalLossSetOff.TotBusLossSetoff"))
                   + N(RG(I,"ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff")); /* 2xiv+3xiv+4xiv of CYLA */
    const bbiTot   = N(RG(I,"Schedule115BBI.Total"));                              /* Sl.7 of Schedule 115BBI */
    const siTot    = N(RG(I,"ScheduleSI.TotSplRateInc"));                          /* col (i) of Schedule SI */
    const cgC2     = N(RG(I,"ScheduleCG.IncmFromVDATrnsf"));                       /* C2 of Schedule CG */
    const hasCG    = !!I.ScheduleCG;

    /* tax figures (Part B-TTI) for A472 / A506 */
    const gtl      = N(RG(I,"PartB_TTI.ComputationOfTaxLiability.GrossTaxLiability"));
    const paid     = N(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid"));

    /* A471 — 10ii "Profits and gains of business or profession" is consistent with D of Schedule BP. */
    A(471, eq(RG(P,"ProfBusGain.ProfGainNoSpecBus"), bpD),
      "Part B-TI (Part-B1): Sl. 10(ii) Profits and gains of business or profession must be consistent with Sl. No. D of Schedule BP.");

    /* A472 — Gross Total Income and every head entered as Nil/0, yet tax has been computed and paid. */
    A(472, !( p("TotalIncome")===0 && p("GrossIncome")===0 && p("TotIncNotPart7And11Abv")===0
              && headHP()===0 && headCG()===0 && headOS()===0 && gtl>0 && paid>0 ),
      "Part B-TI: Gross Total Income and all heads of income are Nil/0 but a tax liability has been computed and paid.");

    /* A473 — exemption claimed in (Sl.4 + 6vii) ⇒ 12A/12AB or 10(23C)(iv/v/vi/via) registration is furnished. */
    A(473, !( (p("AmtForCharitableUs111")+N(D.TotalDeductions))>0 )
           || regHas("VI")||regHas("II")||regHas("III")||regHas("IV")||regHas("V"),
      "Part B-TI: exemption is claimed at Sl. 4 + 6vii, so the registration/approval details must record Section 12A/12AB or 10(23C)(iv)/(v)/(vi)/(via).");

    /* A476 — 6(i) Amount applied during the year = Sl. No. G of Schedule A. */
    A(476, eq(D.AmtAppliedtForCharitablePurpose, schAG),
      "Part B-TI (Part-B1): Sl. 6(i) amount applied during the previous year must equal Sl. No. G of Schedule A.");
    /* A477 — 6(ii) Repayment of loan = A2(4) of Schedule J. */
    A(477, eq(D.AmtAppForCharitablePurposeRepayment, jRepay),
      "Part B-TI (Part-B1): Sl. 6(ii) repayment of loan must equal A2(4) of Schedule J.");
    /* A478 — 6(iii) Amount invested/deposited back into corpus = A1(4) of Schedule J. */
    A(478, eq(D.AmtAppliedSpecifiedMode, jDepBack),
      "Part B-TI (Part-B1): Sl. 6(iii) amount invested/deposited back into corpus must equal A1(4) of Schedule J.");
    /* A479 — 6(iv) Amount deemed to have been applied = Column 2 of Schedule D for FY 2025-26. */
    A(479, eq(D.AmtDeemedForCharitable, schDpy),
      "Part B-TI (Part-B1): Sl. 6(iv) amount deemed to have been applied must equal Column 2 of Schedule D for FY 2025-26.");
    /* A480 — 6(vi) Amount set apart for specified purposes = Column 2 of Schedule I for FY 2025-26. */
    A(480, eq(D.AmtFulfilledUs11_2, schIacc),
      "Part B-TI (Part-B1): Sl. 6(vi) amount set apart for specified purposes must equal Column 2 of Schedule I for FY 2025-26.");
    /* A481 — 6(vii) Total = 6i + 6ii + 6iii + 6iv + 6v + 6vi. */
    A(481, eq(D.TotalDeductions, N(D.AmtAppliedtForCharitablePurpose)+N(D.AmtAppForCharitablePurposeRepayment)
             +N(D.AmtAppliedSpecifiedMode)+N(D.AmtDeemedForCharitable)+N(D.AmtAccumulatedForCharitable)+N(D.AmtFulfilledUs11_2)),
      "Part B-TI (Part-B1): Sl. 6(vii) Total must equal 6i + 6ii + 6iii + 6iv + 6v + 6vi.");
    /* A482 — 7(ii) Anonymous donation on which exemption is not available = Diii of Schedule VC. */
    A(482, eq(RG(AD,"ExemptionUs11_13Dtl.AnonymousDonationVC"), vcDiii),
      "Part B-TI (Part-B1): Sl. 7(ii) anonymous donation must equal Diii of Schedule VC.");
    /* A483 — 7(ix) Total = 7i + 7ii + 7iii + 7iv + 7v + 7vi + 7vii + 7viii. */
    A(483, eq(AD.TotalAdditions, N(AD.IncChargeableUs115BBI)+N(RG(AD,"ExemptionUs11_13Dtl.AnonymousDonationVC"))
             +N(AD.IncChargeableUs12_2)+N(AD.AmtDsllwblUs111RWS40AIA)+N(AD.AmtDsllwblUs111RWS40A3)
             +N(AD.IncExp3BUS80G)+N(AD.IncExp1BUS80G)+N(AD.AnyOthrIncome)),
      "Part B-TI (Part-B1): Sl. 7(ix) Total must equal the sum of 7i to 7viii.");
    /* A484 — 9 Gross income after exemption = (5 − 6vii) + 7ix + 8. */
    A(484, eq(P.GrossIncome, (p("IncToBeApplied")-N(D.TotalDeductions)) + N(AD.TotalAdditions) + p("IncChargeableUs11_4")),
      "Part B-TI (Part-B1): Sl. 9 gross income after exemption must equal (5 − 6vii) + 7ix + 8.");
    /* A485 — 10(i) Income from house property = Sl. No. 3 of Schedule HP. */
    A(485, eq(P.IncomeFromHP, hpTot),
      "Part B-TI (Part-B1): Sl. 10(i) income from house property must equal Sl. No. 3 of Schedule HP.");
    /* A486 — 10(ii) Profits and gains of business or profession = D(48) of Schedule BP. */
    A(486, eq(RG(P,"ProfBusGain.ProfGainNoSpecBus"), bpD),
      "Part B-TI (Part-B1): Sl. 10(ii) profits and gains of business or profession must equal D(48) of Schedule BP.");
    /* A487 — 10(iii)(Av) Total short-term = Ai + Aii + Aiii + Aiv. */
    A(487, eq(ST.TotalShortTerm, N(ST.ShortTerm20Per)+N(ST.ShortTerm30Per)+N(ST.ShortTermAppRate)+N(ST.ShortTermSplRateDTAA)),
      "Part B-TI (Part-B1): Sl. 10(iii)(Av) total short-term must equal Ai + Aii + Aiii + Aiv.");
    /* A488 — 10(iii)(Biii) Total long-term = Bi + Bii. */
    A(488, eq(LT.TotalLongTerm, N(LT.LongTerm12_5Per)+N(LT.LongTermSplRateDTAA)),
      "Part B-TI (Part-B1): Sl. 10(iii)(Biii) total long-term must equal Bi + Bii.");
    /* A489 — 10(iii)(C) = Av + Biii. */
    A(489, eq(RG(P,"CapGain.ShortTermLongTermTotal"), N(ST.TotalShortTerm)+N(LT.TotalLongTerm)),
      "Part B-TI (Part-B1): Sl. 10(iii)(C) must equal Av + Biii.");
    /* A490 — 10(iv) Income from other sources = Sl. No. 9 of Schedule OS. */
    A(490, eq(RG(P,"IncFromOS.TotIncFromOS"), osTot),
      "Part B-TI (Part-B1): Sl. 10(iv) income from other sources must equal Sl. No. 9 of Schedule OS.");
    /* A491 — 10(v) Total = 10i + 10ii + 10iiiE + 10iv. */
    A(491, eq(P.TotIncNotPart7And11Abv, p("IncomeFromHP")+N(RG(P,"ProfBusGain.ProfGainNoSpecBus"))
             +N(RG(P,"CapGain.TotalCapGains"))+N(RG(P,"IncFromOS.TotIncFromOS"))),
      "Part B-TI (Part-B1): Sl. 10(v) Total must equal 10i + 10ii + 10iiiE + 10iv.");
    /* A493 — 13 Total income = 11 − 12, where 11 = (9 + 10v) and 12 = current-year loss. */
    A(493, eq(P.TotalIncome, (p("GrossIncome")+p("TotIncNotPart7And11Abv")) - p("CurrentYearLoss")),
      "Part B-TI (Part-B1): Sl. 13 Total Income must equal Sl. 11 − Sl. 12.");
    /* A494 — 15 Anonymous donations taxed u/s 115BBC @30% = Diii of Schedule VC. */
    A(494, eq(P.DonationsUs115BBC, vcDiii),
      "Part B-TI (Part-B1): Sl. 15 anonymous donations taxed u/s 115BBC must equal Diii of Schedule VC.");
    /* A495 — any value at Sl.1–17 is allowed only if exemption is claimed u/s 11 or 10(23C)(iv/v/vi/via). */
    A(495, !( p("TotalIncome")>0 || p("GrossIncome")>0 || p("IncToBeApplied")>0 || p("VcCorpusSec11")>0
              || p("AggregateIncomeUs1112")>0 ) || is1112,
      "Part B-TI (Part-B1): values at Sl. 1 to 17 may be entered only if Section 11 or 10(23C)(iv)/(v)/(vi)/(via) is the exemption claimed.");
    /* A496 — STCG @30% (10(iii)Aii) > 0 ⇒ Table E of Schedule CG must be filled. */
    A(496, N(ST.ShortTerm30Per)<=0 || hasCG,
      "Part B-TI (Part-B1): short-term capital gains chargeable @30% are shown, so Table E of Schedule CG must be filled.");
    /* A497 — STCG at applicable rate (10(iii)Aiii) > 0 ⇒ Table E of Schedule CG must be filled. */
    A(497, N(ST.ShortTermAppRate)<=0 || hasCG,
      "Part B-TI (Part-B1): short-term capital gains chargeable at applicable rate are shown, so Table E of Schedule CG must be filled.");
    /* A498 — STCG at DTAA rate (10(iii)Aiv) > 0 ⇒ Table E of Schedule CG must be filled. */
    A(498, N(ST.ShortTermSplRateDTAA)<=0 || hasCG,
      "Part B-TI (Part-B1): short-term capital gains chargeable at DTAA rates are shown, so Table E of Schedule CG must be filled.");
    /* A499 — LTCG at DTAA rate (10(iii)Bii) > 0 ⇒ Table E of Schedule CG must be filled. */
    A(499, N(LT.LongTermSplRateDTAA)<=0 || hasCG,
      "Part B-TI (Part-B1): long-term capital gains chargeable at DTAA rates are shown, so Table E of Schedule CG must be filled.");
    /* A500 — 12 Losses of current year set off against 10v = total of 2xiv + 3xiv + 4xiv of Schedule CYLA. */
    A(500, eq(P.CurrentYearLoss, cylaTot),
      "Part B-TI (Part-B1): Sl. 12 losses of current year set off against 10v must equal the total of 2xiv, 3xiv and 4xiv of Schedule CYLA.");
    /* A501 — income chargeable u/s 115BBI (7i) = total of Sl. No. 7 of Schedule 115BBI. */
    A(501, eq(AD.IncChargeableUs115BBI, bbiTot),
      "Part B-TI (Part-B1): income chargeable u/s 115BBI must equal the total of Sl. No. 7 of Schedule 115BBI.");
    /* A502 — 14 Income chargeable at special rates = total of col (i) of Schedule SI. */
    A(502, eq(P.IncChargeableTaxSplRates, siTot),
      "Part B-TI (Part-B1): Sl. 14 income chargeable at special rates must equal the total of col (i) of Schedule SI.");
    /* A503 — 10(iii)(D) capital gain u/s 115BBH = Sl. No. C2 of Schedule CG. */
    A(503, eq(RG(P,"CapGain.CapGains30Per115BBH"), cgC2),
      "Part B-TI (Part-B1): Sl. 10(iii)(D) must equal Sl. No. C2 of Schedule CG.");
    /* A504 — 10(iii)(E) Total capital gains = 10iii[C + D]. */
    A(504, eq(RG(P,"CapGain.TotalCapGains"), N(RG(P,"CapGain.ShortTermLongTermTotal"))+N(RG(P,"CapGain.CapGains30Per115BBH"))),
      "Part B-TI (Part-B1): Sl. 10(iii)(E) total capital gains must equal 10iii(C) + 10iii(D).");
    /* A505 — 16 Specified income chargeable u/s 115BBI @30% = Sl. No. 7 of Schedule 115BBI. */
    A(505, eq(P.IncChargUs115BBIIncld13, bbiTot),
      "Part B-TI (Part-B1): Sl. 16 specified income chargeable u/s 115BBI must equal Sl. No. 7 of Schedule 115BBI.");
    /* A506 — income entered in the return but tax not computed on the same. */
    A(506, p("TotalIncome")<=0 || gtl>0,
      "Part B-TI (Part-B1): income is entered in the return but no tax has been computed on it.");
    /* A508 — 17 Aggregate income taxed at normal rates = 13 − 14 − 15 − 16. */
    A(508, eq(P.AggIncothSpecInc115BBI, p("TotalIncome")-p("IncChargeableTaxSplRates")-p("DonationsUs115BBC")-p("IncChargUs115BBIIncld13")),
      "Part B-TI (Part-B1): Sl. 17 aggregate income to be taxed at normal rates must equal 13 − 14 − 15 − 16.");
  }
});
