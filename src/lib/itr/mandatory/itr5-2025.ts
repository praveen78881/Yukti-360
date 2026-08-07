/**
 * OFFICIAL mandatory-field validator — ITR-5, AY 2025-26.
 *
 * Sources (distilled at build time, NOT imported at runtime):
 *  - ITD JSON schema  "ITR-5_2025_Main_V1.2.json" (draft-04): the recursive
 *    required-property tree below was machine-extracted from the schema
 *    definitions starting at #/definitions/ITR5 (payload root { ITR: { ITR5 } }).
 *  - ITD "ITR-5_ValidationRules_AY2025-26_V1.0" — Table 2 (Category A:
 *    "Return will not be allowed to be uploaded"). Every category-A rule that
 *    is checkable on the exported JSON alone (mandatory-if conditions and
 *    cross-field requirements) is encoded in categoryAChecks; arithmetic
 *    reconciliations that require the full computation engine and rules that
 *    need external data (CPC records, e-verification, Form 10IF/10IEA lookups)
 *    are out of scope for this checker.
 *
 * The module is self-contained and never throws on partial/undefined payloads.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr5';
const AY = '2025-26';
const SCHEMA_VERSION = 'ITR-5_2025_Main_V1.2';

/* ────────────────────────────────────────────────────────────────────────────
 * Distilled REQUIRED tree (machine-extracted from the official schema).
 * A leaf `1` means "required scalar/enum — must be present and non-empty".
 * A nested object means "required object — must be present, then its own
 * required children are checked". 428 required leaves in total.
 * ──────────────────────────────────────────────────────────────────────────── */

type ReqNode = 1 | { [key: string]: ReqNode };

const REQUIRED_TREE: { [key: string]: ReqNode } = {
  ITR: {
    ITR5: {
      CreationInfo: {
        SWVersionNo: 1, SWCreatedBy: 1, JSONCreatedBy: 1,
        JSONCreationDate: 1, IntermediaryCity: 1, Digest: 1,
      },
      Form_ITR5: {
        FormName: 1, Description: 1, AssessmentYear: 1, SchemaVer: 1, FormVer: 1,
      },
      PartA_GEN1: {
        OrgFirmInfo: {
          AssesseeName: { SurNameOrOrgName: 1 },
          PAN: 1,
          Address: {
            ResidenceNo: 1, LocalityOrArea: 1, CityOrTownOrDistrict: 1,
            StateCode: 1, CountryCode: 1, CountryCodeMobile: 1, MobileNo: 1,
            EmailAddress: 1,
          },
          DateOFFormOrIncorp: 1,
          StatusOrCompanyType: 1,
        },
        FilingStatus: {
          ReturnFileSec: { IncomeTaxSec: 1 },
          BusinessTrustFlag: 1, InvstmntFundRefrdSec115UB: 1, ResidentialStatus: 1,
          ForeignExchangeFlag: 1, StartUpDPIITFlag: 1, InterMinisterialCertFlag: 1,
          FiiFpiFlag: 1, AsseseeRepFlg: 1, PartnerInFirmFlg: 1,
          HeldUnlistedEqShrPrYrFlg: 1, ItrFilingDueDate: 1, ifMSME: 1,
        },
      },
      PartA_GEN2: {
        LiableSec44AAflg: 1, IncDclrdUs: 1, LiableSec44ABflg: 1,
        LiableSec92Eflg: 1, PrevYrMemPartChange: 1,
      },
      PARTA_BS: {
        FundSrc: {
          PartnerOrMemberFund: {
            PartnerOrMemberCap: 1,
            ResrNSurp: {
              RevResr: 1, CapResr: 1, StatResr: 1, OthResr: 1,
              CreditBalOfPLAccount: 1, TotResrNSurp: 1,
            },
            TotPartnerOrMemberFund: 1,
          },
          LoanFunds: {
            SecrLoan: {
              ForeignCurrLoan: 1,
              RupeeLoan: { FrmBank: 1, FrmOthrs: 1, TotRupeeLoan: 1 },
              TotSecrLoan: 1,
            },
            UnsecrLoan: {
              ForeignCurrencyLoans: 1,
              RupeeLoan: { FrmBank: 1, FrmPersonSpcfdUs40A2b: 1, FrmOthrs: 1, TotRupeeLoan: 1 },
              TotUnSecrLoan: 1,
            },
            TotLoanFund: 1,
          },
          DeferredTax: 1,
          Advances: { FrmPersonSpcfdUs40A2b: 1, FrmOthers: 1, TotalAdvances: 1 },
          TotFundSrc: 1,
        },
        FundApply: {
          FixedAsset: {
            GrossBlock: 1, Depreciation: 1, NetBlock: 1, CapWrkProg: 1, TotFixedAsset: 1,
          },
          Investments: {
            LongTermInv: {
              InvInProperty: 1,
              EquityInstruments: { ListedEquities: 1, UnListedEquities: 1, Total: 1 },
              PreferenceShares: 1, GovtOrTrustSecurities: 1, DebenturesOrBonds: 1,
              MutualFunds: 1, Others: 1, TotLongTermInv: 1,
            },
            ShortTermInv: {
              EquityInstruments: { ListedEquities: 1, UnListedEquities: 1, Total: 1 },
              PreferenceShares: 1, GovtOrTrustSecurities: 1, DebenturesOrBonds: 1,
              MutualFunds: 1, Others: 1, TotShortTermInv: 1,
            },
            TotInvestments: 1,
          },
          CurrAssetLoanAdv: {
            CurrAsset: {
              Inventories: {
                RawMatl: 1, WorkInProgress: 1, FinOrTradGood: 1, StkInTrade: 1,
                StoresConsumables: 1, LooseTools: 1, Others: 1, TotInventries: 1,
              },
              SundryDebtorDtls: { OutstandindMorethanOneYr: 1, Others: 1, TotalSundryDebtors: 1 },
              CashOrBankBal: { BankBal: 1, CashinHand: 1, Others: 1, TotCashOrBankBal: 1 },
              OthCurrAsset: 1, TotCurrAsset: 1,
            },
            LoanAdv: {
              AdvRecoverable: 1, Deposits: 1, BalWithRevAuth: 1, TotLoanAdv: 1,
              LoanAdvIncluded: { PurposeOFBusOrProf: 1, NotForPurposeOFBusOrProf: 1 },
            },
            TotCurrAssetLoanAdv: 1,
            CurrLiabilitiesProv: {
              CurrLiabilities: {
                SundryCreditorDtls: { OutstandindMorethanOneYr: 1, Others: 1, TotalSundryCreditors: 1 },
                LiabForLeasedAsset: 1, AccrIntonLeasedAsset: 1, AccrIntNotDue: 1,
                IncRecvdInAdv: 1, OtherPayables: 1, TotCurrLiabilities: 1,
              },
              Provisions: { ITProvision: 1, ELSuperAnnGratProvision: 1, OthProvision: 1, TotProvisions: 1 },
              TotCurrLiabilitiesProvision: 1,
            },
            NetCurrAsset: 1,
          },
          MiscAdjust: { MiscExpndr: 1, DefTaxAsset: 1, AccumultedLosses: 1, TotMiscAdjust: 1 },
          TotFundApply: 1,
        },
      },
      PARTA_PL: {
        CreditsToPL: {
          OthIncome: {
            RentInc: 1, Comissions: 1, Dividends: 1, InterestInc: 1,
            ProfitOnSaleFixedAsset: 1, ProfitOnInvChrSTT: 1, ProfitOnOthInv: 1,
            ProfitOnCurrFluct: 1, ProfitOnCnvInvntryToCapAsst: 1, ProfitOnAgriIncome: 1,
            MiscOthIncome: 1, TotOthIncome: 1,
          },
          TotCreditsToPL: 1,
        },
        DebitsToPL: {
          DebitPlAcnt: {
            Freight: 1, ConsumptionOfStores: 1, PowerFuel: 1, RentExpdr: 1,
            RepairsBldg: 1, RepairMach: 1,
            EmployeeComp: {
              SalsWages: 1, Bonus: 1, MedExpReimb: 1, LeaveEncash: 1, LeaveTravelBenft: 1,
              ContToSuperAnnFund: 1, ContToPF: 1, ContToGratFund: 1, ContToOthFund: 1,
              OthEmpBenftExpdr: 1, TotEmployeeComp: 1,
            },
            Insurances: { MedInsur: 1, LifeInsur: 1, KeyManInsur: 1, OthInsur: 1, TotInsurances: 1 },
            StaffWelfareExp: 1, Entertainment: 1, Hospitality: 1, Conference: 1,
            SalePromoExp: 1, Advertisement: 1,
            CommissionExpdrDtls: { NonResOtherCompany: 1, Others: 1, Total: 1 },
            RoyalityDtls: { NonResOtherCompany: 1, Others: 1, Total: 1 },
            ProfessionalConstDtls: { NonResOtherCompany: 1, Others: 1, Total: 1 },
            HotelBoardLodge: 1, TravelExp: 1, ForeignTravelExp: 1, ConveyanceExp: 1,
            TelephoneExp: 1, GuestHouseExp: 1, ClubExp: 1, FestivalCelebExp: 1,
            Scholarship: 1, Gift: 1, Donation: 1,
            RatesTaxesPays: {
              ExciseCustomsVAT: {
                UnionExciseDuty: 1, ServiceTax: 1, VATorSaleTax: 1, CentralGoodServiceTax: 1,
                StateGoodServiceTax: 1, IntegratedGoodServiceTax: 1, UnionTerrGoodServiceTax: 1,
                OthDutyTaxCess: 1, TotExciseCustomsVAT: 1,
              },
            },
            AuditFee: 1, SalRemuneration: 1, OtherExpenses: 1,
            BadDebtDtls: {
              BadDebtAmtDtlsTotal: 1, OthersPANNotAvlblDtlTotal: 1, OthersAmtLt1Lakh: 1, BadDebt: 1,
            },
            ProvForBadDoubtDebt: 1, OthProvisionsExpdr: 1, PBIDTA: 1,
            InterestExpdrtDtls: {
              NonResOtherCompany: 1, Others: 1, ResPartners: 1, ResOthers: 1, InterestExpdr: 1,
            },
            DepreciationAmort: 1, PBT: 1,
          },
          TaxProvAppr: {
            ProvForCurrTax: 1, ProvDefTax: 1, ProfitAfterTax: 1, BalBFPrevYr: 1,
            AmtAvlAppr: 1, Appropriations: { TrfToReserves: 1 }, PartnerAccBalTrf: 1,
          },
        },
        PersumptiveInc44AD: { GrsTrnOverOrReceipt: 1, TotPersumptiveInc44AD: 1 },
        PersumptiveInc44ADA: { GrsReceipt: 1 },
        TotalPrsumptvIncUs44E: 1,
        NoBooksOfAccPL: {
          GrossReceipt: 1, GrsRcptAccPayeeOrBankMode: 1, GrsRcptOtherMode: 1,
          GrossProfit: 1, Expenses: 1, NetProfit: 1,
          GrossReceiptPrf: 1, GrsRcptAccPayeeOrBankModePrf: 1, GrsRcptOtherModePrf: 1,
          GrossProfitPrf: 1, ExpensesPrf: 1, NetProfitPrf: 1, TotBusinessProfession: 1,
        },
        TurnverFrmSpecActivity: 1,
        NetIncomeFrmSpecActivity: 1,
      },
      CorpScheduleBP: {
        BusinessIncOthThanSpec: {
          ProfBfrTaxPL: 1, NetPLFromSpecBus: 1, NetProfLossSpecifiedBus: 1,
          IncRecCredPLOthHeadDtls: {
            HouseProperty: 1, CapitalGains: 1, OtherSources: 1, UnderSec115BBF: 1,
            UnderSec115BBG: 1, Dividend: 1, OtherThanDividend: 1,
          },
          PLUs44sChapXIIGOthrUs115B: 1,
          ProfitLossInclRefrdSec: {
            ProfitLossUs44AD: 1, ProfitLossUs44ADA: 1, ProfitLossUs44AE: 1, ProfitLossUs44B: 1,
            ProfitLossUs44BB: 1, ProfitLossUs44BBA: 1, ProfitLossUs44BBC: 1, ProfitLossUs44DA: 1,
            FirstSchITActOthr115B: 1,
          },
          TotalProfitFrmActCvrd: 1,
          ProfitFrmActCvrd: {
            ProfitFrmActCvrdUndrRule7: 1, ProfitFrmActCvrdUndrRule7A: 1,
            ProfitFrmActCvrdUndrRule7B1: 1, ProfitFrmActCvrdUndrRule7B1A: 1,
            ProfitFrmActCvrdUndrRule8: 1,
          },
          IncCredPL: { FirmShareInc: 1, AOPBOISharInc: 1, OthExempInc: 1, TotExempInc: 1 },
          BalancePLOthThanSpecBus: 1,
          ExpDebToPLOthHeadDtls: {
            HouseProperty: 1, CapitalGains: 1, OtherSources: 1, UnderSec115BBF: 1, UnderSec115BBG: 1,
          },
          ExpDebToPLExemptInc: 1, ExpDebToPLExemptIncDisAllwUs14A: 1, TotExpDebPL: 1,
          AdjustedPLOthThanSpecBus: 1, DepreciationDebPLCosAct: 1,
          DepreciationAllowITAct32: {
            DepreciationAllowUs32_1_ii: 1, DepreciationAllowUs32_1_i: 1, TotDeprAllowITAct: 1,
          },
          AdjustPLAfterDeprOthSpecInc: 1,
          AmtDebPLDisallowUs36: 1, AmtDebPLDisallowUs37: 1, AmtDebPLDisallowUs40: 1,
          AmtDebPLDisallowUs40A: 1, AmtDebPLDisallowUs43B: 1, InterestDisAllowUs23SMEAct: 1,
          DeemIncUs41: 1, DeemIncUs3380HHD80IA: 1, DeemIncUs43CA: 1,
          OthItemDisallowUs28To44DB: 1, AnyOthIncNotInclInExpDisallowPL: 1,
          SalaryExpDisallowPL: 1, BonusExpDisallowPL: 1, CommissionExpDisallowPL: 1,
          InterestExpDisallowPL: 1, OthersExpDisallowPL: 1, IncProfDecLossAccICDSAdj: 1,
          TotAfterAddToPLDeprOthSpecInc: 1, DeductUs32_1_iii: 1, DebPLUs35ExcessAmt: 1,
          AmtDisallUs40NowAllow: 1, AmtDisallUs43BNowAllow: 1, AnyOthAmtAllDeduct: 1,
          DecProfIncLossAccICDSAdj: 1, TotDeductionAmts: 1, PLAftAdjDedBusOthThanSpec: 1,
          DeemedProfitBusUs: {
            Section44AD: 1, Section44ADA: 1, Section44AE: 1, Section44B: 1, Section44BB: 1,
            Section44BBA: 1, Section44BBC: 1, Section44DA: 1, FirstSchTActOther: 1,
            TotDeemedProfitBusUs: 1,
          },
          NetPLAftAdjBusOthThanSpec: 1, NetPLBusOthThanSpec7A7B7C: 1,
          ChrgblIncUndrRule7: 1, DeemedChrgblIncUndrRule7A: 1, DeemedChrgblIncUndrRule7B1: 1,
          DeemedChrgblIncUndrRule7B1A: 1, DeemedChrgblIncUndrRule8: 1,
          IncomeOtherThanRule: 1, BalIncDeemedFrmAgri: 1,
        },
        SpecBusinessInc: {
          NetPLFrmSpecBus: 1, AdditionUs28to44DB: 1, DeductUs28to44DB: 1, AdjustedPLFrmSpecuBus: 1,
        },
        IncSpecifiedBusiness: {
          NetPLFrmSpecifiedBus: 1, AddSec28to44DB: 1, DedSec28to44DBOTDedSec35AD: 1,
          ProfitLossSpecifiedBusiness: 1, ProfitLossSpecifiedBusFinal: 1,
        },
        IncChrgUnHdProftGain: 1,
        BusSetoffCurrYr: { LossSetOffOnBusLoss: 1, TotLossSetOffOnBus: 1, LossRemainSetOffOnBus: 1 },
      },
      'PartB-TI': {
        IncomeFromHP: 1,
        ProfBusGain: {
          ProfGainNoSpecBus: 1, ProfGainSpecBus: 1, ProfGainSpecifiedBus: 1,
          IncChrgblTaxSplRate: 1, TotProfBusGain: 1,
        },
        CapGain: {
          ShortTerm: {
            ShortTerm15Per: 1, ShortTerm20Per: 1, ShortTerm30Per: 1, ShortTermAppRate: 1,
            ShortTermSplRateDTAA: 1, TotalShortTerm: 1,
          },
          LongTerm: {
            LongTerm10Per: 1, LongTerm12_5Per: 1, LongTerm20Per: 1, LongTermSplRateDTAA: 1,
            TotalLongTerm: 1,
          },
          TotalCapGains: 1, ShortTermLongTermTotal: 1, CapGains30Per115BBH: 1,
        },
        IncFromOS: {
          OtherSrcThanOwnRaceHorse: 1, IncChargblSplRate: 1, FromOwnRaceHorse: 1, TotIncFromOS: 1,
        },
        TotalTI: 1, CurrentYearLoss: 1, BalanceAfterSetoffLosses: 1, BroughtFwdLossesSetoff: 1,
        GrossTotalIncome: 1, IncChargeTaxSplRate111A112: 1,
        DeductionsUndSchVIADtl: { PartBchapterVIA: 1, PartCchapterVIA: 1, TotDeductUndSchVIA: 1 },
        DeductionsUnder10Aor10AA: 1, TotalIncome: 1, IncChargeableTaxSplRates: 1,
        NetAgricultureIncomeOrOtherIncomeForRate: 1, AggregateIncome: 1,
        LossesOfCurrentYearCarriedFwd: 1,
      },
      PartB_TTI: {
        ComputationOfTaxLiability: {
          TaxPayableOnDeemedTI: { TaxDeemedTISec115JC: 1, Surcharge: 1, EducationCess: 1, TotalTax: 1 },
          TaxPayableOnTI: {
            TaxAtNormalRates: 1, TaxAtSpecialRates: 1, RebateOnAgriInc: 1, TaxPayableOnTotInc: 1,
            Surcharge25ofSI: 1, SurchargeOnTaxPayable: 1, Surcharge25ofSIBeforeMarginal: 1,
            SurchargeOnTaxPayableBeforeMarginal: 1, TotalSurcharge: 1, EducationCess: 1,
            GrossTaxLiability: 1,
          },
          GrossTaxPayable: 1, CreditUS115JD: 1, TaxPaidUnderCredit: 1,
          TaxRelief: { Section90: 1, Section91: 1, TotTaxRelief: 1 },
          NetTaxLiability: 1,
          IntrstPay: {
            IntrstPayUs234A: 1, IntrstPayUs234B: 1, IntrstPayUs234C: 1,
            LateFilingFee234F: 1, TotalIntrstPay: 1,
          },
          AggregateTaxInterestLiability: 1,
        },
        TaxPaid: { TaxesPaid: { TotalTaxesPaid: 1 }, BalTaxPayable: 1 },
        Refund: { RefundDue: 1, BankAccountDtls: { BankDtlsFlag: 1 } },
      },
      Verification: {
        Declaration: {
          AssesseeVerName: 1, FatherName: 1, AssesseeVerPAN: 1, Capacity: 1, Place: 1, Date: 1,
        },
      },
    },
  },
};

/* ── CA-readable labels for key leaves; everything else is humanised ───────── */

const LABELS: Record<string, string> = {
  PAN: 'PAN of the assessee',
  SurNameOrOrgName: 'Name of the firm / AOP / BOI (organisation name)',
  DateOFFormOrIncorp: 'Date of formation / incorporation',
  StatusOrCompanyType: 'Status (1-Firm, 2-Local Authority, 14-AOP/BOI, 9-AJP)',
  ResidenceNo: 'Flat / door / block number',
  LocalityOrArea: 'Area / locality',
  CityOrTownOrDistrict: 'Town / city / district',
  StateCode: 'State code',
  CountryCode: 'Country code',
  CountryCodeMobile: 'Mobile country code (e.g. 91)',
  MobileNo: 'Mobile number',
  EmailAddress: 'E-mail address',
  IncomeTaxSec: 'Section under which the return is filed (139(1), 139(4), …)',
  BusinessTrustFlag: 'Whether the assessee is a business trust (Y/N)',
  InvstmntFundRefrdSec115UB: 'Whether an investment fund referred u/s 115UB (Y/N)',
  ResidentialStatus: 'Residential status (RES/NRI)',
  ForeignExchangeFlag: 'Unit in IFSC deriving income solely in convertible foreign exchange? (Y/N)',
  StartUpDPIITFlag: 'Recognised as start-up by DPIIT? (Y/N)',
  InterMinisterialCertFlag: 'Certification by Inter-Ministerial Board? (Y/N)',
  FiiFpiFlag: 'Whether FII / FPI? (Y/N)',
  AsseseeRepFlg: 'Return filed by a representative assessee? (Y/N)',
  PartnerInFirmFlg: 'Whether partner in a firm? (Y/N)',
  HeldUnlistedEqShrPrYrFlg: 'Held unlisted equity shares during the year? (Y/N)',
  ItrFilingDueDate: 'Due date applicable for filing the return',
  ifMSME: 'Whether recognised as MSME? (Y/N)',
  LiableSec44AAflg: 'Liable to maintain accounts u/s 44AA? (Y/N)',
  IncDclrdUs: 'Declaring income only u/s 44AD/44ADA/44AE/44B/44BB/44BBA? (Y/N)',
  LiableSec44ABflg: 'Liable for audit u/s 44AB? (Y/N)',
  LiableSec92Eflg: 'Liable for audit u/s 92E (transfer pricing)? (Y/N)',
  PrevYrMemPartChange: 'Change in partners / members during the year? (Y/N)',
  FormName: 'Form name (must be "ITR-5")',
  AssessmentYear: 'Assessment year (must be "2025")',
  SchemaVer: 'Schema version',
  FormVer: 'Form version',
  Description: 'Form description',
  SWVersionNo: 'Software version number (auto-filled on export)',
  SWCreatedBy: 'Software provider id (auto-filled on export)',
  JSONCreatedBy: 'JSON creator id (auto-filled on export)',
  JSONCreationDate: 'JSON creation date (auto-filled on export)',
  IntermediaryCity: 'Intermediary city (auto-filled on export)',
  Digest: 'Digest (auto-filled on export)',
  AssesseeVerName: 'Name of the person verifying the return',
  FatherName: "Father's name of the person verifying",
  AssesseeVerPAN: 'PAN of the person verifying (individual PAN, 4th char P)',
  Capacity: 'Capacity of the person verifying (MP/DP/PA/PO/ME/…)',
  Place: 'Place of verification',
  Date: 'Date of verification',
  RefundDue: 'Refund due',
  BankDtlsFlag: 'Bank account details flag',
  TotalTaxesPaid: 'Total taxes paid',
  BalTaxPayable: 'Balance tax payable',
  GrossTotalIncome: 'Gross total income',
  TotalIncome: 'Total income',
  IncomeFromHP: 'Income from house property (Part B-TI)',
  TotalTI: 'Total of heads of income (Part B-TI Sl. 5)',
};

const SECTION_HINTS: Record<string, string> = {
  CreationInfo: 'Generated automatically on JSON export',
  Form_ITR5: 'Generated automatically on JSON export (form header)',
  PartA_GEN1: 'Part A — General: Assessee info. / Filing status',
  PartA_GEN2: 'Part A — General (2): Audit information / Partners & members',
  PARTA_BS: 'Part A — Balance Sheet (Sources & Application of funds)',
  PARTA_PL: 'Part A — Profit and Loss account',
  CorpScheduleBP: 'Schedule BP — Computation of income from business or profession',
  'PartB-TI': 'Part B-TI — Computation of total income',
  PartB_TTI: 'Part B-TTI — Computation of tax liability',
  Verification: 'Verification — declaration by the signatory',
};

function humanise(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Generic totals/rows get their parent prefixed so the CA can locate them. */
const AMBIGUOUS = new Set([
  'Total', 'Others', 'FrmBank', 'FrmOthrs', 'TotRupeeLoan', 'RupeeLoan',
  'NonResOtherCompany', 'OutstandindMorethanOneYr', 'FrmPersonSpcfdUs40A2b',
  'EquityInstruments', 'ListedEquities', 'UnListedEquities', 'PreferenceShares',
  'GovtOrTrustSecurities', 'DebenturesOrBonds', 'MutualFunds', 'EducationCess',
  'Surcharge', 'HouseProperty', 'CapitalGains', 'OtherSources',
  'UnderSec115BBF', 'UnderSec115BBG',
]);

function labelFor(path: string[]): string {
  const leaf = path[path.length - 1];
  if (LABELS[leaf]) return LABELS[leaf];
  const base = humanise(leaf);
  if (AMBIGUOUS.has(leaf) && path.length >= 2) {
    return `${humanise(path[path.length - 2])} — ${base}`;
  }
  return base;
}

function hintFor(path: string[]): string | undefined {
  // path = ['ITR', 'ITR5', <section>, ...]
  return path.length >= 3 ? SECTION_HINTS[path[2]] : undefined;
}

/** Walk the required tree; every absent/empty required node → missing[]. */
function walkRequired(json: unknown, node: ReqNode, path: string[], missing: MissingField[]): void {
  const dotPath = path.join('.');
  const v = at(json, dotPath);
  if (node === 1) {
    if (isEmpty(v)) missing.push({ path: dotPath, label: labelFor(path), hint: hintFor(path) });
    return;
  }
  if (v === null || v === undefined || typeof v !== 'object' || Array.isArray(v)) {
    // whole required object/section is absent — report once, do not flood
    missing.push({
      path: dotPath,
      label: `${labelFor(path)} — entire section is missing`,
      hint: hintFor(path),
    });
    return;
  }
  for (const key of Object.keys(node)) {
    walkRequired(json, node[key], [...path, key], missing);
  }
}

/* ── helpers for rule checks ───────────────────────────────────────────────── */

const P = 'ITR.ITR5';

function str(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v === null || v === undefined) return '';
  return String(v);
}
function num(v: unknown): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  return 0;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function isDateStr(v: unknown): boolean {
  return typeof v === 'string' && /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v);
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
/** Section/schedule "has any data" — object/array with at least one non-empty value. */
function hasData(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).some(
      (x) => (typeof x === 'object' ? hasData(x) : !isEmpty(x)),
    );
  }
  return !isEmpty(v);
}

/* ── format / identity checks straight from schema patterns & enums ────────── */

function schemaFormatChecks(j: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const chk = (path: string, ok: (v: unknown) => boolean, msg: string, hard = true): void => {
    const v = at(j, path);
    if (isEmpty(v)) return; // absence is handled by the required tree
    if (!ok(v)) (hard ? errors : warnings).push({ path, msg, rule: 'SCHEMA' });
  };
  chk(`${P}.Form_ITR5.FormName`, (v) => str(v) === 'ITR-5', 'FormName must be exactly "ITR-5"');
  chk(`${P}.Form_ITR5.AssessmentYear`, (v) => str(v) === '2025', 'AssessmentYear must be "2025" for AY 2025-26');
  chk(`${P}.Form_ITR5.SchemaVer`, (v) => str(v) === 'Ver1.0', 'SchemaVer must be "Ver1.0"', false);
  chk(`${P}.Form_ITR5.FormVer`, (v) => str(v) === 'Ver1.0', 'FormVer must be "Ver1.0"', false);
  chk(`${P}.PartA_GEN1.OrgFirmInfo.PAN`,
    (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(str(v)),
    'PAN of the assessee is not a valid PAN (format AAAAA9999A)');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp`, isDateStr,
    'Date of formation/incorporation must be in YYYY-MM-DD format');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.StatusOrCompanyType`,
    (v) => ['1', '2', '14', '9'].includes(str(v)),
    'Status must be one of 1-Firm, 2-Local Authority, 14-AOP/BOI, 9-AJP');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.SubStatus`,
    (v) => ['4', '5', '8', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20', '21'].includes(str(v)),
    'Sub-status code is not a valid ITR-5 sub-status');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.Address.EmailAddress`,
    (v) => /^[.a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+([a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+)+$/.test(str(v)),
    'E-mail address is not in a valid format');
  chk(`${P}.PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec`,
    (v) => [11, 12, 13, 14, 16, 17, 18, 19, 20, 21].includes(num(v)),
    'Section of return filing must be one of 11/12/13/14/16/17/18/19/20/21');
  chk(`${P}.PartA_GEN1.FilingStatus.ResidentialStatus`,
    (v) => ['RES', 'NRI'].includes(str(v)), 'Residential status must be RES or NRI');
  chk(`${P}.PartA_GEN1.FilingStatus.ItrFilingDueDate`,
    (v) => ['2025-07-31', '2025-10-31', '2025-11-30'].includes(str(v)),
    'Due date must be one of 2025-07-31 / 2025-10-31 / 2025-11-30 (Rule A-48)');
  chk(`${P}.Verification.Declaration.AssesseeVerPAN`,
    (v) => /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/.test(str(v)),
    'PAN at Verification must be the individual PAN of the signatory (4th character "P")');
  chk(`${P}.Verification.Declaration.Capacity`,
    (v) => ['MP', 'DP', 'PA', 'PO', 'ME', 'LQ', 'RP', 'TR', 'EX', 'RA', 'AS', 'OA'].includes(str(v)),
    'Capacity at Verification must be one of MP/DP/PA/PO/ME/LQ/RP/TR/EX/RA/AS/OA');
  chk(`${P}.Verification.Declaration.Date`, isDateStr, 'Verification date must be in YYYY-MM-DD format');
  chk(`${P}.CreationInfo.JSONCreationDate`, isDateStr, 'JSON creation date must be in YYYY-MM-DD format', false);
}

/* ── Category A rules (Table 2, ITR-5_ValidationRules_AY2025-26_V1.0) ──────────
 * Only rules decidable from the JSON alone are encoded. rule = "A-<Sl.no.>". */

function categoryAChecks(j: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const g1 = `${P}.PartA_GEN1`;
  const fsP = `${g1}.FilingStatus`;
  const orgP = `${g1}.OrgFirmInfo`;
  const g2 = `${P}.PartA_GEN2`;

  const status = str(at(j, `${orgP}.StatusOrCompanyType`));
  const subStatus = str(at(j, `${orgP}.SubStatus`));
  const s44AA = str(at(j, `${g2}.LiableSec44AAflg`));
  const s44AB = str(at(j, `${g2}.LiableSec44ABflg`));
  const s92E = str(at(j, `${g2}.LiableSec92Eflg`));
  const bsPresent = hasData(at(j, `${P}.PARTA_BS`));
  const plPresent = hasData(at(j, `${P}.PARTA_PL`));

  const err = (rule: string, path: string, msg: string): void => { errors.push({ path, msg, rule }); };
  const warn = (rule: string, path: string, msg: string): void => { warnings.push({ path, msg, rule }); };

  // A-1 / A-2 / A-14: audit or books liability → BS and P&L cannot be blank
  if (s92E === 'Y' && (!bsPresent || !plPresent)) {
    err('A-1', `${P}.PARTA_BS`, 'Liable for audit u/s 92E — Part A Balance Sheet and Part A P&L cannot be blank');
  }
  if (s44AB === 'Y' && (!bsPresent || !plPresent)) {
    err('A-2', `${P}.PARTA_BS`, 'Liable for audit u/s 44AB — Part A Balance Sheet and Part A P&L cannot be blank');
  }
  if (s44AA === 'Y' && (!bsPresent || !plPresent)) {
    err('A-14', `${P}.PARTA_BS`, 'Liable to maintain accounts u/s 44AA — Part A Balance Sheet and Part A P&L must be filled');
  }
  // A-11: 44AA = No → "No books of account" section of P&L must be filled
  if (s44AA === 'N' && !hasData(at(j, `${P}.PARTA_PL.NoBooksOfAccPL`))) {
    err('A-11', `${P}.PARTA_PL.NoBooksOfAccPL`,
      'Accounts not maintained u/s 44AA — "No books of account" particulars of Balance Sheet and P&L must be filled');
  }
  // A-1 (92E details): audit report u/s 92E particulars
  if (s92E === 'Y' && isEmpty(at(j, `${g2}.AuditDetails92E.DateOfAudit`))) {
    err('A-1', `${g2}.AuditDetails92E`, 'Liable for audit u/s 92E — date of furnishing the audit report (Form 3CEB) is mandatory');
  }
  // A-3: valid mobile number
  {
    const mob = at(j, `${orgP}.Address.MobileNo`);
    if (!isEmpty(mob) && !/^[1-9][0-9]{9}$/.test(str(mob))) {
      err('A-3', `${orgP}.Address.MobileNo`, 'Mobile number must be a valid 10-digit number not starting with 0');
    }
  }
  // A-4: unlisted equity shares flag → details table
  if (str(at(j, `${fsP}.HeldUnlistedEqShrPrYrFlg`)) === 'Y'
    && arr(at(j, `${fsP}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`)).length === 0) {
    err('A-4', `${fsP}.HeldUnlistedEqShrPrYr`,
      '"Held unlisted equity shares" is Yes — details of the unlisted shares must be provided');
  }
  // A-5: capacity "RA" at verification → representative assessee details
  if (str(at(j, `${P}.Verification.Declaration.Capacity`)) === 'RA') {
    if (str(at(j, `${fsP}.AsseseeRepFlg`)) !== 'Y') {
      err('A-5', `${fsP}.AsseseeRepFlg`,
        'Verification capacity is "Representative assessee" — select Yes for "filed by representative assessee" in Part A General');
    }
    if (isEmpty(at(j, `${fsP}.AssesseeRep.RepName`))) {
      err('A-5', `${fsP}.AssesseeRep`, 'Representative assessee details (name, capacity, address, PAN) must be filled in Part A General');
    }
  }
  if (str(at(j, `${fsP}.AsseseeRepFlg`)) === 'Y' && isEmpty(at(j, `${fsP}.AssesseeRep.RepName`))) {
    err('A-5', `${fsP}.AssesseeRep`, '"Filed by representative assessee" is Yes — representative details must be filled');
  }
  // A-7 / A-8 / A-9: presumptive-only dropdown drives a2i/a2ii/a2iii
  const incDclrd = str(at(j, `${g2}.IncDclrdUs`));
  if (incDclrd === 'N' && isEmpty(at(j, `${g2}.TotalSalesExcOneCr`))) {
    err('A-7', `${g2}.TotalSalesExcOneCr`,
      'Not declaring income only u/s 44AD/44ADA/44AE/44B/44BB/44BBA — Sl. a2i (turnover between 1cr and 10cr?) cannot be left blank');
  }
  if (incDclrd === 'Y' && isEmpty(at(j, `${g2}.AgrOFAllAmtsRcvd`))) {
    err('A-8', `${g2}.AgrOFAllAmtsRcvd`,
      'Declaring income only on presumptive basis — Sl. a2ii (cash receipts within 5%?) cannot be left blank');
  }
  if (incDclrd === 'N' && str(at(j, `${g2}.TotalSalesExcOneCr`)) === 'Y'
    && isEmpty(at(j, `${g2}.AgrOFAllPayMade`))) {
    err('A-9', `${g2}.AgrOFAllPayMade`, 'Sl. a2iii (cash payments within 5%?) cannot be left blank');
  }
  // A-50 / A-51: a2ii or a2iii answered "No" → liable for audit u/s 44AB
  if (str(at(j, `${g2}.AgrOFAllAmtsRcvd`)) === 'N' && s44AB !== 'Y') {
    err('A-50', `${g2}.LiableSec44ABflg`, 'Sl. a2ii is "No" — assessee is liable to audit u/s 44AB; select Yes');
  }
  if (str(at(j, `${g2}.AgrOFAllPayMade`)) === 'N' && s44AB !== 'Y') {
    err('A-51', `${g2}.LiableSec44ABflg`, 'Sl. a2iii is "No" — assessee is liable to audit u/s 44AB; select Yes');
  }
  // A-10: audit date not after today
  {
    const d = str(at(j, `${g2}.AuditInfo.AuditDate`));
    if (isDateStr(d) && d > todayISO()) {
      err('A-10', `${g2}.AuditInfo.AuditDate`, 'Date of audit report cannot be later than today');
    }
  }
  // A-47 (+53): liable u/s 44AB → condition + auditor details
  if (s44AB === 'Y') {
    if (isEmpty(at(j, `${g2}.Cndnfor44AB`))) {
      err('A-47', `${g2}.Cndnfor44AB`, 'Liable for audit u/s 44AB — select the condition (bi/bii/biii) by which audit applies');
    }
    const ai = `${g2}.AuditInfo`;
    if (!hasData(at(j, ai))) {
      err('A-47', ai, 'Liable for audit u/s 44AB — auditor details (name, membership no., firm PAN, audit date) are mandatory');
    } else {
      for (const [k, lbl] of [
        ['AuditorName', 'Name of the auditor signing the report'],
        ['AuditorMemNo', 'Membership number of the auditor'],
        ['AudFrmPAN', 'PAN of the auditor firm / proprietorship'],
        ['AuditDate', 'Date of the audit report'],
      ] as const) {
        if (isEmpty(at(j, `${ai}.${k}`))) err('A-47', `${ai}.${k}`, `${lbl} is mandatory when liable for audit u/s 44AB`);
      }
    }
  }
  // A-12: nature of business is mandatory
  if (arr(at(j, `${g2}.NatOfBus.NatureOfBusiness`)).length === 0) {
    err('A-12', `${g2}.NatOfBus.NatureOfBusiness`, 'Disclosure of "Nature of business or profession" is mandatory in ITR-5');
  }
  // A-15..A-18: status ↔ sub-status
  if (status === '1') {
    if (!['5', '10'].includes(subStatus)) {
      err('A-15', `${orgP}.SubStatus`, 'Status Firm — sub-status must be Limited Liability Partnership (5) or Partnership Firm (10)');
    }
  } else if (status === '14') {
    if (!['4', '8', '11', '13', '15', '16', '17', '20', '21'].includes(subStatus)) {
      err('A-16', `${orgP}.SubStatus`, 'Status AOP/BOI — a valid AOP/BOI sub-status (4/8/11/13/15/16/17/20/21) must be selected');
    }
  } else if (status === '9') {
    if (!['12', '18', '19'].includes(subStatus)) {
      err('A-17', `${orgP}.SubStatus`, 'Status Artificial Juridical Person — sub-status must be Estate of deceased (12), Estate of insolvent (18) or Other AJP (19)');
    }
  } else if (status === '2') {
    if (subStatus !== '') {
      err('A-18', `${orgP}.SubStatus`, 'Status Local Authority — sub-status field must be left blank');
    }
  }
  // A-22 / A-13 / A-30: partner-member table driven rules
  {
    const members = arr(at(j, `${g2}.PartnerOrMemberInfo`));
    if (str(at(j, `${g2}.PvtDiscretioneryTrust.PvtDiscTrustShareFlg`)) === 'Y' && members.length > 0) {
      const sum = members.reduce<number>((acc, m) => acc + num(at(m, 'SharePercentage')), 0);
      if (Math.abs(sum - 100) > 0.01) {
        err('A-22', `${g2}.PartnerOrMemberInfo`, `Shares of members are determinate — "Percentage of share" must total 100 (currently ${sum})`);
      }
    }
    const partnerPans = members.map((m) => str(at(m, 'PAN'))).filter((p) => p !== '');
    const verPan = str(at(j, `${P}.Verification.Declaration.AssesseeVerPAN`));
    if (status === '1' && verPan !== '' && partnerPans.length > 0 && !partnerPans.includes(verPan)) {
      err('A-13', `${P}.Verification.Declaration.AssesseeVerPAN`,
        'PAN at Verification must match one of the PANs entered in "Partners / Members / Trust information" of Part A General (2)');
    }
    if (['5', '10'].includes(subStatus) && members.length === 0) {
      err('A-30', `${g2}.PartnerOrMemberInfo`, 'Sub-status LLP / Partnership Firm — partners/members details (Table A of Part A General 2) must be filled');
    }
    // Partner rows: schema-required members of each element
    members.forEach((m, i) => {
      for (const k of ['PartnerOrMemberName', 'Status']) {
        if (isEmpty(at(m, k))) {
          err('SCHEMA', `${g2}.PartnerOrMemberInfo.${i}.${k}`, `Partner/Member row ${i + 1}: ${humanise(k)} is mandatory`);
        }
      }
      if (isEmpty(at(m, 'PAN')) && isEmpty(at(m, 'AadhaarCardNo'))) {
        warn('A-13', `${g2}.PartnerOrMemberInfo.${i}.PAN`,
          `Partner/Member row ${i + 1}: PAN or Aadhaar of the partner/member should be provided`);
      }
    });
  }
  // A-31: sub-status "Trust other than ITR-7 trust" → Table F Sl. 1 & 2
  if (subStatus === '13') {
    const t = `${g2}.PvtDiscretioneryTrust`;
    if (isEmpty(at(j, `${t}.PvtDiscTrustShareFlg`)) || isEmpty(at(j, `${t}.PvtDiscTrustBusIncFlg`))) {
      err('A-31', t, 'Sub-status Trust (other than ITR-7) — Sl. 1 and Sl. 2 of Table F (private discretionary trust questions) must be answered');
    }
  }
  // A-26: Schedule 115AD needs FII/FPI = Yes
  if (hasData(at(j, `${P}.Schedule115AD`)) && str(at(j, `${fsP}.FiiFpiFlag`)) !== 'Y') {
    err('A-26', `${fsP}.FiiFpiFlag`, 'Schedule 115AD is filled — "Whether you are FII / FPI?" must be Yes in Part A General');
  }
  // A-27: filed in response to notice → notice number (DIN) and date mandatory
  {
    const sec = num(at(j, `${fsP}.ReturnFileSec.IncomeTaxSec`));
    if ([13, 14, 16, 18, 19, 20].includes(sec)) {
      if (isEmpty(at(j, `${fsP}.ReturnFileSec.NoticeNo`)) || isEmpty(at(j, `${fsP}.ReturnFileSec.NoticeDate`))) {
        err('A-27', `${fsP}.ReturnFileSec.NoticeNo`,
          'Return filed in response to a notice/order — unique number / DIN and date of the notice are mandatory');
      }
    }
    // Revised return: original acknowledgement details (defect if absent)
    if (sec === 17 && (isEmpty(at(j, `${fsP}.ReceiptNo`)) || isEmpty(at(j, `${fsP}.OrigRetFiledDate`)))) {
      warn('A-27', `${fsP}.ReceiptNo`, 'Revised return u/s 139(5) — receipt number and date of the original return should be provided');
    }
  }
  // A-29: commencement date within [incorporation, 2025-03-31]
  {
    const doi = str(at(j, `${orgP}.DateOFFormOrIncorp`));
    const doc = str(at(j, `${orgP}.DateofBusCommencement`));
    if (isDateStr(doc)) {
      if (isDateStr(doi) && doc < doi) {
        err('A-29', `${orgP}.DateofBusCommencement`, 'Date of commencement of business cannot be before the date of incorporation');
      }
      if (doc > '2025-03-31') {
        err('A-29', `${orgP}.DateofBusCommencement`, 'Date of commencement of business cannot be after 31-03-2025 (end of FY 2024-25)');
      }
    }
  }
  // A-35/A-54: opting 115BAE (either question) → Form 10IFA date + ack number
  {
    const optYes = str(at(j, `${fsP}.OptingTaxation115BAEYes`));
    const optNo = str(at(j, `${fsP}.OptingTaxation115BAENo`));
    if ((optYes === 'Y' || optNo === 'Y')
      && (isEmpty(at(j, `${fsP}.Form10IFADate`)) || isEmpty(at(j, `${fsP}.Form10IFAAckNo`)))) {
      err('A-35', `${fsP}.Form10IFADate`, 'Opting for 115BAE — "Date of filing of Form 10IFA" and its acknowledgement number are mandatory');
    }
    // A-37 / A-52: 115BAE only for entities incorporated on/after 01-04-2023
    const doi = str(at(j, `${orgP}.DateOFFormOrIncorp`));
    if (optYes === 'Y' && isDateStr(doi) && doi < '2023-04-01') {
      err('A-37', `${orgP}.DateOFFormOrIncorp`, 'To opt for 115BAE, date of formation/incorporation must be on or after 01-04-2023');
    }
    const doc = str(at(j, `${orgP}.DateofBusCommencement`));
    if (optYes === 'Y' && isDateStr(doc) && doc < '2023-04-01') {
      err('A-52', `${orgP}.DateofBusCommencement`, 'To claim 115BAE, date of commencement of business must be on or after 01-04-2023');
    }
  }
  // A-46: MSME Yes → registration number
  if (str(at(j, `${fsP}.ifMSME`)) === 'Y' && isEmpty(at(j, `${fsP}.RegNumMSMEDAct2006`))) {
    err('A-46', `${fsP}.RegNumMSMEDAct2006`, 'Recognised as MSME — registration number under MSMED Act 2006 is mandatory');
  }
  // DPIIT / Inter-Ministerial numbers (companions of A-806 gating)
  if (str(at(j, `${fsP}.StartUpDPIITFlag`)) === 'Y' && isEmpty(at(j, `${fsP}.RecgnNumAllottedByDPIIT`))) {
    warn('A-806', `${fsP}.RecgnNumAllottedByDPIIT`, 'Recognised as start-up by DPIIT — recognition number should be provided');
  }
  if (str(at(j, `${fsP}.InterMinisterialCertFlag`)) === 'Y' && isEmpty(at(j, `${fsP}.CertificationNumber`))) {
    warn('A-806', `${fsP}.CertificationNumber`, 'Certified by Inter-Ministerial Board — certification number should be provided');
  }

  /* — Part A P&L presumptive blocks — */
  const pl = `${P}.PARTA_PL`;
  const ad = `${pl}.PersumptiveInc44AD`;
  const ada = `${pl}.PersumptiveInc44ADA`;
  const adTot = num(at(j, `${ad}.TotPersumptiveInc44AD`));
  const adGross = num(at(j, `${ad}.GrsTrnOverOrReceipt`));
  const adaGross = num(at(j, `${ada}.GrsReceipt`));
  const adaTot = num(at(j, `${ada}.TotPersumptiveInc44ADA`));
  // A-119: 44AD total = 6% part + 8% part
  {
    const p6 = num(at(j, `${ad}.PersumptiveInc44AD6Per`));
    const p8 = num(at(j, `${ad}.PersumptiveInc44AD8Per`));
    if (adTot > 0 && Math.abs(adTot - (p6 + p8)) > 1) {
      err('A-119', `${ad}.TotPersumptiveInc44AD`, 'Presumptive income u/s 44AD (Sl. 62ii) must equal 62iia + 62iib');
    }
  }
  // A-120 / A-121: minimum 6% / 8% presumptive income
  {
    const bank = num(at(j, `${ad}.GrsTrnOverBank`));
    const cashOth = num(at(j, `${ad}.GrsTotalTrnOverInCash`)) + num(at(j, `${ad}.GrsTrnOverAnyOthMode`));
    const p6 = num(at(j, `${ad}.PersumptiveInc44AD6Per`));
    const p8 = num(at(j, `${ad}.PersumptiveInc44AD8Per`));
    if (bank > 0 && p6 + 1 < Math.floor(bank * 0.06)) {
      err('A-120', `${ad}.PersumptiveInc44AD6Per`, 'Income u/s 44AD on digital/bank receipts (62iia) cannot be less than 6% of 62ia');
    }
    if (cashOth > 0 && p8 + 1 < Math.floor(cashOth * 0.08)) {
      err('A-121', `${ad}.PersumptiveInc44AD8Per`, 'Income u/s 44AD on cash/other receipts (62iib) cannot be less than 8% of 62ib + 62ic');
    }
  }
  // A-124: 44ADA income at least 50% of gross receipts
  if (adaGross > 0 && adaTot + 1 < Math.floor(adaGross * 0.5)) {
    err('A-124', `${ada}.TotPersumptiveInc44ADA`, 'Income u/s 44ADA (63ii) cannot be less than 50% of gross receipts (63i)');
  }
  // A-142 / A-230: 44AD/44ADA only for resident partnership firms
  if (adTot > 0 || adaTot > 0 || adGross > 0 || adaGross > 0) {
    if (status !== '' && status !== '1') {
      err('A-142', `${orgP}.StatusOrCompanyType`, 'Presumptive income u/s 44AD/44ADA can be declared only by a partnership firm (incl. LLP)');
    }
    if (str(at(j, `${fsP}.ResidentialStatus`)) === 'NRI') {
      err('A-230', `${fsP}.ResidentialStatus`, 'Presumptive income u/s 44AD/44ADA can be declared only by a RESIDENT firm');
    }
  }
  // A-170 / A-171: turnover thresholds force audit u/s 44AB
  if (adaGross > 7500000 && s44AB !== 'Y') {
    err('A-170', `${g2}.LiableSec44ABflg`, 'Gross professional receipts u/s 44ADA exceed Rs. 75 lakh — tax audit u/s 44AB is mandatory');
  }
  if (adGross > 30000000 && s44AB !== 'Y') {
    err('A-171', `${g2}.LiableSec44ABflg`, 'Gross turnover u/s 44AD exceeds Rs. 3 crore — tax audit u/s 44AB is mandatory');
  }

  /* — Schedule GST (A-548 / A-549), per-row check — */
  arr(at(j, `${P}.ScheduleGST.TurnoverGrsRcptForGSTIN`)).forEach((row, i) => {
    const gstin = str(at(row, 'GSTINNo'));
    const amt = at(row, 'AmtTurnGrossRcptGSTIN');
    const rowPath = `${P}.ScheduleGST.TurnoverGrsRcptForGSTIN.${i}`;
    if (gstin !== '' && isEmpty(amt)) {
      err('A-548', `${rowPath}.AmtTurnGrossRcptGSTIN`, `Schedule GST row ${i + 1}: GSTIN is filled — annual value of outward supplies is mandatory`);
    }
    if (gstin === '' && !isEmpty(amt)) {
      err('A-549', `${rowPath}.GSTINNo`, `Schedule GST row ${i + 1}: outward supplies value is filled — GSTIN is mandatory`);
    }
  });

  /* — Chapter VI-A claims must be backed by their schedules — */
  const via = `${P}.ScheduleVIA.DeductUndChapVIA`;
  const viaClaim = (k: string): number => num(at(j, `${via}.${k}`));
  const needSched = (rule: string, amount: number, schedPath: string, msg: string): void => {
    if (amount > 0 && !hasData(at(j, schedPath))) err(rule, schedPath, msg);
  };
  needSched('A-771', viaClaim('Section80G'), `${P}.Schedule80G`, '80G claimed in Schedule VI-A — donation details must be provided in Schedule 80G');
  needSched('A-776', viaClaim('Section80GGA'), `${P}.Schedule80GGA`, '80GGA claimed in Schedule VI-A — details must be provided in Schedule 80GGA');
  needSched('A-800', viaClaim('Section80GGC'), `${P}.Schedule80GGC`, '80GGC claimed in Schedule VI-A — contribution details must be provided in Schedule 80GGC');
  needSched('A-740', viaClaim('Section80IA'), `${P}.Schedule80_IA`, 'Deduction u/s 80-IA claimed but Schedule 80-IA is not filled');
  needSched('A-743', viaClaim('Section80IB'), `${P}.Schedule80_IB`, 'Deduction u/s 80-IB claimed but Schedule 80-IB is not filled');
  needSched('A-797', viaClaim('Section80P'), `${P}.Schedule80P`, 'Deduction u/s 80P claimed but Schedule 80P is not filled');
  needSched('A-812', viaClaim('Section80IAC'), `${P}.Schedule80IAC`, 'Deduction u/s 80-IAC claimed but Schedule 80-IAC is not filled');
  needSched('A-814', viaClaim('Section80LA') + viaClaim('Section80LA_1A'), `${P}.Schedule80LA`,
    'Deduction u/s 80LA(1)/80LA(1A) claimed but Schedule 80LA is not filled');
  // A-791: 80LA(1) and 80LA(1A) are mutually exclusive
  if (viaClaim('Section80LA') > 0 && viaClaim('Section80LA_1A') > 0) {
    err('A-791', via, 'Deductions u/s 80LA(1) and 80LA(1A) cannot be claimed together');
  }
  // A-806: Schedule 80-IAC only for DPIIT-recognised start-ups
  if (hasData(at(j, `${P}.Schedule80IAC`)) && str(at(j, `${fsP}.StartUpDPIITFlag`)) !== 'Y') {
    err('A-806', `${P}.Schedule80IAC`, 'Schedule 80-IAC can be filled only when "recognised as start-up by DPIIT" is Yes in Part A General');
  }
  // A-757: 80-IAC can be claimed only by an LLP
  if (viaClaim('Section80IAC') > 0 && !(status === '1' && subStatus === '5')) {
    err('A-757', via, 'Deduction u/s 80-IAC can be claimed only by an LLP');
  }
  // A-792 / A-793: 80LA(1A) needs IFSC-convertible-forex Yes; 80LA(1) needs No
  {
    const fx = str(at(j, `${fsP}.ForeignExchangeFlag`));
    if (viaClaim('Section80LA_1A') > 0 && fx !== 'Y') {
      err('A-792', `${fsP}.ForeignExchangeFlag`, '80LA(1A) can be claimed only when the IFSC-unit/convertible-forex question is Yes in Part A General');
    }
    if (viaClaim('Section80LA') > 0 && fx === 'Y') {
      err('A-793', `${fsP}.ForeignExchangeFlag`, '80LA(1) can be claimed only when the IFSC-unit/convertible-forex question is No in Part A General');
    }
  }
  // A-790: 80GGC not allowed for Local Authority and AJP
  if (viaClaim('Section80GGC') > 0 && (status === '2' || status === '9')) {
    err('A-790', via, 'Deduction u/s 80GGC is not allowed for status Local Authority or Artificial Juridical Person');
  }

  /* — Part B-TI driven requirements — */
  const bti = `${P}.PartB-TI`;
  // A-867: deduction u/s 10AA claimed → Schedule 10AA filled
  if (num(at(j, `${bti}.DeductionsUnder10Aor10AA`)) > 0 && !hasData(at(j, `${P}.Schedule10AA`))) {
    err('A-867', `${P}.Schedule10AA`, 'Deduction u/s 10AA claimed in Part B-TI — Schedule 10AA must be filled');
  }
  // A-870 / A-871: VI-A totals in Part B-TI must be backed by Schedule VI-A
  if (num(at(j, `${bti}.DeductionsUndSchVIADtl.PartBchapterVIA`)) > 0 && !hasData(at(j, `${P}.ScheduleVIA`))) {
    err('A-870', `${P}.ScheduleVIA`, 'Part B deductions of Chapter VI-A claimed in Part B-TI — Schedule VI-A (Part B) must be filled');
  }
  if (num(at(j, `${bti}.DeductionsUndSchVIADtl.PartCchapterVIA`)) > 0 && !hasData(at(j, `${P}.ScheduleVIA`))) {
    err('A-871', `${P}.ScheduleVIA`, 'Part C deductions of Chapter VI-A claimed in Part B-TI — Schedule VI-A (Part C) must be filled');
  }
  // A-80: option u/s 92CE(2A) in Part A-OI → Schedule TPSA must be filled
  if (str(at(j, `${P}.PARTA_OI.ScheduleTPSAFlg`)) === 'Y' && !hasData(at(j, `${P}.ScheduleTPSA`))) {
    err('A-80', `${P}.ScheduleTPSA`, 'Option under section 92CE(2A) selected in Part A-OI — Schedule TPSA must be filled');
  }

  /* — Refund / bank details — */
  {
    const refund = num(at(j, `${P}.PartB_TTI.Refund.RefundDue`));
    const banks = arr(at(j, `${P}.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails`));
    if (refund > 0 && banks.length === 0) {
      warn('BANK', `${P}.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails`,
        'Refund is claimed but no bank account is provided — at least one Indian bank account (IFSC, account number) is needed for the refund');
    }
    // Bank rows, when present, need all schema-required member fields
    banks.forEach((b, i) => {
      for (const k of ['IFSCCode', 'BankName', 'BankAccountNo', 'AccountType', 'UseForRefund']) {
        if (isEmpty(at(b, k))) {
          err('SCHEMA', `${P}.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails.${i}.${k}`,
            `Bank account row ${i + 1}: ${humanise(k)} is mandatory`);
        }
      }
    });
  }
}

/* ── Category A rules, part 2 ──────────────────────────────────────────────────
 * New-tax-regime / 115BAD / 115BAE gating, presumptive-business disclosure and
 * the row-level ("if the table is used, these cells are mandatory") checks that
 * the schema states on array *items* — those never appear in the required tree
 * because the arrays themselves are optional. rule = "A-<Sl.no.>". */

/** Sub-status codes (schema description of PartA_GEN1.OrgFirmInfo.SubStatus). */
const SUBSTATUS_COOP = ['4', '15', '16', '17'];          // co-op societies / co-op banks
const SUBSTATUS_NEEDS_115BAC_METHOD = ['8', '11', '12', '13', '18', '19', '20', '21'];

function categoryAChecks2(j: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const err = (rule: string, path: string, msg: string): void => { errors.push({ path, msg, rule }); };
  const warn = (rule: string, path: string, msg: string): void => { warnings.push({ path, msg, rule }); };
  const g1 = `${P}.PartA_GEN1`;
  const fsP = `${g1}.FilingStatus`;
  const orgP = `${g1}.OrgFirmInfo`;
  const g2 = `${P}.PartA_GEN2`;
  const rf = `${fsP}.ReturnFileSec`;
  const status = str(at(j, `${orgP}.StatusOrCompanyType`));
  const subStatus = str(at(j, `${orgP}.SubStatus`));

  /** Every element of an optional array must carry the schema-required cells. */
  const rows = (
    rule: string, arrPath: string, keys: readonly string[], rowLabel: string,
  ): unknown[] => {
    const list = arr(at(j, arrPath));
    list.forEach((row, i) => {
      for (const k of keys) {
        if (isEmpty(at(row, k))) {
          err(rule, `${arrPath}.${i}.${k}`, `${rowLabel} row ${i + 1}: ${humanise(k)} is mandatory`);
        }
      }
    });
    return list;
  };

  /* ── A19(d)(i): method of opting out of the new tax regime u/s 115BAC ─────── */
  const method = str(at(j, `${rf}.OptOutNewTaxRegime_Method`));
  const setA = str(at(j, `${rf}.OptOutNewTaxRegime_Form10IEA_AY24_25`)); // Set A, Sl. 2
  const setB = str(at(j, `${rf}.SetOptOutNewTaxReg`));                   // Set B
  const a2a = str(at(j, `${rf}.Yes_ContOptOutNewTaxReg`));
  const a2b = str(at(j, `${rf}.No_OptOutNewTaxReg`));
  const a2c = str(at(j, `${rf}.NA_OptOutNewTaxReg`));
  const f10ieaDate = str(at(j, `${rf}.Form10IEADate`));
  const f10ieaAck = at(j, `${rf}.Form10IEAAckNo`);

  if (method === 'BY10IEA' && setA === '') {
    err('A-59', `${rf}.OptOutNewTaxRegime_Form10IEA_AY24_25`,
      'Opting out of the new tax regime "by filing Form 10IEA" — Set A of A19(d)(i) must be answered');
  }
  if (method === 'OPTINRETURN' && setB === '') {
    err('A-60', `${rf}.SetOptOutNewTaxReg`,
      'Opting out "by exercising the option in the return only" — Set B of A19(d)(i) must be answered');
  }
  if (setA !== '' && setB !== '') {
    err('A-69', `${rf}.SetOptOutNewTaxReg`,
      'Only one of Set A or Set B of A19(d)(i) can be filled for the new tax regime u/s 115BAC');
  }
  if (setA === 'Y' && a2a === '') {
    err('A-62', `${rf}.Yes_ContOptOutNewTaxReg`, '"Yes" selected at A19(d)(i) Sl. 2 (Set A) — Sl. 2a must be answered');
  }
  if (setA === 'N' && a2b === '') {
    err('A-63', `${rf}.No_OptOutNewTaxReg`, '"No" selected at A19(d)(i) Sl. 2 (Set A) — Sl. 2b must be answered');
  }
  if (setA === 'NA' && a2c === '') {
    err('A-64', `${rf}.NA_OptOutNewTaxReg`, '"NA" selected at A19(d)(i) Sl. 2 (Set A) — Sl. 2c must be answered');
  }
  if (setA !== '') {
    const wrong = [
      setA !== 'Y' && a2a !== '' ? '2a' : '',
      setA !== 'N' && a2b !== '' ? '2b' : '',
      setA !== 'NA' && a2c !== '' ? '2c' : '',
    ].filter(Boolean);
    if (wrong.length) {
      err('A-65', rf, `Only the question matching the option chosen at A19(d)(i) Sl. 2 should be answered — ${wrong.join(', ')} should be left blank`);
    }
  }
  if (setA === 'Y' && (isEmpty(at(j, `${rf}.Form10IEADate_AY24_25`)) || isEmpty(at(j, `${rf}.Form10IEAAckNo_AY24_25`)))) {
    err('A-55', `${rf}.Form10IEADate_AY24_25`,
      'Form 10IEA was filed for AY 2024-25 — its filing date and acknowledgement number are mandatory');
  }
  if ((a2b === 'Y' || a2c === 'Y') && (f10ieaDate === '' || isEmpty(f10ieaAck))) {
    err('A-41', `${rf}.Form10IEADate`,
      'Opting out of the new tax regime for AY 2025-26 — date of filing of Form 10IEA and its acknowledgement number are mandatory');
  }
  if (a2a === 'N' && a2b === 'N' && (f10ieaDate !== '' || !isEmpty(f10ieaAck))) {
    err('A-45', `${rf}.Form10IEADate`,
      'Form 10IEA details cannot be entered when 2a and 2b of A19(d)(i) are both answered "No"');
  }
  if (isDateStr(f10ieaDate) && (f10ieaDate < '2025-04-01' || f10ieaDate > todayISO())) {
    err('A-42', `${rf}.Form10IEADate`,
      'Date of filing of Form 10IEA for AY 2025-26 must be on/after 01-04-2025 and not later than today');
  }
  if (method === 'OPTINRETURN' && num(at(j, `${P}.PartB-TI.ProfBusGain.TotProfBusGain`)) !== 0) {
    err('A-61', `${rf}.OptOutNewTaxRegime_Method`,
      'Business income is declared — opting out of the new tax regime cannot be done "by exercising the option in the return only"; Form 10IEA is required');
  }
  if (method === '' && SUBSTATUS_NEEDS_115BAC_METHOD.includes(subStatus)) {
    err('A-40', `${rf}.OptOutNewTaxRegime_Method`,
      'For this sub-status, A19(d)(i) "Method of opting out of the new tax regime u/s 115BAC" cannot be left blank');
  }
  if (method !== '' && (status === '1' || status === '2' || SUBSTATUS_COOP.includes(subStatus))) {
    warn('A-44', `${rf}.OptOutNewTaxRegime_Method`,
      'A19(d)(i) (option u/s 115BAC(6)) is not applicable to a Firm/LLP, Local Authority or Co-operative society — the field should be left blank');
  }

  /* ── 115BAD (co-operative societies) and 115BAE (new manufacturing co-ops) ── */
  const optBAD = num(at(j, `${rf}.OptingNewTaxRegime`)) === 1;      // 1 = opting in now
  const earlierBAD = str(at(j, `${rf}.NewTaxRegime`)) === 'Y';      // opted in an earlier year
  const optBAEYes = str(at(j, `${fsP}.OptingTaxation115BAEYes`)) === 'Y';
  const optBAENo = str(at(j, `${fsP}.OptingTaxation115BAENo`)) === 'Y';
  const f10ifMissing = isEmpty(at(j, `${rf}.Form10IFDate`)) || isEmpty(at(j, `${rf}.Form10IFAckNo`));
  if (optBAD && f10ifMissing) {
    err('A-23', `${rf}.Form10IFDate`,
      '"Opting in now" for the new tax regime u/s 115BAD — date of filing of Form 10IF and its acknowledgement number are mandatory');
  }
  if (earlierBAD && f10ifMissing) {
    err('A-24', `${rf}.Form10IFDate`,
      'New tax regime u/s 115BAD was opted in an earlier year — date of filing of Form 10IF and its acknowledgement number are mandatory');
  }
  if ((optBAD || earlierBAD) && (optBAEYes || optBAENo)) {
    err('A-39', `${fsP}.OptingTaxation115BAEYes`,
      'The new tax regimes u/s 115BAD and u/s 115BAE cannot both be opted for at the same time');
  }
  const newRegimeOpted = optBAD || earlierBAD || optBAEYes;
  if (newRegimeOpted) {
    if (!(status === '14' && SUBSTATUS_COOP.includes(subStatus))) {
      err('A-20', `${orgP}.SubStatus`,
        'Section 115BAD / 115BAE can be opted for only by a resident co-operative society (AOP/BOI with a co-operative sub-status)');
    }
    if (str(at(j, `${fsP}.ResidentialStatus`)) === 'NRI') {
      err('A-20', `${fsP}.ResidentialStatus`, 'Section 115BAD / 115BAE can be opted for only by a RESIDENT co-operative society');
    }
    const via = `${P}.ScheduleVIA.DeductUndChapVIA`;
    const partC = num(at(j, `${via}.TotPartCchapterVIA`))
      - num(at(j, `${via}.Section80JJAA`)) - num(at(j, `${via}.Section80LA_1A`));
    if (partC > 0) {
      err('A-19', `${via}.TotPartCchapterVIA`,
        'Under 115BAD / 115BAE only 80JJAA and 80LA(1A) survive — other Part C Chapter VI-A deductions cannot be claimed');
    }
    if (num(at(j, `${P}.PartB-TI.DeductionsUnder10Aor10AA`)) > 0) {
      err('A-19', `${P}.PartB-TI.DeductionsUnder10Aor10AA`, 'Deduction u/s 10AA cannot be claimed when 115BAD / 115BAE is opted for');
    }
    if (num(at(j, `${via}.Section80G`)) > 0) {
      err('A-819', `${via}.Section80G`, 'Deduction u/s 80G cannot be claimed when the new tax regime (115BAC / 115BAD / 115BAE) is opted for');
    }
    if (num(at(j, `${via}.Section80GGC`)) > 0) {
      warn('A-798', `${via}.Section80GGC`, 'Schedule 80GGC is not required when the new tax regime is opted for — the deduction will not be allowed');
    }
  }

  /* ── Presumptive business/profession: names and business codes ─────────────── */
  const pl = `${P}.PARTA_PL`;
  const ad44 = num(at(j, `${pl}.PersumptiveInc44AD.GrsTrnOverOrReceipt`)) + num(at(j, `${pl}.PersumptiveInc44AD.TotPersumptiveInc44AD`));
  const ada44 = num(at(j, `${pl}.PersumptiveInc44ADA.GrsReceipt`)) + num(at(j, `${pl}.PersumptiveInc44ADA.TotPersumptiveInc44ADA`));
  const ae44 = num(at(j, `${pl}.TotalPrsumptvIncGCUs44E`));
  if (ad44 > 0 && arr(at(j, `${pl}.NatOfBus44AD`)).length === 0) {
    err('A-126', `${pl}.NatOfBus44AD`, 'Income declared u/s 44AD — name of business and the 44AD business code (Sl. 62) must be filled');
  }
  if (ada44 > 0 && arr(at(j, `${pl}.NatOfBus44ADA`)).length === 0) {
    err('A-128', `${pl}.NatOfBus44ADA`, 'Income declared u/s 44ADA — name of profession and the 44ADA code (Sl. 63) must be filled');
  }
  if (ae44 > 0 && arr(at(j, `${pl}.NatOfBus44AE`)).length === 0) {
    err('A-130', `${pl}.NatOfBus44AE`, 'Income declared u/s 44AE — name of business and the 44AE code (Sl. 64) must be filled');
  }
  rows('A-125', `${pl}.NatOfBus44AD`, ['NameOfBusiness', 'CodeAD'], 'Nature of business u/s 44AD');
  rows('A-127', `${pl}.NatOfBus44ADA`, ['NameOfBusiness', 'CodeADA'], 'Nature of profession u/s 44ADA');
  rows('A-129', `${pl}.NatOfBus44AE`, ['NameOfBusiness', 'CodeAE'], 'Nature of business u/s 44AE');

  /* ── Schedule 44AE goods-carriage table ────────────────────────────────────── */
  {
    const gc = `${pl}.GoodsDtlsUs44AE`;
    const vehicles = rows('A-135', gc,
      ['RegNumberGoodsCarriage', 'OwnedLeasedHiredFlag', 'TonnageCapacity', 'HoldingPeriod', 'PresumptiveIncome'],
      'Goods carriage (44AE)');
    if (ae44 > 0 && vehicles.length === 0) {
      err('A-135', gc, 'Presumptive income u/s 44AE (Sl. 64ii) is declared — the goods-carriage table at Sl. 64(i) must be filled');
    }
    let months = 0;
    const regs = new Set<string>();
    vehicles.forEach((v, i) => {
      const mth = num(at(v, 'HoldingPeriod'));
      const ton = num(at(v, 'TonnageCapacity'));
      const inc = num(at(v, 'PresumptiveIncome'));
      months += mth;
      const reg = str(at(v, 'RegNumberGoodsCarriage')).toUpperCase();
      if (reg !== '') {
        if (regs.has(reg)) {
          err('A-162', `${gc}.${i}.RegNumberGoodsCarriage`, `Goods carriage row ${i + 1}: registration number "${reg}" is repeated — it must be unique`);
        }
        regs.add(reg);
      }
      if (ton > 100) {
        err('A-139', `${gc}.${i}.TonnageCapacity`, `Goods carriage row ${i + 1}: tonnage capacity cannot exceed 100 MT`);
      }
      const floorInc = ton > 12 ? 1000 * ton * mth : 7500 * mth;
      if (mth > 0 && inc + 1 < floorInc) {
        err('A-140', `${gc}.${i}.PresumptiveIncome`,
          `Goods carriage row ${i + 1}: income u/s 44AE must be at least Rs. ${floorInc} (Rs. 7,500 p.m. up to 12 MT, else Rs. 1,000 p.m. per tonne)`);
      }
    });
    if (months > 120) {
      err('A-137', gc, 'Total of the "number of months" column in the 44AE table cannot exceed 120');
    }
    const sumInc = vehicles.reduce<number>((a, v) => a + num(at(v, 'PresumptiveIncome')), 0);
    if (vehicles.length > 0 && Math.abs(sumInc - ae44) > 1) {
      err('A-136', `${pl}.TotalPrsumptvIncGCUs44E`,
        'Total presumptive income from goods carriage (Sl. 64ii) must equal the total of column (5) of the 44AE table');
    }
    if (num(at(j, `${pl}.SalRemrtnToPartnerFirm`)) > 0 && ae44 <= 0) {
      err('A-152', `${pl}.SalRemrtnToPartnerFirm`,
        'Salary / remuneration to partners (Sl. 64iii) cannot be claimed when presumptive income u/s 44AE (Sl. 64ii) is nil');
    }
  }
  // A-227: presumptive income declared → Balance Sheet particulars (regular or "no accounts") required
  if ((ad44 > 0 || ada44 > 0 || ae44 > 0)
    && !hasData(at(j, `${P}.PARTA_BS.FundSrc`)) && !hasData(at(j, `${P}.PARTA_BS.NoBooksOfAccBS`))) {
    err('A-227', `${P}.PARTA_BS`,
      'Income declared u/s 44AD / 44ADA / 44AE — Balance Sheet particulars under "Regular books of account" or under "No accounts" must be filled');
  }

  /* ── Bad debts (Sl. 48 of P&L) ─────────────────────────────────────────────── */
  rows('A-161', `${pl}.DebitsToPL.DebitPlAcnt.BadDebtDtls.BadDebtAmtDtls`, ['PAN', 'Amount'], 'Bad debts (PAN available)');
  rows('A-166', `${pl}.DebitsToPL.DebitPlAcnt.BadDebtDtls.OthersPANNotAvlblDtl`,
    ['Name', 'FlatDoorBlockNumber', 'AreaLocality', 'TownCityDistrict', 'StateCode', 'CountryCode', 'Amount'],
    'Bad debts (PAN not available)');

  /* ── Part A General tables driven by their own flags ───────────────────────── */
  if (str(at(j, `${fsP}.PartnerInFirmFlg`)) === 'Y'
    && arr(at(j, `${fsP}.PartnerInFirm.PartnerInFirmDtls`)).length === 0) {
    err('A-4', `${fsP}.PartnerInFirm.PartnerInFirmDtls`,
      '"Partner in a firm" is Yes — name and PAN of every firm must be provided in Part A General');
  }
  rows('A-4', `${fsP}.PartnerInFirm.PartnerInFirmDtls`, ['NameOfFirm', 'PAN'], 'Partner in firm');
  rows('A-4', `${fsP}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`,
    ['NameOfCompany', 'CompanyType', 'OpngBalNumberOfShares', 'OpngBalCostOfAcquisition',
      'ClsngBalNumberOfShares', 'ClsngBalCostOfAcquisition'], 'Unlisted equity shares');
  if (str(at(j, `${g2}.PrevYrMemPartChange`)) === 'Y'
    && arr(at(j, `${g2}.PrevYrMemPart.PrevYrMemPartDtls`)).length === 0) {
    err('A-30', `${g2}.PrevYrMemPart.PrevYrMemPartDtls`,
      'Partners / members changed during the previous year — details of admission / retirement must be provided');
  }
  rows('A-30', `${g2}.PrevYrMemPart.PrevYrMemPartDtls`,
    ['PartnerName', 'AdmRet', 'AdmRetDate', 'SharePercentage', 'PAN', 'RemunerationpaidAmt'], 'Partner admitted / retired');
  rows('A-12', `${g2}.NatOfBus.NatureOfBusiness`, ['Code'], 'Nature of business');
  rows('A-47', `${g2}.AuditDetails`, ['AuditedSection', 'AuditFlag'], 'Audit u/s (other than 44AB)');
  rows('A-47', `${g2}.AuditReportDetails`, ['AuditReportAct', 'AuditReportSection', 'OtherITActFlag'], 'Audit report');

  /* ── Schedule HP ───────────────────────────────────────────────────────────── */
  rows('A-187', `${P}.ScheduleHP.PropertyDetails`,
    ['HPSNo', 'AddressDetailWithZipCode', 'PropertyOwner', 'PropCoOwnedFlg', 'ifLetOut'], 'House property');

  /* ── Schedule EI: agricultural income above Rs. 5 lakh needs land details ──── */
  {
    const agri = num(at(j, `${P}.ScheduleEI.NetAgriIncOrOthrIncRule7`));
    const land = `${P}.ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls`;
    if (agri > 500000 && arr(at(j, land)).length === 0) {
      err('A-569', land, 'Net agricultural income exceeds Rs. 5,00,000 — the details of agricultural land (Sl. 2vi of Schedule EI) must be provided');
    }
    rows('A-569', land, ['NameOfDistrict', 'PinCode', 'MeasurementOfLand', 'AgriLandOwnedFlag', 'AgriLandIrrigatedFlag'], 'Agricultural land');
  }

  /* ── Schedules IT / TDS 2 / TDS 3 / TCS: row-level mandatory cells ─────────── */
  rows('A-844', `${P}.ScheduleIT.TaxPayment`, ['BSRCode', 'DateDep', 'SrlNoOfChaln', 'Amt'], 'Advance / self-assessment tax');
  {
    const t2 = `${P}.ScheduleTDS2.TDSOthThanSalaryDtls`;
    const list2 = rows('A-643', t2, ['TDSCreditName', 'TDSSection', 'TANOfDeductor'], 'TDS (other than salary)');
    list2.forEach((r, i) => {
      if (str(at(r, 'TDSCreditName')) === 'O'
        && isEmpty(at(r, 'PANofOtherPerson')) && isEmpty(at(r, 'AadhaarOfOtherPerson'))) {
        err('A-633', `${t2}.${i}.PANofOtherPerson`, `Schedule TDS-2 row ${i + 1}: TDS credit relates to another person — that person's PAN / Aadhaar is mandatory`);
      }
      if (num(at(r, 'BroughtFwdTDSAmt')) > 0 && isEmpty(at(r, 'DeductedYr'))) {
        err('A-625', `${t2}.${i}.DeductedYr`, `Schedule TDS-2 row ${i + 1}: brought-forward TDS is claimed — the year of deduction must be selected`);
      }
    });
    const t3 = `${P}.ScheduleTDS3.TDS3onOthThanSalDtls`;
    const list3 = rows('A-643', t3, ['TDSCreditName', 'TDSSection', 'PANOfBuyerTenant'], 'TDS (Form 16C / 26QB)');
    list3.forEach((r, i) => {
      if (str(at(r, 'TDSCreditName')) === 'O'
        && isEmpty(at(r, 'PANofOtherPerson')) && isEmpty(at(r, 'AadhaarOfOtherPerson'))) {
        err('A-633', `${t3}.${i}.PANofOtherPerson`, `Schedule TDS-3 row ${i + 1}: TDS credit relates to another person — that person's PAN / Aadhaar is mandatory`);
      }
      if (num(at(r, 'BroughtFwdTDSAmt')) > 0 && isEmpty(at(r, 'DeductedYr'))) {
        err('A-625', `${t3}.${i}.DeductedYr`, `Schedule TDS-3 row ${i + 1}: brought-forward TDS is claimed — the year of deduction must be selected`);
      }
    });
    const tcs = `${P}.ScheduleTCS.TCSDetails`;
    arr(at(j, tcs)).forEach((r, i) => {
      if (isEmpty(at(r, 'EmployerOrDeductorOrCollectDetl.TAN'))) {
        err('A-639', `${tcs}.${i}.EmployerOrDeductorOrCollectDetl.TAN`,
          `Schedule TCS row ${i + 1}: tax deduction and collection account number (TAN) of the collector must be provided`);
      }
      if (isEmpty(at(r, 'AmtCarriedFwd'))) {
        err('A-638', `${tcs}.${i}.AmtCarriedFwd`, `Schedule TCS row ${i + 1}: amount carried forward must be entered (0 where nothing is carried forward)`);
      }
      if (num(at(r, 'BroughtFwdTCSAmt')) > 0 && isEmpty(at(r, 'DeductedYr'))) {
        err('A-625', `${tcs}.${i}.DeductedYr`, `Schedule TCS row ${i + 1}: brought-forward TCS is claimed — the year of collection must be selected`);
      }
    });
  }

  /* ── Donation schedules: row cells + donee-PAN self-reference ──────────────── */
  {
    const doneeKeys = ['DoneeName', 'DoneePAN', 'AddressDetail', 'DonationAmtCash',
      'DonationAmtOtherMode', 'DonationAmt', 'DonationElgAmt'] as const;
    const buckets = ['Don100Percent', 'Don50PercentNoApprReqd', 'Don100PercentApprReqd', 'Don50PercentApprReqd'];
    const ownPan = str(at(j, `${orgP}.PAN`)).toUpperCase();
    const verPan = str(at(j, `${P}.Verification.Declaration.AssesseeVerPAN`)).toUpperCase();
    for (const b of buckets) {
      const path = `${P}.Schedule80G.${b}.DoneeDetail`;
      const list = rows('A-771', path, doneeKeys, `Schedule 80G (${humanise(b)})`);
      list.forEach((d, i) => {
        const p = str(at(d, 'DoneePAN')).toUpperCase();
        if (p !== '' && (p === ownPan || p === verPan)) {
          err('A-760', `${path}.${i}.DoneePAN`, `Schedule 80G row ${i + 1}: donee PAN cannot be the assessee's own PAN or the PAN at Verification`);
        }
      });
    }
    const gga = `${P}.Schedule80GGA.DonationDtlsSciRsrchRuralDev`;
    const ggaList = rows('A-776', gga,
      ['RelevantClauseUndrDedClaimed', 'NameOfDonee', 'AddressDetail', 'DoneePAN', 'DonationAmt'], 'Schedule 80GGA');
    ggaList.forEach((d, i) => {
      const p = str(at(d, 'DoneePAN')).toUpperCase();
      if (p !== '' && (p === ownPan || p === verPan)) {
        err('A-775', `${gga}.${i}.DoneePAN`, `Schedule 80GGA row ${i + 1}: donee PAN cannot be the assessee's own PAN or the PAN at Verification`);
      }
    });
    const ggc = `${P}.Schedule80GGC.Schedule80GGCDetails`;
    const ggcList = rows('A-800', ggc,
      ['DonationDate', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'EligibleDonationAmt'], 'Schedule 80GGC');
    ggcList.forEach((d, i) => {
      const dt = str(at(d, 'DonationDate'));
      if (isDateStr(dt) && (dt < '2024-04-01' || dt > '2025-03-31')) {
        err('A-822', `${ggc}.${i}.DonationDate`, `Schedule 80GGC row ${i + 1}: date of contribution must fall within 01-04-2024 to 31-03-2025`);
      }
    });
  }

  /* ── Schedule 80P: eligibility and business-code pairing ───────────────────── */
  {
    const p80 = `${P}.Schedule80P`;
    const claim80P = num(at(j, `${P}.ScheduleVIA.DeductUndChapVIA.Section80P`)) + num(at(j, `${p80}.Sec80PTotalAmt`));
    if (claim80P > 0 && !(status === '14' && SUBSTATUS_COOP.includes(subStatus))) {
      err('A-750', `${orgP}.SubStatus`,
        'Deduction u/s 80P is allowed only to a Primary Agricultural Credit Society, a Primary Co-operative Agricultural and Rural Development Bank or another co-operative society');
    }
    if (claim80P > 0 && ad44 > 0) {
      err('A-824', p80, 'Deduction u/s 80P cannot be claimed against income offered u/s 44AD');
    }
    if (claim80P > 0 && !hasData(at(j, `${P}.PARTA_PL`))) {
      err('A-821', `${P}.PARTA_PL`, 'To claim deduction u/s 80P both Schedule 80P and the Profit & Loss account must be filled');
    }
    const codePairs: ReadonlyArray<readonly [string, string, string]> = [
      ['Sec80P2ai', 'Sec80P2aiCode', '23001'], ['Sec80P2aii', 'Sec80P2aiiCode', '23002'],
      ['Sec80P2aiii', 'Sec80P2aiiiCode', '23003'], ['Sec80P2aiv', 'Sec80P2aivCode', '23004'],
      ['Sec80P2av', 'Sec80P2avCode', '23005'], ['Sec80P2avi', 'Sec80P2aviCode', '23006'],
      ['Sec80P2avii', 'Sec80P2aviiCode', '23007'], ['Sec80P2b', 'Sec80P2bCode', '23008'],
      ['Sec80P2ci', 'Sec80P2ciCode', '23009'], ['Sec80P2cii', 'Sec80P2ciiCode', '23010'],
      ['Sec80P2d', 'Sec80P2dCode', '23011'], ['Sec80P2e', 'Sec80P2eCode', '23012'],
      ['Sec80P2f', 'Sec80P2fCode', '23013'],
    ];
    for (const [amtKey, codeKey, code] of codePairs) {
      if (num(at(j, `${p80}.${amtKey}`)) > 0 && str(at(j, `${p80}.${codeKey}`)) !== code) {
        err('A-796', `${p80}.${codeKey}`,
          `Schedule 80P: the deduction claimed at ${humanise(amtKey)} requires business code ${code} to be selected`);
      }
    }
  }

  /* ── Schedule 10AA / TPSA / 115AD / CG deduction rows ──────────────────────── */
  rows('A-419', `${P}.ScheduleTPSA.DtlsTaxesPaid`, ['BSRCode', 'BankBranchName', 'DateDep', 'SrlNoOfChaln', 'Amount'], 'Schedule TPSA tax paid');
  rows('A-419', `${P}.ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54EC`, ['DateofTransfer', 'AmtDeducted'], 'Deduction u/s 54EC');
  rows('A-419', `${P}.ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54D`, ['DateofAcquisition', 'AmtDeducted'], 'Deduction u/s 54D');
  rows('A-419', `${P}.ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54G`, ['DateofTransfer', 'AmtDeducted'], 'Deduction u/s 54G');
  rows('A-419', `${P}.ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54GA`, ['DateofTransfer', 'AmtDeducted'], 'Deduction u/s 54GA');
  rows('A-26', `${P}.Schedule115AD.Schedule115ADDtls`,
    ['ShareOnOrBefore', 'ISINCode', 'ShareUnitName', 'TotSaleValue', 'CostAcqWithoutIndx',
      'AcquisitionCost', 'ExpExclCnctTransfer', 'TotalDeductions', 'Balance'], 'Schedule 115AD');

  /* ── Part B-TTI: taxes paid must reconcile with the tax-payment schedules ──── */
  {
    const tp = `${P}.PartB_TTI.TaxPaid.TaxesPaid`;
    const parts = num(at(j, `${tp}.AdvanceTax`)) + num(at(j, `${tp}.TDS`))
      + num(at(j, `${tp}.TCS`)) + num(at(j, `${tp}.SelfAssessmentTax`));
    const total = num(at(j, `${tp}.TotalTaxesPaid`));
    if (Math.abs(parts - total) > 1) {
      err('A-838', `${tp}.TotalTaxesPaid`, 'Total taxes paid (Sl. 10e of Part B-TTI) must equal Advance tax + TDS + TCS + Self-assessment tax');
    }
    const tdsSched = num(at(j, `${P}.ScheduleTDS2.TotalTDSonOthThanSals`)) + num(at(j, `${P}.ScheduleTDS3.TotalTDS3OnOthThanSal`));
    if (Math.abs(num(at(j, `${tp}.TDS`)) - tdsSched) > 1) {
      warn('A-829', `${tp}.TDS`, 'TDS at Sl. 10b of Part B-TTI does not match the totals claimed in Schedules TDS-2 and TDS-3');
    }
    if (Math.abs(num(at(j, `${tp}.TCS`)) - num(at(j, `${P}.ScheduleTCS.TotalSchTCS`))) > 1) {
      warn('A-829', `${tp}.TCS`, 'TCS at Sl. 10c of Part B-TTI does not match the total claimed in Schedule TCS');
    }
    const itTotal = num(at(j, `${P}.ScheduleIT.TotalTaxPayments`));
    const advSat = num(at(j, `${tp}.AdvanceTax`)) + num(at(j, `${tp}.SelfAssessmentTax`));
    if (Math.abs(advSat - itTotal) > 1) {
      warn('A-829', `${P}.ScheduleIT.TotalTaxPayments`,
        'Advance tax + self-assessment tax in Part B-TTI does not match the total of the challans in Schedule IT');
    }
  }
  // A-828: tax computed but gross total income is nil
  if (num(at(j, `${P}.PartB-TI.GrossTotalIncome`)) <= 0
    && num(at(j, `${P}.PartB_TTI.ComputationOfTaxLiability.GrossTaxPayable`)) > 0) {
    err('A-828', `${P}.PartB-TI.GrossTotalIncome`,
      'Tax liability has been computed in Part B-TTI but the Gross Total Income in Part B-TI is nil');
  }
}

/* ── the checker ───────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  try {
    for (const key of Object.keys(REQUIRED_TREE)) {
      walkRequired(json, REQUIRED_TREE[key], [key], missing);
    }
    schemaFormatChecks(json, errors, warnings);
    categoryAChecks(json, errors, warnings);
    categoryAChecks2(json, errors, warnings);
  } catch {
    // Never throw on malformed payloads: report what was gathered so far,
    // plus a synthetic error so the failure is visible.
    errors.push({
      path: 'ITR.ITR5',
      msg: 'Validator aborted midway on a malformed payload — fix the reported items and re-run',
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
