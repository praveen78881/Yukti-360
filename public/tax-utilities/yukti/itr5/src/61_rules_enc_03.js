/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, batch enc_03 (Phase 6).
   Slice: rules.json Category-A serials 101-150 (Part A - Trading Account
   serials 101-107, Part A - P&L Account serials 108-150).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "valid" assertion) is FALSE.
   Every read is guarded (RG / (X||{}) / N); nothing throws; a rule is a
   no-op when its data is absent (all leaves default to 0 / empty), so a
   presumptive-only or blank return never fires an accounts arithmetic rule.
   Schema paths: forms/ITR-5/src/70_sec_pl.js (PARTA_PL / TradingAccount /
   ManufacturingAccount), 70_sec_bp.js (CorpScheduleBP), 70_sec_gen.js
   (PartA_GEN1). Helpers RG/N/REQ/RSUM are shell globals (shell/shell.js).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const P  = RG(I,"PARTA_PL",{})||{};                          /* Part A - P&L root */
  const CR = RG(P,"CreditsToPL",{})||{};
  const DA = RG(P,"DebitsToPL.DebitPlAcnt",{})||{};
  const TP = RG(P,"DebitsToPL.TaxProvAppr",{})||{};
  const AD = RG(P,"PersumptiveInc44AD",{})||{};                /* item 62 (44AD) */
  const ADA= RG(P,"PersumptiveInc44ADA",{})||{};               /* item 63 (44ADA) */
  const T  = I.TradingAccount||{};
  const M  = I.ManufacturingAccount||{};
  const g  = (o,p)=>N(RG(o,p));
  const has=(a,k)=>(a||[]).some(r=>r&&String(r[k]==null?"":r[k]).trim()!=="");
  /* recursive negative-leaf finder (only the skip-listed keys may be negative) */
  const negLeaves=function(o,skip,out){out=out||[];if(!o||typeof o!=="object")return out;
    Object.keys(o).forEach(k=>{const v=o[k];
      if(v&&typeof v==="object")negLeaves(v,skip,out);
      else if(typeof v==="number"&&v<0&&skip.indexOf(k)<0)out.push(k);});
    return out;};

  /* =============================================================
     PART A - TRADING ACCOUNT (serials 101-107)
     ============================================================= */
  if(I.TradingAccount){
    const dtp="DutyTaxPay.ExciseCustomsVAT.";
    /* 101 — item 10 total (10xii) = 10i..10xi (duties/taxes on purchases) */
    A(101,REQ(g(T,dtp+"TotExciseCustomsVAT"),
        g(T,dtp+"CustomDuty")+g(T,dtp+"CounterVailDuty")+g(T,dtp+"SplAddDuty")+g(T,dtp+"UnionExciseDuty")+g(T,dtp+"ServiceTax")+g(T,dtp+"VATorSaleTax")+g(T,dtp+"CentralGoodServiceTax")+g(T,dtp+"StateGoodServiceTax")+g(T,dtp+"IntegratedGoodServiceTax")+g(T,dtp+"UnionTerrGoodServiceTax")+g(T,dtp+"OthDutyTaxCess")),
      "Part A-Trading Account: item 10 total (10xii) must equal the sum of 10i to 10xi.");
    /* 102 — item 12 = 6 - 7 - 8 - 9 - 10xii - 11 */
    A(102,REQ(g(T,"GrossProfitFrmBusProf"),
        g(T,"TardingAccTotCred")-g(T,"OpngStckOfFinishedStcks")-g(T,"Purchases")-g(T,"DirectExpenses")-g(T,dtp+"TotExciseCustomsVAT")-g(T,"GoodsCostPrdcdFrmMA")),
      "Part A-Trading Account: item 12 (gross profit) must equal 6 - 7 - 8 - 9 - 10xii - 11.");
    /* 103 — negative values allowed only at item 11 and/or 12 (11, 12, 12b, 12d) */
    A(103,negLeaves(T,["GoodsCostPrdcdFrmMA","GrossProfitFrmBusProf","IntradayTradingIncome","IncomeFutureTrd"]).length===0,
      "Part A-Trading Account: a negative amount is allowed only at item 11 and/or item 12.");
    /* 104 — item 11 (cost from Mfg) = item 3 of Manufacturing Account.
       No presence guard: an import that declares item 11 (cost of goods produced
       transferred from the Manufacturing Account) while OMITTING the Manufacturing
       Account must fail. M defaults to {} so g(M,..) is 0 when it is absent, and a
       lawful return that has both keeps item 11 == item 3 and stays silent. */
    A(104,REQ(g(T,"GoodsCostPrdcdFrmMA"),g(M,"CostOfGoodsPrdcd")),
      "Part A-Trading Account: item 11 must equal item 3 (cost of goods produced) of the Manufacturing Account.");
    /* 105 — item 6 (total credits) = 4D + 5 */
    A(105,REQ(g(T,"TardingAccTotCred"),g(T,"TotRevenueFrmOperations")+g(T,"ClsngStckOfFinishedStcks")),
      "Part A-Trading Account: item 6 (total credits) must equal 4D + 5.");
    /* 106 — 12b (intraday income) cannot exceed 12a (intraday turnover) */
    A(106,g(T,"IntradayTradingIncome")<=g(T,"IntradayTradingTurnOver")+1,
      "Part A-Trading Account: income from intraday trading (12b) cannot exceed the intraday turnover (12a).");
    /* 107 — 12d (F&O income) cannot exceed 12c (F&O turnover) */
    A(107,g(T,"IncomeFutureTrd")<=g(T,"TurnoverFutureTrd")+1,
      "Part A-Trading Account: income from Futures & Options (12d) cannot exceed the F&O turnover (12c).");
  }

  /* =============================================================
     PART A - P&L ACCOUNT (serials 108-150)
     ============================================================= */
  /* 108 — item 13 = Trading 12 + 12b + 12d.
       No presence guard: an import that declares P&L item 13 (gross profit
       transferred from the Trading Account) while OMITTING the Trading Account must
       fail. T defaults to {} so the Trading sum is 0 when it is absent; a lawful
       return with both keeps item 13 == 12 + 12b + 12d and stays silent. */
  A(108,REQ(g(CR,"GrossProfitTrnsfFrmTrdAcc"),g(T,"GrossProfitFrmBusProf")+g(T,"IntradayTradingIncome")+g(T,"IncomeFutureTrd")),
    "Part A-P&L: item 13 (gross profit transferred) must equal item 12 + 12b + 12d of the Trading Account.");
  /* 109 — 14xi (misc other income) = its detail (array + liabilities written back + interest from firm) */
  A(109,REQ(g(CR,"OthIncome.MiscOthIncome"),RSUM(RG(CR,"OthIncome.OtherIncDtls",[]),"Amount")+g(CR,"OthIncome.LiabilityWrittenBack")+g(CR,"OthIncome.AmtofInterest")),
    "Part A-P&L: item 14xi (other income - miscellaneous) must equal the sum of its detail table, liabilities written back and interest from the firm.");
  /* 110 — 14xii (total other income) = 14i..14x + 14xi */
  A(110,REQ(g(CR,"OthIncome.TotOthIncome"),
      g(CR,"OthIncome.RentInc")+g(CR,"OthIncome.Comissions")+g(CR,"OthIncome.Dividends")+g(CR,"OthIncome.InterestInc")+g(CR,"OthIncome.ProfitOnSaleFixedAsset")+g(CR,"OthIncome.ProfitOnInvChrSTT")+g(CR,"OthIncome.ProfitOnOthInv")+g(CR,"OthIncome.ProfitOnCurrFluct")+g(CR,"OthIncome.ProfitOnCnvInvntryToCapAsst")+g(CR,"OthIncome.ProfitOnAgriIncome")+g(CR,"OthIncome.MiscOthIncome")),
    "Part A-P&L: item 14xii (total other income) must equal the sum of 14i to 14x plus 14xi.");
  /* 111 — item 15 (total credits) = 13 + 14xii */
  A(111,REQ(g(CR,"TotCreditsToPL"),g(CR,"GrossProfitTrnsfFrmTrdAcc")+g(CR,"OthIncome.TotOthIncome")),
    "Part A-P&L: item 15 (total credits to P&L) must equal item 13 + 14xii.");
  /* 112 — 22xii(a) 'Yes' -> 22xii(b) (amount paid to non-residents) cannot be zero/blank */
  A(112,RG(DA,"EmployeeComp.AnyCompPaidToNonRes")!=="Yes"||N(RG(DA,"EmployeeComp.AmtPaidToNonRes"))>0,
    "Part A-P&L: if item 22xii(a) is 'Yes' then item 22xii(b) (compensation paid to non-residents) cannot be zero or blank.");
  /* 113 — 22xi (total employee compensation) = 22i..22x */
  A(113,REQ(g(DA,"EmployeeComp.TotEmployeeComp"),
      g(DA,"EmployeeComp.SalsWages")+g(DA,"EmployeeComp.Bonus")+g(DA,"EmployeeComp.MedExpReimb")+g(DA,"EmployeeComp.LeaveEncash")+g(DA,"EmployeeComp.LeaveTravelBenft")+g(DA,"EmployeeComp.ContToSuperAnnFund")+g(DA,"EmployeeComp.ContToPF")+g(DA,"EmployeeComp.ContToGratFund")+g(DA,"EmployeeComp.ContToOthFund")+g(DA,"EmployeeComp.OthEmpBenftExpdr")),
    "Part A-P&L: item 22xi (total employee compensation) must equal the sum of 22i to 22x.");
  /* 114 — 23v (total insurance) = 23i..23iv */
  A(114,REQ(g(DA,"Insurances.TotInsurances"),g(DA,"Insurances.MedInsur")+g(DA,"Insurances.LifeInsur")+g(DA,"Insurances.KeyManInsur")+g(DA,"Insurances.OthInsur")),
    "Part A-P&L: item 23v (total insurance) must equal the sum of 23i to 23iv.");
  /* 115 — 30iii (commission total) = 30i + 30ii */
  A(115,REQ(g(DA,"CommissionExpdrDtls.Total"),g(DA,"CommissionExpdrDtls.NonResOtherCompany")+g(DA,"CommissionExpdrDtls.Others")),
    "Part A-P&L: item 30iii (commission total) must equal 30i + 30ii.");
  /* 116 — 31iii (royalty total) = 31i + 31ii */
  A(116,REQ(g(DA,"RoyalityDtls.Total"),g(DA,"RoyalityDtls.NonResOtherCompany")+g(DA,"RoyalityDtls.Others")),
    "Part A-P&L: item 31iii (royalty total) must equal 31i + 31ii.");
  /* 117 — 32iii (professional/consultancy total) = 32i + 32ii */
  A(117,REQ(g(DA,"ProfessionalConstDtls.Total"),g(DA,"ProfessionalConstDtls.NonResOtherCompany")+g(DA,"ProfessionalConstDtls.Others")),
    "Part A-P&L: item 32iii (professional/consultancy fees total) must equal 32i + 32ii.");
  /* 118 — 44x (total rates and taxes) = 44i..44ix */
  {const rt="RatesTaxesPays.ExciseCustomsVAT.";
   A(118,REQ(g(DA,rt+"TotExciseCustomsVAT"),
       g(DA,rt+"UnionExciseDuty")+g(DA,rt+"ServiceTax")+g(DA,rt+"VATorSaleTax")+g(DA,rt+"Cess")+g(DA,rt+"CentralGoodServiceTax")+g(DA,rt+"StateGoodServiceTax")+g(DA,rt+"IntegratedGoodServiceTax")+g(DA,rt+"UnionTerrGoodServiceTax")+g(DA,rt+"OthDutyTaxCess")),
     "Part A-P&L: item 44x (total rates and taxes) must equal the sum of 44i to 44ix.");}
  /* 119 — item 47 (other expenses) = sum of the 47 detail table */
  A(119,REQ(g(DA,"OtherExpenses"),RSUM(RG(DA,"OtherExpensesDtls",[]),"Amount")),
    "Part A-P&L: item 47 (other expenses) must equal the sum of the other-expenses detail table.");
  /* 120 — 48iv (total bad debt) = 48i + 48ii + 48iii */
  A(120,REQ(g(DA,"BadDebtDtls.BadDebt"),g(DA,"BadDebtDtls.BadDebtAmtDtlsTotal")+g(DA,"BadDebtDtls.OthersPANNotAvlblDtlTotal")+g(DA,"BadDebtDtls.OthersAmtLt1Lakh")),
    "Part A-P&L: item 48iv (total bad debt) must equal 48i + 48ii + 48iii.");
  /* 121 — item 51 (PBIDTA) = 15 - (16..21 + 22xi + 23v + 24..29 + 30iii + 31iii + 32iii + 33..43 + 44x + 45 + 46 + 47 + 48iv + 49 + 50) */
  {const dh = g(DA,"Freight")+g(DA,"ConsumptionOfStores")+g(DA,"PowerFuel")+g(DA,"RentExpdr")+g(DA,"RepairsBldg")+g(DA,"RepairMach")
      +g(DA,"EmployeeComp.TotEmployeeComp")+g(DA,"Insurances.TotInsurances")
      +g(DA,"StaffWelfareExp")+g(DA,"Entertainment")+g(DA,"Hospitality")+g(DA,"Conference")+g(DA,"SalePromoExp")+g(DA,"Advertisement")
      +g(DA,"CommissionExpdrDtls.Total")+g(DA,"RoyalityDtls.Total")+g(DA,"ProfessionalConstDtls.Total")
      +g(DA,"HotelBoardLodge")+g(DA,"TravelExp")+g(DA,"ForeignTravelExp")+g(DA,"ConveyanceExp")+g(DA,"TelephoneExp")+g(DA,"GuestHouseExp")+g(DA,"ClubExp")+g(DA,"FestivalCelebExp")+g(DA,"Scholarship")+g(DA,"Gift")+g(DA,"Donation")
      +g(DA,"RatesTaxesPays.ExciseCustomsVAT.TotExciseCustomsVAT")+g(DA,"AuditFee")+g(DA,"SalRemuneration")+g(DA,"OtherExpenses")+g(DA,"BadDebtDtls.BadDebt")+g(DA,"ProvForBadDoubtDebt")+g(DA,"OthProvisionsExpdr");
   A(121,REQ(g(DA,"PBIDTA"),g(CR,"TotCreditsToPL")-dh),
     "Part A-P&L: item 51 (profit before interest, depreciation and taxes) must equal item 15 less the total of the debit heads (16 to 50).");}
  /* 122 — 52iii (total interest) = 52ia + 52ib + 52iia + 52iib */
  A(122,REQ(g(DA,"InterestExpdrtDtls.InterestExpdr"),g(DA,"InterestExpdrtDtls.NonResOtherCompany")+g(DA,"InterestExpdrtDtls.Others")+g(DA,"InterestExpdrtDtls.ResPartners")+g(DA,"InterestExpdrtDtls.ResOthers")),
    "Part A-P&L: item 52iii (total interest) must equal 52ia + 52ib + 52iia + 52iib.");
  /* 123 — item 54 (net profit before taxes) = 51 - 52iii - 53 */
  A(123,REQ(g(DA,"PBT"),g(DA,"PBIDTA")-g(DA,"InterestExpdrtDtls.InterestExpdr")-g(DA,"DepreciationAmort")),
    "Part A-P&L: item 54 (net profit before taxes) must equal item 51 - 52iii - 53.");
  /* 124 — item 46 (salary/remuneration to partners) can be claimed only by a Firm */
  {const ST=String(RG(I,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType","")||"");
   A(124,g(DA,"SalRemuneration")<=0||(ST!=="2"&&ST!=="9"&&ST!=="14"),
     "Part A-P&L: salary/remuneration to partners of the firm (item 46) can be claimed only by a Firm.");}
  /* 125 — item 57 (profit after tax) = 54 - 55 - 56 */
  A(125,REQ(g(TP,"ProfitAfterTax"),g(DA,"PBT")-g(TP,"ProvForCurrTax")-g(TP,"ProvDefTax")),
    "Part A-P&L: item 57 (profit after tax) must equal item 54 - 55 - 56.");
  /* 126 — item 59 (amount available for appropriation) = 57 + 58 */
  A(126,REQ(g(TP,"AmtAvlAppr"),g(TP,"ProfitAfterTax")+g(TP,"BalBFPrevYr")),
    "Part A-P&L: item 59 (amount available for appropriation) must equal item 57 + 58.");
  /* 127 — item 61 (balance carried to balance sheet) = 59 - 60 */
  A(127,REQ(g(TP,"PartnerAccBalTrf"),g(TP,"AmtAvlAppr")-g(TP,"Appropriations.TrfToReserves")),
    "Part A-P&L: item 61 (balance carried to the partners' account) must equal item 59 - 60.");
  /* 128 — 62i (gross turnover/receipts 44AD) = 62ia + 62ib + 62ic */
  A(128,REQ(g(AD,"GrsTrnOverOrReceipt"),g(AD,"GrsTrnOverBank")+g(AD,"GrsTotalTrnOverInCash")+g(AD,"GrsTrnOverAnyOthMode")),
    "Part A-P&L: item 62i (gross turnover or receipts u/s 44AD) must equal 62ia + 62ib + 62ic.");
  /* 129 — 62ii (presumptive income 44AD) = 62iia + 62iib */
  A(129,REQ(g(AD,"TotPersumptiveInc44AD"),g(AD,"PersumptiveInc44AD6Per")+g(AD,"PersumptiveInc44AD8Per")),
    "Part A-P&L: item 62ii (presumptive income u/s 44AD) must equal 62iia + 62iib.");
  /* 130 — 62iia cannot be less than 6% of 62ia */
  A(130,g(AD,"PersumptiveInc44AD6Per")>=Math.floor(0.06*g(AD,"GrsTrnOverBank"))-1,
    "Part A-P&L: item 62iia (presumptive income u/s 44AD) cannot be less than 6% of 62ia.");
  /* 131 — 62iib cannot be less than 8% of (62ib + 62ic) */
  A(131,g(AD,"PersumptiveInc44AD8Per")>=Math.floor(0.08*(g(AD,"GrsTotalTrnOverInCash")+g(AD,"GrsTrnOverAnyOthMode")))-1,
    "Part A-P&L: item 62iib (presumptive income u/s 44AD) cannot be less than 8% of (62ib + 62ic).");
  /* 132 — 62iib cannot exceed the gross receipts at 62ib + 62ic */
  A(132,g(AD,"PersumptiveInc44AD8Per")<=g(AD,"GrsTotalTrnOverInCash")+g(AD,"GrsTrnOverAnyOthMode")+1,
    "Part A-P&L: income claimed u/s 44AD at 62iib cannot be more than the gross receipts at 62ib + 62ic.");
  /* 133 — 62iia cannot exceed the gross receipts at 62ia */
  A(133,g(AD,"PersumptiveInc44AD6Per")<=g(AD,"GrsTrnOverBank")+1,
    "Part A-P&L: income claimed u/s 44AD at 62iia cannot be more than the gross receipts at 62ia.");
  /* 134 — 63ii (44ADA) cannot be less than 50% of 63i */
  A(134,g(ADA,"TotPersumptiveInc44ADA")>=Math.floor(0.5*g(ADA,"GrsReceipt"))-1,
    "Part A-P&L: item 63ii (presumptive income u/s 44ADA) cannot be less than 50% of 63i.");
  /* 135 — a 44AD business code (item 62) is required when income at 62i and/or 62ii is declared */
  A(135,!(g(AD,"GrsTrnOverOrReceipt")>0||g(AD,"TotPersumptiveInc44AD")>0)||has(RG(P,"NatOfBus44AD",[]),"CodeAD"),
    "Part A-P&L: a business code u/s 44AD must be selected at item 62 when income is declared at 62i and/or 62ii.");
  /* 136 — name of business is required when income at 62i and/or 62ii is declared */
  A(136,!(g(AD,"GrsTrnOverOrReceipt")>0||g(AD,"TotPersumptiveInc44AD")>0)||has(RG(P,"NatOfBus44AD",[]),"NameOfBusiness"),
    "Part A-P&L: the name of business must be filled when income u/s 44AD is declared at 62i and/or 62ii.");
  /* 137 — a 44ADA business code (item 63) is required when income at 63i and/or 63ii is declared */
  A(137,!(g(ADA,"GrsReceipt")>0||g(ADA,"TotPersumptiveInc44ADA")>0)||has(RG(P,"NatOfBus44ADA",[]),"CodeADA"),
    "Part A-P&L: a business code u/s 44ADA must be selected at item 63 when income is declared at 63i and/or 63ii.");
  /* 138 — name of profession is required when income at 63i and/or 63ii is declared */
  A(138,!(g(ADA,"GrsReceipt")>0||g(ADA,"TotPersumptiveInc44ADA")>0)||has(RG(P,"NatOfBus44ADA",[]),"NameOfBusiness"),
    "Part A-P&L: the name of profession must be filled when income u/s 44ADA is declared at 63i and/or 63ii.");
  /* 139 — a 44AE business code (item 64) is required when 44AE income is declared */
  A(139,!(g(P,"TotalPrsumptvIncUs44E")>0||g(P,"TotalPrsumptvIncGCUs44E")>0)||has(RG(P,"NatOfBus44AE",[]),"CodeAE"),
    "Part A-P&L: a business code u/s 44AE must be selected at item 64 when presumptive income u/s 44AE is declared.");
  /* 140 — name of business is required when 64ii is greater than zero */
  A(140,!(g(P,"TotalPrsumptvIncGCUs44E")>0)||has(RG(P,"NatOfBus44AE",[]),"NameOfBusiness"),
    "Part A-P&L: the name of business must be filled when the presumptive income u/s 44AE (64ii) is greater than zero.");
  /* 141 — 44ADA: presumptive income (63ii) cannot exceed the gross receipts (63i).
     Rule text reads "63i cannot be more than 63ii"; a lawful return always has
     63i >= 63ii (income is a fraction of receipts, cf. serial 134's 50% floor),
     so the literal reading fires on every lawful 44ADA return. Encoded as the
     lawful reading (63ii <= 63i), mirroring serials 132/133 for 44AD.
     /* not mappable as literally worded: literal 63i<=63ii contradicts serial 134 and fires on lawful data */
  A(141,g(ADA,"TotPersumptiveInc44ADA")<=g(ADA,"GrsReceipt")+1,
    "Part A-P&L: presumptive income u/s 44ADA (63ii) cannot be more than the gross receipts (63i).");
  /* 142/143/144 — Schedule BP A35(i)/(ii)/(iii) must equal item 62ii / 63ii / 64iv
     of Part A-P&L. No presence guard: an import that omits EITHER side of the
     cross-check (the deemed-profit rows in Schedule BP, or the Part A-P&L
     presumptive figures they must mirror) must fail. RG defaults an absent BP block
     to 0 and PARTA_PL is already defaulted to {} (AD/ADA/P read via g), so both
     sides are 0 when their schedule is absent; a lawful return that carries both
     keeps A35 == the P&L figure and stays silent. */
  A(142,REQ(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AD"),g(AD,"TotPersumptiveInc44AD")),
    "Schedule BP: item A35(i) (44AD) must equal item 62ii of Part A-P&L.");
  /* 143 — Schedule BP A35(ii) = 63ii of Part A-P&L */
  A(143,REQ(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44ADA"),g(ADA,"TotPersumptiveInc44ADA")),
    "Schedule BP: item A35(ii) (44ADA) must equal item 63ii of Part A-P&L.");
  /* 144 — Schedule BP A35(iii) = 64iv of Part A-P&L */
  A(144,REQ(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AE"),g(P,"TotalPrsumptvIncUs44E")),
    "Schedule BP: item A35(iii) (44AE) must equal item 64iv of Part A-P&L.");
  /* 145 — if 64ii > 0 then the 64i goods-carriage table must be filled */
  A(145,!(g(P,"TotalPrsumptvIncGCUs44E")>0)||RG(P,"GoodsDtlsUs44AE",[]).length>0,
    "Part A-P&L: when the total presumptive income from goods carriage u/s 44AE (64ii) is greater than zero, the 64i goods-carriage table must be filled.");
  /* 146 — 64ii = total of column (5) of the 64i table (per-carriage presumptive income) */
  A(146,REQ(g(P,"TotalPrsumptvIncGCUs44E"),RSUM(RG(P,"GoodsDtlsUs44AE",[]),"PresumptiveIncome")),
    "Part A-P&L: item 64ii (total presumptive income from goods carriage u/s 44AE) must equal the total of column (5) of the 64i table.");
  /* 147 — total of column 4 (months) in the 64i table shall not exceed 120 */
  {const goods=RG(P,"GoodsDtlsUs44AE",[])||[];
   if(goods.length)A(147,RSUM(goods,"HoldingPeriod")<=120,
     "Part A-P&L: in the 64i table (44AE), the total number of months (column 4) cannot exceed 120.");}
  /* 148 — 64iv = 64ii - 64iii (nil if negative) */
  A(148,REQ(g(P,"TotalPrsumptvIncUs44E"),Math.max(0,g(P,"TotalPrsumptvIncGCUs44E")-g(P,"SalRemrtnToPartnerFirm"))),
    "Part A-P&L: item 64iv (total presumptive income u/s 44AE) must equal 64ii - 64iii.");
  /* 149 — tonnage capacity of a goods carriage shall not exceed 100 MT */
  (RG(P,"GoodsDtlsUs44AE",[])||[]).forEach(function(r,i){if(!r)return;
    A(149,N(r.TonnageCapacity)<=100,"Part A-P&L: goods carriage "+(i+1)+" (44AE table 64i): tonnage capacity cannot exceed 100 MT.");});
  /* 150 — 44AE income must be at least Rs.7,500 per month where tonnage <= 12 MT */
  (RG(P,"GoodsDtlsUs44AE",[])||[]).forEach(function(r,i){if(!r)return;
    if(N(r.TonnageCapacity)>0&&N(r.TonnageCapacity)<=12)
      A(150,N(r.PresumptiveIncome)>=7500*N(r.HoldingPeriod)-1,
        "Part A-P&L: goods carriage "+(i+1)+" (44AE): presumptive income must be at least Rs.7,500 per month where the tonnage capacity is 12 MT or less.");});
});
