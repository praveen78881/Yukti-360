'use client';

import { useMemo, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { PageHeader } from '@/components/layout/PageHeader';
import { ScheduleIIIAgeingCard } from '@/components/formats/ScheduleIIIAgeingCard';
import { useAgeingBasis, useInvoiceDueDates } from '@/components/bills/ageingBasis';
import { localISODate } from '@/components/bills/shared/format';
import { computeCreditorAgeing } from '@/lib/accounting/ageingCompute';

function inr(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Extract voucher numbers from journal entries for a specific party. */
function getPartyInvoices(
  entries: ReturnType<typeof useJournalEntries>['entries'],
  partyName: string,
): { voucherNo: string; date: string; amount: number; type: string }[] {
  const invoices: { voucherNo: string; date: string; amount: number; type: string }[] = [];
  for (const e of entries) {
    for (const line of e.lines) {
      if (line.account_name !== partyName) continue;
      if (!['Trade Payables', 'Sundry Creditors'].includes(line.account_group)) continue;
      const net = (line.credit || 0) - (line.debit || 0);
      if (net !== 0) {
        invoices.push({
          voucherNo: e.voucher_number || e.entry_code,
          date: e.entry_date,
          amount: net,
          type: e.voucher_type,
        });
      }
    }
  }
  return invoices.sort((a, b) => b.date.localeCompare(a.date));
}

export default function CreditorsPage() {
  const { company, companyId, loading } = useCompany();
  const { entries, loading: entriesLoading } = useJournalEntries({ companyId: companyId || '', enabled: !!companyId });
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [basis, setBasis] = useAgeingBasis();
  const dueDates = useInvoiceDueDates(companyId, 'payable');

  const today = localISODate();

  const ageingRows = useMemo(() => {
    if (!entries.length) return [];
    return computeCreditorAgeing(entries, today, 'schedule_iii', { basis, dueDates })
      .sort((a, b) => b.ageing.total - a.ageing.total);
  }, [entries, today, basis, dueDates]);

  const totalOutstanding = ageingRows.reduce((s, r) => s + r.ageing.total, 0);
  const partyCount = ageingRows.length;
  const over6m = ageingRows.reduce((s, r) => s + (r.scheduleIIIAgeing ? r.scheduleIIIAgeing.total - r.scheduleIIIAgeing.lessThan6Months - (r.scheduleIIIAgeing.notYetDue ?? 0) : r.ageing.days_over_180), 0);

  const selectedRow = ageingRows.find((r) => r.accountName === selectedParty) || null;
  const selectedInvoices = useMemo(() => {
    if (!selectedParty) return [];
    return getPartyInvoices(entries, selectedParty);
  }, [entries, selectedParty]);

  if (loading || entriesLoading || !company || !companyId) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Creditors" description="Trade payables — per-party outstanding and ageing" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Payable</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-gray-900">
            <span className="text-sm text-gray-400">&#8377;</span>{inr(totalOutstanding)}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">{partyCount} part{partyCount !== 1 ? 'ies' : 'y'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Over 6 Months</p>
          <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${over6m > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            <span className="text-sm text-gray-400">&#8377;</span>{inr(over6m)}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">{basis === 'due' ? 'Over 6 months past due' : 'Long outstanding'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Suppliers</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-gray-900">{partyCount}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">With outstanding balance</p>
        </div>
      </div>

      {/* Ageing Table */}
      <ScheduleIIIAgeingCard
        title="Creditors Ageing (Schedule III)"
        rows={ageingRows}
        asAt={today}
        nameHeader="Party Name"
        emptyText="No outstanding creditors. All payables are settled."
        basis={basis}
        onBasisChange={setBasis}
        onSelect={setSelectedParty}
        selectedName={selectedParty}
      />

      {/* Slide-Out Drawer — party detail */}
      {selectedRow && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSelectedParty(null)} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Creditor Details</p>
                <p className="mt-0.5 text-sm font-bold text-gray-900 max-w-[280px] truncate">{selectedRow.accountName}</p>
              </div>
              <button
                onClick={() => setSelectedParty(null)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Outstanding summary */}
              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700">Total Payable</span>
                  <span className="font-mono text-sm font-bold text-gray-900">{inr(selectedRow.ageing.total)}</span>
                </div>
              </div>

              {/* Ageing breakdown */}
              {selectedRow.scheduleIIIAgeing && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Ageing Breakdown</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Not Yet Due', value: selectedRow.scheduleIIIAgeing.notYetDue ?? 0 },
                      { label: '< 6 Months', value: selectedRow.scheduleIIIAgeing.lessThan6Months },
                      { label: '6m - 1 Year', value: selectedRow.scheduleIIIAgeing.sixMonthsTo1Year },
                      { label: '1 - 2 Years', value: selectedRow.scheduleIIIAgeing.oneYearTo2Years },
                      { label: '2 - 3 Years', value: selectedRow.scheduleIIIAgeing.twoYearsTo3Years },
                      { label: '> 3 Years', value: selectedRow.scheduleIIIAgeing.moreThan3Years },
                    ].filter((b) => b.value > 0).map((b) => (
                      <div key={b.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">{b.label}</span>
                        <span className="font-mono text-[11px] font-semibold text-gray-700">{inr(b.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Transactions ({selectedInvoices.length})
                </p>
                {selectedInvoices.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No transactions found</p>
                ) : (
                  <div className="space-y-1">
                    {selectedInvoices.map((inv, i) => {
                      const due = inv.amount > 0 ? dueDates.get(inv.voucherNo) : undefined;
                      return (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                          <div>
                            <p className="font-mono text-[11px] font-semibold text-gray-800">{inv.voucherNo}</p>
                            <p className="text-[10px] text-gray-400">{inv.date} &middot; {inv.type}{due && <> &middot; Due {due}</>}</p>
                          </div>
                          <span className={`font-mono text-[11px] font-bold ${inv.amount > 0 ? 'text-gray-900' : 'text-emerald-600'}`}>
                            {inv.amount > 0 ? '' : '-'}{inr(Math.abs(inv.amount))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
