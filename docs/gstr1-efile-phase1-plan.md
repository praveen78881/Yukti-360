# GSTR-1 e-File — Phase 1 (blockers + e-File), schema-verified

Approved 2026-07-27: **Phase 1 = rejection-causing fixes + the "e-File GSTR-1" ⋮ option, then test the file path on TEST creds.** Phase 2 (completeness) after. Every field below is verified against the **request** schemas in `docs/sandbox-gst-api/schemas/gst/schema/request/taxpayer/gstr-1/documents/*.json` — re-open those before coding; do not guess.

Test taxpayer (from memory): flows run on **test env** (`SANDBOX_ENV=test`). OTP on Sandbox test = `575757`. Company GSTIN + GST portal username set in Settings → "GST & e-Way Bill".

---

## A. Blocker form/model/JSON fixes

### A1. B2CS — `Get-B2CS-Schema` (required: `rt, sply_ty, txval, typ`)
- **ADD `typ`** (enum **`E` / `OE`**) — REQUIRED. E = supply through e-commerce operator; OE = ordinary. Default `OE`.
- **ADD `etin`** (e-com operator GSTIN, 15-char, pattern `^[a-zA-Z0-9._\s]+$`) — required **when `typ==='E'`**; show the field only then.
- (optional) `diff_percent` (number, multipleOf 0.01).
- Model: extend `B2CSSummary` with `typ:'E'|'OE'; etin?:string; diff_percent?:number`.
- Form: add a `typ` toggle (OE/E) + conditional `etin` input.

### A2. HSN — `Get-HSN-Schema` (rate-wise; split `hsn_b2b`/`hsn_b2c`; row required: `num,uqc,qty,txval` + (`hsn_sc`+`rt`) or (`val`+`desc`))
- **ADD `rt`** (Tax Rate, number) — REQUIRED (schema is rate-wise; one HSN+rate = one row).
- **ADD B2B/B2C classification** per row (toggle) → JSON gen puts the row in `hsn_b2b` vs `hsn_b2c`.
- `num` (serial, **integer**) already auto-assigned (`num:allHsn.length+1`) — keep; ensure integer.
- `hsn_sc` pattern `^[0-9]{2,8}$` — enforce 4/6/8-digit-by-turnover as a soft warning (Phase 2 hard rule).
- Model: extend `HSNSummary` with `rt?:number; supplyClass?:'B2B'|'B2C'`.

### A3. CDNR — `Get-CDNR-Schema` (note `required`: cflag,itms,val,nt_num,updby,nt_dt,flag,chksum,ntty — cflag/flag/chksum/updby are SYSTEM)
Add to the note (`nt[]`) user fields:
- **`pos`** Place of Supply (pattern `^(3[0-8]|[12][0-9]|0[1-9]|96|97)$`).
- **`inv_typ`** enum **`R/DE/SEWP/SEWOP/CBW`**.
- **`rchrg`** enum `Y/N`.
- **`p_gst`** enum `Y/N` (pre-GST-regime note).
- **`csamt`** Cess (in `itm_det`).
- (optional) `diff_percent`.
- Model: extend CDNR note type with `pos?; inv_typ?; rchrg?; p_gst?;` and `itm_det.csamt?`.

### A4. CDNUR — `Get-CDNUR-Schema` (verify before coding)
- **ADD `inv_typ`** and **`p_gst`** (same enums as CDNR). `pos` already present. Add `csamt`.

### A5. JSON generator — `src/lib/gstr1/gstr1Json.ts` (verify current output first)
- **Strip internal fields** from every section object before output: `id`, `isAmended`, `origInvNum`/`origInvDt` on non-amendment payloads, and any UI-only keys. GSTN rejects unknown properties.
- Emit the new fields: B2CS `typ`/`etin`, HSN `rt` + split into `hsn_b2b`/`hsn_b2c`, CDNR/CDNUR `pos`/`inv_typ`/`rchrg`/`p_gst`/`csamt`.
- Confirm date format `dd-mm-yyyy` (schemas use `^((0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-((19|20)\d\d))$`).

### A6. Return-level turnover `gt` / `cur_gt`
- Currently estimated. Add a small **"Aggregate turnover"** input (return-level, near the header or in a filing pre-check) so the CA enters actual **`gt`** (prev FY) + **`cur_gt`** (Apr–current) before Save. Do NOT file with an estimated value. Persist on the filing.

---

## B. e-File ⋮ option — "e-File GSTR-1"
Filing pipe already built (client `sandboxClient.gstr1Save / gstr1Proceed / gstEvcOtp / gstr1File`; server actions in `sandboxCore.mjs`; schemas `docs/.../gstr-1/file/{file,new_proceed,reset}.json`). Wire a ⋮ item that:
1. Reuse taxpayer session (`useTaxpayerSession` / `getUsableSession`) — OTP only if none.
2. `gstr1Save(year, month, generateGstr1Json(fullFiling))` → async → poll `returnStatus(year,month,refId)` until `status_cd` leaves `REC`/`P` (see `reconcile`-style poll in memory).
3. `gstr1Proceed({year,month,gstin,isNil})` → then `gstr1Summary(long)` for sec_sum + chksum.
4. `gstEvcOtp(pan,'gstr-1')` → EVC OTP to taxpayer → user enters it.
5. `gstr1File({year,month,pan,otp,body:{ret_period,sec_sum,chksum,gstin,newSumFlag}})` → ARN.
- Surface **every validation error** verbatim (GSTN returns field-level errors) so we fix the form before real filing. Show progress + the returned ARN.
- **Read `file/file.json` + `file/new_proceed.json` before building** to confirm the exact `body` shape.

## C. Test end-to-end
- Set company GSTIN/username to the Sandbox test taxpayer. Draft a small B2B + B2CS + HSN entry. ⋮ → e-File → OTP `575757` → observe Save → Proceed → EVC → File. Capture any schema rejection and fix the corresponding field.
- TEST caveat: test env mocks some state-changing calls; a filing may return a canned status. Confirm the *path* (each call 200 + no schema-validation error), not necessarily a real ARN.

## Files to touch
- `src/app/company/[id]/gst/gstr1/page.tsx` — B2CS/HSN/CDNR/CDNUR forms + ⋮ e-File item + gt/cur_gt input.
- `src/types/company.ts` or `src/lib/gstr1/*` types — extend B2CSSummary/HSNSummary/CDNR note (find the exact type file; imported at page.tsx L20–23).
- `src/lib/gstr1/gstr1Json.ts` — strip internal keys, emit new fields, HSN b2b/b2c split.
- (no changes to routes or non-GST pages.)

## Definition of done (Phase 1)
`tsc` clean · B2CS/HSN/CDNR/CDNUR forms show the new required fields · JSON has no `id`/`isAmended` and includes the new fields · gt/cur_gt entered by CA · ⋮ e-File runs Save→Proceed→EVC→File on test creds with no schema-validation rejection.
