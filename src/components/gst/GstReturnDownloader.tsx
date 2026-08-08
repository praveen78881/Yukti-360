import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { GstPeriodPicker } from './GstPeriodPicker';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { parseReturn, isNoData, gstnBusinessError, isNoDataError } from '@/lib/gst/sandbox/parsers';
import {
  getDownload, saveDownload, getSessionToken, setSessionToken, clearSessionToken,
} from '@/lib/gst/sandbox/store';
import { availability, toApiYearMonth, periodLabel, toPeriod, parsePeriod, fyOf, quarterMonths } from '@/lib/gst/sandbox/period';
import type { GstDownloadRecord, GstInvoiceRow, GstReturnType } from '@/lib/gst/sandbox/types';

function defaultPeriod(now = new Date()): string {
  // Previous month — the latest period whose 2A/2B is generally available.
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const m = now.getMonth() === 0 ? 12 : now.getMonth(); // getMonth() is 0-based → previous month
  return toPeriod(y, m);
}

const money = (n: number) => formatIndianCurrency(n);

/** Small "download the whole FY" affordance — sits under the single-month action
 *  on every report so a year can be pulled in one go. Months before registration
 *  or not yet generated are skipped, never fetched-and-failed. */
function YearButton({ onClick, period, label }: { onClick: () => void; period: string; label: string }) {
  const { year, month } = parsePeriod(period);
  const fyStart = fyOf(year, month).startYear;
  const fyLabel = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, '0')}`;
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Download every available month of FY ${fyLabel}`}
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75" />
      </svg>
      Download full year — FY {fyLabel}
    </button>
  );
}

export function GstReturnDownloader({ type }: { type: GstReturnType }) {
  const { company, companyId, updateCompany } = useCompany();
  const gstin = (company?.gst_details?.gstin || '').trim();
  const username = (company?.gst_details?.portalUsername || '').trim();
  const label = type === 'GSTR2B' ? 'GSTR-2B' : 'GSTR-2A';

  const [period, setPeriod] = useState<string>(defaultPeriod());
  const [phase, setPhase] = useState<'idle' | 'otp' | 'busy'>('idle');
  const [busyMsg, setBusyMsg] = useState('');
  const [otp, setOtp] = useState('');
  const [usernameDraft, setUsernameDraft] = useState('');
  const [version, setVersion] = useState(0); // bump to re-read the store after save

  const stored = useMemo<GstDownloadRecord | null>(
    () => (companyId ? getDownload(companyId, type, period) : null),
    [companyId, type, period, version],
  );
  // Registration date gates every period: months before the GSTIN existed have no
  // return on the portal, so fetching them can only error.
  const regDate = company?.gst_details?.registrationDate;
  const gate = useMemo(() => availability(type, period, new Date(), regDate), [type, period, regDate]);

  // ── One-time username capture ────────────────────────────────────────────
  const saveUsername = async () => {
    const u = usernameDraft.trim();
    if (!u) { toast.error('Enter the GST portal username'); return; }
    await updateCompany?.({ gst_details: { ...company!.gst_details, portalUsername: u } });
    toast.success('GST portal username saved');
  };

  // ── Import flow ──────────────────────────────────────────────────────────
  const doFetch = async (token: string) => {
    setPhase('busy'); setBusyMsg(`Downloading ${label} for ${periodLabel(period)}…`);
    const { year, month } = toApiYearMonth(period);
    const r = await sandboxClient.fetchReturn(type, year, month, token);
    if (!r.ok) {
      if (r.status === 401 || /AUTH4033|session|expired/i.test(r.error || '')) {
        clearSessionToken(gstin);
        toast.error('Taxpayer session expired — please request a new OTP.');
        setPhase('idle'); return;
      }
      toast.error(r.error || 'Download failed'); setPhase('idle'); return;
    }
    // GSTN reports business failures as HTTP 200 + { status_cd:'0', error }. Only
    // a genuine "no data found" is an empty period — every other code is a real
    // failure (expired session, API access not enabled, return not filed) and must
    // be shown as-is instead of being saved as a misleading empty record.
    const bizErr = gstnBusinessError(r.data);
    if (bizErr && !isNoDataError(bizErr)) {
      if (/AUTH/i.test(bizErr.code)) clearSessionToken(gstin);
      toast.error(`${label} not fetched — ${bizErr.message}`, {
        description: bizErr.code ? `GST portal code ${bizErr.code}` : undefined,
        duration: 9000,
      });
      setPhase('idle');
      return;
    }

    const noData = isNoData(r.data) || isNoDataError(bizErr);
    const { rows, itcSummary } = parseReturn(type, r.data);
    saveDownload(companyId, {
      type, period, gstin, rows, itcSummary, noData, raw: r.data, fetchedAt: new Date().toISOString(),
    });
    setOtp(''); setPhase('idle'); setVersion((v) => v + 1);
    toast.success(noData ? `No ${label} data for ${periodLabel(period)}` : `${label} downloaded — ${rows.length} rows`);
  };

  const startImport = async () => {
    if (!gstin || !username) { toast.error('GSTIN and portal username are required'); return; }
    const token = getSessionToken(gstin);
    if (token) { await doFetch(token); return; } // reuse live 6h session — no OTP
    setPhase('busy'); setBusyMsg('Sending OTP…');
    const r = await sandboxClient.otpGenerate(gstin, username);
    if (!r.ok) { toast.error(r.error || 'Could not send OTP'); setPhase('idle'); return; }
    toast.success("OTP sent to the taxpayer's registered mobile/email");
    setPhase('otp');
  };

  /** Download every month of the selected period's financial year in one go.
   *  Months that are unavailable (before registration, or not yet generated by
   *  the portal) are skipped with a reason rather than fetched and failed. */
  const downloadYear = async () => {
    if (!gstin || !username) { toast.error('GSTIN and portal username are required'); return; }
    const token = getSessionToken(gstin);
    if (!token) { toast.error('Connect the GST portal first — start a single-month import to send the OTP.'); return; }

    const { year, month } = parsePeriod(period);
    const fyStart = fyOf(year, month).startYear;
    const all = ([1, 2, 3, 4] as const).flatMap((q) => quarterMonths(fyStart, q));

    setPhase('busy');
    let done = 0, empty = 0, failed = 0, skipped = 0;
    for (const [i, m] of all.entries()) {
      const fp = toPeriod(m.year, m.month);
      const g = availability(type, fp, new Date(), regDate);
      if (!g.available) { skipped++; continue; }
      setBusyMsg(`Downloading ${label} — ${periodLabel(fp)} (${i + 1}/${all.length})…`);
      const { year: y, month: mm } = toApiYearMonth(fp);
      const r = await sandboxClient.fetchReturn(type, y, mm, token);
      if (!r.ok) { failed++; continue; }
      const bizErr = gstnBusinessError(r.data);
      if (bizErr && !isNoDataError(bizErr)) {
        failed++;
        if (/AUTH/i.test(bizErr.code)) {
          clearSessionToken(gstin);
          toast.error(`Stopped at ${periodLabel(fp)} — ${bizErr.message}`, { duration: 9000 });
          break;                      // the session is dead; no point continuing
        }
        continue;
      }
      const noData = isNoData(r.data) || isNoDataError(bizErr);
      const { rows, itcSummary } = parseReturn(type, r.data);
      saveDownload(companyId, {
        type, period: fp, gstin, rows, itcSummary, noData, raw: r.data, fetchedAt: new Date().toISOString(),
      });
      if (noData) empty++; else done++;
    }
    setPhase('idle'); setVersion((v) => v + 1);
    const parts = [`${done} month(s) with data`];
    if (empty) parts.push(`${empty} empty`);
    if (skipped) parts.push(`${skipped} not available`);
    if (failed) parts.push(`${failed} failed`);
    toast.success(`FY ${fyStart}-${String((fyStart + 1) % 100).padStart(2, '0')} — ${parts.join(', ')}`);
  };

  const verifyAndFetch = async () => {
    if (!otp.trim()) { toast.error('Enter the OTP'); return; }
    setPhase('busy'); setBusyMsg('Verifying OTP…');
    const r = await sandboxClient.otpVerify(gstin, username, otp.trim());
    const token = r.data?.sessionToken;
    if (!r.ok || !token) { toast.error(r.error || 'OTP verification failed'); setPhase('otp'); return; }
    setSessionToken(gstin, token);
    await doFetch(token);
  };

  // ── Excel export ─────────────────────────────────────────────────────────
  const exportExcel = (rec: GstDownloadRecord) => {
    const wb = XLSX.utils.book_new();
    const bySection = new Map<string, GstInvoiceRow[]>();
    for (const row of rec.rows) {
      if (!bySection.has(row.section)) bySection.set(row.section, []);
      bySection.get(row.section)!.push(row);
    }
    if (rec.itcSummary) {
      const s = rec.itcSummary;
      const ws = XLSX.utils.json_to_sheet([
        { Head: 'IGST', Amount: s.igst }, { Head: 'CGST', Amount: s.cgst },
        { Head: 'SGST', Amount: s.sgst }, { Head: 'Cess', Amount: s.cess },
        { Head: 'Total ITC', Amount: s.total },
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'ITC Summary');
    }
    for (const [sec, rows] of bySection) {
      const ws = XLSX.utils.json_to_sheet(rows.map((r) => ({
        'Supplier GSTIN': r.supplierGstin, Supplier: r.supplierName, 'Doc No': r.docNo,
        'Doc Date': r.docDate, Type: r.docType, POS: r.pos, 'Rev Chg': r.reverseCharge,
        'Invoice Value': r.invoiceValue, 'Taxable Value': r.taxableValue,
        IGST: r.igst, CGST: r.cgst, SGST: r.sgst, Cess: r.cess,
        ...(type === 'GSTR2B' ? { 'ITC Avl': r.itcAvailable ?? '', 'ITC Reason': r.itcReason ?? '' } : {}),
      })));
      XLSX.utils.book_append_sheet(wb, ws, sec.slice(0, 31));
    }
    if (!bySection.size && !rec.itcSummary) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Note: 'No data for this period' }]), 'Empty');
    }
    XLSX.writeFile(wb, `${type}_${gstin}_${period}.xlsx`);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!gstin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        No GSTIN is configured for this company. Add it under <b>Settings → GST details</b> first.
      </div>
    );
  }

  if (!username) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-bold text-gray-900">Connect the GST portal</h3>
        <p className="mt-1 text-xs text-gray-500">
          One-time setup. Enter this client's <b>GST portal username</b> — the OTP is sent to the
          taxpayer's own registered mobile/email each time you download.
        </p>
        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          GSTIN <span className="font-mono font-semibold text-gray-800">{gstin}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={usernameDraft}
            onChange={(e) => setUsernameDraft(e.target.value)}
            placeholder="GST portal username"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={saveUsername}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
        <p className="mt-3 text-[11px] text-gray-400">
          The client must have enabled <b>Manage API Access</b> on the GST portal (valid up to 30 days)
          before OTP will work.
        </p>
      </div>
    );
  }

  const busy = phase === 'busy';

  return (
    <div className="space-y-4">
      <GstPeriodPicker value={period} onChange={(p) => { setPeriod(p); setPhase('idle'); setOtp(''); }} />

      {/* ── No stored data yet: import / gate / OTP ── */}
      {!stored && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          {phase === 'otp' ? (
            <div className="mx-auto max-w-sm">
              <p className="text-sm font-semibold text-gray-900">Enter the OTP</p>
              <p className="mt-1 text-xs text-gray-500">Sent to the taxpayer's registered mobile/email.</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  maxLength={8}
                  inputMode="numeric"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center font-mono text-lg tracking-widest focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={verifyAndFetch}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Verify &amp; Download
                </button>
              </div>
              <button type="button" onClick={() => setPhase('idle')} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          ) : busy ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm text-gray-500">{busyMsg}</p>
            </div>
          ) : gate.available ? (
            <div className="py-2">
              <p className="text-sm text-gray-500">No {label} downloaded for <b>{periodLabel(period)}</b> yet.</p>
              <button
                type="button"
                onClick={startImport}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Import {periodLabel(period)} data
              </button>
              <YearButton onClick={downloadYear} period={period} label={label} />
            </div>
          ) : (
            <div className="py-2">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Not available yet</p>
              <p className="mt-1 text-xs text-gray-500">{gate.reason}</p>
              <YearButton onClick={downloadYear} period={period} label={label} />
            </div>
          )}
        </div>
      )}

      {/* ── Stored data: table + KPIs + re-download + export ── */}
      {stored && (
        <GstReturnView
          record={stored}
          type={type}
          busy={busy}
          busyMsg={busyMsg}
          onReDownload={startImport}
          onExport={() => exportExcel(stored)}
        />
      )}
    </div>
  );
}

// ── Rendered view of a downloaded return ─────────────────────────────────────
function GstReturnView({
  record, type, busy, busyMsg, onReDownload, onExport,
}: {
  record: GstDownloadRecord;
  type: GstReturnType;
  busy: boolean;
  busyMsg: string;
  onReDownload: () => void;
  onExport: () => void;
}) {
  const label = type === 'GSTR2B' ? 'GSTR-2B' : 'GSTR-2A';
  const [activeSection, setActiveSection] = useState<string>('ALL');

  const sections = useMemo(() => {
    const set = new Set(record.rows.map((r) => r.section));
    return ['ALL', ...Array.from(set)];
  }, [record]);

  const rows = activeSection === 'ALL' ? record.rows : record.rows.filter((r) => r.section === activeSection);
  const s = record.itcSummary;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{label}</span> · {periodLabel(record.period)} ·{' '}
          <span className="font-mono">{record.gstin}</span>
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            Fetched {new Date(record.fetchedAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export to Excel
          </button>
          <button
            type="button"
            onClick={onReDownload}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            Re-download
          </button>
        </div>
      </div>

      {busy && <p className="text-xs text-blue-600">{busyMsg}</p>}

      {/* ITC summary KPIs (2B) */}
      {s && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: 'IGST', v: s.igst }, { k: 'CGST', v: s.cgst }, { k: 'SGST', v: s.sgst }, { k: 'Total ITC', v: s.total },
          ].map((kpi) => (
            <div key={kpi.k} className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{kpi.k}</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-gray-900">{money(kpi.v)}</p>
            </div>
          ))}
        </div>
      )}

      {record.noData ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          The portal returned no {label} data for {periodLabel(record.period)}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Section tabs */}
          <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-gray-50/60 p-2">
            {sections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  sec === activeSection ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {sec}{sec !== 'ALL' ? ` (${record.rows.filter((r) => r.section === sec).length})` : ` (${record.rows.length})`}
              </button>
            ))}
          </div>

          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2 text-left font-semibold">Section</th>
                  <th className="px-3 py-2 text-left font-semibold">Supplier GSTIN</th>
                  <th className="px-3 py-2 text-left font-semibold">Supplier</th>
                  <th className="px-3 py-2 text-left font-semibold">Doc No</th>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-right font-semibold">Invoice Value</th>
                  <th className="px-3 py-2 text-right font-semibold">Taxable</th>
                  <th className="px-3 py-2 text-right font-semibold">IGST</th>
                  <th className="px-3 py-2 text-right font-semibold">CGST</th>
                  <th className="px-3 py-2 text-right font-semibold">SGST</th>
                  <th className="px-3 py-2 text-right font-semibold">Cess</th>
                  {type === 'GSTR2B' && <th className="px-3 py-2 text-center font-semibold">ITC</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="px-3 py-1.5"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{r.section}</span></td>
                    <td className="px-3 py-1.5 font-mono text-[11px]">{r.supplierGstin}</td>
                    <td className="px-3 py-1.5 max-w-[180px] truncate" title={r.supplierName}>{r.supplierName}</td>
                    <td className="px-3 py-1.5">{r.docNo}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{r.docDate}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{money(r.invoiceValue)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{money(r.taxableValue)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{money(r.igst)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{money(r.cgst)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{money(r.sgst)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{money(r.cess)}</td>
                    {type === 'GSTR2B' && (
                      <td className="px-3 py-1.5 text-center">
                        {r.itcAvailable === 'Y' ? <span className="text-emerald-600">✓</span>
                          : r.itcAvailable === 'N' ? <span className="text-red-500" title={r.itcReason}>✕</span>
                          : '—'}
                      </td>
                    )}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={12} className="px-3 py-8 text-center text-gray-400">No rows in this section.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
