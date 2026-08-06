# ITR-3 — SCHEMA CONFORMANCE / FILL-CAPACITY

**Schema:** `openapi.json` (Sandbox mirror, ITR-3 = 37 schedules, **1,666 leaf nodes**) · **Our emitter:** `buildItr3Json` (public/tax-utilities/itr3.html:2566)
**Method:** schema leaf counts via node walk of the OpenAPI request-body tree; emitter behaviour verified **live** (`itr-sim/probe-emit-shape.mjs`, msedge, zero page errors) + source grep of the builder. Schedule-level (interim; per-leaf against the official ITD schema to follow).
**Headline:** ~**12% fillable**. The **business side is well-bound** (Balance Sheet / P&L / BP emit with real values), but **every other income head is absent** — Salary, Capital Gains, Other Sources, Chapter VI-A, Depreciation, and Part-A Other-Info are not emitted.

## Capacity matrix (schedule × can our software fill it)

| Schedule | Schema leaves | Emitter | Fill quality |
|---|--:|:--|:--|
| CreationInfo | 6 | ✓ emitted | ⚠ SW creds placeholder |
| Form_ITR3 | 5 | ✓ emitted | ✓ constants |
| PartA_GEN1 | 39 | ✓ emitted (29) | ⚠ regime wrong-key; `ReturnFileSec` 11 |
| PartA_GEN2 | 10 | ✓ emitted (5) | ⚠ audit/nature-of-business partial |
| **PARTA_BS** (Balance Sheet) | 70 | ✓ emitted (64) | ✓ bound to `data-bs` inputs — populates with real books |
| **PARTA_PL** (Profit & Loss) | 137 | ✓ emitted (106) | ✓ bound to `data-pl` inputs — populates with real books |
| **ITR3ScheduleBP** (Business/Profession) | 122 | ✓ emitted (107) | ✓ computed from books; the strongest area |
| PartB-TI | 41 | ✓ emitted (35) | ⚠ non-business head totals feed from absent schedules → 0 |
| PartB_TTI | 49 | ✓ emitted (34) | ✗ **surcharge/cess/rebate/234 hard-zeroed — no `__taxBreakup`** |
| ScheduleCYLA | 88 | ✓ emitted (21) | ⚠ skeleton |
| ScheduleBFLA | 80 | ✓ emitted (30) | ⚠ skeleton |
| Verification | 6 | ✓ emitted | ✓ |
| **ScheduleS** (Salary) | 32 | ✗ ABSENT | ✗ salary head never emitted |
| **ScheduleCGFor23** | 325 | ✗ ABSENT | ✗ capital gains never emitted |
| **ScheduleOS** | 103 | ✗ ABSENT | ✗ other sources never emitted |
| **PARTA_OI** (Other Info) | 98 | ✗ ABSENT | ✗ 44AB/quantitative/other-info absent |
| **ScheduleVIA** (Deductions) | 66 | ✗ ABSENT | ✗ Chapter VI-A never emitted |
| ScheduleDPM | 76 | ✗ ABSENT | ✗ plant & machinery depreciation absent |
| ScheduleDOA | 66 | ✗ ABSENT | ✗ other-asset depreciation absent |
| ScheduleDEP | 13 | ✗ ABSENT | ✗ depreciation summary absent |
| TradingAccount | 38 | ✗ ABSENT | ✗ trading account absent |
| ScheduleCFL | 60 | ✗ ABSENT | ✗ loss carry-forward absent |
| ScheduleCYLA/BFLA detail | — | ⚠ | skeleton (above) |
| Schedule112A | 26 | ✗ ABSENT | ✗ |
| ScheduleEI | 15 | ✗ ABSENT | ✗ exempt income absent |
| ScheduleAMTC | 19 | ✗ ABSENT | ✗ AMT credit absent |
| ScheduleSI | 6 | ✗ ABSENT | ✗ special-income rates absent |
| ScheduleIT | 5 | ✗ ABSENT | ✗ challans absent |
| ScheduleTDS1 / TDS2 | 5 / 10 | ✗ ABSENT | ✗ TDS schedules absent |
| ScheduleUD (ITR3ScheduleUD) | 11 | ✗ ABSENT | ✗ unabsorbed depreciation absent |
| Schedule80_IA / 80_IB | 4 / 10 | ✗ ABSENT | ✗ |
| ScheduleFA / AL / GST / FSI / TR1 / HP | 10/12/1/1/4/2 | ✗ ABSENT | ✗ |

**Totals:** ✓/⚠ structurally emitted ≈ **12 schedules (~653 leaves)** — dominated by the well-bound BS/PL/BP block; real-value fillable ≈ **~200 (~12%)**; ✗ absent = **~24 schedules, ~1,013 leaves (61%)**.

## Ranked gap list
1. **ScheduleCGFor23 (325) + ScheduleOS (103) + ScheduleS (32) absent** — for a mixed-income ITR-3 filer (salary + business + CG), only the business side exports. A business-only proprietor is closest to fileable.
2. **PARTA_OI (98) absent** — Part-A Other Information (44AB flags, method of accounting, quantitative details) is mandatory and unsourced.
3. **ScheduleVIA (66) absent** — no Chapter VI-A deductions exported at all.
4. **Depreciation absent** — DPM (76) + DOA (66) + DEP (13) + UD (11) = 166 nodes; a books-maintaining business needs these.
5. **PartB_TTI zeroed** — surcharge/cess/rebate/234 all 0 (missing `__taxBreakup`).
6. **TradingAccount (38) absent**; **TDS/IT challans absent** (prefill/AIS would seed).

## Discrepancy note
The catalog documents ~450 fields across 5 screens (Salary, CG, OS, VIA drill-ins all present in the UI), but `buildItr3Json` references only the business/BS/PL/BP block + identity + summary. Large **model-present / emitter-absent** surface: the non-business heads are captured on screen and dropped at export.
