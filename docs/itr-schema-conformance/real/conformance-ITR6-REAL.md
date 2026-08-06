# ITR-6 — REAL ITD Schema Conformance

**Form:** ITR-6 (companies) · **Emitter:** `public/tax-utilities/itr6.html` → `buildJSON()` (:2720) → envelope `ITR.ITR6`
**Schema compared:** AY **2025-26** (`trees/tree-ITR6-2025.txt`) · **Diff:** `diff/diff-ITR6-2025.txt`
**Schema version:** ITD JSON-Schema Ver1.0 (tree carries no explicit `SchemaVer`; our emitter stamps `Form_ITR6.SchemaVer="Ver1.0"`, `AssessmentYear="2026"`).

> ⚠ **AY-MISMATCH — read first.** Our shipping tool is a **2026-27 ground-up rewrite** (compact SHEET+SPEC design, `buildJSON`), compared here against the **2025-26** schema. It is used only as a **structural proxy**. Two forces depress the numbers: (a) the emitter is by design a *thin projection* — it exports ~116 flat rollup leaves and omits all schedule row-detail (Discrepancy note #1 in `docs/itr-structure/ITR-6.md`); (b) the 2026-27 build dropped several detail schedules the 2025-26 generation carried (see §5). Treat absolute % as directional, not a graded score.

## 1. Headline

| AY | Schema leaves | Required | reqOK | reqZERO | reqMISS | **% required PRESENT** |
|---|---|---|---|---|---|---|
| **2025-26** (proxy) | 3530 | 2691 | 13 | 42 | 2636 | **2.0 %** (55 / 2691) |

*PRESENCE = leaf emitted at all (OK or ZERO). ZERO = emitted, no probe data (not a defect). MISS = never emitted = true gap; a required MISS = filing blocker.* Overall emitter surface: 116 leaf-paths emitted, of which only **59 path-match** the schema (13 OK + 46 ZERO); the other **57 emitted paths are orphans** — rollup totals the schema names differently or nests deeper (see §4). The diff's own "0.5 %" counts reqOK-only; under the PRESENCE definition the headline is **2.0 %**.

## 2. Per-schedule capacity

`present = OK+ZERO`. Status: ✓ mostly present · ◑ partial · ✗ absent. (Full 68-schedule stats in `diff-ITR6-2025.txt` lines 7-74; the material rows:)

| Schedule | required | present | reqMISS | status |
|---|---:|---:|---:|---|
| CreationInfo | 6 | 6 | 0 | ✓ |
| Form_ITR6 | 5 | 5 | 0 | ✓ |
| PartA_GEN1 (identity) | 29 | 1 | 28 | ◑ (12 more emitted as ZERO under it) |
| PartA_GEN2For6 | 69 | 0 | 69 | ✗ |
| Verification | 6 | 4 | 2 | ✓ |
| PartB_TTI (tax computation) | 37 | 21 | 20 | ◑ (best-covered compute node) |
| PartB-TI (total income) | 40 | 0 | 40 | ✗ (emitted as `PartB_TI` — see §4) |
| PARTA_BSFor6FrmAY13 (Balance Sheet) | 149 | 0 | 149 | ✗ |
| PARTA_PL (Profit & Loss) | 104 | 0 | 104 | ✗ |
| PARTA_OI (Other Info / disallowances) | 83 | 0 | 83 | ✗ |
| TradingAccount / ManufacturingAccount | 10 / 6 | 0 | 10 / 6 | ✗ |
| CorpScheduleBP (business income) | 124 | 21 | 103 | ◑ (ladder emitted, all ZERO; detail leaves miss) |
| ScheduleCG (capital gains) | 406 | 0 | 406 | ✗ (3 totals emitted, orphan path — §4) |
| ScheduleOS (other sources) | 102 | 0 | 102 | ✗ (1 total emitted, orphan) |
| ScheduleHP (house property) | 32 | 1 | 31 | ◑ (total matches) |
| ScheduleFA (foreign assets) | 108 | 0 | 108 | ✗ |
| ScheduleAL (assets & liab) | 121 | 0 | 121 | ✗ |
| ScheduleSH (shareholding) | 60 | 0 | 60 | ✗ |
| SchedulePTI | 54 | 0 | 54 | ✗ |
| ScheduleDPM/DOA/DEP/DCG (depreciation) | 59/98/10/10 | 0 | 59/98/10/10 | ✗ |
| ITRScheduleUD (unabsorbed depr) | 18 | 0 | 18 | ✗ |
| ScheduleCYLA/BFLA/CFL (loss set-off) | 43/42/55 | 0 | 43/42/55 | ✗ |
| ScheduleVIA (Ch. VI-A deductions) | 6 | 0 | 6 | ✗ |
| ScheduleMAT/MATC | 43/18 | 0 | 43/18 | ✗ (MAT computed in PartB_TTI, schedule rows not emitted) |
| Schedule80G/80GGA/80-IA…IE, ESR, EI, SI, TR1, IT/TDS2/TDS3/TCS, VDA, 112A, 115AD, BBS, FSI, GST, FD, TPSA, IF, 115TD | — | 0 | (all req) | ✗ |

Only **CreationInfo, Form_ITR6, Verification** clear as ✓. **PartB_TTI** is the single genuinely-partial compute node (57 % present). Every income-head and financial-statement schedule is ✗ or ◑.

## 3. Ranked filing-blockers (most material first)

Materiality order: financial statements → income heads → tax-computation detail → schedule detail. For each: node count · captured-but-not-exported (UI collects it, emitter drops it — **highest-value**, a wiring fix) vs truly-absent (not in this build at all).

1. **PARTA_BS — Balance Sheet (149 req).** Mandatory for a company. UI captures the *entire* Schedule-III B/S (sheet part `bs`, 15 drill popups, ~400 cells — Liabilities/Assets/Additional-Data). Emitter outputs **only 2 rollups** (`PARTA_BS.TotalLiabilities`, `PARTA_BS.TotalAssets`, both ZERO, wrong node name). **Captured-but-not-exported.**
2. **PARTA_PL + Trading + Manufacturing A/c (104 + 10 + 6 req).** Full Mfg/Trading/P&L is captured (sheet part `pl`, 14 popups, 27 P&L expense lines, GST break-ups). Emitter carries only the computed BP figures. **Captured-but-not-exported.**
3. **ScheduleCG — Capital Gains (406 req; largest node).** Seven gain rows captured via shared `CGSEC()` break-ups (`cg` part). Emitter emits 3 summary totals only, on an orphan path. **Captured-but-not-exported (totals) / detail truly absent** (no scrip-wise 111A/112/112A/115AD tables in this build).
4. **ScheduleOS — Other Sources (102 req).** Dividend/interest/56(2)(x)/57 all captured (`os` part, 6 popups); emitter emits 1 total. **Captured-but-not-exported.**
5. **CorpScheduleBP — Business income (124 req, 103 miss).** Best case among heads: the full add/deduct ladder *is* exported (21 leaves, all ZERO). The 103 misses are schema **detail leaves** (per-section 44-presumptive breakup, rule-7/7A/8, BusSetoffCurrYr matrix, IncCredPL/ExpDebToPL heads) that our flat ladder does not decompose. **Partially exported.**
6. **PartB-TI — Total Income (40 req).** Fully *computed* in the tool but emitted under node **`PartB_TI`** (underscore) vs schema **`PartB-TI`** (hyphen) → all 40 mis-path. **Captured-and-computed but mis-named** (semantic partial — see §4).
7. **ScheduleFA — Foreign Assets (108 req).** Nine FA master-detail tables captured (`fa` part); flag `AssetOutsideIndiaFlg` emitted but **zero detail exported**. **Captured-but-not-exported.**
8. **ScheduleAL — Assets & Liabilities (121 req).** Ten AL drills captured; **none exported**. **Captured-but-not-exported.**
9. **ScheduleSH — Shareholding (60 req).** `sh1` shareholder/allotment tables captured; not exported. **Captured-but-not-exported.**
10. **Depreciation ScheduleDPM/DOA/DEP/DCG (59/98/10/10 req) + ITRScheduleUD (18 req).** **Truly absent** — the 2026-27 build dropped the depreciation grids and the unabsorbed-depreciation schedule, keeping only the `bp_depit` summary and a single `cg_st50` input. No UI capture to wire.
11. **Loss set-off CYLA/BFLA/CFL (43/42/55 req) + ScheduleVIA (6) + MAT/MATC schedule rows (43/18).** Captured as free-amount inputs (`ti_cyla/bfla/cfl/via`, `mat_bp/mat_credit`) but **not exported**, and the per-head/per-year matrices themselves were simplified out. **Mostly captured-but-not-exported; matrix detail truly absent.**

Identity/Verification are **not** blockers (present). The blocker mass is financial-statements + income-head detail, and the dominant, most-fixable class is **captured-but-not-exported** (items 1-4, 7-9): the UI already holds the data; only `buildJSON()` needs to emit it.

## 4. False-MISS corrections (semantic naming deltas)

Spot-checked ~12 required-MISSING leaves against the emitted paths / builder. Found **8 false-MISS** — concept *is* emitted, under a different path/name; reclassify MISS → semantic-partial (⚠):

| Schema required leaf (counted MISS) | Emitter actually emits | Delta |
|---|---|---|
| `PartB-TI.IncomeFromHP` | `PartB_TI.IncomeFromHP` | node `PartB-TI` → `PartB_TI` (hyphen vs underscore) |
| `PartB-TI.GrossTotIncome` | `PartB_TI.GrossTotIncome` | same node delta |
| `PartB-TI.TotalIncome` | `PartB_TI.TotalIncome` | same |
| `PartB-TI.DeductionsUnderScheduleVIA` | `PartB_TI.DeductionsUnderScheduleVIA` | same |
| `PartB-TI.DeductUndChapVIA`/`DeductionUs10AA` | `PartB_TI.DeductionUs10AA` | same |
| `PARTA_BSFor6FrmAY13.TotalAssets` | `PARTA_BS.TotalAssets` | leaf matches, node `…For6FrmAY13`→`PARTA_BS` |
| `ScheduleCG.ShortTermCapGain.TotalSTCG` | `ScheduleCG.TotalSTCG` | leaf matches, parent flattened |
| `ScheduleCG.LongTermCapGain.TotalLTCG` | `ScheduleCG.TotalLTCG` | leaf matches, parent flattened |

Also name-deltas (concept present, no clean leaf match): `PARTA_BSFor6FrmAY13.EquityAndLiablities.TotEquityAndLiabilities` ↔ our `PARTA_BS.TotalLiabilities`; `ScheduleCG.SumOfCGIncm` ↔ our `ScheduleCG.TotalCapGains`; `ScheduleOS.IncChargeable` emitted but schema uses `IncOthThanOwnRaceHorse.*`. **Confirmed true-match (not a false-MISS): `ScheduleHP.TotalIncomeChargeableUnHP`** — emitted at the exact schema path (the ScheduleHP ZERO). Note the `PartB-TI` heads `ProfBusGain`/`CapGain`/`IncFromOS` are emitted as **scalars** but the schema wants **nested objects** — genuine partial, not a clean rename.

**Impact:** 8 false-MISS out of 2636 reqMISS moves the needle by <0.3 pp — headline stays ~2 %. But it shows the emitter *computes* the top-line total-income and BS/CG totals; the gap there is **naming/nesting**, not capability. Fixing the `PartB_TI`→`PartB-TI` node rename alone reclassifies 5 required leaves for free.

## 5. AY delta (2025-26 → 2026-27) affecting us

Our tool is the 2026-27 generation; the schema here is 2025-26. Differences that shape the numbers:

- **Detail schedules the 2026-27 build dropped** (present in the 2025-26 backup `itr6-ay2526-backup.html`, hence counted MISS against the 2025 schema): Schedule DPM/DOA/DEP/DCG depreciation grids, Schedule 112A & 115AD(1)(b)(iii) scrip-wise tables, Schedule VDA, Schedule UD, the full CYLA+BFLA set-off **matrix**, Schedule ICDS, donee-wise 80G/80GGA/80RA/80GGC, undertaking-wise 80-IA/IB/IC/IE/IAC/M/LA, Schedule BBS (115QA), Schedule FSI, PART A-QD Quantitative Details, Part A-BS Ind AS (Division-II) + Ind AS Mfg/Trading/P&L, and the 139(8A)/ITR-U block. These inflate reqMISS structurally — some may be re-introduced or genuinely retired in the real 2026-27 schema (not yet compared).
- **Content changes new in 2026-27** (row-label / enum level, low structural impact): dual-date CG splits at 23/07/2024 (111A 15→20 %, 112 20→12.5 %, 112A 10→12.5 %), 44BBC cruise-shipping presumptive row, 43B(h) MSME disallowance, FA reference "calendar year 2025", 234A/B/C & due-date rolled to 2026, LEI drill, MSME-recognition question, Form-2/DPIIT declaration chain. The `indas` flag is inert in both.

**Net:** the ~2 % is a floor produced by (a) thin-projection exporter and (b) proxy-AY schedule drift. Against its *own* AY the same emitter would still fail every schedule-detail check because `buildJSON()` deliberately emits totals only. A true 2026-27 schema comparison is needed for a graded number.
