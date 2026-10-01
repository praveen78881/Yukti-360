/* =====================================================================
   ITR-6 · Section "al" — Schedule SH-1/SH-2 (shareholding) + Schedule
   AL-1/AL-2 (assets & liabilities). COMPANY return.
   Books: books/ITR-6/{SH_1_AND_SH_2.md, AL_1.md, AL_2.md}
   Schema blocks:
     ScheduleSH.ShrhldngUnlistedCompany  (SH-1, flag SHUnlistedCompanyFlag)
     ScheduleSH.ShrhldngStartUps         (SH-2, no flag — object on rows)
     ScheduleAL.AsstLiabilitiesUnlistedCompany (AL-1, flag ALUnlistedCompanyFlag)
     ScheduleAL.AsstLiabilitiesStartUps        (AL-2, flag ALStartUpsFlag)

   PURE DISCLOSURE. No compute, no feed into Part B-TI / Part B-TTI, and
   nothing feeds in (books §11/§14). The engine only exposes a row count
   for the on-screen summary. Every cell is entered; no derivation.

   Design: state keys are the SCHEMA keys themselves, so export/import is a
   coercion pass over one shared column table (round-trip is identity).
   The share-type / purpose / category enums DIFFER per table (books say
   "seed each from its own list") — each column carries its own opts list.
   Utility typos are reproduced verbatim ("Number of shared" at the
   transferred-shares columns of AL-1 Parts C and D).
   ===================================================================== */

/* ---- dropdown value lists (books §9 / §12 / §11) ------------------ */
const AL_YN=[["Y","Yes"],["N","No"]];                 /* flags filed N/Y; on-screen gates too */

/* --- SH (shareholding) enums --- */
const SH_RES=[["RES","Resident"],["NRI","Non Resident"],["NOR","Resident but not Ordinarily resident"]];
const SH_TYPE_A=[["ES","Equity Shares"],["PS","Preference Shares"],["RS","Rights Shares"],["SS","Sweat Equity Shares"],["BS","Bonus Shares"],["OT","Others"]];  /* SH-1 A, SH-2 A (full six) */
const SH_TYPE_B=[["ES","Equity Shares"],["PS","Preference Shares"],["RS","Rights Shares"],["SS","Sweat Equity Shares"],["OT","Others"]];                        /* SH-1 B, SH-2 B (no Bonus) */
const SH_TYPE_1C=[["ES","Equity Shares"],["PS","Preference Shares"],["BS","Bonus Shares"],["SS","Sweat Equity Shares"]];                                        /* SH-1 C */
const SH_TYPE_2C=[["ES","Equity Shares"],["PS","Preference Shares"],["RS","Rights Shares"],["SS","Sweat Equity Shares"]];                                       /* SH-2 C */
const SH_CAT=[["NRI","non-resident"],["VCP","venture capital company"],["VCF","venture capital fund"],["SPC","specified company"],["OTH","any other person"]];  /* SH-2 category */
const SH_MODE=[["TS","Transfer/Sale"],["RR","Relinquishment of rights"]];

/* --- AL (assets/liabilities) enums --- */
const AL_BO="Persons who were beneficial owners of shares holding not less than 10% of the voting power at any time of the previous year";
const AL_PUR_A=[["GH","Guest House"],["DQ","Director Quarter"],["DU","Director Use"],["SQ","Staff Quarters"],["OO","Own Office"],["RE","Renting"],["LE","Leasing"],["ST","Stock in trade"],["IN","Investment"],["BO",AL_BO]];              /* AL.Purpose (AL-1/AL-2 Part A) */
const AL_PUR_B=[["OO","Own Office"],["FA","Factory"],["WH","Warehouse"],["GD","Godown"],["RE","Renting"],["LE","Leasing"],["ST","Stock in trade"],["IN","Investment"],["BO",AL_BO]];                                                        /* AL1B.PurposeDrp (Part B) */
const AL_PUR_H=[["OU","Own Business Use"],["EU","Employees Use"],["DU","Directors Use"],["ST","Stock in trade"],["IN","Investment"],["RE","Renting"],["LE","Leasing"],["BO",AL_BO]];                                                        /* AL1I.PurposeDrp / AL2H.Drpdwn (vehicles) */
const AL_LISTED_ST=[["ES","Equity Shares"],["BS","Bonus Shares"]];                                                          /* AL-1 Part C share type */
const AL_SECTYPE=[["B","Bonds"],["D","Debentures"],["E","Derivatives"],["P"," Preference Shares"],["O","Others"]];          /* AL-1 Part E — " Preference Shares" leading space verbatim */
const AL_LU=[["L","Listed"],["U","Unlisted"]];
const AL_VEH=[["M","Motor Vehicle"],["A","Aircraft"],["Y","Yacht"],["O","Others"]];
const AL_JEWEL=[["GJ","Gold Jewellery"],["SJ","Silver Jewellery"],["PJ","Platinum Jewellery"],["DJ","Diamond Jewellery"],["OMJ","Other precious metal Jewellery"],["OSJ","Other precious stone Jewellery"],["AC","Archaeological Collections"],["DR","Drawings"],["PA","Paintings"],["SC","Sculptures"],["WA","Work of Art"],["BN","Bullion"],["OT","Others"]];  /* AL1IDropDown (AL-1 Part I) */
const AL_STIN=[["ST","Stock in trade"],["IN","Investment"]];
const AL2_SEC=[["BN","Bonds"],["DB","Debentures"],["DE","Derivatives"],["ES","Equity Shares"],["PS","Preference Shares"],["BS","Bonus Shares"],["OT","Others"]];  /* AL-2 Part E shares/securities */
const AL2_JEWEL=[["GJ","Gold Jewellery"],["SJ","Silver Jewellery"],["PJ","Platinum Jewellery"],["DJ","Diamond Jewellery"],["OMJ","Other precious metal Jewellery"],["OSJ","Other precious stone Jewellery"]];  /* AL-2 Part G (6 values) */
const AL2_ART=[["AC","Archaeological Collections"],["DR","Drawings"],["PA","Paintings"],["SC","Sculptures"],["WA","Work of Art"],["BN","Bullion"],["OT","Others"]];  /* AL2HDropDown (AL-2 Part H) */
const AL2_ARTPUR=[["ST"," Stock in trade"],["IN","Investment"]];   /* AL-2 Part H — " Stock in trade" leading space verbatim */

/* ---- column-metadata builders (state key === schema key) ---------- */
const alT=(k,h,req,max)=>({k,h,t:"txt",req:req?1:0,max});   /* text */
const alP=(k,h,req)=>({k,h,t:"pan",req:req?1:0,max:10});    /* PAN */
const alA=(k,h)=>({k,h,t:"txt",max:12});                    /* Aadhaar (optional) */
const alN=(k,h,req)=>({k,h,t:"num",req:req?1:0});           /* rupee amount */
const alI=(k,h,req)=>({k,h,t:"int",req:req?1:0});           /* integer count/cost */
const alRt=(k,h,req)=>({k,h,t:"rate",req:req?1:0});         /* rate % (number, may be fractional) */
const alDt=(k,h,req)=>({k,h,t:"date",req:req?1:0});         /* DD/MM/YYYY */
const alSl=(k,h,opts,req)=>({k,h,t:"sel",opts,req:req?1:0});

/* ---- the 25 tables — {path(state==render key), sk(schema key), label, cols} ---- */
const AL_T={
  /* ===== SH-1 · ShrhldngUnlistedCompany ===== */
  ucA:{path:"al.sh.DtlsSHEndPreviousYearUC", sk:"DtlsSHEndPreviousYearUC",
    label:"SH-1 · A — Shareholding at the end of the previous year", cols:[
    alT("ShareholderName","Name of the shareholder",1,125),
    alSl("ResidentialStatus","Residential status in India",SH_RES,1),
    alSl("ShareType","Type of share",SH_TYPE_A,1),
    alT("ShareTypeOthers","Others (if type = Others)",0,50),
    alP("PAN","PAN",1), alA("Aadhaar","Aadhaar"),
    alDt("AllotmentDate","Date of allotment",1),
    alN("NumberOfSharesHeld","Number of shares held",1),
    alN("FaceValuePerShare","Face value per share",1),
    alN("IssuePricePerShare","Issue Price per share",1),
    alN("AmountReceived","Amount received",1)]},
  ucB:{path:"al.sh.DtlsEquityShareEndPrvYr", sk:"DtlsEquityShareEndPrvYr",
    label:"SH-1 · B — Equity share application money pending allotment", cols:[
    alT("ApplicantName","Name of the applicant",1,125),
    alSl("ResidentialStatus","Residential status in India",SH_RES,1),
    alSl("ShareType","Type of share",SH_TYPE_B,1),
    alT("ShareTypeOthers","Others (if type = Others)",0,50),
    alP("PAN","PAN",1), alA("Aadhaar","Aadhaar"),
    alDt("ApplicationDate","Date of application",1),
    alN("NumberOfSharesApplied","Number of shares applied for",1),
    alN("ApplicationMoneyReceived","Application money received",1),
    alN("FaceValuePerShare","Face value per share",1),
    alN("ProposedIssuePrice","Proposed issue price",1)]},
  ucC:{path:"al.sh.SHDtlsAnyTimePrevYearUC", sk:"SHDtlsAnyTimePrevYearUC",
    label:"SH-1 · C — Was a shareholder at any time during the previous year", cols:[
    alT("ShareholderName","Name of the shareholder",1,125),
    alSl("ResidentialStatus","Residential status in India",SH_RES,1),
    alSl("ShareType","Type of share",SH_TYPE_1C,1),
    alP("PAN","PAN",1), alA("Aadhaar","Aadhaar"),
    alN("NumberOfSharesHeld","Number of shares held",1),
    alN("FaceValuePerShare","Face value per share",1),
    alN("IssuePricePerShare","Issue Price per share",1),
    alN("AmountReceived","Amount received",1),
    alDt("AllotmentDate","Date of allotment",1),
    alDt("CeaseShareholderDate","Date on which cease to be shareholder",1),
    alSl("CessationMode","Mode of cessation",SH_MODE,1),
    alP("NewShareholderPAN","In case of transfer, PAN of the new shareholder",0),
    alA("NewShareholderAadhaar","Aadhaar of new shareholder")]},
  /* ===== SH-2 · ShrhldngStartUps ===== */
  suA:{path:"al.sh.DtlsSHEndPreviousYearSU", sk:"DtlsSHEndPreviousYearSU",
    label:"SH-2 · A — Shareholding at the end of the previous year (start-up)", cols:[
    alT("ShareholderName","Name of the shareholder",1,125),
    alSl("ShareholderCategory","Category of shareholder",SH_CAT,1),
    alSl("ShareType","Type of share",SH_TYPE_A,1),
    alT("ShareTypeOthers","Others (if type = Others)",0,50),
    alP("PAN","PAN",1), alA("Aadhaar","Aadhaar"),
    alDt("AllotmentDate","Date of allotment",1),
    alN("NumberOfSharesHeld","Number of shares held",1),
    alN("FaceValuePerShare","Face value per share",1),
    alN("IssuePricePerShare","Issue Price per share",1),
    alN("PaidUpValuePerShare","Paid up value per share",1),
    alN("SharePremium","Share premium",1)]},
  suB:{path:"al.sh.DtlsShareAppMoneyAlltEndPrvYr", sk:"DtlsShareAppMoneyAlltEndPrvYr",
    label:"SH-2 · B — Share application money pending allotment (start-up)", cols:[
    alT("ApplicantName","Name of the applicant",1,125),
    alSl("ApplicantCategory","Category of applicant",SH_CAT,1),
    alSl("ShareType","Type of share",SH_TYPE_B,1),
    alT("ShareTypeOthers","Others (if type = Others)",0,50),
    alP("PAN","PAN",1), alA("Aadhaar","Aadhaar"),
    alDt("ApplicationDate","Date of application",1),
    alN("NumberOfSharesApplied","Number of shares applied for",1),
    alN("FaceValuePerShare","Face value per share",1),
    alN("ProposedIssuePrice","Proposed issue price per share",1),
    alN("ShareApplicationMoney","Share application money",1),
    alN("ShareApplicationPremium","Share application premium",1)]},
  suC:{path:"al.sh.SHDtlsAnyTimePrevYearSU", sk:"SHDtlsAnyTimePrevYearSU",
    label:"SH-2 · C — Was a shareholder at any time during the previous year (start-up)", cols:[
    alT("ShareholderName","Name of the shareholder",1,125),
    alSl("ShareholderCategory","Category of shareholder",SH_CAT,1),
    alSl("ShareType","Type of share",SH_TYPE_2C,1),
    alP("PAN","PAN",1), alA("Aadhaar","Aadhaar"),
    alDt("AllotmentDate","Date of allotment",1),
    alN("NumberOfSharesHeld","Number of shares held",1),
    alN("FaceValuePerShare","Face value per share",1),
    alN("IssuePricePerShare","Issue Price per share",1),
    alN("PaidUpValuePerShare","Paid up value per share",1),
    alDt("CeaseShareholderDate","Date on which cease to be shareholder",1),
    alSl("CessationMode","Mode of cessation",SH_MODE,1),
    alP("NewShareholderPAN","In case of transfer, PAN of the new shareholder",0),
    alA("NewShareholderAadhaar","Aadhaar of new shareholder")]},

  /* ===== AL-1 · AsstLiabilitiesUnlistedCompany (movement tables) ===== */
  a1A:{path:"al.al1.DtlsBldLandResHouseUC", sk:"DtlsBldLandResHouseUC",
    label:"AL-1 · A — Building/land, residential house", cols:[
    alT("Address","Address",1,200), alI("PinCode","Pin code",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alI("AcquisitionCost","Cost of acquisition Rs.",1),
    alSl("Purpose","Purpose for which used",AL_PUR_A,1)]},
  a1B:{path:"al.al1.DtlsBldLandNotResHouseUC", sk:"DtlsBldLandNotResHouseUC",
    label:"AL-1 · B — Land or building, not a residential house", cols:[
    alT("Address","Address",1,200), alI("PinCode","Pin code",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alI("AcquisitionCost","Cost of acquisition Rs.",1),
    alSl("Purpose","Purpose for which used",AL_PUR_B,1)]},
  a1C:{path:"al.al1.DtlsListedEquitySharesUC", sk:"DtlsListedEquitySharesUC",
    label:"AL-1 · C — Listed equity shares", cols:[
    alN("OpenBalNumberOfShares","Opening: Number of shares",1),
    alSl("OpenBalShareType","Opening: Type of share",AL_LISTED_ST,1),
    alN("OpenBalAcquisitionCost","Opening: Cost of acquisition",1),
    alN("ShrsAcqNumberOfShares","Acquired: Number of shares",0),
    alSl("ShrsAcqShareType","Acquired: Type of share",AL_LISTED_ST,0),
    alN("ShrsAcqAcquisitionCost","Acquired: Cost of acquisition",0),
    alN("ShrsTrsNumberOfShares","Transferred: Number of shared",0),
    alSl("ShrsTrsShareType","Transferred: Type of share",AL_LISTED_ST,0),
    alN("ShrsTrsSaleConsdr","Transferred: Sale consideration",0),
    alN("ClBalNumberOfShares","Closing: Number of shares",0),
    alSl("ClBalShareType","Closing: Type of share",AL_LISTED_ST,0),
    alN("ClBalAcquisitionCost","Closing: Cost of acquisition",0)]},
  a1D:{path:"al.al1.DtlsUnListedEquitySharesUC", sk:"DtlsUnListedEquitySharesUC",
    label:"AL-1 · D — Unlisted equity shares", cols:[
    alT("CompanyName","Name of company",1,125), alP("PAN","PAN",1),
    alN("OpenBalNumberOfShares","Opening: Number of shares",1),
    alN("OpenBalAcquisitionCost","Opening: Cost of acquisition",1),
    alN("ShrsAcqNumberOfShares","Acquired: Number of shares",0),
    alDt("SubscriptionPurchaseDate","Acquired: Date of subscription/purchase",0),
    alN("FaceValuePerShare","Acquired: Face value per share",0),
    alN("IssuePricePerShare","Acquired: Issue price per share (fresh issue)",0),
    alN("PurchasePricePerShare","Acquired: Purchase price per share (from existing holder)",0),
    alN("ShrsTrsNumberOfShares","Transferred: Number of shared",0),
    alN("SaleConsideration","Transferred: Sale consideration",0),
    alN("ClBalNumberOfShares","Closing: Number of shares",1),
    alN("ClBalAcquisitionCost","Closing: Cost of acquisition",1)]},
  a1E:{path:"al.al1.DtlsOtherSecuritiesUC", sk:"DtlsOtherSecuritiesUC",
    label:"AL-1 · E — Other securities", cols:[
    alSl("SecuritiesType","Type of securities",AL_SECTYPE,1),
    alT("SecuritiesTypeOthers","Others (if type = Others)",0,50),
    alSl("ListedUnlistedFlag","Whether listed or unlisted",AL_LU,1),
    alN("OpenBalNumberOfSecurities","Opening: Number of securities",1),
    alN("OpenBalAcquisitionCost","Opening: Cost of acquisition",1),
    alN("ShrsAcqNumberOfSecurities","Acquired: Number of securities",0),
    alDt("SubscriptionPurchaseDate","Acquired: Date of subscription/purchase",0),
    alN("FaceValuePerShare","Acquired: Face value per share",0),
    alN("IssuePriceSecurity","Acquired: Issue price of security (fresh issue)",0),
    alN("PurchasePricePerSecurity","Acquired: Purchase price per security (from existing holder)",0),
    alN("ShrsTrsNumberOfSecurities","Transferred: Number of securities",0),
    alN("SaleConsideration","Transferred: Sale consideration",0),
    alN("ClBalNumberOfSecurities","Closing: Number of securities",1),
    alN("ClBalAcquisitionCost","Closing: Cost of acquisition",1)]},
  a1F:{path:"al.al1.DtlsCapitalContributionOthEntityUC", sk:"DtlsCapitalContributionOthEntityUC",
    label:"AL-1 · F — Capital contribution to other entity", cols:[
    alT("EntityName","Name of entity",1,125), alP("PAN","PAN",1),
    alN("OpeningBalance","Opening balance",1),
    alN("AmtContributedDrgTheYr","Amount contributed during the year",1),
    alN("AmtWithdrawnDrgTheYr","Amount withdrawn during the year",1),
    alN("AmtprofitLossDividend","Profit/loss/dividend/interest debited or credited during the year",1),
    alN("ClosingBalance","Closing balance",1)]},
  a1G:{path:"al.al1.DtlsLoansAdvancesUC", sk:"DtlsLoansAdvancesUC",
    label:"AL-1 · G — Loans & advances to any other concern", cols:[
    alT("PersonName","Name of the person",1,125), alP("PAN","PAN",1),
    alN("OpeningBalance","Opening Balance",1),
    alN("AmountReceived","Amount received",1),
    alN("AmountPaid","Amount paid",1),
    alN("InterestCredited","Interest credited if any",1),
    alN("ClosingBalance","Closing balance",1),
    alRt("InterestRate","Rate of interest (%)",1)]},
  a1H:{path:"al.al1.DtlsVehiclestransportUC", sk:"DtlsVehiclestransportUC",
    label:"AL-1 · H — Motor vehicle, aircraft, yacht etc.", cols:[
    alSl("AssetParticulars","Particulars of asset",AL_VEH,1),
    alT("AssetParticularsOthers","Others (description)",0),
    alT("RegNumVehicle","Registration number of vehicle",1),
    alI("AcquisitionCost","Cost of acquisition",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alSl("Purpose","Purpose for which used",AL_PUR_H,1)]},
  a1I:{path:"al.al1.DtlsJewelleryArchCollectionsUC", sk:"DtlsJewelleryArchCollectionsUC",
    label:"AL-1 · I — Jewellery, art, bullion", cols:[
    alSl("AssetParticulars","Particulars of asset",AL_JEWEL,1),
    alT("AssetParticularsOthers","Description",0),
    alI("Quantity","Quantity",1),
    alI("AcquisitionCost","Cost of acquisition",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alSl("Purpose","Purpose of use",AL_STIN,1)]},
  a1J:{path:"al.al1.DtlsLiabilitiesUC", sk:"DtlsLiabilitiesUC",
    label:"AL-1 · J — Liabilities (loans/deposits/advances from a non-financial-institution person)", cols:[
    alT("PersonName","Name of the person",1,125), alP("PAN","PAN",1),
    alN("OpeningBalance","Opening Balance",1),
    alN("AmountReceived","Amount received",1),
    alN("AmountPaid","Amount paid",1),
    alN("InterestCredited","Interest debited/paid if any",1),
    alN("ClosingBalance","Closing balance",1),
    alRt("InterestRate","Rate of interest (%)",1)]},

  /* ===== AL-2 · AsstLiabilitiesStartUps (since incorporation) ===== */
  a2A:{path:"al.al2.DtlsBldLandResHouseSU", sk:"DtlsBldLandResHouseSU",
    label:"AL-2 · A — Building/land, residential house", cols:[
    alT("Address","Address",1,200), alI("PinCode","Pin code",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alI("AcquisitionCost","Cost of acquisition",1),
    alSl("Purpose","Purpose for which used",AL_PUR_A,1),
    alSl("TransferFlag","Whether transferred on/before end of previous year",AL_YN,1),
    alDt("TransferDate","If Yes, date of transfer",0)]},
  a2B:{path:"al.al2.DtlsBldLandNotResHouseSU", sk:"DtlsBldLandNotResHouseSU",
    label:"AL-2 · B — Land or building, not a residential house", cols:[
    alT("Address","Address",1,200), alI("PinCode","Pin code",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alI("AcquisitionCost","Cost of acquisition Rs.",1),
    alSl("Purpose","Purpose for which used",AL_PUR_B,1),
    alSl("TransferFlag","Whether transferred",AL_YN,1),
    alDt("TransferDate","If Yes, date of transfer",0)]},
  a2C:{path:"al.al2.DtlsLoansAdvancesSU", sk:"DtlsLoansAdvancesSU",
    label:"AL-2 · C — Loans & advances made since incorporation", cols:[
    alT("PersonName","Name of the person",1,125), alP("PAN","PAN",1),
    alDt("LoansAdvancesDate","Date on which loans/advances made",1),
    alI("AmtLoansAdvances","Amount of loans and advances",1),
    alI("Amount","Amount received",1),
    alSl("LoansAdvancesFlag","Whether loans/advances has been repaid",AL_YN,1),
    alDt("RepaymentDate","If Yes, date of such repayment",0),
    alI("ClosingBalance","Closing balance at end of previous year, if any",1),
    alRt("InterestRate","Rate of interest, if any",1)]},
  a2D:{path:"al.al2.DtlsCapitalContributionSU", sk:"DtlsCapitalContributionSU",
    label:"AL-2 · D — Capital contribution to any other entity since incorporation", cols:[
    alT("EntityName","Name of entity",1,125), alP("PAN","PAN",1),
    alDt("CapitalContributionDate","Date on which capital contribution made",1),
    alN("AmtContribution","Amount of contribution",1),
    alN("AmtWithdrawn","Amount withdrawn, if any",1),
    alN("AmtprofitLossDividend","Profit/loss/dividend/interest debited or credited during the year",1),
    alN("ClosingBalance","Closing balance at end of previous year, if any",1)]},
  a2E:{path:"al.al2.DtlsAcqustSharesSecuritiesSU", sk:"DtlsAcqustSharesSecuritiesSU",
    label:"AL-2 · E — Acquisition of shares and securities", cols:[
    alT("EntityCompanyName","Name of company/entity",1,125), alP("PAN","PAN",1),
    alSl("SharesSecuritiesType","Type of shares/securities",AL2_SEC,1),
    alT("SharesSecuritiesTypeOthers","Others (if type = Others)",0,50),
    alI("NumSharesSecuritiesAcq","Number of shares/securities acquired",1),
    alN("AcquisitionCost","Cost of acquisition",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alSl("TransferFlag","Whether transferred",AL_YN,1),
    alDt("TransferDate","If Yes, date of transfer",0),
    alI("ClosingBalance","Closing balance at end of previous year, if any",1)]},
  a2F:{path:"al.al2.DtlsVehiclestransportSU", sk:"DtlsVehiclestransportSU",
    label:"AL-2 · F — Motor vehicle/aircraft/yacht (cost > ten lakh) acquired since incorporation", cols:[
    alSl("AssetParticulars","Particulars of asset",AL_VEH,1),
    alT("AssetParticularsOthers","Others",0),
    alT("RegNumVehicle","Registration number of vehicle",1),
    alI("AcquisitionCost","Cost of acquisition",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alSl("Purpose","Purpose for which used",AL_PUR_H,1),
    alSl("TransferFlag","Whether transferred",AL_YN,1),
    alDt("TransferDate","If Yes, date of transfer",0)]},
  a2G:{path:"al.al2.DtlsJewelleryAcquiredSU", sk:"DtlsJewelleryAcquiredSU",
    label:"AL-2 · G — Jewellery acquired since incorporation", cols:[
    alSl("AssetParticulars","Particulars of asset",AL2_JEWEL,1),
    alI("Quantity","Quantity",1),
    alI("AcquisitionCost","Cost of acquisition",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alSl("Purpose","Purpose for which used",AL_STIN,1),
    alSl("TransferFlag","Whether transferred",AL_YN,1),
    alDt("TransferDate","If Yes, date of transfer",0),
    alI("ClosingBalance","Closing balance at end of previous year, if any",1)]},
  a2H:{path:"al.al2.DtlsArchaeologicalCollctSU", sk:"DtlsArchaeologicalCollctSU",
    label:"AL-2 · H — Archaeological collections, art, bullion since incorporation", cols:[
    alSl("AssetParticulars","Particulars of asset",AL2_ART,1),
    alT("AssetParticularsOthers","Others",0),
    alI("Quantity","Quantity",1),
    alI("AcquisitionCost","Cost of acquisition",1),
    alDt("AcquisitionDate","Date of acquisition",1),
    alSl("Purpose","Purpose for which used",AL2_ARTPUR,1),
    alSl("TransferFlag","Whether transferred",AL_YN,1),
    alDt("TransferDate","If Yes, date of transfer",0),
    alI("ClosingBalance","Closing balance at end of previous year, if any",1)]},
  a2I:{path:"al.al2.DtlsLiabilitiesSU", sk:"DtlsLiabilitiesSU",
    label:"AL-2 · I — Liabilities (loans/deposits/advances from a non-financial-institution person)", cols:[
    alT("PersonName","Name of the person",1,125), alP("PAN","PAN",1),
    alN("OpeningBalance","Opening Balance",1),
    alN("AmountReceived","Amount received",1),
    alN("AmountPaid","Amount paid",1),
    alN("InterestCredited","Interest debited if any",1),
    alN("ClosingBalance","Closing balance",1),
    alRt("InterestRate","Rate of interest (%)",1)]}
};

/* group lists (schema-object membership) */
const AL_SH_UC=["ucA","ucB","ucC"];
const AL_SH_SU=["suA","suB","suC"];
const AL_L1=["a1A","a1B","a1C","a1D","a1E","a1F","a1G","a1H","a1I","a1J"];
const AL_L2=["a2A","a2B","a2C","a2D","a2E","a2F","a2G","a2H","a2I"];
const AL_ALL=[].concat(AL_SH_UC,AL_SH_SU,AL_L1,AL_L2);

/* ---- state init (idempotent; never throws on empty state) --------- */
function alInit(){
  S.al=S.al||{};
  S.al.sh=S.al.sh||{}; const sh=S.al.sh;
  sh.sec8=sh.sec8||""; sh.ucFlag=sh.ucFlag||""; sh.suGate=sh.suGate||"";
  S.al.al1=S.al.al1||{}; S.al.al1.flag=S.al.al1.flag||"";
  S.al.al2=S.al.al2||{}; S.al.al2.flag=S.al.al2.flag||"";
  AL_ALL.forEach(kk=>{ if(!Array.isArray(get(AL_T[kk].path))) set(AL_T[kk].path,[]); });
}

/* ---- coercion (state row -> schema row, and back) ----------------- */
function alRowOut(r,cols){
  r=r||{}; const o={}; let any=false;
  cols.forEach(c=>{
    const raw=r[c.k], s=st0(raw); let v;
    if(c.t==="num"||c.t==="int") v = (s==="")?undefined:n0(raw);
    else if(c.t==="rate")       v = (s==="")?undefined:N(raw);
    else if(c.t==="date")       v = ISO(raw);                     /* undefined when unparseable/blank */
    else if(c.t==="pan")        v = s?s.toUpperCase():undefined;
    else                        v = (s==="")?undefined:s;
    if(v!==undefined){ o[c.k]=v; any=true; }
  });
  return any?o:null;
}
function alRowIn(sr,cols){
  sr=sr||{}; const o={};
  cols.forEach(c=>{ const v=sr[c.k];
    if(v===undefined||v===null||v==="") return;
    o[c.k]=(c.t==="date")?dmy(v):v;
  });
  return o;
}
function alGroupOut(keys){
  const o={};
  keys.forEach(kk=>{ const def=AL_T[kk];
    const rows=(get(def.path)||[]).map(r=>alRowOut(r,def.cols)).filter(Boolean);
    if(rows.length) o[def.sk]=rows;
  });
  return o;
}

/* ---- engine (pure disclosure: no compute, no feeds) -------------- */
function engAl(){ alInit(); S.C.al={income:0, rows:alCountAll()}; }
function alCountAll(){ let n=0; AL_ALL.forEach(kk=>{ n+=(get(AL_T[kk].path)||[]).length; }); return n; }

/* ---- renderer ---------------------------------------------------- */
function alGcols(cols){
  return cols.map(c=>{
    const t = c.t==="date"?"date":(c.t==="sel"?"sel":((c.t==="num"||c.t==="int"||c.t==="rate")?"num":"txt"));
    const g={h:c.h,k:c.k,t:t};
    if(c.opts) g.opts=c.opts;
    if(c.req)  g.req=1;
    if(c.max)  g.max=c.max;
    return g;
  });
}
function alGrid(path,cols,empty){
  return grid(path,alGcols(cols),get(path)||[],
    {min:(cols.length*160+90)+"px", empty:empty||"No rows yet — click Add a row.", add:"Add a row"});
}
function alBlock(kk){ const def=AL_T[kk]; return sub(def.label)+alGrid(def.path,def.cols); }

function secAl(){
  alInit(); const A=S.al;
  let h="";
  h+=note("<b>Schedule SH &amp; Schedule AL — company shareholding, assets and liabilities.</b> Pure disclosure: nothing here is computed or added to total income, and nothing feeds in. All amounts are in rupees, at <b>cost</b>. Dates are "+DF+".");

  /* ===== Schedule SH-1 ===== */
  h+=sub("Schedule SH-1 · Shareholding of an unlisted company (other than a start-up filling SH-2)");
  h+=row("Are you a company registered u/s 8 of the Companies Act, 2013 (previously s.25 of the 1956 Act) or a company limited by guarantee u/s 3(2)?",
         sel("al.sh.sec8",AL_YN),{ref:"[SH-1 D4 / N4]", hint:"eligibility question — not filed in the return"});
  h+=row("Are you an unlisted company required to fill Schedule SH-1?",
         sel("al.sh.ucFlag",AL_YN),{req:1, ref:"[ScheduleSH SHUnlistedCompanyFlag]"});
  if(st0(A.sh.ucFlag)==="Y"){ AL_SH_UC.forEach(kk=>{ h+=alBlock(kk); }); }
  else if(st0(A.sh.ucFlag)==="N"){ h+=note("Not an unlisted company for SH-1 — only the flag will be written."); }

  /* ===== Schedule SH-2 ===== */
  h+=sub("Schedule SH-2 · Shareholding of a start-up (DPIIT Form-2 under para 5 of the notification dated 19.02.2019)");
  h+=row("Are you a DPIIT-recognised start-up filling Schedule SH-2?",
         sel("al.sh.suGate",AL_YN),{ref:"[SH-2 D33]", hint:"on-screen gate — SH-2 has no filed flag; the object is written only when a table has rows"});
  if(st0(A.sh.suGate)==="Y"){ AL_SH_SU.forEach(kk=>{ h+=alBlock(kk); }); }

  /* ===== Schedule AL-1 ===== */
  h+=sub("Schedule AL-1 · Assets and liabilities of an unlisted company (mandatory for an unlisted company that is not a start-up) — at cost");
  h+=row("Do you have assets and liabilities as at the end of the year as mentioned in Schedule AL-1?",
         sel("al.al1.flag",AL_YN),{req:1, ref:"[AL-1 H4 · ALUnlistedCompanyFlag]"});
  if(st0(A.al1.flag)==="Y"){ AL_L1.forEach(kk=>{ h+=alBlock(kk); }); }
  else if(st0(A.al1.flag)==="N"){ h+=note("No AL-1 assets/liabilities — only the flag will be written."); }

  /* ===== Schedule AL-2 ===== */
  h+=sub("Schedule AL-2 · Assets and liabilities of a start-up (reported since incorporation) — at cost");
  h+=row("Do you have assets and liabilities as at the end of the year as mentioned in Schedule AL-2?",
         sel("al.al2.flag",AL_YN),{req:1, ref:"[AL-2 J5 · ALStartUpsFlag]"});
  if(st0(A.al2.flag)==="Y"){ AL_L2.forEach(kk=>{ h+=alBlock(kk); }); }
  else if(st0(A.al2.flag)==="N"){ h+=note("No AL-2 assets/liabilities — only the flag will be written."); }

  h+=note("Cross-checks (warnings only, since these are at cost): AL-1 Part D unlisted shares against Part A-General &amp; Schedule CG; Parts A/B immovable against Schedule HP &amp; the Balance Sheet; AL-2 Part E against Schedule SH-2; liabilities against the Balance Sheet's non-institutional borrowings. Schedule SH describes who holds the company's shares — distinct from the company's own holdings.");
  return h;
}

/* ---- export ------------------------------------------------------ */
function expAl(j){
  const A=S.al||{};
  /* --- Schedule SH --- */
  const sh={};
  const uc=alGroupOut(AL_SH_UC);
  let ucFlag=st0((A.sh||{}).ucFlag);
  if(!ucFlag && Object.keys(uc).length) ucFlag="Y";     /* rows present => applicable */
  if(ucFlag) uc.SHUnlistedCompanyFlag=ucFlag;
  if(Object.keys(uc).length) sh.ShrhldngUnlistedCompany=uc;
  const su=alGroupOut(AL_SH_SU);                          /* SH-2 has no flag */
  if(Object.keys(su).length) sh.ShrhldngStartUps=su;
  if(Object.keys(sh).length) j.ScheduleSH=sh;

  /* --- Schedule AL --- */
  const al={};
  const l1=alGroupOut(AL_L1);
  let l1Flag=st0((A.al1||{}).flag);
  if(!l1Flag && Object.keys(l1).length) l1Flag="Y";
  if(l1Flag) l1.ALUnlistedCompanyFlag=l1Flag;
  if(Object.keys(l1).length) al.AsstLiabilitiesUnlistedCompany=l1;
  const l2=alGroupOut(AL_L2);
  let l2Flag=st0((A.al2||{}).flag);
  if(!l2Flag && Object.keys(l2).length) l2Flag="Y";
  if(l2Flag) l2.ALStartUpsFlag=l2Flag;
  if(Object.keys(l2).length) al.AsstLiabilitiesStartUps=l2;
  if(Object.keys(al).length) j.ScheduleAL=al;
}

/* ---- import (inverse; round-trip is identity) -------------------- */
function impAl(I6){
  const read=[];
  if(!I6) return read;
  alInit();
  const SH=I6.ScheduleSH;
  if(SH){
    if(SH.ShrhldngUnlistedCompany){
      const o=SH.ShrhldngUnlistedCompany;
      if(o.SHUnlistedCompanyFlag) S.al.sh.ucFlag=o.SHUnlistedCompanyFlag;
      AL_SH_UC.forEach(kk=>{ const def=AL_T[kk];
        if(Array.isArray(o[def.sk])) set(def.path,o[def.sk].map(r=>alRowIn(r,def.cols))); });
      read.push("Schedule SH-1 (unlisted company shareholding)");
    }
    if(SH.ShrhldngStartUps){
      const o=SH.ShrhldngStartUps;
      S.al.sh.suGate="Y";
      AL_SH_SU.forEach(kk=>{ const def=AL_T[kk];
        if(Array.isArray(o[def.sk])) set(def.path,o[def.sk].map(r=>alRowIn(r,def.cols))); });
      read.push("Schedule SH-2 (start-up shareholding)");
    }
  }
  const AL=I6.ScheduleAL;
  if(AL){
    if(AL.AsstLiabilitiesUnlistedCompany){
      const o=AL.AsstLiabilitiesUnlistedCompany;
      if(o.ALUnlistedCompanyFlag) S.al.al1.flag=o.ALUnlistedCompanyFlag;
      AL_L1.forEach(kk=>{ const def=AL_T[kk];
        if(Array.isArray(o[def.sk])) set(def.path,o[def.sk].map(r=>alRowIn(r,def.cols))); });
      read.push("Schedule AL-1 (unlisted company assets & liabilities)");
    }
    if(AL.AsstLiabilitiesStartUps){
      const o=AL.AsstLiabilitiesStartUps;
      if(o.ALStartUpsFlag) S.al.al2.flag=o.ALStartUpsFlag;
      AL_L2.forEach(kk=>{ const def=AL_T[kk];
        if(Array.isArray(o[def.sk])) set(def.path,o[def.sk].map(r=>alRowIn(r,def.cols))); });
      read.push("Schedule AL-2 (start-up assets & liabilities)");
    }
  }
  return read;
}

/* ---- checks (this section's own screen validations) -------------- */
function chkAl(){
  alInit(); const out=[], A=S.al;
  const cnt=keys=>keys.reduce((a,kk)=>a+(get(AL_T[kk].path)||[]).length,0);
  if(cnt(AL_SH_UC) && st0(A.sh.ucFlag)!=="Y")
    out.push({lvl:"warn", t:"Schedule SH-1", m:"SH-1 rows are present but the unlisted-company flag is not set to Yes.", sec:"al"});
  if(cnt(AL_L1) && st0(A.al1.flag)!=="Y")
    out.push({lvl:"warn", t:"Schedule AL-1", m:"AL-1 rows are present but the applicability flag is not set to Yes.", sec:"al"});
  if(cnt(AL_L2) && st0(A.al2.flag)!=="Y")
    out.push({lvl:"warn", t:"Schedule AL-2", m:"AL-2 rows are present but the applicability flag is not set to Yes.", sec:"al"});
  AL_ALL.forEach(kk=>{ alChkTable(out,AL_T[kk]); });
  return out;
}
function alChkTable(out,def){
  const arr=get(def.path)||[]; const who=def.label;
  arr.forEach((r,i)=>{
    r=r||{};
    const any=def.cols.some(c=>st0(r[c.k])!=="");
    if(!any) return;                                            /* skip wholly-blank rows */
    const miss=[];
    def.cols.forEach(c=>{ if(c.req && st0(r[c.k])==="") miss.push(c.h); });
    if(miss.length)
      out.push({lvl:"err", t:who, m:"Row "+(i+1)+": please fill "+miss.join(", ")+".", sec:"al"});
    def.cols.forEach(c=>{
      const v=st0(r[c.k]); if(!v) return;
      if(c.t==="pan" && !PAN_RE.test(v.toUpperCase()))
        out.push({lvl:"err", t:who, m:"Row "+(i+1)+": "+c.h+" is not a valid PAN.", sec:"al"});
      if(c.t==="date" && !ISO(v))
        out.push({lvl:"err", t:who, m:"Row "+(i+1)+": "+c.h+" must be a valid "+DF+" date.", sec:"al"});
      if((c.k==="Aadhaar"||c.k==="NewShareholderAadhaar") && !AADH.test(v))
        out.push({lvl:"warn", t:who, m:"Row "+(i+1)+": "+c.h+" should be a 12-digit number.", sec:"al"});
    });
    if(def.cols.some(c=>c.k==="TransferFlag") && st0(r.TransferFlag)==="Y" && !st0(r.TransferDate))
      out.push({lvl:"warn", t:who, m:"Row "+(i+1)+": transferred = Yes — please give the date of transfer.", sec:"al"});
    if(def.cols.some(c=>c.k==="LoansAdvancesFlag") && st0(r.LoansAdvancesFlag)==="Y" && !st0(r.RepaymentDate))
      out.push({lvl:"warn", t:who, m:"Row "+(i+1)+": repaid = Yes — please give the date of repayment.", sec:"al"});
  });
}

/* ---- register (overrides the boot stub for id "al") -------------- */
reg({id:"al", t:"Assets, liabilities and shareholding", ref:"AL-1 · AL-2 · SH-1/SH-2",
     f:secAl, s:()=>{ const n=(S.C.al||{}).rows||0; return n?(n+" disclosure row"+(n>1?"s":"")):""; },
     eng:engAl, exp:expAl, imp:impAl, chk:chkAl, order:74, corder:74});
