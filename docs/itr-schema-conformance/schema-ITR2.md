# ITR-2 export-JSON node tree (schema conformance)

Source: `D:/Downloads/CA_studio/openapi.json` (byte-identical ITR2 node in `docs/sandbox-it-docs/api-reference/it/compliance/openapi.json`).

**Union of request bodies containing ITR2:** exactly one endpoint carries an `ITR.ITR2` node in either file:
- `POST /it/compliance/eri/tax-payers/{tax_payer_id}/itrs/validate`

(For reference: portal `validate`/`e-file` bodies carry only ITR1; eri `submit` carries only ITR3. No other body exposes ITR2, so the tree below is the complete union.)

**Constants (Form_ITR2):** `SchemaVer`, `FormVer`, `AssessmentYear` (format utc-millisec), `FormName`, `Description` are all declared as plain `string` with **no enum/const/default** in the schema — the spec pins their presence, not their values.

**Notation:** `[]` = array; `array<object>` = arrays-of-objects (its item sub-properties are listed immediately after, each still rooted at the `[]` path).

## Summary

| # | Top-level schedule | Leaf/array nodes | Source endpoint |
|---|---|---|---|
| 1 | CreationInfo | 6 | eri validate |
| 2 | Form_ITR2 | 5 | eri validate |
| 3 | PartA_GEN1 | 32 | eri validate |
| 4 | PartB-TI | 33 | eri validate |
| 5 | PartB_TTI | 50 | eri validate |
| 6 | Schedule112A | 27 | eri validate |
| 7 | ScheduleAL | 10 | eri validate |
| 8 | ScheduleAMTC | 20 | eri validate |
| 9 | ScheduleBFLA | 39 | eri validate |
| 10 | ScheduleCFL | 16 | eri validate |
| 11 | ScheduleCGFor23 | 321 | eri validate |
| 12 | ScheduleCYLA | 56 | eri validate |
| 13 | ScheduleEI | 9 | eri validate |
| 14 | ScheduleFA | 10 | eri validate |
| 15 | ScheduleFSI | 1 | eri validate |
| 16 | ScheduleHP | 2 | eri validate |
| 17 | ScheduleIT | 6 | eri validate |
| 18 | ScheduleOS | 103 | eri validate |
| 19 | ScheduleSI | 7 | eri validate |
| 20 | ScheduleTR1 | 4 | eri validate |
| 21 | ScheduleVIA | 46 | eri validate |
| 22 | Verification | 6 | eri validate |
| | **TOTAL** | **809** | |

## CreationInfo

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.CreationInfo.IntermediaryCity` | string | - | - |
| `ITR.ITR2.CreationInfo.JSONCreationDate` | string | - | - |
| `ITR.ITR2.CreationInfo.Digest` | string | - | - |
| `ITR.ITR2.CreationInfo.SWVersionNo` | string | - | - |
| `ITR.ITR2.CreationInfo.SWCreatedBy` | string | - | - |
| `ITR.ITR2.CreationInfo.JSONCreatedBy` | string | - | - |

## Form_ITR2

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.Form_ITR2.SchemaVer` | string | - | - |
| `ITR.ITR2.Form_ITR2.Description` | string | - | - |
| `ITR.ITR2.Form_ITR2.FormVer` | string | - | - |
| `ITR.ITR2.Form_ITR2.AssessmentYear` | string | - | - |
| `ITR.ITR2.Form_ITR2.FormName` | string | - | - |

## PartA_GEN1

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Status` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.MobileNo` | integer | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.ZipCode` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.StateCode` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.CountryCode` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.LocalityOrArea` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.ResidenceNo` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.CityOrTownOrDistrict` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.CountryCodeMobileNoSec` | integer | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.EmailAddress` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.Address.CountryCodeMobile` | integer | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.DOB` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.AadhaarCardNo` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.AssesseeName.SurNameOrOrgName` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.AssesseeName.FirstName` | string | - | - |
| `ITR.ITR2.PartA_GEN1.PersonalInfo.PAN` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.IncrExpAggAmt1LkElctrctyPrYrFlg` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.IncrExpAggAmt2LkTrvFrgnCntryFlg` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.SeventhProvisio139` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.DepAmtAggAmtExcd1CrPrYrFlg` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.PortugeseCC5A` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.OptOutNewTaxRegime` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.ConditionsResStatus` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.ResidentialStatus` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.ItrFilingDueDate` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls[]` | array<any> | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.AsseseeRepFlg` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.CompDirectorPrvYrFlg` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.FiiFpiFlag` | string | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.ReturnFileSec` | integer | - | - |
| `ITR.ITR2.PartA_GEN1.FilingStatus.BenefitUs115HFlg` | string | - | - |

## PartB-TI

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.PartB-TI.CurrentYearLoss` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.ShortTermLongTermTotal` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.CapGains30Per115BBH` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.ShortTerm.ShortTerm20Per` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.ShortTerm.ShortTerm15Per` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.ShortTerm.ShortTerm30Per` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.ShortTerm.ShortTermSplRateDTAA` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.ShortTerm.ShortTermAppRate` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.ShortTerm.TotalShortTerm` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.LongTerm.LongTerm20Per` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.LongTerm.TotalLongTerm` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.LongTerm.LongTermSplRateDTAA` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.LongTerm.LongTerm12_5Per` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.LongTerm.LongTerm10Per` | integer | - | - |
| `ITR.ITR2.PartB-TI.CapGain.TotalCapGains` | integer | - | - |
| `ITR.ITR2.PartB-TI.TotalIncome` | integer | - | - |
| `ITR.ITR2.PartB-TI.GrossTotalIncome` | integer | - | - |
| `ITR.ITR2.PartB-TI.AggregateIncome` | integer | - | - |
| `ITR.ITR2.PartB-TI.DeemedIncomeUs115JC` | integer | - | - |
| `ITR.ITR2.PartB-TI.DeductionsUnderScheduleVIA` | integer | - | - |
| `ITR.ITR2.PartB-TI.BalanceAfterSetoffLosses` | integer | - | - |
| `ITR.ITR2.PartB-TI.LossesOfCurrentYearCarriedFwd` | integer | - | - |
| `ITR.ITR2.PartB-TI.BroughtFwdLossesSetoff` | integer | - | - |
| `ITR.ITR2.PartB-TI.IncFromOS.OtherSrcThanOwnRaceHorse` | integer | - | - |
| `ITR.ITR2.PartB-TI.IncFromOS.TotIncFromOS` | integer | - | - |
| `ITR.ITR2.PartB-TI.IncFromOS.FromOwnRaceHorse` | integer | - | - |
| `ITR.ITR2.PartB-TI.IncFromOS.IncChargblSplRate` | integer | - | - |
| `ITR.ITR2.PartB-TI.IncChargeTaxSplRate111A112` | integer | - | - |
| `ITR.ITR2.PartB-TI.IncomeFromHP` | integer | - | - |
| `ITR.ITR2.PartB-TI.TotalTI` | integer | - | - |
| `ITR.ITR2.PartB-TI.Salaries` | integer | - | - |
| `ITR.ITR2.PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate` | integer | - | - |
| `ITR.ITR2.PartB-TI.IncChargeableTaxSplRates` | integer | - | - |

## PartB_TTI

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.PartB_TTI.Surcharge` | integer | - | - |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails[]` | array<any> | - | - |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[]` | array<object> | - | list |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].BankName` | string | - | - |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].IFSCCode` | string | - | - |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].UseForRefund` | string | - | - |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].BankAccountNo` | string | - | - |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].AccountType` | string | - | - |
| `ITR.ITR2.PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag` | string | - | - |
| `ITR.ITR2.PartB_TTI.Refund.RefundDue` | integer | - | - |
| `ITR.ITR2.PartB_TTI.TaxPaid.BalTaxPayable` | integer | - | - |
| `ITR.ITR2.PartB_TTI.TaxPaid.TaxesPaid.TDS` | integer | - | - |
| `ITR.ITR2.PartB_TTI.TaxPaid.TaxesPaid.TCS` | integer | - | - |
| `ITR.ITR2.PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax` | integer | - | - |
| `ITR.ITR2.PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax` | integer | - | - |
| `ITR.ITR2.PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid` | integer | - | - |
| `ITR.ITR2.PartB_TTI.AssetOutIndiaFlag` | string | - | - |
| `ITR.ITR2.PartB_TTI.TaxPayDeemedTotIncUs115JC` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.GrossTaxPayable` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxAtNormalRatesOnAggrInc` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.RebateOnAgriInc` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxAtSpecialRates` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.SurchargeOnAboveCroreBeforeMarginal` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.Rebate87A` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxInc17` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxDeferredPayableCY` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxDeferred17` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnRebate` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.GrossTaxLiability` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.NetTaxLiability` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.SurchargeOnAboveCrore` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.IntrstPay.TotalIntrstPay` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.IntrstPay.IntrstPayUs234C` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.IntrstPay.IntrstPayUs234A` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.IntrstPay.LateFilingFee234F` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.IntrstPay.IntrstPayUs234B` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.AggregateTaxInterestLiability` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TotalSurcharge` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.CreditUS115JD` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.EducationCess` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.Surcharge25ofSI` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxPayAfterCreditUs115JD` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.Surcharge25ofSIBeforeMarginal` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section91` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section90` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section89` | integer | - | - |
| `ITR.ITR2.PartB_TTI.ComputationOfTaxLiability.TaxRelief.TotTaxRelief` | integer | - | - |
| `ITR.ITR2.PartB_TTI.HealthEduCess` | integer | - | - |
| `ITR.ITR2.PartB_TTI.TotalTaxPayablDeemedTotInc` | integer | - | - |

## Schedule112A

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.Schedule112A.Balance112AAE` | integer | - | - |
| `ITR.ITR2.Schedule112A.Balance112ABE` | integer | - | - |
| `ITR.ITR2.Schedule112A.Deductions112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.TotalBalance112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.SaleValue112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[]` | array<object> | - | list |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].ISINCode` | string | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].ShareTransferredOnOrBefore` | string | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].ShareUnitName` | string | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].NumSharesUnits` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].ShareOnOrBefore` | string | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].FairMktValuePerShareunit` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].TotSaleValue` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].TotFairMktValueCapAst` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].LTCGBeforelowerB1B2` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].ExpExclCnctTransfer` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].TotalDeductions` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].AcquisitionCost` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].SalePricePerShareUnit` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].CostAcqWithoutIndx` | integer | - | - |
| `ITR.ITR2.Schedule112A.Schedule112ADtls[].Balance` | integer | - | - |
| `ITR.ITR2.Schedule112A.Balance112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.ExpExclCnctTransfer112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.FairMktValueCapAst112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.AcquisitionCost112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.LTCGBeforelowerB1B2112A` | integer | - | - |
| `ITR.ITR2.Schedule112A.CostAcqWithoutIndx112A` | integer | - | - |

## ScheduleAL

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleAL.LiabilityInRelatAssets` | integer | - | - |
| `ITR.ITR2.ScheduleAL.ImmovableDetails[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.CashInHand` | integer | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.DepositsInBank` | integer | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.InsurancePolicies` | integer | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.JewelleryBullionEtc` | integer | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.SharesAndSecurities` | integer | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.ArchCollDrawPaintSulpArt` | integer | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.VehiclYachtsBoatsAircrafts` | integer | - | - |
| `ITR.ITR2.ScheduleAL.MovableAsset.LoansAndAdvancesGiven` | integer | - | - |

## ScheduleAMTC

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleAMTC.TotBalBF` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.ScheduleAMTCDtls[]` | array<object> | - | list |
| `ITR.ITR2.ScheduleAMTC.ScheduleAMTCDtls[].AmtCreditUtilized` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.ScheduleAMTCDtls[].AssYr` | string | - | - |
| `ITR.ITR2.ScheduleAMTC.ScheduleAMTCDtls[].Gross` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.ScheduleAMTCDtls[].AmtCreditSetOfEy` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.ScheduleAMTCDtls[].AmtCreditBalBroughtFwd` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.ScheduleAMTCDtls[].BalAmtCreditCarryFwd` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.CurrAssYr` | string | - | - |
| `ITR.ITR2.ScheduleAMTC.TaxSection115JD` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.TaxSection115JC` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.TotSetOffEys` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.CurrYrAmtCreditFwd` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.TotAmtCreditUtilisedCY` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.AmtTaxCreditAvailable` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.TotAMTGross` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.TaxOthProvisions` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.CurrYrCreditCarryFwd` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.TotBalAMTCreditCF` | integer | - | - |
| `ITR.ITR2.ScheduleAMTC.AmtLiabilityAvailable` | integer | - | - |

## ScheduleBFLA

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleBFLA.LTCGDTAARate.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCGDTAARate.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCGDTAARate.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.Salary.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.Salary.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCGDTAARate.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCGDTAARate.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCGDTAARate.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG20Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG20Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG20Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.HP.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.HP.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.HP.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG12_5Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG12_5Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG12_5Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG20Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG20Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG20Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.OthSrcExclRaceHorse.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.OthSrcExclRaceHorse.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG10Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG10Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.LTCG10Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.IncomeOfCurrYrAftCYLABFLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG30Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG30Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG30Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG15Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG15Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCG15Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCGAppRate.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCGAppRate.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | - | - |
| `ITR.ITR2.ScheduleBFLA.STCGAppRate.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | - | - |

## ScheduleCFL

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalLTCGPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalHPPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalSTCGPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.TotalLTCGPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.TotalHPPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.TotalSTCGPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.CurrentAYloss.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.CurrentAYloss.LossSummaryDetail.TotalLTCGPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.CurrentAYloss.LossSummaryDetail.TotalHPPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.CurrentAYloss.LossSummaryDetail.TotalSTCGPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.TotalLTCGPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.TotalHPPTILossCF` | integer | - | - |
| `ITR.ITR2.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.TotalSTCGPTILossCF` | integer | - | - |

## ScheduleCGFor23

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.TotalSTCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtTaxUsDTAAStcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[]` | array<object> | - | list |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.LossSec94of7Or94of8` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.LossSec94of7Or94of8` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].TotalCapGainonassets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].MFSectionCode` | string | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtNotTaxUsDTAAStcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.LossSec94of7Or94of8` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdOthUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdSec50CA` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FairMrktValueUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdRecvUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtDeemedStcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCGAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.LossSec94of7Or94of8` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullValueConsdOthUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullValueConsdSec50CA` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FairMrktValueUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullValueConsdRecvUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaidTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaid` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTNotPaid` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaidTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.UnutilizedStcgFlag` | string | - | - |
| `ITR.ITR2.ScheduleCGFor23.ShortTermCapGainFor23.AmtDeemedStcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.SumOfCGIncm` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.IncmFromVDATrnsf` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.DeducClaimInfo.TotDeductClaim` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs115F[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54B[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54EC[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54F[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalExcessTax` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalLTCGImmblPrprtyBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalLTCGImmblPrprtyAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalLTCGImmblPrprty` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[]` | array<object> | - | list |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductionUs54F` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.Tax_S1121_20` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.Tax_S1121P_10` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductSec48.ImproveCostIndexed` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductSec48.AquisitCostIndexed` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.DeductSec48.TotalDednForExcess` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.BalanceCGForExcess` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.CapgainonAssetsForExcess` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls_BE.ExcessTax` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.DeductionUs54F` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112Applicabledtls.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.Proviso112Applicable[].Proviso112SectionCode` | string | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.TotalAmtDeemedLtcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115AE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115BE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.BalonSpeciAssetTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.BalonSpeciAssetTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAsset` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAssetTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.BalonSpeciAsset` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAssetTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.AmtDeemedLtcgTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54FBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54F` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCGTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCGTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssetsTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssetsTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54FAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.AmtDeemedLtcgTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.TotalAmtNotTaxUsDTAALtcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCGUs112A12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.TotalLTCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.TotalAmtTaxUsDTAALtcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.UnutilizedLtcgFlag` | string | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54FBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54F` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCGTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCGTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssetsTransferAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssetsTransferBE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54FAE` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.TotalCapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductionUs54F` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullValueConsdOthUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullValueConsdSec50CA` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FairMrktValueUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullValueConsdRecvUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductionUs54F` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullValueConsdOthUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullValueConsdSec50CA` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FairMrktValueUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullValueConsdRecvUnqshr` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.AmtDeemedLtcg` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCGUs112A` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductionUs54F` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.CapgainonAssets` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.FullConsideration` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.ImproveCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.ExpOnTrans` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.AquisitCost` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.TotalDedn` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.BalanceCG` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG10Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.TotScheduleCGFor23` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.LtclSetOff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.LtclSetOff10Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.LtclSetOffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOff10Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOff12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOff10Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOff12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg20Per.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg20Per.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.LtclSetOff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.LtclSetOff10Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.LtclSetOff12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg30Per.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg30Per.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.LtclSetOff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.LtclSetOff12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.LtclSetOffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg15Per.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg15Per.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.LtclSetOff10Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.LtclSetOff12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.LtclSetOffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.CurrYearIncome` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.CurrYrCapGain` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOff10Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoff15Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoffAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOff12_5Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOffDTAARate` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoff20Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoff30Per` | integer | - | - |
| `ITR.ITR2.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoffDTAARate` | integer | - | - |

## ScheduleCYLA

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleCYLA.LTCGDTAARate.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCGDTAARate.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCGDTAARate.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCGDTAARate.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.Salary.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.Salary.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.Salary.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.Salary.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGDTAARate.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGDTAARate.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGDTAARate.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGDTAARate.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG20Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG20Per.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG20Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG20Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.HP.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.HP.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.HP.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG12_5Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG12_5Per.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG12_5Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG12_5Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG20Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG20Per.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG20Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG20Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.TotalCurYr.TotOthSrcLossNoRaceHorse` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.TotalCurYr.TotHPlossCurYr` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG10Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG10Per.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG10Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.LTCG10Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG30Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG30Per.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG30Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG30Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG15Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG15Per.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG15Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCG15Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGAppRate.IncCYLA.IncOfCurYrUnderThatHead` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGAppRate.IncCYLA.HPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGAppRate.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.STCGAppRate.IncCYLA.IncOfCurYrAfterSetOff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff` | integer | - | - |
| `ITR.ITR2.ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff` | integer | - | - |

## ScheduleEI

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleEI.Others` | integer | - | - |
| `ITR.ITR2.ScheduleEI.PassThrIncNotChrgblTax` | integer | - | - |
| `ITR.ITR2.ScheduleEI.UnabAgriLossPrev8` | integer | - | - |
| `ITR.ITR2.ScheduleEI.TotalExemptInc` | integer | - | - |
| `ITR.ITR2.ScheduleEI.IncNotChrgblToTax` | integer | - | - |
| `ITR.ITR2.ScheduleEI.InterestInc` | integer | - | - |
| `ITR.ITR2.ScheduleEI.NetAgriIncOrOthrIncRule7` | integer | - | - |
| `ITR.ITR2.ScheduleEI.GrossAgriRecpt` | integer | - | - |
| `ITR.ITR2.ScheduleEI.ExpIncAgri` | integer | - | - |

## ScheduleFA

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleFA.DetailsOfAccntsHvngSigningAuth[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DtlsForeignCashValueInsurance[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DetailsFinancialInterest[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DetailsOfTrustOutIndiaTrustee[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DetailsImmovableProperty[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DetailsOfOthSourcesIncOutsideIndia[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DtlsForeignEquityDebtInterest[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DetailsOthAssets[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DetailsForiegnBank[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleFA.DtlsForeignCustodialAcc[]` | array<any> | - | - |

## ScheduleFSI

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleFSI` | object | - | - |

## ScheduleHP

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleHP.TotalIncomeChargeableUnHP` | integer | - | - |
| `ITR.ITR2.ScheduleHP.PropertyDetails[]` | array<any> | - | - |

## ScheduleIT

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleIT.TaxPayment[]` | array<object> | - | list |
| `ITR.ITR2.ScheduleIT.TaxPayment[].Amt` | integer | - | - |
| `ITR.ITR2.ScheduleIT.TaxPayment[].SrlNoOfChaln` | integer | - | - |
| `ITR.ITR2.ScheduleIT.TaxPayment[].DateDep` | string | - | - |
| `ITR.ITR2.ScheduleIT.TaxPayment[].BSRCode` | string | - | - |
| `ITR.ITR2.ScheduleIT.TotalTaxPayments` | integer | - | - |

## ScheduleOS

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleOS.TotOthSrcNoRaceHorse` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115ACA.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115ACA.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115ACA.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115ACA.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115ACA.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendDTAA.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendDTAA.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendDTAA.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendDTAA.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendDTAA.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AC.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AC.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AC.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AC.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AC.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.NOT89A.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.NOT89A.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.NOT89A.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.NOT89A.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.NOT89A.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDA.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDA.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDA.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDA.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDA.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncFrmLottery.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncFrmLottery.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncFrmLottery.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncFrmLottery.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncFrmLottery.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115A1ai.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115A1ai.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115A1ai.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115A1ai.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115A1ai.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncChargeable` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Up16Of9To15Of12` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.DividendGross` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.InterestGross` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.RentFromMachPlantBldgs` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.SumRecdPrYrBusTRU562xii` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.AnyOtherIncome` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotified89ATypeOS[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.NatofPassThrghIncome` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmTermDeposit` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.CashCreditsUs68` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.OthersGrossDtls[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmSavingBank` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XISecondProviso` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.GrossIncChrgblTaxAtAppRate` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Anyotherpropwithoutcons562x` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.UnDsclsdInvstmntsUs69B` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XIISecondProviso` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.LtryPzzlChrgblUs115BB` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IncChargeableSpecialRates` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotifiedPrYr89AOS` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmIncmTaxRefund` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XIIFirstProviso` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Anyotherpropinadeqcons562x` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotifiedOther89AOS` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Tot562x` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.FamilyPension` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.UnExplndInvstmntsUs69` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.UnExplndExpndtrUs69C` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.PTIOthersGrossDtls[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.OthersGross` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.ProfitChargTaxUs59` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmOthers` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Immovpropwithoutcons562x` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBE` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBJ` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.AmtBrwdRepaidOnHundiUs69D` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.PassThrIncOSChrgblSplRate` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.DividendOthThan22e` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls[]` | array<any> | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TotalIncomeBenefit` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TotalTaxBenefit` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Aggrtvaluewithoutcons562x` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.SumRecdPrYrLifIns562xiii` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.UnExplndMoneyUs69A` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XIFirstProviso` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.Depreciation` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.UsrIntExp57` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.Expenses` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.DeductionUs57iia` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.IntExp57` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.TotDeductions` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.AmtNotDeductibleUs58` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Dividend22e` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Immovpropinadeqcons562x` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.Dividend22f` | integer | - | - |
| `ITR.ITR2.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotified89AOS` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AD1i.DateRange.Upto15Of6` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AD1i.DateRange.Upto15Of9` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AD1i.DateRange.Up16Of3To31Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AD1i.DateRange.Up16Of12To15Of3` | integer | - | - |
| `ITR.ITR2.ScheduleOS.DividendIncUs115AD1i.DateRange.Up16Of9To15Of12` | integer | - | - |

## ScheduleSI

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleSI.TotSplRateInc` | integer | - | - |
| `ITR.ITR2.ScheduleSI.SplCodeRateTax[]` | array<object> | - | list |
| `ITR.ITR2.ScheduleSI.SplCodeRateTax[].SplRateIncTax` | integer | - | - |
| `ITR.ITR2.ScheduleSI.SplCodeRateTax[].SplRatePercent` | integer | - | - |
| `ITR.ITR2.ScheduleSI.SplCodeRateTax[].SplRateInc` | integer | - | - |
| `ITR.ITR2.ScheduleSI.SplCodeRateTax[].SecCode` | string | - | - |
| `ITR.ITR2.ScheduleSI.TotSplRateIncTax` | integer | - | - |

## ScheduleTR1

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleTR1.TaxReliefOutsideIndiaDTAA` | integer | - | - |
| `ITR.ITR2.ScheduleTR1.TaxReliefOutsideIndiaNotDTAA` | integer | - | - |
| `ITR.ITR2.ScheduleTR1.TotalTaxPaidOutsideIndia` | integer | - | - |
| `ITR.ITR2.ScheduleTR1.TotalTaxReliefOutsideIndia` | integer | - | - |

## ScheduleVIA

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80DD` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80EE` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80GG` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80EEA` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80GGA` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80TTA` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80DDB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80EEB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80QQB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80RRB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80TTB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80CCC` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80GGC` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80U` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80CCDEmployer` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.TotalChapVIADeductions` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80C` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80D` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80CCD1B` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80G` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.AnyOthSec80CCH` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80E` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.UsrDeductUndChapVIA.Section80CCDEmployeeOrSE` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80DD` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80EE` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80GG` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80EEA` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80GGA` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80TTA` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80DDB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80EEB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80RRB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80QQB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80TTB` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80CCC` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80GGC` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80U` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80CCDEmployer` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.TotalChapVIADeductions` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80C` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80D` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80CCD1B` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80G` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.AnyOthSec80CCH` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80E` | integer | - | - |
| `ITR.ITR2.ScheduleVIA.DeductUndChapVIA.Section80CCDEmployeeOrSE` | integer | - | - |

## Verification

| path | type | required | note |
|---|---|---|---|
| `ITR.ITR2.Verification.Capacity` | string | - | - |
| `ITR.ITR2.Verification.Declaration.AssesseeVerName` | string | - | - |
| `ITR.ITR2.Verification.Declaration.AssesseeVerPAN` | string | - | - |
| `ITR.ITR2.Verification.Declaration.FatherName` | string | - | - |
| `ITR.ITR2.Verification.Date` | string | - | - |
| `ITR.ITR2.Verification.Place` | string | - | - |

---

**Total top-level schedules:** 22
**Total leaf/array nodes:** 809

Top-level schedules: CreationInfo, Form_ITR2, PartA_GEN1, PartB-TI, PartB_TTI, Schedule112A, ScheduleAL, ScheduleAMTC, ScheduleBFLA, ScheduleCFL, ScheduleCGFor23, ScheduleCYLA, ScheduleEI, ScheduleFA, ScheduleFSI, ScheduleHP, ScheduleIT, ScheduleOS, ScheduleSI, ScheduleTR1, ScheduleVIA, Verification