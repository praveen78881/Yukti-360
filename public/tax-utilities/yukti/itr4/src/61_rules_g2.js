/* ITR-4 Category-A validation rules — batch g2 (Phase 6, rules-enforcer).
   ruleset(fn) registers this batch; runRules() (60_rules.js) runs it with the
   A/Dd collectors. A(n,cond,msg) FIRES when cond (the "valid return" assertion)
   is FALSE. Helpers RG/RSUM/REQ/N/R/isNew come from the shell. Schema paths are
   the exact keys the ITR-4 section exporters (70_sec_*.js) write.
   Every assertion below is written so a correct return leaves it TRUE. */
ruleset(function(I,S_,A,Dd){
  var AL   = RG(I,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  var HP   = RG(I,"IncomeDeductions.PropertyDetails",[])||[];
  var TCS  = RG(I,"ScheduleTCS.TCS",[])||[];
  var TDS3 = RG(I,"ScheduleTDS3Dtls.TDS3Details",[])||[];
  var E80E = RG(I,"Schedule80E.Schedule80EDtls",[])||[];
  var E80EEB = RG(I,"Schedule80EEB.Schedule80EEBDtls",[])||[];
  var E80EE = RG(I,"Schedule80EE.Schedule80EEDtls",[])||[];
  var GCV  = RG(I,"ScheduleBP.GoodsDtlsUs44AE",[])||[];

  /* ---- Schedule BP — presumptive 44AD / 44AE ---- */
  var e1cash = N(RG(I,"ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOverInCash",0));
  var e1oth  = N(RG(I,"ScheduleBP.PersumptiveInc44AD.GrsTrnOverAnyOthMode",0));
  var e1bank = N(RG(I,"ScheduleBP.PersumptiveInc44AD.GrsTrnOverBank",0));
  var e1     = N(RG(I,"ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver",0));

  A(6, N(RG(I,"ScheduleBP.PersumptiveInc44AD.PersumptiveInc44AD8Per",0)) >= 0.08*(e1cash+e1oth) - 1,
    "Presumptive income u/s 44AD on non-bank receipts must be at least 8% of gross turnover received other than through banking/electronic modes.");

  A(9, e1 <= 30000000,
    "Gross receipts/income u/s 44AD exceed Rs. 3 crore — ITR-4 cannot be used.");

  A(12, (RG(I,"ScheduleBP.NatOfBus44AD",[])||[]).length===0 || N(RG(I,"ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD",0))>0,
    "A 44AD business code is selected, so income u/s 44AD must be declared.");

  A(135, N(RG(I,"ScheduleBP.PersumptiveInc44AE.TotPersumInc44AE",0))===0 || GCV.length>0,
    "Presumptive income u/s 44AE (E5) is greater than zero but Schedule 44AE (goods carriage details) is not filed.");

  A(138, (RG(I,"ScheduleBP.NatOfBus44AE",[])||[]).length===0
        || N(RG(I,"ScheduleBP.PersumptiveInc44AE.TotalPersumptiveInc",0))>0
        || N(RG(I,"ScheduleBP.PersumptiveInc44AE.TotPersumInc44AE",0))>0,
    "A 44AE business code is selected, so income u/s 44AE must be declared.");

  A(144, GCV.every(function(v){
      var m=N(v.HoldingPeriod), t=N(v.TonnageCapacity);
      var min = m*(t>12?1000*t:7500);
      return N(v.PresumptiveIncome) >= min;
    }),
    "Presumptive income u/s 44AE per vehicle is below Rs.1000 per MT per month (tonnage over 12 MT) or Rs.7500 per month.");

  A(237, e1 <= 20000000 || e1cash <= 0.05*e1,
    "Gross receipts u/s 44AD exceed Rs.2 crore with cash receipts over 5% — a tax audit u/s 44AB applies; use ITR-3/ITR-5.");

  A(240, REQ(e1, e1bank+e1cash+e1oth, 1),
    "Gross receipts u/s 44AD (E1) must equal the sum of E1a + E1b + E1c.");

  /* ---- Salary (IncomeDeductions) ---- */
  var sal17_1 = N(RG(I,"IncomeDeductions.Salary",0));
  var perq    = N(RG(I,"IncomeDeductions.PerquisitesValue",0));

  A(63, REQ(N(RG(I,"IncomeDeductions.GrossSalary",0)), sal17_1 + perq + N(RG(I,"IncomeDeductions.ProfitsInSalary",0)), 1),
    "Gross salary must be the total of salary u/s 17(1), perquisites u/s 17(2) and profits in lieu of salary u/s 17(3).");

  A(66, REQ(N(RG(I,"IncomeDeductions.IncomeFromSal",0)), N(RG(I,"IncomeDeductions.NetSalary",0)) - N(RG(I,"IncomeDeductions.DeductionUs16",0)), 1),
    "Income chargeable under Salaries (B2v) must equal Net salary (B2iii) minus deduction u/s 16 (B2iv).");

  A(69, N(RG(I,"IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10",0)) <= N(RG(I,"IncomeDeductions.GrossSalary",0)) + 1,
    "Total allowances exempt u/s 10 cannot exceed the gross salary (B2(i)(a)+(b)+(c)).");

  A(75, AL.every(function(r){ return r.SalNatureDesc!=="10(10AA)" || N(r.SalOthAmount) <= sal17_1 + 1; }),
    "Sec 10(10AA) earned-leave encashment cannot exceed salary as per section 17(1).");

  A(78, AL.every(function(r){ return r.SalNatureDesc!=="10(10CC)" || N(r.SalOthAmount) <= perq + 1; }),
    "Exempt allowance u/s 10(10CC) cannot exceed the value of perquisites as per section 17(2).");

  /* ---- House property ---- */
  A(57, HP.every(function(p){
      return REQ(N(RG(p,"Rentdetails.ThirtyPercentOfBalance",0)), 0.30*N(RG(p,"Rentdetails.AnnualOfPropOwned",0)), 1);
    }),
    "Standard deduction on house property must equal 30% of the annual value.");

  A(351, HP.every(function(p){
      var pan = RG(I,"PersonalInfo.PAN","");
      return (RG(p,"CoOwners",[])||[]).every(function(o){ return !o.PAN_CoOwner || o.PAN_CoOwner !== pan; });
    }),
    "In a co-owned house property, the assessee's PAN and a co-owner's PAN cannot be the same.");

  /* ---- Other-source family-pension deduction 57(iia) (old regime cap) ---- */
  A(96, N(RG(I,"IncomeDeductions.DeductionUs57iia",0)) <= 15000,
    "Deduction u/s 57(iia) cannot exceed 1/3rd of family pension or Rs.15,000, whichever is lower.");

  /* ---- Chapter VI-A sub-schedule internal consistency / caps ---- */
  A(177, N(RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn",0)) <= 100000,
    "In Schedule 80D, the eligible amount of deduction (Sl. No. 3) is allowed only to the extent of Rs.1,00,000.");

  A(243, REQ(N(RG(I,"Schedule80GGC.TotalDonationsUs80GGC",0)),
             N(RG(I,"Schedule80GGC.TotalDonationAmtCash80GGC",0)) + N(RG(I,"Schedule80GGC.TotalDonationAmtOtherMode80GGC",0)), 1),
    "Total donation u/s 80GGC must equal the sum of donation in cash and donation in other mode.");

  A(276, E80EE.every(function(r){ return N(r.TotalLoanAmt) <= 3500000; }),
    "Deduction u/s 80EE can be claimed only if the loan taken does not exceed Rs.35 lakhs.");

  A(297, REQ(N(RG(I,"Schedule80E.TotalInterest80E",0)), RSUM(E80E,"Interest80E"), 1),
    "In Schedule 80E, the sum of individual rows for interest paid must equal the total of payments.");

  A(300, REQ(N(RG(I,"Schedule80EEB.TotalInterest80EEB",0)), RSUM(E80EEB,"Interest80EEB"), 1),
    "In Schedule 80EEB, the sum of individual rows for interest paid must equal the total of payments.");

  /* ---- Taxes paid / TDS / TCS / IT consistency ---- */
  A(54, REQ(N(RG(I,"TaxComputation.TotTaxPlusIntrstPay",0)),
            N(RG(I,"TaxComputation.NetTaxLiability",0))
            + N(RG(I,"TaxComputation.IntrstPay.IntrstPayUs234A",0))
            + N(RG(I,"TaxComputation.IntrstPay.IntrstPayUs234B",0))
            + N(RG(I,"TaxComputation.IntrstPay.IntrstPayUs234C",0))
            + N(RG(I,"TaxComputation.IntrstPay.LateFilingFee234F",0))
            + N(RG(I,"TaxComputation.IntrstPay.FeeFurnish234I",0)), 2),
    "Total Tax, Fee and Interest must equal Balance Tax After Relief plus interest u/s 234A/234B/234C and fees u/s 234F/234-I.");

  A(111, TCS.every(function(r){ return N(r.AmtTCSClaimedThisYear) <= N(r.TotalTCS) + 1; }),
    "In Schedule TCS, the amount of TCS claimed this year cannot exceed the tax collected.");

  A(120, REQ(N(RG(I,"ScheduleTDS3Dtls.TotalTDS3Details",0)), RSUM(TDS3,"TDSClaimed"), 1),
    "In Schedule TDS3, the total of TDS credit claimed this year must equal the sum of the individual rows.");

  A(126, REQ(N(RG(I,"TaxPaid.TaxesPaid.TDS",0)),
             N(RG(I,"TDSonSalaries.TotalTDSonSalaries",0))
             + N(RG(I,"TDSonOthThanSals.TotalTDSonOthThanSals",0))
             + N(RG(I,"ScheduleTDS3Dtls.TotalTDS3Details",0)), 2)
     && REQ(N(RG(I,"TaxPaid.TaxesPaid.AdvanceTax",0)) + N(RG(I,"TaxPaid.TaxesPaid.SelfAssessmentTax",0)),
            N(RG(I,"ScheduleIT.TotalTaxPayments",0)), 2),
    "TDS/advance/self-assessment tax in the Tax Paid schedule is inconsistent with Schedule TDS1/TDS2/TDS3 and Schedule IT.");

  A(129, REQ(N(RG(I,"TaxPaid.BalTaxPayable",0)),
             Math.round(Math.max(0, N(RG(I,"TaxComputation.TotTaxPlusIntrstPay",0)) - N(RG(I,"TaxPaid.TaxesPaid.TotalTaxesPaid",0)))/10)*10, 1),
    "Amount of tax payable is inconsistent with the difference of Total Tax, Fee and Interest and Total Taxes Paid.");

  A(132, REQ(N(RG(I,"TaxPaid.TaxesPaid.TCS",0)), N(RG(I,"ScheduleTCS.TotalSchTCS",0)), 1),
    "Total TCS claimed in the Tax Paid schedule must equal the total TCS claimed in Schedule TCS.");

  /* ---- New-regime (115BAC) closures ---- */
  A(189, !isNew() || N(RG(I,"Schedule80C.TotalAmt",0))===0,
    "Under the new tax regime, deductions u/s 80C/80CCC/80CCD(1) must be zero.");

  A(195, !isNew() || N(RG(I,"IncomeDeductions.ProfessionalTaxUs16iii",0))===0,
    "Under the new tax regime, professional tax u/s 16(iii) must be zero.");

  A(198, !isNew() || AL.every(function(r){ return r.SalNatureDesc!=="10(5)" || N(r.SalOthAmount)===0; }),
    "Under the new tax regime, Sec 10(5) leave travel concession must be zero.");

  A(201, !isNew() || AL.every(function(r){ return r.SalNatureDesc!=="10(14)(ii)" || N(r.SalOthAmount)===0; }),
    "Under the new tax regime, Sec 10(14)(ii) prescribed allowances must be zero.");

  A(204, !isNew() || N(RG(I,"Schedule80DD.DeductionAmount",0))===0,
    "Under the new tax regime, deduction u/s 80DD must be zero.");

  A(207, !isNew() || HP.every(function(p){
      return RG(p,"ifLetOut","")!=="S" || N(RG(p,"Rentdetails.IntOnBorwCap",0))===0;
    }),
    "Under the new tax regime, interest on borrowed capital for a self-occupied house property must be zero.");

  A(210, !isNew() || N(RG(I,"Schedule80EEB.TotalInterest80EEB",0))===0,
    "Under the new tax regime, deduction u/s 80EEB must be zero.");
});
