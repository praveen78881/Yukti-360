# ITR Full-Return Simulation — Consolidated Report (A.Y. 2026-27 + 2025-26)

> **Read-only.** No app code was changed. The only new files are the `itr-sim/` Playwright harness (authorized) and this report. Findings are static code-review + statutory hand-computation across all 7 ITR utilities, one maximal "everything return" persona each, plus a **proven live harness** (Edge) that types a persona and reads the app's own computed figures.

## Method & honest caveats
- **7 agents (Fable), one per ITR**, each: designed a maximal persona → hand-computed expected totals (AY-correct) → read `validateItrN` for planted-error coverage → code-reviewed the JS tax engine → reverse-swept `buildItrNJson`.
- **Live harness proven** (`itr-sim/`, via system Edge — bundled Chromium is spawn-blocked here): loads a form, types into its iframe calculator, reads computed cells. Demonstrated on ITR-1 (family-pension ₹25k std-ded, Total Income, and 87A-driven ₹0 tax all read correctly). Full per-form auto-fill of every subform is a larger build; runtime "app value" beyond the demo is best confirmed by you pasting numbers or extending the harness.
- **Section D is partial by necessity:** the official ITD JSON templates were **not pasted**, so there is no certified path-diff (no 293/293-style score). Conformance below is a **reverse sweep** (what the builder emits vs what the return needs) + structural checks. "Node coverage %" is an estimate, not a certified figure.

---

## ROLL-UP

| ITR | Validation catch-rate | Computation deltas (app ≠ statute) | JSON node coverage (est.) | Filing-ready today |
|---|---|---|---|---|
| ITR-1 | identity ~4/12; **substantive ~0** | new-regime PT+80D/DD/DDB/E leak → **−₹29,120**; 288B; AY-26 file runs 26-27 dates | ~40% + ghost VI-A IDs | **No** |
| ITR-2 | ~1/12 | **s.112 no lower-of → +₹2.55 L overtax**; new-regime leak; AY-26 CG-rate split missing | ~35% (no ScheduleCG/HP/AL/FA) | **No** |
| ITR-3 | 2/12 | **AMT trap → +₹1.46 L**; s.112; addl-dep in new regime; zero-skeleton BS/PL | ~30% | **No** |
| ITR-4 | ~4/11 | presumptive floors + turnover ceilings **unenforced**; 234C proviso; **ghost VI-A IDs**; 288B | ~35% (no presumptive detail) | **No** |
| ITR-5 | identity ~4/10; substantive ~0 | 115BBE double-surcharge; AMT adds back 80G; **₹20 L AMT floor wrongly applied to firms**; s.112; no 115BAD/BAE | curated subset (headline totals only) | **No** |
| ITR-6 | ~7/14 (best) | **foreign-co 25/30% not 35%**; MAT-credit doesn't lapse under 115BAA; 234C; 288B | **~12 of ~66 nodes (≈18%)** | **No (pending build)** |
| ITR-7 | identity ~9/16 (best) | **87A wrongly given to trust**; anonymous donations **double-taxed**; 15% base wrong | tax block emitted as **0** | **No** |

**Three portfolio-level truths:**
1. **Validation:** identity/format checks (PAN, name, address, verifier, bank/IFSC) are largely present; **substantive tax-logic & eligibility checks are almost entirely absent** across all 7 (presumptive floors/ceilings, negatives, TDS>income, date-order, 40(b), 85%-application, regime-locked deductions, AL/FA-required — mostly ✗).
2. **Computation:** the on-screen engines are *deep and mostly correct for old-regime AY 2026-27*, but carry **~14 distinct bug classes**, several universal (s.112 land, new-regime deduction leaks, 288B/Rule-119A rounding, 234C safe-harbours, and the AY 2025-26 files being label-clones on 2026-27 law).
3. **JSON:** **0 of 7 forms produce a filing-complete JSON.** Every builder hard-zeroes surcharge/cess/rebate/234-interest, drops most schedules, and (ITR-1/4) reads non-existent element IDs → guaranteed portal sum-mismatch; ITR-7 exports zero tax; ITR-6 emits ~18% of the schema.

---

## BUG REGISTER (fresh — no prior Phase-1 register existed; IDs ITR-B###)
Severity: **BLK** = return rejected or materially wrong tax · **HIGH** = wrong figure/large gap · **MED** = validation/robustness gap.

### Computation — universal / multi-form
| ID | Sev | Form(s) | Finding | Evidence |
|---|---|---|---|---|
| ITR-B001 | BLK | 2,3,5,(6) | **s.112 land/building: no "lower of 12.5% unindexed vs 20% indexed" election** — code always taxes unindexed `gainB` at 12.5% (`const cg = gainB`). Overtax ~₹2.55 L (ITR-2), ~₹31k (ITR-3). | itr2 `8039/8822`; itr3 `8530/8463` |
| ITR-B002 | BLK | 1,2,3 | **New-regime deduction leaks** — 80D/80DD/80DDB/80E summed and professional tax deducted with no `isNew` gate; under-assesses (ITR-1 persona −₹29,120, flips payable→₹0). | itr1 `12201-12204,5768`; itr2 `12408-12416,5980`; itr3 `6472,11460` |
| ITR-B003 | BLK | 3,(5) | **AMT trap** — AMT applied whenever old-regime ATI > ₹20 L, ignoring the precondition that Part-C/10AA/35AD deductions be claimed; overstates ITR-3 persona +₹1.46 L and fabricates AMT credit. | itr3 `12365-12463` |
| ITR-B004 | HIGH | all | **288B not applied** (final tax/refund never rounded to ₹10); **Rule 119A ₹100 rounding missing** on all 234 interest bases. | every engine |
| ITR-B005 | BLK | 1,2,3,4 | **AY 2025-26 files are label-clones on A.Y. 2026-27 law** — 234A/B/C dates, `ageFromDOB` base year, due dates all 2026-27; and CG rate-split for pre-23/07/2024 (10%/15%) is absent (uses 12.5%/20%). | itr1 `11488-11500,5331`; itr2 `7973,8797,11700`; itr3 (masked-diff identical engine) |
| ITR-B006 | HIGH | all | **234C missing 12%/36% Q1-Q2 safe-harbours, the 44AD/ADA single-instalment proviso, and the back-ended CG/winnings accrual carve-out**; also no ₹10,000 s.208 de-minimis for 234B/C. | itr4 `11444-11470`; itr2 `11706`; itr3 `12209` |

### Computation — form-specific
| ID | Sev | Form | Finding | Evidence |
|---|---|---|---|---|
| ITR-B007 | BLK | 6 | **Domestic-company rate ok, but foreign company taxed 25/30% not 35%** (post Finance (No.2) Act 2024). | itr6 `2378-2379` |
| ITR-B008 | HIGH | 6 | **MAT credit (115JAA) does not lapse when 115BAA is opted** — cap becomes full net tax. | itr6 `2415` |
| ITR-B009 | HIGH | 5 | **115BBE double-surcharge** (12% general surcharge computed on tax that already includes the 60% BBE tax, then +25% BBE surcharge). | itr5 `2171-2173` |
| ITR-B010 | HIGH | 5 | **AMT ATI over-adds 80G/80GGA/80GGC**; and the **₹20 L AMT threshold (individual-only carve-out) is wrongly applied to a firm/LLP**. | itr5 `2182,2184` |
| ITR-B011 | BLK | 7 | **Anonymous donations double-taxed** (sit inside `agg` and slab-taxed, plus the 115BBC 30%); **15% accumulation base wrong**; **s.87A rebate wrongly granted to a trust (AOP)**. | itr7 `10639-10646,3566,10554` |
| ITR-B012 | HIGH | 3 | **Additional depreciation 32(1)(iia) allowed in the new regime** (regime-blind); understates BP. **Sec-50 STCG on extinguished block computed then discarded.** | itr3 `8326-8329,8295-8324` |
| ITR-B013 | MED | 1,2,3 | **Surcharge marginal-relief anchor ignores special-rate composition**; dividend surcharge not capped at 15% (ITR-2); old-regime 87A wrongly denied against 111A/112 (only 112A is barred). | itr2 `8742-8756,12435`; itr1/3 analogous |
| ITR-B014 | MED | 4 | **44AE:** no part-month, no 12-month cap, no 10-vehicle-fleet cap, no "higher actual" per-vehicle field. | itr4 `6179-6191` |

### Validation gaps (planted-error sweep — ✗ = no rule exists)
| ID | Sev | Form(s) | Missing rule |
|---|---|---|---|
| ITR-B015 | BLK | 4 | **Presumptive turnover ceilings (₹2/3 cr, ₹75 L) NOT enforced** and **profit floors (8%/6%/50%) NOT enforced** — UI text only; export proceeds. |
| ITR-B016 | HIGH | all | **Future / impossible DOB not caught** (format-only warning; negative age → wrong slab). |
| ITR-B017 | HIGH | all | **Negatives accepted** where impossible (sale value, qty, TDS, premium) — silent clamp/mutation at export. |
| ITR-B018 | HIGH | all | **TDS claimed > income never checked.** |
| ITR-B019 | HIGH | 2,3 | **CG date-of-transfer before date-of-acquisition never validated** (dates stored, never compared). |
| ITR-B020 | MED | all | **80C > ₹1.5 L / 80D above caps silently clamped, never surfaced** — user not told the excess was discarded. |
| ITR-B021 | HIGH | 1,2,3 | **Regime-locked deductions entered under the new regime raise no error** (silently vanish). |
| ITR-B022 | MED | 5,6,7 | **B/S not tallying does not block** (rail colour / warning only). |
| ITR-B023 | HIGH | 7 | **85%-application shortfall and 115TD math never validated** (and 115TD tax never computed). |
| ITR-B024 | MED | 1,2,3 | **ITR eligibility not enforced** — >1 house property (ITR-1), winnings in ITR-1, Sch AL required when TI > ₹50 L, FA presence — all unchecked. |
| ITR-B025 | MED | 5,6 | **s.40(b) breach / turnover-rate flag / concessional-regime (115BAD/BAE) — no rules** (ITR-5 has no concessional regime at all). |

### JSON conformance (reverse sweep — no official template provided)
| ID | Sev | Form(s) | Finding |
|---|---|---|---|
| ITR-B026 | BLK | all | **Surcharge / cess / rebate 87A / 234A-B-C / 234F hard-zeroed in JSON** while the total is lumped into one field → internally inconsistent, understates the decomposition the schema expects. |
| ITR-B027 | BLK | 1,4 | **`chapVIA()` reads ~10-11 element IDs that don't exist** (`it_80_c/ccc/ccd1/...`) → all VI-A sections export 0 beside a non-zero `TotalChapVIADeductions` → **guaranteed portal sum-mismatch** for any old-regime return. |
| ITR-B028 | BLK | 3,5 | **Zero-skeleton emission** — PARTA_BS, PARTA_PL, ScheduleBP shipped as schema-shaped zeros with only headline totals overlaid; a books/audit return exports as a "no-books" case; B/S mismatch invisible (always balances at 0). |
| ITR-B029 | BLK | 7 | **Entire PartB_TTI tax block + TaxPaid + CapGain/BP/OS exported as 0** — an ITR-7 carries **zero tax**; `TotalTI` double-counts anonymous donations. |
| ITR-B030 | BLK | 6 | **Exporter emits ~12 shallow nodes vs the ~66-node schema** (no PARTA_PL, no ScheduleIT/TDS/TCS/MAT/CG-detail/VIA/FA/AL/SH…); likely `PartB_TI` vs schema `PartB-TI` key-name break. This is the ITR-6 build gap. |
| ITR-B031 | HIGH | 1,3 | **Salary exported gross (before s.16)** → `IncomeFromSal` overstated; GTI≠TotalIncome inside the same JSON. |
| ITR-B032 | HIGH | 2,3 | **Schedule FA / AL never exported and `AssetOutIndiaFlag` hard-coded 'N'** even when FA rows are filled → Black-Money-Act-grade omission. |
| ITR-B033 | HIGH | all | **TDS/advance-tax exported only from AIS import**; manually keyed TDS/challans dropped; prepaid split heuristic understates TDS by the 234-interest amount. |
| ITR-B034 | MED | all | **CreationInfo software creds are placeholders** (`SW10000000`/`SW20000000`, `Digest:'-'`); `ReturnFileSec`/`ItrFilingDueDate` hard-coded, ignore the UI section. |

**~34 findings: 12 BLK · 13 HIGH · 9 MED.**

---

## Per-ITR detail (persona → cross-check → validation → JSON)

### ITR-1 (SIM-ITR1-2627 — salary ₹12.08 L + SOP HP + interest/dividend + full 80C/80D)
- **Cross-check:** old-regime engine matches statute (TI ₹6,84,400, tax ₹51,355 vs ₹51,360 — only 288B). **New-regime engine WRONG:** allows PT + 80D/DD/DDB/E → TI ₹11,50,600 not ₹12,28,000; 87A then wipes tax to ₹0 (refund ₹1,01,200) vs statutory ₹29,120 payable → **−₹29,120 under-assessment.**
- **Validation:** 3 real gates (PAN, TI>50L, 112A>1.25L). Missed: DOB, 80C/80D caps, negatives, TDS>income, regime-locked, >1 HP, winnings.
- **JSON:** ghost VI-A IDs (B027); salary gross (B031); tax fields zeroed (B026); TDS only from AIS.

### ITR-2 (SIM-ITR2-2627 — salary ₹1.2 cr + 2 HP incl let-out loss + STCG/LTCG-112A/LTCG-112 land + BF losses + AL + FA/DTAA)
- **Cross-check:** heads/slab/87A/111A/112A correct. **s.112 land: taxes ₹42 L unindexed @12.5% = ₹5.25 L instead of min(5.25 L, 20%×indexed ₹15.58 L = ₹3.12 L) → +₹2.13 L (+SC/cess ≈ +₹2.55 L).** No CG quarter capture at all.
- **Validation:** 1 real gate (PAN). CG date-order, AL-required, negatives, regime-locked — all missed.
- **JSON:** no ScheduleCG/HP/AL/FA; `AssetOutIndiaFlag:'N'` with FA filled (B032); CYLA/BFLA cells zeroed; VDA folded into STCG.

### ITR-3 (SIM-ITR3-2627 — ITR-2 stack + proprietary P&L/BS + depreciation + Sch BP add-backs + partner IF)
- **Cross-check:** BP set-off machinery sound. **AMT trap** (B003) inflates old-regime liability +₹1.46 L; s.112 land +₹31k; additional depreciation allowed in new regime.
- **Validation:** 2/12; P&L/BS mismatch not blocked; audit flag advisory only.
- **JSON:** zero-skeleton BS/PL/BP (B028); no ScheduleDPM/DOA/DEP/DCG, IF, AL, FA, AMT; salary gross; audit `'N'` hard-coded.

### ITR-4 (SIM-ITR4-2627 — 44AD 6%+8% mix + 44ADA + 44AE + GST + salary + HP + OS)
- **Cross-check:** presumptive % and 44AE deemed profit correct; slabs/87A/cess correct. **234C ignores the presumptive single-instalment proviso** (overcharges every presumptive user).
- **Validation:** 4 gates (PAN, TI>50L, 112A, non-presumptive). **Presumptive floors & turnover ceilings NOT enforced** (B015); Sch FA/directorship data can be entered though it disqualifies ITR-4.
- **JSON:** no presumptive detail (per-vehicle/per-business), no financial particulars; **ghost VI-A IDs** (B027); tax fields zeroed.

### ITR-5 (SIM-ITR5-2627 — firm/LLP: partners, B/S, Mfg/Trading/P&L, 40(b), CG, AMT)
- **Cross-check:** flat 30%, 40(b) ceiling (90%/60% on ₹6 L), cess correct. **115BBE double-surcharge** (B009); **AMT adds back 80G and applies the ₹20 L individual threshold to a firm** (B010); s.112 land.
- **Validation:** identity gates present; turnover ceiling (warn only), 40(b) breach, BS-tally, negatives, TDS>income, concessional regime — all missed; **no 115BAD/BAE at all.**
- **JSON:** curated subset — SKEL zero-leaves + headline totals; PARTA_PL never written; per-transaction CG/OS/VIA/TDS/FA/partners dropped; SEC_CODE incomplete; **no persistence** (state lost on reload).

### ITR-6 (SIM-ITR6-2627 — company: BS, Mfg/Trading/P&L, BP, MAT 115JB, schedules) — PENDING
- **Cross-check:** persona computes to the rupee (25% + 7% surcharge + cess; MAT 15%; 115JAA set-off) **except** foreign-co 35% (B007), 115BAA MAT-credit lapse (B008), 234C auto (manual only), 288B.
- **Validation:** best of the set (26 field rules + BS-tally); still misses negatives, MAT-inverse, most VI-A-regime, CIN/DIN/date formats.
- **JSON (the build gap):** ~12 shallow nodes vs the backup's **67 per-schedule emitters / ~66 schema nodes**; no PARTA_PL, ScheduleIT/TDS/TCS, MAT/MATC full, CG-detail, VIA, SI, EI, CYLA/BFLA, FA, AL, SH; `PartB_TI` key-name risk. Port the A.Y. 2025-26 backup forward + re-base to 2026-27.

### ITR-7 (SIM-ITR7-2627 — charitable trust: VC, AI, application A/B/C/D, 11(2) accumulation, 115TD, 10B/10BB, 115BBI/115BBC)
- **Cross-check:** AOP slab + 115BBI/115BBC 30% structurally right, **but** 87A wrongly granted (B011), anonymous donations double-taxed, 15% base wrong; 115TD tax never computed.
- **Validation:** strongest identity coverage; **85%-application and 115TD math unvalidated.**
- **JSON:** **entire tax block = 0** (B029); Schedule I/J/D/DA/Corpus/PTI/FA/115TD/LA and 10B/10BB dropped; `TotalTI` double-counts anonymous donations.

---

## What this means for the CS-firm / ITR filing goal
- The tools are excellent **preparation & computation cockpits**, but **none is portal-filing-ready today** — every form's exported JSON omits the tax decomposition and most schedules, and several have computation bugs that misstate liability (over or under).
- **Highest-leverage fixes (owner to direct):** (1) write the computed surcharge/cess/rebate/relief/234 back into the JSON tax block + fix the ghost VI-A IDs [B026/B027] — these break *every* return; (2) serialize the captured schedules (B028/B029/B030); (3) the s.112 land election [B001] and new-regime leaks [B002] and AMT trap [B003]; (4) re-base the AY 2025-26 files [B005]; (5) ITR-6 schedule port [B030]; (6) add the substantive validation layer [B015-B025].
- **For a company-heavy CS practice, ITR-6 (B030) + the universal JSON tax-block fix (B026) are the gating items.**

*Fixes and the field-level JSON conformance map (needs the official ITD templates) await your direction — no code was changed.*
