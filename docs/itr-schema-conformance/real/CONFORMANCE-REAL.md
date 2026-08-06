# ITR Schema Conformance — MASTER (vs REAL ITD JSON-Schemas)

**Question:** Can CA_studio's exported ITR JSON fill the *official* ITD JSON-Schema well enough to file?
**Date:** 2026-08-04 · **Scope:** read-only synthesis of `conformance-ITR1..7-REAL.md`. No code changed.
**Method:** deterministic artifacts in `real/` — `trees/` (resolved schema leaves, R=required), `emitted/` (paths our emitters output), `diff/` (per-leaf classification). Metrics: **PRESENCE** = leaf emitted at all (OK or ZERO) = capacity. **ZERO** = emitted-but-empty, *not* a defect. **MISS** = never emitted = true gap. **reqMISS** = required leaf missing = filing blocker. **Headline = (required − reqMISS) / required.**

> This report **supersedes** the earlier Sandbox-mirror interim `../CONFORMANCE-REPORT.md` (see §2). The real schemas are far larger, mark REQUIRED explicitly, and correct several interim false alarms.

---

## 1. Master table — form × AY vs REAL schema

| Form | AY | Schema leaves | Required | reqMISS | **% req present** | Emitter character | Verdict |
|---|---|---:|---:|---:|---:|---|---|
| **ITR-1** | 2026-27 | 448 | 352 | 251 | **28.7 %** (≈32 % post false-MISS) | identity + income/deduction roll-ups + tax ladder + tax-paid totals | Skeleton — closest, not fileable |
| **ITR-1** | 2025-26 | 454 | 365 | 266 | **27.1 %** (≈30 %) | same builder | Skeleton |
| **ITR-2** | 2026-27 | 1592 | 1182 | 1042 | **11.8 %** | thin summary (identity + PartB-TI/TTI + zero CYLA/BFLA) | Not viable |
| **ITR-2** | 2025-26 | 1832 | 1411 | 1254 | **11.1 %** | same | Not viable |
| **ITR-3** | 2026-27 | 2798 | 2034 | 1598 | **21.4 %** | business BS/PL/BP + tax-comp zero-skeleton | Skeleton |
| **ITR-3** | 2025-26 | 3042 | 2269 | 1815 | **20.0 %** | same | Skeleton |
| **ITR-4** | 2026-27 | 499 | 337 | 241 | **28.5 %** | computation/identity core (no ScheduleBP) | Skeleton — not viable for presumptive |
| **ITR-4** | 2025-26 | 509 | 354 | 261 | **26.3 %** | same | Skeleton |
| **ITR-5** | 2026-27 | 2566 | 1869 | 1442 | **22.8 %** | identity + zero-filled BS/PL/BP/PartB skeleton | Skeleton |
| **ITR-5** | 2025-26 *(proxy¹)* | 2790 | 2083 | 1658 | **20.4 %** | same | Skeleton |
| **ITR-6** | 2025-26 *(proxy¹)* | 3530 | 2691 | 2636 | **2.0 %** | thin projection — 116 flat rollups, 57 orphan-pathed | Not viable |
| **ITR-7** | 2026-27 | 1697 | 1255 | 1079 | **14.0 %** | thin donations + BS + verification | Not viable |
| **ITR-7** | 2025-26 *(proxy¹)* | 1917 | 1442 | 1266 | **12.2 %** | same | Not viable |

¹ **Proxy AY.** Only one file ships for ITR-5/6/7, all AY-2026-27 builds; the 2025-26 row scores that same 2026 emitter against the prior-year schema — structural indicator, not a filing verdict. ITR-6 has **no 2026-27 real-schema comparison yet** (only proxy-vs-2025), so its 2.0 % is a floor depressed by both thin-projection design and proxy-AY schedule drift — needs a true 2026-27 run for a graded number.

**Bottom line:** **no form is fileable against the real schema.** Every form emits identity + a tax-computation/roll-up core and drops essentially all itemized proof schedules. Headline order (best→worst): ITR-1 ≈ ITR-4 (~28 %) > ITR-5 (23 %) > ITR-3 (21 %) > ITR-7 (14 %) > ITR-2 (12 %) > ITR-6 (2 %). Higher % mostly tracks smaller schemas, not more capability — ITR-1/4's simple forms let the identity+computation core cover more of the denominator.

### False-MISS audit (exact-path diff spot-checks, per §4 of each report)

| Form | Clean false-MISS | Semantic/shape-delta (⚠) | Dominant pattern |
|---|---:|---|---|
| ITR-1 | 12/AY | 1 (LTCG112A wrong key `TotLTCG112A`) | probe-empty AddtnlBankDetails / TDS arrays |
| ITR-2 | 4/AY | — | AddtnlBankDetails (probe-empty) |
| ITR-3 | 4 | 1 (TDS mis-keyed to legacy top-level `TDSonSalaries`/`TDSonOthThanSals` vs `ScheduleTDS1/2`) | bank + TDS |
| ITR-4 | 8 | 1 (TDSonOthThanSals wrong node/fields) | bank + salary-TDS (AIS-conditional) |
| ITR-5 | 5–8 | 2 concepts (bank; 2025 CG rate-bucket names) | bank + AY rate buckets |
| ITR-6 | 8 | many (`PartB_TI`→`PartB-TI` node rename; `PARTA_BS`→`…For6FrmAY13`; CG parent flattening) | naming/nesting, not capability |
| ITR-7 | 7 | `PartB_TI2.*` collapsed into `PartB_TI`; ScheduleAI item rows | node-collapse |

Verified live this session: `itr1.html:1953` emits `OptOutNewTaxRegime` (**correct** real key), `itr2.html:2106/2165` emits `AddtnlBankDetails` from `data.bank` (probe-empty, not a gap), `itr3.html:2666-67` mis-keys TDS. Recurring universal false-MISS: **`AddtnlBankDetails[]` bank rows** (emitted by all forms, empty only because the probe fed no bank row) — reclassify ✗→◑ everywhere; its sibling `UseForRefund` is a *genuine* omission in all forms.

---

## 2. How this SUPERSEDES the Sandbox-mirror interim (`../CONFORMANCE-REPORT.md`)

The interim scored ITR-1/2/3 against **Sandbox-mirror OpenAPI leaf trees** (165 / 809 / 1690 leaves) that did **not mark REQUIRED** and covered only three forms; ITR-4/7 were called "self-contradicting" and ITR-4/5/6/7 "unprovable (no schema)."

| Dimension | Interim (Sandbox mirror) | This report (REAL ITD schema) |
|---|---|---|
| Coverage | ITR-1/2/3 only | **All 7 forms, both AYs** |
| Schema size (e.g. ITR-2) | 809 leaves | **1592** (real) — mirror was ~½ size |
| REQUIRED marked? | No | **Yes** — headline is now % of *required* present |
| ITR-4/5/6/7 | "no schema, unprovable" | **now measured** against real trees |

**Interim false alarms corrected:**
- **`OptOutNewTaxRegime` is NOT a bug** (interim gap A1 "wrong-key `OptOutNewTaxRegime` vs `NewTaxRegime`"). The real ITD schema's `FilingStatus` key **is** `OptOutNewTaxRegime` (`Y`/`N`); AY 2025-26 even adds a sibling `OptOutNewTaxRegime_Method`. Verified `itr1.html:1953`. **Correctly emitted; remove from the gap list.**
- **`__taxBreakup` "systemic zero" (interim B1) is overstated.** Against the real schema the tax-computation leaves (PartB_TTI ladder) are largely **PRESENT-as-ZERO** — capacity exists, the probe fed no figures. A handful of detail leaves (surcharge/cess/relief/`TaxDeferred17`) are genuine reqMISS in ITR-2/3, but this is a partial detail gap, not "every node ships literal 0."
- **`TotalIncomeChargeableUnHP` (interim C5 "wrong-key") is the correct ITR-1 real-schema leaf** for aggregate HP income — present-as-ZERO, not a phantom key. The real HP *gap* is the itemized `PropertyDetails[]` block, not this total.

Interim findings that **hold and are now sharper**: capital-gains detail absent (real: ScheduleCGFor23 = 258–441 req leaves, the single largest block), ScheduleOS absent, Chapter VI-A itemized schedules absent, TDS AIS-gated, ITR-6 thinnest.

---

## 3. Consolidated theme-grouped gap list (across all forms)

Legend: **[CBE]** captured-but-not-exported (UI holds it, emitter drops it → fastest win). **[ABS]** concept truly absent. **[KEY]** emitted under a non-schema path/name.

| Theme | Gap | Forms affected | Class |
|---|---|---|---|
| **Identity / GEN** | `AssesseeRep.*` (rep-assessee) hard-coded `Flg:'N'` despite UI drill-in | 1,2,3,4,5,7 | [CBE] |
| | Directorship `CompDirectorPrvYr[]`, unlisted-shares `HeldUnlistedEqShrPrYr[]`, `PartnerInFirm[]` — flags stay `'N'` | 2,3,5 | [CBE] |
| | `Address.Phone` (STDcode/PhoneNo), `AlternateAddress`, `clauseiv7provisio139i[]` | 1,2,3,4 | [CBE]/[ABS] |
| | Partner/Member roster `PartnerOrMemberInfo[]`; audit `AuditDetails[]` | 5 | [CBE] |
| | Registration/approval `RegApprUnderITADtls[]` (12A/12AB/10-23C), author/trustee/contributor rosters | 7 | [CBE] |
| | `PartB_TI`→`PartB-TI` node rename; `PARTA_BS`→`…For6FrmAY13` | 6 | [KEY] |
| **Tax comp (PartB-TTI)** | Surcharge/cess/relief/`TaxDeferred17`/89A, AMT 115JC/JD detail leaves | 2,3,5,6 | partial reqMISS |
| | `ForeignBankDetails[]` refund array; `AddtnlBankDetails[].UseForRefund` | 1,2,3,4,5,6,7 | [ABS] (sibling bank rows = false-MISS) |
| **Salary (S)** | ScheduleS per-head; `AllwncExemptUs10[]`, perquisites, ProfTax; ScheduleEA10_13A (HRA) | 1,2,3 | [CBE]/[ABS] |
| **House Property (HP)** | `PropertyDetails[]` / ScheduleHP (address, co-owners, tenant, Rentdetails, Section24B loans) | 1,2,3,4,5,6,7 | [CBE] |
| **Capital Gains (CG)** | ScheduleCGFor23 (**258–441 req** — largest block), Schedule112A/115AD scrip-wise | 2,3,5,6,7 | [CBE-partial]/[ABS] |
| **Other Sources (OS)** | ScheduleOS per-nature/DTAA/special-rate detail | 2,3,5,6,7 | [CBE-partial] |
| **Business/Prof (BP)** | ScheduleBP presumptive detail (44AD/ADA/AE, NatOfBus, GSTIN turnover) | 4 | [CBE] |
| | PARTA_OI (44AB disallowances 36/37/40/40A/43B), PARTA_QD, Trading/Mfg A/c | 3,5,6 | [CBE]/[ABS] |
| | Depreciation ScheduleDPM/DOA/DEP/DCG, ScheduleUD | 3,5,6 | [ABS] |
| | PARTA_BS / PARTA_PL full financials (emit zero-skeleton or 2 scalars) | 3,5,6 | [CBE] |
| **Deductions (VIA)** | ScheduleVIA + 80C/80D/80DD/80E/80EE/80EEA/80EEB/80G/80GGA/80GGC/80U itemized (80G alone 52–60 req) | 1,2,3,4,5 | [CBE for 80C/D]/[ABS for donee-level] |
| | Profit-linked 80-IA/IB/IC/IAC/P/RA/10AA | 3,5,6 | [ABS] |
| **Loss set-off** | ScheduleCFL (year-wise b/f), CYLA/BFLA matrices (emit zero-skeleton) | 2,3,5,6 | [ABS]/partial |
| **Taxes paid / TDS / TCS** | ScheduleTDS1/2/3 (mis-keyed in 3; AIS-gated in 1/2/4), ScheduleIT challans, ScheduleTCS | 1,2,3,4,5,6,7 | [KEY]/[CBE]/[ABS] |
| **FA / AL** | ScheduleFA (108–110 req) hard-coded `Flag:'N'`; ScheduleAL (16–121 req) | 2,3,5,6,7 | [CBE] |
| **Form-specific** | Trust: ScheduleA (application), ITRScheduleJ/I/D (corpus/accum/deemed), 115TD, PartB_TI2/TI3 | 7 | [CBE]/[ABS] |
| | Company: ScheduleSH (shareholding), MAT/MATC rows | 6 | [CBE]/[ABS] |
| **ITR-U (2025-26 only)** | PartA_139_8A + PartB-ATI (updated-return) | all | [ABS] — removed from 2026-27 schema |

---

## 4. "Captured-but-not-exported" master list — the FASTEST WINS

UI already holds the data; only the emitter (`buildItrNJson`/`buildJSON`/`buildITR`) needs to write it. No new input surface required.

| Rank | Gap | Forms | Fix shape |
|---:|---|---|---|
| 1 | **House-property `PropertyDetails[]`/ScheduleHP** — address, owner %, rent rows, municipal tax, per-loan Section 24(b) all captured; only aggregate emitted | 1,2,3,4,5,6,7 | serialize captured HP grid |
| 2 | **Capital-gains detail** — LTCG/STCG drill-ins + 112A scrip grid captured; only PartB-TI subtotal emitted | 2,3,5,6 | map drill-ins → ScheduleCGFor23/112A/115AD |
| 3 | **ScheduleBP presumptive** — nature-codes, 44AD/ADA/AE turnover, GSTIN turnover captured; collapsed to one aggregate | 4 | build ScheduleBP from `data.nature/gstr` |
| 4 | **ScheduleFA** — 9 foreign-asset tables captured; hard-coded `AssetOutIndiaFlag:'N'` | 2,3,5,6,7 | flip flag + emit rows |
| 5 | **ScheduleAL** — 8–10 asset/liability drills captured; nothing emitted | 2,3,6 | serialize AL drills |
| 6 | **PARTA_BS / PARTA_PL / Trading-Mfg** — full Schedule-III financials typed on B/S & P&L tabs; emit zero-skeleton (ITR-6: 2 scalars) | 3,5,6 | overlay captured cells onto JSON |
| 7 | **Partner/Member roster** `PartnerOrMemberInfo[]` — full grid captured; no mapping | 5 | map `sf-partners` grid |
| 8 | **Trust ScheduleA + ITRScheduleJ/I/D + 115TD** — application, corpus, accumulation, deemed, accreted-income screens fully built; only aggregate totals emitted | 7 | wire `sec-app`/`sf-corpus`/`sf-accum`/`sf-deemed`/`sec-115td` |
| 9 | **Rep-assessee / directorship / unlisted-shares / partner-in-firm** — drill-ins captured; flags frozen `'N'` | 1,2,3,4,5 | honour flags + emit blocks |
| 10 | **TDS mis-key** (ITR-3) — TDS captured & emitted, but at legacy `TDSonSalaries`/`TDSonOthThanSals` not `ScheduleTDS1/2` | 3,4 | rename node + child fields, add schedule totals |
| 11 | **`AddtnlBankDetails[].UseForRefund`** — `bank_i_refund` checkbox exists; omitted from `bankRows` map | 1,2,3,4,5,6,7 | add one field to the map |
| 12 | **80C/80D itemized** — insurer/policy/premium grid & 80CCH/80DD dependents captured; only section totals emitted | 1,2,3,4 | build Schedule80C/80D from drill-ins |
| 13 | **Node/name deltas (ITR-6)** — `PartB_TI`→`PartB-TI` reclassifies 5 required leaves for free; `TotalLiabilities`→`TotEquityAndLiabilities` | 6 | rename only |

Truly-absent (need new capture, slower): 80G/80GGA/80GGC donee-level rows, depreciation grids (ITR-6 dropped them), ScheduleVDA, ScheduleCFL year-wise, ScheduleTCS, ScheduleIT challans, ScheduleFSI/TR1, ITR-U machinery.

---

## 5. Recommended sequence to filing-capacity (PLAN ONLY — no code)

1. **Wire the now-available ERI prefill-JSON + client endpoints** (exposed in `openapi.json`, under `/it/compliance/eri/tax-payers/…`): register-client → add-client OTP → validate → prefill-JSON OTP → verify → `GET …/prefilled-json`. This **seeds identity, filing-status, TDS, challans and bank rows straight from the portal** — one integration closes the identity, taxes-paid and bank/refund themes across *all seven* forms without hand-building those schedules. Then gate exports through `POST …/itrs/validate` per form before `submit`.
2. **Zero-cost renames / flag-flips first** (theme: identity + wins #10, #11, #13): ITR-6 `PartB_TI`→`PartB-TI` and BS node rename; ITR-3 TDS node/child rename to ScheduleTDS1/2; add `UseForRefund`; honour rep/directorship/unlisted/partner flags; ITR-1 LTCG112A key fix. High impact, tiny diffs, no new UI.
3. **Serialize captured-but-dropped schedules in dependency order** (wins #1–#9, #12): House-Property `PropertyDetails[]`/ScheduleHP (universal) → ScheduleFA (flip `'N'`) → ScheduleAL → PARTA_BS/PL financials (3/5/6) → ScheduleBP presumptive (4) → Partner roster (5) → Trust ScheduleA/J/I/D/115TD (7) → 80C/80D itemized → capital-gains detail (ScheduleCGFor23/112A/115AD) → ScheduleOS detail.
4. **Build truly-absent schedules** where a real return needs them: 80G donee rows, ScheduleCFL, ScheduleTCS, ScheduleIT challans, depreciation grids (reinstate in ITR-6), ScheduleVDA, FSI/TR1.
5. **Fill PartB-TTI detail leaves** (surcharge/cess/relief/`TaxDeferred17`/AMT) so tax-computation is complete, not just present-as-zero.
6. **Resolve the AY/proxy gaps:** ship real AY-2026-27 builds for ITR-5/6/7 and run a true 2026-27 conformance pass (ITR-6 especially — its 2.0 % is a proxy floor, not a graded 2026 verdict).
7. **Re-audit** after each wave against the real trees; treat `POST …/itrs/validate` as the acceptance gate before enabling filing.

---

*Reports only. No code was modified. Supersedes `../CONFORMANCE-REPORT.md`.*
