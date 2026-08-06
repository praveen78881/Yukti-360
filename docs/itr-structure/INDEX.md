# ITR MODULE — STRUCTURE CATALOG INDEX

Canonical resource manifest of the entire Income-Tax / ITR module in CA_studio — every screen, particular, drill-in, and field, extracted read-only (code walk + live UI walk) with verbatim labels. This is the backbone for three downstream campaigns: **bug mapping**, **official-JSON conformance**, and **portal-data import mapping**.

- **Extraction date:** 2026-08-04
- **App commit:** `7fb4ba4`
- **Method:** dual-source — per-tool DOM source (public/tax-utilities/itr*.html) cross-verified against the running app (localhost:7777) driven via Playwright/msedge. Zero code changes.
- **Entry point:** `src/app/company/[id]/income-tax/page.tsx` — router `IncomeTaxDashboard` (:698) → `IndividualItrView` (ITR-1..4, both AYs) / `StatutoryItrView` (ITR-5/6/7, AY 2026-27) → `ItrYearForms`; forms served as same-origin iframes via `itrSrc()` (:44-47).

## Per-ITR summary

| Form | File | Lines | Screens | Particulars | Drill-ins | Fields (≈) | Discrepancies | AYs |
|------|------|------:|--------:|------------:|----------:|-----------:|--------------:|-----|
| ITR-1 Sahaj | ITR-1.md | 608 | 4 | 34 | 66 | 600 | 18 | 2025-26, 2026-27 |
| ITR-2 | ITR-2.md | 327 | 4 | 32 | 31† | 253 | 7 | 2025-26, 2026-27 |
| ITR-3 | ITR-3.md | 379 | 5 | 39 | 58† | 450 | 12 | 2025-26, 2026-27 |
| ITR-4 Sugam | ITR-4.md | 305 | 4 | 33 | 26† | 212 | 8 | 2025-26, 2026-27 |
| ITR-5 | ITR-5.md | 911 | 5 | 108 | 94 | 797 | 13 | 2026-27 |
| ITR-6 | ITR-6.md | 495 | 3 (13 parts) | 56‡ | 120‡ | 997 | 12 | 2026-27 + 2025-26 backup |
| ITR-7 | ITR-7.md | 580 | 9 | 51 | 93† | 570 | 20 | 2026-27 |
| **Totals** | | **3,605** | **34** | **353** | **~491** | **~3,879** | **90** | |

Plus **COMPUTATION-COMMON.md** (245 lines) — the shared tax engine: **106** computation lines documented in display order, **27** engine functions mapped with file:line, **7** forms + **4** AY-2025-26 variants compared, and a per-ITR applicability matrix. Computed cells across the forms add a further ~65 (ITR-6) / 179 (ITR-5) ⚙ read-only cells beyond the editable-field counts above.

† **Drill-in count note:** the *Drill-ins* column is the agent's documented total (fully-headed `#### Drill-in` sections **plus** latent/shared drill-ins indexed inline in tables). Heading-only counts are lower (e.g. ITR-2 21, ITR-3 31, ITR-7 46) — the remainder are shared/latent subforms catalogued compactly, not omitted.
‡ **ITR-6 hierarchy:** ITR-6 uses a deeper structure (`## Screen → ### Part (13) → #### Particular (56) → ##### Drill-in (21 headed)`); its proof pass cross-checked **120** SPEC drill-keys and **997** editable fields, documented densely in tables rather than one heading per drill-in.

## Computation engine (COMPUTATION-COMMON.md) — key facts
- ITR-1/2/4 embed a **near-identical copy of ITR-3's** calc engine; the only differences are `display:none` rows (ITR-1/2 hide Business/Profession; ITR-1/4 hide non-112A CG) plus ITR-1's `window.__taxBreakup` export.
- ITR-7 carries the same engine inline but **regime-locked Old**, no salary/rel-89, adds `it_1113`.
- ITR-5 (firm: flat 30%, 12% surcharge) and ITR-6 (company: 115BA/BAA/BAB, MAT 115JB, pre/post-23-07-2024 CG split) have **independent engines**.

## Coverage verification (coordinator pass)
- **All 8 files present**, each following the mandated hierarchy (ITR-6 one level deeper for its Part grouping).
- **No double-claims:** no per-ITR file re-extracts the shared computation sheet — comp-line references are "Feeds"/ITR-specific additions only. The Computation Sheet was extracted once (COMPUTATION-COMMON.md).
- **No gaps:** every form ITR-1..7 × applicable AYs has its own full map; the shared engine is owned solely by COMPUTATION-COMMON.md.
- **ITR-5** completed after a transient network error (ENOTFOUND) — resumed from its completed source+UI walk; deliverable intact (911 lines).
- Each agent's self-check passed (particulars-on-screen = documented ✓); ITR-1/2/3/4/5/6 UI walks succeeded with zero page errors. **ITR-7's UI walk found the Computation view is inert at runtime** (see below) — a product defect, not an automation failure.

## Highest-signal discrepancies already surfaced (for the bug-mapping campaign)
- **ITR-7:** Computation view is **inert** — calc iframe inner script closed with literal `<\/script>` at `itr7.html:10619` never terminates under `doc.write` → SyntaxError → `computeAll` undefined → all computed values 0; `buildITR7Json` hard-codes all of Part B-TTI/TI to 0.
- **ITR-2/3/…:** missing `window.__taxBreakup` export (only ITR-1 has it) → Part B-TTI surcharge/cess/rebate export as 0 (the completeness fix already applied to ITR-1).
- **ITR-1 & ITR-4:** `chapVIA()` / `chapVIA4()` read non-existent per-section cells → Chapter VI-A exports zeros; ITR-4 `it_bp_income` never computed (presumptive business income stays 0).
- **ITR-5:** `preflight()` requires Assessee "Area / Locality" and "Flat / Door No." fields that have **no UI inputs** → export-ready state unreachable from the UI.
- **ITR-6:** least-complete emitter; MAT pink-out and 115BAA paths noted.
- AY-2025-26 files across several forms retain 2026-27 literals (ESOP year lists, "calendar year 2025", 234B/C date constants) — recorded verbatim, not judged.

## Files
`ITR-1.md` · `ITR-2.md` · `ITR-3.md` · `ITR-4.md` · `ITR-5.md` · `ITR-6.md` · `ITR-7.md` · `COMPUTATION-COMMON.md` · `INDEX.md`
