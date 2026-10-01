/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-A validation rules, batch enc_04 (Phase 6).
   Serial range A151–A200. This batch owns the NEW-regime "must be 0" bars that
   knock out the Chapter-VI-A deductions, the salary section-10 / section-16
   exempt allowances and the self-occupied house-property interest under
   115BAC (A153–A175 + A161–A168), the new-regime gross-total-income identities
   for the house-property loss / positive cases (A160/A174), the old-regime HRA
   1/3-of-salary cap (A176), the 10(10CC) vs TDS-192 bound (A177), the
   Schedule-80D senior-citizen flag gates (A178–A183), the exempt-income single-
   select rule (A184), the 10(10B) employer bars & second-proviso cap (A185/A188),
   the 80CCH 46.2%-of-salary cap (A186), the rebate-87A regime ceilings
   (A191/A192), the whole Schedule-80GGC block (A193–A199) and the old-regime
   80U self-severe-disability figure (A200).

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / (X||{}) / S0); nothing throws. Keys are the built-return ITR1 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths and enum codes were
   taken from books/ITR-1/schema_tree.md, caps.md, enums.json and the section
   builders (70_sec_ded expDed, 70_sec_sal expSal, 70_sec_hp expHP,
   70_sec_paid expPaid, 70_sec_who). Encoded from each rule's own text
   (constitution rule 6), against the RE-JOINED semantic rule, not the raw
   line-wrapped fragment.

   Regime gate: FilingStatus.OptOutNewTaxRegime — "Y" = OLD regime, anything
   else = NEW (default). The builder (expDed) zeroes every entered
   UsrDeductUndChapVIA section but the two survivors (Section80CCDEmployer,
   AnyOthSec80CCH) under the new regime and emits NO Chapter-VI-A detail
   schedule, so the "must be 0 / no details" bars pass on a lawful new-regime
   return and fire only on a genuine violation.

   Serials in A151–A200 NOT encoded here, and why (bucketed in the census —
   books/ITR-1/rule_census.md — never faked):
     A151 — NA. Old regime cannot be selected after the 139(1) due date — turns
            on the filing timestamp / server clock, which the built return does
            not carry (the portal applies it at upload).
     A152 — NA. Once a 148 proceeding is initiated no 139 return may be filed —
            blocked at the upload level (portal), no offline field.
     A187 — OFFLINE-IMPOSSIBLE. 80CCH needs age 17–27 at the date of joining the
            armed forces; the date of joining is not a field the ITR-1 schema
            carries (only PersonalInfo.DOB), so the age-window test is not
            encodable. The 46.2%-of-salary cap (A186) is the encodable part.
     A189 — NA. A 139(5) revision over an original 139(4) bars the old regime —
            the original-return section is not carried on the built return
            (portal cross-return check).
     A190 — NA. Withdrawal from the new regime barred after the 139(1) due date —
            filing timestamp / clock, not carried.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";          /* "present / non-blank" */
  const inL=(v,a)=>a.indexOf(v)>=0;
  const tol=1;

  /* ---- guarded reads ---- */
  const ID  = RG(I,"ITR1_IncomeDeductions",{})||{};
  const usr = RG(ID,"UsrDeductUndChapVIA",{})||{};      /* entered Chapter VI-A */
  const FS  = RG(I,"FilingStatus",{})||{};
  const PI  = RG(I,"PersonalInfo",{})||{};
  const TC  = RG(I,"ITR1_TaxComputation",{})||{};
  const LT  = RG(I,"LTCG112A",{})||{};

  const old    = String(FS.OptOutNewTaxRegime)==="Y";   /* Y = OLD regime */
  const empcat = String(PI.EmployerCategory==null?"":PI.EmployerCategory);
  /* CG / SG employees + CG/SG/PSU/Other pensioners — 10(10B) retrenchment bar */
  const BAR10B = ["CGOV","SGOV","PE","PESG","PEPS","PEO"];

  /* salary head */
  const sal17  = N(ID.Salary);                           /* salary as per 17(1) */
  const ent16  = N(ID.EntertainmentAlw16ii);             /* 16(ii) */
  const pt16   = N(ID.ProfessionalTaxUs16iii);           /* 16(iii) */
  const incSal = N(ID.IncomeFromSal);
  const tds1   = N(RG(I,"TDSonSalaries.TotalTDSonSalaries",0));

  /* income aggregates */
  const gti    = N(ID.GrossTotIncome);                   /* GTI excl LTCG 112A */
  const gtiL   = N(ID.GrossTotIncomeIncLTCG112A);        /* GTI incl LTCG 112A */
  const totInc = N(ID.TotalIncome);
  const incHP  = N(ID.TotalIncomeChargeableUnHP);
  const incOS  = N(ID.IncomeOthSrc);
  const ltcg   = N(LT.LongCap112A);
  const tiExL  = totInc - ltcg;                          /* total income excl LTCG */

  /* salary section-10 exempt-allowance rows {SalNatureDesc, SalOthAmount} */
  const allw10 = RG(ID,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  const allwAmt= code => allw10.filter(r=>r&&String(r.SalNatureDesc)===code)
                                .reduce((a,r)=>a+N(r.SalOthAmount),0);

  /* exempt-income rows */
  const eiRows = RG(ID,"ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls",[])||[];

  /* house property */
  const props  = RG(ID,"PropertyDetails",[])||[];

  /* Schedule 80D consolidated block */
  const d8     = RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{})||{};

  /* ===================== NEW-regime Chapter-VI-A "must be 0" bars ===================== */
  /* A153 — new: 80C + 80CCC + 80CCD(1) aggregate must be 0. */
  A(153, old || (N(usr.Section80C)+N(usr.Section80CCC)+N(usr.Section80CCDEmployeeOrSE))<=tol,
    "New regime: the sum of deductions claimed u/s 80C, 80CCC and 80CCD(1) must be 0.");
  /* A154 — new: 80DD must be 0. */
  A(154, old || N(usr.Section80DD)<=tol,
    "New regime: the deduction claimed u/s 80DD in Schedule VIA must be 0.");
  /* A155 — new: 80DDB must be 0. */
  A(155, old || N(usr.Section80DDB)<=tol,
    "New regime: the deduction claimed u/s 80DDB must be 0.");
  /* A156 — new: 80G must be 0 and no Schedule 80G details. */
  A(156, old || (N(usr.Section80G)<=tol && !I.Schedule80G),
    "New regime: the deduction claimed u/s 80G must be 0 and no details may be provided in Schedule 80G.");
  /* A157 — new: 80TTA must be 0. */
  A(157, old || N(usr.Section80TTA)<=tol,
    "New regime: the deduction claimed u/s 80TTA in Schedule VIA must be 0.");
  /* A158 — new: 80TTB must be 0. */
  A(158, old || N(usr.Section80TTB)<=tol,
    "New regime: the deduction claimed u/s 80TTB in Schedule VIA must be 0.");
  /* A159 — new: 80U must be 0. */
  A(159, old || N(usr.Section80U)<=tol,
    "New regime: the deduction claimed u/s 80U in Schedule VIA must be 0.");
  /* A169 — new: 80CCD(1B) must be 0. */
  A(169, old || N(usr.Section80CCD1B)<=tol,
    "New regime: the deduction claimed u/s 80CCD(1B) in Schedule VIA must be 0.");
  /* A170 — new: 80EE must be 0. */
  A(170, old || N(usr.Section80EE)<=tol,
    "New regime: the deduction claimed u/s 80EE in Schedule VIA must be 0.");
  /* A171 — new: 80EEA must be 0. */
  A(171, old || N(usr.Section80EEA)<=tol,
    "New regime: the deduction claimed u/s 80EEA in Schedule VIA must be 0.");
  /* A172 — new: 80EEB must be 0. */
  A(172, old || N(usr.Section80EEB)<=tol,
    "New regime: the deduction claimed u/s 80EEB in Schedule VIA must be 0.");
  /* A173 — new: 80D must be 0 and no Schedule 80D details. */
  A(173, old || (N(usr.Section80D)<=tol && !I.Schedule80D),
    "New regime: the deduction claimed u/s 80D must be 0 and no details may be provided in Schedule 80D.");
  /* A175 — new: 80GGA must be 0 and no Schedule 80GGA details. */
  A(175, old || (N(usr.Section80GGA)<=tol && !I.Schedule80GGA),
    "New regime: the deduction claimed u/s 80GGA must be 0 and no details may be provided in Schedule 80GGA.");

  /* ===================== NEW-regime salary exempt-allowance bars ===================== */
  /* A161 — new: 10(17) MP/MLA/MLC allowance must be 0. */
  A(161, old || allwAmt("10(17)")<=tol,
    "New regime: the exempt allowance u/s 10(17) (MP/MLA/MLC) must be 0.");
  /* A163 — new: entertainment allowance u/s 16(ii) must be 0. */
  A(163, old || ent16<=tol,
    "New regime: the entertainment allowance u/s 16(ii) must be 0.");
  /* A164 — new: 10(5) leave-travel concession must be 0. */
  A(164, old || allwAmt("10(5)")<=tol,
    "New regime: the exemption u/s 10(5) (leave travel concession / assistance) must be 0.");
  /* A165 — new: 10(13A) HRA must be 0. */
  A(165, old || allwAmt("10(13A)")<=tol,
    "New regime: the exempt allowance u/s 10(13A) (house-rent allowance) must be 0.");
  /* A166 — new: 10(14)(i) must be 0. */
  A(166, old || allwAmt("10(14)(i)")<=tol,
    "New regime: the exempt allowance u/s 10(14)(i) must be 0.");
  /* A167 — new: 10(14)(ii) must be 0. */
  A(167, old || allwAmt("10(14)(ii)")<=tol,
    "New regime: the exempt allowance u/s 10(14)(ii) must be 0.");
  /* A168 — new: professional tax u/s 16(iii) must be 0. */
  A(168, old || pt16<=tol,
    "New regime: the deduction for professional tax u/s 16(iii) must be 0.");

  /* ===================== NEW-regime GTI identities ===================== */
  /* A160 — new & house-property loss: GTI (incl LTCG) = Salary + Other Sources + LTCG 112A (HP loss dropped). */
  A(160, old || !(incHP<0) || REQ(gtiL, incSal+incOS+ltcg, 2),
    "New regime with a house-property loss: gross total income must equal the total of incomes from Salary and Other Sources (the house-property loss cannot be set off).");
  /* A174 — new & house-property income >= 0: GTI (incl LTCG) = Salary + House Property + Other Sources + LTCG 112A. */
  A(174, old || (incHP<0) || REQ(gtiL, incSal+incHP+incOS+ltcg, 2),
    "New regime with positive house-property income: gross total income must equal the total of incomes from Salary, House Property, Other Sources and LTCG u/s 112A.");
  /* A162 — new: self-occupied house-property interest on borrowed capital must be 0. */
  props.forEach((p,i)=>{
    p=p||{};
    const type= String(p.ifLetOut==null?"":p.ifLetOut);   /* S / L / D */
    const intc= N(RG(p,"Rentdetails.IntOnBorwCap",0));
    A(162, old || type!=="S" || intc<=tol,
      "New regime: for a self-occupied house property the interest on borrowed capital must be 0. (property "+(i+1)+")");
  });

  /* ===================== OLD-regime salary caps ===================== */
  /* A176 — old: 10(13A) HRA cannot exceed 1/3 of Salary u/s 17(1). */
  A(176, !old || allwAmt("10(13A)")<=(sal17/3)+tol,
    "Old regime: the exempt allowance u/s 10(13A) (house-rent allowance) cannot exceed one-third of the salary as per section 17(1).");
  /* A177 — 10(10CC) cannot exceed the TDS claimed u/s 192 in Schedule TDS1. */
  A(177, allwAmt("10(10CC)")<=tds1+tol,
    "The exempt allowance u/s 10(10CC) cannot exceed the TDS claimed u/s 192 in Schedule TDS1.");
  /* A185 — 10(10B)(i)/(ii) not allowed to CG/SG employees or CG/SG/PSU/Other pensioners. */
  A(185, !inL(empcat,BAR10B) || (allwAmt("10(10B)(i)")<=tol && allwAmt("10(10B)(ii)")<=tol),
    "The exempt allowance u/s 10(10B)(i)/(ii) is not allowed to Central/State Government employees or to CG/SG/PSU/Other pensioners.");
  /* A188 — 10(10B) second proviso (scheme approved by the Central Government) cannot exceed Rs.5,00,000. */
  A(188, allwAmt("10(10B)(ii)")<=500000+tol,
    "The exempt allowance u/s 10(10B) second proviso (compensation under a scheme approved by the Central Government) cannot exceed Rs.5,00,000.");
  /* A186 — 80CCH cannot exceed 46.2% of Salary u/s 17(1). */
  A(186, N(usr.AnyOthSec80CCH)<=0.462*sal17+tol,
    "The deduction u/s 80CCH cannot exceed 46.2% of the salary as per section 17(1).");

  /* ===================== Exempt income single-select ===================== */
  /* A184 — any nature-of-income drop-down under Exempt Income can be selected only once. */
  const eiSubs = eiRows.map(r=>r&&String(r.SubCategory)).filter(s=>s);
  A(184, !eiSubs.some((s,i)=>eiSubs.indexOf(s)!==i),
    "Exempt income: any nature-of-income drop-down can be selected only once.");

  /* ===================== Schedule 80D senior-citizen flag gates ===================== */
  /* A178 — 1a "Self and Family" claimable only when the self/family senior flag is "N". */
  A(178, !I.Schedule80D || !(N(d8.SelfAndFamily)>0) || String(d8.SeniorCitizenFlag)==="N",
    "Schedule 80D: deduction at Sl.1a (Self and Family) can be claimed only when 'is a senior citizen?' (self/family) is No.");
  /* A179 — 1b "Self & Family incl. Senior Citizen" claimable only when the self/family senior flag is "Y". */
  A(179, !I.Schedule80D || !(N(d8.SelfAndFamilySeniorCitizen)>0) || String(d8.SeniorCitizenFlag)==="Y",
    "Schedule 80D: deduction at Sl.1b (Self & Family including Senior Citizen) can be claimed only when 'is a senior citizen?' (self/family) is Yes.");
  /* A180 — 2a "Parents" claimable only when the parents senior flag is "N". */
  A(180, !I.Schedule80D || !(N(d8.Parents)>0) || String(d8.ParentsSeniorCitizenFlag)==="N",
    "Schedule 80D: deduction at Sl.2a (Parents) can be claimed only when 'is any parent a senior citizen?' is No.");
  /* A181 — 2b "Parents incl. Senior Citizen" claimable only when the parents senior flag is "Y". */
  A(181, !I.Schedule80D || !(N(d8.ParentsSeniorCitizen)>0) || String(d8.ParentsSeniorCitizenFlag)==="Y",
    "Schedule 80D: deduction at Sl.2b (Parents including Senior Citizen) can be claimed only when 'is any parent a senior citizen?' is Yes.");
  /* A182 — no 1a/1b when the self/family flag is "S" (not claiming for Self/Family). */
  A(182, !I.Schedule80D || String(d8.SeniorCitizenFlag)!=="S" ||
      (N(d8.SelfAndFamily)===0 && N(d8.SelfAndFamilySeniorCitizen)===0),
    "Schedule 80D: no deduction may be claimed at Sl.1a/1b when the drop-down is 'Not claiming for Self / Family'.");
  /* A183 — no 2a/2b when the parents flag is "P" (not claiming for Parents). */
  A(183, !I.Schedule80D || String(d8.ParentsSeniorCitizenFlag)!=="P" ||
      (N(d8.Parents)===0 && N(d8.ParentsSeniorCitizen)===0),
    "Schedule 80D: no deduction may be claimed at Sl.2a/2b when the drop-down is 'Not claiming for Parents'.");

  /* ===================== Rebate 87A regime ceilings ===================== */
  /* A191 — new: rebate 87A barred when total income excl LTCG exceeds Rs.12,70,590. */
  A(191, old || !(tiExL>1270590) || N(TC.Rebate87A)<=tol,
    "New regime: rebate u/s 87A cannot be claimed when total income (excluding LTCG u/s 112A) exceeds Rs.12,70,590.");
  /* A192 — old: rebate 87A cannot exceed Rs.12,500. */
  A(192, !old || N(TC.Rebate87A)<=12500+tol,
    "Old regime: rebate u/s 87A can be claimed only to the extent of Rs.12,500 (total income up to Rs.5,00,000).");

  /* ===================== Schedule 80GGC (political-party contribution) ===================== */
  /* A193 — 80GGC claimed in VIA => Schedule 80GGC details must be provided. */
  A(193, !(N(usr.Section80GGC)>0) || !!I.Schedule80GGC,
    "Deduction u/s 80GGC is claimed in Schedule VIA but the contribution details are not provided in Schedule 80GGC.");
  if(I.Schedule80GGC){
    const GGC = RG(I,"Schedule80GGC",{})||{};
    const ggcRows = RG(GGC,"Schedule80GGCDetails",[])||[];
    let sCash=0,sOth=0,sTot=0,sElig=0;
    ggcRows.forEach((r,i)=>{
      r=r||{};
      const cash=N(r.DonationAmtCash), oth=N(r.DonationAmtOtherMode);
      sCash+=cash; sOth+=oth; sTot+=N(r.DonationAmt); sElig+=N(r.EligibleDonationAmt);
      const tag=" (row "+(i+1)+")";
      /* A194 — eligible amount per row = contribution in other mode (cash gives no deduction). */
      A(194, REQ(N(r.EligibleDonationAmt), oth, 2),
        "Schedule 80GGC: the eligible amount of contribution must equal the contribution in other mode (cash contribution is not eligible)."+tag);
      /* A195 — total contribution per row = cash + other mode. */
      A(195, REQ(N(r.DonationAmt), cash+oth, 2),
        "Schedule 80GGC: the total contribution must equal contribution in cash plus contribution in other mode."+tag);
      /* A198 — date of contribution mandatory for each 80GGC contribution. */
      A(198, S0(r.DonationDate),
        "Schedule 80GGC: the date of contribution is mandatory for a contribution u/s 80GGC."+tag);
      /* A199 — the contribution must be made in other mode (details required; cash is barred). */
      A(199, oth>0,
        "Schedule 80GGC: details of a contribution made in other mode are required (a cash contribution is not eligible)."+tag);
    });
    /* A196 — Sl.D eligible amount = sum of row eligible amounts, restricted to GTI. */
    A(196, REQ(N(GGC.TotalEligibleDonationAmt80GGC), sElig, 2) &&
           N(GGC.TotalEligibleDonationAmt80GGC)<=gti+tol,
      "Schedule 80GGC: Sl.D eligible amount of contribution must equal the sum of the individual eligible amounts, restricted to the gross total income.");
    /* A197 — Sl.A/B/C totals = sums of the row cash / other-mode / total amounts. */
    A(197, REQ(N(GGC.TotalDonationAmtCash80GGC), sCash, 2) &&
           REQ(N(GGC.TotalDonationAmtOtherMode80GGC), sOth, 2) &&
           REQ(N(GGC.TotalDonationsUs80GGC), sTot, 2),
      "Schedule 80GGC: total contribution in cash (A), in other mode (B) and total (C) must each equal the sum of the individual row amounts.");
  }

  /* ===================== Schedule 80U (self, severe disability) ===================== */
  /* A200 — old: 80U self with severe disability => deduction Rs.1,25,000 (restricted to GTI). */
  if(I.Schedule80U){
    const U = RG(I,"Schedule80U",{})||{};
    A(200, !old || String(U.NatureOfDisability)!=="2" ||
        REQ(N(U.DeductionAmount), Math.min(125000, Math.max(0,gti)), 2),
      "Old regime: for self with a severe disability the deduction u/s 80U must be Rs.1,25,000 (restricted to the gross total income).");
  }
});
