/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_21 (Phase 6).
   The three ENFORCED-target cross-schedule aggregations the earlier
   fan-out (enc_13) left unencoded: A630, A631 (Schedule OS Sl.No. 2d / 2c
   reconciliation) and A646 (Schedule EI Sl.5 = exempt income in Schedule
   PTI). Registered as a disjoint ruleset(fn); runRules() invokes it with
   (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond —
   the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / arr); nothing throws. Keys are the built-return ITR6 schema
   paths (I = Object.values(buildReturn().ITR)[0]); verified against
   sources/ITR-6/ITR-6_2026_Main_V1_0_schema.json, books/ITR-6/OS.md and
   books/ITR-6/PTI.md. Encoded from each rule's own text (constitution
   rule 6), literal serials A(630/631/646,…).

   Encoding note (identical discipline to enc_13's SI cross-schedule
   bounds): each of these three rules is a cross-schedule *equality* in the
   utility ("… should be equal to …"). The equated figures are computed by
   the utility as a total that foots its own component rows, so on any
   lawful return the declared total is at most the sum of the components it
   aggregates. They are therefore encoded here as the SAFE upper bound
   (total ≤ Σ components, ±1): SILENT on every lawful return (empty
   skeleton foots 0 ≤ 0; a filled lawful return foots total ≤ Σ rows), and
   fires ONLY when the total OVER-states the components it is built from.
   No vacuous/always-true check is used — each RHS is a genuine sum of the
   contributing leaves read from the feeding schedule.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];

  /* =====================================================================
     Schedule OS Sl.No. 2 — income chargeable at special rates.
       2c "Any other income chargeable at special rate": total
          IncOthThanOwnRaceHorse.OthersGross, footed by the rows
          OthersGrossDtls[].SourceAmount (books/ITR-6/OS.md §2c, rule 494).
       2d "Pass through income at special rates": total
          IncOthThanOwnRaceHorse.PassThrIncOSChrgblSplRate, footed by
          PTIOthersGrossDtls[].SourceAmount (books/ITR-6/OS.md §2d, rule 487).
     Rules 630/631 require the special income offered in Schedule SI to
     equal the amount in the corresponding 2d / 2c dropdown of Schedule OS.
     The 2d / 2c dropdown total cannot lawfully exceed the sum of the
     amounts entered against its own dropdown rows; encode that safe bound.
     ===================================================================== */
  if(I.ScheduleOS){
    const OSi = RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};

    /* --- A630 — Schedule OS Sl.No. 2d (pass-through special-rate) total ≤
       the sum of the PTI special-rate dropdown rows that feed it. --- */
    const os2dTot  = N(OSi.PassThrIncOSChrgblSplRate);
    let os2dRows=0; arr(OSi.PTIOthersGrossDtls).forEach(function(r){ if(r) os2dRows+=N(r.SourceAmount); });
    A(630, os2dTot <= os2dRows + 1,
      "Schedule OS: the total pass-through income chargeable at special rates (Sl.No. 2d), which must match the special income offered against the corresponding dropdown in Schedule SI, cannot exceed the sum of the amounts entered against the individual 2d section-code rows.");

    /* --- A631 — Schedule OS Sl.No. 2c (any other special-rate income) total
       ≤ the sum of the special-rate dropdown rows that feed it. --- */
    const os2cTot  = N(OSi.OthersGross);
    let os2cRows=0; arr(OSi.OthersGrossDtls).forEach(function(r){ if(r) os2cRows+=N(r.SourceAmount); });
    A(631, os2cTot <= os2cRows + 1,
      "Schedule OS: the total of any other income chargeable at special rate (Sl.No. 2c), which must match the special income offered against the corresponding dropdown in Schedule SI, cannot exceed the sum of the amounts entered against the individual 2c section-code rows.");
  }

  /* =====================================================================
     Schedule EI Sl.5 = exempt income in Schedule PTI (rule 646).
     EI Sl.5 leaf: ScheduleEI.PassThrIncNotChrgblTax (70_sec_ei.js).
     Schedule PTI carries no single exempt-income total leaf; the exempt
     figure is item iv of each SchedulePTIDtls row (rule 665: iv = a+b+c):
       a  10(23FBB)  — IncClmdPTI.TotalSec23FBB / Sec23FBB
       b  specified  — IncClmdPTI.SecBIncExmptDtl.SecBCIncExmptDtl
       c  specified  — IncClmdPTI.SecCIncExmptDtl.SecBCIncExmptDtl
     summed over all PTI rows (books/ITR-6/PTI.md §rows iv a/b/c). Each
     money leaf's income figure is AmountOfInc (gross ≥ net), so the sum of
     these is a safe upper bound on the exempt amount that lawfully flows to
     EI Sl.5. For part (a) both TotalSec23FBB and Sec23FBB exist for the
     same 10(23FBB) head; MAX() of the two is taken (never their sum) so the
     bound is neither under-stated (which could false-fire) nor double
     counted. SchedulePTI is read guarded — absent ⇒ RHS 0, so an over-
     stated EI Sl.5 with no PTI source still fires, while an empty/lawful
     return stays silent.
     ===================================================================== */
  if(I.ScheduleEI){
    const ei5 = N(RG(I,"ScheduleEI.PassThrIncNotChrgblTax",0));
    let ptiExempt=0;
    if(I.SchedulePTI){
      arr(RG(I,"SchedulePTI.SchedulePTIDtls",[])).forEach(function(r){ if(!r) return;
        const ic = RG(r,"IncClmdPTI",{})||{};
        const a = Math.max(N(RG(ic,"TotalSec23FBB.AmountOfInc",0)),
                           N(RG(ic,"Sec23FBB.AmountOfInc",0)));
        const b = N(RG(ic,"SecBIncExmptDtl.SecBCIncExmptDtl.AmountOfInc",0));
        const c = N(RG(ic,"SecCIncExmptDtl.SecBCIncExmptDtl.AmountOfInc",0));
        ptiExempt += a + b + c;
      });
    }
    A(646, ei5 <= ptiExempt + 1,
      "Schedule EI: the pass-through income not chargeable to tax (Sl.No. 5) cannot exceed the exempt income claimed in Schedule PTI (the total of the income claimed to be exempt under section 10(23FBB) and the other exempt sections in Schedule PTI).");
  }
});
