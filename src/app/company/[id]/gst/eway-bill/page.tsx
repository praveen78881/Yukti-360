'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Truck, FileCheck2, Ban } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangeFilter } from '@/components/export/DateRangeFilter';
import { ExportButtons } from '@/components/export/ExportButtons';
import { EwayBillGenerator } from '@/components/gst/EwayBillGenerator';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { ENTITY_TYPES } from '@/lib/constants/entityTypes';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { listEwbBills, updateEwbBill, getEwbToken, type EwbRecord } from '@/lib/gst/sandbox/ewb';
import { describeEwbError } from '@/lib/gst/sandbox/ewbErrors';
import { ModuleLocked } from '@/components/gst/ModuleLocked';
import type { JournalEntry } from '@/lib/accounting/computeEngine';
import type { EntityType } from '@/types/company';

interface EWayBillRow {
  date: string;
  voucherNumber: string;
  partyName: string;
  invoiceValue: number;
  goodsDescription: string;
  ewayBillRequired: boolean;
}

function computeEWayBillRegister(entries: JournalEntry[]): EWayBillRow[] {
  const rows: EWayBillRow[] = [];
  const salesEntries = entries.filter((e) => e.voucher_type === 'SLS');
  for (const entry of salesEntries) {
    let invoiceValue = 0;
    let partyName = '';
    for (const line of entry.lines) {
      if (line.account_group === 'Trade Receivables' || line.account_group === 'Sundry Debtors') {
        partyName = line.account_name;
        invoiceValue += line.debit || 0;
      }
    }
    if (invoiceValue > 0) {
      rows.push({
        date: entry.entry_date,
        voucherNumber: entry.voucher_number || entry.entry_code,
        partyName,
        invoiceValue,
        goodsDescription: entry.narration || '',
        ewayBillRequired: invoiceValue >= 50000,
      });
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export default function EWayBillPage() {
  return <ModuleLocked title="e-Way Bill Register" description="Goods movement register and automated generation for consignments above threshold" />;
}

// Unlocks 31 Oct 2026 — restore by swapping the default export back to this component.
function EWayBillPageUnlocked() {
  const { company, companyId, loading: companyLoading } = useCompany();
  const fy = getCurrentFY();
  const [tab, setTab] = useState<'generate' | 'register'>('generate');
  const [fromDate, setFromDate] = useState(fy.start);
  const [toDate, setToDate] = useState(fy.end);
  const [ewbTick, setEwbTick] = useState(0);

  const { entries, loading } = useJournalEntries({
    companyId: companyId || '',
    fromDate,
    toDate,
    enabled: !!companyId,
  });

  const rows = useMemo(() => computeEWayBillRegister(entries), [entries]);
  const generated = useMemo(() => (companyId ? listEwbBills(companyId) : []), [companyId, ewbTick]);
  const required = rows.filter((r) => r.ewayBillRequired);
  const notRequired = rows.filter((r) => !r.ewayBillRequired);

  if (companyLoading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const gstin = (company.gst_details?.gstin || '').trim();
  const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label || company.entity_type;

  const columns = [
    { header: 'S.No', key: 'sno' },
    { header: 'Date', key: 'date' },
    { header: 'Invoice No.', key: 'voucherNumber' },
    { header: 'Party Name', key: 'partyName' },
    { header: 'Invoice Value (₹)', key: 'invoiceValue', align: 'right' as const, isMono: true },
    { header: 'Description', key: 'goodsDescription' },
    { header: 'e-Way Bill Required', key: 'ewayBillRequired' },
  ];
  const data = rows.map((r, i) => ({ sno: i + 1, ...r, ewayBillRequired: r.ewayBillRequired ? 'Yes' : 'No' }));

  const cancelBill = async (rec: EwbRecord) => {
    const token = getEwbToken(gstin);
    if (!token) { toast.error('Connect the EWB portal in the Generate tab first'); setTab('generate'); return; }
    const reason = window.prompt('Cancellation reason — 1: Duplicate, 2: Order cancelled, 3: Data entry error, 4: Others', '2');
    if (!reason) return;
    const r = await sandboxClient.ewbCancel(token, rec.ewbNo, Number(reason), 'Cancelled via CA Studio');
    const d: any = r.data?.data ?? r.data;
    if (r.ok && !d?.error?.errorCodes) {
      if (companyId) updateEwbBill(companyId, rec.ewbNo, { status: 'cancelled' });
      setEwbTick((t) => t + 1);
      toast.success(`e-Way Bill ${rec.ewbNo} cancelled`);
    } else {
      toast.error(describeEwbError(d?.error?.errorCodes) || r.error || 'Cancellation failed');
    }
  };

  return (
    <div>
      <PageHeader title="e-Way Bill" description="Generate e-Way Bills live via the portal and track the movement register">
        {tab === 'register' ? (
          <div className="flex flex-col items-end gap-2">
            <DateRangeFilter fromDate={fromDate} toDate={toDate} onDateChange={(f, t) => { setFromDate(f); setToDate(t); }} />
            <ExportButtons title="e-Way Bill Register" companyName={company.name} entityType={entityLabel} dateRange={`${fromDate} to ${toDate}`} columns={columns} data={data} />
          </div>
        ) : null}
      </PageHeader>

      {/* Tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        <button type="button" onClick={() => setTab('generate')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === 'generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          <FileCheck2 className="h-4 w-4" /> Generate (Live)
        </button>
        <button type="button" onClick={() => setTab('register')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          <Truck className="h-4 w-4" /> Register
        </button>
      </div>

      {/* ── Generate tab ── */}
      {tab === 'generate' && (
        <EwayBillGenerator onGenerated={() => { setEwbTick((t) => t + 1); setTab('register'); }} />
      )}

      {/* ── Register tab ── */}
      {tab === 'register' && (
        <div className="space-y-5">
          {/* Live-generated e-Way Bills */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
              <FileCheck2 className="h-4 w-4" /> Generated e-Way Bills ({generated.length})
            </h3>
            {generated.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
                No e-Way Bills generated yet. Use the <button type="button" onClick={() => setTab('generate')} className="font-semibold text-blue-600 hover:underline">Generate</button> tab to create one.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2.5 text-left font-semibold">EWB No.</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Generated</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Valid upto</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Doc No.</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Recipient</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Value (₹)</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Vehicle</th>
                        <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                        <th className="px-3 py-2.5 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generated.map((b) => (
                        <tr key={b.ewbNo} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-[13px] font-semibold text-gray-900">{b.ewbNo}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{b.ewbDate || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{b.validUpto || '—'}</td>
                          <td className="px-3 py-2">{b.docNo}</td>
                          <td className="px-3 py-2 max-w-[200px] truncate" title={`${b.toTrdName} · ${b.toGstin}`}>{b.toTrdName || b.toGstin}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">{formatIndianCurrency(b.totInvValue)}</td>
                          <td className="px-3 py-2 font-mono text-xs">{b.vehicleNo || '—'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                              {b.status === 'active' ? 'Active' : 'Cancelled'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {b.status === 'active' ? (
                              <button type="button" onClick={() => cancelBill(b)} className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-0.5 text-[11px] font-medium text-red-500 hover:bg-red-50">
                                <Ban className="h-3 w-3" /> Cancel
                              </button>
                            ) : <span className="text-[11px] text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Books-derived movement register */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
              <Truck className="h-4 w-4" /> Movement register (from books)
            </h3>
            {rows.length > 0 && (
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Total Consignments</p>
                  <p className="text-lg font-bold text-blue-700">{rows.length}</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">e-Way Bill Required</p>
                  <p className="text-lg font-bold text-red-700">{required.length}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatIndianCurrency(required.reduce((s, r) => s + r.invoiceValue, 0))} total</p>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Below Threshold</p>
                  <p className="text-lg font-bold text-green-700">{notRequired.length}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatIndianCurrency(notRequired.reduce((s, r) => s + r.invoiceValue, 0))} total</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <p className="text-sm text-gray-400">No sales consignments found. Create SLS voucher journal entries to populate the movement register.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0">
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">S.No</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Invoice No.</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Party Name</th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Invoice Value (₹)</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Description</th>
                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">e-Way Bill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={`${r.date}-${r.voucherNumber}-${i}`} className={`border-b border-gray-100 ${r.ewayBillRequired ? 'bg-red-50/30' : ''}`}>
                          <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{r.date}</td>
                          <td className="px-3 py-2">{r.voucherNumber}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{r.partyName || '—'}</td>
                          <td className="px-3 py-2 text-right font-mono text-[13px] font-semibold tabular-nums">{formatIndianCurrency(r.invoiceValue)}</td>
                          <td className="px-3 py-2 max-w-xs truncate text-gray-600">{r.goodsDescription || '—'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.ewayBillRequired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                              {r.ewayBillRequired ? 'Required' : 'Not Required'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-gray-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                  <p className="font-medium">e-Way Bill Rules:</p>
                  <p>Required for movement of goods with consignment value exceeding ₹50,000. Generate on the Generate tab before dispatch.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
