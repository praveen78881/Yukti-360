'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, FileUp, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangeFilter } from '@/components/export/DateRangeFilter';
import { ExportButtons } from '@/components/export/ExportButtons';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { ENTITY_TYPES } from '@/lib/constants/entityTypes';
import type { EntityType } from '@/types/company';
import {
  parseExternalFile,
  compareWithBooks,
  ERP_SOURCE_LABELS,
  type CompareResult,
  type ErpSource,
  type ExternalDataset,
} from '@/lib/integrations';

/* ─────────────────────────────────────────────────────────────────────────────
   ERP Bridge — import a trial balance / journal export from another ERP
   (Tally, Zoho Books, Winman, or any Excel/CSV) and reconcile it against the
   books, ledger by ledger.
   ──────────────────────────────────────────────────────────────────────────── */

const SOURCES: { key: ErpSource; hint: string; accept: string }[] = [
  { key: 'tally', hint: 'Masters + Day Book XML, JSON or TB PDF', accept: '.xml,.json,.pdf' },
  { key: 'zoho', hint: 'Journal or Trial Balance export (CSV/XLSX)', accept: '.csv,.xlsx,.xls' },
  { key: 'winman', hint: 'Trial balance export (Excel/CSV)', accept: '.csv,.xlsx,.xls' },
  { key: 'generic', hint: 'Any TB with Account + Dr/Cr columns', accept: '.csv,.xlsx,.xls' },
];

function signedAmount(n: number): string {
  if (n === 0) return '—';
  return `${formatIndianCurrency(Math.abs(n))} ${n > 0 ? 'Dr' : 'Cr'}`;
}

const STATUS_META = {
  matched: { label: 'Matched', cls: 'bg-green-100 text-green-700' },
  mismatched: { label: 'Mismatch', cls: 'bg-red-100 text-red-700' },
  'only-external': { label: 'Only in ERP', cls: 'bg-amber-100 text-amber-700' },
  'only-books': { label: 'Only in Books', cls: 'bg-blue-100 text-blue-700' },
} as const;

export default function ErpBridgePage() {
  const { company, companyId, loading: companyLoading } = useCompany();
  const fy = getCurrentFY();
  const [fromDate, setFromDate] = useState(fy.start);
  const [toDate, setToDate] = useState(fy.end);
  const [source, setSource] = useState<ErpSource>('tally');
  const [dataset, setDataset] = useState<ExternalDataset | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runCompare = (ds: ExternalDataset, from: string, to: string) => {
    if (!companyId) return;
    setResult(compareWithBooks(companyId, ds, { fromDate: from, toDate: to }));
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const ds = await parseExternalFile(source, file, { toDate });
      setDataset(ds);
      runCompare(ds, fromDate, toDate);
    } catch (err) {
      setDataset(null);
      setResult(null);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportData = useMemo(() => {
    if (!result) return [];
    return result.rows.map((r, i) => ({
      sno: i + 1,
      account: r.account,
      booksAccount: r.booksAccount || '—',
      externalNet: signedAmount(r.externalNet),
      booksNet: signedAmount(r.booksNet),
      difference: r.difference === 0 ? '—' : signedAmount(r.difference),
      status: STATUS_META[r.status].label,
    }));
  }, [result]);

  if (companyLoading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label || company.entity_type;

  const exportColumns = [
    { header: 'S.No', key: 'sno' },
    { header: `${ERP_SOURCE_LABELS[source]} Account`, key: 'account' },
    { header: 'Books Account', key: 'booksAccount' },
    { header: 'ERP Balance', key: 'externalNet', align: 'right' as const, isMono: true },
    { header: 'Books Balance', key: 'booksNet', align: 'right' as const, isMono: true },
    { header: 'Difference', key: 'difference', align: 'right' as const, isMono: true },
    { header: 'Status', key: 'status' },
  ];

  return (
    <div className="p-4 max-w-6xl space-y-4">
      <PageHeader
        title="ERP Bridge"
        description="Import data from Tally, Zoho Books, Winman or any Excel/CSV and reconcile it against your books"
      >
        <div className="flex flex-col gap-2 items-end">
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onDateChange={(f, t) => {
              setFromDate(f);
              setToDate(t);
              if (dataset) runCompare(dataset, f, t);
            }}
          />
          {result && (
            <ExportButtons
              title={`ERP Reconciliation — ${ERP_SOURCE_LABELS[source]}`}
              companyName={company.name}
              entityType={entityLabel}
              dateRange={`${fromDate} to ${toDate}`}
              columns={exportColumns}
              data={exportData}
              pdfOrientation="landscape"
            />
          )}
        </div>
      </PageHeader>

      {/* Source selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSource(s.key)}
            className={`text-left rounded-xl border px-4 py-3 transition-colors ${
              source === s.key
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className={`text-sm font-bold ${source === s.key ? 'text-blue-700' : 'text-gray-800'}`}>
              {ERP_SOURCE_LABELS[s.key]}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{s.hint}</p>
          </button>
        ))}
      </div>

      {/* Upload */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {busy ? 'Parsing…' : `Import ${ERP_SOURCE_LABELS[source]} file`}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={SOURCES.find((s) => s.key === source)?.accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void handleFile(f);
          }}
        />
        {dataset && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>
              <b className="text-gray-700">{dataset.fileName}</b> · {dataset.rows.length} ledgers
              {dataset.meta?.voucherCount ? ` · ${dataset.meta.voucherCount} vouchers` : ''}
            </span>
            <button
              type="button"
              onClick={() => runCompare(dataset, fromDate, toDate)}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              title="Re-run comparison against books"
            >
              <RefreshCw className="h-3 w-3" /> Re-compare
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && dataset && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Matched</p>
              <p className="text-lg font-bold text-green-700">{result.summary.matched}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Mismatched</p>
              <p className="text-lg font-bold text-red-700">{result.summary.mismatched}</p>
              <p className="text-xs text-gray-500 mt-1">Σ diff {formatIndianCurrency(result.summary.absoluteDifference)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Only in {ERP_SOURCE_LABELS[source]}</p>
              <p className="text-lg font-bold text-amber-700">{result.summary.onlyExternal}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Only in Books</p>
              <p className="text-lg font-bold text-blue-700">{result.summary.onlyBooks}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="text-center py-3 border-b border-gray-200 bg-gray-50/50">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">{company.name}</p>
              <h3 className="text-base font-bold text-gray-900 mt-0.5">
                {ERP_SOURCE_LABELS[source]} ↔ Books Reconciliation
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                ERP: {formatIndianCurrency(dataset.totalDebit)} Dr / {formatIndianCurrency(dataset.totalCredit)} Cr
                &nbsp;·&nbsp; Books: {formatIndianCurrency(result.summary.booksTotalDebit)} Dr / {formatIndianCurrency(result.summary.booksTotalCredit)} Cr
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{ERP_SOURCE_LABELS[source]} Ledger</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Books Ledger</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">ERP Balance</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Books Balance</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Difference</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={`${r.account}-${i}`} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-900">{r.account}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {r.booksAccount || <span className="text-gray-300">—</span>}
                        {r.matchKind && r.matchKind !== 'exact' && (
                          <span className="ml-1.5 text-[10px] text-gray-400 uppercase">({r.matchKind})</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums">{signedAmount(r.externalNet)}</td>
                      <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums">{signedAmount(r.booksNet)}</td>
                      <td className={`px-3 py-2 text-right font-mono text-[13px] tabular-nums ${r.difference !== 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {r.difference === 0 ? '—' : signedAmount(r.difference)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[r.status].cls}`}>
                          {STATUS_META[r.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!result && !error && !busy && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <ArrowLeftRight className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Pick the source ERP, then import its export file.</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Every ledger is matched against your books (exact → alias → fuzzy) and reconciled —
            mismatches, ledgers missing from the books, and ledgers missing in the ERP are flagged.
          </p>
        </div>
      )}
    </div>
  );
}
