/**
 * Mandatory-field validator — ITR-3, AY 2026-27.
 *
 * Sources (this exact form-year only — nothing here is generalised from other forms):
 *  - Official ITD JSON schema  "ITR-3_2026_Main_V1.1.json"  (Form_ITR3.SchemaVer "Ver1.0")
 *  - CBDT "ITR 3 – Validation Rules for AY 2026-27" V1.0 (18 June 2026) — Category A
 *    ("return will not be allowed to be uploaded"), only the rules that are decidable
 *    on the exported JSON alone. Rules needing CPC/PAN-database/Aadhaar-profile/
 *    e-verification/26AS state are deliberately skipped.
 *
 * The module embeds a DISTILLED required-tree extracted from the official schema
 * (properties / required / definitions / $ref / items followed recursively). Node forms:
 *   1                       → required scalar leaf
 *   { r?:1, a?:1, c?:{...} }→ branch; r = required, a = array (c applies to each item)
 * Optional branches are kept only when they carry required descendants; they are
 * enforced only when the payload actually carries the branch (JSON-schema semantics).
 *
 * Never throws — accepts undefined / partial / hostile payloads.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr3';
const AY = '2026-27';
/** From the official schema file: file version V1.1, Form_ITR3.SchemaVer/FormVer "Ver1.0". */
const SCHEMA_VERSION = 'ITR-3_2026_Main_V1.1 (SchemaVer Ver1.0)';

/* ── Distilled required-tree (generated from the official schema) ──────────── */

type TreeNode = 1 | TreeBranch;
interface TreeBranch { r?: 1; a?: 1; c?: Record<string, TreeNode> }

const TREE: TreeBranch = JSON.parse('{"c":{"ITR":{"c":{"ITR3":{"r":1,"c":{"CreationInfo":{"r":1,"c":{"SWVersionNo":1,"SWCreatedBy":1,"JSONCreatedBy":1,"JSONCreationDate":1,"IntermediaryCity":1,"Digest":1}},"Form_ITR3":{"r":1,"c":{"FormName":1,"Description":1,"AssessmentYear":1,"SchemaVer":1,"FormVer":1}},"PartA_GEN1":{"r":1,"c":{"PersonalInfo":{"r":1,"c":{"AssesseeName":{"r":1,"c":{"SurNameOrOrgName":1}},"PAN":1,"Address":{"r":1,"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1,"Phone":{"c":{"STDcode":1,"PhoneNo":1}},"CountryCodeMobile":1,"MobileNo":1,"EmailAddress":1}},"SecondaryAdd":1,"AlternateAddress":{"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1}},"DOB":1,"Status":1}},"FilingStatus":{"r":1,"c":{"ReturnFileSec":1,"IncFrmBusOrProf":1,"SeventhProvisio139":1,"clauseiv7provisio139iDtls":{"a":1,"c":{"clauseiv7provisio139iNature":1,"clauseiv7provisio139iAmount":1}},"ResidentialStatus":1,"JurisdictionResPrevYr":{"c":{"JurisdictionResPrevYrDtls":{"a":1,"c":{"JurisdictionResidence":1,"TIN":1}}}},"AssesseeRep":{"c":{"RepName":1,"RepEmailID":1,"CountryCodeRepMobileNo":1,"RepMobileNo":1}},"CompDirectorPrvYr":{"c":{"CompDirectorPrvYrDtls":{"a":1,"c":{"NameOfCompany":1,"CompanyType":1,"SharesTypes":1}}}},"PartnerInFirm":{"c":{"PartnerInFirmDtls":{"a":1,"c":{"NameOfFirm":1,"PAN":1}}}},"HeldUnlistedEqShrPrYrFlg":1,"HeldUnlistedEqShrPrYr":{"c":{"HeldUnlistedEqShrPrYrDtls":{"a":1,"c":{"NameOfCompany":1,"CompanyType":1,"OpngBalNumberOfShares":1,"OpngBalCostOfAcquisition":1,"ClsngBalNumberOfShares":1,"ClsngBalCostOfAcquisition":1}}}},"ForeignExchangeFlag":1,"FiiFpiFlag":1,"ItrFilingDueDate":1}}}},"PartA_GEN2":{"r":1,"c":{"AuditInfo":{"r":1,"c":{"LiableSec44AAflg":1,"IncDclrdUs":1,"LiableSec44ABflg":1,"LiableSec92Eflg":1,"AccountAuditFlag":1,"AuditDetails92E":{"c":{"DateOfAudit":1,"AckNum92E":1}}}},"NatOfBus":{"c":{"NatureOfBusiness":{"a":1,"c":{"Code":1}}}}}},"PARTA_BS":{"r":1,"c":{"FundSrc":{"r":1,"c":{"PropFund":{"r":1,"c":{"PropCap":1,"ResrNSurp":{"r":1,"c":{"RevResr":1,"CapResr":1,"StatResr":1,"OthResr":1,"TotResrNSurp":1}},"TotPropFund":1}},"LoanFunds":{"r":1,"c":{"SecrLoan":{"r":1,"c":{"ForeignCurrLoan":1,"RupeeLoan":{"r":1,"c":{"FrmBank":1,"FrmOthrs":1,"TotRupeeLoan":1}},"TotSecrLoan":1}},"UnsecrLoan":{"r":1,"c":{"FrmBank":1,"FrmOthrs":1,"TotUnSecrLoan":1}},"TotLoanFund":1}},"DeferredTax":1,"Advances":{"r":1,"c":{"TotalAdvances":1}},"TotFundSrc":1}},"FundApply":{"r":1,"c":{"FixedAsset":{"r":1,"c":{"GrossBlock":1,"Depreciation":1,"NetBlock":1,"CapWrkProg":1,"TotFixedAsset":1}},"Investments":{"r":1,"c":{"LongTermInv":{"r":1,"c":{"GovtOthSecQuoted":1,"GovOthSecUnQoted":1,"TotLongTermInv":1}},"TradeInv":{"r":1,"c":{"EquityShares":1,"PreferShares":1,"Debenture":1,"TotTradeInv":1}},"TotInvestments":1}},"CurrAssetLoanAdv":{"r":1,"c":{"CurrAsset":{"r":1,"c":{"Inventories":{"r":1,"c":{"StoresConsumables":1,"RawMatl":1,"StkInProcess":1,"FinOrTradGood":1,"TotInventries":1}},"SndryDebtors":1,"CashOrBankBal":{"r":1,"c":{"CashinHand":1,"BankBal":1,"TotCashOrBankBal":1}},"OthCurrAsset":1,"TotCurrAsset":1}},"LoanAdv":{"r":1,"c":{"AdvRecoverable":1,"Deposits":1,"BalWithRevAuth":1,"TotLoanAdv":1}},"TotCurrAssetLoanAdv":1,"CurrLiabilitiesProv":{"r":1,"c":{"CurrLiabilities":{"r":1,"c":{"SundryCred":1,"LiabForLeasedAsset":1,"AccrIntonLeasedAsset":1,"AccrIntNotDue":1,"TotCurrLiabilities":1}},"Provisions":{"r":1,"c":{"ITProvision":1,"ELSuperAnnGratProvision":1,"OthProvision":1,"TotProvisions":1}},"TotCurrLiabilitiesProvision":1}},"NetCurrAsset":1}},"MiscAdjust":{"r":1,"c":{"MiscExpndr":1,"DefTaxAsset":1,"AccumaltedLosses":1,"TotMiscAdjust":1}},"TotFundApply":1}}}},"ManufacturingAccount":{"c":{"OpeningInventory":{"r":1,"c":{"OpngInvntryTotal":1,"DirectExpenses":1,"TotalFactoryOverheads":1,"TotalDebtsManfctrngAcc":1}},"ClosingStock":{"r":1,"c":{"ClsngStckTotal":1}},"CostOfGoodsPrdcd":1}},"TradingAccount":{"c":{"OtherOperatingRevenueDtls":{"a":1,"c":{"OperatingRevenueName":1,"OperatingRevenueAmt":1}},"OperatingRevenueTotal":1,"SalesGrossReceiptsTotal":1,"ExciseCustomsVAT":{"c":{"TotExciseCustomsVAT":1}},"TotRevenueFrmOperations":1,"TardingAccTotCred":1,"DirectExpenses":1,"OtherIncDtls":{"a":1,"c":{"NatureOfIncome":1,"Amount":1}},"DutyTaxPay":{"c":{"ExciseCustomsVAT":{"c":{"TotExciseCustomsVAT":1}}}}}},"PARTA_PL":{"r":1,"c":{"CreditsToPL":{"r":1,"c":{"OthIncome":{"r":1,"c":{"RentInc":1,"Comissions":1,"Dividends":1,"InterestInc":1,"ProfitOnSaleFixedAsset":1,"ProfitOnInvChrSTT":1,"ProfitOnOthInv":1,"ProfitOnCurrFluct":1,"ProfitOnCnvInvntryToCapAsst":1,"ProfitOnAgriIncome":1,"OtherIncDtls":{"a":1,"c":{"Amount":1}},"MiscOthIncome":1,"TotOthIncome":1}},"TotCreditsToPL":1}},"DebitsToPL":{"r":1,"c":{"Freight":1,"ConsumptionOfStores":1,"PowerFuel":1,"RentExpdr":1,"RepairsBldg":1,"RepairMach":1,"EmployeeComp":{"r":1,"c":{"SalsWages":1,"Bonus":1,"MedExpReimb":1,"LeaveEncash":1,"LeaveTravelBenft":1,"ContToSuperAnnFund":1,"ContToPF":1,"ContToGratFund":1,"ContToOthFund":1,"OthEmpBenftExpdr":1,"TotEmployeeComp":1}},"Insurances":{"r":1,"c":{"MedInsur":1,"LifeInsur":1,"KeyManInsur":1,"OthInsur":1,"TotInsurances":1}},"StaffWelfareExp":1,"Entertainment":1,"Hospitality":1,"Conference":1,"SalePromoExp":1,"Advertisement":1,"CommissionExpdrDtls":{"r":1,"c":{"NonResOtherCompany":1,"Others":1,"Total":1}},"RoyalityDtls":{"r":1,"c":{"NonResOtherCompany":1,"Others":1,"Total":1}},"ProfessionalConstDtls":{"r":1,"c":{"NonResOtherCompany":1,"Others":1,"Total":1}},"HotelBoardLodge":1,"TravelExp":1,"ForeignTravelExp":1,"ConveyanceExp":1,"TelephoneExp":1,"GuestHouseExp":1,"ClubExp":1,"FestivalCelebExp":1,"Scholarship":1,"Gift":1,"Donation":1,"RatesTaxesPays":{"r":1,"c":{"ExciseCustomsVAT":{"r":1,"c":{"UnionExciseDuty":1,"ServiceTax":1,"VATorSaleTax":1,"CentralGoodServiceTax":1,"StateGoodServiceTax":1,"IntegratedGoodServiceTax":1,"UnionTerrGoodServiceTax":1,"OthDutyTaxCess":1,"TotExciseCustomsVAT":1}}}},"AuditFee":1,"OtherExpensesDtls":{"a":1,"c":{"ExpenseNature":1,"Amount":1}},"OtherExpenses":1,"BadDebtDtls":{"r":1,"c":{"BadDebtAmtDtls":{"a":1,"c":{"PAN":1,"Amount":1}},"BadDebtAmtDtlsTotal":1,"OthersPANNotAvlblDtl":{"a":1,"c":{"Name":1,"FlatDoorBlockNumber":1,"AreaLocality":1,"TownCityDistrict":1,"StateCode":1,"CountryCode":1,"Amount":1}},"OthersPANNotAvlblDtlTotal":1,"OthersAmtLt1Lakh":1,"BadDebt":1}},"ProvForBadDoubtDebt":1,"OthProvisionsExpdr":1,"PBIDTA":1,"InterestExpdrtDtls":{"r":1,"c":{"NonResOtherCompany":1,"Others":1,"InterestExpdr":1}},"DepreciationAmort":1,"PBT":1}},"TaxProvAppr":{"r":1,"c":{"ProvForCurrTax":1,"ProvDefTax":1,"ProfitAfterTax":1,"BalBFPrevYr":1,"AmtAvlAppr":1,"TrfToReserves":1,"ProprietorAccBalTrf":1}},"NatOfBus44AD":{"a":1,"c":{"NameOfBusiness":1,"CodeAD":1}},"PersumptiveInc44AD":{"c":{"GrsTrnOverOrReceipt":1,"TotPersumptiveInc44AD":1}},"NatOfBus44ADA":{"a":1,"c":{"NameOfBusiness":1,"CodeADA":1}},"PersumptiveInc44ADA":{"c":{"GrsReceipt":1}},"NatOfBus44AE":{"a":1,"c":{"NameOfBusiness":1,"CodeAE":1}},"GoodsDtlsUs44AE":{"a":1,"c":{"RegNumberGoodsCarriage":1,"OwnedLeasedHiredFlag":1,"TonnageCapacity":1,"HoldingPeriod":1,"PresumptiveIncome":1}},"NoBooksOfAccPL":{"r":1,"c":{"GrossReceipt":1,"GrsRcptAccPayeeOrBankMode":1,"GrsRcptOtherMode":1,"GrossProfit":1,"Expenses":1,"NetProfit":1,"GrossReceiptPrf":1,"GrsRcptAccPayeeOrBankModePrf":1,"GrsRcptOtherModePrf":1,"GrossProfitPrf":1,"ExpensesPrf":1,"NetProfitPrf":1,"TotBusinessProfession":1}},"TurnverFrmSpecActivity":1,"NetIncomeFrmSpecActivity":1}},"PARTA_OI":{"c":{"MethodOfAcct":1,"ChangeInAcctMethFlg":1,"ProfDeviatDueAcctMeth":1,"DecProOrIncLossUs145_2":1,"MethodOfValClgStk":{"c":{"ValRawMaterial":1,"ValFinishedGoods":1,"ChngStockValMetFlg":1,"EffectOnPL":1,"DecProOrIncLossUs145_A":1}},"NoCredToPLAmt":{"r":1,"c":{"Section28Items":1,"ProformaCreditsDue":1,"PrevYrEscalClaim":1,"OthItemInc":1,"CapReceipt":1,"TotNoCredToPLAmt":1}},"AmtDisallUs36":{"r":1,"c":{"StkInsurPrem":1,"EmpHealthInsurPrem":1,"EmpBonusCommSum":1,"IntOnBorrCap":1,"ZeroCoupBondDisc":1,"RecogPFContribAmt":1,"AppSuperAnnFundAmt":1,"PensionSchemeSec80CCD":1,"AppGratFundAmt":1,"OthFundAmt":1,"EmpContributionCredits":1,"BadDebtDoubtAmt":1,"BadDebtDoubtProvn":1,"SpecResrvTranfr":1,"FamPlanPromoExp":1,"SecuritiesPaidAmt":1,"MrktLossOthExpLossICDS":1,"OthDisallowances":1,"TotAmtDisallUs36":1}},"AmtDisallUs37":{"r":1,"c":{"CapitalNatureExp":1,"PersonalExp":1,"BusOrProfessnExp":1,"PoliticPartyExp":1,"LawVoilatPenalExp":1,"OthPenalFineExp":1,"OffenceExp":1,"ContigentLiability":1,"OthAmtNotAllowUs37":1,"TotAmtDisallUs37":1}},"AmtDisallUs40":{"r":1,"c":{"NonCompChapXVIIBAmt":1,"NonComp40aiiChapXVIIBAmt":1,"NonComp40aibChapXVIIBAmt":1,"NonComp40aiiiChapXVIIBAmt":1,"TaxAmtOnProfits":1,"WTAmt":1,"RolyatyOrServiceFee":1,"IntSalBonPartner":1,"OthDisallow":1,"TotAmtDisallUs40":1,"AmtDisallUs40PyNowAll":1}},"AmtDisallUs40A":{"r":1,"c":{"AmtPaidUs40A2b":1,"AmtGT20kCash":1,"ProvPmtGrat":1,"ContToSetupTrust":1,"OthDisallow":1,"TotAmtDisallUs40A":1}},"AmtDisallUs43BPyNowAll":{"r":1,"c":{"AmtUs43B":{"r":1,"c":{"TaxDutyCesAmt":1,"ContToEmpPFSFGF":1,"EmpBonusComm":1,"IntPayaleToFI":1,"SumPayaleLoanBrToFinComp":1,"IntPayaleToFISchBank":1,"LeaveEncashPayable":1,"TotAmtUs43b":1}}}},"AmtDisall43B":{"r":1,"c":{"AmtUs43B":{"r":1,"c":{"TaxDutyCesAmt":1,"ContToEmpPFSFGF":1,"EmpBonusComm":1,"IntPayaleToFI":1,"SumPayaleLoanBrToFinComp":1,"IntPayaleToFISchBank":1,"LeaveEncashPayable":1,"TotAmtUs43b":1}}}},"AmtExciseCustomsVATOutstanding":{"r":1,"c":{"ExciseCustomsVAT":{"r":1,"c":{"UnionExciseDuty":1,"ServiceTax":1,"VATorSaleTax":1,"CentralGoodServiceTax":1,"StateGoodServiceTax":1,"IntegratedGoodServiceTax":1,"UnionTerrGoodServiceTax":1,"OthDutyTaxCess":1,"TotExciseCustomsVAT":1}}}},"DeemedProfUs33ABs":1,"ProfTaxAmtUs41":1,"PriorAmtIncCrDrPL":1,"AmountOfExpDisAllwUs14A":1,"InterestDisAllowUs23SMEAct":1,"ScheduleTPSAFlg":1}},"PARTA_QD":{"c":{"TradingConcern":{"c":{"QuantitDet":{"a":1,"c":{"ItemName":1,"UnitOfMeasure":1,"OpeningStock":1,"PurchaseQty":1,"SaleQty":1,"ClgStock":1,"AnyShortExces":1}}}},"ManfactrConcern":{"c":{"RawMaterial":{"r":1,"c":{"QuantitDet":{"a":1,"c":{"ItemName":1,"UnitOfMeasure":1,"OpeningStock":1,"PurchaseQty":1,"SaleQty":1,"ClgStock":1,"AnyShortExces":1}}}},"FinishrByProd":{"r":1,"c":{"QuantitDet":{"a":1,"c":{"ItemName":1,"UnitOfMeasure":1,"OpeningStock":1,"PurchaseQty":1,"SaleQty":1,"ClgStock":1,"AnyShortExces":1}}}}}}}},"ScheduleS":{"c":{"Salaries":{"a":1,"c":{"NameOfEmployer":1,"NatureOfEmployment":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1}},"Salarys":{"r":1,"c":{"GrossSalary":1,"Salary":1,"NatureOfSalary":{"c":{"OthersIncDtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"ValueOfPerquisites":1,"NatureOfPerquisites":{"c":{"OthersIncDtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"ProfitsinLieuOfSalary":1,"NatureOfProfitInLieuOfSalary":{"c":{"OthersIncDtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"IncomeNotified89AType":{"a":1,"c":{"NOT89ACountrycode":1,"NOT89AAmount":1}}}}}},"TotalGrossSalary":1,"AllwncExtentExemptUs10":1,"AllwncExemptUs10":{"c":{"AllwncExemptUs10Dtls":{"a":1,"c":{"SalNatureDesc":1,"SalOthAmount":1}}}},"Section10_13A":{"c":{"Placeofwork":1,"ActlHRARecv":1,"ActlRentPaid":1,"DtlsSalUsSec171":1,"ActlRentPaid10Per":1,"Sal40Or50Per":1,"EligbleExmpAllwncUs13A":1}},"NetSalary":1,"DeductionUS16":1,"DeductionUnderSection16ia":1,"EntertainmntalwncUs16ii":1,"ProfessionalTaxUs16iii":1,"TotIncUnderHeadSalaries":1}},"ScheduleHP":{"c":{"PropertyDetails":{"a":1,"c":{"HPSNo":1,"AddressDetailWithZipCode":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1}},"PropertyOwner":1,"PropCoOwnedFlg":1,"CoOwners":{"a":1,"c":{"CoOwnersSNo":1,"NameCoOwner":1}},"ifLetOut":1,"TenantDetails":{"a":1,"c":{"TenantSNo":1,"NameofTenant":1}},"Rentdetails":{"c":{"AnnualLetableValue":1,"TotalUnrealizedAndTax":1,"BalanceALV":1,"AnnualOfPropOwned":1,"ThirtyPercentOfBalance":1,"IntOnBorwCap":1,"Section24B":{"c":{"Section24BDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"InterestUs24B":1}},"TotalInterestUs24B":1}},"TotalDeduct":1,"IncomeOfHP":1}}}},"TotalIncomeChargeableUnHP":1}},"ITR3ScheduleBP":{"r":1,"c":{"BusinessIncOthThanSpec":{"r":1,"c":{"ProfBfrTaxPL":1,"NetPLFromSpecBus":1,"NetPLFromSpecifiedBus":1,"IncRecCredPLOthHeadDtls":{"r":1,"c":{"Salary":1,"HouseProperty":1,"CapitalGains":1,"OtherSources":1,"Dividend":1,"OtherThanDividend":1,"Us115BBF":1,"Us115BBG":1,"115BBH":1}},"PLUs44sChapXIIG":1,"ProfitLossInclRefrdSec":{"r":1,"c":{"ProfitLossUs44AD":1,"ProfitLossUs44ADA":1,"ProfitLossUs44AE":1,"ProfitLossUs44B":1,"ProfitLossUs44BB":1,"ProfitLossUs44BBA":1,"ProfitLossUs44BBC":1,"ProfitLossUs44BBD":1,"ProfitLossUs44DA":1}},"TotalProfitFrmActCvrd":1,"ProfitFrmActCvrd":{"r":1,"c":{"ProfitFrmActCvrdUndrRule7":1,"ProfitFrmActCvrdUndrRule7A":1,"ProfitFrmActCvrdUndrRule7B1":1,"ProfitFrmActCvrdUndrRule7B1A":1,"ProfitFrmActCvrdUndrRule8":1}},"IncCredPL":{"r":1,"c":{"FirmShareInc":1,"AOPBOISharInc":1,"OtherExmptIncDtl":{"c":{"OperatingDividendName":1,"OperatingDividendAmt":1}},"OthExempInc":1,"TotExempIncPL":1}},"BalancePLOthThanSpecBus":1,"ExpDebToPLOthHeadDtls":{"r":1,"c":{"Salary":1,"HouseProperty":1,"CapitalGains":1,"OtherSources":1,"Us115BBF":1,"Us115BBG":1,"115BBH":1}},"ExpDebToPLExemptInc":1,"ExpDebToPLExemptIncDisAllwUs14A":1,"TotExpDebPL":1,"AdjustedPLOthThanSpecBus":1,"DepreciationDebPLCosAct":1,"DepreciationAllowITAct32":{"r":1,"c":{"DepreciationAllowUs32_1_ii":1,"DepreciationAllowUs32_1_i":1,"TotDeprAllowITAct":1}},"AdjustPLAfterDeprOthSpecInc":1,"AmtDebPLDisallowUs36":1,"AmtDebPLDisallowUs37":1,"AmtDebPLDisallowUs40":1,"AmtDebPLDisallowUs40A":1,"AmtDebPLDisallowUs43B":1,"InterestDisAllowUs23SMEAct":1,"DeemIncUs41":1,"DeemIncUs3380HHD80IA":1,"DeemIncUs43CA":1,"OthItemDisallowUs28To44DA":1,"AnyOthIncNotInclInExpDisallowPL":1,"AnyOthIncNotInclInSalary":1,"AnyOthIncNotInclInBonus":1,"AnyOthIncNotInclInCommission":1,"AnyOthIncNotInclInInterest":1,"AnyOthIncNotInclInOthers":1,"IncProfDecLossAccICDSAdj":1,"TotAfterAddToPLDeprOthSpecInc":1,"DeductUs32_1_iii":1,"DebPLUs35ExcessAmt":1,"AmtDisallUs40NowAllow":1,"AmtDisallUs43BNowAllow":1,"AnyOthAmtAllDeduct":1,"DecProfIncLossAccICDSAdj":1,"TotDeductionAmts":1,"PLAftAdjDedBusOthThanSpec":1,"DeemedProfitBusUs":{"r":1,"c":{"Section44AD":1,"Section44ADA":1,"Section44AE":1,"Section44B":1,"Section44BB":1,"Section44BBA":1,"Section44BBC":1,"Section44BBD":1,"Section44DA":1,"TotDeemedProfitBusUs":1}},"NetPLAftAdjBusOthThanSpec":1,"NetPLBusOthThanSpec7A7B7C":1,"ChrgblIncUndrRule7":1,"DeemedChrgblIncUndrRule7A":1,"DeemedChrgblIncUndrRule7B1":1,"DeemedChrgblIncUndrRule7B1A":1,"DeemedChrgblIncUndrRule8":1,"IncomeOtherThanRule":1,"BalIncDeemedFrmAgri":1}},"SpecBusinessInc":{"r":1,"c":{"NetPLFrmSpecBus":1,"AdditionUs28to44DA":1,"DeductUs28to44DA":1,"AdjustedPLFrmSpecuBus":1}},"SpecifiedBusinessInc":{"r":1,"c":{"NetPLFrmSpecifiedBus":1,"AddSec28to44DA":1,"DedSec28to44DAOTDedSec35AD":1,"ProfitLossSpecifiedBusiness":1,"PLFrmSpecifiedBus":1,"DedUs35ADSubSec5Dtls":{"a":1,"c":{"DedUs35ADSubSec5":1}}}},"IncChrgUnHdProftGain":1,"BusSetoffCurrYr":{"r":1,"c":{"LossSetOffOnBusLoss":1,"SpeculativeInc":{"c":{"IncOfCurYrUnderThatHead":1,"BusLossSetoff":1,"IncOfCurYrAfterSetOff":1}},"SpecifiedInc":{"c":{"IncOfCurYrUnderThatHead":1,"BusLossSetoff":1,"IncOfCurYrAfterSetOff":1}},"TotLossSetOffOnBus":1,"LossRemainSetOffOnBus":1}}}},"ScheduleDPM":{"c":{"PlantMachinery":{"r":1,"c":{"Rate15":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}},"Rate30":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}},"Rate40":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}},"Rate45":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"DepreciationAtFullRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}}}}}},"ScheduleDOA":{"c":{"Land":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"WDVLastDay":1}}}},"Building":{"c":{"Rate5":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}},"Rate10":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}},"Rate40":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}}}},"FurnitureFittings":{"c":{"Rate10":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}}}},"IntangibleAssets":{"c":{"Rate25":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}}}},"Ships":{"c":{"Rate20":{"c":{"DepreciationDetail":{"r":1,"c":{"WDVFirstDay":1,"AdditionsGrThan180Days":1,"RealizationTotalPeriod":1,"FullRateDeprAmt":1,"AdditionsLessThan180Days":1,"RealizationPeriodLessThan180days":1,"HalfRateDeprAmt":1,"DepreciationAtFullRate":1,"DepreciationAtHalfRate":1,"TotalDepreciation":1,"DepDisAllowUs38_2":1,"NetAggregateDepreciation":1,"ProportionateAggDepreciation":1,"ExpdrOnTrforSaleAsset":1,"CapGainUs50":1,"WDVLastDay":1}}}}}}}},"ScheduleDEP":{"c":{"SummaryFromDeprSch":{"r":1,"c":{"PlantMachinerySummary":{"c":{"DeprBlockTot15Percent":1,"DeprBlockTot30Percent":1,"DeprBlockTot40Percent":1,"DeprBlockTot45Percent":1,"TotPlntMach":1}},"BuildingSummary":{"c":{"DeprBlockTot5Percent":1,"DeprBlockTot10Percent":1,"DeprBlockTot40Percent":1,"TotBuildng":1}},"TotalDepreciation":1}}}},"ScheduleDCG":{"c":{"SummaryFromDeprSchCG":{"r":1,"c":{"PlantMachinerySummaryCG":{"c":{"DeprBlockTot15Percent":1,"DeprBlockTot30Percent":1,"DeprBlockTot40Percent":1,"DeprBlockTot45Percent":1,"TotPlntMach":1}},"BuildingSummaryCG":{"c":{"DeprBlockTot5Percent":1,"DeprBlockTot10Percent":1,"DeprBlockTot40Percent":1,"TotBuildng":1}},"TotalDepreciation":1}}}},"ScheduleESR":{"c":{"DeductionUs35":{"r":1,"c":{"Section35_1_i":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_1_ii":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_1_iia":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_1_iii":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_1_iv":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_2AA":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_2AB":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_CCC":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"Section35_CCD":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}},"TotUs35":{"r":1,"c":{"DeductUs35":{"r":1,"c":{"AmtDebPL":1,"AmtUs35Allowable":1,"ExcessAmtOverDebPL":1}}}}}}}},"ScheduleCGFor23":{"c":{"ShortTermCapGainFor23":{"r":1,"c":{"SaleofLandBuild":{"c":{"SaleofLandBuildDtls":{"a":1,"c":{"FullConsideration":1,"PropertyValuation":1,"FullConsideration50C":1,"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1,"Balance":1,"ExemptionOrDednUs54":{"r":1,"c":{"ExemptionOrDednUs54Dtls":{"a":1,"c":{"ExemptionSecCode":1,"ExemptionAmount":1}},"ExemptionGrandTotal":1}},"CapgainonAssets":1,"TrnsfImmblPrprty":{"c":{"TrnsfImmblPrprtyDtls":{"a":1,"c":{"NameOfBuyer":1,"PercentageShare":1,"Amount":1,"AddressOfProperty":1,"StateCode":1,"CountryCode":1}}}}}}}},"SlumpSaleInStcg":{"r":1,"c":{"FMV11UAEii":1,"FMV11UAEiii":1,"FullConsideration":1,"NetWorthOfDivision":1,"CapgainonAssets":1}},"EquityMFonSTT":{"a":1,"c":{"MFSectionCode":1,"EquityMFonSTTDtls":{"r":1,"c":{"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"CapgainonAssets":1}}}},"NRITransacSec48Dtl":{"r":1,"c":{"NRItaxSTTPaid":1,"NRItaxSTTNotPaid":1}},"NRISecur115AD":{"r":1,"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"CapgainonAssets":1}},"SaleOnOtherAssets":{"r":1,"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"DeemedStcgOnAssets":1,"ExemptionOrDednUs54":{"r":1,"c":{"ExemptionOrDednUs54Dtls":{"a":1,"c":{"ExemptionSecCode":1,"ExemptionAmount":1}},"ExemptionGrandTotal":1}},"CapgainonAssets":1}},"UnutilizedCg":{"c":{"UnutilizedCgPrvYrDtls":{"a":1,"c":{"PrvYrInWhichAsstTrnsfrd":1,"SectionClmd":1,"AmtUnutilized":1}}}},"TotalAmtDeemedStcg":1,"PassThrIncNatureSTCG":1,"NRICgDTAA":{"c":{"NRIDTAADtls":{"a":1,"c":{"DTAAamt":1,"ItemNoincl":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"SecITAct":1,"RateAsPerITAct":1}}}},"TotalAmtNotTaxUsDTAAStcg":1,"TotalAmtTaxUsDTAAStcg":1,"CapitalLossBuyBackShares":{"c":{"TotalCapitalLossBuyBackShares":1,"CapitalLossBuyBackSharesDtls":{"r":1,"a":1,"c":{"Rate":1,"Amount":1}}}},"TotalSTCG":1}},"LongTermCapGain23":{"r":1,"c":{"SaleofLandBuild":{"c":{"SaleofLandBuildDtls":{"a":1,"c":{"FullConsideration":1,"PropertyValuation":1,"FullConsideration50C":1,"AquisitCost":1,"AquisitCostIndex":1,"ExpOnTrans":1,"TotalDedn":1,"TotalDednForEiB":1,"CostOfImprovements":{"c":{"CostOfImprovementsDtls":{"r":1,"a":1,"c":{"slno":1,"ImproveCost":1,"ImproveDate":1,"CostOfImpIndex":1}},"TotalImprovecost":1,"TotalindexImprovecost":1}},"Balance":1,"BalanceForEiB":1,"ExemptionOrDednUs54":{"r":1,"c":{"ExemptionOrDednUs54Dtls":{"a":1,"c":{"ExemptionSecCode":1,"ExemptionAmount":1}},"ExemptionGrandTotal":1}},"CapgainonAssets":1,"CapgainonAssets_1ea":1,"TaxSec1121aiiB":1,"TaxSec1121a":1,"ExcessAmtSec1121a":1,"TrnsfImmblPrprty":{"c":{"TrnsfImmblPrprtyDtls":{"a":1,"c":{"NameOfBuyer":1,"PercentageShare":1,"Amount":1,"AddressOfProperty":1,"StateCode":1,"CountryCode":1}}}}}}}},"SlumpSaleInLtcgDtls":{"r":1,"c":{"SlumpSaleInLtcg":{"c":{"FMV11UAEii":1,"FMV11UAEiii":1,"FullConsideration":1,"NetWorthOfDivision":1,"SlumpBalance":1,"ExemptionOrDednUs54":{"r":1,"c":{"ExemptionOrDednUs54Dtls":{"a":1,"c":{"ExemptionSecCode":1,"ExemptionAmount":1}},"ExemptionGrandTotal":1}},"CapgainonAssets":1}}}},"Proviso112Applicable":{"a":1,"c":{"Proviso112SectionCode":1,"Proviso112Applicabledtls":{"r":1,"c":{"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}}}},"SaleOfEquityShareUs112A":{"r":1,"c":{"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}},"NRIProvisoSec48":{"c":{"LTCGWithoutBenefit":1,"DeductionUs54F":1,"BalanceCG":1}},"NRIOnSec112and115":{"c":{"NRIOnSec112and115Dtls":{"a":1,"c":{"SectionCode":1,"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}}}},"NRISaleOfEquityShareUs112A":{"r":1,"c":{"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}},"NRISaleofForeignAsset":{"r":1,"c":{"SaleonSpecAsset":1,"DednSpecAssetus115":1,"BalonSpeciAsset":1}},"SaleofAssetNADtls":{"r":1,"c":{"SaleofAssetNA":{"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"ExemptionOrDednUs54":{"r":1,"c":{"ExemptionOrDednUs54Dtls":{"a":1,"c":{"ExemptionSecCode":1,"ExemptionAmount":1}},"ExemptionGrandTotal":1}}}}}},"UnutilizedCg":{"c":{"UnutilizedCgPrvYrDtls":{"a":1,"c":{"PrvYrInWhichAsstTrnsfrd":1,"SectionClmd":1,"AmtUtilized":1,"AmtUnutilized":1}}}},"TotalAmtDeemedLtcg":1,"PassThrIncNatureLTCG":1,"NRICgDTAA":{"c":{"NRIDTAADtls":{"a":1,"c":{"DTAAamt":1,"ItemNoincl":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"SecITAct":1,"RateAsPerITAct":1}}}},"TotalAmtNotTaxUsDTAALtcg":1,"TotalAmtTaxUsDTAALtcg":1,"CapitalLossBuyBackShares":{"c":{"TotalCapitalLossBuyBackShares":1}},"TotalLTCG":1}},"SumOfCGIncm":1,"IncmFromVDATrnsf":1,"TotScheduleCGFor23":1,"DeducClaimInfo":{"r":1,"c":{"DeducClaimDtlsUs54":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54B":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54D":{"a":1,"c":{"DateofAcquisition":1,"AmtDeducted":1}},"DeducClaimDtlsUs54EC":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54F":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54G":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54GA":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs115F":{"a":1,"c":{"DateofTransfer":1,"AmtInvested":1,"DateofInvestment":1,"AmtDeducted":1}},"TotDeductClaim":1}},"CurrYrLosses":{"r":1,"c":{"InLossSetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSetOffDTAARate":1}},"InStcg20Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcg30Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcgAppRate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcgDTAARate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"CurrYrCapGain":1}},"InLtcg12_5Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOffDTAARate":1,"CurrYrCapGain":1}},"InLtcgDTAARate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"CurrYrCapGain":1}},"TotLossSetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSetOffDTAARate":1}},"LossRemainSetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSetOffDTAARate":1}}}},"AccruOrRecOfCG":{"r":1,"c":{"ShortTermUnder20Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnder30Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnderAppRate":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnderDTAARate":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"LongTermUnder12_5Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"LongTermUnderDTAARate":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"VDATrnsfGainsUnder30Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}}}}}},"Schedule112A":{"c":{"Schedule112ADtls":{"a":1,"c":{"ShareOnOrBefore":1,"ISINCode":1,"ShareUnitName":1,"TotSaleValue":1,"CostAcqWithoutIndx":1,"AcquisitionCost":1,"LTCGBeforelower6and11":1,"FairMktValuePerShareunit":1,"TotFairMktValueCapAst":1,"ExpExclCnctTransfer":1,"TotalDeductions":1,"Balance":1}},"SaleValue112A":1,"CostAcqWithoutIndx112A":1,"AcquisitionCost112A":1,"LTCGBeforelowerB1B2112A":1,"FairMktValueCapAst112A":1,"ExpExclCnctTransfer112A":1,"Deductions112A":1,"Balance112A":1}},"Schedule115AD":{"c":{"Schedule115ADDtls":{"a":1,"c":{"ShareOnOrBefore":1,"ISINCode":1,"ShareUnitName":1,"TotSaleValue":1,"CostAcqWithoutIndx":1,"AcquisitionCost":1,"LTCGBeforelower6and11":1,"FairMktValuePerShareunit":1,"TotFairMktValueCapAst":1,"ExpExclCnctTransfer":1,"TotalDeductions":1,"Balance":1}},"SaleValue115AD":1,"CostAcqWithoutIndx115AD":1,"AcquisitionCost115AD":1,"LTCGBeforelowerB1B2115AD":1,"FairMktValueCapAst115AD":1,"ExpExclCnctTransfer115AD":1,"Deductions115AD":1,"Balance115AD":1}},"ScheduleVDA":{"c":{"ScheduleVDADtls":{"r":1,"a":1,"c":{"DateofAcquisition":1,"DateofTransfer":1,"HeadUndIncTaxed":1,"AcquisitionCost":1,"ConsidReceived":1,"IncomeFromVDA":1}},"TotIncBusiness":1,"TotIncCapGain":1}},"ScheduleOS":{"c":{"IncOthThanOwnRaceHorse":{"c":{"GrossIncChrgblTaxAtAppRate":1,"DividendGross":1,"DividendOthThan22e":1,"Dividend22e":1,"InterestGross":1,"IntrstFrmSavingBank":1,"IntrstFrmTermDeposit":1,"IntrstFrmIncmTaxRefund":1,"NatofPassThrghIncome":1,"IntrstFrmOthers":1,"RentFromMachPlantBldgs":1,"Tot562x":1,"Aggrtvaluewithoutcons562x":1,"Immovpropwithoutcons562x":1,"Immovpropinadeqcons562x":1,"Anyotherpropwithoutcons562x":1,"Anyotherpropinadeqcons562x":1,"FamilyPension":1,"IncomeNotified89ATypeOS":{"a":1,"c":{"NOT89ACountrycode":1,"NOT89AAmount":1}},"AnyOtherIncome":1,"OthersInc":{"c":{"OthersIncDtls":{"a":1,"c":{"OthNatOfInc":1,"OthAmount":1}}}},"IncChargeableSpecialRates":1,"LtryPzzlChrgblUs115BB":1,"IncChrgblUs115BBE":1,"CashCreditsUs68":1,"UnExplndInvstmntsUs69":1,"UnExplndMoneyUs69A":1,"UnDsclsdInvstmntsUs69B":1,"UnExplndExpndtrUs69C":1,"AmtBrwdRepaidOnHundiUs69D":1,"TaxAccumulatedBalRecPF":{"c":{"TaxAccmltdBalRecPFDtls":{"a":1,"c":{"AssessmentYear":1,"IncomeBenefit":1,"TaxBenefit":1}},"TotalIncomeBenefit":1,"TotalTaxBenefit":1}},"OthersGross":1,"PassThrIncOSChrgblSplRate":1,"PTIOthersGrossDtls":{"a":1,"c":{"SourceDescription":1}},"IncChargblSplRateOS":{"c":{"TotalAmtTaxUsDTAASchOs":1,"NRIOsDTAA":{"c":{"NRIDTAADtlsSchOS":{"a":1,"c":{"DTAAamt":1,"NatureOfIncome":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"ItemNoincl":1,"RateAsPerITAct":1}}}}}},"Deductions":{"r":1,"c":{"Depreciation":1,"TotDeductions":1}},"BalanceNoRaceHorse":1}},"TotOthSrcNoRaceHorse":1,"IncFromOwnHorse":{"c":{"Receipts":1,"DeductSec57":1,"BalanceOwnRaceHorse":1}},"IncChargeable":1,"IncFrmLottery":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"IncFrmOnGames":{"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115BBDA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115BBDAaiii":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115A1ai":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115A1aA":{"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115AC":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115ACA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115AD1i":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"NOT89A":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendDTAA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Up16Of6To15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}}}},"ScheduleCYLA":{"r":1,"c":{"Salary":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"HP":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"BusProfExclSpecProf":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"SpeculativeInc":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"SpecifiedInc":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCG20Per":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCG30Per":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCGAppRate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCGDTAARate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"LTCG12_5Per":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"LTCGDTAARate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"OthSrcExclRaceHorse":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"OthSrcRaceHorse":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"IncOSDTAA":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"TotalCurYr":{"r":1,"c":{"TotHPlossCurYr":1,"TotBusLoss":1,"TotOthSrcLossNoRaceHorse":1}},"TotalLossSetOff":{"r":1,"c":{"TotHPlossCurYrSetoff":1,"TotBusLossSetoff":1,"TotOthSrcLossNoRaceHorseSetoff":1}},"LossRemAftSetOff":{"r":1,"c":{"BalHPlossCurYrAftSetoff":1,"BalBusLossAftSetoff":1,"BalOthSrcLossNoRaceHorseAftSetoff":1}}}},"ScheduleBFLA":{"r":1,"c":{"Salary":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"HP":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"BusProfExclSpecProf":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"SpeculativeInc":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"SpecifiedInc":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCG20Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCG30Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCGAppRate":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCGDTAARate":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"LTCG12_5Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"LTCGDTAARate":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"OthSrcExclRaceHorse":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"OthSrcRaceHorse":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"IncOSDTAA":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFUnabsorbedDeprSetoff":1,"BFAllUs35Cl4Setoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"TotalBFLossSetOff":{"r":1,"c":{"TotBFLossSetoff":1,"TotUnabsorbedDeprSetoff":1,"TotAllUs35cl4Setoff":1}},"IncomeOfCurrYrAftCYLABFLA":1}},"ScheduleCFL":{"c":{"LossCFFromPrev9thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev8thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev7thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev6thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev5thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev4thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev3rdYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev2ndYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrevYrToAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFCurrentAssmntYear":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFCurrentAssmntYear2021":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFCurrentAssmntYear2022":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFCurrentAssmntYear2023":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFCurrentAssmntYear2024":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFCurrentAssmntYear2025":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFCurrentAssmntYear2026":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"TotalOfBFLossesEarlierYrs":{"r":1,"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"BusLossOthThanSpecLossCF":1,"LossFrmSpecBusCF":1,"LossFrmSpecifiedBusCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"OthSrcLossRaceHorseCF":1}}}},"AdjTotBFLossInBFLA":{"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"BusLossOthThanSpecLossCF":1,"LossFrmSpecBusCF":1,"LossFrmSpecifiedBusCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"OthSrcLossRaceHorseCF":1}}}},"CurrentAYloss":{"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"BusLossOthThanSpecLossCF":1,"LossFrmSpecBusCF":1,"LossFrmSpecifiedBusCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"OthSrcLossRaceHorseCF":1}}}},"TotalLossCFSummary":{"r":1,"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"BusLossOthThanSpecLossCF":1,"LossFrmSpecBusCF":1,"LossFrmSpecifiedBusCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"OthSrcLossRaceHorseCF":1}}}}}},"ITR3ScheduleUD":{"c":{"CurrAssYr":1,"CurBalCFNY":1,"CurAllowBalCFNY":1,"ScheduleUD":{"a":1,"c":{"AssYr":1,"AmtBFUD":1,"AmtDeprSOCY":1,"BalCFNY":1,"AmtBFUAllow":1,"AmtAllowSOCY":1,"AllowBalCFNY":1}},"TotBFUDepritAmt":1,"TotCurYrdepritSetoffInc":1,"TotDepritBalCFNY":1,"TotBFUAllowAmt":1,"TotCurYrAllowSetoffInc":1,"TotalBalCFNY":1}},"ScheduleICDS":{"c":{"TotalNetAmtDetl":1}},"Schedule10AA":{"c":{"DeductSEZ":{"r":1,"c":{"DedUs10Detail":{"r":1,"c":{"Undertaking":{"r":1,"c":{"DedFromUndertakingWithAy":{"r":1,"a":1,"c":{"AssmtYrUnit":1,"DedUs10Sub":1}}}},"TotalDedUs10Sub":1}}}}}},"Schedule80G":{"c":{"Don100Percent":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon100PercentCash":1,"TotDon100PercentOtherMode":1,"TotDon100Percent":1,"TotEligibleDon100Percent":1}},"Don50PercentNoApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon50PercentNoApprReqdCash":1,"TotDon50PercentNoApprReqdOtherMode":1,"TotDon50PercentNoApprReqd":1,"TotEligibleDon50Percent":1}},"Don100PercentApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon100PercentApprReqdCash":1,"TotDon100PercentApprReqdOtherMode":1,"TotDon100PercentApprReqd":1,"TotEligibleDon100PercentApprReqd":1}},"Don50PercentApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon50PercentApprReqdCash":1,"TotDon50PercentApprReqdOtherMode":1,"TotDon50PercentApprReqd":1,"TotEligibleDon50PercentApprReqd":1}},"TotalDonationsUs80GCash":1,"TotalDonationsUs80GOtherMode":1,"TotalDonationsUs80G":1,"TotalEligibleDonationsUs80G":1}},"Schedule80GGA":{"c":{"DonationDtlsSciRsrchRuralDev":{"a":1,"c":{"RelevantClauseUndrDedClaimed":1,"NameOfDonee":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DoneePAN":1,"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotalDonationAmtCash80GGA":1,"TotalDonationAmtOtherMode80GGA":1,"TotalDonationsUs80GGA":1,"TotalEligibleDonationAmt80GGA":1}},"Schedule80GGC":{"c":{"Schedule80GGCDetails":{"a":1,"c":{"DonationDate":1,"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1,"PoliticalPartyName":1,"PoliticalPartyPAN":1}},"TotalDonationAmtCash80GGC":1,"TotalDonationAmtOtherMode80GGC":1,"TotalDonationsUs80GGC":1,"TotalEligibleDonationAmt80GGC":1}},"Schedule80C":{"c":{"Schedule80CDtls":{"r":1,"a":1,"c":{"Amount":1,"IdentificationNo":1}},"TotalAmt":1}},"Schedule80D":{"c":{"Sec80DSelfFamSrCtznHealth":{"r":1,"c":{"SeniorCitizenFlag":1,"Sec80DSelfFamHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"Sec80DSelfFamSrCtznHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"Sec80DParentsHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"Sec80DParentsSrCtznHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"EligibleAmountOfDedn":1}}}},"Schedule80DD":{"c":{"NatureOfDisability":1,"TypeOfDisability":1,"DeductionAmount":1,"DependentType":1}},"Schedule80U":{"c":{"NatureOfDisability":1,"TypeOfDisability":1,"DeductionAmount":1}},"Schedule80E":{"c":{"Schedule80EDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80E":1}},"TotalInterest80E":1}},"Schedule80EE":{"c":{"Schedule80EEDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80EE":1}},"TotalInterest80EE":1}},"Schedule80EEA":{"c":{"PropStmpDtyVal":1,"Schedule80EEADtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80EEA":1}},"TotalInterest80EEA":1}},"Schedule80EEB":{"c":{"Schedule80EEBDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"VehicleRegNo":1,"Interest80EEB":1}},"TotalInterest80EEB":1}},"Schedule80RA":{"c":{"DonationDtlsRsrchAssctn":{"a":1,"c":{"NameOfDonee":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DoneePAN":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotalDonationAmtCash80RA":1,"TotalDonationAmtOtherMode80RA":1,"TotalDonationsUs80RA":1,"TotalEligibleDonationAmt80RA":1}},"Schedule80_IA":{"c":{"Sch80SectionCode":1,"DeductUs80_IA_4_iv":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"TotSchedule80_IA":1}},"Schedule80_IB":{"c":{"Sch80SectionCode":1,"DeductMinOilUs80_IB_9_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"DeductHousUs80_IB_10_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"DeductFruitVegUs80_IB_11A_Und":{"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"DeductFoodGrainUs80_IB_11A_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"TotSchedule80_IB":1}},"Schedule80_IC":{"c":{"Sch80SectionCode":1,"DeductInNorthEast":{"r":1,"c":{"Assam_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"ArunachalPradesh_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"Manipur_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"Mizoram_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"Meghalaya_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"Nagaland_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"Tripura_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"Sikkim_Und":{"r":1,"c":{"Sch80LocOrDescCode":1,"Sch80DeductAmtDtls":{"a":1,"c":{"DeductAmountSec80":1}}}},"TotDeductInNorthEast":1}},"TotSchedule80_IC":1}},"ScheduleVIA":{"c":{"UsrDeductUndChapVIA":{"r":1,"c":{"PensionContribution80CCC":{"a":1,"c":{"TypeofIdentifier":1,"NameofIdentifier":1,"Amount":1}},"TotPartBchapterVIA":1,"TotPartCchapterVIA":1,"TotPartCAandDchapterVIA":1,"TotalChapVIADeductions":1}},"DeductUndChapVIA":{"r":1,"c":{"TotPartBchapterVIA":1,"TotPartCchapterVIA":1,"TotPartCAandDchapterVIA":1,"TotalChapVIADeductions":1}}}},"ScheduleAMT":{"c":{"TotalIncItem11":1,"AdjustmentSec115JC":{"r":1,"c":{"DeductClaimSec6A":1,"DeductClaimSec10AA":1,"DeductClaimSec35AD":1,"Total":1}},"AdjustedUnderSec115JC":1,"AdjustedUnderSec115JCIFSC":1,"AdjustedUnderSec115JCOther":1,"TaxPayableUnderSec115JC":1}},"ScheduleAMTC":{"c":{"TaxSection115JC":1,"TaxOthProvisions":1,"AmtTaxCreditAvailable":1,"ScheduleAMTCDtls":{"a":1,"c":{"AssYr":1,"AmtCreditFwd":1,"AmtCreditSetOfEy":1,"AmtCreditBalBroughtFwd":1,"AmtCreditUtilized":1,"BalAmtCreditCarryFwd":1}},"CurrYrAmtCreditFwd":1,"CurrYrCreditCarryFwd":1,"TotAMTGross":1,"TotSetOffEys":1,"TotBalBF":1,"TotAmtCreditUtilisedCY":1,"TotBalAMTCreditCF":1,"TaxSection115JD":1,"AmtLiabilityAvailable":1}},"ScheduleSI":{"c":{"SplCodeRateTax":{"a":1,"c":{"SecCode":1,"SplRatePercent":1,"SplRateInc":1,"SplRateIncTax":1}},"TotSplRateInc":1,"TotSplRateIncTax":1}},"ScheduleSPI":{"c":{"SpecifiedPerson":{"a":1,"c":{"SpecifiedPersonName":1,"ReltnShip":1,"AmtIncluded":1,"HeadIncIncluded":1}}}},"ScheduleIF":{"c":{"PartnerFirmDetails":{"a":1,"c":{"FirmName":1,"FirmPAN":1,"ProfitSharePercent":1,"ProfitShareAmt":1,"FirmCapBalOn31Mar":1}},"TotalProfitShareAmt":1,"TotalFirmCapBalOn31Mar":1}},"ScheduleEI":{"c":{"NetAgriIncOrOthrIncRule7":1,"ExcNetAgriInc":{"c":{"ExcNetAgriIncDtls":{"a":1,"c":{"NameOfDistrict":1,"PinCode":1,"MeasurementOfLand":1,"AgriLandOwnedFlag":1,"AgriLandIrrigatedFlag":1}}}},"OthersInc":{"c":{"OthersIncDtls":{"a":1,"c":{"OthAmount":1}}}},"IncNotChrgblAsPerDTAA":{"c":{"IncNotChrgblAsPerDTAADtls":{"a":1,"c":{"AmountOfIncome":1,"CountryName":1,"CountryCodeExcludingIndia":1,"HeadOfIncome":1}}}},"TotalExemptInc":1}},"SchedulePTI":{"c":{"SchedulePTIDtls":{"a":1,"c":{"InvstmntCvrdUs115UA115UB":1,"BusinessName":1,"BusinessPAN":1,"IncFromHP":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"CapitalGainsPTI":{"r":1,"c":{"ShortTermCG":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"STCG_Sec111A":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"STCG_Others":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"LongTermCG":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"LTCG_Sec112A":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"LTCG_Others":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}}}},"IncClmdPTI":{"r":1,"c":{"TotalSec23FBB":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"Sec23FBB":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"SecBIncExmptDtl":{"c":{"SectionCode":1,"SecBCIncExmptDtl":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}}}},"SecCIncExmptDtl":{"c":{"SectionCode":1,"SecBCIncExmptDtl":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}}}}}},"IncOthSrc":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"OS_Dividend":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"OS_Others":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}}}}}},"ScheduleTPSA":{"c":{"AmtPrimaryAdjUs92CE_2A":1,"AdditionalIncTax18PercAbove":1,"Surcharge12Perc":1,"HealthEducationCess":1,"TotalAdditionalTax":1,"TaxesPaid":1,"NetTaxPayable":1,"DtlsTaxesPaid":{"a":1,"c":{"BSRCode":1,"BankBranchName":1,"DateDep":1,"SrlNoOfChaln":1,"Amount":1}},"TotalAmountDeposited":1}},"ScheduleFSI":{"c":{"ScheduleFSIDtls":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"TaxIdentificationNo":1,"IncFromSal":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"IncFromHP":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"IncFromBusiness":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"IncCapGain":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"IncOthSrc":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"TotalCountryWise":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}}}}}},"ScheduleTR1":{"c":{"ScheduleTR":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"TaxIdentificationNo":1,"TaxPaidOutsideIndia":1,"TaxReliefOutsideIndia":1}},"TotalTaxPaidOutsideIndia":1,"TotalTaxReliefOutsideIndia":1,"TaxReliefOutsideIndiaDTAA":1,"TaxReliefOutsideIndiaNotDTAA":1}},"ScheduleFA":{"c":{"DetailsForiegnBank":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"Bankname":1,"AddressOfBank":1,"ZipCode":1,"ForeignAccountNumber":1,"OwnerStatus":1,"AccOpenDate":1,"PeakBalanceDuringYear":1,"ClosingBalance":1,"IntrstAccured":1}},"DtlsForeignCustodialAcc":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"FinancialInstName":1,"FinancialInstAddress":1,"ZipCode":1,"AccountNumber":1,"Status":1,"AccOpenDate":1,"PeakBalanceDuringPeriod":1,"ClosingBalance":1,"GrossAmtPaidCredited":1,"NatureOfAmount":1}},"DtlsForeignEquityDebtInterest":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"NameOfEntity":1,"AddressOfEntity":1,"ZipCode":1,"NatureOfEntity":1,"InterestAcquiringDate":1,"InitialValOfInvstmnt":1,"PeakBalanceDuringPeriod":1,"ClosingBalance":1,"TotGrossAmtPaidCredited":1,"TotGrossProceeds":1}},"DtlsForeignCashValueInsurance":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"FinancialInstName":1,"FinancialInstAddress":1,"ZipCode":1,"ContractDate":1,"CashValOrSurrenderVal":1,"TotGrossAmtPaidCredited":1}},"DetailsFinancialInterest":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfEntity":1,"AddressOfEntity":1,"NatureOfInt":1,"DateHeld":1,"TotalInvestment":1,"IncFromInt":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsImmovableProperty":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"Ownership":1,"DateOfAcq":1,"TotalInvestment":1,"IncDrvProperty":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsOthAssets":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NatureOfAsset":1,"Ownership":1,"DateOfAcq":1,"TotalInvestment":1,"IncDrvAsset":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsOfAccntsHvngSigningAuth":{"a":1,"c":{"NameOfInstitution":1,"AddressOfInstitution":1,"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameMentionedInAccnt":1,"InstitutionAccountNumber":1,"PeakBalanceOrInvestment":1,"IncAccuredTaxFlag":1}},"DetailsOfTrustOutIndiaTrustee":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfTrust":1,"AddressOfTrust":1,"NameOfOtherTrustees":1,"AddressOfOtherTrustees":1,"NameOfSettlor":1,"AddressOfSettlor":1,"NameOfBeneficiaries":1,"AddressOfBeneficiaries":1,"DateHeld":1,"IncDrvTaxFlag":1}},"DetailsOfOthSourcesIncOutsideIndia":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfPerson":1,"AddressOfPerson":1,"NatureOfInc":1,"IncDrvTaxFlag":1}}}},"Schedule5A2014":{"c":{"NameOfSpouse":1,"PANOfSpouse":1,"HPHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"BusHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"CapGainHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"OtherSourcesHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"TotalHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}}}},"ScheduleAL":{"c":{"ImmovableDetails":{"a":1,"c":{"Description":1,"AddressAL":{"r":1,"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1}},"Amount":1}},"MovableAsset":{"r":1,"c":{"DepositsInBank":1,"SharesAndSecurities":1,"InsurancePolicies":1,"LoansAndAdvancesGiven":1,"CashInHand":1,"JewelleryBullionEtc":1,"ArchCollDrawPaintSulpArt":1,"VehiclYachtsBoatsAircrafts":1}},"InterstAOPFlag":1,"InterestHeldInaAsset":{"a":1,"c":{"NameOfFirm":1,"AddressAL":{"r":1,"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1}},"PanOfFirm":1,"AssesseInvestment":1}},"LiabilityInRelatAssets":1}},"PartB-TI":{"r":1,"c":{"Salaries":1,"IncomeFromHP":1,"ProfBusGain":{"r":1,"c":{"ProfGainNoSpecBus":1,"ProfGainSpecBus":1,"ProfGainSpecifiedBus":1,"ProfIncome115BBF":1,"TotProfBusGain":1}},"CapGain":{"r":1,"c":{"ShortTerm":{"r":1,"c":{"ShortTerm20Per":1,"ShortTerm30Per":1,"ShortTermAppRate":1,"ShortTermSplRateDTAA":1,"TotalShortTerm":1}},"LongTerm":{"r":1,"c":{"LongTerm12_5Per":1,"LongTermSplRateDTAA":1,"TotalLongTerm":1}},"ShortTermLongTermTotal":1,"CapGains30Per115BBH":1,"TotalCapGains":1}},"IncFromOS":{"r":1,"c":{"OtherSrcThanOwnRaceHorse":1,"IncChargblSplRate":1,"FromOwnRaceHorse":1,"TotIncFromOS":1}},"TotalTI":1,"CurrentYearLoss":1,"BalanceAfterSetoffLosses":1,"BroughtFwdLossesSetoff":1,"GrossTotalIncome":1,"IncChargeTaxSplRate111A112":1,"DeductionsUndSchVIADtl":{"r":1,"c":{"PartBchapterVIA":1,"PartCchapterVIA":1,"TotDeductUndSchVIA":1}},"DeductionsUnder10Aor10AA":1,"TotalIncome":1,"AggregateIncome":1,"DeemedIncomeUs115JC":1}},"PartB_TTI":{"r":1,"c":{"ComputationOfTaxLiability":{"r":1,"c":{"TaxPayableOnDeemedTI":{"r":1,"c":{"TaxDeemedTISec115JC":1,"SurchargeOnAboveCrore":1,"EducationCess":1,"TotalTax":1}},"TaxPayableOnTI":{"r":1,"c":{"TaxAtNormalRatesOnAggrInc":1,"TaxAtSpecialRates":1,"RebateOnAgriInc":1,"TaxPayableOnTotInc":1,"Rebate87A":1,"TaxPayableOnRebate":1,"Surcharge25ofSI":1,"Surcharge25ofSIBeforeMarginal":1,"SurchargeOnAboveCroreBeforeMarginal":1,"SurchargeOnAboveCrore":1,"TotalSurcharge":1,"EducationCess":1,"GrossTaxLiability":1}},"GrossTaxPayable":1,"GrossTaxPay":{"c":{"TaxInc17":1,"TaxDeferred17":1,"TaxDeferredPayableCY":1}},"CreditUS115JD":1,"TaxPayAfterCreditUs115JD":1,"TaxRelief":{"c":{"TotTaxRelief":1}},"NetTaxLiability":1,"IntrstPay":{"r":1,"c":{"IntrstPayUs234A":1,"IntrstPayUs234B":1,"IntrstPayUs234C":1,"LateFilingFee234F":1}},"AggregateTaxInterestLiability":1}},"TaxPaid":{"r":1,"c":{"TaxesPaid":{"r":1,"c":{"TotalTaxesPaid":1}}}},"Refund":{"r":1,"c":{"RefundDue":1,"BankAccountDtls":{"r":1,"c":{"BankDtlsFlag":1,"AddtnlBankDetails":{"a":1,"c":{"IFSCCode":1,"BankName":1,"BankAccountNo":1,"AccountType":1,"UseForRefund":1}},"ForeignBankDetails":{"a":1,"c":{"SWIFTCode":1,"BankName":1,"CountryCode":1,"IBAN":1}}}}}},"AssetOutIndiaFlag":1}},"TaxReturnPreparer":{"c":{"IdentificationNoOfTRP":1,"NameOfTRP":1}},"ScheduleIT":{"c":{"TaxPayment":{"a":1,"c":{"BSRCode":1,"DateDep":1,"SrlNoOfChaln":1,"Amt":1}},"TotalTaxPayments":1}},"ScheduleTDS1":{"c":{"TDSonSalary":{"a":1,"c":{"EmployerOrDeductorOrCollectDetl":{"r":1,"c":{"TAN":1,"EmployerOrDeductorOrCollecterName":1}},"IncChrgSal":1,"TotalTDSSal":1}},"TotalTDSonSalaries":1}},"ScheduleTDS2":{"c":{"TDSOthThanSalaryDtls":{"a":1,"c":{"TDSCreditName":1,"TANOfDeductor":1,"TDSSection":1,"TaxDeductCreditDtls":{"r":1,"c":{"TaxClaimedOwnHands":1}},"AmtCarriedFwd":1}},"TotalTDSonOthThanSals":1}},"ScheduleTDS3":{"c":{"TDS3onOthThanSalDtls":{"a":1,"c":{"TDSCreditName":1,"PANOfBuyerTenant":1,"TDSSection":1,"TaxDeductCreditDtls":{"r":1,"c":{"TaxClaimedOwnHands":1}},"AmtCarriedFwd":1}},"TotalTDS3OnOthThanSal":1}},"ScheduleTCS":{"c":{"TCS":{"a":1,"c":{"TCSCreditOwner":1,"EmployerOrDeductorOrCollectTAN":1,"AmtCarriedFwd":1}},"TotalSchTCS":1}},"Verification":{"r":1,"c":{"Declaration":{"r":1,"c":{"AssesseeVerName":1,"FatherName":1,"AssesseeVerPAN":1}},"Capacity":1,"Date":1,"Place":1}},"ScheduleESOP":{"c":{"ScheduleESOP2122_Type":{"c":{"AssessmentYear":1,"BalanceTaxCF":1}},"ScheduleESOP2223_Type":{"c":{"AssessmentYear":1,"BalanceTaxCF":1}},"ScheduleESOP2324_Type":{"c":{"AssessmentYear":1,"BalanceTaxCF":1}},"ScheduleESOP2425_Type":{"c":{"AssessmentYear":1,"BalanceTaxCF":1}},"ScheduleESOP2526_Type":{"c":{"AssessmentYear":1,"BalanceTaxCF":1}},"ScheduleESOP2627_Type":{"c":{"AssessmentYear":1,"BalanceTaxCF":1}},"TotalTaxAttributedAmt":1}}}}},"r":1}}}');

/* ── Labels / hints ────────────────────────────────────────────────────────── */

const WORDS: Record<string, string> = {
  PAN: 'PAN of the assessee', DOB: 'Date of birth',
  SurNameOrOrgName: 'Surname / last name', FirstName: 'First name',
  ResidenceNo: 'Flat / door / block no.', LocalityOrArea: 'Locality / area',
  CityOrTownOrDistrict: 'City / town / district', StateCode: 'State', CountryCode: 'Country',
  CountryCodeMobile: 'Mobile country code', MobileNo: 'Mobile number',
  EmailAddress: 'E-mail address', SecondaryAdd: 'Is secondary address same as primary (Y/N)',
  Status: 'Status (Individual / HUF)', ReturnFileSec: 'Section under which return is filed',
  IncFrmBusOrProf: 'Income from business or profession (Y/N)',
  SeventhProvisio139: 'Filing under 7th proviso to 139(1) (Y/N)',
  ResidentialStatus: 'Residential status',
  HeldUnlistedEqShrPrYrFlg: 'Held unlisted equity shares during the year (Y/N)',
  ForeignExchangeFlag: 'Foreign-exchange / 115H flag', FiiFpiFlag: 'Are you an FII / FPI (Y/N)',
  ItrFilingDueDate: 'Applicable due date for filing the return',
  LiableSec44AAflg: 'Liable to maintain books u/s 44AA (Y/N)',
  IncDclrdUs: 'Declaring income only u/s 44AD/44ADA/44AE/44B/44BB/44BBA/44BBC/44BBD',
  LiableSec44ABflg: 'Liable to audit u/s 44AB (Y/N)',
  LiableSec92Eflg: 'Liable to furnish report u/s 92E (Y/N)',
  AccountAuditFlag: 'Accounts audited by an accountant (Y/N)',
  Cndnfor44AB: 'Condition by virtue of which liable to audit u/s 44AB',
  AuditReportFurnishDate: 'Date of furnishing the audit report',
  AckNum44AB: 'Acknowledgement number of the audit report',
  AudFrmName: 'Name of the audit firm', AudFrmPAN: 'PAN of the audit firm',
  AssesseeVerName: 'Name of the person verifying the return', FatherName: "Father's name",
  AssesseeVerPAN: 'PAN of the person verifying the return',
  Capacity: 'Capacity of the person verifying', Place: 'Place of verification',
  Date: 'Date of verification',
  BankDtlsFlag: 'Bank account details flag', RefundDue: 'Refund due',
  AssetOutIndiaFlag: 'Holding assets / signing authority outside India (Yes/No)',
  JSONCreationDate: 'JSON creation date', SWVersionNo: 'Software version number',
  SWCreatedBy: 'Software created by (ERI id)', JSONCreatedBy: 'JSON created by (ERI id)',
  IntermediaryCity: 'Intermediary city', Digest: 'Digest', FormName: 'Form name',
  Description: 'Form description', AssessmentYear: 'Assessment year',
  SchemaVer: 'Schema version', FormVer: 'Form version',
  NameOfBusiness: 'Name of business', Code: 'Business / profession code',
  CodeAD: 'Business code u/s 44AD', CodeADA: 'Profession code u/s 44ADA',
  CodeAE: 'Business code u/s 44AE',
  GrsTrnOverOrReceipt: 'Gross turnover / receipts u/s 44AD',
  TotPersumptiveInc44AD: 'Presumptive income u/s 44AD',
  GrsReceipt: 'Gross receipts u/s 44ADA',
  RegNumberGoodsCarriage: 'Registration number of goods carriage',
  TonnageCapacity: 'Tonnage capacity (MT)',
  HoldingPeriod: 'Number of months owned / leased / hired',
  PresumptiveIncome: 'Presumptive income for the goods carriage',
  NameOfSpouse: 'Name of spouse (Portuguese Civil Code)', PANOfSpouse: 'PAN of spouse',
  TotalTaxesPaid: 'Total taxes paid', TotalTI: 'Total head-wise income',
  TotalIncome: 'Total income', GrossTotalIncome: 'Gross total income',
};

const SECTION_HINT: Record<string, string> = {
  CreationInfo: 'Generated automatically on JSON export',
  Form_ITR3: 'Generated automatically on JSON export',
  PersonalInfo: 'ITR Info › Part A – General › Personal Information',
  FilingStatus: 'ITR Info › Part A – General › Filing Status',
  AuditInfo: 'ITR Info › Part A – General › Audit Information',
  NatOfBus: 'ITR Info › Part A – General › Nature of Business',
  PARTA_BS: 'ITR B/S › Part A – Balance Sheet',
  PARTA_PL: 'ITR P&L › Part A – Profit & Loss',
  PARTA_OI: 'ITR P&L › Part A – Other Information',
  PARTA_QD: 'ITR P&L › Part A – Quantitative Details',
  ManufacturingAccount: 'ITR P&L › Part A – Manufacturing Account',
  TradingAccount: 'ITR P&L › Part A – Trading Account',
  ITR3ScheduleBP: 'Computation › Schedule BP – Business / Profession',
  ScheduleS: 'Computation › Schedule S – Salary',
  ScheduleHP: 'Computation › Schedule HP – House Property',
  ScheduleDPM: 'Computation › Schedule DPM – Depreciation on plant & machinery',
  ScheduleDOA: 'Computation › Schedule DOA – Depreciation on other assets',
  ScheduleDEP: 'Computation › Schedule DEP – Summary of depreciation',
  ScheduleDCG: 'Computation › Schedule DCG – Deemed capital gains on depreciable assets',
  ScheduleESR: 'Computation › Schedule ESR – Deduction u/s 35',
  ScheduleCGFor23: 'Computation › Schedule CG – Capital Gains',
  Schedule112A: 'Computation › Schedule 112A – Equity LTCG (STT paid)',
  Schedule115AD: 'Computation › Schedule 115AD(1)(b)(iii) proviso',
  ScheduleVDA: 'Computation › Schedule VDA – Virtual Digital Assets',
  ScheduleOS: 'Computation › Schedule OS – Other Sources',
  ScheduleCYLA: 'Computation › Schedule CYLA – Current-year loss adjustment',
  ScheduleBFLA: 'Computation › Schedule BFLA – Brought-forward loss adjustment',
  ScheduleCFL: 'Computation › Schedule CFL – Losses to be carried forward',
  ITR3ScheduleUD: 'Computation › Schedule UD – Unabsorbed depreciation / 35(4)',
  ScheduleICDS: 'Computation › Schedule ICDS',
  Schedule10AA: 'Computation › Schedule 10AA – SEZ deduction',
  Schedule80G: 'Computation › Schedule 80G – Donations',
  Schedule80GGA: 'Computation › Schedule 80GGA – Scientific research / rural development',
  Schedule80GGC: 'Computation › Schedule 80GGC – Contribution to political party',
  Schedule80C: 'Computation › Schedule 80C',
  Schedule80D: 'Computation › Schedule 80D – Health insurance',
  Schedule80DD: 'Computation › Schedule 80DD – Dependent with disability',
  Schedule80U: 'Computation › Schedule 80U – Self with disability',
  Schedule80E: 'Computation › Schedule 80E – Interest on education loan',
  Schedule80EE: 'Computation › Schedule 80EE', Schedule80EEA: 'Computation › Schedule 80EEA',
  Schedule80EEB: 'Computation › Schedule 80EEB', Schedule80RA: 'Computation › Schedule RA',
  Schedule80_IA: 'Computation › Schedule 80-IA', Schedule80_IB: 'Computation › Schedule 80-IB',
  Schedule80_IC: 'Computation › Schedule 80-IC / 80-IE',
  ScheduleVIA: 'Computation › Schedule VI-A – Chapter VI-A deductions',
  ScheduleAMT: 'Computation › Schedule AMT', ScheduleAMTC: 'Computation › Schedule AMTC',
  ScheduleSI: 'Computation › Schedule SI – Special-rate income',
  ScheduleSPI: 'Computation › Schedule SPI – Income of spouse / minor',
  ScheduleIF: 'Computation › Schedule IF – Firms in which partner',
  ScheduleEI: 'Computation › Schedule EI – Exempt income',
  SchedulePTI: 'Computation › Schedule PTI – Pass-through income',
  ScheduleTPSA: 'Computation › Schedule TPSA – Secondary adjustment u/s 92CE',
  ScheduleFSI: 'Computation › Schedule FSI – Foreign-source income',
  ScheduleTR1: 'Computation › Schedule TR – Tax relief',
  ScheduleFA: 'Computation › Schedule FA – Foreign assets',
  Schedule5A2014: 'Computation › Schedule 5A – Portuguese Civil Code',
  ScheduleAL: 'Computation › Schedule AL – Assets & Liabilities',
  'PartB-TI': 'Tax Summary › Part B-TI – Computation of total income',
  PartB_TTI: 'Tax Summary › Part B-TTI – Computation of tax liability',
  TaxReturnPreparer: 'Tax Summary › Tax Return Preparer',
  ScheduleIT: 'Tax Summary › Taxes Paid › Advance / Self-assessment tax',
  ScheduleTDS1: 'Tax Summary › Taxes Paid › TDS on salary',
  ScheduleTDS2: 'Tax Summary › Taxes Paid › TDS other than salary',
  ScheduleTDS3: 'Tax Summary › Taxes Paid › TDS (Form 26QB/26QC/26QD)',
  ScheduleTCS: 'Tax Summary › Taxes Paid › TCS',
  ScheduleESOP: 'Tax Summary › Schedule – Tax deferred on ESOP',
  Verification: 'Tax Summary › Verification',
};

function humanize(seg: string): string {
  if (WORDS[seg]) return WORDS[seg];
  return seg
    .replace(/\[(\d+)\]/g, (_m, d: string) => ` (row ${Number(d) + 1})`)
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function mkMissing(path: string): MissingField {
  const segs = path.split('.').slice(2); // drop "ITR.ITR3"
  const label = segs.slice(-3).map(humanize).join(' › ') || humanize(path);
  const first = (segs[0] ?? '').replace(/\[\d+\]$/, '');
  const second = (segs[1] ?? '').replace(/\[\d+\]$/, '');
  const hint = SECTION_HINT[first === 'PartA_GEN1' || first === 'PartA_GEN2' ? second : first];
  return hint ? { path, label, hint } : { path, label };
}

/* ── Tree walker ───────────────────────────────────────────────────────────── */

const MAX_MISSING = 800;

function walkBranch(obj: unknown, branch: TreeBranch, path: string, missing: MissingField[], depth: number): void {
  if (!branch.c || depth > 40 || missing.length > MAX_MISSING) return;
  const rec = obj !== null && typeof obj === 'object' && !Array.isArray(obj)
    ? (obj as Record<string, unknown>) : undefined;
  for (const key of Object.keys(branch.c)) {
    const child = branch.c[key];
    const p = path ? `${path}.${key}` : key;
    const v = rec ? rec[key] : undefined;
    if (child === 1) {
      if (isEmpty(v)) missing.push(mkMissing(p));
      continue;
    }
    const required = !!child.r;
    if (child.a) {
      // Array branch: enforce per-element requirements only when rows exist.
      if (isEmpty(v)) { if (required) missing.push(mkMissing(p)); continue; }
      if (Array.isArray(v) && child.c) {
        const n = Math.min(v.length, 200);
        for (let i = 0; i < n; i++) walkBranch(v[i], { c: child.c }, `${p}[${i}]`, missing, depth + 1);
      }
      continue;
    }
    if (isEmpty(v) || typeof v !== 'object') {
      if (required) {
        if (child.c) walkBranch(undefined, child, p, missing, depth + 1);
        else missing.push(mkMissing(p));
      }
      continue;
    }
    walkBranch(v, child, p, missing, depth + 1);
  }
}

/* ── Category-A rule engine ────────────────────────────────────────────────── */

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
  return undefined;
}
function n0(v: unknown): number { return num(v) ?? 0; }
/** Tolerant equality — absent operands are treated as "cannot judge". */
function neq(a: unknown, b: number, tol = 1): boolean {
  const x = num(a);
  if (x === undefined) return false;
  return Math.abs(x - b) > tol;
}
function filled(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  return true;
}
function asArr(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }
function str(v: unknown): string { return typeof v === 'string' ? v.trim() : ''; }
/** YYYY-MM-DD → comparable number, 0 when unparseable. */
function dnum(v: unknown): number {
  const s = str(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]) : 0;
}
function todayNum(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

interface RuleCtx {
  r3: unknown;                 // the ITR.ITR3 object
  errors: MandatoryIssue[];
  warnings: MandatoryIssue[];
  missing: MissingField[];
}

const P = 'ITR.ITR3';
const g = (ctx: RuleCtx, rel: string): unknown => at(ctx.r3, rel);

function err(ctx: RuleCtx, rule: string, rel: string, msg: string): void {
  if (ctx.errors.length < 400) ctx.errors.push({ path: `${P}.${rel}`, msg, rule });
}
function warn(ctx: RuleCtx, rule: string | undefined, rel: string, msg: string): void {
  if (ctx.warnings.length < 400) {
    const path = `${P}.${rel}`;
    ctx.warnings.push(rule ? { path, msg, rule } : { path, msg });
  }
}
/** Conditionally-mandatory field → goes to missing[] (with the rule id in the hint). */
function need(ctx: RuleCtx, rule: string, rel: string, label: string, hint?: string): void {
  if (filled(g(ctx, rel))) return;
  if (ctx.missing.length > MAX_MISSING) return;
  const path = `${P}.${rel}`;
  if (ctx.missing.some((m) => m.path === path)) return;
  ctx.missing.push({ path, label, hint: hint ? `${hint} (rule ${rule})` : `Required by rule ${rule}` });
}

/* Common path prefixes */
const PI = 'PartA_GEN1.PersonalInfo';
const FS = 'PartA_GEN1.FilingStatus';
const AI = 'PartA_GEN2.AuditInfo';
const BS = 'PARTA_BS';
const PL = 'PARTA_PL';
const BP = 'ITR3ScheduleBP';
const TI = 'PartB-TI';
const TT = 'PartB_TTI';
const VIA = 'ScheduleVIA.DeductUndChapVIA';
const UVIA = 'ScheduleVIA.UsrDeductUndChapVIA';

function applyCategoryARules(ctx: RuleCtx): void {
  const status = str(g(ctx, `${PI}.Status`));                 // 'I' | 'H'
  const isHUF = status === 'H';
  const res = str(g(ctx, `${FS}.ResidentialStatus`));         // RES | NRI | NOR
  const isNR = res === 'NRI';
  const isResident = res === 'RES' || res === 'NOR';
  const filingSec = num(g(ctx, `${FS}.ReturnFileSec`));
  const oldRegime = str(g(ctx, `${FS}.OptOldRegimeCurrAY`)) === 'Y'
    || str(g(ctx, `${FS}.F10IEACurrAYOldRegime`)) === 'Y';
  const newRegime = !oldRegime;
  const today = todayNum();

  /* ── Part A – General: identity & contact ─────────────────────────────── */

  // A-1  Assessee should provide valid Mobile Number.
  const mob = g(ctx, `${PI}.Address.MobileNo`);
  if (filled(mob) && !/^[1-9]\d{9}$/.test(String(num(mob) ?? '')))
    err(ctx, 'A-1', `${PI}.Address.MobileNo`, 'Mobile number must be a valid 10-digit number.');

  // A-33 Date of birth must be before 01/04/2026 (start of the AY).
  const dob = dnum(g(ctx, `${PI}.DOB`));
  if (dob && dob >= 20260401)
    err(ctx, 'A-33', `${PI}.DOB`, 'Date of birth/formation must be before 01-04-2026 for AY 2026-27.');

  // A-49/A-50 Secondary address flag + distinct alternate address.
  const secAdd = str(g(ctx, `${PI}.SecondaryAdd`));
  if (secAdd === 'N') {
    need(ctx, 'A-50', `${PI}.AlternateAddress.ResidenceNo`, 'Secondary address – flat / door / block no.', SECTION_HINT.PersonalInfo);
    need(ctx, 'A-50', `${PI}.AlternateAddress.CityOrTownOrDistrict`, 'Secondary address – city / town / district', SECTION_HINT.PersonalInfo);
    need(ctx, 'A-50', `${PI}.AlternateAddress.StateCode`, 'Secondary address – state', SECTION_HINT.PersonalInfo);
    const a1 = `${str(g(ctx, `${PI}.Address.ResidenceNo`))}|${str(g(ctx, `${PI}.Address.LocalityOrArea`))}|${str(g(ctx, `${PI}.Address.CityOrTownOrDistrict`))}`;
    const a2 = `${str(g(ctx, `${PI}.AlternateAddress.ResidenceNo`))}|${str(g(ctx, `${PI}.AlternateAddress.LocalityOrArea`))}|${str(g(ctx, `${PI}.AlternateAddress.CityOrTownOrDistrict`))}`;
    if (a2.replace(/\|/g, '') !== '' && a1.toUpperCase() === a2.toUpperCase())
      err(ctx, 'A-50', `${PI}.AlternateAddress`, 'Secondary address must not be the same as the primary address when "same as primary" is answered No.');
  }

  /* ── Filing status & regime ───────────────────────────────────────────── */

  // A-23 Notice details mandatory for 139(9)/142(1)/148/119(2)(b)/153C.
  if (filingSec !== undefined && [13, 14, 16, 18, 20].indexOf(filingSec) >= 0) {
    need(ctx, 'A-23', `${FS}.NoticeNo`, 'Unique number / DIN of the notice or order', SECTION_HINT.FilingStatus);
    need(ctx, 'A-23', `${FS}.NoticeDate`, 'Date of the notice or order', SECTION_HINT.FilingStatus);
  }
  // A-19 Once a proceeding u/s 148 / 153A / 153C is initiated, no return can be filed u/s 139(8A).
  if (filingSec === 21 && (filled(g(ctx, `${FS}.NoticeNo`)) || filled(g(ctx, `${FS}.NoticeDate`))))
    err(ctx, 'A-19', `${FS}.ReturnFileSec`, 'An updated return u/s 139(8A) cannot be filed once a proceeding u/s 148 / 153A / 153C has been initiated.');
  // Revised return must quote the original acknowledgement number & date.
  if (filingSec === 17 || filingSec === 19) {
    need(ctx, 'A-23', `${FS}.ReceiptNo`, 'Acknowledgement number of the original return', SECTION_HINT.FilingStatus);
    need(ctx, 'A-23', `${FS}.OrigRetFiledDate`, 'Date of filing of the original return', SECTION_HINT.FilingStatus);
  }

  // A-6  Unlisted equity shares held → table mandatory.
  if (str(g(ctx, `${FS}.HeldUnlistedEqShrPrYrFlg`)) === 'Y'
    && asArr(g(ctx, `${FS}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`)).length === 0)
    err(ctx, 'A-6', `${FS}.HeldUnlistedEqShrPrYr`, 'Unlisted equity shares held during the year is "Yes" — details of the shares must be filled.');

  // A-11 Director in a company → table mandatory.
  if (str(g(ctx, `${FS}.CompDirectorPrvYrFlg`)) === 'Y'
    && asArr(g(ctx, `${FS}.CompDirectorPrvYr.CompDirectorPrvYrDtls`)).length === 0)
    err(ctx, 'A-11', `${FS}.CompDirectorPrvYr`, 'Director in a company during the year is "Yes" — company details must be filled.');

  // Partner in a firm → table mandatory (Schedule IF companion).
  if (str(g(ctx, `${FS}.PartnerInFirmFlg`)) === 'Y'
    && asArr(g(ctx, `${FS}.PartnerInFirm.PartnerInFirmDtls`)).length === 0)
    err(ctx, 'A-11', `${FS}.PartnerInFirm`, 'Partner in a firm is "Yes" — name and PAN of the firm(s) must be filled.');

  // A-10 Seventh proviso to 139(1) = Yes → at least one amount must be provided.
  if (str(g(ctx, `${FS}.SeventhProvisio139`)) === 'Y') {
    const anySeventh = [
      g(ctx, `${FS}.AmtSeventhProvisio139i`), g(ctx, `${FS}.AmtSeventhProvisio139ii`),
      g(ctx, `${FS}.AmtSeventhProvisio139iii`),
    ].some((v) => n0(v) > 0) || asArr(g(ctx, `${FS}.clauseiv7provisio139iDtls`)).length > 0;
    if (!anySeventh)
      err(ctx, 'A-10', `${FS}.SeventhProvisio139`, 'Filing under the 7th proviso to section 139(1) is "Yes" — the corresponding details/amounts must be provided.');
  }
  // A-21 Clause (iv) of the 7th proviso = Yes → nature + amount rows mandatory.
  if (str(g(ctx, `${FS}.clauseiv7provisio139i`)) === 'Y'
    && asArr(g(ctx, `${FS}.clauseiv7provisio139iDtls`)).length === 0)
    err(ctx, 'A-21', `${FS}.clauseiv7provisio139iDtls`, 'Return required under clause (iv) of the 7th proviso — nature and amount must be filled.');

  // A-41 Form 10IEA filed in an earlier AY for the old regime.
  if (str(g(ctx, `${FS}.Form10IEAEarlierAYOldRegime`)) === 'Y') {
    need(ctx, 'A-41', `${FS}.Form10IEAAssYear`, 'Assessment year of the earlier Form 10-IEA (old regime)', SECTION_HINT.FilingStatus);
    need(ctx, 'A-41', `${FS}.Form10IEAEarlierAYAckOldRegime`, 'Acknowledgement number of the earlier Form 10-IEA (old regime)', SECTION_HINT.FilingStatus);
  }
  // A-42 Form 10IEA filed in an earlier AY to re-enter the new regime.
  if (str(g(ctx, `${FS}.F10IEAEarlierAYNewRegime`)) === 'Y') {
    need(ctx, 'A-42', `${FS}.AssYrF10IEANewTaxReg`, 'Assessment year of the earlier Form 10-IEA (re-entry to new regime)', SECTION_HINT.FilingStatus);
    need(ctx, 'A-42', `${FS}.Form10IEAEarlierAYAckNewRegime`, 'Acknowledgement number of the earlier Form 10-IEA (re-entry to new regime)', SECTION_HINT.FilingStatus);
  }
  // A-43 Not re-entered earlier → the current-AY re-entry question must be answered.
  if (str(g(ctx, `${FS}.Form10IEAEarlierAYOldRegime`)) === 'Y'
    && str(g(ctx, `${FS}.F10IEAEarlierAYNewRegime`)) !== 'Y')
    need(ctx, 'A-43', `${FS}.F10IEACurrAYNewRegime`, 'Have you furnished Form 10-IEA for re-entering the new tax regime in the current AY?', SECTION_HINT.FilingStatus);
  // A-44 Re-entering the new regime in the current AY → Form 10-IEA details.
  if (str(g(ctx, `${FS}.F10IEACurrAYNewRegime`)) === 'Y') {
    need(ctx, 'A-44', `${FS}.F10IEADateCurrAYNewTax`, 'Date of filing Form 10-IEA (current AY, new regime)', SECTION_HINT.FilingStatus);
    need(ctx, 'A-44', `${FS}.F10IEAAckNoCurrAYNewTax`, 'Acknowledgement number of Form 10-IEA (current AY, new regime)', SECTION_HINT.FilingStatus);
  }
  // A-45 Opting for the old regime in the current AY → Form 10-IEA details.
  if (str(g(ctx, `${FS}.F10IEACurrAYOldRegime`)) === 'Y' || str(g(ctx, `${FS}.OptOldRegimeCurrAY`)) === 'Y') {
    need(ctx, 'A-45', `${FS}.F10IEADateCurrAYOldTax`, 'Date of filing Form 10-IEA (current AY, old regime)', SECTION_HINT.FilingStatus);
    need(ctx, 'A-45', `${FS}.F10IEAAckNoCurrAYOldTax`, 'Acknowledgement number of Form 10-IEA (current AY, old regime)', SECTION_HINT.FilingStatus);
  }
  // A-46 Business-income answer is mandatory whenever any 10-IEA option is used.
  if ((filled(g(ctx, `${FS}.Form10IEAEarlierAYOldRegime`)) || filled(g(ctx, `${FS}.F10IEACurrAYOldRegime`))
    || filled(g(ctx, `${FS}.F10IEACurrAYNewRegime`))) && !filled(g(ctx, `${FS}.IncFrmBusOrProf`)))
    err(ctx, 'A-46', `${FS}.IncFrmBusOrProf`, 'Answer to "Income from business or profession" is mandatory when any Form 10-IEA option is selected.');

  // A-9 / A-47 Representative assessee.
  const capacity = str(g(ctx, 'Verification.Capacity'));
  if (capacity === 'R') {
    if (str(g(ctx, `${FS}.AsseseeRepFlg`)) !== 'Y')
      err(ctx, 'A-9', `${FS}.AsseseeRepFlg`, 'Capacity in Verification is "Representative" — "Whether this return is being filed by a representative assessee" must be "Yes".');
    need(ctx, 'A-9', `${FS}.AssesseeRep.RepName`, 'Name of the representative assessee', SECTION_HINT.FilingStatus);
    need(ctx, 'A-9', `${FS}.AssesseeRep.RepEmailID`, 'E-mail of the representative assessee', SECTION_HINT.FilingStatus);
    need(ctx, 'A-9', `${FS}.AssesseeRep.RepMobileNo`, 'Mobile number of the representative assessee', SECTION_HINT.FilingStatus);
  }
  if (str(g(ctx, `${FS}.AsseseeRepFlg`)) === 'Y') {
    const repMail = str(g(ctx, `${FS}.AssesseeRep.RepEmailID`)).toUpperCase();
    const ownMail = str(g(ctx, `${PI}.Address.EmailAddress`)).toUpperCase();
    if (repMail !== '' && repMail === ownMail)
      err(ctx, 'A-47', `${FS}.AssesseeRep.RepEmailID`, 'E-mail of the representative assessee must not be the same as the primary e-mail of the taxpayer.');
    const repMob = num(g(ctx, `${FS}.AssesseeRep.RepMobileNo`));
    const ownMob = num(mob);
    if (repMob !== undefined && repMob === ownMob)
      err(ctx, 'A-47', `${FS}.AssesseeRep.RepMobileNo`, 'Mobile number of the representative assessee must not be the same as the primary mobile number of the taxpayer.');
  }

  // A-7 / A-22 / A-903 Portuguese Civil Code ↔ Schedule 5A.
  const pcc = str(g(ctx, `${FS}.PortugeseCC5A`));
  const sch5A = g(ctx, 'Schedule5A2014');
  if (pcc === 'Y') {
    if (!filled(sch5A))
      err(ctx, 'A-7', 'Schedule5A2014', 'Governed by the Portuguese Civil Code (section 5A) is "Yes" — Schedule 5A must be filled.');
    else {
      need(ctx, 'A-903', 'Schedule5A2014.NameOfSpouse', 'Name of spouse (Schedule 5A)', SECTION_HINT.Schedule5A2014);
      need(ctx, 'A-903', 'Schedule5A2014.PANOfSpouse', 'PAN of spouse (Schedule 5A)', SECTION_HINT.Schedule5A2014);
    }
  } else if (pcc === 'N' && filled(sch5A)) {
    err(ctx, 'A-22', 'Schedule5A2014', 'Schedule 5A must not be filled when "Governed by the Portuguese Civil Code" is "No".');
  }

  // A-37 DTAA benefit only for non-residents.
  if (isResident) {
    const dtaa = n0(g(ctx, 'ScheduleEI.IncChrgblAsPerDTAA'));
    if (dtaa > 0)
      warn(ctx, 'A-37', 'ScheduleEI.IncChrgblAsPerDTAA', 'DTAA rate benefit is claimed although the residential status is not Non-Resident; the claim may not be allowed.');
  }
  // A-888 / A-898 Schedule FSI / TR not applicable to non-residents.
  if (isNR && asArr(g(ctx, 'ScheduleFSI.ScheduleFSIDtls')).length > 0)
    err(ctx, 'A-888', 'ScheduleFSI', 'Schedule FSI is not applicable when the residential status is Non-Resident.');
  if (isNR && asArr(g(ctx, 'ScheduleTR1.ScheduleTR')).length > 0)
    err(ctx, 'A-898', 'ScheduleTR1', 'Schedule TR is not applicable when the residential status is Non-Resident.');

  // A-48 FPI flag required when 115AD(1)(i) income is offered in Schedule OS.
  const q115AD = ['Upto15Of6', 'Up16Of6To15Of9', 'Up16Of9To15Of12', 'Up16Of12To15Of3', 'Up16Of3To31Of3']
    .reduce((t, q) => t + n0(g(ctx, `ScheduleOS.DividendIncUs115AD1i.DateRange.${q}`)), 0);
  if (q115AD > 0
    && str(g(ctx, `${FS}.FiiFpiFlag`)) !== 'Y')
    err(ctx, 'A-48', `${FS}.FiiFpiFlag`, '"Whether you are FPI?" must be "Yes" to offer income under section 115AD(1)(i) in Schedule OS.');

  /* ── Audit information (Part A – General 2) ───────────────────────────── */

  const lia44AB = str(g(ctx, `${AI}.LiableSec44ABflg`));
  const auditByCA = str(g(ctx, `${AI}.AuditAccountantFlg`));
  const a2i = str(g(ctx, `${AI}.TotalSalesExcOneCr`));
  const a2ii = str(g(ctx, `${AI}.AgrOFAllAmtsRcvd`));
  const a2iii = str(g(ctx, `${AI}.AgrOFAllPayMade`));

  // A-15 / A-16 Turnover band "More than 1 Cr and up to 10 Cr" → a2ii and a2iii mandatory.
  if (a2i === 'Upto10CR') {
    need(ctx, 'A-15', `${AI}.AgrOFAllAmtsRcvd`, 'Aggregate of all amounts received (cash ≤/> 5%) — Sl. a2(ii)', SECTION_HINT.AuditInfo);
    need(ctx, 'A-16', `${AI}.AgrOFAllPayMade`, 'Aggregate of all payments made (cash ≤/> 5%) — Sl. a2(iii)', SECTION_HINT.AuditInfo);
  }
  // A-28 / A-29 / A-30 "More than 5%" ⇒ liable to audit u/s 44AB.
  if ((a2ii === 'MoreThan5Per' || a2iii === 'MoreThan5Per') && lia44AB !== 'Y')
    err(ctx, 'A-30', `${AI}.LiableSec44ABflg`, 'Sl. a2(ii)/a2(iii) is "More than 5%" — the assessee is liable to audit u/s 44AB and the flag must be "Yes".');
  // A-24 Condition for 44AB liability.
  if (lia44AB === 'Y')
    need(ctx, 'A-24', `${AI}.Cndnfor44AB`, 'Condition by virtue of which liable to audit u/s 44AB', SECTION_HINT.AuditInfo);
  // A-13 Auditor / audit-report particulars.
  if (lia44AB === 'Y' && auditByCA === 'Y') {
    need(ctx, 'A-13', `${AI}.AuditReportFurnishDate`, 'Date of furnishing the audit report u/s 44AB', SECTION_HINT.AuditInfo);
    need(ctx, 'A-13', `${AI}.AckNum44AB`, 'Acknowledgement number of the audit report u/s 44AB', SECTION_HINT.AuditInfo);
    need(ctx, 'A-13', `${AI}.AudFrmName`, 'Name of the audit firm', SECTION_HINT.AuditInfo);
    need(ctx, 'A-13', `${AI}.AudFrmPAN`, 'PAN of the audit firm', SECTION_HINT.AuditInfo);
  }
  // A-17 Date of audit report cannot be in the future.
  const adate = dnum(g(ctx, `${AI}.AuditReportFurnishDate`));
  if (adate && adate > today)
    err(ctx, 'A-17', `${AI}.AuditReportFurnishDate`, 'Date of the audit report cannot be after the current system date.');
  for (const [i, row] of asArr(g(ctx, `${AI}.AuditDetails`)).entries()) {
    const d = dnum(at(row, 'DateOfAudit'));
    if (d && d > today)
      err(ctx, 'A-17', `${AI}.AuditDetails[${i}].DateOfAudit`, 'Date of the audit report cannot be after the current system date.');
  }
  // 92E audit → date and acknowledgement number.
  if (str(g(ctx, `${AI}.LiableSec92Eflg`)) === 'Y') {
    need(ctx, 'A-13', `${AI}.AuditDetails92E.DateOfAudit`, 'Date of the report u/s 92E (Form 3CEB)', SECTION_HINT.AuditInfo);
    need(ctx, 'A-13', `${AI}.AuditDetails92E.AckNum92E`, 'Acknowledgement number of the report u/s 92E', SECTION_HINT.AuditInfo);
  }
  // A-14 "Declaring income only under the presumptive sections" must be answered.
  need(ctx, 'A-14', `${AI}.IncDclrdUs`, WORDS.IncDclrdUs, SECTION_HINT.AuditInfo);
  // A-25 Applicable due date must be selected.
  need(ctx, 'A-25', `${FS}.ItrFilingDueDate`, WORDS.ItrFilingDueDate, SECTION_HINT.FilingStatus);

  // A-26 / A-27 Extended due date requires Schedule IF or 5A or audit details.
  const dueDate = str(g(ctx, `${FS}.ItrFilingDueDate`));
  if (dueDate === '2026-10-31' || dueDate === '2026-11-30') {
    const hasIF = asArr(g(ctx, 'ScheduleIF.PartnerFirmDetails')).length > 0;
    const hasAudit = lia44AB === 'Y' || str(g(ctx, `${AI}.LiableSec92Eflg`)) === 'Y'
      || filled(g(ctx, `${AI}.AuditReportFurnishDate`)) || asArr(g(ctx, `${AI}.AuditDetails`)).length > 0;
    if (!hasIF && !filled(sch5A) && !hasAudit)
      err(ctx, dueDate === '2026-10-31' ? 'A-26' : 'A-27', `${FS}.ItrFilingDueDate`,
        `Due date ${dueDate === '2026-10-31' ? '31st October' : '30th November'} is selected — Schedule IF, Schedule 5A or audit details in Part A-General must be filled.`);
  }

  /* ── Books of account / Balance Sheet / P&L ───────────────────────────── */

  const bsRegular = n0(g(ctx, `${BS}.FundSrc.TotFundSrc`)) !== 0 || n0(g(ctx, `${BS}.FundApply.TotFundApply`)) !== 0;
  const bsNoAcct = filled(g(ctx, `${BS}.NoBooksOfAccBS`));
  const plRegular = n0(g(ctx, `${PL}.CreditsToPL.TotCreditsToPL`)) !== 0 || n0(g(ctx, `${PL}.DebitsToPL.PBT`)) !== 0;

  // A-51 Liable to audit u/s 44AB → Part A BS and Part A P&L must be filled.
  if (lia44AB === 'Y') {
    if (!bsRegular)
      err(ctx, 'A-51', `${BS}.FundSrc`, 'The assessee is liable to audit u/s 44AB — the regular Balance Sheet (Part A-BS) must be filled.');
    if (!plRegular)
      err(ctx, 'A-51', `${PL}.CreditsToPL`, 'The assessee is liable to audit u/s 44AB — the regular Profit & Loss account (Part A-P&L) must be filled.');
  }

  // A-52 … A-60 Balance-sheet arithmetic.
  const totPropFund = n0(g(ctx, `${BS}.FundSrc.PropFund.TotPropFund`));
  const totLoanFund = n0(g(ctx, `${BS}.FundSrc.LoanFunds.TotLoanFund`));
  const totFundSrc = n0(g(ctx, `${BS}.FundSrc.TotFundSrc`));
  const totFundApply = n0(g(ctx, `${BS}.FundApply.TotFundApply`));
  if (bsRegular) {
    // A-52
    if (Math.abs(totFundSrc - totFundApply) > 1)
      err(ctx, 'A-52', `${BS}.FundApply.TotFundApply`, 'Total sources of funds must equal total application of funds.');
    // A-53
    if (neq(g(ctx, `${BS}.FundSrc.PropFund.TotPropFund`),
      n0(g(ctx, `${BS}.FundSrc.PropFund.PropCap`)) + n0(g(ctx, `${BS}.FundSrc.PropFund.ResrNSurp.TotResrNSurp`))))
      err(ctx, 'A-53', `${BS}.FundSrc.PropFund.TotPropFund`, "Total of proprietor's fund must equal proprietor's capital plus total reserves & surplus.");
    // A-54
    if (neq(g(ctx, `${BS}.FundSrc.LoanFunds.TotLoanFund`),
      n0(g(ctx, `${BS}.FundSrc.LoanFunds.SecrLoan.TotSecrLoan`)) + n0(g(ctx, `${BS}.FundSrc.LoanFunds.UnsecrLoan.TotUnSecrLoan`))))
      err(ctx, 'A-54', `${BS}.FundSrc.LoanFunds.TotLoanFund`, 'Total loan funds must equal secured loans plus unsecured loans.');
    // A-55
    if (neq(g(ctx, `${BS}.FundSrc.TotFundSrc`),
      totPropFund + totLoanFund + n0(g(ctx, `${BS}.FundSrc.DeferredTax`)) + n0(g(ctx, `${BS}.FundSrc.Advances.TotalAdvances`))))
      err(ctx, 'A-55', `${BS}.FundSrc.TotFundSrc`, "Total sources of funds must equal proprietor's fund + loan funds + deferred tax liability + advances.");
    // A-56
    if (neq(g(ctx, `${BS}.FundApply.Investments.TotInvestments`),
      n0(g(ctx, `${BS}.FundApply.Investments.LongTermInv.TotLongTermInv`)) + n0(g(ctx, `${BS}.FundApply.Investments.TradeInv.TotTradeInv`))))
      err(ctx, 'A-56', `${BS}.FundApply.Investments.TotInvestments`, 'Total investments must equal long-term investments plus short-term (trade) investments.');
    // A-57
    const ca = `${BS}.FundApply.CurrAssetLoanAdv.CurrAsset`;
    if (neq(g(ctx, `${ca}.TotCurrAsset`),
      n0(g(ctx, `${ca}.Inventories.TotInventries`)) + n0(g(ctx, `${ca}.SndryDebtors`))
      + n0(g(ctx, `${ca}.CashOrBankBal.TotCashOrBankBal`)) + n0(g(ctx, `${ca}.OthCurrAsset`))))
      err(ctx, 'A-57', `${ca}.TotCurrAsset`, 'Total current assets must equal inventories + sundry debtors + cash & bank balances + other current assets.');
    // A-58
    const cla = `${BS}.FundApply.CurrAssetLoanAdv`;
    if (neq(g(ctx, `${cla}.NetCurrAsset`),
      n0(g(ctx, `${cla}.TotCurrAssetLoanAdv`)) - n0(g(ctx, `${cla}.CurrLiabilitiesProv.TotCurrLiabilitiesProvision`))))
      err(ctx, 'A-58', `${cla}.NetCurrAsset`, 'Net current assets must equal total current assets, loans & advances minus total current liabilities & provisions.');
    // A-59
    if (neq(g(ctx, `${BS}.FundApply.TotFundApply`),
      n0(g(ctx, `${BS}.FundApply.FixedAsset.TotFixedAsset`)) + n0(g(ctx, `${BS}.FundApply.Investments.TotInvestments`))
      + n0(g(ctx, `${cla}.NetCurrAsset`)) + n0(g(ctx, `${BS}.FundApply.MiscAdjust.TotMiscAdjust`))))
      err(ctx, 'A-59', `${BS}.FundApply.TotFundApply`, 'Total application of funds must equal fixed assets + investments + net current assets + miscellaneous expenditure.');
  }

  /* ── Presumptive income (Part A – P&L) ────────────────────────────────── */

  const nob44AD = asArr(g(ctx, `${PL}.NatOfBus44AD`));
  const nob44ADA = asArr(g(ctx, `${PL}.NatOfBus44ADA`));
  const nob44AE = asArr(g(ctx, `${PL}.NatOfBus44AE`));
  const inc44AD = n0(g(ctx, `${PL}.PersumptiveInc44AD.TotPersumptiveInc44AD`));
  const gr44AD = n0(g(ctx, `${PL}.PersumptiveInc44AD.GrsTrnOverOrReceipt`));
  const gr44ADbank = n0(g(ctx, `${PL}.PersumptiveInc44AD.GrsTrnOverBank`));
  const gr44ADcash = n0(g(ctx, `${PL}.PersumptiveInc44AD.GrsTotalTrnOverInCash`));
  const gr44ADoth = n0(g(ctx, `${PL}.PersumptiveInc44AD.GrsTrnOverAnyOthMode`));
  const inc44ADA = n0(g(ctx, `${PL}.PersumptiveInc44ADA.TotPersumptiveInc44ADA`));
  const gr44ADA = n0(g(ctx, `${PL}.PersumptiveInc44ADA.GrsReceipt`));
  const inc44AE = n0(g(ctx, `${PL}.TotalPrsumptvIncUs44EGoods`));

  // A-105 / A-106
  if (nob44AD.length > 0 && inc44AD <= 0)
    err(ctx, 'A-105', `${PL}.PersumptiveInc44AD.TotPersumptiveInc44AD`, 'A business code u/s 44AD is selected — income u/s 44AD must be declared.');
  if ((gr44AD > 0 || inc44AD > 0) && nob44AD.length === 0)
    err(ctx, 'A-106', `${PL}.NatOfBus44AD`, 'Nature of business must be filled when gross turnover or presumptive income u/s 44AD is greater than zero.');
  // A-107 / A-108
  if (nob44ADA.length > 0 && inc44ADA <= 0)
    err(ctx, 'A-107', `${PL}.PersumptiveInc44ADA.TotPersumptiveInc44ADA`, 'A profession code u/s 44ADA is selected — income u/s 44ADA must be declared.');
  if ((gr44ADA > 0 || inc44ADA > 0) && nob44ADA.length === 0)
    err(ctx, 'A-108', `${PL}.NatOfBus44ADA`, 'Nature of profession must be filled when gross receipts or presumptive income u/s 44ADA is greater than zero.');
  // A-109 / A-110
  if (nob44AE.length > 0 && inc44AE <= 0)
    err(ctx, 'A-109', `${PL}.TotalPrsumptvIncUs44EGoods`, 'A business code u/s 44AE is selected — income u/s 44AE must be declared.');
  if (inc44AE > 0 && nob44AE.length === 0)
    err(ctx, 'A-110', `${PL}.NatOfBus44AE`, 'Nature of business must be filled when presumptive income u/s 44AE is greater than zero.');

  // A-98 gross turnover break-up; A-136 gross receipts break-up.
  if (gr44AD > 0 && neq(g(ctx, `${PL}.PersumptiveInc44AD.GrsTrnOverOrReceipt`), gr44ADbank + gr44ADcash + gr44ADoth))
    err(ctx, 'A-98', `${PL}.PersumptiveInc44AD.GrsTrnOverOrReceipt`, 'Gross turnover/receipts u/s 44AD must equal the sum of its bank, cash and other-mode break-up.');
  if (gr44ADA > 0 && neq(g(ctx, `${PL}.PersumptiveInc44ADA.GrsReceipt`),
    n0(g(ctx, `${PL}.PersumptiveInc44ADA.GrsTrnOverBank44ADA`)) + n0(g(ctx, `${PL}.PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA`))
    + n0(g(ctx, `${PL}.PersumptiveInc44ADA.GrsTrnOverAnyOthMode44ADA`))))
    err(ctx, 'A-136', `${PL}.PersumptiveInc44ADA.GrsReceipt`, 'Gross receipts u/s 44ADA must equal the sum of its bank, cash and other-mode break-up.');

  // A-99 44AD total = 6% component + 8% component.
  if (inc44AD > 0 && neq(g(ctx, `${PL}.PersumptiveInc44AD.TotPersumptiveInc44AD`),
    n0(g(ctx, `${PL}.PersumptiveInc44AD.PersumptiveInc44AD6Per`)) + n0(g(ctx, `${PL}.PersumptiveInc44AD.PersumptiveInc44AD8Per`))))
    err(ctx, 'A-99', `${PL}.PersumptiveInc44AD.TotPersumptiveInc44AD`, 'Presumptive income u/s 44AD must equal the sum of the 6% and 8% components.');
  // A-100 / A-101 minimum presumptive percentages.
  if (gr44ADbank > 0 && n0(g(ctx, `${PL}.PersumptiveInc44AD.PersumptiveInc44AD6Per`)) < Math.floor(gr44ADbank * 0.06) - 1)
    err(ctx, 'A-100', `${PL}.PersumptiveInc44AD.PersumptiveInc44AD6Per`, 'Presumptive income at 61(ii)(A) cannot be less than 6% of the turnover received through banking channels.');
  if ((gr44ADcash + gr44ADoth) > 0 && n0(g(ctx, `${PL}.PersumptiveInc44AD.PersumptiveInc44AD8Per`)) < Math.floor((gr44ADcash + gr44ADoth) * 0.08) - 1)
    err(ctx, 'A-101', `${PL}.PersumptiveInc44AD.PersumptiveInc44AD8Per`, 'Presumptive income at 61(ii)(B) cannot be less than 8% of the cash / other-mode turnover.');
  // A-102 / A-103 income cannot exceed turnover.
  if (gr44AD > 0 && inc44AD > gr44AD)
    err(ctx, 'A-103', `${PL}.PersumptiveInc44AD.TotPersumptiveInc44AD`, 'Income disclosed u/s 44AD cannot be more than the gross turnover / receipts.');
  // A-104 / A-111 44ADA at least 50%, not more than gross receipts.
  if (gr44ADA > 0 && inc44ADA < Math.floor(gr44ADA * 0.5) - 1)
    err(ctx, 'A-104', `${PL}.PersumptiveInc44ADA.TotPersumptiveInc44ADA`, 'Presumptive income u/s 44ADA cannot be less than 50% of the gross receipts.');
  if (gr44ADA > 0 && inc44ADA > gr44ADA)
    err(ctx, 'A-111', `${PL}.PersumptiveInc44ADA.TotPersumptiveInc44ADA`, 'Income disclosed u/s 44ADA cannot be more than the gross receipts.');
  // A-120 / A-130 eligibility.
  if (isNR && (inc44AD > 0 || gr44AD > 0))
    err(ctx, 'A-120', `${PL}.PersumptiveInc44AD`, 'Presumptive business income u/s 44AD cannot be disclosed by a Non-Resident.');
  if (isHUF && (inc44ADA > 0 || gr44ADA > 0))
    err(ctx, 'A-130', `${PL}.PersumptiveInc44ADA`, 'A HUF is not eligible to disclose presumptive income u/s 44ADA.');

  // A-115 … A-118, A-132 goods-carriage table u/s 44AE.
  const carriages = asArr(g(ctx, `${PL}.GoodsDtlsUs44AE`));
  if (inc44AE > 0 && carriages.length === 0)
    err(ctx, 'A-115', `${PL}.GoodsDtlsUs44AE`, 'Total presumptive income from goods carriage u/s 44AE is greater than zero — table 63(i) must be filled.');
  let months = 0; let sumPI = 0; const regs: string[] = [];
  carriages.forEach((row, i) => {
    const hp = n0(at(row, 'HoldingPeriod'));
    const pi = n0(at(row, 'PresumptiveIncome'));
    const tc = n0(at(row, 'TonnageCapacity'));
    months += hp; sumPI += pi;
    const reg = str(at(row, 'RegNumberGoodsCarriage')).toUpperCase();
    if (reg !== '' && regs.indexOf(reg) >= 0)
      err(ctx, 'A-132', `${PL}.GoodsDtlsUs44AE[${i}].RegNumberGoodsCarriage`, 'Registration number of the goods carriage must not be repeated in section 44AE.');
    if (reg !== '') regs.push(reg);
    if (tc > 0 && tc <= 12 && pi < hp * 7500)
      err(ctx, 'A-118', `${PL}.GoodsDtlsUs44AE[${i}].PresumptiveIncome`, 'For a goods carriage up to 12 MT the presumptive income cannot be less than ₹7,500 × number of months.');
  });
  if (months > 120)
    err(ctx, 'A-117', `${PL}.TotalNumOfMonths`, 'Total of column 4 (months owned/leased/hired) in table 63(i) cannot exceed 120.');
  if (carriages.length > 0 && neq(g(ctx, `${PL}.TotalPrsumptvIncUs44EGoods`), sumPI))
    err(ctx, 'A-116', `${PL}.TotalPrsumptvIncUs44EGoods`, 'Total presumptive income u/s 44AE must equal the sum of column 5 of table 63(i).');

  // A-134 / A-135 / A-137 / A-138 tax-audit thresholds.
  if (gr44ADA > 7500000 && lia44AB !== 'Y')
    err(ctx, 'A-137', `${AI}.LiableSec44ABflg`, 'Gross receipts u/s 44ADA exceed ₹75,00,000 — a tax audit u/s 44AB is mandatory.');
  if (gr44ADA > 5000000 && (gr44ADcash + n0(g(ctx, `${PL}.PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA`))) > gr44ADA * 0.05 && lia44AB !== 'Y')
    err(ctx, 'A-134', `${AI}.LiableSec44ABflg`, 'Gross receipts u/s 44ADA exceed ₹50,00,000 with cash receipts above 5% — a tax audit u/s 44AB is mandatory.');
  if (gr44AD > 30000000 && lia44AB !== 'Y')
    err(ctx, 'A-138', `${AI}.LiableSec44ABflg`, 'Gross receipts u/s 44AD exceed ₹3 crore — a tax audit u/s 44AB is mandatory.');
  if (gr44AD > 20000000 && (gr44ADcash + gr44ADoth) > gr44AD * 0.05 && lia44AB !== 'Y')
    err(ctx, 'A-135', `${AI}.LiableSec44ABflg`, 'Gross receipts u/s 44AD exceed ₹2 crore with cash receipts above 5% — a tax audit u/s 44AB is mandatory.');

  // A-129 / A-133 speculative activity block.
  const specTO = n0(g(ctx, `${PL}.TurnverFrmSpecActivity`));
  const specGP = n0(g(ctx, `${PL}.GrossProfit`));
  const specEXP = n0(g(ctx, `${PL}.Expenditure`));
  if (specTO > 0 && specGP > specTO)
    err(ctx, 'A-133', `${PL}.GrossProfit`, 'Gross profit from speculative activity (65ii) cannot be more than the turnover (65i).');
  if ((specTO > 0 || specGP !== 0) && neq(g(ctx, `${PL}.NetIncomeFrmSpecActivity`), specGP - specEXP))
    err(ctx, 'A-129', `${PL}.NetIncomeFrmSpecActivity`, 'Net income from speculative activity (65iv) must equal gross profit (65ii) minus expenses (65iii).');

  // A-84 … A-93 selected P&L totals.
  const ec = `${PL}.DebitsToPL.EmployeeComp`;
  if (filled(g(ctx, ec)) && neq(g(ctx, `${ec}.TotEmployeeComp`),
    n0(g(ctx, `${ec}.SalsWages`)) + n0(g(ctx, `${ec}.Bonus`)) + n0(g(ctx, `${ec}.MedExpReimb`))
    + n0(g(ctx, `${ec}.LeaveEncash`)) + n0(g(ctx, `${ec}.LeaveTravelBenft`)) + n0(g(ctx, `${ec}.ContToSuperAnnFund`))
    + n0(g(ctx, `${ec}.ContToPF`)) + n0(g(ctx, `${ec}.ContToGratFund`)) + n0(g(ctx, `${ec}.ContToOthFund`))
    + n0(g(ctx, `${ec}.OthEmpBenftExpdr`))))
    err(ctx, 'A-84', `${ec}.TotEmployeeComp`, 'Compensation to employees (22xi) must equal the sum of 22i to 22x.');
  const ins = `${PL}.DebitsToPL.Insurances`;
  if (filled(g(ctx, ins)) && neq(g(ctx, `${ins}.TotInsurances`),
    n0(g(ctx, `${ins}.MedInsur`)) + n0(g(ctx, `${ins}.LifeInsur`)) + n0(g(ctx, `${ins}.KeyManInsur`)) + n0(g(ctx, `${ins}.OthInsur`))))
    err(ctx, 'A-85', `${ins}.TotInsurances`, 'Total expenditure on insurance (23v) must equal the sum of medical, life, keyman and other insurance.');
  const tri: Array<[string, string, string]> = [
    ['CommissionExpdrDtls', 'Total', 'A-86'],
    ['RoyalityDtls', 'Total', 'A-87'],
    ['ProfessionalConstDtls', 'Total', 'A-88'],
    ['InterestExpdrtDtls', 'InterestExpdr', 'A-93'],
  ];
  for (const [blk, tot, rule] of tri) {
    const b = `${PL}.DebitsToPL.${blk}`;
    if (!filled(g(ctx, b))) continue;
    if (neq(g(ctx, `${b}.${tot}`), n0(g(ctx, `${b}.NonResOtherCompany`)) + n0(g(ctx, `${b}.Others`))))
      err(ctx, rule, `${b}.${tot}`, 'The total must equal the sum of the non-resident and "to others" components.');
  }
  // A-91 / A-139 / A-140 bad-debt totals and PAN requirements.
  const bd = `${PL}.DebitsToPL.BadDebtDtls`;
  if (filled(g(ctx, bd))) {
    const rows = asArr(g(ctx, `${bd}.BadDebtAmtDtls`));
    let s1 = 0;
    rows.forEach((r, i) => {
      s1 += n0(at(r, 'Amount'));
      if (n0(at(r, 'Amount')) > 0 && !filled(at(r, 'PAN')))
        err(ctx, 'A-131', `${bd}.BadDebtAmtDtls[${i}].PAN`, 'PAN (or Aadhaar) of the debtor must be provided where bad debts are claimed at Sl. 47(i).');
    });
    if (rows.length > 0 && neq(g(ctx, `${bd}.BadDebtAmtDtlsTotal`), s1))
      err(ctx, 'A-139', `${bd}.BadDebtAmtDtlsTotal`, 'Total of Sl. 47(i) must equal the sum of the individual bad-debt amounts.');
    const rows2 = asArr(g(ctx, `${bd}.OthersPANNotAvlblDtl`));
    let s2 = 0;
    rows2.forEach((r, i) => {
      const amt = n0(at(r, 'Amount'));
      s2 += amt;
      if (amt > 100000 && (!filled(at(r, 'Name')) || !filled(at(r, 'TownCityDistrict'))))
        err(ctx, 'A-147', `${bd}.OthersPANNotAvlblDtl[${i}]`, 'Name and address of the debtor must be provided where PAN/Aadhaar is unavailable and the amount exceeds ₹1 lakh.');
    });
    if (rows2.length > 0 && neq(g(ctx, `${bd}.OthersPANNotAvlblDtlTotal`), s2))
      err(ctx, 'A-140', `${bd}.OthersPANNotAvlblDtlTotal`, 'Total of Sl. 47(ii) must equal the sum of the individual line items.');
    if (neq(g(ctx, `${bd}.BadDebt`), n0(g(ctx, `${bd}.BadDebtAmtDtlsTotal`)) + n0(g(ctx, `${bd}.OthersPANNotAvlblDtlTotal`)) + n0(g(ctx, `${bd}.OthersAmtLt1Lakh`))))
      err(ctx, 'A-91', `${bd}.BadDebt`, 'Total bad debt (Sl. 47) must equal the sum of its individual components.');
  }

  /* ── Schedule OI ──────────────────────────────────────────────────────── */

  const OI = 'PARTA_OI';
  if (filled(g(ctx, OI))) {
    // A-152
    const nc = `${OI}.NoCredToPLAmt`;
    if (filled(g(ctx, nc)) && neq(g(ctx, `${nc}.TotNoCredToPLAmt`),
      n0(g(ctx, `${nc}.Section28Items`)) + n0(g(ctx, `${nc}.ProformaCreditsDue`)) + n0(g(ctx, `${nc}.PrevYrEscalClaim`))
      + n0(g(ctx, `${nc}.OthItemInc`)) + n0(g(ctx, `${nc}.CapReceipt`))))
      err(ctx, 'A-152', `${nc}.TotNoCredToPLAmt`, 'Sl. 5f (total of amounts not credited to the profit and loss account) must equal the sum of 5a to 5e.');
    // A-885 Schedule TPSA required when option u/s 92CE(2A) is exercised.
    if (str(g(ctx, `${OI}.ScheduleTPSAFlg`)) === 'Y' && !filled(g(ctx, 'ScheduleTPSA')))
      err(ctx, 'A-885', 'ScheduleTPSA', 'Option u/s 92CE(2A) is "Yes" — Schedule TPSA must be filled.');
  }
  // A-886 TPSA deposit date cannot be in the future.
  asArr(g(ctx, 'ScheduleTPSA.DtlsTaxesPaid')).forEach((r, i) => {
    const d = dnum(at(r, 'DateDep'));
    if (d && d > today)
      err(ctx, 'A-886', `ScheduleTPSA.DtlsTaxesPaid[${i}]`, 'The date on which tax is deposited cannot be after the current system date.');
  });
  // A-879 … A-882 TPSA arithmetic.
  if (filled(g(ctx, 'ScheduleTPSA'))) {
    const pa = n0(g(ctx, 'ScheduleTPSA.AmtPrimaryAdjUs92CE_2A'));
    const addl = n0(g(ctx, 'ScheduleTPSA.AdditionalIncTax18PercAbove'));
    const sur = n0(g(ctx, 'ScheduleTPSA.Surcharge12Perc'));
    const cess = n0(g(ctx, 'ScheduleTPSA.HealthEducationCess'));
    if (pa > 0 && neq(g(ctx, 'ScheduleTPSA.AdditionalIncTax18PercAbove'), Math.round(pa * 0.18), 2))
      err(ctx, 'A-879', 'ScheduleTPSA.AdditionalIncTax18PercAbove', 'Additional income tax in Schedule TPSA must be 18% of the amount of primary adjustment.');
    if (addl > 0 && neq(g(ctx, 'ScheduleTPSA.Surcharge12Perc'), Math.round(addl * 0.12), 2))
      err(ctx, 'A-880', 'ScheduleTPSA.Surcharge12Perc', 'Surcharge in Schedule TPSA must be 12% of the additional income tax payable.');
    if ((addl + sur) > 0 && neq(g(ctx, 'ScheduleTPSA.HealthEducationCess'), Math.round((addl + sur) * 0.04), 2))
      err(ctx, 'A-881', 'ScheduleTPSA.HealthEducationCess', 'Health & education cess in Schedule TPSA must be 4% of (additional tax + surcharge).');
    if (neq(g(ctx, 'ScheduleTPSA.TotalAdditionalTax'), addl + sur + cess))
      err(ctx, 'A-882', 'ScheduleTPSA.TotalAdditionalTax', 'Total additional tax payable must equal additional income tax + surcharge + cess.');
  }

  /* ── Schedule S – Salary ──────────────────────────────────────────────── */

  const salaries = asArr(g(ctx, 'ScheduleS.Salaries'));
  // A-199 / A-1014 Schedule Salary is not applicable to a HUF.
  if (isHUF && (salaries.length > 0 || n0(g(ctx, 'ScheduleS.TotalGrossSalary')) > 0))
    err(ctx, 'A-1014', 'ScheduleS', 'Schedule Salary is not applicable when the status is HUF.');
  // A-1013 Schedule TDS1 is not applicable to a HUF.
  if (isHUF && asArr(g(ctx, 'ScheduleTDS1.TDSonSalary')).length > 0)
    err(ctx, 'A-1013', 'ScheduleTDS1', 'Schedule TDS-1 (TDS on salary) is not applicable when the status is HUF.');
  if (salaries.length > 0) {
    // A-161
    let gross = 0;
    salaries.forEach((s) => { gross += n0(at(s, 'Salarys.GrossSalary')); });
    if (neq(g(ctx, 'ScheduleS.TotalGrossSalary'), gross))
      err(ctx, 'A-161', 'ScheduleS.TotalGrossSalary', 'Total gross salary (from all employers) must equal the sum of the gross salary of each employer.');
    // A-163
    if (neq(g(ctx, 'ScheduleS.NetSalary'),
      n0(g(ctx, 'ScheduleS.TotalGrossSalary')) - n0(g(ctx, 'ScheduleS.Increliefus89A')) - n0(g(ctx, 'ScheduleS.AllwncExtentExemptUs10'))))
      err(ctx, 'A-163', 'ScheduleS.NetSalary', 'Net salary must equal total gross salary minus relief u/s 89A minus allowances exempt u/s 10.');
    // A-164
    if (neq(g(ctx, 'ScheduleS.DeductionUS16'),
      n0(g(ctx, 'ScheduleS.DeductionUnderSection16ia')) + n0(g(ctx, 'ScheduleS.EntertainmntalwncUs16ii')) + n0(g(ctx, 'ScheduleS.ProfessionalTaxUs16iii'))))
      err(ctx, 'A-164', 'ScheduleS.DeductionUS16', 'Deductions u/s 16 must equal the sum of 16(ia) + 16(ii) + 16(iii).');
    // A-165
    if (neq(g(ctx, 'ScheduleS.TotIncUnderHeadSalaries'), n0(g(ctx, 'ScheduleS.NetSalary')) - n0(g(ctx, 'ScheduleS.DeductionUS16'))))
      err(ctx, 'A-165', 'ScheduleS.TotIncUnderHeadSalaries', 'Income chargeable under Salaries must equal net salary minus deductions u/s 16.');
    // A-174 professional tax capped at ₹5,000.
    if (n0(g(ctx, 'ScheduleS.ProfessionalTaxUs16iii')) > 5000)
      err(ctx, 'A-174', 'ScheduleS.ProfessionalTaxUs16iii', 'Professional tax u/s 16(iii) is allowed only to the extent of ₹5,000.');
    // A-194 / A-195 new regime disallows 16(ii) and 16(iii).
    if (newRegime && n0(g(ctx, 'ScheduleS.EntertainmntalwncUs16ii')) > 0)
      err(ctx, 'A-194', 'ScheduleS.EntertainmntalwncUs16ii', 'Entertainment allowance u/s 16(ii) cannot be claimed under the new tax regime.');
    if (newRegime && n0(g(ctx, 'ScheduleS.ProfessionalTaxUs16iii')) > 0)
      err(ctx, 'A-195', 'ScheduleS.ProfessionalTaxUs16iii', 'Professional tax u/s 16(iii) cannot be claimed under the new tax regime.');
  }
  // A-207 Table 10(13A) must be filled when the HRA exemption is claimed.
  const hraRows = asArr(g(ctx, 'ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls'))
    .filter((r) => str(at(r, 'SalNatureDesc')).indexOf('13A') >= 0);
  if (hraRows.length > 0 && !filled(g(ctx, 'ScheduleS.Section10_13A')))
    err(ctx, 'A-207', 'ScheduleS.Section10_13A', 'Table 10(13A) of Schedule Salary must be filled to claim the exempt allowance u/s 10(13A).');
  // A-206 lowest-of-three HRA cap.
  if (filled(g(ctx, 'ScheduleS.Section10_13A'))) {
    const t = 'ScheduleS.Section10_13A';
    const cap = Math.max(0, Math.min(n0(g(ctx, `${t}.ActlHRARecv`)), n0(g(ctx, `${t}.ActlRentPaid10Per`)), n0(g(ctx, `${t}.Sal40Or50Per`))));
    if (cap > 0 && n0(g(ctx, `${t}.EligbleExmpAllwncUs13A`)) > cap + 1)
      err(ctx, 'A-206', `${t}.EligbleExmpAllwncUs13A`, 'HRA exemption must be the lowest of actual HRA received, rent paid less 10% of salary, and 40%/50% of salary.');
  }

  /* ── Schedule HP ──────────────────────────────────────────────────────── */

  const props = asArr(g(ctx, 'ScheduleHP.PropertyDetails'));
  let selfOccupied = 0;
  props.forEach((pr, i) => {
    const base = `ScheduleHP.PropertyDetails[${i}]`;
    const letOut = str(at(pr, 'ifLetOut'));
    if (letOut === 'S') selfOccupied += 1;
    const share = num(at(pr, 'AsseseeShareProperty'));
    const coOwned = str(at(pr, 'PropCoOwnedFlg'));
    const alv = n0(at(pr, 'Rentdetails.AnnualLetableValue'));
    const localTax = n0(at(pr, 'Rentdetails.LocalTaxes'));
    const intCap = n0(at(pr, 'Rentdetails.IntOnBorwCap'));
    // A-211 / A-234 / A-235 ownership shares.
    if (coOwned === 'YES') {
      let coShare = 0;
      asArr(at(pr, 'CoOwners')).forEach((c) => { coShare += n0(at(c, 'PercentShareProperty')); });
      if (share !== undefined && Math.abs(share + coShare - 100) > 0.5)
        err(ctx, 'A-211', `${base}.AsseseeShareProperty`, "The assessee's share and the co-owners' shares in a co-owned property must total 100%.");
      if (coShare >= 100)
        err(ctx, 'A-234', `${base}.CoOwners`, 'The sum of the percentage shares of the other co-owners must be less than 100%.');
      // A-225 co-owner PAN cannot equal the assessee PAN.
      const ownPan = str(g(ctx, `${PI}.PAN`)).toUpperCase();
      asArr(at(pr, 'CoOwners')).forEach((c, j) => {
        if (ownPan !== '' && str(at(c, 'PAN_CoOwner')).toUpperCase() === ownPan)
          err(ctx, 'A-225', `${base}.CoOwners[${j}].PAN_CoOwner`, "A co-owner's PAN cannot be the same as the assessee's PAN.");
      });
      // A-213 no interest claim when the assessee's share is zero.
      if (share === 0 && intCap > 0)
        err(ctx, 'A-213', `${base}.Rentdetails.IntOnBorwCap`, "Interest on borrowed capital cannot be claimed when the assessee's share in the co-owned property is zero.");
    } else if (coOwned === 'NO' && share !== undefined && Math.abs(share - 100) > 0.5) {
      err(ctx, 'A-235', `${base}.AsseseeShareProperty`, "For a property that is not co-owned the assessee's share must be 100%.");
    }
    // A-217 let-out / deemed let-out must show gross rent.
    if ((letOut === 'L' || letOut === 'D') && alv <= 0)
      err(ctx, 'A-217', `${base}.Rentdetails.AnnualLetableValue`, 'For a let-out or deemed let-out property the gross rent received/receivable/lettable value must be more than zero.');
    // A-214 municipal tax cannot be claimed when gross rent is nil.
    if (alv <= 0 && localTax > 0)
      err(ctx, 'A-214', `${base}.Rentdetails.LocalTaxes`, 'Municipal tax cannot be claimed when the gross rent received/receivable/lettable value is zero.');
    // A-219 / A-218 / A-210 / A-220 / A-221 arithmetic.
    if (neq(at(pr, 'Rentdetails.TotalUnrealizedAndTax'), n0(at(pr, 'Rentdetails.RentNotRealized')) + localTax))
      err(ctx, 'A-219', `${base}.Rentdetails.TotalUnrealizedAndTax`, 'Sl. 1d (total) must equal 1b + 1c.');
    if (neq(at(pr, 'Rentdetails.BalanceALV'), alv - n0(at(pr, 'Rentdetails.TotalUnrealizedAndTax'))))
      err(ctx, 'A-218', `${base}.Rentdetails.BalanceALV`, 'Sl. 1e (annual value) must equal 1a − 1d.');
    const annOwned = n0(at(pr, 'Rentdetails.AnnualOfPropOwned'));
    if (annOwned > 0 && neq(at(pr, 'Rentdetails.ThirtyPercentOfBalance'), Math.round(annOwned * 0.3), 2))
      err(ctx, 'A-210', `${base}.Rentdetails.ThirtyPercentOfBalance`, 'The standard deduction on house property must be 30% of the annual value.');
    if (neq(at(pr, 'Rentdetails.TotalDeduct'), n0(at(pr, 'Rentdetails.ThirtyPercentOfBalance')) + intCap))
      err(ctx, 'A-220', `${base}.Rentdetails.TotalDeduct`, 'Sl. 1i (total deductions) must equal 1g + 1h.');
    if (neq(at(pr, 'Rentdetails.IncomeOfHP'), annOwned - n0(at(pr, 'Rentdetails.TotalDeduct')) + n0(at(pr, 'Rentdetails.ArrearsUnrealizedRentRcvd'))))
      err(ctx, 'A-221', `${base}.Rentdetails.IncomeOfHP`, 'Income from house property (1k) must equal 1f − 1i + 1j.');
    // A-215 / A-224 / A-232 self-occupied interest cap and new-regime bar.
    if (letOut === 'S' && intCap > 200000)
      err(ctx, 'A-215', `${base}.Rentdetails.IntOnBorwCap`, 'For a self-occupied property, interest on borrowed capital cannot exceed ₹2,00,000.');
    if (letOut === 'S' && newRegime && intCap > 0)
      err(ctx, 'A-224', `${base}.Rentdetails.IntOnBorwCap`, 'Interest on borrowed capital for a self-occupied property cannot be claimed under the new tax regime.');
    // A-230 / A-231 / A-233 Table 24(b).
    const s24 = at(pr, 'Rentdetails.Section24B');
    if (intCap > 0) {
      if (!filled(s24) || asArr(at(s24, 'Section24BDtls')).length === 0)
        err(ctx, 'A-233', `${base}.Rentdetails.Section24B`, 'Details of the loan in Table 24(b) are mandatory to claim interest on borrowed capital u/s 24(b).');
      else if (neq(at(s24, 'TotalInterestUs24B'), intCap))
        err(ctx, 'A-230', `${base}.Rentdetails.Section24B.TotalInterestUs24B`, 'Interest payable on borrowed capital must equal the total interest u/s 24(b) in Table 24(b).');
    }
    if (filled(s24)) {
      let si = 0;
      asArr(at(s24, 'Section24BDtls')).forEach((r) => { si += n0(at(r, 'InterestUs24B')); });
      if (si > 0 && neq(at(s24, 'TotalInterestUs24B'), si))
        err(ctx, 'A-231', `${base}.Rentdetails.Section24B.TotalInterestUs24B`, 'The sum of the individual rows of Table 24(b) must match the total interest on borrowed capital u/s 24(b).');
    }
    // A-236 unrealised rent cannot exceed gross rent.
    if (n0(at(pr, 'Rentdetails.RentNotRealized')) > alv && alv > 0)
      err(ctx, 'A-236', `${base}.Rentdetails.RentNotRealized`, 'The amount of rent which cannot be realised must not exceed the gross rent received/receivable.');
  });
  // A-223 not more than two self-occupied properties.
  if (selfOccupied > 2)
    err(ctx, 'A-223', 'ScheduleHP.PropertyDetails', 'Not more than two house properties can be claimed as self-occupied.');
  // A-216 total income chargeable under HP.
  if (props.length > 0) {
    let hpSum = 0;
    props.forEach((pr) => { hpSum += n0(at(pr, 'Rentdetails.IncomeOfHP')); });
    if (neq(g(ctx, 'ScheduleHP.TotalIncomeChargeableUnHP'), hpSum + n0(g(ctx, 'ScheduleHP.PassThroghIncome'))))
      err(ctx, 'A-216', 'ScheduleHP.TotalIncomeChargeableUnHP', 'Sl. 3 of Schedule HP must equal the sum of 1k for all properties plus pass-through income (2).');
  }

  /* ── Schedule BP ──────────────────────────────────────────────────────── */

  const dp = `${BP}.BusinessIncOthThanSpec.DeemedProfitBusUs`;
  const bp44AD = n0(g(ctx, `${dp}.Section44AD`));
  const bp44ADA = n0(g(ctx, `${dp}.Section44ADA`));
  const bp44AE = n0(g(ctx, `${dp}.Section44AE`));
  // A-112 / A-113 / A-114 / A-293
  if (neq(g(ctx, `${dp}.Section44AD`), inc44AD))
    err(ctx, 'A-112', `${dp}.Section44AD`, 'Schedule BP Sl. 35(i) must equal the presumptive income u/s 44AD declared in Schedule P&L.');
  if (neq(g(ctx, `${dp}.Section44ADA`), inc44ADA))
    err(ctx, 'A-113', `${dp}.Section44ADA`, 'Schedule BP Sl. 35(ii) must equal the presumptive income u/s 44ADA declared in Schedule P&L.');
  if (neq(g(ctx, `${dp}.Section44AE`), n0(g(ctx, `${PL}.TotalPrsumptvIncUs44E`)) || inc44AE))
    err(ctx, 'A-114', `${dp}.Section44AE`, 'Schedule BP Sl. 35(iii) must equal the total presumptive income from goods carriage u/s 44AE in Schedule P&L.');
  // A-263 sum of 35(i)…35(vii).
  const dpSum = bp44AD + bp44ADA + bp44AE + n0(g(ctx, `${dp}.Section44B`)) + n0(g(ctx, `${dp}.Section44BB`))
    + n0(g(ctx, `${dp}.Section44BBA`)) + n0(g(ctx, `${dp}.Section44BBC`)) + n0(g(ctx, `${dp}.Section44BBD`))
    + n0(g(ctx, `${dp}.Section44DA`));
  if (filled(g(ctx, dp)) && neq(g(ctx, `${dp}.TotDeemedProfitBusUs`), dpSum))
    err(ctx, 'A-263', `${dp}.TotDeemedProfitBusUs`, 'Schedule BP Sl. 35(viii) must equal the sum of the individual amounts at 35(i) to 35(vii).');
  // A-283 presumptive income requires a balance sheet (regular or no-accounts).
  if ((bp44AD + bp44ADA + bp44AE) > 0 && !bsRegular && !bsNoAcct)
    err(ctx, 'A-283', `${BS}`, 'Presumptive income is declared at Sl. 35(i)/(ii)/(iii) of Schedule BP — balance-sheet particulars for regular books or for the "no accounts case" are mandatory.');
  // A-284 presumptive income u/s 44AD cannot exceed the disclosed receipts.
  const totReceipts = n0(g(ctx, 'TradingAccount.TotRevenueFrmOperations')) + gr44AD + gr44ADA
    + n0(g(ctx, `${PL}.NoBooksOfAccPL.GrossReceipt`)) + n0(g(ctx, `${PL}.NoBooksOfAccPL.GrossReceiptPrf`));
  if (bp44AD > 0 && totReceipts > 0 && bp44AD > totReceipts + 1)
    err(ctx, 'A-284', `${dp}.Section44AD`, 'The amount at Sl. 35(i) of Schedule BP cannot exceed the total turnover / gross receipts disclosed in the Trading account and Schedule P&L.');
  // A-269 income chargeable under the head PGBP.
  const bpA37 = n0(g(ctx, `${BP}.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C`));
  const bpB42 = n0(g(ctx, `${BP}.SpecBusinessInc.AdjustedPLFrmSpecuBus`));
  const bpC48 = n0(g(ctx, `${BP}.SpecifiedBusinessInc.PLFrmSpecifiedBus`));
  if (filled(g(ctx, BP)) && neq(g(ctx, `${BP}.IncChrgUnHdProftGain`), bpA37 + bpB42 + bpC48))
    warn(ctx, 'A-269', `${BP}.IncChrgUnHdProftGain`, 'Income chargeable under "Profits and gains from business or profession" should equal A37 + B42 + C48.');
  // A-287 no 35AD deduction under the new regime.
  if (newRegime) {
    let ded35AD = 0;
    asArr(g(ctx, `${BP}.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls`)).forEach((r) => { ded35AD += n0(at(r, 'DedUs35ADSubSec5')); });
    if (ded35AD > 0)
      err(ctx, 'A-287', `${BP}.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls`, 'Deduction u/s 35AD cannot be claimed under the new tax regime.');
  }
  // A-301 dividend income reduced at Sl. 5c cannot be positive.
  if (n0(g(ctx, `${BP}.BusinessIncOthThanSpec.IncCredPL.OtherExmptIncDtl.OperatingDividendAmt`)) < 0)
    warn(ctx, 'A-301', `${BP}.BusinessIncOthThanSpec.IncCredPL`, 'The dividend income at Sl. 5c of Schedule BP cannot be more than zero.');
  // A-303 ITR-3 requires business income (with the documented exceptions).
  const bpIncome = n0(g(ctx, `${BP}.IncChrgUnHdProftGain`));
  if (bpIncome === 0 && str(g(ctx, `${FS}.IncFrmBusOrProf`)) !== 'Y') {
    const exception = asArr(g(ctx, 'ScheduleIF.PartnerFirmDetails')).length > 0
      || str(g(ctx, `${AI}.LiableSec92Eflg`)) === 'Y'
      || str(g(ctx, 'Schedule5A2014.BooksSpouse92EFlg')) === 'Y'
      || filled(g(ctx, 'ScheduleCFL.TotalLossCFSummary'))
      || filled(g(ctx, 'ITR3ScheduleUD.ScheduleUD'));
    if (!exception)
      warn(ctx, 'A-303', `${BP}.IncChrgUnHdProftGain`, 'ITR-3 should not be filed where there is no business income, unless one of the documented exceptions (partner in a firm, 92E audit, brought-forward business loss or unabsorbed depreciation) applies.');
  }
  // A-279 nature of the specified business is required when specified-business income/loss is entered.
  if ((n0(g(ctx, `${BP}.SpecifiedBusinessInc.NetPLFrmSpecifiedBus`)) !== 0 || bpC48 !== 0)
    && asArr(g(ctx, `${BP}.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls`)).length === 0)
    warn(ctx, 'A-279', `${BP}.SpecifiedBusinessInc`, 'Where income/loss from a specified business is entered, the nature of the specified business should be mentioned.');

  /* ── Schedule CYLA / BFLA / CFL ───────────────────────────────────────── */

  const cy = 'ScheduleCYLA';
  if (filled(g(ctx, cy))) {
    // A-552 HP income in CYLA must match Schedule HP.
    if (filled(g(ctx, 'ScheduleHP')) && neq(g(ctx, `${cy}.HP.IncCYLA.IncOfCurYrUnderThatHead`), n0(g(ctx, 'ScheduleHP.TotalIncomeChargeableUnHP'))))
      err(ctx, 'A-552', `${cy}.HP.IncCYLA.IncOfCurYrUnderThatHead`, 'House-property income in Schedule CYLA must equal Sl. 3 of Schedule HP.');
    // A-571 Salary income in CYLA must match Schedule S.
    if (salaries.length > 0 && neq(g(ctx, `${cy}.Salary.IncCYLA.IncOfCurYrUnderThatHead`), n0(g(ctx, 'ScheduleS.TotIncUnderHeadSalaries'))))
      err(ctx, 'A-571', `${cy}.Salary.IncCYLA.IncOfCurYrUnderThatHead`, 'Salary income in Schedule CYLA must equal Sl. 6 of Schedule Salary.');
    // A-561 business income in CYLA must match Schedule BP A37.
    if (filled(g(ctx, BP)) && neq(g(ctx, `${cy}.BusProfExclSpecProf.IncCYLA.IncOfCurYrUnderThatHead`), bpA37))
      warn(ctx, 'A-561', `${cy}.BusProfExclSpecProf.IncCYLA.IncOfCurYrUnderThatHead`, 'Business income (excluding speculative and specified business) in Schedule CYLA should equal Sl. A37 of Schedule BP.');
    // A-551 house-property loss set off is capped at ₹2,00,000.
    if (n0(g(ctx, `${cy}.TotalLossSetOff.TotHPlossCurYrSetoff`)) > 200000)
      err(ctx, 'A-551', `${cy}.TotalLossSetOff.TotHPlossCurYrSetoff`, 'The house-property loss set off in Schedule CYLA cannot exceed ₹2,00,000.');
    // A-572 / A-579 new regime bars HP-loss set-off.
    if (newRegime && n0(g(ctx, `${cy}.TotalLossSetOff.TotHPlossCurYrSetoff`)) > 0)
      err(ctx, 'A-579', `${cy}.TotalLossSetOff.TotHPlossCurYrSetoff`, 'House-property losses cannot be adjusted against any income under the new tax regime.');
    // A-574 total loss set off cannot exceed the loss to be set off.
    const pairs: Array<[string, string, string]> = [
      ['TotHPlossCurYr', 'TotHPlossCurYrSetoff', 'BalHPlossCurYrAftSetoff'],
      ['TotBusLoss', 'TotBusLossSetoff', 'BalBusLossAftSetoff'],
      ['TotOthSrcLossNoRaceHorse', 'TotOthSrcLossNoRaceHorseSetoff', 'BalOthSrcLossNoRaceHorseAftSetoff'],
    ];
    for (const [tot, off, bal] of pairs) {
      const t = n0(g(ctx, `${cy}.TotalCurYr.${tot}`));
      const o = n0(g(ctx, `${cy}.TotalLossSetOff.${off}`));
      if (o > t + 1)
        err(ctx, 'A-574', `${cy}.TotalLossSetOff.${off}`, 'Total loss set off in Schedule CYLA cannot be more than the loss to be set off.');
      if (neq(g(ctx, `${cy}.LossRemAftSetOff.${bal}`), Math.max(0, t - o)))
        err(ctx, 'A-575', `${cy}.LossRemAftSetOff.${bal}`, 'Loss remaining after set-off must equal the loss to be adjusted minus the total loss set off (and cannot be negative).');
    }
  }
  // A-617 / A-618 / A-619 CFL must carry the CYLA balances.
  const cfl = 'ScheduleCFL.CurrentAYloss.LossSummaryDetail';
  if (filled(g(ctx, cfl)) && filled(g(ctx, cy))) {
    if (neq(g(ctx, `${cfl}.TotalHPPTILossCF`), n0(g(ctx, `${cy}.LossRemAftSetOff.BalHPlossCurYrAftSetoff`))))
      warn(ctx, 'A-617', `${cfl}.TotalHPPTILossCF`, 'House-property loss in Schedule CFL should equal the house-property loss remaining after set-off in Schedule CYLA.');
    if (neq(g(ctx, `${cfl}.BusLossOthThanSpecLossCF`), n0(g(ctx, `${cy}.LossRemAftSetOff.BalBusLossAftSetoff`))))
      warn(ctx, 'A-618', `${cfl}.BusLossOthThanSpecLossCF`, 'Business & profession loss in Schedule CFL should equal the business loss remaining after set-off in Schedule CYLA.');
  }
  // A-238 / A-239 current-year speculative / specified loss in CFL vs Schedule BP.
  if (filled(g(ctx, cfl))) {
    if (bpB42 < 0 && neq(g(ctx, `${cfl}.LossFrmSpecBusCF`), Math.abs(bpB42)))
      warn(ctx, 'A-238', `${cfl}.LossFrmSpecBusCF`, 'The current-year speculative loss in Schedule CFL should equal Sl. B42 of Schedule BP.');
    if (bpC48 < 0 && neq(g(ctx, `${cfl}.LossFrmSpecifiedBusCF`), Math.abs(bpC48)))
      warn(ctx, 'A-239', `${cfl}.LossFrmSpecifiedBusCF`, 'The current-year specified-business loss in Schedule CFL should equal Sl. C48 of Schedule BP.');
  }
  // A-620 / A-624 115BAC adjustment only under the new regime.
  if (oldRegime) {
    if (n0(g(ctx, 'ITR3ScheduleUD.TotAdjustAccTax115BACAmt')) > 0)
      err(ctx, 'A-624', 'ITR3ScheduleUD.TotAdjustAccTax115BACAmt', 'The amount adjusted on account of opting for taxation u/s 115BAC in Schedule UD should not be more than zero when the new tax regime is not selected.');
  }

  /* ── Chapter VI-A and its supporting schedules ────────────────────────── */

  const d80 = (k: string): number => n0(g(ctx, `${VIA}.${k}`));
  const u80 = (k: string): number => n0(g(ctx, `${UVIA}.${k}`));
  // A-792 new regime bars most Chapter VI-A deductions.
  if (newRegime) {
    const barred = ['Section80C', 'Section80CCC', 'Section80CCDEmployeeOrSE', 'Section80CCD1B', 'Section80D',
      'Section80DD', 'Section80DDB', 'Section80E', 'Section80EE', 'Section80EEA', 'Section80EEB', 'Section80G',
      'Section80GG', 'Section80GGA', 'Section80GGC', 'Section80IA', 'Section80IAB', 'Section80IB', 'Section80IBA',
      'Section80IC', 'Section80JJA', 'Section80QQB', 'Section80RRB', 'Section80TTA', 'Section80TTB', 'Section80U'];
    const claimed = barred.filter((k) => d80(k) > 0);
    if (claimed.length > 0)
      err(ctx, 'A-792', `${VIA}`, `Under the new tax regime the following Chapter VI-A deductions cannot be claimed: ${claimed.join(', ')}.`);
  }
  // A-789 / A-790 / A-791 / A-793 Chapter VI-A totals.
  if (filled(g(ctx, VIA))) {
    const partB = ['Section80C', 'Section80CCC', 'Section80CCDEmployeeOrSE', 'Section80CCD1B', 'Section80CCDEmployer',
      'Section80D', 'Section80DD', 'Section80DDB', 'Section80E', 'Section80EE', 'Section80EEA', 'Section80EEB',
      'Section80G', 'Section80GG', 'Section80GGA', 'Section80GGC'].reduce((s, k) => s + d80(k), 0);
    if (neq(g(ctx, `${VIA}.TotPartBchapterVIA`), partB, 2))
      err(ctx, 'A-790', `${VIA}.TotPartBchapterVIA`, 'Part B of Chapter VI-A must equal the sum of the individual deductions claimed.');
    const partC = ['Section80IA', 'Section80IAB', 'Section80IB', 'Section80IBA', 'Section80IC', 'Section80JJA',
      'Section80JJAA', 'Section80QQB', 'Section80RRB'].reduce((s, k) => s + d80(k), 0);
    if (neq(g(ctx, `${VIA}.TotPartCchapterVIA`), partC, 2))
      err(ctx, 'A-793', `${VIA}.TotPartCchapterVIA`, 'Part C of Chapter VI-A must equal the total of Sl. p to Sl. x.');
    const partCAD = ['Section80TTA', 'Section80TTB', 'Section80U', 'AnyOthSec80CCH'].reduce((s, k) => s + d80(k), 0);
    if (neq(g(ctx, `${VIA}.TotPartCAandDchapterVIA`), partCAD, 2))
      err(ctx, 'A-791', `${VIA}.TotPartCAandDchapterVIA`, 'Part CA and D of Chapter VI-A must equal the sum of the individual deductions claimed.');
    if (neq(g(ctx, `${VIA}.TotalChapVIADeductions`),
      n0(g(ctx, `${VIA}.TotPartBchapterVIA`)) + n0(g(ctx, `${VIA}.TotPartCchapterVIA`)) + n0(g(ctx, `${VIA}.TotPartCAandDchapterVIA`)), 2))
      err(ctx, 'A-789', `${VIA}.TotalChapVIADeductions`, 'Total Chapter VI-A deductions must equal the total of the individual deductions claimed.');
    // A-750 aggregate 80C + 80CCC + 80CCD(1) cap.
    if (d80('Section80C') + d80('Section80CCC') + d80('Section80CCDEmployeeOrSE') > 150001)
      err(ctx, 'A-750', `${VIA}.Section80C`, 'The aggregate of deductions u/s 80C, 80CCC and 80CCD(1) cannot exceed ₹1,50,000.');
    // A-767 80CCD(1B) cap.
    if (d80('Section80CCD1B') > 50000)
      err(ctx, 'A-767', `${VIA}.Section80CCD1B`, 'The maximum deduction allowable u/s 80CCD(1B) is ₹50,000.');
    // A-771 / A-772 80TTA / 80TTB caps.
    if (d80('Section80TTA') > 10000)
      err(ctx, 'A-771', `${VIA}.Section80TTA`, 'The maximum deduction allowable u/s 80TTA is ₹10,000.');
    if (d80('Section80TTB') > 50000)
      err(ctx, 'A-772', `${VIA}.Section80TTB`, 'The maximum deduction allowable u/s 80TTB is ₹50,000.');
    // A-770 80EE cap; A-774 80EEA cap; A-776 80EEB cap.
    if (d80('Section80EE') > 50000)
      err(ctx, 'A-770', `${VIA}.Section80EE`, 'Deduction u/s 80EE cannot exceed ₹50,000.');
    if (d80('Section80EEA') > 150000)
      err(ctx, 'A-774', `${VIA}.Section80EEA`, 'Deduction u/s 80EEA cannot exceed ₹1,50,000.');
    if (d80('Section80EEB') > 150000)
      err(ctx, 'A-776', `${VIA}.Section80EEB`, 'Deduction u/s 80EEB cannot exceed ₹1,50,000.');
    // A-775 / A-828 80EE and 80EEA are mutually exclusive.
    if (d80('Section80EE') > 0 && d80('Section80EEA') > 0)
      err(ctx, 'A-775', `${VIA}.Section80EEA`, 'Deduction u/s 80EEA cannot be claimed when a deduction u/s 80EE is claimed.');
    // HUF-ineligible deductions: A-730, A-752, A-753, A-755, A-757, A-758, A-766, A-778, A-779, A-785, A-787.
    if (isHUF) {
      const huf: Array<[string, string]> = [
        ['Section80CCDEmployeeOrSE', 'A-752'], ['Section80CCD1B', 'A-753'], ['Section80CCDEmployer', 'A-755'],
        ['Section80E', 'A-757'], ['Section80EE', 'A-758'], ['Section80U', 'A-766'],
        ['Section80EEA', 'A-778'], ['Section80EEB', 'A-779'], ['Section80QQB', 'A-785'], ['Section80RRB', 'A-787'],
      ];
      for (const [k, rule] of huf) {
        if (d80(k) > 0)
          err(ctx, rule, `${VIA}.${k}`, `Deduction u/s ${k.replace('Section', '').replace('EmployeeOrSE', 'CCD(1)').replace('Employer', 'CCD(2)')} cannot be claimed by a HUF.`);
      }
    }
    // A-763 / A-764 / A-780 / A-781 / A-782 / A-784 / A-786 residence-based limits.
    if (isNR) {
      const resOnly: Array<[string, string]> = [
        ['Section80DD', 'A-780'], ['Section80DDB', 'A-781'], ['Section80U', 'A-782'],
        ['Section80QQB', 'A-784'], ['Section80RRB', 'A-786'], ['Section80TTB', 'A-764'],
      ];
      for (const [k, rule] of resOnly) {
        if (d80(k) > 0)
          err(ctx, rule, `${VIA}.${k}`, `Deduction u/s ${k.replace('Section', '')} is allowed only to a Resident or a Resident but not Ordinarily Resident assessee.`);
      }
    }
    // A-798 PRAN required for 80CCD(1) / 80CCD(1B).
    if ((u80('Section80CCDEmployeeOrSE') > 0 || u80('Section80CCD1B') > 0)
      && asArr(g(ctx, `${UVIA}.PRANDtls`)).length === 0)
      err(ctx, 'A-798', `${UVIA}.PRANDtls`, 'PRAN must be provided in Schedule VI-A to claim a deduction u/s 80CCD(1) or 80CCD(1B).');
    // A-827 80CCC identifier rows.
    if (u80('Section80CCC') > 0 && asArr(g(ctx, `${UVIA}.PensionContribution80CCC`)).length === 0)
      err(ctx, 'A-827', `${UVIA}.PensionContribution80CCC`, 'Where a deduction u/s 80CCC is claimed, at least one row with type of identifier, identifier number and amount must be provided.');
    // A-799 Form 10BA for 80GG.
    if (u80('Section80GG') > 0)
      need(ctx, 'A-799', `${UVIA}.Form10BAAckNum`, 'Acknowledgement number of Form 10BA (deduction u/s 80GG)', SECTION_HINT.ScheduleVIA);
    // A-800 / A-756 specified disease for 80DDB.
    if (u80('Section80DDB') > 0) {
      need(ctx, 'A-800', `${UVIA}.NameOfSpecDisease80DDB`, 'Name of the specified disease (deduction u/s 80DDB)', SECTION_HINT.ScheduleVIA);
      need(ctx, 'A-756', `${UVIA}.Section80DDBUsrType`, 'Eligible category (self / dependant) for the deduction u/s 80DDB', SECTION_HINT.ScheduleVIA);
    }
    // A-801 / A-802 Form 10CCD / 10CCE acknowledgements.
    if (u80('Section80QQB') > 0)
      need(ctx, 'A-801', `${UVIA}.Form10CCDAckNum`, 'Acknowledgement number of Form 10CCD (deduction u/s 80QQB)', SECTION_HINT.ScheduleVIA);
    if (u80('Section80RRB') > 0)
      need(ctx, 'A-802', `${UVIA}.Form10CCEAckNum`, 'Acknowledgement number of Form 10CCE (deduction u/s 80RRB)', SECTION_HINT.ScheduleVIA);
  }

  // A-693 / A-694 / A-695 Schedule 80C.
  if (d80('Section80C') > 0 || u80('Section80C') > 0) {
    const rows80C = asArr(g(ctx, 'Schedule80C.Schedule80CDtls'));
    if (rows80C.length === 0)
      err(ctx, 'A-693', 'Schedule80C.Schedule80CDtls', 'Amount eligible for deduction u/s 80C together with the policy / document identification number must be provided in Schedule 80C.');
    let s80c = 0;
    rows80C.forEach((r) => { s80c += n0(at(r, 'Amount')); });
    if (rows80C.length > 0 && neq(g(ctx, 'Schedule80C.TotalAmt'), s80c))
      err(ctx, 'A-695', 'Schedule80C.TotalAmt', 'The sum of the individual rows of Schedule 80C must match the total deduction u/s 80C.');
    if (rows80C.length > 0 && neq(g(ctx, `${VIA}.Section80C`), Math.min(150000, n0(g(ctx, 'Schedule80C.TotalAmt'))), 2))
      warn(ctx, 'A-694', `${VIA}.Section80C`, 'The deduction u/s 80C claimed under Chapter VI-A should equal the total deduction u/s 80C in Schedule 80C (restricted to ₹1,50,000).');
  }
  // A-708 / A-709 Schedule 80D.
  if (d80('Section80D') > 0 && !filled(g(ctx, 'Schedule80D.Sec80DSelfFamSrCtznHealth')))
    err(ctx, 'A-708', 'Schedule80D', 'A deduction u/s 80D is claimed in Schedule VI-A — the details must be provided in Schedule 80D.');
  if (isHUF && (n0(g(ctx, 'Schedule80D.Sec80DSelfFamSrCtznHealth.Parents')) > 0 || n0(g(ctx, 'Schedule80D.Sec80DSelfFamSrCtznHealth.ParentsSeniorCitizen')) > 0))
    err(ctx, 'A-717', 'Schedule80D', 'A HUF is not eligible to claim the deduction at Sl. 2 of Schedule 80D (parents).');
  // A-670 / A-671 / A-673 / A-674 Schedule 80DD.
  if (d80('Section80DD') > 0) {
    if (!filled(g(ctx, 'Schedule80DD')))
      err(ctx, 'A-674', 'Schedule80DD', 'A deduction u/s 80DD is claimed — the details in Schedule 80DD are mandatory.');
    else {
      need(ctx, 'A-673', 'Schedule80DD.NatureOfDisability', 'Nature of disability (Schedule 80DD)', SECTION_HINT.Schedule80DD);
      need(ctx, 'A-673', 'Schedule80DD.TypeOfDisability', 'Type of disability (Schedule 80DD)', SECTION_HINT.Schedule80DD);
      need(ctx, 'A-673', 'Schedule80DD.DependentType', 'Type of dependant (Schedule 80DD)', SECTION_HINT.Schedule80DD);
      const t = str(g(ctx, 'Schedule80DD.TypeOfDisability'));
      const amt = n0(g(ctx, 'Schedule80DD.DeductionAmount'));
      if (t === '1' && amt !== 75000)
        err(ctx, 'A-670', 'Schedule80DD.DeductionAmount', 'The amount claimed for "dependant with disability" u/s 80DD must be exactly ₹75,000.');
      if (t === '2' && amt !== 125000)
        err(ctx, 'A-671', 'Schedule80DD.DeductionAmount', 'The amount claimed for "dependant with severe disability" u/s 80DD must be exactly ₹1,25,000.');
      if (neq(g(ctx, `${VIA}.Section80DD`), amt, 2))
        err(ctx, 'A-672', `${VIA}.Section80DD`, 'The deduction u/s 80DD in Schedule VI-A must match the amount in Schedule 80DD.');
    }
  }
  // A-676 / A-678 / A-680 / A-681 Schedule 80U.
  if (d80('Section80U') > 0) {
    if (!filled(g(ctx, 'Schedule80U')))
      err(ctx, 'A-681', 'Schedule80U', 'A deduction u/s 80U is claimed — the details in Schedule 80U are mandatory.');
    else {
      need(ctx, 'A-680', 'Schedule80U.NatureOfDisability', 'Nature of disability (Schedule 80U)', SECTION_HINT.Schedule80U);
      need(ctx, 'A-680', 'Schedule80U.TypeOfDisability', 'Type of disability (Schedule 80U)', SECTION_HINT.Schedule80U);
      const t = str(g(ctx, 'Schedule80U.TypeOfDisability'));
      const amt = n0(g(ctx, 'Schedule80U.DeductionAmount'));
      if (t === '1' && amt !== 75000)
        err(ctx, 'A-676', 'Schedule80U.DeductionAmount', 'The amount claimed for "self with disability" u/s 80U must be exactly ₹75,000.');
      if (t === '2' && amt !== 125000)
        err(ctx, 'A-678', 'Schedule80U.DeductionAmount', 'The amount claimed for "self with severe disability" u/s 80U must be exactly ₹1,25,000.');
      if (neq(g(ctx, `${VIA}.Section80U`), amt, 2))
        err(ctx, 'A-679', `${VIA}.Section80U`, 'The deduction u/s 80U in Schedule VI-A must match the amount in Schedule 80U.');
    }
  }
  // A-644 / A-648 / A-635..A-638 / A-643 / A-645 / A-760 Schedule 80G.
  const own = str(g(ctx, `${PI}.PAN`)).toUpperCase();
  const verPan = str(g(ctx, 'Verification.Declaration.AssesseeVerPAN')).toUpperCase();
  if (d80('Section80G') > 0 && !filled(g(ctx, 'Schedule80G')))
    err(ctx, 'A-644', 'Schedule80G', 'A deduction u/s 80G is claimed in Schedule VI-A — the donation details must be provided in Schedule 80G.');
  if (filled(g(ctx, 'Schedule80G'))) {
    const blocks: Array<[string, string, string]> = [
      ['Don100Percent', 'TotDon100Percent', 'A-635'],
      ['Don50PercentNoApprReqd', 'TotDon50PercentNoApprReqd', 'A-636'],
      ['Don100PercentApprReqd', 'TotDon100PercentApprReqd', 'A-637'],
      ['Don50PercentApprReqd', 'TotDon50PercentApprReqd', 'A-638'],
    ];
    const seenPan: string[] = [];
    let eligibleTotal = 0;
    for (const [blk, , rule] of blocks) {
      const rows = asArr(g(ctx, `Schedule80G.${blk}.DoneeWithPan`));
      let cash = 0; let other = 0;
      rows.forEach((r, i) => {
        const c = n0(at(r, 'DonationAmtCash'));
        const o = n0(at(r, 'DonationAmtOtherMode'));
        cash += c; other += o;
        eligibleTotal += n0(at(r, 'EligibleDonationAmt'));
        const dp2 = str(at(r, 'DoneePAN')).toUpperCase();
        // A-648 donee PAN mandatory when a donation is made.
        if ((c + o) > 0 && dp2 === '')
          err(ctx, 'A-648', `Schedule80G.${blk}.DoneeWithPan[${i}].DoneePAN`, 'The PAN of the donee is mandatory where the donation amount is more than zero.');
        // A-12 / A-655 donee PAN cannot be the assessee / verification PAN.
        if (dp2 !== '' && (dp2 === own || dp2 === verPan))
          err(ctx, 'A-12', `Schedule80G.${blk}.DoneeWithPan[${i}].DoneePAN`, 'The donee PAN in Schedule 80G cannot be the same as the assessee PAN or the verification PAN.');
        // A-645 the same PAN cannot appear in more than one block.
        if (dp2 !== '') {
          if (seenPan.indexOf(dp2) >= 0)
            err(ctx, 'A-645', `Schedule80G.${blk}.DoneeWithPan[${i}].DoneePAN`, 'The same donee PAN cannot be entered in more than one block of Schedule 80G.');
          else seenPan.push(dp2);
        }
        // A-635..A-638 cash donations above ₹2,000 are not eligible.
        if (c > 2000)
          err(ctx, rule, `Schedule80G.${blk}.DoneeWithPan[${i}].DonationAmtCash`, 'A deduction u/s 80G is not allowed for a cash donation above ₹2,000 against one donee PAN.');
        // A-647 reference number / IFSC for "other mode" contributions.
        if (o > 0 && !filled(at(r, 'TransactionRefNum')) && !filled(at(r, 'IFSCCode')))
          err(ctx, 'A-647', `Schedule80G.${blk}.DoneeWithPan[${i}].TransactionRefNum`, 'A transaction reference number (UPI / cheque / IMPS / NEFT / RTGS) or the IFSC code must be filled for every "contribution in other mode" entry in Schedule 80G.');
      });
      if (rows.length > 0) {
        const totKey = `Schedule80G.${blk}.${blk === 'Don100Percent' ? 'TotDon100Percent' : blk === 'Don50PercentNoApprReqd' ? 'TotDon50PercentNoApprReqd' : blk === 'Don100PercentApprReqd' ? 'TotDon100PercentApprReqd' : 'TotDon50PercentApprReqd'}`;
        if (neq(g(ctx, totKey), cash + other, 2))
          err(ctx, 'A-639', totKey, 'The total donation in this block of Schedule 80G must equal donations in cash plus donations in other modes.');
      }
    }
    // A-643 grand total.
    if (neq(g(ctx, 'Schedule80G.TotalDonationsUs80G'),
      n0(g(ctx, 'Schedule80G.TotalDonationsUs80GCash')) + n0(g(ctx, 'Schedule80G.TotalDonationsUs80GOtherMode')), 2))
      err(ctx, 'A-643', 'Schedule80G.TotalDonationsUs80G', 'The total donation at point E of Schedule 80G must equal the sum of the cash and other-mode donations.');
    // A-634 / A-760 the deduction cannot exceed the eligible amount.
    if (eligibleTotal > 0 && d80('Section80G') > n0(g(ctx, 'Schedule80G.TotalEligibleDonationsUs80G')) + 1)
      err(ctx, 'A-760', `${VIA}.Section80G`, 'The deduction u/s 80G claimed in Schedule VI-A cannot exceed the eligible amount of donation in Schedule 80G.');
    // A-646 Schedule 80G must be blank under the new regime.
    if (newRegime && n0(g(ctx, 'Schedule80G.TotalDonationsUs80G')) > 0)
      err(ctx, 'A-646', 'Schedule80G', 'Schedule 80G must be blank when the new tax regime is selected.');
  }
  // A-651 / A-652 / A-653 / A-655 Schedule 80GGA.
  if (d80('Section80GGA') > 0 && oldRegime && !filled(g(ctx, 'Schedule80GGA')))
    err(ctx, 'A-651', 'Schedule80GGA', 'A deduction u/s 80GGA is claimed in Schedule VI-A — Schedule 80GGA must be filled.');
  if (filled(g(ctx, 'Schedule80GGA'))) {
    if (newRegime && n0(g(ctx, 'Schedule80GGA.TotalDonationsUs80GGA')) > 0)
      err(ctx, 'A-652', 'Schedule80GGA', 'Schedule 80GGA must be blank when the new tax regime is selected.');
    if (neq(g(ctx, 'Schedule80GGA.TotalDonationsUs80GGA'),
      n0(g(ctx, 'Schedule80GGA.TotalDonationAmtCash80GGA')) + n0(g(ctx, 'Schedule80GGA.TotalDonationAmtOtherMode80GGA')), 2))
      err(ctx, 'A-650', 'Schedule80GGA.TotalDonationsUs80GGA', 'The total donation in Schedule 80GGA must equal the sum of donations in cash and in other modes.');
    if (n0(g(ctx, 'Schedule80GGA.TotalDonationAmtCash80GGA')) > 2000)
      err(ctx, 'A-653', 'Schedule80GGA.TotalDonationAmtCash80GGA', 'The eligible amount donated in cash in Schedule 80GGA cannot exceed ₹2,000.');
    asArr(g(ctx, 'Schedule80GGA.DonationDtlsSciRsrchRuralDev')).forEach((r, i) => {
      const dp2 = str(at(r, 'DoneePAN')).toUpperCase();
      if (dp2 !== '' && (dp2 === own || dp2 === verPan))
        err(ctx, 'A-655', `Schedule80GGA.DonationDtlsSciRsrchRuralDev[${i}].DoneePAN`, 'The donee PAN in Schedule 80GGA cannot be the same as the assessee PAN or the verification PAN.');
    });
  }
  // A-660 … A-669 Schedule 80GGC.
  if (d80('Section80GGC') > 0 && !filled(g(ctx, 'Schedule80GGC')))
    err(ctx, 'A-660', 'Schedule80GGC', 'A deduction u/s 80GGC is claimed in Schedule VI-A — the details in Schedule 80GGC are mandatory.');
  if (filled(g(ctx, 'Schedule80GGC'))) {
    if (newRegime && n0(g(ctx, 'Schedule80GGC.TotalDonationsUs80GGC')) > 0)
      err(ctx, 'A-661', 'Schedule80GGC', 'Schedule 80GGC is not required to be filled when the new tax regime is selected.');
    let cash = 0; let other = 0; let elig = 0;
    asArr(g(ctx, 'Schedule80GGC.Schedule80GGCDetails')).forEach((r, i) => {
      cash += n0(at(r, 'DonationAmtCash'));
      const o = n0(at(r, 'DonationAmtOtherMode'));
      other += o; elig += n0(at(r, 'EligibleDonationAmt'));
      // A-669 name and PAN of the political party.
      if (n0(at(r, 'DonationAmt')) > 0) {
        if (!filled(at(r, 'PoliticalPartyName')) || !filled(at(r, 'PoliticalPartyPAN')))
          err(ctx, 'A-669', `Schedule80GGC.Schedule80GGCDetails[${i}]`, 'The name and PAN of the political party are necessary to claim a deduction u/s 80GGC.');
      }
      // A-665 details required for other-mode contributions.
      if (o > 0 && !filled(at(r, 'TransactionRefNum')) && !filled(at(r, 'IFSCCode')))
        err(ctx, 'A-665', `Schedule80GGC.Schedule80GGCDetails[${i}].TransactionRefNum`, 'Where a contribution u/s 80GGC is made in a mode other than cash, the transaction reference number or IFSC code is required.');
      // A-668 contribution must fall in FY 2025-26.
      const dd = dnum(at(r, 'DonationDate'));
      if (dd && (dd < 20250401 || dd > 20260331))
        err(ctx, 'A-668', `Schedule80GGC.Schedule80GGCDetails[${i}].DonationDate`, 'A deduction u/s 80GGC can be claimed only for contributions made between 01-04-2025 and 31-03-2026.');
    });
    if (neq(g(ctx, 'Schedule80GGC.TotalDonationAmtCash80GGC'), cash, 2))
      err(ctx, 'A-656', 'Schedule80GGC.TotalDonationAmtCash80GGC', 'Sl. A "Contribution in cash" must equal the sum of column iii of Schedule 80GGC.');
    if (neq(g(ctx, 'Schedule80GGC.TotalDonationAmtOtherMode80GGC'), other, 2))
      err(ctx, 'A-657', 'Schedule80GGC.TotalDonationAmtOtherMode80GGC', 'Sl. B "Contribution in other mode" must equal the sum of column iv of Schedule 80GGC.');
    if (neq(g(ctx, 'Schedule80GGC.TotalDonationsUs80GGC'), cash + other, 2))
      err(ctx, 'A-664', 'Schedule80GGC.TotalDonationsUs80GGC', 'Total contribution in Schedule 80GGC must equal the sum of (i) + (ii).');
    if (neq(g(ctx, 'Schedule80GGC.TotalEligibleDonationAmt80GGC'), elig, 2))
      err(ctx, 'A-663', 'Schedule80GGC.TotalEligibleDonationAmt80GGC', 'Sl. D "Total eligible amount of contribution" must equal the total of column vi.');
    if (d80('Section80GGC') > n0(g(ctx, 'Schedule80GGC.TotalEligibleDonationAmt80GGC')) + 1)
      err(ctx, 'A-666', `${VIA}.Section80GGC`, 'The deduction u/s 80GGC cannot exceed the eligible amount of contribution in Schedule 80GGC.');
    // A-659 nil / negative GTI ⇒ nil eligible amount.
    if (n0(g(ctx, `${TI}.GrossTotalIncome`)) < 0 && n0(g(ctx, 'Schedule80GGC.TotalEligibleDonationAmt80GGC')) > 0)
      err(ctx, 'A-659', 'Schedule80GGC.TotalEligibleDonationAmt80GGC', 'Where the gross total income is negative, the eligible amount of donation cannot be more than zero.');
  }
  // A-687 Schedule RA must be blank under the new regime.
  if (newRegime && n0(g(ctx, 'Schedule80RA.TotalDonationsUs80RA')) > 0)
    err(ctx, 'A-687', 'Schedule80RA', 'Schedule RA must be blank when the new tax regime is selected.');
  // A-683 / A-686 Schedule RA totals.
  if (filled(g(ctx, 'Schedule80RA'))
    && neq(g(ctx, 'Schedule80RA.TotalDonationsUs80RA'),
      n0(g(ctx, 'Schedule80RA.TotalDonationAmtCash80RA')) + n0(g(ctx, 'Schedule80RA.TotalDonationAmtOtherMode80RA')), 2))
    err(ctx, 'A-683', 'Schedule80RA.TotalDonationsUs80RA', 'The total donation in Schedule RA must equal donations in cash plus donations in other modes.');
  // A-727 … A-744 loan-based deductions need their schedules.
  const loanSchedules: Array<[string, string, string, string, string, string]> = [
    ['Section80E', 'Schedule80E', 'Schedule80EDtls', 'TotalInterest80E', 'Interest80E', 'A-727'],
    ['Section80EE', 'Schedule80EE', 'Schedule80EEDtls', 'TotalInterest80EE', 'Interest80EE', 'A-731'],
    ['Section80EEA', 'Schedule80EEA', 'Schedule80EEADtls', 'TotalInterest80EEA', 'Interest80EEA', 'A-736'],
    ['Section80EEB', 'Schedule80EEB', 'Schedule80EEBDtls', 'TotalInterest80EEB', 'Interest80EEB', 'A-741'],
  ];
  for (const [key, sch, rows, tot, rowFld, rule] of loanSchedules) {
    if (d80(key) <= 0) continue;
    const arr = asArr(g(ctx, `${sch}.${rows}`));
    if (arr.length === 0) {
      err(ctx, rule, `${sch}.${rows}`, `Details of the loan must be provided in ${sch.replace('Schedule', 'Schedule ')} to claim the deduction u/s ${key.replace('Section', '')}.`);
      continue;
    }
    let s = 0;
    arr.forEach((r) => { s += n0(at(r, rowFld)); });
    if (s > 0 && neq(g(ctx, `${sch}.${tot}`), s, 2))
      err(ctx, rule, `${sch}.${tot}`, `The sum of the individual rows of ${sch.replace('Schedule', 'Schedule ')} must match the total interest u/s ${key.replace('Section', '')}.`);
    if (neq(g(ctx, `${VIA}.${key}`), Math.min(n0(g(ctx, `${sch}.${tot}`)), d80(key)), 2))
      warn(ctx, rule, `${VIA}.${key}`, `The deduction u/s ${key.replace('Section', '')} in Schedule VI-A should match the total interest in ${sch.replace('Schedule', 'Schedule ')}.`);
  }
  // A-737 80EEA stamp-duty value cap.
  if (d80('Section80EEA') > 0 && n0(g(ctx, 'Schedule80EEA.PropStmpDtyVal')) > 4500000)
    err(ctx, 'A-737', 'Schedule80EEA.PropStmpDtyVal', 'A deduction u/s 80EEA can be claimed only on a residential house property with a stamp-duty value up to ₹45 lakh.');
  // A-746 / A-747 / A-749 Schedules 80-IA / 80-IB / 80-IC-IE.
  const chapterCSchedules: Array<[string, string, string, string]> = [
    ['Section80IA', 'Schedule80_IA', 'TotSchedule80_IA', 'A-746'],
    ['Section80IB', 'Schedule80_IB', 'TotSchedule80_IB', 'A-747'],
    ['Section80IC', 'Schedule80_IC', 'TotSchedule80_IC', 'A-749'],
  ];
  for (const [key, sch, tot, rule] of chapterCSchedules) {
    if (d80(key) <= 0) continue;
    if (!filled(g(ctx, sch)))
      err(ctx, rule, sch, `A deduction u/s ${key.replace('Section', '')} is claimed in Schedule VI-A — ${sch.replace('Schedule', 'Schedule ')} must be filled.`);
    else if (d80(key) > n0(g(ctx, `${sch}.${tot}`)) + 1)
      err(ctx, rule, `${VIA}.${key}`, `The deduction u/s ${key.replace('Section', '')} claimed in Schedule VI-A cannot exceed the total in ${sch.replace('Schedule', 'Schedule ')}.`);
  }
  // A-688 Chapter-C schedules must be blank under the new regime.
  if (newRegime && (n0(g(ctx, 'Schedule80_IA.TotSchedule80_IA')) > 0
    || n0(g(ctx, 'Schedule80_IB.TotSchedule80_IB')) > 0 || n0(g(ctx, 'Schedule80_IC.TotSchedule80_IC')) > 0))
    err(ctx, 'A-688', 'Schedule80_IA', 'Schedules 80-IA / 80-IB / 80-IC-IE must be blank when the new tax regime is selected.');
  // A-633 / A-933 Schedule 10AA.
  if (newRegime && filled(g(ctx, 'Schedule10AA')))
    err(ctx, 'A-633', 'Schedule10AA', 'Schedule 10AA must be blank when the new tax regime is selected.');
  if (n0(g(ctx, `${TI}.DeductionsUnder10Aor10AA`)) > 0 && !filled(g(ctx, 'Schedule10AA')))
    err(ctx, 'A-933', 'Schedule10AA', 'A deduction u/s 10AA is claimed in Part B-TI — Schedule 10AA must be filled.');
  // A-836 Schedule AMT must be blank under the new regime.
  if (newRegime && n0(g(ctx, 'ScheduleAMT.TaxPayableUnderSec115JC')) > 0)
    err(ctx, 'A-836', 'ScheduleAMT', 'Schedule AMT must be blank when the new tax regime is selected.');

  /* ── Schedule EI / FA / AL ────────────────────────────────────────────── */

  // A-993 / A-994 EI totals.
  if (filled(g(ctx, 'ScheduleEI'))) {
    if (neq(g(ctx, 'ScheduleEI.TotalExemptInc'),
      n0(g(ctx, 'ScheduleEI.InterestInc')) + n0(g(ctx, 'ScheduleEI.NetAgriIncOrOthrIncRule7'))
      + n0(g(ctx, 'ScheduleEI.Others')) + n0(g(ctx, 'ScheduleEI.IncChrgblAsPerDTAA'))
      + n0(g(ctx, 'ScheduleEI.PassThrIncNotChrgblTax')), 2))
      warn(ctx, 'A-993', 'ScheduleEI.TotalExemptInc', 'Sl. 6 of Schedule EI should equal the sum of 1 + 2(v) + 3 + 4 + 5.');
    if (neq(g(ctx, 'ScheduleEI.NetAgriIncOrOthrIncRule7'),
      n0(g(ctx, 'ScheduleEI.GrossAgriRecpt')) - n0(g(ctx, 'ScheduleEI.ExpIncAgri'))
      - n0(g(ctx, 'ScheduleEI.UnabAgriLossPrev8')) + n0(g(ctx, 'ScheduleEI.AgriIncRule7and8')), 2))
      err(ctx, 'A-994', 'ScheduleEI.NetAgriIncOrOthrIncRule7', 'Sl. 2v of Schedule EI must equal i − ii − iii + iv.');
    // A-996 agricultural land details when net agricultural income exceeds ₹5 lakh.
    if (n0(g(ctx, 'ScheduleEI.NetAgriIncOrOthrIncRule7')) > 500000
      && asArr(g(ctx, 'ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls')).length === 0)
      err(ctx, 'A-996', 'ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls', 'Where the net agricultural income for the year exceeds ₹5 lakh, the details of each agricultural land must be filled.');
    // A-1000 exempt income restricted to non-residents.
    if (isResident && n0(g(ctx, 'ScheduleEI.IncChrgblAsPerDTAA')) > 0)
      warn(ctx, 'A-1000', 'ScheduleEI.IncChrgblAsPerDTAA', 'Income claimed as not chargeable to tax as per DTAA is generally not reportable by residents.');
  }
  // A-901 / A-902 Schedule FA.
  if (str(g(ctx, `${TT}.AssetOutIndiaFlag`)) === 'YES') {
    const fa = g(ctx, 'ScheduleFA');
    const anyFA = filled(fa) && Object.keys(fa as object).some((k) => asArr((fa as Record<string, unknown>)[k]).length > 0);
    if (!anyFA)
      err(ctx, 'A-901', 'ScheduleFA', 'Sl. 14 of Part B-TTI is "Yes" — Schedule FA (foreign assets) must be filled.');
  }
  // A-905 Schedule AL when total income exceeds ₹1 crore.
  if (n0(g(ctx, `${TI}.TotalIncome`)) > 10000000 && !filled(g(ctx, 'ScheduleAL')))
    err(ctx, 'A-905', 'ScheduleAL', 'Total income exceeds ₹1 crore — Schedule AL (assets and liabilities) must be filled.');

  /* ── Part B-TI ────────────────────────────────────────────────────────── */

  const ti = (k: string): number => n0(g(ctx, `${TI}.${k}`));
  // A-920 / A-921 / A-922 head-wise income must agree with the schedules.
  if (salaries.length > 0 && neq(g(ctx, `${TI}.Salaries`), n0(g(ctx, 'ScheduleS.TotIncUnderHeadSalaries'))))
    err(ctx, 'A-920', `${TI}.Salaries`, 'Income under the head Salaries in Part B-TI must equal the income as per Schedule Salary.');
  if (filled(g(ctx, 'ScheduleHP')) && neq(g(ctx, `${TI}.IncomeFromHP`), n0(g(ctx, 'ScheduleHP.TotalIncomeChargeableUnHP'))))
    err(ctx, 'A-921', `${TI}.IncomeFromHP`, 'Income under the head House Property in Part B-TI must equal the income as per Schedule HP.');
  if (filled(g(ctx, BP)) && neq(g(ctx, `${TI}.ProfBusGain.TotProfBusGain`), bpA37 + bpB42 + bpC48))
    warn(ctx, 'A-922', `${TI}.ProfBusGain.TotProfBusGain`, 'Income under the head PGBP in Part B-TI should equal the income as per Schedule BP.');
  // A-914 / A-915 / A-916 / A-917 / A-918 head totals.
  if (neq(g(ctx, `${TI}.ProfBusGain.TotProfBusGain`),
    ti('ProfBusGain.ProfGainNoSpecBus') + ti('ProfBusGain.ProfGainSpecBus') + ti('ProfBusGain.ProfGainSpecifiedBus')))
    err(ctx, 'A-914', `${TI}.ProfBusGain.TotProfBusGain`, 'Total profits and gains from business or profession must equal the sum of the individual components.');
  if (neq(g(ctx, `${TI}.CapGain.ShortTerm.TotalShortTerm`),
    ti('CapGain.ShortTerm.ShortTerm20Per') + ti('CapGain.ShortTerm.ShortTerm30Per')
    + ti('CapGain.ShortTerm.ShortTermAppRate') + ti('CapGain.ShortTerm.ShortTermSplRateDTAA')))
    err(ctx, 'A-915', `${TI}.CapGain.ShortTerm.TotalShortTerm`, 'Total short-term capital gains must equal the sum of the individual short-term capital gain amounts.');
  if (neq(g(ctx, `${TI}.CapGain.LongTerm.TotalLongTerm`),
    ti('CapGain.LongTerm.LongTerm12_5Per') + ti('CapGain.LongTerm.LongTermSplRateDTAA')))
    err(ctx, 'A-916', `${TI}.CapGain.LongTerm.TotalLongTerm`, 'Total long-term capital gains must equal the sum of the individual long-term capital gain amounts.');
  if (neq(g(ctx, `${TI}.CapGain.ShortTermLongTermTotal`),
    ti('CapGain.ShortTerm.TotalShortTerm') + ti('CapGain.LongTerm.TotalLongTerm')))
    err(ctx, 'A-917', `${TI}.CapGain.ShortTermLongTermTotal`, 'The sum of short-term and long-term capital gains is inconsistent.');
  if (neq(g(ctx, `${TI}.CapGain.TotalCapGains`),
    ti('CapGain.ShortTermLongTermTotal') + ti('CapGain.CapGains30Per115BBH')))
    err(ctx, 'A-956', `${TI}.CapGain.TotalCapGains`, 'Total capital gains must equal the sum of short-term/long-term capital gains and capital gains chargeable @30% u/s 115BBH.');
  if (neq(g(ctx, `${TI}.IncFromOS.TotIncFromOS`),
    ti('IncFromOS.OtherSrcThanOwnRaceHorse') + ti('IncFromOS.IncChargblSplRate') + ti('IncFromOS.FromOwnRaceHorse')))
    err(ctx, 'A-918', `${TI}.IncFromOS.TotIncFromOS`, 'Total income from other sources must equal the sum of the individual components.');
  // A-919 Sl. 6 total head-wise income.
  if (neq(g(ctx, `${TI}.TotalTI`),
    ti('Salaries') + ti('IncomeFromHP') + ti('ProfBusGain.TotProfBusGain') + ti('CapGain.TotalCapGains') + ti('IncFromOS.TotIncFromOS')))
    err(ctx, 'A-919', `${TI}.TotalTI`, 'Sl. 6 of Part B-TI must equal the total of 1 + 2 + 3v + 4e + 5d.');
  // A-945 balance after set-off of current-year losses.
  if (neq(g(ctx, `${TI}.BalanceAfterSetoffLosses`), ti('TotalTI') - ti('CurrentYearLoss')))
    err(ctx, 'A-945', `${TI}.BalanceAfterSetoffLosses`, 'Balance after set-off of current-year losses must equal total head-wise income less the current-year losses set off.');
  // A-930 / A-931 CYLA / BFLA linkage.
  if (filled(g(ctx, cy)) && neq(g(ctx, `${TI}.CurrentYearLoss`),
    n0(g(ctx, `${cy}.TotalLossSetOff.TotHPlossCurYrSetoff`)) + n0(g(ctx, `${cy}.TotalLossSetOff.TotBusLossSetoff`))
    + n0(g(ctx, `${cy}.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff`)), 2))
    err(ctx, 'A-930', `${TI}.CurrentYearLoss`, 'Losses of the current year set off in Part B-TI must equal the total losses set off in Schedule CYLA.');
  if (filled(g(ctx, 'ScheduleBFLA')) && neq(g(ctx, `${TI}.BroughtFwdLossesSetoff`),
    n0(g(ctx, 'ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff')) + n0(g(ctx, 'ScheduleBFLA.TotalBFLossSetOff.TotUnabsorbedDeprSetoff'))
    + n0(g(ctx, 'ScheduleBFLA.TotalBFLossSetOff.TotAllUs35cl4Setoff')), 2))
    err(ctx, 'A-931', `${TI}.BroughtFwdLossesSetoff`, 'Brought-forward losses set off in Part B-TI must equal the total brought-forward losses set off in Schedule BFLA.');
  // A-932 gross total income.
  if (neq(g(ctx, `${TI}.GrossTotalIncome`), ti('BalanceAfterSetoffLosses') - ti('BroughtFwdLossesSetoff')))
    err(ctx, 'A-932', `${TI}.GrossTotalIncome`, 'Gross total income must equal Sl. 8 minus Sl. 9 of Part B-TI.');
  // A-944 / A-942 / A-943 Chapter VI-A carried into Part B-TI.
  if (neq(g(ctx, `${TI}.DeductionsUndSchVIADtl.TotDeductUndSchVIA`),
    ti('DeductionsUndSchVIADtl.PartBchapterVIA') + ti('DeductionsUndSchVIADtl.PartCchapterVIA')))
    err(ctx, 'A-944', `${TI}.DeductionsUndSchVIADtl.TotDeductUndSchVIA`, 'Sl. 12(c) of Part B-TI must equal 12(a) + 12(b).');
  if (filled(g(ctx, VIA))) {
    if (neq(g(ctx, `${TI}.DeductionsUndSchVIADtl.PartBchapterVIA`),
      n0(g(ctx, `${VIA}.TotPartBchapterVIA`)) + n0(g(ctx, `${VIA}.TotPartCAandDchapterVIA`)), 2))
      err(ctx, 'A-942', `${TI}.DeductionsUndSchVIADtl.PartBchapterVIA`, 'Sl. 12(a) of Part B-TI must equal Parts B + CA/D of Schedule VI-A.');
    if (neq(g(ctx, `${TI}.DeductionsUndSchVIADtl.PartCchapterVIA`), n0(g(ctx, `${VIA}.TotPartCchapterVIA`)), 2))
      err(ctx, 'A-943', `${TI}.DeductionsUndSchVIADtl.PartCchapterVIA`, 'Sl. 12(b) of Part B-TI must equal Part C of Schedule VI-A.');
  }
  // A-937 / A-938 deductions claimed must be backed by the schedule.
  if (ti('DeductionsUndSchVIADtl.PartBchapterVIA') > 0 && !filled(g(ctx, VIA)))
    err(ctx, 'A-937', 'ScheduleVIA', 'A deduction is claimed at Sl. 12(a) of Part B-TI — Parts B, CA and D of Chapter VI-A must be filled.');
  if (ti('DeductionsUndSchVIADtl.PartCchapterVIA') > 0 && !filled(g(ctx, VIA)))
    err(ctx, 'A-938', 'ScheduleVIA', 'A deduction is claimed at Sl. 12(b) of Part B-TI — Part C of Chapter VI-A must be filled.');
  // A-935 total income.
  if (neq(g(ctx, `${TI}.TotalIncome`),
    ti('GrossTotalIncome') - ti('DeductionsUndSchVIADtl.TotDeductUndSchVIA') - ti('DeductionsUnder10Aor10AA'), 5))
    err(ctx, 'A-935', `${TI}.TotalIncome`, 'Total income must equal gross total income minus Chapter VI-A deductions (and the 10AA deduction).');
  // A-946 aggregate income.
  if (neq(g(ctx, `${TI}.AggregateIncome`),
    ti('TotalIncome') - ti('IncChargeTaxSplRate111A112') + n0(g(ctx, 'ScheduleEI.NetAgriIncOrOthrIncRule7')), 5))
    warn(ctx, 'A-946', `${TI}.AggregateIncome`, 'Sl. 17 (aggregate income) should equal Sl. 14 − 15 + 16 of Part B-TI.');
  // A-940 net agricultural income for rate purposes.
  if (filled(g(ctx, 'ScheduleEI')) && neq(g(ctx, `${TI}.NetAgricultureIncomeOrOtherIncomeForRate`), n0(g(ctx, 'ScheduleEI.NetAgriIncOrOthrIncRule7')), 2))
    warn(ctx, 'A-940', `${TI}.NetAgricultureIncomeOrOtherIncomeForRate`, 'Net agricultural income for rate purposes in Part B-TI should equal Sl. 2 of Schedule EI.');
  // A-978 deemed income u/s 115JC.
  if (filled(g(ctx, 'ScheduleAMT')) && neq(g(ctx, `${TI}.DeemedIncomeUs115JC`), n0(g(ctx, 'ScheduleAMT.AdjustedUnderSec115JC')), 2))
    warn(ctx, 'A-978', `${TI}.DeemedIncomeUs115JC`, 'Deemed income u/s 115JC in Part B-TI should equal Sl. 3 of Schedule AMT.');
  // A-947 special-rate income must be backed by Schedule SI.
  if (ti('IncChargeTaxSplRate111A112') > 0 && !filled(g(ctx, 'ScheduleSI')))
    err(ctx, 'A-947', 'ScheduleSI', 'Income chargeable to tax at a special rate is shown in Part B-TI — the details must be provided in Schedule SI (and Schedule CG / OS as applicable).');
  // A-867 / A-941 Part B-TI Sl. 11 vs Schedule SI.
  if (filled(g(ctx, 'ScheduleSI')) && neq(g(ctx, `${TI}.IncChargeTaxSplRate111A112`), n0(g(ctx, 'ScheduleSI.TotSplRateInc')), 2))
    err(ctx, 'A-867', `${TI}.IncChargeTaxSplRate111A112`, 'Sl. 11 of Part B-TI must equal the total of column (i) of Schedule SI.');
  // A-913 GTI must be disclosed when tax is payable.
  if (n0(g(ctx, `${TT}.ComputationOfTaxLiability.GrossTaxPayable`)) > 0 && ti('GrossTotalIncome') <= 0)
    err(ctx, 'A-913', `${TI}.GrossTotalIncome`, 'Tax is computed on the return — gross total income must be disclosed and cannot be nil.');

  /* ── Part B-TTI ───────────────────────────────────────────────────────── */

  const ct = `${TT}.ComputationOfTaxLiability`;
  const tti = (k: string): number => n0(g(ctx, `${ct}.${k}`));
  // A-963
  if (neq(g(ctx, `${ct}.TaxPayableOnTI.TaxPayableOnTotInc`),
    tti('TaxPayableOnTI.TaxAtNormalRatesOnAggrInc') + tti('TaxPayableOnTI.TaxAtSpecialRates') - tti('TaxPayableOnTI.RebateOnAgriInc'), 2))
    err(ctx, 'A-963', `${ct}.TaxPayableOnTI.TaxPayableOnTotInc`, 'Tax payable on total income must equal normal-rate tax + special-rate tax − rebate on agricultural income.');
  // A-964
  if (neq(g(ctx, `${ct}.TaxPayableOnTI.TaxPayableOnRebate`),
    tti('TaxPayableOnTI.TaxPayableOnTotInc') - tti('TaxPayableOnTI.Rebate87A'), 2))
    err(ctx, 'A-964', `${ct}.TaxPayableOnTI.TaxPayableOnRebate`, 'Tax payable must equal tax payable on total income minus the rebate u/s 87A.');
  // A-965
  if (neq(g(ctx, `${ct}.TaxPayableOnTI.GrossTaxLiability`),
    tti('TaxPayableOnTI.TaxPayableOnRebate') + tti('TaxPayableOnTI.TotalSurcharge') + tti('TaxPayableOnTI.EducationCess'), 2))
    err(ctx, 'A-965', `${ct}.TaxPayableOnTI.GrossTaxLiability`, 'Gross tax liability must equal tax payable + surcharge + health & education cess.');
  // A-962
  if (neq(g(ctx, `${ct}.TaxPayableOnDeemedTI.TotalTax`),
    tti('TaxPayableOnDeemedTI.TaxDeemedTISec115JC') + tti('TaxPayableOnDeemedTI.SurchargeOnAboveCrore') + tti('TaxPayableOnDeemedTI.EducationCess'), 2))
    err(ctx, 'A-962', `${ct}.TaxPayableOnDeemedTI.TotalTax`, 'Total tax payable on deemed total income u/s 115JC must equal tax + surcharge + cess.');
  // A-979 gross tax payable = higher of 1d and 2i.
  const higher = Math.max(tti('TaxPayableOnDeemedTI.TotalTax'), tti('TaxPayableOnTI.GrossTaxLiability'));
  if (neq(g(ctx, `${ct}.GrossTaxPayable`), higher, 2))
    err(ctx, 'A-979', `${ct}.GrossTaxPayable`, 'Gross tax payable must be the higher of the tax on deemed total income (1d) and the gross tax liability (2i).');
  // A-980
  if (neq(g(ctx, `${ct}.TaxPayAfterCreditUs115JD`),
    tti('GrossTaxPayable') + n0(g(ctx, `${ct}.GrossTaxPay.TaxDeferredPayableCY`)) - tti('CreditUS115JD'), 2))
    warn(ctx, 'A-980', `${ct}.TaxPayAfterCreditUs115JD`, 'Tax payable after credit u/s 115JD should equal 3a + 3c − 4.');
  // A-968 total tax relief.
  if (filled(g(ctx, `${ct}.TaxRelief`)) && neq(g(ctx, `${ct}.TaxRelief.TotTaxRelief`),
    n0(g(ctx, `${ct}.TaxRelief.Section89`)) + n0(g(ctx, `${ct}.TaxRelief.Section90`)) + n0(g(ctx, `${ct}.TaxRelief.Section91`)), 2))
    err(ctx, 'A-968', `${ct}.TaxRelief.TotTaxRelief`, 'Total tax relief must equal the sum of relief u/s 89, 90/90A and 91.');
  // A-2 HUF cannot claim relief u/s 89; A-982 relief u/s 89 needs salary / family pension.
  if (isHUF && n0(g(ctx, `${ct}.TaxRelief.Section89`)) > 0)
    err(ctx, 'A-2', `${ct}.TaxRelief.Section89`, 'A HUF cannot claim relief u/s 89.');
  if (n0(g(ctx, `${ct}.TaxRelief.Section89`)) > 0 && n0(g(ctx, 'ScheduleS.TotIncUnderHeadSalaries')) <= 0
    && n0(g(ctx, `${TI}.IncFromOS.TotIncFromOS`)) <= 0)
    err(ctx, 'A-982', `${ct}.TaxRelief.Section89`, 'Relief u/s 89 can be claimed only out of income from salary or family pension.');
  // A-20 HUF / non-resident individual cannot claim relief u/s 89A.
  if ((isHUF || isNR) && n0(g(ctx, 'ScheduleS.Increliefus89A')) > 0)
    err(ctx, 'A-20', 'ScheduleS.Increliefus89A', 'A HUF and a Non-Resident Individual cannot claim relief from taxation u/s 89A.');
  // A-966 / A-967 relief u/s 90/90A and 91 vs Schedule TR.
  if (filled(g(ctx, 'ScheduleTR1'))) {
    if (neq(g(ctx, `${ct}.TaxRelief.Section90`), n0(g(ctx, 'ScheduleTR1.TaxReliefOutsideIndiaDTAA')), 2))
      err(ctx, 'A-966', `${ct}.TaxRelief.Section90`, 'Relief claimed u/s 90/90A must equal the amount entered in Schedule TR.');
    if (neq(g(ctx, `${ct}.TaxRelief.Section91`), n0(g(ctx, 'ScheduleTR1.TaxReliefOutsideIndiaNotDTAA')), 2))
      err(ctx, 'A-967', `${ct}.TaxRelief.Section91`, 'Relief claimed u/s 91 must equal the amount entered in Schedule TR.');
    // A-897 Schedule TR internal total.
    if (neq(g(ctx, 'ScheduleTR1.TotalTaxReliefOutsideIndia'),
      n0(g(ctx, 'ScheduleTR1.TaxReliefOutsideIndiaDTAA')) + n0(g(ctx, 'ScheduleTR1.TaxReliefOutsideIndiaNotDTAA')), 2))
      err(ctx, 'A-897', 'ScheduleTR1.TotalTaxReliefOutsideIndia', 'In Schedule TR, Sl. 2 + Sl. 3 must equal the total of column 1(d).');
  }
  // A-981 net tax liability.
  if (neq(g(ctx, `${ct}.NetTaxLiability`),
    tti('TaxPayAfterCreditUs115JD') - n0(g(ctx, `${ct}.TaxRelief.TotTaxRelief`)), 2))
    err(ctx, 'A-981', `${ct}.NetTaxLiability`, 'Net tax liability must equal tax payable after credit u/s 115JD minus the total tax relief.');
  // A-969 interest & fee.
  const ip = `${ct}.IntrstPay`;
  if (neq(g(ctx, `${ip}.TotalIntrstPay`),
    n0(g(ctx, `${ip}.IntrstPayUs234A`)) + n0(g(ctx, `${ip}.IntrstPayUs234B`)) + n0(g(ctx, `${ip}.IntrstPayUs234C`))
    + n0(g(ctx, `${ip}.LateFilingFee234F`)) + n0(g(ctx, `${ip}.FeeFurnish234I`)), 2))
    err(ctx, 'A-969', `${ip}.TotalIntrstPay`, 'Total interest & fee payable must equal interest u/s 234A + 234B + 234C + fee u/s 234F + 234-I.');
  // A-970 aggregate liability.
  if (neq(g(ctx, `${ct}.AggregateTaxInterestLiability`),
    tti('NetTaxLiability') + n0(g(ctx, `${ip}.TotalIntrstPay`)), 2))
    err(ctx, 'A-970', `${ct}.AggregateTaxInterestLiability`, 'Aggregate liability must equal net tax liability plus total interest & fee payable.');
  // A-990 / A-991 fee u/s 234-I on a revised return.
  if (filingSec === 17) {
    const totIncome = ti('TotalIncome');
    const fee = n0(g(ctx, `${ip}.FeeFurnish234I`));
    const expect = totIncome > 500000 ? 5000 : 1000;
    if (fee > 0 && fee !== expect)
      warn(ctx, totIncome > 500000 ? 'A-991' : 'A-990', `${ip}.FeeFurnish234I`,
        `The fee u/s 234-I for a revised return filed after 31-12-2026 should be ₹${expect}.`);
  }
  // A-971 total taxes paid.
  const tp = `${TT}.TaxPaid.TaxesPaid`;
  const paidSum = n0(g(ctx, `${tp}.AdvanceTax`)) + n0(g(ctx, `${tp}.TDS`)) + n0(g(ctx, `${tp}.TCS`)) + n0(g(ctx, `${tp}.SelfAssessmentTax`));
  if (neq(g(ctx, `${tp}.TotalTaxesPaid`), paidSum, 2))
    err(ctx, 'A-971', `${tp}.TotalTaxesPaid`, 'Total taxes paid must equal advance tax + TDS + TCS + self-assessment tax.');
  // A-961 / A-986 / A-987 the claims must match the tax-payment schedules.
  if (filled(g(ctx, 'ScheduleIT')) && neq(g(ctx, 'ScheduleIT.TotalTaxPayments'),
    n0(g(ctx, `${tp}.AdvanceTax`)) + n0(g(ctx, `${tp}.SelfAssessmentTax`)), 2))
    warn(ctx, 'A-961', `${tp}.AdvanceTax`, 'Advance tax and self-assessment tax claimed in Part B-TTI should agree with the total of Schedule IT.');
  const tdsTotal = n0(g(ctx, 'ScheduleTDS1.TotalTDSonSalaries')) + n0(g(ctx, 'ScheduleTDS2.TotalTDSonOthThanSals'))
    + n0(g(ctx, 'ScheduleTDS3.TotalTDS3OnOthThanSal'));
  if ((filled(g(ctx, 'ScheduleTDS1')) || filled(g(ctx, 'ScheduleTDS2')) || filled(g(ctx, 'ScheduleTDS3')))
    && neq(g(ctx, `${tp}.TDS`), tdsTotal, 2))
    err(ctx, 'A-987', `${tp}.TDS`, 'Sl. 10(b) "TDS" must equal the total of Schedule TDS-1, TDS-2 and TDS-3.');
  if (filled(g(ctx, 'ScheduleTCS')) && neq(g(ctx, `${tp}.TCS`), n0(g(ctx, 'ScheduleTCS.TotalSchTCS')), 2))
    err(ctx, 'A-986', `${tp}.TCS`, 'Sl. 10(c) "TCS" must equal the total of column 7(i) of Schedule TCS.');
  // A-976 / A-977 refund / balance payable.
  const agg = tti('AggregateTaxInterestLiability');
  const paid = n0(g(ctx, `${tp}.TotalTaxesPaid`));
  if (neq(g(ctx, `${TT}.Refund.RefundDue`), Math.max(0, paid - agg), 5))
    err(ctx, 'A-976', `${TT}.Refund.RefundDue`, 'The refund claimed must equal total taxes paid minus the aggregate liability.');
  if (filled(g(ctx, `${TT}.TaxPaid.BalTaxPayable`)) && neq(g(ctx, `${TT}.TaxPaid.BalTaxPayable`), Math.max(0, agg - paid), 5))
    err(ctx, 'A-977', `${TT}.TaxPaid.BalTaxPayable`, 'The tax payable amount must equal the aggregate liability minus the total taxes paid.');
  // Bank account required when a refund is claimed.
  if (n0(g(ctx, `${TT}.Refund.RefundDue`)) > 0) {
    const banks = asArr(g(ctx, `${TT}.Refund.BankAccountDtls.AddtnlBankDetails`));
    if (banks.length === 0)
      err(ctx, 'A-972', `${TT}.Refund.BankAccountDtls.AddtnlBankDetails`, 'A refund is claimed — at least one bank account must be provided in Part B-TTI.');
    else if (!banks.some((b) => str(at(b, 'UseForRefund')).toUpperCase() === 'TRUE' || at(b, 'UseForRefund') === true))
      err(ctx, 'A-972', `${TT}.Refund.BankAccountDtls.AddtnlBankDetails`, 'A refund is claimed — one bank account must be nominated for the refund.');
    banks.forEach((b, i) => {
      const ifsc = str(at(b, 'IFSCCode'));
      if (ifsc !== '' && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
        err(ctx, 'A-972', `${TT}.Refund.BankAccountDtls.AddtnlBankDetails[${i}].IFSCCode`, 'The IFSC code of the bank account is not in a valid format.');
    });
  }
  // A-973 / A-974 / A-975 / A-988 / A-957 rebate u/s 87A.
  const reb = tti('TaxPayableOnTI.Rebate87A');
  if (reb > 0) {
    if (!isResident)
      err(ctx, 'A-973', `${ct}.TaxPayableOnTI.Rebate87A`, 'The rebate u/s 87A is allowed only to a Resident or a Resident but not Ordinarily Resident.');
    if (isHUF)
      err(ctx, 'A-974', `${ct}.TaxPayableOnTI.Rebate87A`, 'The rebate u/s 87A is allowed only to an Individual.');
    if (oldRegime && reb > 12500)
      err(ctx, 'A-957', `${ct}.TaxPayableOnTI.Rebate87A`, 'Under the old tax regime the rebate u/s 87A cannot exceed ₹12,500.');
    if (oldRegime && ti('TotalIncome') > 500000)
      err(ctx, 'A-975', `${ct}.TaxPayableOnTI.Rebate87A`, 'The rebate u/s 87A cannot be claimed under the old regime where the total income exceeds ₹5 lakh.');
    if (newRegime && ti('TotalIncome') > 1200000)
      err(ctx, 'A-988', `${ct}.TaxPayableOnTI.Rebate87A`, 'An assessee with total income exceeding ₹12,00,000 (subject to marginal relief) cannot claim the rebate u/s 87A.');
  }
  // A-983 new regime: AMT block must be nil.
  if (newRegime && tti('TaxPayableOnDeemedTI.TotalTax') > 0)
    err(ctx, 'A-983', `${ct}.TaxPayableOnDeemedTI.TotalTax`, 'Under the new tax regime, Sl. 1a to 1d of Part B-TTI must not be more than zero.');
  // A-847 AMT credit must match Schedule AMTC.
  if (filled(g(ctx, 'ScheduleAMTC')) && neq(g(ctx, `${ct}.CreditUS115JD`), n0(g(ctx, 'ScheduleAMTC.TotAmtCreditUtilisedCY')), 2))
    warn(ctx, 'A-847', `${ct}.CreditUS115JD`, 'The AMT credit u/s 115JD claimed in Part B-TTI should equal the credit in Schedule AMTC.');
  // A-907 ESOP deferred tax carried forward.
  if (filled(g(ctx, 'ScheduleESOP')) && neq(g(ctx, `${ct}.GrossTaxPay.TaxDeferred17`), n0(g(ctx, 'ScheduleESOP.TotalTaxAttributedAmt')), 2))
    warn(ctx, 'A-907', `${ct}.GrossTaxPay.TaxDeferred17`, 'The balance of tax deferred on ESOP in Part B-TTI should equal Sl. 8 of Schedule ESOP.');

  /* ── Tax-payment schedules ────────────────────────────────────────────── */

  // A-1003 / A-1017 / A-1018 / A-1019 TDS-1.
  const tds1 = asArr(g(ctx, 'ScheduleTDS1.TDSonSalary'));
  if (tds1.length > 0) {
    let s = 0;
    tds1.forEach((r) => { s += n0(at(r, 'TotalTDSSal')); });
    if (s > 0 && neq(g(ctx, 'ScheduleTDS1.TotalTDSonSalaries'), s, 2))
      err(ctx, 'A-1003', 'ScheduleTDS1.TotalTDSonSalaries', 'The total of "total tax deducted" in Schedule TDS-1 must equal the sum of the individual values.');
    if (n0(g(ctx, 'ScheduleTDS1.TotalTDSonSalaries')) > 0 && n0(g(ctx, 'ScheduleS.TotalGrossSalary')) <= 0)
      err(ctx, 'A-1018', 'ScheduleS.TotalGrossSalary', 'Total gross salary must be more than zero when TDS is deducted in Schedule TDS-1.');
  }
  // A-1004 / A-1009 / A-1011 / A-1015 / A-1016 / A-1002 TDS-2.
  const tds2 = asArr(g(ctx, 'ScheduleTDS2.TDSOthThanSalaryDtls'));
  let tds2Sum = 0;
  tds2.forEach((r, i) => {
    const claimed = n0(at(r, 'TaxDeductCreditDtls.TaxClaimedOwnHands'));
    tds2Sum += claimed;
    if (claimed > 0) {
      if (!filled(at(r, 'GrossAmount')) || !filled(at(r, 'HeadOfIncome')))
        err(ctx, 'A-1009', `ScheduleTDS2.TDSOthThanSalaryDtls[${i}]`, 'Where TDS is claimed, the corresponding income offered — "Gross amount" and "Head of income" — must be filled.');
      const deducted = n0(at(r, 'TaxDeductCreditDtls.TaxDeductedOwnHands')) + n0(at(r, 'BroughtFwdTDSAmt'));
      if (deducted > 0 && claimed > deducted + 1)
        err(ctx, 'A-1011', `ScheduleTDS2.TDSOthThanSalaryDtls[${i}]`, 'In Schedule TDS-2 the TDS claimed cannot exceed the TDS deducted.');
      if (n0(at(r, 'GrossAmount')) > 0 && claimed > n0(at(r, 'GrossAmount')))
        err(ctx, 'A-1007', `ScheduleTDS2.TDSOthThanSalaryDtls[${i}].GrossAmount`, 'TDS claimed cannot be more than the gross income disclosed.');
    }
    if (str(at(r, 'TDSCreditName')) === 'O' && !filled(at(r, 'PANofOtherPerson')) && !filled(at(r, 'AadhaarOfOtherPerson')))
      err(ctx, 'A-1015', `ScheduleTDS2.TDSOthThanSalaryDtls[${i}].PANofOtherPerson`, 'Where the TDS credit relates to another person, the PAN of that person must be provided.');
    if (!filled(at(r, 'TANOfDeductor')))
      err(ctx, 'A-1016', `ScheduleTDS2.TDSOthThanSalaryDtls[${i}].TANOfDeductor`, 'The TAN of the deductor must be filled in Schedule TDS-2.');
    if (n0(at(r, 'BroughtFwdTDSAmt')) > 0 && !filled(at(r, 'DeductedYr')))
      err(ctx, 'A-1002', `ScheduleTDS2.TDSOthThanSalaryDtls[${i}].DeductedYr`, 'Where TDS brought forward is claimed, the year of tax deduction must be provided.');
  });
  if (tds2.length > 0 && tds2Sum > 0 && neq(g(ctx, 'ScheduleTDS2.TotalTDSonOthThanSals'), tds2Sum, 2))
    err(ctx, 'A-1004', 'ScheduleTDS2.TotalTDSonOthThanSals', 'The total "TDS credit claimed this year" in Schedule TDS-2 must equal the sum of the individual values.');
  // A-1005 / A-1010 / A-1012 / A-1016 TDS-3.
  const tds3 = asArr(g(ctx, 'ScheduleTDS3.TDS3onOthThanSalDtls'));
  let tds3Sum = 0;
  tds3.forEach((r, i) => {
    const claimed = n0(at(r, 'TaxDeductCreditDtls.TaxClaimedOwnHands'));
    tds3Sum += claimed;
    if (claimed > 0 && (!filled(at(r, 'GrossAmount')) || !filled(at(r, 'HeadOfIncome'))))
      err(ctx, 'A-1010', `ScheduleTDS3.TDS3onOthThanSalDtls[${i}]`, 'Where TDS is claimed on Form 26QB/26QC/26QD, the corresponding gross amount and head of income must be filled.');
    if (!filled(at(r, 'PANOfBuyerTenant')) && !filled(at(r, 'AadhaarOfBuyerTenant')))
      err(ctx, 'A-1016', `ScheduleTDS3.TDS3onOthThanSalDtls[${i}].PANOfBuyerTenant`, 'The PAN of the tenant / buyer must be filled in Schedule TDS-3.');
    if (str(at(r, 'TDSCreditName')) === 'O' && !filled(at(r, 'PANofOtherPerson')) && !filled(at(r, 'AadhaarOfOtherPerson')))
      err(ctx, 'A-1015', `ScheduleTDS3.TDS3onOthThanSalDtls[${i}].PANofOtherPerson`, 'Where the TDS credit relates to another person, the PAN of that person must be provided.');
  });
  if (tds3.length > 0 && tds3Sum > 0 && neq(g(ctx, 'ScheduleTDS3.TotalTDS3OnOthThanSal'), tds3Sum, 2))
    err(ctx, 'A-1005', 'ScheduleTDS3.TotalTDS3OnOthThanSal', 'The total "TDS credit claimed this year" in Schedule TDS-3 must equal the sum of the individual values.');
  // A-1022 … A-1028 TCS.
  const tcs = asArr(g(ctx, 'ScheduleTCS.TCS'));
  let tcsSum = 0;
  tcs.forEach((r, i) => {
    const collected = n0(at(r, 'TCSCurrFYDtls.TCSAmtCollOwnHand')) + n0(at(r, 'BroughtFwdTDSAmt'));
    const claimed = n0(at(r, 'TCSClaimedThisYearDtls.TCSAmtCollOwnHand'));
    tcsSum += claimed;
    if (collected > 0 && claimed > collected + 1)
      err(ctx, 'A-1022', `ScheduleTCS.TCS[${i}]`, 'The amount of TCS claimed this year cannot be more than the tax collected.');
    if (!filled(at(r, 'EmployerOrDeductorOrCollectTAN')))
      err(ctx, 'A-1028', `ScheduleTCS.TCS[${i}].EmployerOrDeductorOrCollectTAN`, 'The tax deduction and collection account number of the collector must be provided.');
    if (!filled(at(r, 'TCSCreditOwner')))
      err(ctx, 'A-1027', `ScheduleTCS.TCS[${i}].TCSCreditOwner`, 'The applicable dropdown in column 2(i) of Schedule TCS must be selected.');
    if (str(at(r, 'TCSCreditOwner')) === '2' && !filled(at(r, 'PANOfSpouseOrOthrPrsn')))
      err(ctx, 'A-1026', `ScheduleTCS.TCS[${i}].PANOfSpouseOrOthrPrsn`, 'Where the TCS credit relates to another person, the PAN of that person must be provided.');
  });
  if (tcs.length > 0 && tcsSum > 0 && neq(g(ctx, 'ScheduleTCS.TotalSchTCS'), tcsSum, 2))
    err(ctx, 'A-1023', 'ScheduleTCS.TotalSchTCS', 'The total TCS claimed must equal the sum of the individual values.');
  // A-912 tax payments disclosed require the corresponding income schedules.
  if (paid > 0 && ti('TotalTI') === 0 && ti('GrossTotalIncome') === 0)
    err(ctx, 'A-939', `${TI}.TotalTI`, 'Income details and the tax computation must be disclosed where details of taxes paid have been disclosed.');
  // Advance / self-assessment tax rows: challan particulars.
  asArr(g(ctx, 'ScheduleIT.TaxPayment')).forEach((r, i) => {
    if (n0(at(r, 'Amt')) > 0) {
      if (!filled(at(r, 'BSRCode')))
        err(ctx, 'A-961', `ScheduleIT.TaxPayment[${i}].BSRCode`, 'The BSR code of the bank is mandatory for every advance-tax / self-assessment-tax challan.');
      if (!filled(at(r, 'SrlNoOfChaln')))
        err(ctx, 'A-961', `ScheduleIT.TaxPayment[${i}].SrlNoOfChaln`, 'The challan serial number is mandatory for every advance-tax / self-assessment-tax challan.');
      const d = dnum(at(r, 'DateDep'));
      if (d && d > today)
        err(ctx, 'A-961', `ScheduleIT.TaxPayment[${i}].DateDep`, 'The date of deposit of the challan cannot be after the current system date.');
    }
  });

  /* ── Verification ─────────────────────────────────────────────────────── */

  const vdate = dnum(g(ctx, 'Verification.Date'));
  if (vdate && vdate > today)
    err(ctx, 'A-17', 'Verification.Date', 'The date of verification cannot be after the current system date.');
  const vpan = str(g(ctx, 'Verification.Declaration.AssesseeVerPAN')).toUpperCase();
  if (vpan !== '' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(vpan))
    err(ctx, 'A-8', 'Verification.Declaration.AssesseeVerPAN', 'The PAN of the person verifying the return is not in a valid format.');
  if (capacity === 'S' && vpan !== '' && own !== '' && vpan !== own)
    err(ctx, 'A-8', 'Verification.Declaration.AssesseeVerPAN', 'Where the return is verified in the capacity "Self", the verification PAN must be the same as the PAN of the assessee.');
  if (isHUF && capacity === 'S')
    warn(ctx, 'A-9', 'Verification.Capacity', 'A HUF return is normally verified by the Karta — check the capacity selected.');

  /* ── Form / creation identity ─────────────────────────────────────────── */

  const formName = str(g(ctx, 'Form_ITR3.FormName'));
  if (formName !== '' && formName !== 'ITR-3')
    err(ctx, 'SCHEMA', 'Form_ITR3.FormName', 'Form name must be exactly "ITR-3".');
  const ayv = str(g(ctx, 'Form_ITR3.AssessmentYear'));
  if (ayv !== '' && ayv !== '2026')
    err(ctx, 'SCHEMA', 'Form_ITR3.AssessmentYear', 'Assessment year must be "2026" (AY 2026-27).');
  for (const k of ['SchemaVer', 'FormVer']) {
    const v = str(g(ctx, `Form_ITR3.${k}`));
    if (v !== '' && v !== 'Ver1.0')
      err(ctx, 'SCHEMA', `Form_ITR3.${k}`, `${k} must be "Ver1.0" for the ITR-3 AY 2026-27 schema.`);
  }
  if (own !== '' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(own))
    err(ctx, 'SCHEMA', `${PI}.PAN`, 'PAN of the assessee is not in a valid format (AAAAA9999A).');
  const st = str(g(ctx, `${PI}.Status`));
  if (st !== '' && st !== 'I' && st !== 'H')
    err(ctx, 'SCHEMA', `${PI}.Status`, 'Status must be "I" (Individual) or "H" (HUF) for ITR-3.');
  const email = str(g(ctx, `${PI}.Address.EmailAddress`));
  if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    err(ctx, 'A-1', `${PI}.Address.EmailAddress`, 'The e-mail address is not in a valid format.');
}

/* ── Entry point ───────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];
  try {
    walkBranch(json, TREE, '', missing, 0);
    const r3 = at(json, 'ITR.ITR3');
    if (r3 !== null && typeof r3 === 'object') {
      applyCategoryARules({ r3, errors, warnings, missing });
    }
  } catch {
    // never throw — report whatever was gathered
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
