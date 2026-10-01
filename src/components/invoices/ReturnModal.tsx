'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { INDIAN_STATES_BY_NAME } from '@/lib/constants/indianStates';
import { DocumentWizard } from '@/components/invoices/document-wizard';
import {
  listInvoicesV2,
  listPurchaseInvoices,
  createInvoiceV2,
  updateInvoiceV2,
  getStateCodeFromGSTIN,
  createReturnFromInvoiceV2,
  createReturnFromPurchaseInvoiceLegacy,
  type InvoiceV2,
  type PurchaseInvoice,
  type CdnReason,
  type ReturnItemInput,
} from '@/lib/accounting/gstInvoices';
import { createReturnJournalEntry } from '@/lib/accounting/invoiceJournalSync';
import { listJournalEntries, deleteJournalEntry } from '@/lib/offlineDb';

/** Voucher types a return note posts under — an edit replaces only these. */
const RETURN_VOUCHER_TYPES = new Set<string>(['SR', 'PR', 'CN', 'DN']);

function inr(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CDN_REASON_OPTIONS: Array<{ value: CdnReason; label: string }> = [
  { value: 'SALES_RETURN', label: 'Sales Return' },
  { value: 'PRICE_REDUCTION', label: 'Price Reduction' },
  { value: 'DEFICIENCY_SERVICE', label: 'Deficiency in Service' },
  { value: 'POST_SALE_DISCOUNT', label: 'Post-Sale Discount' },
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'OTHER', label: 'Other' },
];

const PURCHASE_REASON_OPTIONS: Array<{ value: CdnReason; label: string }> = [
  { value: 'SALES_RETURN', label: 'Purchase Return' },
  { value: 'PRICE_REDUCTION', label: 'Price Difference' },
  { value: 'CORRECTION', label: 'Wrong/Defective Goods' },
  { value: 'OTHER', label: 'Other' },
];

type SourceInvoice =
  | { kind: 'v2'; data: InvoiceV2 }
  | { kind: 'v1'; data: PurchaseInvoice };

interface ReturnItem {
  itemIndex: number;
  description: string;
  origQty: number;
  rate: number;
  gstRate: number;
  returnQty: number;
  /** Taxable value as stored on the invoice line (net of discount) — proration base. */
  origTaxable: number;
  /** Total tax as stored on the invoice line (CGST+SGST+IGST+cess). */
  origTax: number;
}

function buildReturnItems(source: SourceInvoice): ReturnItem[] {
  if (source.kind === 'v2') {
    return source.data.items.map((item, i) => ({
      itemIndex: i,
      description: item.description,
      origQty: item.qty,
      rate: item.rate,
      gstRate: item.gst_rate,
      returnQty: item.qty,
      origTaxable: item.taxable_value,
      origTax: (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0) + (item.cess || 0),
    }));
  }
  // Legacy V1 purchase invoice — synthesize single row
  const inv = source.data;
  return [{
    itemIndex: 0,
    description: inv.item_description || 'Purchase',
    origQty: inv.item_qty ?? 1,
    rate: inv.item_rate ?? inv.taxable_value,
    gstRate: inv.gst_rate,
    returnQty: inv.item_qty ?? 1,
    origTaxable: inv.taxable_value,
    origTax: (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0),
  }];
}

/** How a source invoice reads in the search: its number, party, date and amount —
 *  and for a purchase, the vendor's own invoice number too. */
function describeSource(s: SourceInvoice): { party: string; total: number; extra: string } {
  if (s.kind === 'v2') return { party: s.data.buyer_name, total: s.data.total_amount, extra: '' };
  return { party: s.data.vendor_name, total: s.data.total, extra: s.data.vendor_invoice_no || '' };
}

/** Every word typed must appear somewhere in what the invoice reads as. */
function sourceMatches(s: SourceInvoice, q: string): boolean {
  const d = describeSource(s);
  const hay = `${s.data.invoice_no} ${d.extra} ${d.party} ${s.data.invoice_date} ${d.total} ${inr(d.total)}`.toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

function listSources(companyId: string, returnType: 'SALES' | 'PURCHASE'): SourceInvoice[] {
  if (returnType === 'SALES') {
    return listInvoicesV2(companyId)
      .filter((inv) => inv.doc_type === 'TAX_INVOICE' || inv.doc_type === 'BILL_OF_SUPPLY')
      .map((inv) => ({ kind: 'v2' as const, data: inv }));
  }
  // Purchase: V1 non-return purchase invoices
  return listPurchaseInvoices(companyId)
    .filter((inv) => inv.bucket !== 'CDNR')
    .map((inv) => ({ kind: 'v1' as const, data: inv }));
}

/** The return quantities an existing note stands for, laid over the original's rows. */
function itemsFromNote(rows: ReturnItem[], note: InvoiceV2, source: SourceInvoice): ReturnItem[] {
  if (source.kind === 'v1') {
    // One synthesised row: the note's share of the original's taxable value.
    const base = source.data.taxable_value || 0;
    const share = base > 0 ? Math.min(1, note.total_taxable / base) : 1;
    return rows.map((r) => ({ ...r, returnQty: Math.round(r.origQty * share * 10000) / 10000 }));
  }
  // Each note line was copied from an original line — match it back by what was copied.
  const left = [...note.items];
  return rows.map((r) => {
    const orig = source.data.items[r.itemIndex];
    const i = left.findIndex((n) => n.description === orig.description && n.hsn === orig.hsn && n.rate === orig.rate);
    if (i < 0) return { ...r, returnQty: 0 };
    const [n] = left.splice(i, 1);
    return { ...r, returnQty: Math.min(n.qty, r.origQty) };
  });
}

interface ReturnModalProps {
  companyId: string;
  returnType: 'SALES' | 'PURCHASE';
  /** An existing note to edit: its original is pre-selected, its quantities
   *  read back, and saving keeps its number and replaces its ledger posting. */
  initial?: InvoiceV2 | null;
  onClose: () => void;
  onSave: () => void;
}

export function ReturnModal({ companyId, returnType, initial, onClose, onSave }: ReturnModalProps) {
  const today = new Date().toISOString().slice(0, 10);

  const { company } = useCompany();
  const companyGstin = company?.gst_details?.gstin || '';
  const companyStateName = company?.entity_details?.state || '';
  const sellerStateCode = companyGstin
    ? getStateCodeFromGSTIN(companyGstin)
    : (companyStateName ? INDIAN_STATES_BY_NAME[companyStateName.toLowerCase()]?.gstCode : null);
  // Bumped when an invoice is created from inside the form, so the list refreshes.
  const [tick, setTick] = useState(0);

  const sourceInvoices = useMemo(() => listSources(companyId, returnType), [companyId, returnType, tick]);

  const initialSource = useMemo(
    () => (initial ? sourceInvoices.find((s) => s.data.invoice_no === initial.original_invoice_no) ?? null : null),
    [initial, sourceInvoices],
  );
  const [selectedId, setSelectedId] = useState(initialSource?.data.id ?? '');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>(() =>
    initial && initialSource ? itemsFromNote(buildReturnItems(initialSource), initial, initialSource) : [],
  );
  const [returnDate, setReturnDate] = useState(initial?.invoice_date ?? today);
  const [reason, setReason] = useState<CdnReason>(initial?.cdn_reason ?? 'SALES_RETURN');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedSource = useMemo(
    () => sourceInvoices.find((s) => s.data.id === selectedId) ?? null,
    [sourceInvoices, selectedId]
  );

  // The original is found by typing — its number, the vendor's or customer's
  // name, the date or the amount — not picked from a list of everything.
  const [query, setQuery] = useState(initialSource?.data.invoice_no ?? '');
  const [listOpen, setListOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? sourceInvoices.filter((s) => sourceMatches(s, q)).slice(0, 8) : []),
    [sourceInvoices, q],
  );

  function selectSource(source: SourceInvoice) {
    setSelectedId(source.data.id);
    setQuery(source.data.invoice_no);
    setListOpen(false);
    setError('');
    setReturnItems(buildReturnItems(source));
  }

  function clearSelection() {
    setSelectedId('');
    setQuery('');
    setReturnItems([]);
    setListOpen(false);
  }

  // The results close on a click outside the search.
  useEffect(() => {
    if (!listOpen) return;
    const onDown = (e: MouseEvent) => { if (!searchRef.current?.contains(e.target as Node)) setListOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [listOpen]);

  // An invoice created from inside the form becomes the one to return against.
  function onInvoiceCreated() {
    setTick((t) => t + 1);
    const newest = listSources(companyId, returnType)
      .reduce<SourceInvoice | null>((best, s) => (!best || s.data.created_at > best.data.created_at ? s : best), null);
    if (newest) selectSource(newest);
  }

  function updateReturnQty(idx: number, rawValue: string) {
    const parsed = parseFloat(rawValue);
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i !== idx
          ? item
          : { ...item, returnQty: isNaN(parsed) ? 0 : Math.min(Math.max(0, parsed), item.origQty) }
      )
    );
  }

  const totals = useMemo(() => {
    let taxable = 0;
    let gstAmount = 0;
    for (const item of returnItems) {
      if (item.returnQty <= 0) continue;
      const proportion = item.origQty > 0 ? item.returnQty / item.origQty : 0;
      // Prorate the STORED taxable value and tax — qty × rate ignores line discounts/cess.
      taxable += item.origTaxable * proportion;
      gstAmount += item.origTax * proportion;
    }
    return { taxable, gstAmount, total: taxable + gstAmount };
  }, [returnItems]);

  function handleSelectAll() {
    setReturnItems((prev) => prev.map((item) => ({ ...item, returnQty: item.origQty })));
  }

  function handleClearAll() {
    setReturnItems((prev) => prev.map((item) => ({ ...item, returnQty: 0 })));
  }

  async function handleSave() {
    if (!selectedSource) { setError('Find and choose the original invoice first.'); return; }
    const hasItems = returnItems.some((r) => r.returnQty > 0);
    if (!hasItems) { setError('Enter a return quantity for at least one item.'); return; }
    if (!returnDate) { setError('Return date is required.'); return; }

    setSaving(true);
    try {
      let draft;
      if (selectedSource.kind === 'v2') {
        const inputs: ReturnItemInput[] = returnItems.map((r) => ({
          itemIndex: r.itemIndex,
          returnQty: r.returnQty,
        }));
        draft = createReturnFromInvoiceV2(
          selectedSource.data,
          inputs,
          returnDate,
          reason,
          returnType
        );
      } else {
        // V1 purchase invoice — return by taxable amount, prorated from the STORED
        // taxable value (qty × rate would overstate discounted purchases).
        const taxableToReturn = returnItems.reduce((sum, r) => {
          if (r.returnQty <= 0) return sum;
          const proportion = r.origQty > 0 ? r.returnQty / r.origQty : 0;
          return sum + r.origTaxable * proportion;
        }, 0);
        draft = createReturnFromPurchaseInvoiceLegacy(
          selectedSource.data,
          Math.round(taxableToReturn * 100) / 100,
          returnDate,
          reason
        );
      }

      if (initial) {
        // Keep the note's number; replace what it posted (the return voucher
        // carrying that number), then post the edited note afresh.
        const updated = updateInvoiceV2(initial.id, { ...draft, invoice_no: initial.invoice_no });
        if (!updated) throw new Error('This note is no longer in the register.');
        listJournalEntries(companyId)
          .filter((e) => e.voucher_number === initial.invoice_no && RETURN_VOUCHER_TYPES.has(e.voucher_type))
          .forEach((e) => deleteJournalEntry(e.id));
        createReturnJournalEntry(companyId, updated);
      } else {
        const savedInvoice = createInvoiceV2(companyId, draft);
        createReturnJournalEntry(companyId, savedInvoice);
      }
      onSave();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create return.');
    } finally {
      setSaving(false);
    }
  }

  const reasonOptions = returnType === 'SALES' ? CDN_REASON_OPTIONS : PURCHASE_REASON_OPTIONS;
  const noun = returnType === 'SALES' ? 'Sales Return (Credit Note)' : 'Purchase Return (Debit Note)';
  const title = initial ? `Edit ${initial.invoice_no} · ${noun}` : `New ${noun}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="ca-modal-panel flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Original invoice — found by typing; its details show once chosen */}
          <div ref={searchRef} className="relative">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Original Invoice
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-3)]" aria-hidden />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                  setListOpen(true);
                  if (selectedId) { setSelectedId(''); setReturnItems([]); }
                }}
                onFocus={() => { if (!selectedId) setListOpen(true); }}
                onKeyDown={(e) => {
                  if (!listOpen || matches.length === 0) return;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (i + 1) % matches.length); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => (i - 1 + matches.length) % matches.length); }
                  else if (e.key === 'Enter') { e.preventDefault(); selectSource(matches[activeIdx]); }
                  else if (e.key === 'Escape') { e.stopPropagation(); setListOpen(false); }
                }}
                placeholder={returnType === 'SALES' ? 'Invoice number, customer, date or amount…' : 'Invoice number, vendor, date or amount…'}
                aria-label="Find the original invoice"
                role="combobox"
                aria-expanded={listOpen && matches.length > 0}
                aria-autocomplete="list"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {(query || selectedId) && (
                <button type="button" onClick={clearSelection} aria-label="Clear" title="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {listOpen && !selectedId && q && matches.length > 0 && (
              <ul role="listbox" aria-label="Matching invoices" className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--sand)] bg-white p-1 shadow-[var(--shadow-lift)]">
                {matches.map((s, i) => {
                  const d = describeSource(s);
                  return (
                    <li
                      key={s.data.id}
                      role="option"
                      aria-selected={i === activeIdx}
                      onMouseDown={(e) => { e.preventDefault(); selectSource(s); }}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-xs ${i === activeIdx ? 'bg-[var(--navy-soft)] text-[var(--navy-2)]' : 'text-gray-700'}`}
                    >
                      <span className="font-mono font-semibold">{s.data.invoice_no}</span>
                      {d.extra && <span className="font-mono text-gray-500">({d.extra})</span>}
                      <span className="truncate">{d.party}</span>
                      <span className="ml-auto shrink-0 text-gray-500">{s.data.invoice_date}</span>
                      <span className="shrink-0 font-mono font-semibold">₹{inr(d.total)}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {q && !selectedId && matches.length === 0 && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--sand-2)] bg-[var(--cream-2)] px-4 py-3 text-[12px] text-[var(--ink-2)]">
                <span>No {returnType === 'SALES' ? 'sales' : 'purchase'} invoice matches &ldquo;{query.trim()}&rdquo;.</span>
                <button type="button" onClick={() => setWizardOpen(true)} className="btn-pill-primary !h-8 !text-[11px]">
                  <Plus className="h-3.5 w-3.5" /> Create new {returnType === 'SALES' ? 'invoice' : 'purchase'}
                </button>
              </div>
            )}
            {!q && !selectedId && (
              <p className="mt-1 text-[11px] text-gray-400">
                {sourceInvoices.length === 0
                  ? `No ${returnType === 'SALES' ? 'sales invoices' : 'purchase invoices'} yet — type its number and create it from here.`
                  : 'Start typing to find the invoice this return is against.'}
              </p>
            )}
            {initial && !initialSource && (
              <p className="mt-1 text-[11px] text-amber-600">
                The original invoice {initial.original_invoice_no || ''} is no longer in the register — find the invoice this note was issued against.
              </p>
            )}
          </div>

          {/* Selected invoice summary */}
          {selectedSource && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[11px]">
              {selectedSource.kind === 'v2' ? (
                <>
                  <span className="font-semibold text-gray-700">{selectedSource.data.buyer_name}</span>
                  {selectedSource.data.buyer_gstin && (
                    <span className="ml-2 font-mono text-gray-500">{selectedSource.data.buyer_gstin}</span>
                  )}
                  <span className="ml-3 text-gray-500">Supply: {selectedSource.data.supply_type}</span>
                  <span className="ml-3 text-gray-500">GSTR-1: {selectedSource.data.gstr1_table}</span>
                  <span className="ml-3 font-semibold text-gray-800">₹{inr(selectedSource.data.total_amount)}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-gray-700">{selectedSource.data.vendor_name}</span>
                  {selectedSource.data.vendor_gstin && (
                    <span className="ml-2 font-mono text-gray-500">{selectedSource.data.vendor_gstin}</span>
                  )}
                  <span className="ml-3 text-gray-500">Supply: {selectedSource.data.supply_type}</span>
                  <span className="ml-3 font-semibold text-gray-800">₹{inr(selectedSource.data.total)}</span>
                </>
              )}
            </div>
          )}

          {/* Return items table */}
          {returnItems.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Return Items
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-[10px] font-semibold text-blue-600 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-semibold text-gray-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full min-w-[540px] text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Orig Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">GST%</th>
                      <th className="px-3 py-2 text-right">Return Qty</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, i) => {
                      const proportion = item.origQty > 0 ? item.returnQty / item.origQty : 0;
                      const amt = item.origQty * item.rate * proportion;
                      return (
                        <tr key={i} className="border-t border-gray-50">
                          <td className="px-3 py-2 text-gray-500">{item.itemIndex + 1}</td>
                          <td className="max-w-[180px] truncate px-3 py-2 font-medium text-gray-700">
                            {item.description || '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-600">
                            {item.origQty}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-600">
                            {inr(item.rate)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600">{item.gstRate}%</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              max={item.origQty}
                              step="any"
                              value={item.returnQty === 0 ? '' : item.returnQty}
                              placeholder="0"
                              onChange={(e) => updateReturnQty(i, e.target.value)}
                              className="w-20 rounded border border-gray-200 px-2 py-0.5 text-right font-mono text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">
                            {inr(amt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Return details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as CdnReason)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {reasonOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-derived totals */}
          {selectedSource && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Auto-Derived
              </p>
              <div className="flex flex-wrap gap-4 text-[11px]">
                <span>
                  <span className="text-gray-400">Doc Type: </span>
                  <span className="font-semibold text-gray-700">
                    {returnType === 'SALES' ? 'Credit Note' : 'Debit Note'}
                  </span>
                </span>
                {selectedSource.kind === 'v2' && (
                  <span>
                    <span className="text-gray-400">GSTR-1: </span>
                    <span className="font-semibold text-gray-700">
                      {selectedSource.data.buyer_gstin ? 'CDNR' : 'CDNUR'}
                    </span>
                  </span>
                )}
                <span>
                  <span className="text-gray-400">Taxable: </span>
                  <span className="font-mono font-semibold text-gray-800">₹{inr(totals.taxable)}</span>
                </span>
                <span>
                  <span className="text-gray-400">GST: </span>
                  <span className="font-mono font-semibold text-gray-800">₹{inr(totals.gstAmount)}</span>
                </span>
                <span>
                  <span className="text-gray-400">Total Return: </span>
                  <span className="font-mono text-base font-bold text-gray-900">₹{inr(totals.total)}</span>
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedId}
            className="h-9 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Update' : returnType === 'SALES' ? 'Create Credit Note' : 'Create Debit Note'}
          </button>
        </div>
      </div>

      {wizardOpen && (
        <DocumentWizard
          mode={returnType === 'SALES' ? 'sales_invoice' : 'purchase_invoice'}
          companyId={companyId}
          sellerStateCode={sellerStateCode || undefined}
          onClose={() => setWizardOpen(false)}
          onSave={onInvoiceCreated}
        />
      )}
    </div>
  );
}
