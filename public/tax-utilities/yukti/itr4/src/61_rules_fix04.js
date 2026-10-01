/* ITR-4 (Sugam) · AY 2026-27 — validation-rule FIX batch 04 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 264 267 270 271 272 273 279 282 287 288 301 303 305 306 307 308 309 315 316 318.
   Schema keys are the flat ITR-4 build (PersonalInfo / FilingStatus / IncomeDeductions +
   Schedule* siblings) exactly as 70_sec_inccore.js / 70_sec_ded.js write them. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var status = RG(I,"PersonalInfo.Status","I");
  var dob    = String(RG(I,"PersonalInfo.DOB","")||"");
  var FS     = RG(I,"FilingStatus",{})||{};
  var USR    = RG(I,"IncomeDeductions.UsrDeductUndChapVIA",{})||{};   /* claimed (user-enterable) */
  var ALW    = RG(I,"IncomeDeductions.DeductUndChapVIA",{})||{};      /* allowed (post-cap, post-regime) */
  var g      = function(p){ return N(RG(I,p)); };
  var nz     = function(v){ return String(v==null?"":v).trim(); };
  var filled = function(v){ var s=nz(v).toUpperCase(); return s!=="" && s!=="NA"; };
  var key    = function(v){ return nz(v).toUpperCase().replace(/[^A-Z0-9]/g,""); };
  var HP     = RG(I,"IncomeDeductions.PropertyDetails",[])||[];
  var alwRows= RG(I,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  var alwAmt = function(code){ return RSUM(alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}),"SalOthAmount"); };
  var E80EE  = RG(I,"Schedule80EE.Schedule80EEDtls",[])||[];
  var E80EEA = RG(I,"Schedule80EEA.Schedule80EEADtls",[])||[];
  /* every 24(b) loan row across all house properties (bank name / account keys) */
  var S24=[]; HP.forEach(function(p){ if(!p) return; (RG(p,"Rentdetails.Section24B.Section24BDtls",[])||[]).forEach(function(l){ if(l) S24.push(l); }); });
  var s24Names = S24.map(function(l){ return key(l.BankOrInstnName); }).filter(function(s){ return s && s!=="NA"; });
  var s24Accts = S24.map(function(l){ return key(l.LoanAccNoOfBankOrInstnRefNo); }).filter(function(s){ return s && s!=="NA"; });
  var inS24 = function(r){ if(!r) return true;
    var nm=key(r.BankOrInstnName), ac=key(r.LoanAccNoOfBankOrInstnRefNo);
    return (!!nm && s24Names.indexOf(nm)>=0) || (!!ac && s24Accts.indexOf(ac)>=0); };
  var sumInt24 = HP.reduce(function(s,p){ return s + (p?N(RG(p,"Rentdetails.IntOnBorwCap")):0); }, 0);

  /* ---------------- Part A — status / regime / formation ---------------- */
  /* 264: a Firm is outside 115BAC — A23 (Form 10-IEA opt-out) must carry no value */
  A(264, status!=="F" || (
        !nz(FS.F10IEACurrAYOldRegime) && !nz(FS.F10IEADateCurrAYOldTax) && !(N(FS.F10IEAAckNoCurrAYOldTax)>0)
     && ["","N","NA"].indexOf(nz(FS.Form10IEAEarlierAYOldRegime).toUpperCase())>=0
     && !nz(FS.Form10IEAAssYear) && !(N(FS.Form10IEAEarlierAYAckOldRegime)>0)),
    "For a Firm (other than LLP) the option u/s 115BAC(6) / Form 10-IEA fields in A23 are not applicable and must not carry any value.");
  /* 318: Firm/HUF formed on or after 01/04/2026 cannot file for AY 2026-27 */
  A(318, status==="I" || !dob || dob < "2026-04-01",
    "A Firm or HUF with date of formation on or after 01/04/2026 cannot file a return for AY 2026-27.");

  /* ---------------- ITR-4 eligibility ceiling ---------------- */
  /* 267: total income excluding LTCG u/s 112A must be within Rs. 50 lakh */
  A(267, Math.max(0, g("IncomeDeductions.TotalIncome") - g("LTCG112A.LongCap112A")) <= 5000000,
    "Total income excluding LTCG u/s 112A cannot exceed Rs. 50 lakh — ITR-4 cannot be used.");

  /* ---------------- 80EE / 80EEA vs Schedule 24(b) ---------------- */
  /* 270: 80EE/80EEA only after the 24(b) limit (Rs. 2,00,000) is exhausted */
  A(270, !(N(ALW.Section80EE)>0 || N(ALW.Section80EEA)>0) || sumInt24 >= 200000,
    "Deduction u/s 80EE / 80EEA can be claimed only when the limit of interest u/s 24(b) (Rs. 2,00,000) is exhausted.");
  /* 271: the 80EE bank must be among the banks disclosed in schedule 24(b) */
  A(271, !(N(ALW.Section80EE)>0) || E80EE.length===0 || E80EE.every(inS24),
    "Schedule 80EE: the bank/institution from which the loan is taken must be one disclosed in the 24(b) details of house property.");
  /* 272 (companion to 61_rules_g1.js A272): rows must exist AND cross-match schedule 24(b) */
  A(272, !(N(ALW.Section80EEA)>0) || (E80EEA.length>0 && E80EEA.every(inS24)),
    "Schedule 80EEA: the bank/institution from which the loan is taken must be disclosed and must match the 24(b) details of house property.");
  /* 279: 80EEA loan sanctioned between 01.04.2019 and 31.03.2022 */
  E80EEA.forEach(function(r,i){ if(!r) return;
    A(279, !r.DateofLoan || (r.DateofLoan>="2019-04-01" && r.DateofLoan<="2022-03-31"),
      "Schedule 80EEA row "+(i+1)+": the date of sanction of the loan must fall between 01.04.2019 and 31.03.2022."); });
  /* 301: 80EE loan sanctioned between 01.04.2016 and 31.03.2017 */
  E80EE.forEach(function(r,i){ if(!r) return;
    A(301, !r.DateofLoan || (r.DateofLoan>="2016-04-01" && r.DateofLoan<="2017-03-31"),
      "Schedule 80EE row "+(i+1)+": the date of sanction of the loan must fall between 01.04.2016 and 31.03.2017."); });

  /* ---------------- Schedule 80C ---------------- */
  /* 273: each 80C payment row needs its policy / document identification number
     (nature-of-payment is not a Schedule80CDtls key in the ITR-4 schema — only Amount + IdentificationNo) */
  A(273, (RG(I,"Schedule80C.Schedule80CDtls",[])||[]).every(function(r){ return !r || !(N(r.Amount)>0) || filled(r.IdentificationNo); }),
    "Schedule 80C: the policy number / document identification number of the supporting document is required for every payment claimed.");

  /* ---------------- Supporting-form / detail prerequisites ---------------- */
  /* 282: Form 10BA acknowledgement (15 digits) for 80GG */
  A(282, !(N(USR.Section80GG)>0 || N(ALW.Section80GG)>0) || /^\d{15}$/.test(nz(USR.Form10BAAckNum)),
    "Details of Form 10BA (15-digit acknowledgement number) are required to claim deduction u/s 80GG.");
  /* 287: Form 10-IA filed separately for 80U and 80DD */
  A(287, (!(N(RG(I,"Schedule80U.DeductionAmount"))>0)  || /^\d{15}$/.test(nz(RG(I,"Schedule80U.Form10IAAckNum",""))))
      && (!(N(RG(I,"Schedule80DD.DeductionAmount"))>0) || /^\d{15}$/.test(nz(RG(I,"Schedule80DD.Form10IAAckNum","")))),
    "Form 10-IA (15-digit acknowledgement number) must be filed separately for the deduction u/s 80U and u/s 80DD respectively.");
  /* 288: specified disease for 80DDB */
  A(288, !(N(USR.Section80DDB)>0 || N(ALW.Section80DDB)>0) || filled(USR.NameOfSpecDisease80DDB),
    "Details of the specified disease are required to claim deduction u/s 80DDB.");

  /* ---------------- Status / regime vs sub-schedules ---------------- */
  /* 303: a Firm cannot fill 80C / 80E / 80EE / 80EEA / 80EEB / 10(13A) schedules */
  A(303, status!=="F" || (!I.Schedule80C && !I.Schedule80E && !I.Schedule80EE && !I.Schedule80EEA && !I.Schedule80EEB && !I.ScheduleEA10_13A),
    "A Firm is not eligible to fill Schedule 80C, 80E, 80EE, 80EEA, 80EEB or 10(13A).");
  /* 305 (companion to 61_rules_g1.js A305): Individual + new regime — also 80EEB and 10(13A) */
  A(305, status!=="I" || !isNew() || (!I.Schedule80C && !I.Schedule80E && !I.Schedule80EE && !I.Schedule80EEA && !I.Schedule80EEB && !I.ScheduleEA10_13A),
    "New regime: an Individual cannot fill Schedule 80C, 80E, 80EE, 80EEA, 80EEB or 10(13A).");

  /* ---------------- Schedule 80D — insurer / policy details per premium line ---------------- */
  var sd = RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{})||{};
  var ins80D = function(premKey, blockKey){
    if(!I.Schedule80D || !(N(sd[premKey])>0)) return true;                 /* nothing claimed on that line */
    var rows = RG(sd, blockKey+".Sch80DInsDtls", [])||[];
    if(rows.length===0) return false;                                       /* premium claimed, no insurer rows */
    return rows.every(function(r){ return !r || !(N(r.HealthInsAmt)>0) || (filled(r.InsurerName) && filled(r.PolicyNo)); });
  };
  A(306, ins80D("HealthInsPremSlfFam","Sec80DSelfFamHIDtls"),
    "Schedule 80D: name of the insurer and policy number are required for the health-insurance premium at Sl. No. 1a(i).");
  A(307, ins80D("HlthInsPremSlfFamSrCtzn","Sec80DSelfFamSrCtznHIDtls"),
    "Schedule 80D: name of the insurer and policy number are required for the health-insurance premium at Sl. No. 1b(i).");
  /* 308: receipt/document number of the premium is not a Sch80DInsDtls key in the ITR-4 schema
     (InsurerName / PolicyNo / HealthInsAmt only) — insurer and policy number are enforced */
  A(308, ins80D("HlthInsPremParents","Sec80DParentsHIDtls"),
    "Schedule 80D: name of the insurer and policy number are required for the health-insurance premium at Sl. No. 2a(i).");
  A(309, ins80D("HlthInsPremParentsSrCtzn","Sec80DParentsSrCtznHIDtls"),
    "Schedule 80D: name of the insurer and policy number are required for the health-insurance premium at Sl. No. 2b(i).");

  /* ---------------- Schedule 10(13A) — HRA ---------------- */
  /* 315: the exempt allowance u/s 10(13A) needs Schedule 10(13A) */
  A(315, !(alwAmt("10(13A)")>0) || !!I.ScheduleEA10_13A,
    "Schedule 10(13A) must be filled to claim the exempt allowance u/s 10(13A).");
  /* 316: basic + DA (schedule) + HRA received cannot exceed salary as per 17(1) */
  if(I.ScheduleEA10_13A){ var H=I.ScheduleEA10_13A;
    A(316, N(H.BasicSalary)+N(H.DearnessAllwnc)+N(H.ActlHRARecv) <= g("IncomeDeductions.Salary")+1,
      "Schedule 10(13A): basic salary + dearness allowance + actual HRA received cannot exceed salary as per section 17(1) in Income details.");
  }
});
