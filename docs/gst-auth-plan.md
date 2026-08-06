# GST Shared Taxpayer Session — Build Plan (handoff)

**Goal:** ONE shared, OTP-based taxpayer session used by ALL GST modules (GSTR-1, 1A, 2A, 2B, 3B,
reconciliation, live GST Search). Connect once → every module reuses it. Never generate a new OTP
when a valid session exists → **never hit AUTH403** again. Auto-open the OTP modal when no session.

**Build ONLY this auth layer.** DEFERRED (do NOT build yet): GSTR-1 e-File popup redesign, JSON
downloads, any filing. (Next task after this: simplify the GSTR-1 "Start e-Filing" popup.)

**Test credentials (valid, provided 2026-07):**
`SANDBOX_TEST_KEY=key_test_…` (redacted — see local `.env`)
`SANDBOX_TEST_SECRET=secret_test_…` (redacted — see local `.env`)
(backup CSV: `d:\Downloads\CA_studio\sbox_test_key (8).csv`). Already written into `.env`
(`SANDBOX_TEST_KEY`/`SECRET`). Host auto-derives to `test-api.sandbox.co.in` (mode defaults to `test`
when `SANDBOX_ENV` is absent). **Restart `npm run dev` (port 3000) after any `.env` change** — Vite
loads env at startup (it also auto-restarts on `.env` save).

---

## What ALREADY EXISTS — reuse, do NOT rebuild
- **Storage** — `src/lib/gst/sandbox/store.ts`: `localStorage['ca_gst_sessions_v1'] = { [gstin]: {token, exp} }`
  (~6h). Fns: `getSessionToken`, `getSessionInfo`, `setSessionToken(gstin,token,expiryMs?)`,
  `clearSessionToken`, `getAllSessions`, `clearAllSessions`.
- **Core session logic** — `src/lib/gst/sandbox/session.ts`:
  - `getUsableSession(gstin): Promise<{token,exp}|null>` — reuse if valid; auto-`sessionRefresh` when
    `< 30 min` left; returns null when a fresh OTP is required. **This IS `ensureToken` minus the OTP drive.**
  - `logoutSession(gstin)`, `logoutAllSessions()`, `formatRemaining(exp)`.
- **Server auth surface** — `netlify/functions/_shared/sandboxCore.mjs` actions (all built + verified):
  `otpGenerate` (`POST /gst/compliance/tax-payer/otp` {gstin,username}),
  `otpVerify` (`POST /otp/verify?otp=` {gstin,username} → returns `sessionToken` + `tokenExpiry`; returns
  `sessionToken:null` on API error so a bogus session is never stored),
  `sessionRefresh` (`POST /session/refresh`), `logout` (`POST /logout`).
  Headers via `taxpayerHeaders` include `x-source: primary`.
- **Client** — `src/lib/gst/sandbox/client.ts`: `otpGenerate`, `otpVerify`, `sessionRefresh`, `logout`.
- **AUTH403/AUTH4033 hardening** (already correct — replicate its checks in the provider):
  Sandbox returns errors as **HTTP 200 + `data.data.status_cd:"0"` + `error`** — MUST inspect the
  API-level status, not just `r.ok`. See `useTaxpayerSession.ts` `apiError()`/`isAuth403()`:
  on AUTH403 at otpGenerate → `logoutSession` + retry once, else stop with an honest message;
  on AUTH4033 "Invalid Session" at verify → reject, never store a token.
  NOTE: no "close-all-sessions" API exists — orphaned sessions expire in ~6h or need Sandbox support.

## The GAP to build (the actual new work)
1. **`src/lib/gst/session.ts`** — thin consolidation module that RE-EXPORTS the existing store+session
   fns under clean names (no behaviour change), so there's "one place":
   ```ts
   export { getUsableSession as ensureSession, logoutSession, logoutAllSessions, formatRemaining } from './sandbox/session';
   export { getSessionInfo, setSessionToken, clearSessionToken } from './sandbox/store';
   export function sessionStatus(gstin: string): { state:'active'|'expired'|'none'; exp?:number; label:string } { … }
   ```
   (Keep the underlying files where they are — 13 other files import from `sandbox/*`; do NOT move/delete them.)

2. **`src/components/gst/GstSessionProvider.tsx`** (NEW) — the global reactive session + ONE OTP modal:
   - Wrap the company GST section (add `<GstSessionProvider gstin={gstin} username={portalUsername}>` high
     up — e.g. in the company layout or the GST hub shell so all GST pages share it).
   - React context holds `{ tick }` (bump to re-read status) + a pending-resolver ref for the OTP flow.
   - Renders exactly ONE `<OtpModal>` (lift the existing OtpModal out of gstr1/page.tsx, or reuse the
     `useTaxpayerSession` OTP UI) — global, not per-module.
   - Exposes `useGstSession()`:
     ```ts
     interface GstSession {
       status(): { state:'active'|'expired'|'none'; label:string; exp?:number };
       connect(): Promise<string|null>;        // drives OTP; resolves with the new token (or null if cancelled/failed)
       logout(): Promise<void>;                 // logoutSession(gstin) + bump
       ensureToken(): Promise<string|null>;     // THE function every module calls before an API call
     }
     ```

3. **"Connect to GST" button + status pill** — in the GST command-center `src/app/company/[id]/gst/page.tsx`:
   - Status pill (reactive): `🟢 Connected · {formatRemaining} left` / `🔴 Session expired` / `⚪ Not connected`.
   - Button: **Connect to GST** (state none/expired → `connect()`), or **Logout** (state active → `logout()`).
   - This is THE single OTP login/logout entry point for the whole GST cockpit.

## (A) Storage format
```
localStorage["ca_gst_sessions_v1"] = { "<GSTIN>": { token: <jwt string>, exp: <absolute ms> } }
```
Per-taxpayer, ~6h, survives navigation, read by every module (all hit the same key) → truly shared.
Host: `test-api.sandbox.co.in`. The SAME token authorizes GSTR-1, 1A, 2A, 2B, 3B, GST Search — everything.

## (B) `ensureToken()` — how every module checks/reuses (auto-open OTP)
```ts
async ensureToken(): Promise<string|null> {
  const s = await ensureSession(gstin);   // = getUsableSession: reuse if valid; auto-refresh if <30min
  if (s) return s.token;                   // REUSE — no OTP
  return await connect();                  // no/expired session → AUTO-OPEN OTP modal, then return token
}
```
`connect()`:
```
Generate OTP (otpGenerate)
  └─ AUTH403 (status_cd:"0")? → logoutSession + retry once; still 403 → toast honest msg, resolve(null)
show global OTP modal → user enters OTP → Verify OTP (otpVerify)
  └─ apiError (AUTH4033 / status_cd:"0")? → toast, keep modal, no store
setSessionToken(gstin, sessionToken, tokenExpiry ?? now+6h); bump(); resolve(token)
```

## (C) Auth state flow
```
No session ──Connect / ensureToken──▶ Generate OTP ─(AUTH403? logout+retry once)─▶ OTP modal
   ▲                                                                                  │ enter OTP
   │ Logout (frees the GSP slot)                                                      ▼
   │                                                                     Verify OTP → store {token, 6h}
Active (5h 23m left) ◀──────────── reuse / auto-refresh (<30min) ◀─────────────────────┘
   │  exp passes without a refresh
   ▼
Expired ──▶ next ensureToken() → OTP flow
```

## (D) Status indicator
`sessionStatus(gstin)` → `{state, label}`; render reactively (bump `tick` after connect/verify/logout;
optionally a 60s interval in the hub for a live countdown). Labels:
`active → "Connected · 5h 23m left"`, `expired → "Session expired — reconnect"`, `none → "Not connected"`.

## Wiring modules to the shared session (incremental, non-breaking)
Modules today call `useTaxpayerSession(gstin, username)` (token already shared via localStorage, UI state
per-component). Migrate each to `const { ensureToken } = useGstSession()` and replace their
`taxSession.run(fn)` with `const t = await ensureToken(); if (t) await fn(t);`. Files that consume the
session (do NOT delete — just switch their call site when touched):
`GstinSearchTool`, `GstReturnDownloader`, `ItcPortalPanel`, `Gstr1PortalImport/Panel/MonthPreview`,
`EInvoiceGenerator`, `EwayBillGenerator`, `annuals/page`, `e-invoicing/page`, `eway-bill/page`,
`gstr1/page`. (e-invoice & e-way bill have their OWN separate portal sessions — leave those; this is the
GST *taxpayer* session only.)

## Build order for the fresh session
1. `.env` creds already set (key_test_… / secret_test_… — see local `.env`). Restart dev on :3000.
2. Create `src/lib/gst/session.ts` (re-export + `sessionStatus`). `tsc`.
3. Create `GstSessionProvider.tsx` + `useGstSession`; lift a single global `OtpModal`.
4. Add `<GstSessionProvider>` to the GST section shell; add "Connect to GST" + status pill to `gst/page.tsx`.
5. Verify the flow end-to-end with the new key: Connect → OTP → status "Connected"; navigate away & back → still connected (reuse, no OTP); Logout → "Not connected".
6. Migrate one consumer (e.g. GST Search) to `ensureToken()` to prove reuse; then the rest incrementally.
7. THEN (separate task): simplify the GSTR-1 "Start e-Filing (Save→Proceed→EVC)" popup.

## Guardrails
- GSTR-1 page still has Sandbox e-File/Import wiring (removal was planned but NOT executed). That's fine —
  it uses the same shared session; strip/redesign it as its own task later.
- Do NOT delete shared `sandbox/*` libs (13 importers). Do NOT touch e-invoice/e-way-bill sessions.
- Always check API-level `status_cd:"0"`/`error`, not just HTTP `r.ok`.
