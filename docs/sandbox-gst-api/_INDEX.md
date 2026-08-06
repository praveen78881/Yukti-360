# Sandbox.co.in GST API — Local Documentation Corpus

Complete, verbatim mirror of the GST portion of Sandbox's developer docs, saved for building
integrations. Source: the open-source docs repo [`in-co-sandbox/in-co-sandbox-docs`](https://github.com/in-co-sandbox/in-co-sandbox-docs)
(cloned, not scraped — so schemas and OpenAPI specs are byte-exact).

> Fetched: 2026-07-25. The docs live site is a Mintlify SPA; the machine-readable index is at
> `https://developer.sandbox.co.in/llms.txt` (full version saved here as `llms-full.txt`).

---

## How this folder is organized

| Folder | What's in it |
|---|---|
| `openapi/` | The two authoritative machine-readable specs: **`gst-analytics.openapi.json`** (reconciliation) and **`gst-compliance.openapi.json`** (taxpayer filing, e-invoice, e-way-bill, public lookups). Everything else is derived from these. |
| `reference/gst/` | All 179 endpoint pages as `.mdx` (each page = one document). Mirrors the site's `/api-reference/gst/...` tree. Each page's `openapi:` frontmatter points at the operation inside the specs above. |
| `reference/authenticate.mdx` | The root auth endpoint (`POST /authenticate`) — required before any call. |
| `recipes/gst/` | End-to-end worked flows: file GSTR-1 / GSTR-3B / GSTR-9, generate taxpayer / e-invoice / e-way-bill sessions, generate & fetch e-invoice. |
| `guides/` | GST product guide + shared developer-resources (environments, errors, rate limits, pagination, **job_based_apis**, sheet_json, webhooks, versioning) + quickstart. |
| `schemas/gst/` | Every JSON Schema: request bodies (`schema/request/...`), reconciliation upload/report workbooks (`analytics/reconciliation/...`), and public-API response schemas (`schema/public/...`). |

A raw full-tree mirror of **all** Sandbox products (KYC, TDS, Income Tax, Bank) is also on disk at
`D:\Downloads\CA_studio\sandbox-docs-src` if we later need those.

---

## The essentials (read these first)

### Hosts / environments
- **Test:** `https://test-api.sandbox.co.in`
- **Production:** `https://api.sandbox.co.in`
- Key/secret are **host-bound**: a test key on the prod host (or vice-versa) returns `403`.
  (This matches how `netlify/functions/gst-sandbox.js` is already wired: `SANDBOX_HOST` env var.)

### Authentication (`reference/authenticate.mdx`)
1. `POST /authenticate` with your **API Key** + **API Secret** → returns a **JWT access token** (valid **24h**).
2. The token is **NOT a bearer token** — pass it in the `authorization` header **without** the `Bearer` prefix.
3. Every GST call sends these headers:
   - `authorization: <JWT access token>`
   - `x-api-key: <API key>`
   - `x-api-version: 1.0.0` (optional; defaults to `1.0.0`)

### Job-based async workflow (`guides/developer-resources/job_based_apis.mdx`)
Used by the reconciliation APIs (and IMS/e-invoice list jobs). Pattern:
1. **Submit** — `POST` the job endpoint → get `job_id` + one or more **pre-signed S3 URLs**.
2. **Upload** — `PUT` your payload file(s) directly to the S3 URL. **No auth headers**, do not modify the URL, expires ~24h.
3. **Poll** — `GET` the job endpoint with `?job_id=...` until `status` is `succeeded` or `failed`; success returns a report URL.
   - Statuses: `created → queued → in_progress → succeeded | failed`.
   - Input/output files are retained **30 days** then deleted.

---

## Priority flow you asked about: GSTR-2A Reconciliation

Files:
- Guide: `reference/gst/analytics/guides/gstr-2a-reconciliation/overview.mdx`
- Submit: `reference/gst/analytics/endpoints/gstr-2a-reconciliation/submit_job.mdx`
- Poll:   `reference/gst/analytics/endpoints/gstr-2a-reconciliation/poll_job.mdx`
- Spec:   `openapi/gst-analytics.openapi.json`
- Upload schemas: `schemas/gst/analytics/reconciliation/{gstr_2a_upload,purchase_ledger_workbook}.schema.json`
- Report schema:  `schemas/gst/analytics/reconciliation/reconciliation_report_workbook.schema.json`

> ⚠️ Your original URLs (`.../guides/.../submit_job`, `.../post_job`) 404. The real paths use
> `endpoints/` (not `guides/`) and the second endpoint is **`poll_job`** (not `post_job`).

**Submit** — `POST /gst/analytics/gstr-2a-reconciliation`

Request body:
```json
{
  "@entity": "in.co.sandbox.gst.analytics.gstr-2a_reconciliation.request",
  "gstin": "24ABKCS2033B1ZV",
  "year": 2026,
  "month": 3,
  "reconciliation_criteria": "strict"   // strict | moderate | flexible
}
```
Response `data` includes `job_id`, `status: "created"`, and **two** pre-signed URLs:
`gstr_2a_url` and `purchase_ledger_url`. `PUT` each file (validated against the upload schemas) to its URL.

**Poll** — `GET /gst/analytics/gstr-2a-reconciliation?job_id=<uuid>` → on `succeeded`, returns the
reconciliation report URL (schema: `reconciliation_report_workbook.schema.json`). On validation
failure, returns a validation-report URL instead.

**GSTR-2B reconciliation** is identical in shape under `.../gstr-2b-reconciliation/` (upload schema
`gstr_2b_upload.schema.json`).

---

## Full GST surface (from `llms-full.txt`)

**Analytics** — GSTR-2A recon, GSTR-2B recon (submit_job + poll_job each).

**Compliance › Public** (no login) — search_gstin, verify_gstin, track_gstrs, search_pan_state_code, get_preference.

**Compliance › Taxpayer** (OTP session required):
- **Auth:** generate_otp, verify_otp, refresh_session, generate_evc_otp, logout.
- **GSTR-1:** per-section document endpoints (at/ata, b2b/b2ba, b2cl/b2cla, b2cs/b2csa, cdnr/cdnra,
  cdnur/cdnura, exp/expa, txp/txpa, ecom/ecoma, supeco/supecoa, nil, doc_issue, get_hsn) + file/save,
  file/new_proceed, file/file, file/reset.
- **GSTR-2A:** b2b, b2ba, cdn, cdna, amdhist, document, ecom/ecoma, impg, impgsez, isd, tcs, tds.
- **GSTR-2B:** document, regenerate, regeneration_status.
- **GSTR-3B:** gstr_3b_details, auto_liability_calc, save, offset_liability, file.
- **GSTR-9:** auto_calculated_details, section_8a_details, save, gstr_9_details, proceed, file.
- **Common:** gst_return_status, get/save_filing_preference, get_aato_values, track_returns.
- **Ledgers:** cash_ledger, itc_ledger, cash_itc_balance_ledger, return_liability_ledger.
- **E-Invoice (taxpayer):** e_invoice, get_hsn_summary, list_sales/purchase_invoices_job (+ status).
- **IMS (Invoice Management System):** invoice_count, invoices, save, reset, status.

**Compliance › E-Invoice (IRP)** — create_api_credentials, authenticate, generate_e_invoice,
generate_e_invoice_pdf, cancel_e_invoice, get_e_invoice, get_e_invoice_by_document_data,
generate_e_way_bill, get_e_way_bill, search_gstin.

**Compliance › E-Way Bill** — authenticate + consignor / consignee / transporter / common groups
(generate, cancel, extend, update vehicle/transporter, consolidated EWB, multi-vehicle movement,
search gstin/transporter, hsn details, error list).

---

## How this maps to the existing app

The app already has a thin GST integration; extend it rather than starting over:
- **Server proxy:** `netlify/functions/gst-sandbox.js` + `netlify/functions/_shared/sandboxCore.mjs`
  (keeps `SANDBOX_API_KEY`/`SECRET`/`HOST` server-side; mirrored into Vite dev at
  `/.netlify/functions/gst-sandbox`). Existing actions: `status | gstinSearch | otpGenerate | otpVerify | fetch`.
- **Frontend screens:** `src/app/company/[id]/gst/` — `gstr2a`, `gstr2b` (recon targets), `gstr1`,
  `gstr3b`, `itc-register`, `eway-bill`, `books-bridge`.
- **Client libs:** `src/lib/gstr1/*` (filing model, JSON gen, validation), `src/lib/accounting/gst*`.

> Note: the auth note in `gst-sandbox.js` says a Supabase JWT gate was removed because app login is
> suspended; it currently gates on an optional origin allowlist. Re-enable before exposing recon in prod.
