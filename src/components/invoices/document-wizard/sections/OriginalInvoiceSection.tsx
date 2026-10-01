import { useMemo, useState } from 'react';
import type { DocumentMode } from '../types';
import type { InvoiceV2, PurchaseInvoice, InvoiceV2Draft, CdnReason } from '@/lib/accounting/gstInvoices';
import { CDN_REASON_OPTIONS, PURCHASE_RETURN_REASONS } from '../config';
import type { PurchaseFields } from '../useDocumentState';

interface SalesOrigProps {
  kind: 'sales';
  invoice: InvoiceV2Draft;
  updateInvoice: (u: Partial<InvoiceV2Draft>) => void;
  existingInvoices: InvoiceV2[];
  selectOriginalInvoice: (inv: InvoiceV2) => void;
  mode: DocumentMode;
  invalidFields?: string[];
}

interface PurchaseOrigProps {
  kind: 'purchase';
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  existingPurchases: PurchaseInvoice[];
  selectOriginalPurchase: (inv: PurchaseInvoice) => void;
  mode: DocumentMode;
  invalidFields?: string[];
}

type OriginalInvoiceSectionProps = SalesOrigProps | PurchaseOrigProps;

const menuCls =
  'absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg';
const menuBtnCls = 'flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-gray-50';

export function OriginalInvoiceSection(props: OriginalInvoiceSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [otherReason, setOtherReason] = useState('');

  // Hooks run unconditionally (Rules of Hooks): one memo per document kind, each
  // an empty list when its kind is not the one on screen. The results are exactly
  // what the per-branch memos produced before.
  const salesList = props.kind === 'sales' ? props.existingInvoices : null;
  const purchaseList = props.kind === 'purchase' ? props.existingPurchases : null;
  const filteredSales = useMemo<InvoiceV2[]>(() => {
    if (!salesList) return [];
    if (!searchTerm.trim()) return salesList.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return salesList.filter((inv) => inv.invoice_no.toLowerCase().includes(term) || inv.buyer_name.toLowerCase().includes(term)).slice(0, 10);
  }, [salesList, searchTerm]);
  const filteredPurchases = useMemo<PurchaseInvoice[]>(() => {
    if (!purchaseList) return [];
    if (!searchTerm.trim()) return purchaseList.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return purchaseList.filter((inv) => inv.invoice_no.toLowerCase().includes(term) || inv.vendor_name.toLowerCase().includes(term)).slice(0, 10);
  }, [purchaseList, searchTerm]);

  if (props.kind === 'sales') {
    const { invoice, updateInvoice, selectOriginalInvoice, invalidFields } = props;

    const filtered = filteredSales;

    const cdnReason = invoice.cdn_reason || 'SALES_RETURN';
    const invalidNo = invalidFields?.includes('original_invoice_no');
    const invalidDate = invalidFields?.includes('original_invoice_date');

    return (
      <section className="dw-section">
        <div className="shead"><h2 className="dw-h">Original Invoice</h2></div>
        <div className="row">
          <div className={`f c4${invalidNo ? ' err' : ''}`} style={{ position: 'relative' }}>
            <label>Original inv no. <b>*</b></label>
            <input
              value={invoice.original_invoice_no || ''}
              onChange={(e) => {
                updateInvoice({ original_invoice_no: e.target.value });
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              placeholder="Search or type invoice no..."
            />
            <span className="msg">Original invoice number is required</span>
            {isOpen && filtered.length > 0 && (
              <div className={menuCls}>
                {filtered.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { selectOriginalInvoice(inv); setSearchTerm(''); setIsOpen(false); }}
                    className={menuBtnCls}
                  >
                    <span className="mono" style={{ fontWeight: 600 }}>{inv.invoice_no}</span>
                    <span style={{ color: 'var(--grey)' }}>{inv.buyer_name} | {inv.invoice_date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={`f c4${invalidDate ? ' err' : ''}`}>
            <label>Original inv date <b>*</b></label>
            <input
              type="date"
              value={invoice.original_invoice_date || ''}
              onChange={(e) => updateInvoice({ original_invoice_date: e.target.value })}
            />
            <span className="msg">Original invoice date is required</span>
          </div>
          <div className="f c4">
            <label>Reason</label>
            <select value={cdnReason} onChange={(e) => updateInvoice({ cdn_reason: e.target.value as CdnReason })}>
              {CDN_REASON_OPTIONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </div>
        </div>
        {cdnReason === 'OTHER' && (
          <textarea
            value={invoice.notes || ''}
            onChange={(e) => updateInvoice({ notes: e.target.value })}
            placeholder="Describe the reason..."
            style={{ marginTop: 10 }}
            rows={2}
          />
        )}
      </section>
    );
  }

  // Purchase returns
  const { fields, updateField, selectOriginalPurchase, invalidFields } = props;

  const filtered = filteredPurchases;

  const invalidNo = invalidFields?.includes('origInvNo');
  const invalidDate = invalidFields?.includes('origInvDate');

  return (
    <section className="dw-section">
      <div className="shead"><h2 className="dw-h">Original Invoice</h2></div>
      <div className="row">
        <div className={`f c4${invalidNo ? ' err' : ''}`} style={{ position: 'relative' }}>
          <label>Original inv no. <b>*</b></label>
          <input
            value={fields.origInvNo}
            onChange={(e) => {
              updateField('origInvNo', e.target.value);
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder="Search or type invoice no..."
          />
          <span className="msg">Original invoice number is required</span>
          {isOpen && filtered.length > 0 && (
            <div className={menuCls}>
              {filtered.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { selectOriginalPurchase(inv); setSearchTerm(''); setIsOpen(false); }}
                  className={menuBtnCls}
                >
                  <span className="mono" style={{ fontWeight: 600 }}>{inv.invoice_no}</span>
                  <span style={{ color: 'var(--grey)' }}>{inv.vendor_name} | {inv.invoice_date}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={`f c4${invalidDate ? ' err' : ''}`}>
          <label>Original inv date <b>*</b></label>
          <input
            type="date"
            value={fields.origInvDate}
            onChange={(e) => updateField('origInvDate', e.target.value)}
          />
          <span className="msg">Original invoice date is required</span>
        </div>
        <div className="f c4">
          <label>Reason</label>
          <select value={fields.returnReason} onChange={(e) => updateField('returnReason', e.target.value)}>
            {PURCHASE_RETURN_REASONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
        </div>
      </div>
      {fields.returnReason === 'OTHER' && (
        <textarea
          value={otherReason}
          onChange={(e) => { setOtherReason(e.target.value); updateField('narration', e.target.value); }}
          placeholder="Describe the reason..."
          style={{ marginTop: 10 }}
          rows={2}
        />
      )}
    </section>
  );
}
