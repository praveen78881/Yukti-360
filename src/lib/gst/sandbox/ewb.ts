// Persistence for the E-Way Bill feature:
//   • EWB portal session token — localStorage, per GSTIN (separate from the GSTR
//     taxpayer session; the EWB portal has its own credentials/session).
//   • Generated e-Way Bills — via offlineDb entity_data (module 'gst', section
//     'eway_bills'), so they live under the company and mirror to Supabase.

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

// ── EWB session tokens (per GSTIN) ──────────────────────────────────────────
const EWB_SESSION_KEY = 'ca_ewb_sessions_v1';

type EwbSessionMap = Record<string, { token: string; exp: number }>;

function loadSessions(): EwbSessionMap {
  try { return JSON.parse(localStorage.getItem(EWB_SESSION_KEY) || '{}'); } catch { return {}; }
}
function saveSessions(m: EwbSessionMap) {
  try { localStorage.setItem(EWB_SESSION_KEY, JSON.stringify(m)); } catch { /* quota */ }
}

/** A live EWB token for this GSTIN, or null if none/expired. */
export function getEwbToken(gstin: string): string | null {
  const s = loadSessions()[gstin];
  if (s && s.exp > Date.now() + 60_000) return s.token;
  return null;
}

export function setEwbToken(gstin: string, token: string, expiryMs?: number) {
  const m = loadSessions();
  // EWB tokens are typically valid ~6h; trust the API's expiry when provided.
  const exp = expiryMs && expiryMs > Date.now() ? expiryMs : Date.now() + 6 * 60 * 60 * 1000;
  m[gstin] = { token, exp };
  saveSessions(m);
}

export function clearEwbToken(gstin: string) {
  const m = loadSessions();
  delete m[gstin];
  saveSessions(m);
}

// ── Generated e-Way Bills (per company) ─────────────────────────────────────
const MODULE = 'gst';
const SECTION = 'eway_bills';

export interface EwbRecord {
  ewbNo: string;
  ewbDate: string;
  validUpto: string;
  docNo: string;
  docDate: string;
  fromGstin: string;
  toGstin: string;
  toTrdName: string;
  totInvValue: number;
  transDistance: string;
  vehicleNo: string;
  status: 'active' | 'cancelled';
  raw: unknown;
  generatedAt: string;
}

export function listEwbBills(companyId: string): EwbRecord[] {
  const rec = getEntityData(companyId, MODULE, SECTION);
  const arr = (rec?.data as EwbRecord[]) ?? [];
  return Array.isArray(arr) ? arr : [];
}

export function saveEwbBill(companyId: string, bill: EwbRecord): void {
  const all = listEwbBills(companyId).filter((b) => b.ewbNo !== bill.ewbNo);
  upsertEntityData(companyId, MODULE, SECTION, [bill, ...all]);
}

export function updateEwbBill(companyId: string, ewbNo: string, patch: Partial<EwbRecord>): void {
  const all = listEwbBills(companyId).map((b) => (b.ewbNo === ewbNo ? { ...b, ...patch } : b));
  upsertEntityData(companyId, MODULE, SECTION, all);
}
