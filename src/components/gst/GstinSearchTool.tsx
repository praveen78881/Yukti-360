import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Download, Copy, Loader2, CheckCircle2, XCircle, Trash2, Clock, Database, ChevronDown } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import {
  listSearches, getSearch, saveSearch, deleteSearch, type GstinSearchRecord,
} from '@/lib/gst/sandbox/gstinSearchStore';

const GSTIN_RE = /^[0-9]{2}[A-Z0-9]{13}$/;

function composeAddress(addr?: Record<string, string>): string {
  if (!addr) return '';
  return [addr.bno, addr.bnm, addr.flno, addr.st, addr.landMark, addr.loc, addr.dst, addr.stcd, addr.pncd]
    .map((p) => (p || '').trim()).filter(Boolean).join(', ');
}

function extractDetails(respData: any): Record<string, any> | null {
  const env = respData?.data ?? respData;
  const details = env?.data ?? env;
  return details && (details.gstin || details.lgnm || details.tradeNam) ? details : null;
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-0.5 text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// Inline details panel shown when a saved search is expanded.
function DetailsPanel({ rec, onCopy, onExport }: { rec: GstinSearchRecord; onCopy: () => void; onExport: () => void }) {
  const d: any = rec.details;
  const isActive = String(d?.sts || '').toLowerCase() === 'active';
  return (
    <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
          {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}{d?.sts || 'Unknown'}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCopy} title="Copy JSON" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Copy className="h-3.5 w-3.5" /> Copy</button>
          <button type="button" onClick={onExport} title="Download JSON" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5" /> Export</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        <Field label="Legal name" value={d?.lgnm} />
        <Field label="Trade name" value={d?.tradeNam} />
        <Field label="Taxpayer type" value={d?.dty} />
        <Field label="Constitution" value={d?.ctb} />
        <Field label="Registration date" value={d?.rgdt} />
        {d?.cxdt ? <Field label="Cancellation date" value={d.cxdt} /> : null}
        <Field label="e-Invoice enabled" value={d?.einvoiceStatus} />
        <Field label="State jurisdiction" value={d?.stj} />
        <Field label="Centre jurisdiction" value={d?.ctj} />
        <Field label="Last updated" value={d?.lstupdt} />
        {d?.nba?.length ? (
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Nature of business</p>
            <div className="mt-1 flex flex-wrap gap-1.5">{d.nba.map((n: string) => <span key={n} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{n}</span>)}</div>
          </div>
        ) : null}
        {composeAddress(d?.pradr?.addr) ? (
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Principal place of business</p>
            <p className="mt-0.5 text-sm text-gray-700">{composeAddress(d?.pradr?.addr)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function GstinSearchTool({ defaultGstin = '' }: { defaultGstin?: string }) {
  const { companyId } = useCompany();
  const [gstin, setGstin] = useState(defaultGstin.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GstinSearchRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null); // gstin of the open row
  const [ctx, setCtx] = useState<{ x: number; y: number; gstin: string } | null>(null);

  const refresh = useCallback(() => { if (companyId) setHistory(listSearches(companyId)); }, [companyId]);
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!ctx) return;
    const close = () => setCtx(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
  }, [ctx]);

  const valid = GSTIN_RE.test(gstin.trim());

  const search = async () => {
    const g = gstin.trim().toUpperCase();
    if (!GSTIN_RE.test(g)) { toast.error('Enter a valid 15-character GSTIN'); return; }

    // Already downloaded → just open it, no new call.
    const cached = companyId ? getSearch(companyId, g) : null;
    if (cached) { setExpanded(g); toast.message('Showing saved data', { description: 'Already downloaded — right-click to delete and re-fetch.' }); return; }

    setLoading(true);
    const r = await sandboxClient.gstinSearch(g, 'live'); // LIVE production — one call
    setLoading(false);
    if (!r.ok) { toast.error(r.error || 'Search failed'); return; }
    const d = extractDetails(r.data);
    if (!d) {
      const apiMsg = (r.data as any)?.data?.message || (r.data as any)?.message;
      toast.error(apiMsg ? `${apiMsg} — not found on the live GST portal` : 'No records found for this GSTIN');
      return;
    }
    const rec: GstinSearchRecord = {
      gstin: g, tradeName: d.tradeNam || '', legalName: d.lgnm || '', status: d.sts || '',
      details: d, searchedAt: new Date().toISOString(),
    };
    if (companyId) { saveSearch(companyId, rec); refresh(); }
    setExpanded(g); // open the fresh result inline
    toast.success(`Downloaded: ${rec.tradeName || rec.legalName || g}`);
  };

  const remove = (g: string) => {
    if (!companyId) return;
    deleteSearch(companyId, g);
    refresh();
    if (expanded === g) setExpanded(null);
    setCtx(null);
    toast.success('Removed — search it again to re-download');
  };

  const exportJson = (rec: GstinSearchRecord) => {
    const blob = new Blob([JSON.stringify(rec.details, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GSTIN_${rec.gstin}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const copy = async (rec: GstinSearchRecord) => {
    try { await navigator.clipboard.writeText(JSON.stringify(rec.details, null, 2)); toast.success('Copied'); }
    catch { toast.error('Copy failed'); }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Search GSTIN — live company data</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Live</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) search(); }}
            placeholder="29ABCDE1234F1Z5"
            maxLength={15}
            className="min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm tracking-wide focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button type="button" onClick={search} disabled={loading || !valid}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
          </button>
        </div>
        {gstin && !valid && <p className="mt-1.5 text-[11px] text-amber-600">GSTIN must be 15 characters: 2-digit state code + 10-char PAN + 3 more.</p>}
      </div>

      {/* Saved searches — click a row to open, click again to collapse */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
          <Database className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Saved searches ({history.length})</span>
          <span className="text-[11px] text-gray-400">· click to open · right-click to delete</span>
        </div>
        {history.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-gray-400">No saved searches yet. Search a GSTIN above — it's downloaded once and kept here.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((h) => {
              const open = expanded === h.gstin;
              return (
                <li key={h.gstin}>
                  <div
                    onClick={() => setExpanded(open ? null : h.gstin)}
                    onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, gstin: h.gstin }); }}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 hover:bg-blue-50/40 ${open ? 'bg-blue-50/60' : ''}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <ChevronDown className={`h-4 w-4 shrink-0 text-gray-300 transition-transform ${open ? 'rotate-180 text-blue-500' : ''}`} />
                      <span className={`h-2 w-2 shrink-0 rounded-full ${h.status.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">{h.tradeName || h.legalName || h.gstin}</p>
                        <p className="font-mono text-[11px] text-gray-400">{h.gstin}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(h.searchedAt).toLocaleDateString()}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); remove(h.gstin); }} title="Delete" className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {open && <DetailsPanel rec={h} onCopy={() => copy(h)} onExport={() => exportJson(h)} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Right-click context menu */}
      {ctx && (
        <div className="fixed z-50 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => remove(ctx.gstin)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete &amp; allow re-download
          </button>
        </div>
      )}
    </div>
  );
}
