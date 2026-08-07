/**
 * OFFICIAL mandatory-field validator — ITR-4 (Sugam), AY 2025-26.
 *
 * Sources (distilled, NOT imported):
 *  - ITD JSON schema "ITR-4_2025_Main_V1.3_0.json" (payload SchemaVer "Ver1.0")
 *    → embedded required-property tree below (root chain ITR → ITR4 → …).
 *  - "ITR 4 – Validation Rules for AY 2025-26 V1.1" (10 Jul 2025) — Category A
 *    rules checkable on the exported JSON alone are encoded in checkRules().
 *
 * The exported payload root is { ITR: { ITR4: {...} } }. This module never
 * throws: any unexpected shape simply yields missing[] entries.
 */

import type {
  MandatoryChecker,
  MandatoryReport,
  MissingField,
  MandatoryIssue,
} from './types';
import { at, isEmpty } from './types';

const FORM = 'itr4';
const AY = '2025-26';
const SCHEMA_VERSION = 'ITR-4_2025_Main_V1.3 (SchemaVer Ver1.0)';

/* ── tiny local helpers ────────────────────────────────────────────────────── */

type Obj = Record<string, unknown>;

function obj(v: unknown): Obj | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function num(v: unknown): number {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
/** exact integer-sum mismatch (schema amounts are integers) */
function ne(a: number, b: number): boolean {
  return Math.round(a) !== Math.round(b);
}

/* ── SECTION 1: schema-required tree (root chain — always mandatory) ──────────
 * Distilled from the official schema's recursive required chains starting at
 * definitions.ITR (required: ITR4) → definitions.ITR4 (required: CreationInfo,
 * Form_ITR4, PersonalInfo, FilingStatus, IncomeDeductions, TaxComputation,
 * TaxPaid, Refund, Verification). Paths are relative to ITR.ITR4.
 * Format: [relative path, CA-readable label, optional UI hint]. */

type ReqLeaf = [string, string, string?];

const H_GEN = 'Part A — General Information';
const H_INC = 'Part B — Income Details';
const H_VIA = 'Part C — Deductions (Chapter VI-A)';
const H_TAX = 'Part D — Tax Computation';
const H_TP = 'Tax Details / Taxes Paid';
const H_VER = 'Verification';

const REQ_ALWAYS: ReqLeaf[] = [
  // CreationInfo (utility metadata — schema-required)
  ['CreationInfo.SWVersionNo', 'Software version number (CreationInfo)'],
  ['CreationInfo.SWCreatedBy', 'Software id "SWxxxxxxxx" that created the return (CreationInfo)'],
  ['CreationInfo.JSONCreatedBy', 'Software id "SWxxxxxxxx" that created the JSON (CreationInfo)'],
  ['CreationInfo.JSONCreationDate', 'JSON creation date (YYYY-MM-DD)'],
  ['CreationInfo.IntermediaryCity', 'Intermediary city (CreationInfo)'],
  ['CreationInfo.Digest', 'Digest hash (CreationInfo; "-" when not applicable)'],
  // Form_ITR4 (form identity)
  ['Form_ITR4.FormName', 'Form name — must be "ITR-4"'],
  ['Form_ITR4.Description', 'Form description (Form_ITR4)'],
  ['Form_ITR4.AssessmentYear', 'Assessment year — must be "2025"'],
  ['Form_ITR4.SchemaVer', 'Schema version — must be "Ver1.0"'],
  ['Form_ITR4.FormVer', 'Form version — must be "Ver1.0"'],
  // PersonalInfo
  ['PersonalInfo.AssesseeName.SurNameOrOrgName', 'Surname / organisation name of the assessee', H_GEN],
  ['PersonalInfo.PAN', 'PAN of the assessee', H_GEN],
  ['PersonalInfo.Address.ResidenceNo', 'Address — flat / door / building number', H_GEN],
  ['PersonalInfo.Address.LocalityOrArea', 'Address — locality or area', H_GEN],
  ['PersonalInfo.Address.CityOrTownOrDistrict', 'Address — city / town / district', H_GEN],
  ['PersonalInfo.Address.StateCode', 'Address — state code', H_GEN],
  ['PersonalInfo.Address.CountryCode', 'Address — country code', H_GEN],
  ['PersonalInfo.Address.CountryCodeMobile', 'Mobile — country code (91 for India)', H_GEN],
  ['PersonalInfo.Address.MobileNo', 'Mobile number of the assessee', H_GEN],
  ['PersonalInfo.Address.EmailAddress', 'E-mail address of the assessee', H_GEN],
  ['PersonalInfo.DOB', 'Date of birth / formation (YYYY-MM-DD)', H_GEN],
  ['PersonalInfo.EmployerCategory', 'Nature of employment / employer category', H_GEN],
  ['PersonalInfo.Status', 'Status (I: Individual, H: HUF, F: Firm other than LLP)', H_GEN],
  // FilingStatus
  ['FilingStatus.ReturnFileSec', 'Section under which the return is filed (139(1)/139(4)/139(5)…)', H_GEN],
  ['FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25', 'A23 — opted out of new tax regime in Form 10-IEA in AY 2024-25? (Y/N/NA)', H_GEN],
  ['FilingStatus.AsseseeRepFlg', 'Is the return being filed by a representative assessee? (Y/N)', H_GEN],
  ['FilingStatus.ItrFilingDueDate', 'Due date of filing u/s 139(1) — "2025-07-31"', H_GEN],
  // IncomeDeductions (Part B — Gross Total Income)
  ['IncomeDeductions.IncomeFromBusinessProf', 'B1 — Income from business & profession (presumptive)', H_INC],
  ['IncomeDeductions.GrossSalary', 'B2(iii) — Gross salary', H_INC],
  ['IncomeDeductions.IncomeNotified89A', 'B2 — Income from retirement benefit account (notified country u/s 89A)', H_INC],
  ['IncomeDeductions.NetSalary', 'B2 — Net salary', H_INC],
  ['IncomeDeductions.DeductionUs16', 'B2(iv) — Deductions u/s 16', H_INC],
  ['IncomeDeductions.IncomeFromSal', 'B2(v) — Income chargeable under Salaries', H_INC],
  ['IncomeDeductions.AnnualValue', 'B3(iii) — Annual value of house property', H_INC],
  ['IncomeDeductions.AnnualValue30Percent', 'B3(iv) — 30% standard deduction on annual value', H_INC],
  ['IncomeDeductions.TotalIncomeOfHP', 'B3 — Income chargeable under House Property', H_INC],
  ['IncomeDeductions.IncomeOthSrc', 'B4 — Income from other sources', H_INC],
  ['IncomeDeductions.GrossTotIncome', 'B5 — Gross total income (excluding LTCG u/s 112A)', H_INC],
  ['IncomeDeductions.GrossTotIncomeIncLTCG112A', 'B5 — Gross total income including LTCG u/s 112A', H_INC],
  ['IncomeDeductions.TotalIncome', 'B6 — Total income', H_INC],
  // Chapter VI-A — user-entered and system-computed blocks (all schema-required)
  ['IncomeDeductions.UsrDeductUndChapVIA.TotalChapVIADeductions', 'Total Chapter VI-A deductions (as entered)', H_VIA],
  ['IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions', 'Total Chapter VI-A deductions (as computed)', H_VIA],
  // TaxComputation
  ['TaxComputation.TotalTaxPayable', 'D1 — Tax payable on total income', H_TAX],
  ['TaxComputation.Rebate87A', 'D2 — Rebate u/s 87A', H_TAX],
  ['TaxComputation.TaxPayableOnRebate', 'D3 — Tax payable after rebate', H_TAX],
  ['TaxComputation.EducationCess', 'D4 — Health & education cess', H_TAX],
  ['TaxComputation.GrossTaxLiability', 'D5 — Total tax and cess', H_TAX],
  ['TaxComputation.NetTaxLiability', 'D7 — Balance tax after relief', H_TAX],
  ['TaxComputation.IntrstPay.IntrstPayUs234A', 'D8 — Interest u/s 234A', H_TAX],
  ['TaxComputation.IntrstPay.IntrstPayUs234B', 'D8 — Interest u/s 234B', H_TAX],
  ['TaxComputation.IntrstPay.IntrstPayUs234C', 'D8 — Interest u/s 234C', H_TAX],
  ['TaxComputation.IntrstPay.LateFilingFee234F', 'D9 — Late filing fee u/s 234F', H_TAX],
  ['TaxComputation.TotTaxPlusIntrstPay', 'D10 — Total tax, fee and interest', H_TAX],
  // TaxPaid
  ['TaxPaid.TaxesPaid.AdvanceTax', 'D11 — Total advance tax paid', H_TP],
  ['TaxPaid.TaxesPaid.TDS', 'D12 — Total TDS claimed', H_TP],
  ['TaxPaid.TaxesPaid.TCS', 'D13 — Total TCS claimed', H_TP],
  ['TaxPaid.TaxesPaid.SelfAssessmentTax', 'D14 — Total self-assessment tax paid', H_TP],
  ['TaxPaid.TaxesPaid.TotalTaxesPaid', 'D15 — Total taxes paid', H_TP],
  ['TaxPaid.BalTaxPayable', 'D16 — Balance tax payable', H_TP],
  // Refund
  ['Refund.RefundDue', 'D17 — Refund due', H_TP],
  // Verification
  ['Verification.Declaration.AssesseeVerName', 'Verification — name of the person verifying the return', H_VER],
  ['Verification.Declaration.FatherName', "Verification — father's name of the verifier", H_VER],
  ['Verification.Declaration.AssesseeVerPAN', 'Verification — PAN of the verifier', H_VER],
  ['Verification.Capacity', 'Verification — capacity (S: Self, R: Representative, K: Karta, P: Partner)', H_VER],
  ['Verification.Place', 'Verification — place', H_VER],
];

/** Chapter VI-A per-section scalars — required inside both the user-entered and
 *  computed blocks by the schema. Enumerated once, expanded for both blocks. */
const VIA_FIELDS = [
  'Section80C', 'Section80CCC', 'Section80CCDEmployeeOrSE', 'Section80CCD1B',
  'Section80CCDEmployer', 'Section80D', 'Section80DD', 'Section80DDB',
  'Section80E', 'Section80G', 'Section80GG', 'Section80GGC', 'Section80U',
  'Section80TTA', 'Section80TTB', 'AnyOthSec80CCH',
] as const;

/* ── SECTION 2: conditionally-present objects — schema-required fields that are
 * checked only when the parent object/array exists in the payload. ─────────── */

/** [parent rel-path, [field rel-path, label][], hint] */
const REQ_IF_PRESENT: Array<[string, Array<[string, string]>, string?]> = [
  ['PartA_139_8A', [
    ['PAN', 'Part A 139(8A) — PAN'],
    ['Name', 'Part A 139(8A) — name'],
    ['AssessmentYear', 'Part A 139(8A) — assessment year'],
    ['PreviouslyFiledForThisAY', 'Part A 139(8A) — previously filed for this AY? (Y/N)'],
    ['LaidOutIn_139_8A', 'Part A 139(8A) — eligible conditions laid out in 139(8A)? (Y/N)'],
    ['ITRFormUpdatingInc', 'Part A 139(8A) — ITR form used for updating income'],
    ['UpdatedReturnDuringPeriod', 'Part A 139(8A) — period of the updated return'],
  ], 'Updated return (139(8A)) block'],
  ['PartB-ATI', [
    ['UpdatedTotInc', 'Part B-ATI — updated total income'],
    ['AmtPayable', 'Part B-ATI — amount payable'],
    ['FeeIncUS234F', 'Part B-ATI — fee u/s 234F'],
    ['AggrLiabilityRefund', 'Part B-ATI — aggregate liability (with refund)'],
    ['AggrLiabilityNoRefund', 'Part B-ATI — aggregate liability (without refund)'],
    ['AddtnlIncTax', 'Part B-ATI — additional income-tax'],
    ['NetPayable', 'Part B-ATI — net amount payable'],
    ['TaxUS140B', 'Part B-ATI — tax paid u/s 140B'],
    ['TaxDue10_11', 'Part B-ATI — tax due'],
    ['ReleifUS89', 'Part B-ATI — relief u/s 89'],
  ], 'Updated return (139(8A)) tax block'],
  ['FilingStatus.AssesseeRep', [
    ['RepName', 'Representative assessee — name'],
    ['RepCapacity', 'Representative assessee — capacity (L/M/G/O)'],
    ['RepAddress', 'Representative assessee — address'],
    ['RepPAN', 'Representative assessee — PAN'],
  ], H_GEN],
  ['ScheduleBP.PersumptiveInc44AD', [
    ['GrsTotalTrnOver', 'E1 — Gross turnover / gross receipts u/s 44AD'],
    ['TotPersumptiveInc44AD', 'E4 — Total presumptive income u/s 44AD'],
  ], 'Schedule BP — 44AD'],
  ['ScheduleBP.PersumptiveInc44ADA', [
    ['GrsReceipt', 'E3 — Gross receipts u/s 44ADA'],
    ['TotPersumptiveInc44ADA', 'E6 — Total presumptive income u/s 44ADA'],
  ], 'Schedule BP — 44ADA'],
  ['ScheduleBP.PersumptiveInc44AE', [
    ['TotPersumInc44AE', 'E5 — Presumptive income from goods carriage u/s 44AE'],
    ['TotalPersumptiveInc', 'Schedule BP — total presumptive income u/s 44AE'],
    ['IncChargeableUnderBus', 'Schedule BP — income chargeable under business u/s 44AE'],
  ], 'Schedule BP — 44AE'],
  ['Schedule80G', [
    ['TotalDonationsUs80GCash', 'Schedule 80G — total donations in cash'],
    ['TotalDonationsUs80GOtherMode', 'Schedule 80G — total donations in other mode'],
    ['TotalDonationsUs80G', 'Schedule 80G — total donations'],
    ['TotalEligibleDonationsUs80G', 'Schedule 80G — total eligible donations'],
  ], 'Schedule 80G'],
  ['Schedule80GGC', [
    ['TotalDonationAmtCash80GGC', 'Schedule 80GGC — total donation in cash'],
    ['TotalDonationAmtOtherMode80GGC', 'Schedule 80GGC — total donation in other mode'],
    ['TotalDonationsUs80GGC', 'Schedule 80GGC — total donations'],
    ['TotalEligibleDonationAmt80GGC', 'Schedule 80GGC — eligible amount of donation'],
  ], 'Schedule 80GGC'],
  ['Schedule80DD', [
    ['NatureOfDisability', 'Schedule 80DD — nature of disability'],
    ['TypeOfDisability', 'Schedule 80DD — type of disability'],
    ['DeductionAmount', 'Schedule 80DD — deduction amount'],
    ['DependentType', 'Schedule 80DD — type of dependent'],
  ], 'Schedule 80DD'],
  ['Schedule80U', [
    ['NatureOfDisability', 'Schedule 80U — nature of disability'],
    ['TypeOfDisability', 'Schedule 80U — type of disability'],
    ['DeductionAmount', 'Schedule 80U — deduction amount'],
  ], 'Schedule 80U'],
  ['Schedule80E', [
    ['Schedule80EDtls', 'Schedule 80E — loan details'],
    ['TotalInterest80E', 'Schedule 80E — total interest u/s 80E'],
  ], 'Schedule 80E'],
  ['Schedule80EE', [
    ['Schedule80EEDtls', 'Schedule 80EE — loan details'],
    ['TotalInterest80EE', 'Schedule 80EE — total interest u/s 80EE'],
  ], 'Schedule 80EE'],
  ['Schedule80EEA', [
    ['PropStmpDtyVal', 'Schedule 80EEA — stamp duty value of the property'],
    ['Schedule80EEADtls', 'Schedule 80EEA — loan details'],
    ['TotalInterest80EEA', 'Schedule 80EEA — total interest u/s 80EEA'],
  ], 'Schedule 80EEA'],
  ['Schedule80EEB', [
    ['Schedule80EEBDtls', 'Schedule 80EEB — loan details'],
    ['TotalInterest80EEB', 'Schedule 80EEB — total interest u/s 80EEB'],
  ], 'Schedule 80EEB'],
  ['Schedule80C', [
    ['Schedule80CDtls', 'Schedule 80C — payment details'],
    ['TotalAmt', 'Schedule 80C — total amount'],
  ], 'Schedule 80C'],
  ['ScheduleUs24B', [
    ['ScheduleUs24BDtls', 'Schedule 24(b) — loan details'],
    ['TotalInterestUs24B', 'Schedule 24(b) — total interest u/s 24(b)'],
  ], 'Schedule Interest u/s 24(b)'],
  ['ScheduleEA10_13A', [
    ['Placeofwork', 'Schedule 10(13A) — place of work (metro/non-metro)'],
    ['ActlHRARecv', 'Schedule 10(13A) — actual HRA received'],
    ['ActlRentPaid', 'Schedule 10(13A) — actual rent paid'],
    ['DtlsSalUsSec171', 'Schedule 10(13A) — salary u/s 17(1)'],
    ['BasicSalary', 'Schedule 10(13A) — basic salary'],
    ['ActlRentPaid10Per', 'Schedule 10(13A) — rent paid minus 10% of salary'],
    ['Sal40Or50Per', 'Schedule 10(13A) — 40%/50% of salary'],
    ['EligbleExmpAllwncUs13A', 'Schedule 10(13A) — eligible exempt allowance u/s 10(13A)'],
  ], 'Schedule HRA 10(13A)'],
  ['LTCG112A', [
    ['TotSaleCnsdrn', 'LTCG 112A — total sale consideration'],
    ['TotCstAcqisn', 'LTCG 112A — total cost of acquisition'],
    ['LongCap112A', 'LTCG 112A — long-term capital gain u/s 112A'],
  ], 'Schedule LTCG u/s 112A'],
  ['TaxReturnPreparer', [
    ['IdentificationNoOfTRP', 'TRP — identification number'],
    ['NameOfTRP', 'TRP — name'],
  ], H_VER],
  ['ScheduleIT', [['TotalTaxPayments', 'Schedule IT — total tax payments']], H_TP],
  ['ScheduleTCS', [['TotalSchTCS', 'Schedule TCS — total TCS claimed']], H_TP],
  ['TDSonSalaries', [['TotalTDSonSalaries', 'Schedule TDS1 — total TDS on salaries']], H_TP],
  ['TDSonOthThanSals', [['TotalTDSonOthThanSals', 'Schedule TDS2 — total TDS other than salary']], H_TP],
  ['ScheduleTDS3Dtls', [['TotalTDS3Details', 'Schedule TDS3 — total TDS on rent 194-IB']], H_TP],
  ['IncomeDeductions.AllwncExemptUs10', [
    ['TotalAllwncExemptUs10', 'B2(ii) — total allowances exempt u/s 10'],
  ], H_INC],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth', [
    ['EligibleAmountOfDedn', 'Schedule 80D sl.3 — eligible amount of deduction'],
  ], 'Schedule 80D'],
  ['PartA_139_8A.Applicable_139_8A', [
    ['AcknowledgementNo', 'Part A 139(8A) — acknowledgement number of the earlier return'],
    ['OrigRetFiledDate', 'Part A 139(8A) — date of filing of the earlier return'],
  ], 'Updated return (139(8A)) block'],
  ['TaxExmpIntIncDtls.OthersInc', [
    ['OthersTotalTaxExe', 'Schedule EI — total exempt income'],
  ], 'Exempt income (Schedule EI)'],
  ['PartA_139_8A.RetrntoRedCarriedFL', [
    ['UnabsorbedDepreciation', 'Part A 139(8A) — return filed to reduce carried-forward loss / unabsorbed depreciation? (Y/N)'],
  ], 'Updated return (139(8A)) block'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamHIDtls', [
    ['TotalPayments', 'Schedule 80D sl.1a — total premium paid'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamSrCtznHIDtls', [
    ['TotalPayments', 'Schedule 80D sl.1b — total premium paid'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsHIDtls', [
    ['TotalPayments', 'Schedule 80D sl.2a — total premium paid'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsSrCtznHIDtls', [
    ['TotalPayments', 'Schedule 80D sl.2b — total premium paid'],
  ], 'Schedule 80D'],
];

/** Bank/loan row fields shared by the 80E, 80EE, 80EEA, 80EEB and 24(b) schedules
 *  (schema: every one of these detail arrays requires the same six fields plus
 *  its own interest field). Rules A-299, A-305, A-306, A-308, A-311. */
const LOAN_ROW_REQ: Array<[string, string]> = [
  ['LoanTknFrom', 'loan taken from (B: bank / I: institution)'],
  ['BankOrInstnName', 'name of the bank / institution'],
  ['LoanAccNoOfBankOrInstnRefNo', 'loan account number / reference number'],
  ['DateofLoan', 'date of sanction of the loan'],
  ['TotalLoanAmt', 'total loan amount'],
  ['LoanOutstndngAmt', 'loan outstanding as on 31 March'],
];

/** 80D health-insurance policy blocks: [block key, sl.no. label]. */
const D80_BLOCKS: Array<[string, string, string, string, string]> = [
  // [block, amount field, premium field, preventive-checkup field, medical-expense field]
  ['Sec80DSelfFamHIDtls', 'SelfAndFamily', 'HealthInsPremSlfFam', 'PrevHlthChckUpSlfFam', ''],
  ['Sec80DSelfFamSrCtznHIDtls', 'SelfAndFamilySeniorCitizen', 'HlthInsPremSlfFamSrCtzn', 'PrevHlthChckUpSlfFamSrCtzn', 'MedicalExpSlfFamSrCtzn'],
  ['Sec80DParentsHIDtls', 'Parents', 'HlthInsPremParents', 'PrevHlthChckUpParents', ''],
  ['Sec80DParentsSrCtznHIDtls', 'ParentsSeniorCitizen', 'HlthInsPremParentsSrCtzn', 'PrevHlthChckUpParentsSrCtzn', 'MedicalExpParentsSrCtzn'],
];

/** Per-array-item schema-required fields — checked for every element present.
 *  [array rel-path, [item field, label][], hint] */
const REQ_ARRAY_ITEMS: Array<[string, Array<[string, string]>, string?]> = [
  ['ScheduleBP.NatOfBus44AD', [
    ['NameOfBusiness', 'name of business (44AD)'],
    ['CodeAD', 'business code u/s 44AD'],
  ], 'Schedule BP — 44AD'],
  ['ScheduleBP.NatOfBus44ADA', [
    ['NameOfBusiness', 'name of profession (44ADA)'],
    ['CodeADA', 'profession code u/s 44ADA'],
  ], 'Schedule BP — 44ADA'],
  ['ScheduleBP.NatOfBus44AE', [
    ['NameOfBusiness', 'name of business (44AE)'],
    ['CodeAE', 'business code u/s 44AE'],
  ], 'Schedule BP — 44AE'],
  ['ScheduleBP.GoodsDtlsUs44AE', [
    ['RegNumberGoodsCarriage', 'registration number of goods carriage'],
    ['OwnedLeasedHiredFlag', 'owned / leased / hired flag'],
    ['TonnageCapacity', 'tonnage capacity (MT)'],
    ['HoldingPeriod', 'number of months held'],
    ['PresumptiveIncome', 'presumptive income per goods carriage'],
  ], 'Schedule BP — 44AE goods carriages'],
  ['ScheduleBP.TurnoverGrsRcptForGSTIN', [
    ['GSTINNo', 'GSTIN number'],
    ['AmtTurnGrossRcptGSTIN', 'turnover / gross receipt as per GSTIN'],
  ], 'Schedule BP — GSTIN turnover'],
  ['ScheduleIT.TaxPayment', [
    ['BSRCode', 'BSR code of the bank'],
    ['DateDep', 'date of deposit'],
    ['SrlNoOfChaln', 'challan serial number'],
    ['Amt', 'tax paid amount'],
  ], 'Schedule IT — advance / self-assessment tax'],
  ['ScheduleTCS.TCS', [
    ['EmployerOrDeductorOrCollectDetl', 'collector TAN & name'],
    ['Amtfrom26AS', 'amount as per 26AS'],
    ['TotalTCS', 'total tax collected'],
    ['AmtTCSClaimedThisYear', 'TCS claimed this year'],
  ], 'Schedule TCS'],
  ['TDSonSalaries.TDSonSalary', [
    ['EmployerOrDeductorOrCollectDetl', 'employer TAN & name'],
    ['IncChrgSal', 'income chargeable under salaries'],
    ['TotalTDSSal', 'total TDS deducted on salary'],
  ], 'Schedule TDS1 — salary'],
  ['TDSonOthThanSals.TDSonOthThanSalDtls', [
    ['TANOfDeductor', 'TAN of the deductor'],
    ['TDSSection', 'section under which TDS deducted'],
    ['TDSClaimed', 'TDS claimed this year'],
    ['TDSCreditCarriedFwd', 'TDS credit carried forward'],
  ], 'Schedule TDS2 — other than salary'],
  ['ScheduleTDS3Dtls.TDS3Details', [
    ['PANofTenant', 'PAN of the tenant / buyer'],
    ['TDSSection', 'section under which TDS deducted'],
    ['TDSClaimed', 'TDS claimed this year'],
    ['TDSCreditCarriedFwd', 'TDS credit carried forward'],
  ], 'Schedule TDS3 — rent / 194-IB'],
  ['Refund.BankAccountDtls.AddtnlBankDetails', [
    ['IFSCCode', 'IFSC code of the bank'],
    ['BankName', 'bank name'],
    ['BankAccountNo', 'bank account number'],
    ['AccountType', 'account type'],
    ['UseForRefund', 'use this account for refund? (true/false)'],
  ], 'Bank account details'],
  ['Schedule80C.Schedule80CDtls', [
    ['IdentificationNo', 'policy / document identification number (80C)'],
    ['Amount', 'amount of payment (80C)'],
  ], 'Schedule 80C'],
  ['Schedule80GGC.Schedule80GGCDetails', [
    ['DonationDate', 'date of donation (80GGC)'],
    ['DonationAmtCash', 'donation in cash (80GGC)'],
    ['DonationAmtOtherMode', 'donation in other mode (80GGC)'],
    ['DonationAmt', 'total donation (80GGC)'],
    ['EligibleDonationAmt', 'eligible amount of donation (80GGC)'],
  ], 'Schedule 80GGC'],
  ['IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', [
    ['SalNatureDesc', 'nature of exempt allowance u/s 10'],
    ['SalOthAmount', 'amount of exempt allowance u/s 10'],
  ], H_INC],
  ['IncomeDeductions.OthersInc.OthersIncDtlsOthSrc', [
    ['OthSrcNatureDesc', 'nature of other-source income'],
    ['OthSrcOthAmount', 'amount of other-source income'],
  ], H_INC],
  ['TaxExmpIntIncDtls.OthersInc.OthersIncDtls', [
    ['NatureDesc', 'nature of exempt income'],
    ['OthAmount', 'amount of exempt income'],
  ], 'Exempt income (Schedule EI)'],
  // loan schedules — same six bank fields plus the section's own interest field
  ['Schedule80E.Schedule80EDtls', [...LOAN_ROW_REQ, ['Interest80E', 'interest paid u/s 80E']], 'Schedule 80E'],
  ['Schedule80EE.Schedule80EEDtls', [...LOAN_ROW_REQ, ['Interest80EE', 'interest paid u/s 80EE']], 'Schedule 80EE'],
  ['Schedule80EEA.Schedule80EEADtls', [...LOAN_ROW_REQ, ['Interest80EEA', 'interest paid u/s 80EEA']], 'Schedule 80EEA'],
  ['Schedule80EEB.Schedule80EEBDtls', [...LOAN_ROW_REQ, ['VehicleRegNo', 'vehicle registration number'], ['Interest80EEB', 'interest paid u/s 80EEB']], 'Schedule 80EEB'],
  ['ScheduleUs24B.ScheduleUs24BDtls', [...LOAN_ROW_REQ, ['InterestUs24B', 'interest paid u/s 24(b)']], 'Schedule Interest u/s 24(b)'],
  // 80D policy rows (rules 337-340)
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamHIDtls.Sch80DInsDtls', [
    ['InsurerName', 'name of the insurer (80D sl.1a)'],
    ['PolicyNo', 'policy number (80D sl.1a)'],
    ['HealthInsAmt', 'premium paid (80D sl.1a)'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamSrCtznHIDtls.Sch80DInsDtls', [
    ['InsurerName', 'name of the insurer (80D sl.1b)'],
    ['PolicyNo', 'policy number (80D sl.1b)'],
    ['HealthInsAmt', 'premium paid (80D sl.1b)'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsHIDtls.Sch80DInsDtls', [
    ['InsurerName', 'name of the insurer (80D sl.2a)'],
    ['PolicyNo', 'policy number (80D sl.2a)'],
    ['HealthInsAmt', 'premium paid (80D sl.2a)'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsSrCtznHIDtls.Sch80DInsDtls', [
    ['InsurerName', 'name of the insurer (80D sl.2b)'],
    ['PolicyNo', 'policy number (80D sl.2b)'],
    ['HealthInsAmt', 'premium paid (80D sl.2b)'],
  ], 'Schedule 80D'],
  ['IncomeDeductions.IncomeNotified89AType', [
    ['NOT89ACountrycode', 'country code (retirement benefit account u/s 89A)'],
    ['NOT89AAmount', 'amount (retirement benefit account u/s 89A)'],
  ], H_INC],
  ['FilingStatus.clauseiv7provisio139iDtls', [
    ['clauseiv7provisio139iNature', 'nature — clause (iv) of the 7th proviso to 139(1)'],
    ['clauseiv7provisio139iAmount', 'amount — clause (iv) of the 7th proviso to 139(1)'],
  ], H_GEN],
];

/** 80G donee rows live under four tables, each an object holding DoneeWithPan[]. */
const G80_TABLES: Array<[string, string]> = [
  ['Don100Percent', 'Schedule 80G table A (100% without qualifying limit)'],
  ['Don50PercentNoApprReqd', 'Schedule 80G table B (50% without qualifying limit)'],
  ['Don100PercentApprReqd', 'Schedule 80G table C (100% subject to qualifying limit)'],
  ['Don50PercentApprReqd', 'Schedule 80G table D (50% subject to qualifying limit)'],
];
const G80_DONEE_REQ: Array<[string, string]> = [
  ['DoneeWithPanName', 'name of donee'],
  ['DoneePAN', 'PAN of donee'],
  ['DonationAmt', 'total donation'],
  ['EligibleDonationAmt', 'eligible donation amount'],
  ['AddressDetail.AddrDetail', 'address of donee'],
  ['AddressDetail.CityOrTownOrDistrict', 'city / town of donee'],
  ['AddressDetail.StateCode', 'state code of donee'],
  ['AddressDetail.PinCode', 'pincode of donee'],
];

/* ── SECTION 3: identity patterns (schema enums/patterns for critical fields) ── */

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const DATE_RE = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const RETURN_FILE_SEC = [11, 12, 13, 14, 16, 17, 18, 20, 21];

/* ── the checker ──────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  try {
    runChecks(json, missing, errors, warnings);
  } catch {
    // contract: never throw — surface as a generic error instead
    errors.push({
      path: 'ITR.ITR4',
      msg: 'Internal validation error while checking the return JSON — please review the payload structure.',
    });
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

function runChecks(
  json: unknown,
  missing: MissingField[],
  errors: MandatoryIssue[],
  warnings: MandatoryIssue[],
): void {
  const P = 'ITR.ITR4.';
  const root = obj(at(json, 'ITR.ITR4'));

  const miss = (relPath: string, label: string, hint?: string) => {
    missing.push(hint ? { path: P + relPath, label, hint } : { path: P + relPath, label });
  };
  const err = (relPath: string, msg: string, rule?: string) => {
    errors.push(rule ? { path: P + relPath, msg, rule } : { path: P + relPath, msg });
  };
  const warn = (relPath: string, msg: string, rule?: string) => {
    warnings.push(rule ? { path: P + relPath, msg, rule } : { path: P + relPath, msg });
  };
  const v = (relPath: string): unknown => (root ? at(root, relPath) : undefined);

  if (!root) {
    missing.push({
      path: 'ITR.ITR4',
      label: 'ITR-4 return data — the JSON must contain the object { ITR: { ITR4: {…} } }',
    });
  }

  /* 1 ── always-required leaves (schema root required chain) */
  for (const [rel, label, hint] of REQ_ALWAYS) {
    if (isEmpty(v(rel))) miss(rel, label, hint);
  }
  for (const f of VIA_FIELDS) {
    if (isEmpty(v(`IncomeDeductions.UsrDeductUndChapVIA.${f}`))) {
      miss(`IncomeDeductions.UsrDeductUndChapVIA.${f}`, `Chapter VI-A (entered) — ${f.replace('Section', 'Section ')} amount`, H_VIA);
    }
    if (isEmpty(v(`IncomeDeductions.DeductUndChapVIA.${f}`))) {
      miss(`IncomeDeductions.DeductUndChapVIA.${f}`, `Chapter VI-A (computed) — ${f.replace('Section', 'Section ')} amount`, H_VIA);
    }
  }
  // Refund.BankAccountDtls is schema-required (object) and at least one bank
  // account is needed for the return to be accepted.
  if (!obj(v('Refund.BankAccountDtls'))) {
    miss('Refund.BankAccountDtls', 'Bank account details block (at least one bank account of the assessee)', H_TP);
  } else if (arr(v('Refund.BankAccountDtls.AddtnlBankDetails')).length === 0) {
    miss('Refund.BankAccountDtls.AddtnlBankDetails', 'At least one bank account (IFSC, bank name, account number)', H_TP);
  }

  /* 2 ── conditionally-present objects: schema-required fields inside them */
  for (const [parent, fields, hint] of REQ_IF_PRESENT) {
    if (!obj(v(parent))) continue;
    for (const [f, label] of fields) {
      if (isEmpty(v(`${parent}.${f}`))) miss(`${parent}.${f}`, label, hint);
    }
  }

  /* 3 ── array items: schema-required fields per element */
  for (const [arrRel, fields, hint] of REQ_ARRAY_ITEMS) {
    const items = arr(v(arrRel));
    items.forEach((item, i) => {
      const o = obj(item);
      for (const [f, label] of fields) {
        const val = o ? at(o, f) : undefined;
        if (isEmpty(val)) miss(`${arrRel}[${i}].${f}`, `Row ${i + 1}: ${label}`, hint);
      }
    });
  }
  // TCS / TDS1 rows: TAN + name inside the nested collector/employer object
  for (const [arrRel, hint] of [
    ['ScheduleTCS.TCS', 'Schedule TCS'],
    ['TDSonSalaries.TDSonSalary', 'Schedule TDS1 — salary'],
  ] as const) {
    arr(v(arrRel)).forEach((item, i) => {
      const d = obj(obj(item)?.['EmployerOrDeductorOrCollectDetl']);
      if (d) {
        if (isEmpty(d['TAN'])) miss(`${arrRel}[${i}].EmployerOrDeductorOrCollectDetl.TAN`, `Row ${i + 1}: TAN`, hint);
        if (isEmpty(d['EmployerOrDeductorOrCollecterName'])) {
          miss(`${arrRel}[${i}].EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName`, `Row ${i + 1}: deductor/collector name`, hint);
        }
      }
    });
  }
  // 80G donee rows across the four tables
  for (const [table, tLabel] of G80_TABLES) {
    const tObj = obj(v(`Schedule80G.${table}`));
    if (!tObj) continue;
    arr(tObj['DoneeWithPan']).forEach((item, i) => {
      const o = obj(item);
      for (const [f, label] of G80_DONEE_REQ) {
        if (isEmpty(o ? at(o, f) : undefined)) {
          miss(`Schedule80G.${table}.DoneeWithPan[${i}].${f}`, `${tLabel}, donee ${i + 1}: ${label}`, 'Schedule 80G');
        }
      }
    });
  }

  if (!root) return; // nothing more to verify on an absent payload

  /* 4 ── identity / format checks (schema enums & patterns) */
  const pan = str(v('PersonalInfo.PAN'));
  if (pan && !PAN_RE.test(pan)) err('PersonalInfo.PAN', `PAN "${pan}" is not a valid PAN (AAAAA9999A).`, 'SCHEMA');
  const formName = str(v('Form_ITR4.FormName'));
  if (formName && formName !== 'ITR-4') err('Form_ITR4.FormName', `Form name must be "ITR-4" (found "${formName}").`, 'SCHEMA');
  const ayVal = str(v('Form_ITR4.AssessmentYear'));
  if (ayVal && ayVal !== '2025') err('Form_ITR4.AssessmentYear', `Assessment year must be "2025" for AY 2025-26 (found "${ayVal}").`, 'SCHEMA');
  const schemaVer = str(v('Form_ITR4.SchemaVer'));
  if (schemaVer && schemaVer !== 'Ver1.0') err('Form_ITR4.SchemaVer', `Schema version must be "Ver1.0" (found "${schemaVer}").`, 'SCHEMA');
  const dob = str(v('PersonalInfo.DOB'));
  if (dob && !DATE_RE.test(dob)) err('PersonalInfo.DOB', `Date of birth "${dob}" must be in YYYY-MM-DD format.`, 'SCHEMA');
  const verPan = str(v('Verification.Declaration.AssesseeVerPAN'));
  if (verPan && !PAN_RE.test(verPan)) err('Verification.Declaration.AssesseeVerPAN', 'PAN of the verifier is not a valid PAN.', 'SCHEMA');
  const status = str(v('PersonalInfo.Status'));
  if (status && !['I', 'H', 'F'].includes(status)) {
    err('PersonalInfo.Status', `Status must be I (Individual), H (HUF) or F (Firm other than LLP) — found "${status}".`, 'SCHEMA');
  }
  const rfs = v('FilingStatus.ReturnFileSec');
  if (!isEmpty(rfs) && !RETURN_FILE_SEC.includes(num(rfs))) {
    err('FilingStatus.ReturnFileSec', `Filing section code ${String(rfs)} is not a valid ITR-4 filing-section code.`, 'SCHEMA');
  }
  const ccMobile = num(v('PersonalInfo.Address.CountryCodeMobile'));
  const mobile = v('PersonalInfo.Address.MobileNo');
  if (!isEmpty(mobile) && ccMobile === 91 && !/^[1-9][0-9]{9}$/.test(String(num(mobile)))) {
    err('PersonalInfo.Address.MobileNo', 'Mobile number must be a valid 10-digit Indian mobile number.', 'A-48');
  }
  const dueDate = str(v('FilingStatus.ItrFilingDueDate'));
  if (dueDate && dueDate !== '2025-07-31') {
    err('FilingStatus.ItrFilingDueDate', 'Due date of filing u/s 139(1) must be "2025-07-31" for AY 2025-26.', 'A-246');
  }

  /* 5 ── Category-A validation rules (checkable on the JSON alone) */
  checkRules(v, err, warn, status);
}

/* ── Category-A rule engine ───────────────────────────────────────────────── */

function checkRules(
  v: (rel: string) => unknown,
  err: (rel: string, msg: string, rule?: string) => void,
  warn: (rel: string, msg: string, rule?: string) => void,
  status: string,
): void {
  const isFirm = status === 'F';
  const isHUF = status === 'H';
  const isInd = status === 'I';

  /* regime: new regime is the default for AY 2025-26; old regime only when the
   * A23 chain opts out. Firms: regime question not applicable (rule 250). */
  const a23 = str(v('FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25'));
  const optOutOld =
    (a23 === 'Y' && str(v('FilingStatus.Yes_ContOptOutNewTaxReg')) === 'Y') ||
    (a23 === 'N' && str(v('FilingStatus.No_OptOutNewTaxReg')) === 'Y') ||
    (a23 === 'NA' && str(v('FilingStatus.NA_OptOutNewTaxReg')) === 'Y');
  const oldRegime = isFirm || optOutOld;
  const newRegime = !oldRegime;

  /* — A23 / Form 10-IEA chain (rules 239, 250, 274, 283, 285, 290, 291) — */
  if (isFirm && a23 && a23 !== 'NA') {
    err('FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25',
      'Tax-regime option (A23) is not applicable for a Firm — select "Not applicable".', 'A-250');
  }
  if (!isFirm) {
    if (a23 === 'Y') {
      if (isEmpty(v('FilingStatus.Form10IEADate_AY24_25')) || isEmpty(v('FilingStatus.Form10IEAAckNo_AY24_25'))) {
        err('FilingStatus.Form10IEADate_AY24_25',
          'A23 is "Yes": date of filing and acknowledgement number of Form 10-IEA (AY 2024-25) are mandatory.', 'A-239');
      }
      if (isEmpty(v('FilingStatus.Yes_ContOptOutNewTaxReg'))) {
        err('FilingStatus.Yes_ContOptOutNewTaxReg',
          'A23(a)(i) "Do you wish to continue to opt out of New Tax Regime for the current AY?" is mandatory when A23 is "Yes".', 'A-283');
      }
    }
    if (a23 === 'N' && isEmpty(v('FilingStatus.No_OptOutNewTaxReg'))) {
      err('FilingStatus.No_OptOutNewTaxReg',
        'A23(b)(i) "Do you wish to opt out of New Tax Regime for the current AY?" is mandatory when A23 is "No".', 'A-290');
    }
    if (a23 === 'NA' && isEmpty(v('FilingStatus.NA_OptOutNewTaxReg'))) {
      err('FilingStatus.NA_OptOutNewTaxReg',
        'A23(c)(i) "Do you wish to opt out of New Tax Regime for the current AY?" is mandatory when A23 is "Not applicable".', 'A-285');
    }
    if (!a23) {
      err('FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25',
        'It is mandatory to answer the 115BAC tax-regime question at A23 for Individuals and HUFs.', 'A-274');
    }
    // opting out for the current AY normally requires Form 10-IEA particulars
    if ((a23 === 'N' && str(v('FilingStatus.No_OptOutNewTaxReg')) === 'Y') ||
        (a23 === 'NA' && str(v('FilingStatus.NA_OptOutNewTaxReg')) === 'Y')) {
      if (isEmpty(v('FilingStatus.Form10IEADate')) || isEmpty(v('FilingStatus.Form10IEAAckNo'))) {
        warn('FilingStatus.Form10IEADate',
          'Opting out of the new tax regime for the current AY normally requires Form 10-IEA date and acknowledgement number.', 'A-291');
      }
    }
  }

  /* — representative assessee (rule 44) — */
  if (str(v('Verification.Capacity')) === 'R') {
    const rep = obj(v('FilingStatus.AssesseeRep'));
    if (!rep || isEmpty(rep['RepName']) || isEmpty(rep['RepCapacity']) || isEmpty(rep['RepAddress']) || isEmpty(rep['RepPAN'])) {
      err('FilingStatus.AssesseeRep',
        'Verification capacity is "Representative": name, capacity, address and PAN of the representative are mandatory in Part A – General.', 'A-44');
    }
    if (str(v('FilingStatus.AsseseeRepFlg')) !== 'Y') {
      err('FilingStatus.AsseseeRepFlg',
        'Verification capacity is "Representative" but the representative-assessee flag is not "Y".', 'A-44');
    }
  }

  /* — DOB / date-of-formation eligibility (rules 349, 350) — */
  const dob = str(v('PersonalInfo.DOB'));
  if (DATE_RE.test(dob)) {
    if ((isFirm || isHUF) && dob >= '2025-04-01') {
      err('PersonalInfo.DOB', 'Firm/HUF with date of formation on or after 01-04-2025 cannot file a return for AY 2025-26.', 'A-349');
    }
    if (isInd && dob >= '2007-04-01') {
      err('PersonalInfo.DOB', 'Individual with date of birth on or after 01-04-2007 cannot file a return for AY 2025-26.', 'A-350');
    }
  }

  /* — Schedule BP: presumptive income (rules 1, 2, 5-9, 11-14, 16-17, 97,
   *   135-141, 144, 212, 213, 252-255) — */
  const bp = obj(v('ScheduleBP'));
  const incBP = num(v('IncomeDeductions.IncomeFromBusinessProf'));
  const ad = obj(v('ScheduleBP.PersumptiveInc44AD'));
  const ada = obj(v('ScheduleBP.PersumptiveInc44ADA'));
  const ae = obj(v('ScheduleBP.PersumptiveInc44AE'));

  if (incBP > 0 && !bp) {
    err('ScheduleBP', 'Income u/s 44AD/44ADA/44AE is disclosed in Part B – Gross Total Income but Schedule BP is not filled.', 'A-1');
  }
  if (!bp || (!ad && !ada && !ae)) {
    err('ScheduleBP',
      'ITR-4 requires presumptive income u/s 44AD, 44ADA or 44AE to be disclosed in Schedule BP (else ITR-1/2/3 applies).', 'A-140');
  }
  if (bp) {
    const totAD = ad ? num(ad['TotPersumptiveInc44AD']) : 0;
    const totADA = ada ? num(ada['TotPersumptiveInc44ADA']) : 0;
    const incAE = ae ? num(ae['IncChargeableUnderBus']) : 0;
    if (ne(incBP, totAD + totADA + incAE)) {
      err('IncomeDeductions.IncomeFromBusinessProf',
        `Business income in Part B (${incBP}) does not match Schedule BP total (44AD ${totAD} + 44ADA ${totADA} + 44AE ${incAE}).`, 'A-2');
    }

    const codesAD = arr(v('ScheduleBP.NatOfBus44AD'));
    const codesADA = arr(v('ScheduleBP.NatOfBus44ADA'));
    const codesAE = arr(v('ScheduleBP.NatOfBus44AE'));

    if (ad) {
      const tot = num(ad['GrsTotalTrnOver']);
      const bank = num(ad['GrsTrnOverBank']);
      const cash = num(ad['GrsTotalTrnOverInCash']);
      const other = num(ad['GrsTrnOverAnyOthMode']);
      const six = num(ad['PersumptiveInc44AD6Per']);
      const eight = num(ad['PersumptiveInc44AD8Per']);
      const totInc = num(ad['TotPersumptiveInc44AD']);
      const hasBreakup = !isEmpty(ad['GrsTrnOverBank']) || !isEmpty(ad['GrsTotalTrnOverInCash']) || !isEmpty(ad['GrsTrnOverAnyOthMode']);
      if (hasBreakup && ne(tot, bank + cash + other)) {
        err('ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver',
          `E1 gross turnover u/s 44AD (${tot}) must equal E1a + E1b + E1c (${bank + cash + other}).`, 'A-255');
      }
      if (six < Math.floor(bank * 0.06)) {
        err('ScheduleBP.PersumptiveInc44AD.PersumptiveInc44AD6Per',
          `Presumptive income u/s 44AD on digital/banking receipts (${six}) is less than 6% of ${bank}.`, 'A-5');
      }
      if (eight < Math.floor((cash + other) * 0.08)) {
        err('ScheduleBP.PersumptiveInc44AD.PersumptiveInc44AD8Per',
          `Presumptive income u/s 44AD on cash/other receipts (${eight}) is less than 8% of ${cash + other}.`, 'A-6');
      }
      if ((!isEmpty(ad['PersumptiveInc44AD6Per']) || !isEmpty(ad['PersumptiveInc44AD8Per'])) && ne(totInc, six + eight)) {
        err('ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD',
          `Total presumptive income u/s 44AD (${totInc}) must be the sum of the 6% and 8% components (${six + eight}).`, 'A-7');
      }
      if (totInc > tot) {
        err('ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD',
          'Income u/s 44AD cannot exceed the gross turnover / gross receipts.', 'A-8');
      }
      if (tot > 30000000) {
        err('ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver',
          'Gross receipts u/s 44AD exceed Rs. 3 crore — ITR-4 cannot be filed (tax audit / ITR-3 or ITR-5 applies).', 'A-9');
      } else if (tot > 20000000 && cash + other > tot * 0.05) {
        err('ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver',
          'Gross receipts u/s 44AD exceed Rs. 2 crore and cash/other-mode receipts exceed 5% of total — tax audit u/s 44AB applies, so ITR-3/ITR-5 must be used.', 'A-252');
      }
      if (totInc > 0 && codesAD.length === 0) {
        err('ScheduleBP.NatOfBus44AD', 'Income is declared u/s 44AD — selecting a business code u/s 44AD is mandatory.', 'A-11');
      }
    }
    if (!ad && codesAD.length > 0) {
      err('ScheduleBP.PersumptiveInc44AD', 'A business code u/s 44AD is selected — declaring income u/s 44AD is mandatory.', 'A-12');
    }

    if (ada) {
      const grs = num(ada['GrsReceipt']);
      const bank = num(ada['GrsTrnOverBank44ADA']);
      const cash = num(ada['GrsTotalTrnOverInCash44ADA']);
      const other = num(ada['GrsTrnOverAnyOthMode44ADA']);
      const totInc = num(ada['TotPersumptiveInc44ADA']);
      const hasBreakup = !isEmpty(ada['GrsTrnOverBank44ADA']) || !isEmpty(ada['GrsTotalTrnOverInCash44ADA']) || !isEmpty(ada['GrsTrnOverAnyOthMode44ADA']);
      if (hasBreakup && ne(grs, bank + cash + other)) {
        err('ScheduleBP.PersumptiveInc44ADA.GrsReceipt',
          `E3 gross receipts u/s 44ADA (${grs}) must equal E3a + E3b + E3c (${bank + cash + other}).`, 'A-254');
      }
      if (totInc > grs) {
        err('ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA', 'Income u/s 44ADA cannot exceed the gross receipts.', 'A-13');
      }
      if (totInc < Math.floor(grs * 0.5)) {
        err('ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA',
          `Presumptive income u/s 44ADA (${totInc}) is less than 50% of gross receipts (${grs}).`, 'A-14');
      }
      if (grs > 7500000) {
        err('ScheduleBP.PersumptiveInc44ADA.GrsReceipt',
          'Gross receipts u/s 44ADA exceed Rs. 75 lakh — ITR-4 cannot be filed (tax audit / ITR-3 or ITR-5 applies).', 'A-253');
      } else if (grs > 5000000 && cash + other > grs * 0.05) {
        err('ScheduleBP.PersumptiveInc44ADA.GrsReceipt',
          'Gross receipts u/s 44ADA exceed Rs. 50 lakh and cash/other-mode receipts exceed 5% of total — tax audit u/s 44AB applies, so ITR-3/ITR-5 must be used.', 'A-253');
      }
      if (totInc > 0 && codesADA.length === 0) {
        err('ScheduleBP.NatOfBus44ADA', 'Income is declared u/s 44ADA — selecting a profession code u/s 44ADA is mandatory.', 'A-16');
      }
      if (isHUF && totInc > 0) {
        err('ScheduleBP.PersumptiveInc44ADA', 'HUF is not eligible to claim presumptive income u/s 44ADA.', 'A-212');
      }
    }
    if (!ada && codesADA.length > 0) {
      err('ScheduleBP.PersumptiveInc44ADA', 'A profession code u/s 44ADA is selected — declaring income u/s 44ADA is mandatory.', 'A-17');
    }

    const goods = arr(v('ScheduleBP.GoodsDtlsUs44AE'));
    if (ae) {
      const totAE = num(ae['TotPersumInc44AE']);
      const salInt = num(ae['SalInterestByFirm']);
      const chargeable = num(ae['IncChargeableUnderBus']);
      if (totAE > 0 && goods.length === 0) {
        err('ScheduleBP.GoodsDtlsUs44AE', 'Presumptive income u/s 44AE is declared but details of goods carriages are not filled.', 'A-135');
      }
      if (goods.length > 0) {
        const sumVeh = goods.reduce<number>((s, g) => s + num(obj(g)?.['PresumptiveIncome']), 0);
        if (ne(totAE, sumVeh)) {
          err('ScheduleBP.PersumptiveInc44AE.TotPersumInc44AE',
            `Presumptive income u/s 44AE (${totAE}) must equal the total of per-vehicle presumptive income (${sumVeh}).`, 'A-136');
        }
      }
      if (!isFirm && salInt > 0) {
        err('ScheduleBP.PersumptiveInc44AE.SalInterestByFirm',
          'Salary/interest paid to partners can reduce 44AE income only for a Firm (other than LLP).', 'A-97');
      }
      if (ne(chargeable, totAE - salInt)) {
        err('ScheduleBP.PersumptiveInc44AE.IncChargeableUnderBus',
          `Income chargeable u/s 44AE (${chargeable}) must equal presumptive income (${totAE}) minus salary/interest to partners (${salInt}).`, 'A-97');
      }
      if (totAE > 0 && codesAE.length === 0) {
        err('ScheduleBP.NatOfBus44AE', 'Income is declared u/s 44AE — selecting a business code u/s 44AE is mandatory.', 'A-137');
      }
    }
    if (!ae && codesAE.length > 0) {
      err('ScheduleBP.PersumptiveInc44AE', 'A business code u/s 44AE is selected — declaring income u/s 44AE is mandatory.', 'A-138');
    }
    // per-vehicle checks (rules 141, 144, 213)
    const regNos = new Set<string>();
    goods.forEach((g, i) => {
      const o = obj(g);
      if (!o) return;
      const months = num(o['HoldingPeriod']);
      const tonnage = num(o['TonnageCapacity']);
      const incVeh = num(o['PresumptiveIncome']);
      const reg = str(o['RegNumberGoodsCarriage']).trim().toUpperCase();
      if (months > 12) {
        err(`ScheduleBP.GoodsDtlsUs44AE[${i}].HoldingPeriod`,
          `Goods carriage ${i + 1}: months owned/leased/hired cannot exceed 12.`, 'A-141');
      }
      if (months > 0) {
        const floorInc = tonnage > 12 ? 1000 * tonnage * months : 7500 * months;
        if (incVeh < floorInc) {
          err(`ScheduleBP.GoodsDtlsUs44AE[${i}].PresumptiveIncome`,
            `Goods carriage ${i + 1}: presumptive income (${incVeh}) is below the statutory minimum of ${floorInc} (Rs. 1000/MT/month above 12 MT, else Rs. 7500/month).`, 'A-144');
        }
      }
      if (reg) {
        if (regNos.has(reg)) {
          err(`ScheduleBP.GoodsDtlsUs44AE[${i}].RegNumberGoodsCarriage`,
            `Goods carriage ${i + 1}: registration number "${reg}" is repeated.`, 'A-213');
        }
        regNos.add(reg);
      }
    });

    // financial particulars (rules 3, 4, 139)
    const fin = obj(v('ScheduleBP.FinanclPartclrOfBusiness'));
    const anyTurnover = (ad !== null && num(ad['GrsTotalTrnOver']) > 0) ||
      (ada !== null && num(ada['GrsReceipt']) > 0) ||
      (ae !== null && num(ae['TotPersumInc44AE']) > 0);
    if (anyTurnover && !fin) {
      err('ScheduleBP.FinanclPartclrOfBusiness',
        'Gross receipts/turnover are declared in Schedule BP but the Financial Particulars of Business (E11–E25) are not filled.', 'A-139');
    }
    if (fin) {
      const liab = num(fin['PartnerMemberOwnCapital']) + num(fin['SecuredLoans']) + num(fin['UnSecuredLoans']) +
        num(fin['Advances']) + num(fin['SundryCreditors']) + num(fin['OthrCurrLiab']);
      if (!isEmpty(fin['TotCapLiabilities']) && ne(num(fin['TotCapLiabilities']), liab)) {
        err('ScheduleBP.FinanclPartclrOfBusiness.TotCapLiabilities',
          `E17 total capital & liabilities (${num(fin['TotCapLiabilities'])}) must equal the sum of its components (${liab}).`, 'A-3');
      }
      const assets = num(fin['FixedAssets']) + num(fin['Inventories']) + num(fin['SundryDebtors']) +
        num(fin['BalWithBanks']) + num(fin['CashInHand']) + num(fin['LoansAndAdvances']) + num(fin['OtherAssets']);
      if (!isEmpty(fin['TotalAssets']) && ne(num(fin['TotalAssets']), assets)) {
        err('ScheduleBP.FinanclPartclrOfBusiness.TotalAssets',
          `E25 total assets (${num(fin['TotalAssets'])}) must equal the sum of its components (${assets}).`, 'A-4');
      }
    }
  }

  /* — salary block (rules 63-66, 143, 160, 166, 184, 245, 270, 279, 346, 351) — */
  const inc = obj(v('IncomeDeductions'));
  if (inc) {
    const grossSal = num(inc['GrossSalary']);
    const salParts = num(inc['Salary']) + num(inc['PerquisitesValue']) + num(inc['ProfitsInSalary']) +
      num(inc['IncomeNotified89A']) + num(inc['IncomeNotifiedOther89A']);
    const hasSalBreakup = !isEmpty(inc['Salary']) || !isEmpty(inc['PerquisitesValue']) || !isEmpty(inc['ProfitsInSalary']);
    if (hasSalBreakup && ne(grossSal, salParts)) {
      err('IncomeDeductions.GrossSalary',
        `Gross salary (${grossSal}) must equal salary 17(1) + perquisites 17(2) + profits in lieu 17(3) + 89A incomes (${salParts}).`, 'A-63');
    }
    const exempt10 = obj(inc['AllwncExemptUs10']);
    const totExempt10 = exempt10 ? num(exempt10['TotalAllwncExemptUs10']) : 0;
    if (!isEmpty(inc['NetSalary']) && ne(num(inc['NetSalary']), grossSal - totExempt10 - num(inc['Increliefus89A']))) {
      err('IncomeDeductions.NetSalary',
        'Net salary must equal gross salary minus allowances exempt u/s 10 minus relief claimed u/s 89A.', 'A-64');
    }
    const d16 = num(inc['DeductionUs16ia']) + num(inc['EntertainmntalwncUs16ii']) + num(inc['ProfessionalTaxUs16iii']);
    const has16Breakup = !isEmpty(inc['DeductionUs16ia']) || !isEmpty(inc['EntertainmntalwncUs16ii']) || !isEmpty(inc['ProfessionalTaxUs16iii']);
    if (has16Breakup && ne(num(inc['DeductionUs16']), d16)) {
      err('IncomeDeductions.DeductionUs16', `Deductions u/s 16 (${num(inc['DeductionUs16'])}) must equal 16(ia) + 16(ii) + 16(iii) (${d16}).`, 'A-65');
    }
    if (!isEmpty(inc['IncomeFromSal']) && ne(num(inc['IncomeFromSal']), num(inc['NetSalary']) - num(inc['DeductionUs16']))) {
      err('IncomeDeductions.IncomeFromSal', 'Income chargeable under Salaries must equal net salary minus deductions u/s 16.', 'A-66');
    }
    const cap16ia = oldRegime ? 50000 : 75000;
    if (num(inc['DeductionUs16ia']) > cap16ia) {
      err('IncomeDeductions.DeductionUs16ia',
        `Standard deduction u/s 16(ia) cannot exceed Rs. ${cap16ia} under the ${oldRegime ? 'old' : 'new'} tax regime.`, oldRegime ? 'A-143' : 'A-279');
    }
    if (newRegime && num(inc['ProfessionalTaxUs16iii']) > 0) {
      err('IncomeDeductions.ProfessionalTaxUs16iii', 'Professional tax u/s 16(iii) cannot be claimed under the new tax regime.', 'A-195');
    }
    if ((isHUF || isFirm) && grossSal > 0) {
      err('IncomeDeductions.GrossSalary', 'HUF / Firm cannot have salary income.', 'A-166');
    }
    if (grossSal > 0 && str(v('PersonalInfo.EmployerCategory')) === 'NA') {
      err('PersonalInfo.EmployerCategory', 'Salary income is disclosed — "Nature of employment" must be provided (not "Not applicable").', 'A-270');
    }
    // exempt allowances u/s 10: totals, one-dropdown-per-section, regime bans, HRA link
    if (exempt10) {
      const dtls = arr(exempt10['AllwncExemptUs10Dtls']).map((d) => obj(d)).filter((d): d is Obj => d !== null);
      if (dtls.length > 0) {
        const sum = dtls.reduce((s, d) => s + num(d['SalOthAmount']), 0);
        if (ne(totExempt10, sum)) {
          err('IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10',
            `Total allowances exempt u/s 10 (${totExempt10}) must equal the sum of individual entries (${sum}).`, 'A-160');
        }
        const seen = new Set<string>();
        dtls.forEach((d, i) => {
          const nat = str(d['SalNatureDesc']);
          if (nat && nat !== 'OTH') {
            if (seen.has(nat)) {
              err(`IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls[${i}].SalNatureDesc`,
                `Exempt-allowance section "${nat}" is selected more than once — each section must be disclosed in one row.`, 'A-245');
            }
            seen.add(nat);
          }
          if (newRegime && ['10(5)', '10(13A)', '10(14)(i)', '10(14)(ii)', '10(17)'].includes(nat) && num(d['SalOthAmount']) > 0) {
            err(`IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls[${i}].SalNatureDesc`,
              `Exempt allowance u/s ${nat} cannot be claimed under the new tax regime.`, 'A-184');
          }
        });
        const hra = dtls.find((d) => str(d['SalNatureDesc']) === '10(13A)' && num(d['SalOthAmount']) > 0);
        if (hra) {
          const ea = obj(v('ScheduleEA10_13A'));
          if (!ea) {
            err('ScheduleEA10_13A', 'Exempt allowance u/s 10(13A) (HRA) is claimed — Schedule 10(13A) must be filled.', 'A-346');
          } else if (ne(num(hra['SalOthAmount']), num(ea['EligbleExmpAllwncUs13A']))) {
            err('IncomeDeductions.AllwncExemptUs10',
              'Exempt HRA u/s 10(13A) in the salary schedule must match the eligible allowance computed in Schedule 10(13A).', 'A-351');
          }
        }
      }
    }
    /* — house property (rules 55, 57-61, 154, 207) — */
    const typeHP = str(inc['TypeOfHP']);
    const grossRent = num(inc['GrossRentReceived']);
    const localTax = num(inc['TaxPaidlocalAuth']);
    const annual = num(inc['AnnualValue']);
    if (typeHP || !isEmpty(inc['GrossRentReceived']) || !isEmpty(inc['AnnualValue'])) {
      if (!isEmpty(inc['AnnualValue']) && ne(annual, grossRent - localTax)) {
        err('IncomeDeductions.AnnualValue', `B3(iii) annual value (${annual}) must equal gross rent minus tax paid to local authorities (${grossRent - localTax}).`, 'A-55');
      }
      const std30 = num(inc['AnnualValue30Percent']);
      if (!isEmpty(inc['AnnualValue30Percent']) && Math.abs(std30 - annual * 0.3) > 1) {
        err('IncomeDeductions.AnnualValue30Percent', `Standard deduction on house property (${std30}) must be 30% of the annual value (${annual}).`, 'A-57');
      }
      if (localTax > 0 && grossRent === 0) {
        err('IncomeDeductions.TaxPaidlocalAuth', 'Municipal tax cannot be claimed when gross rent received/receivable is zero.', 'A-58');
      }
      if ((typeHP === 'L' || typeHP === 'D') && grossRent === 0) {
        err('IncomeDeductions.GrossRentReceived', 'House property is let out / deemed let out but gross rent received/receivable is zero.', 'A-59');
      }
      if (typeHP === 'S' && localTax > 0) {
        err('IncomeDeductions.TaxPaidlocalAuth', 'Tax paid to local authorities is not allowed for a self-occupied house property.', 'A-61');
      }
      const hpIncome = annual - std30 - num(inc['InterestPayable']) + num(inc['ArrearsUnrealizedRentRcvd']);
      if (!isEmpty(inc['TotalIncomeOfHP']) && ne(num(inc['TotalIncomeOfHP']), hpIncome)) {
        err('IncomeDeductions.TotalIncomeOfHP',
          `Income chargeable under House Property (${num(inc['TotalIncomeOfHP'])}) must equal (annual value − 30% − interest) + arrears (${hpIncome}).`, 'A-60');
      }
      if (typeHP === 'S' && num(inc['InterestPayable']) > 0) {
        if (newRegime) {
          err('IncomeDeductions.InterestPayable', 'Interest on borrowed capital cannot be claimed for a self-occupied house property under the new tax regime.', 'A-207');
        } else if (num(inc['InterestPayable']) > 200000) {
          err('IncomeDeductions.InterestPayable', 'Interest on borrowed capital for a self-occupied house property cannot exceed Rs. 2,00,000 (old regime).', 'A-154');
        }
      }
    }
    /* — other sources: family pension & 57(iia) (rules 95, 96, 180, 278) — */
    const osDtls = arr(at(inc, 'OthersInc.OthersIncDtlsOthSrc')).map((d) => obj(d)).filter((d): d is Obj => d !== null);
    const famPension = osDtls.filter((d) => str(d['OthSrcNatureDesc']) === 'FAP').reduce((s, d) => s + num(d['OthSrcOthAmount']), 0);
    const d57iia = num(inc['DeductionUs57iia']);
    if (d57iia > 0 && famPension === 0) {
      err('IncomeDeductions.DeductionUs57iia', 'Deduction u/s 57(iia) is allowed only when Family Pension is selected under income from other sources.', 'A-95');
    }
    if (d57iia > 0 && famPension > 0) {
      const cap = Math.min(Math.floor(famPension / 3), oldRegime ? 15000 : 25000);
      if (d57iia > cap) {
        err('IncomeDeductions.DeductionUs57iia',
          `Deduction u/s 57(iia) (${d57iia}) cannot exceed 1/3rd of family pension subject to Rs. ${oldRegime ? '15,000' : '25,000'} (max ${cap}).`, oldRegime ? 'A-96' : 'A-278');
      }
    }
    if ((isHUF || isFirm) && famPension > 0) {
      err('IncomeDeductions.OthersInc', 'Family-pension income cannot be disclosed by an HUF or a Firm (other than LLP).', 'A-180');
    }
    /* — GTI arithmetic (rules 49, 196, 197) — */
    const ltcg = num(v('LTCG112A.LongCap112A'));
    const hpInc = num(inc['TotalIncomeOfHP']);
    const gtiIncl = num(inc['GrossTotIncomeIncLTCG112A']);
    if (!isEmpty(inc['GrossTotIncomeIncLTCG112A'])) {
      const parts = num(inc['IncomeFromBusinessProf']) + num(inc['IncomeFromSal']) + num(inc['IncomeOthSrc']) + ltcg;
      const expected = newRegime && hpInc < 0 ? parts : parts + hpInc;
      if (ne(gtiIncl, expected)) {
        err('IncomeDeductions.GrossTotIncomeIncLTCG112A',
          `Gross total income incl. LTCG 112A (${gtiIncl}) must equal the sum of business, salary, house property, other sources and LTCG 112A incomes (${expected}).`, newRegime ? 'A-196' : 'A-49');
      }
    }
  }

  /* — Chapter VI-A (rules 18-27, 31-33, 35-38, 41, 42, 45, 145-149, 152, 153,
   *   179, 183, 190, 211, 241, 256, 263-268) — */
  const via = obj(v('IncomeDeductions.DeductUndChapVIA'));
  if (via) {
    const g = (k: string) => num(via[k]);
    const breakup = VIA_FIELDS.reduce((s, f) => s + g(f), 0);
    if (!isEmpty(via['TotalChapVIADeductions']) && ne(g('TotalChapVIADeductions'), breakup)) {
      err('IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions',
        `Total Chapter VI-A deductions (${g('TotalChapVIADeductions')}) must equal the sum of individual deductions (${breakup}).`, 'A-18');
    }
    const gtiIncl = num(v('IncomeDeductions.GrossTotIncomeIncLTCG112A'));
    if (g('TotalChapVIADeductions') > gtiIncl) {
      err('IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions',
        'Chapter VI-A deductions cannot exceed the gross total income.', 'A-19');
    }
    if (!isEmpty(v('IncomeDeductions.TotalIncome')) &&
        ne(num(v('IncomeDeductions.TotalIncome')), Math.max(0, gtiIncl - g('TotalChapVIADeductions')))) {
      err('IncomeDeductions.TotalIncome',
        'Total income must equal gross total income (including LTCG u/s 112A) minus total Chapter VI-A deductions.', 'A-45');
    }
    if (isFirm) {
      if (g('Section80C') + g('Section80CCC') + g('Section80CCDEmployeeOrSE') > 0) {
        err('IncomeDeductions.DeductUndChapVIA.Section80C', 'A Firm cannot claim deductions u/s 80C, 80CCC or 80CCD(1).', 'A-20');
      }
      if (g('Section80D') > 0) err('IncomeDeductions.DeductUndChapVIA.Section80D', 'A Firm cannot claim deduction u/s 80D.', 'A-27');
      if (g('Section80DD') > 0) err('IncomeDeductions.DeductUndChapVIA.Section80DD', 'A Firm cannot claim deduction u/s 80DD.', 'A-28');
      if (g('Section80DDB') > 0) err('IncomeDeductions.DeductUndChapVIA.Section80DDB', 'A Firm cannot claim deduction u/s 80DDB.', 'A-31');
    }
    if (!isInd) {
      if (g('Section80CCDEmployeeOrSE') > 0) {
        err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployeeOrSE', 'Only an Individual can claim deduction u/s 80CCD(1).', 'A-23');
      }
      if (g('Section80CCD1B') > 0) {
        err('IncomeDeductions.DeductUndChapVIA.Section80CCD1B', 'Only an Individual can claim deduction u/s 80CCD(1B).', 'A-24');
      }
      if (g('Section80CCDEmployer') > 0) {
        err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployer', 'HUF / Firm cannot claim deduction u/s 80CCD(2).', 'A-26');
      }
      if (g('Section80U') > 0) {
        err('IncomeDeductions.DeductUndChapVIA.Section80U', 'Only an Individual can claim deduction u/s 80U.', 'A-42');
      }
    }
    if (oldRegime && !isFirm) {
      if (g('Section80C') + g('Section80CCC') + g('Section80CCDEmployeeOrSE') > 150000) {
        err('IncomeDeductions.DeductUndChapVIA.Section80C',
          'Aggregate deduction u/s 80C + 80CCC + 80CCD(1) cannot exceed Rs. 1,50,000 (old regime).', 'A-21');
      }
      if (g('Section80CCD1B') > 50000) {
        err('IncomeDeductions.DeductUndChapVIA.Section80CCD1B', 'Deduction u/s 80CCD(1B) is limited to Rs. 50,000 (old regime).', 'A-145');
      }
      if (g('Section80TTA') > 10000) {
        err('IncomeDeductions.DeductUndChapVIA.Section80TTA', 'Maximum deduction u/s 80TTA is Rs. 10,000 (old regime).', 'A-152');
      }
      if (g('Section80TTB') > 50000) {
        err('IncomeDeductions.DeductUndChapVIA.Section80TTB', 'Maximum deduction u/s 80TTB is Rs. 50,000 (old regime).', 'A-153');
      }
      if (g('Section80TTA') > 0 && g('Section80TTB') > 0) {
        err('IncomeDeductions.DeductUndChapVIA.Section80TTA', 'Deductions u/s 80TTA and 80TTB cannot both be claimed.', 'A-38');
      }
      if (g('Section80G') > 0 && !obj(v('Schedule80G'))) {
        err('Schedule80G', 'Deduction u/s 80G is claimed but donation details are not provided in Schedule 80G.', 'A-33');
      }
      if (g('Section80G') > 0 && obj(v('Schedule80G')) !== null && g('Section80G') > num(v('Schedule80G.TotalEligibleDonationsUs80G'))) {
        err('IncomeDeductions.DeductUndChapVIA.Section80G',
          'Deduction u/s 80G cannot exceed the eligible amount of donations per Schedule 80G.', 'A-35');
      }
      if (g('Section80D') > 0 && !obj(v('Schedule80D'))) {
        err('Schedule80D', 'Deduction u/s 80D is claimed but details are not provided in Schedule 80D.', 'A-179');
      }
      if (g('Section80DD') > 0) {
        const dd = obj(v('Schedule80DD'));
        if (!dd) {
          err('Schedule80DD', 'Deduction u/s 80DD is claimed but disability details are not provided in Schedule 80DD.', 'A-265');
        } else {
          if (ne(g('Section80DD'), num(dd['DeductionAmount']))) {
            err('IncomeDeductions.DeductUndChapVIA.Section80DD', 'Deduction u/s 80DD must equal the amount computed in Schedule 80DD.', 'A-263');
          }
          if (isEmpty(dd['Form10IAAckNum']) && isEmpty(dd['UDIDNum'])) {
            err('Schedule80DD.Form10IAAckNum', 'Form 10-IA acknowledgement / UDID details are required for the 80DD claim.', 'A-267');
          }
          if (num(dd['DeductionAmount']) !== 75000 && num(dd['DeductionAmount']) !== 125000) {
            err('Schedule80DD.DeductionAmount',
              'Deduction u/s 80DD is a fixed amount: Rs. 75,000 (disability) or Rs. 1,25,000 (severe disability).', 'A-146');
          }
        }
      }
      if (g('Section80U') > 0) {
        const u = obj(v('Schedule80U'));
        if (!u) {
          err('Schedule80U', 'Deduction u/s 80U is claimed but disability details are not provided in Schedule 80U.', 'A-266');
        } else {
          if (ne(g('Section80U'), num(u['DeductionAmount']))) {
            err('IncomeDeductions.DeductUndChapVIA.Section80U', 'Deduction u/s 80U must equal the amount computed in Schedule 80U.', 'A-264');
          }
          if (isEmpty(u['Form10IAAckNum']) && isEmpty(u['UDIDNum'])) {
            err('Schedule80U.Form10IAAckNum', 'Form 10-IA acknowledgement / UDID details are required for the 80U claim.', 'A-268');
          }
          if (num(u['DeductionAmount']) !== 75000 && num(u['DeductionAmount']) !== 125000) {
            err('Schedule80U.DeductionAmount',
              'Deduction u/s 80U is a fixed amount: Rs. 75,000 (disability) or Rs. 1,25,000 (severe disability).', 'A-41');
          }
        }
      }
      if (g('Section80DDB') > 100000) {
        err('IncomeDeductions.DeductUndChapVIA.Section80DDB', 'Deduction u/s 80DDB cannot exceed Rs. 1,00,000.', 'A-149');
      }
      if (g('Section80GG') > 60000) {
        err('IncomeDeductions.DeductUndChapVIA.Section80GG', 'Deduction u/s 80GG cannot exceed Rs. 60,000 (old regime).', 'A-36');
      }
    }
    if (newRegime) {
      const banned = VIA_FIELDS.filter((f) => f !== 'Section80CCDEmployer' && f !== 'AnyOthSec80CCH' && g(f) > 0);
      if (banned.length > 0) {
        err('IncomeDeductions.DeductUndChapVIA',
          `Under the new tax regime no Chapter VI-A deduction other than 80CCD(2) and 80CCH may be claimed (found: ${banned.join(', ')}).`, 'A-183');
      }
      if (obj(v('Schedule80G'))) {
        err('Schedule80G', 'Under the new tax regime deduction u/s 80G cannot be claimed and Schedule 80G must not be filled.', 'A-190');
      }
      if (obj(v('Schedule80D'))) {
        err('Schedule80D', 'Under the new tax regime deduction u/s 80D cannot be claimed and Schedule 80D must not be filled.', 'A-211');
      }
    }
    if (g('Section80GGC') > 0 && !obj(v('Schedule80GGC'))) {
      err('Schedule80GGC', 'Deduction u/s 80GGC is claimed — the same amount and details must be provided in Schedule 80GGC.', 'A-256');
    }
  }

  // deduction schedules barred by status/regime (rules 32, 150, 156-158,
  // 163, 164, 309, 334-336)
  const DEDN_SCHEDS: Array<[string, string]> = [
    ['Schedule80C', '80C'], ['ScheduleEA10_13A', '10(13A)'], ['Schedule80E', '80E'],
    ['Schedule80EE', '80EE'], ['Schedule80EEA', '80EEA'], ['Schedule80EEB', '80EEB'],
  ];
  for (const [sched, name] of DEDN_SCHEDS) {
    if (!obj(v(sched))) continue;
    if (isFirm) {
      err(sched, `A Firm is not eligible to fill the ${name} schedule.`, 'A-334');
    } else if (isHUF && name !== '80C') {
      err(sched, `An HUF is not eligible to fill the ${name} schedule.`, 'A-335');
    } else if (isInd && newRegime) {
      err(sched, `The ${name} schedule cannot be filled under the new tax regime.`, 'A-336');
    }
  }
  const int80EE = num(v('Schedule80EE.TotalInterest80EE'));
  const int80EEA = num(v('Schedule80EEA.TotalInterest80EEA'));
  const int80EEB = num(v('Schedule80EEB.TotalInterest80EEB'));
  if (int80EE > 50000) err('Schedule80EE.TotalInterest80EE', 'Deduction u/s 80EE cannot exceed Rs. 50,000.', 'A-150');
  if (int80EEA > 150000) err('Schedule80EEA.TotalInterest80EEA', 'Deduction u/s 80EEA cannot exceed Rs. 1,50,000.', 'A-156');
  if (int80EEB > 150000) err('Schedule80EEB.TotalInterest80EEB', 'Deduction u/s 80EEB cannot exceed Rs. 1,50,000.', 'A-158');
  if (int80EE > 0 && int80EEA > 0) {
    err('Schedule80EEA.TotalInterest80EEA', 'Deductions u/s 80EE and 80EEA cannot both be claimed.', 'A-157');
  }
  if ((isHUF || isFirm) && int80EE > 0) err('Schedule80EE', 'HUF / Firm cannot claim deduction u/s 80EE.', 'A-32');
  if ((isHUF || isFirm) && int80EEA > 0) err('Schedule80EEA', 'HUF / Firm cannot claim deduction u/s 80EEA.', 'A-163');
  if ((isHUF || isFirm) && int80EEB > 0) err('Schedule80EEB', 'HUF / Firm cannot claim deduction u/s 80EEB.', 'A-164');
  if (num(v('Schedule80EEA.PropStmpDtyVal')) > 4500000) {
    err('Schedule80EEA.PropStmpDtyVal', 'Deduction u/s 80EEA is allowed only for a house property with stamp-duty value up to Rs. 45 lakh.', 'A-309');
  }

  /* — Schedule 80G details (rules 98-109) — */
  const s80g = obj(v('Schedule80G'));
  if (s80g) {
    const panAssessee = str(v('PersonalInfo.PAN'));
    const panVerifier = str(v('Verification.Declaration.AssesseeVerPAN'));
    const seenPans = new Set<string>();
    let tablesTotal = 0;
    for (const [table, tLabel] of G80_TABLES) {
      const tObj = obj(s80g[table]);
      if (!tObj) continue;
      // per-table grand total (TotDon100Percent / TotDon50PercentNoApprReqd / …)
      const totKey = Object.keys(tObj).find((k) => k.startsWith('TotDon') && !k.endsWith('Cash') && !k.endsWith('OtherMode'));
      tablesTotal += totKey ? num(tObj[totKey]) : 0;
      arr(tObj['DoneeWithPan']).forEach((row, i) => {
        const o = obj(row);
        if (!o) return;
        const cash = num(o['DonationAmtCash']);
        const other = num(o['DonationAmtOtherMode']);
        const rel = `Schedule80G.${table}.DoneeWithPan[${i}]`;
        if (isEmpty(o['DonationAmtCash']) && isEmpty(o['DonationAmtOtherMode'])) {
          err(`${rel}.DonationAmtCash`, `${tLabel}, donee ${i + 1}: donation in cash or in other mode must be entered.`, 'A-99');
        }
        if (!isEmpty(o['DonationAmt']) && ne(num(o['DonationAmt']), cash + other)) {
          err(`${rel}.DonationAmt`, `${tLabel}, donee ${i + 1}: total donation must equal cash + other-mode donation.`, 'A-104');
        }
        const dp = str(o['DoneePAN']).toUpperCase();
        if (dp) {
          if (dp === panAssessee || dp === panVerifier) {
            err(`${rel}.DoneePAN`, `${tLabel}, donee ${i + 1}: donee PAN cannot be the assessee's or verifier's own PAN.`, 'A-98');
          }
          if (dp !== 'AAAAR1077P') {
            if (seenPans.has(dp)) {
              err(`${rel}.DoneePAN`, `${tLabel}, donee ${i + 1}: donee PAN ${dp} appears more than once in Schedule 80G.`, 'A-109');
            }
            seenPans.add(dp);
          }
        }
        if (oldRegime && cash > 2000) {
          warn(`${rel}.DonationAmtCash`, `${tLabel}, donee ${i + 1}: cash donation above Rs. 2,000 is not counted towards the eligible 80G amount.`, 'A-108');
        }
      });
    }
    if (!isEmpty(s80g['TotalDonationsUs80G']) && ne(num(s80g['TotalDonationsUs80G']), tablesTotal)) {
      err('Schedule80G.TotalDonationsUs80G',
        `Total donations u/s 80G (${num(s80g['TotalDonationsUs80G'])}) must equal the sum of tables A–D (${tablesTotal}).`, 'A-103');
    }
  }

  /* — Schedule 80GGC totals (rules 257, 258, 260, 271) — */
  const ggc = obj(v('Schedule80GGC'));
  if (ggc) {
    const cash = num(ggc['TotalDonationAmtCash80GGC']);
    const other = num(ggc['TotalDonationAmtOtherMode80GGC']);
    if (!isEmpty(ggc['TotalDonationsUs80GGC']) && ne(num(ggc['TotalDonationsUs80GGC']), cash + other)) {
      err('Schedule80GGC.TotalDonationsUs80GGC', 'Total donations u/s 80GGC must equal donation in cash + donation in other mode.', 'A-258');
    }
    if (num(ggc['TotalEligibleDonationAmt80GGC']) > other) {
      err('Schedule80GGC.TotalEligibleDonationAmt80GGC',
        'Eligible 80GGC donation cannot exceed the donation made in other-than-cash mode (cash donations are not eligible).', 'A-257');
    }
    const rows = arr(ggc['Schedule80GGCDetails']).map((r) => obj(r)).filter((r): r is Obj => r !== null);
    if (rows.length > 0) {
      const sc = rows.reduce((s, r) => s + num(r['DonationAmtCash']), 0);
      const so = rows.reduce((s, r) => s + num(r['DonationAmtOtherMode']), 0);
      if (ne(cash, sc) || ne(other, so)) {
        err('Schedule80GGC.TotalDonationAmtCash80GGC', '80GGC totals (cash / other mode) must equal the sum of the individual donation rows.', 'A-260');
      }
      rows.forEach((r, i) => {
        if (!isEmpty(r['DonationAmt']) && ne(num(r['DonationAmt']), num(r['DonationAmtCash']) + num(r['DonationAmtOtherMode']))) {
          err(`Schedule80GGC.Schedule80GGCDetails[${i}].DonationAmt`, `80GGC row ${i + 1}: total donation must equal cash + other-mode amounts.`, 'A-258');
        }
        const dt = str(r['DonationDate']);
        if (DATE_RE.test(dt) && (dt < '2024-04-01' || dt > '2025-03-31')) {
          err(`Schedule80GGC.Schedule80GGCDetails[${i}].DonationDate`, `80GGC row ${i + 1}: donation date must fall between 01-04-2024 and 31-03-2025 for AY 2025-26.`, 'A-271');
        }
      });
    }
  }

  /* — exempt income / Schedule EI (rules 130, 222) — */
  const eiRows = arr(v('TaxExmpIntIncDtls.OthersInc.OthersIncDtls')).map((r) => obj(r)).filter((r): r is Obj => r !== null);
  if (eiRows.length > 0) {
    const agri = eiRows.filter((r) => str(r['NatureDesc']) === 'AGRI');
    if (agri.length > 1) {
      err('TaxExmpIntIncDtls.OthersInc.OthersIncDtls', 'Agricultural income can be selected only once under exempt income.', 'A-130');
    }
    if (agri.reduce((s, r) => s + num(r['OthAmount']), 0) > 5000) {
      err('TaxExmpIntIncDtls.OthersInc.OthersIncDtls',
        'Agricultural income shown as exempt cannot exceed Rs. 5,000 in ITR-4 (use ITR-2/3 above that).', 'A-130');
    }
    const seen = new Set<string>();
    eiRows.forEach((r, i) => {
      const nat = str(r['NatureDesc']);
      if (nat && nat !== 'OTH') {
        if (seen.has(nat)) {
          err(`TaxExmpIntIncDtls.OthersInc.OthersIncDtls[${i}].NatureDesc`,
            `Exempt-income nature "${nat}" is selected more than once.`, 'A-222');
        }
        seen.add(nat);
      }
    });
  }

  /* — LTCG u/s 112A (rules 293, 294, 295) — */
  const ltcgBlk = obj(v('LTCG112A'));
  if (ltcgBlk) {
    const gain = num(ltcgBlk['LongCap112A']);
    if (gain > 125000) {
      err('LTCG112A.LongCap112A', 'Long-term capital gains u/s 112A above Rs. 1,25,000 cannot be reported in ITR-4 (use ITR-2/3).', 'A-293');
    }
    if (!isEmpty(ltcgBlk['LongCap112A']) && ne(gain, num(ltcgBlk['TotSaleCnsdrn']) - num(ltcgBlk['TotCstAcqisn']))) {
      err('LTCG112A.LongCap112A', 'LTCG u/s 112A must equal total sale consideration minus total cost of acquisition.', 'A-294');
    }
  }
  const totalIncome = num(v('IncomeDeductions.TotalIncome'));
  if (totalIncome - num(v('LTCG112A.LongCap112A')) > 5000000) {
    err('IncomeDeductions.TotalIncome', 'Total income (excluding LTCG u/s 112A) exceeds Rs. 50 lakh — ITR-4 cannot be filed.', 'A-295');
  }

  /* — tax computation (rules 50-54, 56, 124, 237, 241) — */
  const tc = obj(v('TaxComputation'));
  if (tc) {
    const rebate = num(tc['Rebate87A']);
    if ((isHUF || isFirm) && rebate > 0) {
      err('TaxComputation.Rebate87A', 'Rebate u/s 87A can be claimed only by a resident Individual.', 'A-50');
    }
    if (oldRegime && rebate > 0) {
      if (totalIncome > 500000) {
        err('TaxComputation.Rebate87A', 'Rebate u/s 87A (old regime) is not available when total income exceeds Rs. 5,00,000.', 'A-51');
      }
      if (rebate > 12500) {
        err('TaxComputation.Rebate87A', 'Rebate u/s 87A (old regime) is limited to Rs. 12,500.', 'A-241');
      }
    }
    if (newRegime && rebate > 0 && totalIncome > 700000) {
      warn('TaxComputation.Rebate87A',
        'Rebate u/s 87A (new regime) is normally not available above Rs. 7,00,000 total income except marginal relief — please verify.', 'A-237');
    }
    if (!isEmpty(tc['TaxPayableOnRebate']) && ne(num(tc['TaxPayableOnRebate']), num(tc['TotalTaxPayable']) - rebate)) {
      err('TaxComputation.TaxPayableOnRebate', 'Tax after rebate must equal tax payable on total income minus rebate u/s 87A.', 'A-52');
    }
    if (!isEmpty(tc['GrossTaxLiability']) && ne(num(tc['GrossTaxLiability']), num(tc['TaxPayableOnRebate']) + num(tc['EducationCess']))) {
      err('TaxComputation.GrossTaxLiability', 'Total tax and cess must equal tax payable after rebate plus health & education cess.', 'A-53');
    }
    if (!isEmpty(tc['NetTaxLiability']) && ne(num(tc['NetTaxLiability']), num(tc['GrossTaxLiability']) - num(tc['Section89']))) {
      err('TaxComputation.NetTaxLiability', 'Balance tax after relief must equal total tax & cess minus relief u/s 89(1).', 'A-56');
    }
    const ip = obj(tc['IntrstPay']);
    if (ip && !isEmpty(tc['TotTaxPlusIntrstPay'])) {
      const sum = num(tc['NetTaxLiability']) + num(ip['IntrstPayUs234A']) + num(ip['IntrstPayUs234B']) + num(ip['IntrstPayUs234C']) + num(ip['LateFilingFee234F']);
      if (ne(num(tc['TotTaxPlusIntrstPay']), sum)) {
        err('TaxComputation.TotTaxPlusIntrstPay',
          `Total tax, fee and interest (${num(tc['TotTaxPlusIntrstPay'])}) must equal balance tax after relief plus interest u/s 234A/B/C and fee u/s 234F (${sum}).`, 'A-54');
      }
    }
    if (num(tc['TotalTaxPayable']) > 0 && !isEmpty(v('IncomeDeductions.GrossTotIncomeIncLTCG112A')) && num(v('IncomeDeductions.GrossTotIncomeIncLTCG112A')) === 0) {
      err('TaxComputation.TotalTaxPayable', 'Tax computation is disclosed but gross total income is nil.', 'A-124');
    }
  }

  /* — TDS / TCS / IT schedules & taxes-paid tie-outs (rules 110-122, 125,
   *   127-129, 131-134, 165, 341) — */
  const itRows = arr(v('ScheduleIT.TaxPayment')).map((r) => obj(r)).filter((r): r is Obj => r !== null);
  if (obj(v('ScheduleIT')) && itRows.length > 0) {
    const sum = itRows.reduce((s, r) => s + num(r['Amt']), 0);
    if (ne(num(v('ScheduleIT.TotalTaxPayments')), sum)) {
      err('ScheduleIT.TotalTaxPayments', `Schedule IT total (${num(v('ScheduleIT.TotalTaxPayments'))}) must equal the sum of individual challans (${sum}).`, 'A-110');
    }
  }
  const tcsRows = arr(v('ScheduleTCS.TCS')).map((r) => obj(r)).filter((r): r is Obj => r !== null);
  if (obj(v('ScheduleTCS'))) {
    tcsRows.forEach((r, i) => {
      if (num(r['AmtTCSClaimedThisYear']) > num(r['TotalTCS'])) {
        err(`ScheduleTCS.TCS[${i}].AmtTCSClaimedThisYear`, `TCS row ${i + 1}: TCS claimed this year cannot exceed the tax collected.`, 'A-111');
      }
    });
    if (tcsRows.length > 0) {
      const sum = tcsRows.reduce((s, r) => s + num(r['AmtTCSClaimedThisYear']), 0);
      if (ne(num(v('ScheduleTCS.TotalSchTCS')), sum)) {
        err('ScheduleTCS.TotalSchTCS', 'Schedule TCS total must equal the sum of TCS claimed in individual rows.', 'A-112');
      }
    }
  }
  const tds1Rows = arr(v('TDSonSalaries.TDSonSalary')).map((r) => obj(r)).filter((r): r is Obj => r !== null);
  if (obj(v('TDSonSalaries')) && tds1Rows.length > 0) {
    const sum = tds1Rows.reduce((s, r) => s + num(r['TotalTDSSal']), 0);
    if (ne(num(v('TDSonSalaries.TotalTDSonSalaries')), sum)) {
      err('TDSonSalaries.TotalTDSonSalaries', 'Schedule TDS1 total must equal the sum of TDS deducted in individual rows.', 'A-118');
    }
    if ((isHUF || isFirm) && sum > 0) {
      err('TDSonSalaries', 'HUF / Firm cannot have TDS on salary (Schedule TDS1).', 'A-165');
    }
  }
  const checkTdsRows = (rows: Obj[], base: string, ruleClaim: string) => {
    rows.forEach((r, i) => {
      const claimed = num(r['TDSClaimed']);
      if (claimed > num(r['TDSDeducted']) + num(r['BroughtFwdTDSAmt'])) {
        err(`${base}[${i}].TDSClaimed`, `TDS row ${i + 1}: TDS claimed this year cannot exceed tax deducted (incl. brought-forward TDS).`, ruleClaim);
      }
      if (num(r['BroughtFwdTDSAmt']) > 0 && isEmpty(r['DeductedYr'])) {
        err(`${base}[${i}].DeductedYr`, `TDS row ${i + 1}: year of deduction is mandatory when brought-forward TDS is claimed.`, 'A-114');
      }
      if (claimed > 0 && (isEmpty(r['GrossAmount']) || isEmpty(r['HeadOfIncome']))) {
        err(`${base}[${i}].GrossAmount`, `TDS row ${i + 1}: corresponding gross amount and head of income are mandatory when TDS is claimed.`, 'A-121');
      }
      if (claimed > 0 && num(r['GrossAmount']) > 0 && claimed > num(r['GrossAmount'])) {
        err(`${base}[${i}].TDSClaimed`, `TDS row ${i + 1}: TDS claimed cannot exceed the corresponding income offered.`, 'A-116');
      }
      if (str(r['TDSSection']).startsWith('92')) {
        err(`${base}[${i}].TDSSection`, `TDS row ${i + 1}: salary TDS section (192) cannot be used in the other-than-salary TDS schedules.`, 'A-341');
      }
    });
  };
  const tds2Rows = arr(v('TDSonOthThanSals.TDSonOthThanSalDtls')).map((r) => obj(r)).filter((r): r is Obj => r !== null);
  if (obj(v('TDSonOthThanSals'))) {
    checkTdsRows(tds2Rows, 'TDSonOthThanSals.TDSonOthThanSalDtls', 'A-113');
    if (tds2Rows.length > 0) {
      const sum = tds2Rows.reduce((s, r) => s + num(r['TDSClaimed']), 0);
      if (ne(num(v('TDSonOthThanSals.TotalTDSonOthThanSals')), sum)) {
        err('TDSonOthThanSals.TotalTDSonOthThanSals', 'Schedule TDS2 total must equal the sum of TDS claimed in individual rows.', 'A-119');
      }
    }
  }
  const tds3Rows = arr(v('ScheduleTDS3Dtls.TDS3Details')).map((r) => obj(r)).filter((r): r is Obj => r !== null);
  if (obj(v('ScheduleTDS3Dtls'))) {
    checkTdsRows(tds3Rows, 'ScheduleTDS3Dtls.TDS3Details', 'A-113');
    if (tds3Rows.length > 0) {
      const sum = tds3Rows.reduce((s, r) => s + num(r['TDSClaimed']), 0);
      if (ne(num(v('ScheduleTDS3Dtls.TotalTDS3Details')), sum)) {
        err('ScheduleTDS3Dtls.TotalTDS3Details', 'Schedule TDS3 total must equal the sum of TDS claimed in individual rows.', 'A-120');
      }
    }
  }

  const tp = obj(v('TaxPaid.TaxesPaid'));
  if (tp) {
    const adv = num(tp['AdvanceTax']);
    const tds = num(tp['TDS']);
    const tcs = num(tp['TCS']);
    const sat = num(tp['SelfAssessmentTax']);
    if (!isEmpty(tp['TotalTaxesPaid']) && ne(num(tp['TotalTaxesPaid']), adv + tds + tcs + sat)) {
      err('TaxPaid.TaxesPaid.TotalTaxesPaid',
        `Total taxes paid (${num(tp['TotalTaxesPaid'])}) must equal advance tax + TDS + TCS + self-assessment tax (${adv + tds + tcs + sat}).`, 'A-127');
    }
    const tdsSched = num(v('TDSonSalaries.TotalTDSonSalaries')) + num(v('TDSonOthThanSals.TotalTDSonOthThanSals')) + num(v('ScheduleTDS3Dtls.TotalTDS3Details'));
    if ((tds > 0 || tdsSched > 0) && ne(tds, tdsSched)) {
      err('TaxPaid.TaxesPaid.TDS', `Total TDS claimed (${tds}) must equal the sum of the TDS1, TDS2 and TDS3 schedules (${tdsSched}).`, 'A-131');
    }
    if ((tcs > 0 || obj(v('ScheduleTCS')) !== null) && ne(tcs, num(v('ScheduleTCS.TotalSchTCS')))) {
      err('TaxPaid.TaxesPaid.TCS', `Total TCS claimed (${tcs}) must equal the Schedule TCS total (${num(v('ScheduleTCS.TotalSchTCS'))}).`, 'A-132');
    }
    if (itRows.length > 0) {
      const advSum = itRows.filter((r) => str(r['DateDep']) <= '2025-03-31').reduce((s, r) => s + num(r['Amt']), 0);
      const satSum = itRows.filter((r) => str(r['DateDep']) >= '2025-04-01').reduce((s, r) => s + num(r['Amt']), 0);
      if (ne(adv, advSum)) {
        err('TaxPaid.TaxesPaid.AdvanceTax', `Advance tax (${adv}) must equal Schedule IT challans deposited up to 31-03-2025 (${advSum}).`, 'A-133');
      }
      if (ne(sat, satSum)) {
        err('TaxPaid.TaxesPaid.SelfAssessmentTax', `Self-assessment tax (${sat}) must equal Schedule IT challans deposited after 31-03-2025 (${satSum}).`, 'A-134');
      }
    } else if (adv > 0 || sat > 0) {
      err('ScheduleIT', 'Advance/self-assessment tax is claimed but no challan details are given in Schedule IT.', 'A-125');
    }
    // refund / balance payable tie-outs
    const totTax = num(v('TaxComputation.TotTaxPlusIntrstPay'));
    const paid = num(tp['TotalTaxesPaid']);
    if (!isEmpty(v('Refund.RefundDue'))) {
      const expectedRefund = paid > totTax ? paid - totTax : 0;
      if (ne(num(v('Refund.RefundDue')), expectedRefund)) {
        err('Refund.RefundDue', `Refund due (${num(v('Refund.RefundDue'))}) must equal total taxes paid minus total tax, fee & interest (${expectedRefund}).`, 'A-128');
      }
    }
    if (!isEmpty(v('TaxPaid.BalTaxPayable'))) {
      const expectedBal = totTax > paid ? totTax - paid : 0;
      if (ne(num(v('TaxPaid.BalTaxPayable')), expectedBal)) {
        err('TaxPaid.BalTaxPayable', `Balance tax payable (${num(v('TaxPaid.BalTaxPayable'))}) must equal total tax, fee & interest minus total taxes paid (${expectedBal}).`, 'A-129');
      }
    }
    if (tds > 0 && num(v('TDSonSalaries.TotalTDSonSalaries')) > num(v('IncomeDeductions.GrossSalary'))) {
      err('TDSonSalaries.TotalTDSonSalaries',
        'TDS deducted in Schedule TDS1 cannot exceed the total gross salary reported in the income details.', 'A-232');
    }
    if (tds > 0 && num(v('IncomeDeductions.GrossTotIncomeIncLTCG112A')) === 0) {
      err('TaxPaid.TaxesPaid.TDS',
        'Credit for TDS is claimed but the corresponding receipts have not been offered for taxation.', 'A-142');
    }
  }

  checkSchedule80D(v, err, oldRegime, isHUF);
  checkScheduleLinks(v, err, warn, oldRegime);
}

/* ── Schedule 80D — rules 168-178, 216-221, 314-317, 337-340, 244 ──────────── */

function checkSchedule80D(
  v: (rel: string) => unknown,
  err: (rel: string, msg: string, rule?: string) => void,
  oldRegime: boolean,
  isHUF: boolean,
): void {
  const B = 'Schedule80D.Sec80DSelfFamSrCtznHealth';
  const blk = obj(v(B));
  if (!blk) return;
  const selfFlag = str(blk['SeniorCitizenFlag']);
  const parentFlag = str(blk['ParentsSeniorCitizenFlag']);

  let claimTotal = 0;
  let checkupTotal = 0;
  for (const [dtlsKey, amtKey, premKey, chkKey, medKey] of D80_BLOCKS) {
    const amt = num(blk[amtKey]);
    const prem = num(blk[premKey]);
    const chk = num(blk[chkKey]);
    const med = medKey ? num(blk[medKey]) : 0;
    claimTotal += amt;
    checkupTotal += chk;
    const cap = amtKey.includes('SeniorCitizen') ? 50000 : 25000;
    const slno = amtKey === 'SelfAndFamily' ? '1a'
      : amtKey === 'SelfAndFamilySeniorCitizen' ? '1b'
        : amtKey === 'Parents' ? '2a' : '2b';
    // 168 / 171 / 173 / 175 — per-row ceilings
    if (oldRegime && amt > cap) {
      err(`${B}.${amtKey}`,
        `Schedule 80D sl.${slno}: deduction (${amt}) is allowed only to the extent of Rs. ${cap}.`,
        slno === '1a' ? 'A-168' : slno === '1b' ? 'A-171' : slno === '2a' ? 'A-173' : 'A-175');
    }
    // 169 / 172 / 174 / 176 — the row must equal the sum of its components
    const components = prem + chk + med;
    if (oldRegime && components < cap && !isEmpty(blk[amtKey]) && ne(amt, components)) {
      err(`${B}.${amtKey}`,
        `Schedule 80D sl.${slno}: deduction (${amt}) must equal the sum of its components (${components}).`,
        slno === '1a' ? 'A-169' : slno === '1b' ? 'A-172' : slno === '2a' ? 'A-174' : 'A-176');
    }
    // 337-340 — insurer / policy details required when a premium is claimed
    const rows = arr(at(blk, `${dtlsKey}.Sch80DInsDtls`)).map((r) => obj(r)).filter((r): r is Obj => r !== null);
    if (prem > 0 && rows.length === 0) {
      err(`${B}.${dtlsKey}`,
        `Schedule 80D sl.${slno}: the name of the insurer and the policy number must be provided to claim the health-insurance premium.`,
        slno === '1a' ? 'A-337' : slno === '1b' ? 'A-338' : slno === '2a' ? 'A-339' : 'A-340');
    }
    // 314-317 — the row break-up must match the premium entered
    if (rows.length > 0) {
      const rowSum = rows.reduce((s, r) => s + num(r['HealthInsAmt']), 0);
      const rule = slno === '1a' ? 'A-314' : slno === '1b' ? 'A-315' : slno === '2a' ? 'A-316' : 'A-317';
      if (!isEmpty(blk[premKey]) && ne(prem, rowSum)) {
        err(`${B}.${premKey}`,
          `Schedule 80D sl.${slno}: the break-up of the individual policy rows (${rowSum}) must match the health-insurance premium entered (${prem}).`, rule);
      }
      const declared = num(at(blk, `${dtlsKey}.TotalPayments`));
      if (!isEmpty(at(blk, `${dtlsKey}.TotalPayments`)) && ne(declared, rowSum)) {
        err(`${B}.${dtlsKey}.TotalPayments`,
          `Schedule 80D sl.${slno}: total payments (${declared}) must equal the sum of the individual policy rows (${rowSum}).`, rule);
      }
    }
  }
  // 170 — combined preventive health check-up ceiling
  if (checkupTotal > 5000) {
    err(`${B}.PrevHlthChckUpSlfFam`,
      `Schedule 80D: the preventive health check-up amounts of all fields combined (${checkupTotal}) cannot exceed Rs. 5,000.`, 'A-170');
  }
  // 177 / 178 — eligible amount of deduction
  const elig = num(blk['EligibleAmountOfDedn']);
  if (elig > 100000) {
    err(`${B}.EligibleAmountOfDedn`,
      `Schedule 80D sl.3: the eligible amount of deduction (${elig}) is allowed only to the extent of Rs. 1,00,000.`, 'A-177');
  }
  if (!isEmpty(blk['EligibleAmountOfDedn']) && claimTotal <= 100000 && ne(elig, claimTotal)) {
    err(`${B}.EligibleAmountOfDedn`,
      `Schedule 80D sl.3: the eligible amount of deduction (${elig}) must equal the sum of sl. 1a + 1b + 2a + 2b (${claimTotal}).`, 'A-178');
  }
  // 216-221 — the senior-citizen dropdowns gate which rows may carry a value
  if (selfFlag === 'N' && num(blk['SelfAndFamilySeniorCitizen']) > 0) {
    err(`${B}.SelfAndFamilySeniorCitizen`,
      'Schedule 80D sl.1b (self & family including senior citizen) can be claimed only when the dropdown at sl.1 is "Yes".', 'A-217');
  }
  if (selfFlag === 'Y' && num(blk['SelfAndFamily']) > 0) {
    err(`${B}.SelfAndFamily`,
      'Schedule 80D sl.1a (self and family) can be claimed only when the dropdown at sl.1 is "No".', 'A-216');
  }
  if (selfFlag === 'S' && num(blk['SelfAndFamily']) + num(blk['SelfAndFamilySeniorCitizen']) > 0) {
    err(`${B}.SelfAndFamily`,
      'Schedule 80D: no deduction can be claimed at sl.1a or 1b when the dropdown is "Not claiming for Self / Family".', 'A-220');
  }
  if (parentFlag === 'N' && num(blk['ParentsSeniorCitizen']) > 0) {
    err(`${B}.ParentsSeniorCitizen`,
      'Schedule 80D sl.2b (parents including senior citizen) can be claimed only when the dropdown at sl.2 is "Yes".', 'A-219');
  }
  if (parentFlag === 'Y' && num(blk['Parents']) > 0) {
    err(`${B}.Parents`,
      'Schedule 80D sl.2a (parents) can be claimed only when the dropdown at sl.2 is "No".', 'A-218');
  }
  if (parentFlag === 'P' && num(blk['Parents']) + num(blk['ParentsSeniorCitizen']) > 0) {
    err(`${B}.Parents`,
      'Schedule 80D: no deduction can be claimed at sl.2a or 2b when the dropdown is "Not claiming for Parents".', 'A-221');
  }
  // 244 — an HUF cannot claim the parents' block
  if (isHUF && num(blk['Parents']) + num(blk['ParentsSeniorCitizen']) > 0) {
    err(`${B}.Parents`, 'An HUF is not eligible for the deduction at sl.no.2 (parents) of Schedule 80D.', 'A-244');
  }
}

/* ── Schedule ↔ Chapter VI-A cross-links and detail requirements —
 *   rules 299, 303-308, 310-313, 319-332 ─────────────────────────────────── */

/** [schedule, detail array, per-row amount field, schedule total, VI-A field,
 *   cross-link rule, row-sum rule, details-required rule] */
const SCHED_LINKS: Array<[string, string, string, string, string, string, string, string]> = [
  ['Schedule80C', 'Schedule80CDtls', 'Amount', 'TotalAmt', 'Section80C', 'A-321', 'A-327', 'A-303'],
  ['Schedule80E', 'Schedule80EDtls', 'Interest80E', 'TotalInterest80E', 'Section80E', 'A-322', 'A-328', 'A-305'],
  ['Schedule80EE', 'Schedule80EEDtls', 'Interest80EE', 'TotalInterest80EE', 'Section80EE', 'A-323', 'A-329', 'A-306'],
  ['Schedule80EEA', 'Schedule80EEADtls', 'Interest80EEA', 'TotalInterest80EEA', 'Section80EEA', 'A-324', 'A-330', 'A-308'],
  ['Schedule80EEB', 'Schedule80EEBDtls', 'Interest80EEB', 'TotalInterest80EEB', 'Section80EEB', 'A-325', 'A-331', 'A-311'],
];

/** [schedule, detail array, loan-date window start, window end, rule id] */
const LOAN_WINDOWS: Array<[string, string, string, string, string]> = [
  ['Schedule80EE', 'Schedule80EEDtls', '2016-04-01', '2017-03-31', 'A-332'],
  ['Schedule80EEA', 'Schedule80EEADtls', '2019-04-01', '2022-03-31', 'A-310'],
  ['Schedule80EEB', 'Schedule80EEBDtls', '2019-04-01', '2023-03-31', 'A-312'],
];

function checkScheduleLinks(
  v: (rel: string) => unknown,
  err: (rel: string, msg: string, rule?: string) => void,
  warn: (rel: string, msg: string, rule?: string) => void,
  oldRegime: boolean,
): void {
  const claimed = (field: string) => num(v(`IncomeDeductions.DeductUndChapVIA.${field}`));

  for (const [sched, dtls, amtKey, totKey, viaField, linkRule, sumRule, reqRule] of SCHED_LINKS) {
    const s = obj(v(sched));
    const want = claimed(viaField);
    if (!s) {
      // 303 / 305 / 306 / 308 / 311 — the schedule is mandatory to support the claim
      if (oldRegime && want > 0) {
        err(sched,
          `Deduction is claimed under ${viaField.replace('Section', 'section ')} — the supporting details (bank / payment particulars) must be provided in ${sched}.`, reqRule);
      }
      continue;
    }
    const rows = arr(s[dtls]).map((r) => obj(r)).filter((r): r is Obj => r !== null);
    const declared = num(s[totKey]);
    // 327-331 — the schedule total must equal the sum of its rows
    if (rows.length > 0) {
      const rowSum = rows.reduce((t, r) => t + num(r[amtKey]), 0);
      if (!isEmpty(s[totKey]) && ne(declared, rowSum)) {
        err(`${sched}.${totKey}`,
          `The total in ${sched} (${declared}) must equal the sum of the individual rows (${rowSum}).`, sumRule);
      }
    }
    // 321-325 — the VI-A claim must match the schedule total
    if ((want > 0 || declared > 0) && ne(want, declared)) {
      err(`IncomeDeductions.DeductUndChapVIA.${viaField}`,
        `Deduction claimed under ${viaField.replace('Section', 'section ')} in Schedule VI-A (${want}) must match the total in ${sched} (${declared}).`, linkRule);
    }
  }

  // 310 / 312 / 332 — the date of sanction must fall inside the statutory window
  for (const [sched, dtls, from, to, rule] of LOAN_WINDOWS) {
    arr(at(v(sched), dtls)).forEach((row, i) => {
      const o = obj(row);
      if (!o) return;
      const d = str(o['DateofLoan']);
      if (DATE_RE.test(d) && (d < from || d > to)) {
        err(`${sched}.${dtls}[${i}].DateofLoan`,
          `Row ${i + 1}: the date of sanction of the loan (${d}) must fall between ${from} and ${to}.`, rule);
      }
    });
  }
  // 307 — 80EE is available only on a loan up to Rs. 35 lakh
  arr(at(v('Schedule80EE'), 'Schedule80EEDtls')).forEach((row, i) => {
    const o = obj(row);
    if (o && num(o['TotalLoanAmt']) > 3500000) {
      err(`Schedule80EE.Schedule80EEDtls[${i}].TotalLoanAmt`,
        `Row ${i + 1}: deduction u/s 80EE can be claimed only if the loan taken does not exceed Rs. 35 lakh.`, 'A-307');
    }
  });

  // 299 / 320 — interest on borrowed capital must be backed by Schedule 24(b)
  const hpInterest = num(v('IncomeDeductions.InterestPayable'));
  const sched24B = obj(v('ScheduleUs24B'));
  if (hpInterest > 0 && !sched24B) {
    err('ScheduleUs24B',
      'Details of the bank from which the loan is taken must be provided in Schedule 24(b) to claim interest on borrowed capital.', 'A-299');
  }
  if (sched24B) {
    const declared = num(sched24B['TotalInterestUs24B']);
    const rows = arr(sched24B['ScheduleUs24BDtls']).map((r) => obj(r)).filter((r): r is Obj => r !== null);
    if (rows.length > 0) {
      const rowSum = rows.reduce((t, r) => t + num(r['InterestUs24B']), 0);
      if (!isEmpty(sched24B['TotalInterestUs24B']) && ne(declared, rowSum)) {
        err('ScheduleUs24B.TotalInterestUs24B',
          `The total in Schedule 24(b) (${declared}) must equal the sum of the individual rows (${rowSum}).`, 'A-326');
      }
    }
    if (!isEmpty(v('IncomeDeductions.InterestPayable')) && ne(hpInterest, declared)) {
      err('IncomeDeductions.InterestPayable',
        `Interest on borrowed capital in the house-property block (${hpInterest}) must equal the total interest u/s 24(b) in Schedule 24(b) (${declared}).`, 'A-320');
    }
  }
  // 300 — 80EE / 80EEA are available only over and above the 24(b) limit
  if ((claimed('Section80EE') > 0 || claimed('Section80EEA') > 0) && num(v('ScheduleUs24B.TotalInterestUs24B')) < 200000) {
    warn('ScheduleUs24B.TotalInterestUs24B',
      'Deduction u/s 80EE / 80EEA can be claimed only once the limit u/s 24(b) is exhausted.', 'A-300');
  }
  // 304 — PRAN is mandatory for the NPS deductions
  if (oldRegime && claimed('Section80CCDEmployeeOrSE') + claimed('Section80CCD1B') > 0
    && isEmpty(v('IncomeDeductions.UsrDeductUndChapVIA.PRANNum'))) {
    err('IncomeDeductions.UsrDeductUndChapVIA.PRANNum',
      'The PRAN must be provided in Schedule VI-A to claim the deduction u/s 80CCD(1) / 80CCD(1B).', 'A-304');
  }
  // 313 — Form 10BA is mandatory for 80GG
  if (oldRegime && claimed('Section80GG') > 0 && isEmpty(v('IncomeDeductions.UsrDeductUndChapVIA.Form10BAAckNum'))) {
    err('IncomeDeductions.UsrDeductUndChapVIA.Form10BAAckNum',
      'Details of Form 10BA must be provided to claim the deduction u/s 80GG.', 'A-313');
  }
  // 30 / 319 — the 80DDB category and the specified disease are mandatory
  if (oldRegime && claimed('Section80DDB') > 0) {
    if (isEmpty(v('IncomeDeductions.UsrDeductUndChapVIA.Section80DDBUsrType'))) {
      err('IncomeDeductions.UsrDeductUndChapVIA.Section80DDBUsrType',
        'Deduction u/s 80DDB is claimed — the eligible category description must be provided.', 'A-30');
    }
    if (isEmpty(v('IncomeDeductions.UsrDeductUndChapVIA.NameOfSpecDisease80DDB'))) {
      err('IncomeDeductions.UsrDeductUndChapVIA.NameOfSpecDisease80DDB',
        'Details of the specified disease must be provided to claim the deduction u/s 80DDB.', 'A-319');
    }
    // 148 — the "self and dependent" category is capped at Rs. 40,000
    if (str(v('IncomeDeductions.UsrDeductUndChapVIA.Section80DDBUsrType')) === '1'
      && claimed('Section80DDB') > 40000) {
      err('IncomeDeductions.DeductUndChapVIA.Section80DDB',
        'Deduction u/s 80DDB for the category "self and dependent" cannot exceed Rs. 40,000.', 'A-148');
    }
  }
  // 342-344, 347 — HRA exemption is the lowest of the three statutory amounts
  const ea = obj(v('ScheduleEA10_13A'));
  if (ea) {
    const elig = num(ea['EligbleExmpAllwncUs13A']);
    const actual = num(ea['ActlHRARecv']);
    const rentLess10 = num(ea['ActlRentPaid10Per']);
    const salPct = num(ea['Sal40Or50Per']);
    if (!isEmpty(ea['EligbleExmpAllwncUs13A'])) {
      if (elig > actual) {
        err('ScheduleEA10_13A.EligbleExmpAllwncUs13A',
          `HRA exemption (${elig}) cannot exceed the actual HRA received (${actual}).`, 'A-343');
      }
      if (elig > rentLess10) {
        err('ScheduleEA10_13A.EligbleExmpAllwncUs13A',
          `HRA exemption (${elig}) cannot exceed the actual rent paid less 10% of basic salary and DA (${rentLess10}).`, 'A-342');
      }
      if (elig > Math.min(actual, rentLess10, salPct)) {
        err('ScheduleEA10_13A.EligbleExmpAllwncUs13A',
          `HRA exemption (${elig}) must be the lowest of actual HRA received, rent paid less 10% of salary, and 40%/50% of salary (${Math.min(actual, rentLess10, salPct)}).`, 'A-344');
      }
    }
    const sal171 = num(v('IncomeDeductions.Salary'));
    if (sal171 > 0 && num(ea['BasicSalary']) + num(ea['DearnessAllwnc']) + actual > sal171) {
      err('ScheduleEA10_13A.BasicSalary',
        'Basic salary, dearness allowance and actual HRA received in Schedule 10(13A) cannot exceed salary u/s 17(1) reported in the income details.', 'A-347');
    }
  }
  // 257 / 259 / 261 / 262 — per-row 80GGC requirements
  const ggcRows = arr(at(v('Schedule80GGC'), 'Schedule80GGCDetails')).map((r) => obj(r)).filter((r): r is Obj => r !== null);
  const gti = num(v('IncomeDeductions.GrossTotIncome'));
  ggcRows.forEach((r, i) => {
    if (isEmpty(r['DonationDate'])) {
      err(`Schedule80GGC.Schedule80GGCDetails[${i}].DonationDate`,
        `80GGC row ${i + 1}: the date of donation is mandatory.`, 'A-261');
    }
    if (num(r['DonationAmtOtherMode']) === 0) {
      err(`Schedule80GGC.Schedule80GGCDetails[${i}].DonationAmtOtherMode`,
        `80GGC row ${i + 1}: contributions in cash are not eligible u/s 80GGC — details of the donation made in another mode are required.`, 'A-262');
    }
    if (num(r['EligibleDonationAmt']) > Math.min(num(r['DonationAmtOtherMode']), gti)) {
      err(`Schedule80GGC.Schedule80GGCDetails[${i}].EligibleDonationAmt`,
        `80GGC row ${i + 1}: the eligible amount must equal the donation in other mode, restricted to the gross total income.`, 'A-257');
    }
  });
  if (ggcRows.length > 0) {
    const eligSum = Math.min(ggcRows.reduce((t, r) => t + num(r['EligibleDonationAmt']), 0), gti);
    if (!isEmpty(v('Schedule80GGC.TotalEligibleDonationAmt80GGC'))
      && ne(num(v('Schedule80GGC.TotalEligibleDonationAmt80GGC')), eligSum)) {
      err('Schedule80GGC.TotalEligibleDonationAmt80GGC',
        `Schedule 80GGC sl. D: the eligible amount of donation must equal the sum of the individual amounts restricted to the gross total income (${eligSum}).`, 'A-259');
    }
  }
}

export default checkMandatory;
