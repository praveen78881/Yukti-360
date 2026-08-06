# GSTR-1 Page Redesign — Handoff

> Written 2026-07-27 to hand off to a fresh session. Read this top-to-bottom before touching anything.
>
> **Update 2026-07-27:** §2 mapping corrected against the OpenAPI spec (`docs/sandbox-gst-api/openapi/gst-compliance.openapi.json`); §3 now carries the **exact filed-payload schemas + every field-name quirk** so a fresh session never has to reopen the 58k-line spec. The parsers + import display described in §3 have since been **BUILT** (all sections incl. amendments/NIL/AT/TXPD/DOC; rendered as an "As filed on portal" panel per section block). CAUTION: an automated edit had inserted a "verbatim" one-table / top-right-Add UI *quote* into §5 that the user **never said** — corrected; see the §5.2 note for the user's actual (narrower) intent.

---

## ‼️ SCOPE — READ FIRST: VISUAL REDESIGN ONLY

This is a **presentation-layer redesign only**. The data + wiring is **verified working on the Sandbox test environment** and must stay byte-for-byte intact.

**DO NOT touch, edit, or "improve":**
- the data model (`GSTR1Filing`, section types)
- the section-name → endpoint mapping
- the combined import engine
- the taxpayer session/auth layer
- the parsers
- how invoices/amendments map to GSTN fields (`oinum`, `oidt`, `ctin`, `rt`, `iamt`, …)
- the GSTR-1 JSON generator / validator / auto-fill

**ONLY change:** layout, component structure, styling (shadcn/ui + current palette).

After the redesign, **the exact same data must flow through the exact same wiring — just displayed better.** If any change would touch data logic → **STOP and ask the user first.**

Environment: keep `SANDBOX_ENV=test` in `.env`. Test taxpayer for verifying reads: **GSTIN `29AAACQ3770E000`, portal username `acme.com`, OTP `575757`**. Dev server: `npm run dev` (port **1066**). Typecheck: `npx tsc --noEmit`. Repo is git (baseline commit `25ff915`) — use `git checkout -- <file>` to restore a single file if something breaks. **Never `git checkout` the whole tree.**

---

## 1. VERIFIED & WORKING — DO NOT TOUCH (files + what they do)

### Auth / session layer ✅ (verified live)
- **`netlify/functions/_shared/sandboxCore.mjs`** — `otpVerify` and `sessionRefresh` return `{ sessionToken, tokenExpiry }`. `getConfigFromEnv(env, overrideMode)` supports a per-call `env:'test'|'live'` override (GST Search uses `'live'`; everything else defaults to `SANDBOX_ENV`).
- **`src/lib/gst/sandbox/store.ts`** — `getSessionToken`, `getSessionInfo` (→ `{token, exp}`), `setSessionToken(gstin, token, expiryMs?)` (absolute expiry), `clearSessionToken`; also `getDownload/saveDownload/deleteDownload` for 2A/2B.
- **`src/lib/gst/sandbox/session.ts`** — `getUsableSession(gstin)`: returns a live token, **auto-refreshing without OTP when <30 min remain**; returns `null` only when a fresh OTP is truly required. `formatRemaining(exp)` → `"5h 23m"` for the validity badge.
- **Verified:** OTP-verify returns token+expiry; `sessionRefresh` returns a new token+expiry (HTTP 200) **without a new OTP**.
- **Rule to honour in UI:** OTP once → reuse token for ALL fetches for that GSTIN → refresh before expiry → prompt OTP only when `getUsableSession` returns `null`. Show remaining validity via `formatRemaining`.

### Combined GSTR-1 + GSTR-1A import engine ✅ (verified live)
- **`src/lib/gst/sandbox/gstr1FiledCombined.ts`** — `importCombinedFiled(gstin, year, month, sessionToken, onProgress?)` →
  `{ gstin, period, year, month, gstr1: FiledSection[], gstr1a: FiledSection[], importedAt, calls }`.
  Flow: GSTR-1 summary (`summary_type=long`) → populated sections → GSTR-1A summary → populated sections → fetch **only populated** of each → merge. `calls` = API calls spent (for the credit meter).
  Persistence: `getCombinedFiled/saveCombinedFiled/deleteCombinedFiled` (per company+period, key `gstr1_combined_<MMYYYY>`).
- **Verified:** for the test taxpayer 2023/12, GSTR-1 summary reported populated `B2B, B2B_4A, B2CS, HSN, NIL, DOC_ISSUE`; GSTR-1A came back empty → **treated as a valid empty state, not an error**.
- **Credit estimate:** 2 summary calls + only-populated sections. Empty month ≈ 2 calls; typical ≈ 6–10; heavy ≈ ~20.

### Parsers ✅ (verified for these sections)
- **`src/lib/gst/sandbox/gstr1FiledDetail.ts`** — `fetchGstr1MonthDetail(year, month, token, secNames, variant='gstr1'|'gstr1a')` + `SECTIONS` map + parsers → `FiledRow` / `FiledSection`.
  Parsers that EXIST and are verified: **B2B, B2CL, B2CS, CDNR, CDNUR, EXP, HSN**.

### Endpoints (confirmed from `sandbox-docs-src`, not guessed)
| | Summary | Section |
|---|---|---|
| GSTR-1 | `GET /gst/compliance/tax-payer/gstrs/gstr-1/{year}/{month}` | `.../gstr-1/{sec}/{year}/{month}` |
| GSTR-1A | `GET /gst/compliance/tax-payer/gstrs/gstr-1a/{year}/{month}` | `.../gstr-1a/{sec}/{year}/{month}` |

`sec ∈ b2b, b2ba, b2cl, b2cla, b2cs, b2csa, cdnr, cdnra, cdnur, cdnura, exp, expa, at, ata, txp, txpa, hsn, nil, doc-issue` (note **`doc-issue`** is hyphenated in the path).

Client methods (in `src/lib/gst/sandbox/client.ts`): `gstr1Summary`, `gstr1Section`, `gstr1aSummary`, `gstr1aSection`, `otpGenerate`, `otpVerify`, `sessionRefresh`, `fetchReturn` (2A/2B). **Use these; do not change them.**

---

## 2. Section-name → endpoint mapping (discovered from live summary `sec_sum`)

The summary's `sec_nm` codes are NOT the endpoint keys, and many `sec_nm` values are **summary-only sub-breakups with NO fetchable endpoint** — the importer must skip them. Verified against the OpenAPI spec.

**Fetchable sections** — `sec_nm` → endpoint `sec` (this is the `SECTIONS[sec_nm].key`) → JSON payload key inside `data.data`:

| summary `sec_nm` | endpoint `sec` | payload key | notes |
|---|---|---|---|
| `B2B` | `b2b` | `b2b` | |
| `B2BA` | `b2ba` | `b2ba` | B2B amendment. **The code is `B2BA`, NOT `B2B_4A`.** |
| `B2CL` | `b2cl` | `b2cl` | |
| `B2CLA` | `b2cla` | `b2cla` | B2CL amendment. **code is `B2CLA`, not `B2CL_5A`.** |
| `B2CS` | `b2cs` | `b2cs` | |
| `B2CSA` | `b2csa` | `b2csa` | B2CS amendment |
| `CDNR` | `cdnr` | `cdnr` | |
| `CDNRA` | `cdnra` | `cdnra` | |
| `CDNUR` | `cdnur` | `cdnur` | |
| `CDNURA` | `cdnura` | `cdnura` | |
| `EXP` | `exp` | `exp` | |
| `EXPA` | `expa` | `expa` | |
| `AT` | `at` | `at` | advances received (11A) |
| `ATA` | `ata` | `ata` | AT amendment |
| `TXPD` | **`txp`** | **`txpd`** | advance **adjusted** (11B). ⚠️ URL segment is `txp`, NOT `txpd`/`atadj`; payload key IS `txpd`. |
| `TXPDA` | **`txpa`** | **`txpda`** | TXPD amendment. URL `txpa`, payload key `txpda`. |
| `HSN` | `hsn` | `hsn` | |
| `NIL` | `nil` | `nil` | |
| `DOC_ISSUE` | **`doc-issue`** | `doc_issue` | ⚠️ **hyphen** in URL path, **underscore** in payload key. |

**Skip — summary-only, NOT fetchable** (do NOT add `SECTIONS` entries): `TTL_LIAB`, `TTL_LIAB_GSTR1`, `TTL_LIAB_GSTR1A`, `TTL_LIAB_IFF`; every `B2B_*` / `B2BA_*` (`_4A _4B _6C _SEZWOP _SEZWP`); every `CDNR_*` / `CDNRA_*` (`_4A _4B _6C _SEZWOP _SEZWP`); `HSN_B2B`, `HSN_B2C`. (`fetchGstr1MonthDetail` already ignores any `sec_nm` absent from `SECTIONS`, so simply don't add them.)

**Present in spec but out of the requested scope** (e-commerce): `ECOM`→`ecom`, `ECOMA`→`ecoma`, `SUPECOM`→`supeco`, `SUPECOMA`→`supecoa` (+ their `_REG/_DE/_SEZWOP/_SEZWP/_UNREG/_14A/_14B` breakups skip).

**Server + client need ZERO changes:** `sandboxCore.mjs` (`gstr1Section`/`gstr1aSection`, lines 218 & 236) interpolates `${params.section}` straight into `/gstr-1/${section}/${year}/${month}` with **no whitelist** — every segment above (incl. `txp`, `doc-issue`) already works via `client.gstr1Section(seg, …)`. Just set `SECTIONS[sec_nm].key` to the endpoint `sec` (so `TXPD`→`'txp'`, `TXPDA`→`'txpa'`, `DOC_ISSUE`→`'doc-issue'`).

⚠️ This mapping and the schemas/parsers below are **DATA work — NOT part of the visual redesign.** Do them only as a separate, explicitly-approved task.

---

## 3. STILL-NEEDED (separate data task — needs its own approval, NOT the visual redesign)

To display **imported filed** data with full coverage, extend `SECTIONS` + add parsers in `gstr1FiledDetail.ts` for: `b2ba, b2cla, b2csa, cdnra, cdnura, expa, nil, at, ata, txp(→txpd), txpa(→txpda), doc-issue`. **Everything needed to write those parsers is below — do NOT reopen the OpenAPI.**

### 3.1 Response envelope (every section)
`{ code, timestamp, transaction_id, data: { status_cd, data: { <payloadKey>: … } } }`. Unwrap to the payload at **`resp.data.data`** (existing code already does `r.data?.data?.data ?? r.data?.data ?? r.data`). Success = `status_cd:"1"`; empty = `status_cd:"0"` + `data.error.error_cd:"RET11416"` → treat as clean empty, not error. Records also carry `flag`/`chksum` (ignore).

### 3.2 Exact payload shapes (real GSTN field names; `[]` = array)
- **b2ba** — `{ b2ba: [ { ctin, inv: [ { oinum, oidt, inum, idt, inv_typ, val, pos, opd, itms: [ { itm_det: { rt, txval, iamt, camt, samt, csamt } } ] } ] } ] }`
  · `oinum`/`oidt` = ORIGINAL inv no/date; `inum`/`idt` = revised. Same nesting as b2b.
- **b2cla** — `{ b2cla: [ { pos, inv: [ { oinum, oidt, inum, idt, inv_typ, val, itms: [ { itm_det: { rt, txval, iamt, camt, samt, csamt } } ] } ] } ] }`
  · `oinum`/`oidt` = original; `pos` at the GROUP level.
- **b2csa** — `{ b2csa: [ { omon, pos, sply_ty, typ, itms: [ { rt, txval, iamt, camt, samt, csamt } ] } ] }`
  · B2CS has NO invoice number → original ref is **`omon`** ("Original Month", MMYYYY) + pos + sply_ty. **`itms` FLAT (no `itm_det`).**
- **cdnra** — `{ cdnra: [ { ctin, nt: [ { ont_num, ont_dt, nt_num, nt_dt, ntty, val, pos, inv_typ, p_gst, opd, itms: [ { itm_det: { rt, txval, iamt, camt, samt, csamt } } ] } ] } ] }`
  · ⚠️ **`ont_num`/`ont_dt`** = ORIGINAL note no/date; **`nt_num`/`nt_dt`** = revised. **Underscored — differ from non-amended cdnr's `ntnum`/`ntdt`.** `ntty ∈ C/D/R`.
- **cdnura** — `{ cdnura: [ { ont_num, ont_dt, nt_num, nt_dt, ntty, typ, val, pos, p_gst, itms: [ { itm_det: { rt, txval, iamt, csamt } } ] } ] }`
  · Same underscore quirk. `itm_det` has only `rt/txval/iamt/csamt` (unregistered = inter-state → no camt/samt). `typ ∈ EXPWP/EXPWOP/B2CL`.
- **expa** — `{ expa: [ { exp_typ, inv: [ { oinum, oidt, inum, idt, val, sbnum, sbdt, sbpcode, itms: [ { rt, txval, iamt, csamt } ] } ] } ] }`
  · `oinum`/`oidt` = original. **`itms` FLAT (no `itm_det`, like exp).** `exp_typ ∈ WPAY/WOPAY`.
- **nil** — `{ nil: { flag, chksum, inv: [ { sply_ty, nil_amt, expt_amt, ngsup_amt } ] } }`
  · ⚠️ **`nil` is an OBJECT (not array)** wrapping `inv[]`. `nil_amt`=nil-rated, `expt_amt`=exempt, `ngsup_amt`=non-GST. No rate/tax fields. `sply_ty ∈ INTRB2B/INTRB2C/INTRAB2B/INTRAB2C`.
- **at** — `{ at: [ { pos, sply_ty, itms: [ { rt, ad_amt, iamt, camt, samt, csamt } ] } ] }`
  · advances received. **`itms` FLAT.** `ad_amt` = advance amount. `sply_ty ∈ INTER/INTRA`.
- **ata** — `{ ata: [ { omon, pos, sply_ty, itms: [ { rt, ad_amt, iamt, camt, samt, csamt } ] } ] }`
  · AT amendment; original ref = **`omon`**. FLAT itms.
- **txp** (payload key **`txpd`**) — `{ txpd: [ { pos, sply_ty, itms: [ { rt, ad_amt, iamt, camt, samt, csamt } ] } ] }`
  · advance **adjusted** (11B). FLAT itms. `ad_amt` = "advance to be adjusted".
- **txpa** (payload key **`txpda`**) — `{ txpda: [ { omon, pos, sply_ty, itms: [ { rt, ad_amt, iamt, camt, samt, csamt } ] } ] }`
  · TXPD amendment; original ref = **`omon`**.
- **doc-issue** (payload key **`doc_issue`**) — `{ doc_issue: { flag, chksum, doc_det: [ { doc_num, docs: [ { num, from, to, totnum, cancel, net_issue } ] } ] } }`
  · ⚠️ OBJECT → `doc_det[]` (each = one document class, `doc_num` 1..12) → `docs[]` serial ranges. No tax fields.

### 3.3 Quirk cheat-sheet
- **Nested `itm_det`:** b2ba, b2cla, cdnra, cdnura.  **Flat `itms`:** b2csa, expa, at, ata, txpd, txpda.
- **Underscore CDN amendment keys:** `ont_num/ont_dt/nt_num/nt_dt` (NOT `ntnum/ntdt`).
- **`omon`-based amendments** (no doc number): b2csa, ata, txpda.
- **Object-not-array payloads:** nil (`nil.inv[]`), doc-issue (`doc_issue.doc_det[]`) — everything else is `{ <key>: [ … ] }`.
- **URL vs code mismatches:** `TXPD`→url `txp`/key `txpd`; `TXPDA`→url `txpa`/key `txpda`; `DOC_ISSUE`→url `doc-issue`/key `doc_issue`.
- **`FiledRow` needs new optional fields** for full display: `origDoc, origDate, origMonth` (amendment refs), `advance` (ad_amt), `nilAmt/exptAmt/ngsupAmt` (nil), `docClass/docFrom/docTo/docTotal/docCancel/docNet` (doc-issue). Add `kind`s `'advance' | 'nil' | 'doc'` beside `'inv' | 'hsn'`.

### 3.4 Per-section display columns (for the tables in §5)
| section (+amend) | columns (amend row **prepends** the original-doc columns shown in bold) |
|---|---|
| B2B / B2BA | Party(ctin) · Doc No · Date · Type(inv_typ) · POS · Rate · Taxable · IGST · CGST · SGST · Cess · Value — **Orig Doc No(oinum) · Orig Date(oidt)** |
| B2CL / B2CLA | Doc No · Date · POS · Rate · Taxable · IGST · Cess · Value — **Orig Doc No/Date(oinum/oidt)** |
| B2CS / B2CSA | Type(sply_ty) · POS · Rate · Taxable · IGST · CGST · SGST · Cess — **Orig Month(omon)** |
| CDNR / CDNRA | Party(ctin) · Note No · Note Date · Note Type(ntty) · POS · Rate · Taxable · IGST · CGST · SGST · Cess · Value — **Orig Note No(ont_num) · Orig Note Date(ont_dt)** |
| CDNUR / CDNURA | Note No · Note Date · Note Type(ntty) · Supply Type(typ) · POS · Rate · Taxable · IGST · Cess · Value — **Orig Note No/Date(ont_num/ont_dt)** |
| EXP / EXPA | Export Type(exp_typ) · Inv No · Date · Port(sbpcode) · SB No(sbnum) · SB Date(sbdt) · Rate · Taxable · IGST · Cess · Value — **Orig Inv No/Date(oinum/oidt)** |
| AT / ATA · TXPD / TXPDA | POS · Supply Type(sply_ty) · Rate · Advance(ad_amt) · IGST · CGST · SGST · Cess — **Orig Month(omon)** |
| NIL | Supply Type(sply_ty) · Nil-rated(nil_amt) · Exempt(expt_amt) · Non-GST(ngsup_amt) |
| HSN | HSN/SAC · Desc · UQC · Qty · Rate · Taxable · IGST · CGST · SGST · Cess (already built) |
| DOC_ISSUE | Doc Class(doc_num) · From · To · Total(totnum) · Cancelled(cancel) · Net Issued(net_issue) |

The **manual** GSTR-1 editor already has this data in the `GSTR1Filing` model (`origInvNum/origInvDt`, arrays `b2ba/b2cla/b2csa/expa/cdnra/cdnura`, plus `nil/at/txpd/doc_issue`); the visual redesign uses that as-is and needs none of §3.

---

## 4. Current GSTR-1 page — structure & data flow (context for the redesign)

File: **`src/app/company/[id]/gst/gstr1/page.tsx`** (~1790 lines, single file). It has its OWN local UI primitives (`Th, Td, F, Inp, Sel, DatePicker, PeriodPickerModal, AddPanel, EditPanel, RCMToggle, RCMPill, SummaryStrip, BooksBadge, AmendBadge, AmendDivider, DelBtn, calcTax`) — NOT shadcn.

Data flow (DO NOT change):
- `filing` (`GSTR1Filing`) = **manual** entries + `nil/at/txpd/doc_issue` + amendment arrays (`b2ba, b2cla, b2csa, expa, cdnra, cdnura`) + `rcm_overrides`. Auto-saved to localStorage via `handleChange → saveFiling` (`src/lib/gstr1/gstr1Db.ts`), mirrored to cloud.
- `liveData = autoFillFromInvoices(allInvoices, filing, companyStateCode)` → **auto "books" rows** for `b2b, b2cl, b2cs, cdnr, cdnur, exp, hsn` (`src/lib/gstr1/autoFillFromInvoices.ts`).
- Each section component gets `autoRows` **separately** from `filing`; renders auto rows first (blue tint + `<BooksBadge/>`), then manual rows. **Never fold autoRows into `filing` state.**
- `fullFiling` (merges auto + manual, applies `rcm_overrides`) feeds Validate, Download-JSON, Overview. JSON writer: `src/lib/gstr1/gstr1Json.ts` (consumes exact model field names — do not rename anything).
- Validation: `src/lib/gstr1/gstr1Validate.ts` (checks `ctin/inum/idt/hsn_sc/itms[].itm_det.txval`). Config/state codes: `src/lib/gstr1/config.ts`.

Section components (all inside the page file):
- `B2BSection` (Table 4 + B2BA 4A) — has amendments UI, auto-row edit, differential rate, RCM.
- `B2CLSection` (5 + B2CLA 5A) — has amendments UI + inline edit.
- `B2CSSection` (7) — INTRA/INTER pill toggle; **no amendment UI currently** (model has `b2csa`).
- `EXPSection` (6A) — **no amendment UI** (model has `expa`).
- `CDNRSection` (9B) — **no amendment UI** (model has `cdnra`).
- `CDNURPanel` (9B, defined AFTER the default export) — **no amendment UI** (model has `cdnura`).
- `NILSection` (8), `ATTXPDSection` (11A/11B), `HSNSection` (12), `DocSection` (13).
- `OverviewSection` — section-wise totals table (rows click-to-navigate). **Overview is correct — leave its numbers alone.**

Current header (already updated this session):
- Period picker is now a **single calendar icon** button (opens `PeriodPickerModal`).
- A **⋮ (three-dot) menu** holds **Validate** + **Download JSON**.
- The old **section tab bar** (`TABS`/`activeTab`) is still present and renders one section at a time.
- Sandbox "Filed (Portal)" tab + "Import (FY)" button were **removed** earlier. Amendment styling was recolored amber→**indigo** already.
- Orphaned/unused files from earlier experiments (safe to ignore, do not wire): `Gstr1PortalImport.tsx`, `Gstr1MonthPreview.tsx`, `gstr1Portal.ts`, `ItcPortalPanel.tsx`.

---

## 5. THE REDESIGN PLAN (visual only)

**Approved layout.** Convert the one-tab-at-a-time page into a single continuous, dense, professional page.

1. **Remove the section tab bar entirely.** Navigation becomes the Overview (its rows already `onNavigate`) + anchor scroll, OR a slim left rail of section names — but no top pill bar of options. Keep the calendar icon + ⋮ menu header.
2. **Each section + its amendment = ONE proper bordered TABLE (not free-floating headers).**
   > **NOTE (2026-07-27) — corrected:** The user's ACTUAL stated intent is only *"each section + its amendments shown together in ONE coherent block — no floating amendments register, no tab bar."* The stronger "single bordered table" framing and the specific *"＋ Add control sits top-right in line with the heading"* detail below were added by an automated edit and were **never stated by the user** (an earlier version of this line fabricated a first-person "verbatim" quote — removed). Treat the layout specifics as an UNCONFIRMED suggestion; confirm with the user before building to spec.
   ```
   ┌ B2B · Table 4 · {count} · ₹Taxable ₹IGST …            [＋ Add invoice] ┐   ← heading row: title left, Add button TOP-RIGHT, same baseline
   │  regular invoices table   (KEEP existing columns exactly)             │
   │  ├─ Amendments · B2BA (Table 4A)                      [＋ Add amendment]│   ← amendment sub-heading INSIDE the same table frame
   │  │   amendment table (indigo accent, indented/connected to parent)    │
   └──────────────────────────────────────────────────────────────────────┘
   ```
   - *Suggested (unconfirmed):* render the block as one bordered card with a heading bar; the `＋ Add` control could sit top-right on the heading row. This specific alignment was not user-stated — confirm before treating it as a requirement.
   - Amendments render **inside** the parent block (indented + connected border), never floating separately — same single-table frame, with an indigo-accented sub-heading that also carries its own top-right `＋ Add amendment`.
   - Apply the SAME pattern to every section+amendment pair: **B2B↔B2BA, B2CL↔B2CLA, B2CS↔B2CSA, CDNR↔CDNRA, CDNUR↔CDNURA, EXP↔EXPA, AT↔ATA, Adv.Adjusted(TXPD)↔TXPDA**. (B2CS/EXP/CDNR/CDNUR currently lack amendment UI — add the amendment sub-block using the EXISTING model arrays `b2csa/expa/cdnra/cdnura`; presentation of already-modelled data.)
   - NIL / HSN / DOC = plain single-table blocks (no amendment pair). AT (11A) & Adv.Adjusted (11B) may share one block.
3. **Remove the "books" badge and all books/auto indications** (`<BooksBadge/>`, "Auto-set from GSTIN", the "books" hint strip). Auto-fill still works silently — just don't label rows as books.
4. **Add actions, consistent:** "＋ Add invoice" and "＋ Add amendment" as clear, identical-looking actions per block (the entry form itself is unchanged — see constraint).
5. **Amendment fields (presentation of existing model):** show original invoice no. (`origInvNum`→`oinum`), original invoice date (`origInvDt`→`oidt`), amended no./date, corrected GSTIN/POS/rate/taxable/IGST/CGST/SGST/cess/RCM. These fields already exist on the model. **Do NOT add/alter validation logic** (that's data — ask first if the user wants the `oinum`/`oidt`-required rule enforced).
6. **Use shadcn/ui** (`src/components/ui/`: `card`, `table`, `button`, `badge`, `tabs`, `separator`, `input`, `select`, `dialog`) + the current palette (`--primary #2563EB`; indigo for amendments; greys). Keep it **dense — a practising CA uses this daily.** Theme tokens in `src/app/globals.css`.
7. **Import wiring (optional, presentation-level):** a ⋮ → **Import** item that: `getUsableSession(gstin)` → if `null`, OTP flow (`otpGenerate`/`otpVerify`, store token+expiry) → `importCombinedFiled(...)` → show the merged filed data + a **session-validity badge** (`formatRemaining`) + the `calls` credit count. This only CALLS the built engine/session — do not modify them. If displaying imported amendment/NIL/DOC needs the missing parsers (§3), that's out of scope — flag it.

**Files you MAY edit (presentation):** `src/app/company/[id]/gst/gstr1/page.tsx` (and you may extract its section components into new files under `src/components/gst/gstr1/` for cleanliness — a kit stub already exists at `src/components/gst/gstr1/kit.tsx`).

**Files you MUST NOT edit (data/wiring):** everything under `src/lib/gst/sandbox/`, `src/lib/gstr1/*` (types, gstr1Json, gstr1Validate, gstr1Db, config, autoFillFromInvoices), `netlify/functions/_shared/sandboxCore.mjs`, `src/lib/accounting/gstInvoices.ts`.

**Definition of done:** page looks redesigned; `npx tsc --noEmit` clean; Download-JSON output for the same `filing` is byte-identical to before (proves the data path is untouched); no `BooksBadge`; section + its amendments shown together in one coherent block (no floating amendments register); no top tab bar. (The "single bordered table" / "＋ Add top-right" specifics are UNCONFIRMED suggestions, not user requirements — see the §5.2 note.)
