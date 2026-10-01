/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_18 (Phase 6).
   Serial range A863–A868 (Schedule VI-A deduction caps + Verification).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N()); nothing throws. Keys are the built-return ITR6 schema
   paths; they were taken from sources/ITR-6 schema, books/ITR-6/VIA.md and
   books/ITR-6/Verification.md, and the built sections (70_sec_ded /
   70_sec_gen / 70_sec_who). Encoded from each rule's own text
   (constitution rule 6).

   Schedule VI-A carries every Chapter-VI-A item in TWO columns: the filer's
   claim `UsrDeductUndChapVIA` (the "user enterable amount") and the
   system-calculated allowed/eligible figure `DeductUndChapVIA`. The A86x
   deduction-cap rules assert the eligible (allowed) figure never exceeds
   the user-enterable claim for its section.

   Note on A867: the ITR-6 schema's representative object
   (FilingStatus.AssesseeRep) carries only RepName / RepEmailID /
   CountryCodeRepMobileNo / RepMobileNo — there is NO capacity/address/
   PAN-of-representative leaf, so of the four items the rule names only the
   representative's NAME exists in the schema; it is the one enforced here.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";            /* "present / non-blank" */
  const P=v=>String(v==null?"":v).replace(/\s/g,"").toUpperCase(); /* PAN normalise */

  /* ---- shared Part A General / Verification reads ---- */
  const OF =RG(I,"PartA_GEN1.OrgFirmInfo",{})||{};
  const FS =RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const REP=RG(FS,"AssesseeRep",{})||{};
  const G2 =RG(I,"PartA_GEN2For6",{})||{};

  /* =====================================================================
     Schedule VI-A — the eligible (allowed) deduction of a section must not
     exceed the user-enterable claim for that section. Both columns are 0
     on a zero-skeleton, so 0<=0 keeps an empty return silent.
     ===================================================================== */
  if(I.ScheduleVIA){
    const USR=RG(I,"ScheduleVIA.UsrDeductUndChapVIA",{})||{};
    const DED=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};
    const cap=(k)=>N(DED[k])<=N(USR[k]);

    /* A863 — 80LA(1A): certain income of an International Financial Services
       (IFSC) Unit. Eligible amount must not exceed the user-enterable amount. */
    A(863, cap("Section80LA_1A"),
      "Schedule VI-A: eligible deduction u/s 80LA (certain income of an International Financial Services Unit) cannot be more than the user-enterable amount.");

    /* A864 — 80M: inter-corporate dividends. Eligible ≤ user-enterable. */
    A(864, cap("Section80M"),
      "Schedule VI-A: eligible deduction u/s 80M cannot be more than the user-enterable amount.");

    /* A865 — 80PA: certain income of producer companies. Eligible ≤ user-enterable. */
    A(865, cap("Section80PA"),
      "Schedule VI-A: eligible deduction u/s 80PA cannot be more than the user-enterable amount.");

    /* A866 — 80-IA: profits of infrastructure undertakings. Eligible ≤ user-entered. */
    A(866, cap("Section80IA"),
      "Schedule VI-A: eligible deduction u/s 80-IA cannot be more than the user-entered amount.");
  }

  /* =====================================================================
     Verification — the closing declaration (who signs and in what capacity).
     ===================================================================== */
  if(I.Verification){
    const DEC=RG(I,"Verification.Declaration",{})||{};

    /* A867 — verification capacity is "Representative assessee" (RA) ⇒ the
       representative's details in Part A General are mandatory. Of the four
       items the rule names (name, capacity, address, PAN/Aadhaar) only the
       representative's NAME exists as a schema leaf (AssesseeRep.RepName). */
    A(867, DEC.Capacity!=="RA" || S0(REP.RepName),
      "Verification: when the verification capacity is 'Representative assessee', the representative's details (name) in Part A General are mandatory.");

    /* A868 — a domestic company ⇒ the PAN given at Verification must match one
       of the PANs entered against the Key persons in Part A General. */
    const verPAN=P(DEC.AssesseeVerPAN);
    const kps=RG(G2,"KeyPersons",[])||[];
    A(868, OF.DomesticCompFlg!=="Y" || !S0(DEC.AssesseeVerPAN) ||
        kps.some(function(k){return k && P(k.KeyPerPAN)===verPAN;}),
      "Verification: for a domestic company the PAN entered at Verification must match one of the PANs entered against the Key persons in Part A General.");
  }
});
