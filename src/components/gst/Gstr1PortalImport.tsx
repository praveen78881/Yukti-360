'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, Loader2, KeyRound, Settings, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { getSessionToken, setSessionToken, clearSessionToken } from '@/lib/gst/sandbox/store';
import { recentFinancialYears } from '@/lib/gst/sandbox/period';
import { importGstr1FY, getFyImport, saveFyImport, type FyImport } from '@/lib/gst/sandbox/gstr1Portal';
import { Gstr1MonthPreview } from '@/components/gst/Gstr1MonthPreview';

export function Gstr1PortalImport() {
  const { company, companyId } = useCompany();
  const gstin = (company?.gst_details?.gstin || '').trim();
  const username = (company?.gst_details?.portalUsername || '').trim();
  const settingsPath = companyId ? `/company/${companyId}/settings` : '#';

  const fys = recentFinancialYears(6);
  const [fyStartYear, setFyStartYear] = useState(fys[1]?.startYear ?? fys[0]?.startYear);
  const fyLabel = `${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, '0')}`;

  const [hasSession, setHasSession] = useState<boolean>(() => !!(gstin && getSessionToken(gstin)));
  const [phase, setPhase] = useState<'idle' | 'otp' | 'importing'>('idle');
  const [otp, setOtp] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 12, label: '' });
  const [imp, setImp] = useState<FyImport | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Load any previously-imported snapshot for the selected FY.
  useEffect(() => {
    setImp(companyId ? getFyImport(companyId, fyLabel) : null);
    setExpanded(null);
  }, [companyId, fyLabel]);

  const sendOtp = async () => {
    if (!gstin || !username) { toast.error('Set GSTIN and GST portal username in Settings'); return; }
    setPhase('idle');
    const r = await sandboxClient.otpGenerate(gstin, username);
    if (!r.ok) { toast.error(r.error || 'Could not send OTP'); return; }
    toast.success("OTP sent to the taxpayer's registered mobile/email");
    setPhase('otp');
  };

  const verifyOtp = async () => {
    if (!otp.trim()) { toast.error('Enter the OTP'); return; }
    const r = await sandboxClient.otpVerify(gstin, username, otp.trim());
    const token = r.data?.sessionToken;
    if (!r.ok || !token) { toast.error(r.error || 'OTP verification failed'); return; }
    setSessionToken(gstin, token);
    setHasSession(true);
    setOtp('');
    setPhase('idle');
    toast.success('GST portal connected');
    runImport(token);
  };

  const runImport = async (tokenArg?: string) => {
    const token = tokenArg || getSessionToken(gstin);
    if (!token) { setHasSession(false); toast.error('Session expired — reconnect'); return; }
    setPhase('importing');
    setProgress({ done: 0, total: 12, label: '' });
    try {
      const result = await importGstr1FY(gstin, fyStartYear, token, (done, total, label) => setProgress({ done, total, label }));
      const anyAuthErr = result.periods.some((p) => /401|AUTH|session|expired/i.test(p.error || ''));
      if (anyAuthErr && result.periods.every((p) => !p.hasData)) {
        clearSessionToken(gstin); setHasSession(false); setPhase('idle');
        toast.error('Session expired — please reconnect'); return;
      }
      if (companyId) saveFyImport(companyId, result);
      setImp(result);
      const filed = result.periods.filter((p) => p.hasData).length;
      toast.success(`Imported FY ${fyLabel} — ${filed} period(s) with data`);
    } catch (e: any) {
      toast.error(e?.message || 'Import failed');
    } finally {
      setPhase('idle');
    }
  };

  const fyTotals = useMemo(() => {
    if (!imp) return null;
    return imp.periods.reduce((a, p) => ({
      rec: a.rec + p.totals.rec, val: a.val + p.totals.val, tax: a.tax + p.totals.tax,
    }), { rec: 0, val: 0, tax: 0 });
  }, [imp]);

  // ── Gates ──
  if (!gstin || !username) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Settings className="h-5 w-5" /></div>
        <h3 className="text-sm font-bold text-gray-900">Set up GST portal access</h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">Add your <b>GSTIN</b> and <b>GST portal username</b> in Settings. Importing filed GSTR-1 sends an OTP to the taxpayer's registered mobile/email.</p>
        <Link to={settingsPath} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Settings className="h-4 w-4" /> Open Settings</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Financial year</span>
          <select value={fyStartYear} onChange={(e) => setFyStartYear(Number(e.target.value))} disabled={phase === 'importing'}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
            {fys.map((f) => <option key={f.label} value={f.startYear}>FY {f.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {imp && <span className="text-[11px] text-gray-400">Last imported {new Date(imp.importedAt).toLocaleString()}</span>}
          {hasSession ? (
            <button type="button" onClick={() => runImport()} disabled={phase === 'importing'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {phase === 'importing' ? <Loader2 className="h-4 w-4 animate-spin" /> : (imp ? <RefreshCw className="h-4 w-4" /> : <Download className="h-4 w-4" />)}
              {imp ? 'Re-download FY' : 'Import filed GSTR-1 (FY)'}
            </button>
          ) : (
            <button type="button" onClick={sendOtp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
              <KeyRound className="h-4 w-4" /> Connect &amp; import
            </button>
          )}
        </div>
      </div>

      {/* OTP step */}
      {phase === 'otp' && (
        <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-sm font-semibold text-gray-900">Enter the OTP</p>
          <p className="mt-1 text-xs text-gray-500">Sent to the taxpayer's registered mobile/email.</p>
          <div className="mt-3 flex gap-2">
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={8} inputMode="numeric"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center font-mono text-lg tracking-widest focus:border-blue-400 focus:outline-none" />
            <button type="button" onClick={verifyOtp} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Verify</button>
          </div>
        </div>
      )}

      {/* Import progress */}
      {phase === 'importing' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" /> Importing {progress.label || '…'}</span>
            <span>{progress.done}/{progress.total}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Results */}
      {imp && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-4 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Filed GSTR-1 · FY {imp.fyLabel} · <span className="font-mono">{imp.gstin}</span></p>
            {fyTotals && <p className="text-[11px] text-gray-500">Year: <b>{fyTotals.rec}</b> records · {formatIndianCurrency(fyTotals.val)} value · {formatIndianCurrency(fyTotals.tax)} tax</p>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2 text-left font-semibold">Period</th>
                  <th className="px-3 py-2 text-center font-semibold">Status</th>
                  <th className="px-3 py-2 text-right font-semibold">Records</th>
                  <th className="px-3 py-2 text-right font-semibold">Taxable Value</th>
                  <th className="px-3 py-2 text-right font-semibold">Total Tax</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {imp.periods.map((p) => (
                  <Fragment key={p.period}>
                    <tr className={`border-b border-gray-100 ${p.hasData ? 'hover:bg-blue-50/30 cursor-pointer' : ''}`} onClick={() => p.hasData && setExpanded(expanded === p.period ? null : p.period)}>
                      <td className="px-3 py-2 font-medium text-gray-800">{p.label}</td>
                      <td className="px-3 py-2 text-center">
                        {p.error ? <span className="text-[11px] text-amber-600">error</span>
                          : p.hasData ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Filed</span>
                            : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">No data</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{p.totals.rec || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{p.totals.val ? formatIndianCurrency(p.totals.val) : '—'}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{p.totals.tax ? formatIndianCurrency(p.totals.tax) : '—'}</td>
                      <td className="px-3 py-2 text-right">{p.hasData && <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform ${expanded === p.period ? 'rotate-90' : ''}`} />}</td>
                    </tr>
                    {expanded === p.period && (
                      <tr className="bg-gray-50/40">
                        <td colSpan={6} className="px-3 py-3">
                          <Gstr1MonthPreview
                            gstin={imp.gstin}
                            year={p.year}
                            month={p.month}
                            secNames={p.secSum.filter((s) => (s.ttl_rec || 0) > 0 || (s.ttl_val || 0) > 0).map((s) => s.sec_nm)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
