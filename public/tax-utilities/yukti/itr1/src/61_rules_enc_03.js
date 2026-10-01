/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-A validation rules, batch enc_03 (Phase 6).
   Serial range A101–A150 (the Taxes-Paid / TDS / TCS / Schedule-IT reconciliation
   tail and the Refund/Balance identities, the Chapter-VI-A ceilings and detail-
   presence checks 80GG/80CCD(1B)/80CCD(2)/80EE/80EEA/80EEB and the new-regime
   B5 zero-bar, the full Schedule-80D age-based ladder Sl.No 1a/1b/2a/2b/3, the
   80G eligible<=total and cross-bucket-PAN checks, the Part-B "total tax, fee &
   interest" roll-up, the exempt/salary single-selects and caps (10(17A),
   10(10AA), standard deduction 16(ia)), the 80GGA cash/PAN checks, the dividend
   quarterly-breakup identity, and the new-/old-regime section-10(14) allowance
   bars).

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / (X||{}) / S0); nothing throws. Keys are the built-return ITR1 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths and enum codes were
   taken from books/ITR-1/schema_tree.md, caps.md, enums.json and the section
   builders (70_sec_paid expPaid, 70_sec_ded expDed, 70_sec_sal expSal,
   70_sec_os expOs, 70_sec_tax expTax). Encoded from each rule's own re-joined
   text (constitution rule 6); the rules.json line-wrap offsets each serial by
   ~one physical line, so the assertions below are encoded to the RE-JOINED
   semantic rule, not the raw fragment.

   Regime gate: FilingStatus.OptOutNewTaxRegime — "Y" = OLD regime, "N" = NEW.
   Old-regime rules are guarded `!old || …`; new-regime rules `old || …`.

   Serials in A101–A150 NOT encoded here, and why (bucketed in the census —
   books/ITR-1/rule_census.md — never faked):
     A107 — OFFLINE-IMPOSSIBLE. IFSC in Bank Details / Schedule 80G / 80GGC vs
            the RBI / GIFT IFSC database — external DB not shipped (the portal
            resolves it at upload).
     A113 — NA. TDS claimed but receipts per Form 26AS not offered — an AIS/26AS
            reconciliation the built return cannot perform offline.
     A126 — NA. Original return u/s 142(1) then no 139 return — checked at upload
            (portal cross-return), the built return does not carry it.
   47 ENCODED + A107(OFF) + A113(NA) + A126(NA) = the 50 serials of A101–A150.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";          /* "present / non-blank" */
  const inL=(v,a)=>a.indexOf(v)>=0;
  const tol=1;

  /* ---- guarded reads ---- */
  const ID  = RG(I,"ITR1_IncomeDeductions",{})||{};
  const usr = RG(ID,"UsrDeductUndChapVIA",{})||{};      /* entered Chapter VI-A */
  const alw = RG(ID,"DeductUndChapVIA",{})||{};         /* allowed  Chapter VI-A */
  const FS  = RG(I,"FilingStatus",{})||{};
  const PI  = RG(I,"PersonalInfo",{})||{};
  const TC  = RG(I,"ITR1_TaxComputation",{})||{};
  const LT  = RG(I,"LTCG112A",{})||{};
  const TP  = RG(I,"TaxPaid",{})||{};
  const TPP = RG(TP,"TaxesPaid",{})||{};
  const RFD = RG(I,"Refund",{})||{};
  const G   = RG(I,"Schedule80G",{})||{};
  const GGA = RG(I,"Schedule80GGA",{})||{};
  const D8  = RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{})||{};

  const TS  = RG(I,"TDSonSalaries",{})||{};
  const TO  = RG(I,"TDSonOthThanSals",{})||{};
  const T3  = RG(I,"ScheduleTDS3Dtls",{})||{};
  const SCTCS = RG(I,"ScheduleTCS",{})||{};
  const PY  = RG(I,"TaxPayments",{})||{};

  const old    = String(FS.OptOutNewTaxRegime)==="Y";   /* Y = OLD regime */
  const empcat = String(PI.EmployerCategory==null?"":PI.EmployerCategory);
  const GOVT   = ["CGOV","SGOV"];                        /* Central / State Government */
  const CGSGPSU_PEN = ["PE","PESG","PEPS"];              /* CG / SG / PSU pensioners */
  const GOVT_PEN10AA= ["CGOV","SGOV","PE","PESG"];       /* govt + CG/SG pensioners (10(10AA) high limit) */

  /* salary head */
  const sal17 = N(ID.Salary);                            /* salary as per 17(1) */
  const perq  = N(ID.PerquisitesValue);                  /* 17(2) */
  const prof  = N(ID.ProfitsInSalary);                   /* 17(3) */
  const d16ia = N(ID.DeductionUs16ia);                   /* standard deduction 16(ia) */

  /* income aggregates */
  const gti   = N(ID.GrossTotIncome);                    /* GTI excl LTCG 112A */
  const totInc= N(ID.TotalIncome);
  const ltcg  = N(LT.LongCap112A);

  /* repeating rows */
  const osRows = RG(ID,"OthersInc.OthersIncDtlsOthSrc",[])||[];
  const eiRows = RG(ID,"ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls",[])||[];
  const allw10 = RG(ID,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  const tds2Rows = RG(TO,"TDSonOthThanSal",[])||[];
  const tds3Rows = RG(T3,"TDS3Details",[])||[];
  const tcsRows  = RG(SCTCS,"TCS",[])||[];
  const itRows   = RG(PY,"TaxPayment",[])||[];

  const osAmt  = code => osRows.filter(r=>r&&String(r.OthSrcNatureDesc)===code)
                               .reduce((a,r)=>a+N(r.OthSrcOthAmount),0);
  const eiCount= code => eiRows.filter(r=>r&&String(r.SubCategory)===code).length;
  const alwAmt = code => allw10.filter(r=>r&&String(r.SalNatureDesc)===code)
                               .reduce((a,r)=>a+N(r.SalOthAmount),0);
  /* a DoneePAN appears more than once across the given rows */
  const dupPan = rows=>{const seen={};for(const r of (rows||[])){if(!r)continue;
    const p=String(r.DoneePAN||"").toUpperCase();if(!p)continue;
    if(seen[p])return true;seen[p]=1;}return false;};

  /* ===================== Taxes-Paid / TDS / TCS reconciliation ===================== */
  /* A101 — Schedule TDS2 col-6 total = sum of the per-row credit-claimed values. */
  A(101, REQ(N(TO.TotalTDSonOthThanSals),
      tds2Rows.reduce((a,r)=>a+N(r&&r.ClaimOutOfTotTDSOnAmtPaid),0), 2),
    "Schedule TDS2: the total 'TDS credit out of (5) claimed this year' must equal the sum of the individual col-6 values.");
  /* A102 — Schedule TDS3 col-7 total = sum of the per-row TDS-claimed values. */
  A(102, REQ(N(T3.TotalTDS3Details),
      tds3Rows.reduce((a,r)=>a+N(r&&r.TDSClaimed),0), 2),
    "Schedule TDS3: the total 'TDS credit out of (5) claimed this year' must equal the sum of the individual col-7 values.");
  /* A103 — Taxes-Paid total = the details paid in Schedule IT + TDS1 + TDS2 + TDS3 + TCS. */
  A(103, REQ(N(TPP.TotalTaxesPaid),
      N(PY.TotalTaxPayments)+N(TS.TotalTDSonSalaries)+N(TO.TotalTDSonOthThanSals)
      +N(T3.TotalTDS3Details)+N(SCTCS.TotalSchTCS), 2),
    "TDS, TCS and tax paid claimed in 'Taxes Paid and Verification' must equal the amounts provided in Schedule IT, Schedule TDS1, TDS2, TDS3 and Schedule TCS.");
  /* A104 — Total Taxes Paid = Advance Tax + TDS + TCS + Self-Assessment Tax. */
  A(104, REQ(N(TPP.TotalTaxesPaid),
      N(TPP.AdvanceTax)+N(TPP.TDS)+N(TPP.TCS)+N(TPP.SelfAssessmentTax), 2),
    "Total Taxes Paid must equal the sum of TDS, TCS, Advance Tax and Self-Assessment Tax.");
  /* A105 — Refund due = Total Taxes Paid − Total Tax & Interest payable (floored at 0). */
  A(105, REQ(N(RFD.RefundDue), Math.max(0, N(TPP.TotalTaxesPaid)-N(TC.TotTaxPlusIntrstPay)), 2),
    "Refund claimed must equal Total Taxes Paid less Total Tax and Interest payable.");
  /* A106 — Balance tax payable = Total Tax & Interest payable − Total Taxes Paid (floored at 0). */
  A(106, REQ(N(TP.BalTaxPayable), Math.max(0, N(TC.TotTaxPlusIntrstPay)-N(TPP.TotalTaxesPaid)), 2),
    "Tax payable must equal Total Tax and Interest payable less Total Taxes Paid.");
  /* A107 — OFFLINE-IMPOSSIBLE (IFSC vs RBI/GIFT database); see header. */
  /* A108 — Taxes-Paid TDS = the totals of Schedule TDS1 + TDS2 + TDS3. */
  A(108, REQ(N(TPP.TDS),
      N(TS.TotalTDSonSalaries)+N(TO.TotalTDSonOthThanSals)+N(T3.TotalTDS3Details), 2),
    "Total TDS claimed in 'Taxes Paid and Verification' must equal the sum of the TDS claimed in Schedule TDS1, TDS2 and TDS3.");
  /* A109 — Taxes-Paid TCS = the total of Schedule TCS. */
  A(109, REQ(N(TPP.TCS), N(SCTCS.TotalSchTCS), 2),
    "Total TCS claimed in 'Taxes Paid and Verification' must equal the total TCS claimed in the TCS schedule.");
  /* A110 — Advance tax = the Schedule-IT challans deposited on or before 31 March 2026. */
  A(110, REQ(N(TPP.AdvanceTax),
      itRows.filter(r=>r&&S0(r.DateDep)&&String(r.DateDep)<="2026-03-31")
            .reduce((a,r)=>a+N(r.Amt),0), 2),
    "Total Advance Tax paid must equal the sum of the Schedule-IT challans deposited between 01/04/2025 and 31/03/2026.");
  /* A111 — Self-assessment tax = the Schedule-IT challans deposited after 31 March 2026. */
  A(111, REQ(N(TPP.SelfAssessmentTax),
      itRows.filter(r=>r&&S0(r.DateDep)&&String(r.DateDep)>"2026-03-31")
            .reduce((a,r)=>a+N(r.Amt),0), 2),
    "Total Self-Assessment Tax paid must equal the sum of the Schedule-IT challans deposited after 31/03/2026.");

  /* ===================== Salary — standard deduction 16(ia) ===================== */
  /* A112 — old: the standard deduction u/s 16(ia) is capped at Rs.50,000. */
  A(112, !old || d16ia<=50000+tol,
    "Old regime: a salaried taxpayer can claim the standard deduction u/s 16(ia) only to the extent of Rs.50,000.");
  /* A113 — NA (TDS vs Form 26AS reconciliation); see header. */

  /* ===================== Chapter VI-A ceilings & bars ===================== */
  /* A114 — old: 80GG <= least(Rs.60,000, 25% of total income excl LTCG). */
  A(114, !old || N(usr.Section80GG)<=Math.min(60000, 0.25*gti)+tol,
    "The deduction u/s 80GG cannot exceed the lower of Rs.60,000 and 25% of total income (excluding LTCG) before allowing this deduction.");
  /* A115 — old: 80CCD(1B) <= Rs.50,000. */
  A(115, !old || N(usr.Section80CCD1B)<=50000+tol,
    "Old regime: the maximum deduction allowable u/s 80CCD(1B) is Rs.50,000.");
  /* A116 — 80CCD(2) barred for a CG / SG / PSU pensioner. */
  A(116, !inL(empcat,CGSGPSU_PEN) || N(usr.Section80CCDEmployer)===0,
    "Deduction u/s 80CCD(2) cannot be claimed by a taxpayer whose employer category is a CG / SG / PSU pensioner.");
  /* A117 — total income excluding LTCG (C3(a)(iii)) <= Rs.50,00,000 (the ITR-1 ceiling). */
  A(117, (totInc-ltcg)<=5000000+tol,
    "Total income excluding LTCG (C3(a)(iii)) cannot be greater than Rs.50 lakh (above that the return cannot be filed on ITR-1).");
  /* A118 — 80GGA: a cash donation to the same donee PAN cannot appear more than once. */
  if(I.Schedule80GGA){
    const ggaRows = RG(GGA,"DonationDtlsSciRsrchRuralDev",[])||[];
    A(118, !dupPan(ggaRows.filter(r=>r&&N(r.DonationAmtCash)>0)),
      "Schedule 80GGA: where a donation is made in cash the same donee PAN cannot appear more than once.");
    /* A143 — 80GGA cash donation above Rs.2,000 is not allowed. */
    A(143, ggaRows.every(r=>!r||N(r.DonationAmtCash)<=2000+tol),
      "Deduction u/s 80GGA is not allowed for a donation made in cash above Rs.2,000.");
    /* A144 — 80GGA: the same donee PAN cannot appear more than once (any mode). */
    A(144, !dupPan(ggaRows),
      "Schedule 80GGA: the same donee PAN cannot appear more than once.");
  }
  /* A119 — HRA u/s 10(13A) claimed => deduction u/s 80GG not allowed. */
  A(119, !(alwAmt("10(13A)")>0) || N(usr.Section80GG)===0,
    "House rent allowance u/s 10(13A) is claimed, so the deduction u/s 80GG is not allowed for the corresponding period.");
  /* A120 — old: 80CCD(2) <= 14% of salary for a Central/State-Government employer. */
  A(120, !old || !inL(empcat,GOVT) || N(usr.Section80CCDEmployer)<=0.14*sal17+tol,
    "Old regime: the deduction u/s 80CCD(2) cannot exceed 14% of salary when the employer category is Central or State Government.");
  /* A121 — old: 80EE <= Rs.50,000. */
  A(121, !old || N(usr.Section80EE)<=50000+tol,
    "Old regime: the deduction claimed u/s 80EE cannot exceed the maximum limit of Rs.50,000.");
  /* A122 — old: 80EEA <= Rs.1,50,000. */
  A(122, !old || N(usr.Section80EEA)<=150000+tol,
    "Old regime: the deduction claimed u/s 80EEA cannot exceed the maximum limit of Rs.1,50,000.");
  /* A123 — 80EE and 80EEA are mutually exclusive: 80EEA claimed => 80EE must be 0. */
  A(123, !(N(usr.Section80EEA)>0) || N(usr.Section80EE)===0,
    "Only one of the deductions u/s 80EE / 80EEA is allowed; where 80EEA is claimed the deduction u/s 80EE cannot be greater than zero.");
  /* A124 — old: 80EEB <= Rs.1,50,000. */
  A(124, !old || N(usr.Section80EEB)<=150000+tol,
    "Old regime: the deduction claimed u/s 80EEB cannot exceed Rs.1,50,000.");
  /* A125 — relief u/s 89 needs salary 17(1) / perquisite 17(2) / profit 17(3) / family pension present. */
  A(125, !(N(TC.Section89)>0) || sal17>0 || perq>0 || prof>0 || osAmt("FAP")>0,
    "Relief u/s 89 cannot be claimed when salary u/s 17(1), value of perquisite u/s 17(2), profit in lieu of salary u/s 17(3) and family pension are all zero or blank.");
  /* A126 — NA (original return u/s 142(1) then no 139 return); see header. */

  /* ===================== Schedule 80D — age-based ladder (OLD regime) ===================== */
  if(I.Schedule80D){
    const selfFam   = N(D8.SelfAndFamily);                  /* Sl.No 1a */
    const hiSelf    = N(D8.HealthInsPremSlfFam);
    const phcSelf   = N(D8.PrevHlthChckUpSlfFam);
    const selfFamSr = N(D8.SelfAndFamilySeniorCitizen);     /* Sl.No 1b */
    const hiSelfSr  = N(D8.HlthInsPremSlfFamSrCtzn);
    const phcSelfSr = N(D8.PrevHlthChckUpSlfFamSrCtzn);
    const medSelfSr = N(D8.MedicalExpSlfFamSrCtzn);
    const par       = N(D8.Parents);                        /* Sl.No 2a */
    const hiPar     = N(D8.HlthInsPremParents);
    const phcPar    = N(D8.PrevHlthChckUpParents);
    const parSr     = N(D8.ParentsSeniorCitizen);           /* Sl.No 2b */
    const hiParSr   = N(D8.HlthInsPremParentsSrCtzn);
    const phcParSr  = N(D8.PrevHlthChckUpParentsSrCtzn);
    const medParSr  = N(D8.MedicalExpParentsSrCtzn);
    const elig80D   = N(D8.EligibleAmountOfDedn);           /* Sl.No 3 */
    const sum4      = selfFam+selfFamSr+par+parSr;

    /* A127 — old: 80D Sl.No 1a (Self & Family) <= Rs.25,000. */
    A(127, !old || selfFam<=25000+tol,
      "Old regime: Schedule 80D — the deduction at Sl.No 1a (Self and Family) is allowed only to the extent of Rs.25,000.");
    /* A128 — 80D Sl.No 1a = health-insurance premium + preventive check-up (capped at Rs.5,000). */
    A(128, REQ(selfFam, hiSelf+Math.min(phcSelf,5000), 2),
      "Schedule 80D: the deduction at Sl.No 1a must equal the sum of (i) health-insurance premium and (ii) preventive health check-up.");
    /* A129 — old: the preventive health check-up across all four fields combined <= Rs.5,000. */
    A(129, !old || (phcSelf+phcSelfSr+phcPar+phcParSr)<=5000+tol,
      "Old regime: Schedule 80D — the preventive health check-up amount of all the fields combined together cannot exceed Rs.5,000.");
    /* A130 — old: 80D Sl.No 1b (Self & Family, senior) <= Rs.50,000. */
    A(130, !old || selfFamSr<=50000+tol,
      "Old regime: Schedule 80D — the deduction at Sl.No 1b (Self and Family, senior citizen) is allowed only to the extent of Rs.50,000.");
    /* A131 — 80D Sl.No 1b = i + ii (preventive capped at Rs.5,000) + iii (medical expenditure). */
    A(131, REQ(selfFamSr, hiSelfSr+Math.min(phcSelfSr,5000)+medSelfSr, 2),
      "Schedule 80D: the deduction at Sl.No 1b must equal the sum of (i) health-insurance premium, (ii) preventive check-up and (iii) medical expenditure.");
    /* A132 — old: 80D Sl.No 2a (Parents) <= Rs.25,000. */
    A(132, !old || par<=25000+tol,
      "Old regime: Schedule 80D — the deduction at Sl.No 2a (Parents) is allowed only to the extent of Rs.25,000.");
    /* A133 — old: 80D Sl.No 2a = health-insurance premium + preventive check-up (capped at Rs.5,000). */
    A(133, !old || REQ(par, hiPar+Math.min(phcPar,5000), 2),
      "Old regime: Schedule 80D — the deduction at Sl.No 2a must equal the sum of (i) health-insurance premium and (ii) preventive health check-up.");
    /* A134 — old: 80D Sl.No 2b (Parents, senior) <= Rs.50,000. */
    A(134, !old || parSr<=50000+tol,
      "Old regime: Schedule 80D — the deduction at Sl.No 2b (Parents, senior citizen) cannot exceed Rs.50,000.");
    /* A135 — 80D Sl.No 2b = i + ii (preventive capped at Rs.5,000) + iii (medical expenditure). */
    A(135, REQ(parSr, hiParSr+Math.min(phcParSr,5000)+medParSr, 2),
      "Schedule 80D: the deduction at Sl.No 2b must equal the sum of (i) health-insurance premium, (ii) preventive check-up and (iii) medical expenditure.");
    /* A136 — old: 80D Sl.No 3 eligible amount of deduction <= Rs.1,00,000. */
    A(136, !old || elig80D<=100000+tol,
      "Old regime: Schedule 80D — the eligible amount of deduction at Sl.No 3 cannot exceed Rs.1,00,000.");
    /* A137 — 80D Sl.No 3 = (1a + 1b + 2a + 2b) restricted to GTI (checked when that sum <= Rs.1,00,000).
       The Sl.3 eligible amount is the sum of the sub-totals capped at the gross total income; with the
       GTI roll-up now wired (ITR1_IncomeDeductions.GrossTotIncome, populated by the tax section) the
       Math.min(sum4, gti) restriction is faithful and stays silent on a lawful return. */
    A(137, !(sum4<=100000) || REQ(elig80D, Math.min(sum4, gti), 2),
      "Schedule 80D: the eligible amount of deduction at Sl.No 3 must equal the sum of (1a + 1b + 2a + 2b) restricted to gross total income.");
  }
  /* A138 — 80D claimed in Chapter VI-A => the same amount / details in Schedule 80D. */
  A(138, !(N(alw.Section80D)>0) || (!!I.Schedule80D && REQ(N(alw.Section80D), N(D8.EligibleAmountOfDedn), 2)),
    "Where 80D is claimed in the Chapter-VI-A deductions the same amount and details must be provided in Schedule 80D.");

  /* ===================== Schedule 80G ===================== */
  /* A139 — 80G eligible amount of donations <= total donations. */
  A(139, !I.Schedule80G || N(G.TotalEligibleDonationsUs80G)<=N(G.TotalDonationsUs80G)+tol,
    "Schedule 80G: the eligible amount of donations cannot be more than the total donations.");
  /* A147 — 80G: a PAN entered in one bucket cannot be entered in any other bucket. */
  A(147, !I.Schedule80G || (function(){
      const buckets=["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"];
      const m={}; let ok=true;
      buckets.forEach((b,bi)=>{ (RG(G,b+".DoneeWithPan",[])||[]).forEach(r=>{
        if(!r)return; const p=String(r.DoneePAN||"").toUpperCase(); if(!p)return;
        if(m[p]!=null && m[p]!==bi) ok=false; m[p]=bi; }); });
      return ok; })(),
    "Schedule 80G: a PAN already entered in one set of blocks (100%/50%, with or without qualifying limit) cannot be entered in any other block.");

  /* ===================== Part-B tax computation roll-up ===================== */
  /* A140 — total tax, fee & interest = balance tax after relief (net tax liability) + total interest & fee. */
  A(140, REQ(N(TC.TotTaxPlusIntrstPay), N(TC.NetTaxLiability)+N(TC.TotalIntrstPay), 2),
    "Total Tax, Fee & Interest must equal the balance tax after relief plus the total interest and fee payable.");

  /* ===================== Exempt income / salary allowances ===================== */
  /* A141 — Sec 10(17A) (award instituted by Government) can be selected only once. */
  A(141, eiCount("10(17A)")<=1,
    "Exempt income: Sec 10(17A) (award instituted by Government) can be selected only once.");
  /* A142 — 10(10AA) leave encashment above Rs.25,00,000 barred for an employer other than
     Central/State Government or CG/SG pensioners. */
  A(142, inL(empcat,GOVT_PEN10AA) || alwAmt("10(10AA)")<=2500000+tol,
    "Exempt allowance u/s 10(10AA) (leave encashment) cannot exceed Rs.25,00,000 for an employer category other than Central/State Government or CG/SG pensioners.");
  /* A145 — dividend income total = sum of the quarterly break-up of dividend income. */
  osRows.forEach(r=>{
    if(r && String(r.OthSrcNatureDesc)==="DIV" && r.DividendInc){
      const dr = RG(r,"DividendInc.DateRange",{})||{};
      A(145, REQ(N(r.OthSrcOthAmount),
          N(dr.Upto15Of6)+N(dr.Upto15Of9)+N(dr.Up16Of9To15Of12)+N(dr.Up16Of12To15Of3)+N(dr.Up16Of3To31Of3), 2),
        "Income details: the total dividend income must equal the sum of the quarterly break-up of dividend income.");
    }
  });

  /* ===================== New-regime Chapter-VI-A bar (B5) ===================== */
  /* A146 — new regime: the Chapter-VI-A deductions B5(a)…(s) must all be 0
     (every 80-series deduction except 80CCD(2) employer NPS and 80CCH Agniveer). */
  const B5KEYS=["Section80C","Section80CCC","Section80CCDEmployeeOrSE","Section80CCD1B",
    "Section80D","Section80DD","Section80DDB","Section80E","Section80EE","Section80EEA",
    "Section80EEB","Section80G","Section80GG","Section80GGA","Section80GGC","Section80U",
    "Section80TTA","Section80TTB"];
  A(146, old || B5KEYS.reduce((a,k)=>a+N(usr[k]),0)===0,
    "New regime: the Chapter-VI-A deductions at B5(a) to B5(s) (every 80-series deduction other than 80CCD(2) and 80CCH) must not be more than zero.");

  /* ===================== Section-10(14) allowance bars ===================== */
  /* A148 — new regime: 10(14)(ii) transport allowance to a physically handicapped
     assessee (the 115BAC-permitted code) cannot exceed Rs.38,400. */
  A(148, old || alwAmt("10(14)(ii)(115BAC)")<=38400+tol,
    "New regime: the exempt allowance u/s 10(14)(ii) — transport allowance granted to certain physically handicapped assessees — cannot exceed Rs.38,400.");
  /* A149 — new regime: the non-permitted salary allowances 10(5) / 10(13A) / 10(14)(i) /
     10(14)(ii) must all be 0 (only the 115BAC-permitted subset survives). */
  A(149, old || (alwAmt("10(5)")+alwAmt("10(13A)")+alwAmt("10(14)(i)")+alwAmt("10(14)(ii)"))===0,
    "New regime: the exempt allowances u/s 10(5), 10(13A), 10(14)(i) and 10(14)(ii) are not permitted and must not be more than zero.");
  /* A150 — old regime: the 115BAC-specific Rule-2BB allowance codes 10(14)(i)(115BAC) /
     10(14)(ii)(115BAC) must be 0 (the plain 10(14)(i)/(ii) codes are used instead). */
  A(150, !old || (alwAmt("10(14)(i)(115BAC)")+alwAmt("10(14)(ii)(115BAC)"))===0,
    "Old regime: the new-regime-specific allowances u/s 10(14)(i)(115BAC) and 10(14)(ii)(115BAC) must not be more than zero.");
});
