/* ITR-4 (Sugam) · AY 2026-27 — validation-rule FIX batch 01 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials (logs/ITR-4/rule_audit/fix_slices/fix_01.json): 10, 15, 30, 37, 51, 67, 68, 72, 80, 81,
   83, 84, 86, 87, 89, 90, 92, 93, 99, 100. Schema paths copied from 70_sec_inccore.js /
   70_sec_ded.js exporters and 61_rules_g*.js; code enums from books/ITR-4/enums.json. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var USR    = RG(I,"IncomeDeductions.UsrDeductUndChapVIA",{})||{};   /* claimed (user-enterable) */
  var ALW    = RG(I,"IncomeDeductions.DeductUndChapVIA",{})||{};      /* allowed (post-cap, post-regime) */
  var empcat = RG(I,"PersonalInfo.EmployerCategory","OTH");
  var g = function(p){ return N(RG(I,p)); };                            /* numeric read, default 0 */

  /* exempt-income (D20) rows and salary exempt-allowance rows — same readers as 61_rules_g0.js */
  var exRows  = RG(I,"TaxExmpIntIncDtls.OthersInc.OthersIncDtls",[])||[];
  var alwRows = RG(I,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  var cntSub  = function(code){ return exRows.filter(function(r){return r&&r.SubCategory===code;}).length; };
  var alwAmt  = function(code){ return RSUM(alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}),"SalOthAmount"); };

  var sal171  = g("IncomeDeductions.Salary");                          /* salary as per section 17(1) */
  var grossSal= g("IncomeDeductions.GrossSalary");

  /* ---------------- Schedule BP — 44AD / 44ADA eligibility by business code ---------------- */
  /* NatOfBus44ADA[].CodeADA enum (books/ITR-4/enums.json) — the 44AA(1) profession codes. */
  var ADA_CODES=["14001","14002","14003","14004","14006","14008","16001","16002","16003","16004","16005",
    "16007","16008","16009","16013","16018","16019_1","16020","16021","18001","18002","18003","18004","18005",
    "18010","18011","18012","18013","18014","18015","18016","18017","18018","18019","18020","20010","20011","20012"];
  /* codes barred from 44AD: general commission agents (09005), business brokerage (16011) and every
     44AA(1) profession code above — none of these is in the NatOfBus44AD[].CodeAD enum. */
  var AD_BARRED=["09005","16011"].concat(ADA_CODES);
  var nad =RG(I,"ScheduleBP.NatOfBus44AD",[])||[];
  var nada=RG(I,"ScheduleBP.NatOfBus44ADA",[])||[];
  A(10, nad.every(function(r){ var c=String((r||{}).CodeAD||"").trim(); return !c || AD_BARRED.indexOf(c)<0; }),
    "Schedule BP: section 44AD is not applicable to general commission agents or to a profession referred to in section 44AA(1) — the 44AD business code is not eligible.");
  A(15, nada.every(function(r){ var c=String((r||{}).CodeADA||"").trim(); return !c || ADA_CODES.indexOf(c)>=0; }),
    "Schedule BP: section 44ADA is not applicable to a person carrying on business — the 44ADA code must be a profession code.");

  /* ---------------- Chapter VI-A (old regime) ---------------- */
  /* 30: 80DDB claimed in the old regime → the eligible category (Self/Dependent · Senior) and the
     specified-disease description are mandatory (UsrDeductUndChapVIA qualifiers written by 70_sec_ded.js). */
  A(30, isNew() || !(N(USR.Section80DDB)>0) ||
        (!!String(USR.Section80DDBUsrType||"").trim() && !!String(USR.NameOfSpecDisease80DDB||"").trim()),
    "Old regime: the eligible category and the specified-disease description are required for the deduction u/s 80DDB.");

  /* 37 (WEAK → companion): 80GG is the least of Rs 60,000, 25% of adjusted total income (GTI excluding
     LTCG 112A, less every other Chapter VI-A deduction). The 60k leg lives in 61_rules_g0.js; this adds the 25% leg. */
  var adjTI = Math.max(0, g("IncomeDeductions.GrossTotIncome") - Math.max(0, N(ALW.TotalChapVIADeductions)-N(ALW.Section80GG)));
  A(37, isNew() || !(N(ALW.Section80GG)>0) || N(ALW.Section80GG) <= Math.min(60000, R(0.25*adjTI))+1,
    "Old regime: deduction u/s 80GG cannot exceed Rs. 60,000 or 25% of the adjusted total income, whichever is lower.");

  /* ---------------- Rebate u/s 87A (old regime) ---------------- */
  /* 51 (WEAK → companion): under the old regime the rebate is available only when TOTAL income —
     including LTCG u/s 112A — does not exceed Rs 5,00,000 (TotalIncome is GTI incl. 112A less VI-A). */
  A(51, isNew() || !(g("TaxComputation.Rebate87A")>0) || g("IncomeDeductions.TotalIncome") <= 500000,
    "Old regime: rebate u/s 87A cannot be claimed when total income (including LTCG u/s 112A) exceeds Rs. 5,00,000.");

  /* ---------------- Salary — entertainment allowance u/s 16(ii) ---------------- */
  /* Central / State Government / PSU employees only (EmployerCategory enum in 70_sec_inccore.js). */
  var ENT_OK=["CGOV","SGOV","PSU"];
  var ent=g("IncomeDeductions.EntertainmntalwncUs16ii");
  /* 67 (WEAK → companion): lower of Rs 5,000 and 1/5th of salary; the form carries no separate basic-salary
     box, so salary u/s 17(1) is the base (basic ≤ 17(1) salary, so this never fires on a lawful return). */
  A(67, isNew() || !(ent>0) || ENT_OK.indexOf(empcat)<0 || ent <= Math.min(5000, Math.floor(sal171/5))+1,
    "Old regime: entertainment allowance u/s 16(ii) is allowed only up to Rs. 5,000 or 1/5th of salary, whichever is lower.");
  A(68, !(ent>0) || ENT_OK.indexOf(empcat)>=0,
    "Entertainment allowance u/s 16(ii) is allowed only to Central Government, State Government and PSU employees.");

  /* ---------------- Salary — exempt-allowance caps ---------------- */
  A(72, !(alwAmt("10(7)")>0) || alwAmt("10(7)") <= grossSal+1,
    "Exempt allowance u/s 10(7) cannot exceed the gross salary.");
  A(80, isNew() || !(alwAmt("10(14)(i)")>0) || alwAmt("10(14)(i)") <= sal171+1,
    "Old regime: prescribed allowances exempt u/s 10(14)(i) cannot exceed salary as per section 17(1).");
  A(81, isNew() || !(alwAmt("10(14)(ii)")>0) || alwAmt("10(14)(ii)") <= sal171+1,
    "Old regime: prescribed allowances exempt u/s 10(14)(ii) cannot exceed salary as per section 17(1).");

  /* ---------------- Exempt income (D20) — 'cannot be selected more than once' ---------------- */
  /* SubCategory values are the schema enum strings (books/ITR-4/enums.json OthersIncDtls[].SubCategory). */
  A(83, cntSub("10(10D)") <= 1, "Exempt income u/s 10(10D) (sum received under a life insurance policy) cannot be selected more than once.");
  A(84, cntSub("10(11)")  <= 1, "Exempt income u/s 10(11) (Statutory Provident Fund) cannot be selected more than once.");
  A(86, cntSub("10(13)")  <= 1, "Exempt income u/s 10(13) (approved superannuation fund) cannot be selected more than once.");
  A(87, cntSub("10(16)")  <= 1, "Exempt income u/s 10(16) (scholarships) cannot be selected more than once.");
  A(89, cntSub("10(17A)") <= 1, "Exempt income u/s 10(17A) (award instituted by Government) cannot be selected more than once.");
  A(90, cntSub("10(18)")  <= 1, "Exempt income u/s 10(18) (gallantry-award pension) cannot be selected more than once.");
  A(92, cntSub("10(19)")  <= 1, "Exempt income u/s 10(19) (armed-forces family pension) cannot be selected more than once.");
  A(93, cntSub("10(26)")  <= 1, "Exempt income u/s 10(26) cannot be selected more than once.");

  /* ---------------- Schedule 80G — tables (A) and (B): cash or other-mode amount mandatory per donee ---------------- */
  var hasMode=function(d){ return !d || N(d.DonationAmtCash)>0 || N(d.DonationAmtOtherMode)>0; };
  A(99,  (RG(I,"Schedule80G.Don100Percent.DoneeWithPan",[])||[]).every(hasMode),
    "Schedule 80G table (A): donation in cash or donation in other mode must be entered for every donee.");
  A(100, (RG(I,"Schedule80G.Don50PercentNoApprReqd.DoneeWithPan",[])||[]).every(hasMode),
    "Schedule 80G table (B): donation in cash or donation in other mode must be entered for every donee.");
});
