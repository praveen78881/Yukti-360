/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_01 (Phase 6).
   Serial range A1–A57 (Schedule PI + Part A-General: identity, sub-status,
   registration/approval table vs the exemption section, other details A23–A26,
   and audit information). Registered via ruleset(fn); runRules() invokes it
   with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / (X||{}) / N()); nothing throws. Keys are the built-return ITR7 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths and the enum
   codes were taken from sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json,
   books/ITR-7/PI.md + Audit.md and the built section 70_sec_who.js (expWho).
   Encoded from each rule's own text (constitution rule 6).

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Serials in A1–A57 NOT encoded here, and why (they stay bucketed in the
   census — 12 ENFORCED-target to finish in the fan-out, and 7 NA/OFFLINE —
   never faked):
     A1  — OFFLINE-IMPOSSIBLE (name vs PAN database; external DB not shipped).
     A4/A22/A46/A48/A51/A54 — NA (compared to the date of filing, which the
            built return does not carry, or resolved by the portal at upload).
     A28/A29 — GPU u/s 2(15) "percentage of receipt" / "aggregate receipts"
            (2(15) trade-test sub-fields + >20% derivation).
     A34/A35/A36/A37 — exemption-section ⇒ Schedule IE-1/IE-2/IE-3/IE-4 must be
            filled (cross-schedule presence).
     A43/A44 — A26 / A26(a) keyed to A23(i) sum-of-receipts > 20% (2(15)).
     A45 — LEI mandatory when refund ≥ ₹50 crore (needs Part B-TTI refund).
     A50/A53 — exemption ⇒ Schedule J/A/AI/115BBI / ET must be present
            (cross-schedule presence; false-fire risk until those blocks emit).
     A52 — A26(a) "yes" but A23(i) not > 20% (2(15) derivation).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */

  /* ---- Part A General reads (guarded) ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const ADDR= RG(OI,"Address",{})||{};
  const FS  = RG(G1,"FilingStatus",{})||{};
  const G2  = RG(I,"PartA_GEN2",{})||{};
  const OD  = RG(G2,"OtherDetailsFor7",{})||{};
  const regITA = RG(G1,"RegApprUnderITADtls",[])||[];   /* registration under the Income-tax Act */
  const regOth = RG(G1,"RegApprUnderOthITADtls",[])||[];/* registration under any other law */
  const aud    = RG(G2,"AuditDetails",[])||[];

  const doi   = OI.DateOFFormOrIncorp;                  /* date of formation/incorporation (ISO) */
  const status= String(OI.StatusOrCompanyType==null?"":OI.StatusOrCompanyType);
  const sub   = String(OI.SubStatus==null?"":OI.SubStatus);
  const exsec = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);
  const ret   = String(OI.ReturnFurnishedSec==null?"":OI.ReturnFurnishedSec);

  const regHas   = code => regITA.some(r=>r && String(r.SectionRegistered)===code);
  const inList   = (v,arr)=>arr.indexOf(v)>=0;
  const PCT      = "5vii";                              /* SubStatus = Public Charitable Trust */
  const AOP_SUB  = ["5i","5v","5vii"];                  /* SubStatus options when status = AOP/BOI */
  const CO_SUB   = ["7i","7ii"];                        /* SubStatus options when status = Company */
  /* 10(23C)(iv/v/vi/via) exemption codes and 139(4C) permitted exemption set */
  const EX_23C   = ["23CIV","23CV","23CVI","23CVIA"];
  const EX_4C    = ["21","23A","23AAA","23B","23EC","23ED","23EE","29A","23CIIIAB","23CIIIAC",
                    "23CIIIAD","23CIIIAE","23D","23DA","23FB","24","26","46A","46B","47",
                    "23CIV","23CV","23CVI","23CVIA"];

  /* A2 — Schedule PI: country India ⇒ mobile is exactly 10 digits. */
  const mob=String(ADDR.MobileNo==null?"":ADDR.MobileNo).replace(/\D/g,"");
  A(2, ADDR.CountryCode!=="91" || mob==="" || mob.length===10,
    "Schedule PI: with country India the mobile number must be exactly 10 digits.");

  /* A3 — status AOP/BOI (5) ⇒ sub-status is Society / Any-other-AOP-BOI / Public Charitable Trust. */
  A(3, status!=="5" || sub==="" || inList(sub,AOP_SUB),
    "Schedule PI: when the status is AOP/BOI the sub-status must be Society, Any other AOP/BOI or Public Charitable Trust.");

  /* A5 — registration date (Income-tax Act table) not earlier than the date of formation/incorporation. */
  A(5, !S0(doi) || regITA.every(r=>!r||!S0(r.RegApprovalDate)||r.RegApprovalDate>=doi),
    "Schedule PI: date of registration/approval under the Income-tax Act cannot be earlier than the date of formation/incorporation.");

  /* --- A6..A21 · the registration-table code ⇔ exemption-section pairing.
     For each (reg code, exemption code): (odd) reg selected ⇒ exemption matches;
     (even) exemption selected ⇒ registration details furnished. --- */
  /* A6 — 12A/12AB (VI) selected in the table ⇒ exemption claimed is Section 11. */
  A(6, !regHas("VI") || exsec==="11",
    "Part A-General: Section 12A/12AB is in the registration table but the section under which exemption is claimed is not Section 11.");
  /* A7 — exemption Section 11 ⇒ 12A/12AB (VI) registration furnished. */
  A(7, exsec!=="11" || regHas("VI"),
    "Part A-General: Section 11 is claimed but 12A/12AB registration details are not furnished.");
  /* A8 — 10(23C)(iv) (II) in the table ⇒ exemption is 10(23C)(iv). */
  A(8, !regHas("II") || exsec==="23CIV",
    "Part A-General: Section 10(23C)(iv) is in the registration table but the exemption claimed is not Section 10(23C)(iv).");
  /* A9 — exemption 10(23C)(iv) ⇒ 10(23C)(iv) (II) approval furnished. */
  A(9, exsec!=="23CIV" || regHas("II"),
    "Part A-General: Section 10(23C)(iv) is claimed but its approval details are not furnished.");
  /* A10 — 10(23C)(v) (III) in the table ⇒ exemption is 10(23C)(v). */
  A(10, !regHas("III") || exsec==="23CV",
    "Part A-General: Section 10(23C)(v) is in the registration table but the exemption claimed is not Section 10(23C)(v).");
  /* A11 — exemption 10(23C)(v) ⇒ 10(23C)(v) (III) approval furnished. */
  A(11, exsec!=="23CV" || regHas("III"),
    "Part A-General: Section 10(23C)(v) is claimed but its approval details are not furnished.");
  /* A12 — 10(23C)(vi) (IV) in the table ⇒ exemption is 10(23C)(vi). */
  A(12, !regHas("IV") || exsec==="23CVI",
    "Part A-General: Section 10(23C)(vi) is in the registration table but the exemption claimed is not Section 10(23C)(vi).");
  /* A13 — exemption 10(23C)(vi) ⇒ 10(23C)(vi) (IV) approval furnished. */
  A(13, exsec!=="23CVI" || regHas("IV"),
    "Part A-General: Section 10(23C)(vi) is claimed but its approval details are not furnished.");
  /* A14 — 10(23C)(via) (V) in the table ⇒ exemption is 10(23C)(via). */
  A(14, !regHas("V") || exsec==="23CVIA",
    "Part A-General: Section 10(23C)(via) is in the registration table but the exemption claimed is not Section 10(23C)(via).");
  /* A15 — exemption 10(23C)(via) ⇒ 10(23C)(via) (V) approval furnished. */
  A(15, exsec!=="23CVIA" || regHas("V"),
    "Part A-General: Section 10(23C)(via) is claimed but its approval details are not furnished.");
  /* A16 — 10(23AAA) (I) in the table ⇒ exemption is 10(23AAA). */
  A(16, !regHas("I") || exsec==="23AAA",
    "Part A-General: Section 10(23AAA) is in the registration table but the exemption claimed is not Section 10(23AAA).");
  /* A17 — exemption 10(23AAA) ⇒ 10(23AAA) (I) approval furnished. */
  A(17, exsec!=="23AAA" || regHas("I"),
    "Part A-General: Section 10(23AAA) is claimed but its approval details are not furnished.");
  /* A18 — 13B (VIII) in the table ⇒ exemption is 13B. */
  A(18, !regHas("VIII") || exsec==="13B",
    "Part A-General: Section 13B is in the registration table but the exemption claimed is not Section 13B.");
  /* A19 — exemption 13B ⇒ 13B (VIII) approval furnished. */
  A(19, exsec!=="13B" || regHas("VIII"),
    "Part A-General: Section 13B is claimed but its approval details are not furnished.");
  /* A20 — exemption 10(21) or 10(21) r.w.s. 35(1) ⇒ 35 (IX) approval furnished. */
  A(20, !inList(exsec,["21","2135I"]) || regHas("IX"),
    "Part A-General: Section 10(21) / 10(21) r.w.s. 35(1) is claimed but the approval u/s 35 is not furnished.");
  /* A21 — 35 (IX) in the table ⇒ exemption is 10(21) or 10(21) r.w.s. 35(1). */
  A(21, !regHas("IX") || inList(exsec,["21","2135I"]),
    "Part A-General: Section 35 is in the registration table but the exemption claimed is not Section 10(21) / 10(21) r.w.s. 35(1).");

  /* A23 — registration date (any-other-law table) not earlier than the date of formation/incorporation. */
  A(23, !S0(doi) || regOth.every(r=>!r||!S0(r.RegApprDate)||r.RegApprDate>=doi),
    "Schedule PI: date of registration/approval under a law other than the Income-tax Act cannot be earlier than the date of formation/incorporation.");

  /* A24 — return furnished u/s 139(4A) ⇒ exemption claimed is Section 11. */
  A(24, ret!=="139-4A" || exsec==="11",
    "Part A-General: with return furnished u/s 139(4A) the exemption claimed must be Section 11.");
  /* A25 — return furnished u/s 139(4B) ⇒ exemption is Section 13A or 13B. */
  A(25, ret!=="139-4B" || inList(exsec,["13A","13B"]),
    "Part A-General: with return furnished u/s 139(4B) the exemption claimed must be Section 13A or 13B.");
  /* A26 — return furnished u/s 139(4C) ⇒ exemption is one of the permitted 10(-) clauses. */
  A(26, ret!=="139-4C" || inList(exsec,EX_4C),
    "Part A-General: with return furnished u/s 139(4C) the exemption claimed must be one of the permitted Section 10 clauses.");
  /* A27 — return furnished u/s 139(4D) ⇒ exemption is 10(21) r.w.s. 35(1). */
  A(27, ret!=="139-4D" || exsec==="2135I",
    "Part A-General: with return furnished u/s 139(4D) the exemption claimed must be Section 10(21) read with section 35(1).");

  /* A30 — change in objects/activities during the year (A24 i = Yes) ⇒ the details must be provided. */
  A(30, OD.ChangeInActivitiesDuringYr!=="Y" || S0(OD.DateOfChange),
    "Part A-General (Other details): when there is a change in the objects/activities during the year the details of that change must be provided.");
  /* A31 — date of change (A24 ii A) within the previous year and not before the date of formation/incorporation. */
  A(31, OD.ChangeInActivitiesDuringYr!=="Y" || !S0(OD.DateOfChange) ||
      (OD.DateOfChange>="2025-04-01" && OD.DateOfChange<="2026-03-31" && (!S0(doi)||OD.DateOfChange>=doi)),
    "Part A-General (Other details): the date of change of objects must fall within the previous year and not be before the date of formation/incorporation.");
  /* A32 — date of fresh registration (A24 ii D) not before the date of change of objects (A24 ii A). */
  A(32, !S0(OD.DateOfFreshReg) || !S0(OD.DateOfChange) || OD.DateOfFreshReg>=OD.DateOfChange,
    "Part A-General (Other details): the date of fresh registration cannot be before the date of change of objects/activities.");
  /* A33 — same date-of-fresh-registration ≥ date-of-change ordering (enforceable half of A33). */
  A(33, !S0(OD.DateOfFreshReg) || !S0(OD.DateOfChange) || OD.DateOfFreshReg>=OD.DateOfChange,
    "Part A-General (Other details): the date of fresh registration (A24 ii D) cannot precede the date of change of objects (A24 ii A).");

  /* A38 — political party claiming exemption u/s 13A ⇒ sub-status cannot be Public Charitable Trust. */
  A(38, exsec!=="13A" || sub!==PCT,
    "Part A-General: a political party claiming exemption u/s 13A cannot have sub-status Public Charitable Trust.");
  /* A39 — electoral trust claiming exemption u/s 13B ⇒ sub-status cannot be Public Charitable Trust. */
  A(39, exsec!=="13B" || sub!==PCT,
    "Part A-General: an electoral trust claiming exemption u/s 13B cannot have sub-status Public Charitable Trust.");
  /* A40 — a Domestic Company (status Company, sub-status Domestic) cannot be a non-resident. */
  A(40, !(status==="7" && sub==="7i") || FS.ResidentialStatus!=="NRI",
    "Schedule PI: a domestic company cannot be a non-resident.");

  /* A41 — exemption Section 11 or 10(23C)(iv/v/vi/via) ⇒ registration/approval details are furnished. */
  A(41, !(exsec==="11" || inList(exsec,EX_23C)) || regITA.length>0,
    "Part A-General: Section 11 or 10(23C)(iv)/(v)/(vi)/(via) is claimed but registration/approval details are not furnished.");
  /* A42 — exemption 10(21) r.w.s. 35(1) ⇒ the s.35 approval is furnished. */
  A(42, exsec!=="2135I" || regHas("IX"),
    "Part A-General: Section 10(21) read with section 35(1) is claimed but the approval u/s 35 is not furnished.");

  /* A47 — effective date of registration (Income-tax Act table) not earlier than the date of formation/incorporation. */
  A(47, !S0(doi) || regITA.every(r=>!r||!S0(r.EffectiveDate)||r.EffectiveDate>=doi),
    "Schedule PI: the effective date of registration/approval under the Income-tax Act cannot be earlier than the date of formation/incorporation.");
  /* A49 — effective date of registration (any-other-law table) not earlier than the date of formation/incorporation. */
  A(49, !S0(doi) || regOth.every(r=>!r||!S0(r.EffectiveDate)||r.EffectiveDate>=doi),
    "Schedule PI: the effective date of registration under a law other than the Income-tax Act cannot be earlier than the date of formation/incorporation.");

  /* A55 — audit information: the audit-report furnishing date cannot be prior to 01-04-2026. */
  A(55, aud.every(r=>!r||!S0(r.AuditReportFurnishDate)||r.AuditReportFurnishDate>="2026-04-01"),
    "Audit Information: the date of the audit report cannot be prior to 01-04-2026.");
  /* A56 — status Company (7) ⇒ sub-status is Domestic Company or Foreign Company. */
  A(56, status!=="7" || sub==="" || inList(sub,CO_SUB),
    "Schedule PI: when the status is Company the sub-status must be Domestic Company or Foreign Company.");
  /* A57 — Part A-General Sl. No. A24(i) (change in objects during the year) must be answered. */
  A(57, S0(OD.ChangeInActivitiesDuringYr),
    "Part A-General (Other details): Sl. No. A24(i) — whether there was a change in the objects/activities during the year — must be answered.");
});
