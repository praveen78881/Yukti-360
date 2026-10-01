/* =====================================================================
   State, seeds and the schema skeleton (Phase 4 base scaffold — STUB).
   ITR-6 is the company return. Modelled on forms/ITR-3/src/10_state.js.
   ===================================================================== */
/* S — the working state. The shell contract (shell/README.md) requires
   meta, pi, fs, bank, ver, open:{} and C:{}; those are seeded enough that
   compute() and buildReturn() never throw. In addition there is one
   namespace per screen section (books/ITR-6/section_map.json — the 18
   sections who/gen/accounts/bp/cg/os/hp/loss/ded/si/ei/mat/fa/al/other/
   paid/tax/bank) so each Phase-4 section-builder has a home to write into.
   Defaults are seeded from books/ITR-6/enums.json / skeleton.json where
   ITR-3 seeds (status, residential status, filing section, capacity),
   adapted to a company: StatusOrCompanyType "6", DomesticCompFlg "Y",
   ReturnFileSec.IncomeTaxSec 11, Verification.Capacity "MD". */
const S={
  meta:{app:"yukti",form:"ITR-6",ay:"2026-27",ver:1},
  /* shell-contract identity / filing / verification (ITR-6 is a company) */
  pi:{status:"6",res:"RES",domestic:"Y",name:"",pan:"",dob:"",doi:""},
  fs:{optout:"No",sec:11,filed:""},
  ver:{cap:"MD"},
  /* the screen-section namespaces (who/gen/accounts/bp/cg/os/hp/loss/ded/
     si/ei/mat/fa/al/other/paid/tax) are intentionally NOT pre-seeded here:
     each Phase-4 section builder initialises its own with `S.<ns> =
     S.<ns> || {…defaults}`, and a `{}` placeholder is truthy — it would
     short-circuit that `||` and drop every section's defaults. Left
     undefined so each section's own seed runs; the test client and every
     engine assign/read these namespaces defensively. */
  bank:[],        /* shell array; also the 'bank' (verification) section's namespace */
  open:{}, C:{}
};

/* SEED — default row per grid key. No grids in the stub yet. */
const SEED={};

/* SKEL — the schema's required-key skeleton; equals books/ITR-6/skeleton.json.
   Root object is ITR6; the return wrapper is {ITR:{ITR6:{...}}} (see 90_wiring).
   Part B blocks are keyed "PartB-TI" (hyphen) and "PartB_TTI" (underscore). */
const SKEL=
{
 "CreationInfo": {
  "SWVersionNo": "R1",
  "SWCreatedBy": "SW10000001",
  "JSONCreatedBy": "SW10000001",
  "JSONCreationDate": "2026-01-01",
  "IntermediaryCity": "na",
  "Digest": "-"
 },
 "Form_ITR6": {
  "FormName": "ITR-6",
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
   "StatusOrCompanyType": "6",
   "DomesticCompFlg": "Y"
  },
  "FilingStatus": {
   "ReturnFileSec": {
    "IncomeTaxSec": 11
   },
   "ResidentialStatus": "RES",
   "FinancialStmtFlag": "Y",
   "UnderLiquidation": "Y",
   "FiiFpiFlag": "Y",
   "Sec581AFlag": "Y",
   "AsseseeRepFlg": "Y",
   "StartUpDPIITFlag": "Y",
   "ItrFilingDueDate": "2026-10-31",
   "ifMSME": "Y"
  }
 },
 "PartA_GEN2For6": {
  "LiableSec44AAflg": "N",
  "IncDclrdUs": "na",
  "LiableSec44ABflg": "N",
  "LiableSec92Eflg": "N",
  "HoldingStatus": {
   "NatOfCompFlg": "1"
  },
  "NatureOfComp": {
   "PubSectCompUs2_36AFlg": "N",
   "RBICompFlg": "N",
   "CompLes40PercSharGovRBIFlg": "N",
   "BankCompUs5Flg": "N",
   "SchedBankOfRBIActFlg": "N",
   "CompWithIRDARegisterFlg": "N",
   "NonBankFIICompFlg": "N",
   "CompanyUnlistedFlag": "Y"
  }
 },
 "PARTA_BSFor6FrmAY13": {
  "EquityAndLiablities": {
   "ShareHolderFund": {
    "ShareCapital": {
     "Authorised": 0,
     "IssuedSubsPaidUp": 0,
     "SubscribedNotFullyPaid": 0,
     "TotShareCapital": 0
    },
    "ResrNSurp": {
     "CapResr": 0,
     "CapRedempResr": 0,
     "SecurPremResr": 0,
     "DebunRedResr": 0,
     "RevResr": 0,
     "ShareOptOSAmount": 0,
     "OtherResrvTotal": 0,
     "PLAccount": 0,
     "TotResrNSurp": 0
    },
    "MoneyRecvdAgainstShares": 0,
    "TotShareHolderFund": 0
   },
   "ShareAppMoneyAllot": {
    "PendingLtOneYr": 0,
    "PendingMtOneYr": 0,
    "Total": 0
   },
   "NonCurrLiabilities": {
    "LongTermBorrowings": {
     "BondsDebentures": {
      "ForeignCurrency": 0,
      "Rupee": 0,
      "Total": 0
     },
     "TermLoans": {
      "ForeignCurrency": 0,
      "RupeeLoans": {
       "FromBanks": 0,
       "FromOthers": 0,
       "Total": 0
      },
      "TotalTermLoans": 0
     },
     "DeferredPymtLiabilities": 0,
     "DepositsFrmRelatedParties": 0,
     "OtherDeposits": 0,
     "LoansAndAdv": 0,
     "OthersLoanAdv": 0,
     "LongTermMaturities": 0,
     "TotalLTBorrowings": 0
    },
    "NetDefferedTaxLiability": 0,
    "OthLongTermLiablities": {
     "TradePayables": 0,
     "Others": 0,
     "TotalOthLtLiabilities": 0
    },
    "LongTermProvisions": {
     "ProvEmpBenefits": 0,
     "Others": 0,
     "Total": 0
    },
    "TotalNonCurrLiabilites": 0
   },
   "CurrentLiabilities": {
    "ShortTrmBorrowings": {
     "LoansRepaybleOnDemand": {
      "FromBanks": 0,
      "FrmNonBanking": 0,
      "OthFinanceInst": 0,
      "Others": 0,
      "TotLoansRepaybleOnDemand": 0
     },
     "DepositsFrmRelatedParties": 0,
     "LoansAndAdv": 0,
     "OthLoansAndAdv": 0,
     "OthDeposits": 0,
     "TotShortTrmBorrowings": 0
    },
    "TradePayables": {
     "OSMoreThanOneYr": 0,
     "Others": 0,
     "TotalTradePayables": 0
    },
    "OthCurrLiabilities": {
     "CurrMatOnLTDebt": 0,
     "CurrMatFinanceOblg": 0,
     "AccrInterestNotDue": 0,
     "AccrInterest": 0,
     "IncRecvdAdvance": 0,
     "UnpaidDividend": 0,
     "AppMonyRecvdAllotSecurities": 0,
     "UnpaidMatDeposits": 0,
     "UnpaidMatureDebenture": 0,
     "OthPayables": 0,
     "TotOthCurrLiabilities": 0
    },
    "ShortTermProv": {
     "EmpBenefitProv": 0,
     "ITProvision": 0,
     "ProposedDividend": 0,
     "TaxOnDividend": 0,
     "OthProvision": 0,
     "TotShortTermProvisions": 0
    },
    "TotCurrLiabilitiesProvision": 0
   },
   "TotEquityAndLiabilities": 0
  },
  "Assets": {
   "NonCurrAssets": {
    "FixedAsset": {
     "Tangible": {
      "GrossBlock": 0,
      "Depreciation": 0,
      "ImpairmentLosses": 0,
      "NetBlock": 0
     },
     "InTangible": {
      "GrossBlock": 0,
      "Amortization": 0,
      "ImpairmentLosses": 0,
      "NetBlock": 0
     },
     "CapWrkProg": 0,
     "IntangibleAssetUnDev": 0,
     "TotFixedAsset": 0
    },
    "NonCurrInvstmnts": {
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
     "InvstmntInPrtnrShipFirm": 0,
     "OtherInvstmnts": 0,
     "TotNonCurrInvstmnts": 0
    },
    "NetDeferredTaxAssets": 0,
    "LongTrmLoanAdv": {
     "CapitalAdv": 0,
     "SecurityDeposits": 0,
     "LoanAdvRelatedParties": 0,
     "OthLoanAdv": 0,
     "TotLTLoanAdv": 0,
     "LTLoanAdvDtls": {
      "BusOrProf": 0,
      "NotForBusOrProf": 0,
      "ShareHolderUs2_22": 0
     }
    },
    "OthNonCurrAssets": {
     "LTTradeReceivables": {
      "Secured": 0,
      "Unsecured": 0,
      "Doubtful": 0,
      "TotOthNonCurrAssets": 0
     },
     "Others": 0,
     "Total": 0,
     "NonCurrAssetUs2_22": 0
    },
    "TotNonCurrAssets": 0
   },
   "CurrentAssets": {
    "CurrInvstmnts": {
     "EquityInstruments": {
      "ListedEquities": 0,
      "UnListedEquities": 0,
      "Total": 0
     },
     "PreferenceShares": 0,
     "GovtOrTrustSecurities": 0,
     "DebenturesOrBonds": 0,
     "MutualFunds": 0,
     "InvstmntInPrtnrShipFirm": 0,
     "OtherInvstmnts": 0,
     "TotCurrInvstmnts": 0
    },
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
    "TradeReceivables": {
     "OSMoreThanSixMonths": 0,
     "Others": 0,
     "TotalTradeReceivables": 0
    },
    "CashNCashEquivalents": {
     "BalWithBanks": 0,
     "ChequesDrafts": 0,
     "CashInHand": 0,
     "Others": 0,
     "TotCashNCashEquivalents": 0
    },
    "TotShortTermLoanAdv": {
     "LoanAdv": 0,
     "Others": 0,
     "TotShrtTermLoans": 0,
     "STLoanAdvDtls": {
      "BusOrProf": 0,
      "NotForBusOrProf": 0,
      "ShareHolderUs2_22": 0
     }
    },
    "OtherCurrAssets": 0,
    "TotCurrAssets": 0
   }
  },
  "TotalAssets": 0
 },
 "PARTA_BSIndAS": {
  "EquityAndLiablities": {
   "Equity": {
    "EquityShareCapital": {
     "Authorised": 0,
     "IssuedSubsPaidUp": 0,
     "SubscribedNotFullyPaid": 0,
     "TotShareCapital": 0
    },
    "OtherEquityReserv": {
     "CapRedempResr": 0,
     "DebunRedResr": 0,
     "ShareOptOSAmount": 0,
     "TotalOtherResrv": 0,
     "RetainedEarngs": 0,
     "TotResrNRetEar": 0,
     "TotalEquity": 0
    }
   },
   "Liabilities": {
    "NonCurrLiabilities": {
     "FinancialLiabilities": {
      "BondsDebentures": {
       "ForeignCurrency": 0,
       "Rupee": 0,
       "Total": 0
      },
      "TermLoans": {
       "ForeignCurrency": 0,
       "RupeeLoans": {
        "FromBanks": 0,
        "FromOthers": 0,
        "Total": 0
       },
       "TotalTermLoans": 0
      },
      "DeferredPymtLiabilities": 0,
      "Deposits": 0,
      "LoansReltdParties": 0,
      "LongTermMaturities": 0,
      "LiabilityComp": 0,
      "OtherLoans": 0,
      "TotalLTBorrowings": 0,
      "TradePayables": 0,
      "OtherFinancialLiab": 0
     },
     "Provisions": {
      "ProvEmpBenefits": 0,
      "TotalProvisions": 0
     },
     "DefrdTaxCurrLiabilites": 0,
     "OtherNonCurLiabilites": {
      "Advances": 0,
      "TotalOthNonCurrLiab": 0
     },
     "TotalNonCurrLiab": 0
    },
    "CurrentLiabilities": {
     "FinancialLiabBorrowings": {
      "LoansRepaybleOnDemand": {
       "FromBanks": 0,
       "FrmOtherParties": 0,
       "TotLoansRepaybleOnDemand": 0
      },
      "LoansFrmRelatedParties": 0,
      "Deposits": 0,
      "TotalBorrowings": 0,
      "TradePayables": 0
     },
     "OthFinancialLiabilities": {
      "CurrMatOnLTDebt": 0,
      "CurrMatFinanceOblg": 0,
      "AccrInterest": 0,
      "UnpaidDividend": 0,
      "AppMonyRecvdAllotSecurities": 0,
      "UnpaidMatDeposits": 0,
      "UnpaidMatureDebenture": 0,
      "TotOthFinancialLiab": 0
     },
     "TottalFinancialLiab": 0,
     "OtherCuurLiabilities": {
      "RevenueRecvdAdvance": 0,
      "OthersAdvTotal": 0,
      "TotalOthCurrLiab": 0
     },
     "Provosions": {
      "ProvosionEmpBenft": 0,
      "TotalProvosions": 0
     },
     "CurrTaxLiabilities": 0,
     "TotalCurrentLiab": 0,
     "TotalEquityLiab": 0
    }
   }
  },
  "Assets": {
   "NonCurrAssets": {
    "PropertyPlantEquip": {
     "GrossBlock": 0,
     "Depreciation": 0,
     "ImpairmentLosses": 0,
     "NetBlock": 0,
     "CapWrkProg": 0,
     "InvstPropGrossBlock": 0,
     "InvstPropDepreciation": 0,
     "InvstPropImprLosses": 0,
     "InvstPropNetBlock": 0,
     "GoodWlGrossBlock": 0,
     "GoodWlImprLosses": 0,
     "GoodWlNetBlock": 0,
     "OthIntAstGrossBlock": 0,
     "OthIntAstAmortisation": 0,
     "OthIntAstImprLosses": 0,
     "OthIntAstNetBlock": 0,
     "IntAstUndrDevlpmnt": 0,
     "BioAstGrossBlock": 0,
     "BioAstImprLosses": 0,
     "BioAstNetBlock": 0,
     "FinancialAssets": {
      "Investments": {
       "ListedEquities": 0,
       "UnListedEquities": 0,
       "Total": 0,
       "InvstPrfShares": 0,
       "InvstGovtTrust": 0,
       "InvstInDebenture": 0,
       "InvstInMutualFunds": 0,
       "InvstInPartnershpFirm": 0,
       "TotalNonCurrentInvst": 0
      },
      "TradeReceivables": {
       "SecuredConsGoods": 0,
       "UnSecuredConsGoods": 0,
       "Doubtful": 0,
       "TotalTradeReceivbls": 0
      },
      "Loans": {
       "SecurityDepsts": 0,
       "LoansRltdParties": 0,
       "TotalLoans": 0,
       "LoansBPPurpose": 0,
       "LoansNotBPPurpose": 0,
       "LoansToShrHolders": 0
      },
      "OtherFinacialAssets": {
       "BankDeposits": 0,
       "OtherDeposits": 0,
       "TotalOthFinancialAsst": 0,
       "DefrdTaxAsst": 0
      },
      "OtherNonCurrentAssets": {
       "CapitalAdvanc": 0,
       "AdvancOthCapital": 0,
       "TotalNonCurrAsst": 0,
       "NonCurrAsstDueShrHldr": 0
      },
      "TotalNonCurrntAsst": 0
     }
    }
   },
   "CurrentAssets": {
    "Inventories": {
     "RawMaterials": 0,
     "WorkInProgress": 0,
     "FinishedGoods": 0,
     "StockInTrade": 0,
     "StoresSpares": 0,
     "LooseTools": 0,
     "Others": 0,
     "TotalInventories": 0
    },
    "FinancialAssets": {
     "Investments": {
      "ListedEquities": 0,
      "UnListedEquities": 0,
      "Total": 0,
      "InvstPrfShares": 0,
      "InvstGovtTrust": 0,
      "InvstInDebenture": 0,
      "InvstInMutualFunds": 0,
      "InvstInPartnershpFirm": 0,
      "OtherInvestment": 0,
      "TotalCurrentInvst": 0
     },
     "TradeReceivables": {
      "SecuredConsGoods": 0,
      "UnSecuredConsGoods": 0,
      "Doubtful": 0,
      "TotalTradeReceivbls": 0
     },
     "CashEquivalents": {
      "BalancesWithBanks": 0,
      "ChequeDraftsInHand": 0,
      "CashOnHand": 0,
      "TotalCashEquivalents": 0,
      "BankBalanceOther": 0
     },
     "Loans": {
      "SecurityDepsts": 0,
      "LoansRltdParties": 0,
      "TotalLoans": 0,
      "LoansBPPurpose": 0,
      "LoansNotBPPurpose": 0,
      "LoansToShrHolders": 0
     },
     "OtherFinancialAsst": 0,
     "TotalFinancialAsst": 0,
     "CurrentTaxAsst": 0,
     "OtherCurrentAssets": {
      "AdvancOthCapital": 0,
      "TotalOthCurrentAsst": 0,
      "TotalCurrAsst": 0
     }
    }
   }
  },
  "TotalAssets": 0
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
      "TotExciseCustomsVAT": 0
     }
    },
    "AuditFee": 0,
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
     "TrfToReserves": 0,
     "TotAppropriations": 0
    },
    "PartnerAccBalTrf": 0
   }
  },
  "TotalNumOfMonths": 0
 },
 "PARTA_PLIndAS": {
  "CreditsToPL": {
   "GrossProfitTrnsfFrmTrdAcc": 0,
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
      "TotExciseCustomsVAT": 0
     }
    },
    "AuditFee": 0,
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
     "TrfToReserves": 0,
     "TotAppropriations": 0
    },
    "PartnerAccBalTrf": 0
   }
  }
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
    "ProfitLossUs44AE": 0,
    "ProfitLossUs44B": 0,
    "ProfitLossUs44BB": 0,
    "ProfitLossUs44BBA": 0,
    "ProfitLossUs44BBB": 0,
    "ProfitLossUs44BBC": 0,
    "ProfitLossUs44BBD": 0,
    "ProfitLossUs44D": 0,
    "ProfitLossUs44DA": 0,
    "ProfitChapterXIIG": 0,
    "FirstSchITActOthr115B": 0
   },
   "PLUs44sChapXIIGUs115B": 0,
   "TotalProfitFrmActCvrd": 0,
   "ProfitFrmEligBus10TIA": 0,
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
   "OthItemDisallowUs28To44DA": 0,
   "AnyOthIncNotInclInExpDisallowPL": 0,
   "CommissionExpDisallowPL": 0,
   "InterestExpDisallowPL": 0,
   "OthersExpDisallowPL": 0,
   "IncProfDecLossAccICDSAdj": 0,
   "TotAfterAddToPLDeprOthSpecInc": 0,
   "DeductUs32_1_iii": 0,
   "Amt32AC": 0,
   "DebPLUs35ExcessAmt": 0,
   "AmtDisallUs40NowAllow": 0,
   "AmtDisallUs43BNowAllow": 0,
   "AnyOthAmtAllDeduct": 0,
   "DecProfIncLossAccICDSAdj": 0,
   "TotDeductionAmts": 0,
   "PLAftAdjDedBusOthThanSpec": 0,
   "DeemedProfitBusUs": {
    "Section44AE": 0,
    "Section44B": 0,
    "Section44BB": 0,
    "Section44BBA": 0,
    "Section44BBC": 0,
    "Section44BBD": 0,
    "Section44BBB": 0,
    "Section44D": 0,
    "Section44DA": 0,
    "ChapterXIIG": 0,
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
   "AdditionUs28to44DA": 0,
   "DeductUs28to44DA": 0,
   "AdjustedPLFrmSpecuBus": 0
  },
  "IncSpecifiedBusiness": {
   "NetPLFrmSpecifiedBus": 0,
   "AddSec28to44DA": 0,
   "DedSec28to44DAOTDedSec35AD": 0,
   "ProfitLossSpecifiedBusiness": 0,
   "DedSec35AD1": 0,
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
  "IncChargeableTaxNormalRates": 0,
  "NetAgricultureIncomeOrOtherIncomeForRate": 0,
  "LossesOfCurrentYearCarriedFwd": 0
 },
 "PartB_TTI": {
  "ComputationOfTaxLiability": {
   "TaxPayableOnDeemedTI": {
    "TaxDeemedTISec115JB": 0,
    "Surcharge": 0,
    "EducationCess": 0,
    "TotalTax": 0
   },
   "TaxPayableOnTI": {
    "TaxAtNormalRates": 0,
    "TaxAtSpecialRates": 0,
    "TaxPayableOnTotInc": 0,
    "Surcharge25ofSI": 0,
    "SurchargeOnTaxPayable": 0,
    "TotalSurcharge": 0,
    "EducationCess": 0,
    "GrossTaxLiability": 0
   },
   "GrossTaxPayable": 0,
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
  },
  "AssetOutsideIndiaFlg": "YES"
 },
 "Verification": {
  "Declaration": {
   "AssesseeVerName": "na",
   "FatherName": "na",
   "AssesseeVerPAN": "na",
   "Capacity": "MD",
   "Place": "na",
   "Date": "2026-01-01"
  }
 }
};

/* compute() lives in 90_wiring.js (a 2-pass fixpoint over the section
   engines). Until the section-builders register engines, it only sets the
   S.C footer contract the shell reads (#s_gti #s_ti #s_tax #s_b). */

/* Phase 4 bootstrap: placeholder registrations for all 18 screen sections so the
   form always boots with its full structure. Real section-builders call reg()
   later with the same id; 90_wiring resolves each id to the LAST registration,
   so a real section overrides its placeholder. Titles/refs and order from
   books/ITR-6/structure.md (the company return). */
[
 ["who","Who is filing","Part A - General"],
 ["gen","Company particulars","General2 · Nature of business"],
 ["accounts","Audited accounts","BS · Mfg/Trading · P&L · Ind-AS · OI · QD · OL"],
 ["bp","Business and profession","BP · DPM/DOA · DEP/DCG · ESR · ICDS"],
 ["cg","Capital gains","Schedule CG · 112A · 115AD · VDA"],
 ["os","Other sources","Schedule OS"],
 ["hp","House property","Schedule HP"],
 ["loss","Losses — set-off and carry-forward","CYLA · BFLA · CFL · UD"],
 ["ded","Deductions","VIA · 80G/80GGA · 80-IA/IB/IC · 80M · 80IAC · 80LA · 10AA"],
 ["si","Special-rate income","Schedule SI"],
 ["ei","Exempt income","Schedule EI"],
 ["mat","MAT — section 115JB","MAT · MATC"],
 ["fa","Foreign income and assets","FSI · TR · FA"],
 ["al","Assets, liabilities and shareholding","AL-1 · AL-2 · SH-1/SH-2"],
 ["other","Other schedules","PTI · IF · TPSA · 115TD · GST · FD"],
 ["paid","Taxes paid","IT · TDS · TCS"],
 ["tax","Part B — total income and tax","Part B-TI · TTI"],
 ["bank","Verification","Verification"],
].forEach(([id,t,ref])=>reg({id,t,ref,f:()=>note("<b>"+esc(t)+"</b> — being built (Phase 4)."),s:()=>""}));
