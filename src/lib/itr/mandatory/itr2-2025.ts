/**
 * OFFICIAL mandatory-field validator — ITR-2, ASSESSMENT YEAR 2025-26.
 *
 * Derived from, and valid ONLY for, this form-year:
 *  1. CBDT JSON schema "ITR-2_2025_Main_V1.2" (payload root { ITR: { ITR2: … } };
 *     wire constants FormName "ITR-2", AssessmentYear "2025", SchemaVer / FormVer
 *     "Ver1.0"). The tables below are a DISTILLED copy of that schema's recursive
 *     `required` chain — the 157 unconditional leaves, plus the
 *     "required-when-the-parent-is-present" children of every optional block and
 *     the per-row required fields of every repeating table.
 *  2. CBDT "ITR 2 – Validation Rules for AY 2025-26" V1.0, Table 2 — Category A
 *     ("Return will not be allowed to be uploaded"). Every Category-A rule that is
 *     decidable on the exported JSON alone is encoded, carrying its Sl. No. as the
 *     rule id ("A<n>"). Rules that need data this module does not hold (PAN /
 *     Aadhaar database, CPC records, RBI IFSC master, e-verification state, Form
 *     10-x filing status, 26AS / AIS) are NOT raised as errors; a few of them are
 *     surfaced as warnings where the JSON itself gives a usable hint.
 *
 * Self-contained per the contract in ./types.ts — it never imports the raw schema
 * and never throws on a partial or malformed payload.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr2';
const AY = '2025-26';
const SCHEMA_VERSION = 'ITR-2_2025_Main_V1.2 (SchemaVer Ver1.0)';

/* ════════════════════════════════════════════════════════════════════════════
 * 1. UNCONDITIONAL required leaves — the schema's `required` chain walked from
 *    the root. Every path is relative to ITR.ITR2.
 * ════════════════════════════════════════════════════════════════════════════ */

type Leaf = [path: string, label: string, hint?: string];

const REQUIRED: Leaf[] = [];
function req(path: string, label: string, hint?: string): void {
  REQUIRED.push([path, label, hint]);
}

/* — CreationInfo (JSON provenance block) — */
req('CreationInfo.SWVersionNo', 'Software version number (CreationInfo)');
req('CreationInfo.SWCreatedBy', 'Software id that created the return (SW + 8 digits)');
req('CreationInfo.JSONCreatedBy', 'Software id that created the JSON (SW + 8 digits)');
req('CreationInfo.JSONCreationDate', 'JSON creation date (YYYY-MM-DD)');
req('CreationInfo.IntermediaryCity', 'Intermediary city (CreationInfo)');
req('CreationInfo.Digest', 'Digest hash (CreationInfo; "-" when not applicable)');

/* — Form_ITR2 (form identity) — */
req('Form_ITR2.FormName', 'Form name (must be "ITR-2")');
req('Form_ITR2.Description', 'Form description');
req('Form_ITR2.AssessmentYear', 'Assessment year (must be "2025")');
req('Form_ITR2.SchemaVer', 'Schema version (must be "Ver1.0")');
req('Form_ITR2.FormVer', 'Form version (must be "Ver1.0")');

/* — Part A-GEN · PersonalInfo — */
const PI = 'PartA_GEN1.PersonalInfo';
const H_ASSESSEE = 'Assessee info. section';
req(`${PI}.AssesseeName.SurNameOrOrgName`, 'Surname / last name of the assessee (full name for a HUF)', H_ASSESSEE);
req(`${PI}.PAN`, 'PAN of the assessee', H_ASSESSEE);
req(`${PI}.Address.ResidenceNo`, 'Address — flat / door / block no.', H_ASSESSEE);
req(`${PI}.Address.LocalityOrArea`, 'Address — locality / area', H_ASSESSEE);
req(`${PI}.Address.CityOrTownOrDistrict`, 'Address — city / town / district', H_ASSESSEE);
req(`${PI}.Address.StateCode`, 'Address — state code', H_ASSESSEE);
req(`${PI}.Address.CountryCode`, 'Address — country code', H_ASSESSEE);
req(`${PI}.Address.CountryCodeMobile`, 'Mobile — country calling code (91 for India)', H_ASSESSEE);
req(`${PI}.Address.MobileNo`, 'Mobile number', H_ASSESSEE);
req(`${PI}.Address.EmailAddress`, 'E-mail address', H_ASSESSEE);
req(`${PI}.DOB`, 'Date of birth / date of formation (YYYY-MM-DD)', H_ASSESSEE);
req(`${PI}.Status`, 'Status (I = Individual / H = HUF)', H_ASSESSEE);

/* — Part A-GEN · FilingStatus — */
const FS = 'PartA_GEN1.FilingStatus';
const H_FILING = 'Filing Details section';
req(`${FS}.ReturnFileSec`, 'Section under which the return is filed (11 = 139(1), 12 = 139(4), 13 = 142(1), 14 = 148, 16 = 153C, 17 = 139(5), 18 = 139(9), 19 = 92CD, 20 = 119(2)(b), 21 = 139(8A))', H_FILING);
req(`${FS}.OptOutNewTaxRegime`, 'Opting out of the new tax regime u/s 115BAC(6)? (Y = old regime / N = new regime)', H_FILING);
req(`${FS}.SeventhProvisio139`, 'Filing under the Seventh proviso to s.139(1)? (Y/N)', H_FILING);
req(`${FS}.ResidentialStatus`, 'Residential status (RES / NRI / NOR)', 'Residential status info. section');
req(`${FS}.HeldUnlistedEqShrPrYrFlg`, 'Held unlisted equity shares during the previous year? (Y/N)', 'Unlisted Equity Shares section');
req(`${FS}.FiiFpiFlag`, 'Whether FII / FPI? (Y/N)', H_FILING);
req(`${FS}.ItrFilingDueDate`, 'ITR filing due date (2025-07-31)', H_FILING);

/* — Schedule CYLA (mandatory schedule; every rate row is required) — */
const H_AUTO = 'Computation of Income (auto-computed)';
const CG_BLOCKS: Array<[string, string]> = [
  ['STCG15Per', 'STCG taxable @15%'],
  ['STCG20Per', 'STCG taxable @20%'],
  ['STCG30Per', 'STCG taxable @30%'],
  ['STCGAppRate', 'STCG taxable at applicable rates'],
  ['STCGDTAARate', 'STCG taxable at DTAA rates'],
  ['LTCG10Per', 'LTCG taxable @10%'],
  ['LTCG12_5Per', 'LTCG taxable @12.5%'],
  ['LTCG20Per', 'LTCG taxable @20%'],
  ['LTCGDTAARate', 'LTCG taxable at DTAA rates'],
];
for (const [key, name] of CG_BLOCKS) {
  req(`ScheduleCYLA.${key}.IncCYLA.IncOfCurYrUnderThatHead`, `Schedule CYLA — ${name}: income of the current year`, H_AUTO);
  req(`ScheduleCYLA.${key}.IncCYLA.IncOfCurYrAfterSetOff`, `Schedule CYLA — ${name}: income remaining after set-off`, H_AUTO);
}
req('ScheduleCYLA.TotalCurYr.TotHPlossCurYr', 'Schedule CYLA — total house-property loss of the current year', H_AUTO);
req('ScheduleCYLA.TotalCurYr.TotOthSrcLossNoRaceHorse', 'Schedule CYLA — total other-sources loss (excluding race horses)', H_AUTO);
req('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff', 'Schedule CYLA — total house-property loss set off', H_AUTO);
req('ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff', 'Schedule CYLA — total other-sources loss set off', H_AUTO);
req('ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff', 'Schedule CYLA — balance house-property loss after set-off', H_AUTO);
req('ScheduleCYLA.LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff', 'Schedule CYLA — balance other-sources loss after set-off', H_AUTO);

/* — Schedule BFLA (mandatory schedule) — */
req('ScheduleBFLA.Salary.IncBFLA.IncOfCurYrUndHeadFromCYLA', 'Schedule BFLA — Salary: income after CYLA set-off', H_AUTO);
req('ScheduleBFLA.Salary.IncBFLA.IncOfCurYrAfterSetOffBFLosses', 'Schedule BFLA — Salary: income after b/f loss set-off', H_AUTO);
for (const [key, name] of CG_BLOCKS) {
  req(`ScheduleBFLA.${key}.IncBFLA.IncOfCurYrUndHeadFromCYLA`, `Schedule BFLA — ${name}: income after CYLA set-off`, H_AUTO);
  req(`ScheduleBFLA.${key}.IncBFLA.IncOfCurYrAfterSetOffBFLosses`, `Schedule BFLA — ${name}: income after b/f loss set-off`, H_AUTO);
  req(`ScheduleBFLA.${key}.IncBFLA.BFlossPrevYrUndSameHeadSetoff`, `Schedule BFLA — ${name}: b/f loss of earlier years set off`, H_AUTO);
}
req('ScheduleBFLA.IncomeOfCurrYrAftCYLABFLA', 'Schedule BFLA — income of the current year after CYLA and BFLA', H_AUTO);
req('ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff', 'Schedule BFLA — total brought-forward loss set off', H_AUTO);

/* — Part B-TI (the JSON key is literally "PartB-TI") — */
const TI = 'PartB-TI';
const TI_LEAVES: Array<[string, string]> = [
  ['Salaries', 'income from Salaries'],
  ['IncomeFromHP', 'income from house property'],
  ['CapGain.ShortTerm.ShortTerm15Per', 'STCG @15%'],
  ['CapGain.ShortTerm.ShortTerm20Per', 'STCG @20%'],
  ['CapGain.ShortTerm.ShortTerm30Per', 'STCG @30%'],
  ['CapGain.ShortTerm.ShortTermAppRate', 'STCG at applicable rates'],
  ['CapGain.ShortTerm.ShortTermSplRateDTAA', 'STCG at DTAA special rates'],
  ['CapGain.ShortTerm.TotalShortTerm', 'total short-term capital gains'],
  ['CapGain.LongTerm.LongTerm10Per', 'LTCG @10%'],
  ['CapGain.LongTerm.LongTerm12_5Per', 'LTCG @12.5%'],
  ['CapGain.LongTerm.LongTerm20Per', 'LTCG @20%'],
  ['CapGain.LongTerm.LongTermSplRateDTAA', 'LTCG at DTAA special rates'],
  ['CapGain.LongTerm.TotalLongTerm', 'total long-term capital gains'],
  ['CapGain.ShortTermLongTermTotal', 'sum of short-term and long-term capital gains'],
  ['CapGain.CapGains30Per115BBH', 'capital gains @30% u/s 115BBH (virtual digital assets)'],
  ['CapGain.TotalCapGains', 'total capital gains'],
  ['IncFromOS.OtherSrcThanOwnRaceHorse', 'other-sources income (other than race horses)'],
  ['IncFromOS.IncChargblSplRate', 'other-sources income chargeable at special rates'],
  ['IncFromOS.FromOwnRaceHorse', 'income from owning and maintaining race horses'],
  ['IncFromOS.TotIncFromOS', 'total income from other sources'],
  ['TotalTI', 'total of the head-wise income'],
  ['CurrentYearLoss', 'current-year losses set off (Schedule CYLA)'],
  ['BalanceAfterSetoffLosses', 'balance after set-off of the current-year losses'],
  ['BroughtFwdLossesSetoff', 'brought-forward losses set off (Schedule BFLA)'],
  ['GrossTotalIncome', 'gross total income'],
  ['IncChargeTaxSplRate111A112', 'income chargeable at special rates u/s 111A / 112 etc.'],
  ['DeductionsUnderScheduleVIA', 'deductions under Chapter VI-A'],
  ['TotalIncome', 'total income'],
  ['IncChargeableTaxSplRates', 'income chargeable to tax at special rates (Schedule SI)'],
  ['NetAgricultureIncomeOrOtherIncomeForRate', 'net agricultural income / other income for rate purposes'],
  ['AggregateIncome', 'aggregate income'],
  ['LossesOfCurrentYearCarriedFwd', 'losses of the current year carried forward'],
  ['DeemedIncomeUs115JC', 'deemed total income u/s 115JC'],
];
for (const [p, l] of TI_LEAVES) req(`${TI}.${p}`, `Part B-TI — ${l}`, H_AUTO);

/* — Part B-TTI — */
const TTI = 'PartB_TTI';
const CTL = `${TTI}.ComputationOfTaxLiability`;
const TTI_LEAVES: Array<[string, string]> = [
  [`${TTI}.TaxPayDeemedTotIncUs115JC`, 'tax payable on the deemed total income u/s 115JC'],
  [`${TTI}.Surcharge`, 'surcharge on the 115JC tax'],
  [`${TTI}.HealthEduCess`, 'health & education cess on the 115JC tax'],
  [`${TTI}.TotalTaxPayablDeemedTotInc`, 'total tax payable on the deemed total income'],
  [`${CTL}.TaxPayableOnTI.TaxAtNormalRatesOnAggrInc`, 'tax at normal rates on the aggregate income'],
  [`${CTL}.TaxPayableOnTI.TaxAtSpecialRates`, 'tax at special rates'],
  [`${CTL}.TaxPayableOnTI.RebateOnAgriInc`, 'rebate on agricultural income'],
  [`${CTL}.TaxPayableOnTI.TaxPayableOnTotInc`, 'tax payable on the total income'],
  [`${CTL}.Rebate87A`, 'rebate u/s 87A'],
  [`${CTL}.TaxPayableOnRebate`, 'tax payable after the rebate u/s 87A'],
  [`${CTL}.Surcharge25ofSI`, 'surcharge @25% on 115BBE income (after marginal relief)'],
  [`${CTL}.SurchargeOnAboveCrore`, 'surcharge other than on 115BBE income (after marginal relief)'],
  [`${CTL}.Surcharge25ofSIBeforeMarginal`, 'surcharge @25% on 115BBE income (before marginal relief)'],
  [`${CTL}.SurchargeOnAboveCroreBeforeMarginal`, 'surcharge other than on 115BBE income (before marginal relief)'],
  [`${CTL}.TotalSurcharge`, 'total surcharge'],
  [`${CTL}.EducationCess`, 'health & education cess'],
  [`${CTL}.GrossTaxLiability`, 'gross tax liability'],
  [`${CTL}.GrossTaxPayable`, 'gross tax payable (higher of the 115JC tax and the normal tax)'],
  [`${CTL}.CreditUS115JD`, 'AMT credit set off u/s 115JD'],
  [`${CTL}.TaxPayAfterCreditUs115JD`, 'tax payable after the 115JD credit'],
  [`${CTL}.NetTaxLiability`, 'net tax liability'],
  [`${CTL}.IntrstPay.IntrstPayUs234A`, 'interest u/s 234A'],
  [`${CTL}.IntrstPay.IntrstPayUs234B`, 'interest u/s 234B'],
  [`${CTL}.IntrstPay.IntrstPayUs234C`, 'interest u/s 234C'],
  [`${CTL}.IntrstPay.LateFilingFee234F`, 'late-filing fee u/s 234F'],
  [`${CTL}.IntrstPay.TotalIntrstPay`, 'total interest and fee payable'],
  [`${CTL}.AggregateTaxInterestLiability`, 'aggregate tax and interest liability'],
  [`${TTI}.TaxPaid.TaxesPaid.AdvanceTax`, 'advance tax paid'],
  [`${TTI}.TaxPaid.TaxesPaid.TDS`, 'total TDS claimed'],
  [`${TTI}.TaxPaid.TaxesPaid.TCS`, 'total TCS claimed'],
  [`${TTI}.TaxPaid.TaxesPaid.SelfAssessmentTax`, 'self-assessment tax paid'],
  [`${TTI}.TaxPaid.TaxesPaid.TotalTaxesPaid`, 'total taxes paid'],
  [`${TTI}.Refund.RefundDue`, 'refund due'],
  [`${TTI}.Refund.BankAccountDtls.BankDtlsFlag`, 'bank account details flag (Y/N)'],
  [`${TTI}.AssetOutIndiaFlag`, 'do you hold assets / signing authority outside India? (YES/NO)'],
];
for (const [p, l] of TTI_LEAVES) {
  req(p, `Part B-TTI — ${l}`, p.indexOf('BankAccountDtls') >= 0 ? 'Bank Accounts section' : H_AUTO);
}

/* — Verification — */
const H_VER = 'Verifier info. section';
req('Verification.Declaration.AssesseeVerName', 'Verification — name of the person verifying the return', H_VER);
req('Verification.Declaration.FatherName', "Verification — father's name of the person verifying", H_VER);
req('Verification.Declaration.AssesseeVerPAN', 'Verification — PAN of the person verifying', H_VER);
req('Verification.Capacity', 'Verification — capacity (S = Self, R = Representative, K = Karta, A = Authorised signatory)', H_VER);

/* ════════════════════════════════════════════════════════════════════════════
 * 2. CONDITIONALLY required children — when the (optional) parent object is
 *    present in the JSON the schema makes these immediate children required.
 * ════════════════════════════════════════════════════════════════════════════ */

type Block = [path: string, label: string, fields: string[]];

const WHEN_PRESENT: Block[] = [
  ['PartA_139_8A', 'Part A 139(8A) — updated return', ['PAN', 'Name', 'AssessmentYear', 'PreviouslyFiledForThisAY', 'LaidOutIn_139_8A', 'ITRFormUpdatingInc', 'UpdatedReturnDuringPeriod']],
  ['PartA_139_8A.Applicable_139_8A', 'Part A 139(8A) — earlier return', ['AcknowledgementNo', 'OrigRetFiledDate']],
  ['PartB-ATI', 'Part B-ATI — additional income-tax on an updated return', ['UpdatedTotInc', 'AmtPayable', 'FeeIncUS234F', 'AggrLiabilityRefund', 'AggrLiabilityNoRefund', 'AddtnlIncTax', 'NetPayable', 'TaxUS140B', 'TaxDue10_11', 'ReleifUS89']],
  ['PartA_GEN1.FilingStatus.AssesseeRep', 'Representative assessee', ['RepName', 'RepCapacity', 'RepAddress', 'RepPAN']],
  ['PartA_GEN1.PersonalInfo.Address.Phone', 'Landline telephone', ['STDcode', 'PhoneNo']],
  ['ScheduleS', 'Schedule S — Salary', ['TotalGrossSalary', 'AllwncExtentExemptUs10', 'NetSalary', 'DeductionUS16', 'DeductionUnderSection16ia', 'EntertainmntalwncUs16ii', 'ProfessionalTaxUs16iii', 'TotIncUnderHeadSalaries']],
  ['ScheduleS.Section10_13A', 'Table 10(13A) of Schedule S — HRA working', ['Placeofwork', 'ActlHRARecv', 'ActlRentPaid', 'DtlsSalUsSec171', 'ActlRentPaid10Per', 'Sal40Or50Per', 'EligbleExmpAllwncUs13A']],
  ['ScheduleHP', 'Schedule HP — House property', ['TotalIncomeChargeableUnHP']],
  ['ScheduleCGFor23', 'Schedule CG — Capital gains', ['ShortTermCapGainFor23', 'LongTermCapGain23', 'SumOfCGIncm', 'IncmFromVDATrnsf', 'TotScheduleCGFor23', 'CurrYrLosses', 'AccruOrRecOfCG']],
  ['ScheduleCGFor23.ShortTermCapGainFor23', 'Schedule CG Part A — STCG', ['NRITransacSec48Dtl', 'NRISecur115AD', 'SaleOnOtherAssets', 'TotalAmtDeemedStcg', 'PassThrIncNatureSTCG', 'TotalAmtNotTaxUsDTAAStcg', 'TotalAmtTaxUsDTAAStcg', 'TotalSTCG']],
  ['ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl', 'Schedule CG A2 — first proviso to s.48', ['NRItaxSTTPaid', 'NRItaxSTTPaidTransferBE', 'NRItaxSTTPaidTransferAE', 'NRItaxSTTNotPaid']],
  ['ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD', 'Schedule CG A4 — STCG u/s 115AD', ['FullValueConsdRecvUnqshr', 'FairMrktValueUnqshr', 'FullValueConsdSec50CA', 'FullValueConsdOthUnqshr', 'FullConsideration', 'DeductSec48', 'BalanceCG', 'LossSec94of7Or94of8', 'CapgainonAssets']],
  ['ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets', 'Schedule CG A5 — STCG on other assets', ['FullValueConsdRecvUnqshr', 'FairMrktValueUnqshr', 'FullValueConsdSec50CA', 'FullValueConsdOthUnqshr', 'FullConsideration', 'DeductSec48', 'BalanceCG', 'LossSec94of7Or94of8', 'CapgainonAssets']],
  ['ScheduleCGFor23.LongTermCapGain23', 'Schedule CG Part B — LTCG', ['SaleofBondsDebntr', 'SaleOfEquityShareUs112A', 'NRISaleOfEquityShareUs112A', 'NRISaleofForeignAsset', 'SaleofAssetNADtls', 'TotalAmtDeemedLtcg', 'PassThrIncNatureLTCG', 'PassThrIncNatureLTCGUs112A', 'TotalAmtNotTaxUsDTAALtcg', 'TotalAmtTaxUsDTAALtcg', 'TotalLTCG']],
  ['ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild', 'Schedule CG B1 — LTCG on land / building totals', ['TotalLTCGImmblPrprty', 'TotalLTCGImmblPrprtyBE', 'TotalLTCGImmblPrprtyAE', 'TotalExcessTax']],
  ['ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr', 'Schedule CG B2 — LTCG on bonds / debentures', ['FullConsideration', 'DeductSec48', 'BalanceCG', 'DeductionUs54F', 'CapgainonAssets']],
  ['ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A', 'Schedule CG B4 — LTCG u/s 112A', ['BalanceCG', 'BalanceCGTransferBE', 'BalanceCGTransferAE', 'DeductionUs54F', 'DeductionUs54FBE', 'DeductionUs54FAE', 'CapgainonAssets', 'CapgainonAssetsTransferBE', 'CapgainonAssetsTransferAE']],
  ['ScheduleCGFor23.DeducClaimInfo', 'Schedule CG Table D — deductions claimed', ['TotDeductClaim']],
  ['ScheduleCGFor23.CurrYrLosses', 'Schedule CG Table E — set-off of current-year losses', ['InLossSetOff', 'InStcg15Per', 'InStcg20Per', 'InStcg30Per', 'InStcgAppRate', 'InStcgDTAARate', 'InLtcg10Per', 'InLtcg12_5Per', 'InLtcg20Per', 'InLtcgDTAARate', 'TotLossSetOff', 'LossRemainSetOff']],
  ['ScheduleCGFor23.AccruOrRecOfCG', 'Schedule CG Table F — quarterly accrual', ['ShortTermUnder15Per', 'ShortTermUnder20Per', 'ShortTermUnder30Per', 'ShortTermUnderAppRate', 'ShortTermUnderDTAARate', 'LongTermUnder10Per', 'LongTermUnder12_5Per', 'LongTermUnder20Per', 'LongTermUnderDTAARate']],
  ['Schedule112A', 'Schedule 112A', ['SaleValue112A', 'CostAcqWithoutIndx112A', 'AcquisitionCost112A', 'LTCGBeforelowerB1B2112A', 'FairMktValueCapAst112A', 'ExpExclCnctTransfer112A', 'Deductions112A', 'Balance112A', 'Balance112ABE', 'Balance112AAE', 'TotalBalance112A']],
  ['Schedule115AD', 'Schedule 115AD(1)(b)(iii) proviso', ['SaleValue115AD', 'CostAcqWithoutIndx115AD', 'AcquisitionCost115AD', 'LTCGBeforelowerB1B2115AD', 'FairMktValueCapAst115AD', 'ExpExclCnctTransfer115AD', 'Deductions115AD', 'Balance115AD', 'Balance115ADBE', 'Balance115ADAE', 'TotalBalance115AD']],
  ['ScheduleVDA', 'Schedule VDA — Virtual digital assets', ['ScheduleVDADtls', 'TotIncCapGain']],
  ['ScheduleOS', 'Schedule OS — Other sources', ['IncFrmLottery', 'DividendIncUs115BBDA', 'DividendIncUs115BBDAaiii', 'DividendIncUs115A1ai', 'DividendIncUs115AC', 'DividendIncUs115ACA', 'DividendIncUs115AD1i', 'DividendDTAA', 'NOT89A', 'IncChargeable']],
  ['ScheduleOS.IncOthThanOwnRaceHorse', 'Schedule OS — income other than from race horses', ['GrossIncChrgblTaxAtAppRate', 'DividendGross', 'InterestGross', 'IntrstFrmSavingBank', 'IntrstFrmTermDeposit', 'IntrstFrmIncmTaxRefund', 'IntrstFrmOthers', 'RentFromMachPlantBldgs', 'Tot562x', 'FamilyPension', 'AnyOtherIncome', 'IncChargeableSpecialRates', 'Deductions', 'BalanceNoRaceHorse']],
  ['ScheduleOS.IncOthThanOwnRaceHorse.Deductions', 'Schedule OS — deductions u/s 57', ['Expenses', 'DeductionUs57iia', 'Depreciation', 'TotDeductions']],
  ['ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF', 'Schedule OS 2c — accumulated PF balance', ['TotalIncomeBenefit', 'TotalTaxBenefit']],
  ['ScheduleOS.IncFromOwnHorse', 'Schedule OS — owning & maintaining race horses', ['Receipts', 'DeductSec57', 'BalanceOwnRaceHorse']],
  ['ScheduleCFL', 'Schedule CFL — Carry-forward of losses', ['TotalLossCFSummary', 'TotalOfBFLossesEarlierYrs']],
  ['ScheduleCFL.CurrentAYloss.LossSummaryDetail', 'Schedule CFL — current-year loss', ['TotalHPPTILossCF', 'TotalSTCGPTILossCF', 'TotalLTCGPTILossCF']],
  ['ScheduleCFL.TotalLossCFSummary.LossSummaryDetail', 'Schedule CFL — total loss carried forward', ['TotalHPPTILossCF', 'TotalSTCGPTILossCF', 'TotalLTCGPTILossCF']],
  ['ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail', 'Schedule CFL — total b/f losses of earlier years', ['TotalHPPTILossCF', 'TotalSTCGPTILossCF', 'TotalLTCGPTILossCF']],
  ['ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail', 'Schedule CFL — b/f loss adjusted in BFLA', ['TotalHPPTILossCF', 'TotalSTCGPTILossCF', 'TotalLTCGPTILossCF']],
  ['ScheduleVIA', 'Schedule VI-A', ['UsrDeductUndChapVIA', 'DeductUndChapVIA']],
  ['ScheduleVIA.DeductUndChapVIA', 'Schedule VI-A — system-computed deductions', ['Section80D', 'Section80G', 'Section80GGA', 'TotalChapVIADeductions']],
  ['Schedule80C', 'Schedule 80C', ['Schedule80CDtls', 'TotalAmt']],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth', 'Schedule 80D', ['SelfAndFamily', 'SelfAndFamilySeniorCitizen', 'Parents', 'ParentsSeniorCitizen', 'EligibleAmountOfDedn']],
  ['Schedule80G', 'Schedule 80G', ['TotalDonationsUs80GCash', 'TotalDonationsUs80GOtherMode', 'TotalDonationsUs80G', 'TotalEligibleDonationsUs80G']],
  ['Schedule80G.Don100Percent', 'Schedule 80G (A) — 100% without a qualifying limit', ['TotDon100PercentCash', 'TotDon100PercentOtherMode', 'TotDon100Percent', 'TotEligibleDon100Percent']],
  ['Schedule80G.Don50PercentNoApprReqd', 'Schedule 80G (B) — 50% without a qualifying limit', ['TotDon50PercentNoApprReqdCash', 'TotDon50PercentNoApprReqdOtherMode', 'TotDon50PercentNoApprReqd', 'TotEligibleDon50Percent']],
  ['Schedule80G.Don100PercentApprReqd', 'Schedule 80G (C) — 100% with a qualifying limit', ['TotDon100PercentApprReqdCash', 'TotDon100PercentApprReqdOtherMode', 'TotDon100PercentApprReqd', 'TotEligibleDon100PercentApprReqd']],
  ['Schedule80G.Don50PercentApprReqd', 'Schedule 80G (D) — 50% with a qualifying limit', ['TotDon50PercentApprReqdCash', 'TotDon50PercentApprReqdOtherMode', 'TotDon50PercentApprReqd', 'TotEligibleDon50PercentApprReqd']],
  ['Schedule80GGC', 'Schedule 80GGC', ['TotalDonationAmtCash80GGC', 'TotalDonationAmtOtherMode80GGC', 'TotalDonationsUs80GGC', 'TotalEligibleDonationAmt80GGC']],
  ['Schedule80DD', 'Schedule 80DD', ['NatureOfDisability', 'TypeOfDisability', 'DeductionAmount', 'DependentType']],
  ['Schedule80U', 'Schedule 80U', ['NatureOfDisability', 'TypeOfDisability', 'DeductionAmount']],
  ['Schedule80E', 'Schedule 80E', ['Schedule80EDtls', 'TotalInterest80E']],
  ['Schedule80EE', 'Schedule 80EE', ['Schedule80EEDtls', 'TotalInterest80EE']],
  ['Schedule80EEA', 'Schedule 80EEA', ['PropStmpDtyVal', 'Schedule80EEADtls', 'TotalInterest80EEA']],
  ['Schedule80EEB', 'Schedule 80EEB', ['Schedule80EEBDtls', 'TotalInterest80EEB']],
  ['Schedule80GGA', 'Schedule 80GGA', ['TotalDonationAmtCash80GGA', 'TotalDonationAmtOtherMode80GGA', 'TotalDonationsUs80GGA', 'TotalEligibleDonationAmt80GGA']],
  ['ScheduleAMT', 'Schedule AMT', ['TotalIncItemPartBTI', 'DeductionClaimUndrAnySec', 'AdjustedUnderSec115JC', 'TaxPayableUnderSec115JC']],
  ['ScheduleAMTC', 'Schedule AMTC', ['TaxSection115JC', 'TaxOthProvisions', 'AmtTaxCreditAvailable', 'CurrYrAmtCreditFwd', 'CurrYrCreditCarryFwd', 'TotAMTGross', 'TotSetOffEys', 'TotBalBF', 'TaxSection115JD', 'AmtLiabilityAvailable', 'TotBalAMTCreditCF']],
  ['ScheduleSI', 'Schedule SI — income at special rates', ['TotSplRateInc', 'TotSplRateIncTax']],
  ['ScheduleEI', 'Schedule EI — Exempt income', ['TotalExemptInc', 'NetAgriIncOrOthrIncRule7', 'Others', 'IncNotChrgblToTax']],
  ['ScheduleTR1', 'Schedule TR — relief for foreign tax', ['TotalTaxPaidOutsideIndia', 'TotalTaxReliefOutsideIndia', 'TaxReliefOutsideIndiaDTAA', 'TaxReliefOutsideIndiaNotDTAA']],
  ['Schedule5A2014', 'Schedule 5A — Portuguese Civil Code apportionment', ['NameOfSpouse', 'PANOfSpouse', 'HPHeadIncome', 'CapGainHeadIncome', 'OtherSourcesHeadIncome', 'TotalHeadIncome']],
  ['ScheduleAL', 'Schedule AL — Assets & liabilities', ['MovableAsset', 'LiabilityInRelatAssets']],
  ['ScheduleAL.MovableAsset', 'Schedule AL — movable assets', ['DepositsInBank', 'SharesAndSecurities', 'InsurancePolicies', 'LoansAndAdvancesGiven', 'CashInHand', 'JewelleryBullionEtc', 'ArchCollDrawPaintSulpArt', 'VehiclYachtsBoatsAircrafts']],
  ['ScheduleIT', 'Schedule IT — advance / self-assessment tax', ['TotalTaxPayments']],
  ['ScheduleTDS1', 'Schedule TDS1 — TDS on salary', ['TotalTDSonSalaries']],
  ['ScheduleTDS2', 'Schedule TDS2 — TDS other than on salary', ['TotalTDSonOthThanSals']],
  ['ScheduleTDS3', 'Schedule TDS3 — TDS u/s 194IA / 194IB / 194M / 194S', ['TotalTDS3OnOthThanSal']],
  ['ScheduleTCS', 'Schedule TCS', ['TotalSchTCS']],
  ['TaxReturnPreparer', 'Tax return preparer (TRP)', ['IdentificationNoOfTRP', 'NameOfTRP', 'ReImbFrmGov']],
  ['ScheduleESOP', 'Schedule — tax deferred on ESOP', ['PanofStartUp', 'DPIITRegNo', 'TotalTaxAttributedAmt']],
];

/* Quarterly break-up objects: each requires the five statutory date ranges. */
const QUARTERS = ['Upto15Of6', 'Upto15Of9', 'Up16Of9To15Of12', 'Up16Of12To15Of3', 'Up16Of3To31Of3'];
const QTR_BLOCKS: Array<[string, string]> = [
  ['ScheduleOS.IncFrmLottery', 'Schedule OS — winnings from lotteries etc. (quarterly)'],
  ['ScheduleOS.IncFrmOnGames', 'Schedule OS — winnings from online games (quarterly)'],
  ['ScheduleOS.DividendIncUs115BBDA', 'Schedule OS — dividend u/s 115BBDA (quarterly)'],
  ['ScheduleOS.DividendIncUs115BBDAaiii', 'Schedule OS — dividend u/s 115BBDA(a)(iii) (quarterly)'],
  ['ScheduleOS.DividendIncUs115A1ai', 'Schedule OS — dividend u/s 115A(1)(a)(i) (quarterly)'],
  ['ScheduleOS.DividendIncUs115A1aA', 'Schedule OS — dividend under the proviso to s.115A(1)(a)(A) (quarterly)'],
  ['ScheduleOS.DividendIncUs115AC', 'Schedule OS — dividend u/s 115AC (quarterly)'],
  ['ScheduleOS.DividendIncUs115ACA', 'Schedule OS — dividend u/s 115ACA (quarterly)'],
  ['ScheduleOS.DividendIncUs115AD1i', 'Schedule OS — dividend u/s 115AD(1)(i) (quarterly)'],
  ['ScheduleOS.DividendDTAA', 'Schedule OS — dividend taxable at DTAA rates (quarterly)'],
  ['ScheduleOS.NOT89A', 'Schedule OS — retirement-benefit income u/s 89A (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per', 'Schedule CG Table F — STCG @15% (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per', 'Schedule CG Table F — STCG @20% (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per', 'Schedule CG Table F — STCG @30% (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate', 'Schedule CG Table F — STCG at applicable rates (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate', 'Schedule CG Table F — STCG at DTAA rates (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per', 'Schedule CG Table F — LTCG @10% (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per', 'Schedule CG Table F — LTCG @12.5% (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per', 'Schedule CG Table F — LTCG @20% (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate', 'Schedule CG Table F — LTCG at DTAA rates (quarterly)'],
  ['ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per', 'Schedule CG Table F — VDA gains @30% (quarterly)'],
];
for (const [p, label] of QTR_BLOCKS) WHEN_PRESENT.push([`${p}.DateRange`, label, QUARTERS]);

/* Schedule CG Table E: each rate row requires its income, its gain and the
   set-off columns of every OTHER rate that may be set off against it. */
const STCL_COLS = ['StclSetoff15Per', 'StclSetoff20Per', 'StclSetoff30Per', 'StclSetoffAppRate', 'StclSetoffDTAARate'];
const LTCL_COLS = ['LtclSetOff10Per', 'LtclSetOff12_5Per', 'LtclSetOff20Per', 'LtclSetOffDTAARate'];
const CG_E_ROWS: Array<[key: string, own: string, isLong: boolean, label: string]> = [
  ['InStcg15Per', 'StclSetoff15Per', false, 'STCG @15%'],
  ['InStcg20Per', 'StclSetoff20Per', false, 'STCG @20%'],
  ['InStcg30Per', 'StclSetoff30Per', false, 'STCG @30%'],
  ['InStcgAppRate', 'StclSetoffAppRate', false, 'STCG at applicable rates'],
  ['InStcgDTAARate', 'StclSetoffDTAARate', false, 'STCG at DTAA rates'],
  ['InLtcg10Per', 'LtclSetOff10Per', true, 'LTCG @10%'],
  ['InLtcg12_5Per', 'LtclSetOff12_5Per', true, 'LTCG @12.5%'],
  ['InLtcg20Per', 'LtclSetOff20Per', true, 'LTCG @20%'],
  ['InLtcgDTAARate', 'LtclSetOffDTAARate', true, 'LTCG at DTAA rates'],
];
for (const [key, own, isLong, label] of CG_E_ROWS) {
  const cols: string[] = ['CurrYearIncome'];
  for (const c of STCL_COLS) if (c !== own) cols.push(c);
  if (isLong) for (const c of LTCL_COLS) if (c !== own) cols.push(c);
  cols.push('CurrYrCapGain');
  WHEN_PRESENT.push([`ScheduleCGFor23.CurrYrLosses.${key}`, `Schedule CG Table E — ${label}`, cols]);
}
for (const [key, label] of [['InLossSetOff', 'loss to be set off'], ['TotLossSetOff', 'total loss set off'], ['LossRemainSetOff', 'loss remaining after set-off']] as Array<[string, string]>) {
  WHEN_PRESENT.push([`ScheduleCGFor23.CurrYrLosses.${key}`, `Schedule CG Table E — ${label}`, STCL_COLS.concat(LTCL_COLS)]);
}
/* s.48 deduction sub-blocks. */
const DEDUCT48 = ['AquisitCost', 'ImproveCost', 'ExpOnTrans', 'TotalDedn'];
for (const p of [
  'ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48',
  'ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48',
  'ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48',
  'ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48',
  'ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48',
]) {
  WHEN_PRESENT.push([p, 'Schedule CG — deduction u/s 48', DEDUCT48]);
}

/* ════════════════════════════════════════════════════════════════════════════
 * 3. Per-ROW required fields of every repeating table (checked element-wise).
 * ════════════════════════════════════════════════════════════════════════════ */

const LOAN_ROW = ['LoanTknFrom', 'BankOrInstnName', 'LoanAccNoOfBankOrInstnRefNo', 'DateofLoan', 'TotalLoanAmt', 'LoanOutstndngAmt'];
const DONEE_ROW = ['DoneeWithPanName', 'DoneePAN', 'AddressDetail', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'EligibleDonationAmt'];
const SCRIP_ROW = ['ShareOnOrBefore', 'ISINCode', 'ShareUnitName', 'TotSaleValue', 'CostAcqWithoutIndx', 'AcquisitionCost', 'LTCGBeforelowerB1B2', 'FairMktValuePerShareunit', 'TotFairMktValueCapAst', 'ExpExclCnctTransfer', 'TotalDeductions', 'Balance'];
const CG_DTAA_ROW = ['DTAAamt', 'ItemNoincl', 'CountryName', 'CountryCodeExcludingIndia', 'DTAAarticle', 'RateAsPerTreaty', 'SecITAct', 'RateAsPerITAct'];
const INS_80D_ROW = ['InsurerName', 'PolicyNo', 'HealthInsAmt'];
const CHALLAN_ROW = ['BSRCode', 'DateDep', 'SrlNoOfChaln', 'Amt'];

const ROW_REQUIRED: Block[] = [
  ['PartA_139_8A.UpdatingInc.ReasonsForUpdatingIncDtls', 'Reasons for updating income', ['ReasonsForUpdatingIncome']],
  ['PartB-ATI.ScheduleIT1.TaxPayment1.TaxPayments', 'Part B-ATI — tax payments (table 1)', CHALLAN_ROW],
  ['PartB-ATI.ScheduleIT2.TaxPayment2.TaxPayments', 'Part B-ATI — tax payments (table 2)', CHALLAN_ROW],
  [`${FS}.clauseiv7provisio139iDtls`, 'Seventh proviso 139(1) clause (iv) details', ['clauseiv7provisio139iNature', 'clauseiv7provisio139iAmount']],
  [`${FS}.JurisdictionResPrevYr.JurisdictionResPrevYrDtls`, 'Jurisdiction of residence (non-resident)', ['JurisdictionResidence', 'TIN']],
  [`${FS}.CompDirectorPrvYr.CompDirectorPrvYrDtls`, 'Directorship in a company', ['NameOfCompany', 'CompanyType', 'SharesTypes']],
  [`${FS}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`, 'Unlisted equity shares held', ['NameOfCompany', 'CompanyType', 'OpngBalNumberOfShares', 'OpngBalCostOfAcquisition', 'ClsngBalNumberOfShares', 'ClsngBalCostOfAcquisition']],
  ['ScheduleS.Salaries', 'Schedule S — employer', ['NameOfEmployer', 'NatureOfEmployment', 'AddressDetail', 'Salarys']],
  ['ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls', 'Schedule S — allowance exempt u/s 10', ['SalNatureDesc', 'SalOthAmount']],
  ['ScheduleHP.PropertyDetails', 'Schedule HP — property', ['HPSNo', 'AddressDetailWithZipCode', 'PropertyOwner', 'PropCoOwnedFlg', 'AsseseeShareProperty', 'ifLetOut', 'Rentdetails']],
  ['ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls', 'Schedule CG A1 — STCG on land / building', ['FullConsideration50C', 'AquisitCost', 'ImproveCost', 'ExpOnTrans', 'TotalDedn', 'Balance', 'DeductionUs54B', 'STCGonImmvblPrprty']],
  ['ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT', 'Schedule CG A2 — STCG on STT-paid equity / units', ['MFSectionCode', 'EquityMFonSTTDtls', 'EquityMFonSTTDtls_BE', 'TotalCapGainonassets']],
  ['ScheduleCGFor23.ShortTermCapGainFor23.UnutilizedCg.UnutilizedCgPrvYrDtls', 'Schedule CG A7 — unutilised STCG of earlier years', ['PrvYrInWhichAsstTrnsfrd', 'SectionClmd', 'AmtUnutilized']],
  ['ScheduleCGFor23.ShortTermCapGainFor23.NRICgDTAA.NRIDTAADtls', 'Schedule CG A8 — STCG taxable at DTAA rates', CG_DTAA_ROW],
  ['ScheduleCGFor23.ShortTermCapGainFor23.CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls', 'Schedule CG — STCL on a buy-back of shares', ['Rate', 'Amount']],
  ['ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls', 'Schedule CG B1 — LTCG on land / building', ['FullConsideration50C', 'AquisitCost', 'AquisitCostIndex', 'ExpOnTrans', 'TotalDedn', 'Balance', 'ExemptionOrDednUs54', 'LTCGonImmvblPrprty']],
  ['ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable', 'Schedule CG B3 — proviso to s.112(1)', ['Proviso112SectionCode', 'Proviso112Applicabledtls_BE', 'Proviso112Applicabledtls', 'CapgainonAssets']],
  ['ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115.NRIOnSec115ADDtls', 'Schedule CG B7 — LTCG u/s 115AD', ['SectionCode', 'FullValueConsdRecvUnqshr', 'FairMrktValueUnqshr', 'FullValueConsdSec50CA', 'FullValueConsdOthUnqshr', 'FullConsideration', 'DeductSec48', 'BalanceCG', 'DeductionUs54F', 'CapgainonAssets']],
  ['ScheduleCGFor23.LongTermCapGain23.UnutilizedCg.UnutilizedCgPrvYrDtls', 'Schedule CG B10 — unutilised LTCG of earlier years', ['PrvYrInWhichAsstTrnsfrd', 'SectionClmd', 'AmtUnutilized', 'DateofWithdrawalBE']],
  ['ScheduleCGFor23.LongTermCapGain23.NRICgDTAA.NRIDTAADtls', 'Schedule CG B12 — LTCG taxable at DTAA rates', CG_DTAA_ROW],
  ['ScheduleCGFor23.LongTermCapGain23.CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls', 'Schedule CG — LTCL on a buy-back of shares', ['Rate', 'Amount']],
  ['ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54', 'Schedule CG Table D — deduction u/s 54', ['DateofTransfer', 'AmtDeducted']],
  ['ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54B', 'Schedule CG Table D — deduction u/s 54B', ['DateofTransfer', 'AmtDeducted']],
  ['ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54EC', 'Schedule CG Table D — deduction u/s 54EC', ['DateofTransfer', 'AmtDeducted']],
  ['ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54F', 'Schedule CG Table D — deduction u/s 54F', ['DateofTransfer', 'AmtDeducted']],
  ['ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs115F', 'Schedule CG Table D — deduction u/s 115F', ['DateofTransfer', 'AmtInvested', 'DateofInvestment', 'AmtDeducted']],
  ['Schedule112A.Schedule112ADtls', 'Schedule 112A — scrip', SCRIP_ROW],
  ['Schedule115AD.Schedule115ADDtls', 'Schedule 115AD(1)(b)(iii) proviso — scrip', SCRIP_ROW],
  ['ScheduleVDA.ScheduleVDADtls', 'Schedule VDA — transfer of a virtual digital asset', ['DateofAcquisition', 'DateofTransfer', 'HeadUndIncTaxed', 'AcquisitionCost', 'ConsidReceived', 'IncomeFromVDA']],
  ['ScheduleOS.IncOthThanOwnRaceHorse.OthersInc.OthersIncDtls', 'Schedule OS — other income', ['OthNatOfInc', 'OthAmount']],
  ['ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls', 'Schedule OS 2c — accumulated PF balance taxable u/s 111', ['AssessmentYear', 'IncomeBenefit', 'TaxBenefit']],
  ['ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS', 'Schedule OS 2f — income taxable at DTAA rates', ['DTAAamt', 'NatureOfIncome', 'CountryName', 'CountryCodeExcludingIndia', 'DTAAarticle', 'RateAsPerTreaty', 'ItemNoincl', 'RateAsPerITAct']],
  ['Schedule80C.Schedule80CDtls', 'Schedule 80C — investment', ['IdentificationNo', 'Amount']],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamHIDtls.Sch80DInsDtls', 'Schedule 80D 1a — self & family policy', INS_80D_ROW],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DSelfFamSrCtznHIDtls.Sch80DInsDtls', 'Schedule 80D 1b — self & family (senior citizen) policy', INS_80D_ROW],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsHIDtls.Sch80DInsDtls', 'Schedule 80D 2a — parents policy', INS_80D_ROW],
  ['Schedule80D.Sec80DSelfFamSrCtznHealth.Sec80DParentsSrCtznHIDtls.Sch80DInsDtls', 'Schedule 80D 2b — parents (senior citizen) policy', INS_80D_ROW],
  ['Schedule80G.Don100Percent.DoneeWithPan', 'Schedule 80G (A) — donee', DONEE_ROW],
  ['Schedule80G.Don50PercentNoApprReqd.DoneeWithPan', 'Schedule 80G (B) — donee', DONEE_ROW],
  ['Schedule80G.Don100PercentApprReqd.DoneeWithPan', 'Schedule 80G (C) — donee', DONEE_ROW],
  ['Schedule80G.Don50PercentApprReqd.DoneeWithPan', 'Schedule 80G (D) — donee', DONEE_ROW],
  ['Schedule80GGC.Schedule80GGCDetails', 'Schedule 80GGC — contribution', ['DonationDate', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'EligibleDonationAmt']],
  ['Schedule80E.Schedule80EDtls', 'Schedule 80E — education loan', LOAN_ROW.concat(['Interest80E'])],
  ['Schedule80EE.Schedule80EEDtls', 'Schedule 80EE — housing loan', LOAN_ROW.concat(['Interest80EE'])],
  ['Schedule80EEA.Schedule80EEADtls', 'Schedule 80EEA — housing loan', LOAN_ROW.concat(['Interest80EEA'])],
  ['Schedule80EEB.Schedule80EEBDtls', 'Schedule 80EEB — electric-vehicle loan', LOAN_ROW.concat(['VehicleRegNo', 'Interest80EEB'])],
  ['Schedule80GGA.DonationDtlsSciRsrchRuralDev', 'Schedule 80GGA — donation', ['RelevantClauseUndrDedClaimed', 'NameOfDonee', 'AddressDetail', 'DoneePAN', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'EligibleDonationAmt']],
  ['ScheduleAMTC.ScheduleAMTCDtls', 'Schedule AMTC — AMT credit by assessment year', ['AssYr', 'Gross', 'AmtCreditSetOfEy', 'AmtCreditBalBroughtFwd', 'AmtCreditUtilized', 'BalAmtCreditCarryFwd']],
  ['ScheduleSPI.SpecifiedPerson', 'Schedule SPI — income of another person clubbed', ['SpecifiedPersonName', 'ReltnShip', 'AmtIncluded', 'HeadIncIncluded']],
  ['ScheduleSI.SplCodeRateTax', 'Schedule SI — special-rate income', ['SecCode', 'SplRatePercent', 'SplRateInc', 'SplRateIncTax']],
  ['ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls', 'Schedule EI — agricultural land', ['NameOfDistrict', 'PinCode', 'MeasurementOfLand', 'AgriLandOwnedFlag', 'AgriLandIrrigatedFlag']],
  ['ScheduleEI.OthersInc.OthersIncDtls', 'Schedule EI — other exempt income', ['NatureDesc', 'OthAmount']],
  ['ScheduleEI.IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls', 'Schedule EI — income not chargeable as per a DTAA', ['AmountOfIncome', 'NatureOfIncome', 'CountryName', 'CountryCodeExcludingIndia', 'ArticleOfDTAA', 'HeadOfIncome', 'TRCFlag']],
  ['SchedulePTI.SchedulePTIDtls', 'Schedule PTI — pass-through income', ['InvstmntCvrdUs115UA115UB', 'BusinessName', 'BusinessPAN', 'IncFromHP', 'CapitalGainsPTI', 'IncClmdPTI', 'IncOthSrc', 'OS_Dividend', 'OS_Others']],
  ['ScheduleFSI.ScheduleFSIDtls', 'Schedule FSI — foreign-source income', ['CountryName', 'CountryCodeExcludingIndia', 'TaxIdentificationNo', 'IncFromSal', 'IncFromHP', 'IncCapGain', 'IncOthSrc', 'TotalCountryWise']],
  ['ScheduleTR1.ScheduleTR', 'Schedule TR — relief for foreign tax', ['CountryName', 'CountryCodeExcludingIndia', 'TaxIdentificationNo', 'TaxPaidOutsideIndia', 'TaxReliefOutsideIndia']],
  ['ScheduleFA.DetailsForiegnBank', 'Schedule FA (A1) — foreign depository account', ['CountryName', 'CountryCodeExcludingIndia', 'Bankname', 'AddressOfBank', 'ZipCode', 'ForeignAccountNumber', 'OwnerStatus', 'AccOpenDate', 'PeakBalanceDuringYear', 'ClosingBalance', 'IntrstAccured']],
  ['ScheduleFA.DtlsForeignCustodialAcc', 'Schedule FA (A2) — foreign custodial account', ['CountryName', 'CountryCodeExcludingIndia', 'FinancialInstName', 'FinancialInstAddress', 'ZipCode', 'AccountNumber', 'Status', 'AccOpenDate', 'PeakBalanceDuringPeriod', 'ClosingBalance', 'GrossAmtPaidCredited', 'NatureOfAmount']],
  ['ScheduleFA.DtlsForeignEquityDebtInterest', 'Schedule FA (A3) — foreign equity / debt interest', ['CountryName', 'CountryCodeExcludingIndia', 'NameOfEntity', 'AddressOfEntity', 'ZipCode', 'NatureOfEntity', 'InterestAcquiringDate', 'InitialValOfInvstmnt', 'PeakBalanceDuringPeriod', 'ClosingBalance', 'TotGrossAmtPaidCredited', 'TotGrossProceeds']],
  ['ScheduleFA.DtlsForeignCashValueInsurance', 'Schedule FA (A4) — foreign cash-value insurance contract', ['CountryName', 'CountryCodeExcludingIndia', 'FinancialInstName', 'FinancialInstAddress', 'ZipCode', 'ContractDate', 'CashValOrSurrenderVal', 'TotGrossAmtPaidCredited']],
  ['ScheduleFA.DetailsFinancialInterest', 'Schedule FA (B) — financial interest in an entity', ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameOfEntity', 'AddressOfEntity', 'NatureOfInt', 'DateHeld', 'TotalInvestment', 'IncFromInt', 'NatureOfInc', 'IncTaxAmt', 'IncTaxSch', 'IncTaxSchNo']],
  ['ScheduleFA.DetailsImmovableProperty', 'Schedule FA (C) — immovable property outside India', ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'Ownership', 'DateOfAcq', 'TotalInvestment', 'IncDrvProperty', 'NatureOfInc', 'IncTaxAmt', 'IncTaxSch', 'IncTaxSchNo']],
  ['ScheduleFA.DetailsOthAssets', 'Schedule FA (D) — other capital assets outside India', ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NatureOfAsset', 'Ownership', 'DateOfAcq', 'TotalInvestment', 'IncDrvAsset', 'NatureOfInc', 'IncTaxAmt', 'IncTaxSch', 'IncTaxSchNo']],
  ['ScheduleFA.DetailsOfAccntsHvngSigningAuth', 'Schedule FA (E) — account with signing authority', ['NameOfInstitution', 'AddressOfInstitution', 'CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameMentionedInAccnt', 'InstitutionAccountNumber', 'PeakBalanceOrInvestment', 'IncAccuredTaxFlag']],
  ['ScheduleFA.DetailsOfTrustOutIndiaTrustee', 'Schedule FA (F) — trust outside India', ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameOfTrust', 'AddressOfTrust', 'NameOfOtherTrustees', 'AddressOfOtherTrustees', 'NameOfSettlor', 'AddressOfSettlor', 'NameOfBeneficiaries', 'AddressOfBeneficiaries', 'DateHeld', 'IncDrvTaxFlag']],
  ['ScheduleFA.DetailsOfOthSourcesIncOutsideIndia', 'Schedule FA (G) — other income outside India', ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameOfPerson', 'AddressOfPerson', 'NatureOfInc', 'IncDrvTaxFlag']],
  ['ScheduleAL.ImmovableDetails', 'Schedule AL — immovable asset', ['Description', 'AddressAL', 'Amount']],
  [`${TTI}.Refund.BankAccountDtls.AddtnlBankDetails`, 'Bank account', ['IFSCCode', 'BankName', 'BankAccountNo', 'AccountType', 'UseForRefund']],
  [`${TTI}.Refund.BankAccountDtls.ForeignBankDetails`, 'Foreign bank account (non-resident refund)', ['SWIFTCode', 'BankName', 'IBAN', 'CountryCode']],
  ['ScheduleIT.TaxPayment', 'Schedule IT — tax payment challan', CHALLAN_ROW],
  ['ScheduleTDS1.TDSonSalary', 'Schedule TDS1 — TDS on salary', ['EmployerOrDeductorOrCollectDetl', 'IncChrgSal', 'TotalTDSSal']],
  ['ScheduleTDS2.TDSOthThanSalaryDtls', 'Schedule TDS2 — TDS other than on salary', ['TDSCreditName', 'TANOfDeductor', 'TDSSection', 'TaxDeductCreditDtls', 'AmtCarriedFwd']],
  ['ScheduleTDS3.TDS3onOthThanSalDtls', 'Schedule TDS3 — TDS u/s 194IA / 194IB / 194M / 194S', ['TDSCreditName', 'PANOfBuyerTenant', 'TDSSection', 'TaxDeductCreditDtls', 'AmtCarriedFwd']],
  ['ScheduleTCS.TCS', 'Schedule TCS — tax collected at source', ['TCSCreditOwner', 'EmployerOrDeductorOrCollectTAN']],
];

/* ════════════════════════════════════════════════════════════════════════════
 * 4. Identity-critical patterns and enums taken from the schema. An invalid
 *    value is rejected on upload exactly like a missing one, so these land in
 *    errors[] under the rule id "SCHEMA".
 * ════════════════════════════════════════════════════════════════════════════ */

const DATE_RE = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const TAN_RE = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

const PATTERNS: Array<[path: string, re: RegExp, msg: string]> = [
  ['Form_ITR2.FormName', /^ITR-2$/, 'FormName must be exactly "ITR-2"'],
  ['Form_ITR2.AssessmentYear', /^2025$/, 'AssessmentYear must be "2025" for AY 2025-26'],
  ['Form_ITR2.SchemaVer', /^Ver1\.0$/, 'SchemaVer must be "Ver1.0"'],
  ['Form_ITR2.FormVer', /^Ver1\.0$/, 'FormVer must be "Ver1.0"'],
  ['CreationInfo.SWCreatedBy', /^SW[0-9]{8}$/, 'SWCreatedBy must be "SW" followed by 8 digits'],
  ['CreationInfo.JSONCreatedBy', /^SW[0-9]{8}$/, 'JSONCreatedBy must be "SW" followed by 8 digits'],
  ['CreationInfo.JSONCreationDate', DATE_RE, 'The JSON creation date must be YYYY-MM-DD'],
  [`${PI}.PAN`, PAN_RE, 'The PAN of the assessee is not in the valid AAAAA9999A format'],
  [`${PI}.DOB`, DATE_RE, 'The date of birth / formation must be YYYY-MM-DD'],
  [`${PI}.Address.EmailAddress`, /^[.a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+([a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+)+$/, 'The e-mail address is not valid'],
  ['Verification.Declaration.AssesseeVerPAN', /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/, 'The PAN of the person verifying must be an individual PAN (4th character "P")'],
  [`${FS}.ItrFilingDueDate`, /^2025-07-31$/, 'The ITR filing due date must be 2025-07-31 for AY 2025-26'],
  [`${FS}.NoticeDate`, DATE_RE, 'The date of the notice / order must be YYYY-MM-DD'],
  [`${FS}.OrigRetFiledDate`, DATE_RE, 'The date of filing of the original return must be YYYY-MM-DD'],
  [`${FS}.ReceiptNo`, /^[0-9]{15}$/, 'The acknowledgement number of the original return must be 15 digits'],
  ['Verification.Date', DATE_RE, 'The verification date must be YYYY-MM-DD'],
];

const ENUMS: Array<[path: string, allowed: Array<string | number>, msg: string]> = [
  [`${PI}.Status`, ['I', 'H'], 'Status must be I (Individual) or H (HUF)'],
  [`${FS}.ReturnFileSec`, [11, 12, 13, 14, 16, 17, 18, 19, 20, 21], 'The section under which the return is filed is not a valid code'],
  [`${FS}.OptOutNewTaxRegime`, ['Y', 'N'], 'Opting out of the new tax regime must be Y or N'],
  [`${FS}.SeventhProvisio139`, ['Y', 'N'], 'The Seventh proviso to s.139(1) flag must be Y or N'],
  [`${FS}.ResidentialStatus`, ['RES', 'NRI', 'NOR'], 'The residential status must be RES, NRI or NOR'],
  [`${FS}.HeldUnlistedEqShrPrYrFlg`, ['Y', 'N'], 'The unlisted-equity-shares flag must be Y or N'],
  [`${FS}.FiiFpiFlag`, ['Y', 'N'], 'The FII/FPI flag must be Y or N'],
  [`${FS}.AsseseeRepFlg`, ['Y', 'N'], 'The representative-assessee flag must be Y or N'],
  [`${FS}.PortugeseCC5A`, ['Y', 'N'], 'The Portuguese Civil Code (s.5A) flag must be Y or N'],
  [`${FS}.CompDirectorPrvYrFlg`, ['Y', 'N'], 'The directorship flag must be Y or N'],
  [`${FS}.BenefitUs115HFlg`, ['Y', 'N'], 'The benefit u/s 115H flag must be Y or N'],
  [`${FS}.AssesseeRep.RepCapacity`, ['L', 'M', 'G', 'O'], 'The capacity of the representative must be L, M, G or O'],
  ['Verification.Capacity', ['S', 'R', 'K', 'A'], 'The verification capacity must be S, R, K or A'],
  [`${TTI}.AssetOutIndiaFlag`, ['YES', 'NO'], 'The assets-outside-India flag must be YES or NO'],
  [`${TTI}.Refund.BankAccountDtls.BankDtlsFlag`, ['Y', 'N'], 'The bank-details flag must be Y or N'],
];

/* Count of distinct required leaf paths this module checks (reported by tests). */
export const REQUIRED_PATH_COUNT: number = (() => {
  let n = REQUIRED.length;
  for (const [, , f] of WHEN_PRESENT) n += f.length;
  for (const [, , f] of ROW_REQUIRED) n += f.length;
  return n;
})();

/* ════════════════════════════════════════════════════════════════════════════
 * 5. Small helpers
 * ════════════════════════════════════════════════════════════════════════════ */

/** Numeric coercion: undefined / null / '' → 0; numeric strings honoured. */
function num(v: unknown): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  return 0;
}
function str(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v === undefined || v === null) return '';
  return String(v);
}
function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function rows(v: unknown): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  if (!Array.isArray(v)) return out;
  for (const r of v) if (isObj(r)) out.push(r);
  return out;
}
/** Sum of a numeric field over the rows of a repeating table. */
function sumRows(v: unknown, field: string): number {
  let t = 0;
  for (const r of rows(v)) t += num(r[field]);
  return t;
}

/* ════════════════════════════════════════════════════════════════════════════
 * 6. The checker
 * ════════════════════════════════════════════════════════════════════════════ */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];
  const ROOT = 'ITR.ITR2';

  /** Value at a path under ITR.ITR2. */
  const g = (p: string): unknown => at(json, `${ROOT}.${p}`);
  const err = (rule: string, path: string, msg: string): void => {
    errors.push({ path: `${ROOT}.${path}`, msg, rule });
  };
  const warn = (rule: string, path: string, msg: string): void => {
    warnings.push({ path: `${ROOT}.${path}`, msg, rule });
  };
  /** Arithmetic identity; the tolerance absorbs the portal's rounding. */
  const eq = (rule: string, path: string, actual: number, expected: number, msg: string, tol = 1): void => {
    if (Math.abs(actual - expected) > tol) {
      err(rule, path, `${msg} — the return shows ${actual} against ${expected}`);
    }
  };

  try {
    /* ── 6.0 Root shape ─────────────────────────────────────────────────── */
    if (!isObj(at(json, ROOT))) {
      missing.push({ path: ROOT, label: 'The ITR-2 payload root { ITR: { ITR2: … } } is absent or is not an object' });
    }

    /* ── 6.1 Unconditional required leaves ──────────────────────────────── */
    for (const [p, label, hint] of REQUIRED) {
      if (isEmpty(g(p))) missing.push(hint ? { path: `${ROOT}.${p}`, label, hint } : { path: `${ROOT}.${p}`, label });
    }

    /* ── 6.2 Required children of optional blocks that ARE present ──────── */
    for (const [path, label, fields] of WHEN_PRESENT) {
      const node = g(path);
      if (!isObj(node)) continue;
      for (const f of fields) {
        if (isEmpty(node[f])) {
          missing.push({
            path: `${ROOT}.${path}.${f}`,
            label: `${label} is filled but its required field "${f}" is empty`,
            hint: 'Complete the block, or remove it entirely if it does not apply',
          });
        }
      }
    }

    /* ── 6.3 Per-row required fields of every repeating table ───────────── */
    for (const [path, label, fields] of ROW_REQUIRED) {
      const list = g(path);
      if (!Array.isArray(list) || list.length === 0) continue;
      list.forEach((row, i) => {
        if (!isObj(row)) {
          missing.push({ path: `${ROOT}.${path}[${i}]`, label: `${label} — row ${i + 1} is not a valid entry` });
          return;
        }
        for (const f of fields) {
          if (isEmpty(row[f])) {
            missing.push({ path: `${ROOT}.${path}[${i}].${f}`, label: `${label} — row ${i + 1}: "${f}" is required` });
          }
        }
      });
    }

    /* ── 6.4 Patterns and enums ─────────────────────────────────────────── */
    for (const [p, re, msg] of PATTERNS) {
      const v = g(p);
      if (!isEmpty(v) && !re.test(str(v))) err('SCHEMA', p, `${msg} (found "${str(v)}")`);
    }
    for (const [p, allowed, msg] of ENUMS) {
      const v = g(p);
      if (isEmpty(v)) continue;
      let ok = false;
      for (const a of allowed) if (a === v || String(a) === str(v)) ok = true;
      if (!ok) err('SCHEMA', p, `${msg} (found "${str(v)}")`);
    }

    /* ── 6.5 Values the Category-A rules work on ────────────────────────── */
    const status = str(g(`${PI}.Status`));                        // I | H
    const isHUF = status === 'H';
    const resStatus = str(g(`${FS}.ResidentialStatus`));          // RES | NRI | NOR
    const isNRI = resStatus === 'NRI';
    const optOut = str(g(`${FS}.OptOutNewTaxRegime`));            // Y = OLD regime
    const oldRegime = optOut === 'Y';
    const newRegime = optOut === 'N';
    const retSec = num(g(`${FS}.ReturnFileSec`));
    const dob = str(g(`${PI}.DOB`));
    /** Completed years as on 31-03-2025 — drives the senior-citizen rules. */
    const age = DATE_RE.test(dob) ? Math.floor((Date.UTC(2025, 2, 31) - Date.parse(dob)) / 31557600000) : -1;
    const isSenior = status === 'I' && age >= 60;
    const totalIncome = num(g(`${TI}.TotalIncome`));
    const gti = num(g(`${TI}.GrossTotalIncome`));
    const rebate87A = num(g(`${CTL}.Rebate87A`));
    const assesseePAN = str(g(`${PI}.PAN`));
    const verifierPAN = str(g('Verification.Declaration.AssesseeVerPAN'));
    /** System-computed Chapter VI-A deduction. */
    const via = (f: string): number => num(g(`ScheduleVIA.DeductUndChapVIA.${f}`));
    /** User-entered Chapter VI-A particulars. */
    const viaUsr = (f: string): unknown => g(`ScheduleVIA.UsrDeductUndChapVIA.${f}`);
    const claimed = (f: string): number => Math.max(via(f), num(viaUsr(f)));

    /* ═══════════ Part A — general, filing status, identity ═══════════ */

    /* A1 — a valid mobile number. */
    {
      const mob = g(`${PI}.Address.MobileNo`);
      if (!isEmpty(mob)) {
        const s = str(mob);
        if (!/^[1-9][0-9]{4,9}$/.test(s)) {
          err('A1', `${PI}.Address.MobileNo`, 'The mobile number is not valid (5 to 10 digits and it must not start with 0)');
        } else if (num(g(`${PI}.Address.CountryCodeMobile`)) === 91 && !/^[1-9][0-9]{9}$/.test(s)) {
          err('A1', `${PI}.Address.MobileNo`, 'An Indian (+91) mobile number must be exactly 10 digits');
        }
      }
    }
    /* A723 — the date of birth / formation must precede the assessment year. */
    if (dob && DATE_RE.test(dob) && dob >= '2025-04-01') {
      err('A723', `${PI}.DOB`, 'The date of birth / formation must be before 01-04-2025 for AY 2025-26');
    }
    /* A5 — unlisted equity shares held, so the details are mandatory. */
    if (str(g(`${FS}.HeldUnlistedEqShrPrYrFlg`)) === 'Y' && isEmpty(g(`${FS}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`))) {
      err('A5', `${FS}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`, 'The unlisted-equity-shares flag is "Yes" but no share details are filled (Unlisted Equity Shares section)');
    }
    /* A6 / A14 / A472 — Portuguese Civil Code s.5A against Schedule 5A. */
    {
      const pcc = str(g(`${FS}.PortugeseCC5A`));
      const sch5A = g('Schedule5A2014');
      if (pcc === 'Y') {
        if (isEmpty(sch5A)) {
          err('A6', 'Schedule5A2014', 'The assessee is governed by the Portuguese Civil Code (s.5A) — Schedule 5A is mandatory');
        } else if (isEmpty(g('Schedule5A2014.PANOfSpouse'))) {
          err('A472', 'Schedule5A2014.PANOfSpouse', 'The assessee is governed by the Portuguese Civil Code — the PAN of the spouse must be provided');
        }
      }
      if (pcc === 'N' && !isEmpty(sch5A)) {
        err('A14', 'Schedule5A2014', 'The assessee is not governed by the Portuguese Civil Code — Schedule 5A must not be filed');
      }
    }
    /* A7 — a representative assessee needs the full block. */
    if (str(g(`${FS}.AsseseeRepFlg`)) === 'Y') {
      for (const f of ['RepName', 'RepCapacity', 'RepAddress']) {
        if (isEmpty(g(`${FS}.AssesseeRep.${f}`))) {
          err('A7', `${FS}.AssesseeRep.${f}`, `The return is filed by a representative assessee but "${f}" is empty (Representative Assessee, if any section)`);
        }
      }
      if (isEmpty(g(`${FS}.AssesseeRep.RepPAN`)) && isEmpty(g(`${FS}.AssesseeRep.RepAadhaar`))) {
        err('A7', `${FS}.AssesseeRep.RepPAN`, 'The return is filed by a representative assessee — the PAN (or Aadhaar) of the representative is mandatory');
      }
    }
    /* A480 — a verification capacity of "Representative" needs the Part A-GEN block. */
    if (str(g('Verification.Capacity')) === 'R') {
      if (isEmpty(g(`${FS}.AssesseeRep.RepName`)) || isEmpty(g(`${FS}.AssesseeRep.RepCapacity`)) ||
          isEmpty(g(`${FS}.AssesseeRep.RepAddress`)) ||
          (isEmpty(g(`${FS}.AssesseeRep.RepPAN`)) && isEmpty(g(`${FS}.AssesseeRep.RepAadhaar`)))) {
        err('A480', `${FS}.AssesseeRep`, 'The verification capacity is "Representative" — the name, capacity, address and PAN / Aadhaar of the representative are mandatory in Part A-GEN');
      }
    }
    /* A9 / A13 — the Seventh proviso to s.139(1). */
    if (str(g(`${FS}.SeventhProvisio139`)) === 'Y') {
      const anyFlag =
        str(g(`${FS}.DepAmtAggAmtExcd1CrPrYrFlg`)) === 'Y' ||
        str(g(`${FS}.IncrExpAggAmt2LkTrvFrgnCntryFlg`)) === 'Y' ||
        str(g(`${FS}.IncrExpAggAmt1LkElctrctyPrYrFlg`)) === 'Y' ||
        str(g(`${FS}.clauseiv7provisio139i`)) === 'Y';
      if (!anyFlag) {
        err('A9', FS, 'The return is filed under the Seventh proviso to s.139(1) — at least one qualifying condition (deposits above Rs.1 crore / foreign travel above Rs.2 lakh / electricity above Rs.1 lakh / clause (iv)) must be selected together with its amount');
      }
      const pairs: Array<[string, string, string]> = [
        ['DepAmtAggAmtExcd1CrPrYrFlg', 'AmtSeventhProvisio139i', 'aggregate deposits in current accounts above Rs.1 crore'],
        ['IncrExpAggAmt2LkTrvFrgnCntryFlg', 'AmtSeventhProvisio139ii', 'expenditure on foreign travel above Rs.2 lakh'],
        ['IncrExpAggAmt1LkElctrctyPrYrFlg', 'AmtSeventhProvisio139iii', 'expenditure on electricity above Rs.1 lakh'],
      ];
      for (const [flag, amt, what] of pairs) {
        if (str(g(`${FS}.${flag}`)) === 'Y' && num(g(`${FS}.${amt}`)) <= 0) {
          err('A9', `${FS}.${amt}`, `The Seventh-proviso condition for ${what} is selected — the corresponding amount must be entered`);
        }
      }
    }
    if (str(g(`${FS}.clauseiv7provisio139i`)) === 'Y' && isEmpty(g(`${FS}.clauseiv7provisio139iDtls`))) {
      err('A13', `${FS}.clauseiv7provisio139iDtls`, 'Clause (iv) of the Seventh proviso to s.139(1) is selected — the nature and amount details are mandatory');
    }
    /* A10 — a directorship needs the details. */
    if (str(g(`${FS}.CompDirectorPrvYrFlg`)) === 'Y' && isEmpty(g(`${FS}.CompDirectorPrvYr.CompDirectorPrvYrDtls`))) {
      err('A10', `${FS}.CompDirectorPrvYr.CompDirectorPrvYrDtls`, 'The director-in-a-company flag is "Yes" but no directorship details are filled (Directorship info. section)');
    }
    /* A15 — Schedule 115AD(1)(b)(iii) proviso belongs to an FII / FPI. */
    if (!isEmpty(g('Schedule115AD')) && str(g(`${FS}.FiiFpiFlag`)) !== 'Y') {
      err('A15', 'Schedule115AD', 'Schedule 115AD(1)(b)(iii)-proviso is filled but the FII / FPI flag is not "Yes"');
    }
    if (str(g(`${FS}.FiiFpiFlag`)) === 'Y' && isEmpty(g(`${FS}.SebiRegnNo`))) {
      warn('A15', `${FS}.SebiRegnNo`, 'The FII / FPI flag is "Yes" — the SEBI registration number should be provided');
    }
    /* A20 — residents and RNORs cannot be FII / FPIs. */
    if ((resStatus === 'RES' || resStatus === 'NOR') && str(g(`${FS}.FiiFpiFlag`)) === 'Y') {
      err('A20', `${FS}.FiiFpiFlag`, 'Residents and residents-but-not-ordinarily-resident cannot be FII / FPIs');
    }
    /* A16 — filed in response to a notice or order, so the DIN and date are needed. */
    if (retSec === 13 || retSec === 14 || retSec === 16 || retSec === 18 || retSec === 20) {
      if (isEmpty(g(`${FS}.NoticeNo`))) {
        err('A16', `${FS}.NoticeNo`, 'The return is filed in response to a notice / order — the unique number / Document Identification Number (DIN) is mandatory');
      }
      if (isEmpty(g(`${FS}.NoticeDate`))) {
        err('A16', `${FS}.NoticeDate`, 'The return is filed in response to a notice / order — the date of the notice / order is mandatory');
      }
    }
    /* A revised return needs the original acknowledgement number and date. */
    if (retSec === 17 || retSec === 19) {
      if (isEmpty(g(`${FS}.ReceiptNo`))) {
        err('SCHEMA', `${FS}.ReceiptNo`, 'For a revised return the acknowledgement number of the original return is mandatory');
      }
      if (isEmpty(g(`${FS}.OrigRetFiledDate`))) {
        err('SCHEMA', `${FS}.OrigRetFiledDate`, 'For a revised return the date of filing of the original return is mandatory');
      }
    }
    /* An updated return needs Part A 139(8A) and Part B-ATI. */
    if (retSec === 21) {
      if (isEmpty(g('PartA_139_8A'))) err('SCHEMA', 'PartA_139_8A', 'For an updated return u/s 139(8A) the Part A 139(8A) block is mandatory');
      if (isEmpty(g('PartB-ATI'))) err('SCHEMA', 'PartB-ATI', 'For an updated return u/s 139(8A) Part B-ATI (additional income-tax payable) is mandatory');
    }
    /* A18 / A19 / A21 / A576 — the old regime is not available in a belated return. */
    if (retSec === 12 && oldRegime) {
      err('A18', `${FS}.OptOutNewTaxRegime`, 'Opting out of the new tax regime is not available in a belated return filed after the due date u/s 139(1)');
    }
    /* A4 — a return originally filed u/s 142(1) cannot be revised. */
    if (retSec === 17 && str(g('PartA_139_8A.PreviouslyFiledForThisAY')) === '13') {
      err('A4', `${FS}.ReturnFileSec`, 'A return originally filed u/s 142(1) cannot be revised');
    }
    /* A83 / A157 — the s.115H option. */
    if (status === 'I' && (resStatus === 'RES' || resStatus === 'NOR') && isEmpty(g(`${FS}.BenefitUs115HFlg`))) {
      warn('A83', `${FS}.BenefitUs115HFlg`, 'For a resident / RNOR individual the question "do you want to claim the benefit u/s 115H?" should be answered');
    }
    if (resStatus === 'RES' && str(g(`${FS}.BenefitUs115HFlg`)) !== 'Y' && !isEmpty(g('ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115.NRIOnSec112and115Dtls'))) {
      err('A157', 'ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115', 'A resident cannot claim the tax benefit u/s 112(1)(c) / 115AC without having exercised the option u/s 115H');
    }
    /* A8 / A17 — verification identity. */
    if (assesseePAN && verifierPAN && str(g('Verification.Capacity')) === 'S' && assesseePAN !== verifierPAN) {
      err('A8', 'Verification.Declaration.AssesseeVerPAN', 'The verification capacity is "Self" but the PAN at verification differs from the PAN of the assessee');
    }
    if (isHUF && str(g('Verification.Capacity')) === 'S') {
      warn('A17', 'Verification.Capacity', 'For a HUF the return must be verified by the Karta — the capacity should be "K"');
    }

    /* ═══════════ Salary ═══════════ */

    if (num(g(`${TI}.Salaries`)) > 0 && isEmpty(g('ScheduleS'))) {
      err('A517', 'ScheduleS', 'Salary income is offered in Part B-TI but Schedule S (Salary) is not filled');
    }
    if (isObj(g('ScheduleS'))) {
      const grossAll = num(g('ScheduleS.TotalGrossSalary'));
      const exempt10 = num(g('ScheduleS.AllwncExtentExemptUs10'));
      const relief89A = num(g('ScheduleS.Increliefus89A'));
      const netSal = num(g('ScheduleS.NetSalary'));
      const ded16 = num(g('ScheduleS.DeductionUS16'));
      /* A23 — the gross salary of all employers. */
      {
        let t = 0;
        for (const r of rows(g('ScheduleS.Salaries'))) t += num(at(r.Salarys, 'GrossSalary'));
        if (t > 0) eq('A23', 'ScheduleS.TotalGrossSalary', grossAll, t, 'Schedule S — the total gross salary must be the sum of the gross salary of all employers');
      }
      eq('A25', 'ScheduleS.NetSalary', netSal, grossAll - exempt10 - relief89A, 'Schedule S — the net salary must be the gross salary less the allowances exempt u/s 10 and the relief u/s 89A');
      eq('A26', 'ScheduleS.DeductionUS16', ded16,
        num(g('ScheduleS.DeductionUnderSection16ia')) + num(g('ScheduleS.EntertainmntalwncUs16ii')) + num(g('ScheduleS.ProfessionalTaxUs16iii')),
        'Schedule S — the deduction u/s 16 must equal 16(ia) + 16(ii) + 16(iii)');
      eq('A27', 'ScheduleS.TotIncUnderHeadSalaries', num(g('ScheduleS.TotIncUnderHeadSalaries')), netSal - ded16, 'Schedule S — the income chargeable under Salaries must be the net salary less the s.16 deductions');
      const allwList = g('ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls');
      let hraClaimed = 0;
      if (Array.isArray(allwList) && allwList.length > 0) {
        /* A24 — the exempt allowances must equal the sum of the dropdowns. */
        eq('A24', 'ScheduleS.AllwncExtentExemptUs10', exempt10, sumRows(allwList, 'SalOthAmount'), 'Schedule S — the allowances exempt u/s 10 must equal the sum of the individual allowances');
        /* A51 — the same exempt allowance cannot be selected twice. */
        const seen: Record<string, boolean> = {};
        for (const r of rows(allwList)) {
          const k = str(r.SalNatureDesc);
          if (!k) continue;
          if (seen[k]) err('A51', 'ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls', `Schedule S — the exempt allowance "${k}" is selected more than once`);
          seen[k] = true;
          if (k.indexOf('13A') >= 0) hraClaimed += num(r.SalOthAmount);
        }
      }
      /* A37 — professional tax is capped at Rs.5,000. */
      if (num(g('ScheduleS.ProfessionalTaxUs16iii')) > 5000) {
        err('A37', 'ScheduleS.ProfessionalTaxUs16iii', 'The professional tax u/s 16(iii) cannot exceed Rs.5,000');
      }
      /* A40 / A655 — the standard deduction ceiling. */
      {
        const stdDed = num(g('ScheduleS.DeductionUnderSection16ia'));
        const cap = newRegime ? 75000 : 50000;
        if (stdDed > Math.min(cap, Math.max(netSal, 0))) {
          err(newRegime ? 'A655' : 'A40', 'ScheduleS.DeductionUnderSection16ia', `The standard deduction u/s 16(ia) cannot exceed the lower of Rs.${cap} and the net salary`);
        }
      }
      /* A57 / A58 — the new regime disallows 16(ii) and 16(iii). */
      if (newRegime && num(g('ScheduleS.EntertainmntalwncUs16ii')) > 0) {
        err('A57', 'ScheduleS.EntertainmntalwncUs16ii', 'The entertainment allowance u/s 16(ii) cannot be claimed under the new tax regime');
      }
      if (newRegime && num(g('ScheduleS.ProfessionalTaxUs16iii')) > 0) {
        err('A58', 'ScheduleS.ProfessionalTaxUs16iii', 'The professional tax u/s 16(iii) cannot be claimed under the new tax regime');
      }
      /* A674 / A722 / A54 — HRA. */
      if (hraClaimed > 0) {
        if (!isObj(g('ScheduleS.Section10_13A'))) {
          err('A674', 'ScheduleS.Section10_13A', 'Table 10(13A) of Schedule Salary must be filled to claim an exempt allowance u/s 10(13A)');
        } else {
          eq('A722', 'ScheduleS.Section10_13A.EligbleExmpAllwncUs13A', hraClaimed, num(g('ScheduleS.Section10_13A.EligbleExmpAllwncUs13A')), 'The exempt allowance u/s 10(13A) in Schedule Salary must match the eligible allowance computed in Table 10(13A)');
        }
        if (newRegime) err('A54', 'ScheduleS.AllwncExemptUs10', 'Under the new tax regime the allowance u/s 10(13A) (house rent) cannot be claimed as exempt');
      }
      /* A710 — Table 10(13A) is not available under the new regime. */
      if (newRegime && status === 'I' && isObj(g('ScheduleS.Section10_13A'))) {
        err('A710', 'ScheduleS.Section10_13A', 'Table 10(13A) of Schedule Salary cannot be filed by an individual opting for the new tax regime');
      }
      /* A59 — a HUF cannot claim relief u/s 89A. */
      if (isHUF && relief89A > 0) {
        err('A59', 'ScheduleS.Increliefus89A', 'A HUF cannot claim income relief from taxation u/s 89A');
      }
    }
    /* A491 / A495 / A494 / A11 — Schedule TDS1. */
    if (isHUF && !isEmpty(g('ScheduleTDS1'))) {
      err('A491', 'ScheduleTDS1', 'A HUF cannot have TDS on salary — Schedule TDS1 must be empty');
    }
    if (!isEmpty(g('ScheduleTDS1.TDSonSalary')) && num(g(`${TI}.Salaries`)) <= 0) {
      err('A495', 'ScheduleTDS1', 'TDS on salary is claimed but no salary income is disclosed in the Salary schedule');
    }
    rows(g('ScheduleTDS1.TDSonSalary')).forEach((r, i) => {
      if (num(r.TotalTDSSal) > num(r.IncChrgSal)) {
        err('A494', `ScheduleTDS1.TDSonSalary[${i}].TotalTDSSal`, `Schedule TDS1 row ${i + 1}: the total tax deducted cannot exceed the income chargeable under the head Salary`);
      }
      const tan = str(at(r.EmployerOrDeductorOrCollectDetl, 'TAN'));
      if (tan && !TAN_RE.test(tan)) {
        err('A11', `ScheduleTDS1.TDSonSalary[${i}].EmployerOrDeductorOrCollectDetl.TAN`, `Schedule TDS1 row ${i + 1}: the TAN "${tan}" is not in the valid AAAA99999A format`);
      }
    });

    /* ═══════════ House property ═══════════ */

    if (num(g(`${TI}.IncomeFromHP`)) !== 0 && isEmpty(g('ScheduleHP'))) {
      err('A518', 'ScheduleHP', 'House-property income / loss is offered in Part B-TI but Schedule HP is not filled');
    }
    {
      const hpRows = rows(g('ScheduleHP.PropertyDetails'));
      let selfOccupied = 0;
      let hpTotal = 0;
      hpRows.forEach((r, i) => {
        const p = `ScheduleHP.PropertyDetails[${i}]`;
        const letOut = str(r.ifLetOut);                     // L | D | S
        const rd = isObj(r.Rentdetails) ? r.Rentdetails : {};
        const alv = num(rd.AnnualLetableValue);
        const share = num(r.AsseseeShareProperty);
        const annualOwned = num(rd.AnnualOfPropOwned);
        hpTotal += num(rd.IncomeOfHP);
        if (letOut === 'S') selfOccupied += 1;
        /* A74 — a let-out property needs a gross rent. */
        if ((letOut === 'L' || letOut === 'D') && alv <= 0) {
          err('A74', `${p}.Rentdetails.AnnualLetableValue`, `Schedule HP property ${i + 1}: for a let-out / deemed let-out property the gross rent received / receivable / lettable value must be more than zero`);
        }
        /* A71 — municipal tax needs a gross rent. */
        if (alv <= 0 && num(rd.LocalTaxes) > 0) {
          err('A71', `${p}.Rentdetails.LocalTaxes`, `Schedule HP property ${i + 1}: municipal tax cannot be claimed where the gross rent / lettable value is zero`);
        }
        /* A67 — the standard deduction is 30% of the annual value. */
        if (annualOwned > 0) {
          eq('A67', `${p}.Rentdetails.ThirtyPercentOfBalance`, num(rd.ThirtyPercentOfBalance), Math.round(annualOwned * 0.3), `Schedule HP property ${i + 1}: the standard deduction must be 30% of the annual value`);
        }
        /* A68 / A575 / A82 — co-ownership. */
        if (str(r.PropCoOwnedFlg) === 'YES') {
          const co = rows(r.CoOwners);
          if (co.length === 0) {
            err('A575', `${p}.CoOwners`, `Schedule HP property ${i + 1}: the property is co-owned — the name, PAN and percentage share of every co-owner are mandatory`);
          }
          let totShare = share;
          co.forEach((c, j) => {
            totShare += num(c.PercentShareProperty);
            const cp = str(c.PAN_CoOwner);
            if (cp && assesseePAN && cp === assesseePAN) {
              err('A82', `${p}.CoOwners[${j}].PAN_CoOwner`, `Schedule HP property ${i + 1}: the PAN of a co-owner cannot be the same as the PAN of the assessee`);
            }
            if (isEmpty(c.PercentShareProperty)) {
              err('A575', `${p}.CoOwners[${j}].PercentShareProperty`, `Schedule HP property ${i + 1}, co-owner ${j + 1}: the percentage share of the property is mandatory`);
            }
          });
          if (Math.abs(totShare - 100) > 0.5) {
            err('A68', `${p}.AsseseeShareProperty`, `Schedule HP property ${i + 1}: the share of the assessee and of the co-owners must add up to 100% (they total ${totShare}%)`);
          }
        }
        /* A70 — no interest where the share is nil. */
        if (share === 0 && num(rd.IntOnBorwCap) > 0) {
          err('A70', `${p}.Rentdetails.IntOnBorwCap`, `Schedule HP property ${i + 1}: interest on borrowed capital cannot be claimed where the share of the assessee in the co-owned property is zero`);
        }
        /* A72 / A81 — self-occupied interest limits. */
        if (letOut === 'S' && num(rd.IntOnBorwCap) > 0) {
          if (newRegime) {
            err('A81', `${p}.Rentdetails.IntOnBorwCap`, `Schedule HP property ${i + 1}: interest on borrowed capital cannot be claimed for a self-occupied property under the new tax regime`);
          } else if (num(rd.IntOnBorwCap) > 200000) {
            err('A72', `${p}.Rentdetails.IntOnBorwCap`, `Schedule HP property ${i + 1}: the interest on borrowed capital for a self-occupied property cannot exceed Rs.2,00,000`);
          }
        }
        /* A724 / A676 / A677 — Table 24(b). */
        if (num(rd.IntOnBorwCap) > 0) {
          const loans = rows(at(rd.Section24B, 'Section24BDtls'));
          if (loans.length === 0) {
            err('A724', `${p}.Rentdetails.Section24B.Section24BDtls`, `Schedule HP property ${i + 1}: the details of the loan (Table 24(b)) are mandatory to claim interest on borrowed capital`);
          } else {
            let tot = 0;
            loans.forEach((l, j) => {
              tot += num(l.InterestUs24B);
              for (const f of LOAN_ROW.concat(['InterestUs24B'])) {
                if (isEmpty(l[f])) {
                  missing.push({ path: `${ROOT}.${p}.Rentdetails.Section24B.Section24BDtls[${j}].${f}`, label: `Schedule HP property ${i + 1}, loan ${j + 1}: "${f}" is required (Table 24(b))` });
                }
              }
            });
            eq('A676', `${p}.Rentdetails.IntOnBorwCap`, num(rd.IntOnBorwCap), tot, `Schedule HP property ${i + 1}: the interest payable on borrowed capital must equal the total of Table 24(b)`);
          }
        }
        /* A78 — the income of the property. */
        eq('A78', `${p}.Rentdetails.IncomeOfHP`, num(rd.IncomeOfHP), annualOwned - num(rd.TotalDeduct) + num(rd.ArrearsUnrealizedRentRcvd), `Schedule HP property ${i + 1}: the income from house property must equal the annual value less the deductions plus the arrears / unrealised rent received`);
      });
      /* A80 — at most two self-occupied properties. */
      if (selfOccupied > 2) {
        err('A80', 'ScheduleHP.PropertyDetails', `Schedule HP: ${selfOccupied} properties are claimed to be self-occupied — a deduction for interest is available for at most two`);
      }
      /* A73 — the schedule total. */
      if (hpRows.length > 0) {
        eq('A73', 'ScheduleHP.TotalIncomeChargeableUnHP', num(g('ScheduleHP.TotalIncomeChargeableUnHP')), hpTotal + num(g('ScheduleHP.PassThroghIncome')), 'Schedule HP — the income chargeable under house property must equal the total of the individual properties plus the pass-through income');
      }
    }

    /* ═══════════ Capital gains ═══════════ */

    if (num(g(`${TI}.CapGain.TotalCapGains`)) !== 0 && isEmpty(g('ScheduleCGFor23'))) {
      err('A98', 'ScheduleCGFor23', 'Capital gains are offered in Part B-TI but Schedule CG is not filled');
    }
    if (isObj(g('ScheduleCGFor23'))) {
      eq('A191', 'ScheduleCGFor23.TotScheduleCGFor23', num(g('ScheduleCGFor23.TotScheduleCGFor23')),
        num(g('ScheduleCGFor23.SumOfCGIncm')) + num(g('ScheduleCGFor23.IncmFromVDATrnsf')),
        'Schedule CG C3 — the income chargeable under Capital Gains must equal the sum of the capital-gain incomes and the income from the transfer of virtual digital assets');
      if (!isEmpty(g('ScheduleVDA'))) {
        eq('A192', 'ScheduleCGFor23.IncmFromVDATrnsf', num(g('ScheduleCGFor23.IncmFromVDATrnsf')), num(g('ScheduleVDA.TotIncCapGain')), 'Schedule CG C2 — the income from the transfer of virtual digital assets must equal item B of Schedule VDA');
      }
    }
    /* A650 — the investment u/s 54EC is capped at Rs.50 lakh. */
    if (sumRows(g('ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54EC'), 'AmtInvested') > 5000000) {
      err('A650', 'ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54EC', 'Schedule CG Table D — the amount invested for a deduction u/s 54EC cannot exceed Rs.50,00,000');
    }
    /* A195 / A196 — B1 needs the dates of purchase and sale. */
    rows(g('ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls')).forEach((r, i) => {
      const p = `ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls[${i}]`;
      if (num(r.FullConsideration50C) > 0) {
        if (isEmpty(r.DateofSale)) err('A195', `${p}.DateofSale`, `Schedule CG B1 row ${i + 1}: the date of sale is mandatory`);
        if (isEmpty(r.DateofPurchase)) err('A196', `${p}.DateofPurchase`, `Schedule CG B1 row ${i + 1}: the date of purchase is mandatory`);
      }
      /* A197 — a holding period below 24 months is not long-term. */
      const ds = str(r.DateofSale);
      const dp = str(r.DateofPurchase);
      if (DATE_RE.test(ds) && DATE_RE.test(dp) && (Date.parse(ds) - Date.parse(dp)) / 86400000 < 730) {
        err('A197', `${p}.DateofPurchase`, `Schedule CG B1 row ${i + 1}: the date of purchase is less than 24 months before the date of sale, so the gain does not qualify as long-term`);
      }
    });
    /* A84 / A87 / A88 / A89 / A186 / A90 / A97 — Schedules 112A and 115AD. */
    {
      const scrips: Array<[string, string, string, string]> = [
        ['Schedule112A.Schedule112ADtls', 'Schedule 112A', 'Schedule112A.Balance112A', 'A90'],
        ['Schedule115AD.Schedule115ADDtls', 'Schedule 115AD(1)(b)(iii) proviso', 'Schedule115AD.Balance115AD', 'A97'],
      ];
      for (const [p, label, totalPath, totRule] of scrips) {
        const list = g(p);
        if (!Array.isArray(list) || list.length === 0) continue;
        rows(list).forEach((r, i) => {
          const units = num(r.NumSharesUnits);
          const price = num(r.SalePricePerShareUnit);
          const totSale = num(r.TotSaleValue);
          if (units > 0 && price > 0) eq('A84', `${p}[${i}].TotSaleValue`, totSale, units * price, `${label} row ${i + 1}: the total sale value must equal the number of units multiplied by the sale price per unit`);
          const fmv = num(r.FairMktValuePerShareunit);
          if (units > 0 && fmv > 0) eq('A87', `${p}[${i}].TotFairMktValueCapAst`, num(r.TotFairMktValueCapAst), units * fmv, `${label} row ${i + 1}: the total fair market value must equal the number of units multiplied by the fair market value per unit`);
          eq('A88', `${p}[${i}].TotalDeductions`, num(r.TotalDeductions), num(r.CostAcqWithoutIndx) + num(r.ExpExclCnctTransfer), `${label} row ${i + 1}: the total deductions must equal the cost of acquisition without indexation plus the transfer expenses`);
          eq('A89', `${p}[${i}].Balance`, num(r.Balance), totSale - num(r.TotalDeductions), `${label} row ${i + 1}: the balance must equal the total sale value less the total deductions`);
          const acq = str(r.ShareOnOrBefore).toUpperCase();
          if ((acq === 'AF' || acq.indexOf('AFTER') >= 0) && (fmv > 0 || num(r.TotFairMktValueCapAst) > 0)) {
            err('A186', `${p}[${i}].FairMktValuePerShareunit`, `${label} row ${i + 1}: for shares acquired after 31-01-2018 the fair-market-value columns must not be greater than zero`);
          }
        });
        eq(totRule, totalPath, num(g(totalPath)), sumRows(list, 'Balance'), `${label} — the total must equal the sum of the individual rows`);
      }
    }
    /* A201 / A202 — Schedule VDA. */
    {
      const vdaRows = rows(g('ScheduleVDA.ScheduleVDADtls'));
      let cgTot = 0;
      vdaRows.forEach((r, i) => {
        eq('A201', `ScheduleVDA.ScheduleVDADtls[${i}].IncomeFromVDA`, num(r.IncomeFromVDA), num(r.ConsidReceived) - num(r.AcquisitionCost), `Schedule VDA row ${i + 1}: the income from the transfer must equal the consideration received less the cost of acquisition`);
        if (str(r.HeadUndIncTaxed) === 'CG' && num(r.IncomeFromVDA) > 0) cgTot += num(r.IncomeFromVDA);
      });
      if (vdaRows.length > 0) {
        eq('A202', 'ScheduleVDA.TotIncCapGain', num(g('ScheduleVDA.TotIncCapGain')), cgTot, 'Schedule VDA — the total must equal the sum of the positive capital-gain incomes in column 7');
      }
    }
    /* A190 / A200 — LTCG @10% / @12.5% should have a supporting scrip schedule. */
    if ((num(g(`${TI}.CapGain.LongTerm.LongTerm10Per`)) > 0 || num(g(`${TI}.CapGain.LongTerm.LongTerm12_5Per`)) > 0) && isEmpty(g('Schedule112A')) && isEmpty(g('Schedule115AD'))) {
      warn('A190', 'Schedule112A', 'LTCG taxable @10% / @12.5% is claimed — fill Schedule 112A (or Schedule 115AD(1)(b)(iii) proviso for an FII / FPI) where the gains arise from STT-paid listed equity shares or units');
    }
    /* A656 — Schedule CG B6 needs the section code. */
    rows(g('ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115.NRIOnSec112and115Dtls')).forEach((r, i) => {
      if (isEmpty(r.SectionCode)) {
        err('A656', `ScheduleCGFor23.LongTermCapGain23.NRIOnSec112and115.NRIOnSec112and115Dtls[${i}].SectionCode`, `Schedule CG B6 row ${i + 1}: the section code (115AD / 112(1)(c) / 115AC) must be selected`);
      }
    });
    /* A128 / A156 / A220 — the applicable DTAA rate is the lower of the two rates. */
    {
      const dtaaTables: Array<[string, string, string]> = [
        ['ScheduleCGFor23.ShortTermCapGainFor23.NRICgDTAA.NRIDTAADtls', 'Schedule CG A8', 'A128'],
        ['ScheduleCGFor23.LongTermCapGain23.NRICgDTAA.NRIDTAADtls', 'Schedule CG B12', 'A156'],
        ['ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS', 'Schedule OS 2f', 'A220'],
      ];
      for (const [p, label, rule] of dtaaTables) {
        rows(g(p)).forEach((r, i) => {
          const treaty = num(r.RateAsPerTreaty);
          const act = num(r.RateAsPerITAct);
          const appl = num(r.ApplicableRate);
          if (treaty > 0 && act > 0 && appl > 0 && Math.abs(appl - Math.min(treaty, act)) > 0.01) {
            err(rule, `${p}[${i}].ApplicableRate`, `${label} row ${i + 1}: the applicable rate must be the lower of the rate as per the treaty (${treaty}) and the rate as per the IT Act (${act})`);
          }
        });
      }
    }
    if (resStatus === 'RES' && num(g(`${TI}.CapGain.LongTerm.LongTermSplRateDTAA`)) + num(g(`${TI}.CapGain.ShortTerm.ShortTermSplRateDTAA`)) > 0) {
      warn('BD13', `${TI}.CapGain`, 'A resident has claimed a DTAA rate on capital gains — DTAA rates of taxation are generally not available to residents; a resident may claim relief through Schedules TR and FSI instead');
    }

    /* ═══════════ Other sources ═══════════ */

    {
      const os = g(`${TI}.IncFromOS`);
      const osClaimed = num(at(os, 'OtherSrcThanOwnRaceHorse')) !== 0 || num(at(os, 'IncChargblSplRate')) > 0 || num(at(os, 'FromOwnRaceHorse')) !== 0;
      if (osClaimed && isEmpty(g('ScheduleOS'))) {
        err('A526', 'ScheduleOS', 'Income from other sources is offered in Part B-TI but Schedule OS is not filled (rules 526 to 528)');
      }
      eq('A514', `${TI}.IncFromOS.TotIncFromOS`, num(at(os, 'TotIncFromOS')),
        num(at(os, 'OtherSrcThanOwnRaceHorse')) + num(at(os, 'IncChargblSplRate')) + num(at(os, 'FromOwnRaceHorse')),
        'Part B-TI — the total income from other sources must equal the sum of its components');
    }
    if (isObj(g('ScheduleOS.IncOthThanOwnRaceHorse'))) {
      const O = 'ScheduleOS.IncOthThanOwnRaceHorse';
      const ded = `${O}.Deductions`;
      eq('A204', `${ded}.TotDeductions`, num(g(`${ded}.TotDeductions`)),
        num(g(`${ded}.Expenses`)) + num(g(`${ded}.DeductionUs57iia`)) + num(g(`${ded}.Depreciation`)),
        'Schedule OS 3c — the deduction u/s 57 must equal the sum of 3a(i) + 3a(ii) + 3a(iii) + 3b');
      if (num(g(`${O}.RentFromMachPlantBldgs`)) <= 0 && num(g(`${ded}.Depreciation`)) > 0) {
        err('A205', `${ded}.Depreciation`, 'Schedule OS — depreciation cannot be claimed where the rental income from machinery, plant or buildings is nil');
      }
      const famPension = num(g(`${O}.FamilyPension`));
      const ded57iia = num(g(`${ded}.DeductionUs57iia`));
      if (ded57iia > 0 && famPension <= 0) {
        err('A222', `${ded}.DeductionUs57iia`, 'Schedule OS — the deduction u/s 57(iia) can be claimed only where income is offered under Family Pension');
      }
      if (oldRegime && ded57iia > 0) {
        const cap = Math.min(Math.floor(famPension / 3), 15000);
        if (ded57iia > cap + 1) {
          err('A228', `${ded}.DeductionUs57iia`, `Schedule OS — under the old tax regime the deduction u/s 57(iia) cannot exceed the lower of one-third of the family pension and Rs.15,000 (limit Rs.${cap})`);
        }
      }
      const interestParts = num(g(`${O}.IntrstFrmSavingBank`)) + num(g(`${O}.IntrstFrmTermDeposit`)) + num(g(`${O}.IntrstFrmIncmTaxRefund`)) + num(g(`${O}.IntrstFrmOthers`));
      if (interestParts > 0) {
        eq('A223', `${O}.InterestGross`, num(g(`${O}.InterestGross`)), interestParts, 'Schedule OS 1b — the gross interest must equal the sum of its components');
      }
      const pf = `${O}.TaxAccumulatedBalRecPF`;
      if (isObj(g(pf))) {
        eq('A224', `${pf}.TotalIncomeBenefit`, num(g(`${pf}.TotalIncomeBenefit`)), sumRows(g(`${pf}.TaxAccmltdBalRecPFDtls`), 'IncomeBenefit'), 'Schedule OS 2c — the accumulated balance of a recognised provident fund must equal the total of the income-benefit column');
        eq('A225', `${pf}.TotalTaxBenefit`, num(g(`${pf}.TotalTaxBenefit`)), sumRows(g(`${pf}.TaxAccmltdBalRecPFDtls`), 'TaxBenefit'), 'Schedule OS 2c — the total tax benefit must equal the individual amounts of the tax-benefit column');
      }
      if (num(g(`${ded}.TotDeductions`)) > 0 && num(g(`${O}.GrossIncChrgblTaxAtAppRate`)) <= 0) {
        err('A241', `${ded}.TotDeductions`, 'Schedule OS — expenses and deductions u/s 57 are claimed but no corresponding income is offered under the head Other Sources');
      }
    }

    /* ═══════════ Set-off, carry-forward, exempt income ═══════════ */

    {
      const hpSetOff = num(g('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff'));
      if (oldRegime && hpSetOff > 200000) {
        err('A265', 'ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff', 'Under the old tax regime the total house-property loss of the current year set off cannot exceed Rs.2,00,000');
      }
      if (newRegime && hpSetOff > 0) {
        err('A283', 'ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff', 'Under the new tax regime a house-property loss of the current year cannot be set off against any other head of income');
      }
    }
    eq('A529', `${TI}.CurrentYearLoss`, num(g(`${TI}.CurrentYearLoss`)),
      num(g('ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff')) + num(g('ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff')),
      'Part B-TI — the losses of the current year set off must equal the total losses set off in Schedule CYLA');
    eq('A530', `${TI}.BroughtFwdLossesSetoff`, num(g(`${TI}.BroughtFwdLossesSetoff`)), num(g('ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff')),
      'Part B-TI — the brought-forward losses set off must equal the total of the brought-forward losses set off in Schedule BFLA');
    if (isObj(g('ScheduleCFL.CurrentAYloss.LossSummaryDetail'))) {
      const cur = 'ScheduleCFL.CurrentAYloss.LossSummaryDetail';
      eq('A509', `${TI}.LossesOfCurrentYearCarriedFwd`, num(g(`${TI}.LossesOfCurrentYearCarriedFwd`)),
        num(g(`${cur}.TotalHPPTILossCF`)) + num(g(`${cur}.TotalSTCGPTILossCF`)) + num(g(`${cur}.TotalLTCGPTILossCF`)) + num(g(`${cur}.OthSrcLossRaceHorseCF`)),
        'Part B-TI — the losses of the current year carried forward must equal the total of the current-year losses in Schedule CFL');
    }
    if (isObj(g('ScheduleEI'))) {
      eq('A457', 'ScheduleEI.TotalExemptInc', num(g('ScheduleEI.TotalExemptInc')),
        num(g('ScheduleEI.InterestInc')) + num(g('ScheduleEI.NetAgriIncOrOthrIncRule7')) + num(g('ScheduleEI.Others')) + num(g('ScheduleEI.IncNotChrgblToTax')) + num(g('ScheduleEI.PassThrIncNotChrgblTax')),
        'Schedule EI — the total exempt income must equal the sum of items 1 to 5');
      const othersList = g('ScheduleEI.OthersInc.OthersIncDtls');
      if (Array.isArray(othersList) && othersList.length > 0) {
        eq('A455', 'ScheduleEI.Others', num(g('ScheduleEI.Others')), sumRows(othersList, 'OthAmount'), 'Schedule EI — the total of the other exempt income must equal the amounts entered');
      }
      eq('A458', 'ScheduleEI.NetAgriIncOrOthrIncRule7', num(g('ScheduleEI.NetAgriIncOrOthrIncRule7')),
        num(g('ScheduleEI.GrossAgriRecpt')) - num(g('ScheduleEI.ExpIncAgri')) - num(g('ScheduleEI.UnabAgriLossPrev8')),
        'Schedule EI — the net agricultural income must equal the gross agricultural receipts less the expenditure and the unabsorbed agricultural loss');
      if (num(g('ScheduleEI.NetAgriIncOrOthrIncRule7')) > 500000 && isEmpty(g('ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls'))) {
        err('A468', 'ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls', 'Schedule EI — the net agricultural income exceeds Rs.5,00,000, so the details of each agricultural land are mandatory');
      }
      eq('A534', `${TI}.NetAgricultureIncomeOrOtherIncomeForRate`, num(g(`${TI}.NetAgricultureIncomeOrOtherIncomeForRate`)), num(g('ScheduleEI.NetAgriIncOrOthrIncRule7')),
        'Part B-TI — the net agricultural income / other income for rate purposes must equal item 2 of Schedule EI');
    }

    /* ═══════════ Chapter VI-A ═══════════ */

    if (num(g(`${TI}.DeductionsUnderScheduleVIA`)) > 0 && isEmpty(g('ScheduleVIA'))) {
      err('A533', 'ScheduleVIA', 'Chapter VI-A deductions are claimed in Part B-TI but Schedule VI-A is not filled');
    }
    if (isObj(g('ScheduleVIA'))) {
      if (via('TotalChapVIADeductions') > gti) {
        err('A349', 'ScheduleVIA.DeductUndChapVIA.TotalChapVIADeductions', `The Chapter VI-A deductions (${via('TotalChapVIADeductions')}) cannot exceed the gross total income (${gti})`);
      }
      eq('A351', `${TI}.DeductionsUnderScheduleVIA`, num(g(`${TI}.DeductionsUnderScheduleVIA`)), via('TotalChapVIADeductions'),
        'Part B-TI — the Chapter VI-A deduction must be consistent with the total of Schedule VI-A');
      if (via('Section80C') + via('Section80CCC') + via('Section80CCDEmployeeOrSE') > 150000) {
        err('A365', 'ScheduleVIA.DeductUndChapVIA.Section80C', 'The aggregate deduction u/s 80C, 80CCC and 80CCD(1) cannot exceed Rs.1,50,000');
      }
    }
    /* A307 / A321 / A322 / A333 / A350 / A381 / A383 / A700-A703 / A711 / A712 —
       a deduction claimed in Schedule VI-A needs its detail schedule to agree. */
    {
      const links: Array<[string, string, string, string, string, string]> = [
        ['Section80D', 'Schedule80D', 'Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn', '80D', 'A321', 'A322'],
        ['Section80G', 'Schedule80G', 'Schedule80G.TotalEligibleDonationsUs80G', '80G', 'A307', 'A307'],
        ['Section80GGA', 'Schedule80GGA', 'Schedule80GGA.TotalEligibleDonationAmt80GGA', '80GGA', 'A333', 'A350'],
        ['Section80GGC', 'Schedule80GGC', 'Schedule80GGC.TotalEligibleDonationAmt80GGC', '80GGC', 'A370', 'A370'],
        ['Section80C', 'Schedule80C', 'Schedule80C.TotalAmt', '80C', 'A711', 'A712'],
        ['Section80E', 'Schedule80E', 'Schedule80E.TotalInterest80E', '80E', 'A692', 'A700'],
        ['Section80EE', 'Schedule80EE', 'Schedule80EE.TotalInterest80EE', '80EE', 'A693', 'A701'],
        ['Section80EEA', 'Schedule80EEA', 'Schedule80EEA.TotalInterest80EEA', '80EEA', 'A695', 'A702'],
        ['Section80EEB', 'Schedule80EEB', 'Schedule80EEB.TotalInterest80EEB', '80EEB', 'A698', 'A703'],
        ['Section80U', 'Schedule80U', 'Schedule80U.DeductionAmount', '80U', 'A381', 'A381'],
        ['Section80DD', 'Schedule80DD', 'Schedule80DD.DeductionAmount', '80DD', 'A383', 'A383'],
      ];
      for (const [f, sched, totalPath, name, ruleNeed, ruleMatch] of links) {
        const amt = claimed(f);
        if (amt <= 0) continue;
        if (isEmpty(g(sched))) {
          err(ruleNeed, sched, `A deduction u/s ${name} is claimed in Schedule VI-A but ${sched} is not filled`);
        } else if (amt > num(g(totalPath)) + 1) {
          err(ruleMatch, `ScheduleVIA.DeductUndChapVIA.${f}`, `The deduction u/s ${name} claimed in Schedule VI-A (${amt}) exceeds the eligible amount computed in ${sched} (${num(g(totalPath))})`);
        }
      }
    }
    /* A714 - A718 — supporting particulars in Schedule VI-A. */
    {
      const needs: Array<[boolean, string, string, string]> = [
        [claimed('Section80CCDEmployeeOrSE') > 0 || claimed('Section80CCD1B') > 0, 'PRANNum', 'A714', 'The PRAN must be provided in Schedule VI-A to claim a deduction u/s 80CCD(1) or 80CCD(1B)'],
        [claimed('Section80GG') > 0, 'Form10BAAckNum', 'A715', 'The acknowledgement number of Form 10BA must be provided to claim a deduction u/s 80GG'],
        [claimed('Section80DDB') > 0, 'NameOfSpecDisease80DDB', 'A716', 'The specified disease must be selected to claim a deduction u/s 80DDB'],
        [claimed('Section80QQB') > 0, 'Form10CCDAckNum', 'A717', 'The acknowledgement number of Form 10CCD must be provided in Schedule VI-A to claim a deduction u/s 80QQB'],
        [claimed('Section80RRB') > 0, 'Form10CCEAckNum', 'A718', 'The acknowledgement number of Form 10CCE must be provided in Schedule VI-A to claim a deduction u/s 80RRB'],
      ];
      for (const [cond, field, rule, msg] of needs) {
        if (cond && isEmpty(viaUsr(field))) err(rule, `ScheduleVIA.UsrDeductUndChapVIA.${field}`, msg);
      }
    }
    /* A308 / A334 / A452 / A453 / A361 / A369 / A710 — the new regime. */
    if (newRegime) {
      const mustBeBlank: Array<[string, string, string]> = [
        ['Schedule80G', 'A308', 'Schedule 80G'],
        ['Schedule80GGA', 'A334', 'Schedule 80GGA'],
        ['ScheduleAMT', 'A452', 'Schedule AMT'],
        ['Schedule80C', 'A710', 'Schedule 80C'],
        ['Schedule80E', 'A710', 'Schedule 80E'],
        ['Schedule80EE', 'A710', 'Schedule 80EE'],
        ['Schedule80EEA', 'A710', 'Schedule 80EEA'],
        ['Schedule80EEB', 'A710', 'Schedule 80EEB'],
      ];
      for (const [sched, rule, label] of mustBeBlank) {
        if (!isEmpty(g(sched))) err(rule, sched, `${label} must be blank where the new tax regime is selected`);
      }
      if (num(g('ScheduleAMTC.CurrYrAmtCreditFwd')) > 0 || num(g('ScheduleAMTC.CurrYrCreditCarryFwd')) > 0) {
        err('A453', 'ScheduleAMTC', 'Under the new tax regime the AMT-credit utilised and carried-forward columns of Schedule AMTC must not be more than zero');
      }
      const barred: Array<[string, string]> = [
        ['Section80C', '80C'], ['Section80CCC', '80CCC'], ['Section80CCDEmployeeOrSE', '80CCD(1)'],
        ['Section80CCD1B', '80CCD(1B)'], ['Section80D', '80D'], ['Section80DD', '80DD'],
        ['Section80DDB', '80DDB'], ['Section80E', '80E'], ['Section80EE', '80EE'],
        ['Section80EEA', '80EEA'], ['Section80EEB', '80EEB'], ['Section80G', '80G'],
        ['Section80GG', '80GG'], ['Section80GGA', '80GGA'], ['Section80GGC', '80GGC'],
        ['Section80QQB', '80QQB'], ['Section80RRB', '80RRB'], ['Section80TTA', '80TTA'],
        ['Section80TTB', '80TTB'], ['Section80U', '80U'], ['AnyOthSec80CCH', '80CCH(1)'],
      ];
      for (const [f, name] of barred) {
        if (via(f) > 0) err(f === 'AnyOthSec80CCH' ? 'A369' : 'A361', `ScheduleVIA.DeductUndChapVIA.${f}`, `A deduction u/s ${name} cannot be claimed under the new tax regime`);
      }
    }
    /* A310 - A320 / A651 / A680 / A684 — Schedule 80D. */
    if (oldRegime && isObj(g('Schedule80D.Sec80DSelfFamSrCtznHealth'))) {
      const D = 'Schedule80D.Sec80DSelfFamSrCtznHealth';
      const caps: Array<[string, number, string, string]> = [
        ['SelfAndFamily', 25000, 'A310', 'self and family (Sl. No. 1a)'],
        ['SelfAndFamilySeniorCitizen', 50000, 'A313', 'self and family including a senior citizen (Sl. No. 1b)'],
        ['Parents', 25000, 'A315', 'parents (Sl. No. 2a)'],
        ['ParentsSeniorCitizen', 50000, 'A317', 'parents including a senior citizen (Sl. No. 2b)'],
      ];
      let sum = 0;
      for (const [f, cap, rule, label] of caps) {
        const v = num(g(`${D}.${f}`));
        sum += v;
        if (v > cap) err(rule, `${D}.${f}`, `Schedule 80D — the deduction for ${label} is limited to Rs.${cap}`);
      }
      const elig = num(g(`${D}.EligibleAmountOfDedn`));
      if (elig > 100000) err('A319', `${D}.EligibleAmountOfDedn`, 'Schedule 80D — the eligible amount of deduction cannot exceed Rs.1,00,000');
      eq('A320', `${D}.EligibleAmountOfDedn`, elig, Math.min(sum, 100000), 'Schedule 80D — the eligible amount of deduction must equal the sum of 1a + 1b + 2a + 2b');
      const prev = num(g(`${D}.PrevHlthChckUpSlfFam`)) + num(g(`${D}.PrevHlthChckUpSlfFamSrCtzn`)) + num(g(`${D}.PrevHlthChckUpParents`)) + num(g(`${D}.PrevHlthChckUpParentsSrCtzn`));
      if (prev > 5000) err('A312', D, 'Schedule 80D — the total amount of preventive health check-up cannot exceed Rs.5,000');
      if (isHUF && (num(g(`${D}.Parents`)) > 0 || num(g(`${D}.ParentsSeniorCitizen`)) > 0)) {
        err('A651', `${D}.Parents`, 'Schedule 80D — Sl. No. 2 (parents) is not applicable to a HUF');
      }
      const blocks: Array<[string, string, string]> = [
        ['Sec80DSelfFamHIDtls', 'HealthInsPremSlfFam', '1a'],
        ['Sec80DSelfFamSrCtznHIDtls', 'HlthInsPremSlfFamSrCtzn', '1b'],
        ['Sec80DParentsHIDtls', 'HlthInsPremParents', '2a'],
        ['Sec80DParentsSrCtznHIDtls', 'HlthInsPremParentsSrCtzn', '2b'],
      ];
      for (const [blk, premField, sl] of blocks) {
        const prem = num(g(`${D}.${premField}`));
        if (prem <= 0) continue;
        const list = g(`${D}.${blk}.Sch80DInsDtls`);
        if (isEmpty(list)) {
          err('A680', `${D}.${blk}.Sch80DInsDtls`, `Schedule 80D — the name of the insurer and the policy number must be provided for the health-insurance premium at Sl. No. ${sl}`);
        } else {
          eq('A684', `${D}.${premField}`, prem, sumRows(list, 'HealthInsAmt'), `Schedule 80D — the health-insurance premium at Sl. No. ${sl} must equal the total of the individual policy rows`);
        }
      }
    }
    /* A296 - A309 — Schedule 80G. */
    {
      const blocks: Array<[string, string, string, string, string, string]> = [
        ['Don100Percent', 'TotDon100Percent', 'TotDon100PercentCash', 'TotDon100PercentOtherMode', 'TotEligibleDon100Percent', 'A'],
        ['Don50PercentNoApprReqd', 'TotDon50PercentNoApprReqd', 'TotDon50PercentNoApprReqdCash', 'TotDon50PercentNoApprReqdOtherMode', 'TotEligibleDon50Percent', 'B'],
        ['Don100PercentApprReqd', 'TotDon100PercentApprReqd', 'TotDon100PercentApprReqdCash', 'TotDon100PercentApprReqdOtherMode', 'TotEligibleDon100PercentApprReqd', 'C'],
        ['Don50PercentApprReqd', 'TotDon50PercentApprReqd', 'TotDon50PercentApprReqdCash', 'TotDon50PercentApprReqdOtherMode', 'TotEligibleDon50PercentApprReqd', 'D'],
      ];
      const panSeen: Record<string, string> = {};
      let grand = 0;
      for (const [key, total, cash, other, elig, label] of blocks) {
        const blk = g(`Schedule80G.${key}`);
        if (!isObj(blk)) continue;
        grand += num(blk[total]);
        eq('A302', `Schedule80G.${key}.${total}`, num(blk[total]), num(blk[cash]) + num(blk[other]), `Schedule 80G (${label}) — the total donation must equal the donation in cash plus the donation in another mode`);
        if (num(blk[elig]) > num(blk[total]) + 1) {
          err('A297', `Schedule80G.${key}.${elig}`, `Schedule 80G (${label}) — the eligible amount of donation cannot exceed the total donation`);
        }
        rows(blk.DoneeWithPan).forEach((d, i) => {
          const rp = `Schedule80G.${key}.DoneeWithPan[${i}]`;
          if (num(d.DonationAmtCash) > 2000) {
            err('A298', `${rp}.DonationAmtCash`, `Schedule 80G (${label}) row ${i + 1}: a deduction u/s 80G is not allowed for a donation made in cash above Rs.2,000`);
          }
          eq('A302', `${rp}.DonationAmt`, num(d.DonationAmt), num(d.DonationAmtCash) + num(d.DonationAmtOtherMode), `Schedule 80G (${label}) row ${i + 1}: the total donation must equal the donation in cash plus the donation in another mode`);
          if (num(d.EligibleDonationAmt) > num(d.DonationAmt) + 1) {
            err('A297', `${rp}.EligibleDonationAmt`, `Schedule 80G (${label}) row ${i + 1}: the eligible amount cannot exceed the amount of the donation`);
          }
          const pan = str(d.DoneePAN);
          if (!pan) return;
          if (pan === assesseePAN || (verifierPAN && pan === verifierPAN)) {
            err('A296', `${rp}.DoneePAN`, `Schedule 80G (${label}) row ${i + 1}: the donee PAN cannot be the same as the PAN of the assessee or the PAN at verification`);
          }
          if (pan !== 'AAAAR1077P' && panSeen[pan] && panSeen[pan] !== label) {
            err('A309', `${rp}.DoneePAN`, `Schedule 80G: the donee PAN ${pan} appears in block ${panSeen[pan]} as well as block ${label}; the same PAN cannot be entered in more than one block`);
          }
          panSeen[pan] = label;
        });
      }
      if (isObj(g('Schedule80G'))) {
        eq('A306', 'Schedule80G.TotalDonationsUs80G', num(g('Schedule80G.TotalDonationsUs80G')), grand, 'Schedule 80G (E) — the total donation must equal the sum of blocks A + B + C + D');
      }
    }
    /* A330 / A331 / A332 / A335 — Schedule 80GGA. */
    if (isObj(g('Schedule80GGA'))) {
      eq('A331', 'Schedule80GGA.TotalDonationsUs80GGA', num(g('Schedule80GGA.TotalDonationsUs80GGA')),
        num(g('Schedule80GGA.TotalDonationAmtCash80GGA')) + num(g('Schedule80GGA.TotalDonationAmtOtherMode80GGA')),
        'Schedule 80GGA — the total donation must equal the donation in cash plus the donation in another mode');
      rows(g('Schedule80GGA.DonationDtlsSciRsrchRuralDev')).forEach((d, i) => {
        const rp = `Schedule80GGA.DonationDtlsSciRsrchRuralDev[${i}]`;
        if (num(d.DonationAmtCash) > 2000) {
          err('A335', `${rp}.DonationAmtCash`, `Schedule 80GGA row ${i + 1}: a deduction u/s 80GGA is not allowed for a donation made in cash above Rs.2,000`);
        }
        eq('A330', `${rp}.DonationAmt`, num(d.DonationAmt), num(d.DonationAmtCash) + num(d.DonationAmtOtherMode), `Schedule 80GGA row ${i + 1}: the total donation must equal the donation in cash plus the donation in another mode`);
        const pan = str(d.DoneePAN);
        if (pan && (pan === assesseePAN || (verifierPAN && pan === verifierPAN))) {
          err('A332', `${rp}.DoneePAN`, `Schedule 80GGA row ${i + 1}: the donee PAN cannot be the same as the PAN of the assessee or the PAN at verification`);
        }
      });
    }
    /* A372 - A376 / A573 — Schedule 80GGC. */
    if (isObj(g('Schedule80GGC'))) {
      const list = g('Schedule80GGC.Schedule80GGCDetails');
      eq('A374', 'Schedule80GGC.TotalDonationAmtCash80GGC', num(g('Schedule80GGC.TotalDonationAmtCash80GGC')), sumRows(list, 'DonationAmtCash'), 'Schedule 80GGC — the total contribution in cash must equal the sum of the individual rows');
      eq('A374', 'Schedule80GGC.TotalDonationAmtOtherMode80GGC', num(g('Schedule80GGC.TotalDonationAmtOtherMode80GGC')), sumRows(list, 'DonationAmtOtherMode'), 'Schedule 80GGC — the total contribution in another mode must equal the sum of the individual rows');
      eq('A374', 'Schedule80GGC.TotalDonationsUs80GGC', num(g('Schedule80GGC.TotalDonationsUs80GGC')), sumRows(list, 'DonationAmt'), 'Schedule 80GGC — the total contribution must equal the sum of the individual rows');
      rows(list).forEach((d, i) => {
        const rp = `Schedule80GGC.Schedule80GGCDetails[${i}]`;
        eq('A372', `${rp}.DonationAmt`, num(d.DonationAmt), num(d.DonationAmtCash) + num(d.DonationAmtOtherMode), `Schedule 80GGC row ${i + 1}: the total contribution must equal the contribution in cash plus the contribution in another mode`);
        if (num(d.DonationAmt) > 0 && isEmpty(d.DonationDate)) {
          err('A375', `${rp}.DonationDate`, `Schedule 80GGC row ${i + 1}: the date of contribution is required where the total contribution is more than zero`);
        }
        if (num(d.DonationAmtOtherMode) > 0 && isEmpty(d.TransactionRefNum) && isEmpty(d.IFSCCode)) {
          err('A376', `${rp}.TransactionRefNum`, `Schedule 80GGC row ${i + 1}: the details of a contribution made in another mode (transaction reference / IFSC) are required`);
        }
        const dt = str(d.DonationDate);
        if (dt && DATE_RE.test(dt) && (dt < '2024-04-01' || dt > '2025-03-31')) {
          err('A573', `${rp}.DonationDate`, `Schedule 80GGC row ${i + 1}: for AY 2025-26 only a contribution made between 01-04-2024 and 31-03-2025 qualifies (found ${dt})`);
        }
      });
    }
    /* A378 / A380 / A574 / A688 — Schedules 80DD and 80U. */
    if (oldRegime) {
      for (const [sched, rule, name] of [['Schedule80DD', 'A378', '80DD'], ['Schedule80U', 'A380', '80U']] as Array<[string, string, string]>) {
        if (!isObj(g(sched))) continue;
        const type = str(g(`${sched}.TypeOfDisability`));   // 1 = disability, 2 = severe disability
        const amt = num(g(`${sched}.DeductionAmount`));
        const expected = type === '2' ? 125000 : 75000;
        if (type && amt > 0 && amt !== expected && amt !== Math.min(expected, Math.max(gti, 0))) {
          err(rule, `${sched}.DeductionAmount`, `Schedule ${name} — the deduction must be Rs.${expected} (subject to the gross total income) for the type of disability selected, but ${amt} is claimed`);
        }
        if (amt > 0 && isEmpty(g(`${sched}.Form10IAAckNum`)) && isEmpty(g(`${sched}.FormAckNum11A`)) && isEmpty(g(`${sched}.UDIDNum`))) {
          warn('A688', `${sched}.Form10IAAckNum`, `Schedule ${name} — Form 10-IA (or the UDID number) has to be furnished separately for this deduction`);
        }
      }
      if (isHUF && num(g('Schedule80DD.DeductionAmount')) > 0 && str(g('Schedule80DD.DependentType')) !== '8') {
        warn('A574', 'Schedule80DD.DependentType', 'A HUF can claim a deduction u/s 80DD only where the dependent is a member of the HUF');
      }
    }
    /* A341 / A342 / A362 / A363 — 80TTA and 80TTB. */
    {
      const savings = num(g('ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmSavingBank'));
      const deposits = savings + num(g('ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmTermDeposit'));
      const tta = claimed('Section80TTA');
      const ttb = claimed('Section80TTB');
      if (oldRegime && tta > 0 && isSenior && !isNRI) {
        err('A341', 'ScheduleVIA.DeductUndChapVIA.Section80TTA', 'A resident senior citizen cannot claim a deduction u/s 80TTA (s.80TTB applies instead)');
      }
      if (tta > 0 && tta > Math.min(savings, 10000) + 1) {
        err('A362', 'ScheduleVIA.DeductUndChapVIA.Section80TTA', `The deduction u/s 80TTA is restricted to the interest from savings accounts offered under Other Sources (Rs.${savings}) and to Rs.10,000`);
      }
      if (ttb > 0 && !isSenior) {
        err('A342', 'ScheduleVIA.DeductUndChapVIA.Section80TTB', 'A deduction u/s 80TTB is available only to a senior citizen (aged 60 years or more)');
      }
      if (oldRegime && ttb > 0 && ttb > Math.min(deposits, 50000) + 1) {
        err('A363', 'ScheduleVIA.DeductUndChapVIA.Section80TTB', `The deduction u/s 80TTB is restricted to the interest on savings accounts and deposits offered under Other Sources (Rs.${deposits}) and to Rs.50,000`);
      }
    }
    /* HUF-barred deductions and blocks. */
    if (isHUF) {
      const hufBarred: Array<[string, string, string]> = [
        ['Section80CCDEmployeeOrSE', '80CCD(1)', 'A336'],
        ['Section80CCD1B', '80CCD(1B)', 'A337'],
        ['Section80CCDEmployer', '80CCD(2)', 'A338'],
        ['Section80E', '80E', 'A339'],
        ['Section80EE', '80EE', 'A340'],
        ['Section80U', '80U', 'A343'],
        ['Section80EEA', '80EEA', 'A344'],
        ['Section80EEB', '80EEB', 'A345'],
        ['Section80QQB', '80QQB', 'A352'],
        ['Section80RRB', '80RRB', 'A354'],
      ];
      for (const [f, name, rule] of hufBarred) {
        if (claimed(f) > 0) err(rule, `ScheduleVIA.DeductUndChapVIA.${f}`, `A deduction u/s ${name} is not allowed to a HUF`);
      }
      for (const sched of ['Schedule80E', 'Schedule80EE', 'Schedule80EEA', 'Schedule80EEB']) {
        if (!isEmpty(g(sched))) err('A709', sched, `An assessee whose status is HUF is not eligible to fill ${sched}`);
      }
      if (num(g(`${CTL}.TaxRelief.Section89`)) > 0) err('A542', `${CTL}.TaxRelief.Section89`, 'A HUF cannot claim relief u/s 89');
      if (rebate87A > 0) err('A560', `${CTL}.Rebate87A`, 'The rebate u/s 87A is not allowed to a HUF');
      if (!isEmpty(g('ScheduleESOP'))) err('A572', 'ScheduleESOP', 'The status is HUF — every field filled in the Schedule "Tax deferred on ESOP" must be removed');
      if (!isEmpty(g('ScheduleS'))) warn('A491', 'ScheduleS', 'The status is HUF but the Salary schedule is filled — a HUF cannot have salary income');
    }
    /* Non-resident-barred claims. */
    if (isNRI) {
      const nriBarred: Array<[string, string, string]> = [
        ['Section80DD', '80DD', 'A346'],
        ['Section80DDB', '80DDB', 'A347'],
        ['Section80U', '80U', 'A348'],
        ['Section80TTB', '80TTB', 'A368'],
        ['Section80QQB', '80QQB', 'A353'],
        ['Section80RRB', '80RRB', 'A355'],
      ];
      for (const [f, name, rule] of nriBarred) {
        if (claimed(f) > 0) err(rule, `ScheduleVIA.DeductUndChapVIA.${f}`, `A deduction u/s ${name} cannot be claimed by a non-resident`);
      }
      if (rebate87A > 0) err('A559', `${CTL}.Rebate87A`, 'The rebate u/s 87A is not allowed to a non-resident');
      if (!isEmpty(g('ScheduleFSI'))) err('A465', 'ScheduleFSI', 'Schedule FSI is not applicable where the residential status is non-resident');
      if (!isEmpty(g('ScheduleTR1'))) err('A476', 'ScheduleTR1', 'Schedule TR is not applicable where the residential status is non-resident');
    }

    /* ═══════════ Schedules SI, AMT and AMTC ═══════════ */

    {
      const siRows = rows(g('ScheduleSI.SplCodeRateTax'));
      if (isObj(g('ScheduleSI'))) {
        eq('A398', 'ScheduleSI.TotSplRateInc', num(g('ScheduleSI.TotSplRateInc')), sumRows(siRows, 'SplRateInc'), 'Schedule SI — the total special-rate income must equal the sum of the individual rows');
        eq('A399', 'ScheduleSI.TotSplRateIncTax', num(g('ScheduleSI.TotSplRateIncTax')), sumRows(siRows, 'SplRateIncTax'), 'Schedule SI — the total of the "tax thereon" column must equal the sum of the individual rows');
        eq('A393', `${TI}.IncChargeableTaxSplRates`, num(g(`${TI}.IncChargeableTaxSplRates`)), num(g('ScheduleSI.TotSplRateInc')),
          'Part B-TI — the income chargeable to tax at special rates must be consistent with the total of Schedule SI');
      }
      siRows.forEach((r, i) => {
        const inc = num(r.SplRateInc);
        const tax = num(r.SplRateIncTax);
        const rate = num(r.SplRatePercent);
        if (inc > 0 && tax <= 0) {
          err('A392', `ScheduleSI.SplCodeRateTax[${i}].SplRateIncTax`, `Schedule SI row ${i + 1} (${str(r.SecCode)}): the tax computed cannot be nil where the income is greater than zero`);
        }
        if (inc > 0 && rate > 0) {
          eq('A391', `ScheduleSI.SplCodeRateTax[${i}].SplRateIncTax`, tax, Math.round(inc * rate) / 100, `Schedule SI row ${i + 1} (${str(r.SecCode)}): the tax thereon must equal the taxable income multiplied by the special rate`, 2);
        }
      });
      if (num(g(`${CTL}.TaxPayableOnTI.TaxAtSpecialRates`)) > 0 && num(g('ScheduleSI.TotSplRateInc')) <= 0 && num(g(`${TI}.IncChargeableTaxSplRates`)) <= 0) {
        err('A387', `${CTL}.TaxPayableOnTI.TaxAtSpecialRates`, 'Tax at special rates is computed although no special income is offered in Schedule SI');
      }
    }
    if (isObj(g('ScheduleAMT'))) {
      const adj = num(g('ScheduleAMT.AdjustedUnderSec115JC'));
      const amtTax = num(g('ScheduleAMT.TaxPayableUnderSec115JC'));
      eq('A441', 'ScheduleAMT.TotalIncItemPartBTI', num(g('ScheduleAMT.TotalIncItemPartBTI')), totalIncome, 'Schedule AMT — Sl. No. 1 must equal the total income at Sl. No. 12 of Part B-TI');
      eq('A442', 'ScheduleAMT.AdjustedUnderSec115JC', adj,
        num(g('ScheduleAMT.TotalIncItemPartBTI')) + num(g('ScheduleAMT.DeductionClaimUndrAnySec')),
        'Schedule AMT — the adjusted total income u/s 115JC must equal Sl. No. 1 plus Sl. No. 2a');
      if (adj > 2000000) {
        eq('A450', 'ScheduleAMT.TaxPayableUnderSec115JC', amtTax, Math.round(adj * 0.185), 'Schedule AMT — the tax payable u/s 115JC must be 18.5% of the adjusted total income', 2);
      } else if (amtTax > 0) {
        warn('A450', 'ScheduleAMT.TaxPayableUnderSec115JC', 'Schedule AMT — the adjusted total income does not exceed Rs.20,00,000, so no tax is payable u/s 115JC');
      }
      eq('A537', `${TI}.DeemedIncomeUs115JC`, num(g(`${TI}.DeemedIncomeUs115JC`)), adj, 'Part B-TI — the deemed income u/s 115JC must equal Sl. No. 3 of Schedule AMT');
      eq('A543', `${TTI}.TaxPayDeemedTotIncUs115JC`, num(g(`${TTI}.TaxPayDeemedTotIncUs115JC`)), amtTax, 'Part B-TTI — the tax payable on the deemed total income u/s 115JC must equal Sl. No. 4 of Schedule AMT');
    }
    if (isObj(g('ScheduleAMTC'))) {
      eq('A446', 'ScheduleAMTC.AmtTaxCreditAvailable', num(g('ScheduleAMTC.AmtTaxCreditAvailable')),
        Math.max(num(g('ScheduleAMTC.TaxOthProvisions')) - num(g('ScheduleAMTC.TaxSection115JC')), 0),
        'Schedule AMTC — Sl. No. 3 must equal Sl. No. 2 less Sl. No. 1, and must be nil where Sl. No. 2 does not exceed Sl. No. 1');
      rows(g('ScheduleAMTC.ScheduleAMTCDtls')).forEach((r, i) => {
        eq('A451', `ScheduleAMTC.ScheduleAMTCDtls[${i}].BalAmtCreditCarryFwd`, num(r.BalAmtCreditCarryFwd), num(r.AmtCreditBalBroughtFwd) - num(r.AmtCreditUtilized),
          `Schedule AMTC row ${i + 1} (AY ${str(r.AssYr)}): the balance AMT credit carried forward must equal the balance brought forward less the credit utilised during the year`);
      });
    }

    /* ═══════════ Part B-TI arithmetic ═══════════ */

    {
      const st = g(`${TI}.CapGain.ShortTerm`);
      const lt = g(`${TI}.CapGain.LongTerm`);
      eq('A511', `${TI}.CapGain.ShortTerm.TotalShortTerm`, num(at(st, 'TotalShortTerm')),
        num(at(st, 'ShortTerm15Per')) + num(at(st, 'ShortTerm20Per')) + num(at(st, 'ShortTerm30Per')) + num(at(st, 'ShortTermAppRate')) + num(at(st, 'ShortTermSplRateDTAA')),
        'Part B-TI — the total short-term capital gain must equal the sum of its rate-wise components');
      eq('A512', `${TI}.CapGain.LongTerm.TotalLongTerm`, num(at(lt, 'TotalLongTerm')),
        num(at(lt, 'LongTerm10Per')) + num(at(lt, 'LongTerm12_5Per')) + num(at(lt, 'LongTerm20Per')) + num(at(lt, 'LongTermSplRateDTAA')),
        'Part B-TI — the total long-term capital gain must equal the sum of its rate-wise components');
      eq('A513', `${TI}.CapGain.ShortTermLongTermTotal`, num(g(`${TI}.CapGain.ShortTermLongTermTotal`)), num(at(st, 'TotalShortTerm')) + num(at(lt, 'TotalLongTerm')),
        'Part B-TI — the sum of the short-term and long-term capital gains must equal their totals');
      eq('A541', `${TI}.CapGain.TotalCapGains`, num(g(`${TI}.CapGain.TotalCapGains`)),
        num(g(`${TI}.CapGain.ShortTermLongTermTotal`)) + num(g(`${TI}.CapGain.CapGains30Per115BBH`)),
        'Part B-TI — the total capital gains must equal the sum of items 3c and 3d');
      eq('A515', `${TI}.TotalTI`, num(g(`${TI}.TotalTI`)),
        num(g(`${TI}.Salaries`)) + num(g(`${TI}.IncomeFromHP`)) + num(g(`${TI}.CapGain.TotalCapGains`)) + num(g(`${TI}.IncFromOS.TotIncFromOS`)),
        'Part B-TI — the total of the heads of income must equal the sum of the individual heads');
      eq('A536', `${TI}.BalanceAfterSetoffLosses`, num(g(`${TI}.BalanceAfterSetoffLosses`)), num(g(`${TI}.TotalTI`)) - num(g(`${TI}.CurrentYearLoss`)),
        'Part B-TI — the balance after the set-off of the current-year losses must equal Sl. No. 5 less Sl. No. 6');
      eq('A531', `${TI}.GrossTotalIncome`, gti, num(g(`${TI}.BalanceAfterSetoffLosses`)) - num(g(`${TI}.BroughtFwdLossesSetoff`)),
        'Part B-TI — the gross total income must equal the balance after set-off less the brought-forward losses set off');
      eq('A532', `${TI}.TotalIncome`, totalIncome, gti - num(g(`${TI}.DeductionsUnderScheduleVIA`)),
        'Part B-TI — the total income must equal the gross total income less the Chapter VI-A deductions after rounding off', 10);
      eq('A538', `${TI}.AggregateIncome`, num(g(`${TI}.AggregateIncome`)),
        totalIncome - num(g(`${TI}.IncChargeableTaxSplRates`)) + num(g(`${TI}.NetAgricultureIncomeOrOtherIncomeForRate`)),
        'Part B-TI — the aggregate income must equal Sl. No. 12 less Sl. No. 13 plus Sl. No. 14');
      const cap = Math.max(gti - num(g(`${TI}.IncChargeTaxSplRate111A112`)), 0);
      if (num(g(`${TI}.DeductionsUnderScheduleVIA`)) > cap + 1) {
        err('A535', `${TI}.DeductionsUnderScheduleVIA`, `Part B-TI — the Chapter VI-A deduction cannot exceed the gross total income reduced by the income chargeable at special rates (limit ${cap})`);
      }
      if (gti <= 0 && num(g(`${CTL}.GrossTaxLiability`)) > 0) {
        err('A510', `${CTL}.GrossTaxLiability`, 'A tax computation has been disclosed although the gross total income is nil');
      }
      if (num(g(`${TI}.IncChargeableTaxSplRates`)) > 0 && isEmpty(g('ScheduleSI'))) {
        err('A539', `${TI}.IncChargeableTaxSplRates`, 'Income chargeable at special rates is offered in Part B-TI but Schedule SI is not filled');
      }
    }

    /* ═══════════ Part B-TTI arithmetic ═══════════ */

    {
      const tp = `${CTL}.TaxPayableOnTI`;
      const paid = `${TTI}.TaxPaid.TaxesPaid`;
      eq('A549', `${tp}.TaxPayableOnTotInc`, num(g(`${tp}.TaxPayableOnTotInc`)),
        num(g(`${tp}.TaxAtNormalRatesOnAggrInc`)) + num(g(`${tp}.TaxAtSpecialRates`)) - num(g(`${tp}.RebateOnAgriInc`)),
        'Part B-TTI — the tax payable on the total income must equal the normal-rate tax plus the special-rate tax less the rebate on agricultural income');
      eq('A550', `${CTL}.TaxPayableOnRebate`, num(g(`${CTL}.TaxPayableOnRebate`)), Math.max(num(g(`${tp}.TaxPayableOnTotInc`)) - rebate87A, 0),
        'Part B-TTI — the tax payable after the rebate must equal the tax payable on the total income less the rebate u/s 87A');
      eq('A551', `${CTL}.GrossTaxLiability`, num(g(`${CTL}.GrossTaxLiability`)),
        num(g(`${CTL}.TaxPayableOnRebate`)) + num(g(`${CTL}.TotalSurcharge`)) + num(g(`${CTL}.EducationCess`)),
        'Part B-TTI — the gross tax liability must equal the tax payable plus the surcharge plus the health & education cess');
      eq('A565', `${CTL}.GrossTaxPayable`, num(g(`${CTL}.GrossTaxPayable`)),
        Math.max(num(g(`${CTL}.GrossTaxLiability`)), num(g(`${TTI}.TotalTaxPayablDeemedTotInc`))),
        'Part B-TTI — the gross tax payable must be the higher of the total tax payable on the deemed total income and the gross tax liability');
      eq('A554', `${CTL}.TaxRelief.TotTaxRelief`, num(g(`${CTL}.TaxRelief.TotTaxRelief`)),
        num(g(`${CTL}.TaxRelief.Section89`)) + num(g(`${CTL}.TaxRelief.Section90`)) + num(g(`${CTL}.TaxRelief.Section91`)),
        'Part B-TTI — the total tax relief must equal the sum of the relief u/s 89, u/s 90/90A and u/s 91');
      eq('A567', `${CTL}.NetTaxLiability`, num(g(`${CTL}.NetTaxLiability`)),
        Math.max(num(g(`${CTL}.TaxPayAfterCreditUs115JD`)) - num(g(`${CTL}.TaxRelief.TotTaxRelief`)), 0),
        'Part B-TTI — the net tax liability must equal the tax payable after the credit u/s 115JD less the total tax relief');
      eq('A555', `${CTL}.IntrstPay.TotalIntrstPay`, num(g(`${CTL}.IntrstPay.TotalIntrstPay`)),
        num(g(`${CTL}.IntrstPay.IntrstPayUs234A`)) + num(g(`${CTL}.IntrstPay.IntrstPayUs234B`)) + num(g(`${CTL}.IntrstPay.IntrstPayUs234C`)) + num(g(`${CTL}.IntrstPay.LateFilingFee234F`)),
        'Part B-TTI — the total interest and fee payable must equal the interest u/s 234A + 234B + 234C plus the fee u/s 234F');
      eq('A556', `${CTL}.AggregateTaxInterestLiability`, num(g(`${CTL}.AggregateTaxInterestLiability`)),
        num(g(`${CTL}.NetTaxLiability`)) + num(g(`${CTL}.IntrstPay.TotalIntrstPay`)),
        'Part B-TTI — the aggregate liability must equal the net tax liability plus the total interest payable');
      eq('A557', `${paid}.TotalTaxesPaid`, num(g(`${paid}.TotalTaxesPaid`)),
        num(g(`${paid}.AdvanceTax`)) + num(g(`${paid}.TDS`)) + num(g(`${paid}.TCS`)) + num(g(`${paid}.SelfAssessmentTax`)),
        'Part B-TTI — the total taxes paid must equal the advance tax plus the TDS plus the TCS plus the self-assessment tax');
      eq('A562', `${TTI}.Refund.RefundDue`, num(g(`${TTI}.Refund.RefundDue`)),
        Math.max(num(g(`${paid}.TotalTaxesPaid`)) - num(g(`${CTL}.AggregateTaxInterestLiability`)), 0),
        'Part B-TTI — the refund claimed must equal the excess of the total taxes paid over the total tax and interest payable', 10);
      eq('A548', `${TTI}.TotalTaxPayablDeemedTotInc`, num(g(`${TTI}.TotalTaxPayablDeemedTotInc`)),
        num(g(`${TTI}.TaxPayDeemedTotIncUs115JC`)) + num(g(`${TTI}.Surcharge`)) + num(g(`${TTI}.HealthEduCess`)),
        'Part B-TTI — the total tax payable on the deemed total income must equal 1a + 1b + 1c');
      if (newRegime && (num(g(`${TTI}.TaxPayDeemedTotIncUs115JC`)) > 0 || num(g(`${TTI}.TotalTaxPayablDeemedTotInc`)) > 0)) {
        err('A569', `${TTI}.TaxPayDeemedTotIncUs115JC`, 'Under the new tax regime Sl. Nos. 1a to 1d of Part B-TTI (tax on the deemed total income u/s 115JC) must not be more than zero');
      }
      if (num(g(`${CTL}.TaxRelief.Section89`)) > 0 && num(g(`${TI}.Salaries`)) <= 0) {
        err('A568', `${CTL}.TaxRelief.Section89`, 'Relief u/s 89 cannot be claimed where the details of salary are nil or blank');
      }
      if (isObj(g('ScheduleTR1'))) {
        eq('A552', `${CTL}.TaxRelief.Section90`, num(g(`${CTL}.TaxRelief.Section90`)), num(g('ScheduleTR1.TaxReliefOutsideIndiaDTAA')),
          'Part B-TTI — the relief claimed u/s 90/90A must equal the amount entered in Schedule TR');
        eq('A553', `${CTL}.TaxRelief.Section91`, num(g(`${CTL}.TaxRelief.Section91`)), num(g('ScheduleTR1.TaxReliefOutsideIndiaNotDTAA')),
          'Part B-TTI — the relief claimed u/s 91 must equal the amount entered in Schedule TR');
      }
    }
    /* A507 / A508 / A561 — the rebate u/s 87A. */
    if (oldRegime && rebate87A > 12500) {
      err('A508', `${CTL}.Rebate87A`, 'Under the old tax regime the rebate u/s 87A cannot exceed Rs.12,500');
    }
    if (oldRegime && totalIncome > 500000 && rebate87A > 0) {
      err('A561', `${CTL}.Rebate87A`, 'Under the old tax regime the rebate u/s 87A is not available where the total income exceeds Rs.5,00,000');
    }
    if (newRegime && totalIncome > 700000 && rebate87A > 0) {
      warn('A507', `${CTL}.Rebate87A`, 'The total income exceeds Rs.7,00,000 — the rebate u/s 87A is available only to the extent of the marginal relief; please verify the claim');
    }
    /* A479 — Schedule AL where the total income exceeds Rs.1 crore. */
    if (totalIncome > 10000000 && isEmpty(g('ScheduleAL'))) {
      err('A479', 'ScheduleAL', 'The total income exceeds Rs.1 crore — Schedule AL (assets and liabilities) is mandatory');
    }

    /* ═══════════ Taxes paid — Schedules IT, TDS and TCS ═══════════ */

    {
      const itRows = rows(g('ScheduleIT.TaxPayment'));
      if (isObj(g('ScheduleIT'))) {
        eq('A482', 'ScheduleIT.TotalTaxPayments', num(g('ScheduleIT.TotalTaxPayments')), sumRows(itRows, 'Amt'), 'Schedule IT — the total of the "Amount" column must equal the sum of the amounts entered');
      }
      let advance = 0;
      let selfAsst = 0;
      itRows.forEach((r, i) => {
        const dt = str(r.DateDep);
        const amt = num(r.Amt);
        if (DATE_RE.test(dt)) {
          if (dt >= '2024-04-01' && dt <= '2025-03-31') advance += amt;
          else if (dt > '2025-03-31') selfAsst += amt;
          else err('SCHEMA', `ScheduleIT.TaxPayment[${i}].DateDep`, `Schedule IT challan ${i + 1}: the date of deposit ${dt} falls before the financial year 2024-25`);
        }
        const bsr = str(r.BSRCode);
        if (bsr && !/^[0-9]{3}[0-9A-Z]{4}$/.test(bsr)) {
          err('SCHEMA', `ScheduleIT.TaxPayment[${i}].BSRCode`, `Schedule IT challan ${i + 1}: the BSR code "${bsr}" is not valid (7 characters)`);
        }
      });
      if (itRows.length > 0) {
        eq('A547', `${TTI}.TaxPaid.TaxesPaid.AdvanceTax`, num(g(`${TTI}.TaxPaid.TaxesPaid.AdvanceTax`)), advance,
          'Part B-TTI — the advance tax must equal the total tax paid in Schedule IT where the date of deposit falls between 01-04-2024 and 31-03-2025');
        eq('A546', `${TTI}.TaxPaid.TaxesPaid.SelfAssessmentTax`, num(g(`${TTI}.TaxPaid.TaxesPaid.SelfAssessmentTax`)), selfAsst,
          'Part B-TTI — the self-assessment tax must equal the total tax paid in Schedule IT where the date of deposit is after 31-03-2025');
      }
    }
    {
      const tds1 = num(g('ScheduleTDS1.TotalTDSonSalaries'));
      const tds2 = num(g('ScheduleTDS2.TotalTDSonOthThanSals'));
      const tds3 = num(g('ScheduleTDS3.TotalTDS3OnOthThanSal'));
      if (!isEmpty(g('ScheduleTDS1')) || !isEmpty(g('ScheduleTDS2')) || !isEmpty(g('ScheduleTDS3'))) {
        eq('A516', `${TTI}.TaxPaid.TaxesPaid.TDS`, num(g(`${TTI}.TaxPaid.TaxesPaid.TDS`)), tds1 + tds2 + tds3,
          'Part B-TTI — the TDS claimed must equal the totals of Schedules TDS1, TDS2 and TDS3');
      }
      if (!isEmpty(g('ScheduleTCS'))) {
        eq('A483', `${TTI}.TaxPaid.TaxesPaid.TCS`, num(g(`${TTI}.TaxPaid.TaxesPaid.TCS`)), num(g('ScheduleTCS.TotalSchTCS')),
          'Part B-TTI — the TCS claimed must equal the total of Schedule TCS');
      }
      if (num(g(`${TTI}.TaxPaid.TaxesPaid.TotalTaxesPaid`)) > 0 && gti <= 0) {
        warn('A564', `${TTI}.TaxPaid.TaxesPaid.TotalTaxesPaid`, 'Taxes paid have been disclosed but no income details or tax computation are present');
      }
    }
    {
      const tdsTables: Array<[string, string, string]> = [
        ['ScheduleTDS2.TDSOthThanSalaryDtls', 'TANOfDeductor', 'Schedule TDS2'],
        ['ScheduleTDS3.TDS3onOthThanSalDtls', 'PANOfBuyerTenant', 'Schedule TDS3'],
      ];
      let t2 = 0;
      let t3 = 0;
      for (const [p, keyField, label] of tdsTables) {
        const isTds2 = p.indexOf('TDS2') >= 0;
        rows(g(p)).forEach((r, i) => {
          const cd = isObj(r.TaxDeductCreditDtls) ? r.TaxDeductCreditDtls : {};
          const claimedOwn = num(cd.TaxClaimedOwnHands);
          const claimTotal = claimedOwn + num(cd.TaxClaimedTDS);
          if (isTds2) t2 += claimedOwn; else t3 += claimedOwn;
          const available = num(r.BroughtFwdTDSAmt) + num(cd.TaxDeductedOwnHands) + num(cd.TaxDeductedTDS);
          if (available > 0 && claimTotal > available + 1) {
            err('A489', `${p}[${i}].TaxDeductCreditDtls`, `${label} row ${i + 1}: the TDS claimed cannot exceed the sum of the TDS brought forward and the TDS deducted`);
          }
          if (num(r.GrossAmount) > 0 && claimTotal > num(r.GrossAmount)) {
            err('A486', `${p}[${i}].TaxDeductCreditDtls`, `${label} row ${i + 1}: the TDS claimed cannot be more than the gross income disclosed`);
          }
          if (claimedOwn > 0) {
            if (isEmpty(r.GrossAmount)) err('A487', `${p}[${i}].GrossAmount`, `${label} row ${i + 1}: the corresponding gross amount must be filled because TDS credit is claimed`);
            if (isEmpty(r.HeadOfIncome)) err('A487', `${p}[${i}].HeadOfIncome`, `${label} row ${i + 1}: the head of income must be selected because TDS credit is claimed`);
          }
          if (str(r.TDSCreditName) === 'O') {
            if (isEmpty(r.PANofOtherPerson) && isEmpty(r.AadhaarOfOtherPerson)) {
              err('A492', `${p}[${i}].PANofOtherPerson`, `${label} row ${i + 1}: TDS credit relating to another person is selected — the PAN (or Aadhaar) of that person must be provided`);
            }
            if (!isEmpty(r[keyField])) {
              err('A493', `${p}[${i}].${keyField}`, `${label} row ${i + 1}: where the TDS credit relates to another person the TAN of the deductor / PAN of the tenant or buyer must not be filled`);
            }
          }
          if (num(r.BroughtFwdTDSAmt) > 0 && num(cd.TaxDeductedOwnHands) + num(cd.TaxDeductedTDS) > 0) {
            err('A485', `${p}[${i}]`, `${label} row ${i + 1}: the unclaimed TDS brought forward and the TDS of the current financial year must be shown in different rows`);
          }
          const sec = str(r.TDSSection);
          if (sec === '192' || sec === '92A' || sec === '92B' || sec === '92C') {
            err('A719', `${p}[${i}].TDSSection`, `${label} row ${i + 1}: section 192 (TDS on salary income) cannot be selected in a schedule meant for TDS on income other than salary`);
          }
          const tan = str(r.TANOfDeductor);
          if (tan && !TAN_RE.test(tan)) {
            err('A11', `${p}[${i}].TANOfDeductor`, `${label} row ${i + 1}: the TAN "${tan}" is not in the valid AAAA99999A format`);
          }
        });
      }
      if (!isEmpty(g('ScheduleTDS2.TDSOthThanSalaryDtls'))) {
        eq('A502', 'ScheduleTDS2.TotalTDSonOthThanSals', num(g('ScheduleTDS2.TotalTDSonOthThanSals')), t2, 'Schedule TDS2 — the total TDS must equal the sum of the TDS claimed in the individual rows');
      }
      if (!isEmpty(g('ScheduleTDS3.TDS3onOthThanSalDtls'))) {
        eq('A502', 'ScheduleTDS3.TotalTDS3OnOthThanSal', num(g('ScheduleTDS3.TotalTDS3OnOthThanSal')), t3, 'Schedule TDS3 — the total TDS must equal the sum of the TDS claimed in the individual rows');
      }
      if (!isEmpty(g('ScheduleTDS1.TDSonSalary'))) {
        eq('A494', 'ScheduleTDS1.TotalTDSonSalaries', num(g('ScheduleTDS1.TotalTDSonSalaries')), sumRows(g('ScheduleTDS1.TDSonSalary'), 'TotalTDSSal'), 'Schedule TDS1 — the total TDS on salaries must equal the sum of the individual rows');
      }
    }
    {
      const tcsRows = rows(g('ScheduleTCS.TCS'));
      let tot = 0;
      tcsRows.forEach((r, i) => {
        const collected = num(at(r.TCSCurrFYDtls, 'TCSCurrFY')) + num(at(r.TCSCurrFYDtls, 'TCSAmtCollOwnHand')) + num(at(r.TCSCurrFYDtls, 'TCSAmtCollSpouseOthHand'));
        const claimedTcs = num(at(r.TCSClaimedThisYearDtls, 'TCSAmtCollOwnHand')) + num(at(r.TCSClaimedThisYearDtls, 'TCSAmtCollSpouseOthHand')) + num(at(r.TCSClaimedThisYearDtls, 'TCSClaimedThisYear'));
        tot += claimedTcs;
        if (collected > 0 && claimedTcs > collected + num(r.BroughtFwdTDSAmt) + 1) {
          err('A481', `ScheduleTCS.TCS[${i}]`, `Schedule TCS row ${i + 1}: the amount of TCS claimed this year cannot be more than the tax collected plus the amount brought forward`);
        }
        if (isEmpty(r.TCSCreditOwner)) {
          err('A499', `ScheduleTCS.TCS[${i}].TCSCreditOwner`, `Schedule TCS row ${i + 1}: the applicable dropdown in column 2(i) must be selected`);
        }
        if (str(r.TCSCreditOwner) === '2' && isEmpty(r.PANOfSpouseOrOthrPrsn)) {
          err('A498', `ScheduleTCS.TCS[${i}].PANOfSpouseOrOthrPrsn`, `Schedule TCS row ${i + 1}: TCS credit relating to another person is selected — the PAN of that person must be provided`);
        }
        const tan = str(r.EmployerOrDeductorOrCollectTAN);
        if (isEmpty(tan)) {
          err('A500', `ScheduleTCS.TCS[${i}].EmployerOrDeductorOrCollectTAN`, `Schedule TCS row ${i + 1}: the tax deduction and collection account number of the collector must be provided`);
        } else if (!TAN_RE.test(tan)) {
          err('A11', `ScheduleTCS.TCS[${i}].EmployerOrDeductorOrCollectTAN`, `Schedule TCS row ${i + 1}: the TAN "${tan}" is not in the valid AAAA99999A format`);
        }
        if (num(r.BroughtFwdTDSAmt) > 0 && collected > 0) {
          err('A496', `ScheduleTCS.TCS[${i}]`, `Schedule TCS row ${i + 1}: the unclaimed TCS brought forward and the TCS of the current financial year cannot be entered in the same row`);
        }
      });
      if (tcsRows.length > 0 && tot > 0) {
        eq('A484', 'ScheduleTCS.TotalSchTCS', num(g('ScheduleTCS.TotalSchTCS')), tot, 'Schedule TCS — the total TCS claimed must equal the sum of the individual rows');
      }
    }

    /* ═══════════ Foreign income and assets, PTI, Schedule 5A ═══════════ */

    rows(g('ScheduleFSI.ScheduleFSIDtls')).forEach((r, i) => {
      const p = `ScheduleFSI.ScheduleFSIDtls[${i}]`;
      let b = 0;
      let e = 0;
      for (const h of ['IncFromSal', 'IncFromHP', 'IncCapGain', 'IncOthSrc']) {
        b += num(at(r[h], 'IncFrmOutsideInd'));
        e += num(at(r[h], 'TaxReliefinInia'));
      }
      const tot = r.TotalCountryWise;
      if (isObj(tot)) {
        eq('A466', `${p}.TotalCountryWise.IncFrmOutsideInd`, num(tot.IncFrmOutsideInd), b, `Schedule FSI row ${i + 1}: the total income from outside India must equal the sum of the four heads`);
        eq('A464', `${p}.TotalCountryWise.TaxReliefinInia`, num(tot.TaxReliefinInia), e, `Schedule FSI row ${i + 1}: the total tax relief available in India must equal the sum of the four heads`);
      }
    });
    if (isObj(g('ScheduleTR1'))) {
      const trRows = g('ScheduleTR1.ScheduleTR');
      eq('A477', 'ScheduleTR1.TotalTaxPaidOutsideIndia', num(g('ScheduleTR1.TotalTaxPaidOutsideIndia')), sumRows(trRows, 'TaxPaidOutsideIndia'), 'Schedule TR — the total taxes paid outside India must equal the sum of the country-wise rows');
      eq('A478', 'ScheduleTR1.TotalTaxReliefOutsideIndia', num(g('ScheduleTR1.TotalTaxReliefOutsideIndia')), sumRows(trRows, 'TaxReliefOutsideIndia'), 'Schedule TR — the total tax relief available must equal the sum of the country-wise rows');
      let dtaa = 0;
      let notDtaa = 0;
      for (const r of rows(trRows)) {
        const sec = str(r.ReliefClaimedUsSection);
        if (sec === '90' || sec === '90A' || sec === '9090A') dtaa += num(r.TaxReliefOutsideIndia);
        else if (sec === '91') notDtaa += num(r.TaxReliefOutsideIndia);
      }
      if (dtaa + notDtaa > 0) {
        eq('A474', 'ScheduleTR1.TaxReliefOutsideIndiaDTAA', num(g('ScheduleTR1.TaxReliefOutsideIndiaDTAA')), dtaa, 'Schedule TR — the relief where a DTAA applies (s.90/90A) must equal the sum of the rows marked as s.90/90A');
        eq('A475', 'ScheduleTR1.TaxReliefOutsideIndiaNotDTAA', num(g('ScheduleTR1.TaxReliefOutsideIndiaNotDTAA')), notDtaa, 'Schedule TR — the relief where no DTAA applies (s.91) must equal the sum of the rows marked as s.91');
      }
    }
    if (isObj(g('Schedule5A2014'))) {
      for (const c of ['IncRecvdUndHead', 'AmtApprndOfSpouse', 'AmtTDSDeducted', 'TDSApprndOfSpouse']) {
        eq('A473', `Schedule5A2014.TotalHeadIncome.${c}`, num(g(`Schedule5A2014.TotalHeadIncome.${c}`)),
          num(g(`Schedule5A2014.HPHeadIncome.${c}`)) + num(g(`Schedule5A2014.CapGainHeadIncome.${c}`)) + num(g(`Schedule5A2014.OtherSourcesHeadIncome.${c}`)),
          `Schedule 5A — the total at Sl. No. 4 (${c}) must equal the sum of Sl. Nos. 1 + 2 + 3`);
      }
      const spousePAN = str(g('Schedule5A2014.PANOfSpouse'));
      if (spousePAN && !PAN_RE.test(spousePAN)) {
        err('SCHEMA', 'Schedule5A2014.PANOfSpouse', `Schedule 5A — the PAN of the spouse "${spousePAN}" is not in the valid AAAAA9999A format`);
      }
    }
    rows(g('SchedulePTI.SchedulePTIDtls')).forEach((r, i) => {
      if (isObj(r.OS_Dividend) || isObj(r.OS_Others)) {
        eq('A462', `SchedulePTI.SchedulePTIDtls[${i}].IncOthSrc`, num(at(r.IncOthSrc, 'IncPTI')), num(at(r.OS_Dividend, 'IncPTI')) + num(at(r.OS_Others, 'IncPTI')),
          `Schedule PTI row ${i + 1}: the other-sources income must equal the sum of the dividend and the other components`);
      }
    });
    if (isObj(g('ScheduleEI')) && !isEmpty(g('SchedulePTI.SchedulePTIDtls'))) {
      let exempt = 0;
      for (const r of rows(g('SchedulePTI.SchedulePTIDtls'))) exempt += num(at(r.IncClmdPTI, 'IncPTI'));
      if (exempt > 0) {
        eq('A454', 'ScheduleEI.PassThrIncNotChrgblTax', num(g('ScheduleEI.PassThrIncNotChrgblTax')), exempt, 'Schedule EI Sl. No. 5 — the pass-through income not chargeable to tax must equal the exempt income shown in Schedule PTI');
      }
    }
    /* The assets-outside-India flag must agree with Schedule FA. */
    if (str(g(`${TTI}.AssetOutIndiaFlag`)) === 'YES' && isEmpty(g('ScheduleFA'))) {
      err('SCHEMA', 'ScheduleFA', 'The assets-outside-India flag is "YES" — Schedule FA (foreign assets) must be filled');
    }
    if (str(g(`${TTI}.AssetOutIndiaFlag`)) === 'NO' && !isEmpty(g('ScheduleFA'))) {
      err('SCHEMA', 'ScheduleFA', 'Schedule FA is filled but the assets-outside-India flag is "NO"');
    }

    /* ═══════════ Bank accounts and refund ═══════════ */

    {
      const bankFlag = str(g(`${TTI}.Refund.BankAccountDtls.BankDtlsFlag`));
      const accounts = g(`${TTI}.Refund.BankAccountDtls.AddtnlBankDetails`);
      const foreign = g(`${TTI}.Refund.BankAccountDtls.ForeignBankDetails`);
      if (bankFlag === 'Y' && isEmpty(accounts) && isEmpty(foreign)) {
        err('SCHEMA', `${TTI}.Refund.BankAccountDtls.AddtnlBankDetails`, 'The bank-details flag is "Y" but no bank account row is filled (Bank Accounts section)');
      }
      if (num(g(`${TTI}.Refund.RefundDue`)) > 0 && isEmpty(accounts) && isEmpty(foreign)) {
        err('A558', `${TTI}.Refund.BankAccountDtls`, 'A refund is claimed but no bank account is provided — at least one pre-validated account is required for the refund credit');
      }
      let nominated = 0;
      rows(accounts).forEach((acc, i) => {
        const ifsc = str(acc.IFSCCode);
        if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
          err('A558', `${TTI}.Refund.BankAccountDtls.AddtnlBankDetails[${i}].IFSCCode`, `Bank account ${i + 1}: the IFSC "${ifsc}" is not in the valid AAAA0XXXXXX format and must match the RBI database`);
        }
        const use = acc.UseForRefund;
        if (use === true || str(use).toLowerCase() === 'true') nominated += 1;
      });
      if (num(g(`${TTI}.Refund.RefundDue`)) > 0 && Array.isArray(accounts) && accounts.length > 0 && nominated === 0 && isEmpty(foreign)) {
        warn('A558', `${TTI}.Refund.BankAccountDtls.AddtnlBankDetails`, 'A refund is claimed but no bank account is nominated for the refund credit ("UseForRefund")');
      }
    }
  } catch {
    /* The contract forbids throwing — surface the failure instead. */
    errors.push({ path: 'ITR.ITR2', msg: 'Internal error while validating the ITR-2 JSON — the payload shape is unexpected' });
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
