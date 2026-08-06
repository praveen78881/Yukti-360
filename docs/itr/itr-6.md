# ITR-6 — Companies ⚠ PENDING for A.Y. 2026-27

> Applicable: companies other than those claiming exemption u/s 11 (Pvt Ltd, OPC, Public Ltd). **This is the incomplete form.** Files compared:
> - **CURRENT:** `public/tax-utilities/itr6.html` — 2,856 lines / ~187 KB / **A.Y. 2026-27**
> - **BACKUP (fuller, prior year):** `public/tax-utilities/itr6-ay2526-backup.html` — 13,645 lines / ~781 KB / **A.Y. 2025-26**
>
> Corrects the assumption slightly: the current file is **not a stub** — it's a working 3-tab shell with on-screen computation and a JSON exporter. What it lacks is **filing-complete granular schedules + full JSON**. The backup shows the target build but is a prior-year (2025-26) form. Lines below cite the file named in each row.

## 1. What the CURRENT `itr6.html` already has
- **3 tabs** (`:261`): `data-scr="itr"` (ITR Info), `data-scr="comp"` (IT Computation), `data-scr="val"` (Validate & Export). Header "A.Y. 2026-27" (`:257`). Host-app bridge hydrates name/PAN/DOI via `localStorage`/`postMessage` (`:2819`).
- **SECTIONS array** (`:400-810`): `info`, `al` (AL-1), `td` (115TD), `fa`, `ol` (Part A-OL liquidation), `bs` (Part A-BS), `pl` (Mfg/Trading/P&L), `bp` (Schedule BP), `hp`, `cg`, `os`, `ti` (Part B-TI), `tti` (Part B-TTI).
- **Info particulars:** client bar `cl_name/pan/status(CO_KIND)/resid/doi`; popups (SPEC `:839+`) — `assessee` (CIN/44AA/…), `verifier`, `bank`(+), `mgmt` (directors, md), `sh1` (shareholders), `regco`, `holdsub`, `demerger`, `repasse`, `pti`, `aud44ab_det`, `othaudit`, `nature`(NIC), `gst`, `fd`, `tpsa`, `unincorp`, `lei`.
- **On-screen computation exists** (as drill-down popups each computing one total): full B/S detail (`bs_*` `:1232`), Mfg/Trading/P&L (`mfg_/tr_/pl_*` `:1380`), Part A-OI disallowances (36/37/40/40A/43B `:1547`), Schedule BP (`bp_depit` dep u/s 32, deemed, presumptive, spec, 35AD `:1618`), HP/CG/OS, TI drill-downs (CYLA/BFLA/VIA/10AA/SI/CFL/EI `:1765`), TTI incl. **MAT 115JB** (`mat_bp` book-profit + `mat_credit` 115JAA), interest 234A/B/C+F, taxes-paid challans (`:1830`).
- **JSON generator present** — `buildJSON()` (`:2720`) → `{ ITR: { ITR6: {…} } }`, `Form_ITR6` AssessmentYear `2026`, **SchemaVer `Ver1.0`**, FormVer `Ver1.0` (`:2726`). Filename `{PAN}_ITR6_AY2026-27.json`.
- **Validation present** — `validate()` (`:2647`) with `VRULES` (26 field rules `:2618`) + ~10 structural checks; export disabled while errors exist.

## 2. What the BACKUP (A.Y. 2025-26) has that the target needs
A ~60-sheet, **tab-per-schedule** build with a **per-sheet `emit()` JSON contributor** architecture (68 emitters `:301`) and **387 categorized validations** (`E('A'|'B'|'D')`). It covers, as full schedules with granular JSON: Part A-General/GEN2, Subsidiary details, 139(8A)/ITR-U, Nature of Business, **Balance Sheet**, **Manufacturing/Trading/P&L** (+ **Ind AS** variants — Sch III Div II, 188 leaves `:2458`), **Quantitative Details (QD)**, HP, **DPM/DOA/DEP/DCG** depreciation set, **BP** (CorpScheduleBP), **ESR**, **10AA** SEZ, **CG** with **112A/115AD/VDA** sub-schedules, OS, **CFL/UD/CYLA/BFLA/ICDS**, deduction schedules **80G/80GGA/RA/80-IA/IB/IC/IAC/GGC/80M/80LA/VIA**, **SI/IF/EI/PTI**, **MAT (115JB)/MATC (115JAA ledger)/BBS (115QA)/TPSA (92CE)/115TD/FSI/TR/FA/SH/AL/GST/FD**, Part B-TI/TTI, **IT/TDS-2/TDS-3/TCS** credit schedules, Verification. It cross-validates (e.g. Sch 112A total = Sch CG B5 `:6134`; DEP → BP row 12i). But it is stamped `AssessmentYear:'2025'` (`:305`) — a prior-year build.

## 3. GAP LIST — to make ITR-6 filing-ready for A.Y. 2026-27 (the pending work)

**A. JSON export is rolled-up totals, not CBDT-schema detail (biggest gap).** `buildJSON()` (`:2720`) emits only summaries:
- `PARTA_BS` → only `TotalLiabilities` + `TotalAssets` (`:2745`); no full B/S nodes.
- **No `PARTA_PL` / Manufacturing / Trading node at all** — P&L captured on screen, never exported.
- `ScheduleHP` → only total (`:2760`); `ScheduleCG` → only STCG/LTCG/total (no 112A/115AD/VDA/sale-wise); `ScheduleOS` → only `IncChargeable`.
- `PartB_TI` → head totals + single VIA/10AA totals; **no** `ScheduleVIA/SI/EI/CYLA/BFLA/CFL/UD` nodes.
- `MATDetails` summary only — no full `ScheduleMAT`/`ScheduleMATC`.
- **No `ScheduleIT`/`ScheduleTDS`/`ScheduleTCS` challan nodes** (captured in `tp_*` popups, not emitted).
- **No `ScheduleFA/AL/SH/GST/FD/PTI/115TD/FSI/TR`** in JSON.

**B. Granular schedules entirely ABSENT from the current build** (in backup, not current — no popup and no JSON): depreciation **DPM/DOA/DEP/DCG** (current has only one `bp_depit` total); **Schedule UD/ICDS/QD**; **BBS (115QA)/FSI/TR**; per-transaction CG **112A/115AD/VDA**; detailed deduction schedules **80G/GGA/RA/80-IA/IB/IC/IAC/GGC/80M/80LA** (current collapses all Ch VI-A into one `ti_via` popup); **Ind AS** BS/Mfg/Trading/P&L variants.

**C. Popups present but must become full emitted schedules for e-filing:** CYLA, BFLA, CFL, VIA, SI, EI, PTI, MAT, MATC, SH, AL, GST, FD, FA, 115TD, IT/TDS/TCS challans.

**D. Validation thin vs filing needs.** Current 26 field rules + ~10 structural checks vs backup's 387 categorized checks. Missing: cross-schedule tie-outs (only BS assets=liabilities exists `:2674`), CG sub-schedule reconciliations, BP↔DEP tie-out, VI-A eligibility under concessional regimes (only a soft warn), MAT applicability enforcement.

**E. Year currency.** The fuller backup is A.Y. 2025-26 (`:305`); the current is 2026-27. Bringing the backup's detail forward requires re-basing all dates/limits/schema to 2026-27 — it can't be dropped in as-is.

> **Existing reference material in this folder** (pre-dates this audit): `itr6-ay2025-26-layout.md` (31 KB) and `itr6-ay2025-26-schema.json` (95 KB) — the A.Y. 2025-26 ITR-6 layout + CBDT JSON schema. These are the concrete source for the port-forward + re-base described below.

## 4. Recommended path (for the CS-firm company clients)
The current shell + computation is a solid base. The pending build = **port the backup's granular schedules and its 68 per-schedule `emit()` JSON contributors into the current 2026-27 shell, and re-base to the 2026-27 CBDT ITR-6 schema**, then expand validation toward the categorized (Cat A/B/D) model. Since a CS firm's core clients are **companies (ITR-6)**, this is the highest-priority form to complete before the chairman relies on it for corporate filings. Until then, ITR-6 can compute + preview on screen but its JSON is **not portal-complete**.
