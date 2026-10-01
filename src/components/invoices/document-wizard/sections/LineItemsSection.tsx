/* Sales item rows. Every cell writes through the existing updateItem / addItem /
   removeItem handlers and the existing recalculation effect computes the taxable
   value, tax and line total — nothing here calculates money. "GST applicable"
   maps onto the existing supply_nature: on = TAXABLE; off = Exempt / Nil-rated /
   Non-GST (the same three the previous "Nature" column offered). */
import { Trash2 } from 'lucide-react';
import type { InvoiceV2Draft, LineItem } from '@/lib/accounting/gstInvoices';
import { GST_RATES, UQC_OPTIONS, isCessApplicable, getCessInfo, createEmptyLineItem } from '@/lib/accounting/gstInvoices';
import { Switch, inr } from '../ui';

interface LineItemsSectionProps {
  invoice: InvoiceV2Draft;
  updateItem: (index: number, updates: Partial<LineItem>) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
}

const NON_TAXABLE: Array<{ v: LineItem['supply_nature']; label: string }> = [
  { v: 'EXEMPT', label: 'Exempt' },
  { v: 'NIL_RATED', label: 'Nil-rated' },
  { v: 'NON_GST', label: 'Non-GST' },
];

export function LineItemsSection({ invoice, updateItem, removeItem }: LineItemsSectionProps) {
  const bos = invoice.doc_type === 'BILL_OF_SUPPLY';
  return (
    <div className="yk-lines" data-testid="sales-items">
      <div className="yk-lines-scroll">
        <div className="yk-lines-grid sales" role="table" aria-label="Items">
          <div className="yk-lines-head" role="row">
            <span role="columnheader" className="c">#</span>
            <span role="columnheader">Item / service</span>
            <span role="columnheader">HSN / SAC</span>
            <span role="columnheader">Unit</span>
            <span role="columnheader" className="r">Qty</span>
            <span role="columnheader" className="r">Rate</span>
            <span role="columnheader" className="r">Disc %</span>
            <span role="columnheader">GST</span>
            <span role="columnheader" className="r">Taxable</span>
            <span role="columnheader" className="r">Tax</span>
            <span role="columnheader" className="r">Total</span>
            <span role="columnheader" aria-label="Remove" />
          </div>
          {invoice.items.map((item, idx) => {
            const tax = item.cgst + item.sgst + item.igst + item.cess;
            const isSac = /^99/.test((item.hsn || '').replace(/\D/g, ''));
            const taxable = item.supply_nature === 'TAXABLE';
            return (
              <div className="yk-lines-row" role="row" key={idx} data-testid={`sales-item-${idx}`}>
                <span className="yk-cell c idx">{idx + 1}</span>
                <input
                  aria-label={`Item ${idx + 1} name`}
                  className="yk-in sm"
                  value={item.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                />
                <input
                  aria-label={`Item ${idx + 1} HSN or SAC`}
                  className="yk-in sm mono"
                  value={item.hsn}
                  onChange={(e) => {
                    const hsn = e.target.value;
                    const updates: Partial<LineItem> = { hsn };
                    if (isCessApplicable(hsn)) {
                      const cess = getCessInfo(hsn);
                      if (cess) {
                        updates.cess_rate = cess.cessRate;
                        updates.cess_specific_rate = cess.specificPerTon || 0;
                      }
                    } else {
                      updates.cess_rate = 0;
                      updates.cess_specific_rate = 0;
                    }
                    updateItem(idx, updates);
                  }}
                />
                {/* SAC (99xxxx) has no unit — the pipeline forces NA / qty 0; mirrored here (display only). */}
                {isSac ? (
                  <select aria-label={`Item ${idx + 1} unit`} className="yk-in sm" value="NA" disabled title="Services (SAC 99xxxx) carry no unit of measure">
                    <option value="NA">NA</option>
                  </select>
                ) : (
                  <select
                    aria-label={`Item ${idx + 1} unit`}
                    className="yk-in sm"
                    value={item.uqc || 'NOS'}
                    onChange={(e) => updateItem(idx, { uqc: e.target.value })}
                  >
                    {UQC_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                )}
                <input
                  aria-label={`Item ${idx + 1} quantity`}
                  type="number"
                  className="yk-in sm num"
                  value={item.qty || ''}
                  onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })}
                  min={0}
                />
                <input
                  aria-label={`Item ${idx + 1} rate`}
                  type="number"
                  className="yk-in sm num"
                  value={item.rate || ''}
                  onChange={(e) => updateItem(idx, { rate: Number(e.target.value) || 0 })}
                  min={0}
                />
                <input
                  aria-label={`Item ${idx + 1} discount percent`}
                  type="number"
                  className="yk-in sm num"
                  value={item.qty * item.rate > 0
                    ? Math.round((item.discount / (item.qty * item.rate)) * 10000) / 100 || ''
                    : ''}
                  onChange={(e) => {
                    const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                    updateItem(idx, { discount: Math.round(item.qty * item.rate * pct) / 100 });
                  }}
                  min={0}
                  max={100}
                  step={0.01}
                />
                <div className="yk-gstcell">
                  <Switch
                    checked={taxable}
                    disabled={bos}
                    onChange={(v) => updateItem(idx, { supply_nature: v ? 'TAXABLE' : 'EXEMPT' })}
                    label={`GST applicable on item ${idx + 1}`}
                    testId={`sales-gst-applicable-${idx}`}
                  />
                  {taxable ? (
                    <select
                      aria-label={`Item ${idx + 1} GST rate`}
                      className="yk-in sm"
                      value={item.gst_rate}
                      onChange={(e) => updateItem(idx, { gst_rate: Number(e.target.value) })}
                      disabled={bos}
                    >
                      {GST_RATES.map((r) => (
                        <option key={r} value={r}>{r}%</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      aria-label={`Item ${idx + 1} supply without GST`}
                      className="yk-in sm"
                      value={item.supply_nature}
                      disabled={bos}
                      onChange={(e) => updateItem(idx, { supply_nature: e.target.value as LineItem['supply_nature'] })}
                    >
                      {NON_TAXABLE.map((n) => <option key={n.v} value={n.v}>{n.label}</option>)}
                      {!NON_TAXABLE.some((n) => n.v === item.supply_nature) && (
                        <option value={item.supply_nature}>{String(item.supply_nature).replace(/_/g, ' ').toLowerCase()}</option>
                      )}
                    </select>
                  )}
                </div>
                <span className="yk-cell num">{inr(item.taxable_value)}</span>
                <span className="yk-cell num muted">{inr(tax)}</span>
                <span className="yk-cell num strong">{inr(item.line_total)}</span>
                <span className="yk-cell c">
                  {/* Deleting the only row leaves one empty row (reset through the same updateItem). */}
                  <button
                    type="button"
                    className="yk-icon-btn danger"
                    onClick={() => (invoice.items.length > 1 ? removeItem(idx) : updateItem(idx, createEmptyLineItem(1)))}
                    title="Remove item"
                    aria-label={`Remove item ${idx + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
