/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-A validation rules, batch enc_05 (Phase 6).
   Serial range A201–A250: the disability-deduction schedules (80U / 80DD flat
   amounts + "details required"), the salary/regime gates (nature of employment,
   exempt-allowance single-disclosure, new-regime 57(iia)/16(ia)/80CCD(2) caps),
   the exempt LTCG u/s 112A disclosure, the section-24(b) / 80EE / 80EEA / 80EEB
   housing-loan schedules and their bank-detail + limit checks, the PRAN / Form
   10BA / Form 10-IA / specified-disease supporting-detail requirements, the 80D
   premium-row reconciliations, and the "Schedule VIA amount = schedule total"
   and "rows sum = schedule total" identities for 80C / 80E / 80EE / 80EEA /
   80EEB and the section-24(b) loan table.

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / (X||{}) / S0); nothing throws. Keys are the built-return ITR1 schema
   paths (I = Object.values(buildReturn().ITR)[0]); paths and codes taken from
   books/ITR-1/schema_tree.md, caps.md, enums.json and the section builders
   (70_sec_ded expDed, 70_sec_hp expHP, 70_sec_os expOs, 70_sec_who expWho).
   Encoded from each rule's own re-joined text (constitution rule 6); the
   rules.json line-wrap offsets each raw entry by ~one physical line, so the
   assertions below follow the SEMANTIC rule (per books/ITR-1/rule_census.md),
   not the raw fragment.

   Regime gate: FilingStatus.OptOutNewTaxRegime — "Y" = OLD regime, "N" = NEW
   (default). The old-regime detail schedules (Schedule80U/80DD/80D/80C/80E/…)
   are emitted by expDed only under the OLD regime, and the entered VI-A leaves
   (UsrDeductUndChapVIA.*) carry 0 under the new regime; the schedule reads are
   therefore additionally guarded by `if(I.<block>)` and the amount reads never
   throw when a block is absent.

   Duplicate serials in the source list (both ENFORCED — encoded, never faked):
     A206 / A209 — both "80DD deduction > 0 ⇒ details required"; encoded to the
                   two distinct mandatory details (nature of disability; type of
                   dependant / disability) so each targets a real omission.
     A207 / A208 — both "80U  deduction > 0 ⇒ details required"; encoded to the
                   nature and the type of disability respectively.

   Serials in A201–A250 NOT encoded here, and why (bucketed in the census —
   books/ITR-1/rule_census.md — never faked):
     A212 — NA. Aadhaar in the return vs Aadhaar as per the portal profile — an
            external profile the built return does not carry (resolved at upload).
     A219 — NA. 139(9) A23 responses vs the defective original return — a portal
            cross-return check; the built return carries no prior-return context.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";          /* "present / non-blank" */
  const NM=v=>String(v==null?"":v).trim().toUpperCase();
  const tol=1;

  /* ---- guarded reads ---- */
  const ID  = RG(I,"ITR1_IncomeDeductions",{})||{};
  const usr = RG(ID,"UsrDeductUndChapVIA",{})||{};      /* entered Chapter VI-A */
  const FS  = RG(I,"FilingStatus",{})||{};
  const PI  = RG(I,"PersonalInfo",{})||{};
  const LT  = RG(I,"LTCG112A",{})||{};

  const old    = String(FS.OptOutNewTaxRegime)==="Y";   /* Y = OLD regime */
  const empcat = String(PI.EmployerCategory==null?"":PI.EmployerCategory);

  /* salary / income leaves (schema keys per expWho / expSal / expOs) */
  const sal17  = N(ID.Salary);                          /* salary as per 17(1) */
  const gross  = N(ID.GrossSalary);
  const netSal = N(ID.NetSalary);
  const incSal = N(ID.IncomeFromSal);
  const d16ia  = N(ID.DeductionUs16ia);
  const d57iia = N(ID.DeductionUs57iia);
  const salPresent = gross>0 || sal17>0 || incSal>0 || netSal>0;

  /* Other-Sources rows (for the family-pension base of 57(iia)) */
  const osRows = RG(ID,"OthersInc.OthersIncDtlsOthSrc",[])||[];
  const osAmt  = code => osRows.filter(r=>r&&String(r.OthSrcNatureDesc)===code)
                               .reduce((a,r)=>a+N(r.OthSrcOthAmount),0);
  const famPen = osAmt("FAP");

  /* exempt salary allowances u/s 10 (each dropdown once) */
  const allw10 = RG(ID,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  const alwCodes = allw10.map(r=>String(r&&r.SalNatureDesc)).filter(S0);

  /* the disability schedules */
  const U   = RG(I,"Schedule80U",{})||{};
  const DDs = RG(I,"Schedule80DD",{})||{};
  const D80 = RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{})||{};

  /* the 80C schedule */
  const C80   = RG(I,"Schedule80C",{})||{};
  const c80Row= RG(C80,"Schedule80CDtls",[])||[];

  /* the education / housing / EV loan schedules */
  const eeRow  = RG(I,"Schedule80EE.Schedule80EEDtls",[])||[];
  const eeaRow = RG(I,"Schedule80EEA.Schedule80EEADtls",[])||[];
  const eebRow = RG(I,"Schedule80EEB.Schedule80EEBDtls",[])||[];

  /* the political-party schedule */
  const ggcRow = RG(I,"Schedule80GGC.Schedule80GGCDetails",[])||[];

  /* house property + its section-24(b) loan tables */
  const props = RG(ID,"PropertyDetails",[])||[];

  const sumRows = (arr,key)=>(arr||[]).reduce((a,r)=>a+N(r&&r[key]),0);
  /* a loan/donee table carries its bank detail when every row names a real bank */
  const banksOk = arr => Array.isArray(arr) && arr.length>0 &&
    arr.every(r=>{ const nm=NM(r&&r.BankOrInstnName); return nm!=="" && nm!=="NA"; });
  /* the set of bank names disclosed across every property's section-24(b) table */
  const b24 = new Set();
  props.forEach(p=>{
    (RG(p,"Rentdetails.Section24B.Section24BDtls",[])||[]).forEach(r=>{
      const nm=NM(r&&r.BankOrInstnName); if(nm&&nm!=="NA") b24.add(nm);
    });
  });
  const banksSubsetOf24 = arr => (arr||[]).every(r=>{
    const nm=NM(r&&r.BankOrInstnName); return nm===""||nm==="NA"||b24.has(nm);
  });

  /* ===================== 80U / 80DD flat amounts (OLD regime) ===================== */
  /* A201 — old: 80U "self with disability" (nature 1) fixes the deduction at 75,000. */
  A(201, !old || !I.Schedule80U || String(U.NatureOfDisability)!=="1" ||
      REQ(N(U.DeductionAmount), 75000, 2),
    "Old regime: for 80U 'self with disability' the amount of deduction must be Rs.75,000.");
  /* A202 — 80U claimed in Schedule VIA ⇒ same amount and details in Schedule 80U. */
  A(202, !(N(usr.Section80U)>0) || (!!I.Schedule80U && REQ(N(U.DeductionAmount), N(usr.Section80U), 2)),
    "Deduction u/s 80U claimed in Chapter VIA must be provided, with the same amount, in Schedule 80U.");
  /* A203 — old: 80DD "dependant with disability" (nature 1) fixes the deduction at 75,000. */
  A(203, !old || !I.Schedule80DD || String(DDs.NatureOfDisability)!=="1" ||
      REQ(N(DDs.DeductionAmount), 75000, 2),
    "Old regime: for 80DD a dependant with a disability fixes the amount of deduction at Rs.75,000.");
  /* A204 — old: 80DD "dependant with severe disability" (nature 2) fixes it at 1,25,000. */
  A(204, !old || !I.Schedule80DD || String(DDs.NatureOfDisability)!=="2" ||
      REQ(N(DDs.DeductionAmount), 125000, 2),
    "Old regime: for 80DD a dependant with a severe disability fixes the amount of deduction at Rs.1,25,000.");
  /* A205 — 80DD claimed in Schedule VIA ⇒ same amount and details in Schedule 80DD. */
  A(205, !(N(usr.Section80DD)>0) || (!!I.Schedule80DD && REQ(N(DDs.DeductionAmount), N(usr.Section80DD), 2)),
    "Deduction u/s 80DD claimed in Chapter VIA must be provided, with the same amount, in Schedule 80DD.");
  /* A206 — Schedule 80DD deduction > 0 ⇒ the nature of disability detail is required. */
  A(206, !(N(DDs.DeductionAmount)>0) || S0(DDs.NatureOfDisability),
    "Schedule 80DD: where a deduction is claimed the nature of the disability must be provided.");
  /* A207 — Schedule 80U deduction > 0 ⇒ the nature of disability detail is required. */
  A(207, !(N(U.DeductionAmount)>0) || S0(U.NatureOfDisability),
    "Schedule 80U: where a deduction is claimed the nature of the disability must be provided.");
  /* A208 — Schedule 80U deduction > 0 ⇒ the type of disability detail is required. */
  A(208, !(N(U.DeductionAmount)>0) || S0(U.TypeOfDisability),
    "Schedule 80U: where a deduction is claimed the type of the disability must be provided.");
  /* A209 — Schedule 80DD deduction > 0 ⇒ the type of dependant detail is required. */
  A(209, !(N(DDs.DeductionAmount)>0) || S0(DDs.DependentType),
    "Schedule 80DD: where a deduction is claimed the type of the dependant must be provided.");

  /* ===================== salary / regime gates ===================== */
  /* A210 — salary income disclosed ⇒ nature of employment cannot be "Not Applicable". */
  A(210, !salPresent || empcat!=="NA",
    "When details of salary income are given the nature of employment cannot be 'Not Applicable'.");
  /* A211 — every 80GGC contribution must be dated between 01.04.2025 and 31.03.2026. */
  A(211, ggcRow.every(r=>!S0(r&&r.DonationDate) ||
      (String(r.DonationDate)>="2025-04-01" && String(r.DonationDate)<="2026-03-31")),
    "Deduction u/s 80GGC is allowed only for contributions made between 01.04.2025 and 31.03.2026 (A.Y. 2026-27).");
  /* A213 — each exempt salary allowance u/s 10 may be disclosed in exactly one dropdown. */
  A(213, new Set(alwCodes).size===alwCodes.length,
    "Each exempt allowance in salary (section 10) must be disclosed under exactly one dropdown, not more than once.");
  /* A214 — new regime: 57(iia) family-pension deduction <= one-third, capped Rs.25,000. */
  A(214, old || d57iia <= Math.min(Math.round(famPen/3), 25000)+tol,
    "New regime: the deduction u/s 57(iia) cannot exceed one-third of the family pension, subject to a maximum of Rs.25,000.");
  /* A215 — new regime: standard deduction u/s 16(ia) <= Rs.75,000. */
  A(215, old || d16ia <= 75000+tol,
    "New regime: the standard deduction u/s 16(ia) cannot exceed Rs.75,000.");
  /* A216 — new regime: 80CCD(2) employer contribution <= 14% of salary. */
  A(216, old || N(usr.Section80CCDEmployer) <= 0.14*sal17+tol,
    "New regime: the deduction u/s 80CCD(2) cannot exceed 14% of salary.");

  /* ===================== exempt LTCG u/s 112A ===================== */
  /* A217 — exempt long-term capital gain u/s 112A cannot exceed Rs.1,25,000 (else ITR-2). */
  A(217, N(LT.LongCap112A) <= 125000+tol,
    "Exempt long-term capital gain u/s 112A cannot be more than Rs.1,25,000 (above that the return must go on ITR-2).");
  /* A218 — LTCG112A (iii) = sale consideration (i) − cost of acquisition (ii). */
  A(218, (N(LT.TotSaleCnsdrn)-N(LT.TotCstAcqisn))>125000 ||
      REQ(N(LT.LongCap112A), Math.max(0, N(LT.TotSaleCnsdrn)-N(LT.TotCstAcqisn)), 2),
    "Exempt LTCG u/s 112A must equal total sale consideration less total cost of acquisition (iii = i − ii).");

  /* ===================== 80EE / 80EEA / 80EEB housing-loan checks ===================== */
  /* A221 — 80EE / 80EEA claimable only once the interest limit u/s 24(b) is exhausted. */
  const int24Total = props.reduce((a,p)=>a+N(RG(p,"Rentdetails.IntOnBorwCap",0)),0);
  A(221, !(N(usr.Section80EE)>0 || N(usr.Section80EEA)>0) || int24Total>=200000-tol,
    "Deduction u/s 80EE / 80EEA can be claimed only once the interest limit u/s 24(b) (Rs.2,00,000) is exhausted.");
  /* A222 — the 80EE loan's bank must be part of the section-24(b) schedule details. */
  A(222, !I.Schedule80EE || banksSubsetOf24(eeRow),
    "The bank for the 80EE loan must be part of the loan details disclosed in the section-24(b) schedule.");
  /* A223 — the 80EEA loan's bank must be part of the section-24(b) schedule details. */
  A(223, !I.Schedule80EEA || banksSubsetOf24(eeaRow),
    "The bank for the 80EEA loan must be part of the loan details disclosed in the section-24(b) schedule.");
  /* A225 — bank details are required in Schedule 80EE to claim the deduction. */
  A(225, !I.Schedule80EE || banksOk(eeRow),
    "Details of the bank from which the loan is taken must be provided in Schedule 80EE.");
  /* A227 — 80EE: the loan taken against the property cannot exceed Rs.35,00,000. */
  A(227, !I.Schedule80EE || eeRow.every(r=>N(r&&r.TotalLoanAmt)<=3500000+tol),
    "Deduction u/s 80EE is allowed only if the loan taken against the property does not exceed Rs.35,00,000.");
  /* A228 — bank details are required in Schedule 80EEA to claim the deduction. */
  A(228, !I.Schedule80EEA || banksOk(eeaRow),
    "Details of the bank from which the loan is taken must be provided in Schedule 80EEA.");
  /* A229 — 80EEA: the stamp-duty value of the house cannot exceed Rs.45,00,000. */
  A(229, !I.Schedule80EEA || N(RG(I,"Schedule80EEA.PropStmpDtyVal",0))<=4500000+tol,
    "Deduction u/s 80EEA is allowed only on a residential house with a stamp-duty value up to Rs.45,00,000.");
  /* A230 — 80EEA: each loan sanction date must fall between 01.04.2019 and 31.03.2022. */
  A(230, eeaRow.every(r=>!S0(r&&r.DateofLoan) ||
      (String(r.DateofLoan)>="2019-04-01" && String(r.DateofLoan)<="2022-03-31")),
    "The date of sanction of the 80EEA loan must be between 01.04.2019 and 31.03.2022.");
  /* A231 — bank details are required in Schedule 80EEB to claim the deduction. */
  A(231, !I.Schedule80EEB || banksOk(eebRow),
    "Details of the bank from which the loan is taken must be provided in Schedule 80EEB.");
  /* A232 — 80EEB: each loan sanction date must fall between 01.04.2019 and 31.03.2023. */
  A(232, eebRow.every(r=>!S0(r&&r.DateofLoan) ||
      (String(r.DateofLoan)>="2019-04-01" && String(r.DateofLoan)<="2023-03-31")),
    "The date of sanction of the 80EEB loan must be between 01.04.2019 and 31.03.2023.");

  /* ===================== supporting-detail requirements ===================== */
  /* A224 — Schedule 80C: each item claimed needs both the amount and an identification number. */
  A(224, !I.Schedule80C || c80Row.every(r=>N(r&&r.Amount)>0 && S0(r&&r.IdentificationNo)),
    "Schedule 80C: the amount and the identification number of the supporting document are required to claim each item.");
  /* A226 — PRAN details are required to claim a deduction u/s 80CCD(1) / 80CCD(1B). */
  const pran = RG(usr,"PRANDtls",[])||[];
  A(226, !(N(usr.Section80CCDEmployeeOrSE)>0 || N(usr.Section80CCD1B)>0) ||
      (Array.isArray(pran) && pran.length>0 && pran.every(r=>S0(r&&r.PRANNum))),
    "A PRAN must be provided in Schedule VIA to claim a deduction u/s 80CCD(1) or 80CCD(1B).");
  /* A233 — Form 10BA acknowledgement is required to claim a deduction u/s 80GG. */
  A(233, !(N(usr.Section80GG)>0) || S0(usr.Form10BAAckNum),
    "The acknowledgement number of Form 10BA must be provided to claim a deduction u/s 80GG.");
  /* A238 — Form 10-IA is required for a claim u/s 80U and u/s 80DD. */
  A(238, (!I.Schedule80U || S0(U.Form10IAAckNum)) && (!I.Schedule80DD || S0(DDs.Form10IAAckNum)),
    "The acknowledgement number of Form 10-IA must be provided for a claim u/s 80U and u/s 80DD.");
  /* A239 — specified-disease details are required to claim a deduction u/s 80DDB. */
  A(239, !(N(usr.Section80DDB)>0) || S0(usr.NameOfSpecDisease80DDB),
    "The specified-disease details must be provided to claim a deduction u/s 80DDB.");

  /* ===================== 80D premium-row reconciliations ===================== */
  /* A234 — 80D 1a: self/family total = premium + preventive check-up (within Rs.5,000). */
  A(234, !I.Schedule80D || REQ(N(D80.SelfAndFamily),
      N(D80.HealthInsPremSlfFam)+Math.min(N(D80.PrevHlthChckUpSlfFam),5000), 2),
    "Schedule 80D (1a): the self/family total must match the health-insurance premium plus preventive check-up entered.");
  /* A235 — 80D 1b: self/family senior total = premium + check-up (<=5,000) + medical expenditure. */
  A(235, !I.Schedule80D || REQ(N(D80.SelfAndFamilySeniorCitizen),
      N(D80.HlthInsPremSlfFamSrCtzn)+Math.min(N(D80.PrevHlthChckUpSlfFamSrCtzn),5000)+N(D80.MedicalExpSlfFamSrCtzn), 2),
    "Schedule 80D (1b): the self/family senior-citizen total must match the premium, preventive check-up and medical expenditure entered.");
  /* A236 — 80D 2a: parents total = premium + preventive check-up (within Rs.5,000). */
  A(236, !I.Schedule80D || REQ(N(D80.Parents),
      N(D80.HlthInsPremParents)+Math.min(N(D80.PrevHlthChckUpParents),5000), 2),
    "Schedule 80D (2a): the parents total must match the health-insurance premium plus preventive check-up entered.");
  /* A237 — 80D 2b: parents senior total = premium + check-up (<=5,000) + medical expenditure. */
  A(237, !I.Schedule80D || REQ(N(D80.ParentsSeniorCitizen),
      N(D80.HlthInsPremParentsSrCtzn)+Math.min(N(D80.PrevHlthChckUpParentsSrCtzn),5000)+N(D80.MedicalExpParentsSrCtzn), 2),
    "Schedule 80D (2b): the parents senior-citizen total must match the premium, preventive check-up and medical expenditure entered.");

  /* ===================== Schedule-VIA amount = schedule total ===================== */
  /* A241 — 80C claimed in VIA = total of payments per Schedule 80C. */
  A(241, !I.Schedule80C || REQ(N(usr.Section80C), N(C80.TotalAmt), 2),
    "The deduction u/s 80C claimed in Chapter VIA must equal the total of payments per Schedule 80C.");
  /* A242 — 80E claimed in VIA = total interest per Schedule 80E. */
  A(242, !I.Schedule80E || REQ(N(usr.Section80E), N(RG(I,"Schedule80E.TotalInterest80E",0)), 2),
    "The deduction u/s 80E claimed in Chapter VIA must equal the total of interest paid per Schedule 80E.");
  /* A243 — 80EE claimed in VIA = total interest per Schedule 80EE. */
  A(243, !I.Schedule80EE || REQ(N(usr.Section80EE), N(RG(I,"Schedule80EE.TotalInterest80EE",0)), 2),
    "The deduction u/s 80EE claimed in Chapter VIA must equal the total of interest paid per Schedule 80EE.");
  /* A244 — 80EEA claimed in VIA = total interest per Schedule 80EEA. */
  A(244, !I.Schedule80EEA || REQ(N(usr.Section80EEA), N(RG(I,"Schedule80EEA.TotalInterest80EEA",0)), 2),
    "The deduction u/s 80EEA claimed in Chapter VIA must equal the total of interest paid per Schedule 80EEA.");
  /* A245 — 80EEB claimed in VIA = total interest per Schedule 80EEB. */
  A(245, !I.Schedule80EEB || REQ(N(usr.Section80EEB), N(RG(I,"Schedule80EEB.TotalInterest80EEB",0)), 2),
    "The deduction u/s 80EEB claimed in Chapter VIA must equal the total of interest paid per Schedule 80EEB.");

  /* ===================== schedule rows sum = schedule total ===================== */
  /* A247 — Schedule 80C: the sum of the row amounts = the schedule total. */
  A(247, !I.Schedule80C || REQ(sumRows(c80Row,"Amount"), N(C80.TotalAmt), 2),
    "Schedule 80C: the sum of the amounts in the individual rows must equal the total of payments.");
  /* A248 — Schedule 80E: the sum of the row interest = the schedule total. */
  A(248, !I.Schedule80E || REQ(sumRows(RG(I,"Schedule80E.Schedule80EDtls",[]),"Interest80E"),
      N(RG(I,"Schedule80E.TotalInterest80E",0)), 2),
    "Schedule 80E: the sum of the interest in the individual rows must equal the total of payments.");
  /* A249 — Schedule 80EE: the sum of the row interest = the schedule total. */
  A(249, !I.Schedule80EE || REQ(sumRows(eeRow,"Interest80EE"),
      N(RG(I,"Schedule80EE.TotalInterest80EE",0)), 2),
    "Schedule 80EE: the sum of the interest in the individual rows must equal the total of payments.");
  /* A250 — Schedule 80EEA: the sum of the row interest = the schedule total. */
  A(250, !I.Schedule80EEA || REQ(sumRows(eeaRow,"Interest80EEA"),
      N(RG(I,"Schedule80EEA.TotalInterest80EEA",0)), 2),
    "Schedule 80EEA: the sum of the interest in the individual rows must equal the total of payments.");

  /* ===================== house-property section-24(b) (per property) ===================== */
  props.forEach((p,i)=>{
    p=p||{};
    const rd   = RG(p,"Rentdetails",{})||{};
    const s24  = RG(rd,"Section24B",{})||{};
    const dtls = RG(s24,"Section24BDtls",[])||[];
    const intc = N(rd.IntOnBorwCap);
    const totI = N(s24.TotalInterestUs24B);
    const type = String(p.ifLetOut==null?"":p.ifLetOut);      /* S / L / D */
    const share= N(p.AsseseeShareProperty)||100;
    const tag  = " (property "+(i+1)+")";
    /* A220 — interest u/s 24(b) claimed ⇒ the lender's bank details are required. */
    A(220, !(intc>0) || banksOk(dtls),
      "Details of the bank from which the loan is taken must be provided in the section-24(b) schedule to claim interest on borrowed capital."+tag);
    /* A240 — the HP interest u/s 24(b) = the total interest of the section-24(b) schedule
       (self-occupied is capped at Rs.2,00,000 old regime / nil new regime). */
    A(240, !rd.Section24B ||
        REQ(intc, (type!=="S") ? totI : (old ? Math.min(200000, totI) : 0), 2),
      "The interest on borrowed capital must equal the total of interest paid u/s 24(b) per the section-24(b) schedule."+tag);
    /* A246 — the section-24(b) rows' interest (assessee's share) = the schedule total. */
    A(246, !rd.Section24B || REQ(N(totI), sumRows(dtls,"InterestUs24B")*share/100, 2),
      "Section-24(b) schedule: the sum of the interest in the individual rows must equal the total of payments."+tag);
  });
});
