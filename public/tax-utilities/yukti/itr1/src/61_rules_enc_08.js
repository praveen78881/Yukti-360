/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-D advisory rules, batch enc_08 (Phase 6).
   Serial range D1–D9 (a SEPARATE `n` sequence from the Category-A serials;
   see rule_census.md §"Category D"). Category-D checks are advisory — the
   return may be defective u/s 139(9) but is not blocked — so each fires via
   Dd(n,cond,msg) with the msg prefixed "[D] ". cond is the "lawful / no
   advisory" assertion: TRUE on a compliant return, FALSE on the violation.

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). Every read is guarded (RG / N / (X||{})); nothing
   throws. Schedule-scoped blocks sit under `if(I.<block>){...}` so a serial is
   silent when the schedule it targets is absent from the built return. Keys
   are the built-return ITR1 schema paths (I = Object.values(buildReturn().ITR)
   [0]); paths/enum codes taken from books/ITR-1/schema_tree.md §7/§14/§15/§16,
   enums.json and the TDS section-code table PD_TDSSEC in 70_sec_paid.js.

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (raw entry n = tail of semantic rule n−1 + head of semantic rule n); the
   assertions below are encoded to the RE-JOINED semantic rule (constitution
   rule 6), which resolves the wrap into nine clean checks:
     D1        relief u/s 89(1) claimed → furnish Form 10E; quote Aadhaar 139AA.
     D2/D4/D6  a special-rate / not-applicable TDS section code selected in
               Schedule TDS2 (TDSonOthThanSals) →
                 D2 = 194B/194BB/194BA/194IA/194IC/194LA/194S,
                 D4 = 194E/194LB/194LC/194LBA(a)(b)(c)/195/196A/196B/196C/
                      196D/196D(1A),
                 D6 = 194Q/194C/194R.
     D3/D5/D7  the same three code-sets selected in Schedule TDS3
               (ScheduleTDS3Dtls) — ITR-1 not eligible / not applicable.
     D8/D9     TDS on salary (Schedule TDS1) cannot exceed Total Gross Salary
               (D8 = the aggregate TotalTDSonSalaries; D9 = any single TDS1
               row's TotalTDSSal).
   All nine are ENFORCED per rule_census.md (bucket "ENFORCED (Dd)"); none is
   NA / OFFLINE, so none is skipped.

   Note: a special-rate TDS code (e.g. 194B) is offered on the TDS2 grid but
   not on the narrower TDS3 (26QB) grid, so D3/D5/D7 rarely have a code to
   catch in practice — but they read the TDSSection leaf faithfully and stay
   silent when it does not appear, so they cost nothing and mis-fire never.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const tol=1;

  /* ---- guarded reads ---- */
  const TC = RG(I,"ITR1_TaxComputation",{})||{};
  const ID = RG(I,"ITR1_IncomeDeductions",{})||{};
  const relief89 = N(TC.Section89);          /* relief u/s 89(1) */
  const grossSal = N(ID.GrossSalary);        /* Total Gross Salary (salary head) */

  /* TDSSection enum codes (verbatim from 70_sec_paid.js PD_TDSSEC / enums.json).
     Each named section is taken with its sub-variant proviso codes, since those
     carry the same special-rate income the advisory is about. */
  const SPECIAL = ["94B","94B-P","4BB","94BA","94BA-P","4IA","4IC","4LA","94S","94S-P"];
    /* 194B / 194BB / 194BA / 194IA / 194IC / 194LA / 194S */
  const NONRES  = ["94E","4LB","4LC1","4LC2","4LC3","4BA1","4BA2","LBA1","LBA2","LBA3",
                   "195","96A","96B","96C","96D","96DA"];
    /* 194E / 194LB / 194LC(2)(i-ic) / 194LBA(a)(b)(c) / 195 / 196A / 196B / 196C / 196D / 196D(1A) */
  const NOTAPPL = ["94Q","94C","94R","94R-P"];
    /* 194Q / 194C / 194R */

  const rows2 = RG(I,"TDSonOthThanSals.TDSonOthThanSal",[])||[];   /* Schedule TDS2 rows */
  const rows3 = RG(I,"ScheduleTDS3Dtls.TDS3Details",[])||[];       /* Schedule TDS3 rows */
  const sal1  = RG(I,"TDSonSalaries.TDSonSalary",[])||[];          /* Schedule TDS1 rows */
  const hasSec=(rows,set)=>rows.some(r=>r&&set.indexOf(String(r.TDSSection))>=0);

  /* ===================== D1 — relief u/s 89(1) / Form 10E ===================== */
  Dd(1, !(relief89>0),
    "[D] Relief u/s 89(1) has been claimed: Form 10E must be furnished on the portal before this return is filed, and Aadhaar must be quoted u/s 139AA in the eligible cases (Circular 03/2023).");

  /* ===== D2/D4/D6 — special-rate & not-applicable TDS codes in Schedule TDS2 ===== */
  if(I.TDSonOthThanSals){
    Dd(2, !hasSec(rows2,SPECIAL),
      "[D] A special-rate TDS section code (194B / 194BB / 194BA / 194IA / 194IC / 194LA / 194S) is selected in Schedule TDS2 (TDS on income other than salary): income taxed at a special rate cannot be returned on ITR-1.");
    Dd(4, !hasSec(rows2,NONRES),
      "[D] A TDS section code applicable only to non-resident / special-rate income (194E / 194LB / 194LC / 194LBA(a)(b)(c) / 195 / 196A / 196B / 196C / 196D / 196D(1A)) is selected in Schedule TDS2: an assessee having such income is not eligible to file ITR-1.");
    Dd(6, !hasSec(rows2,NOTAPPL),
      "[D] A TDS section code for which ITR-1 is not applicable (194Q / 194C / 194R) is selected in Schedule TDS2.");
  }

  /* ===== D3/D5/D7 — the same three code-sets in Schedule TDS3 (26QB) ===== */
  if(I.ScheduleTDS3Dtls){
    Dd(3, !hasSec(rows3,SPECIAL),
      "[D] A special-rate TDS section code (194B / 194BB / 194BA / 194IA / 194IC / 194LA / 194S) is selected in Schedule TDS3 (TDS on income other than salary): income taxed at a special rate cannot be returned on ITR-1.");
    Dd(5, !hasSec(rows3,NONRES),
      "[D] A TDS section code applicable only to non-resident / special-rate income (194E / 194LB / 194LC / 194LBA(a)(b)(c) / 195 / 196A / 196B / 196C / 196D / 196D(1A)) is selected in Schedule TDS3: an assessee having such income is not eligible to file ITR-1.");
    Dd(7, !hasSec(rows3,NOTAPPL),
      "[D] A TDS section code for which ITR-1 is not applicable (194Q / 194C / 194R) is selected in Schedule TDS3.");
  }

  /* ===================== D8/D9 — TDS on salary <= Gross Salary ===================== */
  if(I.TDSonSalaries){
    const totTdsSal = N(RG(I,"TDSonSalaries.TotalTDSonSalaries",0));
    Dd(8, totTdsSal<=grossSal+tol,
      "[D] The total tax deducted at source on salary (Schedule TDS1) cannot be more than the Total Gross Salary declared under the Salary head.");
    const maxRow = sal1.reduce((m,r)=>Math.max(m,N(r&&r.TotalTDSSal)),0);
    Dd(9, maxRow<=grossSal+tol,
      "[D] The tax deducted at source shown in a Schedule TDS1 row cannot be more than the Total Gross Salary declared under the Salary head.");
  }
});
