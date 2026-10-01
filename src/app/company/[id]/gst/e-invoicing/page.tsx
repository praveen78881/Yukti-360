'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { ReceiptText, FileCheck2, Ban } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { PageHeader } from '@/components/layout/PageHeader';
import { EInvoiceGenerator } from '@/components/gst/EInvoiceGenerator';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { listEInvoices, updateEInvoice, getEinvToken, type EInvRecord } from '@/lib/gst/sandbox/einv';
import { ModuleLocked } from '@/components/gst/ModuleLocked';

export default function EInvoicingPage() {
  return <ModuleLocked title="e-Invoicing" description="Generate and manage IRNs directly with the IRP portal" />;
}

// Unlocks 31 Oct 2026 — restore by swapping the default export back to this component.
function EInvoicingPageUnlocked() {
  const { company, companyId, loading } = useCompany();
  const [tab, setTab] = useState<'generate' | 'register'>('generate');
  const [tick, setTick] = useState(0);
  const generated = useMemo(() => (companyId ? listEInvoices(companyId) : []), [companyId, tick]);

  if (loading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }
  const gstin = (company.gst_details?.gstin || '').trim();

  const cancelInvoice = async (rec: EInvRecord) => {
    const token = getEinvToken(gstin);
    if (!token) { toast.error('Connect the e-Invoice portal in the Generate tab first'); setTab('generate'); return; }
    const reason = window.prompt('Cancellation reason — 1: Duplicate, 2: Data entry mistake', '2');
    if (!reason) return;
    const r = await sandboxClient.einvCancel(token, rec.irn, reason, 'Cancelled via Yukti 360');
    const env: any = r.data?.data ?? r.data;
    const ok = env?.Status === 1 || env?.Status === '1' || env?.Data?.CancelDate;
    if (r.ok && ok) {
      if (companyId) updateEInvoice(companyId, rec.irn, { status: 'cancelled' });
      setTick((t) => t + 1);
      toast.success('e-Invoice cancelled');
    } else {
      const errs = env?.ErrorDetails;
      toast.error(Array.isArray(errs) && errs.length ? errs.map((e: any) => e.ErrorMessage).join('; ') : (r.error || 'Cancellation failed'));
    }
  };

  return (
    <div>
      <PageHeader title="e-Invoicing" description="Generate IRN-registered e-Invoices via the IRP and track them" />

      <div className="mb-4 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        <button type="button" onClick={() => setTab('generate')} className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === 'generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><FileCheck2 className="h-4 w-4" /> Generate</button>
        <button type="button" onClick={() => setTab('register')} className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><ReceiptText className="h-4 w-4" /> Register ({generated.length})</button>
      </div>

      {tab === 'generate' && (
        <EInvoiceGenerator onGenerated={() => { setTick((t) => t + 1); setTab('register'); }} />
      )}

      {tab === 'register' && (
        generated.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            No e-Invoices generated yet. Use the <button type="button" onClick={() => setTab('generate')} className="font-semibold text-blue-600 hover:underline">Generate</button> tab to create one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="px-3 py-2.5 text-left font-semibold">IRN</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Ack No.</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Doc No.</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Buyer</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Value (₹)</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {generated.map((b) => (
                    <tr key={b.irn} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 max-w-[220px] truncate font-mono text-[11px] text-gray-700" title={b.irn}>{b.irn}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">{b.ackNo || '—'}</td>
                      <td className="px-3 py-2">{b.docNo}</td>
                      <td className="px-3 py-2 max-w-[180px] truncate" title={`${b.buyerName} · ${b.buyerGstin}`}>{b.buyerName || b.buyerGstin}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{formatIndianCurrency(b.totInvVal)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{b.status === 'active' ? 'Active' : 'Cancelled'}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {b.status === 'active' ? (
                          <button type="button" onClick={() => cancelInvoice(b)} className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-0.5 text-[11px] font-medium text-red-500 hover:bg-red-50"><Ban className="h-3 w-3" /> Cancel</button>
                        ) : <span className="text-[11px] text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
