/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 15.
   Serials 644–675 (books/ITR-5/rules.json), all in Schedule VI-A
   (Chapter VI-A deduction summary: the Part B / Part C line totals, the
   per-line "value claimed vs. its own sub-schedule" caps, the schedule-
   filled cross-checks, the status / IFSC-forex eligibility gates, and the
   "eligible ≤ user-enterable" per-line lines).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / (X||{})); nothing throws; every block guards to
   a no-op when Schedule VI-A is absent. Schema keys come from
   forms/ITR-5/src/70_sec_ded.js exp() (ScheduleVIA UsrDeductUndChapVIA /
   DeductUndChapVIA and the Section80* leaves; the sub-schedule totals
   TotSchedule80_IA / _IB / _IC, Schedule80IAC.AmtDedCurAY, Schedule80LA.
   Total) and forms/ITR-5/src/70_sec_gen.js exp() (PartA_GEN1.OrgFirmInfo.
   StatusOrCompanyType / SubStatus, PartA_GEN1.FilingStatus.
   ForeignExchangeFlag), cross-checked against the books.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};

  /* ===================================================================
     SCHEDULE VI-A  (644–675)
     ScheduleVIA carries two mirrored sub-objects:
       UsrDeductUndChapVIA  (U) — the amount CLAIMED per line + the three
                                  part totals (TotPartBchapterVIA,
                                  TotPartCchapterVIA, TotalChapVIADeductions)
       DeductUndChapVIA     (D) — the amount ALLOWED / eligible per line +
                                  the same three (GTI-capped) totals
     Per-line schema keys (DED_MAP in 70_sec_ded.js):
       Part B: Section80G · Section80GGA · Section80GGC
       Part C: Section80IA · Section80IAB · Section80IAC · Section80IB ·
               Section80IBA · Section80IC · Section80JJA · Section80JJAA ·
               Section80LA · Section80LA_1A · Section80P
     =================================================================== */
  if(I.ScheduleVIA){
    const VIA=I.ScheduleVIA||{};
    const U=RG(VIA,"UsrDeductUndChapVIA",{})||{};
    const D=RG(VIA,"DeductUndChapVIA",{})||{};

    /* sub-schedule totals (each read safely; 0 when the schedule is absent) */
    const totIA =RG(I,"Schedule80_IA.TotSchedule80_IA",0);
    const totIB =RG(I,"Schedule80_IB.TotSchedule80_IB",0);
    const totIC =RG(I,"Schedule80_IC.TotSchedule80_IC",0);
    const totIAC=RG(I,"Schedule80IAC.AmtDedCurAY",0);
    const totLA =RG(I,"Schedule80LA.Total",0);

    /* filing status / substatus / IFSC-forex flag (PartA_GEN1) */
    const stat=String(RG(I,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType",""));
    const sub =String(RG(I,"PartA_GEN1.OrgFirmInfo.SubStatus",""));
    const fx  =String(RG(I,"PartA_GEN1.FilingStatus.ForeignExchangeFlag","N")).charAt(0).toUpperCase()==="Y";

    /* ---- 644/645: 80-IA (VI-A 2d) vs Schedule 80-IA ---- */
    if(I.Schedule80_IA) A(644,N(U.Section80IA)<=totIA+1,"Schedule VI-A: the 80-IA deduction claimed cannot be higher than the total deduction computed in Schedule 80-IA (Sl. No. c).");
    A(645,!(N(U.Section80IA)>0)||!!I.Schedule80_IA,"Schedule VI-A: an 80-IA deduction is claimed but Schedule 80-IA is not filled.");
    /* ---- 646/647: 80-IB vs Schedule 80-IB ---- */
    if(I.Schedule80_IB) A(646,N(U.Section80IB)<=totIB+1,"Schedule VI-A: the 80-IB deduction claimed cannot be higher than the total deduction computed in Schedule 80-IB.");
    A(647,!(N(U.Section80IB)>0)||!!I.Schedule80_IB,"Schedule VI-A: an 80-IB deduction is claimed but Schedule 80-IB is not filled.");
    /* ---- 648/649: 80-IE vs Schedule 80-IE (Schedule80_IC block) ---- */
    if(I.Schedule80_IC) A(648,N(U.Section80IC)<=totIC+1,"Schedule VI-A: the 80-IE deduction claimed cannot be higher than the total deduction computed in Schedule 80-IE.");
    A(649,!(N(U.Section80IC)>0)||!!I.Schedule80_IC,"Schedule VI-A: an 80-IE deduction is claimed but Schedule 80-IE is not filled.");

    /* ---- 650: Sl.3 (total) = Sl.1 (Part B) + Sl.2 (Part C), claimed side ---- */
    A(650,REQ(N(U.TotalChapVIADeductions),N(U.TotPartBchapterVIA)+N(U.TotPartCchapterVIA)),"Schedule VI-A: the total deduction under Chapter VI-A (Sl. 3) must equal Total Part B (Sl. 1) + Total Part C (Sl. 2).");
    /* ---- 651: Sl.1 Total Part B = 80G + 80GGA + 80GGC, claimed side ---- */
    A(651,REQ(N(U.TotPartBchapterVIA),N(U.Section80G)+N(U.Section80GGA)+N(U.Section80GGC)),"Schedule VI-A: Total deduction under Part B (Sl. 1) must equal 80G (a) + 80GGA (b) + 80GGC (c).");
    /* ---- 656: Sl.2 Total Part C = sum of the eleven Part-C lines, claimed side ---- */
    A(656,REQ(N(U.TotPartCchapterVIA),
        N(U.Section80IA)+N(U.Section80IAB)+N(U.Section80IAC)+N(U.Section80IB)+N(U.Section80IBA)+
        N(U.Section80IC)+N(U.Section80JJA)+N(U.Section80JJAA)+N(U.Section80LA)+N(U.Section80LA_1A)+N(U.Section80P)),
      "Schedule VI-A: Total deduction under Part C (Sl. 2) must equal the sum of the Part-C lines (80-IA to 80P).");

    /* ---- 652: 80-IAC can be claimed only by an LLP ----
       LLP is Status "1" (Firm) with SubStatus code "5"; a lawful 80-IAC
       claim must therefore be Status 1 and, where SubStatus is present, "5".
       (SubStatus omitted → not asserted, so no false-fire.) */
    A(652,!(N(U.Section80IAC)>0)||(stat==="1"&&(sub===""||sub==="5")),"Schedule VI-A: a deduction u/s 80-IAC can be claimed only by an LLP.");

    /* ---- 653: 80P can be claimed only by a co-operative society ----
       Co-operative societies file ITR-5 under StatusOrCompanyType "14"
       (the co-op sub-statuses live under 14). Gate on status 14 — a safe
       superset of the eligible co-op sub-statuses, so no false-fire. */
    A(653,!(N(U.Section80P)>0)||stat==="14","Schedule VI-A: 80P can be claimed only by a co-operative society (Primary Agricultural Credit Society / Primary Co-operative Agricultural and Rural Development Bank / other co-operative society).");

    /* ---- 662: 80GGC is not available to a Local Authority or an AJP ----
       Status "2" = Local Authority, "9" = Artificial Juridical Person. */
    A(662,!(N(U.Section80GGC)>0)||(stat!=="2"&&stat!=="9"),"Schedule VI-A: a deduction u/s 80GGC is not allowed for status Local Authority or Artificial Juridical Person.");

    /* ---- 663: 80LA(1) and 80LA(1A) cannot be claimed together ---- */
    A(663,!(N(U.Section80LA)>0&&N(U.Section80LA_1A)>0),"Schedule VI-A: 80LA(1) and 80LA(1A) cannot both be claimed together.");
    /* ---- 664: 80LA(1A) needs IFSC convertible-forex flag = Yes ---- */
    A(664,!(N(U.Section80LA_1A)>0)||fx,"Schedule VI-A: 80LA(1A) can be claimed only when the IFSC convertible-foreign-exchange answer in Part A-General is Yes.");
    /* ---- 665: 80LA(1) needs IFSC convertible-forex flag = No ---- */
    A(665,!(N(U.Section80LA)>0)||!fx,"Schedule VI-A: 80LA(1) can be claimed only when the IFSC convertible-foreign-exchange answer in Part A-General is No.");

    /* ---- 666: 80P claimed but Schedule 80P not filled ---- */
    A(666,!(N(U.Section80P)>0)||!!I.Schedule80P,"Schedule VI-A: an 80P deduction is claimed but Schedule 80P is not filled.");

    /* ---- 667/668: 80-IAC vs Schedule 80-IAC (Sl.No 6) ---- */
    if(I.Schedule80IAC) A(667,N(U.Section80IAC)<=totIAC+1,"Schedule VI-A: the 80-IAC deduction claimed cannot be higher than the amount in Schedule 80-IAC (Sl. No. 6).");
    A(668,!(N(U.Section80IAC)>0)||!!I.Schedule80IAC,"Schedule VI-A: an 80-IAC deduction is claimed but Schedule 80-IAC is not filled.");

    /* ---- 669/670: 80-LA(1) vs Schedule 80-LA (Sl.No 8 = Total) ---- */
    if(I.Schedule80LA) A(669,N(U.Section80LA)<=totLA+1,"Schedule VI-A: the 80-LA(1) deduction claimed cannot be higher than the total in Schedule 80-LA (Sl. No. 8).");
    A(670,!(N(U.Section80LA)>0)||!!I.Schedule80LA,"Schedule VI-A: an 80LA(1) deduction is claimed but Schedule 80LA is not filled.");
    /* ---- 671/672: 80-LA(1A) vs Schedule 80-LA (Sl.No 8 = Total) ---- */
    if(I.Schedule80LA) A(671,N(U.Section80LA_1A)<=totLA+1,"Schedule VI-A: the 80-LA(1A) deduction claimed cannot be higher than the total in Schedule 80-LA (Sl. No. 8).");
    A(672,!(N(U.Section80LA_1A)>0)||!!I.Schedule80LA,"Schedule VI-A: an 80LA(1A) deduction is claimed but Schedule 80LA is not filled.");

    /* ---- 673/674/675: the eligible (allowed) amount cannot exceed the
       user-enterable (claimed) amount, per line ---- */
    A(673,N(D.Section80GGA)<=N(U.Section80GGA)+1,"Schedule VI-A: the eligible amount of deduction u/s 80GGA cannot be more than the amount claimed (user-enterable).");
    A(674,N(D.Section80GGC)<=N(U.Section80GGC)+1,"Schedule VI-A: the eligible amount of deduction u/s 80GGC cannot be more than the amount claimed (user-enterable).");
    A(675,N(D.Section80G)<=N(U.Section80G)+1,"Schedule VI-A: the eligible amount of deduction u/s 80G cannot be more than the amount claimed (user-enterable).");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     654 — "Deduction u/s 80GGA will be allowed only to an assessee having
           no business income." Whether business income exists is the
           post-BFLA business figure (S.C.loss.afterB.bus), a derived
           quantity of the loss/BP chain with no single schema field; the
           only near proxy (PartA_GEN1.FilingStatus.IncFrmBusOrProf) is a
           Y/N flag that is Yes even on a business LOSS, so a literal
           encoding would false-fire on a lawful firm claiming 80GGA
           against a business loss. Left to the section's own compute.
     655 — "Deduction u/s 80-IA (Sl. 2d) cannot be more than the non-
           speculative, non-specified and non-presumptive business income."
           The cap operand is the derived business-income pool
           (business income after BFLA less 44AD/44ADA/44AE), not a single
           schema leaf; reconstructing it from ScheduleBFLA/CorpScheduleBP
           across many steps would false-fire on lawful returns.
     657 — same derived business-income-pool cap, for 80JJAA (Sl. 2k).
     658 — same derived business-income-pool cap, for 80IAB (Sl. 2e).
     659 — same derived business-income-pool cap, for 80IBA (Sl. 2h).
     660 — same derived business-income-pool cap, for 80JJA (Sl. 2j).
     661 — same derived business-income-pool cap, for 80IAC (Sl. 2f).
     ------------------------------------------------------------------ */
});
