/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-A validation rules, batch enc_02 (Phase 6).
   Serial range A51–A100 (the Other-Sources single-selects + the head roll-up
   and 57(iia) family-pension deduction, the Salary head arithmetic and the
   section-10 allowance ceilings, the Schedule-80G donation buckets/totals and
   the >Rs.2,000 cash exclusion, the Schedule-80GGA donation checks, and the
   Schedule IT / TDS1 / TDS2 / TDS3 / TCS totals and per-row credit caps).

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / (X||{}) / S0); nothing throws. Keys are the built-return ITR1 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths and enum codes were
   taken from books/ITR-1/schema_tree.md, blocks.json, caps.md, enums.json and
   the section builders (70_sec_os expOs, 70_sec_sal expSal, 70_sec_ded expDed,
   70_sec_paid expPaid). Encoded from each rule's own text (constitution rule 6).

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (raw entry n = tail of rule n−1 + head of rule n); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Regime gate: FilingStatus.OptOutNewTaxRegime — "Y" = OLD regime, else NEW.
   The section-10 allowance rows (AllwncExemptUs10) and the OS/80G/80GGA blocks
   are read only where present; schedule-scoped assertions run under `if(I.<blk>)`
   equivalents (a `!I.<block> ||` guard), so a return without the block is silent.

   All 50 serials in A51–A100 are ENFORCED (books/ITR-1/rule_census.md); none is
   NA or OFFLINE in this band, so nothing is skipped. A88 encodes the cash->2,000
   exclusion as the per-row invariant EligibleDonationAmt <= other-mode +
   (cash<=2,000 ? cash : 0) — the built eligible base (ded_gBase) that a lawful
   return always satisfies and a >2,000 cash inclusion breaks.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";          /* "present / non-blank" */
  const inL=(v,a)=>a.indexOf(v)>=0;
  const tol=1;
  const yrOk=v=>S0(v)&&String(v)!=="0"&&String(v).toLowerCase()!=="null";

  /* ---- guarded reads ---- */
  const ID  = RG(I,"ITR1_IncomeDeductions",{})||{};
  const usr = RG(ID,"UsrDeductUndChapVIA",{})||{};     /* entered  Chapter VI-A */
  const alw = RG(ID,"DeductUndChapVIA",{})||{};         /* allowed  Chapter VI-A */
  const FS  = RG(I,"FilingStatus",{})||{};
  const PI  = RG(I,"PersonalInfo",{})||{};
  const VER = RG(I,"Verification.Declaration",{})||{};

  const old    = String(FS.OptOutNewTaxRegime)==="Y";   /* Y = OLD regime */
  const empcat = String(PI.EmployerCategory==null?"":PI.EmployerCategory);
  const GOVTPSU= ["CGOV","SGOV","PSU"];                  /* CG / SG / PSU (16(ii); 10(10) 20L set complement) */
  const GRAT20 = ["PSU","PEPS","PEO","OTH"];             /* the Rs.20L gratuity 10(10) set (non-Govt) */
  const aPAN   = String(PI.PAN==null?"":PI.PAN).toUpperCase();
  const vPAN   = String(VER.AssesseeVerPAN==null?"":VER.AssesseeVerPAN).toUpperCase();

  /* ---- salary head ---- */
  const sal17 = N(ID.Salary);                            /* 17(1) */
  const perq  = N(ID.PerquisitesValue);                  /* 17(2) */
  const prof  = N(ID.ProfitsInSalary);                   /* 17(3) */
  const gross = N(ID.GrossSalary);
  const netSal= N(ID.NetSalary);
  const d16   = N(ID.DeductionUs16);
  const d16ia = N(ID.DeductionUs16ia);
  const ent16 = N(ID.EntertainmentAlw16ii);
  const pt16  = N(ID.ProfessionalTaxUs16iii);
  const incSal= N(ID.IncomeFromSal);
  const exAllw= N(RG(ID,"AllwncExemptUs10.TotalAllwncExemptUs10",0));

  /* section-10 salary allowance rows */
  const allw10 = RG(ID,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  const allwAmt= code=>allw10.filter(r=>r&&String(r.SalNatureDesc)===code)
                             .reduce((a,r)=>a+N(r.SalOthAmount),0);
  const allwCnt= code=>allw10.filter(r=>r&&String(r.SalNatureDesc)===code).length;
  const allwSum= allw10.reduce((a,r)=>a+N(r&&r.SalOthAmount),0);

  /* ---- other sources ---- */
  const incOS = N(ID.IncomeOthSrc);
  const d57   = N(ID.DeductionUs57iia);
  const osRows= RG(ID,"OthersInc.OthersIncDtlsOthSrc",[])||[];
  const osAmt = code=>osRows.filter(r=>r&&String(r.OthSrcNatureDesc)===code)
                            .reduce((a,r)=>a+N(r.OthSrcOthAmount),0);
  const osCount=code=>osRows.filter(r=>r&&String(r.OthSrcNatureDesc)===code).length;
  const osSum = osRows.reduce((a,r)=>a+N(r&&r.OthSrcOthAmount),0);

  /* ===================== Other Sources (A51–A56) ===================== */
  /* A51 — "Interest from deposits" (IFD) can be selected only once. */
  A(51, osCount("IFD")<=1,
    "Income from Other Sources: interest from deposits (bank/post office/co-operative society) can be selected only once.");
  /* A52 — Income from other sources = sum of the row amounts less the 57(iia) deduction. */
  A(52, REQ(incOS, osSum - d57, 2),
    "Income from other sources must equal the sum of the individual amounts entered (less the deduction u/s 57(iia)).");
  /* A53 — 57(iia) allowed only where family pension (FAP) is offered to tax. */
  A(53, !(d57>0) || osAmt("FAP")>0,
    "Deduction u/s 57(iia) is allowed only when family pension is offered to tax under Income from Other Sources.");
  /* A54 — old: 57(iia) <= lower of 1/3 of family pension or Rs.15,000. */
  A(54, !old || d57 <= Math.min(osAmt("FAP")/3, 15000)+tol,
    "Old regime: deduction u/s 57(iia) cannot exceed the lower of one-third of the family pension or Rs.15,000.");
  /* A55 — "Interest from Income-Tax Refund" (TAX) can be selected only once. */
  A(55, osCount("TAX")<=1,
    "Income from Other Sources: interest on an income-tax refund can be selected only once.");
  /* A56 — "Family pension" (FAP) can be selected only once. */
  A(56, osCount("FAP")<=1,
    "Income from Other Sources: family pension can be selected only once.");

  /* ===================== Salary head + section-10 allowances (A57–A77) ===================== */
  /* A57 — old & CG/SG/PSU: entertainment 16(ii) <= lower of Rs.5,000 or 1/5 of salary 17(1). */
  A(57, !old || !inL(empcat,GOVTPSU) || ent16 <= Math.min(5000, sal17/5)+tol,
    "Old regime: for a Central/State Government or PSU employee the entertainment allowance u/s 16(ii) is allowed to the extent of Rs.5,000 or one-fifth of salary, whichever is lower.");
  /* A58 — old & NOT CG/SG/PSU: no entertainment allowance 16(ii). */
  A(58, !old || inL(empcat,GOVTPSU) || ent16===0,
    "Old regime: no entertainment allowance u/s 16(ii) is allowed to an employee other than Central Government, State Government or PSU.");
  /* A59 — Gross salary = 17(1) + 17(2) + 17(3). */
  A(59, REQ(gross, sal17+perq+prof, 2),
    "Gross salary must be the total of salary u/s 17(1), value of perquisites u/s 17(2) and profits in lieu of salary u/s 17(3).");
  /* A60 — Net salary = Gross salary − allowances exempt u/s 10. */
  A(60, REQ(netSal, gross - exAllw, 2),
    "Net salary must be the difference between gross salary and the allowances exempt u/s 10.");
  /* A61 — Deduction u/s 16 = 16(ia) + 16(ii) + 16(iii). */
  A(61, REQ(d16, d16ia+ent16+pt16, 2),
    "Deduction u/s 16 (B1iv) must be the sum of 16(ia), entertainment allowance 16(ii) and professional tax 16(iii).");
  /* A62 — Income chargeable under Salaries = Net salary − Deduction u/s 16. */
  A(62, REQ(incSal, netSal - d16, 2),
    "Income chargeable under Salaries (B1v) must be net salary less the deduction u/s 16 (B1iii − B1iv).");
  /* A63 — total allowances exempt u/s 10 cannot exceed Gross salary. */
  A(63, exAllw <= gross+tol,
    "The total of allowances exempt u/s 10 cannot be more than the gross salary.");
  /* A64 — old: 10(5) leave travel concession <= salary 17(1). */
  A(64, !old || allwAmt("10(5)") <= sal17+tol,
    "Old regime: exemption u/s 10(5) (leave travel concession) cannot exceed the salary as per section 17(1).");
  /* A65 — 10(6) remuneration of an embassy official <= Gross salary. */
  A(65, allwAmt("10(6)") <= gross+tol,
    "Exempt allowance u/s 10(6) cannot exceed the gross salary.");
  /* A66 — 10(7) Government allowances paid outside India <= Gross salary. */
  A(66, allwAmt("10(7)") <= gross+tol,
    "Exempt allowance u/s 10(7) cannot exceed the gross salary.");
  /* A67 — 10(10) gratuity <= Rs.20,00,000 for PSU / non-Government employees & their pensioners. */
  A(67, !inL(empcat,GRAT20) || allwAmt("10(10)") <= 2000000+tol,
    "Exempt gratuity u/s 10(10) cannot exceed Rs.20,00,000 for a PSU / Others employee (or PSU / Others pensioner).");
  /* A68 — 10(10A) commuted value of pension <= salary 17(1). */
  A(68, allwAmt("10(10A)") <= sal17+tol,
    "Exempt allowance u/s 10(10A) (commuted value of pension) cannot exceed the salary as per section 17(1).");
  /* A69 — 10(10AA) leave encashment on retirement <= salary 17(1). */
  A(69, allwAmt("10(10AA)") <= sal17+tol,
    "Exempt allowance u/s 10(10AA) (leave encashment on retirement) cannot exceed the salary as per section 17(1).");
  /* A70 — 10(10B) first proviso (compensation notified by CG) <= Rs.5,00,000. */
  A(70, allwAmt("10(10B)(i)") <= 500000+tol,
    "Exempt allowance u/s 10(10B) first proviso (compensation limit notified by the Central Government) cannot exceed Rs.5,00,000.");
  /* A71 — 10(10C) amount on voluntary retirement <= Rs.5,00,000. */
  A(71, allwAmt("10(10C)") <= 500000+tol,
    "Exempt allowance u/s 10(10C) (amount on voluntary retirement) cannot exceed Rs.5,00,000.");
  /* A72 — only one of 10(10B)(i) / 10(10B)(ii) / 10(10C) can be selected. */
  A(72, allwCnt("10(10B)(i)")+allwCnt("10(10B)(ii)")+allwCnt("10(10C)") <= 1,
    "In the exempt allowances only one of section 10(10B)(i), 10(10B)(ii) or 10(10C) can be selected.");
  /* A73 — 10(10CC) tax on non-monetary perquisite <= value of perquisites 17(2). */
  A(73, allwAmt("10(10CC)") <= perq+tol,
    "Exempt allowance u/s 10(10CC) (tax paid by the employer on a non-monetary perquisite) cannot exceed the value of perquisites as per section 17(2).");
  /* A74 — old: 10(13A) house rent allowance <= salary 17(1). */
  A(74, !old || allwAmt("10(13A)") <= sal17+tol,
    "Old regime: exempt allowance u/s 10(13A) (house rent allowance) cannot exceed the salary as per section 17(1).");
  /* A75 — old: 10(14)(i) prescribed duty allowance <= salary 17(1). */
  A(75, !old || allwAmt("10(14)(i)") <= sal17+tol,
    "Old regime: exempt allowance u/s 10(14)(i) cannot exceed the salary as per section 17(1).");
  /* A76 — old: 10(14)(ii) prescribed personal allowance <= salary 17(1). */
  A(76, !old || allwAmt("10(14)(ii)") <= sal17+tol,
    "Old regime: exempt allowance u/s 10(14)(ii) cannot exceed the salary as per section 17(1).");
  /* A77 — total allowances exempt u/s 10 = sum of the individual allowance rows. */
  A(77, REQ(exAllw, allwSum, 2),
    "The total of allowances exempt u/s 10 must equal the sum of the individual values entered.");

  /* ===================== Schedule 80G donation buckets (A78–A88) ===================== */
  const G     = RG(I,"Schedule80G",{})||{};
  const GBUCK = ["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"];
  const gRows = bk=>RG(G,bk+".DoneeWithPan",[])||[];
  const gTot  = bk=>N(RG(G,bk+".TotDon"+bk,0));
  /* A78 — donee PAN must not equal the assessee PAN or the verification PAN. */
  A(78, !I.Schedule80G || GBUCK.every(bk=>gRows(bk).every(r=>{
      const p=String((r&&r.DoneePAN)==null?"":r.DoneePAN).toUpperCase();
      return !S0(p) || (p!==aPAN && p!==vPAN);
    })),
    "Schedule 80G: the donee PAN cannot be the same as the assessee PAN or the PAN at verification.");
  /* A79–A82 — each bucket: donation in cash or in other mode is mandatory where a total donation is entered. */
  const gMand = bk=>gRows(bk).every(r=>
      !(N(r&&r.DonationAmt)>0) || (N(r&&r.DonationAmtCash)>0 || N(r&&r.DonationAmtOtherMode)>0));
  A(79, !I.Schedule80G || gMand("Don100Percent"),
    "Schedule 80G table A (100% deduction without qualifying limit): a donation in cash or in other mode must be entered before the total donation column.");
  A(80, !I.Schedule80G || gMand("Don50PercentNoApprReqd"),
    "Schedule 80G table B (50% deduction without qualifying limit): a donation in cash or in other mode must be entered before the total donation column.");
  A(81, !I.Schedule80G || gMand("Don100PercentApprReqd"),
    "Schedule 80G table C (100% deduction subject to qualifying limit): a donation in cash or in other mode must be entered before the total donation column.");
  A(82, !I.Schedule80G || gMand("Don50PercentApprReqd"),
    "Schedule 80G table D (50% deduction subject to qualifying limit): a donation in cash or in other mode must be entered before the total donation column.");
  /* A83 — Table E total donation = sum of the four bucket totals. */
  A(83, !I.Schedule80G || REQ(N(G.TotalDonationsUs80G), GBUCK.reduce((a,bk)=>a+gTot(bk),0), 2),
    "Schedule 80G table E: total donation must equal the sum of the four bucket donation totals (100%/50%, with and without qualifying limit).");
  /* A84–A87 — each bucket: each row's total donation = cash + other mode. */
  const gAdd = bk=>gRows(bk).every(r=>
      REQ(N(r&&r.DonationAmt), N(r&&r.DonationAmtCash)+N(r&&r.DonationAmtOtherMode), 2));
  A(84, !I.Schedule80G || gAdd("Don100Percent"),
    "Schedule 80G table A: total donation must equal donation in cash plus donation in other mode.");
  A(85, !I.Schedule80G || gAdd("Don50PercentNoApprReqd"),
    "Schedule 80G table B: total donation must equal donation in cash plus donation in other mode.");
  A(86, !I.Schedule80G || gAdd("Don100PercentApprReqd"),
    "Schedule 80G table C: total donation must equal donation in cash plus donation in other mode.");
  A(87, !I.Schedule80G || gAdd("Don50PercentApprReqd"),
    "Schedule 80G table D: total donation must equal donation in cash plus donation in other mode.");
  /* A88 — a cash donation above Rs.2,000 is excluded from the eligible amount of donation. */
  A(88, !I.Schedule80G || GBUCK.every(bk=>gRows(bk).every(r=>{
      const cash=N(r&&r.DonationAmtCash), oth=N(r&&r.DonationAmtOtherMode);
      return N(r&&r.EligibleDonationAmt) <= oth + (cash<=2000?cash:0) + tol;
    })),
    "Schedule 80G: a cash donation of more than Rs.2,000 cannot be counted in the eligible amount of donation.");

  /* ===================== Schedule 80GGA (A89–A94) ===================== */
  const GGA     = RG(I,"Schedule80GGA",{})||{};
  const ggaRows = RG(GGA,"DonationDtlsSciRsrchRuralDev",[])||[];
  /* A89 — donation in cash or in other mode is mandatory where a total donation is entered. */
  A(89, !I.Schedule80GGA || ggaRows.every(r=>
      !(N(r&&r.DonationAmt)>0) || (N(r&&r.DonationAmtCash)>0 || N(r&&r.DonationAmtOtherMode)>0)),
    "Schedule 80GGA: a donation in cash or in other mode must be entered before the total donation column.");
  /* A90 — total donations 80GGA = cash + other mode. */
  A(90, !I.Schedule80GGA || REQ(N(GGA.TotalDonationsUs80GGA),
      N(GGA.TotalDonationAmtCash80GGA)+N(GGA.TotalDonationAmtOtherMode80GGA), 2),
    "Schedule 80GGA: total donations must equal donation in cash plus donation in other mode.");
  /* A91 — 80GGA claimed => the details are provided in Schedule 80GGA. */
  A(91, !(N(usr.Section80GGA)>0) || !!I.Schedule80GGA,
    "Deduction u/s 80GGA is claimed but the details are not provided in Schedule 80GGA.");
  /* A92 — eligible amount of donation cannot exceed total donations (80GGA). */
  A(92, !I.Schedule80GGA || N(GGA.TotalEligibleDonationAmt80GGA) <= N(GGA.TotalDonationsUs80GGA)+tol,
    "Schedule 80GGA: the eligible amount of donations cannot be more than the total donations.");
  /* A93 — 80GGA claimed in Schedule VIA cannot exceed the eligible donation in Schedule 80GGA. */
  A(93, !I.Schedule80GGA || N(usr.Section80GGA) <= N(GGA.TotalEligibleDonationAmt80GGA)+tol,
    "The deduction claimed u/s 80GGA in Schedule VIA cannot exceed the eligible amount of donation in Schedule 80GGA.");
  /* A94 — donee PAN must not equal the assessee PAN or the verification PAN. */
  A(94, !I.Schedule80GGA || ggaRows.every(r=>{
      const p=String((r&&r.DoneePAN)==null?"":r.DoneePAN).toUpperCase();
      return !S0(p) || (p!==aPAN && p!==vPAN);
    }),
    "Schedule 80GGA: the donee PAN cannot be the same as the assessee PAN or the PAN at verification.");

  /* ===================== Schedule IT / TDS / TCS totals & caps (A95–A100) ===================== */
  const IT      = RG(I,"TaxPayments",{})||{};
  const itRows  = RG(IT,"TaxPayment",[])||[];
  const TCS     = RG(I,"ScheduleTCS",{})||{};
  const tcsRows = RG(TCS,"TCS",[])||[];
  const TDS2    = RG(I,"TDSonOthThanSals",{})||{};
  const tds2Rows= RG(TDS2,"TDSonOthThanSal",[])||[];
  const TDS3    = RG(I,"ScheduleTDS3Dtls",{})||{};
  const tds3Rows= RG(TDS3,"TDS3Details",[])||[];
  const TDS1    = RG(I,"TDSonSalaries",{})||{};
  const tds1Rows= RG(TDS1,"TDSonSalary",[])||[];
  /* A95 — Schedule IT col 4 total (tax paid) = sum of the individual challan amounts. */
  A(95, !I.TaxPayments || REQ(N(IT.TotalTaxPayments), itRows.reduce((a,r)=>a+N(r&&r.Amt),0), 2),
    "Schedule IT: the total of column 4 (tax paid) must equal the sum of the individual challan amounts.");
  /* A96 — Schedule TCS: TCS claimed this year cannot exceed the tax collected (per row). */
  A(96, !I.ScheduleTCS || tcsRows.every(r=> N(r&&r.AmtTCSClaimedThisYear) <= N(r&&r.AmtTaxCollected)+tol),
    "Schedule TCS: the amount of TCS claimed this year cannot be more than the tax collected.");
  /* A97 — Schedule TCS col 6 total = sum of the TCS claimed this year. */
  A(97, !I.ScheduleTCS || REQ(N(TCS.TotalSchTCS), tcsRows.reduce((a,r)=>a+N(r&&r.AmtTCSClaimedThisYear),0), 2),
    "Schedule TCS: the total of column 6 (TCS credit claimed this year) must equal the sum of the individual values.");
  /* A98 — Schedule TDS2: TDS claimed this year cannot exceed the tax deducted (per row). */
  A(98, !I.TDSonOthThanSals || tds2Rows.every(r=> N(r&&r.ClaimOutOfTotTDSOnAmtPaid) <= N(r&&r.TotTDSOnAmtPaid)+tol),
    "Schedule TDS2 (other than salary): the amount of TDS claimed this year cannot be more than the tax deducted.");
  /* A99 — TDS2 / TDS3 / TCS year of deduction/collection cannot be 0 or null where a credit is claimed. */
  A(99, (!I.TDSonOthThanSals || tds2Rows.every(r=> !(N(r&&r.ClaimOutOfTotTDSOnAmtPaid)>0) || yrOk(r&&r.DeductedYr)))
     && (!I.ScheduleTDS3Dtls || tds3Rows.every(r=> !(N(r&&r.TDSClaimed)>0) || yrOk(r&&r.DeductedYr)))
     && (!I.ScheduleTCS      || tcsRows.every(r=> !(N(r&&r.AmtTCSClaimedThisYear)>0) || yrOk(r&&r.CollectedYr))),
    "Schedule TDS2, TDS3 / TCS: the year of tax deduction/collection cannot be 0 or null where a TDS/TCS credit is claimed.");
  /* A100 — Schedule TDS1 col 5 total (total tax deducted) = sum of the individual values. */
  A(100, !I.TDSonSalaries || REQ(N(TDS1.TotalTDSonSalaries), tds1Rows.reduce((a,r)=>a+N(r&&r.TotalTDSSal),0), 2),
    "Schedule TDS1: the total of column 5 (total tax deducted) must equal the sum of the individual values.");
});
