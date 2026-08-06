// ── GST API open log ─────────────────────────────────────────────────────────
// An in-memory ring buffer of EVERY Sandbox call the browser makes: action, the
// (redacted) request params, HTTP status, and the RAW response body exactly as
// the API returned it. This exists so you can see precisely "what the API key
// reports" — the ground truth — instead of only the app's interpreted toast.
//
// Nothing here leaves the browser; long token strings are trimmed for readability
// (short error codes/messages are kept in full so nothing about a failure is hidden).

export interface GstApiLogEntry {
  id: number;
  ts: number;
  action: string;
  params: unknown;          // request params, with otp/secret/password/token redacted
  status: number;           // HTTP status of our proxy call
  ok: boolean;
  apiStatusCd?: string;     // Sandbox envelope status_cd ("1" ok / "0" error), when present
  apiErrorCd?: string;      // Sandbox error code (e.g. AUTH403), when present
  apiMessage?: string;      // Sandbox human message, when present
  error?: string;           // transport/HTTP error, when present
  response: unknown;        // RAW response body, long strings trimmed
}

const BUFFER: GstApiLogEntry[] = [];
const MAX = 200;
let seq = 0;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Trim long strings (JWT/session tokens) so the log reads cleanly; keep short text (errors) whole. */
function trim(v: any, depth = 0): any {
  if (typeof v === 'string') return v.length > 120 ? `${v.slice(0, 40)}…${v.slice(-10)} (len ${v.length})` : v;
  if (Array.isArray(v)) return depth > 5 ? '[…]' : v.map((x) => trim(x, depth + 1));
  if (v && typeof v === 'object') {
    if (depth > 5) return '{…}';
    const out: any = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = /secret|password|^otp$/i.test(k) ? '••••' : trim(val, depth + 1);
    }
    return out;
  }
  return v;
}

/** Pull the Sandbox envelope error/status out of a raw response, however it's nested. */
function readEnvelope(resp: any): { statusCd?: string; errorCd?: string; message?: string } {
  const d = resp?.data ?? resp;
  const err = d?.error ?? resp?.error;
  const statusCd = typeof d?.status_cd === 'string' ? d.status_cd : undefined;
  const errorCd = err?.error_cd || err?.errorCode || err?.code;
  const message = err?.message || (typeof err === 'string' ? err : undefined) || resp?.message;
  return { statusCd, errorCd: errorCd ? String(errorCd) : undefined, message: message ? String(message) : undefined };
}

export function pushGstApiLog(e: {
  action: string; params?: unknown; status: number; ok: boolean; response?: any; error?: string;
}): void {
  const env = readEnvelope(e.response);
  const entry: GstApiLogEntry = {
    id: ++seq,
    ts: Date.now(),
    action: e.action,
    params: trim(e.params),
    status: e.status,
    ok: e.ok,
    apiStatusCd: env.statusCd,
    apiErrorCd: env.errorCd,
    apiMessage: env.message,
    error: e.error,
    response: trim(e.response),
  };
  BUFFER.unshift(entry);
  if (BUFFER.length > MAX) BUFFER.length = MAX;
  // Mirror to the browser console so it's visible even without the panel open.
  const tag = env.statusCd ? ` status_cd=${env.statusCd}` : '';
  const ecd = env.errorCd ? ` ${env.errorCd}` : '';
  // eslint-disable-next-line no-console
  console.debug(`[GST-API] ${e.action} → HTTP ${e.status}${tag}${ecd}`, e.response);
  listeners.forEach((l) => l());
}

export function getGstApiLog(): GstApiLogEntry[] { return BUFFER; }
export function clearGstApiLog(): void { BUFFER.length = 0; listeners.forEach((l) => l()); }
export function subscribeGstApiLog(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
