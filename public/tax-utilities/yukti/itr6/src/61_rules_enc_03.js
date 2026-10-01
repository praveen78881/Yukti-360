/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_03 (Phase 6).
   Serial range A107–A156 (Part A — Statement of Profit & Loss, regular
   PARTA_PL, and Ind-AS PARTA_PLIndAS). Registered via ruleset(fn);
   runRules() invokes it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a
   Category-A block) when cond — the "this return is lawful" assertion —
   is FALSE. Every read is guarded (RG / (X||{}) / N()); nothing throws.
   Keys are the built-return ITR6 schema paths (I = the ITR6 root); the
   paths were taken from sources/ITR-6 schema (verified leaf-by-leaf) and
   the built section 70_sec_accounts.js engPL()/engTrd() compute chain, so
   an engine-computed (lawful) return foots every arithmetic REQ to 0==0
   and stays silent. Encoded from each rule's own text (constitution rule 6).

   Coverage (all 50 in range are ENF; none NA/OFFLINE):
     A107–A115  regular P&L totals (44x, 46, bad debts, 50/51iii/53/56/58/60)
     A116–A138  regular P&L presumptive 44AE (item 61) & no-account 44B..
                10TIA (item 62), bad-debt identity
     A139       Ind-AS Sl.13 gross profit transferred from trading account
     A140–A156  Ind-AS P&L totals (14xi/14/15, 22..32, 44/46/47, 50/51/53/56/58)

   NOTE on A115: the census flagged Sl.60 "Balance carried to balance
   sheet" as possibly having no dedicated leaf. It DOES exist — the schema
   leaf PARTA_PL.DebitsToPL.TaxProvAppr.PartnerAccBalTrf (engPL computes it
   as AmtAvlAppr − TotAppropriations). Encoded, not re-filed OFFLINE.
   NOTE on A135: the CBDT text reads "62A gross receipts ... equal to sum
   of net profit" — a copy-paste slip (62A is gross receipts); encoded as
   62A == Σ gross receipts of all sections, parallel to A133 (62b == Σ NP).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const SUM=(arr,k)=>(arr||[]).reduce((a,r)=>a+N(r&&r[k]),0);

  /* Debit heads 16..49 of the P&L for a given block prefix P (regular or
     Ind-AS). Reads the same total leaves engPL() writes, so Sl.50 (PBIDTA)
     = Sl.15 − DEB(P) exactly on any engine-built return. */
  function DEB(P){
    const d=P+".DebitsToPL.DebitPlAcnt.";
    const g=k=>N(RG(I,d+k));
    return g("Freight")+g("ConsumptionOfStores")+g("PowerFuel")+g("RentExpdr")+g("RepairsBldg")+g("RepairMach")
      +g("EmployeeComp.TotEmployeeComp")+g("Insurances.TotInsurances")
      +g("StaffWelfareExp")+g("Entertainment")+g("Hospitality")+g("Conference")+g("SalePromoExp")+g("Advertisement")
      +g("CommissionExpdrDtls.Total")+g("RoyalityDtls.Total")+g("ProfessionalConstDtls.Total")
      +g("HotelBoardLodge")+g("TravelExp")+g("ForeignTravelExp")+g("ConveyanceExp")+g("TelephoneExp")
      +g("GuestHouseExp")+g("ClubExp")+g("FestivalCelebExp")+g("Scholarship")+g("Gift")+g("Donation")
      +g("RatesTaxesPays.ExciseCustomsVAT.TotExciseCustomsVAT")+g("AuditFee")+g("OtherExpenses")
      +g("BadDebtDtls.BadDebt")+g("ProvForBadDoubtDebt")+g("OthProvisionsExpdr");
  }

  /* =====================================================================
     Part A — Statement of Profit & Loss (regular, PARTA_PL). A107–A138.
     ===================================================================== */
  const PL=RG(I,"PARTA_PL",{})||{};
  const D=RG(PL,"DebitsToPL.DebitPlAcnt",{})||{};
  const RT=RG(D,"RatesTaxesPays.ExciseCustomsVAT",{})||{};
  const IE=RG(D,"InterestExpdrtDtls",{})||{};
  const BD=RG(D,"BadDebtDtls",{})||{};
  const TP=RG(PL,"DebitsToPL.TaxProvAppr",{})||{};
  const AP=RG(TP,"Appropriations",{})||{};

  /* A107 — 44x Total rates and taxes = Σ 44(i..ix). */
  A(107, REQ(RT.TotExciseCustomsVAT, N(RT.UnionExciseDuty)+N(RT.ServiceTax)+N(RT.VATorSaleTax)+N(RT.Cess)
      +N(RT.CentralGoodServiceTax)+N(RT.StateGoodServiceTax)+N(RT.IntegratedGoodServiceTax)+N(RT.UnionTerrGoodServiceTax)+N(RT.OthDutyTaxCess)),
    "Part A-P&L: Sl.44x 'Total rates and taxes paid or payable' must equal the sum of Sl.44(i to ix).");

  /* A108 — 46 Other expenses total = Σ individual rows. */
  A(108, REQ(D.OtherExpenses, SUM(RG(D,"OtherExpensesDtls",[]),"Amount")),
    "Part A-P&L: Sl.46 total other expenses must equal the sum of the individual other-expense figures.");

  /* A109 — bad debts breakup (47i+47ii+47iii) consistent with total 47iv. */
  A(109, REQ(BD.BadDebt, N(BD.BadDebtAmtDtlsTotal)+N(BD.OthersPANNotAvlblDtlTotal)+N(BD.OthersAmtLt1Lakh)),
    "Part A-P&L: the breakup of bad debts (47i + 47ii + 47iii) must be consistent with the total (47iv).");

  /* A110 — 50 PBIDTA = 15 − Σ(debit heads 16..49). */
  A(110, REQ(N(RG(D,"PBIDTA")), N(RG(PL,"CreditsToPL.TotCreditsToPL")) - DEB("PARTA_PL")),
    "Part A-P&L: Sl.50 profit before interest, depreciation and taxes must equal Sl.15 minus the debit heads (16 to 49).");

  /* A111 — 51iii interest = 51i + 51ii. */
  A(111, REQ(IE.InterestExpdr, N(IE.NonResOtherCompany)+N(IE.Others)),
    "Part A-P&L: Sl.51iii interest must equal Sl.51i + 51ii.");

  /* A112 — 53 Net profit before taxes = 50 − 51iii − 52. */
  A(112, REQ(N(RG(D,"PBT")), N(RG(D,"PBIDTA")) - N(IE.InterestExpdr) - N(RG(D,"DepreciationAmort"))),
    "Part A-P&L: Sl.53 net profit before taxes must equal Sl.50 − 51iii − 52.");

  /* A113 — 56 Profit after tax = 53 − 54 − 55. */
  A(113, REQ(TP.ProfitAfterTax, N(RG(D,"PBT")) - N(TP.ProvForCurrTax) - N(TP.ProvDefTax)),
    "Part A-P&L: Sl.56 profit after tax must equal Sl.53 − 54 − 55.");

  /* A114 — 58 Amount available for appropriation = 56 + 57. */
  A(114, REQ(TP.AmtAvlAppr, N(TP.ProfitAfterTax)+N(TP.BalBFPrevYr)),
    "Part A-P&L: Sl.58 amount available for appropriation must equal Sl.56 + 57.");

  /* A115 — 60 Balance carried to balance sheet = 58 − 59. */
  A(115, REQ(TP.PartnerAccBalTrf, N(TP.AmtAvlAppr) - N(AP.TotAppropriations)),
    "Part A-P&L: Sl.60 balance carried to balance sheet must equal Sl.58 − 59.");

  /* ---- Part B / no-account case: 44AE (item 61) and 44B..10TIA (item 62) ---- */
  const NB44=RG(PL,"NatOfBus44AE",[])||[];
  const GD44=RG(PL,"GoodsDtlsUs44AE",[])||[];
  const NBK=RG(PL,"NoBooksOfAccPL",{})||{};
  const NBKD=RG(PL,"NoBooksOfAccPLDetails",[])||[];
  const has44eBiz=NB44.some(r=>r&&(S0(r.CodeAE)||S0(r.NameOfBusiness)||S0(r.Description)));
  const has44eInc=N(RG(PL,"TotalPrsumptvIncUs44E"))>0 || N(RG(PL,"TotalPrsumptvIncUs44EGoods"))>0
      || GD44.some(r=>r&&N(r.PresumptiveIncome)>0);

  /* A116 — a business code u/s 44AE selected ⇒ income u/s 44AE must be declared. */
  A(116, !has44eBiz || has44eInc,
    "Part A-P&L: when a business code u/s 44AE is selected it is mandatory to declare income u/s 44AE.");

  /* A117 — 61(ii) total presumptive income from goods carriage = total of column (5). */
  A(117, REQ(N(RG(PL,"TotalPrsumptvIncUs44EGoods")), SUM(GD44,"PresumptiveIncome")),
    "Part A-P&L: Sl.61(ii) total presumptive income from goods carriage u/s 44AE must equal the total of column (5).");

  /* A118 — 61(i) total of column 4 (months owned/leased/hired) shall not exceed 120. */
  A(118, Math.max(N(RG(PL,"TotalNumOfMonths")), SUM(GD44,"HoldingPeriod")) <= 120,
    "Part A-P&L: Sl.61(i) 44AE — the total of column 4 (number of months the goods carriage was owned/leased/hired) cannot exceed 120.");

  /* A119 — tonnage capacity cannot exceed 100 MT in Sl.61. */
  A(119, GD44.every(r=>!r || N(r.TonnageCapacity) <= 100),
    "Part A-P&L: Sl.61 44AE — the tonnage capacity of a goods carriage cannot exceed 100 MT.");

  /* A120 — 44AE presumptive income per carriage ≥ statutory floor (higher of amount
     entered or, for tonnage > 12 MT, tonnage × 1000 × months; else ₹7500 × months). */
  A(120, GD44.every(function(r){ if(!r) return true;
      const m=N(r.HoldingPeriod), t=N(r.TonnageCapacity);
      const floor=(t>12 ? t*1000 : 7500)*m;
      return N(r.PresumptiveIncome) >= floor-1; }),
    "Part A-P&L: Sl.61 44AE — presumptive income per goods carriage cannot be less than ₹1000 per ton per month (tonnage above 12 MT) or ₹7500 per month otherwise.");

  /* A121 — income declared u/s 44AE ⇒ a business code u/s 44AE must be selected. */
  A(121, !has44eInc || has44eBiz,
    "Part A-P&L: when income is declared u/s 44AE it is mandatory to select a business code u/s 44AE.");

  /* A122 — 59vi Total of appropriation = Σ break-up of appropriation. */
  A(122, REQ(AP.TotAppropriations, N(AP.TrfToReserves)+N(AP.ProposedDividend)+N(AP.TaxOnDividend)+N(AP.AppropriationsCSR)+N(AP.AnyOtherAppr)),
    "Part A-P&L: Sl.59vi total of appropriation must equal the sum of the break-up of appropriation.");

  /* A123 — 61(ii) > 0 ⇒ the goods-carriage table at Sl.61 must be filled. */
  A(123, N(RG(PL,"TotalPrsumptvIncUs44EGoods")) <= 0 || GD44.some(r=>r&&(N(r.PresumptiveIncome)||S0(r.RegNumberGoodsCarriage))),
    "Part A-P&L: when Sl.61(ii) is greater than zero the details in the table at Sl.61 must be filled.");

  /* A124 — presumptive activity indicated but Part-B of the P&L (no-account case) not filled. */
  const hasPresmOpt=has44eBiz || NBKD.some(r=>r&&S0(r.Section));
  const partBFilled=has44eInc || N(NBK.NetProfit)>0 || N(NBK.GrossReceipt)>0;
  A(124, !hasPresmOpt || partBFilled,
    "Part A-P&L: presumptive income is indicated but Part-B of the Profit & Loss account (no-account case) has not been filled.");

  /* A125–A131, A136 — per-section minimum net profit as a % of gross receipts. */
  function min62(sec,pct){ return NBKD.every(function(r){ if(!r||r.Section!==sec) return true;
      return N(r.NetProfit) >= pct*N(r.GrossReceipt) - 1; }); }
  A(125, min62("44B",0.075),  "Part A-P&L: u/s 44B, Sl.62b net profit cannot be less than 7.5% of gross receipts/turnover.");
  A(126, min62("44BB",0.10),  "Part A-P&L: u/s 44BB, Sl.62b net profit cannot be less than 10% of gross receipts/turnover.");
  A(127, min62("44BBA",0.05), "Part A-P&L: u/s 44BBA, Sl.62b net profit cannot be less than 5% of gross receipts/turnover.");
  A(128, min62("44BBB",0.10), "Part A-P&L: u/s 44BBB, Sl.62b net profit cannot be less than 10% of gross receipts/turnover.");
  A(129, min62("44D",0.80),   "Part A-P&L: u/s 44D, Sl.62b net profit cannot be less than 80% of gross receipts/turnover.");
  A(130, min62("44BBC",0.20), "Part A-P&L: u/s 44BBC, Sl.62b net profit cannot be less than 20% of gross receipts/turnover.");
  A(131, min62("10TIA",0.04), "Part A-P&L: under Rule 10TIA, Sl.62b net profit cannot be less than 4% of gross receipts/turnover.");
  A(136, min62("44BBD",0.25), "Part A-P&L: u/s 44BBD, Sl.62b net profit cannot be less than 25% of gross receipts/turnover.");

  /* A132 — for 44AE the same registration number cannot be entered more than once. */
  const regs=GD44.map(r=>r&&S0(r.RegNumberGoodsCarriage)?String(r.RegNumberGoodsCarriage).trim().toUpperCase():null).filter(x=>x);
  A(132, (new Set(regs)).size===regs.length,
    "Part A-P&L: for 44AE the same registration number of a goods carriage cannot be entered more than once.");

  /* A133 — 62b Net profit = Σ net profit of all sections. */
  A(133, REQ(NBK.NetProfit, SUM(NBKD,"NetProfit")),
    "Part A-P&L: Sl.62b net profit must equal the sum of net profit of all the presumptive sections.");

  /* A134 — 47(i) & 47(ii) bad-debt totals match their detail tables. */
  const bda=RG(BD,"BadDebtAmtDtls",[])||[], bdo=RG(BD,"OthersPANNotAvlblDtl",[])||[];
  A(134, REQ(BD.BadDebtAmtDtlsTotal, SUM(bda,"Amount")) && REQ(BD.OthersPANNotAvlblDtlTotal, SUM(bdo,"Amount")),
    "Part A-P&L: Sl.47(i) and 47(ii) bad-debt totals must match the sum of their detail tables.");

  /* A135 — 62a Gross receipts/turnover = Σ gross receipts of all sections.
     (CBDT text says "net profit" but 62a is gross receipts; parallel to A133.) */
  A(135, REQ(NBK.GrossReceipt, SUM(NBKD,"GrossReceipt")),
    "Part A-P&L: Sl.62a gross receipts/turnover must equal the sum of gross receipts of all the presumptive sections.");

  /* A137 — 62b Net profit not more than 62a Turnover. */
  A(137, N(NBK.NetProfit) <= N(NBK.GrossReceipt),
    "Part A-P&L: Sl.62(b) net profit cannot be more than Sl.62(a) turnover.");

  /* A138 — bad-debt amount > ₹1 lakh ⇒ PAN/Aadhaar (47i) and name & address (47ii) mandatory. */
  const ok47i=bda.every(function(r){ if(!r||N(r.Amount)<=100000) return true; return S0(r.PAN)||S0(r.Aadhaar); });
  const ok47ii=bdo.every(function(r){ if(!r||N(r.Amount)<=100000) return true;
      return S0(r.Name) && (S0(r.FlatDoorBlockNumber)||S0(r.RoadStreetPostOffice)||S0(r.AreaLocality)||S0(r.TownCityDistrict)); });
  A(138, ok47i && ok47ii,
    "Part A-P&L: where a bad-debt amount at Sl.47(i)/47(ii) exceeds ₹1 lakh, the PAN or Aadhaar (47i) and the name and address (47ii) are mandatory.");

  /* =====================================================================
     Part A — Statement of Profit & Loss (Ind-AS, PARTA_PLIndAS). A139–A156.
     ===================================================================== */
  const PA=RG(I,"PARTA_PLIndAS",{})||{};
  const CI=RG(PA,"CreditsToPL",{})||{};
  const OI=RG(CI,"OthIncome",{})||{};
  const DI=RG(PA,"DebitsToPL.DebitPlAcnt",{})||{};
  const RTI=RG(DI,"RatesTaxesPays.ExciseCustomsVAT",{})||{};
  const IEI=RG(DI,"InterestExpdrtDtls",{})||{};
  const BDI=RG(DI,"BadDebtDtls",{})||{};
  const TPI=RG(PA,"DebitsToPL.TaxProvAppr",{})||{};

  /* A139 — Ind-AS Sl.13 gross profit transferred from trading account
     = Sl.12 (gross profit) + 12b (intraday) + 12d (F&O) of the Ind-AS trading account. */
  const TRIA=RG(I,"TradingAccountIndAS",{})||{};
  A(139, REQ(CI.GrossProfitTrnsfFrmTrdAcc, N(TRIA.GrossProfitFrmBusProf)+N(TRIA.IntradayTradingIncome)+N(TRIA.IncomeFutureTrd)),
    "Part A-P&L Ind-AS: Sl.13 gross profit transferred from the trading account must equal Sl.12 + 12b + 12d of the Ind-AS trading account.");

  /* A140 — 14.xi 'any other income' total = Σ its individual entries. */
  A(140, REQ(OI.MiscOthIncome, N(OI.LiabilityWrittenBack)+N(OI.AmtofInterest)+SUM(RG(OI,"OtherIncDtls",[]),"OthersAmount")),
    "Part A-P&L Ind-AS: Sl.14.xi 'any other income' total must equal the sum of its individual entries.");

  /* A141 — 14 (total other income) = Σ 14(i..x + xic). */
  A(141, REQ(OI.TotOthIncome, N(OI.RentInc)+N(OI.Comissions)+N(OI.Dividends)+N(OI.InterestInc)+N(OI.ProfitOnSaleFixedAsset)
      +N(OI.ProfitOnInvChrSTT)+N(OI.ProfitOnOthInv)+N(OI.ProfitOnCurrFluct)+N(OI.ProfitOnCnvInvntryToCapAsst)+N(OI.ProfitOnAgriIncome)+N(OI.MiscOthIncome)),
    "Part A-P&L Ind-AS: Sl.14 must equal the sum of Sl.14(i + ii + iii + iv + v + vi + vii + viii + ix + x + xic).");

  /* A142 — 15 Total credits (13 + 14xii) = 13 + 14xii. */
  A(142, REQ(CI.TotCreditsToPL, N(CI.GrossProfitTrnsfFrmTrdAcc)+N(OI.TotOthIncome)),
    "Part A-P&L Ind-AS: Sl.15 total credits to the statement of profit and loss must equal Sl.13 + 14xii.");

  /* A143 — 22xiia Yes ⇒ 22xiib cannot be zero/null/blank. */
  const ECI=RG(DI,"EmployeeComp",{})||{};
  A(143, ECI.AnyCompPaidToNonRes!=="Y" || N(ECI.AmtPaidToNonRes)>0,
    "Part A-P&L Ind-AS: if Sl.22xiia is Yes then Sl.22xiib (amount paid to non-residents) cannot be zero, null or blank.");

  /* A144 — 22xi Compensation to employees = Σ 22i..22x. */
  A(144, REQ(ECI.TotEmployeeComp, N(ECI.SalsWages)+N(ECI.Bonus)+N(ECI.MedExpReimb)+N(ECI.LeaveEncash)+N(ECI.LeaveTravelBenft)
      +N(ECI.ContToSuperAnnFund)+N(ECI.ContToPF)+N(ECI.ContToGratFund)+N(ECI.ContToOthFund)+N(ECI.OthEmpBenftExpdr)),
    "Part A-P&L Ind-AS: Sl.22xi compensation to employees must equal the sum of Sl.22i to 22x.");

  /* A145 — 23v = Σ 23i..23iv. */
  const INI=RG(DI,"Insurances",{})||{};
  A(145, REQ(INI.TotInsurances, N(INI.MedInsur)+N(INI.LifeInsur)+N(INI.KeyManInsur)+N(INI.OthInsur)),
    "Part A-P&L Ind-AS: Sl.23i to 23iv must equal Sl.23v.");

  /* A146 — 30iii commission = 30i + 30ii. */
  const CMI=RG(DI,"CommissionExpdrDtls",{})||{};
  A(146, REQ(CMI.Total, N(CMI.NonResOtherCompany)+N(CMI.Others)),
    "Part A-P&L Ind-AS: Sl.30iii total commission must equal Sl.30i + 30ii.");

  /* A147 — 31iii royalty = 31i + 31ii. */
  const RYI=RG(DI,"RoyalityDtls",{})||{};
  A(147, REQ(RYI.Total, N(RYI.NonResOtherCompany)+N(RYI.Others)),
    "Part A-P&L Ind-AS: Sl.31iii royalty must equal Sl.31i + 31ii.");

  /* A148 — 32iii professional/consultancy/technical fees = 32i + 32ii. */
  const PRI=RG(DI,"ProfessionalConstDtls",{})||{};
  A(148, REQ(PRI.Total, N(PRI.NonResOtherCompany)+N(PRI.Others)),
    "Part A-P&L Ind-AS: Sl.32iii professional/consultancy/technical fees must equal Sl.32i + 32ii.");

  /* A149 — 44 rates and taxes breakup consistent with total (44x). */
  A(149, REQ(RTI.TotExciseCustomsVAT, N(RTI.UnionExciseDuty)+N(RTI.ServiceTax)+N(RTI.VATorSaleTax)+N(RTI.Cess)
      +N(RTI.CentralGoodServiceTax)+N(RTI.StateGoodServiceTax)+N(RTI.IntegratedGoodServiceTax)+N(RTI.UnionTerrGoodServiceTax)+N(RTI.OthDutyTaxCess)),
    "Part A-P&L Ind-AS: the breakup of rates and taxes paid or payable must be consistent with the total (44x).");

  /* A150 — 46 Other expenses total = Σ individual rows. */
  A(150, REQ(DI.OtherExpenses, SUM(RG(DI,"OtherExpensesDtls",[]),"Amount")),
    "Part A-P&L Ind-AS: Sl.46 total other expenses must equal the sum of the individual figures.");

  /* A151 — bad debts 47i + 47ii + 47iii consistent with total 47iv. */
  A(151, REQ(BDI.BadDebt, N(BDI.BadDebtAmtDtlsTotal)+N(BDI.OthersPANNotAvlblDtlTotal)+N(BDI.OthersAmtLt1Lakh)),
    "Part A-P&L Ind-AS: the sum of bad debts at Sl.47i + 47ii + 47iii must be consistent with the total at Sl.47iv.");

  /* A152 — 50 PBIDTA = 15 − Σ(debit heads 16..49). */
  A(152, REQ(N(RG(DI,"PBIDTA")), N(CI.TotCreditsToPL) - DEB("PARTA_PLIndAS")),
    "Part A-P&L Ind-AS: Sl.50 profit before interest, depreciation and taxes must equal Sl.15 minus the debit heads (16 to 49).");

  /* A153 — 51iii interest = 51i + 51ii. */
  A(153, REQ(IEI.InterestExpdr, N(IEI.NonResOtherCompany)+N(IEI.Others)),
    "Part A-P&L Ind-AS: Sl.51iii interest must equal Sl.51i + 51ii.");

  /* A154 — 53 Net profit before taxes = 50 − 51iii − 52. */
  A(154, REQ(N(RG(DI,"PBT")), N(RG(DI,"PBIDTA")) - N(IEI.InterestExpdr) - N(RG(DI,"DepreciationAmort"))),
    "Part A-P&L Ind-AS: Sl.53 net profit before taxes must equal Sl.50 − 51iii − 52.");

  /* A155 — 56 Profit after tax = 53 − 54 − 55. */
  A(155, REQ(TPI.ProfitAfterTax, N(RG(DI,"PBT")) - N(TPI.ProvForCurrTax) - N(TPI.ProvDefTax)),
    "Part A-P&L Ind-AS: Sl.56 profit after tax must equal Sl.53 − 54 − 55.");

  /* A156 — 58 Amount available for appropriation = 56 + 57. */
  A(156, REQ(TPI.AmtAvlAppr, N(TPI.ProfitAfterTax)+N(TPI.BalBFPrevYr)),
    "Part A-P&L Ind-AS: Sl.58 amount available for appropriation must equal Sl.56 + 57.");
});
