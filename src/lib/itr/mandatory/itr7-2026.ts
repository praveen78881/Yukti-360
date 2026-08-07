/**
 * OFFICIAL mandatory-field validator — ITR-7, Assessment Year 2026-27.
 *
 * Sources (distilled at build time — the raw schema is NOT imported):
 *  - ITD JSON schema "ITR-7_2026_Main_V0.1.json" (payload root { ITR: { ITR7: ... } }).
 *    The file carries no `version` key; the identity of the release is the file name
 *    plus the Form_ITR7.SchemaVer / FormVer pattern "Ver1.0".
 *  - ITD "ITR 7 – Validation Rules for AY 2026-27" V1.0 (09-Jul-2026), Category A
 *    ("return will not be allowed to be uploaded") — every rule that can be decided
 *    on the exported JSON alone. Rules needing CPC/PAN-database/e-verification state
 *    (A-1 name vs PAN database, A-51 due-date, A-54 verification mode, A-61 uploader
 *    PAN, A-187 TAN master list, Annexure-1 Form 10B/10BB tallies) are out of scope.
 *
 * AY 2026-27 differs materially from AY 2025-26: Schedule LA is gone (political
 * parties now file Schedule PP), Schedule ET/VC/A/J/R gained fields, Part B-TI B1/B2/B3
 * were re-cut, and SectionRegistered gained codes X/XI/XII. Nothing here is carried
 * over from the 2025-26 module untested against the 2026 schema.
 *
 * Self-contained per the contract in ./types. Never throws on partial payloads.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr7';
const AY = '2026-27';
const SCHEMA_VERSION = 'ITR-7_2026_Main_V0.1';
const ROOT = 'ITR.ITR7.';

/* Financial year 2025-26 boundaries used by the date rules. */
const FY_START = '2025-04-01';
const FY_END = '2026-03-31';
const AY_START = '2026-04-01';

/* ════════════════════════════════════════════════════════════════════════════
 * 1. REQUIRED TREE — unbroken `required` chain from ITR.ITR7 (101 leaf paths)
 * ═══════════════════════════════════════════════════════════════════════════ */
const HARD: Record<string, string[]> = {
  'CreationInfo': ['SWVersionNo', 'SWCreatedBy', 'JSONCreatedBy', 'JSONCreationDate', 'IntermediaryCity', 'Digest'],
  'Form_ITR7': ['FormName', 'Description', 'AssessmentYear', 'SchemaVer', 'FormVer'],
  'PartA_GEN1.OrgFirmInfo': ['AssesseeName.SurNameOrOrgName', 'PAN', 'DateOFFormOrIncorp', 'StatusOrCompanyType', 'ReturnFurnishedSec', 'SecExemptionClaimed'],
  'PartA_GEN1.OrgFirmInfo.Address': ['ResidenceNo', 'LocalityOrArea', 'CityOrTownOrDistrict', 'StateCode', 'CountryCodeMobile', 'MobileNo', 'EmailAddress'],
  'PartA_GEN1.FilingStatus': ['ReturnFileSec.IncomeTaxSec', 'ResidentialStatus', 'PartnerInFirmFlg', 'HeldUnlistedEqShrPrYrFlg', 'AsseseeRepFlg'],
  'PartA_GEN2': ['LiableSec44ABflg', 'LiableAnyOthThnINTActflg'],
  'PARTA_BS.SourcesOfFund.OwnFund': ['Corpus80G', 'OtherCorpus', 'AccumulatedInc', 'AccumulatedIncUS10_11', 'BalDeemedInc', 'TotalOtherReserve', 'TotalFund'],
  'PARTA_BS.SourcesOfFund.LongTermBorrowings': ['SecuredLoan', 'UnSecuredLoan', 'TotalLoanFund'],
  'PARTA_BS.SourcesOfFund': ['Advances', 'TotSourceFund'],
  'PARTA_BS.ApplicationOfFunds.FixedAsset': ['GrossBlock', 'Depreciation', 'NetBlock'],
  'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrentAssets': ['Inventory', 'SundryDebtor', 'OtherCurrAssets', 'TotCurrAssets'],
  'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrentAssets.CashNCashEquivalents': ['BalWithBanks', 'CashInHand', 'Others', 'TotCashNCashEquivalents'],
  'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv': ['LoansandAdvances', 'Total', 'NetCurrAssets'],
  'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrLiabilitiesProviosions.CurrLiability': ['SundryCreditor', 'OtherPayable', 'TotalCurrLiabilitiesProviosions'],
  'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrLiabilitiesProviosions': ['Provisions', 'TotCurrLiabilitiesandprovisions'],
  'PARTA_BS.ApplicationOfFunds': ['TotalApplicationOfFunds'],
  'PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI': ['TaxAtNormalRates', 'TaxAtSpecialRates', 'DonationUs115BC', 'TaxAtMarginalRate', 'TaxPayableOnTotInc', 'TaxIncChargUs115BBI', 'RebateOnAgricultureInc'],
  'PartB_TTI.ComputationOfTaxLiability': ['Surcharge25ofSI', 'SurchargeOnTaxPayable', 'TotalSurcharge', 'EducationCess', 'GrossTaxLiability', 'NetTaxLiability', 'AggregateTaxInterestLiability'],
  'PartB_TTI.ComputationOfTaxLiability.TaxRelief': ['Section90', 'Section91', 'TotTaxRelief'],
  'PartB_TTI.ComputationOfTaxLiability.IntrstPay': ['IntrstPayUs234A', 'IntrstPayUs234B', 'IntrstPayUs234C', 'LateFilingFee234F', 'TotalIntrstPay'],
  'PartB_TTI.TaxPaid.TaxesPaid': ['AdvanceTax', 'TDS', 'TCS', 'SelfAssessmentTax', 'TotalTaxesPaid'],
  'PartB_TTI.TaxPaid': ['BalTaxPayable'],
  'PartB_TTI.Refund': ['RefundDue', 'NetTaxPyblOn115TDInc'],
  'PartB_TTI.Refund.BankAccountDtls': ['BankDtlsFlag'],
  'PartB_TTI': ['AssetOutsideIndiaFlg'],
  'Verification': ['Date', 'Place'],
  'Verification.Declaration': ['AssesseeVerName', 'FatherName', 'AssesseeVerPAN', 'Capacity'],
};

/* ════════════════════════════════════════════════════════════════════════════
 * 2. CONDITIONALLY REQUIRED SCALARS — schema `required` inside optional
 *    containers. Checked only when the container object is present in the JSON.
 * ═══════════════════════════════════════════════════════════════════════════ */
const COND: Record<string, string[]> = {
  'PartA_GEN1.OrgFirmInfo.Address.Phone': ['STDcode', 'PhoneNo'],
  'PartA_GEN1.OrgFirmInfo.AlternateAddress': ['ResidenceNo', 'LocalityOrArea', 'CityOrTownOrDistrict', 'StateCode'],
  'PartA_GEN1.FilingStatus.AssesseeRep': ['RepName', 'RepEmailID', 'CountryCodeRepMobileNo', 'RepMobileNo'],
  'PartA_GEN2.OtherDetailsFor7': ['OtherDetailsUs2_15', 'FirstReturnFlag', 'ProvisionsSec1310Applcbl'],
  'PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15': ['CharitablePurposeOfGeneralPublic'],
  'ITRScheduleI': ['TotAmountAccumlated', 'TotAmountAppliedPreviousYear', 'TotBalanceAfterPY', 'TotAmountInvested', 'TotAmtTxdErlAssYr', 'TotBalAvailApp', 'TotAmountAppliedDuringYear', 'TotAmountAppliedDuringYearOtherPurpose', 'TotAmountCreditedTrust', 'TotBalanceAmount', 'TotAmountInvestedInOtherMode', 'TotAmountNotUtilized', 'TotAmountDeemedUs11'],
  'ITRScheduleIA': ['YrOfAccDtls', 'GrandTotal'],
  'ITRScheduleD': ['TotAmountAppliedPY', 'TotOutOfDeemedAmtReqApp', 'TotAmtTxdErlAssYr', 'TotAmountToBeApplied', 'TotAmountAppliedCurrAY', 'TotAmountNotAppliedCurrAY', 'TotBalanceAmount'],
  'ITRScheduleDA': ['YrOfAccumDtls', 'GrandTotal'],
  'ITRScheduleJ': ['ScheduleJ_A1', 'ScheduleJ_A2'],
  'ITRScheduleJ.ScheduleJ_A1': ['TotOpeningBlc', 'TotReceivedCorpus', 'TotAppliedPY', 'TotAmtDepositedBack', 'TotTotAmtDepositedBack', 'TotClosingBlc', 'TotAmtTxdAssYr22_23', 'TotInvestment_11_5', 'TotInvestment_11_5_Other'],
  'ITRScheduleJ.ScheduleJ_A2': ['TotOpeningBlc', 'TotLoanBorrow', 'TotAppliedPY', 'TotRepayment', 'TotClosingBlc', 'TotTotRepOfLoan'],
  'ITRScheduleJ.ScheduleJUs11_5': ['TotalInvestmentAmt'],
  'ITRScheduleJ.ScheduleJUs13_3': ['TotalNoOfShares', 'TotalValueOfInvestment', 'TotalIncFromInvestment'],
  'ITRScheduleJ.ScheduleJOtherInvstmts': ['TotalNoOfShares', 'TotalValueOfInvestment'],
  'ITRScheduleJ.ScheduleJVoluntaryContribution': ['TotalValueOfContribution', 'TotalValOfContrbnAppdTwrdsObj', 'TotalAmtInvestedUs11', 'TotalBalIncUs11'],
  'ITRScheduleR.ClosngBalBalSheet': ['CorpOutOf80G2b', 'OthCorpReceived', 'CorpOthThan'],
  'ScheduleVDA': ['ScheduleVDADtls', 'TotIncBusiness', 'TotIncCapGain'],
  'SchedulePP': ['RegisterUS29A', 'RecognizedByECI', 'BooksOfAccMaintained', 'VoluntaryContribution', 'AccountsAudited', 'DonExceElectoralBond', 'ReportUs29', 'VoluntaryContributionElecBond', 'TotVCReceived'],
  'ScheduleET': ['BooksOfAccMaintained', 'VoluntaryContribution', 'RecordsMaintainedWithPAN', 'AccountsAudited', 'ReportAsPerRule17CA', 'VoluntaryContributionDtls'],
  'ScheduleET.VoluntaryContributionDtls': ['OpeningBalance', 'VoluntaryContributionDuringYr', 'TotalAfterVoluntaryContribution', 'AmtDistToPoliticalParties', 'AmtSpentOnManagingAffairs', 'Total', 'TotAmtExeUndSec13B', 'ClosingBalance'],
  'ScheduleVC': ['Local', 'Foreign', 'TotalContribution', 'AnonymousDonations'],
  'ScheduleVC.Local': ['CorpusFundDonation', 'CorpusFundDonationUS80G2b', 'CorpusFundDonationOther80G2b', 'GrantsReceivedFormGovt', 'GrantsReceivedFromCompanie', 'OtherSpecificGrants', 'OtherDonation', 'TotalOtherThanCorpusFund', 'VoluntaryContribution'],
  'ScheduleVC.Foreign': ['CorpusFundDonation', 'CorpusFundDonationUS80G2b', 'CorpusFundDonationOther80G2b', 'OtherThanCorpusFund', 'ForeignContribution'],
  'ScheduleVC.AnonymousDonations': ['AggregateAnonymousDonations', 'TotalDonationsReceived', 'AnonymousDonations115BBC', 'AnonymousDonationsOthr115BBC'],
  'ScheduleAI': ['RecptMainObj', 'RecptsIncidentalObj', 'Rent', 'Commission', 'DividendIncome', 'InterestIncome', 'AgricultureIncome', 'NetConsdrnTrnsfrCapAsst', 'PassThroughIncome', 'TotalofOtherIncomes', 'TotalofAggregateIncomes'],
  'ScheduleA': ['TotAmtAppDrngPrevYr', 'TotAmountAllowedApplication'],
  'ScheduleA.AppTowExpTrstInst.TotalA1toA11': ['Revenue', 'Capital', 'Total'],
  'ScheduleA.ExpNotAllowedApplication.TotExpNotAllowedApplication': ['Revenue', 'Capital', 'Total'],
  'ScheduleA.SrcRevCapApplctn.TotSrcRevCapApplctn': ['Revenue', 'Capital', 'Total'],
  'ScheduleA.TotAmtAppDrngPrevYr': ['Revenue', 'Capital', 'Total'],
  'ScheduleA.TotAmountAllowedApplication': ['Revenue', 'Capital', 'Total'],
  'ScheduleIE_I': ['TotRcptVoluntaryContr', 'AppIncTwrdsObjInstn', 'AccmltnOfInc'],
  'ScheduleIE_II': ['TotRcptVoluntaryContr', 'AppIncTwrdsObjInstn', 'AccmltnOfInc', 'AnyIncomeTaxable'],
  'ScheduleIE_IV': ['ScheduleIEIVDtls', 'SumGrossAnnualReceipts'],
  'ScheduleHP': ['TotalIncomeChargeableUnHP'],
  'ScheduleCG': ['ShortTermCapGain', 'LongTermCapGain', 'CurrYrLosses', 'IncChargeableHeadCapGain', 'SumOfCGIncm', 'IncmFromVDATrnsf', 'AccruOrRecOfCG'],
  'ScheduleOS': ['IncFrmLottery', 'DividendIncUs115BBDA', 'DividendIncUs115A1ai', 'DividendIncUs115BBDAaiii', 'DividendIncUs115AC', 'DividendIncUs115AD1iDiv', 'DividendDTAA', 'TotOthSrcNoRaceHorse', 'IncChargeableFrmOthSrc'],
  'ScheduleOA': ['IncUnHeadBPFlag'],
  'CorpScheduleBP': ['BusinessIncOthThanSpec', 'SpecBusinessInc', 'IncSpecifiedBusiness', 'IncChrgUnHdProftGain', 'BusSetoffCurrYr'],
  'ScheduleSI': ['TotSplRateInc', 'TotSplRateIncTax'],
  'Schedule115BBI': ['DeemedIncSec1023C_113', 'DeemedIncSec111B', 'IncDeemedSec131c', 'IncAccInExcess', 'IncNotExemptSec131d', 'IncNotExcludedSec111c', 'Total'],
  'ScheduleTR1': ['TotalTaxOutsideIndia', 'TotalTaxReliefOutsideIndia', 'TaxReliefOutsideIndiaDTAA', 'TaxReliefOutsideIndiaNotDTAA', 'TaxPaidOutsideIndFlg'],
  'ScheduleIT': ['TotalTaxPayments'],
  'ScheduleTDS2': ['TotalTDSonOthThanSals'],
  'ScheduleTDS3': ['TotalTDS3OnOthThanSal'],
  'ScheduleTCS': ['TotalSchTCS'],
  'PartB_TI': ['VcCorpusSec11', 'IncToBeApplied', 'AggregateIncomeUs1112', 'AmtForCharitableUs111', 'TIDeductions', 'TIAdditions', 'IncChargeableUs11_4', 'IncChargUs115BBIIncld13', 'TotalTI', 'IncomeFromHP', 'CapGain', 'CurrentYearLoss', 'ProfBusGain', 'TotIncNotPart7And11Abv', 'GrossIncome', 'TotalIncome', 'IncChargeableTaxSplRates', 'DonationsUs115BBC', 'IncFromOS', 'AggIncothSpecInc115BBI'],
  'PartB_TI.TIDeductions': ['AmtAppliedtForCharitablePurpose', 'AmtAppForCharitablePurposeRepayment', 'AmtAppliedSpecifiedMode', 'AmtDeemedForCharitable', 'AmtAccumulatedForCharitable', 'AmtFulfilledUs11_2', 'TotalDeductions'],
  'PartB_TI.TIAdditions': ['IncChargeableUs115BBI', 'IncChargeableUs12_2', 'AmtDsllwblUs111RWS40AIA', 'AmtDsllwblUs111RWS40A3', 'IncExp3BUS80G', 'IncExp1BUS80G', 'AnyOthrIncome', 'TotalAdditions'],
  'PartB_TI.TIAdditions.ExemptionUs11_13Dtl': ['AnonymousDonationVC'],
  'PartB_TI.CapGain': ['ShortTerm', 'LongTerm', 'TotalCapGains', 'ShortTermLongTermTotal', 'CapGains30Per115BBH'],
  'PartB_TI.CapGain.ShortTerm': ['ShortTerm20Per', 'ShortTerm30Per', 'ShortTermAppRate', 'ShortTermSplRateDTAA', 'TotalShortTerm'],
  'PartB_TI.CapGain.LongTerm': ['LongTerm12_5Per', 'LongTermSplRateDTAA', 'TotalLongTerm'],
  'PartB_TI2': ['ExemptionUs13_B', 'CapGain', 'TotIncNotPart7And11Abv', 'GrossIncome', 'GrossTotalIncome', 'IncChargeableTaxSplRates', 'AggregateIncome', 'IncomeChargeable11_3', 'TotExemptionUs10_21to29', 'ExemptionUs1021', 'ExemptionUs10_23A', 'ExemptionUs10_23AAA', 'ExemptionUs10_23B', 'ExemptionUs10_23EC', 'ExemptionUs10_23ED', 'ExemptionUs10_23EE', 'ExemptionUs10_29A', 'ExemptionUs10_23DA', 'ExemptionUs10_23FB', 'ExemptionUs10_24', 'ExemptionUs10_46', 'ExemptionUs10_46A', 'ExemptionUs10_46B', 'ExemptionUs10_47', 'ExemptionUs10_23Ciiiab', 'ExemptionUs10_23Ciiiac', 'ExemptionUs10_23Ciiiad', 'ExemptionUs10_23Ciiiae', 'IncFromOS', 'TotExemptionUs10_23Cto10_47', 'ExemptionUs13_A', 'VoluntaryContributions', 'IncomeFromHP', 'ProfBusGain', 'CurrentYearLoss', 'NetAgricultureIncomeOrOtherIncomeForRate', 'IncChrgbleMaxMarginalRates'],
  'PartB_TI2.CapGain': ['ShortTerm', 'LongTerm', 'TotalCapGains', 'ShortTermLongTermTotal', 'CapGains30Per115BBH'],
  'PartB_TI2.CapGain.ShortTerm': ['ShortTerm20Per', 'ShortTerm30Per', 'ShortTermAppRate', 'ShortTermSplRateDTAA', 'TotalShortTerm'],
  'PartB_TI2.CapGain.LongTerm': ['LongTerm12_5Per', 'LongTermSplRateDTAA', 'TotalLongTerm'],
  'PartB_TI2.ProfBusGain': ['ProfGainNoSpecBus'],
  'PartB_TI2.IncFromOS': ['TotIncFromOS'],
  'PartB_TI3.ComputationIncChargeable': ['TotIncPrevYr', 'TotExpIncur', 'ExpDisallowed', 'IncChargSec115BBI', 'IncChargSec114', 'SumTotal', 'IncNotForming', 'LossCurYrToBeSetOff', 'TotalInc', 'IncIncludedChargRateSpec', 'AnonymousDonation', 'IncChagrgSec13', 'Additions'],
  'PartB_TI3.ComputationIncChargeable.ExpDisallowed': ['ExpCorpusStandingCredit', 'ExpLoanBorrow', 'DeprRespAsset', 'ExpFormContri', 'CapExp', 'AmtDisallSubClauseiaSec40', 'AmtDisallSubSec3Sec40A', 'AmtDisallSubSec3ASec40A', 'AnyOthDisall', 'TotExpDisall'],
  'PartB_TI3.ComputationIncChargeable.Additions': ['IncChargSec115BBI', 'IncExemptNotAvail', 'IncChargSec122', 'IncExpl3B', 'IncExpl1B', 'AnyOthrIncome', 'TotAdditions'],
  'PartB_TI3.ComputationIncChargeable.IncNotForming': ['IncFromHP', 'ProfitGainsBP', 'CapGain', 'IncOS', 'Total'],
  'PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain': ['ShortTerm', 'LongTerm', 'TotalCapGains', 'ShortTermLongTermTotal', 'CapGains30Per115BBH'],
  'PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain.ShortTerm': ['ShortTerm20Per', 'ShortTerm30Per', 'ShortTermAppRate', 'ShortTermSplRateDTAA', 'TotalShortTerm'],
  'PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain.LongTerm': ['LongTerm12_5Per', 'LongTermSplRateDTAA', 'TotalLongTerm'],
};

/* ════════════════════════════════════════════════════════════════════════════
 * 3. REPEATING TABLES — required fields of every element (nested rel-paths ok)
 * ═══════════════════════════════════════════════════════════════════════════ */
const ARR: Array<{ arr: string; fields: string[]; row: string }> = [
  { arr: 'PartA_GEN1.ProjectOrInstDtls', fields: ['NameOfProjectOrInst', 'ActivityNature', 'ClassificationCode'], row: 'Project/institution detail' },
  { arr: 'PartA_GEN1.RegApprUnderITADtls', fields: ['SectionRegistered', 'RegSecExmpClaimed', 'RegApprovalDate', 'ApprovalRegistrationNo', 'ApprovingAuthority'], row: 'Registration under the Income-tax Act' },
  { arr: 'PartA_GEN1.RegApprUnderOthITADtls', fields: ['LawRegistered', 'RegApprDate', 'ApprovalRegistrationNo', 'ApprovingAuthority'], row: 'Registration under another law' },
  { arr: 'PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls', fields: ['NameOfFirm', 'PAN'], row: 'Partner-in-firm detail' },
  { arr: 'PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls', fields: ['NameOfCompany', 'CompanyType', 'OpngBalNumberOfShares', 'OpngBalCostOfAcquisition', 'ClsngBalNumberOfShares', 'ClsngBalCostOfAcquisition'], row: 'Unlisted equity share holding' },
  { arr: 'PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.AggAnnualRecptsofInst', fields: ['NameOfTheInstitution', 'AggregateAnnualReceipts'], row: 'GPU institution receipts' },
  { arr: 'PartA_GEN2.AuditDetails', fields: ['AuditedSection', 'AuditFlag'], row: 'Audit information' },
  { arr: 'PartA_GEN2.LiableAnyOthThnINTActDetails', fields: ['AuditedAct', 'AuditedSection', 'DateOfAudit'], row: 'Audit under another Act' },
  { arr: 'PartA_GEN2.PartnerOrMemberInfo', fields: ['PartnerOrMemberName', 'Status', 'AddressDetailWithZipCode.AddrDetail', 'AddressDetailWithZipCode.CityOrTownOrDistrict', 'AddressDetailWithZipCode.StateCode', 'AddressDetailWithZipCode.CountryCode'], row: 'Partner/member detail' },
  { arr: 'PartA_GEN2.AuthorFounderDtls5percent', fields: ['Name', 'Relation', 'ShareHoldingPercentage', 'ResidentOfIndia', 'Address', 'MobileNo', 'EmailAddress'], row: 'Author/founder (individual)' },
  { arr: 'PartA_GEN2.AuthorFounderDtls5percentNonInd', fields: ['Name', 'ResidentOfIndia', 'Address', 'BeneficialPercentage'], row: 'Author/founder (non-individual)' },
  { arr: 'PartA_GEN2.ContributionUs13_3bDtls', fields: ['Name', 'Address'], row: 'Contributor u/s 13(3)(b)' },
  { arr: 'PartA_GEN2.ContributionHUFDtls', fields: ['Name', 'Address'], row: 'HUF-member contributor' },
  { arr: 'ITRScheduleI.ScheduleI', fields: ['AccumlatedYear', 'AmountAccumlated', 'AccumulationPurpose', 'AmountAppliedPreviousYear', 'BalanceAfterPY', 'AmtTxdErlAssYr', 'BalAvailApp', 'AmountAppliedDuringYear', 'AmountAppliedDuringYearOtherPurpose', 'AmountCreditedTrust', 'BalanceAmount', 'AmountInvested', 'AmountInvestedInOtherMode', 'AmountNotUtilized', 'AmountDeemedUs11'], row: 'Schedule I row' },
  { arr: 'ITRScheduleIA.YrOfAccDtls', fields: ['YrOfAccumulationIA', 'Total'], row: 'Schedule IA row' },
  { arr: 'ITRScheduleD.ScheduleD', fields: ['AppliedYear', 'AmountAppliedPY', 'DeemedApplicationReason', 'OutOfDeemedAmtReqApp', 'AmtTxdErlAssYr', 'AmountToBeApplied', 'AmountAppliedCurrAY', 'AmountNotAppliedCurrAY', 'BalanceAmount'], row: 'Schedule D row' },
  { arr: 'ITRScheduleDA.YrOfAccumDtls', fields: ['Total'], row: 'Schedule DA row' },
  { arr: 'ITRScheduleJ.ScheduleJ_A1.ScheduleJ_A1Dtls', fields: ['CorpusDonation', 'OpeningBlc', 'ReceivedCorpus', 'AppliedPY', 'AmtDepositedBack', 'TotAmtDepositedBack', 'ClosingBlc', 'Investment_11_5', 'AmtTxdAssYr22_23', 'Investment_11_5_Other'], row: 'Schedule J A(1) row' },
  { arr: 'ITRScheduleJ.ScheduleJ_A2.ScheduleJ_A2Dtls', fields: ['OpeningBlc', 'LoanBorrow', 'AppliedPY', 'Repayment', 'TotRepOfLoan', 'ClosingBlc'], row: 'Schedule J A(2) row' },
  { arr: 'ITRScheduleJ.ScheduleJUs11_5.ScheduleJUs11_5Dtls', fields: ['ModeOfInvestment', 'AmtOfInvestment'], row: 'Schedule J investment u/s 11(5)' },
  { arr: 'ITRScheduleJ.ScheduleJVoluntaryContribution.ScheduleJVoluntaryContributionDtls', fields: ['NameAndAddress', 'ValueOfContribution', 'ValueOfContributionObj', 'AmtInvestedUs11', 'BalIncUs11'], row: 'Schedule J voluntary contribution' },
  { arr: 'ScheduleVDA.ScheduleVDADtls', fields: ['DateofAcquisition', 'DateofTransfer', 'HeadUndIncTaxed', 'AcquisitionCost', 'ConsidReceived', 'IncomeFromVDA'], row: 'Schedule VDA row' },
  { arr: 'ScheduleIE_III.ScheduleIEIIIDtls', fields: ['ObjectiveOfInstitution', 'FlatDoorBlockNumber', 'AreaLocality', 'TownCityDistrict', 'StateCode', 'PinCode', 'TotRcptVoluntaryContr', 'GovtGrants', 'AmountAppliedObj', 'BalanceAccumulated'], row: 'Schedule IE-3 row' },
  { arr: 'ScheduleIE_IV.ScheduleIEIVDtls', fields: ['ObjectiveOfInstitution', 'FlatDoorBlockNumber', 'AreaLocality', 'TownCityDistrict', 'StateCode', 'PinCode', 'GrossAnnualReceipts', 'AmountAppliedObj', 'BalanceAccumulated'], row: 'Schedule IE-4 row' },
  { arr: 'ScheduleHP.PropertyDetails', fields: ['HPSNo', 'PropertyOwner', 'PropCoOwnedFlg', 'AssessePercentShareProp', 'ifLetOut', 'AddressDetailWithZipCode.AddrDetail', 'AddressDetailWithZipCode.CityOrTownOrDistrict', 'AddressDetailWithZipCode.StateCode', 'AddressDetailWithZipCode.CountryCode', 'Rentdetails.AnnualLetableValue', 'Rentdetails.RentNotRealized', 'Rentdetails.LocalTaxes', 'Rentdetails.TotalUnrealizedAndTax', 'Rentdetails.BalanceALV', 'Rentdetails.ThirtyPercentOfBalance', 'Rentdetails.IntOnBorwCap', 'Rentdetails.TotalDeduct', 'Rentdetails.IncomeOfHP'], row: 'House property' },
  { arr: 'ScheduleSI.SplCodeRateTax', fields: ['SecCode', 'SplRatePercent', 'SplRateInc', 'SplRateIncTax'], row: 'Schedule SI row' },
  { arr: 'Schedule115TD.DepositofTaxAccInc.DepositofTaxAccIncDtls', fields: ['DateDep', 'NameBankBranch', 'BSRCode', 'SrlNoOfChaln', 'Amount'], row: '115TD tax deposit' },
  { arr: 'ScheduleTR1.ScheduleTR', fields: ['CountryName', 'CountryCodeExcludingIndia', 'TaxIdentificationNo', 'TaxPaidOutsideIndia', 'TaxReliefOutsideIndia'], row: 'Schedule TR row' },
  { arr: 'ScheduleFSI.ScheduleFSIDtls', fields: ['CountryName', 'CountryCodeExcludingIndia', 'TaxIdentificationNo'], row: 'Schedule FSI row' },
  { arr: 'ScheduleIT.TaxPayment', fields: ['BSRCode', 'DateDep', 'SrlNoOfChaln', 'Amt'], row: 'Advance/self-assessment tax challan' },
  { arr: 'ScheduleTDS2.TDSOthThanSalaryDtls', fields: ['TDSCreditName', 'TDSSection', 'TANOfDeductor', 'AmtCarriedFwd', 'TaxDeductCreditDtls.TaxClaimedOwnHands'], row: 'TDS (Form 16A) row' },
  { arr: 'ScheduleTDS3.TDS3onOthThanSalDtls', fields: ['TDSCreditName', 'TDSSection', 'PANOfBuyerTenant', 'AmtCarriedFwd', 'TaxDeductCreditDtls.TaxClaimedOwnHands'], row: 'TDS (Form 16B/16C/16D/16E) row' },
  { arr: 'ScheduleTCS.TCSDetails', fields: ['EmployerOrDeductorOrCollectDetl.TAN', 'TCSClaimedThisYearDtls.TCSAmtCollOwnHands', 'AmtCarriedFwd'], row: 'TCS row' },
  { arr: 'PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', fields: ['IFSCCode', 'BankName', 'BankAccountNo', 'AccountType', 'UseForRefund'], row: 'Bank account' },
  { arr: 'PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails', fields: ['SWIFTCode', 'BankName', 'CountryCode', 'IBAN'], row: 'Foreign bank account' },
];

/* ════════════════════════════════════════════════════════════════════════════
 * 4. IDENTITY-CRITICAL ENUMS / PATTERNS (from the 2026 schema)
 * ═══════════════════════════════════════════════════════════════════════════ */
const RX_PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const RX_PAN_IND = /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/;
const RX_DATE = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const RX_TAN = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
const RX_SW = /^SW[0-9]{8}$/;
const RX_EMAIL = /^[.\w-]+@[\w-]+(\.[\w-]+)+$/;

const CAPACITY = ['MD', 'DR', 'PO', 'CE', 'RE', 'OT'];
const STATUS = ['4', '5', '6', '7'];
const SUB_STATUS = ['5i', '5v', '5vii', '7i', '7ii'];
const RET_SEC = ['139-4A', '139-4B', '139-4C', '139-4D'];
const RESIDENTIAL = ['RES', 'NRI'];
const FILE_SEC = [11, 12, 13, 14, 16, 17, 18, 19, 20];
const REG_SECTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VIII', 'IX', 'X', 'XI', 'XII'];
const EXEMPT_SECS = ['11', '13A', '13B', '21', '23A', '23B', '23CIIIAB', '23CIIIAC', '23CIIIAD', '23CIIIAE', '23CIV', '23CV', '23CVI', '23CVIA', '23D', '23DA', '23FB', '24', '26', '46A', '46B', '47', '23AAA', '23EC', '23ED', '23EE', '29A', '2135I'];
const STATE_CODES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '99'];

/* Exemption-section groupings driving the Category-A gating rules.
 * '26' = 10(46), '2135I' = 10(21) read with 35(1). */
const EX_11_23C = ['11', '23CIV', '23CV', '23CVI', '23CVIA'];
const EX_I_IA = [...EX_11_23C, '21', '2135I'];
const IE1SET = ['21', '2135I', '23AAA', '23B', '23D', '23DA', '23EC', '23ED', '23EE', '29A', '26', '46A', '46B', '47', '23FB'];
const IE2SET = ['23A', '24'];
const IE3SET = ['23CIIIAB', '23CIIIAC'];
const IE4SET = ['23CIIIAD', '23CIIIAE'];
const B2SET = ['13A', '13B', ...IE1SET, ...IE2SET, ...IE3SET, ...IE4SET];
const ANON_SET = [...EX_11_23C, '23CIIIAD', '23CIIIAE'];

/* Schedule may be FILLED only when the exemption section is in the allowed set. */
const GATE: Array<{ key: string; allowed: string[]; rule: string; name: string }> = [
  { key: 'ITRScheduleI', allowed: EX_I_IA, rule: 'A-71', name: 'Schedule I' },
  { key: 'ITRScheduleIA', allowed: EX_I_IA, rule: 'A-75', name: 'Schedule IA' },
  { key: 'ITRScheduleD', allowed: ['11'], rule: 'A-77', name: 'Schedule D' },
  { key: 'ITRScheduleDA', allowed: ['11'], rule: 'A-83', name: 'Schedule DA' },
  { key: 'ITRScheduleJ', allowed: EX_11_23C, rule: 'A-93', name: 'Schedule J' },
  { key: 'ITRScheduleR', allowed: EX_11_23C, rule: 'A-119', name: 'Schedule R' },
  { key: 'SchedulePP', allowed: ['13A'], rule: 'A-121/126', name: 'Schedule PP' },
  { key: 'ScheduleET', allowed: ['13B'], rule: 'A-128/136', name: 'Schedule ET' },
  { key: 'ScheduleAI', allowed: EX_11_23C, rule: 'A-142', name: 'Schedule AI' },
  { key: 'ScheduleA', allowed: EX_11_23C, rule: 'A-152', name: 'Schedule A' },
  { key: 'ScheduleIE_I', allowed: IE1SET, rule: 'A-170', name: 'Schedule IE-1' },
  { key: 'ScheduleIE_II', allowed: IE2SET, rule: 'A-171', name: 'Schedule IE-2' },
  { key: 'ScheduleIE_III', allowed: IE3SET, rule: 'A-172', name: 'Schedule IE-3' },
  { key: 'ScheduleIE_IV', allowed: IE4SET, rule: 'A-173', name: 'Schedule IE-4' },
  { key: 'Schedule115TD', allowed: EX_11_23C, rule: 'A-450', name: 'Schedule 115TD' },
  { key: 'Schedule115BBI', allowed: EX_11_23C, rule: 'A-455', name: 'Schedule 115BBI' },
  { key: 'PartB_TI', allowed: EX_11_23C, rule: 'A-495', name: 'Part B-TI (Part B1)' },
  { key: 'PartB_TI2', allowed: B2SET, rule: 'A-567', name: 'Part B-TI (Part B2)' },
  { key: 'PartB_TI3', allowed: EX_11_23C, rule: 'A-606/612', name: 'Part B-TI (Part B3)' },
];

/* Schedule MUST be filled for the claimed exemption section. */
const MUST: Array<{ secs: string[]; keys: string[]; rule: string; what: string }> = [
  { secs: EX_11_23C, keys: ['ITRScheduleJ', 'ScheduleA', 'ScheduleAI', 'Schedule115BBI'], rule: 'A-50', what: 'Schedules J, A, AI and 115BBI' },
  { secs: ['13A'], keys: ['SchedulePP'], rule: 'A-120/127', what: 'Schedule PP' },
  { secs: ['13B'], keys: ['ScheduleET'], rule: 'A-53/137', what: 'Schedule ET' },
  { secs: IE1SET, keys: ['ScheduleIE_I'], rule: 'A-34', what: 'Schedule IE-1' },
  { secs: IE2SET, keys: ['ScheduleIE_II'], rule: 'A-35', what: 'Schedule IE-2' },
  { secs: IE3SET, keys: ['ScheduleIE_III'], rule: 'A-36', what: 'Schedule IE-3' },
  { secs: IE4SET, keys: ['ScheduleIE_IV'], rule: 'A-37', what: 'Schedule IE-4' },
];

/* Registration section code ↔ exemption section, both directions (A-6..A-21). */
const REG_PAIRS: Array<{ reg: string; ex: string[]; fwd: string; rev: string; name: string }> = [
  { reg: 'VI', ex: ['11'], fwd: 'A-7', rev: 'A-6', name: '12A/12AB' },
  { reg: 'II', ex: ['23CIV'], fwd: 'A-9', rev: 'A-8', name: '10(23C)(iv)' },
  { reg: 'III', ex: ['23CV'], fwd: 'A-11', rev: 'A-10', name: '10(23C)(v)' },
  { reg: 'IV', ex: ['23CVI'], fwd: 'A-13', rev: 'A-12', name: '10(23C)(vi)' },
  { reg: 'V', ex: ['23CVIA'], fwd: 'A-15', rev: 'A-14', name: '10(23C)(via)' },
  { reg: 'I', ex: ['23AAA'], fwd: 'A-17', rev: 'A-16', name: '10(23AAA)' },
  { reg: 'VIII', ex: ['13B'], fwd: 'A-19', rev: 'A-18', name: '13B' },
  { reg: 'IX', ex: ['21', '2135I'], fwd: 'A-20', rev: 'A-21', name: '35' },
];

/* Return-furnished section → permitted exemption sections (A-24..A-27). */
const RET_SEC_ALLOWED: Record<string, { allowed: string[]; rule: string }> = {
  '139-4A': { allowed: ['11'], rule: 'A-24' },
  '139-4B': { allowed: ['13A', '13B'], rule: 'A-25' },
  '139-4C': { allowed: ['21', '23A', '23AAA', '23B', '23EC', '23ED', '23EE', '29A', '23CIIIAB', '23CIIIAC', '23CIIIAD', '23CIIIAE', '23D', '23DA', '23FB', '24', '26', '46A', '46B', '47', '23CIV', '23CV', '23CVI', '23CVIA'], rule: 'A-26' },
  '139-4D': { allowed: ['2135I'], rule: 'A-27' },
};

/* Part B-TI (Part B2) exemption line → exemption section that must be selected
 * (A-513..A-548, A-577..A-580) and the Schedule IE total it must equal
 * (A-514..A-546). */
const B2_LINES: Array<{ f: string; sec: string; src?: string; ruleSel: string; ruleAmt?: string }> = [
  { f: 'ExemptionUs1021', sec: '21', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-513', ruleAmt: 'A-514' },
  { f: 'ExemptionUs10_23AAA', sec: '23AAA', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-517', ruleAmt: 'A-518' },
  { f: 'ExemptionUs10_23B', sec: '23B', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-519', ruleAmt: 'A-520' },
  { f: 'ExemptionUs10_23D', sec: '23D', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-537', ruleAmt: 'A-538' },
  { f: 'ExemptionUs10_23DA', sec: '23DA', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-539', ruleAmt: 'A-540' },
  { f: 'ExemptionUs10_23EC', sec: '23EC', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-521', ruleAmt: 'A-522' },
  { f: 'ExemptionUs10_23ED', sec: '23ED', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-523', ruleAmt: 'A-524' },
  { f: 'ExemptionUs10_23EE', sec: '23EE', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-525', ruleAmt: 'A-526' },
  { f: 'ExemptionUs10_23FB', sec: '23FB', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-541', ruleAmt: 'A-542' },
  { f: 'ExemptionUs10_29A', sec: '29A', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-527', ruleAmt: 'A-528' },
  { f: 'ExemptionUs10_46', sec: '26', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-545', ruleAmt: 'A-546' },
  { f: 'ExemptionUs10_46A', sec: '46A', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-577', ruleAmt: 'A-578' },
  { f: 'ExemptionUs10_46B', sec: '46B', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-579', ruleAmt: 'A-580' },
  { f: 'ExemptionUs10_47', sec: '47', src: 'ScheduleIE_I.TotRcptVoluntaryContr', ruleSel: 'A-547', ruleAmt: 'A-548' },
  { f: 'ExemptionUs10_23A', sec: '23A', src: 'ScheduleIE_II.TotRcptVoluntaryContr', ruleSel: 'A-515', ruleAmt: 'A-516' },
  { f: 'ExemptionUs10_24', sec: '24', src: 'ScheduleIE_II.TotRcptVoluntaryContr', ruleSel: 'A-543', ruleAmt: 'A-544' },
  { f: 'ExemptionUs10_23Ciiiab', sec: '23CIIIAB', ruleSel: 'A-529', ruleAmt: 'A-530' },
  { f: 'ExemptionUs10_23Ciiiac', sec: '23CIIIAC', ruleSel: 'A-531', ruleAmt: 'A-532' },
  { f: 'ExemptionUs10_23Ciiiad', sec: '23CIIIAD', src: 'ScheduleIE_IV.SumGrossAnnualReceipts', ruleSel: 'A-533', ruleAmt: 'A-534' },
  { f: 'ExemptionUs10_23Ciiiae', sec: '23CIIIAE', src: 'ScheduleIE_IV.SumGrossAnnualReceipts', ruleSel: 'A-535', ruleAmt: 'A-536' },
  { f: 'ExemptionUs13_A', sec: '13A', ruleSel: 'A-568' },
  { f: 'ExemptionUs13_B', sec: '13B', ruleSel: 'A-569' },
];

/* ════════════════════════════════════════════════════════════════════════════
 * 5. ARITHMETIC / CROSS-FIELD RULE TABLES
 * ═══════════════════════════════════════════════════════════════════════════ */
type Sum = { r: string; b: string; t: string; a: string[]; s?: string[]; m: string };

const SUMS: Sum[] = [
  /* ── Part A-BS (A-99..A-109) ── */
  { r: 'A-99', b: 'PARTA_BS.SourcesOfFund.OwnFund.', t: 'TotalFund', a: ['Corpus80G', 'OtherCorpus', 'AccumulatedInc', 'AccumulatedIncUS10_11', 'BalDeemedInc', 'TotalOtherReserve'], m: 'Part A-BS A1(g) Total Fund must equal A1(a+b+c+d+e+f)' },
  { r: 'A-100', b: 'PARTA_BS.SourcesOfFund.LongTermBorrowings.', t: 'TotalLoanFund', a: ['SecuredLoan', 'UnSecuredLoan'], m: 'Part A-BS A2(c) Total Loan Funds must equal A2(a+b)' },
  { r: 'A-101', b: 'PARTA_BS.SourcesOfFund.', t: 'TotSourceFund', a: ['OwnFund.TotalFund', 'LongTermBorrowings.TotalLoanFund', 'Advances'], m: 'Part A-BS A4 Sources of Funds must equal A(1g+2c+3)' },
  { r: 'A-102', b: 'PARTA_BS.ApplicationOfFunds.FixedAsset.', t: 'NetBlock', a: ['GrossBlock'], s: ['Depreciation'], m: 'Part A-BS B1(c) must equal B(1a-1b)' },
  { r: 'A-103', b: 'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrentAssets.CashNCashEquivalents.', t: 'TotCashNCashEquivalents', a: ['BalWithBanks', 'CashInHand', 'Others'], m: 'Part A-BS B3(a)(iiiD) must equal B3(a)(iiiA+iiiB+iiiC)' },
  { r: 'A-104', b: 'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrentAssets.', t: 'TotCurrAssets', a: ['Inventory', 'SundryDebtor', 'CashNCashEquivalents.TotCashNCashEquivalents', 'OtherCurrAssets'], m: 'Part A-BS B3(a)(v) must equal B3(a)(i+ii+iiiD+iv)' },
  { r: 'A-105', b: 'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.', t: 'Total', a: ['CurrentAssets.TotCurrAssets', 'LoansandAdvances'], m: 'Part A-BS B3(c) must equal B3(av+b)' },
  { r: 'A-106', b: 'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrLiabilitiesProviosions.CurrLiability.', t: 'TotalCurrLiabilitiesProviosions', a: ['SundryCreditor', 'OtherPayable'], m: 'Part A-BS B3(d)(iC) must equal B3(d)(iA+iB)' },
  { r: 'A-107', b: 'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrLiabilitiesProviosions.', t: 'TotCurrLiabilitiesandprovisions', a: ['CurrLiability.TotalCurrLiabilitiesProviosions', 'Provisions'], m: 'Part A-BS B3(d)(iii) must equal B3(d)(iC+ii)' },
  { r: 'A-108', b: 'PARTA_BS.ApplicationOfFunds.CurrentAssetsLoanAdv.', t: 'NetCurrAssets', a: ['Total'], s: ['CurrLiabilitiesProviosions.TotCurrLiabilitiesandprovisions'], m: 'Part A-BS B3(e) must equal B(3c-3diii)' },
  { r: 'A-109', b: 'PARTA_BS.ApplicationOfFunds.', t: 'TotalApplicationOfFunds', a: ['FixedAsset.NetBlock', 'Investements', 'CurrentAssetsLoanAdv.NetCurrAssets', 'AccBalAnyOthRes'], m: 'Part A-BS B5 must equal B(1+2+3e+4)' },

  /* ── Schedule VC (A-155..A-168) ── */
  { r: 'A-165', b: 'ScheduleVC.Local.', t: 'CorpusFundDonation', a: ['CorpusFundDonationUS80G2b', 'CorpusFundDonationOther80G2b'], m: 'Schedule VC A(i) must equal A(ia+ib)' },
  { r: 'A-155', b: 'ScheduleVC.Local.', t: 'TotalOtherThanCorpusFund', a: ['GrantsReceivedFormGovt', 'GrantsReceivedFromCompanie', 'OtherSpecificGrants', 'OtherDonation'], m: 'Schedule VC A(iie) must equal A(iia to iid)' },
  { r: 'A-156', b: 'ScheduleVC.Local.', t: 'VoluntaryContribution', a: ['CorpusFundDonation', 'TotalOtherThanCorpusFund'], m: 'Schedule VC A(iii) must equal A(i)+A(iie)' },
  { r: 'A-166', b: 'ScheduleVC.Foreign.', t: 'CorpusFundDonation', a: ['CorpusFundDonationUS80G2b', 'CorpusFundDonationOther80G2b'], m: 'Schedule VC B(i) must equal B(ia+ib)' },
  { r: 'A-157', b: 'ScheduleVC.Foreign.', t: 'ForeignContribution', a: ['CorpusFundDonation', 'OtherThanCorpusFund'], m: 'Schedule VC B(iii) must equal B(i)+B(ii)' },
  { r: 'A-158', b: 'ScheduleVC.', t: 'TotalContribution', a: ['Local.VoluntaryContribution', 'Foreign.ForeignContribution'], m: 'Schedule VC C Total Contributions must equal A(iii)+B(iii)' },
  { r: 'A-159', b: 'ScheduleVC.AnonymousDonations.', t: 'AnonymousDonations115BBC', a: ['AggregateAnonymousDonations'], s: ['TotalDonationsReceived'], m: 'Schedule VC D(iii) must equal D(i)-D(ii)' },
  { r: 'A-168', b: 'ScheduleVC.AnonymousDonations.', t: 'AnonymousDonationsOthr115BBC', a: ['AggregateAnonymousDonations'], s: ['AnonymousDonations115BBC'], m: 'Schedule VC E must equal D(i)-D(iii)' },

  /* ── Schedule AI (A-141) ── */
  { r: 'A-141', b: 'ScheduleAI.', t: 'TotalofAggregateIncomes', a: ['RecptMainObj', 'RecptsIncidentalObj', 'Rent', 'Commission', 'DividendIncome', 'InterestIncome', 'NetConsdrnTrnsfrCapAsst', 'TotalofOtherIncomes'], m: 'Schedule AI Sl. 10 must equal (1+2+3+4+5+6+8+9 Total)' },

  /* ── Schedule PP / ET (A-124, A-131..A-134) ── */
  { r: 'A-124', b: 'SchedulePP.', t: 'TotVCReceived', a: ['VoluntaryContribution', 'VoluntaryContributionElecBond'], m: 'Schedule PP Sl. 7a must equal 7b+7d' },
  { r: 'A-131', b: 'ScheduleET.VoluntaryContributionDtls.', t: 'TotalAfterVoluntaryContribution', a: ['OpeningBalance', 'VoluntaryContributionDuringYr'], m: 'Schedule ET Sl. 6(iii) must equal 6(i)+6(ii)' },
  { r: 'A-132', b: 'ScheduleET.VoluntaryContributionDtls.', t: 'Total', a: ['AmtDistToPoliticalParties', 'AmtSpentOnManagingAffairs'], m: 'Schedule ET Sl. 6(vi) must equal 6(iv)+6(v)' },
  { r: 'A-134', b: 'ScheduleET.VoluntaryContributionDtls.', t: 'ClosingBalance', a: ['TotalAfterVoluntaryContribution'], s: ['Total'], m: 'Schedule ET Sl. 6(viii) must equal 6(iii)-6(vi)' },

  /* ── Schedule R (A-117, A-118) — three corpus columns ── */
  { r: 'A-118', b: 'ITRScheduleR.ReasonsOfDiff.', t: 'TotalReasonsOfDiff.CorpOutOf80G2b', a: ['PurchFixedAsset.CorpOutOf80G2b', 'Depreciation.CorpOutOf80G2b', 'AnyOthReason.CorpOutOf80G2b'], m: 'Schedule R B must equal B(i+ii+iii) — corpus out of 80G(2)(b)' },
  { r: 'A-118', b: 'ITRScheduleR.ReasonsOfDiff.', t: 'TotalReasonsOfDiff.OthCorpReceived', a: ['PurchFixedAsset.OthCorpReceived', 'Depreciation.OthCorpReceived', 'AnyOthReason.OthCorpReceived'], m: 'Schedule R B must equal B(i+ii+iii) — other corpus received' },
  { r: 'A-118', b: 'ITRScheduleR.ReasonsOfDiff.', t: 'TotalReasonsOfDiff.CorpOthThan', a: ['PurchFixedAsset.CorpOthThan', 'Depreciation.CorpOthThan', 'AnyOthReason.CorpOthThan'], m: 'Schedule R B must equal B(i+ii+iii) — other than corpus' },
  { r: 'A-117', b: 'ITRScheduleR.', t: 'ClosngBalBalSheet.CorpOutOf80G2b', a: ['ClosngBalSchJ.CorpOutOf80G2b', 'ReasonsOfDiff.TotalReasonsOfDiff.CorpOutOf80G2b'], m: 'Schedule R C must equal A+B — corpus out of 80G(2)(b)' },
  { r: 'A-117', b: 'ITRScheduleR.', t: 'ClosngBalBalSheet.OthCorpReceived', a: ['ClosngBalSchJ.OthCorpReceived', 'ReasonsOfDiff.TotalReasonsOfDiff.OthCorpReceived'], m: 'Schedule R C must equal A+B — other corpus received' },
  { r: 'A-117', b: 'ITRScheduleR.', t: 'ClosngBalBalSheet.CorpOthThan', a: ['ClosngBalSchJ.CorpOthThan', 'ReasonsOfDiff.TotalReasonsOfDiff.CorpOthThan'], m: 'Schedule R C must equal A+B — other than corpus' },

  /* ── Schedule 115BBI / 115TD (A-445..A-453) ── */
  { r: 'A-453', b: 'Schedule115BBI.', t: 'Total', a: ['DeemedIncSec1023C_113', 'DeemedIncSec111B', 'IncDeemedSec131c', 'IncNotExemptSec131d', 'IncNotExcludedSec111c', 'IncAccInExcess'], m: 'Schedule 115BBI Sl. 7 must equal the sum of Sl. 1 to 6' },
  { r: 'A-445', b: 'Schedule115TD.', t: 'NetValAsst', a: ['FMVTotTrustInst'], s: ['LessTotLiaTrustInst'], m: 'Schedule 115TD Sl. 3 must equal Sl. 1 - Sl. 2' },
  { r: 'A-446', b: 'Schedule115TD.', t: 'FMVTotal', a: ['FMVAsstAcqrdRfrdSec101', 'FMVAsstAcqPeriodFromDateCrtn', 'FMVAsstTrnfsrdSec115TD2'], m: 'Schedule 115TD Sl. 4(iv) must equal 4(i)+4(ii)+4(iii)' },
  { r: 'A-447', b: 'Schedule115TD.', t: 'AccretedIncomeSection115TD', a: ['NetValAsst', 'LiabilityRespectofAsset4Above'], s: ['FMVTotal'], m: 'Schedule 115TD Sl. 6 must equal 3-(4-5)' },
  { r: 'A-448', b: 'Schedule115TD.', t: 'NetPaybleRefble', a: ['AddIncIntstPayb'], s: ['TaxIntstPaid'], m: 'Schedule 115TD Sl. 12 must equal Sl. 10 - Sl. 11' },

  /* ── Schedule TR (A-464) ── */
  { r: 'A-464', b: 'ScheduleTR1.', t: 'TotalTaxReliefOutsideIndia', a: ['TaxReliefOutsideIndiaDTAA', 'TaxReliefOutsideIndiaNotDTAA'], m: 'Schedule TR Sl. 2 + Sl. 3 must equal the total tax relief (column 1d)' },

  /* ── Part B-TTI (A-618..A-630) ── */
  { r: 'A-618', b: 'PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.', t: 'TaxPayableOnTotInc', a: ['TaxAtNormalRates', 'TaxAtSpecialRates', 'DonationUs115BC', 'TaxAtMarginalRate', 'TaxIncChargUs115BBI'], s: ['RebateOnAgricultureInc'], m: 'Part B-TTI 1g must equal (1a+1b+1c+1d+1e-1f)' },
  { r: 'A-620', b: 'PartB_TTI.ComputationOfTaxLiability.', t: 'TotalSurcharge', a: ['Surcharge25ofSI', 'SurchargeOnTaxPayable'], m: 'Part B-TTI 2(iii) must equal 2(i)+2(ii)' },
  { r: 'A-621', b: 'PartB_TTI.ComputationOfTaxLiability.', t: 'GrossTaxLiability', a: ['TaxPayableOnTI.TaxPayableOnTotInc', 'TotalSurcharge', 'EducationCess'], m: 'Part B-TTI 4 Gross tax liability must equal 1g+2iii+3' },
  { r: 'A-624', b: 'PartB_TTI.ComputationOfTaxLiability.TaxRelief.', t: 'TotTaxRelief', a: ['Section90', 'Section91'], m: 'Part B-TTI 5c must equal 5a+5b' },
  { r: 'A-625', b: 'PartB_TTI.ComputationOfTaxLiability.', t: 'NetTaxLiability', a: ['GrossTaxLiability'], s: ['TaxRelief.TotTaxRelief'], m: 'Part B-TTI 6 Net tax liability must equal 4-5c' },
  { r: 'A-626', b: 'PartB_TTI.ComputationOfTaxLiability.IntrstPay.', t: 'TotalIntrstPay', a: ['IntrstPayUs234A', 'IntrstPayUs234B', 'IntrstPayUs234C', 'LateFilingFee234F'], m: 'Part B-TTI 7e must equal 7a+7b+7c+7d' },
  { r: 'A-627', b: 'PartB_TTI.ComputationOfTaxLiability.', t: 'AggregateTaxInterestLiability', a: ['NetTaxLiability', 'IntrstPay.TotalIntrstPay'], m: 'Part B-TTI 8 Aggregate liability must equal 6+7e' },
  { r: 'A-628', b: 'PartB_TTI.TaxPaid.TaxesPaid.', t: 'TotalTaxesPaid', a: ['AdvanceTax', 'TDS', 'TCS', 'SelfAssessmentTax'], m: 'Part B-TTI 9e Total taxes paid must equal 9a+9b+9c+9d' },

  /* ── Part B-TI, Part B1 (A-481..A-508) ── */
  { r: 'A-481', b: 'PartB_TI.TIDeductions.', t: 'TotalDeductions', a: ['AmtAppliedtForCharitablePurpose', 'AmtAppForCharitablePurposeRepayment', 'AmtAppliedSpecifiedMode', 'AmtDeemedForCharitable', 'AmtAccumulatedForCharitable', 'AmtFulfilledUs11_2'], m: 'Part B1 Sl. 6(vii) must equal the sum of 6(i) to 6(vi)' },
  { r: 'A-483', b: 'PartB_TI.TIAdditions.', t: 'TotalAdditions', a: ['IncChargeableUs115BBI', 'ExemptionUs11_13Dtl.AnonymousDonationVC', 'IncChargeableUs12_2', 'AmtDsllwblUs111RWS40AIA', 'AmtDsllwblUs111RWS40A3', 'IncExp3BUS80G', 'IncExp1BUS80G', 'AnyOthrIncome'], m: 'Part B1 Sl. 7(ix) must equal the sum of 7(i) to 7(viii)' },
  { r: 'A-484', b: 'PartB_TI.', t: 'TotalTI', a: ['IncToBeApplied', 'TIAdditions.TotalAdditions', 'IncChargeableUs11_4'], s: ['TIDeductions.TotalDeductions'], m: 'Part B1 Sl. 9 must equal (5-6vii)+7ix+8' },
  { r: 'A-487', b: 'PartB_TI.CapGain.ShortTerm.', t: 'TotalShortTerm', a: ['ShortTerm20Per', 'ShortTerm30Per', 'ShortTermAppRate', 'ShortTermSplRateDTAA'], m: 'Part B1 Sl. 10(iii)(Av) must equal 10(iii)(Ai+Aii+Aiii+Aiv)' },
  { r: 'A-488', b: 'PartB_TI.CapGain.LongTerm.', t: 'TotalLongTerm', a: ['LongTerm12_5Per', 'LongTermSplRateDTAA'], m: 'Part B1 Sl. 10(iii)(Biii) must equal 10(iii)(Bi+Bii)' },
  { r: 'A-489', b: 'PartB_TI.CapGain.', t: 'ShortTermLongTermTotal', a: ['ShortTerm.TotalShortTerm', 'LongTerm.TotalLongTerm'], m: 'Part B1 Sl. 10(iii)(C) must equal 10(iii)(Av+Biii)' },
  { r: 'A-504', b: 'PartB_TI.CapGain.', t: 'TotalCapGains', a: ['ShortTermLongTermTotal', 'CapGains30Per115BBH'], m: 'Part B1 Sl. 10(iii)(E) must equal 10(iii)(C+D)' },
  { r: 'A-491', b: 'PartB_TI.', t: 'TotIncNotPart7And11Abv', a: ['IncomeFromHP', 'ProfBusGain.ProfGainNoSpecBus', 'CapGain.TotalCapGains', 'IncFromOS.TotIncFromOS'], m: 'Part B1 Sl. 10(v) must equal 10(i)+10(ii)+10(iiiE)+10(iv)' },
  { r: 'A-492', b: 'PartB_TI.', t: 'GrossIncome', a: ['TotalTI', 'TotIncNotPart7And11Abv'], m: 'Part B1 Sl. 11 must equal Sl. 9 + Sl. 10' },
  { r: 'A-493', b: 'PartB_TI.', t: 'TotalIncome', a: ['GrossIncome'], s: ['CurrentYearLoss'], m: 'Part B1 Sl. 13 must equal Sl. 11 - Sl. 12' },
  { r: 'A-508', b: 'PartB_TI.', t: 'AggIncothSpecInc115BBI', a: ['TotalIncome'], s: ['IncChargeableTaxSplRates', 'DonationsUs115BBC', 'IncChargUs115BBIIncld13'], m: 'Part B1 Sl. 17 must equal Sl. 13-14-15-16' },

  /* ── Part B-TI, Part B2 (A-558..A-586) ── */
  { r: 'A-585', b: 'PartB_TI2.', t: 'TotExemptionUs10_21to29', a: ['ExemptionUs1021', 'ExemptionUs10_23AAA', 'ExemptionUs10_23B', 'ExemptionUs10_23D', 'ExemptionUs10_23DA', 'ExemptionUs10_23EC', 'ExemptionUs10_23ED', 'ExemptionUs10_23EE', 'ExemptionUs10_23FB', 'ExemptionUs10_29A', 'ExemptionUs10_46', 'ExemptionUs10_46A', 'ExemptionUs10_46B', 'ExemptionUs10_47'], m: 'Part B2 Sl. 1 must equal the sum of Sl. 1a to 1n' },
  { r: 'A-586', b: 'PartB_TI2.', t: 'TotExemptionUs10_23Cto10_47', a: ['ExemptionUs10_23A', 'ExemptionUs10_23Ciiiab', 'ExemptionUs10_23Ciiiac', 'ExemptionUs10_23Ciiiad', 'ExemptionUs10_23Ciiiae', 'ExemptionUs10_24'], m: 'Part B2 Sl. 2 must equal the sum of Sl. 2a to 2f' },
  { r: 'A-558', b: 'PartB_TI2.CapGain.ShortTerm.', t: 'TotalShortTerm', a: ['ShortTerm20Per', 'ShortTerm30Per', 'ShortTermAppRate', 'ShortTermSplRateDTAA'], m: 'Part B2 Sl. 7(iii)(Av) must equal 7(iii)(Ai+Aii+Aiii+Aiv)' },
  { r: 'A-560', b: 'PartB_TI2.CapGain.LongTerm.', t: 'TotalLongTerm', a: ['LongTerm12_5Per', 'LongTermSplRateDTAA'], m: 'Part B2 Sl. 7(iii)(Biii) must equal 7(iii)(Bi+Bii)' },
  { r: 'A-561', b: 'PartB_TI2.CapGain.', t: 'ShortTermLongTermTotal', a: ['ShortTerm.TotalShortTerm', 'LongTerm.TotalLongTerm'], m: 'Part B2 Sl. 7(iii)(C) must equal 7(iii)(Av+Biii)' },
  { r: 'A-574', b: 'PartB_TI2.CapGain.', t: 'TotalCapGains', a: ['ShortTermLongTermTotal', 'CapGains30Per115BBH'], m: 'Part B2 Sl. 7(iii)(E) must equal 7(iii)(C+D)' },
  { r: 'A-563', b: 'PartB_TI2.', t: 'TotIncNotPart7And11Abv', a: ['IncomeFromHP', 'ProfBusGain.ProfGainNoSpecBus', 'CapGain.TotalCapGains', 'IncFromOS.TotIncFromOS'], m: 'Part B2 Sl. 7(v) must equal 7(i)+7(ii)+7(iiiE)+7(iv)' },
  { r: 'A-564', b: 'PartB_TI2.', t: 'GrossIncome', a: ['VoluntaryContributions', 'TotIncNotPart7And11Abv', 'IncomeChargeable11_3'], s: ['ExemptionUs13_A', 'ExemptionUs13_B'], m: 'Part B2 Sl. 8 must equal [6+7v-4-5]+3' },
  { r: 'A-566', b: 'PartB_TI2.', t: 'GrossTotalIncome', a: ['GrossIncome'], s: ['CurrentYearLoss'], m: 'Part B2 Sl. 10 must equal Sl. 8 - Sl. 9' },

  /* ── Part B-TI, Part B3 (A-587..A-611) ── */
  { r: 'A-587', b: 'PartB_TI3.ComputationIncChargeable.ExpDisallowed.', t: 'TotExpDisall', a: ['ExpCorpusStandingCredit', 'ExpLoanBorrow', 'DeprRespAsset', 'ExpFormContri', 'CapExp', 'AmtDisallSubClauseiaSec40', 'AmtDisallSubSec3Sec40A', 'AmtDisallSubSec3ASec40A', 'AnyOthDisall'], m: 'Part B3 Sl. 3(x) must equal the sum of 3(i) to 3(ix)' },
  { r: 'A-590', b: 'PartB_TI3.ComputationIncChargeable.Additions.', t: 'TotAdditions', a: ['IncChargSec115BBI', 'IncExemptNotAvail', 'IncChargSec122', 'IncExpl3B', 'IncExpl1B', 'AnyOthrIncome'], m: 'Part B3 Sl. 4(vii) must equal the sum of 4(i) to 4(vi)' },
  { r: 'A-591', b: 'PartB_TI3.ComputationIncChargeable.', t: 'SumTotal', a: ['TotIncPrevYr', 'ExpDisallowed.TotExpDisall', 'Additions.TotAdditions', 'IncChargSec114'], s: ['TotExpIncur'], m: 'Part B3 Sl. 6 must equal (1-2+3x)+4vii+5' },
  { r: 'A-594', b: 'PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain.ShortTerm.', t: 'TotalShortTerm', a: ['ShortTerm20Per', 'ShortTerm30Per', 'ShortTermAppRate', 'ShortTermSplRateDTAA'], m: 'Part B3 Sl. 7(iii)(av) must equal 7(iii)(ai+aii+aiii+aiv)' },
  { r: 'A-595', b: 'PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain.LongTerm.', t: 'TotalLongTerm', a: ['LongTerm12_5Per', 'LongTermSplRateDTAA'], m: 'Part B3 Sl. 7(iii)(biii) must equal 7(iii)(bi+bii)' },
  { r: 'A-598', b: 'PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain.', t: 'ShortTermLongTermTotal', a: ['ShortTerm.TotalShortTerm', 'LongTerm.TotalLongTerm'], m: 'Part B3 Sl. 7(iii)(c) must equal 7(iii)(av+biii)' },
  { r: 'A-597', b: 'PartB_TI3.ComputationIncChargeable.IncNotForming.CapGain.', t: 'TotalCapGains', a: ['ShortTermLongTermTotal', 'CapGains30Per115BBH'], m: 'Part B3 Sl. 7(iii)(e) must equal 7(iii)(c+d)' },
  { r: 'A-600', b: 'PartB_TI3.ComputationIncChargeable.IncNotForming.', t: 'Total', a: ['IncFromHP', 'ProfitGainsBP', 'CapGain.TotalCapGains', 'IncOS'], m: 'Part B3 Sl. 7(v) must equal 7(i)+7(ii)+7(iiie)+7(iv)' },
  { r: 'A-602', b: 'PartB_TI3.ComputationIncChargeable.', t: 'TotalInc', a: ['SumTotal', 'IncNotForming.Total'], s: ['LossCurYrToBeSetOff'], m: 'Part B3 Sl. 9 must equal 6+7-8' },
  { r: 'A-611', b: 'PartB_TI3.ComputationIncChargeable.', t: 'IncChagrgSec13', a: ['TotalInc'], s: ['IncIncludedChargRateSpec', 'AnonymousDonation', 'IncChargSec115BBI'], m: 'Part B3 Sl. 13 must equal Sl. 9-10-11-12' },
];

/* Column totals that must equal the sum of the rows below them. */
const ROWSUMS: Array<{ r: string; total: string; arr: string; f: string; m: string }> = [
  { r: 'A-98', total: 'PARTA_BS.SourcesOfFund.OwnFund.TotalOtherReserve', arr: 'PARTA_BS.SourcesOfFund.OwnFund.OtherReserve', f: 'Amount', m: 'Part A-BS A1f Total of other reserves must equal the sum of the rows' },
  { r: 'A-76', total: 'ITRScheduleIA.GrandTotal', arr: 'ITRScheduleIA.YrOfAccDtls', f: 'Total', m: 'Schedule IA Total must equal the sum of column E of the rows' },
  { r: 'A-84', total: 'ITRScheduleDA.GrandTotal', arr: 'ITRScheduleDA.YrOfAccumDtls', f: 'Total', m: 'Schedule DA Total must equal the sum of column F of the rows' },
  { r: 'A-85', total: 'ITRScheduleJ.ScheduleJUs11_5.TotalInvestmentAmt', arr: 'ITRScheduleJ.ScheduleJUs11_5.ScheduleJUs11_5Dtls', f: 'AmtOfInvestment', m: 'Schedule J table B(4) Total must equal the sum of the rows' },
  { r: 'A-86', total: 'ITRScheduleJ.ScheduleJUs13_3.TotalValueOfInvestment', arr: 'ITRScheduleJ.ScheduleJUs13_3.ScheduleJUs13_3Dtls', f: 'NominalaValueOfInvestment', m: 'Schedule J table C Total value of investment must equal the sum of the rows' },
  { r: 'A-87', total: 'ITRScheduleJ.ScheduleJUs13_3.TotalIncFromInvestment', arr: 'ITRScheduleJ.ScheduleJUs13_3.ScheduleJUs13_3Dtls', f: 'IncFromInvestment', m: 'Schedule J table C Income from investment must equal the sum of the rows' },
  { r: 'A-88', total: 'ITRScheduleJ.ScheduleJOtherInvstmts.TotalValueOfInvestment', arr: 'ITRScheduleJ.ScheduleJOtherInvstmts.ScheduleJOtherInvstmtsDtls', f: 'NominalaValueOfInvestment', m: 'Schedule J table D Total value of investment must equal the sum of the rows' },
  { r: 'A-89', total: 'ITRScheduleJ.ScheduleJVoluntaryContribution.TotalValueOfContribution', arr: 'ITRScheduleJ.ScheduleJVoluntaryContribution.ScheduleJVoluntaryContributionDtls', f: 'ValueOfContribution', m: 'Schedule J table E Value of contribution total must equal the sum of the rows' },
  { r: 'A-90', total: 'ITRScheduleJ.ScheduleJVoluntaryContribution.TotalValOfContrbnAppdTwrdsObj', arr: 'ITRScheduleJ.ScheduleJVoluntaryContribution.ScheduleJVoluntaryContributionDtls', f: 'ValueOfContributionObj', m: 'Schedule J table E Contribution applied towards objective total must equal the sum of the rows' },
  { r: 'A-91', total: 'ITRScheduleJ.ScheduleJVoluntaryContribution.TotalAmtInvestedUs11', arr: 'ITRScheduleJ.ScheduleJVoluntaryContribution.ScheduleJVoluntaryContributionDtls', f: 'AmtInvestedUs11', m: 'Schedule J table E Amount invested u/s 11(5) total must equal the sum of the rows' },
  { r: 'A-92', total: 'ITRScheduleJ.ScheduleJVoluntaryContribution.TotalBalIncUs11', arr: 'ITRScheduleJ.ScheduleJVoluntaryContribution.ScheduleJVoluntaryContributionDtls', f: 'BalIncUs11', m: 'Schedule J table E Balance income u/s 11(3) total must equal the sum of the rows' },
  { r: 'A-178', total: 'ScheduleIE_IV.SumGrossAnnualReceipts', arr: 'ScheduleIE_IV.ScheduleIEIVDtls', f: 'GrossAnnualReceipts', m: 'Schedule IE-4 Sum of gross annual receipts must equal the sum of column 3' },
  { r: 'A-390', total: 'ScheduleSI.TotSplRateInc', arr: 'ScheduleSI.SplCodeRateTax', f: 'SplRateInc', m: 'Schedule SI total income (column i) must equal the sum of the rows' },
  { r: 'A-391', total: 'ScheduleSI.TotSplRateIncTax', arr: 'ScheduleSI.SplCodeRateTax', f: 'SplRateIncTax', m: 'Schedule SI total tax (column ii) must equal the sum of the rows' },
  { r: 'A-641', total: 'ScheduleIT.TotalTaxPayments', arr: 'ScheduleIT.TaxPayment', f: 'Amt', m: 'Schedule IT Total of column 5 must equal the sum of the challan rows' },
  { r: 'A-466', total: 'ScheduleTR1.TotalTaxOutsideIndia', arr: 'ScheduleTR1.ScheduleTR', f: 'TaxPaidOutsideIndia', m: 'Schedule TR Total taxes paid outside India must equal the sum of the country rows' },
];

/* Schedule I / D / J / IA / DA per-row arithmetic. */
type RowCalc = { r: string; arr: string; t: string; a: string[]; s?: string[]; m: string };
const ROWCALCS: RowCalc[] = [
  { r: 'A-66', arr: 'ITRScheduleI.ScheduleI', t: 'BalanceAfterPY', a: ['AmountAccumlated'], s: ['AmountAppliedPreviousYear'], m: 'Schedule I column 5 Balance must equal column 2 - column 4' },
  { r: 'A-72', arr: 'ITRScheduleI.ScheduleI', t: 'BalAvailApp', a: ['BalanceAfterPY'], s: ['AmtTxdErlAssYr'], m: 'Schedule I column 7 must equal column 5 - column 6' },
  { r: 'A-67', arr: 'ITRScheduleI.ScheduleI', t: 'BalanceAmount', a: ['BalAvailApp'], s: ['AmountAppliedDuringYear', 'AmountAppliedDuringYearOtherPurpose', 'AmountCreditedTrust'], m: 'Schedule I column 11 must equal columns (7-8-9-10)' },
  { r: 'A-70', arr: 'ITRScheduleI.ScheduleI', t: 'AmountDeemedUs11', a: ['AmountAppliedDuringYearOtherPurpose', 'AmountCreditedTrust', 'AmountInvestedInOtherMode', 'AmountNotUtilized'], m: 'Schedule I column 15 must equal columns (9+10+13+14)' },
  { r: 'A-73', arr: 'ITRScheduleIA.YrOfAccDtls', t: 'Total', a: ['AssYr22_23', 'AssYr23_24', 'AssYr24_25', 'AssYr25_26'], m: 'Schedule IA column E Total must equal (A+B+C+D)' },
  { r: 'A-81', arr: 'ITRScheduleDA.YrOfAccumDtls', t: 'Total', a: ['AssYrPriorToAY', 'AssYr22_23', 'AssYr23_24', 'AssYr24_25', 'AssYr25_26'], m: 'Schedule DA column F Total must equal (A+B+C+D+E)' },
  { r: 'A-78', arr: 'ITRScheduleD.ScheduleD', t: 'AmountNotAppliedCurrAY', a: ['AmountToBeApplied'], s: ['AmountAppliedCurrAY'], m: 'Schedule D column 8 must equal column 6 - column 7' },
  { r: 'A-79', arr: 'ITRScheduleD.ScheduleD', t: 'BalanceAmount', a: ['OutOfDeemedAmtReqApp'], s: ['AmountToBeApplied'], m: 'Schedule D column 9 must equal column 4 - column 6' },
  { r: 'A-94', arr: 'ITRScheduleJ.ScheduleJ_A1.ScheduleJ_A1Dtls', t: 'ClosingBlc', a: ['OpeningBlc', 'ReceivedCorpus', 'AmtDepositedBack'], s: ['AppliedPY'], m: 'Schedule J A1(7) must equal (1+2+4)-3' },
  { r: 'A-96', arr: 'ITRScheduleJ.ScheduleJ_A1.ScheduleJ_A1Dtls', t: 'Investment_11_5_Other', a: ['ClosingBlc'], s: ['Investment_11_5', 'AmtTxdAssYr22_23'], m: 'Schedule J A1(10) must equal A1(7-8-9)' },
  { r: 'A-95', arr: 'ITRScheduleJ.ScheduleJ_A2.ScheduleJ_A2Dtls', t: 'ClosingBlc', a: ['OpeningBlc', 'LoanBorrow'], s: ['TotRepOfLoan'], m: 'Schedule J A2(7) must equal (1+2-6)' },
  { r: 'A-326', arr: 'ScheduleVDA.ScheduleVDADtls', t: 'IncomeFromVDA', a: ['ConsidReceived'], s: ['AcquisitionCost'], m: 'Schedule VDA column 7 must equal column 6 - column 5' },
  { r: 'A-179', arr: 'ScheduleHP.PropertyDetails', t: 'Rentdetails.TotalUnrealizedAndTax', a: ['Rentdetails.RentNotRealized', 'Rentdetails.LocalTaxes'], m: 'Schedule HP 1(d) must equal 1(b)+1(c)' },
  { r: 'A-180', arr: 'ScheduleHP.PropertyDetails', t: 'Rentdetails.BalanceALV', a: ['Rentdetails.AnnualLetableValue'], s: ['Rentdetails.TotalUnrealizedAndTax'], m: 'Schedule HP 1(e) Annual value must equal 1(a)-1(d)' },
  { r: 'A-182', arr: 'ScheduleHP.PropertyDetails', t: 'Rentdetails.TotalDeduct', a: ['Rentdetails.ThirtyPercentOfBalance', 'Rentdetails.IntOnBorwCap'], m: 'Schedule HP 1(h) must equal 1(f)+1(g)' },
  { r: 'A-183', arr: 'ScheduleHP.PropertyDetails', t: 'Rentdetails.IncomeOfHP', a: ['Rentdetails.BalanceALV', 'Rentdetails.ArrearsUnrealizedRentRcvd'], s: ['Rentdetails.TotalDeduct'], m: 'Schedule HP 1(j) must equal 1(e)-1(h)+1(i)' },
];

/* "A must not exceed B" checks. */
const NOTGT: Array<{ r: string; a: string; b: string; m: string }> = [
  { r: 'A-133', a: 'ScheduleET.VoluntaryContributionDtls.TotAmtExeUndSec13B', b: 'ScheduleET.VoluntaryContributionDtls.VoluntaryContributionDuringYr', m: 'Schedule ET total amount eligible for exemption u/s 13B cannot exceed Sl. 6(ii)' },
  { r: 'A-148', a: 'ScheduleA.ExpNotAllowedApplication.TotExpNotAllowedApplication.Total', b: 'ScheduleA.AppTowExpTrstInst.TotalA1toA11.Total', m: 'Schedule A Sl. B cannot exceed Sl. A (application towards the stated objects)' },
  { r: 'A-151', a: 'ScheduleA.AmountNotPaidPY.Total', b: 'ScheduleA.TotAmtAppDrngPrevYr.Total', m: 'Schedule A Sl. E (amount not actually paid) cannot exceed Sl. D' },
  { r: 'A-149', a: 'ScheduleA.AppTowExpTrstInst.CostNewAssetUs11_1A.Total', b: 'ScheduleAI.NetConsdrnTrnsfrCapAsst', m: 'Schedule A Sl. A11 (cost of new asset u/s 11(1A)) is restricted to the net consideration at Sl. 8 of Schedule AI' },
];

/* Cross-schedule equalities. */
const EQS: Array<{ r: string; a: string; b: string; m: string }> = [
  { r: 'A-110', a: 'PARTA_BS.ApplicationOfFunds.TotalApplicationOfFunds', b: 'PARTA_BS.SourcesOfFund.TotSourceFund', m: 'Part A-BS B5 Total application of funds must equal A4 Sources of funds' },
  { r: 'A-138', a: 'SchedulePP.TotVCReceived', b: 'ScheduleVC.TotalContribution', m: 'Schedule PP Sl. 7a must equal Sl. C of Schedule VC' },
  { r: 'A-135', a: 'PartB_TI2.ExemptionUs13_B', b: 'ScheduleET.VoluntaryContributionDtls.TotAmtExeUndSec13B', m: 'Part B2 Sl. 5 (exemption u/s 13B) must equal Sl. 6(vii) of Schedule ET' },
  { r: 'A-451', a: 'Schedule115BBI.DeemedIncSec1023C_113', b: 'ITRScheduleI.TotAmountDeemedUs11', m: 'Schedule 115BBI Sl. 1 must equal the total of column 15 of Schedule I' },
  { r: 'A-452', a: 'Schedule115BBI.DeemedIncSec111B', b: 'ITRScheduleD.TotAmountNotAppliedCurrAY', m: 'Schedule 115BBI Sl. 2 must equal the total of column 8 of Schedule D' },
  { r: 'A-475', a: 'PartB_TI.AggregateIncomeUs1112', b: 'ScheduleAI.TotalofAggregateIncomes', m: 'Part B1 Sl. 3 must equal Sl. 10 of Schedule AI' },
  { r: 'A-476', a: 'PartB_TI.TIDeductions.AmtAppliedtForCharitablePurpose', b: 'ScheduleA.TotAmountAllowedApplication.Total', m: 'Part B1 Sl. 6(i) must equal Sl. G of Schedule A' },
  { r: 'A-482', a: 'PartB_TI.TIAdditions.ExemptionUs11_13Dtl.AnonymousDonationVC', b: 'ScheduleVC.AnonymousDonations.AnonymousDonations115BBC', m: 'Part B1 Sl. 7(ii) must equal Sl. D(iii) of Schedule VC' },
  { r: 'A-485', a: 'PartB_TI.IncomeFromHP', b: 'ScheduleHP.TotalIncomeChargeableUnHP', m: 'Part B1 Sl. 10(i) must equal Sl. 3 of Schedule HP' },
  { r: 'A-486', a: 'PartB_TI.ProfBusGain.ProfGainNoSpecBus', b: 'CorpScheduleBP.IncChrgUnHdProftGain', m: 'Part B1 Sl. 10(ii) must equal Sl. D of Schedule BP' },
  { r: 'A-490', a: 'PartB_TI.IncFromOS.TotIncFromOS', b: 'ScheduleOS.IncChargeableFrmOthSrc', m: 'Part B1 Sl. 10(iv) must equal Sl. 9 of Schedule OS' },
  { r: 'A-494', a: 'PartB_TI.DonationsUs115BBC', b: 'ScheduleVC.AnonymousDonations.AnonymousDonations115BBC', m: 'Part B1 Sl. 15 must equal Sl. D(iii) of Schedule VC' },
  { r: 'A-501', a: 'PartB_TI.TIAdditions.IncChargeableUs115BBI', b: 'Schedule115BBI.Total', m: 'Part B1 income chargeable u/s 115BBI must equal Sl. 7 of Schedule 115BBI' },
  { r: 'A-505', a: 'PartB_TI.IncChargUs115BBIIncld13', b: 'Schedule115BBI.Total', m: 'Part B1 Sl. 16 must equal Sl. 7 of Schedule 115BBI' },
  { r: 'A-502', a: 'PartB_TI.IncChargeableTaxSplRates', b: 'ScheduleSI.TotSplRateInc', m: 'Part B1 Sl. 14 must equal the total of column (i) of Schedule SI' },
  { r: 'A-554', a: 'PartB_TI2.IncomeFromHP', b: 'ScheduleHP.TotalIncomeChargeableUnHP', m: 'Part B2 Sl. 7(i) must equal Sl. 3 of Schedule HP' },
  { r: 'A-571', a: 'PartB_TI2.ProfBusGain.ProfGainNoSpecBus', b: 'CorpScheduleBP.IncChrgUnHdProftGain', m: 'Part B2 Sl. 7(ii) must equal Sl. D of Schedule BP' },
  { r: 'A-562', a: 'PartB_TI2.IncFromOS.TotIncFromOS', b: 'ScheduleOS.IncChargeableFrmOthSrc', m: 'Part B2 Sl. 7(iv) must equal Sl. 9 of Schedule OS' },
  { r: 'A-575', a: 'PartB_TI2.VoluntaryContributions', b: 'ScheduleVC.TotalContribution', m: 'Part B2 Sl. 6 must equal Sl. C of Schedule VC' },
  { r: 'A-592', a: 'PartB_TI3.ComputationIncChargeable.IncNotForming.IncFromHP', b: 'ScheduleHP.TotalIncomeChargeableUnHP', m: 'Part B3 Sl. 7(i) must equal Sl. 3 of Schedule HP' },
  { r: 'A-593', a: 'PartB_TI3.ComputationIncChargeable.IncNotForming.ProfitGainsBP', b: 'CorpScheduleBP.IncChrgUnHdProftGain', m: 'Part B3 Sl. 7(ii) must equal Sl. D48 of Schedule BP' },
  { r: 'A-599', a: 'PartB_TI3.ComputationIncChargeable.IncNotForming.IncOS', b: 'ScheduleOS.IncChargeableFrmOthSrc', m: 'Part B3 Sl. 7(iv) must equal Sl. 9 of Schedule OS' },
  { r: 'A-588', a: 'PartB_TI3.ComputationIncChargeable.Additions.IncChargSec115BBI', b: 'Schedule115BBI.Total', m: 'Part B3 Sl. 4(i) must equal Sl. 7 of Schedule 115BBI' },
  { r: 'A-605', a: 'PartB_TI3.ComputationIncChargeable.IncChargSec115BBI', b: 'Schedule115BBI.Total', m: 'Part B3 Sl. 12 must equal Sl. 7 of Schedule 115BBI' },
  { r: 'A-603', a: 'PartB_TI3.ComputationIncChargeable.AnonymousDonation', b: 'ScheduleVC.AnonymousDonations.AnonymousDonations115BBC', m: 'Part B3 Sl. 11 must equal Sl. D(iii) of Schedule VC' },
  { r: 'A-604', a: 'PartB_TI3.ComputationIncChargeable.IncIncludedChargRateSpec', b: 'ScheduleSI.TotSplRateInc', m: 'Part B3 Sl. 10 must equal the total of column (i) of Schedule SI' },
  { r: 'A-622', a: 'PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section90', b: 'ScheduleTR1.TaxReliefOutsideIndiaDTAA', m: 'Part B-TTI 5a must equal Sl. 2 of Schedule TR' },
  { r: 'A-623', a: 'PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section91', b: 'ScheduleTR1.TaxReliefOutsideIndiaNotDTAA', m: 'Part B-TTI 5b must equal Sl. 3 of Schedule TR' },
  { r: 'A-634', a: 'PartB_TTI.TaxPaid.TaxesPaid.TCS', b: 'ScheduleTCS.TotalSchTCS', m: 'Part B-TTI 9(c) must equal the total of column 7(i) of Schedule TCS' },
  { r: 'A-635', a: 'PartB_TTI.Refund.NetTaxPyblOn115TDInc', b: 'Schedule115TD.NetPaybleRefble', m: 'Part B-TTI Sl. 12 must equal Sl. 12 of Schedule 115TD' },
];

/* ════════════════════════════════════════════════════════════════════════════
 * 6. LABELS & HINTS
 * ═══════════════════════════════════════════════════════════════════════════ */
const LABELS: Record<string, string> = {
  PAN: 'PAN of the assessee',
  SurNameOrOrgName: 'Name of the trust/institution',
  DateOFFormOrIncorp: 'Date of formation/incorporation',
  StatusOrCompanyType: 'Status of the assessee (AOP/BOI/AJP/Company)',
  ReturnFurnishedSec: 'Return furnished under section 139(4A)/(4B)/(4C)/(4D)',
  SecExemptionClaimed: 'Section under which exemption is claimed',
  IncomeTaxSec: 'Section under which the return is filed (139(1)/(4)/(5)…)',
  ResidentialStatus: 'Residential status (RES/NRI)',
  PartnerInFirmFlg: 'Whether partner in a firm (Y/N)',
  HeldUnlistedEqShrPrYrFlg: 'Whether unlisted equity shares were held during the year (Y/N)',
  AsseseeRepFlg: 'Whether the return is filed by a representative assessee (Y/N)',
  LiableSec44ABflg: 'Whether liable for audit u/s 44AB (Y/N)',
  LiableAnyOthThnINTActflg: 'Whether liable for audit under any other Act (Y/N)',
  AssetOutsideIndiaFlg: 'Whether any asset is held outside India (YES/NO)',
  BankDtlsFlag: 'Bank account details flag (Y/N)',
  AssesseeVerName: 'Name of the person verifying the return',
  FatherName: "Father's name of the signatory",
  AssesseeVerPAN: 'PAN of the signatory',
  Capacity: 'Capacity of the signatory (MD/DR/PO/CE/RE/OT)',
  Date: 'Date of verification',
  Place: 'Place of verification',
  ResidenceNo: 'Flat/Door/Building number',
  LocalityOrArea: 'Locality/Area',
  CityOrTownOrDistrict: 'City/Town/District',
  StateCode: 'State code',
  CountryCodeMobile: 'Mobile country code',
  MobileNo: 'Mobile number',
  EmailAddress: 'Email address',
  FormName: 'Form name (must be "ITR-7")',
  AssessmentYear: 'Assessment year (must be "2026")',
  SchemaVer: 'Schema version (must be "Ver1.0")',
  FormVer: 'Form version (must be "Ver1.0")',
  JSONCreationDate: 'JSON creation date',
  TotSourceFund: 'Total sources of funds (Part A-BS, A4)',
  TotalApplicationOfFunds: 'Total application of funds (Part A-BS, B5)',
  TaxPayableOnTotInc: 'Tax payable on total income (Part B-TTI, 1g)',
  GrossTaxLiability: 'Gross tax liability (Part B-TTI, 4)',
  NetTaxLiability: 'Net tax liability (Part B-TTI, 6)',
  AggregateTaxInterestLiability: 'Aggregate tax and interest liability (Part B-TTI, 8)',
  TotalTaxesPaid: 'Total taxes paid (Part B-TTI, 9e)',
  BalTaxPayable: 'Amount payable (Part B-TTI, 10)',
  RefundDue: 'Refund (Part B-TTI, 11)',
  NetTaxPyblOn115TDInc: 'Net tax payable on 115TD accreted income',
  TotalTI: 'Gross income after exemption (Part B1, Sl. 9)',
  TotalIncome: 'Total income (Part B1, Sl. 13)',
  ProvisionsSec1310Applcbl: 'Whether the provisions of section 13(10) are applicable (A26)',
  CharitablePurposeOfGeneralPublic: 'Whether the object is advancement of general public utility (A23(i))',
  FirstReturnFlag: 'Whether this is the first return of the trust/institution',
};

const SECTION_HINTS: Record<string, string> = {
  CreationInfo: 'Generated automatically when the JSON is exported',
  Form_ITR7: 'Generated automatically when the JSON is exported',
  PartA_GEN1: 'Part A-GEN (1): general information, registration and filing status',
  PartA_GEN2: 'Part A-GEN (2): other details, audit information, author/founder details',
  PARTA_BS: 'Part A-BS: Balance Sheet as on 31 March 2026',
  PartB_TI: 'Part B-TI (Part B1): statement of income — sections 11/12 and 10(23C)(iv)-(via)',
  PartB_TI2: 'Part B-TI (Part B2): statement of income — other exemption sections',
  PartB_TI3: 'Part B-TI (Part B3): statement of income where section 13(10) applies',
  PartB_TTI: 'Part B-TTI: computation of tax liability',
  Verification: 'Verification tab',
  ScheduleIT: 'Tax Paid → advance/self-assessment tax (Schedule IT)',
  ScheduleTDS2: 'Tax Paid → TDS as per Form 16A (Schedule TDS-2)',
  ScheduleTDS3: 'Tax Paid → TDS as per Form 16B/16C/16D/16E (Schedule TDS-3)',
  ScheduleTCS: 'Tax Paid → TCS (Schedule TCS)',
  SchedulePP: 'Schedule PP: political party claiming exemption u/s 13A',
  ScheduleET: 'Schedule ET: electoral trust claiming exemption u/s 13B',
  CorpScheduleBP: 'Schedule BP: profits and gains of business or profession',
};

function humanize(seg: string): string {
  if (LABELS[seg]) return LABELS[seg];
  return seg
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
}

function hintFor(rel: string): string | undefined {
  const top = rel.split('.')[0].replace(/\[\d+\]$/, '');
  if (SECTION_HINTS[top]) return SECTION_HINTS[top];
  if (top.startsWith('ITRSchedule')) return 'Schedule ' + top.slice('ITRSchedule'.length);
  if (top.startsWith('Schedule')) return 'Schedule ' + top.slice('Schedule'.length).replace(/^_/, '').replace(/_/g, '-');
  return undefined;
}

/* ════════════════════════════════════════════════════════════════════════════
 * 7. SMALL UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════ */
function num(v: unknown): number | undefined {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  return undefined;
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
}

function rows(v: unknown): Array<Record<string, unknown>> {
  return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* Rupee amounts are integers in the schema; allow 1 for rounding drift. */
const TOL = 1;

/* ════════════════════════════════════════════════════════════════════════════
 * 8. THE CHECKER
 * ═══════════════════════════════════════════════════════════════════════════ */
export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  try {
    run(json, missing, errors, warnings);
  } catch (e) {
    errors.push({ path: 'ITR.ITR7', msg: `Validator internal error: ${e instanceof Error ? e.message : String(e)}` });
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

function run(json: unknown, missing: MissingField[], errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const itr7 = at(json, 'ITR.ITR7');

  const miss = (rel: string, label?: string): void => {
    missing.push({ path: ROOT + rel, label: label ?? humanize(rel.split('.').pop() as string), hint: hintFor(rel) });
  };
  const err = (rel: string, msg: string, rule?: string): void => { errors.push({ path: ROOT + rel, msg, rule }); };
  const warn = (rel: string, msg: string, rule?: string): void => { warnings.push({ path: ROOT + rel, msg, rule }); };
  const V = (rel: string): unknown => at(itr7, rel);
  const N = (rel: string): number | undefined => num(V(rel));
  const S = (rel: string): string | undefined => str(V(rel));
  const has = (rel: string): boolean => !isEmpty(V(rel));

  if (itr7 == null || typeof itr7 !== 'object') {
    missing.push({ path: 'ITR.ITR7', label: 'ITR-7 payload (root object ITR.ITR7)', hint: 'Export the return JSON from the ITR-7 tool' });
    // Fall through: the whole hard-required chain is still enumerated so the CA sees the scope.
  }

  /* ── 8.1 hard required chain ── */
  for (const prefix of Object.keys(HARD)) {
    for (const leaf of HARD[prefix]) {
      const rel = `${prefix}.${leaf}`;
      if (isEmpty(V(rel))) miss(rel);
    }
  }

  /* ── 8.2 required scalars inside optional-but-present containers ── */
  for (const sec of Object.keys(COND)) {
    if (isEmpty(V(sec))) continue;
    for (const leaf of COND[sec]) {
      const rel = `${sec}.${leaf}`;
      if (isEmpty(V(rel))) miss(rel, `${humanize(leaf.split('.').pop() as string)} (${sec.split('.').pop()})`);
    }
  }

  /* ── 8.3 per-row required fields of repeating tables ── */
  for (const t of ARR) {
    const arr = rows(V(t.arr));
    arr.forEach((row, i) => {
      for (const f of t.fields) {
        if (isEmpty(at(row, f))) miss(`${t.arr}[${i}].${f}`, `${humanize(f.split('.').pop() as string)} — ${t.row} #${i + 1}`);
      }
    });
  }

  /* ── 8.4 identity-critical values (schema enums/patterns) ── */
  const fixed: Array<[string, string, string]> = [
    ['Form_ITR7.FormName', 'ITR-7', 'Form name must be "ITR-7"'],
    ['Form_ITR7.AssessmentYear', '2026', 'Assessment year must be "2026" for AY 2026-27'],
    ['Form_ITR7.SchemaVer', 'Ver1.0', 'Schema version must be "Ver1.0"'],
    ['Form_ITR7.FormVer', 'Ver1.0', 'Form version must be "Ver1.0"'],
  ];
  for (const [rel, want, msg] of fixed) {
    const v = S(rel);
    if (v !== undefined && v !== want) err(rel, `${msg} (found "${v}")`, 'SCHEMA');
  }
  const enumChecks: Array<[string, string[], string]> = [
    ['PartA_GEN1.OrgFirmInfo.StatusOrCompanyType', STATUS, 'Status'],
    ['PartA_GEN1.OrgFirmInfo.SubStatus', SUB_STATUS, 'Sub-status'],
    ['PartA_GEN1.OrgFirmInfo.ReturnFurnishedSec', RET_SEC, 'Return furnished under section'],
    ['PartA_GEN1.OrgFirmInfo.SecExemptionClaimed', EXEMPT_SECS, 'Section under which exemption is claimed'],
    ['PartA_GEN1.OrgFirmInfo.Address.StateCode', STATE_CODES, 'State code'],
    ['PartA_GEN1.FilingStatus.ResidentialStatus', RESIDENTIAL, 'Residential status'],
    ['Verification.Declaration.Capacity', CAPACITY, 'Capacity of the signatory'],
    ['PartB_TTI.AssetOutsideIndiaFlg', ['YES', 'NO'], 'Asset held outside India flag'],
  ];
  for (const [rel, allowed, what] of enumChecks) {
    const v = S(rel);
    if (v !== undefined && !allowed.includes(v)) err(rel, `${what} "${v}" is not in the schema enum (${allowed.join('/')})`, 'SCHEMA');
  }
  const fileSec = N('PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec');
  if (fileSec !== undefined && !FILE_SEC.includes(fileSec)) {
    err('PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec', `Filing-section code ${fileSec} is not in the schema enum`, 'SCHEMA');
  }
  const pan = S('PartA_GEN1.OrgFirmInfo.PAN');
  if (pan !== undefined && !RX_PAN.test(pan)) err('PartA_GEN1.OrgFirmInfo.PAN', `PAN "${pan}" is not a valid PAN (AAAAA9999A)`, 'SCHEMA');
  const vpan = S('Verification.Declaration.AssesseeVerPAN');
  if (vpan !== undefined && !RX_PAN_IND.test(vpan)) err('Verification.Declaration.AssesseeVerPAN', `Signatory PAN "${vpan}" must be an individual PAN (4th character "P")`, 'SCHEMA');
  for (const rel of ['Verification.Date', 'CreationInfo.JSONCreationDate']) {
    const d = S(rel);
    if (d !== undefined && !RX_DATE.test(d)) err(rel, `Date "${d}" must be in YYYY-MM-DD format`, 'SCHEMA');
  }
  for (const rel of ['CreationInfo.SWCreatedBy', 'CreationInfo.JSONCreatedBy']) {
    const v = S(rel);
    if (v !== undefined && !RX_SW.test(v)) err(rel, `"${v}" must match the ITD software-provider format SW########`, 'SCHEMA');
  }
  const email = S('PartA_GEN1.OrgFirmInfo.Address.EmailAddress');
  if (email !== undefined && !RX_EMAIL.test(email)) err('PartA_GEN1.OrgFirmInfo.Address.EmailAddress', `Email address "${email}" is not valid`, 'SCHEMA');
  rows(V('PartA_GEN1.RegApprUnderITADtls')).forEach((r, i) => {
    const sec = str(r['SectionRegistered']);
    if (sec !== undefined && !REG_SECTIONS.includes(sec)) {
      err(`PartA_GEN1.RegApprUnderITADtls[${i}].SectionRegistered`, `Registration section code "${sec}" is not in the schema enum`, 'SCHEMA');
    }
  });

  /* ── 8.5 Category-A rules ── */
  const today = todayISO();
  const exSec = S('PartA_GEN1.OrgFirmInfo.SecExemptionClaimed');
  const sub = S('PartA_GEN1.OrgFirmInfo.SubStatus');
  const status = S('PartA_GEN1.OrgFirmInfo.StatusOrCompanyType');
  const resStatus = S('PartA_GEN1.FilingStatus.ResidentialStatus');
  const retSec = S('PartA_GEN1.OrgFirmInfo.ReturnFurnishedSec');
  const incDate = S('PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp');
  const regRows = rows(V('PartA_GEN1.RegApprUnderITADtls'));
  const regSecs = regRows.map((r) => str(r['SectionRegistered'])).filter((s): s is string => s !== undefined);

  // A-2: Indian mobile numbers must be exactly 10 digits.
  const cc = S('PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobile');
  const mob = S('PartA_GEN1.OrgFirmInfo.Address.MobileNo');
  if (cc === '91' && mob !== undefined && !/^[1-9][0-9]{9}$/.test(mob)) {
    err('PartA_GEN1.OrgFirmInfo.Address.MobileNo', 'Mobile number must be exactly 10 digits when the country code is India (91)', 'A-2');
  }

  // A-3 / A-56: status ↔ sub-status.
  if (status === '5' && sub !== undefined && !['5i', '5v', '5vii'].includes(sub)) {
    err('PartA_GEN1.OrgFirmInfo.SubStatus', 'For status AOP, sub-status must be Society (5i), Public Charitable Trust (5v) or Any other AOP/BOI (5vii)', 'A-3');
  }
  if (status === '7' && sub !== undefined && !['7i', '7ii'].includes(sub)) {
    err('PartA_GEN1.OrgFirmInfo.SubStatus', 'For status Company, sub-status must be Domestic Company (7i) or Foreign Company (7ii)', 'A-56');
  }
  // A-40: a domestic company cannot be a non-resident.
  if (sub === '7i' && resStatus === 'NRI') {
    err('PartA_GEN1.FilingStatus.ResidentialStatus', 'A domestic company cannot be a non-resident', 'A-40');
  }
  // A-33 / A-38 / A-39: sub-status restrictions.
  if (sub === '5vii' && regSecs.some((s) => ['VI', 'II', 'III', 'IV', 'V'].includes(s))) {
    err('PartA_GEN1.OrgFirmInfo.SubStatus', 'Registered u/s 12A/12AB or approved u/s 10(23C)(iv)-(via): sub-status cannot be "Any other AOP/BOI"', 'A-33');
  }
  if (exSec === '13A' && sub === '5v') err('PartA_GEN1.OrgFirmInfo.SubStatus', 'A political party claiming exemption u/s 13A cannot have sub-status "Public Charitable Trust"', 'A-38');
  if (exSec === '13B' && sub === '5v') err('PartA_GEN1.OrgFirmInfo.SubStatus', 'An electoral trust claiming exemption u/s 13B cannot have sub-status "Public Charitable Trust"', 'A-39');

  // A-4/5, A-46/47: registration dates vs filing date / incorporation date.
  const dateWindow = (rel: string, d: string | undefined, what: string, rAfter: string, rBefore: string): void => {
    if (d === undefined || !RX_DATE.test(d)) return;
    if (d > today) err(rel, `${what} cannot be after the date of filing of the return`, rAfter);
    if (incDate !== undefined && RX_DATE.test(incDate) && incDate !== '0001-01-01' && d < incDate) {
      err(rel, `${what} cannot be earlier than the date of formation/incorporation`, rBefore);
    }
  };
  regRows.forEach((r, i) => {
    dateWindow(`PartA_GEN1.RegApprUnderITADtls[${i}].RegApprovalDate`, str(r['RegApprovalDate']), 'Date of registration/approval under the Income-tax Act', 'A-4', 'A-5');
    dateWindow(`PartA_GEN1.RegApprUnderITADtls[${i}].EffectiveDate`, str(r['EffectiveDate']), 'Effective date of registration/approval under the Income-tax Act', 'A-46', 'A-47');
  });
  rows(V('PartA_GEN1.RegApprUnderOthITADtls')).forEach((r, i) => {
    dateWindow(`PartA_GEN1.RegApprUnderOthITADtls[${i}].RegApprDate`, str(r['RegApprDate']), 'Date of registration under another law', 'A-22', 'A-23');
    dateWindow(`PartA_GEN1.RegApprUnderOthITADtls[${i}].EffectiveDate`, str(r['EffectiveDate']), 'Date from which registration under another law is effective', 'A-48', 'A-49');
  });

  // A-6..A-21: exemption section ↔ registration details, both directions.
  if (exSec !== undefined) {
    for (const p of REG_PAIRS) {
      const regPresent = regSecs.includes(p.reg);
      const exSelected = p.ex.includes(exSec);
      if (exSelected && !regPresent) {
        err('PartA_GEN1.RegApprUnderITADtls', `Exemption is claimed under section code ${p.ex.join('/')} but no ${p.name} registration/approval row is furnished under "Details of registration/provisional registration or approval under the Income-tax Act"`, p.fwd);
      }
      if (regPresent && !exSelected) {
        err('PartA_GEN1.OrgFirmInfo.SecExemptionClaimed', `Registration/approval u/s ${p.name} is furnished but the corresponding section is not selected under "section under which the exemption is claimed"`, p.rev);
      }
    }
    // A-41 / A-42: registration table must not be empty for these sections.
    if ((EX_11_23C.includes(exSec) || exSec === '2135I') && regRows.length === 0) {
      err('PartA_GEN1.RegApprUnderITADtls', 'Registration/approval details under the Income-tax Act must be furnished for the exemption section claimed', EX_11_23C.includes(exSec) ? 'A-41' : 'A-42');
    }
  }

  // A-24..A-27: return-furnished section vs exemption section.
  if (retSec !== undefined && exSec !== undefined && RET_SEC_ALLOWED[retSec] !== undefined) {
    const g = RET_SEC_ALLOWED[retSec];
    if (!g.allowed.includes(exSec)) {
      err('PartA_GEN1.OrgFirmInfo.SecExemptionClaimed', `Return is furnished u/s ${retSec} but exemption section "${exSec}" is not permitted for that filing section`, g.rule);
    }
  }

  // A-28/29/59: GPU (section 2(15)) disclosures.
  const gpu = S('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.CharitablePurposeOfGeneralPublic');
  if (gpu === 'Y') {
    if (isEmpty(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.ActivityNature2_15'))) miss('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.ActivityNature2_15', 'A23(i)(a)(i) — nature of trade/commerce/business activity (GPU)');
    if (isEmpty(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.ActivityRendering2_15'))) miss('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.ActivityRendering2_15', 'A23(i)(b)(i) — activity of rendering any service (GPU)');
    if (isEmpty(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.PercntNatureOfTrade')) && isEmpty(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.PercntAnyTrade'))) {
      err('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15', 'The assessee is a GPU u/s 2(15) but the percentage of receipts from such activity vis-à-vis total receipts is not furnished under "Other Details"', 'A-28');
    }
    if (rows(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.AggAnnualRecptsofInst')).length === 0) {
      err('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.AggAnnualRecptsofInst', 'The assessee is a GPU u/s 2(15) but the amount of annual aggregate receipts from such activities is not furnished under "Other Details"', 'A-29');
    }
  }
  // A-30/57: change in objects/activities must be answered.
  if (has('PartA_GEN2.OtherDetailsFor7') && isEmpty(V('PartA_GEN2.OtherDetailsFor7.ChangeInActivitiesDuringYr'))) {
    err('PartA_GEN2.OtherDetailsFor7.ChangeInActivitiesDuringYr', 'Sl. A24(i) — whether there is a change in the objects/activities during the year on the basis of which approval/registration was granted — must be answered', 'A-30/57');
  }
  const changed = S('PartA_GEN2.OtherDetailsFor7.ChangeInActivitiesDuringYr');
  const dChange = S('PartA_GEN2.OtherDetailsFor7.DateOfChange');
  if (changed === 'Y' && (dChange === undefined || !RX_DATE.test(dChange))) {
    miss('PartA_GEN2.OtherDetailsFor7.DateOfChange', 'A24(ii)(A) — date of change in objects/activities');
  }
  if (dChange !== undefined && RX_DATE.test(dChange)) {
    if (dChange < FY_START || dChange > FY_END) {
      err('PartA_GEN2.OtherDetailsFor7.DateOfChange', `Date of change of objectives (A24(ii)(A)) must fall within the previous year ${FY_START} to ${FY_END}`, 'A-31');
    }
    if (incDate !== undefined && RX_DATE.test(incDate) && incDate !== '0001-01-01' && dChange < incDate) {
      err('PartA_GEN2.OtherDetailsFor7.DateOfChange', 'Date of change of objectives cannot be before the date of formation/incorporation', 'A-31');
    }
  }
  const dFresh = S('PartA_GEN2.OtherDetailsFor7.DateOfFreshReg');
  if (dFresh !== undefined && RX_DATE.test(dFresh)) {
    if (dChange !== undefined && RX_DATE.test(dChange) && dFresh < dChange) {
      err('PartA_GEN2.OtherDetailsFor7.DateOfFreshReg', 'Date of fresh registration (A24(ii)(D)) cannot be before the date of change of objects/activities (A24(ii)(A))', 'A-32');
    }
    if (dFresh > today) err('PartA_GEN2.OtherDetailsFor7.DateOfFreshReg', 'Date of fresh registration (A24(ii)(D)) cannot be after the date of filing of the return', 'A-32');
  }

  // A-43/52/58: section 13(10) flag (A26) vs GPU receipt percentage (A23(i)) and the A26(a)-(d) sub-flags.
  const pct = (num(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.PercntNatureOfTrade')) ?? 0)
    + (num(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.PercntAnyTrade')) ?? 0);
  const s1310 = S('PartA_GEN2.OtherDetailsFor7.ProvisionsSec1310Applcbl');
  const subFlags = ['Clause15Sec2ProvisioFlag', 'SubClauseiSec12AViolateFlag', 'SubClauseiiSec12AViolateFlag', 'SubSec1Sec12AViolateFlag'];
  const anySubYes = subFlags.some((f) => S('PartA_GEN2.OtherDetailsFor7.' + f) === 'Y');
  if (pct > 20 && s1310 !== undefined && s1310 !== 'Y') {
    err('PartA_GEN2.OtherDetailsFor7.ProvisionsSec1310Applcbl', 'A(23)(i) exceeds 20% — Sl. A(26) and A(26)(a) must be answered "Yes"', 'A-43');
  }
  if (S('PartA_GEN2.OtherDetailsFor7.Clause15Sec2ProvisioFlag') === 'Y' && !(pct > 20)) {
    err('PartA_GEN2.OtherDetailsFor7.Clause15Sec2ProvisioFlag', 'Sl. A(26)(a) is "Yes" but A(23)(i) (sum of aii and bii) is not more than 20%', 'A-52');
  }
  if (anySubYes && s1310 !== 'Y') {
    err('PartA_GEN2.OtherDetailsFor7.ProvisionsSec1310Applcbl', 'One of Sl. A26(a)/(b)/(c)/(d) is "Yes" — Sl. A(26) must also be "Yes"', 'A-58');
  }
  if (s1310 === 'Y' && !anySubYes) {
    err('PartA_GEN2.OtherDetailsFor7', 'Sl. A(26) is "Yes" — Sl. A26(a) to (d) must each be filled with the appropriate option', 'A-44');
  }

  // A-45: LEI mandatory when the refund is Rs. 50 crore or more.
  const refund = N('PartB_TTI.Refund.RefundDue');
  if (refund !== undefined && refund >= 500000000 && isEmpty(V('PartA_GEN1.FilingStatus.LEIDtls.LEINumber'))) {
    miss('PartA_GEN1.FilingStatus.LEIDtls.LEINumber', 'Legal Entity Identifier (LEI) — mandatory when the refund is Rs. 50 crore or more');
  }

  // A-55: audit dates cannot be prior to 01-04-2026.
  const notBeforeAY = (rel: string, d: string | undefined, what: string, rule: string): void => {
    if (d === undefined || !RX_DATE.test(d)) return;
    if (d < AY_START) err(rel, `${what} cannot be prior to ${AY_START}`, rule);
  };
  rows(V('PartA_GEN2.AuditDetails')).forEach((r, i) => {
    notBeforeAY(`PartA_GEN2.AuditDetails[${i}].AuditReportFurnishDate`, str(r['AuditReportFurnishDate']), 'Date of furnishing the audit report', 'A-55');
    // A-123: audited by an accountant → auditor / audit-report particulars are mandatory.
    if (str(r['AuditFlag']) === 'Y') {
      for (const f of ['AudFrmName', 'AudFrmPAN', 'AuditReportFurnishDate', 'AckNumAudtRpt']) {
        if (isEmpty(r[f])) miss(`PartA_GEN2.AuditDetails[${i}].${f}`, `${humanize(f)} — audit information #${i + 1} (accounts audited)`);
      }
    }
  });
  rows(V('PartA_GEN2.LiableAnyOthThnINTActDetails')).forEach((r, i) => {
    notBeforeAY(`PartA_GEN2.LiableAnyOthThnINTActDetails[${i}].DateOfAudit`, str(r['DateOfAudit']), 'Date of audit under another Act', 'A-55');
  });

  // A-60/62: representative-assessee details.
  const repFlg = S('PartA_GEN1.FilingStatus.AsseseeRepFlg');
  const capacity = S('Verification.Declaration.Capacity');
  if ((repFlg === 'Y' || capacity === 'RE') && isEmpty(V('PartA_GEN1.FilingStatus.AssesseeRep'))) {
    miss('PartA_GEN1.FilingStatus.AssesseeRep', capacity === 'RE'
      ? 'Representative assessee — name, email ID and contact number (verification capacity is "Representative")'
      : 'Representative assessee details (the representative-assessee flag is "Y")');
  }
  const repMail = S('PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID');
  const repMob = S('PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo');
  if (repMail !== undefined && email !== undefined && repMail.toLowerCase() === email.toLowerCase()) {
    err('PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID', 'The email ID of the representative assessee must not be the same as the email ID of the taxpayer', 'A-60');
  }
  if (repMob !== undefined && mob !== undefined && repMob === mob) {
    err('PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo', 'The contact number of the representative assessee must not be the same as the contact number of the taxpayer', 'A-60');
  }

  // A-63/64: secondary (alternate) address.
  if (isEmpty(V('PartA_GEN1.OrgFirmInfo.AlternateAddress'))) {
    miss('PartA_GEN1.OrgFirmInfo.AlternateAddress', 'Secondary address in Part A-General (mandatory in the return of income)');
  } else if (S('PartA_GEN1.OrgFirmInfo.SecondaryAdd') === 'N') {
    const same = ['ResidenceNo', 'LocalityOrArea', 'CityOrTownOrDistrict', 'StateCode']
      .every((f) => (S('PartA_GEN1.OrgFirmInfo.Address.' + f) ?? ' ') === (S('PartA_GEN1.OrgFirmInfo.AlternateAddress.' + f) ?? ''));
    if (same) err('PartA_GEN1.OrgFirmInfo.AlternateAddress', 'The secondary address is marked as different from the primary address but the two addresses are identical', 'A-64');
  }

  // A-468: unlisted equity shares flag "Y" → details required.
  if (S('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg') === 'Y'
    && rows(V('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls')).length === 0) {
    err('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr', 'The unlisted-equity-shares flag is "Y" but the share details table is empty', 'A-468');
  }
  if (S('PartA_GEN1.FilingStatus.PartnerInFirmFlg') === 'Y'
    && rows(V('PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls')).length === 0) {
    miss('PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls', 'Details of the firms in which the assessee is a partner (the flag is "Y")');
  }
  if (S('PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag') === 'Y'
    && rows(V('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails')).length === 0) {
    miss('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', 'At least one bank account (the bank-details flag is "Y")');
  }
  // A-638: assets held outside India → Schedule FA.
  if (S('PartB_TTI.AssetOutsideIndiaFlg') === 'YES' && isEmpty(V('ScheduleFA'))) {
    err('ScheduleFA', 'Sl. 14 of Part B-TTI is "Yes" — Schedule FA (foreign assets) must be filled', 'A-638');
  }

  /* Exemption-section gating and mandatory schedules. */
  if (exSec !== undefined) {
    for (const m of MUST) {
      if (!m.secs.includes(exSec)) continue;
      for (const key of m.keys) {
        if (isEmpty(V(key))) err(key, `${m.what} must be filled when exemption is claimed under section code "${exSec}"`, m.rule);
      }
    }
    for (const g of GATE) {
      if (has(g.key) && !g.allowed.includes(exSec)) {
        err(g.key, `${g.name} may be filled only when the exemption section is one of: ${g.allowed.join(', ')} (selected: "${exSec}")`, g.rule);
      }
    }
    // A-164: anonymous donations u/s 115BBC restricted to specific sections.
    const anon = N('ScheduleVC.AnonymousDonations.AggregateAnonymousDonations');
    if (anon !== undefined && anon > 0 && !ANON_SET.includes(exSec)) {
      err('ScheduleVC.AnonymousDonations', 'Anonymous donations u/s 115BBC may be reported only by persons claiming exemption u/s 11, 10(23C)(iv)/(v)/(vi)/(via), 10(23C)(iiiad) or 10(23C)(iiiae)', 'A-164');
    }
    // A-549: Part B2 Sl. 3 is limited to 10(21) / 10(21) r.w.s. 35(1).
    const b2s3 = N('PartB_TI2.IncomeChargeable11_3');
    if (b2s3 !== undefined && b2s3 !== 0 && !['21', '2135I'].includes(exSec)) {
      err('PartB_TI2.IncomeChargeable11_3', 'Sl. 3 of Part B2 is filled but neither section 10(21) nor 10(21) read with section 35 is selected as the exemption section', 'A-549');
    }
    // A-612: Part B3 also needs A(26) = "Yes".
    if (has('PartB_TI3') && EX_11_23C.includes(exSec) && s1310 !== 'Y') {
      err('PartB_TI3', 'Part B3 of Part B-TI may be filled only when Sl. A(26) of Part A-General (provisions of section 13(10)) is selected as "Yes"', 'A-612');
    }
  }
  // A-576: the return cannot be filed without the Statement of Income.
  if (!has('PartB_TI') && !has('PartB_TI2') && !has('PartB_TI3')) {
    err('PartB_TI', 'The return cannot be filed without the Statement of Income (Part B1, Part B2 or Part B3 of Part B-TI)', 'A-576');
  }

  /* Part B2 exemption lines: section selection + Schedule IE amount (A-513..A-580). */
  for (const line of B2_LINES) {
    const amt = N('PartB_TI2.' + line.f);
    if (amt === undefined || amt === 0) continue;
    if (exSec !== undefined && exSec !== line.sec) {
      err('PartB_TI2.' + line.f, `Exemption is claimed at this line but section code "${line.sec}" is not selected under "section under which the exemption is claimed"`, line.ruleSel);
    }
    if (line.src && line.ruleAmt) {
      const src = N(line.src);
      if (src !== undefined && Math.abs(src - amt) > TOL) {
        err('PartB_TI2.' + line.f, `The exemption claimed (${amt}) must equal the total receipts including voluntary contributions reported at ${line.src} (${src})`, line.ruleAmt);
      }
    }
  }
  // A-570: 10(23C)(iiiad)/(iiiae) exemption is capped at Rs. 5 crore.
  for (const f of ['ExemptionUs10_23Ciiiad', 'ExemptionUs10_23Ciiiae']) {
    const v = N('PartB_TI2.' + f);
    if (v !== undefined && v > 50000000) err('PartB_TI2.' + f, 'Exemption u/s 10(23C)(iiiad)/(iiiae) cannot exceed Rs. 5 crore', 'A-570');
  }
  // A-510: Part B1 Sl. 2 must be zero.
  const vcCorpus = N('PartB_TI.VcCorpusSec11');
  if (vcCorpus !== undefined && vcCorpus !== 0) err('PartB_TI.VcCorpusSec11', 'Sl. 2 of Part B1 (corpus voluntary contributions) must be zero', 'A-510');
  // A-474: Part B1 Sl. 1 vs Schedule VC.
  {
    const c = N('ScheduleVC.TotalContribution');
    const ai = N('ScheduleVC.Local.CorpusFundDonation');
    const bi = N('ScheduleVC.Foreign.CorpusFundDonation');
    const e = N('ScheduleVC.AnonymousDonations.AnonymousDonationsOthr115BBC');
    const s1 = N('PartB_TI.VoluntaryContributions.TotIncFromVC');
    if (c !== undefined && ai !== undefined && bi !== undefined && e !== undefined && s1 !== undefined) {
      const want = c - ai - bi + e;
      if (Math.abs(want - s1) > TOL) err('PartB_TI.VoluntaryContributions.TotIncFromVC', `Sl. 1 of Part B1 must equal C-A(i)-B(i)+E of Schedule VC — expected ${want}, found ${s1}`, 'A-474');
    }
  }
  // A-469/470: accumulation u/s 11(1)/10(23C) capped at 15%.
  {
    const s1 = N('PartB_TI.VoluntaryContributions.TotIncFromVC');
    const s3 = N('PartB_TI.AggregateIncomeUs1112');
    const a1 = N('ScheduleA.AppTowExpTrstInst.OtherThanCorpus.Total');
    const acc = N('PartB_TI.TIDeductions.AmtAccumulatedForCharitable');
    if (s1 !== undefined && s3 !== undefined && a1 !== undefined && acc !== undefined) {
      const cap = 0.15 * (s1 + s3 - a1);
      if (acc > cap + TOL) err('PartB_TI.TIDeductions.AmtAccumulatedForCharitable', `Sl. 6(v) of Part B1 (${acc}) cannot exceed 15% of [(Sl. 1 + Sl. 3) - A1 of Schedule A] = ${Math.round(cap)}`, 'A-469/470');
    }
  }
  // A-65: 10(23C)(iv)-(via) → Part B1 Sl. 6(iv) must not be greater than zero.
  if (exSec !== undefined && ['23CIV', '23CV', '23CVI', '23CVIA'].includes(exSec)) {
    const v = N('PartB_TI.TIDeductions.AmtDeemedForCharitable');
    if (v !== undefined && v > 0) err('PartB_TI.TIDeductions.AmtDeemedForCharitable', 'When exemption is claimed u/s 10(23C)(iv)/(v)/(vi)/(via), Sl. 6(iv) of Part B1 must not be greater than zero', 'A-65');
  }

  /* Schedule VC 5% / Rs. 1,00,000 threshold (A-167). */
  {
    const c = N('ScheduleVC.TotalContribution');
    const di = N('ScheduleVC.AnonymousDonations.AggregateAnonymousDonations');
    const dii = N('ScheduleVC.AnonymousDonations.TotalDonationsReceived');
    if (c !== undefined && di !== undefined && dii !== undefined) {
      const want = Math.max(0.05 * (c + di), 100000);
      if (Math.abs(want - dii) > 1 && dii < Math.min(di, want) - TOL) {
        err('ScheduleVC.AnonymousDonations.TotalDonationsReceived', `Schedule VC D(ii) must be 5% of (C + D(i)) or Rs. 1,00,000, whichever is higher — expected ${Math.round(want)}, found ${dii}`, 'A-167');
      }
    }
  }
  // A-169: corpus in Schedule VC must equal corpus received during the year in Schedule J.
  {
    const vcCorp = (N('ScheduleVC.Local.CorpusFundDonation') ?? 0) + (N('ScheduleVC.Foreign.CorpusFundDonation') ?? 0);
    const jCorp = N('ITRScheduleJ.ScheduleJ_A1.TotReceivedCorpus');
    if (has('ScheduleVC') && jCorp !== undefined && Math.abs(vcCorp - jCorp) > TOL) {
      err('ITRScheduleJ.ScheduleJ_A1.TotReceivedCorpus', `Corpus fund received during the year in Schedule J (${jCorp}) must equal the corpus fund entered in Schedule VC (${vcCorp})`, 'A-169');
    }
  }

  /* Schedule A — Revenue + Capital = Total (A-150) and its totals (A-143..A-147). */
  const A_SUB = ['OtherThanCorpus', 'OtherThanCorpus85', 'Religious', 'ReliefOfPoor', 'Educational', 'Yoga', 'MedicalRelief', 'PreservationOfEnvrmnt', 'PreservationOfMonumentsEtc', 'GeneralPublicUtility', 'AppCantBeSpecIdentAbov', 'CostNewAssetUs11_1A'];
  const B_SUB = ['DonFormingPartCorpusFund', 'DonationTowardsOtherThanCorpus', 'DonationNotSameObject', 'DonationOtherThanTrust', 'ApplctnOutIndiaApprvlObtnd', 'ApplctnOutIndiaApprvlNotObtnd', 'AppliedBeyondObject', 'AnyOthrDisallowableExpenditure'];
  const C_SUB = ['IncDerFrmPrprty', 'IncAccumulatedEarlierYr', 'IncDeemdPrcdngYr', 'EarlierYrIncUpto15Per', 'Corpus', 'BorrowedFund', 'OthersInc.TotOthersInc'];
  if (has('ScheduleA')) {
    const triples = [
      ...A_SUB.map((k) => 'ScheduleA.AppTowExpTrstInst.' + k),
      'ScheduleA.AppTowExpTrstInst.TotalA1toA11',
      ...B_SUB.map((k) => 'ScheduleA.ExpNotAllowedApplication.' + k),
      'ScheduleA.ExpNotAllowedApplication.TotExpNotAllowedApplication',
      ...C_SUB.map((k) => 'ScheduleA.SrcRevCapApplctn.' + k),
      'ScheduleA.SrcRevCapApplctn.TotSrcRevCapApplctn',
      'ScheduleA.TotAmtAppDrngPrevYr', 'ScheduleA.AmountNotPaidPY', 'ScheduleA.AmountPaidPY', 'ScheduleA.TotAmountAllowedApplication',
    ];
    for (const p of triples) {
      const r = N(p + '.Revenue');
      const c = N(p + '.Capital');
      const t = N(p + '.Total');
      if (r === undefined || c === undefined || t === undefined) continue;
      if (Math.abs(r + c - t) > TOL) err(p + '.Total', `Schedule A: "Total" must equal "Revenue" + "Capital" — expected ${r + c}, found ${t}`, 'A-150');
    }
    for (const col of ['Revenue', 'Capital', 'Total'] as const) {
      const sumOf = (base: string, keys: string[]): number | undefined => {
        let acc = 0;
        for (const k of keys) { const x = N(`${base}.${k}.${col}`); if (x === undefined) return undefined; acc += x; }
        return acc;
      };
      const a12 = N(`ScheduleA.AppTowExpTrstInst.TotalA1toA11.${col}`);
      const wantA = sumOf('ScheduleA.AppTowExpTrstInst', A_SUB.filter((k) => k !== 'OtherThanCorpus85'));
      if (a12 !== undefined && wantA !== undefined && Math.abs(a12 - wantA) > TOL) {
        err(`ScheduleA.AppTowExpTrstInst.TotalA1toA11.${col}`, `Schedule A Sl. A12 (${col}) must equal the sum of A1a to A11 — expected ${wantA}, found ${a12}`, 'A-143');
      }
      const b = N(`ScheduleA.ExpNotAllowedApplication.TotExpNotAllowedApplication.${col}`);
      const wantB = sumOf('ScheduleA.ExpNotAllowedApplication', B_SUB);
      if (b !== undefined && wantB !== undefined && Math.abs(b - wantB) > TOL) {
        err(`ScheduleA.ExpNotAllowedApplication.TotExpNotAllowedApplication.${col}`, `Schedule A Sl. B (${col}) must equal the sum of B1 to B8 — expected ${wantB}, found ${b}`, 'A-144');
      }
      const c = N(`ScheduleA.SrcRevCapApplctn.TotSrcRevCapApplctn.${col}`);
      const wantC = sumOf('ScheduleA.SrcRevCapApplctn', C_SUB);
      if (c !== undefined && wantC !== undefined && Math.abs(c - wantC) > TOL) {
        err(`ScheduleA.SrcRevCapApplctn.TotSrcRevCapApplctn.${col}`, `Schedule A Sl. C (${col}) must equal the sum of C1 to C7 — expected ${wantC}, found ${c}`, 'A-145');
      }
      const d = N(`ScheduleA.TotAmtAppDrngPrevYr.${col}`);
      const wantD = (() => {
        if (a12 === undefined || b === undefined) return undefined;
        let acc = a12 - b;
        for (const k of C_SUB.slice(1)) { const x = N(`ScheduleA.SrcRevCapApplctn.${k}.${col}`); if (x === undefined) return undefined; acc -= x; }
        return acc;
      })();
      if (d !== undefined && wantD !== undefined && Math.abs(d - wantD) > TOL) {
        err(`ScheduleA.TotAmtAppDrngPrevYr.${col}`, `Schedule A Sl. D (${col}) must equal [A12-B-C2-C3-C4-C5-C6-C7] — expected ${wantD}, found ${d}`, 'A-146');
      }
      const g = N(`ScheduleA.TotAmountAllowedApplication.${col}`);
      const e = N(`ScheduleA.AmountNotPaidPY.${col}`);
      const f = N(`ScheduleA.AmountPaidPY.${col}`);
      if (g !== undefined && d !== undefined && e !== undefined && f !== undefined && Math.abs(g - (d - e + f)) > TOL) {
        err(`ScheduleA.TotAmountAllowedApplication.${col}`, `Schedule A Sl. G (${col}) must equal D-E+F — expected ${d - e + f}, found ${g}`, 'A-147');
      }
    }
    // A-154: cost of a new asset u/s 11(1A) cannot be a revenue application.
    const rev11A = N('ScheduleA.AppTowExpTrstInst.CostNewAssetUs11_1A.Revenue');
    if (rev11A !== undefined && rev11A > 0) {
      err('ScheduleA.AppTowExpTrstInst.CostNewAssetUs11_1A.Revenue', 'Schedule A Sl. A(11) (cost of a new asset for exemption u/s 11(1A)) must be "0" in the Revenue column', 'A-154');
    }
  }

  /* Schedule AI Sl. 9 total (A-140). */
  {
    const t9 = N('ScheduleAI.TotalofOtherIncomes');
    if (t9 !== undefined) {
      const oth = rows(V('ScheduleAI.OthersInc.OthersIncDtls'));
      let acc = num(V('ScheduleAI.PassThroughIncome')) ?? 0;
      let ok = true;
      for (const r of oth) { const x = num(r['OthAmount']); if (x === undefined) { ok = false; break; } acc += x; }
      if (ok && (oth.length > 0 || has('ScheduleAI.PassThroughIncome')) && Math.abs(acc - t9) > TOL) {
        err('ScheduleAI.TotalofOtherIncomes', `Schedule AI Sl. 9 Total must equal the sum of 9a, 9b, 9c… plus the pass-through income — expected ${acc}, found ${t9}`, 'A-140');
      }
    }
  }

  /* Schedule IE receipts vs Schedule VC (A-160..A-163) and IE limits (A-176/177). */
  {
    const vcTot = N('ScheduleVC.TotalContribution');
    if (vcTot !== undefined) {
      const pairs: Array<[string, string, string]> = [
        ['ScheduleIE_I.TotRcptVoluntaryContr', 'Schedule IE-1 Sl. 1', 'A-160'],
        ['ScheduleIE_II.TotRcptVoluntaryContr', 'Schedule IE-2 Sl. A1', 'A-161'],
      ];
      for (const [p, what, rule] of pairs) {
        const v = N(p);
        if (v !== undefined && v + TOL < vcTot) err(p, `${what} (${v}) must not be less than the total voluntary contributions at Sl. C of Schedule VC (${vcTot})`, rule);
      }
      const vcE = N('ScheduleVC.AnonymousDonations.AnonymousDonationsOthr115BBC') ?? 0;
      const ie4 = N('ScheduleIE_IV.SumGrossAnnualReceipts');
      if (ie4 !== undefined && ie4 + TOL < vcTot + vcE) {
        err('ScheduleIE_IV.SumGrossAnnualReceipts', `Schedule IE-4 gross annual receipts (${ie4}) must not be less than Sl. C + E of Schedule VC (${vcTot + vcE})`, 'A-163');
      }
      rows(V('ScheduleIE_III.ScheduleIEIIIDtls')).forEach((r, i) => {
        const v = num(r['TotRcptVoluntaryContr']);
        if (v !== undefined && v + TOL < vcTot) {
          err(`ScheduleIE_III.ScheduleIEIIIDtls[${i}].TotRcptVoluntaryContr`, `Schedule IE-3 Sl. 3 (${v}) must not be less than the total voluntary contributions at Sl. C of Schedule VC (${vcTot})`, 'A-162');
        }
      });
    }
    const ie4Sum = N('ScheduleIE_IV.SumGrossAnnualReceipts');
    if (ie4Sum !== undefined && ie4Sum > 50000000) {
      err('ScheduleIE_IV.SumGrossAnnualReceipts', 'Aggregate gross annual receipts exceed Rs. 5 crore — exemption u/s 10(23C)(iiiad)/(iiiae) is not available and a form other than ITR-7 applies', 'A-176');
    }
    rows(V('ScheduleIE_III.ScheduleIEIIIDtls')).forEach((r, i) => {
      const tot = num(r['TotRcptVoluntaryContr']);
      const grants = num(r['GovtGrants']);
      if (tot !== undefined && grants !== undefined && tot > 0 && grants * 2 <= tot) {
        err(`ScheduleIE_III.ScheduleIEIIIDtls[${i}].GovtGrants`, 'Government grants are 50% or less of the total receipts — exemption u/s 10(23C)(iiiab)/(iiiac) is not available and a form other than ITR-7 applies', 'A-177');
      }
    });
    // A-174/175: IE-3 / IE-4 objective must match the sub-clause claimed.
    const ieObjRows = [
      ...rows(V('ScheduleIE_III.ScheduleIEIIIDtls')).map((r, i) => ({ r, p: `ScheduleIE_III.ScheduleIEIIIDtls[${i}].ObjectiveOfInstitution` })),
      ...rows(V('ScheduleIE_IV.ScheduleIEIVDtls')).map((r, i) => ({ r, p: `ScheduleIE_IV.ScheduleIEIVDtls[${i}].ObjectiveOfInstitution` })),
    ];
    const wantObj = (exSec === '23CIIIAB' || exSec === '23CIIIAD') ? 'EDU' : (exSec === '23CIIIAC' || exSec === '23CIIIAE') ? 'MED' : undefined;
    if (wantObj !== undefined) {
      for (const o of ieObjRows) {
        const v = str(o.r['ObjectiveOfInstitution']);
        if (v !== undefined && v !== wantObj) {
          err(o.p, `Exemption u/s 10(23C)(${wantObj === 'EDU' ? 'iiiab)/(iiiad' : 'iiiac)/(iiiae'}) requires the objective "${wantObj === 'EDU' ? 'Education' : 'Medical'}" in Schedule IE-3/IE-4`, wantObj === 'EDU' ? 'A-174' : 'A-175');
        }
      }
    }
  }

  /* Schedule PP / ET conditional fields and dates. */
  if (has('SchedulePP')) {
    if (S('SchedulePP.RecognizedByECI') === 'Y' && isEmpty(V('SchedulePP.DateOfRecognition'))) {
      err('SchedulePP.DateOfRecognition', 'Schedule PP Sl. 1(B): the party is recognised by the Election Commission of India but the date of recognition is not provided', 'A-125');
    }
    if (S('SchedulePP.ReportUs29') === 'Y') {
      if (isEmpty(V('SchedulePP.SubmissionDate'))) miss('SchedulePP.SubmissionDate', 'Schedule PP Sl. 4a — date of submission of the report u/s 29C(3) of the RP Act, 1951');
      if (isEmpty(V('SchedulePP.Electioncommissionlist'))) miss('SchedulePP.Electioncommissionlist', 'Schedule PP Sl. 4b — Election Commission to whom the report was submitted');
    }
    if (S('SchedulePP.RegisterUS29A') === 'Y') {
      if (isEmpty(V('SchedulePP.RegisterNum')) || isEmpty(V('SchedulePP.DateRegisterUS29A'))) {
        warn('SchedulePP.RegisterNum', 'Exemption u/s 13A is not allowed if the registration number and the date of registration u/s 29A of the RP Act, 1951 are not provided', 'B-21');
      }
    }
    notBeforeAY('SchedulePP.AuditDetailsSchPP.DateOfAudit', S('SchedulePP.AuditDetailsSchPP.DateOfAudit'), 'Schedule PP date of furnishing the audit report (Sl. 3a)', 'A-122');
    notBeforeAY('SchedulePP.AuditDetailsSchPP.AuditDate', S('SchedulePP.AuditDetailsSchPP.AuditDate'), 'Schedule PP date of the audit report (Sl. 3g)', 'A-122');
  }
  if (has('ScheduleET')) {
    notBeforeAY('ScheduleET.AuditReportDate', S('ScheduleET.AuditReportDate'), 'Schedule ET date of audit (Sl. 4b)', 'A-129');
    if (exSec === '13B') {
      const vcTot = N('ScheduleVC.TotalContribution');
      const etVc = N('ScheduleET.VoluntaryContributionDtls.VoluntaryContributionDuringYr');
      if (vcTot !== undefined && etVc !== undefined && Math.abs(vcTot - etVc) > TOL) {
        err('ScheduleET.VoluntaryContributionDtls.VoluntaryContributionDuringYr', `Schedule ET Sl. 6(ii) (${etVc}) must equal Sl. C of Schedule VC (${vcTot})`, 'A-130');
      }
    }
  }

  /* Schedule 115TD (A-449). */
  {
    const acc = N('Schedule115TD.AccretedIncomeSection115TD');
    if (acc !== undefined && acc > 0 && isEmpty(V('Schedule115TD.SpecifiedDateUs115TD'))) {
      err('Schedule115TD.SpecifiedDateUs115TD', 'Accreted income u/s 115TD is entered but the specified date u/s 115TD (Sl. 9) is blank', 'A-449');
    }
  }

  /* Schedule VDA (A-329) and Schedule CG (A-297) transfer dates. */
  rows(V('ScheduleVDA.ScheduleVDADtls')).forEach((r, i) => {
    for (const f of ['DateofAcquisition', 'DateofTransfer']) {
      const d = str(r[f]);
      if (d !== undefined && RX_DATE.test(d) && d > FY_END) {
        err(`ScheduleVDA.ScheduleVDADtls[${i}].${f}`, `${humanize(f)} cannot be after ${FY_END} (31 March of the financial year)`, 'A-329');
      }
    }
  });

  /* Schedule HP conditional / consistency rules. */
  rows(V('ScheduleHP.PropertyDetails')).forEach((r, i) => {
    const p = `ScheduleHP.PropertyDetails[${i}]`;
    const alv = num(at(r, 'Rentdetails.AnnualLetableValue'));
    const localTax = num(at(r, 'Rentdetails.LocalTaxes'));
    const unrealized = num(at(r, 'Rentdetails.RentNotRealized'));
    const interest = num(at(r, 'Rentdetails.IntOnBorwCap'));
    const share = num(r['AssessePercentShareProp']);
    const coOwned = str(r['PropCoOwnedFlg']);
    if ((alv === undefined || alv === 0) && localTax !== undefined && localTax > 0) {
      err(`${p}.Rentdetails.LocalTaxes`, 'Gross rent received/receivable/lettable value is zero or null — municipal tax cannot be claimed', 'A-185');
    }
    if (!isEmpty(r['ifLetOut']) && (alv === undefined || alv === 0)) {
      err(`${p}.Rentdetails.AnnualLetableValue`, 'The property is let out or deemed let out but the gross rent received/receivable/lettable value is zero or null', 'A-186');
    }
    if (unrealized !== undefined && alv !== undefined && unrealized > alv + TOL) {
      err(`${p}.Rentdetails.RentNotRealized`, 'The amount of rent which cannot be realised must not exceed the gross rent received/receivable during the year', 'A-195');
    }
    if (interest !== undefined && interest > 0) {
      const dtls = rows(at(r, 'Rentdetails.Section24B.Section24BDtls'));
      if (dtls.length === 0) {
        err(`${p}.Rentdetails.Section24B.Section24BDtls`, 'Details of the loan taken must be provided in Table 24(b) to claim interest on borrowed capital u/s 24(b)', 'A-191/193');
      } else {
        const tot = num(at(r, 'Rentdetails.Section24B.TotalInterestUs24B'));
        let acc = 0; let ok = true;
        for (const d of dtls) { const x = num(d['InterestUs24B']); if (x === undefined) { ok = false; break; } acc += x; }
        if (ok && tot !== undefined && Math.abs(acc - tot) > TOL) {
          err(`${p}.Rentdetails.Section24B.TotalInterestUs24B`, `The sum of the individual rows of Table 24(b) (${acc}) must match the total interest on borrowed capital (${tot})`, 'A-192');
        }
      }
    }
    if (coOwned === 'NO' && share !== undefined && Math.abs(share - 100) > 0.01) {
      err(`${p}.AssessePercentShareProp`, "The property is not co-owned — the assessee's share must be 100%", 'A-194');
    }
    if (coOwned === 'YES') {
      const co = rows(r['CoOwners']);
      let acc = share ?? 0; let ok = share !== undefined;
      for (const c of co) { const x = num(c['PercentShareProperty']); if (x === undefined) { ok = false; break; } acc += x; }
      if (ok && co.length > 0 && Math.abs(acc - 100) > 0.01) {
        err(`${p}.AssessePercentShareProp`, `For a co-owned property the assessee's share and the co-owners' shares must total 100% (found ${acc}%)`, 'A-188');
      }
      co.forEach((c, j) => {
        const cp = str(c['PAN_CoOwner']);
        if (cp !== undefined && pan !== undefined && cp === pan) {
          err(`${p}.CoOwners[${j}].PAN_CoOwner`, "A co-owner's PAN must not be the same as the assessee's PAN", 'A-190');
        }
      });
    }
    if (share === 0 && interest !== undefined && interest > 0) {
      err(`${p}.Rentdetails.IntOnBorwCap`, "The assessee's share in the co-owned property is zero — interest on borrowed capital must not be more than zero", 'A-189');
    }
  });

  /* Schedule SI (A-387/A-388). */
  const DTAA_CODES = ['DTAASTCG', 'DTAALTCG', 'DTAAOS'];
  rows(V('ScheduleSI.SplCodeRateTax')).forEach((r, i) => {
    const inc = num(r['SplRateInc']);
    const tax = num(r['SplRateIncTax']);
    const rate = num(r['SplRatePercent']);
    const code = str(r['SecCode']);
    if (inc !== undefined && inc > 0 && (tax === undefined)) {
      err(`ScheduleSI.SplCodeRateTax[${i}].SplRateIncTax`, 'The tax computed in column (ii) cannot be null when the income in column (i) is greater than zero', 'A-388');
    }
    if (inc !== undefined && tax !== undefined && rate !== undefined && code !== undefined && !DTAA_CODES.includes(code)) {
      const want = Math.round(inc * rate / 100);
      if (Math.abs(want - tax) > 1) {
        err(`ScheduleSI.SplCodeRateTax[${i}].SplRateIncTax`, `Tax in column (ii) must equal the income in column (i) multiplied by the special rate — expected ${want}, found ${tax}`, 'A-387');
      }
    }
  });

  /* Schedule FSI / TR (A-456..A-467). */
  const FSI_HEADS = ['IncFromHP', 'IncFromBusiness', 'IncCapGain', 'IncOthSrc'];
  rows(V('ScheduleFSI.ScheduleFSIDtls')).forEach((r, i) => {
    for (const h of [...FSI_HEADS, 'TotalCountryWise']) {
      const paid = num(at(r, `${h}.TaxPaidOutsideInd`));
      const payable = num(at(r, `${h}.TaxPayableinInd`));
      const relief = num(at(r, `${h}.TaxReliefinInd`));
      if (paid !== undefined && payable !== undefined && relief !== undefined && relief > Math.min(paid, payable) + TOL) {
        err(`ScheduleFSI.ScheduleFSIDtls[${i}].${h}.TaxReliefinInd`, 'Tax relief available (column e) must be the lower of the tax paid outside India (column c) and the tax payable in India (column d)', 'A-456');
      }
    }
    for (const f of ['IncFrmOutsideInd', 'TaxPaidOutsideInd', 'TaxPayableinInd', 'TaxReliefinInd']) {
      const tot = num(at(r, `TotalCountryWise.${f}`));
      if (tot === undefined) continue;
      let acc = 0; let ok = true;
      for (const h of FSI_HEADS) { const x = num(at(r, `${h}.${f}`)); if (x === undefined) { ok = false; break; } acc += x; }
      if (ok && Math.abs(acc - tot) > TOL) {
        err(`ScheduleFSI.ScheduleFSIDtls[${i}].TotalCountryWise.${f}`, `Schedule FSI Total must equal the sum of (i+ii+iii+iv) — expected ${acc}, found ${tot}`, 'A-458');
      }
    }
  });
  if (resStatus === 'NRI') {
    if (has('ScheduleFSI')) err('ScheduleFSI', 'Schedule FSI is not applicable to non-residents', 'A-457');
    if (has('ScheduleTR1')) err('ScheduleTR1', 'Schedule TR is not applicable to non-residents', 'A-465');
  }
  // A-462/463: Schedule TR relief split by the section claimed.
  {
    const trRows = rows(V('ScheduleTR1.ScheduleTR'));
    if (trRows.length > 0) {
      let dtaa = 0; let non = 0; let ok = true;
      for (const r of trRows) {
        const v = num(r['TaxReliefOutsideIndia']);
        const sec = str(r['ReliefClaimedUsSection']);
        if (v === undefined || sec === undefined) { ok = false; break; }
        if (sec === '91') non += v; else dtaa += v;
      }
      if (ok) {
        const a = N('ScheduleTR1.TaxReliefOutsideIndiaDTAA');
        const b = N('ScheduleTR1.TaxReliefOutsideIndiaNotDTAA');
        if (a !== undefined && Math.abs(a - dtaa) > TOL) err('ScheduleTR1.TaxReliefOutsideIndiaDTAA', `Schedule TR Sl. 2 must equal the total relief of the rows where the section is 90/90A — expected ${dtaa}, found ${a}`, 'A-462');
        if (b !== undefined && Math.abs(b - non) > TOL) err('ScheduleTR1.TaxReliefOutsideIndiaNotDTAA', `Schedule TR Sl. 3 must equal the total relief of the rows where the section is 91 — expected ${non}, found ${b}`, 'A-463');
      }
    }
  }

  /* Schedule TDS / TCS conditional fields (A-646..A-661). */
  rows(V('ScheduleTDS2.TDSOthThanSalaryDtls')).forEach((r, i) => {
    const p = `ScheduleTDS2.TDSOthThanSalaryDtls[${i}]`;
    const tan = str(r['TANOfDeductor']);
    if (tan !== undefined && !RX_TAN.test(tan)) err(`${p}.TANOfDeductor`, `TAN "${tan}" of the deductor is not valid (AAAA99999A)`, 'A-647');
    if (str(r['TDSCreditName']) === 'O' && isEmpty(at(r, 'TaxDeductCreditDtls.TaxClaimedSpouseOthPrsnPAN'))) {
      err(`${p}.TaxDeductCreditDtls.TaxClaimedSpouseOthPrsnPAN`, 'TDS credit relating to another person is selected but the PAN of that person is not provided', 'A-646');
    }
    const bf = num(r['BroughtFwdTDSAmt']);
    if (bf !== undefined && bf > 0 && isEmpty(r['DeductedYr'])) {
      err(`${p}.DeductedYr`, 'The financial year in which the tax was deducted must be provided when brought-forward TDS is claimed', 'A-648');
    }
    const claimed = num(at(r, 'TaxDeductCreditDtls.TaxClaimedOwnHands'));
    const deducted = num(at(r, 'TaxDeductCreditDtls.TaxDeductedOwnHands'));
    if (claimed !== undefined && deducted !== undefined && bf !== undefined && claimed > deducted + bf + TOL) {
      err(`${p}.TaxDeductCreditDtls.TaxClaimedOwnHands`, 'The amount of TDS claimed this year must not exceed the tax deducted plus the brought-forward TDS', 'A-644');
    }
    const gross = num(r['GrossAmount']);
    if (claimed !== undefined && claimed > 0 && (gross === undefined || isEmpty(r['HeadOfIncome']))) {
      err(`${p}.GrossAmount`, 'When TDS is claimed, the gross amount and the head of income under "corresponding income offered" must be filled', 'A-652');
    }
  });
  rows(V('ScheduleTDS3.TDS3onOthThanSalDtls')).forEach((r, i) => {
    const p = `ScheduleTDS3.TDS3onOthThanSalDtls[${i}]`;
    const bp = str(r['PANOfBuyerTenant']);
    if (bp !== undefined && !RX_PAN.test(bp)) err(`${p}.PANOfBuyerTenant`, `PAN "${bp}" of the tenant/buyer is not valid`, 'A-647');
    if (str(r['TDSCreditName']) === 'O' && isEmpty(at(r, 'TaxDeductCreditDtls.TaxClaimedSpouseOthPrsnPAN'))) {
      err(`${p}.TaxDeductCreditDtls.TaxClaimedSpouseOthPrsnPAN`, 'TDS credit relating to another person is selected but the PAN of that person is not provided', 'A-646');
    }
  });
  rows(V('ScheduleTCS.TCSDetails')).forEach((r, i) => {
    const p = `ScheduleTCS.TCSDetails[${i}]`;
    const tan = str(at(r, 'EmployerOrDeductorOrCollectDetl.TAN'));
    if (tan === undefined || tan === '') {
      err(`${p}.EmployerOrDeductorOrCollectDetl.TAN`, 'The tax deduction and collection account number of the collector must be provided', 'A-660');
    } else if (!RX_TAN.test(tan)) {
      err(`${p}.EmployerOrDeductorOrCollectDetl.TAN`, `TAN "${tan}" of the collector is not valid (AAAA99999A)`, 'A-660');
    }
    if (str(at(r, 'EmployerOrDeductorOrCollectDetl.TCSCreditName')) === 'O'
      && isEmpty(at(r, 'TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn'))) {
      err(`${p}.TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn`, 'TCS credit relating to another person is selected but the PAN of that person is not provided', 'A-658');
    }
    const bf = num(r['BroughtFwdTCSAmt']) ?? 0;
    const own = num(at(r, 'TCSCurrFYDtls.TCSAmtCollOwnHands')) ?? 0;
    const oth = num(at(r, 'TCSCurrFYDtls.TCSAmtCollOthrHands')) ?? 0;
    const clOwn = num(at(r, 'TCSClaimedThisYearDtls.TCSAmtCollOwnHands'));
    const clOth = num(at(r, 'TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TaxClaimedTCS')) ?? 0;
    if (clOwn !== undefined && clOwn + clOth > bf + own + oth + TOL) {
      err(`${p}.TCSClaimedThisYearDtls.TCSAmtCollOwnHands`, 'TCS claimed in own hands and in the hands of another person must not exceed the brought-forward TCS plus the TCS collected', 'A-657');
    }
  });

  /* Part B-TTI advance tax / self-assessment tax vs Schedule IT (A-631/632). */
  {
    const itRows = rows(V('ScheduleIT.TaxPayment'));
    if (itRows.length > 0) {
      let adv = 0; let sat = 0; let ok = true;
      for (const r of itRows) {
        const d = str(r['DateDep']);
        const a = num(r['Amt']);
        if (d === undefined || !RX_DATE.test(d) || a === undefined) { ok = false; break; }
        if (d >= FY_START && d <= FY_END) adv += a; else if (d > FY_END) sat += a;
      }
      if (ok) {
        const pAdv = N('PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax');
        const pSat = N('PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax');
        if (pAdv !== undefined && Math.abs(pAdv - adv) > TOL) err('PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax', `Part B-TTI 9a must equal the challans in Schedule IT deposited between ${FY_START} and ${FY_END} — expected ${adv}, found ${pAdv}`, 'A-631');
        if (pSat !== undefined && Math.abs(pSat - sat) > TOL) err('PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax', `Part B-TTI 9d must equal the challans in Schedule IT deposited after ${FY_END} — expected ${sat}, found ${pSat}`, 'A-632');
      }
    }
    // A-633: TDS = Schedule TDS-2 + Schedule TDS-3.
    const t2 = N('ScheduleTDS2.TotalTDSonOthThanSals');
    const t3 = N('ScheduleTDS3.TotalTDS3OnOthThanSal');
    const pTds = N('PartB_TTI.TaxPaid.TaxesPaid.TDS');
    if (pTds !== undefined && (t2 !== undefined || t3 !== undefined)) {
      const want = (t2 ?? 0) + (t3 ?? 0);
      if (Math.abs(want - pTds) > TOL) err('PartB_TTI.TaxPaid.TaxesPaid.TDS', `Part B-TTI 9(b) must equal the totals of Schedule TDS-2 and TDS-3 — expected ${want}, found ${pTds}`, 'A-633');
    }
    // A-629/630: amount payable / refund.
    const agg = N('PartB_TTI.ComputationOfTaxLiability.AggregateTaxInterestLiability');
    const paid = N('PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid');
    const bal = N('PartB_TTI.TaxPaid.BalTaxPayable');
    if (agg !== undefined && paid !== undefined) {
      const wantBal = Math.max(0, agg - paid);
      const wantRef = Math.max(0, paid - agg);
      if (bal !== undefined && Math.abs(bal - wantBal) > TOL) err('PartB_TTI.TaxPaid.BalTaxPayable', `Part B-TTI Sl. 10 must equal Sl. 8 - Sl. 9e — expected ${wantBal}, found ${bal}`, 'A-629');
      if (refund !== undefined && Math.abs(refund - wantRef) > TOL) err('PartB_TTI.Refund.RefundDue', `Part B-TTI Sl. 11 must equal Sl. 9e - Sl. 8 — expected ${wantRef}, found ${refund}`, 'A-630');
    }
    // A-636: no interest u/s 234A/B/C when the tax payable on total income is nil.
    const taxOnTI = N('PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc');
    if (taxOnTI === 0) {
      for (const f of ['IntrstPayUs234A', 'IntrstPayUs234B', 'IntrstPayUs234C']) {
        const v = N('PartB_TTI.ComputationOfTaxLiability.IntrstPay.' + f);
        if (v !== undefined && v > 0) err('PartB_TTI.ComputationOfTaxLiability.IntrstPay.' + f, 'Interest u/s 234A/234B/234C must not be computed when the tax payable on total income is nil', 'A-636');
      }
    }
  }

  /* Table-driven arithmetic. */
  for (const q of SUMS) {
    const tv = num(V(q.b + q.t));
    if (tv === undefined) continue;
    let acc = 0; let ok = true;
    for (const p of q.a) { const x = num(V(q.b + p)); if (x === undefined) { ok = false; break; } acc += x; }
    if (ok && q.s) for (const p of q.s) { const x = num(V(q.b + p)); if (x === undefined) { ok = false; break; } acc -= x; }
    if (!ok) continue;
    if (Math.abs(acc - tv) > TOL) err(q.b + q.t, `${q.m} — expected ${acc}, found ${tv}`, q.r);
  }
  for (const q of ROWSUMS) {
    const tv = num(V(q.total));
    const arr = rows(V(q.arr));
    if (tv === undefined || arr.length === 0) continue;
    let acc = 0; let ok = true;
    for (const r of arr) { const x = num(r[q.f]); if (x === undefined) { ok = false; break; } acc += x; }
    if (ok && Math.abs(acc - tv) > TOL) err(q.total, `${q.m} — expected ${acc}, found ${tv}`, q.r);
  }
  for (const q of ROWCALCS) {
    rows(V(q.arr)).forEach((row, i) => {
      const tv = num(at(row, q.t));
      if (tv === undefined) return;
      let acc = 0; let ok = true;
      for (const p of q.a) { const x = num(at(row, p)); if (x === undefined) { ok = false; break; } acc += x; }
      if (ok && q.s) for (const p of q.s) { const x = num(at(row, p)); if (x === undefined) { ok = false; break; } acc -= x; }
      if (!ok) return;
      if (Math.abs(acc - tv) > TOL) err(`${q.arr}[${i}].${q.t}`, `${q.m} (row ${i + 1}) — expected ${acc}, found ${tv}`, q.r);
    });
  }
  for (const q of NOTGT) {
    const a = N(q.a);
    const b = N(q.b);
    if (a !== undefined && b !== undefined && a > b + TOL) err(q.a, `${q.m} (${a} > ${b})`, q.r);
  }
  for (const q of EQS) {
    const a = N(q.a);
    const b = N(q.b);
    if (a !== undefined && b !== undefined && Math.abs(a - b) > TOL) err(q.a, `${q.m} — expected ${b}, found ${a}`, q.r);
  }
  // A-68/69/97: per-row "sum must not exceed" checks that do not fit the tables above.
  rows(V('ITRScheduleI.ScheduleI')).forEach((row, i) => {
    const c7 = num(row['BalAvailApp']);
    const s89_10 = ['AmountAppliedDuringYear', 'AmountAppliedDuringYearOtherPurpose', 'AmountCreditedTrust'].map((f) => num(row[f]));
    if (c7 !== undefined && s89_10.every((v) => v !== undefined)) {
      const t = (s89_10 as number[]).reduce((x, y) => x + y, 0);
      if (t > c7 + TOL) err(`ITRScheduleI.ScheduleI[${i}].AmountAppliedDuringYear`, `Schedule I: the sum of columns (8+9+10) = ${t} must not be greater than column 7 = ${c7}`, 'A-68');
    }
    const c11 = num(row['BalanceAmount']);
    const s12_14 = ['AmountInvested', 'AmountInvestedInOtherMode', 'AmountNotUtilized'].map((f) => num(row[f]));
    if (c11 !== undefined && s12_14.every((v) => v !== undefined)) {
      const t = (s12_14 as number[]).reduce((x, y) => x + y, 0);
      if (t > c11 + TOL) err(`ITRScheduleI.ScheduleI[${i}].AmountInvested`, `Schedule I: the sum of columns (12+13+14) = ${t} must not be greater than column 11 = ${c11}`, 'A-69');
    }
  });
  rows(V('ITRScheduleJ.ScheduleJ_A1.ScheduleJ_A1Dtls')).forEach((row, i) => {
    const c7 = num(row['ClosingBlc']);
    const c8 = num(row['Investment_11_5']);
    const c9 = num(row['AmtTxdAssYr22_23']);
    if (c7 !== undefined && c8 !== undefined && c9 !== undefined && c8 + c9 > c7 + TOL) {
      err(`ITRScheduleJ.ScheduleJ_A1.ScheduleJ_A1Dtls[${i}].Investment_11_5`, `Schedule J: the sum of A1(8+9) = ${c8 + c9} must not be greater than A1(7) = ${c7}`, 'A-97');
    }
  });

  /* A-472/A-506/A-509/A-615: income vs tax consistency. */
  const gti = N('PartB_TI.TotalIncome') ?? N('PartB_TI2.GrossTotalIncome') ?? N('PartB_TI3.ComputationIncChargeable.TotalInc');
  const grossTax = N('PartB_TTI.ComputationOfTaxLiability.GrossTaxLiability');
  if (gti !== undefined && grossTax !== undefined) {
    if (gti === 0 && grossTax > 0) warn('PartB_TTI.ComputationOfTaxLiability.GrossTaxLiability', 'Gross total income and all heads of income are nil but a tax liability has been computed', 'A-472');
    if (gti > 0 && grossTax === 0) warn('PartB_TTI.ComputationOfTaxLiability.GrossTaxLiability', 'Income is entered in the return but no tax has been computed on it', 'A-506/550');
  }
  if (has('PartB_TI') && !has('ScheduleVC') && !has('ScheduleAI')) {
    warn('PartB_TI', 'Application/exemption is claimed in Part B1 without any income reported in Schedule VC or Schedule AI', 'A-509');
  }
  {
    const b3s1 = N('PartB_TI3.ComputationIncChargeable.TotIncPrevYr');
    if (b3s1 !== undefined && b3s1 > 0 && !has('ScheduleVC') && !has('ScheduleAI')) {
      err('PartB_TI3.ComputationIncChargeable.TotIncPrevYr', 'Part B3 Sl. 1 is greater than zero but neither Schedule VC nor Schedule AI is filled', 'A-615');
    }
    const vcTot = N('ScheduleVC.TotalContribution');
    const ai = N('ScheduleVC.Local.CorpusFundDonation');
    const bi = N('ScheduleVC.Foreign.CorpusFundDonation');
    const aiTot = N('ScheduleAI.TotalofAggregateIncomes');
    if (b3s1 !== undefined && vcTot !== undefined && ai !== undefined && bi !== undefined && aiTot !== undefined) {
      const floor = vcTot - ai - bi + aiTot;
      if (b3s1 + TOL < floor) err('PartB_TI3.ComputationIncChargeable.TotIncPrevYr', `Part B3 Sl. 1 (${b3s1}) must be at least (C-Ai-Bi) of Schedule VC plus Sl. 10 of Schedule AI (${floor})`, 'A-613');
    }
    const b3s2 = N('PartB_TI3.ComputationIncChargeable.TotExpIncur');
    const gRev = N('ScheduleA.TotAmountAllowedApplication.Revenue');
    if (b3s2 !== undefined && gRev !== undefined && b3s2 > gRev + TOL) {
      err('PartB_TI3.ComputationIncChargeable.TotExpIncur', `Part B3 Sl. 2 (${b3s2}) must not exceed Sl. G of the "Revenue" column of Schedule A (${gRev})`, 'A-614');
    }
  }
  // A-346: specified-business income requires the nature of the specified business.
  {
    const sb = N('CorpScheduleBP.IncSpecifiedBusiness.ProfitLossSpecifiedBusiness');
    if (sb !== undefined && sb !== 0 && rows(V('CorpScheduleBP.IncSpecifiedBusiness.DedUs35ADSubSec5Dtls')).length === 0
      && isEmpty(V('ScheduleOA.NatOfBus'))) {
      err('CorpScheduleBP.IncSpecifiedBusiness', 'Income/loss from a specified business is entered but the nature of the specified business is blank', 'A-346');
    }
  }
}
