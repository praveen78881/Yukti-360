/* Purchase item row. The purchase model holds ONE item (item_description / hsn /
   qty / rate + taxable value), so there is one row — every handler below is the
   same one the previous screen used. "GST applicable" maps onto the existing
   bucket: on = B2B, off = EXEMPT_NIL (the bucket's own effect sets the rate). */
import { GST_RATES } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from '../useDocumentState';
import type { DocumentMode, PurchaseTotals } from '../types';
import { Trash2 } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { Switch, inr } from '../ui';
import { HsnField } from './HsnField';
import { useStockItems, purchaseUpdatesFromMaster } from '../useStockItems';

interface PurchaseItemSectionProps {
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  mode: DocumentMode;
  invalidFields?: string[];
  totals?: PurchaseTotals;
}

export function PurchaseItemSection({ fields, updateField, mode, invalidFields, totals }: PurchaseItemSectionProps) {
  const { companyId } = useCompany();
  const { names, byName } = useStockItems(companyId);
  const gross = (Number(fields.itemQty || 0) * Number(fields.itemRate || 0));
  const discountPct = Number(fields.itemDiscount || 0);
  const discountAmt = Math.round(gross * discountPct) / 100;
  const showGross = Number(fields.itemQty || 0) > 0 && Number(fields.itemRate || 0) > 0;
  const taxableInvalid = invalidFields?.includes('taxable');

  const isReturn = mode === 'purchase_return';
  const registered = fields.bucket !== 'URD';
  const gstApplicable = fields.bucket !== 'EXEMPT_NIL';
  const showGst = registered;
  const rateOptions = GST_RATES.map(String).includes(String(Number(fields.gstRate)))
    ? GST_RATES
    : [...GST_RATES, Number(fields.gstRate) || 0].sort((a, b) => a - b);
  const tax = totals ? totals.cgst + totals.sgst + totals.igst : 0;
  // The model holds one item, so deleting it resets the row to a fresh form's defaults.
  const clearItem = () => {
    updateField('itemDescription', '');
    updateField('itemHsn', '');
    updateField('itemQty', '1');
    updateField('itemRate', '0');
    updateField('itemDiscount', '0');
    updateField('taxable', '0');
  };

  return (
    <div className="yk-lines" data-testid="purchase-items">
      <datalist id="yk-stock-items-purchase">
        {names.map((n) => <option key={n} value={n} />)}
      </datalist>
      <div className="yk-lines-scroll">
      <div className={`yk-lines-grid purchase ${showGst ? 'with-gst' : ''}`} role="table" aria-label="Item">
        <div className="yk-lines-head" role="row">
          <span role="columnheader">Item / service</span>
          <span role="columnheader">HSN / SAC</span>
          <span role="columnheader" className="r">Qty</span>
          <span role="columnheader" className="r">Rate</span>
          <span role="columnheader" className="r">Disc %</span>
          <span role="columnheader" className="r">Taxable</span>
          {showGst && <span role="columnheader">GST</span>}
          {showGst && <span role="columnheader" className="r">Tax</span>}
          <span role="columnheader" className="r">Total</span>
          <span role="columnheader" aria-label="Remove" />
        </div>
        <div className="yk-lines-row" role="row">
          <input
            aria-label="Item or service name"
            className="yk-in sm"
            list="yk-stock-items-purchase"
            value={fields.itemDescription}
            onChange={(e) => {
              const v = e.target.value;
              const master = byName.get(v.trim().toLowerCase());
              if (master) {
                const u = purchaseUpdatesFromMaster(master);
                updateField('itemDescription', u.itemDescription ?? v);
                if (u.itemHsn) updateField('itemHsn', u.itemHsn);
                if (u.gstRate) updateField('gstRate', u.gstRate);
              } else {
                updateField('itemDescription', v);
              }
            }}
          />
          <HsnField
            ariaLabel="HSN or SAC"
            value={fields.itemHsn}
            description={fields.itemDescription}
            onSuggestDescription={(description) => updateField('itemDescription', description)}
            onChange={(hsn) => updateField('itemHsn', hsn)}
            invalid={invalidFields?.includes('itemHsn')}
          />
          <input aria-label="Quantity" type="number" className="yk-in sm num" value={fields.itemQty} onChange={(e) => updateField('itemQty', e.target.value)} min={0} />
          <input aria-label="Rate" type="number" className="yk-in sm num" value={Number(fields.itemRate) === 0 ? '' : fields.itemRate} onChange={(e) => updateField('itemRate', e.target.value)} min={0} />
          <input
            aria-label="Discount percent"
            type="number"
            className="yk-in sm num"
            value={Number(fields.itemDiscount) === 0 ? '' : fields.itemDiscount}
            onChange={(e) => {
              const pct = e.target.value;
              updateField('itemDiscount', pct);
              if (gross > 0) {
                const amt = Math.round(gross * (Number(pct) || 0)) / 100;
                updateField('taxable', String(Math.max(0, gross - amt)));
              }
            }}
            min={0}
            max={100}
            step={0.01}
          />
          <input
            aria-label="Taxable value"
            aria-invalid={taxableInvalid || undefined}
            type="number"
            className={`yk-in sm num strong ${taxableInvalid ? 'bad' : ''}`}
            value={Number(fields.taxable) === 0 ? '' : fields.taxable}
            onChange={(e) => updateField('taxable', e.target.value)}
          />
          {showGst && (
            <div className="yk-gstcell">
              {!isReturn && (
                <Switch
                  checked={gstApplicable}
                  onChange={(v) => updateField('bucket', v ? 'B2B' : 'EXEMPT_NIL')}
                  label="GST applicable on this item"
                  testId="purchase-gst-applicable"
                />
              )}
              {gstApplicable ? (
                <select aria-label="GST rate" className="yk-in sm" value={String(Number(fields.gstRate) || 0)} onChange={(e) => updateField('gstRate', e.target.value)}>
                  {rateOptions.map((r) => <option key={r} value={String(r)}>{r}%</option>)}
                </select>
              ) : (
                <span className="yk-pill muted">No GST</span>
              )}
            </div>
          )}
          {showGst && <span className="yk-cell num">{inr(tax)}</span>}
          <span className="yk-cell num strong">{inr(totals ? totals.total : Number(fields.taxable || 0))}</span>
          <span className="yk-cell c">
            <button type="button" className="yk-icon-btn danger" onClick={clearItem} title="Remove item" aria-label="Remove item">
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        </div>
      </div>
      </div>
      {showGross && discountPct > 0 && (
        <p className="yk-hint mt-2">Gross ₹{inr(gross)} − discount ₹{inr(discountAmt)} = taxable ₹{inr(Math.max(0, gross - discountAmt))}</p>
      )}
      {taxableInvalid && <p className="yk-err mt-2" role="alert">Taxable value must be more than 0</p>}
    </div>
  );
}
