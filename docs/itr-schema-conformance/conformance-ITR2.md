# ITR-2 — SCHEMA CONFORMANCE / FILL-CAPACITY

**Schema:** `openapi.json` (Sandbox mirror, ITR-2 = 22 schedules, **802 leaf nodes**) · **Our emitter:** `buildItr2Json` (public/tax-utilities/itr2.html:2069)
**Method:** schema leaf counts extracted from the OpenAPI request-body tree (node walk); emitter behaviour verified **live** via `itr-sim/probe-emit-shape.mjs` (msedge, zero page errors) + source grep of the builder assembly. Schedule-level granularity (interim; the per-leaf pass runs against the official ITD schema).
**Headline:** ~**22% fillable**. ITR-2 is the capital-gains form, yet **ScheduleCGFor23 (319) and ScheduleOS (103) — 53% of all nodes — are never emitted.**

## Capacity matrix (schedule × can our software fill it)

| Schedule | Schema leaves | Emitter | Fill quality |
|---|--:|:--|:--|
| CreationInfo | 6 | ✓ emitted (6) | ⚠ SW creds placeholder `SW20000000`, Digest `-` |
| Form_ITR2 | 5 | ✓ emitted (5) | ✓ constants (SchemaVer/AY/FormName) |
| PersonalInfo → PartA_GEN1 | 32 | ✓ emitted (27) | ⚠ regime under wrong key `OptOutNewTaxRegime`; `ReturnFileSec` hard-coded 11 (same as ITR-1) |
| PartB-TI | 33 | ✓ emitted (30) | ⚠ CG/OS head totals feed from absent schedules → 0 |
| PartB_TTI (incl. TaxPaid, Refund, ComputationOfTaxLiability) | 49 | ✓ emitted (35) | ✗ **surcharge/cess/rebate/234 hard-zeroed — no `__taxBreakup` export** (the ITR-1 fix not ported); TaxPaid/Refund data-conditional |
| ScheduleCYLA | 56 | ✓ emitted (18) | ⚠ skeleton — only current-year set-off heads populated |
| ScheduleBFLA | 39 | ✓ emitted (22) | ⚠ skeleton — brought-forward figures 0 |
| ScheduleVIA | 46 | ⚠ referenced (data-gated) | ⚠ Chapter VI-A lump-sum only; no per-section split (80C/80D/80G detail) |
| Verification | 6 | ✓ emitted (6) | ✓ |
| **ScheduleCGFor23** | **319** | **✗ ABSENT** | **✗ not referenced in builder — no capital-gains schedule emitted at all** |
| **ScheduleOS** | **103** | **✗ ABSENT** | **✗ no other-sources schedule emitted** |
| Schedule112A | 26 | ✗ ABSENT | ✗ scrip-wise LTCG grid never exported |
| ScheduleSI | 6 | ✗ ABSENT | ✗ special-income rate table absent |
| ScheduleCFL | 16 | ✗ ABSENT | ✗ loss carry-forward absent |
| ScheduleAMTC | 19 | ✗ ABSENT | ✗ AMT credit absent |
| ScheduleEI | 9 | ✗ ABSENT | ✗ exempt income absent |
| ScheduleIT | 5 | ✗ ABSENT | ✗ self-assessment/advance-tax challans absent |
| ScheduleFA | 10 | ✗ ABSENT | ✗ foreign assets absent (Black-Money-Act exposure) |
| ScheduleAL | 10 | ✗ ABSENT | ✗ assets & liabilities absent |
| ScheduleTR1 | 4 | ✗ ABSENT | ✗ tax-relief (DTAA) absent |
| ScheduleFSI | 1 | ✗ ABSENT | ✗ |
| ScheduleHP | 2 | ✗ ABSENT | ✗ house-property head absent |

**Totals:** ✓/⚠ structurally emitted ≈ **9 schedules (~272 leaves)**, of which real-value fillable ≈ **~180 (~22%)**; ✗ absent = **13 schedules, ~530 leaves (66%)**.

## Ranked gap list
1. **ScheduleCGFor23 (319) + Schedule112A (26) entirely absent** — ITR-2's core purpose (capital gains) cannot be filed. The UI/calc *has* CG data (catalog shows CG drill-ins); the emitter simply never writes the schedule.
2. **ScheduleOS (103) absent** — interest/dividend/other-sources not exported.
3. **PartB_TTI zeroed** — surcharge/cess/rebate-87A/234 all 0 (missing `__taxBreakup`; port the ITR-1 fix).
4. **ScheduleVIA** partial — no per-section deduction detail → portal sum-mismatch.
5. **ScheduleIT/TDS absent** — taxes-paid not sourced from the return (prefill/AIS would seed these).
6. Identity: regime wrong-key + `ReturnFileSec` hard-coded 11 (shared with ITR-1).

## Discrepancy note
The catalog documents rich CG/OS/112A drill-ins in the ITR-2 UI (≈253 fields), but `buildItr2Json` does not reference those schedules — a **model-present / emitter-absent** gap: the data is captured on screen but dropped at export.
