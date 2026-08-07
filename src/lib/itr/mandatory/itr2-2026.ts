/**
 * Mandatory-field validator — ITR-2, Assessment Year 2026-27.
 *
 * Sources (this exact form-year only — nothing is generalised from other forms):
 *   1. Official CBDT JSON schema  "ITR-2_2026_Main_V1.1.json"
 *      (root Form_ITR2: FormName "ITR-2", AssessmentYear "2026", SchemaVer/FormVer "Ver1.0")
 *   2. CBDT "ITR 2 – Validation Rules for AY 2026-27" V1.0 — Table 2 "Category A"
 *      (764 scenarios; a return violating one of these is NOT allowed to be uploaded).
 *
 * WHAT THIS MODULE DOES
 *   • Walks a DISTILLED required-tree that was extracted recursively from the official
 *     schema (properties / required / definitions / $ref / items) against the payload
 *     the tool exports, whose root is { ITR: { ITR2: … } }.  Every required leaf that is
 *     absent or empty is reported in `missing[]` with a CA-readable label.
 *   • Applies the Category-A rules that are decidable on the JSON alone (conditional
 *     mandatory fields, cross-field/cross-schedule consistency, regime & status bars,
 *     statutory date windows and ceilings) into `errors[]`, each tagged with its
 *     Sl. No. from Table 2 of the validation-rules document (rule id "A<n>").
 *   • Rules that need data this module cannot see — the PAN/Aadhaar database, CPC
 *     records, the e-filing profile, RBI IFSC master, TAN master, prior-year returns,
 *     e-verification state, form-filing status (10E/10IA/67/…) — are SKIPPED, or
 *     downgraded to `warnings[]` when a partial JSON-only check is still useful.
 *
 * Required-tree node forms:
 *     1                        → a required scalar leaf
 *     { r?:1, a?:1, c?:{…} }   → a branch;  r = required,  a = array (c applies to items)
 * Optional branches are retained only when they contain required descendants, and are
 * enforced only when the payload actually carries the branch — that is JSON-schema
 * semantics: an optional object, once present, must satisfy its own `required` list.
 *
 * The module never throws: `json` may be undefined, partial, or the wrong shape.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr2';
const AY = '2026-27';
/** Schema file ITR-2_2026_Main_V1.1; Form_ITR2.SchemaVer / FormVer pattern = "Ver1.0". */
const SCHEMA_VERSION = 'ITR-2_2026_Main_V1.1 (SchemaVer Ver1.0)';

/* ── Financial year covered by AY 2026-27 ─────────────────────────────────── */
const FY_START = '2025-04-01';
const FY_END = '2026-03-31';
/** Section 139(1) due date carried by the schema (FilingStatus.ItrFilingDueDate). */
const DUE_DATE_139_1 = '2026-07-31';

/* ── Distilled required-tree (generated from the official schema) ──────────── */

type ReqNode = 1 | ReqBranch;
interface ReqBranch { r?: 1; a?: 1; c?: ReqMap }
interface ReqMap { [key: string]: ReqNode }

/* eslint-disable */
const REQ_TREE_JSON =

  '{"ITR":{"c":{"ITR2":{"r":1,"c":{"CreationInfo":{"r":1,"c":{"SWVersionNo":1,"SWCreatedBy":1,"JSONCreatedBy":1,"JS'
  + 'ONCreationDate":1,"IntermediaryCity":1,"Digest":1}},"Form_ITR2":{"r":1,"c":{"FormName":1,"Description":1,"Assess'
  + 'mentYear":1,"SchemaVer":1,"FormVer":1}},"PartA_GEN1":{"r":1,"c":{"PersonalInfo":{"r":1,"c":{"AssesseeName":{"r":'
  + '1,"c":{"SurNameOrOrgName":1}},"PAN":1,"Address":{"r":1,"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDist'
  + 'rict":1,"StateCode":1,"CountryCode":1,"Phone":{"c":{"STDcode":1,"PhoneNo":1}},"CountryCodeMobile":1,"MobileNo":1'
  + ',"EmailAddress":1}},"SecondaryAdd":1,"AlternateAddress":{"c":{"ResidenceNo":1,"LocalityOrArea":1,"CityOrTownOrDi'
  + 'strict":1,"StateCode":1}},"DOB":1,"Status":1}},"FilingStatus":{"r":1,"c":{"ReturnFileSec":1,"OptOutNewTaxRegime"'
  + ':1,"SeventhProvisio139":1,"clauseiv7provisio139iDtls":{"a":1,"c":{"clauseiv7provisio139iNature":1,"clauseiv7prov'
  + 'isio139iAmount":1}},"ResidentialStatus":1,"JurisdictionResPrevYr":{"c":{"JurisdictionResPrevYrDtls":{"a":1,"c":{'
  + '"JurisdictionResidence":1,"TIN":1}}}},"AssesseeRep":{"c":{"RepName":1,"RepEmailID":1,"CountryCodeRepMobileNo":1,'
  + '"RepMobileNo":1}},"FiiFpiFlag":1,"CompDirectorPrvYr":{"c":{"CompDirectorPrvYrDtls":{"a":1,"c":{"NameOfCompany":1'
  + ',"CompanyType":1,"SharesTypes":1}}}},"HeldUnlistedEqShrPrYrFlg":1,"HeldUnlistedEqShrPrYr":{"c":{"HeldUnlistedEqS'
  + 'hrPrYrDtls":{"a":1,"c":{"NameOfCompany":1,"CompanyType":1,"OpngBalNumberOfShares":1,"OpngBalCostOfAcquisition":1'
  + ',"ClsngBalNumberOfShares":1,"ClsngBalCostOfAcquisition":1}}}},"ItrFilingDueDate":1}}}},"ScheduleS":{"c":{"Salari'
  + 'es":{"a":1,"c":{"NameOfEmployer":1,"NatureOfEmployment":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTown'
  + 'OrDistrict":1,"StateCode":1}},"Salarys":{"r":1,"c":{"GrossSalary":1,"Salary":1,"NatureOfSalary":{"c":{"OthersInc'
  + 'Dtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"ValueOfPerquisites":1,"NatureOfPerquisites":{"c":{"OthersInc'
  + 'Dtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"ProfitsinLieuOfSalary":1,"NatureOfProfitInLieuOfSalary":{"c"'
  + ':{"OthersIncDtls":{"a":1,"c":{"NatureDesc":1,"OthAmount":1}}}},"IncomeNotified89A":1,"IncomeNotified89AType":{"a'
  + '":1,"c":{"NOT89ACountrycode":1,"NOT89AAmount":1}},"IncomeNotifiedOther89A":1}}}},"TotalGrossSalary":1,"AllwncExt'
  + 'entExemptUs10":1,"AllwncExemptUs10":{"c":{"AllwncExemptUs10Dtls":{"a":1,"c":{"SalNatureDesc":1,"SalOthAmount":1}'
  + '}}},"Section10_13A":{"c":{"Placeofwork":1,"ActlHRARecv":1,"ActlRentPaid":1,"DtlsSalUsSec171":1,"ActlRentPaid10Pe'
  + 'r":1,"Sal40Or50Per":1,"EligbleExmpAllwncUs13A":1}},"NetSalary":1,"DeductionUS16":1,"DeductionUnderSection16ia":1'
  + ',"EntertainmntalwncUs16ii":1,"ProfessionalTaxUs16iii":1,"TotIncUnderHeadSalaries":1}},"ScheduleHP":{"c":{"Proper'
  + 'tyDetails":{"a":1,"c":{"HPSNo":1,"AddressDetailWithZipCode":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,'
  + '"StateCode":1,"CountryCode":1}},"PropertyOwner":1,"PropCoOwnedFlg":1,"AsseseeShareProperty":1,"CoOwners":{"a":1,'
  + '"c":{"CoOwnersSNo":1,"NameCoOwner":1}},"ifLetOut":1,"TenantDetails":{"a":1,"c":{"TenantSNo":1,"NameofTenant":1}}'
  + ',"Rentdetails":{"r":1,"c":{"AnnualLetableValue":1,"TotalUnrealizedAndTax":1,"BalanceALV":1,"AnnualOfPropOwned":1'
  + ',"ThirtyPercentOfBalance":1,"Section24B":{"c":{"Section24BDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnNa'
  + 'me":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"InterestUs24B":1}},"'
  + 'TotalInterestUs24B":1}},"TotalDeduct":1,"IncomeOfHP":1}}}},"TotalIncomeChargeableUnHP":1}},"ScheduleCGFor23":{"c'
  + '":{"ShortTermCapGainFor23":{"r":1,"c":{"SaleofLandBuild":{"c":{"SaleofLandBuildDtls":{"a":1,"c":{"FullConsiderat'
  + 'ion50C":1,"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1,"Balance":1,"DeductionUs54B":1,"STCGonImm'
  + 'vblPrprty":1,"TrnsfImmblPrprty":{"c":{"TrnsfImmblPrprtyDtls":{"a":1,"c":{"NameOfBuyer":1,"PercentageShare":1,"Am'
  + 'ount":1,"AddressOfProperty":1,"StateCode":1,"CountryCode":1}}}}}}}},"EquityMFonSTT":{"a":1,"c":{"MFSectionCode":'
  + '1,"EquityMFonSTTDtls":{"r":1,"c":{"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":'
  + '1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"CapgainonAssets":1}}}},"NRITransacSec48D'
  + 'tl":{"r":1,"c":{"NRItaxSTTPaid":1,"NRItaxSTTNotPaid":1}},"NRISecur115AD":{"r":1,"c":{"FullValueConsdRecvUnqshr":'
  + '1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec'
  + '48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of'
  + '8":1,"CapgainonAssets":1}},"SaleOnOtherAssets":{"r":1,"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,'
  + '"FullValueConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCo'
  + 'st":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"LossSec94of7Or94of8":1,"CapgainonAssets":1}}'
  + ',"UnutilizedCg":{"c":{"UnutilizedCgPrvYrDtls":{"a":1,"c":{"PrvYrInWhichAsstTrnsfrd":1,"SectionClmd":1,"AmtUnutil'
  + 'ized":1}}}},"TotalAmtDeemedStcg":1,"PassThrIncNatureSTCG":1,"NRICgDTAA":{"c":{"NRIDTAADtls":{"a":1,"c":{"DTAAamt'
  + '":1,"ItemNoincl":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"SecITAct":'
  + '1,"RateAsPerITAct":1}}}},"TotalAmtNotTaxUsDTAAStcg":1,"TotalAmtTaxUsDTAAStcg":1,"CapitalLossBuyBackShares":{"c":'
  + '{"TotalCapitalLossBuyBackShares":1,"CapitalLossBuyBackSharesDtls":{"r":1,"a":1,"c":{"Rate":1,"Amount":1}}}},"Tot'
  + 'alSTCG":1}},"LongTermCapGain23":{"r":1,"c":{"SaleofLandBuild":{"c":{"SaleofLandBuildDtls":{"a":1,"c":{"FullConsi'
  + 'deration50C":1,"AquisitCost":1,"AquisitCostIndex":1,"CostOfImprovements":{"c":{"CostOfImprovementsDtls":{"r":1,"'
  + 'a":1,"c":{"slno":1,"ImproveCost":1,"ImproveDate":1,"CostOfImpIndex":1}},"TotalImprovecost":1,"TotalindexImprovec'
  + 'ost":1}},"ExpOnTrans":1,"TotalDedn":1,"Balance":1,"ExemptionOrDednUs54":{"r":1,"c":{"ExemptionOrDednUs54Dtls":{"'
  + 'a":1,"c":{"ExemptionSecCode":1,"ExemptionAmount":1}},"ExemptionGrandTotal":1}},"LTCGonImmvblPrprty":1,"TrnsfImmb'
  + 'lPrprty":{"c":{"TrnsfImmblPrprtyDtls":{"a":1,"c":{"NameOfBuyer":1,"PercentageShare":1,"Amount":1,"AddressOfPrope'
  + 'rty":1,"StateCode":1,"CountryCode":1}}}}}},"TotalLTCGImmblPrprty":1,"TotalExcessTax":1}},"Proviso112Applicable":'
  + '{"a":1,"c":{"Proviso112SectionCode":1,"Proviso112Applicabledtls":{"r":1,"c":{"FullConsideration":1,"DeductSec48"'
  + ':{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"DeductionUs54F":1,"Ca'
  + 'pgainonAssets":1}}}},"SaleOfEquityShareUs112A":{"r":1,"c":{"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}'
  + '},"NRIProvisoSec48":{"c":{"LTCGWithoutBenefit":1,"DeductionUs54F":1,"BalanceCG":1}},"NRIOnSec112and115":{"c":{"N'
  + 'RIOnSec112and115Dtls":{"a":1,"c":{"SectionCode":1,"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValu'
  + 'eConsdSec50CA":1,"FullValueConsdOthUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"Im'
  + 'proveCost":1,"ExpOnTrans":1,"TotalDedn":1}},"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}}}},"NRISaleOfE'
  + 'quityShareUs112A":{"r":1,"c":{"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}},"NRISaleofForeignAsset":{"r'
  + '":1,"c":{"SaleonSpecAsset":1,"DednSpecAssetus115":1,"BalonSpeciAsset":1}},"SaleofAssetNADtls":{"r":1,"c":{"Saleo'
  + 'fAssetNA":{"c":{"FullValueConsdRecvUnqshr":1,"FairMrktValueUnqshr":1,"FullValueConsdSec50CA":1,"FullValueConsdOt'
  + 'hUnqshr":1,"FullConsideration":1,"DeductSec48":{"r":1,"c":{"AquisitCost":1,"ImproveCost":1,"ExpOnTrans":1,"Total'
  + 'Dedn":1}},"BalanceCG":1,"DeductionUs54F":1,"CapgainonAssets":1}}}},"UnutilizedCg":{"c":{"UnutilizedCgPrvYrDtls":'
  + '{"a":1,"c":{"PrvYrInWhichAsstTrnsfrd":1,"SectionClmd":1,"AmtUnutilized":1}}}},"TotalAmtDeemedLtcg":1,"PassThrInc'
  + 'NatureLTCG":1,"NRICgDTAA":{"c":{"NRIDTAADtls":{"a":1,"c":{"DTAAamt":1,"ItemNoincl":1,"CountryName":1,"CountryCod'
  + 'eExcludingIndia":1,"DTAAarticle":1,"RateAsPerTreaty":1,"SecITAct":1,"RateAsPerITAct":1}}}},"TotalAmtNotTaxUsDTAA'
  + 'Ltcg":1,"CapitalLossBuyBackShares":{"c":{"TotalCapitalLossBuyBackShares":1}},"TotalAmtTaxUsDTAALtcg":1,"TotalLTC'
  + 'G":1}},"SumOfCGIncm":1,"IncmFromVDATrnsf":1,"TotScheduleCGFor23":1,"DeducClaimInfo":{"c":{"DeducClaimDtlsUs54":{'
  + '"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54B":{"a":1,"c":{"DateofTransfer":1,"AmtDeducte'
  + 'd":1}},"DeducClaimDtlsUs54EC":{"a":1,"c":{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs54F":{"a":1,"c":'
  + '{"DateofTransfer":1,"AmtDeducted":1}},"DeducClaimDtlsUs115F":{"a":1,"c":{"DateofTransfer":1,"AmtInvested":1,"Dat'
  + 'eofInvestment":1,"AmtDeducted":1}},"TotDeductClaim":1}},"CurrYrLosses":{"r":1,"c":{"InLossSetOff":{"r":1,"c":{"S'
  + 'tclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSe'
  + 'tOffDTAARate":1}},"InStcg20Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSe'
  + 'toffDTAARate":1,"CurrYrCapGain":1}},"InStcg30Per":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff'
  + 'AppRate":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcgAppRate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff'
  + '20Per":1,"StclSetoff30Per":1,"StclSetoffDTAARate":1,"CurrYrCapGain":1}},"InStcgDTAARate":{"r":1,"c":{"CurrYearIn'
  + 'come":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"CurrYrCapGain":1}},"InLtcg12_5Per":{"r":1'
  + ',"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"L'
  + 'tclSetOffDTAARate":1,"CurrYrCapGain":1}},"InLtcgDTAARate":{"r":1,"c":{"CurrYearIncome":1,"StclSetoff20Per":1,"St'
  + 'clSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"CurrYrCapGain":1}},"TotLoss'
  + 'SetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSe'
  + 'tOff12_5Per":1,"LtclSetOffDTAARate":1}},"LossRemainSetOff":{"r":1,"c":{"StclSetoff20Per":1,"StclSetoff30Per":1,"'
  + 'StclSetoffAppRate":1,"StclSetoffDTAARate":1,"LtclSetOff12_5Per":1,"LtclSetOffDTAARate":1}}}},"AccruOrRecOfCG":{"'
  + 'r":1,"c":{"ShortTermUnder20Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12'
  + '":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnder30Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15'
  + 'Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"ShortTermUnderAppRate":{"r"'
  + ':1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31'
  + 'Of3":1}}}},"ShortTermUnderDTAARate":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15'
  + 'Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"LongTermUnder12_5Per":{"r":1,"c":{"DateRange":{"r":1,"c":{"U'
  + 'pto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"LongTermUnderDTAARate"'
  + ':{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of'
  + '3To31Of3":1}}}},"VDATrnsfGainsUnder30Per":{"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15'
  + 'Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}}}}}},"Schedule112A":{"c":{"Schedule112ADtls":{"a":1,"c":{"Shar'
  + 'eOnOrBefore":1,"ISINCode":1,"ShareUnitName":1,"TotSaleValue":1,"CostAcqWithoutIndx":1,"AcquisitionCost":1,"LTCGB'
  + 'eforelowerB1B2":1,"FairMktValuePerShareunit":1,"TotFairMktValueCapAst":1,"ExpExclCnctTransfer":1,"TotalDeduction'
  + 's":1,"Balance":1}},"SaleValue112A":1,"CostAcqWithoutIndx112A":1,"AcquisitionCost112A":1,"LTCGBeforelowerB1B2112A'
  + '":1,"FairMktValueCapAst112A":1,"ExpExclCnctTransfer112A":1,"Deductions112A":1,"Balance112A":1,"TotalBalance112A"'
  + ':1}},"Schedule115AD":{"c":{"Schedule115ADDtls":{"a":1,"c":{"ShareOnOrBefore":1,"ISINCode":1,"ShareUnitName":1,"T'
  + 'otSaleValue":1,"CostAcqWithoutIndx":1,"AcquisitionCost":1,"LTCGBeforelowerB1B2":1,"FairMktValuePerShareunit":1,"'
  + 'TotFairMktValueCapAst":1,"ExpExclCnctTransfer":1,"TotalDeductions":1,"Balance":1}},"SaleValue115AD":1,"CostAcqWi'
  + 'thoutIndx115AD":1,"AcquisitionCost115AD":1,"LTCGBeforelowerB1B2115AD":1,"FairMktValueCapAst115AD":1,"ExpExclCnct'
  + 'Transfer115AD":1,"Deductions115AD":1,"Balance115AD":1,"TotalBalance115AD":1}},"ScheduleVDA":{"c":{"ScheduleVDADt'
  + 'ls":{"r":1,"a":1,"c":{"DateofAcquisition":1,"DateofTransfer":1,"HeadUndIncTaxed":1,"AcquisitionCost":1,"ConsidRe'
  + 'ceived":1,"IncomeFromVDA":1}},"TotIncCapGain":1}},"ScheduleOS":{"c":{"IncOthThanOwnRaceHorse":{"c":{"GrossIncChr'
  + 'gblTaxAtAppRate":1,"DividendGross":1,"InterestGross":1,"IntrstFrmSavingBank":1,"IntrstFrmTermDeposit":1,"IntrstF'
  + 'rmIncmTaxRefund":1,"NatofPassThrghIncome":1,"IntrstFrmOthers":1,"RentFromMachPlantBldgs":1,"Tot562x":1,"Aggrtval'
  + 'uewithoutcons562x":1,"Immovpropwithoutcons562x":1,"Immovpropinadeqcons562x":1,"Anyotherpropwithoutcons562x":1,"A'
  + 'nyotherpropinadeqcons562x":1,"FamilyPension":1,"IncomeNotified89AOS":1,"IncomeNotified89ATypeOS":{"a":1,"c":{"NO'
  + 'T89ACountrycode":1,"NOT89AAmount":1}},"AnyOtherIncome":1,"OthersInc":{"c":{"OthersIncDtls":{"a":1,"c":{"OthNatOf'
  + 'Inc":1,"OthAmount":1}}}},"IncChargeableSpecialRates":1,"LtryPzzlChrgblUs115BB":1,"IncChrgblUs115BBE":1,"CashCred'
  + 'itsUs68":1,"UnExplndInvstmntsUs69":1,"UnExplndMoneyUs69A":1,"UnDsclsdInvstmntsUs69B":1,"UnExplndExpndtrUs69C":1,'
  + '"AmtBrwdRepaidOnHundiUs69D":1,"TaxAccumulatedBalRecPF":{"r":1,"c":{"TaxAccmltdBalRecPFDtls":{"a":1,"c":{"Assessm'
  + 'entYear":1,"IncomeBenefit":1,"TaxBenefit":1}},"TotalIncomeBenefit":1,"TotalTaxBenefit":1}},"OthersGross":1,"Othe'
  + 'rsGrossDtls":{"a":1,"c":{"SourceDescription":1}},"PassThrIncOSChrgblSplRate":1,"PTIOthersGrossDtls":{"a":1,"c":{'
  + '"SourceDescription":1}},"IncChargblSplRateOS":{"c":{"TotalAmtTaxUsDTAASchOs":1,"NRIOsDTAA":{"c":{"NRIDTAADtlsSch'
  + 'OS":{"a":1,"c":{"DTAAamt":1,"NatureOfIncome":1,"CountryName":1,"CountryCodeExcludingIndia":1,"DTAAarticle":1,"Ra'
  + 'teAsPerTreaty":1,"ItemNoincl":1,"RateAsPerITAct":1}}}}}},"Deductions":{"r":1,"c":{"Expenses":1,"DeductionUs57iia'
  + '":1,"Depreciation":1,"TotDeductions":1}},"BalanceNoRaceHorse":1}},"IncFromOwnHorse":{"c":{"Receipts":1,"DeductSe'
  + 'c57":1,"BalanceOwnRaceHorse":1}},"IncChargeable":1,"IncFrmLottery":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of'
  + '6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"IncFrmOnGames":{"c":{"DateRan'
  + 'ge":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"Divi'
  + 'dendIncUs115BBDA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12T'
  + 'o15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115BBDAaiii":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"U'
  + 'pto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115A1ai":{"r":1,"c":{"D'
  + 'ateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}}'
  + ',"DividendIncUs115A1aA":{"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12T'
  + 'o15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115AC":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15O'
  + 'f9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"DividendIncUs115ACA":{"r":1,"c":{"DateRang'
  + 'e":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"Divid'
  + 'endIncUs115AD1i":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To'
  + '15Of3":1,"Up16Of3To31Of3":1}}}},"DividendDTAA":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto15Of6":1,"Upto15Of9":1,"'
  + 'Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}},"NOT89A":{"r":1,"c":{"DateRange":{"r":1,"c":{"Upto'
  + '15Of6":1,"Upto15Of9":1,"Up16Of9To15Of12":1,"Up16Of12To15Of3":1,"Up16Of3To31Of3":1}}}}}},"ScheduleCYLA":{"r":1,"c'
  + '":{"Salary":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"HP":{"c":{"In'
  + 'cCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCG20Per":{"r":1,"c":{"IncCYLA":{'
  + '"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCG30Per":{"r":1,"c":{"IncCYLA":{"r":1,"c'
  + '":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCGAppRate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"In'
  + 'cOfCurYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"STCGDTAARate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCu'
  + 'rYrUnderThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"LTCG12_5Per":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnd'
  + 'erThatHead":1,"IncOfCurYrAfterSetOff":1}}}},"LTCGDTAARate":{"r":1,"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderTha'
  + 'tHead":1,"IncOfCurYrAfterSetOff":1}}}},"OthSrcExclRaceHorse":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHea'
  + 'd":1,"IncOfCurYrAfterSetOff":1}}}},"OthSrcRaceHorse":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"In'
  + 'cOfCurYrAfterSetOff":1}}}},"IncOSDTAA":{"c":{"IncCYLA":{"r":1,"c":{"IncOfCurYrUnderThatHead":1,"IncOfCurYrAfterS'
  + 'etOff":1}}}},"TotalCurYr":{"r":1,"c":{"TotHPlossCurYr":1,"TotOthSrcLossNoRaceHorse":1}},"TotalLossSetOff":{"r":1'
  + ',"c":{"TotHPlossCurYrSetoff":1,"TotOthSrcLossNoRaceHorseSetoff":1}},"LossRemAftSetOff":{"r":1,"c":{"BalHPlossCur'
  + 'YrAftSetoff":1,"BalOthSrcLossNoRaceHorseAftSetoff":1}}}},"ScheduleBFLA":{"r":1,"c":{"Salary":{"r":1,"c":{"IncBFL'
  + 'A":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"HP":{"c":{"IncBFLA":{"r":1,"'
  + 'c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCG2'
  + '0Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCu'
  + 'rYrAfterSetOffBFLosses":1}}}},"STCG30Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlos'
  + 'sPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCGAppRate":{"r":1,"c":{"IncBFLA":{"r":1,"c"'
  + ':{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"STCGDTA'
  + 'ARate":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfC'
  + 'urYrAfterSetOffBFLosses":1}}}},"LTCG12_5Per":{"r":1,"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BF'
  + 'lossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"LTCGDTAARate":{"r":1,"c":{"IncBFLA":{"r":1'
  + ',"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,"IncOfCurYrAfterSetOffBFLosses":1}}}},"Oth'
  + 'SrcExclRaceHorse":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"IncOfCurYrAfterSetOffBFLosses":1}}}'
  + '},"OthSrcRaceHorse":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"BFlossPrevYrUndSameHeadSetoff":1,'
  + '"IncOfCurYrAfterSetOffBFLosses":1}}}},"IncOSDTAA":{"c":{"IncBFLA":{"r":1,"c":{"IncOfCurYrUndHeadFromCYLA":1,"Inc'
  + 'OfCurYrAfterSetOffBFLosses":1}}}},"TotalBFLossSetOff":{"r":1,"c":{"TotBFLossSetoff":1}},"IncomeOfCurrYrAftCYLABF'
  + 'LA":1}},"ScheduleCFL":{"c":{"LossCFFromPrev8thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":'
  + '1}}}},"LossCFFromPrev7thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev6'
  + 'thYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev5thYearFromAY":{"c":{"C'
  + 'arryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1}}}},"LossCFFromPrev4thYearFromAY":{"c":{"CarryFwdLossDetail":{"r'
  + '":1,"c":{"DateOfFiling":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"TotalHPPTILossCF":1}}}},"LossCFFromPrev'
  + '3rdYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossC'
  + 'F":1,"TotalHPPTILossCF":1}}}},"LossCFFromPrev2ndYearFromAY":{"c":{"CarryFwdLossDetail":{"r":1,"c":{"DateOfFiling'
  + '":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"TotalHPPTILossCF":1}}}},"LossCFFromPrevYrToAY":{"c":{"CarryFw'
  + 'dLossDetail":{"r":1,"c":{"DateOfFiling":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1,"TotalHPPTILossCF":1}}}}'
  + ',"TotalOfBFLossesEarlierYrs":{"r":1,"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,"TotalSTCGPTILossC'
  + 'F":1,"TotalLTCGPTILossCF":1}}}},"AdjTotBFLossInBFLA":{"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHPPTILossCF":1,'
  + '"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1}}}},"CurrentAYloss":{"c":{"LossSummaryDetail":{"r":1,"c":{"TotalHP'
  + 'PTILossCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1}}}},"TotalLossCFSummary":{"r":1,"c":{"LossSummaryDeta'
  + 'il":{"r":1,"c":{"TotalHPPTILossCF":1,"TotalSTCGPTILossCF":1,"TotalLTCGPTILossCF":1}}}}}},"ScheduleVIA":{"c":{"Us'
  + 'rDeductUndChapVIA":{"r":1,"c":{"PensionContribution80CCC":{"a":1,"c":{"TypeofIdentifier":1,"NameofIdentifier":1,'
  + '"Amount":1}}}},"DeductUndChapVIA":{"r":1,"c":{"Section80D":1,"Section80G":1,"Section80GGA":1,"TotalChapVIADeduct'
  + 'ions":1}}}},"Schedule80C":{"c":{"Schedule80CDtls":{"r":1,"a":1,"c":{"Amount":1,"IdentificationNo":1}},"TotalAmt"'
  + ':1}},"Schedule80D":{"c":{"Sec80DSelfFamSrCtznHealth":{"c":{"SelfAndFamily":1,"Sec80DSelfFamHIDtls":{"c":{"Sch80D'
  + 'InsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"SelfAndFamilySen'
  + 'iorCitizen":1,"Sec80DSelfFamSrCtznHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"'
  + 'HealthInsAmt":1}},"TotalPayments":1}},"Parents":1,"Sec80DParentsHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{'
  + '"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments":1}},"ParentsSeniorCitizen":1,"Sec80DParentsSrCtz'
  + 'nHIDtls":{"c":{"Sch80DInsDtls":{"r":1,"a":1,"c":{"InsurerName":1,"PolicyNo":1,"HealthInsAmt":1}},"TotalPayments"'
  + ':1}},"EligibleAmountOfDedn":1}}}},"Schedule80G":{"c":{"Don100Percent":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWit'
  + 'hPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinC'
  + 'ode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon100Percen'
  + 'tCash":1,"TotDon100PercentOtherMode":1,"TotDon100Percent":1,"TotEligibleDon100Percent":1}},"Don50PercentNoApprRe'
  + 'qd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":'
  + '1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt'
  + '":1,"EligibleDonationAmt":1}},"TotDon50PercentNoApprReqdCash":1,"TotDon50PercentNoApprReqdOtherMode":1,"TotDon50'
  + 'PercentNoApprReqd":1,"TotEligibleDon50Percent":1}},"Don100PercentApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"Don'
  + 'eeWithPanName":1,"DoneePAN":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,'
  + '"PinCode":1}},"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon100P'
  + 'ercentApprReqdCash":1,"TotDon100PercentApprReqdOtherMode":1,"TotDon100PercentApprReqd":1,"TotEligibleDon100Perce'
  + 'ntApprReqd":1}},"Don50PercentApprReqd":{"c":{"DoneeWithPan":{"a":1,"c":{"DoneeWithPanName":1,"DoneePAN":1,"Addre'
  + 'ssDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict":1,"StateCode":1,"PinCode":1}},"DonationAmtCash":1,"D'
  + 'onationAmtOtherMode":1,"DonationAmt":1,"EligibleDonationAmt":1}},"TotDon50PercentApprReqdCash":1,"TotDon50Percen'
  + 'tApprReqdOtherMode":1,"TotDon50PercentApprReqd":1,"TotEligibleDon50PercentApprReqd":1}},"TotalDonationsUs80GCash'
  + '":1,"TotalDonationsUs80GOtherMode":1,"TotalDonationsUs80G":1,"TotalEligibleDonationsUs80G":1}},"Schedule80GGC":{'
  + '"c":{"Schedule80GGCDetails":{"a":1,"c":{"DonationDate":1,"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationA'
  + 'mt":1,"EligibleDonationAmt":1}},"TotalDonationAmtCash80GGC":1,"TotalDonationAmtOtherMode80GGC":1,"TotalDonations'
  + 'Us80GGC":1,"TotalEligibleDonationAmt80GGC":1}},"Schedule80DD":{"c":{"NatureOfDisability":1,"TypeOfDisability":1,'
  + '"DeductionAmount":1,"DependentType":1}},"Schedule80U":{"c":{"NatureOfDisability":1,"TypeOfDisability":1,"Deducti'
  + 'onAmount":1}},"Schedule80E":{"c":{"Schedule80EDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanA'
  + 'ccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80E":1}},"TotalInterest8'
  + '0E":1}},"Schedule80EE":{"c":{"Schedule80EEDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInstnName":1,"LoanAccNo'
  + 'OfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80EE":1}},"TotalInterest80EE'
  + '":1}},"Schedule80EEA":{"c":{"PropStmpDtyVal":1,"Schedule80EEADtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrInst'
  + 'nName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"Interest80EEA":1}'
  + '},"TotalInterest80EEA":1}},"Schedule80EEB":{"c":{"Schedule80EEBDtls":{"r":1,"a":1,"c":{"LoanTknFrom":1,"BankOrIn'
  + 'stnName":1,"LoanAccNoOfBankOrInstnRefNo":1,"DateofLoan":1,"TotalLoanAmt":1,"LoanOutstndngAmt":1,"VehicleRegNo":1'
  + ',"Interest80EEB":1}},"TotalInterest80EEB":1}},"Schedule80GGA":{"c":{"DonationDtlsSciRsrchRuralDev":{"a":1,"c":{"'
  + 'RelevantClauseUndrDedClaimed":1,"NameOfDonee":1,"AddressDetail":{"r":1,"c":{"AddrDetail":1,"CityOrTownOrDistrict'
  + '":1,"StateCode":1,"PinCode":1}},"DoneePAN":1,"DonationAmtCash":1,"DonationAmtOtherMode":1,"DonationAmt":1,"Eligi'
  + 'bleDonationAmt":1}},"TotalDonationAmtCash80GGA":1,"TotalDonationAmtOtherMode80GGA":1,"TotalDonationsUs80GGA":1,"'
  + 'TotalEligibleDonationAmt80GGA":1}},"ScheduleAMT":{"c":{"TotalIncItemPartBTI":1,"DeductionClaimUndrAnySec":1,"Adj'
  + 'ustedUnderSec115JC":1,"TaxPayableUnderSec115JC":1}},"ScheduleAMTC":{"c":{"TaxSection115JC":1,"TaxOthProvisions":'
  + '1,"AmtTaxCreditAvailable":1,"ScheduleAMTCDtls":{"a":1,"c":{"AssYr":1,"Gross":1,"AmtCreditSetOfEy":1,"AmtCreditBa'
  + 'lBroughtFwd":1,"AmtCreditUtilized":1,"BalAmtCreditCarryFwd":1}},"CurrYrAmtCreditFwd":1,"CurrYrCreditCarryFwd":1,'
  + '"TotAMTGross":1,"TotSetOffEys":1,"TotBalBF":1,"TotBalAMTCreditCF":1,"TaxSection115JD":1,"AmtLiabilityAvailable":'
  + '1}},"ScheduleSPI":{"c":{"SpecifiedPerson":{"a":1,"c":{"SpecifiedPersonName":1,"ReltnShip":1,"AmtIncluded":1,"Hea'
  + 'dIncIncluded":1}}}},"ScheduleSI":{"c":{"SplCodeRateTax":{"a":1,"c":{"SecCode":1,"SplRatePercent":1,"SplRateInc":'
  + '1,"SplRateIncTax":1}},"TotSplRateInc":1,"TotSplRateIncTax":1}},"ScheduleEI":{"c":{"NetAgriIncOrOthrIncRule7":1,"'
  + 'ExcNetAgriInc":{"c":{"ExcNetAgriIncDtls":{"a":1,"c":{"NameOfDistrict":1,"PinCode":1,"MeasurementOfLand":1,"AgriL'
  + 'andOwnedFlag":1,"AgriLandIrrigatedFlag":1}}}},"OthersInc":{"c":{"OthersIncDtls":{"a":1,"c":{"OthAmount":1}}}},"O'
  + 'thers":1,"IncNotChrgblAsPerDTAA":{"c":{"IncNotChrgblAsPerDTAADtls":{"a":1,"c":{"AmountOfIncome":1,"NatureOfIncom'
  + 'e":1,"CountryName":1,"CountryCodeExcludingIndia":1,"ArticleOfDTAA":1,"HeadOfIncome":1,"TRCFlag":1}}}},"IncNotChr'
  + 'gblToTax":1,"TotalExemptInc":1}},"SchedulePTI":{"c":{"SchedulePTIDtls":{"a":1,"c":{"InvstmntCvrdUs115UA115UB":1,'
  + '"BusinessName":1,"BusinessPAN":1,"IncFromHP":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetInco'
  + 'meLoss":1,"TDSAmount":1}},"CapitalGainsPTI":{"r":1,"c":{"ShortTermCG":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossSha'
  + 'reByInvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"STCG_Sec111A":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareBy'
  + 'InvstFund":1,"NetIncomeLoss":1,"TDSAmount":1}},"STCG_Others":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvst'
  + 'Fund":1,"NetIncomeLoss":1,"TDSAmount":1}},"LongTermCG":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":'
  + '1,"NetIncomeLoss":1,"TDSAmount":1}},"LTCG_Sec112A":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"N'
  + 'etIncomeLoss":1,"TDSAmount":1}},"LTCG_Others":{"r":1,"c":{"AmountOfInc":1,"CurrYrLossShareByInvstFund":1,"NetInc'
  + 'omeLoss":1,"TDSAmount":1}}}},"IncClmdPTI":{"r":1,"c":{"TotalSec23FBB":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss'
  + '":1,"TDSAmount":1}},"Sec23FBB":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"SecBIncExmptDtl":{'
  + '"c":{"SectionCode":1,"SecBCIncExmptDtl":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}}}},"SecCInc'
  + 'ExmptDtl":{"c":{"SectionCode":1,"SecBCIncExmptDtl":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}}'
  + '}}}},"IncOthSrc":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"OS_Dividend":{"r":1,"c":{"Amount'
  + 'OfInc":1,"NetIncomeLoss":1,"TDSAmount":1}},"OS_Others":{"r":1,"c":{"AmountOfInc":1,"NetIncomeLoss":1,"TDSAmount"'
  + ':1}}}}}},"ScheduleFSI":{"c":{"ScheduleFSIDtls":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"TaxIde'
  + 'ntificationNo":1,"IncFromSal":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxRel'
  + 'iefinInd":1}},"IncFromHP":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefi'
  + 'nInd":1}},"IncCapGain":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinIn'
  + 'd":1}},"IncOthSrc":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd":1'
  + '}},"TotalCountryWise":{"r":1,"c":{"IncFrmOutsideInd":1,"TaxPaidOutsideInd":1,"TaxPayableinInd":1,"TaxReliefinInd'
  + '":1}}}}}},"ScheduleTR1":{"c":{"ScheduleTR":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"TaxIdentif'
  + 'icationNo":1,"TaxPaidOutsideIndia":1,"TaxReliefOutsideIndia":1}},"TotalTaxPaidOutsideIndia":1,"TotalTaxReliefOut'
  + 'sideIndia":1,"TaxReliefOutsideIndiaDTAA":1,"TaxReliefOutsideIndiaNotDTAA":1}},"ScheduleFA":{"c":{"DetailsForiegn'
  + 'Bank":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"Bankname":1,"AddressOfBank":1,"ZipCode":1,"Fore'
  + 'ignAccountNumber":1,"OwnerStatus":1,"AccOpenDate":1,"PeakBalanceDuringYear":1,"ClosingBalance":1,"IntrstAccured"'
  + ':1}},"DtlsForeignCustodialAcc":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"FinancialInstName":1,"'
  + 'FinancialInstAddress":1,"ZipCode":1,"AccountNumber":1,"Status":1,"AccOpenDate":1,"PeakBalanceDuringPeriod":1,"Cl'
  + 'osingBalance":1,"GrossAmtPaidCredited":1,"NatureOfAmount":1}},"DtlsForeignEquityDebtInterest":{"a":1,"c":{"Count'
  + 'ryName":1,"CountryCodeExcludingIndia":1,"NameOfEntity":1,"AddressOfEntity":1,"ZipCode":1,"NatureOfEntity":1,"Int'
  + 'erestAcquiringDate":1,"InitialValOfInvstmnt":1,"PeakBalanceDuringPeriod":1,"ClosingBalance":1,"TotGrossAmtPaidCr'
  + 'edited":1,"TotGrossProceeds":1}},"DtlsForeignCashValueInsurance":{"a":1,"c":{"CountryName":1,"CountryCodeExcludi'
  + 'ngIndia":1,"FinancialInstName":1,"FinancialInstAddress":1,"ZipCode":1,"ContractDate":1,"CashValOrSurrenderVal":1'
  + ',"TotGrossAmtPaidCredited":1}},"DetailsFinancialInterest":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia'
  + '":1,"ZipCode":1,"NameOfEntity":1,"AddressOfEntity":1,"NatureOfInt":1,"DateHeld":1,"TotalInvestment":1,"IncFromIn'
  + 't":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsImmovableProperty":{"a":1,"c":{"Count'
  + 'ryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"Ownership":1,"DateOfAcq":1,"TotalInvestment":1,"IncDrvPrope'
  + 'rty":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsOthAssets":{"a":1,"c":{"CountryName'
  + '":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NatureOfAsset":1,"Ownership":1,"DateOfAcq":1,"TotalInvestment":1,'
  + '"IncDrvAsset":1,"NatureOfInc":1,"IncTaxAmt":1,"IncTaxSch":1,"IncTaxSchNo":1}},"DetailsOfAccntsHvngSigningAuth":{'
  + '"a":1,"c":{"NameOfInstitution":1,"AddressOfInstitution":1,"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode'
  + '":1,"NameMentionedInAccnt":1,"InstitutionAccountNumber":1,"PeakBalanceOrInvestment":1,"IncAccuredTaxFlag":1}},"D'
  + 'etailsOfTrustOutIndiaTrustee":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfTrust'
  + '":1,"AddressOfTrust":1,"NameOfOtherTrustees":1,"AddressOfOtherTrustees":1,"NameOfSettlor":1,"AddressOfSettlor":1'
  + ',"NameOfBeneficiaries":1,"AddressOfBeneficiaries":1,"DateHeld":1,"IncDrvTaxFlag":1}},"DetailsOfOthSourcesIncOuts'
  + 'ideIndia":{"a":1,"c":{"CountryName":1,"CountryCodeExcludingIndia":1,"ZipCode":1,"NameOfPerson":1,"AddressOfPerso'
  + 'n":1,"NatureOfInc":1,"IncDrvTaxFlag":1}}}},"Schedule5A2014":{"c":{"NameOfSpouse":1,"PANOfSpouse":1,"HPHeadIncome'
  + '":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"CapGainHeadI'
  + 'ncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}},"OtherSo'
  + 'urcesHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse":1}'
  + '},"TotalHeadIncome":{"r":1,"c":{"IncRecvdUndHead":1,"AmtApprndOfSpouse":1,"AmtTDSDeducted":1,"TDSApprndOfSpouse"'
  + ':1}}}},"ScheduleAL":{"c":{"ImmovableDetails":{"a":1,"c":{"Description":1,"AddressAL":{"r":1,"c":{"ResidenceNo":1'
  + ',"LocalityOrArea":1,"CityOrTownOrDistrict":1,"StateCode":1,"CountryCode":1}},"Amount":1}},"MovableAsset":{"r":1,'
  + '"c":{"DepositsInBank":1,"SharesAndSecurities":1,"InsurancePolicies":1,"LoansAndAdvancesGiven":1,"CashInHand":1,"'
  + 'JewelleryBullionEtc":1,"ArchCollDrawPaintSulpArt":1,"VehiclYachtsBoatsAircrafts":1}},"LiabilityInRelatAssets":1}'
  + '},"PartB-TI":{"r":1,"c":{"Salaries":1,"IncomeFromHP":1,"CapGain":{"r":1,"c":{"ShortTerm":{"r":1,"c":{"ShortTerm2'
  + '0Per":1,"ShortTerm30Per":1,"ShortTermAppRate":1,"ShortTermSplRateDTAA":1,"TotalShortTerm":1}},"LongTerm":{"r":1,'
  + '"c":{"LongTerm12_5Per":1,"LongTermSplRateDTAA":1,"TotalLongTerm":1}},"ShortTermLongTermTotal":1,"CapGains30Per11'
  + '5BBH":1,"TotalCapGains":1}},"IncFromOS":{"r":1,"c":{"OtherSrcThanOwnRaceHorse":1,"IncChargblSplRate":1,"FromOwnR'
  + 'aceHorse":1,"TotIncFromOS":1}},"TotalTI":1,"CurrentYearLoss":1,"BalanceAfterSetoffLosses":1,"BroughtFwdLossesSet'
  + 'off":1,"GrossTotalIncome":1,"IncChargeTaxSplRate111A112":1,"DeductionsUnderScheduleVIA":1,"TotalIncome":1,"IncCh'
  + 'argeableTaxSplRates":1,"NetAgricultureIncomeOrOtherIncomeForRate":1,"AggregateIncome":1,"LossesOfCurrentYearCarr'
  + 'iedFwd":1,"DeemedIncomeUs115JC":1}},"PartB_TTI":{"r":1,"c":{"TaxPayDeemedTotIncUs115JC":1,"Surcharge":1,"HealthE'
  + 'duCess":1,"TotalTaxPayablDeemedTotInc":1,"ComputationOfTaxLiability":{"r":1,"c":{"TaxPayableOnTI":{"r":1,"c":{"T'
  + 'axAtNormalRatesOnAggrInc":1,"TaxAtSpecialRates":1,"RebateOnAgriInc":1,"TaxPayableOnTotInc":1}},"Rebate87A":1,"Ta'
  + 'xPayableOnRebate":1,"Surcharge25ofSI":1,"SurchargeOnAboveCrore":1,"Surcharge25ofSIBeforeMarginal":1,"SurchargeOn'
  + 'AboveCroreBeforeMarginal":1,"TotalSurcharge":1,"EducationCess":1,"GrossTaxLiability":1,"GrossTaxPayable":1,"Gros'
  + 'sTaxPay":{"c":{"TaxInc17":1,"TaxDeferred17":1,"TaxDeferredPayableCY":1}},"CreditUS115JD":1,"TaxPayAfterCreditUs1'
  + '15JD":1,"TaxRelief":{"c":{"TotTaxRelief":1}},"NetTaxLiability":1,"IntrstPay":{"r":1,"c":{"IntrstPayUs234A":1,"In'
  + 'trstPayUs234B":1,"IntrstPayUs234C":1,"LateFilingFee234F":1,"TotalIntrstPay":1}},"AggregateTaxInterestLiability":'
  + '1}},"TaxPaid":{"r":1,"c":{"TaxesPaid":{"r":1,"c":{"AdvanceTax":1,"TDS":1,"TCS":1,"SelfAssessmentTax":1,"TotalTax'
  + 'esPaid":1}}}},"Refund":{"r":1,"c":{"RefundDue":1,"BankAccountDtls":{"r":1,"c":{"BankDtlsFlag":1,"AddtnlBankDetai'
  + 'ls":{"a":1,"c":{"IFSCCode":1,"BankName":1,"BankAccountNo":1,"AccountType":1,"UseForRefund":1}},"ForeignBankDetai'
  + 'ls":{"a":1,"c":{"SWIFTCode":1,"BankName":1,"IBAN":1,"CountryCode":1}}}}}},"AssetOutIndiaFlag":1}},"ScheduleIT":{'
  + '"c":{"TaxPayment":{"a":1,"c":{"BSRCode":1,"DateDep":1,"SrlNoOfChaln":1,"Amt":1}},"TotalTaxPayments":1}},"Schedul'
  + 'eTDS1":{"c":{"TDSonSalary":{"a":1,"c":{"EmployerOrDeductorOrCollectDetl":{"r":1,"c":{"TAN":1,"EmployerOrDeductor'
  + 'OrCollecterName":1}},"IncChrgSal":1,"TotalTDSSal":1}},"TotalTDSonSalaries":1}},"ScheduleTDS2":{"c":{"TDSOthThanS'
  + 'alaryDtls":{"a":1,"c":{"TDSCreditName":1,"TANOfDeductor":1,"TDSSection":1,"TaxDeductCreditDtls":{"r":1,"c":{"Tax'
  + 'ClaimedOwnHands":1}},"AmtCarriedFwd":1}},"TotalTDSonOthThanSals":1}},"ScheduleTDS3":{"c":{"TDS3onOthThanSalDtls"'
  + ':{"a":1,"c":{"TDSCreditName":1,"PANOfBuyerTenant":1,"TDSSection":1,"TaxDeductCreditDtls":{"r":1,"c":{"TaxClaimed'
  + 'OwnHands":1}},"AmtCarriedFwd":1}},"TotalTDS3OnOthThanSal":1}},"ScheduleTCS":{"c":{"TCS":{"a":1,"c":{"TCSCreditOw'
  + 'ner":1,"EmployerOrDeductorOrCollectTAN":1}},"TotalSchTCS":1}},"Verification":{"r":1,"c":{"Declaration":{"r":1,"c'
  + '":{"AssesseeVerName":1,"FatherName":1,"AssesseeVerPAN":1}},"Capacity":1}},"TaxReturnPreparer":{"c":{"Identificat'
  + 'ionNoOfTRP":1,"NameOfTRP":1,"ReImbFrmGov":1}},"ScheduleESOP":{"c":{"PanofStartUp":1,"DPIITRegNo":1,"ScheduleESOP'
  + '2122_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2223_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2324_Type"'
  + ':{"c":{"AssessmentYear":1}},"ScheduleESOP2425_Type":{"c":{"AssessmentYear":1}},"ScheduleESOP2526_Type":{"c":{"As'
  + 'sessmentYear":1}},"ScheduleESOP2627_Type":{"c":{"AssessmentYear":1}},"TotalTaxAttributedAmt":1}}}}}}}';
/* eslint-enable */

const REQ_TREE: ReqMap = (() => {
  try { return JSON.parse(REQ_TREE_JSON) as ReqMap; } catch { return {} as ReqMap; }
})();

/** Root chain is mandatory even though the schema declares no root `required`. */
const ROOT: ReqMap = (() => {
  const itr = REQ_TREE.ITR;
  if (itr && itr !== 1) return { ITR: { r: 1 as const, c: itr.c } };
  return { ITR: { r: 1 as const, c: { ITR2: { r: 1 as const } } } } as ReqMap;
})();

/* ── Labels ────────────────────────────────────────────────────────────────── */

/** Explicit CA-readable labels for the identity / filing / verification core. */
const LABELS: Record<string, string> = {
  'ITR': 'ITR envelope',
  'ITR.ITR2': 'ITR-2 return body',
  'ITR.ITR2.CreationInfo': 'Creation info block (software / JSON provenance)',
  'ITR.ITR2.CreationInfo.SWVersionNo': 'Software version number',
  'ITR.ITR2.CreationInfo.SWCreatedBy': 'Software created by (SW code)',
  'ITR.ITR2.CreationInfo.JSONCreatedBy': 'JSON created by',
  'ITR.ITR2.CreationInfo.JSONCreationDate': 'JSON creation date',
  'ITR.ITR2.CreationInfo.IntermediaryCity': 'Intermediary city',
  'ITR.ITR2.CreationInfo.Digest': 'Digest',
  'ITR.ITR2.Form_ITR2': 'Form header block',
  'ITR.ITR2.Form_ITR2.FormName': 'Form name (must be "ITR-2")',
  'ITR.ITR2.Form_ITR2.Description': 'Form description',
  'ITR.ITR2.Form_ITR2.AssessmentYear': 'Assessment year (must be "2026")',
  'ITR.ITR2.Form_ITR2.SchemaVer': 'Schema version (must be "Ver1.0")',
  'ITR.ITR2.Form_ITR2.FormVer': 'Form version (must be "Ver1.0")',
  'ITR.ITR2.PartA_GEN1': 'Part A — General information',
  'ITR.ITR2.PartA_GEN1.PersonalInfo': 'Personal information',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.AssesseeName': 'Name of the assessee',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.AssesseeName.SurNameOrOrgName': 'Surname / last name of the assessee',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.PAN': 'PAN of the assessee',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address': 'Address of the assessee',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.ResidenceNo': 'Flat / door / block number',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.LocalityOrArea': 'Road / street / locality',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.CityOrTownOrDistrict': 'Town / city / district',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.StateCode': 'State code',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.CountryCode': 'Country code',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.PinCode': 'PIN code',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.CountryCodeMobile': 'Mobile ISD / country code',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.MobileNo': 'Mobile number of the assessee',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.EmailAddress': 'E-mail address of the assessee',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.Phone.STDcode': 'STD code of landline',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Address.Phone.PhoneNo': 'Landline number',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.SecondaryAdd': 'Do you have a secondary address? (Y/N)',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.DOB': 'Date of birth / formation',
  'ITR.ITR2.PartA_GEN1.PersonalInfo.Status': 'Status (I = Individual, H = HUF)',
  'ITR.ITR2.PartA_GEN1.FilingStatus': 'Filing status block',
  'ITR.ITR2.PartA_GEN1.FilingStatus.ReturnFileSec': 'Section under which the return is filed',
  'ITR.ITR2.PartA_GEN1.FilingStatus.OptOutNewTaxRegime': 'Opting out of the new tax regime u/s 115BAC (Y/N)',
  'ITR.ITR2.PartA_GEN1.FilingStatus.SeventhProvisio139': 'Filing under the seventh proviso to s.139(1)? (Y/N)',
  'ITR.ITR2.PartA_GEN1.FilingStatus.ResidentialStatus': 'Residential status (RES / NRI / NOR)',
  'ITR.ITR2.PartA_GEN1.FilingStatus.ItrFilingDueDate': 'Due date of filing u/s 139(1)',
  'ITR.ITR2.PartA_GEN1.FilingStatus.FiiFpiFlag': 'Are you an FII / FPI? (Y/N)',
  'ITR.ITR2.PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg': 'Held unlisted equity shares during the year? (Y/N)',
  'ITR.ITR2.PartA_GEN1.FilingStatus.AssesseeRep.RepName': 'Name of the representative assessee',
  'ITR.ITR2.PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID': 'E-mail of the representative assessee',
  'ITR.ITR2.PartA_GEN1.FilingStatus.AssesseeRep.CountryCodeRepMobileNo': 'Mobile ISD code of the representative',
  'ITR.ITR2.PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo': 'Mobile number of the representative',
  'ITR.ITR2.Verification': 'Verification block',
  'ITR.ITR2.Verification.Declaration': 'Verification declaration',
  'ITR.ITR2.Verification.Declaration.AssesseeVerName': 'Name of the person verifying the return',
  'ITR.ITR2.Verification.Declaration.FatherName': "Father's name of the person verifying",
  'ITR.ITR2.Verification.Declaration.AssesseeVerPAN': 'PAN of the person verifying the return',
  'ITR.ITR2.Verification.Capacity': 'Capacity of the verifier (S / R / K / A)',
  'ITR.ITR2.PartB-TI': 'Part B-TI — Computation of total income',
  'ITR.ITR2.PartB-TI.TotalTI': 'Total of heads of income (Part B-TI, 5)',
  'ITR.ITR2.PartB-TI.GrossTotalIncome': 'Gross total income (Part B-TI, 9)',
  'ITR.ITR2.PartB-TI.DeductionsUnderScheduleVIA': 'Deductions under Chapter VI-A (Part B-TI, 11)',
  'ITR.ITR2.PartB-TI.TotalIncome': 'Total income (Part B-TI, 12)',
  'ITR.ITR2.PartB_TTI': 'Part B-TTI — Computation of tax liability',
  'ITR.ITR2.PartB_TTI.Refund.RefundDue': 'Refund due (Part B-TTI, 17)',
  'ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag': 'Bank-account details flag',
  'ITR.ITR2.PartB_TTI.AssetOutIndiaFlag': 'Do you hold assets outside India? (Part B-TTI, 19)',
  'ITR.ITR2.ScheduleCYLA': 'Schedule CYLA — current-year loss adjustment',
  'ITR.ITR2.ScheduleBFLA': 'Schedule BFLA — brought-forward loss adjustment',
};

/** UI pointers, keyed by the top-level schedule inside ITR2. */
const HINTS: Record<string, string> = {
  CreationInfo: 'Generated automatically on export',
  Form_ITR2: 'Generated automatically on export',
  PartA_GEN1: 'Assessee info. / Residential status info. (Info tab)',
  Verification: 'Verifier info. (Info tab)',
  ScheduleS: 'Salary schedule (Computation tab)',
  ScheduleHP: 'House property schedule (Computation tab)',
  ScheduleCGFor23: 'Capital gains schedule (Computation tab)',
  Schedule112A: 'Schedule 112A — LTCG on STT-paid equity (Computation tab)',
  Schedule115AD: 'Schedule 115AD(1)(b)(iii) proviso (Computation tab)',
  ScheduleVDA: 'Schedule VDA — virtual digital assets (Computation tab)',
  ScheduleOS: 'Other sources schedule (Computation tab)',
  ScheduleCYLA: 'Schedule CYLA (Computation tab)',
  ScheduleBFLA: 'Schedule BFLA (Computation tab)',
  ScheduleCFL: 'Schedule CFL — losses carried forward (Computation tab)',
  ScheduleVIA: 'Chapter VI-A deductions (Computation tab)',
  Schedule80C: 'Schedule 80C detail (Computation tab)',
  Schedule80D: 'Schedule 80D detail (Computation tab)',
  Schedule80G: 'Schedule 80G — donations (Computation tab)',
  Schedule80GGA: 'Schedule 80GGA — donations for research / rural development',
  Schedule80GGC: 'Schedule 80GGC — contribution to political parties',
  Schedule80DD: 'Schedule 80DD (Computation tab)',
  Schedule80U: 'Schedule 80U (Computation tab)',
  Schedule80E: 'Schedule 80E — education loan interest',
  Schedule80EE: 'Schedule 80EE — housing loan interest',
  Schedule80EEA: 'Schedule 80EEA — housing loan interest',
  Schedule80EEB: 'Schedule 80EEB — electric-vehicle loan interest',
  ScheduleAMT: 'Schedule AMT (Computation tab)',
  ScheduleAMTC: 'Schedule AMTC (Computation tab)',
  ScheduleSPI: 'Income of other persons included in computation (Info tab)',
  ScheduleSI: 'Schedule SI — income chargeable at special rates',
  ScheduleEI: 'Schedule EI — exempt income',
  SchedulePTI: 'Pass through income u/s 115U / 115UA / 115UB (Info tab)',
  ScheduleFSI: 'Schedule FSI — income from outside India',
  ScheduleTR1: 'Schedule TR — tax relief for taxes paid outside India',
  ScheduleFA: 'Foreign assets schedules (Info tab)',
  Schedule5A2014: 'Schedule 5A — apportionment under the Portuguese Civil Code',
  ScheduleAL: 'Schedule AL — assets and liabilities (Info tab)',
  'PartB-TI': 'Part B-TI (Summary tab)',
  PartB_TTI: 'Part B-TTI (Summary tab)',
  ScheduleIT: 'Advance tax / self-assessment tax payments (Summary tab)',
  ScheduleTDS1: 'TDS on salary (Summary tab)',
  ScheduleTDS2: 'TDS other than salary (Summary tab)',
  ScheduleTDS3: 'TDS u/s 194IA / 194IB / 194M / 194S (Summary tab)',
  ScheduleTCS: 'TCS (Summary tab)',
  ScheduleESOP: 'Tax deferred on sweat-equity shares / securities (Info tab)',
  TaxReturnPreparer: 'Tax return preparer details',
};

const ACRONYMS = /^(PAN|TAN|TIN|DIN|IFSC|IBAN|SWIFT|DOB|AY|FY|ITR|HUF|TDS|TCS|LTCG|STCG|VDA|ESOP|AMT|GTI|PRAN|UDID|ARN|BSR|LEI|CGAS|DTAA|NRI|HP|OS|CG|SI|EI|FA|AL|CFL|CYLA|BFLA|VIA|PTI|SPI|FSI|TR|IT)$/;

/** camelCase / PascalCase → spaced words, keeping known acronyms intact. */
function humanise(seg: string): string {
  const bare = seg.replace(/\[\d+\]$/, '');
  if (ACRONYMS.test(bare)) return bare;
  const spaced = bare
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Path with array indices normalised, e.g. "…Salaries[2].Salarys" → "…Salaries[].Salarys". */
function generic(path: string): string {
  return path.replace(/\[\d+\]/g, '[]');
}

function labelFor(path: string): string {
  const gen = generic(path);
  const explicit = LABELS[gen];
  const idx = path.match(/\[(\d+)\]/g);
  const suffix = idx && idx.length ? ` (row ${idx.map((s) => String(Number(s.slice(1, -1)) + 1)).join('/')})` : '';
  if (explicit) return explicit + suffix;
  const segs = gen.split('.').filter((s) => s !== 'ITR' && s !== 'ITR2');
  const tail = segs.slice(-2).map(humanise).filter(Boolean);
  const leaf = tail.length > 1 && tail[0] !== tail[1] ? `${tail[1]} — ${tail[0]}` : tail[tail.length - 1] || gen;
  return leaf + suffix;
}

function hintFor(path: string): string | undefined {
  const m = /^ITR\.ITR2\.([^.[]+)/.exec(path);
  return m ? HINTS[m[1]] : undefined;
}

/* ── Required-tree walk ────────────────────────────────────────────────────── */

const MAX_MISSING = 3000;

function addMissing(out: MissingField[], path: string): void {
  if (out.length >= MAX_MISSING) return;
  const hint = hintFor(path);
  out.push(hint ? { path, label: labelFor(path), hint } : { path, label: labelFor(path) });
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}

function walkTree(spec: ReqMap, value: unknown, prefix: string, out: MissingField[], depth: number): void {
  if (depth > 24 || out.length >= MAX_MISSING) return;
  const obj = asRecord(value);
  for (const key of Object.keys(spec)) {
    const node = spec[key];
    const path = prefix ? `${prefix}.${key}` : key;
    const v = obj ? obj[key] : undefined;

    if (node === 1) {
      if (isEmpty(v)) addMissing(out, path);
      continue;
    }
    const required = node.r === 1;
    const present = !isEmpty(v);

    if (!present) {
      if (!required) continue;              // optional branch absent → nothing to enforce
      addMissing(out, path);
      // Recurse with an empty container so the CA sees the whole missing sub-block,
      // except for arrays where a single "row(s) absent" entry is the useful message.
      if (!node.a && node.c) walkTree(node.c, undefined, path, out, depth + 1);
      continue;
    }
    if (!node.c) continue;
    if (node.a) {
      const rows = Array.isArray(v) ? v : [v];
      for (let i = 0; i < rows.length; i++) walkTree(node.c, rows[i], `${path}[${i}]`, out, depth + 1);
      continue;
    }
    walkTree(node.c, v, path, out, depth + 1);
  }
}

/** Number of required leaves + required branches the embedded tree enforces. */
function countRequired(spec: ReqMap): number {
  let n = 0;
  const stack: ReqMap[] = [spec];
  let guard = 0;
  while (stack.length && guard++ < 20000) {
    const cur = stack.pop() as ReqMap;
    for (const k of Object.keys(cur)) {
      const node = cur[k];
      if (node === 1) { n++; continue; }
      if (node.r === 1) n++;
      if (node.c) stack.push(node.c);
    }
  }
  return n;
}

export const requiredPathCount: number = countRequired(ROOT);

/* ── Small typed accessors used by the Category-A rules ────────────────────── */

function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim() !== '') { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  return 0;
}
function toStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}
function toArr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return [v];
  return [];
}
function isDate(s: string): boolean {
  return /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s);
}
/** Sum a set of sibling numeric fields on an object. */
function sumOf(obj: unknown, keys: string[]): number {
  const rec = asRecord(obj);
  if (!rec) return 0;
  let t = 0;
  for (const k of keys) t += toNum(rec[k]);
  return t;
}
/** Recursively add every finite number found under a node (used for "is anything filled"). */
function anyNumeric(v: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.some((x) => anyNumeric(x, depth + 1));
  const rec = asRecord(v);
  if (!rec) return false;
  return Object.keys(rec).some((k) => anyNumeric(rec[k], depth + 1));
}

/* ── The checker ───────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  const report = (): MandatoryReport => ({
    form: FORM,
    ay: AY,
    schemaVersion: SCHEMA_VERSION,
    missing,
    errors,
    warnings,
    ok: missing.length === 0 && errors.length === 0,
  });

  try {
    /* 1 ── schema-required fields ------------------------------------------------ */
    walkTree(ROOT, json, '', missing, 0);

    const body = asRecord(at(json, 'ITR.ITR2'));
    if (!body) {
      if (!missing.some((m) => m.path === 'ITR' || m.path === 'ITR.ITR2')) {
        addMissing(missing, 'ITR.ITR2');
      }
      return report();
    }

    /* Path helpers rooted at ITR.ITR2 */
    const P = 'ITR.ITR2.';
    const raw = (p: string): unknown => at(json, P + p);
    const num = (p: string): number => toNum(raw(p));
    const str = (p: string): string => toStr(raw(p));
    const rows = (p: string): unknown[] => toArr(raw(p));
    const has = (p: string): boolean => !isEmpty(raw(p));

    const err = (path: string, msg: string, rule: string): void => {
      errors.push({ path: P + path, msg, rule });
    };
    const warn = (path: string, msg: string, rule?: string): void => {
      warnings.push(rule ? { path: P + path, msg, rule } : { path: P + path, msg });
    };

    /* 2 ── identity / header sanity (schema patterns & enums) -------------------- */

    const pan = str('PartA_GEN1.PersonalInfo.PAN');
    const verPan = str('Verification.Declaration.AssesseeVerPAN');
    const status = str('PartA_GEN1.PersonalInfo.Status');          // I | H
    const isHUF = status === 'H';
    const isIndividual = status === 'I';
    const resStatus = str('PartA_GEN1.FilingStatus.ResidentialStatus'); // RES | NRI | NOR
    const isNonResident = resStatus === 'NRI';
    const isResident = resStatus === 'RES' || resStatus === 'NOR';
    const optOut = str('PartA_GEN1.FilingStatus.OptOutNewTaxRegime').toUpperCase();
    const oldRegime = optOut === 'Y';
    const newRegime = optOut === 'N';
    const fileSec = toNum(raw('PartA_GEN1.FilingStatus.ReturnFileSec'));
    const capacity = str('Verification.Capacity');
    const dob = str('PartA_GEN1.PersonalInfo.DOB');
    const totalIncome = num('PartB-TI.TotalIncome');
    const gti = num('PartB-TI.GrossTotalIncome');

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      err('PartA_GEN1.PersonalInfo.PAN', `PAN "${pan}" does not match the mandatory format AAAAA9999A.`, 'SCHEMA/PAN');
    }
    if (verPan && !/^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/.test(verPan)) {
      err('Verification.Declaration.AssesseeVerPAN',
        `PAN at Verification "${verPan}" must be a personal PAN (4th character "P") as required by the schema.`,
        'SCHEMA/VerPAN');
    }
    const formName = str('Form_ITR2.FormName');
    if (formName && formName !== 'ITR-2') {
      err('Form_ITR2.FormName', `Form name must be "ITR-2" (found "${formName}").`, 'SCHEMA/FormName');
    }
    const formAy = str('Form_ITR2.AssessmentYear');
    if (formAy && formAy !== '2026') {
      err('Form_ITR2.AssessmentYear', `Assessment year in the form header must be "2026" for AY 2026-27 (found "${formAy}").`, 'SCHEMA/AY');
    }
    for (const k of ['SchemaVer', 'FormVer'] as const) {
      const v = str(`Form_ITR2.${k}`);
      if (v && v !== 'Ver1.0') {
        err(`Form_ITR2.${k}`, `${k} must be "Ver1.0" for the AY 2026-27 ITR-2 schema (found "${v}").`, 'SCHEMA/Ver');
      }
    }
    if (status && status !== 'I' && status !== 'H') {
      err('PartA_GEN1.PersonalInfo.Status', 'Status must be "I" (Individual) or "H" (HUF) for ITR-2.', 'SCHEMA/Status');
    }
    if (capacity && !['S', 'R', 'K', 'A'].includes(capacity)) {
      err('Verification.Capacity', 'Capacity of the verifier must be S (Self), R (Representative), K (Karta) or A (Authorised signatory).', 'SCHEMA/Capacity');
    }
    const dueDate = str('PartA_GEN1.FilingStatus.ItrFilingDueDate');
    if (dueDate && dueDate !== DUE_DATE_139_1) {
      warn('PartA_GEN1.FilingStatus.ItrFilingDueDate',
        `The schema fixes the s.139(1) due date for AY 2026-27 at ${DUE_DATE_139_1} (found "${dueDate}").`, 'SCHEMA/DueDate');
    }

    /* A1 — valid mobile number */
    const mobile = toStr(raw('PartA_GEN1.PersonalInfo.Address.MobileNo'));
    if (mobile && !/^[1-9][0-9]{4,9}$/.test(mobile)) {
      err('PartA_GEN1.PersonalInfo.Address.MobileNo',
        'Assessee should enter a valid mobile number (5 to 10 digits, not starting with 0).', 'A1');
    }
    const email = str('PartA_GEN1.PersonalInfo.Address.EmailAddress');
    if (email && !/^[.\w-]+@[\w-]+(\.[\w-]+)+$/.test(email)) {
      err('PartA_GEN1.PersonalInfo.Address.EmailAddress', 'E-mail address is not in a valid format.', 'SCHEMA/Email');
    }

    /* A652 — date of birth/formation must precede 01/04 of the assessment year */
    if (dob && isDate(dob) && dob >= '2026-04-01') {
      err('PartA_GEN1.PersonalInfo.DOB',
        'The date of birth / formation should be before 01/04/2026 for AY 2026-27.', 'A652');
    }

    /* 3 ── Part A General: conditional-mandatory blocks --------------------------- */

    /* A5 — unlisted equity shares held */
    if (str('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg').toUpperCase() === 'Y') {
      const dtls = rows('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls');
      if (!dtls.length) {
        err('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls',
          '"Held unlisted equity shares during the previous year" is Yes — the share-wise details must be filled.', 'A5');
      }
    }

    /* A10 — directorship in a company */
    if (str('PartA_GEN1.FilingStatus.CompDirectorPrvYrFlg').toUpperCase() === 'Y') {
      const dtls = rows('PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls');
      if (!dtls.length) {
        err('PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls',
          '"Were you a Director in a company during the previous year" is Yes — the company-wise details must be filled.', 'A10');
      }
      dtls.forEach((r, i) => {
        const rec = asRecord(r) || {};
        if (isEmpty(rec.DIN)) {
          err(`PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls[${i}].DIN`,
            'DIN of the directorship is required when directorship details are furnished.', 'A10');
        }
      });
    }

    /* A7 / A457 — representative assessee */
    const repFlag = str('PartA_GEN1.FilingStatus.AsseseeRepFlg').toUpperCase();
    const repNeeded = repFlag === 'Y' || capacity === 'R';
    if (repNeeded) {
      const repRule = capacity === 'R' && repFlag !== 'Y' ? 'A457' : 'A7';
      for (const [f, lbl] of [['RepName', 'Name'], ['RepEmailID', 'e-mail ID'], ['RepMobileNo', 'contact number']] as const) {
        if (isEmpty(raw(`PartA_GEN1.FilingStatus.AssesseeRep.${f}`))) {
          err(`PartA_GEN1.FilingStatus.AssesseeRep.${f}`,
            `${lbl} of the representative assessee is mandatory when the return is filed by / verified in the capacity of a representative assessee.`, repRule);
        }
      }
      /* A747 — representative contact must differ from the taxpayer's */
      const repMail = str('PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID').toLowerCase();
      const repMob = toStr(raw('PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo'));
      if (repMail && email && repMail === email.toLowerCase()) {
        err('PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID',
          "E-mail ID of the representative assessee must not be the same as the taxpayer's e-mail ID.", 'A747');
      }
      if (repMob && mobile && repMob === mobile) {
        err('PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo',
          "Contact number of the representative assessee must not be the same as the taxpayer's contact number.", 'A747');
      }
    }

    /* A9 — seventh proviso to s.139(1) */
    if (str('PartA_GEN1.FilingStatus.SeventhProvisio139').toUpperCase() === 'Y') {
      const flags = ['DepAmtAggAmtExcd1CrPrYrFlg', 'IncrExpAggAmt2LkTrvFrgnCntryFlg', 'IncrExpAggAmt1LkElctrctyPrYrFlg'];
      const amts = ['AmtSeventhProvisio139i', 'AmtSeventhProvisio139ii', 'AmtSeventhProvisio139iii'];
      const anyYes = flags.some((f) => str(`PartA_GEN1.FilingStatus.${f}`).toUpperCase() === 'Y');
      const anyAmt = amts.some((a) => num(`PartA_GEN1.FilingStatus.${a}`) > 0);
      if (!anyYes && !anyAmt) {
        err('PartA_GEN1.FilingStatus.SeventhProvisio139',
          'Return is filed under the seventh proviso to s.139(1) — at least one of the three conditions (deposits > 1 cr / foreign travel > 2 L / electricity > 1 L) and its amount must be filled.', 'A9');
      }
      for (let i = 0; i < 3; i++) {
        if (str(`PartA_GEN1.FilingStatus.${flags[i]}`).toUpperCase() === 'Y' && num(`PartA_GEN1.FilingStatus.${amts[i]}`) <= 0) {
          err(`PartA_GEN1.FilingStatus.${amts[i]}`,
            'The amount for the selected seventh-proviso condition must be filled.', 'A9');
        }
      }
    }

    /* A13 — clause (iv) of the seventh proviso */
    if (str('PartA_GEN1.FilingStatus.clauseiv7provisio139i').toUpperCase() === 'Y') {
      const dtls = rows('PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls');
      if (!dtls.length) {
        err('PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls',
          'Return filed under clause (iv) of the seventh proviso to s.139(1) — nature and amount must be filled.', 'A13');
      }
      dtls.forEach((r, i) => {
        const rec = asRecord(r) || {};
        if (isEmpty(rec.clauseiv7provisio139iNature)) {
          err(`PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls[${i}].clauseiv7provisio139iNature`,
            'Nature of the clause (iv) condition must be selected.', 'A13');
        }
        if (toNum(rec.clauseiv7provisio139iAmount) <= 0) {
          err(`PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls[${i}].clauseiv7provisio139iAmount`,
            'Amount must be filled against the selected clause (iv) condition.', 'A13');
        }
      });
    }

    /* A16 — notice / order particulars.  ReturnFileSec: 13=142(1), 14=148, 16=153C,
       18=139(9), 19=92CD, 20=119(2)(b). */
    if ([13, 14, 16, 18, 19, 20].includes(fileSec)) {
      if (isEmpty(raw('PartA_GEN1.FilingStatus.NoticeNo'))) {
        err('PartA_GEN1.FilingStatus.NoticeNo',
          'Return filed in response to a notice / order — the unique number (DIN) of the notice or order is mandatory.', 'A16');
      }
      if (isEmpty(raw('PartA_GEN1.FilingStatus.NoticeDate'))) {
        err('PartA_GEN1.FilingStatus.NoticeDate',
          'Return filed in response to a notice / order — the date of the notice or order is mandatory.', 'A16');
      }
    }
    /* Revised return u/s 139(5) — original acknowledgement particulars */
    if (fileSec === 17) {
      if (isEmpty(raw('PartA_GEN1.FilingStatus.ReceiptNo'))) {
        err('PartA_GEN1.FilingStatus.ReceiptNo',
          'Revised return u/s 139(5) — acknowledgement number of the original return is mandatory.', 'A4');
      }
      if (isEmpty(raw('PartA_GEN1.FilingStatus.OrigRetFiledDate'))) {
        err('PartA_GEN1.FilingStatus.OrigRetFiledDate',
          'Revised return u/s 139(5) — date of filing of the original return is mandatory.', 'A4');
      }
    }

    /* A18 / A19 / A21 / A550 — old regime is not available on a belated return */
    if (oldRegime && fileSec === 12) {
      err('PartA_GEN1.FilingStatus.OptOutNewTaxRegime',
        'Opting out of the new tax regime is not available after the due date of filing u/s 139(1) — the return is filed u/s 139(4).', 'A21');
    }

    /* A15 / A20 — FII / FPI */
    const fiiFlag = str('PartA_GEN1.FilingStatus.FiiFpiFlag').toUpperCase();
    if (has('Schedule115AD') && fiiFlag !== 'Y') {
      err('PartA_GEN1.FilingStatus.FiiFpiFlag',
        '"Whether you are FPI?" must be Yes to enable Schedule 115AD(1)(b)(iii)-Proviso.', 'A15');
    }
    if (fiiFlag === 'Y' && isResident) {
      err('PartA_GEN1.FilingStatus.FiiFpiFlag',
        'Residents and residents but not ordinarily resident cannot be FII / FPI.', 'A20');
    }
    if (fiiFlag === 'Y' && isEmpty(raw('PartA_GEN1.FilingStatus.SebiRegnNo'))) {
      err('PartA_GEN1.FilingStatus.SebiRegnNo', 'SEBI registration number is required when the assessee is an FII / FPI.', 'A15');
    }

    /* A6 / A14 / A449 — Portuguese Civil Code, s.5A */
    const pcc = str('PartA_GEN1.FilingStatus.PortugeseCC5A').toUpperCase();
    const sch5A = raw('Schedule5A2014');
    if (pcc === 'Y') {
      if (isEmpty(sch5A)) {
        err('Schedule5A2014',
          '"Governed by the Portuguese Civil Code u/s 5A" is Yes — Schedule 5A is mandatory.', 'A6');
      } else if (isEmpty(at(sch5A, 'PANOfSpouse'))) {
        err('Schedule5A2014.PANOfSpouse',
          'The assessee is governed by the Portuguese Civil Code — PAN of the spouse must be provided in Schedule 5A.', 'A449');
      }
      if (!isEmpty(sch5A) && isEmpty(at(sch5A, 'NameOfSpouse'))) {
        err('Schedule5A2014.NameOfSpouse', 'Name of the spouse is mandatory in Schedule 5A.', 'A449');
      }
      const spousePan = toStr(at(sch5A, 'PANOfSpouse'));
      if (spousePan && pan && spousePan === pan) {
        err('Schedule5A2014.PANOfSpouse', 'PAN of the spouse in Schedule 5A cannot be the same as the assessee PAN.', 'A449');
      }
    } else if (!isEmpty(sch5A)) {
      err('Schedule5A2014',
        '"Governed by the Portuguese Civil Code u/s 5A" is not Yes — Schedule 5A should not be filed.', 'A14');
    }

    /* A83 / A153 / A154 / A155 — benefit u/s 115H */
    const benefit115H = str('PartA_GEN1.FilingStatus.BenefitUs115HFlg').toUpperCase();
    if (isResident && isIndividual && benefit115H === '') {
      warn('PartA_GEN1.FilingStatus.BenefitUs115HFlg',
        'Being a resident / resident but not ordinarily resident individual, the question "Do you want to claim the benefit u/s 115H?" should be answered.', 'A83');
    }
    if (isResident && benefit115H !== 'Y') {
      if (anyNumeric(raw('ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115'))) {
        err('ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115',
          'A resident cannot claim the benefit u/s 112(1)(c) / 115AC in Schedule CG (Sl. No. B5) without having exercised the option u/s 115H.', 'A153');
      }
      if (anyNumeric(raw('ScheduleOS.DividendIncUs115AC'))) {
        err('ScheduleOS.DividendIncUs115AC',
          'A resident cannot claim the tax benefit u/s 115AC in Schedule OS without having exercised the option u/s 115H.', 'A154');
      }
    }

    /* 4 ── Verification ---------------------------------------------------------- */
    if (capacity === 'K' && !isHUF) {
      err('Verification.Capacity', 'Capacity "Karta" can be used only when the status is HUF.', 'A17');
    }
    if (isHUF && capacity === 'S') {
      warn('Verification.Capacity', 'For a HUF the return is normally verified by the Karta (capacity "K").', 'A17');
    }
    if (pan && verPan && capacity === 'S' && pan !== verPan) {
      err('Verification.Declaration.AssesseeVerPAN',
        'When the return is verified in the capacity of "Self", the PAN at Verification must be the same as the PAN of the assessee.', 'A8');
    }

    /* 5 ── Schedule S — salary ---------------------------------------------------- */
    const salaries = rows('ScheduleS.Salaries');
    salaries.forEach((r, i) => {
      const rec = asRecord(r) || {};
      const tan = toStr(rec.TANofEmployer);
      if (tan && !/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(tan)) {
        err(`ScheduleS.Salaries[${i}].TANofEmployer`,
          `TAN "${tan}" is invalid — the first four characters must be alphabets, followed by 5 digits and one alphabet.`, 'A11');
      }
    });
    /* A605 — table 10(13A) must be filled when HRA exemption is claimed */
    const exemptRows = rows('ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls');
    const hra = exemptRows.reduce<number>((t, r) => {
      const rec = asRecord(r) || {};
      return toStr(rec.SalNatureDesc) === '10(13A)' ? t + toNum(rec.SalOthAmount) : t;
    }, 0);
    if (hra > 0 && isEmpty(raw('ScheduleS.Section10_13A'))) {
      err('ScheduleS.Section10_13A',
        'Table 10(13A) of Schedule Salary must be filled to claim the exempt allowance u/s 10(13A).', 'A605');
    }
    if (hra > 0 && newRegime) {
      err('ScheduleS.AllwncExemptUs10',
        'Under the new tax regime the exempt allowance u/s 10(13A) (house rent allowance) cannot be claimed.', 'A54');
    }
    /* A57 / A58 — s.16(ii) & s.16(iii) barred under the new regime */
    if (newRegime && num('ScheduleS.EntertainmntalwncUs16ii') > 0) {
      err('ScheduleS.EntertainmntalwncUs16ii', 'Under the new tax regime, entertainment allowance u/s 16(ii) cannot be claimed.', 'A57');
    }
    if (newRegime && num('ScheduleS.ProfessionalTaxUs16iii') > 0) {
      err('ScheduleS.ProfessionalTaxUs16iii', 'Under the new tax regime, professional tax u/s 16(iii) cannot be claimed.', 'A58');
    }
    /* A37 — professional tax capped at Rs. 5,000 */
    if (num('ScheduleS.ProfessionalTaxUs16iii') > 5000) {
      err('ScheduleS.ProfessionalTaxUs16iii', 'Professional tax u/s 16(iii) is allowable only to the extent of Rs. 5,000.', 'A37');
    }
    /* A40 / A596 — standard deduction ceiling */
    const stdDed = num('ScheduleS.DeductionUnderSection16ia');
    const netSalary = num('ScheduleS.NetSalary');
    const stdCap = newRegime ? 75000 : 50000;
    if (stdDed > 0 && stdDed > Math.min(stdCap, Math.max(netSalary, 0))) {
      err('ScheduleS.DeductionUnderSection16ia',
        `Standard deduction cannot exceed the lower of Rs. ${stdCap.toLocaleString('en-IN')} and net salary.`,
        newRegime ? 'A596' : 'A40');
    }
    /* A59 — HUF cannot claim relief u/s 89A */
    if (isHUF && (num('ScheduleS.Increliefus89A') > 0 || num('ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS') > 0)) {
      err('ScheduleS.Increliefus89A', 'A HUF cannot claim income for relief from taxation u/s 89A.', 'A59');
    }
    /* A65 / A232 — one country cannot repeat in the s.89A country table */
    const c89a = rows('ScheduleS.Salaries').flatMap((r) => toArr((asRecord(r) || {}).IncomeNotified89AType));
    const seen89a = new Set<string>();
    c89a.forEach((r) => {
      const cc = toStr((asRecord(r) || {}).NOT89ACountrycode);
      if (!cc) return;
      if (seen89a.has(cc)) {
        err('ScheduleS.Salaries[].Salarys.IncomeNotified89AType',
          `Country code "${cc}" is selected more than once under "Income from retirement benefit account maintained in a notified country u/s 89A".`, 'A65');
      }
      seen89a.add(cc);
    });

    /* 6 ── Schedule HP — house property ------------------------------------------ */
    const props = rows('ScheduleHP.PropertyDetails');
    props.forEach((r, i) => {
      const rec = asRecord(r) || {};
      const base = `ScheduleHP.PropertyDetails[${i}]`;
      const coOwned = toStr(rec.PropCoOwnedFlg).toUpperCase();
      const share = toNum(rec.AsseseeShareProperty);
      const coOwners = toArr(rec.CoOwners);
      const rent = asRecord(rec.Rentdetails) || {};
      const alv = toNum(rent.AnnualLetableValue);
      const interest = toNum(rent.IntOnBorwCap);
      const letOut = toStr(rec.ifLetOut).toUpperCase();

      /* A549 — co-owned property */
      if (coOwned === 'YES') {
        if (isEmpty(rec.AsseseeShareProperty)) {
          err(`${base}.AsseseeShareProperty`,
            "The property is co-owned — the assessee's percentage share in the property is mandatory.", 'A549');
        }
        if (!coOwners.length) {
          err(`${base}.CoOwners`, 'The property is co-owned — the name and PAN of the co-owner(s) are mandatory.', 'A549');
        }
        /* A751 */
        if (share >= 100) {
          err(`${base}.AsseseeShareProperty`,
            "Where the property is co-owned, the assessee's percentage share must be less than 100%.", 'A751');
        }
        let total = share;
        coOwners.forEach((c, j) => {
          const co = asRecord(c) || {};
          const cShare = toNum(co.PercentShareProperty);
          total += cShare;
          if (isEmpty(co.NameCoOwner)) {
            err(`${base}.CoOwners[${j}].NameCoOwner`, 'Name of the co-owner is mandatory.', 'A549');
          }
          if (isEmpty(co.PAN_CoOwner) && isEmpty(co.Aadhaar_CoOwner)) {
            err(`${base}.CoOwners[${j}].PAN_CoOwner`, 'PAN (or Aadhaar) of the co-owner is mandatory.', 'A549');
          }
          /* A752 */
          if (!(cShare > 0 && cShare < 100)) {
            err(`${base}.CoOwners[${j}].PercentShareProperty`,
              'Percentage share of the other co-owner(s) must be greater than 0% and less than 100%.', 'A752');
          }
          /* A82 */
          const cPan = toStr(co.PAN_CoOwner);
          if (cPan && pan && cPan === pan) {
            err(`${base}.CoOwners[${j}].PAN_CoOwner`,
              "In a co-owned house property, the assessee's PAN and the co-owner's PAN cannot be the same.", 'A82');
          }
        });
        /* A68 */
        if (Math.abs(total - 100) > 0.5) {
          err(`${base}.AsseseeShareProperty`,
            `In a co-owned house property the assessee's share and the co-owner(s)' share must total 100% (found ${total}%).`, 'A68');
        }
        /* A70 */
        if (share === 0 && interest > 0) {
          err(`${base}.Rentdetails.IntOnBorwCap`,
            "Interest on borrowed capital cannot be claimed when the assessee's share of the co-owned property is zero.", 'A70');
        }
      } else if (coOwned === 'NO' && !isEmpty(rec.AsseseeShareProperty) && share !== 100) {
        /* A753 */
        err(`${base}.AsseseeShareProperty`,
          "Where the property is not co-owned, the assessee's share must be 100%.", 'A753');
      }

      /* A74 — let-out / deemed let-out must carry gross rent */
      if ((letOut === 'L' || letOut === 'D') && alv <= 0) {
        err(`${base}.Rentdetails.AnnualLetableValue`,
          'Where the type of property is let out or deemed let out, the gross rent received / receivable / lettable value must be more than zero.', 'A74');
      }
      /* A71 — municipal tax not allowed on a nil annual value */
      if (alv <= 0 && toNum(rent.LocalTaxes) > 0) {
        err(`${base}.Rentdetails.LocalTaxes`,
          'Municipal tax is not allowed where the gross rent received / receivable / lettable value is zero or null.', 'A71');
      }
      /* A757 — unrealised rent ceiling */
      if (toNum(rent.RentNotRealized) > alv) {
        err(`${base}.Rentdetails.RentNotRealized`,
          'The amount of rent which cannot be realised cannot exceed the gross rent received / receivable during the year.', 'A757');
      }
      /* A67 — 30% standard deduction */
      const balAlv = toNum(rent.AnnualOfPropOwned);
      const thirty = toNum(rent.ThirtyPercentOfBalance);
      if (balAlv > 0 && Math.abs(thirty - Math.round(balAlv * 0.3)) > 1) {
        err(`${base}.Rentdetails.ThirtyPercentOfBalance`,
          'Standard deduction on house property must be 30% of the annual value.', 'A67');
      }
      /* A653 / A610 — s.24(b) loan particulars */
      if (interest > 0) {
        const loans = toArr(at(rent.Section24B, 'Section24BDtls'));
        if (!loans.length) {
          err(`${base}.Rentdetails.Section24B.Section24BDtls`,
            'Details of interest on borrowed capital u/s 24(b) are mandatory to claim the deduction.', 'A653');
        }
        loans.forEach((l, j) => {
          const lo = asRecord(l) || {};
          for (const [f, lbl] of [['LoanTknFrom', 'lender type'], ['BankOrInstnName', 'name of the bank / institution'],
            ['LoanAccNoOfBankOrInstnRefNo', 'loan account number'], ['DateofLoan', 'date of loan']] as const) {
            if (isEmpty(lo[f])) {
              err(`${base}.Rentdetails.Section24B.Section24BDtls[${j}].${f}`,
                `Details of the loan taken (${lbl}) must be provided in Table 24(b) of Schedule HP.`, 'A610');
            }
          }
        });
      }
      /* A72 — self-occupied interest ceiling under the old regime */
      if (oldRegime && letOut === 'S' && interest > 200000) {
        err(`${base}.Rentdetails.IntOnBorwCap`,
          'Interest on borrowed capital for a self-occupied property cannot exceed Rs. 2,00,000 under the old tax regime.', 'A72');
      }
      /* A81 / A609 — no self-occupied interest under the new regime */
      if (newRegime && letOut === 'S' && interest > 0) {
        err(`${base}.Rentdetails.IntOnBorwCap`,
          'Under the new tax regime, interest on borrowed capital cannot be claimed for a self-occupied house property.', 'A81');
      }
    });
    /* A80 — at most two self-occupied properties */
    const selfOccupied = props.filter((r) => toStr((asRecord(r) || {}).ifLetOut).toUpperCase() === 'S').length;
    if (selfOccupied > 2) {
      err('ScheduleHP.PropertyDetails',
        'More than two houses are claimed to be self-occupied — interest on borrowed capital cannot be claimed for more than two self-occupied properties.', 'A80');
    }

    /* 7 ── Schedule CG / 112A / 115AD / VDA --------------------------------------- */
    const ltLandBuild = toArr(at(raw('ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild'), 'SaleofLandBuildDtls'));
    ltLandBuild.forEach((r, i) => {
      const rec = asRecord(r) || {};
      const base = `ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls[${i}]`;
      const consid = toNum(rec.FullConsideration) + toNum(rec.PropertyValuation) + toNum(rec.FullConsideration50C);
      const sale = toStr(rec.DateofSale);
      const purch = toStr(rec.DateofPurchase);
      if (consid > 0) {
        if (!sale) err(`${base}.DateofSale`, 'Date of sale is mandatory when the full value of consideration at B(1) is more than zero.', 'A182');
        if (!purch) err(`${base}.DateofPurchase`, 'Date of purchase is mandatory when the full value of consideration at B(1) is more than zero.', 'A183');
      }
      /* A750 */
      if (sale && isDate(sale) && (sale > FY_END || sale < FY_START)) {
        err(`${base}.DateofSale`,
          `Date of sale / transfer of land or building must fall within ${FY_START} to ${FY_END} for AY 2026-27.`, 'A750');
      }
      /* A184 — long-term requires a 24-month holding period */
      if (sale && purch && isDate(sale) && isDate(purch)) {
        const months = (Number(sale.slice(0, 4)) - Number(purch.slice(0, 4))) * 12 +
          (Number(sale.slice(5, 7)) - Number(purch.slice(5, 7)));
        if (months < 24) {
          err(`${base}.DateofPurchase`,
            'The date of purchase is less than 24 months before the date of sale — the gain does not qualify as long-term capital gain.', 'A184');
        }
      }
      /* A186 — year of improvement */
      const imps = toArr(at(rec.CostOfImprovements, 'CostOfImprovementsDtls'));
      imps.forEach((im, j) => {
        const rw = asRecord(im) || {};
        if (toNum(rw.ImproveCost) > 0 && isEmpty(rw.ImproveDate)) {
          err(`${base}.CostOfImprovements.CostOfImprovementsDtls[${j}].ImproveDate`,
            "The year of improvement is mandatory when cost of improvement is declared in Schedule CG B1 'From sale of land or building or both'.", 'A186');
        }
      });
      /* A570 — indexation not available to non-residents */
      if (isNonResident && toNum(rec.AquisitCostIndex) > 0) {
        err(`${base}.AquisitCostIndex`, 'Indexation is not allowed in the case of non-residents.', 'A570');
      }
    });
    const stLandBuild = toArr(at(raw('ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild'), 'SaleofLandBuildDtls'));
    stLandBuild.forEach((r, i) => {
      const rec = asRecord(r) || {};
      const sale = toStr(rec.DateofSale);
      if (sale && isDate(sale) && (sale > FY_END || sale < FY_START)) {
        err(`ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls[${i}].DateofSale`,
          `Date of sale / transfer of land or building at A1 must fall within ${FY_START} to ${FY_END} for AY 2026-27.`, 'A750');
      }
      const purch = toStr(rec.DateofPurchase);
      if (sale && purch && isDate(sale) && isDate(purch)) {
        const months = (Number(sale.slice(0, 4)) - Number(purch.slice(0, 4))) * 12 +
          (Number(sale.slice(5, 7)) - Number(purch.slice(5, 7)));
        if (months >= 24) {
          err(`ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls[${i}].DateofPurchase`,
            'The date of purchase is more than 24 months before the date of sale — the gain does not qualify as short-term capital gain.', 'A185');
        }
      }
    });

    /* A591 — s.54EC investment ceiling */
    toArr(at(raw('ScheduleCGFor23.DeducClaimInfo'), 'DeducClaimDtlsUs54EC')).forEach((r, i) => {
      const rec = asRecord(r) || {};
      const amt = toNum(rec.AmtInvested ?? rec.AmtDeducClaim ?? rec.Amount);
      if (amt > 5000000) {
        err(`ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54EC[${i}]`,
          'The amount invested for the deduction u/s 54EC cannot exceed Rs. 50,00,000.', 'A591');
      }
    });

    /* A177 / A187 — Schedule 112A vs Schedule 115AD(1)(b)(iii) proviso */
    const b3a = num('ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCG');
    const sch112ATotal = num('Schedule112A.TotalBalance112A');
    if (b3a > 0 && !has('Schedule112A')) {
      err('Schedule112A',
        'LTCG u/s 112A is offered in Schedule CG (B3a) — Schedule 112A must be filled.', 'A177');
    }
    if (has('Schedule112A') && b3a > 0 && Math.abs(sch112ATotal - b3a) > 1) {
      err('ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCG',
        'Schedule CG B3a (LTCG u/s 112A) must equal the total of Col. 14 of Schedule 112A.', 'A134');
    }
    const b6a = num('ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCG');
    const sch115ADTotal = num('Schedule115AD.TotalBalance115AD');
    if (b6a > 0 && !has('Schedule115AD')) {
      err('Schedule115AD',
        'LTCG u/s 112A for an FII is offered in Schedule CG (B6a) — Schedule 115AD(1)(b)(iii) proviso must be filled.', 'A187');
    }
    if (has('Schedule115AD') && b6a > 0 && sch115ADTotal > 0 && Math.abs(sch115ADTotal - b6a) > 1) {
      err('ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCG',
        'Schedule CG B6a must equal the total of Col. 14 of Schedule 115AD(1)(b)(iii) proviso.', 'A142');
    }
    /* A173 / A174 — "after 31.01.2018" rows must not carry FMV columns */
    const check112ARow = (r: unknown, i: number, sched: 'Schedule112A' | 'Schedule115AD', dtls: string) => {
      const rec = asRecord(r) || {};
      const acq = toStr(rec.ShareOnOrBefore).toUpperCase();
      if (acq === 'AF' || acq === 'AFTER' || acq === 'N') {
        for (const f of ['NumSharesUnits', 'SalePricePerShareUnit', 'FairMktValuePerShareunit', 'TotFairMktValueCapAst'] as const) {
          if (toNum(rec[f]) > 0) {
            err(`${sched}.${dtls}[${i}].${f}`,
              'Where the shares were acquired after 31st January 2018, the fair-market-value columns (4, 5, 10 and 11) cannot be greater than zero.',
              sched === 'Schedule112A' ? 'A173' : 'A174');
          }
        }
      }
    };
    rows('Schedule112A.Schedule112ADtls').forEach((r, i) => check112ARow(r, i, 'Schedule112A', 'Schedule112ADtls'));
    rows('Schedule115AD.Schedule115ADDtls').forEach((r, i) => check112ARow(r, i, 'Schedule115AD', 'Schedule115ADDtls'));

    /* A749 — VDA dates within the financial year */
    rows('ScheduleVDA.ScheduleVDADtls').forEach((r, i) => {
      const rec = asRecord(r) || {};
      for (const f of ['DateofAcquisition', 'DateofTransfer'] as const) {
        const dt = toStr(rec[f]);
        if (dt && isDate(dt) && dt > FY_END) {
          err(`ScheduleVDA.ScheduleVDADtls[${i}].${f}`,
            `In Schedule VDA, the ${f === 'DateofTransfer' ? 'date of transfer' : 'date of acquisition'} cannot be after ${FY_END}.`, 'A749');
        }
      }
    });
    /* A179 — Schedule CG C2 must equal Schedule VDA total */
    const vdaTotal = num('ScheduleVDA.TotIncCapGain');
    const cgVda = num('ScheduleCGFor23.IncmFromVDATrnsf');
    if ((vdaTotal > 0 || cgVda > 0) && Math.abs(vdaTotal - cgVda) > 1) {
      err('ScheduleCGFor23.IncmFromVDATrnsf',
        'Schedule CG Sl. No. C2 (income from transfer of virtual digital assets) must equal Sl. No. B of Schedule VDA.', 'A179');
    }
    /* A100 / A178 — Schedule CG total */
    const sumCg = num('ScheduleCGFor23.SumOfCGIncm');
    const totCg = num('ScheduleCGFor23.TotScheduleCGFor23');
    if ((sumCg !== 0 || cgVda !== 0 || totCg !== 0) && Math.abs(totCg - (sumCg + cgVda)) > 1) {
      err('ScheduleCGFor23.TotScheduleCGFor23',
        'Schedule CG Sl. No. C3 (income chargeable under "Capital gains") must equal the sum of capital-gain incomes and income from transfer of virtual digital assets.', 'A178');
    }

    /* 8 ── Schedule OS ------------------------------------------------------------ */
    if (isHUF && num('ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS') > 0) {
      err('ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS', 'A HUF cannot claim relief from taxation u/s 89A.', 'A59');
    }
    /* A226 — s.89A relief only against s.89A income */
    if (num('ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS') >
      num('ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotified89AOS')) {
      err('ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS',
        'Income claimed for relief from taxation u/s 89A cannot exceed the income offered under "Income from retirement benefit account maintained in a notified country u/s 89A".', 'A224');
    }
    /* A192 — depreciation only against rental income from machinery/plant/building */
    const os = asRecord(raw('ScheduleOS.IncOthThanOwnRaceHorse')) || {};
    const deductions = asRecord(os.Deductions) || {};
    if (toNum(os.RentFromMachPlantBldgs) <= 0 && toNum(deductions.Depreciation) > 0) {
      err('ScheduleOS.IncOthThanOwnRaceHorse.Deductions.Depreciation',
        'Where rental income from machinery, plant, building etc. (Sl. No. 1c) is nil, depreciation (Sl. No. 3b) cannot be claimed.', 'A192');
    }
    /* A209 / A215 — deduction u/s 57(iia) against family pension */
    const ded57iia = toNum(deductions.Deductioniia);
    if (ded57iia > 0) {
      const familyPension = toNum(os.FamilyPension);
      if (familyPension <= 0) {
        err('ScheduleOS.IncOthThanOwnRaceHorse.Deductions.Deductioniia',
          'Deduction u/s 57(iia) can be claimed only if income is offered under "Family pension" in Schedule OS.', 'A209');
      } else if (oldRegime && ded57iia > Math.min(Math.floor(familyPension / 3), 15000) + 1) {
        err('ScheduleOS.IncOthThanOwnRaceHorse.Deductions.Deductioniia',
          'Under the old tax regime, deduction u/s 57(iia) cannot exceed the lower of one-third of family pension or Rs. 15,000.', 'A215');
      }
    }
    /* A216 — interest expenditure on dividend capped at 20% of dividend income */
    const divGross = toNum(os.DividendGross);
    const intOnDiv = toNum(deductions.ExpIncurredIntrstDividend ?? deductions.IntrstExpDividend);
    if (intOnDiv > 0 && intOnDiv > divGross * 0.2 + 1) {
      err('ScheduleOS.IncOthThanOwnRaceHorse.Deductions',
        'Interest expenditure on dividend u/s 57(1) cannot exceed 20% of the dividend income.', 'A216');
    }

    /* 9 ── Schedule VIA and the deduction schedules -------------------------------- */
    const via = asRecord(raw('ScheduleVIA.DeductUndChapVIA')) || {};
    const usr = asRecord(raw('ScheduleVIA.UsrDeductUndChapVIA')) || {};
    const claimed = (k: string): number => toNum(via[k]) || toNum(usr[k]);

    const s80C = claimed('Section80C');
    const s80CCC = claimed('Section80CCC');
    const s80CCD1 = claimed('Section80CCDEmployeeOrSE');
    const s80CCD1B = claimed('Section80CCD1B');
    const s80CCD2 = claimed('Section80CCDEmployer');
    const s80D = claimed('Section80D');
    const s80DD = claimed('Section80DD');
    const s80DDB = claimed('Section80DDB');
    const s80E = claimed('Section80E');
    const s80EE = claimed('Section80EE');
    const s80EEA = claimed('Section80EEA');
    const s80EEB = claimed('Section80EEB');
    const s80G = claimed('Section80G');
    const s80GG = claimed('Section80GG');
    const s80GGA = claimed('Section80GGA');
    const s80GGC = claimed('Section80GGC');
    const s80U = claimed('Section80U');
    const s80QQB = claimed('Section80QQB');
    const s80RRB = claimed('Section80RRB');
    const s80TTA = claimed('Section80TTA');
    const s80TTB = claimed('Section80TTB');
    const s80CCH = claimed('AnyOthSec80CCH');
    const totalVIA = toNum(via.TotalChapVIADeductions);

    /* A342 — the new regime bars every Chapter VI-A deduction except 80CCD(2) & 80CCH(2) */
    if (newRegime) {
      const barred: Array<[string, number]> = [
        ['Section80C', s80C], ['Section80CCC', s80CCC], ['Section80CCDEmployeeOrSE', s80CCD1],
        ['Section80CCD1B', s80CCD1B], ['Section80D', s80D], ['Section80DD', s80DD],
        ['Section80DDB', s80DDB], ['Section80E', s80E], ['Section80EE', s80EE],
        ['Section80EEA', s80EEA], ['Section80EEB', s80EEB], ['Section80G', s80G],
        ['Section80GG', s80GG], ['Section80GGA', s80GGA], ['Section80GGC', s80GGC],
        ['Section80QQB', s80QQB], ['Section80RRB', s80RRB], ['Section80TTA', s80TTA],
        ['Section80TTB', s80TTB], ['Section80U', s80U],
      ];
      for (const [k, v] of barred) {
        if (v > 0) {
          err(`ScheduleVIA.DeductUndChapVIA.${k}`,
            `Under the new tax regime u/s 115BAC, the deduction u/s ${k.replace(/^Section/, '').replace('CCDEmployeeOrSE', 'CCD(1)').replace('CCD1B', 'CCD(1B)')} cannot be claimed.`,
            k === 'Section80D' ? 'A304' : 'A342');
        }
      }
      /* A289 / A315 / A430 / A641 — the corresponding schedules must be blank */
      if (has('Schedule80G')) err('Schedule80G', 'Schedule 80G must be blank if the new tax regime is selected.', 'A289');
      if (has('Schedule80GGA')) err('Schedule80GGA', 'Schedule 80GGA must be blank if the new tax regime is selected.', 'A315');
      if (has('ScheduleAMT')) err('ScheduleAMT', 'Schedule AMT must be blank if the new tax regime is selected.', 'A430');
      if (isIndividual) {
        for (const sch of ['Schedule80C', 'Schedule80E', 'Schedule80EE', 'Schedule80EEA', 'Schedule80EEB'] as const) {
          if (has(sch)) {
            err(sch, `An individual opting for the new tax regime cannot fill ${sch.replace('Schedule', 'Schedule ')}.`, 'A641');
          }
        }
        if (has('ScheduleS.Section10_13A')) {
          err('ScheduleS.Section10_13A', 'An individual opting for the new tax regime cannot fill Table 10(13A) of Schedule Salary.', 'A641');
        }
      }
      /* A350 */
      if (s80CCH > 0) {
        warn('ScheduleVIA.DeductUndChapVIA.AnyOthSec80CCH',
          'Deduction u/s 80CCH(1) is not allowed under the new (default) tax regime u/s 115BAC — only the 80CCH(2) contribution by the Central Government is allowable.', 'A350');
      }
      /* A431 */
      const amtcC = num('ScheduleAMTC.TotAmtCreditUtilisedCY');
      const amtcD = num('ScheduleAMTC.TotBalAMTCreditCF');
      if (amtcC > 0 || amtcD > 0) {
        err('ScheduleAMTC', 'If the new tax regime is selected, Schedule AMTC columns C and D cannot be more than zero.', 'A431');
      }
      /* A543 */
      if (num('PartB_TTI.TotalTaxPayablDeemedTotInc') > 0 || num('PartB_TTI.TaxPayDeemedTotIncUs115JC') > 0) {
        err('PartB_TTI.TotalTaxPayablDeemedTotInc',
          'If the new tax regime is selected, Part B-TTI Sl. Nos. 1a to 1d (tax on deemed total income u/s 115JC) cannot be more than zero.', 'A543');
      }
    }

    /* HUF bars: A317 / A318 / A319 / A320 / A321 / A324 / A325 / A326 / A592 / A640 */
    if (isHUF) {
      const huf: Array<[string, number, string, string]> = [
        ['Section80CCDEmployeeOrSE', s80CCD1, '80CCD(1)', 'A317'],
        ['Section80CCD1B', s80CCD1B, '80CCD(1B)', 'A318'],
        ['Section80CCDEmployer', s80CCD2, '80CCD(2)', 'A319'],
        ['Section80E', s80E, '80E', 'A320'],
        ['Section80EE', s80EE, '80EE', 'A321'],
        ['Section80U', s80U, '80U', 'A324'],
        ['Section80EEA', s80EEA, '80EEA', 'A325'],
        ['Section80EEB', s80EEB, '80EEB', 'A326'],
      ];
      for (const [k, v, sec, rule] of huf) {
        if (v > 0) err(`ScheduleVIA.DeductUndChapVIA.${k}`, `Deduction u/s ${sec} is not allowed to a HUF.`, rule);
      }
      for (const sch of ['Schedule80E', 'Schedule80EE', 'Schedule80EEA', 'Schedule80EEB'] as const) {
        if (has(sch)) {
          err(sch, `An assessee having the status HUF is not eligible to fill ${sch.replace('Schedule', 'Schedule ')}.`, 'A640');
        }
      }
      if (has('Schedule80D.Sec80DSelfFamSrCtznHealth.ParentsSeniorCitizenFlag') ||
        anyNumeric(raw('Schedule80D.Sec80DSelfFamSrCtznHealth.ParentsSeniorCitizen')) ||
        anyNumeric(raw('Schedule80D.Sec80DSelfFamSrCtznHealth.Parents'))) {
        err('Schedule80D.Sec80DSelfFamSrCtznHealth', 'Sl. No. 2 of Schedule 80D (parents) is not applicable to a HUF.', 'A592');
      }
      if (has('ScheduleESOP')) {
        err('ScheduleESOP', 'Since the status is HUF, every field in the Schedule "Tax deferred on ESOP" must be removed.', 'A546');
      }
      if (has('ScheduleTDS1')) {
        err('ScheduleTDS1', 'A HUF cannot have TDS on salary.', 'A468');
      }
      if (num('PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section89') > 0) {
        err('PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section89', 'A HUF cannot claim relief u/s 89.', 'A516');
      }
      if (num('PartB_TTI.ComputationOfTaxLiability.Rebate87A') > 0) {
        err('PartB_TTI.ComputationOfTaxLiability.Rebate87A', 'Rebate u/s 87A is not allowed to a HUF.', 'A534');
      }
      /* A548 — HUF 80DD dependent must be a member of the HUF */
      const depType = str('Schedule80DD.DependentType');
      if (s80DD > 0 && depType && !/HUF|MEMBER/i.test(depType)) {
        warn('Schedule80DD.DependentType',
          'A HUF can claim the deduction u/s 80DD only for a dependant being a "Member of HUF".', 'A548');
      }
    }

    /* Non-resident bars: A327 / A328 / A329 / A333 / A335 / A349 / A533 / A443 / A453 */
    if (isNonResident) {
      const nr: Array<[string, number, string, string]> = [
        ['Section80DD', s80DD, '80DD', 'A327'],
        ['Section80DDB', s80DDB, '80DDB', 'A328'],
        ['Section80U', s80U, '80U', 'A329'],
        ['Section80QQB', s80QQB, '80QQB', 'A333'],
        ['Section80RRB', s80RRB, '80RRB', 'A335'],
        ['Section80TTB', s80TTB, '80TTB', 'A349'],
      ];
      for (const [k, v, sec, rule] of nr) {
        if (v > 0) err(`ScheduleVIA.DeductUndChapVIA.${k}`, `Deduction u/s ${sec} is not available to a non-resident.`, rule);
      }
      if (num('PartB_TTI.ComputationOfTaxLiability.Rebate87A') > 0) {
        err('PartB_TTI.ComputationOfTaxLiability.Rebate87A', 'Rebate u/s 87A is not allowed to a non-resident.', 'A533');
      }
      if (has('ScheduleFSI')) {
        err('ScheduleFSI', 'Schedule FSI is not applicable where the residential status is non-resident.', 'A443');
      }
      if (has('ScheduleTR1')) {
        err('ScheduleTR1', 'Schedule TR is not applicable where the residential status is non-resident.', 'A453');
      }
    }

    /* A322 — 80TTA barred for a resident senior citizen under the old regime */
    if (oldRegime && s80TTA > 0 && dob && isDate(dob) && dob <= '1966-04-01' && isResident) {
      err('ScheduleVIA.DeductUndChapVIA.Section80TTA',
        'Under the old tax regime, a resident senior citizen cannot claim the deduction u/s 80TTA (80TTB applies instead).', 'A322');
    }
    /* A323 — 80TTB only for senior citizens */
    if (oldRegime && s80TTB > 0 && dob && isDate(dob) && dob > '1966-04-01') {
      err('ScheduleVIA.DeductUndChapVIA.Section80TTB',
        'Deduction u/s 80TTB is allowable only to a senior citizen.', 'A323');
    }
    /* A346 */
    if (s80C + s80CCC + s80CCD1 > 150000) {
      err('ScheduleVIA.DeductUndChapVIA.Section80C',
        'The aggregate of the deductions u/s 80C, 80CCC and 80CCD(1) cannot exceed Rs. 1,50,000.', 'A346');
    }
    /* A330 / A332 / A509 */
    if (totalVIA > 0 && gti > 0 && totalVIA > gti) {
      err('ScheduleVIA.DeductUndChapVIA.TotalChapVIADeductions',
        'Deductions claimed under Chapter VI-A cannot be greater than the gross total income.', 'A330');
    }
    const partBTIVia = num('PartB-TI.DeductionsUnderScheduleVIA');
    if ((partBTIVia > 0 || totalVIA > 0) && Math.abs(partBTIVia - totalVIA) > 1 && totalVIA <= gti) {
      err('PartB-TI.DeductionsUnderScheduleVIA',
        'Deduction under Chapter VI-A in Part B-TI must be consistent with the total of all deductions in Schedule VI-A.', 'A332');
    }
    /* A507 */
    if (partBTIVia > 0 && !has('ScheduleVIA')) {
      err('ScheduleVIA', 'Deductions are claimed at Part B-TI — Schedule VI-A must be filled.', 'A507');
    }

    /* Conditional detail schedules */
    /* A302 / A303 */
    if (s80D > 0 && !has('Schedule80D')) {
      err('Schedule80D', 'Deduction u/s 80D is claimed in Schedule VI-A — Schedule 80D must be filled.', 'A302');
    }
    /* A314 / A331 */
    if (s80GGA > 0) {
      if (!has('Schedule80GGA')) {
        err('Schedule80GGA', 'Deduction u/s 80GGA is claimed in Schedule VI-A — Schedule 80GGA must be filled.', 'A314');
      } else if (Math.abs(num('Schedule80GGA.TotalEligibleDonationAmt80GGA') - s80GGA) > 1) {
        err('ScheduleVIA.DeductUndChapVIA.Section80GGA',
          'The amount claimed u/s 80GGA in Schedule VI-A must not differ from the eligible amount in Schedule 80GGA.', 'A331');
      }
    }
    /* A288 */
    if (s80G > 0 && oldRegime) {
      if (!has('Schedule80G')) {
        err('Schedule80G', 'Deduction u/s 80G is claimed in Schedule VI-A — Schedule 80G must be filled.', 'A288');
      } else if (s80G > num('Schedule80G.TotalEligibleDonationsUs80G') + 1) {
        err('ScheduleVIA.DeductUndChapVIA.Section80G',
          'The deduction claimed u/s 80G cannot exceed the total eligible amount of donation in Schedule 80G.', 'A288');
      }
    }
    /* A362 / A363 / A763 */
    if (s80U > 0) {
      if (!has('Schedule80U')) {
        err('Schedule80U', 'Deduction u/s 80U is claimed in Chapter VI-A — the same amount and details must be provided in Schedule 80U.', 'A362');
      } else {
        if (isEmpty(raw('Schedule80U.NatureOfDisability'))) {
          err('Schedule80U.NatureOfDisability', 'Nature of disability must be selected in Schedule 80U to claim the deduction.', 'A363');
        }
        if (isEmpty(raw('Schedule80U.Form10IAAckNum')) && isEmpty(raw('Schedule80U.FormAckNum11A')) && isEmpty(raw('Schedule80U.UDIDNum'))) {
          err('Schedule80U.Form10IAAckNum',
            'The acknowledgement number of Form 10-IA (or the UDID number) must be provided in Schedule 80U.', 'A619');
        }
        if (Math.abs(num('Schedule80U.DeductionAmount') - s80U) > 1) {
          err('Schedule80U.DeductionAmount', 'The amount in Schedule 80U must match the deduction u/s 80U claimed in Chapter VI-A.', 'A362');
        }
      }
    }
    /* A364 / A365 / A764 */
    if (s80DD > 0) {
      if (!has('Schedule80DD')) {
        err('Schedule80DD', 'Deduction u/s 80DD is claimed in Chapter VI-A — the same amount and details must be provided in Schedule 80DD.', 'A364');
      } else {
        if (isEmpty(raw('Schedule80DD.NatureOfDisability'))) {
          err('Schedule80DD.NatureOfDisability', 'Nature of disability must be selected in Schedule 80DD to claim the deduction.', 'A365');
        }
        if (isEmpty(raw('Schedule80DD.Form10IAAckNum')) && isEmpty(raw('Schedule80DD.FormAckNum11A')) && isEmpty(raw('Schedule80DD.UDIDNum'))) {
          err('Schedule80DD.Form10IAAckNum',
            'The acknowledgement number of Form 10-IA (or the UDID number) must be provided in Schedule 80DD.', 'A619');
        }
        if (Math.abs(num('Schedule80DD.DeductionAmount') - s80DD) > 1) {
          err('Schedule80DD.DeductionAmount', 'The amount in Schedule 80DD must match the deduction u/s 80DD claimed in Chapter VI-A.', 'A364');
        }
      }
    }
    /* A358 / A359 / A360 / A361 — statutory disability amounts */
    if (oldRegime) {
      const disabAmt = (sch: 'Schedule80U' | 'Schedule80DD') => num(`${sch}.DeductionAmount`);
      const disabType = (sch: 'Schedule80U' | 'Schedule80DD') => str(`${sch}.NatureOfDisability`).toUpperCase();
      for (const sch of ['Schedule80U', 'Schedule80DD'] as const) {
        const t = disabType(sch);
        const a = disabAmt(sch);
        if (!t || a <= 0) continue;
        const severe = /SEVERE/.test(t) || t === '2';
        const expect = severe ? 125000 : 75000;
        if (a !== Math.min(expect, gti > 0 ? gti : expect)) {
          err(`${sch}.DeductionAmount`,
            `Where the nature of disability is "${severe ? 'severe disability' : 'disability'}", the deduction must be Rs. ${expect.toLocaleString('en-IN')} (subject to gross total income).`,
            sch === 'Schedule80U' ? 'A361' : (severe ? 'A360' : 'A359'));
        }
      }
    }
    /* A623 / A624 / A626 / A629 / A631-A634 */
    const loanSchedules: Array<[string, number, string, string, string]> = [
      ['Schedule80E', s80E, 'Schedule80EDtls', 'TotalInterest80E', 'A623'],
      ['Schedule80EE', s80EE, 'Schedule80EEDtls', 'TotalInterest80EE', 'A624'],
      ['Schedule80EEA', s80EEA, 'Schedule80EEADtls', 'TotalInterest80EEA', 'A626'],
      ['Schedule80EEB', s80EEB, 'Schedule80EEBDtls', 'TotalInterest80EEB', 'A629'],
    ];
    for (const [sch, amt, dtls, total, rule] of loanSchedules) {
      if (amt <= 0) continue;
      const rws = rows(`${sch}.${dtls}`);
      if (!rws.length) {
        err(`${sch}.${dtls}`,
          `Details of the loan taken must be provided in ${sch.replace('Schedule', 'Schedule ')} to claim the deduction.`, rule);
        continue;
      }
      rws.forEach((r, i) => {
        const rec = asRecord(r) || {};
        for (const f of ['BankOrInstnName', 'LoanAccNoOfBankOrInstnRefNo', 'DateofLoan'] as const) {
          if (isEmpty(rec[f])) {
            err(`${sch}.${dtls}[${i}].${f}`, `${humanise(f)} is mandatory in ${sch.replace('Schedule', 'Schedule ')}.`, rule);
          }
        }
      });
      const schTotal = num(`${sch}.${total}`);
      if (schTotal > 0 && Math.abs(schTotal - amt) > 1) {
        err(`ScheduleVIA.DeductUndChapVIA.${sch.replace('Schedule', 'Section')}`,
          `The deduction claimed in Schedule VI-A must match the total interest as per ${sch.replace('Schedule', 'Schedule ')}.`,
          sch === 'Schedule80E' ? 'A631' : sch === 'Schedule80EE' ? 'A632' : sch === 'Schedule80EEA' ? 'A633' : 'A634');
      }
    }
    /* A625 / A639 — 80EE loan window and ceiling */
    rows('Schedule80EE.Schedule80EEDtls').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const d = toStr(rec.DateofLoan);
      if (d && isDate(d) && (d < '2016-04-01' || d > '2017-03-31')) {
        err(`Schedule80EE.Schedule80EEDtls[${i}].DateofLoan`,
          'The date of sanction of the loan under Schedule 80EE must fall between 01.04.2016 and 31.03.2017.', 'A639');
      }
      if (toNum(rec.TotalLoanAmt) > 3500000) {
        err(`Schedule80EE.Schedule80EEDtls[${i}].TotalLoanAmt`,
          'Deduction u/s 80EE can be claimed only if the loan taken does not exceed Rs. 35 lakhs.', 'A625');
      }
    });
    /* A628 / A627 — 80EEA loan window and stamp-duty value */
    rows('Schedule80EEA.Schedule80EEADtls').forEach((r, i) => {
      const d = toStr((asRecord(r) || {}).DateofLoan);
      if (d && isDate(d) && (d < '2019-04-01' || d > '2022-03-31')) {
        err(`Schedule80EEA.Schedule80EEADtls[${i}].DateofLoan`,
          'The date of sanction of the loan under Schedule 80EEA must fall between 01.04.2019 and 31.03.2022.', 'A628');
      }
    });
    if (s80EEA > 0 && num('Schedule80EEA.PropStmpDtyVal') > 4500000) {
      err('Schedule80EEA.PropStmpDtyVal',
        'Deduction u/s 80EEA can be claimed only on a residential house property having a stamp value up to Rs. 45 lakhs.', 'A627');
    }
    /* A759 — 80EE and 80EEA cannot both be claimed */
    if (oldRegime && s80EE > 0 && s80EEA > 0) {
      err('ScheduleVIA.DeductUndChapVIA.Section80EEA',
        'Deductions u/s 80EE and u/s 80EEA cannot both be claimed.', 'A759');
    }
    /* A630 — 80EEB loan window */
    rows('Schedule80EEB.Schedule80EEBDtls').forEach((r, i) => {
      const d = toStr((asRecord(r) || {}).DateofLoan);
      if (d && isDate(d) && (d < '2019-04-01' || d > '2023-03-31')) {
        err(`Schedule80EEB.Schedule80EEBDtls[${i}].DateofLoan`,
          'The date of sanction of the loan under Schedule 80EEB must fall between 01.04.2019 and 31.03.2023.', 'A630');
      }
    });
    /* A642 / A643 / A644 — Schedule 80C */
    if (s80C > 0) {
      const rws = rows('Schedule80C.Schedule80CDtls');
      if (!rws.length) {
        err('Schedule80C.Schedule80CDtls',
          'Details such as the amount eligible for deduction u/s 80C and the policy / document identification number must be provided in Schedule 80C.', 'A642');
      }
      let tot = 0;
      rws.forEach((r, i) => {
        const rec = asRecord(r) || {};
        tot += toNum(rec.Amount);
        if (isEmpty(rec.IdentificationNo)) {
          err(`Schedule80C.Schedule80CDtls[${i}].IdentificationNo`,
            'The policy number / document identification number is required in Schedule 80C.', 'A642');
        }
      });
      const schTot = num('Schedule80C.TotalAmt');
      if (rws.length && Math.abs(schTot - tot) > 1) {
        err('Schedule80C.TotalAmt',
          'The sum of the individual rows for the amount eligible for deduction u/s 80C must match the total deduction u/s 80C in Schedule 80C.', 'A644');
      }
      if (schTot > 0 && Math.abs(schTot - s80C) > 1) {
        err('ScheduleVIA.DeductUndChapVIA.Section80C',
          'The deduction u/s 80C claimed under Chapter VI-A must be the same as the total deduction u/s 80C in Schedule 80C.', 'A643');
      }
    }
    /* A645 / A756 — PRAN */
    const pranRows = rows('ScheduleVIA.UsrDeductUndChapVIA.PRANDtls')
      .filter((r) => !isEmpty((asRecord(r) || {}).PRANNum));
    if ((s80CCD1 > 0 || s80CCD1B > 0) && !pranRows.length) {
      err('ScheduleVIA.UsrDeductUndChapVIA.PRANDtls',
        'The PRAN must be provided in Schedule VI-A to claim the deduction u/s 80CCD(1) or 80CCD(1B).', 'A645');
    }
    if (pranRows.length && s80CCD1 === 0 && s80CCD1B === 0) {
      err('ScheduleVIA.UsrDeductUndChapVIA.PRANDtls',
        'A PRAN has been entered but the amounts claimed u/s 80CCD(1) and 80CCD(1B) are both zero.', 'A756');
    }
    /* A758 — 80CCC identifier rows */
    if (s80CCC > 0) {
      const rws = rows('ScheduleVIA.UsrDeductUndChapVIA.PensionContribution80CCC');
      if (!rws.length) {
        err('ScheduleVIA.UsrDeductUndChapVIA.PensionContribution80CCC',
          'Where the deduction u/s 80CCC is more than zero, at least one row with "Type of identifier", "Identifier No." and "Amount" must be provided.', 'A758');
      }
      let tot = 0;
      rws.forEach((r, i) => {
        const rec = asRecord(r) || {};
        tot += toNum(rec.Amount);
        for (const f of ['TypeofIdentifier', 'NameofIdentifier'] as const) {
          if (isEmpty(rec[f])) {
            err(`ScheduleVIA.UsrDeductUndChapVIA.PensionContribution80CCC[${i}].${f}`,
              `${humanise(f)} is mandatory for the deduction u/s 80CCC.`, 'A758');
          }
        }
      });
      /* A693 */
      if (rws.length && Math.abs(tot - s80CCC) > 1) {
        err('ScheduleVIA.DeductUndChapVIA.Section80CCC',
          'For the deduction u/s 80CCC, the sum of the individual rows must match the amount of payment claimed.', 'A693');
      }
    }
    /* A646 / A647 / A648 / A649 — supporting form acknowledgements */
    if (s80GG > 0 && isEmpty(usr.Form10BAAckNum)) {
      err('ScheduleVIA.UsrDeductUndChapVIA.Form10BAAckNum',
        'Details of Form 10BA are required to claim the deduction u/s 80GG.', 'A646');
    }
    if (s80DDB > 0 && isEmpty(usr.NameOfSpecDisease80DDB)) {
      err('ScheduleVIA.UsrDeductUndChapVIA.NameOfSpecDisease80DDB',
        'Details of the specified disease are required to claim the deduction u/s 80DDB.', 'A647');
    }
    if (s80QQB > 0 && isEmpty(usr.Form10CCDAckNum)) {
      err('ScheduleVIA.UsrDeductUndChapVIA.Form10CCDAckNum',
        'The acknowledgement number of Form 10CCD must be provided in Schedule VI-A to claim the deduction u/s 80QQB.', 'A648');
    }
    if (s80RRB > 0 && isEmpty(usr.Form10CCEAckNum)) {
      err('ScheduleVIA.UsrDeductUndChapVIA.Form10CCEAckNum',
        'The acknowledgement number of Form 10CCE must be provided in Schedule VI-A to claim the deduction u/s 80RRB.', 'A649');
    }
    /* A340 / A341 / A760 / A761 — 80QQB / 80RRB need a timely return */
    if ((s80QQB > 0 || s80RRB > 0) && fileSec === 12) {
      err('ScheduleVIA.DeductUndChapVIA.Section80QQB',
        'Deductions u/s 80QQB / 80RRB cannot be claimed where the return is not filed within the due date or the extended due date.', 'A340');
    }
    /* A337 */
    if (s80QQB + s80RRB > 0) {
      const anyOther = num('ScheduleOS.IncOthThanOwnRaceHorse.AnyOtherIncome');
      if (anyOther > 0 && s80QQB + s80RRB > anyOther) {
        err('ScheduleVIA.DeductUndChapVIA.Section80QQB',
          'The deduction u/s 80RRB plus 80QQB cannot exceed the income entered at Schedule OS Sl. No. 1e.', 'A337');
      }
    }
    /* A343 — 80TTA restricted to savings-bank interest */
    const savingsInt = num('ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmSavingBank');
    if (s80TTA > 0 && s80TTA > savingsInt) {
      err('ScheduleVIA.DeductUndChapVIA.Section80TTA',
        'The deduction u/s 80TTA must be restricted to the interest income from a savings account offered under income from other sources.', 'A343');
    }
    /* A344 — 80TTB restricted to savings + deposit interest */
    if (oldRegime && s80TTB > 0) {
      const depositInt = savingsInt + num('ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmTermDeposit');
      if (s80TTB > depositInt) {
        err('ScheduleVIA.DeductUndChapVIA.Section80TTB',
          'The deduction u/s 80TTB must be restricted to the interest income (savings and deposits) offered under income from other sources.', 'A344');
      }
    }

    /* 10 ── Schedule 80G / 80GGA / 80GGC ------------------------------------------ */
    const donorPans = new Set<string>();
    const G80_BLOCKS: Array<[string, string]> = [
      ['Don100Percent', 'A'], ['Don50PercentNoApprReqd', 'B'],
      ['Don100PercentApprReqd', 'C'], ['Don50PercentApprReqd', 'D'],
    ];
    const CASH_RULE: Record<string, string> = { A: 'A279', B: 'A280', C: 'A281', D: 'A282' };
    const MODE_RULE: Record<string, string> = { A: 'A687', B: 'A688', C: 'A689', D: 'A690' };
    for (const [block, sl] of G80_BLOCKS) {
      rows(`Schedule80G.${block}.DoneeWithPan`).forEach((r, i) => {
        const rec = asRecord(r) || {};
        const base = `Schedule80G.${block}.DoneeWithPan[${i}]`;
        const cash = toNum(rec.DonationAmtCash);
        const other = toNum(rec.DonationAmtOtherMode);
        const donation = toNum(rec.DonationAmt) || cash + other;
        const dpan = toStr(rec.DoneePAN);
        /* A696 */
        if (donation > 0 && !dpan) {
          err(`${base}.DoneePAN`, 'PAN of the donee is mandatory where the donation amount is more than zero in Schedule 80G.', 'A696');
        }
        /* A277 */
        if (dpan && (dpan === pan || dpan === verPan)) {
          err(`${base}.DoneePAN`, 'The donee PAN must not be the same as the assessee PAN or the PAN at Verification.', 'A277');
        }
        /* A290 */
        if (dpan && dpan !== 'AAAAR1077P') {
          if (donorPans.has(dpan)) {
            err(`${base}.DoneePAN`,
              `PAN "${dpan}" is already entered in another block of Schedule 80G — the same PAN cannot be entered in more than one block (except AAAAR1077P).`, 'A290');
          }
          donorPans.add(dpan);
        }
        /* A279-A282 */
        if (cash > 2000) {
          err(`${base}.DonationAmtCash`,
            `Deduction u/s 80G is not allowed for a donation made in cash above Rs. 2,000 (Sl. No. ${sl}).`, CASH_RULE[sl]);
        }
        /* A687-A690 */
        if (other > 0) {
          for (const f of ['TransactionRefNum', 'IFSCCode'] as const) {
            if (isEmpty(rec[f])) {
              err(`${base}.${f}`,
                `Where the contribution in other mode is more than zero, the details of such contribution (${humanise(f)}) are required at Sl. No. ${sl} of Schedule 80G.`, MODE_RULE[sl]);
            }
          }
        }
        /* A283-A286 */
        if (!isEmpty(rec.DonationAmt) && Math.abs(toNum(rec.DonationAmt) - (cash + other)) > 1) {
          err(`${base}.DonationAmt`,
            `In Schedule 80G (${sl}), "Total donation" must equal the sum of "Donation in cash" and "Donation in other mode".`,
            sl === 'A' ? 'A283' : sl === 'B' ? 'A284' : sl === 'C' ? 'A285' : 'A286');
        }
        /* A278 */
        if (toNum(rec.EligibleDonationAmt) > donation + 1) {
          err(`${base}.EligibleDonationAmt`,
            'In Schedule 80G, the amount of deduction computed cannot be more than the eligible amount of donation.', 'A278');
        }
        if (isEmpty(rec.DoneeWithPanName)) {
          err(`${base}.DoneeWithPanName`, 'Name of the donee is mandatory in Schedule 80G.', 'A696');
        }
      });
    }
    /* A287 */
    if (has('Schedule80G')) {
      const blockSum = G80_BLOCKS.reduce((t, [b]) => t + num(`Schedule80G.${b}.TotDon${b.replace('Don', '')}`) ||
        t + sumOf(raw(`Schedule80G.${b}`), ['TotDon100Percent', 'TotDon50PercentNoApprReqd', 'TotDon100PercentApprReqd', 'TotDon50PercentApprReqd']), 0);
      const total80G = num('Schedule80G.TotalDonationsUs80G');
      if (blockSum > 0 && total80G > 0 && Math.abs(blockSum - total80G) > 1) {
        err('Schedule80G.TotalDonationsUs80G', 'In Schedule 80G(E), donations must equal the sum of blocks (A + B + C + D).', 'A287');
      }
    }
    /* Schedule 80GGA */
    rows('Schedule80GGA.DonationDtlsSciRsrchRuralDev').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const base = `Schedule80GGA.DonationDtlsSciRsrchRuralDev[${i}]`;
      const cash = toNum(rec.DonationAmtCash);
      const other = toNum(rec.DonationAmtOtherMode);
      const dpan = toStr(rec.DoneePAN);
      if (cash > 2000) {
        err(`${base}.DonationAmtCash`, 'In Schedule 80GGA, the deduction is not allowed for a donation made in cash above Rs. 2,000.', 'A316');
      }
      if (dpan && (dpan === pan || dpan === verPan)) {
        err(`${base}.DoneePAN`, 'The donee PAN must not be the same as the assessee PAN or the PAN at Verification.', 'A313');
      }
      if (!isEmpty(rec.DonationAmt) && Math.abs(toNum(rec.DonationAmt) - (cash + other)) > 1) {
        err(`${base}.DonationAmt`,
          'In Schedule 80GGA, "Total donation" must equal the sum of "Donation in cash" and "Donation in other mode".', 'A311');
      }
      if (isEmpty(rec.RelevantClauseUndrDedClaimed)) {
        err(`${base}.RelevantClauseUndrDedClaimed`, 'The relevant clause under which the deduction u/s 80GGA is claimed must be selected.', 'A311');
      }
    });
    /* Schedule 80GGC */
    if (s80GGC > 0 && !has('Schedule80GGC')) {
      err('Schedule80GGC', 'Deduction u/s 80GGC is claimed in Schedule VI-A — Schedule 80GGC must be filled.', 'A351');
    }
    rows('Schedule80GGC.Schedule80GGCDetails').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const base = `Schedule80GGC.Schedule80GGCDetails[${i}]`;
      const cash = toNum(rec.DonationAmtCash);
      const other = toNum(rec.DonationAmtOtherMode);
      const total = toNum(rec.DonationAmt) || cash + other;
      const date = toStr(rec.DonationDate);
      /* A356 */
      if (total > 0 && !date) {
        err(`${base}.DonationDate`, 'In Schedule 80GGC, the date of contribution is required where the total contribution in a row is more than zero.', 'A356');
      }
      /* A547 */
      if (date && isDate(date) && (date < FY_START || date > FY_END)) {
        err(`${base}.DonationDate`,
          `Deduction u/s 80GGC can be claimed only for contributions made between ${FY_START} and ${FY_END} for AY 2026-27.`, 'A547');
      }
      /* A357 */
      if (other > 0) {
        for (const f of ['TransactionRefNum', 'IFSCCode'] as const) {
          if (isEmpty(rec[f])) {
            err(`${base}.${f}`, `Where the contribution in other mode is more than zero, the details of such contribution (${humanise(f)}) are required.`, 'A357');
          }
        }
      }
      /* A697 */
      if (total > 0) {
        for (const f of ['PoliticalPartyName', 'PoliticalPartyPAN'] as const) {
          if (isEmpty(rec[f])) {
            err(`${base}.${f}`, 'The name and PAN of the political party are necessary to claim the deduction u/s 80GGC.', 'A697');
          }
        }
      }
      /* A352 — cash contributions are not eligible */
      if (toNum(rec.EligibleDonationAmt) > other + 1) {
        err(`${base}.EligibleDonationAmt`,
          'In Schedule 80GGC, the eligible amount of contribution for each row must equal the contribution in other mode (subject to gross total income).', 'A352');
      }
      /* A353 */
      if (!isEmpty(rec.DonationAmt) && Math.abs(toNum(rec.DonationAmt) - (cash + other)) > 1) {
        err(`${base}.DonationAmt`,
          'In Schedule 80GGC, "Total contribution" must equal the sum of "Contribution in cash" and "Contribution in other mode".', 'A353');
      }
      /* A697 — PAN of the political party must differ from the assessee */
      const ppan = toStr(rec.PoliticalPartyPAN);
      if (ppan && (ppan === pan || ppan === verPan)) {
        err(`${base}.PoliticalPartyPAN`, 'The PAN of the political party must not be the same as the assessee PAN or the PAN at Verification.', 'A313');
      }
    });
    /* A351 */
    if (s80GGC > 0 && has('Schedule80GGC') && s80GGC > num('Schedule80GGC.TotalEligibleDonationAmt80GGC') + 1) {
      err('ScheduleVIA.DeductUndChapVIA.Section80GGC',
        'The deduction computed u/s 80GGC cannot be more than the eligible amount of contribution in Schedule 80GGC.', 'A351');
    }

    /* 11 ── Schedule 80D ceilings -------------------------------------------------- */
    if (oldRegime && has('Schedule80D')) {
      const d80 = asRecord(raw('Schedule80D.Sec80DSelfFamSrCtznHealth')) || {};
      const selfFam = toNum(d80.SelfAndFamily);
      const selfFamSr = toNum(d80.SelfAndFamilySeniorCitizen);
      const parents = toNum(d80.Parents);
      const parentsSr = toNum(d80.ParentsSeniorCitizen);
      const eligible = toNum(d80.EligibleAmountOfDedn);
      if (selfFam > 25000) err('Schedule80D.Sec80DSelfFamSrCtznHealth.SelfAndFamily', 'The deduction at Sl. No. 1a of Schedule 80D (self and family) is allowable only to the extent of Rs. 25,000.', 'A291');
      if (selfFamSr > 50000) err('Schedule80D.Sec80DSelfFamSrCtznHealth.SelfAndFamilySeniorCitizen', 'The deduction at Sl. No. 1b of Schedule 80D (self and family — senior citizen) is allowable only to the extent of Rs. 50,000.', 'A294');
      if (parents > 25000) err('Schedule80D.Sec80DSelfFamSrCtznHealth.Parents', 'The deduction at Sl. No. 2a of Schedule 80D (parents) is allowable only to the extent of Rs. 25,000.', 'A296');
      if (parentsSr > 50000) err('Schedule80D.Sec80DSelfFamSrCtznHealth.ParentsSeniorCitizen', 'The deduction at Sl. No. 2b of Schedule 80D (parents — senior citizen) is allowable only to the extent of Rs. 50,000.', 'A298');
      if (eligible > 100000) err('Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn', 'Sl. No. 3 of Schedule 80D (eligible amount of deduction) cannot be more than Rs. 1,00,000.', 'A300');
      const chk = toNum(d80.PrevHlthChckUpSlfFam) + toNum(d80.PrevHlthChckUpSlfFamSrCtzn) +
        toNum(d80.PrevHlthChckUpParents) + toNum(d80.PrevHlthChckUpParentsSrCtzn);
      if (chk > 5000) {
        err('Schedule80D.Sec80DSelfFamSrCtznHealth', 'In Schedule 80D, the amount of preventive health check-up of all the fields combined cannot exceed Rs. 5,000.', 'A293');
      }
      /* A303 */
      if (eligible > 0 && s80D > 0 && Math.abs(eligible - s80D) > 1) {
        err('ScheduleVIA.DeductUndChapVIA.Section80D',
          'The 80D claimed in Schedule VI-A must equal the eligible amount of deduction in Schedule 80D.', 'A303');
      }
      /* A611-A614 — insurer name and policy number */
      const insBlocks: Array<[string, string, string]> = [
        ['Sec80DSelfFamHIDtls', '1a(i)', 'A611'],
        ['Sec80DSelfFamSrCtznHIDtls', '1b(i)', 'A612'],
        ['Sec80DParentsHIDtls', '2a(i)', 'A613'],
        ['Sec80DParentsSrCtznHIDtls', '2b(i)', 'A614'],
      ];
      for (const [blk, sl, rule] of insBlocks) {
        toArr(at(d80[blk], 'Sch80DInsDtls')).forEach((r, i) => {
          const rec = asRecord(r) || {};
          if (toNum(rec.HealthInsAmt) <= 0) return;
          for (const f of ['InsurerName', 'PolicyNo'] as const) {
            if (isEmpty(rec[f])) {
              err(`Schedule80D.Sec80DSelfFamSrCtznHealth.${blk}.Sch80DInsDtls[${i}].${f}`,
                `The name of the insurer and the policy number must be provided in Schedule 80D to claim the deduction for health insurance at Sl. No. ${sl}.`, rule);
            }
          }
        });
      }
    }

    /* 12 ── Schedule EI / AL / FA -------------------------------------------------- */
    /* A445 */
    if (num('ScheduleEI.NetAgriIncOrOthrIncRule7') > 500000) {
      const lands = rows('ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls');
      if (!lands.length) {
        err('ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls',
          'Where the net agricultural income for the year exceeds Rs. 5 lakh, the details of each agricultural land must be provided in Schedule EI.', 'A445');
      }
      lands.forEach((r, i) => {
        const rec = asRecord(r) || {};
        for (const f of ['NameOfDistrict', 'PinCode', 'MeasurementOfLand', 'AgriLandOwnedFlag', 'AgriLandIrrigatedFlag'] as const) {
          if (isEmpty(rec[f])) {
            err(`ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls[${i}].${f}`,
              `${humanise(f)} is mandatory for each agricultural land in Schedule EI.`, 'A445');
          }
        }
      });
    }
    /* A436 */
    const netAgri = num('ScheduleEI.NetAgriIncOrOthrIncRule7');
    const agriCalc = num('ScheduleEI.GrossAgriRecpt') - num('ScheduleEI.ExpIncAgri') - num('ScheduleEI.UnabAgriLossPrev8');
    if ((netAgri !== 0 || agriCalc !== 0) && Math.abs(netAgri - agriCalc) > 1) {
      err('ScheduleEI.NetAgriIncOrOthrIncRule7',
        'In Schedule EI, the net agricultural income for the year must equal gross agricultural receipts less expenditure incurred on agriculture less unabsorbed agricultural loss of the previous eight assessment years.', 'A436');
    }
    /* A435 */
    const eiTotal = num('ScheduleEI.TotalExemptInc');
    const eiParts = num('ScheduleEI.InterestInc') + netAgri + num('ScheduleEI.Others') +
      num('ScheduleEI.IncNotChrgblToTax') + num('ScheduleEI.PassThrIncNotChrgblTax');
    if ((eiTotal !== 0 || eiParts !== 0) && Math.abs(eiTotal - eiParts) > 1) {
      warn('ScheduleEI.TotalExemptInc',
        'In Schedule EI, Sl. No. 6 (total exempt income) should equal the sum of Sl. Nos. 1 + 2 + 3 + 4 + 5.', 'A435');
    }
    /* A508 */
    const partBTIAgri = num('PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate');
    if ((partBTIAgri !== 0 || netAgri !== 0) && Math.abs(partBTIAgri - netAgri) > 1) {
      err('PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate',
        'In Part B-TI, net agricultural income / any other income for rate purposes must equal Sl. No. 2 of Schedule EI.', 'A508');
    }
    /* A456 */
    if (totalIncome > 10000000 && !has('ScheduleAL')) {
      err('ScheduleAL', 'Schedule AL must be filled where the total income is greater than Rs. 1 crore.', 'A456');
    }
    /* A746 */
    const assetOut = str('PartB_TTI.AssetOutIndiaFlag').toUpperCase();
    if (assetOut === 'Y' && !has('ScheduleFA')) {
      err('ScheduleFA', 'Schedule FA must be filled where Sl. No. 19 of Part B-TTI is selected as "Yes".', 'A746');
    }
    if (assetOut === 'Y' && isNonResident) {
      warn('PartB_TTI.AssetOutIndiaFlag',
        'Schedule FA is applicable only to a resident — verify the residential status against the "assets outside India" flag.', 'A746');
    }

    /* 13 ── Schedule IT / TDS / TCS ----------------------------------------------- */
    let itSum = 0;
    let advanceFromChallans = 0;
    let satFromChallans = 0;
    rows('ScheduleIT.TaxPayment').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const amt = toNum(rec.Amt);
      itSum += amt;
      const dt = toStr(rec.DateDep);
      if (amt > 0) {
        for (const f of ['BSRCode', 'DateDep', 'SrlNoOfChaln'] as const) {
          if (isEmpty(rec[f])) {
            err(`ScheduleIT.TaxPayment[${i}].${f}`, `${humanise(f)} is mandatory for every challan in Schedule IT.`, 'A459');
          }
        }
      }
      if (dt && isDate(dt)) {
        if (dt > FY_END) satFromChallans += amt; else advanceFromChallans += amt;
      }
    });
    const itTotal = num('ScheduleIT.TotalTaxPayments');
    if ((itSum !== 0 || itTotal !== 0) && Math.abs(itSum - itTotal) > 1) {
      err('ScheduleIT.TotalTaxPayments',
        'In Schedule IT, the total of Column 5 "Amount" must equal the sum of the amounts entered in the amount column.', 'A459');
    }

    const tds1Total = num('ScheduleTDS1.TotalTDSonSalaries');
    let tds1Sum = 0;
    rows('ScheduleTDS1.TDSonSalary').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const tds = toNum(rec.TotalTDSSal);
      tds1Sum += tds;
      const tan = toStr(at(rec.EmployerOrDeductorOrCollectDetl, 'TAN'));
      if (tds > 0 && !tan) {
        err(`ScheduleTDS1.TDSonSalary[${i}].EmployerOrDeductorOrCollectDetl.TAN`,
          'The TAN of the employer is mandatory in Schedule TDS-1.', 'A11');
      }
      if (tan && !/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(tan)) {
        err(`ScheduleTDS1.TDSonSalary[${i}].EmployerOrDeductorOrCollectDetl.TAN`,
          `TAN "${tan}" is invalid — the first four characters must be alphabets.`, 'A11');
      }
      /* A471 */
      if (tds > 0 && toNum(rec.IncChrgSal) <= 0) {
        err(`ScheduleTDS1.TDSonSalary[${i}].IncChrgSal`,
          'In Schedule TDS on salary, the income chargeable under the head Salary must be disclosed where tax is deducted.', 'A471');
      }
    });
    if ((tds1Sum !== 0 || tds1Total !== 0) && Math.abs(tds1Sum - tds1Total) > 1) {
      err('ScheduleTDS1.TotalTDSonSalaries', 'The total TDS on salaries must equal the sum of the individual rows.', 'A493');
    }
    /* A472 */
    if (tds1Total > 0 && num('ScheduleS.TotIncUnderHeadSalaries') <= 0 && !has('ScheduleS.Salaries')) {
      err('ScheduleTDS1', 'TDS on salary can be claimed only if the respective salary income is disclosed in the Salary schedule.', 'A472');
    }

    const tdsOtherChecks = (
      key: 'ScheduleTDS2' | 'ScheduleTDS3',
      dtls: string,
      totalKey: string,
      colRule: string,
    ) => {
      let sum = 0;
      rows(`${key}.${dtls}`).forEach((r, i) => {
        const rec = asRecord(r) || {};
        const base = `${key}.${dtls}[${i}]`;
        const credit = asRecord(rec.TaxDeductCreditDtls) || {};
        const claimedOwn = toNum(credit.TaxClaimedOwnHands);
        const claimedOther = toNum(credit.TaxClaimedTDS);
        const bf = toNum(rec.BroughtFwdTDSAmt);
        const deducted = toNum(credit.TaxDeductedOwnHands) + toNum(credit.TaxDeductedTDS);
        sum += claimedOwn + claimedOther;
        const owner = toStr(rec.TDSCreditName).toUpperCase();
        /* A469 / A470 */
        if (owner === 'O') {
          if (isEmpty(rec.PANofOtherPerson) && isEmpty(rec.AadhaarOfOtherPerson)) {
            err(`${base}.PANofOtherPerson`,
              'Where the TDS credit relates to another person, the PAN of that other person must be provided.', 'A469');
          }
          const deductorId = key === 'ScheduleTDS2' ? rec.TANOfDeductor : (rec.PANOfBuyerTenant ?? rec.AadhaarOfBuyerTenant);
          if (isEmpty(deductorId)) {
            err(`${base}.${key === 'ScheduleTDS2' ? 'TANOfDeductor' : 'PANOfBuyerTenant'}`,
              'Where the TDS credit relates to another person, the TAN of the deductor / PAN of the tenant or buyer must be filled.', 'A470');
          }
        }
        /* A464 / A465 */
        if (claimedOwn + claimedOther > 0) {
          if (toNum(rec.GrossAmount) <= 0) {
            err(`${base}.GrossAmount`,
              'The corresponding receipts / withdrawals offered — "Gross amount" — must be filled since TDS is claimed.', colRule);
          }
          if (isEmpty(rec.HeadOfIncome)) {
            err(`${base}.HeadOfIncome`,
              'The corresponding receipts / withdrawals offered — "Head of income" — must be filled since TDS is claimed.', colRule);
          }
        }
        /* A466 / A467 */
        if (claimedOwn + claimedOther > bf + deducted + 1) {
          err(`${base}.TaxDeductCreditDtls`,
            'The TDS claimed cannot be more than the sum of the TDS brought forward and the TDS deducted.', 'A466');
        }
        /* A462 */
        if (bf > 0 && deducted > 0) {
          err(`${base}.BroughtFwdTDSAmt`,
            'Unclaimed TDS brought forward and details of TDS of the current financial year must be provided in different rows.', 'A462');
        }
        /* A650 */
        if (toStr(rec.TDSSection).replace(/\s/g, '').toUpperCase() === '192') {
          err(`${base}.TDSSection`,
            'Section 192 (TDS on salary income) cannot be selected in the schedule for TDS on income other than salary.', 'A650');
        }
        /* A479 */
        const cf = toNum(rec.AmtCarriedFwd);
        const expCf = bf + deducted - claimedOwn - claimedOther;
        if ((cf !== 0 || expCf !== 0) && Math.abs(cf - expCf) > 1) {
          warn(`${base}.AmtCarriedFwd`,
            'The TDS credit being carried forward should equal TDS brought forward plus TDS deducted less TDS claimed.', 'A479');
        }
      });
      const declared = num(`${key}.${totalKey}`);
      if ((sum !== 0 || declared !== 0) && Math.abs(sum - declared) > 1) {
        err(`${key}.${totalKey}`, 'The total TDS must equal the sum of the individual rows.', 'A493');
      }
      return declared || sum;
    };
    const tds2Total = tdsOtherChecks('ScheduleTDS2', 'TDSOthThanSalaryDtls', 'TotalTDSonOthThanSals', 'A464');
    const tds3Total = tdsOtherChecks('ScheduleTDS3', 'TDS3onOthThanSalDtls', 'TotalTDS3OnOthThanSal', 'A465');

    let tcsSum = 0;
    rows('ScheduleTCS.TCS').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const base = `ScheduleTCS.TCS[${i}]`;
      const collected = asRecord(rec.TCSCurrFYDtls) || {};
      const claimedDt = asRecord(rec.TCSClaimedThisYearDtls) || {};
      const collectedTot = toNum(collected.TCSAmtCollOwnHand) + toNum(collected.TCSAmtCollSpouseOrOthrHand);
      const claimedTot = toNum(claimedDt.TCSAmtCollOwnHand) + toNum(claimedDt.TCSAmtCollSpouseOrOthrHand);
      const bf = toNum(rec.BroughtFwdTDSAmt);
      tcsSum += claimedTot;
      /* A476 */
      if (isEmpty(rec.TCSCreditOwner)) {
        err(`${base}.TCSCreditOwner`, 'In Schedule TCS, the applicable dropdown in column 2(i) (TCS credit owner) must be selected.', 'A476');
      }
      /* A477 */
      if (isEmpty(rec.EmployerOrDeductorOrCollectTAN)) {
        err(`${base}.EmployerOrDeductorOrCollectTAN`,
          'In Schedule TCS, the tax deduction and tax collection account number of the collector must be provided.', 'A477');
      } else {
        const tan = toStr(rec.EmployerOrDeductorOrCollectTAN);
        if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(tan)) {
          err(`${base}.EmployerOrDeductorOrCollectTAN`, `TAN "${tan}" of the collector is invalid.`, 'A11');
        }
      }
      /* A475 */
      if (toStr(rec.TCSCreditOwner) === '2' && isEmpty(rec.PANOfSpouseOrOthrPrsn) && isEmpty(claimedDt.PANOfSpouseOrOthrPrsn)) {
        err(`${base}.PANOfSpouseOrOthrPrsn`,
          'In Schedule TCS, the TCS credit relates to another person but the PAN of that other person is not provided.', 'A475');
      }
      /* A458 / A474 */
      if (claimedTot > bf + collectedTot + 1) {
        err(`${base}.TCSClaimedThisYearDtls`,
          'The amount of TCS claimed this year cannot be more than the TCS brought forward plus the tax collected.', 'A458');
      }
      /* A473 */
      if (bf > 0 && collectedTot > 0) {
        err(`${base}.BroughtFwdTDSAmt`,
          'In Schedule TCS, unclaimed TCS brought forward and details of TCS of the current financial year cannot be entered in the same row.', 'A473');
      }
      /* A478 */
      const cf = toNum(rec.AmtCarriedFwd);
      const expCf = bf + collectedTot - claimedTot;
      if ((cf !== 0 || expCf !== 0) && Math.abs(cf - expCf) > 1) {
        warn(`${base}.AmtCarriedFwd`,
          "In Schedule TCS, column 8 'TCS credit being carried forward' should equal column 5 + column 6 − column 7.", 'A478');
      }
    });
    const tcsTotal = num('ScheduleTCS.TotalSchTCS');
    if ((tcsSum !== 0 || tcsTotal !== 0) && Math.abs(tcsSum - tcsTotal) > 1) {
      err('ScheduleTCS.TotalSchTCS', 'In Schedule TCS, the total TCS claimed must equal the sum of the individual values.', 'A461');
    }

    /* 14 ── Part B-TI / Part B-TTI ------------------------------------------------- */
    /* A494 */
    const tiSalary = num('PartB-TI.Salaries');
    const schSalary = num('ScheduleS.TotIncUnderHeadSalaries');
    if ((tiSalary !== 0 || schSalary !== 0) && Math.abs(tiSalary - schSalary) > 1) {
      err('PartB-TI.Salaries',
        'Income claimed under the head Salaries in Part B-TI must equal the income as per Schedule Salary (sum of all employers).', 'A494');
    }
    /* A495 */
    const tiHp = num('PartB-TI.IncomeFromHP');
    const schHp = num('ScheduleHP.TotalIncomeChargeableUnHP');
    if ((tiHp !== 0 || schHp !== 0) && Math.abs(tiHp - schHp) > 1) {
      err('PartB-TI.IncomeFromHP',
        'Income claimed under the head House Property in Part B-TI must equal the income as per Schedule HP.', 'A495');
    }
    /* A490 / A515 */
    const tiShort = num('PartB-TI.CapGain.ShortTerm.TotalShortTerm');
    const tiLong = num('PartB-TI.CapGain.LongTerm.TotalLongTerm');
    const tiShortLong = num('PartB-TI.CapGain.ShortTermLongTermTotal');
    if ((tiShort !== 0 || tiLong !== 0 || tiShortLong !== 0) && Math.abs(tiShortLong - (tiShort + tiLong)) > 1) {
      err('PartB-TI.CapGain.ShortTermLongTermTotal',
        'In Part B-TI, the total capital gains must equal the sum of short-term and long-term capital gains.', 'A490');
    }
    const tiVda = num('PartB-TI.CapGain.CapGains30Per115BBH');
    const tiCapTotal = num('PartB-TI.CapGain.TotalCapGains');
    if ((tiCapTotal !== 0 || tiShortLong !== 0 || tiVda !== 0) && Math.abs(tiCapTotal - (tiShortLong + tiVda)) > 1) {
      err('PartB-TI.CapGain.TotalCapGains',
        'The total capital gains must equal the sum of Sl. No. 3c (short-term / long-term capital gains) and Sl. No. 3d (capital gain chargeable @ 30% u/s 115BBH).', 'A515');
    }
    /* A514 */
    if ((tiVda !== 0 || cgVda !== 0) && Math.abs(tiVda - cgVda) > 1) {
      err('PartB-TI.CapGain.CapGains30Per115BBH',
        'In Part B-TI, the income offered as capital gain chargeable @ 30% u/s 115BBH does not match Sl. No. C2 of Schedule CG.', 'A514');
    }
    /* A491 */
    const osParts = num('PartB-TI.IncFromOS.OtherSrcThanOwnRaceHorse') +
      num('PartB-TI.IncFromOS.IncChargblSplRate') + num('PartB-TI.IncFromOS.FromOwnRaceHorse');
    const osTotal = num('PartB-TI.IncFromOS.TotIncFromOS');
    if ((osParts !== 0 || osTotal !== 0) && Math.abs(osParts - osTotal) > 1) {
      err('PartB-TI.IncFromOS.TotIncFromOS',
        'The total income from other sources in Part B-TI must be the sum of the individual incomes under that head.', 'A491');
    }
    /* A492 */
    const headsSum = tiSalary + tiHp + tiCapTotal + osTotal;
    const totalTI = num('PartB-TI.TotalTI');
    if ((headsSum !== 0 || totalTI !== 0) && Math.abs(headsSum - totalTI) > 1) {
      err('PartB-TI.TotalTI', 'The total of all heads of income must equal the sum of the individual heads of income.', 'A492');
    }
    /* A503 */
    const cylaTotal = num('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff') +
      num('ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff');
    const tiCurLoss = num('PartB-TI.CurrentYearLoss');
    if ((cylaTotal !== 0 || tiCurLoss !== 0) && Math.abs(cylaTotal - tiCurLoss) > 1) {
      err('PartB-TI.CurrentYearLoss',
        'Losses of the current year set off against income from all heads must equal the total losses set off at Schedule CYLA.', 'A503');
    }
    /* A510 */
    const balAfterCyla = num('PartB-TI.BalanceAfterSetoffLosses');
    if ((balAfterCyla !== 0 || totalTI !== 0) && Math.abs(balAfterCyla - (totalTI - tiCurLoss)) > 1) {
      err('PartB-TI.BalanceAfterSetoffLosses',
        'In Part B-TI, Sl. No. 7 (balance after set off of current year losses) must equal Sl. No. 5 − Sl. No. 6.', 'A510');
    }
    /* A504 */
    const bflaTotal = num('ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff');
    const tiBf = num('PartB-TI.BroughtFwdLossesSetoff');
    if ((bflaTotal !== 0 || tiBf !== 0) && Math.abs(bflaTotal - tiBf) > 1) {
      err('PartB-TI.BroughtFwdLossesSetoff',
        'Brought-forward losses set off against balance income must equal the total of brought-forward losses set off at Schedule BFLA.', 'A504');
    }
    /* A505 */
    if ((gti !== 0 || totalTI !== 0) && Math.abs(gti - (totalTI - tiCurLoss - tiBf)) > 1) {
      err('PartB-TI.GrossTotalIncome',
        'Gross total income must equal Sl. No. 5 − current year losses set off (Sl. No. 6) − brought-forward losses set off (Sl. No. 8) in Part B-TI.', 'A505');
    }
    /* A506 */
    if ((totalIncome !== 0 || gti !== 0) && Math.abs(totalIncome - Math.round((gti - partBTIVia) / 10) * 10) > 10) {
      warn('PartB-TI.TotalIncome',
        'Total income should equal gross total income minus Chapter VI-A deductions, after rounding off.', 'A506');
    }
    /* A512 */
    const aggregate = num('PartB-TI.AggregateIncome');
    const aggExpect = totalIncome - num('PartB-TI.IncChargeableTaxSplRates') + partBTIAgri;
    if ((aggregate !== 0 || aggExpect !== 0) && Math.abs(aggregate - aggExpect) > 1) {
      warn('PartB-TI.AggregateIncome',
        'In Part B-TI, Sl. No. 15 (aggregate income) should equal 12 − 13 + 14.', 'A512');
    }
    /* A511 */
    const deemed115JC = num('PartB-TI.DeemedIncomeUs115JC');
    const amtAdjusted = num('ScheduleAMT.AdjustedUnderSec115JC');
    if ((deemed115JC !== 0 || amtAdjusted !== 0) && Math.abs(deemed115JC - amtAdjusted) > 1) {
      err('PartB-TI.DeemedIncomeUs115JC',
        'In Part B-TI, Sl. No. 17 (deemed income u/s 115JC) must equal Sl. No. 3 of Schedule AMT.', 'A511');
    }
    /* A420 / A428 — Schedule AMT arithmetic */
    if (has('ScheduleAMT')) {
      const amt1 = num('ScheduleAMT.TotalIncItemPartBTI');
      const amt2a = num('ScheduleAMT.DeductionClaimUndrAnySec');
      if ((amtAdjusted !== 0 || amt1 !== 0) && Math.abs(amtAdjusted - (amt1 + amt2a)) > 1) {
        err('ScheduleAMT.AdjustedUnderSec115JC',
          'In Schedule AMT, Sl. No. 3 (adjusted total income u/s 115JC) must equal Sl. No. 1 + 2a.', 'A420');
      }
      if (oldRegime && (amt1 !== 0 || totalIncome !== 0) && Math.abs(amt1 - totalIncome) > 1) {
        err('ScheduleAMT.TotalIncItemPartBTI',
          'In Schedule AMT, Sl. No. 1 must equal Sl. No. 12 (total income) of Part B-TI.', 'A419');
      }
      const amtTax = num('ScheduleAMT.TaxPayableUnderSec115JC');
      if (amtAdjusted > 2000000 && Math.abs(amtTax - Math.round(amtAdjusted * 0.185)) > 2) {
        warn('ScheduleAMT.TaxPayableUnderSec115JC',
          'In Schedule AMT, the tax payable u/s 115JC should be 18.5% of the adjusted total income where the adjusted total income exceeds Rs. 20 lakh.', 'A428');
      }
    }
    /* A486 */
    const lossesCf = num('PartB-TI.LossesOfCurrentYearCarriedFwd');
    const cflCurYear = num('ScheduleCFL.CurrentAYloss.CarryFwdLossDetail.TotalLossCF') ||
      num('ScheduleCFL.TotalLossCFSummary.TotalLossCF');
    if ((lossesCf !== 0 || cflCurYear !== 0) && Math.abs(lossesCf - cflCurYear) > 1) {
      warn('PartB-TI.LossesOfCurrentYearCarriedFwd',
        'Losses of the current year to be carried forward at Part B-TI should equal the total of current-year losses of Schedule CFL.', 'A486');
    }

    /* Part B-TTI */
    const ctl = asRecord(raw('PartB_TTI.ComputationOfTaxLiability')) || {};
    const taxOnTI = asRecord(ctl.TaxPayableOnTI) || {};
    const rebate87A = toNum(ctl.Rebate87A);
    /* A523 */
    const taxPayableOnTotInc = toNum(taxOnTI.TaxPayableOnTotInc);
    const taxNormalPlusSpecial = toNum(taxOnTI.TaxAtNormalRatesOnAggrInc) + toNum(taxOnTI.TaxAtSpecialRates) - toNum(taxOnTI.RebateOnAgriInc);
    if ((taxPayableOnTotInc !== 0 || taxNormalPlusSpecial !== 0) && Math.abs(taxPayableOnTotInc - taxNormalPlusSpecial) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc',
        'Tax payable on total income must equal normal tax plus special tax minus rebate on agricultural income.', 'A523');
    }
    /* A524 */
    const taxPayableOnRebate = toNum(ctl.TaxPayableOnRebate);
    if ((taxPayableOnRebate !== 0 || taxPayableOnTotInc !== 0) &&
      Math.abs(taxPayableOnRebate - Math.max(taxPayableOnTotInc - rebate87A, 0)) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.TaxPayableOnRebate',
        'The amount at "Tax payable" must equal the tax payable on total income minus the rebate u/s 87A.', 'A524');
    }
    /* A525 */
    const grossTaxLiab = toNum(ctl.GrossTaxLiability);
    const grossParts = taxPayableOnRebate + toNum(ctl.TotalSurcharge) + toNum(ctl.EducationCess);
    if ((grossTaxLiab !== 0 || grossParts !== 0) && Math.abs(grossTaxLiab - grossParts) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.GrossTaxLiability',
        'Gross tax liability must equal the sum of tax payable, surcharge and health & education cess.', 'A525');
    }
    /* A484 / A485 / A535 */
    if (rebate87A > 0) {
      if (newRegime && totalIncome > 1200000) {
        err('PartB_TTI.ComputationOfTaxLiability.Rebate87A',
          'An assessee with total income exceeding Rs. 12,00,000 (subject to marginal relief) cannot claim the rebate u/s 87A.', 'A484');
      }
      if (oldRegime) {
        if (rebate87A > 12500) {
          err('PartB_TTI.ComputationOfTaxLiability.Rebate87A',
            'Under the old tax regime, the rebate u/s 87A cannot exceed Rs. 12,500.', 'A485');
        }
        if (totalIncome > 500000) {
          err('PartB_TTI.ComputationOfTaxLiability.Rebate87A',
            'Under the old tax regime, the rebate u/s 87A cannot be claimed where the total income exceeds Rs. 5 lakh.', 'A535');
        }
      }
    }
    /* A487 */
    if (gti <= 0 && grossTaxLiab > 0) {
      err('PartB_TTI.ComputationOfTaxLiability.GrossTaxLiability',
        'Tax computation should not be more than zero where the gross total income is nil.', 'A487');
    }
    /* A526 / A527 / A528 */
    const relief = asRecord(ctl.TaxRelief) || {};
    const totRelief = toNum(relief.TotTaxRelief);
    const reliefParts = toNum(relief.Section89) + toNum(relief.Section90) + toNum(relief.Section91);
    if ((totRelief !== 0 || reliefParts !== 0) && Math.abs(totRelief - reliefParts) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.TaxRelief.TotTaxRelief',
        'Total tax relief must equal the sum of relief u/s 89, u/s 90/90A and u/s 91.', 'A528');
    }
    const trDtaa = num('ScheduleTR1.TaxReliefOutsideIndiaDTAA');
    const trNonDtaa = num('ScheduleTR1.TaxReliefOutsideIndiaNotDTAA');
    if ((toNum(relief.Section90) !== 0 || trDtaa !== 0) && Math.abs(toNum(relief.Section90) - trDtaa) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section90',
        'Relief claimed u/s 90/90A in Part B-TTI must equal the amount entered in Schedule TR.', 'A526');
    }
    if ((toNum(relief.Section91) !== 0 || trNonDtaa !== 0) && Math.abs(toNum(relief.Section91) - trNonDtaa) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section91',
        'Relief claimed u/s 91 in Part B-TTI must equal the amount entered in Schedule TR.', 'A527');
    }
    /* A542 */
    if (toNum(relief.Section89) > 0 && schSalary <= 0) {
      err('PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section89',
        'Relief u/s 89 cannot be claimed where the details of salary are zero or blank.', 'A542');
    }
    /* A529 */
    const intr = asRecord(ctl.IntrstPay) || {};
    const intrTotal = toNum(intr.TotalIntrstPay);
    const intrParts = toNum(intr.IntrstPayUs234A) + toNum(intr.IntrstPayUs234B) + toNum(intr.IntrstPayUs234C) +
      toNum(intr.LateFilingFee234F) + toNum(intr.FeeFurnishRevisedReturn234I ?? 0);
    if ((intrTotal !== 0 || intrParts !== 0) && Math.abs(intrTotal - intrParts) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.IntrstPay.TotalIntrstPay',
        'Total interest and fee payable must equal interest u/s 234A + 234B + 234C + fee u/s 234F + 234-I.', 'A529');
    }
    /* A530 */
    const netTax = toNum(ctl.NetTaxLiability);
    const aggLiab = toNum(ctl.AggregateTaxInterestLiability);
    if ((aggLiab !== 0 || netTax !== 0) && Math.abs(aggLiab - (netTax + intrTotal)) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.AggregateTaxInterestLiability',
        'Aggregate liability must equal net tax liability plus total interest payable.', 'A530');
    }
    /* A541 */
    const taxAfterJD = toNum(ctl.TaxPayAfterCreditUs115JD);
    if ((netTax !== 0 || taxAfterJD !== 0) && Math.abs(netTax - (taxAfterJD - totRelief)) > 1) {
      warn('PartB_TTI.ComputationOfTaxLiability.NetTaxLiability',
        'In Part B-TTI, Sl. No. 12 (net tax liability) should equal Sl. No. 10 − 11d.', 'A541');
    }
    /* A518 */
    const creditJD = toNum(ctl.CreditUS115JD);
    const amtcUtilised = num('ScheduleAMTC.TaxSection115JD') || num('ScheduleAMTC.TotAmtCreditUtilisedCY');
    if ((creditJD !== 0 || amtcUtilised !== 0) && Math.abs(creditJD - amtcUtilised) > 1) {
      err('PartB_TTI.ComputationOfTaxLiability.CreditUS115JD',
        'The credit u/s 115JD of tax paid in earlier years must equal Sl. No. 5 of Schedule AMTC.', 'A518');
    }
    /* A517 / A519 */
    if (oldRegime && has('ScheduleAMT')) {
      const amtTax = num('ScheduleAMT.TaxPayableUnderSec115JC');
      const ttiDeemed = num('PartB_TTI.TaxPayDeemedTotIncUs115JC');
      if ((amtTax !== 0 || ttiDeemed !== 0) && Math.abs(amtTax - ttiDeemed) > 1) {
        err('PartB_TTI.TaxPayDeemedTotIncUs115JC',
          'Tax payable on deemed total income u/s 115JC in Part B-TTI must equal Sl. No. 4 of Schedule AMT.', 'A517');
      }
      /* A522 */
      const deemedTotal = num('PartB_TTI.TotalTaxPayablDeemedTotInc');
      const deemedParts = ttiDeemed + num('PartB_TTI.Surcharge') + num('PartB_TTI.HealthEduCess');
      if ((deemedTotal !== 0 || deemedParts !== 0) && Math.abs(deemedTotal - deemedParts) > 1) {
        err('PartB_TTI.TotalTaxPayablDeemedTotInc',
          'In Part B-TTI, Sl. No. 1d (total tax payable on deemed total income) must equal the sum of 1a + 1b + 1c.', 'A522');
      }
    }
    /* A539 */
    if (toNum(ctl.GrossTaxPayable) > 0 &&
      toNum(ctl.GrossTaxPayable) < Math.max(grossTaxLiab, num('PartB_TTI.TotalTaxPayablDeemedTotInc')) - 1) {
      err('PartB_TTI.ComputationOfTaxLiability.GrossTaxPayable',
        'Gross tax payable must be the higher of the total tax payable on deemed total income and the gross tax liability.', 'A539');
    }

    /* Taxes paid */
    const paid = asRecord(at(raw('PartB_TTI.TaxPaid'), 'TaxesPaid')) || {};
    const advance = toNum(paid.AdvanceTax);
    const sat = toNum(paid.SelfAssessmentTax);
    const tdsPaid = toNum(paid.TDS);
    const tcsPaid = toNum(paid.TCS);
    const totalPaid = toNum(paid.TotalTaxesPaid);
    /* A531 */
    if ((totalPaid !== 0 || advance + tdsPaid + tcsPaid + sat !== 0) &&
      Math.abs(totalPaid - (advance + tdsPaid + tcsPaid + sat)) > 1) {
      err('PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid',
        'Total taxes paid must equal the sum of advance tax, TDS, TCS and self-assessment tax.', 'A531');
    }
    /* A493 */
    const tdsClaimTotal = tds1Total + tds2Total + tds3Total;
    if ((tdsPaid !== 0 || tdsClaimTotal !== 0) && Math.abs(tdsPaid - tdsClaimTotal) > 1) {
      err('PartB_TTI.TaxPaid.TaxesPaid.TDS',
        'The TDS claimed in Part B-TTI must equal the claims made in Schedules TDS-1, TDS-2 and TDS-3.', 'A493');
    }
    /* A460 */
    if ((tcsPaid !== 0 || tcsTotal !== 0) && Math.abs(tcsPaid - tcsTotal) > 1) {
      err('PartB_TTI.TaxPaid.TaxesPaid.TCS',
        'The TCS at Sl. No. 15(c) of Part B-TTI must equal the total of column 7(i) of Schedule TCS.', 'A460');
    }
    /* A520 / A521 */
    if (itSum > 0) {
      if (Math.abs(advance - advanceFromChallans) > 1) {
        err('PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax',
          `Advance tax in Part B-TTI must equal the total of the challans in Schedule IT deposited between ${FY_START} and ${FY_END}.`, 'A521');
      }
      if (Math.abs(sat - satFromChallans) > 1) {
        err('PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax',
          `Self-assessment tax in Part B-TTI must equal the total of the challans in Schedule IT deposited after ${FY_END}.`, 'A520');
      }
    }
    /* A536 / A537 */
    const refundDue = num('PartB_TTI.Refund.RefundDue');
    const taxPayableFinal = num('PartB_TTI.TaxPayable');
    if (totalPaid >= aggLiab) {
      const expectedRefund = Math.round((totalPaid - aggLiab) / 10) * 10;
      if (Math.abs(refundDue - expectedRefund) > 10) {
        err('PartB_TTI.Refund.RefundDue',
          'The refund claimed must match the difference between total taxes paid and the aggregate liability.', 'A536');
      }
    } else if (taxPayableFinal !== 0 || aggLiab - totalPaid !== 0) {
      const expectedPayable = Math.round((aggLiab - totalPaid) / 10) * 10;
      if (Math.abs(taxPayableFinal - expectedPayable) > 10) {
        err('PartB_TTI.TaxPayable',
          'The tax payable amount must match the difference between the aggregate liability and total taxes paid.', 'A537');
      }
    }
    /* A538 */
    if (totalPaid > 0 && totalTI === 0 && grossTaxLiab === 0) {
      err('PartB-TI.TotalIncome',
        'Income details and tax computation must be disclosed where details regarding taxes paid have been disclosed.', 'A538');
    }
    /* Bank details for the refund */
    const bankRows = rows('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails');
    if (!bankRows.length && !rows('PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails').length) {
      err('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails',
        'At least one bank account must be furnished in Part B-TTI (mandatory even when no refund is due).', 'SCHEMA/Bank');
    }
    bankRows.forEach((r, i) => {
      const rec = asRecord(r) || {};
      const base = `PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[${i}]`;
      for (const f of ['IFSCCode', 'BankName', 'BankAccountNo'] as const) {
        if (isEmpty(rec[f])) err(`${base}.${f}`, `${humanise(f)} is mandatory for every bank account.`, 'SCHEMA/Bank');
      }
      const ifsc = toStr(rec.IFSCCode);
      if (ifsc && !/^[A-Za-z]{4}[0-9A-Za-z]{7}$/.test(ifsc)) {
        err(`${base}.IFSCCode`, `IFSC "${ifsc}" is not in a valid format (4 letters followed by 7 characters).`, 'A532');
      }
    });
    if (refundDue > 0 && bankRows.length &&
      !bankRows.some((r) => toStr((asRecord(r) || {}).UseForRefund).toUpperCase() === 'TRUE' ||
        toStr((asRecord(r) || {}).UseForRefund).toUpperCase() === 'Y')) {
      err('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails',
        'A refund is claimed — at least one bank account must be nominated for the refund.', 'SCHEMA/Bank');
    }
    /* A694 / A695 — fee u/s 234-I on a revised return filed after 31.12.2026 */
    if (fileSec === 17) {
      const fee234I = toNum(intr.FeeFurnishRevisedReturn234I ?? 0);
      const expected = totalIncome > 500000 ? 5000 : 1000;
      if (fee234I > 0 && fee234I !== expected) {
        warn('PartB_TTI.ComputationOfTaxLiability.IntrstPay',
          `The fee for furnishing a revised return u/s 234-I after 31/12/2026 should be Rs. ${expected.toLocaleString('en-IN')}.`,
          totalIncome > 500000 ? 'A695' : 'A694');
      }
    }

    /* 15 ── Schedule CYLA / BFLA / CFL ---------------------------------------------- */
    /* A250 / A251 / A262 */
    const cylaSalary = num('ScheduleCYLA.Salary.IncCYLA.IncOfCurYrUnderThatHead');
    if ((cylaSalary !== 0 || schSalary !== 0) && Math.abs(cylaSalary - schSalary) > 1) {
      err('ScheduleCYLA.Salary.IncCYLA.IncOfCurYrUnderThatHead',
        'In Schedule CYLA, the salary income must equal Sl. No. 6 of Schedule Salary.', 'A262');
    }
    const cylaHp = num('ScheduleCYLA.HP.IncCYLA.IncOfCurYrUnderThatHead');
    if ((cylaHp !== 0 || schHp !== 0) && Math.abs(cylaHp - schHp) > 1) {
      err('ScheduleCYLA.HP.IncCYLA.IncOfCurYrUnderThatHead',
        'The house-property loss / income claimed at Schedule CYLA must equal the amount at Schedule HP.', 'A250');
    }
    const cylaOs = num('ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.IncOfCurYrUnderThatHead');
    const schOsNet = num('ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse');
    if ((cylaOs !== 0 || schOsNet !== 0) && Math.abs(cylaOs - schOsNet) > 1) {
      err('ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.IncOfCurYrUnderThatHead',
        'The other-sources income / loss at Schedule CYLA must equal Sl. No. 6 of Schedule OS.', 'A251');
    }
    /* A264 / A265 — new regime bars HP-loss set-off */
    if (newRegime) {
      const hpSetoff = num('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff');
      if (hpSetoff > 0) {
        err('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff',
          'Under the new tax regime, house-property loss of the current year cannot be set off against any other income.', 'A264');
      }
      const hpRemain = num('ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff');
      if (hpRemain > 0) {
        warn('ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff',
          'Under the new tax regime, Schedule CYLA Sl. No. 2xiv cannot be more than zero.', 'A265');
      }
    }
    /* A249 — house-property loss set-off capped at Rs. 2,00,000 under the old regime */
    if (oldRegime && num('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff') > 200000) {
      err('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff',
        "Total house-property loss of the current year set off cannot exceed Rs. 2,00,000.", 'A249');
    }
    /* A239 / A240 — BFLA column 1 must come from CYLA column 4 */
    const cylaBflaPairs: Array<[string, string, string]> = [
      ['Salary', 'Salary', 'A239'],
      ['HP', 'HP', 'A240'],
      ['STCG20Per', 'STCG20Per', 'A579'],
      ['STCG30Per', 'STCG30Per', 'A241'],
      ['STCGAppRate', 'STCGAppRate', 'A242'],
      ['STCGDTAARate', 'STCGDTAARate', 'A243'],
      ['LTCG12_5Per', 'LTCG12_5Per', 'A580'],
      ['LTCGDTAARate', 'LTCGDTAARate', 'A244'],
      ['OthSrcExclRaceHorse', 'OthSrcExclRaceHorse', 'A245'],
      ['OthSrcRaceHorse', 'OthSrcRaceHorse', 'A246'],
      ['IncOSDTAA', 'IncOSDTAA', 'A587'],
    ];
    for (const [cy, bf, rule] of cylaBflaPairs) {
      const a = num(`ScheduleCYLA.${cy}.IncCYLA.IncOfCurYrAfterSetOff`);
      const b = num(`ScheduleBFLA.${bf}.IncBFLA.IncOfCurYrUndHeadFromCYLA`);
      if ((a !== 0 || b !== 0) && Math.abs(a - b) > 1) {
        err(`ScheduleBFLA.${bf}.IncBFLA.IncOfCurYrUndHeadFromCYLA`,
          `In Schedule BFLA, the current-year income under "${humanise(bf)}" must match the corresponding column 4 figure of Schedule CYLA.`, rule);
      }
    }
    /* A238 / A269 / A270 — BFLA column arithmetic */
    for (const head of ['HP', 'STCG20Per', 'STCG30Per', 'STCGAppRate', 'STCGDTAARate', 'LTCG12_5Per', 'LTCGDTAARate', 'OthSrcRaceHorse'] as const) {
      const c1 = num(`ScheduleBFLA.${head}.IncBFLA.IncOfCurYrUndHeadFromCYLA`);
      const c2 = num(`ScheduleBFLA.${head}.IncBFLA.BFlossPrevYrUndSameHeadSetoff`);
      const c3 = num(`ScheduleBFLA.${head}.IncBFLA.IncOfCurYrAfterSetOffBFLosses`);
      if ((c1 !== 0 || c2 !== 0 || c3 !== 0) && Math.abs(c3 - (c1 - c2)) > 1) {
        err(`ScheduleBFLA.${head}.IncBFLA.IncOfCurYrAfterSetOffBFLosses`,
          'In Schedule BFLA, column 3 must equal column 1 minus column 2.', 'A238');
      }
      if (c2 > c1 + 1) {
        err(`ScheduleBFLA.${head}.IncBFLA.BFlossPrevYrUndSameHeadSetoff`,
          'In Schedule BFLA, the value in column 2 cannot exceed the amount referred to in column 1.', 'A269');
      }
    }
    /* A266 / A268 — CYLA set-off cannot exceed the loss / the income available */
    for (const head of ['Salary', 'HP', 'STCG20Per', 'STCG30Per', 'STCGAppRate', 'STCGDTAARate',
      'LTCG12_5Per', 'LTCGDTAARate', 'OthSrcExclRaceHorse', 'OthSrcRaceHorse', 'IncOSDTAA'] as const) {
      const inc = num(`ScheduleCYLA.${head}.IncCYLA.IncOfCurYrUnderThatHead`);
      const hpSet = num(`ScheduleCYLA.${head}.IncCYLA.HPlossCurYrSetoff`);
      const osSet = num(`ScheduleCYLA.${head}.IncCYLA.OthSrcLossNoRaceHorseSetoff`);
      if (inc > 0 && hpSet + osSet > inc + 1) {
        err(`ScheduleCYLA.${head}.IncCYLA`,
          'In Schedule CYLA, the sum of columns 2 and 3 cannot exceed the amount referred to in column 1.', 'A268');
      }
    }

    /* 16 ── Schedule SI / FSI / TR / PTI / SPI --------------------------------------- */
    /* A373 / A377 */
    let siInc = 0;
    let siTax = 0;
    rows('ScheduleSI.SplCodeRateTax').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const inc = toNum(rec.SplRateInc);
      const tax = toNum(rec.SplRateIncTax);
      siInc += inc;
      siTax += tax;
      if (isEmpty(rec.SecCode)) {
        err(`ScheduleSI.SplCodeRateTax[${i}].SecCode`, 'The section code is mandatory for every row of Schedule SI.', 'A368');
      }
      if (inc > 0 && tax <= 0) {
        err(`ScheduleSI.SplCodeRateTax[${i}].SplRateIncTax`,
          'In Schedule SI, the tax computed cannot be null where the income is greater than zero.', 'A373');
      }
      const rate = toNum(rec.SplRatePercent);
      if (inc > 0 && rate > 0 && Math.abs(tax - Math.round(inc * rate / 100)) > 2) {
        warn(`ScheduleSI.SplCodeRateTax[${i}].SplRateIncTax`,
          'In Schedule SI, the tax at column (ii) should equal the taxable income multiplied by the special rate.', 'A372');
      }
    });
    const siTotInc = num('ScheduleSI.TotSplRateInc');
    const siTotTax = num('ScheduleSI.TotSplRateIncTax');
    if ((siInc !== 0 || siTotInc !== 0) && Math.abs(siInc - siTotInc) > 1) {
      err('ScheduleSI.TotSplRateInc', 'The total of all special incomes must match the total income in Schedule SI.', 'A376');
    }
    if ((siTax !== 0 || siTotTax !== 0) && Math.abs(siTax - siTotTax) > 1) {
      err('ScheduleSI.TotSplRateIncTax',
        'In Schedule SI, the total of the column "Tax thereon (ii)" must equal the value entered in the individual columns.', 'A377');
    }
    /* A374 */
    const tiSpecial = num('PartB-TI.IncChargeableTaxSplRates');
    if ((tiSpecial !== 0 || siTotInc !== 0) && Math.abs(tiSpecial - siTotInc) > 1) {
      err('PartB-TI.IncChargeableTaxSplRates',
        'In Part B-TI, income chargeable to tax at special rates must be consistent with all the special incomes of Schedule SI.', 'A374');
    }
    /* A368 */
    if (siTotInc <= 0 && toNum(taxOnTI.TaxAtSpecialRates) > 0) {
      err('PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxAtSpecialRates',
        'Where no special income is shown, tax at special rates must not be computed.', 'A368');
    }
    /* A513 */
    if (tiSpecial > 0 && !has('ScheduleSI')) {
      err('ScheduleSI',
        'A taxpayer cannot offer income chargeable at special rates in Part B-TI without mentioning the same in the respective schedules.', 'A513');
    }
    /* Schedule FSI / TR consistency (A444 / A454 / A455) */
    let fsiPaidTotal = 0;
    let fsiReliefTotal = 0;
    rows('ScheduleFSI.ScheduleFSIDtls').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const base = `ScheduleFSI.ScheduleFSIDtls[${i}]`;
      for (const f of ['CountryCodeExcludingIndia', 'TaxIdentificationNo'] as const) {
        if (isEmpty(rec[f])) {
          err(`${base}.${f}`, `${humanise(f)} is mandatory for every country row of Schedule FSI.`, 'A454');
        }
      }
      const heads = ['IncFromSal', 'IncFromHP', 'IncCapGain', 'IncOthSrc'] as const;
      let inc = 0; let paidC = 0; let reliefC = 0;
      for (const h of heads) {
        const blk = asRecord(rec[h]) || {};
        inc += toNum(blk.IncFrmOutsideInd);
        paidC += toNum(blk.TaxPaidOutsideInd);
        reliefC += toNum(blk.TaxReliefinInd);
        /* A442 */
        if (toNum(blk.TaxReliefinInd) > Math.min(toNum(blk.TaxPaidOutsideInd), toNum(blk.TaxPayableinInd)) + 1) {
          err(`${base}.${h}.TaxReliefinInd`,
            'In Schedule FSI, the tax relief available must be the lower of the tax paid outside India and the tax payable on such income in India.', 'A442');
        }
      }
      fsiPaidTotal += paidC;
      fsiReliefTotal += reliefC;
      const totalCw = asRecord(rec.TotalCountryWise) || {};
      const declaredInc = toNum(totalCw.IncFrmOutsideInd);
      if ((inc !== 0 || declaredInc !== 0) && Math.abs(inc - declaredInc) > 1) {
        err(`${base}.TotalCountryWise.IncFrmOutsideInd`,
          'In Schedule FSI, the total of column (b) "Income from outside India" must equal the sum of salary + house property + capital gains + other sources.', 'A444');
      }
      /* A446 / A447 / A448 */
      if (toNum(at(rec.IncFromSal, 'IncFrmOutsideInd')) > num('ScheduleS.TotalGrossSalary') + 1) {
        err(`${base}.IncFromSal.IncFrmOutsideInd`,
          'Where tax relief is claimed against salary income, the gross salary in Schedule Salary cannot be less than the salary shown in Schedule FSI.', 'A446');
      }
      if (toNum(at(rec.IncFromHP, 'IncFrmOutsideInd')) > schHp + 1) {
        err(`${base}.IncFromHP.IncFrmOutsideInd`,
          'Where tax relief is claimed against house property, the income in Schedule HP cannot be less than the amount shown in Schedule FSI.', 'A447');
      }
      if (toNum(at(rec.IncCapGain, 'IncFrmOutsideInd')) > totCg + 1 && totCg > 0) {
        err(`${base}.IncCapGain.IncFrmOutsideInd`,
          'Where tax relief is claimed against capital gains, the capital gains shown cannot be less than the amount shown in Schedule FSI.', 'A448');
      }
    });
    const trPaid = num('ScheduleTR1.TotalTaxPaidOutsideIndia');
    const trRelief = num('ScheduleTR1.TotalTaxReliefOutsideIndia');
    if ((trPaid !== 0 || fsiPaidTotal !== 0) && Math.abs(trPaid - fsiPaidTotal) > 1) {
      err('ScheduleTR1.TotalTaxPaidOutsideIndia',
        'In Schedule TR, the total taxes paid outside India must match the total of column (c) of Schedule FSI for each country.', 'A454');
    }
    if ((trRelief !== 0 || fsiReliefTotal !== 0) && Math.abs(trRelief - fsiReliefTotal) > 1) {
      err('ScheduleTR1.TotalTaxReliefOutsideIndia',
        'In Schedule TR, the total tax relief available must match the total of column (e) of Schedule FSI for each country.', 'A455');
    }
    let trDtaaSum = 0;
    let trNonDtaaSum = 0;
    rows('ScheduleTR1.ScheduleTR').forEach((r, i) => {
      const rec = asRecord(r) || {};
      const sec = toStr(rec.ReliefClaimedUsSection);
      const rel = toNum(rec.TaxReliefOutsideIndia);
      if (isEmpty(rec.CountryCodeExcludingIndia)) {
        err(`ScheduleTR1.ScheduleTR[${i}].CountryCodeExcludingIndia`, 'The country code is mandatory in Schedule TR.', 'A454');
      }
      if (isEmpty(sec) && rel > 0) {
        err(`ScheduleTR1.ScheduleTR[${i}].ReliefClaimedUsSection`, 'The section under which relief is claimed must be selected in Schedule TR.', 'A451');
      }
      if (/90/.test(sec)) trDtaaSum += rel; else if (/91/.test(sec)) trNonDtaaSum += rel;
    });
    if ((trDtaa !== 0 || trDtaaSum !== 0) && Math.abs(trDtaa - trDtaaSum) > 1) {
      err('ScheduleTR1.TaxReliefOutsideIndiaDTAA',
        'In Schedule TR, the total relief in respect of countries where a DTAA applies (s.90/90A) must match the sum of the corresponding rows.', 'A451');
    }
    if ((trNonDtaa !== 0 || trNonDtaaSum !== 0) && Math.abs(trNonDtaa - trNonDtaaSum) > 1) {
      err('ScheduleTR1.TaxReliefOutsideIndiaNotDTAA',
        'In Schedule TR, the total relief in respect of countries where no DTAA applies (s.91) must match the sum of the corresponding rows.', 'A452');
    }
    /* A79 / A432 — pass-through income linkage */
    const ptiHp = num('ScheduleHP.PassThrIncome');
    const ptiSchHp = rows('SchedulePTI.SchedulePTIDtls').reduce<number>((t, r) => t + toNum(at(r, 'IncHP')), 0);
    if (ptiHp > 0 && ptiSchHp > 0 && Math.abs(ptiHp - ptiSchHp) > 1) {
      warn('ScheduleHP.PassThrIncome',
        'In Schedule HP, the pass-through income should equal the amount of house-property income mentioned in Schedule PTI.', 'A79');
    }
    /* Schedule SPI */
    rows('ScheduleSPI.SpecifiedPerson').forEach((r, i) => {
      const rec = asRecord(r) || {};
      for (const f of ['SpecifiedPersonName', 'ReltnShip', 'AmtIncluded', 'HeadIncIncluded'] as const) {
        if (isEmpty(rec[f])) {
          err(`ScheduleSPI.SpecifiedPerson[${i}].${f}`,
            `${humanise(f)} is mandatory for every person whose income is included in the computation.`, 'SCHEMA/SPI');
        }
      }
      if (isEmpty(rec.PANofSpecPerson) && isEmpty(rec.AaadhaarOfSpecPerson)) {
        err(`ScheduleSPI.SpecifiedPerson[${i}].PANofSpecPerson`,
          'The PAN (or Aadhaar) of the specified person is mandatory in Schedule SPI.', 'SCHEMA/SPI');
      }
    });
    /* A480 / A481 — Schedule ESOP */
    if (has('ScheduleESOP')) {
      if (isEmpty(raw('ScheduleESOP.PanofStartUp'))) {
        err('ScheduleESOP.PanofStartUp', 'The PAN of the eligible start-up is mandatory in the Schedule "Tax deferred on ESOP".', 'A545');
      }
      if (isEmpty(raw('ScheduleESOP.DPIITRegNo'))) {
        err('ScheduleESOP.DPIITRegNo', 'The DPIIT registration number is mandatory in the Schedule "Tax deferred on ESOP".', 'A545');
      }
      const esopCf = num('PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxDeferred17');
      if (esopCf > 0 && !anyNumeric(raw('ScheduleESOP'))) {
        err('ScheduleESOP',
          'Tax deferred on ESOP is carried in Part B-TTI — the Schedule "Tax deferred on ESOP" must be filled.', 'A545');
      }
    }
  } catch {
    /* Never throw on a malformed payload — surface the failure as an issue instead. */
    warnings.push({
      path: 'ITR.ITR2',
      msg: 'The payload could not be fully analysed (unexpected structure); the mandatory-field list above may be incomplete.',
    });
  }

  return report();
};

export default checkMandatory;
