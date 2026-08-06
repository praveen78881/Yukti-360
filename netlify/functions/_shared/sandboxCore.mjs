/**
 * Sandbox.co.in GST (GSP) — shared server-side core.
 *
 * Runs ONLY server-side: imported by the Netlify function (netlify/functions/
 * gst-sandbox.js) in production and by the Vite dev-middleware (vite.config.ts)
 * on localhost. This keeps SANDBOX_API_KEY / SANDBOX_API_SECRET out of the
 * browser bundle entirely — the client only ever talks to our own function.
 *
 * Request shapes are a faithful port of the live-tested prototype (GST 2A/
 * server.js). Non-obvious facts baked in, learned the hard way:
 *   - OTP verify sends the OTP as a QUERY param (?otp=...), body carries gstin+username.
 *   - Production taxpayer calls require the header  x-source: primary.
 *   - The taxpayer session after OTP verify is authorised via the `authorization`
 *     header (session token, falling back to the app token) + x-source — NOT a
 *     separate x-taxpayer-token header.
 *   - /authenticate returns an app access_token (~24h); we cache it per host+key
 *     so it is requested rarely (call-count minimisation).
 */

const DEFAULT_HOST = 'api.sandbox.co.in';
const DEFAULT_VERSION = '1.0.0';

/** App access-token cache: `${host}:${apiKey}` -> { token, exp(ms) }. Module scope,
 *  so it survives across requests within a warm process (dev server / warm lambda). */
const tokenCache = new Map();

/** Build the server config from an env-like object (process.env or Vite's loadEnv). */
export function getConfigFromEnv(env = {}, overrideMode) {
  // Both key sets live in .env; SANDBOX_ENV selects the default, and a per-request
  // `overrideMode` ('test'|'live') lets a single page (e.g. GST Search) run on a
  // different environment. Host is derived from the mode so a test key can never
  // hit the prod host. Falls back to the legacy SANDBOX_API_KEY/SECRET/HOST vars.
  const wanted = overrideMode ? String(overrideMode).toLowerCase() : String(env.SANDBOX_ENV || 'test').toLowerCase();
  const mode = wanted === 'live' ? 'live' : 'test';
  const apiKey = (mode === 'live' ? env.SANDBOX_LIVE_KEY : env.SANDBOX_TEST_KEY) || env.SANDBOX_API_KEY || '';
  const apiSecret = (mode === 'live' ? env.SANDBOX_LIVE_SECRET : env.SANDBOX_TEST_SECRET) || env.SANDBOX_API_SECRET || '';
  const defaultHost = mode === 'live' ? 'api.sandbox.co.in' : 'test-api.sandbox.co.in';
  const host = (env.SANDBOX_HOST || defaultHost).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  // ERI (income-tax filing) credentials — separate from the GSP api key/secret.
  // These identify OUR Electronic Return Intermediary user on the ITD portal and
  // are needed only for the taxpayer-scoped ITR reads (prefill / e-verify / ITR-V).
  // Validate & Submit authenticate with the app token + api key alone.
  const eriUserId = (mode === 'live' ? env.SANDBOX_ERI_LIVE_USER_ID : env.SANDBOX_ERI_TEST_USER_ID) || env.SANDBOX_ERI_USER_ID || '';
  const eriPassword = (mode === 'live' ? env.SANDBOX_ERI_LIVE_PASSWORD : env.SANDBOX_ERI_TEST_PASSWORD) || env.SANDBOX_ERI_PASSWORD || '';
  return {
    mode,
    host,
    apiKey,
    apiSecret,
    eriUserId,
    eriPassword,
    version: env.SANDBOX_API_VERSION || DEFAULT_VERSION,
    // Set SANDBOX_DEBUG=1 in .env to log every outbound Sandbox call (method,
    // path, status) to the dev-server / function console. Never logs secrets.
    debug: env.SANDBOX_DEBUG === '1' || String(env.SANDBOX_DEBUG).toLowerCase() === 'true',
  };
}

/** One HTTPS call to Sandbox. Returns { status, data } with data JSON-parsed. */
// Redact secrets before echoing request headers to the on-screen debug panel.
function maskHeaders(h) {
  const out = {};
  for (const [k, v] of Object.entries(h || {})) {
    const kl = k.toLowerCase();
    if (kl === 'x-api-key' || kl === 'x-api-secret' || kl === 'authorization') {
      out[k] = (typeof v === 'string' && v.length > 10) ? `${v.slice(0, 8)}…••••…${v.slice(-2)}` : '••••';
    } else out[k] = v;
  }
  return out;
}

async function callSandbox(cfg, method, apiPath, headers, bodyObj) {
  const body = bodyObj ? JSON.stringify(bodyObj) : undefined;
  const sentHeaders = { accept: 'application/json', 'content-type': 'application/json', ...headers };
  const res = await fetch(`https://${cfg.host}${apiPath}`, {
    method,
    headers: sentHeaders,
    ...(body ? { body } : {}),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (cfg.debug) {
    const inner = data?.data?.status ?? data?.code ?? '';
    console.log(`[sandbox] ${method} ${apiPath} -> HTTP ${res.status}${inner !== '' ? ` (api ${inner})` : ''}`);
  }
  // Masked endpoint/header metadata for the temporary debug panel (test-only; opt-in per call).
  if (cfg._echoDebug && data && typeof data === 'object' && !Array.isArray(data)) {
    data = { ...data, _debug: {
      method, endpoint: apiPath, host: cfg.host, env: cfg.mode,
      headers: maskHeaders(sentHeaders),
      cache: res.headers.get('x-cache') || (res.headers.get('age') ? 'hit' : 'live'),
    } };
  }
  return { status: res.status, data };
}

/** One multipart/form-data call to Sandbox (for the OCR endpoints). Do NOT set
 *  content-type — fetch adds the multipart boundary automatically for a FormData body. */
async function callSandboxForm(cfg, method, apiPath, headers, formData) {
  const res = await fetch(`https://${cfg.host}${apiPath}`, {
    method,
    headers: { accept: 'application/json', ...headers },
    body: formData,
  });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (cfg.debug) console.log(`[sandbox] ${method} ${apiPath} (multipart) -> HTTP ${res.status}`);
  return { status: res.status, data };
}

/** POST /authenticate -> app access_token. */
async function authenticate(cfg) {
  const r = await callSandbox(cfg, 'POST', '/authenticate', {
    'x-api-key': cfg.apiKey,
    'x-api-secret': cfg.apiSecret,
    'x-api-version': cfg.version,
  }, null);
  console.log('[/authenticate] status:', r.status, 'body:', JSON.stringify(r.data));
  const token = r.data?.access_token || r.data?.data?.access_token || null;
  return { status: r.status, token, data: r.data };
}

/** Return a cached app token or authenticate once and cache it (~24h token, cached 23h). */
async function ensureAccessToken(cfg) {
  if (!cfg.apiKey || !cfg.apiSecret) {
    const e = new Error('SANDBOX_API_KEY / SANDBOX_API_SECRET are not configured on the server. Add them to .env (local) or Netlify → Environment variables.');
    e.statusCode = 500;
    throw e;
  }
  const cacheKey = `${cfg.host}:${cfg.apiKey}`;
  const cached = tokenCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.exp > now + 60_000) return cached.token;

  const { status, token, data } = await authenticate(cfg);
  if (!token) {
    const e = new Error('Sandbox authentication failed: ' + JSON.stringify(data));
    e.statusCode = status && status !== 200 ? status : 502;
    throw e;
  }
  tokenCache.set(cacheKey, { token, exp: now + 23 * 60 * 60 * 1000 });
  return token;
}

/** Headers for a taxpayer (post-OTP) call. `token` = session token, or app token as fallback. */
function taxpayerHeaders(cfg, token) {
  return {
    'x-api-key': cfg.apiKey,
    authorization: token,
    'x-api-version': cfg.version,
    'x-source': 'primary',
  };
}

/* ── ITR / ERI (income-tax) ──────────────────────────────────────────────────
   The ERI user session is OUR account on the ITD portal (not a per-taxpayer OTP).
   POST /it/compliance/eri/login {user_id,password} → a short-lived JWT (~15 min)
   that the taxpayer-scoped reads (prefill / e-verify / ITR-V) send as x-auth-token,
   paired with x-user-id. Cached per host+user so we log in rarely. */
const eriSessionCache = new Map();

async function eriLogin(cfg) {
  const appToken = await ensureAccessToken(cfg);
  const r = await callSandbox(cfg, 'POST', '/it/compliance/eri/login', {
    'x-api-key': cfg.apiKey,
    authorization: appToken,
    'x-api-version': cfg.version,
  }, { user_id: cfg.eriUserId, password: cfg.eriPassword });
  const token = r.data?.data?.access_token || r.data?.access_token || null;
  return { status: r.status, token, data: r.data };
}

/** Return a cached ERI session or log in once and cache it (~15 min token, cached 12 min). */
async function ensureEriSession(cfg) {
  if (!cfg.eriUserId || !cfg.eriPassword) {
    const e = new Error('ERI credentials are not configured on the server. Add SANDBOX_ERI_USER_ID / SANDBOX_ERI_PASSWORD (or the *_LIVE_/*_TEST_ variants) to .env (local) or Netlify → Environment variables.');
    e.statusCode = 500;
    throw e;
  }
  const cacheKey = `${cfg.host}:${cfg.eriUserId}`;
  const cached = eriSessionCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.exp > now + 30_000) return cached;

  const { status, token, data } = await eriLogin(cfg);
  if (!token) {
    const e = new Error('ERI login failed: ' + JSON.stringify(data));
    e.statusCode = status && status !== 200 ? status : 502;
    throw e;
  }
  const sess = { userId: cfg.eriUserId, token, exp: now + 12 * 60 * 1000 };
  eriSessionCache.set(cacheKey, sess);
  return sess;
}

/** Headers for a taxpayer-scoped ERI read (prefill / e-verify / acknowledgement). */
function eriHeaders(cfg, appToken, eri) {
  return {
    'x-api-key': cfg.apiKey,
    authorization: appToken,
    'x-api-version': cfg.version,
    'x-user-id': eri.userId,
    'x-auth-token': eri.token,
  };
}

/** Headers for the ERI filing calls (validate / submit) — app token + api key only. */
function itrFilingHeaders(cfg, appToken) {
  return {
    'x-api-key': cfg.apiKey,
    authorization: appToken,
    'x-api-version': cfg.version,
  };
}

/** URL-safe path segment for the taxpayer PAN. */
function panSeg(pan) {
  return encodeURIComponent(String(pan || '').trim().toUpperCase());
}

/**
 * Dispatch one client action. The client never sends the key/secret; the server
 * injects them. Returns { status, data } to hand straight back to the browser.
 *
 * Actions:
 *   status                                  -> validate keys (authenticate only)
 *   gstinSearch { gstin }                   -> public GSTIN lookup (no OTP)
 *   otpGenerate { gstin, username }         -> send OTP to taxpayer
 *   otpVerify   { gstin, username, otp }    -> { ...resp, sessionToken }
 *   fetch       { type, year, month, sessionToken } -> raw GSTR-2A / 2B JSON
 */
export async function handleAction(action, params = {}, cfg) {
  if (params.debug && cfg) cfg._echoDebug = true;   // debug panel: echo endpoint/headers/cache
  switch (action) {
    case 'status': {
      const token = await ensureAccessToken(cfg);
      return { status: 200, data: { ok: true, authenticated: !!token, host: cfg.host } };
    }

    case 'env': {
      // Zero-credit: report the configured environment (test/live) + host. No Sandbox
      // call — drives the PRODUCTION/TEST banner without touching a credit.
      return { status: 200, data: { mode: cfg.mode, host: cfg.host } };
    }

    case 'gstinSearch': {
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST', '/gst/compliance/public/gstin/search', {
        'x-api-key': cfg.apiKey,
        authorization: token,
        'x-api-version': '1.0',
      }, { gstin: params.gstin });
    }

    case 'otpGenerate': {
      if (!params.gstin || !params.username) return { status: 400, data: { error: 'gstin and username are required' } };
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST', '/gst/compliance/tax-payer/otp',
        taxpayerHeaders(cfg, token), { gstin: params.gstin, username: params.username });
    }

    case 'otpVerify': {
      const otp = params.otp == null ? '' : String(params.otp).trim();
      if (!otp) return { status: 400, data: { error: 'otp is required' } };
      if (!params.gstin || !params.username) return { status: 400, data: { error: 'gstin and username are required' } };
      const token = await ensureAccessToken(cfg);
      const verifyPath = '/gst/compliance/tax-payer/otp/verify?otp=' + encodeURIComponent(otp);
      const r = await callSandbox(cfg, 'POST', verifyPath,
        taxpayerHeaders(cfg, token), { gstin: params.gstin, username: params.username });
      // API-level failure (HTTP 200 + status_cd:"0"/error, e.g. AUTH4033 Invalid Session).
      const vErr = r.data?.data?.error || r.data?.error || (r.data?.data?.status_cd === '0' ? r.data?.data : null);
      // Extract a usable taxpayer session token; fall back to the app token (proven behaviour)
      // ONLY on success — on an auth error, return null so the caller never runs on a non-session.
      const raw = r.data?.data?.access_token || r.data?.access_token || null;
      const sessionToken = vErr ? null : ((raw && typeof raw === 'string' && raw.indexOf('headers') === -1) ? raw : token);
      const tokenExpiry = r.data?.data?.token_expiry || r.data?.data?.session_expiry || r.data?.token_expiry || null;
      return { status: r.status, data: { ...r.data, sessionToken, tokenExpiry } };
    }

    case 'fetch': {
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const appToken = await ensureAccessToken(cfg);
      const token = params.sessionToken || appToken;
      const sub = params.type === 'GSTR2B' ? 'gstr-2b' : 'gstr-2a';
      const apiPath = `/gst/compliance/tax-payer/gstrs/${sub}/${params.year}/${params.month}`;
      return callSandbox(cfg, 'GET', apiPath, taxpayerHeaders(cfg, token), null);
    }

    // ── Phase 2a: GSTR-1 & GSTR-3B download + save-draft ──────────────────────
    // All require a taxpayer session token (params.sessionToken); we fall back to
    // the app token only so the call is well-formed (it will 401 without a session).

    case 'gstr1Summary': {
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      const q = params.summaryType ? `?summary_type=${encodeURIComponent(params.summaryType)}` : '';
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/gstr-1/${params.year}/${params.month}${q}`,
        taxpayerHeaders(cfg, token), null);
    }

    // ── GSTR-1 filing sequence: save → proceed → EVC OTP → file (data or nil) ──
    case 'gstr1Proceed': {
      if (!params.year || !params.month || !params.gstin) return { status: 400, data: { error: 'year, month and gstin are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      const isNil = (params.isNil === 'Y' || params.isNil === true) ? 'Y' : 'N';
      const retPeriod = params.retPeriod || `${String(params.month).padStart(2, '0')}${params.year}`;
      return callSandbox(cfg, 'POST',
        `/gst/compliance/tax-payer/gstrs/gstr-1/${params.year}/${params.month}/new-proceed?is_nil=${isNil}`,
        taxpayerHeaders(cfg, token), { gstin: params.gstin, ret_period: retPeriod });
    }

    case 'gstEvcOtp': {
      if (!params.pan) return { status: 400, data: { error: 'pan is required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      const gstr = params.gstr || 'gstr-1';
      return callSandbox(cfg, 'POST',
        `/gst/compliance/tax-payer/evc/otp?gstr=${encodeURIComponent(gstr)}`,
        taxpayerHeaders(cfg, token), { pan: params.pan });
    }

    case 'gstr1File': {
      if (!params.year || !params.month || !params.pan || !params.otp || !params.body) {
        return { status: 400, data: { error: 'year, month, pan, otp and body are required' } };
      }
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST',
        `/gst/compliance/tax-payer/gstrs/gstr-1/${params.year}/${params.month}/file?pan=${encodeURIComponent(params.pan)}&otp=${encodeURIComponent(params.otp)}`,
        taxpayerHeaders(cfg, token), params.body);
    }

    case 'gstr1Reset': {
      // Clear a saved-but-unfiled GSTR-1 draft at GSTN so it can be re-saved.
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST',
        `/gst/compliance/tax-payer/gstrs/gstr-1/${params.year}/${params.month}/reset`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'gstr1Section': {
      if (!params.section || !params.year || !params.month) return { status: 400, data: { error: 'section, year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/gstr-1/${params.section}/${params.year}/${params.month}`,
        taxpayerHeaders(cfg, token), null);
    }

    // ── Electronic ledgers (cash / ITC / balance / tax-liability) — certified live
    //    against api.sandbox.co.in. Dates DD/MM/YYYY (slashes); balance/tax take
    //    calendar year + MM. Reuse the SAME taxpayer session token as every other call. ──
    case 'ledgerCash': {
      if (!params.from || !params.to) return { status: 400, data: { error: 'from and to (DD/MM/YYYY) are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/ledgers/cash?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'ledgerItc': {
      if (!params.from || !params.to) return { status: 400, data: { error: 'from and to (DD/MM/YYYY) are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/ledgers/itc?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'ledgerBalance': {
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/ledgers/bal/${params.year}/${params.month}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'ledgerTax': {
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/ledgers/tax/${params.year}/${params.month}`,
        taxpayerHeaders(cfg, token), null);
    }

    // ── GSTR-1A (amendment return) — same section structure as GSTR-1 ──────────
    case 'gstr1aSummary': {
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      const q = params.summaryType ? `?summary_type=${encodeURIComponent(params.summaryType)}` : '';
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/gstr-1a/${params.year}/${params.month}${q}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'gstr1aSection': {
      if (!params.section || !params.year || !params.month) return { status: 400, data: { error: 'section, year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/gstr-1a/${params.section}/${params.year}/${params.month}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'gstr1Save': {
      // DRAFT save — reversible on the portal via Reset. Async → returns reference_id.
      if (!params.year || !params.month || !params.body) return { status: 400, data: { error: 'year, month and body are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST',
        `/gst/compliance/tax-payer/gstrs/gstr-1/${params.year}/${params.month}`,
        taxpayerHeaders(cfg, token), params.body);
    }

    case 'gstr3bGet': {
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/gstr-3b/${params.year}/${params.month}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'gstr3bSave': {
      // DRAFT save — async → returns reference_id.
      if (!params.year || !params.month || !params.body) return { status: 400, data: { error: 'year, month and body are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST',
        `/gst/compliance/tax-payer/gstrs/gstr-3b/${params.year}/${params.month}`,
        taxpayerHeaders(cfg, token), params.body);
    }

    case 'returnStatus': {
      // Poll target for async Save/Reset/Proceed. status_cd: REC|P|PE|ER.
      if (!params.year || !params.month || !params.refId) return { status: 400, data: { error: 'year, month and refId are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/${params.year}/${params.month}/status?reference_id=${encodeURIComponent(params.refId)}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'trackReturns': {
      // List FILED returns for a period → data.data.EFiledlist[] { rtntype, ret_prd, status, dof, arn, valid }.
      // Used to confirm GSTR-1 is actually filed for a period before showing "As filed on portal".
      if (!params.year || !params.month) return { status: 400, data: { error: 'year and month are required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/${params.year}/${params.month}/track`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'sessionRefresh': {
      // Extend the taxpayer session another ~6h without a fresh OTP. Needs the
      // current taxpayer token; returns a rolled token as `sessionToken`.
      const token = params.sessionToken || await ensureAccessToken(cfg);
      const r = await callSandbox(cfg, 'POST', '/gst/compliance/tax-payer/session/refresh',
        taxpayerHeaders(cfg, token), null);
      const raw = r.data?.data?.access_token || r.data?.access_token || null;
      const sessionToken = (raw && typeof raw === 'string' && raw.indexOf('headers') === -1) ? raw : token;
      const tokenExpiry = r.data?.data?.token_expiry || r.data?.data?.session_expiry || r.data?.token_expiry || null;
      return { status: r.status, data: { ...r.data, sessionToken, tokenExpiry } };
    }

    case 'logout': {
      // Invalidate the current taxpayer session (frees a GSP session slot). The token
      // in the authorization header identifies the session to close — no body needed.
      // Used to recover from AUTH403 "Maximum sessions reached" and for manual cleanup.
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST', '/gst/compliance/tax-payer/logout',
        taxpayerHeaders(cfg, token), null);
    }

    // ── GST Analytics: GSTR-2A / 2B reconciliation (job-based, app-token auth) ──
    // submit → returns { job_id, gstr_2a_url|gstr_2b_url, purchase_ledger_url }.
    // The browser PUTs the two JSON files to those signed S3 URLs, then polls.
    case 'reconcileSubmit': {
      const { gstin, year, month } = params;
      const flavour = params.flavour === '2b' ? '2b' : '2a';
      const criteria = ['strict', 'moderate', 'flexible'].includes(params.criteria) ? params.criteria : 'strict';
      if (!gstin || !year || !month) return { status: 400, data: { error: 'gstin, year and month are required' } };
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST', `/gst/analytics/gstr-${flavour}-reconciliation`, {
        'x-api-key': cfg.apiKey, authorization: token, 'x-api-version': cfg.version,
      }, {
        '@entity': `in.co.sandbox.gst.analytics.gstr-${flavour}_reconciliation.request`,
        gstin, year: Number(year), month: Number(month), reconciliation_criteria: criteria,
      });
    }

    case 'reconcilePoll': {
      const flavour = params.flavour === '2b' ? '2b' : '2a';
      if (!params.jobId) return { status: 400, data: { error: 'jobId is required' } };
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/analytics/gstr-${flavour}-reconciliation?job_id=${encodeURIComponent(params.jobId)}`,
        { 'x-api-key': cfg.apiKey, authorization: token, 'x-api-version': cfg.version }, null);
    }

    // ── E-Way Bill: separate portal session (own EWB API username/password) ────
    // ewbAuth returns an EWB `access_token` (as ewbToken) the browser stores and
    // sends back on generate/get/cancel. The EWB portal creds are the taxpayer's,
    // registered on ewaybillgst.gov.in for the "Sandbox" GSP.
    case 'ewbAuth': {
      if (!params.gstin || !params.username || !params.password) {
        return { status: 400, data: { error: 'gstin, username and password are required' } };
      }
      const app = await ensureAccessToken(cfg);
      const r = await callSandbox(cfg, 'POST', '/gst/compliance/e-way-bill/tax-payer/authenticate', {
        'x-api-key': cfg.apiKey, authorization: app, 'x-api-version': cfg.version, 'x-source': 'primary',
      }, { username: params.username, password: params.password, gstin: params.gstin });
      const ewbToken = r.data?.data?.access_token || r.data?.access_token || null;
      const expiry = r.data?.data?.expiry || null;
      return { status: r.status, data: { ...r.data, ewbToken, expiry } };
    }

    case 'ewbGenerate': {
      if (!params.ewbToken || !params.bill) return { status: 400, data: { error: 'ewbToken and bill are required' } };
      return callSandbox(cfg, 'POST', '/gst/compliance/e-way-bill/consignor/bill', {
        'x-api-key': cfg.apiKey, authorization: params.ewbToken, 'x-api-version': cfg.version, 'x-source': 'primary',
      }, params.bill);
    }

    case 'ewbGet': {
      if (!params.ewbToken || !params.ewbNo) return { status: 400, data: { error: 'ewbToken and ewbNo are required' } };
      return callSandbox(cfg, 'GET',
        `/gst/compliance/e-way-bill/tax-payer/bill/${encodeURIComponent(params.ewbNo)}`,
        { 'x-api-key': cfg.apiKey, authorization: params.ewbToken, 'x-api-version': cfg.version, 'x-source': 'primary' }, null);
    }

    case 'ewbCancel': {
      if (!params.ewbToken || !params.ewbNo) return { status: 400, data: { error: 'ewbToken and ewbNo are required' } };
      return callSandbox(cfg, 'POST',
        `/gst/compliance/e-way-bill/consignor/bill/${encodeURIComponent(params.ewbNo)}/cancel`,
        { 'x-api-key': cfg.apiKey, authorization: params.ewbToken, 'x-api-version': cfg.version, 'x-source': 'primary' },
        { ewbNo: Number(params.ewbNo), cancelRsnCode: Number(params.cancelRsnCode) || 2, cancelRmrk: params.cancelRmrk || 'Cancelled' });
    }

    // ── E-Invoice (IRP): separate portal session (own creds), then IRN gen ──────
    case 'einvAuth': {
      if (!params.gstin || !params.username || !params.password) {
        return { status: 400, data: { error: 'gstin, username and password are required' } };
      }
      const app = await ensureAccessToken(cfg);
      const r = await callSandbox(cfg, 'POST', '/gst/compliance/e-invoice/tax-payer/authenticate?force=false', {
        'x-api-key': cfg.apiKey, authorization: app, 'x-api-version': cfg.version, 'x-source': 'primary',
      }, { username: params.username, password: params.password, gstin: params.gstin });
      const einvToken = r.data?.data?.access_token || r.data?.access_token || null;
      const expiry = r.data?.data?.expiry || null;
      return { status: r.status, data: { ...r.data, einvToken, expiry } };
    }

    case 'einvGenerate': {
      if (!params.einvToken || !params.invoice) return { status: 400, data: { error: 'einvToken and invoice are required' } };
      return callSandbox(cfg, 'POST', '/gst/compliance/e-invoice/tax-payer/invoice', {
        'x-api-key': cfg.apiKey, authorization: params.einvToken, 'x-api-version': cfg.version, 'x-source': 'primary',
      }, params.invoice);
    }

    case 'einvCancel': {
      if (!params.einvToken || !params.irn) return { status: 400, data: { error: 'einvToken and irn are required' } };
      return callSandbox(cfg, 'POST',
        `/gst/compliance/e-invoice/tax-payer/invoice/${encodeURIComponent(params.irn)}/cancel`,
        { 'x-api-key': cfg.apiKey, authorization: params.einvToken, 'x-api-version': cfg.version, 'x-source': 'primary' },
        { Irn: params.irn, CnlRsn: String(params.cnlRsn || '1'), CnlRem: params.cnlRem || 'Cancelled' });
    }

    case 'einvGet': {
      if (!params.einvToken || !params.irn) return { status: 400, data: { error: 'einvToken and irn are required' } };
      return callSandbox(cfg, 'GET',
        `/gst/compliance/e-invoice/tax-payer/invoice/${encodeURIComponent(params.irn)}`,
        { 'x-api-key': cfg.apiKey, authorization: params.einvToken, 'x-api-version': cfg.version, 'x-source': 'primary' }, null);
    }

    // ── MCA (Ministry of Corporate Affairs) — KYC company lookups ──────────────
    // App-token auth only (no taxpayer OTP/session). `x-accept-cache: true` lets
    // Sandbox serve a cached record (master data changes rarely; saves credits);
    // pass noCache:true to force a fresh source fetch.
    case 'mcaCompany': {
      const cin = String(params.cin || '').trim().toUpperCase();
      if (!cin) return { status: 400, data: { error: 'cin is required' } };
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST', '/kyc/mca/company/master-data', {
        'x-api-key': cfg.apiKey,
        authorization: token,
        'x-api-version': cfg.version,
        ...(params.noCache ? {} : { 'x-accept-cache': 'true' }),
      }, { cin });
    }

    case 'mcaSearch': {
      const q = [];
      if (params.cin) q.push('cin=' + encodeURIComponent(String(params.cin).trim().toUpperCase()));
      if (params.companyName) q.push('company_name=' + encodeURIComponent(params.companyName));
      if (!q.length) return { status: 400, data: { error: 'cin or companyName is required' } };
      if (params.limit) q.push('limit=' + encodeURIComponent(params.limit));
      if (params.offset) q.push('offset=' + encodeURIComponent(params.offset));
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET', '/kyc/mca/company/master-data/search?' + q.join('&'), {
        'x-api-key': cfg.apiKey,
        authorization: token,
        'x-api-version': cfg.version,
        'x-accept-cache': 'true',
      }, null);
    }

    // ── KYC PAN Search — registry name + email/mobile/address for a PAN ────────
    // Requires explicit end-user consent (we onboard the user's own company, so
    // the app collects it in the UI); reason is audit metadata required by ITD.
    case 'panSearch': {
      const pan = String(params.pan || '').trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return { status: 400, data: { error: 'a valid 10-character pan is required' } };
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST', '/kyc/pan/search', {
        'x-api-key': cfg.apiKey,
        authorization: token,
        'x-api-version': cfg.version,
      }, {
        '@entity': 'in.co.sandbox.kyc.pan_search.request',
        pan,
        consent: 'y',
        reason: params.reason || 'Company onboarding KYC',
      });
    }

    // ── GST public: all GSTINs registered against a PAN in a state ─────────────
    // state_code = 2-digit GST state code (e.g. 29 Karnataka). No OTP needed.
    case 'gstinsByPan': {
      const pan = String(params.pan || '').trim().toUpperCase();
      const stateCode = String(params.stateCode || '').trim();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return { status: 400, data: { error: 'a valid 10-character pan is required' } };
      if (!/^\d{2}$/.test(stateCode)) return { status: 400, data: { error: 'stateCode (2-digit GST state code) is required' } };
      const token = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST', `/gst/compliance/public/pan/search?state_code=${encodeURIComponent(stateCode)}`, {
        'x-api-key': cfg.apiKey,
        authorization: token,
        'x-api-version': '1.0',
        'x-accept-cache': 'true',
      }, { pan });
    }

    // ── GSTR-9 (annual return) — read auto-filled / saved data ──────────────────
    case 'gstr9Get': {
      if (!params.fy) return { status: 400, data: { error: 'fy (financial_year, e.g. 2023-24) is required' } };
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        `/gst/compliance/tax-payer/gstrs/gstr-9?financial_year=${encodeURIComponent(params.fy)}`,
        taxpayerHeaders(cfg, token), null);
    }

    case 'gstr9AutoCalc': {
      const token = params.sessionToken || await ensureAccessToken(cfg);
      return callSandbox(cfg, 'GET',
        '/gst/compliance/tax-payer/gstrs/gstr-9/auto-calculated',
        taxpayerHeaders(cfg, token), null);
    }

    // ── Income-Tax ITR filing via the ERI bridge ──────────────────────────────
    // Sequence: (validate → files nothing) → submit → e-verify OTP → get ITR-V.
    // Validate/Submit need only the app token + api key + the taxpayer PAN in the
    // path; prefill/e-verify/ITR-V additionally need the ERI user session.

    case 'itrStatus': {
      // Report readiness without spending a filing credit. `login:true` also proves
      // the ERI credentials by performing (and caching) a real login.
      const eriConfigured = !!(cfg.eriUserId && cfg.eriPassword);
      let eriLoggedIn = false;
      let userId = cfg.eriUserId || null;
      let error;
      try {
        await ensureAccessToken(cfg); // app keys present + valid
      } catch (e) {
        return { status: 200, data: { ok: false, host: cfg.host, mode: cfg.mode, eriConfigured, eriLoggedIn: false, userId, error: e?.message } };
      }
      if (eriConfigured && params.login) {
        try { const s = await ensureEriSession(cfg); eriLoggedIn = !!s.token; userId = s.userId; }
        catch (e) { error = e?.message; }
      }
      return { status: 200, data: { ok: true, host: cfg.host, mode: cfg.mode, eriConfigured, eriLoggedIn, userId, error } };
    }

    case 'itrValidate': {
      // Pre-file compliance check against the ITD schema/business rules. Files NOTHING.
      if (!params.taxPayerId || !params.itr) return { status: 400, data: { error: 'taxPayerId (PAN) and itr are required' } };
      const appToken = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST',
        `/it/compliance/eri/tax-payers/${panSeg(params.taxPayerId)}/itrs/validate`,
        itrFilingHeaders(cfg, appToken), params.itr);
    }

    case 'itrSubmit': {
      // FILES the return → returns arnNumber / transactionNo. Human-initiated only.
      if (!params.taxPayerId || !params.itr) return { status: 400, data: { error: 'taxPayerId (PAN) and itr are required' } };
      const appToken = await ensureAccessToken(cfg);
      return callSandbox(cfg, 'POST',
        `/it/compliance/eri/tax-payers/${panSeg(params.taxPayerId)}/itrs/submit`,
        itrFilingHeaders(cfg, appToken), params.itr);
    }

    case 'itrPrefillOtp': {
      // Send an OTP to the taxpayer to authorise pulling ITD prefill data.
      if (!params.taxPayerId || !params.assessmentYear) return { status: 400, data: { error: 'taxPayerId (PAN) and assessmentYear are required' } };
      const appToken = await ensureAccessToken(cfg);
      const eri = await ensureEriSession(cfg);
      const src = params.source || 'itd';
      return callSandbox(cfg, 'POST',
        `/it/compliance/eri/tax-payers/${panSeg(params.taxPayerId)}/prefill-json/otp?assessment_year=${encodeURIComponent(params.assessmentYear)}&source=${encodeURIComponent(src)}`,
        eriHeaders(cfg, appToken, eri), null);
    }

    case 'itrEverifyOtp': {
      // e-Verify a filed return (aadhaar / evc / dsc). Human-initiated only.
      const { taxPayerId, assessmentYear, formCode, verificationMode, acknowledgementNumber } = params;
      if (!taxPayerId || !assessmentYear || !formCode || !verificationMode || !acknowledgementNumber) {
        return { status: 400, data: { error: 'taxPayerId, assessmentYear, formCode, verificationMode and acknowledgementNumber are required' } };
      }
      const appToken = await ensureAccessToken(cfg);
      const eri = await ensureEriSession(cfg);
      const q = `assessment_year=${encodeURIComponent(assessmentYear)}&form_code=${encodeURIComponent(formCode)}&verification_mode=${encodeURIComponent(verificationMode)}&acknowledgement_number=${encodeURIComponent(acknowledgementNumber)}`;
      return callSandbox(cfg, 'POST',
        `/it/compliance/eri/tax-payers/${panSeg(taxPayerId)}/itrs/e-verify/otp?${q}`,
        eriHeaders(cfg, appToken, eri), null);
    }

    case 'itrAck': {
      // Fetch the ITR-V acknowledgement for a filed return.
      if (!params.taxPayerId || !params.acknowledgementNumber) return { status: 400, data: { error: 'taxPayerId (PAN) and acknowledgementNumber are required' } };
      const appToken = await ensureAccessToken(cfg);
      const eri = await ensureEriSession(cfg);
      return callSandbox(cfg, 'GET',
        `/it/compliance/eri/tax-payers/${panSeg(params.taxPayerId)}/itrs/itr-v?acknowledgement_number=${encodeURIComponent(params.acknowledgementNumber)}`,
        eriHeaders(cfg, appToken, eri), null);
    }

    // ── Income-Tax OCR (Form 16 / Form 26AS) — app-token auth ONLY, NO ERI needed.
    //    The CA uploads the PDF (base64); Sandbox OCR returns structured data.
    case 'ocrForm16': {
      if (!params.fileBase64) return { status: 400, data: { error: 'fileBase64 (the Form-16 PDF) is required' } };
      const token = await ensureAccessToken(cfg);
      const buf = Buffer.from(params.fileBase64, 'base64');
      const fd = new FormData();
      fd.append('file', new Blob([buf], { type: 'application/pdf' }), params.filename || 'form16.pdf');
      const q = params.password ? ('?password=' + encodeURIComponent(params.password)) : '';
      return callSandboxForm(cfg, 'POST', '/it/ocr/form-16/pdf' + q,
        { 'x-api-key': cfg.apiKey, authorization: token, 'x-api-version': cfg.version }, fd);
    }

    case 'ocrForm26as': {
      if (!params.fileBase64) return { status: 400, data: { error: 'fileBase64 (the Form-26AS PDF) is required' } };
      const token = await ensureAccessToken(cfg);
      const buf = Buffer.from(params.fileBase64, 'base64');
      const fd = new FormData();
      fd.append('file', new Blob([buf], { type: 'application/pdf' }), params.filename || 'form26as.pdf');
      return callSandboxForm(cfg, 'POST', '/it/ocr/form-26as/pdf',
        { 'x-api-key': cfg.apiKey, authorization: token, 'x-api-version': cfg.version }, fd);
    }

    default:
      return { status: 400, data: { error: 'Unknown action: ' + action } };
  }
}
