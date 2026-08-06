import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { GstPeriodPicker } from './GstPeriodPicker';
import { OtpGate } from './OtpGate';
import { useTaxpayerSession } from './useTaxpayerSession';
import { sandboxClient, extractReferenceId, pollSaveOutcome, type SaveOutcome } from '@/lib/gst/sandbox/client';
import { buildGstr1SaveBody, countSaveSections, estimateReturnTurnover } from '@/lib/gst/sandbox/saveBodies';
import { toApiYearMonth, periodLabel, toPeriod } from '@/lib/gst/sandbox/period';
import { getFiling } from '@/lib/gstr1/gstr1Db';

function defaultPeriod(now = new Date()): string {
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const m = now.getMonth() === 0 ? 12 : now.getMonth();
  return toPeriod(y, m);
}

/** Section-wise totals from a GSTR-1 summary response (defensive). */
function parseSummary(raw: any): { section: string; records: number; value: number; tax: number }[] {
  const d = raw?.data?.data ?? raw?.data ?? raw ?? {};
  const secs = d.sec_sum ?? d.secsum ?? [];
  if (!Array.isArray(secs)) return [];
  return secs.map((s: any) => ({
    section: String(s.sec_nm ?? s.secnm ?? s.typ ?? '—').toUpperCase(),
    records: Number(s.ttl_rec ?? s.ttlrec ?? 0) || 0,
    value: Number(s.ttl_val ?? s.ttlval ?? 0) || 0,
    tax: (Number(s.ttl_igst ?? 0) + Number(s.ttl_cgst ?? 0) + Number(s.ttl_sgst ?? 0) + Number(s.ttl_cess ?? 0)) || 0,
  }));
}

export function Gstr1PortalPanel() {
  const { company, companyId, updateCompany } = useCompany();
  const gstin = (company?.gst_details?.gstin || '').trim();
  const username = (company?.gst_details?.portalUsername || '').trim();

  const [period, setPeriod] = useState<string>(defaultPeriod());
  const [usernameDraft, setUsernameDraft] = useState('');
  const [busy, setBusy] = useState('');
  const [summary, setSummary] = useState<{ section: string; records: number; value: number; tax: number }[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gt, setGt] = useState<number>(0);
  const [curGt, setCurGt] = useState<number>(0);
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);

  const session = useTaxpayerSession(gstin, username);
  const { year, month } = toApiYearMonth(period);

  const filing = useMemo(() => (companyId ? getFiling(companyId, period) : null), [companyId, period]);
  const saveBody = useMemo(
    () => (filing ? buildGstr1SaveBody(filing, { gt, cur_gt: curGt }) : null),
    [filing, gt, curGt],
  );
  const sections = useMemo(() => (saveBody ? countSaveSections(saveBody) : []), [saveBody]);

  const saveUsername = async () => {
    const u = usernameDraft.trim();
    if (!u) { toast.error('Enter the GST portal username'); return; }
    await updateCompany?.({ gst_details: { ...company!.gst_details, portalUsername: u } });
    toast.success('GST portal username saved');
  };

  // ── Download filed GSTR-1 (summary) ──
  const download = () =>
    session.run(async (token) => {
      setBusy('Downloading GSTR-1 summary…'); setSummary(null); setOutcome(null);
      const r = await sandboxClient.gstr1Summary(year, month, token);
      setBusy('');
      if (!r.ok) { toast.error(r.error || 'Download failed'); return; }
      const parsed = parseSummary(r.data);
      setSummary(parsed);
      toast.success(parsed.length ? `GSTR-1 summary loaded (${parsed.length} sections)` : 'No data for this period');
    });

  // ── Upload all sections (SAVE draft) ──
  const openConfirm = () => {
    if (!filing) { toast.error('Prepare GSTR-1 for this month first (below), then upload.'); return; }
    const est = estimateReturnTurnover(filing);
    setGt(est); setCurGt(est);
    setOutcome(null);
    setConfirmOpen(true);
  };

  const doSave = () =>
    session.run(async (token) => {
      setConfirmOpen(false);
      setBusy('Uploading all sections (SAVE draft)…'); setOutcome(null);
      const body = buildGstr1SaveBody(filing!, { gt, cur_gt: curGt });
      const r = await sandboxClient.gstr1Save(year, month, body, token);
      if (!r.ok) { setBusy(''); toast.error(r.error || 'Save failed'); return; }
      const refId = extractReferenceId(r.data);
      if (!refId) { setBusy(''); toast.error('No reference id returned by the portal'); setOutcome({ ok: false, message: 'No reference id', raw: r.data }); return; }
      setBusy('Portal is processing the draft…');
      const out = await pollSaveOutcome(year, month, refId, token);
      setBusy('');
      setOutcome(out);
      if (out.ok) toast.success('GSTR-1 draft saved on the portal (all sections)');
      else if (out.status_cd === 'PE') toast.error('Saved with errors — see report below');
      else toast.error(out.message || 'Save did not complete');
    });

  if (!gstin) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No GSTIN configured — add it under Settings → GST details.</div>;
  }

  if (!username) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900">Connect the GST portal</h3>
        <p className="mt-1 text-xs text-gray-500">One-time: enter this client's <b>GST portal username</b> (GSTIN <span className="font-mono">{gstin}</span>).</p>
        <div className="mt-2 flex gap-2">
          <input value={usernameDraft} onChange={(e) => setUsernameDraft(e.target.value)} placeholder="GST portal username" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <button type="button" onClick={saveUsername} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GstPeriodPicker value={period} onChange={(p) => { setPeriod(p); setSummary(null); setOutcome(null); session.cancel(); }} />

      {session.phase === 'otp' ? (
        <OtpGate otp={session.otp} setOtp={session.setOtp} onVerify={session.verify} onCancel={session.cancel} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={download} disabled={session.phase === 'busy' || !!busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Download filed GSTR-1 ({periodLabel(period)})
          </button>
          <button type="button" onClick={openConfirm} disabled={session.phase === 'busy' || !!busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            Upload all sections (Save draft)
          </button>
          {filing ? (
            <span className="text-xs text-gray-400">{sections.reduce((a, s) => a + s.count, 0)} records across {sections.length} sections ready</span>
          ) : (
            <span className="text-xs text-amber-600">No prepared GSTR-1 for {periodLabel(period)} — build it on the tabs below, then upload.</span>
          )}
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-blue-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /> {busy}
        </div>
      )}

      {/* Save outcome */}
      {outcome && (
        <div className={`rounded-xl border p-4 text-sm ${outcome.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          <p className="font-semibold">{outcome.ok ? '✓ Draft saved on the portal' : `Save ${outcome.status_cd === 'PE' ? 'completed with errors' : 'failed'}`}</p>
          {outcome.reference_id && <p className="mt-1 text-xs opacity-80">Reference: <span className="font-mono">{outcome.reference_id}</span></p>}
          {outcome.errorReport ? (
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-white/60 p-2 text-[11px]">{JSON.stringify(outcome.errorReport, null, 2)}</pre>
          ) : null}
        </div>
      )}

      {/* Downloaded summary */}
      {summary && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-2 text-xs font-semibold text-gray-600">Filed GSTR-1 — {periodLabel(period)} (section summary)</div>
          {summary.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No data on the portal for this period.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                <tr><th className="px-4 py-2 text-left">Section</th><th className="px-4 py-2 text-right">Records</th><th className="px-4 py-2 text-right">Value</th><th className="px-4 py-2 text-right">Tax</th></tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.section} className="border-b border-gray-50">
                    <td className="px-4 py-1.5 font-semibold text-gray-700">{s.section}</td>
                    <td className="px-4 py-1.5 text-right font-mono">{s.records}</td>
                    <td className="px-4 py-1.5 text-right font-mono">{formatIndianCurrency(s.value)}</td>
                    <td className="px-4 py-1.5 text-right font-mono">{formatIndianCurrency(s.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Confirm-upload dialog */}
      {confirmOpen && saveBody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setConfirmOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-900">Upload GSTR-1 for {periodLabel(period)}</h3>
            <p className="mt-1 text-xs text-gray-500">This saves a <b>draft</b> on the portal (reversible via Reset) — it does <b>not</b> file the return.</p>

            <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-gray-100 bg-gray-50/60 p-3">
              {sections.length === 0 ? <p className="text-xs text-gray-400">No populated sections.</p> : (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                  {sections.map((s) => <li key={s.section} className="flex justify-between"><span>{s.section}</span><span className="font-mono text-gray-500">{s.count}</span></li>)}
                </ul>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-gray-600">Gross turnover (gt)
                <input type="number" value={gt} onChange={(e) => setGt(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-mono" />
              </label>
              <label className="text-xs font-semibold text-gray-600">Current turnover (cur_gt)
                <input type="number" value={curGt} onChange={(e) => setCurGt(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-mono" />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={doSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save draft to portal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
