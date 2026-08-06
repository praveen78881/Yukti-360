'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, AlertTriangle } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangeFilter } from '@/components/export/DateRangeFilter';
import { ExportButtons } from '@/components/export/ExportButtons';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { ENTITY_TYPES } from '@/lib/constants/entityTypes';
import type { EntityType } from '@/types/company';
import { computeBooksGst } from '@/lib/accounting/gstBooksBridge';

/* ─────────────────────────────────────────────────────────────────────────────
   GST — Books Bridge (the parallel wire).

   Derives GST straight from journal entries — sales/purchases that reached the
   books through ANY route (manual JEs, bank import, bulk workspace, JSON
   import, CARP AI) — and reconciles them against the invoice register that
   feeds GSTR-1/3B. The invoice-register circuit is read, never written.
   ──────────────────────────────────────────────────────────────────────────── */

export default function GstBooksBridgePage() {
  const { company, companyId, loading: companyLoading } = useCompany();
  const fy = getCurrentFY();
  const [fromDate, setFromDate] = useState(fy.start);
  const [toDate, setToDate] = useState(fy.end);

  // Subscribe to journal changes so the bridge stays live; compute uses the lib.
  const { entries, loading } = useJournalEntries({
    companyId: companyId || '',
    fromDate,
    toDate,
    enabled: !!companyId,
  });

  const result = useMemo(() => {
    if (!companyId) return null;
    void entries; // recompute when the journal changes
    return computeBooksGst(companyId, fromDate, toDate);
  }, [companyId, fromDate, toDate, entries]);

  if (companyLoading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label || company.entity_type;

  const booksOutTax = result ? result.booksOutward.cgst + result.booksOutward.sgst + result.booksOutward.igst : 0;
  const booksItc = result ? result.booksInward.cgst + result.booksInward.sgst + result.booksInward.igst : 0;
  const regOut = result ? result.invoiceRegister.outwardSupplies : { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
  const regOutTax = regOut.cgst + regOut.sgst + regOut.igst;
  const regItc = result ? result.invoiceRegister.itcAvailed.cgst + result.invoiceRegister.itcAvailed.sgst + result.invoiceRegister.itcAvailed.igst : 0;
  const hasGap = result ? (result.unbridged.outwardCount + result.unbridged.inwardCount) > 0 : false;

  const columns = [
    { header: 'S.No', key: 'sno' },
    { header: 'Date', key: 'date' },
    { header: 'Entry', key: 'entryCode' },
    { header: 'Vch', key: 'voucherType' },
    { header: 'Party', key: 'partyName' },
    { header: 'Kind', key: 'kind' },
    { header: 'Taxable (₹)', key: 'taxableValue', align: 'right' as const, isMono: true },
    { header: 'CGST (₹)', key: 'cgst', align: 'right' as const, isMono: true },
    { header: 'SGST (₹)', key: 'sgst', align: 'right' as const, isMono: true },
    { header: 'IGST (₹)', key: 'igst', align: 'right' as const, isMono: true },
    { header: 'In Register?', key: 'bridgedLabel' },
  ];
  const exportData = (result?.rows ?? []).map((r, i) => ({
    sno: i + 1,
    date: r.date,
    entryCode: r.entryCode,
    voucherType: r.voucherType,
    partyName: r.partyName || '—',
    kind: r.kind === 'outward' ? 'Outward' : 'Inward',
    taxableValue: r.taxableValue,
    cgst: r.cgst,
    sgst: r.sgst,
    igst: r.igst,
    bridgedLabel: r.bridged ? 'Yes' : 'Books only',
  }));

  return (
    <div className="p-4 max-w-6xl space-y-4">
      <PageHeader
        title="GST — Books Bridge"
        description="Parallel wire: GST derived directly from journal entries, reconciled with the invoice register (which stays untouched)"
      >
        <div className="flex flex-col gap-2 items-end">
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onDateChange={(f, t) => { setFromDate(f); setToDate(t); }} />
          <ExportButtons
            title="GST Books Bridge"
            companyName={company.name}
            entityType={entityLabel}
            dateRange={`${fromDate} to ${toDate}`}
            columns={columns}
            data={exportData}
            pdfOrientation="landscape"
          />
        </div>
      </PageHeader>

      {hasGap && result && (
        <div className="flex items-start gap-2.5 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-amber-800">
            <b>{result.unbridged.outwardCount + result.unbridged.inwardCount} GST entr{result.unbridged.outwardCount + result.unbridged.inwardCount === 1 ? 'y' : 'ies'} exist only in the books</b> —
            they are not in the invoice register, so today they would be missing from GSTR-1/3B:
            output tax {formatIndianCurrency(result.unbridged.outwardTax)} · ITC {formatIndianCurrency(result.unbridged.inwardTax)}.
            Rows marked <span className="font-semibold">Books only</span> below.
          </div>
        </div>
      )}

      {/* Two wires, side by side */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <BookOpenCheck className="h-3.5 w-3.5 text-blue-600" /> Books (journal wire)
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Outward taxable</span><span className="font-mono">{formatIndianCurrency(result.booksOutward.taxableValue)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Output tax</span><span className="font-mono">{formatIndianCurrency(booksOutTax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ITC (input tax)</span><span className="font-mono">{formatIndianCurrency(booksItc)}</span></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Invoice register (existing wire)</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Outward taxable</span><span className="font-mono">{formatIndianCurrency(regOut.taxableValue)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Output tax</span><span className="font-mono">{formatIndianCurrency(regOutTax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ITC (eligible)</span><span className="font-mono">{formatIndianCurrency(regItc)}</span></div>
            </div>
          </div>
          <div className={`border rounded-xl px-4 py-3 ${result.gap.outwardTax !== 0 || result.gap.itc !== 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Difference (books − register)</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Outward taxable</span><span className={`font-mono ${result.gap.outwardTaxable !== 0 ? 'text-red-700 font-semibold' : 'text-green-700'}`}>{formatIndianCurrency(result.gap.outwardTaxable)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Output tax</span><span className={`font-mono ${result.gap.outwardTax !== 0 ? 'text-red-700 font-semibold' : 'text-green-700'}`}>{formatIndianCurrency(result.gap.outwardTax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ITC</span><span className={`font-mono ${result.gap.itc !== 0 ? 'text-red-700 font-semibold' : 'text-green-700'}`}>{formatIndianCurrency(result.gap.itc)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Entry-level detail */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : !result || result.rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400">No GST-bearing journal entries in this period. Entries with Output/Input GST lines (or SLS/PUR vouchers) appear here automatically.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="text-center py-3 border-b border-gray-200 bg-gray-50/50">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">{company.name}</p>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">GST Entries in the Books</h3>
            <p className="text-xs text-gray-400 mt-0.5">{fromDate} to {toDate}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Entry</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Vch</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Party</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Kind</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Taxable</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tax</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">In Register?</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={`${r.entryId}-${r.kind}`} className={`border-b border-gray-100 ${!r.bridged ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-3 py-1.5 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.entryCode}</td>
                    <td className="px-3 py-2 text-xs">{r.voucherType}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{r.partyName || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.kind === 'outward' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {r.kind === 'outward' ? 'Outward' : 'Inward'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums">{formatIndianCurrency(r.taxableValue)}</td>
                    <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums">{formatIndianCurrency(r.totalTax)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.bridged ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.bridged ? 'Yes' : 'Books only'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
