/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_01 (Phase 6).
   Serial range A1–A56 (Part A General + Part A Balance Sheet, regular).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{})/ N()); nothing throws. Keys are the built-return ITR6 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths were taken
   from sources/ITR-6 schema, books/ITR-6/BALANCE_SHEET.md and the built
   sections (70_sec_who / 70_sec_gen / 70_sec_accounts). Encoded from each
   rule's own text (constitution rule 6).

   Serials in A1–A56 NOT encoded here, and why (they stay MISSING=0 in the
   census as ENFORCED-target, to be finished in the fan-out — not faked):
     A29  — 44AB liability from the a2i "Yes" + a2ii/a2iii "No" combination
            (multi-branch enum derivation).
     A33/A34/A36/A37 — due-date (30-Nov vs 31-Oct) and cash-%-to-audit
            derivations spanning Schedule IF / 92E audit / turnover band.
     A39  — needs Schedule OS §115AD(1)(i) income (cross-schedule).
     A52/A54 — deep Balance-Sheet current-asset sub-totals (2Aviii current
            investments 7-way, 2Dv cash 4-way); component leaf keys to be
            wired with the CurrInvstmnts/CashNCashEquivalents sub-items.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */

  /* ---- Part A General reads ---- */
  const OF=RG(I,"PartA_GEN1.OrgFirmInfo",{})||{};
  const ADDR=RG(OF,"Address",{})||{};
  const ALT=RG(OF,"AlternateAddress",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2For6",{})||{};
  const AUD=RG(G2,"AuditInfo",{})||{};
  const REP=RG(FS,"AssesseeRep",{})||{};
  const sec=String(RG(FS,"ReturnFileSec.IncomeTaxSec",""));
  const doi=OF.DateOFFormOrIncorp, doc=OF.DateofBusCommencement;
  const opted115=S0(FS.Section115BA)&&FS.Section115BA!=="NA"; /* opted 115BA/BAA/BAB */

  /* A1 — India (Address country 91) ⇒ mobile must be exactly 10 digits. */
  const mob=String(ADDR.MobileNo==null?"":ADDR.MobileNo).replace(/\D/g,"");
  A(1, ADDR.CountryCode!=="91" || mob==="" || mob.length===10,
    "Part A General: with country India the mobile number must be exactly 10 digits.");

  /* A3 — liable u/s 44AB and accounts audited by an accountant ⇒ auditor
     name, PAN, audit-report date and acknowledgement number must be given. */
  A(3, G2.LiableSec44ABflg!=="Y" || G2.AuditedByAccountantFlg!=="Y" ||
      (S0(AUD.AudFrmName)&&S0(AUD.AudFrmPAN)&&S0(AUD.AuditReportFurnishDate)&&S0(AUD.AckNum44AB)),
    "Part A General: audit u/s 44AB with accounts audited — auditor name, PAN, audit-report date and acknowledgement number are mandatory.");

  /* A4 — "declaring income only u/s 44AE/44B/…/44D" (IncDclrdUs) cannot be blank. */
  A(4, S0(G2.IncDclrdUs),
    "Part A General: the flag 'declaring income only u/s 44AE/44B/44BB/44BBA/44BBB/44BBC/44BBD/44D' (a) cannot be blank.");

  /* A5 — if that flag is No, the turnover range a2i cannot be blank. */
  A(5, G2.IncDclrdUs!=="N" || S0(G2.TotalSalesExcOneCr),
    "Part A General: a2i (range of total sales/turnover/gross receipts) cannot be blank when income is not declared only under the presumptive sections.");

  /* A6 — a2i = "More than ₹1cr up to ₹10cr" ⇒ a2ii (receipts in cash %) not blank. */
  A(6, G2.TotalSalesExcOneCr!=="Upto10CR" || S0(G2.AgrOFAllAmtsRcvd),
    "Part A General: a2ii (percentage of receipts in cash) cannot be blank when a2i is 'More than ₹1 crore and up to ₹10 crores'.");

  /* A7 — a2i = "More than ₹1cr up to ₹10cr" ⇒ a2iii (payments in cash %) not blank. */
  A(7, G2.TotalSalesExcOneCr!=="Upto10CR" || S0(G2.AgrOFAllPayMade),
    "Part A General: a2iii (percentage of payments in cash) cannot be blank when a2i is 'More than ₹1 crore and up to ₹10 crores'.");

  /* A9 — foreign company ⇒ section 115BA/115BAA/115BAB is not applicable. */
  A(9, OF.DomesticCompFlg!=="N" || !S0(FS.Section115BA) || FS.Section115BA==="NA",
    "Part A General: a foreign company cannot opt for section 115BA/115BAA/115BAB.");

  /* A11 — a domestic company cannot be a non-resident. */
  A(11, OF.DomesticCompFlg!=="Y" || FS.ResidentialStatus!=="NRI",
    "Part A General: a domestic company cannot be a non-resident.");

  /* A13 — Ind-AS financial statements (FinancialStmtFlag = Y) ⇒ the regular
     Manufacturing/Trading accounts cannot be filled (Ind-AS ones are used). */
  A(13, FS.FinancialStmtFlag!=="Y" || (!I.ManufacturingAccount && !I.TradingAccount),
    "Part A General: with financial statements drawn per Ind-AS, the regular Manufacturing/Trading/P&L/Balance-sheet cannot be filled — use the Ind-AS statements.");

  /* A14 — non-Ind-AS (FinancialStmtFlag = N) ⇒ the Ind-AS accounts cannot be filled. */
  A(14, FS.FinancialStmtFlag!=="N" || (!I.ManufacturingAccountIndAS && !I.TradingAccountIndAS),
    "Part A General: with financial statements not drawn per Ind-AS, the Ind-AS Manufacturing/Trading/P&L/Balance-sheet cannot be filled.");

  /* A15 — opted 115BA/BAA/BAB ⇒ AY, date of filing and acknowledgement no. mandatory. */
  A(15, !opted115 || (S0(FS.Section115BAAY)&&S0(FS["115BAFormFiledDate"])&&S0(FS.ReceiptNo115BA)),
    "Part A General: having opted for section 115BA/115BAA/115BAB, the assessment year, date of filing and acknowledgement number are mandatory.");

  /* A16 — choosing to opt this year ⇒ section, date of filing and ack no. mandatory. */
  A(16, FS.Section115CurrAY!=="Y" || (S0(FS.SectionCurrAY)&&S0(FS.Section115CurrAYDate)&&S0(FS.Section115CurrAYRecNo)),
    "Part A General: choosing to opt for section 115BA/115BAA/115BAB this year — the section, date of filing and acknowledgement number are mandatory.");

  /* A17 — already opted ⇒ cannot also select "opting this year". */
  A(17, !opted115 || FS.Section115CurrAY!=="Y",
    "Part A General: having already opted for section 115BA/115BAA/115BAB, 'opting this year' cannot be selected.");

  /* A18 — Schedule 115AD(1)(b)(iii)-Proviso filled ⇒ FII/FPI flag must be Yes. */
  A(18, !I.Schedule115AD || FS.FiiFpiFlag==="Y",
    "Part A General: 'Whether you are FII / FPI?' must be Yes to fill Schedule 115AD(1)(b)(iii)-Proviso.");

  /* A19 — filed in response to a notice/order ⇒ DIN/unique number and date mandatory. */
  const notice=["13","14","16","18","19","20","41"].indexOf(sec)>=0;
  A(19, !notice || (S0(FS.UniqueNumNoticeUs)&&S0(FS.NoticeDateUnderSec)),
    "Part A General: filed under 139(9)/142(1)/148/153C/119(2)(b)/170A/92CD — the unique number/DIN and the date of the notice/order are mandatory.");

  /* A20 — date of commencement not before incorporation and not after FY-end 31-03-2026. */
  A(20, !S0(doc) || (S0(doi) && doc>=doi && doc<="2026-03-31"),
    "Part A General: date of commencement of business must not be before the date of incorporation and not after 31/03/2026.");

  /* A21 — 'recognized as MSME?' must be answered Yes or No. */
  A(21, S0(FS.ifMSME),
    "Part A General: 'whether you are recognized as MSME?' must be answered Yes or No.");

  /* A22 — MSME = Yes ⇒ registration number mandatory. */
  A(22, FS.ifMSME!=="Y" || S0(FS.RegNumMSMEDAct2006),
    "Part A General: MSME registration number is mandatory when recognized as MSME.");

  /* A23 — liable for audit u/s 44AB ⇒ acknowledgement number mandatory. */
  A(23, G2.LiableSec44ABflg!=="Y" || S0(AUD.AckNum44AB),
    "Part A General: the acknowledgement number is mandatory when liable for audit u/s 44AB.");

  /* A24 — accounts audited u/s 92E ⇒ acknowledgement number mandatory. */
  A(24, G2.LiableSec92Eflg!=="Y" || S0(RG(G2,"AuditDetails92E.AckNum92E")),
    "Part A General: the acknowledgement number is mandatory when accounts are audited u/s 92E.");

  /* A25 — liable to furnish other audit report under the Act ⇒ each row's ack no. mandatory. */
  const oadt=RG(G2,"AuditDetails",[])||[];
  A(25, G2.AccountAuditFlag!=="Y" || (oadt.length>0 && oadt.every(r=>S0(r&&r.AckNumOth))),
    "Part A General: the acknowledgement number is mandatory for every other audit report to be furnished under the Income-tax Act.");

  /* A27 — a2ii "More than 5%" (receipts in cash) ⇒ liable to audit u/s 44AB. */
  A(27, G2.AgrOFAllAmtsRcvd!=="MoreThan5Per" || G2.LiableSec44ABflg==="Y",
    "Part A General: selecting a2ii 'More than 5%' makes you liable to audit u/s 44AB — set the 44AB flag to Yes.");

  /* A28 — a2iii "More than 5%" (payments in cash) ⇒ liable to audit u/s 44AB. */
  A(28, G2.AgrOFAllPayMade!=="MoreThan5Per" || G2.LiableSec44ABflg==="Y",
    "Part A General: selecting a2iii 'More than 5%' makes you liable to audit u/s 44AB — set the 44AB flag to Yes.");

  /* A30 — 115BAB ⇒ incorporation and commencement on or after 01/10/2019. */
  A(30, FS.Section115BA!=="115BAB" || (S0(doi)&&doi>="2019-10-01" && (!S0(doc)||doc>="2019-10-01")),
    "Part A General: to claim section 115BAB the dates of incorporation and commencement must be on or after 01/10/2019.");

  /* A31 — 115BA ⇒ incorporation and commencement on or after 01/03/2016. */
  A(31, FS.Section115BA!=="115BA" || (S0(doi)&&doi>="2016-03-01" && (!S0(doc)||doc>="2016-03-01")),
    "Part A General: to claim section 115BA the dates of incorporation and commencement must be on or after 01/03/2016.");

  /* A32 — any Business-organisation row filled ⇒ all fields (except PAN and
     date of event) are mandatory for that row. */
  (RG(G2,"BusOrganisation",[])||[]).forEach(function(r,i){
    if(!r) return; const z=RG(r,"AddressDetailWithZipCode",{})||{};
    const filled=S0(r.BusOrgType)||S0(r.CompName)||S0(r.BusOrgPAN)||S0(r.DateOfBusinessOrg)||S0(z.AddrDetail);
    A(32, !filled || (S0(r.BusOrgType)&&S0(r.CompName)&&S0(z.AddrDetail)&&S0(z.CityOrTownOrDistrict)&&S0(z.StateCode)&&S0(z.CountryCode)&&S0(z.PinCode)),
      "Part A General: business organisation row "+(i+1)+" — every field except PAN and date of event is mandatory once the row is used.");
  });

  /* A38 — representative's email and contact must differ from the taxpayer's primary. */
  A(38, FS.AsseseeRepFlg!=="Y" ||
      ((!S0(REP.RepEmailID)||REP.RepEmailID!==ADDR.EmailAddress) &&
       (!S0(REP.RepMobileNo)||String(REP.RepMobileNo)!==String(ADDR.MobileNo))),
    "Part A General: the representative's email id and contact number must not be the same as the taxpayer's primary email and contact.");

  /* A40 — the secondary-address flag must be provided. */
  A(40, S0(OF.SecondaryAdd),
    "Part A General: the secondary address (same-as-primary?) must be provided.");

  /* A41 — secondary address marked "not same as primary" ⇒ it must actually differ. */
  A(41, OF.SecondaryAdd!=="N" ||
      (S0(ALT.CityOrTownOrDistrict) && !(ALT.ResidenceNo===ADDR.ResidenceNo && ALT.RoadOrStreet===ADDR.RoadOrStreet
        && ALT.LocalityOrArea===ADDR.LocalityOrArea && ALT.CityOrTownOrDistrict===ADDR.CityOrTownOrDistrict && ALT.PinCode===ADDR.PinCode)),
    "Part A General: the secondary address must not be the same as the primary address when 'same as primary' is No.");

  /* A42 — liable for audit u/s 44AB ⇒ Balance Sheet and P&L cannot be blank. */
  A(42, G2.LiableSec44ABflg!=="Y" ||
      (N(RG(I,"PARTA_BSFor6FrmAY13.TotalAssets"))>0 || N(RG(I,"PARTA_BSIndAS.TotalAssets"))>0 ||
       N(RG(I,"PARTA_PL.DebitsToPL.DebitPlAcnt.PBT"))!==0 || N(RG(I,"PARTA_PL.CreditsToPL.TotCreditsToPL"))>0 ||
       N(RG(I,"PARTA_PLIndAS.CreditsToPL.TotCreditsToPL"))>0),
    "Part A Balance Sheet: when liable for audit u/s 44AB the Balance Sheet and P&L cannot be blank.");

  /* =====================================================================
     Part A — BALANCE SHEET (regular, PARTA_BSFor6FrmAY13). Arithmetical
     checks. REQ(a,b) is |a−b| ≤ 1; a zero-skeleton foots 0==0 so an empty
     return never fires. Keys/formulae from books/ITR-6/BALANCE_SHEET.md.
     ===================================================================== */
  const BS=RG(I,"PARTA_BSFor6FrmAY13",{})||{};
  const EL=RG(BS,"EquityAndLiablities",{})||{};
  const AS=RG(BS,"Assets",{})||{};
  const SAM=RG(EL,"ShareAppMoneyAllot",{})||{};
  const NCL=RG(EL,"NonCurrLiabilities",{})||{};
  const CL=RG(EL,"CurrentLiabilities",{})||{};
  const NCA=RG(AS,"NonCurrAssets",{})||{};
  const CA=RG(AS,"CurrentAssets",{})||{};
  const NCI=RG(NCA,"NonCurrInvstmnts",{})||{};
  const FA=RG(NCA,"FixedAsset",{})||{};

  /* A43 — Total of Equity & Liabilities must equal Total Assets. */
  A(43, REQ(BS.TotalAssets, EL.TotEquityAndLiabilities),
    "Part A-BS: Total of Equity & Liabilities must equal Total Assets.");

  /* A44 — 1Bix Total non-current investments = i + iic + iii + … + viii. */
  A(44, REQ(NCI.TotNonCurrInvstmnts, N(NCI.InvInProperty)+N(RG(NCI,"EquityInstruments.Total"))
      +N(NCI.PreferenceShares)+N(NCI.GovtOrTrustSecurities)+N(NCI.DebenturesOrBonds)+N(NCI.MutualFunds)
      +N(NCI.InvstmntInPrtnrShipFirm)+N(NCI.OtherInvstmnts)),
    "Part A-BS: 1Bix (total non-current investments) must equal the sum of its rows i to viii.");

  /* A45 — 2iii Share application money = 2i + 2ii. */
  A(45, REQ(SAM.Total, N(SAM.PendingLtOneYr)+N(SAM.PendingMtOneYr)),
    "Part A-BS: 2iii must equal 2i + 2ii.");

  /* A46 — 3E Total non-current liabilities = 3A + 3B + 3C + 3D. */
  A(46, REQ(NCL.TotalNonCurrLiabilites, N(RG(NCL,"LongTermBorrowings.TotalLTBorrowings"))
      +N(NCL.NetDefferedTaxLiability)+N(RG(NCL,"OthLongTermLiablities.TotalOthLtLiabilities"))
      +N(RG(NCL,"LongTermProvisions.Total"))),
    "Part A-BS: 3E must equal 3A + 3B + 3C + 3D.");

  /* A47 — 4E Total current liabilities = 4Avi + 4Biii + 4Cxi + 4Dvi. */
  A(47, REQ(CL.TotCurrLiabilitiesProvision, N(RG(CL,"ShortTrmBorrowings.TotShortTrmBorrowings"))
      +N(RG(CL,"TradePayables.TotalTradePayables"))+N(RG(CL,"OthCurrLiabilities.TotOthCurrLiabilities"))
      +N(RG(CL,"ShortTermProv.TotShortTermProvisions"))),
    "Part A-BS: 4E must equal 4A + 4B + 4C + 4D.");

  /* A48 — I Total equity & liabilities = MAX(0, 1D + 2iii + 3E + 4E). */
  A(48, REQ(EL.TotEquityAndLiabilities, Math.max(0, N(RG(EL,"ShareHolderFund.TotShareHolderFund"))
      +N(SAM.Total)+N(NCL.TotalNonCurrLiabilites)+N(CL.TotCurrLiabilitiesProvision))),
    "Part A-BS: Total equity and liabilities must equal 1D + 2iii + 3E + 4E.");

  /* A49 — 1Av Total fixed assets = 1(id + iid + iii + iv). */
  A(49, REQ(FA.TotFixedAsset, N(RG(FA,"Tangible.NetBlock"))+N(RG(FA,"InTangible.NetBlock"))
      +N(FA.CapWrkProg)+N(FA.IntangibleAssetUnDev)),
    "Part A-BS: 1Av (total fixed assets) must equal 1id + 1iid + 1iii + 1iv.");

  /* A50 — 1Bix again (total non-current investments = i + iic + iii + … + viii). */
  A(50, REQ(NCI.TotNonCurrInvstmnts, N(NCI.InvInProperty)+N(RG(NCI,"EquityInstruments.Total"))
      +N(NCI.PreferenceShares)+N(NCI.GovtOrTrustSecurities)+N(NCI.DebenturesOrBonds)+N(NCI.MutualFunds)
      +N(NCI.InvstmntInPrtnrShipFirm)+N(NCI.OtherInvstmnts)),
    "Part A-BS: total of non-current investments (1Bix) must equal the sum of its rows.");

  /* A51 — 1F Total non-current assets = Av + Bix + C + Dv + Eiii. */
  A(51, REQ(NCA.TotNonCurrAssets, N(RG(NCA,"FixedAsset.TotFixedAsset"))
      +N(RG(NCA,"NonCurrInvstmnts.TotNonCurrInvstmnts"))+N(NCA.NetDeferredTaxAssets)
      +N(RG(NCA,"LongTrmLoanAdv.TotLTLoanAdv"))+N(RG(NCA,"OthNonCurrAssets.Total"))),
    "Part A-BS: 1F (total non-current assets) must equal Av + Bix + C + Dv + Eiii.");

  /* A53 — 2Ciii Total trade receivables = more-than-6-months + others. */
  const TRc=RG(CA,"TradeReceivables",{})||{};
  A(53, REQ(TRc.TotalTradeReceivables, N(TRc.OSMoreThanSixMonths)+N(TRc.Others)),
    "Part A-BS: 2Ciii must equal 2Ci + 2Cii.");

  /* A55 — 2Eiii Total short-term loans and advances = i + ii. */
  const STL=RG(CA,"TotShortTermLoanAdv",{})||{};
  A(55, REQ(STL.TotShrtTermLoans, N(STL.LoanAdv)+N(STL.Others)),
    "Part A-BS: 2Eiii must equal 2Ei + 2Eii.");

  /* A56 — 2G Total current assets = Aviii + Bviii + Ciii + Dv + Eiii + F. */
  A(56, REQ(CA.TotCurrAssets, N(RG(CA,"CurrInvstmnts.TotCurrInvstmnts"))+N(RG(CA,"Inventories.TotInventries"))
      +N(RG(CA,"TradeReceivables.TotalTradeReceivables"))+N(RG(CA,"CashNCashEquivalents.TotCashNCashEquivalents"))
      +N(RG(CA,"TotShortTermLoanAdv.TotShrtTermLoans"))+N(CA.OtherCurrAssets)),
    "Part A-BS: 2G (total current assets) must equal 2Aviii + 2Bviii + 2Ciii + 2Dv + 2Eiii + 2F.");
});
