# ITR UI GAP MAP — MASTER INDEX & PATH TO 100%

**Goal:** every REQUIRED node of the official ITD JSON-Schema producible by the software (UI data-entry + computation) → a valid, complete JSON the user exports **offline** and uploads directly to the ITD portal.
**Date:** 2026-08-05 · **Scope:** roll-up of `ITR-1.md … ITR-7.md` (each: real schema ↔ our emitter ↔ UI catalog). **Read-only — no code changed.**

Every not-yet-fillable required node is classified into one of four actions:

| Action | Meaning | Cost |
|---|---|---|
| **A. Mis-key / shape** | We emit it, but under the wrong path/shape | emitter rename — cheapest |
| **B. Compute-and-export** | The calculator has/derives it; emitter just never writes it | emitter, no UI |
| **C. Captured-but-not-exported** | A drill-in *already collects* it; emitter drops it | emitter wiring, no UI |
| **D. Missing UI** | No surface exists | build new drill-in/field |

## 1. Per-form summary (AY 2026-27; both AYs in each file)

| Form | Req-MISS | A | B | C | D | New drill-ins | Biggest single blocker |
|---|--:|--:|--:|--:|--:|--:|---|
| **ITR-1** | 251 | ~1 | ~70 | **~155** | ~25 | **2** | Emitter writes 0 `Schedule*` nodes; Schedule80G (60) captured in 80G grids |
| **ITR-2** | 1,042 | ~11 | ~147 | ~348 | **~490** | ~21 | ScheduleCGFor23 (258) — mostly **C** (calc has scrip-wise data) |
| **ITR-3** | 1,598 | ~17 | ~110 | ~330 | **~1,150** | ~24 | ScheduleCGFor23 (294) — **no input surface** (true D) |
| **ITR-4** | 241 | ~15 | ~8 | ~23 | **~195** | ~16 | ScheduleBP (defines ITR-4) — **C+B**, wire-up + code remap |
| **ITR-5** | 1,442 | ~7 | ~347 | **~1,150** | ~313 | ~14 | Partner roster (PartA_GEN2) captured, dropped — firm invalid |
| **ITR-6** | 2,636¹ | ~22 | ~95 | **~1,550** | ~930 | ~22 | Thin-projection emitter; **backup `emitJSON` is a ready template** |
| **ITR-7** | 1,079 | ~23 | ~99 | ~329 | **~628** | ~13 | Inert compute (prereq #0) + ScheduleCG (254) new UI |
| **Totals** | ~8,300 | ~96 | ~876 | **~3,860** | ~3,730 | **~112** | |

¹ ITR-6 is an AY-2025-26-schema-vs-2026-build proxy (no 2026-27 real schema shipped) — directional.

**The headline:** the single biggest bucket is **C — captured-but-not-exported (~3,860 required nodes)**. Nearly half the total gap is data the UI *already collects* but the emitters drop. **The emitters — not the data entry — are the primary bottleneck.** New UI (D, ~3,730) is concentrated in a few income-head schedules that recur across forms.

## 2. Prerequisites (gating fixes — do these first or downstream work can't land)

| # | Form(s) | Prerequisite | Why |
|---|---|---|---|
| P0 | **ITR-7** | Fix inert Computation iframe (`itr7.html:10619` literal `<\/script>`) | `computeAll` never defines → every tax node is 0; nothing downstream can populate |
| P0 | **ITR-2…7** | Restore `window.__taxBreakup` (ported to ITR-1 only) | Part B-TTI surcharge/cess/rebate/CG-special-rate export 0 without it |
| P0 | **ITR-5** | Bind Assessee `area`/`flat` (preflight demands them; no UI field) | Export is currently *unreachable* — preflight never passes |
| P0 | **ITR-6** | Adopt the backup `emitJSON` (`itr6-ay2526-backup.html:301`) as the emitter template | The 2026 rewrite regressed to 116 flat leaves; the backup already builds ~55 correct schedule nodes over the *same* captured data |

## 3. Cross-form mis-key fixes (Action A — cheap, unblock validation)
- **TDS shape (all forms):** legacy `TDSonSalaries`/`TDSonOthThanSals` → schema `ScheduleTDS1`/`ScheduleTDS2`(`…Dtls[]` with `TANOfDeductor/TDSSection/TDSClaimed/TDSCreditCarriedFwd`). ITR-4 uses invalid `AmtForTaxDeduct`/`TotTDSOnAmtPaid`.
- **ITR-1:** `LTCG112A.TotLTCG112A` → `LongCap112A`.
- **ITR-6:** `PartB_TI` → `PartB-TI` (hyphen); `PARTA_BS` → `PARTA_BSFor6FrmAY13`; CG/OS/BP scalar → object nesting.
- **ITR-7:** `PartB_TI2.*` collapsed into `PartB_TI.*`.
- **Universal genuine omission:** `AddtnlBankDetails[].UseForRefund` — the refund-account flag is dropped by every form (bank rows themselves ARE emitted — those were false-MISS).

## 4. Recurring "captured-but-not-exported" wins (Action C — highest ROI, no new UI)
These clusters exist in the UI across multiple forms and only need emitter wiring:
- **Chapter VI-A proof schedules** (80C/80D/80G/80E/…): ITR-1, ITR-2, ITR-4 — 80G grids already carry donee rows.
- **Business Balance Sheet / P&L**: ITR-3, ITR-5, ITR-6 — captured on the B/S & P&L tabs, dropped to zero skeletons.
- **FA / AL / PTI / ESOP / Directorship / Unlisted-shares**: ITR-2, ITR-3 — captured; FilingStatus flags hard-coded 'N'.
- **Partner/Member roster**: ITR-5 (`sf-partners`).
- **ScheduleA/J/I/D (application/corpus/accumulation)**: ITR-7 — captured, dropped.
- **TDS/TCS grids**: ITR-1, ITR-3 — richer than the AIS-only path currently emitted.

## 5. Recurring NEW-UI surfaces (Action D — build once, reuse the pattern)
Ranked by how many forms need them:
1. **Capital Gains (ScheduleCGFor23 + 112A/115AD/VDA)** — ITR-2 (C-leaning), **ITR-3 (true D, 294)**, ITR-6, ITR-7. The single largest new-UI surface across the suite.
2. **Chapter VI-A deduction detail hub (80G donee grid + 80-IA/IB/IC/IE + sub-forms)** — ITR-2 (149), ITR-4 (130), ITR-5 (133).
3. **Other Sources (nature-wise/DTAA/quarterly)** — ITR-2, ITR-3.
4. **House Property `PropertyDetails[]` (co-owner/tenant grids)** — ITR-1, ITR-2, ITR-4.
5. **Depreciation block (DPM/DOA/DEP/DCG + ScheduleUD)** — ITR-3, ITR-5, ITR-6 (feeds BP cascade).
6. **Taxes-paid detail (ScheduleIT challans / TCS / TDS3)** — ITR-1, ITR-4, ITR-7.
7. **Trust schedules (PartB_TI2/TI3, ScheduleA/J/I/D)** — ITR-7 only.

## 6. Ordered PATH TO 100% (offline export → ITD upload)

**Phase 0 — Prerequisites** (§2): fix ITR-7 compute, restore `__taxBreakup` across ITR-2…7, bind ITR-5 preflight fields, re-base ITR-6 on the backup emitter.
**Phase 1 — Mis-keys (A, ~96 nodes)**: rename/reshape so what we *do* emit validates. Cheapest, immediate validation gains.
**Phase 2 — Compute-and-export (B, ~876)**: emit the values the calculator already produces (tax ladder, set-off tables, totals). No UI.
**Phase 3 — Captured-but-not-exported (C, ~3,860)**: **the big lever.** Wire existing drill-ins → their `Schedule*` nodes. This alone moves most forms from ~15-25% to ~50-70% required-coverage with zero new UI. Start with the §4 clusters.
**Phase 4 — New UI (D, ~3,730 / ~112 drill-ins)**: build in the §5 order — income heads (CG → OS → HP) → deductions (VIA/80x hub) → taxes-paid → depreciation → FA/AL → trust schedules.
**Phase 5 — End-to-end validation loop**: export → run through the ERI **`validate`** API (files nothing) → fix flagged nodes → repeat until required-coverage = 100% and validation is clean → then offline export is portal-ready.

**Accelerator:** the ERI **`prefill-JSON`** endpoint (now available) can seed identity, TDS, challans and bank straight from the portal — reducing the Phase-3/4 burden for those schedules.

## Files
`INDEX.md` (this) · `ITR-1.md … ITR-7.md` — each with sections A–F + per-schedule checklist + ordered build list.
