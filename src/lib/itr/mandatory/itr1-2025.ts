/**
 * ITR-1 (Sahaj) — AY 2025-26 mandatory-field validator.
 *
 * Sources (distilled at build time — this module embeds the result, it does NOT
 * read the raw schema):
 *  - Official ITD JSON schema  ITR-1_2025_Main_V1.2.json  (SchemaVer/FormVer "Ver1.0")
 *  - CBDT "ITR 1 — Validation Rules for AY 2025-26" V1.1 (10 Jul 2025), Category A
 *
 * The required-tree below mirrors the schema's recursive `required` chains for
 * the payload root { ITR: { ITR1: {...} } }. Semantics:
 *  - a node marked r:1 is required WITHIN its parent — it is reported missing
 *    only when the parent exists (or the parent itself is required all the way
 *    up from the root, in which case the whole chain is enumerated);
 *  - optional sections (schedules) are validated only when present in the JSON;
 *  - array items are validated per element.
 *
 * Category-A rules that are checkable on the exported JSON alone are encoded in
 * runCategoryARules(). Rules needing external data (PAN database, 26AS, RBI
 * IFSC master, e-filing history) are intentionally skipped. Arithmetic
 * equalities allow a +/- 1 rupee rounding tolerance.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

export const SCHEMA_VERSION = 'Ver1.0 (ITR-1_2025_Main_V1.2)';

/* ────────────────────────────────────────────────────────────────────────────
 * Distilled required-tree
 * ──────────────────────────────────────────────────────────────────────────── */

interface Spec {
  /** required within its parent */
  r?: 1;
  /** object children */
  k?: { [key: string]: Spec };
  /** array item spec */
  a?: Spec;
}

/** Shared shorthand: required leaf. */
const L: Spec = { r: 1 };
/** Optional leaf (documents intent where useful). */
const O: Spec = {};

const ADDRESS_DETAIL: Spec = {
  r: 1,
  k: { AddrDetail: L, CityOrTownOrDistrict: L, StateCode: L, PinCode: L },
};

const DONEE_ITEM: Spec = {
  k: {
    DoneeWithPanName: L,
    DoneePAN: L,
    AddressDetail: ADDRESS_DETAIL,
    DonationAmtCash: L,
    DonationAmtOtherMode: L,
    DonationAmt: L,
    EligibleDonationAmt: L,
  },
};

/** One 80G table (A/B/C/D): donee list + its four required totals. */
function g80Table(totCash: string, totOther: string, tot: string, elig: string): Spec {
  const k: { [key: string]: Spec } = { DoneeWithPan: { a: DONEE_ITEM } };
  k[totCash] = L; k[totOther] = L; k[tot] = L; k[elig] = L;
  return { k };
}

/** Loan-based deduction schedule (80E/80EE/80EEA/80EEB/24B). */
function loanSchedule(dtlsKey: string, intKey: string, totKey: string, extraItem?: string): Spec {
  const item: { [key: string]: Spec } = {
    LoanTknFrom: L,
    BankOrInstnName: L,
    LoanAccNoOfBankOrInstnRefNo: L,
    DateofLoan: L,
    TotalLoanAmt: L,
    LoanOutstndngAmt: L,
  };
  if (extraItem) item[extraItem] = L;
  item[intKey] = L;
  const k: { [key: string]: Spec } = {};
  k[dtlsKey] = { r: 1, a: { k: item } };
  k[totKey] = L;
  return { k };
}

/** 80D health-insurance details block (Sch80DInsDtls[] + TotalPayments). */
const HI_DTLS: Spec = {
  k: {
    Sch80DInsDtls: { r: 1, a: { k: { InsurerName: L, PolicyNo: L, HealthInsAmt: L } } },
    TotalPayments: L,
  },
};

/** Deductor/collector details (TAN + name). */
const DEDUCTOR: Spec = { r: 1, k: { TAN: L, EmployerOrDeductorOrCollecterName: L } };

/** Challan row (Schedule IT / PartB-ATI Schedule IT1/IT2). */
const CHALLAN_ITEM: Spec = { k: { BSRCode: L, DateDep: L, SrlNoOfChaln: L, Amt: L } };

const VIA_COMMON: { [key: string]: Spec } = {
  Section80C: L, Section80CCC: L, Section80CCDEmployeeOrSE: L, Section80CCD1B: L,
  Section80CCDEmployer: L, Section80D: L, Section80DD: L, Section80DDB: L,
  Section80E: L, Section80EE: L, Section80G: L, Section80GG: L, Section80GGA: L,
  Section80GGC: L, Section80U: L, Section80TTA: L, Section80TTB: L,
  AnyOthSec80CCH: L, TotalChapVIADeductions: L,
};

const DATE_RANGE: Spec = {
  r: 1,
  k: { Upto15Of6: L, Upto15Of9: L, Up16Of9To15Of12: L, Up16Of12To15Of3: L, Up16Of3To31Of3: L },
};

const SPEC: Spec = {
  k: {
    ITR: {
      r: 1,
      k: {
        ITR1: {
          r: 1,
          k: {
            CreationInfo: {
              r: 1,
              k: {
                SWVersionNo: L, SWCreatedBy: L, JSONCreatedBy: L,
                JSONCreationDate: L, IntermediaryCity: L, Digest: L,
              },
            },
            Form_ITR1: {
              r: 1,
              k: { FormName: L, Description: L, AssessmentYear: L, SchemaVer: L, FormVer: L },
            },
            /* Optional — mandatory only for updated returns u/s 139(8A). */
            PartA_139_8A: {
              k: {
                PAN: L, Name: L, AssessmentYear: L, PreviouslyFiledForThisAY: L,
                Applicable_139_8A: { k: { AcknowledgementNo: L, OrigRetFiledDate: L } },
                LaidOutIn_139_8A: L, ITRFormUpdatingInc: L,
                UpdatingInc: { k: { ReasonsForUpdatingIncDtls: { a: { k: { ReasonsForUpdatingIncome: L } } } } },
                UpdatedReturnDuringPeriod: L,
                RetrntoRedCarriedFL: {
                  k: {
                    UnabsorbedDepreciation: L,
                    UDYear: { k: { UnabsorbedDepreciationYearDtls: { a: { k: { UnabsorbedDepreciationYear: L } } } } },
                  },
                },
              },
            },
            'PartB-ATI': {
              k: {
                UpdatedTotInc: L, AmtPayable: L, FeeIncUS234F: L, AggrLiabilityRefund: L,
                AggrLiabilityNoRefund: L, AddtnlIncTax: L, NetPayable: L, TaxUS140B: L,
                TaxDue10_11: L, ReleifUS89: L,
                ScheduleIT1: { k: { TaxPayment1: { k: { ITTaxPayments: { a: CHALLAN_ITEM } } }, Total: L } },
                ScheduleIT2: { k: { TaxPayment2: { k: { ITTaxPayments: { a: CHALLAN_ITEM } } }, Total: L } },
              },
            },
            PersonalInfo: {
              r: 1,
              k: {
                AssesseeName: { r: 1, k: { SurNameOrOrgName: L } },
                PAN: L,
                Address: {
                  r: 1,
                  k: {
                    ResidenceNo: L, LocalityOrArea: L, CityOrTownOrDistrict: L,
                    StateCode: L, CountryCode: L, CountryCodeMobile: L, MobileNo: L, EmailAddress: L,
                  },
                },
                DOB: L,
                EmployerCategory: L,
                AadhaarCardNo: O,
              },
            },
            FilingStatus: {
              r: 1,
              k: {
                ReturnFileSec: L,
                OptOutNewTaxRegime: L,
                clauseiv7provisio139iDtls: { a: { k: { clauseiv7provisio139iNature: L, clauseiv7provisio139iAmount: L } } },
                ItrFilingDueDate: L,
              },
            },
            ITR1_IncomeDeductions: {
              r: 1,
              k: {
                GrossSalary: L,
                IncomeNotified89A: L,
                IncomeNotified89AType: { a: { k: { NOT89ACountrycode: L, NOT89AAmount: L } } },
                AllwncExemptUs10: {
                  k: {
                    AllwncExemptUs10Dtls: { a: { k: { SalNatureDesc: L, SalOthAmount: L } } },
                    TotalAllwncExemptUs10: L,
                  },
                },
                NetSalary: L, DeductionUs16: L, IncomeFromSal: L,
                AnnualValue: L, StandardDeduction: L, TotalIncomeOfHP: L,
                IncomeOthSrc: L,
                OthersInc: {
                  k: {
                    OthersIncDtlsOthSrc: {
                      a: {
                        k: {
                          OthSrcNatureDesc: L,
                          NOT89A: { a: { k: { NOT89ACountrycode: L, NOT89AAmount: L } } },
                          OthSrcOthAmount: L,
                          DividendInc: { k: { DateRange: DATE_RANGE } },
                          NOT89AInc: { k: { DateRange: DATE_RANGE } },
                        },
                      },
                    },
                  },
                },
                GrossTotIncome: L,
                GrossTotIncomeIncLTCG112A: L,
                UsrDeductUndChapVIA: { r: 1, k: { ...VIA_COMMON } },
                DeductUndChapVIA: { r: 1, k: { ...VIA_COMMON, Section80EEA: L, Section80EEB: L } },
                TotalIncome: L,
                ExemptIncAgriOthUs10: {
                  k: {
                    ExemptIncAgriOthUs10Dtls: { a: { k: { NatureDesc: L, OthAmount: L } } },
                    ExemptIncAgriOthUs10Total: L,
                  },
                },
              },
            },
            ITR1_TaxComputation: {
              r: 1,
              k: {
                TotalTaxPayable: L, Rebate87A: L, TaxPayableOnRebate: L, EducationCess: L,
                GrossTaxLiability: L, Section89: L, NetTaxLiability: L, TotalIntrstPay: L,
                IntrstPay: {
                  r: 1,
                  k: { IntrstPayUs234A: L, IntrstPayUs234B: L, IntrstPayUs234C: L, LateFilingFee234F: L },
                },
                TotTaxPlusIntrstPay: L,
              },
            },
            TaxPaid: {
              r: 1,
              k: {
                TaxesPaid: {
                  r: 1,
                  k: { AdvanceTax: L, TDS: L, TCS: L, SelfAssessmentTax: L, TotalTaxesPaid: L },
                },
                BalTaxPayable: L,
              },
            },
            Refund: {
              r: 1,
              k: {
                RefundDue: L,
                BankAccountDtls: {
                  r: 1,
                  k: {
                    AddtnlBankDetails: {
                      a: { k: { IFSCCode: L, BankName: L, BankAccountNo: L, AccountType: L, UseForRefund: L } },
                    },
                  },
                },
              },
            },
            Schedule80G: {
              k: {
                Don100Percent: g80Table('TotDon100PercentCash', 'TotDon100PercentOtherMode', 'TotDon100Percent', 'TotEligibleDon100Percent'),
                Don50PercentNoApprReqd: g80Table('TotDon50PercentNoApprReqdCash', 'TotDon50PercentNoApprReqdOtherMode', 'TotDon50PercentNoApprReqd', 'TotEligibleDon50Percent'),
                Don100PercentApprReqd: g80Table('TotDon100PercentApprReqdCash', 'TotDon100PercentApprReqdOtherMode', 'TotDon100PercentApprReqd', 'TotEligibleDon100PercentApprReqd'),
                Don50PercentApprReqd: g80Table('TotDon50PercentApprReqdCash', 'TotDon50PercentApprReqdOtherMode', 'TotDon50PercentApprReqd', 'TotEligibleDon50PercentApprReqd'),
                TotalDonationsUs80GCash: L, TotalDonationsUs80GOtherMode: L,
                TotalDonationsUs80G: L, TotalEligibleDonationsUs80G: L,
              },
            },
            Schedule80GGA: {
              k: {
                DonationDtlsSciRsrchRuralDev: {
                  a: {
                    k: {
                      RelevantClauseUndrDedClaimed: L, NameOfDonee: L, AddressDetail: ADDRESS_DETAIL,
                      DoneePAN: L, DonationAmtCash: L, DonationAmtOtherMode: L, DonationAmt: L, EligibleDonationAmt: L,
                    },
                  },
                },
                TotalDonationAmtCash80GGA: L, TotalDonationAmtOtherMode80GGA: L,
                TotalDonationsUs80GGA: L, TotalEligibleDonationAmt80GGA: L,
              },
            },
            Schedule80GGC: {
              k: {
                Schedule80GGCDetails: {
                  a: { k: { DonationDate: L, DonationAmtCash: L, DonationAmtOtherMode: L, DonationAmt: L, EligibleDonationAmt: L } },
                },
                TotalDonationAmtCash80GGC: L, TotalDonationAmtOtherMode80GGC: L,
                TotalDonationsUs80GGC: L, TotalEligibleDonationAmt80GGC: L,
              },
            },
            Schedule80D: {
              k: {
                Sec80DSelfFamSrCtznHealth: {
                  r: 1,
                  k: {
                    SeniorCitizenFlag: L,
                    Sec80DSelfFamHIDtls: HI_DTLS,
                    Sec80DSelfFamSrCtznHIDtls: HI_DTLS,
                    ParentsSeniorCitizenFlag: L,
                    Sec80DParentsHIDtls: HI_DTLS,
                    Sec80DParentsSrCtznHIDtls: HI_DTLS,
                    EligibleAmountOfDedn: L,
                  },
                },
              },
            },
            Schedule80DD: { k: { NatureOfDisability: L, TypeOfDisability: L, DeductionAmount: L, DependentType: L } },
            Schedule80U: { k: { NatureOfDisability: L, TypeOfDisability: L, DeductionAmount: L } },
            Schedule80E: loanSchedule('Schedule80EDtls', 'Interest80E', 'TotalInterest80E'),
            Schedule80EE: loanSchedule('Schedule80EEDtls', 'Interest80EE', 'TotalInterest80EE'),
            Schedule80EEA: {
              k: {
                PropStmpDtyVal: L,
                ...loanSchedule('Schedule80EEADtls', 'Interest80EEA', 'TotalInterest80EEA').k,
              },
            },
            Schedule80EEB: loanSchedule('Schedule80EEBDtls', 'Interest80EEB', 'TotalInterest80EEB', 'VehicleRegNo'),
            Schedule80C: {
              k: {
                Schedule80CDtls: { r: 1, a: { k: { Amount: L, IdentificationNo: L } } },
                TotalAmt: L,
              },
            },
            ScheduleUs24B: loanSchedule('ScheduleUs24BDtls', 'InterestUs24B', 'TotalInterestUs24B'),
            ScheduleEA10_13A: {
              k: {
                Placeofwork: L, ActlHRARecv: L, ActlRentPaid: L, DtlsSalUsSec171: L,
                BasicSalary: L, ActlRentPaid10Per: L, Sal40Or50Per: L, EligbleExmpAllwncUs13A: L,
              },
            },
            TDSonSalaries: {
              k: {
                TDSonSalary: { a: { k: { EmployerOrDeductorOrCollectDetl: DEDUCTOR, IncChrgSal: L, TotalTDSSal: L } } },
                TotalTDSonSalaries: L,
              },
            },
            TDSonOthThanSals: {
              k: {
                TDSonOthThanSal: {
                  a: {
                    k: {
                      EmployerOrDeductorOrCollectDetl: DEDUCTOR, TDSSection: L, AmtForTaxDeduct: L,
                      DeductedYr: L, TotTDSOnAmtPaid: L, ClaimOutOfTotTDSOnAmtPaid: L,
                    },
                  },
                },
                TotalTDSonOthThanSals: L,
              },
            },
            ScheduleTDS3Dtls: {
              k: {
                TDS3Details: {
                  a: {
                    k: {
                      PANofTenant: L, TDSSection: L, NameOfTenant: L, GrsRcptToTaxDeduct: L,
                      DeductedYr: L, TDSDeducted: L, TDSClaimed: L,
                    },
                  },
                },
                TotalTDS3Details: L,
              },
            },
            ScheduleTCS: {
              k: {
                TCS: {
                  a: {
                    k: {
                      EmployerOrDeductorOrCollectDetl: DEDUCTOR, AmtTaxCollected: L,
                      CollectedYr: L, TotalTCS: L, AmtTCSClaimedThisYear: L,
                    },
                  },
                },
                TotalSchTCS: L,
              },
            },
            TaxPayments: { k: { TaxPayment: { a: CHALLAN_ITEM }, TotalTaxPayments: L } },
            LTCG112A: { k: { TotSaleCnsdrn: L, TotCstAcqisn: L, LongCap112A: L } },
            Verification: {
              r: 1,
              k: {
                Declaration: { r: 1, k: { AssesseeVerName: L, FatherName: L, AssesseeVerPAN: L } },
                Capacity: L,
                Place: L,
              },
            },
            TaxReturnPreparer: { k: { IdentificationNoOfTRP: L, NameOfTRP: L } },
          },
        },
      },
    },
  },
};

/* ────────────────────────────────────────────────────────────────────────────
 * Labels + hints
 * ──────────────────────────────────────────────────────────────────────────── */

const LABELS: { [field: string]: string } = {
  ITR: 'ITR payload root', ITR1: 'ITR-1 form data',
  SWVersionNo: 'Software version number', SWCreatedBy: 'Software-created-by code (SWnnnnnnnn)',
  JSONCreatedBy: 'JSON-created-by code (SWnnnnnnnn)', JSONCreationDate: 'JSON creation date',
  IntermediaryCity: 'Intermediary city', Digest: 'JSON digest',
  FormName: 'Form name (must be "ITR-1")', Description: 'Form description',
  AssessmentYear: 'Assessment year (must be 2025)', SchemaVer: 'Schema version (Ver1.0)', FormVer: 'Form version (Ver1.0)',
  PAN: 'PAN of the assessee', Name: 'Name of the assessee',
  SurNameOrOrgName: 'Surname / last name of the assessee',
  ResidenceNo: 'Flat / door / block number', LocalityOrArea: 'Locality / area',
  CityOrTownOrDistrict: 'City / town / district', StateCode: 'State', CountryCode: 'Country',
  CountryCodeMobile: 'Mobile country code', MobileNo: 'Mobile number', EmailAddress: 'E-mail address',
  PinCode: 'PIN code', AddrDetail: 'Address line',
  DOB: 'Date of birth', EmployerCategory: 'Nature of employment (employer category)',
  ReturnFileSec: 'Section under which the return is filed',
  OptOutNewTaxRegime: 'Opting out of new tax regime (Y/N)',
  ItrFilingDueDate: 'Due date for filing the return',
  clauseiv7provisio139iNature: 'Nature under clause (iv) of 7th proviso to 139(1)',
  clauseiv7provisio139iAmount: 'Amount under clause (iv) of 7th proviso to 139(1)',
  GrossSalary: 'Gross salary', IncomeNotified89A: 'Income from notified retirement account u/s 89A',
  NOT89ACountrycode: 'Country of the 89A retirement account', NOT89AAmount: 'Amount for the 89A retirement account',
  SalNatureDesc: 'Nature of exempt allowance u/s 10', SalOthAmount: 'Amount of exempt allowance',
  TotalAllwncExemptUs10: 'Total allowances exempt u/s 10',
  NetSalary: 'Net salary', DeductionUs16: 'Deductions u/s 16', IncomeFromSal: 'Income chargeable under Salaries',
  AnnualValue: 'Annual value of house property', StandardDeduction: 'Standard deduction (30% of annual value)',
  TotalIncomeOfHP: 'Income chargeable under House Property', IncomeOthSrc: 'Income from other sources',
  OthSrcNatureDesc: 'Nature of income from other sources', OthSrcOthAmount: 'Amount of other-source income',
  GrossTotIncome: 'Gross total income', GrossTotIncomeIncLTCG112A: 'Gross total income including LTCG u/s 112A',
  TotalChapVIADeductions: 'Total Chapter VI-A deductions', TotalIncome: 'Total income',
  NatureDesc: 'Nature of exempt income', OthAmount: 'Amount of exempt income',
  ExemptIncAgriOthUs10Total: 'Total exempt income (agriculture and u/s 10)',
  TotalTaxPayable: 'Tax payable on total income', Rebate87A: 'Rebate u/s 87A',
  TaxPayableOnRebate: 'Tax payable after rebate', EducationCess: 'Health & education cess',
  GrossTaxLiability: 'Total tax and cess', Section89: 'Relief u/s 89',
  NetTaxLiability: 'Balance tax after relief', TotalIntrstPay: 'Total interest and fee payable',
  IntrstPayUs234A: 'Interest u/s 234A', IntrstPayUs234B: 'Interest u/s 234B',
  IntrstPayUs234C: 'Interest u/s 234C', LateFilingFee234F: 'Late-filing fee u/s 234F',
  TotTaxPlusIntrstPay: 'Total tax, fee and interest',
  AdvanceTax: 'Advance tax paid', TDS: 'Total TDS claimed', TCS: 'Total TCS claimed',
  SelfAssessmentTax: 'Self-assessment tax paid', TotalTaxesPaid: 'Total taxes paid',
  BalTaxPayable: 'Balance tax payable', RefundDue: 'Refund due',
  BankAccountDtls: 'Bank account details block',
  IFSCCode: 'IFSC of the bank', BankName: 'Bank name', BankAccountNo: 'Bank account number',
  AccountType: 'Type of bank account', UseForRefund: 'Bank account selected for refund',
  DoneeWithPanName: 'Name of donee', DoneePAN: 'PAN of donee',
  DonationAmtCash: 'Donation in cash', DonationAmtOtherMode: 'Donation in other mode',
  DonationAmt: 'Total donation', EligibleDonationAmt: 'Eligible donation amount',
  RelevantClauseUndrDedClaimed: 'Clause under which 80GGA deduction is claimed',
  NameOfDonee: 'Name of donee', DonationDate: 'Date of contribution',
  SeniorCitizenFlag: 'Whether self/family is a senior citizen (80D)',
  ParentsSeniorCitizenFlag: 'Whether a parent is a senior citizen (80D)',
  InsurerName: 'Name of insurer', PolicyNo: 'Policy number', HealthInsAmt: 'Health insurance premium',
  TotalPayments: 'Total payments', EligibleAmountOfDedn: 'Eligible amount of deduction (80D)',
  NatureOfDisability: 'Nature of disability', TypeOfDisability: 'Type of disability',
  DeductionAmount: 'Amount of deduction', DependentType: 'Type of dependent',
  LoanTknFrom: 'Loan taken from (bank/institution)', BankOrInstnName: 'Name of bank/institution',
  LoanAccNoOfBankOrInstnRefNo: 'Loan account / reference number', DateofLoan: 'Date of loan sanction',
  TotalLoanAmt: 'Total loan amount', LoanOutstndngAmt: 'Loan amount outstanding',
  Interest80E: 'Interest u/s 80E', TotalInterest80E: 'Total interest u/s 80E',
  Interest80EE: 'Interest u/s 80EE', TotalInterest80EE: 'Total interest u/s 80EE',
  Interest80EEA: 'Interest u/s 80EEA', TotalInterest80EEA: 'Total interest u/s 80EEA',
  Interest80EEB: 'Interest u/s 80EEB', TotalInterest80EEB: 'Total interest u/s 80EEB',
  PropStmpDtyVal: 'Stamp duty value of the property (80EEA)', VehicleRegNo: 'Vehicle registration number (80EEB)',
  InterestUs24B: 'Interest u/s 24(b)', TotalInterestUs24B: 'Total interest u/s 24(b)',
  Amount: 'Amount of payment', IdentificationNo: 'Identification number of supporting document',
  TotalAmt: 'Total of payments (80C)',
  Placeofwork: 'Place of work (metro/non-metro)', ActlHRARecv: 'Actual HRA received',
  ActlRentPaid: 'Actual rent paid', DtlsSalUsSec171: 'Salary u/s 17(1)', BasicSalary: 'Basic salary + DA',
  ActlRentPaid10Per: 'Rent paid minus 10% of salary', Sal40Or50Per: '40%/50% of salary',
  EligbleExmpAllwncUs13A: 'Eligible HRA exemption u/s 10(13A)',
  TAN: 'TAN of the deductor/collector', EmployerOrDeductorOrCollecterName: 'Name of deductor/collector',
  IncChrgSal: 'Income chargeable under salaries', TotalTDSSal: 'TDS deducted on salary',
  TotalTDSonSalaries: 'Total TDS on salary',
  TDSSection: 'Section under which TDS is deducted', AmtForTaxDeduct: 'Amount on which TDS is deducted',
  DeductedYr: 'Year of tax deduction', TotTDSOnAmtPaid: 'Total TDS deducted',
  ClaimOutOfTotTDSOnAmtPaid: 'TDS claimed this year', TotalTDSonOthThanSals: 'Total TDS other than salary',
  PANofTenant: 'PAN of tenant/buyer', NameOfTenant: 'Name of tenant/buyer',
  GrsRcptToTaxDeduct: 'Gross receipt on which tax is deducted', TDSDeducted: 'TDS deducted',
  TDSClaimed: 'TDS claimed this year', TotalTDS3Details: 'Total TDS (schedule TDS3)',
  AmtTaxCollected: 'Amount on which tax collected', CollectedYr: 'Year of tax collection',
  TotalTCS: 'Total TCS', AmtTCSClaimedThisYear: 'TCS claimed this year', TotalSchTCS: 'Total TCS claimed',
  BSRCode: 'BSR code of the bank branch', DateDep: 'Date of deposit of challan',
  SrlNoOfChaln: 'Serial number of challan', Amt: 'Tax paid amount', TotalTaxPayments: 'Total tax payments',
  TotSaleCnsdrn: 'Total sale consideration (112A)', TotCstAcqisn: 'Total cost of acquisition (112A)',
  LongCap112A: 'Long-term capital gains u/s 112A',
  AssesseeVerName: 'Name in verification', FatherName: "Father's name in verification",
  AssesseeVerPAN: 'PAN in verification', Capacity: 'Capacity of the person verifying (Self/Representative)',
  Place: 'Place of verification',
  IdentificationNoOfTRP: 'TRP identification number', NameOfTRP: 'Name of the TRP',
  PreviouslyFiledForThisAY: 'Whether a return was previously filed for this AY',
  AcknowledgementNo: 'Acknowledgement number of the original return',
  OrigRetFiledDate: 'Date of filing of the original return',
  LaidOutIn_139_8A: 'Whether conditions of 139(8A) are satisfied',
  ITRFormUpdatingInc: 'ITR form used for updating income',
  ReasonsForUpdatingIncome: 'Reason for updating income',
  UpdatedReturnDuringPeriod: 'Period within which updated return is filed',
  UnabsorbedDepreciation: 'Unabsorbed depreciation flag',
  UnabsorbedDepreciationYear: 'Year of unabsorbed depreciation',
  UpdatedTotInc: 'Updated total income (Part B-ATI)', AmtPayable: 'Amount payable (Part B-ATI)',
  FeeIncUS234F: 'Fee u/s 234F (Part B-ATI)', AggrLiabilityRefund: 'Aggregate liability with refund',
  AggrLiabilityNoRefund: 'Aggregate liability without refund', AddtnlIncTax: 'Additional income-tax',
  NetPayable: 'Net amount payable', TaxUS140B: 'Tax u/s 140B', TaxDue10_11: 'Tax due',
  ReleifUS89: 'Relief u/s 89 (Part B-ATI)', Total: 'Total tax paid',
};

const HINTS: { [topSection: string]: string } = {
  CreationInfo: 'Generated automatically on export',
  Form_ITR1: 'Generated automatically on export',
  PersonalInfo: 'Assessee info. section',
  FilingStatus: 'Filing Details section',
  ITR1_IncomeDeductions: 'Income details (Salary / House Property / Other Sources) and Chapter VI-A deductions',
  ITR1_TaxComputation: 'Tax computation section',
  TaxPaid: 'Taxes paid summary',
  Refund: 'Bank Accounts section',
  Verification: 'Verification section',
  Schedule80G: 'Schedule 80G — donations', Schedule80GGA: 'Schedule 80GGA — donations',
  Schedule80GGC: 'Schedule 80GGC — political contributions',
  Schedule80D: 'Schedule 80D — health insurance', Schedule80DD: 'Schedule 80DD',
  Schedule80U: 'Schedule 80U', Schedule80E: 'Schedule 80E — education loan',
  Schedule80EE: 'Schedule 80EE', Schedule80EEA: 'Schedule 80EEA', Schedule80EEB: 'Schedule 80EEB',
  Schedule80C: 'Schedule 80C', ScheduleUs24B: 'Interest on borrowed capital — schedule 24(b)',
  ScheduleEA10_13A: 'HRA exemption — schedule 10(13A)',
  TDSonSalaries: 'TDS on salary (TDS1)', TDSonOthThanSals: 'TDS other than salary (TDS2)',
  ScheduleTDS3Dtls: 'TDS on rent / property (TDS3)', ScheduleTCS: 'TCS schedule',
  TaxPayments: 'Advance / self-assessment tax challans (Schedule IT)',
  LTCG112A: 'LTCG u/s 112A section',
  PartA_139_8A: 'Updated return (139(8A)) details', 'PartB-ATI': 'Part B-ATI (updated return tax)',
  TaxReturnPreparer: 'TRP details',
};

function fieldLabel(path: string): string {
  const segs = path.split('.');
  const last = segs[segs.length - 1].replace(/\[\d+\]$/, '');
  return LABELS[last] || last.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function fieldHint(path: string): string | undefined {
  const segs = path.split('.');
  // path shape: ITR.ITR1.<TopSection>....
  const top = segs.length >= 3 ? segs[2].replace(/\[\d+\]$/, '') : undefined;
  return top ? HINTS[top] : undefined;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Required-tree walker
 * ──────────────────────────────────────────────────────────────────────────── */

function hasRequiredDescendant(spec: Spec): boolean {
  if (spec.k) for (const key of Object.keys(spec.k)) {
    const c = spec.k[key];
    if (c.r || hasRequiredDescendant(c)) return true;
  }
  if (spec.a) return hasRequiredDescendant(spec.a);
  return false;
}

function pushMissing(out: MissingField[], path: string): void {
  const hint = fieldHint(path);
  const entry: MissingField = { path, label: fieldLabel(path) };
  if (hint) entry.hint = hint;
  out.push(entry);
}

/**
 * Walk the spec against a value. `val` may be undefined (parent missing but
 * required — we still enumerate required leaves so the CA sees the full list).
 */
function walkSpec(spec: Spec, val: unknown, path: string, out: MissingField[], depth: number): void {
  if (depth > 24 || !spec.k) return;
  const obj = val !== null && typeof val === 'object' && !Array.isArray(val)
    ? (val as { [key: string]: unknown })
    : undefined;
  for (const key of Object.keys(spec.k)) {
    const child = spec.k[key];
    const cv = obj ? obj[key] : undefined;
    const cp = path ? `${path}.${key}` : key;
    if (isEmpty(cv)) {
      if (child.r) {
        if (child.k && hasRequiredDescendant(child)) {
          // enumerate the required leaves inside the missing required object;
          // if none surface (e.g. all live under optional arrays), report the
          // container itself so the omission is still visible
          const before = out.length;
          walkSpec(child, undefined, cp, out, depth + 1);
          if (out.length === before) pushMissing(out, cp);
        } else {
          pushMissing(out, cp);
        }
      }
      // optional & absent → nothing to check
    } else if (Array.isArray(cv)) {
      if (child.a) {
        for (let i = 0; i < cv.length; i++) walkSpec(child.a, cv[i], `${cp}[${i}]`, out, depth + 1);
      }
    } else if (child.k) {
      walkSpec(child, cv, cp, out, depth + 1);
    }
  }
}

/** Count of required leaf/array paths encoded in the tree (for diagnostics). */
export function countRequiredPaths(spec: Spec = SPEC): number {
  let n = 0;
  if (spec.k) for (const key of Object.keys(spec.k)) {
    const c = spec.k[key];
    if (c.r && !(c.k && hasRequiredDescendant(c))) n += 1;
    n += countRequiredPaths(c);
  }
  if (spec.a) n += countRequiredPaths(spec.a);
  return n;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Identity / pattern checks from the schema
 * ──────────────────────────────────────────────────────────────────────────── */

const PAN_RX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const DATE_RX = /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

interface PatternCheck { path: string; test: (v: string) => boolean; msg: string }

const PATTERN_CHECKS: PatternCheck[] = [
  { path: 'ITR.ITR1.Form_ITR1.FormName', test: v => v === 'ITR-1', msg: 'FormName must be exactly "ITR-1"' },
  { path: 'ITR.ITR1.Form_ITR1.AssessmentYear', test: v => v === '2025', msg: 'AssessmentYear must be "2025" for AY 2025-26' },
  { path: 'ITR.ITR1.Form_ITR1.SchemaVer', test: v => v === 'Ver1.0', msg: 'SchemaVer must be "Ver1.0"' },
  { path: 'ITR.ITR1.Form_ITR1.FormVer', test: v => v === 'Ver1.0', msg: 'FormVer must be "Ver1.0"' },
  { path: 'ITR.ITR1.PersonalInfo.PAN', test: v => PAN_RX.test(v), msg: 'PAN must match AAAAA9999A' },
  { path: 'ITR.ITR1.PersonalInfo.DOB', test: v => DATE_RX.test(v), msg: 'Date of birth must be YYYY-MM-DD' },
  { path: 'ITR.ITR1.Verification.Declaration.AssesseeVerPAN', test: v => PAN_RX.test(v), msg: 'Verification PAN must match AAAAA9999A' },
  { path: 'ITR.ITR1.Verification.Capacity', test: v => v === 'S' || v === 'R', msg: 'Verification capacity must be S (Self) or R (Representative)' },
  { path: 'ITR.ITR1.FilingStatus.OptOutNewTaxRegime', test: v => v === 'Y' || v === 'N', msg: 'Opting-out flag must be Y or N' },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Category-A rules (checkable on the JSON alone)
 * ──────────────────────────────────────────────────────────────────────────── */

const ID = 'ITR1_IncomeDeductions';
const VIA = `${ID}.DeductUndChapVIA`;
const TCOMP = 'ITR1_TaxComputation';

function runCategoryARules(json: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const P = (p: string): unknown => at(json, `ITR.ITR1.${p}`);
  const N = (p: string): number => { const v = P(p); return typeof v === 'number' && isFinite(v) ? v : 0; };
  const S = (p: string): string => { const v = P(p); return typeof v === 'string' ? v : ''; };
  const A = (p: string): Array<{ [key: string]: unknown }> => {
    const v = P(p);
    return Array.isArray(v) ? (v.filter(e => e !== null && typeof e === 'object') as Array<{ [key: string]: unknown }>) : [];
  };
  const has = (p: string): boolean => !isEmpty(P(p));
  const gn = (o: { [key: string]: unknown }, k: string): number => {
    const v = o[k]; return typeof v === 'number' && isFinite(v) ? v : 0;
  };
  const gs = (o: { [key: string]: unknown }, k: string): string => {
    const v = o[k]; return typeof v === 'string' ? v : '';
  };
  const err = (path: string, msg: string, rule: string): void => { errors.push({ path: `ITR.ITR1.${path}`, msg, rule }); };
  const warn = (path: string, msg: string, rule?: string): void => {
    const w: MandatoryIssue = { path: `ITR.ITR1.${path}`, msg };
    if (rule) w.rule = rule;
    warnings.push(w);
  };
  const eq = (a: number, b: number): boolean => Math.abs(a - b) <= 1; // 1-rupee rounding tolerance

  const itr1 = at(json, 'ITR.ITR1');
  if (itr1 === null || itr1 === undefined || typeof itr1 !== 'object') return; // tree walk already reported

  const regime = S('FilingStatus.OptOutNewTaxRegime'); // 'Y' = OLD regime, 'N' = NEW regime
  const isOld = regime === 'Y';
  const isNew = regime === 'N';
  const dob = S('PersonalInfo.DOB');
  const pan = S('PersonalInfo.PAN');
  const verPan = S('Verification.Declaration.AssesseeVerPAN');
  const gti = N(`${ID}.GrossTotIncome`);
  const gtiIncLtcg = N(`${ID}.GrossTotIncomeIncLTCG112A`);
  const totalIncome = N(`${ID}.TotalIncome`);
  const ltcg = N('LTCG112A.LongCap112A');

  /* ── Eligibility / identity ── */
  // A-277: individuals born on/after 01-04-2007 cannot file for AY 2025-26.
  if (dob && DATE_RX.test(dob) && dob >= '2007-04-01') {
    err('PersonalInfo.DOB', 'Date of birth on or after 01/04/2007 — return for AY 2025-26 not allowed (minor as on 31/03/2025)', 'A-277');
  }
  // A-117: total income excluding LTCG u/s 112A must not exceed Rs 50 lakh for ITR-1.
  if (totalIncome - ltcg > 5000000) {
    err(`${ID}.TotalIncome`, 'Total income excluding LTCG u/s 112A exceeds Rs 50,00,000 — not eligible for ITR-1', 'A-117');
  }
  // A-219 / A-274: salary income but employer category "Not Applicable".
  if (N(`${ID}.GrossSalary`) > 0 && S('PersonalInfo.EmployerCategory') === 'NA') {
    err('PersonalInfo.EmployerCategory', 'Nature of employment cannot be "Not Applicable" when salary income is disclosed', 'A-219');
  }

  /* ── Salary head arithmetic ── */
  const salParts = ['Salary', 'PerquisitesValue', 'ProfitsInSalary', 'IncomeNotified89A', 'IncomeNotifiedOther89A'];
  // gate on the 17(1)/(2)/(3) breakup being present — the 89A fields alone are
  // schema-required and always present, and must not trigger this check
  if (['Salary', 'PerquisitesValue', 'ProfitsInSalary'].some(f => has(`${ID}.${f}`))) {
    const sum = salParts.reduce((t, f) => t + N(`${ID}.${f}`), 0);
    if (!eq(N(`${ID}.GrossSalary`), sum)) {
      err(`${ID}.GrossSalary`, 'Gross salary must equal 17(1) + 17(2) + 17(3) + 89A incomes', 'A-59');
    }
  }
  if (has(`${ID}.AllwncExemptUs10`) || has(`${ID}.Increliefus89A`)) {
    const net = N(`${ID}.GrossSalary`) - N(`${ID}.AllwncExemptUs10.TotalAllwncExemptUs10`) - N(`${ID}.Increliefus89A`);
    if (!eq(N(`${ID}.NetSalary`), net)) {
      err(`${ID}.NetSalary`, 'Net salary must be Gross salary minus exempt allowances u/s 10 minus relief u/s 89A', 'A-60');
    }
  }
  if (has(`${ID}.DeductionUs16ia`) || has(`${ID}.EntertainmentAlw16ii`) || has(`${ID}.ProfessionalTaxUs16iii`)) {
    const d16 = N(`${ID}.DeductionUs16ia`) + N(`${ID}.EntertainmentAlw16ii`) + N(`${ID}.ProfessionalTaxUs16iii`);
    if (!eq(N(`${ID}.DeductionUs16`), d16)) {
      err(`${ID}.DeductionUs16`, 'Deduction u/s 16 must equal 16(ia) + 16(ii) + 16(iii)', 'A-61');
    }
  }
  if (has(`${ID}.NetSalary`) || has(`${ID}.DeductionUs16`)) {
    if (!eq(N(`${ID}.IncomeFromSal`), N(`${ID}.NetSalary`) - N(`${ID}.DeductionUs16`))) {
      err(`${ID}.IncomeFromSal`, 'Income chargeable under Salaries must be Net salary minus deductions u/s 16', 'A-62');
    }
  }
  if (isOld && N(`${ID}.DeductionUs16ia`) > 50000) {
    err(`${ID}.DeductionUs16ia`, 'Standard deduction u/s 16(ia) limited to Rs 50,000 under the old tax regime', 'A-112');
  }
  if (isNew && N(`${ID}.DeductionUs16ia`) > 75000) {
    err(`${ID}.DeductionUs16ia`, 'Standard deduction u/s 16(ia) limited to Rs 75,000 under the new tax regime', 'A-224');
  }
  if (isNew && N(`${ID}.EntertainmentAlw16ii`) > 0) {
    err(`${ID}.EntertainmentAlw16ii`, 'Entertainment allowance u/s 16(ii) not allowed under the new tax regime', 'A-164');
  }
  if (isNew && N(`${ID}.ProfessionalTaxUs16iii`) > 0) {
    err(`${ID}.ProfessionalTaxUs16iii`, 'Professional tax u/s 16(iii) not allowed under the new tax regime', 'A-169');
  }

  /* ── Exempt allowances u/s 10 ── */
  const allw = A(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`);
  if (has(`${ID}.AllwncExemptUs10`)) {
    const sum = allw.reduce((t, r) => t + gn(r, 'SalOthAmount'), 0);
    if (!eq(N(`${ID}.AllwncExemptUs10.TotalAllwncExemptUs10`), sum)) {
      err(`${ID}.AllwncExemptUs10.TotalAllwncExemptUs10`, 'Total exempt allowances u/s 10 must equal the sum of individual allowances', 'A-77');
    }
    if (N(`${ID}.AllwncExemptUs10.TotalAllwncExemptUs10`) > N(`${ID}.GrossSalary`)) {
      err(`${ID}.AllwncExemptUs10.TotalAllwncExemptUs10`, 'Total exempt allowances u/s 10 cannot exceed Gross salary', 'A-63');
    }
    const seen: { [nature: string]: number } = {};
    allw.forEach((r, i) => {
      const nat = gs(r, 'SalNatureDesc');
      if (!nat) return;
      if (seen[nat] !== undefined) {
        err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls[${i}].SalNatureDesc`, `Exempt-allowance nature "${nat}" selected more than once`, 'A-222');
      } else seen[nat] = i;
    });
    const exclusive = ['10(10B)(i)', '10(10B)(ii)', '10(10C)'].filter(nat => seen[nat] !== undefined);
    if (exclusive.length > 1) {
      err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Only one of 10(10B)(i), 10(10B)(ii) or 10(10C) may be claimed', 'A-72');
    }
    if (isNew) {
      for (const nat of ['10(5)', '10(13A)', '10(14)(i)', '10(14)(ii)']) {
        const idx = seen[nat];
        if (idx !== undefined && gn(allw[idx], 'SalOthAmount') > 0) {
          err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls[${idx}].SalOthAmount`, `Exempt allowance u/s ${nat} not allowed under the new tax regime`, 'A-150');
        }
      }
    }
    // A-275 / A-278: HRA u/s 10(13A) needs schedule 10(13A); amount must match the eligible exemption.
    const hraIdx = seen['10(13A)'];
    if (hraIdx !== undefined && gn(allw[hraIdx], 'SalOthAmount') > 0) {
      if (!has('ScheduleEA10_13A')) {
        err('ScheduleEA10_13A', 'Schedule 10(13A) must be filled to claim HRA exemption u/s 10(13A)', 'A-275');
      } else if (gn(allw[hraIdx], 'SalOthAmount') > N('ScheduleEA10_13A.EligbleExmpAllwncUs13A') + 1) {
        err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls[${hraIdx}].SalOthAmount`, 'HRA exemption claimed exceeds the eligible allowance computed in schedule 10(13A)', 'A-278');
      }
      if (isOld && N(`${VIA}.Section80GG`) > 0) {
        err(`${VIA}.Section80GG`, 'Deduction u/s 80GG not allowed when HRA u/s 10(13A) is claimed', 'A-120');
      }
    }
  }
  // A-273: eligible HRA = least of the three computed figures.
  if (has('ScheduleEA10_13A')) {
    const least = Math.min(N('ScheduleEA10_13A.ActlHRARecv'), N('ScheduleEA10_13A.ActlRentPaid10Per'), N('ScheduleEA10_13A.Sal40Or50Per'));
    if (!eq(N('ScheduleEA10_13A.EligbleExmpAllwncUs13A'), Math.max(0, least))) {
      err('ScheduleEA10_13A.EligbleExmpAllwncUs13A', 'Eligible HRA exemption must be the least of actual HRA, rent paid − 10% of salary, and 40%/50% of salary', 'A-273');
    }
  }

  /* ── House property ── */
  const typeHP = S(`${ID}.TypeOfHP`);
  if (has(`${ID}.AnnualValue`) || has(`${ID}.StandardDeduction`)) {
    const sd = N(`${ID}.StandardDeduction`);
    const av = N(`${ID}.AnnualValue`);
    if (av >= 0 && !eq(sd, Math.round(av * 0.3)) && !eq(sd, Math.floor(av * 0.3))) {
      err(`${ID}.StandardDeduction`, 'Standard deduction on house property must equal 30% of the annual value', 'A-43');
    }
  }
  if ((typeHP === 'L' || typeHP === 'D') && N(`${ID}.GrossRentReceived`) <= 0) {
    err(`${ID}.GrossRentReceived`, 'Gross rent received/lettable value must be more than zero for let-out / deemed let-out property', 'A-45');
  }
  if (N(`${ID}.TaxPaidlocalAuth`) > 0 && N(`${ID}.GrossRentReceived`) <= 0) {
    err(`${ID}.GrossRentReceived`, 'Municipal tax cannot be claimed when gross rent is zero or absent', 'A-44');
  }
  if (typeHP === 'S' && N(`${ID}.TaxPaidlocalAuth`) > 0) {
    err(`${ID}.TaxPaidlocalAuth`, 'Tax paid to local authorities not allowed for self-occupied property', 'A-49');
  }
  if (has(`${ID}.GrossRentReceived`) || has(`${ID}.TaxPaidlocalAuth`)) {
    if (!eq(N(`${ID}.AnnualValue`), N(`${ID}.GrossRentReceived`) - N(`${ID}.TaxPaidlocalAuth`))) {
      err(`${ID}.AnnualValue`, 'Annual value must equal gross rent minus tax paid to local authorities', 'A-46');
    }
  }
  if (typeHP) {
    const hp = N(`${ID}.AnnualValue`) - N(`${ID}.StandardDeduction`) - N(`${ID}.InterestPayable`) + N(`${ID}.ArrearsUnrealizedRentRcvd`);
    if (!eq(N(`${ID}.TotalIncomeOfHP`), hp)) {
      err(`${ID}.TotalIncomeOfHP`, 'Income from house property must equal annual value − 30% standard deduction − interest u/s 24(b) + arrears/unrealised rent', 'A-47');
    }
  }
  if (isOld && typeHP === 'S' && N(`${ID}.InterestPayable`) > 200000) {
    err(`${ID}.InterestPayable`, 'Interest on borrowed capital for self-occupied property limited to Rs 2,00,000 (old regime)', 'A-48');
  }
  if (isNew && typeHP === 'S' && N(`${ID}.InterestPayable`) > 0) {
    err(`${ID}.InterestPayable`, 'Interest on borrowed capital for self-occupied property not allowed under the new tax regime', 'A-163');
  }
  // A-229 / A-250 / A-256: interest u/s 24(b) needs schedule 24B, matching total, and a consistent row-sum.
  if (N(`${ID}.InterestPayable`) > 0) {
    if (!has('ScheduleUs24B')) {
      err('ScheduleUs24B', 'Details of the loan (schedule 24B) must be provided to claim interest on borrowed capital u/s 24(b)', 'A-229');
    } else if (!eq(N(`${ID}.InterestPayable`), N('ScheduleUs24B.TotalInterestUs24B'))) {
      err(`${ID}.InterestPayable`, 'Interest on borrowed capital must equal the total interest as per schedule 24(b)', 'A-250');
    }
  }
  if (has('ScheduleUs24B')) {
    const rows = A('ScheduleUs24B.ScheduleUs24BDtls');
    if (!eq(N('ScheduleUs24B.TotalInterestUs24B'), rows.reduce((t, r) => t + gn(r, 'InterestUs24B'), 0))) {
      err('ScheduleUs24B.TotalInterestUs24B', 'Total of schedule 24(b) must equal the sum of interest of individual loans', 'A-256');
    }
  }

  /* ── Other sources ── */
  const osRows = A(`${ID}.OthersInc.OthersIncDtlsOthSrc`);
  if (osRows.length > 0) {
    const seenOS: { [nature: string]: number } = {};
    const onceOnly = ['SAV', 'IFD', 'TAX', 'FAP', 'DIV', '10(11)(iP)', '10(11)(iiP)', '10(12)(iP)', '10(12)(iiP)', 'NOT89A', 'OTHNOT89A'];
    osRows.forEach((r, i) => {
      const nat = gs(r, 'OthSrcNatureDesc');
      if (!nat) return;
      if (seenOS[nat] !== undefined && onceOnly.indexOf(nat) >= 0) {
        err(`${ID}.OthersInc.OthersIncDtlsOthSrc[${i}].OthSrcNatureDesc`, `Other-source nature "${nat}" selected more than once`, 'A-185');
      } else if (seenOS[nat] === undefined) seenOS[nat] = i;
    });
    const sumOS = osRows.reduce((t, r) => t + gn(r, 'OthSrcOthAmount'), 0);
    const expOS = sumOS - N(`${ID}.DeductionUs57iia`) - N(`${ID}.Increliefus89AOS`);
    if (!eq(N(`${ID}.IncomeOthSrc`), expOS) && !eq(N(`${ID}.IncomeOthSrc`), sumOS)) {
      err(`${ID}.IncomeOthSrc`, 'Income from other sources must equal the sum of individual incomes (net of deduction u/s 57(iia) and 89A relief)', 'A-52');
    }
    // A-146: dividend total must match its quarterly breakup.
    const divIdx = seenOS['DIV'];
    if (divIdx !== undefined) {
      const dr = osRows[divIdx]['DividendInc'];
      if (dr !== null && typeof dr === 'object') {
        const range = (dr as { [key: string]: unknown })['DateRange'];
        if (range !== null && typeof range === 'object') {
          const q = range as { [key: string]: unknown };
          const qs = ['Upto15Of6', 'Upto15Of9', 'Up16Of9To15Of12', 'Up16Of12To15Of3', 'Up16Of3To31Of3']
            .reduce((t, k) => t + (typeof q[k] === 'number' ? (q[k] as number) : 0), 0);
          if (!eq(qs, gn(osRows[divIdx], 'OthSrcOthAmount'))) {
            err(`${ID}.OthersInc.OthersIncDtlsOthSrc[${divIdx}].DividendInc.DateRange`, 'Quarterly breakup of dividend income must equal the total dividend income', 'A-146');
          }
        }
      }
    }
    // A-53 / A-54 / A-223: deduction u/s 57(iia) only against family pension, capped.
    const fapIdx = seenOS['FAP'];
    const d57 = N(`${ID}.DeductionUs57iia`);
    if (d57 > 0) {
      if (fapIdx === undefined) {
        err(`${ID}.DeductionUs57iia`, 'Deduction u/s 57(iia) allowed only when family pension is offered to tax', 'A-53');
      } else {
        const fap = gn(osRows[fapIdx], 'OthSrcOthAmount');
        const cap = isNew ? Math.min(fap / 3, 25000) : Math.min(fap / 3, 15000);
        if (d57 > cap + 1) {
          err(`${ID}.DeductionUs57iia`, `Deduction u/s 57(iia) cannot exceed 1/3rd of family pension or Rs ${isNew ? '25,000' : '15,000'}`, isNew ? 'A-223' : 'A-54');
        }
      }
    }
  } else if (N(`${ID}.DeductionUs57iia`) > 0) {
    err(`${ID}.DeductionUs57iia`, 'Deduction u/s 57(iia) allowed only when family pension is offered to tax', 'A-53');
  }

  /* ── Exempt income (agriculture / u/s 10) ── */
  if (has(`${ID}.ExemptIncAgriOthUs10`)) {
    const rows = A(`${ID}.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls`);
    const seenEx: { [nature: string]: boolean } = {};
    rows.forEach((r, i) => {
      const nat = gs(r, 'NatureDesc');
      if (nat === 'AGRI' && gn(r, 'OthAmount') > 5000) {
        err(`${ID}.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls[${i}].OthAmount`, 'Agricultural income shown as exempt cannot exceed Rs 5,000 in ITR-1', 'A-29');
      }
      if (nat && nat !== 'OTH') {
        if (seenEx[nat]) {
          err(`${ID}.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls[${i}].NatureDesc`, `Exempt-income nature "${nat}" selected more than once`, 'A-185');
        }
        seenEx[nat] = true;
      }
    });
    const sum = rows.reduce((t, r) => t + gn(r, 'OthAmount'), 0);
    if (!eq(N(`${ID}.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total`), sum)) {
      err(`${ID}.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total`, 'Total exempt income must equal the sum of individual exempt incomes', 'A-30');
    }
  }

  /* ── Gross total income chain ── */
  if (has(`${ID}.GrossTotIncome`) || has(`${ID}.GrossTotIncomeIncLTCG112A`)) {
    const heads = N(`${ID}.IncomeFromSal`) + N(`${ID}.TotalIncomeOfHP`) + N(`${ID}.IncomeOthSrc`);
    if (!eq(gti, heads)) {
      err(`${ID}.GrossTotIncome`, 'Gross total income (excluding LTCG) must equal salary + house property + other sources', 'A-22');
    }
    if (!eq(gtiIncLtcg, heads + ltcg)) {
      err(`${ID}.GrossTotIncomeIncLTCG112A`, 'Gross total income including LTCG must equal salary + house property + other sources + LTCG u/s 112A', 'A-22');
    }
  }
  const viaTotal = N(`${VIA}.TotalChapVIADeductions`);
  if (viaTotal > Math.max(gti, 0) + 1) {
    err(`${VIA}.TotalChapVIADeductions`, 'Chapter VI-A deductions cannot exceed gross total income', 'A-18');
  }
  if (has(VIA)) {
    const comps = ['Section80C', 'Section80CCC', 'Section80CCDEmployeeOrSE', 'Section80CCD1B', 'Section80CCDEmployer',
      'Section80D', 'Section80DD', 'Section80DDB', 'Section80E', 'Section80EE', 'Section80EEA', 'Section80EEB',
      'Section80G', 'Section80GG', 'Section80GGA', 'Section80GGC', 'Section80U', 'Section80TTA', 'Section80TTB', 'AnyOthSec80CCH'];
    const compSum = comps.reduce((t, c) => t + N(`${VIA}.${c}`), 0);
    if (!eq(viaTotal, compSum) && !eq(viaTotal, Math.max(gti, 0))) {
      err(`${VIA}.TotalChapVIADeductions`, 'Total Chapter VI-A deductions must equal the sum of individual deductions (restricted to gross total income)', 'A-17');
    }
  }
  if (has(`${ID}.TotalIncome`)) {
    const tiA = Math.max(0, gtiIncLtcg - viaTotal);
    const tiB = Math.max(0, gti - viaTotal) + ltcg;
    if (!eq(totalIncome, tiA) && !eq(totalIncome, tiB)) {
      err(`${ID}.TotalIncome`, 'Total income must equal gross total income minus Chapter VI-A deductions (zero if negative)', 'A-24');
    }
  }

  /* ── Chapter VI-A limits & regime restrictions ── */
  if (isOld) {
    if (N(`${VIA}.Section80C`) + N(`${VIA}.Section80CCC`) + N(`${VIA}.Section80CCDEmployeeOrSE`) > 150000) {
      err(`${VIA}.Section80C`, 'Deductions u/s 80C + 80CCC + 80CCD(1) cannot exceed Rs 1,50,000', 'A-1');
    }
    if (N(`${VIA}.Section80CCD1B`) > 50000) err(`${VIA}.Section80CCD1B`, 'Deduction u/s 80CCD(1B) limited to Rs 50,000', 'A-115');
    if (N(`${VIA}.Section80TTA`) > 10000) err(`${VIA}.Section80TTA`, 'Deduction u/s 80TTA limited to Rs 10,000', 'A-11');
    if (N(`${VIA}.Section80TTB`) > 50000) err(`${VIA}.Section80TTB`, 'Deduction u/s 80TTB limited to Rs 50,000', 'A-14');
    if (N(`${VIA}.Section80DDB`) > 100000) err(`${VIA}.Section80DDB`, 'Deduction u/s 80DDB limited to Rs 1,00,000', 'A-5');
    if (N(`${VIA}.Section80EE`) > 50000) err(`${VIA}.Section80EE`, 'Deduction u/s 80EE limited to Rs 50,000', 'A-122');
    if (N(`${VIA}.Section80EEA`) > 150000) err(`${VIA}.Section80EEA`, 'Deduction u/s 80EEA limited to Rs 1,50,000', 'A-123');
    if (N(`${VIA}.Section80EEB`) > 150000) err(`${VIA}.Section80EEB`, 'Deduction u/s 80EEB limited to Rs 1,50,000', 'A-125');
    if (N(`${VIA}.Section80GG`) > 60000) err(`${VIA}.Section80GG`, 'Deduction u/s 80GG limited to Rs 60,000', 'A-114');
  }
  if (N(`${VIA}.Section80EE`) > 0 && N(`${VIA}.Section80EEA`) > 0) {
    err(`${VIA}.Section80EEA`, 'Only one of the deductions u/s 80EE or 80EEA may be claimed', 'A-124');
  }
  // A-13 / A-15: 80TTA is for non-seniors, 80TTB for seniors (60+ ⇔ born on/before 01-04-1965).
  if (dob && DATE_RX.test(dob)) {
    const senior = dob <= '1965-04-01';
    if (senior && N(`${VIA}.Section80TTA`) > 0) {
      err(`${VIA}.Section80TTA`, 'Deduction u/s 80TTA cannot be claimed by a senior citizen (use 80TTB)', 'A-13');
    }
    if (!senior && N(`${VIA}.Section80TTB`) > 0) {
      err(`${VIA}.Section80TTB`, 'Deduction u/s 80TTB can be claimed only by a senior citizen (60 years or more)', 'A-15');
    }
  }
  // A-116: 80CCD(2) needs a (non-pensioner) employer.
  const empCat = S('PersonalInfo.EmployerCategory');
  if (N(`${VIA}.Section80CCDEmployer`) > 0 && ['PE', 'PESG', 'PEPS', 'PEO', 'NA'].indexOf(empCat) >= 0) {
    err(`${VIA}.Section80CCDEmployer`, 'Deduction u/s 80CCD(2) cannot be claimed for pensioner / not-applicable employer category', 'A-116');
  }
  if (isNew) {
    // A-147 (and A-154..160, 170-173, 176): these deductions must be zero in the new regime.
    const banned = ['Section80C', 'Section80CCC', 'Section80CCDEmployeeOrSE', 'Section80CCD1B', 'Section80D', 'Section80DD',
      'Section80DDB', 'Section80E', 'Section80EE', 'Section80EEA', 'Section80EEB', 'Section80G', 'Section80GG',
      'Section80GGA', 'Section80GGC', 'Section80U', 'Section80TTA', 'Section80TTB'];
    for (const b of banned) {
      if (N(`${VIA}.${b}`) > 0) {
        err(`${VIA}.${b}`, `${b.replace('Section', 'Deduction u/s ')} not allowed under the new tax regime`, 'A-147');
      }
    }
    // A-157 / A-174 / A-176 / A-265: schedules must not be filled in the new regime.
    const bannedScheds: Array<[string, string]> = [
      ['Schedule80G', 'A-157'], ['Schedule80GGA', 'A-176'], ['Schedule80D', 'A-174'],
      ['Schedule80C', 'A-265'], ['ScheduleEA10_13A', 'A-265'], ['Schedule80E', 'A-265'],
      ['Schedule80EE', 'A-265'], ['Schedule80EEA', 'A-265'], ['Schedule80EEB', 'A-265'],
    ];
    for (const [sched, rule] of bannedScheds) {
      if (has(sched)) err(sched, `${sched} should not be filled when the new tax regime is selected`, rule);
    }
  }

  /* ── Deduction-schedule cross checks ── */
  const schedLink: Array<[string, string, string, string, string]> = [
    // [VIA field, schedule, schedule total-field, presence rule, match rule]
    ['Section80C', 'Schedule80C', 'TotalAmt', 'A-233', 'A-251'],
    ['Section80E', 'Schedule80E', 'TotalInterest80E', 'A-235', 'A-252'],
    ['Section80EE', 'Schedule80EE', 'TotalInterest80EE', 'A-236', 'A-253'],
    ['Section80EEA', 'Schedule80EEA', 'TotalInterest80EEA', 'A-238', 'A-254'],
    ['Section80EEB', 'Schedule80EEB', 'TotalInterest80EEB', 'A-241', 'A-255'],
  ];
  for (const [viaField, sched, totField, presRule, matchRule] of schedLink) {
    const claim = N(`${VIA}.${viaField}`);
    if (claim > 0) {
      if (!has(sched)) {
        err(sched, `${sched} must be filled to claim deduction (${viaField.replace('Section', 'section ')})`, presRule);
      } else if (claim > N(`${sched}.${totField}`) + 1) {
        err(`${VIA}.${viaField}`, `Deduction claimed exceeds the total as per ${sched}`, matchRule);
      }
    }
  }
  // Row-sum checks for the loan/payment schedules (A-257..A-261).
  const rowSums: Array<[string, string, string, string, string]> = [
    ['Schedule80C', 'Schedule80CDtls', 'Amount', 'TotalAmt', 'A-257'],
    ['Schedule80E', 'Schedule80EDtls', 'Interest80E', 'TotalInterest80E', 'A-258'],
    ['Schedule80EE', 'Schedule80EEDtls', 'Interest80EE', 'TotalInterest80EE', 'A-259'],
    ['Schedule80EEA', 'Schedule80EEADtls', 'Interest80EEA', 'TotalInterest80EEA', 'A-260'],
    ['Schedule80EEB', 'Schedule80EEBDtls', 'Interest80EEB', 'TotalInterest80EEB', 'A-261'],
  ];
  for (const [sched, dtls, field, totField, rule] of rowSums) {
    if (has(sched)) {
      const rows = A(`${sched}.${dtls}`);
      if (!eq(N(`${sched}.${totField}`), rows.reduce((t, r) => t + gn(r, field), 0))) {
        err(`${sched}.${totField}`, `Total of ${sched} must equal the sum of its individual rows`, rule);
      }
    }
  }
  // A-8 / A-91 / A-202 / A-264 / A-211 / A-214: claims need their schedules.
  const claimNeedsSched: Array<[string, string, string]> = [
    ['Section80G', 'Schedule80G', 'A-8'],
    ['Section80GGA', 'Schedule80GGA', 'A-91'],
    ['Section80GGC', 'Schedule80GGC', 'A-202'],
    ['Section80D', 'Schedule80D', 'A-264'],
    ['Section80U', 'Schedule80U', 'A-211'],
    ['Section80DD', 'Schedule80DD', 'A-214'],
  ];
  for (const [viaField, sched, rule] of claimNeedsSched) {
    if (N(`${VIA}.${viaField}`) > 0 && !has(sched)) {
      err(sched, `${sched} must be filled when deduction ${viaField.replace('Section', 'u/s ')} is claimed`, rule);
    }
  }
  // A-10 / A-93 / A-205: VIA claim cannot exceed the eligible amount in the donation schedule.
  if (has('Schedule80G') && N(`${VIA}.Section80G`) > N('Schedule80G.TotalEligibleDonationsUs80G') + 1) {
    err(`${VIA}.Section80G`, 'Deduction u/s 80G exceeds the eligible donations as per Schedule 80G', 'A-10');
  }
  if (has('Schedule80GGA') && N(`${VIA}.Section80GGA`) > N('Schedule80GGA.TotalEligibleDonationAmt80GGA') + 1) {
    err(`${VIA}.Section80GGA`, 'Deduction u/s 80GGA exceeds the eligible donations as per Schedule 80GGA', 'A-93');
  }
  if (has('Schedule80GGC') && N(`${VIA}.Section80GGC`) > N('Schedule80GGC.TotalEligibleDonationAmt80GGC') + 1) {
    err(`${VIA}.Section80GGC`, 'Deduction u/s 80GGC exceeds the eligible contributions as per Schedule 80GGC', 'A-205');
  }
  // A-139: 80D claim must match the schedule's eligible amount.
  if (has('Schedule80D') && N(`${VIA}.Section80D`) > N('Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn') + 1) {
    err(`${VIA}.Section80D`, 'Deduction u/s 80D exceeds the eligible amount as per Schedule 80D', 'A-139');
  }
  // A-209/210 (80U) and A-212/213 (80DD): fixed statutory amounts.
  if (isOld && has('Schedule80U')) {
    const nat = S('Schedule80U.NatureOfDisability');
    const amt = N('Schedule80U.DeductionAmount');
    const cap = nat === '2' ? 125000 : 75000;
    if (amt > cap) err('Schedule80U.DeductionAmount', `Deduction u/s 80U for this disability category cannot exceed Rs ${cap}`, nat === '2' ? 'A-209' : 'A-210');
    else if (amt > 0 && amt !== cap) warn('Schedule80U.DeductionAmount', `Deduction u/s 80U is a fixed Rs ${cap} (subject to GTI) — amount differs`, nat === '2' ? 'A-209' : 'A-210');
  }
  if (isOld && has('Schedule80DD')) {
    const nat = S('Schedule80DD.NatureOfDisability');
    const amt = N('Schedule80DD.DeductionAmount');
    const cap = nat === '2' ? 125000 : 75000;
    if (amt > cap) err('Schedule80DD.DeductionAmount', `Deduction u/s 80DD for this disability category cannot exceed Rs ${cap}`, nat === '2' ? 'A-213' : 'A-212');
    else if (amt > 0 && amt !== cap) warn('Schedule80DD.DeductionAmount', `Deduction u/s 80DD is a fixed Rs ${cap} (subject to GTI) — amount differs`, nat === '2' ? 'A-213' : 'A-212');
  }

  /* ── Schedule 80G / 80GGA / 80GGC internals ── */
  if (has('Schedule80G')) {
    const tables: Array<[string, string, string, string, string]> = [
      ['Don100Percent', 'TotDon100PercentCash', 'TotDon100PercentOtherMode', 'TotDon100Percent', 'TotEligibleDon100Percent'],
      ['Don50PercentNoApprReqd', 'TotDon50PercentNoApprReqdCash', 'TotDon50PercentNoApprReqdOtherMode', 'TotDon50PercentNoApprReqd', 'TotEligibleDon50Percent'],
      ['Don100PercentApprReqd', 'TotDon100PercentApprReqdCash', 'TotDon100PercentApprReqdOtherMode', 'TotDon100PercentApprReqd', 'TotEligibleDon100PercentApprReqd'],
      ['Don50PercentApprReqd', 'TotDon50PercentApprReqdCash', 'TotDon50PercentApprReqdOtherMode', 'TotDon50PercentApprReqd', 'TotEligibleDon50PercentApprReqd'],
    ];
    const panSeen: { [p: string]: boolean } = {};
    let sumTot = 0, sumCash = 0, sumOther = 0;
    for (const [tbl, cashF, otherF, totF, eligF] of tables) {
      if (!has(`Schedule80G.${tbl}`)) continue;
      const donees = A(`Schedule80G.${tbl}.DoneeWithPan`);
      donees.forEach((d, i) => {
        const dp = `Schedule80G.${tbl}.DoneeWithPan[${i}]`;
        if (!eq(gn(d, 'DonationAmt'), gn(d, 'DonationAmtCash') + gn(d, 'DonationAmtOtherMode'))) {
          err(`${dp}.DonationAmt`, 'Total donation must equal donation in cash + donation in other mode', 'A-84');
        }
        const dpan = gs(d, 'DoneePAN');
        if (dpan) {
          if (dpan === pan || (verPan !== '' && dpan === verPan)) {
            err(`${dp}.DoneePAN`, 'Donee PAN cannot be the same as the assessee/verification PAN', 'A-78');
          }
          if (panSeen[dpan]) err(`${dp}.DoneePAN`, 'The same donee PAN cannot appear more than once in Schedule 80G', 'A-118');
          panSeen[dpan] = true;
        }
        if (isOld && gn(d, 'DonationAmtCash') > 2000 && gn(d, 'EligibleDonationAmt') > gn(d, 'DonationAmtOtherMode')) {
          warn(`${dp}.EligibleDonationAmt`, 'Cash donation above Rs 2,000 is not eligible for deduction u/s 80G', 'A-88');
        }
      });
      const tCash = N(`Schedule80G.${tbl}.${cashF}`);
      const tOther = N(`Schedule80G.${tbl}.${otherF}`);
      const tTot = N(`Schedule80G.${tbl}.${totF}`);
      if (!eq(tTot, tCash + tOther)) {
        err(`Schedule80G.${tbl}.${totF}`, 'Table total must equal total cash donations + total other-mode donations', 'A-84');
      }
      if (donees.length > 0 && !eq(tTot, donees.reduce((t, d) => t + gn(d, 'DonationAmt'), 0))) {
        err(`Schedule80G.${tbl}.${totF}`, 'Table total must equal the sum of individual donations', 'A-84');
      }
      if (N(`Schedule80G.${tbl}.${eligF}`) > tTot + 1) {
        err(`Schedule80G.${tbl}.${eligF}`, 'Eligible donations cannot exceed total donations', 'A-140');
      }
      sumTot += tTot; sumCash += tCash; sumOther += tOther;
    }
    if (!eq(N('Schedule80G.TotalDonationsUs80G'), sumTot)) {
      err('Schedule80G.TotalDonationsUs80G', 'Total donations u/s 80G must equal the sum of the four donation tables', 'A-83');
    }
    if (!eq(N('Schedule80G.TotalDonationsUs80GCash'), sumCash)) {
      err('Schedule80G.TotalDonationsUs80GCash', 'Total cash donations u/s 80G must equal the sum of cash donations of the four tables', 'A-83');
    }
    if (!eq(N('Schedule80G.TotalDonationsUs80GOtherMode'), sumOther)) {
      err('Schedule80G.TotalDonationsUs80GOtherMode', 'Total other-mode donations u/s 80G must equal the sum of other-mode donations of the four tables', 'A-83');
    }
    if (N('Schedule80G.TotalEligibleDonationsUs80G') > N('Schedule80G.TotalDonationsUs80G') + 1) {
      err('Schedule80G.TotalEligibleDonationsUs80G', 'Eligible donations cannot exceed total donations', 'A-140');
    }
  }
  if (has('Schedule80GGA')) {
    const rows = A('Schedule80GGA.DonationDtlsSciRsrchRuralDev');
    const seenPan: { [p: string]: boolean } = {};
    rows.forEach((d, i) => {
      const dp = `Schedule80GGA.DonationDtlsSciRsrchRuralDev[${i}]`;
      if (!eq(gn(d, 'DonationAmt'), gn(d, 'DonationAmtCash') + gn(d, 'DonationAmtOtherMode'))) {
        err(`${dp}.DonationAmt`, 'Total donation must equal donation in cash + donation in other mode', 'A-90');
      }
      if (gn(d, 'EligibleDonationAmt') > gn(d, 'DonationAmt') + 1) {
        err(`${dp}.EligibleDonationAmt`, 'Eligible donation cannot exceed the total donation', 'A-92');
      }
      const dpan = gs(d, 'DoneePAN');
      if (dpan) {
        if (dpan === pan || (verPan !== '' && dpan === verPan)) {
          err(`${dp}.DoneePAN`, 'Donee PAN in Schedule 80GGA cannot be the assessee/verification PAN', 'A-94');
        }
        if (seenPan[dpan]) err(`${dp}.DoneePAN`, 'The same donee PAN cannot appear more than once in Schedule 80GGA', 'A-145');
        seenPan[dpan] = true;
      }
      if (gn(d, 'DonationAmtCash') > 2000) {
        warn(`${dp}.DonationAmtCash`, 'Cash donation above Rs 2,000 is not eligible for deduction u/s 80GGA', 'A-144');
      }
    });
    if (!eq(N('Schedule80GGA.TotalDonationsUs80GGA'), rows.reduce((t, d) => t + gn(d, 'DonationAmt'), 0))) {
      err('Schedule80GGA.TotalDonationsUs80GGA', 'Total donations u/s 80GGA must equal the sum of individual donations', 'A-90');
    }
    if (N('Schedule80GGA.TotalEligibleDonationAmt80GGA') > N('Schedule80GGA.TotalDonationsUs80GGA') + 1) {
      err('Schedule80GGA.TotalEligibleDonationAmt80GGA', 'Eligible donations cannot exceed total donations (80GGA)', 'A-92');
    }
  }
  if (has('Schedule80GGC')) {
    const rows = A('Schedule80GGC.Schedule80GGCDetails');
    rows.forEach((d, i) => {
      const dp = `Schedule80GGC.Schedule80GGCDetails[${i}]`;
      if (!eq(gn(d, 'DonationAmt'), gn(d, 'DonationAmtCash') + gn(d, 'DonationAmtOtherMode'))) {
        err(`${dp}.DonationAmt`, 'Total contribution must equal contribution in cash + contribution in other mode', 'A-204');
      }
      const dt = gs(d, 'DonationDate');
      if (dt && DATE_RX.test(dt) && (dt < '2024-04-01' || dt > '2025-03-31')) {
        err(`${dp}.DonationDate`, 'Contribution u/s 80GGC must be made between 01/04/2024 and 31/03/2025 for AY 2025-26', 'A-220');
      }
    });
    if (!eq(N('Schedule80GGC.TotalDonationsUs80GGC'), rows.reduce((t, d) => t + gn(d, 'DonationAmt'), 0))) {
      err('Schedule80GGC.TotalDonationsUs80GGC', 'Total contributions u/s 80GGC must equal the sum of individual contributions', 'A-206');
    }
  }

  /* ── Tax computation chain ── */
  if (has(TCOMP)) {
    if (!eq(N(`${TCOMP}.TaxPayableOnRebate`), N(`${TCOMP}.TotalTaxPayable`) - N(`${TCOMP}.Rebate87A`))) {
      err(`${TCOMP}.TaxPayableOnRebate`, 'Tax after rebate must equal tax payable on total income minus rebate u/s 87A', 'A-25');
    }
    if (!eq(N(`${TCOMP}.GrossTaxLiability`), N(`${TCOMP}.TaxPayableOnRebate`) + N(`${TCOMP}.EducationCess`))) {
      err(`${TCOMP}.GrossTaxLiability`, 'Total tax and cess must equal tax after rebate + health & education cess', 'A-26');
    }
    if (!eq(N(`${TCOMP}.NetTaxLiability`), Math.max(0, N(`${TCOMP}.GrossTaxLiability`) - N(`${TCOMP}.Section89`)))) {
      err(`${TCOMP}.NetTaxLiability`, 'Balance tax after relief must equal total tax and cess minus relief u/s 89', 'A-27');
    }
    const intSum = N(`${TCOMP}.IntrstPay.IntrstPayUs234A`) + N(`${TCOMP}.IntrstPay.IntrstPayUs234B`)
      + N(`${TCOMP}.IntrstPay.IntrstPayUs234C`) + N(`${TCOMP}.IntrstPay.LateFilingFee234F`);
    if (!eq(N(`${TCOMP}.TotalIntrstPay`), intSum)) {
      err(`${TCOMP}.TotalIntrstPay`, 'Total interest and fee must equal interest u/s 234A + 234B + 234C + fee u/s 234F', 'A-28');
    }
    if (!eq(N(`${TCOMP}.TotTaxPlusIntrstPay`), N(`${TCOMP}.NetTaxLiability`) + N(`${TCOMP}.TotalIntrstPay`))) {
      err(`${TCOMP}.TotTaxPlusIntrstPay`, 'Total tax, fee and interest must equal balance tax after relief + total interest and fee', 'A-141');
    }
    // A-23 / A-201 (old) and A-200 (new): rebate u/s 87A limits.
    const rebate = N(`${TCOMP}.Rebate87A`);
    if (isOld && rebate > 0) {
      if (totalIncome > 500000) err(`${TCOMP}.Rebate87A`, 'Rebate u/s 87A not allowed when total income exceeds Rs 5,00,000 (old regime)', 'A-23');
      if (rebate > 12500) err(`${TCOMP}.Rebate87A`, 'Rebate u/s 87A limited to Rs 12,500 under the old regime', 'A-201');
    }
    if (isNew && rebate > 0 && totalIncome - ltcg > 722230) {
      err(`${TCOMP}.Rebate87A`, 'Rebate u/s 87A not allowed when total income (excluding LTCG) exceeds Rs 7,22,230 (new regime)', 'A-200');
    }
    // A-126: relief u/s 89 needs salary or family pension income.
    if (N(`${TCOMP}.Section89`) > 0) {
      const hasFap = osRows.some(r => gs(r, 'OthSrcNatureDesc') === 'FAP' && gn(r, 'OthSrcOthAmount') > 0);
      if (N(`${ID}.GrossSalary`) <= 0 && !hasFap) {
        err(`${TCOMP}.Section89`, 'Relief u/s 89 cannot be claimed without salary or family pension income', 'A-126');
      }
    }
  }

  /* ── TDS / TCS / challans ── */
  const tds1 = A('TDSonSalaries.TDSonSalary');
  if (has('TDSonSalaries') && !eq(N('TDSonSalaries.TotalTDSonSalaries'), tds1.reduce((t, r) => t + gn(r, 'TotalTDSSal'), 0))) {
    err('TDSonSalaries.TotalTDSonSalaries', 'Total TDS on salary must equal the sum of TDS of individual employers', 'A-100');
  }
  const tds2 = A('TDSonOthThanSals.TDSonOthThanSal');
  if (has('TDSonOthThanSals')) {
    tds2.forEach((r, i) => {
      if (gn(r, 'ClaimOutOfTotTDSOnAmtPaid') > gn(r, 'TotTDSOnAmtPaid') + 1) {
        err(`TDSonOthThanSals.TDSonOthThanSal[${i}].ClaimOutOfTotTDSOnAmtPaid`, 'TDS claimed this year cannot exceed the tax deducted', 'A-98');
      }
      const sec = gs(r, 'TDSSection');
      if (sec === '92A' || sec === '92B' || sec === '92C') {
        err(`TDSonOthThanSals.TDSonOthThanSal[${i}].TDSSection`, 'Section 192 (salary TDS) cannot be selected in schedule TDS2 (other than salary)', 'A-270');
      }
    });
    if (!eq(N('TDSonOthThanSals.TotalTDSonOthThanSals'), tds2.reduce((t, r) => t + gn(r, 'ClaimOutOfTotTDSOnAmtPaid'), 0))) {
      err('TDSonOthThanSals.TotalTDSonOthThanSals', 'Total TDS (other than salary) must equal the sum of TDS claimed in individual rows', 'A-101');
    }
  }
  const tds3 = A('ScheduleTDS3Dtls.TDS3Details');
  if (has('ScheduleTDS3Dtls')) {
    tds3.forEach((r, i) => {
      if (gn(r, 'TDSClaimed') > gn(r, 'TDSDeducted') + 1) {
        err(`ScheduleTDS3Dtls.TDS3Details[${i}].TDSClaimed`, 'TDS claimed this year cannot exceed the tax deducted', 'A-98');
      }
      const sec = gs(r, 'TDSSection');
      if (sec === '92A' || sec === '92B' || sec === '92C') {
        err(`ScheduleTDS3Dtls.TDS3Details[${i}].TDSSection`, 'Section 192 (salary TDS) cannot be selected in schedule TDS3', 'A-270');
      }
    });
    if (!eq(N('ScheduleTDS3Dtls.TotalTDS3Details'), tds3.reduce((t, r) => t + gn(r, 'TDSClaimed'), 0))) {
      err('ScheduleTDS3Dtls.TotalTDS3Details', 'Total of schedule TDS3 must equal the sum of TDS claimed in individual rows', 'A-102');
    }
  }
  const tcs = A('ScheduleTCS.TCS');
  if (has('ScheduleTCS')) {
    tcs.forEach((r, i) => {
      if (gn(r, 'AmtTCSClaimedThisYear') > gn(r, 'TotalTCS') + 1) {
        err(`ScheduleTCS.TCS[${i}].AmtTCSClaimedThisYear`, 'TCS claimed this year cannot exceed the tax collected', 'A-96');
      }
    });
    if (!eq(N('ScheduleTCS.TotalSchTCS'), tcs.reduce((t, r) => t + gn(r, 'AmtTCSClaimedThisYear'), 0))) {
      err('ScheduleTCS.TotalSchTCS', 'Total TCS claimed must equal the sum of TCS claimed in individual rows', 'A-97');
    }
  }
  const challans = A('TaxPayments.TaxPayment');
  if (has('TaxPayments') && !eq(N('TaxPayments.TotalTaxPayments'), challans.reduce((t, r) => t + gn(r, 'Amt'), 0))) {
    err('TaxPayments.TotalTaxPayments', 'Total of schedule IT must equal the sum of individual challan amounts', 'A-95');
  }

  /* ── Taxes-paid summary ── */
  if (has('TaxPaid.TaxesPaid')) {
    const TP = 'TaxPaid.TaxesPaid';
    if (!eq(N(`${TP}.TotalTaxesPaid`), N(`${TP}.AdvanceTax`) + N(`${TP}.TDS`) + N(`${TP}.TCS`) + N(`${TP}.SelfAssessmentTax`))) {
      err(`${TP}.TotalTaxesPaid`, 'Total taxes paid must equal advance tax + TDS + TCS + self-assessment tax', 'A-104');
    }
    const tdsClaimTotal = N('TDSonSalaries.TotalTDSonSalaries') + N('TDSonOthThanSals.TotalTDSonOthThanSals') + N('ScheduleTDS3Dtls.TotalTDS3Details');
    if (!eq(N(`${TP}.TDS`), tdsClaimTotal)) {
      err(`${TP}.TDS`, 'Total TDS claimed must equal the sum of TDS claimed in schedules TDS1, TDS2 and TDS3', 'A-108');
    }
    if (!eq(N(`${TP}.TCS`), N('ScheduleTCS.TotalSchTCS'))) {
      err(`${TP}.TCS`, 'Total TCS claimed must equal the total of the TCS schedule', 'A-109');
    }
    if (challans.length > 0) {
      let adv = 0, sat = 0;
      for (const c of challans) {
        const d = gs(c, 'DateDep');
        if (d && DATE_RX.test(d)) {
          if (d <= '2025-03-31') adv += gn(c, 'Amt'); else sat += gn(c, 'Amt');
        }
      }
      if (!eq(N(`${TP}.AdvanceTax`), adv)) {
        err(`${TP}.AdvanceTax`, 'Advance tax must equal the challans of schedule IT deposited up to 31/03/2025', 'A-110');
      }
      if (!eq(N(`${TP}.SelfAssessmentTax`), sat)) {
        err(`${TP}.SelfAssessmentTax`, 'Self-assessment tax must equal the challans of schedule IT deposited after 31/03/2025', 'A-111');
      }
    }
    const totTax = N(`${TCOMP}.TotTaxPlusIntrstPay`);
    const paid = N(`${TP}.TotalTaxesPaid`);
    if (paid > totTax) {
      if (!eq(N('Refund.RefundDue'), paid - totTax)) {
        err('Refund.RefundDue', 'Refund must equal total taxes paid minus total tax, fee and interest', 'A-105');
      }
    } else if (!eq(N('TaxPaid.BalTaxPayable'), totTax - paid)) {
      err('TaxPaid.BalTaxPayable', 'Balance tax payable must equal total tax, fee and interest minus total taxes paid', 'A-106');
    }
  }

  /* ── LTCG u/s 112A ── */
  if (has('LTCG112A')) {
    if (ltcg > 125000) {
      err('LTCG112A.LongCap112A', 'LTCG u/s 112A above Rs 1,25,000 cannot be reported in ITR-1 (use ITR-2)', 'A-226');
    }
    if (!eq(ltcg, N('LTCG112A.TotSaleCnsdrn') - N('LTCG112A.TotCstAcqisn'))) {
      err('LTCG112A.LongCap112A', 'LTCG u/s 112A must equal total sale consideration minus total cost of acquisition', 'A-227');
    }
  }

  /* ── A-152 / A-199: old regime not selectable in a belated return ── */
  const fileSec = P('FilingStatus.ReturnFileSec');
  if (isOld && (fileSec === 12 || fileSec === 17)) {
    err('FilingStatus.OptOutNewTaxRegime', 'Opting out of the new tax regime (old regime) is not permitted in a return filed after the due date u/s 139(1)', 'A-152');
  }

  /* ── Softer findings (warnings) ── */
  if (!has('PersonalInfo.AadhaarCardNo')) {
    warn('PersonalInfo.AadhaarCardNo', 'Aadhaar number is expected u/s 139AA — the portal may block upload without it (category-B rule)', 'B-2');
  }
  if (N('Refund.RefundDue') > 0) {
    const banks = A('Refund.BankAccountDtls.AddtnlBankDetails');
    if (banks.length === 0) {
      warn('Refund.BankAccountDtls.AddtnlBankDetails', 'Refund is due but no bank account is provided — at least one (pre-validated) account is needed for the refund');
    } else if (!banks.some(b => gs(b, 'UseForRefund') === 'true' || b['UseForRefund'] === true)) {
      warn('Refund.BankAccountDtls.AddtnlBankDetails', 'Refund is due but no bank account is marked for refund credit');
    }
  }
  if (S('Verification.Capacity') === 'S' && pan !== '' && verPan !== '' && pan !== verPan) {
    warn('Verification.Declaration.AssesseeVerPAN', 'Verification PAN differs from the assessee PAN although capacity is Self');
  }
  if (fileSec === 21 && !has('PartA_139_8A')) {
    warn('PartA_139_8A', 'Return is filed u/s 139(8A) (updated return) but Part A 139(8A) details are absent');
  }
  if (fileSec === 21 && !has('PartB-ATI')) {
    warn('PartB-ATI', 'Return is filed u/s 139(8A) (updated return) but Part B-ATI is absent');
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Category-A rules, part 2
 *
 * Rule families of Table 2 that are not covered above: the exempt-allowance
 * ceilings (A-64..A-76 etc.), the whole Schedule-80D block (A-128..A-138,
 * A-179..A-184, A-244..A-247), the 80CCD(1)/(2) percentage caps, the loan
 * sanction windows of 80EE/80EEA/80EEB, the 89A relief/quarterly cross-checks
 * and the "claim needs its supporting particulars" rules.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Employer categories that are pensioner / not-applicable buckets. */
const PENSIONER_CATS = ['PE', 'PESG', 'PEPS', 'PEO', 'NA'];
/** Central / State Government employer categories. */
const GOVT_CATS = ['CGOV', 'SGOV'];
const USR_VIA = `${ID}.UsrDeductUndChapVIA`;

function runCategoryARulesPart2(json: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const P = (p: string): unknown => at(json, `ITR.ITR1.${p}`);
  const N = (p: string): number => {
    const v = P(p);
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
    return 0;
  };
  const S = (p: string): string => {
    const v = P(p);
    return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
  };
  const A = (p: string): Array<{ [key: string]: unknown }> => {
    const v = P(p);
    return Array.isArray(v)
      ? (v.filter(e => e !== null && typeof e === 'object' && !Array.isArray(e)) as Array<{ [key: string]: unknown }>)
      : [];
  };
  const has = (p: string): boolean => !isEmpty(P(p));
  const gn = (o: { [key: string]: unknown }, k: string): number => {
    const v = o[k];
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
    return 0;
  };
  const gs = (o: { [key: string]: unknown }, k: string): string => {
    const v = o[k];
    return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
  };
  const err = (path: string, msg: string, rule: string): void => { errors.push({ path: `ITR.ITR1.${path}`, msg, rule }); };
  const warn = (path: string, msg: string, rule?: string): void => {
    const w: MandatoryIssue = { path: `ITR.ITR1.${path}`, msg };
    if (rule) w.rule = rule;
    warnings.push(w);
  };
  const eq = (a: number, b: number): boolean => Math.abs(a - b) <= 1;
  const rs = (v: number): string => `Rs ${Math.round(v).toLocaleString('en-IN')}`;

  const itr1 = at(json, 'ITR.ITR1');
  if (itr1 === null || itr1 === undefined || typeof itr1 !== 'object') return;

  const regime = S('FilingStatus.OptOutNewTaxRegime');
  const isOld = regime === 'Y';
  const isNew = regime === 'N';
  const empCat = S('PersonalInfo.EmployerCategory');
  const gti = N(`${ID}.GrossTotIncome`);
  const sal171 = N(`${ID}.Salary`);
  const grossSalary = N(`${ID}.GrossSalary`);
  const perquisites = N(`${ID}.PerquisitesValue`);
  const uv = (k: string): number => N(`${USR_VIA}.${k}`);
  const av = (k: string): number => N(`${VIA}.${k}`);

  /* ── Exempt allowances u/s 10 — statutory ceilings ─────────────────── */
  const allw = A(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`);
  const allwOf = (code: string): number =>
    allw.filter(r => gs(r, 'SalNatureDesc') === code).reduce((t, r) => t + gn(r, 'SalOthAmount'), 0);
  const ceiling = (code: string, cap: number, basis: string, rule: string): void => {
    const v = allwOf(code);
    if (v > cap + 1) {
      err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`, `Exempt allowance u/s ${code} of ${rs(v)} cannot exceed ${basis} (${rs(cap)})`, rule);
    }
  };
  ceiling('10(6)', grossSalary, 'gross salary', 'A-65');
  ceiling('10(7)', grossSalary, 'gross salary', 'A-66');
  ceiling('10(10A)', sal171, 'salary as per section 17(1)', 'A-68');
  ceiling('10(10AA)', sal171, 'salary as per section 17(1)', 'A-69');
  ceiling('10(10CC)', perquisites, 'value of perquisites as per section 17(2)', 'A-73');
  ceiling('10(10B)(i)', 500000, 'Rs 5,00,000', 'A-70');
  ceiling('10(10B)(ii)', 500000, 'Rs 5,00,000', 'A-197');
  ceiling('10(10C)', 500000, 'Rs 5,00,000', 'A-71');
  if (isOld) {
    ceiling('10(5)', sal171, 'salary as per section 17(1)', 'A-64');
    ceiling('10(13A)', sal171 / 3, 'one-third of salary as per section 17(1)', 'A-177');
    ceiling('10(14)(i)', sal171, 'salary as per section 17(1)', 'A-75');
    ceiling('10(14)(ii)', sal171, 'salary as per section 17(1)', 'A-76');
    for (const code of ['10(14)(i)(115BAC)', '10(14)(ii)(115BAC)']) {
      if (allwOf(code) > 0) {
        err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`, `Exempt allowance "${code}" is available only under the new tax regime`, 'A-151');
      }
    }
  }
  if (isNew && allwOf('10(14)(ii)(115BAC)') > 38400) {
    err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Transport allowance for a physically handicapped assessee u/s 10(14)(ii) is limited to Rs 38,400 under the new tax regime', 'A-149');
  }
  if (empCat) {
    const gratuityCap = GOVT_CATS.concat(['PE', 'PESG']).indexOf(empCat) >= 0 ? 2500000 : 2000000;
    ceiling('10(10)', gratuityCap, gratuityCap === 2500000 ? 'Rs 25,00,000 for this nature of employment' : 'Rs 20,00,000 for this nature of employment', gratuityCap === 2500000 ? 'A-279' : 'A-67');
    if (GOVT_CATS.concat(['PE', 'PESG']).indexOf(empCat) < 0 && allwOf('10(10AA)') > 2500000) {
      err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Leave encashment exempt u/s 10(10AA) cannot exceed Rs 25,00,000 for this nature of employment', 'A-143');
    }
    if (GOVT_CATS.concat(['PE', 'PESG', 'PEPS', 'PEO']).indexOf(empCat) >= 0 && (allwOf('10(10B)(i)') > 0 || allwOf('10(10B)(ii)') > 0)) {
      err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Exempt allowance u/s 10(10B) is not allowable to Government employees or pensioners', 'A-194');
    }
  }
  // A-178: 10(10CC) cannot exceed the TDS claimed u/s 192 in Schedule TDS1.
  const tds1Sum = A('TDSonSalaries.TDSonSalary').reduce((t, r) => t + gn(r, 'TotalTDSSal'), 0);
  if (has('TDSonSalaries') && allwOf('10(10CC)') > tds1Sum + 1) {
    err(`${ID}.AllwncExemptUs10.AllwncExemptUs10Dtls`, 'Exempt allowance u/s 10(10CC) cannot exceed the TDS on salary claimed in Schedule TDS1', 'A-178');
  }
  // A-193: TDS on salary cannot exceed the gross salary offered.
  if (grossSalary > 0 && N('TDSonSalaries.TotalTDSonSalaries') > grossSalary + 1) {
    err('TDSonSalaries.TotalTDSonSalaries', 'TDS deducted as per Schedule TDS1 cannot exceed the total gross salary', 'A-193');
  }
  // A-274: nature of employment is mandatory once salary / exempt allowances exist.
  if ((grossSalary > 0 || allw.length > 0) && !empCat) {
    err('PersonalInfo.EmployerCategory', 'Nature of employment must be provided when salary income or exempt allowances are disclosed', 'A-274');
  }
  // A-57 / A-58: entertainment allowance u/s 16(ii) under the old regime.
  const entAllw = N(`${ID}.EntertainmentAlw16ii`);
  if (isOld && entAllw > 0) {
    if (['CGOV', 'SGOV', 'PSU'].indexOf(empCat) < 0) {
      err(`${ID}.EntertainmentAlw16ii`, 'Entertainment allowance u/s 16(ii) is allowable only to Central Government, State Government and PSU employees', 'A-58');
    } else if (entAllw > Math.min(5000, sal171 / 5) + 1) {
      err(`${ID}.EntertainmentAlw16ii`, `Entertainment allowance u/s 16(ii) is limited to the lower of Rs 5,000 and one-fifth of salary (${rs(Math.min(5000, sal171 / 5))})`, 'A-57');
    }
  }

  /* ── Schedule 10(13A) component checks (A-271, A-272, A-276) ───────── */
  if (has('ScheduleEA10_13A')) {
    const hraRecv = N('ScheduleEA10_13A.ActlHRARecv');
    const rentPaid = N('ScheduleEA10_13A.ActlRentPaid');
    const basic = N('ScheduleEA10_13A.BasicSalary');
    const da = N('ScheduleEA10_13A.DearnessAllwnc');
    const metro = S('ScheduleEA10_13A.Placeofwork') === '1';
    if (!eq(N('ScheduleEA10_13A.ActlRentPaid10Per'), Math.max(0, rentPaid - 0.1 * (basic + da)))) {
      err('ScheduleEA10_13A.ActlRentPaid10Per', 'Rent paid less 10% of (basic salary + dearness allowance) is not computed correctly', 'A-271');
    }
    if (!eq(N('ScheduleEA10_13A.Sal40Or50Per'), (metro ? 0.5 : 0.4) * (basic + da))) {
      err('ScheduleEA10_13A.Sal40Or50Per', `${metro ? '50%' : '40%'} of (basic salary + dearness allowance) is not computed correctly`, 'A-272');
    }
    if (sal171 > 0 && basic + da + hraRecv > sal171 + 1) {
      err('ScheduleEA10_13A.BasicSalary', 'Basic salary + dearness allowance + actual HRA received cannot exceed salary as per section 17(1)', 'A-276');
    }
  }

  /* ── Relief u/s 89A and its quarterly break-up (A-186..A-192) ──────── */
  if (N(`${ID}.Increliefus89A`) > N(`${ID}.IncomeNotified89A`) + 1) {
    err(`${ID}.Increliefus89A`, 'Relief claimed u/s 89A under Salary cannot exceed the income offered from a retirement benefit account in a notified country', 'A-186');
  }
  const salCountries = A(`${ID}.IncomeNotified89AType`).map(r => gs(r, 'NOT89ACountrycode')).filter(c => c !== '');
  salCountries.forEach((c, i) => {
    if (salCountries.indexOf(c) !== i) {
      err(`${ID}.IncomeNotified89AType[${i}].NOT89ACountrycode`, `Country "${c}" is selected more than once for income u/s 89A under Salary`, 'A-192');
    }
  });
  const osList = A(`${ID}.OthersInc.OthersIncDtlsOthSrc`);
  const not89AInc = osList.filter(r => gs(r, 'OthSrcNatureDesc') === 'NOT89A').reduce((t, r) => t + gn(r, 'OthSrcOthAmount'), 0);
  const relief89AOS = N(`${ID}.Increliefus89AOS`);
  if (relief89AOS > not89AInc + 1) {
    err(`${ID}.Increliefus89AOS`, 'Relief claimed u/s 89A under Other Sources cannot exceed the income offered from a retirement benefit account in a notified country', 'A-187');
  }
  osList.forEach((r, i) => {
    const base = `${ID}.OthersInc.OthersIncDtlsOthSrc[${i}]`;
    const holder = r['NOT89AInc'];
    if (gs(r, 'OthSrcNatureDesc') === 'NOT89A' && holder !== null && typeof holder === 'object') {
      const range = (holder as { [key: string]: unknown })['DateRange'];
      if (range !== null && typeof range === 'object') {
        const q = range as { [key: string]: unknown };
        const qsum = ['Upto15Of6', 'Upto15Of9', 'Up16Of9To15Of12', 'Up16Of12To15Of3', 'Up16Of3To31Of3']
          .reduce((t, k) => t + gn(q, k), 0);
        if (!eq(qsum, gn(r, 'OthSrcOthAmount') - relief89AOS)) {
          err(`${base}.NOT89AInc.DateRange`, 'The quarterly break-up of income u/s 89A must equal the income offered less the relief claimed u/s 89A', 'A-188');
        }
      }
    }
    const countries = r['NOT89A'];
    if (Array.isArray(countries)) {
      const codes = countries
        .map(c => (c !== null && typeof c === 'object' ? gs(c as { [key: string]: unknown }, 'NOT89ACountrycode') : ''))
        .filter(c => c !== '');
      codes.forEach((c, j) => {
        if (codes.indexOf(c) !== j) {
          err(`${base}.NOT89A[${j}].NOT89ACountrycode`, `Country "${c}" is selected more than once for income u/s 89A under Other Sources`, 'A-191');
        }
      });
    }
  });

  /* ── Exempt income barred under the new regime (A-162) ─────────────── */
  if (isNew) {
    const mpAllw = A(`${ID}.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls`)
      .filter(r => gs(r, 'NatureDesc') === '10(17)')
      .reduce((t, r) => t + gn(r, 'OthAmount'), 0);
    if (mpAllw > 0) {
      err(`${ID}.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls`, 'Exempt income u/s 10(17) — allowance to MP / MLA / MLC — cannot be claimed under the new tax regime', 'A-162');
    }
  }

  /* ── Gross total income under the new regime (A-161, A-175) ────────── */
  const incHP = N(`${ID}.TotalIncomeOfHP`);
  if (isNew && incHP < 0 && !eq(gti, N(`${ID}.IncomeFromSal`) + N(`${ID}.IncomeOthSrc`))) {
    err(`${ID}.GrossTotIncome`, 'Under the new tax regime a house-property loss cannot be set off — gross total income must equal salary + other sources', 'A-161');
  }

  /* ── Tax liability presupposes income (A-20, A-21, A-113) ──────────── */
  const totalTaxesPaid = N('TaxPaid.TaxesPaid.TotalTaxesPaid');
  const totTaxPlusInt = N(`${TCOMP}.TotTaxPlusIntrstPay`);
  if ((totTaxPlusInt > 0 || totalTaxesPaid > 0) && gti <= 0) {
    err(`${ID}.GrossTotIncome`, 'Gross total income must be more than zero where a tax liability has been computed or taxes have been paid', 'A-20');
  }
  if (totalTaxesPaid > 0 && !has(TCOMP)) {
    err(TCOMP, 'Income details and tax computation must be disclosed where details of taxes paid have been furnished', 'A-21');
  }
  if (N('TaxPaid.TaxesPaid.TDS') > 0 && gti <= 0) {
    err('TaxPaid.TaxesPaid.TDS', 'Credit for TDS has been claimed but the corresponding receipts / income have not been offered for taxation', 'A-113');
  }

  /* ── Chapter VI-A percentage caps and supporting particulars ───────── */
  const nps1 = uv('Section80CCDEmployeeOrSE');
  if (isOld && nps1 > 0) {
    if (PENSIONER_CATS.indexOf(empCat) >= 0) {
      if (nps1 > 0.2 * gti + 1) {
        err(`${USR_VIA}.Section80CCDEmployeeOrSE`, `For a pensioner / not-applicable employer category, deduction u/s 80CCD(1) is limited to 20% of gross total income (${rs(0.2 * gti)})`, 'A-2');
      }
    } else if (nps1 > 0.1 * sal171 + 1) {
      err(`${USR_VIA}.Section80CCDEmployeeOrSE`, `Deduction u/s 80CCD(1) is limited to 10% of salary (${rs(0.1 * sal171)})`, 'A-3');
    }
  }
  const nps2 = av('Section80CCDEmployer');
  if (nps2 > 0 && empCat && PENSIONER_CATS.indexOf(empCat) < 0) {
    const pct = isNew ? 0.14 : GOVT_CATS.indexOf(empCat) >= 0 ? 0.14 : 0.10;
    if (nps2 > pct * sal171 + 1) {
      err(`${VIA}.Section80CCDEmployer`, `Deduction u/s 80CCD(2) is limited to ${Math.round(pct * 100)}% of salary (${rs(pct * sal171)}) for this employer category`, isNew ? 'A-225' : GOVT_CATS.indexOf(empCat) >= 0 ? 'A-121' : 'A-4');
    }
  }
  if ((uv('Section80CCDEmployeeOrSE') > 0 || uv('Section80CCD1B') > 0) && !has(`${USR_VIA}.PRANNum`)) {
    err(`${USR_VIA}.PRANNum`, 'PRAN must be provided in schedule VI-A to claim a deduction u/s 80CCD(1) / 80CCD(1B)', 'A-234');
  }
  if (uv('Section80GG') > 0 && !has(`${USR_VIA}.Form10BAAckNum`)) {
    err(`${USR_VIA}.Form10BAAckNum`, 'The Form 10BA acknowledgement number must be provided to claim a deduction u/s 80GG', 'A-243');
  }
  if (isOld && uv('Section80DDB') > 0) {
    if (!has(`${USR_VIA}.NameOfSpecDisease80DDB`)) {
      err(`${USR_VIA}.NameOfSpecDisease80DDB`, 'Deduction u/s 80DDB is claimed but the eligible specified disease has not been selected', 'A-6');
    }
    if (S(`${USR_VIA}.Section80DDBUsrType`) === '1' && av('Section80DDB') > 40000) {
      err(`${VIA}.Section80DDB`, 'For the category "Self or Dependant", deduction u/s 80DDB is limited to Rs 40,000', 'A-7');
    }
  }
  // A-12 / A-16: 80TTA / 80TTB restricted to the interest income actually offered.
  if (isOld && osList.length > 0) {
    const savings = osList.filter(r => gs(r, 'OthSrcNatureDesc') === 'SAV').reduce((t, r) => t + gn(r, 'OthSrcOthAmount'), 0);
    const deposits = osList.filter(r => gs(r, 'OthSrcNatureDesc') === 'IFD').reduce((t, r) => t + gn(r, 'OthSrcOthAmount'), 0);
    if (av('Section80TTA') > savings + 1) {
      err(`${VIA}.Section80TTA`, 'Deduction u/s 80TTA is restricted to the savings-account interest offered under Income from Other Sources', 'A-12');
    }
    if (av('Section80TTB') > savings + deposits + 1) {
      err(`${VIA}.Section80TTB`, 'Deduction u/s 80TTB is restricted to the interest income offered under Income from Other Sources', 'A-16');
    }
  }
  // A-195 / A-196: 80CCH (Agnipath).
  const cch = av('AnyOthSec80CCH');
  if (cch > 0) {
    if (cch > 0.462 * sal171 + 1) {
      err(`${VIA}.AnyOthSec80CCH`, `Deduction u/s 80CCH cannot exceed 46.2% of salary u/s 17(1) (${rs(0.462 * sal171)})`, 'A-195');
    }
    if (empCat && empCat !== 'CGOV') {
      err(`${VIA}.AnyOthSec80CCH`, 'Deduction u/s 80CCH (Agnipath Scheme) is available only when the nature of employment is Central Government', 'A-196');
    }
  }

  /* ── Schedule 80D (A-128..A-138, A-179..A-184, A-244..A-247) ───────── */
  const D80 = 'Schedule80D.Sec80DSelfFamSrCtznHealth';
  if (has('Schedule80D')) {
    const selfFlag = S(`${D80}.SeniorCitizenFlag`);
    const parFlag = S(`${D80}.ParentsSeniorCitizenFlag`);
    const a1 = N(`${D80}.SelfAndFamily`);
    const a1Ins = N(`${D80}.HealthInsPremSlfFam`);
    const a1Prev = N(`${D80}.PrevHlthChckUpSlfFam`);
    const b1 = N(`${D80}.SelfAndFamilySeniorCitizen`);
    const b1Ins = N(`${D80}.HlthInsPremSlfFamSrCtzn`);
    const b1Prev = N(`${D80}.PrevHlthChckUpSlfFamSrCtzn`);
    const b1Med = N(`${D80}.MedicalExpSlfFamSrCtzn`);
    const a2 = N(`${D80}.Parents`);
    const a2Ins = N(`${D80}.HlthInsPremParents`);
    const a2Prev = N(`${D80}.PrevHlthChckUpParents`);
    const b2 = N(`${D80}.ParentsSeniorCitizen`);
    const b2Ins = N(`${D80}.HlthInsPremParentsSrCtzn`);
    const b2Prev = N(`${D80}.PrevHlthChckUpParentsSrCtzn`);
    const b2Med = N(`${D80}.MedicalExpParentsSrCtzn`);
    const elig = N(`${D80}.EligibleAmountOfDedn`);

    if (isOld && a1 > 25000) err(`${D80}.SelfAndFamily`, 'Schedule 80D Sl. 1a (self and family) is allowable only to the extent of Rs 25,000', 'A-128');
    if (a1Ins + a1Prev < 25000 && !eq(a1, a1Ins + a1Prev)) {
      err(`${D80}.SelfAndFamily`, 'Schedule 80D Sl. 1a must equal health-insurance premium + preventive health check-up', 'A-129');
    }
    if (isOld && b1 > 50000) err(`${D80}.SelfAndFamilySeniorCitizen`, 'Schedule 80D Sl. 1b (self and family — senior citizen) is allowable only to the extent of Rs 50,000', 'A-131');
    if (b1Ins + b1Prev + b1Med < 50000 && !eq(b1, b1Ins + b1Prev + b1Med)) {
      err(`${D80}.SelfAndFamilySeniorCitizen`, 'Schedule 80D Sl. 1b must equal the sum of its sub-items (i + ii + iii)', 'A-132');
    }
    if (isOld && a2 > 25000) err(`${D80}.Parents`, 'Schedule 80D Sl. 2a (parents) is allowable only to the extent of Rs 25,000', 'A-133');
    if (isOld && a2Ins + a2Prev < 25000 && !eq(a2, a2Ins + a2Prev)) {
      err(`${D80}.Parents`, 'Schedule 80D Sl. 2a must equal health-insurance premium + preventive health check-up', 'A-134');
    }
    if (isOld && b2 > 50000) err(`${D80}.ParentsSeniorCitizen`, 'Schedule 80D Sl. 2b (parents — senior citizen) cannot exceed Rs 50,000', 'A-135');
    if (b2Ins + b2Prev + b2Med < 50000 && !eq(b2, b2Ins + b2Prev + b2Med)) {
      err(`${D80}.ParentsSeniorCitizen`, 'Schedule 80D Sl. 2b must equal the sum of its sub-items (i + ii + iii)', 'A-136');
    }
    if (a1Prev + b1Prev + a2Prev + b2Prev > 5000) {
      err(`${D80}.PrevHlthChckUpSlfFam`, 'Schedule 80D: preventive health check-up of all fields combined cannot exceed Rs 5,000', 'A-130');
    }
    if (isOld && elig > 100000) err(`${D80}.EligibleAmountOfDedn`, 'Schedule 80D Sl. 3 (eligible amount of deduction) cannot exceed Rs 1,00,000', 'A-137');
    if (a1 + b1 + a2 + b2 <= 100000 && !eq(elig, Math.min(a1 + b1 + a2 + b2, Math.max(gti, 0)))) {
      err(`${D80}.EligibleAmountOfDedn`, 'Schedule 80D Sl. 3 must equal 1a + 1b + 2a + 2b, subject to gross total income', 'A-138');
    }
    if (a1 > 0 && selfFlag && selfFlag !== 'N') err(`${D80}.SelfAndFamily`, 'Schedule 80D Sl. 1a may be claimed only when "is self / any family member a senior citizen?" is answered No', 'A-179');
    if (b1 > 0 && selfFlag && selfFlag !== 'Y') err(`${D80}.SelfAndFamilySeniorCitizen`, 'Schedule 80D Sl. 1b may be claimed only when "is self / any family member a senior citizen?" is answered Yes', 'A-180');
    if (a2 > 0 && parFlag && parFlag !== 'N') err(`${D80}.Parents`, 'Schedule 80D Sl. 2a may be claimed only when "is any parent a senior citizen?" is answered No', 'A-181');
    if (b2 > 0 && parFlag && parFlag !== 'Y') err(`${D80}.ParentsSeniorCitizen`, 'Schedule 80D Sl. 2b may be claimed only when "is any parent a senior citizen?" is answered Yes', 'A-182');
    if (selfFlag === 'S' && (a1 > 0 || b1 > 0)) err(`${D80}.SelfAndFamily`, 'Schedule 80D: nothing may be claimed at Sl. 1a / 1b when "Not claiming for self / family" is selected', 'A-183');
    if (parFlag === 'P' && (a2 > 0 || b2 > 0)) err(`${D80}.Parents`, 'Schedule 80D: nothing may be claimed at Sl. 2a / 2b when "Not claiming for parents" is selected', 'A-184');

    const breakups: Array<[string, number, string]> = [
      ['Sec80DSelfFamHIDtls', a1Ins, 'A-244'],
      ['Sec80DSelfFamSrCtznHIDtls', b1Ins, 'A-245'],
      ['Sec80DParentsHIDtls', a2Ins, 'A-246'],
      ['Sec80DParentsSrCtznHIDtls', b2Ins, 'A-247'],
    ];
    for (const [grp, premium, rule] of breakups) {
      const base = `${D80}.${grp}`;
      if (!has(base)) continue;
      const paid = A(`${base}.Sch80DInsDtls`).reduce((t, r) => t + gn(r, 'HealthInsAmt'), 0);
      const declared = N(`${base}.TotalPayments`);
      if (!eq(declared, paid)) err(`${base}.TotalPayments`, 'Schedule 80D: total payments must equal the sum of the individual premium rows', rule);
      if (!eq(declared, premium)) err(`${base}.TotalPayments`, 'Schedule 80D: the premium break-up must match the health-insurance premium entered', rule);
    }
  }

  /* ── Schedules 80DD / 80U — details required (A-215..A-218) ────────── */
  for (const [sched, label, rule] of [['Schedule80DD', '80DD', 'A-215'], ['Schedule80U', '80U', 'A-216']] as Array<[string, string, string]>) {
    if (!has(sched)) continue;
    if (N(`${sched}.DeductionAmount`) > 0 && !has(`${sched}.NatureOfDisability`)) {
      err(`${sched}.NatureOfDisability`, `Schedule ${label}: the nature of disability must be selected when a deduction is claimed`, rule);
    }
    if (N(`${sched}.DeductionAmount`) > 0 && !has(`${sched}.TypeOfDisability`)) {
      err(`${sched}.TypeOfDisability`, `Schedule ${label}: the type of disability must be selected when a deduction is claimed`, label === '80DD' ? 'A-218' : 'A-217');
    }
  }

  /* ── 80G / 80GGA: cash or other mode is mandatory (A-79..A-82, A-89) ─ */
  const g80Tables: Array<[string, string]> = [
    ['Don100Percent', 'A-79'], ['Don50PercentNoApprReqd', 'A-80'],
    ['Don100PercentApprReqd', 'A-81'], ['Don50PercentApprReqd', 'A-82'],
  ];
  for (const [tbl, rule] of g80Tables) {
    A(`Schedule80G.${tbl}.DoneeWithPan`).forEach((d, i) => {
      if (gn(d, 'DonationAmt') > 0 && gn(d, 'DonationAmtCash') <= 0 && gn(d, 'DonationAmtOtherMode') <= 0) {
        err(`Schedule80G.${tbl}.DoneeWithPan[${i}]`, 'Donation in cash or donation in other mode must be entered before the total-donation column', rule);
      }
    });
  }
  A('Schedule80GGA.DonationDtlsSciRsrchRuralDev').forEach((d, i) => {
    if (gn(d, 'DonationAmt') > 0 && gn(d, 'DonationAmtCash') <= 0 && gn(d, 'DonationAmtOtherMode') <= 0) {
      err(`Schedule80GGA.DonationDtlsSciRsrchRuralDev[${i}]`, 'Donation in cash or donation in other mode must be entered before the total-donation column', 'A-89');
    }
  });

  /* ── Schedule 80GGC internals (A-203, A-206, A-207, A-208) ─────────── */
  if (has('Schedule80GGC')) {
    const ggcRows = A('Schedule80GGC.Schedule80GGCDetails');
    const rCash = ggcRows.reduce((t, r) => t + gn(r, 'DonationAmtCash'), 0);
    const rOther = ggcRows.reduce((t, r) => t + gn(r, 'DonationAmtOtherMode'), 0);
    if (!eq(N('Schedule80GGC.TotalDonationAmtCash80GGC'), rCash) || !eq(N('Schedule80GGC.TotalDonationAmtOtherMode80GGC'), rOther)) {
      err('Schedule80GGC.TotalDonationAmtCash80GGC', 'Schedule 80GGC: the totals at A and B must equal the sum of the individual contribution rows', 'A-206');
    }
    if (!eq(N('Schedule80GGC.TotalEligibleDonationAmt80GGC'), Math.min(rOther, Math.max(gti, 0)))) {
      err('Schedule80GGC.TotalEligibleDonationAmt80GGC', 'Schedule 80GGC: the eligible amount of contribution must equal the contribution in other mode, restricted to gross total income', 'A-205');
    }
    ggcRows.forEach((d, i) => {
      const base = `Schedule80GGC.Schedule80GGCDetails[${i}]`;
      if (!gs(d, 'DonationDate')) {
        err(`${base}.DonationDate`, 'Schedule 80GGC: the date of contribution is mandatory', 'A-207');
      }
      if (gn(d, 'DonationAmt') > 0 && gn(d, 'DonationAmtOtherMode') <= 0) {
        err(`${base}.DonationAmtOtherMode`, 'Schedule 80GGC: details of the contribution made in a mode other than cash are required', 'A-208');
      }
      if (!eq(gn(d, 'EligibleDonationAmt'), gn(d, 'DonationAmtOtherMode'))) {
        err(`${base}.EligibleDonationAmt`, 'Schedule 80GGC: the eligible amount of each row must equal the contribution made in other mode', 'A-203');
      }
    });
  }

  /* ── Loan sanction windows and limits (A-237, A-239..A-242, A-262) ─── */
  A('Schedule80EE.Schedule80EEDtls').forEach((r, i) => {
    const d = gs(r, 'DateofLoan');
    if (d && DATE_RX.test(d) && (d < '2016-04-01' || d > '2017-03-31')) {
      err(`Schedule80EE.Schedule80EEDtls[${i}].DateofLoan`, 'Schedule 80EE: the loan must be sanctioned between 01/04/2016 and 31/03/2017', 'A-262');
    }
    if (gn(r, 'TotalLoanAmt') > 3500000) {
      err(`Schedule80EE.Schedule80EEDtls[${i}].TotalLoanAmt`, 'Schedule 80EE: the loan sanctioned against the property cannot exceed Rs 35,00,000', 'A-237');
    }
  });
  A('Schedule80EEA.Schedule80EEADtls').forEach((r, i) => {
    const d = gs(r, 'DateofLoan');
    if (d && DATE_RX.test(d) && (d < '2019-04-01' || d > '2022-03-31')) {
      err(`Schedule80EEA.Schedule80EEADtls[${i}].DateofLoan`, 'Schedule 80EEA: the loan must be sanctioned between 01/04/2019 and 31/03/2022', 'A-240');
    }
  });
  if (has('Schedule80EEA') && N('Schedule80EEA.PropStmpDtyVal') > 4500000) {
    err('Schedule80EEA.PropStmpDtyVal', 'Schedule 80EEA: the deduction is available only where the stamp-duty value of the house property does not exceed Rs 45,00,000', 'A-239');
  }
  A('Schedule80EEB.Schedule80EEBDtls').forEach((r, i) => {
    const d = gs(r, 'DateofLoan');
    if (d && DATE_RX.test(d) && (d < '2019-04-01' || d > '2023-03-31')) {
      err(`Schedule80EEB.Schedule80EEBDtls[${i}].DateofLoan`, 'Schedule 80EEB: the loan must be sanctioned between 01/04/2019 and 31/03/2023', 'A-242');
    }
  });
  // A-230 / A-231 / A-232: 80EE and 80EEA ride on top of the 24(b) limit.
  if (isOld && S(`${ID}.TypeOfHP`) === 'S' && (av('Section80EE') > 0 || av('Section80EEA') > 0) && N(`${ID}.InterestPayable`) < 200000) {
    err(`${VIA}.Section80EE`, 'A deduction u/s 80EE / 80EEA may be claimed only after the limit u/s 24(b) has been exhausted', 'A-230');
  }
  const acc24b = A('ScheduleUs24B.ScheduleUs24BDtls')
    .map(r => gs(r, 'LoanAccNoOfBankOrInstnRefNo').toUpperCase())
    .filter(a => a !== '');
  if (acc24b.length > 0) {
    for (const [sched, dtls, rule] of [
      ['Schedule80EE', 'Schedule80EEDtls', 'A-231'],
      ['Schedule80EEA', 'Schedule80EEADtls', 'A-232'],
    ] as Array<[string, string, string]>) {
      A(`${sched}.${dtls}`).forEach((r, i) => {
        const acc = gs(r, 'LoanAccNoOfBankOrInstnRefNo').toUpperCase();
        if (acc && acc24b.indexOf(acc) < 0) {
          err(`${sched}.${dtls}[${i}].LoanAccNoOfBankOrInstnRefNo`, `The loan account disclosed in ${sched} must also appear in schedule 24(b)`, rule);
        }
      });
    }
  }

  /* ── Year of deduction / collection is mandatory (A-99) ────────────── */
  A('TDSonOthThanSals.TDSonOthThanSal').forEach((r, i) => {
    if (gn(r, 'ClaimOutOfTotTDSOnAmtPaid') > 0 && !gs(r, 'DeductedYr')) {
      err(`TDSonOthThanSals.TDSonOthThanSal[${i}].DeductedYr`, 'The year of tax deduction is mandatory where TDS credit is claimed', 'A-99');
    }
  });
  A('ScheduleTDS3Dtls.TDS3Details').forEach((r, i) => {
    if (gn(r, 'TDSClaimed') > 0 && !gs(r, 'DeductedYr')) {
      err(`ScheduleTDS3Dtls.TDS3Details[${i}].DeductedYr`, 'The year of tax deduction is mandatory where TDS credit is claimed', 'A-99');
    }
  });
  A('ScheduleTCS.TCS').forEach((r, i) => {
    if (gn(r, 'AmtTCSClaimedThisYear') > 0 && !gs(r, 'CollectedYr')) {
      err(`ScheduleTCS.TCS[${i}].CollectedYr`, 'The year of tax collection is mandatory where TCS credit is claimed', 'A-99');
    }
  });

  /* ── Updated return u/s 139(8A) (A-199) and revised-return particulars ─ */
  const fileSec = P('FilingStatus.ReturnFileSec');
  if (isOld && fileSec === 21) {
    err('FilingStatus.OptOutNewTaxRegime', 'The option to withdraw from the new tax regime is not available in an updated return u/s 139(8A)', 'A-199');
  }
  if (fileSec === 17) {
    if (!has('FilingStatus.OrigRetFiledDate')) {
      warn('FilingStatus.OrigRetFiledDate', 'For a revised return u/s 139(5), the date on which the original return was filed should be provided');
    }
    if (!has('FilingStatus.ReceiptNo')) {
      warn('FilingStatus.ReceiptNo', 'For a revised return u/s 139(5), the acknowledgement number of the original return should be provided');
    }
  }
  if ((fileSec === 13 || fileSec === 14 || fileSec === 16 || fileSec === 18) && !has('FilingStatus.NoticeNo')) {
    warn('FilingStatus.NoticeNo', 'A notice number is normally required where the return is filed in response to a notice u/s 142(1) / 148 / 153C / 139(9)');
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Entry point
 * ──────────────────────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  try {
    walkSpec(SPEC, json, '', missing, 0);
  } catch {
    /* never throw — a walking failure must not break the caller */
  }

  try {
    for (const chk of PATTERN_CHECKS) {
      const v = at(json, chk.path);
      if (typeof v === 'string' && v.trim() !== '' && !chk.test(v)) {
        errors.push({ path: chk.path, msg: chk.msg, rule: 'SCHEMA' });
      }
    }
  } catch { /* ignore */ }

  try {
    runCategoryARules(json, errors, warnings);
  } catch { /* rule evaluation must never throw */ }

  try {
    runCategoryARulesPart2(json, errors, warnings);
  } catch { /* rule evaluation must never throw */ }

  return {
    form: 'itr1',
    ay: '2025-26',
    schemaVersion: SCHEMA_VERSION,
    missing,
    errors,
    warnings,
    ok: missing.length === 0 && errors.length === 0,
  };
};
