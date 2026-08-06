// Persistence for the e-Invoice (IRP) feature:
//   • IRP session token — localStorage, per GSTIN (its own portal session).
//   • Generated IRNs — offlineDb entity_data (module 'gst', section 'einvoices').

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

// ── IRP session tokens (per GSTIN) ──────────────────────────────────────────
const EINV_SESSION_KEY = 'ca_einv_sessions_v1';

type SessionMap = Record<string, { token: string; exp: number }>;

function loadSessions(): SessionMap {
  try { return JSON.parse(localStorage.getItem(EINV_SESSION_KEY) || '{}'); } catch { return {}; }
}
function saveSessions(m: SessionMap) {
  try { localStorage.setItem(EINV_SESSION_KEY, JSON.stringify(m)); } catch { /* quota */ }
}

export function getEinvToken(gstin: string): string | null {
  const s = loadSessions()[gstin];
  if (s && s.exp > Date.now() + 60_000) return s.token;
  return null;
}
export function setEinvToken(gstin: string, token: string, expiryMs?: number) {
  const m = loadSessions();
  const exp = expiryMs && expiryMs > Date.now() ? expiryMs : Date.now() + 6 * 60 * 60 * 1000;
  m[gstin] = { token, exp };
  saveSessions(m);
}
export function clearEinvToken(gstin: string) {
  const m = loadSessions();
  delete m[gstin];
  saveSessions(m);
}

// ── Generated e-Invoices (per company) ──────────────────────────────────────
const MODULE = 'gst';
const SECTION = 'einvoices';

export interface EInvRecord {
  irn: string;
  ackNo: string;
  ackDt: string;
  docNo: string;
  docDate: string;
  buyerGstin: string;
  buyerName: string;
  totInvVal: number;
  signedQr?: string;
  status: 'active' | 'cancelled';
  raw: unknown;
  generatedAt: string;
}

export function listEInvoices(companyId: string): EInvRecord[] {
  const rec = getEntityData(companyId, MODULE, SECTION);
  const arr = (rec?.data as EInvRecord[]) ?? [];
  return Array.isArray(arr) ? arr : [];
}
export function saveEInvoice(companyId: string, inv: EInvRecord): void {
  const all = listEInvoices(companyId).filter((x) => x.irn !== inv.irn);
  upsertEntityData(companyId, MODULE, SECTION, [inv, ...all]);
}
export function updateEInvoice(companyId: string, irn: string, patch: Partial<EInvRecord>): void {
  const all = listEInvoices(companyId).map((x) => (x.irn === irn ? { ...x, ...patch } : x));
  upsertEntityData(companyId, MODULE, SECTION, all);
}
