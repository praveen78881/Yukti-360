/* ITR-4 (Sugam) · AY 2026-27 — validation-rule FIX batch 02 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 101 102 104 105 107 108 109 115 117 123 139 140 142 143 151 155 161 162 164 165.
   Every cond is TRUE when the schedule/field is absent, and only FALSE when the data is present
   and actually breaks the CBDT rule. Schema paths are the exact keys 70_sec_ded.js /
   70_sec_inccore.js / 70_sec_paidbank.js export (see 61_rules_g0/g1/g2 for the same paths). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var USR    = RG(I,"IncomeDeductions.UsrDeductUndChapVIA",{})||{};   /* claimed (user-enterable) */
  var ALW    = RG(I,"IncomeDeductions.DeductUndChapVIA",{})||{};      /* allowed (post-cap, post-regime) */
  var status = RG(I,"PersonalInfo.Status","I");                       /* I individual, H HUF, F firm */
  var empcat = RG(I,"PersonalInfo.EmployerCategory","OTH");
  var oldR   = (typeof isNew==="function") ? !isNew() : true;         /* old regime (10-IEA opt-out) */
  var g      = function(p){ return N(RG(I,p)); };                     /* numeric read, default 0 */
  var arr    = function(p){ var a=RG(I,p,[]); return Array.isArray(a)?a:[]; };
  var ifscRe = (typeof IFSC_RE!=="undefined") ? IFSC_RE : /^[A-Z]{4}0[A-Z0-9]{6}$/;

  /* salary exempt-allowance rows (10(13A) = HRA) and other-source rows (FAP = family pension) */
  var alwRows = arr("IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls");
  var alwAmt  = function(code){ return RSUM(alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}),"SalOthAmount"); };
  var osRows  = arr("IncomeDeductions.OthersInc.OthersIncDtlsOthSrc");
  var famPen  = RSUM(osRows.filter(function(r){return r&&r.OthSrcNatureDesc==="FAP";}),"OthSrcOthAmount");

  /* ---------------- Schedule 80G — the four donee tables ---------------- */
  /* bucket key → [array block, cash total, other-mode total, total, label] (exact keys of expDed) */
  var G80 = {
    A:["Don100Percent",        "TotDon100PercentCash",        "TotDon100PercentOtherMode",        "TotDon100Percent",        "(A) 100% without qualifying limit"],
    B:["Don50PercentNoApprReqd","TotDon50PercentNoApprReqdCash","TotDon50PercentNoApprReqdOtherMode","TotDon50PercentNoApprReqd","(B) 50% without qualifying limit"],
    C:["Don100PercentApprReqd", "TotDon100PercentApprReqdCash", "TotDon100PercentApprReqdOtherMode", "TotDon100PercentApprReqd", "(C) 100% subject to qualifying limit"],
    D:["Don50PercentApprReqd",  "TotDon50PercentApprReqdCash",  "TotDon50PercentApprReqdOtherMode",  "TotDon50PercentApprReqd",  "(D) 50% subject to qualifying limit"]};
  var gRows = function(b){ return arr("Schedule80G."+G80[b][0]+".DoneeWithPan").filter(function(r){return !!r;}); };
  var gBlk  = function(b){ return RG(I,"Schedule80G."+G80[b][0],null); };
  /* row: cash or other mode must be entered (tables C and D) */
  var cashOrOther = function(b){ return gRows(b).every(function(r){ return N(r.DonationAmtCash)>0 || N(r.DonationAmtOtherMode)>0; }); };
  /* row total = cash + other, and table total = table cash + table other */
  var totEqSplit = function(b){ var blk=gBlk(b); if(!blk) return true;
    return gRows(b).every(function(r){ return REQ(N(r.DonationAmt), N(r.DonationAmtCash)+N(r.DonationAmtOtherMode)); })
        && REQ(N(blk[G80[b][3]]), N(blk[G80[b][1]])+N(blk[G80[b][2]])); };

  A(101, cashOrOther("C"),
    "Schedule 80G table (C): donation in cash or donation in other mode must be entered for every donee.");
  A(102, cashOrOther("D"),
    "Schedule 80G table (D): donation in cash or donation in other mode must be entered for every donee.");
  A(104, totEqSplit("A"),
    "Schedule 80G table (A): total donation must equal donation in cash plus donation in other mode.");
  A(105, totEqSplit("B"),
    "Schedule 80G table (B): total donation must equal donation in cash plus donation in other mode.");
  A(107, totEqSplit("D"),
    "Schedule 80G table (D): total donation must equal donation in cash plus donation in other mode.");

  /* every donee row across the four tables, tagged with its table */
  var allDonees = [];
  ["A","B","C","D"].forEach(function(b){ gRows(b).forEach(function(r){ allDonees.push({b:b,r:r}); }); });
  var panOf = function(r){ var p=String((r||{}).DoneePAN||"").toUpperCase(); return (p&&p!=="NA")?p:""; };

  /* 108: old regime — cash donations aggregated by donee PAN above Rs. 2,000 (or a single cash entry
     above Rs. 2,000) earn no deduction: the row's eligible amount can be no more than its other-mode part */
  var cashByPan = {};
  allDonees.forEach(function(d){ var p=panOf(d.r); if(p) cashByPan[p]=(cashByPan[p]||0)+N(d.r.DonationAmtCash); });
  A(108, !oldR || allDonees.every(function(d){ var r=d.r, p=panOf(r);
        var over = N(r.DonationAmtCash)>2000 || (p && cashByPan[p]>2000);
        return !over || N(r.EligibleDonationAmt) <= N(r.DonationAmtOtherMode)+1; }),
    "Schedule 80G: where cash donations to the same donee PAN exceed Rs. 2,000 in aggregate (or a single cash entry exceeds Rs. 2,000), the eligible amount of those cash donations must be nil.");

  /* 109: a donee PAN cannot appear more than once in Schedule 80G; PAN AAAAR1077P may repeat across
     tables; within table (D) the same PAN may repeat only with distinct ARNs */
  A(109, (function(){ var n=allDonees.length;
      for(var i=0;i<n;i++){ var pi=panOf(allDonees[i].r); if(!pi||pi==="AAAAR1077P") continue;
        for(var j=i+1;j<n;j++){ if(panOf(allDonees[j].r)!==pi) continue;
          var di=allDonees[i], dj=allDonees[j];
          var ai=String(di.r.ArnNbr||""), aj=String(dj.r.ArnNbr||"");
          if(di.b==="D" && dj.b==="D" && ai && aj && ai!==aj) continue;
          return false; } }
      return true; })(),
    "Schedule 80G: the same donee PAN cannot appear more than once (only PAN AAAAR1077P may be repeated in different tables).");

  /* ---------------- Schedule TDS2(i) / TDS2(ii) ---------------- */
  var tds2 = arr("TDSonOthThanSals.TDSonOthThanSalDtls").filter(function(r){return !!r;});
  var tds3 = arr("ScheduleTDS3Dtls.TDS3Details").filter(function(r){return !!r;});
  /* 115: unclaimed TDS brought forward and TDS of the current FY must sit in different rows */
  var bfAndCurr = function(r){ return N(r.BroughtFwdTDSAmt)>0 && N(r.TDSDeducted)>0; };
  A(115, !tds2.some(bfAndCurr) && !tds3.some(bfAndCurr),
    "Schedule TDS2: unclaimed TDS brought forward and TDS deducted in the current FY must be provided in different rows.");
  /* 117 (was a non-blocking warn): TDS2(i) claim (col 6) cannot exceed the income offered (col 7); 194N (head NA) rows excluded */
  A(117, tds2.every(function(r){ if(r.HeadOfIncome==="NA") return true;
        return !(N(r.TDSClaimed)>0) || N(r.TDSClaimed) <= N(r.GrossAmount)+1; }),
    "Schedule TDS2(i): the TDS claimed (col 6) cannot be more than the corresponding income/receipt offered (col 7).");

  /* 142: TDS credit claimed but the corresponding receipt is not offered under the stated head */
  var headOffered = function(h){
    if(h==="BP") return g("IncomeDeductions.IncomeFromBusinessProf")>0 || g("ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver")>0
                     || g("ScheduleBP.PersumptiveInc44ADA.GrsReceipt")>0 || g("ScheduleBP.PersumptiveInc44AE.TotPersumInc44AE")>0;
    if(h==="HP") return arr("IncomeDeductions.PropertyDetails").length>0 || g("IncomeDeductions.TotalIncomeChargeableUnHP")!==0;
    if(h==="OS") return g("IncomeDeductions.IncomeOthSrc")>0 || osRows.length>0;
    if(h==="EI") return arr("TaxExmpIntIncDtls.OthersInc.OthersIncDtls").length>0 || g("TaxExmpIntIncDtls.OthersInc.OthersTotalTaxExe")>0;
    return true; };                                                   /* NA (194N) / unknown head: no income head to test */
  A(142, (!(g("TDSonSalaries.TotalTDSonSalaries")>0) || g("IncomeDeductions.GrossSalary")>0)
      && tds2.concat(tds3).every(function(r){ return !(N(r.TDSClaimed)>0) || headOffered(String(r.HeadOfIncome||"")); }),
    "Credit for TDS is claimed but the corresponding receipt has not been offered to tax under the head of income stated against it.");

  /* 165: a HUF / Firm cannot have TDS on salary (Schedule TDS1) */
  A(165, status==="I" || (N(RG(I,"TDSonSalaries.TotalTDSonSalaries"))===0 && arr("TDSonSalaries.TDSonSalary").length===0),
    "A HUF or Firm (other than LLP) cannot report tax deducted on salary in Schedule TDS1.");

  /* ---------------- IFSC format (123 — partial) ---------------- */
  /* 123: matching against the RBI / GIFT IFSC database is not possible offline; what can be enforced is
     the RBI IFSC structure (4 letters, 0, 6 alphanumerics) wherever an IFSC is filed */
  var ifscOK = function(r){ var c=(r||{}).IFSCCode; return !c || ifscRe.test(String(c).toUpperCase()); };
  A(123, arr("Refund.BankAccountDtls.AddtnlBankDetails").every(ifscOK)
      && allDonees.every(function(d){ return ifscOK(d.r); })
      && arr("Schedule80GGC.Schedule80GGCDetails").every(ifscOK),
    "IFSC under Bank Details, Schedule 80G and Schedule 80GGC must be a valid RBI IFSC (four letters, a zero, six characters).");

  /* ---------------- Schedule BP ---------------- */
  /* 139: gross receipts / turnover are declared, so the financial particulars (E15/E19/E20/E22 …) must be filled */
  var turnover = g("ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver") + g("ScheduleBP.PersumptiveInc44ADA.GrsReceipt");
  var finP = RG(I,"ScheduleBP.FinanclPartclrOfBusiness",null);
  A(139, !(turnover>0) || (!!finP && typeof finP==="object" && Object.keys(finP).length>0),
    "Gross receipts / turnover are declared in Schedule BP but the financial particulars (sundry creditors, inventories, sundry debtors, cash in hand) are not filled.");
  /* 140: ITR-4 is the return for income computed u/s 44AD / 44ADA / 44AE — a return with income but no presumptive business income is not an ITR-4 case */
  A(140, !(g("IncomeDeductions.GrossTotIncomeIncLTCG112A")>0)
      || g("IncomeDeductions.IncomeFromBusinessProf")>0
      || g("ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD")>0
      || g("ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA")>0
      || g("ScheduleBP.PersumptiveInc44AE.TotalPersumptiveInc")>0,
    "ITR-4 can be furnished only where income from business/profession is computed u/s 44AD, 44ADA or 44AE; no such income is disclosed.");

  /* ---------------- Salary / relief ---------------- */
  /* 143: old-regime standard deduction u/s 16(ia) is capped at Rs. 50,000 (75,000 only in the new regime).
     Engine corrected to min(50000,netSal) under the old regime (70_sec_inccore.js); now enforced live. */
  A(143, !oldR || g("IncomeDeductions.DeductionUs16ia") <= 50000,
    "Old regime: standard deduction u/s 16(ia) cannot exceed Rs. 50,000.");

  /* 162: relief u/s 89 needs salary or family pension */
  A(162, !(g("TaxComputation.Section89")>0) || g("IncomeDeductions.GrossSalary")>0 || famPen>0,
    "Relief u/s 89 cannot be claimed when salary and family pension are both zero / blank.");

  /* ---------------- Chapter VI-A ---------------- */
  /* 151: HRA u/s 10(13A) is claimed, so 80GG above Rs. 55,000 is not allowed */
  A(151, !oldR || !(alwAmt("10(13A)")>0) || (N(USR.Section80GG)<=55000 && N(ALW.Section80GG)<=55000),
    "House rent allowance u/s 10(13A) is claimed, hence deduction u/s 80GG above Rs. 55,000 is not allowed.");
  /* 155: old regime, employee (employer category other than a pensioner category / not applicable) — 80CCD(1) ≤ 10% of salary */
  var PENS_NA = ["PE","PESG","PEPS","PEO","NA"];
  var grossSal = g("IncomeDeductions.GrossSalary");
  A(155, !oldR || PENS_NA.indexOf(empcat)>=0 || !(grossSal>0)
      || (N(USR.Section80CCDEmployeeOrSE) <= R(0.10*grossSal)+1 && N(ALW.Section80CCDEmployeeOrSE) <= R(0.10*grossSal)+1),
    "Old regime: for an employee, deduction u/s 80CCD(1) cannot exceed 10% of salary.");
  /* 161 (weak in g1: omitted the 'not applicable' category) — 80CCD(2) barred for pensioners and NA */
  A(161, PENS_NA.indexOf(empcat)<0 || (N(USR.Section80CCDEmployer)===0 && N(ALW.Section80CCDEmployer)===0),
    "Deduction u/s 80CCD(2) cannot be claimed when the employer category is a pensioner category or 'not applicable'.");
  /* 164: a HUF / Firm cannot claim 80EEB */
  A(164, status==="I" || (N(USR.Section80EEB)===0 && N(ALW.Section80EEB)===0 && !I.Schedule80EEB),
    "Deduction u/s 80EEB cannot be claimed by a HUF or Firm (other than LLP).");
});
