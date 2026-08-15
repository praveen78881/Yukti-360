'use client';

import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Download, RefreshCw, Loader2, Trash2, Lock } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { parseReturn, isNoData } from '@/lib/gst/sandbox/parsers';
import { getDownload, saveDownload, deleteDownload, getSessionToken, setSessionToken, clearSessionToken } from '@/lib/gst/sandbox/store';
import { availability, toPeriod, periodLabel, toApiYearMonth } from '@/lib/gst/sandbox/period';
import { buildPartyNameIndex, harvestNamesFromRows, resolvePartyName } from '@/lib/gst/partyNames';

const money = (n?: number) => (n && n !== 0 ? formatIndianCurrency(n) : '—');

/** Portal (filed) ITC for one month, from GSTR-2B. Reuses the 2A/2B download
 *  infrastructure. Read-only view; right-click to delete the stored copy. */
export function ItcPortalPanel({ gstin, username, companyId, year, month }: {
  gstin: string; username: string; companyId: string; year: number; month: number;
}) {
  const period = toPeriod(year, month + 1); // month is 0-based → 1-based
  const gate = availability('GSTR2B', period);
  const [phase, setPhase] = useState<'idle' | 'otp' | 'busy'>('idle');
  const [otp, setOtp] = useState('');
  const [version, setVersion] = useState(0);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const stored = useMemo(() => {
    const rec = getDownload(companyId, 'GSTR2B', period);
    if (!rec) return rec;
    // Fill any row saved before supplier names were harvested.
    const idx = buildPartyNameIndex(companyId);
    if (!idx.size) return rec;
    return { ...rec, rows: rec.rows.map((r) => (r.supplierName ? r : { ...r, supplierName: resolvePartyName(idx, r.supplierGstin) })) };
  }, [companyId, period, version]);

  useEffect(() => {
    if (!ctx) return;
    const c = () => setCtx(null);
    window.addEventListener('click', c);
    return () => window.removeEventListener('click', c);
  }, [ctx]);

  const doFetch = async (token: string) => {
    setPhase('busy');
    const { year: y, month: m } = toApiYearMonth(period);
    const r = await sandboxClient.fetchReturn('GSTR2B', y, m, token);
    if (!r.ok) {
      if (r.status === 401 || /session|expired|AUTH4033/i.test(r.error || '')) {
        clearSessionToken(gstin); toast.error('Session expired — please reconnect'); setPhase('idle'); return;
      }
      toast.error(r.error || 'Download failed'); setPhase('idle'); return;
    }
    const noData = isNoData(r.data);
    const { rows, itcSummary } = parseReturn('GSTR2B', r.data);
    harvestNamesFromRows(companyId, rows);   // 2B names feed 2A and GSTR-1 too
    saveDownload(companyId, { type: 'GSTR2B', period, gstin, rows, itcSummary, noData, raw: r.data, fetchedAt: new Date().toISOString() });
    setPhase('idle'); setOtp(''); setVersion((v) => v + 1);
    toast.success(noData ? `No ITC filed for ${periodLabel(period)}` : `ITC imported — ${rows.length} rows`);
  };

  const startImport = async () => {
    if (!gstin) { toast.error('Company GSTIN missing'); return; }
    const token = getSessionToken(gstin);
    if (token) { doFetch(token); return; }
    if (!username) { toast.error('Add the GST portal username in Settings'); return; }
    setPhase('busy');
    const r = await sandboxClient.otpGenerate(gstin, username);
    if (!r.ok) { toast.error(r.error || 'Could not send OTP'); setPhase('idle'); return; }
    setPhase('otp');
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return;
    setPhase('busy');
    const r = await sandboxClient.otpVerify(gstin, username, otp.trim());
    const token = r.data?.sessionToken;
    if (!r.ok || !token) { toast.error(r.error || 'OTP verification failed'); setPhase('otp'); return; }
    setSessionToken(gstin, token); doFetch(token);
  };

  const remove = () => { deleteDownload(companyId, 'GSTR2B', period); setVersion((v) => v + 1); setCtx(null); toast.success('Deleted'); };

  const busy = phase === 'busy';
  const s = stored?.itcSummary;

  if (!gate.available) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
        <Lock className="mx-auto mb-2 h-5 w-5 text-gray-300" />
        {gate.reason || 'This period is not filed yet.'}
      </div>
    );
  }

  if (phase === 'otp') {
    return (
      <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white p-4 text-center">
        <div className="flex gap-2">
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP" maxLength={8} inputMode="numeric"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center font-mono text-lg tracking-widest focus:border-blue-400 focus:outline-none" />
          <button type="button" onClick={verifyOtp} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Verify</button>
        </div>
      </div>
    );
  }

  if (!stored) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <button type="button" onClick={startImport} disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Import filed ITC — {periodLabel(period)}
        </button>
      </div>
    );
  }

  return (
    <div onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}>
      {/* Summary strip + re-download */}
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-gray-200 bg-white px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{periodLabel(stored.period)}</span>
        <span className="inline-flex items-baseline gap-1.5"><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">CGST</span><span className="font-mono text-sm text-gray-700">{money(s?.cgst)}</span></span>
        <span className="inline-flex items-baseline gap-1.5"><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">SGST</span><span className="font-mono text-sm text-gray-700">{money(s?.sgst)}</span></span>
        <span className="inline-flex items-baseline gap-1.5"><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">IGST</span><span className="font-mono text-sm text-gray-700">{money(s?.igst)}</span></span>
        <span className="inline-flex items-baseline gap-1.5"><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total ITC</span><span className="font-mono text-sm font-bold text-gray-900">{money(s?.total)}</span></span>
        <button type="button" onClick={startImport} disabled={busy} title="Re-download" className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </button>
      </div>

      {stored.noData || stored.rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">No ITC filed for {periodLabel(stored.period)}.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                  <th className="px-2 py-1.5 text-left font-semibold">Section</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Supplier GSTIN</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Supplier</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Doc No.</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Date</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Taxable</th>
                  <th className="px-2 py-1.5 text-right font-semibold">IGST</th>
                  <th className="px-2 py-1.5 text-right font-semibold">CGST</th>
                  <th className="px-2 py-1.5 text-right font-semibold">SGST</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Cess</th>
                  <th className="px-2 py-1.5 text-center font-semibold">ITC</th>
                </tr>
              </thead>
              <tbody>
                {stored.rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="px-2 py-1"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{r.section}</span></td>
                    <td className="px-2 py-1 font-mono text-[11px]">{r.supplierGstin}</td>
                    <td className="px-2 py-1 max-w-[180px] truncate" title={r.supplierName}>{r.supplierName}</td>
                    <td className="px-2 py-1">{r.docNo}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-gray-500">{r.docDate}</td>
                    <td className="px-2 py-1 text-right font-mono">{money(r.taxableValue)}</td>
                    <td className="px-2 py-1 text-right font-mono">{money(r.igst)}</td>
                    <td className="px-2 py-1 text-right font-mono">{money(r.cgst)}</td>
                    <td className="px-2 py-1 text-right font-mono">{money(r.sgst)}</td>
                    <td className="px-2 py-1 text-right font-mono">{money(r.cess)}</td>
                    <td className="px-2 py-1 text-center">{r.itcAvailable === 'Y' ? <span className="text-emerald-600">✓</span> : r.itcAvailable === 'N' ? <span className="text-red-500" title={r.itcReason}>✕</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ctx && (
        <div className="fixed z-50 min-w-[150px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={remove} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete {periodLabel(period)}</button>
        </div>
      )}
    </div>
  );
}
