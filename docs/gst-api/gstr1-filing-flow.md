# GSTR-1 Filing Flow — Endpoints & Sequence (verified)

> Verified against `docs/sandbox-gst-api/schemas/.../gstr-1/file/{file,new_proceed}.json`
> and the live server actions in `netlify/functions/_shared/sandboxCore.mjs`.
> Host: `test-api.sandbox.co.in` (test) / `api.sandbox.co.in` (prod). **TEST only this session.**
> `{year}`=YYYY, `{month}`=MM. Common taxpayer headers: `x-api-key`, `authorization:<session token>`, `x-api-version:1.0.0`, `x-source:primary`.

## Mandatory order
`OTP session → Save → poll status → new-proceed → poll → Summary(long) → EVC OTP → File → (Track / Reset)`
Filing is **EVC-only**. GSTR-1 only — **GSTR-1A has no write/file endpoint (GET-only); never filed.**

| Step | Method + path | Body | Returns | Client method |
|---|---|---|---|---|
| Save | `POST /gst/compliance/tax-payer/gstrs/gstr-1/{year}/{month}` | full GSTR-1 JSON | `{ reference_id }` | `gstr1Save` |
| Poll | `GET .../gstrs/{year}/{month}/status?reference_id={id}` | — | `{ status_cd: REC\|P\|PE\|ER, error_report }` | `returnStatus` |
| Proceed | `POST .../gstrs/gstr-1/{year}/{month}/new-proceed?is_nil=Y\|N` | `{ gstin, ret_period }` | `{ reference_id }` | `gstr1Proceed` |
| Summary | `GET .../gstrs/gstr-1/{year}/{month}?summary_type=long` | — | `{ sec_sum, chksum, newSumFlag }` | `gstr1Summary(…, 'long')` |
| EVC OTP | `POST .../evc/otp?gstr=gstr-1` | `{ pan }` | OTP to signatory | `gstEvcOtp` |
| File | `POST .../gstrs/gstr-1/{year}/{month}/file?pan={pan}&otp={otp}` | see below | `{ ack_num }` | `gstr1File` |
| Track | `GET .../gstrs/{year}/{month}/track` | — | `{ EFiledlist:[{arn,dof,status}] }` | `trackReturns` |
| Reset | `POST .../gstrs/gstr-1/{year}/{month}/reset` | — | `{ reference_id }` | `gstr1Reset` |

## File body (verified `file/file.json`, `oneOf`, `additionalProperties:false`)
- **Normal:** `{ gstin, ret_period, chksum, sec_sum, newSumFlag, smryTyp:"L" }`
  - required: `gstin, ret_period, sec_sum, chksum`. **`newSumFlag` = boolean** (NOT "Y"/"N"). `smryTyp` enum `"L"`.
  - `ret_period` = **MMYYYY** (`^((0[1-9]|1[012])((19|20)\d\d))$`). `sec_sum` echoed verbatim from the Summary(long) response.
- **NIL:** `{ gstin, ret_period, isnil:"Y" }` (required: all three).

## Poll semantics
`REC`/`P` = accepted/processing → continue. `PE`/`ER` = errors → surface `error_report` per section, **stop**. Poll ~12s until terminal.

## App status
Transport (server + client) 100% wired. UI pipeline + Reset + payload-review + idempotency + audit + live-log: **built** (`EFileModal` in `gstr1/page.tsx`). Save-body from `generateGstr1Json` (strips `id`/`isAmended`; adds `gt`/`cur_gt`).
