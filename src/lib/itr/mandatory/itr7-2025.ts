/**
 * OFFICIAL mandatory-field validator — ITR-7, AY 2025-26.
 *
 * Sources (distilled at build time — the raw schema is NOT imported):
 *  - ITD JSON schema  "ITR-7_2025_Main_V1.1.json"  (payload root { ITR: { ITR7: ... } })
 *  - ITD "ITR 7 – Validation Rules for AY 2025-26" V1.0 — Category A rules
 *    (return will NOT be allowed to be uploaded) that are checkable on the JSON alone.
 *
 * Self-contained per the contract in ./types. Never throws on partial payloads.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr7';
const AY = '2025-26';
const SCHEMA_VERSION = 'ITR-7_2025_Main_V1.1';

/* ───────────────────────── Required tree (hard chain) ─────────────────────────
 * Every path below is required by an unbroken `required` chain from the ITR7
 * root: ITR.ITR7.{CreationInfo, Form_ITR7, PartA_GEN1, PartA_GEN2, PARTA_BS,
 * PartB_TTI, Verification} — 101 leaf paths, keyed by common prefix. */
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

/* Required scalars of OPTIONAL sections — checked only when the section object
 * is present in the JSON (schema `required` inside an optional container). */
const COND: Record<string, string[]> = {
  'ScheduleVC': [
    'Local.CorpusFundDonation', 'Local.GrantsReceivedFormGovt', 'Local.GrantsReceivedFromCompanie',
    'Local.OtherSpecificGrants', 'Local.OtherDonation', 'Local.TotalOtherThanCorpusFund', 'Local.VoluntaryContribution',
    'Foreign.CorpusFundDonation', 'Foreign.OtherThanCorpusFund', 'Foreign.ForeignContribution', 'TotalContribution',
  ],
  'ScheduleVC.AnonymousDonations': ['AggregateAnonymousDonations', 'TotalDonationsReceived', 'AnonymousDonations115BBC', 'AnonymousDonationsOthr115BBC'],
  'ScheduleIE_I': ['TotRcptVoluntaryContr', 'AppIncTwrdsObjInstn', 'AccmltnOfInc'],
  'ScheduleIE_II': ['TotRcptVoluntaryContr', 'AppIncTwrdsObjInstn', 'AccmltnOfInc', 'AnyIncomeTaxable'],
  'ScheduleIE_IV': ['SumGrossAnnualReceipts'],
  'ITRScheduleI': [
    'TotAmountAccumlated', 'TotAmountAppliedPreviousYear', 'TotBalanceAfterPY', 'TotAmountInvested',
    'TotAmtTxdErlAssYr', 'TotBalAvailApp', 'TotAmountAppliedDuringYear', 'TotAmountAppliedDuringYearOtherPurpose',
    'TotAmountCreditedTrust', 'TotBalanceAmount', 'TotAmountInvestedInOtherMode', 'TotAmountNotUtilized', 'TotAmountDeemedUs11',
  ],
  'Schedule115BBI': ['DeemedIncSec1023C_113', 'DeemedIncSec111B', 'IncDeemedSec131c', 'IncNotExemptSec131d', 'IncNotExcludedSec111c', 'IncAccInExcess', 'Total'],
  'ScheduleIT': ['TotalTaxPayments'],
  'ScheduleTDS2': ['TotalTDSonOthThanSals'],
  'ScheduleTDS3': ['TotalTDS3OnOthThanSal'],
  'ScheduleTCS': ['TotalSchTCS'],
  'PartB_TI': ['AggregateIncomeUs1112', 'TotalTI'],
  'ScheduleLA': ['TotVCReceived'],
  'ScheduleET': ['BooksOfAccMaintained', 'AccountsAudited'],
  'PartA_GEN1.FilingStatus.AssesseeRep': ['RepName', 'RepCapacity', 'RepAddress'],
};

/* Per-element required fields of repeating tables — checked for each row when
 * the array is present (nested rel-paths allowed, resolved via at()). */
const ARR: Array<{ arr: string; fields: string[]; row: string }> = [
  { arr: 'PartA_GEN1.ProjectOrInstDtls', fields: ['NameOfProjectOrInst', 'ActivityNature', 'ClassificationCode'], row: 'Project/Institution detail' },
  { arr: 'PartA_GEN1.RegApprUnderITADtls', fields: ['SectionRegistered', 'RegSecExmpClaimed', 'RegApprovalDate', 'ApprovalRegistrationNo', 'ApprovingAuthority'], row: 'Registration under Income-tax Act' },
  { arr: 'PartA_GEN1.RegApprUnderOthITADtls', fields: ['LawRegistered', 'RegApprDate', 'ApprovalRegistrationNo', 'ApprovingAuthority'], row: 'Registration under other law' },
  { arr: 'PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls', fields: ['NameOfFirm', 'PAN'], row: 'Partner-in-firm detail' },
  { arr: 'PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls', fields: ['NameOfCompany', 'CompanyType', 'OpngBalNumberOfShares', 'OpngBalCostOfAcquisition', 'ClsngBalNumberOfShares', 'ClsngBalCostOfAcquisition'], row: 'Unlisted equity shares detail' },
  { arr: 'PartA_GEN2.AuditDetails', fields: ['AuditedSection', 'AuditFlag'], row: 'Audit information' },
  { arr: 'PartA_GEN2.LiableAnyOthThnINTActDetails', fields: ['AuditedAct', 'AuditedSection', 'DateOfAudit'], row: 'Audit under other Act' },
  { arr: 'ITRScheduleI.ScheduleI', fields: ['AccumlatedYear', 'AmountAccumlated', 'AccumulationPurpose'], row: 'Schedule I row' },
  { arr: 'ScheduleIE_III.ScheduleIEIIIDtls', fields: ['ObjectiveOfInstitution', 'TotRcptVoluntaryContr', 'GovtGrants', 'AmountAppliedObj', 'BalanceAccumulated'], row: 'Schedule IE-3 row' },
  { arr: 'ScheduleIE_IV.ScheduleIEIVDtls', fields: ['ObjectiveOfInstitution', 'GrossAnnualReceipts', 'AmountAppliedObj', 'BalanceAccumulated'], row: 'Schedule IE-4 row' },
  { arr: 'ScheduleIT.TaxPayment', fields: ['BSRCode', 'DateDep', 'SrlNoOfChaln', 'Amt'], row: 'Tax payment challan' },
  { arr: 'ScheduleTDS2.TDSOthThanSalaryDtls', fields: ['TDSCreditName', 'TDSSection', 'TANOfDeductor'], row: 'TDS (Form 16A) row' },
  { arr: 'ScheduleTDS3.TDS3onOthThanSalDtls', fields: ['TDSCreditName', 'TDSSection', 'PANOfBuyerTenant'], row: 'TDS (Form 16B/16C) row' },
  { arr: 'ScheduleTCS.TCSDetails', fields: ['EmployerOrDeductorOrCollectDetl.TAN'], row: 'TCS row' },
  { arr: 'PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', fields: ['IFSCCode', 'BankName', 'BankAccountNo', 'AccountType', 'UseForRefund'], row: 'Bank account' },
];

/* ── Identity-critical enums / patterns (from the schema) ── */
const RX_PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const RX_PAN_IND = /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/; // Verification signatory PAN
const RX_DATE = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const RX_TAN = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
const CAPACITY = ['MD', 'DR', 'PO', 'CE', 'RE', 'OT'];
const STATUS = ['4', '5', '6', '7'];
const RET_SEC = ['139-4A', '139-4B', '139-4C', '139-4D'];
const EXEMPT_SECS = ['11', '13A', '13B', '21', '23A', '23B', '23CIIIAB', '23CIIIAC', '23CIIIAD', '23CIIIAE', '23CIV', '23CV', '23CVI', '23CVIA', '23D', '23DA', '23FB', '24', '26', '46A', '46B', '47', '23AAA', '23EC', '23ED', '23EE', '29A', '2135I'];

/* Exemption-section groupings used by the Category-A gating rules.
 * Codes are the schema enum for SecExemptionClaimed ('2135I' = 10(21) r/w 35(1),
 * '26' = 10(46) in the AY 2025-26 enum). */
const EX_11_23C = ['11', '23CIV', '23CV', '23CVI', '23CVIA'];
const EX_I_IA = [...EX_11_23C, '21', '2135I'];
const IE1SET = ['21', '2135I', '23AAA', '23B', '23D', '23DA', '23EC', '23ED', '23EE', '29A', '26', '46A', '46B', '47', '23FB'];
const IE2SET = ['23A', '24'];
const IE3SET = ['23CIIIAB', '23CIIIAC'];
const IE4SET = ['23CIIIAD', '23CIIIAE'];

/* Schedule may be FILLED only when the exemption section is in the allowed set. */
const GATE: Array<{ key: string; allowed: string[]; rule: string; name: string }> = [
  { key: 'ITRScheduleI', allowed: EX_I_IA, rule: 'A-57', name: 'Schedule I' },
  { key: 'ITRScheduleIA', allowed: EX_I_IA, rule: 'A-61', name: 'Schedule IA' },
  { key: 'ITRScheduleD', allowed: EX_11_23C, rule: 'A-64', name: 'Schedule D' },
  { key: 'ITRScheduleDA', allowed: EX_11_23C, rule: 'A-69', name: 'Schedule DA' },
  { key: 'ITRScheduleJ', allowed: EX_11_23C, rule: 'A-79', name: 'Schedule J' },
  { key: 'ITRScheduleR', allowed: EX_11_23C, rule: 'A-105', name: 'Schedule R' },
  { key: 'ScheduleAI', allowed: EX_11_23C, rule: 'A-125', name: 'Schedule AI' },
  { key: 'ScheduleA', allowed: EX_11_23C, rule: 'A-135', name: 'Schedule A' },
  { key: 'Schedule115TD', allowed: EX_11_23C, rule: 'A-457', name: 'Schedule 115TD' },
  { key: 'Schedule115BBI', allowed: EX_11_23C, rule: 'A-462', name: 'Schedule 115BBI' },
  { key: 'ScheduleLA', allowed: ['13A'], rule: 'A-106/111', name: 'Schedule LA' },
  { key: 'ScheduleET', allowed: ['13B'], rule: 'A-113/121', name: 'Schedule ET' },
  { key: 'ScheduleIE_I', allowed: IE1SET, rule: 'A-149', name: 'Schedule IE-1' },
  { key: 'ScheduleIE_II', allowed: IE2SET, rule: 'A-152', name: 'Schedule IE-2' },
  { key: 'ScheduleIE_III', allowed: IE3SET, rule: 'A-155', name: 'Schedule IE-3' },
  { key: 'ScheduleIE_IV', allowed: IE4SET, rule: 'A-161', name: 'Schedule IE-4' },
  { key: 'PartB_TI', allowed: EX_11_23C, rule: 'A-557', name: 'Part B-TI (Part B1)' },
  { key: 'PartB_TI2', allowed: ['13A', '13B', ...IE1SET, ...IE2SET, ...IE3SET, ...IE4SET], rule: 'A-564', name: 'Part B-TI (Part B2)' },
  { key: 'PartB_TI3', allowed: EX_11_23C, rule: 'A-592/599', name: 'Part B-TI (Part B3)' },
];

/* Schedule MUST be filled for the claimed exemption section. */
const MUST: Array<{ secs: string[]; keys: string[]; rule: string; what: string }> = [
  { secs: EX_11_23C, keys: ['ITRScheduleJ', 'ScheduleA', 'ScheduleAI', 'Schedule115BBI'], rule: 'A-46', what: 'Schedules J, A, AI and 115BBI' },
  { secs: ['13A'], keys: ['ScheduleLA'], rule: 'A-49/112', what: 'Schedule LA' },
  { secs: ['13B'], keys: ['ScheduleET'], rule: 'A-50/122', what: 'Schedule ET' },
  { secs: IE1SET, keys: ['ScheduleIE_I'], rule: 'A-150', what: 'Schedule IE-1' },
  { secs: IE2SET, keys: ['ScheduleIE_II'], rule: 'A-153', what: 'Schedule IE-2' },
  { secs: IE3SET, keys: ['ScheduleIE_III'], rule: 'A-158', what: 'Schedule IE-3' },
  { secs: IE4SET, keys: ['ScheduleIE_IV'], rule: 'A-162', what: 'Schedule IE-4' },
];

/* Exemption section ↔ registration section (Part A-GEN "Details of registration").
 * SectionRegistered codes: I=10(23AAA) II=10(23C)(iv) III=(v) IV=(vi) V=(via)
 * VI=12A/12AB VIII=13B IX=35. */
const REG_PAIRS: Array<{ reg: string; ex: string[]; fwd: string; rev: string; name: string }> = [
  { reg: 'VI', ex: ['11'], fwd: 'A-7/37', rev: 'A-6', name: '12A/12AB' },
  { reg: 'II', ex: ['23CIV'], fwd: 'A-9', rev: 'A-8', name: '10(23C)(iv)' },
  { reg: 'III', ex: ['23CV'], fwd: 'A-11', rev: 'A-10', name: '10(23C)(v)' },
  { reg: 'IV', ex: ['23CVI'], fwd: 'A-13', rev: 'A-12', name: '10(23C)(vi)' },
  { reg: 'V', ex: ['23CVIA'], fwd: 'A-15', rev: 'A-14', name: '10(23C)(via)' },
  { reg: 'I', ex: ['23AAA'], fwd: 'A-17', rev: 'A-16', name: '10(23AAA)' },
  { reg: 'VIII', ex: ['13B'], fwd: 'A-19', rev: 'A-18', name: '13B' },
  { reg: 'IX', ex: ['21', '2135I'], fwd: 'A-20/38', rev: 'A-21', name: '35 (for 10(21))' },
];

/* Return-furnished section → allowed exemption sections (rules A-24..A-27). */
const RET_SEC_ALLOWED: Record<string, { allowed: string[]; rule: string }> = {
  '139-4A': { allowed: ['11'], rule: 'A-24' },
  '139-4B': { allowed: ['13A', '13B'], rule: 'A-25' },
  '139-4C': { allowed: ['21', '23A', '23AAA', '23B', '23EC', '23ED', '23EE', '29A', '23CIIIAB', '23CIIIAC', '23CIIIAD', '23CIIIAE', '23D', '23DA', '23FB', '24', '26', '46A', '46B', '47', '23CIV', '23CV', '23CVI', '23CVIA'], rule: 'A-26' },
  '139-4D': { allowed: ['2135I'], rule: 'A-27' },
};

/* ───────────────────────────── label helpers ───────────────────────────── */

const LABELS: Record<string, string> = {
  'PAN': 'PAN of the assessee',
  'SurNameOrOrgName': 'Name of the trust/institution',
  'DateOFFormOrIncorp': 'Date of formation/incorporation',
  'StatusOrCompanyType': 'Status of the assessee',
  'ReturnFurnishedSec': 'Return furnished under section (139(4A)-(4D))',
  'SecExemptionClaimed': 'Section under which exemption is claimed',
  'IncomeTaxSec': 'Section under which the return is filed (139(1)/(4)/(5)…)',
  'ResidentialStatus': 'Residential status (RES/NRI)',
  'PartnerInFirmFlg': 'Whether partner in a firm (Y/N)',
  'HeldUnlistedEqShrPrYrFlg': 'Whether unlisted equity shares held during the year (Y/N)',
  'AsseseeRepFlg': 'Whether return is filed by a representative assessee (Y/N)',
  'LiableSec44ABflg': 'Whether liable for audit u/s 44AB (Y/N)',
  'LiableAnyOthThnINTActflg': 'Whether liable for audit under any other Act (Y/N)',
  'AssetOutsideIndiaFlg': 'Whether any asset is held outside India (Y/N)',
  'BankDtlsFlag': 'Bank account details flag (Y/N)',
  'AssesseeVerName': 'Name of the person verifying the return',
  'FatherName': "Father's name of the signatory",
  'AssesseeVerPAN': 'PAN of the signatory',
  'Capacity': 'Capacity of the signatory (MD/DR/PO/CE/RE/OT)',
  'Date': 'Date of verification',
  'Place': 'Place of verification',
  'ResidenceNo': 'Flat/Door/Building number',
  'LocalityOrArea': 'Locality/Area',
  'CityOrTownOrDistrict': 'City/Town/District',
  'StateCode': 'State code',
  'CountryCodeMobile': 'Mobile country code',
  'MobileNo': 'Mobile number',
  'EmailAddress': 'Email address',
  'FormName': 'Form name (must be "ITR-7")',
  'AssessmentYear': 'Assessment year (must be "2025")',
  'SchemaVer': 'Schema version (must be "Ver1.0")',
  'FormVer': 'Form version (must be "Ver1.0")',
  'JSONCreationDate': 'JSON creation date',
  'TotSourceFund': 'Total of sources of funds (Part A-BS, A4)',
  'TotalApplicationOfFunds': 'Total application of funds (Part A-BS, B5)',
  'TaxPayableOnTotInc': 'Tax payable on total income',
  'GrossTaxLiability': 'Gross tax liability',
  'NetTaxLiability': 'Net tax liability',
  'AggregateTaxInterestLiability': 'Aggregate tax and interest liability',
  'TotalTaxesPaid': 'Total taxes paid',
  'BalTaxPayable': 'Balance tax payable',
  'RefundDue': 'Refund due',
  'NetTaxPyblOn115TDInc': 'Net tax payable on 115TD accreted income',
  'TotalTI': 'Total income (Part B-TI)',
  'AggregateIncomeUs1112': 'Aggregate income (Part B-TI)',
};

function humanize(seg: string): string {
  if (LABELS[seg]) return LABELS[seg];
  return seg
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
}

const SECTION_HINTS: Record<string, string> = {
  'CreationInfo': 'Generated automatically when the JSON is exported',
  'Form_ITR7': 'Generated automatically when the JSON is exported',
  'PartA_GEN1': 'Part A-GEN: General information (1)',
  'PartA_GEN2': 'Part A-GEN: General information (2) — other details / audit',
  'PARTA_BS': 'Part A-BS: Balance Sheet as on 31 March 2025',
  'PartB_TI': 'Part B-TI: Statement of income (Part B1)',
  'PartB_TI2': 'Part B-TI: Statement of income (Part B2)',
  'PartB_TI3': 'Part B-TI: Statement of income (Part B3)',
  'PartB_TTI': 'Part B-TTI: Computation of tax liability',
  'Verification': 'Verification tab',
  'ScheduleIT': 'Tax Paid → Advance/Self-assessment tax (Schedule IT)',
  'ScheduleTDS2': 'Tax Paid → TDS as per Form 16A (Schedule TDS-2)',
  'ScheduleTDS3': 'Tax Paid → TDS as per Form 16B/16C (Schedule TDS-3)',
  'ScheduleTCS': 'Tax Paid → TCS (Schedule TCS)',
};

function hintFor(rel: string): string | undefined {
  const top = rel.split('.')[0].replace(/\[\d+\]$/, '');
  if (SECTION_HINTS[top]) return SECTION_HINTS[top];
  if (top.startsWith('ITRSchedule')) return 'Schedule ' + top.slice('ITRSchedule'.length);
  if (top.startsWith('Schedule')) return top.replace('Schedule', 'Schedule ').replace(/\s+/g, ' ').trim();
  return undefined;
}

/* ───────────────────────────── small utilities ───────────────────────────── */

const ROOT = 'ITR.ITR7.';

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ─────────────────────────────── the checker ─────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  try {
    run(json, missing, errors, warnings);
  } catch (e) {
    // Contract: never throw. Surface the internal failure as an error entry.
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
    missing.push({
      path: ROOT + rel,
      label: label ?? humanize(rel.split('.').pop() as string),
      hint: hintFor(rel),
    });
  };
  const err = (rel: string, msg: string, rule?: string): void => {
    errors.push({ path: ROOT + rel, msg, rule });
  };
  const warn = (rel: string, msg: string, rule?: string): void => {
    warnings.push({ path: ROOT + rel, msg, rule });
  };
  const V = (rel: string): unknown => at(itr7, rel);
  const has = (rel: string): boolean => !isEmpty(V(rel));

  if (itr7 == null || typeof itr7 !== 'object') {
    missing.push({ path: 'ITR.ITR7', label: 'ITR-7 payload (root object ITR.ITR7)', hint: 'Export the return JSON from the ITR-7 tool' });
    // Fall through: the full hard-required chain is still enumerated so the CA sees the scope.
  }

  /* 1 ── hard required chain */
  for (const prefix of Object.keys(HARD)) {
    for (const leaf of HARD[prefix]) {
      const rel = `${prefix}.${leaf}`;
      if (isEmpty(V(rel))) miss(rel);
    }
  }

  /* 2 ── required scalars inside optional-but-present sections */
  for (const sec of Object.keys(COND)) {
    if (isEmpty(V(sec))) continue;
    for (const leaf of COND[sec]) {
      const rel = `${sec}.${leaf}`;
      if (isEmpty(V(rel))) miss(rel, `${humanize(leaf.split('.').pop() as string)} (${sec.split('.').pop()})`);
    }
  }

  /* 3 ── per-row required fields of repeating tables */
  for (const t of ARR) {
    const arr = V(t.arr);
    if (!Array.isArray(arr)) continue;
    arr.forEach((row, i) => {
      for (const f of t.fields) {
        if (isEmpty(at(row, f))) {
          miss(`${t.arr}[${i}].${f}`, `${humanize(f.split('.').pop() as string)} — ${t.row} #${i + 1}`);
        }
      }
    });
  }

  /* 4 ── identity-critical values (schema enums/patterns) */
  const fixed: Array<[string, string, string]> = [
    ['Form_ITR7.FormName', 'ITR-7', 'Form name must be "ITR-7"'],
    ['Form_ITR7.AssessmentYear', '2025', 'Assessment year must be "2025" for AY 2025-26'],
    ['Form_ITR7.SchemaVer', 'Ver1.0', 'Schema version must be "Ver1.0"'],
    ['Form_ITR7.FormVer', 'Ver1.0', 'Form version must be "Ver1.0"'],
  ];
  for (const [rel, want, msg] of fixed) {
    const v = str(V(rel));
    if (v !== undefined && v !== want) err(rel, `${msg} (found "${v}")`, 'SCHEMA');
  }
  const pan = str(V('PartA_GEN1.OrgFirmInfo.PAN'));
  if (pan !== undefined && !RX_PAN.test(pan)) err('PartA_GEN1.OrgFirmInfo.PAN', `PAN "${pan}" is not a valid PAN (AAAAA9999A)`, 'SCHEMA');
  const vpan = str(V('Verification.Declaration.AssesseeVerPAN'));
  if (vpan !== undefined && !RX_PAN_IND.test(vpan)) err('Verification.Declaration.AssesseeVerPAN', `Signatory PAN "${vpan}" must be an individual PAN (4th character "P")`, 'SCHEMA');
  const vdate = str(V('Verification.Date'));
  if (vdate !== undefined && !RX_DATE.test(vdate)) err('Verification.Date', `Verification date "${vdate}" must be YYYY-MM-DD`, 'SCHEMA');
  const cap = str(V('Verification.Declaration.Capacity'));
  if (cap !== undefined && !CAPACITY.includes(cap)) err('Verification.Declaration.Capacity', `Capacity "${cap}" must be one of ${CAPACITY.join('/')}`, 'SCHEMA');
  const status = str(V('PartA_GEN1.OrgFirmInfo.StatusOrCompanyType'));
  if (status !== undefined && !STATUS.includes(status)) err('PartA_GEN1.OrgFirmInfo.StatusOrCompanyType', `Status "${status}" must be one of ${STATUS.join('/')}`, 'SCHEMA');
  const retSec = str(V('PartA_GEN1.OrgFirmInfo.ReturnFurnishedSec'));
  if (retSec !== undefined && !RET_SEC.includes(retSec)) err('PartA_GEN1.OrgFirmInfo.ReturnFurnishedSec', `Return furnished section "${retSec}" must be one of ${RET_SEC.join('/')}`, 'SCHEMA');
  const exSec = str(V('PartA_GEN1.OrgFirmInfo.SecExemptionClaimed'));
  if (exSec !== undefined && !EXEMPT_SECS.includes(exSec)) err('PartA_GEN1.OrgFirmInfo.SecExemptionClaimed', `Exemption section code "${exSec}" is not in the schema enum`, 'SCHEMA');

  /* 5 ── Category-A rules checkable on the JSON alone */

  // A-2: Indian mobile numbers must be exactly 10 digits.
  const cc = str(V('PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobile'));
  const mob = str(V('PartA_GEN1.OrgFirmInfo.Address.MobileNo'));
  if (cc === '91' && mob !== undefined && !/^[1-9][0-9]{9}$/.test(mob)) {
    err('PartA_GEN1.OrgFirmInfo.Address.MobileNo', 'Mobile number must be exactly 10 digits when country code is India (91)', 'A-2');
  }

  // A-3: AOP status → sub-status restricted to 5i/5v/5vii.
  const sub = str(V('PartA_GEN1.OrgFirmInfo.SubStatus'));
  if (status === '5' && sub !== undefined && !['5i', '5v', '5vii'].includes(sub)) {
    err('PartA_GEN1.OrgFirmInfo.SubStatus', 'For status AOP, sub-status must be Society (5i), Public Charitable Trust (5v) or Any other AOP/BOI (5vii)', 'A-3');
  }

  const regRows: Array<Record<string, unknown>> = Array.isArray(V('PartA_GEN1.RegApprUnderITADtls'))
    ? (V('PartA_GEN1.RegApprUnderITADtls') as Array<Record<string, unknown>>)
    : [];
  const regSecs = regRows.map((r) => str(r['SectionRegistered'])).filter((s): s is string => s !== undefined);
  const incDate = str(V('PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp'));
  const today = todayISO();

  // A-33: 12A/12AB or 10(23C)(iv)-(via) registered → sub-status cannot be "Any other AOP/BOI".
  if (sub === '5vii' && regSecs.some((s) => ['VI', 'II', 'III', 'IV', 'V'].includes(s))) {
    err('PartA_GEN1.OrgFirmInfo.SubStatus', 'Registered u/s 12A/12AB or approved u/s 10(23C)(iv)-(via): sub-status cannot be "Any other AOP/BOI"', 'A-33');
  }
  // A-34 / A-35: political party (13A) / electoral trust (13B) cannot be a public charitable trust.
  if (exSec === '13A' && sub === '5v') err('PartA_GEN1.OrgFirmInfo.SubStatus', 'Political party claiming 13A: sub-status cannot be Public Charitable Trust', 'A-34');
  if (exSec === '13B' && sub === '5v') err('PartA_GEN1.OrgFirmInfo.SubStatus', 'Electoral trust claiming 13B: sub-status cannot be Public Charitable Trust', 'A-35');

  // A-4/5 and A-42/43: registration dates vs filing date / incorporation date.
  regRows.forEach((r, i) => {
    const pairs: Array<[string, string, string]> = [
      ['RegApprovalDate', 'A-4', 'A-5'],
      ['EffectiveDate', 'A-42', 'A-43'],
    ];
    for (const [f, ruleAfter, ruleBefore] of pairs) {
      const d = str(r[f]);
      if (d === undefined || !RX_DATE.test(d)) continue;
      if (d > today) err(`PartA_GEN1.RegApprUnderITADtls[${i}].${f}`, `${humanize(f)} cannot be after the date of filing`, ruleAfter);
      if (incDate !== undefined && RX_DATE.test(incDate) && d < incDate) err(`PartA_GEN1.RegApprUnderITADtls[${i}].${f}`, `${humanize(f)} cannot be earlier than the date of formation/incorporation`, ruleBefore);
    }
  });
  const othRows: Array<Record<string, unknown>> = Array.isArray(V('PartA_GEN1.RegApprUnderOthITADtls'))
    ? (V('PartA_GEN1.RegApprUnderOthITADtls') as Array<Record<string, unknown>>)
    : [];
  othRows.forEach((r, i) => {
    const d = str(r['RegApprDate']);
    if (d === undefined || !RX_DATE.test(d)) return;
    if (d > today) err(`PartA_GEN1.RegApprUnderOthITADtls[${i}].RegApprDate`, 'Registration date under other law must be before the date of filing', 'A-22/44');
    if (incDate !== undefined && RX_DATE.test(incDate) && d < incDate) err(`PartA_GEN1.RegApprUnderOthITADtls[${i}].RegApprDate`, 'Registration date under other law cannot be earlier than the date of formation/incorporation', 'A-23/45');
  });

  // A-6..A-21, A-37, A-38: exemption section ↔ registration details, both directions.
  if (exSec !== undefined) {
    for (const p of REG_PAIRS) {
      const regPresent = regSecs.includes(p.reg);
      const exSelected = p.ex.includes(exSec);
      if (exSelected && !regPresent) {
        err('PartA_GEN1.RegApprUnderITADtls', `Exemption claimed u/s code ${p.ex.join('/')} but no ${p.name} registration/approval row is furnished under "Details of registration or approval under the Income-tax Act"`, p.fwd);
      }
      if (regPresent && !exSelected) {
        err('PartA_GEN1.OrgFirmInfo.SecExemptionClaimed', `Registration/approval u/s ${p.name} is furnished but the corresponding section is not selected under "section under which exemption is claimed"`, p.rev);
      }
    }
  }

  // A-24..A-27: return-furnished section vs exemption section.
  if (retSec !== undefined && exSec !== undefined && RET_SEC_ALLOWED[retSec] !== undefined) {
    const g = RET_SEC_ALLOWED[retSec];
    if (!g.allowed.includes(exSec)) {
      err('PartA_GEN1.OrgFirmInfo.SecExemptionClaimed', `Return furnished u/s ${retSec} but exemption section "${exSec}" is not permitted for that filing section`, g.rule);
    }
  }

  // A-46 etc.: schedules that MUST be present for the claimed exemption.
  if (exSec !== undefined) {
    for (const m of MUST) {
      if (!m.secs.includes(exSec)) continue;
      for (const key of m.keys) {
        if (isEmpty(V(key))) err(key, `${m.what} must be filled when exemption is claimed u/s code "${exSec}" — ${key} is empty`, m.rule);
      }
    }
    // Gating: schedules that may only be filled for certain exemption sections.
    for (const g of GATE) {
      if (has(g.key) && !g.allowed.includes(exSec)) {
        err(g.key, `${g.name} can be filled only when the exemption section is one of: ${g.allowed.join(', ')} (selected: "${exSec}")`, g.rule);
      }
    }
  }

  // A-598: statement of income — at least one of Part B1/B2/B3 of Part B-TI.
  if (!has('PartB_TI') && !has('PartB_TI2') && !has('PartB_TI3')) {
    err('PartB_TI', 'The return cannot be filed without the Statement of Income (Part B1, B2 or B3 of Part B-TI)', 'A-598');
  }

  // A-156/157: IE-3 / IE-4 objective must match the 10(23C) sub-clause claimed.
  const ieRows = (key: string, listKey: string): Array<Record<string, unknown>> =>
    Array.isArray(V(`${key}.${listKey}`)) ? (V(`${key}.${listKey}`) as Array<Record<string, unknown>>) : [];
  if (exSec === '23CIIIAB' || exSec === '23CIIIAD') {
    const rows = [...ieRows('ScheduleIE_III', 'ScheduleIEIIIDtls'), ...ieRows('ScheduleIE_IV', 'ScheduleIEIVDtls')];
    if (rows.length > 0 && !rows.some((r) => str(r['ObjectiveOfInstitution']) === 'EDU')) {
      err('ScheduleIE_III', 'Exemption u/s 10(23C)(iiiab)/(iiiad) requires objective "Education" (EDU) in Schedule IE-3/IE-4', 'A-156');
    }
  }
  if (exSec === '23CIIIAC' || exSec === '23CIIIAE') {
    const rows = [...ieRows('ScheduleIE_III', 'ScheduleIEIIIDtls'), ...ieRows('ScheduleIE_IV', 'ScheduleIEIVDtls')];
    if (rows.length > 0 && !rows.some((r) => str(r['ObjectiveOfInstitution']) === 'MED')) {
      err('ScheduleIE_III', 'Exemption u/s 10(23C)(iiiac)/(iiiae) requires objective "Medical" (MED) in Schedule IE-3/IE-4', 'A-157');
    }
  }

  // A-159: IE-3 government grants must exceed 50% of total receipts (else ITR-7 not applicable).
  ieRows('ScheduleIE_III', 'ScheduleIEIIIDtls').forEach((r, i) => {
    const tot = num(r['TotRcptVoluntaryContr']);
    const grants = num(r['GovtGrants']);
    if (tot !== undefined && grants !== undefined && tot > 0 && grants * 2 <= tot) {
      err(`ScheduleIE_III.ScheduleIEIIIDtls[${i}].GovtGrants`, 'Government grants are 50% or less of total receipts — exemption u/s 10(23C)(iiiab)/(iiiac) is not available; a form other than ITR-7 applies', 'A-159');
    }
  });
  // A-163: IE-4 aggregate gross receipts must not exceed Rs. 5 crore.
  {
    const sum = num(V('ScheduleIE_IV.SumGrossAnnualReceipts'));
    if (sum !== undefined && sum > 50000000) {
      err('ScheduleIE_IV.SumGrossAnnualReceipts', 'Aggregate gross annual receipts exceed Rs. 5 crore — exemption u/s 10(23C)(iiiad)/(iiiae) is not available; a form other than ITR-7 applies', 'A-163');
    }
  }
  // A-567: exemption amounts at 2d/2e of Part B2 capped at Rs. 5 crore.
  if (exSec === '23CIIIAD' || exSec === '23CIIIAE') {
    for (const f of ['ExemptionUs10_23Ciiiad', 'ExemptionUs10_23Ciiiae']) {
      const v = num(V(`PartB_TI2.${f}`));
      if (v !== undefined && v > 50000000) {
        err(`PartB_TI2.${f}`, 'Exemption u/s 10(23C)(iiiad)/(iiiae) cannot exceed Rs. 5 crore', 'A-567');
      }
    }
  }

  // A-475: unlisted equity shares flag Y → details required.
  if (str(V('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg')) === 'Y'
    && !has('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls')) {
    err('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr', 'Unlisted-equity-shares flag is "Y" but the share details table is empty', 'A-475');
  }
  // Schema-conditional: representative assessee / partner-in-firm flags.
  if (str(V('PartA_GEN1.FilingStatus.AsseseeRepFlg')) === 'Y' && !has('PartA_GEN1.FilingStatus.AssesseeRep')) {
    miss('PartA_GEN1.FilingStatus.AssesseeRep', 'Representative assessee details (flag is "Y")');
  }
  if (str(V('PartA_GEN1.FilingStatus.PartnerInFirmFlg')) === 'Y' && !has('PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls')) {
    miss('PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls', 'Details of firms in which assessee is a partner (flag is "Y")');
  }
  // Schema-conditional: bank details flag Y → at least one bank account.
  if (str(V('PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag')) === 'Y'
    && !has('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails')) {
    miss('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', 'At least one bank account (bank details flag is "Y")');
  }

  // A-108 / A-52: audit information completeness and dates.
  const audRows: Array<Record<string, unknown>> = Array.isArray(V('PartA_GEN2.AuditDetails'))
    ? (V('PartA_GEN2.AuditDetails') as Array<Record<string, unknown>>)
    : [];
  audRows.forEach((r, i) => {
    if (str(r['AuditFlag']) === 'Y') {
      for (const f of ['AuditorName', 'AuditorMemNo', 'AudFrmName', 'AudFrmPAN', 'AuditDate', 'AuditReportFurnishDate']) {
        if (isEmpty(r[f])) {
          err(`PartA_GEN2.AuditDetails[${i}].${f}`, `Accounts audited: ${humanize(f)} must be furnished in the audit information`, 'A-108');
        }
      }
    }
    for (const f of ['DateOfAudit', 'AuditDate', 'AuditReportFurnishDate']) {
      const d = str(r[f]);
      if (d !== undefined && RX_DATE.test(d) && d < '2025-04-01') {
        err(`PartA_GEN2.AuditDetails[${i}].${f}`, `${humanize(f)} cannot be prior to 01-04-2025`, 'A-52');
      }
    }
  });

  // A-28/29: GPU u/s 2(15) → trade-activity percentage and aggregate receipts.
  if (str(V('PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.CharitablePurposeOfGeneralPublic')) === 'Y') {
    const base = 'PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15';
    if (isEmpty(V(`${base}.PercntNatureOfTrade`)) && isEmpty(V(`${base}.PercntAnyTrade`))) {
      err(`${base}.PercntNatureOfTrade`, 'GPU u/s 2(15): percentage of receipts from trade/commerce activity vis-a-vis total receipts must be furnished', 'A-28');
    }
    if (isEmpty(V(`${base}.AggAnnualRecptsofInst`))) {
      err(`${base}.AggAnnualRecptsofInst`, 'GPU u/s 2(15): amount of annual aggregate receipts from such activities must be furnished', 'A-29');
    }
  }

  // A-110: Schedule LA — ECI recognition date. A-114: Schedule ET audit date.
  if (str(V('ScheduleLA.RecognizedByECI')) === 'Y' && isEmpty(V('ScheduleLA.DateOfRecognition'))) {
    err('ScheduleLA.DateOfRecognition', 'Recognized by the Election Commission of India but date of recognition is not provided', 'A-110');
  }
  {
    const d = str(V('ScheduleET.AuditReportDate'));
    if (d !== undefined && RX_DATE.test(d) && d < '2025-04-01') {
      err('ScheduleET.AuditReportDate', 'Schedule ET: date of audit cannot be prior to 01-04-2025', 'A-114');
    }
  }

  /* 6 ── Category-A arithmetic consistency (tolerance ±1) */
  const sumEq = (totRel: string, parts: string[], rule: string, what: string, minus: string[] = []): void => {
    const tot = num(V(totRel));
    if (tot === undefined) return;
    let s = 0;
    for (const p of parts) {
      const v = num(V(p));
      if (v === undefined) return; // component missing — reported by the required-tree walk
      s += v;
    }
    for (const p of minus) {
      const v = num(V(p));
      if (v === undefined) return;
      s -= v;
    }
    if (Math.abs(tot - s) > 1) {
      err(totRel, `${what}: expected ${s}, found ${tot}`, rule);
    }
  };
  const BS = 'PARTA_BS.';
  const OF = BS + 'SourcesOfFund.OwnFund.';
  sumEq(OF + 'TotalFund', [OF + 'Corpus80G', OF + 'OtherCorpus', OF + 'AccumulatedInc', OF + 'AccumulatedIncUS10_11', OF + 'BalDeemedInc', OF + 'TotalOtherReserve'], 'A-85', 'Part A-BS: Total fund must equal the sum of own-fund components');
  const LB = BS + 'SourcesOfFund.LongTermBorrowings.';
  sumEq(LB + 'TotalLoanFund', [LB + 'SecuredLoan', LB + 'UnSecuredLoan'], 'A-86', 'Part A-BS: Total loan funds must equal secured + unsecured loans');
  sumEq(BS + 'SourcesOfFund.TotSourceFund', [OF + 'TotalFund', LB + 'TotalLoanFund', BS + 'SourcesOfFund.Advances'], 'A-87', 'Part A-BS: Sources of funds (A4) must equal total fund + loan funds + advances');
  const FA = BS + 'ApplicationOfFunds.FixedAsset.';
  sumEq(FA + 'NetBlock', [FA + 'GrossBlock'], 'A-88', 'Part A-BS: Net block must equal gross block less depreciation', [FA + 'Depreciation']);
  const CA = BS + 'ApplicationOfFunds.CurrentAssetsLoanAdv.';
  const CE = CA + 'CurrentAssets.CashNCashEquivalents.';
  sumEq(CE + 'TotCashNCashEquivalents', [CE + 'BalWithBanks', CE + 'CashInHand', CE + 'Others'], 'A-89', 'Part A-BS: Total cash & equivalents must equal bank + cash + others');
  sumEq(CA + 'CurrentAssets.TotCurrAssets', [CA + 'CurrentAssets.Inventory', CA + 'CurrentAssets.SundryDebtor', CE + 'TotCashNCashEquivalents', CA + 'CurrentAssets.OtherCurrAssets'], 'A-90', 'Part A-BS: Total current assets must equal the sum of its components');
  sumEq(CA + 'Total', [CA + 'CurrentAssets.TotCurrAssets', CA + 'LoansandAdvances'], 'A-91', 'Part A-BS: Current assets + loans & advances total mismatch');
  const CL = CA + 'CurrLiabilitiesProviosions.';
  sumEq(CL + 'CurrLiability.TotalCurrLiabilitiesProviosions', [CL + 'CurrLiability.SundryCreditor', CL + 'CurrLiability.OtherPayable'], 'A-92', 'Part A-BS: Total current liabilities must equal sundry creditors + other payables');
  sumEq(CL + 'TotCurrLiabilitiesandprovisions', [CL + 'CurrLiability.TotalCurrLiabilitiesProviosions', CL + 'Provisions'], 'A-93', 'Part A-BS: Current liabilities & provisions total mismatch');
  sumEq(CA + 'NetCurrAssets', [CA + 'Total'], 'A-94', 'Part A-BS: Net current assets must equal total less current liabilities & provisions', [CL + 'TotCurrLiabilitiesandprovisions']);
  sumEq(BS + 'ApplicationOfFunds.TotalApplicationOfFunds', [BS + 'SourcesOfFund.TotSourceFund'], 'A-96', 'Part A-BS: Application of funds (B5) must equal sources of funds (A4)');

  // Schedule VC internal totals.
  if (has('ScheduleVC')) {
    sumEq('ScheduleVC.Local.CorpusFundDonation', ['ScheduleVC.Local.CorpusFundDonationUS80G2b', 'ScheduleVC.Local.CorpusFundDonationOther80G2b'], 'A-143', 'Schedule VC: domestic corpus donation (Ai) must equal its 80G(2)(b) + other split');
    sumEq('ScheduleVC.Local.VoluntaryContribution', ['ScheduleVC.Local.CorpusFundDonation', 'ScheduleVC.Local.TotalOtherThanCorpusFund'], 'A-138', 'Schedule VC: domestic voluntary contribution (Aiii) must equal Ai + Aiie');
    sumEq('ScheduleVC.Foreign.CorpusFundDonation', ['ScheduleVC.Foreign.CorpusFundDonationUS80G2b', 'ScheduleVC.Foreign.CorpusFundDonationOther80G2b'], 'A-144', 'Schedule VC: foreign corpus donation (Bi) must equal its 80G(2)(b) + other split');
    sumEq('ScheduleVC.Foreign.ForeignContribution', ['ScheduleVC.Foreign.CorpusFundDonation', 'ScheduleVC.Foreign.OtherThanCorpusFund'], 'A-139', 'Schedule VC: foreign contribution (Biii) must equal Bi + Bii');
    sumEq('ScheduleVC.TotalContribution', ['ScheduleVC.Local.VoluntaryContribution', 'ScheduleVC.Foreign.ForeignContribution'], 'A-140', 'Schedule VC: total contributions (C) must equal Aiii + Biii');
  }

  // Part B-TTI computation chain.
  const TP = 'PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.';
  const CT = 'PartB_TTI.ComputationOfTaxLiability.';
  sumEq(TP + 'TaxPayableOnTotInc', [TP + 'TaxAtNormalRates', TP + 'TaxAtSpecialRates', TP + 'DonationUs115BC', TP + 'TaxAtMarginalRate', TP + 'TaxIncChargUs115BBI'], 'A-516', 'Part B-TTI: tax payable on total income (1g) must equal 1a+1b+1c+1d+1e-1f', [TP + 'RebateOnAgricultureInc']);
  sumEq(CT + 'TotalSurcharge', [CT + 'Surcharge25ofSI', CT + 'SurchargeOnTaxPayable'], 'A-518', 'Part B-TTI: total surcharge must equal 2(i) + 2(ii)');
  sumEq(CT + 'GrossTaxLiability', [TP + 'TaxPayableOnTotInc', CT + 'TotalSurcharge', CT + 'EducationCess'], 'A-519', 'Part B-TTI: gross tax liability must equal 1g + 2iii + 3');
  sumEq(CT + 'TaxRelief.TotTaxRelief', [CT + 'TaxRelief.Section90', CT + 'TaxRelief.Section91'], 'A-522', 'Part B-TTI: total tax relief must equal section 90/90A + section 91');
  sumEq(CT + 'NetTaxLiability', [CT + 'GrossTaxLiability'], 'A-523', 'Part B-TTI: net tax liability must equal gross tax liability less total relief', [CT + 'TaxRelief.TotTaxRelief']);
  const IP = CT + 'IntrstPay.';
  sumEq(IP + 'TotalIntrstPay', [IP + 'IntrstPayUs234A', IP + 'IntrstPayUs234B', IP + 'IntrstPayUs234C', IP + 'LateFilingFee234F'], 'A-524', 'Part B-TTI: total interest & fee must equal 234A+234B+234C+234F');
  sumEq(CT + 'AggregateTaxInterestLiability', [CT + 'NetTaxLiability', IP + 'TotalIntrstPay'], 'A-525', 'Part B-TTI: aggregate liability must equal net tax liability + total interest');
  const XP = 'PartB_TTI.TaxPaid.TaxesPaid.';
  sumEq(XP + 'TotalTaxesPaid', [XP + 'AdvanceTax', XP + 'TDS', XP + 'TCS', XP + 'SelfAssessmentTax'], 'A-526', 'Part B-TTI: total taxes paid must equal advance tax + TDS + TCS + self-assessment tax');
  {
    const agg = num(V(CT + 'AggregateTaxInterestLiability'));
    const paid = num(V(XP + 'TotalTaxesPaid'));
    const bal = num(V('PartB_TTI.TaxPaid.BalTaxPayable'));
    const refund = num(V('PartB_TTI.Refund.RefundDue'));
    if (agg !== undefined && paid !== undefined) {
      if (agg > paid && bal !== undefined && Math.abs(bal - (agg - paid)) > 1) {
        err('PartB_TTI.TaxPaid.BalTaxPayable', `Balance tax payable must equal aggregate liability minus taxes paid (expected ${agg - paid}, found ${bal})`, 'A-527');
      }
      if (paid > agg && refund !== undefined && refund !== 0 && Math.abs(refund - (paid - agg)) > 1) {
        err('PartB_TTI.Refund.RefundDue', `Refund must equal taxes paid minus aggregate liability (expected ${paid - agg}, found ${refund})`, 'A-528');
      }
    }
  }

  // A-539: no 234A/B/C interest when tax payable on total income is zero.
  {
    const tax = num(V(TP + 'TaxPayableOnTotInc'));
    if (tax === 0) {
      for (const f of ['IntrstPayUs234A', 'IntrstPayUs234B', 'IntrstPayUs234C']) {
        const v = num(V(IP + f));
        if (v !== undefined && v > 0) {
          err(IP + f, `Interest u/s ${f.slice(-4)} cannot be computed when tax payable on total income is zero`, 'A-539');
        }
      }
    }
  }

  // A-652: Schedule IT total = sum of challan amounts.
  {
    const rows = V('ScheduleIT.TaxPayment');
    const tot = num(V('ScheduleIT.TotalTaxPayments'));
    if (Array.isArray(rows) && tot !== undefined) {
      let s = 0;
      let all = true;
      for (const r of rows) {
        const v = num(at(r, 'Amt'));
        if (v === undefined) { all = false; break; }
        s += v;
      }
      if (all && Math.abs(tot - s) > 1) {
        err('ScheduleIT.TotalTaxPayments', `Schedule IT: total tax payments must equal the sum of challan amounts (expected ${s}, found ${tot})`, 'A-652');
      }
    }
  }

  // A-460: Schedule 115BBI total.
  if (has('Schedule115BBI')) {
    sumEq('Schedule115BBI.Total', ['Schedule115BBI.DeemedIncSec1023C_113', 'Schedule115BBI.DeemedIncSec111B', 'Schedule115BBI.IncDeemedSec131c', 'Schedule115BBI.IncNotExemptSec131d', 'Schedule115BBI.IncNotExcludedSec111c', 'Schedule115BBI.IncAccInExcess'], 'A-460', 'Schedule 115BBI: total must equal the sum of Sl. No. 1 to 6');
  }

  // A-164: Schedule IE-4 aggregate = sum of row gross receipts.
  {
    const rows = ieRows('ScheduleIE_IV', 'ScheduleIEIVDtls');
    const tot = num(V('ScheduleIE_IV.SumGrossAnnualReceipts'));
    if (rows.length > 0 && tot !== undefined) {
      let s = 0;
      let all = true;
      for (const r of rows) {
        const v = num(r['GrossAnnualReceipts']);
        if (v === undefined) { all = false; break; }
        s += v;
      }
      if (all && Math.abs(tot - s) > 1) {
        err('ScheduleIE_IV.SumGrossAnnualReceipts', `Schedule IE-4: sum of gross annual receipts must equal the row total (expected ${s}, found ${tot})`, 'A-164');
      }
    }
  }

  /* 7 ── softer findings (warnings) */
  // A-532: nil income but taxes computed/paid.
  {
    const ti = num(V('PartB_TI.TotalTI'));
    const tax = num(V(TP + 'TaxPayableOnTotInc'));
    if (ti === 0 && tax !== undefined && tax > 0) {
      warn(TP + 'TaxPayableOnTotInc', 'Total income is nil but tax liability has been computed — verify the computation', 'A-532');
    }
  }
  // A-173: TAN structure (first alphabets are further validated against the city-code list by CPC).
  const tanCheck = (arrRel: string, field: string): void => {
    const rows = V(arrRel);
    if (!Array.isArray(rows)) return;
    rows.forEach((r, i) => {
      const t = str(at(r, field));
      if (t !== undefined && t !== '' && !RX_TAN.test(t)) {
        warn(`${arrRel}[${i}].${field}`, `TAN "${t}" does not match the TAN format (AAAA99999A)`, 'A-173');
      }
    });
  };
  tanCheck('ScheduleTDS2.TDSOthThanSalaryDtls', 'TANOfDeductor');
  tanCheck('ScheduleTCS.TCSDetails', 'EmployerOrDeductorOrCollectDetl.TAN');
  // A-47: exemption u/s 11/10(23C)(iv)-(via) requires filing within the 139(1)/(4)/(5) time limit.
  if (exSec !== undefined && EX_11_23C.includes(exSec)) {
    const rf = num(V('PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec'));
    if (rf !== undefined && ![11, 12, 17].includes(rf)) {
      warn('PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec', 'Exemption u/s 11/10(23C)(iv)-(via) requires the return to be filed within the time allowed u/s 139(1)/(4)/(5) — verify the filing section', 'A-47');
    }
  }
}

export default checkMandatory;
