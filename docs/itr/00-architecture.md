# ITR Module — Architecture & Neuron Map

> Read-only documentation. No code was changed to produce this. Every claim is cited to `file:line`.
> **Scope:** the whole Income-Tax section of CA_studio — all 7 ITR types, both assessment years shipped, and how an *ITR Info Sheet* connects to the *Computation Sheet* and to the *e-filing JSON*.

---

## 0. The one-paragraph mental model

Each ITR form is a **self-contained offline utility** (a single large HTML+JS file under `public/tax-utilities/`). It owns three tabs — **Info Sheet** (`data-tab="info"`), **Computation Sheet** (`data-tab="comp"`), and **Summary** (`data-tab="summary"`) — plus its **Schedules** (drill-ins), its **tax computation**, its **validation** (`validateItr`), and its **ITD JSON generator** (`Form_ITRx`/`toJSON`, with `SchemaVer`). The React app (`income-tax/page.tsx`) is only a **host shell**: it picks the right form for the entity, loads it in an iframe, **prefills** master data, **autosaves/restores** every field to `entity_data` (cloud-mirrored), and builds an **AIS CSV from the books**. The shell does **not** compute tax or build the JSON — that all lives inside the HTML tool.

```
company.entity_type ──► Router ──► View ──► <iframe src=/tax-utilities/itrX.html>
                                     │                         │
                                     │  prefill master         ├─ Tab: Info Sheet  (data-tab="info")   ← particulars in
                                     │  restore snapshot        ├─ Tab: Computation (data-tab="comp")    ← derived numbers
                                     │  debounced autosave ◄────┤  Schedules (drill-ins, + Add rows)
                                     ▼                          ├─ validateItr()  → errors
                              entity_data (Supabase mirror)     └─ toJSON()/Form_ITRx → ITD e-filing JSON
```

---

## 1. Router — which form loads for which client

`income-tax/page.tsx:698` `IncomeTaxDashboard` (default export) branches on `company.entity_type`:

| Entity type | Forms | View | AYs |
|---|---|---|---|
| `individual` | ITR-1, ITR-2 | `IndividualItrView` (`:210`) | 2026-27 **and** 2025-26 |
| `sole_proprietorship` | ITR-3, ITR-4 | `IndividualItrView` | both |
| `huf` | ITR-2, ITR-3, ITR-4 | `IndividualItrView` | both |
| `partnership`, `llp`, `aop_boi`, `cooperative` | ITR-5 | `StatutoryItrView` (`:672`) | 2026-27 only |
| `pvt_ltd`, `opc`, `public_ltd` | **ITR-6** | `StatutoryItrView` | 2026-27 only |
| `trust`, `society`, `section8` | ITR-7 | `StatutoryItrView` | 2026-27 only |
| anything else | — | `LockedItrView` "Coming Soon" (`:616`) | — |

- `ENTITY_FORMS` map: `:61`. `STATUTORY_ITR` map: `:72`. `ENTITY_ITR_MAP` (labels for the locked view): `:86`.
- **Note (legacy/unused):** `CompanyItr6View` (`:423`) — an older ITR-6 view with a "final stages of deployment" notice and a `ca_tax_bridge`/`postMessage(HYDRATE_ITR)` calculator bridge — is **defined but not referenced by the router**. Companies today are served by the generic `StatutoryItrView` → `itr6.html`. (This confirms your "ITR-6 is pending": see §4.)

---

## 2. Assessment years & form files

`AY_LIST` (`:33`):
- **A.Y. 2026-27** (FY 2025-26) → module key `itr_ay2627`
- **A.Y. 2025-26** (FY 2024-25) → module key `itr_ay2526`

`itrSrc(ay, key)` (`:44`) resolves the iframe URL:
- **ITR-1..4** → year-specific file: `itrN.html` (A.Y. 2026-27) or `itrN-2025-26.html` (A.Y. 2025-26). → **both years shipped.**
- **ITR-5 / ITR-6 / ITR-7** → `itrN.html` only → **A.Y. 2026-27 only** (no year selector; `StatutoryItrView` uses `AY_LIST[0]`).

File inventory (`public/tax-utilities/`):

| Form | AY 2026-27 file | AY 2025-26 file | Size (26-27) | Status |
|---|---|---|---|---|
| ITR-1 | `itr1.html` | `itr1-2025-26.html` | ~2.5 MB | full |
| ITR-2 | `itr2.html` | `itr2-2025-26.html` | ~2.5 MB | full |
| ITR-3 | `itr3.html` | `itr3-2025-26.html` | ~2.6 MB | full |
| ITR-4 | `itr4.html` | `itr4-2025-26.html` | ~2.5 MB | full |
| ITR-5 | `itr5.html` | — | ~200 KB | 26-27 only |
| **ITR-6** | `itr6.html` | (`itr6-ay2526-backup.html` ~781 KB) | **~187 KB** | **PENDING — smallest file; see itr-6.md** |
| ITR-7 | `itr7.html` | — | ~737 KB | 26-27 only |

---

## 3. Persistence, prefill & AIS (the shell's real job)

**Field snapshot storage** — `entity_data` via offlineDb (auto-mirrored to Supabase):
- Save: `saveForm` (`:290`) → `upsertEntityData(companyId, moduleKey, itrKey, { fields, savedAt, ay })`.
- Restore: `onFrameLoad` (`:306`) → `getEntityData(companyId, moduleKey, itrKey)` → `applyFields`.
- **Key triple:** `(companyId, module = itr_ay2627 | itr_ay2526, section = itr1..itr7)`. So each (client × AY × form) is a separate record; switching AY remounts cleanly (`key={ay}`, `:247`).
- **Snapshot shape:** `{ fields: Record<fieldId, stringValue>, savedAt, ay }`. `collectFields` (`:180`) captures every `input/select/textarea` with an `id` (checkbox/radio → `'1'/'0'`). **Merge-over-previous** on save (`:299`) so dynamically-added Schedule rows are never lost.
- **Autosave:** debounced 1.5s on any `input`/`change` inside the iframe (`:322-332`); pending timers flushed on unmount (`:336-349`).

**Prefill from company master** — `prefillFromCompany` (`:143`) fills only-empty fields via `setIfEmpty` (`:119`): `cl_*` (universal, incl. ITR-4/5/7), `asr_*` (full assessee master, ITR-1/2/3), `vfr_*` (verifier; Karta for HUF). Dates normalised to DD/MM/YYYY by `toDDMMYYYY` (`:101`).

**AIS from books** — `downloadAisFromBooks` (`:274`) → `buildAisCsvFromBooks` (`src/lib/accounting/aisExport.ts`) over the FY's journal → CSV → user loads it via the form's own **Import AIS** button. (Bridge is CSV today; not a portal AIS/26AS API pull.)

---

## 4. What is NOT in the shell (lives inside each HTML tool)

The shell never computes tax or emits JSON. Inside each `itrX.html`:
- **Info Sheet** (`data-tab="info"`) — the data-entry particulars (see each `itr-N.md`).
- **Computation Sheet** (`data-tab="comp"`) — derives heads → GTI → Chapter VI-A → total income → tax → rebate 87A → surcharge → cess → taxes paid → refund/payable, old vs new regime.
- **Schedules** — drill-in tables with **`+ Add`** repeatable rows.
- **`validateItr()`** + `errors.push(...)` + `required` fields — pre-JSON validation.
- **`toJSON()` / `Form_ITRx`** with `SchemaVer` — the **ITD e-filing JSON** (this is the "validates on the portal" artifact).

> **How the neuron fires:** an *Info Sheet* field id (e.g. `sal_gross`) is (a) read by the *Computation Sheet* to derive a number, and (b) written by `toJSON()` into an ITD JSON key path. The exact per-field wiring for each form is in `itr-N.md`; the cross-form mapping + validation rulebook is in `mapping-info-json-computation.md`.

---

## 5. Filing reality (important for the CS-firm use case)

- The tools **generate the ITD JSON** and validate it locally. **Actual filing** = the CS uploads that JSON to the income-tax e-filing portal and verifies with **DSC** (mandatory for companies/audit cases — ITR-6, audited ITR-5) or **Aadhaar/EVC OTP**.
- There is **no open GSP-style filing API** for income tax; programmatic in-app filing would require the firm to be a registered **ERI (e-Return Intermediary)**. Today's module is **generate-valid-JSON → portal-upload**, which needs no registration.

---

*Companion files in this folder:* `itr-1.md` … `itr-7.md` (per-form particulars, schedules, computation, JSON, validation) and `mapping-info-json-computation.md` (the cross-cutting Info ↔ JSON ↔ Computation map + validation rules).
