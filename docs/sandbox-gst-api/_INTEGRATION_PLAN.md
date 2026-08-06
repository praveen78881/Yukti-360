# Sandbox GST — Integration & Test Plan (test-first)

Status date: 2026-07-25. Companion to `_INDEX.md`.

---

## 0. BLOCKER — credentials are LIVE, not test

The app's `.env` currently has:
- `SANDBOX_API_KEY = key_live_...`
- `SANDBOX_API_SECRET = secret_live_...`
- `SANDBOX_HOST = api.sandbox.co.in`  ← **production**

To test safely on `test-api.sandbox.co.in` we need the **test** pair from the Sandbox dashboard:
- `SANDBOX_API_KEY = key_test_...`
- `SANDBOX_API_SECRET = secret_test_...`
- `SANDBOX_HOST = test-api.sandbox.co.in`

Keys are **host-bound**: a test key on the prod host (or vice-versa) → `403`. Do NOT run taxpayer
OTP / filing against live keys during development — real OTPs, real portal sessions, billed calls.

**Second reality:** taxpayer GSTR reads require a GSTIN whose owner enabled *Manage API Access* on
gst.gov.in (see `enable_api_access` guide). For the test host, use the **test GSTIN(s) Sandbox
provides** in their dashboard/recipes (the docs examples use `33ABKCS2033B1ZW`, `24ABKCS2033B1ZV`).
`search_gstin` (public) works with only the Sandbox JWT — no taxpayer session — so it's the ideal
first smoke test.

---

## 1. Auth model (two tokens)

1. **Authenticate** → Sandbox JWT (24h). `POST https://<host>/authenticate`
   headers: `x-api-key`, `x-api-secret`, `x-api-version: 1.0.0`. Returns `access_token`.
   Pass it as `authorization` (NO `Bearer`) on every call, plus `x-api-key`.
2. **Taxpayer session** (only for `tax-payer/*`): Generate OTP → Verify OTP → taxpayer `access_token`
   (6h). Use THAT token as `authorization` for GSTR reads/filing. Refresh before expiry.

---

## 2. Endpoint contracts (the ones requested)

All under host `https://<host>`; all send `x-api-key` + `x-api-version: 1.0.0`.

| # | Purpose | Method + path | auth header | Body / params |
|---|---|---|---|---|
| 1 | Search GSTIN (public) | `POST /gst/compliance/public/gstin/search` | Sandbox JWT | body `{ "gstin": "33ABKCS2033B1ZW" }` |
| 2 | Generate OTP | `POST /gst/compliance/tax-payer/otp` | Sandbox JWT | hdr `x-source: primary`; body `{ "username", "gstin" }` |
| 3 | Verify OTP | `POST /gst/compliance/tax-payer/otp/verify?otp=575757` | Sandbox JWT | body `{ "username", "gstin" }` → returns taxpayer `access_token`, `token_expiry` |
| 4 | Refresh session | `POST /gst/compliance/tax-payer/session/refresh` | taxpayer token | none → new `access_token` |
| 5 | GSTR-1 (filed data) | `GET /gst/compliance/tax-payer/gstrs/gstr-1/{year}/{month}` | taxpayer token | path `year`,`month` |
| 6 | GSTR-2A | `GET /gst/compliance/tax-payer/gstrs/gstr-2a/{year}/{month}` | taxpayer token | path `year`,`month` |
| 7 | GSTR-2B | `GET /gst/compliance/tax-payer/gstrs/gstr-2b/{year}/{month}` | taxpayer token | path `year`,`month` |
| 8 | GSTR-3B details | `GET /gst/compliance/tax-payer/gstrs/gstr-3b/{year}/{month}` | taxpayer token | path `year`,`month` |
| 9 | GSTR-9 details | `GET /gst/compliance/tax-payer/gstrs/gstr-9` | taxpayer token | (year via query/param per spec) |

Analytics reconciliation (from prior turn): `POST /gst/analytics/gstr-2a-reconciliation` (+ `gstr-2b`),
job-based (submit → PUT files to signed URLs → poll). Sandbox JWT auth.

Full request/response schemas live in `openapi/gst-compliance.openapi.json` and
`openapi/gst-analytics.openapi.json`; per-field request schemas in `schemas/gst/...`.

---

## 3. Server proxy work (`netlify/functions/_shared/sandboxCore.mjs`)

Existing actions: `status | gstinSearch | otpGenerate | otpVerify | fetch`. Add/confirm:
- `sessionRefresh` → POST session/refresh with taxpayer token.
- `getGstr` (generic) → GET `tax-payer/gstrs/{type}/{year}/{month}` with taxpayer token passed from client.
- Reconciliation: `reconcileSubmit` (2A/2B) + `reconcilePoll` + a client-side signed-URL `PUT` helper.
- Keep secrets server-side; the browser sends `{ action, taxpayerToken?, ...params }`.
- Re-enable the Supabase JWT gate before prod (currently origin-allowlist only, since login suspended).

## 4. Test sequence on test-api (once test keys are in)
1. `status` / `authenticate` → confirm Sandbox JWT issues (proves key+host pairing).
2. `search_gstin` with a test GSTIN → proves end-to-end plumbing, no taxpayer session needed.
3. OTP generate → verify with a **test** GSTIN → taxpayer token.
4. GET gstr-2b/gstr-3b for a period → render in the existing screens.
5. Analytics 2A recon job → upload sample files (validate against `schemas/.../*upload.schema.json`) → poll → render report.

---

## 5. UI QA checklist (local, no creds needed) — GST screens
Screens: `src/app/company/[id]/gst/{gstr1,gstr2a,gstr2b,gstr3b,itc-register,eway-bill,books-bridge,page}`.
- [ ] No horizontal overflow: every wide table wrapped in `overflow-x-auto`; page body never scrolls sideways.
- [ ] All buttons have working handlers (add/edit/delete/save/clear, period picker, tab switches).
- [ ] Currency shows ₹ via `formatIndianCurrency`; tax rate `%` symbols present; RCM/badges render.
- [ ] Export/download (JSON / Excel / PDF via `ExportButtons`) actually produces a file and the
      downloaded content matches on-screen data.
- [ ] Empty states + loading spinners render; long GSTIN/adress strings truncate, not overflow.
- [ ] Responsive at narrow widths (grids collapse, modals fit).
