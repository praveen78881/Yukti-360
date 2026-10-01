/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_02 (Phase 6).
   Serial range A57–A106. Continues the Part A audited-accounts arithmetic:
     A57            — Part A Balance Sheet (regular, PARTA_BSFor6FrmAY13).
     A58–A63        — Part A Balance Sheet, Ind-AS (PARTA_BSIndAS).
     A64–A74        — Trading Account, regular (TradingAccount).
     A75–A82        — Trading Account, Ind-AS (TradingAccountIndAS).
     A83–A89        — Manufacturing Account, regular (ManufacturingAccount).
     A90–A96        — Manufacturing Account, Ind-AS (ManufacturingAccountIndAS).
     A97–A106       — Statement of P&L (PARTA_PL / PARTA_PLIndAS).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG / N);
   REQ(a,b) is |a−b| ≤ 1, so a zero-skeleton foots 0==0 and an empty return
   never fires. Schedule-scoped blocks enter only under if(I.Block){...}.
   Keys verified against sources/ITR-6/…_schema.json and mirror the exp()
   totals in forms/ITR-6/src/70_sec_accounts.js. Item references (4Aiv, 1F,
   22xi, …) from the rule text and books/ITR-6 Trading/Manufacturing/P&L.
   Encoded from each rule's own text (constitution rule 6).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const SUM=(arr,k)=>(Array.isArray(arr)?arr:[]).reduce((a,r)=>a+N(r&&r[k]),0);

  /* =====================================================================
     A57 — Part A Balance Sheet (regular). Total Assets = 1F + 2G.
     ===================================================================== */
  {
    const BS=RG(I,"PARTA_BSFor6FrmAY13",{})||{};
    const AS=RG(BS,"Assets",{})||{};
    A(57, REQ(BS.TotalAssets, N(RG(AS,"NonCurrAssets.TotNonCurrAssets"))+N(RG(AS,"CurrentAssets.TotCurrAssets"))),
      "Part A-BS: Total assets must equal 1F (total non-current assets) + 2G (total current assets).");
  }

  /* =====================================================================
     A58–A63 — Part A Balance Sheet, Ind-AS (PARTA_BSIndAS).
     ===================================================================== */
  if(I.PARTA_BSIndAS){
    const BI=RG(I,"PARTA_BSIndAS",{})||{};
    const EL=RG(BI,"EquityAndLiablities",{})||{};
    const EQ=RG(EL,"Equity",{})||{};
    const ESC=RG(EQ,"EquityShareCapital",{})||{};
    const OE=RG(EQ,"OtherEquityReserv",{})||{};
    const LI=RG(EL,"Liabilities",{})||{};
    const NCL=RG(LI,"NonCurrLiabilities",{})||{};
    const FL=RG(NCL,"FinancialLiabilities",{})||{};
    const CLb=RG(LI,"CurrentLiabilities",{})||{};
    const NCA=RG(BI,"Assets.NonCurrAssets.PropertyPlantEquip",{})||{};
    const NFA=RG(NCA,"FinancialAssets",{})||{};
    const CA=RG(BI,"Assets.CurrentAssets",{})||{};
    const CFA=RG(CA,"FinancialAssets",{})||{};

    /* A58 — 1Aiv Total share capital = 1Aii + 1Aiii. */
    A(58, REQ(ESC.TotShareCapital, N(ESC.IssuedSubsPaidUp)+N(ESC.SubscribedNotFullyPaid)),
      "Part A-BS Ind-AS: 1Aiv (total share capital) must equal 1Aii + 1Aiii.");

    /* A59 — 1C Total equity = 1Aiv + 1Biii. */
    A(59, REQ(OE.TotalEquity, N(ESC.TotShareCapital)+N(OE.TotResrNRetEar)),
      "Part A-BS Ind-AS: 1C (total equity) must equal 1Aiv + 1Biii.");

    /* A60 — Total non-current liabilities = Ii + Ij + Ik + IIC + III + IVc. */
    A(60, REQ(NCL.TotalNonCurrLiab, N(FL.TotalLTBorrowings)+N(FL.TradePayables)+N(FL.OtherFinancialLiab)
        +N(RG(NCL,"Provisions.TotalProvisions"))+N(NCL.DefrdTaxCurrLiabilites)
        +N(RG(NCL,"OtherNonCurLiabilites.TotalOthNonCurrLiab"))),
      "Part A-BS Ind-AS: total non-current liabilities must equal Ii + Ij + Ik + IIC + III + IVc.");

    /* A61 — Total equity & liabilities = 1C + 2A + 2B. */
    A(61, REQ(CLb.TotalEquityLiab, N(OE.TotalEquity)+N(NCL.TotalNonCurrLiab)+N(CLb.TotalCurrentLiab)),
      "Part A-BS Ind-AS: total of equity and liabilities must equal 1C + 2A + 2B.");

    /* A62 — Total non-current assets = Ad+B+Cd+Dc+Ed+F+Gc+HI+HII+HIII+HIV+I+J. */
    A(62, REQ(NFA.TotalNonCurrntAsst, N(NCA.NetBlock)+N(NCA.CapWrkProg)+N(NCA.InvstPropNetBlock)
        +N(NCA.GoodWlNetBlock)+N(NCA.OthIntAstNetBlock)+N(NCA.IntAstUndrDevlpmnt)+N(NCA.BioAstNetBlock)
        +N(RG(NFA,"Investments.TotalNonCurrentInvst"))+N(RG(NFA,"TradeReceivables.TotalTradeReceivbls"))
        +N(RG(NFA,"Loans.TotalLoans"))+N(RG(NFA,"OtherFinacialAssets.TotalOthFinancialAsst"))
        +N(RG(NFA,"OtherFinacialAssets.DefrdTaxAsst"))+N(RG(NFA,"OtherNonCurrentAssets.TotalNonCurrAsst"))),
      "Part A-BS Ind-AS: total non-current assets must equal Ad+B+Cd+Dc+Ed+F+Gc+HI+HII+HIII+HIV+I+J.");

    /* A63 — Total current assets = 2A + 2B + 2C + 2D. */
    A(63, REQ(RG(CFA,"OtherCurrentAssets.TotalCurrAsst"), N(RG(CA,"Inventories.TotalInventories"))
        +N(CFA.TotalFinancialAsst)+N(CFA.CurrentTaxAsst)+N(RG(CFA,"OtherCurrentAssets.TotalOthCurrentAsst"))),
      "Part A-BS Ind-AS: total current assets must equal 2A + 2B + 2C + 2D.");
  }

  /* =====================================================================
     Trading Account — arithmetic. Shared row structure for regular and
     Ind-AS; encoded per its own serial against the named block.
     ===================================================================== */
  function trdChecks(pf, ind, off){   /* off = serial offset (regular vs Ind-AS) */
    const T=RG(I,pf,{})||{};
    const EV=RG(T,"ExciseCustomsVAT",{})||{};
    const DT=RG(T,"DutyTaxPay.ExciseCustomsVAT",{})||{};
    const tag=ind?" Ind-AS":"";
    /* 4Aiiic total other operating revenues = sum of the detail rows. */
    A(off+0, REQ(T.OperatingRevenueTotal, SUM(RG(T,"OtherOperatingRevenueDtls",[]),"OperatingRevenueAmt")),
      "Part A-Trading Account"+tag+": 4Aiiic (total other operating revenues) must equal the sum of the other-operating-revenue rows.");
    /* 4Aiv total sales/gross receipts = 4Ai + 4Aii + 4Aiiic. */
    A(off+1, REQ(T.SalesGrossReceiptsTotal, N(T.SaleOfGoods)+N(T.SaleOfServices)+N(T.OperatingRevenueTotal)),
      "Part A-Trading Account"+tag+": 4Aiv must equal 4Ai + 4Aii + 4Aiiic.");
    /* 4Cix total duties/taxes/cess on sales = 4Ci to 4Cviii. */
    A(off+2, REQ(EV.TotExciseCustomsVAT, N(EV.UnionExciseDuty)+N(EV.ServiceTax)+N(EV.VATorSaleTax)
        +N(EV.CentralGoodServiceTax)+N(EV.StateGoodServiceTax)+N(EV.IntegratedGoodServiceTax)
        +N(EV.UnionTerrGoodServiceTax)+N(EV.OthDutyTaxCess)),
      "Part A-Trading Account"+tag+": 4Cix must equal the sum of 4Ci to 4Cviii.");
    /* 4D total revenue from operations = 4Aiv + 4B + 4Cix. */
    A(off+3, REQ(T.TotRevenueFrmOperations, N(T.SalesGrossReceiptsTotal)+N(T.GrossRcptFromProfession)+N(EV.TotExciseCustomsVAT)),
      "Part A-Trading Account"+tag+": 4D (total revenue from operations) must equal 4Aiv + 4B + 4Cix.");
    /* 9 direct expenses = 9i + 9ii + 9iii. */
    A(off+4, REQ(T.DirectExpenses, N(T.CarriageInward)+N(T.PowerAndFuel)+N(T.TotOthDirectExpenses)),
      "Part A-Trading Account"+tag+": 9 (direct expenses) must equal 9i + 9ii + 9iii.");
    /* 10xii total duties/taxes on purchases = 10i to 10xi. */
    A(off+5, REQ(DT.TotExciseCustomsVAT, N(DT.CustomDuty)+N(DT.CounterVailDuty)+N(DT.SplAddDuty)+N(DT.UnionExciseDuty)
        +N(DT.ServiceTax)+N(DT.VATorSaleTax)+N(DT.CentralGoodServiceTax)+N(DT.StateGoodServiceTax)
        +N(DT.IntegratedGoodServiceTax)+N(DT.UnionTerrGoodServiceTax)+N(DT.OthDutyTaxCess)),
      "Part A-Trading Account"+tag+": 10 (total) must equal the sum of 10i to 10xi.");
    /* 12 gross profit = 6 − 7 − 8 − 9 − 10xii − 11. */
    A(off+6, REQ(T.GrossProfitFrmBusProf, N(T.TardingAccTotCred)-N(T.OpngStckOfFinishedStcks)-N(T.Purchases)
        -N(T.DirectExpenses)-N(DT.TotExciseCustomsVAT)-N(T.GoodsCostPrdcdFrmMA)),
      "Part A-Trading Account"+tag+": 12 must equal 6 − 7 − 8 − 9 − 10xii − 11.");
    return T;
  }

  /* --- A64–A70 (regular Trading, offset 64) --- */
  if(I.TradingAccount){
    const T=trdChecks("TradingAccount", false, 64);
    /* A71 — 11 (cost of goods produced from Mfg) = Manufacturing Account item 3. */
    A(71, REQ(T.GoodsCostPrdcdFrmMA, RG(I,"ManufacturingAccount.CostOfGoodsPrdcd")),
      "Part A-Trading Account: Sl.No. 11 (cost of goods produced) must equal Sl.No. 3 of the Manufacturing Account.");
    /* A72 — 6 total credits to Trading Account = 4D + 5. */
    A(72, REQ(T.TardingAccTotCred, N(T.TotRevenueFrmOperations)+N(T.ClsngStckOfFinishedStcks)),
      "Part A-Trading Account: 6 (total of credits) must equal 4D + 5.");
    /* A73 — Income from Intraday Trading (12b) must not exceed its turnover (12a). */
    A(73, N(T.IntradayTradingIncome)<=N(T.IntradayTradingTurnOver),
      "Part A-Trading Account: income from Intraday Trading (12b) must not be more than turnover from Intraday Trading (12a).");
  }

  /* A74 — Income from F&O (12d) must not exceed its turnover (12c); applies to
     both the regular Trading Account and the Trading Account Ind-AS. */
  {
    const T=RG(I,"TradingAccount",{})||{}, TI=RG(I,"TradingAccountIndAS",{})||{};
    A(74, N(T.IncomeFutureTrd)<=N(T.TurnoverFutureTrd) && N(TI.IncomeFutureTrd)<=N(TI.TurnoverFutureTrd),
      "Part A-Trading Account: income from Futures & Options Trading (12d) must not be more than turnover from Futures & Options Trading (12c).");
  }

  /* --- A75–A82 (Ind-AS Trading, offset 75) --- */
  if(I.TradingAccountIndAS){
    const T=trdChecks("TradingAccountIndAS", true, 75);
    /* A82 — 6 total credits to Trading Account (Ind-AS) = 4D + 5. */
    A(82, REQ(T.TardingAccTotCred, N(T.TotRevenueFrmOperations)+N(T.ClsngStckOfFinishedStcks)),
      "Part A-Trading Account Ind-AS: 6 (total of credits) must equal 4D + 5.");
  }

  /* =====================================================================
     Manufacturing Account — arithmetic + "no negatives except Sl.3".
     ===================================================================== */
  const MFG_NN=["OpeningInventory.OpngStckRawMat","OpeningInventory.OpngStckWrkinPrgrs","OpeningInventory.OpngInvntryTotal",
    "OpeningInventory.Purchases","OpeningInventory.DirectWages","OpeningInventory.DirectExpenses","OpeningInventory.CarriageInward",
    "OpeningInventory.PowerAndFuel","OpeningInventory.OthDirectExpenses","OpeningInventory.IndirectWages","OpeningInventory.FactoryRentAndRates",
    "OpeningInventory.FactoryInsurance","OpeningInventory.FactoryFuelAndPower","OpeningInventory.FactoryGeneralExpenses",
    "OpeningInventory.DeprctnOfFactoryMachinery","OpeningInventory.TotalFactoryOverheads","OpeningInventory.TotalDebtsManfctrngAcc",
    "ClosingStock.ClsngStckRawMaterial","ClosingStock.ClsngStckWrkInPrgrs","ClosingStock.ClsngStckTotal"];
  function mfgChecks(pf, ind, off){
    const M=RG(I,pf,{})||{};
    const OI=RG(M,"OpeningInventory",{})||{};
    const CS=RG(M,"ClosingStock",{})||{};
    const tag=ind?" Ind-AS":"";
    /* 1Aiii total opening inventory = 1Ai + 1Aii. */
    A(off+0, REQ(OI.OpngInvntryTotal, N(OI.OpngStckRawMat)+N(OI.OpngStckWrkinPrgrs)),
      "Part A-Manufacturing Account"+tag+": 1Aiii (total opening inventory) must equal 1Ai + 1Aii.");
    /* 1D total direct expenses = 1Di + 1Dii + 1Diii. */
    A(off+1, REQ(OI.DirectExpenses, N(OI.CarriageInward)+N(OI.PowerAndFuel)+N(OI.OthDirectExpenses)),
      "Part A-Manufacturing Account"+tag+": 1D (total direct expenses) must equal 1Di + 1Dii + 1Diii.");
    /* 1Evii total factory overheads = 1Ei to 1Evi. */
    A(off+2, REQ(OI.TotalFactoryOverheads, N(OI.IndirectWages)+N(OI.FactoryRentAndRates)+N(OI.FactoryInsurance)
        +N(OI.FactoryFuelAndPower)+N(OI.FactoryGeneralExpenses)+N(OI.DeprctnOfFactoryMachinery)),
      "Part A-Manufacturing Account"+tag+": 1Evii (total factory overheads) must equal Ei + Eii + Eiii + Eiv + Ev + Evi.");
    /* 1F total debits to Manufacturing Account = 1Aiii + 1B + 1C + 1D + 1Evii. */
    A(off+3, REQ(OI.TotalDebtsManfctrngAcc, N(OI.OpngInvntryTotal)+N(OI.Purchases)+N(OI.DirectWages)
        +N(OI.DirectExpenses)+N(OI.TotalFactoryOverheads)),
      "Part A-Manufacturing Account"+tag+": 1F (total debits) must equal Aiii + B + C + D + Evii.");
    /* 2 total closing stock = 2i + 2ii. */
    A(off+4, REQ(CS.ClsngStckTotal, N(CS.ClsngStckRawMaterial)+N(CS.ClsngStckWrkInPrgrs)),
      "Part A-Manufacturing Account"+tag+": 2 (total closing stock) must equal 2i + 2ii.");
    /* 3 cost of goods produced = 1F − 2. */
    A(off+5, REQ(M.CostOfGoodsPrdcd, N(OI.TotalDebtsManfctrngAcc)-N(CS.ClsngStckTotal)),
      "Part A-Manufacturing Account"+tag+": 3 (cost of goods produced) must equal 1F − 2.");
    /* negatives not allowed anywhere except Sl.No. 3 (cost of goods produced). */
    A(off+6, MFG_NN.every(p=>N(RG(M,p))>=0),
      "Part A-Manufacturing Account"+tag+": negative values are not allowed other than in Sl.No. 3 (cost of goods produced).");
  }

  /* --- A83–A89 (regular Manufacturing) --- */
  if(I.ManufacturingAccount) mfgChecks("ManufacturingAccount", false, 83);
  /* --- A90–A96 (Ind-AS Manufacturing) --- */
  if(I.ManufacturingAccountIndAS) mfgChecks("ManufacturingAccountIndAS", true, 90);

  /* =====================================================================
     A97–A106 — Statement of Profit & Loss. Same footing on whichever P&L
     is filed: each check holds independently for the regular (PARTA_PL,
     detail amount key "Amount") and the Ind-AS (PARTA_PLIndAS,
     "OthersAmount") block; an absent block foots 0==0 and stays silent.
     ===================================================================== */
  {
    const PL=RG(I,"PARTA_PL",{})||{}, PLI=RG(I,"PARTA_PLIndAS",{})||{};
    const TR=RG(I,"TradingAccount",{})||{}, TRI=RG(I,"TradingAccountIndAS",{})||{};
    /* returns {C,OI,D,EC,INS} guarded sub-objects for a P&L block */
    const parts=P=>{const C=RG(P,"CreditsToPL",{})||{}; const D=RG(P,"DebitsToPL.DebitPlAcnt",{})||{};
      return {C:C, O:RG(C,"OthIncome",{})||{}, D:D, E:RG(D,"EmployeeComp",{})||{}, N:RG(D,"Insurances",{})||{}};};
    const R=parts(PL), IA=parts(PLI);

    /* A97 — 13 gross profit transferred from Trading = Trading 12 + 12b + 12d. */
    A(97, REQ(R.C.GrossProfitTrnsfFrmTrdAcc, N(TR.GrossProfitFrmBusProf)+N(TR.IntradayTradingIncome)+N(TR.IncomeFutureTrd))
        && REQ(IA.C.GrossProfitTrnsfFrmTrdAcc, N(TRI.GrossProfitFrmBusProf)+N(TRI.IntradayTradingIncome)+N(TRI.IncomeFutureTrd)),
      "Part A-P&L: 13 (gross profit transferred from Trading Account) must equal Trading item 12 + 12b + 12d.");

    /* A98 — 14xic (any other income) = 14xia + 14xib + the any-other-income table. */
    const misc=(O,key)=>REQ(O.MiscOthIncome, N(O.LiabilityWrittenBack)+N(O.AmtofInterest)+SUM(RG(O,"OtherIncDtls",[]),key));
    A(98, misc(R.O,"Amount") && misc(IA.O,"OthersAmount"),
      "Part A-P&L: 14xic (any other income) must equal 14xia + 14xib + the sum of the 'any other income' rows.");

    /* A99 — 14xii total other income = 14i to 14x + 14xic. */
    const totOI=O=>REQ(O.TotOthIncome, N(O.RentInc)+N(O.Comissions)+N(O.Dividends)+N(O.InterestInc)
        +N(O.ProfitOnSaleFixedAsset)+N(O.ProfitOnInvChrSTT)+N(O.ProfitOnOthInv)+N(O.ProfitOnCurrFluct)
        +N(O.ProfitOnCnvInvntryToCapAsst)+N(O.ProfitOnAgriIncome)+N(O.MiscOthIncome));
    A(99, totOI(R.O) && totOI(IA.O),
      "Part A-P&L: 14xii (total of other income) must equal the sum of 14i to 14x plus 14xic.");

    /* A100 — 15 total credits to P&L = 13 + 14xii. */
    const totCred=(C,O)=>REQ(C.TotCreditsToPL, N(C.GrossProfitTrnsfFrmTrdAcc)+N(O.TotOthIncome));
    A(100, totCred(R.C,R.O) && totCred(IA.C,IA.O),
      "Part A-P&L: 15 (total of credits to statement of profit and loss) must equal 13 + 14xii.");

    /* A101 — if 22xiia (any compensation paid to non-residents) is Yes, then
       22xiib (amount) cannot be zero, null or blank. */
    const nrOk=E=>String(RG(E,"AnyCompPaidToNonRes",""))!=="Y" || (S0(E.AmtPaidToNonRes)&&N(E.AmtPaidToNonRes)!==0);
    A(101, nrOk(R.E) && nrOk(IA.E),
      "Part A-P&L: if 22xiia (any compensation paid to non-residents) is Yes, 22xiib (amount) cannot be zero, null or blank.");

    /* A102 — 22xi total compensation to employees = 22i to 22x. */
    const emp=E=>REQ(E.TotEmployeeComp, N(E.SalsWages)+N(E.Bonus)+N(E.MedExpReimb)+N(E.LeaveEncash)+N(E.LeaveTravelBenft)
        +N(E.ContToSuperAnnFund)+N(E.ContToPF)+N(E.ContToGratFund)+N(E.ContToOthFund)+N(E.OthEmpBenftExpdr));
    A(102, emp(R.E) && emp(IA.E),
      "Part A-P&L: 22xi (compensation to employees) must equal the sum of 22i to 22x.");

    /* A103 — 23v total expenditure on insurance = 23i + 23ii + 23iii + 23iv. */
    const ins=N_=>REQ(N_.TotInsurances, N(N_.MedInsur)+N(N_.LifeInsur)+N(N_.KeyManInsur)+N(N_.OthInsur));
    A(103, ins(R.N) && ins(IA.N),
      "Part A-P&L: 23v (total expenditure on insurance) must equal 23i + 23ii + 23iii + 23iv.");

    /* A104 — 30iii total commission = 30i + 30ii. */
    const tot2=(D,path)=>{const g=RG(D,path,{})||{};return REQ(g.Total, N(g.NonResOtherCompany)+N(g.Others));};
    A(104, tot2(R.D,"CommissionExpdrDtls") && tot2(IA.D,"CommissionExpdrDtls"),
      "Part A-P&L: 30iii (total commission) must equal 30i + 30ii.");

    /* A105 — 31iii total royalty = 31i + 31ii. */
    A(105, tot2(R.D,"RoyalityDtls") && tot2(IA.D,"RoyalityDtls"),
      "Part A-P&L: 31iii (total royalty) must equal 31i + 31ii.");

    /* A106 — 32iii total professional/consultancy/technical fees = 32i + 32ii. */
    A(106, tot2(R.D,"ProfessionalConstDtls") && tot2(IA.D,"ProfessionalConstDtls"),
      "Part A-P&L: 32iii (professional/consultancy/technical fees) must equal 32i + 32ii.");
  }
});
