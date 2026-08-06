# ITR-2 — UI GAP MAP (path to 100% schema-complete offline export)
Coverage now: AY2026-27 ~12% · AY2025-26 ~11%. Target 100%.

**Scope.** Every not-yet-fillable REQUIRED ITD node for ITR-2, mapped to WHERE it belongs in the software (UI data-entry or the shared Computation Sheet) so the emitter `buildItr2Json` (`public/tax-utilities/itr2.html:2069-2178`; line-aligned twin `itr2-2025-26.html`) can produce a valid, complete JSON for offline export → direct ITD-portal upload.

**Sources.** Trees `tree-ITR2-{2026,2025}.txt` · diffs `diff-ITR2-{2026,2025}.txt` · `conformance-ITR2-REAL.md` · catalog `docs/itr-structure/ITR-2.md`. Verbatim schema paths (drop the `ITR2.` prefix below) and verbatim catalog drill-in / particular names are used throughout.

**What the emitter does today (baseline).** Emits only: `CreationInfo, Form_ITR2, PartA_GEN1` (PersonalInfo + FilingStatus with hard-coded suppression flags), `ScheduleCYLA`/`ScheduleBFLA` (all-zero skeletons), `PartB-TI` (head aggregates), `PartB_TTI` (tax rollup + refund `AddtnlBankDetails[]` rows; surcharge/cess/relief hard-zeroed), `Verification`, plus `TDSonSalaries`/`TDSonOthThanSals` **only if an AIS file was imported**. Hard-coded flags that suppress captured data: `ReturnFileSec:11, ResidentialStatus:'RES', HeldUnlistedEqShrPrYrFlg:'N', AsseseeRepFlg:'N', AssetOutIndiaFlag:'N', SeventhProvisio139:'N', Capacity:'S'`.

**Legend for actions.** **A** Mis-key/shape (emitter rename only). **B** Compute-and-export (calculator already derives it; emitter must emit; no new UI). **C** Captured-but-not-exported (an EXISTING catalog drill-in already holds the data; wire it in + drop the suppression flag). **D** Missing UI (new/extended field or drill-in).
**USER-INPUT actions = C + D. COMPUTE-ONLY = B. RENAME = A.**

---

## A. Mis-key / shape fixes — emitter rename only

Conformance §4 confirms: no path-aliasing exists among nodes we *do* emit — the only genuine renames are the two AIS-fed TDS blocks, which we emit under the wrong schedule wrapper (and, for TDS2, with wrong inner keys).

| Our emitted path (today) | Schema path (target) | schedule | #req |
|---|---|---|---|
| `ITR.ITR2.TDSonSalaries.TDSonSalary[]` (`.EmployerOrDeductorOrCollectDetl.TAN/…Name, IncChrgSal, TotalTDSSal`) | `ScheduleTDS1.TDSonSalary[].{EmployerOrDeductorOrCollectDetl.TAN, …Name, IncChrgSal, TotalTDSSal}` + `TotalTDSonSalaries` | ScheduleTDS1 | 5 |
| `ITR.ITR2.TDSonOthThanSals.TDSonOthThanSal[]` (`.AmtForTaxDeduct, TotTDSOnAmtPaid`) | `ScheduleTDS2.TDSOthThanSalaryDtls[].{TDSCreditName, TANOfDeductor, TDSSection, TaxDeductCreditDtls.TaxClaimedOwnHands, AmtCarriedFwd}` + `TotalTDSonOthThanSals` (**reshape**, not pure rename) | ScheduleTDS2 | 6 |

Rename target node from `TDSonSalaries`→`ScheduleTDS1`; reshape `TDSonOthThanSals`→`ScheduleTDS2` (add TDSCreditName/TDSSection/TaxClaimedOwnHands/AmtCarriedFwd; source them from the AIS TDS rows already in `window.__aisData.tdsEntries`). **A subtotal = 11 req.** Both AYs identical.

---

## B. Compute-and-export — calculator has it, emitter must emit (NO new UI)

The shared Computation Sheet already derives these; the emitter either zeros them or drops them. Emit the computed values once the underlying detail (Sections C/D) is exported. **COMPUTE-ONLY — no data entry.**

| Schema nodes (verbatim, representative) | source (calc cell / derivation) | #req |
|---|---|---|
| `ScheduleCYLA.{Salary,HP,OthSrcExclRaceHorse,OthSrcRaceHorse,IncOSDTAA}.IncCYLA.{IncOfCurYrUnderThatHead,IncOfCurYrAfterSetOff}` | head incomes `it_sal_total/it_hp_income/it_os_*` (emitter currently zeros HP & OthSrc CYLA cells) | 10 |
| `ScheduleBFLA.{HP,OthSrcExclRaceHorse,OthSrcRaceHorse,IncOSDTAA}.IncBFLA.{IncOfCurYrUndHeadFromCYLA,BFlossPrevYrUndSameHeadSetoff,IncOfCurYrAfterSetOffBFLosses}` | CYLA output + CFL brought-forward | 10 |
| `ScheduleCGFor23.{TotalSTCG, LongTermCapGain23.TotalLTCG, SumOfCGIncm, IncmFromVDATrnsf}`; `CurrYrLosses.LossRemainSetOff.*`; `AccruOrRecOfCG.*.DateRange.{Upto15Of6…Up16Of3To31Of3}` (quarterly split) | CG engine (`it_cg_112a/ltcg1/ltauto/stcg1/auto`) + per-transaction dates → quarter buckets | ~82 |
| `Schedule112A.{SaleValue112A,CostAcqWithoutIndx112A,AcquisitionCost112A,LTCGBeforelowerB1B2112A,FairMktValueCapAst112A,ExpExclCnctTransfer112A,Deductions112A,Balance112A,TotalBalance112A}` (+`Balance112ABE/AAE` in 2025-26) | column sums of the `sf-ltcg112a` scrip grid | 9 (11 in 25-26) |
| `Schedule115AD.{SaleValue115AD…TotalBalance115AD}` (+`Balance115ADBE/ADAE` 25-26) | roll-up of 115AD detail rows (detail itself = D) | 9 (11 in 25-26) |
| `ScheduleSI.SplCodeRateTax[].{SecCode,SplRatePercent,SplRateInc,SplRateIncTax}, TotSplRateInc, TotSplRateIncTax` | special-rate income & tax by section (111A/112A/115BB/115BBH) — calc knows rate-wise income; **needs calc to expose per-section tax** | 6 |
| `ScheduleVIA.DeductUndChapVIA.{Section80D,Section80G,Section80GGA,TotalChapVIADeductions}` | `it_80_total` breakdown (per-section detail = D) | 4 |
| `ScheduleAMT.{TotalIncItemPartBTI,DeductionClaimUndrAnySec,AdjustedUnderSec115JC,TaxPayableUnderSec115JC}` | adjusted-total-income + 18.5% AMT (calc must compute) | 4 |
| `PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.{TaxInc17,TaxDeferred17,TaxDeferredPayableCY}`, `TaxRelief.TotTaxRelief` | ESOP deferral (from `sf-esop` totals) + 89/90/91 relief — **BLOCKED: calc lacks `window.__taxBreakup`** (Discrepancy 2) | 4 |
| `ScheduleHP.TotalIncomeChargeableUnHP`; per-property `Rentdetails.{BalanceALV,ThirtyPercentOfBalance,TotalDeduct,IncomeOfHP,AnnualOfPropOwned}` | HP computation (address/loan detail = D) | ~6 |
| `ScheduleOS.{IncChargeable, IncOthThanOwnRaceHorse.BalanceNoRaceHorse, …Deductions.TotDeductions}` | OS aggregate (nature-wise detail = D) | ~6 |

**B subtotal ≈ 147 req** (COMPUTE-ONLY). Note the surcharge/cess/relief/234-interest cells in `PartB_TTI` and `ScheduleSI.*Tax` are **blocked** until the ITR-2 calculator re-exposes `window.__taxBreakup` (present in ITR-1's calc, stripped from ITR-2's — the only calc diff besides the CG rows). This is a calculator fix, prerequisite to B completing.

---

## C. Captured-but-not-exported — EXISTING drill-in holds the data; wire it in

Highest-value: data already in `data` (or the calc CG drill-ins); the emitter discards it behind a suppression flag. **USER-INPUT already collected — no new screens.**

| Schema schedule (verbatim) | EXISTING drill-in / particular (catalog, verbatim) | binds (state → schema) | #req |
|---|---|---|---|
| `PartA_GEN1.PersonalInfo.Address.Phone.{STDcode,PhoneNo}` | "Assessee info." (`sf-assessee`) fields **STD code** / **Landline No.** | `asr_std,asr_landline`→Phone | 2 |
| `PartA_GEN1.FilingStatus.AssesseeRep.{RepName,RepEmailID,CountryCodeRepMobileNo,RepMobileNo}` (2025-26: `RepName,RepCapacity,RepAddress,RepPAN`) | "Representative Assessee, if any" (`sf-repassessee`) | `rep_name/email/cc/contact`→AssesseeRep; **drop `AsseseeRepFlg:'N'`** | 4 |
| `PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls[].{NameOfCompany,CompanyType,SharesTypes}` | "Directorship info." (`sf-directorship`, `DIRECTOR_SPEC`) | director entries[]→CompDirectorPrvYrDtls | 3 |
| `PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls[].{NameOfCompany,CompanyType,OpngBal/ClsngBal NumberOfShares,CostOfAcquisition}` | "Unlisted Equity Shares" (`sf-unlisted`, `UNLISTED_SPEC`) | unlisted entries[]; **drop `HeldUnlistedEqShrPrYrFlg:'N'`** | 6 |
| `ScheduleFA.*` (DetailsForiegnBank, DtlsForeignCustodialAcc, ForeignEquityDebt, CashValueInsurance, FinancialInterest, ImmovableProperty, OtherCapitalAsset, AccountSigningAuth, TrustOthEntity, OthSourcesIncOutIndia) | the **9 Foreign-Assets drill-ins** (`sf-fa_depository`…`sf-fa_otherincome`, detail popups `sf-fa-detail`) | FA entries[]; **drop `AssetOutIndiaFlag:'N'`** | 108 |
| `ScheduleAL.{ImmovableDetails[].*, MovableAsset.*, LiabilityInRelatAssets}` | "Having Assets and Liabilities?" (2 inline: `al_immovable,al_cash`) + 8 AL drill-ins (`sf-al_bank`…`sf-al_liab`) | AL row values `al_*_cv`/`al_total` | 16 |
| `ScheduleSPI.SpecifiedPerson[].{SpecifiedPersonName,ReltnShip,AmtIncluded,HeadIncIncluded}` | "Income of Other persons included in computation" (`sf-spi`) | spi grids→SpecifiedPerson[] | 4 |
| `ScheduleESOP.{PanofStartUp,DPIITRegNo, ScheduleESOP{2122…2627}_Type.AssessmentYear, TotalTaxAttributedAmt}` | "Tax deferred on Sweat Equity Shares/Securities - B/F" (`sf-esop`) | `esr_pan,esr_dpiit`, year rows, `esop_*_tot` | 9 (8 in 25-26) |
| `ScheduleVDA.ScheduleVDADtls[].{DateofAcquisition,DateofTransfer,HeadUndIncTaxed,AcquisitionCost,ConsidReceived,IncomeFromVDA}, TotIncCapGain` | "Auto-classification of STCG/LTCG" (`sf-auto-cg`) **§3 Virtual Digital Asset u/s 115BBH** grid | VDA rows→ScheduleVDADtls | 7 |
| `TaxReturnPreparer.{IdentificationNoOfTRP,NameOfTRP,ReImbFrmGov}` | "Other Forms filed" (`sf-otherforms`) TRP block `ofr_trp_id/name/amt` | TRP fields | 3 |
| `Schedule112A.Schedule112ADtls[].{ShareOnOrBefore,ISINCode,ShareUnitName,TotSaleValue,CostAcqWithoutIndx,AcquisitionCost,LTCGBeforelowerB1B2,FairMktValuePerShareunit,TotFairMktValueCapAst,ExpExclCnctTransfer,TotalDeductions,Balance}` | **"Long Term Capital Gain u/s 112A"** (`sf-ltcg112a`) scrip grid (Qty/ISIN/FMV/COA/grandfathering columns map 1:1) | scrip rows→Schedule112ADtls[] | 12 |
| `ScheduleCGFor23.ShortTermCapGainFor23.EquityMFonSTT[].EquityMFonSTTDtls.*` (FullConsideration, DeductSec48.*, BalanceCG, LossSec94of7Or94of8, CapgainonAssets) | **"STCG-1:"** (`sf-stcg`) + **"Auto-classification…"** (`sf-auto-cg`) §1 STT-paid | STCG entries + auto-cg STCG side (`it_cg_stcg1/auto`) | ~9 |
| `ScheduleCGFor23.LongTermCapGain23.{SaleofLandBuild.SaleofLandBuildDtls[].*, SaleOfEquityShareUs112A.*, Proviso112Applicable[].*}` scrip/asset detail | **"LTCG-1:"** (`sf-ltcg`, asset categories incl. Land/Building, Residential House, Shares/Units, 112A) + `sf-ltcg112a` + `sf-auto-cg` | LTCG entries (`it_cg_ltcg1/ltauto`) | ~110 |
| `ScheduleCFL.*.CarryFwdLossDetail.{TotalSTCGPTILossCF,TotalLTCGPTILossCF,TotalHPPTILossCF}` (loss *amounts*) | calc **CFL / loss tables** (AY-column brought-forward grids, catalog AY-diff §5) | year-wise loss amounts (DateOfFiling = D) | ~24 |
| `SchedulePTI.SchedulePTIDtls[].{InvstmntCvrdUs115UA115UB,BusinessName,BusinessPAN,…TDSAmount}` (entity/name/PAN/amount/TDS) | "Pass Through Income u/s 115U/115UA/115UB" (`sf-pti`) | pti rows (per-head split = D) | ~30 |

**C subtotal ≈ 348 req** (USER-INPUT already captured). Every item here needs only emitter wiring + removal of a suppression flag; **ScheduleFA (108) and the ScheduleCGFor23 scrip detail (~130 incl. 112A) are the two largest wins.**

---

## D. MISSING UI — new/extended field or drill-in per schedule

Grouped by schedule. Each gives: what it collects · PARENT screen · NEW/EXTENDED drill-in · key fields (label | type | grid cols) · #req · priority.

### Chapter VI-A deductions (no drill-ins exist today — calc emits one aggregate `it_80_total` only)  — **149 req, PRIORITY 1 (bulk)**
- **Schedule80C (3)** — collects: LIC/PPF/ELSS etc. line items. PARENT: Computation → Deductions (Chapter VI-A) group. NEW drill-in **"Section 80C investments"**: `Instrument label | text | 1` · `Identification No. | text | 1` · `Amount | number | 1`; footer `TotalAmt`. Populates `Schedule80CDtls[].{Amount,IdentificationNo}, TotalAmt`.
- **Schedule80D (21)** — collects: health-insurance by 4 buckets (self&family / self&family senior / parents / parents senior). PARENT: VI-A group. NEW drill-in **"Section 80D — health insurance"**: per-bucket grid `Insurer Name | text` · `Policy No. | text` · `Health Ins Amt | number` (+ preventive-checkup); bucket totals + `EligibleAmountOfDedn`. Populates `Sec80DSelfFamSrCtznHealth.*`.
- **Schedule80G (60)** — collects: donee-wise donations across 4 approval buckets. PARENT: VI-A group. NEW drill-in **"Section 80G — donations"**: `Donee Name | text` · `Donee PAN | text` · `Address (AddrDetail/City/StateCode/PinCode) | text×4` · `Cash | number` · `Other-mode | number` · `Total | ⚙` · `Eligible | ⚙`; bucket= 100%/50%-noApprov/100%-Approv/50%-Approv. Populates `Don100Percent/Don50PercentNoApprReqd/Don100PercentApprReqd/Don50PercentApprReqd.DoneeWithPan[].*` + totals.
- **Schedule80GGA (15)** — sci-research/rural-dev donations. NEW drill-in **"Section 80GGA"**: `Relevant clause | select` · `Donee Name | text` · `Address ×4` · `Donee PAN | text` · `Cash/Other/Total/Eligible | number`. Populates `DonationDtlsSciRsrchRuralDev[].*`.
- **Schedule80GGC (9)** — political-party donations. NEW drill-in **"Section 80GGC"**: `Date | date` · `Cash | number` · `Other-mode | number` · `Total/Eligible | ⚙`. Populates `Schedule80GGCDetails[].*` + totals.
- **Schedule80E/80EE/80EEA/80EEB (8+8+9+9=34)** — loan-interest deductions. PARENT: VI-A group. NEW drill-in **"Deduction loans (80E/EE/EEA/EEB)"** (one tabbed drill or four): `Lender type (Financial Inst/Others) | select` · `Bank/Instn Name | text` · `Loan A/c No | text` · `Date of Loan | date` · `Total Loan Amt | number` · `Outstanding | number` · `Interest paid | number` (+ `VehicleRegNo` for 80EEB, `PropStmpDtyVal` for 80EEA). Populates each `Schedule80E*Dtls[].*` + `TotalInterest80E*`.
- **Schedule80DD (4)** — disabled-dependent maintenance. PARENT: VI-A group, inline. NEW fields: `Nature of Disability | select` · `Type of Disability | select` · `Dependent Type | select` · `Deduction Amount | number`.
- **Schedule80U (3)** — self-disability. Inline: `Nature of Disability | select` · `Type of Disability | select` · `Deduction Amount | number`.
- **ScheduleVIA.UsrDeductUndChapVIA.PensionContribution80CCC[] (3)** — NEW rows in VI-A: `Type of Identifier | select` · `Name of Identifier | text` · `Amount | number`.

### ScheduleOS — Other Sources detail  — **~101 req, PRIORITY 2**
Collects: nature-wise interest/dividend/562x gifts/family-pension/winnings, special-rate & DTAA rows, quarterly accrual, 89A. PARENT: Computation → "Income from Other Sources". NEW/EXTENDED drill-in **"Other Sources — detail"**: nature grid `Nature | select (SB int/Term-dep int/IT-refund int/Others; Dividend; Rent Mach/Plant/Bldg; 56(2)(x) gifts) | ` · `Gross | number`; `Deductions (Expenses/57(iia)/Depreciation) | number`; DTAA sub-grid `NatureOfIncome|CountryName|CountryCode|DTAAarticle|RateAsPerTreaty|RateAsPerITAct|ItemNoincl`; quarterly `Lottery/OnlineGames/Dividend-by-section DateRange.{Upto15Of6…Up16Of3To31Of3} | number | 5 cols`; `IncomeNotified89ATypeOS[].{CountryCode,Amount}`. Populates `ScheduleOS.IncOthThanOwnRaceHorse.*`, `IncFrmLottery/OnGames/Dividend*.DateRange.*`, `IncFromOwnHorse.*`, `IncChargeable`.

### ScheduleHP — House Property detail  — **24 req (of 29; 5 are B), PRIORITY 2**
Collects: per-property address/owner/co-owner/tenant/let-out/24B loan. PARENT: Computation → "Income from House Property". NEW drill-in **"House Property — properties"**: `HPSNo | ⚙` · address `AddrDetail/City/StateCode/CountryCode | text×4` · `Property Owner | select` · `Co-owned? | Y/N` · `Assessee share % | number` · co-owner grid `Name|share` · `Let out? | select` · tenant grid `Name` · `Annual Letable Value | number` · `Unrealized+Tax | number` · Section24B loan grid `LoanTknFrom|BankName|LoanAccNo|DateofLoan|TotalLoanAmt|Outstanding|InterestUs24B`. Populates `PropertyDetails[].*`.

### ScheduleCGFor23 — new sub-blocks (extend the CG drill-ins)  — **~58 req, PRIORITY 1 (CG is the whole point of ITR-2)**
- **Immovable buyer detail** — EXTEND `sf-ltcg`/`sf-stcg` Land/Building entries: `Name of Buyer | text` · `PAN | text` · `% Share | number` · `Address of Property | text` · `StateCode | select` · `CountryCode | select`. Populates `Sale­ofLandBuild.SaleofLandBuildDtls[].TrnsfImmblPrprty.TrnsfImmblPrprtyDtls[].*`; also `CostOfImprovements.CostOfImprovementsDtls[].{slno,ImproveCost,ImproveDate,CostOfImpIndex}`, `DeductionUs54B`.
- **NRI / DTAA CG rows** — EXTEND CG drills with an NRI/DTAA sub-grid: `DTAAamt|CountryName|CountryCode|DTAAarticle|RateAsPerTreaty|SecITAct|RateAsPerITAct|ItemNoincl`. Populates `{ShortTerm…,LongTerm…}.NRICgDTAA.NRIDTAADtls[].*`, `NRITransacSec48Dtl.*`, `NRISecur115AD.*`, `NRIProvisoSec48.*`, `NRIOnSec112and115.*`.
- **Deduction-claim register** — NEW small grid **"CG exemptions claimed (54/54B/54EC/54F/115F)"**: `Section | select` · `Date of Transfer | date` · `Amount Invested/Deducted | number` (+ `DateofInvestment` for 115F). Populates `DeducClaimInfo.DeducClaimDtlsUs54*[].*, TotDeductClaim`.

### Schedule115AD — NRI/FII LTCG on securities  — **12 req (detail; 9 totals are B), PRIORITY 3**
NEW scrip grid **"115AD — FII securities (LTCG)"** (twin of `sf-ltcg112a`): `ShareUnitName|ISINCode|ShareOnOrBefore|TotSaleValue|CostAcqWithoutIndx|AcquisitionCost|FairMktValuePerShareunit|TotFairMktValueCapAst|ExpExclCnctTransfer` → `Schedule115ADDtls[].*`. Applies only to FII/FPI residents.

### Loss / relief / exempt schedules  — **~85 req, PRIORITY 4**
- **ScheduleCFL DateOfFiling (8)** — EXTEND calc CFL tables: add `Date of Filing | date` per brought-forward year → `LossCF…FromAY.CarryFwdLossDetail.DateOfFiling`.
- **ScheduleEI (17)** — NEW drill-in **"Exempt Income"**: agri-income + district/pincode/land-measure/owned/irrigated grid, other-exempt, DTAA-not-chargeable grid. Populates `ScheduleEI.*`.
- **Schedule5A2014 (18)** — NEW drill-in **"Apportionment (Portuguese Civil Code)"**: `Name/PAN of Spouse | text`; per-head `IncRecvdUndHead|AmtApprndOfSpouse|AmtTDSDeducted|TDSApprndOfSpouse` for HP/CG/OS/Total. Populates `Schedule5A2014.*`.
- **ScheduleFSI (23)** — NEW drill-in **"Foreign Source Income"**: `CountryCode|TaxIdentificationNo` + per-head income/tax-paid/relief/DTAA-article. Populates `ScheduleFSI.*`.
- **ScheduleTR1 (9)** — NEW drill-in **"Tax Relief (90/90A/91)"**: `CountryName|CountryCode|TaxIdentificationNo|TaxPaidOutsideIndia|TaxReliefOutsideIndia` + totals. Populates `ScheduleTR1.*`.
- **ScheduleAMTC (17)** — NEW drill-in **"AMT Credit (115JD)"**: year-wise `AssYr|Gross|AmtCreditSetOfEy|BalBroughtFwd|Utilized|BalCarryFwd` + summary. Populates `ScheduleAMTC.*` (AMT amounts themselves = B).

### Taxes-paid detail  — **14 req, PRIORITY 3**
- **ScheduleIT (5)** — NEW challan grid **"Advance / Self-Assessment Tax"**: `BSRCode|DateDep|SrlNoOfChaln|Amt` + `TotalTaxPayments`. Populates `ScheduleIT.TaxPayment[].*`.
- **ScheduleTCS (3)** — NEW grid **"TCS"**: `TCSCreditOwner|EmployerOrDeductorOrCollectTAN` + `TotalSchTCS`. Populates `ScheduleTCS.TCS[].*`.
- **ScheduleTDS3 (6)** — NEW grid **"TDS on sale/rent (26QB/26QC)"**: `TDSCreditName|PANOfBuyerTenant|TDSSection|TaxClaimedOwnHands|AmtCarriedFwd` + total. Populates `ScheduleTDS3.TDS3onOthThanSalDtls[].*`.

### PartA_GEN1 / PartB_TTI extensions  — **13 req**
- **PartA_GEN1.AlternateAddress (4)** — EXTEND `sf-assessee` (Secondary-address block already toggles): add `ResidenceNo|LocalityOrArea|CityOrTownOrDistrict|StateCode | text`. Emit when "Secondary same as primary?" = No.
- **PartA_GEN1.clauseiv7provisio139iDtls[] (2)** + **JurisdictionResPrevYr.JurisdictionResPrevYrDtls[] (2)** — EXTEND `sf-assessee`/filing block: `Nature | select` · `Amount | number` (7th-proviso high-value triggers); `JurisdictionResidence | text` · `TIN | text` (for NR). Populates those `[]`.
- **PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].UseForRefund (1)** — EXTEND "Bank Accounts" (`sf-bank`): the **"For refund?"** checkbox already exists in the grid but `bankRows` drops it — emit `UseForRefund` from it (borderline A/C). 
- **PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails[] (4)** — EXTEND `sf-bank`: NEW "Foreign bank (NR refund)" rows `SWIFTCode|BankName|IBAN|CountryCode`.

### SchedulePTI head-split extension  — **~24 req**
EXTEND `sf-pti`: replace single "Head/Amount" with per-head sub-columns `IncFromHP/CapitalGainsPTI.{ShortTermCG,LongTermCG}/OtherSrcPTI.{AmountOfInc,CurrYrLossShareByInvstFund,NetIncomeLoss,TDSAmount}`. Populates `SchedulePTIDtls[].*` beyond the ~30 already-captured basics.

### AY 2025-26 ONLY — ITR-U sections (out of practical scope; updated returns)  — **32 req, PRIORITY 5**
- **PartA_139_8A (12)** — NEW drill-in **"Updated return u/s 139(8A)"**: `PAN|Name|AssessmentYear|PreviouslyFiled?|AcknowledgementNo|OrigRetFiledDate|LaidOutIn_139_8A|ITRFormUpdatingInc|Reasons[]|UpdatedReturnDuringPeriod|UnabsorbedDepreciation|UDYear[]`.
- **PartB-ATI (20)** — NEW card **"139(8A) tax computation"**: `UpdatedTotInc|AmtPayable|FeeIncUS234F|AggrLiability…|AddtnlIncTax|TaxUS140B|ScheduleIT1/IT2 challan grids|ReleifUS89` (mostly B once entered). Absent from 2026-27 schema.

**D subtotal ≈ 490 req (2026-27); +32 (ITR-U) in 2025-26.** USER-INPUT.

---

## E. Per-required-schedule checklist

`cov` = present today. `A/B/C/D` = primary action(s). Target = 100% (all req present). Counts are 2026-27 reqMISS unless noted.

| Schedule | #req (reqMISS) | coverage now | action | target |
|---|---|---|---|---|
| CreationInfo | 6 (0) | ✓ full | — | done |
| Form_ITR2 | 5 (0) | ✓ full | — | done |
| Verification | 4 (0) | ✓ full | — | done |
| PartB-TI | 30/33 (0) | ✓ (all-zero, populates via heads) | B | done shape |
| PartA_GEN1 | 43 (23) | ◑ identity only | **C** (15) + **D** (8) | 100% |
| PartB_TTI | 48 (13) | ◑ tax rollup | **B** (4, calc-blocked) + **D** (5) + bank 4=false-MISS | 100% |
| ScheduleCYLA | 28 (10) | ◑ zeros | **B** | 100% |
| ScheduleBFLA | 32/41 (10) | ◑ zeros | **B** | 100% |
| **ScheduleCGFor23** | **258 (258)** [441 in 25-26] | ✗ | **C** (~130 scrip) + **B** (~82 totals/qtr) + **D** (~46 NRI/buyer/dedn) | 100% |
| Schedule112A | 21 (21) [23 25-26] | ✗ | **C** (12) + **B** (9) | 100% |
| Schedule115AD | 21 (21) [23 25-26] | ✗ | **D** (12) + **B** (9) | 100% |
| ScheduleVDA | 7 (7) | ✗ | **C** | 100% |
| ScheduleSI | 6 (6) | ✗ | **B** (calc-blocked) | 100% |
| ScheduleCFL | 32 (32) | ✗ | **C** (~24 amounts) + **D** (8 DateOfFiling) | 100% |
| ScheduleOS | 113 (113) | ✗ | **D** (~101) + **B** (~12) | 100% |
| ScheduleHP | 29 (29) | ✗ | **D** (~24) + **B** (~5) | 100% |
| Schedule5A2014 | 18 (18) | ✗ | **D** | 100% |
| ScheduleEI | 17/18 (17) | ✗ | **D** | 100% |
| ScheduleVIA | 7 (7) | ✗ | **B** (4) + **D** (3 80CCC) | 100% |
| Schedule80C | 3 (3) | ✗ | **D** | 100% |
| Schedule80D | 21 (21) | ✗ | **D** | 100% |
| Schedule80G | 60 (60) | ✗ | **D** | 100% |
| Schedule80GGA | 15 (15) | ✗ | **D** | 100% |
| Schedule80GGC | 9 (9) | ✗ | **D** | 100% |
| Schedule80E/EE/EEA/EEB | 34 (34) | ✗ | **D** | 100% |
| Schedule80DD | 4 (4) | ✗ | **D** | 100% |
| Schedule80U | 3 (3) | ✗ | **D** | 100% |
| ScheduleAMT | 4 (4) | ✗ | **B** | 100% |
| ScheduleAMTC | 17 (17) | ✗ | **D** (year-wise) + **B** | 100% |
| ScheduleFA | 108 (108) | ✗ | **C** | 100% |
| ScheduleAL | 16 (16) | ✗ | **C** | 100% |
| ScheduleSPI | 4 (4) | ✗ | **C** | 100% |
| SchedulePTI | 54 (54) | ✗ | **C** (~30) + **D** (~24 head-split) | 100% |
| ScheduleESOP | 9/8 (9) | ✗ | **C** | 100% |
| ScheduleFSI | 23 (23) | ✗ | **D** | 100% |
| ScheduleTR1 | 9 (9) | ✗ | **D** | 100% |
| ScheduleIT | 5 (5) | ✗ | **D** | 100% |
| ScheduleTCS | 3 (3) | ✗ | **D** | 100% |
| ScheduleTDS1 | 5 (5) | ✗ | **A** (rename `TDSonSalaries`) | 100% |
| ScheduleTDS2 | 6 (6) | ✗ | **A** (reshape `TDSonOthThanSals`) | 100% |
| ScheduleTDS3 | 6 (6) | ✗ | **D** | 100% |
| TaxReturnPreparer | 3 (3) | ✗ | **C** | 100% |
| PartA_139_8A | — [12 in 25-26] | ✗ | **D** (ITR-U) | AY25-26 only |
| PartB-ATI | — [20 in 25-26] | ✗ | **D**+**B** (ITR-U) | AY25-26 only |

---

## F. Path-to-100 summary

**Counts per action (2026-27 reqMISS ≈ 1042):**
- **A (rename): ~11 req** — 2 emitter edits (TDS1, TDS2).
- **B (compute-only): ~147 req** — no data entry; emitter must stop zeroing CYLA/BFLA/CG-totals/SI/AMT/VIA-totals + calc must re-expose `window.__taxBreakup`.
- **C (captured, wire in): ~348 req** — biggest single wins: ScheduleFA (108), CG scrip detail incl. 112A (~130), AL (16), PTI-basics (~30), CFL-amounts (~24), identity blocks (15), ESOP/VDA/SPI/TRP (23). Requires dropping the hard-coded suppression flags (`AssetOutIndiaFlag/HeldUnlistedEqShrPrYrFlg/AsseseeRepFlg`) and mapping existing `data`/calc-cell state.
- **D (new/extended UI): ~490 req (2026-27); +32 ITR-U in 2025-26.**

**# NEW or EXTENDED drill-ins ≈ 21:** 80C · 80D · 80G · 80GGA · 80GGC · loans(80E/EE/EEA/EEB) · 80DD/80U-inline · VIA-80CCC · OS-detail · HP-properties · CG-immovable/NRI/dedn extensions · 115AD-FII · EI · 5A2014 · FSI · TR1 · AMTC · IT-challan · TCS · TDS3 · (+2025-26: 139(8A), PartB-ATI). Plus 3 *extensions* to existing screens (sf-assessee AltAddress/jurisdiction, sf-bank ForeignBank/UseForRefund, sf-pti head-split).

**Top 3 new-UI surfaces (by req impact):** (1) **Chapter VI-A deductions cluster — 149 req** (80G alone 60); (2) **ScheduleOS nature-wise/DTAA/quarterly detail — ~101 req**; (3) **ScheduleHP per-property drill-in — 29 req** (with the CG NRI/immovable extensions ~58 close behind).

**Biggest blocker:** **ScheduleCGFor23 (258 req 2026-27 / 441 req 2025-26)** — the reason a taxpayer files ITR-2, and 0% exported today. Most of it is **C** (the calculator already holds LTCG-1, STCG-1, the scrip-wise 112A grid, and the auto-classification/VDA tables), so the critical path is **emitter wiring, not new data entry** — but two hard prerequisites gate completion: (a) the emitter currently collapses all five CG cells into `PartB-TI` aggregates and emits **no** `ScheduleCGFor23/Schedule112A/Schedule115AD` node at all; (b) the ITR-2 calculator **lacks `window.__taxBreakup`**, so `ScheduleSI` per-section tax and `PartB_TTI` surcharge/cess/relief (and the CG special-rate tax) cannot be emitted until that calc block is restored. Fix those two, wire the C-class drill-ins, then the D-class deduction/OS/HP UIs, and export reaches 100%.

**Ordered build list (identity → CG/OS income heads → VIA → SI/CFL/AMTC → taxes-paid → FA/AL):**
1. **Identity/roll-up (C+A, low effort):** drop suppression flags; wire AssesseeRep, Directorship, Unlisted, Phone, TDS1/TDS2 rename, AltAddress. Unblocks PartA_GEN1 + TDS.
2. **Calculator fix (prereq for B):** restore `window.__taxBreakup` in ITR-2 calc → unblocks PartB_TTI surcharge/cess/relief, ScheduleSI, CG special-rate tax.
3. **CG/OS/HP income heads (C+B+D, highest value):** emit `ScheduleCGFor23/112A/115AD` from existing CG drills (C) + totals/quarterly (B); build the CG NRI/immovable/deduction extensions (D); build OS-detail + HP-properties drill-ins (D).
4. **Chapter VI-A (D, bulk):** 80C/80D/80G/80GGA/80GGC/80E-family/80DD/80U/80CCC drill-ins → ScheduleVIA totals (B).
5. **SI / CFL / AMT-AMTC (B+C+D):** CFL amounts (C) + DateOfFiling (D); AMT amounts (B) + AMTC year-wise credit (D); ScheduleSI (B).
6. **Taxes-paid (D):** ScheduleIT, ScheduleTCS, ScheduleTDS3 challan/credit grids.
7. **FA / AL (C, big wins already-captured):** drop `AssetOutIndiaFlag`, emit the 9 FA drill-ins + 8 AL drill-ins.
8. **Remainder (D):** ScheduleEI, Schedule5A2014, ScheduleFSI, ScheduleTR1, SchedulePTI head-split; (2025-26 only) PartA_139_8A + PartB-ATI for updated returns.
