import type { InvoiceV2Draft, LineItem } from '@/lib/accounting/gstInvoices';
import { GST_RATES, UQC_OPTIONS, isCessApplicable, getCessInfo } from '@/lib/accounting/gstInvoices';

interface LineItemsSectionProps {
  invoice: InvoiceV2Draft;
  updateItem: (index: number, updates: Partial<LineItem>) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
}

function inr(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LineItemsSection({ invoice, updateItem, addItem, removeItem }: LineItemsSectionProps) {
  return (
    <section className="dw-section">
      <div className="shead"><h2 className="dw-h">Line items</h2></div>
      <div className="tw">
        <table className="lines" style={{ minWidth: 920 }}>
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th style={{ minWidth: 220 }}>Description *</th>
              <th style={{ width: 100 }}>HSN *</th>
              <th style={{ width: 84 }}>UQC</th>
              <th className="r" style={{ width: 76 }}>Qty</th>
              <th className="r" style={{ width: 104 }}>Rate</th>
              <th className="r" style={{ width: 76 }}>Disc %</th>
              <th style={{ width: 108 }}>Nature</th>
              <th style={{ width: 92 }}>GST %</th>
              <th className="r" style={{ width: 100 }}>Tax</th>
              <th className="r" style={{ width: 110 }}>Total</th>
              <th style={{ width: 34 }}></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const tax = item.cgst + item.sgst + item.igst + item.cess;
              return (
                <tr key={idx}>
                  <td className="idx">{idx + 1}</td>
                  <td>
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="mono"
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
                      placeholder="HSN"
                    />
                  </td>
                  <td>
                    {/* SAC (99xxxx) has no unit — pipeline forces uqc NA / qty 0; mirror that here (display-only). */}
                    {/^99/.test((item.hsn || '').replace(/\D/g, '')) ? (
                      <select value="NA" disabled title="Services (SAC 99xxxx) carry no unit of measure">
                        <option value="NA">NA</option>
                      </select>
                    ) : (
                      <select
                        value={item.uqc || 'NOS'}
                        onChange={(e) => updateItem(idx, { uqc: e.target.value })}
                      >
                        {UQC_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      className="num"
                      value={item.qty || ''}
                      onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })}
                      min={0}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="num"
                      value={item.rate || ''}
                      onChange={(e) => updateItem(idx, { rate: Number(e.target.value) || 0 })}
                      min={0}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="num"
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
                  </td>
                  <td>
                    {/* supply_nature — default TAXABLE (= current). Non-taxable natures feed the NIL table. */}
                    <select
                      value={item.supply_nature}
                      onChange={(e) => updateItem(idx, { supply_nature: e.target.value as LineItem['supply_nature'] })}
                    >
                      <option value="TAXABLE">Taxable</option>
                      <option value="NIL_RATED">Nil-rated</option>
                      <option value="EXEMPT">Exempt</option>
                      <option value="NON_GST">Non-GST</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={item.gst_rate}
                      onChange={(e) => updateItem(idx, { gst_rate: Number(e.target.value) })}
                      disabled={invoice.doc_type === 'BILL_OF_SUPPLY' || item.supply_nature !== 'TAXABLE'}
                    >
                      {GST_RATES.map((r) => (
                        <option key={r} value={r}>{r}%</option>
                      ))}
                    </select>
                  </td>
                  <td className="calc">{inr(tax)}</td>
                  <td className="calc strong">{inr(item.line_total)}</td>
                  <td className="c">
                    {invoice.items.length > 1 && (
                      <button
                        type="button"
                        className="x"
                        onClick={() => removeItem(idx)}
                        title="Remove item"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className="addln" onClick={addItem}>+ Add item</button>
    </section>
  );
}
