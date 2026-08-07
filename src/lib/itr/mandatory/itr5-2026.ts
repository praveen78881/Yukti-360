/**
 * OFFICIAL mandatory-field validator — ITR-5, A.Y. 2026-27.
 *
 * Sources (distilled at build time, NEVER imported at runtime):
 *  - ITD JSON schema "ITR-5_2026_Main_V1.0.json" (draft-04, description
 *    "Schema for ITR-5, AY 2026-27"). REQUIRED_TREE below was machine-extracted
 *    by recursively following properties / required / $ref / allOf / items from
 *    #/definitions/ITR5 (the exported payload root is { ITR: { ITR5: … } }).
 *    427 required leaves. ARRAY_ITEM_REQUIRED holds the per-element required
 *    keys of the 103 repeating tables reachable from ITR5 (471 further leaves)
 *    — those are checked element-wise only when the table is actually present.
 *  - ITD "CBDT_e-Filing_ITR 5_Validation Rules for AY 2026-27 V 1.0", Table 2
 *    (Category A — "Return will not be allowed to be uploaded"). Every
 *    category-A rule that is decidable from the exported JSON alone
 *    (mandatory-if conditions and cross-field requirements) is encoded in
 *    categoryAChecks / categoryAChecks2 with rule id "A-<Sl. no.>".
 *    Out of scope by design: the ~700 arithmetic reconciliation rules (they
 *    belong to the computation engine) and rules needing external data
 *    (CPC records, e-verification state, Form 10IF/10IFA/10IEA lookups,
 *    system-date-of-filing comparisons).
 *
 * Self-contained; never throws on undefined / partial payloads.
 */

import type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';
import { at, isEmpty } from './types';

const FORM = 'itr5';
const AY = '2026-27';
const SCHEMA_VERSION = 'ITR-5_2026_Main_V1.0';

/* ────────────────────────────────────────────────────────────────────────────
 * Distilled REQUIRED tree (machine-extracted from the official schema).
 * Leaf `1` = required scalar/enum: must be present and non-empty.
 * Nested object = required object: must be present, then its own required
 * children are checked.
 * ──────────────────────────────────────────────────────────────────────────── */

type ReqNode = 1 | { [key: string]: ReqNode };

const REQUIRED_TREE: { [key: string]: ReqNode } = {
  ITR: {
    ITR5: {
      CreationInfo: {
        SWVersionNo: 1, SWCreatedBy: 1, JSONCreatedBy: 1, JSONCreationDate: 1, IntermediaryCity: 1,
        Digest: 1,
      },
      Form_ITR5: { FormName: 1, Description: 1, AssessmentYear: 1, SchemaVer: 1, FormVer: 1 },
      PartA_GEN1: {
        OrgFirmInfo: {
          AssesseeName: { SurNameOrOrgName: 1 },
          PAN: 1,
          Address: {
            ResidenceNo: 1, LocalityOrArea: 1, CityOrTownOrDistrict: 1, StateCode: 1, CountryCode: 1,
            CountryCodeMobile: 1, MobileNo: 1, EmailAddress: 1,
          },
          DateOFFormOrIncorp: 1,
          StatusOrCompanyType: 1,
        },
        FilingStatus: {
          ReturnFileSec: { IncomeTaxSec: 1 },
          BusinessTrustFlag: 1,
          InvstmntFundRefrdSec115UB: 1,
          ResidentialStatus: 1,
          ForeignExchangeFlag: 1,
          StartUpDPIITFlag: 1,
          InterMinisterialCertFlag: 1,
          FiiFpiFlag: 1,
          AsseseeRepFlg: 1,
          PartnerInFirmFlg: 1,
          HeldUnlistedEqShrPrYrFlg: 1,
          ItrFilingDueDate: 1,
          ifMSME: 1,
        },
      },
      PartA_GEN2: {
        LiableSec44AAflg: 1, IncDclrdUs: 1, LiableSec44ABflg: 1, LiableSec92Eflg: 1,
        PrevYrMemPartChange: 1,
      },
      PARTA_BS: {
        FundSrc: {
          PartnerOrMemberFund: {
            PartnerOrMemberCap: 1,
            ResrNSurp: {
              RevResr: 1, CapResr: 1, StatResr: 1, OthResr: 1, CreditBalOfPLAccount: 1, TotResrNSurp: 1,
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
          FixedAsset: { GrossBlock: 1, Depreciation: 1, NetBlock: 1, CapWrkProg: 1, TotFixedAsset: 1 },
          Investments: {
            LongTermInv: {
              InvInProperty: 1,
              EquityInstruments: { ListedEquities: 1, UnListedEquities: 1, Total: 1 },
              PreferenceShares: 1,
              GovtOrTrustSecurities: 1,
              DebenturesOrBonds: 1,
              MutualFunds: 1,
              Others: 1,
              TotLongTermInv: 1,
            },
            ShortTermInv: {
              EquityInstruments: { ListedEquities: 1, UnListedEquities: 1, Total: 1 },
              PreferenceShares: 1,
              GovtOrTrustSecurities: 1,
              DebenturesOrBonds: 1,
              MutualFunds: 1,
              Others: 1,
              TotShortTermInv: 1,
            },
            TotInvestments: 1,
          },
          CurrAssetLoanAdv: {
            CurrAsset: {
              Inventories: {
                RawMatl: 1, WorkInProgress: 1, FinOrTradGood: 1, StkInTrade: 1, StoresConsumables: 1,
                LooseTools: 1, Others: 1, TotInventries: 1,
              },
              SundryDebtorDtls: { OutstandindMorethanOneYr: 1, Others: 1, TotalSundryDebtors: 1 },
              CashOrBankBal: { BankBal: 1, CashinHand: 1, Others: 1, TotCashOrBankBal: 1 },
              OthCurrAsset: 1,
              TotCurrAsset: 1,
            },
            LoanAdv: {
              AdvRecoverable: 1,
              Deposits: 1,
              BalWithRevAuth: 1,
              TotLoanAdv: 1,
              LoanAdvIncluded: { PurposeOFBusOrProf: 1, NotForPurposeOFBusOrProf: 1 },
            },
            TotCurrAssetLoanAdv: 1,
            CurrLiabilitiesProv: {
              CurrLiabilities: {
                SundryCreditorDtls: { OutstandindMorethanOneYr: 1, Others: 1, TotalSundryCreditors: 1 },
                LiabForLeasedAsset: 1,
                AccrIntonLeasedAsset: 1,
                AccrIntNotDue: 1,
                IncRecvdInAdv: 1,
                OtherPayables: 1,
                TotCurrLiabilities: 1,
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
            RentInc: 1, Comissions: 1, Dividends: 1, InterestInc: 1, ProfitOnSaleFixedAsset: 1,
            ProfitOnInvChrSTT: 1, ProfitOnOthInv: 1, ProfitOnCurrFluct: 1,
            ProfitOnCnvInvntryToCapAsst: 1, ProfitOnAgriIncome: 1, MiscOthIncome: 1, TotOthIncome: 1,
          },
          TotCreditsToPL: 1,
        },
        DebitsToPL: {
          DebitPlAcnt: {
            Freight: 1,
            ConsumptionOfStores: 1,
            PowerFuel: 1,
            RentExpdr: 1,
            RepairsBldg: 1,
            RepairMach: 1,
            EmployeeComp: {
              SalsWages: 1, Bonus: 1, MedExpReimb: 1, LeaveEncash: 1, LeaveTravelBenft: 1,
              ContToSuperAnnFund: 1, ContToPF: 1, ContToGratFund: 1, ContToOthFund: 1,
              OthEmpBenftExpdr: 1, TotEmployeeComp: 1,
            },
            Insurances: { MedInsur: 1, LifeInsur: 1, KeyManInsur: 1, OthInsur: 1, TotInsurances: 1 },
            StaffWelfareExp: 1,
            Entertainment: 1,
            Hospitality: 1,
            Conference: 1,
            SalePromoExp: 1,
            Advertisement: 1,
            CommissionExpdrDtls: { NonResOtherCompany: 1, Others: 1, Total: 1 },
            RoyalityDtls: { NonResOtherCompany: 1, Others: 1, Total: 1 },
            ProfessionalConstDtls: { NonResOtherCompany: 1, Others: 1, Total: 1 },
            HotelBoardLodge: 1,
            TravelExp: 1,
            ForeignTravelExp: 1,
            ConveyanceExp: 1,
            TelephoneExp: 1,
            GuestHouseExp: 1,
            ClubExp: 1,
            FestivalCelebExp: 1,
            Scholarship: 1,
            Gift: 1,
            Donation: 1,
            RatesTaxesPays: {
              ExciseCustomsVAT: {
                UnionExciseDuty: 1, ServiceTax: 1, VATorSaleTax: 1, CentralGoodServiceTax: 1,
                StateGoodServiceTax: 1, IntegratedGoodServiceTax: 1, UnionTerrGoodServiceTax: 1,
                OthDutyTaxCess: 1, TotExciseCustomsVAT: 1,
              },
            },
            AuditFee: 1,
            SalRemuneration: 1,
            OtherExpenses: 1,
            BadDebtDtls: { BadDebtAmtDtlsTotal: 1, OthersPANNotAvlblDtlTotal: 1, OthersAmtLt1Lakh: 1, BadDebt: 1 },
            ProvForBadDoubtDebt: 1,
            OthProvisionsExpdr: 1,
            PBIDTA: 1,
            InterestExpdrtDtls: { NonResOtherCompany: 1, Others: 1, ResPartners: 1, ResOthers: 1, InterestExpdr: 1 },
            DepreciationAmort: 1,
            PBT: 1,
          },
          TaxProvAppr: {
            ProvForCurrTax: 1,
            ProvDefTax: 1,
            ProfitAfterTax: 1,
            BalBFPrevYr: 1,
            AmtAvlAppr: 1,
            Appropriations: { TrfToReserves: 1 },
            PartnerAccBalTrf: 1,
          },
        },
        PersumptiveInc44AD: { GrsTrnOverOrReceipt: 1, TotPersumptiveInc44AD: 1 },
        PersumptiveInc44ADA: { GrsReceipt: 1 },
        TotalPrsumptvIncUs44E: 1,
        NoBooksOfAccPL: {
          GrossReceipt: 1, GrsRcptAccPayeeOrBankMode: 1, GrsRcptOtherMode: 1, GrossProfit: 1,
          Expenses: 1, NetProfit: 1, GrossReceiptPrf: 1, GrsRcptAccPayeeOrBankModePrf: 1,
          GrsRcptOtherModePrf: 1, GrossProfitPrf: 1, ExpensesPrf: 1, NetProfitPrf: 1,
          TotBusinessProfession: 1,
        },
        TurnverFrmSpecActivity: 1,
        NetIncomeFrmSpecActivity: 1,
      },
      CorpScheduleBP: {
        BusinessIncOthThanSpec: {
          ProfBfrTaxPL: 1,
          NetPLFromSpecBus: 1,
          NetProfLossSpecifiedBus: 1,
          IncRecCredPLOthHeadDtls: {
            HouseProperty: 1, CapitalGains: 1, OtherSources: 1, UnderSec115BBF: 1, UnderSec115BBG: 1,
            Dividend: 1, OtherThanDividend: 1,
          },
          PLUs44sChapXIIGOthrUs115B: 1,
          ProfitLossInclRefrdSec: {
            ProfitLossUs44AD: 1, ProfitLossUs44ADA: 1, ProfitLossUs44AE: 1, ProfitLossUs44B: 1,
            ProfitLossUs44BB: 1, ProfitLossUs44BBA: 1, ProfitLossUs44BBC: 1, ProfitLossUs44BBD: 1,
            ProfitLossUs44DA: 1, FirstSchITActOthr115B: 1,
          },
          TotalProfitFrmActCvrd: 1,
          ProfitFrmActCvrd: {
            ProfitFrmActCvrdUndrRule7: 1, ProfitFrmActCvrdUndrRule7A: 1, ProfitFrmActCvrdUndrRule7B1: 1,
            ProfitFrmActCvrdUndrRule7B1A: 1, ProfitFrmActCvrdUndrRule8: 1,
          },
          IncCredPL: { FirmShareInc: 1, AOPBOISharInc: 1, OthExempInc: 1, TotExempInc: 1 },
          BalancePLOthThanSpecBus: 1,
          ExpDebToPLOthHeadDtls: { HouseProperty: 1, CapitalGains: 1, OtherSources: 1, UnderSec115BBF: 1, UnderSec115BBG: 1 },
          ExpDebToPLExemptInc: 1,
          ExpDebToPLExemptIncDisAllwUs14A: 1,
          TotExpDebPL: 1,
          AdjustedPLOthThanSpecBus: 1,
          DepreciationDebPLCosAct: 1,
          DepreciationAllowITAct32: { DepreciationAllowUs32_1_ii: 1, DepreciationAllowUs32_1_i: 1, TotDeprAllowITAct: 1 },
          AdjustPLAfterDeprOthSpecInc: 1,
          AmtDebPLDisallowUs36: 1,
          AmtDebPLDisallowUs37: 1,
          AmtDebPLDisallowUs40: 1,
          AmtDebPLDisallowUs40A: 1,
          AmtDebPLDisallowUs43B: 1,
          InterestDisAllowUs23SMEAct: 1,
          DeemIncUs41: 1,
          DeemIncUs3380HHD80IA: 1,
          DeemIncUs43CA: 1,
          OthItemDisallowUs28To44DB: 1,
          AnyOthIncNotInclInExpDisallowPL: 1,
          SalaryExpDisallowPL: 1,
          BonusExpDisallowPL: 1,
          CommissionExpDisallowPL: 1,
          InterestExpDisallowPL: 1,
          OthersExpDisallowPL: 1,
          IncProfDecLossAccICDSAdj: 1,
          TotAfterAddToPLDeprOthSpecInc: 1,
          DeductUs32_1_iii: 1,
          DebPLUs35ExcessAmt: 1,
          AmtDisallUs40NowAllow: 1,
          AmtDisallUs43BNowAllow: 1,
          AnyOthAmtAllDeduct: 1,
          DecProfIncLossAccICDSAdj: 1,
          TotDeductionAmts: 1,
          PLAftAdjDedBusOthThanSpec: 1,
          DeemedProfitBusUs: {
            Section44AD: 1, Section44ADA: 1, Section44AE: 1, Section44B: 1, Section44BB: 1,
            Section44BBA: 1, Section44BBC: 1, Section44BBD: 1, Section44DA: 1, FirstSchTActOther: 1,
            TotDeemedProfitBusUs: 1,
          },
          NetPLAftAdjBusOthThanSpec: 1,
          NetPLBusOthThanSpec7A7B7C: 1,
          ChrgblIncUndrRule7: 1,
          DeemedChrgblIncUndrRule7A: 1,
          DeemedChrgblIncUndrRule7B1: 1,
          DeemedChrgblIncUndrRule7B1A: 1,
          DeemedChrgblIncUndrRule8: 1,
          IncomeOtherThanRule: 1,
          BalIncDeemedFrmAgri: 1,
        },
        SpecBusinessInc: { NetPLFrmSpecBus: 1, AdditionUs28to44DB: 1, DeductUs28to44DB: 1, AdjustedPLFrmSpecuBus: 1 },
        IncSpecifiedBusiness: {
          NetPLFrmSpecifiedBus: 1, AddSec28to44DB: 1, DedSec28to44DBOTDedSec35AD: 1,
          ProfitLossSpecifiedBusiness: 1, ProfitLossSpecifiedBusFinal: 1,
        },
        IncChrgUnHdProftGain: 1,
        BusSetoffCurrYr: { LossSetOffOnBusLoss: 1, TotLossSetOffOnBus: 1, LossRemainSetOffOnBus: 1 },
      },
      "PartB-TI": {
        IncomeFromHP: 1,
        ProfBusGain: {
          ProfGainNoSpecBus: 1, ProfGainSpecBus: 1, ProfGainSpecifiedBus: 1, IncChrgblTaxSplRate: 1,
          TotProfBusGain: 1,
        },
        CapGain: {
          ShortTerm: {
            ShortTerm20Per: 1, ShortTerm30Per: 1, ShortTermAppRate: 1, ShortTermSplRateDTAA: 1,
            TotalShortTerm: 1,
          },
          LongTerm: { LongTerm12_5Per: 1, LongTermSplRateDTAA: 1, TotalLongTerm: 1 },
          TotalCapGains: 1,
          ShortTermLongTermTotal: 1,
          CapGains30Per115BBH: 1,
        },
        IncFromOS: { OtherSrcThanOwnRaceHorse: 1, IncChargblSplRate: 1, FromOwnRaceHorse: 1, TotIncFromOS: 1 },
        TotalTI: 1,
        CurrentYearLoss: 1,
        BalanceAfterSetoffLosses: 1,
        BroughtFwdLossesSetoff: 1,
        GrossTotalIncome: 1,
        IncChargeTaxSplRate111A112: 1,
        DeductionsUndSchVIADtl: { PartBchapterVIA: 1, PartCchapterVIA: 1, TotDeductUndSchVIA: 1 },
        DeductionsUnder10Aor10AA: 1,
        TotalIncome: 1,
        IncChargeableTaxSplRates: 1,
        NetAgricultureIncomeOrOtherIncomeForRate: 1,
        AggregateIncome: 1,
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
          GrossTaxPayable: 1,
          CreditUS115JD: 1,
          TaxPaidUnderCredit: 1,
          TaxRelief: { Section90: 1, Section91: 1, TotTaxRelief: 1 },
          NetTaxLiability: 1,
          IntrstPay: {
            IntrstPayUs234A: 1, IntrstPayUs234B: 1, IntrstPayUs234C: 1, LateFilingFee234F: 1,
            TotalIntrstPay: 1,
          },
          AggregateTaxInterestLiability: 1,
        },
        TaxPaid: {
          TaxesPaid: { TotalTaxesPaid: 1 },
          BalTaxPayable: 1,
        },
        Refund: {
          RefundDue: 1,
          BankAccountDtls: { BankDtlsFlag: 1 },
        },
      },
      Verification: {
        Declaration: { AssesseeVerName: 1, FatherName: 1, AssesseeVerPAN: 1, Capacity: 1, Place: 1, Date: 1 },
      },
    },
  },
};

/* ────────────────────────────────────────────────────────────────────────────
 * Per-element required keys of every repeating table under ITR.ITR5.
 * Keys are dot-paths relative to ITR.ITR5; "[]" marks an array hop.
 * A table is optional — but once a row exists, these columns are mandatory.
 * ──────────────────────────────────────────────────────────────────────────── */

const ARRAY_ITEM_REQUIRED: Record<string, string[]> = {
  'PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls': ['NameOfFirm', 'PAN'],
  'PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls': ['NameOfCompany', 'CompanyType', 'OpngBalNumberOfShares', 'OpngBalCostOfAcquisition', 'ClsngBalNumberOfShares', 'ClsngBalCostOfAcquisition'],
  'PartA_GEN2.AuditDetails': ['AuditedSection', 'AuditFlag'],
  'PartA_GEN2.AuditReportDetails': ['AuditReportAct', 'AuditReportSection', 'OtherITActFlag'],
  'PartA_GEN2.PrevYrMemPart.PrevYrMemPartDtls': ['PartnerName', 'AdmRet', 'AdmRetDate', 'SharePercentage', 'PAN', 'RemunerationpaidAmt'],
  'PartA_GEN2.PartnerOrMemberInfo': ['PartnerOrMemberName', 'AddressDetailWithZipCode', 'SharePercentage', 'Status', 'RateOfInterest', 'RemunerationPaid'],
  'PartA_GEN2.NatOfBus.NatureOfBusiness': ['Code'],
  'TradingAccount.OtherOperatingRevenueDtls': ['OperatingRevenueName', 'OperatingRevenueAmt'],
  'TradingAccount.OtherDirectExpenses': ['NatureOfDirectExpense', 'Amount'],
  'PARTA_PL.CreditsToPL.OthIncome.OtherIncDtls': ['NatureOfIncome', 'Amount'],
  'PARTA_PL.DebitsToPL.DebitPlAcnt.OtherExpensesDtls': ['ExpenseNature', 'Amount'],
  'PARTA_PL.DebitsToPL.DebitPlAcnt.BadDebtDtls.BadDebtAmtDtls': ['PAN', 'Amount'],
  'PARTA_PL.DebitsToPL.DebitPlAcnt.BadDebtDtls.OthersPANNotAvlblDtl': ['Name', 'FlatDoorBlockNumber', 'AreaLocality', 'TownCityDistrict', 'StateCode', 'CountryCode', 'Amount'],
  'PARTA_PL.NatOfBus44AD': ['NameOfBusiness', 'CodeAD'],
  'PARTA_PL.NatOfBus44ADA': ['NameOfBusiness', 'CodeADA'],
  'PARTA_PL.NatOfBus44AE': ['NameOfBusiness', 'CodeAE'],
  'PARTA_PL.GoodsDtlsUs44AE': ['RegNumberGoodsCarriage', 'OwnedLeasedHiredFlag', 'TonnageCapacity', 'HoldingPeriod', 'PresumptiveIncome'],
  'PARTA_QD.TradingConcern.QuantitDet': ['ItemName', 'UnitOfMeasure', 'OpeningStock', 'PurchaseQty', 'SaleQty', 'ClgStock', 'AnyShortExces'],
  'PARTA_QD.ManfactrConcern.RawMaterial.QuantitDet': ['ItemName', 'UnitOfMeasure', 'OpeningStock', 'PurchaseQty', 'SaleQty', 'ClgStock', 'AnyShortExces'],
  'PARTA_QD.ManfactrConcern.FinishrByProd.QuantitDet': ['ItemName', 'UnitOfMeasure', 'OpeningStock', 'PurchaseQty', 'SaleQty', 'ClgStock', 'AnyShortExces'],
  'ScheduleHP.PropertyDetails': ['HPSNo', 'AddressDetailWithZipCode', 'PropertyOwner', 'PropCoOwnedFlg', 'ifLetOut', 'Rentdetails'],
  'ScheduleHP.PropertyDetails[].CoOwners': ['CoOwnersSNo', 'NameCoOwner'],
  'ScheduleHP.PropertyDetails[].TenantDetails': ['TenantSNo', 'NameofTenant'],
  'ScheduleHP.PropertyDetails[].Rentdetails.Section24B.Section24BDtls': ['LoanTknFrom', 'BankOrInstnName', 'LoanAccNoOfBankOrInstnRefNo', 'DateofLoan', 'TotalLoanAmt', 'LoanOutstndngAmt', 'InterestUs24B'],
  'CorpScheduleBP.IncSpecifiedBusiness.DedUs35ADSubSec5Dtls': ['DedUs35ADSubSec5'],
  'ScheduleCG.ShortTermCapGain.SaleofLandBuild.SaleofLandBuildDtls': ['FullConsideration', 'PropertyValuation', 'FullConsideration50C', 'Reduction48iii', 'AquisitCost', 'ImproveCost', 'ExpOnTrans', 'TotalDedn', 'Balance', 'ExemptionOrDednUs54', 'CapgainonAssets'],
  'ScheduleCG.ShortTermCapGain.SaleofLandBuild.SaleofLandBuildDtls[].ExemptionOrDednUs54.ExemptionOrDednUs54Dtls': ['ExemptionSecCode', 'ExemptionAmount'],
  'ScheduleCG.ShortTermCapGain.SaleofLandBuild.SaleofLandBuildDtls[].TrnsfImmblPrprty.TrnsfImmblPrprtyDtls': ['NameOfBuyer', 'PercentageShare', 'Amount', 'AddressOfProperty', 'StateCode'],
  'ScheduleCG.ShortTermCapGain.EquityMFonSTT': ['MFSectionCode', 'EquityMFonSTTDtls'],
  'ScheduleCG.ShortTermCapGain.SaleOnOtherAssets.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls': ['ExemptionSecCode', 'ExemptionAmount'],
  'ScheduleCG.ShortTermCapGain.UnutilizedCg.UnutilizedCgPrvYrDtls': ['PrvYrInWhichAsstTrnsfrd', 'SectionClmd', 'AmtUnutilized'],
  'ScheduleCG.ShortTermCapGain.NRICgDTAA.NRIDTAADtls': ['DTAAamt', 'ItemNoincl', 'CountryName', 'CountryCodeExcludingIndia', 'DTAAarticle', 'RateAsPerTreaty', 'SecITAct', 'RateAsPerITAct'],
  'ScheduleCG.ShortTermCapGain.CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls': ['Rate', 'Amount'],
  'ScheduleCG.LongTermCapGain.SaleofLandBuild.SaleofLandBuildDtls': ['FullConsideration', 'PropertyValuation', 'FullConsideration50C', 'AquisitCost', 'ExpOnTrans', 'TotalDedn', 'Balance', 'ExemptionOrDednUs54', 'CapgainonAssets', 'AquisitCostIndex'],
  'ScheduleCG.LongTermCapGain.SaleofLandBuild.SaleofLandBuildDtls[].ExemptionOrDednUs54.ExemptionOrDednUs54Dtls': ['ExemptionSecCode', 'ExemptionAmount'],
  'ScheduleCG.LongTermCapGain.SaleofLandBuild.SaleofLandBuildDtls[].TrnsfImmblPrprty.TrnsfImmblPrprtyDtls': ['NameOfBuyer', 'PercentageShare', 'Amount', 'AddressOfProperty', 'StateCode'],
  'ScheduleCG.LongTermCapGain.NRIOnSec112and115.NRIOnSec112and115Dtls': ['FullValueConsdRecvUnqshr', 'FairMrktValueUnqshr', 'FullValueConsdSec50CA', 'FullValueConsdOthUnqshr', 'FullConsideration', 'DeductSec48', 'BalanceCG'],
  'ScheduleCG.LongTermCapGain.SaleofAssetNADtls.SaleofAssetNA.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls': ['ExemptionSecCode', 'ExemptionAmount'],
  'ScheduleCG.LongTermCapGain.UnutilizedCg.UnutilizedCgPrvYrDtls': ['PrvYrInWhichAsstTrnsfrd', 'SectionClmd', 'AmtUnutilized'],
  'ScheduleCG.LongTermCapGain.NRICgDTAA.NRIDTAADtls': ['DTAAamt', 'ItemNoincl', 'CountryName', 'CountryCodeExcludingIndia', 'DTAAarticle', 'RateAsPerTreaty', 'SecITAct', 'RateAsPerITAct'],
  'ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54D': ['DateofAcquisition', 'AmtDeducted'],
  'ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54EC': ['DateofTransfer', 'AmtDeducted'],
  'ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54G': ['DateofTransfer', 'AmtDeducted'],
  'ScheduleCG.DeducClaimInfo.DeducClaimDtlsUs54GA': ['DateofTransfer', 'AmtDeducted'],
  'Schedule112A.Schedule112ADtls': ['ShareOnOrBefore', 'ISINCode', 'ShareUnitName', 'TotSaleValue', 'CostAcqWithoutIndx', 'AcquisitionCost', 'ExpExclCnctTransfer', 'TotalDeductions', 'Balance'],
  'Schedule115AD.Schedule115ADDtls': ['ShareOnOrBefore', 'ISINCode', 'ShareUnitName', 'TotSaleValue', 'CostAcqWithoutIndx', 'AcquisitionCost', 'ExpExclCnctTransfer', 'TotalDeductions', 'Balance'],
  'ScheduleVDA.ScheduleVDADtls': ['DateofAcquisition', 'DateofTransfer', 'HeadUndIncTaxed', 'AcquisitionCost', 'ConsidReceived', 'IncomeFromVDA'],
  'ScheduleOS.IncOthThanOwnRaceHorse.OthersInc.OthersIncDtls': ['OthNatOfInc', 'OthAmount'],
  'ScheduleOS.IncOthThanOwnRaceHorse.OthersGrossDtls': ['SourceDescription', 'SourceAmount'],
  'ScheduleOS.IncOthThanOwnRaceHorse.PTIOthersGrossDtls': ['SourceDescription', 'SourceAmount'],
  'ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS': ['DTAAamt', 'NatureOfIncome', 'CountryName', 'CountryCodeExcludingIndia', 'DTAAarticle', 'RateAsPerTreaty', 'ItemNoincl', 'RateAsPerITAct'],
  'ITRScheduleUD.ScheduleUD': ['AssYr', 'AmtBFUD', 'AdjustAccTax115BADAmt', 'AmtDeprSOCY', 'BalCFNY', 'AmtBFUAllow', 'AmtAllowSOCY', 'AllowBalCFNY'],
  'Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy': ['AssmtYrUnit', 'DedUs10Sub'],
  'Schedule80G.Don100Percent.DoneeDetail': ['DoneeName', 'DoneePAN', 'AddressDetail', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'DonationElgAmt'],
  'Schedule80G.Don50PercentNoApprReqd.DoneeDetail': ['DoneeName', 'DoneePAN', 'AddressDetail', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'DonationElgAmt'],
  'Schedule80G.Don100PercentApprReqd.DoneeDetail': ['DoneeName', 'DoneePAN', 'AddressDetail', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'DonationElgAmt'],
  'Schedule80G.Don50PercentApprReqd.DoneeDetail': ['DoneeName', 'DoneePAN', 'AddressDetail', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'DonationElgAmt'],
  'Schedule80GGA.DonationDtlsSciRsrchRuralDev': ['RelevantClauseUndrDedClaimed', 'NameOfDonee', 'AddressDetail', 'DoneePAN', 'DonationAmt'],
  'Schedule80GGC.Schedule80GGCDetails': ['DonationDate', 'DonationAmtCash', 'DonationAmtOtherMode', 'DonationAmt', 'EligibleDonationAmt'],
  'Schedule80RA.DonationDtlsRsrchAssctn': ['NameOfDonee', 'AddressDetail', 'DoneePAN', 'DonationAmt'],
  'Schedule80_IA.DeductUs80_IA_4_i.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IA.DeductUs80_IA_4_iv.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IB.DeductJKLocUs80_IB_4_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IB.DeductMinOilUs80_IB_9_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IB.DeductHousUs80_IB_10_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IB.DeductFruitVegUs80_IB_11A_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IB.DeductFoodGrainUs80_IB_11A_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.Assam_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.ArunachalPradesh_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.Manipur_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.Mizoram_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.Meghalaya_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.Nagaland_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.Tripura_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'Schedule80_IC.DeductInNorthEast.Sikkim_Und.Sch80DeductAmtDtls': ['DeductAmountSec80'],
  'ScheduleAMT.AdjustmentSec115JC': ['DeductClaimSec6A', 'DeductClaimSec10AA', 'DeductClaimSec35AD', 'Total'],
  'ScheduleAMTC.ScheduleAMTCDtls': ['AssYr', 'AmtCreditFwd', 'AmtCreditBalBroughtFwd', 'AmtCreditUtilized', 'BalAmtCreditCarryFwd'],
  'ScheduleSI.SplCodeRateTax': ['SecCode', 'SplRatePercent', 'SplRateInc', 'SplRateIncTax'],
  'ScheduleIF.PartnerFirmDetails': ['FirmName', 'FirmPAN', 'IsLiableToAudit', 'Sec92EFirmFlag', 'ProfitSharePercent', 'ProfitShareAmt', 'FirmCapBalOn31Mar'],
  'ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls': ['NameOfDistrict', 'PinCode', 'MeasurementOfLand', 'AgriLandOwnedFlag', 'AgriLandIrrigatedFlag'],
  'ScheduleEI.OthersInc.OthersIncDtls': ['OthAmount'],
  'ScheduleEI.IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls': ['AmountOfIncome', 'CountryName', 'CountryCodeExcludingIndia', 'HeadOfIncome'],
  'SchedulePTI.SchedulePTIDtls': ['InvstmntCvrdUs115UA115UB', 'BusinessName', 'BusinessPAN', 'IncFromHP', 'CapitalGainsPTI', 'IncOthSrc', 'OS_Dividend', 'OS_Others', 'IncClmdPTI'],
  'ScheduleTPSA.DtlsTaxesPaid': ['BSRCode', 'BankBranchName', 'DateDep', 'SrlNoOfChaln', 'Amount'],
  'ScheduleFSI.ScheduleFSIDtls': ['CountryName', 'CountryCodeExcludingIndia', 'TaxIdentificationNo', 'IncFromHP', 'IncFromBusiness', 'IncCapGain', 'IncOthSrc', 'TotalCountryWise'],
  'ScheduleTR1.ScheduleTR': ['CountryName', 'CountryCodeExcludingIndia', 'TaxIdentificationNo', 'TaxPaidOutsideIndia', 'TaxReliefOutsideIndia'],
  'ScheduleFA.DetailsForiegnBank': ['CountryName', 'CountryCodeExcludingIndia', 'Bankname', 'AddressOfBank', 'ZipCode', 'ForeignAccountNumber', 'OwnerStatus', 'AccOpenDate', 'PeakBalanceDuringYear', 'ClosingBalance', 'IntrstAccured'],
  'ScheduleFA.DtlsForeignCustodialAcc': ['CountryName', 'CountryCodeExcludingIndia', 'FinancialInstName', 'FinancialInstAddress', 'ZipCode', 'AccountNumber', 'Status', 'AccOpenDate', 'PeakBalanceDuringPeriod', 'ClosingBalance', 'GrossAmtPaidCredited', 'NatureOfAmount'],
  'ScheduleFA.DtlsForeignEquityDebtInterest': ['CountryName', 'CountryCodeExcludingIndia', 'NameOfEntity', 'AddressOfEntity', 'ZipCode', 'NatureOfEntity', 'InterestAcquiringDate', 'InitialValOfInvstmnt', 'PeakBalanceDuringPeriod', 'ClosingBalance', 'TotGrossAmtPaidCredited', 'TotGrossProceeds'],
  'ScheduleFA.DtlsForeignCashValueInsurance': ['CountryName', 'CountryCodeExcludingIndia', 'FinancialInstName', 'FinancialInstAddress', 'ZipCode', 'ContractDate', 'CashValOrSurrenderVal', 'TotGrossAmtPaidCredited'],
  'ScheduleFA.DetailsFinancialInterest': ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameOfEntity', 'AddressOfEntity', 'NatureOfInt', 'DateHeld', 'TotalInvestment', 'IncFromInt', 'NatureOfInc', 'IncTaxAmt', 'IncTaxSch', 'IncTaxSchNo'],
  'ScheduleFA.DetailsImmovableProperty': ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'Ownership', 'DateOfAcq', 'TotalInvestment', 'IncDrvProperty', 'NatureOfInc', 'IncTaxAmt', 'IncTaxSch', 'IncTaxSchNo'],
  'ScheduleFA.DetailsOthAssets': ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NatureOfAsset', 'Ownership', 'DateOfAcq', 'TotalInvestment', 'IncDrvAsset', 'NatureOfInc', 'IncTaxAmt', 'IncTaxSch', 'IncTaxSchNo'],
  'ScheduleFA.DetailsOfAccntsHvngSigningAuth': ['NameOfInstitution', 'AddressOfInstitution', 'CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameMentionedInAccnt', 'InstitutionAccountNumber', 'PeakBalanceOrInvestment', 'IncAccuredTaxFlag'],
  'ScheduleFA.DetailsOfTrustOutIndiaTrustee': ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameOfTrust', 'AddressOfTrust', 'NameOfOtherTrustees', 'AddressOfOtherTrustees', 'NameOfSettlor', 'AddressOfSettlor', 'NameOfBeneficiaries', 'AddressOfBeneficiaries', 'DateHeld', 'IncDrvTaxFlag'],
  'ScheduleFA.DetailsOfOthSourcesIncOutsideIndia': ['CountryName', 'CountryCodeExcludingIndia', 'ZipCode', 'NameOfPerson', 'AddressOfPerson', 'NatureOfInc', 'IncDrvTaxFlag'],
  'ScheduleGST.TurnoverGrsRcptForGSTIN': ['GSTINNo', 'AmtTurnGrossRcptGSTIN'],
  'PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails': ['IFSCCode', 'BankName', 'BankAccountNo', 'AccountType', 'UseForRefund'],
  'PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails': ['SWIFTCode', 'BankName', 'CountryCode', 'IBAN'],
  'ScheduleIT.TaxPayment': ['BSRCode', 'DateDep', 'SrlNoOfChaln', 'Amt'],
  'ScheduleTDS2.TDSOthThanSalaryDtls': ['TDSCreditName', 'TDSSection', 'TANOfDeductor', 'TaxDeductCreditDtls', 'AmtCarriedFwd'],
  'ScheduleTDS3.TDS3onOthThanSalDtls': ['TDSCreditName', 'TDSSection', 'PANOfBuyerTenant', 'TaxDeductCreditDtls', 'AmtCarriedFwd'],
  'ScheduleTCS.TCSDetails': ['EmployerOrDeductorOrCollectDetl', 'TCSClaimedThisYearDtls', 'AmtCarriedFwd'],
};

/* ── CA-readable labels for key leaves; everything else is humanised ───────── */

const LABELS: Record<string, string> = {
  PAN: 'PAN of the assessee',
  SurNameOrOrgName: 'Name of the firm / AOP / BOI / AJP (organisation name)',
  DateOFFormOrIncorp: 'Date of formation / incorporation',
  StatusOrCompanyType: 'Status (1-Firm, 2-Local Authority, 14-AOP/BOI, 9-AJP)',
  SubStatus: 'Sub-status (LLP / Partnership firm / Co-op society / Trust / …)',
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
  ResidentialStatus: 'Residential status (RES / NRI)',
  ForeignExchangeFlag: 'Unit in an IFSC deriving income solely in convertible foreign exchange? (Y/N)',
  StartUpDPIITFlag: 'Recognised as a start-up by DPIIT? (Y/N)',
  InterMinisterialCertFlag: 'Certified by the Inter-Ministerial Board? (Y/N)',
  FiiFpiFlag: 'Whether FII / FPI? (Y/N)',
  AsseseeRepFlg: 'Return filed by a representative assessee? (Y/N)',
  PartnerInFirmFlg: 'Whether partner in any firm? (Y/N)',
  HeldUnlistedEqShrPrYrFlg: 'Held unlisted equity shares during the previous year? (Y/N)',
  ItrFilingDueDate: 'Due date applicable for filing this return',
  ifMSME: 'Whether recognised as an MSME? (Y/N)',
  LiableSec44AAflg: 'Liable to maintain accounts u/s 44AA? (Y/N)',
  IncDclrdUs: 'Declaring income only u/s 44AD/44ADA/44AE/44B/44BB/44BBA/44BBC/44BBD? (Y/N)',
  LiableSec44ABflg: 'Liable for audit u/s 44AB? (Y/N)',
  LiableSec92Eflg: 'Liable for audit u/s 92E (transfer pricing)? (Y/N)',
  PrevYrMemPartChange: 'Change in partners / members during the previous year? (Y/N)',
  FormName: 'Form name (must be "ITR-5")',
  AssessmentYear: 'Assessment year (must be "2026")',
  SchemaVer: 'Schema version (Ver1.0)',
  FormVer: 'Form version (Ver1.0)',
  Description: 'Form description',
  SWVersionNo: 'Software version number (auto-filled on export)',
  SWCreatedBy: 'Software provider id (auto-filled on export)',
  JSONCreatedBy: 'JSON creator id (auto-filled on export)',
  JSONCreationDate: 'JSON creation date (auto-filled on export)',
  IntermediaryCity: 'Intermediary city (auto-filled on export)',
  Digest: 'Digest (auto-filled on export)',
  AssesseeVerName: 'Name of the person verifying the return',
  FatherName: "Father's name of the person verifying the return",
  AssesseeVerPAN: 'PAN of the person verifying (individual PAN — 4th character "P")',
  Capacity: 'Capacity of the person verifying (MP/DP/PA/PO/ME/LQ/RP/TR/EX/RA/AS/OA)',
  Place: 'Place of verification',
  Date: 'Date of verification',
  RefundDue: 'Refund due (Part B-TTI)',
  BankDtlsFlag: 'Bank account details flag (Y/N)',
  IFSCCode: 'IFSC code of the bank',
  BankAccountNo: 'Bank account number',
  AccountType: 'Type of bank account',
  UseForRefund: 'Nominated for refund credit?',
  TotalTaxesPaid: 'Total taxes paid',
  BalTaxPayable: 'Balance tax payable',
  GrossTotalIncome: 'Gross total income (Part B-TI)',
  TotalIncome: 'Total income (Part B-TI)',
  IncomeFromHP: 'Income from house property (Part B-TI)',
  TotalTI: 'Total of the heads of income (Part B-TI)',
  BSRCode: 'BSR code of the bank branch',
  DateDep: 'Date of deposit of tax',
  SrlNoOfChaln: 'Serial number of the challan',
  Amt: 'Amount deposited',
  TANOfDeductor: 'TAN of the deductor',
  TDSSection: 'Section under which TDS was deducted',
  TDSCreditName: 'TDS credit in the hands of (S-Self / O-Other person)',
  AmtCarriedFwd: 'TDS / TCS amount carried forward',
  DoneeName: 'Name of the donee',
  DoneePAN: 'PAN of the donee',
  NameOfFirm: 'Name of the firm',
  FirmPAN: 'PAN of the firm',
  GSTINNo: 'GSTIN',
  AmtTurnGrossRcptGSTIN: 'Annual value of outward supplies as per the GST return(s)',
  Code: 'Business / profession code',
  PartnerOrMemberName: 'Name of the partner / member',
  SharePercentage: 'Percentage of share',
  RemunerationPaid: 'Remuneration paid to the partner / member',
  RateOfInterest: 'Rate of interest on capital',
  CountryCodeExcludingIndia: 'Country code (other than India)',
  CountryName: 'Country name',
};

const SECTION_HINTS: Record<string, string> = {
  CreationInfo: 'Generated automatically on JSON export',
  Form_ITR5: 'Generated automatically on JSON export (form header)',
  PartA_GEN1: 'Part A — General: assessee information / filing status',
  PartA_GEN2: 'Part A — General (2): audit information, partners & members, nature of business',
  PARTA_BS: 'Part A — Balance Sheet (sources & application of funds)',
  ManufacturingAccount: 'Part A — Manufacturing Account',
  TradingAccount: 'Part A — Trading Account',
  PARTA_PL: 'Part A — Profit and Loss account',
  PARTA_OI: 'Part A — Other Information',
  PARTA_QD: 'Part A — Quantitative Details',
  CorpScheduleBP: 'Schedule BP — Income from business or profession',
  ScheduleHP: 'Schedule HP — Income from house property',
  ScheduleCG: 'Schedule CG — Capital gains',
  ScheduleOS: 'Schedule OS — Income from other sources',
  ScheduleVIA: 'Schedule VI-A — Chapter VI-A deductions',
  ScheduleIF: 'Schedule IF — Information regarding partnership firms',
  ScheduleEI: 'Schedule EI — Exempt income',
  ScheduleIT: 'Schedule IT — Advance tax / self-assessment tax',
  ScheduleTDS2: 'Schedule TDS 2 — TDS on income other than salary (Form 16A)',
  ScheduleTDS3: 'Schedule TDS 3 — TDS u/s 194IA / 194IB / 194M (Form 16B/C/D)',
  ScheduleTCS: 'Schedule TCS — Tax collected at source',
  ScheduleFA: 'Schedule FA — Foreign assets',
  ScheduleGST: 'Schedule GST — Turnover reported under GST',
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

/** Generic totals / row headings get their parent prefixed so the CA can locate them. */
const AMBIGUOUS = new Set([
  'Total', 'Others', 'Amount', 'FrmBank', 'FrmOthrs', 'TotRupeeLoan', 'RupeeLoan',
  'NonResOtherCompany', 'OutstandindMorethanOneYr', 'FrmPersonSpcfdUs40A2b',
  'EquityInstruments', 'ListedEquities', 'UnListedEquities', 'PreferenceShares',
  'GovtOrTrustSecurities', 'DebenturesOrBonds', 'MutualFunds', 'EducationCess',
  'Surcharge', 'HouseProperty', 'CapitalGains', 'OtherSources', 'Dividend',
  'UnderSec115BBF', 'UnderSec115BBG', 'Balance', 'StateCode', 'ZipCode', 'Status',
  'DateofTransfer', 'DateofAcquisition', 'AmtDeducted', 'DeductAmountSec80',
]);

function labelFor(path: string[]): string {
  const leaf = path[path.length - 1];
  if (LABELS[leaf]) return LABELS[leaf];
  const base = humanise(leaf);
  if (AMBIGUOUS.has(leaf) && path.length >= 2) {
    const parent = path[path.length - 2] === '[]' && path.length >= 3
      ? path[path.length - 3]
      : path[path.length - 2];
    return `${humanise(parent)} — ${base}`;
  }
  return base;
}

function hintFor(path: string[]): string | undefined {
  // path = ['ITR', 'ITR5', <section>, …]
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
    // whole required section absent — report once instead of flooding
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

/* ── helpers ───────────────────────────────────────────────────────────────── */

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
function prop(o: unknown, k: string): unknown {
  return o !== null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined;
}
function isDateStr(v: unknown): boolean {
  return typeof v === 'string' && /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v);
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
/** "Has any data": object/array carrying at least one non-empty value. */
function hasData(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).some(
      (x) => (x !== null && typeof x === 'object' ? hasData(x) : !isEmpty(x)),
    );
  }
  return !isEmpty(v);
}

/** Resolve a relative path that may contain "[]" hops, invoking cb on each hit. */
function eachAt(
  node: unknown,
  segs: string[],
  idx: number,
  prefix: string,
  cb: (v: unknown, path: string) => void,
): void {
  if (node === null || node === undefined) return;
  if (idx >= segs.length) { cb(node, prefix); return; }
  const seg = segs[idx];
  if (seg === '[]') {
    if (!Array.isArray(node)) return;
    node.forEach((item, i) => eachAt(item, segs, idx + 1, `${prefix}[${i}]`, cb));
    return;
  }
  if (typeof node !== 'object' || Array.isArray(node)) return;
  eachAt((node as Record<string, unknown>)[seg], segs, idx + 1, `${prefix}.${seg}`, cb);
}

function splitSegs(rel: string): string[] {
  const out: string[] = [];
  for (const s of rel.split('.')) {
    if (s.endsWith('[]')) { out.push(s.slice(0, -2)); out.push('[]'); } else out.push(s);
  }
  return out;
}

/** Element-wise required-column check for every repeating table that is present. */
function walkArrayItems(json: unknown, missing: MissingField[]): void {
  const root = at(json, P);
  if (root === null || root === undefined || typeof root !== 'object') return;
  for (const rel of Object.keys(ARRAY_ITEM_REQUIRED)) {
    const keys = ARRAY_ITEM_REQUIRED[rel];
    const segs = splitSegs(rel);
    const plain = segs.filter((s) => s !== '[]');
    const tableName = humanise(plain[plain.length - 1] || rel);
    const section = segs[0];
    eachAt(root, segs, 0, P, (v, tablePath) => {
      if (!Array.isArray(v)) return;
      v.forEach((item, i) => {
        for (const k of keys) {
          if (isEmpty(prop(item, k))) {
            missing.push({
              path: `${tablePath}[${i}].${k}`,
              label: `${labelFor([...plain, k])} — row ${i + 1} of ${tableName}`,
              hint: SECTION_HINTS[section],
            });
          }
        }
      });
    });
  }
}

/* ── format / identity checks straight from schema patterns & enums ────────── */

const CAPACITY = ['MP', 'DP', 'PA', 'PO', 'ME', 'LQ', 'RP', 'TR', 'EX', 'RA', 'AS', 'OA'];
const SUBSTATUS_ALL = ['4', '5', '8', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20', '21'];
const SUBSTATUS_FIRM = ['5', '10'];                                   // LLP, Partnership firm
const SUBSTATUS_AOPBOI = ['4', '8', '11', '13', '15', '16', '17', '20', '21'];
const SUBSTATUS_AJP = ['12', '18', '19'];
const SUBSTATUS_COOP = ['4', '15', '16', '17'];                       // co-op societies / co-op banks
const DUE_DATES = ['2026-07-31', '2026-08-31', '2026-10-31', '2026-11-30'];
const NOTICE_SECTIONS = [13, 14, 16, 18, 19, 20];                     // 142(1)/148/153C/139(9)/92CD/119(2)(b)
const FY_END = '2026-03-31';
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const TAN_RE = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

function schemaFormatChecks(j: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const chk = (path: string, ok: (v: unknown) => boolean, msg: string, hard = true): void => {
    const v = at(j, path);
    if (isEmpty(v)) return; // absence is the required-tree's job
    if (!ok(v)) (hard ? errors : warnings).push({ path, msg, rule: 'SCHEMA' });
  };
  chk(`${P}.Form_ITR5.FormName`, (v) => str(v) === 'ITR-5', 'FormName must be exactly "ITR-5"');
  chk(`${P}.Form_ITR5.AssessmentYear`, (v) => str(v) === '2026',
    'AssessmentYear must be "2026" for A.Y. 2026-27');
  chk(`${P}.Form_ITR5.SchemaVer`, (v) => str(v) === 'Ver1.0', 'SchemaVer must be "Ver1.0"', false);
  chk(`${P}.Form_ITR5.FormVer`, (v) => str(v) === 'Ver1.0', 'FormVer must be "Ver1.0"', false);
  chk(`${P}.PartA_GEN1.OrgFirmInfo.PAN`, (v) => PAN_RE.test(str(v)),
    'PAN of the assessee is not a valid PAN (format AAAAA9999A)');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.LLPINissuedByMCA`, (v) => /^[A-Z0-9-]{8}$/.test(str(v)),
    'LLPIN issued by MCA must be 8 characters (A-Z, 0-9, "-")', false);
  chk(`${P}.PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp`, isDateStr,
    'Date of formation / incorporation must be in YYYY-MM-DD format');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp`, (v) => str(v) <= FY_END,
    'Date of formation / incorporation cannot be after 31 March 2026');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.StatusOrCompanyType`, (v) => ['1', '2', '14', '9'].includes(str(v)),
    'Status must be 1-Firm, 2-Local Authority, 14-AOP/BOI or 9-AJP');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.SubStatus`, (v) => SUBSTATUS_ALL.includes(str(v)),
    'Sub-status code is not a valid ITR-5 sub-status');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.Address.EmailAddress`,
    (v) => /^[.a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+([a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+)+$/.test(str(v)),
    'E-mail address is not in a valid format');
  chk(`${P}.PartA_GEN1.OrgFirmInfo.Address.PinCode`, (v) => /^[1-9][0-9]{5}$/.test(str(v)),
    'PIN code must be a 6-digit number not starting with 0', false);
  chk(`${P}.PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec`,
    (v) => [11, 12, 13, 14, 16, 17, 18, 19, 20].includes(num(v)),
    'Section of return filing must be one of 11/12/13/14/16/17/18/19/20');
  chk(`${P}.PartA_GEN1.FilingStatus.ResidentialStatus`, (v) => ['RES', 'NRI'].includes(str(v)),
    'Residential status must be RES or NRI');
  chk(`${P}.PartA_GEN1.FilingStatus.ItrFilingDueDate`, (v) => DUE_DATES.includes(str(v)),
    'Due date must be one of 2026-07-31 / 2026-08-31 / 2026-10-31 / 2026-11-30');
  chk(`${P}.PartA_GEN2.AuditInfo.AudFrmPAN`, (v) => PAN_RE.test(str(v)),
    'PAN of the audit firm / proprietor is not a valid PAN');
  chk(`${P}.Verification.Declaration.AssesseeVerPAN`,
    (v) => /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/.test(str(v)),
    'PAN at Verification must be the individual PAN of the signatory (4th character "P")');
  chk(`${P}.Verification.Declaration.Capacity`, (v) => CAPACITY.includes(str(v)),
    'Capacity at Verification must be one of MP/DP/PA/PO/ME/LQ/RP/TR/EX/RA/AS/OA');
  chk(`${P}.Verification.Declaration.Date`, isDateStr, 'Verification date must be in YYYY-MM-DD format');
  chk(`${P}.CreationInfo.JSONCreationDate`, isDateStr,
    'JSON creation date must be in YYYY-MM-DD format', false);

  const YN = ['Y', 'N'];
  const ynPaths: Array<[string, string]> = [
    [`${P}.PartA_GEN1.FilingStatus.BusinessTrustFlag`, 'Business trust flag'],
    [`${P}.PartA_GEN1.FilingStatus.InvstmntFundRefrdSec115UB`, 'Investment fund u/s 115UB flag'],
    [`${P}.PartA_GEN1.FilingStatus.ForeignExchangeFlag`, 'IFSC unit flag'],
    [`${P}.PartA_GEN1.FilingStatus.StartUpDPIITFlag`, 'DPIIT start-up flag'],
    [`${P}.PartA_GEN1.FilingStatus.InterMinisterialCertFlag`, 'Inter-Ministerial Board certificate flag'],
    [`${P}.PartA_GEN1.FilingStatus.FiiFpiFlag`, 'FII / FPI flag'],
    [`${P}.PartA_GEN1.FilingStatus.AsseseeRepFlg`, 'Representative assessee flag'],
    [`${P}.PartA_GEN1.FilingStatus.PartnerInFirmFlg`, 'Partner-in-firm flag'],
    [`${P}.PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg`, 'Unlisted equity shares flag'],
    [`${P}.PartA_GEN1.FilingStatus.ifMSME`, 'MSME flag'],
    [`${P}.PartA_GEN2.LiableSec44AAflg`, 'Liable u/s 44AA flag'],
    [`${P}.PartA_GEN2.IncDclrdUs`, 'Presumptive-income-only flag'],
    [`${P}.PartA_GEN2.LiableSec44ABflg`, 'Liable u/s 44AB flag'],
    [`${P}.PartA_GEN2.LiableSec92Eflg`, 'Liable u/s 92E flag'],
    [`${P}.PartA_GEN2.PrevYrMemPartChange`, 'Change in partners / members flag'],
    [`${P}.PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag`, 'Bank details flag'],
  ];
  for (const [path, label] of ynPaths) {
    chk(path, (v) => YN.includes(str(v)), `${label} must be "Y" or "N"`);
  }
}

/* ── Category A rules — Part A General (Table 2, Sl. nos. 1-80) ────────────── */

function categoryAChecks(j: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const org = `${P}.PartA_GEN1.OrgFirmInfo`;
  const fsP = `${P}.PartA_GEN1.FilingStatus`;
  const rfs = `${fsP}.ReturnFileSec`;
  const g2 = `${P}.PartA_GEN2`;
  const verP = `${P}.Verification.Declaration`;
  const err = (path: string, msg: string, rule: string) => errors.push({ path, msg, rule });
  const warn = (path: string, msg: string, rule: string) => warnings.push({ path, msg, rule });

  const status = str(at(j, `${org}.StatusOrCompanyType`));
  const subStatus = str(at(j, `${org}.SubStatus`));
  const resStatus = str(at(j, `${fsP}.ResidentialStatus`));
  const s44AA = str(at(j, `${g2}.LiableSec44AAflg`));
  const s44AB = str(at(j, `${g2}.LiableSec44ABflg`));
  const s92E = str(at(j, `${g2}.LiableSec92Eflg`));
  const bsFilled = hasData(at(j, `${P}.PARTA_BS.FundSrc`)) || hasData(at(j, `${P}.PARTA_BS.FundApply`));
  const plFilled = hasData(at(j, `${P}.PARTA_PL.CreditsToPL`)) || hasData(at(j, `${P}.PARTA_PL.DebitsToPL`));
  const noBooksBS = hasData(at(j, `${P}.PARTA_BS.NoBooksOfAccBS`));
  const noBooksPL = hasData(at(j, `${P}.PARTA_PL.NoBooksOfAccPL`));

  /* A-1 / A-2 / A-13 — books of account must accompany audit / 44AA liability */
  if (s92E === 'Y' && !(bsFilled && plFilled)) {
    err(`${P}.PARTA_BS`, 'Assessee is liable for audit u/s 92E — Part A Balance Sheet and Part A P&L cannot be blank', 'A-1');
  }
  if (s44AB === 'Y' && !(bsFilled && plFilled)) {
    err(`${P}.PARTA_BS`, 'Assessee is liable for audit u/s 44AB — Part A Balance Sheet and Part A P&L cannot be blank', 'A-2');
  }
  if (s44AA === 'Y' && !(bsFilled && plFilled)) {
    err(`${P}.PARTA_BS`, 'Assessee is liable to maintain accounts u/s 44AA — Part A Balance Sheet and Part A P&L must be filled', 'A-13');
  }
  /* A-10 — no books maintained → the "No accounts case" blocks must be filled */
  if (s44AA === 'N' && !(noBooksBS && noBooksPL)) {
    err(`${P}.PARTA_PL.NoBooksOfAccPL`, '"Accounts maintained as per section 44AA" is "No" — the "No books of accounts" blocks of the Balance Sheet and the P&L must be filled', 'A-10');
  }

  /* A-3 — valid mobile number */
  const mob = str(at(j, `${org}.Address.MobileNo`));
  if (mob !== '' && !/^[1-9][0-9]{9}$/.test(mob)) {
    err(`${org}.Address.MobileNo`, 'Enter a valid 10-digit mobile number in Part A General', 'A-3');
  }

  /* A-4 — unlisted equity shares held → details mandatory */
  if (str(at(j, `${fsP}.HeldUnlistedEqShrPrYrFlg`)) === 'Y'
      && arr(at(j, `${fsP}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`)).length === 0) {
    err(`${fsP}.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls`, '"Held unlisted equity shares during the previous year" is "Yes" — the share-holding details must be provided', 'A-4');
  }
  /* Partner in a firm → Schedule of firms in Part A General */
  if (str(at(j, `${fsP}.PartnerInFirmFlg`)) === 'Y'
      && arr(at(j, `${fsP}.PartnerInFirm.PartnerInFirmDtls`)).length === 0) {
    err(`${fsP}.PartnerInFirm.PartnerInFirmDtls`, '"Whether partner in a firm" is "Yes" — the name and PAN of every such firm must be provided', 'A-4');
  }

  /* A-5 — representative assessee */
  if (str(at(j, `${verP}.Capacity`)) === 'RA') {
    if (str(at(j, `${fsP}.AsseseeRepFlg`)) !== 'Y') {
      err(`${fsP}.AsseseeRepFlg`, 'Capacity at Verification is "Representative assessee" — "Whether this return is being filed by a representative assessee" must be "Yes"', 'A-5');
    }
  }
  if (str(at(j, `${fsP}.AsseseeRepFlg`)) === 'Y' || str(at(j, `${verP}.Capacity`)) === 'RA') {
    for (const f of ['RepName', 'RepEmailID', 'CountryCodeRepMobileNo', 'RepMobileNo']) {
      if (isEmpty(at(j, `${fsP}.AssesseeRep.${f}`))) {
        err(`${fsP}.AssesseeRep.${f}`, `Details of the representative assessee are mandatory in Part A General — ${humanise(f)} is blank`, 'A-5');
      }
    }
  }

  /* A-7 / A-8 — turnover band Rs.1cr–Rs.10cr → cash receipt / payment bands mandatory */
  if (str(at(j, `${g2}.TotalSalesExcOneCr`)) === 'Upto10CR') {
    if (isEmpty(at(j, `${g2}.AgrOFAllAmtsRcvd`))) {
      err(`${g2}.AgrOFAllAmtsRcvd`, 'Turnover band is "More than Rs.1 crore and up to Rs.10 crores" — Sl. No. a2ii (aggregate of all amounts received) cannot be left blank', 'A-7');
    }
    if (isEmpty(at(j, `${g2}.AgrOFAllPayMade`))) {
      err(`${g2}.AgrOFAllPayMade`, 'Turnover band is "More than Rs.1 crore and up to Rs.10 crores" — Sl. No. a2iii (aggregate of all payments made) cannot be left blank', 'A-8');
    }
  }

  /* A-9 — audit report furnishing date cannot be in the future */
  const audDate = str(at(j, `${g2}.AuditInfo.AuditReportFurnishDate`));
  if (audDate !== '' && audDate > todayISO()) {
    err(`${g2}.AuditInfo.AuditReportFurnishDate`, 'Date of furnishing of the audit report cannot be later than the system date', 'A-9');
  }

  /* A-11 — nature of business is mandatory */
  if (arr(at(j, `${g2}.NatOfBus.NatureOfBusiness`)).length === 0) {
    err(`${g2}.NatOfBus.NatureOfBusiness`, 'Disclosure of "Nature of business or profession" is mandatory in ITR-5', 'A-11');
  }

  /* A-12 — PAN at Verification must match a PAN in the partners / members table */
  const members = arr(at(j, `${g2}.PartnerOrMemberInfo`));
  const verPan = str(at(j, `${verP}.AssesseeVerPAN`));
  if (verPan !== '' && members.length > 0) {
    const pans = members.map((m) => str(prop(m, 'PAN'))).filter((p) => p !== '');
    if (pans.length > 0 && !pans.includes(verPan)) {
      err(`${verP}.AssesseeVerPAN`, 'PAN entered at "Verification" must match one of the PANs entered in the PARTNERS / MEMBERS / TRUST information table', 'A-12');
    }
  }

  /* A-14 / A-15 / A-16 / A-17 — status ↔ sub-status matrix */
  if (status === '1' && !SUBSTATUS_FIRM.includes(subStatus)) {
    err(`${org}.SubStatus`, 'Status is "Firm" — sub-status must be "Limited Liability Partnership" (5) or "Partnership Firm" (10) and cannot be left blank', 'A-14');
  }
  if (status === '14' && !SUBSTATUS_AOPBOI.includes(subStatus)) {
    err(`${org}.SubStatus`, 'Status is "AOP / BOI" — sub-status must be one of the permitted AOP/BOI sub-statuses (4/8/11/13/15/16/17/20/21) and cannot be blank', 'A-15');
  }
  if (status === '9' && !SUBSTATUS_AJP.includes(subStatus)) {
    err(`${org}.SubStatus`, 'Status is "Artificial Juridical Person" — sub-status must be Estate of the deceased (12), Estate of the insolvent (18) or Other AJP (19)', 'A-16');
  }
  if (status === '2' && subStatus !== '') {
    err(`${org}.SubStatus`, 'Status is "Local Authority" — the sub-status field must be left blank', 'A-17');
  }

  /* ── 115BAD / 115BAE regime block ── */
  const optNewRegime = num(at(j, `${rfs}.OptingNewTaxRegime`));   // 1 = opting in now, 2 = not opting
  const newTaxRegime = str(at(j, `${rfs}.NewTaxRegime`));         // 115BAD opted in an earlier year
  const bae115Yes = str(at(j, `${fsP}.OptingTaxation115BAEYes`));
  const bae115No = str(at(j, `${fsP}.OptingTaxation115BAENo`));
  const baeOpted = bae115Yes === 'Y' || bae115No === 'Y';
  const doi = str(at(j, `${org}.DateOFFormOrIncorp`));
  const doc = str(at(j, `${org}.DateofBusCommencement`));

  /* A-19 — 115BAD / 115BAE may be opted only by a resident co-operative society */
  if ((optNewRegime === 1 || newTaxRegime === 'Y' || baeOpted)
      && (resStatus === 'NRI' || (subStatus !== '' && !SUBSTATUS_COOP.includes(subStatus)))) {
    err(`${rfs}.OptingNewTaxRegime`, 'Section 115BAD / 115BAE can be opted only by a resident co-operative society', 'A-19');
  }
  /* A-22 / A-23 — Form 10IF particulars */
  if (optNewRegime === 1
      && (isEmpty(at(j, `${rfs}.Form10IFDate`)) || isEmpty(at(j, `${rfs}.Form10IFAckNo`)))) {
    err(`${rfs}.Form10IFDate`, '"Opting it now" is selected for 115BAD — the date of filing of Form 10IF and its acknowledgement number are mandatory', 'A-22');
  }
  if (newTaxRegime === 'Y'
      && (isEmpty(at(j, `${rfs}.Form10IFDate`)) || isEmpty(at(j, `${rfs}.Form10IFAckNo`)))) {
    err(`${rfs}.Form10IFDate`, '115BAD was opted in an earlier year within the due date — the date of filing of Form 10IF and its acknowledgement number are mandatory', 'A-23');
  }
  /* A-34 / A-48 — Form 10IFA particulars for 115BAE */
  if (baeOpted && (isEmpty(at(j, `${fsP}.Form10IFADate`)) || isEmpty(at(j, `${fsP}.Form10IFAAckNo`)))) {
    err(`${fsP}.Form10IFADate`, 'The option u/s 115BAE is exercised — the date of filing of Form 10IFA and its acknowledgement number are mandatory', 'A-34');
  }
  /* A-44 — Form 10IFA filed but 115BAE not opted */
  if (!baeOpted && (hasData(at(j, `${fsP}.Form10IFADate`)) || hasData(at(j, `${fsP}.Form10IFAAckNo`)))) {
    err(`${fsP}.OptingTaxation115BAEYes`, 'Form 10IFA particulars are filled — it is then mandatory to opt for the new tax regime u/s 115BAE', 'A-44');
  }
  /* A-36 / A-47 — 115BAE needs incorporation and commencement on/after 01-04-2023 */
  if (bae115Yes === 'Y') {
    if (doi !== '' && doi < '2023-04-01') {
      err(`${org}.DateOFFormOrIncorp`, 'The option u/s 115BAE is selected — the date of formation / incorporation must be on or after 01 April 2023', 'A-36');
    }
    if (doc !== '' && doc < '2023-04-01') {
      err(`${org}.DateofBusCommencement`, 'The option u/s 115BAE is selected — the date of commencement of business must be on or after 01 April 2023', 'A-47');
    }
  }
  /* A-38 — both regimes at once */
  if ((optNewRegime === 1 || newTaxRegime === 'Y') && baeOpted) {
    err(`${fsP}.OptingTaxation115BAEYes`, 'The new tax regime u/s 115BAD and the new tax regime u/s 115BAE cannot both be selected', 'A-38');
  }
  /* A-53 / A-54 — manufacturing co-operative society: the 115BAE option must be answered */
  if (!isEmpty(at(j, `${fsP}.115BAEReturnFiling_24_25`))
      && isEmpty(at(j, `${fsP}.OptingTaxation115BAEYes`))
      && isEmpty(at(j, `${fsP}.OptingTaxation115BAENo`))) {
    err(`${fsP}.OptingTaxation115BAEYes`, 'The return-filing position for AY 2024-25 / 2025-26 is stated — the option u/s 115BAE at A19 d(iv) must be answered', 'A-53');
  }

  /* A-26 — return in response to a notice → DIN / notice number and date */
  const sec = num(at(j, `${rfs}.IncomeTaxSec`));
  if (NOTICE_SECTIONS.includes(sec)) {
    if (isEmpty(at(j, `${rfs}.NoticeNo`))) {
      err(`${rfs}.NoticeNo`, 'The return is filed in response to a notice / order — the unique number / DIN of the notice is mandatory', 'A-26');
    }
    if (isEmpty(at(j, `${rfs}.NoticeDate`))) {
      err(`${rfs}.NoticeDate`, 'The return is filed in response to a notice / order — the date of the notice / order is mandatory', 'A-26');
    }
  }
  /* Revised return u/s 139(5) → particulars of the original return */
  if (sec === 17 && (isEmpty(at(j, `${fsP}.ReceiptNo`)) || isEmpty(at(j, `${fsP}.OrigRetFiledDate`)))) {
    err(`${fsP}.ReceiptNo`, 'Revised return u/s 139(5) — the acknowledgement number and the date of filing of the original return are mandatory', 'A-26');
  }

  /* A-25 — Schedule 115AD needs FII / FPI = Yes */
  if (hasData(at(j, `${P}.Schedule115AD`)) && str(at(j, `${fsP}.FiiFpiFlag`)) !== 'Y') {
    err(`${fsP}.FiiFpiFlag`, 'Schedule 115AD is filled — "Whether you are FII / FPI?" must be selected as "Yes"', 'A-25');
  }
  if (str(at(j, `${fsP}.FiiFpiFlag`)) === 'Y' && isEmpty(at(j, `${fsP}.SebiRegnNo`))) {
    err(`${fsP}.SebiRegnNo`, '"Whether you are FII / FPI?" is "Yes" — the SEBI registration number is mandatory', 'A-25');
  }

  /* A-28 — date of commencement vs date of incorporation / end of the financial year */
  if (doc !== '') {
    if (doi !== '' && doc < doi) {
      err(`${org}.DateofBusCommencement`, 'The date of commencement of business cannot be before the date of incorporation', 'A-28');
    }
    if (doc > FY_END) {
      err(`${org}.DateofBusCommencement`, 'The date of commencement of business cannot be after the end of the financial year (31 March 2026)', 'A-28');
    }
  }

  /* A-29 / A-32 — partners / members table must be filled for these sub-statuses */
  if (SUBSTATUS_FIRM.includes(subStatus) && members.length === 0) {
    err(`${g2}.PartnerOrMemberInfo`, 'Sub-status is LLP / Partnership Firm — Table A (partners / members information) in Part A General 2 cannot be blank', 'A-29');
  }
  if (['8', '11', '20', '21'].includes(subStatus) && members.length === 0) {
    err(`${g2}.PartnerOrMemberInfo`, 'Sub-status is Society / Business Trust / Investment Fund / any other AOP-BOI — Table A (members information) in Part A General 2 cannot be blank', 'A-32');
  }
  /* A-33 — a foreign-company member must carry a non-zero share */
  members.forEach((m, i) => {
    if (str(prop(m, 'PartnerForeignCompFlg')) === 'Y' && num(prop(m, 'PercentageOfShareForeignComp')) <= 0) {
      err(`${g2}.PartnerOrMemberInfo[${i}].PercentageOfShareForeignComp`, 'A member of the AOP / BOI / AJP is a foreign company — the percentage of share of the foreign company cannot be zero', 'A-33');
    }
  });

  /* ── Table F — private discretionary trust (Sl. nos. 20, 21, 30, 31, 77-80) ── */
  const pdtP = `${g2}.PvtDiscretioneryTrust`;
  const f1 = str(at(j, `${pdtP}.PvtDiscTrustShareFlg`));
  const f2 = str(at(j, `${pdtP}.PvtDiscTrustBusIncFlg`));
  const f3 = str(at(j, `${pdtP}.PvtDiscTrustWillFlg`));
  const f4Keys = ['PvtDiscTrustBasicFlg', 'PvtDiscTrustReceivableFlg',
    'PvtDiscTrustRelativesFlg', 'PvtDiscTrustBusProfFlg'];
  if (subStatus === '13' && (f1 === '' || f2 === '')) {
    err(pdtP, 'Sub-status is "Trust other than a trust eligible to file ITR-7" — Sl. No. 1 and Sl. No. 2 of Table F in Part A General 2 cannot be blank', 'A-30');
  }
  if (f1 === 'Y' && members.length > 0) {
    const totShare = members.reduce<number>((s, m) => s + num(prop(m, 'SharePercentage')), 0);
    if (Math.abs(totShare - 100) > 0.01) {
      err(`${g2}.PartnerOrMemberInfo`, `Table F Sl. No. 1 is "Yes" — the sum of "Percentage of share (if determinate)" must equal 100 (currently ${totShare})`, 'A-21');
    }
  }
  if (f2 === 'N' && num(at(j, `${P}.PartB-TI.ProfBusGain.TotProfBusGain`)) !== 0) {
    err(`${P}.PartB-TI.ProfBusGain.TotProfBusGain`, 'Table F Sl. No. 2 is "No" — profits and gains from business or profession cannot be declared at Part B-TI Sl. No. 2v', 'A-20');
  }
  if (f2 === 'Y' && f3 === '') {
    err(`${pdtP}.PvtDiscTrustWillFlg`, 'Table F Sl. No. 2 is "Yes" — the answer to Sl. No. F(3) is mandatory', 'A-77');
  }
  if (f2 === 'N' && f3 !== '') {
    err(`${pdtP}.PvtDiscTrustWillFlg`, 'Table F Sl. No. 2 is "No" — Sl. No. F(3) must be blank or null', 'A-78');
  }
  if (f1 === 'N' && f2 === 'N') {
    for (const k of f4Keys) {
      if (isEmpty(at(j, `${pdtP}.${k}`))) {
        err(`${pdtP}.${k}`, 'Table F Sl. Nos. 1 and 2 are both "No" — the answers to items (i) to (iv) of Sl. No. F(4) are mandatory', 'A-79');
      }
    }
  }
  if (f1 === 'Y' || f2 === 'Y') {
    for (const k of f4Keys) {
      if (!isEmpty(at(j, `${pdtP}.${k}`))) {
        err(`${pdtP}.${k}`, 'Table F Sl. No. 1 or Sl. No. 2 is "Yes" — the items of Sl. No. F(4) must be left blank', 'A-80');
      }
    }
  }

  /* A-41 — MSME / DPIIT / Inter-Ministerial Board registration numbers */
  if (str(at(j, `${fsP}.ifMSME`)) === 'Y' && isEmpty(at(j, `${fsP}.RegNumMSMEDAct2006`))) {
    err(`${fsP}.RegNumMSMEDAct2006`, '"Recognised as MSME" is "Yes" — the MSMED Act 2006 registration number is mandatory', 'A-41');
  }
  if (str(at(j, `${fsP}.StartUpDPIITFlag`)) === 'Y' && isEmpty(at(j, `${fsP}.RecgnNumAllottedByDPIIT`))) {
    err(`${fsP}.RecgnNumAllottedByDPIIT`, 'Recognised as a start-up by DPIIT — the recognition number allotted by DPIIT is mandatory', 'A-41');
  }
  if (str(at(j, `${fsP}.InterMinisterialCertFlag`)) === 'Y' && isEmpty(at(j, `${fsP}.CertificationNumber`))) {
    err(`${fsP}.CertificationNumber`, 'Certified by the Inter-Ministerial Board — the certification number is mandatory', 'A-41');
  }
  /* A-42 — the condition attracting the 44AB audit must be selected */
  if (s44AB === 'Y' && isEmpty(at(j, `${g2}.Cndnfor44AB`))) {
    err(`${g2}.Cndnfor44AB`, 'Liable for audit u/s 44AB — the condition by virtue of which the assessee is liable must be selected', 'A-42');
  }
  if (s44AB === 'Y' && isEmpty(at(j, `${g2}.AuditInfo.AudFrmPAN`))) {
    err(`${g2}.AuditInfo.AudFrmPAN`, 'Liable for audit u/s 44AB — the PAN of the audit firm / proprietor is mandatory', 'A-42');
  }
  if (s92E === 'Y' && !hasData(at(j, `${g2}.AuditDetails92E`))) {
    err(`${g2}.AuditDetails92E`, 'Liable for audit u/s 92E — the date of audit and the acknowledgement number of Form 3CEB are mandatory', 'A-42');
  }
  /* A-45 / A-46 / A-164 — turnover & cash-band combinations that force a 44AB audit */
  if (str(at(j, `${g2}.AgrOFAllAmtsRcvd`)) === 'MoreThan5Per' && s44AB !== 'Y') {
    err(`${g2}.LiableSec44ABflg`, 'Sl. No. a2ii is "More than 5%" — the assessee is liable for audit u/s 44AB, so "Whether liable for audit u/s 44AB?" must be "Yes"', 'A-45');
  }
  if (str(at(j, `${g2}.AgrOFAllPayMade`)) === 'MoreThan5Per' && s44AB !== 'Y') {
    err(`${g2}.LiableSec44ABflg`, 'Sl. No. a2iii is "More than 5%" — the assessee is liable for audit u/s 44AB, so "Whether liable for audit u/s 44AB?" must be "Yes"', 'A-46');
  }
  if (str(at(j, `${g2}.TotalSalesExcOneCr`)) === 'MoreThan10CR' && s44AB !== 'Y') {
    err(`${g2}.LiableSec44ABflg`, 'Sales / turnover / gross receipts exceed Rs.10 crores — "Whether liable for audit u/s 44AB?" must be "Yes"', 'A-164');
  }

  /* ── Form 10IEA block (Sl. nos. 49, 51, 63-72) ── */
  const iea = (k: string) => str(at(j, `${fsP}.${k}`));
  const ieaEarlierOld = iea('Form10IEAEarlierAYOldRegime');
  const ieaEarlierNew = iea('F10IEAEarlierAYNewRegime');
  const ieaCurrNew = iea('F10IEACurrAYNewRegime');
  const ieaCurrOld = iea('F10IEACurrAYOldRegime');
  if (ieaEarlierOld === 'Y'
      && (isEmpty(at(j, `${fsP}.Form10IEAAssYear`)) || isEmpty(at(j, `${fsP}.Form10IEAEarlierAYAckOldRegime`)))) {
    err(`${fsP}.Form10IEAAssYear`, 'Form 10IEA was filed within the due date for an earlier assessment year — the assessment year and the acknowledgement number of that Form 10IEA are mandatory', 'A-49');
  }
  if (ieaEarlierOld !== 'Y'
      && (hasData(at(j, `${fsP}.Form10IEAAssYear`)) || hasData(at(j, `${fsP}.Form10IEAEarlierAYAckOldRegime`)))) {
    err(`${fsP}.Form10IEAAssYear`, 'Earlier-year Form 10IEA details may be provided only when "Have you filed Form 10IEA within the due date for any earlier assessment year?" is "Yes"', 'A-71');
  }
  if (ieaEarlierNew === 'Y'
      && (isEmpty(at(j, `${fsP}.AssYrF10IEANewTaxReg`)) || isEmpty(at(j, `${fsP}.Form10IEAEarlierAYAckNewRegime`)))) {
    err(`${fsP}.AssYrF10IEANewTaxReg`, 'Form 10IEA was filed in an earlier year to re-enter the new tax regime — the assessment year and the acknowledgement number of that Form 10IEA are mandatory', 'A-64');
  }
  if (ieaEarlierNew !== 'Y'
      && (hasData(at(j, `${fsP}.AssYrF10IEANewTaxReg`)) || hasData(at(j, `${fsP}.Form10IEAEarlierAYAckNewRegime`)))) {
    err(`${fsP}.AssYrF10IEANewTaxReg`, 'Re-entry Form 10IEA details for earlier years may be provided only when the corresponding question is answered "Yes"', 'A-72');
  }
  if (ieaCurrNew === 'Y'
      && (isEmpty(at(j, `${fsP}.F10IEADateCurrAYNewTax`)) || isEmpty(at(j, `${fsP}.F10IEAAckNoCurrAYNewTax`)))) {
    err(`${fsP}.F10IEADateCurrAYNewTax`, 'Form 10IEA is furnished to re-enter the new tax regime in the current assessment year — its date of filing and acknowledgement number are mandatory', 'A-66');
  }
  if (ieaCurrNew !== 'Y'
      && (hasData(at(j, `${fsP}.F10IEADateCurrAYNewTax`)) || hasData(at(j, `${fsP}.F10IEAAckNoCurrAYNewTax`)))) {
    err(`${fsP}.F10IEADateCurrAYNewTax`, 'Form 10IEA was not filed in the current assessment year to re-enter the new tax regime, yet its details are provided', 'A-67');
  }
  if (ieaCurrOld === 'Y'
      && (isEmpty(at(j, `${fsP}.F10IEADateCurrAYOldTax`)) || isEmpty(at(j, `${fsP}.F10IEAAckNoCurrAYOldTax`)))) {
    err(`${fsP}.F10IEADateCurrAYOldTax`, 'Form 10IEA is furnished within the due date to opt for the old tax regime — its date of filing and acknowledgement number are mandatory', 'A-69');
  }
  if (ieaCurrOld !== 'Y'
      && (hasData(at(j, `${fsP}.F10IEADateCurrAYOldTax`)) || hasData(at(j, `${fsP}.F10IEAAckNoCurrAYOldTax`)))) {
    err(`${fsP}.F10IEADateCurrAYOldTax`, 'Form 10IEA details for the current assessment year must not be provided when the form has not been filed', 'A-70');
  }
  /* A-51 — opting out of / withdrawing from the new regime requires Form 10IEA */
  if (str(at(j, `${fsP}.OptOldRegimeCurrAY`)) === 'Y' && ieaCurrOld !== 'Y') {
    err(`${fsP}.F10IEACurrAYOldRegime`, 'The new tax regime can be opted out of or withdrawn only if Form 10IEA is filed', 'A-51');
  }

  /* ── Business-income consistency (Sl. nos. 52, 58, 61, 75) ── */
  const busInc = hasData(at(j, `${P}.CorpScheduleBP`))
    || num(at(j, `${P}.PartB-TI.ProfBusGain.TotProfBusGain`)) !== 0
    || hasData(at(j, `${P}.PARTA_PL.CreditsToPL`));
  const incFrmBus = str(at(j, `${fsP}.IncFrmBusOrProf`));
  if (busInc && incFrmBus === 'N') {
    err(`${fsP}.IncFrmBusOrProf`, 'Business income is declared in the return — "Do you have income from business or profession for the current assessment year?" cannot be selected as "No"', 'A-52');
  }
  if (busInc && incFrmBus === '') {
    err(`${fsP}.IncFrmBusOrProf`, 'Business income is present — Sl. No. A19(b)(I) "Do you have income from business or profession?" must be answered', 'A-61');
  }
  if (!busInc && (ieaCurrOld === 'Y' || ieaCurrNew === 'Y')) {
    warn(`${fsP}.IncFrmBusOrProf`, 'Form 10IEA options are exercised at Sl. No. A19(d)(i) but no business income is reported — business income is expected', 'A-75');
  }

  /* ── Due-date consistency (Sl. nos. 56-58) ── */
  const dueDate = str(at(j, `${fsP}.ItrFilingDueDate`));
  const auditPresent = hasData(at(j, `${g2}.AuditInfo`)) || arr(at(j, `${g2}.AuditDetails`)).length > 0
    || s44AB === 'Y' || str(at(j, `${g2}.AccountAuditFlag`)) === 'Y';
  const schIF = hasData(at(j, `${P}.ScheduleIF`));
  if (dueDate === '2026-10-31' && !auditPresent && !schIF) {
    err(`${fsP}.ItrFilingDueDate`, 'Due date 31 October 2026 is selected — Schedule IF or the audit details in Part A General must be filled', 'A-56');
  }
  if (dueDate === '2026-11-30' && !schIF && s92E !== 'Y' && !hasData(at(j, `${g2}.AuditDetails92E`))) {
    err(`${fsP}.ItrFilingDueDate`, 'Due date 30 November 2026 is selected — Schedule IF or the section 92E audit details in Part A General must be filled', 'A-57');
  }
  if (dueDate === '2026-08-31' && !busInc) {
    err(`${fsP}.ItrFilingDueDate`, 'Due date 31 August 2026 can be selected only when there is income from business or profession', 'A-58');
  }

  /* A-73 / A-74 — secondary address */
  const secAdd = str(at(j, `${org}.SecondaryAdd`));
  if (secAdd === '') {
    err(`${org}.SecondaryAdd`, 'The secondary-address question ("Is the secondary address the same as the primary address?") is mandatory in Part A General', 'A-73');
  }
  if (secAdd === 'N' && !hasData(at(j, `${org}.AlternateAddress`))) {
    err(`${org}.AlternateAddress`, 'The secondary address is stated to be different from the primary address — the alternate address must be provided', 'A-74');
  }

  /* A-76 — change in partners / members → admitted / retired details */
  if (str(at(j, `${g2}.PrevYrMemPartChange`)) === 'Y'
      && arr(at(j, `${g2}.PrevYrMemPart.PrevYrMemPartDtls`)).length === 0) {
    err(`${g2}.PrevYrMemPart.PrevYrMemPartDtls`, 'There was a change in the partners / members during the previous year — details of the admitted / retired partners must be provided', 'A-76');
  }
}

/* ── Category A rules — schedules & Part B (Table 2, Sl. nos. 81-866) ──────── */

function categoryAChecks2(j: unknown, errors: MandatoryIssue[], warnings: MandatoryIssue[]): void {
  const org = `${P}.PartA_GEN1.OrgFirmInfo`;
  const fsP = `${P}.PartA_GEN1.FilingStatus`;
  const g2 = `${P}.PartA_GEN2`;
  const pl = `${P}.PARTA_PL`;
  const bp = `${P}.CorpScheduleBP`;
  const bti = `${P}.PartB-TI`;
  const btti = `${P}.PartB_TTI`;
  const err = (path: string, msg: string, rule: string) => errors.push({ path, msg, rule });
  const warn = (path: string, msg: string, rule: string) => warnings.push({ path, msg, rule });

  const status = str(at(j, `${org}.StatusOrCompanyType`));
  const subStatus = str(at(j, `${org}.SubStatus`));
  const resStatus = str(at(j, `${fsP}.ResidentialStatus`));
  const s44AB = str(at(j, `${g2}.LiableSec44ABflg`));

  /* A-190 — Part A-OI Sl. No. 17 "Yes" → Schedule TPSA must be filled */
  if (str(at(j, `${P}.PARTA_OI.ScheduleTPSAFlg`)) === 'Y' && !hasData(at(j, `${P}.ScheduleTPSA`))) {
    err(`${P}.ScheduleTPSA`, 'Part A-OI Sl. No. 17 (option u/s 92CE(2A)) is "Yes" — Schedule TPSA must be filled', 'A-190');
  }

  /* ── Schedule HP ── */
  arr(at(j, `${P}.ScheduleHP.PropertyDetails`)).forEach((pr, i) => {
    const base = `${P}.ScheduleHP.PropertyDetails[${i}]`;
    const rent = prop(pr, 'Rentdetails');
    /* A-206 — interest u/s 24(b) claimed → lender-wise details mandatory */
    if (num(prop(rent, 'IntOnBorwCap')) > 0
        && arr(prop(prop(rent, 'Section24B'), 'Section24BDtls')).length === 0) {
      err(`${base}.Rentdetails.Section24B.Section24BDtls`, 'Interest on borrowed capital u/s 24(b) is claimed — the lender-wise details of the loan are mandatory', 'A-206');
    }
    /* A-198 — let-out / deemed let-out property must carry a gross rent */
    const letOut = str(prop(pr, 'ifLetOut'));
    if ((letOut === 'L' || letOut === 'D') && num(prop(rent, 'AnnualLetableValue')) <= 0) {
      err(`${base}.Rentdetails.AnnualLetableValue`, 'The property is let out / deemed let out — the gross rent received, receivable or lettable value cannot be zero or blank', 'A-198');
    }
    /* Co-owned property → co-owner table and the assessee\'s share */
    if (str(prop(pr, 'PropCoOwnedFlg')) === 'Y') {
      if (arr(prop(pr, 'CoOwners')).length === 0) {
        err(`${base}.CoOwners`, 'The property is co-owned — the details of every co-owner must be provided', 'A-195');
      }
      if (isEmpty(prop(pr, 'AssessePercentShareProp'))) {
        err(`${base}.AssessePercentShareProp`, 'The property is co-owned — the percentage share of the assessee in the property is mandatory', 'A-195');
      }
    }
  });

  /* ── Part A P&L — presumptive blocks ── */
  const inc44AD = num(at(j, `${pl}.PersumptiveInc44AD.TotPersumptiveInc44AD`));
  const rec44AD = num(at(j, `${pl}.PersumptiveInc44AD.GrsTrnOverOrReceipt`));
  const inc44ADA = num(at(j, `${pl}.PersumptiveInc44ADA.TotPersumptiveInc44ADA`));
  const rec44ADA = num(at(j, `${pl}.PersumptiveInc44ADA.GrsReceipt`));
  const inc44AE = num(at(j, `${pl}.TotalPrsumptvIncUs44E`));
  if ((inc44AD > 0 || rec44AD > 0) && arr(at(j, `${pl}.NatOfBus44AD`)).length === 0) {
    err(`${pl}.NatOfBus44AD`, 'Income is declared u/s 44AD — the name of the business and the business code at Sl. No. 62 of the P&L are mandatory', 'A-135');
  }
  if ((inc44ADA > 0 || rec44ADA > 0) && arr(at(j, `${pl}.NatOfBus44ADA`)).length === 0) {
    err(`${pl}.NatOfBus44ADA`, 'Income is declared u/s 44ADA — the name of the profession and the profession code at Sl. No. 63 of the P&L are mandatory', 'A-137');
  }
  if (inc44AE > 0 && arr(at(j, `${pl}.NatOfBus44AE`)).length === 0) {
    err(`${pl}.NatOfBus44AE`, 'Income is declared u/s 44AE — the name of the business and the business code at Sl. No. 64 of the P&L are mandatory', 'A-139');
  }
  /* A-145 — goods-carriage table mandatory when 44AE income is declared */
  if (inc44AE > 0 && arr(at(j, `${pl}.GoodsDtlsUs44AE`)).length === 0) {
    err(`${pl}.GoodsDtlsUs44AE`, 'Total presumptive income from goods carriages u/s 44AE is greater than zero — table 64(i) (vehicle-wise details) must be filled', 'A-145');
  }
  /* A-151 / A-250 — 44AD / 44ADA only for a resident partnership firm */
  if ((inc44AD > 0 || inc44ADA > 0)
      && (resStatus === 'NRI' || status !== '1')) {
    err(`${pl}.PersumptiveInc44AD`, 'Presumptive income u/s 44AD / 44ADA can be declared only by a resident partnership firm', 'A-151');
  }
  /* A-248 — presumptive income declared → balance-sheet particulars mandatory */
  if ((inc44AD > 0 || inc44ADA > 0 || inc44AE > 0)
      && !hasData(at(j, `${P}.PARTA_BS.NoBooksOfAccBS`))
      && !hasData(at(j, `${P}.PARTA_BS.FundSrc`))) {
    err(`${P}.PARTA_BS`, 'Income is declared u/s 44AD / 44ADA / 44AE — the balance-sheet particulars under "Regular books of accounts" or under "No accounts case" are mandatory', 'A-248');
  }
  /* A-168 to A-171 — presumptive receipt ceilings that force a 44AB audit */
  if (rec44ADA > 7500000 && s44AB !== 'Y') {
    err(`${g2}.LiableSec44ABflg`, 'Gross receipts u/s 44ADA exceed Rs.75,00,000 — a tax audit u/s 44AB is mandatory', 'A-170');
  }
  if (rec44AD > 30000000 && s44AB !== 'Y') {
    err(`${g2}.LiableSec44ABflg`, 'Gross receipts u/s 44AD exceed Rs.3 crores — a tax audit u/s 44AB is mandatory', 'A-171');
  }
  /* A-162 / A-179 — bad debts written off need debtor particulars */
  const bd = `${pl}.DebitsToPL.DebitPlAcnt.BadDebtDtls`;
  if (num(at(j, `${bd}.BadDebt`)) > 0
      && arr(at(j, `${bd}.BadDebtAmtDtls`)).length === 0
      && arr(at(j, `${bd}.OthersPANNotAvlblDtl`)).length === 0
      && num(at(j, `${bd}.OthersAmtLt1Lakh`)) <= 0) {
    err(`${bd}.BadDebtAmtDtls`, 'Bad debts are debited to the P&L — the PAN / Aadhaar of the debtors (Sl. No. 48(i)), or the name and address where no PAN is available, must be provided', 'A-162');
  }

  /* A-246 — specified business income → nature of the specified business */
  if (num(at(j, `${bp}.IncSpecifiedBusiness.ProfitLossSpecifiedBusiness`)) !== 0
      && arr(at(j, `${bp}.IncSpecifiedBusiness.DedUs35ADSubSec5Dtls`)).length === 0) {
    err(`${bp}.IncSpecifiedBusiness.DedUs35ADSubSec5Dtls`, 'Income / loss from a specified business is entered — the nature of the specified business at Sl. No. 49 of Schedule BP must be selected', 'A-246');
  }
  /* A-249 — section 115BBF income only for a resident */
  if (num(at(j, `${bp}.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBF`)) !== 0
      && resStatus === 'NRI') {
    err(`${bp}.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBF`, 'Income u/s 115BBF can be claimed only by a resident assessee', 'A-249');
  }

  /* ── Chapter VI-A ↔ supporting schedules ── */
  const via = `${P}.ScheduleVIA.UsrDeductUndChapVIA`;
  const claim = (k: string) => num(at(j, `${via}.${k}`)) + num(at(j, `${P}.ScheduleVIA.DeductUndChapVIA.${k}`));
  if (claim('Section80GGC') > 0 && arr(at(j, `${P}.Schedule80GGC.Schedule80GGCDetails`)).length === 0) {
    err(`${P}.Schedule80GGC.Schedule80GGCDetails`, 'Deduction u/s 80GGC is claimed in Schedule VI-A — the contribution details must be filled in Schedule 80GGC', 'A-583');
  }
  if (claim('Section80GGA') > 0 && arr(at(j, `${P}.Schedule80GGA.DonationDtlsSciRsrchRuralDev`)).length === 0) {
    err(`${P}.Schedule80GGA.DonationDtlsSciRsrchRuralDev`, 'Deduction u/s 80GGA is claimed in Schedule VI-A but the donation details are not provided in Schedule 80GGA', 'A-595');
  }
  if (claim('Section80G') > 0) {
    const donees = ['Don100Percent', 'Don50PercentNoApprReqd', 'Don100PercentApprReqd', 'Don50PercentApprReqd']
      .reduce((n, k) => n + arr(at(j, `${P}.Schedule80G.${k}.DoneeDetail`)).length, 0);
    if (donees === 0) {
      err(`${P}.Schedule80G`, 'Deduction u/s 80G is claimed in Schedule VI-A — the donee-wise donation details must be provided in Schedule 80G', 'A-607');
    }
  }
  if (claim('Section80P') > 0 && !hasData(at(j, `${P}.Schedule80P`))) {
    err(`${P}.Schedule80P`, 'Deduction u/s 80P is claimed in Schedule VI-A but Schedule 80P is not filled', 'A-666');
  }
  if (claim('Section80IA') > 0 && !hasData(at(j, `${P}.Schedule80_IA`))) {
    err(`${P}.Schedule80_IA`, 'Deduction u/s 80-IA is claimed in Schedule VI-A but Schedule 80-IA is not filled', 'A-645');
  }
  if (claim('Section80IB') > 0 && !hasData(at(j, `${P}.Schedule80_IB`))) {
    err(`${P}.Schedule80_IB`, 'Deduction u/s 80-IB is claimed in Schedule VI-A but Schedule 80-IB is not filled', 'A-647');
  }
  if (claim('Section80IC') > 0 && !hasData(at(j, `${P}.Schedule80_IC`))) {
    err(`${P}.Schedule80_IC`, 'Deduction u/s 80-IC / 80-IE is claimed in Schedule VI-A but Schedule 80-IC is not filled', 'A-649');
  }
  if (claim('Section80IAC') > 0 && !hasData(at(j, `${P}.Schedule80IAC`))) {
    err(`${P}.Schedule80IAC`, 'Deduction u/s 80-IAC is claimed in Schedule VI-A but Schedule 80-IAC is not filled', 'A-668');
  }
  if ((claim('Section80LA') > 0 || claim('Section80LA_1A') > 0)
      && arr(at(j, `${P}.Schedule80LA.Schedule80LADtls`)).length === 0) {
    err(`${P}.Schedule80LA.Schedule80LADtls`, 'Deduction u/s 80LA(1) / 80LA(1A) is claimed in Schedule VI-A but Schedule 80LA is not filled', 'A-670');
  }
  /* A-663 — 80LA(1) and 80LA(1A) cannot both be claimed */
  if (claim('Section80LA') > 0 && claim('Section80LA_1A') > 0) {
    err(`${via}.Section80LA`, 'In Schedule VI-A, deduction u/s 80LA(1) and u/s 80LA(1A) cannot both be claimed', 'A-663');
  }
  /* A-664 / A-665 — 80LA(1A) needs an IFSC unit, 80LA(1) needs the flag to be "No" */
  const ifscFlag = str(at(j, `${fsP}.ForeignExchangeFlag`));
  if (claim('Section80LA_1A') > 0 && ifscFlag !== 'Y') {
    err(`${fsP}.ForeignExchangeFlag`, 'Deduction u/s 80LA(1A) can be claimed only when "Whether any unit is located in an IFSC …" is selected as "Yes" in Part A General', 'A-664');
  }
  if (claim('Section80LA') > 0 && ifscFlag === 'Y') {
    err(`${fsP}.ForeignExchangeFlag`, 'Deduction u/s 80LA(1) can be claimed only when "Whether any unit is located in an IFSC …" is selected as "No" in Part A General', 'A-665');
  }
  /* A-615 — Schedule 80-IAC needs DPIIT recognition */
  if (hasData(at(j, `${P}.Schedule80IAC`)) && str(at(j, `${fsP}.StartUpDPIITFlag`)) !== 'Y') {
    err(`${fsP}.StartUpDPIITFlag`, 'Schedule 80-IAC is filled — "Whether you are recognised as a start-up by DPIIT" must be "Yes" in Part A General', 'A-615');
  }
  /* A-614 — 80-IAC only for entities incorporated after 01 April 2016 */
  const doiStr = str(at(j, `${org}.DateOFFormOrIncorp`));
  if (num(at(j, `${P}.Schedule80IAC.AmtDedCurAY`)) > 0 && doiStr !== '' && doiStr < '2016-04-01') {
    err(`${P}.Schedule80IAC.AmtDedCurAY`, 'Deduction u/s 80-IAC can be claimed only by entities incorporated on or after 01 April 2016', 'A-614');
  }
  /* A-616 — 80LA rows must state the sub-section and the entity / income type */
  arr(at(j, `${P}.Schedule80LA.Schedule80LADtls`)).forEach((r, i) => {
    for (const k of ['SubSecDedClmd', 'EntityType', 'IncmTypeUnt']) {
      if (isEmpty(prop(r, k))) {
        err(`${P}.Schedule80LA.Schedule80LADtls[${i}].${k}`, `Schedule 80LA row ${i + 1}: ${humanise(k)} must be selected for the deduction claimed`, 'A-616');
      }
    }
  });
  /* A-653 — 80P is available only to co-operative societies */
  if (claim('Section80P') > 0 && subStatus !== '' && !SUBSTATUS_COOP.includes(subStatus)) {
    err(`${via}.Section80P`, 'Deduction u/s 80P can be claimed only by a Primary Agricultural Credit Society, a Primary Co-operative Agricultural and Rural Development Bank or another co-operative society', 'A-653');
  }

  /* ── Part B-TI ↔ schedules ── */
  if (num(at(j, `${bti}.DeductionsUnder10Aor10AA`)) > 0 && !hasData(at(j, `${P}.Schedule10AA`))) {
    err(`${P}.Schedule10AA`, 'A deduction u/s 10AA is claimed at Part B-TI Sl. No. 12 — Schedule 10AA must be filled', 'A-799');
  }
  if (num(at(j, `${bti}.DeductionsUndSchVIADtl.PartBchapterVIA`)) > 0
      && !hasData(at(j, `${P}.ScheduleVIA`))) {
    err(`${P}.ScheduleVIA`, 'Deductions are claimed at Part B-TI Sl. No. 11a — Part B of Schedule VI-A must be filled', 'A-802');
  }
  if (num(at(j, `${bti}.DeductionsUndSchVIADtl.PartCchapterVIA`)) > 0
      && !hasData(at(j, `${P}.ScheduleVIA`))) {
    err(`${P}.ScheduleVIA`, 'Deductions are claimed at Part B-TI Sl. No. 11b — Part C of Schedule VI-A must be filled', 'A-803');
  }
  /* A-821 — tax computed although the gross total income is nil */
  if (num(at(j, `${bti}.GrossTotalIncome`)) <= 0
      && num(at(j, `${btti}.ComputationOfTaxLiability.GrossTaxPayable`)) > 0) {
    warn(`${btti}.ComputationOfTaxLiability.GrossTaxPayable`, 'A tax computation is disclosed in Part B-TTI although the gross total income in Part B-TI is nil', 'A-821');
  }

  /* A-737 — agricultural income above Rs.5,00,000 → land details */
  if (num(at(j, `${P}.ScheduleEI.NetAgriIncOrOthrIncRule7`)) > 500000
      && arr(at(j, `${P}.ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls`)).length === 0) {
    err(`${P}.ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls`, 'Agricultural income in Schedule EI exceeds Rs.5,00,000 — the details of the agricultural land must be provided', 'A-737');
  }

  /* A-761 — accreted income u/s 115TD needs the specified date */
  if (num(at(j, `${P}.Schedule115TD.AccretedIncomeSection115TD`)) > 0
      && isEmpty(at(j, `${P}.Schedule115TD.SpecifiedDateUs115TD`))) {
    err(`${P}.Schedule115TD.SpecifiedDateUs115TD`, 'Accreted income u/s 115TD is entered — the specified date u/s 115TD (Sl. No. 9) cannot be blank', 'A-761');
  }

  /* A-765 / A-774 — Schedules FSI and TR are not applicable to non-residents */
  if (resStatus === 'NRI' && hasData(at(j, `${P}.ScheduleFSI`))) {
    err(`${P}.ScheduleFSI`, 'Schedule FSI is not applicable to a non-resident assessee', 'A-765');
  }
  if (resStatus === 'NRI' && hasData(at(j, `${P}.ScheduleTR1`))) {
    err(`${P}.ScheduleTR1`, 'Schedule TR is not applicable to a non-resident assessee', 'A-774');
  }

  /* A-777 / A-840 — foreign assets flag ↔ Schedule FA */
  const faFlag = str(at(j, `${btti}.AssetOutsideIndiaFlg`));
  if (faFlag === 'Y' && !hasData(at(j, `${P}.ScheduleFA`))) {
    err(`${P}.ScheduleFA`, 'Sl. No. 17 of Part B-TTI (assets outside India) is "Yes" — Schedule FA is mandatory', 'A-840');
  }
  if (faFlag !== 'Y' && hasData(at(j, `${P}.ScheduleFA`))) {
    warn(`${btti}.AssetOutsideIndiaFlg`, 'Schedule FA carries foreign-asset details — Sl. No. 17 of Part B-TTI should be answered "Yes"', 'A-777');
  }

  /* A-779 / A-780 — Schedule GST rows need both the GSTIN and the turnover */
  if (hasData(at(j, `${P}.ScheduleGST`))
      && arr(at(j, `${P}.ScheduleGST.TurnoverGrsRcptForGSTIN`)).length === 0) {
    err(`${P}.ScheduleGST.TurnoverGrsRcptForGSTIN`, 'Schedule GST is present — every row must carry both the GSTIN and the annual value of outward supplies', 'A-779');
  }

  /* ── Schedules TDS 2 / TDS 3 / TCS / IT ── */
  arr(at(j, `${P}.ScheduleTDS2.TDSOthThanSalaryDtls`)).forEach((r, i) => {
    const base = `${P}.ScheduleTDS2.TDSOthThanSalaryDtls[${i}]`;
    const tan = str(prop(r, 'TANOfDeductor'));
    if (tan !== '' && !TAN_RE.test(tan)) {
      err(`${base}.TANOfDeductor`, 'A valid TAN of the deductor must be entered in Schedule TDS 2 (format AAAA99999A)', 'A-844');
    }
    if (str(prop(r, 'TDSCreditName')) === 'O'
        && isEmpty(prop(r, 'PANofOtherPerson')) && isEmpty(prop(r, 'AadhaarOfOtherPerson'))) {
      err(`${base}.PANofOtherPerson`, 'TDS credit relating to another person is selected — the PAN (or Aadhaar) of that other person is mandatory', 'A-855');
    }
    const claimed = num(prop(prop(r, 'TaxDeductCreditDtls'), 'TaxClaimedOwnHands'));
    if (claimed > 0) {
      if (isEmpty(prop(r, 'GrossAmount'))) {
        err(`${base}.GrossAmount`, 'TDS credit is claimed in Schedule TDS 2 — the gross amount (Col. 11) must be filled', 'A-854');
      }
      if (isEmpty(prop(r, 'HeadOfIncome'))) {
        err(`${base}.HeadOfIncome`, 'TDS credit is claimed in Schedule TDS 2 — the head of income (Col. 12) must be filled', 'A-854');
      }
    }
    if (num(prop(r, 'BroughtFwdTDSAmt')) > 0 && isEmpty(prop(r, 'DeductedYr'))) {
      err(`${base}.DeductedYr`, 'Brought-forward TDS is reported — the financial year in which the tax was deducted must be selected', 'A-847');
    }
    if (num(prop(r, 'BroughtFwdTDSAmt')) > 0
        && num(prop(prop(r, 'TaxDeductCreditDtls'), 'TaxDeductedOwnHands')) > 0) {
      err(base, 'Unclaimed TDS brought forward and TDS of the current financial year must be reported in different rows of Schedule TDS 2', 'A-851');
    }
  });
  arr(at(j, `${P}.ScheduleTDS3.TDS3onOthThanSalDtls`)).forEach((r, i) => {
    const base = `${P}.ScheduleTDS3.TDS3onOthThanSalDtls[${i}]`;
    const pan = str(prop(r, 'PANOfBuyerTenant'));
    if (pan !== '' && !PAN_RE.test(pan)) {
      err(`${base}.PANOfBuyerTenant`, 'The PAN of the buyer / tenant in Schedule TDS 3 is not a valid PAN', 'A-856');
    }
    if (str(prop(r, 'TDSCreditName')) === 'O'
        && isEmpty(prop(r, 'PANofOtherPerson')) && isEmpty(prop(r, 'AadhaarOfOtherPerson'))) {
      err(`${base}.PANofOtherPerson`, 'TDS credit relating to another person is selected — the PAN (or Aadhaar) of that other person is mandatory', 'A-855');
    }
  });
  arr(at(j, `${P}.ScheduleTCS.TCSDetails`)).forEach((r, i) => {
    const base = `${P}.ScheduleTCS.TCSDetails[${i}]`;
    const detl = prop(r, 'EmployerOrDeductorOrCollectDetl');
    const tan = str(prop(detl, 'TAN'));
    if (tan === '') {
      err(`${base}.EmployerOrDeductorOrCollectDetl.TAN`, 'The tax deduction and collection account number (TAN) of the collector must be provided in Schedule TCS', 'A-865');
    } else if (!TAN_RE.test(tan)) {
      err(`${base}.EmployerOrDeductorOrCollectDetl.TAN`, 'The TAN of the collector in Schedule TCS is not valid (format AAAA99999A)', 'A-844');
    }
    if (str(prop(detl, 'TCSCreditName')) === 'O') {
      const oth = prop(prop(r, 'TCSClaimedThisYearDtls'), 'TCSAmtCollOthrHands');
      if (isEmpty(prop(oth, 'PANOfOthrPrsn'))) {
        err(`${base}.TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn`, 'TCS credit relating to another person is selected — the PAN of that other person must be provided', 'A-863');
      }
    }
    if (num(prop(r, 'BroughtFwdTCSAmt')) > 0
        && num(prop(prop(r, 'TCSCurrFYDtls'), 'TCSAmtCollOwnHands')) > 0) {
      err(base, 'Unclaimed TCS brought forward and TCS of the current financial year cannot be entered in the same row of Schedule TCS', 'A-861');
    }
  });

  /* ── Refund / bank account (Part B-TTI) ── */
  const bankP = `${btti}.Refund.BankAccountDtls`;
  const banks = arr(at(j, `${bankP}.AddtnlBankDetails`));
  const bankFlag = str(at(j, `${bankP}.BankDtlsFlag`));
  if (bankFlag === 'Y' && banks.length === 0
      && arr(at(j, `${bankP}.ForeignBankDetails`)).length === 0) {
    err(`${bankP}.AddtnlBankDetails`, 'The bank-details flag is "Y" — at least one bank account must be reported in Part B-TTI', 'A-BANK');
  }
  if (num(at(j, `${btti}.Refund.RefundDue`)) > 0) {
    if (bankFlag !== 'Y') {
      err(`${bankP}.BankDtlsFlag`, 'A refund is due — the bank-account details flag must be "Y" and a bank account must be nominated for the refund', 'A-BANK');
    }
    const nominated = banks.some((b) => prop(b, 'UseForRefund') === true || str(prop(b, 'UseForRefund')).toLowerCase() === 'true');
    if (banks.length > 0 && !nominated) {
      err(`${bankP}.AddtnlBankDetails`, 'A refund is due — at least one bank account must be nominated for the credit of the refund', 'A-BANK');
    }
  }
}

/* ── the checker ───────────────────────────────────────────────────────────── */

export const checkMandatory: MandatoryChecker = (json: unknown): MandatoryReport => {
  const missing: MissingField[] = [];
  const errors: MandatoryIssue[] = [];
  const warnings: MandatoryIssue[] = [];

  try {
    if (json === null || json === undefined || typeof json !== 'object') {
      missing.push({
        path: 'ITR.ITR5',
        label: 'The ITR-5 payload is empty — nothing to validate',
        hint: 'Fill the form and export the JSON again',
      });
    } else {
      for (const key of Object.keys(REQUIRED_TREE)) {
        walkRequired(json, REQUIRED_TREE[key], [key], missing);
      }
      walkArrayItems(json, missing);
      schemaFormatChecks(json, errors, warnings);
      categoryAChecks(json, errors, warnings);
      categoryAChecks2(json, errors, warnings);
    }
  } catch {
    warnings.push({
      path: 'ITR.ITR5',
      msg: 'The mandatory-field validator could not complete on this payload; validate the JSON structure.',
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
