// ── GstApiLog — visible "open log" of raw Sandbox API calls ───────────────────
// A floating launcher (bottom-right) that opens a panel showing every GST API
// call this session with its RAW response — HTTP status, Sandbox status_cd, error
// code + message, and the full JSON body. This is the ground truth of "what the
// API key reports", so a canned toast can never be mistaken for the real answer.
// The launcher only appears once at least one GST call has been made.

import { useEffect, useReducer, useState } from 'react';
import {
  getGstApiLog, clearGstApiLog, subscribeGstApiLog, type GstApiLogEntry,
} from '@/lib/gst/sandbox/apiLog';

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function StatusBadge({ e }: { e: GstApiLogEntry }) {
  // Green when the API said status_cd "1" (ok) and HTTP ok; red on any API/HTTP error.
  const bad = !e.ok || e.apiStatusCd === '0' || !!e.error || !!e.apiErrorCd;
  const cls = bad ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
  const label = e.apiErrorCd ? e.apiErrorCd
    : e.apiStatusCd ? `cd ${e.apiStatusCd}`
    : `HTTP ${e.status}`;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cls}`}>{label}</span>;
}

function Entry({ e }: { e: GstApiLogEntry }) {
  const [open, setOpen] = useState(false);
  const bad = !e.ok || e.apiStatusCd === '0' || !!e.error || !!e.apiErrorCd;
  return (
    <div className={`rounded-lg border ${bad ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-white'} p-2`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
        <span className="text-[10px] font-mono text-gray-400">{fmtTime(e.ts)}</span>
        <span className="font-mono text-xs font-semibold text-gray-800">{e.action}</span>
        <StatusBadge e={e} />
        <span className="ml-auto text-[10px] text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {(e.apiMessage || e.error) && (
        <p className="mt-1 text-[11px] text-red-700">{e.apiErrorCd ? `${e.apiErrorCd} — ` : ''}{e.apiMessage || e.error}</p>
      )}
      {open && (
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-900 p-2 text-[10px] leading-relaxed text-gray-100">
{JSON.stringify({ params: e.params, response: e.response }, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function GstApiLog() {
  const [, force] = useReducer((x) => x + 1, 0);
  const [open, setOpen] = useState(false);
  useEffect(() => subscribeGstApiLog(force), []);

  const entries = getGstApiLog();
  if (entries.length === 0) return null; // stay invisible until a GST call happens

  const errors = entries.filter((e) => !e.ok || e.apiStatusCd === '0' || e.error || e.apiErrorCd).length;

  const copyAll = () => {
    try { navigator.clipboard.writeText(JSON.stringify(entries, null, 2)); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80] print:hidden">
      {open ? (
        <div className="flex max-h-[70vh] w-[min(92vw,460px)] flex-col rounded-xl border border-gray-300 bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <span className="text-xs font-bold text-gray-900">GST API Log</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{entries.length} calls · {errors} error{errors === 1 ? '' : 's'}</span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={copyAll} className="rounded px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100" title="Copy the whole log as JSON">Copy</button>
              <button type="button" onClick={clearGstApiLog} className="rounded px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100">Clear</button>
              <button type="button" onClick={() => setOpen(false)} className="rounded px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100">✕</button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 overflow-auto p-2">
            {entries.map((e) => <Entry key={e.id} e={e} />)}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white shadow-lg transition-colors ${errors ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-900'}`}
          title="Open the raw GST API log — see exactly what the API returned"
        >
          <span aria-hidden>🐞</span> API Log
          <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px]">{entries.length}</span>
          {errors > 0 && <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-red-700">{errors}</span>}
        </button>
      )}
    </div>
  );
}
