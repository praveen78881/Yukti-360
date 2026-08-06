# GSTR-1 Command Center — Compatibility Audit (Part 1)

**Date:** 2026-07-29 · **Scope:** data model, forms, builder, filing pipeline, session layer vs the production-proven requirements in the mission brief. **Status: REPORT ONLY — no code changed.** Awaiting review before any edit.

**Method:** direct read of the core transform trio (`types.ts`, `gstr1Json.ts`, `gstr1Validate.ts`, `autoFillFromInvoices.ts`) + read-only agent sweeps of the 2400-line page forms, the filing pipeline, and downstream consumers. File:line citations are current as of today.

---

## ⚠️ CRITICAL CONFLICT TO RESOLVE FIRST — HSN flat vs split

The mission requires the **HSN Phase-3 SPLIT** (`hsn_b2b` / `hsn_b2c`). The code today does the **exact opposite on purpose**: it emits **flat** `hsn:{ data:[…] }` and the pre-check **actively rejects** the split as an error.

That flat shape was a deliberate fix (memory `gstr1-save-ret191106` #3): the Sandbox **TEST mock**'s OpenAPI `SaveGstr1Request` + `error_report.hsn` (`additionalProperties:false`) accept only `hsn:{data:[]}`, and sending the split tripped `RET191106`. **The split is the real GSTN Phase-3 production schema; the flat shape is what the Sandbox test mock wanted.** The mission asserts production is authoritative ("production-proven … end to end").

**This is a genuine reversal, not a small gap.** Porting the split will: (a) rewrite the HSN emitter, (b) invert the pre-check rule (require split, reject `data:[]`), (c) require the auto-compute to actually split by buyer-registration, and (d) potentially re-break the Sandbox TEST "Prove Save" path (which validates against the mock). **I need your explicit confirmation that the production target uses `hsn_b2b/hsn_b2c`** before touching this — because the current code has a comment and a validator rule asserting the opposite, both citing a real (test-env) RET191106.

Good news: a **correct split emitter already exists in-repo but is dead code** — `buildGSTR1JSON` in `src/lib/accounting/gstInvoices.ts:1675` splits HSN by `gstr1_table` (`gstInvoices.ts:2101-2130`) into `hsn_b2b/hsn_b2c`. Nothing imports it. It's a ready reference for the port.

---

## Table 1 — HSN Phase-3 split + SAC rule (the crux)

| Item | Current (file:line) | Required | GAP | Size |
|---|---|---|---|---|
| HSN split routing field | `HSNSummary.supplyClass?: 'B2B'\|'B2C'` exists — `types.ts:140` | Per-row B2B/B2C tag | Field exists ✓ but **defaults `'B2C'` and is never read by the builder** | — |
| Auto-compute splits by buyer-registration | Aggregates ALL sales lines keyed by `code\|rate`, **drops buyer** — `autoFillFromInvoices.ts:77`; never sets `supplyClass` — `autoFillFromInvoices.ts:201-215` | Key HSN by (code, rate, **supplyClass**), where B2B invoice (has buyer GSTIN / `gstr1_table='B2B'`) → `hsn_b2b`, else `hsn_b2c` | **No split.** B2B + B2C merged into one row. Linkage (`inv.gstr1_table`, `inv.buyer_gstin`) is available but unused for HSN | **L** |
| Builder emits split | Emits **flat** `hsn:{ data: filing.hsn.map(hsnRow) }` — `gstr1Json.ts:136`; `hsnRow` has no `supplyClass` — `gstr1Json.ts:22-36` | `hsn:{ hsn_b2b:[…], hsn_b2c:[…] }` | **Wrong shape** — flat, split-blind | **M** |
| Pre-check enforces split | **Rejects** `hsn_b2b/hsn_b2c`, **requires** `data:[]` — `gstr1Validate.ts:203-204` (and 198-215) | REQUIRE split, REJECT `data:[]` | **Inverted rule** — must be flipped | **M** |
| SAC (99xxxx) rule | No SAC detection anywhere. HSN code is one free-text field — `page.tsx:1301`. Auto sets `uqc = item.uqc \|\| 'NOS'`, real `qty` — `autoFillFromInvoices.ts:78` | SAC `99xxxx` → `uqc:'NA'`, `qty:0` | **Absent** in form, auto-compute, and emitter | **M** |
| Reference implementation | `buildGSTR1JSON` splits correctly — `gstInvoices.ts:2101-2130` — but **unused/dead** (no importer) | (used for the port) | Not wired; keys off `gstr1_table` not buyer-GSTIN presence | port source |

---

## Table 2 — Envelope, dates, itm_det, proven section shapes, key hygiene

| Item | Current (file:line) | Required | GAP | Size |
|---|---|---|---|---|
| Envelope `{gstin, fp, gt, cur_gt}` | Emits `gstin`, `fp`, `gt?`, `cur_gt?` — `gstr1Json.ts:48-53`; accepted top-level set — `gstr1Validate.ts:123-129` | Same, **gstin required** | Minor: `gstin` emitted unconditionally but **not asserted non-empty**; note a prior test example (`saveExample`) *omitted* gstin (session identifies taxpayer) — confirm prod wants it present | **S** |
| `version`/`hash` leakage | Generator emits `version`+`hash` — `gstr1Json.ts:50-51` (doubles as offline-JSON download); stripped **only on the Save path** in `EFileModal`; pre-check flags them — `gstr1Validate.ts:155-158` | Never in Save body | OK for Save (stripped + guarded); **download JSON still carries them** (by design) | ok / confirm |
| Dates DD-MM-YYYY (incl. amendments) | Stored DD-MM-YYYY (`DatePicker` `page.tsx:280,287`); auto ISO→DDMMYYYY `autoFillFromInvoices.ts:9-12`; emitted unchanged `gstr1Json.ts:58`; wire-body date walk covers `idt/nt_dt/oidt/ont_dt/sbdt` — `gstr1Validate.ts:219-233` | DD-MM-YYYY everywhere incl. amendments | **Compatible ✓** | — |
| Full `itm_det` tax fields | `rt,txval,iamt,camt,samt,csamt` all emitted, 0 where N/A — `gstr1Json.ts:10-19` | Same | **Compatible ✓** | — |
| B2B proven shape | `{ctin, inv:[{inum,idt,val,pos,rchrg,inv_typ,diff_percent?,itms}]}` — `gstr1Json.ts:55-63`; buyer GSTIN captured `page.tsx:457`, auto `autoFillFromInvoices.ts:93` | Proven shape | **Compatible ✓** | — |
| B2CS proven shape | `{sply_ty,typ(OE default),etin?(when E),pos,rt,txval,tax…}` — `gstr1Json.ts:70-82`; pre-check requires `typ` — `gstr1Validate.ts:74-80` | Proven shape | **Compatible ✓** | — |
| DOC_ISSUE proven shape | `{doc_det:[{doc_num,docs:[{num,from,to,totnum,cancel,net_issue}]}]}` — `gstr1Json.ts:138-143` | Proven shape | **Compatible ✓** | — |
| No internal-key leakage | Explicit per-section mapping (no `id/isAmended` spread) — `gstr1Json.ts:44-179`; wire-body walk blocks `id/isAmended` — `gstr1Validate.ts:162-176` | No leakage | **Compatible ✓** | — |
| CDNR/CDNUR keys | `nt_num/nt_dt` (not `ntnum/ntdt`) — `gstr1Json.ts:101,111` | `nt_num/nt_dt` | **Compatible ✓** (earlier defect fixed) | — |

---

## Table 3 — Session unification (Part 2 preview)

Token **storage** is unified (single `localStorage['ca_gst_sessions_v1']`, `store.ts`); OTP **drive + status** are **not** — five code paths, only one on `ensureToken`.

| Item | Current (file:line) | Required | GAP | Size |
|---|---|---|---|---|
| Single session path (`ensureToken`) | New provider `GstSessionProvider.ensureToken` — `GstSessionProvider.tsx:167-175`; used ONLY by `GstConnectButton.tsx:10` | All four capabilities call `ensureToken` | Only the connect button uses it | **L (wiring)** |
| e-File + GSTR-1 portal actions | Use OLD `useTaxpayerSession` — `page.tsx:2051`, `Gstr1PortalPanel.tsx:46` (own OTP, but reuses via `getUsableSession`) | Via `ensureToken` | Duplicate OTP-drive hook | **M** |
| Modules driving their OWN OTP | `ItcPortalPanel.tsx:53,57,65`; `GstReturnDownloader.tsx:75,78,87`; `Gstr1PortalImport.tsx:25,41,49,61` — each own `otpGenerate/otpVerify` + `getSessionToken` | None — all via `ensureToken` | **3 modules bypass the provider entirely** | **M** |
| Read-only token users | `Gstr1MonthPreview.tsx:21`, `annuals/page.tsx:30,52` — raw `getSessionToken` | Read shared state | Read direct, not reactive | **S** |
| Duplicate session storage | None — single store (`store.ts`) | Single store | **None ✓** | — |

---

## Table 4 — Connection light (single source of truth)

| Item | Current (file:line) | Required | GAP | Size |
|---|---|---|---|---|
| Reactive states | 3 states: `active/expired/none` — `session.ts:48-53`; dot green/red/gray — `GstConnectButton.tsx:22-29` | 4 states incl. **🟠 Expiring soon (<30m, auto-refresh firing)** | Missing the amber "expiring soon" state | **S** |
| Single source of truth | Modules compute own `hasSession` from `getSessionToken` (`Gstr1PortalImport.tsx:25`, `annuals/page.tsx:52`) | Every module reads the SAME provider state | Not bound to provider | **M** |
| Countdown | "5h 23m left" via `formatRemaining` — `session.ts:52` | Same | **Compatible ✓** | — |
| 503 → light stays green, call shows amber "GSTN unavailable" | No 503/unavailable handling anywhere (grep clean in `src/lib/gst` + `sandboxCore.mjs`) | 503 = amber call error, never red data-error, light stays green | **Absent** | **S** |

---

## Table 5 — Filing pipeline & e-File gate (Part 3 preview)

Sequence driven by `start()` (`page.tsx:1864`) then `doFile()` (`page.tsx:1914`).

| Item | Current (file:line) | Required | GAP | Size |
|---|---|---|---|---|
| Sequence | Save→pollStatus→Proceed→poll→Summary(long)→EVC OTP (all in `start()`), then payload-review→Confirm&File (`doFile`) — `page.tsx:1864-1928` | Save→REC/P→Proceed→Summary→**explicit File click**→EVC→enter→File | **EVC fires at tail of `start()` (`page.tsx:1905`), BEFORE the explicit File click.** Mission wants EVC requested *after* the user clicks File | **M** |
| EVC never in download/import | Only call site `page.tsx:1905`; absent from all download/import paths ✓ | EVC only in filing | **Compatible ✓** | — |
| Poll backoff | Local `pollStatus`: **6 attempts, flat 12s**, `REC`=success, non-terminal→ok — `page.tsx:1852-1862` | 15s/30s backoff, **max 3** | Different params; no backoff | **S** |
| Idempotency | `filedRef` guard — `page.tsx:1799,1915-1916` | Idempotent File | **Compatible ✓** | — |
| Payload review + explicit confirm | Review pane + "Confirm & File" — `page.tsx:2017-2026` (shows Summary `sec_sum`, not full wire body up front) | Payload-review + explicit confirm | Mostly ✓; review shows summary, not exact File body | **S** |
| ARN capture + prominent display | `pick(...'ack_num')` → `arn` state — `page.tsx:1927-1928,2027` | Capture + display prominently | **Compatible ✓** | — |
| Audit log | `recordAudit` on **save + file** (SHA-256 hash, last 100) — `fileAudit.ts`, `page.tsx:1883,1925` | Audit log | ✓; Proceed/Summary/EVC/**Reset** not audited (`doReset` `page.tsx:1934-1942` silent) | **S** |
| Reset | `gstr1Reset` server + `doReset` — `page.tsx:1934-1942`, `sandboxCore.mjs:239` | Reset available | **Compatible ✓** | — |
| Filing disabled on red pre-check errors | Pre-check panel present `page.tsx:1970-1976` — confirm it hard-blocks Start on `severity:'error'` | Filing disabled while red errors | Confirm gating strength | **S** |

---

## Downstream readers of the section/`data:[]` shapes (mission Q D) — exhaustive

**The model does NOT change.** `filing.hsn` stays `HSNSummary[]`; everything reading the *model* (Overview math `page.tsx:1484-1488`, HSN editor `page.tsx:1252-1319`, `validateFiling`/`checkFilingSchema`, `autoFillFromInvoices`, DB `gstr1Db.ts`) is **unaffected**. Breaks cluster in the **emit → save-body → validate → count → portal** chain and the **parse-back** path.

**Sites that BREAK on flipping `gstr1Json.ts:136` to split (5 code + 2 semantic):**

| # | Consumer | file:line | Shape expected | Break |
|---|---|---|---|---|
| 1 | `checkSaveBodyStructure` HSN guard | `gstr1Validate.ts:201-214` | flat `hsn.data` | **Hard.** Explicitly raises a blocking error for `hsn_b2b/hsn_b2c`; its `hsn_sc` row checks read `hsn.data` and silently stop. Must invert. |
| 2 | `countSaveSections` (confirm-dialog count) | `saveBodies.ts:50` (`inner = v.data ?? v.doc_det ?? v.inv`) | flat `hsn.data` | **Silent.** Split has none of those → HSN dropped from the "sections to save" count. |
| 3 | e-File modal pre-check gate | `page.tsx:1815-1816` | flat | **Hard.** #1's error enters `errors` → Save/File UI gated off for every return with HSN. |
| 4 | `parseHSN` (portal JSON → rows) | `gstr1FiledDetail.ts:67` (`d?.hsn?.data ?? d?.data ?? []`) | flat `hsn.data` | **Silent.** Split → `[]` → empty HSN, cascading to `FiledTable`/`FiledDataView`/`Gstr1MonthPreview`. **⚠ Latent bug:** the code elsewhere (`gstr1Json.ts:41`, `gstr1Validate.ts:199`) claims the GET response *is* the split, yet this parser reads only `.data` — so it may **already** be blind to a real split GET. |
| 5 | Live GSTN Save POST + Download JSON | `page.tsx:1882`, `Gstr1PortalPanel.tsx:88`, download `page.tsx:2130` | flat (GSTN Save + govt offline tool) | **Portal-semantic.** GSTN Save & the offline utility expect `hsn:{data:[]}`; split → RET191106 / bad artifact. |

**Reference (already split, unused):** `buildGSTR1JSON`/`downloadGSTR1JSON` — `gstInvoices.ts:1367,1645-1672,2095-2130,2374-2385`. No callers in `src/`. The working template for the split shape.

**Checked and CLEARED (not consumers):** There is **no GSTR-1 Excel export** — `GstReturnDownloader.tsx:96-124` xlsx exports **2A/2B purchase rows**, not GSTR-1 HSN. `exportUtils.ts` + other xlsx users have no gstr1/hsn refs. `scripts/verify_fixes.ts:70` calls the generator but only asserts `exp`/`cdnr`.

**Caveat:** `autoFillFromInvoices` never sets `supplyClass` (`autoFillFromInvoices.ts:201-215`) → a naive split dumps ALL books-derived HSN into `hsn_b2c`. The split port MUST re-key auto-HSN by supply class first.

---

## Answers to the mission's key questions

- **(A) Can the model split HSN by buyer-registration?** Partially. The `supplyClass` field exists (`types.ts:140`) and the manual HSN form captures it (`page.tsx:1312`), but the **auto-compute merges B2B+B2C** (keys by `code|rate`, `autoFillFromInvoices.ts:77`) and the builder ignores `supplyClass`. The invoice-level linkage needed (`gstr1_table`, `buyer_gstin`) **exists** and a dead builder already uses it — so it's **feasible with a re-key of the HSN aggregation**, not a data-model rebuild.
- **(B) Do forms capture what's needed?** Buyer GSTIN ✓ (B2B/CDNR, `page.tsx:457`). SAC-vs-HSN ✗ (single field, no 99xxxx rule). `gt/cur_gt` ✓ but only in the e-File modal (`page.tsx:1790,2003-2007`), manual, no estimate. UQC/qty/rt ✓.
- **(C) What does the builder emit today (esp. HSN)?** Flat `hsn:{data:[]}` with no `supplyClass`, no SAC rule (`gstr1Json.ts:136`). Everything else (envelope, dates, itm_det, b2b/b2cs/cdnr/doc_issue) is schema-compliant.
- **(D) What else reads the old `data:[]` shape?** Five code sites + two portal-semantic sites (full table above): the Save-body pre-check (`gstr1Validate.ts:201-214`, must invert), `countSaveSections` (`saveBodies.ts:50`, silently drops HSN), the e-File gate, `parseHSN` (`gstr1FiledDetail.ts:67` — reads `.data`, so it's actually **blind to a real split GET** already: a latent bug to fix alongside), and the live Save POST + Download JSON. **No GSTR-1 Excel export exists.** The model readers are all safe.

---

## Recommended order (for your review)

1. **Decide HSN authority** (flat test-mock vs split production) — blocks everything HSN. *(the one decision I need)*
2. Session unification (Part 2): route all five paths + connection light through `ensureToken`/provider; add amber "expiring soon" + 503 handling.
3. Wire the four capabilities (Part 3) on the one session.
4. Port the split emitter + SAC rule + invert pre-check (Part 4), then the acceptance Save→Reset.

**Nothing above has been changed.** On your review + HSN decision, I'll proceed in this order, showing diffs at each stage.
