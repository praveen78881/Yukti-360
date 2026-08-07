/**
 * OFFICIAL mandatory-field validator — ITR-3, A.Y. 2025-26.
 *
 * Sources (do NOT hand-edit without re-deriving from them):
 *  - CBDT JSON schema : "ITR-3_2025_Main_V1.3" (draft-04). Payload root is
 *    { ITR: { ITR3: … } }; the wire constants inside are FormName "ITR-3",
 *    AssessmentYear "2025", SchemaVer/FormVer "Ver1.0".
 *    The trees below are the DISTILLED recursive `required` chains of that
 *    schema — 454 unconditional leaves, 616 conditional leaves across 50
 *    optional schedules and 132 repeating-table row specs. The raw schema is
 *    never imported (contract: this module is self-contained).
 *  - CBDT "ITR 3 – Validation Rules for AY 2025-26" V1.0 (10-Jul-2025),
 *    section 2.1 Category A ("return will not be allowed to be uploaded").
 *    Every category-A rule checkable on the exported JSON alone is encoded
 *    below carrying its Sl. No. as rule id "A<n>". Rules that need CPC /
 *    Forms-DB / PAN-database / RBI / profile / e-verification data (Form 10-IEA
 *    existence, Aadhaar-vs-profile, IFSC-vs-RBI, TAN validity at source, …)
 *    are deliberately NOT encoded — they cannot be decided offline.
 *
 * Contract: see ./types.ts. checkMandatory() never throws.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr3';
const AY = '2025-26';
const SCHEMA_VERSION = 'ITR-3_2025_Main_V1.3 (SchemaVer Ver1.0)';
const ROOT = 'ITR.ITR3';

/* ────────────────────────────────────────────────────────────────────────────
 * 1. Section catalogue — CA-readable name + where it is filled in the tool
 *    (public/tax-utilities/itr3-2025-26.html).
 * ──────────────────────────────────────────────────────────────────────────── */

const SEC: Record<string, [label: string, hint: string]> = {
  CreationInfo: ['Creation info.', 'Filled automatically by the utility when the JSON is generated'],
  Form_ITR3: ['Form ITR-3 identity', 'Filled automatically by the utility'],
  PartA_GEN1: ['Part A – General (Personal info. & Filing status)', 'Assessee info. / Filing Details sections'],
  PartA_GEN2: ['Part A – General (Audit information)', '44AB Tax Audit details section'],
  PARTA_BS: ['Part A – Balance Sheet', 'Balance Sheet tab'],
  PARTA_PL: ['Part A – Profit & Loss A/c', 'Profit & Loss tab'],
  PARTA_OI: ['Part A – OI (Other information)', 'Other Information tab'],
  PARTA_QD: ['Part A – QD (Quantitative details)', 'Quantitative details tab'],
  ManufacturingAccount: ['Part A – Manufacturing Account', 'Manufacturing Account tab'],
  TradingAccount: ['Part A – Trading Account', 'Trading Account tab'],
  PartA_139_8A: ['Part A – 139(8A) (Updated return)', 'Updated return u/s 139(8A) section'],
  ITR3ScheduleBP: ['Schedule BP (Business / Profession)', 'Business & Profession computation tab'],
  ScheduleS: ['Schedule S (Salary)', 'Salary tab'],
  ScheduleHP: ['Schedule HP (House property)', 'House Property tab'],
  ScheduleDPM: ['Schedule DPM (Depreciation — plant & machinery)', 'Depreciation as per IT Act section'],
  ScheduleDOA: ['Schedule DOA (Depreciation — other assets)', 'Depreciation as per IT Act section'],
  ScheduleDEP: ['Schedule DEP (Summary of depreciation)', 'Depreciation as per IT Act section'],
  ScheduleDCG: ['Schedule DCG (Deemed capital gains on depreciable assets)', 'Depreciation as per IT Act section'],
  ScheduleESR: ['Schedule ESR (Deduction u/s 35)', '35 to 35E, 33AB, 33ABA deductions section'],
  ScheduleCGFor23: ['Schedule CG (Capital gains)', 'Capital Gains — Schedule CG details tab'],
  Schedule112A: ['Schedule 112A (LTCG on STT-paid shares/units)', 'Capital Gains → 112A table'],
  Schedule115AD: ['Schedule 115AD(1)(b)(iii) proviso (LTCG — FII)', 'Capital Gains → 115AD table'],
  ScheduleVDA: ['Schedule VDA (Virtual digital assets)', 'Capital Gains → VDA table'],
  ScheduleOS: ['Schedule OS (Income from other sources)', 'Other Sources tab'],
  ScheduleCYLA: ['Schedule CYLA (Current-year loss adjustment)', 'Set-off of current year losses'],
  ScheduleBFLA: ['Schedule BFLA (Brought-forward loss adjustment)', 'Brought forward losses set off'],
  ScheduleCFL: ['Schedule CFL (Losses carried forward)', 'Losses to be carried forward'],
  ITR3ScheduleUD: ['Schedule UD (Unabsorbed depreciation / allowance)', 'Unabsorbed depreciation section'],
  ScheduleICDS: ['Schedule ICDS (Effect of ICDS on profit)', 'ICDS adjustments section'],
  Schedule10AA: ['Schedule 10AA (Deduction u/s 10AA — SEZ)', 'Deduction u/s 10AA section'],
  Schedule80G: ['Schedule 80G (Donations)', '80G — Donations section'],
  Schedule80GGA: ['Schedule 80GGA (Donations — scientific research / rural development)', '80GGA section'],
  Schedule80GGC: ['Schedule 80GGC (Contribution to political parties)', '80GGC section'],
  Schedule80C: ['Schedule 80C (Investments)', '80C — Investments section'],
  Schedule80D: ['Schedule 80D (Health insurance premium)', '80D — Health Insurance Premium section'],
  Schedule80DD: ['Schedule 80DD (Maintenance of disabled dependent)', '80DD section'],
  Schedule80U: ['Schedule 80U (Person with disability)', '80U section'],
  Schedule80E: ['Schedule 80E (Interest on education loan)', '80E — Interest on Education Loan section'],
  Schedule80EE: ['Schedule 80EE (Interest on housing loan)', '80EE section'],
  Schedule80EEA: ['Schedule 80EEA (Interest on housing loan — affordable)', '80EEA section'],
  Schedule80EEB: ['Schedule 80EEB (Interest on electric-vehicle loan)', '80EEB section'],
  Schedule80RA: ['Schedule 80GGA/80RA (Research association donations)', 'Donations section'],
  Schedule80_IA: ['Schedule 80-IA', 'Deduction u/s 80-IA section'],
  Schedule80_IB: ['Schedule 80-IB', 'Deduction u/s 80-IB section'],
  Schedule80_IC: ['Schedule 80-IC / 80-IE', 'Deduction u/s 80-IC/80-IE section'],
  ScheduleVIA: ['Schedule VI-A (Chapter VI-A deductions)', 'Deductions (Chapter VI-A) tab'],
  ScheduleAMT: ['Schedule AMT (Alternate Minimum Tax u/s 115JC)', 'AMT u/s 115JC section'],
  ScheduleAMTC: ['Schedule AMTC (AMT credit u/s 115JD)', 'AMT credit u/s 115JD section'],
  ScheduleSI: ['Schedule SI (Income chargeable at special rates)', 'Income taxable at special rates section'],
  ScheduleSPI: ['Schedule SPI (Income of specified persons)', 'Income of Other persons section'],
  ScheduleIF: ['Schedule IF (Partnership firms in which assessee is a partner)', 'Income from partnership firm section'],
  ScheduleEI: ['Schedule EI (Exempt income)', 'Exempt income / Agricultural Income section'],
  SchedulePTI: ['Schedule PTI (Pass-through income)', 'Pass through income section'],
  ScheduleTPSA: ['Schedule TPSA (Secondary adjustment u/s 92CE(2A))', 'TPSA section'],
  ScheduleFSI: ['Schedule FSI (Income from outside India)', 'Foreign source income section'],
  ScheduleTR1: ['Schedule TR (Tax relief u/s 90/90A/91)', 'Tax relief section'],
  ScheduleFA: ['Schedule FA (Foreign assets)', 'Foreign asset sections'],
  Schedule5A2014: ['Schedule 5A (Portuguese Civil Code apportionment)', 'Schedule 5A section'],
  ScheduleAL: ['Schedule AL (Assets & liabilities)', 'Assets & Liabilities tab'],
  ScheduleGST: ['Schedule GST (Turnover reported under GST)', 'GST turnover section'],
  TaxReturnPreparer: ['Tax Return Preparer details', 'TRP section'],
  ScheduleIT: ['Schedule IT (Advance tax & self-assessment tax)', 'Advance Tax / Self-assessment tax section'],
  ScheduleTDS1: ['Schedule TDS-1 (TDS on salary)', 'TDS on salary section'],
  ScheduleTDS2: ['Schedule TDS-2 (TDS other than salary — Form 16A)', 'TDS other than salary section'],
  ScheduleTDS3: ['Schedule TDS-3 (TDS — Form 16B/16C/16D)', 'TDS (26QB/26QC/26QD) section'],
  ScheduleTCS: ['Schedule TCS (Tax collected at source)', 'TCS section'],
  ScheduleESOP: ['Schedule ESOP (Tax deferred on ESOP u/s 191(2))', 'ESOP deferral section'],
  'PartB-TI': ['Part B – TI (Computation of total income)', 'Computation of total income'],
  PartB_TTI: ['Part B – TTI (Computation of tax liability)', 'Tax computation / Taxes paid / Bank Accounts'],
  'PartB-ATI': ['Part B – ATI (Updated return u/s 139(8A) computation)', 'Updated return computation'],
  Verification: ['Verification', 'Verification & declaration section'],
};

/* ────────────────────────────────────────────────────────────────────────────
 * 2. Label helpers — turn a schema path segment into something a CA reads.
 * ──────────────────────────────────────────────────────────────────────────── */

const TOKENS: Record<string, string> = {
  Tot: 'Total', Totl: 'Total', Amt: 'Amount', Amts: 'Amounts', Amount: 'Amount',
  Inc: 'Income', Incm: 'Income', Dtls: 'details', Dtl: 'detail', Dtlss: 'details',
  Prof: 'Profit', PL: 'P&L', Us: 'u/s', Sec: 'Sec.', Curr: 'Current', Cur: 'Current',
  Yr: 'year', Yrs: 'years', Bal: 'Balance', Ded: 'Deduction', Dedn: 'Deduction',
  Deduct: 'Deduction', Depr: 'Depreciation', Deprn: 'Depreciation', Alw: 'Allowance',
  Allwnc: 'Allowance', Rcpt: 'Receipt', Rcpts: 'Receipts', Frm: 'from', Oth: 'other',
  Othr: 'other', Exp: 'Expenditure', Expdr: 'Expenditure', Srl: 'Serial', Chaln: 'Challan',
  Recv: 'received', Chrgbl: 'chargeable', Chrg: 'charge', Aft: 'after', Bfr: 'before',
  Num: 'number', Pmt: 'payment', Adj: 'adjustment', Setoff: 'set-off', SetOff: 'set-off',
  Trnsfr: 'transfer', Trnsf: 'transfer', Trnsfrd: 'transferred', Bus: 'business',
  Busi: 'business', Spec: 'speculative', Specfd: 'specified', Grs: 'Gross',
  Gr: 'Gross', Trn: 'turnover', Trnover: 'turnover', Consd: 'consideration',
  Aquisit: 'acquisition', Acq: 'acquisition', Cnct: 'connected', Excl: 'exclusive',
  Cnsdrtn: 'consideration', Assmt: 'Assessment', Ass: 'Assessment', Prev: 'previous',
  Prv: 'previous', Fwd: 'forward', Bwd: 'backward', Rem: 'remaining', Remain: 'remaining',
  Clm: 'claimed', Clmd: 'claimed', Elgbl: 'eligible', Pymt: 'payment', Instn: 'institution',
  Instl: 'instalment', Ins: 'insurance', Insur: 'insurance', Prem: 'premium', Ptnr: 'partner',
  Regn: 'registration', Cd: 'code', Flg: 'flag', Nm: 'name', Dt: 'date', Qty: 'quantity',
  Disallw: 'disallowable', Disall: 'disallowable', Allw: 'allowable', Dis: 'dis',
  Rsrv: 'reserve', Resr: 'reserve', Surp: 'surplus', Rupee: 'rupee', Secr: 'secured',
  Unsecr: 'unsecured', Advnc: 'advance', Adv: 'advances', Liab: 'liability',
  Provn: 'provision', Prov: 'provision', Misc: 'miscellaneous', Cls: 'closing',
  Clsng: 'closing', Opng: 'opening', Stck: 'stock', Stk: 'stock', Invntry: 'inventory',
  Invst: 'investment', Invstmnt: 'investment', Fnd: 'fund', Src: 'sources',
  Apply: 'application', Agri: 'agricultural', Rt: 'rate', Perc: 'per cent', N: '&',
};

function splitCamel(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean);
}

/** "FundSrc.PropFund.TotPropFund" → "Fund sources › Prop Fund › Total Prop Fund" */
function humanize(relPath: string): string {
  return relPath
    .split('.')
    .map((seg) => splitCamel(seg.replace(/\[\]$/, '')).map((w) => TOKENS[w] ?? w).join(' '))
    .join(' › ');
}

/* ────────────────────────────────────────────────────────────────────────────
 * 3. Distilled REQUIRED trees.
 *    - REQUIRED       : leaves whose whole ancestor chain is `required` at the
 *                       root — always expected in a valid ITR-3 payload.
 *    - CONDITIONAL    : leaves that are `required` inside an OPTIONAL schedule;
 *                       enforced only when that schedule is present.
 *    - TABLE_ROWS     : schema-required fields of every repeating-table row.
 * ──────────────────────────────────────────────────────────────────────────── */

type Leaf = [path: string, label: string, hint: string];

const REQUIRED: Leaf[] = [];
const CONDITIONAL: Array<[root: string, leaves: Leaf[]]> = [];
const TABLE_ROWS: Array<[path: string, keys: string[]]> = [];

function labelFor(top: string, rel: string): [string, string] {
  const s = SEC[top] ?? [top, ''];
  return [rel ? `${s[0]} — ${humanize(rel)}` : s[0], s[1]];
}

/** Register unconditional required leaves of a top-level block. */
function reqMany(top: string, blob: string): void {
  for (const rel of blob.split(/\s+/).filter(Boolean)) {
    const [label, hint] = labelFor(top, rel);
    REQUIRED.push([`${top}.${rel}`, label, hint]);
  }
}

/** Register required leaves of an OPTIONAL schedule (checked only if present). */
function condMany(top: string, blob: string): void {
  const leaves: Leaf[] = [];
  for (const rel of blob.split(/\s+/).filter(Boolean)) {
    const [label, hint] = labelFor(top, rel);
    leaves.push([rel, label, hint]);
  }
  CONDITIONAL.push([top, leaves]);
}

/** Register the schema-required fields of each row of a repeating table. */
function arrayReq(path: string, keys: string): void {
  TABLE_ROWS.push([path, keys.split(/\s+/).filter(Boolean)]);
}

/* ── 3.1 Unconditional required leaves (454) ───────────────────────────────── */

reqMany('CreationInfo', `
  SWVersionNo SWCreatedBy JSONCreatedBy JSONCreationDate IntermediaryCity Digest
`);
reqMany('Form_ITR3', `
  FormName Description AssessmentYear SchemaVer FormVer
`);
reqMany('PartA_GEN1', `
  PersonalInfo.AssesseeName.SurNameOrOrgName PersonalInfo.PAN PersonalInfo.Address.ResidenceNo PersonalInfo.Address.LocalityOrArea PersonalInfo.Address.CityOrTownOrDistrict
  PersonalInfo.Address.StateCode PersonalInfo.Address.CountryCode PersonalInfo.Address.CountryCodeMobile PersonalInfo.Address.MobileNo PersonalInfo.Address.EmailAddress
  PersonalInfo.DOB PersonalInfo.Status FilingStatus.ReturnFileSec FilingStatus.OptOutNewTaxRegime_Method FilingStatus.SeventhProvisio139 FilingStatus.ResidentialStatus
  FilingStatus.HeldUnlistedEqShrPrYrFlg FilingStatus.ForeignExchangeFlag FilingStatus.FiiFpiFlag FilingStatus.ItrFilingDueDate
`);
reqMany('PartA_GEN2', `
  AuditInfo.LiableSec44AAflg AuditInfo.IncDclrdUs AuditInfo.LiableSec44ABflg AuditInfo.LiableSec92Eflg AuditInfo.AccountAuditFlag
`);
reqMany('PARTA_BS', `
  FundSrc.PropFund.PropCap FundSrc.PropFund.ResrNSurp.RevResr FundSrc.PropFund.ResrNSurp.CapResr FundSrc.PropFund.ResrNSurp.StatResr FundSrc.PropFund.ResrNSurp.OthResr
  FundSrc.PropFund.ResrNSurp.TotResrNSurp FundSrc.PropFund.TotPropFund FundSrc.LoanFunds.SecrLoan.ForeignCurrLoan FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmBank
  FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmOthrs FundSrc.LoanFunds.SecrLoan.RupeeLoan.TotRupeeLoan FundSrc.LoanFunds.SecrLoan.TotSecrLoan
  FundSrc.LoanFunds.UnsecrLoan.FrmBank FundSrc.LoanFunds.UnsecrLoan.FrmOthrs FundSrc.LoanFunds.UnsecrLoan.TotUnSecrLoan FundSrc.LoanFunds.TotLoanFund FundSrc.DeferredTax
  FundSrc.Advances.TotalAdvances FundSrc.TotFundSrc FundApply.FixedAsset.GrossBlock FundApply.FixedAsset.Depreciation FundApply.FixedAsset.NetBlock
  FundApply.FixedAsset.CapWrkProg FundApply.FixedAsset.TotFixedAsset FundApply.Investments.LongTermInv.GovtOthSecQuoted FundApply.Investments.LongTermInv.GovOthSecUnQoted
  FundApply.Investments.LongTermInv.TotLongTermInv FundApply.Investments.TradeInv.EquityShares FundApply.Investments.TradeInv.PreferShares
  FundApply.Investments.TradeInv.Debenture FundApply.Investments.TradeInv.TotTradeInv FundApply.Investments.TotInvestments
  FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StoresConsumables FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.RawMatl
  FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StkInProcess FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.FinOrTradGood
  FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.TotInventries FundApply.CurrAssetLoanAdv.CurrAsset.SndryDebtors
  FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.CashinHand FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.BankBal
  FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.TotCashOrBankBal FundApply.CurrAssetLoanAdv.CurrAsset.OthCurrAsset FundApply.CurrAssetLoanAdv.CurrAsset.TotCurrAsset
  FundApply.CurrAssetLoanAdv.LoanAdv.AdvRecoverable FundApply.CurrAssetLoanAdv.LoanAdv.Deposits FundApply.CurrAssetLoanAdv.LoanAdv.BalWithRevAuth
  FundApply.CurrAssetLoanAdv.LoanAdv.TotLoanAdv FundApply.CurrAssetLoanAdv.TotCurrAssetLoanAdv FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCred
  FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.LiabForLeasedAsset FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntonLeasedAsset
  FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntNotDue FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.TotCurrLiabilities
  FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ITProvision FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ELSuperAnnGratProvision
  FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.OthProvision FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.TotProvisions
  FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.TotCurrLiabilitiesProvision FundApply.CurrAssetLoanAdv.NetCurrAsset FundApply.MiscAdjust.MiscExpndr
  FundApply.MiscAdjust.DefTaxAsset FundApply.MiscAdjust.AccumaltedLosses FundApply.MiscAdjust.TotMiscAdjust FundApply.TotFundApply
`);
reqMany('PARTA_PL', `
  CreditsToPL.OthIncome.RentInc CreditsToPL.OthIncome.Comissions CreditsToPL.OthIncome.Dividends CreditsToPL.OthIncome.InterestInc
  CreditsToPL.OthIncome.ProfitOnSaleFixedAsset CreditsToPL.OthIncome.ProfitOnInvChrSTT CreditsToPL.OthIncome.ProfitOnOthInv CreditsToPL.OthIncome.ProfitOnCurrFluct
  CreditsToPL.OthIncome.ProfitOnCnvInvntryToCapAsst CreditsToPL.OthIncome.ProfitOnAgriIncome CreditsToPL.OthIncome.MiscOthIncome CreditsToPL.OthIncome.TotOthIncome
  CreditsToPL.TotCreditsToPL DebitsToPL.Freight DebitsToPL.ConsumptionOfStores DebitsToPL.PowerFuel DebitsToPL.RentExpdr DebitsToPL.RepairsBldg DebitsToPL.RepairMach
  DebitsToPL.EmployeeComp.SalsWages DebitsToPL.EmployeeComp.Bonus DebitsToPL.EmployeeComp.MedExpReimb DebitsToPL.EmployeeComp.LeaveEncash
  DebitsToPL.EmployeeComp.LeaveTravelBenft DebitsToPL.EmployeeComp.ContToSuperAnnFund DebitsToPL.EmployeeComp.ContToPF DebitsToPL.EmployeeComp.ContToGratFund
  DebitsToPL.EmployeeComp.ContToOthFund DebitsToPL.EmployeeComp.OthEmpBenftExpdr DebitsToPL.EmployeeComp.TotEmployeeComp DebitsToPL.Insurances.MedInsur
  DebitsToPL.Insurances.LifeInsur DebitsToPL.Insurances.KeyManInsur DebitsToPL.Insurances.OthInsur DebitsToPL.Insurances.TotInsurances DebitsToPL.StaffWelfareExp
  DebitsToPL.Entertainment DebitsToPL.Hospitality DebitsToPL.Conference DebitsToPL.SalePromoExp DebitsToPL.Advertisement DebitsToPL.CommissionExpdrDtls.NonResOtherCompany
  DebitsToPL.CommissionExpdrDtls.Others DebitsToPL.CommissionExpdrDtls.Total DebitsToPL.RoyalityDtls.NonResOtherCompany DebitsToPL.RoyalityDtls.Others
  DebitsToPL.RoyalityDtls.Total DebitsToPL.ProfessionalConstDtls.NonResOtherCompany DebitsToPL.ProfessionalConstDtls.Others DebitsToPL.ProfessionalConstDtls.Total
  DebitsToPL.HotelBoardLodge DebitsToPL.TravelExp DebitsToPL.ForeignTravelExp DebitsToPL.ConveyanceExp DebitsToPL.TelephoneExp DebitsToPL.GuestHouseExp DebitsToPL.ClubExp
  DebitsToPL.FestivalCelebExp DebitsToPL.Scholarship DebitsToPL.Gift DebitsToPL.Donation DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.UnionExciseDuty
  DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.ServiceTax DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.VATorSaleTax
  DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.CentralGoodServiceTax DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.StateGoodServiceTax
  DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.IntegratedGoodServiceTax DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.UnionTerrGoodServiceTax
  DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.OthDutyTaxCess DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.TotExciseCustomsVAT DebitsToPL.AuditFee DebitsToPL.OtherExpenses
  DebitsToPL.BadDebtDtls.BadDebtAmtDtlsTotal DebitsToPL.BadDebtDtls.OthersPANNotAvlblDtlTotal DebitsToPL.BadDebtDtls.OthersAmtLt1Lakh DebitsToPL.BadDebtDtls.BadDebt
  DebitsToPL.ProvForBadDoubtDebt DebitsToPL.OthProvisionsExpdr DebitsToPL.PBIDTA DebitsToPL.InterestExpdrtDtls.NonResOtherCompany DebitsToPL.InterestExpdrtDtls.Others
  DebitsToPL.InterestExpdrtDtls.InterestExpdr DebitsToPL.DepreciationAmort DebitsToPL.PBT TaxProvAppr.ProvForCurrTax TaxProvAppr.ProvDefTax TaxProvAppr.ProfitAfterTax
  TaxProvAppr.BalBFPrevYr TaxProvAppr.AmtAvlAppr TaxProvAppr.TrfToReserves TaxProvAppr.ProprietorAccBalTrf NoBooksOfAccPL.GrossReceipt
  NoBooksOfAccPL.GrsRcptAccPayeeOrBankMode NoBooksOfAccPL.GrsRcptOtherMode NoBooksOfAccPL.GrossProfit NoBooksOfAccPL.Expenses NoBooksOfAccPL.NetProfit
  NoBooksOfAccPL.GrossReceiptPrf NoBooksOfAccPL.GrsRcptAccPayeeOrBankModePrf NoBooksOfAccPL.GrsRcptOtherModePrf NoBooksOfAccPL.GrossProfitPrf NoBooksOfAccPL.ExpensesPrf
  NoBooksOfAccPL.NetProfitPrf NoBooksOfAccPL.TotBusinessProfession TurnverFrmSpecActivity NetIncomeFrmSpecActivity
`);
reqMany('ITR3ScheduleBP', `
  BusinessIncOthThanSpec.ProfBfrTaxPL BusinessIncOthThanSpec.NetPLFromSpecBus BusinessIncOthThanSpec.NetPLFromSpecifiedBus
  BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Salary BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.HouseProperty
  BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.CapitalGains BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.OtherSources
  BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Dividend BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.OtherThanDividend
  BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Us115BBF BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Us115BBG BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.115BBH
  BusinessIncOthThanSpec.PLUs44sChapXIIG BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44AD BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44ADA
  BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44AE BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44B
  BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44BB BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44BBA
  BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44BBC BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44DA
  BusinessIncOthThanSpec.TotalProfitFrmActCvrd BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7
  BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7A BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7B1
  BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7B1A BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule8
  BusinessIncOthThanSpec.IncCredPL.FirmShareInc BusinessIncOthThanSpec.IncCredPL.AOPBOISharInc BusinessIncOthThanSpec.IncCredPL.OthExempInc
  BusinessIncOthThanSpec.IncCredPL.TotExempIncPL BusinessIncOthThanSpec.BalancePLOthThanSpecBus BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.Salary
  BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.HouseProperty BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.CapitalGains
  BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.OtherSources BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.Us115BBF BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.Us115BBG
  BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.115BBH BusinessIncOthThanSpec.ExpDebToPLExemptInc BusinessIncOthThanSpec.ExpDebToPLExemptIncDisAllwUs14A
  BusinessIncOthThanSpec.TotExpDebPL BusinessIncOthThanSpec.AdjustedPLOthThanSpecBus BusinessIncOthThanSpec.DepreciationDebPLCosAct
  BusinessIncOthThanSpec.DepreciationAllowITAct32.DepreciationAllowUs32_1_ii BusinessIncOthThanSpec.DepreciationAllowITAct32.DepreciationAllowUs32_1_i
  BusinessIncOthThanSpec.DepreciationAllowITAct32.TotDeprAllowITAct BusinessIncOthThanSpec.AdjustPLAfterDeprOthSpecInc BusinessIncOthThanSpec.AmtDebPLDisallowUs36
  BusinessIncOthThanSpec.AmtDebPLDisallowUs37 BusinessIncOthThanSpec.AmtDebPLDisallowUs40 BusinessIncOthThanSpec.AmtDebPLDisallowUs40A
  BusinessIncOthThanSpec.AmtDebPLDisallowUs43B BusinessIncOthThanSpec.InterestDisAllowUs23SMEAct BusinessIncOthThanSpec.DeemIncUs41
  BusinessIncOthThanSpec.DeemIncUs3380HHD80IA BusinessIncOthThanSpec.DeemIncUs43CA BusinessIncOthThanSpec.OthItemDisallowUs28To44DA
  BusinessIncOthThanSpec.AnyOthIncNotInclInExpDisallowPL BusinessIncOthThanSpec.AnyOthIncNotInclInSalary BusinessIncOthThanSpec.AnyOthIncNotInclInBonus
  BusinessIncOthThanSpec.AnyOthIncNotInclInCommission BusinessIncOthThanSpec.AnyOthIncNotInclInInterest BusinessIncOthThanSpec.AnyOthIncNotInclInOthers
  BusinessIncOthThanSpec.IncProfDecLossAccICDSAdj BusinessIncOthThanSpec.TotAfterAddToPLDeprOthSpecInc BusinessIncOthThanSpec.DeductUs32_1_iii
  BusinessIncOthThanSpec.DebPLUs35ExcessAmt BusinessIncOthThanSpec.AmtDisallUs40NowAllow BusinessIncOthThanSpec.AmtDisallUs43BNowAllow
  BusinessIncOthThanSpec.AnyOthAmtAllDeduct BusinessIncOthThanSpec.DecProfIncLossAccICDSAdj BusinessIncOthThanSpec.TotDeductionAmts
  BusinessIncOthThanSpec.PLAftAdjDedBusOthThanSpec BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AD BusinessIncOthThanSpec.DeemedProfitBusUs.Section44ADA
  BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AE BusinessIncOthThanSpec.DeemedProfitBusUs.Section44B BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BB
  BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BBA BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BBC BusinessIncOthThanSpec.DeemedProfitBusUs.Section44DA
  BusinessIncOthThanSpec.DeemedProfitBusUs.TotDeemedProfitBusUs BusinessIncOthThanSpec.NetPLAftAdjBusOthThanSpec BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C
  BusinessIncOthThanSpec.ChrgblIncUndrRule7 BusinessIncOthThanSpec.DeemedChrgblIncUndrRule7A BusinessIncOthThanSpec.DeemedChrgblIncUndrRule7B1
  BusinessIncOthThanSpec.DeemedChrgblIncUndrRule7B1A BusinessIncOthThanSpec.DeemedChrgblIncUndrRule8 BusinessIncOthThanSpec.IncomeOtherThanRule
  BusinessIncOthThanSpec.BalIncDeemedFrmAgri SpecBusinessInc.NetPLFrmSpecBus SpecBusinessInc.AdditionUs28to44DA SpecBusinessInc.DeductUs28to44DA
  SpecBusinessInc.AdjustedPLFrmSpecuBus SpecifiedBusinessInc.NetPLFrmSpecifiedBus SpecifiedBusinessInc.AddSec28to44DA SpecifiedBusinessInc.DedSec28to44DAOTDedSec35AD
  SpecifiedBusinessInc.ProfitLossSpecifiedBusiness SpecifiedBusinessInc.PLFrmSpecifiedBus IncChrgUnHdProftGain BusSetoffCurrYr.LossSetOffOnBusLoss
  BusSetoffCurrYr.TotLossSetOffOnBus BusSetoffCurrYr.LossRemainSetOffOnBus
`);
reqMany('ScheduleCYLA', `
  STCG15Per.IncCYLA.IncOfCurYrUnderThatHead STCG15Per.IncCYLA.IncOfCurYrAfterSetOff STCG20Per.IncCYLA.IncOfCurYrUnderThatHead STCG20Per.IncCYLA.IncOfCurYrAfterSetOff
  STCG30Per.IncCYLA.IncOfCurYrUnderThatHead STCG30Per.IncCYLA.IncOfCurYrAfterSetOff STCGAppRate.IncCYLA.IncOfCurYrUnderThatHead STCGAppRate.IncCYLA.IncOfCurYrAfterSetOff
  STCGDTAARate.IncCYLA.IncOfCurYrUnderThatHead STCGDTAARate.IncCYLA.IncOfCurYrAfterSetOff LTCG10Per.IncCYLA.IncOfCurYrUnderThatHead LTCG10Per.IncCYLA.IncOfCurYrAfterSetOff
  LTCG12_5Per.IncCYLA.IncOfCurYrUnderThatHead LTCG12_5Per.IncCYLA.IncOfCurYrAfterSetOff LTCG20Per.IncCYLA.IncOfCurYrUnderThatHead LTCG20Per.IncCYLA.IncOfCurYrAfterSetOff
  LTCGDTAARate.IncCYLA.IncOfCurYrUnderThatHead LTCGDTAARate.IncCYLA.IncOfCurYrAfterSetOff TotalCurYr.TotHPlossCurYr TotalCurYr.TotBusLoss
  TotalCurYr.TotOthSrcLossNoRaceHorse TotalLossSetOff.TotHPlossCurYrSetoff TotalLossSetOff.TotBusLossSetoff TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff
  LossRemAftSetOff.BalHPlossCurYrAftSetoff LossRemAftSetOff.BalBusLossAftSetoff LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff
`);
reqMany('ScheduleBFLA', `
  Salary.IncBFLA.IncOfCurYrUndHeadFromCYLA Salary.IncBFLA.IncOfCurYrAfterSetOffBFLosses STCG15Per.IncBFLA.IncOfCurYrUndHeadFromCYLA STCG15Per.IncBFLA.BFUnabsorbedDeprSetoff
  STCG15Per.IncBFLA.BFAllUs35Cl4Setoff STCG15Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses STCG20Per.IncBFLA.IncOfCurYrUndHeadFromCYLA STCG20Per.IncBFLA.BFUnabsorbedDeprSetoff
  STCG20Per.IncBFLA.BFAllUs35Cl4Setoff STCG20Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses STCG30Per.IncBFLA.IncOfCurYrUndHeadFromCYLA STCG30Per.IncBFLA.BFUnabsorbedDeprSetoff
  STCG30Per.IncBFLA.BFAllUs35Cl4Setoff STCG30Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses STCGAppRate.IncBFLA.IncOfCurYrUndHeadFromCYLA
  STCGAppRate.IncBFLA.BFUnabsorbedDeprSetoff STCGAppRate.IncBFLA.BFAllUs35Cl4Setoff STCGAppRate.IncBFLA.IncOfCurYrAfterSetOffBFLosses
  STCGDTAARate.IncBFLA.IncOfCurYrUndHeadFromCYLA STCGDTAARate.IncBFLA.BFUnabsorbedDeprSetoff STCGDTAARate.IncBFLA.BFAllUs35Cl4Setoff
  STCGDTAARate.IncBFLA.IncOfCurYrAfterSetOffBFLosses LTCG10Per.IncBFLA.IncOfCurYrUndHeadFromCYLA LTCG10Per.IncBFLA.BFUnabsorbedDeprSetoff
  LTCG10Per.IncBFLA.BFAllUs35Cl4Setoff LTCG10Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses LTCG12_5Per.IncBFLA.IncOfCurYrUndHeadFromCYLA
  LTCG12_5Per.IncBFLA.BFUnabsorbedDeprSetoff LTCG12_5Per.IncBFLA.BFAllUs35Cl4Setoff LTCG12_5Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses
  LTCG20Per.IncBFLA.IncOfCurYrUndHeadFromCYLA LTCG20Per.IncBFLA.BFUnabsorbedDeprSetoff LTCG20Per.IncBFLA.BFAllUs35Cl4Setoff LTCG20Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses
  LTCGDTAARate.IncBFLA.IncOfCurYrUndHeadFromCYLA LTCGDTAARate.IncBFLA.BFUnabsorbedDeprSetoff LTCGDTAARate.IncBFLA.BFAllUs35Cl4Setoff
  LTCGDTAARate.IncBFLA.IncOfCurYrAfterSetOffBFLosses TotalBFLossSetOff.TotBFLossSetoff TotalBFLossSetOff.TotUnabsorbedDeprSetoff TotalBFLossSetOff.TotAllUs35cl4Setoff
  IncomeOfCurrYrAftCYLABFLA
`);
reqMany('PartB-TI', `
  Salaries IncomeFromHP ProfBusGain.ProfGainNoSpecBus ProfBusGain.ProfGainSpecBus ProfBusGain.ProfGainSpecifiedBus ProfBusGain.ProfIncome115BBF ProfBusGain.TotProfBusGain
  CapGain.ShortTerm.ShortTerm15Per CapGain.ShortTerm.ShortTerm20Per CapGain.ShortTerm.ShortTerm30Per CapGain.ShortTerm.ShortTermAppRate
  CapGain.ShortTerm.ShortTermSplRateDTAA CapGain.ShortTerm.TotalShortTerm CapGain.LongTerm.LongTerm10Per CapGain.LongTerm.LongTerm12_5Per CapGain.LongTerm.LongTerm20Per
  CapGain.LongTerm.LongTermSplRateDTAA CapGain.LongTerm.TotalLongTerm CapGain.ShortTermLongTermTotal CapGain.CapGains30Per115BBH CapGain.TotalCapGains
  IncFromOS.OtherSrcThanOwnRaceHorse IncFromOS.IncChargblSplRate IncFromOS.FromOwnRaceHorse IncFromOS.TotIncFromOS TotalTI CurrentYearLoss BalanceAfterSetoffLosses
  BroughtFwdLossesSetoff GrossTotalIncome IncChargeTaxSplRate111A112 DeductionsUndSchVIADtl.PartBchapterVIA DeductionsUndSchVIADtl.PartCchapterVIA
  DeductionsUndSchVIADtl.TotDeductUndSchVIA DeductionsUnder10Aor10AA TotalIncome AggregateIncome DeemedIncomeUs115JC
`);
reqMany('PartB_TTI', `
  ComputationOfTaxLiability.TaxPayableOnDeemedTI.TaxDeemedTISec115JC ComputationOfTaxLiability.TaxPayableOnDeemedTI.SurchargeOnAboveCrore
  ComputationOfTaxLiability.TaxPayableOnDeemedTI.EducationCess ComputationOfTaxLiability.TaxPayableOnDeemedTI.TotalTax
  ComputationOfTaxLiability.TaxPayableOnTI.TaxAtNormalRatesOnAggrInc ComputationOfTaxLiability.TaxPayableOnTI.TaxAtSpecialRates
  ComputationOfTaxLiability.TaxPayableOnTI.RebateOnAgriInc ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc ComputationOfTaxLiability.TaxPayableOnTI.Rebate87A
  ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnRebate ComputationOfTaxLiability.TaxPayableOnTI.Surcharge25ofSI
  ComputationOfTaxLiability.TaxPayableOnTI.Surcharge25ofSIBeforeMarginal ComputationOfTaxLiability.TaxPayableOnTI.SurchargeOnAboveCroreBeforeMarginal
  ComputationOfTaxLiability.TaxPayableOnTI.SurchargeOnAboveCrore ComputationOfTaxLiability.TaxPayableOnTI.TotalSurcharge
  ComputationOfTaxLiability.TaxPayableOnTI.EducationCess ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability ComputationOfTaxLiability.GrossTaxPayable
  ComputationOfTaxLiability.CreditUS115JD ComputationOfTaxLiability.TaxPayAfterCreditUs115JD ComputationOfTaxLiability.NetTaxLiability
  ComputationOfTaxLiability.IntrstPay.IntrstPayUs234A ComputationOfTaxLiability.IntrstPay.IntrstPayUs234B ComputationOfTaxLiability.IntrstPay.IntrstPayUs234C
  ComputationOfTaxLiability.IntrstPay.LateFilingFee234F ComputationOfTaxLiability.AggregateTaxInterestLiability TaxPaid.TaxesPaid.TotalTaxesPaid Refund.RefundDue
  Refund.BankAccountDtls.BankDtlsFlag AssetOutIndiaFlag
`);
reqMany('Verification', `
  Declaration.AssesseeVerName Declaration.FatherName Declaration.AssesseeVerPAN Capacity Date Place
`);

/* ── 3.2 Conditionally required leaves of optional schedules (616) ────────── */

condMany('PartA_139_8A', `
  PAN Name AssessmentYear PreviouslyFiledForThisAY LaidOutIn_139_8A ITRFormUpdatingInc UpdatedReturnDuringPeriod
`);
condMany('ManufacturingAccount', `
  OpeningInventory.OpngInvntryTotal OpeningInventory.DirectExpenses OpeningInventory.TotalFactoryOverheads OpeningInventory.TotalDebtsManfctrngAcc
  ClosingStock.ClsngStckTotal CostOfGoodsPrdcd
`);
condMany('TradingAccount', `
  OperatingRevenueTotal SalesGrossReceiptsTotal TotRevenueFrmOperations TardingAccTotCred DirectExpenses
`);
condMany('PARTA_OI', `
  MethodOfAcct ChangeInAcctMethFlg ProfDeviatDueAcctMeth DecProOrIncLossUs145_2 NoCredToPLAmt.Section28Items NoCredToPLAmt.ProformaCreditsDue NoCredToPLAmt.PrevYrEscalClaim
  NoCredToPLAmt.OthItemInc NoCredToPLAmt.CapReceipt NoCredToPLAmt.TotNoCredToPLAmt AmtDisallUs36.StkInsurPrem AmtDisallUs36.EmpHealthInsurPrem AmtDisallUs36.EmpBonusCommSum
  AmtDisallUs36.IntOnBorrCap AmtDisallUs36.ZeroCoupBondDisc AmtDisallUs36.RecogPFContribAmt AmtDisallUs36.AppSuperAnnFundAmt AmtDisallUs36.PensionSchemeSec80CCD
  AmtDisallUs36.AppGratFundAmt AmtDisallUs36.OthFundAmt AmtDisallUs36.EmpContributionCredits AmtDisallUs36.BadDebtDoubtAmt AmtDisallUs36.BadDebtDoubtProvn
  AmtDisallUs36.SpecResrvTranfr AmtDisallUs36.FamPlanPromoExp AmtDisallUs36.SecuritiesPaidAmt AmtDisallUs36.MrktLossOthExpLossICDS AmtDisallUs36.OthDisallowances
  AmtDisallUs36.TotAmtDisallUs36 AmtDisallUs37.CapitalNatureExp AmtDisallUs37.PersonalExp AmtDisallUs37.BusOrProfessnExp AmtDisallUs37.PoliticPartyExp
  AmtDisallUs37.LawVoilatPenalExp AmtDisallUs37.OthPenalFineExp AmtDisallUs37.OffenceExp AmtDisallUs37.ContigentLiability AmtDisallUs37.OthAmtNotAllowUs37
  AmtDisallUs37.TotAmtDisallUs37 AmtDisallUs40.NonCompChapXVIIBAmt AmtDisallUs40.NonComp40aiiChapXVIIBAmt AmtDisallUs40.NonComp40aibChapXVIIBAmt
  AmtDisallUs40.NonComp40aiiiChapXVIIBAmt AmtDisallUs40.TaxAmtOnProfits AmtDisallUs40.WTAmt AmtDisallUs40.RolyatyOrServiceFee AmtDisallUs40.IntSalBonPartner
  AmtDisallUs40.OthDisallow AmtDisallUs40.TotAmtDisallUs40 AmtDisallUs40.AmtDisallUs40PyNowAll AmtDisallUs40A.AmtPaidUs40A2b AmtDisallUs40A.AmtGT20kCash
  AmtDisallUs40A.ProvPmtGrat AmtDisallUs40A.ContToSetupTrust AmtDisallUs40A.OthDisallow AmtDisallUs40A.TotAmtDisallUs40A AmtDisallUs43BPyNowAll.AmtUs43B.TaxDutyCesAmt
  AmtDisallUs43BPyNowAll.AmtUs43B.ContToEmpPFSFGF AmtDisallUs43BPyNowAll.AmtUs43B.EmpBonusComm AmtDisallUs43BPyNowAll.AmtUs43B.IntPayaleToFI
  AmtDisallUs43BPyNowAll.AmtUs43B.SumPayaleLoanBrToFinComp AmtDisallUs43BPyNowAll.AmtUs43B.IntPayaleToFISchBank AmtDisallUs43BPyNowAll.AmtUs43B.LeaveEncashPayable
  AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b AmtDisall43B.AmtUs43B.TaxDutyCesAmt AmtDisall43B.AmtUs43B.ContToEmpPFSFGF AmtDisall43B.AmtUs43B.EmpBonusComm
  AmtDisall43B.AmtUs43B.IntPayaleToFI AmtDisall43B.AmtUs43B.SumPayaleLoanBrToFinComp AmtDisall43B.AmtUs43B.IntPayaleToFISchBank AmtDisall43B.AmtUs43B.LeaveEncashPayable
  AmtDisall43B.AmtUs43B.TotAmtUs43b AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.UnionExciseDuty AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.ServiceTax
  AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.VATorSaleTax AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.CentralGoodServiceTax
  AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.StateGoodServiceTax AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.IntegratedGoodServiceTax
  AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.UnionTerrGoodServiceTax AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.OthDutyTaxCess
  AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT DeemedProfUs33ABs ProfTaxAmtUs41 PriorAmtIncCrDrPL AmountOfExpDisAllwUs14A ScheduleTPSAFlg
`);
condMany('ScheduleS', `
  TotalGrossSalary AllwncExtentExemptUs10 NetSalary DeductionUS16 DeductionUnderSection16ia EntertainmntalwncUs16ii ProfessionalTaxUs16iii TotIncUnderHeadSalaries
`);
condMany('ScheduleHP', `
  TotalIncomeChargeableUnHP
`);
condMany('ScheduleDEP', `
  SummaryFromDeprSch.TotalDepreciation
`);
condMany('ScheduleDCG', `
  SummaryFromDeprSchCG.TotalDepreciation
`);
condMany('ScheduleESR', `
  DeductionUs35.Section35_1_i.DeductUs35.AmtDebPL DeductionUs35.Section35_1_i.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_1_i.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_1_ii.DeductUs35.AmtDebPL DeductionUs35.Section35_1_ii.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_1_ii.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_1_iia.DeductUs35.AmtDebPL DeductionUs35.Section35_1_iia.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_1_iia.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_1_iii.DeductUs35.AmtDebPL DeductionUs35.Section35_1_iii.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_1_iii.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_1_iv.DeductUs35.AmtDebPL DeductionUs35.Section35_1_iv.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_1_iv.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_2AA.DeductUs35.AmtDebPL DeductionUs35.Section35_2AA.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_2AA.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_2AB.DeductUs35.AmtDebPL DeductionUs35.Section35_2AB.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_2AB.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_CCC.DeductUs35.AmtDebPL DeductionUs35.Section35_CCC.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_CCC.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.Section35_CCD.DeductUs35.AmtDebPL DeductionUs35.Section35_CCD.DeductUs35.AmtUs35Allowable DeductionUs35.Section35_CCD.DeductUs35.ExcessAmtOverDebPL
  DeductionUs35.TotUs35.DeductUs35.AmtDebPL DeductionUs35.TotUs35.DeductUs35.AmtUs35Allowable DeductionUs35.TotUs35.DeductUs35.ExcessAmtOverDebPL
`);
condMany('ScheduleCGFor23', `
  ShortTermCapGainFor23.SlumpSaleInStcg.FMV11UAEii ShortTermCapGainFor23.SlumpSaleInStcg.FMV11UAEiii ShortTermCapGainFor23.SlumpSaleInStcg.FullConsideration
  ShortTermCapGainFor23.SlumpSaleInStcg.NetWorthOfDivision ShortTermCapGainFor23.SlumpSaleInStcg.CapgainonAssets ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaid
  ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaidTransferBE ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaidTransferAE
  ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTNotPaid ShortTermCapGainFor23.NRISecur115AD.FullValueConsdRecvUnqshr
  ShortTermCapGainFor23.NRISecur115AD.FairMrktValueUnqshr ShortTermCapGainFor23.NRISecur115AD.FullValueConsdSec50CA
  ShortTermCapGainFor23.NRISecur115AD.FullValueConsdOthUnqshr ShortTermCapGainFor23.NRISecur115AD.FullConsideration
  ShortTermCapGainFor23.NRISecur115AD.DeductSec48.AquisitCost ShortTermCapGainFor23.NRISecur115AD.DeductSec48.ImproveCost
  ShortTermCapGainFor23.NRISecur115AD.DeductSec48.ExpOnTrans ShortTermCapGainFor23.NRISecur115AD.DeductSec48.TotalDedn ShortTermCapGainFor23.NRISecur115AD.BalanceCG
  ShortTermCapGainFor23.NRISecur115AD.LossSec94of7Or94of8 ShortTermCapGainFor23.NRISecur115AD.CapgainonAssets
  ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdRecvUnqshr ShortTermCapGainFor23.SaleOnOtherAssets.FairMrktValueUnqshr
  ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdSec50CA ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdOthUnqshr
  ShortTermCapGainFor23.SaleOnOtherAssets.FullConsideration ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.AquisitCost
  ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.ImproveCost ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.ExpOnTrans
  ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.TotalDedn ShortTermCapGainFor23.SaleOnOtherAssets.BalanceCG
  ShortTermCapGainFor23.SaleOnOtherAssets.LossSec94of7Or94of8 ShortTermCapGainFor23.SaleOnOtherAssets.DeemedStcgOnAssets
  ShortTermCapGainFor23.SaleOnOtherAssets.ExemptionOrDednUs54.ExemptionGrandTotal ShortTermCapGainFor23.SaleOnOtherAssets.CapgainonAssets
  ShortTermCapGainFor23.TotalAmtDeemedStcg ShortTermCapGainFor23.PassThrIncNatureSTCG ShortTermCapGainFor23.TotalAmtNotTaxUsDTAAStcg
  ShortTermCapGainFor23.TotalAmtTaxUsDTAAStcg ShortTermCapGainFor23.TotalSTCG LongTermCapGain23.SaleofBondsDebntr.FullConsideration
  LongTermCapGain23.SaleofBondsDebntr.DeductSec48.AquisitCost LongTermCapGain23.SaleofBondsDebntr.DeductSec48.ImproveCost
  LongTermCapGain23.SaleofBondsDebntr.DeductSec48.ExpOnTrans LongTermCapGain23.SaleofBondsDebntr.DeductSec48.TotalDedn LongTermCapGain23.SaleofBondsDebntr.BalanceCG
  LongTermCapGain23.SaleofBondsDebntr.DeductionUs54F LongTermCapGain23.SaleofBondsDebntr.CapgainonAssets LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCG
  LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCGTransferBE LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCGTransferAE
  LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54F LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54FBE
  LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54FAE LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssets
  LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssetsTransferBE LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssetsTransferAE
  LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCG LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCGTransferBE
  LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCGTransferAE LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54F
  LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54FBE LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54FAE
  LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssets LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssetsTransferBE
  LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssetsTransferAE LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAsset
  LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAssetTransferBE LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAssetTransferAE
  LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115 LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115BE
  LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115AE LongTermCapGain23.NRISaleofForeignAsset.BalonSpeciAsset LongTermCapGain23.TotalAmtDeemedLtcg
  LongTermCapGain23.PassThrIncNatureLTCG LongTermCapGain23.PassThrIncNatureLTCGUs112A LongTermCapGain23.TotalAmtNotTaxUsDTAALtcg LongTermCapGain23.TotalAmtTaxUsDTAALtcg
  LongTermCapGain23.TotalLTCG SumOfCGIncm IncmFromVDATrnsf TotScheduleCGFor23 CurrYrLosses.InLossSetOff.StclSetoff15Per CurrYrLosses.InLossSetOff.StclSetoff20Per
  CurrYrLosses.InLossSetOff.StclSetoff30Per CurrYrLosses.InLossSetOff.StclSetoffAppRate CurrYrLosses.InLossSetOff.StclSetoffDTAARate
  CurrYrLosses.InLossSetOff.LtclSetOff10Per CurrYrLosses.InLossSetOff.LtclSetOff12_5Per CurrYrLosses.InLossSetOff.LtclSetOff20Per
  CurrYrLosses.InLossSetOff.LtclSetOffDTAARate CurrYrLosses.InStcg15Per.CurrYearIncome CurrYrLosses.InStcg15Per.StclSetoff20Per CurrYrLosses.InStcg15Per.StclSetoff30Per
  CurrYrLosses.InStcg15Per.StclSetoffAppRate CurrYrLosses.InStcg15Per.StclSetoffDTAARate CurrYrLosses.InStcg15Per.CurrYrCapGain CurrYrLosses.InStcg20Per.CurrYearIncome
  CurrYrLosses.InStcg20Per.StclSetoff15Per CurrYrLosses.InStcg20Per.StclSetoff30Per CurrYrLosses.InStcg20Per.StclSetoffAppRate CurrYrLosses.InStcg20Per.StclSetoffDTAARate
  CurrYrLosses.InStcg20Per.CurrYrCapGain CurrYrLosses.InStcg30Per.CurrYearIncome CurrYrLosses.InStcg30Per.StclSetoff15Per CurrYrLosses.InStcg30Per.StclSetoff20Per
  CurrYrLosses.InStcg30Per.StclSetoffAppRate CurrYrLosses.InStcg30Per.StclSetoffDTAARate CurrYrLosses.InStcg30Per.CurrYrCapGain CurrYrLosses.InStcgAppRate.CurrYearIncome
  CurrYrLosses.InStcgAppRate.StclSetoff15Per CurrYrLosses.InStcgAppRate.StclSetoff20Per CurrYrLosses.InStcgAppRate.StclSetoff30Per
  CurrYrLosses.InStcgAppRate.StclSetoffDTAARate CurrYrLosses.InStcgAppRate.CurrYrCapGain CurrYrLosses.InStcgDTAARate.CurrYearIncome
  CurrYrLosses.InStcgDTAARate.StclSetoff15Per CurrYrLosses.InStcgDTAARate.StclSetoff20Per CurrYrLosses.InStcgDTAARate.StclSetoff30Per
  CurrYrLosses.InStcgDTAARate.StclSetoffAppRate CurrYrLosses.InStcgDTAARate.CurrYrCapGain CurrYrLosses.InLtcg10Per.CurrYearIncome CurrYrLosses.InLtcg10Per.StclSetoff15Per
  CurrYrLosses.InLtcg10Per.StclSetoff20Per CurrYrLosses.InLtcg10Per.StclSetoff30Per CurrYrLosses.InLtcg10Per.StclSetoffAppRate CurrYrLosses.InLtcg10Per.StclSetoffDTAARate
  CurrYrLosses.InLtcg10Per.LtclSetOff12_5Per CurrYrLosses.InLtcg10Per.LtclSetOff20Per CurrYrLosses.InLtcg10Per.LtclSetOffDTAARate CurrYrLosses.InLtcg10Per.CurrYrCapGain
  CurrYrLosses.InLtcg12_5Per.CurrYearIncome CurrYrLosses.InLtcg12_5Per.StclSetoff15Per CurrYrLosses.InLtcg12_5Per.StclSetoff20Per CurrYrLosses.InLtcg12_5Per.StclSetoff30Per
  CurrYrLosses.InLtcg12_5Per.StclSetoffAppRate CurrYrLosses.InLtcg12_5Per.StclSetoffDTAARate CurrYrLosses.InLtcg12_5Per.LtclSetOff10Per
  CurrYrLosses.InLtcg12_5Per.LtclSetOff20Per CurrYrLosses.InLtcg12_5Per.LtclSetOffDTAARate CurrYrLosses.InLtcg12_5Per.CurrYrCapGain CurrYrLosses.InLtcg20Per.CurrYearIncome
  CurrYrLosses.InLtcg20Per.StclSetoff15Per CurrYrLosses.InLtcg20Per.StclSetoff20Per CurrYrLosses.InLtcg20Per.StclSetoff30Per CurrYrLosses.InLtcg20Per.StclSetoffAppRate
  CurrYrLosses.InLtcg20Per.StclSetoffDTAARate CurrYrLosses.InLtcg20Per.LtclSetOff10Per CurrYrLosses.InLtcg20Per.LtclSetOff12_5Per
  CurrYrLosses.InLtcg20Per.LtclSetOffDTAARate CurrYrLosses.InLtcg20Per.CurrYrCapGain CurrYrLosses.InLtcgDTAARate.CurrYearIncome CurrYrLosses.InLtcgDTAARate.StclSetoff15Per
  CurrYrLosses.InLtcgDTAARate.StclSetoff20Per CurrYrLosses.InLtcgDTAARate.StclSetoff30Per CurrYrLosses.InLtcgDTAARate.StclSetoffAppRate
  CurrYrLosses.InLtcgDTAARate.StclSetoffDTAARate CurrYrLosses.InLtcgDTAARate.LtclSetOff10Per CurrYrLosses.InLtcgDTAARate.LtclSetOff12_5Per
  CurrYrLosses.InLtcgDTAARate.LtclSetOff20Per CurrYrLosses.InLtcgDTAARate.CurrYrCapGain CurrYrLosses.TotLossSetOff.StclSetoff15Per
  CurrYrLosses.TotLossSetOff.StclSetoff20Per CurrYrLosses.TotLossSetOff.StclSetoff30Per CurrYrLosses.TotLossSetOff.StclSetoffAppRate
  CurrYrLosses.TotLossSetOff.StclSetoffDTAARate CurrYrLosses.TotLossSetOff.LtclSetOff10Per CurrYrLosses.TotLossSetOff.LtclSetOff12_5Per
  CurrYrLosses.TotLossSetOff.LtclSetOff20Per CurrYrLosses.TotLossSetOff.LtclSetOffDTAARate CurrYrLosses.LossRemainSetOff.StclSetoff15Per
  CurrYrLosses.LossRemainSetOff.StclSetoff20Per CurrYrLosses.LossRemainSetOff.StclSetoff30Per CurrYrLosses.LossRemainSetOff.StclSetoffAppRate
  CurrYrLosses.LossRemainSetOff.StclSetoffDTAARate CurrYrLosses.LossRemainSetOff.LtclSetOff10Per CurrYrLosses.LossRemainSetOff.LtclSetOff12_5Per
  CurrYrLosses.LossRemainSetOff.LtclSetOff20Per CurrYrLosses.LossRemainSetOff.LtclSetOffDTAARate AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Upto15Of6
  AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Upto15Of9 AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of9To15Of12
  AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of12To15Of3 AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of3To31Of3
  AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Upto15Of6 AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Upto15Of9 AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of9To15Of12
  AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of12To15Of3 AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of3To31Of3
  AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Upto15Of6 AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Upto15Of9 AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of9To15Of12
  AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of12To15Of3 AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of3To31Of3
  AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Upto15Of6 AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Upto15Of9
  AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of9To15Of12 AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of12To15Of3
  AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of3To31Of3 AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Upto15Of6
  AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Upto15Of9 AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of9To15Of12
  AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of12To15Of3 AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of3To31Of3
  AccruOrRecOfCG.LongTermUnder10Per.DateRange.Upto15Of6 AccruOrRecOfCG.LongTermUnder10Per.DateRange.Upto15Of9 AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of9To15Of12
  AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of12To15Of3 AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of3To31Of3
  AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Upto15Of6 AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Upto15Of9
  AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of9To15Of12 AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of12To15Of3
  AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of3To31Of3 AccruOrRecOfCG.LongTermUnder20Per.DateRange.Upto15Of6 AccruOrRecOfCG.LongTermUnder20Per.DateRange.Upto15Of9
  AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of9To15Of12 AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of12To15Of3
  AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of3To31Of3 AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Upto15Of6
  AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Upto15Of9 AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of9To15Of12
  AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of12To15Of3 AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of3To31Of3
  AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Upto15Of6 AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Upto15Of9
  AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of9To15Of12 AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of12To15Of3
  AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of3To31Of3
`);
condMany('Schedule112A', `
  SaleValue112A CostAcqWithoutIndx112A AcquisitionCost112A LTCGBeforelowerB1B2112A FairMktValueCapAst112A ExpExclCnctTransfer112A Deductions112A Balance112A Balance112ABE
  Balance112AAE TotalBalance112A
`);
condMany('Schedule115AD', `
  SaleValue115AD CostAcqWithoutIndx115AD AcquisitionCost115AD LTCGBeforelowerB1B2115AD FairMktValueCapAst115AD ExpExclCnctTransfer115AD Deductions115AD Balance115AD
  Balance115ADBE Balance115ADAE TotalBalance115AD
`);
condMany('ScheduleVDA', `
  TotIncBusiness TotIncCapGain
`);
condMany('ScheduleOS', `
  TotOthSrcNoRaceHorse IncChargeable IncFrmLottery.DateRange.Upto15Of6 IncFrmLottery.DateRange.Up16Of6To15Of9 IncFrmLottery.DateRange.Up16Of9To15Of12
  IncFrmLottery.DateRange.Up16Of12To15Of3 IncFrmLottery.DateRange.Up16Of3To31Of3 DividendIncUs115BBDA.DateRange.Upto15Of6 DividendIncUs115BBDA.DateRange.Up16Of6To15Of9
  DividendIncUs115BBDA.DateRange.Up16Of9To15Of12 DividendIncUs115BBDA.DateRange.Up16Of12To15Of3 DividendIncUs115BBDA.DateRange.Up16Of3To31Of3
  DividendIncUs115BBDAaiii.DateRange.Upto15Of6 DividendIncUs115BBDAaiii.DateRange.Up16Of6To15Of9 DividendIncUs115BBDAaiii.DateRange.Up16Of9To15Of12
  DividendIncUs115BBDAaiii.DateRange.Up16Of12To15Of3 DividendIncUs115BBDAaiii.DateRange.Up16Of3To31Of3 DividendIncUs115A1ai.DateRange.Upto15Of6
  DividendIncUs115A1ai.DateRange.Up16Of6To15Of9 DividendIncUs115A1ai.DateRange.Up16Of9To15Of12 DividendIncUs115A1ai.DateRange.Up16Of12To15Of3
  DividendIncUs115A1ai.DateRange.Up16Of3To31Of3 DividendIncUs115AC.DateRange.Upto15Of6 DividendIncUs115AC.DateRange.Up16Of6To15Of9
  DividendIncUs115AC.DateRange.Up16Of9To15Of12 DividendIncUs115AC.DateRange.Up16Of12To15Of3 DividendIncUs115AC.DateRange.Up16Of3To31Of3
  DividendIncUs115ACA.DateRange.Upto15Of6 DividendIncUs115ACA.DateRange.Up16Of6To15Of9 DividendIncUs115ACA.DateRange.Up16Of9To15Of12
  DividendIncUs115ACA.DateRange.Up16Of12To15Of3 DividendIncUs115ACA.DateRange.Up16Of3To31Of3 DividendIncUs115AD1i.DateRange.Upto15Of6
  DividendIncUs115AD1i.DateRange.Up16Of6To15Of9 DividendIncUs115AD1i.DateRange.Up16Of9To15Of12 DividendIncUs115AD1i.DateRange.Up16Of12To15Of3
  DividendIncUs115AD1i.DateRange.Up16Of3To31Of3 NOT89A.DateRange.Upto15Of6 NOT89A.DateRange.Up16Of6To15Of9 NOT89A.DateRange.Up16Of9To15Of12 NOT89A.DateRange.Up16Of12To15Of3
  NOT89A.DateRange.Up16Of3To31Of3 DividendDTAA.DateRange.Upto15Of6 DividendDTAA.DateRange.Up16Of6To15Of9 DividendDTAA.DateRange.Up16Of9To15Of12
  DividendDTAA.DateRange.Up16Of12To15Of3 DividendDTAA.DateRange.Up16Of3To31Of3
`);
condMany('ScheduleCFL', `
  TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalHPPTILossCF TotalOfBFLossesEarlierYrs.LossSummaryDetail.BusLossOthThanSpecLossCF
  TotalOfBFLossesEarlierYrs.LossSummaryDetail.LossFrmSpecBusCF TotalOfBFLossesEarlierYrs.LossSummaryDetail.LossFrmSpecifiedBusCF
  TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalSTCGPTILossCF TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalLTCGPTILossCF
  TotalOfBFLossesEarlierYrs.LossSummaryDetail.OthSrcLossRaceHorseCF TotalLossCFSummary.LossSummaryDetail.TotalHPPTILossCF
  TotalLossCFSummary.LossSummaryDetail.BusLossOthThanSpecLossCF TotalLossCFSummary.LossSummaryDetail.LossFrmSpecBusCF
  TotalLossCFSummary.LossSummaryDetail.LossFrmSpecifiedBusCF TotalLossCFSummary.LossSummaryDetail.TotalSTCGPTILossCF TotalLossCFSummary.LossSummaryDetail.TotalLTCGPTILossCF
  TotalLossCFSummary.LossSummaryDetail.OthSrcLossRaceHorseCF
`);
condMany('ITR3ScheduleUD', `
  CurrAssYr CurBalCFNY CurAllowBalCFNY TotBFUDepritAmt TotCurYrdepritSetoffInc TotDepritBalCFNY TotBFUAllowAmt TotCurYrAllowSetoffInc TotalBalCFNY
`);
condMany('Schedule10AA', `
  DeductSEZ.DedUs10Detail.TotalDedUs10Sub
`);
condMany('Schedule80G', `
  TotalDonationsUs80GCash TotalDonationsUs80GOtherMode TotalDonationsUs80G TotalEligibleDonationsUs80G
`);
condMany('Schedule80GGA', `
  TotalDonationAmtCash80GGA TotalDonationAmtOtherMode80GGA TotalDonationsUs80GGA TotalEligibleDonationAmt80GGA
`);
condMany('Schedule80GGC', `
  TotalDonationAmtCash80GGC TotalDonationAmtOtherMode80GGC TotalDonationsUs80GGC TotalEligibleDonationAmt80GGC
`);
condMany('Schedule80C', `
  TotalAmt
`);
condMany('Schedule80D', `
  Sec80DSelfFamSrCtznHealth.SeniorCitizenFlag Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn
`);
condMany('Schedule80DD', `
  NatureOfDisability TypeOfDisability DeductionAmount DependentType
`);
condMany('Schedule80U', `
  NatureOfDisability TypeOfDisability DeductionAmount
`);
condMany('Schedule80E', `
  TotalInterest80E
`);
condMany('Schedule80EE', `
  TotalInterest80EE
`);
condMany('Schedule80EEA', `
  PropStmpDtyVal TotalInterest80EEA
`);
condMany('Schedule80EEB', `
  TotalInterest80EEB
`);
condMany('Schedule80RA', `
  TotalDonationAmtCash80RA TotalDonationAmtOtherMode80RA TotalDonationsUs80RA TotalEligibleDonationAmt80RA
`);
condMany('Schedule80_IA', `
  Sch80SectionCode DeductUs80_IA_4_iv.Sch80LocOrDescCode TotSchedule80_IA
`);
condMany('Schedule80_IB', `
  Sch80SectionCode DeductMinOilUs80_IB_9_Und.Sch80LocOrDescCode DeductHousUs80_IB_10_Und.Sch80LocOrDescCode DeductFoodGrainUs80_IB_11A_Und.Sch80LocOrDescCode
  TotSchedule80_IB
`);
condMany('Schedule80_IC', `
  Sch80SectionCode DeductInNorthEast.Assam_Und.Sch80LocOrDescCode DeductInNorthEast.ArunachalPradesh_Und.Sch80LocOrDescCode DeductInNorthEast.Manipur_Und.Sch80LocOrDescCode
  DeductInNorthEast.Mizoram_Und.Sch80LocOrDescCode DeductInNorthEast.Meghalaya_Und.Sch80LocOrDescCode DeductInNorthEast.Nagaland_Und.Sch80LocOrDescCode
  DeductInNorthEast.Tripura_Und.Sch80LocOrDescCode DeductInNorthEast.Sikkim_Und.Sch80LocOrDescCode DeductInNorthEast.TotDeductInNorthEast TotSchedule80_IC
`);
condMany('ScheduleVIA', `
  UsrDeductUndChapVIA.TotPartBchapterVIA UsrDeductUndChapVIA.TotPartCchapterVIA UsrDeductUndChapVIA.TotPartCAandDchapterVIA UsrDeductUndChapVIA.TotalChapVIADeductions
  DeductUndChapVIA.TotPartBchapterVIA DeductUndChapVIA.TotPartCchapterVIA DeductUndChapVIA.TotPartCAandDchapterVIA DeductUndChapVIA.TotalChapVIADeductions
`);
condMany('ScheduleAMT', `
  TotalIncItem11 AdjustmentSec115JC.DeductClaimSec6A AdjustmentSec115JC.DeductClaimSec10AA AdjustmentSec115JC.DeductClaimSec35AD AdjustmentSec115JC.Total
  AdjustedUnderSec115JC AdjustedUnderSec115JCIFSC AdjustedUnderSec115JCOther TaxPayableUnderSec115JC
`);
condMany('ScheduleAMTC', `
  TaxSection115JC TaxOthProvisions AmtTaxCreditAvailable CurrYrAmtCreditFwd CurrYrCreditCarryFwd TotAMTGross TotSetOffEys TotBalBF TotAmtCreditUtilisedCY TotBalAMTCreditCF
  TaxSection115JD AmtLiabilityAvailable
`);
condMany('ScheduleSI', `
  TotSplRateInc TotSplRateIncTax
`);
condMany('ScheduleIF', `
  TotalProfitShareAmt TotalFirmCapBalOn31Mar
`);
condMany('ScheduleEI', `
  NetAgriIncOrOthrIncRule7 TotalExemptInc
`);
condMany('ScheduleTPSA', `
  AmtPrimaryAdjUs92CE_2A AdditionalIncTax18PercAbove Surcharge12Perc HealthEducationCess TotalAdditionalTax TaxesPaid NetTaxPayable TotalAmountDeposited
`);
condMany('ScheduleTR1', `
  TotalTaxPaidOutsideIndia TotalTaxReliefOutsideIndia TaxReliefOutsideIndiaDTAA TaxReliefOutsideIndiaNotDTAA
`);
condMany('Schedule5A2014', `
  NameOfSpouse PANOfSpouse HPHeadIncome.IncRecvdUndHead HPHeadIncome.AmtApprndOfSpouse HPHeadIncome.AmtTDSDeducted HPHeadIncome.TDSApprndOfSpouse
  BusHeadIncome.IncRecvdUndHead BusHeadIncome.AmtApprndOfSpouse BusHeadIncome.AmtTDSDeducted BusHeadIncome.TDSApprndOfSpouse CapGainHeadIncome.IncRecvdUndHead
  CapGainHeadIncome.AmtApprndOfSpouse CapGainHeadIncome.AmtTDSDeducted CapGainHeadIncome.TDSApprndOfSpouse OtherSourcesHeadIncome.IncRecvdUndHead
  OtherSourcesHeadIncome.AmtApprndOfSpouse OtherSourcesHeadIncome.AmtTDSDeducted OtherSourcesHeadIncome.TDSApprndOfSpouse TotalHeadIncome.IncRecvdUndHead
  TotalHeadIncome.AmtApprndOfSpouse TotalHeadIncome.AmtTDSDeducted TotalHeadIncome.TDSApprndOfSpouse
`);
condMany('ScheduleAL', `
  MovableAsset.DepositsInBank MovableAsset.SharesAndSecurities MovableAsset.InsurancePolicies MovableAsset.LoansAndAdvancesGiven MovableAsset.CashInHand
  MovableAsset.JewelleryBullionEtc MovableAsset.ArchCollDrawPaintSulpArt MovableAsset.VehiclYachtsBoatsAircrafts InterstAOPFlag LiabilityInRelatAssets
`);
condMany('TaxReturnPreparer', `
  IdentificationNoOfTRP NameOfTRP
`);
condMany('ScheduleIT', `
  TotalTaxPayments
`);
condMany('ScheduleTDS1', `
  TotalTDSonSalaries
`);
condMany('ScheduleTDS2', `
  TotalTDSonOthThanSals
`);
condMany('ScheduleTDS3', `
  TotalTDS3OnOthThanSal
`);
condMany('ScheduleTCS', `
  TotalSchTCS
`);
condMany('PartB-ATI', `
  UpdatedTotInc AmtPayable FeeIncUS234F AggrLiabilityRefund AggrLiabilityNoRefund AddtnlIncTax NetPayable TaxUS140B TaxDue10_11 ReleifUS89
`);
condMany('ScheduleESOP', `
  TotalTaxAttributedAmt
`);
/* ── 3.3 Repeating tables — schema-required fields of every row (132) ────── */

arrayReq('PartA_139_8A.UpdatingInc.ReasonsForUpdatingIncDtls', 'ReasonsForUpdatingIncome');
arrayReq('PartA_139_8A.RetrntoRedCarriedFL.UDYear.UnabsorbedDepreciationYearDtls', 'UnabsorbedDepreciationYear');
arrayReq('PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls', 'clauseiv7provisio139iNature clauseiv7provisio139iAmount');
arrayReq('PartA_GEN1.FilingStatus.JurisdictionResPrevYr.JurisdictionResPrevYrDtls', 'JurisdictionResidence TIN');
arrayReq('PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls', 'NameOfCompany CompanyType SharesTypes');
arrayReq('PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls', 'NameOfFirm PAN');
arrayReq('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls', 'NameOfCompany CompanyType OpngBalNumberOfShares OpngBalCostOfAcquisition ClsngBalNumberOfShares ClsngBalCostOfAcquisition');
arrayReq('PartA_GEN2.NatOfBus.NatureOfBusiness', 'Code');
arrayReq('TradingAccount.OtherOperatingRevenueDtls', 'OperatingRevenueName OperatingRevenueAmt');
arrayReq('TradingAccount.OtherIncDtls', 'NatureOfIncome Amount');
arrayReq('PARTA_PL.CreditsToPL.OthIncome.OtherIncDtls', 'Amount');
arrayReq('PARTA_PL.DebitsToPL.OtherExpensesDtls', 'ExpenseNature Amount');
arrayReq('PARTA_PL.DebitsToPL.BadDebtDtls.BadDebtAmtDtls', 'PAN Amount');
arrayReq('PARTA_PL.DebitsToPL.BadDebtDtls.OthersPANNotAvlblDtl', 'Name FlatDoorBlockNumber AreaLocality TownCityDistrict StateCode CountryCode Amount');
arrayReq('PARTA_PL.NatOfBus44AD', 'NameOfBusiness CodeAD');
arrayReq('PARTA_PL.NatOfBus44ADA', 'NameOfBusiness CodeADA');
arrayReq('PARTA_PL.NatOfBus44AE', 'NameOfBusiness CodeAE');
arrayReq('PARTA_PL.GoodsDtlsUs44AE', 'RegNumberGoodsCarriage OwnedLeasedHiredFlag TonnageCapacity HoldingPeriod PresumptiveIncome');
arrayReq('PARTA_QD.TradingConcern.QuantitDet', 'ItemName UnitOfMeasure OpeningStock PurchaseQty SaleQty ClgStock AnyShortExces');
arrayReq('PARTA_QD.ManfactrConcern.RawMaterial.QuantitDet', 'ItemName UnitOfMeasure OpeningStock PurchaseQty SaleQty ClgStock AnyShortExces');
arrayReq('PARTA_QD.ManfactrConcern.FinishrByProd.QuantitDet', 'ItemName UnitOfMeasure OpeningStock PurchaseQty SaleQty ClgStock AnyShortExces');
arrayReq('ScheduleS.Salaries', 'NameOfEmployer NatureOfEmployment');
arrayReq('ScheduleS.Salaries.Salarys.NatureOfSalary.OthersIncDtls', 'NatureDesc OthAmount');
arrayReq('ScheduleS.Salaries.Salarys.NatureOfPerquisites.OthersIncDtls', 'NatureDesc OthAmount');
arrayReq('ScheduleS.Salaries.Salarys.NatureOfProfitInLieuOfSalary.OthersIncDtls', 'NatureDesc OthAmount');
arrayReq('ScheduleS.Salaries.Salarys.IncomeNotified89AType', 'NOT89ACountrycode NOT89AAmount');
arrayReq('ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls', 'SalNatureDesc SalOthAmount');
arrayReq('ScheduleHP.PropertyDetails', 'HPSNo PropertyOwner PropCoOwnedFlg ifLetOut');
arrayReq('ScheduleHP.PropertyDetails.CoOwners', 'CoOwnersSNo NameCoOwner');
arrayReq('ScheduleHP.PropertyDetails.TenantDetails', 'TenantSNo NameofTenant');
arrayReq('ScheduleHP.PropertyDetails.Rentdetails.Section24B.Section24BDtls', 'LoanTknFrom BankOrInstnName LoanAccNoOfBankOrInstnRefNo DateofLoan TotalLoanAmt LoanOutstndngAmt InterestUs24B');
arrayReq('ITR3ScheduleBP.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls', 'DedUs35ADSubSec5');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls', 'FullConsideration PropertyValuation FullConsideration50C AquisitCost ImproveCost ExpOnTrans TotalDedn Balance CapgainonAssets');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls', 'ExemptionSecCode ExemptionAmount');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls.TrnsfImmblPrprty.TrnsfImmblPrprtyDtls', 'NameOfBuyer PercentageShare Amount AddressOfProperty StateCode CountryCode');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT', 'MFSectionCode TotalCapGainonassets');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls', 'ExemptionSecCode ExemptionAmount');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.UnutilizedCg.UnutilizedCgPrvYrDtls', 'PrvYrInWhichAsstTrnsfrd SectionClmd AmtUnutilized');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.NRICgDTAA.NRIDTAADtls', 'DTAAamt ItemNoincl CountryName CountryCodeExcludingIndia DTAAarticle RateAsPerTreaty SecITAct RateAsPerITAct');
arrayReq('ScheduleCGFor23.ShortTermCapGainFor23.CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls', 'Rate Amount');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls', 'FullConsideration PropertyValuation FullConsideration50C AquisitCost ExpOnTrans TotalDedn Balance CapgainonAssets CapgainonAssets_1ea AquisitCostIndex TotalDednForEiB BalanceForEiB TaxSec1121aiiB TaxSec1121a ExcessAmtSec1121a');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls.CostOfImprovements.CostOfImprovementsDtls', 'slno ImproveCost ImproveDate CostOfImpIndex');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls', 'ExemptionSecCode ExemptionAmount');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls.TrnsfImmblPrprty.TrnsfImmblPrprtyDtls', 'NameOfBuyer PercentageShare Amount AddressOfProperty StateCode CountryCode');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls', 'ExemptionSecCode ExemptionAmount');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls', 'ExemptionSecCode ExemptionAmount');
arrayReq('ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable', 'Proviso112SectionCode CapgainonAssets');
arrayReq('ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115.NRIOnSec115ADDtls', 'SectionCode FullValueConsdRecvUnqshr FairMrktValueUnqshr FullValueConsdSec50CA FullValueConsdOthUnqshr FullConsideration BalanceCG DeductionUs54F CapgainonAssets');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls', 'ExemptionSecCode ExemptionAmount');
arrayReq('ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls', 'ExemptionSecCode ExemptionAmount');
arrayReq('ScheduleCGFor23.LongTermCapGain23.UnutilizedCg.UnutilizedCgPrvYrDtls', 'PrvYrInWhichAsstTrnsfrd SectionClmd AmtUtilized AmtUnutilized DateofWithdrawalBE');
arrayReq('ScheduleCGFor23.LongTermCapGain23.NRICgDTAA.NRIDTAADtls', 'DTAAamt ItemNoincl CountryName CountryCodeExcludingIndia DTAAarticle RateAsPerTreaty SecITAct RateAsPerITAct');
arrayReq('ScheduleCGFor23.LongTermCapGain23.CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls', 'Rate Amount');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54', 'DateofTransfer AmtDeducted');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54B', 'DateofTransfer AmtDeducted');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54D', 'DateofAcquisition AmtDeducted');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54EC', 'DateofTransfer AmtDeducted');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54F', 'DateofTransfer AmtDeducted');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54G', 'DateofTransfer AmtDeducted');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54GA', 'DateofTransfer AmtDeducted');
arrayReq('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs115F', 'DateofTransfer AmtInvested DateofInvestment AmtDeducted');
arrayReq('Schedule112A.Schedule112ADtls', 'ShareOnOrBefore ShareTransferredOnOrBefore ISINCode ShareUnitName TotSaleValue CostAcqWithoutIndx AcquisitionCost LTCGBeforelower6and11 FairMktValuePerShareunit TotFairMktValueCapAst ExpExclCnctTransfer TotalDeductions Balance');
arrayReq('Schedule115AD.Schedule115ADDtls', 'ShareOnOrBefore ShareTransferredOnOrBefore ISINCode ShareUnitName TotSaleValue CostAcqWithoutIndx AcquisitionCost LTCGBeforelower6and11 FairMktValuePerShareunit TotFairMktValueCapAst ExpExclCnctTransfer TotalDeductions Balance');
arrayReq('ScheduleVDA.ScheduleVDADtls', 'DateofAcquisition DateofTransfer HeadUndIncTaxed AcquisitionCost ConsidReceived IncomeFromVDA');
arrayReq('ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotified89ATypeOS', 'NOT89ACountrycode NOT89AAmount');
arrayReq('ScheduleOS.IncOthThanOwnRaceHorse.OthersInc.OthersIncDtls', 'OthNatOfInc OthAmount');
arrayReq('ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls', 'AssessmentYear IncomeBenefit TaxBenefit');
arrayReq('ScheduleOS.IncOthThanOwnRaceHorse.PTIOthersGrossDtls', 'SourceDescription');
arrayReq('ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS', 'DTAAamt NatureOfIncome CountryName CountryCodeExcludingIndia DTAAarticle RateAsPerTreaty ItemNoincl RateAsPerITAct');
arrayReq('ITR3ScheduleUD.ScheduleUD', 'AssYr AmtBFUD AmtDeprSOCY BalCFNY AmtBFUAllow AmtAllowSOCY AllowBalCFNY');
arrayReq('Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy', 'AssmtYrUnit DedUs10Sub');
arrayReq('Schedule80G.Don100Percent.DoneeWithPan', 'DoneeWithPanName DoneePAN DonationAmtCash DonationAmtOtherMode DonationAmt EligibleDonationAmt');
arrayReq('Schedule80G.Don50PercentNoApprReqd.DoneeWithPan', 'DoneeWithPanName DoneePAN DonationAmtCash DonationAmtOtherMode DonationAmt EligibleDonationAmt');
arrayReq('Schedule80G.Don100PercentApprReqd.DoneeWithPan', 'DoneeWithPanName DoneePAN DonationAmtCash DonationAmtOtherMode DonationAmt EligibleDonationAmt');
arrayReq('Schedule80G.Don50PercentApprReqd.DoneeWithPan', 'DoneeWithPanName DoneePAN DonationAmtCash DonationAmtOtherMode DonationAmt EligibleDonationAmt');
arrayReq('Schedule80GGA.DonationDtlsSciRsrchRuralDev', 'RelevantClauseUndrDedClaimed NameOfDonee DoneePAN DonationAmtCash DonationAmtOtherMode DonationAmt EligibleDonationAmt');
arrayReq('Schedule80GGC.Schedule80GGCDetails', 'DonationDate DonationAmtCash DonationAmtOtherMode DonationAmt EligibleDonationAmt');
arrayReq('Schedule80C.Schedule80CDtls', 'IdentificationNo Amount');
arrayReq('Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamHIDtls.Sch80DInsDtls', 'InsurerName PolicyNo HealthInsAmt');
arrayReq('Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamSrCtznHIDtls.Sch80DInsDtls', 'InsurerName PolicyNo HealthInsAmt');
arrayReq('Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsHIDtls.Sch80DInsDtls', 'InsurerName PolicyNo HealthInsAmt');
arrayReq('Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsSrCtznHIDtls.Sch80DInsDtls', 'InsurerName PolicyNo HealthInsAmt');
arrayReq('Schedule80E.Schedule80EDtls', 'LoanTknFrom BankOrInstnName LoanAccNoOfBankOrInstnRefNo DateofLoan TotalLoanAmt LoanOutstndngAmt Interest80E');
arrayReq('Schedule80EE.Schedule80EEDtls', 'LoanTknFrom BankOrInstnName LoanAccNoOfBankOrInstnRefNo DateofLoan TotalLoanAmt LoanOutstndngAmt Interest80EE');
arrayReq('Schedule80EEA.Schedule80EEADtls', 'LoanTknFrom BankOrInstnName LoanAccNoOfBankOrInstnRefNo DateofLoan TotalLoanAmt LoanOutstndngAmt Interest80EEA');
arrayReq('Schedule80EEB.Schedule80EEBDtls', 'LoanTknFrom BankOrInstnName LoanAccNoOfBankOrInstnRefNo DateofLoan TotalLoanAmt LoanOutstndngAmt VehicleRegNo Interest80EEB');
arrayReq('Schedule80RA.DonationDtlsRsrchAssctn', 'NameOfDonee DoneePAN DonationAmt EligibleDonationAmt');
arrayReq('Schedule80_IA.DeductUs80_IA_4_iv.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IB.DeductMinOilUs80_IB_9_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IB.DeductHousUs80_IB_10_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IB.DeductFruitVegUs80_IB_11A_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IB.DeductFoodGrainUs80_IB_11A_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.Assam_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.ArunachalPradesh_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.Manipur_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.Mizoram_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.Meghalaya_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.Nagaland_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.Tripura_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('Schedule80_IC.DeductInNorthEast.Sikkim_Und.Sch80DeductAmtDtls', 'DeductAmountSec80');
arrayReq('ScheduleAMTC.ScheduleAMTCDtls', 'AssYr AmtCreditFwd AmtCreditSetOfEy AmtCreditBalBroughtFwd AmtCreditUtilized BalAmtCreditCarryFwd');
arrayReq('ScheduleSI.SplCodeRateTax', 'SecCode SplRatePercent SplRateInc SplRateIncTax');
arrayReq('ScheduleSPI.SpecifiedPerson', 'SpecifiedPersonName ReltnShip AmtIncluded HeadIncIncluded');
arrayReq('ScheduleIF.PartnerFirmDetails', 'FirmName FirmPAN ProfitSharePercent ProfitShareAmt FirmCapBalOn31Mar');
arrayReq('ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls', 'NameOfDistrict PinCode MeasurementOfLand AgriLandOwnedFlag AgriLandIrrigatedFlag');
arrayReq('ScheduleEI.OthersInc.OthersIncDtls', 'NatureDesc OthAmount');
arrayReq('ScheduleEI.IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls', 'AmountOfIncome CountryName CountryCodeExcludingIndia HeadOfIncome');
arrayReq('SchedulePTI.SchedulePTIDtls', 'InvstmntCvrdUs115UA115UB BusinessName BusinessPAN');
arrayReq('ScheduleTPSA.DtlsTaxesPaid', 'BSRCode BankBranchName DateDep SrlNoOfChaln Amount');
arrayReq('ScheduleFSI.ScheduleFSIDtls', 'CountryName CountryCodeExcludingIndia TaxIdentificationNo');
arrayReq('ScheduleTR1.ScheduleTR', 'CountryName CountryCodeExcludingIndia TaxIdentificationNo TaxPaidOutsideIndia TaxReliefOutsideIndia');
arrayReq('ScheduleFA.DetailsForiegnBank', 'CountryName CountryCodeExcludingIndia Bankname AddressOfBank ZipCode ForeignAccountNumber OwnerStatus AccOpenDate PeakBalanceDuringYear ClosingBalance IntrstAccured');
arrayReq('ScheduleFA.DtlsForeignCustodialAcc', 'CountryName CountryCodeExcludingIndia FinancialInstName FinancialInstAddress ZipCode AccountNumber Status AccOpenDate PeakBalanceDuringPeriod ClosingBalance GrossAmtPaidCredited NatureOfAmount');
arrayReq('ScheduleFA.DtlsForeignEquityDebtInterest', 'CountryName CountryCodeExcludingIndia NameOfEntity AddressOfEntity ZipCode NatureOfEntity InterestAcquiringDate InitialValOfInvstmnt PeakBalanceDuringPeriod ClosingBalance TotGrossAmtPaidCredited TotGrossProceeds');
arrayReq('ScheduleFA.DtlsForeignCashValueInsurance', 'CountryName CountryCodeExcludingIndia FinancialInstName FinancialInstAddress ZipCode ContractDate CashValOrSurrenderVal TotGrossAmtPaidCredited');
arrayReq('ScheduleFA.DetailsFinancialInterest', 'CountryName CountryCodeExcludingIndia ZipCode NameOfEntity AddressOfEntity NatureOfInt DateHeld TotalInvestment IncFromInt NatureOfInc IncTaxAmt IncTaxSch IncTaxSchNo');
arrayReq('ScheduleFA.DetailsImmovableProperty', 'CountryName CountryCodeExcludingIndia ZipCode Ownership DateOfAcq TotalInvestment IncDrvProperty NatureOfInc IncTaxAmt IncTaxSch IncTaxSchNo');
arrayReq('ScheduleFA.DetailsOthAssets', 'CountryName CountryCodeExcludingIndia ZipCode NatureOfAsset Ownership DateOfAcq TotalInvestment IncDrvAsset NatureOfInc IncTaxAmt IncTaxSch IncTaxSchNo');
arrayReq('ScheduleFA.DetailsOfAccntsHvngSigningAuth', 'NameOfInstitution AddressOfInstitution CountryName CountryCodeExcludingIndia ZipCode NameMentionedInAccnt InstitutionAccountNumber PeakBalanceOrInvestment IncAccuredTaxFlag');
arrayReq('ScheduleFA.DetailsOfTrustOutIndiaTrustee', 'CountryName CountryCodeExcludingIndia ZipCode NameOfTrust AddressOfTrust NameOfOtherTrustees AddressOfOtherTrustees NameOfSettlor AddressOfSettlor NameOfBeneficiaries AddressOfBeneficiaries DateHeld IncDrvTaxFlag');
arrayReq('ScheduleFA.DetailsOfOthSourcesIncOutsideIndia', 'CountryName CountryCodeExcludingIndia ZipCode NameOfPerson AddressOfPerson NatureOfInc IncDrvTaxFlag');
arrayReq('ScheduleAL.ImmovableDetails', 'Description Amount');
arrayReq('ScheduleAL.InterestHeldInaAsset', 'NameOfFirm PanOfFirm AssesseInvestment');
arrayReq('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', 'IFSCCode BankName BankAccountNo AccountType UseForRefund');
arrayReq('PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails', 'SWIFTCode BankName CountryCode IBAN');
arrayReq('ScheduleIT.TaxPayment', 'BSRCode DateDep SrlNoOfChaln Amt');
arrayReq('ScheduleTDS1.TDSonSalary', 'IncChrgSal TotalTDSSal');
arrayReq('ScheduleTDS2.TDSOthThanSalaryDtls', 'TDSCreditName TANOfDeductor TDSSection AmtCarriedFwd');
arrayReq('ScheduleTDS3.TDS3onOthThanSalDtls', 'TDSCreditName PANOfBuyerTenant TDSSection AmtCarriedFwd');
arrayReq('ScheduleTCS.TCS', 'TCSCreditOwner EmployerOrDeductorOrCollectTAN AmtCarriedFwd');
arrayReq('PartB-ATI.ScheduleIT1.TaxPayment1.TaxPayments', 'BSRCode DateDep SrlNoOfChaln Amt');
arrayReq('PartB-ATI.ScheduleIT2.TaxPayment2.TaxPayments', 'BSRCode DateDep SrlNoOfChaln Amt');

/* ────────────────────────────────────────────────────────────────────────────
 * 4. Identity-critical patterns and enums straight from the schema.
 *    Checked only when a value IS present (absence is already in missing[]).
 * ──────────────────────────────────────────────────────────────────────────── */

const PATTERNS: Array<[path: string, re: RegExp, msg: string]> = [
  ['PartA_GEN1.PersonalInfo.PAN', /^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN of the assessee must be 5 letters + 4 digits + 1 letter'],
  ['PartA_GEN1.PersonalInfo.AadhaarCardNo', /^[0-9]{12}$/, 'Aadhaar number must be exactly 12 digits'],
  ['PartA_GEN1.PersonalInfo.DOB', /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'Date of birth / formation must be YYYY-MM-DD'],
  ['PartA_GEN1.PersonalInfo.Address.EmailAddress', /^[.\w-]+@[\w-]+(\.[\w-]+)+$/, 'E-mail address is not in a valid format'],
  ['PartA_GEN1.PersonalInfo.Address.MobileNo', /^[1-9][0-9]{4,9}$/, 'Mobile number must be 5–10 digits and cannot start with 0'],
  ['PartA_GEN1.FilingStatus.SebiRegnNo', /^IN[a-zA-Z]{2}FP[0-9]{6}$/, 'SEBI registration number must look like INxxFP999999'],
  ['PartA_GEN2.AuditInfo.AuditorMemNo', /^\d{6}$/, 'Membership number of the auditor must be 6 digits'],
  ['PartA_GEN2.AuditInfo.AudFrmPAN', /^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN of the audit firm is not a valid PAN'],
  ['PartA_GEN2.AuditInfo.AckNum44AB', /^[0-9]{15}$/, 'Acknowledgement number of the 44AB audit report must be 15 digits'],
  ['PartA_139_8A.PAN', /^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN in Part A 139(8A) is not a valid PAN'],
  ['Schedule5A2014.PANOfSpouse', /^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN of the spouse (Schedule 5A) is not a valid PAN'],
  ['Verification.Declaration.AssesseeVerPAN', /^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN in the verification is not a valid PAN'],
  ['Verification.Date', /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'Date of verification must be YYYY-MM-DD'],
  ['CreationInfo.SWCreatedBy', /^SW[0-9]{8}$/, 'CreationInfo.SWCreatedBy must be "SW" + 8 digits'],
  ['CreationInfo.JSONCreatedBy', /^SW[0-9]{8}$/, 'CreationInfo.JSONCreatedBy must be "SW" + 8 digits'],
  ['CreationInfo.JSONCreationDate', /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'JSON creation date must be YYYY-MM-DD'],
];

const ENUMS: Array<[path: string, allowed: string[], what: string]> = [
  ['Form_ITR3.FormName', ['ITR-3'], 'Form name'],
  ['Form_ITR3.AssessmentYear', ['2025'], 'Assessment year (A.Y. 2025-26 ⇒ "2025")'],
  ['Form_ITR3.SchemaVer', ['Ver1.0'], 'Schema version'],
  ['Form_ITR3.FormVer', ['Ver1.0'], 'Form version'],
  ['PartA_GEN1.PersonalInfo.Status', ['I', 'H'], 'Status (I = Individual, H = HUF)'],
  ['PartA_GEN1.FilingStatus.ResidentialStatus', ['RES', 'NRI', 'NOR'], 'Residential status'],
  ['PartA_GEN1.FilingStatus.ItrFilingDueDate', ['2025-07-31', '2025-10-31', '2025-11-30'], 'Applicable due date for filing'],
  ['PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Method', ['BY10IEA', 'OPTINRETURN'], 'Method of opting out of the new tax regime'],
  ['PartA_GEN1.FilingStatus.SeventhProvisio139', ['Y', 'N'], 'Return filed under the seventh proviso to s.139(1)'],
  ['PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg', ['Y', 'N'], 'Held unlisted equity shares during the year'],
  ['PartA_GEN1.FilingStatus.ForeignExchangeFlag', ['Y', 'N'], 'Foreign exchange flag'],
  ['PartA_GEN1.FilingStatus.FiiFpiFlag', ['Y', 'N'], 'Whether you are an FII / FPI'],
  ['PartA_GEN2.AuditInfo.LiableSec44AAflg', ['Y', 'N'], 'Liable to maintain books u/s 44AA'],
  ['PartA_GEN2.AuditInfo.LiableSec44ABflg', ['Y', 'N'], 'Liable to audit u/s 44AB'],
  ['PartA_GEN2.AuditInfo.LiableSec92Eflg', ['Y', 'N'], 'Liable to furnish report u/s 92E'],
  ['PartA_GEN2.AuditInfo.AccountAuditFlag', ['Y', 'N'], 'Accounts audited by an accountant'],
  ['PartA_GEN2.AuditInfo.Cndnfor44AB', ['bi', 'bii', 'biii'], 'Condition by virtue of which liable to audit u/s 44AB'],
  ['PARTA_OI.MethodOfAcct', ['MERC', 'CASH'], 'Method of accounting'],
  ['PartB_TTI.AssetOutIndiaFlag', ['YES', 'NO'], 'Do you hold assets/signing authority outside India'],
  ['PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag', ['Y', 'N'], 'Bank account details flag'],
  ['Verification.Capacity', ['S', 'R', 'K', 'A'], 'Capacity in which the return is verified'],
];

/* ────────────────────────────────────────────────────────────────────────────
 * 5. Scalar helpers.
 * ──────────────────────────────────────────────────────────────────────────── */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function str(v: unknown): string {
  return v === undefined || v === null ? '' : String(v).trim();
}
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}
/** Descend a dotted path, expanding every array hop; collect the arrays found. */
function collectArrays(node: unknown, segs: string[], prefix: string, out: Array<[unknown[], string]>): void {
  if (node === undefined || node === null) return;
  if (Array.isArray(node)) {
    node.forEach((el, i) => collectArrays(el, segs, `${prefix}[${i}]`, out));
    return;
  }
  if (segs.length === 0 || !isObj(node)) return;
  const key = segs[0];
  const next = node[key];
  const np = `${prefix}.${key}`;
  if (segs.length === 1) {
    if (Array.isArray(next)) out.push([next, np]);
    return;
  }
  collectArrays(next, segs.slice(1), np, out);
}

/* ────────────────────────────────────────────────────────────────────────────
 * 6. The checker.
 * ──────────────────────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  const g = (p: string): unknown => at(json, `${ROOT}.${p}`);
  const n = (p: string): number => num(g(p));
  const s = (p: string): string => str(g(p));
  const filled = (p: string): boolean => {
    const v = g(p);
    if (isObj(v)) return Object.keys(v).length > 0;
    return !isEmpty(v);
  };
  const rowsOf = (p: string): unknown[] => {
    const v = g(p);
    return Array.isArray(v) ? v : [];
  };
  const err = (rule: string, p: string, msg: string): void => {
    errors.push({ path: `${ROOT}.${p}`, msg, rule });
  };
  const warn = (rule: string, p: string, msg: string): void => {
    warnings.push({ path: `${ROOT}.${p}`, msg, rule });
  };
  const need = (rule: string, p: string, msg: string): void => {
    if (!filled(p)) err(rule, p, msg);
  };
  /** total-vs-breakup check with the ±1 rupee round-off the portal allows */
  const eq = (rule: string, totalPath: string, parts: string[], what: string, minus: string[] = []): void => {
    if (g(totalPath) === undefined) return;
    const lhs = n(totalPath);
    const rhs = parts.reduce((a, p) => a + n(p), 0) - minus.reduce((a, p) => a + n(p), 0);
    if (Math.abs(lhs - rhs) > 1) {
      err(rule, totalPath, `${what}: value ${lhs} does not equal the break-up total ${rhs}`);
    }
  };

  try {
    /* 6.0 Root shape */
    if (!isObj(at(json, ROOT))) {
      missing.push({
        path: ROOT,
        label: 'ITR-3 return body — the JSON must be shaped { "ITR": { "ITR3": { … } } }',
        hint: 'Export the return from the ITR-3 utility',
      });
    }

    /* 6.1 Unconditionally required leaves */
    for (const [p, label, hint] of REQUIRED) {
      if (isEmpty(g(p))) missing.push({ path: `${ROOT}.${p}`, label, ...(hint ? { hint } : {}) });
    }

    /* 6.2 Required leaves of OPTIONAL schedules that have been started */
    for (const [top, leaves] of CONDITIONAL) {
      if (!filled(top)) continue;
      const secName = (SEC[top] ?? [top, ''])[0];
      for (const [rel, label, hint] of leaves) {
        if (isEmpty(g(`${top}.${rel}`))) {
          missing.push({
            path: `${ROOT}.${top}.${rel}`,
            label: `${label} — ${secName} has been filled, so this field is mandatory`,
            ...(hint ? { hint } : {}),
          });
        }
      }
    }

    /* 6.3 Repeating tables — every row must carry its schema-required fields */
    const itr3 = at(json, ROOT);
    for (const [tablePath, keys] of TABLE_ROWS) {
      const found: Array<[unknown[], string]> = [];
      collectArrays(itr3, tablePath.split('.'), ROOT, found);
      for (const [arr, prefix] of found) {
        arr.forEach((row, i) => {
          for (const k of keys) {
            if (isEmpty(at(row, k))) {
              missing.push({
                path: `${prefix}[${i}].${k}`,
                label: `Row ${i + 1} of "${tablePath}" is missing its mandatory field "${humanize(k)}"`,
                hint: 'Complete the row or delete it',
              });
            }
          }
        });
      }
    }

    /* 6.4 Identity patterns and enums */
    for (const [p, re, msg] of PATTERNS) {
      const v = g(p);
      if (!isEmpty(v) && !re.test(str(v))) err('SCHEMA', p, `${msg} (found "${str(v)}")`);
    }
    for (const [p, allowed, what] of ENUMS) {
      const v = g(p);
      if (!isEmpty(v) && allowed.indexOf(str(v)) < 0) {
        err('SCHEMA', p, `${what}: "${str(v)}" is not one of ${allowed.join(' / ')}`);
      }
    }

    /* ── derived facts used by several rules ─────────────────────────────── */
    const status = s('PartA_GEN1.PersonalInfo.Status');
    const isHUF = status === 'H';
    const resStatus = s('PartA_GEN1.FilingStatus.ResidentialStatus');
    const isNRI = resStatus === 'NRI';
    const method = s('PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Method');
    const optedOut =
      (method === 'BY10IEA' &&
        (s('PartA_GEN1.FilingStatus.Yes_ContOptOutNewTaxReg') === 'Y' ||
          s('PartA_GEN1.FilingStatus.No_OptOutNewTaxReg') === 'Y' ||
          s('PartA_GEN1.FilingStatus.NA_OptOutNewTaxReg') === 'Y')) ||
      (method === 'OPTINRETURN' && s('PartA_GEN1.FilingStatus.SetOptOutNewTaxReg') === 'Y');
    const newRegime = !optedOut;
    const liable44AB = s('PartA_GEN2.AuditInfo.LiableSec44ABflg') === 'Y';
    const TI = 'PartB-TI';
    const VIA = 'ScheduleVIA.DeductUndChapVIA';

    /* ── A. Part A – General: identity, regime, audit ────────────────────── */

    /* A26/A27 — DOB must precede 01-04-2025 (the AY for which the return is filed) */
    {
      const dob = s('PartA_GEN1.PersonalInfo.DOB');
      if (/^\d{4}-\d{2}-\d{2}$/.test(dob) && dob >= '2025-04-01') {
        err('A26', 'PartA_GEN1.PersonalInfo.DOB', `Date of birth / formation (${dob}) must be before 01-04-2025 for A.Y. 2025-26`);
      }
    }

    /* A5 — seventh-proviso flags require the corresponding amounts */
    {
      const pairs: Array<[string, string, string]> = [
        ['DepAmtAggAmtExcd1CrPrYrFlg', 'AmtSeventhProvisio139i', 'aggregate deposits exceeding ₹1 crore in current accounts'],
        ['IncrExpAggAmt2LkTrvFrgnCntryFlg', 'AmtSeventhProvisio139ii', 'expenditure exceeding ₹2 lakh on foreign travel'],
        ['IncrExpAggAmt1LkElctrctyPrYrFlg', 'AmtSeventhProvisio139iii', 'expenditure exceeding ₹1 lakh on electricity'],
      ];
      for (const [flag, amt, what] of pairs) {
        if (s(`PartA_GEN1.FilingStatus.${flag}`) === 'Y') {
          need('A5', `PartA_GEN1.FilingStatus.${amt}`, `Seventh proviso to s.139(1) — "${what}" is answered Yes, so the amount must be filled`);
        }
      }
      if (s('PartA_GEN1.FilingStatus.clauseiv7provisio139i') === 'Y' && rowsOf('PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls').length === 0) {
        err('A5', 'PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls', 'Return is filed under clause (iv) of the seventh proviso to s.139(1) but no nature/amount rows are filled');
      }
    }

    /* A6 — Schedule 115AD(1)(b)(iii) proviso is only for an FII / FPI */
    if (filled('Schedule115AD') && s('PartA_GEN1.FilingStatus.FiiFpiFlag') !== 'Y') {
      err('A6', 'PartA_GEN1.FilingStatus.FiiFpiFlag', 'Schedule 115AD(1)(b)(iii) proviso is filled, so "Whether you are FII / FPI?" must be answered Yes');
    }
    if (s('PartA_GEN1.FilingStatus.FiiFpiFlag') === 'Y') {
      need('A6', 'PartA_GEN1.FilingStatus.SebiRegnNo', 'FII / FPI is answered Yes — the SEBI registration number is mandatory');
    }

    /* A7 — return filed in response to a notice needs the DIN and its date */
    {
      const sec = n('PartA_GEN1.FilingStatus.ReturnFileSec');
      const noticeNo = s('PartA_GEN1.FilingStatus.NoticeNo');
      const noticeDt = s('PartA_GEN1.FilingStatus.NoticeDate');
      if (sec === 17 || sec === 18 || sec === 19) {
        if (!noticeNo) err('A7', 'PartA_GEN1.FilingStatus.NoticeNo', 'Return filed in response to a notice u/s 139(9)/142(1)/148 — the unique number / DIN of the notice is mandatory');
        if (!noticeDt) err('A7', 'PartA_GEN1.FilingStatus.NoticeDate', 'Return filed in response to a notice u/s 139(9)/142(1)/148 — the date of the notice is mandatory');
      } else if (sec === 16 || sec === 20) {
        if (!noticeNo || !noticeDt) warn('A7', 'PartA_GEN1.FilingStatus.NoticeNo', 'Return filed pursuant to an order/notice — the unique number (DIN) and its date are normally mandatory');
      }
      if (noticeNo && !noticeDt) err('A7', 'PartA_GEN1.FilingStatus.NoticeDate', 'A notice / DIN number is given but the date of the notice is missing');
      if (noticeDt && !noticeNo) err('A7', 'PartA_GEN1.FilingStatus.NoticeNo', 'A notice date is given but the unique number / DIN of the notice is missing');
      if (sec === 21) {
        need('A7', 'PartA_139_8A', 'Return is filed u/s 139(8A) (updated return) — Part A 139(8A) must be filled');
        need('A7', 'PartB-ATI', 'Return is filed u/s 139(8A) (updated return) — Part B-ATI must be filled');
      }
    }

    /* A21/A28/A29/A33/A43/A44/A45 — the 115BAC / Form 10-IEA question set */
    {
      const setA = s('PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25');
      const a1 = s('PartA_GEN1.FilingStatus.Yes_ContOptOutNewTaxReg');
      const b1 = s('PartA_GEN1.FilingStatus.No_OptOutNewTaxReg');
      const c1 = s('PartA_GEN1.FilingStatus.NA_OptOutNewTaxReg');
      if (!method) {
        err('A33', 'PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Method', 'In Part A General, "Method of opting-out of the new tax regime for the current AY" is not selected');
      }
      if (method === 'BY10IEA' && !setA) {
        err('A28', 'PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25', 'Opting out "by filing Form 10-IEA" is selected but the Set A question (option u/s 115BAC(6) exercised in A.Y. 2024-25?) is not answered');
      }
      if (method === 'OPTINRETURN' && !s('PartA_GEN1.FilingStatus.SetOptOutNewTaxReg')) {
        err('A29', 'PartA_GEN1.FilingStatus.SetOptOutNewTaxReg', 'Opting out "by exercising the option in the return of income only" is selected but the Set B question is not answered');
      }
      if (setA === 'Y' && (!a1 || b1 || c1)) {
        err('A43', 'PartA_GEN1.FilingStatus.Yes_ContOptOutNewTaxReg', 'Set A is answered Yes — only a1 ("do you wish to continue to opt out…") may be answered, and it must be answered');
      }
      if (setA === 'N' && (!b1 || a1 || c1)) {
        err('A44', 'PartA_GEN1.FilingStatus.No_OptOutNewTaxReg', 'Set A is answered No — only b1 ("do you wish to opt out…") may be answered, and it must be answered');
      }
      if (setA === 'NA' && (!c1 || a1 || b1)) {
        err('A45', 'PartA_GEN1.FilingStatus.NA_OptOutNewTaxReg', 'Set A is answered NA — only c1 may be answered, and it must be answered');
      }
      /* A30 — Form 10-IEA particulars for A.Y. 2025-26 */
      if (a1 === 'N' || b1 === 'Y') {
        need('A30', 'PartA_GEN1.FilingStatus.Form10IEADate', 'Date of filing Form 10-IEA for A.Y. 2025-26 is mandatory for the option selected');
        need('A30', 'PartA_GEN1.FilingStatus.Form10IEAAckNo', 'Acknowledgement number of Form 10-IEA for A.Y. 2025-26 is mandatory for the option selected');
      }
      /* A22 — Set A = Yes ⇒ the A.Y. 2024-25 Form 10-IEA particulars must be in the return */
      if (setA === 'Y') {
        need('A22', 'PartA_GEN1.FilingStatus.Form10IEADate_AY24_25', 'Form 10-IEA was filed for A.Y. 2024-25 — its date of filing must be mentioned in the return');
        need('A22', 'PartA_GEN1.FilingStatus.Form10IEAAckNo_AY24_25', 'Form 10-IEA was filed for A.Y. 2024-25 — its acknowledgement number must be mentioned in the return');
      }
    }

    /* A32 — with business income, Set B (option in the return only) is not allowed */
    if (method === 'OPTINRETURN' && n(`${TI}.ProfBusGain.TotProfBusGain`) !== 0) {
      err('A32', 'PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Method', 'Income from business or profession is disclosed, so opting out through the return only (Set B) is not allowed — Form 10-IEA is required');
    }

    /* A2 — audited accounts require the auditor / audit-report particulars */
    if (liable44AB && s('PartA_GEN2.AuditInfo.AccountAuditFlag') === 'Y') {
      const A = 'PartA_GEN2.AuditInfo';
      need('A2', `${A}.AuditorName`, 'Accounts are audited u/s 44AB — name of the auditor is mandatory');
      need('A2', `${A}.AuditorMemNo`, 'Accounts are audited u/s 44AB — membership number of the auditor is mandatory');
      need('A2', `${A}.AudFrmName`, 'Accounts are audited u/s 44AB — name of the audit firm is mandatory');
      need('A2', `${A}.AudFrmRegNo`, 'Accounts are audited u/s 44AB — registration number of the audit firm is mandatory');
      need('A2', `${A}.AudFrmPAN`, 'Accounts are audited u/s 44AB — PAN of the audit firm is mandatory');
      need('A2', `${A}.AuditDate`, 'Accounts are audited u/s 44AB — date of the audit report is mandatory');
      need('A2', `${A}.AuditReportFurnishDate`, 'Accounts are audited u/s 44AB — date of furnishing the audit report is mandatory');
      need('A2', `${A}.AckNum44AB`, 'Accounts are audited u/s 44AB — acknowledgement number of the audit report is mandatory');
      need('A2', `${A}.UDIN`, 'Accounts are audited u/s 44AB — UDIN of the audit report is mandatory');
    }
    /* A12 — the condition attracting 44AB must be selected */
    if (liable44AB) need('A12', 'PartA_GEN2.AuditInfo.Cndnfor44AB', 'You are liable to audit u/s 44AB — the condition by virtue of which you are liable must be selected');
    /* A16/A19 — cash receipts/payments above 5% force a 44AB audit */
    if (!liable44AB && (s('PartA_GEN2.AuditInfo.AgrOFAllAmtsRcvd') === 'N' || s('PartA_GEN2.AuditInfo.AgrOFAllPayMade') === 'N')) {
      err('A16', 'PartA_GEN2.AuditInfo.LiableSec44ABflg', 'Cash receipts/payments exceed 5% of the aggregate, so you are liable to audit u/s 44AB — the flag must be Yes');
    }
    /* A92E — a s.92E report requires its particulars */
    if (s('PartA_GEN2.AuditInfo.LiableSec92Eflg') === 'Y') {
      need('SCHEMA', 'PartA_GEN2.AuditInfo.AuditDetails92E', 'A report u/s 92E is required — the audit particulars u/s 92E must be filled');
    }
    /* A14/A15 — an extended due date must be supported by IF / 5A / audit */
    {
      const due = s('PartA_GEN1.FilingStatus.ItrFilingDueDate');
      if ((due === '2025-10-31' || due === '2025-11-30') && !filled('ScheduleIF') && !filled('Schedule5A2014') && s('PartA_GEN2.AuditInfo.AccountAuditFlag') !== 'Y' && !liable44AB) {
        err(due === '2025-10-31' ? 'A14' : 'A15', 'PartA_GEN1.FilingStatus.ItrFilingDueDate', `Due date ${due} is selected — Schedule IF or Schedule 5A or the audit details in Part A General must be filled`);
      }
    }
    /* Declaration flags that pull in their own tables */
    if (s('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg') === 'Y' && rowsOf('PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls').length === 0) {
      err('SCHEMA', 'PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr', 'Unlisted equity shares were held during the year but no share details are filled');
    }
    if (s('PartA_GEN1.FilingStatus.CompDirectorPrvYrFlg') === 'Y' && rowsOf('PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls').length === 0) {
      err('SCHEMA', 'PartA_GEN1.FilingStatus.CompDirectorPrvYr', 'You have declared that you were a director in a company but no company details are filled');
    }
    if (s('PartA_GEN1.FilingStatus.PartnerInFirmFlg') === 'Y' && rowsOf('PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls').length === 0) {
      err('SCHEMA', 'PartA_GEN1.FilingStatus.PartnerInFirm', 'You have declared that you are a partner in a firm but no firm details are filled');
    }
    if (s('PartA_GEN1.FilingStatus.AsseseeRepFlg') === 'Y') {
      need('SCHEMA', 'PartA_GEN1.FilingStatus.AssesseeRep', 'The return is furnished by a representative assessee — the representative details are mandatory');
    }
    /* A929 — Portuguese Civil Code cases need Schedule 5A with the spouse PAN */
    if (s('PartA_GEN1.FilingStatus.PortugeseCC5A') === 'Y') {
      need('A929', 'Schedule5A2014', 'You are governed by the Portuguese Civil Code — Schedule 5A must be filled');
      need('A929', 'Schedule5A2014.PANOfSpouse', 'You are governed by the Portuguese Civil Code — the PAN of the spouse must be provided');
    }

    /* ── B. Part A – Balance Sheet totals (A47–A55) ──────────────────────── */
    {
      const B = 'PARTA_BS';
      eq('A48', `${B}.FundSrc.PropFund.TotPropFund`, [`${B}.FundSrc.PropFund.PropCap`, `${B}.FundSrc.PropFund.ResrNSurp.TotResrNSurp`], 'Balance Sheet — Total proprietor’s fund');
      eq('A48', `${B}.FundSrc.PropFund.ResrNSurp.TotResrNSurp`, [`${B}.FundSrc.PropFund.ResrNSurp.RevResr`, `${B}.FundSrc.PropFund.ResrNSurp.CapResr`, `${B}.FundSrc.PropFund.ResrNSurp.StatResr`, `${B}.FundSrc.PropFund.ResrNSurp.OthResr`], 'Balance Sheet — Total reserves and surplus');
      eq('A49', `${B}.FundSrc.LoanFunds.SecrLoan.TotSecrLoan`, [`${B}.FundSrc.LoanFunds.SecrLoan.ForeignCurrLoan`, `${B}.FundSrc.LoanFunds.SecrLoan.RupeeLoan.TotRupeeLoan`], 'Balance Sheet — Total secured loans');
      eq('A49', `${B}.FundSrc.LoanFunds.SecrLoan.RupeeLoan.TotRupeeLoan`, [`${B}.FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmBank`, `${B}.FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmOthrs`], 'Balance Sheet — Total rupee loans (secured)');
      eq('A49', `${B}.FundSrc.LoanFunds.UnsecrLoan.TotUnSecrLoan`, [`${B}.FundSrc.LoanFunds.UnsecrLoan.FrmBank`, `${B}.FundSrc.LoanFunds.UnsecrLoan.FrmOthrs`], 'Balance Sheet — Total unsecured loans');
      eq('A49', `${B}.FundSrc.LoanFunds.TotLoanFund`, [`${B}.FundSrc.LoanFunds.SecrLoan.TotSecrLoan`, `${B}.FundSrc.LoanFunds.UnsecrLoan.TotUnSecrLoan`], 'Balance Sheet — Total loan funds');
      eq('A50', `${B}.FundSrc.TotFundSrc`, [`${B}.FundSrc.PropFund.TotPropFund`, `${B}.FundSrc.LoanFunds.TotLoanFund`, `${B}.FundSrc.DeferredTax`, `${B}.FundSrc.Advances.TotalAdvances`], 'Balance Sheet — Total sources of funds');
      eq('A51', `${B}.FundApply.Investments.TotInvestments`, [`${B}.FundApply.Investments.LongTermInv.TotLongTermInv`, `${B}.FundApply.Investments.TradeInv.TotTradeInv`], 'Balance Sheet — Total investments');
      eq('A52', `${B}.FundApply.CurrAssetLoanAdv.CurrAsset.TotCurrAsset`, [`${B}.FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.TotInventries`, `${B}.FundApply.CurrAssetLoanAdv.CurrAsset.SndryDebtors`, `${B}.FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.TotCashOrBankBal`, `${B}.FundApply.CurrAssetLoanAdv.CurrAsset.OthCurrAsset`], 'Balance Sheet — Total current assets');
      eq('A52', `${B}.FundApply.CurrAssetLoanAdv.TotCurrAssetLoanAdv`, [`${B}.FundApply.CurrAssetLoanAdv.CurrAsset.TotCurrAsset`, `${B}.FundApply.CurrAssetLoanAdv.LoanAdv.TotLoanAdv`], 'Balance Sheet — Total current assets, loans and advances');
      eq('A53', `${B}.FundApply.CurrAssetLoanAdv.NetCurrAsset`, [`${B}.FundApply.CurrAssetLoanAdv.TotCurrAssetLoanAdv`], 'Balance Sheet — Net current assets', [`${B}.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.TotCurrLiabilitiesProvision`]);
      eq('A53', `${B}.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.TotCurrLiabilitiesProvision`, [`${B}.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.TotCurrLiabilities`, `${B}.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.TotProvisions`], 'Balance Sheet — Total current liabilities and provisions');
      eq('A54', `${B}.FundApply.TotFundApply`, [`${B}.FundApply.FixedAsset.TotFixedAsset`, `${B}.FundApply.Investments.TotInvestments`, `${B}.FundApply.CurrAssetLoanAdv.NetCurrAsset`, `${B}.FundApply.MiscAdjust.TotMiscAdjust`], 'Balance Sheet — Total application of funds');
      /* A47 — the two sides must tie */
      if (g(`${B}.FundSrc.TotFundSrc`) !== undefined && g(`${B}.FundApply.TotFundApply`) !== undefined) {
        if (Math.abs(n(`${B}.FundSrc.TotFundSrc`) - n(`${B}.FundApply.TotFundApply`)) > 1) {
          err('A47', `${B}.FundApply.TotFundApply`, `Balance Sheet does not tie: total sources of funds ${n(`${B}.FundSrc.TotFundSrc`)} ≠ total application of funds ${n(`${B}.FundApply.TotFundApply`)}`);
        }
      }
    }

    /* ── C. Manufacturing / Trading account (A56–A70) ────────────────────── */
    if (filled('ManufacturingAccount')) {
      const M = 'ManufacturingAccount';
      eq('A59', `${M}.OpeningInventory.TotalDebtsManfctrngAcc`, [`${M}.OpeningInventory.OpngInvntryTotal`, `${M}.OpeningInventory.DirectExpenses`, `${M}.OpeningInventory.TotalFactoryOverheads`], 'Manufacturing Account — total debits');
      eq('A61', `${M}.CostOfGoodsPrdcd`, [`${M}.OpeningInventory.TotalDebtsManfctrngAcc`], 'Manufacturing Account — cost of goods produced', [`${M}.ClosingStock.ClsngStckTotal`]);
    }
    if (filled('TradingAccount')) {
      const T = 'TradingAccount';
      eq('A63', `${T}.SalesGrossReceiptsTotal`, [`${T}.SaleOfGoods`, `${T}.SaleOfServices`, `${T}.OperatingRevenueTotal`], 'Trading Account — sale of goods / services total');
      eq('A65', `${T}.TotRevenueFrmOperations`, [`${T}.SalesGrossReceiptsTotal`, `${T}.GrossRcptFromProfession`, `${T}.ExciseCustomsVAT.TotExciseCustomsVAT`], 'Trading Account — total revenue from operations');
      eq('A66', `${T}.DirectExpensesTotal`, [`${T}.CarriageInward`, `${T}.PowerAndFuel`, `${T}.DirectExpenses`], 'Trading Account — total direct expenses');
      /* A70 — cost of goods produced must carry over from the manufacturing account */
      if (filled('ManufacturingAccount') && g(`${T}.GoodsCostPrdcdFrmMA`) !== undefined) {
        if (Math.abs(n(`${T}.GoodsCostPrdcdFrmMA`) - n('ManufacturingAccount.CostOfGoodsPrdcd')) > 1) {
          err('A70', `${T}.GoodsCostPrdcdFrmMA`, 'Trading Account — "Cost of goods produced transferred from Manufacturing Account" does not match Sl. No. 3 of the Manufacturing Account');
        }
      }
    }

    /* ── D. Part A – P&L (A71–A133) ──────────────────────────────────────── */
    {
      const P = 'PARTA_PL';
      const OI = `${P}.CreditsToPL.OthIncome`;
      eq('A72', `${OI}.TotOthIncome`, [`${OI}.RentInc`, `${OI}.Comissions`, `${OI}.Dividends`, `${OI}.InterestInc`, `${OI}.ProfitOnSaleFixedAsset`, `${OI}.ProfitOnInvChrSTT`, `${OI}.ProfitOnOthInv`, `${OI}.ProfitOnCurrFluct`, `${OI}.ProfitOnCnvInvntryToCapAsst`, `${OI}.ProfitOnAgriIncome`, `${OI}.MiscOthIncome`], 'P&L — total of other income');
      eq('A73', `${P}.CreditsToPL.TotCreditsToPL`, [`${P}.CreditsToPL.GrossProfitTrnsfFrmTrdAcc`, `${OI}.TotOthIncome`], 'P&L — total of credits to the profit and loss account');
      const EC = `${P}.DebitsToPL.EmployeeComp`;
      eq('A75', `${EC}.TotEmployeeComp`, [`${EC}.SalsWages`, `${EC}.Bonus`, `${EC}.MedExpReimb`, `${EC}.LeaveEncash`, `${EC}.LeaveTravelBenft`, `${EC}.ContToSuperAnnFund`, `${EC}.ContToPF`, `${EC}.ContToGratFund`, `${EC}.ContToOthFund`, `${EC}.OthEmpBenftExpdr`], 'P&L — compensation to employees');
      const IN = `${P}.DebitsToPL.Insurances`;
      eq('A76', `${IN}.TotInsurances`, [`${IN}.MedInsur`, `${IN}.LifeInsur`, `${IN}.KeyManInsur`, `${IN}.OthInsur`], 'P&L — total expenditure on insurance');
      eq('A77', `${P}.DebitsToPL.CommissionExpdrDtls.Total`, [`${P}.DebitsToPL.CommissionExpdrDtls.NonResOtherCompany`, `${P}.DebitsToPL.CommissionExpdrDtls.Others`], 'P&L — total commission');
      eq('A78', `${P}.DebitsToPL.RoyalityDtls.Total`, [`${P}.DebitsToPL.RoyalityDtls.NonResOtherCompany`, `${P}.DebitsToPL.RoyalityDtls.Others`], 'P&L — total royalty');
      eq('A79', `${P}.DebitsToPL.ProfessionalConstDtls.Total`, [`${P}.DebitsToPL.ProfessionalConstDtls.NonResOtherCompany`, `${P}.DebitsToPL.ProfessionalConstDtls.Others`], 'P&L — professional / consultancy fees');
      eq('A84', `${P}.DebitsToPL.InterestExpdrtDtls.InterestExpdr`, [`${P}.DebitsToPL.InterestExpdrtDtls.NonResOtherCompany`, `${P}.DebitsToPL.InterestExpdrtDtls.Others`], 'P&L — total interest');
      const EX = `${P}.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT`;
      eq('A80', `${EX}.TotExciseCustomsVAT`, [`${EX}.UnionExciseDuty`, `${EX}.ServiceTax`, `${EX}.VATorSaleTax`, `${EX}.CentralGoodServiceTax`, `${EX}.StateGoodServiceTax`, `${EX}.IntegratedGoodServiceTax`, `${EX}.UnionTerrGoodServiceTax`, `${EX}.OthDutyTaxCess`], 'P&L — total rates and taxes paid or payable');
      const BD = `${P}.DebitsToPL.BadDebtDtls`;
      eq('A82', `${BD}.BadDebt`, [`${BD}.BadDebtAmtDtlsTotal`, `${BD}.OthersPANNotAvlblDtlTotal`, `${BD}.OthersAmtLt1Lakh`], 'P&L — total bad debts');
      eq('A85', `${P}.DebitsToPL.PBT`, [`${P}.DebitsToPL.PBIDTA`], 'P&L — net profit before taxes', [`${P}.DebitsToPL.InterestExpdrtDtls.InterestExpdr`, `${P}.DebitsToPL.DepreciationAmort`]);
      const TP = `${P}.TaxProvAppr`;
      eq('A86', `${TP}.ProfitAfterTax`, [`${P}.DebitsToPL.PBT`], 'P&L — profit after tax', [`${TP}.ProvForCurrTax`, `${TP}.ProvDefTax`]);
      eq('A87', `${TP}.AmtAvlAppr`, [`${TP}.ProfitAfterTax`, `${TP}.BalBFPrevYr`], 'P&L — amount available for appropriation');
      eq('A88', `${TP}.ProprietorAccBalTrf`, [`${TP}.AmtAvlAppr`], 'P&L — balance carried to the balance sheet in the proprietor’s account', [`${TP}.TrfToReserves`]);

      /* No-books-of-account block (Sl. No. 64) */
      const NB = `${P}.NoBooksOfAccPL`;
      eq('A117', `${NB}.GrossReceipt`, [`${NB}.GrsRcptAccPayeeOrBankMode`, `${NB}.GrsRcptOtherMode`], 'P&L (no books) — gross receipts of business');
      eq('A118', `${NB}.GrossReceiptPrf`, [`${NB}.GrsRcptAccPayeeOrBankModePrf`, `${NB}.GrsRcptOtherModePrf`], 'P&L (no books) — gross receipts of profession');
      eq('A113', `${NB}.NetProfit`, [`${NB}.GrossProfit`], 'P&L (no books) — net profit of business', [`${NB}.Expenses`]);
      eq('A114', `${NB}.NetProfitPrf`, [`${NB}.GrossProfitPrf`], 'P&L (no books) — net profit of profession', [`${NB}.ExpensesPrf`]);
      eq('A119', `${NB}.TotBusinessProfession`, [`${NB}.NetProfit`, `${NB}.NetProfitPrf`], 'P&L (no books) — total profit');
      if (n(`${NB}.GrossProfit`) > n(`${NB}.GrossReceipt`) + 1) err('A115', `${NB}.GrossProfit`, 'P&L (no books) — gross profit of business cannot exceed gross receipts');
      if (n(`${NB}.GrossProfitPrf`) > n(`${NB}.GrossReceiptPrf`) + 1) err('A116', `${NB}.GrossProfitPrf`, 'P&L (no books) — gross profit of profession cannot exceed gross receipts');
      /* Speculative activity block (Sl. No. 65) */
      eq('A120', `${P}.NetIncomeFrmSpecActivity`, [`${P}.GrossProfit`], 'P&L — net income from speculative activity', [`${P}.Expenditure`]);
      if (n(`${P}.GrossProfit`) > n(`${P}.TurnverFrmSpecActivity`) + 1) {
        err('A124', `${P}.GrossProfit`, 'P&L — gross profit from speculative activity (65ii) cannot exceed turnover (65i)');
      }

      /* Presumptive income u/s 44AD (A89–A96, A110, A126, A129) */
      const AD = `${P}.PersumptiveInc44AD`;
      if (filled(AD) || rowsOf(`${P}.NatOfBus44AD`).length > 0) {
        eq('A89', `${AD}.GrsTrnOverOrReceipt`, [`${AD}.GrsTrnOverBank`, `${AD}.GrsTotalTrnOverInCash`, `${AD}.GrsTrnOverAnyOthMode`], 'P&L 61(i) — gross turnover or gross receipts u/s 44AD');
        eq('A90', `${AD}.TotPersumptiveInc44AD`, [`${AD}.PersumptiveInc44AD6Per`, `${AD}.PersumptiveInc44AD8Per`], 'P&L 61(ii) — presumptive income u/s 44AD');
        if (n(`${AD}.PersumptiveInc44AD6Per`) < Math.floor(n(`${AD}.GrsTrnOverBank`) * 0.06) - 1) {
          err('A91', `${AD}.PersumptiveInc44AD6Per`, 'Presumptive income at 61(ii)(A) cannot be less than 6% of the turnover received through banking channels (61(i)(A))');
        }
        if (n(`${AD}.PersumptiveInc44AD8Per`) < Math.floor((n(`${AD}.GrsTotalTrnOverInCash`) + n(`${AD}.GrsTrnOverAnyOthMode`)) * 0.08) - 1) {
          err('A92', `${AD}.PersumptiveInc44AD8Per`, 'Presumptive income at 61(ii)(b) cannot be less than 8% of the turnover received in cash / other modes (61(i)(B)+61(i)(C))');
        }
        if (n(`${AD}.TotPersumptiveInc44AD`) > n(`${AD}.GrsTrnOverOrReceipt`) + 1) {
          err('A93', `${AD}.TotPersumptiveInc44AD`, 'Income disclosed u/s 44AD cannot be more than the gross turnover / gross receipts');
        }
        if (isNRI) err('A110', `${AD}.TotPersumptiveInc44AD`, 'Presumptive business income u/s 44AD cannot be disclosed by a non-resident');
        if (n(`${AD}.GrsTrnOverOrReceipt`) > 30000000 && !liable44AB) {
          err('A129', 'PartA_GEN2.AuditInfo.LiableSec44ABflg', 'Gross receipts u/s 44AD exceed ₹3 crore — a tax audit u/s 44AB is mandatory');
        } else if (n(`${AD}.GrsTrnOverOrReceipt`) > 20000000 && n(`${AD}.GrsTotalTrnOverInCash`) > n(`${AD}.GrsTrnOverOrReceipt`) * 0.05 && !liable44AB) {
          err('A126', 'PartA_GEN2.AuditInfo.LiableSec44ABflg', 'Gross receipts u/s 44AD exceed ₹2 crore and cash receipts exceed 5% of total receipts — a tax audit u/s 44AB is mandatory');
        }
      }
      if (rowsOf(`${P}.NatOfBus44AD`).length > 0 && n(`${AD}.TotPersumptiveInc44AD`) === 0) {
        err('A96', `${AD}.TotPersumptiveInc44AD`, 'A business code u/s 44AD is selected, so income u/s 44AD must be declared');
      }
      if ((n(`${AD}.GrsTrnOverOrReceipt`) > 0 || n(`${AD}.TotPersumptiveInc44AD`) > 0) && rowsOf(`${P}.NatOfBus44AD`).length === 0) {
        err('A97', `${P}.NatOfBus44AD`, 'Nature of business must be filled when 61(i) and/or 61(ii) (44AD) is greater than zero');
      }

      /* Presumptive income u/s 44ADA (A95, A98, A99, A102, A121, A125, A127, A128) */
      const ADA = `${P}.PersumptiveInc44ADA`;
      if (filled(ADA) || rowsOf(`${P}.NatOfBus44ADA`).length > 0) {
        eq('A127', `${ADA}.GrsReceipt`, [`${ADA}.GrsTrnOverBank44ADA`, `${ADA}.GrsTotalTrnOverInCash44ADA`, `${ADA}.GrsTrnOverAnyOthMode44ADA`], 'P&L 62(i) — gross receipts u/s 44ADA');
        if (n(`${ADA}.TotPersumptiveInc44ADA`) < Math.floor(n(`${ADA}.GrsReceipt`) * 0.5) - 1) {
          err('A95', `${ADA}.TotPersumptiveInc44ADA`, 'Presumptive income at 62(ii) cannot be less than 50% of the gross receipts at 62(i)');
        }
        if (n(`${ADA}.TotPersumptiveInc44ADA`) > n(`${ADA}.GrsReceipt`) + 1) {
          err('A102', `${ADA}.TotPersumptiveInc44ADA`, 'Income u/s 44ADA cannot be more than the gross receipts');
        }
        if (isHUF) err('A121', `${ADA}.TotPersumptiveInc44ADA`, 'A HUF is not eligible to disclose presumptive income u/s 44ADA');
        if (n(`${ADA}.GrsReceipt`) > 7500000 && !liable44AB) {
          err('A128', 'PartA_GEN2.AuditInfo.LiableSec44ABflg', 'Gross receipts u/s 44ADA exceed ₹75,00,000 — a tax audit u/s 44AB is mandatory');
        } else if (n(`${ADA}.GrsReceipt`) > 5000000 && n(`${ADA}.GrsTotalTrnOverInCash44ADA`) > n(`${ADA}.GrsReceipt`) * 0.05 && !liable44AB) {
          err('A125', 'PartA_GEN2.AuditInfo.LiableSec44ABflg', 'Gross receipts u/s 44ADA exceed ₹50,00,000 and cash receipts exceed 5% of total receipts — a tax audit u/s 44AB is mandatory');
        }
      }
      if (rowsOf(`${P}.NatOfBus44ADA`).length > 0 && n(`${ADA}.TotPersumptiveInc44ADA`) === 0) {
        err('A98', `${ADA}.TotPersumptiveInc44ADA`, 'A business code u/s 44ADA is selected, so income u/s 44ADA must be declared');
      }
      if ((n(`${ADA}.GrsReceipt`) > 0 || n(`${ADA}.TotPersumptiveInc44ADA`) > 0) && rowsOf(`${P}.NatOfBus44ADA`).length === 0) {
        err('A99', `${P}.NatOfBus44ADA`, 'Nature of profession must be filled when 62(i) and/or 62(ii) (44ADA) is greater than zero');
      }

      /* Presumptive income u/s 44AE (A100, A101, A106–A109, A123) */
      const goods = rowsOf(`${P}.GoodsDtlsUs44AE`);
      if (n(`${P}.TotalPrsumptvIncUs44EGoods`) > 0 && goods.length === 0) {
        err('A106', `${P}.GoodsDtlsUs44AE`, 'Total presumptive income from goods carriage u/s 44AE is greater than zero — table 63(i) must be filled');
      }
      if (goods.length > 0) {
        const sumInc = goods.reduce<number>((a, r) => a + num(at(r, 'PresumptiveIncome')), 0);
        if (g(`${P}.TotalPrsumptvIncUs44EGoods`) !== undefined && Math.abs(n(`${P}.TotalPrsumptvIncUs44EGoods`) - sumInc) > 1) {
          err('A107', `${P}.TotalPrsumptvIncUs44EGoods`, `Total presumptive income u/s 44AE (${n(`${P}.TotalPrsumptvIncUs44EGoods`)}) does not equal the sum of column 5 of table 63(i) (${sumInc})`);
        }
        const sumMonths = goods.reduce<number>((a, r) => a + num(at(r, 'HoldingPeriod')), 0);
        if (sumMonths > 120) {
          err('A108', `${P}.GoodsDtlsUs44AE`, `Total number of months in table 63(i) (${sumMonths}) cannot exceed 120`);
        }
        const seen: Record<string, boolean> = {};
        goods.forEach((r, i) => {
          const reg = str(at(r, 'RegNumberGoodsCarriage')).toUpperCase();
          if (reg) {
            if (seen[reg]) err('A123', `${P}.GoodsDtlsUs44AE[${i}].RegNumberGoodsCarriage`, `Registration number "${reg}" is repeated in the 44AE table`);
            seen[reg] = true;
          }
          const ton = num(at(r, 'TonnageCapacity'));
          const months = num(at(r, 'HoldingPeriod'));
          const inc = num(at(r, 'PresumptiveIncome'));
          if (ton > 0 && ton <= 12 && inc < months * 7500) {
            err('A109', `${P}.GoodsDtlsUs44AE[${i}].PresumptiveIncome`, `Goods carriage of ${ton} MT: presumptive income (${inc}) cannot be less than ₹7,500 × ${months} months = ${months * 7500}`);
          }
        });
        if (rowsOf(`${P}.NatOfBus44AE`).length === 0) {
          err('A101', `${P}.NatOfBus44AE`, 'Nature of business must be filled when presumptive income u/s 44AE at 63(ii) is greater than zero');
        }
      }
      if (rowsOf(`${P}.NatOfBus44AE`).length > 0 && n(`${P}.TotalPrsumptvIncUs44EGoods`) === 0) {
        err('A100', `${P}.TotalPrsumptvIncUs44EGoods`, 'A business code u/s 44AE is selected, so income u/s 44AE must be declared');
      }
    }

    /* ── E. Schedule OI (A134–A145) ──────────────────────────────────────── */
    if (filled('PARTA_OI')) {
      const O = 'PARTA_OI';
      const d36 = `${O}.AmtDisallUs36`;
      eq('A138', `${d36}.TotAmtDisallUs36`, [`${d36}.StkInsurPrem`, `${d36}.EmpHealthInsurPrem`, `${d36}.EmpBonusCommSum`, `${d36}.IntOnBorrCap`, `${d36}.ZeroCoupBondDisc`, `${d36}.RecogPFContribAmt`, `${d36}.AppSuperAnnFundAmt`, `${d36}.PensionSchemeSec80CCD`, `${d36}.AppGratFundAmt`, `${d36}.OthFundAmt`, `${d36}.EmpContributionCredits`, `${d36}.BadDebtDoubtAmt`, `${d36}.BadDebtDoubtProvn`, `${d36}.SpecResrvTranfr`, `${d36}.FamPlanPromoExp`, `${d36}.SecuritiesPaidAmt`, `${d36}.MrktLossOthExpLossICDS`, `${d36}.OthDisallowances`], 'Schedule OI — total amount disallowable u/s 36');
      const d37 = `${O}.AmtDisallUs37`;
      eq('A145', `${d37}.TotAmtDisallUs37`, [`${d37}.CapitalNatureExp`, `${d37}.PersonalExp`, `${d37}.BusOrProfessnExp`, `${d37}.PoliticPartyExp`, `${d37}.LawVoilatPenalExp`, `${d37}.OthPenalFineExp`, `${d37}.OffenceExp`, `${d37}.ContigentLiability`, `${d37}.OthAmtNotAllowUs37`], 'Schedule OI — total amount disallowable u/s 37');
      const d40 = `${O}.AmtDisallUs40`;
      eq('A139', `${d40}.TotAmtDisallUs40`, [`${d40}.NonCompChapXVIIBAmt`, `${d40}.NonComp40aiiChapXVIIBAmt`, `${d40}.NonComp40aibChapXVIIBAmt`, `${d40}.NonComp40aiiiChapXVIIBAmt`, `${d40}.TaxAmtOnProfits`, `${d40}.WTAmt`, `${d40}.RolyatyOrServiceFee`, `${d40}.IntSalBonPartner`, `${d40}.OthDisallow`], 'Schedule OI — total amount disallowable u/s 40');
      const d40A = `${O}.AmtDisallUs40A`;
      eq('A140', `${d40A}.TotAmtDisallUs40A`, [`${d40A}.AmtPaidUs40A2b`, `${d40A}.AmtGT20kCash`, `${d40A}.ProvPmtGrat`, `${d40A}.ContToSetupTrust`, `${d40A}.OthDisallow`], 'Schedule OI — total amount disallowable u/s 40A');
      const b43 = `${O}.AmtDisallUs43BPyNowAll.AmtUs43B`;
      eq('A141', `${b43}.TotAmtUs43b`, [`${b43}.TaxDutyCesAmt`, `${b43}.ContToEmpPFSFGF`, `${b43}.EmpBonusComm`, `${b43}.IntPayaleToFI`, `${b43}.SumPayaleLoanBrToFinComp`, `${b43}.IntPayaleToFISchBank`, `${b43}.LeaveEncashPayable`], 'Schedule OI — total amount allowable u/s 43B');
      const c43 = `${O}.AmtDisall43B.AmtUs43B`;
      eq('A142', `${c43}.TotAmtUs43b`, [`${c43}.TaxDutyCesAmt`, `${c43}.ContToEmpPFSFGF`, `${c43}.EmpBonusComm`, `${c43}.IntPayaleToFI`, `${c43}.SumPayaleLoanBrToFinComp`, `${c43}.IntPayaleToFISchBank`, `${c43}.LeaveEncashPayable`], 'Schedule OI — total amount disallowable u/s 43B');
      const noc = `${O}.NoCredToPLAmt`;
      eq('A137', `${noc}.TotNoCredToPLAmt`, [`${noc}.Section28Items`, `${noc}.ProformaCreditsDue`, `${noc}.PrevYrEscalClaim`, `${noc}.OthItemInc`, `${noc}.CapReceipt`], 'Schedule OI — total of amounts not credited to the profit and loss account');
      /* A914 — the 92CE(2A) option pulls in Schedule TPSA */
      if (s(`${O}.ScheduleTPSAFlg`) === 'Y') {
        need('A914', 'ScheduleTPSA', 'Option u/s 92CE(2A) is exercised in Schedule OI — Schedule TPSA must be filled');
      }
    }

    /* ── F. Schedule BP (A231–A261) ──────────────────────────────────────── */
    {
      const BP = 'ITR3ScheduleBP';
      const A = `${BP}.BusinessIncOthThanSpec`;
      const ex = `${A}.ExpDebToPLOthHeadDtls`;
      eq('A232', `${A}.TotExpDebPL`, [`${ex}.Salary`, `${ex}.HouseProperty`, `${ex}.CapitalGains`, `${ex}.OtherSources`, `${ex}.Us115BBF`, `${ex}.Us115BBG`, `${ex}.115BBH`, `${A}.ExpDebToPLExemptInc`, `${A}.ExpDebToPLExemptIncDisAllwUs14A`], 'Schedule BP — total expenses debited to P&L relating to other heads / exempt income (A9)');
      eq('A233', `${A}.AdjustedPLOthThanSpecBus`, [`${A}.BalancePLOthThanSpecBus`, `${A}.TotExpDebPL`], 'Schedule BP — adjusted profit or loss (A10)');
      eq('A234', `${A}.DepreciationAllowITAct32.TotDeprAllowITAct`, [`${A}.DepreciationAllowITAct32.DepreciationAllowUs32_1_ii`, `${A}.DepreciationAllowITAct32.DepreciationAllowUs32_1_i`], 'Schedule BP — depreciation allowable under the Income-tax Act (A12iii)');
      eq('A235', `${A}.AdjustPLAfterDeprOthSpecInc`, [`${A}.AdjustedPLOthThanSpecBus`, `${A}.DepreciationDebPLCosAct`], 'Schedule BP — profit after depreciation adjustment (A13)', [`${A}.DepreciationAllowITAct32.TotDeprAllowITAct`]);
      eq('A237', `${A}.TotDeductionAmts`, [`${A}.DeductUs32_1_iii`, `${A}.DebPLUs35ExcessAmt`, `${A}.AmtDisallUs40NowAllow`, `${A}.AmtDisallUs43BNowAllow`, `${A}.AnyOthAmtAllDeduct`, `${A}.DecProfIncLossAccICDSAdj`], 'Schedule BP — total deductions (A33)');
      eq('A247', `${A}.PLAftAdjDedBusOthThanSpec`, [`${A}.AdjustPLAfterDeprOthSpecInc`, `${A}.TotAfterAddToPLDeprOthSpecInc`], 'Schedule BP — income after adjustments (A34)', [`${A}.TotDeductionAmts`]);
      const dp = `${A}.DeemedProfitBusUs`;
      eq('A248', `${dp}.TotDeemedProfitBusUs`, [`${dp}.Section44AD`, `${dp}.Section44ADA`, `${dp}.Section44AE`, `${dp}.Section44B`, `${dp}.Section44BB`, `${dp}.Section44BBA`, `${dp}.Section44BBC`, `${dp}.Section44DA`], 'Schedule BP — total deemed profit u/s 44AD/44ADA/44AE etc. (A35viii)');
      eq('A249', `${A}.NetPLAftAdjBusOthThanSpec`, [`${A}.PLAftAdjDedBusOthThanSpec`, `${dp}.TotDeemedProfitBusUs`], 'Schedule BP — net profit or loss from business other than speculative / specified (A36)');
      eq('A250', `${A}.NetPLBusOthThanSpec7A7B7C`, [`${A}.ChrgblIncUndrRule7`, `${A}.DeemedChrgblIncUndrRule7A`, `${A}.DeemedChrgblIncUndrRule7B1`, `${A}.DeemedChrgblIncUndrRule7B1A`, `${A}.DeemedChrgblIncUndrRule8`, `${A}.IncomeOtherThanRule`], 'Schedule BP — income after applying rules 7, 7A, 7B and 8 (A37)');
      eq('A258', `${A}.IncCredPL.TotExempIncPL`, [`${A}.IncCredPL.FirmShareInc`, `${A}.IncCredPL.AOPBOISharInc`, `${A}.IncCredPL.OthExempInc`], 'Schedule BP — total exempt income credited to P&L (A5d)');
      eq('A251', `${BP}.SpecBusinessInc.AdjustedPLFrmSpecuBus`, [`${BP}.SpecBusinessInc.NetPLFrmSpecBus`, `${BP}.SpecBusinessInc.AdditionUs28to44DA`], 'Schedule BP — adjusted profit from speculative business (B42)', [`${BP}.SpecBusinessInc.DeductUs28to44DA`]);
      eq('A252', `${BP}.SpecifiedBusinessInc.ProfitLossSpecifiedBusiness`, [`${BP}.SpecifiedBusinessInc.NetPLFrmSpecifiedBus`, `${BP}.SpecifiedBusinessInc.AddSec28to44DA`], 'Schedule BP — profit or loss from specified business (C47)', [`${BP}.SpecifiedBusinessInc.DedSec28to44DAOTDedSec35AD`]);
      eq('A254', `${BP}.IncChrgUnHdProftGain`, [`${A}.NetPLBusOthThanSpec7A7B7C`, `${BP}.SpecBusinessInc.AdjustedPLFrmSpecuBus`, `${BP}.SpecifiedBusinessInc.PLFrmSpecifiedBus`], 'Schedule BP — income chargeable under "Profits and gains from business or profession" (D)');
      eq('A261', `${BP}.BusSetoffCurrYr.LossRemainSetOffOnBus`, [`${BP}.BusSetoffCurrYr.LossSetOffOnBusLoss`], 'Schedule BP — loss remaining after set-off (Ev)', [`${BP}.BusSetoffCurrYr.TotLossSetOffOnBus`]);
      /* A103/A104 — presumptive income must carry over from the P&L */
      if (g(`${dp}.Section44AD`) !== undefined && Math.abs(n(`${dp}.Section44AD`) - n('PARTA_PL.PersumptiveInc44AD.TotPersumptiveInc44AD')) > 1) {
        err('A103', `${dp}.Section44AD`, 'Schedule BP 35(i) "Section 44AD" does not match the presumptive income u/s 44AD in Schedule P&L (61(ii))');
      }
      if (g(`${dp}.Section44ADA`) !== undefined && Math.abs(n(`${dp}.Section44ADA`) - n('PARTA_PL.PersumptiveInc44ADA.TotPersumptiveInc44ADA')) > 1) {
        err('A104', `${dp}.Section44ADA`, 'Schedule BP 35(ii) "Section 44ADA" does not match the presumptive income u/s 44ADA in Schedule P&L (62(ii))');
      }
      /* A227 — depreciation must agree with Schedule DEP */
      if (filled('ScheduleDEP') && g(`${A}.DepreciationAllowITAct32.TotDeprAllowITAct`) !== undefined) {
        if (Math.abs(n(`${A}.DepreciationAllowITAct32.TotDeprAllowITAct`) - n('ScheduleDEP.SummaryFromDeprSch.TotalDepreciation')) > 1) {
          err('A227', `${A}.DepreciationAllowITAct32.TotDeprAllowITAct`, 'Depreciation allowable u/s 32(1)(ii)/(iia) in Schedule BP does not equal Sl. No. 6 of Schedule DEP');
        }
      }
      /* A272 — 35AD cannot be claimed under the new regime */
      if (newRegime && filled(`${BP}.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls`)) {
        err('A272', `${BP}.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls`, 'The new tax regime is opted, so a deduction u/s 35AD cannot be claimed in Schedule BP');
      }
      /* A264 — specified-business income needs its nature */
      if (n(`${BP}.SpecifiedBusinessInc.PLFrmSpecifiedBus`) !== 0 && !filled(`${BP}.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls`) && !filled(`${BP}.SpecifiedBusinessInc.NatureOfSpecifiedBusiness`)) {
        warn('A264', `${BP}.SpecifiedBusinessInc`, 'Income / loss from specified business is entered — the nature of the specified business should be mentioned');
      }
    }

    /* ── G. Head schedules pulled in by Part B-TI (A146, A201, A225, A954, A931) ── */
    if (n(`${TI}.Salaries`) !== 0) need('A146', 'ScheduleS', 'Income under the head Salary is disclosed in Part B-TI — Schedule S is mandatory');
    if (n(`${TI}.IncomeFromHP`) !== 0) need('A201', 'ScheduleHP', 'Income under the head House Property is disclosed in Part B-TI — Schedule HP is mandatory');
    if (n(`${TI}.ProfBusGain.ProfGainNoSpecBus`) !== 0) need('A225', 'ITR3ScheduleBP', 'Income under the head Business / Profession is disclosed in Part B-TI — Schedule BP is mandatory');
    if (n(`${TI}.DeductionsUnder10Aor10AA`) > 0) need('A954', 'Schedule10AA', 'A deduction u/s 10AA is claimed in Part B-TI — Schedule 10AA must be filled');
    if (n(`${TI}.TotalIncome`) > 10000000) need('A931', 'ScheduleAL', 'Total income exceeds ₹1 crore — Schedule AL (assets and liabilities) is required to be filled');
    if (isHUF) {
      if (filled('ScheduleS')) err('A182', 'ScheduleS', 'Schedule Salary is not applicable when the status is HUF');
      if (filled('ScheduleTDS1')) err('A1015', 'ScheduleTDS1', 'Schedule TDS-1 (TDS on salary) is not applicable when the status is HUF');
      if (n('PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section89') > 0) err('A1', 'PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section89', 'A HUF cannot claim relief u/s 89');
    }
    if ((isHUF || isNRI) && n('ScheduleS.Increliefus89A') > 0) {
      err('A4', 'ScheduleS.Increliefus89A', 'A HUF or a non-resident individual cannot claim relief from taxation u/s 89A');
    }

    /* ── H. Schedule S totals (A147–A152, A177, A178) ────────────────────── */
    if (filled('ScheduleS')) {
      const S1 = 'ScheduleS';
      eq('A150', `${S1}.NetSalary`, [`${S1}.TotalGrossSalary`], 'Schedule S — net salary (Sl. No. 4 = 2 − 2a − 3)', [`${S1}.Increliefus89A`, `${S1}.AllwncExtentExemptUs10`]);
      eq('A151', `${S1}.DeductionUS16`, [`${S1}.DeductionUnderSection16ia`, `${S1}.EntertainmntalwncUs16ii`, `${S1}.ProfessionalTaxUs16iii`], 'Schedule S — deductions u/s 16 (5a+5b+5c)');
      eq('A152', `${S1}.TotIncUnderHeadSalaries`, [`${S1}.NetSalary`], 'Schedule S — income chargeable under the head Salaries (Sl. No. 6 = 4 − 5)', [`${S1}.DeductionUS16`]);
      if (newRegime && n(`${S1}.EntertainmntalwncUs16ii`) > 0) {
        err('A177', `${S1}.EntertainmntalwncUs16ii`, 'The new tax regime is opted — entertainment allowance u/s 16(ii) cannot be claimed');
      }
      if (newRegime && n(`${S1}.ProfessionalTaxUs16iii`) > 0) {
        err('A178', `${S1}.ProfessionalTaxUs16iii`, 'The new tax regime is opted — professional tax u/s 16(iii) cannot be claimed');
      }
      if (n(`${S1}.ProfessionalTaxUs16iii`) > 5000) {
        err('A160', `${S1}.ProfessionalTaxUs16iii`, 'Professional tax u/s 16(iii) will be allowed only to the extent of ₹5,000');
      }
      /* A1021/A1022 — TDS on salary presupposes salary income */
      const tdsSal = n('ScheduleTDS1.TotalTDSonSalaries');
      if (tdsSal > 0 && n(`${S1}.TotalGrossSalary`) <= 0) {
        err('A1021', `${S1}.TotalGrossSalary`, 'TDS is deducted on salary in Schedule TDS-1, so total gross salary in Schedule S must be more than zero');
      }
      if (tdsSal > 0 && n(`${S1}.TotalGrossSalary`) < tdsSal) {
        err('A1022', `${S1}.TotalGrossSalary`, 'Total gross salary in Schedule S cannot be less than the TDS deducted in Schedule TDS-1');
      }
    }

    /* ── I. Capital gains / VDA cross-checks (A401, A402, A405, A406, A646) ── */
    if (rowsOf('Schedule112A.Schedule112ADtls').length > 0 && rowsOf('Schedule115AD.Schedule115ADDtls').length > 0) {
      err('A401', 'Schedule112A', 'Schedule 112A and Schedule 115AD(1)(b)(iii) proviso cannot both be filled — only one of them is allowed');
    }
    if (filled('ScheduleCGFor23')) {
      eq('A405', 'ScheduleCGFor23.TotScheduleCGFor23', ['ScheduleCGFor23.SumOfCGIncm', 'ScheduleCGFor23.IncmFromVDATrnsf'], 'Schedule CG — income chargeable under "Capital gains" (C3)');
      if (filled('ScheduleVDA') && g('ScheduleCGFor23.IncmFromVDATrnsf') !== undefined) {
        if (Math.abs(n('ScheduleCGFor23.IncmFromVDATrnsf') - n('ScheduleVDA.TotIncCapGain')) > 1) {
          err('A406', 'ScheduleCGFor23.IncmFromVDATrnsf', 'Schedule CG C2 (income from transfer of virtual digital assets) does not equal Sl. No. B of Schedule VDA');
        }
      }
    }
    if (filled('ScheduleVDA')) {
      const vrows = rowsOf('ScheduleVDA.ScheduleVDADtls');
      vrows.forEach((r, i) => {
        const inc = num(at(r, 'IncomeFromVDA'));
        const expected = num(at(r, 'ConsidReceived')) - num(at(r, 'AcquisitionCost'));
        if (at(r, 'IncomeFromVDA') !== undefined && Math.abs(inc - Math.max(expected, 0)) > 1 && Math.abs(inc - expected) > 1) {
          err('A646', `ScheduleVDA.ScheduleVDADtls[${i}].IncomeFromVDA`, `Row ${i + 1}: income from transfer of VDA (${inc}) must equal consideration received minus cost of acquisition (${expected})`);
        }
      });
      const bizTot = vrows.filter((r) => str(at(r, 'HeadUndIncTaxed')) === 'BI').reduce<number>((a, r) => a + Math.max(num(at(r, 'IncomeFromVDA')), 0), 0);
      const cgTot = vrows.filter((r) => str(at(r, 'HeadUndIncTaxed')) === 'CG').reduce<number>((a, r) => a + Math.max(num(at(r, 'IncomeFromVDA')), 0), 0);
      if (g('ScheduleVDA.TotIncBusiness') !== undefined && Math.abs(n('ScheduleVDA.TotIncBusiness') - bizTot) > 1) {
        err('A647', 'ScheduleVDA.TotIncBusiness', `Schedule VDA total A (business income) ${n('ScheduleVDA.TotIncBusiness')} does not equal the sum of positive incomes taxed as business income (${bizTot})`);
      }
      if (g('ScheduleVDA.TotIncCapGain') !== undefined && Math.abs(n('ScheduleVDA.TotIncCapGain') - cgTot) > 1) {
        err('A648', 'ScheduleVDA.TotIncCapGain', `Schedule VDA total B (capital gains) ${n('ScheduleVDA.TotIncCapGain')} does not equal the sum of positive incomes taxed as capital gains (${cgTot})`);
      }
    }

    /* ── J. Chapter VI-A (A651–A795) ─────────────────────────────────────── */
    if (filled('ScheduleVIA')) {
      eq('A743', `${VIA}.TotalChapVIADeductions`, [`${VIA}.TotPartBchapterVIA`, `${VIA}.TotPartCchapterVIA`, `${VIA}.TotPartCAandDchapterVIA`], 'Schedule VI-A — total Chapter VI-A deductions');
      const link: Array<[string, string, string, string, string]> = [
        ['Section80G', 'Schedule80G', 'Schedule80G.TotalEligibleDonationsUs80G', 'A722', '80G'],
        ['Section80GGA', 'Schedule80GGA', 'Schedule80GGA.TotalEligibleDonationAmt80GGA', 'A750', '80GGA'],
        ['Section80GGC', 'Schedule80GGC', 'Schedule80GGC.TotalEligibleDonationAmt80GGC', 'A750', '80GGC'],
        ['Section80D', 'Schedule80D', 'Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn', 'A723', '80D'],
        ['Section80C', 'Schedule80C', 'Schedule80C.TotalAmt', 'A795', '80C'],
        ['Section80E', 'Schedule80E', 'Schedule80E.TotalInterest80E', 'A780', '80E'],
        ['Section80EE', 'Schedule80EE', 'Schedule80EE.TotalInterest80EE', 'A781', '80EE'],
        ['Section80EEA', 'Schedule80EEA', 'Schedule80EEA.TotalInterest80EEA', 'A783', '80EEA'],
        ['Section80EEB', 'Schedule80EEB', 'Schedule80EEB.TotalInterest80EEB', 'A783', '80EEB'],
        ['Section80DD', 'Schedule80DD', 'Schedule80DD.DeductionAmount', 'A757', '80DD'],
        ['Section80U', 'Schedule80U', 'Schedule80U.DeductionAmount', 'A758', '80U'],
        ['Section80IA', 'Schedule80_IA', 'Schedule80_IA.TotSchedule80_IA', 'A651', '80-IA'],
        ['Section80IB', 'Schedule80_IB', 'Schedule80_IB.TotSchedule80_IB', 'A655', '80-IB'],
        ['Section80IC', 'Schedule80_IC', 'Schedule80_IC.TotSchedule80_IC', 'A656', '80-IC / 80-IE'],
      ];
      for (const [field, sched, totPath, rule, label] of link) {
        const claimed = n(`${VIA}.${field}`);
        if (claimed <= 0) continue;
        if (!filled(sched)) {
          err(rule, sched, `A deduction u/s ${label} of ₹${claimed} is claimed in Schedule VI-A — the details must be provided in ${sched}`);
        } else if (g(totPath) !== undefined && claimed > n(totPath) + 1) {
          err(rule, `${VIA}.${field}`, `Deduction u/s ${label} claimed in Schedule VI-A (${claimed}) is more than the eligible amount as per ${sched} (${n(totPath)})`);
        }
      }
      if (n(`${VIA}.Section80CCD1B`) > 50000) {
        err('A675', `${VIA}.Section80CCD1B`, 'The maximum deduction allowable u/s 80CCD(1B) is ₹50,000');
      }
      if (isHUF) {
        if (n(`${VIA}.Section80E`) > 0) err('A664', `${VIA}.Section80E`, 'A deduction u/s 80E cannot be claimed by a HUF');
        if (n(`${VIA}.Section80EE`) > 0) err('A665', `${VIA}.Section80EE`, 'A deduction u/s 80EE cannot be claimed by a HUF');
        if (n(`${VIA}.Section80U`) > 0) err('A673', `${VIA}.Section80U`, 'A deduction u/s 80U cannot be claimed by a HUF');
      }
      if (newRegime && n(`${VIA}.Section80GGC`) > 0) {
        warn('A752', `${VIA}.Section80GGC`, 'The new tax regime is opted — a deduction u/s 80GGC is generally not available');
      }
      if (g(`${TI}.DeductionsUndSchVIADtl.TotDeductUndSchVIA`) !== undefined && n(`${TI}.DeductionsUndSchVIADtl.TotDeductUndSchVIA`) > n(`${VIA}.TotalChapVIADeductions`) + 1) {
        err('A946', `${TI}.DeductionsUndSchVIADtl.TotDeductUndSchVIA`, 'Chapter VI-A deductions in Part B-TI exceed the total allowed in Schedule VI-A');
      }
    }
    if (newRegime && filled('Schedule10AA')) {
      err('A772', 'Schedule10AA', 'Schedule 10AA must be blank when the new tax regime is opted');
    }
    if (filled('Schedule10AA')) {
      const und: Array<[unknown[], string]> = [];
      collectArrays(itr3, 'Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy'.split('.'), ROOT, und);
      const totRows = und.reduce<number>((a, [arr]) => a + arr.reduce<number>((b, r) => b + num(at(r, 'DedUs10Sub')), 0), 0);
      if (g('Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub') !== undefined && Math.abs(n('Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub') - totRows) > 1) {
        err('A700', 'Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub', 'Schedule 10AA — total deduction u/s 10AA does not equal the sum of the "Amount of deduction" column');
      }
    }
    /* A898 — large agricultural income needs the land details */
    if (filled('ScheduleEI') && n('ScheduleEI.NetAgriIncOrOthrIncRule7') > 500000 && rowsOf('ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls').length === 0) {
      err('A898', 'ScheduleEI.ExcNetAgriInc', 'Net agricultural income for the year exceeds ₹5 lakh — the details of each agricultural land must be filled');
    }
    /* A916 / A926 — FSI and TR are not available to a non-resident */
    if (isNRI && filled('ScheduleFSI')) err('A916', 'ScheduleFSI', 'Schedule FSI is not applicable when the residential status is non-resident');
    if (isNRI && filled('ScheduleTR1')) err('A926', 'ScheduleTR1', 'Schedule TR is not applicable when the residential status is non-resident');
    /* A872 — Schedule IF total */
    if (filled('ScheduleIF')) {
      const sumShare = rowsOf('ScheduleIF.PartnerFirmDetails').reduce<number>((a, r) => a + num(at(r, 'ProfitShareAmt')), 0);
      if (g('ScheduleIF.TotalProfitShareAmt') !== undefined && Math.abs(n('ScheduleIF.TotalProfitShareAmt') - sumShare) > 1) {
        err('A872', 'ScheduleIF.TotalProfitShareAmt', 'Schedule IF — the total "amount of share in the profit" does not equal the sum of the individual rows');
      }
    }
    /* A930 — Schedule 5A apportionment total */
    if (filled('Schedule5A2014')) {
      for (const col of ['IncRecvdUndHead', 'AmtApprndOfSpouse', 'AmtTDSDeducted', 'TDSApprndOfSpouse']) {
        eq('A930', `Schedule5A2014.TotalHeadIncome.${col}`, [`Schedule5A2014.HPHeadIncome.${col}`, `Schedule5A2014.BusHeadIncome.${col}`, `Schedule5A2014.CapGainHeadIncome.${col}`, `Schedule5A2014.OtherSourcesHeadIncome.${col}`], `Schedule 5A — total of "${humanize(col)}"`);
      }
    }

    /* ── K. Part B-TI arithmetic (A946–A990) ─────────────────────────────── */
    {
      eq('A982', `${TI}.ProfBusGain.TotProfBusGain`, [`${TI}.ProfBusGain.ProfGainNoSpecBus`, `${TI}.ProfBusGain.ProfGainSpecBus`, `${TI}.ProfBusGain.ProfGainSpecifiedBus`, `${TI}.ProfBusGain.ProfIncome115BBF`], 'Part B-TI — total profits and gains from business or profession');
      eq('A990', `${TI}.CapGain.ShortTerm.TotalShortTerm`, [`${TI}.CapGain.ShortTerm.ShortTerm15Per`, `${TI}.CapGain.ShortTerm.ShortTerm20Per`, `${TI}.CapGain.ShortTerm.ShortTerm30Per`, `${TI}.CapGain.ShortTerm.ShortTermAppRate`, `${TI}.CapGain.ShortTerm.ShortTermSplRateDTAA`], 'Part B-TI — total short-term capital gains');
      eq('A990', `${TI}.CapGain.LongTerm.TotalLongTerm`, [`${TI}.CapGain.LongTerm.LongTerm10Per`, `${TI}.CapGain.LongTerm.LongTerm12_5Per`, `${TI}.CapGain.LongTerm.LongTerm20Per`, `${TI}.CapGain.LongTerm.LongTermSplRateDTAA`], 'Part B-TI — total long-term capital gains');
      eq('A990', `${TI}.CapGain.ShortTermLongTermTotal`, [`${TI}.CapGain.ShortTerm.TotalShortTerm`, `${TI}.CapGain.LongTerm.TotalLongTerm`], 'Part B-TI — sum of short-term and long-term capital gains');
      eq('A990', `${TI}.CapGain.TotalCapGains`, [`${TI}.CapGain.ShortTermLongTermTotal`, `${TI}.CapGain.CapGains30Per115BBH`], 'Part B-TI — total capital gains');
      eq('A981', `${TI}.IncFromOS.TotIncFromOS`, [`${TI}.IncFromOS.OtherSrcThanOwnRaceHorse`, `${TI}.IncFromOS.IncChargblSplRate`, `${TI}.IncFromOS.FromOwnRaceHorse`], 'Part B-TI — total income from other sources');
      eq('A946', `${TI}.TotalTI`, [`${TI}.Salaries`, `${TI}.IncomeFromHP`, `${TI}.ProfBusGain.TotProfBusGain`, `${TI}.CapGain.TotalCapGains`, `${TI}.IncFromOS.TotIncFromOS`], 'Part B-TI — total of head-wise income');
      eq('A975', `${TI}.BalanceAfterSetoffLosses`, [`${TI}.TotalTI`], 'Part B-TI — balance after set-off of current year losses', [`${TI}.CurrentYearLoss`]);
      eq('A953', `${TI}.GrossTotalIncome`, [`${TI}.BalanceAfterSetoffLosses`], 'Part B-TI — gross total income', [`${TI}.BroughtFwdLossesSetoff`]);
      eq('A974', `${TI}.DeductionsUndSchVIADtl.TotDeductUndSchVIA`, [`${TI}.DeductionsUndSchVIADtl.PartBchapterVIA`, `${TI}.DeductionsUndSchVIADtl.PartCchapterVIA`], 'Part B-TI — total deductions under Chapter VI-A (12c)');
      eq('A956', `${TI}.TotalIncome`, [`${TI}.GrossTotalIncome`], 'Part B-TI — total income', [`${TI}.DeductionsUndSchVIADtl.TotDeductUndSchVIA`, `${TI}.DeductionsUnder10Aor10AA`]);
      eq('A977', `${TI}.AggregateIncome`, [`${TI}.TotalIncome`, `${TI}.NetAgricultureIncomeOrOtherIncomeForRate`], 'Part B-TI — aggregate income (17 = 14 − 15 + 16)', [`${TI}.IncChargeableTaxSplRates`]);
      /* A972 — net agricultural income for rate purposes must come from Schedule EI */
      if (filled('ScheduleEI') && g(`${TI}.NetAgricultureIncomeOrOtherIncomeForRate`) !== undefined) {
        if (Math.abs(n(`${TI}.NetAgricultureIncomeOrOtherIncomeForRate`) - n('ScheduleEI.NetAgriIncOrOthrIncRule7')) > 1) {
          err('A972', `${TI}.NetAgricultureIncomeOrOtherIncomeForRate`, 'Part B-TI — net agricultural income for rate purposes does not equal Sl. No. 2 of Schedule EI');
        }
      }
      /* A976 — deemed income u/s 115JC must come from Schedule AMT */
      if (filled('ScheduleAMT') && g(`${TI}.DeemedIncomeUs115JC`) !== undefined) {
        if (Math.abs(n(`${TI}.DeemedIncomeUs115JC`) - n('ScheduleAMT.AdjustedUnderSec115JC')) > 1) {
          err('A976', `${TI}.DeemedIncomeUs115JC`, 'Part B-TI — deemed total income u/s 115JC does not equal Sl. No. 3 of Schedule AMT');
        }
      }
      /* A981 — special-rate income must be supported by the detail schedules */
      if (n(`${TI}.IncChargeTaxSplRate111A112`) > 0 && !filled('ScheduleSI')) {
        err('A981', 'ScheduleSI', 'Income chargeable to tax at special rates is shown in Part B-TI — Schedule SI must be filled');
      }
    }

    /* ── L. Part B-TTI arithmetic (A932, A957–A995) ──────────────────────── */
    {
      const C = 'PartB_TTI.ComputationOfTaxLiability';
      const D = `${C}.TaxPayableOnDeemedTI`;
      const T = `${C}.TaxPayableOnTI`;
      eq('A957', `${D}.TotalTax`, [`${D}.TaxDeemedTISec115JC`, `${D}.SurchargeOnAboveCrore`, `${D}.EducationCess`], 'Part B-TTI — total tax payable on deemed total income u/s 115JC');
      eq('A958', `${T}.TaxPayableOnTotInc`, [`${T}.TaxAtNormalRatesOnAggrInc`, `${T}.TaxAtSpecialRates`], 'Part B-TTI — tax payable on total income', [`${T}.RebateOnAgriInc`]);
      eq('A959', `${T}.TaxPayableOnRebate`, [`${T}.TaxPayableOnTotInc`], 'Part B-TTI — tax payable after rebate u/s 87A', [`${T}.Rebate87A`]);
      eq('A960', `${T}.TotalSurcharge`, [`${T}.Surcharge25ofSI`, `${T}.SurchargeOnAboveCrore`], 'Part B-TTI — total surcharge');
      eq('A960', `${T}.GrossTaxLiability`, [`${T}.TaxPayableOnRebate`, `${T}.TotalSurcharge`, `${T}.EducationCess`], 'Part B-TTI — gross tax liability');
      eq('A963', `${C}.TaxRelief.TotTaxRelief`, [`${C}.TaxRelief.Section89`, `${C}.TaxRelief.Section90`, `${C}.TaxRelief.Section91`], 'Part B-TTI — total tax relief');
      eq('A965', `${C}.AggregateTaxInterestLiability`, [`${C}.NetTaxLiability`, `${C}.IntrstPay.IntrstPayUs234A`, `${C}.IntrstPay.IntrstPayUs234B`, `${C}.IntrstPay.IntrstPayUs234C`, `${C}.IntrstPay.LateFilingFee234F`], 'Part B-TTI — aggregate liability (net tax + interest and fee)');
      eq('A966', 'PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid', ['PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax', 'PartB_TTI.TaxPaid.TaxesPaid.TDS', 'PartB_TTI.TaxPaid.TaxesPaid.TCS', 'PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax'], 'Part B-TTI — total taxes paid');
      eq('A980', `${C}.NetTaxLiability`, [`${C}.TaxPayAfterCreditUs115JD`], 'Part B-TTI — net tax liability', [`${C}.TaxRelief.TotTaxRelief`]);
      /* A978 — gross tax payable is the higher of the two computations */
      if (g(`${C}.GrossTaxPayable`) !== undefined) {
        const higher = Math.max(n(`${D}.TotalTax`), n(`${T}.GrossTaxLiability`));
        if (Math.abs(n(`${C}.GrossTaxPayable`) - higher) > 1) {
          err('A978', `${C}.GrossTaxPayable`, `Part B-TTI — gross tax payable (${n(`${C}.GrossTaxPayable`)}) must be the higher of the tax on total income and the tax on deemed total income u/s 115JC (${higher})`);
        }
      }
      /* A932 / A876 — Schedule AMT must agree with Part B-TTI and Part B-TI */
      if (filled('ScheduleAMT')) {
        if (g(`${D}.TaxDeemedTISec115JC`) !== undefined && Math.abs(n(`${D}.TaxDeemedTISec115JC`) - n('ScheduleAMT.TaxPayableUnderSec115JC')) > 1) {
          err('A932', `${D}.TaxDeemedTISec115JC`, 'Tax payable on deemed total income u/s 115JC in Part B-TTI does not equal the tax ascertained in Schedule AMT');
        }
        if (g('ScheduleAMT.TotalIncItem11') !== undefined && Math.abs(n('ScheduleAMT.TotalIncItem11') - n(`${TI}.TotalIncome`)) > 1) {
          err('A876', 'ScheduleAMT.TotalIncItem11', 'Schedule AMT Sl. No. 1 does not equal the total income at Sl. No. 14 of Part B-TI');
        }
      }
      /* A968 / A969 / A991 / A992 — rebate u/s 87A eligibility */
      const rebate = n(`${T}.Rebate87A`);
      if (rebate > 0) {
        if (isNRI) err('A968', `${T}.Rebate87A`, 'A rebate u/s 87A is allowed only to a resident (or resident but not ordinarily resident)');
        if (isHUF) err('A969', `${T}.Rebate87A`, 'A rebate u/s 87A is allowed only to an individual');
        if (optedOut && rebate > 12500) err('A992', `${T}.Rebate87A`, 'Under the old tax regime the rebate u/s 87A cannot exceed ₹12,500');
        if (optedOut && n(`${TI}.TotalIncome`) > 500000) err('A995', `${T}.Rebate87A`, 'Under the old tax regime a rebate u/s 87A cannot be claimed when total income exceeds ₹5,00,000');
        if (!optedOut && n(`${TI}.TotalIncome`) > 700000) warn('A991', `${T}.Rebate87A`, 'Total income exceeds ₹7,00,000 — a rebate u/s 87A is available only to the extent of marginal relief');
      }
      /* A984 — under the new regime the deemed-income (AMT) block must be nil */
      if (newRegime && n(`${D}.TotalTax`) > 0) {
        err('A984', `${D}.TotalTax`, 'The new tax regime is opted — the tax on deemed total income u/s 115JC (Sl. No. 1a to 1d of Part B-TTI) must be nil');
      }
      /* A970 / A971 — refund vs balance payable */
      const paid = n('PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid');
      const liab = n(`${C}.AggregateTaxInterestLiability`);
      if (g('PartB_TTI.Refund.RefundDue') !== undefined && paid > liab) {
        if (Math.abs(n('PartB_TTI.Refund.RefundDue') - (paid - liab)) > 1) {
          err('A970', 'PartB_TTI.Refund.RefundDue', `Refund claimed (${n('PartB_TTI.Refund.RefundDue')}) does not equal total taxes paid minus the aggregate tax, interest and fee payable (${paid - liab})`);
        }
      }
      if (g('PartB_TTI.TaxPaid.BalTaxPayable') !== undefined && liab > paid) {
        if (Math.abs(n('PartB_TTI.TaxPaid.BalTaxPayable') - (liab - paid)) > 1) {
          err('A971', 'PartB_TTI.TaxPaid.BalTaxPayable', `Tax payable (${n('PartB_TTI.TaxPaid.BalTaxPayable')}) does not equal the aggregate tax, interest and fee payable minus total taxes paid (${liab - paid})`);
        }
      }
      /* A987 / A988 — TDS and TCS must agree with the TDS/TCS schedules */
      const tdsSum = n('ScheduleTDS1.TotalTDSonSalaries') + n('ScheduleTDS2.TotalTDSonOthThanSals') + n('ScheduleTDS3.TotalTDS3OnOthThanSal');
      if (g('PartB_TTI.TaxPaid.TaxesPaid.TDS') !== undefined && Math.abs(n('PartB_TTI.TaxPaid.TaxesPaid.TDS') - tdsSum) > 1) {
        err('A988', 'PartB_TTI.TaxPaid.TaxesPaid.TDS', `TDS at Sl. No. 10b of Part B-TTI (${n('PartB_TTI.TaxPaid.TaxesPaid.TDS')}) does not equal the total of Schedules TDS-1, TDS-2 and TDS-3 (${tdsSum})`);
      }
      if (filled('ScheduleTCS') && g('PartB_TTI.TaxPaid.TaxesPaid.TCS') !== undefined && Math.abs(n('PartB_TTI.TaxPaid.TaxesPaid.TCS') - n('ScheduleTCS.TotalSchTCS')) > 1) {
        err('A987', 'PartB_TTI.TaxPaid.TaxesPaid.TCS', 'TCS at Sl. No. 10c of Part B-TTI does not equal the total of Schedule TCS');
      }
      /* Bank account particulars for the refund */
      const bankFlag = s('PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag');
      const accounts = rowsOf('PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails');
      const foreign = rowsOf('PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails');
      if (bankFlag === 'Y' && accounts.length === 0 && foreign.length === 0) {
        err('SCHEMA', 'PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', 'Bank details flag is "Y" but no bank account rows are filled (Bank Accounts section)');
      }
      if (n('PartB_TTI.Refund.RefundDue') > 0 && accounts.length === 0 && foreign.length === 0) {
        err('A967', 'PartB_TTI.Refund.BankAccountDtls', 'A refund is claimed but no bank account is provided — at least one pre-validated account is required for the refund credit');
      }
      accounts.forEach((acc, i) => {
        const ifsc = str(at(acc, 'IFSCCode'));
        if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
          err('A967', `PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[${i}].IFSCCode`, `Bank account #${i + 1}: IFSC "${ifsc}" is not in the AAAA0XXXXXX format and must match the RBI database`);
        }
      });
      if (accounts.length > 0 && !accounts.some((a) => str(at(a, 'UseForRefund')) === 'true')) {
        warn('A967', 'PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails', 'No bank account is nominated for the refund ("UseForRefund" is not true for any row)');
      }
    }

    /* ── M. Tax-payment schedules (A999–A1032) ───────────────────────────── */
    if (filled('ScheduleIT')) {
      const sum = rowsOf('ScheduleIT.TaxPayment').reduce<number>((a, r) => a + num(at(r, 'Amt')), 0);
      if (g('ScheduleIT.TotalTaxPayments') !== undefined && Math.abs(n('ScheduleIT.TotalTaxPayments') - sum) > 1) {
        err('A999', 'ScheduleIT.TotalTaxPayments', `Schedule IT — total of column 5 (${n('ScheduleIT.TotalTaxPayments')}) does not equal the sum of the individual challans (${sum})`);
      }
      rowsOf('ScheduleIT.TaxPayment').forEach((r, i) => {
        const bsr = str(at(r, 'BSRCode'));
        if (bsr && !/^[0-9]{3}[0-9A-Z]{4}$/.test(bsr)) {
          err('SCHEMA', `ScheduleIT.TaxPayment[${i}].BSRCode`, `Challan ${i + 1}: BSR code "${bsr}" must be 7 characters (3 digits + 4 alphanumeric)`);
        }
      });
    }
    if (filled('ScheduleTDS1')) {
      const sum = rowsOf('ScheduleTDS1.TDSonSalary').reduce<number>((a, r) => a + num(at(r, 'TotalTDSSal')), 0);
      if (g('ScheduleTDS1.TotalTDSonSalaries') !== undefined && Math.abs(n('ScheduleTDS1.TotalTDSonSalaries') - sum) > 1) {
        err('A1005', 'ScheduleTDS1.TotalTDSonSalaries', `Schedule TDS-1 — the total tax deducted (${n('ScheduleTDS1.TotalTDSonSalaries')}) does not equal the sum of the individual rows (${sum})`);
      }
      rowsOf('ScheduleTDS1.TDSonSalary').forEach((r, i) => {
        if (isEmpty(at(r, 'EmployerOrDeductorOrCollectDetl.TAN'))) {
          err('A1018', `ScheduleTDS1.TDSonSalary[${i}].EmployerOrDeductorOrCollectDetl.TAN`, `Row ${i + 1} of Schedule TDS-1: the TAN of the employer / deductor must be filled`);
        }
      });
    }
    for (const [sched, arrName, totField, ruleTot] of [
      ['ScheduleTDS2', 'TDSOthThanSalaryDtls', 'TotalTDSonOthThanSals', 'A1006'],
      ['ScheduleTDS3', 'TDS3onOthThanSalDtls', 'TotalTDS3OnOthThanSal', 'A1007'],
    ] as Array<[string, string, string, string]>) {
      if (!filled(sched)) continue;
      const rows = rowsOf(`${sched}.${arrName}`);
      const sum = rows.reduce<number>((a, r) => a + num(at(r, 'TaxDeductCreditDtls.TaxClaimedOwnHands')), 0);
      if (g(`${sched}.${totField}`) !== undefined && Math.abs(n(`${sched}.${totField}`) - sum) > 1) {
        err(ruleTot, `${sched}.${totField}`, `${sched} — the total TDS credit claimed this year (${n(`${sched}.${totField}`)}) does not equal the sum of the individual rows (${sum})`);
      }
      rows.forEach((r, i) => {
        const claimed = num(at(r, 'TaxDeductCreditDtls.TaxClaimedOwnHands'));
        const deducted = num(at(r, 'TaxDeductCreditDtls.TaxDeductedOwnHands'));
        if (claimed > 0) {
          if (isEmpty(at(r, 'GrossAmount'))) err('A1011', `${sched}.${arrName}[${i}].GrossAmount`, `Row ${i + 1}: TDS credit is claimed, so the corresponding income offered ("Gross amount") is mandatory`);
          if (isEmpty(at(r, 'HeadOfIncome'))) err('A1011', `${sched}.${arrName}[${i}].HeadOfIncome`, `Row ${i + 1}: TDS credit is claimed, so the "Head of income" is mandatory`);
        }
        if (deducted > 0 && claimed > deducted + 1) {
          err('A1013', `${sched}.${arrName}[${i}].TaxDeductCreditDtls.TaxClaimedOwnHands`, `Row ${i + 1}: TDS claimed (${claimed}) cannot exceed the TDS deducted (${deducted})`);
        }
        if (str(at(r, 'TDSCreditName')) === 'O' && isEmpty(at(r, 'PANofOtherPerson')) && isEmpty(at(r, 'AadhaarOfOtherPerson'))) {
          err('A1017', `${sched}.${arrName}[${i}].PANofOtherPerson`, `Row ${i + 1}: TDS credit relates to another person, so the PAN (or Aadhaar) of that person must be provided`);
        }
        if (num(at(r, 'BroughtFwdTDSAmt')) > 0 && isEmpty(at(r, 'DeductedYr'))) {
          err('A1004', `${sched}.${arrName}[${i}].DeductedYr`, `Row ${i + 1}: brought-forward TDS is claimed, so the financial year of tax deduction must be provided`);
        }
      });
    }
    if (filled('ScheduleTCS')) {
      const rows = rowsOf('ScheduleTCS.TCS');
      const sum = rows.reduce<number>((a, r) => a + num(at(r, 'TCSClaimedThisYearDtls.TCSAmtCollOwnHand')) + num(at(r, 'TCSClaimedThisYearDtls.TCSAmtCollOthPrsn')), 0);
      if (g('ScheduleTCS.TotalSchTCS') !== undefined && sum > 0 && Math.abs(n('ScheduleTCS.TotalSchTCS') - sum) > 1) {
        err('A1026', 'ScheduleTCS.TotalSchTCS', `Schedule TCS — the total TCS claimed (${n('ScheduleTCS.TotalSchTCS')}) does not equal the sum of the individual rows (${sum})`);
      }
      rows.forEach((r, i) => {
        if (str(at(r, 'TCSCreditOwner')) === '2' && isEmpty(at(r, 'PANOfSpouseOrOthrPrsn'))) {
          err('A1029', `ScheduleTCS.TCS[${i}].PANOfSpouseOrOthrPrsn`, `Row ${i + 1}: TCS credit relates to another person, so the PAN of that person must be provided`);
        }
      });
    }

    /* ── N. Verification ─────────────────────────────────────────────────── */
    {
      const verPan = s('Verification.Declaration.AssesseeVerPAN');
      const pan = s('PartA_GEN1.PersonalInfo.PAN');
      if (verPan && pan && verPan !== pan && s('Verification.Capacity') === 'S') {
        err('SCHEMA', 'Verification.Declaration.AssesseeVerPAN', `The PAN in the verification (${verPan}) differs from the PAN of the assessee (${pan}) although the return is verified by "Self"`);
      }
      const vdate = s('Verification.Date');
      if (/^\d{4}-\d{2}-\d{2}$/.test(vdate) && vdate < '2025-04-01') {
        err('SCHEMA', 'Verification.Date', `The date of verification (${vdate}) cannot be before 01-04-2025 for A.Y. 2025-26`);
      }
      if (filled('TaxReturnPreparer')) {
        need('SCHEMA', 'TaxReturnPreparer.IdentificationNoOfTRP', 'The return is prepared by a TRP — the TRP identification number is mandatory');
        need('SCHEMA', 'TaxReturnPreparer.NameOfTRP', 'The return is prepared by a TRP — the name of the TRP is mandatory');
      }
    }
  } catch {
    errors.push({ path: ROOT, msg: 'Internal error while validating the ITR-3 JSON — the payload shape is unexpected', rule: 'SCHEMA' });
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
