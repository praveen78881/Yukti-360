# ITR Module — Documentation Index (Neuron Map)

> A read-only map of CA_studio's Income-Tax section: every ITR type, its Info-Sheet particulars, drill-in Schedules, Computation Sheet, e-filing JSON, and validation rules — and how they all connect. **No code was changed to produce these docs.**

## How to read this folder

| File | What it covers |
|---|---|
| **[00-architecture.md](./00-architecture.md)** | The host shell, the entity→form router, the two assessment years, persistence (`entity_data`), prefill, AIS, and *where* JSON/computation/validation actually live. **Start here.** |
| **[itr-1.md](./itr-1.md)** | ITR-1 Sahaj — salary, 1 house property, other sources (income ≤ ₹50L). |
| **[itr-2.md](./itr-2.md)** | ITR-2 — capital gains, multiple properties, foreign assets (no business income). |
| **[itr-3.md](./itr-3.md)** | ITR-3 — business/profession with regular books (P&L, Balance Sheet, BP). |
| **[itr-4.md](./itr-4.md)** | ITR-4 Sugam — presumptive 44AD / 44ADA / 44AE. |
| **[itr-5.md](./itr-5.md)** | ITR-5 — firms, LLPs, AOP/BOI, co-operatives. |
| **[itr-6.md](./itr-6.md)** | ITR-6 — companies. **⚠ Pending / incomplete for A.Y. 2026-27 — this file is the gap list.** |
| **[itr-7.md](./itr-7.md)** | ITR-7 — trusts, societies, section-8, institutions. |
| **[mapping-info-json-computation.md](./mapping-info-json-computation.md)** | The cross-cutting neuron wiring: **Info-Sheet field → Computation line → ITD JSON key**, plus the **validation rulebook** across all forms. |

## The neuron, in one line

> **Info Sheet field id** ──(read by)──► **Computation Sheet** number ──(written by `toJSON()`)──► **ITD JSON key** ──(checked by `validateItr()`)──► **portal-valid e-file**.

Each `itr-N.md` documents that chain for its form. The per-form files follow one template:
1. **Applicability & files** — who files it, which HTML tool, which AYs.
2. **Info Sheet particulars** — every entry field, grouped by section (`field id → label`).
3. **Income & deduction entry** — the head-wise inputs.
4. **Drill-in Schedules** — each Schedule, its particulars, and whether rows are addable (**+ Add**).
5. **Computation Sheet** — the derived lines (heads → GTI → Ch VI-A → total income → tax → surcharge/cess/rebate → taxes paid → refund/payable).
6. **JSON mapping** — the emitted ITD JSON shape, `SchemaVer`, and representative field→key mappings.
7. **Validation rules** — the actual `validateItr` checks and messages.
8. **Add options & gaps** — repeatable sections and anything stubbed.

## Status snapshot (A.Y. 2026-27)

| Form | Shipped | Both AYs | Notes |
|---|---|---|---|
| ITR-1 | ✅ full | ✅ | |
| ITR-2 | ✅ full | ✅ | |
| ITR-3 | ✅ full | ✅ | |
| ITR-4 | ✅ full | ✅ | |
| ITR-5 | ✅ | 26-27 only | |
| **ITR-6** | ⚠ **pending** | 26-27 only | smallest file; see `itr-6.md` for the gap list |
| ITR-7 | ✅ | 26-27 only | |
