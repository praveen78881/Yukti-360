/* =====================================================================
   ITR-4 (Sugam) · AY 2026-27 — Category-A validation rules, batch g1
   (Phase 6, rules-enforcer). Registered via ruleset(fn); runRules()
   invokes it as (I,S_,A,Dd). A(n,cond,msg) FIRES when cond (the
   assertion that holds for a VALID return) is FALSE. Every read is
   guarded (RG / (X||{}) / arrays default []), so nothing throws.
   Regime: isNew()===false means the OLD regime (S.fs.optout==="Yes").
   The valid old-regime test return must satisfy every assertion here.
   Schema keys are the flat ITR-4 build (PersonalInfo/FilingStatus/
   IncomeDeductions/TaxComputation/TaxPaid + Schedule* siblings). This
   batch is disjoint from 61_rules_g0.js; excluded serials are logged in
   logs/ITR-4/rules_class_g1.json.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var USR  = RG(I,"IncomeDeductions.UsrDeductUndChapVIA",{})||{};   /* claimed (user-enterable) */
  var ALW  = RG(I,"IncomeDeductions.DeductUndChapVIA",{})||{};      /* allowed (post-cap, post-regime) */
  var status = RG(I,"PersonalInfo.Status","I");
  var empcat = RG(I,"PersonalInfo.EmployerCategory","OTH");
  var GOVT   = ["CGOV","SGOV","PE","PESG"];                          /* govt / govt-pensioner employer categories */
  var g = function(p){ return N(RG(I,p)); };                         /* numeric read, default 0 */

  var alwRows = RG(I,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  var alwAmt  = function(code){ return RSUM(alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}),"SalOthAmount"); };

  /* ---------------- Presumptive business / profession (Schedule BP) ---------------- */
  A(2, REQ(g("IncomeDeductions.IncomeFromBusinessProf"),
        N(RG(I,"ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD"))
       +N(RG(I,"ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA"))
       +N(RG(I,"ScheduleBP.PersumptiveInc44AE.TotalPersumptiveInc"))),
    "Business income in Gross Total Income must equal the total presumptive income declared in Schedule BP.");
  if(I.ScheduleBP){ var BP=I.ScheduleBP;
    A(5, N(RG(BP,"PersumptiveInc44AD.TotPersumptiveInc44AD"))
         >= R(0.06*N(RG(BP,"PersumptiveInc44AD.GrsTrnOverBank")))
          + R(0.08*(N(RG(BP,"PersumptiveInc44AD.GrsTotalTrnOverInCash"))+N(RG(BP,"PersumptiveInc44AD.GrsTrnOverAnyOthMode")))) - 1,
      "Schedule BP: presumptive income u/s 44AD must be at least 6% of turnover received through banking channels and 8% of the balance.");
    A(8, N(RG(BP,"PersumptiveInc44AD.TotPersumptiveInc44AD")) <= N(RG(BP,"PersumptiveInc44AD.GrsTotalTrnOver"))+1,
      "Schedule BP: presumptive income u/s 44AD cannot be more than the gross turnover / gross receipts.");
    A(11, !(N(RG(BP,"PersumptiveInc44AD.TotPersumptiveInc44AD"))>0) || RG(BP,"NatOfBus44AD",[]).length>0,
      "Schedule BP: when income is declared u/s 44AD the business code u/s 44AD is mandatory.");
    A(14, N(RG(BP,"PersumptiveInc44ADA.TotPersumptiveInc44ADA")) >= R(0.5*N(RG(BP,"PersumptiveInc44ADA.GrsReceipt"))) - 1,
      "Schedule BP: presumptive income u/s 44ADA cannot be less than 50% of the gross receipts.");
    A(17, !(RG(BP,"NatOfBus44ADA",[]).length>0) || N(RG(BP,"PersumptiveInc44ADA.TotPersumptiveInc44ADA"))>0,
      "Schedule BP: when a business code u/s 44ADA is selected, income u/s 44ADA must be declared.");
    A(137, !(N(RG(BP,"PersumptiveInc44AE.TotPersumInc44AE"))>0) || RG(BP,"NatOfBus44AE",[]).length>0,
      "Schedule BP: when income is declared u/s 44AE the business code u/s 44AE is mandatory.");
    A(239, REQ(N(RG(BP,"PersumptiveInc44ADA.GrsReceipt")),
             N(RG(BP,"PersumptiveInc44ADA.GrsTrnOverBank44ADA"))
            +N(RG(BP,"PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA"))
            +N(RG(BP,"PersumptiveInc44ADA.GrsTrnOverAnyOthMode44ADA"))),
      "Schedule BP: gross receipts u/s 44ADA (E3) must equal the sum of E3a + E3b + E3c.");
  }

  /* ---------------- Tax computation roll-up (Part D) ---------------- */
  A(53, REQ(g("TaxComputation.GrossTaxLiability"), g("TaxComputation.TaxPayableOnRebate")+g("TaxComputation.EducationCess")),
    "Total tax and Health & Education cess must equal tax payable after rebate plus the cess.");
  A(56, REQ(g("TaxComputation.NetTaxLiability"), g("TaxComputation.GrossTaxLiability")-g("TaxComputation.Section89")),
    "Balance tax after relief must equal total tax & cess minus relief u/s 89(1).");

  /* ---------------- Other sources ---------------- */
  A(62, REQ(g("IncomeDeductions.IncomeOthSrc")+g("IncomeDeductions.DeductionUs57iia"),
            RSUM(RG(I,"IncomeDeductions.OthersInc.OthersIncDtlsOthSrc",[]),"OthSrcOthAmount")),
    "Income from other sources must equal the sum of the individual other-source amounts.");
  A(95, !(g("IncomeDeductions.DeductionUs57iia")>0) ||
        RG(I,"IncomeDeductions.OthersInc.OthersIncDtlsOthSrc",[]).some(function(r){return r&&r.OthSrcNatureDesc==="FAP";}),
    "Deduction u/s 57(iia) is allowed only when 'Family pension' is selected under income from other sources.");
  A(185, RG(I,"IncomeDeductions.OthersInc.OthersIncDtlsOthSrc",[]).every(function(r){
        if(!r||r.OthSrcNatureDesc!=="DIV") return true; var dr=RG(r,"DividendInc.DateRange",{})||{};
        return REQ(N(r.OthSrcOthAmount), N(dr.Upto15Of6)+N(dr.Upto15Of9)+N(dr.Up16Of9To15Of12)+N(dr.Up16Of12To15Of3)+N(dr.Up16Of3To31Of3)); }),
    "Total dividend income must equal the sum of the quarterly breakup of dividend income.");

  /* ---------------- Salary ---------------- */
  A(65, REQ(g("IncomeDeductions.DeductionUs16"),
            g("IncomeDeductions.DeductionUs16ia")+g("IncomeDeductions.EntertainmntalwncUs16ii")+g("IncomeDeductions.ProfessionalTaxUs16iii")),
    "Deductions u/s 16 must equal the sum of 16(ia) + 16(ii) + 16(iii).");
  A(71, alwAmt("10(6)") <= g("IncomeDeductions.GrossSalary")+1,
    "Exempt allowance u/s 10(6) cannot be more than the gross salary.");
  A(74, alwAmt("10(10A)") <= g("IncomeDeductions.Salary")+1,
    "Commuted value of pension exempt u/s 10(10A) cannot be more than salary as per section 17(1).");
  A(200, !isNew() || alwAmt("10(14)(i)")===0,
    "New regime: prescribed allowances exempt u/s 10(14)(i) must be zero.");
  A(233, (function(){var seen={};return alwRows.every(function(r){var n=r&&r.SalNatureDesc;if(!n)return true;if(seen[n])return false;seen[n]=1;return true;});})(),
    "Each exempt allowance section in salary must be disclosed under only one dropdown row.");
  A(314, !(g("IncomeDeductions.GrossSalary")>0 || alwRows.length>0) || !!RG(I,"PersonalInfo.EmployerCategory",""),
    "Nature of employment must be provided when salary income or exempt allowances are reported.");
  A(317, GOVT.indexOf(empcat)<0 || alwAmt("10(10)") <= 2500000,
    "Death-cum-retirement gratuity exempt u/s 10(10) cannot exceed Rs. 25,00,000 for a government employee/pensioner.");

  /* HRA helper schedule (10(13A)) */
  if(I.ScheduleEA10_13A){ var H2=I.ScheduleEA10_13A;
    /* ActlRentPaid10Per already holds "rent paid after deducting 10% of salary"
       (leg B = rent − 10%×(basic+DA), per the book G10 and rule 311's own text),
       so the ceiling is that field itself — not ActlRentPaid minus it. */
    A(311, isNew() || N(H2.EligbleExmpAllwncUs13A) <= N(H2.ActlRentPaid10Per)+1,
      "Old regime: HRA exempt u/s 10(13A) cannot exceed actual rent paid less 10% of salary.");
  }

  /* ---------------- Chapter VI-A — old-regime caps & conditional presence ---------------- */
  A(29, isNew() || !(N(RG(I,"Schedule80DD.DeductionAmount"))>0) || !!RG(I,"Schedule80DD.NatureOfDisability",""),
    "Old regime: the eligible category (nature of disability) is required for the deduction u/s 80DD.");
  A(44, isNew() || !(N(RG(I,"Schedule80U.DeductionAmount"))>0) || !!RG(I,"Schedule80U.NatureOfDisability",""),
    "Old regime: the eligible category (nature of disability) is required for the deduction u/s 80U.");
  A(149, isNew() || N(USR.Section80DDB) <= (RG(I,"IncomeDeductions.UsrDeductUndChapVIA.Section80DDBUsrType")==="2"?100000:40000),
    "Old regime: deduction claimed u/s 80DDB cannot exceed its category maximum (Rs. 40,000 / Rs. 1,00,000 for senior citizen).");
  A(152, isNew() || N(ALW.Section80TTA) <= 10000,
    "Old regime: the maximum deduction allowed u/s 80TTA is Rs. 10,000.");
  A(158, isNew() || N(ALW.Section80EEB) <= 150000,
    "Old regime: deduction u/s 80EEB cannot exceed the maximum limit of Rs. 1,50,000.");
  A(161, ["PE","PESG","PEPS","PEO"].indexOf(empcat)<0 || N(USR.Section80CCDEmployer)===0,
    "Deduction u/s 80CCD(2) cannot be claimed when the employer category is a pensioner category.");
  A(179, isNew() || !(N(ALW.Section80D)>0) || !!I.Schedule80D,
    "Old regime: deduction u/s 80D is claimed but the details in Schedule 80D are missing.");
  A(251, isNew() || !(N(ALW.Section80U)>0) || !!I.Schedule80U,
    "Deduction u/s 80U is claimed but the details in Schedule 80U are missing.");
  A(263, !isNew() || g("IncomeDeductions.GrossSalary")===0 || N(USR.Section80CCDEmployer) <= R(0.14*g("IncomeDeductions.GrossSalary"))+1,
    "New regime: deduction u/s 80CCD(2) cannot exceed 14% of salary.");

  /* new-regime: these deductions are closed (allowed figure must be zero) */
  A(191, !isNew() || N(ALW.Section80GG)===0, "New regime: deduction u/s 80GG cannot be claimed.");
  A(194, !isNew() || N(ALW.Section80U)===0,  "New regime: deduction u/s 80U must be zero.");
  A(203, !isNew() || N(ALW.Section80CCD1B)===0, "New regime: deduction u/s 80CCD(1B) must be zero.");
  A(206, !isNew() || N(ALW.Section80EE)===0,  "New regime: deduction u/s 80EE must be zero.");
  A(209, !isNew() || N(ALW.Section80EEA)===0, "New regime: deduction u/s 80EEA must be zero.");
  A(305, !isNew() || (!I.Schedule80C && !I.Schedule80E && !I.Schedule80EE && !I.Schedule80EEA),
    "New regime: Schedule 80C / 80E / 80EE / 80EEA must not be filled.");
  A(302, !isNew() || RG(I,"IncomeDeductions.PropertyDetails",[]).every(function(p){return !p||p.ifLetOut!=="S"||N(RG(p,"Rentdetails.IntOnBorwCap"))===0;}),
    "New regime: interest on borrowed capital cannot be claimed for a self-occupied house property.");

  /* allowed deduction must never exceed the user-enterable amount */
  A(326, N(ALW.Section80CCDEmployeeOrSE) <= N(USR.Section80CCDEmployeeOrSE)+1, "Eligible deduction u/s 80CCD(1) cannot exceed the amount entered.");
  A(329, N(ALW.Section80D)  <= N(USR.Section80D)+1,  "Eligible deduction u/s 80D cannot exceed the amount entered.");
  A(332, N(ALW.Section80E)  <= N(USR.Section80E)+1,  "Eligible deduction u/s 80E cannot exceed the amount entered.");
  A(335, N(ALW.Section80EEB)<= N(USR.Section80EEB)+1,"Eligible deduction u/s 80EEB cannot exceed the amount entered.");
  A(338, N(ALW.Section80GGC)<= N(USR.Section80GGC)+1,"Eligible deduction u/s 80GGC cannot exceed the amount entered.");
  A(341, N(ALW.Section80U)  <= N(USR.Section80U)+1,  "Eligible deduction u/s 80U cannot exceed the amount entered.");

  /* VI-A line vs sub-schedule totals */
  A(290, REQ(N(USR.Section80C), N(RG(I,"Schedule80C.TotalAmt"))),
    "Deduction u/s 80C claimed under Chapter VI-A must equal the total of payments in Schedule 80C.");
  A(293, REQ(N(USR.Section80EEA), N(RG(I,"Schedule80EEA.TotalInterest80EEA"))),
    "Deduction u/s 80EEA in Chapter VI-A must equal the total interest paid in Schedule 80EEA.");
  A(296, !I.Schedule80C || REQ(N(RG(I,"Schedule80C.TotalAmt")), RSUM(RG(I,"Schedule80C.Schedule80CDtls",[]),"Amount")),
    "Schedule 80C: the individual rows for amount of payment must sum to the total of payments.");
  A(299, !I.Schedule80EEA || REQ(N(RG(I,"Schedule80EEA.TotalInterest80EEA")), RSUM(RG(I,"Schedule80EEA.Schedule80EEADtls",[]),"Interest80EEA")),
    "Schedule 80EEA: the individual rows for interest paid must sum to the total.");
  A(248, REQ(N(ALW.Section80DD), N(RG(I,"Schedule80DD.DeductionAmount"))) && REQ(N(USR.Section80DD), N(RG(I,"Schedule80DD.DeductionAmount"))),
    "In Schedule VIA, the value at Section 80DD (both user and system) must equal the deduction amount in Schedule 80DD.");

  /* loan-detail presence and limits for 80EE / 80EEA / 80EEB */
  A(272, !(N(ALW.Section80EEA)>0) || RG(I,"Schedule80EEA.Schedule80EEADtls",[]).length>0,
    "Details of the bank from which the loan is taken must be provided in Schedule 80EEA.");
  A(275, !(N(ALW.Section80EE)>0) || RG(I,"Schedule80EE.Schedule80EEDtls",[]).length>0,
    "Details of the bank from which the loan is taken must be provided in Schedule 80EE.");
  A(278, RG(I,"Schedule80EEA.Schedule80EEADtls",[]).length===0 || N(RG(I,"Schedule80EEA.PropStmpDtyVal")) <= 4500000,
    "Deduction u/s 80EEA is available only where the stamp-duty value of the house property is up to Rs. 45 lakh.");
  RG(I,"Schedule80EEB.Schedule80EEBDtls",[]).forEach(function(r,i){ if(!r) return;
    A(281, !r.DateofLoan || (r.DateofLoan>="2019-04-01" && r.DateofLoan<="2023-03-31"),
      "Schedule 80EEB row "+(i+1)+": the date of sanction of the loan must fall between 01.04.2019 and 31.03.2023."); });

  /* ---------------- Schedule 80D (old regime) ---------------- */
  if(I.Schedule80D){ var sd=RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{})||{};
    A(170, isNew() || (N(sd.PrevHlthChckUpSlfFam)+N(sd.PrevHlthChckUpSlfFamSrCtzn)+N(sd.PrevHlthChckUpParents)+N(sd.PrevHlthChckUpParentsSrCtzn)) <= 5000,
      "Old regime: the preventive health check-up across all fields cannot exceed Rs. 5,000.");
    A(173, isNew() || N(sd.Parents) <= 25000,
      "Old regime: the parents' deduction (Sl. No. 2a, non-senior) is allowed only up to Rs. 25,000.");
    A(218, N(sd.Parents)===0 || sd.ParentsSeniorCitizenFlag==="N",
      "Schedule 80D: the parents' deduction (2a) can be claimed only when the parents' senior-citizen dropdown is 'No'.");
    A(221, sd.ParentsSeniorCitizenFlag!=="P" || (N(sd.Parents)===0 && N(sd.ParentsSeniorCitizen)===0),
      "Schedule 80D: no parents' deduction (2a/2b) can be claimed when 'Not claiming for Parents' is selected.");
    A(284, REQ(N(RG(sd,"Sec80DSelfFamSrCtznHIDtls.TotalPayments")), RSUM(RG(sd,"Sec80DSelfFamSrCtznHIDtls.Sch80DInsDtls",[]),"HealthInsAmt"))
         && REQ(N(RG(sd,"Sec80DParentsSrCtznHIDtls.TotalPayments")), RSUM(RG(sd,"Sec80DParentsSrCtznHIDtls.Sch80DInsDtls",[]),"HealthInsAmt")),
      "Schedule 80D: the senior-citizen health-insurance rows must sum to the premium entered.");
  }

  /* ---------------- Schedule 80G / 80GGC ---------------- */
  var apan=RG(I,"PersonalInfo.PAN",""), vpan=RG(I,"Verification.Declaration.AssesseeVerPAN","");
  A(35, isNew() || N(RG(I,"Schedule80G.TotalEligibleDonationsUs80G")) <= N(RG(I,"Schedule80G.TotalDonationsUs80G"))+1,
    "Old regime: in Schedule 80G the eligible amount of deduction cannot exceed the total donation.");
  A(98, ["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"].every(function(b){
        return RG(I,"Schedule80G."+b+".DoneeWithPan",[]).every(function(d){ var p=d&&d.DoneePAN; if(!p||p==="NA") return true; return p!==apan && p!==vpan; }); }),
    "Schedule 80G: the donee PAN cannot be the same as the assessee's PAN or the PAN at verification.");
  A(242, RG(I,"Schedule80GGC.Schedule80GGCDetails",[]).every(function(r){ return r?REQ(N(r.EligibleDonationAmt), N(r.DonationAmtOtherMode)):true; }),
    "Schedule 80GGC: the eligible amount of each row must equal the donation in a mode other than cash.");
  A(245, REQ(N(RG(I,"Schedule80GGC.TotalDonationAmtCash80GGC")), RSUM(RG(I,"Schedule80GGC.Schedule80GGCDetails",[]),"DonationAmtCash"))
       && REQ(N(RG(I,"Schedule80GGC.TotalDonationAmtOtherMode80GGC")), RSUM(RG(I,"Schedule80GGC.Schedule80GGCDetails",[]),"DonationAmtOtherMode"))
       && REQ(N(RG(I,"Schedule80GGC.TotalDonationsUs80GGC")), RSUM(RG(I,"Schedule80GGC.Schedule80GGCDetails",[]),"DonationAmt")),
    "Schedule 80GGC: totals A/B/C must equal the sum of the individual amounts entered.");
  A(398, RG(I,"Schedule80GGC.Schedule80GGCDetails",[]).every(function(r){ if(!r) return true;
        return !!r.PoliticalPartyName && r.PoliticalPartyName!=="NA" && !!r.PoliticalPartyPAN && r.PoliticalPartyPAN!=="NA"; }),
    "Schedule 80GGC: the name and PAN of the political party are required to claim the deduction u/s 80GGC.");

  /* ---------------- Taxes paid (TDS / IT / totals / refund) ---------------- */
  A(110, !I.ScheduleIT || REQ(N(RG(I,"ScheduleIT.TotalTaxPayments")), RSUM(RG(I,"ScheduleIT.TaxPayment",[]),"Amt")),
    "Schedule IT: the total tax paid (col 4) must equal the sum of the individual challan amounts.");
  A(113, RG(I,"TDSonOthThanSals.TDSonOthThanSalDtls",[]).every(function(r){return r?N(r.TDSClaimed)<=N(r.TDSDeducted)+N(r.BroughtFwdTDSAmt)+1:true;})
       && RG(I,"ScheduleTDS3Dtls.TDS3Details",[]).every(function(r){return r?N(r.TDSClaimed)<=N(r.TDSDeducted)+N(r.BroughtFwdTDSAmt)+1:true;}),
    "Schedule TDS2: the TDS claimed this year cannot be more than the tax deducted plus the amount brought forward.");
  A(116, RG(I,"ScheduleTDS3Dtls.TDS3Details",[]).every(function(r){ return (!r||!(N(r.GrossAmount)>0))?true:N(r.TDSClaimed)<=N(r.GrossAmount)+1; }),
    "Schedule TDS2(ii): the TDS claimed (col 6) cannot be more than the gross income offered (col 7).");
  A(119, !I.TDSonOthThanSals || REQ(N(RG(I,"TDSonOthThanSals.TotalTDSonOthThanSals")), RSUM(RG(I,"TDSonOthThanSals.TDSonOthThanSalDtls",[]),"TDSClaimed")),
    "Schedule TDS2: the total of col 6 (TDS credit claimed this year) must equal the sum of the individual values.");
  A(125, !(g("TaxPaid.TaxesPaid.TotalTaxesPaid")>0) || g("IncomeDeductions.GrossTotIncome")>0,
    "Taxes paid have been disclosed but no income has been disclosed in the return.");
  A(128, Math.abs(g("Refund.RefundDue") - Math.max(0, g("TaxPaid.TaxesPaid.TotalTaxesPaid")-g("TaxComputation.TotTaxPlusIntrstPay"))) <= 10,
    "The refund claimed must equal the difference between total taxes paid and total tax, fee & interest.");
  A(131, REQ(g("TaxPaid.TaxesPaid.TDS"),
            g("TDSonSalaries.TotalTDSonSalaries")+g("TDSonOthThanSals.TotalTDSonOthThanSals")+g("ScheduleTDS3Dtls.TotalTDS3Details")),
    "Total TDS claimed must equal the sum of TDS claimed in TDS1, TDS2(i) and TDS2(ii).");
  A(134, REQ(g("TaxPaid.TaxesPaid.SelfAssessmentTax"),
            RSUM(RG(I,"ScheduleIT.TaxPayment",[]).filter(function(c){return c&&String(c.DateDep)>"2026-03-31";}),"Amt")),
    "Total self-assessment tax must equal the tax paid in Schedule IT for challans deposited after 31 March 2026.");

  /* ---------------- House property ---------------- */
  RG(I,"IncomeDeductions.PropertyDetails",[]).forEach(function(p,i){ var L="House property "+(i+1)+": "; if(!p) return; var rd=p.Rentdetails||{};
    A(59, (p.ifLetOut!=="L" && p.ifLetOut!=="D") || N(rd.AnnualLetableValue)>0,
      L+"a let-out / deemed let-out property must have a non-zero gross rent / lettable value.");
    A(269, !(N(rd.IntOnBorwCap)>0) || RG(rd,"Section24B.Section24BDtls",[]).length>0,
      L+"details of the bank from which the loan is taken are required to claim interest on borrowed capital u/s 24(b).");
    A(323, !(N(rd.IntOnBorwCap)>0) || !!p.ifLetOut,
      L+"the type of house property is mandatory when interest on borrowed capital u/s 24(b) is claimed.");
    A(347, REQ(N(rd.AnnualOfPropOwned), R((p.AsseseeShareProperty==null?100:N(p.AsseseeShareProperty))/100 * N(rd.BalanceALV)), 2),
      L+"for a co-owned property the annual value of the property owned must equal the own percentage share of the annual value.");
    A(350, REQ(N(rd.TotalDeduct), N(rd.ThirtyPercentOfBalance)+N(rd.IntOnBorwCap)),
      L+"the total deduction (1i) must equal the 30% deduction (1g) plus the interest on borrowed capital (1h).");
    A(406, p.PropCoOwnedFlg!=="YES" || (p.AsseseeShareProperty!=null && N(p.AsseseeShareProperty)<100),
      L+"when the property is co-owned, the assessee's percentage share must be less than 100%.");
  });

  /* ---------------- Filing status / representative / Form 10-IEA ---------------- */
  A(344, RG(I,"FilingStatus.AsseseeRepFlg","N")!=="Y" ||
        (!!RG(I,"FilingStatus.AssesseeRep.RepName","") && !!RG(I,"FilingStatus.AssesseeRep.RepEmailID","") && N(RG(I,"FilingStatus.AssesseeRep.RepMobileNo"))>0),
    "Name, e-mail ID and contact number of the representative assessee are mandatory when the return is filed by a representative.");
  A(403, RG(I,"FilingStatus.AsseseeRepFlg","N")!=="Y" ||
        (RG(I,"FilingStatus.AssesseeRep.RepEmailID","")!==RG(I,"PersonalInfo.Address.EmailAddress","")
      && RG(I,"FilingStatus.AssesseeRep.RepEmailID","")!==RG(I,"PersonalInfo.Address.EmailAddressSec","")
      && N(RG(I,"FilingStatus.AssesseeRep.RepMobileNo"))!==N(RG(I,"PersonalInfo.Address.MobileNo"))),
    "The e-mail ID and contact number of the representative assessee must not match those of the assessee.");
  A(353, RG(I,"FilingStatus.Form10IEAEarlierAYOldRegime","NA")!=="Y" || !!RG(I,"FilingStatus.Form10IEAAssYear",""),
    "When Form 10-IEA was filed for an earlier AY (old regime), the assessment-year details are mandatory.");
  A(359, RG(I,"FilingStatus.F10IEACurrAYOldRegime","")!=="Yes" || !!RG(I,"FilingStatus.F10IEADateCurrAYOldTax",""),
    "When Form 10-IEA has been furnished for the current AY (old regime), the Form 10-IEA date is mandatory.");
});
