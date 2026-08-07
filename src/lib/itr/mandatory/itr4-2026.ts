/**
 * OFFICIAL mandatory-field validator — ITR-4 (Sugam), AY 2026-27.
 *
 * Sources (distilled into this file, NOT imported at runtime):
 *  - ITD JSON schema "ITR-4_2026_Main_V1.1.json" (draft-04; payload SchemaVer
 *    "Ver1.0", Form_ITR4.AssessmentYear "2026") — the recursive required-property
 *    tree starting at root { ITR: { ITR4: … } } is embedded below.
 *  - "ITR 4 – Validation Rules for AY 2026-27" (docs/itd-validation-rules/
 *    ITR-4_ValidationRules_AY2026-27.md) — every Category-A rule ("return will
 *    not be allowed to be uploaded") that is decidable on the exported JSON
 *    alone is encoded in the rule functions below and tagged with its Sl. No.
 *    as `A-<n>`. Rules needing CPC/AIS/PAN-database/profile/e-verification state
 *    (48, 142, 167, 188, 257, 258, 268, 287) are skipped, as is rule 186 — the
 *    schema's SalNatureDesc enum has no separate code for the transport allowance
 *    to a physically-handicapped employee, so the Rs. 38,400 ceiling cannot be
 *    tested on the JSON without flagging every other 10(14)(ii) allowance.
 *    Where the document repeats one rule per section or per drop-down entry
 *    (325-342 eligible-vs-entered, 82-94 / 367-390 duplicate exempt-income
 *    entries, 284-286 / 306-309 the 80D blocks, 27/28/31/33 status eligibility),
 *    the check is written once as a table-driven loop tagged with the first Sl.
 *    No. of the family — every member of the family is enforced.
 *
 * NOTE — this form-year differs materially from ITR-4 AY 2025-26:
 *   • A23 (Form 10-IEA) is a five-question tree: Form10IEAEarlierAYOldRegime →
 *     F10IEAEarlierAYNewRegime → F10IEACurrAYNewRegime / F10IEACurrAYOldRegime.
 *   • House property is a repeating PropertyDetails[] block with the interest
 *     u/s 24(b) schedule NESTED at Rentdetails.Section24B (no top-level
 *     ScheduleUs24B), and the head total is TotalIncomeChargeableUnHP.
 *   • PersonalInfo.SecondaryAdd is schema-required; PartA_139_8A and
 *     IncomeNotified89A no longer exist; due date is 2026-08-31.
 *
 * This module never throws: any unexpected shape simply yields missing[] entries.
 */

import type {
  MandatoryChecker,
  MandatoryReport,
  MissingField,
  MandatoryIssue,
} from './types';
import { at, isEmpty } from './types';

const FORM = 'itr4';
const AY = '2026-27';
const SCHEMA_VERSION = 'ITR-4_2026_Main_V1.1 (SchemaVer Ver1.0)';

/* ── tiny local helpers ────────────────────────────────────────────────────── */

type Obj = Record<string, unknown>;

function obj(v: unknown): Obj | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function rows(v: unknown): Obj[] {
  return arr(v).map((r) => obj(r)).filter((r): r is Obj => r !== null);
}
function num(v: unknown): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
  return 0;
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v);
}
/** exact integer-sum mismatch (all schema amounts are integers) */
function ne(a: number, b: number): boolean {
  return Math.round(a) !== Math.round(b);
}
function sum(list: Obj[], key: string): number {
  return list.reduce((t, r) => t + num(r[key]), 0);
}

/* ══════════════════════════════════════════════════════════════════════════
 * SECTION 1 — schema-required tree: the ALWAYS-mandatory chain.
 * Distilled from the schema's recursive `required` chains:
 *   ITR (required: ITR4) → ITR4 (required: CreationInfo, Form_ITR4, PersonalInfo,
 *   FilingStatus, IncomeDeductions, TaxComputation, TaxPaid, Refund, Verification)
 * Paths below are RELATIVE to ITR.ITR4.  [relative path, CA label, UI hint]
 * ══════════════════════════════════════════════════════════════════════════ */

type ReqLeaf = [string, string, string?];

const H_GEN = 'Part A — General Information';
const H_INC = 'Part B — Gross Total Income';
const H_VIA = 'Part C — Deductions (Chapter VI-A)';
const H_TAX = 'Part D — Tax Computation';
const H_TP = 'Taxes Paid & Bank Details';
const H_VER = 'Part E — Verification';
const H_BP = 'Schedule BP — Presumptive business/profession';
const H_HP = 'Schedule HP — House Property';

const REQ_ALWAYS: ReqLeaf[] = [
  /* CreationInfo — utility metadata, schema-required */
  ['CreationInfo.SWVersionNo', 'Software version number (CreationInfo)'],
  ['CreationInfo.SWCreatedBy', 'Software id "SWxxxxxxxx" that created the return (CreationInfo)'],
  ['CreationInfo.JSONCreatedBy', 'Software id "SWxxxxxxxx" that created the JSON (CreationInfo)'],
  ['CreationInfo.JSONCreationDate', 'JSON creation date (YYYY-MM-DD)'],
  ['CreationInfo.IntermediaryCity', 'Intermediary city (CreationInfo)'],
  ['CreationInfo.Digest', 'Digest hash (CreationInfo; "-" when not applicable)'],
  /* Form_ITR4 — form identity */
  ['Form_ITR4.FormName', 'Form name — must be "ITR-4"'],
  ['Form_ITR4.Description', 'Form description (Form_ITR4)'],
  ['Form_ITR4.AssessmentYear', 'Assessment year — must be "2026"'],
  ['Form_ITR4.SchemaVer', 'Schema version — must be "Ver1.0"'],
  ['Form_ITR4.FormVer', 'Form version — must be "Ver1.0"'],
  /* PersonalInfo */
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
  ['PersonalInfo.SecondaryAdd', 'Is the secondary address the same as the primary address? (Y/N)', H_GEN],
  ['PersonalInfo.DOB', 'Date of birth / formation (YYYY-MM-DD)', H_GEN],
  ['PersonalInfo.EmployerCategory', 'Nature of employment / employer category', H_GEN],
  ['PersonalInfo.Status', 'Status (I: Individual, H: HUF, F: Firm other than LLP)', H_GEN],
  /* FilingStatus */
  ['FilingStatus.ReturnFileSec', 'Section under which the return is filed (139(1)/139(4)/139(5)…)', H_GEN],
  ['FilingStatus.Form10IEAEarlierAYOldRegime',
    'A23 — Form 10-IEA filed within the due date for an earlier AY to choose the old regime? (Y/N/NA)', H_GEN],
  ['FilingStatus.AsseseeRepFlg', 'Is the return being filed by a representative assessee? (Y/N)', H_GEN],
  ['FilingStatus.ItrFilingDueDate', 'Due date of filing u/s 139(1) — "2026-08-31"', H_GEN],
  /* IncomeDeductions — Part B, Gross Total Income */
  ['IncomeDeductions.IncomeFromBusinessProf', 'B1 — Income from business & profession (presumptive)', H_INC],
  ['IncomeDeductions.GrossSalary', 'B2(iii) — Gross salary', H_INC],
  ['IncomeDeductions.NetSalary', 'B2 — Net salary', H_INC],
  ['IncomeDeductions.DeductionUs16', 'B2(iv) — Deductions u/s 16', H_INC],
  ['IncomeDeductions.IncomeFromSal', 'B2(v) — Income chargeable under Salaries', H_INC],
  ['IncomeDeductions.TotalIncomeChargeableUnHP', 'B3 — Income chargeable under House Property', H_INC],
  ['IncomeDeductions.IncomeOthSrc', 'B4 — Income from other sources', H_INC],
  ['IncomeDeductions.GrossTotIncome', 'B5 — Gross total income (excluding LTCG u/s 112A)', H_INC],
  ['IncomeDeductions.GrossTotIncomeIncLTCG112A', 'B5 — Gross total income including LTCG u/s 112A', H_INC],
  ['IncomeDeductions.TotalIncome', 'B6 — Total income', H_INC],
  /* TaxComputation */
  ['TaxComputation.TotalTaxPayable', 'D1 — Tax payable on total income', H_TAX],
  ['TaxComputation.Rebate87A', 'D2 — Rebate u/s 87A', H_TAX],
  ['TaxComputation.TaxPayableOnRebate', 'D3 — Tax payable after rebate', H_TAX],
  ['TaxComputation.EducationCess', 'D4 — Health & education cess', H_TAX],
  ['TaxComputation.GrossTaxLiability', 'D5 — Total tax and cess', H_TAX],
  ['TaxComputation.NetTaxLiability', 'D7 — Balance tax after relief u/s 89', H_TAX],
  ['TaxComputation.IntrstPay.IntrstPayUs234A', 'D8 — Interest u/s 234A', H_TAX],
  ['TaxComputation.IntrstPay.IntrstPayUs234B', 'D8 — Interest u/s 234B', H_TAX],
  ['TaxComputation.IntrstPay.IntrstPayUs234C', 'D8 — Interest u/s 234C', H_TAX],
  ['TaxComputation.IntrstPay.LateFilingFee234F', 'D9 — Late filing fee u/s 234F', H_TAX],
  ['TaxComputation.TotTaxPlusIntrstPay', 'D10 — Total tax, fee and interest', H_TAX],
  /* TaxPaid */
  ['TaxPaid.TaxesPaid.AdvanceTax', 'D11 — Total advance tax paid', H_TP],
  ['TaxPaid.TaxesPaid.TDS', 'D12 — Total TDS claimed', H_TP],
  ['TaxPaid.TaxesPaid.TCS', 'D13 — Total TCS claimed', H_TP],
  ['TaxPaid.TaxesPaid.SelfAssessmentTax', 'D14 — Total self-assessment tax paid', H_TP],
  ['TaxPaid.TaxesPaid.TotalTaxesPaid', 'D15 — Total taxes paid', H_TP],
  ['TaxPaid.BalTaxPayable', 'D16 — Balance tax payable', H_TP],
  /* Refund */
  ['Refund.RefundDue', 'D17 — Refund due', H_TP],
  /* Verification */
  ['Verification.Declaration.AssesseeVerName', 'Verification — name of the person verifying the return', H_VER],
  ['Verification.Declaration.FatherName', "Verification — father's name of the verifier", H_VER],
  ['Verification.Declaration.AssesseeVerPAN', 'Verification — PAN of the verifier', H_VER],
  ['Verification.Capacity', 'Verification — capacity (S: Self, R: Representative, K: Karta, P: Partner)', H_VER],
  ['Verification.Place', 'Verification — place', H_VER],
];

/** Chapter VI-A per-section scalars — schema-required inside BOTH the
 *  user-entered (UsrDeductUndChapVIA) and computed (DeductUndChapVIA) blocks. */
const VIA_FIELDS: Array<[string, string]> = [
  ['Section80C', 'Section 80C'],
  ['Section80CCC', 'Section 80CCC'],
  ['Section80CCDEmployeeOrSE', 'Section 80CCD(1) — employee / self-employed'],
  ['Section80CCD1B', 'Section 80CCD(1B)'],
  ['Section80CCDEmployer', "Section 80CCD(2) — employer's contribution"],
  ['Section80D', 'Section 80D'],
  ['Section80DD', 'Section 80DD'],
  ['Section80DDB', 'Section 80DDB'],
  ['Section80E', 'Section 80E'],
  ['Section80G', 'Section 80G'],
  ['Section80GG', 'Section 80GG'],
  ['Section80GGC', 'Section 80GGC'],
  ['Section80U', 'Section 80U'],
  ['Section80TTA', 'Section 80TTA'],
  ['Section80TTB', 'Section 80TTB'],
  ['AnyOthSec80CCH', 'Section 80CCH (Agniveer Corpus Fund)'],
  ['TotalChapVIADeductions', 'Total Chapter VI-A deductions'],
];

/* ══════════════════════════════════════════════════════════════════════════
 * SECTION 2 — conditionally-present objects: schema-required fields checked
 * only when the parent object exists in the payload.
 * [parent rel-path, [field rel-path, label][], UI hint]
 * ══════════════════════════════════════════════════════════════════════════ */

const REQ_IF_PRESENT: Array<[string, Array<[string, string]>, string?]> = [
  ['PersonalInfo.Address.Phone', [
    ['STDcode', 'STD code of the landline number'],
    ['PhoneNo', 'landline number'],
  ], H_GEN],
  ['PersonalInfo.AlternateAddress', [
    ['ResidenceNo', 'Secondary address — flat / door / building number'],
    ['LocalityOrArea', 'Secondary address — locality or area'],
    ['CityOrTownOrDistrict', 'Secondary address — city / town / district'],
    ['StateCode', 'Secondary address — state code'],
  ], H_GEN],
  ['FilingStatus.AssesseeRep', [
    ['RepName', 'Name of the representative assessee'],
    ['RepEmailID', 'E-mail ID of the representative assessee'],
    ['CountryCodeRepMobileNo', 'Country code of the representative’s mobile number'],
    ['RepMobileNo', 'Mobile number of the representative assessee'],
  ], H_GEN],
  ['IncomeDeductions.AllwncExemptUs10', [
    ['TotalAllwncExemptUs10', 'B2(ii) — total allowances exempt u/s 10'],
  ], H_INC],
  ['IncomeDeductions.UsrDeductUndChapVIA', [], H_VIA],
  ['TaxExmpIntIncDtls.OthersInc', [
    ['OthersTotalTaxExe', 'Total exempt income (Schedule EI)'],
  ], 'Schedule EI — Exempt Income'],
  ['LTCG112A', [
    ['TotSaleCnsdrn', 'LTCG u/s 112A — total sale consideration'],
    ['TotCstAcqisn', 'LTCG u/s 112A — total cost of acquisition'],
    ['LongCap112A', 'LTCG u/s 112A — long-term capital gain'],
  ], 'Schedule EI — LTCG u/s 112A'],
  ['TaxReturnPreparer', [
    ['IdentificationNoOfTRP', 'Identification number of the TRP'],
    ['NameOfTRP', 'Name of the Tax Return Preparer'],
  ], H_VER],
  /* Schedule BP blocks */
  ['ScheduleBP.PersumptiveInc44AD', [
    ['GrsTotalTrnOver', 'E1 — gross turnover / receipts u/s 44AD'],
    ['TotPersumptiveInc44AD', 'E2 — presumptive income u/s 44AD'],
  ], H_BP],
  ['ScheduleBP.PersumptiveInc44ADA', [
    ['GrsReceipt', 'E3 — gross receipts u/s 44ADA'],
    ['TotPersumptiveInc44ADA', 'E4 — presumptive income u/s 44ADA'],
  ], H_BP],
  ['ScheduleBP.PersumptiveInc44AE', [
    ['TotPersumInc44AE', 'E5 — presumptive income from goods carriage u/s 44AE'],
    ['TotalPersumptiveInc', 'E7 — total presumptive income u/s 44AE'],
    ['IncChargeableUnderBus', 'E8 — income chargeable under business or profession'],
  ], H_BP],
  /* Deduction schedules */
  ['Schedule80G', [
    ['TotalDonationsUs80GCash', 'Schedule 80G, sl. E — total donations in cash'],
    ['TotalDonationsUs80GOtherMode', 'Schedule 80G, sl. E — total donations in other mode'],
    ['TotalDonationsUs80G', 'Schedule 80G, sl. E — total donations'],
    ['TotalEligibleDonationsUs80G', 'Schedule 80G, sl. E — total eligible donations'],
  ], 'Schedule 80G'],
  ['Schedule80G.Don100Percent', [
    ['TotDon100PercentCash', 'Schedule 80G table A — total donations in cash'],
    ['TotDon100PercentOtherMode', 'Schedule 80G table A — total donations in other mode'],
    ['TotDon100Percent', 'Schedule 80G table A — total donations'],
    ['TotEligibleDon100Percent', 'Schedule 80G table A — total eligible donations'],
  ], 'Schedule 80G'],
  ['Schedule80G.Don50PercentNoApprReqd', [
    ['TotDon50PercentNoApprReqdCash', 'Schedule 80G table B — total donations in cash'],
    ['TotDon50PercentNoApprReqdOtherMode', 'Schedule 80G table B — total donations in other mode'],
    ['TotDon50PercentNoApprReqd', 'Schedule 80G table B — total donations'],
    ['TotEligibleDon50Percent', 'Schedule 80G table B — total eligible donations'],
  ], 'Schedule 80G'],
  ['Schedule80G.Don100PercentApprReqd', [
    ['TotDon100PercentApprReqdCash', 'Schedule 80G table C — total donations in cash'],
    ['TotDon100PercentApprReqdOtherMode', 'Schedule 80G table C — total donations in other mode'],
    ['TotDon100PercentApprReqd', 'Schedule 80G table C — total donations'],
    ['TotEligibleDon100PercentApprReqd', 'Schedule 80G table C — total eligible donations'],
  ], 'Schedule 80G'],
  ['Schedule80G.Don50PercentApprReqd', [
    ['TotDon50PercentApprReqdCash', 'Schedule 80G table D — total donations in cash'],
    ['TotDon50PercentApprReqdOtherMode', 'Schedule 80G table D — total donations in other mode'],
    ['TotDon50PercentApprReqd', 'Schedule 80G table D — total donations'],
    ['TotEligibleDon50PercentApprReqd', 'Schedule 80G table D — total eligible donations'],
  ], 'Schedule 80G'],
  ['Schedule80GGC', [
    ['TotalDonationAmtCash80GGC', 'Schedule 80GGC, sl. A — total donations in cash'],
    ['TotalDonationAmtOtherMode80GGC', 'Schedule 80GGC, sl. B — total donations in other mode'],
    ['TotalDonationsUs80GGC', 'Schedule 80GGC, sl. C — total donations'],
    ['TotalEligibleDonationAmt80GGC', 'Schedule 80GGC, sl. D — eligible amount of donation'],
  ], 'Schedule 80GGC'],
  ['Schedule80DD', [
    ['NatureOfDisability', 'Schedule 80DD — nature of disability'],
    ['TypeOfDisability', 'Schedule 80DD — type of disability (dependent / severe)'],
    ['DeductionAmount', 'Schedule 80DD — amount of deduction'],
    ['DependentType', 'Schedule 80DD — type of dependent'],
  ], 'Schedule 80DD'],
  ['Schedule80U', [
    ['NatureOfDisability', 'Schedule 80U — nature of disability'],
    ['TypeOfDisability', 'Schedule 80U — type of disability (self / self-severe)'],
    ['DeductionAmount', 'Schedule 80U — amount of deduction'],
  ], 'Schedule 80U'],
  ['Schedule80E', [['TotalInterest80E', 'Schedule 80E — total interest paid']], 'Schedule 80E'],
  ['Schedule80EE', [['TotalInterest80EE', 'Schedule 80EE — total interest paid']], 'Schedule 80EE'],
  ['Schedule80EEA', [
    ['PropStmpDtyVal', 'Schedule 80EEA — stamp duty value of the property'],
    ['TotalInterest80EEA', 'Schedule 80EEA — total interest paid'],
  ], 'Schedule 80EEA'],
  ['Schedule80EEB', [['TotalInterest80EEB', 'Schedule 80EEB — total interest paid']], 'Schedule 80EEB'],
  ['Schedule80C', [['TotalAmt', 'Schedule 80C — total amount of payments']], 'Schedule 80C'],
  ['ScheduleEA10_13A', [
    ['Placeofwork', 'Schedule 10(13A) — place of work (metro / non-metro)'],
    ['ActlHRARecv', 'Schedule 10(13A) — actual HRA received'],
    ['ActlRentPaid', 'Schedule 10(13A) — actual rent paid'],
    ['DtlsSalUsSec171', 'Schedule 10(13A) — salary as per section 17(1)'],
    ['BasicSalary', 'Schedule 10(13A) — basic salary'],
    ['ActlRentPaid10Per', 'Schedule 10(13A) — rent paid less 10% of salary'],
    ['Sal40Or50Per', 'Schedule 10(13A) — 40% / 50% of salary'],
    ['EligbleExmpAllwncUs13A', 'Schedule 10(13A) — eligible exempt allowance u/s 10(13A)'],
  ], 'Schedule 10(13A)'],
  ['Schedule80D', [], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth', [
    ['EligibleAmountOfDedn', 'Schedule 80D, sl. 3 — eligible amount of deduction'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamHIDtls', [
    ['TotalPayments', 'Schedule 80D sl. 1a — total of premium payments'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamSrCtznHIDtls', [
    ['TotalPayments', 'Schedule 80D sl. 1b — total of premium payments'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsHIDtls', [
    ['TotalPayments', 'Schedule 80D sl. 2a — total of premium payments'],
  ], 'Schedule 80D'],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsSrCtznHIDtls', [
    ['TotalPayments', 'Schedule 80D sl. 2b — total of premium payments'],
  ], 'Schedule 80D'],
  /* Tax-detail schedules */
  ['ScheduleIT', [['TotalTaxPayments', 'Schedule IT — total of advance / self-assessment tax paid']], 'Schedule IT'],
  ['ScheduleTCS', [['TotalSchTCS', 'Schedule TCS — total TCS credit claimed']], 'Schedule TCS'],
  ['TDSonSalaries', [['TotalTDSonSalaries', 'Schedule TDS1 — total TDS on salary']], 'Schedule TDS1'],
  ['TDSonOthThanSals', [['TotalTDSonOthThanSals', 'Schedule TDS2 — total TDS on income other than salary']], 'Schedule TDS2'],
  ['ScheduleTDS3Dtls', [['TotalTDS3Details', 'Schedule TDS3 — total TDS u/s 194-IB']], 'Schedule TDS3'],
];

/** Objects whose own `required` list is empty but which are structurally
 *  meaningless when present and empty — reported as a warning, not missing. */
const EMPTY_IF_PRESENT: Array<[string, string]> = [
  ['ScheduleBP', 'Schedule BP is present but carries no presumptive-income block.'],
  ['Refund.BankAccountDtls', 'Bank account details block is present but carries no bank account.'],
  ['TaxExmpIntIncDtls', 'Schedule EI is present but carries no exempt-income details.'],
];

/* ══════════════════════════════════════════════════════════════════════════
 * SECTION 3 — array items: schema-required fields on EVERY element.
 * [array rel-path, [field rel-path (may be nested), label][], UI hint]
 * ══════════════════════════════════════════════════════════════════════════ */

/** the six bank-loan fields shared by Section 24(b) / 80E / 80EE / 80EEA / 80EEB */
const LOAN_ROW_REQ: Array<[string, string]> = [
  ['LoanTknFrom', 'loan taken from (B: bank, I: financial institution)'],
  ['BankOrInstnName', 'name of the bank / institution'],
  ['LoanAccNoOfBankOrInstnRefNo', 'loan account number / reference number'],
  ['DateofLoan', 'date of sanction of the loan'],
  ['TotalLoanAmt', 'total loan amount'],
  ['LoanOutstndngAmt', 'loan amount outstanding'],
];

const REQ_ARRAY_ITEMS: Array<[string, Array<[string, string]>, string?]> = [
  ['FilingStatus.clauseiv7provisio139iDtls', [
    ['clauseiv7provisio139iNature', 'nature — clause (iv) of the 7th proviso to 139(1)'],
    ['clauseiv7provisio139iAmount', 'amount — clause (iv) of the 7th proviso to 139(1)'],
  ], H_GEN],
  ['IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', [
    ['SalNatureDesc', 'section under which the allowance is exempt'],
    ['SalOthAmount', 'amount of the exempt allowance'],
  ], H_INC],
  ['IncomeDeductions.OthersInc.OthersIncDtlsOthSrc', [
    ['OthSrcNatureDesc', 'nature of income from other sources'],
    ['OthSrcOthAmount', 'amount of income from other sources'],
  ], H_INC],
  ['IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC', [
    ['TypeofIdentifier', 'type of identifier (PRAN / other)'],
    ['NameofIdentifier', 'identifier number'],
    ['Amount', 'amount contributed'],
  ], H_VIA],
  ['IncomeDeductions.PropertyDetails', [
    ['HPSNo', 'house-property serial number'],
    ['PropertyOwner', 'owner of the property'],
    ['PropCoOwnedFlg', 'is the property co-owned? (YES/NO)'],
    ['ifLetOut', 'type of house property (L: let out, D: deemed let out, S: self-occupied)'],
    ['AddressDetailWithZipCode.AddrDetail', 'address of the property'],
    ['AddressDetailWithZipCode.CityOrTownOrDistrict', 'city / town of the property'],
    ['AddressDetailWithZipCode.StateCode', 'state code of the property'],
    ['AddressDetailWithZipCode.CountryCode', 'country code of the property'],
  ], H_HP],
  ['TaxExmpIntIncDtls.OthersInc.OthersIncDtls', [
    ['OthAmount', 'amount of exempt income'],
  ], 'Schedule EI — Exempt Income'],
  ['Schedule80GGC.Schedule80GGCDetails', [
    ['DonationDate', 'date of donation'],
    ['DonationAmtCash', 'donation in cash'],
    ['DonationAmtOtherMode', 'donation in other mode'],
    ['DonationAmt', 'total donation'],
    ['EligibleDonationAmt', 'eligible amount of donation'],
  ], 'Schedule 80GGC'],
  ['Schedule80C.Schedule80CDtls', [
    ['IdentificationNo', 'policy number / document identification number'],
    ['Amount', 'amount eligible for deduction u/s 80C'],
  ], 'Schedule 80C'],
  ['Schedule80E.Schedule80EDtls', [...LOAN_ROW_REQ, ['Interest80E', 'interest paid u/s 80E']], 'Schedule 80E'],
  ['Schedule80EE.Schedule80EEDtls', [...LOAN_ROW_REQ, ['Interest80EE', 'interest paid u/s 80EE']], 'Schedule 80EE'],
  ['Schedule80EEA.Schedule80EEADtls', [...LOAN_ROW_REQ, ['Interest80EEA', 'interest paid u/s 80EEA']], 'Schedule 80EEA'],
  ['Schedule80EEB.Schedule80EEBDtls', [
    ...LOAN_ROW_REQ,
    ['VehicleRegNo', 'vehicle registration number'],
    ['Interest80EEB', 'interest paid u/s 80EEB'],
  ], 'Schedule 80EEB'],
  ['ScheduleBP.NatOfBus44AD', [
    ['NameOfBusiness', 'name of the business (44AD)'],
    ['CodeAD', 'business code u/s 44AD'],
  ], H_BP],
  ['ScheduleBP.NatOfBus44ADA', [
    ['NameOfBusiness', 'name of the profession (44ADA)'],
    ['CodeADA', 'profession code u/s 44ADA'],
  ], H_BP],
  ['ScheduleBP.NatOfBus44AE', [
    ['NameOfBusiness', 'name of the business (44AE)'],
    ['CodeAE', 'business code u/s 44AE'],
  ], H_BP],
  ['ScheduleBP.GoodsDtlsUs44AE', [
    ['RegNumberGoodsCarriage', 'registration number of the goods carriage'],
    ['OwnedLeasedHiredFlag', 'owned / leased / hired'],
    ['TonnageCapacity', 'tonnage capacity (MT)'],
    ['HoldingPeriod', 'number of months for which the carriage was held'],
    ['PresumptiveIncome', 'presumptive income for the carriage'],
  ], H_BP],
  ['ScheduleBP.TurnoverGrsRcptForGSTIN', [
    ['GSTINNo', 'GSTIN number'],
    ['AmtTurnGrossRcptGSTIN', 'annual value of outward supplies as per the GST return'],
  ], H_BP],
  ['Refund.BankAccountDtls.AddtnlBankDetails', [
    ['IFSCCode', 'IFSC code of the bank'],
    ['BankName', 'name of the bank'],
    ['BankAccountNo', 'bank account number'],
    ['AccountType', 'type of account (SB/CA/CC/OD/NRO/OTH)'],
    ['UseForRefund', 'flag — use this account for the refund'],
  ], H_TP],
  ['ScheduleIT.TaxPayment', [
    ['BSRCode', 'BSR code of the bank branch'],
    ['DateDep', 'date of deposit of the challan'],
    ['SrlNoOfChaln', 'serial number of the challan'],
    ['Amt', 'tax paid'],
  ], 'Schedule IT'],
  ['ScheduleTCS.TCS', [
    ['EmployerOrDeductorOrCollectDetl.TAN', 'TAN of the collector'],
    ['EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName', 'name of the collector'],
    ['Amtfrom26AS', 'amount as per Form 26AS'],
    ['TotalTCS', 'tax collected'],
    ['AmtTCSClaimedThisYear', 'TCS credit being claimed this year'],
  ], 'Schedule TCS'],
  ['TDSonSalaries.TDSonSalary', [
    ['EmployerOrDeductorOrCollectDetl.TAN', 'TAN of the employer'],
    ['EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName', 'name of the employer'],
    ['IncChrgSal', 'income chargeable under salaries'],
    ['TotalTDSSal', 'total tax deducted'],
  ], 'Schedule TDS1'],
  ['TDSonOthThanSals.TDSonOthThanSalDtls', [
    ['TANOfDeductor', 'TAN of the deductor'],
    ['TDSSection', 'section under which TDS was deducted'],
    ['TDSClaimed', 'TDS credit being claimed this year'],
    ['TDSCreditCarriedFwd', 'TDS credit carried forward'],
  ], 'Schedule TDS2'],
  ['ScheduleTDS3Dtls.TDS3Details', [
    ['PANofTenant', 'PAN of the tenant'],
    ['TDSSection', 'section under which TDS was deducted'],
    ['TDSClaimed', 'TDS credit being claimed this year'],
    ['TDSCreditCarriedFwd', 'TDS credit carried forward'],
  ], 'Schedule TDS3'],
];

/** Per-property nested arrays / objects (checked for every PropertyDetails row). */
const HP_RENT_REQ: Array<[string, string]> = [
  ['AnnualLetableValue', 'gross rent received / receivable / lettable value (1a)'],
  ['TotalUnrealizedAndTax', 'total of unrealised rent and local taxes (1d)'],
  ['BalanceALV', 'annual value (1e)'],
  ['AnnualOfPropOwned', 'annual value of the property owned (1f)'],
  ['ThirtyPercentOfBalance', '30% of the annual value (1g)'],
  ['IntOnBorwCap', 'interest payable on borrowed capital (1h)'],
  ['TotalDeduct', 'total deductions (1i)'],
  ['IncomeOfHP', "income chargeable under the head 'House Property' (1k)"],
];
const HP_COOWNER_REQ: Array<[string, string]> = [
  ['CoOwnersSNo', 'co-owner serial number'],
  ['NameCoOwner', 'name of the co-owner'],
];
const HP_TENANT_REQ: Array<[string, string]> = [
  ['TenantSNo', 'tenant serial number'],
  ['NameofTenant', 'name of the tenant'],
];
const SEC24B_ROW_REQ: Array<[string, string]> = [
  ...LOAN_ROW_REQ,
  ['InterestUs24B', 'interest paid u/s 24(b)'],
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

/** The four 80D premium-detail blocks: [block, premium field, label, policy-details rule]. */
const D80_BLOCKS: Array<[string, string, string, string]> = [
  ['Sec80DSelfFamHIDtls', 'HealthInsPremSlfFam', 'sl. 1a (self & family)', 'A-306'],
  ['Sec80DSelfFamSrCtznHIDtls', 'HlthInsPremSlfFamSrCtzn', 'sl. 1b (self & family incl. senior citizen)', 'A-307'],
  ['Sec80DParentsHIDtls', 'HlthInsPremParents', 'sl. 2a (parents)', 'A-308'],
  ['Sec80DParentsSrCtznHIDtls', 'HlthInsPremParentsSrCtzn', 'sl. 2b (parents incl. senior citizen)', 'A-309'],
];

/* ══════════════════════════════════════════════════════════════════════════
 * SECTION 4 — identity patterns / enums lifted from the schema.
 * ══════════════════════════════════════════════════════════════════════════ */

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const DATE_RE = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const AADHAAR_RE = /^[0-9]{12}$/;
const EMAIL_RE = /^[.a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
const RETURN_FILE_SEC = [11, 12, 13, 14, 16, 17, 18, 20];
const STATUS_ENUM = ['I', 'H', 'F'];
const CAPACITY_ENUM = ['S', 'R', 'K', 'P'];
const EMPLOYER_ENUM = ['CGOV', 'SGOV', 'PSU', 'PE', 'PESG', 'PEPS', 'PEO', 'OTH', 'NA'];
/** employer categories that are pensioner-type or not applicable (rules 22/155/161) */
const PENSIONER_OR_NA = ['PE', 'PESG', 'PEPS', 'PEO', 'NA'];
const GOVT_EMPLOYER = ['CGOV', 'SGOV'];
/** TDS section codes reserved for salary — invalid in Schedule TDS2 (rule 310) */
const SALARY_TDS_SECTIONS = ['92A', '92B', '92C', '192', '192A'];

/** previous year for AY 2026-27 */
const PY_START = '2025-04-01';
const PY_END = '2026-03-31';

/** filing-section codes (FilingStatus.ReturnFileSec) used by the rule set */
const SEC_139_5_REVISED = 13;
/** last date up to which a revised return escapes the higher fee (rules 392 / 397) */
const REVISED_FEE_CUTOFF = '2026-12-31';

/** The complete CodeADA enum of the schema — only these professional codes may be
 *  used for section 44ADA; any other (business) code violates rule 15. */
const PROF_CODES_44ADA = [
  '14001', '14002', '14003', '14004', '14006', '14008',
  '16001', '16002', '16003', '16004', '16005', '16007', '16008', '16009',
  '16013', '16018', '16019_1', '16020', '16021',
  '18001', '18002', '18003', '18004', '18005', '18010', '18011', '18012',
  '18013', '18014', '18015', '18016', '18017', '18018', '18019', '18020',
  '20010', '20011', '20012',
];

/* ══════════════════════════════════════════════════════════════════════════
 * the checker
 * ══════════════════════════════════════════════════════════════════════════ */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  try {
    runChecks(json, missing, errors, warnings);
  } catch {
    // contract: never throw — surface as a generic error instead
    errors.push({ path: 'ITR.ITR4', msg: 'Internal validation error while checking the return JSON — please review the payload structure.', });
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

type Miss = (rel: string, label: string, hint?: string) => void;
type Err = (rel: string, msg: string, rule?: string) => void;
type Warn = (rel: string, msg: string, rule?: string) => void;
type Val = (rel: string) => unknown;

function runChecks(
  json: unknown,
  missing: MissingField[],
  errors: MandatoryIssue[],
  warnings: MandatoryIssue[],
): void {
  const P = 'ITR.ITR4.';
  const root = obj(at(json, 'ITR.ITR4'));

  const miss: Miss = (rel, label, hint) => {
    missing.push(hint ? { path: P + rel, label, hint } : { path: P + rel, label });
  };
  const err: Err = (rel, msg, rule) => {
    errors.push(rule ? { path: P + rel, msg, rule } : { path: P + rel, msg });
  };
  const warn: Warn = (rel, msg, rule) => {
    warnings.push(rule ? { path: P + rel, msg, rule } : { path: P + rel, msg });
  };
  const v: Val = (rel) => (root ? at(root, rel) : undefined);

  if (!root) {
    missing.push({ path: 'ITR.ITR4', label: 'ITR-4 return data — the JSON must contain the object { ITR: { ITR4: {…} } }', });
  }

  /* 1 ── always-required leaves (the schema root required chain) */
  for (const [rel, label, hint] of REQ_ALWAYS) {
    if (isEmpty(v(rel))) miss(rel, label, hint);
  }
  for (const [f, label] of VIA_FIELDS) {
    if (isEmpty(v(`IncomeDeductions.UsrDeductUndChapVIA.${f}`))) {
      miss(`IncomeDeductions.UsrDeductUndChapVIA.${f}`, `Chapter VI-A (as entered) — ${label} amount`, H_VIA);
    }
    if (isEmpty(v(`IncomeDeductions.DeductUndChapVIA.${f}`))) {
      miss(`IncomeDeductions.DeductUndChapVIA.${f}`, `Chapter VI-A (as computed) — ${label} amount`, H_VIA);
    }
  }
  // Refund.BankAccountDtls is itself schema-required, and a return is not
  // acceptable without at least one bank account of the assessee.
  if (!obj(v('Refund.BankAccountDtls'))) {
    miss('Refund.BankAccountDtls', 'Bank account details block (at least one bank account of the assessee)', H_TP);
  } else if (arr(v('Refund.BankAccountDtls.AddtnlBankDetails')).length === 0) {
    miss('Refund.BankAccountDtls.AddtnlBankDetails', 'At least one bank account (IFSC code, bank name, account number, account type)', H_TP);
  }

  /* 2 ── conditionally-present objects */
  for (const [parent, fields, hint] of REQ_IF_PRESENT) {
    if (!obj(v(parent))) continue;
    for (const [f, label] of fields) {
      if (isEmpty(v(`${parent}.${f}`))) miss(`${parent}.${f}`, label, hint);
    }
  }
  for (const [parent, msg] of EMPTY_IF_PRESENT) {
    const o = obj(v(parent));
    if (o && Object.keys(o).length === 0) warn(parent, msg);
  }

  /* 3 ── array items */
  for (const [arrRel, fields, hint] of REQ_ARRAY_ITEMS) {
    rows(v(arrRel)).forEach((o, i) => {
      for (const [f, label] of fields) {
        if (isEmpty(at(o, f))) miss(`${arrRel}[${i}].${f}`, `Row ${i + 1}: ${label}`, hint);
      }
    });
  }
  checkHousePropertyRequired(v, miss);
  check80GRequired(v, miss);
  check80DRequired(v, miss);
  checkDividendQuarterlyRequired(v, miss);

  if (!root) return; // nothing further can be verified on an absent payload

  /* 4 ── schema formats / enums for identity-critical fields */
  checkIdentity(v, err, warn);

  /* 5 ── Category-A rules */
  const ctx = buildContext(v);
  checkRegimeAndA23(v, err, warn, ctx);
  checkTotalsAndTax(v, err, warn, ctx);
  checkScheduleBP(v, err, warn, ctx);
  checkSalaryAndExempt(v, err, warn, ctx);
  checkHouseProperty(v, err, warn, ctx);
  checkOtherSources(v, err, warn, ctx);
  checkChapterVIA(v, err, warn, ctx);
  checkSchedule80G(v, err, warn, ctx);
  checkSchedule80GGC(v, err, warn, ctx);
  checkSchedule80D(v, err, warn, ctx);
  checkScheduleLinks(v, err, warn, ctx);
  checkTaxesPaid(v, err, warn, ctx);
}

/* ── 3b: house-property required fields (nested per row) ──────────────────── */

function checkHousePropertyRequired(v: Val, miss: Miss): void {
  rows(v('IncomeDeductions.PropertyDetails')).forEach((p, i) => {
    const base = `IncomeDeductions.PropertyDetails[${i}]`;
    const rent = obj(p['Rentdetails']);
    if (rent) {
      for (const [f, label] of HP_RENT_REQ) {
        if (isEmpty(rent[f])) miss(`${base}.Rentdetails.${f}`, `Property ${i + 1}: ${label}`, H_HP);
      }
      const s24 = obj(rent['Section24B']);
      if (s24) {
        if (isEmpty(s24['TotalInterestUs24B'])) {
          miss(`${base}.Rentdetails.Section24B.TotalInterestUs24B`, `Property ${i + 1}: total interest paid u/s 24(b)`, H_HP);
        }
        rows(s24['Section24BDtls']).forEach((l, j) => {
          for (const [f, label] of SEC24B_ROW_REQ) {
            if (isEmpty(l[f])) {
              miss(`${base}.Rentdetails.Section24B.Section24BDtls[${j}].${f}`, `Property ${i + 1}, loan ${j + 1}: ${label}`, H_HP);
            }
          }
        });
      }
    }
    rows(p['CoOwners']).forEach((c, j) => {
      for (const [f, label] of HP_COOWNER_REQ) {
        if (isEmpty(c[f])) miss(`${base}.CoOwners[${j}].${f}`, `Property ${i + 1}, co-owner ${j + 1}: ${label}`, H_HP);
      }
    });
    rows(p['TenantDetails']).forEach((t, j) => {
      for (const [f, label] of HP_TENANT_REQ) {
        if (isEmpty(t[f])) miss(`${base}.TenantDetails[${j}].${f}`, `Property ${i + 1}, tenant ${j + 1}: ${label}`, H_HP);
      }
    });
  });
}

function check80GRequired(v: Val, miss: Miss): void {
  for (const [table, tLabel] of G80_TABLES) {
    const t = obj(v(`Schedule80G.${table}`));
    if (!t) continue;
    rows(t['DoneeWithPan']).forEach((d, i) => {
      for (const [f, label] of G80_DONEE_REQ) {
        if (isEmpty(at(d, f))) {
          miss(`Schedule80G.${table}.DoneeWithPan[${i}].${f}`, `${tLabel}, donee ${i + 1}: ${label}`, 'Schedule 80G');
        }
      }
    });
  }
}

function check80DRequired(v: Val, miss: Miss): void {
  const h = obj(v('Schedule80D.Sec80DSelfFamSrCtznHealth'));
  if (!h) return;
  for (const [block, , label] of D80_BLOCKS) {
    const b = obj(h[block]);
    if (!b) continue;
    rows(b['Sch80DInsDtls']).forEach((r, i) => {
      const base = `Schedule80D.Sec80DSelfFamSrCtznHealth.${block}.Sch80DInsDtls[${i}]`;
      if (isEmpty(r['InsurerName'])) miss(`${base}.InsurerName`, `Schedule 80D ${label}, row ${i + 1}: name of the insurer`, 'Schedule 80D');
      if (isEmpty(r['PolicyNo'])) miss(`${base}.PolicyNo`, `Schedule 80D ${label}, row ${i + 1}: policy number`, 'Schedule 80D');
      if (isEmpty(r['HealthInsAmt'])) miss(`${base}.HealthInsAmt`, `Schedule 80D ${label}, row ${i + 1}: premium paid`, 'Schedule 80D');
    });
  }
}

const DIV_QUARTERS: Array<[string, string]> = [
  ['Upto15Of6', 'up to 15 June'],
  ['Upto15Of9', '16 June to 15 September'],
  ['Up16Of9To15Of12', '16 September to 15 December'],
  ['Up16Of12To15Of3', '16 December to 15 March'],
  ['Up16Of3To31Of3', '16 March to 31 March'],
];

function checkDividendQuarterlyRequired(v: Val, miss: Miss): void {
  rows(v('IncomeDeductions.OthersInc.OthersIncDtlsOthSrc')).forEach((r, i) => {
    const div = obj(r['DividendInc']);
    if (!div) return;
    const dr = obj(div['DateRange']);
    const base = `IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[${i}].DividendInc.DateRange`;
    if (!dr) {
      miss(base, `Other-sources row ${i + 1}: quarterly break-up of dividend income`, H_INC);
      return;
    }
    for (const [f, label] of DIV_QUARTERS) {
      if (isEmpty(dr[f])) miss(`${base}.${f}`, `Other-sources row ${i + 1}: dividend received ${label}`, H_INC);
    }
  });
}

/* ── 4: identity checks ───────────────────────────────────────────────────── */

function checkIdentity(v: Val, err: Err, warn: Warn): void {
  const pan = str(v('PersonalInfo.PAN'));
  if (pan && !PAN_RE.test(pan)) err('PersonalInfo.PAN', `PAN "${pan}" is not a valid PAN (AAAAA9999A).`, 'SCHEMA');

  const formName = str(v('Form_ITR4.FormName'));
  if (formName && formName !== 'ITR-4') {
    err('Form_ITR4.FormName', `Form name must be "ITR-4" (found "${formName}").`, 'SCHEMA');
  }
  const ayVal = str(v('Form_ITR4.AssessmentYear'));
  if (ayVal && ayVal !== '2026') {
    err('Form_ITR4.AssessmentYear', `Assessment year must be "2026" for AY 2026-27 (found "${ayVal}").`, 'SCHEMA');
  }
  const schemaVer = str(v('Form_ITR4.SchemaVer'));
  if (schemaVer && schemaVer !== 'Ver1.0') {
    err('Form_ITR4.SchemaVer', `Schema version must be "Ver1.0" (found "${schemaVer}").`, 'SCHEMA');
  }
  const formVer = str(v('Form_ITR4.FormVer'));
  if (formVer && formVer !== 'Ver1.0') {
    err('Form_ITR4.FormVer', `Form version must be "Ver1.0" (found "${formVer}").`, 'SCHEMA');
  }
  for (const f of ['SWCreatedBy', 'JSONCreatedBy'] as const) {
    const s = str(v(`CreationInfo.${f}`));
    if (s && !/^SW[0-9]{8}$/.test(s)) {
      err(`CreationInfo.${f}`, `${f} must be of the form "SW########" (found "${s}").`, 'SCHEMA');
    }
  }
  const jsonDate = str(v('CreationInfo.JSONCreationDate'));
  if (jsonDate && !DATE_RE.test(jsonDate)) {
    err('CreationInfo.JSONCreationDate', 'JSON creation date must be in YYYY-MM-DD format.', 'SCHEMA');
  }

  const dob = str(v('PersonalInfo.DOB'));
  if (dob && !DATE_RE.test(dob)) err('PersonalInfo.DOB', `Date of birth "${dob}" must be in YYYY-MM-DD format.`, 'SCHEMA');

  const verPan = str(v('Verification.Declaration.AssesseeVerPAN'));
  if (verPan && !PAN_RE.test(verPan)) {
    err('Verification.Declaration.AssesseeVerPAN', 'PAN of the verifier is not a valid PAN.', 'SCHEMA');
  }
  const capacity = str(v('Verification.Capacity'));
  if (capacity && !CAPACITY_ENUM.includes(capacity)) {
    err('Verification.Capacity', `Capacity must be S, R, K or P (found "${capacity}").`, 'SCHEMA');
  }
  const status = str(v('PersonalInfo.Status'));
  if (status && !STATUS_ENUM.includes(status)) {
    err('PersonalInfo.Status', `Status must be I (Individual), H (HUF) or F (Firm other than LLP) — found "${status}".`, 'SCHEMA');
  }
  const empCat = str(v('PersonalInfo.EmployerCategory'));
  if (empCat && !EMPLOYER_ENUM.includes(empCat)) {
    err('PersonalInfo.EmployerCategory', `Nature of employment "${empCat}" is not a valid employer category.`, 'SCHEMA');
  }
  const rfs = v('FilingStatus.ReturnFileSec');
  if (!isEmpty(rfs) && !RETURN_FILE_SEC.includes(num(rfs))) {
    err('FilingStatus.ReturnFileSec', `Filing section code ${String(rfs)} is not a valid ITR-4 filing-section code.`, 'SCHEMA');
  }
  const aadhaar = v('PersonalInfo.AadhaarCardNo');
  if (!isEmpty(aadhaar) && !AADHAAR_RE.test(str(aadhaar))) {
    err('PersonalInfo.AadhaarCardNo', 'Aadhaar number must be exactly 12 digits.', 'SCHEMA');
  }
  const email = str(v('PersonalInfo.Address.EmailAddress'));
  if (email && !EMAIL_RE.test(email)) {
    err('PersonalInfo.Address.EmailAddress', `E-mail address "${email}" is not valid.`, 'SCHEMA');
  }
  // A-259 — a valid mobile number must be quoted
  const ccMobile = num(v('PersonalInfo.Address.CountryCodeMobile'));
  const mobile = v('PersonalInfo.Address.MobileNo');
  if (!isEmpty(mobile) && ccMobile === 91 && !/^[1-9][0-9]{9}$/.test(String(num(mobile)))) {
    err('PersonalInfo.Address.MobileNo', 'Mobile number must be a valid 10-digit Indian mobile number.', 'A-259');
  }
  // A-234 — due date u/s 139(1) for AY 2026-27
  const dueDate = str(v('FilingStatus.ItrFilingDueDate'));
  if (dueDate && dueDate !== '2026-08-31') {
    err('FilingStatus.ItrFilingDueDate', 'Due date of filing u/s 139(1) must be "2026-08-31" for AY 2026-27.', 'A-234');
  }
  // A-318 / A-319 — a person formed after the previous year cannot file for AY 2026-27
  const status2 = str(v('PersonalInfo.Status'));
  if (dob && DATE_RE.test(dob)) {
    if ((status2 === 'F' || status2 === 'H') && dob >= '2026-04-01') {
      err('PersonalInfo.DOB', 'A Firm or HUF with a date of formation on or after 01/04/2026 cannot file a return for AY 2026-27.', 'A-318');
    }
    if (status2 === 'I' && dob > PY_END) {
      warn('PersonalInfo.DOB', 'An individual born after the end of the previous year (31/03/2026) cannot file a return for AY 2026-27.', 'A-319');
    }
  }
  // A-411 — a secondary address must be supplied and must differ from the primary one
  const secAdd = str(v('PersonalInfo.SecondaryAdd'));
  const alt = obj(v('PersonalInfo.AlternateAddress'));
  if (secAdd === 'N') {
    if (!alt) {
      err('PersonalInfo.AlternateAddress', 'The secondary address is stated to be different from the primary address, so the secondary address must be provided.', 'A-410');
    } else {
      const key = (o: Obj | null) => [
        str(o?.['ResidenceNo']), str(o?.['LocalityOrArea']),
        str(o?.['CityOrTownOrDistrict']), str(o?.['StateCode']), str(o?.['PinCode']),
      ].join('|').toUpperCase();
      if (key(alt) === key(obj(v('PersonalInfo.Address')))) {
        err('PersonalInfo.AlternateAddress', 'The secondary address must not be the same as the primary address when "No" is selected for "Is the secondary address same as primary address?".', 'A-411');
      }
    }
  }
  // Bank IFSC format (rule 123 checks the RBI database — format is all we can test)
  rows(v('Refund.BankAccountDtls.AddtnlBankDetails')).forEach((b, i) => {
    const ifsc = str(b['IFSCCode']);
    if (ifsc && !IFSC_RE.test(ifsc)) {
      err(`Refund.BankAccountDtls.AddtnlBankDetails[${i}].IFSCCode`, `Bank account ${i + 1}: IFSC code "${ifsc}" is not in the valid format (AAAA0######).`, 'A-123');
    }
  });
  // exactly one account must be flagged for the refund
  const banks = rows(v('Refund.BankAccountDtls.AddtnlBankDetails'));
  if (banks.length > 0 && !banks.some((b) => str(b['UseForRefund']).toLowerCase() === 'true')) {
    warn('Refund.BankAccountDtls.AddtnlBankDetails', 'No bank account has been flagged for the refund — mark one account with "Use for refund".');
  }
}

/* ── shared derived context ───────────────────────────────────────────────── */

interface Ctx {
  status: string;
  isIndividual: boolean;
  isHUF: boolean;
  isFirm: boolean;
  empCat: string;
  isSenior: boolean;         // DOB on or before 01/04/1966
  oldRegime: boolean;
  newRegime: boolean;
  gti: number;               // GrossTotIncome (excluding LTCG u/s 112A)
  gtiLtcg: number;           // GrossTotIncomeIncLTCG112A
  salary171: number;
  grossSalary: number;
  pan: string;
  verPan: string;
  claimed: (field: string) => number;   // DeductUndChapVIA (system-computed)
  entered: (field: string) => number;   // UsrDeductUndChapVIA (user-entered)
}

function buildContext(v: Val): Ctx {
  const status = str(v('PersonalInfo.Status'));
  const isFirm = status === 'F';
  const dob = str(v('PersonalInfo.DOB'));

  const a23 = str(v('FilingStatus.Form10IEAEarlierAYOldRegime'));
  const reEnteredNew = str(v('FilingStatus.F10IEAEarlierAYNewRegime'));
  const currNew = str(v('FilingStatus.F10IEACurrAYNewRegime'));
  const currOld = str(v('FilingStatus.F10IEACurrAYOldRegime'));
  // Old regime applies when the assessee has a live opt-out through Form 10-IEA:
  //  • A23 = Y (10-IEA filed in an earlier AY) and the assessee has NOT re-entered
  //    the new regime, either in an earlier AY or in the current AY; or
  //  • A23 = N and Form 10-IEA has been furnished for the current AY.
  const optedOld = (a23 === 'Y' && reEnteredNew !== 'Y' && currNew !== 'Y') || (a23 === 'N' && currOld === 'Y');
  const oldRegime = isFirm || optedOld;

  const via = (block: string) => (field: string) => num(v(`IncomeDeductions.${block}.${field}`));

  return {
    status,
    isIndividual: status === 'I',
    isHUF: status === 'H',
    isFirm,
    empCat: str(v('PersonalInfo.EmployerCategory')),
    isSenior: DATE_RE.test(dob) && dob <= '1966-04-01',
    oldRegime,
    newRegime: !oldRegime,
    gti: num(v('IncomeDeductions.GrossTotIncome')),
    gtiLtcg: num(v('IncomeDeductions.GrossTotIncomeIncLTCG112A')),
    salary171: num(v('IncomeDeductions.Salary')),
    grossSalary: num(v('IncomeDeductions.GrossSalary')),
    pan: str(v('PersonalInfo.PAN')),
    verPan: str(v('Verification.Declaration.AssesseeVerPAN')),
    claimed: via('DeductUndChapVIA'),
    entered: via('UsrDeductUndChapVIA'),
  };
}

/* ── 5a: A23 / Form 10-IEA tree and representative assessee ───────────────── */

function checkRegimeAndA23(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const a23 = str(v('FilingStatus.Form10IEAEarlierAYOldRegime'));
  const earlierAY = v('FilingStatus.Form10IEAAssYear');
  const earlierAck = v('FilingStatus.Form10IEAEarlierAYAckOldRegime');
  const reEnteredNew = str(v('FilingStatus.F10IEAEarlierAYNewRegime'));
  const newAY = v('FilingStatus.AssYrF10IEANewTaxReg');
  const newAck = v('FilingStatus.Form10IEAEarlierAYAckNewRegime');
  const currNew = str(v('FilingStatus.F10IEACurrAYNewRegime'));
  const currNewDate = v('FilingStatus.F10IEADateCurrAYNewTax');
  const currNewAck = v('FilingStatus.F10IEAAckNoCurrAYNewTax');
  const currOld = str(v('FilingStatus.F10IEACurrAYOldRegime'));
  const currOldDate = v('FilingStatus.F10IEADateCurrAYOldTax');
  const currOldAck = v('FilingStatus.F10IEAAckNoCurrAYOldTax');

  // A-260 — an option at A23 is mandatory for individuals and HUFs
  if ((c.isIndividual || c.isHUF) && (a23 === '' || a23 === 'NA')) {
    err('FilingStatus.Form10IEAEarlierAYOldRegime', 'It is mandatory to select an option for the 115BAC question at sl. no. A23.', 'A-260');
  }
  // A-235 / A-264 — the regime questions do not apply to a Firm (other than LLP)
  if (c.isFirm) {
    if (a23 && a23 !== 'NA') {
      err('FilingStatus.Form10IEAEarlierAYOldRegime', 'Tax regimes are not applicable to a Firm (other than LLP) — A23 must be "NA".', 'A-235');
    }
    const anyA23 = [earlierAY, earlierAck, reEnteredNew, newAY, newAck, currNew, currNewDate, currNewAck,
      currOld, currOldDate, currOldAck].some((x) => !isEmpty(x));
    if (anyA23) {
      err('FilingStatus.Form10IEAEarlierAYOldRegime', 'No field of A23 may carry a value when the status is Firm (other than LLP).', 'A-264');
    }
  }
  // A-321 — only one of branch A23(A) and branch A23(B) may be answered
  const branchA = !isEmpty(earlierAY) || !isEmpty(earlierAck) || reEnteredNew !== '';
  const branchB = currOld !== '' || !isEmpty(currOldDate) || !isEmpty(currOldAck);
  if (branchA && branchB) {
    err('FilingStatus.Form10IEAEarlierAYOldRegime', 'Based on the response at A23, only one of A23(A) and A23(B) may be answered.', 'A-321');
  }
  if (a23 === 'Y') {
    // A-228 / A-353 — A23(A)(i) details of the earlier-AY Form 10-IEA
    if (isEmpty(earlierAY) || isEmpty(earlierAck)) {
      err('FilingStatus.Form10IEAAssYear', 'A23(A)(i): the assessment year and the acknowledgement number of the Form 10-IEA filed in an earlier AY are mandatory when A23 is answered "Yes".', 'A-353');
    }
    // A23(A)(ii)
    if (reEnteredNew === '') {
      err('FilingStatus.F10IEAEarlierAYNewRegime', 'A23(A)(ii): state whether the new tax regime was re-entered by filing Form 10-IEA in a subsequent assessment year.', 'A-363');
    } else if (reEnteredNew === 'Y') {
      // A-355 — A23(A)(ii)(a)
      if (isEmpty(newAY) || isEmpty(newAck)) {
        err('FilingStatus.AssYrF10IEANewTaxReg', 'A23(A)(ii)(a): the assessment year and the acknowledgement number of the Form 10-IEA filed to re-enter the new tax regime are mandatory.', 'A-355');
      }
      // A-393 — the re-entry AY must be later than the opt-out AY
      const oldAY = str(earlierAY);
      const reAY = str(newAY);
      if (oldAY && reAY && reAY <= oldAY) {
        err('FilingStatus.AssYrF10IEANewTaxReg', `The assessment year at A23(A)(ii)(a) (${reAY}) must be later than the assessment year at A23(A)(i) (${oldAY}).`, 'A-393');
      }
    } else if (reEnteredNew === 'N') {
      // A-356 — A23(A)(ii)(b)
      if (currNew === '') {
        err('FilingStatus.F10IEACurrAYNewRegime', 'A23(A)(ii)(b): state whether Form 10-IEA has been furnished to re-enter the new tax regime in the current assessment year.', 'A-356');
      } else if (currNew === 'Y' && (isEmpty(currNewDate) || isEmpty(currNewAck))) {
        // A-357 — A23(A)(ii)(b)(i)
        err('FilingStatus.F10IEADateCurrAYNewTax', 'A23(A)(ii)(b)(i): the date of filing and the acknowledgement number of the Form 10-IEA furnished for the current AY are mandatory.', 'A-357');
      } else if (currNew === 'N' && (!isEmpty(currNewDate) || !isEmpty(currNewAck))) {
        // A-358
        err('FilingStatus.F10IEADateCurrAYNewTax', 'A23(A)(ii)(b)(i) is not applicable because A23(A)(ii)(b) is answered "No" — remove the Form 10-IEA details.', 'A-358');
      }
    }
  } else if (a23 === 'N') {
    // A-354 — A23(B) is mandatory
    if (currOld === '') {
      err('FilingStatus.F10IEACurrAYOldRegime', 'A23(B): state whether Form 10-IEA has been furnished within the due date for the current assessment year to choose the old tax regime.', 'A-354');
    } else if (currOld === 'Y' && (isEmpty(currOldDate) || isEmpty(currOldAck))) {
      // A-359 — A23(B)(i)
      err('FilingStatus.F10IEADateCurrAYOldTax', 'A23(B)(i): the date of filing and the acknowledgement number of the Form 10-IEA furnished for the current AY are mandatory.', 'A-359');
    } else if (currOld === 'N' && (!isEmpty(currOldDate) || !isEmpty(currOldAck))) {
      // A-360
      err('FilingStatus.F10IEADateCurrAYOldTax', 'A23(B)(i) is not applicable because A23(B) is answered "No" — remove the Form 10-IEA details.', 'A-360');
    }
  }
  // A-361 / A-362 / A-363 / A-364 — a filled sub-question implies its parent
  if ((!isEmpty(currOldDate) || !isEmpty(currOldAck)) && currOld === '') {
    err('FilingStatus.F10IEACurrAYOldRegime', 'Form 10-IEA details are filled at A23(B)(i), so A23(B) cannot be left blank.', 'A-361');
  }
  if ((!isEmpty(currNewDate) || !isEmpty(currNewAck)) && currNew === '') {
    err('FilingStatus.F10IEACurrAYNewRegime', 'Form 10-IEA details are filled at A23(A)(ii)(b)(i), so A23(A)(ii)(b) cannot be left blank.', 'A-362');
  }
  if ((!isEmpty(newAY) || !isEmpty(newAck) || currNew !== '') && reEnteredNew === '') {
    err('FilingStatus.F10IEAEarlierAYNewRegime', 'Details are filled at A23(A)(ii)(a) or A23(A)(ii)(b), so A23(A)(ii) cannot be left blank.', 'A-363');
  }
  if ((!isEmpty(earlierAY) || !isEmpty(earlierAck) || reEnteredNew !== '') && a23 !== 'Y') {
    err('FilingStatus.Form10IEAEarlierAYOldRegime', 'Details are filled at A23(A)(i) or A23(A)(ii), so A23(A) cannot be blank — answer A23 as "Yes".', 'A-364');
  }

  /* representative assessee — A-45 / A-344 / A-345 / A-403 */
  const repFlg = str(v('FilingStatus.AsseseeRepFlg'));
  const capacity = str(v('Verification.Capacity'));
  const rep = obj(v('FilingStatus.AssesseeRep'));
  if ((repFlg === 'Y' || capacity === 'R') && !rep) {
    err('FilingStatus.AssesseeRep', 'The name, e-mail ID and contact number of the representative assessee are mandatory when the return is filed by a representative.', repFlg === 'Y' ? 'A-345' : 'A-344');
  }
  if (rep) {
    const repEmail = str(rep['RepEmailID']).toLowerCase();
    const repMobile = String(num(rep['RepMobileNo']));
    const ownEmail = str(v('PersonalInfo.Address.EmailAddress')).toLowerCase();
    const ownMobile = String(num(v('PersonalInfo.Address.MobileNo')));
    if (repEmail && repEmail === ownEmail) {
      err('FilingStatus.AssesseeRep.RepEmailID', 'The e-mail ID of the representative assessee must not match the e-mail ID of the taxpayer.', 'A-403');
    }
    if (repMobile !== '0' && repMobile === ownMobile) {
      err('FilingStatus.AssesseeRep.RepMobileNo', 'The contact number of the representative assessee must not match the contact number of the taxpayer.', 'A-403');
    }
    if (repFlg !== 'Y' && capacity !== 'R') {
      warn('FilingStatus.AssesseeRep', 'Representative-assessee details are present although the return is not marked as filed by a representative.', 'A-345');
    }
  }
}

/* ── 5b: totals, tax computation, rebate ──────────────────────────────────── */

function checkTotalsAndTax(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const bp = num(v('IncomeDeductions.IncomeFromBusinessProf'));
  const sal = num(v('IncomeDeductions.IncomeFromSal'));
  const hp = num(v('IncomeDeductions.TotalIncomeChargeableUnHP'));
  const os = num(v('IncomeDeductions.IncomeOthSrc'));
  const ltcg = num(v('LTCG112A.LongCap112A'));
  const totVIA = num(v('IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions'));
  const totalIncome = num(v('IncomeDeductions.TotalIncome'));

  // A-49 / A-196 / A-197 — gross total income build-up
  const expectGti = bp + sal + hp + os;
  if (!isEmpty(v('IncomeDeductions.GrossTotIncome')) && ne(c.gti, expectGti)) {
    err('IncomeDeductions.GrossTotIncome', `B5: gross total income (${c.gti}) must equal the total of income from business & profession, salary, house property and other sources (${expectGti}).`, c.oldRegime ? 'A-49' : 'A-196');
  }
  // A-343 — LTCG u/s 112A is the difference between the two gross-total-income figures
  if (!isEmpty(v('IncomeDeductions.GrossTotIncomeIncLTCG112A')) && ne(c.gtiLtcg - c.gti, ltcg)) {
    err('IncomeDeductions.GrossTotIncomeIncLTCG112A', `LTCG u/s 112A (${ltcg}) must equal the difference between the gross total income including LTCG (${c.gtiLtcg}) and the gross total income excluding LTCG (${c.gti}).`, 'A-343');
  }
  // A-46 — total income
  if (!isEmpty(v('IncomeDeductions.TotalIncome')) && ne(totalIncome, c.gtiLtcg - totVIA)) {
    err('IncomeDeductions.TotalIncome', `B6: total income (${totalIncome}) must equal the gross total income including LTCG u/s 112A (${c.gtiLtcg}) less the total Chapter VI-A deductions (${totVIA}).`, 'A-46');
  }
  // A-267 — ITR-4 eligibility ceiling
  if (c.gti > 5000000) {
    err('IncomeDeductions.GrossTotIncome', 'Total income excluding LTCG u/s 112A cannot exceed Rs. 50,00,000 in ITR-4.', 'A-267');
  }
  // A-265 / A-266 — LTCG u/s 112A in Schedule EI
  if (obj(v('LTCG112A'))) {
    if (ltcg > 125000) {
      err('LTCG112A.LongCap112A', `Long-term capital gains u/s 112A (${ltcg}) cannot exceed Rs. 1,25,000 in ITR-4.`, 'A-265');
    }
    const expect = num(v('LTCG112A.TotSaleCnsdrn')) - num(v('LTCG112A.TotCstAcqisn'));
    if (!isEmpty(v('LTCG112A.LongCap112A')) && ne(ltcg, expect)) {
      err('LTCG112A.LongCap112A', `Schedule EI sl. iii: LTCG u/s 112A (${ltcg}) must equal the total sale consideration less the total cost of acquisition (${expect}).`, 'A-266');
    }
  }

  /* tax computation chain */
  const taxPayable = num(v('TaxComputation.TotalTaxPayable'));
  const rebate = num(v('TaxComputation.Rebate87A'));
  const afterRebate = num(v('TaxComputation.TaxPayableOnRebate'));
  const cess = num(v('TaxComputation.EducationCess'));
  const grossLiab = num(v('TaxComputation.GrossTaxLiability'));
  const relief89 = num(v('TaxComputation.Section89'));
  const netLiab = num(v('TaxComputation.NetTaxLiability'));
  const i234a = num(v('TaxComputation.IntrstPay.IntrstPayUs234A'));
  const i234b = num(v('TaxComputation.IntrstPay.IntrstPayUs234B'));
  const i234c = num(v('TaxComputation.IntrstPay.IntrstPayUs234C'));
  const fee234f = num(v('TaxComputation.IntrstPay.LateFilingFee234F'));
  const totTaxPlus = num(v('TaxComputation.TotTaxPlusIntrstPay'));

  // A-52
  if (!isEmpty(v('TaxComputation.TaxPayableOnRebate')) && ne(afterRebate, Math.max(taxPayable - rebate, 0))) {
    err('TaxComputation.TaxPayableOnRebate', `D3: tax after rebate (${afterRebate}) must equal the tax payable on total income less the rebate u/s 87A (${Math.max(taxPayable - rebate, 0)}).`, 'A-52');
  }
  // A-53
  if (!isEmpty(v('TaxComputation.GrossTaxLiability')) && ne(grossLiab, afterRebate + cess)) {
    err('TaxComputation.GrossTaxLiability', `D5: total tax and cess (${grossLiab}) must equal the tax payable after rebate plus the health & education cess (${afterRebate + cess}).`, 'A-53');
  }
  // A-56
  if (!isEmpty(v('TaxComputation.NetTaxLiability')) && ne(netLiab, Math.max(grossLiab - relief89, 0))) {
    err('TaxComputation.NetTaxLiability', `D7: balance tax after relief (${netLiab}) must equal the total tax and cess less the relief u/s 89(1) (${Math.max(grossLiab - relief89, 0)}).`, 'A-56');
  }
  // A-54
  const expectTotTax = netLiab + i234a + i234b + i234c + fee234f;
  if (!isEmpty(v('TaxComputation.TotTaxPlusIntrstPay')) && ne(totTaxPlus, expectTotTax)) {
    err('TaxComputation.TotTaxPlusIntrstPay', `D10: total tax, fee and interest (${totTaxPlus}) must equal the balance tax after relief plus interest u/s 234A/234B/234C and the fee u/s 234F (${expectTotTax}).`, 'A-54');
  }
  // A-392 / A-397 — fee u/s 234-I on a revised return furnished after 31/12/2026.
  // The date of furnishing is not in the payload; CreationInfo.JSONCreationDate is
  // used as the proxy the utility itself stamps on the return.
  if (num(v('FilingStatus.ReturnFileSec')) === SEC_139_5_REVISED) {
    const filedOn = str(v('CreationInfo.JSONCreationDate'));
    if (DATE_RE.test(filedOn) && filedOn > REVISED_FEE_CUTOFF) {
      const expectedFee = totalIncome > 500000 ? 5000 : 1000;
      if (ne(fee234f, expectedFee)) {
        err('TaxComputation.IntrstPay.LateFilingFee234F', `A revised return u/s 139(5) furnished after 31/12/2026 with a total income ${totalIncome > 500000 ? 'exceeding' : 'not exceeding'} Rs. 5,00,000 attracts a fee of Rs. ${expectedFee.toLocaleString('en-IN')} (entered ${fee234f}).`, totalIncome > 500000 ? 'A-397' : 'A-392');
      }
    }
  }
  // A-162 — relief u/s 89 requires salary or family pension
  if (relief89 > 0) {
    const fam = familyPension(v);
    if (c.grossSalary === 0 && fam === 0) {
      err('TaxComputation.Section89', 'Relief u/s 89 cannot be claimed when the details of salary and family pension are zero or blank.', 'A-162');
    }
  }
  // A-124 — tax computed but no gross total income
  if (c.gtiLtcg === 0 && taxPayable > 0) {
    err('TaxComputation.TotalTaxPayable', 'Tax computation has been disclosed although the gross total income is zero.', 'A-124');
  }
  // A-125 — taxes paid without any income / tax computation
  const totalPaid = num(v('TaxPaid.TaxesPaid.TotalTaxesPaid'));
  if (c.gtiLtcg === 0 && taxPayable === 0 && totalPaid > 0) {
    err('TaxPaid.TaxesPaid.TotalTaxesPaid', 'Details of taxes paid have been disclosed although income details and the tax computation have not been disclosed.', 'A-125');
  }

  /* rebate u/s 87A — A-50 / A-51 / A-227 / A-229 */
  if (rebate > 0) {
    if (c.isHUF || c.isFirm) {
      err('TaxComputation.Rebate87A', 'Rebate u/s 87A cannot be claimed by an HUF or a Firm (other than LLP).', 'A-50');
    }
    if (c.oldRegime && !c.isFirm) {
      if (totalIncome > 500000) {
        err('TaxComputation.Rebate87A', `Rebate u/s 87A cannot be claimed under the old tax regime when the total income (${totalIncome}) exceeds Rs. 5,00,000.`, 'A-51');
      }
      if (rebate > 12500) {
        err('TaxComputation.Rebate87A', `Under the old tax regime the rebate u/s 87A is limited to Rs. 12,500 (claimed ${rebate}).`, 'A-229');
      }
    }
    if (c.newRegime && totalIncome - ltcg > 1275000) {
      err('TaxComputation.Rebate87A', `Rebate u/s 87A cannot be claimed when the total income excluding LTCG u/s 112A (${totalIncome - ltcg}) exceeds Rs. 12,00,000 after allowing for marginal relief.`, 'A-227');
    }
  }
  // schema ceiling on the total income field
  if (totalIncome > 5125000) {
    warn('IncomeDeductions.TotalIncome', 'Total income exceeds the maximum value the ITR-4 schema accepts (Rs. 51,25,000) — ITR-3 or ITR-5 is applicable.', 'A-267');
  }
}

function familyPension(v: Val): number {
  return rows(v('IncomeDeductions.OthersInc.OthersIncDtlsOthSrc'))
    .filter((r) => str(r['OthSrcNatureDesc']) === 'FAP')
    .reduce((t, r) => t + num(r['OthSrcOthAmount']), 0);
}

/* ── 5c: Schedule BP — presumptive income ─────────────────────────────────── */

function checkScheduleBP(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const bpIncome = num(v('IncomeDeductions.IncomeFromBusinessProf'));
  const bp = obj(v('ScheduleBP'));
  const ad = obj(v('ScheduleBP.PersumptiveInc44AD'));
  const ada = obj(v('ScheduleBP.PersumptiveInc44ADA'));
  const ae = obj(v('ScheduleBP.PersumptiveInc44AE'));

  // A-1 — business income declared but Schedule BP not filled
  if (bpIncome > 0 && !bp) {
    err('ScheduleBP', 'Income u/s 44AD / 44ADA / 44AE is disclosed in Part B — Gross Total Income but Schedule BP is not filled.', 'A-1');
    return;
  }
  // A-140 — ITR-4 filed without any presumptive income
  const inc44AD = num(ad?.['TotPersumptiveInc44AD']);
  const inc44ADA = num(ada?.['TotPersumptiveInc44ADA']);
  const inc44AE = num(ae?.['TotPersumInc44AE']);
  if (inc44AD + inc44ADA + inc44AE === 0) {
    err('ScheduleBP', 'The return is filed in ITR-4, but no income from business or profession is disclosed u/s 44AD, 44AE or 44ADA as required by rule 12(1)(ca).', 'A-140');
  }
  // A-2 — Part B business income must agree with Schedule BP
  const incChargeable = num(ae?.['IncChargeableUnderBus']);
  if (ae && !isEmpty(ae['IncChargeableUnderBus']) && ne(bpIncome, incChargeable)) {
    err('IncomeDeductions.IncomeFromBusinessProf', `B1: business income (${bpIncome}) is not consistent with the income chargeable under business or profession in Schedule BP (${incChargeable}).`, 'A-2');
  }

  /* 44AD — rules 5-12, 237, 240 */
  if (ad) {
    const grossTotal = num(ad['GrsTotalTrnOver']);
    const bank = num(ad['GrsTrnOverBank']);
    const cash = num(ad['GrsTotalTrnOverInCash']);
    const other = num(ad['GrsTrnOverAnyOthMode']);
    const p6 = num(ad['PersumptiveInc44AD6Per']);
    const p8 = num(ad['PersumptiveInc44AD8Per']);
    // A-240
    if (!isEmpty(ad['GrsTotalTrnOver']) && ne(grossTotal, bank + cash + other)) {
      err('ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver', `E1: gross turnover u/s 44AD (${grossTotal}) must equal the sum of E1a, E1b and E1c (${bank + cash + other}).`, 'A-240');
    }
    // A-5
    if (bank > 0 && p6 < Math.ceil(bank * 0.06)) {
      err('ScheduleBP.PersumptiveInc44AD.PersumptiveInc44AD6Per', `Presumptive income u/s 44AD on receipts through prescribed banking modes (${p6}) must be at least 6% of Rs. ${bank} (${Math.ceil(bank * 0.06)}).`, 'A-5');
    }
    // A-6
    const otherModes = cash + other;
    if (otherModes > 0 && p8 < Math.ceil(otherModes * 0.08)) {
      err('ScheduleBP.PersumptiveInc44AD.PersumptiveInc44AD8Per', `Presumptive income u/s 44AD on receipts in any other mode (${p8}) must be at least 8% of Rs. ${otherModes} (${Math.ceil(otherModes * 0.08)}).`, 'A-6');
    }
    // A-7
    if (!isEmpty(ad['TotPersumptiveInc44AD']) && ne(inc44AD, p6 + p8)) {
      err('ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD', `E2: total presumptive income u/s 44AD (${inc44AD}) must equal the sum of the 6% and the 8% components (${p6 + p8}).`, 'A-7');
    }
    // A-8
    if (inc44AD > grossTotal) {
      err('ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD', `Income u/s 44AD (${inc44AD}) cannot exceed the gross turnover or gross receipts (${grossTotal}).`, 'A-8');
    }
    // A-9
    if (grossTotal > 30000000) {
      err('ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver', `Gross receipts / turnover u/s 44AD (${grossTotal}) exceed Rs. 3 crore — ITR-4 cannot be used.`, 'A-9');
    }
    // A-237
    if (grossTotal > 20000000 && cash > grossTotal * 0.05) {
      err('ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOverInCash', 'Gross receipts u/s 44AD exceed Rs. 2 crore and cash receipts exceed 5% of the total receipts — a tax audit u/s 44AB is mandatory, so ITR-3 or ITR-5 must be used.', 'A-237');
    }
    // A-11 / A-12
    const codes44AD = rows(v('ScheduleBP.NatOfBus44AD'));
    if (inc44AD > 0 && codes44AD.length === 0) {
      err('ScheduleBP.NatOfBus44AD', 'Income is declared u/s 44AD, so it is mandatory to select the business code u/s 44AD.', 'A-11');
    }
    if (inc44AD === 0 && codes44AD.length > 0) {
      err('ScheduleBP.PersumptiveInc44AD.TotPersumptiveInc44AD', 'A business code u/s 44AD is selected, so it is mandatory to declare income u/s 44AD.', 'A-12');
    }
    // A-10 — 44AD is not available to commission agents / professionals u/s 44AA(1)
    for (const [i, r] of codes44AD.entries()) {
      const code = str(r['CodeAD']);
      if (/^09|^16|^14/.test(code)) {
        warn(`ScheduleBP.NatOfBus44AD[${i}].CodeAD`, `Business code ${code}: the provisions of section 44AD do not apply to general commission agents or to persons carrying on a profession referred to in section 44AA(1).`, 'A-10');
      }
    }
  }

  /* 44ADA — rules 13-17, 212, 238, 239 */
  if (ada) {
    const receipts = num(ada['GrsReceipt']);
    const bank = num(ada['GrsTrnOverBank44ADA']);
    const cash = num(ada['GrsTotalTrnOverInCash44ADA']);
    const other = num(ada['GrsTrnOverAnyOthMode44ADA']);
    // A-239
    if (!isEmpty(ada['GrsReceipt']) && ne(receipts, bank + cash + other)) {
      err('ScheduleBP.PersumptiveInc44ADA.GrsReceipt', `E3: gross receipts u/s 44ADA (${receipts}) must equal the sum of E3a, E3b and E3c (${bank + cash + other}).`, 'A-239');
    }
    // A-13
    if (inc44ADA > receipts) {
      err('ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA', `Income u/s 44ADA (${inc44ADA}) cannot exceed the corresponding gross receipts (${receipts}).`, 'A-13');
    }
    // A-14
    if (receipts > 0 && inc44ADA < Math.ceil(receipts * 0.5)) {
      err('ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA', `Presumptive income u/s 44ADA (${inc44ADA}) cannot be less than 50% of the gross receipts (${Math.ceil(receipts * 0.5)}).`, 'A-14');
    }
    // A-238
    if (receipts > 5000000 && cash > receipts * 0.05) {
      err('ScheduleBP.PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA', 'Gross receipts u/s 44ADA exceed Rs. 50,00,000 and cash receipts exceed 5% of the total receipts — a tax audit u/s 44AB is mandatory, so ITR-3 or ITR-5 must be used.', 'A-238');
    }
    // A-212
    if (inc44ADA > 0 && c.isHUF) {
      err('ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA', 'An HUF is not eligible to claim presumptive income u/s 44ADA.', 'A-212');
    }
    // A-16 / A-17
    const codes44ADA = rows(v('ScheduleBP.NatOfBus44ADA'));
    if (inc44ADA > 0 && codes44ADA.length === 0) {
      err('ScheduleBP.NatOfBus44ADA', 'Income is declared u/s 44ADA, so it is mandatory to select the profession code u/s 44ADA.', 'A-16');
    }
    if (inc44ADA === 0 && codes44ADA.length > 0) {
      err('ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA', 'A profession code u/s 44ADA is selected, so it is mandatory to declare income u/s 44ADA.', 'A-17');
    }
    // A-15 — 44ADA is available only to a specified profession: the code chosen must
    // be one of the profession codes of the schema, never a business code.
    codes44ADA.forEach((r, i) => {
      const code = str(r['CodeADA']);
      if (code && !PROF_CODES_44ADA.includes(code)) {
        err(`ScheduleBP.NatOfBus44ADA[${i}].CodeADA`, `Row ${i + 1}: the code "${code}" is not a profession code — the provisions of section 44ADA do not apply to persons carrying on a business.`, 'A-15');
      }
    });
  }

  /* 44AE — rules 97, 135-138, 141, 144, 213 */
  const carriages = rows(v('ScheduleBP.GoodsDtlsUs44AE'));
  if (ae) {
    // A-135
    if (inc44AE > 0 && carriages.length === 0) {
      err('ScheduleBP.GoodsDtlsUs44AE', 'The value at E5 is greater than zero but the details of the goods carriages (Schedule 44AE) have not been filled.', 'A-135');
    }
    // A-136
    const carriageSum = sum(carriages, 'PresumptiveIncome');
    if (carriages.length > 0 && ne(inc44AE, carriageSum)) {
      err('ScheduleBP.PersumptiveInc44AE.TotPersumInc44AE', `E5: the presumptive income from goods carriages (${inc44AE}) must equal the total of the per-vehicle presumptive income (${carriageSum}).`, 'A-136');
    }
    // A-97
    const salIntFirm = num(ae['SalInterestByFirm']);
    const totalPresumptive = num(ae['TotalPersumptiveInc']);
    if (!isEmpty(ae['TotalPersumptiveInc']) && ne(totalPresumptive, inc44AE - salIntFirm)) {
      err('ScheduleBP.PersumptiveInc44AE.TotalPersumptiveInc', `E7: the presumptive income u/s 44AE (${totalPresumptive}) must be the presumptive income from goods carriages reduced by the salary and interest paid to partners (${inc44AE - salIntFirm}).`, 'A-97');
    }
    if (salIntFirm > 0 && !c.isFirm) {
      err('ScheduleBP.PersumptiveInc44AE.SalInterestByFirm', 'Salary and interest paid to partners may be deducted u/s 44AE only where the status is Firm (other than LLP).', 'A-97');
    }
    // A-137 / A-138
    const codes44AE = rows(v('ScheduleBP.NatOfBus44AE'));
    if (inc44AE > 0 && codes44AE.length === 0) {
      err('ScheduleBP.NatOfBus44AE', 'Income is declared u/s 44AE, so it is mandatory to select the business code u/s 44AE.', 'A-137');
    }
    if (inc44AE === 0 && codes44AE.length > 0) {
      err('ScheduleBP.PersumptiveInc44AE.TotPersumInc44AE', 'A business code u/s 44AE is selected, so it is mandatory to declare income u/s 44AE.', 'A-138');
    }
  }
  const seenReg = new Set<string>();
  carriages.forEach((g, i) => {
    // A-141
    const months = num(g['HoldingPeriod']);
    if (months > 12) {
      err(`ScheduleBP.GoodsDtlsUs44AE[${i}].HoldingPeriod`, `Goods carriage ${i + 1}: the number of months for which the carriage was owned / leased / hired cannot exceed 12.`, 'A-141');
    }
    // A-144
    const tonnage = num(g['TonnageCapacity']);
    const income = num(g['PresumptiveIncome']);
    const floor = tonnage > 12 ? 1000 * tonnage * months : 7500 * months;
    if (months > 0 && income < floor) {
      err(`ScheduleBP.GoodsDtlsUs44AE[${i}].PresumptiveIncome`, `Goods carriage ${i + 1}: the presumptive income offered (${income}) is less than the statutory minimum of Rs. ${floor} (${tonnage > 12 ? 'Rs. 1,000 per MT per month' : 'Rs. 7,500 per month'}).`, 'A-144');
    }
    // A-213
    const reg = str(g['RegNumberGoodsCarriage']).replace(/\s+/g, '').toUpperCase();
    if (reg) {
      if (seenReg.has(reg)) {
        err(`ScheduleBP.GoodsDtlsUs44AE[${i}].RegNumberGoodsCarriage`, `Goods carriage ${i + 1}: the registration number "${reg}" is repeated in section 44AE.`, 'A-213');
      }
      seenReg.add(reg);
    }
  });

  /* financial particulars — rules 3, 4, 139 */
  const fin = obj(v('ScheduleBP.FinanclPartclrOfBusiness'));
  if (fin) {
    // A-3
    const liabParts = ['PartnerMemberOwnCapital', 'SecuredLoans', 'UnSecuredLoans', 'Advances', 'SundryCreditors', 'OthrCurrLiab'];
    const liabSum = liabParts.reduce((t, k) => t + num(fin[k]), 0);
    if (!isEmpty(fin['TotCapLiabilities']) && ne(num(fin['TotCapLiabilities']), liabSum)) {
      err('ScheduleBP.FinanclPartclrOfBusiness.TotCapLiabilities',
        `E17: total capital and liabilities (${num(fin['TotCapLiabilities'])}) must equal the total of partners'/members' own capital, secured loans, unsecured loans, advances, sundry creditors and other liabilities (${liabSum}).`, 'A-3');
    }
    // A-4
    const assetParts = ['FixedAssets', 'Investments', 'Inventories', 'SundryDebtors', 'BalWithBanks', 'CashInHand', 'LoansAndAdvances', 'OtherAssets'];
    const assetSum = assetParts.reduce((t, k) => t + num(fin[k]), 0);
    if (!isEmpty(fin['TotalAssets']) && ne(num(fin['TotalAssets']), assetSum)) {
      err('ScheduleBP.FinanclPartclrOfBusiness.TotalAssets',
        `E25: total assets (${num(fin['TotalAssets'])}) must equal the total of fixed assets, investments, inventories, sundry debtors, balance with banks, cash-in-hand, loans & advances and other assets (${assetSum}).`, 'A-4');
    }
  }
  // A-139
  const anyTurnover = num(v('ScheduleBP.PersumptiveInc44AD.GrsTotalTrnOver'))
    + num(v('ScheduleBP.PersumptiveInc44ADA.GrsReceipt'));
  if (anyTurnover > 0) {
    const needed: Array<[string, string]> = [
      ['SundryCreditors', 'sundry creditors'],
      ['Inventories', 'inventories'],
      ['SundryDebtors', 'sundry debtors'],
      ['CashInHand', 'cash-in-hand'],
    ];
    for (const [k, label] of needed) {
      if (!fin || isEmpty(fin[k])) {
        err(`ScheduleBP.FinanclPartclrOfBusiness.${k}`, `Gross receipts / turnover are reported in Schedule BP, so the financial particulars of the business (${label}) must be filled.`, 'A-139');
      }
    }
  }
  // GSTIN turnover total
  const gstRows = rows(v('ScheduleBP.TurnoverGrsRcptForGSTIN'));
  if (gstRows.length > 0 && !isEmpty(v('ScheduleBP.TotalTurnoverGrsRcptGSTIN'))) {
    const gstSum = sum(gstRows, 'AmtTurnGrossRcptGSTIN');
    if (ne(num(v('ScheduleBP.TotalTurnoverGrsRcptGSTIN')), gstSum)) {
      warn('ScheduleBP.TotalTurnoverGrsRcptGSTIN', `The total turnover reported for GST (${num(v('ScheduleBP.TotalTurnoverGrsRcptGSTIN'))}) must equal the sum of the GSTIN-wise amounts (${gstSum}).`);
    }
  }
}

/* ── 5d: salary, exempt allowances, Schedule 10(13A) ──────────────────────── */

/** allowance codes disallowed (must be nil) under the new tax regime */
const NEW_REGIME_NIL_ALLOWANCES: Array<[string, string]> = [
  ['10(5)', 'A-198'],
  ['10(13A)', 'A-199'],
  ['10(14)(i)', 'A-200'],
  ['10(14)(ii)', 'A-201'],
  ['10(17)', 'A-202'],
];

function checkSalaryAndExempt(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const salary171 = c.salary171;
  const perq = num(v('IncomeDeductions.PerquisitesValue'));
  const profits = num(v('IncomeDeductions.ProfitsInSalary'));
  const grossSalary = c.grossSalary;
  const exempt10 = num(v('IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10'));
  const netSalary = num(v('IncomeDeductions.NetSalary'));
  const d16ia = num(v('IncomeDeductions.DeductionUs16ia'));
  const d16ii = num(v('IncomeDeductions.EntertainmntalwncUs16ii'));
  const d16iii = num(v('IncomeDeductions.ProfessionalTaxUs16iii'));
  const d16 = num(v('IncomeDeductions.DeductionUs16'));
  const salIncome = num(v('IncomeDeductions.IncomeFromSal'));

  // A-63
  if (!isEmpty(v('IncomeDeductions.GrossSalary')) && ne(grossSalary, salary171 + perq + profits)) {
    err('IncomeDeductions.GrossSalary', `B2(iii): gross salary (${grossSalary}) must equal the total of salary u/s 17(1), the value of perquisites u/s 17(2) and profits in lieu of salary u/s 17(3) (${salary171 + perq + profits}).`, 'A-63');
  }
  // A-64
  if (!isEmpty(v('IncomeDeductions.NetSalary')) && ne(netSalary, grossSalary - exempt10)) {
    err('IncomeDeductions.NetSalary', `B2: net salary (${netSalary}) must equal the gross salary less the allowances exempt u/s 10 (${grossSalary - exempt10}).`, 'A-64');
  }
  // A-65
  if (!isEmpty(v('IncomeDeductions.DeductionUs16')) && ne(d16, d16ia + d16ii + d16iii)) {
    err('IncomeDeductions.DeductionUs16', `B2(iv): deductions u/s 16 (${d16}) must equal the total of sl. iva, ivb and ivc (${d16ia + d16ii + d16iii}).`, 'A-65');
  }
  // A-66
  if (!isEmpty(v('IncomeDeductions.IncomeFromSal')) && ne(salIncome, netSalary - d16)) {
    err('IncomeDeductions.IncomeFromSal', `B2(v): income chargeable under Salaries (${salIncome}) must equal B2(iii) less B2(iv) (${netSalary - d16}).`, 'A-66');
  }
  // A-143 / A-262 — standard deduction u/s 16(ia)
  const cap16ia = c.oldRegime ? 50000 : 75000;
  if (d16ia > cap16ia) {
    err('IncomeDeductions.DeductionUs16ia', `Standard deduction u/s 16(ia) (${d16ia}) cannot exceed Rs. ${cap16ia} under the ${c.oldRegime ? 'old' : 'new'} tax regime.`, c.oldRegime ? 'A-143' : 'A-262');
  }
  if (d16ia > grossSalary) {
    err('IncomeDeductions.DeductionUs16ia', 'Standard deduction u/s 16(ia) cannot exceed the gross salary.', 'A-143');
  }
  // A-67 / A-68 — entertainment allowance u/s 16(ii)
  if (d16ii > 0) {
    if (!['CGOV', 'SGOV', 'PSU'].includes(c.empCat)) {
      err('IncomeDeductions.EntertainmntalwncUs16ii', 'The entertainment allowance u/s 16(ii) is not allowable to employees other than Central Government, State Government and PSU employees.', 'A-68');
    } else if (c.oldRegime) {
      const cap = Math.min(5000, Math.floor(salary171 / 5));
      if (d16ii > cap) {
        err('IncomeDeductions.EntertainmntalwncUs16ii', `The entertainment allowance u/s 16(ii) is limited to Rs. 5,000 or one-fifth of the basic salary, whichever is lower (${cap}).`, 'A-67');
      }
    }
  }
  // A-195 — professional tax is not allowable under the new regime
  if (c.newRegime && d16iii > 0) {
    err('IncomeDeductions.ProfessionalTaxUs16iii', 'Professional tax u/s 16(iii) is not allowable under the new tax regime.', 'A-195');
  }
  // A-255 / A-314 — nature of employment
  if ((grossSalary > 0 || exempt10 > 0) && (c.empCat === '' || c.empCat === 'NA')) {
    err('PersonalInfo.EmployerCategory', 'Taxpayers having salary income (or exempt allowances) must provide the nature of employment.', grossSalary > 0 ? 'A-255' : 'A-314');
  }
  // A-166 — an HUF / Firm cannot have salary income
  if ((c.isHUF || c.isFirm) && grossSalary > 0) {
    err('IncomeDeductions.GrossSalary', 'An HUF or a Firm (other than LLP) cannot report income under the head Salaries.', 'A-166');
  }

  /* exempt allowances u/s 10 — rules 69, 70-81, 82-94, 159, 160, 181, 184, 198-202, 214, 222, 223, 233, 322, 365 */
  const allw = rows(v('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls'));
  if (allw.length > 0) {
    // A-160
    const allwSum = sum(allw, 'SalOthAmount');
    if (!isEmpty(v('IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10')) && ne(exempt10, allwSum)) {
      err('IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10', `The total allowances exempt u/s 10 (${exempt10}) must equal the sum of the individual amounts (${allwSum}).`, 'A-160');
    }
  }
  // A-69
  if (exempt10 > grossSalary && grossSalary > 0) {
    err('IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10', `The total allowances exempt u/s 10 (${exempt10}) cannot exceed the gross salary (${grossSalary}).`, 'A-69');
  }
  const amountOf = (code: string) => allw
    .filter((r) => str(r['SalNatureDesc']) === code)
    .reduce((t, r) => t + num(r['SalOthAmount']), 0);
  const present = (code: string) => allw.some((r) => str(r['SalNatureDesc']) === code);

  // A-222 / A-233 — each section may be disclosed only once
  const seen = new Set<string>();
  allw.forEach((r, i) => {
    const code = str(r['SalNatureDesc']);
    if (!code) return;
    if (seen.has(code)) {
      err(`IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls[${i}].SalNatureDesc`, `The exempt allowance under section ${code} has been selected more than once — each section must be disclosed in one row only.`, 'A-233');
    }
    seen.add(code);
  });
  // A-70 / A-74 / A-75 / A-80 / A-81 — capped by salary u/s 17(1)
  for (const [code, rule, label] of [
    ['10(5)', 'A-70', 'Leave travel concession / assistance u/s 10(5)'],
    ['10(10A)', 'A-74', 'Commuted value of pension u/s 10(10A)'],
    ['10(10AA)', 'A-75', 'Earned leave encashment u/s 10(10AA)'],
    ['10(14)(i)', 'A-80', 'Prescribed allowances u/s 10(14)(i)'],
    ['10(14)(ii)', 'A-81', 'Prescribed allowances u/s 10(14)(ii)'],
  ] as const) {
    if (amountOf(code) > salary171 && salary171 >= 0 && amountOf(code) > 0 && salary171 < amountOf(code)) {
      err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `${label} (${amountOf(code)}) cannot exceed the salary as per section 17(1) (${salary171}).`, rule);
    }
  }
  // A-71 / A-72 — capped by gross salary
  for (const [code, rule, label] of [
    ['10(6)', 'A-71', 'Remuneration received as an official of an embassy / high commission u/s 10(6)'],
    ['10(7)', 'A-72', 'Allowances or perquisites paid outside India u/s 10(7)'],
  ] as const) {
    if (amountOf(code) > grossSalary && amountOf(code) > 0) {
      err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `${label} (${amountOf(code)}) cannot exceed the gross salary (${grossSalary}).`, rule);
    }
  }
  // A-73 / A-317 — death-cum-retirement gratuity u/s 10(10)
  const gratuity = amountOf('10(10)');
  if (gratuity > 0) {
    const govtLike = ['CGOV', 'SGOV', 'PESG', 'PEPS'].includes(c.empCat);
    const cap = govtLike ? 2500000 : 2000000;
    if (gratuity > cap) {
      err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `Death-cum-retirement gratuity u/s 10(10) (${gratuity}) cannot exceed Rs. ${govtLike ? '25,00,000' : '20,00,000'} for the selected nature of employment.`, govtLike ? 'A-317' : 'A-73');
    }
  }
  // A-181 — leave encashment ceiling for non-government employees
  const leaveEnc = amountOf('10(10AA)');
  if (leaveEnc > 2500000 && !['CGOV', 'SGOV', 'PESG', 'PEPS'].includes(c.empCat)) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `Leave encashment exempt u/s 10(10AA) (${leaveEnc}) cannot exceed Rs. 25,00,000 for an employer category other than Central / State Government or their pensioners.`, 'A-181');
  }
  // A-76 / A-159 / A-226 — Rs. 5 lakh ceilings
  for (const [code, rule, label] of [
    ['10(10C)', 'A-76', 'Amount received on voluntary retirement u/s 10(10C)'],
    ['10(10B)(i)', 'A-159', 'Compensation u/s 10(10B) — first proviso'],
    ['10(10B)(ii)', 'A-226', 'Compensation u/s 10(10B) — second proviso'],
  ] as const) {
    if (amountOf(code) > 500000) {
      err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `${label} (${amountOf(code)}) cannot exceed Rs. 5,00,000.`, rule);
    }
  }
  // A-77 / A-214 — mutually exclusive exemptions
  const exclusive = ['10(10B)(i)', '10(10B)(ii)', '10(10C)'].filter(present);
  if (exclusive.length > 1) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `Only one of the exempt allowances u/s 10(10B)(i), 10(10B)(ii) and 10(10C) may be claimed — found ${exclusive.join(', ')}.`, 'A-214');
  }
  // A-78 — tax paid by employer on a non-monetary perquisite
  if (amountOf('10(10CC)') > perq) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `Tax paid by the employer on a non-monetary perquisite u/s 10(10CC) (${amountOf('10(10CC)')}) cannot exceed the value of perquisites u/s 17(2) (${perq}).`, 'A-78');
  }
  // A-322 / A-365 — exempt income of a judge
  if (amountOf('EIC') > 0 && !GOVT_EMPLOYER.includes(c.empCat)) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', 'The exemption for income received by a judge covered by the Supreme Court / High Court Judges Act may be claimed only by Central or State Government employees.', 'A-322');
  }
  if (c.newRegime && amountOf('EIC') > 0) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', 'The exemption for income received by a judge cannot be claimed under the new tax regime.', 'A-365');
  }
  // A-223 — 10(10B) is not available to government employees / pensioners
  if ((present('10(10B)(i)') || present('10(10B)(ii)'))
    && ['CGOV', 'SGOV', 'PESG', 'PEPS', 'PE', 'PEO'].includes(c.empCat)) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', 'Exempt allowances u/s 10(10B)(i) and 10(10B)(ii) are not allowable to Central / State Government employees or to pensioners.', 'A-223');
  }
  // A-184 / A-198..A-202 / A-187 — regime-specific nil allowances
  if (c.newRegime) {
    for (const [code, rule] of NEW_REGIME_NIL_ALLOWANCES) {
      if (amountOf(code) > 0) {
        err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `Exempt allowance u/s ${code} (${amountOf(code)}) must be nil under the new tax regime.`, rule);
      }
    }
  } else {
    for (const code of ['10(14)(i)(115BAC)', '10(14)(ii)(115BAC)']) {
      if (amountOf(code) > 0) {
        err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `Exempt allowance u/s ${code} is available only under the new tax regime and must be nil under the old tax regime.`, 'A-187');
      }
    }
  }

  /* Schedule 10(13A) — rules 311-316, 320, 315, 303, 305 */
  const hra = amountOf('10(13A)');
  const ea = obj(v('ScheduleEA10_13A'));
  if (hra > 0 && !ea) {
    err('ScheduleEA10_13A', 'Schedule 10(13A) must be filled to claim the exempt allowance u/s 10(13A).', 'A-315');
  }
  // A-79 — under the old regime the HRA exemption can never exceed 50% of the salary
  // u/s 17(1) (40% outside the four metros, 1/3rd where DA is excluded); the outer
  // 50% bound is applied here so that no compliant return is flagged.
  if (c.oldRegime && salary171 > 0 && hra > Math.floor(salary171 * 0.5)) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `Under the old tax regime the exempt allowance u/s 10(13A) (${hra}) cannot exceed 50% of the salary as per section 17(1) (${Math.floor(salary171 * 0.5)}).`, 'A-79');
  }
  if (ea) {
    const elig = num(ea['EligbleExmpAllwncUs13A']);
    const actual = num(ea['ActlHRARecv']);
    const rentLess10 = num(ea['ActlRentPaid10Per']);
    const salPct = num(ea['Sal40Or50Per']);
    if (!isEmpty(ea['EligbleExmpAllwncUs13A'])) {
      if (elig > rentLess10) {
        err('ScheduleEA10_13A.EligbleExmpAllwncUs13A', `The HRA exemption (${elig}) cannot exceed the actual rent paid less 10% of the basic salary and DA (${rentLess10}).`, 'A-311');
      }
      if (elig > salPct) {
        err('ScheduleEA10_13A.EligbleExmpAllwncUs13A', `The HRA exemption (${elig}) cannot exceed 40% / 50% of the basic salary and DA (${salPct}).`, 'A-312');
      }
      const lowest = Math.min(actual, rentLess10, salPct);
      if (elig > lowest) {
        err('ScheduleEA10_13A.EligbleExmpAllwncUs13A', `The HRA exemption must be the lowest of the actual HRA received, the rent paid less 10% of salary and 40%/50% of salary (${lowest}).`, 'A-313');
      }
    }
    // A-316
    if (salary171 > 0 && num(ea['BasicSalary']) + num(ea['DearnessAllwnc']) + actual > salary171) {
      err('ScheduleEA10_13A.BasicSalary', 'The total of basic salary, dearness allowance and the actual HRA received in Schedule 10(13A) cannot exceed the salary as per section 17(1).', 'A-316');
    }
    // A-320
    if (!isEmpty(ea['EligbleExmpAllwncUs13A']) && ne(hra, elig)) {
      err('ScheduleEA10_13A.EligbleExmpAllwncUs13A', `The exempt allowance u/s 10(13A) claimed in the salary schedule (${hra}) must match the eligible allowance computed in Schedule 10(13A) (${elig}).`, 'A-320');
    }
  }

  /* exempt income (Schedule EI) — rules 130, 222 */
  const eiRows = rows(v('TaxExmpIntIncDtls.OthersInc.OthersIncDtls'));
  const eiSeen = new Set<string>();
  let agri = 0;
  eiRows.forEach((r, i) => {
    const key = `${str(r['Category'])}|${str(r['SubCategory'])}`;
    if (key !== '|') {
      if (eiSeen.has(key)) {
        err(`TaxExmpIntIncDtls.OthersInc.OthersIncDtls[${i}].SubCategory`, 'Each nature of exempt income may be selected only once under Exempt Income.', 'A-222');
      }
      eiSeen.add(key);
    }
    if (str(r['Category']) === 'AGRI' || str(r['SubCategory']) === '10(1)') agri += num(r['OthAmount']);
  });
  // A-130
  if (agri > 5000) {
    err('TaxExmpIntIncDtls.OthersInc.OthersIncDtls', `Agricultural income shown as exempt (${agri}) cannot exceed Rs. 5,000 in ITR-4.`, 'A-130');
  }
  if (eiRows.length > 0 && !isEmpty(v('TaxExmpIntIncDtls.OthersInc.OthersTotalTaxExe'))) {
    const eiSum = sum(eiRows, 'OthAmount');
    if (ne(num(v('TaxExmpIntIncDtls.OthersInc.OthersTotalTaxExe')), eiSum)) {
      err('TaxExmpIntIncDtls.OthersInc.OthersTotalTaxExe', `The total exempt income (${num(v('TaxExmpIntIncDtls.OthersInc.OthersTotalTaxExe'))}) must equal the sum of the individual amounts (${eiSum}).`, 'A-222');
    }
  }
  // A-391 — minor child's income under the new regime
  const minorChild = eiRows.filter((r) => str(r['SubCategory']) === '10(32)').reduce((t, r) => t + num(r['OthAmount']), 0);
  if (c.newRegime && minorChild > 0) {
    err('TaxExmpIntIncDtls.OthersInc.OthersIncDtls', "Exempt income u/s 10(32) (minor child's income) must be nil under the new tax regime.", 'A-391');
  }
}

/* ── 5e: house property ───────────────────────────────────────────────────── */

function checkHouseProperty(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const props = rows(v('IncomeDeductions.PropertyDetails'));
  const headTotal = num(v('IncomeDeductions.TotalIncomeChargeableUnHP'));
  let hpSum = 0;

  props.forEach((p, i) => {
    const base = `IncomeDeductions.PropertyDetails[${i}]`;
    const rent = obj(p['Rentdetails']);
    const letOut = str(p['ifLetOut']);
    const coOwned = str(p['PropCoOwnedFlg']).toUpperCase();
    const share = num(p['AsseseeShareProperty']);
    if (!rent) return;

    const alv = num(rent['AnnualLetableValue']);
    const unrealised = num(rent['RentNotRealized']);
    const localTax = num(rent['LocalTaxes']);
    const totUnreal = num(rent['TotalUnrealizedAndTax']);
    const balAlv = num(rent['BalanceALV']);
    const ownedAlv = num(rent['AnnualOfPropOwned']);
    const thirty = num(rent['ThirtyPercentOfBalance']);
    const interest = num(rent['IntOnBorwCap']);
    const totDeduct = num(rent['TotalDeduct']);
    const arrears = num(rent['ArrearsUnrealizedRentRcvd']);
    const incomeHP = num(rent['IncomeOfHP']);
    hpSum += incomeHP;

    // A-349
    if (!isEmpty(rent['TotalUnrealizedAndTax']) && ne(totUnreal, unrealised + localTax)) {
      err(`${base}.Rentdetails.TotalUnrealizedAndTax`, `Property ${i + 1}: sl. 1d must be the total of sl. 1b and 1c (${unrealised + localTax}).`, 'A-349');
    }
    // A-55
    if (!isEmpty(rent['BalanceALV']) && ne(balAlv, alv - totUnreal)) {
      err(`${base}.Rentdetails.BalanceALV`, `Property ${i + 1}: the annual value (sl. 1e) must be sl. 1a less sl. 1d (${alv - totUnreal}).`, 'A-55');
    }
    // A-57
    if (!isEmpty(rent['ThirtyPercentOfBalance']) && ne(thirty, Math.round(ownedAlv * 0.3))) {
      err(`${base}.Rentdetails.ThirtyPercentOfBalance`, `Property ${i + 1}: the standard deduction must be 30% of the annual value of the property owned (${Math.round(ownedAlv * 0.3)}).`, 'A-57');
    }
    // A-350
    if (!isEmpty(rent['TotalDeduct']) && ne(totDeduct, thirty + interest)) {
      err(`${base}.Rentdetails.TotalDeduct`, `Property ${i + 1}: sl. 1i must be the total of sl. 1g and 1h (${thirty + interest}).`, 'A-350');
    }
    // A-60
    if (!isEmpty(rent['IncomeOfHP']) && ne(incomeHP, ownedAlv - totDeduct + arrears)) {
      err(`${base}.Rentdetails.IncomeOfHP`, `Property ${i + 1}: the income chargeable under House Property (${incomeHP}) must equal sl. 1f less sl. 1i plus arrears of rent (${ownedAlv - totDeduct + arrears}).`, 'A-60');
    }
    // A-58 / A-352 / A-408
    if (alv === 0 && localTax > 0) {
      err(`${base}.Rentdetails.LocalTaxes`, `Property ${i + 1}: municipal tax cannot be claimed when the gross rent received / receivable / lettable value is zero.`, 'A-58');
    }
    if (alv === 0 && unrealised > 0) {
      err(`${base}.Rentdetails.RentNotRealized`, `Property ${i + 1}: unrealised rent cannot be claimed when the gross rent received / receivable / lettable value is zero.`, 'A-352');
    }
    if (unrealised > alv) {
      err(`${base}.Rentdetails.RentNotRealized`, `Property ${i + 1}: the amount of rent which cannot be realised (${unrealised}) cannot exceed the gross rent (${alv}).`, 'A-408');
    }
    // A-59
    if ((letOut === 'L' || letOut === 'D') && alv === 0) {
      err(`${base}.Rentdetails.AnnualLetableValue`, `Property ${i + 1}: the type of property is let out / deemed let out, so the gross rent received / receivable / lettable value cannot be zero.`, 'A-59');
    }
    // A-61
    if (letOut === 'S' && localTax > 0) {
      err(`${base}.Rentdetails.LocalTaxes`, `Property ${i + 1}: tax paid to local authorities is not allowable when the type of house property is self-occupied.`, 'A-61');
    }
    // A-154 / A-207 / A-302
    if (letOut === 'S' && interest > 0) {
      if (c.newRegime) {
        err(`${base}.Rentdetails.IntOnBorwCap`, `Property ${i + 1}: interest on borrowed capital cannot be claimed for a self-occupied property under the new tax regime.`, 'A-207');
      } else if (interest > 200000) {
        err(`${base}.Rentdetails.IntOnBorwCap`, `Property ${i + 1}: interest on borrowed capital for a self-occupied property cannot exceed Rs. 2,00,000 (claimed ${interest}).`, 'A-154');
      }
    }
    // A-323
    if (interest > 0 && isEmpty(p['ifLetOut'])) {
      err(`${base}.ifLetOut`, `Property ${i + 1}: the type of house property is mandatory when interest on borrowed capital u/s 24(b) is claimed.`, 'A-323');
    }
    // A-269 / A-289 / A-295 — Schedule 24(b)
    const s24 = obj(rent['Section24B']);
    if (interest > 0 && !s24) {
      err(`${base}.Rentdetails.Section24B`, `Property ${i + 1}: the details of the bank from which the loan was taken must be provided to claim interest on borrowed capital u/s 24(b).`, 'A-269');
    }
    if (s24) {
      const loanRows = rows(s24['Section24BDtls']);
      const loanSum = sum(loanRows, 'InterestUs24B');
      const tot24 = num(s24['TotalInterestUs24B']);
      if (loanRows.length > 0 && !isEmpty(s24['TotalInterestUs24B']) && ne(tot24, loanSum)) {
        err(`${base}.Rentdetails.Section24B.TotalInterestUs24B`, `Property ${i + 1}: the total of Schedule 24(b) (${tot24}) must equal the sum of the interest paid in the individual rows (${loanSum}).`, 'A-295');
      }
      if (!isEmpty(rent['IntOnBorwCap']) && !isEmpty(s24['TotalInterestUs24B']) && ne(interest, tot24)) {
        err(`${base}.Rentdetails.IntOnBorwCap`, `Property ${i + 1}: the interest on borrowed capital (${interest}) must match the total interest paid u/s 24(b) in Schedule 24(b) (${tot24}).`, 'A-289');
      }
    }
    // A-346 / A-404 / A-405 / A-406 / A-347 / A-348 / A-351
    const coOwners = rows(p['CoOwners']);
    if (coOwned === 'NO' && !isEmpty(p['AsseseeShareProperty']) && Math.round(share) !== 100) {
      err(`${base}.AsseseeShareProperty`, `Property ${i + 1}: the property is not co-owned, so the assessee's share must be 100%.`, 'A-404');
    }
    if (coOwned === 'YES') {
      if (share >= 100) {
        err(`${base}.AsseseeShareProperty`, `Property ${i + 1}: the property is co-owned, so the assessee's percentage share must be less than 100%.`, 'A-406');
      }
      const coShare = coOwners.reduce((t, o) => t + num(o['PercentShareProperty']), 0);
      if (coShare <= 0 || coShare >= 100) {
        err(`${base}.CoOwners`, `Property ${i + 1}: the percentage share of the other co-owner(s) must be greater than 0% and less than 100%.`, 'A-405');
      }
      if (Math.round(share + coShare) !== 100) {
        err(`${base}.AsseseeShareProperty`, `Property ${i + 1}: the total of the assessee's share (${share}%) and the co-owners' share (${coShare}%) must be 100%.`, 'A-346');
      }
      if (!isEmpty(rent['AnnualOfPropOwned']) && ne(ownedAlv, Math.round(balAlv * share / 100))) {
        err(`${base}.Rentdetails.AnnualOfPropOwned`, `Property ${i + 1}: the annual value of the property owned must be the assessee's percentage share of the annual value (${Math.round(balAlv * share / 100)}).`, 'A-347');
      }
      if (share === 0 && interest > 0) {
        err(`${base}.Rentdetails.IntOnBorwCap`, `Property ${i + 1}: the assessee's share in the co-owned property is zero, so interest on borrowed capital cannot be claimed.`, 'A-348');
      }
      coOwners.forEach((o, j) => {
        const coPan = str(o['PAN_CoOwner']);
        if (coPan && c.pan && coPan.toUpperCase() === c.pan.toUpperCase()) {
          err(`${base}.CoOwners[${j}].PAN_CoOwner`, `Property ${i + 1}, co-owner ${j + 1}: the PAN of a co-owner cannot be the same as the PAN of the assessee.`, 'A-351');
        }
      });
    }
  });

  // A-60 (head total)
  if (props.length > 0 && !isEmpty(v('IncomeDeductions.TotalIncomeChargeableUnHP')) && ne(headTotal, hpSum)) {
    err('IncomeDeductions.TotalIncomeChargeableUnHP', `B3: the income chargeable under the head House Property (${headTotal}) must equal the sum of the income of the individual properties (${hpSum}).`, 'A-60');
  }
  if (props.length === 0 && headTotal !== 0) {
    warn('IncomeDeductions.PropertyDetails', 'Income is reported under the head House Property but no property details have been provided.', 'A-60');
  }
}

/* ── 5f: income from other sources ────────────────────────────────────────── */

function checkOtherSources(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const os = num(v('IncomeDeductions.IncomeOthSrc'));
  const d57iia = num(v('IncomeDeductions.DeductionUs57iia'));
  const list = rows(v('IncomeDeductions.OthersInc.OthersIncDtlsOthSrc'));
  const listSum = sum(list, 'OthSrcOthAmount');

  // A-62
  if (list.length > 0 && !isEmpty(v('IncomeDeductions.IncomeOthSrc')) && ne(os, listSum - d57iia)) {
    err('IncomeDeductions.IncomeOthSrc', `B4: income from other sources (${os}) must equal the total of the individual amounts less the deduction u/s 57(iia) (${listSum - d57iia}).`, 'A-62');
  }
  const fam = familyPension(v);
  // A-95
  if (d57iia > 0 && fam === 0) {
    err('IncomeDeductions.DeductionUs57iia', 'The deduction u/s 57(iia) is allowable only when "Family pension" is selected from the other-sources drop-down.', 'A-95');
  }
  // A-96 / A-261
  if (d57iia > 0 && fam > 0) {
    const cap = Math.min(Math.floor(fam / 3), c.oldRegime ? 15000 : 25000);
    if (d57iia > cap) {
      err('IncomeDeductions.DeductionUs57iia', `The deduction u/s 57(iia) (${d57iia}) cannot exceed one-third of the family pension subject to Rs. ${c.oldRegime ? '15,000' : '25,000'} (maximum ${cap}).`, c.oldRegime ? 'A-96' : 'A-261');
    }
  }
  // A-180
  if (fam > 0 && (c.isHUF || c.isFirm)) {
    err('IncomeDeductions.OthersInc.OthersIncDtlsOthSrc', 'Income from family pension cannot be claimed by an HUF or a Firm (other than LLP).', 'A-180');
  }
  // A-185 — dividend quarterly break-up
  list.forEach((r, i) => {
    const div = obj(r['DividendInc']);
    const dr = obj(div?.['DateRange']);
    if (!dr) return;
    const q = DIV_QUARTERS.reduce((t, [k]) => t + num(dr[k]), 0);
    if (ne(num(r['OthSrcOthAmount']), q)) {
      err(`IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[${i}].DividendInc.DateRange`, `Other-sources row ${i + 1}: the total dividend income (${num(r['OthSrcOthAmount'])}) must equal the sum of the quarterly break-up (${q}).`, 'A-185');
    }
  });
  // duplicate nature codes
  const seen = new Set<string>();
  list.forEach((r, i) => {
    const code = str(r['OthSrcNatureDesc']);
    if (!code || code === 'OTH') return;
    if (seen.has(code)) {
      warn(`IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[${i}].OthSrcNatureDesc`, `The nature of income "${code}" has been selected more than once under Income from other sources.`, 'A-62');
    }
    seen.add(code);
  });
}

/* ── 5g: Chapter VI-A ─────────────────────────────────────────────────────── */

/** Chapter VI-A sections that must be nil under the new regime, with rule ids. */
const NEW_REGIME_NIL_VIA: Array<[string, string, string]> = [
  ['Section80C', 'A-189', '80C'],
  ['Section80CCC', 'A-189', '80CCC'],
  ['Section80CCDEmployeeOrSE', 'A-208', '80CCD(1)'],
  ['Section80CCD1B', 'A-203', '80CCD(1B)'],
  ['Section80D', 'A-211', '80D'],
  ['Section80DD', 'A-204', '80DD'],
  ['Section80DDB', 'A-205', '80DDB'],
  ['Section80E', 'A-183', '80E'],
  ['Section80EE', 'A-206', '80EE'],
  ['Section80EEA', 'A-209', '80EEA'],
  ['Section80EEB', 'A-210', '80EEB'],
  ['Section80G', 'A-190', '80G'],
  ['Section80GG', 'A-191', '80GG'],
  ['Section80GGC', 'A-183', '80GGC'],
  ['Section80TTA', 'A-192', '80TTA'],
  ['Section80TTB', 'A-193', '80TTB'],
  ['Section80U', 'A-194', '80U'],
];

/** Statutory ceilings under the old regime (rule id → cap). */
const OLD_REGIME_CAPS: Array<[string, number, string, string]> = [
  ['Section80CCD1B', 50000, 'A-145', '80CCD(1B)'],
  ['Section80EE', 50000, 'A-150', '80EE'],
  ['Section80EEA', 150000, 'A-156', '80EEA'],
  ['Section80EEB', 150000, 'A-158', '80EEB'],
  ['Section80TTA', 10000, 'A-152', '80TTA'],
  ['Section80TTB', 50000, 'A-153', '80TTB'],
  ['Section80DDB', 100000, 'A-149', '80DDB'],
  ['Section80D', 100000, 'A-177', '80D'],
];

/** VIA sections available to a Firm (other than LLP) — rule 230. */
const FIRM_ALLOWED_VIA = ['Section80G', 'Section80GGC', 'TotalChapVIADeductions'];
/** VIA sections available to an HUF — rule 231. */
const HUF_ALLOWED_VIA = [
  'Section80G', 'Section80GGC', 'Section80D', 'Section80C', 'Section80DD',
  'Section80DDB', 'Section80TTA', 'TotalChapVIADeductions',
];

function checkChapterVIA(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const claimed = c.claimed;
  const entered = c.entered;
  const sections = VIA_FIELDS.map(([f]) => f).filter((f) => f !== 'TotalChapVIADeductions');

  // A-18 — totals must agree with the break-up (both blocks)
  for (const [block, label] of [['UsrDeductUndChapVIA', 'as entered'], ['DeductUndChapVIA', 'as computed']] as const) {
    const total = num(v(`IncomeDeductions.${block}.TotalChapVIADeductions`));
    const parts = sections.reduce((t, f) => t + num(v(`IncomeDeductions.${block}.${f}`)), 0);
    if (!isEmpty(v(`IncomeDeductions.${block}.TotalChapVIADeductions`)) && ne(total, parts)) {
      err(`IncomeDeductions.${block}.TotalChapVIADeductions`, `The total Chapter VI-A deductions ${label} (${total}) is not consistent with the break-up of the individual deductions (${parts}).`, 'A-18');
    }
  }
  const totalVIA = claimed('TotalChapVIADeductions');
  // A-19
  if (totalVIA > c.gti) {
    err('IncomeDeductions.DeductUndChapVIA.TotalChapVIADeductions', `The deductions claimed under Chapter VI-A (${totalVIA}) cannot exceed the gross total income (${c.gti}).`, 'A-19');
  }
  // A-324..A-342 — the computed amount can never exceed the user-entered amount
  for (const [f, label] of VIA_FIELDS) {
    if (f === 'TotalChapVIADeductions') continue;
    if (claimed(f) > entered(f)) {
      err(`IncomeDeductions.DeductUndChapVIA.${f}`, `The eligible amount of deduction claimed under ${label} (${claimed(f)}) cannot exceed the user-enterable amount (${entered(f)}).`, 'A-324');
    }
  }

  /* status-based eligibility — rules 20, 23, 24, 26, 27, 28, 31, 32, 43, 163, 164, 230, 231, 236 */
  if (c.isFirm) {
    for (const [f, label] of VIA_FIELDS) {
      if (FIRM_ALLOWED_VIA.includes(f)) continue;
      if (claimed(f) > 0 || entered(f) > 0) {
        err(`IncomeDeductions.DeductUndChapVIA.${f}`, `A Firm (other than LLP) is eligible only for the deductions u/s 80G and 80GGC — the deduction under ${label} is not allowable.`, f === 'Section80D' ? 'A-236' : 'A-230');
      }
    }
  }
  if (c.isHUF) {
    for (const [f, label] of VIA_FIELDS) {
      if (HUF_ALLOWED_VIA.includes(f)) continue;
      if (claimed(f) > 0 || entered(f) > 0) {
        err(`IncomeDeductions.DeductUndChapVIA.${f}`, `An HUF is eligible only for the deductions u/s 80G, 80GGC, 80D, 80C, 80DD, 80DDB and 80TTA — the deduction under ${label} is not allowable.`, 'A-231');
      }
    }
  }
  if (!c.isIndividual) {
    if (claimed('Section80CCDEmployeeOrSE') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployeeOrSE', 'A deduction u/s 80CCD(1) is allowable only to an individual.', 'A-23');
    }
    if (claimed('Section80CCD1B') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80CCD1B', 'A deduction u/s 80CCD(1B) is allowable only to an individual.', 'A-24');
    }
    if (claimed('Section80CCDEmployer') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployer', 'A deduction u/s 80CCD(2) cannot be claimed by an HUF or a Firm (other than LLP).', 'A-26');
    }
    if (claimed('Section80U') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80U', 'A deduction u/s 80U cannot be claimed by an HUF or a Firm (other than LLP).', 'A-43');
    }
    if (claimed('Section80EE') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80EE', 'A deduction u/s 80EE cannot be claimed by an HUF or a Firm (other than LLP).', 'A-32');
    }
    if (claimed('Section80EEA') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80EEA', 'A deduction u/s 80EEA cannot be claimed by an HUF or a Firm (other than LLP).', 'A-163');
    }
    if (claimed('Section80EEB') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80EEB', 'A deduction u/s 80EEB cannot be claimed by an HUF or a Firm (other than LLP).', 'A-164');
    }
  }

  /* regime-driven rules */
  if (c.newRegime) {
    // A-183 and the per-section rules
    for (const [f, rule, label] of NEW_REGIME_NIL_VIA) {
      if (claimed(f) > 0 || entered(f) > 0) {
        err(`IncomeDeductions.DeductUndChapVIA.${f}`, `Under the new tax regime no Chapter VI-A deduction other than 80CCD(2) and 80CCH is allowable — the deduction u/s ${label} must be nil.`, rule);
      }
    }
    // A-190 / A-191 / A-211 — the related schedules must not be filled either
    if (obj(v('Schedule80G'))) {
      err('Schedule80G', 'Under the new tax regime a deduction u/s 80G cannot be claimed and Schedule 80G must not be filled.', 'A-190');
    }
    if (obj(v('Schedule80D'))) {
      err('Schedule80D', 'Under the new tax regime a deduction u/s 80D cannot be claimed and Schedule 80D must not be filled.', 'A-211');
    }
    // A-305
    if (c.isIndividual) {
      for (const s of ['Schedule80C', 'Schedule80E', 'Schedule80EE', 'Schedule80EEA', 'Schedule80EEB', 'ScheduleEA10_13A']) {
        if (obj(v(s))) {
          err(s, `An individual opting for the new tax regime cannot fill ${s.replace('Schedule', 'Schedule ')} to claim the respective deduction.`, 'A-305');
        }
      }
    }
  } else {
    // A-21 — the 80C + 80CCC + 80CCD(1) ceiling
    const c80 = claimed('Section80C') + claimed('Section80CCC') + claimed('Section80CCDEmployeeOrSE');
    if (c80 > 150000) {
      err('IncomeDeductions.DeductUndChapVIA.Section80C', `Under the old tax regime the total of the deductions u/s 80C, 80CCC and 80CCD(1) (${c80}) cannot exceed Rs. 1,50,000.`, 'A-21');
    }
    for (const [f, cap, rule, label] of OLD_REGIME_CAPS) {
      if (claimed(f) > cap) {
        err(`IncomeDeductions.DeductUndChapVIA.${f}`, `Under the old tax regime the deduction u/s ${label} (${claimed(f)}) cannot exceed Rs. ${cap.toLocaleString('en-IN')}.`, rule);
      }
    }
    // A-157
    if (claimed('Section80EEA') > 0 && claimed('Section80EE') > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80EEA', 'Deductions u/s 80EEA and u/s 80EE cannot both be claimed.', 'A-157');
    }
    // A-20
    if (c.isFirm && c80 > 0) {
      err('IncomeDeductions.DeductUndChapVIA.Section80C', 'A Firm cannot claim a deduction u/s 80C, 80CCC or 80CCD(1).', 'A-20');
    }
    // A-37 — 80GG ceiling
    const gg = claimed('Section80GG');
    if (gg > 0) {
      const cap = Math.min(60000, Math.floor((c.gti - gg) * 0.25));
      if (gg > cap) {
        err('IncomeDeductions.DeductUndChapVIA.Section80GG', `The deduction u/s 80GG (${gg}) is limited to Rs. 60,000 or 25% of the total income excluding LTCG before allowing this deduction, whichever is lower (${cap}).`, 'A-37');
      }
      // A-151
      const hra = rows(v('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls'))
        .filter((r) => str(r['SalNatureDesc']) === '10(13A)')
        .reduce((t, r) => t + num(r['SalOthAmount']), 0);
      if (hra > 0 && gg > 55000) {
        err('IncomeDeductions.DeductUndChapVIA.Section80GG', 'House rent allowance u/s 10(13A) has been claimed, so a deduction u/s 80GG above Rs. 55,000 is not allowable.', 'A-151');
      }
      // A-282
      if (isEmpty(v('IncomeDeductions.UsrDeductUndChapVIA.Form10BAAckNum'))) {
        err('IncomeDeductions.UsrDeductUndChapVIA.Form10BAAckNum', 'The details of Form 10BA are required to claim a deduction u/s 80GG.', 'A-282');
      }
    }
    // A-38 / A-39 / A-40 / A-41 — savings / deposit interest deductions
    const osRows = rows(v('IncomeDeductions.OthersInc.OthersIncDtlsOthSrc'));
    const interestOf = (code: string) => osRows
      .filter((r) => str(r['OthSrcNatureDesc']) === code)
      .reduce((t, r) => t + num(r['OthSrcOthAmount']), 0);
    const savings = interestOf('SAV');
    const deposits = interestOf('IFD');
    const tta = claimed('Section80TTA');
    const ttb = claimed('Section80TTB');
    if (tta > 0) {
      if (tta > savings) {
        err('IncomeDeductions.DeductUndChapVIA.Section80TTA', `The deduction u/s 80TTA (${tta}) is restricted to the interest income from a savings account reported under Income from other sources (${savings}).`, 'A-38');
      }
      if (c.isSenior) {
        err('IncomeDeductions.DeductUndChapVIA.Section80TTA', 'A deduction u/s 80TTA cannot be claimed by a senior citizen (date of birth on or before 01/04/1966).', 'A-39');
      }
    }
    if (ttb > 0) {
      if (!c.isSenior && c.isIndividual) {
        err('IncomeDeductions.DeductUndChapVIA.Section80TTB', 'A deduction u/s 80TTB cannot be claimed by an assessee who is not a senior citizen (date of birth on or after 02/04/1966).', 'A-40');
      }
      const cap = Math.min(savings + deposits, 50000);
      if (ttb > cap) {
        err('IncomeDeductions.DeductUndChapVIA.Section80TTB', `The deduction u/s 80TTB (${ttb}) is restricted to the interest income from savings accounts and deposits, or Rs. 50,000, whichever is lower (${cap}).`, 'A-41');
      }
    }
    // A-22 / A-155 — 80CCD(1) ceilings
    const ccd1 = claimed('Section80CCDEmployeeOrSE');
    if (ccd1 > 0) {
      if (PENSIONER_OR_NA.includes(c.empCat)) {
        const cap = Math.floor(c.gti * 0.2);
        if (ccd1 > cap) {
          err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployeeOrSE', `For the selected employer category the deduction u/s 80CCD(1) (${ccd1}) cannot exceed 20% of the gross total income (${cap}).`, 'A-22');
        }
      } else {
        const cap = Math.floor(c.grossSalary * 0.1);
        if (ccd1 > cap) {
          err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployeeOrSE', `For the selected employer category the maximum amount that can be claimed u/s 80CCD(1) is 10% of salary (${cap}).`, 'A-155');
        }
      }
    }
    // A-29 / A-44 — descriptions for 80DD and 80U
    if (claimed('Section80DD') > 0 && !obj(v('Schedule80DD'))) {
      err('Schedule80DD', 'The eligible-category description must be provided in Schedule 80DD to claim a deduction u/s 80DD.', 'A-29');
    }
    if (claimed('Section80U') > 0 && !obj(v('Schedule80U'))) {
      err('Schedule80U', 'The eligible-category description must be provided in Schedule 80U to claim a deduction u/s 80U.', 'A-44');
    }
    // A-30 / A-288 — 80DDB specified-disease details
    if (claimed('Section80DDB') > 0) {
      if (isEmpty(v('IncomeDeductions.UsrDeductUndChapVIA.Section80DDBUsrType'))) {
        err('IncomeDeductions.UsrDeductUndChapVIA.Section80DDBUsrType', 'The eligible-category description must be provided to claim a deduction u/s 80DDB.', 'A-30');
      }
      if (isEmpty(v('IncomeDeductions.UsrDeductUndChapVIA.NameOfSpecDisease80DDB'))) {
        err('IncomeDeductions.UsrDeductUndChapVIA.NameOfSpecDisease80DDB', 'The details of the specified disease are required to claim a deduction u/s 80DDB.', 'A-288');
      }
      // A-148 / A-149
      const type = str(v('IncomeDeductions.UsrDeductUndChapVIA.Section80DDBUsrType'));
      const cap = type === '2' ? 100000 : 40000;
      if (claimed('Section80DDB') > cap) {
        err('IncomeDeductions.DeductUndChapVIA.Section80DDB', `The deduction u/s 80DDB for the selected category cannot exceed Rs. ${cap.toLocaleString('en-IN')}.`, type === '2' ? 'A-149' : 'A-148');
      }
    }
    // A-34 — 80G claimed without Schedule 80G
    if (claimed('Section80G') > 0 && !obj(v('Schedule80G'))) {
      err('Schedule80G', 'A deduction u/s 80G has been claimed but the details have not been provided in Schedule 80G.', 'A-34');
    }
    // A-179 — 80D claimed without Schedule 80D
    if (claimed('Section80D') > 0 && !obj(v('Schedule80D'))) {
      err('Schedule80D', 'A deduction u/s 80D has been claimed but the details have not been provided in Schedule 80D.', 'A-179');
    }
    // A-303 / A-304 — schedules not open to Firms / HUFs
    if (c.isFirm) {
      for (const s of ['Schedule80C', 'Schedule80E', 'Schedule80EE', 'Schedule80EEA', 'Schedule80EEB', 'ScheduleEA10_13A']) {
        if (obj(v(s))) {
          err(s, `An assessee with the status Firm (other than LLP) is not eligible to fill ${s.replace('Schedule', 'Schedule ')}.`, 'A-303');
        }
      }
    }
    if (c.isHUF) {
      for (const s of ['Schedule80E', 'Schedule80EE', 'Schedule80EEA', 'Schedule80EEB']) {
        if (obj(v(s))) {
          err(s, `An assessee with the status HUF is not eligible to fill ${s.replace('Schedule', 'Schedule ')}.`, 'A-304');
        }
      }
    }
  }

  /* 80CCD(2) — rules 25, 47, 161, 263 */
  const ccd2 = claimed('Section80CCDEmployer');
  if (ccd2 > 0) {
    if (PENSIONER_OR_NA.includes(c.empCat)) {
      err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployer', 'A deduction u/s 80CCD(2) cannot be claimed when the employer category is a pensioner category or "Not applicable".', 'A-161');
    } else {
      const pct = c.oldRegime ? (GOVT_EMPLOYER.includes(c.empCat) ? 0.14 : 0.10) : 0.14;
      const cap = Math.floor(c.grossSalary * pct);
      if (ccd2 > cap) {
        err('IncomeDeductions.DeductUndChapVIA.Section80CCDEmployer',
          `The deduction u/s 80CCD(2) (${ccd2}) cannot exceed ${Math.round(pct * 100)}% of salary for the selected employer category (${cap}).`,
          c.oldRegime ? (GOVT_EMPLOYER.includes(c.empCat) ? 'A-47' : 'A-25') : 'A-263');
      }
    }
  }
  /* 80CCH — rules 224, 225 */
  const cch = claimed('AnyOthSec80CCH');
  if (cch > 0) {
    const cap = Math.min(Math.floor(c.salary171 * 0.462), 288000);
    if (cch > cap) {
      err('IncomeDeductions.DeductUndChapVIA.AnyOthSec80CCH', `The deduction u/s 80CCH (${cch}) cannot exceed 46.2% of the salary u/s 17(1) subject to Rs. 2,88,000 (${cap}).`, 'A-224');
    }
    if (c.empCat !== 'CGOV') {
      err('IncomeDeductions.DeductUndChapVIA.AnyOthSec80CCH', 'A deduction u/s 80CCH can be claimed only when the nature of employment is Central Government.', 'A-225');
    }
  }
  /* PRAN — rules 402, 407 */
  const pranRows = rows(v('IncomeDeductions.UsrDeductUndChapVIA.PRANDtls'))
    .filter((r) => !isEmpty(r['PRANNum']));
  const nps = claimed('Section80CCDEmployeeOrSE') + claimed('Section80CCD1B');
  if (nps > 0 && pranRows.length === 0) {
    err('IncomeDeductions.UsrDeductUndChapVIA.PRANDtls', 'The PRAN must be provided in Schedule VI-A to claim a deduction u/s 80CCD(1) or 80CCD(1B).', 'A-402');
  }
  if (pranRows.length > 0 && nps === 0) {
    err('IncomeDeductions.UsrDeductUndChapVIA.PRANDtls', 'A PRAN has been entered in Chapter VI-A although the amounts claimed u/s 80CCD(1) and 80CCD(1B) are both zero.', 'A-407');
  }
  /* 80CCC — rules 409, 366 */
  const ccc = entered('Section80CCC');
  const cccRows = rows(v('IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC'));
  if (ccc > 0 && cccRows.length === 0) {
    err('IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC', 'At least one row giving the type of identifier, the identifier number and the amount must be added when a deduction u/s 80CCC is claimed.', 'A-409');
  }
  if (cccRows.length > 0 && ne(sum(cccRows, 'Amount'), ccc)) {
    err('IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC', `The sum of the individual 80CCC rows (${sum(cccRows, 'Amount')}) must equal the amount claimed u/s 80CCC in the income details (${ccc}).`, 'A-366');
  }
}

/* ── 5h: Schedule 80G ─────────────────────────────────────────────────────── */

const G80_TOTALS: Array<[string, string, string, string, string, string]> = [
  ['Don100Percent', 'TotDon100PercentCash', 'TotDon100PercentOtherMode', 'TotDon100Percent', 'TotEligibleDon100Percent', 'A-104'],
  ['Don50PercentNoApprReqd', 'TotDon50PercentNoApprReqdCash', 'TotDon50PercentNoApprReqdOtherMode', 'TotDon50PercentNoApprReqd', 'TotEligibleDon50Percent', 'A-105'],
  ['Don100PercentApprReqd', 'TotDon100PercentApprReqdCash', 'TotDon100PercentApprReqdOtherMode', 'TotDon100PercentApprReqd', 'TotEligibleDon100PercentApprReqd', 'A-106'],
  ['Don50PercentApprReqd', 'TotDon50PercentApprReqdCash', 'TotDon50PercentApprReqdOtherMode', 'TotDon50PercentApprReqd', 'TotEligibleDon50PercentApprReqd', 'A-107'],
];
const G80_ROW_RULES: Record<string, string> = {
  Don100Percent: 'A-99',
  Don50PercentNoApprReqd: 'A-100',
  Don100PercentApprReqd: 'A-101',
  Don50PercentApprReqd: 'A-102',
};

function checkSchedule80G(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const g = obj(v('Schedule80G'));
  if (!g) return;
  let tableTotal = 0;
  const panCash = new Map<string, number>();
  const panSeen = new Map<string, string[]>();

  for (const [table, cashKey, otherKey, totKey, , totRule] of G80_TOTALS) {
    const t = obj(g[table]);
    if (!t) continue;
    tableTotal += num(t[totKey]);
    // A-104..A-107
    if (!isEmpty(t[totKey]) && ne(num(t[totKey]), num(t[cashKey]) + num(t[otherKey]))) {
      err(`Schedule80G.${table}.${totKey}`, `The total donation (${num(t[totKey])}) must equal the sum of the donation in cash and the donation in other mode (${num(t[cashKey]) + num(t[otherKey])}).`, totRule);
    }
    const donees = rows(t['DoneeWithPan']);
    // table totals versus the individual rows
    if (donees.length > 0) {
      const cashSum = sum(donees, 'DonationAmtCash');
      const otherSum = sum(donees, 'DonationAmtOtherMode');
      if (!isEmpty(t[cashKey]) && ne(num(t[cashKey]), cashSum)) {
        err(`Schedule80G.${table}.${cashKey}`, `The total donation in cash (${num(t[cashKey])}) must equal the sum of the individual cash donations (${cashSum}).`, totRule);
      }
      if (!isEmpty(t[otherKey]) && ne(num(t[otherKey]), otherSum)) {
        err(`Schedule80G.${table}.${otherKey}`, `The total donation in other mode (${num(t[otherKey])}) must equal the sum of the individual donations in other mode (${otherSum}).`, totRule);
      }
    }
    donees.forEach((d, i) => {
      const base = `Schedule80G.${table}.DoneeWithPan[${i}]`;
      const cash = num(d['DonationAmtCash']);
      const other = num(d['DonationAmtOtherMode']);
      const total = num(d['DonationAmt']);
      const elig = num(d['EligibleDonationAmt']);
      const pan = str(d['DoneePAN']).toUpperCase();
      // A-99..A-102
      if (cash === 0 && other === 0) {
        err(`${base}.DonationAmtCash`, `Donee ${i + 1}: either the donation in cash or the donation in other mode must be entered.`, G80_ROW_RULES[table]);
      }
      // A-399
      if (cash > 0 && other > 0) {
        err(`${base}.DonationAmtCash`, `Donee ${i + 1}: either a cash donation or a donation in other mode may be entered in a row — not both.`, 'A-399');
      }
      // row total
      if (!isEmpty(d['DonationAmt']) && ne(total, cash + other)) {
        err(`${base}.DonationAmt`, `Donee ${i + 1}: the total donation (${total}) must equal the sum of the cash donation and the donation in other mode (${cash + other}).`, G80_ROW_RULES[table]);
      }
      // A-395
      if (total > 0 && !pan) {
        err(`${base}.DoneePAN`, `Donee ${i + 1}: the PAN of the donee is mandatory when the donation amount is greater than zero.`, 'A-395');
      }
      // A-98
      if (pan && (pan === c.pan.toUpperCase() || (c.verPan && pan === c.verPan.toUpperCase()))) {
        err(`${base}.DoneePAN`, `Donee ${i + 1}: the PAN of the donee cannot be the PAN of the assessee or the PAN quoted at verification.`, 'A-98');
      }
      // A-394
      if (other > 0) {
        if (isEmpty(d['IFSCCode']) || isEmpty(d['TransactionRefNum'])) {
          err(`${base}.IFSCCode`, `Donee ${i + 1}: the IFSC code and the transaction reference number are mandatory when the donation is made in a mode other than cash.`, 'A-394');
        }
        const ifsc = str(d['IFSCCode']);
        if (ifsc && !IFSC_RE.test(ifsc)) {
          err(`${base}.IFSCCode`, `Donee ${i + 1}: the IFSC code "${ifsc}" is not in the valid format (AAAA0######).`, 'A-123');
        }
      }
      // A-35
      if (elig > total) {
        err(`${base}.EligibleDonationAmt`, `Donee ${i + 1}: the eligible amount of donation (${elig}) cannot exceed the amount of donation (${total}).`, 'A-35');
      }
      // A-108 / A-396 — cash donations
      if (cash > 0) {
        panCash.set(pan, (panCash.get(pan) ?? 0) + cash);
        if (c.oldRegime && cash > 2000 && elig > 0) {
          err(`${base}.EligibleDonationAmt`, `Donee ${i + 1}: an individual cash donation exceeding Rs. 2,000 is not eligible for a deduction — the eligible amount must be nil.`, 'A-108');
        }
        if (c.oldRegime && cash <= 2000 && elig > Math.min(2000, cash)) {
          err(`${base}.EligibleDonationAmt`, `Donee ${i + 1}: the eligible amount of a cash donation cannot exceed the lower of Rs. 2,000 and the amount donated (${Math.min(2000, cash)}).`, 'A-396');
        }
      }
      // A-109
      if (pan) {
        const arn = str(d['ArnNbr']);
        const list = panSeen.get(pan) ?? [];
        if (pan !== 'AAAAR1077P' && list.length > 0 && !(table === 'Don50PercentNoApprReqd' && arn && !list.includes(arn))) {
          err(`${base}.DoneePAN`, `Donee ${i + 1}: the PAN "${pan}" of the donee appears more than once in Schedule 80G.`, 'A-109');
        }
        list.push(arn);
        panSeen.set(pan, list);
      }
    });
  }
  // A-103
  if (!isEmpty(g['TotalDonationsUs80G']) && ne(num(g['TotalDonationsUs80G']), tableTotal)) {
    err('Schedule80G.TotalDonationsUs80G', `Schedule 80G table E: the total donations (${num(g['TotalDonationsUs80G'])}) must equal the sum of the totals of tables A, B, C and D (${tableTotal}).`, 'A-103');
  }
  // A-36
  const elig80G = num(g['TotalEligibleDonationsUs80G']);
  if (c.claimed('Section80G') > elig80G) {
    err('IncomeDeductions.DeductUndChapVIA.Section80G', `The deduction claimed u/s 80G (${c.claimed('Section80G')}) cannot exceed the eligible amount of donation in Schedule 80G (${elig80G}).`, 'A-36');
  }
  // cash donations aggregating over Rs. 2,000 for the same PAN
  if (c.oldRegime) {
    for (const [pan, total] of panCash) {
      if (pan && total > 2000) {
        warn('Schedule80G', `Cash donations to the donee with PAN ${pan} aggregate to Rs. ${total} — the eligible amount of such cash donations must be nil.`, 'A-108');
      }
    }
  }
}

/* ── 5i: Schedule 80GGC ───────────────────────────────────────────────────── */

function checkSchedule80GGC(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const g = obj(v('Schedule80GGC'));
  const claimed80GGC = c.claimed('Section80GGC');
  // A-241
  if (claimed80GGC > 0 && !g) {
    err('Schedule80GGC', 'A deduction u/s 80GGC has been claimed in the income details, so the same amount and details must be provided in Schedule 80GGC.', 'A-241');
    return;
  }
  if (!g) return;

  const list = rows(g['Schedule80GGCDetails']);
  const cashSum = sum(list, 'DonationAmtCash');
  const otherSum = sum(list, 'DonationAmtOtherMode');
  const totSum = sum(list, 'DonationAmt');

  // A-245
  if (list.length > 0) {
    if (!isEmpty(g['TotalDonationAmtCash80GGC']) && ne(num(g['TotalDonationAmtCash80GGC']), cashSum)) {
      err('Schedule80GGC.TotalDonationAmtCash80GGC', `Schedule 80GGC sl. A: the total donation in cash (${num(g['TotalDonationAmtCash80GGC'])}) must equal the sum of the individual amounts (${cashSum}).`, 'A-245');
    }
    if (!isEmpty(g['TotalDonationAmtOtherMode80GGC']) && ne(num(g['TotalDonationAmtOtherMode80GGC']), otherSum)) {
      err('Schedule80GGC.TotalDonationAmtOtherMode80GGC', `Schedule 80GGC sl. B: the total donation in other mode (${num(g['TotalDonationAmtOtherMode80GGC'])}) must equal the sum of the individual amounts (${otherSum}).`, 'A-245');
    }
    if (!isEmpty(g['TotalDonationsUs80GGC']) && ne(num(g['TotalDonationsUs80GGC']), totSum)) {
      err('Schedule80GGC.TotalDonationsUs80GGC', `Schedule 80GGC sl. C: the total donation (${num(g['TotalDonationsUs80GGC'])}) must equal the sum of the individual amounts (${totSum}).`, 'A-245');
    }
  }
  // A-243
  if (!isEmpty(g['TotalDonationsUs80GGC'])
    && ne(num(g['TotalDonationsUs80GGC']), num(g['TotalDonationAmtCash80GGC']) + num(g['TotalDonationAmtOtherMode80GGC']))) {
    err('Schedule80GGC.TotalDonationsUs80GGC', 'Schedule 80GGC: the total donation must equal the sum of the donation in cash and the donation in other mode.', 'A-243');
  }
  // A-244
  const eligSum = Math.min(sum(list, 'EligibleDonationAmt'), c.gti);
  if (list.length > 0 && !isEmpty(g['TotalEligibleDonationAmt80GGC'])
    && ne(num(g['TotalEligibleDonationAmt80GGC']), eligSum)) {
    err('Schedule80GGC.TotalEligibleDonationAmt80GGC', `Schedule 80GGC sl. D: the eligible amount of donation must equal the sum of the individual amounts restricted to the gross total income (${eligSum}).`, 'A-244');
  }
  // A-241 — the amount in Chapter VI-A must match Schedule 80GGC
  if (!isEmpty(g['TotalEligibleDonationAmt80GGC']) && ne(claimed80GGC, num(g['TotalEligibleDonationAmt80GGC']))) {
    err('IncomeDeductions.DeductUndChapVIA.Section80GGC', `The deduction claimed u/s 80GGC (${claimed80GGC}) must match the eligible amount of donation in Schedule 80GGC (${num(g['TotalEligibleDonationAmt80GGC'])}).`, 'A-241');
  }

  list.forEach((r, i) => {
    const base = `Schedule80GGC.Schedule80GGCDetails[${i}]`;
    const date = str(r['DonationDate']);
    const cash = num(r['DonationAmtCash']);
    const other = num(r['DonationAmtOtherMode']);
    const total = num(r['DonationAmt']);
    const elig = num(r['EligibleDonationAmt']);
    // A-246
    if (!date) {
      err(`${base}.DonationDate`, `80GGC row ${i + 1}: the date of donation is mandatory.`, 'A-246');
    } else if (DATE_RE.test(date) && (date < PY_START || date > PY_END)) {
      // A-256
      err(`${base}.DonationDate`, `80GGC row ${i + 1}: a deduction u/s 80GGC may be claimed only for contributions made between 01/04/2025 and 31/03/2026 (found ${date}).`, 'A-256');
    }
    // A-247
    if (other === 0) {
      err(`${base}.DonationAmtOtherMode`, `80GGC row ${i + 1}: contributions in cash are not eligible u/s 80GGC — the details of the donation made in another mode are required.`, 'A-247');
    }
    if (!isEmpty(r['DonationAmt']) && ne(total, cash + other)) {
      err(`${base}.DonationAmt`, `80GGC row ${i + 1}: the total donation (${total}) must equal the sum of the cash donation and the donation in other mode (${cash + other}).`, 'A-243');
    }
    // A-242
    if (elig > Math.min(other, c.gti)) {
      err(`${base}.EligibleDonationAmt`, `80GGC row ${i + 1}: the eligible amount must equal the donation made in another mode restricted to the gross total income (${Math.min(other, c.gti)}).`, 'A-242');
    }
    // A-398
    if (total > 0 && (isEmpty(r['PoliticalPartyName']) || isEmpty(r['PoliticalPartyPAN']))) {
      err(`${base}.PoliticalPartyName`, `80GGC row ${i + 1}: the name and PAN of the political party are necessary to claim a deduction u/s 80GGC.`, 'A-398');
    }
    const ppan = str(r['PoliticalPartyPAN']);
    if (ppan && !PAN_RE.test(ppan)) {
      err(`${base}.PoliticalPartyPAN`, `80GGC row ${i + 1}: the PAN of the political party is not a valid PAN.`, 'SCHEMA');
    }
    const ifsc = str(r['IFSCCode']);
    if (ifsc && !IFSC_RE.test(ifsc)) {
      err(`${base}.IFSCCode`, `80GGC row ${i + 1}: the IFSC code "${ifsc}" is not in the valid format (AAAA0######).`, 'A-123');
    }
  });
}

/* ── 5j: Schedule 80D ─────────────────────────────────────────────────────── */

/** [amount field, cap, components, cap-rule, sum-rule, dropdown, allowed flag, label] */
const D80_ROWS: Array<[string, number, string[], string, string, string, string, string]> = [
  ['SelfAndFamily', 25000, ['HealthInsPremSlfFam', 'PrevHlthChckUpSlfFam'], 'A-168', 'A-169', 'SeniorCitizenFlag', 'N', 'sl. 1a (self & family)'],
  ['SelfAndFamilySeniorCitizen', 50000, ['HlthInsPremSlfFamSrCtzn', 'PrevHlthChckUpSlfFamSrCtzn', 'MedicalExpSlfFamSrCtzn'], 'A-171', 'A-172', 'SeniorCitizenFlag', 'Y', 'sl. 1b (self & family incl. senior citizen)'],
  ['Parents', 25000, ['HlthInsPremParents', 'PrevHlthChckUpParents'], 'A-173', 'A-174', 'ParentsSeniorCitizenFlag', 'N', 'sl. 2a (parents)'],
  ['ParentsSeniorCitizen', 50000, ['HlthInsPremParentsSrCtzn', 'PrevHlthChckUpParentsSrCtzn', 'MedicalExpParentsSrCtzn'], 'A-175', 'A-176', 'ParentsSeniorCitizenFlag', 'Y', 'sl. 2b (parents incl. senior citizen)'],
];

function checkSchedule80D(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const h = obj(v('Schedule80D.Sec80DSelfFamSrCtznHealth'));
  if (!h) return;
  const B = 'Schedule80D.Sec80DSelfFamSrCtznHealth';
  const selfFlag = str(h['SeniorCitizenFlag']);
  const parentFlag = str(h['ParentsSeniorCitizenFlag']);

  for (const [field, cap, parts, capRule, sumRule, flagField, allowed, label] of D80_ROWS) {
    const amt = num(h[field]);
    const components = parts.reduce((t, k) => t + num(h[k]), 0);
    // A-168 / A-171 / A-173 / A-175
    if (amt > cap) {
      err(`${B}.${field}`, `Schedule 80D ${label}: the deduction (${amt}) is allowable only to the extent of Rs. ${cap.toLocaleString('en-IN')}.`, capRule);
    }
    // A-169 / A-172 / A-174 / A-176
    if (components < cap && !isEmpty(h[field]) && ne(amt, components)) {
      err(`${B}.${field}`, `Schedule 80D ${label}: the deduction (${amt}) must equal the total of the individual components (${components}).`, sumRule);
    }
    // A-216..A-221
    const flag = flagField === 'SeniorCitizenFlag' ? selfFlag : parentFlag;
    if (amt > 0 && flag && flag !== allowed) {
      const notClaiming = flag === 'S' || flag === 'P';
      err(`${B}.${field}`,
        notClaiming
          ? `Schedule 80D ${label}: no deduction may be claimed because the drop-down is set to "not claiming".`
          : `Schedule 80D ${label}: this deduction may be claimed only when the drop-down at sl. ${flagField === 'SeniorCitizenFlag' ? '1' : '2'} is selected as "${allowed === 'Y' ? 'Yes' : 'No'}".`,
        notClaiming
          ? (flagField === 'SeniorCitizenFlag' ? 'A-220' : 'A-221')
          : (allowed === 'Y'
            ? (flagField === 'SeniorCitizenFlag' ? 'A-217' : 'A-219')
            : (flagField === 'SeniorCitizenFlag' ? 'A-216' : 'A-218')));
    }
  }
  // A-170 — preventive health check-up ceiling
  const prev = ['PrevHlthChckUpSlfFam', 'PrevHlthChckUpSlfFamSrCtzn', 'PrevHlthChckUpParents', 'PrevHlthChckUpParentsSrCtzn']
    .reduce((t, k) => t + num(h[k]), 0);
  if (prev > 5000) {
    err(`${B}.PrevHlthChckUpSlfFam`, `Schedule 80D: the total amount of preventive health check-up across all fields (${prev}) cannot exceed Rs. 5,000.`, 'A-170');
  }
  // A-177 / A-178
  const elig = num(h['EligibleAmountOfDedn']);
  const blockSum = D80_ROWS.reduce((t, [f]) => t + num(h[f]), 0);
  if (elig > 100000) {
    err(`${B}.EligibleAmountOfDedn`, `Schedule 80D sl. 3: the eligible amount of deduction (${elig}) is allowable only to the extent of Rs. 1,00,000.`, 'A-177');
  }
  if (blockSum <= 100000 && !isEmpty(h['EligibleAmountOfDedn']) && ne(elig, Math.min(blockSum, c.gti))) {
    err(`${B}.EligibleAmountOfDedn`, `Schedule 80D sl. 3: the eligible amount of deduction must equal the total of sl. 1a, 1b, 2a and 2b subject to the gross total income (${Math.min(blockSum, c.gti)}).`, 'A-178');
  }
  // A-232
  if (c.isHUF && (num(h['Parents']) > 0 || num(h['ParentsSeniorCitizen']) > 0)) {
    err(`${B}.Parents`, 'An HUF is not eligible for the deduction at sl. no. 2 of Schedule 80D.', 'A-232');
  }
  // A-306..A-309 — the insurer name / policy number rows are mandatory to claim
  // the health-insurance premium at each of sl. 1a(i), 1b(i), 2a(i) and 2b(i)
  for (const [block, premiumField, label, detailRule] of D80_BLOCKS) {
    if (num(h[premiumField]) <= 0) continue;
    const b = obj(h[block]);
    if (!b || rows(b['Sch80DInsDtls']).length === 0) {
      err(`${B}.${block}.Sch80DInsDtls`, `Schedule 80D ${label}: the name of the insurer, the policy number and the premium paid must be provided to claim the deduction for health insurance.`, detailRule);
    }
  }
  // A-283..A-286 — the policy rows must reconcile with the premium field
  for (const [block, premiumField, label] of D80_BLOCKS) {
    const b = obj(h[block]);
    if (!b) continue;
    const rowSum = sum(rows(b['Sch80DInsDtls']), 'HealthInsAmt');
    const tot = num(b['TotalPayments']);
    if (!isEmpty(b['TotalPayments']) && ne(tot, rowSum)) {
      err(`${B}.${block}.TotalPayments`, `Schedule 80D ${label}: the total of the premium payments (${tot}) must equal the sum of the individual rows (${rowSum}).`, 'A-283');
    }
    if (!isEmpty(h[premiumField]) && ne(num(h[premiumField]), rowSum)) {
      err(`${B}.${premiumField}`, `Schedule 80D ${label}: the health-insurance premium entered (${num(h[premiumField])}) must match the break-up of the individual rows (${rowSum}).`, 'A-283');
    }
  }
  // A-329 — the deduction claimed in Chapter VI-A must not exceed Schedule 80D
  if (c.claimed('Section80D') > elig && !isEmpty(h['EligibleAmountOfDedn'])) {
    err('IncomeDeductions.DeductUndChapVIA.Section80D', `The deduction claimed u/s 80D (${c.claimed('Section80D')}) cannot exceed the eligible amount computed in Schedule 80D (${elig}).`, 'A-329');
  }
}

/* ── 5k: schedule ↔ Chapter VI-A links, loan-date windows ─────────────────── */

const LOAN_SCHEDULES: Array<[string, string, string, string, string, string, string]> = [
  // [schedule, rows key, interest key, total key, VIA field, link rule, sum rule]
  ['Schedule80E', 'Schedule80EDtls', 'Interest80E', 'TotalInterest80E', 'Section80E', 'A-291', 'A-297'],
  ['Schedule80EE', 'Schedule80EEDtls', 'Interest80EE', 'TotalInterest80EE', 'Section80EE', 'A-292', 'A-298'],
  ['Schedule80EEA', 'Schedule80EEADtls', 'Interest80EEA', 'TotalInterest80EEA', 'Section80EEA', 'A-293', 'A-299'],
  ['Schedule80EEB', 'Schedule80EEBDtls', 'Interest80EEB', 'TotalInterest80EEB', 'Section80EEB', 'A-294', 'A-300'],
];

/** [schedule, window start, window end, rule] */
const LOAN_WINDOWS: Array<[string, string, string, string, string]> = [
  ['Schedule80EE', 'Schedule80EEDtls', '2016-04-01', '2017-03-31', 'A-301'],
  ['Schedule80EEA', 'Schedule80EEADtls', '2019-04-01', '2022-03-31', 'A-279'],
  ['Schedule80EEB', 'Schedule80EEBDtls', '2019-04-01', '2023-03-31', 'A-281'],
];

function checkScheduleLinks(v: Val, err: Err, warn: Warn, c: Ctx): void {
  for (const [sched, rowsKey, intKey, totKey, viaField, linkRule, sumRule] of LOAN_SCHEDULES) {
    const s = obj(v(sched));
    const want = c.claimed(viaField);
    const section = viaField.replace('Section', '');
    // A-274 / A-275 / A-277 / A-280
    if (want > 0 && !s) {
      err(sched,
        `The details of the bank from which the loan was taken must be provided in ${sched.replace('Schedule', 'Schedule ')} to claim a deduction u/s ${section}.`,
        sched === 'Schedule80E' ? 'A-274' : sched === 'Schedule80EE' ? 'A-275' : sched === 'Schedule80EEA' ? 'A-277' : 'A-280');
      continue;
    }
    if (!s) continue;
    const list = rows(s[rowsKey]);
    const rowSum = sum(list, intKey);
    const tot = num(s[totKey]);
    if (list.length > 0 && !isEmpty(s[totKey]) && ne(tot, rowSum)) {
      err(`${sched}.${totKey}`, `${sched.replace('Schedule', 'Schedule ')}: the total of the interest paid (${tot}) must equal the sum of the individual rows (${rowSum}).`, sumRule);
    }
    if (!isEmpty(s[totKey]) && ne(want, tot)) {
      err(`IncomeDeductions.DeductUndChapVIA.${viaField}`, `The deduction u/s ${section} in Schedule VI-A (${want}) must match the total interest paid as per ${sched.replace('Schedule', 'Schedule ')} (${tot}).`, linkRule);
    }
    if (list.length === 0) {
      err(`${sched}.${rowsKey}`, `${sched.replace('Schedule', 'Schedule ')}: at least one row giving the details of the bank from which the loan was taken is required.`, linkRule);
    }
  }
  // A-279 / A-281 / A-301 — the sanction-date windows
  for (const [sched, rowsKey, from, to, rule] of LOAN_WINDOWS) {
    rows(v(`${sched}.${rowsKey}`)).forEach((r, i) => {
      const d = str(r['DateofLoan']);
      if (d && DATE_RE.test(d) && (d < from || d > to)) {
        err(`${sched}.${rowsKey}[${i}].DateofLoan`, `${sched.replace('Schedule', 'Schedule ')} row ${i + 1}: the date of sanction of the loan (${d}) must be between ${from} and ${to}.`, rule);
      }
    });
  }
  // A-276 — the 80EE loan ceiling
  rows(v('Schedule80EE.Schedule80EEDtls')).forEach((r, i) => {
    if (num(r['TotalLoanAmt']) > 3500000) {
      err(`Schedule80EE.Schedule80EEDtls[${i}].TotalLoanAmt`, `Schedule 80EE row ${i + 1}: a deduction u/s 80EE may be claimed only if the loan taken does not exceed Rs. 35,00,000.`, 'A-276');
    }
  });
  // A-278 — the 80EEA stamp-duty ceiling
  const stamp = num(v('Schedule80EEA.PropStmpDtyVal'));
  if (obj(v('Schedule80EEA')) && stamp > 4500000) {
    err('Schedule80EEA.PropStmpDtyVal', `A deduction u/s 80EEA may be claimed only on a residential house property with a stamp value up to Rs. 45,00,000 (found ${stamp}).`, 'A-278');
  }
  // A-270 — 80EE / 80EEA require the section 24(b) limit to be exhausted
  const totalInterest24B = rows(v('IncomeDeductions.PropertyDetails'))
    .reduce((t, p) => t + num(at(p, 'Rentdetails.IntOnBorwCap')), 0);
  if ((c.claimed('Section80EE') > 0 || c.claimed('Section80EEA') > 0) && totalInterest24B < 200000) {
    err('IncomeDeductions.DeductUndChapVIA.Section80EE', `A deduction u/s 80EE / 80EEA may be claimed only once the limit u/s 24(b) has been exhausted (interest claimed u/s 24(b) is ${totalInterest24B}).`, 'A-270');
  }
  // A-271 / A-272 — the loan must also appear in Schedule 24(b)
  const loans24B = new Set<string>();
  rows(v('IncomeDeductions.PropertyDetails')).forEach((p) => {
    rows(at(p, 'Rentdetails.Section24B.Section24BDtls')).forEach((l) => {
      loans24B.add(str(l['LoanAccNoOfBankOrInstnRefNo']).trim().toUpperCase());
    });
  });
  for (const [sched, rowsKey, rule] of [
    ['Schedule80EE', 'Schedule80EEDtls', 'A-271'],
    ['Schedule80EEA', 'Schedule80EEADtls', 'A-272'],
  ] as const) {
    rows(v(`${sched}.${rowsKey}`)).forEach((r, i) => {
      const acc = str(r['LoanAccNoOfBankOrInstnRefNo']).trim().toUpperCase();
      if (acc && loans24B.size > 0 && !loans24B.has(acc)) {
        err(`${sched}.${rowsKey}[${i}].LoanAccNoOfBankOrInstnRefNo`, `${sched.replace('Schedule', 'Schedule ')} row ${i + 1}: the details of the bank from which the loan was taken must be part of the details disclosed in Schedule 24(b).`, rule);
      }
    });
  }
  /* Schedule 80C — A-273, A-290, A-296 */
  const s80c = obj(v('Schedule80C'));
  const want80c = c.claimed('Section80C');
  if (want80c > 0 && !s80c) {
    err('Schedule80C', 'The nature of payment, the amount eligible for deduction u/s 80C and the policy / document identification number must be provided in Schedule 80C.', 'A-273');
  }
  if (s80c) {
    const list = rows(s80c['Schedule80CDtls']);
    const rowSum = sum(list, 'Amount');
    if (list.length > 0 && !isEmpty(s80c['TotalAmt']) && ne(num(s80c['TotalAmt']), rowSum)) {
      err('Schedule80C.TotalAmt', `Schedule 80C: the total of the payments (${num(s80c['TotalAmt'])}) must equal the sum of the individual rows (${rowSum}).`, 'A-296');
    }
    if (!isEmpty(s80c['TotalAmt']) && ne(want80c, num(s80c['TotalAmt']))) {
      err('IncomeDeductions.DeductUndChapVIA.Section80C', `The deduction u/s 80C claimed under Chapter VI-A (${want80c}) must equal the total of the payments in Schedule 80C (${num(s80c['TotalAmt'])}).`, 'A-290');
    }
  }
  /* Schedule 80DD / 80U — A-248..A-253, A-146, A-147, A-42, A-182, A-254 */
  const dd = obj(v('Schedule80DD'));
  if (dd) {
    const amt = num(dd['DeductionAmount']);
    const type = str(dd['TypeOfDisability']);
    const fixed = type === '2' ? 125000 : 75000;
    if (amt > 0 && ne(amt, fixed)) {
      err('Schedule80DD.DeductionAmount',
        `Schedule 80DD: the fixed amount that can be claimed for the category "${type === '2' ? 'dependent with severe disability' : 'dependent with disability'}" is Rs. ${fixed.toLocaleString('en-IN')}.`,
        type === '2' ? 'A-147' : 'A-146');
    }
    if (amt > 0 && isEmpty(dd['Form10IAAckNum'])) {
      err('Schedule80DD.Form10IAAckNum', 'The acknowledgement number of Form 10-IA is required to claim a deduction u/s 80DD.', 'A-252');
    }
    if (ne(c.claimed('Section80DD'), amt) || ne(c.entered('Section80DD'), amt)) {
      err('IncomeDeductions.DeductUndChapVIA.Section80DD', `The amount at Section 80DD in Schedule VI-A (user ${c.entered('Section80DD')} / system ${c.claimed('Section80DD')}) must equal the deduction amount in Schedule 80DD (${amt}).`, 'A-248');
    }
    // A-254 — the dependent of an HUF must be a member of the HUF
    if (c.isHUF && str(dd['DependentType']) && !['6', '7', '8'].includes(str(dd['DependentType']))) {
      warn('Schedule80DD.DependentType', 'An HUF may claim a deduction u/s 80DD only for a dependent who is a member of the HUF.', 'A-254');
    }
  } else if (c.claimed('Section80DD') > 0) {
    err('Schedule80DD', 'A deduction u/s 80DD is greater than zero, so the details must be provided in Schedule 80DD.', 'A-250');
  }
  const u = obj(v('Schedule80U'));
  if (u) {
    const amt = num(u['DeductionAmount']);
    const type = str(u['TypeOfDisability']);
    const fixed = type === '2' ? 125000 : 75000;
    if (amt > 0 && ne(amt, fixed)) {
      err('Schedule80U.DeductionAmount', `Schedule 80U: the fixed amount that can be claimed for the category "${type === '2' ? 'self with severe disability' : 'self with disability'}" is Rs. ${fixed.toLocaleString('en-IN')}.`, type === '2' ? 'A-182' : 'A-42');
    }
    if (amt > 0 && isEmpty(u['Form10IAAckNum'])) {
      err('Schedule80U.Form10IAAckNum', 'The acknowledgement number of Form 10-IA is required to claim a deduction u/s 80U.', 'A-253');
    }
    if (ne(c.claimed('Section80U'), amt) || ne(c.entered('Section80U'), amt)) {
      err('IncomeDeductions.DeductUndChapVIA.Section80U', `The amount at Section 80U in Schedule VI-A (user ${c.entered('Section80U')} / system ${c.claimed('Section80U')}) must equal the deduction amount in Schedule 80U (${amt}).`, 'A-249');
    }
  } else if (c.claimed('Section80U') > 0) {
    err('Schedule80U', 'A deduction u/s 80U is greater than zero, so the details must be provided in Schedule 80U.', 'A-251');
  }
}

/* ── 5l: taxes paid, TDS / TCS / IT schedules, refund ─────────────────────── */

function checkTaxesPaid(v: Val, err: Err, warn: Warn, c: Ctx): void {
  const advance = num(v('TaxPaid.TaxesPaid.AdvanceTax'));
  const tds = num(v('TaxPaid.TaxesPaid.TDS'));
  const tcs = num(v('TaxPaid.TaxesPaid.TCS'));
  const sat = num(v('TaxPaid.TaxesPaid.SelfAssessmentTax'));
  const totalPaid = num(v('TaxPaid.TaxesPaid.TotalTaxesPaid'));
  const totTaxPlus = num(v('TaxComputation.TotTaxPlusIntrstPay'));
  const balance = num(v('TaxPaid.BalTaxPayable'));
  const refund = num(v('Refund.RefundDue'));

  // A-127
  if (!isEmpty(v('TaxPaid.TaxesPaid.TotalTaxesPaid')) && ne(totalPaid, advance + tds + tcs + sat)) {
    err('TaxPaid.TaxesPaid.TotalTaxesPaid', `D15: the total taxes paid (${totalPaid}) must equal the sum of the advance tax, TDS, TCS and self-assessment tax (${advance + tds + tcs + sat}).`, 'A-127');
  }
  // A-129
  if (!isEmpty(v('TaxPaid.BalTaxPayable')) && ne(balance, Math.max(totTaxPlus - totalPaid, 0))) {
    err('TaxPaid.BalTaxPayable', `D16: the balance tax payable (${balance}) must equal the total tax, fee and interest less the total taxes paid (${Math.max(totTaxPlus - totalPaid, 0)}).`, 'A-129');
  }
  // A-128
  if (!isEmpty(v('Refund.RefundDue')) && ne(refund, Math.max(totalPaid - totTaxPlus, 0))) {
    err('Refund.RefundDue', `D17: the refund due (${refund}) must equal the total taxes paid less the total tax, fee and interest (${Math.max(totalPaid - totTaxPlus, 0)}).`, 'A-128');
  }

  /* Schedule IT — A-110, A-133, A-134 */
  const itRows = rows(v('ScheduleIT.TaxPayment'));
  if (obj(v('ScheduleIT'))) {
    const itSum = sum(itRows, 'Amt');
    if (!isEmpty(v('ScheduleIT.TotalTaxPayments')) && ne(num(v('ScheduleIT.TotalTaxPayments')), itSum)) {
      err('ScheduleIT.TotalTaxPayments', `Schedule IT: the total of column 4 (${num(v('ScheduleIT.TotalTaxPayments'))}) must equal the sum of the individual values (${itSum}).`, 'A-110');
    }
  }
  const advSum = itRows.filter((r) => {
    const d = str(r['DateDep']);
    return DATE_RE.test(d) && d >= PY_START && d <= PY_END;
  }).reduce((t, r) => t + num(r['Amt']), 0);
  const satSum = itRows.filter((r) => {
    const d = str(r['DateDep']);
    return DATE_RE.test(d) && d > PY_END;
  }).reduce((t, r) => t + num(r['Amt']), 0);
  if (itRows.length > 0) {
    if (ne(advance, advSum)) {
      err('TaxPaid.TaxesPaid.AdvanceTax', `D11: the total advance tax paid (${advance}) must equal the total of the challans in Schedule IT deposited during the previous year 2025-26 (${advSum}).`, 'A-133');
    }
    if (ne(sat, satSum)) {
      err('TaxPaid.TaxesPaid.SelfAssessmentTax', `D14: the total self-assessment tax paid (${sat}) must equal the total of the challans in Schedule IT deposited after 31/03/2026 (${satSum}).`, 'A-134');
    }
  }

  /* Schedule TCS — A-111, A-112, A-132 */
  const tcsRows = rows(v('ScheduleTCS.TCS'));
  tcsRows.forEach((r, i) => {
    if (num(r['AmtTCSClaimedThisYear']) > num(r['TotalTCS'])) {
      err(`ScheduleTCS.TCS[${i}].AmtTCSClaimedThisYear`, `Schedule TCS row ${i + 1}: the amount of TCS claimed this year (${num(r['AmtTCSClaimedThisYear'])}) cannot exceed the tax collected (${num(r['TotalTCS'])}).`, 'A-111');
    }
  });
  if (obj(v('ScheduleTCS'))) {
    const tcsSum = sum(tcsRows, 'AmtTCSClaimedThisYear');
    if (!isEmpty(v('ScheduleTCS.TotalSchTCS')) && ne(num(v('ScheduleTCS.TotalSchTCS')), tcsSum)) {
      err('ScheduleTCS.TotalSchTCS', `Schedule TCS: the total of column 5 (${num(v('ScheduleTCS.TotalSchTCS'))}) must equal the sum of the individual values (${tcsSum}).`, 'A-112');
    }
    if (ne(tcs, num(v('ScheduleTCS.TotalSchTCS')))) {
      err('TaxPaid.TaxesPaid.TCS', `D13: the total TCS claimed (${tcs}) must equal the total TCS claimed in Schedule TCS (${num(v('ScheduleTCS.TotalSchTCS'))}).`, 'A-132');
    }
  }

  /* Schedule TDS1 — A-118, A-165 */
  const tds1Rows = rows(v('TDSonSalaries.TDSonSalary'));
  if (obj(v('TDSonSalaries'))) {
    const tds1Sum = sum(tds1Rows, 'TotalTDSSal');
    if (!isEmpty(v('TDSonSalaries.TotalTDSonSalaries')) && ne(num(v('TDSonSalaries.TotalTDSonSalaries')), tds1Sum)) {
      err('TDSonSalaries.TotalTDSonSalaries', `Schedule TDS1: the total of column 4 (${num(v('TDSonSalaries.TotalTDSonSalaries'))}) must equal the sum of the individual values (${tds1Sum}).`, 'A-118');
    }
    if ((c.isHUF || c.isFirm) && tds1Sum > 0) {
      err('TDSonSalaries.TotalTDSonSalaries', 'An HUF or a Firm (other than LLP) cannot report TDS on salary in Schedule TDS1.', 'A-165');
    }
  }

  /* Schedules TDS2 and TDS3 — A-113..A-122, A-310 */
  const tds2Rows = rows(v('TDSonOthThanSals.TDSonOthThanSalDtls'));
  tds2Rows.forEach((r, i) => {
    const base = `TDSonOthThanSals.TDSonOthThanSalDtls[${i}]`;
    const claimedTds = num(r['TDSClaimed']);
    const deducted = num(r['TDSDeducted']);
    const bf = num(r['BroughtFwdTDSAmt']);
    if (claimedTds > deducted + bf) {
      err(`${base}.TDSClaimed`, `Schedule TDS2 row ${i + 1}: the amount of TDS claimed this year (${claimedTds}) cannot exceed the tax deducted (${deducted + bf}).`, 'A-113');
    }
    // A-114
    if (bf > 0 && isEmpty(r['DeductedYr'])) {
      err(`${base}.DeductedYr`, `Schedule TDS2 row ${i + 1}: the year of tax deduction cannot be blank when brought-forward TDS is claimed.`, 'A-114');
    }
    // A-115
    if (bf > 0 && deducted > 0) {
      err(`${base}.BroughtFwdTDSAmt`, `Schedule TDS2 row ${i + 1}: unclaimed TDS brought forward and the TDS of the current financial year must be shown in different rows.`, 'A-115');
    }
    // A-121 / A-122
    if (claimedTds > 0) {
      if (isEmpty(r['GrossAmount']) || isEmpty(r['HeadOfIncome'])) {
        err(`${base}.GrossAmount`, `Schedule TDS2 row ${i + 1}: the corresponding gross amount (col. 7) and head of income (col. 8) must be filled when TDS is claimed in column 6.`, 'A-122');
      } else if (claimedTds > num(r['GrossAmount'])) {
        // A-116 / A-117
        err(`${base}.TDSClaimed`, `Schedule TDS2 row ${i + 1}: the TDS claimed (${claimedTds}) cannot exceed the income disclosed (${num(r['GrossAmount'])}).`, 'A-116');
      }
    }
    // A-310
    if (SALARY_TDS_SECTIONS.includes(str(r['TDSSection']))) {
      err(`${base}.TDSSection`, `Schedule TDS2 row ${i + 1}: section ${str(r['TDSSection'])} applies to tax deducted on salary income and cannot be selected in the schedule for income other than salary.`, 'A-310');
    }
  });
  if (obj(v('TDSonOthThanSals'))) {
    const tds2Sum = sum(tds2Rows, 'TDSClaimed');
    if (!isEmpty(v('TDSonOthThanSals.TotalTDSonOthThanSals')) && ne(num(v('TDSonOthThanSals.TotalTDSonOthThanSals')), tds2Sum)) {
      err('TDSonOthThanSals.TotalTDSonOthThanSals', `Schedule TDS2: the total of column 6 (${num(v('TDSonOthThanSals.TotalTDSonOthThanSals'))}) must equal the sum of the individual values (${tds2Sum}).`, 'A-119');
    }
  }
  const tds3Rows = rows(v('ScheduleTDS3Dtls.TDS3Details'));
  tds3Rows.forEach((r, i) => {
    const base = `ScheduleTDS3Dtls.TDS3Details[${i}]`;
    const claimedTds = num(r['TDSClaimed']);
    if (claimedTds > 0 && (isEmpty(r['GrossAmount']) || isEmpty(r['HeadOfIncome']))) {
      err(`${base}.GrossAmount`, `Schedule TDS3 row ${i + 1}: the corresponding gross amount and head of income must be filled when TDS is claimed.`, 'A-121');
    }
    if (num(r['BroughtFwdTDSAmt']) > 0 && isEmpty(r['DeductedYr'])) {
      err(`${base}.DeductedYr`, `Schedule TDS3 row ${i + 1}: the year of tax deduction cannot be blank when brought-forward TDS is claimed.`, 'A-114');
    }
    const tenantPan = str(r['PANofTenant']);
    if (tenantPan && !PAN_RE.test(tenantPan)) {
      err(`${base}.PANofTenant`, `Schedule TDS3 row ${i + 1}: the PAN of the tenant is not a valid PAN.`, 'SCHEMA');
    }
  });
  if (obj(v('ScheduleTDS3Dtls'))) {
    const tds3Sum = sum(tds3Rows, 'TDSClaimed');
    if (!isEmpty(v('ScheduleTDS3Dtls.TotalTDS3Details')) && ne(num(v('ScheduleTDS3Dtls.TotalTDS3Details')), tds3Sum)) {
      err('ScheduleTDS3Dtls.TotalTDS3Details', `Schedule TDS3: the total of column 6 (${num(v('ScheduleTDS3Dtls.TotalTDS3Details'))}) must equal the sum of the individual values (${tds3Sum}).`, 'A-120');
    }
  }
  // A-126 / A-131 — total TDS claimed versus the three TDS schedules
  const tdsSchedules = num(v('TDSonSalaries.TotalTDSonSalaries'))
    + num(v('TDSonOthThanSals.TotalTDSonOthThanSals'))
    + num(v('ScheduleTDS3Dtls.TotalTDS3Details'));
  const anyTdsSchedule = obj(v('TDSonSalaries')) || obj(v('TDSonOthThanSals')) || obj(v('ScheduleTDS3Dtls'));
  if (anyTdsSchedule && ne(tds, tdsSchedules)) {
    err('TaxPaid.TaxesPaid.TDS', `D12: the total TDS claimed (${tds}) must equal the sum of the total TDS claimed in Schedules TDS1, TDS2(i) and TDS2(ii) (${tdsSchedules}).`, 'A-131');
  }
  if (!anyTdsSchedule && tds > 0) {
    err('TaxPaid.TaxesPaid.TDS', 'TDS has been claimed in the "Tax paid and verification" schedule but no details have been provided in Schedules TDS1, TDS2 or TDS3.', 'A-126');
  }
  if (!obj(v('ScheduleTCS')) && tcs > 0) {
    err('TaxPaid.TaxesPaid.TCS', 'TCS has been claimed in the "Tax paid and verification" schedule but no details have been provided in Schedule TCS.', 'A-126');
  }
  if (!obj(v('ScheduleIT')) && advance + sat > 0) {
    err('TaxPaid.TaxesPaid.AdvanceTax', 'Advance tax / self-assessment tax has been claimed but no challan details have been provided in Schedule IT.', 'A-126');
  }
  // A-215 — 10(10CC) cannot exceed the TDS claimed u/s 192
  const tax10cc = rows(v('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls'))
    .filter((r) => str(r['SalNatureDesc']) === '10(10CC)')
    .reduce((t, r) => t + num(r['SalOthAmount']), 0);
  if (tax10cc > 0 && tax10cc > sum(tds1Rows, 'TotalTDSSal')) {
    err('IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', `The exempt allowance u/s 10(10CC) (${tax10cc}) cannot exceed the TDS claimed u/s 192 in Schedule TDS1 (${sum(tds1Rows, 'TotalTDSSal')}).`, 'A-215');
  }
}

export default checkMandatory;
