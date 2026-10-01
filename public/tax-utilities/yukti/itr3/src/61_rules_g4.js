/* =====================================================================
   ITR-3 · AY 2026-27 — Phase 6 rule batch g4 (Category-A serials).
   Registered via ruleset(fn); runRules() runs it with its own A/Dd
   collectors and the same globals (RG/RSUM/REQ/N/R/isNew).
   A(n,cond,msg): fires when cond (the assertion that holds for a VALID
   return) is FALSE. Every read is guarded; nothing throws. Each rule is
   encoded from its rules.json text, mapped to the exact exported schema
   keys (70_sec_*.js). Serials that need an external database, prior-year
   data, ambiguous/garbled numbering, or a formula this form routes
   through BFLA/CYLA are left to logs/ITR-3/rules_class_g4.json.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};

  /* ---- Part A General : audit liability (a2iii cash payments) ---- */
  var G2=RG(I,"PartA_GEN2.AuditInfo",{})||{};
  A(29, G2.AgrOFAllPayMade!=="MoreThan5Per" || G2.LiableSec44ABflg==="Y",
    "Payments in cash exceed 5% (a2iii = More than 5%) — you are liable to audit u/s 44AB; 'liable to audit u/s 44AB' must be Yes.");

  /* ================= Manufacturing / Trading account ================= */
  if(I.ManufacturingAccount){var mfg=I.ManufacturingAccount, moi=RG(mfg,"OpeningInventory",{})||{};
    A(62, REQ(moi.DirectExpenses, N(moi.CarriageInward)+N(moi.PowerAndFuel)+N(moi.OthDirectExpenses)),
      "Manufacturing Account: total direct expenses (1D) must equal carriage inward + power/fuel + other direct expenses (Di + Dii + Diii).");
  }
  if(I.TradingAccount){var trd=I.TradingAccount, dtv=RG(trd,"DutyTaxPay.ExciseCustomsVAT",{})||{};
    A(74, REQ(dtv.TotExciseCustomsVAT, N(dtv.CustomDuty)+N(dtv.CounterVailDuty)+N(dtv.SplAddDuty)+N(dtv.UnionExciseDuty)+N(dtv.ServiceTax)+N(dtv.VATorSaleTax)+N(dtv.CentralGoodServiceTax)+N(dtv.StateGoodServiceTax)+N(dtv.IntegratedGoodServiceTax)+N(dtv.UnionTerrGoodServiceTax)+N(dtv.OthDutyTaxCess)),
      "Trading Account: total duties and taxes on goods/services purchased (10xii) must equal the sum of items 10(i) to 10(xi).");
    if(I.ManufacturingAccount)
      A(68, REQ(trd.GoodsCostPrdcdFrmMA, N(RG(I,"ManufacturingAccount.CostOfGoodsPrdcd"))),
        "Trading Account: cost of goods produced transferred from the Manufacturing Account (item 11) must equal item 3 of the Manufacturing Account.");
  }

  /* ================= Part A - P&L ================= */
  if(I.PARTA_PL){var pl=I.PARTA_PL, cr=RG(pl,"CreditsToPL",{})||{}, oi=RG(cr,"OthIncome",{})||{}, db=RG(pl,"DebitsToPL",{})||{};
    A(80, REQ(oi.MiscOthIncome, N(oi.LiabilityWrittenBack)+N(oi.AmtofInterest)+N(oi.AmtofRem)+RSUM(oi.OtherIncDtls||[],"Amount")),
      "Part A-P&L: any-other-income subtotal (14xi) must equal 14xi(a) + 14xi(b) + 14xi(c) plus the specified-nature rows.");
    /* 50 = 15 - (16..49, excl. interest 51 and depreciation 52) — engine's own debit-heads list */
    var _debHeads=N(db.Freight)+N(db.ConsumptionOfStores)+N(db.PowerFuel)+N(db.RentExpdr)+N(db.RepairsBldg)+N(db.RepairMach)
      +N(RG(db,"EmployeeComp.TotEmployeeComp"))+N(RG(db,"Insurances.TotInsurances"))+N(db.StaffWelfareExp)+N(db.Entertainment)
      +N(db.Hospitality)+N(db.Conference)+N(db.SalePromoExp)+N(db.Advertisement)+N(RG(db,"CommissionExpdrDtls.Total"))
      +N(RG(db,"RoyalityDtls.Total"))+N(RG(db,"ProfessionalConstDtls.Total"))+N(db.HotelBoardLodge)+N(db.TravelExp)
      +N(db.ForeignTravelExp)+N(db.ConveyanceExp)+N(db.TelephoneExp)+N(db.GuestHouseExp)+N(db.ClubExp)+N(db.FestivalCelebExp)
      +N(db.Scholarship)+N(db.Gift)+N(db.Donation)+N(RG(db,"RatesTaxesPays.ExciseCustomsVAT.TotExciseCustomsVAT"))+N(db.AuditFee)
      +N(db.OtherExpenses)+N(RG(db,"BadDebtDtls.BadDebt"))+N(db.ProvForBadDoubtDebt)+N(db.OthProvisionsExpdr);
    A(92, REQ(db.PBIDTA, N(cr.TotCreditsToPL)-_debHeads),
      "Part A-P&L: profit before interest, depreciation and taxes (50) must equal total credits (15) less the debit heads 16 to 49.");
    var ad=RG(pl,"PersumptiveInc44AD",{})||{}, ada=RG(pl,"PersumptiveInc44ADA",{})||{}, nbp=RG(pl,"NoBooksOfAccPL",{})||{};
    A(102, N(ad.TotPersumptiveInc44AD)<=N(ad.GrsTrnOverOrReceipt)+1,
      "Part A-P&L: presumptive income declared u/s 44AD (61ii) cannot be more than the gross turnover/receipts (61i).");
    A(108, !(N(ada.GrsReceipt)||N(ada.TotPersumptiveInc44ADA)) || (RG(pl,"NatOfBus44ADA",[])||[]).length>0,
      "Part A-P&L: the nature of profession (44ADA) must be filled when gross receipts (62i) or presumptive income (62ii) is greater than zero.");
    A(127, REQ(nbp.GrossReceiptPrf, N(nbp.GrsRcptAccPayeeOrBankModePrf)+N(nbp.GrsRcptOtherModePrf)),
      "Part A-P&L: gross receipts of profession (64iia) must equal 64iia1 + 64iia2.");
    A(140, REQ(RG(db,"BadDebtDtls.OthersPANNotAvlblDtlTotal"), RSUM(RG(db,"BadDebtDtls.OthersPANNotAvlblDtl",[]),"Amount")),
      "Part A-P&L: total of bad debts without PAN (47ii) must equal the sum of its individual rows.");
  }

  /* ================= Part A - OI ================= */
  if(I.PARTA_OI){var poi=I.PARTA_OI, nc=RG(poi,"NoCredToPLAmt",{})||{}, b43=RG(poi,"AmtDisall43B.AmtUs43B",{})||{};
    A(152, REQ(nc.TotNoCredToPLAmt, N(nc.Section28Items)+N(nc.ProformaCreditsDue)+N(nc.PrevYrEscalClaim)+N(nc.OthItemInc)+N(nc.CapReceipt)),
      "Part A-OI: total of amounts not credited to profit and loss account (5f) must equal 5a + 5b + 5c + 5d + 5e.");
    A(158, REQ(b43.TotAmtUs43b, N(b43.TaxDutyCesAmt)+N(b43.ContToEmpPFSFGF)+N(b43.EmpBonusComm)+N(b43.IntPayaleToFI)+N(b43.SumPayaleLoanBrToFinComp)+N(b43.IntPayaleToFISchBank)+N(b43.LeaveEncashPayable)+N(b43.RailwayAssetsPayable)+N(b43.MSEPayable)),
      "Part A-OI: total amount disallowable u/s 43B (11i) must equal the sum of its break-up rows.");
  }

  /* ================= Schedule BP ================= */
  if(I.ITR3ScheduleBP){var P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{})||{};
    if(I.PARTA_OI){
      A(255, REQ(P.AmtDebPLDisallowUs43B, N(RG(I,"PARTA_OI.AmtDisall43B.AmtUs43B.TotAmtUs43b"))),
        "Schedule BP: amount disallowable u/s 43B debited to P&L (18) must equal item 11i of Schedule Part A-OI.");
      A(302, REQ(P.InterestDisAllowUs23SMEAct, N(RG(I,"PARTA_OI.InterestDisAllowUs23SMEAct"))),
        "Schedule BP: interest disallowable u/s 23 of the MSMED Act (19) must equal item 17 of Schedule Part A-OI.");
    }
    A(280, REQ(RG(I,"ITR3ScheduleBP.SpecBusinessInc.NetPLFrmSpecBus"), N(P.NetPLFromSpecBus)),
      "Schedule BP: net profit/loss from speculative business (B39) must equal item 2a as per the profit and loss account.");
    /* E — intra-head set-off: after set-off = income - business loss set off */
    var be=RG(I,"ITR3ScheduleBP.BusSetoffCurrYr",{})||{};
    ["SpeculativeInc","SpecifiedInc"].forEach(function(k){var nd=RG(be,k,{})||{};
      A(274, REQ(nd.IncOfCurYrAfterSetOff, N(nd.IncOfCurYrUnderThatHead)-N(nd.BusLossSetoff)),
        "Schedule BP Part E: business income remaining after set-off ("+k+") must equal the current-year income minus the business loss set off.");});
    if(I.ITR3ScheduleUD)
      A(629, N(RG(I,"ITR3ScheduleUD.CurBalCFNY"))<=N(RG(P,"DepreciationAllowITAct32.TotDeprAllowITAct"))+1,
        "Schedule UD: unabsorbed depreciation of the current assessment year (item 5) cannot exceed the current-year depreciation at item 12iii of Schedule BP.");
  }
  /* BP 35(iii) 44AE = 63(ii) of P&L */
  if(I.ITR3ScheduleBP&&I.PARTA_PL)
    A(114, REQ(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AE"), N(RG(I,"PARTA_PL.TotalPrsumptvIncUs44E"))),
      "Schedule BP: presumptive income u/s 44AE (35iii) must equal total presumptive income from goods carriage u/s 44AE (63ii) of the profit and loss account.");

  /* ================= Depreciation : DPM / DEP / DCG ================= */
  if(I.ScheduleDPM){["Rate15","Rate30","Rate40","Rate45"].forEach(function(blk){
    var d=RG(I,"ScheduleDPM.PlantMachinery."+blk+".DepreciationDetail",null);
    if(!d||typeof d!=="object")return;
    A(308, REQ(d.WDVLastDay, Math.max(0, N(d.FullRateDeprAmt)+N(d.HalfRateDeprAmt)-N(d.TotalDepreciation))),
      "Schedule DPM ("+blk+"): written-down value on the last day must equal item 6 + 9 - 15, or zero if that is negative.");});
  }
  if(I.ScheduleDCG&&I.ScheduleDPM)
    A(342, REQ(RG(I,"ScheduleDCG.SummaryFromDeprSchCG.PlantMachinerySummaryCG.DeprBlockTot30Percent"), N(RG(I,"ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.CapGainUs50"))),
      "Schedule DCG: item 1b must equal the capital gains u/s 50 (item 20ii) of the 30% plant & machinery block of Schedule DPM.");
  if(I.ScheduleDEP){var d10=RG(I,"ScheduleDOA.Building.Rate10.DepreciationDetail",{})||{};
    var d10pro=N(d10.ProportionateAggDepreciation), d10net=N(d10.NetAggregateDepreciation);
    A(333, REQ(RG(I,"ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot10Percent"), d10pro>0?d10pro:d10net),
      "Schedule DEP: depreciation on the building block @10% must equal item 14iii (or 15iii, as applicable) of Schedule DOA.");
  }

  /* ================= Schedule CG (C1 = sum of Table E after set-off) ================= */
  if(I.ScheduleCGFor23){var E=RG(I,"ScheduleCGFor23.CurrYrLosses",{})||{};
    var eSum=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"]
      .reduce(function(a,k){return a+N(RG(E,k+".CurrYrCapGain"));},0);
    A(357, REQ(RG(I,"ScheduleCGFor23.SumOfCGIncm"), eSum),
      "Schedule CG: income chargeable under Capital Gains (C1) must equal the sum of the capital gains after set-off in Table E.");
  }

  /* ================= Schedule CFL (5c = 5a - 5b) ================= */
  if(I.ScheduleCFL){Object.keys(I.ScheduleCFL).forEach(function(k){
    var d=RG(I,"ScheduleCFL."+k+".CarryFwdLossDetail",null);
    if(!d||typeof d!=="object"||!("BrtFwdBusLoss" in d))return;
    A(621, REQ(d.BusLossOthThanSpecLossCF, Math.max(0, N(d.BrtFwdBusLoss)-N(d.AdjustAccTax115BACAmt))),
      "Schedule CFL ("+k+"): business loss carried forward (5c) must equal 5a - 5b, or zero if that is negative.");});
  }

  /* ================= Schedule 80G / RA ================= */
  if(I.Schedule80G)
    A(659, N(RG(I,"PartB-TI.GrossTotalIncome"))>=0 || N(RG(I,"Schedule80G.TotalEligibleDonationsUs80G"))<=0,
      "Schedule 80G: when gross total income (Part B-TI) is negative, the eligible amount of donation (D) cannot be more than zero.");
  if(I.Schedule80RA)
    A(685, REQ(RG(I,"Schedule80RA.TotalDonationAmtOtherMode80RA"), RSUM(RG(I,"Schedule80RA.DonationDtlsRsrchAssctn",[]),"DonationAmtOtherMode")),
      "Schedule RA: the total of the donation-in-other-mode column must equal the sum of the individual other-mode donations.");

  /* ================= Schedule AMT (3b = 3 - 3a) ================= */
  if(I.ScheduleAMT)
    A(837, REQ(RG(I,"ScheduleAMT.AdjustedUnderSec115JCOther"), N(RG(I,"ScheduleAMT.AdjustedUnderSec115JC"))-N(RG(I,"ScheduleAMT.AdjustedUnderSec115JCIFSC"))),
      "Schedule AMT: item 3b must be the difference of item 3 and item 3a.");

  /* ================= Schedule SI (115BBE income = OS 2b) ================= */
  if(I.ScheduleSI&&I.ScheduleOS)
    A(852, REQ(RSUM((RG(I,"ScheduleSI.SplCodeRateTax",[])||[]).filter(function(r){return String(r.SecCode)==="5BBE";}),"SplRateInc"),
      N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBE"))),
      "Schedule SI: income u/s 115BBE (sections 68/69/69A/69B/69C/69D) must equal item 2b of Schedule OS.");
});
