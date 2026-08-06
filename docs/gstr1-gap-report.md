# GSTR-1 Missing-Particulars Gap Report (PART 0)

**Date:** 2026-07-29 · **Reference:** `server-bisect.js` (production-proven, GSTIN 29ABDCA9939R1ZK on `api.sandbox.co.in`). **Status: REPORT ONLY — nothing changed.** Awaiting review before implementing.

**Method:** cross-checked the software's data model (`src/lib/gstr1/types.ts`), auto-compute (`autoFillFromInvoices.ts`), builder (`gstr1Json.ts`), pre-check (`gstr1Validate.ts`), and forms (`gstr1/page.tsx`) against the reference server's actual payload shapes + auth flow (bisect/test scaffolding ignored per brief).

> ⚠️ **Security (act separately):** the reference hardcodes your **live** `key_live_…`/`secret_live_…` in plaintext (`server-bisect.js:23-24`). I will **not** copy them — the software already loads keys from server-side env (`sandboxCore.mjs getConfigFromEnv`). Recommend rotating them since they sit in a file, and keeping PART 2 env-only.

---

## Reference-confirmed shapes (the production truth)

| Section | Proven shape | server-bisect.js:line |
|---|---|---|
| Envelope | `{gstin, fp:MMYYYY, gt:num, cur_gt:num}` — **gstin required** | 61; gstin-required proof 352-356 |
| HSN (FP ≥ 052025) | `hsn:{ hsn_b2b:[…], hsn_b2c:[…] }` split by buyer-registration | 105-114 (`all_fixed` uses it, 345-346) |
| SAC row (99xxxx) | `uqc:"NA", qty:0` | 111 (vs goods `uqc:"NOS"` 108) |
| b2b / b2cs(flat,typ OE) / b2cl / cdnr / cdnur / at / txpd / nil / doc_issue | as software emits | 64-134, 146-217 |
| EXP items | **bare** `{txval, rt, iamt, csamt}` (no num/itm_det) | 165, 173, 254 |
| Amendments | `oinum/oidt` (b2ba/b2cla/expa), `ont_num/ont_dt` (cdnra/cdnura), `omon` (b2csa/ata/txpda) | 224-303 |
| Auth | `/authenticate` → OTP → verify `?otp=` in query; `x-source:primary`; raw token in `authorization`; OTP blocked while alive; persisted session | 399-437, 410-412 |
| Save / Status / Reset | one composite `POST …/gstr-1/{y}/{m}`; `GET …/{y}/{m}/status?reference_id=`; `POST …/reset` | 443, 459, 512 |

---

## THE GAPS — missing particulars

### (a) HSN split by buyer-registration — **NOT computed or emitted** · fix **L**
| Missing particular | Current state (file:line) | Required (ref) |
|---|---|---|
| Auto-HSN split by supply class | Aggregates ALL sales lines keyed `code\|rate`, **drops buyer**, never sets `supplyClass` — `autoFillFromInvoices.ts:77, 201-215` | Key by (code, rate, **supplyClass**); B2B invoice→`hsn_b2b`, else `hsn_b2c` (server-bisect.js:105-114) |
| Builder emits split | Emits flat `hsn:{data:[…]}`, ignores `supplyClass` — `gstr1Json.ts:136` (`hsnRow` 22-36) | `hsn:{hsn_b2b,hsn_b2c}` |
| Pre-check enforces split | **Rejects** `hsn_b2b/hsn_b2c`, **requires** `data:[]` — `gstr1Validate.ts:201-214` | Invert: require split, reject `data:[]` |
| Linkage exists? | **YES** — `inv.gstr1_table` (B2B vs B2CS/B2CL) + `inv.buyer_gstin`; a dead split builder already uses it: `gstInvoices.ts:2101-2130` (`buildGSTR1JSON`, no callers) | — (port reference) |

### (b) SAC vs HSN + uqc"NA"/qty0 for services — **absent** · fix **M**
| Missing particular | Current state (file:line) | Required (ref) |
|---|---|---|
| Detect SAC (99xxxx) | No detection anywhere; one free-text `hsn_sc` field — `page.tsx:1301` | Codes `99xxxx` are services |
| Services uqc/qty | Auto sets `uqc = item.uqc \|\| 'NOS'`, real `qty` — `autoFillFromInvoices.ts:78`; builder emits as-is — `gstr1Json.ts:22-36` | `uqc:"NA", qty:0` (server-bisect.js:111) |

### (c) gt / cur_gt as user-entered actuals — **present, but capture-point is narrow** · fix **S**
| Missing particular | Current state (file:line) | Required |
|---|---|---|
| User-entered gt/cur_gt | Captured only inside `EFileModal` — `page.tsx:1790-1791, 2003-2007`; model `types.ts:190-191`; emitted when non-null `gstr1Json.ts:52-53`; pre-check only **warns** — `gstr1Validate.ts:114-115` | Numbers from actuals in the envelope. **Validation gate must REQUIRE them before BOTH Download-JSON and e-File** (Download path omits them if the modal was never opened) |

### (d) Amendment models & original-ref fields — **mostly present; two gaps** · fix **S**
| Missing particular | Current state (file:line) | Required (ref) |
|---|---|---|
| b2ba/b2cla oinum/oidt · cdnra/cdnura ont_num/ont_dt · b2csa omon | Present ✓ — `gstr1Json.ts:148,153,173,177,158` | server-bisect.js:224-289 |
| **ata / txpda (advance amendments)** | **MISSING** — not in model (`types.ts:180-186` has no ata/txpda) nor builder (no emit in `gstr1Json.ts`), though `SAVE_TOP_LEVEL` lists them `gstr1Validate.ts:127` | `{omon, pos, sply_ty, itms:[{rt,ad_amt,tax…}]}` (server-bisect.js:291-303). Rare in practice |
| **EXPA item cess** | `expa` items emit `{txval,rt,iamt}` — no csamt — `gstr1Json.ts:167`; model lacks it `types.ts:67` | bare `{txval,rt,iamt,csamt}` (server-bisect.js:254) |

### (e) Other readers of the old `hsn data:[]` shape that break on change · fix **S each**
| Site | file:line | Break |
|---|---|---|
| `checkSaveBodyStructure` HSN guard | `gstr1Validate.ts:201-214` | Hard — rejects split, stops row checks (invert) |
| `countSaveSections` | `saveBodies.ts:50` (`v.data ?? v.doc_det ?? v.inv`) | Silent — HSN dropped from save count |
| e-File pre-check gate | `page.tsx:1815-1816` | Hard — split error gates Save/File UI |
| `parseHSN` (portal→rows) | `gstr1FiledDetail.ts:67` (`hsn?.data ?? data ?? []`) | Silent — empty HSN; **latent bug: already blind to a real split GET** |
| Live Save POST + Download JSON | `page.tsx:1882, 2130`, `Gstr1PortalPanel.tsx:88` | Portal-semantic — expects `hsn:{data:[]}` |
| **Cleared (not consumers):** no GSTR-1 Excel export (`GstReturnDownloader` xlsx is 2A/2B); model readers (Overview math, editor, validators, DB) unaffected | | |

### Extra gap — EXP item cess (regular section) · fix **S**
`exp` items emit `{txval,rt,iamt}` — no csamt — `gstr1Json.ts:93`; model `types.ts:67` lacks `csamt`. Reference sends `{txval,rt,iamt,csamt}` (server-bisect.js:165,173). Cess-bearing exports would drop cess.

---

## Already compatible — confirmed against the reference (no change)

- **Auth/headers/session** — `sandboxCore.mjs taxpayerHeaders` = `x-api-key` + raw `authorization` + `x-source:primary`; OTP verify `?otp=` in query; one shared persisted 6h session, reuse-first, refresh <30m, Logout — **matches server-bisect.js exactly**.
- **Section shapes** b2b, b2cs (flat, typ OE/E), b2cl, cdnr, cdnur (typ `EXPWP` — ref comment says `EXPWPAY` but its test row uses `B2CL`; software matches GSTN spec — low-priority verify), at, txpd, nil, doc_issue.
- **Amendment original-refs** oinum/oidt, ont_num/ont_dt, omon.
- **DD-MM-YYYY** in every section incl. amendments (validated on the wire body — `gstr1Validate.ts:219-233`).
- **Full itm_det** `{rt,txval,iamt,camt,samt,csamt}`, 0 where N/A (`gstr1Json.ts:10-19`) — except EXP items (gap above).
- **No internal-key leakage** — id/isAmended stripped + guarded (`gstr1Json.ts` explicit maps, `gstr1Validate.ts:162-176`).
- **One composite Save POST**, reference_id extraction, status/reset endpoints — all match.

---

## Beyond the builder — implementation gaps for Parts 2–5 (already audited)

These are not "missing particulars" in the data/builder, but the mission's later parts. Full detail in `docs/compat-audit.md`; summary of current state:

- **Validation gate (Part 3):** rules exist (`checkFilingSchema`, `checkSaveBodyStructure`, `validateFiling` in `gstr1Validate.ts`) but there is **no single `validateGstr1`**, **no PASS/WARNINGS/BLOCKERS status**, **no dirty-state hash gating**, and Download-JSON is **not** behind a gate. Needs building.
- **Env switch (Part 2):** `SANDBOX_ENV` test/live + per-call override exist (`sandboxCore.mjs getConfigFromEnv`); **no red "PRODUCTION — REAL GSTN" banner** anywhere.
- **Credit discipline (Part 4):** e-File poller is `pollStatus` = 6 attempts × flat 12s and **`return {ok:true}` on non-terminal** (`page.tsx:1852-1862`) — the auto-continue-on-timeout the mission bans. No credit counter. No 503 handling.
- **Session unification (Part 2):** token store unified, but `ItcPortalPanel`/`GstReturnDownloader`/`Gstr1PortalImport` drive their own OTP and e-File uses `useTaxpayerSession`, not `ensureToken`. Connection light = 3 states (no amber "expiring").
- **Filing UI (Part 5):** stepper/ARN/audit exist; EVC currently fires at the tail of `start()` before an explicit File click; audit covers Save+File only (Proceed/Summary/EVC/Reset unlogged).

---

## Fix-size summary & suggested order (post-review)

| Gap | Size |
|---|---|
| HSN split (auto-compute + builder + invert pre-check + 5 downstream sites) | **L** |
| SAC uqc"NA"/qty0 | **M** |
| ata/txpda models | **S** |
| EXP/EXPA cess (csamt) | **S** |
| gt/cur_gt required-before-both-buttons | **S** (folds into validation gate) |
| gstin non-empty assertion | **S** |

**Order I'd implement (Part 1 first, on your OK):** ① EXP csamt + ata/txpda model/builder (small, isolated) → ② HSN split emitter + SAC rule + re-key auto-compute → ③ invert pre-check + fix the 5 downstream readers → ④ then Parts 2–5.

**Nothing above is changed.** On your review, I'll start with PART 1 (builder fixes) and show diffs.
