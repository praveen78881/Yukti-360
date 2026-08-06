// ── One place for the shared GST taxpayer session ────────────────────────────
// A thin facade over the existing store + session primitives, re-exported under
// clean names so every GST module ("GSTR-1/1A/2A/2B/3B, recon, live Search")
// imports its session helpers from HERE. No behaviour change: the underlying
// `sandbox/session.ts` + `sandbox/store.ts` files stay exactly where they are
// (13 other files import them directly) — this only adds a single, obvious entry
// point plus `sessionStatus()` for the UI.
//
// The ONE session ({token, exp} in localStorage `ca_gst_sessions_v1`, per GSTIN,
// ~6h) authorises every return type. Connect once → reuse everywhere → the max
// concurrent GSP-session limit (AUTH403) is never hit by repeated OTP logins.

export {
  getUsableSession as ensureSession,
  logoutSession,
  logoutAllSessions,
  formatRemaining,
} from './sandbox/session';
export type { Session } from './sandbox/session';

export {
  getSessionInfo,
  getSessionToken,
  setSessionToken,
  clearSessionToken,
} from './sandbox/store';

import { getSessionInfo } from './sandbox/store';
import { formatRemaining } from './sandbox/session';

export type SessionState = 'active' | 'expired' | 'none';

export interface SessionStatus {
  state: SessionState;
  /** Absolute expiry (ms) — present only when `state === 'active'`. */
  exp?: number;
  /** Short human label for the status pill. */
  label: string;
}

/**
 * Current status of the shared taxpayer session for a GSTIN, computed fresh from
 * storage (safe to call on every render). Drive the "Connect to GST" pill from this:
 *   active  → "Connected · 5h 23m left"
 *   expired → "Session expired"
 *   none    → "Not connected"
 */
export function sessionStatus(gstin: string): SessionStatus {
  const s = gstin ? getSessionInfo(gstin) : null;
  if (!s) return { state: 'none', label: 'Not connected' };
  if (s.exp <= Date.now()) return { state: 'expired', label: 'Session expired' };
  return { state: 'active', exp: s.exp, label: `Connected · ${formatRemaining(s.exp)} left` };
}
