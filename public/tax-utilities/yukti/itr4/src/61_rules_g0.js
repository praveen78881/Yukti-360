/* =====================================================================
   ITR-4 (Sugam) · AY 2026-27 — Category-A validation rules, batch g0
   (Phase 6, rules-enforcer). Registered via ruleset(fn); runRules()
   invokes it as (I,S_,A,Dd). A(n,cond,msg) FIRES when cond (the
   assertion that holds for a VALID return) is FALSE. Every read is
   guarded (RG / (X||{}) / arrays default []), so nothing throws.
   Regime: isNew()===false means the OLD regime (S.fs.optout==="Yes").
   The valid old-regime test return must satisfy every assertion here.
   Schema keys are the flat ITR-4 build (PersonalInfo/FilingStatus/
   IncomeDeductions/TaxComputation/TaxPaid + Schedule* siblings).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var ID   = RG(I,"IncomeDeductions",{})||{};
  var USR  = RG(I,"IncomeDeductions.UsrDeductUndChapVIA",{})||{};
  var ALW  = RG(I,"IncomeDeductions.DeductUndChapVIA",{})||{};   /* allowed (post-cap, post-regime) */
  var status = RG(I,"PersonalInfo.Status","I");
  var empcat = RG(I,"PersonalInfo.EmployerCategory","OTH");
  var dob    = RG(I,"PersonalInfo.DOB","");
  var GOVT   = ["CGOV","SGOV","PE","PESG"];                       /* govt / govt-pensioner employer categories */
  var g = function(p){ return N(RG(I,p)); };                       /* numeric read, default 0 */

  /* exempt-income (D20) rows and salary exempt-allowance rows */
  var exRows  = RG(I,"TaxExmpIntIncDtls.OthersInc.OthersIncDtls",[])||[];
  var alwRows = RG(I,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  var cntSub = function(code){ return exRows.filter(function(r){return r&&r.SubCategory===code;}).length; };
  var subAmt = function(code){ return RSUM(exRows.filter(function(r){return r&&r.SubCategory===code;}),"OthAmount"); };
  var cntAlw = function(code){ return alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}).length; };
  var alwAmt = function(code){ return RSUM(alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}),"SalOthAmount"); };

  /* ---------------- Presumptive business (Schedule BP) ---------------- */
  A(1, !(g("IncomeDeductions.IncomeFromBusinessProf")>0) || !!I.ScheduleBP,
    "Presumptive income is disclosed in Gross Total Income but Schedule BP is not filled.");
  if(I.ScheduleBP){ var BP=I.ScheduleBP;
    A(7, REQ(RG(BP,"PersumptiveInc44AD.TotPersumptiveInc44AD"), N(RG(BP,"PersumptiveInc44AD.PersumptiveInc44AD6Per"))+N(RG(BP,"PersumptiveInc44AD.PersumptiveInc44AD8Per"))),
      "Schedule BP: presumptive income u/s 44AD must equal 6% of turnover through bank plus 8% of turnover in any other mode.");
    A(13, N(RG(BP,"PersumptiveInc44ADA.TotPersumptiveInc44ADA")) <= N(RG(BP,"PersumptiveInc44ADA.GrsReceipt"))+1,
      "Schedule BP: presumptive income u/s 44ADA cannot be more than the corresponding gross receipts.");
    A(16, !(N(RG(BP,"PersumptiveInc44ADA.TotPersumptiveInc44ADA"))>0) || RG(BP,"NatOfBus44ADA",[]).length>0,
      "Schedule BP: when income is declared u/s 44ADA the business code u/s 44ADA is mandatory.");
    A(136, REQ(RG(BP,"PersumptiveInc44AE.TotPersumInc44AE"), RSUM(RG(BP,"GoodsDtlsUs44AE",[]),"PresumptiveIncome")),
      "Schedule BP: presumptive income from goods carriage u/s 44AE must equal the per-carriage breakup.");
    A(97, REQ(RG(BP,"PersumptiveInc44AE.TotalPersumptiveInc"), Math.max(0, N(RG(BP,"PersumptiveInc44AE.TotPersumInc44AE"))-N(RG(BP,"PersumptiveInc44AE.SalInterestByFirm")))),
      "Schedule BP: presumptive income u/s 44AE must be the goods-carriage income reduced by salary/interest paid to partners.");
    A(238, N(RG(BP,"PersumptiveInc44ADA.GrsReceipt")) <= 5000000,
      "Schedule BP: gross receipts u/s 44ADA above Rs. 50,00,000 require a tax audit — ITR-3/ITR-5 must be used, not ITR-4.");
  }

  /* ---------------- Gross total income / total income / tax roll-up ---------------- */
  A(46, REQ(g("IncomeDeductions.TotalIncome"), Math.max(0, g("IncomeDeductions.GrossTotIncomeIncLTCG112A")-N(RG(I,"IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions")))),
    "Total income must equal Gross Total Income minus total Chapter VI-A deductions.");
  A(49, isNew() || REQ(g("IncomeDeductions.GrossTotIncomeIncLTCG112A"), g("IncomeDeductions.IncomeFromSal")+g("IncomeDeductions.IncomeFromBusinessProf")+g("IncomeDeductions.IncomeOthSrc")+g("IncomeDeductions.TotalIncomeChargeableUnHP")+g("LTCG112A.LongCap112A")),
    "Gross Total Income must equal the sum of income from Business/Profession, Salary, House Property, Other Sources and LTCG.");
  A(196, !isNew() || REQ(g("IncomeDeductions.GrossTotIncomeIncLTCG112A"), g("IncomeDeductions.IncomeFromSal")+g("IncomeDeductions.IncomeFromBusinessProf")+g("IncomeDeductions.IncomeOthSrc")+g("IncomeDeductions.TotalIncomeChargeableUnHP")+g("LTCG112A.LongCap112A")),
    "New regime: Gross Total Income must equal the sum of income from Business/Profession, Salary, House Property, Other Sources and LTCG.");
  A(19, N(RG(I,"IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions")) <= g("IncomeDeductions.GrossTotIncomeIncLTCG112A")+1,
    "Deductions claimed under Chapter VI-A cannot be greater than Gross Total Income.");
  A(52, REQ(g("TaxComputation.TaxPayableOnRebate"), Math.max(0, g("TaxComputation.TotalTaxPayable")-g("TaxComputation.Rebate87A"))),
    "Tax after rebate must equal tax payable on total income minus rebate u/s 87A.");
  A(124, !(g("TaxComputation.TotalTaxPayable")>0) || g("IncomeDeductions.GrossTotIncomeIncLTCG112A")>0,
    "Tax has been computed but Gross Total Income is zero.");
  A(229, isNew() || g("TaxComputation.Rebate87A") <= 12500,
    "Old regime: rebate u/s 87A cannot exceed Rs. 12,500.");
  if(I.LTCG112A) A(343, REQ(g("LTCG112A.LongCap112A"), g("IncomeDeductions.GrossTotIncomeIncLTCG112A")-g("IncomeDeductions.GrossTotIncome")),
    "LTCG u/s 112A must equal Gross Total Income including LTCG minus Gross Total Income excluding LTCG.");

  /* ---------------- Salary ---------------- */
  A(64, REQ(g("IncomeDeductions.NetSalary"), Math.max(0, g("IncomeDeductions.GrossSalary")-g("IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10"))),
    "Net salary must equal gross salary minus allowances exempt u/s 10.");
  A(160, REQ(g("IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10"), RSUM(alwRows,"SalOthAmount")),
    "Total allowance exempt u/s 10 must equal the sum of the individual exempt-allowance rows.");
  A(67, isNew() || g("IncomeDeductions.EntertainmntalwncUs16ii") <= 5000,
    "Old regime: entertainment allowance u/s 16(ii) is allowed only up to Rs. 5,000.");
  A(262, g("IncomeDeductions.DeductionUs16ia") <= 75000,
    "Standard deduction u/s 16(ia) cannot exceed Rs. 75,000.");
  A(166, status==="I" || !(g("IncomeDeductions.GrossSalary")>0),
    "A HUF or Firm cannot report salary income.");

  /* salary exempt-allowance caps (old regime) and duplicate / eligibility checks */
  var sal171 = g("IncomeDeductions.Salary");
  A(70, isNew() || alwAmt("10(5)") <= sal171+1,
    "Old regime: leave travel concession exempt u/s 10(5) cannot exceed salary as per section 17(1).");
  A(73, GOVT.indexOf(empcat)>=0 || alwAmt("10(10)") <= 2000000,
    "Death-cum-retirement gratuity exempt u/s 10(10) cannot exceed Rs. 20,00,000.");
  A(76, alwAmt("10(10C)") <= 500000,
    "Amount exempt u/s 10(10C) on voluntary retirement/termination cannot exceed Rs. 5,00,000.");
  A(79, isNew() || alwAmt("10(13A)") <= R(0.5*sal171)+1,
    "Old regime: HRA exempt u/s 10(13A) cannot exceed 50% of salary as per section 17(1).");
  A(181, GOVT.indexOf(empcat)>=0 || alwAmt("10(10AA)") <= 2500000,
    "Leave encashment exempt u/s 10(10AA) cannot exceed Rs. 25,00,000 for a non-government employee.");
  A(223, GOVT.indexOf(empcat)<0 || (alwAmt("10(10B)(i)")===0 && alwAmt("10(10B)(ii)")===0),
    "Exemption u/s 10(10B)(i)/(ii) is not available to government employees or government pensioners.");
  A(226, alwAmt("10(10B)(ii)") <= 500000,
    "Compensation exempt u/s 10(10B)-second proviso cannot exceed Rs. 5,00,000.");
  A(214, (alwAmt("10(10B)(i)")>0?1:0)+(alwAmt("10(10B)(ii)")>0?1:0)+(alwAmt("10(10C)")>0?1:0) <= 1,
    "Exemptions u/s 10(10B)-first proviso, 10(10B)-second proviso and 10(10C) cannot be claimed simultaneously.");
  A(322, alwAmt("EIC")===0 || GOVT.indexOf(empcat)>=0,
    "Exempt income of a judge (10-EIC) can be claimed only by a Central/State Government employee or pensioner.");
  A(88, isNew() || cntAlw("10(17)") <= 1,
    "Old regime: the exempt allowance u/s 10(17) (MP/MLA/MLC) cannot be selected more than once.");
  A(184, !isNew() || (alwAmt("10(5)")===0 && alwAmt("10(13A)")===0 && alwAmt("10(14)(i)")===0 && alwAmt("10(14)(ii)")===0),
    "New regime: exempt allowances u/s 10(5), 10(13A), 10(14)(i) and 10(14)(ii) must be zero.");
  A(199, !isNew() || alwAmt("10(13A)")===0,
    "New regime: HRA exempt u/s 10(13A) must be zero.");
  A(202, !isNew() || alwAmt("10(17)")===0,
    "New regime: exempt allowance u/s 10(17) (MP/MLA/MLC) must be zero.");

  /* HRA helper schedule */
  if(I.ScheduleEA10_13A){ var H=I.ScheduleEA10_13A;
    A(313, N(H.EligbleExmpAllwncUs13A) <= N(H.ActlHRARecv)+1 && N(H.EligbleExmpAllwncUs13A) <= N(H.ActlRentPaid10Per)+1 && N(H.EligbleExmpAllwncUs13A) <= N(H.Sal40Or50Per)+1,
      "Schedule 10(13A): the HRA exemption must be the least of actual HRA received, rent paid less 10% of salary, and 40%/50% of salary.");
  }

  /* ---------------- Exempt income (D20) — 'cannot be selected more than once' ---------------- */
  A(82,  cntSub("10(10BC)") <= 1, "Exempt income u/s 10(10BC) cannot be selected more than once.");
  A(85,  cntSub("10(12)")   <= 1, "Exempt income u/s 10(12) (Recognized Provident Fund) cannot be selected more than once.");
  A(91,  cntSub("DMD")      <= 1, "Exempt income 'Defense Medical Disability Pension' cannot be selected more than once.");
  A(94,  cntSub("10(26AAA)")<= 1, "Exempt income u/s 10(26AAA) cannot be selected more than once.");
  A(367, cntSub("10(2)")    <= 1, "Exempt income u/s 10(2) (member's share from HUF) cannot be selected more than once.");
  A(370, cntSub("10(12A)")  <= 1, "Exempt income u/s 10(12A) (NPS partial withdrawal) cannot be selected more than once.");
  A(373, cntSub("10(12B)")  <= 1, "Exempt income u/s 10(12B) cannot be selected more than once.");
  A(376, cntSub("10(15)")   <= 1, "Exempt income u/s 10(15) cannot be selected more than once.");
  A(382, cntSub("10(25)")   <= 1, "Exempt income u/s 10(25) cannot be selected more than once.");
  A(385, cntSub("10(31)")   <= 1, "Exempt income u/s 10(31) cannot be selected more than once.");
  A(388, cntSub("10(35A)")  <= 1, "Exempt income u/s 10(35A) cannot be selected more than once.");
  A(130, cntSub("10(1)") <= 1 && subAmt("10(1)") <= 5000,
    "Agricultural income shown as exempt cannot exceed Rs. 5,000 and cannot be selected more than once.");
  A(391, !isNew() || subAmt("10(32)")===0,
    "New regime: exempt income u/s 10(32) (minor child's income) must be zero.");

  /* ---------------- House property ---------------- */
  RG(I,"IncomeDeductions.PropertyDetails",[]).forEach(function(p,i){ var L="House property "+(i+1)+": "; if(!p) return;
    var rd=p.Rentdetails||{};
    A(55, REQ(rd.BalanceALV, Math.max(0, N(rd.AnnualLetableValue)-N(rd.TotalUnrealizedAndTax))), L+"the annual value must equal the annual letable value minus the unrealized rent and taxes.");
    A(349, REQ(rd.TotalUnrealizedAndTax, N(rd.RentNotRealized)+N(rd.LocalTaxes)), L+"the total of unrealized rent and local taxes must equal their individual amounts.");
    A(61, p.ifLetOut!=="S" || N(rd.LocalTaxes)===0, L+"tax paid to local authorities is not allowed for a self-occupied property.");
    A(58, N(rd.AnnualLetableValue)>0 || N(rd.LocalTaxes)===0, L+"municipal tax cannot be claimed when the gross rent/lettable value is nil.");
    A(352, N(rd.AnnualLetableValue)>0 || N(rd.RentNotRealized)===0, L+"rent which cannot be realised cannot be entered when the gross rent/lettable value is nil.");
    A(408, N(rd.RentNotRealized) <= N(rd.AnnualLetableValue)+1, L+"rent which cannot be realised cannot exceed the gross rent received/receivable.");
    A(289, REQ(N(rd.IntOnBorwCap), N(RG(rd,"Section24B.TotalInterestUs24B"))), L+"interest on borrowed capital must equal the total interest u/s 24(b).");
    A(154, isNew() || p.ifLetOut!=="S" || N(rd.IntOnBorwCap) <= 200000, L+"old regime: interest on borrowed capital for a self-occupied property cannot exceed Rs. 2,00,000.");
    if(p.PropCoOwnedFlg==="Y"){ var co=RG(p,"CoOwners",[])||[];
      A(346, REQ(N(p.AsseseeShareProperty)+RSUM(co,"PercentShareProperty"), 100), L+"for a co-owned property the assessee's share and the co-owners' shares must total 100%.");
      A(405, co.every(function(o){var s=N(o&&o.PercentShareProperty);return s>0&&s<100;}), L+"each co-owner's percentage share must be greater than 0 and less than 100.");
    }
  });

  /* ---------------- Deductions (Chapter VI-A caps, eligibility, regime) ---------------- */
  A(28, status!=="F" || N(ALW.Section80DD)===0, "A Firm cannot claim deduction u/s 80DD.");
  A(31, status!=="F" || N(ALW.Section80DDB)===0, "A Firm cannot claim deduction u/s 80DDB.");
  A(43, status==="I" || N(ALW.Section80U)===0, "A HUF or Firm cannot claim deduction u/s 80U.");
  A(163, status==="I" || N(ALW.Section80EEA)===0, "A HUF or Firm (other than LLP) cannot claim deduction u/s 80EEA.");
  A(304, status!=="H" || (!I.Schedule80E && !I.Schedule80EE && !I.Schedule80EEA && !I.Schedule80EEB && N(ALW.Section80CCC)===0),
    "A HUF cannot fill Schedule 80CCC/80E/80EE/80EEA/80EEB.");
  A(34, isNew() || !(N(ALW.Section80G)>0) || !!I.Schedule80G, "Old regime: deduction u/s 80G is claimed but the details in Schedule 80G are missing.");
  A(37, isNew() || N(ALW.Section80GG) <= 60000, "Old regime: deduction u/s 80GG cannot exceed Rs. 60,000.");
  A(40, isNew() || dob <= "1966-04-01" || N(ALW.Section80TTB)===0, "Old regime: a non-senior-citizen (born on/after 02.04.1966) cannot claim deduction u/s 80TTB.");
  A(145, isNew() || N(ALW.Section80CCD1B) <= 50000, "Old regime: deduction u/s 80CCD(1B) is limited to Rs. 50,000.");
  A(148, isNew() || N(ALW.Section80DDB) <= 100000, "Old regime: deduction u/s 80DDB cannot exceed the maximum limit of Rs. 1,00,000.");
  A(157, isNew() || !(N(ALW.Section80EEA)>0 && N(ALW.Section80EE)>0), "Old regime: deduction u/s 80EEA and u/s 80EE cannot both be claimed.");

  /* new-regime: these deductions are closed (allowed figure must be zero) */
  A(190, !isNew() || (N(ALW.Section80G)===0 && !I.Schedule80G), "New regime: deduction u/s 80G cannot be claimed and Schedule 80G must not be provided.");
  A(193, !isNew() || N(ALW.Section80TTB)===0, "New regime: deduction u/s 80TTB must be zero.");
  A(205, !isNew() || N(ALW.Section80DDB)===0, "New regime: deduction u/s 80DDB must be zero.");
  A(208, !isNew() || N(ALW.Section80CCDEmployeeOrSE)===0, "New regime: deduction u/s 80CCD(1) must be zero.");
  A(211, !isNew() || (N(ALW.Section80D)===0 && !I.Schedule80D), "New regime: deduction u/s 80D cannot be claimed and Schedule 80D must not be provided.");

  /* allowed deduction must never exceed the user-enterable amount */
  A(325, N(ALW.Section80CCC)        <= N(USR.Section80CCC)+1,        "Eligible deduction u/s 80CCC cannot exceed the amount entered.");
  A(328, N(ALW.Section80CCDEmployer)<= N(USR.Section80CCDEmployer)+1,"Eligible deduction u/s 80CCD(2) cannot exceed the amount entered.");
  A(331, N(ALW.Section80DDB)        <= N(USR.Section80DDB)+1,        "Eligible deduction u/s 80DDB cannot exceed the amount entered.");
  A(334, N(ALW.Section80EEA)        <= N(USR.Section80EEA)+1,        "Eligible deduction u/s 80EEA cannot exceed the amount entered.");
  A(337, N(ALW.Section80GG)         <= N(USR.Section80GG)+1,         "Eligible deduction u/s 80GG cannot exceed the amount entered.");
  A(340, N(ALW.Section80TTB)        <= N(USR.Section80TTB)+1,        "Eligible deduction u/s 80TTB cannot exceed the amount entered.");
  A(241, !(N(ALW.Section80GGC)>0) || !!I.Schedule80GGC, "Deduction u/s 80GGC is claimed but the details in Schedule 80GGC are missing.");

  /* ---------------- Schedule 80G / 80GGC ---------------- */
  if(I.Schedule80G){ var G=I.Schedule80G;
    A(103, REQ(G.TotalDonationsUs80G, N(RG(G,"Don100Percent.TotDon100Percent"))+N(RG(G,"Don50PercentNoApprReqd.TotDon50PercentNoApprReqd"))+N(RG(G,"Don100PercentApprReqd.TotDon100PercentApprReqd"))+N(RG(G,"Don50PercentApprReqd.TotDon50PercentApprReqd"))),
      "Schedule 80G: total donations (E) must equal the sum of the four donation-category totals.");
    if(G.Don100PercentApprReqd) A(106, REQ(RG(G,"Don100PercentApprReqd.TotDon100PercentApprReqd"), N(RG(G,"Don100PercentApprReqd.TotDon100PercentApprReqdCash"))+N(RG(G,"Don100PercentApprReqd.TotDon100PercentApprReqdOtherMode"))),
      "Schedule 80G: total donation in table (C) must equal donation in cash plus donation in other mode.");
  }
  if(I.Schedule80GGC){
    A(244, REQ(RG(I,"Schedule80GGC.TotalEligibleDonationAmt80GGC"), Math.min(RSUM(RG(I,"Schedule80GGC.Schedule80GGCDetails",[]),"EligibleDonationAmt"), g("IncomeDeductions.GrossTotIncome"))),
      "Schedule 80GGC: eligible amount (D) must equal the sum of individual eligible amounts restricted to Gross Total Income.");
    RG(I,"Schedule80GGC.Schedule80GGCDetails",[]).forEach(function(r,i){ if(!r) return;
      A(256, !r.DonationDate || (r.DonationDate>="2025-04-01" && r.DonationDate<="2026-03-31"),
        "Schedule 80GGC row "+(i+1)+": the contribution date must fall within 01.04.2025 to 31.03.2026.");
    });
  }

  /* ---------------- Schedule 80DD / 80D ---------------- */
  if(I.Schedule80DD) A(250, !(N(RG(I,"Schedule80DD.DeductionAmount"))>0) || (!!RG(I,"Schedule80DD.NatureOfDisability","")&&!!RG(I,"Schedule80DD.TypeOfDisability","")&&!!RG(I,"Schedule80DD.DependentType","")),
    "Schedule 80DD: when a deduction is claimed the nature/type of disability and dependent type are mandatory.");
  if(I.Schedule80D){ var sd=RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{})||{};
    A(217, !(N(sd.SelfAndFamilySeniorCitizen)>0) || sd.SeniorCitizenFlag==="Y", "Schedule 80D: the senior-citizen self/family deduction (1b) needs the self/family dropdown set to 'Yes'.");
    A(220, sd.SeniorCitizenFlag!=="S" || (N(sd.SelfAndFamily)===0 && N(sd.SelfAndFamilySeniorCitizen)===0), "Schedule 80D: no self/family deduction can be claimed when 'Not claiming for Self/Family' is selected.");
    A(232, status!=="H" || (N(sd.Parents)===0 && N(sd.ParentsSeniorCitizen)===0), "Schedule 80D: a HUF cannot claim the parents deduction (Sl. No. 2).");
    A(283, REQ(RG(sd,"Sec80DSelfFamHIDtls.TotalPayments"), RSUM(RG(sd,"Sec80DSelfFamHIDtls.Sch80DInsDtls",[]),"HealthInsAmt")), "Schedule 80D: the self/family health-insurance rows must sum to the premium entered.");
    A(286, REQ(RG(sd,"Sec80DParentsHIDtls.TotalPayments"), RSUM(RG(sd,"Sec80DParentsHIDtls.Sch80DInsDtls",[]),"HealthInsAmt")), "Schedule 80D: the parents' health-insurance rows must sum to the premium entered.");
  }

  /* ---------------- Schedule 80EE (interest rows sum to total) ---------------- */
  if(I.Schedule80EE) A(298, REQ(RG(I,"Schedule80EE.TotalInterest80EE"), RSUM(RG(I,"Schedule80EE.Schedule80EEDtls",[]),"Interest80EE")),
    "Schedule 80EE: the individual interest rows must sum to the total interest u/s 80EE.");

  /* ---------------- Taxes paid (TDS / TCS / totals) ---------------- */
  if(I.TDSonSalaries) A(118, REQ(RG(I,"TDSonSalaries.TotalTDSonSalaries"), RSUM(RG(I,"TDSonSalaries.TDSonSalary",[]),"TotalTDSSal")),
    "Schedule TDS1: total tax deducted (col 4) must equal the sum of the individual rows.");
  if(I.ScheduleTCS) A(112, REQ(RG(I,"ScheduleTCS.TotalSchTCS"), RSUM(RG(I,"ScheduleTCS.TCS",[]),"AmtTCSClaimedThisYear")),
    "Schedule TCS: total TCS credit claimed this year (col 5) must equal the sum of the individual rows.");
  if(I.TDSonOthThanSals) RG(I,"TDSonOthThanSals.TDSonOthThanSalDtls",[]).forEach(function(r,i){ if(!r) return;
    A(310, r.TDSSection!=="192", "Schedule TDS2 row "+(i+1)+": section 192 (TDS on salary) cannot be selected under TDS on income other than salary.");
  });
  A(127, REQ(g("TaxPaid.TaxesPaid.TotalTaxesPaid"), g("TaxPaid.TaxesPaid.AdvanceTax")+g("TaxPaid.TaxesPaid.TDS")+g("TaxPaid.TaxesPaid.TCS")+g("TaxPaid.TaxesPaid.SelfAssessmentTax")),
    "Total taxes paid must equal the sum of Advance Tax, TDS, TCS and Self-Assessment Tax.");
});
