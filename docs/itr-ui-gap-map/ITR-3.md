# ITR-3 — UI GAP MAP (path to 100% schema-complete offline export)

Coverage now: AY2026-27 ~21% (436/2034 req present, reqMISS 1598) · AY2025-26 ~20% (454/2269 req present, reqMISS 1815). Target 100%.

**Sources:** trees `docs/itr-schema-conformance/real/trees/tree-ITR3-2026.txt` / `-2025.txt` (R=required) · diffs `diff/diff-ITR3-2026.txt` / `-2025.txt` · conformance `real/conformance-ITR3-REAL.md` · UI catalog `docs/itr-structure/ITR-3.md` · emitter `buildItr3Json` (`public/tax-utilities/itr3.html:2566-2670` = AY2026-27; `itr3-2025-26.html` identical bar AY constants).

**Legend for classification:** **A** = mis-key / wrong shape (data flows, key or code is non-conformant) · **B** = COMPUTE-ONLY (derived total/summary — no user input; emitter must compute + emit) · **C** = USER-INPUT already captured by an existing drill-in but `buildItr3Json` drops it (or emits zero) · **D** = USER-INPUT with NO input surface anywhere in the tool (new UI). C+D are the only buckets that need data entry; B is pure emitter math; A is a rename/re-code.

> Nuance on income heads: Salary / HP / OS / CG / BP head **totals** are computed inside the embedded `#calcFrame` calculator (`it_sal_total`, `it_hp_income`, `it_os_*`, `it_bp_income`, `it_cg_*`) and ride Part B-TI as rolled-up figures. But the calculator captures **no schedule-grade detail** (per-employer NatureOfEmployment, per-property co-owners, per-scrip CG, OS DTAA rows), so `ScheduleS/HP/OS/CGFor23` are true **D** (schedule detail absent) even though the head total is a partial **B**.

---

## A. Mis-key / shape fixes — our path → schema path | schedule | #req

Data already reaches `buildItr3Json`; it is emitted under a non-schema key, a non-schema code, or a hardcode. Fix = rename/re-code in the emitter, no new capture.

| # | Our emitted path / behaviour | → Correct schema path | Schedule | #req touched | AY |
|---|---|---|---|---|---|
| A1 | Top-level `ITR3.TDSonSalaries[]` (from AIS, `itr3.html:2666`) — key does not exist in Ver1.0/1.1 | `ITR3.ScheduleTDS1.TDSonSalary[]` with children `EmployerOrDeductorOrCollectDetl.TAN` / `.EmployerOrDeductorOrCollecterName` / `IncChrgSal` / `TotalTDSSal`; schedule total `ScheduleTDS1.TotalTDSonSalaries` | ScheduleTDS1 | 5 | both |
| A2 | Top-level `ITR3.TDSonOthThanSals[]` (`itr3.html:2667`); child `TotTDSOnAmtPaid` | `ITR3.ScheduleTDS2.TDSOthThanSalaryDtls[]` — `TDSCreditName`(S/O), `TANOfDeductor`, `TDSSection`, `TaxDeductCreditDtls.TaxClaimedOwnHands`, `AmtCarriedFwd`; total `TotalTDSonOthThanSals` | ScheduleTDS2 | 6 | both |
| A3 | (no emission) — 26AS TDS on sale of property/rent/VDA belongs here, currently would collapse into A2 | `ITR3.ScheduleTDS3.TDS3onOthThanSalDtls[]` — `TDSCreditName`, `PANOfBuyerTenant`, `TDSSection`, `TaxDeductCreditDtls.TaxClaimedOwnHands`, `AmtCarriedFwd`; total `TotalTDS3OnOthThanSal` | ScheduleTDS3 | 6 | both |
| A4 | `Refund.BankAccountDtls.AddtnlBankDetails[].AccountType` exported verbatim UI string ("Savings"/"Current"…) (`itr3.html:2595`) | schema code enum (`SB` savings, `CA` current, `CC`, `OD`, `NRO`) — map in emitter | PartB_TTI | (shape of 4 emitted leaves) | both |
| A5 | `AddtnlBankDetails[].UseForRefund` not emitted (sibling of the 4 that are) | emit `UseForRefund` = Y for the row ticked "For refund?" (data.bank[i].refund already captured) | PartB_TTI | 1 | both |
| A6 | `Verification.Capacity` hardcoded `'S'`; `AssesseeVerPAN` = client-bar PAN (Verifier drill's Capacity/PAN fields dropped, catalog Discrepancy-Verifier) | emit `vfr_capacity` / `vfr_pan` from the Verifier drill-in | Verification | (shape) | both |
| A7 | `PersonalInfo.Address.StateCode` hardcoded `'99'`; `ResidentialStatus` hardcoded `'RES'`; `CountryCode` default | map State text→enum `01..38`, `asr_resstatus`→`RES/NRI/NOR`, country→code | PartA_GEN1 | 3 | both |

Note: A1/A2 are the highest-value fixes — the concept + AIS data already exist; only the key/child names + schedule-level total are wrong. As emitted today they would be **rejected** by the portal.

---

## B. Compute-and-export — schema nodes | source | #req

Pure derived nodes (no user input). Emitter must compute from data already in the model / other schedules and emit. Several are currently emitted as **0** (zero skeleton) and just need real math.

| # | Schema node(s) | Computed from | Schedule | #req (26/25) |
|---|---|---|---|---|
| B1 | `ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot{15,30,40,45}Percent` + `TotPlntMach`; `BuildingSummary.DeprBlockTot{5,10,40}Percent` + `TotBuildng`; `TotalDepreciation` | roll-up of ScheduleDPM / ScheduleDOA `TotalDepreciation` per block | ScheduleDEP | 10 |
| B2 | `ScheduleDCG.SummaryFromDeprSchCG.*` (P&M + Building block totals, `TotalDepreciation`) — deemed CG u/s 50 | `CapGainUs50` rows of DPM/DOA | ScheduleDCG | 10 |
| B3 | `ITR3ScheduleBP.BusSetoffCurrYr.SpeculativeInc.{IncOfCurYrUnderThatHead,BusLossSetoff,IncOfCurYrAfterSetOff}` + same for `SpecifiedInc`; `SpecifiedBusinessInc.DedUs35ADSubSec5Dtls[].DedUs35ADSubSec5`; `BusinessIncOthThanSpec.IncCredPL.OtherExmptIncDtl.OperatingDividend{Name,Amt}` | intra-head loss set-off engine over BP heads (spec/specified 35AD) | ITR3ScheduleBP | 9 |
| B4 | `ScheduleCYLA.*` current-year set-off rows (reqMISS 16) — loss adjusted against each head | CYLA engine across S/HP/BP/CG/OS + LTCG/STCG rate buckets | ScheduleCYLA | 16 |
| B5 | `ScheduleBFLA.*` brought-forward set-off rows (reqMISS 28) | BFLA engine (CFL b/f × current heads) | ScheduleBFLA | 28 |
| B6 | `PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.{TaxInc17,TaxDeferred17,TaxDeferredPayableCY}`; `TaxRelief.TotTaxRelief`; and Rebate87A / Surcharge / EducationCess (emitted 0 today — calc lacks `__taxBreakup`, catalog Discrepancy-PartB-TTI) | tax computation + §89A ESOP deferral + §89/90/91 relief | PartB_TTI | 13 (+ 3 zero-emit) |
| B7 | `ScheduleSI.SplCodeRateTax[].{SecCode,SplRatePercent,SplRateInc,SplRateIncTax}` + `TotSplRateInc`/`TotSplRateIncTax` | special-rate income (LTCG 112A, STCG 111A, lottery 115BB, DTAA) × rate | ScheduleSI | 6 |
| B8 | `ScheduleAMT.*` (adjusted total income + 18.5% AMT) and `ScheduleAMTC.*` (AMT credit b/f, set-off) | Part B-TI + Ch-VIA-C + 10AA claims | ScheduleAMT / AMTC | 9 / 18 |
| B9 | `ManufacturingAccount.{OpngInvntryTotal,DirectExpenses,TotalFactoryOverheads,TotalDebtsManfctrngAcc,ClsngStckTotal,CostOfGoodsPrdcd}`; `TradingAccount` totals (`OperatingRevenueTotal`, `SalesGrossReceiptsTotal`, `TotRevenueFrmOperations`, `TardingAccTotCred`, `DirectExpenses`, `ExciseCustomsVAT.TotExciseCustomsVAT`) | **already-captured** ITR P&L-tab figures (`pl_mfg_*`, `pl_trd_*`) — see C4; totals are the compute layer | ManufacturingAccount / TradingAccount | 6 / 11 |
| B10 | `ITR3ScheduleUD` totals `TotBFUDepritAmt`/`TotCurYrdepritSetoffInc`/`TotDepritBalCFNY` (+ Allow triplet), `CurrAssYr`, `CurBalCFNY` | b/f unabsorbed-dep rows (D-input) × current dep | ScheduleUD | (3 of 16; rest D) |
| B11 | `ScheduleCFL.TotalOfBFLossesEarlierYrs`, `TotalLossCFSummary`, `AdjTotBFLossInBFLA`, per-year `LossCFCurrentAssmntYear*` totals | CFL grid (D-input rows) roll-up | ScheduleCFL | (totals; rest D) |

---

## C. Captured-but-not-exported — schema schedule | EXISTING drill-in/particular (verbatim) | binds | #req

USER-INPUT surfaces that already exist in the tool; `buildItr3Json` never emits them (catalog line 378 "dead data": PTI, SPI, GSTR, Nature of Business, 92CE, ESOP, Other Forms, Directorship, Unlisted shares, FA and AL "captured in state but never emitted; flags in FilingStatus stay 'N'"). Fix = wire existing `data.*` into the emitter (+ flip the FilingStatus flag).

| # | Schema schedule / node | EXISTING drill-in / particular (verbatim from catalog) | binds | #req (26/25) |
|---|---|---|---|---|
| C1 | `PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls[]` (`NameOfCompany`, `CompanyType`, `SharesTypes`) + flag | **"Directorship info."** drill (`itr3.html:950`) nested detail: DIN, Name of the Company, Type of Company, PAN, Whether shares are listed? | `data.director[idx]` | 3 |
| C2 | `PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls[]` (`NameOfCompany`, `CompanyType`, `OpngBal{NumberOfShares,CostOfAcquisition}`, `ClsngBal{NumberOfShares,CostOfAcquisition}`) + flag | **"Unlisted Equity Shares"** drill (`itr3.html:962`) nested share-movement detail | `data.unlisted[idx]` | 6 |
| C3 | `PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls[]` (`NameOfFirm`, `PAN`) + flag | inline **"Partner in a Firm during the PY?"** (only Y/N today — needs firm name/PAN rows added; data slot new) | `partner` (Y/N) | 2 |
| C4 | `PartA_GEN1.FilingStatus.AssesseeRep.{RepName,RepEmailID,CountryCodeRepMobileNo,RepMobileNo}` + `AsseseeRepFlg` | **"Representative Assessee, if any"** drill (`itr3.html:691`): Name, e-Mail ID, Contact No., Country code | `rep_name/rep_email/rep_contact/rep_cc` | 4 |
| C5 | `PartA_GEN2.AuditInfo.AuditDetails92E.{DateOfAudit,AckNum92E}` | **"Other Audits"** drill (`itr3.html:770`) Table 1 row "92E" (date, ack) — currently DOM-only, not persisted | `oa_itax_10_{date,ack}` (needs state binding) | 2 |
| C6 | `PartA_GEN2.NatOfBus.NatureOfBusiness[].Code` | **"Nature of Business / Profession"** drill (`itr3.html:976`): Sector, Sub-Sector, **Code**, Trade name 1/2 | `data.nature[]` | 1 |
| C7 | `PARTA_PL` detail rows (reqMISS 26: presumptive `NatOfBus44AD/ADA/AE`, `OtherExpenses[]`, `BadDebt[]`, income rows) | **ITR P&L** tab (`pane-pl`) — all P&L line inputs + generic breakup drills; currently dropped to zero skeleton (catalog line 369) | `pl_*`, `data.breakups[*]` | 26 |
| C8 | `ManufacturingAccount` + `TradingAccount` line rows (`OtherOperatingRevenueDtls[]`, `OtherIncDtls[]`, `DirectExpenses`, `ExciseCustomsVAT.*`) | **ITR P&L** tab Manufacturing A/c + Trading A/c sections (`pl_mfg_*`, `pl_trd_*`) — dropped to zero | `pl_mfg_*`, `pl_trd_*` | 6 / 11 (rows; totals=B9) |
| C9 | `PARTA_OI.MethodOfValClgStk.{ValRawMaterial,ValFinishedGoods,ChngStockValMetFlg}`; `AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.*` (CGST/SGST/IGST/UTGST/Excise/ServiceTax/VAT/Other + total) | **"44AB Tax Audit details"** drill (`itr3.html:1004`): Method of valuation of closing stock (Raw/Finished), change flag; "Duties/taxes - Credit outstanding" 8× GST/duty inputs | `ab_val_raw/ab_val_fg/ab_val_change/ab_cgst…ab_othertax` | ~14 (subset of PARTA_OI) |
| C10 | `ScheduleTPSA.*` (secondary adjustment 92CE) | **"Tax paid u/s 92CE"** drill (`itr3.html:883`): amount, computed 18%/surcharge/cess/total, deposit grid (Bank&Branch, BSR, Date, Challan, Amount) | `data.ce_amount`, `data.ceDeposit[]` | 13 |
| C11 | `ScheduleESOP.*` (§80-IAC deferred sweat-equity tax) | **"Tax deferred on Sweat Equity Shares/Securities - B/F"** drill (`itr3.html:904`): Employer PAN, DPIIT no., year-wise deferred-tax grid | `data.esop`, `esr_pan/esr_dpiit` | 13 / 11 |
| C12 | `SchedulePTI.*` (pass-through 115UA/UB) | **"Pass Through Income u/s 115U/115UA/115UB"** drill (`itr3.html:990`): entity u/s, fund name, PAN, head, amount, TDS | `data.pti[]` | 56 |
| C13 | `ScheduleSPI.*` (income of specified persons/minor clubbing) | **"Income of Other persons included in computation"** drill (`itr3.html:739`): Name, PAN, Relationship, Head, Amount (minor + other grids) | `data.spiMinor[]`, `data.spiOther[]` | 4 |
| C14 | `ScheduleFA.*` (foreign assets — 108 req) | **"Having Foreign assets…"** block (`f_hasFA`) — 9 sub-drills: Depository/Custodial (`:1032`), Equity/Debt (`:1044`), Insurance (`:1056`), Financial Interest (`:1068`), Immovable (`:1080`), Other Capital Assets (`:1092`), Signing Authority (`:1104`), Trusts (`:1116`), Other income (`:1128`) | `data.fa_*[idx]` | 108 |
| C15 | `ScheduleAL.*` (assets & liabilities — 25 req) | **"Having Assets and Liabilities?"** block (`f_hasAL`): immovable, bank/shares/insurance/loans break-ups, cash, jewellery, paintings, vehicles, firm/AOP interest, liabilities | `data.breakups[al_*]`, `al_immovable/al_cash` | 25 |
| C16 | `ScheduleIF.*` (partnership-firm details — 7 req) | partly derivable from **"Partner in a Firm"** (C3) — firm name/PAN/share; no full IF drill yet → part C part D | `partner` | 7 |
| C17 | `PARTA_QD` (quantitative details — 21 req) — trading/mfg stock item grid | note in 44AB drill says "to be filled in 3CD window"; the "Books not maintained" wrap (`nb_stock` etc.) captures aggregate only, not per-item → mostly D (see D) | `nb_*` (aggregate only) | 0 usable → D |

Also relevant: `PARTA_BS` (64 req) is emitted as a complete **zero skeleton** (reqMISS 0 — all present as ZERO) but the **ITR B/S** tab figures (`bs_*`) are dropped (catalog line 369). Not a reqMISS blocker, but figures must be wired for a *correct* (non-zero) return — treat as C for data-integrity.

---

## D. MISSING UI — per schedule: collects | PARENT screen | NEW/EXTENDED drill-in | key fields (label | type | grid cols) | #req | priority

No input surface exists (income heads capture only head totals in the calc iframe; these need schedule-grade detail). Priority: **P1** = blocks the majority of ITR-3 filers · **P2** = common · **P3** = niche.

### D1 · ScheduleS — Salary (34 req · P1)
- **collects:** per-employer salary breakup for the Salary head.
- **PARENT:** Computation of Income tab (new "Salary — details" drill off the Salary head) or a new **ITR Info → Salary** particular.
- **NEW drill-in:** "Salary details" — repeatable employer grid + exempt-allowance grid.
- **key fields:** Employer grid cols — `NameOfEmployer`(text) | `NatureOfEmployment`(select CGOV/SGOV/PSU/PE/PESG/PEPS) | `AddressDetail.AddrDetail`(text) | `CityOrTownOrDistrict`(text) | `StateCode`(select 01-38) | `Salarys.GrossSalary`(num) | `Salary` u/17(1)(num) | `ValueOfPerquisites`(num) | `ProfitsinLieuOfSalary`(num). Sub-grids: `NatureOfSalary.OthersIncDtls[]`(NatureDesc 1-6 | OthAmount). Exempt: `AllwncExemptUs10Dtls[]`(SalNatureDesc enum 10(5)…| SalOthAmount); HRA `Section10_13A`(Placeofwork 1/2, ActlHRARecv, ActlRentPaid, Sal40Or50Per, EligbleExmpAllwncUs13A). Deductions `DeductionUnderSection16ia`, `ProfessionalTaxUs16iii`. Totals `TotalGrossSalary`/`NetSalary`/`TotIncUnderHeadSalaries`(B).

### D2 · ScheduleHP — House Property (29 req · P1)
- **collects:** per-property let-out/self-occupied computation.
- **PARENT:** Computation tab (HP head) → new "House Property — details" drill.
- **key fields:** Property grid — `AddressDetailWithZipCode.{AddrDetail,CityOrTownOrDistrict,StateCode,CountryCode}` | `PropertyOwner`(SE/MI/SP/OT) | `PropCoOwnedFlg`(YES/NO) → `CoOwners[]`(NameCoOwner, PAN, share%) | `ifLetOut`(L/D/S) → `TenantDetails[]`(NameofTenant, PAN) | `Rentdetails.{AnnualLetableValue,TotalUnrealizedAndTax,BalanceALV,ThirtyPercentOfBalance,IntOnBorwCap}` | `Section24B.Section24BDtls[]`(LoanTknFrom B/I | BankOrInstnName | LoanAccNo | DateofLoan | TotalLoanAmt | LoanOutstndngAmt | InterestUs24B). Totals `IncomeOfHP`, `TotalIncomeChargeableUnHP`(B).

### D3 · ScheduleOS — Other Sources (112 req · P1)
- **collects:** interest/dividend/family-pension/winnings/562x gifts/special-rate/DTAA + quarterly break-up for advance-tax interest.
- **PARENT:** Computation tab (OS head) → new "Other Sources — details" drill (large).
- **key fields:** `IncOthThanOwnRaceHorse.{DividendGross,InterestGross,IntrstFrmSavingBank,IntrstFrmTermDeposit,IntrstFrmIncmTaxRefund,RentFromMachPlantBldgs,FamilyPension,AnyOtherIncome}`; gift block `Tot562x`/`Aggrtvaluewithoutcons562x`/`Immovprop*562x`; `OthersInc.OthersIncDtls[]`(OthNatOfInc | OthAmount); special-rate `IncChargeableSpecialRates`, `LtryPzzlChrgblUs115BB`, 68/69/69A-D unexplained-income rows; DTAA grid `IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS[]`(NatureOfIncome | CountryCode | DTAAarticle | RateAsPerTreaty | RateAsPerITAct | ItemNoincl); **quarterly DateRange grids** (5 buckets Upto15Of6…Up16Of3To31Of3) for `IncFrmLottery`, `IncFrmOnGames`, `DividendIncUs115BBDA*`, `DividendIncUs115A*`, `NOT89A`, `DividendDTAA`. Deductions `Depreciation`, race-horse `IncFromOwnHorse.*`, totals (B).

### D4 · ScheduleCGFor23 — Capital Gains (294 req 26 / 483 req 25 · P1 — largest block)
- **collects:** full short-term + long-term CG by asset class, deductions 54*, deemed CG, DTAA, VDA, accrual quarterly split.
- **PARENT:** Computation tab (CG head) → new **"Capital Gains"** multi-section drill.
- **NEW drill-ins (grid per asset class):**
  - STCG (`ShortTermCapGainFor23.*`): `SaleofLandBuild`(per-property: full value, cost, improvement, expenditure, deduction 54), `EquityMFonSTT`(111A: full value, cost, STCG), `SaleOnOtherAssets`, `SlumpSaleInStcg`, `NRISecur115AD`, DTAA grid `NRICgDTAA[]`, `PassThrIncNatureSTCG[]`, `CapitalLossBuyBackShares`, totals `TotalSTCG`(B).
  - LTCG (`LongTermCapGain23.*`): `SaleofLandBuild`, `SaleOfEquityShareUs112A`(→ Schedule112A), `SaleofAssetNADtls`(112 with/without indexation), `SlumpSaleInLtcgDtls`, `NRISaleOfEquityShareUs112A`, `NRISaleofForeignAsset`, `Proviso112Applicable`, DTAA `NRICgDTAA[]`, `PassThrIncNatureLTCG[]`, totals `TotalLTCG`(B).
  - `DeducClaimInfo` (54/54B/54D/54EC/54F/54G/54GA date+amount grids), `CurrYrLosses`, `AccruOrRecOfCG` (quarterly split of STCG/LTCG rate buckets — mandatory for 234C), `IncmFromVDATrnsf`, `SumOfCGIncm`, `TotScheduleCGFor23`(B).
- **Schedule112A (20/24 req)** & **Schedule115AD (20/24 req)**: scrip-wise 112A grid — `ShareOnOrBefore`, ISIN, share name, no. of shares, sale price, cost, FMV 31/01/2018, acquisition cost, LTCG. (P1, pairs with CG.) AY note: 2026-27 drops `ShortTerm15Per`/`LongTerm10Per`/`LongTerm20Per` rate buckets (single 12.5% LTCG); 2025-26 keeps them → grids are AY-conditional.

### D5 · Chapter VI-A — ScheduleVIA + 80x detail (VIA 11/8 + ~360 across sub-schedules · P1)
- **collects:** every deduction claimed.
- **PARENT:** new **"Deductions (Chapter VI-A)"** screen (or ITR Info group) with one drill per section.
- **key fields / grids:**
  - `ScheduleVIA.UsrDeductUndChapVIA.PensionContribution80CCC[]`(TypeofIdentifier PRAN/OTHPRAN | NameofIdentifier | Amount); totals `TotPartB/C/CAandD chapterVIA`, `TotalChapVIADeductions`(B, both Usr* and Deduct* mirrors).
  - Schedule80C(3), 80CCC/80CCD (in VIA), 80D(18: self/parents, health-insurance + preventive + senior-citizen medical, each with amounts), 80DD(4), 80E(8), 80EE(8), 80EEA(9), 80EEB(9), 80U(3): simple amount/flag drills.
  - **Schedule80G (60 req · donee grid)** — 4 buckets (Don100Percent, Don50PercentNoApprReqd, Don100Approval, Don50Approval), each `DoneeWithPan[]`: cols `DoneeWithPanName` | `DoneePAN` | `AddressDetail.{AddrDetail,CityOrTownOrDistrict,StateCode,PinCode}` | `DonationAmtCash` | `DonationAmtOtherMode` | `DonationAmt` | `EligibleDonationAmt`; bucket totals (B).
  - Schedule80GGA(15), 80GGC(11/9), 80RA(12): donee/contribution grids. Schedule80-IA(4)/80-IB(10)/80-IC(19): profit-linked business-deduction forms (P2).

### D6 · Depreciation — ScheduleDPM + ScheduleDOA (59 + 98 req · P1 for business)
- **collects:** block-of-assets WDV depreciation (Income-Tax Act rates).
- **PARENT:** new **"Depreciation (IT Act)"** screen, feeds Computation's `sf-depit` and BP.
- **ScheduleDPM (Plant & Machinery)** — one row per rate block **Rate15 / Rate30 / Rate40 / Rate45** (Rate45 = fewer cols, no <180-day split), cols: `WDVFirstDay` | `AdditionsGrThan180Days` | `AdditionsLessThan180Days` | `RealizationTotalPeriod` | `RealizationPeriodLessThan180days` | `FullRateDeprAmt` | `HalfRateDeprAmt` | `DepreciationAtFullRate` | `DepreciationAtHalfRate` | `TotalDepreciation` | `DepDisAllowUs38_2` | `NetAggregateDepreciation` | `ProportionateAggDepreciation` | `ExpdrOnTrforSaleAsset` | `CapGainUs50` | `WDVLastDay`.
- **ScheduleDOA (Other Assets)** — blocks **Land** (WDV only), **Building Rate5/Rate10/Rate40**, **FurnitureFittings Rate10**, **IntangibleAssets Rate25**, **Ships Rate20**; same 16-col depreciation-detail shape per block.
- ScheduleDEP / ScheduleDCG summaries = **B** (roll-up).

### D7 · PARTA_OI — Other Information (disallowance grids) (~78 of 92 req · P1 audited)
- **collects:** 44AB tax-audit disclosures — method of accounting, ICDS deviation, §28 non-credited items, §36/37/40/40A/43B disallowances, deemed profits 33AB/41.
- **PARENT:** ITR Info → extend the **44AB Tax Audit** area (C9 already covers valuation + GST outstanding).
- **NEW drill-in:** "Part A - OI (Other Information)" — sectioned amount forms:
  - `MethodOfAcct`, `ChangeInAcctMethFlg`, `ProfDeviatDueAcctMeth`, `DecProOrIncLossUs145_2`.
  - `NoCredToPLAmt.{Section28Items,ProformaCreditsDue,PrevYrEscalClaim,OthItemInc,CapReceipt,TotNoCredToPLAmt}`.
  - `AmtDisallUs36.*` (19 leaves — StkInsurPrem…OthDisallowances + total), `AmtDisallUs37.*` (10), `AmtDisallUs40.*` (11), `AmtDisallUs40A.*` (6), `AmtDisallUs43BPyNowAll.AmtUs43B.*` (8) + `AmtDisall43B.AmtUs43B.*` (8).
  - `DeemedProfUs33ABs`, `ProfTaxAmtUs41`, `AmountOfExpDisAllwUs14A`, `InterestDisAllowUs23SMEAct`, `ScheduleTPSAFlg`.

### D8 · PARTA_QD — Quantitative Details (21 req · P2 audited mfg/trading)
- **NEW drill-in:** "Quantitative details" — 3 item grids: `TradingConcern.QuantitDet[]`, `ManfactrConcern.RawMaterial.QuantitDet[]`, `ManfactrConcern.FinishrByProd.QuantitDet[]`; cols each: `ItemName` | `UnitOfMeasure` | `OpeningStock` | `PurchaseQty` | `SaleQty` | `ClgStock` | `AnyShortExces`.

### D9 · ScheduleCFL + ScheduleUD — carry-forward loss / unabsorbed depreciation (44/43 + 16 req · P2)
- **NEW drill-in:** "Carry-forward losses" — per-AY grid (`LossCFFromPrev{2nd..9th}YearFromAY` rows) with columns for HP loss / business loss / speculative / STCG / LTCG / OS; UD grid `ScheduleUD[]`(AssYr | AmtBFUD | AmtDeprSOCY | BalCFNY | AmtBFUAllow | AmtAllowSOCY | AllowBalCFNY). Totals = B10/B11.

### D10 · ScheduleIT + ScheduleTCS — challans / TCS credit (5 + 4 req · P1 tax-credit)
- **PARENT:** Tax Summary & Filing tab (new "Taxes Paid" drill; AIS import can prefill).
- **ScheduleIT** `TaxPayment[]`: `BSRCode` | `DateDep` | `SrlNoOfChaln` | `Amt`; total `TotalTaxPayments`(B). **ScheduleTCS** `TCS[]`: `TCSCreditOwner`(1/2) | `EmployerOrDeductorOrCollectTAN` | `AmtCarriedFwd`; total `TotalSchTCS`(B).

### D11 · Niche schedules (P3)
- ScheduleEI (exempt income 12/15), Schedule10AA (SEZ 3), ScheduleFSI (foreign-source income 27) + ScheduleTR1 (tax-relief 9), Schedule5A2014 (Portuguese-code spouse split 22), ScheduleVDA (crypto 8), ScheduleESR (§35 scientific-research 30), Schedule  80-IA/IB/IC (33), TaxReturnPreparer (2 — extend "Other Forms filed" TRP fields already captured `ofr_trp_*` → part C), Schedule10AA.
- **AY2025-26 only:** `PartA_139_8A` (updated-return block, 12 req: PAN/Name/AY/PreviouslyFiledForThisAY/AcknowledgementNo/reasons) + `PartB-ATI` (additional tax u/s 140B, 20 req incl. ScheduleIT1/IT2 challan grids). Only for §139(8A) updated returns; absent in 2026-27 schema.

---

## E. Per-required-schedule checklist — schedule · #req (26/25) · coverage · action · target

| Schedule | #req 26/25 | coverage now | action | target |
|---|---|---|---|---|
| CreationInfo / Form_ITR3 / Verification | 6/5/6 | ✓ full | A6 (verifier shape) | keep |
| PartA_GEN1 | 46/39 (reqMISS 25/19) | ◑ identity ok; residue missing | A7 + C1/C2/C3/C4 + D (alt-address, jurisdiction, clauseiv7) | 100% |
| PartA_GEN2 | 8/8 (reqMISS 3) | ◑ | C5 (92E) + C6 (NatOfBus Code) | 100% |
| PARTA_BS | 64 (reqMISS 0) | ✓ zero skeleton | C (wire `bs_*` for correctness) | correct figures |
| PARTA_PL | 132 (reqMISS 26) | ◑ | C7 (wire P&L tab detail rows) | 100% |
| PARTA_OI | 92/91 (reqMISS all) | ✗ | C9 (valuation+GST) + D7 (disallowances) | 100% |
| PARTA_QD | 21 | ✗ | D8 | 100% |
| ManufacturingAccount / TradingAccount | 6/11 | ✗ | C8 (rows) + B9 (totals) | 100% |
| ITR3ScheduleBP | 116/114 (reqMISS 9) | ◑ | B3 (set-off + 35AD + exempt-div) | 100% |
| ITR3ScheduleUD | 16 | ✗ | D9 (rows) + B10 (totals) | 100% |
| ScheduleS / HP / OS | 34 / 29 / 112 | ✗ | D1 / D2 / D3 | 100% |
| ScheduleCGFor23 | 294/483 | ✗ | D4 | 100% |
| Schedule112A / 115AD | 20+20 / 24+24 | ✗ | D4 | 100% |
| ScheduleDPM / DOA | 59 / 98 | ✗ | D6 | 100% |
| ScheduleDEP / DCG | 10 / 10 | ✗ | B1 / B2 | 100% |
| ScheduleCYLA / BFLA | 37/43 · 58/70 (reqMISS 16/28) | ◑ | B4 / B5 | 100% |
| ScheduleCFL | 44/43 | ✗ | D9 + B11 | 100% |
| ScheduleVIA + 80C…80U/80-IA…IC | 11/8 + ~360 | ✗ | D5 | 100% |
| ScheduleAMT / AMTC | 9 / 18 | ✗ | B8 | 100% |
| ScheduleSI | 6 | ✗ | B7 | 100% |
| ScheduleEI | 12/15 | ✗ | D11 | 100% |
| ScheduleSPI | 4 | ✗ | C13 | 100% |
| SchedulePTI | 56 | ✗ | C12 | 100% |
| ScheduleFA | 108 | ✗ | C14 | 100% |
| ScheduleAL | 25 | ✗ | C15 | 100% |
| ScheduleTPSA | 13 | ✗ | C10 | 100% |
| ScheduleESOP | 13/11 | ✗ | C11 | 100% |
| ScheduleIF | 7 | ✗ | C16 + D | 100% |
| ScheduleTDS1 / TDS2 / TDS3 | 5 / 6 / 6 | ✗ (mis-keyed) | A1 / A2 / A3 | 100% |
| ScheduleIT / TCS | 5 / 4 | ✗ | D10 | 100% |
| Schedule10AA / FSI / TR1 / 5A2014 / VDA / ESR / 80-IA/IB/IC | 3/27/9/22/8/30/33 | ✗ | D11 | 100% |
| TaxReturnPreparer | 2 | ✗ | C (wire `ofr_trp_*`) | 100% |
| PartB-TI | 35/38 (reqMISS 0) | ✓ zero skeleton | B (real head figures) | correct |
| PartB_TTI | 43 (reqMISS 13) | ◑ | A4/A5 + B6 | 100% |
| PartA_139_8A / PartB-ATI (2025 only) | —/12 · —/20 | ✗ | D11 (AY-specific) | 100% (2025) |

---

## F. Path-to-100 summary

**Counts by action (distinct required leaves, AY2026-27 basis; AY2025-26 larger only via CG 483 & the two 2025-only blocks):**
- **A (mis-key/shape):** ~17 leaves that flow but are non-conformant (TDS1/2/3 = 17 core; + bank AccountType/UseForRefund, verifier, StateCode/ResStatus shape). Cheapest, highest-ROI — pure emitter edits.
- **B (compute-only):** ~110 leaves — DEP/DCG (20), CYLA/BFLA (44), BP set-off (9), SI (6), AMT/AMTC (27), PartB_TTI (13), Mfg/Trading + UD/CFL totals (~17). No UI; emitter math + a loss-set-off/tax engine.
- **C (captured, not exported):** ~330 leaves across 17 existing drill-ins (FA 108, PTI 56, AL 25, TPSA 13, ESOP 13, PARTA_PL 26, Mfg/Trading rows 17, PARTA_OI valuation/GST 14, GEN1/GEN2 residue ~18, SPI 4, others). Wire `data.*` → emitter + flip FilingStatus flags.
- **D (missing UI):** ~1150 leaves (26-27) / ~1340 (25-26) — the bulk. CG 294/483, OS 112, DOA 98, 80G 60, DPM 59, PARTA_OI disallowances 78, S 34, HP 29, VIA+80x remainder, QD 21, CFL 44, plus P3 tail.

**# NEW drill-ins to build: ~24** — Salary, House Property, Capital Gains (multi-section), Other Sources, Depreciation (DPM+DOA), Part A-OI disallowances, Quantitative Details, Carry-forward/UD, Deductions-VIA hub + ~15 per-section 80x sub-forms (80C/80D/80DD/80E/80EE/80EEA/80EEB/80G/80GGA/80GGC/80RA/80U/80-IA/IB/IC), Schedule112A/115AD, Taxes-Paid (IT/TCS/TDS challans), FSI/TR1, 5A2014, VDA, EI, ESR, 10AA, plus 2025-only 139(8A)/ATI.

**Top 3 new-UI surfaces (by required-leaf payoff):** (1) **Capital Gains** (ScheduleCGFor23 + 112A/115AD = ~334/531 req) · (2) **Other Sources** (ScheduleOS 112 req) · (3) **Depreciation DPM+DOA** (157 req) — the last unlocks DEP/DCG/UD/BP/PartB compute cascade.

**Biggest blocker:** ScheduleCGFor23 — 294 (26-27) / 483 (25-26) required leaves with **zero input surface**, the single largest gap and a hard filing-blocker for any assessee with capital gains; its quarterly-accrual and 54-deduction sub-structures make it the heaviest new build.

**Ordered build list (identity → business core → income heads → deductions → depreciation → OI → credits → disclosures):**
1. **A1-A7** emitter shape/key fixes (TDS1/2/3, bank codes, verifier, StateCode) — days, unblocks tax-credit conformance.
2. **C1-C6** GEN1/GEN2 wiring (Directorship, Unlisted, Partner, Rep, 92E, NatOfBus Code) — flip FilingStatus flags.
3. **C7/C8 + B9** wire ITR B/S + P&L tabs → PARTA_BS/PL + Manufacturing/Trading (business BS/PL/BP correctness).
4. **B3** BP set-off + 35AD + exempt-dividend.
5. **D1/D2/D3** income heads Salary → House Property → Other Sources (+ their B totals).
6. **D4** Capital Gains (+112A/115AD) — largest.
7. **D5** Chapter VI-A hub + 80x sub-forms; then **B7/B8** SI + AMT/AMTC.
8. **D6** Depreciation DPM/DOA → **B1/B2** DEP/DCG → **B10** UD, **D9/B11** CFL, → **B4/B5** CYLA/BFLA engine.
9. **D7 + C9** PARTA_OI disallowances; **D8** PARTA_QD.
10. **D10** TDS/TCS/IT challans + **B6** PartB_TTI (surcharge/cess/rebate/relief/§89A).
11. **C10-C16** disclosure schedules FA/AL/PTI/SPI/TPSA/ESOP/IF wiring; **D11** niche (EI/FSI/TR1/5A2014/VDA/ESR/10AA/80-IA-IC) and AY2025-only 139(8A)/PartB-ATI.
