/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, batch enc_02 (Phase 6).
   Slice: Category-A serials 51–100 of books/ITR-5/rules.json.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires when cond (the "valid" assertion) is FALSE.
   Every read is guarded (RG / (X||{}) / N) so nothing throws and every
   check is a no-op on absent/empty data. Regime is read from the built
   return (FilingStatus.OptOldRegimeCurrAY; new regime is default).
   Schema paths from ITR-5's own built sections (70_sec_gen/bs/pl) and
   books (PART_A_GENERAL(2), BALANCE_SHEET, MANUFACTURING/TRADING_ACCOUNT).

   NOT MAPPABLE in this slice (encoded as comments only, no live A()):
     55, 59, 60 (see below — each needs an external/system date, not in the return).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const G1=RG(I,"PartA_GEN1",{})||{};
  const OFI=RG(G1,"OrgFirmInfo",{})||{};
  const FS=RG(G1,"FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";                 /* new regime default; old = 10-IEA opt-out */
  const hasBP=FS.IncFrmBusOrProf==="Y";                   /* d(i) — income from business/profession */
  const due=FS.ItrFilingDueDate;                          /* J26 code: 2026-07-31/08-31/10-31/11-30 */
  /* "business income declared" — any of the business statements/schedules is present */
  const bizDeclared=!!(I.CorpScheduleBP||I.PARTA_PL||I.TradingAccount||I.ManufacturingAccount)
    ||N(RG(I,"CorpScheduleBP.IncChrgUnHdProftGain"))!==0;
  const noNeg=o=>{if(!o||typeof o!=="object")return true;
    return Object.keys(o).every(k=>{const v=o[k];
      return (v&&typeof v==="object")?noNeg(v):N(v)>=0;});};

  /* ================= Part A - General : regime / Form 10-IEA tree ================= */

  /* 51 — the new regime can be opted out/withdrawn only if Form 10-IEA is filed:
         a business filer opting the old regime for the current AY must have
         furnished Form 10-IEA — either for the current AY (F10IEACurrAYOldRegime=Yes)
         OR carried forward from an earlier AY (Form10IEAEarlierAYOldRegime=Yes) under
         s.115BAC(6), where the earlier opt-out stays effective. Serial 75 treats all
         four 10-IEA branches this way. */
  A(51,FS.OptOldRegimeCurrAY!=="Y"||!hasBP||FS.F10IEACurrAYOldRegime==="Y"||FS.Form10IEAEarlierAYOldRegime==="Y",
    "Part A-General: the new tax regime can be opted out / withdrawn only if Form 10-IEA is filed (current AY, or carried forward from an earlier AY under s.115BAC(6)).");

  /* 52 — if business income is declared in the return, 'Do you have income from
         business or profession for the current AY?' (d(i)) cannot be 'No'. */
  A(52,!bizDeclared||FS.IncFrmBusOrProf!=="N",
    "Part A-General: business income is declared, so 'Do you have income from business or profession for the current AY?' cannot be 'No'.");

  /* 53 — a manufacturing co-operative society that was NOT required to file a return in AY
         2024-25 and AY 2025-26 (A19 d(iv): 115BAEReturnFiling_24_25="N") must fill the 115BAE
         option for that branch (OptingTaxation115BAENo, "do you wish to exercise the option").
         The d(iv) sub-fields ARE built/emitted by 70_sec_gen.js (baeReturn/baeYes/baeNo ->
         115BAEReturnFiling_24_25 / OptingTaxation115BAEYes / OptingTaxation115BAENo). */
  A(53,FS["115BAEReturnFiling_24_25"]!=="N"||FS.OptingTaxation115BAENo==="Y"||FS.OptingTaxation115BAENo==="N",
    "Part A-General: the manufacturing co-operative society was not required to file a return for AY 2024-25 and AY 2025-26 — the option u/s 115BAE at A19 d(iv) must be selected.");
  /* 54 — a manufacturing co-operative society that WAS required to file a return in AY 2024-25 or
         AY 2025-26 (A19 d(iv): 115BAEReturnFiling_24_25="Y") must fill the 115BAE option for that
         branch (OptingTaxation115BAEYes, "have you exercised the option in AY 24-25/25-26"). */
  A(54,FS["115BAEReturnFiling_24_25"]!=="Y"||FS.OptingTaxation115BAEYes==="Y"||FS.OptingTaxation115BAEYes==="N",
    "Part A-General: the manufacturing co-operative society was required to file a return for AY 2024-25 or AY 2025-26 — the option u/s 115BAE at A19 d(iv) must be selected.");
  /* 55 — NOT MAPPABLE: 'Return cannot be submitted u/s 139(1) after the due date' needs the actual
         submission (system) date compared to the due date; there is no filing-date leaf in the
         return schema, so this is a runtime check, not encodable offline. */

  /* 56 — due date 31-Oct selected ⇒ Schedule IF (built independently from S.other.if) is present,
         OR any applicable audit obligation exists in Part A Gen: 44AB (b), 92E (di), other IT-Act
         reports d(iii) (AuditDetails[]), or audit under another Act, item e (AuditReportDetails[]).
         (AuditedByAccountantFlg is a dead arm — gen.js emits it only inside if(44AB="Y"); the
         PartnerInFirmFlg proxy is dropped in favour of testing ScheduleIF directly. Schedule 5A /
         Portuguese-Civil-Code apportionment is not built in ITR-5.) */
  A(56,due!=="2026-10-31"||!!I.ScheduleIF||G2.LiableSec44ABflg==="Y"||G2.LiableSec92Eflg==="Y"||(RG(G2,"AuditDetails",[])||[]).length>0||(RG(G2,"AuditReportDetails",[])||[]).length>0,
    "Part A-General: due date 31 October is selected — fill Schedule IF (partner in firm), or the audit details (44AB / 92E / other IT-Act report / audit under another Act) in Part A General.");

  /* 57 — due date 30-Nov selected ⇒ Schedule IF present or any applicable audit obligation exists
         (same broadened test as 56). (5A not built.) */
  A(57,due!=="2026-11-30"||!!I.ScheduleIF||G2.LiableSec44ABflg==="Y"||G2.LiableSec92Eflg==="Y"||(RG(G2,"AuditDetails",[])||[]).length>0||(RG(G2,"AuditReportDetails",[])||[]).length>0,
    "Part A-General: due date 30 November is selected — fill Schedule IF (partner in firm), or the audit details (44AB / 92E / other IT-Act report / audit under another Act) in Part A General.");

  /* 58 — due date 31-Aug can be selected only if there is income from business/profession. */
  A(58,due!=="2026-08-31"||FS.IncFrmBusOrProf==="Y",
    "Part A-General: due date 31 August can be selected only if you have income from business or profession.");

  /* 59 — NOT MAPPABLE: the tax regime must not be changed in a revised return filed after the
         original due date — needs the original return's regime (external DB), not in this return. */
  /* 60 — NOT MAPPABLE: the tax regime cannot be changed after the due date of filing — needs the
         prior/original return's regime and its filing date (external DB), not encodable here. */

  /* 61 — business income ⇒ the regime answer at A19(b)(I) must be answered.
         62 — no business income ⇒ the regime answer at A19(di)(II) must be answered.
         (Best-effort: A19(b)/(di) is the regime opt question OptOldRegimeCurrAY, which the builder
         always populates Y/N; encoded as a presence check, guarded on the General block, so it never
         false-fires on absent data.) */
  if(I.PartA_GEN1){
    A(61,!bizDeclared||FS.OptOldRegimeCurrAY==="Y"||FS.OptOldRegimeCurrAY==="N",
      "Part A-General: in case of business income, the regime option at Sl.No. A19(b)(I) must be answered.");
    A(62,bizDeclared||FS.OptOldRegimeCurrAY==="Y"||FS.OptOldRegimeCurrAY==="N",
      "Part A-General: in case of no business income, the regime option at Sl.No. A19(di)(II) must be answered.");
  }

  /* 63 — 'filed 10-IEA within due date for an earlier AY (old regime)?' = Yes ⇒ its acknowledgement
         number and assessment year are mandatory. */
  A(63,FS.Form10IEAEarlierAYOldRegime!=="Y"||(!!FS.Form10IEAEarlierAYAckOldRegime&&!!FS.Form10IEAAssYear),
    "Part A-General: Form 10-IEA (earlier-AY, old regime) is 'Yes' — its acknowledgement number and assessment year are mandatory.");

  /* 64 — re-entered the new regime by 10-IEA in an earlier subsequent AY = Yes ⇒ its ack and AY. */
  A(64,FS.F10IEAEarlierAYNewRegime!=="Y"||(!!FS.Form10IEAEarlierAYAckNewRegime&&!!FS.AssYrF10IEANewTaxReg),
    "Part A-General: Form 10-IEA filed to re-enter the new regime in an earlier year is 'Yes' — its acknowledgement number and assessment year are mandatory.");

  /* 65 — opted old earlier (10-IEA), not re-entered earlier, now in new regime (business) ⇒ the
         current-AY re-entry answer is mandatory. */
  A(65,!(newR&&hasBP&&FS.Form10IEAEarlierAYOldRegime==="Y"&&FS.F10IEAEarlierAYNewRegime!=="Y")||!!FS.F10IEACurrAYNewRegime,
    "Part A-General: Form 10-IEA was not filed with the re-enter option for an earlier year — answer 'Have you furnished Form 10-IEA for re-entering the new regime in the current AY?'.");

  /* 66 — Form 10-IEA furnished to re-enter the new regime in the current AY ⇒ date + ack mandatory. */
  A(66,FS.F10IEACurrAYNewRegime!=="Y"||(!!FS.F10IEADateCurrAYNewTax&&!!FS.F10IEAAckNoCurrAYNewTax),
    "Part A-General: Form 10-IEA furnished to re-enter the new regime in the current AY — its date and acknowledgement number are mandatory.");

  /* 67 — Form 10-IEA NOT filed in the current AY to re-enter the new regime, but its details present. */
  A(67,FS.F10IEACurrAYNewRegime==="Y"||(!FS.F10IEADateCurrAYNewTax&&!FS.F10IEAAckNoCurrAYNewTax),
    "Part A-General: Form 10-IEA is not filed in the current AY to re-enter the new regime — its date/acknowledgement number must not be provided.");

  /* 68 — a business filer opting the old regime for the current AY must answer 'Have you furnished
         Form 10-IEA within due date for the current AY for the old regime?'. */
  A(68,FS.OptOldRegimeCurrAY!=="Y"||!hasBP||FS.F10IEACurrAYOldRegime==="Y"||FS.F10IEACurrAYOldRegime==="N",
    "Part A-General: answer 'Have you furnished Form 10-IEA within due date for the current AY for choosing the old tax regime?'.");

  /* 69 — Form 10-IEA details (date + ack) are mandatory for opting the old regime in the current AY. */
  A(69,FS.F10IEACurrAYOldRegime!=="Y"||(!!FS.F10IEADateCurrAYOldTax&&!!FS.F10IEAAckNoCurrAYOldTax),
    "Part A-General: Form 10-IEA details (date and acknowledgement number) are mandatory for opting the old tax regime in the current AY.");

  /* 70 — Form 10-IEA (current-AY, old regime) details must not be provided if it was not filed. */
  A(70,FS.F10IEACurrAYOldRegime==="Y"||(!FS.F10IEADateCurrAYOldTax&&!FS.F10IEAAckNoCurrAYOldTax),
    "Part A-General: Form 10-IEA date/acknowledgement number should not be provided when Form 10-IEA is not filed for the current AY.");

  /* 71 — earlier-AY (old regime) 10-IEA details only if 'filed 10-IEA within due date for an earlier
         AY for the old regime?' = Yes. */
  A(71,FS.Form10IEAEarlierAYOldRegime==="Y"||(!FS.Form10IEAEarlierAYAckOldRegime&&!FS.Form10IEAAssYear),
    "Part A-General: Form 10-IEA earlier-year (old regime) details are to be provided only if that earlier-AY question is 'Yes'.");

  /* 72 — earlier-AY (re-entry into new regime) 10-IEA details only if that re-entry question = Yes. */
  A(72,FS.F10IEAEarlierAYNewRegime==="Y"||(!FS.Form10IEAEarlierAYAckNewRegime&&!FS.AssYrF10IEANewTaxReg),
    "Part A-General: Form 10-IEA earlier-year (re-entry into new regime) details are to be provided only if that re-entry question is 'Yes'.");

  /* ================= Part A - General : addresses / partners / trust ================= */

  /* 73 — secondary address is mandatory when 'Is the secondary address same as primary?' = No. */
  (function(){const AA=RG(OFI,"AlternateAddress",{})||{};
    A(73,OFI.SecondaryAdd!=="N"||(!!AA.ResidenceNo&&!!AA.LocalityOrArea&&!!AA.CityOrTownOrDistrict&&!!AA.StateCode),
      "Part A-General: secondary address is mandatory when 'Is the secondary address same as primary address?' is 'No'.");})();

  /* 74 — the secondary address must not be the same as the primary when the flag is 'No'. */
  (function(){const AA=RG(OFI,"AlternateAddress",{})||{},PA=RG(OFI,"Address",{})||{};
    const K=["ResidenceNo","ResidenceName","RoadOrStreet","LocalityOrArea","CityOrTownOrDistrict","StateCode","CountryCode","PinCode","ZipCode"];
    A(74,OFI.SecondaryAdd!=="N"||K.some(k=>String(AA[k]==null?"":AA[k])!==String(PA[k]==null?"":PA[k])),
      "Part A-General: the secondary address should not be the same as the primary address when 'Is the secondary address same as primary address?' is 'No'.");})();

  /* 75 — a 10-IEA regime option (d(i)) is selected ⇒ business income is mandatory (IncFrmBusOrProf=Yes). */
  A(75,!(FS.F10IEACurrAYOldRegime==="Y"||FS.Form10IEAEarlierAYOldRegime==="Y"||FS.F10IEAEarlierAYNewRegime==="Y"||FS.F10IEACurrAYNewRegime==="Y")||FS.IncFrmBusOrProf==="Y",
    "Part A-General: a Form 10-IEA option is selected at Sl.No. A19(di) — business income is mandatory ('Do you have income from business or profession?' = Yes).");

  /* 76 — details of admitted/retired partners required if 'change during the year in partners/members' = Yes. */
  A(76,G2.PrevYrMemPartChange!=="Y"||(RG(G2,"PrevYrMemPart.PrevYrMemPartDtls",[])||[]).length>0,
    "Part A-General(2): 'Whether there was any change during the previous year in the partners/members' is 'Yes' — details of admitted/retired partners must be provided.");

  /* 77–80 — private discretionary trust, Section F (only when the trust block is present). */
  (function(){const T=RG(G2,"PvtDiscretioneryTrust",null);if(!T||typeof T!=="object")return;
    const f1=T.PvtDiscTrustShareFlg,f2=T.PvtDiscTrustBusIncFlg,f3=T.PvtDiscTrustWillFlg;
    const f4=[T.PvtDiscTrustBasicFlg,T.PvtDiscTrustReceivableFlg,T.PvtDiscTrustRelativesFlg,T.PvtDiscTrustBusProfFlg];
    /* 77 — answer to F(3) mandatory if F(2) is 'Yes'. */
    A(77,f2!=="Y"||!!f3,"Part A-General(2): answer to Sl.No. F(3) is mandatory when F(2) is 'Yes'.");
    /* 78 — F(3) must be blank/null if F(2) is 'No'. */
    A(78,f2!=="N"||!f3,"Part A-General(2): Sl.No. F(3) should be blank when F(2) is 'No'.");
    /* 79 — items (i)–(iv) of F(4) mandatory if F(1) and F(2) are both 'No'. */
    A(79,!(f1==="N"&&f2==="N")||f4.every(x=>!!x),"Part A-General(2): answers to items (i)–(iv) of Sl.No. F(4) are mandatory when F(1) and F(2) are both 'No'.");
    /* 80 — items (i)–(iv) of F(4) must be blank if F(1) or F(2) is 'Yes'. */
    A(80,!(f1==="Y"||f2==="Y")||f4.every(x=>!x),"Part A-General(2): answers to items (i)–(iv) of Sl.No. F(4) should be blank when F(1) or F(2) is 'Yes'.");})();

  /* ================= Part A - BS (Balance Sheet · PARTA_BS) ================= */
  if(I.PARTA_BS){const BS=I.PARTA_BS,FSc=RG(BS,"FundSrc",{})||{},FAp=RG(BS,"FundApply",{})||{};
    const PMF=RG(FSc,"PartnerOrMemberFund",{})||{},LF=RG(FSc,"LoanFunds",{})||{},ADV=RG(FSc,"Advances",{})||{};
    const INV=RG(FAp,"Investments",{})||{},CAL=RG(FAp,"CurrAssetLoanAdv",{})||{},CA=RG(CAL,"CurrAsset",{})||{};
    /* 81 — Sources of funds (5) must equal Total application of funds (5). */
    A(81,REQ(FSc.TotFundSrc,FAp.TotFundApply),"Part A-BS: 'Sources of funds' (5) must equal 'Total application of funds' (5).");
    /* 82 — 1c = 1a + 1bvi. */
    A(82,REQ(PMF.TotPartnerOrMemberFund,N(PMF.PartnerOrMemberCap)+N(RG(PMF,"ResrNSurp.TotResrNSurp"))),
      "Part A-BS: Sl.No. 1c (total partners'/members' fund) must equal 1a + 1bvi.");
    /* 83 — 2c (loan funds) = aiii + biii. */
    A(83,REQ(LF.TotLoanFund,N(RG(LF,"SecrLoan.TotSecrLoan"))+N(RG(LF,"UnsecrLoan.TotUnSecrLoan"))),
      "Part A-BS: Sl.No. 2c (total loan funds) must equal 2aiii + 2biii.");
    /* 84 — Sources 5 = 1c + 2c + 3 + 4iii. */
    A(84,REQ(FSc.TotFundSrc,N(PMF.TotPartnerOrMemberFund)+N(LF.TotLoanFund)+N(FSc.DeferredTax)+N(ADV.TotalAdvances)),
      "Part A-BS: Sl.No. 5 (sources of funds) must equal 1c + 2c + 3 + 4iii.");
    /* 85 — investments 2c = aviii + bvii. */
    A(85,REQ(INV.TotInvestments,N(RG(INV,"LongTermInv.TotLongTermInv"))+N(RG(INV,"ShortTermInv.TotShortTermInv"))),
      "Part A-BS: Sl.No. 2c (total investments) must equal 2aviii + 2bvii.");
    /* 86 — total current assets 3av = iH + iiC + iiiD + aiv. */
    A(86,REQ(CA.TotCurrAsset,N(RG(CA,"Inventories.TotInventries"))+N(RG(CA,"SundryDebtorDtls.TotalSundryDebtors"))+N(RG(CA,"CashOrBankBal.TotCashOrBankBal"))+N(CA.OthCurrAsset)),
      "Part A-BS: Sl.No. 3av (total current assets) must equal 3a(iH + iiC + iiiD + aiv).");
    /* 87 — net current assets 3e = 3c − 3diii. */
    A(87,REQ(CAL.NetCurrAsset,N(CAL.TotCurrAssetLoanAdv)-N(RG(CAL,"CurrLiabilitiesProv.TotCurrLiabilitiesProvision"))),
      "Part A-BS: Sl.No. 3e (net current assets) must equal 3c − 3diii.");
    /* 88 — application 5 = 1e + 2c + 3e + 4d. */
    A(88,REQ(FAp.TotFundApply,N(RG(FAp,"FixedAsset.TotFixedAsset"))+N(INV.TotInvestments)+N(CAL.NetCurrAsset)+N(RG(FAp,"MiscAdjust.TotMiscAdjust"))),
      "Part A-BS: Sl.No. 5 (total application of funds) must equal 1e + 2c + 3e + 4d.");
  }

  /* ================= Part A - Manufacturing Account ================= */
  if(I.ManufacturingAccount){const M=I.ManufacturingAccount,OP=RG(M,"OpeningInventory",{})||{},CS=RG(M,"ClosingStock",{})||{};
    /* 89 — Opening inventory total 1Aiii = 1Ai + 1Aii. */
    A(89,REQ(OP.OpngInvntryTotal,N(OP.OpngStckRawMat)+N(OP.OpngStckWrkinPrgrs)),
      "Part A-Manufacturing: Sl.No. 1Aiii (total opening inventory) must equal 1Ai + 1Aii.");
    /* 90 — direct expenses 1D = 1Di + 1Dii + 1Diii. */
    A(90,REQ(OP.DirectExpenses,N(OP.CarriageInward)+N(OP.PowerAndFuel)+N(OP.OthDirectExpenses)),
      "Part A-Manufacturing: total direct expenses (1D) must equal 1Di + 1Dii + 1Diii.");
    /* 91 — factory overheads 1Evii = Ei + Eii + Eiii + Eiv + Ev + Evi. */
    A(91,REQ(OP.TotalFactoryOverheads,N(OP.IndirectWages)+N(OP.FactoryRentAndRates)+N(OP.FactoryInsurance)+N(OP.FactoryFuelAndPower)+N(OP.FactoryGeneralExpenses)+N(OP.DeprctnOfFactoryMachinery)),
      "Part A-Manufacturing: total factory overheads (1Evii) must equal 1Ei + 1Eii + 1Eiii + 1Eiv + 1Ev + 1Evi.");
    /* 92 — debits to manufacturing account 1F = Aiii + B + C + D + Evii. */
    A(92,REQ(OP.TotalDebtsManfctrngAcc,N(OP.OpngInvntryTotal)+N(OP.Purchases)+N(OP.DirectWages)+N(OP.DirectExpenses)+N(OP.TotalFactoryOverheads)),
      "Part A-Manufacturing: total debits (1F) must equal 1Aiii + B + C + D + 1Evii.");
    /* 93 — closing stock total 2 = 2i + 2ii. */
    A(93,REQ(CS.ClsngStckTotal,N(CS.ClsngStckRawMaterial)+N(CS.ClsngStckWrkInPrgrs)),
      "Part A-Manufacturing: total closing stock (2) must equal 2i + 2ii.");
    /* 94 — cost of goods produced 3 = 1F − 2. */
    A(94,REQ(M.CostOfGoodsPrdcd,N(OP.TotalDebtsManfctrngAcc)-N(CS.ClsngStckTotal)),
      "Part A-Manufacturing: cost of goods produced (3) must equal 1F − 2.");
    /* 95 — negative values are not allowed in item 1 and item 2. */
    A(95,noNeg(OP)&&noNeg(CS),
      "Part A-Manufacturing: negative values are not allowed in Sl.No. 1 and Sl.No. 2.");
  }

  /* ================= Part A - Trading Account ================= */
  if(I.TradingAccount){const T=I.TradingAccount,EC=RG(T,"ExciseCustomsVAT",{})||{};
    /* 96 — 4A(iii) total must equal the sum of its other-operating-revenue rows.
       (ITR-5 uses the OtherOperatingRevenueDtls[] array in place of fixed 4Aiii(a)/(b).) */
    A(96,REQ(T.OperatingRevenueTotal,RSUM(RG(T,"OtherOperatingRevenueDtls",[]),"OperatingRevenueAmt")),
      "Part A-Trading: Sl.No. 4A(iii) total other operating revenues must equal the sum of the individual rows.");
    /* 97 — 4A(iv) = 4A(i) + 4A(ii) + 4A(iiic). */
    A(97,REQ(T.SalesGrossReceiptsTotal,N(T.SaleOfGoods)+N(T.SaleOfServices)+N(T.OperatingRevenueTotal)),
      "Part A-Trading: Sl.No. 4A(iv) must equal 4A(i) + 4A(ii) + 4A(iiic).");
    /* 98 — 4C(ix) = 4Ci + … + 4Cviii. */
    A(98,REQ(EC.TotExciseCustomsVAT,N(EC.UnionExciseDuty)+N(EC.ServiceTax)+N(EC.VATorSaleTax)+N(EC.CentralGoodServiceTax)+N(EC.StateGoodServiceTax)+N(EC.IntegratedGoodServiceTax)+N(EC.UnionTerrGoodServiceTax)+N(EC.OthDutyTaxCess)),
      "Part A-Trading: Sl.No. 4C(ix) must equal 4Ci + 4Cii + 4Ciii + 4Civ + 4Cv + 4Cvi + 4Cvii + 4Cviii.");
    /* 99 — 4D (total revenue from operations) = Aiv + B + Cix. */
    A(99,REQ(T.TotRevenueFrmOperations,N(T.SalesGrossReceiptsTotal)+N(T.GrossRcptFromProfession)+N(EC.TotExciseCustomsVAT)),
      "Part A-Trading: Sl.No. 4D (total revenue from operations) must equal 4A(iv) + 4B + 4C(ix).");
    /* 100 — item 9 (direct expenses total) = 9i + 9ii + 9iii. */
    A(100,REQ(T.DirectExpenses,N(T.CarriageInward)+N(T.PowerAndFuel)+N(T.DirectExpensesTotal)),
      "Part A-Trading: Sl.No. 9 (total direct expenses) must equal 9i + 9ii + 9iii.");
  }
});
