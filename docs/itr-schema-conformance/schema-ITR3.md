# ITR-3 export-JSON schema conformance

Source OpenAPI: `D:/Downloads/CA_studio/openapi.json` (identical ITR3 tree in `docs/sandbox-it-docs/api-reference/it/compliance/openapi.json`).

**ITR3 appears in exactly one request body:** `POST /it/compliance/eri/tax-payers/{tax_payer_id}/itrs/submit`. The `validate` sibling endpoint carries ITR2 only, and the ITD-portal `validate`/`e-file` endpoints carry ITR1 only, so the union across all ITR3-bearing bodies = this single schema.

## Constants (Form_ITR3)

| Constant | Value |
|---|---|
| SchemaVer | Ver1.0 |
| FormVer | Ver1.0 |
| AssessmentYear | 2025 |
| FormName | ITR-3 |
| Description | For indls and HUFs having income from a proprietory business or profession |

Legend: `required` = declared in its parent object's `required` array (Y/n). `[]` denotes an array; `array<object>` rows are expanded into item sub-properties on the following lines.

## Summary

Total top-level schedules: **37**. Total leaf nodes across all schedules: **1690**.

Top-level schedules (37): CreationInfo, Form_ITR3, ITR3ScheduleBP, ITR3ScheduleUD, PARTA_BS, PARTA_OI, PARTA_PL, PartA_GEN1, PartA_GEN2, PartB-TI, PartB_TTI, Schedule112A, Schedule80_IA, Schedule80_IB, ScheduleAL, ScheduleAMTC, ScheduleBFLA, ScheduleCFL, ScheduleCGFor23, ScheduleCYLA, ScheduleDEP, ScheduleDOA, ScheduleDPM, ScheduleEI, ScheduleFA, ScheduleFSI, ScheduleGST, ScheduleHP, ScheduleOS, ScheduleS, ScheduleSI, ScheduleTDS1, ScheduleTDS2, ScheduleTR1, ScheduleVIA, TradingAccount, Verification

## CreationInfo  (6 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.CreationInfo.IntermediaryCity` | string | n | submit |
| `ITR.ITR3.CreationInfo.JSONCreationDate` | string | n | submit |
| `ITR.ITR3.CreationInfo.Digest` | string | n | submit |
| `ITR.ITR3.CreationInfo.SWVersionNo` | string | n | submit |
| `ITR.ITR3.CreationInfo.SWCreatedBy` | string | n | submit |
| `ITR.ITR3.CreationInfo.JSONCreatedBy` | string | n | submit |

## Form_ITR3  (5 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.Form_ITR3.SchemaVer` | string | n | submit |
| `ITR.ITR3.Form_ITR3.Description` | string | n | submit |
| `ITR.ITR3.Form_ITR3.FormVer` | string | n | submit |
| `ITR.ITR3.Form_ITR3.AssessmentYear` | string | n | submit |
| `ITR.ITR3.Form_ITR3.FormName` | string | n | submit |

## ITR3ScheduleBP  (122 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ITR3ScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecBusinessInc.DeductUs28to44DA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecBusinessInc.AdditionUs28to44DA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecBusinessInc.NetPLFrmSpecBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusSetoffCurrYr.TotLossSetOffOnBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusSetoffCurrYr.LossSetOffOnBusLoss` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusSetoffCurrYr.SpeculativeInc.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusSetoffCurrYr.SpeculativeInc.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusSetoffCurrYr.SpeculativeInc.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusSetoffCurrYr.LossRemainSetOffOnBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.IncChrgUnHdProftGain` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.NetPLFromSpecifiedBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AnyOthIncNotInclInSalary` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AnyOthIncNotInclInBonus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AmtDebPLDisallowUs40` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs80IA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AnyOthIncNotInclInExpDisallowPL` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AmtDisallUs40NowAllow` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.PLUs44sChapXIIG` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs43CA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AmtDisallUs43BNowAllow` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44BBC` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44BBA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44AE` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44AD` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44ADA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44BB` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44B` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44DA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.TotalProfitFrmActCvrd` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.BalancePLOthThanSpecBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ChrgblIncUndrRule7` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeductUs32_1_iii` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DepreciationAllowITAct32.DepreciationAllowUs32_1_i` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DepreciationAllowITAct32.DepreciationAllowUs32_1_ii` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DepreciationAllowITAct32.TotDeprAllowITAct` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs72A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncCredPL.FirmShareInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncCredPL.OtherExmptIncDtl.OperatingDividendAmt` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncCredPL.OtherExmptIncDtl.OperatingDividendName` | string | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncCredPL.OtherExmptIncDtl.OtherExmptIncDtls[]` | array<any> | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncCredPL.AOPBOISharInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncCredPL.TotExempIncPL` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncCredPL.OthExempInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.Salary` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.CapitalGains` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.Us115BBF` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.HouseProperty` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.Us115BBG` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.115BBH` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLOthHeadDtls.OtherSources` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncomeOtherThanRule` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.InterestDisAllowUs23SMEAct` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.NetPLFromSpecBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs33ABA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.TotDeductionAmts` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs33AB` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs41` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs80HHD` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AnyOthAmtAllDeduct` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AmtDebPLDisallowUs43B` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedChrgblIncUndrRule8` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedChrgblIncUndrRule7B1` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7B1A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule8` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7B1` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DecProfIncLossAccICDSAdj` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AdjustedPLOthThanSpecBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.OthItemDisallowUs28To44DA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncProfDecLossAccICDSAdj` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DebPLUs35ExcessAmt` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.PLAftAdjDedBusOthThanSpec` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AE` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AD` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BB` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BBA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.TotDeemedProfitBusUs` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BBC` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44ADA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44B` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44DA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.TotAfterAddToPLDeprOthSpecInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Salary` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.CapitalGains` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Us115BBF` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.HouseProperty` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Us115BBG` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.115BBH` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.OtherSources` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Dividend` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.OtherThanDividend` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AmtDebPLDisallowUs40A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs40A3A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedChrgblIncUndrRule7A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ProfBfrTaxPL` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AnyOthIncNotInclInOthers` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.NetPLAftAdjBusOthThanSpec` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedChrgblIncUndrRule7B1A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DepreciationDebPLCosAct` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs3380HHD80IA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AdjustPLAfterDeprOthSpecInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLExemptInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.BalIncDeemedFrmAgri` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AmtDebPLDisallowUs36` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AmtDebPLDisallowUs37` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.TotExpDebPL` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs35ABB` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs32AD` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.ExpDebToPLExemptIncDisAllwUs14A` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.DeemIncUs35ABA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AnyOthIncNotInclInCommission` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.BusinessIncOthThanSpec.AnyOthIncNotInclInInterest` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecifiedBusinessInc.DedSec28to44DAOTDedSec35AD` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecifiedBusinessInc.DeductionUs35AD` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecifiedBusinessInc.NetPLFrmSpecifiedBus` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecifiedBusinessInc.DedUs35ADSubSec5Dtls[]` | array<any> | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecifiedBusinessInc.AddSec28to44DA` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecifiedBusinessInc.ProfitLossSpecifiedBusiness` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleBP.SpecifiedBusinessInc.PLFrmSpecifiedBus` | integer | n | submit |

## ITR3ScheduleUD  (11 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ITR3ScheduleUD.CurrAssYr` | string | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.CurBalCFNY` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.TotBFUAllowAmt` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.TotBFUDepritAmt` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.TotDepritBalCFNY` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.TotAdjustAccTax115BACAmt` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.ScheduleUD[]` | array<any> | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.TotCurYrAllowSetoffInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.CurAllowBalCFNY` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.TotCurYrdepritSetoffInc` | integer | n | submit |
| `ITR.ITR3.ITR3ScheduleUD.TotalBalCFNY` | integer | n | submit |

## PARTA_BS  (70 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.PARTA_BS.NoBooksOfAccBS.CashBalAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.NoBooksOfAccBS.TotStkInTradAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.NoBooksOfAccBS.TotSundryDbtAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.NoBooksOfAccBS.TotSundryCrdAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.LongTermInv.TotLongTermInv` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.LongTermInv.GovtOthSecQuoted` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.LongTermInv.GovOthSecUnQoted` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.TradeInv.TotTradeInv` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.TradeInv.EquityShares` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.TradeInv.Debenture` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.TradeInv.PreferShares` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.Investments.TotInvestments` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.TotFundApply` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.FixedAsset.GrossBlock` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.FixedAsset.Depreciation` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.FixedAsset.CapWrkProg` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.FixedAsset.NetBlock` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.FixedAsset.TotFixedAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.MiscAdjust.DefTaxAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.MiscAdjust.TotMiscAdjust` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.MiscAdjust.AccumaltedLosses` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.MiscAdjust.MiscExpndr` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.TotCurrAssetLoanAdv` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.RawMatl` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.TotInventries` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StkInProcess` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.FinOrTradGood` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StoresConsumables` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.TotCurrAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.BankBal` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.TotCashOrBankBal` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.CashinHand` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.SndryDebtors` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrAsset.OthCurrAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCred` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.TotCurrLiabilities` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.LiabForLeasedAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntonLeasedAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntNotDue` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.TotCurrLiabilitiesProvision` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.TotProvisions` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ELSuperAnnGratProvision` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.OthProvision` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ITProvision` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.NetCurrAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.LoanAdv.TotLoanAdv` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.LoanAdv.Deposits` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.LoanAdv.BalWithRevAuth` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundApply.CurrAssetLoanAdv.LoanAdv.AdvRecoverable` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.Advances.FromOthers` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.Advances.FromPrsn` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.Advances.TotalAdvances` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.PropFund.PropCap` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.PropFund.ResrNSurp.StatResr` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.PropFund.ResrNSurp.TotResrNSurp` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.PropFund.ResrNSurp.RevResr` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.PropFund.ResrNSurp.OthResr` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.PropFund.ResrNSurp.CapResr` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.PropFund.TotPropFund` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.TotFundSrc` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.SecrLoan.ForeignCurrLoan` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmBank` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.SecrLoan.RupeeLoan.TotRupeeLoan` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmOthrs` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.SecrLoan.TotSecrLoan` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.TotLoanFund` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.UnsecrLoan.FrmBank` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.UnsecrLoan.TotUnSecrLoan` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.LoanFunds.UnsecrLoan.FrmOthrs` | integer | n | submit |
| `ITR.ITR3.PARTA_BS.FundSrc.DeferredTax` | integer | n | submit |

## PARTA_OI  (98 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.PARTA_OI.PriorAmtIncCrDrPL` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.EmpBonusComm` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.LeaveEncashPayable` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.MSEPayable` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.TaxDutyCesAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.ContToEmpPFSFGF` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.RailwayAssetsPayable` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.SumPayaleLoanBrToFinComp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.IntPayaleToFISchBank` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.IntPayaleToFI` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.DeemedProfUs33ABA` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.MethodOfValClgStk.DecProOrIncLossUs145_A` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.MethodOfValClgStk.ValRawMaterial` | string | n | submit |
| `ITR.ITR3.PARTA_OI.MethodOfValClgStk.EffectOnPL` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.MethodOfValClgStk.ValFinishedGoods` | string | n | submit |
| `ITR.ITR3.PARTA_OI.MethodOfValClgStk.ChngStockValMetFlg` | string | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.EmpBonusComm` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.LeaveEncashPayable` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.MSEPayable` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.TaxDutyCesAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.ContToEmpPFSFGF` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.RailwayAssetsPayable` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.SumPayaleLoanBrToFinComp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.TotAmtUs43b` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.IntPayaleToFISchBank` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisall43B.AmtUs43B.IntPayaleToFI` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.DeemedProfUs33AB` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmountOfExpDisAllwUs14A` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.ChangeInAcctMethFlg` | string | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.IntSalBonPartner` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.OthDisallow` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.NonComp40aiiChapXVIIBAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.NonComp40aiiiChapXVIIBAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.NonComp40aibChapXVIIBAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.TotAmtDisallUs40` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.WTAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.RolyatyOrServiceFee` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.NonCompChapXVIIBAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.TaxAmtOnProfits` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40.AmtDisallUs40PyNowAll` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.MethodOfAcct` | string | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.IntegratedGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.ServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.StateGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.CentralGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.OthDutyTaxCess` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.Cess` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.VATorSaleTax` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.UnionExciseDuty` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.UnionTerrGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.ProfTaxAmtUs41` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.DeemedProfUs33ABs` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.ScheduleTPSAFlg` | string | n | submit |
| `ITR.ITR3.PARTA_OI.NoCredToPLAmt.CapReceipt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.NoCredToPLAmt.ProformaCreditsDue` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.NoCredToPLAmt.Section28Items` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.NoCredToPLAmt.OthItemInc` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.NoCredToPLAmt.PrevYrEscalClaim` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.NoCredToPLAmt.TotNoCredToPLAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.ProfDeviatDueAcctMeth` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.DecProOrIncLossUs145_2` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.BusOrProfessnExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.OffenceExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.TotAmtDisallUs37` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.OthPenalFineExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.LawVoilatPenalExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.ContigentLiability` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.CapitalNatureExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.PoliticPartyExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.PersonalExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs37.OthAmtNotAllowUs37` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.IntOnBorrCap` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.EmpContributionCredits` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.TotAmtDisallUs36` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.PensionSchemeSec80CCD` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.FamPlanPromoExp` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.AppSuperAnnFundAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.ZeroCoupBondDisc` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.MrktLossOthExpLossICDS` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.BadDebtDoubtProvn` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.AppGratFundAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.EmpHealthInsurPrem` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.OthDisallowances` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.RecogPFContribAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.SpecResrvTranfr` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.StkInsurPrem` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.BadDebtDoubtAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.SecuritiesPaidAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.EmpBonusCommSum` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs36.OthFundAmt` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40A.OthDisallow` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40A.ProvPmtGrat` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40A.AmtGT20kCash` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40A.TotAmtDisallUs40A` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40A.ContToSetupTrust` | integer | n | submit |
| `ITR.ITR3.PARTA_OI.AmtDisallUs40A.AmtPaidUs40A2b` | integer | n | submit |

## PARTA_PL  (139 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.PARTA_PL.TotalNumOfMonths` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TotalPrsumptvIncUs44EGoods` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrossReceipt` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrsRcptAccPayeeOrBankMode` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.NetProfit` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.ExpensesPrf` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrossReceiptPrf` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.Expenses` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrsRcptOtherModePrf` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrossProfit` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrsRcptOtherMode` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.NetProfitPrf` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrsRcptAccPayeeOrBankModePrf` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.GrossProfitPrf` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NoBooksOfAccPL.TotBusinessProfession` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RoyalityDtls.Others` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RoyalityDtls.Total` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RoyalityDtls.NonResOtherCompany` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Hospitality` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.HotelBoardLodge` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.SalsWages` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.ContToPF` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.LeaveTravelBenft` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.AnyCompPaidToNonRes` | string | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.Bonus` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.ContToGratFund` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.AmtPaidToNonRes` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.TotEmployeeComp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.LeaveEncash` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.ContToOthFund` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.MedExpReimb` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.OthEmpBenftExpdr` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.EmployeeComp.ContToSuperAnnFund` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Entertainment` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.InterestExpdrtDtls.Others` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.InterestExpdrtDtls.InterestExpdr` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.InterestExpdrtDtls.NonResOtherCompany` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.CommissionExpdrDtls.Others` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.CommissionExpdrDtls.Total` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.CommissionExpdrDtls.NonResOtherCompany` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.StaffWelfareExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ClubExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.AuditFee` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Conference` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.OtherExpensesDtls[]` | array<object> | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.OtherExpensesDtls[].ExpenseNature` | string | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.OtherExpensesDtls[].Amount` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.FestivalCelebExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.TravelExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Donation` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Advertisement` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RepairMach` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Scholarship` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Freight` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.GuestHouseExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.OtherExpenses` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.PBT` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ConsumptionOfStores` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ProfessionalConstDtls.Others` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ProfessionalConstDtls.Total` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ProfessionalConstDtls.NonResOtherCompany` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.BadDebtDtls.OthersAmtLt1Lakh` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.BadDebtDtls.BadDebtAmtDtls[]` | array<any> | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.BadDebtDtls.BadDebtAmtDtlsTotal` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.BadDebtDtls.OthersPANNotAvlblDtlTotal` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.BadDebtDtls.OthersPANNotAvlblDtl[]` | array<any> | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.BadDebtDtls.BadDebt` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.SalePromoExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.TelephoneExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ProvForBadDoubtDebt` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ForeignTravelExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Gift` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RentExpdr` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Insurances.MedInsur` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Insurances.TotInsurances` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Insurances.LifeInsur` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Insurances.KeyManInsur` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.Insurances.OthInsur` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.PowerFuel` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.ConveyanceExp` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.DepreciationAmort` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RepairsBldg` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.IntegratedGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.TotExciseCustomsVAT` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.ServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.StateGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.CentralGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.OthDutyTaxCess` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.Cess` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.VATorSaleTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.UnionExciseDuty` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.RatesTaxesPays.ExciseCustomsVAT.UnionTerrGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.PBIDTA` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.DebitsToPL.OthProvisionsExpdr` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.Otherincomenotturnover` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.Dividends` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.Comissions` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.ProfitOnInvChrSTT` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.MiscOthIncome` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.ProfitOnSaleFixedAsset` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.ProfitOnOthInv` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.TotOthIncome` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.ProfitOnAgriIncome` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.ProfitOnCurrFluct` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.RentInc` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.OtherIncDtls[]` | array<object> | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.OtherIncDtls[].Amount` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.OtherIncDtls[].NatureOfIncome` | string | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.InterestInc` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.ProfitOnCnvInvntryToCapAsst` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.OthIncome.LiabilityWrittenBack` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.GrossProfitTrnsfFrmTrdAcc` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.CreditsToPL.TotCreditsToPL` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.GoodsDtlsUs44AE[]` | array<any> | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44AD.PersumptiveInc44AD8Per` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44AD.GrsTrnOverBank` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44AD.GrsTrnOverAnyOthMode` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44AD.GrsTotalTrnOverInCash` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44AD.GrsTrnOverOrReceipt` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44AD.PersumptiveInc44AD6Per` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44AD.TotPersumptiveInc44AD` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NatOfBus44ADA[]` | array<any> | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44ADA.GrsTrnOverBank44ADA` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44ADA.TotPersumptiveInc44ADA` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44ADA.GrsReceipt` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.PersumptiveInc44ADA.GrsTrnOverAnyOthMode44ADA` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TurnverFrmSpecActivity` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NatOfBus44AE[]` | array<any> | n | submit |
| `ITR.ITR3.PARTA_PL.TaxProvAppr.AmtAvlAppr` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TaxProvAppr.ProvDefTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TaxProvAppr.BalBFPrevYr` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TaxProvAppr.TrfToReserves` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TaxProvAppr.ProvForCurrTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TaxProvAppr.ProfitAfterTax` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.TaxProvAppr.ProprietorAccBalTrf` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NatOfBus44AD[]` | array<any> | n | submit |
| `ITR.ITR3.PARTA_PL.TotalPrsumptvIncUs44E` | integer | n | submit |
| `ITR.ITR3.PARTA_PL.NetIncomeFrmSpecActivity` | integer | n | submit |

## PartA_GEN1  (39 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Status` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.MobileNo` | integer | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.StateCode` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.CountryCode` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.LocalityOrArea` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.ResidenceNo` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.CityOrTownOrDistrict` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.CountryCodeMobileNoSec` | integer | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.EmailAddress` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.PinCode` | integer | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.Address.CountryCodeMobile` | integer | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.DOB` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.AadhaarCardNo` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.AssesseeName.SurNameOrOrgName` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.AssesseeName.FirstName` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.AssesseeName.MiddleName` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.PersonalInfo.PAN` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.IncrExpAggAmt1LkElctrctyPrYrFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.IncrExpAggAmt2LkTrvFrgnCntryFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.No_OptOutNewTaxReg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.SeventhProvisio139` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.DepAmtAggAmtExcd1CrPrYrFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.PortugeseCC5A` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.PartnerInFirmFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.NriSEPinIndia` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.ConditionsResStatus` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.ForeignExchangeFlag` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.ResidentialStatus` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.ItrFilingDueDate` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.OptOutNewTaxRegime_Method` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls[]` | array<any> | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.AsseseeRepFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.CompDirectorPrvYrFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.FiiFpiFlag` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.ReturnFileSec` | integer | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.BenefitUs115HFlg` | string | n | submit |
| `ITR.ITR3.PartA_GEN1.FilingStatus.NriPEinIndia` | string | n | submit |

## PartA_GEN2  (11 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.PartA_GEN2.AuditInfo.IncDclrdUs` | string | n | submit |
| `ITR.ITR3.PartA_GEN2.AuditInfo.LiableSec92Eflg` | string | n | submit |
| `ITR.ITR3.PartA_GEN2.AuditInfo.TotalSalesExcOneCr` | string | n | submit |
| `ITR.ITR3.PartA_GEN2.AuditInfo.LiableSec44ABflg` | string | n | submit |
| `ITR.ITR3.PartA_GEN2.AuditInfo.AccountAuditFlag` | string | n | submit |
| `ITR.ITR3.PartA_GEN2.AuditInfo.LiableSec44AAflg` | string | n | submit |
| `ITR.ITR3.PartA_GEN2.AuditInfo.AuditDetails[]` | array<any> | n | submit |
| `ITR.ITR3.PartA_GEN2.AuditInfo.AuditReportDetails[]` | array<any> | n | submit |
| `ITR.ITR3.PartA_GEN2.NatOfBus.NatureOfBusiness[]` | array<object> | n | submit |
| `ITR.ITR3.PartA_GEN2.NatOfBus.NatureOfBusiness[].TradeName1` | string | n | submit |
| `ITR.ITR3.PartA_GEN2.NatOfBus.NatureOfBusiness[].Code` | string | n | submit |

## PartB-TI  (41 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.PartB-TI.CurrentYearLoss` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.ShortTermLongTermTotal` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.CapGains30Per115BBH` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.ShortTerm.ShortTerm20Per` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.ShortTerm.ShortTerm15Per` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.ShortTerm.ShortTerm30Per` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.ShortTerm.ShortTermSplRateDTAA` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.ShortTerm.ShortTermAppRate` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.ShortTerm.TotalShortTerm` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.LongTerm.LongTerm20Per` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.LongTerm.TotalLongTerm` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.LongTerm.LongTermSplRateDTAA` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.LongTerm.LongTerm12_5Per` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.LongTerm.LongTerm10Per` | integer | n | submit |
| `ITR.ITR3.PartB-TI.CapGain.TotalCapGains` | integer | n | submit |
| `ITR.ITR3.PartB-TI.DeductionsUnder10Aor10AA` | integer | n | submit |
| `ITR.ITR3.PartB-TI.TotalIncome` | integer | n | submit |
| `ITR.ITR3.PartB-TI.GrossTotalIncome` | integer | n | submit |
| `ITR.ITR3.PartB-TI.ProfBusGain.TotProfBusGain` | integer | n | submit |
| `ITR.ITR3.PartB-TI.ProfBusGain.ProfGainNoSpecBus` | integer | n | submit |
| `ITR.ITR3.PartB-TI.ProfBusGain.ProfIncome115BBF` | integer | n | submit |
| `ITR.ITR3.PartB-TI.ProfBusGain.ProfGainSpecBus` | integer | n | submit |
| `ITR.ITR3.PartB-TI.ProfBusGain.ProfGainSpecifiedBus` | integer | n | submit |
| `ITR.ITR3.PartB-TI.AggregateIncome` | integer | n | submit |
| `ITR.ITR3.PartB-TI.DeemedIncomeUs115JC` | integer | n | submit |
| `ITR.ITR3.PartB-TI.BalanceAfterSetoffLosses` | integer | n | submit |
| `ITR.ITR3.PartB-TI.DeductionsUndSchVIADtl.PartCchapterVIA` | integer | n | submit |
| `ITR.ITR3.PartB-TI.DeductionsUndSchVIADtl.TotDeductUndSchVIA` | integer | n | submit |
| `ITR.ITR3.PartB-TI.DeductionsUndSchVIADtl.PartBchapterVIA` | integer | n | submit |
| `ITR.ITR3.PartB-TI.LossesOfCurrentYearCarriedFwd` | integer | n | submit |
| `ITR.ITR3.PartB-TI.BroughtFwdLossesSetoff` | integer | n | submit |
| `ITR.ITR3.PartB-TI.IncFromOS.OtherSrcThanOwnRaceHorse` | integer | n | submit |
| `ITR.ITR3.PartB-TI.IncFromOS.TotIncFromOS` | integer | n | submit |
| `ITR.ITR3.PartB-TI.IncFromOS.FromOwnRaceHorse` | integer | n | submit |
| `ITR.ITR3.PartB-TI.IncFromOS.IncChargblSplRate` | integer | n | submit |
| `ITR.ITR3.PartB-TI.IncChargeTaxSplRate111A112` | integer | n | submit |
| `ITR.ITR3.PartB-TI.IncomeFromHP` | integer | n | submit |
| `ITR.ITR3.PartB-TI.TotalTI` | integer | n | submit |
| `ITR.ITR3.PartB-TI.Salaries` | integer | n | submit |
| `ITR.ITR3.PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate` | integer | n | submit |
| `ITR.ITR3.PartB-TI.IncChargeableTaxSplRates` | integer | n | submit |

## PartB_TTI  (50 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails[]` | array<any> | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[]` | array<object> | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].BankName` | string | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].IFSCCode` | string | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].UseForRefund` | string | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].BankAccountNo` | string | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].AccountType` | string | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag` | string | n | submit |
| `ITR.ITR3.PartB_TTI.Refund.RefundDue` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.TaxPaid.BalTaxPayable` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.TaxPaid.TaxesPaid.TDS` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.TaxPaid.TaxesPaid.TCS` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.AssetOutIndiaFlag` | string | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.GrossTaxPayable` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.CreditUS115JD` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.SurchargeOnAboveCroreBeforeMarginal` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxAtNormalRatesOnAggrInc` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.Rebate87A` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnRebate` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.SurchargeOnAboveCrore` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxAtSpecialRates` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TotalSurcharge` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.EducationCess` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.RebateOnAgriInc` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.Surcharge25ofSI` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.Surcharge25ofSIBeforeMarginal` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxInc17` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxDeferredPayableCY` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxDeferred17` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayAfterCreditUs115JD` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.NetTaxLiability` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.EducationCess` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.TotalTax` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.TaxDeemedTISec115JC` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.SurchargeOnAboveCrore` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section91` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section90` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxRelief.Section89` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.TaxRelief.TotTaxRelief` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.IntrstPay.TotalIntrstPay` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.IntrstPay.IntrstPayUs234C` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.IntrstPay.IntrstPayUs234A` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.IntrstPay.LateFilingFee234F` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.IntrstPay.IntrstPayUs234B` | integer | n | submit |
| `ITR.ITR3.PartB_TTI.ComputationOfTaxLiability.AggregateTaxInterestLiability` | integer | n | submit |

## Schedule112A  (27 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.Schedule112A.Balance112AAE` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Balance112ABE` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Deductions112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.TotalBalance112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.SaleValue112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[]` | array<object> | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].ISINCode` | string | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].ShareTransferredOnOrBefore` | string | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].ShareUnitName` | string | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].NumSharesUnits` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].LTCGBeforelower6and11` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].ShareOnOrBefore` | string | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].FairMktValuePerShareunit` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].TotSaleValue` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].TotFairMktValueCapAst` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].ExpExclCnctTransfer` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].TotalDeductions` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].AcquisitionCost` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].SalePricePerShareUnit` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].CostAcqWithoutIndx` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Schedule112ADtls[].Balance` | integer | n | submit |
| `ITR.ITR3.Schedule112A.Balance112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.ExpExclCnctTransfer112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.FairMktValueCapAst112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.AcquisitionCost112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.LTCGBeforelowerB1B2112A` | integer | n | submit |
| `ITR.ITR3.Schedule112A.CostAcqWithoutIndx112A` | integer | n | submit |

## Schedule80_IA  (5 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.Schedule80_IA.DeductUs80_IA_4_iv.Sch80LocOrDescCode` | string | n | submit |
| `ITR.ITR3.Schedule80_IA.DeductUs80_IA_4_iv.Sch80DeductAmtDtls[]` | array<object> | n | submit |
| `ITR.ITR3.Schedule80_IA.DeductUs80_IA_4_iv.Sch80DeductAmtDtls[].DeductAmountSec80` | integer | n | submit |
| `ITR.ITR3.Schedule80_IA.TotSchedule80_IA` | integer | n | submit |
| `ITR.ITR3.Schedule80_IA.Sch80SectionCode` | string | n | submit |

## Schedule80_IB  (14 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.Schedule80_IB.DeductFruitVegUs80_IB_11A_Und.Sch80LocOrDescCode` | string | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductFruitVegUs80_IB_11A_Und.Sch80DeductAmtDtls[]` | array<object> | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductFruitVegUs80_IB_11A_Und.Sch80DeductAmtDtls[].DeductAmountSec80` | integer | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductHousUs80_IB_10_Und.Sch80LocOrDescCode` | string | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductHousUs80_IB_10_Und.Sch80DeductAmtDtls[]` | array<object> | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductHousUs80_IB_10_Und.Sch80DeductAmtDtls[].DeductAmountSec80` | integer | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductMinOilUs80_IB_9_Und.Sch80LocOrDescCode` | string | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductMinOilUs80_IB_9_Und.Sch80DeductAmtDtls[]` | array<object> | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductMinOilUs80_IB_9_Und.Sch80DeductAmtDtls[].DeductAmountSec80` | integer | n | submit |
| `ITR.ITR3.Schedule80_IB.TotSchedule80_IB` | integer | n | submit |
| `ITR.ITR3.Schedule80_IB.Sch80SectionCode` | string | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductFoodGrainUs80_IB_11A_Und.Sch80LocOrDescCode` | string | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductFoodGrainUs80_IB_11A_Und.Sch80DeductAmtDtls[]` | array<object> | n | submit |
| `ITR.ITR3.Schedule80_IB.DeductFoodGrainUs80_IB_11A_Und.Sch80DeductAmtDtls[].DeductAmountSec80` | integer | n | submit |

## ScheduleAL  (12 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleAL.LiabilityInRelatAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.ImmovableDetails[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.CashInHand` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.DepositsInBank` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.InsurancePolicies` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.JewelleryBullionEtc` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.SharesAndSecurities` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.ArchCollDrawPaintSulpArt` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.VehiclYachtsBoatsAircrafts` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.MovableAsset.LoansAndAdvancesGiven` | integer | n | submit |
| `ITR.ITR3.ScheduleAL.InterstAOPFlag` | string | n | submit |
| `ITR.ITR3.ScheduleAL.InterestHeldInaAsset[]` | array<any> | n | submit |

## ScheduleAMTC  (20 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleAMTC.TotBalBF` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.ScheduleAMTCDtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleAMTC.ScheduleAMTCDtls[].AmtCreditUtilized` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.ScheduleAMTCDtls[].AssYr` | string | n | submit |
| `ITR.ITR3.ScheduleAMTC.ScheduleAMTCDtls[].AmtCreditFwd` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.ScheduleAMTCDtls[].AmtCreditSetOfEy` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.ScheduleAMTCDtls[].AmtCreditBalBroughtFwd` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.ScheduleAMTCDtls[].BalAmtCreditCarryFwd` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.CurrAssYr` | string | n | submit |
| `ITR.ITR3.ScheduleAMTC.TaxSection115JD` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.TaxSection115JC` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.TotSetOffEys` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.CurrYrAmtCreditFwd` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.TotAmtCreditUtilisedCY` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.AmtTaxCreditAvailable` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.TotAMTGross` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.TaxOthProvisions` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.CurrYrCreditCarryFwd` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.TotBalAMTCreditCF` | integer | n | submit |
| `ITR.ITR3.ScheduleAMTC.AmtLiabilityAvailable` | integer | n | submit |

## ScheduleBFLA  (80 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleBFLA.LTCGDTAARate.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCGDTAARate.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCGDTAARate.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCGDTAARate.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCGDTAARate.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.Salary.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.Salary.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGDTAARate.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGDTAARate.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGDTAARate.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGDTAARate.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGDTAARate.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG20Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG20Per.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG20Per.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG20Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG20Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.HP.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.HP.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.HP.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.HP.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.HP.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG12_5Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG12_5Per.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG12_5Per.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG12_5Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG12_5Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG20Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG20Per.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG20Per.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG20Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG20Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcExclRaceHorse.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcExclRaceHorse.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcExclRaceHorse.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcExclRaceHorse.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.BusProfExclSpecProf.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.BusProfExclSpecProf.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.BusProfExclSpecProf.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.BusProfExclSpecProf.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.BusProfExclSpecProf.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG10Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG10Per.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG10Per.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG10Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.LTCG10Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.IncomeOfCurrYrAftCYLABFLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpecifiedInc.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpecifiedInc.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpecifiedInc.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpecifiedInc.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpecifiedInc.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG30Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG30Per.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG30Per.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG30Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG30Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpeculativeInc.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpeculativeInc.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpeculativeInc.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpeculativeInc.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.SpeculativeInc.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.OthSrcRaceHorse.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.TotalBFLossSetOff.TotAllUs35cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.TotalBFLossSetOff.TotUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG15Per.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG15Per.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG15Per.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG15Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCG15Per.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGAppRate.IncBFLA.BFlossPrevYrUndSameHeadSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGAppRate.IncBFLA.BFUnabsorbedDeprSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGAppRate.IncBFLA.BFAllUs35Cl4Setoff` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGAppRate.IncBFLA.IncOfCurYrAfterSetOffBFLosses` | integer | n | submit |
| `ITR.ITR3.ScheduleBFLA.STCGAppRate.IncBFLA.IncOfCurYrUndHeadFromCYLA` | integer | n | submit |

## ScheduleCFL  (60 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail.LossFrmSpecifiedBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail.LossFrmSpecifiedBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.CurrentAYloss.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.CurrentAYloss.LossSummaryDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.CurrentAYloss.LossSummaryDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.CurrentAYloss.LossSummaryDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.CurrentAYloss.LossSummaryDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.CurrentAYloss.LossSummaryDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.CurrentAYloss.LossSummaryDetail.LossFrmSpecifiedBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.DateOfFiling` | string | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2023.CarryFwdLossDetail.LossFrmSpecifiedBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.DateOfFiling` | string | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2022.CarryFwdLossDetail.LossFrmSpecifiedBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.DateOfFiling` | string | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2025.CarryFwdLossDetail.LossFrmSpecifiedBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.DateOfFiling` | string | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.LossCFCurrentAssmntYear2024.CarryFwdLossDetail.LossFrmSpecifiedBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.OthSrcLossRaceHorseCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.TotalLTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.TotalHPPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.BusLossOthThanSpecLossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.LossFrmSpecBusCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.TotalSTCGPTILossCF` | integer | n | submit |
| `ITR.ITR3.ScheduleCFL.TotalLossCFSummary.LossSummaryDetail.LossFrmSpecifiedBusCF` | integer | n | submit |

## ScheduleCGFor23  (328 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleofLandBuild.SaleofLandBuildDtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.TotalSTCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtTaxUsDTAAStcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.LossSec94of7Or94of8` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.ImproveCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.ExpOnTrans` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.AquisitCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.DeductSec48.TotalDedn` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls_BE.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.LossSec94of7Or94of8` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.ImproveCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.ExpOnTrans` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.AquisitCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.DeductSec48.TotalDedn` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].TotalCapGainonassets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].MFSectionCode` | string | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtNotTaxUsDTAAStcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.LossSec94of7Or94of8` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdOthUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.ImproveCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.ExpOnTrans` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.AquisitCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeductSec48.TotalDedn` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdSec50CA` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.DeemedStcgOnAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FairMrktValueUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.FullValueConsdRecvUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.ExemptionOrDednUs54.ExemptionGrandTotal` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SaleOnOtherAssets.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtDeemedStcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SlumpSaleInStcg.FMV11UAEii` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SlumpSaleInStcg.NetWorthOfDivision` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SlumpSaleInStcg.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SlumpSaleInStcg.FMV11UAEiii` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.SlumpSaleInStcg.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCGAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.LossSec94of7Or94of8` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullValueConsdOthUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.ImproveCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.ExpOnTrans` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.AquisitCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.DeductSec48.TotalDedn` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullValueConsdSec50CA` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FairMrktValueUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRISecur115AD.FullValueConsdRecvUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaidTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaid` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTNotPaid` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.NRITransacSec48Dtl.NRItaxSTTPaidTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.PassThrIncNatureSTCG30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.UnutilizedStcgFlag` | string | n | submit |
| `ITR.ITR3.ScheduleCGFor23.ShortTermCapGainFor23.AmtDeemedStcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.SumOfCGIncm` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.IncmFromVDATrnsf` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder30Per.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderDTAARate.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder10Per.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnderDTAARate.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder12_5Per.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.LongTermUnder20Per.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnderAppRate.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder20Per.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Upto15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.AccruOrRecOfCG.ShortTermUnder15Per.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.TotDeductClaim` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54G[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs115F[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54B[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54EC[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54F[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54D[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.DeducClaimInfo.DeducClaimDtlsUs54GA[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalExcessTax` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalLTCGImmblPrprtyBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalLTCGImmblPrprtyAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.TotalLTCGImmblPrprty` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofLandBuild.SaleofLandBuildDtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.TotalAmtDeemedLtcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115AE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115BE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.BalonSpeciAssetTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.BalonSpeciAssetTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.DednSpecAssetus115` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAssetTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.BalonSpeciAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleofForeignAsset.SaleonSpecAssetTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.CapgainonAssets_TOTSlump` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.FMV11UAEii` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.SlumpBalance` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.CapgainonAssets_BE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.NetWorthOfDivision` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.FMV11UAEiii` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.ExemptionOrDednUs54.ExemptionGrandTotal` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[].ExemptionAmount` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg_BE.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[].ExemptionSecCode` | string | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.FMV11UAEii` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.SlumpBalance` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.NetWorthOfDivision` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.FMV11UAEiii` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.ExemptionOrDednUs54.ExemptionGrandTotal` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[].ExemptionAmount` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SlumpSaleInLtcgDtls.SlumpSaleInLtcg.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[].ExemptionSecCode` | string | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.AmtDeemedLtcgTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54FBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54F` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCGTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCGTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssetsTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.CapgainonAssetsTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.NRISaleOfEquityShareUs112A.DeductionUs54FAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.AmtDeemedLtcgTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.TotalAmtNotTaxUsDTAALtcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCGUs112A12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.TotalLTCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.TotalAmtTaxUsDTAALtcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.UnutilizedLtcgFlag` | string | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54FBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54F` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCGTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCGTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssetsTransferAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.CapgainonAssetsTransferBE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleOfEquityShareUs112A.DeductionUs54FAE` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.TotalCapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullValueConsdOthUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.ImproveCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.ExpOnTrans` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.AquisitCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.DeductSec48.TotalDedn` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullValueConsdSec50CA` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FairMrktValueUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.FullValueConsdRecvUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.ExemptionOrDednUs54.ExemptionGrandTotal` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA_BE.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullValueConsdOthUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.ImproveCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.ExpOnTrans` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.AquisitCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.DeductSec48.TotalDedn` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullValueConsdSec50CA` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FairMrktValueUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.FullValueConsdRecvUnqshr` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.ExemptionOrDednUs54.ExemptionGrandTotal` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofAssetNADtls.SaleofAssetNA.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.AmtDeemedLtcg` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCGUs112A` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductionUs54F` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.CapgainonAssets` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.FullConsideration` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.ImproveCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.ExpOnTrans` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.AquisitCost` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.DeductSec48.TotalDedn` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.SaleofBondsDebntr.BalanceCG` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.LongTermCapGain23.PassThrIncNatureLTCG10Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.TotScheduleCGFor23` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.LtclSetOff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.LtclSetOff10Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.LtclSetOffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOff10Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOff12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.LtclSetOffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.TotLossSetOff.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOff10Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOff12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.LtclSetOffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLossSetOff.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg20Per.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg20Per.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg20Per.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgAppRate.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.LtclSetOff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.LtclSetOff10Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.LtclSetOff12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcgDTAARate.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg30Per.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg30Per.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg30Per.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.LtclSetOff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.LtclSetOff12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.LtclSetOffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg10Per.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg15Per.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg15Per.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcg15Per.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.LtclSetOff10Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.LtclSetOff12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.LtclSetOffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InLtcg20Per.StclSetoffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.CurrYearIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.InStcgDTAARate.CurrYrCapGain` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOff10Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoff15Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoffAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOff12_5Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.LtclSetOffDTAARate` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoff20Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoff30Per` | integer | n | submit |
| `ITR.ITR3.ScheduleCGFor23.CurrYrLosses.LossRemainSetOff.StclSetoffDTAARate` | integer | n | submit |

## ScheduleCYLA  (88 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleCYLA.LTCGDTAARate.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCGDTAARate.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCGDTAARate.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCGDTAARate.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCGDTAARate.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.Salary.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.Salary.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.Salary.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.Salary.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGDTAARate.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGDTAARate.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGDTAARate.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGDTAARate.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGDTAARate.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LossRemAftSetOff.BalBusLossAftSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG20Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG20Per.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG20Per.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG20Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG20Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.HP.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.HP.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.HP.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.HP.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG12_5Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG12_5Per.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG12_5Per.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG12_5Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG12_5Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG20Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG20Per.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG20Per.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG20Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG20Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.TotalCurYr.TotOthSrcLossNoRaceHorse` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.TotalCurYr.TotBusLoss` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.TotalCurYr.TotHPlossCurYr` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcExclRaceHorse.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.BusProfExclSpecProf.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.BusProfExclSpecProf.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.BusProfExclSpecProf.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.BusProfExclSpecProf.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG10Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG10Per.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG10Per.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG10Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.LTCG10Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpecifiedInc.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpecifiedInc.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpecifiedInc.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpecifiedInc.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG30Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG30Per.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG30Per.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG30Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG30Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpeculativeInc.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpeculativeInc.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpeculativeInc.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.SpeculativeInc.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.OthSrcRaceHorse.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG15Per.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG15Per.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG15Per.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG15Per.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCG15Per.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGAppRate.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGAppRate.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGAppRate.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGAppRate.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.STCGAppRate.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.IncOSDTAA.IncCYLA.IncOfCurYrUnderThatHead` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.IncOSDTAA.IncCYLA.HPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.IncOSDTAA.IncCYLA.BusLossSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.IncOSDTAA.IncCYLA.OthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.IncOSDTAA.IncCYLA.IncOfCurYrAfterSetOff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff` | integer | n | submit |
| `ITR.ITR3.ScheduleCYLA.TotalLossSetOff.TotBusLossSetoff` | integer | n | submit |

## ScheduleDEP  (13 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.BuildingSummary.TotBuildng` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot5Percent` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot10Percent` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot40Percent` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.ShipsSummary` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.IntangibleAssetSummary` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.FurnitureSummary` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot15Percent` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.TotPlntMach` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot45Percent` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot30Percent` | integer | n | submit |
| `ITR.ITR3.ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot40Percent` | integer | n | submit |

## ScheduleDOA  (66 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.DepreciationAtHalfRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.HalfRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.RealizationPeriodLessThan180days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.AdditionsLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.AdditionsGrThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate5.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.DepreciationAtHalfRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.HalfRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.RealizationPeriodLessThan180days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.AdditionsLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.AdditionsGrThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Building.Rate10.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.DepreciationAtHalfRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.HalfRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.RealizationPeriodLessThan180days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.AdditionsLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.AdditionsGrThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.DepreciationAtHalfRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.HalfRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.RealizationPeriodLessThan180days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.AdditionsLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.AdditionsGrThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Land.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDOA.Land.DepreciationDetail.WDVLastDay` | integer | n | submit |

## ScheduleDPM  (76 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.DepreciationAtHalfRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.AdjustmentSec115BAC` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.AddlnDeprOnAssetLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.AddlnDeprOnGT180DayAdditions` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.HalfRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.RealizationPeriodLessThan180days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.AdditionsLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.Total` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.AdditionsGrThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.AddlnDeprOnLessThan180DayAdditions` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.DepreciationAtHalfRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.AdjustmentSec115BAC` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.AddlnDeprOnAssetLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.AddlnDeprOnGT180DayAdditions` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.HalfRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.RealizationPeriodLessThan180days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.AdditionsLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.Total` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.AdditionsGrThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.AddlnDeprOnLessThan180DayAdditions` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.AdjustmentSec115BAC` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.Total` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail.WDVFirstDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.DepreciationAtHalfRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.ProportionateAggDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.RealizationTotalPeriod` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.TotalDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.AdjustmentSec115BAC` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.AddlnDeprOnAssetLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.DepDisAllowUs38_2` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.NetAggregateDepreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.DepreciationAtFullRate` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.AddlnDeprOnGT180DayAdditions` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.HalfRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.RealizationPeriodLessThan180days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.WDVLastDay` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.ExpdrOnTrforSaleAsset` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.AdditionsLessThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.FullRateDeprAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.Total` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.CapGainUs50` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.AdditionsGrThan180Days` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.AddlnDeprOnLessThan180DayAdditions` | integer | n | submit |
| `ITR.ITR3.ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.WDVFirstDay` | integer | n | submit |

## ScheduleEI  (16 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleEI.AgriIncRule7and8` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.Others` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.IncChrgblAsPerDTAA` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.PassThrIncNotChrgblTax` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.UnabAgriLossPrev8` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.TotalExemptInc` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.OthersInc.OthersIncDtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleEI.OthersInc.OthersIncDtls[].NatureDesc` | string | n | submit |
| `ITR.ITR3.ScheduleEI.OthersInc.OthersIncDtls[].OthNatOfInc` | string | n | submit |
| `ITR.ITR3.ScheduleEI.OthersInc.OthersIncDtls[].OthAmount` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.OthersInc.OthDividendAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.OthersInc.NatureofDescDivName` | string | n | submit |
| `ITR.ITR3.ScheduleEI.InterestInc` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.NetAgriIncOrOthrIncRule7` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.GrossAgriRecpt` | integer | n | submit |
| `ITR.ITR3.ScheduleEI.ExpIncAgri` | integer | n | submit |

## ScheduleFA  (10 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleFA.DetailsOfAccntsHvngSigningAuth[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DtlsForeignCashValueInsurance[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DetailsFinancialInterest[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DetailsOfTrustOutIndiaTrustee[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DetailsImmovableProperty[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DetailsOfOthSourcesIncOutsideIndia[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DtlsForeignEquityDebtInterest[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DetailsOthAssets[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DetailsForiegnBank[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleFA.DtlsForeignCustodialAcc[]` | array<any> | n | submit |

## ScheduleFSI  (1 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleFSI` | object | n | submit |

## ScheduleGST  (1 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleGST.TurnoverGrsRcptForGSTIN[]` | array<any> | n | submit |

## ScheduleHP  (2 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleHP.TotalIncomeChargeableUnHP` | integer | n | submit |
| `ITR.ITR3.ScheduleHP.PropertyDetails[]` | array<any> | n | submit |

## ScheduleOS  (103 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleOS.TotOthSrcNoRaceHorse` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115ACA.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115ACA.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115ACA.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115ACA.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115ACA.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendDTAA.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendDTAA.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendDTAA.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendDTAA.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendDTAA.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AC.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AC.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AC.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AC.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AC.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.NOT89A.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.NOT89A.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.NOT89A.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.NOT89A.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.NOT89A.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDA.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDA.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDA.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDA.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDA.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncFrmLottery.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncFrmLottery.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncFrmLottery.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncFrmLottery.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncFrmLottery.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115A1ai.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115A1ai.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115A1ai.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115A1ai.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115A1ai.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncChargeable` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115BBDAaiii.DateRange.Up16Of9To15Of12` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.DividendGross` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.InterestGross` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.RentFromMachPlantBldgs` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.SumRecdPrYrBusTRU562xii` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.AnyOtherIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotified89ATypeOS[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.NatofPassThrghIncome` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmTermDeposit` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.CashCreditsUs68` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.OthersGrossDtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmSavingBank` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XISecondProviso` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.GrossIncChrgblTaxAtAppRate` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Anyotherpropwithoutcons562x` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.UnDsclsdInvstmntsUs69B` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XIISecondProviso` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.LtryPzzlChrgblUs115BB` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IncChargeableSpecialRates` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotifiedPrYr89AOS` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmIncmTaxRefund` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XIIFirstProviso` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Anyotherpropinadeqcons562x` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotifiedOther89AOS` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Tot562x` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.FamilyPension` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.UnExplndInvstmntsUs69` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.UnExplndExpndtrUs69C` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.PTIOthersGrossDtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.OthersGross` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.ProfitChargTaxUs59` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstFrmOthers` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Immovpropwithoutcons562x` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBE` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBJ` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.AmtBrwdRepaidOnHundiUs69D` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.PassThrIncOSChrgblSplRate` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.DividendOthThan22e` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TotalIncomeBenefit` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.TaxAccumulatedBalRecPF.TotalTaxBenefit` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Aggrtvaluewithoutcons562x` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.SumRecdPrYrLifIns562xiii` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.UnExplndMoneyUs69A` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IntrstSec10XIFirstProviso` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.Depreciation` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.UsrIntExp57` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.Expenses` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.DeductionUs57iia` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.IntExp57` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Deductions.TotDeductions` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.AmtNotDeductibleUs58` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Dividend22e` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Immovpropinadeqcons562x` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.Dividend22f` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.IncOthThanOwnRaceHorse.IncomeNotified89AOS` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AD1i.DateRange.Upto15Of6` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AD1i.DateRange.Up16Of6To15Of9` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AD1i.DateRange.Up16Of3To31Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AD1i.DateRange.Up16Of12To15Of3` | integer | n | submit |
| `ITR.ITR3.ScheduleOS.DividendIncUs115AD1i.DateRange.Up16Of9To15Of12` | integer | n | submit |

## ScheduleS  (36 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleS.Increliefus89A` | integer | n | submit |
| `ITR.ITR3.ScheduleS.DeductionUnderSection16ia` | integer | n | submit |
| `ITR.ITR3.ScheduleS.EntertainmntalwncUs16ii` | integer | n | submit |
| `ITR.ITR3.ScheduleS.NetSalary` | integer | n | submit |
| `ITR.ITR3.ScheduleS.ProfessionalTaxUs16iii` | integer | n | submit |
| `ITR.ITR3.ScheduleS.TotIncUnderHeadSalaries` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].TANofEmployer` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.Salary` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.GrossSalary` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.IncomeNotified89A` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.IncomeNotifiedPrYr89A` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.ProfitsinLieuOfSalary` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.IncomeNotified89AType[]` | array<any> | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.IncomeNotifiedOther89A` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfSalary.OthersIncDtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfSalary.OthersIncDtls[].NatureDesc` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfSalary.OthersIncDtls[].OthAmount` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfPerquisites.OthersIncDtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfPerquisites.OthersIncDtls[].NatureDesc` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfPerquisites.OthersIncDtls[].OthNatOfInc` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfPerquisites.OthersIncDtls[].OthAmount` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.ValueOfPerquisites` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfProfitInLieuOfSalary.OthersIncDtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfProfitInLieuOfSalary.OthersIncDtls[].NatureDesc` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfProfitInLieuOfSalary.OthersIncDtls[].OthNatOfInc` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].Salarys.NatureOfProfitInLieuOfSalary.OthersIncDtls[].OthAmount` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].AddressDetail.StateCode` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].AddressDetail.AddrDetail` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].AddressDetail.CityOrTownOrDistrict` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].AddressDetail.PinCode` | integer | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].NatureOfEmployment` | string | n | submit |
| `ITR.ITR3.ScheduleS.Salaries[].NameOfEmployer` | string | n | submit |
| `ITR.ITR3.ScheduleS.TotalGrossSalary` | integer | n | submit |
| `ITR.ITR3.ScheduleS.AllwncExtentExemptUs10` | integer | n | submit |
| `ITR.ITR3.ScheduleS.DeductionUS16` | integer | n | submit |

## ScheduleSI  (7 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleSI.TotSplRateInc` | integer | n | submit |
| `ITR.ITR3.ScheduleSI.SplCodeRateTax[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleSI.SplCodeRateTax[].SplRateIncTax` | integer | n | submit |
| `ITR.ITR3.ScheduleSI.SplCodeRateTax[].SplRatePercent` | integer | n | submit |
| `ITR.ITR3.ScheduleSI.SplCodeRateTax[].SplRateInc` | integer | n | submit |
| `ITR.ITR3.ScheduleSI.SplCodeRateTax[].SecCode` | string | n | submit |
| `ITR.ITR3.ScheduleSI.TotSplRateIncTax` | integer | n | submit |

## ScheduleTDS1  (6 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleTDS1.TDSonSalary[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleTDS1.TDSonSalary[].EmployerOrDeductorOrCollectDetl.TAN` | string | n | submit |
| `ITR.ITR3.ScheduleTDS1.TDSonSalary[].EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName` | string | n | submit |
| `ITR.ITR3.ScheduleTDS1.TDSonSalary[].IncChrgSal` | integer | n | submit |
| `ITR.ITR3.ScheduleTDS1.TDSonSalary[].TotalTDSSal` | integer | n | submit |
| `ITR.ITR3.ScheduleTDS1.TotalTDSonSalaries` | integer | n | submit |

## ScheduleTDS2  (11 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[]` | array<object> | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].TANOfDeductor` | string | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].TaxDeductCreditDtls.TaxClaimedOwnHands` | integer | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].TaxDeductCreditDtls.TaxDeductedOwnHands` | integer | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].TDSSection` | string | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].TDSCreditName` | string | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].HeadOfIncome` | string | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].AmtCarriedFwd` | integer | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].BroughtFwdTDSAmt` | integer | n | submit |
| `ITR.ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[].GrossAmount` | integer | n | submit |
| `ITR.ITR3.ScheduleTDS2.TotalTDSonOthThanSals` | integer | n | submit |

## ScheduleTR1  (4 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleTR1.TaxReliefOutsideIndiaDTAA` | integer | n | submit |
| `ITR.ITR3.ScheduleTR1.TaxReliefOutsideIndiaNotDTAA` | integer | n | submit |
| `ITR.ITR3.ScheduleTR1.TotalTaxPaidOutsideIndia` | integer | n | submit |
| `ITR.ITR3.ScheduleTR1.TotalTaxReliefOutsideIndia` | integer | n | submit |

## ScheduleVIA  (66 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80IAB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80EE` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80GG` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80EEA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80GGA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80IC` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80EEB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80IB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80QQB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80CCC` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80GGC` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80IA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80U` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.TotPartBchapterVIA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.TotPartCAandDchapterVIA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.TotalChapVIADeductions` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80C` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80D` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80G` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.TotPartCchapterVIA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80E` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80JJAA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80DD` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80IBA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80JJA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80TTA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80DDB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80RRB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80TTB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80CCDEmployer` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80CCD1B` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.AnyOthSec80CCH` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.UsrDeductUndChapVIA.Section80CCDEmployeeOrSE` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80IAB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80EE` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80GG` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80EEA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80GGA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80IC` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80EEB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80IB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80QQB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80CCC` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80GGC` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80IA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80U` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.TotPartBchapterVIA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.TotPartCAandDchapterVIA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.TotalChapVIADeductions` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80C` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80D` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80G` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80E` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80JJAA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80DD` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80IBA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80JJA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80TTA` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80DDB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80RRB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80TTB` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80CCDEmployer` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80CCD1B` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.AnyOthSec80CCH` | integer | n | submit |
| `ITR.ITR3.ScheduleVIA.DeductUndChapVIA.Section80CCDEmployeeOrSE` | integer | n | submit |

## TradingAccount  (40 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.TradingAccount.OtherOperatingRevenueDtls[]` | array<object> | n | submit |
| `ITR.ITR3.TradingAccount.OtherOperatingRevenueDtls[].OperatingRevenueName` | string | n | submit |
| `ITR.ITR3.TradingAccount.OtherOperatingRevenueDtls[].OperatingRevenueAmt` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DirectExpenses` | integer | n | submit |
| `ITR.ITR3.TradingAccount.OperatingRevenueTotal` | integer | n | submit |
| `ITR.ITR3.TradingAccount.GrossRcptFromProfession` | integer | n | submit |
| `ITR.ITR3.TradingAccount.GrossProfitFrmBusProf` | integer | n | submit |
| `ITR.ITR3.TradingAccount.SaleOfServices` | integer | n | submit |
| `ITR.ITR3.TradingAccount.GoodsCostPrdcdFrmMA` | integer | n | submit |
| `ITR.ITR3.TradingAccount.TotRevenueFrmOperations` | integer | n | submit |
| `ITR.ITR3.TradingAccount.TardingAccTotCred` | integer | n | submit |
| `ITR.ITR3.TradingAccount.OpngStckOfFinishedStcks` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DirectExpensesTotal` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ClsngStckOfFinishedStcks` | integer | n | submit |
| `ITR.ITR3.TradingAccount.SalesGrossReceiptsTotal` | integer | n | submit |
| `ITR.ITR3.TradingAccount.TurnoverIntradayTrd` | integer | n | submit |
| `ITR.ITR3.TradingAccount.Purchases` | integer | n | submit |
| `ITR.ITR3.TradingAccount.OtherIncDtls[]` | array<object> | n | submit |
| `ITR.ITR3.TradingAccount.OtherIncDtls[].Amount` | integer | n | submit |
| `ITR.ITR3.TradingAccount.OtherIncDtls[].NatureOfIncome` | string | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.IntegratedGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.TotExciseCustomsVAT` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.ServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.StateGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.CentralGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.OthDutyTaxCess` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.VATorSaleTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.UnionExciseDuty` | integer | n | submit |
| `ITR.ITR3.TradingAccount.DutyTaxPay.ExciseCustomsVAT.UnionTerrGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.SaleOfGoods` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.IntegratedGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.TotExciseCustomsVAT` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.ServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.StateGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.CentralGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.OthDutyTaxCess` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.VATorSaleTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.UnionExciseDuty` | integer | n | submit |
| `ITR.ITR3.TradingAccount.ExciseCustomsVAT.UnionTerrGoodServiceTax` | integer | n | submit |
| `ITR.ITR3.TradingAccount.IncomeIntradayTrd` | integer | n | submit |

## Verification  (6 leaves)

Source endpoint: `POST .../itrs/submit`

| path | type | required | source |
|---|---|---|---|
| `ITR.ITR3.Verification.Capacity` | string | n | submit |
| `ITR.ITR3.Verification.Declaration.AssesseeVerName` | string | n | submit |
| `ITR.ITR3.Verification.Declaration.AssesseeVerPAN` | string | n | submit |
| `ITR.ITR3.Verification.Declaration.FatherName` | string | n | submit |
| `ITR.ITR3.Verification.Date` | string | n | submit |
| `ITR.ITR3.Verification.Place` | string | n | submit |

## Grand total

Total leaf nodes across all 37 schedules: **1690**.
