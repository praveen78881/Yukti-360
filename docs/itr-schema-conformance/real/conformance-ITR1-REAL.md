# ITR-1 (Sahaj) — Real ITD Schema Conformance

**Form:** ITR-1 · **Emitter:** `buildItr1Json()` (identical builder in both AY files) · **AYs:** 2026-27 (`public/tax-utilities/itr1.html`) + 2025-26 (`public/tax-utilities/itr1-2025-26.html`)
**Schema version (from `Form_ITR1.SchemaVer`):** AY 2026-27 = Ver1.1 · AY 2025-26 = Ver1.0

## 1. Headline

| AY | Schema leaves | Required | Present (OK+ZERO) | reqMISS | **% required present** |
|---|---|---|---|---|---|
| **2026-27** | 448 | 352 | 111 (all-leaf) / reqPresent 101 | 251 | **28.7 %** |
| **2025-26** | 454 | 365 | 108 (all-leaf) / reqPresent 99 | 266 | **27.1 %** |

> `% required present = (required − reqMISS) / required`. After the false-MISS correction in §4 (~13 leaves per AY are conditionally emitted, empty only because the probe fed no rows) the *true* capacity is ≈ **32 %** (2026-27) / ≈ **30 %** (2025-26). Note the diff's own "%required-fillable 8 %" is `reqOK/required` (non-zero only) and understates capacity — ZERO ≠ gap.

The shape of the gap is systemic and identical across both AYs: the emitter writes the **identity block, the aggregate income/deduction roll-ups, the tax-computation ladder, and the taxes-paid totals** — and drops **every itemized proof schedule** (each Schedule 80x, TDS/TCS line-items, tax-payment challans, structured House-Property detail). Income *numbers* flow; the *supporting detail the portal requires* does not.

## 2. Per-schedule capacity (AY 2026-27; 2025-26 is materially identical)

| Schedule | req | present | reqMISS | status |
|---|---|---|---|---|
| CreationInfo | 6 | 6 | 0 | ✓ mostly present |
| Form_ITR1 | 5 | 5 | 0 | ✓ |
| PersonalInfo | 17 | 19 | 4 | ◑ partial (AlternateAddress missing) |
| FilingStatus | 10 | 4 | 6 | ◑ (AssesseeRep + clause-iv-7 proviso missing) |
| ITR1_IncomeDeductions | 91 | 52 | 43 | ◑ (totals OK; House-Property/allowance/dividend detail absent) |
| ITR1_TaxComputation | 13 | 13 | 0 | ✓ (all present/zero) |
| TaxPaid | 6 | 6 | 0 | ✓ |
| Verification | 5 | 5 | 0 | ✓ |
| Refund | 6 | 1 | 5 | ✗→◑ (false-MISS: 4/5 emitted, see §4) |
| TDSonSalaries | 5 | 0 | 5 | ✗→◑ (false-MISS: 4/5 emitted) |
| TDSonOthThanSals | 8 | 0 | 8 | ✗→◑ (false-MISS: 4/8 emitted) |
| LTCG112A | 3 | 0 | 3 | ✗ (⚠ wrong key, see §4) |
| Schedule80C | 3 | 0 | 3 | ✗ absent |
| Schedule80D | 19 | 0 | 19 | ✗ absent |
| Schedule80DD | 4 | 0 | 4 | ✗ absent |
| Schedule80E | 8 | 0 | 8 | ✗ absent |
| Schedule80EE | 8 | 0 | 8 | ✗ absent |
| Schedule80EEA | 9 | 0 | 9 | ✗ absent |
| Schedule80EEB | 9 | 0 | 9 | ✗ absent |
| Schedule80G | 60 | 0 | 60 | ✗ absent |
| Schedule80GGA | 15 | 0 | 15 | ✗ absent |
| Schedule80GGC | 9 | 0 | 9 | ✗ absent |
| Schedule80U | 3 | 0 | 3 | ✗ absent |
| ScheduleEA10_13A (HRA) | 8 | 0 | 8 | ✗ absent |
| ScheduleTCS | 7 | 0 | 7 | ✗ absent |
| ScheduleTDS3Dtls (rent TDS) | 8 | 0 | 8 | ✗ absent |
| TaxPayments (challans) | 5 | 0 | 5 | ✗ absent |
| TaxReturnPreparer | 2 | 0 | 2 | ✗ absent |
| *(2025-26 only)* PartA_139_8A | 12 | 0 | 12 | ✗ absent |
| *(2025-26 only)* PartB-ATI | 20 | 0 | 20 | ✗ absent |

## 3. Ranked filing-blockers (most material first)

1. **Itemized Chapter VI-A deduction schedules — 80C/80D/80G/80DD/80U/80E-EE-EEA-EEB/80GGA/80GGC (≈205 required nodes, entirely absent).** Largest cluster by node count is **Schedule80G (60 nodes)**. The UI *does* capture per-drill deduction detail — full 80D insurer/policy/premium grid, 80CCH, 80DD dependent — but `chapVIA()` reads only the aggregate section cells (`it_80_c`, `it_80_d`, `it_80_g`…) and emits scalar `DeductUndChapVIA.SectionXX` totals; no itemized `ScheduleXX` node is built. **Mixed**: 80C/80D detail is *captured-but-not-exported*; 80G/80GGA/80GGC donee-level detail is *truly absent* (UI captures only a single `it_80_g` total).
2. **House-Property structured detail — `ITR1_IncomeDeductions.PropertyDetails[]` (≈27 required nodes: address, owner, co-owners, tenant, Rentdetails, Section24B loans).** **Captured-but-not-exported** — the highest-value gap. The Computation frame fully captures property address, owner %, let-out rent rows, municipal tax, and per-loan Section 24(b) interest (loan-from/bank/acct/date/amount), yet the emitter exports only the aggregate `TotalIncomeChargeableUnHP` (a ZERO leaf). All structural HP detail is dropped.
3. **TDS/TCS credit schedules — TDSonSalaries, TDSonOthThanSals, ScheduleTCS, ScheduleTDS3Dtls (rent TDS).** Partly a false-MISS (§4): salary/other-than-salary TDS rows *are* emitted with TAN + deductor + income + TDS. **Genuinely missing**: `TDSSection`, `DeductedYr`, per-schedule grand totals, all of **ScheduleTCS** (emitter hard-codes `TaxPaid.TaxesPaid.TCS:0` even though the TDS/TCS drill captures TCS totals — captured-but-not-exported), and rent-TDS (26QC). Without section/year/claim fields the portal cannot reconcile Form-26AS credit.
4. **TaxPayments challans (5 nodes) — advance-tax / self-assessment challan detail.** Aggregate `AdvanceTax`/`SelfAssessmentTax` emitted (ZERO); per-challan `BSRCode/DateDep/SrlNoOfChaln/Amt` **absent**. Captured in the Summary tab but not exported.
5. **ScheduleEA10_13A (HRA exemption, 8 nodes) — captured-but-not-exported.** HRA is captured in the monthly-salary table and Form-16 exemption grid but no `ScheduleEA10_13A` node is emitted.
6. **Identity edge fields — FilingStatus.AssesseeRep (4) + clause-iv-7 proviso (2); PersonalInfo.AlternateAddress (4).** Representative-assessee data *is* captured in the UI drill-in but `AsseseeRepFlg` is hard-coded `'N'` and RepName/Email/Mobile are never emitted — captured-but-not-exported. Only bites returns filed by a representative.
7. **LTCG112A (3 nodes)** — see §4 (wrong key, partial).
8. ***(AY 2025-26 only)* ITR-U machinery — PartA_139_8A (12) + PartB-ATI (20), 32 required nodes, truly absent.** No updated-return support at all.

## 4. False-MISS corrections (semantic / probe-empty deltas)

The diff matches on exact path and flags array-child leaves as MISS whenever the probe fed no rows, even though the emitter emits them conditionally. Spot-checking the "REQUIRED MISSING" list against `buildItr1Json` found **~13 false-MISS per AY**:

- **Refund.BankAccountDtls.AddtnlBankDetails[] → IFSCCode, BankName, BankAccountNo, AccountType (4).** Emitted at itr1.html:1967 (`data.bank.filter(b=>b.acc).map(...)`). Present but empty in the probe → false-MISS. *Genuinely missing:* `UseForRefund`.
- **TDSonSalaries → TAN, EmployerOrDeductorOrCollecterName, IncChrgSal, TotalTDSSal (4).** Emitted at :1976 under `if(sal.length)`. False-MISS. *Genuinely missing:* `TotalTDSonSalaries` (grand total).
- **TDSonOthThanSals → TAN, name, AmtForTaxDeduct, TotTDSOnAmtPaid (4).** Emitted at :1977 under `if(oth.length)`. False-MISS. *Genuinely missing:* `TDSSection`, `DeductedYr`, `ClaimOutOfTotTDSOnAmtPaid`, `TotalTDSonOthThanSals`.
- **LTCG112A.LongCap112A — semantic partial (⚠), naming delta.** Emitter emits `LTCG112A.TotLTCG112A` (:1971) — a non-schema key. We *do* compute the LTCG figure but export it under the wrong name and omit `TotSaleCnsdrn`/`TotCstAcqisn`. Reclassify `LongCap112A` as ⚠ semantic-partial (wrong key), the other two as true MISS.

Net: **12 clean false-MISS + 1 semantic-partial per AY.** These are conditional emissions, so the schedules above move from ✗ to ◑ once real data is present. All other listed MISS leaves were confirmed genuinely absent from the emitter.

## 5. AY delta 2025-26 → 2026-27 (schema changes that affect us)

- **ITR-U removed from the ordinary form path (2026-27).** AY 2025-26's schema carries `PartA_139_8A` (17) + `PartB-ATI` (34) for updated returns; AY 2026-27 drops them. 32 required nodes we never emitted disappear from the 2026-27 blocker list.
- **House-Property restructured (flat → nested).** AY 2025-26 uses flat HP leaves (`AnnualValue`, `StandardDeduction`, `TotalIncomeOfHP`) plus a separate top-level `ScheduleUs24B[]` for interest loans. AY 2026-27 replaces these with a structured `ITR1_IncomeDeductions.PropertyDetails[]` block (address, co-owners, tenants, `Rentdetails`, nested `Section24B`). `ITR1_IncomeDeductions` grows 98→122 leaves. We emit neither shape, but any HP fix must target the AY-specific structure.
- **Sec 89A leaves present in 2025-26, gone in 2026-27.** `IncomeNotified89A` / `NOT89A[]` / OS `NOT89AInc` date-ranges are required MISS in 2025-26 only.
- **Leaf/required totals:** 2025-26 = 454/365; 2026-27 = 448/352. `SchemaVer` bumped Ver1.0 → Ver1.1.
- **No change to the deduction-schedule or TDS/TCS gap** — identical builder, identical absence in both AYs.
