// Taxpayer session manager. GSTN allows only OTP login (no password API), so:
//   • after one OTP verify, the session token is reused for ALL fetches (~6h);
//   • before it expires it is REFRESHED without a new OTP (Refresh Access Token);
//   • a fresh OTP is only needed when there is no valid/refreshable session.
// The UI shows the remaining validity via formatRemaining().

import { sandboxClient } from './client';
import { getSessionInfo, setSessionToken, clearSessionToken, getAllSessions, clearAllSessions } from './store';

const REFRESH_WINDOW_MS = 30 * 60 * 1000;   // extend when < 30 min remains
const MIN_USABLE_MS = 60 * 1000;            // treat < 1 min as unusable
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

export interface Session { token: string; exp: number }

/**
 * Return a usable taxpayer token for this GSTIN, transparently refreshing before
 * expiry. Returns null when a fresh OTP is required (no valid/refreshable session).
 */
export async function getUsableSession(gstin: string): Promise<Session | null> {
  const s = getSessionInfo(gstin);
  const now = Date.now();
  if (!s || s.exp <= now + MIN_USABLE_MS) return null; // none / expired → OTP needed

  // Still valid but close to expiry → extend without OTP.
  if (s.exp < now + REFRESH_WINDOW_MS) {
    const r = await sandboxClient.sessionRefresh(s.token);
    const tok = r.data?.sessionToken;
    if (r.ok && tok) {
      const exp = r.data?.tokenExpiry || now + DEFAULT_TTL_MS;
      setSessionToken(gstin, tok, exp);
      return { token: tok, exp };
    }
    // Refresh failed but the current token is still valid for now — use it.
    return { token: s.token, exp: s.exp };
  }
  return { token: s.token, exp: s.exp };
}

/**
 * Close the taxpayer session at GSTN (frees a GSP session slot) and drop it locally.
 * Best-effort: the local session is always cleared even if the API call fails. Use to
 * recover from AUTH403 "Maximum sessions reached" and for manual "Clear session".
 */
export async function logoutSession(gstin: string): Promise<void> {
  const s = getSessionInfo(gstin);
  if (s?.token) {
    try { await sandboxClient.logout(s.token); } catch { /* best-effort — still clear locally */ }
  }
  clearSessionToken(gstin);
}

/**
 * Force-clear EVERY taxpayer session: close each one we still hold a token for at GSTN
 * (best-effort, in parallel), then wipe all local sessions. Frees every GSP slot we can.
 * NOTE: sessions we no longer hold a token for (orphaned by repeated OTP logins) can't be
 * closed via the API — those only clear by expiry (~6h) or a Sandbox-support reset.
 */
export async function logoutAllSessions(): Promise<{ closed: number; total: number }> {
  const all = getAllSessions();
  const tokens = Object.values(all).map((s) => s?.token).filter(Boolean) as string[];
  const results = await Promise.allSettled(tokens.map((t) => sandboxClient.logout(t)));
  clearAllSessions();
  return { closed: results.filter((r) => r.status === 'fulfilled').length, total: tokens.length };
}

/** Remaining validity as a short label, e.g. "5h 23m" / "18m" / "expired". */
export function formatRemaining(exp?: number | null): string {
  if (!exp) return '';
  const ms = exp - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
