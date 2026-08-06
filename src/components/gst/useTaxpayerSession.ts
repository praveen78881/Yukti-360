import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { getSessionInfo, setSessionToken } from '@/lib/gst/sandbox/store';
import { getUsableSession, logoutSession, logoutAllSessions, formatRemaining } from '@/lib/gst/sandbox/session';

type Phase = 'idle' | 'otp' | 'busy';

export type SessionStatus =
  | { state: 'none'; label: string }
  | { state: 'expired'; label: string }
  | { state: 'active'; label: string; exp: number };

// Sandbox returns errors as HTTP 200 + { data: { status_cd: "0", error: {...} } }, so HTTP r.ok
// is NOT enough — always inspect the API-level status_cd/error.
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

/**
 * Manages the ~6h taxpayer session for portal actions. `run(fn)` runs fn with a live session
 * token, REUSING an existing session (auto-refreshing before expiry — no OTP) whenever possible.
 *
 * Every response is checked at the API level (status_cd:"0"/error), not just HTTP, so:
 *   • an AUTH403 (max sessions) at OTP-generate is caught → auto-logout + retry once, and if it
 *     STILL fails the flow STOPS with an honest message (excess sessions must expire ~6h);
 *   • an AUTH4033 (Invalid Session) at verify is caught → we never store a bogus session.
 * `logout()` closes the session at GSTN and frees the GSP slot.
 */
export function useTaxpayerSession(gstin: string, username: string) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [otp, setOtp] = useState('');
  const [tick, setTick] = useState(0);
  const pending = useRef<((token: string) => void | Promise<void>) | null>(null);
  const bump = () => setTick((t) => t + 1);

  const sessionStatus = (): SessionStatus => {
    const s = getSessionInfo(gstin);
    if (!s) return { state: 'none', label: 'No active session' };
    if (s.exp <= Date.now()) return { state: 'expired', label: 'Session expired' };
    return { state: 'active', label: `Active · ${formatRemaining(s.exp)} left`, exp: s.exp };
  };

  // Generate OTP; on AUTH403 (max sessions — arrives as HTTP 200 + status_cd:"0") close the stored
  // session and retry ONCE. Returns the (possibly still-failing) response for the caller to judge.
  const generateOtp = async (): Promise<ApiResp> => {
    let r: ApiResp = await sandboxClient.otpGenerate(gstin, username);
    if (isAuth403(r)) {
      toast.message('Too many GSP sessions — closing the stored one and retrying…');
      await logoutSession(gstin); bump();
      r = await sandboxClient.otpGenerate(gstin, username);
    }
    return r;
  };

  const run = async (fn: (token: string) => void | Promise<void>) => {
    if (!gstin || !username) { toast.error('GSTIN and portal username are required'); return; }
    const usable = await getUsableSession(gstin);
    if (usable) { bump(); await fn(usable.token); return; }
    pending.current = fn;
    setPhase('busy');
    const r = await generateOtp();
    const err = apiError(r);
    if (!r.ok || err) {
      // Quote the API's OWN error_cd + message — the raw response is in the 🐞 API Log.
      const errCd = (err as any)?.error_cd || (err as any)?.errorCode || (err as any)?.code;
      const errMsg = (err as any)?.message || r.error || 'Could not send OTP';
      toast.error(
        `${isAuth403(r) ? 'GSP session limit' : 'GST portal error'}: ${errCd ? errCd + ' — ' : ''}${errMsg}` +
        ' · open the 🐞 API Log for the raw response',
        { duration: 9000 },
      );
      setPhase('idle'); pending.current = null; bump(); return;
    }
    toast.success("OTP sent to the taxpayer's registered mobile/email");
    setPhase('otp');
  };

  const verify = async () => {
    if (!otp.trim()) { toast.error('Enter the OTP'); return; }
    setPhase('busy');
    const r: ApiResp = await sandboxClient.otpVerify(gstin, username, otp.trim());
    const err = apiError(r);
    const token = err ? null : r.data?.sessionToken;
    // Reject on any API-level error (e.g. AUTH4033 Invalid Session) — never store a fallback token.
    if (!r.ok || err || !token) { toast.error(err?.message || r.error || 'OTP verification failed'); setPhase('otp'); return; }
    setSessionToken(gstin, token, r.data?.tokenExpiry || undefined);
    setOtp(''); bump();
    const fn = pending.current;
    pending.current = null;
    setPhase('idle');
    if (fn) await fn(token);
  };

  // Force-clear ALL sessions: close every token we hold at GSTN, then wipe all local.
  const logout = async () => {
    setPhase('busy');
    try { const r = await logoutAllSessions(); toast.success(`Closed ${r.closed}/${r.total} GSTN session(s) · all local cleared`); }
    catch { toast.error('Could not reach GSTN — all local sessions cleared'); }
    pending.current = null; setOtp(''); bump(); setPhase('idle');
  };

  const cancel = () => { pending.current = null; setPhase('idle'); setOtp(''); };

  return { phase, otp, setOtp, run, verify, cancel, logout, sessionStatus, tick };
}
