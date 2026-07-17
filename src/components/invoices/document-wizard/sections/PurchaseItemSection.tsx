import type { PurchaseFields } from '../useDocumentState';
import type { DocumentMode } from '../types';
import { PURCHASE_BUCKETS } from '../config';

interface PurchaseItemSectionProps {
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  mode: DocumentMode;
  invalidFields?: string[];
}

export function PurchaseItemSection({ fields, updateField, mode, invalidFields }: PurchaseItemSectionProps) {
  const gross = (Number(fields.itemQty || 0) * Number(fields.itemRate || 0));
  const discountPct = Number(fields.itemDiscount || 0);
  const discountAmt = Math.round(gross * discountPct) / 100;
  const showGross = Number(fields.itemQty || 0) > 0 && Number(fields.itemRate || 0) > 0;
  const taxableInvalid = invalidFields?.includes('taxable');

  return (
    <section className="dw-section">
      <div className="shead"><h2 className="dw-h">Item &amp; tax</h2></div>
      <div className="row">
        {mode === 'purchase_invoice' && (
          <div className="f c3">
            <label>Bucket</label>
            <select value={fields.bucket} onChange={(e) => updateField('bucket', e.target.value as any)}>
              {PURCHASE_BUCKETS.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
            </select>
          </div>
        )}
        <div className={`f ${mode === 'purchase_invoice' ? 'c6' : 'c9'}`}>
          <label>Description</label>
          <input value={fields.itemDescription} onChange={(e) => updateField('itemDescription', e.target.value)} placeholder="e.g. Steel Rod 10mm" />
        </div>
        <div className="f c3">
          <label>HSN / SAC</label>
          <input className="mono" value={fields.itemHsn} onChange={(e) => updateField('itemHsn', e.target.value)} placeholder="7207" />
        </div>
        <div className="f c3">
          <label>Qty</label>
          <input type="number" className="num" value={fields.itemQty} onChange={(e) => updateField('itemQty', e.target.value)} min={0} />
        </div>
        <div className="f c3">
          <label>Rate</label>
          <input type="number" className="num" value={fields.itemRate} onChange={(e) => updateField('itemRate', e.target.value)} min={0} />
        </div>
        <div className="f c3">
          <label>Discount %</label>
          <input
            type="number"
            className="num"
            value={fields.itemDiscount}
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
            placeholder="0"
          />
        </div>
        <div className={`f c3${taxableInvalid ? ' err' : ''}`}>
          <label>
            Taxable value <b>*</b>
            {showGross && discountPct > 0 && (
              <span className="hint" style={{ display: 'inline', marginLeft: 4 }}>
                (₹{gross.toLocaleString('en-IN')} − ₹{discountAmt.toLocaleString('en-IN')})
              </span>
            )}
          </label>
          <input
            type="number"
            className="num"
            value={fields.taxable}
            onChange={(e) => updateField('taxable', e.target.value)}
          />
          <span className="msg">Taxable value must be &gt; 0</span>
        </div>
        <div className="f c3">
          <label>GST %</label>
          <input type="number" className="num" value={fields.gstRate} onChange={(e) => updateField('gstRate', e.target.value)} min={0} />
        </div>
      </div>
    </section>
  );
}
