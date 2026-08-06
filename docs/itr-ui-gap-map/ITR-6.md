# ITR-6 — UI GAP MAP (path to 100% schema-complete offline export)

Coverage now: AY2025-26 proxy ~2% (needs true 2026-27 schema to grade). Target 100%.

> **⚠ AY-PROXY LIMITATION — read first, applies to every section below.** No real **ITR-6 AY2026-27** ITD schema exists in this repo. The only real schema is **`trees/tree-ITR6-2025.txt` (AY2025-26, 3530 leaves, 2691 required)**. Our shipping tool `public/tax-utilities/itr6.html` is a **2026-27 ground-up rewrite** (`buildJSON()` @ :2720). So every classification, node-path and #req below is graded against the **2025-26 schema as a structural proxy** — absolute counts are *directional, not a graded score*. Two independent forces depress the number: (a) `buildJSON()` is by design a **thin projection** — it emits ~116 flat rollup leaves under 13 nodes, of which only 59 path-match the schema and **57 are orphan-pathed**; (b) the 2026-27 rewrite **dropped whole detail schedules** the prior generation carried. A true 2026-27 comparison is required before any % is trusted.
>
> **KEY STRUCTURAL FINDING — the 2025-26 backup `emitJSON()` covers dramatically more than the shipping 2026 build.** `public/tax-utilities/itr6-ay2526-backup.html` → `emitJSON()` (@ :301, `SWCreatedBy:'SW10001111'`) is a **near-complete emitter**: it builds ~55 schedule nodes with **correct schema node-names and shapes** — `PARTA_BSFor6FrmAY13`, `PARTA_PL`, `PARTA_OI`, `PARTA_OL`, `PARTA_QD`, `ManufacturingAccount`, `TradingAccount`, `PARTA_BSIndAS`/`PARTA_PLIndAS`, `ScheduleDPM`/`ScheduleDOA`/`ScheduleDEP`/`ScheduleDCG`, `ITRScheduleUD`, `ScheduleCG`, `ScheduleOS`, `ScheduleCYLA`/`BFLA`/`CFL`, `ScheduleVIA` (incl. 80M split), `ScheduleMAT`/`MATC`, `ScheduleFA`/`SH`/`AL`, `Schedule112A`/`115AD`/`VDA`, `Schedule80G`/`80GGA`/`80GGC`/`80IAC`, `ScheduleSI`/`EI`/`PTI`/`BBS`/`FSI`/`TR1`, `ScheduleIT`/`TDS2`/`TDS3`/`TCS`, `ScheduleHP`, `CorpScheduleBP`, `Schedule10AA`, `ScheduleIF`/`GST`/`FD`/`TPSA`, `PartA_GEN1`/`GEN2For6`/`139_8A`, **`PartB-TI` (correct hyphen)**, `PartB_TTI`, `PartB-ATI`. **The 2026 build REGRESSED the emitter, not the data capture** — the shipping UI still captures almost everything (see §C), it just no longer emits it. Consequence: **the backup `emitJSON()` is the ready-made node-name/shape mapping template** for wiring the 2026 UI to a complete export. This is the single highest-leverage asset for reaching 100%.

Sources: `trees/tree-ITR6-2025.txt` · `diff/diff-ITR6-2025.txt` · `conformance-ITR6-REAL.md` · `docs/itr-structure/ITR-6.md` (catalog; Screen→Part→Particular→Drill-in) · emitter `buildJSON()` (itr6.html:2720) · backup `emitJSON()` (itr6-ay2526-backup.html:301).

Legend: **USER-INPUT** = surfaces in classes C & D (a person must type it) · **COMPUTE-ONLY** = class B (derivable from existing inputs, no new UI). Class A = wire-format renames.

---

## A. Mis-key / shape fixes — our path → schema path | schedule | #req

Pure wire-format defects: the value is already computed **and emitted**, just under the wrong node-name or wrong nesting/type. Fixing these reclassifies leaves MISS→OK for near-zero cost. (The backup `emitJSON()` already uses every correct name on the right.)

| Our emitted path (`buildJSON`) | Schema required path (`tree-ITR6-2025`) | Schedule | #req affected |
|---|---|---|---|
| `PartB_TI` (underscore node) | `PartB-TI` (hyphen node) | PartB-TI | ~10 leaves flip OK immediately (IncomeFromHP, GrossTotIncome, TotalIncome, DeductionsUnderScheduleVIA, DeductionUs10AA, IncChargeableTaxSplRate, LossesOfCurrentYearCarriedFwd, …) |
| `PARTA_BS` (node) | `PARTA_BSFor6FrmAY13` (node) | PARTA_BSFor6FrmAY13 | node rename (2 totals now match) |
| `PARTA_BS.TotalLiabilities` | `PARTA_BSFor6FrmAY13.EquityAndLiablities.TotEquityAndLiabilities` | PARTA_BSFor6FrmAY13 | 1 |
| `PARTA_BS.TotalAssets` | `PARTA_BSFor6FrmAY13.Assets.TotalAssets` | PARTA_BSFor6FrmAY13 | 1 |
| `ScheduleCG.TotalSTCG` (flat) | `ScheduleCG.ShortTermCapGain.TotalSTCG` (nested) | ScheduleCG | 1 |
| `ScheduleCG.TotalLTCG` (flat) | `ScheduleCG.LongTermCapGain.TotalLTCG` (nested) | ScheduleCG | 1 |
| `ScheduleCG.TotalCapGains` | `ScheduleCG.SumOfCGIncm` | ScheduleCG | 1 |
| `ScheduleOS.IncChargeable` (scalar) | `ScheduleOS.IncOthThanOwnRaceHorse.*` → `IncChargeable` | ScheduleOS | 1 (nesting) |
| `CorpScheduleBP.SpecBusinessInc` (scalar `I(...)`) | `CorpScheduleBP.SpecBusinessInc.{NetPLFrmSpecBus,AdditionUs28to44DA,DeductUs28to44DA,AdjustedPLFrmSpecuBus}` (object) | CorpScheduleBP | scalar→object (4) |
| `CorpScheduleBP.IncSpecifiedBusiness` (scalar) | `CorpScheduleBP.IncSpecifiedBusiness.{NetPLFrmSpecifiedBus,…,ProfitLossSpecifiedBusFinal}` (object) | CorpScheduleBP | scalar→object (6+) |
| `PartB_TI.ProfBusGain`/`CapGain`/`IncFromOS` (scalars) | `PartB-TI.*` require **nested objects** (§4 conformance) | PartB-TI | 3 (shape) |

**Action:** ~11 rename/renest fixes in `buildJSON`; the `PartB_TI→PartB-TI` node rename alone reclassifies ~5–10 required leaves for free. **COMPUTE-ONLY** (no UI). ~20–25 leaves total flip without touching the UI.

---

## B. Compute-and-export — schema nodes | source | #req

Value is **derivable from inputs the tool already holds** but is not currently emitted at all (no new UI needed). COMPUTE-ONLY.

| Schema node(s) | Source in current tool | Schedule | #req (approx) |
|---|---|---|---|
| `PartB_TTI` remaining leaves (surcharge splits, marginal-relief, cess bands, MAT payable, 234A/B/C, 234F, aggregate) | `computeComp()` @ :2232-2441 already computes all of these into `C.it_tti_*` / `C.it_int_*` / `C.it_mat_*` | PartB_TTI | ~20 |
| `PartB-TI` head-wise + GTI + deductions rollups | `C.it_ti_*` computed | PartB-TI | ~26 |
| `ScheduleCG.ShortTermCapGain.*` / `LongTermCapGain.*` sub-totals & `SumOfCGIncm` | `C.it_cg_sttot/lttot/income` computed | ScheduleCG | ~10 |
| `ScheduleSI` tax-thereon splits, `IncChargeableTaxSplRate` | `it_ti_si` + Schedule-SI `ti_si` rows (rate×income) | ScheduleSI | ~6 |
| `CorpScheduleBP` computed sub-totals (`TotDeprAllowITAct`, `TotDeemedProfitBusUs`, `TotalProfitFrmActCvrd`, add/deduct totals) | `it_bp_*` computed roll-ups | CorpScheduleBP | ~15 |
| `ScheduleMAT`/`ScheduleMATC` book-profit & credit totals | `mat_bp` drill + `C.it_mat_*` | ScheduleMAT/MATC | ~10 (totals) |
| `ScheduleDCG.DeemedShortTermCapGain` | already a single input `cg_st50` | ScheduleDCG | 1–2 (rest needs DPM/DOA block → D) |

**Action:** extend `buildJSON` to emit already-computed cells. ~80–110 required leaves. **COMPUTE-ONLY.**

---

## C. Captured-but-not-exported — schema schedule | EXISTING drill-in/part (verbatim) | binds | #req

**The dominant, highest-value class.** The 2026 UI *already collects* this data; `buildJSON()` simply drops it (Discrepancy note #1, catalog). The fix is emitter wiring only — **no new UI**, and the backup `emitJSON()` supplies the target node shapes. All are **USER-INPUT** (already gathered).

| Schema schedule (verbatim node) | EXISTING catalog Part / Drill-in (verbatim) | Binds | #req |
|---|---|---|---|
| `PARTA_BSFor6FrmAY13` | Part **`bs`** "ITR B/S" + 15 popups: bs_scoth, bs_othres, bs_ltborr, bs_stborr, bs_tcred, bs_ocl, bs_ostp, bs_nbfa, bs_ncinv, bs_ltla, bs_cinv, bs_invoth, bs_tdeb, bs_stla, bs_oca, bs_addl | `S.v.bs_*`, `S.p["bs_*.*"]`, `C.it_bs_*` | 149 |
| `PARTA_PL` | Part **`pl`** "ITR P&L A/c" + popups pl_othinc, pl_ins, pl_prov, pl_sal, pl_taxrates, pl_othexp, pl_othapp, pl_fpay, pl_baddebt | `S.v.pl_*`, `S.p["pl_*.*"]` | 104 |
| `ManufacturingAccount` | Part `pl` "ITR Manufacturing A/c" (mfgac=Yes) + mfg_direxp, mfg_factexp | `S.v.mfg_*` | 6 |
| `TradingAccount` | Part `pl` "ITR Trading A/c" + tr_othrev, tr_duties, tr_direxp, tr_taxinp, tr_intraday, tr_fno | `S.v.tr_*` | 10 |
| `PARTA_OI` (partial) | BP disallowance drills **oi_36 / oi_37 / oi_40 / oi_40a / oi_43b** (Part A-OI items verbatim) | `it_oi_*` | ~40 of 83 (rest → D) |
| `PARTA_OL` | Part **`ol`** "Receipt & Payment A/c of Company under Liquidation" + ol_sale, ol_roth, ol_poth | `S.v.ol_*`, `C.it_ol_*` | 27 |
| `CorpScheduleBP` detail | BP drills **bp_inccred, bp_incexempt, bp_expdeb, bp_depit, bp_deemed, bp_presump, bp_spec, bp_35ad, bp_35esr** | `it_bp_*` | ~60 of 103 (setoff-matrix/rule-7 → D) |
| `ScheduleHP` | Part **`hp`** drill **hp_prop** (master-detail, per-property share ladder) | `S.r.hp_prop`, `C.it_hp_*` | 31 |
| `ScheduleCG` break-ups | Part **`cg`** seven `dnum` rows sharing `CGSEC()` (111A o/n, stapp, st50, 112A o/n, 112 idx/no-idx) | `S.p["cg_*.*"]`, `C.it_cg_*` | ~340 of 406 (scrip tables 112A/115AD → D) |
| `ScheduleOS` | Part **`os`** drills os_div, os_int, os_56x, os_oth, os_spl, os_57 | `it_os_*` | 102 |
| `ScheduleCYLA` | Part `ti` drill **ti_cyla** (HP/business/other-sources loss set-off, free amounts) | `S.p["ti_cyla.*"]` | ~20 of 43 (per-head matrix → D) |
| `ScheduleBFLA` | Part `ti` drill **ti_bfla** (8 brought-forward loss rows, free amounts) | `S.p["ti_bfla.*"]` | ~20 of 42 (per-year matrix → D) |
| `ScheduleCFL` | Part `ti` drill **ti_cfl** (master-detail "Schedule CFL", per-year loss rows) | `S.r.ti_cfl` | ~30 of 55 (per-head-per-year matrix → D) |
| `ScheduleVIA` | Part `ti` drill **ti_via** (80G/GGA/GGB/GGC + 80-IA…80PA amounts) | `S.p["ti_via.*"]` | 6 |
| `Schedule10AA` | Part `ti` drill **ti_10aa** repeater ("Units in SEZ") | `S.r.ti_10aa` | 3 |
| `ScheduleSI` | Part `ti` drill **ti_si** repeater (Section/Rate/Income/Tax) | `S.r.ti_si` | ~4 of 6 |
| `ScheduleEI` | Part `ti` drill **ti_ei** (interest/agri/DTAA/PTI/other exempt) | `S.p["ti_ei.*"]` | 17 |
| `SchedulePTI` (partial) | Part `info` drill **pti** repeater (Trust/Fund/Income/TDS/PAN/Head/Entity) | `S.r.pti` | ~30 of 54 (rest → D) |
| `ScheduleMAT` | Part `tti` drill **mat_bp** (Schedule MAT additions/deductions break-up) | `S.p["mat_bp.*"]` | ~40 of 43 |
| `ScheduleMATC` | Part `tti` drill **mat_credit** repeater (per-AY MAT credit) | `S.r.mat_credit` | 18 |
| `ScheduleFA` | Part **`fa`** 9 master-detail drills fa_dep, fa_eq, fa_ins, fa_fin, fa_imm, fa_cap, fa_sign, fa_trusts, fa_othinc + shared OFFERED | `S.r.fa_*` | 108 |
| `ScheduleAL` | Part **`al`** 10 drills al_resland, al_othland, al_listed, al_unlisted, al_othsec, al_capcon, al_loans, al_vehicles, al_jewel, al_liab | `S.r.al_*` | 121 |
| `ScheduleSH` | Part `info` drill **sh1** ("Shareholders of Unlisted company" + share-application master-detail) | `S.r.sh1_*` | 60 |
| `ScheduleIF` | Part `info` drill **unincorp** ("Investment in unincorporated entities" master-detail) | `S.r.unincorp` | 8 |
| `ScheduleGST` | Part `info` drill **gst** repeater (GSTIN / outward supplies) | `S.r.gst` | 2 |
| `ScheduleFD` | Part `info` drill **fd** (Receipts/Payments × Capital/Revenue) | `S.p["fd.*"]` | 4 |
| `ScheduleTPSA` | Part `info` drill **tpsa** (92CE break-up + tax-deposit repeater) | `S.p["tpsa.*"]`, `S.r.tpsa` | 13 |
| `ScheduleTR1` | Part `tti` drills **tti_rel90 / tti_rel91** (treaty / non-treaty relief repeaters) | `S.r.tti_rel90/91` | 9 |
| `ScheduleIT` | Part `tti` drills **tp_adv / tp_sat** (challan repeaters) | `S.r.tp_adv/tp_sat` | 5 |
| `ScheduleTDS2` | Part `tti` drill **tp_tds** ("TDS other than salary") | `S.r.tp_tds2` | 6 |
| `ScheduleTDS3` | Part `tti` drill **tp_tds** ("26QB/26QC/26QD, no TAN") | `S.r.tp_tds3` | 6 |
| `ScheduleTCS` | Part `tti` drill **tp_tcs** repeater | `S.r.tp_tcs` | 5 |
| `PartA_GEN1` (identity) | Part `info` drills **assessee, verifier, bank** + clientbar | `S.p["assessee.*"]`, `S.p["cl.*"]`, `S.r.bank` | ~28 |
| `PartA_GEN2For6` (partial) | Part `info` drills **mgmt, holdsub, regco, demerger, nature, aud44ab_det, othaudit, repasse, lei** | `S.r.*`, `S.p[*]` | ~50 of 69 (rest → D) |

**Action:** rebuild `buildJSON` to emit these nodes (backup `emitJSON` = shape template). ~1,500–1,600 required leaves. **USER-INPUT already captured** — pure wiring.

---

## D. MISSING UI — per schedule: collects | PARENT part | NEW/EXTENDED drill-in | key fields | #req | priority

Truly absent in the 2026 build — a person **cannot enter this today**. New surface required. (Most existed in the 2025-26 backup and can be ported.) **USER-INPUT.**

| Schedule | Collects | PARENT part | NEW / EXTENDED drill-in | Key fields | #req | Priority |
|---|---|---|---|---|---|---|
| `ScheduleDPM` | Plant & machinery depreciation, 4 rate blocks | Schedule BP (new "Schedule DEP" part) | **NEW dpm** grid | OpeningWDV, Additions ≥/<180d, DeductionsSales, DepreciationRate 15/30/40/45%, AdditionalDepr, ClosingWDV, CapGainLoss | 59 | **P1** (feeds BP `it_bp_depit`, currently summary-only) |
| `ScheduleDOA` | Other-assets depreciation (building/furniture/intangible/ships) | Schedule BP | **NEW doa** grid | per-block WDV/Additions/Depr @5/10/40/25/20% | 98 | **P1** |
| `ScheduleDEP` | Depreciation summary (all blocks) | Schedule BP | **NEW dep** roll-up | TotDepracaitionPM/OA, totals | 10 | **P1** |
| `ScheduleDCG` | Deemed STCG on sale of depreciable assets | Schedule CG | **EXTEND** (`cg_st50` → DCG block) | DeemedPlantMachinery, DeemedOthAssets, TotalDCG | 10 | **P1** |
| `ITRScheduleUD` | Unabsorbed depreciation / allowance c-f | Schedule BP/CFL | **NEW ud** per-AY table | AssYr, AmtBFUD, AmtAdjOptTaxUs115BAA, AmtDeprSOCY, BalCFNY, totals | 18 | **P1** (blocks 115BAA/loss c-f) |
| `Schedule112A` | Scrip-wise LTCG on STT-paid shares | Schedule CG | **NEW cg_112a** repeater | ISIN, ShareName, Qty, SalePrice, CostAcq, FMV31Jan2018, LTCG | 20 | P2 |
| `Schedule115AD` | Scrip-wise LTCG for FIIs | Schedule CG | **NEW cg_115ad** repeater | same shape (proviso) | 20 | P2 |
| `ScheduleVDA` | Virtual digital asset transfers | Schedule CG/OS | **NEW vda** repeater | DateAcq, DateTransfer, CostAcq, Consideration, IncomeVDA | 8 | P2 |
| `Schedule80G` | Donee-wise 80G donations | Schedule VIA | **NEW 80g** master-detail | DoneeName, Address, PAN, cash/other amount, eligible % | 60 | P2 |
| `Schedule80GGA` | Donee-wise scientific-research/rural donations | Schedule VIA | **NEW 80gga** | DoneeName, PAN, mode, amount | 15 | P3 |
| `Schedule80GGC` | Political contributions | Schedule VIA | **NEW 80ggc** | Date, mode, amount, transaction-ref | 9 | P3 |
| `Schedule80-IA/IB/IC/IE/IAC/RA` | Undertaking-wise deduction detail | Schedule VIA | **NEW 80ia-family** drills | Undertaking, section, PY-of-commencement, deduction | 8/10/19/5/12 | P3 |
| `ScheduleBBS` | Buy-back 115QA | new part | **NEW bbs** | AmtDistributed, ConsiderationPaid, AddtlTaxUs115QA | 19 | P3 |
| `ScheduleFSI` | Foreign-source income + treaty relief | new part | **NEW fsi** master-detail | Country, TaxpayerID, IncomeFromOutsideIndia, TaxPaidOutside, TaxRelief, section | 23 | P3 |
| `PARTA_QD` | Quantitative details of trading/mfg | Part A-Mfg/Trading | **NEW qd** | ItemName, Unit, Opening, Purchase, Sales, Closing, Shortage | 21 | P3 |
| `CorpScheduleBP` matrix | BusSetoffCurrYr per-head + Rule 7/7A/8 breakup | Schedule BP | **EXTEND** bp | SpeculativeInc/SpecifiedInc/ProfGainUs115B set-off cols; ProfitFrmActCvrdUndrRule7/7A/7B1/8 | ~40 of 103 | P2 |
| `PARTA_OI` remainder | OI items beyond disallowances 6a-6r | Schedule BP/OI | **EXTEND** OI | method of accounting, 145A adjustments, ICDS, amounts 43B, etc. | ~40 of 83 | P2 |
| `ScheduleCYLA/BFLA/CFL` matrices | per-head / per-year set-off grids | Part `ti` | **EXTEND** ti_cyla/bfla/cfl | head×source amounts, ordering | ~85 combined | P2 |
| `SchedulePTI` remainder | PTI per-head breakup rows | Part `info` | **EXTEND** pti | head-wise income split, TDS mapping | ~24 of 54 | P3 |
| `PARTA_BSIndAS` | Schedule III Div-II Ind AS balance sheet | Part `bs` (indas=Yes branch) | **NEW indas-bs** (flag currently inert) | full Div-II layout | 174 | P2* (conditional on Ind AS filer) |
| `PARTA_PLIndAS` + `ManufacturingAccountIndAS` + `TradingAccountIndAS` | Ind AS P&L / Mfg / Trading | Part `pl` | **NEW indas-pl/mfg/tr** | Div-II P&L layout | 117/6/20 | P2* (conditional) |
| `PartA_139_8A` + `PartB-ATI` | Updated-return u/s 139(8A) / ITR-U block | new part | **NEW itru** | ReasonsForUpdating, UpdatedTotInc, AddtnlIncTax, TaxUS140B, tax-payment table | 12/19 | P3 (conditional on ITR-U) |

**Action:** ~20–25 new/extended surfaces. ~900–960 required leaves (of which ~317 are Ind-AS-conditional). **USER-INPUT.**

---

## E. Per-required-schedule checklist — schedule · #req · coverage · action · target

`present` = OK+ZERO today. Coverage keyed to §A–D dominant class. (#req from `conformance-ITR6-REAL.md` / `diff-ITR6-2025.txt`.)

| Schedule | #req | present now | dominant action | target |
|---|---:|---:|---|---|
| CreationInfo | 6 | 6 | — done | ✓ |
| Form_ITR6 | 5 | 5 | — done | ✓ |
| Verification | 6 | 4 | C (place/date) | ✓ |
| PartA_GEN1 | 29 | 1 | C wire assessee/verifier/bank | 100% |
| PartA_GEN2For6 | 69 | 0 | C (mgmt/holdsub/nature/audit) + D (few) | 100% |
| PartA_139_8A | 12 | 0 | D (ITR-U, conditional) | cond. |
| PARTA_BSFor6FrmAY13 | 149 | 0 | **A rename + C wire** (bs part) | 100% |
| PARTA_PL | 104 | 0 | C wire (pl part) | 100% |
| ManufacturingAccount | 6 | 0 | C wire | 100% |
| TradingAccount | 10 | 0 | C wire | 100% |
| PARTA_OI | 83 | 0 | C (5 disallow drills) + D (remainder) | 100% |
| PARTA_OL | 27 | 0 | C wire (ol part) | 100% |
| PARTA_QD | 21 | 0 | D new | cond. |
| CorpScheduleBP | 124 | 21 | B totals + C drills + D matrix | 100% |
| ScheduleHP | 32 | 1 | C wire (hp_prop) | 100% |
| ScheduleCG | 406 | 0 | A nest + C break-ups + D scrip tables | 100% |
| ScheduleOS | 102 | 0 | A nest + C wire | 100% |
| ScheduleCYLA/BFLA/CFL | 43/42/55 | 0 | C (free amts) + D (matrices) | 100% |
| ScheduleVIA | 6 | 0 | C wire (ti_via) | 100% |
| Schedule10AA | 3 | 0 | C wire | 100% |
| ScheduleSI | 6 | 0 | B/C wire (ti_si) | 100% |
| ScheduleEI | 17 | 0 | C wire (ti_ei) | 100% |
| SchedulePTI | 54 | 0 | C + D | 100% |
| ScheduleMAT/MATC | 43/18 | 0 | C wire (mat_bp/credit) | 100% |
| ScheduleDPM/DOA/DEP/DCG | 59/98/10/10 | 0 | **D new (P1)** | 100% |
| ITRScheduleUD | 18 | 0 | **D new (P1)** | 100% |
| ScheduleFA | 108 | 0 | C wire (9 fa drills) | 100% |
| ScheduleAL | 121 | 0 | C wire (10 al drills) | 100% |
| ScheduleSH | 60 | 0 | C wire (sh1) | 100% |
| ScheduleIF/GST/FD/TPSA | 8/2/4/13 | 0 | C wire | 100% |
| Schedule112A/115AD/VDA | 20/20/8 | 0 | D new | 100% |
| Schedule80G/80GGA/80GGC | 60/15/9 | 0 | D new (amounts C) | 100% |
| Schedule80IAC/80_IA/IB/IC/80RA | 5/8/10/19/12 | 0 | D new | cond. |
| ScheduleBBS/FSI | 19/23 | 0 | D new | cond. |
| ScheduleTR1 | 9 | 0 | C wire (tti_rel90/91) | 100% |
| ScheduleIT/TDS2/TDS3/TCS | 5/6/6/5 | 0 | C wire (tp_* drills) | 100% |
| PARTA_BSIndAS/PLIndAS/Mfg/TradingIndAS | 174/117/6/20 | 0 | D new (conditional) | cond. |
| PartB-TI | 40 | 0 | **A rename** + B compute | 100% |
| PartB_TTI | 37 | 21 | B compute-and-export | 100% |
| PartB-ATI | 19 | 0 | D (ITR-U, conditional) | cond. |

---

## F. Path-to-100 summary — counts per action, # NEW drill-ins, ordered build list

**Approximate required-leaf counts by primary action** (of ~2,636 required-MISS; AY-proxy, directional only):

| Class | What | ~#req | UI vs compute |
|---|---|---:|---|
| **A** | Mis-key / shape renames in `buildJSON` | ~20–25 | COMPUTE-ONLY |
| **B** | Compute-and-export already-computed cells | ~80–110 | COMPUTE-ONLY |
| **C** | Captured-but-not-exported (emitter wiring) | **~1,500–1,600** | USER-INPUT (already collected) |
| **D** | Missing UI (new/extended surfaces) | ~900–960 (≈317 Ind-AS-conditional) | USER-INPUT |

**# NEW drill-ins / surfaces to build (class D):** ~20–25 — the P1 core is **5** (Schedule DPM, DOA, DEP, DCG grids + Schedule UD); plus CG scrip tables (112A/115AD/VDA = 3), donee/undertaking deduction detail (80G/GGA/GGC/80-IA-family ≈ 6), QD, BBS, FSI, ITR-U block, matrix extensions (CYLA/BFLA/CFL/BP-setoff/OI), and the 4 Ind-AS statements (conditional).

**Top 3 new-UI surfaces (by materiality):**
1. **Depreciation block — DPM + DOA + DEP + DCG + UD (195 req, unconditional, P1).** Feeds Schedule BP `it_bp_depit` (today a summary only) and 115BAA/loss-carry-forward. Biggest *truly-missing* gap. Portable from the 2025-26 backup (`itr6.ScheduleDPM/DOA/DEP/DCG` @ :3899/3983/4043/4106; `ITRScheduleUD` @ :7027).
2. **Ind AS financial statements — PARTA_BSIndAS/PLIndAS/Mfg/Trading (317 req, conditional).** The `indas` flag is currently inert; a Division-II filer cannot produce a valid return. Backup has full builders (`PARTA_BSIndAS` @ :2811, `PARTA_PLIndAS` @ :3380).
3. **CG scrip-wise tables — Schedule 112A / 115AD / VDA (48 req, P2).** Required whenever STT-paid LTCG or VDA transfers exist; current build only has summary rows.

**Biggest blocker:** the **thin-projection `buildJSON()` itself** — ~1,500+ required leaves are *already captured in the 2026 UI* but never emitted (class C). This is not a data-collection gap; it is an **emitter rewrite**, and it is de-risked because **the 2025-26 backup `emitJSON()` is a near-complete, correctly-named emitter that serves as the drop-in mapping template.** Reaching a fileable JSON is gated far more on re-wiring export than on new screens.

**Ordered build list (identity → BS/PL → income heads → MAT → depreciation → detail schedules → taxes-paid):**
1. **A-fixes** — rename `PartB_TI→PartB-TI`, `PARTA_BS→PARTA_BSFor6FrmAY13`, nest CG/OS/BP objects (free wins).
2. **Emitter rewrite skeleton** — port the backup `emitJSON()` node-map into `buildJSON`; wire identity `PartA_GEN1`/`GEN2For6` from assessee/verifier/bank/mgmt/nature drills.
3. **Financial statements (C)** — `PARTA_BSFor6FrmAY13` (bs part, 15 popups) + `PARTA_PL`/`ManufacturingAccount`/`TradingAccount` (pl part) + `PARTA_OI` (oi drills) + `PARTA_OL`.
4. **Income heads (C)** — `CorpScheduleBP` full ladder+drills, `ScheduleHP`, `ScheduleCG` break-ups, `ScheduleOS`.
5. **MAT & regime (B/C)** — `PartB_TTI` compute-and-export, `ScheduleMAT`/`MATC` (mat_bp/mat_credit), 115JB/115BAA branch.
6. **Depreciation (D, P1)** — build DPM/DOA/DEP/DCG grids + `ITRScheduleUD`; feed BP.
7. **Balance-sheet-adjacent detail (C)** — `ScheduleFA`, `ScheduleAL`, `ScheduleSH`, `ScheduleIF`, `ScheduleGST`, `ScheduleFD`, `ScheduleTPSA`.
8. **Set-off & deductions (C+D)** — `ScheduleCYLA/BFLA/CFL` (wire free amts, then build matrices), `ScheduleVIA`+`Schedule10AA`+`ScheduleEI`+`ScheduleSI`+`SchedulePTI`; then D: 112A/115AD/VDA, 80G-family, BBS, FSI, QD.
9. **Taxes-paid (C)** — `ScheduleIT`, `ScheduleTDS2`/`TDS3`, `ScheduleTCS`, `ScheduleTR1`.
10. **Conditional blocks (D)** — Ind AS statements, PartA_139_8A/PartB-ATI ITR-U.
11. **Re-grade against a real AY2026-27 schema** before claiming any coverage %.
