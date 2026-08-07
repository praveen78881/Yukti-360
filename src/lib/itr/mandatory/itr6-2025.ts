/**
 * ITR-6 · AY 2025-26 — OFFICIAL mandatory-field validator.
 *
 * Sources (this exact form-year only — do NOT generalise to other forms):
 *  - Official ITD JSON schema  : ITR-6_2025_Main_V1.3.json (draft-04).
 *    The required-property tree below (REQ) was machine-distilled from that
 *    schema by recursively following properties/required/$ref/items starting
 *    at the payload root { ITR: { ITR6: ... } }. 669 required leaf paths.
 *  - ITD validation rules      : docs/itd-validation-rules/
 *    ITR-6_ValidationRules_AY2025-26_V1.0.md (14 Aug 2025). Category-A rules
 *    ("return will not be allowed to be uploaded") that are checkable on the
 *    JSON alone are encoded below with their S.No. as `rule: 'A-<n>'`.
 *    Rules needing external data (CPC/DB lookups, e-verification state,
 *    RBI IFSC data, prior-year returns) are intentionally NOT encoded.
 *
 * Self-contained: embeds its own distilled required-tree; never imports the
 * raw schema. Never throws — payload may be undefined/partial/garbage.
 *
 * Reporting behaviour: when an entire required branch (e.g. the whole
 * Balance Sheet) is absent, ONE missing[] entry is emitted for the branch
 * root instead of one per leaf; leaves are reported individually as soon as
 * the branch object exists. This keeps reports CA-readable.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr6';
const AY = '2025-26';
/** Version of the official schema file this module was distilled from. */
const SCHEMA_VERSION = 'ITR-6_2025_Main_V1.3';
const ROOT = 'ITR.ITR6';

/* ── Distilled required-property tree (from the official schema) ──────────────
 * Leaf `1` = required scalar/loose object; `{"[]": …}` = array whose every
 * element must satisfy the sub-tree. Only schema-`required` members appear. */

type Req = 1 | { [key: string]: Req };

const REQ: Req = {
  "CreationInfo":{
    "SWVersionNo":1,
    "SWCreatedBy":1,
    "JSONCreatedBy":1,
    "JSONCreationDate":1,
    "IntermediaryCity":1,
    "Digest":1
  },
  "Form_ITR6":{
    "FormName":1,
    "Description":1,
    "AssessmentYear":1,
    "SchemaVer":1,
    "FormVer":1
  },
  "PartA_GEN1":{
    "OrgFirmInfo":{"AssesseeName":{"SurNameOrOrgName":1},"PAN":1,"Address":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1,"CountryCodeMobile":1,"MobileNo":1,"EmailAddress":1},"DateOFFormOrIncorp":1,"StatusOrCompanyType":1,"DomesticCompFlg":1},
    "FilingStatus":{"ReturnFileSec":{"IncomeTaxSec":1},"ResidentialStatus":1,"FinancialStmtFlag":1,"UnderLiquidation":1,"FiiFpiFlag":1,"Sec581AFlag":1,"AsseseeRepFlg":1,"StartUpDPIITFlag":1,"ItrFilingDueDate":1,"ifMSME":1}
  },
  "PartA_GEN2For6":{
    "LiableSec44AAflg":1,
    "IncDclrdUs":1,
    "LiableSec44ABflg":1,
    "LiableSec92Eflg":1,
    "HoldingStatus":{"NatOfCompFlg":1},
    "NatureOfComp":{"PubSectCompUs2_36AFlg":1,"RBICompFlg":1,"CompLes40PercSharGovRBIFlg":1,"BankCompUs5Flg":1,"SchedBankOfRBIActFlg":1,"CompWithIRDARegisterFlg":1,"NonBankFIICompFlg":1,"CompanyUnlistedFlag":1}
  },
  "PARTA_BSFor6FrmAY13":{
    "EquityAndLiablities":{"ShareHolderFund":{"ShareCapital":{"Authorised":1,"IssuedSubsPaidUp":1,"SubscribedNotFullyPaid":1,"TotShareCapital":1},"ResrNSurp":{"CapResr":1,"CapRedempResr":1,"SecurPremResr":1,"DebunRedResr":1,"RevResr":1,"ShareOptOSAmount":1,"OtherResrvTotal":1,"PLAccount":1,"TotResrNSurp":1},"MoneyRecvdAgainstShares":1,"TotShareHolderFund":1},"ShareAppMoneyAllot":{"PendingLtOneYr":1,"PendingMtOneYr":1,"Total":1},"NonCurrLiabilities":{"LongTermBorrowings":{"BondsDebentures":{"ForeignCurrency":1,"Rupee":1,"Total":1},"TermLoans":{"ForeignCurrency":1,"RupeeLoans":{"FromBanks":1,"FromOthers":1,"Total":1},"TotalTermLoans":1},"DeferredPymtLiabilities":1,"DepositsFrmRelatedParties":1,"OtherDeposits":1,"LoansAndAdv":1,"OthersLoanAdv":1,"LongTermMaturities":1,"TotalLTBorrowings":1},"NetDefferedTaxLiability":1,"OthLongTermLiablities":{"TradePayables":1,"Others":1,"TotalOthLtLiabilities":1},"LongTermProvisions":{"ProvEmpBenefits":1,"Others":1,"Total":1},"TotalNonCurrLiabilites":1},"CurrentLiabilities":{"ShortTrmBorrowings":{"LoansRepaybleOnDemand":{"FromBanks":1,"FrmNonBanking":1,"OthFinanceInst":1,"Others":1,"TotLoansRepaybleOnDemand":1},"DepositsFrmRelatedParties":1,"LoansAndAdv":1,"OthLoansAndAdv":1,"OthDeposits":1,"TotShortTrmBorrowings":1},"TradePayables":{"OSMoreThanOneYr":1,"Others":1,"TotalTradePayables":1},"OthCurrLiabilities":{"CurrMatOnLTDebt":1,"CurrMatFinanceOblg":1,"AccrInterestNotDue":1,"AccrInterest":1,"IncRecvdAdvance":1,"UnpaidDividend":1,"AppMonyRecvdAllotSecurities":1,"UnpaidMatDeposits":1,"UnpaidMatureDebenture":1,"OthPayables":1,"TotOthCurrLiabilities":1},"ShortTermProv":{"EmpBenefitProv":1,"ITProvision":1,"ProposedDividend":1,"TaxOnDividend":1,"OthProvision":1,"TotShortTermProvisions":1},"TotCurrLiabilitiesProvision":1},"TotEquityAndLiabilities":1},
    "Assets":{"NonCurrAssets":{"FixedAsset":{"Tangible":{"GrossBlock":1,"Depreciation":1,"ImpairmentLosses":1,"NetBlock":1},"InTangible":{"GrossBlock":1,"Amortization":1,"ImpairmentLosses":1,"NetBlock":1},"CapWrkProg":1,"IntangibleAssetUnDev":1,"TotFixedAsset":1},"NonCurrInvstmnts":{"InvInProperty":1,"EquityInstruments":{"ListedEquities":1,"UnListedEquities":1,"Total":1},"PreferenceShares":1,"GovtOrTrustSecurities":1,"DebenturesOrBonds":1,"MutualFunds":1,"InvstmntInPrtnrShipFirm":1,"OtherInvstmnts":1,"TotNonCurrInvstmnts":1},"NetDeferredTaxAssets":1,"LongTrmLoanAdv":{"CapitalAdv":1,"SecurityDeposits":1,"LoanAdvRelatedParties":1,"OthLoanAdv":1,"TotLTLoanAdv":1,"LTLoanAdvDtls":{"BusOrProf":1,"NotForBusOrProf":1,"ShareHolderUs2_22":1}},"OthNonCurrAssets":{"LTTradeReceivables":{"Secured":1,"Unsecured":1,"Doubtful":1,"TotOthNonCurrAssets":1},"Others":1,"Total":1,"NonCurrAssetUs2_22":1},"TotNonCurrAssets":1},"CurrentAssets":{"CurrInvstmnts":{"EquityInstruments":{"ListedEquities":1,"UnListedEquities":1,"Total":1},"PreferenceShares":1,"GovtOrTrustSecurities":1,"DebenturesOrBonds":1,"MutualFunds":1,"InvstmntInPrtnrShipFirm":1,"OtherInvstmnts":1,"TotCurrInvstmnts":1},"Inventories":{"RawMatl":1,"WorkInProgress":1,"FinOrTradGood":1,"StkInTrade":1,"StoresConsumables":1,"LooseTools":1,"Others":1,"TotInventries":1},"TradeReceivables":{"OSMoreThanSixMonths":1,"Others":1,"TotalTradeReceivables":1},"CashNCashEquivalents":{"BalWithBanks":1,"ChequesDrafts":1,"CashInHand":1,"Others":1,"TotCashNCashEquivalents":1},"TotShortTermLoanAdv":{"LoanAdv":1,"Others":1,"TotShrtTermLoans":1,"STLoanAdvDtls":{"BusOrProf":1,"NotForBusOrProf":1,"ShareHolderUs2_22":1}},"OtherCurrAssets":1,"TotCurrAssets":1}},
    "TotalAssets":1
  },
  "PARTA_BSIndAS":{
    "EquityAndLiablities":{"Equity":{"EquityShareCapital":{"Authorised":1,"IssuedSubsPaidUp":1,"SubscribedNotFullyPaid":1,"TotShareCapital":1},"OtherEquityReserv":{"CapRedempResr":1,"DebunRedResr":1,"ShareOptOSAmount":1,"TotalOtherResrv":1,"RetainedEarngs":1,"TotResrNRetEar":1,"TotalEquity":1}},"Liabilities":{"NonCurrLiabilities":{"FinancialLiabilities":{"BondsDebentures":{"ForeignCurrency":1,"Rupee":1,"Total":1},"TermLoans":{"ForeignCurrency":1,"RupeeLoans":{"FromBanks":1,"FromOthers":1,"Total":1},"TotalTermLoans":1},"DeferredPymtLiabilities":1,"Deposits":1,"LoansReltdParties":1,"LongTermMaturities":1,"LiabilityComp":1,"OtherLoans":1,"TotalLTBorrowings":1,"TradePayables":1,"OtherFinancialLiab":1},"Provisions":{"ProvEmpBenefits":1,"TotalProvisions":1},"DefrdTaxCurrLiabilites":1,"OtherNonCurLiabilites":{"Advances":1,"TotalOthNonCurrLiab":1},"TotalNonCurrLiab":1},"CurrentLiabilities":{"FinancialLiabBorrowings":{"LoansRepaybleOnDemand":{"FromBanks":1,"FrmOtherParties":1,"TotLoansRepaybleOnDemand":1},"LoansFrmRelatedParties":1,"Deposits":1,"TotalBorrowings":1,"TradePayables":1},"OthFinancialLiabilities":{"CurrMatOnLTDebt":1,"CurrMatFinanceOblg":1,"AccrInterest":1,"UnpaidDividend":1,"AppMonyRecvdAllotSecurities":1,"UnpaidMatDeposits":1,"UnpaidMatureDebenture":1,"TotOthFinancialLiab":1},"TottalFinancialLiab":1,"OtherCuurLiabilities":{"RevenueRecvdAdvance":1,"OthersAdvTotal":1,"TotalOthCurrLiab":1},"Provosions":{"ProvosionEmpBenft":1,"TotalProvosions":1},"CurrTaxLiabilities":1,"TotalCurrentLiab":1,"TotalEquityLiab":1}}},
    "Assets":{"NonCurrAssets":{"PropertyPlantEquip":{"GrossBlock":1,"Depreciation":1,"ImpairmentLosses":1,"NetBlock":1,"CapWrkProg":1,"InvstPropGrossBlock":1,"InvstPropDepreciation":1,"InvstPropImprLosses":1,"InvstPropNetBlock":1,"GoodWlGrossBlock":1,"GoodWlImprLosses":1,"GoodWlNetBlock":1,"OthIntAstGrossBlock":1,"OthIntAstAmortisation":1,"OthIntAstImprLosses":1,"OthIntAstNetBlock":1,"IntAstUndrDevlpmnt":1,"BioAstGrossBlock":1,"BioAstImprLosses":1,"BioAstNetBlock":1,"FinancialAssets":{"Investments":{"ListedEquities":1,"UnListedEquities":1,"Total":1,"InvstPrfShares":1,"InvstGovtTrust":1,"InvstInDebenture":1,"InvstInMutualFunds":1,"InvstInPartnershpFirm":1,"TotalNonCurrentInvst":1},"TradeReceivables":{"SecuredConsGoods":1,"UnSecuredConsGoods":1,"Doubtful":1,"TotalTradeReceivbls":1},"Loans":{"SecurityDepsts":1,"LoansRltdParties":1,"TotalLoans":1,"LoansBPPurpose":1,"LoansNotBPPurpose":1,"LoansToShrHolders":1},"OtherFinacialAssets":{"BankDeposits":1,"OtherDeposits":1,"TotalOthFinancialAsst":1,"DefrdTaxAsst":1},"OtherNonCurrentAssets":{"CapitalAdvanc":1,"AdvancOthCapital":1,"TotalNonCurrAsst":1,"NonCurrAsstDueShrHldr":1},"TotalNonCurrntAsst":1}}},"CurrentAssets":{"Inventories":{"RawMaterials":1,"WorkInProgress":1,"FinishedGoods":1,"StockInTrade":1,"StoresSpares":1,"LooseTools":1,"Others":1,"TotalInventories":1},"FinancialAssets":{"Investments":{"ListedEquities":1,"UnListedEquities":1,"Total":1,"InvstPrfShares":1,"InvstGovtTrust":1,"InvstInDebenture":1,"InvstInMutualFunds":1,"InvstInPartnershpFirm":1,"OtherInvestment":1,"TotalCurrentInvst":1},"TradeReceivables":{"SecuredConsGoods":1,"UnSecuredConsGoods":1,"Doubtful":1,"TotalTradeReceivbls":1},"CashEquivalents":{"BalancesWithBanks":1,"ChequeDraftsInHand":1,"CashOnHand":1,"TotalCashEquivalents":1,"BankBalanceOther":1},"Loans":{"SecurityDepsts":1,"LoansRltdParties":1,"TotalLoans":1,"LoansBPPurpose":1,"LoansNotBPPurpose":1,"LoansToShrHolders":1},"OtherFinancialAsst":1,"TotalFinancialAsst":1,"CurrentTaxAsst":1,"OtherCurrentAssets":{"AdvancOthCapital":1,"TotalOthCurrentAsst":1,"TotalCurrAsst":1}}}},
    "TotalAssets":1
  },
  "PARTA_PL":{
    "CreditsToPL":{"OthIncome":{"RentInc":1,"Comissions":1,"Dividends":1,"InterestInc":1,"ProfitOnSaleFixedAsset":1,"ProfitOnInvChrSTT":1,"ProfitOnOthInv":1,"ProfitOnCurrFluct":1,"ProfitOnCnvInvntryToCapAsst":1,"ProfitOnAgriIncome":1,"MiscOthIncome":1,"TotOthIncome":1},"TotCreditsToPL":1},
    "DebitsToPL":{"DebitPlAcnt":{"Freight":1,"ConsumptionOfStores":1,"PowerFuel":1,"RentExpdr":1,"RepairsBldg":1,"RepairMach":1,"EmployeeComp":{"SalsWages":1,"Bonus":1,"MedExpReimb":1,"LeaveEncash":1,"LeaveTravelBenft":1,"ContToSuperAnnFund":1,"ContToPF":1,"ContToGratFund":1,"ContToOthFund":1,"OthEmpBenftExpdr":1,"TotEmployeeComp":1},"Insurances":{"MedInsur":1,"LifeInsur":1,"KeyManInsur":1,"OthInsur":1,"TotInsurances":1},"StaffWelfareExp":1,"Entertainment":1,"Hospitality":1,"Conference":1,"SalePromoExp":1,"Advertisement":1,"CommissionExpdrDtls":{"NonResOtherCompany":1,"Others":1,"Total":1},"RoyalityDtls":{"NonResOtherCompany":1,"Others":1,"Total":1},"ProfessionalConstDtls":{"NonResOtherCompany":1,"Others":1,"Total":1},"HotelBoardLodge":1,"TravelExp":1,"ForeignTravelExp":1,"ConveyanceExp":1,"TelephoneExp":1,"GuestHouseExp":1,"ClubExp":1,"FestivalCelebExp":1,"Scholarship":1,"Gift":1,"Donation":1,"RatesTaxesPays":{"ExciseCustomsVAT":{"TotExciseCustomsVAT":1}},"AuditFee":1,"OtherExpenses":1,"BadDebtDtls":{"BadDebtAmtDtlsTotal":1,"OthersPANNotAvlblDtlTotal":1,"OthersAmtLt1Lakh":1,"BadDebt":1},"ProvForBadDoubtDebt":1,"OthProvisionsExpdr":1,"PBIDTA":1,"InterestExpdrtDtls":{"NonResOtherCompany":1,"Others":1,"InterestExpdr":1},"DepreciationAmort":1,"PBT":1},"TaxProvAppr":{"ProvForCurrTax":1,"ProvDefTax":1,"ProfitAfterTax":1,"BalBFPrevYr":1,"AmtAvlAppr":1,"Appropriations":{"TrfToReserves":1,"TotAppropriations":1},"PartnerAccBalTrf":1}},
    "TotalNumOfMonths":1
  },
  "PARTA_PLIndAS":{
    "CreditsToPL":{"GrossProfitTrnsfFrmTrdAcc":1,"OthIncome":{"RentInc":1,"Comissions":1,"Dividends":1,"InterestInc":1,"ProfitOnSaleFixedAsset":1,"ProfitOnInvChrSTT":1,"ProfitOnOthInv":1,"ProfitOnCurrFluct":1,"ProfitOnCnvInvntryToCapAsst":1,"ProfitOnAgriIncome":1,"MiscOthIncome":1,"TotOthIncome":1},"TotCreditsToPL":1},
    "DebitsToPL":{"DebitPlAcnt":{"Freight":1,"ConsumptionOfStores":1,"PowerFuel":1,"RentExpdr":1,"RepairsBldg":1,"RepairMach":1,"EmployeeComp":{"SalsWages":1,"Bonus":1,"MedExpReimb":1,"LeaveEncash":1,"LeaveTravelBenft":1,"ContToSuperAnnFund":1,"ContToPF":1,"ContToGratFund":1,"ContToOthFund":1,"OthEmpBenftExpdr":1,"TotEmployeeComp":1},"Insurances":{"MedInsur":1,"LifeInsur":1,"KeyManInsur":1,"OthInsur":1,"TotInsurances":1},"StaffWelfareExp":1,"Entertainment":1,"Hospitality":1,"Conference":1,"SalePromoExp":1,"Advertisement":1,"CommissionExpdrDtls":{"NonResOtherCompany":1,"Others":1,"Total":1},"RoyalityDtls":{"NonResOtherCompany":1,"Others":1,"Total":1},"ProfessionalConstDtls":{"NonResOtherCompany":1,"Others":1,"Total":1},"HotelBoardLodge":1,"TravelExp":1,"ForeignTravelExp":1,"ConveyanceExp":1,"TelephoneExp":1,"GuestHouseExp":1,"ClubExp":1,"FestivalCelebExp":1,"Scholarship":1,"Gift":1,"Donation":1,"RatesTaxesPays":{"ExciseCustomsVAT":{"TotExciseCustomsVAT":1}},"AuditFee":1,"OtherExpenses":1,"BadDebtDtls":{"BadDebtAmtDtlsTotal":1,"OthersPANNotAvlblDtlTotal":1,"OthersAmtLt1Lakh":1,"BadDebt":1},"ProvForBadDoubtDebt":1,"OthProvisionsExpdr":1,"PBIDTA":1,"InterestExpdrtDtls":{"NonResOtherCompany":1,"Others":1,"InterestExpdr":1},"DepreciationAmort":1,"PBT":1},"TaxProvAppr":{"ProvForCurrTax":1,"ProvDefTax":1,"ProfitAfterTax":1,"BalBFPrevYr":1,"AmtAvlAppr":1,"Appropriations":{"TrfToReserves":1,"TotAppropriations":1},"PartnerAccBalTrf":1}}
  },
  "CorpScheduleBP":{
    "BusinessIncOthThanSpec":{"ProfBfrTaxPL":1,"NetPLFromSpecBus":1,"NetProfLossSpecifiedBus":1,"IncRecCredPLOthHeadDtls":{"HouseProperty":1,"CapitalGains":1,"OtherSources":1,"UnderSec115BBF":1,"UnderSec115BBG":1,"Dividend":1,"OtherThanDividend":1},"PLUs44sChapXIIGOthrUs115B":1,"ProfitLossInclRefrdSec":{"ProfitLossUs44AE":1,"ProfitLossUs44B":1,"ProfitLossUs44BB":1,"ProfitLossUs44BBA":1,"ProfitLossUs44BBB":1,"ProfitLossUs44BBC":1,"ProfitLossUs44D":1,"ProfitLossUs44DA":1,"ProfitChapterXIIG":1,"FirstSchITActOthr115B":1},"PLUs44sChapXIIGUs115B":1,"TotalProfitFrmActCvrd":1,"ProfitFrmEligBus10TIA":1,"ProfitFrmActCvrd":{"ProfitFrmActCvrdUndrRule7":1,"ProfitFrmActCvrdUndrRule7A":1,"ProfitFrmActCvrdUndrRule7B1":1,"ProfitFrmActCvrdUndrRule7B1A":1,"ProfitFrmActCvrdUndrRule8":1},"IncCredPL":{"FirmShareInc":1,"AOPBOISharInc":1,"OthExempInc":1,"TotExempInc":1},"BalancePLOthThanSpecBus":1,"ExpDebToPLOthHeadDtls":{"HouseProperty":1,"CapitalGains":1,"OtherSources":1,"UnderSec115BBF":1,"UnderSec115BBG":1},"ExpDebToPLExemptInc":1,"ExpDebToPLExemptIncDisAllwUs14A":1,"TotExpDebPL":1,"AdjustedPLOthThanSpecBus":1,"DepreciationDebPLCosAct":1,"DepreciationAllowITAct32":{"DepreciationAllowUs32_1_ii":1,"DepreciationAllowUs32_1_i":1,"TotDeprAllowITAct":1},"AdjustPLAfterDeprOthSpecInc":1,"AmtDebPLDisallowUs36":1,"AmtDebPLDisallowUs37":1,"AmtDebPLDisallowUs40":1,"AmtDebPLDisallowUs40A":1,"AmtDebPLDisallowUs43B":1,"InterestDisAllowUs23SMEAct":1,"DeemIncUs41":1,"DeemIncUs3380HHD80IA":1,"DeemIncUs43CA":1,"OthItemDisallowUs28To44DA":1,"AnyOthIncNotInclInExpDisallowPL":1,"SalaryExpDisallowPL":1,"BonusExpDisallowPL":1,"CommissionExpDisallowPL":1,"InterestExpDisallowPL":1,"OthersExpDisallowPL":1,"IncProfDecLossAccICDSAdj":1,"TotAfterAddToPLDeprOthSpecInc":1,"DeductUs32_1_iii":1,"Amt32AC":1,"DebPLUs35ExcessAmt":1,"AmtDisallUs40NowAllow":1,"AmtDisallUs43BNowAllow":1,"AnyOthAmtAllDeduct":1,"DecProfIncLossAccICDSAdj":1,"TotDeductionAmts":1,"PLAftAdjDedBusOthThanSpec":1,"DeemedProfitBusUs":{"Section44AE":1,"Section44B":1,"Section44BB":1,"Section44BBA":1,"Section44BBC":1,"Section44BBB":1,"Section44D":1,"Section44DA":1,"ChapterXIIG":1,"FirstSchTActOther":1,"TotDeemedProfitBusUs":1},"NetPLAftAdjBusOthThanSpec":1,"NetPLBusOthThanSpec7A7B7C":1,"ChrgblIncUndrRule7":1,"DeemedChrgblIncUndrRule7A":1,"DeemedChrgblIncUndrRule7B1":1,"DeemedChrgblIncUndrRule7B1A":1,"DeemedChrgblIncUndrRule8":1,"IncomeOtherThanRule":1,"BalIncDeemedFrmAgri":1},
    "SpecBusinessInc":{"NetPLFrmSpecBus":1,"AdditionUs28to44DA":1,"DeductUs28to44DA":1,"AdjustedPLFrmSpecuBus":1},
    "IncSpecifiedBusiness":{"NetPLFrmSpecifiedBus":1,"AddSec28to44DA":1,"DedSec28to44DAOTDedSec35AD":1,"ProfitLossSpecifiedBusiness":1,"DedSec35AD1":1,"ProfitLossSpecifiedBusFinal":1},
    "IncChrgUnHdProftGain":1,
    "BusSetoffCurrYr":{"LossSetOffOnBusLoss":1,"TotLossSetOffOnBus":1,"LossRemainSetOffOnBus":1}
  },
  "PartB-TI":{
    "IncomeFromHP":1,
    "TotalTI":1,
    "CurrentYearLoss":1,
    "BalanceAfterSetoffLosses":1,
    "BroughtFwdLossesSetoff":1,
    "GrossTotalIncome":1,
    "IncChargeTaxSplRate111A112":1,
    "DeductionsUndSchVIADtl":{"PartBchapterVIA":1,"PartCchapterVIA":1,"TotDeductUndSchVIA":1},
    "DeductionsUnder10Aor10AA":1,
    "TotalIncome":1,
    "IncChargeableTaxSplRates":1,
    "IncChargeableTaxNormalRates":1,
    "NetAgricultureIncomeOrOtherIncomeForRate":1,
    "LossesOfCurrentYearCarriedFwd":1
  },
  "PartB_TTI":{
    "ComputationOfTaxLiability":{"TaxPayableOnDeemedTI":{"TaxDeemedTISec115JB":1,"Surcharge":1,"EducationCess":1,"TotalTax":1},"TaxPayableOnTI":{"TaxAtNormalRates":1,"TaxAtSpecialRates":1,"TaxPayableOnTotInc":1,"Surcharge25ofSI":1,"SurchargeOnTaxPayable":1,"TotalSurcharge":1,"EducationCess":1,"GrossTaxLiability":1},"GrossTaxPayable":1,"TaxRelief":{"Section90":1,"Section91":1,"TotTaxRelief":1},"NetTaxLiability":1,"IntrstPay":{"IntrstPayUs234A":1,"IntrstPayUs234B":1,"IntrstPayUs234C":1,"LateFilingFee234F":1,"TotalIntrstPay":1},"AggregateTaxInterestLiability":1},
    "TaxPaid":{"TaxesPaid":{"TotalTaxesPaid":1},"BalTaxPayable":1},
    "Refund":{"RefundDue":1,"BankAccountDtls":{"BankDtlsFlag":1}},
    "AssetOutsideIndiaFlg":1
  },
  "Verification":{
    "Declaration":{"AssesseeVerName":1,"FatherName":1,"AssesseeVerPAN":1,"Capacity":1,"Place":1,"Date":1}
  }
};

/* ── Labels & UI hints ──────────────────────────────────────────────────────── */

const SECTION_LABELS: Record<string, string> = {
  CreationInfo: 'JSON creation info (software identifiers)',
  Form_ITR6: 'Form identity (form name / assessment year / versions)',
  PartA_GEN1: 'Part A-GEN: general information (company identity & filing status)',
  PartA_GEN2For6: 'Part A-GEN (contd.): audit, holding status & nature of company',
  PARTA_BSFor6FrmAY13: 'Part A-BS: Balance Sheet as on 31st March 2025',
  PARTA_BSIndAS: 'Part A-BS (Ind AS): Balance Sheet as on 31st March 2025',
  PARTA_PL: 'Part A-P&L: Profit and Loss account',
  PARTA_PLIndAS: 'Part A-P&L (Ind AS): Profit and Loss account',
  CorpScheduleBP: 'Schedule BP: profits and gains from business or profession',
  'PartB-TI': 'Part B-TI: computation of total income',
  PartB_TTI: 'Part B-TTI: computation of tax liability',
  Verification: 'Verification (declaration by the signatory)',
  OrgFirmInfo: 'Company identity (name / PAN / address / incorporation)',
  FilingStatus: 'Filing status',
  Declaration: 'Verification declaration',
};

const FIELD_LABELS: Record<string, string> = {
  PAN: 'PAN of the company',
  SurNameOrOrgName: 'Name of the company',
  DateOFFormOrIncorp: 'Date of incorporation',
  StatusOrCompanyType: 'Type of company (6-public / 7-private)',
  DomesticCompFlg: 'Domestic company? (Y/N)',
  ResidenceNo: 'Address: flat / door / block no.',
  LocalityOrArea: 'Address: area / locality',
  CityOrTownOrDistrict: 'Address: town / city / district',
  StateCode: 'Address: state code',
  CountryCode: 'Address: country code',
  CountryCodeMobile: 'Mobile: country code',
  MobileNo: 'Mobile number',
  EmailAddress: 'Email address',
  IncomeTaxSec: 'Section under which the return is filed (139(1) etc.)',
  ResidentialStatus: 'Residential status (RES/NRI)',
  FinancialStmtFlag: 'Financial statements drawn as per Ind AS? (Y/N)',
  UnderLiquidation: 'Company under liquidation? (Y/N)',
  FiiFpiFlag: 'Whether FII / FPI? (Y/N)',
  Sec581AFlag: 'Producer company u/s 581A? (Y/N)',
  AsseseeRepFlg: 'Return filed by representative assessee? (Y/N)',
  StartUpDPIITFlag: 'Recognised start-up by DPIIT? (Y/N)',
  ItrFilingDueDate: 'Due date for filing the return',
  ifMSME: 'Recognised as MSME? (Y/N)',
  LiableSec44AAflg: 'Liable to maintain accounts u/s 44AA? (Y/N)',
  IncDclrdUs: 'Declaring income only u/s 44AE/44B/44BB/44BBA/44BBB/44BBC? (Y/N)',
  LiableSec44ABflg: 'Liable for audit u/s 44AB? (Y/N)',
  LiableSec92Eflg: 'Liable for audit u/s 92E (transfer pricing)? (Y/N)',
  NatOfCompFlg: 'Holding status (holding / subsidiary / both / other)',
  FormName: 'Form name (must be ITR-6)',
  AssessmentYear: 'Assessment year (must be 2025)',
  SchemaVer: 'Schema version',
  FormVer: 'Form version',
  AssesseeVerName: 'Name of the person verifying the return',
  FatherName: "Father's name of the signatory",
  AssesseeVerPAN: 'PAN of the signatory',
  Capacity: 'Capacity of the signatory (MD/DR/OL/RA/PO/AS)',
  Place: 'Place of verification',
  Date: 'Date of verification',
  BankDtlsFlag: 'Bank account details furnished? (Y/N)',
  RefundDue: 'Refund due',
  TotalTI: 'Total of heads of income',
  GrossTotalIncome: 'Gross total income',
  TotalIncome: 'Total income',
  IFSCCode: 'IFSC code of the bank',
  BankName: 'Name of the bank',
  BankAccountNo: 'Bank account number',
  AccountType: 'Type of bank account',
  UseForRefund: 'Use this account for refund? (true/false)',
};

/** Where in the ITR-6 tool a top-level section is filled (ITR Info tab). */
const HINTS: Record<string, string> = {
  CreationInfo: 'Filled automatically on export',
  Form_ITR6: 'Filled automatically on export',
  PartA_GEN1: 'ITR Info tab → General Information',
  PartA_GEN2For6: 'ITR Info tab → General Information (audit / company nature)',
  PARTA_BSFor6FrmAY13: 'ITR Info tab → Balance Sheet',
  PARTA_BSIndAS: 'ITR Info tab → Balance Sheet (Ind AS)',
  ManufacturingAccount: 'ITR Info tab → Manufacturing Account',
  TradingAccount: 'ITR Info tab → Trading Account',
  ManufacturingAccountIndAS: 'ITR Info tab → Manufacturing Account (Ind AS)',
  TradingAccountIndAS: 'ITR Info tab → Trading Account (Ind AS)',
  PARTA_PL: 'ITR Info tab → Profit & Loss A/c',
  PARTA_PLIndAS: 'ITR Info tab → Profit & Loss A/c (Ind AS)',
  PARTA_OL: 'ITR Info tab → Part A - OL (company under liquidation)',
  CorpScheduleBP: 'ITR Info tab → Schedule BP',
  ScheduleHP: 'ITR Info tab → Schedule HP',
  Schedule10AA: 'ITR Info tab → Schedule 10AA',
  Schedule80G: 'ITR Info tab → Schedule 80G',
  Schedule80GGA: 'ITR Info tab → Schedule 80GGA',
  Schedule80_IA: 'ITR Info tab → Schedule 80-IA',
  Schedule80_IB: 'ITR Info tab → Schedule 80-IB',
  ScheduleVIA: 'ITR Info tab → Schedule VI-A',
  ScheduleFA: 'ITR Info tab → Schedule FA',
  'PartB-TI': 'IT Computation tab → Part B - TI',
  PartB_TTI: 'IT Computation tab → Part B - TTI',
  ScheduleIT: 'IT Computation tab → taxes paid (Schedule IT)',
  ScheduleTDS2: 'IT Computation tab → TDS details',
  ScheduleTCS: 'IT Computation tab → TCS details',
  Verification: 'Validate & Export tab → Verification',
};

function humanize(seg: string): string {
  const base = seg.replace(/\[\d+\]$/, '');
  return (
    FIELD_LABELS[base] ??
    SECTION_LABELS[base] ??
    base
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim()
  );
}

function mkMissing(path: string): MissingField {
  const segs = path.split('.');
  const last = segs[segs.length - 1];
  const top = segs.length > 2 ? segs[2].replace(/\[\d+\]$/, '') : last;
  const label = humanize(last);
  const hint = HINTS[top];
  return hint ? { path, label, hint } : { path, label };
}

/* ── Required-tree walker ───────────────────────────────────────────────────── */

function walkReq(node: Req, value: unknown, path: string, missing: MissingField[]): void {
  if (node === 1) {
    if (isEmpty(value)) missing.push(mkMissing(path));
    return;
  }
  const itemReq = (node as Record<string, Req>)['[]'];
  if (itemReq !== undefined) {
    if (!Array.isArray(value) || value.length === 0) {
      missing.push(mkMissing(path));
      return;
    }
    value.forEach((el, i) => walkReq(itemReq, el, `${path}[${i}]`, missing));
    return;
  }
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    // Whole required branch absent → one entry for the branch, not one per leaf.
    missing.push(mkMissing(path));
    return;
  }
  const rec = value as Record<string, unknown>;
  for (const k of Object.keys(node)) {
    walkReq((node as Record<string, Req>)[k], rec[k], `${path}.${k}`, missing);
  }
}

/* ── Optional arrays whose ELEMENTS carry schema-required members ─────────────
 * (Not reachable through REQ because the arrays themselves are optional.) */

const OPT_ARRAY_ITEM_REQS: ReadonlyArray<readonly [string, ReadonlyArray<string>]> = [
  ['PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', ['IFSCCode', 'BankName', 'BankAccountNo', 'AccountType', 'UseForRefund']],
  ['PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails', ['SWIFTCode', 'BankName', 'CountryCode', 'IBAN']],
  ['PartA_GEN2For6.KeyPersons', ['PersonName', 'Designation', 'AddressDetailWithZipCode']],
  ['PartA_GEN2For6.ShareHolderInfo', ['ShareHolderInfoName', 'AddressDetailWithZipCode', 'PercentageOfShare']],
  ['PartA_GEN2For6.AuditDetails', ['AuditedSection']],
  ['PartA_GEN2For6.AuditReportDetails', ['AuditReportAct', 'AuditReportSection', 'OtherITActFlag']],
  ['ScheduleHP.PropertyDetails', ['HPSNo', 'PropertyOwner', 'PropCoOwnedFlg', 'ifLetOut', 'Rentdetails', 'AssessePercentShareProp']],
  ['ScheduleIT.TaxPayment', ['BSRCode', 'DateDep', 'SrlNoOfChaln', 'Amt']],
  ['ScheduleTDS2.TDSOthThanSalaryDtls', ['TDSCreditName', 'TANOfDeductor', 'TDSSection', 'TaxDeductCreditDtls', 'AmtCarriedFwd']],
  ['ScheduleTCS.TCSDetails', ['EmployerOrDeductorOrCollectDetl', 'TCSClaimedThisYearDtls', 'AmtCarriedFwd']],
];

/* ── Identity patterns / enums (from the official schema) ─────────────────────── */

const RE_PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const RE_PAN_PERSON = /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/; // Verification signatory PAN
const RE_DATE = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const CAPACITY_ENUM = ['MD', 'DR', 'OL', 'RA', 'PO', 'AS'];
const DUE_DATE_ENUM = ['2025-10-31', '2025-11-30'];
const RETURN_SEC_ENUM = [11, 12, 13, 14, 16, 17, 18, 19, 20, 41, 21];
const SEC_115BA_SET = ['115BA', '115BAA', '115BAB'];
/** IncomeTaxSec codes that mean "filed in response to a notice/order" (A-22). */
const NOTICE_SEC_SET = [13, 14, 16, 18, 19, 20, 41];

/* ── Chapter VI-A field groups (Schedule VI-A, DeductUndChapVIA) ───────────── */

const VIA_PART_B = ['Section80G', 'Section80GGA', 'Section80GGB', 'Section80GGC'];
const VIA_PART_C = [
  'Section80IA', 'Section80IAB', 'Section80IAC', 'Section80IBA', 'Section80IB',
  'Section80IC', 'Section80JJA', 'Section80JJAA', 'Section80LA', 'Section80LA_1A',
  'Section80M', 'Section80PA',
];

/* ── The checker ────────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  const v = (p: string): unknown => at(json, `${ROOT}.${p}`);
  const s = (p: string): string => {
    const x = v(p);
    if (typeof x === 'string') return x.trim();
    if (typeof x === 'number' || typeof x === 'boolean') return String(x);
    return '';
  };
  const num = (p: string): number => {
    const x = v(p);
    if (typeof x === 'number' && isFinite(x)) return x;
    if (typeof x === 'string' && x.trim() !== '') {
      const nn = Number(x);
      if (isFinite(nn)) return nn;
    }
    return 0;
  };
  const filled = (p: string): boolean => !isEmpty(v(p));
  const err = (path: string, msg: string, rule?: string): void => {
    errors.push(rule ? { path: `${ROOT}.${path}`, msg, rule } : { path: `${ROOT}.${path}`, msg });
  };
  const warn = (path: string, msg: string, rule?: string): void => {
    warnings.push(rule ? { path: `${ROOT}.${path}`, msg, rule } : { path: `${ROOT}.${path}`, msg });
  };
  /** Conditionally-mandatory field: when `cond` holds, `p` must be filled. */
  const reqIf = (cond: boolean, p: string, msg: string, rule: string): void => {
    if (cond && !filled(p)) err(p, msg, rule);
  };

  /* 1 ── Schema required-tree walk */
  const payload = at(json, ROOT);
  if (payload === null || payload === undefined || typeof payload !== 'object' || Array.isArray(payload)) {
    missing.push({ path: ROOT, label: 'ITR-6 payload root (`{ ITR: { ITR6: {…} } }`) is absent — nothing to validate' });
  } else {
    walkReq(REQ, payload, ROOT, missing);
  }

  /* 2 ── Optional arrays: every present element must carry its required members */
  for (const [arrPath, fields] of OPT_ARRAY_ITEM_REQS) {
    const arr = v(arrPath);
    if (!Array.isArray(arr)) continue;
    arr.forEach((el, i) => {
      for (const f of fields) {
        const val = el !== null && typeof el === 'object' ? (el as Record<string, unknown>)[f] : undefined;
        if (isEmpty(val)) missing.push(mkMissing(`${ROOT}.${arrPath}[${i}].${f}`));
      }
    });
  }

  /* 3 ── Identity / format checks (schema patterns & enums) */
  if (filled('Form_ITR6.FormName') && s('Form_ITR6.FormName') !== 'ITR-6') {
    err('Form_ITR6.FormName', 'Form name must be exactly "ITR-6"', 'schema');
  }
  if (filled('Form_ITR6.AssessmentYear') && s('Form_ITR6.AssessmentYear') !== '2025') {
    err('Form_ITR6.AssessmentYear', 'Assessment year must be "2025" (AY 2025-26)', 'schema');
  }
  if (filled('Form_ITR6.SchemaVer') && s('Form_ITR6.SchemaVer') !== 'Ver1.0') {
    warn('Form_ITR6.SchemaVer', 'Schema version is expected to be "Ver1.0" per the official schema pattern');
  }
  if (filled('Form_ITR6.FormVer') && s('Form_ITR6.FormVer') !== 'Ver1.0') {
    warn('Form_ITR6.FormVer', 'Form version is expected to be "Ver1.0" per the official schema pattern');
  }
  const pan = s('PartA_GEN1.OrgFirmInfo.PAN').toUpperCase();
  if (pan !== '') {
    if (!RE_PAN.test(pan)) {
      err('PartA_GEN1.OrgFirmInfo.PAN', `PAN "${pan}" is not a valid PAN (AAAAA9999A)`, 'schema');
    } else if (pan[3] !== 'C') {
      warn('PartA_GEN1.OrgFirmInfo.PAN', `4th character of a company PAN is normally "C" (got "${pan[3]}")`);
    }
  }
  const verPan = s('Verification.Declaration.AssesseeVerPAN').toUpperCase();
  if (verPan !== '' && !RE_PAN_PERSON.test(verPan)) {
    err('Verification.Declaration.AssesseeVerPAN',
      `Signatory PAN "${verPan}" must be a valid individual PAN (4th character "P") per the schema`, 'schema');
  }
  const cap = s('Verification.Declaration.Capacity');
  if (cap !== '' && CAPACITY_ENUM.indexOf(cap) === -1) {
    err('Verification.Declaration.Capacity',
      `Capacity of signatory must be one of ${CAPACITY_ENUM.join('/')}`, 'schema');
  }
  for (const [p, what] of [
    ['Verification.Declaration.Date', 'Date of verification'],
    ['PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp', 'Date of incorporation'],
    ['CreationInfo.JSONCreationDate', 'JSON creation date'],
  ] as const) {
    if (filled(p) && !RE_DATE.test(s(p))) err(p, `${what} must be in YYYY-MM-DD format`, 'schema');
  }
  if (filled('PartA_GEN1.FilingStatus.ItrFilingDueDate') &&
      DUE_DATE_ENUM.indexOf(s('PartA_GEN1.FilingStatus.ItrFilingDueDate')) === -1) {
    err('PartA_GEN1.FilingStatus.ItrFilingDueDate',
      `Due date must be one of ${DUE_DATE_ENUM.join(' or ')}`, 'schema');
  }
  const retSec = num('PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec');
  if (filled('PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec') && RETURN_SEC_ENUM.indexOf(retSec) === -1) {
    err('PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec',
      'Section of filing must be a valid code (11,12,13,14,16,17,18,19,20,41,21)', 'schema');
  }

  /* 4 ── Category-A rules (ITR-6 validation rules AY 2025-26 V1.0) */

  // A-1: country India → mobile number must be exactly 10 digits.
  if (s('PartA_GEN1.OrgFirmInfo.Address.CountryCode') === '91' && filled('PartA_GEN1.OrgFirmInfo.Address.MobileNo')) {
    const mob = s('PartA_GEN1.OrgFirmInfo.Address.MobileNo');
    if (!/^[1-9][0-9]{9}$/.test(mob)) {
      err('PartA_GEN1.OrgFirmInfo.Address.MobileNo',
        'Country is India, so the mobile number must be exactly 10 digits', 'A-1');
    }
  }

  const audit44AB = s('PartA_GEN2For6.LiableSec44ABflg') === 'Y';
  // A-2: liable u/s 44AB & audited → auditor and audit-report information mandatory.
  if (audit44AB) {
    reqIf(true, 'PartA_GEN2For6.AuditedByAccountantFlg',
      'Liable for audit u/s 44AB: state whether accounts have been audited by an accountant', 'A-2');
    if (s('PartA_GEN2For6.AuditedByAccountantFlg') === 'Y') {
      reqIf(true, 'PartA_GEN2For6.AuditInfo.AuditorName', 'Audit u/s 44AB: name of the auditor (proprietorship/firm) is mandatory', 'A-2');
      reqIf(true, 'PartA_GEN2For6.AuditInfo.AuditorMemNo', 'Audit u/s 44AB: membership no. of the auditor is mandatory', 'A-2');
      reqIf(true, 'PartA_GEN2For6.AuditInfo.AudFrmPAN', 'Audit u/s 44AB: PAN of the auditor firm/proprietorship is mandatory', 'A-2');
      reqIf(true, 'PartA_GEN2For6.AuditInfo.AuditDate', 'Audit u/s 44AB: date of the audit report is mandatory', 'A-2');
    }
    // A-27 / A-28: acknowledgement number and UDIN of the 44AB audit report.
    reqIf(true, 'PartA_GEN2For6.AuditInfo.AckNum44AB', 'Audit u/s 44AB: acknowledgement number of the audit report is mandatory', 'A-27');
    reqIf(true, 'PartA_GEN2For6.AuditInfo.UDIN', 'Audit u/s 44AB: UDIN of the audit report is mandatory', 'A-28');
    // A-6: the condition by virtue of which the assessee is liable u/s 44AB.
    reqIf(true, 'PartA_GEN1.FilingStatus.Cndnfor44AB',
      'Liable for audit u/s 44AB: select the condition (bi/bii/biii/biv) by virtue of which you are liable', 'A-6');
  }
  // A-8: date of audit report cannot be in the future.
  if (filled('PartA_GEN2For6.AuditInfo.AuditDate')) {
    const today = new Date().toISOString().slice(0, 10);
    if (RE_DATE.test(s('PartA_GEN2For6.AuditInfo.AuditDate')) && s('PartA_GEN2For6.AuditInfo.AuditDate') > today) {
      err('PartA_GEN2For6.AuditInfo.AuditDate', 'Date of audit report cannot be after today', 'A-8');
    }
  }
  // A-4: presumptive-only question answered "No" → turnover questions a2i/a2ii/a2iii mandatory.
  if (s('PartA_GEN2For6.IncDclrdUs') === 'N') {
    reqIf(true, 'PartA_GEN2For6.TotalSalesExcOneCr',
      'Answer a2i (turnover between 1 and 10 crore?) — mandatory when not declaring presumptive-only income', 'A-4');
    reqIf(true, 'PartA_GEN2For6.AgrOFAllAmtsRcvd',
      'Answer a2ii (cash receipts within 5% ?) — mandatory when not declaring presumptive-only income', 'A-4');
    reqIf(true, 'PartA_GEN2For6.AgrOFAllPayMade',
      'Answer a2iii (cash payments within 5% ?) — mandatory when not declaring presumptive-only income', 'A-4');
  }
  // A-7: turnover 1-10 crore answered "Yes" → a2ii & a2iii mandatory.
  if (s('PartA_GEN2For6.TotalSalesExcOneCr') === 'Y') {
    reqIf(true, 'PartA_GEN2For6.AgrOFAllAmtsRcvd', 'a2i is "Yes": a2ii (cash receipts within 5%?) cannot be left blank', 'A-7');
    reqIf(true, 'PartA_GEN2For6.AgrOFAllPayMade', 'a2i is "Yes": a2iii (cash payments within 5%?) cannot be left blank', 'A-7');
  }

  const domesticFlg = s('PartA_GEN1.OrgFirmInfo.DomesticCompFlg');
  const sec115BA = s('PartA_GEN1.FilingStatus.Section115BA');
  const opted115BA = SEC_115BA_SET.indexOf(sec115BA) !== -1;
  const opting115BAThisYr = s('PartA_GEN1.FilingStatus.Section115CurrAY') === 'Y';
  /** Effective concessional regime (115BA / 115BAA / 115BAB) or ''. */
  const regime = opted115BA ? sec115BA : (opting115BAThisYr ? s('PartA_GEN1.FilingStatus.SectionCurrAY') : '');

  // A-9: foreign company cannot opt for 115BA/115BAA/115BAB.
  if (domesticFlg === 'N' && (opted115BA || opting115BAThisYr)) {
    err('PartA_GEN1.FilingStatus.Section115BA',
      'Type of company is foreign: section 115BA/115BAA/115BAB is not applicable', 'A-9');
  }
  // A-11: domestic company cannot be non-resident.
  if (domesticFlg === 'Y' && s('PartA_GEN1.FilingStatus.ResidentialStatus') === 'NRI') {
    err('PartA_GEN1.FilingStatus.ResidentialStatus', 'A domestic company cannot be a non-resident', 'A-11');
  }
  // A-15: already opted for 115BA/BAA/BAB → AY, date of filing and ack no. of Form 10-IB/IC/ID mandatory.
  if (opted115BA) {
    reqIf(true, 'PartA_GEN1.FilingStatus.Section115BAAY',
      'Opted for 115BA/115BAA/115BAB: assessment year of the relevant Form 10-IB/10-IC/10-ID is mandatory', 'A-15');
    reqIf(true, 'PartA_GEN1.FilingStatus.115BAFormFiledDate',
      'Opted for 115BA/115BAA/115BAB: date of filing of Form 10-IB/10-IC/10-ID is mandatory', 'A-15');
    reqIf(true, 'PartA_GEN1.FilingStatus.ReceiptNo115BA',
      'Opted for 115BA/115BAA/115BAB: acknowledgement number of Form 10-IB/10-IC/10-ID is mandatory', 'A-15');
  }
  // A-16: opting this year → section, date of filing and ack no. mandatory.
  if (opting115BAThisYr) {
    reqIf(true, 'PartA_GEN1.FilingStatus.SectionCurrAY',
      'Opting for 115BA/115BAA/115BAB this year: the section opted for is mandatory', 'A-16');
    reqIf(true, 'PartA_GEN1.FilingStatus.Section115CurrAYDate',
      'Opting for 115BA/115BAA/115BAB this year: date of filing of the relevant form is mandatory', 'A-16');
    reqIf(true, 'PartA_GEN1.FilingStatus.Section115CurrAYRecNo',
      'Opting for 115BA/115BAA/115BAB this year: acknowledgement number of the relevant form is mandatory', 'A-16');
  }
  // A-17: cannot both "have opted earlier" and "opt afresh this year".
  if (opted115BA && opting115BAThisYr) {
    err('PartA_GEN1.FilingStatus.Section115CurrAY',
      'Already opted for 115BA/115BAA/115BAB earlier — cannot also select "opting this year"', 'A-17');
  }
  // A-21: Schedule 115AD(1)(b) proviso filled → must be FII/FPI.
  const sch115ADFilled = num('Schedule115AD.TotalBalance115AD') > 0 ||
    (Array.isArray(v('Schedule115AD.Schedule115ADDtls')) && (v('Schedule115AD.Schedule115ADDtls') as unknown[]).length > 0);
  if (sch115ADFilled && s('PartA_GEN1.FilingStatus.FiiFpiFlag') !== 'Y') {
    err('PartA_GEN1.FilingStatus.FiiFpiFlag',
      'Schedule 115AD is filled: "Whether you are FII/FPI?" must be "Yes"', 'A-21');
  }
  // A-22: filed in response to a notice/order → notice DIN and date mandatory.
  if (NOTICE_SEC_SET.indexOf(retSec) !== -1) {
    reqIf(true, 'PartA_GEN1.FilingStatus.UniqueNumNoticeUs',
      'Return filed in response to a notice/order: unique number / DIN of the notice is mandatory', 'A-22');
    reqIf(true, 'PartA_GEN1.FilingStatus.NoticeDateUnderSec',
      'Return filed in response to a notice/order: date of the notice/order is mandatory', 'A-22');
  }
  // A-24: refund of 50 crore or more → LEI details mandatory.
  if (num('PartB_TTI.Refund.RefundDue') >= 500000000) {
    reqIf(true, 'PartA_GEN1.FilingStatus.LEIDtls.LEINumber',
      'Refund is ₹50 crore or more: Legal Entity Identifier (LEI) details are mandatory', 'A-24');
  }
  // A-26: recognised as MSME → registration number mandatory.
  reqIf(s('PartA_GEN1.FilingStatus.ifMSME') === 'Y', 'PartA_GEN1.FilingStatus.RegNumMSMEDAct2006',
    'Recognised as MSME: registration number under the MSMED Act, 2006 is mandatory', 'A-26');
  // A-29: audited u/s 92E → date of audit and acknowledgement number mandatory.
  if (s('PartA_GEN2For6.LiableSec92Eflg') === 'Y') {
    reqIf(true, 'PartA_GEN2For6.AuditDetails92E.DateOfAudit',
      'Audit u/s 92E: date of furnishing the audit report is mandatory', 'A-29');
    reqIf(true, 'PartA_GEN2For6.AuditDetails92E.AckNum92E',
      'Audit u/s 92E: acknowledgement number of the audit report is mandatory', 'A-29');
  }
  // A-30: other Income-tax-Act audit rows marked "Yes" → date + ack no. per row.
  const auditDetails = v('PartA_GEN2For6.AuditDetails');
  if (Array.isArray(auditDetails)) {
    auditDetails.forEach((row, i) => {
      const r = row !== null && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      if (r.AuditFlag === 'Y') {
        if (isEmpty(r.DateOfAudit)) {
          err(`PartA_GEN2For6.AuditDetails[${i}].DateOfAudit`,
            'Other audit under the Income-tax Act: date of the audit report is mandatory', 'A-30');
        }
        if (isEmpty(r.AckNumOth)) {
          err(`PartA_GEN2For6.AuditDetails[${i}].AckNumOth`,
            'Other audit under the Income-tax Act: acknowledgement number is mandatory', 'A-30');
        }
      }
    });
  }
  // A-13 / A-14: Ind-AS flag decides which set of accounts may be filled.
  // (The utility zero-fills the unused set, so presence alone is only a warning.)
  const indAS = s('PartA_GEN1.FilingStatus.FinancialStmtFlag');
  if (indAS === 'Y' && (filled('ManufacturingAccount') || filled('TradingAccount'))) {
    warn('ManufacturingAccount',
      'Financial statements are Ind-AS: the non-Ind-AS Manufacturing/Trading accounts should not carry data', 'A-13');
  }
  if (indAS === 'N' && (filled('ManufacturingAccountIndAS') || filled('TradingAccountIndAS'))) {
    warn('ManufacturingAccountIndAS',
      'Financial statements are NOT Ind-AS: the Ind-AS Manufacturing/Trading accounts should not carry data', 'A-14');
  }
  // A-162: company under liquidation → Part A-OL mandatory.
  reqIf(s('PartA_GEN1.FilingStatus.UnderLiquidation') === 'Y', 'PARTA_OL',
    'Company is under liquidation: Part A-OL (receipts and payments) is mandatory', 'A-162');
  // A-749: income from house property in Part B-TI → Schedule HP must be filled.
  if (num('PartB-TI.IncomeFromHP') > 0 && !filled('ScheduleHP')) {
    err('ScheduleHP', 'Income from house property is reported in Part B-TI but Schedule HP is not filled', 'A-749');
  }
  // A-766: deduction u/s 10AA claimed → Schedule 10AA must be filled.
  if (num('PartB-TI.DeductionsUnder10Aor10AA') > 0 && !filled('Schedule10AA.DeductSEZ')) {
    err('Schedule10AA', 'Deduction u/s 10AA is claimed in Part B-TI but Schedule 10AA is not filled', 'A-766');
  }
  // A-768: Part C VI-A deduction claimed in Part B-TI → Schedule VI-A Part C must be filled.
  if (num('PartB-TI.DeductionsUndSchVIADtl.PartCchapterVIA') > 0 &&
      num('ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA') <= 0) {
    err('ScheduleVIA', 'Part C Chapter VI-A deduction claimed in Part B-TI but Schedule VI-A Part C is not filled', 'A-768');
  }
  // A-832 / A-846 / A-853 / A-855: section-specific deduction claimed → its schedule must be filled.
  if (num('ScheduleVIA.DeductUndChapVIA.Section80G') > 0 && !filled('Schedule80G')) {
    err('Schedule80G', 'Deduction u/s 80G claimed in Schedule VI-A: details must be given in Schedule 80G', 'A-832');
  }
  if (num('ScheduleVIA.DeductUndChapVIA.Section80GGA') > 0 && !filled('Schedule80GGA')) {
    err('Schedule80GGA', 'Deduction u/s 80GGA claimed in Schedule VI-A: details must be given in Schedule 80GGA', 'A-846');
  }
  if (num('ScheduleVIA.DeductUndChapVIA.Section80IA') > 0 && !filled('Schedule80_IA')) {
    err('Schedule80_IA', 'Deduction u/s 80-IA claimed in Schedule VI-A: Schedule 80-IA must be filled', 'A-853');
  }
  if (num('ScheduleVIA.DeductUndChapVIA.Section80IB') > 0 && !filled('Schedule80_IB')) {
    err('Schedule80_IB', 'Deduction u/s 80-IB claimed in Schedule VI-A: Schedule 80-IB must be filled', 'A-855');
  }
  // A-863: 80LA(1) and 80LA(1A) cannot be claimed together.
  if (num('ScheduleVIA.DeductUndChapVIA.Section80LA') > 0 && num('ScheduleVIA.DeductUndChapVIA.Section80LA_1A') > 0) {
    err('ScheduleVIA.DeductUndChapVIA.Section80LA', 'Deductions u/s 80LA(1) and 80LA(1A) cannot be claimed together', 'A-863');
  }
  // A-864 / A-865: 80LA(1A) needs IFSC-unit "Yes"; 80LA(1) needs "No".
  const isIfsc = s('PartA_GEN1.FilingStatus.IsIfsc');
  if (num('ScheduleVIA.DeductUndChapVIA.Section80LA_1A') > 0 && isIfsc !== 'Y') {
    err('ScheduleVIA.DeductUndChapVIA.Section80LA_1A',
      '80LA(1A) can be claimed only when "located in an IFSC and income solely in convertible forex" is "Yes"', 'A-864');
  }
  if (num('ScheduleVIA.DeductUndChapVIA.Section80LA') > 0 && isIfsc === 'Y') {
    err('ScheduleVIA.DeductUndChapVIA.Section80LA',
      '80LA(1) can be claimed only when the IFSC question in Part A-General is "No"', 'A-865');
  }
  // A-867 / A-871: foreign company cannot claim 80M / 80GGB.
  if (domesticFlg === 'N') {
    if (num('ScheduleVIA.DeductUndChapVIA.Section80M') > 0) {
      err('ScheduleVIA.DeductUndChapVIA.Section80M', 'A foreign company cannot claim deduction u/s 80M', 'A-867');
    }
    if (num('ScheduleVIA.DeductUndChapVIA.Section80GGB') > 0) {
      err('ScheduleVIA.DeductUndChapVIA.Section80GGB', 'Deduction u/s 80GGB is not allowed to a foreign company', 'A-871');
    }
  }
  // A-872 / A-873 / A-874: concessional regimes bar 10AA and most VI-A deductions.
  if (regime !== '' && SEC_115BA_SET.indexOf(regime) !== -1) {
    const ruleId = regime === '115BA' ? 'A-872' : regime === '115BAB' ? 'A-873' : 'A-874';
    if (num('PartB-TI.DeductionsUnder10Aor10AA') > 0) {
      err('PartB-TI.DeductionsUnder10Aor10AA', `Deduction u/s 10AA cannot be claimed under section ${regime}`, ruleId);
    }
    const allowedC = regime === '115BA' ? ['Section80JJAA']
      : regime === '115BAA' ? ['Section80JJAA', 'Section80LA_1A', 'Section80M']
      : ['Section80JJAA', 'Section80M'];
    for (const f of VIA_PART_C) {
      if (allowedC.indexOf(f) === -1 && num(`ScheduleVIA.DeductUndChapVIA.${f}`) > 0) {
        err(`ScheduleVIA.DeductUndChapVIA.${f}`,
          `${f.replace('Section', 'Section ')} deduction cannot be claimed under section ${regime}`, ruleId);
      }
    }
    if (regime === '115BAA' || regime === '115BAB') {
      for (const f of VIA_PART_B) {
        if (num(`ScheduleVIA.DeductUndChapVIA.${f}`) > 0) {
          err(`ScheduleVIA.DeductUndChapVIA.${f}`,
            `${f.replace('Section', 'Section ')} (Part B of Chapter VI-A) cannot be claimed under section ${regime}`, ruleId);
        }
      }
    }
  }
  // A-876: verification in "Representative" capacity → representative details in Part A-General.
  if (cap === 'RA') {
    if (s('PartA_GEN1.FilingStatus.AsseseeRepFlg') !== 'Y') {
      err('PartA_GEN1.FilingStatus.AsseseeRepFlg',
        'Verification capacity is "Representative": Part A-General must say the return is filed by a representative assessee', 'A-876');
    }
    reqIf(true, 'PartA_GEN1.FilingStatus.AssesseeRep.RepName', 'Name of the representative is mandatory', 'A-876');
    reqIf(true, 'PartA_GEN1.FilingStatus.AssesseeRep.RepCapacity', 'Capacity of the representative is mandatory', 'A-876');
    reqIf(true, 'PartA_GEN1.FilingStatus.AssesseeRep.RepAddress', 'Address of the representative is mandatory', 'A-876');
    reqIf(true, 'PartA_GEN1.FilingStatus.AssesseeRep.RepPAN', 'PAN / Aadhaar of the representative is mandatory', 'A-876');
  }
  // A-877: domestic company → signatory PAN must be one of the key persons' PANs.
  if (domesticFlg === 'Y' && verPan !== '') {
    const keyPersons = v('PartA_GEN2For6.KeyPersons');
    if (Array.isArray(keyPersons)) {
      const pans = keyPersons
        .map((k) => (k !== null && typeof k === 'object' ? (k as Record<string, unknown>).KeyPerPAN : undefined))
        .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
        .map((p) => p.trim().toUpperCase());
      if (pans.length > 0 && pans.indexOf(verPan) === -1) {
        err('Verification.Declaration.AssesseeVerPAN',
          'For a domestic company, the PAN at Verification must match one of the PANs entered under Key Persons', 'A-877');
      }
    }
  }

  /* 5 ── Softer cross-checks (warnings) */
  if (num('PartB_TTI.Refund.RefundDue') > 0) {
    const banks = v('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails');
    if (s('PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag') !== 'Y' || !Array.isArray(banks) || banks.length === 0) {
      warn('PartB_TTI.Refund.BankAccountDtls',
        'A refund is due but no Indian bank account is furnished for the refund credit');
    }
  }
  if (s('PartB_TTI.AssetOutsideIndiaFlg') === 'Y' && !filled('ScheduleFA')) {
    warn('ScheduleFA', '"Assets held outside India" is "Yes" in Part B-TTI but Schedule FA carries no details');
  }

  return {
    form: FORM,
    ay: AY,
    schemaVersion: SCHEMA_VERSION,
    missing,
    errors,
    warnings,
    ok: missing.length === 0 && errors.length === 0,
  };
};
