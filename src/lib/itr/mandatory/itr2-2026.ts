/**
 * Mandatory-field validator — ITR-2, AY 2026-27.
 *
 * Sources (this exact form-year only):
 *  - Official ITD JSON schema  "ITR-2_2026_Main_V1.1.json"  (SchemaVer "Ver1.0")
 *  - CBDT "ITR 2 – Validation Rules for AY 2026-27" V1.0 (26 May 2026), Category A
 *
 * The module embeds a DISTILLED required-tree extracted from the official schema
 * (properties/required/definitions/$ref/items followed recursively). Node forms:
 *   1                      → required scalar leaf
 *   { r?:1, a?:1, c?:{…} } → branch; r = required, a = array (c applies to items)
 * Optional branches are kept only when they contain required descendants; they
 * are enforced only when the payload actually carries the branch (JSON-schema
 * semantics). Category-A rules that are checkable on the JSON alone are encoded
 * below; rules needing CPC/PAN-database/e-verification data are skipped.
 *
 * Never throws — accepts undefined/partial payloads.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr2';
const AY = '2026-27';
/** From the official schema file: file version V1.1, Form_ITR2.SchemaVer "Ver1.0". */
const SCHEMA_VERSION = 'ITR-2_2026_Main_V1.1 (SchemaVer Ver1.0)';

/* ── Distilled required-tree (generated from the official schema) ──────────── */

type TreeNode = 1 | TreeBranch;
interface TreeBranch { r?: 1; a?: 1; c?: Record<string, TreeNode> }

const TREE: TreeBranch = JSON.parse('{"c":{"ITR":{"r":1,"c":{"ITR2":{"r":1,"c":{"CreationInfo":{"r":1,"c":{"SWVersionNo":1,"SWCreatedBy":1,"JSONCreatedBy":1,"JSONCreationDate":1,"IntermediaryCity":1,"Digest":1}},"Form_ITR2":{"r":1,"c":{"FormName":1,"Description":1,"AssessmentYear":1,"SchemaVer":1,"FormVer":1}},"PartA_GEN1":{"r":1,"c":{"PersonalInfo":{"r":1,"c":{"AssesseeName":{"r":1,"c":{"SurNameOrOrgName":1}},"PAN":1,"Address":{"r":1,"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1,"Phone":{"c":{"STDcode":1,"PhoneNo":1}},"CountryCodeMobile":1,"MobileNo":1,"EmailAddress":1}},"SecondaryAdd":1,"AlternateAddress":{"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1}},"DOB":1,"Status":1}},"FilingStatus":{"r":1,"c":{"ReturnFileSec":1,"OptOutNewTaxRegime":1,"SeventhProvisio139":1,"clauseiv7provisio139iDtls":{"a":1,"c":{"clauseiv7provisio139iNature":1,"clauseiv7provisio139iAmount":1}},"ResidentialStatus":1,"JurisdictionResPrevYr":{"c":{"JurisdictionResPrevYrDtls":{"a":1,"c":{"JurisdictionResidence":1,"TIN":1}}}},"AssesseeRep":{"c":{"RepName":1,"RepEmailID":1,"CountryCodeRepMobileNo":1,"RepMobileNo":1}},"FiiFpiFlag":1,"CompDirectorPrvYr":{"c":{"CompDirectorPrvYrDtls":{"a":1,"c":{"NameOfCompany":1,"CompanyType":1,"SharesTypes":1}}}},"HeldUnlistedEqShrPrYrFlg":1,"HeldUnlistedEqShrPrYr":{"c":{"HeldUnlistedEqShrPrYrDtls":{"a":1,"c":{"NameOfCompany":1,"CompanyType":1,"OpngBalNumberOfShares":1,"OpngBalCostOfAcquisition":1,"ClsngBalNumberOfShares":1,"ClsngBalCostOfAcquisition":1}}}},"ItrFilingDueDate":1}}}},"ScheduleS":{"c":{"Salaries":{"a":1,"c":{"NameOfEmployer":1,"NatureOfEmployment":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1}},"Salarys":{"r":1,"c":{"GrossSalary":1,"Salary":1,"NatureOfSalary":{"c":{"OthersIncDtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"ValueOfPerquisites":1,"NatureOfPerquisites":{"c":{"OthersIncDtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"ProfitsinLieuOfSalary":1,"NatureOfProfitInLieuOfSalary":{"c":{"OthersIncDtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"IncomeNotified89A":1,"IncomeNotified89AType":{"a":1,"c":{"NOT89ACountrycode":1,"NOT89AAmount":1}},"IncomeNotifiedOther89A":1}}}},"TotalGrossSalary":1,"AllwncExtentExemptUs10":1,"AllwncExemptUs10":{"c":{"AllwncExemptUs10Dtls":{"a":1,"c":{"SalNatureDesc":1,"SalOthAmount":1}}}},"Section10_13A":{"c":{"Placeofwork":1,"ActlHRARecv":1,"ActlRentPaid":1,"DtlsSalUsSec171":1,"ActlRentPaid10Per":1,"Sal40Or50Per":1,"EligbleExmpAllwncUs13A":1}},"NetSalary":1,"DeductionUS16":1,"DeductionUnderSection16ia":1,"EntertainmntalwncUs16ii":1,"ProfessionalTaxUs16iii":1,"TotIncUnderHeadSalaries":1}},"ScheduleHP":{"c":{"PropertyDetails":{"a":1,"c":{"HPSNo":1,"AddressDetailWithZipCode":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1}},"PropertyOwner":1,"PropCoOwnedFlg":1,"AsseseeShareProperty":1,"CoOwners":{"a":1,"c":{"CoOwnersSNo":1,"NameCoOwner":1}},"ifLetOut":1,"TenantDetails":{"a":1,"c":{"TenantSNo":1,"NameofTenant":1}},"Rentdetails":{"r":1,"c":{"AnnualLetableValue":1,"TotalUnrealizedAndTax":1,"BalanceALV":1,"AnnualOfPropOwned":1,"ThirtyPercentOfBalance":1,"Section24B":{"c":{"Section24BDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"InterestUs24B":1}},"TotalInterestUs24B":1}},"TotalDeduct":1,"IncomeOfHP":1}}}},"TotalIncomeChargeableUnHP":1}},"ScheduleCGFor23":{"c":{"ShortTermCapGainFor23":{"r":1,"c":{"SaleofLandBuild":{"c":{"SaleofLandBuildDtls":{"a":1,"c":{"FullConsideration50C":1,"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1,"Balance":1,"DeductionUs54B":1,"STCGonImmvblPrprty":1,"TrnsfImmblPrprty":{"c":{"TrnsfImmblPrprtyDtls":{"a":1,"c":{"NameOfBuyer":1,"PercentageShare":1,"Amount":1,"AddressOfProperty":1,"StateCode":1,"CountryCode":1}}}}}}}},"EquityMFonSTT":{"a":1,"c":{"MFSectionCode":1,"EquityMFonSTTDtls":{"r":1,"c":{"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"CapgainonAssets":1}}}},"NRITransacSec48Dtl":{"r":1,"c":{"NRItaxSTTPaid":1,"NRItaxSTTNotPaid":1}},"NRISecur115AD":{"r":1,"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"CapgainonAssets":1}},"SaleOnOtherAssets":{"r":1,"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"CapgainonAssets":1}},"UnutilizedCg":{"c":{"UnutilizedCgPrvYrDtls":{"a":1,"c":{"PrvYrInWhichAsstTrnsfrd":1,"SectionClmd":1,"AmtUnutilized":1}}}},"TotalAmtDeemedStcg":1,"PassThrIncNatureSTCG":1,"NRICgDTAA":{"c":{"NRIDTAADtls":{"a":1,"c":{"DTAAamt":1,"ItemNoincl":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"SecITAct":1,"RateAsPerITAct":1}}}},"TotalAmtNotTaxUsDTAAStcg":1,"TotalAmtTaxUsDTAAStcg":1,"CapitalLossBuyBackShares":{"c":{"TotalCapitalLossBuyBackShares":1,"CapitalLossBuyBackSharesDtls":{"r":1,"a":1,"c":{"Rate":1,"Amount":1}}}},"TotalSTCG":1}},"LongTermCapGain23":{"r":1,"c":{"SaleofLandBuild":{"c":{"SaleofLandBuildDtls":{"a":1,"c":{"FullConsideration50C":1,"AquisitCost":1,"AquisitCostIndex":1,"CostOfImprovements":{"c":{"CostOfImprovementsDtls":{"r":1,"a":1,"c":{"slno":1,"ImproveCost":1,"ImproveDate":1,"CostOfImpIndex":1}},"TotalImprovecost":1,"TotalindexImprovecost":1}},"ExpOnTrans":1,"TotalDedn":1,"Balance":1,"ExemptionOrDednUs54":{"r":1,"c":{"ExemptionOrDednUs54Dtls":{"a":1,"c":{"ExemptionSecCode":1,"ExemptionAmount":1}},"ExemptionGrandTotal":1}},"LTCGonImmvblPrprty":1,"TrnsfImmblPrprty":{"c":{"TrnsfImmblPrprtyDtls":{"a":1,"c":{"NameOfBuyer":1,"PercentageShare":1,"Amount":1,"AddressOfProperty":1,"StateCode":1,"CountryCode":1}}}}}},"TotalLTCGImmblPrprty":1,"TotalExcessTax":1}},"Proviso112Applicable":{"a":1,"c":{"Proviso112SectionCode":1,"Proviso112Applicabledtls":{"r":1,"c":{"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}}}},"SaleOfEquityShareUs112A":{"r":1,"c":{"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}},"NRIProvisoSec48":{"c":{"LTCGWithoutBenefit":1,"DeductionUs54F":1,"BalanceCG":1}},"NRIOnSec112and115":{"c":{"NRIOnSec112and115Dtls":{"a":1,"c":{"SectionCode":1,"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}}}},"NRISaleOfEquityShareUs112A":{"r":1,"c":{"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}},"NRISaleofForeignAsset":{"r":1,"c":{"SaleonSpecAsset":1,"DednSpecAssetus115":1,"BalonSpeciAsset":1}},"SaleofAssetNADtls":{"r":1,"c":{"SaleofAssetNA":{"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}}}},"UnutilizedCg":{"c":{"UnutilizedCgPrvYrDtls":{"a":1,"c":{"PrvYrInWhichAsstTrnsfrd":1,"SectionClmd":1,"AmtUnutilized":1}}}},"TotalAmtDeemedLtcg":1,"PassThrIncNatureLTCG":1,"NRICgDTAA":{"c":{"NRIDTAADtls":{"a":1,"c":{"DTAAamt":1,"ItemNoincl":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"SecITAct":1,"RateAsPerITAct":1}}}},"TotalAmtNotTaxUsDTAALtcg":1,"CapitalLossBuyBackShares":{"c":{"TotalCapitalLossBuyBackShares":1}},"TotalAmtTaxUsDTAALtcg":1,"TotalLTCG":1}},"SumOfCGIncm":1,"IncmFromVDATrnsf":1,"TotScheduleCGFor23":1,"DeducClaimInfo":{"c":{"DeducClaimDtlsUs54":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54B":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54EC":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54F":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs115F":{"a":1,"c":{"DateofTransfer":1,"AmtInvested":1,"DateofInvestment":1,"AmtDeducted":1}},"TotDeductClaim":1}},"CurrYrLosses":{"r":1,"c":{"InLossSetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSetOffDTAARate":1}},"InStcg20Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcg30Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcgAppRate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcgDTAARate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"CurrYrCapGain":1}},"InLtcg12_5Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOffDTAARate":1,"CurrYrCapGain":1}},"InLtcgDTAARate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"CurrYrCapGain":1}},"TotLossSetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSetOffDTAARate":1}},"LossRemainSetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSetOffDTAARate":1}}}},"AccruOrRecOfCG":{"r":1,"c":{"ShortTermUnder20Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnder30Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnderAppRate":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnderDTAARate":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"LongTermUnder12_5Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"LongTermUnderDTAARate":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"VDATrnsfGainsUnder30Per":{"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}}}}}},"Schedule112A":{"c":{"Schedule112ADtls":{"a":1,"c":{"ShareOnOrBefore":1,"ISINCode":1,"ShareUnitName":1,"TotSaleValue":1,"CostAcqWithoutIndx":1,"AcquisitionCost":1,"LTCGBeforelowerB1B2":1,"FairMktValuePerShareunit":1,"TotFairMktValueCapAst":1,"ExpExclCnctTransfer":1,"TotalDeductions":1,"Balance":1}},"SaleValue112A":1,"CostAcqWithoutIndx112A":1,"AcquisitionCost112A":1,"LTCGBeforelowerB1B2112A":1,"FairMktValueCapAst112A":1,"ExpExclCnctTransfer112A":1,"Deductions112A":1,"Balance112A":1,"TotalBalance112A":1}},"Schedule115AD":{"c":{"Schedule115ADDtls":{"a":1,"c":{"ShareOnOrBefore":1,"ISINCode":1,"ShareUnitName":1,"TotSaleValue":1,"CostAcqWithoutIndx":1,"AcquisitionCost":1,"LTCGBeforelowerB1B2":1,"FairMktValuePerShareunit":1,"TotFairMktValueCapAst":1,"ExpExclCnctTransfer":1,"TotalDeductions":1,"Balance":1}},"SaleValue115AD":1,"CostAcqWithoutIndx115AD":1,"AcquisitionCost115AD":1,"LTCGBeforelowerB1B2115AD":1,"FairMktValueCapAst115AD":1,"ExpExclCnctTransfer115AD":1,"Deductions115AD":1,"Balance115AD":1,"TotalBalance115AD":1}},"ScheduleVDA":{"c":{"ScheduleVDADtls":{"r":1,"a":1,"c":{"DateofAcquisition":1,"DateofTransfer":1,"HeadUndIncTaxed":1,"AcquisitionCost":1,"ConsidReceived":1,"IncomeFromVDA":1}},"TotIncCapGain":1}},"ScheduleOS":{"c":{"IncOthThanOwnRaceHorse":{"c":{"GrossIncChrgblTaxAtAppRate":1,"DividendGross":1,"InterestGross":1,"IntrstFrmSavingBank":1,"IntrstFrmTermDeposit":1,"IntrstFrmIncmTaxRefund":1,"NatofPassThrghIncome":1,"IntrstFrmOthers":1,"RentFromMachPlantBldgs":1,"Tot562x":1,"Aggrtvaluewithoutcons562x":1,"Immovpropwithoutcons562x":1,"Immovpropinadeqcons562x":1,"Anyotherpropwithoutcons562x":1,"Anyotherpropinadeqcons562x":1,"FamilyPension":1,"IncomeNotified89AOS":1,"IncomeNotified89ATypeOS":{"a":1,"c":{"NOT89ACountrycode":1,"NOT89AAmount":1}},"AnyOtherIncome":1,"OthersInc":{"c":{"OthersIncDtls":{"a":1,"c":{"OthNatOfInc":1,"OthAmount":1}}}},"IncChargeableSpecialRates":1,"LtryPzzlChrgblUs115BB":1,"IncChrgblUs115BBE":1,"CashCreditsUs68":1,"UnExplndInvstmntsUs69":1,"UnExplndMoneyUs69A":1,"UnDsclsdInvstmntsUs69B":1,"UnExplndExpndtrUs69C":1,"AmtBrwdRepaidOnHundiUs69D":1,"TaxAccumulatedBalRecPF":{"r":1,"c":{"TaxAccmltdBalRecPFDtls":{"a":1,"c":{"AssessmentYear":1,"IncomeBenefit":1,"TaxBenefit":1}},"TotalIncomeBenefit":1,"TotalTaxBenefit":1}},"OthersGross":1,"OthersGrossDtls":{"a":1,"c":{"SourceDescription":1}},"PassThrIncOSChrgblSplRate":1,"PTIOthersGrossDtls":{"a":1,"c":{"SourceDescription":1}},"IncChargblSplRateOS":{"c":{"TotalAmtTaxUsDTAASchOs":1,"NRIOsDTAA":{"c":{"NRIDTAADtlsSchOS":{"a":1,"c":{"DTAAamt":1,"NatureOfIncome":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"ItemNoincl":1,"RateAsPerITAct":1}}}}}},"Deductions":{"r":1,"c":{"Expenses":1,"DeductionUs57iia":1,"Depreciation":1,"TotDeductions":1}},"BalanceNoRaceHorse":1}},"IncFromOwnHorse":{"c":{"Receipts":1,"DeductSec57":1,"BalanceOwnRaceHorse":1}},"IncChargeable":1,"IncFrmLottery":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"IncFrmOnGames":{"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115BBDA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115BBDAaiii":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115A1ai":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115A1aA":{"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115AC":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115ACA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115AD1i":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendDTAA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"NOT89A":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}}}},"ScheduleCYLA":{"r":1,"c":{"Salary":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"HP":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCG20Per":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCG30Per":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCGAppRate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCGDTAARate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"LTCG12_5Per":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"LTCGDTAARate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"OthSrcExclRaceHorse":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"OthSrcRaceHorse":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"IncOSDTAA":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"TotalCurYr":{"r":1,"c":{"TotHPlossCurYr":1,"TotOthSrcLossNoRaceHorse":1}},"TotalLossSetOff":{"r":1,"c":{"TotHPlossCurYrSetoff":1,"TotOthSrcLossNoRaceHorseSetoff":1}},"LossRemAftSetOff":{"r":1,"c":{"BalHPlossCurYrAftSetoff":1,"BalOthSrcLossNoRaceHorseAftSetoff":1}}}},"ScheduleBFLA":{"r":1,"c":{"Salary":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"HP":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCG20Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCG30Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCGAppRate":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCGDTAARate":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"LTCG12_5Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"LTCGDTAARate":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"OthSrcExclRaceHorse":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"OthSrcRaceHorse":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"IncOSDTAA":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"TotalBFLossSetOff":{"r":1,"c":{"TotBFLossSetoff":1}},"IncomeOfCurrYrAftCYLABFLA":1}},"ScheduleCFL":{"c":{"LossCFFromPrev8thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev7thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev6thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev5thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev4thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"TotalHPPTILossCF":1}}}},"LossCFFromPrev3rdYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"TotalHPPTILossCF":1}}}},"LossCFFromPrev2ndYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"TotalHPPTILossCF":1}}}},"LossCFFromPrevYrToAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"TotalHPPTILossCF":1}}}},"TotalOfBFLossesEarlierYrs":{"r":1,"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1}}}},"AdjTotBFLossInBFLA":{"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1}}}},"CurrentAYloss":{"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1}}}},"TotalLossCFSummary":{"r":1,"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1}}}}}},"ScheduleVIA":{"c":{"UsrDeductUndChapVIA":{"r":1,"c":{"PensionContribution80CCC":{"a":1,"c":{"TypeofIdentifier":1,"NameofIdentifier":1,"Amount":1}}}},"DeductUndChapVIA":{"r":1,"c":{"Section80D":1,"Section80G":1,"Section80GGA":1,"TotalChapVIADeductions":1}}}},"Schedule80C":{"c":{"Schedule80CDtls":{"r":1,"a":1,"c":{"Amount":1,"IdentificationNo":1}},"TotalAmt":1}},"Schedule80D":{"c":{"Sec80DSelfFamSrCtznHealth":{"c":{"SelfAndFamily":1,"Sec80DSelfFamHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"SelfAndFamilySeniorCitizen":1,"Sec80DSelfFamSrCtznHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"Parents":1,"Sec80DParentsHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"ParentsSeniorCitizen":1,"Sec80DParentsSrCtznHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"EligibleAmountOfDedn":1}}}},"Schedule80G":{"c":{"Don100Percent":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon100PercentCash":1,"TotDon100PercentOtherMode":1,"TotDon100Percent":1,"TotEligibleDon100Percent":1}},"Don50PercentNoApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon50PercentNoApprReqdCash":1,"TotDon50PercentNoApprReqdOtherMode":1,"TotDon50PercentNoApprReqd":1,"TotEligibleDon50Percent":1}},"Don100PercentApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon100PercentApprReqdCash":1,"TotDon100PercentApprReqdOtherMode":1,"TotDon100PercentApprReqd":1,"TotEligibleDon100PercentApprReqd":1}},"Don50PercentApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon50PercentApprReqdCash":1,"TotDon50PercentApprReqdOtherMode":1,"TotDon50PercentApprReqd":1,"TotEligibleDon50PercentApprReqd":1}},"TotalDonationsUs80GCash":1,"TotalDonationsUs80GOtherMode":1,"TotalDonationsUs80G":1,"TotalEligibleDonationsUs80G":1}},"Schedule80GGC":{"c":{"Schedule80GGCDetails":{"a":1,"c":{"DonationDate":1,"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotalDonationAmtCash80GGC":1,"TotalDonationAmtOtherMode80GGC":1,"TotalDonationsUs80GGC":1,"TotalEligibleDonationAmt80GGC":1}},"Schedule80DD":{"c":{"NatureOfDisability":1,"TypeOfDisability":1,"DeductionAmount":1,"DependentType":1}},"Schedule80U":{"c":{"NatureOfDisability":1,"TypeOfDisability":1,"DeductionAmount":1}},"Schedule80E":{"c":{"Schedule80EDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80E":1}},"TotalInterest80E":1}},"Schedule80EE":{"c":{"Schedule80EEDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80EE":1}},"TotalInterest80EE":1}},"Schedule80EEA":{"c":{"PropStmpDtyVal":1,"Schedule80EEADtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80EEA":1}},"TotalInterest80EEA":1}},"Schedule80EEB":{"c":{"Schedule80EEBDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"VehicleRegNo":1,"Interest80EEB":1}},"TotalInterest80EEB":1}},"Schedule80GGA":{"c":{"DonationDtlsSciRsrchRuralDev":{"a":1,"c":{"RelevantClauseUndrDedClaimed":1,"NameOfDonee":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DoneePAN":1,"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotalDonationAmtCash80GGA":1,"TotalDonationAmtOtherMode80GGA":1,"TotalDonationsUs80GGA":1,"TotalEligibleDonationAmt80GGA":1}},"ScheduleAMT":{"c":{"TotalIncItemPartBTI":1,"DeductionClaimUndrAnySec":1,"AdjustedUnderSec115JC":1,"TaxPayableUnderSec115JC":1}},"ScheduleAMTC":{"c":{"TaxSection115JC":1,"TaxOthProvisions":1,"AmtTaxCreditAvailable":1,"ScheduleAMTCDtls":{"a":1,"c":{"AssYr":1,"Gross":1,"AmtCreditSetOfEy":1,"AmtCreditBalBroughtFwd":1,"AmtCreditUtilized":1,"BalAmtCreditCarryFwd":1}},"CurrYrAmtCreditFwd":1,"CurrYrCreditCarryFwd":1,"TotAMTGross":1,"TotSetOffEys":1,"TotBalBF":1,"TotBalAMTCreditCF":1,"TaxSection115JD":1,"AmtLiabilityAvailable":1}},"ScheduleSPI":{"c":{"SpecifiedPerson":{"a":1,"c":{"SpecifiedPersonName":1,"ReltnShip":1,"AmtIncluded":1,"HeadIncIncluded":1}}}},"ScheduleSI":{"c":{"SplCodeRateTax":{"a":1,"c":{"SecCode":1,"SplRatePercent":1,"SplRateInc":1,"SplRateIncTax":1}},"TotSplRateInc":1,"TotSplRateIncTax":1}},"ScheduleEI":{"c":{"NetAgriIncOrOthrIncRule7":1,"ExcNetAgriInc":{"c":{"ExcNetAgriIncDtls":{"a":1,"c":{"NameOfDistrict":1,"PinCode":1,"MeasurementOfLand":1,"AgriLandOwnedFlag":1,"AgriLandIrrigatedFlag":1}}}},"OthersInc":{"c":{"OthersIncDtls":{"a":1,"c":{"OthAmount":1}}}},"Others":1,"IncNotChrgblAsPerDTAA":{"c":{"IncNotChrgblAsPerDTAADtls":{"a":1,"c":{"AmountOfIncome":1,"NatureOfIncome":1,"CountryName":1,"CountryCodeExcludingIndia":1,"ArticleOfDTAA":1,"HeadOfIncome":1,"TRCFlag":1}}}},"IncNotChrgblToTax":1,"TotalExemptInc":1}},"SchedulePTI":{"c":{"SchedulePTIDtls":{"a":1,"c":{"InvstmntCvrdUs115UA115UB":1,"BusinessName":1,"BusinessPAN":1,"IncFromHP":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"CapitalGainsPTI":{"r":1,"c":{"ShortTermCG":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"STCG_Sec111A":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"STCG_Others":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"LongTermCG":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"LTCG_Sec112A":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"LTCG_Others":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}}}},"IncClmdPTI":{"r":1,"c":{"TotalSec23FBB":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"Sec23FBB":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"SecBIncExmptDtl":{"c":{"SectionCode":1,"SecBCIncExmptDtl":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}}}},"SecCIncExmptDtl":{"c":{"SectionCode":1,"SecBCIncExmptDtl":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}}}}}},"IncOthSrc":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"OS_Dividend":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"OS_Others":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}}}}}},"ScheduleFSI":{"c":{"ScheduleFSIDtls":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"TaxIdentificationNo":1,"IncFromSal":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"IncFromHP":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"IncCapGain":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"IncOthSrc":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}},"TotalCountryWise":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1}}}}}},"ScheduleTR1":{"c":{"ScheduleTR":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"TaxIdentificationNo":1,"TaxPaidOutsideIndia":1,"TaxReliefOutsideIndia":1}},"TotalTaxPaidOutsideIndia":1,"TotalTaxReliefOutsideIndia":1,"TaxReliefOutsideIndiaDTAA":1,"TaxReliefOutsideIndiaNotDTAA":1}},"ScheduleFA":{"c":{"DetailsForiegnBank":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"Bankname":1,"AddressOfBank":1,"ZipCode":1,"ForeignAccountNumber":1,"OwnerStatus":1,"AccOpenDate":1,"PeakBalanceDuringYear":1,"ClosingBalance":1,"IntrstAccured":1}},"DtlsForeignCustodialAcc":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"FinancialInstName":1,"FinancialInstAddress":1,"ZipCode":1,"AccountNumber":1,"Status":1,"AccOpenDate":1,"PeakBalanceDuringPeriod":1,"ClosingBalance":1,"GrossAmtPaidCredited":1,"NatureOfAmount":1}},"DtlsForeignEquityDebtInterest":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"NameOfEntity":1,"AddressOfEntity":1,"ZipCode":1,"NatureOfEntity":1,"InterestAcquiringDate":1,"InitialValOfInvstmnt":1,"PeakBalanceDuringPeriod":1,"ClosingBalance":1,"TotGrossAmtPaidCredited":1,"TotGrossProceeds":1}},"DtlsForeignCashValueInsurance":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"FinancialInstName":1,"FinancialInstAddress":1,"ZipCode":1,"ContractDate":1,"CashValOrSurrenderVal":1,"TotGrossAmtPaidCredited":1}},"DetailsFinancialInterest":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfEntity":1,"AddressOfEntity":1,"NatureOfInt":1,"DateHeld":1,"TotalInvestment":1,"IncFromInt":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsImmovableProperty":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"Ownership":1,"DateOfAcq":1,"TotalInvestment":1,"IncDrvProperty":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsOthAssets":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NatureOfAsset":1,"Ownership":1,"DateOfAcq":1,"TotalInvestment":1,"IncDrvAsset":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsOfAccntsHvngSigningAuth":{"a":1,"c":{"NameOfInstitution":1,"AddressOfInstitution":1,"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameMentionedInAccnt":1,"InstitutionAccountNumber":1,"PeakBalanceOrInvestment":1,"IncAccuredTaxFlag":1}},"DetailsOfTrustOutIndiaTrustee":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfTrust":1,"AddressOfTrust":1,"NameOfOtherTrustees":1,"AddressOfOtherTrustees":1,"NameOfSettlor":1,"AddressOfSettlor":1,"NameOfBeneficiaries":1,"AddressOfBeneficiaries":1,"DateHeld":1,"IncDrvTaxFlag":1}},"DetailsOfOthSourcesIncOutsideIndia":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfPerson":1,"AddressOfPerson":1,"NatureOfInc":1,"IncDrvTaxFlag":1}}}},"Schedule5A2014":{"c":{"NameOfSpouse":1,"PANOfSpouse":1,"HPHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"CapGainHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"OtherSourcesHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"TotalHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}}}},"ScheduleAL":{"c":{"ImmovableDetails":{"a":1,"c":{"Description":1,"AddressAL":{"r":1,"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1}},"Amount":1}},"MovableAsset":{"r":1,"c":{"DepositsInBank":1,"SharesAndSecurities":1,"InsurancePolicies":1,"LoansAndAdvancesGiven":1,"CashInHand":1,"JewelleryBullionEtc":1,"ArchCollDrawPaintSulpArt":1,"VehiclYachtsBoatsAircrafts":1}},"LiabilityInRelatAssets":1}},"PartB-TI":{"r":1,"c":{"Salaries":1,"IncomeFromHP":1,"CapGain":{"r":1,"c":{"ShortTerm":{"r":1,"c":{"ShortTerm20Per":1,"ShortTerm30Per":1,"ShortTermAppRate":1,"ShortTermSplRateDTAA":1,"TotalShortTerm":1}},"LongTerm":{"r":1,"c":{"LongTerm12_5Per":1,"LongTermSplRateDTAA":1,"TotalLongTerm":1}},"ShortTermLongTermTotal":1,"CapGains30Per115BBH":1,"TotalCapGains":1}},"IncFromOS":{"r":1,"c":{"OtherSrcThanOwnRaceHorse":1,"IncChargblSplRate":1,"FromOwnRaceHorse":1,"TotIncFromOS":1}},"TotalTI":1,"CurrentYearLoss":1,"BalanceAfterSetoffLosses":1,"BroughtFwdLossesSetoff":1,"GrossTotalIncome":1,"IncChargeTaxSplRate111A112":1,"DeductionsUnderScheduleVIA":1,"TotalIncome":1,"IncChargeableTaxSplRates":1,"NetAgricultureIncomeOrOtherIncomeForRate":1,"AggregateIncome":1,"LossesOfCurrentYearCarriedFwd":1,"DeemedIncomeUs115JC":1}},"PartB_TTI":{"r":1,"c":{"TaxPayDeemedTotIncUs115JC":1,"Surcharge":1,"HealthEduCess":1,"TotalTaxPayablDeemedTotInc":1,"ComputationOfTaxLiability":{"r":1,"c":{"TaxPayableOnTI":{"r":1,"c":{"TaxAtNormalRatesOnAggrInc":1,"TaxAtSpecialRates":1,"RebateOnAgriInc":1,"TaxPayableOnTotInc":1}},"Rebate87A":1,"TaxPayableOnRebate":1,"Surcharge25ofSI":1,"SurchargeOnAboveCrore":1,"Surcharge25ofSIBeforeMarginal":1,"SurchargeOnAboveCroreBeforeMarginal":1,"TotalSurcharge":1,"EducationCess":1,"GrossTaxLiability":1,"GrossTaxPayable":1,"GrossTaxPay":{"c":{"TaxInc17":1,"TaxDeferred17":1,"TaxDeferredPayableCY":1}},"CreditUS115JD":1,"TaxPayAfterCreditUs115JD":1,"TaxRelief":{"c":{"TotTaxRelief":1}},"NetTaxLiability":1,"IntrstPay":{"r":1,"c":{"IntrstPayUs234A":1,"IntrstPayUs234B":1,"IntrstPayUs234C":1,"LateFilingFee234F":1,"TotalIntrstPay":1}},"AggregateTaxInterestLiability":1}},"TaxPaid":{"r":1,"c":{"TaxesPaid":{"r":1,"c":{"AdvanceTax":1,"TDS":1,"TCS":1,"SelfAssessmentTax":1,"TotalTaxesPaid":1}}}},"Refund":{"r":1,"c":{"RefundDue":1,"BankAccountDtls":{"r":1,"c":{"BankDtlsFlag":1,"AddtnlBankDetails":{"a":1,"c":{"IFSCCode":1,"BankName":1,"BankAccountNo":1,"AccountType":1,"UseForRefund":1}},"ForeignBankDetails":{"a":1,"c":{"SWIFTCode":1,"BankName":1,"IBAN":1,"CountryCode":1}}}}}},"AssetOutIndiaFlag":1}},"ScheduleIT":{"c":{"TaxPayment":{"a":1,"c":{"BSRCode":1,"DateDep":1,"SrlNoOfChaln":1,"Amt":1}},"TotalTaxPayments":1}},"ScheduleTDS1":{"c":{"TDSonSalary":{"a":1,"c":{"EmployerOrDeductorOrCollectDetl":{"r":1,"c":{"TAN":1,"EmployerOrDeductorOrCollecterName":1}},"IncChrgSal":1,"TotalTDSSal":1}},"TotalTDSonSalaries":1}},"ScheduleTDS2":{"c":{"TDSOthThanSalaryDtls":{"a":1,"c":{"TDSCreditName":1,"TANOfDeductor":1,"TDSSection":1,"TaxDeductCreditDtls":{"r":1,"c":{"TaxClaimedOwnHands":1}},"AmtCarriedFwd":1}},"TotalTDSonOthThanSals":1}},"ScheduleTDS3":{"c":{"TDS3onOthThanSalDtls":{"a":1,"c":{"TDSCreditName":1,"PANOfBuyerTenant":1,"TDSSection":1,"TaxDeductCreditDtls":{"r":1,"c":{"TaxClaimedOwnHands":1}},"AmtCarriedFwd":1}},"TotalTDS3OnOthThanSal":1}},"ScheduleTCS":{"c":{"TCS":{"a":1,"c":{"TCSCreditOwner":1,"EmployerOrDeductorOrCollectTAN":1}},"TotalSchTCS":1}},"Verification":{"r":1,"c":{"Declaration":{"r":1,"c":{"AssesseeVerName":1,"FatherName":1,"AssesseeVerPAN":1}},"Capacity":1}},"TaxReturnPreparer":{"c":{"IdentificationNoOfTRP":1,"NameOfTRP":1,"ReImbFrmGov":1}},"ScheduleESOP":{"c":{"PanofStartUp":1,"DPIITRegNo":1,"ScheduleESOP2122_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2223_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2324_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2425_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2526_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2627_Type":{"c":{"AssessmentYear":1}},"TotalTaxAttributedAmt":1}}}}}}}}') as TreeBranch;

/* ── Labels / hints ────────────────────────────────────────────────────────── */

const WORDS: Record<string, string> = {
  PAN: 'PAN of the assessee', DOB: 'Date of birth', AY: 'Assessment year',
  SurNameOrOrgName: 'Surname / last name', ResidenceNo: 'Flat / door / block no.',
  LocalityOrArea: 'Locality / area', CityOrTownOrDistrict: 'City / town / district',
  StateCode: 'State', CountryCode: 'Country', CountryCodeMobile: 'Mobile country code',
  MobileNo: 'Mobile number', EmailAddress: 'E-mail address', SecondaryAdd: 'Secondary address block',
  Status: 'Status (Individual / HUF)', ReturnFileSec: 'Section under which return is filed',
  OptOutNewTaxRegime: 'Opting out of new tax regime (Y/N)', SeventhProvisio139: 'Filing under 7th proviso to 139(1) (Y/N)',
  ResidentialStatus: 'Residential status', HeldUnlistedEqShrPrYrFlg: 'Held unlisted equity shares flag',
  FiiFpiFlag: 'FII/FPI flag', ItrFilingDueDate: 'ITR filing due date',
  AssesseeVerName: 'Name of person verifying', FatherName: "Father's name",
  AssesseeVerPAN: 'PAN of person verifying', Capacity: 'Capacity of person verifying',
  BankDtlsFlag: 'Bank account details flag', RefundDue: 'Refund due',
  JSONCreationDate: 'JSON creation date', SWVersionNo: 'Software version number',
  SWCreatedBy: 'Software created by (ERI id)', JSONCreatedBy: 'JSON created by (ERI id)',
  IntermediaryCity: 'Intermediary city', Digest: 'Digest', FormName: 'Form name',
  Description: 'Form description', AssessmentYear: 'Assessment year', SchemaVer: 'Schema version', FormVer: 'Form version',
};

const SECTION_HINT: Record<string, string> = {
  CreationInfo: 'Generated automatically on JSON export',
  Form_ITR2: 'Generated automatically on JSON export',
  PersonalInfo: 'Part A – General › Personal Information',
  FilingStatus: 'Part A – General › Filing Status',
  ScheduleS: 'Schedule S – Salary',
  ScheduleHP: 'Schedule HP – House Property',
  ScheduleCGFor23: 'Schedule CG – Capital Gains',
  Schedule112A: 'Schedule 112A – Equity LTCG (STT paid)',
  Schedule115AD: 'Schedule 115AD(1)(b)(iii) proviso',
  ScheduleVDA: 'Schedule VDA – Virtual Digital Assets',
  ScheduleOS: 'Schedule OS – Other Sources',
  ScheduleCYLA: 'Schedule CYLA – Current-year loss adjustment',
  ScheduleBFLA: 'Schedule BFLA – Brought-forward loss adjustment',
  ScheduleCFL: 'Schedule CFL – Carried-forward losses',
  ScheduleVIA: 'Schedule VI-A – Deductions',
  ScheduleSI: 'Schedule SI – Special-rate income',
  ScheduleEI: 'Schedule EI – Exempt income',
  SchedulePTI: 'Schedule PTI – Pass-through income',
  ScheduleFSI: 'Schedule FSI – Foreign-source income',
  ScheduleTR1: 'Schedule TR – Tax relief',
  ScheduleFA: 'Schedule FA – Foreign assets',
  Schedule5A2014: 'Schedule 5A – Portuguese Civil Code',
  ScheduleAL: 'Schedule AL – Assets & Liabilities',
  'PartB-TI': 'Part B-TI – Computation of total income',
  PartB_TTI: 'Part B-TTI – Tax liability computation',
  ScheduleIT: 'Tax Paid › Advance / Self-assessment tax',
  ScheduleTDS1: 'Tax Paid › TDS on salary',
  ScheduleTDS2: 'Tax Paid › TDS other than salary (26AS)',
  ScheduleTDS3: 'Tax Paid › TDS (Form 26QB/26QC)',
  ScheduleTCS: 'Tax Paid › TCS',
  Verification: 'Verification',
  ScheduleESOP: 'Schedule – Tax deferred on ESOP',
  ScheduleAMT: 'Schedule AMT', ScheduleAMTC: 'Schedule AMTC', ScheduleSPI: 'Schedule SPI',
};

function humanize(seg: string): string {
  if (WORDS[seg]) return WORDS[seg];
  return seg
    .replace(/\[\d+\]/g, (m) => ` (row ${Number(m.slice(1, -1)) + 1})`)
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function mkMissing(path: string): MissingField {
  const segs = path.split('.').slice(2); // drop "ITR.ITR2"
  const label = segs.slice(-3).map(humanize).join(' › ') || humanize(path);
  const first = (segs[0] ?? '').replace(/\[\d+\]$/, '');
  const second = (segs[1] ?? '').replace(/\[\d+\]$/, '');
  const hint = SECTION_HINT[first === 'PartA_GEN1' ? second : first];
  return hint ? { path, label, hint } : { path, label };
}

/* ── Tree walker ───────────────────────────────────────────────────────────── */

function walkBranch(obj: unknown, branch: TreeBranch, path: string, missing: MissingField[], depth: number): void {
  if (!branch.c || depth > 40 || missing.length > 500) return;
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
      if (isEmpty(v)) { if (required) missing.push(mkMissing(p)); continue; }
      if (Array.isArray(v) && child.c) {
        for (let i = 0; i < v.length; i++) walkBranch(v[i], { c: child.c }, `${p}[${i}]`, missing, depth + 1);
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
/** All operands present → compare with ±1 rounding tolerance. */
function eqTol(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined || b === undefined) return true; // absence handled by the tree
  return Math.abs(a - b) <= 1;
}
function filled(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  return true;
}
function asArr(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }

interface RuleCtx {
  r2: unknown; // the ITR.ITR2 object
  errors: MandatoryIssue[];
  warnings: MandatoryIssue[];
}
function err(ctx: RuleCtx, rule: string, path: string, msg: string): void {
  ctx.errors.push({ path, msg, rule });
}
function warn(ctx: RuleCtx, rule: string | undefined, path: string, msg: string): void {
  ctx.warnings.push(rule ? { path, msg, rule } : { path, msg });
}

const P = 'ITR.ITR2'; // payload prefix for issue paths
const g = (ctx: RuleCtx, rel: string): unknown => at(ctx.r2, rel);

function applyCategoryARules(ctx: RuleCtx): void {
  const FS = 'PartA_GEN1.FilingStatus';
  const PI = 'PartA_GEN1.PersonalInfo';
  const status = g(ctx, `${PI}.Status`);                 // 'I' | 'H'
  const resStatus = g(ctx, `${FS}.ResidentialStatus`);   // 'RES' | 'NRI' | 'NOR'
  const optOut = g(ctx, `${FS}.OptOutNewTaxRegime`);     // 'Y' = old regime, 'N' = new regime
  const newRegime = optOut === 'N';
  const oldRegime = optOut === 'Y';
  const isHUF = status === 'H';
  const isNRI = resStatus === 'NRI';
  const isResident = resStatus === 'RES' || resStatus === 'NOR';

  /* — Identity / schema-critical field formats (upload rejects on violation) — */
  const pan = g(ctx, `${PI}.PAN`);
  if (typeof pan === 'string' && pan.trim() !== '' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))
    err(ctx, 'SCHEMA-PAN', `${P}.${PI}.PAN`, `PAN "${pan}" is not a valid PAN (AAAAA9999A).`);
  const formName = g(ctx, 'Form_ITR2.FormName');
  if (typeof formName === 'string' && formName !== 'ITR-2')
    err(ctx, 'SCHEMA-FORM', `${P}.Form_ITR2.FormName`, `FormName must be "ITR-2" (got "${formName}").`);
  const ayVal = g(ctx, 'Form_ITR2.AssessmentYear');
  if (typeof ayVal === 'string' && ayVal !== '2026')
    err(ctx, 'SCHEMA-AY', `${P}.Form_ITR2.AssessmentYear`, `AssessmentYear must be "2026" for AY 2026-27 (got "${ayVal}").`);
  const schemaVer = g(ctx, 'Form_ITR2.SchemaVer');
  if (typeof schemaVer === 'string' && schemaVer !== 'Ver1.0')
    err(ctx, 'SCHEMA-VER', `${P}.Form_ITR2.SchemaVer`, `SchemaVer must be "Ver1.0" (got "${schemaVer}").`);
  if (status !== undefined && status !== 'I' && status !== 'H')
    err(ctx, 'SCHEMA-STATUS', `${P}.${PI}.Status`, 'Status must be "I" (Individual) or "H" (HUF).');
  if (resStatus !== undefined && !['RES', 'NRI', 'NOR'].includes(String(resStatus)))
    err(ctx, 'SCHEMA-RES', `${P}.${FS}.ResidentialStatus`, 'ResidentialStatus must be RES / NRI / NOR.');
  const retSec = num(g(ctx, `${FS}.ReturnFileSec`));
  if (retSec !== undefined && ![11, 12, 13, 14, 16, 17, 18, 19, 20].includes(retSec))
    err(ctx, 'SCHEMA-SEC', `${P}.${FS}.ReturnFileSec`, `ReturnFileSec ${retSec} is not a valid filing-section code.`);
  const dob = g(ctx, `${PI}.DOB`);
  if (typeof dob === 'string' && dob !== '' && !(/^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dob) && dob <= '2026-03-31'))
    err(ctx, 'SCHEMA-DOB', `${P}.${PI}.DOB`, 'Date of birth must be YYYY-MM-DD and on or before 2026-03-31.');
  const capacity = g(ctx, 'Verification.Capacity');
  if (capacity !== undefined && !['S', 'R', 'K', 'A'].includes(String(capacity)))
    err(ctx, 'SCHEMA-CAP', `${P}.Verification.Capacity`, 'Verification capacity must be S / R / K / A.');
  const verPan = g(ctx, 'Verification.Declaration.AssesseeVerPAN');
  if (typeof verPan === 'string' && verPan.trim() !== '' && !/^[A-Z]{3}[P][A-Z][0-9]{4}[A-Z]$/.test(verPan))
    err(ctx, 'SCHEMA-VERPAN', `${P}.Verification.Declaration.AssesseeVerPAN`, 'PAN in Verification must be a valid personal PAN (4th character "P").');

  /* — Rule 1: valid mobile number — */
  const mob = g(ctx, `${PI}.Address.MobileNo`);
  if (mob !== undefined && !/^[1-9][0-9]{9}$/.test(String(mob)))
    err(ctx, 'A-1', `${P}.${PI}.Address.MobileNo`, 'Mobile number must be a valid 10-digit number.');

  /* — Part A GEN mandatory-if rules — */
  if (g(ctx, `${FS}.HeldUnlistedEqShrPrYrFlg`) === 'Y' && !filled(g(ctx, `${FS}.HeldUnlistedEqShrPrYr`)))
    err(ctx, 'A-5', `${P}.${FS}.HeldUnlistedEqShrPrYr`, 'Unlisted equity shares flag is "Yes" — details of unlisted equity shares must be filled.');
  if (g(ctx, `${FS}.PortugeseCC5A`) === 'Y' && !filled(g(ctx, 'Schedule5A2014')))
    err(ctx, 'A-6', `${P}.Schedule5A2014`, 'Governed by Portuguese Civil Code (5A) is "Yes" — Schedule 5A must be filled.');
  if (g(ctx, `${FS}.PortugeseCC5A`) === 'N' && filled(g(ctx, 'Schedule5A2014')))
    err(ctx, 'A-14', `${P}.Schedule5A2014`, 'Portuguese Civil Code (5A) is "No" — Schedule 5A must NOT be filled.');
  if (g(ctx, `${FS}.AsseseeRepFlg`) === 'Y' && !filled(g(ctx, `${FS}.AssesseeRep`)))
    err(ctx, 'A-7', `${P}.${FS}.AssesseeRep`, 'Return filed by representative assessee — representative details must be provided.');
  if (g(ctx, `${FS}.SeventhProvisio139`) === 'Y') {
    const any7 = filled(g(ctx, `${FS}.AmtSeventhProvisio139i`)) || filled(g(ctx, `${FS}.AmtSeventhProvisio139ii`))
      || filled(g(ctx, `${FS}.AmtSeventhProvisio139iii`)) || g(ctx, `${FS}.clauseiv7provisio139i`) === 'Y'
      || g(ctx, `${FS}.DepAmtAggAmtExcd1CrPrYrFlg`) === 'Y' || g(ctx, `${FS}.IncrExpAggAmt2LkTrvFrgnCntryFlg`) === 'Y'
      || g(ctx, `${FS}.IncrExpAggAmt1LkElctrctyPrYrFlg`) === 'Y';
    if (!any7)
      err(ctx, 'A-9', `${P}.${FS}.AmtSeventhProvisio139i`, 'Filing under 7th proviso to 139(1) — the respective condition flags/amounts must be filled.');
  }
  if (g(ctx, `${FS}.CompDirectorPrvYrFlg`) === 'Y' && !filled(g(ctx, `${FS}.CompDirectorPrvYr`)))
    err(ctx, 'A-10', `${P}.${FS}.CompDirectorPrvYr`, 'Director-in-a-company flag is "Yes" — directorship details must be filled.');
  if (g(ctx, `${FS}.clauseiv7provisio139i`) === 'Y' && !filled(g(ctx, `${FS}.clauseiv7provisio139iDtls`)))
    err(ctx, 'A-13', `${P}.${FS}.clauseiv7provisio139iDtls`, 'Clause (iv) of 7th proviso to 139(1) selected — the respective amounts must be filled.');
  if (filled(g(ctx, 'Schedule115AD.Schedule115ADDtls')) && g(ctx, `${FS}.FiiFpiFlag`) !== 'Y')
    err(ctx, 'A-15', `${P}.Schedule115AD`, 'Schedule 115AD(1)(b)(iii) proviso is filled — "Whether you are FII/FPI?" must be "Yes".');
  if (retSec !== undefined && [13, 14, 18, 20].includes(retSec)) {
    if (isEmpty(g(ctx, `${FS}.NoticeNo`)))
      err(ctx, 'A-16', `${P}.${FS}.NoticeNo`, 'Return filed in response to notice/order — unique number / DIN of the notice is mandatory.');
    if (isEmpty(g(ctx, `${FS}.NoticeDate`)))
      err(ctx, 'A-16', `${P}.${FS}.NoticeDate`, 'Return filed in response to notice/order — date of the notice/order is mandatory.');
  }
  if (retSec === 17) {
    if (isEmpty(g(ctx, `${FS}.ReceiptNo`)))
      warn(ctx, undefined, `${P}.${FS}.ReceiptNo`, 'Revised return u/s 139(5) — acknowledgement number of the original return should be provided.');
    if (isEmpty(g(ctx, `${FS}.OrigRetFiledDate`)))
      warn(ctx, undefined, `${P}.${FS}.OrigRetFiledDate`, 'Revised return u/s 139(5) — date of filing of the original return should be provided.');
  }
  if (isResident && g(ctx, `${FS}.FiiFpiFlag`) === 'Y')
    err(ctx, 'A-20', `${P}.${FS}.FiiFpiFlag`, 'Residents and not-ordinarily-residents cannot be FII/FPI.');
  if (status === 'I' && isResident && isEmpty(g(ctx, `${FS}.BenefitUs115HFlg`)))
    err(ctx, 'A-83', `${P}.${FS}.BenefitUs115HFlg`, 'Resident / RNOR individual — the 115H benefit question must be answered.');

  /* — Verification / representative — */
  if (capacity === 'R') {
    const rep = g(ctx, `${FS}.AssesseeRep`);
    if (!filled(rep) || isEmpty(at(rep, 'RepName')) || isEmpty(at(rep, 'RepEmailID')) || isEmpty(at(rep, 'RepMobileNo')))
      err(ctx, 'A-457', `${P}.${FS}.AssesseeRep`, 'Verification capacity is "Representative" — name, e-mail and contact number of the representative are mandatory in Part A General.');
  }

  /* — Schedule S — */
  const S = 'ScheduleS';
  if (filled(g(ctx, S))) {
    const profTax = num(g(ctx, `${S}.ProfessionalTaxUs16iii`));
    if (profTax !== undefined && profTax > 5000)
      err(ctx, 'A-37', `${P}.${S}.ProfessionalTaxUs16iii`, 'Professional tax u/s 16(iii) cannot exceed Rs. 5,000.');
    const stdDed = num(g(ctx, `${S}.DeductionUnderSection16ia`));
    const netSal = num(g(ctx, `${S}.NetSalary`));
    if (oldRegime && stdDed !== undefined && (stdDed > 50000 || (netSal !== undefined && stdDed > netSal + 1)))
      err(ctx, 'A-40', `${P}.${S}.DeductionUnderSection16ia`, 'Old regime: standard deduction u/s 16(ia) cannot exceed the lower of Rs. 50,000 or net salary.');
    if (newRegime && stdDed !== undefined && (stdDed > 75000 || (netSal !== undefined && stdDed > netSal + 1)))
      err(ctx, 'A-596', `${P}.${S}.DeductionUnderSection16ia`, 'New regime: standard deduction u/s 16(ia) cannot exceed the lower of Rs. 75,000 or net salary.');
    if (newRegime && n0(g(ctx, `${S}.EntertainmntalwncUs16ii`)) > 0)
      err(ctx, 'A-57', `${P}.${S}.EntertainmntalwncUs16ii`, 'New regime: entertainment allowance u/s 16(ii) cannot be claimed.');
    if (newRegime && n0(g(ctx, `${S}.ProfessionalTaxUs16iii`)) > 0)
      err(ctx, 'A-58', `${P}.${S}.ProfessionalTaxUs16iii`, 'New regime: professional tax u/s 16(iii) cannot be claimed.');
    if (isHUF && n0(g(ctx, `${S}.Increliefus89A`)) > 0)
      err(ctx, 'A-59', `${P}.${S}.Increliefus89A`, 'HUF cannot claim relief from taxation u/s 89A.');
  }
  if (isHUF && asArr(g(ctx, 'ScheduleTDS1.TDSonSalary')).length > 0)
    err(ctx, 'A-468', `${P}.ScheduleTDS1`, 'HUF cannot have TDS on salary (Schedule TDS1).');

  /* — Schedule HP — */
  const props = asArr(g(ctx, 'ScheduleHP.PropertyDetails'));
  let selfOccupied = 0;
  props.forEach((prop, i) => {
    const pp = `${P}.ScheduleHP.PropertyDetails[${i}]`;
    const letOut = at(prop, 'ifLetOut');
    const alv = num(at(prop, 'Rentdetails.AnnualLetableValue'));
    if (letOut === 'S') selfOccupied++;
    if ((letOut === 'L' || letOut === 'D') && !(alv !== undefined && alv > 0))
      err(ctx, 'A-74', `${pp}.Rentdetails.AnnualLetableValue`, 'Let-out / deemed-let-out property must have gross rent / lettable value more than zero.');
    if (alv !== undefined && !(alv > 0) && n0(at(prop, 'Rentdetails.LocalTaxes')) > 0)
      err(ctx, 'A-71', `${pp}.Rentdetails.LocalTaxes`, 'Municipal tax is not allowed where gross rent / lettable value is zero.');
    const coOwned = at(prop, 'PropCoOwnedFlg');
    const share = num(at(prop, 'AsseseeShareProperty'));
    if (coOwned === 'YES') {
      if (share !== undefined && share >= 100)
        err(ctx, 'A-751', `${pp}.AsseseeShareProperty`, "Co-owned property: assessee's share must be less than 100%.");
      if (asArr(at(prop, 'CoOwners')).length === 0)
        err(ctx, 'A-549', `${pp}.CoOwners`, 'Co-owned property: percentage share, name and PAN of co-owner(s) are mandatory.');
    }
    if (coOwned === 'NO' && share !== undefined && share !== 100)
      err(ctx, 'A-753', `${pp}.AsseseeShareProperty`, "Property not co-owned: assessee's share must be 100%.");
    const intCap = n0(at(prop, 'Rentdetails.IntOnBorwCap'));
    if (letOut === 'S' && oldRegime && intCap > 200000)
      err(ctx, 'A-72', `${pp}.Rentdetails.IntOnBorwCap`, 'Old regime: interest on borrowed capital for self-occupied property cannot exceed Rs. 2,00,000.');
    if (letOut === 'S' && newRegime && intCap > 0)
      err(ctx, 'A-81', `${pp}.Rentdetails.IntOnBorwCap`, 'New regime: interest on borrowed capital cannot be claimed for self-occupied property.');
    const balAlv = num(at(prop, 'Rentdetails.AnnualOfPropOwned'));
    const thirty = num(at(prop, 'Rentdetails.ThirtyPercentOfBalance'));
    if (balAlv !== undefined && thirty !== undefined && Math.abs(thirty - Math.round(balAlv * 0.3)) > 1)
      err(ctx, 'A-67', `${pp}.Rentdetails.ThirtyPercentOfBalance`, 'Standard deduction on house property must equal 30% of the annual value.');
  });
  if (selfOccupied > 2)
    err(ctx, 'A-80', `${P}.ScheduleHP.PropertyDetails`, 'Not more than two house properties can be claimed as self-occupied.');

  /* — Schedule VDA — */
  asArr(g(ctx, 'ScheduleVDA.ScheduleVDADtls')).forEach((row, i) => {
    for (const f of ['DateofAcquisition', 'DateofTransfer'] as const) {
      const d = at(row, f);
      if (typeof d === 'string' && d > '2026-03-31')
        err(ctx, 'A-749', `${P}.ScheduleVDA.ScheduleVDADtls[${i}].${f}`, 'VDA date of acquisition/transfer cannot be after 31 March 2026.');
    }
  });

  /* — Chapter VI-A / deduction schedules — */
  const VIA = 'ScheduleVIA.DeductUndChapVIA';
  const via = (f: string): number => n0(g(ctx, `${VIA}.${f}`));
  const viaPresent = filled(g(ctx, 'ScheduleVIA'));
  if (newRegime && viaPresent) {
    const blocked: Array<[string, string]> = [
      ['Section80C', '80C'], ['Section80CCC', '80CCC'], ['Section80CCDEmployeeOrSE', '80CCD(1)'],
      ['Section80CCD1B', '80CCD(1B)'], ['Section80D', '80D'], ['Section80DD', '80DD'], ['Section80DDB', '80DDB'],
      ['Section80E', '80E'], ['Section80EE', '80EE'], ['Section80EEA', '80EEA'], ['Section80EEB', '80EEB'],
      ['Section80G', '80G'], ['Section80GG', '80GG'], ['Section80GGA', '80GGA'], ['Section80GGC', '80GGC'],
      ['Section80QQB', '80QQB'], ['Section80RRB', '80RRB'], ['Section80TTA', '80TTA'], ['Section80TTB', '80TTB'],
      ['Section80U', '80U'],
    ];
    for (const [f, sec] of blocked) {
      if (via(f) > 0)
        err(ctx, 'A-342', `${P}.${VIA}.${f}`, `New regime: deduction u/s ${sec} cannot be claimed.`);
    }
  }
  if (newRegime && filled(g(ctx, 'Schedule80G')))
    err(ctx, 'A-289', `${P}.Schedule80G`, 'Schedule 80G must be blank when the new tax regime is selected.');
  if (newRegime && filled(g(ctx, 'Schedule80GGA')))
    err(ctx, 'A-315', `${P}.Schedule80GGA`, 'Schedule 80GGA must be blank when the new tax regime is selected.');
  if (newRegime && filled(g(ctx, 'ScheduleAMT')))
    err(ctx, 'A-430', `${P}.ScheduleAMT`, 'Schedule AMT must be blank when the new tax regime is selected.');
  if (via('Section80D') > 0 && !filled(g(ctx, 'Schedule80D')))
    err(ctx, 'A-302', `${P}.Schedule80D`, 'Deduction u/s 80D claimed in Schedule VI-A — Schedule 80D must be filled.');
  if (via('Section80G') > 0 && !filled(g(ctx, 'Schedule80G')))
    err(ctx, 'A-288', `${P}.Schedule80G`, 'Deduction u/s 80G claimed in Schedule VI-A — Schedule 80G must be filled.');
  if (oldRegime && via('Section80GGA') > 0 && !filled(g(ctx, 'Schedule80GGA')))
    err(ctx, 'A-314', `${P}.Schedule80GGA`, 'Deduction u/s 80GGA claimed in Schedule VI-A — Schedule 80GGA must be filled.');
  if (via('Section80U') > 0 && !filled(g(ctx, 'Schedule80U')))
    err(ctx, 'A-362', `${P}.Schedule80U`, 'Deduction u/s 80U claimed in Schedule VI-A — Schedule 80U must be filled.');
  if (via('Section80DD') > 0 && !filled(g(ctx, 'Schedule80DD')))
    err(ctx, 'A-364', `${P}.Schedule80DD`, 'Deduction u/s 80DD claimed in Schedule VI-A — Schedule 80DD must be filled.');
  if (via('Section80C') + via('Section80CCC') + via('Section80CCDEmployeeOrSE') > 150000)
    err(ctx, 'A-346', `${P}.${VIA}.Section80C`, 'Sum of deductions u/s 80C, 80CCC and 80CCD(1) cannot exceed Rs. 1,50,000.');
  if (isHUF) {
    const hufBlocked: Array<[string, string, string]> = [
      ['Section80CCDEmployeeOrSE', '80CCD(1)', 'A-317'], ['Section80CCD1B', '80CCD(1B)', 'A-318'],
      ['Section80CCDEmployer', '80CCD(2)', 'A-319'], ['Section80E', '80E', 'A-320'],
      ['Section80EE', '80EE', 'A-321'], ['Section80U', '80U', 'A-324'],
      ['Section80EEA', '80EEA', 'A-325'], ['Section80EEB', '80EEB', 'A-326'],
    ];
    for (const [f, sec, rule] of hufBlocked) {
      if (via(f) > 0) err(ctx, rule, `${P}.${VIA}.${f}`, `Deduction u/s ${sec} is not allowed to HUF.`);
    }
    if (filled(g(ctx, 'Schedule80E')) || filled(g(ctx, 'Schedule80EE')) || filled(g(ctx, 'Schedule80EEA')) || filled(g(ctx, 'Schedule80EEB')))
      err(ctx, 'A-640', `${P}.Schedule80E`, 'HUF cannot fill Schedules 80E / 80EE / 80EEA / 80EEB.');
    if (filled(g(ctx, 'ScheduleESOP')))
      err(ctx, 'A-546', `${P}.ScheduleESOP`, 'HUF cannot fill Schedule Tax Deferred on ESOP.');
  }
  if (isNRI) {
    const nriBlocked: Array<[string, string, string]> = [
      ['Section80DD', '80DD', 'A-327'], ['Section80DDB', '80DDB', 'A-328'],
      ['Section80U', '80U', 'A-329'], ['Section80TTB', '80TTB', 'A-349'],
    ];
    for (const [f, sec, rule] of nriBlocked) {
      if (via(f) > 0) err(ctx, rule, `${P}.${VIA}.${f}`, `Deduction u/s ${sec} is not allowed to a non-resident.`);
    }
  }
  if (oldRegime && isResident && typeof dob === 'string' && dob !== '' && dob <= '1966-04-01' && via('Section80TTA') > 0)
    err(ctx, 'A-322', `${P}.${VIA}.Section80TTA`, 'Old regime: a resident senior citizen cannot claim deduction u/s 80TTA (use 80TTB).');
  const gti = num(g(ctx, 'PartB-TI.GrossTotalIncome'));
  const viaTotal = num(g(ctx, `${VIA}.TotalChapVIADeductions`));
  if (gti !== undefined && viaTotal !== undefined && viaTotal > gti + 1)
    err(ctx, 'A-330', `${P}.${VIA}.TotalChapVIADeductions`, 'Deductions under Chapter VI-A cannot be greater than Gross Total Income.');

  /* — TDS / TCS credit-of-other-person — */
  asArr(g(ctx, 'ScheduleTDS2.TDSOthThanSalaryDtls')).forEach((row, i) => {
    if (at(row, 'TDSCreditName') === 'O' && isEmpty(at(row, 'PANofOtherPerson')) && isEmpty(at(row, 'AadhaarOfOtherPerson')))
      err(ctx, 'A-469', `${P}.ScheduleTDS2.TDSOthThanSalaryDtls[${i}].PANofOtherPerson`, 'TDS credit relates to another person — PAN (or Aadhaar) of the other person must be provided.');
  });
  asArr(g(ctx, 'ScheduleTDS3.TDS3onOthThanSalDtls')).forEach((row, i) => {
    if (at(row, 'TDSCreditName') === 'O' && isEmpty(at(row, 'PANofOtherPerson')) && isEmpty(at(row, 'AadhaarOfOtherPerson')))
      err(ctx, 'A-469', `${P}.ScheduleTDS3.TDS3onOthThanSalDtls[${i}].PANofOtherPerson`, 'TDS credit relates to another person — PAN (or Aadhaar) of the other person must be provided.');
  });
  asArr(g(ctx, 'ScheduleTCS.TCS')).forEach((row, i) => {
    const owner = at(row, 'TCSCreditOwner');
    if (owner !== undefined && owner !== 'S' && isEmpty(at(row, 'PANOfSpouseOrOthrPrsn')))
      err(ctx, 'A-475', `${P}.ScheduleTCS.TCS[${i}].PANOfSpouseOrOthrPrsn`, 'TCS credit relates to another person — PAN of the other person must be provided.');
  });

  /* — Residential-status schedule applicability — */
  if (isNRI && filled(g(ctx, 'ScheduleFSI')))
    err(ctx, 'A-443', `${P}.ScheduleFSI`, 'Schedule FSI is not applicable when residential status is Non-Resident.');
  if (isNRI && filled(g(ctx, 'ScheduleTR1')))
    err(ctx, 'A-453', `${P}.ScheduleTR1`, 'Schedule TR is not applicable when residential status is Non-Resident.');
  if (g(ctx, 'PartB_TTI.AssetOutIndiaFlag') === 'YES' && !filled(g(ctx, 'ScheduleFA')))
    err(ctx, 'A-746', `${P}.ScheduleFA`, 'Foreign asset / signing authority flag is "Yes" — Schedule FA must be filled.');

  /* — Part B-TI arithmetic identities — */
  const TI = 'PartB-TI';
  const ti = (f: string): number | undefined => num(g(ctx, `${TI}.${f}`));
  const tiSum = (...fs: string[]): number | undefined => {
    let s = 0;
    for (const f of fs) { const v = ti(f); if (v === undefined) return undefined; s += v; }
    return s;
  };
  if (!eqTol(ti('CapGain.ShortTerm.TotalShortTerm'), tiSum('CapGain.ShortTerm.ShortTerm20Per', 'CapGain.ShortTerm.ShortTerm30Per', 'CapGain.ShortTerm.ShortTermAppRate', 'CapGain.ShortTerm.ShortTermSplRateDTAA')))
    err(ctx, 'A-488', `${P}.${TI}.CapGain.ShortTerm.TotalShortTerm`, 'Part B-TI: Total short-term capital gain must equal the sum of its rate-wise components.');
  if (!eqTol(ti('CapGain.LongTerm.TotalLongTerm'), tiSum('CapGain.LongTerm.LongTerm12_5Per', 'CapGain.LongTerm.LongTermSplRateDTAA')))
    err(ctx, 'A-489', `${P}.${TI}.CapGain.LongTerm.TotalLongTerm`, 'Part B-TI: Total long-term capital gain must equal the sum of its rate-wise components.');
  if (!eqTol(ti('CapGain.ShortTermLongTermTotal'), tiSum('CapGain.ShortTerm.TotalShortTerm', 'CapGain.LongTerm.TotalLongTerm')))
    err(ctx, 'A-490', `${P}.${TI}.CapGain.ShortTermLongTermTotal`, 'Part B-TI: Sum of short-term and long-term capital gains is inconsistent.');
  if (!eqTol(ti('CapGain.TotalCapGains'), tiSum('CapGain.ShortTermLongTermTotal', 'CapGain.CapGains30Per115BBH')))
    err(ctx, 'A-515', `${P}.${TI}.CapGain.TotalCapGains`, 'Part B-TI: Total capital gains must equal ST/LT total plus VDA gains u/s 115BBH.');
  if (!eqTol(ti('IncFromOS.TotIncFromOS'), tiSum('IncFromOS.OtherSrcThanOwnRaceHorse', 'IncFromOS.IncChargblSplRate', 'IncFromOS.FromOwnRaceHorse')))
    err(ctx, 'A-491', `${P}.${TI}.IncFromOS.TotIncFromOS`, 'Part B-TI: Total income from other sources must equal the sum of its components.');
  if (!eqTol(ti('TotalTI'), tiSum('Salaries', 'IncomeFromHP', 'CapGain.TotalCapGains', 'IncFromOS.TotIncFromOS')))
    err(ctx, 'A-492', `${P}.${TI}.TotalTI`, 'Part B-TI: Total of head-wise incomes must equal the sum of the individual heads.');
  const balAfterCyl = ti('BalanceAfterSetoffLosses'); const totalTI = ti('TotalTI'); const cyl = ti('CurrentYearLoss');
  if (balAfterCyl !== undefined && totalTI !== undefined && cyl !== undefined && !eqTol(balAfterCyl, totalTI - cyl))
    err(ctx, 'A-510', `${P}.${TI}.BalanceAfterSetoffLosses`, 'Part B-TI: Balance after set-off of current-year losses must equal Total minus current-year losses set off.');
  const bfl = ti('BroughtFwdLossesSetoff');
  if (gti !== undefined && balAfterCyl !== undefined && bfl !== undefined && !eqTol(gti, balAfterCyl - bfl))
    err(ctx, 'A-505', `${P}.${TI}.GrossTotalIncome`, 'Part B-TI: Gross Total Income must equal balance after current-year set-off minus brought-forward losses set off.');
  const totalIncome = ti('TotalIncome');
  const aggInc = ti('AggregateIncome'); const splInc = ti('IncChargeableTaxSplRates'); const agri = ti('NetAgricultureIncomeOrOtherIncomeForRate');
  if (aggInc !== undefined && totalIncome !== undefined && splInc !== undefined && agri !== undefined && !eqTol(aggInc, totalIncome - splInc + agri))
    err(ctx, 'A-512', `${P}.${TI}.AggregateIncome`, 'Part B-TI: Aggregate income must equal Total income minus special-rate income plus agricultural income for rate purposes.');
  if (n0(g(ctx, `${TI}.DeductionsUnderScheduleVIA`)) > 0 && !viaPresent)
    err(ctx, 'A-507', `${P}.ScheduleVIA`, 'Deductions claimed in Part B-TI — Schedule VI-A must be filled.');
  if (viaTotal !== undefined && ti('DeductionsUnderScheduleVIA') !== undefined && !eqTol(ti('DeductionsUnderScheduleVIA'), Math.min(viaTotal, gti ?? viaTotal)))
    warn(ctx, 'A-332', `${P}.${TI}.DeductionsUnderScheduleVIA`, 'Chapter VI-A deduction in Part B-TI does not match the total of Schedule VI-A (restricted to GTI).');
  if (totalIncome !== undefined && totalIncome > 10000000 && !filled(g(ctx, 'ScheduleAL')))
    err(ctx, 'A-456', `${P}.ScheduleAL`, 'Total income exceeds Rs. 1 crore — Schedule AL (Assets & Liabilities) must be filled.');

  /* — Part B-TTI — */
  const TT = 'PartB_TTI';
  const CTL = `${TT}.ComputationOfTaxLiability`;
  const tt = (f: string): number | undefined => num(g(ctx, `${TT}.${f}`));
  const ctl = (f: string): number | undefined => num(g(ctx, `${CTL}.${f}`));
  const tpTI = ctl('TaxPayableOnTI.TaxPayableOnTotInc');
  const normalTax = ctl('TaxPayableOnTI.TaxAtNormalRatesOnAggrInc'); const specialTax = ctl('TaxPayableOnTI.TaxAtSpecialRates'); const agriRebate = ctl('TaxPayableOnTI.RebateOnAgriInc');
  if (tpTI !== undefined && normalTax !== undefined && specialTax !== undefined && agriRebate !== undefined && !eqTol(tpTI, normalTax + specialTax - agriRebate))
    err(ctx, 'A-523', `${P}.${CTL}.TaxPayableOnTI.TaxPayableOnTotInc`, 'Tax payable on total income must equal normal-rate tax plus special-rate tax minus rebate on agricultural income.');
  const rebate87A = ctl('Rebate87A');
  if (ctl('TaxPayableOnRebate') !== undefined && tpTI !== undefined && rebate87A !== undefined && !eqTol(ctl('TaxPayableOnRebate'), tpTI - rebate87A))
    err(ctx, 'A-524', `${P}.${CTL}.TaxPayableOnRebate`, 'Tax payable after rebate must equal tax on total income minus rebate u/s 87A.');
  if (ctl('GrossTaxLiability') !== undefined && ctl('TaxPayableOnRebate') !== undefined && ctl('TotalSurcharge') !== undefined && ctl('EducationCess') !== undefined
    && !eqTol(ctl('GrossTaxLiability'), (ctl('TaxPayableOnRebate') as number) + (ctl('TotalSurcharge') as number) + (ctl('EducationCess') as number)))
    err(ctx, 'A-525', `${P}.${CTL}.GrossTaxLiability`, 'Gross tax liability must equal tax payable plus surcharge plus health & education cess.');
  const deemedTotalTax = tt('TotalTaxPayablDeemedTotInc');
  if (ctl('GrossTaxPayable') !== undefined && ctl('GrossTaxLiability') !== undefined && deemedTotalTax !== undefined
    && !eqTol(ctl('GrossTaxPayable'), Math.max(deemedTotalTax, ctl('GrossTaxLiability') as number)))
    err(ctx, 'A-539', `${P}.${CTL}.GrossTaxPayable`, 'Gross tax payable must be the higher of tax on deemed total income (115JC) and gross tax liability.');
  const ip = (f: string): number | undefined => num(g(ctx, `${CTL}.IntrstPay.${f}`));
  if (ip('TotalIntrstPay') !== undefined && ip('IntrstPayUs234A') !== undefined && ip('IntrstPayUs234B') !== undefined && ip('IntrstPayUs234C') !== undefined && ip('LateFilingFee234F') !== undefined
    && !eqTol(ip('TotalIntrstPay'), (ip('IntrstPayUs234A') as number) + (ip('IntrstPayUs234B') as number) + (ip('IntrstPayUs234C') as number) + (ip('LateFilingFee234F') as number) + n0(g(ctx, `${CTL}.IntrstPay.FeeFurnish234I`))))
    err(ctx, 'A-529', `${P}.${CTL}.IntrstPay.TotalIntrstPay`, 'Total interest and fee payable must equal 234A + 234B + 234C + fee u/s 234F (+234-I).');
  if (ctl('AggregateTaxInterestLiability') !== undefined && ctl('NetTaxLiability') !== undefined && ip('TotalIntrstPay') !== undefined
    && !eqTol(ctl('AggregateTaxInterestLiability'), (ctl('NetTaxLiability') as number) + (ip('TotalIntrstPay') as number)))
    err(ctx, 'A-530', `${P}.${CTL}.AggregateTaxInterestLiability`, 'Aggregate liability must equal net tax liability plus total interest and fee payable.');
  const tp = (f: string): number | undefined => num(g(ctx, `${TT}.TaxPaid.TaxesPaid.${f}`));
  if (tp('TotalTaxesPaid') !== undefined && tp('AdvanceTax') !== undefined && tp('TDS') !== undefined && tp('TCS') !== undefined && tp('SelfAssessmentTax') !== undefined
    && !eqTol(tp('TotalTaxesPaid'), (tp('AdvanceTax') as number) + (tp('TDS') as number) + (tp('TCS') as number) + (tp('SelfAssessmentTax') as number)))
    err(ctx, 'A-531', `${P}.${TT}.TaxPaid.TaxesPaid.TotalTaxesPaid`, 'Total taxes paid must equal advance tax + TDS + TCS + self-assessment tax.');
  if (newRegime && (n0(g(ctx, `${TT}.TaxPayDeemedTotIncUs115JC`)) > 0 || n0(g(ctx, `${TT}.TotalTaxPayablDeemedTotInc`)) > 0))
    err(ctx, 'A-543', `${P}.${TT}.TaxPayDeemedTotIncUs115JC`, 'New regime: AMT u/s 115JC (Sl. 1a-1d of Part B-TTI) must be zero.');
  if (rebate87A !== undefined && rebate87A > 0) {
    if (isNRI) err(ctx, 'A-533', `${P}.${CTL}.Rebate87A`, 'Rebate u/s 87A is not allowed to a non-resident.');
    if (isHUF) err(ctx, 'A-534', `${P}.${CTL}.Rebate87A`, 'Rebate u/s 87A is not allowed to HUF.');
    if (oldRegime && rebate87A > 12500)
      err(ctx, 'A-485', `${P}.${CTL}.Rebate87A`, 'Old regime: rebate u/s 87A cannot exceed Rs. 12,500.');
    if (oldRegime && isResident && totalIncome !== undefined && totalIncome > 500000)
      err(ctx, 'A-535', `${P}.${CTL}.Rebate87A`, 'Old regime: rebate u/s 87A cannot be claimed when total income exceeds Rs. 5,00,000.');
  }
  if (isHUF && n0(g(ctx, `${CTL}.TaxRelief.Section89`)) > 0)
    err(ctx, 'A-516', `${P}.${CTL}.TaxRelief.Section89`, 'HUF cannot claim relief u/s 89.');
  const refundDue = num(g(ctx, `${TT}.Refund.RefundDue`));
  const aggLiab = ctl('AggregateTaxInterestLiability'); const paid = tp('TotalTaxesPaid');
  if (refundDue !== undefined && aggLiab !== undefined && paid !== undefined && refundDue > 0
    && Math.abs(refundDue - Math.max(0, paid - aggLiab)) > 10)
    warn(ctx, 'A-536', `${P}.${TT}.Refund.RefundDue`, 'Refund claimed does not match total taxes paid minus aggregate liability.');
}

/* ── Entry point ───────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];
  try {
    walkBranch(json, TREE, '', missing, 0);
    const r2 = at(json, 'ITR.ITR2');
    if (r2 !== null && typeof r2 === 'object') {
      applyCategoryARules({ r2, errors, warnings });
    }
  } catch {
    // never throw — report what was gathered so far
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
