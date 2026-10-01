/* =====================================================================
   ITR-6 · AY 2026-27 — Category-D validation rules, batch enc_20 (Phase 6).
   ADVISORY follow-up (non-blocking) rules — rules.json objects cat=="D".
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   Dd(n,cond,msg) raises a NON-blocking advisory when cond — the "this
   return is lawful" assertion — is FALSE. Every message is prefixed
   "[D] ". Every read is guarded (RG / (X||{}) / N()); nothing throws.
   Keys are the built-return ITR6 schema paths (the ruleset receives
   I = that root), taken from the built sections (70_sec_gen/os/bp/mat/
   ded/fa/tax) and the ITR-6 schema. Encoded from each rule's own text.

   These are "ensure Form X is filed / verify" follow-up notices. The
   backing form (3CEB, 66, 3CE, 3CFA, 29B, 67, 10DA, 10CCB, 56F, 10CCF)
   is a SEPARATE filing not present in the return, so the offline test is
   the lawful in-return TRIGGER: the advisory is SILENT on a return that
   does not make the triggering claim/income, and fires as a reminder on
   the return that does (so the filer verifies the form was furnished).
   Where a timeliness gate exists (D7/D8) the advisory additionally stays
   silent on a return filed on/before the due date.

   Serials encoded (22): D1–D22.
   RE-FILED OFFLINE-IMPOSSIBLE (1):
     D23 — "all effects in the audit report Form 3CD are expected to be
     routed through Schedule OI and Schedule BP per the provided mappings":
     Form 3CD is an external audit report not present in the built return,
     and the rule is a mapping cross-check against it, so there is no
     in-return field to assert against. Reported, not faked.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2For6",{})||{};
  const sec=String(RG(FS,"ReturnFileSec.IncomeTaxSec",""));
  const timely=sec==="11"||sec==="17";                   /* 139(1) on/before due date, or a revised return */

  /* D1 — liable to audit u/s 92E ⇒ Form 3CEB must be furnished by the due date. */
  Dd(1, G2.LiableSec92Eflg!=="Y",
    "[D] Part A General: liable to audit u/s 92E — ensure Form 3CEB is uploaded on or before the due date.");

  /* =====================================================================
     Schedule BP (CorpScheduleBP) — D2, D3, D4
     ===================================================================== */
  if(I.CorpScheduleBP){
    const DP="CorpScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.";
    const tonnage=N(RG(I,DP+"ChapterXIIG"));
    const inc44DA=N(RG(I,DP+"Section44DA"));
    /* D2 — tonnage-scheme (Chapter XII-G) income shown ⇒ Form 66 must be filed. */
    Dd(2, tonnage<=0,
      "[D] Schedule BP: income is offered under the tonnage scheme (Chapter XII-G) — ensure Form 66 is filed.");
    /* D3 — income offered u/s 44DA ⇒ it should equal income as per Form 3CE. */
    Dd(3, inc44DA<=0,
      "[D] Schedule BP: income is offered u/s 44DA — verify it equals the income as per Form 3CE (income is increased if the Form 3CE amount is higher).");
    /* D4 — income offered under Chapter XII-G (tonnage) ⇒ should equal Form 66. */
    Dd(4, tonnage<=0,
      "[D] Schedule BP: income offered under Chapter XII-G (tonnage) should equal the income as per Form 66 (income is increased if the Form 66 amount is higher).");
  }

  /* =====================================================================
     Schedule OS — D5
     ===================================================================== */
  if(I.ScheduleOS){
    const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const has5BBF=(RG(io,"OthersGrossDtls",[])||[]).some(r=>r&&r.SourceDescription==="5BBF"&&N(r.SourceAmount)>0)
      ||(RG(io,"PTIOthersGrossDtls",[])||[]).some(r=>r&&r.SourceDescription==="PTI_5BBF"&&N(r.SourceAmount)>0);
    /* D5 — income offered u/s 115BBF (patent royalty) ⇒ Form 3CFA is mandatory. */
    Dd(5, !has5BBF,
      "[D] Schedule OS: income is offered u/s 115BBF — Form 3CFA is mandatory, otherwise the income is chargeable at normal rates.");
  }

  /* =====================================================================
     Schedule MAT — D6
     ===================================================================== */
  if(I.ScheduleMAT){
    const bookProf=N(RG(I,"ScheduleMAT.BookProfUs115JB"));
    /* D6 — book profits u/s 115JB ⇒ should equal book profits per Form 29B. */
    Dd(6, bookProf<=0,
      "[D] Schedule MAT: book profits u/s 115JB should equal the book profits reported under Form 29B (Report u/s 115JB) — income is increased if the Form 29B amount is higher.");
  }

  /* =====================================================================
     Part B-TI — D7, D8
     ===================================================================== */
  if(I["PartB-TI"]){
    const partC=N(RG(I,"PartB-TI.DeductionsUndSchVIADtl.PartCchapterVIA"));
    const ded10AA=N(RG(I,"PartB-TI.DeductionsUnder10Aor10AA"));
    /* D7 — Chapter VI-A Part C deduction is allowed only if the return is filed
       on/before the due date u/s 139(1). */
    Dd(7, partC<=0 || timely,
      "[D] Part B-TI: Part C (Chapter VI-A) deduction can be claimed only if the return is filed on or before the due date specified u/s 139(1).");
    /* D8 — deduction u/s 10AA is allowed only if the return is filed on/before
       the due date u/s 139(1). */
    Dd(8, ded10AA<=0 || timely,
      "[D] Part B-TI: deduction u/s 10AA can be claimed only if the return is filed on or before the due date specified u/s 139(1).");
  }

  /* =====================================================================
     Schedule VIA — D9, D12, D15, D16, D17, D18, D19, D20, D21, D22
     ===================================================================== */
  if(I.ScheduleVIA){
    const D=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};
    const g=k=>N(D[k]);
    const d80IA=g("Section80IA"), d80IB=g("Section80IB"), d80IE=g("Section80IC"),
          d80IAC=g("Section80IAC"), d80IAB=g("Section80IAB"), d80IBA=g("Section80IBA"),
          d80JJAA=g("Section80JJAA"), d80LA1=g("Section80LA"), d80LA1A=g("Section80LA_1A");

    /* D9 — 80JJAA (Sl.No. 2l) claimed ⇒ Form 10DA should be filed. */
    Dd(9, d80JJAA<=0,
      "[D] Schedule VIA: deduction u/s 80JJAA (Sl.No. 2l) is claimed — ensure Form 10DA has been filed.");

    /* D12 — 80-IA/IB/IE/IAC/IAB/IBA claimed ⇒ Form 10CCB must be filed by the due date. */
    Dd(12, (d80IA+d80IB+d80IE+d80IAC+d80IAB+d80IBA)<=0,
      "[D] Schedule VIA: deduction u/s 80-IA/80-IB/80-IE/80-IAC/80-IAB/80-IBA is claimed — ensure Form 10CCB is filed within the due date (or extended date) for the current AY.");

    /* D15 — 80LA(1)/80LA(1A) claimed ⇒ Form 10CCF must be filed by the due date. */
    Dd(15, (d80LA1+d80LA1A)<=0,
      "[D] Schedule VIA: deduction u/s 80LA(1)/80LA(1A) is claimed — ensure Form 10CCF is filed within the due date (or extended date) to claim the benefit.");

    /* D16 — 80JJAA (2l) should equal the amount in Form 10DA. */
    Dd(16, d80JJAA<=0,
      "[D] Schedule VIA: deduction u/s 80JJAA (Sl.No. 2l) should equal the amount reported in Form 10DA.");

    /* D17 — 80LA(1)/80LA(1A) (2m/2n) should equal the amount in Form 10CCF. */
    Dd(17, (d80LA1+d80LA1A)<=0,
      "[D] Schedule VIA: deduction u/s 80LA(1)/80LA(1A) (Sl.No. 2m/2n) should equal the amount reported in Form 10CCF (deduction is reduced per the form).");

    /* D18 — 80IA (2e) should equal the sum of amounts in Form 10CCB. */
    Dd(18, d80IA<=0,
      "[D] Schedule VIA: deduction u/s 80-IA (Sl.No. 2e) should equal the sum of the amounts reported in Form 10CCB.");

    /* D19 — 80IB (2h) should equal the sum of amounts in Form 10CCB. */
    Dd(19, d80IB<=0,
      "[D] Schedule VIA: deduction u/s 80-IB (Sl.No. 2h) should equal the sum of the amounts reported in Form 10CCB.");

    /* D20 — 80IAB (2f) should equal the sum of amounts in Form 10CCB. */
    Dd(20, d80IAB<=0,
      "[D] Schedule VIA: deduction u/s 80-IAB (Sl.No. 2f) should equal the sum of the amounts reported in Form 10CCB.");

    /* D21 — 80IAC (2g) should equal the sum of amounts in Form 10CCB. */
    Dd(21, d80IAC<=0,
      "[D] Schedule VIA: deduction u/s 80-IAC (Sl.No. 2g) should equal the sum of the amounts reported in Form 10CCB.");

    /* D22 — 80IE (2j) should equal the sum of amounts in Form 10CCB. */
    Dd(22, d80IE<=0,
      "[D] Schedule VIA: deduction u/s 80-IE (Sl.No. 2j) should equal the sum of the amounts reported in Form 10CCB.");
  }

  /* =====================================================================
     Schedule TR1 — D10
     ===================================================================== */
  if(I.ScheduleTR1){
    const relief=N(RG(I,"ScheduleTR1.TotalTaxReliefOutsideIndia"));
    /* D10 — relief u/s 90/90A/91 claimed ⇒ Form 67 must be filed. */
    Dd(10, relief<=0,
      "[D] Part B-TTI: relief u/s 90/90A/91 is claimed — it is mandatory to file Form 67.");
  }

  /* =====================================================================
     Schedule 10AA — D13, D14
     ===================================================================== */
  if(I.Schedule10AA){
    const ded10=N(RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub"));
    /* D13 — 10AA deduction ⇒ Form 56F must be filed within the due date. */
    Dd(13, ded10<=0,
      "[D] Schedule 10AA: deduction u/s 10AA can be claimed only if Form 56F is filed within the due date (or extended due date).");
    /* D14 — 10AA deduction should be consistent with the amount in Form 56F. */
    Dd(14, ded10<=0,
      "[D] Schedule 10AA: verify the deduction claimed u/s 10AA against the amount in Form 56F — the deduction is reduced per the entries in the form.");
  }

  /* =====================================================================
     Part B-TTI — D11
     ===================================================================== */
  if(I.PartB_TTI){
    const CTL="PartB_TTI.ComputationOfTaxLiability.";
    const matTax=N(RG(I,CTL+"TaxPayableOnDeemedTI.TotalTax"));
    const normalTax=N(RG(I,CTL+"TaxPayableOnTI.GrossTaxLiability"));
    /* D11 — tax as per MAT (115JB) exceeds tax under the normal provisions ⇒
       it is mandatory to file Form 29B. */
    Dd(11, matTax <= normalTax,
      "[D] Part B-TTI: tax as per MAT (u/s 115JB) is more than the tax under the normal provisions — it is mandatory to file Form 29B.");
  }
});
