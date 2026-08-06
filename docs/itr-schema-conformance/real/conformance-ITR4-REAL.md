# ITR-4 (Sugam) — Schema Conformance vs REAL ITD JSON-Schema

**Form:** ITR-4 Sugam · **AYs:** 2026-27 and 2025-26
**Emitter SchemaVer (as stamped by `buildItr4Json`):** `Ver1.1` (`Form_ITR4.SchemaVer`)
**Tools:** `public/tax-utilities/itr4.html` (AY 2026-27) · `public/tax-utilities/itr4-2025-26.html` (AY 2025-26). The two files are byte-identical apart from AY strings and new-regime slab/rebate constants; the JSON builder (`buildItr4Json`, itr4.html:1855) is shared, so the two AYs differ only where the *schema* differs.

| AY | Schema leaves | Required | Present (OK+ZERO) | reqPresent | **% required present** |
|---|---|---|---|---|---|
| 2026-27 | 499 | 337 | 104 | 96 | **28.5 %** |
| 2025-26 | 509 | 354 | 101 | 93 | **26.3 %** |

> Headline = (required − reqMISS) / required. PRESENCE counts a leaf that is emitted at all (OK **or** ZERO). ZERO leaves (73 in 2026, 71 in 2025) are *capacity present, no probe data* — not defects. The diff's "%required-fillable" (8.6 % / 7.9 %) counts only non-zero required and is **not** the capability metric.

The dominant reality: our exporter is a **computation/identity core, not a schedule exporter.** Everything under `PersonalInfo`, `Form_ITR4`, `CreationInfo`, `Verification`, `TaxComputation`, `TaxPaid` is present; virtually every *detail schedule* (deductions, donations, TDS/TCS challans, house-property, presumptive-business detail) is absent from the JSON even where the UI captures the data.

---

## 1. Per-schedule capacity (AY 2026-27)

| Schedule | Required | Present | reqMISS | Status |
|---|---|---|---|---|
| CreationInfo | 6 | 6 | 0 | ✓ |
| Form_ITR4 | 5 | 5 | 0 | ✓ |
| PersonalInfo | 20 | 14 | 6 | ◑ |
| Verification | 5 | 5 | 0 | ✓ |
| TaxComputation | 11 | 11 | 0 | ✓ (all ZERO but emitted) |
| TaxPaid | 6 | 6 | 0 | ✓ (all ZERO) |
| IncomeDeductions | 85 | 44 | 41 | ◑ |
| FilingStatus | 10 | 4 | 6 | ◑ |
| Refund | 6 | 1 | 5 | ✗ (4 false-MISS, see §4) |
| **ScheduleBP** | **20** | **0** | **20** | **✗ (income-head — top blocker)** |
| ScheduleIT | 5 | 0 | 5 | ✗ |
| ScheduleTCS | 6 | 0 | 6 | ✗ |
| ScheduleTDS3Dtls | 5 | 0 | 5 | ✗ |
| TDSonSalaries | 5 | 0 | 5 | ✗ (4 false-MISS, AIS-conditional) |
| TDSonOthThanSals | 5 | 0 | 5 | ✗ (emitted under wrong shape, see §4) |
| Schedule80C | 3 | 0 | 3 | ✗ |
| Schedule80D | 17 | 0 | 17 | ✗ |
| Schedule80DD | 4 | 0 | 4 | ✗ |
| Schedule80E | 8 | 0 | 8 | ✗ |
| Schedule80EE | 8 | 0 | 8 | ✗ |
| Schedule80EEA | 9 | 0 | 9 | ✗ |
| Schedule80EEB | 9 | 0 | 9 | ✗ |
| Schedule80G | 52 | 0 | 52 | ✗ |
| Schedule80GGC | 9 | 0 | 9 | ✗ |
| Schedule80U | 3 | 0 | 3 | ✗ |
| ScheduleEA10_13A | 8 | 0 | 8 | ✗ |
| LTCG112A | 3 | 0 | 3 | ✗ |
| TaxExmpIntIncDtls | 2 | 0 | 2 | ✗ |
| TaxReturnPreparer | 2 | 0 | 2 | ✗ |

(2025-26 mirrors this, plus three schedules unique to 2025 — see §5: `PartA_139_8A` 12 reqMISS, `PartB-ATI` 20 reqMISS, `ScheduleUs24B` 8 reqMISS — and lacks the expanded inline `PropertyDetails` block.)

---

## 2. What IS solid

- **Identity & chrome** — `CreationInfo`, `Form_ITR4`, `PersonalInfo.AssesseeName/PAN/DOB/Status`, `Verification` (name, PAN, capacity, date): fully present.
- **Tax computation & tax-paid totals** — all 11 `TaxComputation` and 6 `TaxPaid` required leaves are emitted (ZERO in the probe because no figures were fed, but structurally present and computed live on the Computation tab).
- **Aggregate income heads** — `IncomeDeductions.{IncomeFromBusinessProf, GrossSalary, TotalIncomeChargeableUnHP, IncomeOthSrc, GrossTotIncome, TotalIncome}` and the full `UsrDeductUndChapVIA`/`DeductUndChapVIA` *summary numbers* are emitted. The income-tax *number* is right; the schedule *breakdown* is what's missing.

---

## 3. Ranked FILING-BLOCKERS (most material first)

### B1 — ScheduleBP (presumptive business/profession detail) — 20 req / 49 nodes — **CAPTURED-BUT-NOT-EXPORTED**
This is the defining schedule of ITR-4 and it is entirely absent from the JSON. Missing required leaves include `NatOfBus44AD/44ADA/44AE[].{NameOfBusiness, Code}`, `PersumptiveInc44AD.{GrsTotalTrnOver, TotPersumptiveInc44AD}`, the parallel 44ADA/44AE blocks, per-vehicle `GoodsDtlsUs44AE[]`, and `TurnoverGrsRcptForGSTIN[]`. **The data exists in our UI** — nature-of-business codes in the "Nature of Business/Profession" grid (`data.nature[]`), turnover in the 44AD/44ADA/44AE Computation drill-ins, GSTIN turnover in the GSTR grid (`data.gstr[]`). The exporter collapses all of it into a single aggregate `IncomeDeductions.IncomeFromBusinessProf` and drops the schedule. A portal upload with no ScheduleBP fails for a presumptive return. **Highest-value fix in the whole form.**

### B2 — Tax-credit schedules: ScheduleIT / ScheduleTCS / ScheduleTDS3Dtls / TDSonSalaries / TDSonOthThanSals — 26 req combined
`ScheduleIT` (self-assessment/advance-tax challans: BSRCode, DateDep, SrlNoOfChaln, Amt) and `ScheduleTCS` are **truly absent** (no UI capture, no export). `TDSonSalaries` / `TDSonOthThanSals` are **conditionally emitted only from an AIS import** and even then `TDSonOthThanSals` is written under a **non-schema shape** (see §4) and totals are dropped. Without these, claimed prepaid tax cannot be substantiated at upload.

### B3 — Chapter VI-A detail schedules (80C/80D/80DD/80E/80EE/80EEA/80EEB/80G/80GGC/80U + EA10_13A) — 200+ req nodes truly absent
The exporter emits only the **aggregate rupee amount** per section inside `UsrDeductUndChapVIA` (mostly ZERO — several read non-existent calc cells, per catalog discrepancy #3). None of the *itemised* schedules (insurer/policy rows, donee PAN+address rows, loan-lender rows) exist in the UI at all → **truly absent from our software.** 80G alone is 52 required leaves.

### B4 — FilingStatus.AssesseeRep (representative assessee) — 4–6 req — **CAPTURED-BUT-NOT-EXPORTED**
The "Representative Assessee" drill-in collects name/PAN/email/contact (`data.repassessee`), but export hardcodes `AsseseeRepFlg:'N'` and never emits `AssesseeRep.*`. Also missing: `clauseiv7provisio139iDtls[]`. A return filed by a legal heir/guardian cannot be represented correctly.

### B5 — House-property detail (`IncomeDeductions.PropertyDetails[]`, 2026) / `ScheduleUs24B` (2025) — ~30 / 8 req — truly absent
2026 requires a full inline let-out/self-occupied property block (address, co-owners, tenants, ALV, Section 24B loan rows); 2025 requires the standalone `ScheduleUs24B` loan-interest schedule. Neither is captured or exported — the UI only carries the aggregate HP income number from the calculator.

### B6 — PartA_139_8A + PartB-ATI (updated-return u/s 139(8A), **2025-26 only**) — 32 req — truly absent
The entire updated-return machinery (acknowledgement of original, reasons for updating, `PartB-ATI` recomputation + 140B tax + challan sub-schedules) is unimplemented. Blocks any ITR-U filing for AY 2025-26. **Removed from the 2026-27 schema** (see §5).

---

## 4. False-MISS corrections (semantic naming / conditional deltas)

Spot-checked ~13 "REQUIRED MISSING" leaves against `buildItr4Json`. Found **8 clean false-MISS + 1 shape-delta**:

| # | Diff-reported MISS | Reality | Class |
|---|---|---|---|
| 1–4 | `Refund.BankAccountDtls.AddtnlBankDetails[].{IFSCCode, BankName, BankAccountNo, AccountType}` | Emitted from `data.bank` rows (itr4.html:1879, mapped `bankRows`). The parent array is present-but-empty (`Z`) in the probe because no bank row was fed → children didn't materialise. **Capacity exists.** | ⚠ semantic-partial (false-MISS) |
| 5–8 | `TDSonSalaries.TDSonSalary[].{TAN, EmployerOrDeductorOrCollecterName, IncChrgSal, TotalTDSSal}` | Emitted from imported AIS TDS entries (itr4.html:1913). Conditional (`if(sal.length)`), absent only because probe had no AIS import. **Capacity exists.** | ⚠ semantic-partial (false-MISS) |
| 9 | `TDSonOthThanSals.TDSonOthThanSalDtls[].*` | We DO emit TDS-on-non-salary from AIS, but under a **different, non-compliant shape**: node `TDSonOthThanSal` (not `…Dtls`), fields `TAN`/`AmtForTaxDeduct`/`TotTDSOnAmtPaid` instead of schema's `TANOfDeductor`/`TDSSection`/`TDSClaimed`/`TDSCreditCarriedFwd` (itr4.html:1914). Concept present, **wrong path → would fail schema validation.** | ⚠ shape-delta |

**Truly MISS (confirmed, not false):** `Refund…AddtnlBankDetails[].UseForRefund` (not in `bankRows` map), `TDSonSalaries.TotalTDSonSalaries` (total node not built), all of ScheduleBP, ScheduleIT, ScheduleTCS, and every Chapter VI-A detail schedule.

**False-MISS found: 8** (4 bank + 4 salary-TDS), plus **1 shape-delta** (TDSonOthThanSals). These slightly understate real capacity in `Refund` (true reqPresent 5/6, not 1/6, when a bank row is fed) and `TDSonSalaries`. They do **not** move the headline materially: both are data-/import-conditional and the array-empty probe legitimately shows no leaves.

---

## 5. AY delta 2025-26 → 2026-27 (schema changes that affect us)

- **Updated-return blocks removed.** 2025-26 schema carries `PartA_139_8A` (17 leaves / 12 req) and `PartB-ATI` (34 leaves / 20 req) for ITR-U filings; **both are gone from the 2026-27 schema.** We emit neither, so their removal *raises* the 2026 headline (32 unfillable required leaves disappear) — the improvement is schema-driven, not a fix on our side.
- **House-property representation flipped.** 2025-26 uses a standalone `ScheduleUs24B` (8 req, loan-interest only); 2026-27 replaces it with a much larger inline `IncomeDeductions.PropertyDetails[]` block (address, co-owners, tenants, Rentdetails, nested `Section24B`) — the jump in IncomeDeductions size (116 vs 93 leaves; 85 vs 66 req). We capture neither; the 2026 house-property gap is wider.
- **Retirement-foreign-account (89A) fields** (`IncomeNotified89A*`, `NOT89A*` under OthersInc) are required in 2025-26 but not surfaced the same way in 2026-27's IncomeDeductions. Unimplemented in both.
- **FilingStatus rep fields renamed:** 2025-26 wants `AssesseeRep.{RepName, RepCapacity, RepAddress, RepPAN}` + `OptOutNewTaxRegime_Form10IEA_AY24_25`; 2026-27 wants `AssesseeRep.{RepName, RepEmailID, CountryCodeRepMobileNo, RepMobileNo}`. Both unexported.
- **Totals:** leaves 509→499, required 354→337 (net −17 required, almost entirely the ITR-U removal). New-regime slab bands and 87A rebate constants differ (0/4L nil + ₹60k rebate ≤₹12L in 2026 vs 0/3L nil + ₹25k rebate ≤₹7L in 2025) — computation-only, no schema-shape impact.
