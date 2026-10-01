/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-A validation rules, batch enc_06 (Phase 6).
   Serial range A251–A300 (the 80EE/80EEB loan schedules and the 80EE
   sanction-date window, the house-property self-occupied / new-regime and
   co-ownership checks, the Schedule-80D presence and per-insurer detail
   checks, the new-regime schedule bar, the section-192 mis-selection guard,
   the Schedule-EA 10(13A) HRA least-of arithmetic, the salary-head 10(10)/
   10(13A)/EIC allowance checks, the Chapter-VI-A allowed<=entered caps, the
   LTCG-112A identity, and the representative-assessee mandatory details).

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / REQ / (X||{}) / S0); nothing throws. Keys are the built-return ITR1
   schema paths (I = Object.values(buildReturn().ITR)[0]); the paths and enum
   codes were taken from books/ITR-1/schema_tree.md, caps.md, enums.json and the
   section builders (70_sec_ded expDed, 70_sec_sal expSal, 70_sec_hp expHP,
   70_sec_ret expRet, 70_sec_bank expBank/Verification, 70_sec_who expWho).
   Encoded from each rule's own re-joined text (constitution rule 6).

   Regime gate: FilingStatus.OptOutNewTaxRegime — "Y" = OLD regime, else NEW.
   Schedule-scoped blocks are read under `if(I.<block>)` / props.forEach so they
   are silent when the schedule is absent (e.g. on the lawful client, which has
   no HRA schedule, no co-ownership, no LTCG and no representative).

   Serials in A251–A300 NOT encoded here, and why (bucketed in the census —
   books/ITR-1/rule_census.md — never faked):
     A268 — OFFLINE-IMPOSSIBLE. "Individual with date of formation on/after
            01.04.2008 barred" targets an assessee's date of formation, which
            does not exist for an individual (the built return carries only
            PersonalInfo.DOB), so any literal encoding would be vacuous.

   Note on A256–A259: the insurer name / policy-number leaves
   (Schedule80D.Sec80DSelfFamSrCtznHealth.<sub>.Sch80DInsDtls[].{InsurerName,
   PolicyNo}) are defined by the schema (schema_tree §19.2) but are NOT populated
   by expDed (it emits only the aggregate 80D amounts). They are therefore
   encoded as a "when a row is present it must carry name + policy" well-formed-
   ness check on the schedule-scoped array — silent when the block is absent (as
   on every current build), firing on an insurer row that omits name / policy.
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
  const VF  = RG(I,"Verification",{})||{};
  const LT  = RG(I,"LTCG112A",{})||{};

  const old    = String(FS.OptOutNewTaxRegime)==="Y";   /* Y = OLD regime */
  const empcat = String(PI.EmployerCategory==null?"":PI.EmployerCategory);
  const asPAN  = String(PI.PAN==null?"":PI.PAN).toUpperCase().trim();
  const GRAT   = ["CGOV","SGOV","PE","PESG"];            /* CG / SG + their pensioners */
  const CGSG   = ["CGOV","SGOV"];                        /* serving Central / State Government */
  const SEC192 = ["92A","92B","92C"];                   /* the three "192-Salary" TDS codes */

  /* income aggregates */
  const gti   = N(ID.GrossTotIncome);                    /* GTI excl LTCG 112A */
  const gtiL  = N(ID.GrossTotIncomeIncLTCG112A);         /* GTI incl LTCG 112A */
  const sal17 = N(ID.Salary);                            /* salary as per 17(1) */
  const incSal= N(ID.IncomeFromSal);

  /* salary allowances exempt u/s 10 */
  const allw10 = RG(ID,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  const exAllw = N(RG(ID,"AllwncExemptUs10.TotalAllwncExemptUs10",0));
  const allwAmt = code => allw10.filter(r=>r&&String(r.SalNatureDesc)===code)
                                .reduce((a,r)=>a+N(r.SalOthAmount),0);

  const props  = RG(ID,"PropertyDetails",[])||[];

  /* ===================== 80EE / 80EEB loan schedules ===================== */
  /* A251 — Schedule 80EEB: sum of the individual "interest paid" rows = the total. */
  if(I.Schedule80EEB){
    const rows=RG(I,"Schedule80EEB.Schedule80EEBDtls",[])||[];
    A(251, REQ(N(RG(I,"Schedule80EEB.TotalInterest80EEB",0)),
        rows.reduce((a,r)=>a+N(r&&r.Interest80EEB),0), 2),
      "Schedule 80EEB: the sum of the individual rows for interest paid must equal the total of payments in the schedule.");
  }
  /* A252 — Schedule 80EE: the date of sanction of the loan must fall in FY 2016-17. */
  if(I.Schedule80EE){
    const rows=RG(I,"Schedule80EE.Schedule80EEDtls",[])||[];
    const bad = rows.some(r=>{ const d=r&&r.DateofLoan; return S0(d) && (String(d)<"2016-04-01"||String(d)>"2017-03-31"); });
    A(252, !bad,
      "Schedule 80EE: the date of sanction of the loan must be between 01.04.2016 and 31.03.2017.");
  }

  /* ===================== Schedule 80D presence + insurer details ===================== */
  /* A254 — old & 80D claimed: the Schedule 80D details must be provided. */
  A(254, !old || !(N(usr.Section80D)>0) || !!I.Schedule80D,
    "Old regime: deduction u/s 80D is claimed but the details are not provided in Schedule 80D.");
  /* A256–A259 — a health-insurance row present at sl. 1a(i)/1b(i)/2a(i)/2b(i) must
     carry the insurer's name and the policy number (well-formedness; silent when absent). */
  const SDH = RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{})||{};
  const insWF = sub => (RG(SDH,sub+".Sch80DInsDtls",[])||[])
    .every(r=>!r || (S0(r.InsurerName) && S0(r.PolicyNo)));
  A(256, insWF("Sec80DSelfFamHIDtls"),
    "Schedule 80D sl. 1a(i): the name of the insurer and the policy number are required to claim the health-insurance deduction.");
  A(257, insWF("Sec80DSelfFamSrCtznHIDtls"),
    "Schedule 80D sl. 1b(i): the name of the insurer and the policy number are required to claim the health-insurance deduction.");
  A(258, insWF("Sec80DParentsHIDtls"),
    "Schedule 80D sl. 2a(i): the name of the insurer and the policy number are required to claim the health-insurance deduction.");
  A(259, insWF("Sec80DParentsSrCtznHIDtls"),
    "Schedule 80D sl. 2b(i): the name of the insurer and the policy number are required to claim the health-insurance deduction.");

  /* ===================== New-regime schedule bar ===================== */
  /* A255 — new regime (individual): none of the 80C / 10(13A) / 80E / 80EE / 80EEA / 80EEB
     schedules may be filled (they belong to the old-regime deduction ladder). */
  A(255, old || (!I.Schedule80C && !I.ScheduleEA10_13A && !I.Schedule80E
      && !I.Schedule80EE && !I.Schedule80EEA && !I.Schedule80EEB),
    "New regime: none of the Schedule 80C, 10(13A), 80E, 80EE, 80EEA or 80EEB may be filled.");

  /* ===================== Section-192 mis-selection in the non-salary TDS schedules ===================== */
  /* A260 — a "192-Salary" section code must not be selected in the TDS-on-other-than-salary
     schedules (TDSonOthThanSals / ScheduleTDS3Dtls). */
  const tds2 = RG(I,"TDSonOthThanSals.TDSonOthThanSal",[])||[];
  const tds3 = RG(I,"ScheduleTDS3Dtls.TDS3Details",[])||[];
  A(260, !tds2.some(r=>r&&inL(String(r.TDSSection),SEC192))
       && !tds3.some(r=>r&&inL(String(r.TDSSection),SEC192)),
    "Section 192 (TDS on salary) cannot be selected in the schedules for TDS on income other than salary.");

  /* ===================== Schedule EA 10(13A) — HRA (old regime, real employer) ===================== */
  if(I.ScheduleEA10_13A){
    const EA   = RG(I,"ScheduleEA10_13A",{})||{};
    const hraR = N(EA.ActlHRARecv);
    const rent10= N(EA.ActlRentPaid10Per);              /* actual rent paid − 10% of (basic+DA) */
    const pct  = N(EA.Sal40Or50Per);                    /* 40% (non-metro) / 50% (metro) of (basic+DA) */
    const elig = N(EA.EligbleExmpAllwncUs13A);
    const basic= N(EA.BasicSalary);
    const da   = N(EA.DearnessAllwnc);
    /* A261 — HRA exemption <= actual rent paid − 10% of (basic + DA). */
    A(261, elig<=rent10+tol,
      "House rent allowance u/s 10(13A) cannot be more than the actual rent paid after deducting 10% of basic salary and dearness allowance.");
    /* A262 — HRA exemption <= 40%/50% of (basic + DA) (non-metro / metro). */
    A(262, elig<=pct+tol,
      "House rent allowance u/s 10(13A) cannot be more than 40% (non-metro) / 50% (metro) of basic salary and dearness allowance.");
    /* A263 — HRA exemption = the least of actual HRA, rent−10%, and 40/50% of salary. */
    A(263, REQ(elig, Math.max(0, Math.min(hraR, rent10, pct)), 2),
      "Schedule 10(13A): the HRA exemption must be the lowest of the actual HRA received, rent paid less 10% of salary, and 40%/50% of salary.");
    /* A266 — basic + DA + actual HRA received <= salary as per section 17(1). */
    A(266, (basic+da+hraR)<=sal17+tol,
      "The sum of basic salary, dearness allowance and the actual HRA received cannot be more than the salary as per section 17(1).");
  }
  /* A264 — where there is salary income and exempt allowances, the nature of employment is required. */
  A(264, !(incSal>0 && exAllw>0) || S0(empcat),
    "The nature of employment must be provided where the return has salary income and exempt allowances.");
  /* A265 — Schedule 10(13A) must be filled to claim the 10(13A) exempt allowance. */
  A(265, !(allwAmt("10(13A)")>0) || !!I.ScheduleEA10_13A,
    "Schedule 10(13A) must be filled to claim the exempt allowance u/s 10(13A).");
  /* A269 — the 10(13A) exempt allowance in the salary schedule = the eligible amount in Schedule EA. */
  if(I.ScheduleEA10_13A)
    A(269, REQ(allwAmt("10(13A)"), N(RG(I,"ScheduleEA10_13A.EligbleExmpAllwncUs13A",0)), 2),
      "The exempt allowance u/s 10(13A) in the salary schedule must match the eligible allowance u/s 10(13A) in Schedule 10(13A).");

  /* ===================== Salary-head 10(10) / EIC allowance checks ===================== */
  /* A267 — 10(10) death-cum-retirement gratuity <= Rs.25,00,000 for CG/SG (and their pensioners). */
  A(267, !inL(empcat,GRAT) || allwAmt("10(10)")<=2500000+tol,
    "Exempt allowance u/s 10(10) (death-cum-retirement gratuity) cannot exceed Rs.25,00,000 for a Central/State Government employee or pensioner.");
  /* A270 — the judge's exempt income (EIC) can be claimed only by a CG/SG employee. */
  A(270, !(allwAmt("EIC")>0) || inL(empcat,CGSG),
    "The exempt income of a judge (Supreme Court / High Court Judges Act) can be claimed only by a Central or State Government employee.");

  /* ===================== House property (per PropertyDetails[]) ===================== */
  props.forEach((p,i)=>{
    p=p||{};
    const rd  = RG(p,"Rentdetails",{})||{};
    const type= String(p.ifLetOut==null?"":p.ifLetOut);     /* S / L / D */
    const co  = String(p.PropCoOwnedFlg)==="YES";
    const share=N(p.AsseseeShareProperty);
    const bal = N(rd.BalanceALV);
    const aop = N(rd.AnnualOfPropOwned);
    const rnr = N(rd.RentNotRealized);
    const taxes=N(rd.LocalTaxes);
    const unrl= N(rd.TotalUnrealizedAndTax);
    const std = N(rd.ThirtyPercentOfBalance);
    const intc= N(rd.IntOnBorwCap);
    const totd= N(rd.TotalDeduct);
    const int24b=N(RG(rd,"Section24B.TotalInterestUs24B",0));
    const cos = RG(p,"CoOwners",[])||[];
    const tag = " (property "+(i+1)+")";
    /* A253 — new regime: no 24(b) interest for a self-occupied property. */
    A(253, old || type!=="S" || (intc===0 && int24b===0),
      "New regime: interest on borrowed capital u/s 24(b) cannot be claimed for a self-occupied house property."+tag);
    /* A271 — the type of house property is mandatory where 24(b) interest is claimed. */
    A(271, !(intc>0 || int24b>0) || S0(type),
      "The type of house property is mandatory when interest on borrowed capital u/s 24(b) is claimed."+tag);
    /* A298 — Sl.1d total = Sl.1b + Sl.1c (unrealised rent + local taxes). */
    A(298, REQ(unrl, rnr+taxes, 2),
      "House property Sl.1d (total) must equal the sum of Sl.1b (rent not realised) and Sl.1c (local taxes)."+tag);
    /* A299 — Sl.1i total = Sl.1g + Sl.1h (30% deduction + interest on borrowed capital). */
    A(299, REQ(totd, std+intc, 2),
      "House property Sl.1i (total) must equal the sum of Sl.1g (30% deduction) and Sl.1h (interest on borrowed capital)."+tag);
    /* ---- co-ownership-scoped checks ---- */
    if(co){
      const coShare = cos.reduce((a,c)=>a+N(c&&c.PercentShareProperty),0);
      /* A295 — assessee's share + the co-owners' shares = 100%. */
      A(295, REQ(share+coShare, 100, 0.01),
        "Co-owned property: the assessee's share and the co-owners' shares must add up to 100%."+tag);
      /* A296 — annual value of the property owned = own share% × annual value (balance ALV). */
      A(296, REQ(aop, Math.round(share/100*bal), 1),
        "Co-owned property: the annual value of the property owned must be the assessee's percentage share of the annual value."+tag);
      /* A297 — a zero assessee share bars any interest on borrowed capital. */
      A(297, !(share===0) || (intc===0 && int24b===0),
        "Co-owned property: where the assessee's share is zero the interest on borrowed capital cannot be more than zero."+tag);
      /* A300 — the assessee's PAN cannot equal a co-owner's PAN. */
      A(300, !S0(asPAN) || cos.every(c=>!c||!S0(c.PAN_CoOwner)||String(c.PAN_CoOwner).toUpperCase().trim()!==asPAN),
        "Co-owned property: the assessee's PAN and a co-owner's PAN cannot be the same."+tag);
    }
  });

  /* ===================== Chapter VI-A: allowed <= entered (per section) ===================== */
  /* A272–A291 — the eligible (allowed/capped) deduction cannot exceed the user-entered amount. */
  A(272, N(alw.Section80C)<=N(usr.Section80C)+tol,
    "The eligible amount of deduction claimed u/s 80C cannot exceed the amount you entered.");
  A(273, N(alw.Section80CCC)<=N(usr.Section80CCC)+tol,
    "The eligible amount of deduction claimed u/s 80CCC cannot exceed the amount you entered.");
  A(274, N(alw.Section80CCDEmployeeOrSE)<=N(usr.Section80CCDEmployeeOrSE)+tol,
    "The eligible amount of deduction claimed u/s 80CCD(1) cannot exceed the amount you entered.");
  A(275, N(alw.Section80CCD1B)<=N(usr.Section80CCD1B)+tol,
    "The eligible amount of deduction claimed u/s 80CCD(1B) cannot exceed the amount you entered.");
  A(276, N(alw.Section80CCDEmployer)<=N(usr.Section80CCDEmployer)+tol,
    "The eligible amount of deduction claimed u/s 80CCD(2) cannot exceed the amount you entered.");
  A(277, N(alw.Section80D)<=N(usr.Section80D)+tol,
    "The eligible amount of deduction claimed u/s 80D cannot exceed the amount you entered.");
  A(278, N(alw.Section80DD)<=N(usr.Section80DD)+tol,
    "The eligible amount of deduction claimed u/s 80DD cannot exceed the amount you entered.");
  A(279, N(alw.Section80DDB)<=N(usr.Section80DDB)+tol,
    "The eligible amount of deduction claimed u/s 80DDB cannot exceed the amount you entered.");
  A(280, N(alw.Section80E)<=N(usr.Section80E)+tol,
    "The eligible amount of deduction claimed u/s 80E cannot exceed the amount you entered.");
  A(281, N(alw.Section80EE)<=N(usr.Section80EE)+tol,
    "The eligible amount of deduction claimed u/s 80EE cannot exceed the amount you entered.");
  A(282, N(alw.Section80EEA)<=N(usr.Section80EEA)+tol,
    "The eligible amount of deduction claimed u/s 80EEA cannot exceed the amount you entered.");
  A(283, N(alw.Section80EEB)<=N(usr.Section80EEB)+tol,
    "The eligible amount of deduction claimed u/s 80EEB cannot exceed the amount you entered.");
  A(284, N(alw.Section80G)<=N(usr.Section80G)+tol,
    "The eligible amount of deduction claimed u/s 80G cannot exceed the amount you entered.");
  A(285, N(alw.Section80GG)<=N(usr.Section80GG)+tol,
    "The eligible amount of deduction claimed u/s 80GG cannot exceed the amount you entered.");
  A(286, N(alw.Section80GGA)<=N(usr.Section80GGA)+tol,
    "The eligible amount of deduction claimed u/s 80GGA cannot exceed the amount you entered.");
  A(287, N(alw.Section80GGC)<=N(usr.Section80GGC)+tol,
    "The eligible amount of deduction claimed u/s 80GGC cannot exceed the amount you entered.");
  A(288, N(alw.Section80TTA)<=N(usr.Section80TTA)+tol,
    "The eligible amount of deduction claimed u/s 80TTA cannot exceed the amount you entered.");
  A(289, N(alw.Section80TTB)<=N(usr.Section80TTB)+tol,
    "The eligible amount of deduction claimed u/s 80TTB cannot exceed the amount you entered.");
  A(290, N(alw.Section80U)<=N(usr.Section80U)+tol,
    "The eligible amount of deduction claimed u/s 80U cannot exceed the amount you entered.");
  A(291, N(alw.AnyOthSec80CCH)<=N(usr.AnyOthSec80CCH)+tol,
    "The eligible amount of deduction claimed u/s 80CCH cannot exceed the amount you entered.");

  /* ===================== LTCG u/s 112A identity ===================== */
  /* A292 — LTCG u/s 112A = GTI (incl LTCG) − GTI (excl LTCG). */
  A(292, REQ(N(LT.LongCap112A), gtiL - gti, 2),
    "LTCG u/s 112A must equal the difference between gross total income including LTCG and gross total income excluding LTCG.");

  /* ===================== Representative assessee ===================== */
  const REP = RG(FS,"AssesseeRep",{})||{};
  const repOK = S0(REP.RepName) && S0(REP.RepEmailID) && S0(REP.RepMobileNo);
  /* A293 — verification capacity "Representative": name, e-mail and contact are mandatory. */
  A(293, String(VF.Capacity)!=="R" || repOK,
    "Where the verification capacity is 'Representative', the representative's name, e-mail ID and contact number are mandatory.");
  /* A294 — the representative-assessee flag is 'Y': the representative's details must be provided. */
  A(294, String(FS.AsseseeRepFlg)!=="Y" || repOK,
    "Where the return is filed by a representative assessee, the representative's details must be provided.");
});
