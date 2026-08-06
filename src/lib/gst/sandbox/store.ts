// Persistence for the GST download feature:
//   • taxpayer session tokens — localStorage, per GSTIN, ~6h (so one OTP is
//     reused for all reads within the window — the core call-minimisation win);
//   • downloaded returns — via offlineDb entity_data (module 'gst'), which
//     auto-mirrors to Supabase and lives under the company like every other module.

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';
import type { GstDownloadRecord, GstReturnType } from './types';

// ── Session tokens (per GSTIN) ──────────────────────────────────────────────

const SESSION_KEY = 'ca_gst_sessions_v1';
const SESSION_TTL_MS = 6 * 60 * 60 * 1000; // ~6h taxpayer session

type SessionMap = Record<string, { token: string; exp: number }>;

function loadSessions(): SessionMap {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; }
}
function saveSessions(m: SessionMap) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(m)); } catch { /* quota */ }
}

/** A live session token for this GSTIN, or null if none/expired. */
export function getSessionToken(gstin: string): string | null {
  const s = loadSessions()[gstin];
  if (s && s.exp > Date.now() + 30_000) return s.token;
  return null;
}

/** The stored session record (token + absolute expiry ms), or null. */
export function getSessionInfo(gstin: string): { token: string; exp: number } | null {
  return loadSessions()[gstin] ?? null;
}

/** Store the session. Pass the API's absolute `token_expiry` (ms) when known;
 *  otherwise a ~6h TTL is assumed. */
export function setSessionToken(gstin: string, token: string, expiryMs?: number) {
  const m = loadSessions();
  const exp = expiryMs && expiryMs > Date.now() ? expiryMs : Date.now() + SESSION_TTL_MS;
  m[gstin] = { token, exp };
  saveSessions(m);
}

export function clearSessionToken(gstin: string) {
  const m = loadSessions();
  delete m[gstin];
  saveSessions(m);
}

/** Every stored session (all GSTINs) — for a "log out everything" sweep. */
export function getAllSessions(): SessionMap {
  return loadSessions();
}

/** Nuke ALL locally-stored taxpayer sessions (every GSTIN) in one shot. */
export function clearAllSessions() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* quota/unavailable */ }
}

// ── Downloaded returns (per company + type + period) ────────────────────────

const MODULE = 'gst';
const section = (type: GstReturnType, period: string) => `${type}_${period}`;

export function getDownload(companyId: string, type: GstReturnType, period: string): GstDownloadRecord | null {
  const rec = getEntityData(companyId, MODULE, section(type, period));
  return (rec?.data as GstDownloadRecord) ?? null;
}

export function saveDownload(companyId: string, record: GstDownloadRecord): void {
  upsertEntityData(companyId, MODULE, section(record.type, record.period), record);
}

export function deleteDownload(companyId: string, type: GstReturnType, period: string): void {
  upsertEntityData(companyId, MODULE, section(type, period), null);
}
