/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-A validation rules, batch enc_01 (Phase 6).
   Serial range A1–A50 (Chapter VI-A ceilings 80C/80CCD/80DDB/80TTA/80TTB and
   the VI-A totals, the Part-B tax-computation roll-ups, the gross-/total-income
   identities, the Schedule-80G opening checks, the exempt-income single-select
   rules, the salary-schedule 10(17) allowance uniqueness, the house-property
   arithmetic + self-occupied caps, and the Other-Sources single-selects).

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / (X||{}) / S0); nothing throws. Keys are the built-return ITR1 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths and enum codes were
   taken from books/ITR-1/schema_tree.md, blocks.json, caps.md, enums.json and
   the section builders (70_sec_ded expDed, 70_sec_sal expSal, 70_sec_hp expHP,
   70_sec_os expOs, 70_sec_ei expEi, 70_sec_tax expTax, 70_sec_paid expPaid).
   Encoded from each rule's own text (constitution rule 6).

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (raw entry n = tail of rule n−1 + head of rule n); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Regime gate: FilingStatus.OptOutNewTaxRegime — "Y" = OLD regime (the ceilings
   in this batch apply), "N" = NEW regime (default). The new-regime "must be 0"
   mirrors live in later batches (enc_04). The Chapter-VI-A DETAIL schedules are
   built only under the OLD regime (schema_tree §19 / caps §1), so schedule reads
   are additionally guarded by `if(I.<block>)`.

   Serials in A1–A50 NOT encoded here, and why (bucketed in the census —
   books/ITR-1/rule_census.md — never faked):
     A7  — OFFLINE-IMPOSSIBLE. 80DDB "Self or Dependent" Rs.40,000 vs senior-
            patient Rs.1,00,000 turns on Section80DDBUsrType, which expDed does
            NOT emit to the built return; only the <=1,00,000 bound (A5) is
            offline-checkable, so the 40,000 branch is not faithfully encodable.
     A19 — OFFLINE-IMPOSSIBLE. Name in the return vs the PAN database — external
            DB not shipped (the portal resolves it at upload).
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
  const IP  = RG(TC,"IntrstPay",{})||{};
  const LT  = RG(I,"LTCG112A",{})||{};
  const TP  = RG(I,"TaxPaid",{})||{};

  const old    = String(FS.OptOutNewTaxRegime)==="Y";   /* Y = OLD regime */
  const empcat = String(PI.EmployerCategory==null?"":PI.EmployerCategory);
  const dob    = PI.DOB;                                 /* ISO yyyy-mm-dd */
  const PENS   = ["PE","PESG","PEPS","PEO","NA"];        /* pensioners / Not-Applicable */
  const GOVT   = ["CGOV","SGOV"];                        /* Central / State Government */

  /* salary head */
  const sal17 = N(ID.Salary);                            /* salary as per 17(1) */
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

  /* income aggregates */
  const gti   = N(ID.GrossTotIncome);                    /* GTI excl LTCG 112A */
  const gtiL  = N(ID.GrossTotIncomeIncLTCG112A);         /* GTI incl LTCG 112A */
  const totInc= N(ID.TotalIncome);
  const incHP = N(ID.TotalIncomeChargeableUnHP);
  const incOS = N(ID.IncomeOthSrc);
  const ltcg  = N(LT.LongCap112A);
  const tpPaid= N(RG(TP,"TaxesPaid.TotalTaxesPaid",0));

  /* repeating rows */
  const osRows = RG(ID,"OthersInc.OthersIncDtlsOthSrc",[])||[];
  const eiRows = RG(ID,"ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls",[])||[];
  const eiTot  = N(RG(ID,"ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total",0));
  const allw10 = RG(ID,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  const props  = RG(ID,"PropertyDetails",[])||[];

  const osAmt   = code => osRows.filter(r=>r&&String(r.OthSrcNatureDesc)===code)
                                .reduce((a,r)=>a+N(r.OthSrcOthAmount),0);
  const osCount = code => osRows.filter(r=>r&&String(r.OthSrcNatureDesc)===code).length;
  const eiCount = code => eiRows.filter(r=>r&&String(r.SubCategory)===code).length;
  const allwCnt = code => allw10.filter(r=>r&&String(r.SalNatureDesc)===code).length;

  /* the allowed 20 VI-A section keys (schema_tree §7.7) */
  const DEDK=["Section80C","Section80CCC","Section80CCDEmployeeOrSE","Section80CCD1B",
    "Section80CCDEmployer","Section80D","Section80DD","Section80DDB","Section80E","Section80EE",
    "Section80EEA","Section80EEB","Section80G","Section80GG","Section80GGA","Section80GGC",
    "Section80U","Section80TTA","Section80TTB","AnyOthSec80CCH"];
  const alwSum = DEDK.reduce((a,k)=>a+N(alw[k]),0);

  /* ===================== Chapter VI-A ceilings (OLD regime) ===================== */
  /* A1 — old: 80C + 80CCC + 80CCD(1) aggregate <= Rs.1,50,000. */
  A(1, !old || (N(usr.Section80C)+N(usr.Section80CCC)+N(usr.Section80CCDEmployeeOrSE))<=150000+tol,
    "Old regime: the aggregate deduction u/s 80C, 80CCC and 80CCD(1) cannot exceed Rs.1,50,000.");
  /* A2 — old & pensioner/Not-Applicable employer: 80CCD(1) <= 20% of GTI. */
  A(2, !old || !inL(empcat,PENS) || N(usr.Section80CCDEmployeeOrSE)<=0.20*gti+tol,
    "Old regime: for a pensioner / Not-Applicable employer category the deduction u/s 80CCD(1) cannot exceed 20% of gross total income.");
  /* A3 — old & employer NOT pensioner/NA: 80CCD(1) <= 10% of salary. */
  A(3, !old || inL(empcat,PENS) || N(usr.Section80CCDEmployeeOrSE)<=0.10*sal17+tol,
    "Old regime: for an employer other than the pensioner / Not-Applicable categories the deduction u/s 80CCD(1) cannot exceed 10% of salary.");
  /* A4 — old & non-Government employer: 80CCD(2) <= 10% of salary. */
  A(4, !old || inL(empcat,GOVT) || N(usr.Section80CCDEmployer)<=0.10*sal17+tol,
    "Old regime: deduction u/s 80CCD(2) cannot exceed 10% of salary for an employer other than the Central or State Government.");
  /* A5 — old: 80DDB (resident) <= Rs.1,00,000. */
  A(5, !old || N(usr.Section80DDB)<=100000+tol,
    "Old regime: the resident assessee cannot claim more than the maximum limit of Rs.1,00,000 u/s 80DDB.");
  /* A6 — old & 80DDB claimed: the specified-disease description must be provided. */
  A(6, !old || !(N(usr.Section80DDB)>0) || S0(usr.NameOfSpecDisease80DDB),
    "Old regime: deduction u/s 80DDB is claimed but the eligible specified-disease description is not provided.");
  /* A7 — OFFLINE-IMPOSSIBLE (Section80DDBUsrType not emitted); see header. */

  /* ===================== Schedule 80G opening checks (OLD regime) ===================== */
  const G = RG(I,"Schedule80G",{})||{};
  /* A8 — old & 80G claimed: the donation details must be provided in Schedule 80G. */
  A(8, !old || !(N(usr.Section80G)>0) || !!I.Schedule80G,
    "Old regime: deduction u/s 80G is claimed but the donation details are not provided in Schedule 80G.");
  /* A9 — Schedule 80G Table F total = sum of the four bucket donation totals. */
  A(9, !I.Schedule80G || REQ(N(G.TotalDonationsUs80G),
      N(RG(G,"Don100Percent.TotDonDon100Percent",0))
      +N(RG(G,"Don50PercentNoApprReqd.TotDonDon50PercentNoApprReqd",0))
      +N(RG(G,"Don100PercentApprReqd.TotDonDon100PercentApprReqd",0))
      +N(RG(G,"Don50PercentApprReqd.TotDonDon50PercentApprReqd",0)),2),
    "Schedule 80G Table F: total donation must equal the sum of the four bucket donation totals (100%/50%, with and without qualifying limit).");
  /* A10 — old: the 80G deduction claimed in Schedule VIA <= eligible donation in Schedule 80G. */
  A(10, !old || !I.Schedule80G || N(usr.Section80G)<=N(G.TotalEligibleDonationsUs80G)+tol,
    "Old regime: the deduction claimed u/s 80G in Schedule VIA cannot exceed the eligible amount of donation in Schedule 80G.");

  /* ===================== 80TTA / 80TTB (OLD regime + senior gates) ===================== */
  /* A11 — old: 80TTA <= Rs.10,000. */
  A(11, !old || N(usr.Section80TTA)<=10000+tol,
    "Old regime: deduction u/s 80TTA cannot exceed the maximum limit of Rs.10,000.");
  /* A12 — old: 80TTA restricted to savings-account interest (SAV) under Other Sources. */
  A(12, !old || N(usr.Section80TTA)<=osAmt("SAV")+tol,
    "Old regime: deduction u/s 80TTA is restricted to the savings-account interest income offered under Income from Other Sources.");
  /* A13 — 80TTA barred for a senior citizen (DOB on or before 01.04.1966). */
  A(13, !(N(usr.Section80TTA)>0) || !S0(dob) || dob>"1966-04-01",
    "Deduction u/s 80TTA cannot be claimed by a senior citizen (date of birth on or before 01.04.1966).");
  /* A14 — old: 80TTB <= Rs.50,000. */
  A(14, !old || N(usr.Section80TTB)<=50000+tol,
    "Old regime: deduction u/s 80TTB cannot exceed the maximum limit of Rs.50,000.");
  /* A15 — 80TTB only for a senior citizen (DOB before 02.04.1966). */
  A(15, !(N(usr.Section80TTB)>0) || !S0(dob) || dob<"1966-04-02",
    "Deduction u/s 80TTB can be claimed only by a senior citizen (date of birth before 02.04.1966).");
  /* A16 — old: 80TTB restricted to interest income under Other Sources. */
  A(16, !old || N(usr.Section80TTB)<=(osAmt("SAV")+osAmt("IFD")+osAmt("TAX")+osAmt("OII"))+tol,
    "Old regime: a senior citizen's deduction u/s 80TTB is restricted to interest income offered under Income from Other Sources.");

  /* ===================== VI-A totals ===================== */
  /* A17 — total Chapter VI-A deduction = sum of the individual (allowed) deductions. */
  A(17, REQ(N(alw.TotalChapVIADeductions), alwSum, 2),
    "The total of Chapter VI-A deductions must equal the sum of the individual deductions (restricted to gross total income).");
  /* A18 — Chapter VI-A deductions cannot exceed gross total income. */
  A(18, N(alw.TotalChapVIADeductions)<=gti+tol,
    "Deductions claimed under Chapter VI-A cannot be more than the gross total income.");
  /* A19 — OFFLINE-IMPOSSIBLE (name vs PAN database); see header. */

  /* ===================== Part-B tax computation roll-ups ===================== */
  /* A20 — GTI must be > 0 when a tax liability is computed and taxes are paid. */
  A(20, !(tpPaid>0 || N(TC.NetTaxLiability)>0) || gtiL>0,
    "Gross total income must be greater than zero when a tax liability has been computed and taxes have been paid.");
  /* A21 — income details & tax computation must be disclosed when Taxes Paid are disclosed. */
  A(21, !(tpPaid>0) || gtiL>0,
    "Income details and tax computation must be disclosed where details of Taxes Paid have been disclosed.");
  /* A22 — old: GTI (incl LTCG) = Salary + House Property + Other Sources + LTCG u/s 112A. */
  A(22, !old || REQ(gtiL, incSal+incHP+incOS+ltcg, 2),
    "Old regime: gross total income (incl. LTCG u/s 112A) must equal the total of incomes from Salary, House Property, Other Sources and LTCG u/s 112A.");
  /* A23 — old: Rebate 87A barred when total income (incl LTCG) exceeds Rs.5,00,000. */
  A(23, !old || !(totInc>500000) || N(TC.Rebate87A)===0,
    "Old regime: rebate u/s 87A cannot be claimed when total income (including LTCG u/s 112A) exceeds Rs.5,00,000.");
  /* A24 — total income = max(0, GTI incl LTCG − total deductions). */
  A(24, REQ(totInc, Math.max(0, gtiL - N(alw.TotalChapVIADeductions)), 2),
    "Total income must be gross total income (incl. LTCG) less total deductions, or zero if that difference is negative.");
  /* A25 — tax after rebate = tax payable on total income − rebate 87A (floored at 0). */
  A(25, REQ(N(TC.TaxPayableOnRebate), Math.max(0, N(TC.TotalTaxPayable)-N(TC.Rebate87A)), 2),
    "Tax after rebate must equal tax payable on total income less rebate u/s 87A.");
  /* A26 — total tax & cess = tax after rebate + health & education cess. */
  A(26, REQ(N(TC.GrossTaxLiability), N(TC.TaxPayableOnRebate)+N(TC.EducationCess), 2),
    "Total tax and cess must equal tax after rebate plus health & education cess.");
  /* A27 — total tax, fees & interest = (gross tax liability − relief 89) + total interest/fees. */
  A(27, REQ(N(TC.TotTaxPlusIntrstPay), Math.max(0,N(TC.GrossTaxLiability)-N(TC.Section89))+N(TC.TotalIntrstPay), 2),
    "Total tax, fees & interest must equal (gross tax liability less relief u/s 89) plus total interest and fees.");
  /* A28 — total interest & fee payable = 234A + 234B + 234C + 234F + 234-I. */
  A(28, REQ(N(TC.TotalIntrstPay),
      N(IP.IntrstPayUs234A)+N(IP.IntrstPayUs234B)+N(IP.IntrstPayUs234C)
      +N(IP.LateFilingFee234F)+N(IP.FeeFurnish234I), 2),
    "Total interest & fee payable must equal interest u/s 234A + 234B + 234C plus fee u/s 234F + 234-I.");

  /* ===================== Exempt income ===================== */
  /* A29 — agricultural income (10(1)) shown as exempt cannot exceed Rs.5,000. */
  const agri = eiRows.filter(r=>r&&String(r.SubCategory)==="10(1)").reduce((a,r)=>a+N(r.OthAmount),0);
  A(29, agri<=5000,
    "Agricultural income shown as exempt cannot be more than Rs.5,000 (above that the return must go on ITR-2).");
  /* A30 — exempt income total = sum of the individual exempt-income amounts. */
  A(30, !eiRows.length || REQ(eiTot, eiRows.reduce((a,r)=>a+N(r&&r.OthAmount),0), 2),
    "Exempt income must equal the sum of the amounts entered in the individual exempt-income rows.");
  /* A31–A42 — each exempt-income drop-down can be selected only once. */
  A(31, eiCount("10(10BC)")<=1, "Exempt income: Sec 10(10BC) (disaster compensation) can be selected only once.");
  A(32, eiCount("10(10D)")<=1,  "Exempt income: Sec 10(10D) (life-insurance sum) can be selected only once.");
  A(33, eiCount("10(11)")<=1,   "Exempt income: Sec 10(11) (Statutory Provident Fund) can be selected only once.");
  A(34, eiCount("10(12)")<=1,   "Exempt income: Sec 10(12) (Recognized Provident Fund) can be selected only once.");
  A(35, eiCount("10(13)")<=1,   "Exempt income: Sec 10(13) (approved superannuation fund) can be selected only once.");
  A(36, eiCount("10(16)")<=1,   "Exempt income: Sec 10(16) (scholarships) can be selected only once.");
  A(37, allwCnt("10(17)")<=1,   "Exempt allowances (salary): Sec 10(17) (MP/MLA/MLC allowance) can be selected only once.");
  A(38, eiCount("10(18)")<=1,   "Exempt income: Sec 10(18) (gallantry-award pension) can be selected only once.");
  A(39, eiCount("DMD")<=1,      "Exempt income: Defence Medical Disability Pension can be selected only once.");
  A(40, eiCount("10(19)")<=1,   "Exempt income: Sec 10(19) (armed-forces family pension) can be selected only once.");
  A(41, eiCount("10(26)")<=1,   "Exempt income: Sec 10(26) can be selected only once.");
  A(42, eiCount("10(26AAA)")<=1,"Exempt income: Sec 10(26AAA) can be selected only once.");

  /* ===================== House property (per PropertyDetails[]) ===================== */
  props.forEach((p,i)=>{
    p=p||{};
    const rd  = RG(p,"Rentdetails",{})||{};
    const alv = N(rd.AnnualLetableValue);
    const taxes=N(rd.LocalTaxes);
    const bal = N(rd.BalanceALV);
    const aop = N(rd.AnnualOfPropOwned);
    const std = N(rd.ThirtyPercentOfBalance);
    const intc= N(rd.IntOnBorwCap);
    const arr = N(rd.ArrearsUnrealizedRentRcvd);
    const inc = N(rd.IncomeOfHP);
    const type= String(p.ifLetOut==null?"":p.ifLetOut);     /* S / L / D */
    const co  = String(p.PropCoOwnedFlg)==="YES";
    const tag = " (property "+(i+1)+")";
    /* A43 — standard deduction = 30% of the annual value. */
    A(43, REQ(std, Math.round(0.30*aop), 2) || REQ(std, Math.round(0.30*bal), 2),
      "Standard deduction on house property must be equal to 30% of the annual value."+tag);
    /* A44 — annual lettable value > 0 when municipal tax is claimed. */
    A(44, !(taxes>0) || alv>0,
      "Gross rent / annual lettable value must be greater than zero when municipal tax is being claimed."+tag);
    /* A45 — let-out / deemed-let-out property must carry a gross rent > 0. */
    A(45, !(type==="L"||type==="D") || alv>0,
      "For a let-out or deemed-let-out property the gross rent / annual lettable value must be greater than zero."+tag);
    /* A46 — annual value (B2iii) = balance ALV − taxes to local authorities (not for co-owned share). */
    A(46, co || REQ(aop, bal - taxes, 2),
      "Annual value must be the balance annual value less the tax paid to local authorities (B2iii = B2i − B2ii)."+tag);
    /* A47 — income chargeable HP = annual value − 30% deduction − interest u/s 24(b) + arrears. */
    A(47, REQ(inc, aop - std - intc + arr, 2),
      "Income chargeable under House Property must equal the annual value less 30% deduction less interest u/s 24(b) plus arrears (iii − iv − v + vi)."+tag);
    /* A48 — old: self-occupied 24(b) interest <= Rs.2,00,000. */
    A(48, !old || type!=="S" || intc<=200000+tol,
      "Old regime: for a self-occupied property the interest on borrowed capital cannot exceed Rs.2,00,000."+tag);
    /* A49 — self-occupied property: tax paid to local authorities is not allowed. */
    A(49, type!=="S" || taxes===0,
      "Tax paid to local authorities is not allowed for a self-occupied property."+tag);
  });

  /* ===================== Other Sources single-select ===================== */
  /* A50 — "Interest from savings account" (SAV) can be selected only once. */
  A(50, osCount("SAV")<=1,
    "Income from Other Sources: interest from savings account can be selected only once.");
});
