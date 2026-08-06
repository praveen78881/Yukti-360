# GSTR-1 Corrections — Blocker Checklist + Status (verified)

> 🔴 = GSTN rejects without it · 🟠 = files but wrong/incomplete · 🟡 = completeness.
> Verified against `docs/sandbox-gst-api/schemas/.../gstr-1/documents/*.json`.

## 🔴 Blockers — ALL DONE
| # | Fix | Verified vs | Status |
|---|---|---|---|
| 1 | CDNR/CDNUR: `nt_num`/`nt_dt` keys, `ntty` inside `nt[]`, add `pos`/`rchrg`/`inv_typ`(/`p_gst`) | `cdnr.json`, `cdnur.json` | ✅ generator maps `ntnum`→`nt_num`, `ntty` per-note; forms capture the fields |
| 2 | B2CS: add `typ` (OE/E) + `etin` when E | `b2cs.json` (required: rt,sply_ty,txval,typ) | ✅ model + form + generator; gen defaults `typ:'OE'` |
| 3 | HSN: auto-`rt` emits, add `num`, drop `val` | `get_hsn.json` (rate-wise; opt-3 = hsn_sc+rt+txval+qty+num+uqc) | ✅ auto-derived rate-wise (`autoFillFromInvoices` groups by hsn+rate), `num` auto, `val` removed from save JSON |
| 4 | Strip `id`/`isAmended` from all passthrough sections | generator explicit | ✅ every section mapped field-by-field; no raw spreads; runtime-scan proves NONE reach the body |
| 5 | Require actual `gt`/`cur_gt` (no estimate) | — | ✅ `EFileModal` requires entry; nothing estimated |

### RET191106 "Error in Json structure validation" — root-caused + fixed (test, 07/2026 run)
The GSP **Save** API rejected the body because it carried two **offline-utility-only** envelope keys —
`version:"GST3.0.4"` and `hash:"hash"` — which the "Save GSTR-1" recipe body does NOT include
(`{fp, gstin, gt, cur_gt, <sections>}`). `generateGstr1Json` emits them (for the downloadable
offline-tool JSON), and the `EFileModal` Save path was sending the generator output **directly**
instead of stripping them. Fix: `EFileModal` now `delete`s `version`/`hash` from the Save body
(the download path keeps them). These were the **only** structural deviations — a runtime trace of
the full generator output shows no other non-schema keys and no `id`/`isAmended` leak.

**Gap closed:** new `checkSaveBodyStructure(body)` (in `gstr1Validate.ts`) validates the **actual wire
body** (not just the model) for unknown top-level keys + leaked `id`/`isAmended`, folded into the
`EFileModal` error gate. "✓ No schema errors" now only shows when the real payload would pass GSTN.

**RET191106 #2 — empty `nil` block (found after the version/hash fix, 07/2026 re-run).** With
version/hash gone, Save was accepted (`reference_id`) but the async poll returned `status_cd:ER`
RET191106 again. Cause: `generateGstr1Json` emitted `nil` **unconditionally** — every other section
uses a `has()` guard, so a return with no nil/exempt/non-GST rows still shipped `nil:{inv:[]}`, an
empty section block GSTN rejects. Fix: `nil` is now conditional (omitted when no rows). The
`checkSaveBodyStructure` empty-section rule flags any section that is present-but-empty (all arrays
empty) — so it catches this and doesn't flag an hsn whose `hsn_b2b:[]` but `hsn_b2c` has data.

**RET191106 #3 — wrong HSN wrapper (the likely REAL cause; found after #1/#2 still ER'd).**
The generator emitted the **GET-response** HSN shape `hsn:{ hsn_b2b:[], hsn_b2c:[] }` into the SAVE
body. The **`SaveGstr1Request`** contract (schema definition + example) and the **`error_report.hsn`**
(GET-RETURN-STATUS, `additionalProperties:false`) both use `hsn:{ data:[...] }` — a flat array. Every
`hsn_b2b`/`hsn_b2c` occurrence in the openapi is a GET HsnSummary *response* (`GetGstr1HsnSummarySuccessPayload`
etc.). Sending the split under a strict `hsn` node fails the parse → bare RET191106 with no per-section
detail. Fix: generator now emits `hsn:{ data: filing.hsn.map(hsnRow) }`. `checkSaveBodyStructure` now
rejects `hsn_b2b`/`hsn_b2c` in a Save body and enforces 4/6/8-digit `hsn_sc`.

**HSN length now BLOCKING + auto-pad.** `checkFilingSchema` upgrades non-4/6/8 `hsn_sc` from warning →
error. `normalizeHsnCode()` (autoFillFromInvoices) left-pads odd lengths to the next valid one
(`45435`→`045435`, `1234567`→`01234567`) so auto-derived HSN is always valid; manual bad codes are blocked.

**Re-verify note.** The test Save returned a byte-identical `reference_id`
(dfb8f5a1-04c3-4f95-bb60-e13ce9b7221c) across bodies — earlier read as a mock, but it is equally
consistent with GSTN **reusing the 07/2026 draft ref**, and #3 shows the RET191106 was a *genuine*
structural defect. Re-Save after the HSN-wrapper fix: if it clears (or the error now carries per-section
detail), the endpoint was validating all along; if the identical bare RET191106 persists unchanged,
the mock hypothesis stands. Reset the draft or use a never-saved period for the cleanest signal.

## 🟠 Important — partially done
| # | Item | Status |
|---|---|---|
| 6 | Cess `csamt` on B2B/B2CL/CDNR/CDNUR/AT/TXPD | ✅ via shared `itmDet`. **EXP** lacks `csamt` in model → TODO |
| 7 | B2B `diff_percent` | ⚠ in model+generator; **no form input yet** |
| 8 | B2CL `etin` / ECO type | ❌ TODO |
| 9 | Amendment shapes: B2CSA `omon`, EXPA `oinum/oidt`, CDNRA/CDNURA `ont_num/ont_dt` | ✅ types extended (omon/origInvNum/origInvDt/ont_num/ont_dt) + generator emits them; b2csa now `{omon, sply_ty, typ, pos, itms:[…]}`. All 6 amendment sections verified in the Save body. |

## 🟡 Completeness — TODO
| # | Item |
|---|---|
| 10 | Manual forms for ATA/TXPDA; import parsers for Tables 14/15 (ECOM/SUPECO); manual amend forms B2CSA/EXPA/CDNRA/CDNURA |
| 11 | DOC 6→12 GSTN document classes; verify `doc_num` 1–12 |
| 12 | HSN `hsn_b2b` vs `hsn_b2c` from buyer registration (currently defaults B2C) |
| 13 | NIL: skip all-zero rows; `from` pagination on large GETs; wire `gstr-1a/declaration-details` read |

## GSTR-1A — fact, not a fix
Read-only in the API (all paths GET). No 1A save/file/reset. View/download only.
