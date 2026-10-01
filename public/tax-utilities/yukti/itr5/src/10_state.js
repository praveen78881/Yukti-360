/* =====================================================================
   State, seeds and the schema skeleton (Phase 2 base scaffold).
   ===================================================================== */
/* S — the working state. The shell contract requires meta / pi / fs / bank /
   ver / open:{} / C:{}; these are seeded just enough that compute() and
   buildReturn() never throw. ITR-5 is an entity return, so pi carries the
   firm's status ("1" = Firm, from MainStatus) and PAN only — the real
   OrgFirmInfo / FilingStatus / per-schedule state is added by each section
   file in Phase 4 (do NOT hard-code section state here; each section adds
   its own keys and its own SEED rows). */
const S={
  meta:{app:"yukti",form:"ITR-5",ay:"2026-27",ver:1},
  pi:{status:"1",res:"RES",name:"",pan:"",formed:""},
  fs:{optout:"No",sec:11,filed:"",due:"31/08/2026 or extended"},
  bank:[],
  ver:{cap:"S"},
  open:{},
  C:{}
};

/* SEED — default row per grid key. No grids in the scaffold yet; each
   section file adds its own SEED entries in Phase 4. */
const SEED={};

/* SKEL — the schema's required-key skeleton; equals books/ITR-5/skeleton.json
   verbatim. Root object is exported under { ITR: { ITR5: SKEL-filled } }.
   Includes the two no-screen meta blocks CreationInfo and Form_ITR5. */
const SKEL=
{
 "CreationInfo": {
  "SWVersionNo": "R5",
  "SWCreatedBy": "SW10000001",
  "JSONCreatedBy": "SW10000001",
  "JSONCreationDate": "2026-01-01",
  "IntermediaryCity": "na",
  "Digest": "-"
 },
 "Form_ITR5": {
  "FormName": "ITR-5",
  "Description": "na",
  "AssessmentYear": "2026",
  "SchemaVer": "Ver1.0",
  "FormVer": "Ver1.0"
 },
 "PartA_GEN1": {
  "OrgFirmInfo": {
   "AssesseeName": {
    "SurNameOrOrgName": "na"
   },
   "PAN": "na",
   "Address": {
    "ResidenceNo": "na",
    "LocalityOrArea": "na",
    "CityOrTownOrDistrict": "na",
    "StateCode": "01",
    "CountryCode": "93",
    "CountryCodeMobile": 0,
    "MobileNo": 0,
    "EmailAddress": "na@na.in"
   },
   "DateOFFormOrIncorp": "2026-01-01",
   "StatusOrCompanyType": "1"
  },
  "FilingStatus": {
   "ReturnFileSec": {
    "IncomeTaxSec": 11
   },
   "BusinessTrustFlag": "N",
   "InvstmntFundRefrdSec115UB": "N",
   "ResidentialStatus": "RES",
   "ForeignExchangeFlag": "Y",
   "StartUpDPIITFlag": "Y",
   "InterMinisterialCertFlag": "Y",
   "FiiFpiFlag": "N",
   "AsseseeRepFlg": "Y",
   "PartnerInFirmFlg": "Y",
   "HeldUnlistedEqShrPrYrFlg": "Y",
   "ItrFilingDueDate": "2026-07-31",
   "ifMSME": "Y"
  }
 },
 "PartA_GEN2": {
  "LiableSec44AAflg": "N",
  "IncDclrdUs": "na",
  "LiableSec44ABflg": "N",
  "LiableSec92Eflg": "N",
  "PrevYrMemPartChange": "N"
 },
 "PARTA_BS": {
  "FundSrc": {
   "PartnerOrMemberFund": {
    "PartnerOrMemberCap": 0,
    "ResrNSurp": {
     "RevResr": 0,
     "CapResr": 0,
     "StatResr": 0,
     "OthResr": 0,
     "CreditBalOfPLAccount": 0,
     "TotResrNSurp": 0
    },
    "TotPartnerOrMemberFund": 0
   },
   "LoanFunds": {
    "SecrLoan": {
     "ForeignCurrLoan": 0,
     "RupeeLoan": {
      "FrmBank": 0,
      "FrmOthrs": 0,
      "TotRupeeLoan": 0
     },
     "TotSecrLoan": 0
    },
    "UnsecrLoan": {
     "ForeignCurrencyLoans": 0,
     "RupeeLoan": {
      "FrmBank": 0,
      "FrmPersonSpcfdUs40A2b": 0,
      "FrmOthrs": 0,
      "TotRupeeLoan": 0
     },
     "TotUnSecrLoan": 0
    },
    "TotLoanFund": 0
   },
   "DeferredTax": 0,
   "Advances": {
    "FrmPersonSpcfdUs40A2b": 0,
    "FrmOthers": 0,
    "TotalAdvances": 0
   },
   "TotFundSrc": 0
  },
  "FundApply": {
   "FixedAsset": {
    "GrossBlock": 0,
    "Depreciation": 0,
    "NetBlock": 0,
    "CapWrkProg": 0,
    "TotFixedAsset": 0
   },
   "Investments": {
    "LongTermInv": {
     "InvInProperty": 0,
     "EquityInstruments": {
      "ListedEquities": 0,
      "UnListedEquities": 0,
      "Total": 0
     },
     "PreferenceShares": 0,
     "GovtOrTrustSecurities": 0,
     "DebenturesOrBonds": 0,
     "MutualFunds": 0,
     "Others": 0,
     "TotLongTermInv": 0
    },
    "ShortTermInv": {
     "EquityInstruments": {
      "ListedEquities": 0,
      "UnListedEquities": 0,
      "Total": 0
     },
     "PreferenceShares": 0,
     "GovtOrTrustSecurities": 0,
     "DebenturesOrBonds": 0,
     "MutualFunds": 0,
     "Others": 0,
     "TotShortTermInv": 0
    },
    "TotInvestments": 0
   },
   "CurrAssetLoanAdv": {
    "CurrAsset": {
     "Inventories": {
      "RawMatl": 0,
      "WorkInProgress": 0,
      "FinOrTradGood": 0,
      "StkInTrade": 0,
      "StoresConsumables": 0,
      "LooseTools": 0,
      "Others": 0,
      "TotInventries": 0
     },
     "SundryDebtorDtls": {
      "OutstandindMorethanOneYr": 0,
      "Others": 0,
      "TotalSundryDebtors": 0
     },
     "CashOrBankBal": {
      "BankBal": 0,
      "CashinHand": 0,
      "Others": 0,
      "TotCashOrBankBal": 0
     },
     "OthCurrAsset": 0,
     "TotCurrAsset": 0
    },
    "LoanAdv": {
     "AdvRecoverable": 0,
     "Deposits": 0,
     "BalWithRevAuth": 0,
     "TotLoanAdv": 0,
     "LoanAdvIncluded": {
      "PurposeOFBusOrProf": 0,
      "NotForPurposeOFBusOrProf": 0
     }
    },
    "TotCurrAssetLoanAdv": 0,
    "CurrLiabilitiesProv": {
     "CurrLiabilities": {
      "SundryCreditorDtls": {
       "OutstandindMorethanOneYr": 0,
       "Others": 0,
       "TotalSundryCreditors": 0
      },
      "LiabForLeasedAsset": 0,
      "AccrIntonLeasedAsset": 0,
      "AccrIntNotDue": 0,
      "IncRecvdInAdv": 0,
      "OtherPayables": 0,
      "TotCurrLiabilities": 0
     },
     "Provisions": {
      "ITProvision": 0,
      "ELSuperAnnGratProvision": 0,
      "OthProvision": 0,
      "TotProvisions": 0
     },
     "TotCurrLiabilitiesProvision": 0
    },
    "NetCurrAsset": 0
   },
   "MiscAdjust": {
    "MiscExpndr": 0,
    "DefTaxAsset": 0,
    "AccumultedLosses": 0,
    "TotMiscAdjust": 0
   },
   "TotFundApply": 0
  }
 },
 "PARTA_PL": {
  "CreditsToPL": {
   "OthIncome": {
    "RentInc": 0,
    "Comissions": 0,
    "Dividends": 0,
    "InterestInc": 0,
    "ProfitOnSaleFixedAsset": 0,
    "ProfitOnInvChrSTT": 0,
    "ProfitOnOthInv": 0,
    "ProfitOnCurrFluct": 0,
    "ProfitOnCnvInvntryToCapAsst": 0,
    "ProfitOnAgriIncome": 0,
    "MiscOthIncome": 0,
    "TotOthIncome": 0
   },
   "TotCreditsToPL": 0
  },
  "DebitsToPL": {
   "DebitPlAcnt": {
    "Freight": 0,
    "ConsumptionOfStores": 0,
    "PowerFuel": 0,
    "RentExpdr": 0,
    "RepairsBldg": 0,
    "RepairMach": 0,
    "EmployeeComp": {
     "SalsWages": 0,
     "Bonus": 0,
     "MedExpReimb": 0,
     "LeaveEncash": 0,
     "LeaveTravelBenft": 0,
     "ContToSuperAnnFund": 0,
     "ContToPF": 0,
     "ContToGratFund": 0,
     "ContToOthFund": 0,
     "OthEmpBenftExpdr": 0,
     "TotEmployeeComp": 0
    },
    "Insurances": {
     "MedInsur": 0,
     "LifeInsur": 0,
     "KeyManInsur": 0,
     "OthInsur": 0,
     "TotInsurances": 0
    },
    "StaffWelfareExp": 0,
    "Entertainment": 0,
    "Hospitality": 0,
    "Conference": 0,
    "SalePromoExp": 0,
    "Advertisement": 0,
    "CommissionExpdrDtls": {
     "NonResOtherCompany": 0,
     "Others": 0,
     "Total": 0
    },
    "RoyalityDtls": {
     "NonResOtherCompany": 0,
     "Others": 0,
     "Total": 0
    },
    "ProfessionalConstDtls": {
     "NonResOtherCompany": 0,
     "Others": 0,
     "Total": 0
    },
    "HotelBoardLodge": 0,
    "TravelExp": 0,
    "ForeignTravelExp": 0,
    "ConveyanceExp": 0,
    "TelephoneExp": 0,
    "GuestHouseExp": 0,
    "ClubExp": 0,
    "FestivalCelebExp": 0,
    "Scholarship": 0,
    "Gift": 0,
    "Donation": 0,
    "RatesTaxesPays": {
     "ExciseCustomsVAT": {
      "UnionExciseDuty": 0,
      "ServiceTax": 0,
      "VATorSaleTax": 0,
      "CentralGoodServiceTax": 0,
      "StateGoodServiceTax": 0,
      "IntegratedGoodServiceTax": 0,
      "UnionTerrGoodServiceTax": 0,
      "OthDutyTaxCess": 0,
      "TotExciseCustomsVAT": 0
     }
    },
    "AuditFee": 0,
    "SalRemuneration": 0,
    "OtherExpenses": 0,
    "BadDebtDtls": {
     "BadDebtAmtDtlsTotal": 0,
     "OthersPANNotAvlblDtlTotal": 0,
     "OthersAmtLt1Lakh": 0,
     "BadDebt": 0
    },
    "ProvForBadDoubtDebt": 0,
    "OthProvisionsExpdr": 0,
    "PBIDTA": 0,
    "InterestExpdrtDtls": {
     "NonResOtherCompany": 0,
     "Others": 0,
     "ResPartners": 0,
     "ResOthers": 0,
     "InterestExpdr": 0
    },
    "DepreciationAmort": 0,
    "PBT": 0
   },
   "TaxProvAppr": {
    "ProvForCurrTax": 0,
    "ProvDefTax": 0,
    "ProfitAfterTax": 0,
    "BalBFPrevYr": 0,
    "AmtAvlAppr": 0,
    "Appropriations": {
     "TrfToReserves": 0
    },
    "PartnerAccBalTrf": 0
   }
  },
  "PersumptiveInc44AD": {
   "GrsTrnOverOrReceipt": 0,
   "TotPersumptiveInc44AD": 0
  },
  "PersumptiveInc44ADA": {
   "GrsReceipt": 0
  },
  "TotalPrsumptvIncUs44E": 0,
  "NoBooksOfAccPL": {
   "GrossReceipt": 0,
   "GrsRcptAccPayeeOrBankMode": 0,
   "GrsRcptOtherMode": 0,
   "GrossProfit": 0,
   "Expenses": 0,
   "NetProfit": 0,
   "GrossReceiptPrf": 0,
   "GrsRcptAccPayeeOrBankModePrf": 0,
   "GrsRcptOtherModePrf": 0,
   "GrossProfitPrf": 0,
   "ExpensesPrf": 0,
   "NetProfitPrf": 0,
   "TotBusinessProfession": 0
  },
  "TurnverFrmSpecActivity": 0,
  "NetIncomeFrmSpecActivity": 0
 },
 "CorpScheduleBP": {
  "BusinessIncOthThanSpec": {
   "ProfBfrTaxPL": 0,
   "NetPLFromSpecBus": 0,
   "NetProfLossSpecifiedBus": 0,
   "IncRecCredPLOthHeadDtls": {
    "HouseProperty": 0,
    "CapitalGains": 0,
    "OtherSources": 0,
    "UnderSec115BBF": 0,
    "UnderSec115BBG": 0,
    "Dividend": 0,
    "OtherThanDividend": 0
   },
   "PLUs44sChapXIIGOthrUs115B": 0,
   "ProfitLossInclRefrdSec": {
    "ProfitLossUs44AD": 0,
    "ProfitLossUs44ADA": 0,
    "ProfitLossUs44AE": 0,
    "ProfitLossUs44B": 0,
    "ProfitLossUs44BB": 0,
    "ProfitLossUs44BBA": 0,
    "ProfitLossUs44BBC": 0,
    "ProfitLossUs44BBD": 0,
    "ProfitLossUs44DA": 0,
    "FirstSchITActOthr115B": 0
   },
   "TotalProfitFrmActCvrd": 0,
   "ProfitFrmActCvrd": {
    "ProfitFrmActCvrdUndrRule7": 0,
    "ProfitFrmActCvrdUndrRule7A": 0,
    "ProfitFrmActCvrdUndrRule7B1": 0,
    "ProfitFrmActCvrdUndrRule7B1A": 0,
    "ProfitFrmActCvrdUndrRule8": 0
   },
   "IncCredPL": {
    "FirmShareInc": 0,
    "AOPBOISharInc": 0,
    "OthExempInc": 0,
    "TotExempInc": 0
   },
   "BalancePLOthThanSpecBus": 0,
   "ExpDebToPLOthHeadDtls": {
    "HouseProperty": 0,
    "CapitalGains": 0,
    "OtherSources": 0,
    "UnderSec115BBF": 0,
    "UnderSec115BBG": 0
   },
   "ExpDebToPLExemptInc": 0,
   "ExpDebToPLExemptIncDisAllwUs14A": 0,
   "TotExpDebPL": 0,
   "AdjustedPLOthThanSpecBus": 0,
   "DepreciationDebPLCosAct": 0,
   "DepreciationAllowITAct32": {
    "DepreciationAllowUs32_1_ii": 0,
    "DepreciationAllowUs32_1_i": 0,
    "TotDeprAllowITAct": 0
   },
   "AdjustPLAfterDeprOthSpecInc": 0,
   "AmtDebPLDisallowUs36": 0,
   "AmtDebPLDisallowUs37": 0,
   "AmtDebPLDisallowUs40": 0,
   "AmtDebPLDisallowUs40A": 0,
   "AmtDebPLDisallowUs43B": 0,
   "InterestDisAllowUs23SMEAct": 0,
   "DeemIncUs41": 0,
   "DeemIncUs3380HHD80IA": 0,
   "DeemIncUs43CA": 0,
   "OthItemDisallowUs28To44DB": 0,
   "AnyOthIncNotInclInExpDisallowPL": 0,
   "SalaryExpDisallowPL": 0,
   "BonusExpDisallowPL": 0,
   "CommissionExpDisallowPL": 0,
   "InterestExpDisallowPL": 0,
   "OthersExpDisallowPL": 0,
   "IncProfDecLossAccICDSAdj": 0,
   "TotAfterAddToPLDeprOthSpecInc": 0,
   "DeductUs32_1_iii": 0,
   "DebPLUs35ExcessAmt": 0,
   "AmtDisallUs40NowAllow": 0,
   "AmtDisallUs43BNowAllow": 0,
   "AnyOthAmtAllDeduct": 0,
   "DecProfIncLossAccICDSAdj": 0,
   "TotDeductionAmts": 0,
   "PLAftAdjDedBusOthThanSpec": 0,
   "DeemedProfitBusUs": {
    "Section44AD": 0,
    "Section44ADA": 0,
    "Section44AE": 0,
    "Section44B": 0,
    "Section44BB": 0,
    "Section44BBA": 0,
    "Section44BBC": 0,
    "Section44BBD": 0,
    "Section44DA": 0,
    "FirstSchTActOther": 0,
    "TotDeemedProfitBusUs": 0
   },
   "NetPLAftAdjBusOthThanSpec": 0,
   "NetPLBusOthThanSpec7A7B7C": 0,
   "ChrgblIncUndrRule7": 0,
   "DeemedChrgblIncUndrRule7A": 0,
   "DeemedChrgblIncUndrRule7B1": 0,
   "DeemedChrgblIncUndrRule7B1A": 0,
   "DeemedChrgblIncUndrRule8": 0,
   "IncomeOtherThanRule": 0,
   "BalIncDeemedFrmAgri": 0
  },
  "SpecBusinessInc": {
   "NetPLFrmSpecBus": 0,
   "AdditionUs28to44DB": 0,
   "DeductUs28to44DB": 0,
   "AdjustedPLFrmSpecuBus": 0
  },
  "IncSpecifiedBusiness": {
   "NetPLFrmSpecifiedBus": 0,
   "AddSec28to44DB": 0,
   "DedSec28to44DBOTDedSec35AD": 0,
   "ProfitLossSpecifiedBusiness": 0,
   "ProfitLossSpecifiedBusFinal": 0
  },
  "IncChrgUnHdProftGain": 0,
  "BusSetoffCurrYr": {
   "LossSetOffOnBusLoss": 0,
   "TotLossSetOffOnBus": 0,
   "LossRemainSetOffOnBus": 0
  }
 },
 "PartB-TI": {
  "IncomeFromHP": 0,
  "ProfBusGain": {
   "ProfGainNoSpecBus": 0,
   "ProfGainSpecBus": 0,
   "ProfGainSpecifiedBus": 0,
   "IncChrgblTaxSplRate": 0,
   "TotProfBusGain": 0
  },
  "CapGain": {
   "ShortTerm": {
    "ShortTerm20Per": 0,
    "ShortTerm30Per": 0,
    "ShortTermAppRate": 0,
    "ShortTermSplRateDTAA": 0,
    "TotalShortTerm": 0
   },
   "LongTerm": {
    "LongTerm12_5Per": 0,
    "LongTermSplRateDTAA": 0,
    "TotalLongTerm": 0
   },
   "TotalCapGains": 0,
   "ShortTermLongTermTotal": 0,
   "CapGains30Per115BBH": 0
  },
  "IncFromOS": {
   "OtherSrcThanOwnRaceHorse": 0,
   "IncChargblSplRate": 0,
   "FromOwnRaceHorse": 0,
   "TotIncFromOS": 0
  },
  "TotalTI": 0,
  "CurrentYearLoss": 0,
  "BalanceAfterSetoffLosses": 0,
  "BroughtFwdLossesSetoff": 0,
  "GrossTotalIncome": 0,
  "IncChargeTaxSplRate111A112": 0,
  "DeductionsUndSchVIADtl": {
   "PartBchapterVIA": 0,
   "PartCchapterVIA": 0,
   "TotDeductUndSchVIA": 0
  },
  "DeductionsUnder10Aor10AA": 0,
  "TotalIncome": 0,
  "IncChargeableTaxSplRates": 0,
  "NetAgricultureIncomeOrOtherIncomeForRate": 0,
  "AggregateIncome": 0,
  "LossesOfCurrentYearCarriedFwd": 0
 },
 "PartB_TTI": {
  "ComputationOfTaxLiability": {
   "TaxPayableOnDeemedTI": {
    "TaxDeemedTISec115JC": 0,
    "Surcharge": 0,
    "EducationCess": 0,
    "TotalTax": 0
   },
   "TaxPayableOnTI": {
    "TaxAtNormalRates": 0,
    "TaxAtSpecialRates": 0,
    "RebateOnAgriInc": 0,
    "TaxPayableOnTotInc": 0,
    "Surcharge25ofSI": 0,
    "SurchargeOnTaxPayable": 0,
    "Surcharge25ofSIBeforeMarginal": 0,
    "SurchargeOnTaxPayableBeforeMarginal": 0,
    "TotalSurcharge": 0,
    "EducationCess": 0,
    "GrossTaxLiability": 0
   },
   "GrossTaxPayable": 0,
   "CreditUS115JD": 0,
   "TaxPaidUnderCredit": 0,
   "TaxRelief": {
    "Section90": 0,
    "Section91": 0,
    "TotTaxRelief": 0
   },
   "NetTaxLiability": 0,
   "IntrstPay": {
    "IntrstPayUs234A": 0,
    "IntrstPayUs234B": 0,
    "IntrstPayUs234C": 0,
    "LateFilingFee234F": 0,
    "TotalIntrstPay": 0
   },
   "AggregateTaxInterestLiability": 0
  },
  "TaxPaid": {
   "TaxesPaid": {
    "TotalTaxesPaid": 0
   },
   "BalTaxPayable": 0
  },
  "Refund": {
   "RefundDue": 0,
   "BankAccountDtls": {
    "BankDtlsFlag": "Y"
   }
  }
 },
 "Verification": {
  "Declaration": {
   "AssesseeVerName": "na",
   "FatherName": "na",
   "AssesseeVerPAN": "na",
   "Capacity": "MP",
   "Place": "na",
   "Date": "2026-01-01"
  }
 }
};
