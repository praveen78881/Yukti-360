/**
 * OFFICIAL mandatory-field validator — ITR-1 (Sahaj), AY 2026-27.
 *
 * Sources (this exact form-year only):
 *  - ITD JSON schema "ITR-1_2026_Main_V1.1" (SchemaVer/FormVer "Ver1.0") — the
 *    RECURSIVE required-property chain is distilled into REQ / ARRAYS / COND_OBJ
 *    below; this module never imports the raw schema.
 *  - CBDT "ITR 1 — Validation Rules for AY 2026-27" v1.0 (15-May-2026),
 *    Category A table (339 rules) — every rule checkable on the exported JSON
 *    alone is encoded (rule ids "A-<sl.no>"; a few are grouped, e.g.
 *    "A-272..291"). Rules needing CPC / PAN-database / RBI-IFSC / 26AS / the
 *    actual upload date are intentionally NOT encoded, or are downgraded to a
 *    warning where a partial check is still useful (e.g. A-151).
 *
 * Coverage: all 352 schema-required leaf paths (root chain, CreationInfo,
 * Form_ITR1, PersonalInfo, FilingStatus, income/deduction, tax computation,
 * taxes paid, refund/bank, Verification, and every required scalar of the
 * optional schedules once that schedule is present) plus ~247 category-A rules.
 *
 * Payload root: { ITR: { ITR1: {...} } }. checkMandatory never throws.
 */

import type { MandatoryChecker, MandatoryIssue, MissingField } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr1';
const AY = '2026-27';
const SCHEMA_VERSION = 'Ver1.0'; // Form_ITR1.SchemaVer / FormVer of ITR-1_2026_Main_V1.1

const P = 'ITR.ITR1.';

/* ── UI hints (sections of the ITR-1 tool) ──────────────────────────────────── */
const H_GEN = 'Part A — General Information';
const H_INC = 'Part B — Gross Total Income';
const H_DED = 'Part C — Deductions and Taxable Total Income';
const H_TAX = 'Part D — Computation of Tax Payable';
const H_TP = 'Schedules IT / TDS / TCS — Taxes Paid';
const H_BANK = 'Part E — Bank Account Details';
const H_VER = 'Verification';
const H_EXPORT = 'Generated automatically on JSON export (CreationInfo / Form block)';

/* ── Required scalar chain (from the schema's recursive `required` tree) ─────
 * [path relative to ITR.ITR1, CA-readable label, hint]
 * Numeric fields with value 0 count as filled (isEmpty(0) === false).        */
type ReqRow = readonly [string, string, string];
const REQ: readonly ReqRow[] = [
  // CreationInfo — required by schema, normally stamped by the exporter
  ['CreationInfo.SWVersionNo', 'Software version number', H_EXPORT],
  ['CreationInfo.SWCreatedBy', 'Software provider id (SWxxxxxxxx)', H_EXPORT],
  ['CreationInfo.JSONCreatedBy', 'JSON created-by id (SWxxxxxxxx)', H_EXPORT],
  ['CreationInfo.JSONCreationDate', 'JSON creation date (YYYY-MM-DD)', H_EXPORT],
  ['CreationInfo.IntermediaryCity', 'Intermediary city', H_EXPORT],
  ['CreationInfo.Digest', 'Digest', H_EXPORT],
  // Form identity
  ['Form_ITR1.FormName', 'Form name (must be "ITR-1")', H_EXPORT],
  ['Form_ITR1.Description', 'Form description', H_EXPORT],
  ['Form_ITR1.AssessmentYear', 'Assessment year (must be "2026")', H_EXPORT],
  ['Form_ITR1.SchemaVer', 'Schema version (must be "Ver1.0")', H_EXPORT],
  ['Form_ITR1.FormVer', 'Form version (must be "Ver1.0")', H_EXPORT],
  // PersonalInfo
  ['PersonalInfo.AssesseeName.SurNameOrOrgName', 'Last name / surname of the assessee', H_GEN],
  ['PersonalInfo.PAN', 'PAN of the assessee', H_GEN],
  ['PersonalInfo.Address.ResidenceNo', 'Address: flat / door / building number', H_GEN],
  ['PersonalInfo.Address.LocalityOrArea', 'Address: locality / area', H_GEN],
  ['PersonalInfo.Address.CityOrTownOrDistrict', 'Address: city / town / district', H_GEN],
  ['PersonalInfo.Address.StateCode', 'Address: state code', H_GEN],
  ['PersonalInfo.Address.CountryCode', 'Address: country code', H_GEN],
  ['PersonalInfo.Address.CountryCodeMobile', 'Mobile number country code', H_GEN],
  ['PersonalInfo.Address.MobileNo', 'Mobile number', H_GEN],
  ['PersonalInfo.Address.EmailAddress', 'E-mail address', H_GEN],
  ['PersonalInfo.SecondaryAdd', 'Is the secondary address same as primary? (Y/N)', H_GEN],
  ['PersonalInfo.DOB', 'Date of birth (YYYY-MM-DD)', H_GEN],
  ['PersonalInfo.EmployerCategory', 'Nature of employment / employer category', H_GEN],
  // FilingStatus
  ['FilingStatus.ReturnFileSec', 'Section under which the return is filed', H_GEN],
  ['FilingStatus.OptOutNewTaxRegime', 'Opting out of new tax regime u/s 115BAC(6)? (Y/N)', H_GEN],
  ['FilingStatus.AsseseeRepFlg', 'Is the return filed by a representative assessee? (Y/N)', H_GEN],
  ['FilingStatus.ItrFilingDueDate', 'ITR filing due date (2026-07-31)', H_GEN],
  // Income & deductions
  ['ITR1_IncomeDeductions.GrossSalary', 'Gross salary', H_INC],
  ['ITR1_IncomeDeductions.NetSalary', 'Net salary', H_INC],
  ['ITR1_IncomeDeductions.DeductionUs16', 'Total deductions u/s 16', H_INC],
  ['ITR1_IncomeDeductions.IncomeFromSal', 'Income chargeable under Salaries', H_INC],
  ['ITR1_IncomeDeductions.IncomeOthSrc', 'Income from other sources', H_INC],
  ['ITR1_IncomeDeductions.GrossTotIncome', 'Gross total income', H_INC],
  ['ITR1_IncomeDeductions.GrossTotIncomeIncLTCG112A', 'Gross total income including LTCG u/s 112A', H_INC],
  ['ITR1_IncomeDeductions.TotalIncome', 'Total income', H_DED],
  // Tax computation
  ['ITR1_TaxComputation.TotalTaxPayable', 'Tax payable on total income', H_TAX],
  ['ITR1_TaxComputation.Rebate87A', 'Rebate u/s 87A', H_TAX],
  ['ITR1_TaxComputation.TaxPayableOnRebate', 'Tax after rebate', H_TAX],
  ['ITR1_TaxComputation.EducationCess', 'Health & education cess', H_TAX],
  ['ITR1_TaxComputation.GrossTaxLiability', 'Total tax and cess', H_TAX],
  ['ITR1_TaxComputation.Section89', 'Relief u/s 89', H_TAX],
  ['ITR1_TaxComputation.NetTaxLiability', 'Balance tax after relief', H_TAX],
  ['ITR1_TaxComputation.TotalIntrstPay', 'Total interest and fee payable', H_TAX],
  ['ITR1_TaxComputation.IntrstPay.IntrstPayUs234A', 'Interest u/s 234A', H_TAX],
  ['ITR1_TaxComputation.IntrstPay.IntrstPayUs234B', 'Interest u/s 234B', H_TAX],
  ['ITR1_TaxComputation.IntrstPay.IntrstPayUs234C', 'Interest u/s 234C', H_TAX],
  ['ITR1_TaxComputation.IntrstPay.LateFilingFee234F', 'Late filing fee u/s 234F', H_TAX],
  ['ITR1_TaxComputation.TotTaxPlusIntrstPay', 'Total tax, fee and interest', H_TAX],
  // Taxes paid
  ['TaxPaid.TaxesPaid.AdvanceTax', 'Advance tax paid', H_TP],
  ['TaxPaid.TaxesPaid.TDS', 'Total TDS claimed', H_TP],
  ['TaxPaid.TaxesPaid.TCS', 'Total TCS claimed', H_TP],
  ['TaxPaid.TaxesPaid.SelfAssessmentTax', 'Self-assessment tax paid', H_TP],
  ['TaxPaid.TaxesPaid.TotalTaxesPaid', 'Total taxes paid', H_TP],
  ['TaxPaid.BalTaxPayable', 'Balance tax payable', H_TAX],
  // Refund + bank
  ['Refund.RefundDue', 'Refund due', H_TAX],
  ['Refund.BankAccountDtls', 'Bank account details block', H_BANK],
  // Verification
  ['Verification.Declaration.AssesseeVerName', 'Name in verification declaration', H_VER],
  ['Verification.Declaration.FatherName', "Father's name in verification", H_VER],
  ['Verification.Declaration.AssesseeVerPAN', 'PAN in verification declaration', H_VER],
  ['Verification.Capacity', 'Capacity of person verifying (S/R)', H_VER],
  ['Verification.Place', 'Place of verification', H_VER],
];

/* Chapter VI-A blocks: every section field is schema-required in BOTH the
 * user-entered and system-computed blocks — generated to stay compact.       */
const VIA_SECTIONS_COMMON = [
  'Section80C', 'Section80CCC', 'Section80CCDEmployeeOrSE', 'Section80CCD1B',
  'Section80CCDEmployer', 'Section80D', 'Section80DD', 'Section80DDB',
  'Section80E', 'Section80EE', 'Section80G', 'Section80GG', 'Section80GGA',
  'Section80GGC', 'Section80U', 'Section80TTA', 'Section80TTB',
  'AnyOthSec80CCH', 'TotalChapVIADeductions',
] as const;
const VIA_ONLY_SYSTEM = ['Section80EEA', 'Section80EEB'] as const; // absent in Usr block per schema

/* ── Arrays whose ITEMS carry schema-required fields (checked per element) ── */
interface ArrSpec {
  path: string;             // relative to ITR.ITR1
  label: string;            // row label prefix
  hint: string;
  keys: readonly (readonly [string, string])[]; // [dot-path inside item, label]
}
const DEDUCTOR_KEYS = [
  ['EmployerOrDeductorOrCollectDetl.TAN', 'TAN of deductor/collector'],
  ['EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName', 'Name of deductor/collector'],
] as const;
const LOAN_KEYS = [
  ['LoanTknFrom', 'Loan taken from (Bank/Institution)'],
  ['BankOrInstnName', 'Name of bank / institution'],
  ['LoanAccNoOfBankOrInstnRefNo', 'Loan account / reference number'],
  ['DateofLoan', 'Date of sanction of loan'],
  ['TotalLoanAmt', 'Total loan amount'],
  ['LoanOutstndngAmt', 'Loan outstanding amount'],
] as const;
const DONEE_KEYS = [
  ['DoneeWithPanName', 'Name of donee'],
  ['DoneePAN', 'PAN of donee'],
  ['AddressDetail.AddrDetail', 'Address of donee'],
  ['AddressDetail.CityOrTownOrDistrict', 'City/town of donee'],
  ['AddressDetail.StateCode', 'State code of donee'],
  ['AddressDetail.PinCode', 'Pin code of donee'],
  ['DonationAmtCash', 'Donation in cash'],
  ['DonationAmtOtherMode', 'Donation in other mode'],
  ['DonationAmt', 'Total donation'],
  ['EligibleDonationAmt', 'Eligible amount of donation'],
] as const;

const ARRAYS: readonly ArrSpec[] = [
  {
    path: 'Refund.BankAccountDtls.AddtnlBankDetails', label: 'Bank account', hint: H_BANK,
    keys: [
      ['IFSCCode', 'IFSC code'], ['BankName', 'Bank name'],
      ['BankAccountNo', 'Bank account number'], ['AccountType', 'Account type'],
      ['UseForRefund', 'Use-for-refund flag'],
    ],
  },
  {
    path: 'ITR1_IncomeDeductions.PropertyDetails', label: 'House property', hint: H_INC,
    keys: [
      ['HPSNo', 'Serial number'],
      ['AddressDetailWithZipCode.AddrDetail', 'Property address'],
      ['AddressDetailWithZipCode.CityOrTownOrDistrict', 'Property city/town'],
      ['AddressDetailWithZipCode.StateCode', 'Property state code'],
      ['AddressDetailWithZipCode.CountryCode', 'Property country code'],
      ['PropertyOwner', 'Property owner (Self/Minor/Spouse/Other)'],
      ['PropCoOwnedFlg', 'Is the property co-owned? (YES/NO)'],
      ['ifLetOut', 'Type of house property (Let out / Deemed / Self-occupied)'],
    ],
  },
  {
    path: 'TDSonSalaries.TDSonSalary', label: 'TDS on salary (Sch TDS1) row', hint: H_TP,
    keys: [...DEDUCTOR_KEYS, ['IncChrgSal', 'Income chargeable under salaries'], ['TotalTDSSal', 'Total tax deducted']],
  },
  {
    path: 'TDSonOthThanSals.TDSonOthThanSal', label: 'TDS other-than-salary (Sch TDS2) row', hint: H_TP,
    keys: [
      ...DEDUCTOR_KEYS,
      ['AmtForTaxDeduct', 'Amount on which tax deducted'],
      ['DeductedYr', 'Year of tax deduction'],
      ['TotTDSOnAmtPaid', 'Tax deducted'],
      ['ClaimOutOfTotTDSOnAmtPaid', 'TDS credit claimed this year'],
      ['TDSSection', 'Section under which TDS deducted'],
    ],
  },
  {
    path: 'ScheduleTDS3Dtls.TDS3Details', label: 'TDS u/s 194IB (Sch TDS3) row', hint: H_TP,
    keys: [
      ['PANofTenant', 'PAN of tenant'],
      ['NameOfTenant', 'Name of tenant'],
      ['GrsRcptToTaxDeduct', 'Gross receipt on which tax deducted'],
      ['DeductedYr', 'Year of tax deduction'],
      ['TDSDeducted', 'TDS deducted'],
      ['TDSClaimed', 'TDS claimed this year'],
      ['TDSSection', 'Section under which TDS deducted'],
    ],
  },
  {
    path: 'ScheduleTCS.TCS', label: 'TCS (Sch TCS) row', hint: H_TP,
    keys: [
      ...DEDUCTOR_KEYS,
      ['AmtTaxCollected', 'Amount of tax collected'],
      ['CollectedYr', 'Year of tax collection'],
      ['TotalTCS', 'Total tax collected'],
      ['AmtTCSClaimedThisYear', 'TCS claimed this year'],
    ],
  },
  {
    path: 'TaxPayments.TaxPayment', label: 'Advance/self-assessment tax (Sch IT) row', hint: H_TP,
    keys: [
      ['BSRCode', 'BSR code'], ['DateDep', 'Date of deposit'],
      ['SrlNoOfChaln', 'Challan serial number'], ['Amt', 'Amount paid'],
    ],
  },
  { path: 'Schedule80G.Don100Percent.DoneeWithPan', label: 'Sch 80G (100%, no limit) donee', hint: H_DED, keys: DONEE_KEYS },
  { path: 'Schedule80G.Don50PercentNoApprReqd.DoneeWithPan', label: 'Sch 80G (50%, no limit) donee', hint: H_DED, keys: DONEE_KEYS },
  { path: 'Schedule80G.Don100PercentApprReqd.DoneeWithPan', label: 'Sch 80G (100%, qualifying limit) donee', hint: H_DED, keys: DONEE_KEYS },
  { path: 'Schedule80G.Don50PercentApprReqd.DoneeWithPan', label: 'Sch 80G (50%, qualifying limit) donee', hint: H_DED, keys: DONEE_KEYS },
  {
    path: 'Schedule80GGA.DonationDtlsSciRsrchRuralDev', label: 'Sch 80GGA donation', hint: H_DED,
    keys: [
      ['RelevantClauseUndrDedClaimed', 'Relevant clause of 80GGA'],
      ['NameOfDonee', 'Name of donee'],
      ['AddressDetail.AddrDetail', 'Address of donee'],
      ['AddressDetail.CityOrTownOrDistrict', 'City/town of donee'],
      ['AddressDetail.StateCode', 'State code of donee'],
      ['AddressDetail.PinCode', 'Pin code of donee'],
      ['DoneePAN', 'PAN of donee'],
      ['DonationAmtCash', 'Donation in cash'],
      ['DonationAmtOtherMode', 'Donation in other mode'],
      ['DonationAmt', 'Total donation'],
      ['EligibleDonationAmt', 'Eligible amount of donation'],
    ],
  },
  {
    path: 'Schedule80GGC.Schedule80GGCDetails', label: 'Sch 80GGC contribution', hint: H_DED,
    keys: [
      ['DonationDate', 'Date of contribution'],
      ['DonationAmtCash', 'Contribution in cash'],
      ['DonationAmtOtherMode', 'Contribution in other mode'],
      ['DonationAmt', 'Total contribution'],
      ['EligibleDonationAmt', 'Eligible amount of contribution'],
    ],
  },
  { path: 'Schedule80E.Schedule80EDtls', label: 'Sch 80E loan', hint: H_DED, keys: [...LOAN_KEYS, ['Interest80E', 'Interest u/s 80E']] },
  { path: 'Schedule80EE.Schedule80EEDtls', label: 'Sch 80EE loan', hint: H_DED, keys: [...LOAN_KEYS, ['Interest80EE', 'Interest u/s 80EE']] },
  { path: 'Schedule80EEA.Schedule80EEADtls', label: 'Sch 80EEA loan', hint: H_DED, keys: [...LOAN_KEYS, ['Interest80EEA', 'Interest u/s 80EEA']] },
  { path: 'Schedule80EEB.Schedule80EEBDtls', label: 'Sch 80EEB loan', hint: H_DED, keys: [...LOAN_KEYS, ['VehicleRegNo', 'Vehicle registration number'], ['Interest80EEB', 'Interest u/s 80EEB']] },
  { path: 'Schedule80C.Schedule80CDtls', label: 'Sch 80C row', hint: H_DED, keys: [['IdentificationNo', 'Identification number of document'], ['Amount', 'Amount of payment']] },
  {
    path: 'ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc', label: 'Other-source income row', hint: H_INC,
    keys: [['OthSrcNatureDesc', 'Nature of income'], ['OthSrcOthAmount', 'Amount']],
  },
  {
    path: 'ITR1_IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls', label: 'Exempt allowance row', hint: H_INC,
    keys: [['SalNatureDesc', 'Nature of exempt allowance'], ['SalOthAmount', 'Amount']],
  },
  {
    path: 'ITR1_IncomeDeductions.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls', label: 'Exempt income row', hint: H_INC,
    keys: [['OthAmount', 'Amount']],
  },
  {
    path: 'FilingStatus.clauseiv7provisio139iDtls', label: '139(1) seventh-proviso clause(iv) row', hint: H_GEN,
    keys: [['clauseiv7provisio139iNature', 'Nature'], ['clauseiv7provisio139iAmount', 'Amount']],
  },
];

/* ── Objects that are OPTIONAL, but once present must carry these scalars ─── */
const COND_OBJ: readonly (readonly [string, readonly (readonly [string, string])[], string])[] = [
  ['TDSonSalaries', [['TotalTDSonSalaries', 'Total TDS on salaries']], H_TP],
  ['TDSonOthThanSals', [['TotalTDSonOthThanSals', 'Total TDS other than salary']], H_TP],
  ['ScheduleTDS3Dtls', [['TotalTDS3Details', 'Total TDS (Sch TDS3)']], H_TP],
  ['ScheduleTCS', [['TotalSchTCS', 'Total TCS claimed']], H_TP],
  ['TaxPayments', [['TotalTaxPayments', 'Total of tax payments (Sch IT)']], H_TP],
  ['LTCG112A', [
    ['TotSaleCnsdrn', 'LTCG 112A: total sale consideration'],
    ['TotCstAcqisn', 'LTCG 112A: total cost of acquisition'],
    ['LongCap112A', 'LTCG 112A: long-term capital gain'],
  ], H_INC],
  ['ScheduleEA10_13A', [
    ['Placeofwork', 'Sch 10(13A): place of work (Metro/Non-metro)'],
    ['ActlHRARecv', 'Sch 10(13A): actual HRA received'],
    ['ActlRentPaid', 'Sch 10(13A): actual rent paid'],
    ['DtlsSalUsSec171', 'Sch 10(13A): salary u/s 17(1)'],
    ['BasicSalary', 'Sch 10(13A): basic salary'],
    ['ActlRentPaid10Per', 'Sch 10(13A): rent paid minus 10% of salary'],
    ['Sal40Or50Per', 'Sch 10(13A): 40%/50% of salary'],
    ['EligbleExmpAllwncUs13A', 'Sch 10(13A): eligible exempt allowance'],
  ], H_INC],
  ['Schedule80DD', [
    ['NatureOfDisability', 'Sch 80DD: nature of disability'],
    ['TypeOfDisability', 'Sch 80DD: type of disability'],
    ['DeductionAmount', 'Sch 80DD: amount of deduction'],
    ['DependentType', 'Sch 80DD: type of dependent'],
  ], H_DED],
  ['Schedule80U', [
    ['NatureOfDisability', 'Sch 80U: nature of disability'],
    ['TypeOfDisability', 'Sch 80U: type of disability'],
    ['DeductionAmount', 'Sch 80U: amount of deduction'],
  ], H_DED],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth', [
    ['SeniorCitizenFlag', 'Sch 80D: self/family senior-citizen flag'],
    ['ParentsSeniorCitizenFlag', 'Sch 80D: parents senior-citizen flag'],
    ['EligibleAmountOfDedn', 'Sch 80D: eligible amount of deduction'],
  ], H_DED],
  ['Schedule80E', [['TotalInterest80E', 'Sch 80E: total interest']], H_DED],
  ['Schedule80EE', [['TotalInterest80EE', 'Sch 80EE: total interest']], H_DED],
  ['Schedule80EEA', [['PropStmpDtyVal', 'Sch 80EEA: stamp duty value of property'], ['TotalInterest80EEA', 'Sch 80EEA: total interest']], H_DED],
  ['Schedule80EEB', [['TotalInterest80EEB', 'Sch 80EEB: total interest']], H_DED],
  ['Schedule80C', [['TotalAmt', 'Sch 80C: total amount']], H_DED],
  ['Schedule80G', [
    ['TotalDonationsUs80GCash', 'Sch 80G: total donations in cash'],
    ['TotalDonationsUs80GOtherMode', 'Sch 80G: total donations in other mode'],
    ['TotalDonationsUs80G', 'Sch 80G: total donations'],
    ['TotalEligibleDonationsUs80G', 'Sch 80G: total eligible donations'],
  ], H_DED],
  ['Schedule80GGA', [
    ['TotalDonationAmtCash80GGA', 'Sch 80GGA: total donations in cash'],
    ['TotalDonationAmtOtherMode80GGA', 'Sch 80GGA: total donations in other mode'],
    ['TotalDonationsUs80GGA', 'Sch 80GGA: total donations'],
    ['TotalEligibleDonationAmt80GGA', 'Sch 80GGA: total eligible donations'],
  ], H_DED],
  ['Schedule80GGC', [
    ['TotalDonationAmtCash80GGC', 'Sch 80GGC: total contributions in cash'],
    ['TotalDonationAmtOtherMode80GGC', 'Sch 80GGC: total contributions in other mode'],
    ['TotalDonationsUs80GGC', 'Sch 80GGC: total contributions'],
    ['TotalEligibleDonationAmt80GGC', 'Sch 80GGC: total eligible contributions'],
  ], H_DED],
  ['FilingStatus.AssesseeRep', [
    ['RepName', 'Name of representative assessee'],
    ['RepEmailID', 'E-mail of representative assessee'],
    ['CountryCodeRepMobileNo', 'Representative mobile country code'],
    ['RepMobileNo', 'Representative mobile number'],
  ], H_GEN],
  ['PersonalInfo.AlternateAddress', [
    ['ResidenceNo', 'Secondary address: flat/door number'],
    ['LocalityOrArea', 'Secondary address: locality/area'],
    ['CityOrTownOrDistrict', 'Secondary address: city/town'],
    ['StateCode', 'Secondary address: state code'],
  ], H_GEN],
  ['TaxReturnPreparer', [
    ['IdentificationNoOfTRP', 'TRP identification number'],
    ['NameOfTRP', 'Name of TRP'],
  ], H_VER],
  ['ITR1_IncomeDeductions.AllwncExemptUs10', [
    ['TotalAllwncExemptUs10', 'Total allowances exempt u/s 10'],
  ], H_INC],
  ['ITR1_IncomeDeductions.ExemptIncAgriOthUs10', [
    ['ExemptIncAgriOthUs10Total', 'Total exempt income (incl. agricultural income)'],
  ], H_INC],
  // Schedule 80D — each of the four health-insurance blocks carries its own total
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamHIDtls', [
    ['Sch80DInsDtls', 'Sch 80D 1a(i): insurance policy rows'],
    ['TotalPayments', 'Sch 80D 1a(i): total premium paid'],
  ], H_DED],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamSrCtznHIDtls', [
    ['Sch80DInsDtls', 'Sch 80D 1b(i): insurance policy rows'],
    ['TotalPayments', 'Sch 80D 1b(i): total premium paid'],
  ], H_DED],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsHIDtls', [
    ['Sch80DInsDtls', 'Sch 80D 2a(i): insurance policy rows'],
    ['TotalPayments', 'Sch 80D 2a(i): total premium paid'],
  ], H_DED],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsSrCtznHIDtls', [
    ['Sch80DInsDtls', 'Sch 80D 2b(i): insurance policy rows'],
    ['TotalPayments', 'Sch 80D 2b(i): total premium paid'],
  ], H_DED],
  // Schedules whose detail array is itself schema-required once the schedule exists
  ['Schedule80E', [['Schedule80EDtls', 'Sch 80E: loan/bank detail rows']], H_DED],
  ['Schedule80EE', [['Schedule80EEDtls', 'Sch 80EE: loan/bank detail rows']], H_DED],
  ['Schedule80EEA', [['Schedule80EEADtls', 'Sch 80EEA: loan/bank detail rows']], H_DED],
  ['Schedule80EEB', [['Schedule80EEBDtls', 'Sch 80EEB: loan/bank detail rows']], H_DED],
  ['Schedule80C', [['Schedule80CDtls', 'Sch 80C: payment detail rows']], H_DED],
];

/* 80G tables: [block, the four schema-required totals] */
const G80_TABLES: readonly (readonly [string, readonly string[]])[] = [
  ['Don100Percent', ['TotDon100PercentCash', 'TotDon100PercentOtherMode', 'TotDon100Percent', 'TotEligibleDon100Percent']],
  ['Don50PercentNoApprReqd', ['TotDon50PercentNoApprReqdCash', 'TotDon50PercentNoApprReqdOtherMode', 'TotDon50PercentNoApprReqd', 'TotEligibleDon50Percent']],
  ['Don100PercentApprReqd', ['TotDon100PercentApprReqdCash', 'TotDon100PercentApprReqdOtherMode', 'TotDon100PercentApprReqd', 'TotEligibleDon100PercentApprReqd']],
  ['Don50PercentApprReqd', ['TotDon50PercentApprReqdCash', 'TotDon50PercentApprReqdOtherMode', 'TotDon50PercentApprReqd', 'TotEligibleDon50PercentApprReqd']],
];
const G80_TOT_LABEL = ['donations in cash', 'donations in other mode', 'total donations', 'total eligible donations'];

/* ── Identity-critical enums / patterns (from the schema) ──────────────────── */
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const DATE_RE = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const AADHAAR_RE = /^[0-9]{12}$/;

/* ── Small helpers ─────────────────────────────────────────────────────────── */
function num(v: unknown): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  return 0;
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
function rows(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? (v.filter((x) => x !== null && typeof x === 'object') as Record<string, unknown>[])
    : [];
}
function approx(a: number, b: number, tol = 1): boolean {
  return Math.abs(a - b) <= tol;
}
function sum(items: Record<string, unknown>[], key: string): number {
  return items.reduce((t, it) => t + num(at(it, key)), 0);
}

export const checkMandatory: MandatoryChecker = (json) => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];
  const root: unknown = json !== null && typeof json === 'object' ? json : {};

  const miss = (path: string, label: string, hint?: string) => missing.push({ path, label, hint });
  const err = (path: string, msg: string, rule?: string) => errors.push({ path, msg, rule });
  const warn = (path: string, msg: string, rule?: string) => warnings.push({ path, msg, rule });

  try {
    /* 1 ── schema-required scalar chain */
    for (const [rel, label, hint] of REQ) {
      if (isEmpty(at(root, P + rel))) miss(P + rel, label, hint);
    }
    // Chapter VI-A blocks (generated)
    for (const blk of ['UsrDeductUndChapVIA', 'DeductUndChapVIA'] as const) {
      const base = `ITR1_IncomeDeductions.${blk}`;
      const who = blk === 'UsrDeductUndChapVIA' ? 'amount claimed' : 'eligible amount';
      const sections: readonly string[] =
        blk === 'DeductUndChapVIA' ? [...VIA_SECTIONS_COMMON, ...VIA_ONLY_SYSTEM] : VIA_SECTIONS_COMMON;
      for (const sec of sections) {
        if (isEmpty(at(root, `${P}${base}.${sec}`))) {
          const nice = sec === 'TotalChapVIADeductions'
            ? 'Total Chapter VI-A deductions'
            : sec === 'AnyOthSec80CCH'
              ? 'Deduction u/s 80CCH'
              : `Deduction u/s ${sec.replace('Section', '').replace('CCDEmployeeOrSE', 'CCD(1)').replace('CCD1B', 'CCD(1B)').replace('CCDEmployer', 'CCD(2)')}`;
          miss(`${P}${base}.${sec}`, `${nice} (${who}) — enter 0 if not applicable`, H_DED);
        }
      }
    }

    /* 2 ── array items: each element must carry its schema-required fields */
    for (const spec of ARRAYS) {
      const items = rows(at(root, P + spec.path));
      items.forEach((item, i) => {
        for (const [k, lbl] of spec.keys) {
          if (isEmpty(at(item, k))) {
            miss(`${P}${spec.path}[${i}].${k}`, `${spec.label} ${i + 1}: ${lbl}`, spec.hint);
          }
        }
      });
    }
    // nested arrays inside house-property rows
    const hps = rows(at(root, `${P}ITR1_IncomeDeductions.PropertyDetails`));
    hps.forEach((hp, i) => {
      rows(hp['CoOwners']).forEach((co, j) => {
        for (const [k, lbl] of [['CoOwnersSNo', 'serial number'], ['NameCoOwner', 'name']] as const) {
          if (isEmpty(at(co, k))) {
            miss(`${P}ITR1_IncomeDeductions.PropertyDetails[${i}].CoOwners[${j}].${k}`, `House property ${i + 1}, co-owner ${j + 1}: ${lbl}`, H_INC);
          }
        }
      });
      rows(hp['TenantDetails']).forEach((tn, j) => {
        for (const [k, lbl] of [['TenantSNo', 'serial number'], ['NameofTenant', 'name of tenant']] as const) {
          if (isEmpty(at(tn, k))) {
            miss(`${P}ITR1_IncomeDeductions.PropertyDetails[${i}].TenantDetails[${j}].${k}`, `House property ${i + 1}, tenant ${j + 1}: ${lbl}`, H_INC);
          }
        }
      });
    });
    // 80D insurance-detail rows (all four blocks share one item shape)
    const d80 = at(root, `${P}Schedule80D.Sec80DSelfFamSrCtznHealth`);
    if (d80 !== undefined && d80 !== null && typeof d80 === 'object') {
      for (const blk of ['Sec80DSelfFamHIDtls', 'Sec80DSelfFamSrCtznHIDtls', 'Sec80DParentsHIDtls', 'Sec80DParentsSrCtznHIDtls']) {
        rows(at(d80, `${blk}.Sch80DInsDtls`)).forEach((ins, j) => {
          for (const [k, lbl] of [['InsurerName', 'name of insurer'], ['PolicyNo', 'policy number'], ['HealthInsAmt', 'premium amount']] as const) {
            if (isEmpty(at(ins, k))) {
              miss(`${P}Schedule80D.Sec80DSelfFamSrCtznHealth.${blk}.Sch80DInsDtls[${j}].${k}`, `Sch 80D ${blk} row ${j + 1}: ${lbl}`, H_DED);
            }
          }
        });
      }
    }

    /* 3 ── optional objects that, once present, must carry required scalars */
    for (const [rel, keys, hint] of COND_OBJ) {
      const obj = at(root, P + rel);
      if (obj === undefined || obj === null || typeof obj !== 'object') continue;
      for (const [k, lbl] of keys) {
        if (isEmpty(at(obj, k))) miss(`${P}${rel}.${k}`, lbl, hint);
      }
    }
    // 80G per-table totals (four schema-required totals per table)
    for (const [tbl, keys] of G80_TABLES) {
      const obj = at(root, `${P}Schedule80G.${tbl}`);
      if (obj === undefined || obj === null || typeof obj !== 'object') continue;
      keys.forEach((k, ki) => {
        if (isEmpty(at(obj, k))) miss(`${P}Schedule80G.${tbl}.${k}`, `Sch 80G ${tbl}: ${G80_TOT_LABEL[ki]}`, H_DED);
      });
    }
    // House-property rent details / interest u/s 24(b) — required once the block exists
    hps.forEach((hp, i) => {
      const hpBase = `${P}ITR1_IncomeDeductions.PropertyDetails[${i}]`;
      const rd = hp['Rentdetails'];
      if (rd === undefined || rd === null || typeof rd !== 'object') return;
      for (const [k, lbl] of [
        ['AnnualLetableValue', 'gross rent received / annual lettable value'],
        ['TotalUnrealizedAndTax', 'total of unrealized rent and municipal taxes'],
        ['BalanceALV', 'balance annual lettable value'],
        ['AnnualOfPropOwned', 'annual value of the property owned'],
        ['ThirtyPercentOfBalance', 'standard deduction (30% of annual value)'],
        ['IntOnBorwCap', 'interest payable on borrowed capital'],
        ['TotalDeduct', 'total deductions'],
        ['IncomeOfHP', 'income chargeable under house property'],
      ] as const) {
        if (isEmpty(at(rd, k))) miss(`${hpBase}.Rentdetails.${k}`, `House property ${i + 1}: ${lbl}`, H_INC);
      }
      const s24 = at(rd, 'Section24B');
      if (s24 === undefined || s24 === null || typeof s24 !== 'object') return;
      if (isEmpty(at(s24, 'TotalInterestUs24B'))) miss(`${hpBase}.Rentdetails.Section24B.TotalInterestUs24B`, `House property ${i + 1}: total interest u/s 24(b)`, H_INC);
      const s24rows = rows(at(s24, 'Section24BDtls'));
      if (s24rows.length === 0) miss(`${hpBase}.Rentdetails.Section24B.Section24BDtls`, `House property ${i + 1}: details of the bank from which the loan is taken (Sch 24(b))`, H_INC);
      s24rows.forEach((r, j) => {
        for (const [k, lbl] of [...LOAN_KEYS, ['InterestUs24B', 'Interest paid during the year']] as readonly (readonly [string, string])[]) {
          if (isEmpty(at(r, k))) miss(`${hpBase}.Rentdetails.Section24B.Section24BDtls[${j}].${k}`, `House property ${i + 1}, 24(b) loan ${j + 1}: ${lbl}`, H_INC);
        }
      });
    });
    // Quarterly break-up of dividend income (required once DividendInc is present)
    rows(at(root, `${P}ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc`)).forEach((r, i) => {
      const dv = at(r, 'DividendInc');
      if (dv === undefined || dv === null || typeof dv !== 'object') return;
      const dr = at(dv, 'DateRange');
      const base = `${P}ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[${i}].DividendInc.DateRange`;
      if (dr === undefined || dr === null || typeof dr !== 'object') {
        miss(base, `Other-source income row ${i + 1}: quarterly break-up of dividend income`, H_INC);
        return;
      }
      for (const [k, lbl] of [
        ['Upto15Of6', 'upto 15-Jun'], ['Upto15Of9', '16-Jun to 15-Sep'],
        ['Up16Of9To15Of12', '16-Sep to 15-Dec'], ['Up16Of12To15Of3', '16-Dec to 15-Mar'],
        ['Up16Of3To31Of3', '16-Mar to 31-Mar'],
      ] as const) {
        if (isEmpty(at(dr, k))) miss(`${base}.${k}`, `Dividend row ${i + 1}: quarterly break-up ${lbl}`, H_INC);
      }
    });
    // 80CCC pension-contribution rows
    rows(at(root, `${P}ITR1_IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC`)).forEach((r, i) => {
      for (const [k, lbl] of [
        ['TypeofIdentifier', 'type of identifier (PRAN / other)'],
        ['NameofIdentifier', 'identifier number'],
        ['Amount', 'amount'],
      ] as const) {
        if (isEmpty(at(r, k))) miss(`${P}ITR1_IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC[${i}].${k}`, `80CCC contribution ${i + 1}: ${lbl}`, H_DED);
      }
    });

    /* 4 ── identity-critical enum / pattern checks (schema constraints) */
    const pan = str(at(root, `${P}PersonalInfo.PAN`)).toUpperCase();
    if (pan !== '' && !PAN_RE.test(pan)) err(`${P}PersonalInfo.PAN`, `PAN "${pan}" is not a valid PAN (AAAAA9999A)`, 'SCHEMA');
    const vpan = str(at(root, `${P}Verification.Declaration.AssesseeVerPAN`)).toUpperCase();
    if (vpan !== '' && !PAN_RE.test(vpan)) err(`${P}Verification.Declaration.AssesseeVerPAN`, 'PAN in verification is not a valid PAN', 'SCHEMA');
    const ayVal = str(at(root, `${P}Form_ITR1.AssessmentYear`));
    if (ayVal !== '' && ayVal !== '2026') err(`${P}Form_ITR1.AssessmentYear`, `AssessmentYear must be "2026" for AY 2026-27 (got "${ayVal}")`, 'SCHEMA');
    const fn = str(at(root, `${P}Form_ITR1.FormName`));
    if (fn !== '' && fn !== 'ITR-1') err(`${P}Form_ITR1.FormName`, `FormName must be "ITR-1" (got "${fn}")`, 'SCHEMA');
    for (const k of ['SchemaVer', 'FormVer']) {
      const v = str(at(root, `${P}Form_ITR1.${k}`));
      if (v !== '' && v !== 'Ver1.0') err(`${P}Form_ITR1.${k}`, `${k} must be "Ver1.0" per the AY 2026-27 schema (got "${v}")`, 'SCHEMA');
    }
    const dob = str(at(root, `${P}PersonalInfo.DOB`));
    if (dob !== '' && !DATE_RE.test(dob)) err(`${P}PersonalInfo.DOB`, 'Date of birth must be YYYY-MM-DD', 'SCHEMA');
    const cap = str(at(root, `${P}Verification.Capacity`));
    if (cap !== '' && cap !== 'S' && cap !== 'R') err(`${P}Verification.Capacity`, 'Verification capacity must be S (Self) or R (Representative)', 'SCHEMA');
    const opt = str(at(root, `${P}FilingStatus.OptOutNewTaxRegime`));
    if (opt !== '' && opt !== 'Y' && opt !== 'N') err(`${P}FilingStatus.OptOutNewTaxRegime`, 'Opt-out-of-new-regime flag must be Y or N', 'SCHEMA');
    const aadhaar = str(at(root, `${P}PersonalInfo.AadhaarCardNo`));
    if (aadhaar !== '' && !AADHAAR_RE.test(aadhaar)) err(`${P}PersonalInfo.AadhaarCardNo`, 'Aadhaar number must be 12 digits', 'SCHEMA');
    const dueDate = str(at(root, `${P}FilingStatus.ItrFilingDueDate`));
    if (dueDate !== '' && dueDate !== '2026-07-31') err(`${P}FilingStatus.ItrFilingDueDate`, 'ITR filing due date must be "2026-07-31" per the AY 2026-27 schema', 'SCHEMA');
    rows(at(root, `${P}Refund.BankAccountDtls.AddtnlBankDetails`)).forEach((b, i) => {
      const ifsc = str(b['IFSCCode']).toUpperCase();
      if (ifsc !== '' && !IFSC_RE.test(ifsc)) err(`${P}Refund.BankAccountDtls.AddtnlBankDetails[${i}].IFSCCode`, `Bank account ${i + 1}: IFSC "${ifsc}" is not valid`, 'SCHEMA');
    });
    // at least one bank account (portal will not accept a return without one)
    if (rows(at(root, `${P}Refund.BankAccountDtls.AddtnlBankDetails`)).length === 0) {
      miss(`${P}Refund.BankAccountDtls.AddtnlBankDetails`, 'At least one bank account of the assessee', H_BANK);
    }

    /* 5 ── Category-A rules checkable on the JSON alone ─────────────────────── */
    const isOld = opt === 'Y'; // opting OUT of the new regime = old tax regime
    const isNew = opt === 'N';
    const ID = `${P}ITR1_IncomeDeductions.`;
    const TC = `${P}ITR1_TaxComputation.`;
    const D = (sec: string) => num(at(root, `${ID}DeductUndChapVIA.${sec}`));
    const n = (path: string) => num(at(root, path));
    const present = (path: string) => {
      const v = at(root, path);
      return v !== undefined && v !== null;
    };

    const gti = n(`${ID}GrossTotIncome`);
    const totalIncome = n(`${ID}TotalIncome`);
    const viaTotal = D('TotalChapVIADeductions');

    // A-1: old regime — 80C + 80CCC + 80CCD(1) capped at 1,50,000
    if (isOld && D('Section80C') + D('Section80CCC') + D('Section80CCDEmployeeOrSE') > 150000) {
      err(`${ID}DeductUndChapVIA.Section80C`, 'Sum of deductions u/s 80C, 80CCC and 80CCD(1) cannot exceed Rs. 1,50,000', 'A-1');
    }
    // A-115: old — 80CCD(1B) cap 50,000
    if (isOld && D('Section80CCD1B') > 50000) err(`${ID}DeductUndChapVIA.Section80CCD1B`, 'Deduction u/s 80CCD(1B) cannot exceed Rs. 50,000', 'A-115');
    // A-11 / A-14: old — 80TTA cap 10,000; 80TTB cap 50,000
    if (isOld && D('Section80TTA') > 10000) err(`${ID}DeductUndChapVIA.Section80TTA`, 'Deduction u/s 80TTA cannot exceed Rs. 10,000', 'A-11');
    if (isOld && D('Section80TTB') > 50000) err(`${ID}DeductUndChapVIA.Section80TTB`, 'Deduction u/s 80TTB cannot exceed Rs. 50,000', 'A-14');
    // A-13 / A-15: 80TTA vs 80TTB by age (senior = DOB on/before 01-04-1966 for AY 2026-27)
    if (DATE_RE.test(dob)) {
      if (D('Section80TTA') > 0 && dob <= '1966-04-01') err(`${ID}DeductUndChapVIA.Section80TTA`, 'Deduction u/s 80TTA cannot be claimed by a senior citizen (DOB on or before 01-04-1966) — use 80TTB', 'A-13');
      if (D('Section80TTB') > 0 && dob > '1966-04-01') err(`${ID}DeductUndChapVIA.Section80TTB`, 'Deduction u/s 80TTB can be claimed only by a senior citizen (DOB on or before 01-04-1966)', 'A-15');
    }
    // A-121 / A-122 / A-124: old-regime caps for 80EE / 80EEA / 80EEB
    if (isOld && D('Section80EE') > 50000) err(`${ID}DeductUndChapVIA.Section80EE`, 'Deduction u/s 80EE cannot exceed Rs. 50,000', 'A-121');
    if (isOld && D('Section80EEA') > 150000) err(`${ID}DeductUndChapVIA.Section80EEA`, 'Deduction u/s 80EEA cannot exceed Rs. 1,50,000', 'A-122');
    if (isOld && D('Section80EEB') > 150000) err(`${ID}DeductUndChapVIA.Section80EEB`, 'Deduction u/s 80EEB cannot exceed Rs. 1,50,000', 'A-124');
    // A-123: 80EE and 80EEA are mutually exclusive
    if (D('Section80EE') > 0 && D('Section80EEA') > 0) err(`${ID}DeductUndChapVIA.Section80EEA`, 'Only one of the deductions u/s 80EE / 80EEA is allowed', 'A-123');
    // A-114: 80GG cap 60,000
    if (isOld && D('Section80GG') > 60000) err(`${ID}DeductUndChapVIA.Section80GG`, 'Deduction u/s 80GG cannot exceed Rs. 60,000', 'A-114');
    // A-5: 80DDB cap 1,00,000
    if (isOld && D('Section80DDB') > 100000) err(`${ID}DeductUndChapVIA.Section80DDB`, 'Deduction u/s 80DDB cannot exceed Rs. 1,00,000', 'A-5');
    // A-116: 80CCD(2) not available to pensioner / NA employer categories
    const empCat = str(at(root, `${P}PersonalInfo.EmployerCategory`));
    if (D('Section80CCDEmployer') > 0 && ['PE', 'PESG', 'PEPS', 'PEO', 'NA'].indexOf(empCat) >= 0) {
      err(`${ID}DeductUndChapVIA.Section80CCDEmployer`, 'Deduction u/s 80CCD(2) cannot be claimed when employer category is Pensioner / Not Applicable', 'A-116');
    }
    // A-210: salary income disclosed but employer category "Not Applicable"
    if (empCat === 'NA' && n(`${ID}GrossSalary`) > 0) {
      err(`${P}PersonalInfo.EmployerCategory`, 'Nature of employment cannot be "Not Applicable" when salary income is disclosed', 'A-210');
    }
    // A-268: individual with DOB on/after 01-04-2008 cannot file for AY 2026-27
    if (DATE_RE.test(dob) && dob >= '2008-04-01') err(`${P}PersonalInfo.DOB`, 'Assessee born on or after 01-04-2008 is not allowed to file ITR-1 for AY 2026-27', 'A-268');

    // A-146 (with 153-159, 168-173, 175): new regime — these VI-A deductions must be 0
    if (isNew) {
      const blocked = [
        'Section80C', 'Section80CCC', 'Section80CCDEmployeeOrSE', 'Section80CCD1B',
        'Section80D', 'Section80DD', 'Section80DDB', 'Section80E', 'Section80EE',
        'Section80EEA', 'Section80EEB', 'Section80G', 'Section80GG', 'Section80GGA',
        'Section80GGC', 'Section80U', 'Section80TTA', 'Section80TTB',
      ];
      for (const sec of blocked) {
        if (D(sec) > 0) err(`${ID}DeductUndChapVIA.${sec}`, `Deduction ${sec.replace('Section', 'u/s ').replace('CCDEmployeeOrSE', 'CCD(1)').replace('CCD1B', 'CCD(1B)')} is not allowed under the new tax regime`, 'A-146');
      }
      // A-255: schedules that must not be filled under the new regime
      for (const sch of ['Schedule80C', 'ScheduleEA10_13A', 'Schedule80E', 'Schedule80EE', 'Schedule80EEA', 'Schedule80EEB']) {
        if (present(P + sch)) err(P + sch, `${sch} must not be filled when the new tax regime is selected`, 'A-255');
      }
      // A-156 / A-173 / A-175: schedule details should not be provided
      for (const sch of ['Schedule80G', 'Schedule80D', 'Schedule80GGA']) {
        if (present(P + sch)) warn(P + sch, `${sch} details should not be provided under the new tax regime`, sch === 'Schedule80G' ? 'A-156' : sch === 'Schedule80D' ? 'A-173' : 'A-175');
      }
    }

    // A-18: Chapter VI-A total cannot exceed GTI
    if (viaTotal > gti && present(`${ID}GrossTotIncome`)) {
      err(`${ID}DeductUndChapVIA.TotalChapVIADeductions`, 'Total Chapter VI-A deductions cannot exceed Gross Total Income', 'A-18');
    }
    // A-17: VI-A total must equal sum of parts (restricted to GTI)
    if (present(`${ID}DeductUndChapVIA`) && present(`${ID}GrossTotIncome`)) {
      const parts = ([...VIA_SECTIONS_COMMON, ...VIA_ONLY_SYSTEM] as readonly string[])
        .filter((s) => s !== 'TotalChapVIADeductions')
        .reduce((t, s) => t + D(s), 0);
      if (!approx(viaTotal, Math.min(parts, Math.max(gti, 0)))) {
        err(`${ID}DeductUndChapVIA.TotalChapVIADeductions`, `Total Chapter VI-A deductions (${viaTotal}) must equal the sum of individual deductions (${parts}) restricted to GTI (${gti})`, 'A-17');
      }
    }
    // A-24: TotalIncome = max(0, GTI - VI-A total)
    if (present(`${ID}TotalIncome`) && present(`${ID}GrossTotIncome`)) {
      if (!approx(totalIncome, Math.max(0, gti - viaTotal))) {
        err(`${ID}TotalIncome`, `Total income (${totalIncome}) must be Gross Total Income minus deductions (${gti} - ${viaTotal}), or 0 if negative`, 'A-24');
      }
    }
    // A-117: total income must not exceed Rs. 50 lakh for ITR-1
    if (totalIncome > 5000000) err(`${ID}TotalIncome`, 'Total income exceeds Rs. 50 lakh — ITR-1 cannot be filed', 'A-117');

    /* Salary chain */
    const grossSal = n(`${ID}GrossSalary`);
    const allwTotal = n(`${ID}AllwncExemptUs10.TotalAllwncExemptUs10`);
    const allwRows = rows(at(root, `${ID}AllwncExemptUs10.AllwncExemptUs10Dtls`));
    // A-59
    if (present(`${ID}Salary`) || present(`${ID}PerquisitesValue`) || present(`${ID}ProfitsInSalary`)) {
      const expect = n(`${ID}Salary`) + n(`${ID}PerquisitesValue`) + n(`${ID}ProfitsInSalary`);
      if (!approx(grossSal, expect)) err(`${ID}GrossSalary`, `Gross salary (${grossSal}) must equal salary 17(1) + perquisites 17(2) + profits in lieu 17(3) (${expect})`, 'A-59');
    }
    // A-60
    if (present(`${ID}GrossSalary`) && present(`${ID}NetSalary`)) {
      if (!approx(n(`${ID}NetSalary`), grossSal - allwTotal)) err(`${ID}NetSalary`, 'Net salary must be Gross salary minus exempt allowances u/s 10', 'A-60');
    }
    // A-61
    if (present(`${ID}DeductionUs16ia`) || present(`${ID}EntertainmentAlw16ii`) || present(`${ID}ProfessionalTaxUs16iii`)) {
      const expect = n(`${ID}DeductionUs16ia`) + n(`${ID}EntertainmentAlw16ii`) + n(`${ID}ProfessionalTaxUs16iii`);
      if (!approx(n(`${ID}DeductionUs16`), expect)) err(`${ID}DeductionUs16`, 'Deductions u/s 16 must equal 16(ia) + 16(ii) + 16(iii)', 'A-61');
    }
    // A-62
    if (present(`${ID}NetSalary`) && present(`${ID}IncomeFromSal`)) {
      if (!approx(n(`${ID}IncomeFromSal`), n(`${ID}NetSalary`) - n(`${ID}DeductionUs16`))) {
        err(`${ID}IncomeFromSal`, 'Income chargeable under Salaries must be Net salary minus deductions u/s 16', 'A-62');
      }
    }
    // A-63
    if (allwTotal > grossSal) err(`${ID}AllwncExemptUs10.TotalAllwncExemptUs10`, 'Exempt allowances u/s 10 cannot exceed Gross salary', 'A-63');
    // A-77: exempt-allowance total = sum of rows
    if (allwRows.length > 0 && !approx(allwTotal, sum(allwRows, 'SalOthAmount'))) {
      err(`${ID}AllwncExemptUs10.TotalAllwncExemptUs10`, 'Total exempt allowances must equal the sum of individual allowance rows', 'A-77');
    }
    // A-213 (also 37, 72): each exempt-allowance nature only once
    {
      const seen = new Set<string>();
      for (const r of allwRows) {
        const k = str(r['SalNatureDesc']);
        if (k === '' || k === 'OTH') continue;
        if (seen.has(k)) { err(`${ID}AllwncExemptUs10.AllwncExemptUs10Dtls`, `Exempt allowance "${k}" is selected more than once`, 'A-213'); break; }
        seen.add(k);
      }
      const nat = allwRows.map((r) => str(r['SalNatureDesc']));
      // A-72: only one of 10(10B)(i) / 10(10B)(ii) / 10(10C)
      if (nat.filter((x) => x === '10(10B)(i)' || x === '10(10B)(ii)' || x === '10(10C)').length > 1) {
        err(`${ID}AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Only one of Sec 10(10B)(i), 10(10B)(ii) or 10(10C) can be selected', 'A-72');
      }
      // A-112 / A-215: standard deduction u/s 16(ia) caps
      const sd = n(`${ID}DeductionUs16ia`);
      if (isOld && sd > 50000) err(`${ID}DeductionUs16ia`, 'Standard deduction u/s 16(ia) is limited to Rs. 50,000 under the old regime', 'A-112');
      if (isNew && sd > 75000) err(`${ID}DeductionUs16ia`, 'Standard deduction u/s 16(ia) is limited to Rs. 75,000 under the new regime', 'A-215');
      // A-163: new regime — entertainment allowance 16(ii) must be 0
      if (isNew && n(`${ID}EntertainmentAlw16ii`) > 0) err(`${ID}EntertainmentAlw16ii`, 'Entertainment allowance u/s 16(ii) is not allowed under the new tax regime', 'A-163');
      // A-168: new regime — professional tax 16(iii) must be 0
      if (isNew && n(`${ID}ProfessionalTaxUs16iii`) > 0) err(`${ID}ProfessionalTaxUs16iii`, 'Professional tax u/s 16(iii) is not allowed under the new tax regime', 'A-168');
      // A-149 / A-165: new regime — 10(5)/10(13A)/10(14)(i) exempt allowances not allowed
      if (isNew) {
        for (const bad of ['10(5)', '10(13A)', '10(14)(i)']) {
          const row = allwRows.find((r) => str(r['SalNatureDesc']) === bad && num(r['SalOthAmount']) > 0);
          if (row) err(`${ID}AllwncExemptUs10.AllwncExemptUs10Dtls`, `Exempt allowance u/s ${bad} is not allowed under the new tax regime`, 'A-149');
        }
      }
      // A-58: old regime — entertainment allowance only for CG/SG/PSU
      if (isOld && n(`${ID}EntertainmentAlw16ii`) > 0 && ['CGOV', 'SGOV', 'PSU'].indexOf(empCat) < 0) {
        err(`${ID}EntertainmentAlw16ii`, 'Entertainment allowance u/s 16(ii) is allowed only to Central/State Government and PSU employees', 'A-58');
      }
      // A-119: HRA u/s 10(13A) claimed together with 80GG
      const hra = allwRows.find((r) => str(r['SalNatureDesc']) === '10(13A)' && num(r['SalOthAmount']) > 0);
      if (hra && D('Section80GG') > 0) err(`${ID}DeductUndChapVIA.Section80GG`, 'Deduction u/s 80GG is not allowed when HRA u/s 10(13A) is claimed', 'A-119');
    }

    /* Other sources */
    const osRows = rows(at(root, `${ID}OthersInc.OthersIncDtlsOthSrc`));
    const ded57 = n(`${ID}DeductionUs57iia`);
    // A-52: IncomeOthSrc = sum of rows − deduction u/s 57(iia)
    if (osRows.length > 0 && present(`${ID}IncomeOthSrc`)) {
      const expect = sum(osRows, 'OthSrcOthAmount') - ded57;
      if (!approx(n(`${ID}IncomeOthSrc`), expect)) err(`${ID}IncomeOthSrc`, `Income from other sources (${n(`${ID}IncomeOthSrc`)}) must equal the sum of individual rows minus deduction u/s 57(iia) (${expect})`, 'A-52');
    }
    // A-50/51/55/56 (and A-184 family): each nature only once
    {
      const seen = new Set<string>();
      for (const r of osRows) {
        const k = str(r['OthSrcNatureDesc']);
        if (k === '' || k === 'OTH') continue;
        if (seen.has(k)) { err(`${ID}OthersInc.OthersIncDtlsOthSrc`, `Other-source income nature "${k}" is selected more than once`, 'A-50'); break; }
        seen.add(k);
      }
    }
    // A-53: 57(iia) needs family pension offered to tax
    const fapAmt = osRows.filter((r) => str(r['OthSrcNatureDesc']) === 'FAP').reduce((t, r) => t + num(r['OthSrcOthAmount']), 0);
    if (ded57 > 0 && fapAmt <= 0) err(`${ID}DeductionUs57iia`, 'Deduction u/s 57(iia) is allowed only when family pension is offered to tax', 'A-53');
    // A-54 / A-214: 57(iia) cap — old: min(1/3 FP, 15,000); new: min(1/3 FP, 25,000)
    if (ded57 > 0 && fapAmt > 0) {
      const cap57 = Math.min(Math.floor(fapAmt / 3), isNew ? 25000 : 15000) + 1; // +1 rounding per rule note
      if (ded57 > cap57) err(`${ID}DeductionUs57iia`, `Deduction u/s 57(iia) cannot exceed 1/3rd of family pension capped at Rs. ${isNew ? '25,000' : '15,000'}`, isNew ? 'A-214' : 'A-54');
    }
    // A-145: dividend total must equal its quarterly breakup
    for (const r of osRows) {
      if (str(r['OthSrcNatureDesc']) !== 'DIV') continue;
      const dr = at(r, 'DividendInc.DateRange');
      if (dr === undefined || dr === null || typeof dr !== 'object') continue;
      const qsum = ['Upto15Of6', 'Upto15Of9', 'Up16Of9To15Of12', 'Up16Of12To15Of3', 'Up16Of3To31Of3']
        .reduce((t, k) => t + num(at(dr, k)), 0);
      if (!approx(num(r['OthSrcOthAmount']), qsum)) err(`${ID}OthersInc.OthersIncDtlsOthSrc`, 'Dividend income must equal the sum of its quarterly breakup', 'A-145');
    }

    /* Exempt income */
    const exRows = rows(at(root, `${ID}ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls`));
    const exTotal = n(`${ID}ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total`);
    // A-30
    if (exRows.length > 0 && !approx(exTotal, sum(exRows, 'OthAmount'))) {
      err(`${ID}ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total`, 'Total exempt income must equal the sum of individual exempt-income rows', 'A-30');
    }
    // A-29: agricultural income shown exempt cannot exceed Rs. 5,000 in ITR-1
    for (const r of exRows) {
      if ((str(r['Category']) === 'AGRI' || str(r['SubCategory']) === '10(1)') && num(r['OthAmount']) > 5000) {
        err(`${ID}ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls`, 'Agricultural income shown as exempt cannot exceed Rs. 5,000 in ITR-1', 'A-29');
        break;
      }
    }
    // A-184: each exempt-income nature only once
    {
      const seen = new Set<string>();
      for (const r of exRows) {
        const k = `${str(r['Category'])}|${str(r['SubCategory'])}`;
        if (k === '|' || str(r['Category']) === 'OTH') continue;
        if (seen.has(k)) { err(`${ID}ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls`, 'The same nature of exempt income is selected more than once', 'A-184'); break; }
        seen.add(k);
      }
    }
    // A-323: new regime — minor child exemption u/s 10(32) must be 0
    if (isNew) {
      const minor = exRows.find((r) => str(r['SubCategory']).indexOf('10(32)') === 0 && num(r['OthAmount']) > 0);
      if (minor) err(`${ID}ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls`, 'Exempt income u/s 10(32) (minor child) is not allowed under the new tax regime', 'A-323');
    }

    /* House property */
    const hpInc = n(`${ID}TotalIncomeChargeableUnHP`);
    hps.forEach((row, i) => {
      const base = `${ID}PropertyDetails[${i}]`;
      const letOut = str(row['ifLetOut']);
      const rent = at(row, 'Rentdetails');
      const alv = num(at(row, 'Rentdetails.AnnualLetableValue'));
      const intCap = num(at(row, 'Rentdetails.IntOnBorwCap'));
      // A-45: let-out / deemed-let-out needs gross rent > 0
      if ((letOut === 'L' || letOut === 'D') && alv <= 0) err(`${base}.Rentdetails.AnnualLetableValue`, `House property ${i + 1}: gross rent / annual lettable value must be more than zero for let-out or deemed-let-out property`, 'A-45');
      // A-49: municipal taxes not allowed for self-occupied
      if (letOut === 'S' && num(at(row, 'Rentdetails.LocalTaxes')) > 0) err(`${base}.Rentdetails.LocalTaxes`, `House property ${i + 1}: tax paid to local authorities is not allowed for self-occupied property`, 'A-49');
      // A-48 / A-162: interest on borrowed capital for self-occupied
      if (letOut === 'S' && isOld && intCap > 200000) err(`${base}.Rentdetails.IntOnBorwCap`, `House property ${i + 1}: interest on borrowed capital for self-occupied property cannot exceed Rs. 2,00,000`, 'A-48');
      if (letOut === 'S' && isNew && intCap > 0) err(`${base}.Rentdetails.IntOnBorwCap`, `House property ${i + 1}: interest on borrowed capital cannot be claimed for self-occupied property under the new tax regime`, 'A-162');
      // A-336: unrealized rent cannot exceed gross rent
      if (num(at(row, 'Rentdetails.RentNotRealized')) > alv) err(`${base}.Rentdetails.RentNotRealized`, `House property ${i + 1}: unrealized rent cannot exceed the gross rent`, 'A-336');
      // A-43: standard deduction = 30% of annual value
      if (rent !== undefined && rent !== null && typeof rent === 'object') {
        const annual = at(rent, 'AnnualOfPropOwned') !== undefined ? num(at(rent, 'AnnualOfPropOwned')) : num(at(rent, 'BalanceALV'));
        const thirty = num(at(rent, 'ThirtyPercentOfBalance'));
        if (thirty !== 0 || annual !== 0) {
          if (!approx(thirty, Math.round(annual * 0.3), 1)) err(`${base}.Rentdetails.ThirtyPercentOfBalance`, `House property ${i + 1}: standard deduction must be 30% of the annual value`, 'A-43');
        }
      }
      // co-ownership rules
      const coFlag = str(row['PropCoOwnedFlg']);
      const share = num(row['AsseseeShareProperty']);
      const cos = rows(row['CoOwners']);
      if (coFlag === 'YES') {
        if (share >= 100) err(`${base}.AsseseeShareProperty`, `House property ${i + 1}: assessee's share must be less than 100% for a co-owned property`, 'A-332');
        cos.forEach((co, j) => {
          const cs = num(co['PercentShareProperty']);
          if (cs <= 0 || cs >= 100) err(`${base}.CoOwners[${j}].PercentShareProperty`, `House property ${i + 1}, co-owner ${j + 1}: share must be greater than 0% and less than 100%`, 'A-333');
          if (str(co['PAN_CoOwner']).toUpperCase() !== '' && str(co['PAN_CoOwner']).toUpperCase() === pan) err(`${base}.CoOwners[${j}].PAN_CoOwner`, `House property ${i + 1}, co-owner ${j + 1}: co-owner PAN cannot be the assessee's own PAN`, 'A-300');
        });
        const totShare = share + cos.reduce((t, co) => t + num(co['PercentShareProperty']), 0);
        if (cos.length > 0 && !approx(totShare, 100, 0.05)) err(`${base}.AsseseeShareProperty`, `House property ${i + 1}: assessee's share plus co-owners' shares must equal 100% (got ${totShare}%)`, 'A-295');
        // A-297: zero share → no interest claim
        if (present(`${base}.AsseseeShareProperty`) && share === 0 && intCap > 0) err(`${base}.Rentdetails.IntOnBorwCap`, `House property ${i + 1}: interest on borrowed capital cannot be claimed when the assessee's share is zero`, 'A-297');
      } else if (coFlag === 'NO') {
        if (present(`${base}.AsseseeShareProperty`) && share !== 100) err(`${base}.AsseseeShareProperty`, `House property ${i + 1}: assessee's share must be 100% when the property is not co-owned`, 'A-334');
      }
    });
    // A-22 / A-160 / A-174: GTI = Salary + HP + Other sources (HP loss ignored under new regime)
    if (present(`${ID}GrossTotIncome`) && present(`${ID}IncomeFromSal`) && present(`${ID}IncomeOthSrc`)) {
      const hpPart = isNew && hpInc < 0 ? 0 : hpInc;
      const expect = n(`${ID}IncomeFromSal`) + hpPart + n(`${ID}IncomeOthSrc`);
      if (!approx(gti, expect)) {
        err(`${ID}GrossTotIncome`, `Gross total income (${gti}) must equal Salary + House Property + Other Sources (${expect})${isNew && hpInc < 0 ? ' — house-property loss cannot be set off under the new regime' : ''}`, isNew ? (hpInc < 0 ? 'A-160' : 'A-174') : 'A-22');
      }
    }
    // A-292: GTI incl. LTCG = GTI + LTCG 112A
    const ltcg = n(`${P}LTCG112A.LongCap112A`);
    if (present(`${ID}GrossTotIncomeIncLTCG112A`) && present(`${ID}GrossTotIncome`)) {
      if (!approx(n(`${ID}GrossTotIncomeIncLTCG112A`), gti + ltcg)) err(`${ID}GrossTotIncomeIncLTCG112A`, 'Gross total income including LTCG must equal GTI plus LTCG u/s 112A', 'A-292');
    }
    // A-217 / A-218: LTCG 112A block
    if (present(`${P}LTCG112A`)) {
      if (ltcg > 125000) err(`${P}LTCG112A.LongCap112A`, 'LTCG u/s 112A in ITR-1 cannot exceed Rs. 1,25,000 — file ITR-2 instead', 'A-217');
      const diff = n(`${P}LTCG112A.TotSaleCnsdrn`) - n(`${P}LTCG112A.TotCstAcqisn`);
      if (diff >= 0 && diff <= 125000 && !approx(ltcg, diff)) err(`${P}LTCG112A.LongCap112A`, 'LTCG u/s 112A must equal sale consideration minus cost of acquisition', 'A-218');
    }

    /* Tax computation chain */
    if (present(`${P}ITR1_TaxComputation`)) {
      const ttp = n(`${TC}TotalTaxPayable`);
      const rebate = n(`${TC}Rebate87A`);
      // A-25
      if (!approx(n(`${TC}TaxPayableOnRebate`), Math.max(0, ttp - rebate))) err(`${TC}TaxPayableOnRebate`, 'Tax after rebate must equal tax payable on total income minus rebate u/s 87A', 'A-25');
      // A-26
      if (!approx(n(`${TC}GrossTaxLiability`), n(`${TC}TaxPayableOnRebate`) + n(`${TC}EducationCess`))) err(`${TC}GrossTaxLiability`, 'Total tax and cess must equal tax after rebate plus health & education cess', 'A-26');
      // A-27: balance tax after relief u/s 89
      if (!approx(n(`${TC}NetTaxLiability`), Math.max(0, n(`${TC}GrossTaxLiability`) - n(`${TC}Section89`)))) err(`${TC}NetTaxLiability`, 'Balance tax must equal total tax and cess minus relief u/s 89', 'A-27');
      // A-28: interest + fee total
      const intSum = n(`${TC}IntrstPay.IntrstPayUs234A`) + n(`${TC}IntrstPay.IntrstPayUs234B`) + n(`${TC}IntrstPay.IntrstPayUs234C`) + n(`${TC}IntrstPay.LateFilingFee234F`) + n(`${TC}IntrstPay.FeeFurnish234I`);
      if (present(`${TC}IntrstPay`) && !approx(n(`${TC}TotalIntrstPay`), intSum)) err(`${TC}TotalIntrstPay`, 'Total interest and fee must equal 234A + 234B + 234C + fee 234F + fee 234-I', 'A-28');
      // A-140
      if (!approx(n(`${TC}TotTaxPlusIntrstPay`), n(`${TC}NetTaxLiability`) + n(`${TC}TotalIntrstPay`))) err(`${TC}TotTaxPlusIntrstPay`, 'Total tax, fee and interest must equal balance tax after relief plus total interest and fee', 'A-140');
      // A-23 / A-192 (old) and A-191 (new) rebate limits
      if (isOld && rebate > 0 && totalIncome + ltcg > 500000) err(`${TC}Rebate87A`, 'Rebate u/s 87A is not allowed under the old regime when total income (incl. LTCG u/s 112A) exceeds Rs. 5,00,000', 'A-23');
      if (isOld && rebate > 12500) err(`${TC}Rebate87A`, 'Rebate u/s 87A under the old regime cannot exceed Rs. 12,500', 'A-192');
      if (isNew && rebate > 0 && totalIncome > 1270590) err(`${TC}Rebate87A`, 'Rebate u/s 87A is not allowed under the new regime when total income exceeds Rs. 12,70,590', 'A-191');
      // A-125: relief u/s 89 needs salary/family-pension income
      if (n(`${TC}Section89`) > 0) {
        const anySal = n(`${ID}Salary`) > 0 || n(`${ID}PerquisitesValue`) > 0 || n(`${ID}ProfitsInSalary`) > 0 || grossSal > 0 || fapAmt > 0;
        if (!anySal) err(`${TC}Section89`, 'Relief u/s 89 cannot be claimed when salary details and family pension are all zero/blank', 'A-125');
      }
    }

    /* Taxes paid & refund */
    const TPB = `${P}TaxPaid.TaxesPaid.`;
    if (present(`${TPB}TotalTaxesPaid`)) {
      const expect = n(`${TPB}AdvanceTax`) + n(`${TPB}TDS`) + n(`${TPB}TCS`) + n(`${TPB}SelfAssessmentTax`);
      // A-104
      if (!approx(n(`${TPB}TotalTaxesPaid`), expect)) err(`${TPB}TotalTaxesPaid`, 'Total taxes paid must equal TDS + TCS + advance tax + self-assessment tax', 'A-104');
      // A-105 / A-106
      const ttpi = n(`${TC}TotTaxPlusIntrstPay`);
      const paid = n(`${TPB}TotalTaxesPaid`);
      const refund = n(`${P}Refund.RefundDue`);
      const balPay = n(`${P}TaxPaid.BalTaxPayable`);
      if (refund > 0 && !approx(refund, paid - ttpi, 10)) err(`${P}Refund.RefundDue`, `Refund (${refund}) must equal total taxes paid minus total tax and interest payable (${paid - ttpi})`, 'A-105');
      if (balPay > 0 && !approx(balPay, ttpi - paid, 10)) err(`${P}TaxPaid.BalTaxPayable`, `Balance tax payable (${balPay}) must equal total tax and interest payable minus total taxes paid (${ttpi - paid})`, 'A-106');
      // A-21: taxes paid but income details empty
      if (paid > 0 && !present(`${ID}GrossTotIncome`)) warn(`${ID}GrossTotIncome`, 'Taxes paid are disclosed but income details / tax computation are not', 'A-21');
    }
    // Schedule totals vs rows
    const tds1Rows = rows(at(root, `${P}TDSonSalaries.TDSonSalary`));
    const tds2Rows = rows(at(root, `${P}TDSonOthThanSals.TDSonOthThanSal`));
    const tds3Rows = rows(at(root, `${P}ScheduleTDS3Dtls.TDS3Details`));
    const tcsRows = rows(at(root, `${P}ScheduleTCS.TCS`));
    const itRows = rows(at(root, `${P}TaxPayments.TaxPayment`));
    // A-100
    if (tds1Rows.length > 0 && !approx(n(`${P}TDSonSalaries.TotalTDSonSalaries`), sum(tds1Rows, 'TotalTDSSal'))) {
      err(`${P}TDSonSalaries.TotalTDSonSalaries`, 'Total of Sch TDS1 must equal the sum of tax deducted in individual rows', 'A-100');
    }
    // A-101
    if (tds2Rows.length > 0 && !approx(n(`${P}TDSonOthThanSals.TotalTDSonOthThanSals`), sum(tds2Rows, 'ClaimOutOfTotTDSOnAmtPaid'))) {
      err(`${P}TDSonOthThanSals.TotalTDSonOthThanSals`, 'Total of Sch TDS2 must equal the sum of TDS credit claimed in individual rows', 'A-101');
    }
    // A-102
    if (tds3Rows.length > 0 && !approx(n(`${P}ScheduleTDS3Dtls.TotalTDS3Details`), sum(tds3Rows, 'TDSClaimed'))) {
      err(`${P}ScheduleTDS3Dtls.TotalTDS3Details`, 'Total of Sch TDS3 must equal the sum of TDS claimed in individual rows', 'A-102');
    }
    // A-97
    if (tcsRows.length > 0 && !approx(n(`${P}ScheduleTCS.TotalSchTCS`), sum(tcsRows, 'AmtTCSClaimedThisYear'))) {
      err(`${P}ScheduleTCS.TotalSchTCS`, 'Total of Sch TCS must equal the sum of TCS claimed in individual rows', 'A-97');
    }
    // A-95
    if (itRows.length > 0 && !approx(n(`${P}TaxPayments.TotalTaxPayments`), sum(itRows, 'Amt'))) {
      err(`${P}TaxPayments.TotalTaxPayments`, 'Total of Sch IT must equal the sum of tax paid in individual challans', 'A-95');
    }
    // A-98 / A-96 / A-99 / A-260: per-row checks
    tds2Rows.forEach((r, i) => {
      if (num(r['ClaimOutOfTotTDSOnAmtPaid']) > num(r['TotTDSOnAmtPaid'])) err(`${P}TDSonOthThanSals.TDSonOthThanSal[${i}].ClaimOutOfTotTDSOnAmtPaid`, `Sch TDS2 row ${i + 1}: TDS claimed cannot exceed tax deducted`, 'A-98');
      if (num(r['ClaimOutOfTotTDSOnAmtPaid']) > 0 && (isEmpty(r['DeductedYr']) || str(r['DeductedYr']) === '0')) err(`${P}TDSonOthThanSals.TDSonOthThanSal[${i}].DeductedYr`, `Sch TDS2 row ${i + 1}: year of tax deduction is required when TDS is claimed`, 'A-99');
      const sec = str(r['TDSSection']);
      if (sec === '92A' || sec === '92B' || sec === '92C') err(`${P}TDSonOthThanSals.TDSonOthThanSal[${i}].TDSSection`, `Sch TDS2 row ${i + 1}: section 192 (salary TDS) cannot be selected in the other-than-salary schedule`, 'A-260');
    });
    tds3Rows.forEach((r, i) => {
      if (num(r['TDSClaimed']) > num(r['TDSDeducted'])) err(`${P}ScheduleTDS3Dtls.TDS3Details[${i}].TDSClaimed`, `Sch TDS3 row ${i + 1}: TDS claimed cannot exceed TDS deducted`, 'A-98');
      if (num(r['TDSClaimed']) > 0 && (isEmpty(r['DeductedYr']) || str(r['DeductedYr']) === '0')) err(`${P}ScheduleTDS3Dtls.TDS3Details[${i}].DeductedYr`, `Sch TDS3 row ${i + 1}: year of tax deduction is required when TDS is claimed`, 'A-99');
      const sec = str(r['TDSSection']);
      if (sec === '92A' || sec === '92B' || sec === '92C') err(`${P}ScheduleTDS3Dtls.TDS3Details[${i}].TDSSection`, `Sch TDS3 row ${i + 1}: section 192 (salary TDS) cannot be selected in the other-than-salary schedule`, 'A-260');
    });
    tcsRows.forEach((r, i) => {
      if (num(r['AmtTCSClaimedThisYear']) > num(r['TotalTCS'])) err(`${P}ScheduleTCS.TCS[${i}].AmtTCSClaimedThisYear`, `Sch TCS row ${i + 1}: TCS claimed cannot exceed tax collected`, 'A-96');
      if (num(r['AmtTCSClaimedThisYear']) > 0 && isEmpty(r['CollectedYr'])) err(`${P}ScheduleTCS.TCS[${i}].CollectedYr`, `Sch TCS row ${i + 1}: year of tax collection is required when TCS is claimed`, 'A-99');
    });
    // A-108 / A-109: taxes-paid summary vs schedules
    if (tds1Rows.length + tds2Rows.length + tds3Rows.length > 0 && present(`${TPB}TDS`)) {
      const schTds = n(`${P}TDSonSalaries.TotalTDSonSalaries`) + n(`${P}TDSonOthThanSals.TotalTDSonOthThanSals`) + n(`${P}ScheduleTDS3Dtls.TotalTDS3Details`);
      if (!approx(n(`${TPB}TDS`), schTds)) err(`${TPB}TDS`, `Total TDS claimed (${n(`${TPB}TDS`)}) must equal the totals of Sch TDS1 + TDS2 + TDS3 (${schTds})`, 'A-108');
    }
    if (tcsRows.length > 0 && present(`${TPB}TCS`) && !approx(n(`${TPB}TCS`), n(`${P}ScheduleTCS.TotalSchTCS`))) {
      err(`${TPB}TCS`, 'Total TCS claimed must equal the total of Sch TCS', 'A-109');
    }
    // A-110 / A-111: advance vs self-assessment split of Sch IT by date
    if (itRows.length > 0 && (present(`${TPB}AdvanceTax`) || present(`${TPB}SelfAssessmentTax`))) {
      let adv = 0, sat = 0;
      let datesOk = true;
      for (const r of itRows) {
        const dt = str(r['DateDep']);
        if (!DATE_RE.test(dt)) { datesOk = false; break; }
        if (dt <= '2026-03-31') adv += num(r['Amt']); else sat += num(r['Amt']);
      }
      if (datesOk) {
        if (!approx(n(`${TPB}AdvanceTax`), adv)) err(`${TPB}AdvanceTax`, `Advance tax (${n(`${TPB}AdvanceTax`)}) must equal Sch IT challans dated up to 31-03-2026 (${adv})`, 'A-110');
        if (!approx(n(`${TPB}SelfAssessmentTax`), sat)) err(`${TPB}SelfAssessmentTax`, `Self-assessment tax (${n(`${TPB}SelfAssessmentTax`)}) must equal Sch IT challans dated after 31-03-2026 (${sat})`, 'A-111');
      }
    }

    /* Donation schedules */
    const g80 = `${P}Schedule80G.`;
    const gTables: readonly (readonly [string, string])[] = [
      ['Don100Percent', '100Percent'], ['Don50PercentNoApprReqd', '50PercentNoApprReqd'],
      ['Don100PercentApprReqd', '100PercentApprReqd'], ['Don50PercentApprReqd', '50PercentApprReqd'],
    ];
    const seen80gPan = new Map<string, string>();
    for (const [tbl] of gTables) {
      const tblObj = at(root, g80 + tbl);
      if (tblObj === undefined || tblObj === null || typeof tblObj !== 'object') continue;
      const dRows = rows(at(tblObj, 'DoneeWithPan'));
      dRows.forEach((r, i) => {
        const base = `${g80}${tbl}.DoneeWithPan[${i}]`;
        const cash = num(r['DonationAmtCash']);
        const other = num(r['DonationAmtOtherMode']);
        // A-84..87
        if (!approx(num(r['DonationAmt']), cash + other)) err(`${base}.DonationAmt`, `Sch 80G ${tbl} donee ${i + 1}: total donation must equal cash + other mode`, 'A-84');
        // A-330
        if (present(`${base}.DonationAmt`) && cash === 0 && other === 0 && !isEmpty(r['DoneePAN'])) {
          err(`${base}.DonationAmtCash`, `Sch 80G ${tbl} donee ${i + 1}: either cash donation or donation in other mode must be entered`, 'A-330');
        }
        // A-139 (row level)
        if (num(r['EligibleDonationAmt']) > num(r['DonationAmt'])) err(`${base}.EligibleDonationAmt`, `Sch 80G ${tbl} donee ${i + 1}: eligible amount cannot exceed the total donation`, 'A-139');
        // A-78
        const dp = str(r['DoneePAN']).toUpperCase();
        if (dp !== '' && (dp === pan || dp === vpan)) err(`${base}.DoneePAN`, `Sch 80G ${tbl} donee ${i + 1}: donee PAN cannot be the assessee's / verifier's PAN`, 'A-78');
        // A-147: same donee PAN in two different 80G blocks
        if (dp !== '') {
          const prev = seen80gPan.get(dp);
          if (prev !== undefined && prev !== tbl) err(`${base}.DoneePAN`, `Sch 80G: donee PAN ${dp} appears in more than one 80G block`, 'A-147');
          seen80gPan.set(dp, tbl);
        }
        // A-325: other-mode donation needs IFSC + transaction reference
        if (other > 0 && (isEmpty(r['TransactionRefNum']) || isEmpty(r['IFSCCode']))) {
          err(`${base}.TransactionRefNum`, `Sch 80G ${tbl} donee ${i + 1}: IFSC and transaction reference number are mandatory for donations in other than cash`, 'A-325');
        }
      });
    }
    // A-139 (schedule level)
    if (present(`${P}Schedule80G`) && n(`${g80}TotalEligibleDonationsUs80G`) > n(`${g80}TotalDonationsUs80G`)) {
      err(`${g80}TotalEligibleDonationsUs80G`, 'Sch 80G: total eligible donations cannot exceed total donations', 'A-139');
    }
    // A-8 / A-10: 80G claimed needs schedule; claim capped by schedule's eligible total
    if (isOld && D('Section80G') > 0) {
      if (!present(`${P}Schedule80G`)) err(`${ID}DeductUndChapVIA.Section80G`, 'Deduction u/s 80G is claimed but Schedule 80G is not filled', 'A-8');
      else if (D('Section80G') > n(`${g80}TotalEligibleDonationsUs80G`)) err(`${ID}DeductUndChapVIA.Section80G`, 'Deduction u/s 80G cannot exceed the eligible amount of donation in Schedule 80G', 'A-10');
    }
    // 80GGA
    const gga = `${P}Schedule80GGA.`;
    const ggaRows = rows(at(root, `${gga}DonationDtlsSciRsrchRuralDev`));
    const ggaCashPans = new Set<string>();
    ggaRows.forEach((r, i) => {
      const base = `${gga}DonationDtlsSciRsrchRuralDev[${i}]`;
      const cash = num(r['DonationAmtCash']);
      const other = num(r['DonationAmtOtherMode']);
      // A-90
      if (!approx(num(r['DonationAmt']), cash + other)) err(`${base}.DonationAmt`, `Sch 80GGA row ${i + 1}: total donation must equal cash + other mode`, 'A-90');
      // A-143
      if (cash > 2000) err(`${base}.DonationAmtCash`, `Sch 80GGA row ${i + 1}: deduction u/s 80GGA is not allowed for cash donation above Rs. 2,000`, 'A-143');
      // A-92
      if (num(r['EligibleDonationAmt']) > num(r['DonationAmt'])) err(`${base}.EligibleDonationAmt`, `Sch 80GGA row ${i + 1}: eligible amount cannot exceed the total donation`, 'A-92');
      // A-94
      const dp = str(r['DoneePAN']).toUpperCase();
      if (dp !== '' && (dp === pan || dp === vpan)) err(`${base}.DoneePAN`, `Sch 80GGA row ${i + 1}: donee PAN cannot be the assessee's / verifier's PAN`, 'A-94');
      // A-118 / A-144: same donee PAN in multiple cash rows
      if (dp !== '' && cash > 0) {
        if (ggaCashPans.has(dp)) err(`${base}.DoneePAN`, 'Sch 80GGA: the same donee PAN cannot appear more than once for cash donations', 'A-118');
        ggaCashPans.add(dp);
      }
      // A-330
      if (present(`${base}.DonationAmt`) && cash === 0 && other === 0) {
        err(`${base}.DonationAmtCash`, `Sch 80GGA row ${i + 1}: either cash donation or donation in other mode must be entered`, 'A-330');
      }
    });
    if (present(`${P}Schedule80GGA`) && n(`${gga}TotalEligibleDonationAmt80GGA`) > n(`${gga}TotalDonationsUs80GGA`)) {
      err(`${gga}TotalEligibleDonationAmt80GGA`, 'Sch 80GGA: total eligible donations cannot exceed total donations', 'A-92');
    }
    // A-91 / A-93
    if (isOld && D('Section80GGA') > 0) {
      if (!present(`${P}Schedule80GGA`)) err(`${ID}DeductUndChapVIA.Section80GGA`, 'Deduction u/s 80GGA is claimed but Schedule 80GGA is not filled', 'A-91');
      else if (D('Section80GGA') > n(`${gga}TotalEligibleDonationAmt80GGA`)) err(`${ID}DeductUndChapVIA.Section80GGA`, 'Deduction u/s 80GGA cannot exceed the eligible amount of donation in Schedule 80GGA', 'A-93');
    }
    // 80GGC
    const ggc = `${P}Schedule80GGC.`;
    const ggcRows = rows(at(root, `${ggc}Schedule80GGCDetails`));
    ggcRows.forEach((r, i) => {
      const base = `${ggc}Schedule80GGCDetails[${i}]`;
      const cash = num(r['DonationAmtCash']);
      const other = num(r['DonationAmtOtherMode']);
      // A-195
      if (!approx(num(r['DonationAmt']), cash + other)) err(`${base}.DonationAmt`, `Sch 80GGC row ${i + 1}: total contribution must equal cash + other mode`, 'A-195');
      // A-211: contribution date within FY 2025-26
      const dt = str(r['DonationDate']);
      if (DATE_RE.test(dt) && (dt < '2025-04-01' || dt > '2026-03-31')) err(`${base}.DonationDate`, `Sch 80GGC row ${i + 1}: contribution must be made between 01-04-2025 and 31-03-2026 for AY 2026-27`, 'A-211');
      // A-330
      if (present(`${base}.DonationAmt`) && cash === 0 && other === 0) {
        err(`${base}.DonationAmtCash`, `Sch 80GGC row ${i + 1}: either cash contribution or contribution in other mode must be entered`, 'A-330');
      }
    });
    // A-197: 80GGC totals = sums
    if (ggcRows.length > 0) {
      if (!approx(n(`${ggc}TotalDonationAmtCash80GGC`), sum(ggcRows, 'DonationAmtCash'))) err(`${ggc}TotalDonationAmtCash80GGC`, 'Sch 80GGC: total cash contribution must equal the sum of individual rows', 'A-197');
      if (!approx(n(`${ggc}TotalDonationAmtOtherMode80GGC`), sum(ggcRows, 'DonationAmtOtherMode'))) err(`${ggc}TotalDonationAmtOtherMode80GGC`, 'Sch 80GGC: total other-mode contribution must equal the sum of individual rows', 'A-197');
      if (!approx(n(`${ggc}TotalDonationsUs80GGC`), sum(ggcRows, 'DonationAmt'))) err(`${ggc}TotalDonationsUs80GGC`, 'Sch 80GGC: total contribution must equal the sum of individual rows', 'A-197');
    }
    // A-196
    if (present(`${P}Schedule80GGC`) && n(`${ggc}TotalEligibleDonationAmt80GGC`) > n(`${ggc}TotalDonationsUs80GGC`)) {
      err(`${ggc}TotalEligibleDonationAmt80GGC`, 'Sch 80GGC: eligible amount of contribution cannot exceed total contributions', 'A-196');
    }
    // A-193
    if (D('Section80GGC') > 0 && !present(`${P}Schedule80GGC`)) err(`${ID}DeductUndChapVIA.Section80GGC`, 'Deduction u/s 80GGC is claimed but Schedule 80GGC is not filled', 'A-193');

    /* Disability / medical / investment schedule cross-links */
    // A-205 / A-203 / A-204
    if (D('Section80DD') > 0) {
      if (!present(`${P}Schedule80DD`)) err(`${ID}DeductUndChapVIA.Section80DD`, 'Deduction u/s 80DD is claimed but Schedule 80DD is not filled', 'A-205');
      else if (isOld) {
        const nat = str(at(root, `${P}Schedule80DD.NatureOfDisability`));
        const amt = n(`${P}Schedule80DD.DeductionAmount`);
        if (nat === '1' && amt > 75000) err(`${P}Schedule80DD.DeductionAmount`, 'Deduction u/s 80DD for dependent with disability cannot exceed Rs. 75,000', 'A-203');
        if (nat === '2' && amt > 125000) err(`${P}Schedule80DD.DeductionAmount`, 'Deduction u/s 80DD for dependent with severe disability cannot exceed Rs. 1,25,000', 'A-204');
      }
    }
    // A-202 / A-200 / A-201
    if (D('Section80U') > 0) {
      if (!present(`${P}Schedule80U`)) err(`${ID}DeductUndChapVIA.Section80U`, 'Deduction u/s 80U is claimed but Schedule 80U is not filled', 'A-202');
      else if (isOld) {
        const nat = str(at(root, `${P}Schedule80U.NatureOfDisability`));
        const amt = n(`${P}Schedule80U.DeductionAmount`);
        if (nat === '1' && amt > 75000) err(`${P}Schedule80U.DeductionAmount`, 'Deduction u/s 80U for self with disability cannot exceed Rs. 75,000', 'A-201');
        if (nat === '2' && amt > 125000) err(`${P}Schedule80U.DeductionAmount`, 'Deduction u/s 80U for self with severe disability cannot exceed Rs. 1,25,000', 'A-200');
      }
    }
    // A-254 / A-138 / A-136 / A-178..183: Schedule 80D
    if (isOld && D('Section80D') > 0) {
      if (!present(`${P}Schedule80D`)) err(`${ID}DeductUndChapVIA.Section80D`, 'Deduction u/s 80D is claimed but Schedule 80D is not filled', 'A-254');
      else {
        const d80base = `${P}Schedule80D.Sec80DSelfFamSrCtznHealth.`;
        const elig = n(`${d80base}EligibleAmountOfDedn`);
        if (elig > 100000) err(`${d80base}EligibleAmountOfDedn`, 'Sch 80D: eligible amount of deduction cannot exceed Rs. 1,00,000', 'A-136');
        if (present(`${d80base}EligibleAmountOfDedn`) && !approx(D('Section80D'), Math.min(elig, Math.max(gti, 0)))) {
          warn(`${ID}DeductUndChapVIA.Section80D`, 'Deduction u/s 80D should match the eligible amount in Schedule 80D', 'A-138');
        }
        const sc = str(at(root, `${d80base}SeniorCitizenFlag`));
        const selfFam = n(`${d80base}SelfAndFamily`);
        const selfFamSr = n(`${d80base}SelfAndFamilySeniorCitizen`);
        if (sc === 'S' && (selfFam > 0 || selfFamSr > 0)) err(`${d80base}SelfAndFamily`, 'Sch 80D: deduction for self/family cannot be claimed when "Not claiming for Self/Family" is selected', 'A-182');
        if (sc === 'N' && selfFamSr > 0) err(`${d80base}SelfAndFamilySeniorCitizen`, 'Sch 80D: senior-citizen row 1b can be used only when the senior-citizen dropdown is "Yes"', 'A-179');
        if (sc === 'Y' && selfFam > 0) err(`${d80base}SelfAndFamily`, 'Sch 80D: row 1a (non-senior) can be used only when the senior-citizen dropdown is "No"', 'A-178');
        const pc = str(at(root, `${d80base}ParentsSeniorCitizenFlag`));
        const par = n(`${d80base}Parents`);
        const parSr = n(`${d80base}ParentsSeniorCitizen`);
        if (pc === 'P' && (par > 0 || parSr > 0)) err(`${d80base}Parents`, 'Sch 80D: deduction for parents cannot be claimed when "Not claiming for Parents" is selected', 'A-183');
        if (pc === 'N' && parSr > 0) err(`${d80base}ParentsSeniorCitizen`, 'Sch 80D: senior-citizen row 2b can be used only when the parents senior-citizen dropdown is "Yes"', 'A-181');
        if (pc === 'Y' && par > 0) err(`${d80base}Parents`, 'Sch 80D: row 2a (non-senior) can be used only when the parents senior-citizen dropdown is "No"', 'A-180');
      }
    }
    // A-224 / A-241: 80C claimed needs Schedule 80C rows; claim vs schedule total
    if (isOld && D('Section80C') > 0) {
      const c80Rows = rows(at(root, `${P}Schedule80C.Schedule80CDtls`));
      if (!present(`${P}Schedule80C`) || c80Rows.length === 0) err(`${ID}DeductUndChapVIA.Section80C`, 'Deduction u/s 80C is claimed but Schedule 80C has no rows (amount + identification number required)', 'A-224');
      else if (D('Section80C') > n(`${P}Schedule80C.TotalAmt`)) err(`${ID}DeductUndChapVIA.Section80C`, 'Deduction u/s 80C cannot exceed the total of payments in Schedule 80C', 'A-241');
    }
    // A-242..245: interest-deduction claims must match their schedules
    const loanChecks: readonly (readonly [string, string, string, string])[] = [
      ['Section80E', 'Schedule80E', 'TotalInterest80E', 'A-242'],
      ['Section80EE', 'Schedule80EE', 'TotalInterest80EE', 'A-243'],
      ['Section80EEA', 'Schedule80EEA', 'TotalInterest80EEA', 'A-244'],
      ['Section80EEB', 'Schedule80EEB', 'TotalInterest80EEB', 'A-245'],
    ];
    for (const [sec, sch, totKey, rule] of loanChecks) {
      if (D(sec) <= 0) continue;
      if (!present(P + sch)) {
        err(`${ID}DeductUndChapVIA.${sec}`, `Deduction u/s ${sec.replace('Section', '')} is claimed but ${sch} (bank/loan details) is not filled`, rule);
      } else if (D(sec) > n(`${P}${sch}.${totKey}`)) {
        err(`${ID}DeductUndChapVIA.${sec}`, `Deduction u/s ${sec.replace('Section', '')} cannot exceed the total interest in ${sch}`, rule);
      }
    }
    // A-248..251: schedule interest totals = sum of rows
    const loanSums: readonly (readonly [string, string, string, string])[] = [
      ['Schedule80E.Schedule80EDtls', 'Interest80E', 'Schedule80E.TotalInterest80E', 'A-248'],
      ['Schedule80EE.Schedule80EEDtls', 'Interest80EE', 'Schedule80EE.TotalInterest80EE', 'A-249'],
      ['Schedule80EEA.Schedule80EEADtls', 'Interest80EEA', 'Schedule80EEA.TotalInterest80EEA', 'A-250'],
      ['Schedule80EEB.Schedule80EEBDtls', 'Interest80EEB', 'Schedule80EEB.TotalInterest80EEB', 'A-251'],
    ];
    for (const [arrPath, key, totPath, rule] of loanSums) {
      const items = rows(at(root, P + arrPath));
      if (items.length > 0 && !approx(n(P + totPath), sum(items, key))) {
        err(P + totPath, `${totPath.split('.')[0]}: total interest must equal the sum of individual loan rows`, rule);
      }
    }
    // A-227: 80EE only when total loan ≤ 35 lakh; A-252: sanction between 01-04-2016 and 31-03-2017
    rows(at(root, `${P}Schedule80EE.Schedule80EEDtls`)).forEach((r, i) => {
      if (num(r['TotalLoanAmt']) > 3500000) err(`${P}Schedule80EE.Schedule80EEDtls[${i}].TotalLoanAmt`, `Sch 80EE loan ${i + 1}: deduction u/s 80EE requires total loan not exceeding Rs. 35 lakh`, 'A-227');
      const dt = str(r['DateofLoan']);
      if (DATE_RE.test(dt) && (dt < '2016-04-01' || dt > '2017-03-31')) err(`${P}Schedule80EE.Schedule80EEDtls[${i}].DateofLoan`, `Sch 80EE loan ${i + 1}: loan must be sanctioned between 01-04-2016 and 31-03-2017`, 'A-252');
    });
    // A-229 / A-230: 80EEA stamp value ≤ 45 lakh; sanction between 01-04-2019 and 31-03-2022
    if (present(`${P}Schedule80EEA`) && n(`${P}Schedule80EEA.PropStmpDtyVal`) > 4500000) {
      err(`${P}Schedule80EEA.PropStmpDtyVal`, 'Deduction u/s 80EEA is allowed only when the stamp duty value of the property is up to Rs. 45 lakh', 'A-229');
    }
    rows(at(root, `${P}Schedule80EEA.Schedule80EEADtls`)).forEach((r, i) => {
      const dt = str(r['DateofLoan']);
      if (DATE_RE.test(dt) && (dt < '2019-04-01' || dt > '2022-03-31')) err(`${P}Schedule80EEA.Schedule80EEADtls[${i}].DateofLoan`, `Sch 80EEA loan ${i + 1}: loan must be sanctioned between 01-04-2019 and 31-03-2022`, 'A-230');
    });
    // A-232: 80EEB sanction between 01-04-2019 and 31-03-2023
    rows(at(root, `${P}Schedule80EEB.Schedule80EEBDtls`)).forEach((r, i) => {
      const dt = str(r['DateofLoan']);
      if (DATE_RE.test(dt) && (dt < '2019-04-01' || dt > '2023-03-31')) err(`${P}Schedule80EEB.Schedule80EEBDtls[${i}].DateofLoan`, `Sch 80EEB loan ${i + 1}: loan must be sanctioned between 01-04-2019 and 31-03-2023`, 'A-232');
    });
    // A-265 / A-269: exempt HRA claimed needs Schedule 10(13A); amounts must match
    {
      const hraRow = allwRows.find((r) => str(r['SalNatureDesc']) === '10(13A)' && num(r['SalOthAmount']) > 0);
      if (hraRow) {
        if (!present(`${P}ScheduleEA10_13A`)) err(`${ID}AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Exempt allowance u/s 10(13A) is claimed but Schedule 10(13A) is not filled', 'A-265');
        else if (!approx(num(hraRow['SalOthAmount']), n(`${P}ScheduleEA10_13A.EligbleExmpAllwncUs13A`))) {
          err(`${ID}AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Exempt allowance u/s 10(13A) must match the eligible amount computed in Schedule 10(13A)', 'A-269');
        }
      }
    }

    /* ── Chapter VI-A: eligible amount vs user-entered amount (A-272..A-291) ── */
    {
      const U = (sec: string) => num(at(root, `${ID}UsrDeductUndChapVIA.${sec}`));
      for (const sec of VIA_SECTIONS_COMMON) {
        if (sec === 'TotalChapVIADeductions') continue;
        if (!present(`${ID}UsrDeductUndChapVIA.${sec}`)) continue;
        if (D(sec) > U(sec)) {
          err(`${ID}DeductUndChapVIA.${sec}`, `Eligible amount of deduction ${sec.replace('Section', 'u/s ').replace('CCDEmployeeOrSE', 'CCD(1)').replace('CCD1B', 'CCD(1B)').replace('CCDEmployer', 'CCD(2)')} (${D(sec)}) cannot exceed the amount actually claimed (${U(sec)})`, 'A-272..291');
        }
      }
    }

    /* ── NPS / pension deductions ─────────────────────────────────────────── */
    const salary171 = n(`${ID}Salary`);
    const salBase = salary171 > 0 ? salary171 : grossSal;
    const PENSIONER_CATS = ['PE', 'PESG', 'PEPS', 'PEO', 'NA'];
    // A-2 / A-3: 80CCD(1) cap — 20% of GTI for pensioners/NA, else 10% of salary
    if (isOld && D('Section80CCDEmployeeOrSE') > 0) {
      if (PENSIONER_CATS.indexOf(empCat) >= 0) {
        if (D('Section80CCDEmployeeOrSE') > Math.round(gti * 0.2) + 1) err(`${ID}DeductUndChapVIA.Section80CCDEmployeeOrSE`, 'Deduction u/s 80CCD(1) cannot exceed 20% of Gross Total Income for pensioners / "Not Applicable" employer category', 'A-2');
      } else if (empCat !== '' && D('Section80CCDEmployeeOrSE') > Math.round(salBase * 0.1) + 1) {
        err(`${ID}DeductUndChapVIA.Section80CCDEmployeeOrSE`, 'Deduction u/s 80CCD(1) cannot exceed 10% of salary', 'A-3');
      }
    }
    // A-4 / A-120 / A-216: 80CCD(2) cap — 14% for CG/SG (old) and for CG/SG/PSU/Others (new); 10% otherwise (old)
    if (D('Section80CCDEmployer') > 0 && salBase > 0) {
      const govt = empCat === 'CGOV' || empCat === 'SGOV';
      const pct = isNew ? 0.14 : govt ? 0.14 : 0.1;
      if (D('Section80CCDEmployer') > Math.round(salBase * pct) + 1) {
        err(`${ID}DeductUndChapVIA.Section80CCDEmployer`, `Deduction u/s 80CCD(2) cannot exceed ${Math.round(pct * 100)}% of salary for this employer category`, isNew ? 'A-216' : govt ? 'A-120' : 'A-4');
      }
    }
    // A-186 / A-187: 80CCH (Agniveer Corpus Fund)
    if (n(`${ID}DeductUndChapVIA.AnyOthSec80CCH`) > 0) {
      if (salBase > 0 && D('AnyOthSec80CCH') > Math.round(salBase * 0.462) + 1) err(`${ID}DeductUndChapVIA.AnyOthSec80CCH`, 'Deduction u/s 80CCH cannot exceed 46.2% of salary u/s 17(1)', 'A-186');
      if (empCat !== '' && empCat !== 'CGOV') err(`${ID}DeductUndChapVIA.AnyOthSec80CCH`, 'Deduction u/s 80CCH can be claimed only when the nature of employment is Central Government', 'A-187');
    }
    // A-337 / A-302: 80CCC needs identifier rows whose amounts total the claim
    const ccRows = rows(at(root, `${ID}UsrDeductUndChapVIA.PensionContribution80CCC`));
    const usr80ccc = num(at(root, `${ID}UsrDeductUndChapVIA.Section80CCC`));
    if (usr80ccc > 0 && ccRows.length === 0) {
      err(`${ID}UsrDeductUndChapVIA.PensionContribution80CCC`, 'Deduction u/s 80CCC is claimed — at least one row with type of identifier, identifier number and amount is mandatory', 'A-337');
    }
    if (ccRows.length > 0 && !approx(usr80ccc, sum(ccRows, 'Amount'))) {
      err(`${ID}UsrDeductUndChapVIA.Section80CCC`, 'Deduction u/s 80CCC must equal the total of the individual contribution rows', 'A-302');
    }
    // A-226 / A-335: PRAN
    const pranRows = rows(at(root, `${ID}UsrDeductUndChapVIA.PRANDtls`)).filter((r) => !isEmpty(r['PRANNum']));
    const nps1 = num(at(root, `${ID}UsrDeductUndChapVIA.Section80CCDEmployeeOrSE`)) + num(at(root, `${ID}UsrDeductUndChapVIA.Section80CCD1B`));
    if (nps1 > 0 && pranRows.length === 0) err(`${ID}UsrDeductUndChapVIA.PRANDtls`, 'PRAN must be provided in Schedule VI-A to claim deduction u/s 80CCD(1) or 80CCD(1B)', 'A-226');
    if (nps1 === 0 && pranRows.length > 0) warn(`${ID}UsrDeductUndChapVIA.PRANDtls`, 'PRAN is entered but the amounts claimed u/s 80CCD(1) and 80CCD(1B) are zero', 'A-335');

    /* ── 80DDB / 80GG / 80TTA / 80TTB conditionals ────────────────────────── */
    const usr = `${ID}UsrDeductUndChapVIA.`;
    if (D('Section80DDB') > 0) {
      const cat80ddb = str(at(root, `${usr}Section80DDBUsrType`));
      if (cat80ddb === '') err(`${usr}Section80DDBUsrType`, 'Deduction u/s 80DDB is claimed but the eligible category (self/dependent, senior citizen) is not provided', 'A-6');
      if (isEmpty(at(root, `${usr}NameOfSpecDisease80DDB`))) err(`${usr}NameOfSpecDisease80DDB`, 'Details of the specified disease are required to claim deduction u/s 80DDB', 'A-239');
      if (isOld && cat80ddb === '1' && D('Section80DDB') > 40000) err(`${ID}DeductUndChapVIA.Section80DDB`, 'Deduction u/s 80DDB for category "Self or Dependent" cannot exceed Rs. 40,000', 'A-7');
    }
    if (D('Section80GG') > 0) {
      // A-233: Form 10BA acknowledgement
      if (isEmpty(at(root, `${usr}Form10BAAckNum`))) err(`${usr}Form10BAAckNum`, 'Details of Form 10BA are required to claim deduction u/s 80GG', 'A-233');
      // A-114: 25% of total income excluding LTCG, before this deduction
      const base80gg = Math.max(0, gti - (viaTotal - D('Section80GG')));
      if (D('Section80GG') > Math.round(base80gg * 0.25) + 1) {
        err(`${ID}DeductUndChapVIA.Section80GG`, 'Deduction u/s 80GG cannot exceed 25% of total income (excluding LTCG) computed before this deduction', 'A-114');
      }
    }
    // A-12 / A-16: 80TTA / 80TTB restricted to the corresponding interest income
    {
      const osAmt = (code: string) => osRows.filter((r) => str(r['OthSrcNatureDesc']) === code).reduce((t, r) => t + num(r['OthSrcOthAmount']), 0);
      const savInt = osAmt('SAV');
      const allInt = savInt + osAmt('IFD') + osAmt('TAX');
      if (D('Section80TTA') > savInt) err(`${ID}DeductUndChapVIA.Section80TTA`, 'Deduction u/s 80TTA is restricted to the savings-account interest offered under income from other sources', 'A-12');
      if (D('Section80TTB') > allInt) err(`${ID}DeductUndChapVIA.Section80TTB`, 'Deduction u/s 80TTB is restricted to the interest income offered under income from other sources', 'A-16');
    }

    /* ── Exempt allowances u/s 10: per-head caps and regime blocks ─────────── */
    {
      const alw = (code: string) => allwRows.filter((r) => str(r['SalNatureDesc']) === code).reduce((t, r) => t + num(r['SalOthAmount']), 0);
      const AP = `${ID}AllwncExemptUs10.AllwncExemptUs10Dtls`;
      const perq = n(`${ID}PerquisitesValue`);
      const CG_SG = ['CGOV', 'SGOV', 'PE', 'PESG'];
      // A-64 / A-68 / A-69 / A-74 / A-176: capped by salary u/s 17(1)
      if (isOld && alw('10(5)') > salary171 && salary171 >= 0) err(AP, 'Exemption u/s 10(5) (leave travel concession) cannot exceed salary as per section 17(1)', 'A-64');
      if (alw('10(10A)') > salary171) err(AP, 'Exemption u/s 10(10A) (commuted pension) cannot exceed salary as per section 17(1)', 'A-68');
      if (alw('10(10AA)') > salary171) err(AP, 'Exemption u/s 10(10AA) (leave encashment) cannot exceed salary as per section 17(1)', 'A-69');
      if (isOld && alw('10(13A)') > salary171) err(AP, 'Exemption u/s 10(13A) (HRA) cannot exceed salary as per section 17(1)', 'A-74');
      if (isOld && alw('10(13A)') > Math.round(salary171 / 3) + 1) err(AP, 'Exemption u/s 10(13A) (HRA) cannot exceed 1/3rd of salary as per section 17(1)', 'A-176');
      if (isOld && alw('10(14)(i)') > salary171) err(AP, 'Exemption u/s 10(14)(i) cannot exceed salary as per section 17(1)', 'A-75');
      if (isOld && alw('10(14)(ii)') > salary171) err(AP, 'Exemption u/s 10(14)(ii) cannot exceed salary as per section 17(1)', 'A-76');
      // A-65 / A-66: capped by gross salary
      if (alw('10(6)') > grossSal) err(AP, 'Exemption u/s 10(6) cannot exceed gross salary', 'A-65');
      if (alw('10(7)') > grossSal) err(AP, 'Exemption u/s 10(7) cannot exceed gross salary', 'A-66');
      // A-67 / A-267: gratuity limit by employer category
      const grat = alw('10(10)');
      if (grat > 0 && empCat !== '') {
        const lim = CG_SG.indexOf(empCat) >= 0 ? 2500000 : 2000000;
        if (grat > lim) err(AP, `Exemption u/s 10(10) (death-cum-retirement gratuity) cannot exceed Rs. ${lim / 100000} lakh for this employer category`, CG_SG.indexOf(empCat) >= 0 ? 'A-267' : 'A-67');
      }
      // A-142: leave encashment above Rs. 25 lakh for non-government categories
      if (alw('10(10AA)') > 2500000 && CG_SG.indexOf(empCat) < 0) err(AP, 'Exemption u/s 10(10AA) above Rs. 25 lakh is not available for this employer category', 'A-142');
      // A-70 / A-188 / A-71: retrenchment / VRS compensation caps
      if (alw('10(10B)(i)') > 500000) err(AP, 'Exemption u/s 10(10B) first proviso cannot exceed Rs. 5,00,000', 'A-70');
      if (alw('10(10B)(ii)') > 500000) err(AP, 'Exemption u/s 10(10B) second proviso cannot exceed Rs. 5,00,000', 'A-188');
      if (alw('10(10C)') > 500000) err(AP, 'Exemption u/s 10(10C) (voluntary retirement) cannot exceed Rs. 5,00,000', 'A-71');
      // A-185: 10(10B) not available to government / pensioner categories
      if ((alw('10(10B)(i)') > 0 || alw('10(10B)(ii)') > 0) && ['CGOV', 'SGOV', 'PE', 'PESG', 'PEPS', 'PEO'].indexOf(empCat) >= 0) {
        err(AP, 'Exemption u/s 10(10B) is not allowed for government employees or pensioners', 'A-185');
      }
      // A-73 / A-177: 10(10CC) caps
      const cc = alw('10(10CC)');
      if (cc > perq && present(`${ID}PerquisitesValue`)) err(AP, 'Exemption u/s 10(10CC) cannot exceed the value of perquisites u/s 17(2)', 'A-73');
      if (cc > 0 && present(`${P}TDSonSalaries.TotalTDSonSalaries`) && cc > n(`${P}TDSonSalaries.TotalTDSonSalaries`)) {
        err(AP, 'Exemption u/s 10(10CC) cannot exceed the TDS claimed u/s 192 in Schedule TDS1', 'A-177');
      }
      // A-270 / A-301: judge's exempt income
      if (alw('EIC') > 0) {
        if (isNew) err(AP, 'The judges’ exempt-income allowance cannot be claimed under the new tax regime', 'A-301');
        if (empCat !== '' && ['CGOV', 'SGOV'].indexOf(empCat) < 0) err(AP, 'The judges’ exempt-income allowance can be claimed only by Central/State Government employees', 'A-270');
      }
      // A-161 / A-167: new regime — 10(17) and 10(14)(ii) not allowed
      if (isNew) {
        if (alw('10(17)') > 0) err(AP, 'Exempt allowance u/s 10(17) (MP/MLA/MLC) is not allowed under the new tax regime', 'A-161');
        if (alw('10(14)(ii)') > 0) err(AP, 'Exempt allowance u/s 10(14)(ii) is not allowed under the new tax regime', 'A-167');
        // A-148: transport allowance for handicapped assessee under the new regime
        if (alw('10(14)(ii)(115BAC)') > 38400) err(AP, 'Under the new tax regime, transport allowance u/s 10(14)(ii) cannot exceed Rs. 38,400', 'A-148');
      }
      // A-37 / A-150: old regime — 115BAC-specific allowance heads must not be used
      if (isOld) {
        for (const code of ['10(14)(i)(115BAC)', '10(14)(ii)(115BAC)']) {
          if (alw(code) > 0) err(AP, `Exempt allowance "${code}" is available only under the new tax regime`, 'A-150');
        }
      }
      // A-261 / A-262 / A-263 / A-266: Schedule 10(13A)
      const ea = at(root, `${P}ScheduleEA10_13A`);
      if (ea !== undefined && ea !== null && typeof ea === 'object') {
        const E = `${P}ScheduleEA10_13A.`;
        const basic = n(`${E}BasicSalary`) + n(`${E}DearnessAllwnc`);
        const hraRecv = n(`${E}ActlHRARecv`);
        const rentLess10 = n(`${E}ActlRentPaid`) - Math.round(basic * 0.1);
        const pctLimit = Math.round(basic * (str(at(root, `${E}Placeofwork`)) === '1' ? 0.5 : 0.4));
        const eligible = n(`${E}EligbleExmpAllwncUs13A`);
        if (!approx(n(`${E}ActlRentPaid10Per`), rentLess10)) err(`${E}ActlRentPaid10Per`, 'Sch 10(13A): rent paid in excess of 10% of salary must equal actual rent paid minus 10% of (basic salary + DA)', 'A-261');
        if (!approx(n(`${E}Sal40Or50Per`), pctLimit)) err(`${E}Sal40Or50Per`, 'Sch 10(13A): the limit must be 50% of (basic salary + DA) for metro cities and 40% for non-metro cities', 'A-262');
        const lowest = Math.max(0, Math.min(hraRecv, rentLess10, pctLimit));
        if (!approx(eligible, lowest, 2)) err(`${E}EligbleExmpAllwncUs13A`, `Sch 10(13A): the exemption must be the lowest of actual HRA received, rent paid less 10% of salary and 40%/50% of salary (${lowest})`, 'A-263');
        if (basic + hraRecv > salary171 && salary171 > 0) err(`${E}BasicSalary`, 'Sch 10(13A): basic salary + DA + actual HRA received cannot exceed salary as per section 17(1)', 'A-266');
      }
    }

    /* ── House-property arithmetic (A-44 / 46 / 47 / 240 / 246 / 296 / 298 / 299) ── */
    hps.forEach((row, i) => {
      const base = `${ID}PropertyDetails[${i}]`;
      const rd = at(row, 'Rentdetails');
      if (rd === undefined || rd === null || typeof rd !== 'object') return;
      const alv = num(at(rd, 'AnnualLetableValue'));
      const unreal = num(at(rd, 'RentNotRealized'));
      const local = num(at(rd, 'LocalTaxes'));
      const totUnreal = num(at(rd, 'TotalUnrealizedAndTax'));
      const balance = num(at(rd, 'BalanceALV'));
      const owned = num(at(rd, 'AnnualOfPropOwned'));
      const thirty = num(at(rd, 'ThirtyPercentOfBalance'));
      const intCap = num(at(rd, 'IntOnBorwCap'));
      const totDed = num(at(rd, 'TotalDeduct'));
      const arrears = num(at(rd, 'ArrearsUnrealizedRentRcvd'));
      // A-44: municipal tax claimed needs gross rent
      if (local > 0 && alv <= 0) err(`${base}.Rentdetails.LocalTaxes`, `House property ${i + 1}: gross rent must be more than zero when municipal tax is claimed`, 'A-44');
      // A-298 / A-46
      if (!approx(totUnreal, unreal + local)) err(`${base}.Rentdetails.TotalUnrealizedAndTax`, `House property ${i + 1}: total of unrealized rent and municipal taxes must equal their sum`, 'A-298');
      if (!approx(balance, alv - totUnreal)) err(`${base}.Rentdetails.BalanceALV`, `House property ${i + 1}: annual value must be gross rent minus unrealized rent and municipal taxes`, 'A-46');
      // A-296: annual value of the property owned = share% of the annual value
      const shr = num(row['AsseseeShareProperty']);
      if (str(row['PropCoOwnedFlg']) === 'YES' && shr > 0 && !approx(owned, Math.round((balance * shr) / 100), 2)) {
        err(`${base}.Rentdetails.AnnualOfPropOwned`, `House property ${i + 1}: annual value of the property owned must be the assessee's percentage share of the annual value`, 'A-296');
      }
      // A-299: total deduction = 30% + interest u/s 24(b)
      if (!approx(totDed, thirty + intCap)) err(`${base}.Rentdetails.TotalDeduct`, `House property ${i + 1}: total deduction must equal 30% of annual value plus interest on borrowed capital`, 'A-299');
      // A-47: income of the house property
      if (!approx(num(at(rd, 'IncomeOfHP')), owned - totDed + arrears)) {
        err(`${base}.Rentdetails.IncomeOfHP`, `House property ${i + 1}: income chargeable must be annual value minus deductions plus arrears/unrealized rent received`, 'A-47');
      }
      // A-220 / A-240 / A-246: Schedule 24(b)
      const s24 = at(rd, 'Section24B');
      const has24 = s24 !== undefined && s24 !== null && typeof s24 === 'object';
      if (intCap > 0 && !has24) err(`${base}.Rentdetails.Section24B`, `House property ${i + 1}: details of the bank from which the loan is taken must be provided to claim interest u/s 24(b)`, 'A-220');
      if (has24) {
        const tot24 = num(at(s24, 'TotalInterestUs24B'));
        const r24 = rows(at(s24, 'Section24BDtls'));
        if (r24.length > 0 && !approx(tot24, sum(r24, 'InterestUs24B'))) err(`${base}.Rentdetails.Section24B.TotalInterestUs24B`, `House property ${i + 1}: total interest u/s 24(b) must equal the sum of the individual loan rows`, 'A-246');
        if (!approx(intCap, tot24)) err(`${base}.Rentdetails.IntOnBorwCap`, `House property ${i + 1}: interest on borrowed capital must equal the total interest as per Schedule 24(b)`, 'A-240');
      }
    });

    /* ── Schedule 80C / 80D / 80G / 80GGC extras ──────────────────────────── */
    // A-247: Sch 80C total = sum of rows
    {
      const c80 = rows(at(root, `${P}Schedule80C.Schedule80CDtls`));
      if (c80.length > 0 && !approx(n(`${P}Schedule80C.TotalAmt`), sum(c80, 'Amount'))) {
        err(`${P}Schedule80C.TotalAmt`, 'Sch 80C: total of payments must equal the sum of the individual rows', 'A-247');
      }
    }
    // Schedule 80D arithmetic, caps and supporting details
    if (d80 !== undefined && d80 !== null && typeof d80 === 'object') {
      const B = `${P}Schedule80D.Sec80DSelfFamSrCtznHealth.`;
      const v = (k: string) => num(at(d80, k));
      const blocks: readonly (readonly [string, string, string, readonly string[], number, string, string, string])[] = [
        ['1a', 'SelfAndFamily', 'HealthInsPremSlfFam', ['HealthInsPremSlfFam', 'PrevHlthChckUpSlfFam'], 25000, 'Sec80DSelfFamHIDtls', 'A-127', 'A-128'],
        ['1b', 'SelfAndFamilySeniorCitizen', 'HlthInsPremSlfFamSrCtzn', ['HlthInsPremSlfFamSrCtzn', 'PrevHlthChckUpSlfFamSrCtzn', 'MedicalExpSlfFamSrCtzn'], 50000, 'Sec80DSelfFamSrCtznHIDtls', 'A-130', 'A-131'],
        ['2a', 'Parents', 'HlthInsPremParents', ['HlthInsPremParents', 'PrevHlthChckUpParents'], 25000, 'Sec80DParentsHIDtls', 'A-132', 'A-133'],
        ['2b', 'ParentsSeniorCitizen', 'HlthInsPremParentsSrCtzn', ['HlthInsPremParentsSrCtzn', 'PrevHlthChckUpParentsSrCtzn', 'MedicalExpParentsSrCtzn'], 50000, 'Sec80DParentsSrCtznHIDtls', 'A-134', 'A-135'],
      ];
      let blockTotal = 0;
      for (const [sl, tot, premKey, parts, cap, hiBlk, capRule, sumRule] of blocks) {
        const claimed = v(tot);
        blockTotal += claimed;
        const partsSum = parts.reduce((t, k) => t + v(k), 0);
        if (isOld && claimed > cap) err(`${B}${tot}`, `Sch 80D: deduction at Sl. No. ${sl} is limited to Rs. ${cap.toLocaleString('en-IN')}`, capRule);
        if (partsSum < cap && !approx(claimed, partsSum)) err(`${B}${tot}`, `Sch 80D: deduction at Sl. No. ${sl} must equal the sum of its components (${partsSum})`, sumRule);
        // A-234..237 / A-256..259: health-insurance premium must be supported by policy rows
        const prem = v(premKey);
        const hi = at(d80, hiBlk);
        const insRows = rows(at(hi, 'Sch80DInsDtls'));
        if (prem > 0 && insRows.length === 0) {
          err(`${B}${hiBlk}.Sch80DInsDtls`, `Sch 80D: name of the insurer and policy number are required at Sl. No. ${sl}(i) to claim the health-insurance premium`, 'A-256..259');
        } else if (insRows.length > 0 && !approx(prem, sum(insRows, 'HealthInsAmt'))) {
          err(`${B}${premKey}`, `Sch 80D: the health-insurance premium at Sl. No. ${sl}(i) must equal the total of the individual policy rows`, 'A-234..237');
        }
      }
      // A-129: preventive health check-up across all blocks capped at Rs. 5,000
      const preventive = v('PrevHlthChckUpSlfFam') + v('PrevHlthChckUpSlfFamSrCtzn') + v('PrevHlthChckUpParents') + v('PrevHlthChckUpParentsSrCtzn');
      if (isOld && preventive > 5000) err(`${B}PrevHlthChckUpSlfFam`, 'Sch 80D: the total preventive health check-up claimed across all blocks cannot exceed Rs. 5,000', 'A-129');
      // A-137: eligible amount = 1a + 1b + 2a + 2b (when not above the Rs. 1,00,000 ceiling)
      const elig80d = v('EligibleAmountOfDedn');
      if (blockTotal <= 100000 && !approx(elig80d, Math.min(blockTotal, Math.max(gti, 0)))) {
        err(`${B}EligibleAmountOfDedn`, `Sch 80D: the eligible amount of deduction must equal 1a + 1b + 2a + 2b (${blockTotal}) subject to Gross Total Income`, 'A-137');
      }
    }
    // A-83: Schedule 80G Table E = sum of the four tables
    if (present(`${P}Schedule80G`)) {
      const tblTotal = G80_TABLES.reduce((t, [tbl, keys]) => t + n(`${g80}${tbl}.${keys[2]}`), 0);
      if (!approx(n(`${g80}TotalDonationsUs80G`), tblTotal)) {
        err(`${g80}TotalDonationsUs80G`, `Sch 80G Table E: total donations (${n(`${g80}TotalDonationsUs80G`)}) must equal the sum of the four donation tables (${tblTotal})`, 'A-83');
      }
    }
    // A-329 / A-199: Schedule 80GGC political-party and payment details
    ggcRows.forEach((r, i) => {
      const base = `${ggc}Schedule80GGCDetails[${i}]`;
      if (isEmpty(r['PoliticalPartyName']) || isEmpty(r['PoliticalPartyPAN'])) {
        err(`${base}.PoliticalPartyName`, `Sch 80GGC row ${i + 1}: the name and PAN of the political party are necessary to claim deduction u/s 80GGC`, 'A-329');
      }
      if (num(r['DonationAmtOtherMode']) > 0 && (isEmpty(r['TransactionRefNum']) || isEmpty(r['IFSCCode']))) {
        err(`${base}.TransactionRefNum`, `Sch 80GGC row ${i + 1}: IFSC and the transaction reference number are required for a contribution made in a mode other than cash`, 'A-199');
      }
    });

    /* ── Global consistency warnings ──────────────────────────────────────── */
    // A-20: tax computed/paid but no income disclosed
    if ((n(`${TC}TotalTaxPayable`) > 0 || n(`${P}TaxPaid.TaxesPaid.TotalTaxesPaid`) > 0) && gti <= 0) {
      err(`${ID}GrossTotIncome`, 'Gross total income and the heads of income must be more than zero when a tax liability has been computed or taxes have been paid', 'A-20');
    }

    /* Representative assessee & filing-status conditionals */
    const repFlg = str(at(root, `${P}FilingStatus.AsseseeRepFlg`));
    if ((repFlg === 'Y' || cap === 'R') && !present(`${P}FilingStatus.AssesseeRep`)) {
      err(`${P}FilingStatus.AssesseeRep`, 'Representative assessee details (name, e-mail, mobile) are mandatory when the return is filed by a representative', 'A-293');
    }
    // A-331: representative's e-mail / mobile must differ from the taxpayer's
    {
      const repMail = str(at(root, `${P}FilingStatus.AssesseeRep.RepEmailID`)).toLowerCase();
      const repMob = String(at(root, `${P}FilingStatus.AssesseeRep.RepMobileNo`) ?? '');
      const mails = [
        str(at(root, `${P}PersonalInfo.Address.EmailAddress`)).toLowerCase(),
        str(at(root, `${P}PersonalInfo.Address.EmailAddressSec`)).toLowerCase(),
      ];
      const mobs = [
        String(at(root, `${P}PersonalInfo.Address.MobileNo`) ?? ''),
        String(at(root, `${P}PersonalInfo.Address.MobileNoSec`) ?? ''),
      ];
      if (repMail !== '' && mails.indexOf(repMail) >= 0) err(`${P}FilingStatus.AssesseeRep.RepEmailID`, "The representative's e-mail id must not be the same as the taxpayer's primary or secondary e-mail id", 'A-331');
      if (repMob !== '' && mobs.indexOf(repMob) >= 0) err(`${P}FilingStatus.AssesseeRep.RepMobileNo`, "The representative's contact number must not be the same as the taxpayer's primary or secondary contact number", 'A-331');
    }
    // A-338 / A-339: secondary address
    const secAdd = str(at(root, `${P}PersonalInfo.SecondaryAdd`));
    if (secAdd === 'N' && !present(`${P}PersonalInfo.AlternateAddress`)) {
      err(`${P}PersonalInfo.AlternateAddress`, 'Secondary address is mandatory when it is not the same as the primary address', 'A-338');
    }
    if (secAdd === 'N' && present(`${P}PersonalInfo.AlternateAddress`)) {
      const same = (['ResidenceNo', 'ResidenceName', 'RoadOrStreet', 'LocalityOrArea', 'CityOrTownOrDistrict', 'StateCode', 'PinCode'] as const)
        .every((k) => String(at(root, `${P}PersonalInfo.AlternateAddress.${k}`) ?? '').trim().toUpperCase() === String(at(root, `${P}PersonalInfo.Address.${k}`) ?? '').trim().toUpperCase());
      if (same) err(`${P}PersonalInfo.AlternateAddress`, 'The secondary address must not be the same as the primary address when "No" is selected for "Is the secondary address same as primary?"', 'A-339');
    }
    // Revised return (139(5), code 17) needs original acknowledgement + date
    const sec139 = num(at(root, `${P}FilingStatus.ReturnFileSec`));
    if (sec139 === 17) {
      if (isEmpty(at(root, `${P}FilingStatus.ReceiptNo`))) miss(`${P}FilingStatus.ReceiptNo`, 'Acknowledgement number of the original return (revised return u/s 139(5))', H_GEN);
      if (isEmpty(at(root, `${P}FilingStatus.OrigRetFiledDate`))) miss(`${P}FilingStatus.OrigRetFiledDate`, 'Date of filing of the original return (revised return u/s 139(5))', H_GEN);
    }
    // Notice-based filings (142(1)=13, 148=14, 153C=16) need the notice date
    if (sec139 === 13 || sec139 === 14 || sec139 === 16) {
      if (isEmpty(at(root, `${P}FilingStatus.NoticeDateUnderSec`))) miss(`${P}FilingStatus.NoticeDateUnderSec`, 'Date of the notice/order under which the return is filed', H_GEN);
    }
    // Seventh proviso to 139(1) conditionals
    if (str(at(root, `${P}FilingStatus.IncrExpAggAmt2LkTrvFrgnCntryFlg`)) === 'Y' && isEmpty(at(root, `${P}FilingStatus.AmtSeventhProvisio139ii`))) {
      miss(`${P}FilingStatus.AmtSeventhProvisio139ii`, 'Amount of foreign-travel expenditure (seventh proviso to 139(1))', H_GEN);
    }
    if (str(at(root, `${P}FilingStatus.IncrExpAggAmt1LkElctrctyPrYrFlg`)) === 'Y' && isEmpty(at(root, `${P}FilingStatus.AmtSeventhProvisio139iii`))) {
      miss(`${P}FilingStatus.AmtSeventhProvisio139iii`, 'Amount of electricity expenditure (seventh proviso to 139(1))', H_GEN);
    }
    if (str(at(root, `${P}FilingStatus.clauseiv7provisio139i`)) === 'Y' && rows(at(root, `${P}FilingStatus.clauseiv7provisio139iDtls`)).length === 0) {
      miss(`${P}FilingStatus.clauseiv7provisio139iDtls`, 'Details for clause (iv) of the seventh proviso to 139(1)', H_GEN);
    }
    // A-151: old regime in a belated 139(4) return — final check happens at upload (needs filing date)
    if (isOld && sec139 === 12) {
      warn(`${P}FilingStatus.OptOutNewTaxRegime`, 'Old tax regime cannot be opted in a belated return filed u/s 139(4) after the due date', 'A-151');
    }
  } catch (e) {
    warnings.push({
      path: 'ITR',
      msg: `Validator hit an unexpected payload shape and stopped early: ${e instanceof Error ? e.message : String(e)}`,
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
