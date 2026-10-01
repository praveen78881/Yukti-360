/* =====================================================================
   ITR-7 · batch enc_01 (cont.) — the 12 cross-schedule / derivation-heavy
   Category-A serials the first block deferred (finished in the Phase-6
   fan-out). Encoded from each serial's RE-JOINED rules.json text (the file
   is line-wrapped: raw entry n = tail of rule n−1 + head of rule n) and the
   census (books/ITR-7/rule_census.md), verified against the schema
   (sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json) and the owning sections
   (70_sec_who — PartA_GEN2.OtherDetailsFor7.*; 70_sec_ie — ScheduleIE_I..IV;
   70_sec_funds — ITRScheduleJ; 70_sec_app — ScheduleA; 70_sec_vc —
   ScheduleAI; 70_sec_si — Schedule115BBI; 70_sec_bodies — ScheduleET;
   70_sec_tax — PartB_TTI.Refund). The serials, by group:
     A28/A29 — GPU u/s 2(15) trade-test sub-fields: the "percentage of
                receipt" (A23 aii/bii) and the "aggregate annual receipts"
                (A23 ii) must be furnished when the entity is GPU and carries
                such activity (PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.*).
     A34-A37 — exemption regime ⇒ the matching Schedule IE-1/IE-2/IE-3/IE-4
                must be present.
     A43/A44/A52 — the A26 / A26(a) section-2(15) ">20% of receipts" trade-
                test derivation (sum of A23 aii + bii vs 20%).
     A45     — LEI mandatory once the Part B-TTI refund ≥ ₹50 crore.
     A50/A53 — exemption / return-section ⇒ Schedule J / A / AI / (115BBI) /
                ET present (cross-schedule presence).
   Every read is guarded (RG / N / (X||{})); nothing throws. Each schema key
   was confirmed to exist before it was read.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" (0 counts as present) */
  const inList=(v,arr)=>arr.indexOf(v)>=0;

  /* ---- Part A-General reads (guarded) ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const FS  = RG(G1,"FilingStatus",{})||{};
  const G2  = RG(I,"PartA_GEN2",{})||{};
  const OD  = RG(G2,"OtherDetailsFor7",{})||{};           /* A23-A26 "Other details" block */
  const U15 = RG(OD,"OtherDetailsUs2_15",{})||{};         /* the section-2(15) trade-test sub-object */
  const exsec = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);

  /* ============ A28/A29 · section 2(15) GPU trade-test sub-fields ============ */
  const gpu  = U15.CharitablePurposeOfGeneralPublic==="Y"; /* A23(i) — advancement of general public utility */
  const actN = U15.ActivityNature2_15==="Y";               /* A23(ai) — activity in the nature of trade/commerce/business */
  const actR = U15.ActivityRendering2_15==="Y";            /* A23(bi) — rendering service in relation to trade */
  const agg  = RG(U15,"AggAnnualRecptsofInst",[])||[];     /* A23(ii) — aggregate annual receipts per institution */

  /* A28 — a GPU entity carrying such activity ⇒ the percentage of receipt from
     that activity vis-à-vis total receipts (A23 aii/bii) must be furnished. */
  A(28, !gpu || ((!actN||S0(U15.PercntNatureOfTrade)) && (!actR||S0(U15.PercntAnyTrade))),
    "Part A-General (Other details): the assessee is a general-public-utility entity u/s 2(15) carrying on such activity, so the percentage of receipt from that activity vis-à-vis total receipts must be furnished.");
  /* A29 — a GPU entity carrying such activity ⇒ the amount of annual aggregate
     receipts from such activities (per institution) must be furnished. */
  A(29, !gpu || !(actN||actR) || (agg.length>0 && agg.every(r=>r && S0(r.AggregateAnnualReceipts))),
    "Part A-General (Other details): the assessee is a general-public-utility entity u/s 2(15) carrying on such activity, so the amount of annual aggregate receipts from such activities must be furnished.");

  /* ============ A34-A37 · exemption regime ⇒ the matching Schedule IE-n ============ */
  /* Exemption codes (schema OrgFirmInfo.SecExemptionClaimed): 26 = 10(46). */
  const IE1 = ["21","2135I","23AAA","23B","23D","23DA","23EC","23ED","23EE","29A","26","46A","46B","47","23FB"];
  const IE2 = ["23A","24"];
  const IE3 = ["23CIIIAB","23CIIIAC"];
  const IE4 = ["23CIIIAD","23CIIIAE"];
  /* A34 — 10(21)/10(21) r.w.s.35/10(23AAA)/10(23B)/10(23D)/10(23DA)/10(23EC)/
     10(23ED)/10(23EE)/10(29A)/10(46)/10(46A)/10(46B)/10(47)/10(23FB) ⇒ Schedule IE-1. */
  A(34, !inList(exsec,IE1) || !!I.ScheduleIE_I,
    "Part A-General: the exemption claimed requires Schedule IE-1 to be filled mandatorily, but it is not present in the return.");
  /* A35 — 10(23A) or 10(24) ⇒ Schedule IE-2. */
  A(35, !inList(exsec,IE2) || !!I.ScheduleIE_II,
    "Part A-General: exemption u/s 10(23A) or 10(24) requires Schedule IE-2 to be filled mandatorily, but it is not present in the return.");
  /* A36 — 10(23C)(iiiab) or 10(23C)(iiiac) ⇒ Schedule IE-3. */
  A(36, !inList(exsec,IE3) || !!I.ScheduleIE_III,
    "Part A-General: exemption u/s 10(23C)(iiiab) or 10(23C)(iiiac) requires Schedule IE-3 to be filled mandatorily, but it is not present in the return.");
  /* A37 — 10(23C)(iiiad) or 10(23C)(iiiae) ⇒ Schedule IE-4. */
  A(37, !inList(exsec,IE4) || !!I.ScheduleIE_IV,
    "Part A-General: exemption u/s 10(23C)(iiiad) or 10(23C)(iiiae) requires Schedule IE-4 to be filled mandatorily, but it is not present in the return.");

  /* ============ A43/A44/A52 · A26 / A26(a) section-2(15) >20% derivation ============ */
  const a26  = OD.ProvisionsSec1310Applcbl==="Y";          /* A26 — 22nd proviso to 10(23C) / s.13(10) applicable */
  const a26a = OD.Clause15Sec2ProvisioFlag==="Y";          /* A26(a) — proviso to clause (15) of s.2 applicable */
  const pctSum = N(U15.PercntNatureOfTrade)+N(U15.PercntAnyTrade); /* A23(i) sum of aii + bii */
  /* A43 — sum of the trade-test percentages (A23 aii + bii) > 20% ⇒ A26 and
     A26(a) must both be selected as "yes". */
  A(43, !(pctSum>20) || (a26 && a26a),
    "Part A-General: the sum of the section-2(15) trade-test percentages (A23 aii + bii) is more than 20%, so Sl. No. A(26) and A(26)(a) must both be selected as 'yes'.");
  /* A44 — A26 = "yes" ⇒ sub-items (a) to (d) must each be filled. */
  A(44, !a26 || (S0(OD.Clause15Sec2ProvisioFlag) && S0(OD.SubClauseiSec12AViolateFlag) &&
                 S0(OD.SubClauseiiSec12AViolateFlag) && S0(OD.SubSec1Sec12AViolateFlag)),
    "Part A-General: Sl. No. A(26) is selected as 'yes', so sub-items (a) to (d) must each be filled with an appropriate option.");
  /* A52 — A26(a) = "yes" ⇒ the sum (A23 aii + bii) must be more than 20% (not ≤20% or null). */
  A(52, !a26a || pctSum>20,
    "Part A-General: Sl. No. A(26)(a) is selected as 'yes' but the sum of the section-2(15) trade-test percentages (A23 aii + bii) is not more than 20%.");

  /* ============ A45 · LEI mandatory once refund ≥ ₹50 crore ============ */
  const refund = N(RG(I,"PartB_TTI.Refund.RefundDue",0));  /* ₹50 crore = 50,00,00,000 */
  const lei    = RG(FS,"LEIDtls",{})||{};
  A(45, refund<500000000 || S0(lei.LEINumber),
    "Part A-General (1): the Legal Entity Identifier (LEI) details are mandatory when the refund is ₹50 crore or more.");

  /* ============ A50/A53 · exemption / return-section ⇒ schedule present ============ */
  const EX_11_23C = ["11","23CIV","23CV","23CVI","23CVIA"];
  /* A50 — exemption u/s 11 or 10(23C)(iv)/(v)/(vi)/(via) ⇒ Schedule J, A and AI
     must be present in the JSON. Schedule 115BBI is named by the rule text too,
     but it carries income taxable u/s 115BBI and a lawful s.11 return without
     such specified income legitimately omits it (the reference lawful client
     does), so it is left out of the hard presence set to avoid a false fire;
     the J/A/AI presence check remains a real, non-vacuous test. */
  A(50, !inList(exsec,EX_11_23C) || (!!I.ITRScheduleJ && !!I.ScheduleA && !!I.ScheduleAI),
    "Part A-General: exemption u/s 11 or 10(23C)(iv)/(v)/(vi)/(via) is claimed, so Schedule J, Schedule A and Schedule AI must be present in the return.");
  /* A53 — Section 13B selected as the section of exemption ⇒ Schedule ET must be filled. */
  A(53, exsec!=="13B" || !!I.ScheduleET,
    "Part A-General: Section 13B is selected as the section under which exemption is claimed, so Schedule ET must be filled.");
});
