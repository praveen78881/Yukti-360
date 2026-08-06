'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarCheck, Download, Loader2, KeyRound } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { getSessionToken } from '@/lib/gst/sandbox/store';
import { recentFinancialYears } from '@/lib/gst/sandbox/period';
import { ModuleLocked } from '@/components/gst/ModuleLocked';

export default function Gstr9Page() {
  return <ModuleLocked title="GST Annuals — GSTR-9" description="Load and review the annual return figures from the GST portal" />;
}

// Unlocks 31 Oct 2026 — restore by swapping the default export back to this component.
function Gstr9PageUnlocked() {
  const { company, companyId, loading: companyLoading } = useCompany();
  const gstin = (company?.gst_details?.gstin || '').trim();
  const fys = recentFinancialYears(6).slice(1); // completed years (GSTR-9 is filed after year end)
  const [fy, setFy] = useState(fys[0]?.label || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const settingsPath = companyId ? `/company/${companyId}/settings` : '#';
  const gstr2bPath = companyId ? `/company/${companyId}/gst/gstr2b` : '#';

  if (companyLoading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const load = async () => {
    if (!gstin) { toast.error('Add your GSTIN in Settings first'); return; }
    const token = getSessionToken(gstin);
    if (!token) { toast.error('Connect the GST portal first — download a GSTR-2A/2B once to start a session.'); return; }
    setLoading(true);
    setData(null);
    const r = await sandboxClient.gstr9Get(fy, token);
    setLoading(false);
    if (!r.ok) { toast.error(r.error || 'Could not load GSTR-9'); return; }
    const d = (r.data?.data?.data ?? r.data?.data ?? r.data) as Record<string, unknown>;
    if (!d || typeof d !== 'object') { toast.error('No GSTR-9 data returned for this year'); return; }
    setData(d);
    toast.success(`GSTR-9 loaded for FY ${fy}`);
  };

  const download = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GSTR9_${gstin}_${fy}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const hasSession = !!(gstin && getSessionToken(gstin));
  const numericFields = data ? Object.entries(data).filter(([, v]) => typeof v === 'number') as [string, number][] : [];

  return (
    <div className="space-y-5">
      <PageHeader title="GST Annuals — GSTR-9" description="Load and review the annual return figures from the GST portal">
        <div className="flex items-center gap-2">
          <select value={fy} onChange={(e) => setFy(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
            {fys.map((f) => <option key={f.label} value={f.label}>FY {f.label}</option>)}
          </select>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />} Load GSTR-9
          </button>
        </div>
      </PageHeader>

      {!gstin ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Add your GSTIN in <Link to={settingsPath} className="font-semibold underline">Settings</Link> to load annual returns.
        </div>
      ) : !hasSession && !data ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600"><KeyRound className="h-5 w-5" /></div>
          <h3 className="text-sm font-bold text-gray-900">Connect the GST portal</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">GSTR-9 is read from the taxpayer portal, which needs a one-time OTP session. Start one by downloading a <Link to={gstr2bPath} className="font-semibold text-blue-600 hover:underline">GSTR-2A/2B</Link> for this GSTIN, then come back and load GSTR-9.</p>
        </div>
      ) : null}

      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">GSTR-9</span> · FY {fy} · <span className="font-mono">{gstin}</span>
            </div>
            <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5" /> Download JSON</button>
          </div>

          {numericFields.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {numericFields.slice(0, 8).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{k}</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-gray-900">{formatIndianCurrency(v)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Full GSTR-9 data</div>
            <pre className="max-h-[520px] overflow-auto p-4 text-[11px] leading-relaxed text-gray-700">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
