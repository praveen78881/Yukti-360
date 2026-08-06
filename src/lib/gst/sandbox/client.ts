// Browser-side client for the Sandbox GST proxy. Talks ONLY to our own
// serverless function (Netlify in prod, Vite dev-middleware on localhost:3000);
// the API key/secret live server-side and never reach here.

import type { GstReturnType } from './types';
import { pushGstApiLog } from './apiLog';

const ENDPOINT = '/.netlify/functions/gst-sandbox';

export interface SandboxResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

async function call<T = any>(action: string, params: Record<string, unknown> = {}): Promise<SandboxResult<T>> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });
  } catch (e: any) {
    const error = e?.message || 'Network error — is the dev server running?';
    pushGstApiLog({ action, params, status: 0, ok: false, response: { error }, error });
    return { ok: false, status: 0, data: {} as T, error };
  }
  let data: any = {};
  try { data = await res.json(); } catch { /* non-JSON */ }
  const error = res.ok ? undefined : (data?.error || data?.message || `Request failed (${res.status})`);
  // Record the RAW response for the open GST API log (the ground truth per call).
  pushGstApiLog({ action, params, status: res.status, ok: res.ok, response: data, error });
  return { ok: res.ok, status: res.status, data: data as T, error };
}

export const sandboxClient = {
  /** Validate that the server keys authenticate (no taxpayer data touched). */
  status: () => call<{ ok: boolean; authenticated: boolean; host: string }>('status'),

  /** The server's configured environment (test/live) + host. No auth, no credit — drives the PROD banner. */
  getEnv: () => call<{ mode: 'test' | 'live'; host: string }>('env'),

  /** Public GSTIN lookup — no OTP/session needed. `env` forces test/live for this call. */
  gstinSearch: (gstin: string, env?: 'test' | 'live') => call('gstinSearch', env ? { gstin, env } : { gstin }),

  /** Send an OTP to the taxpayer's registered mobile/email. */
  otpGenerate: (gstin: string, username: string) => call('otpGenerate', { gstin, username }),

  /** Verify the OTP → returns { sessionToken } (also merged into data). */
  otpVerify: (gstin: string, username: string, otp: string) =>
    call<{ sessionToken?: string; tokenExpiry?: number; status_cd?: string }>('otpVerify', { gstin, username, otp }),

  /** Fetch GSTR-2A / 2B for a period. sessionToken from a prior otpVerify. */
  fetchReturn: (type: GstReturnType, year: string, month: string, sessionToken?: string) =>
    call('fetch', { type, year, month, sessionToken }),

  // ── Phase 2a: GSTR-1 & GSTR-3B download + save-draft ──
  gstr1Summary: (year: string, month: string, sessionToken?: string, summaryType?: 'long') =>
    call('gstr1Summary', { year, month, sessionToken, summaryType }),
  /** Initialise GSTR-1 filing (is_nil Y for nil). Returns reference_id to poll. */
  gstr1Proceed: (p: { year: string; month: string; gstin: string; isNil?: 'Y' | 'N'; retPeriod?: string; sessionToken?: string }) =>
    call('gstr1Proceed', p),
  /** Generate an EVC OTP (sent to the taxpayer) to sign the filing. */
  gstEvcOtp: (pan: string, gstr = 'gstr-1', sessionToken?: string) =>
    call('gstEvcOtp', { pan, gstr, sessionToken }),
  /** File GSTR-1 with pan+otp. body = { ret_period, sec_sum, chksum, gstin, newSumFlag } or nil { ret_period, gstin, isnil:'Y' }. */
  gstr1File: (p: { year: string; month: string; pan: string; otp: string; body: Record<string, unknown>; sessionToken?: string }) =>
    call('gstr1File', p),
  /** Clear a saved-but-unfiled GSTR-1 draft at GSTN (→ reference_id). */
  gstr1Reset: (year: string, month: string, sessionToken?: string) =>
    call('gstr1Reset', { year, month, sessionToken }),
  gstr1Section: (section: string, year: string, month: string, sessionToken?: string) =>
    call('gstr1Section', { section, year, month, sessionToken }),

  // ── Electronic ledgers (reuse the shared taxpayer session; dates DD/MM/YYYY) ──
  ledgerCash: (from: string, to: string, sessionToken?: string) => call('ledgerCash', { from, to, sessionToken }),
  ledgerItc: (from: string, to: string, sessionToken?: string) => call('ledgerItc', { from, to, sessionToken }),
  ledgerBalance: (year: string, month: string, sessionToken?: string) => call('ledgerBalance', { year, month, sessionToken }),
  ledgerTax: (year: string, month: string, sessionToken?: string) => call('ledgerTax', { year, month, sessionToken }),
  /** GSTR-1A summary (table-wise) for a period. */
  gstr1aSummary: (year: string, month: string, sessionToken?: string, summaryType?: 'long') =>
    call('gstr1aSummary', { year, month, sessionToken, summaryType }),
  /** GSTR-1A section detail. */
  gstr1aSection: (section: string, year: string, month: string, sessionToken?: string) =>
    call('gstr1aSection', { section, year, month, sessionToken }),
  gstr1Save: (year: string, month: string, body: unknown, sessionToken?: string) =>
    call('gstr1Save', { year, month, body, sessionToken }),
  gstr3bGet: (year: string, month: string, sessionToken?: string) =>
    call('gstr3bGet', { year, month, sessionToken }),
  gstr3bSave: (year: string, month: string, body: unknown, sessionToken?: string) =>
    call('gstr3bSave', { year, month, body, sessionToken }),
  returnStatus: (year: string, month: string, refId: string, sessionToken?: string) =>
    call('returnStatus', { year, month, refId, sessionToken }),
  /** List filed returns for a period → data.data.EFiledlist[] { rtntype, ret_prd, status, dof, arn, valid }. */
  trackReturns: (year: string, month: string, sessionToken?: string) =>
    call<{ EFiledlist?: Array<{ arn: string; ret_prd: string; mof: string; dof: string; rtntype: string; status: string; valid: string }> }>('trackReturns', { year, month, sessionToken }),

  /** Extend a taxpayer session ~6h without a new OTP. Returns a rolled sessionToken + expiry. */
  sessionRefresh: (sessionToken?: string) =>
    call<{ sessionToken?: string; tokenExpiry?: number }>('sessionRefresh', { sessionToken }),

  /** Invalidate the taxpayer session (frees a GSP session slot). */
  logout: (sessionToken?: string) =>
    call<{ status_cd?: string }>('logout', { sessionToken }),

  // ── GSTR-2A / 2B reconciliation (analytics, job-based) ──
  /** Create a reconciliation job → returns job_id + signed upload URLs. */
  reconcileSubmit: (p: {
    gstin: string; year: string | number; month: string | number;
    criteria?: 'strict' | 'moderate' | 'flexible'; flavour?: '2a' | '2b';
  }) => call('reconcileSubmit', p),
  /** Poll a reconciliation job by id until status is succeeded/failed. */
  reconcilePoll: (jobId: string, flavour: '2a' | '2b' = '2a') =>
    call('reconcilePoll', { jobId, flavour }),

  // ── E-Way Bill (separate EWB portal session) ──
  /** Authenticate the EWB portal session → returns { ewbToken, expiry }. */
  ewbAuth: (gstin: string, username: string, password: string) =>
    call<{ ewbToken?: string; expiry?: number; data?: any }>('ewbAuth', { gstin, username, password }),
  /** Generate an e-Way Bill from a full EWB payload. Needs a live ewbToken. */
  ewbGenerate: (ewbToken: string, bill: Record<string, unknown>) =>
    call('ewbGenerate', { ewbToken, bill }),
  /** Fetch an e-Way Bill by number. */
  ewbGet: (ewbToken: string, ewbNo: string | number) =>
    call('ewbGet', { ewbToken, ewbNo }),
  /** Cancel an e-Way Bill (reason codes: 1 Duplicate, 2 Order cancelled, 3 Data entry error, 4 Others). */
  ewbCancel: (ewbToken: string, ewbNo: string | number, cancelRsnCode: number, cancelRmrk?: string) =>
    call('ewbCancel', { ewbToken, ewbNo, cancelRsnCode, cancelRmrk }),

  // ── E-Invoice (IRP portal session) ──
  /** Authenticate the e-Invoice portal session → returns { einvToken, expiry }. */
  einvAuth: (gstin: string, username: string, password: string) =>
    call<{ einvToken?: string; expiry?: number; data?: any }>('einvAuth', { gstin, username, password }),
  /** Generate an IRN from a full NIC e-invoice payload. Needs a live einvToken. */
  einvGenerate: (einvToken: string, invoice: Record<string, unknown>) =>
    call('einvGenerate', { einvToken, invoice }),
  /** Cancel an e-Invoice by IRN (CnlRsn: 1 Duplicate, 2 Data entry mistake). */
  einvCancel: (einvToken: string, irn: string, cnlRsn: number | string, cnlRem?: string) =>
    call('einvCancel', { einvToken, irn, cnlRsn, cnlRem }),
  /** Fetch an e-Invoice by IRN. */
  einvGet: (einvToken: string, irn: string) => call('einvGet', { einvToken, irn }),

  // ── MCA (Ministry of Corporate Affairs) — KYC company lookups ──
  /** Company master data by CIN or LLPIN. App-token auth, no OTP. `env` forces test/live. */
  mcaCompany: (cin: string, env?: 'test' | 'live', noCache?: boolean) =>
    call('mcaCompany', { cin, ...(env ? { env } : {}), ...(noCache ? { noCache: true } : {}) }),
  /** Search companies by exact CIN or partial name → lightweight { cin, company_name } records. */
  mcaSearch: (p: { cin?: string; companyName?: string; limit?: number; offset?: number; env?: 'test' | 'live' }) =>
    call('mcaSearch', p),

  // ── KYC / GST public — PAN-driven enrichment ──
  /** ITD registry record for a PAN: name, category, email, mobile, address, DOB/DOI. */
  panSearch: (pan: string, env?: 'test' | 'live', reason?: string) =>
    call('panSearch', { pan, ...(env ? { env } : {}), ...(reason ? { reason } : {}) }),
  /** All GSTINs registered against a PAN in a state (2-digit GST state code, e.g. "29"). */
  gstinsByPan: (pan: string, stateCode: string, env?: 'test' | 'live') =>
    call('gstinsByPan', { pan, stateCode, ...(env ? { env } : {}) }),

  // ── GSTR-9 (annual) ──
  /** Read GSTR-9 details for an FY (e.g. "2023-24"). Needs a taxpayer session. */
  gstr9Get: (fy: string, sessionToken?: string) => call('gstr9Get', { fy, sessionToken }),
  /** Read GSTR-9 auto-calculated figures. Needs a taxpayer session. */
  gstr9AutoCalc: (sessionToken?: string) => call('gstr9AutoCalc', { sessionToken }),
};

/**
 * Upload a JSON payload to a Sandbox pre-signed S3 URL (reconciliation inputs).
 * This goes DIRECT to S3 — no API keys, no auth headers, do not modify the URL.
 */
export async function putSignedFile(url: string, json: unknown): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(json),
    });
    return { ok: res.ok, status: res.status, error: res.ok ? undefined : `Upload failed (${res.status})` };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || 'Upload network error' };
  }
}

/** Terminal status from the async Save/Reset poll. */
export interface SaveOutcome {
  ok: boolean;
  status_cd?: string;          // P | PE | ER (terminal) or REC (still processing)
  reference_id?: string;
  errorReport?: unknown;       // per-section errors when PE/ER
  message?: string;
  raw?: any;
}

/** Pull the reference_id out of Sandbox's `{ data: { data: { reference_id } } }` envelope. */
export function extractReferenceId(data: any): string | undefined {
  return data?.data?.data?.reference_id || data?.data?.reference_id || data?.reference_id;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drive an async save to a terminal state: given the reference_id, poll
 * returnStatus until status_cd leaves REC (or attempts run out). Minimal calls:
 * short bounded loop, stops the moment it's terminal.
 */
export async function pollSaveOutcome(
  year: string, month: string, refId: string, sessionToken?: string,
  { attempts = 8, intervalMs = 2000 }: { attempts?: number; intervalMs?: number } = {},
): Promise<SaveOutcome> {
  for (let i = 0; i < attempts; i++) {
    await delay(i === 0 ? 1200 : intervalMs);
    const r = await sandboxClient.returnStatus(year, month, refId, sessionToken);
    if (!r.ok) return { ok: false, reference_id: refId, message: r.error, raw: r.data };
    const d = (r.data?.data?.data ?? r.data?.data ?? r.data) as any;
    const cd = d?.status_cd;
    if (cd && cd !== 'REC') {
      return {
        ok: cd === 'P',
        status_cd: cd,
        reference_id: refId,
        errorReport: d?.error_report,
        message: cd === 'P' ? 'Processed successfully'
          : cd === 'PE' ? 'Processed with errors' : 'Processing failed',
        raw: r.data,
      };
    }
  }
  return { ok: false, status_cd: 'REC', reference_id: refId, message: 'Still processing — check again shortly.' };
}
