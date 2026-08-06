// Durable audit trail for GSTR-1 Save/File/Reset attempts. Persisted to offlineDb
// so there's a permanent record (timestamp, GSTIN, period, payload hash, response)
// independent of the ephemeral on-screen log.
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

export interface FileAuditEntry {
  ts: string;            // ISO timestamp
  gstin: string;
  period: string;        // MMYYYY
  step: 'save' | 'proceed' | 'summary' | 'evc-request' | 'file' | 'reset';
  payloadHash: string;   // SHA-256 of the exact payload sent
  status: number;
  ok: boolean;
  response?: string;     // trimmed response body/error
}

const KEY = 'gstr1_file_audit';

async function sha256(s: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return `len:${s.length}`; }
}

export async function recordAudit(
  companyId: string,
  e: { gstin: string; period: string; step: FileAuditEntry['step']; payload: string; status: number; ok: boolean; response?: unknown },
): Promise<void> {
  if (!companyId) return;
  const payloadHash = await sha256(e.payload);
  const entry: FileAuditEntry = {
    ts: new Date().toISOString(),
    gstin: e.gstin, period: e.period, step: e.step, payloadHash, status: e.status, ok: e.ok,
    response: e.response != null ? String(typeof e.response === 'string' ? e.response : JSON.stringify(e.response)).slice(0, 500) : undefined,
  };
  const cur = (getEntityData(companyId, 'gst', KEY)?.data as FileAuditEntry[]) ?? [];
  cur.push(entry);
  upsertEntityData(companyId, 'gst', KEY, cur.slice(-100)); // keep the last 100 attempts
}

export function getAudit(companyId: string): FileAuditEntry[] {
  return (getEntityData(companyId, 'gst', KEY)?.data as FileAuditEntry[]) ?? [];
}
