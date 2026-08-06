# ITR Schema Conformance — Master Report

**Question answered:** *Can CA_studio fill the official ITD ITR JSON well enough to file?*
**Date:** 2026-08-04 · **App commit:** `7fb4ba4` · **Scope:** read-only synthesis. No code changed.

**Inputs synthesised:**
- `conformance-ITR1.md` — full per-node fill matrix (authoritative).
- `schema-ITR2.md`, `schema-ITR3.md` — official schema leaf trees (from `openapi.json`).
- `self-shape-ITR4-7.md` — self-shape analysis (no official schema exists for these four).
- `docs/itr-structure/INDEX.md` + `COMPUTATION-COMMON.md` — structure catalog & shared engine facts.

> **Status update (coordinator).** Per-schedule conformance matrices now exist for **all of ITR-1/2/3**:
> `conformance-ITR1.md` (per-node), plus `conformance-ITR2.md` and `conformance-ITR3.md` — the latter two
> authored from the schema leaf-count tree (node walk of the OpenAPI) cross-checked against the emitters
> (`buildItr2Json` `itr2.html:2069`, `buildItr3Json` `itr3.html:2566`), whose emitted schedule shape was
> **verified live** via `itr-sim/probe-emit-shape.mjs` (msedge, zero page errors). Confirmed figures:
> **ITR-2 ≈ 22% fillable** (ScheduleCGFor23 319 + ScheduleOS 103 entirely absent), **ITR-3 ≈ 12% fillable**
> (business BS/PL/BP well-bound; Salary/CG/OS/VIA/Depreciation/PARTA_OI absent). These are schedule-level
> measurements; the authoritative per-leaf audit runs against the official ITD schema once supplied.

---

## 1. Executive summary

| Form | Official schema? | Schema leaves | Fillable | Verdict |
|---|---|--:|--:|---|
| **ITR-1** | ✅ yes | 165 | **56.4 %** (93 ✓; 76.4 % incl. partials) | **Closest to filing** — identity/income/tax-comp populated via `__taxBreakup`; blocked by wrong-key regime/section, zeroed std-deduction & absent 80G/80D detail. |
| **ITR-2** | ✅ yes | 809 | **≈20–28 %** (8 of 22 top-level schedules emitted) | **Not fileable.** Skeleton only: the two largest detail schedules — **ScheduleCGFor23 (321 leaves)** and **ScheduleOS (103)** — plus VIA/AL/112A/CFL/EI/FA/HP/IT/SI/TR1 are **entirely absent**; PartB_TTI surcharge/cess/rebate all hard-`0`. |
| **ITR-3** | ✅ yes | 1690 | **≈10–15 %** (≈12 of 37 top-level schedules emitted) | **Least complete of the three.** Depreciation (DEP/DPM/DOA), PARTA_OI, TradingAccount, ScheduleCGFor23, ScheduleOS, VIA-detail all absent; PARTA_BS/PL collapsed; PartB_TTI zeroed. |
| **ITR-4** | ❌ none | — | self-shape only | Presumptive business income exported **always 0** (`it_bp_income` span never written); Schedule FA never exported. |
| **ITR-5** | ❌ none | — | self-shape only | Books-maintained filers: **PARTA_PL never assigned**, PARTA_BS all-zero skeleton. |
| **ITR-6** | ❌ none | — | self-shape only | Least-complete emitter: BS = 2 scalars, **no PARTA_PL node at all**, no dep/CYLA/BFLA/CFL. |
| **ITR-7** | ❌ none | — | self-shape only | **Entire tax side hard-coded 0** — compute iframe is inert at runtime (`itr7.html:10619`). |

**ITR-4/5/6/7 carry no ITD request-body schema in either OpenAPI bundle** — conformance is *unprovable*, only describable. Closing them requires the official ITD AY 2026-27 JSON schema per form.

**Bottom line:** only **ITR-1** is near filing-ready, and even it fails portal re-computation on a few high-impact nodes. ITR-2/3 are structurally skeletal. ITR-4/7 emit self-contradicting JSON (tax computed on income the JSON reports as 0).

---

## 2. Consolidated ranked GAP LIST (ITR-1/2/3)

Grouped by theme; **most consequential first** within each. "wrong-key" = data exists but is emitted under a non-schema key so the schema node stays empty.

### A. Identity & filing status (affects all three)
| # | Gap | Forms | Nature |
|--:|---|---|---|
| A1 | **NewTaxRegime** emitted as non-schema `OptOutNewTaxRegime` | 1,2,3 | wrong-key — regime flag never lands in schema node; risk of mis-slab/reject |
| A2 | **ReturnFileSec hard-coded `11`** (ignores 139(1)/(4)/(5)/(9)/142(1)) | 1,2,3 | wrong-value — belated/revised/defective all filed as 139(1) |
| A3 | FilingStatus flags (`SeventhProvisio139`, DepAmt…/IncrExp… high-value spend) | 1 | missing particulars |
| A4 | Revised-return `OrigRetFiledDate` / `ReceiptNo` unsourced | 1 | missing |

### B. Tax computation / PartB-TTI (the biggest cross-form defect)
| # | Gap | Forms | Nature |
|--:|---|---|---|
| B1 | **No `__taxBreakup` export** → Surcharge, HealthEduCess, EducationCess, Rebate87A, TotalSurcharge, all 234A/B/C interest & LateFee234F export **`0`** | **2, 3** | zeroed — confirmed literal `0`s in `itr2.html:2153-2163`, `itr3.html` PartB_TTI |
| B2 | AMT / Deemed-income 115JC block, CreditUS115JD all `0` | 2,3 | zeroed |
| B3 | (ITR-1 has `__taxBreakup`, so B1/B2 are ✓ there — **except** the AY-2025-26 file `itr1-2025-26.html` lacks it → 13 tax-comp nodes zero) | 1 (2025-26) | AY-diff |

### C. Per-schedule income detail (the mass of missing leaves)
| # | Gap | Forms | Nature |
|--:|---|---|---|
| C1 | **ScheduleCGFor23 (capital-gains detail, 321 leaves)** not emitted | 2,3 | absent — CG only survives as PartB-TI subtotals |
| C2 | **ScheduleOS (other-sources detail, 103 leaves)** not emitted | 2,3 | absent |
| C3 | **Depreciation ScheduleDEP/DPM/DOA + PARTA_OI + TradingAccount + PARTA_PL/BS detail** not emitted | 3 | absent — Schedule-BP tie-outs will fail |
| C4 | ScheduleAL, Schedule112A, ScheduleEI, ScheduleFA, ScheduleHP-detail, ScheduleSI, ScheduleTR1, ScheduleFSI, ScheduleCFL, ScheduleAMTC | 2,3 | absent |
| C5 | `TotalIncomeOfHP` emitted as non-schema `TotalIncomeChargeableUnHP` | 1 | wrong-key |
| C6 | Standard deduction (`DeductionUs16/16ia/StandardDeduction`) hard-`0` though `it_sal_std` computed | 1 | zeroed — breaks GTI re-computation |
| C7 | Salary breakup: `AllwncExemptUs10` array, perquisites/profit-in-lieu itemisation, ProfessionalTaxUs16iii | 1 | missing/folded |

### D. Deductions (Chapter VI-A)
| # | Gap | Forms | Nature |
|--:|---|---|---|
| D1 | **ScheduleVIA detail (46 leaves)** not emitted as top-level; only a lump total inside PartB-TI | 2,3 | absent |
| D2 | 80EE/80EEA/80EEB/80GGA/80GGC hard-coded `0` (10 nodes) | 1 | zeroed |
| D3 | **Schedule80G (20 leaves)** — no donee/100%-vs-50%/cash-vs-other/eligible-amount capture | 1 | unsourceable |
| D4 | Schedule80D breakup (7 leaves) omitted despite full drill-in data | 1 | sourceable-but-unemitted |

### E. Taxes paid / TDS / TCS
| # | Gap | Forms | Nature |
|--:|---|---|---|
| E1 | TDS schedules built **only if AIS imported**; `Total*` leaves omitted; TCS = `0` | 1,2,3 | AIS-gated / partial |
| E2 | ScheduleTDS1/TDS2, ScheduleIT (advance/SAT challans), ScheduleTCS, ScheduleTDS3 | 1,2,3 | absent/zeroed |

### F. Bank / refund
| # | Gap | Forms | Nature |
|--:|---|---|---|
| F1 | `AddtnlBankDetails[].UseForRefund` omitted though `bank_{i}_refund` checkbox exists | 1 | sourceable-but-unemitted |

---

## 3. Cross-cutting findings

1. **The `__taxBreakup` gap is systemic.** Only ITR-1 (AY 2026-27) exports it. ITR-2 and ITR-3 have **zero** references (verified: `grep __taxBreakup itr2.html/itr3.html` = 0), so every surcharge/cess/rebate/234-interest node in their PartB_TTI ships as a literal `0`. This single fix pattern is the highest-leverage change for both forms.
2. **Wrong-key / phantom-cell family.** Regime (`OptOutNewTaxRegime` vs `NewTaxRegime`) and HP income (`TotalIncomeChargeableUnHP` vs `TotalIncomeOfHP`) are emitted under keys the schema does not define — data is computed but invisible to the validator. ITR-1's `chapVIA()`/ITR-4's `chapVIA4()` read per-section cells that do not exist → Chapter VI-A exports zeros.
3. **Emit-shape is a collapsed subset of the schema.** ITR-2 emits 8 of 22 top-level schedules; ITR-3 ≈12 of 37. The absent ones are precisely the high-cardinality detail schedules (CG 321, OS 103, VIA 46, depreciation) — so raw fillable-% understates the problem: the *hard* schedules are the missing ones.
4. **Self-contradicting exports (ITR-4/7).** ITR-4 computes tax on presumptive income but exports `IncomeFromBusinessProf = 0` (`it_bp_income` span never written). **ITR-7's compute iframe is inert** (unterminated `<\/script>` at `itr7.html:10619` → `computeAll` undefined) so `buildITR7Json` hard-codes all of PartB-TTI/TI to 0 — every trust return declares zero tax and zero tax paid.
5. **Statutory books-of-account forms are skeletons.** ITR-5 never assigns PARTA_PL; ITR-6 has no PARTA_PL node at all and reduces the balance sheet to two scalars — both would fail BS-balance / Schedule-BP tie-out validation.
6. **AY-2025-26 regressions.** Several 2025-26 files retain 2026-27 literals and (ITR-1) drop `__taxBreakup`.

---

## 4. Newly UNBLOCKED — client-management / prefill / registration endpoints

The attached `openapi.json` exposes the ERI endpoints needed to **onboard a taxpayer as a client and pull prefill data** — previously the missing link before any filing flow. All present in `openapi.json` (paths under `/it/compliance/eri/tax-payers/…`):

| Purpose | Method + path |
|---|---|
| Register client (ERI) | `POST …/registration/otp` |
| Verify registration OTP | `POST …/registration/otp/verify` |
| Add client | `POST …/{tax_payer_id}/client/otp` |
| Validate / activate client | `POST …/{tax_payer_id}/client/otp/verify` |
| Prefill JSON — generate OTP | `POST …/{tax_payer_id}/prefill-json/otp` |
| Prefill JSON — verify OTP | `POST …/{tax_payer_id}/prefill-json/otp/verify` |
| Prefill JSON — fetch | `GET /it/compliance/portal/tax-payer/prefilled-json` |

**Why it matters:** the register → add-client → validate → prefill-OTP → verify → fetch chain lets us seed PersonalInfo/FilingStatus/TDS/challan/bank data straight from the portal, directly closing many Section-A/E/F gaps that are currently "unsourceable" in the emitters. Also present: `POST …/itrs/validate` (ITR-1/2), `POST …/itrs/submit` (ITR-3) — the filing rails themselves.

---

## 5. Recommended sequence to filing-capacity (plan only — do NOT implement)

1. **Wire the ERI client/prefill chain (Section 4).** Add-client + prefill-JSON fetch feeds identity, filing-status, TDS, challans and bank rows — unblocks GAP themes A, E, F across all forms with one integration.
2. **Fix the wrong-key family (A1, A2, C5).** Rename to `NewTaxRegime`, honour `f_section` for `ReturnFileSec`, emit `TotalIncomeOfHP`. Small, high-impact, all three forms.
3. **Export `__taxBreakup` for ITR-2 & ITR-3 (B1/B2)** and back-port to `itr1-2025-26.html`. Turns ~15 zeroed tax nodes per form into real values.
4. **Un-zero ITR-1 computed values (C6, D2, D4, F1):** std deduction, 80EE-family, 80D breakup, `UseForRefund` — data already exists in the DOM.
5. **Build the missing detail schedules** in dependency order: ScheduleVIA (D1) → ScheduleOS (C2) → ScheduleCGFor23 (C1) → ITR-3 depreciation/PARTA_OI/PL/BS/TradingAccount (C3) → remaining C4 schedules → Schedule80G capture (D3).
6. **Repair the self-contradicting emitters:** write `it_bp_income` (ITR-4); fix the inert compute iframe so `computeAll` runs (ITR-7).
7. **Obtain the official ITD AY 2026-27 JSON schema for ITR-4/5/6/7**, then run the same conformance audit before trusting any statutory-form export.
8. **Validate end-to-end** via `POST …/itrs/validate` per form before enabling `submit`.

---

*Reports only. No code was modified.*
