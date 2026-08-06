// ── GstSessionProvider — the single, global GST taxpayer session ─────────────
// Mounted once (in the company layout) so EVERY GST page shares one reactive
// session and ONE OTP modal. Connect once → reuse everywhere.
//
//   const { ensureToken, status, connect, logout } = useGstSession();
//
//   ensureToken()  → the function every module calls before a portal API call.
//                    Reuses/refreshes the stored session with no OTP; only when
//                    there's no usable session does it auto-open the OTP modal.
//   connect()      → drive the OTP flow now (used by the "Connect to GST" button).
//   logout()       → close the session at GSTN + clear locally.
//   status()       → { state, label, exp } for the reactive status pill.
//
// Errors are inspected at the API level (Sandbox returns auth failures as HTTP
// 200 + { data: { status_cd:"0", error } }) — never trust HTTP r.ok alone. An
// AUTH403 (max GSP sessions) at OTP-generate auto-logs-out the stored session and
// retries once; an AUTH4033 (Invalid Session) at verify never stores a token.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { GstApiLog } from '@/components/gst/GstApiLog';
import { clearGstApiLog } from '@/lib/gst/sandbox/apiLog';
import { useCompany } from '@/hooks/useCompany';
import {
  ensureSession, logoutSession, setSessionToken, sessionStatus,
  type SessionStatus,
} from '@/lib/gst/session';

// Sandbox returns errors as HTTP 200 + { data: { status_cd:"0", error } }, so
// HTTP r.ok is NOT enough — always inspect the API-level status_cd/error.
type ApiResp = { ok?: boolean; error?: string; data?: any };
const apiError = (r: ApiResp): { message?: string; error_cd?: string } | null => {
  const d = r?.data?.data ?? r?.data;
  if (d?.status_cd === '0' || d?.error) return d?.error ?? d;
  return null;
};
const isAuth403 = (r: ApiResp): boolean => {
  const e = apiError(r);
  return /AUTH403|Maximum session/i.test(`${e?.message ?? ''} ${e?.error_cd ?? ''} ${r?.error ?? ''}`);
};

export interface GstSession {
  /** Reactive status of the shared session (read fresh from storage). */
  status: () => SessionStatus;
  /** Drive the OTP flow now → resolves with the new token (or null if cancelled/failed). */
  connect: () => Promise<string | null>;
  /** Close the session at GSTN + clear locally. */
  logout: () => Promise<void>;
  /** THE call every module makes before a portal request: reuse/refresh, else OTP. */
  ensureToken: () => Promise<string | null>;
  /** GSTIN + portal username currently in scope (from the company profile). */
  gstin: string;
  username: string;
}

const GstSessionCtx = createContext<GstSession | null>(null);

export function GstSessionProvider({ children }: { children: ReactNode }) {
  const { company } = useCompany();
  const gstin = company?.gst_details?.gstin ?? '';
  const username = company?.gst_details?.portalUsername ?? '';

  // `tick` bumps ONLY on real changes (connect / verify / logout) so context
  // consumers re-render then — not on a global interval. The live countdown is a
  // local concern of the status pill (GstConnectButton runs its own interval).
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  // Single global OTP modal state.
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((token: string | null) => void) | null>(null);

  // If the provider unmounts (or the company switches) mid-OTP, don't leave an
  // awaited connect() hanging forever — resolve it as cancelled.
  useEffect(() => () => { resolver.current?.(null); resolver.current = null; }, []);

  // Company sandbox: the API debug log is a shared in-memory buffer — wipe it on
  // every company/GSTIN switch so one company's calls never show under another.
  useEffect(() => { clearGstApiLog(); }, [gstin]);

  const status = useCallback((): SessionStatus => sessionStatus(gstin), [gstin]);

  // Generate OTP; on AUTH403 (max sessions, HTTP 200 + status_cd:"0") close the
  // stored session and retry ONCE. Returns the (possibly still-failing) response.
  const generateOtp = useCallback(async (): Promise<ApiResp> => {
    let r: ApiResp = await sandboxClient.otpGenerate(gstin, username);
    if (isAuth403(r)) {
      toast.message('Too many GSP sessions — closing the stored one and retrying…');
      await logoutSession(gstin); bump();
      r = await sandboxClient.otpGenerate(gstin, username);
    }
    return r;
  }, [gstin, username, bump]);

  const connect = useCallback(async (): Promise<string | null> => {
    if (!gstin || !username) {
      toast.error('Set the GSTIN and GST portal username in Company Settings (GST & e-Way Bill) first.');
      return null;
    }
    // Reuse a still-valid session instead of burning a new OTP / GSP slot.
    const existing = await ensureSession(gstin);
    if (existing) { bump(); return existing.token; }

    setBusy(true);
    const r = await generateOtp();
    const err = apiError(r);
    setBusy(false);
    if (!r.ok || err) {
      // Quote the API's OWN words (error_cd + message) — never a canned interpretation.
      // The raw response is in the 🐞 API Log; this is just the headline.
      const errCd = (err as any)?.error_cd || (err as any)?.errorCode || (err as any)?.code;
      const errMsg = (err as any)?.message || r.error || 'Could not send OTP';
      const auth = isAuth403(r);
      toast.error(
        `${auth ? 'GSP session limit' : 'GST portal error'}: ${errCd ? errCd + ' — ' : ''}${errMsg}` +
        ' · open the 🐞 API Log for the raw response',
        { duration: 9000 },
      );
      return null;
    }
    toast.success("OTP sent to the taxpayer's registered mobile/email");
    setOtp('');
    setOtpOpen(true);
    // Park until the user verifies or cancels in the global modal.
    return await new Promise<string | null>((resolve) => { resolver.current = resolve; });
  }, [gstin, username, generateOtp, bump]);

  const verify = useCallback(async () => {
    if (!otp.trim()) { toast.error('Enter the OTP'); return; }
    setBusy(true);
    const r: ApiResp = await sandboxClient.otpVerify(gstin, username, otp.trim());
    const err = apiError(r);
    const token = err ? null : r.data?.sessionToken;
    // Reject on any API-level error (e.g. AUTH4033 Invalid Session) — never store a fallback token.
    if (!r.ok || err || !token) {
      toast.error(err?.message || r.error || 'OTP verification failed');
      setBusy(false);
      return; // keep the modal open for a retry
    }
    setSessionToken(gstin, token, r.data?.tokenExpiry || undefined);
    setBusy(false);
    setOtpOpen(false);
    setOtp('');
    bump();
    const resolve = resolver.current; resolver.current = null;
    resolve?.(token);
  }, [otp, gstin, username, bump]);

  const cancel = useCallback(() => {
    setOtpOpen(false);
    setOtp('');
    setBusy(false);
    const resolve = resolver.current; resolver.current = null;
    resolve?.(null);
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await logoutSession(gstin);
      toast.success('GST session closed');
    } catch {
      toast.error('Could not reach GSTN — the local session was cleared anyway');
    }
    setBusy(false);
    bump();
  }, [gstin, bump]);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    if (!gstin) { toast.error('No GSTIN configured for this company.'); return null; }
    const s = await ensureSession(gstin); // reuse if valid; auto-refresh if <30 min left
    if (s) return s.token;
    return await connect();                // no/expired session → auto-open the OTP modal
  }, [gstin, connect]);

  const value = useMemo<GstSession>(
    () => ({ status, connect, logout, ensureToken, gstin, username }),
    // `tick` is intentionally a dep: a real session change bumps it so consumers re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, connect, logout, ensureToken, gstin, username, tick],
  );

  return (
    <GstSessionCtx.Provider value={value}>
      {children}
      {otpOpen && (
        <OtpModal
          gstin={gstin}
          otp={otp}
          setOtp={setOtp}
          busy={busy}
          onVerify={verify}
          onCancel={cancel}
        />
      )}
      <GstApiLog />
    </GstSessionCtx.Provider>
  );
}

/** Access the shared GST session. Must be inside <GstSessionProvider>. */
export function useGstSession(): GstSession {
  const ctx = useContext(GstSessionCtx);
  if (!ctx) throw new Error('useGstSession must be used within <GstSessionProvider>');
  return ctx;
}

// ── The single global OTP modal ──────────────────────────────────────────────
function OtpModal({
  gstin, otp, setOtp, busy, onVerify, onCancel,
}: {
  gstin: string;
  otp: string;
  setOtp: (v: string) => void;
  busy: boolean;
  onVerify: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-gray-900">GST portal OTP</h3>
        <p className="mt-1 text-xs text-gray-500">
          An OTP was sent to the mobile/email registered against{' '}
          <span className="font-mono text-gray-700">{gstin}</span>. Enter it to open a ~6h session —
          reused by every GST module, no repeat OTP.
        </p>
        <input
          autoFocus
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !busy) onVerify(); }}
          placeholder="Enter OTP"
          inputMode="numeric"
          maxLength={8}
          disabled={busy}
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.3em] focus:border-blue-500 focus:outline-none disabled:opacity-60"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={onVerify} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
