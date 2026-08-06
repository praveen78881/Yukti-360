import { useState } from 'react';
import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import { STATE_CODES, getSupplyCategory, applySupplyCategory, type SupplyCategory } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from '../useDocumentState';

interface SalesOptionsProps {
  kind: 'sales';
  invoice: InvoiceV2Draft;
  updateInvoice: (u: Partial<InvoiceV2Draft>) => void;
  sellerStateCode?: string;
  mode: DocumentMode;
}

interface PurchaseOptionsProps {
  kind: 'purchase';
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  mode: DocumentMode;
}

type OptionsSectionProps = SalesOptionsProps | PurchaseOptionsProps;

export function OptionsSection(props: OptionsSectionProps) {
  if (props.kind === 'sales') {
    const { invoice, updateInvoice, sellerStateCode } = props;
    const [isExport, setIsExport] = useState(() => invoice.buyer_type === 'OVERSEAS');
    const isIgst = invoice.supply_type === 'inter';
    // Additive: supply-category (invoice-type) picker for registered/business supplies.
    // Default reflects the current draft (Regular for a normal B2B) — changing it is opt-in.
    const supplyCat = getSupplyCategory(invoice);
    const showSupplyCat = !isExport && !!invoice.buyer_gstin?.trim();
    const isSez = supplyCat === 'SEZ_WP' || supplyCat === 'SEZ_WOP';

    return (
      <section className="dw-section">
        <div className="shead"><h2 className="dw-h">Options</h2></div>
        <div className="opts" style={{ gap: 28 }}>
          <label>
            <input
              type="checkbox"
              checked={invoice.reverse_charge}
              onChange={(e) => updateInvoice({ reverse_charge: e.target.checked })}
            />
            RCM
          </label>
          <label>
            <input
              type="checkbox"
              checked={isExport}
              onChange={(e) => {
                setIsExport(e.target.checked);
                if (e.target.checked) {
                  updateInvoice({
                    buyer_type: 'OVERSEAS',
                    export_type: invoice.export_type || 'WOPAY',
                    place_of_supply: '96',
                    supply_type: 'inter',
                    is_intra_state: false,
                    force_igst: true,
                  });
                } else {
                  updateInvoice({
                    buyer_type: 'CONSUMER',
                    export_type: undefined,
                    place_of_supply: sellerStateCode || '',
                    buyer_state_code: sellerStateCode || '',
                    buyer_state: sellerStateCode ? STATE_CODES[sellerStateCode] || '' : '',
                    force_igst: false,
                  });
                }
              }}
            />
            Export
          </label>
          {showSupplyCat && (
            <div className="opts" style={{ gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey)' }}>Invoice type</span>
              <select
                value={supplyCat}
                onChange={(e) => updateInvoice(applySupplyCategory(e.target.value as SupplyCategory))}
              >
                <option value="REGULAR_B2B">Regular</option>
                <option value="SEZ_WP">SEZ — with payment (SEWP)</option>
                <option value="SEZ_WOP">SEZ — without payment (SEWOP)</option>
                <option value="DEEMED_EXPORT">Deemed Export (DE)</option>
              </select>
            </div>
          )}
          <div className="opts" style={{ gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey)' }}>Tax</span>
            <div className="seg">
              <button
                type="button"
                disabled={isExport}
                className={isIgst ? 'on' : ''}
                onClick={() => updateInvoice({ force_igst: true, supply_type: 'inter', is_intra_state: false })}
              >
                IGST
              </button>
              <button
                type="button"
                disabled={isExport}
                className={!isIgst ? 'on' : ''}
                onClick={() => updateInvoice({ force_igst: false, supply_type: 'intra', is_intra_state: true })}
              >
                CGST + SGST
              </button>
            </div>
            {!invoice.force_igst && <span className="hint">auto</span>}
          </div>
        </div>

        {showSupplyCat && isSez && (
          <div className="row" style={{ marginTop: 8 }}>
            <div className="f c12">
              <span className="hint" style={{ color: 'var(--amber, #b45309)' }} title="SEZ supplies are treated as inter-state (IGST). Confirm the recipient is an SEZ unit/developer.">
                ⚠ SEZ supply — treated as inter-state (IGST); verify the SEZ recipient before filing.
              </span>
            </div>
          </div>
        )}

        {/* E-commerce operator — drives GSTR-1 Table 14/15 (SUPECO) auto-population */}
        <div className="row" style={{ marginTop: 14 }}>
          <div className="f c3">
            <label className="opts" style={{ minHeight: 32 }}>
              <input
                type="checkbox"
                checked={!!invoice.ecom_supply}
                onChange={(e) => updateInvoice(e.target.checked
                  ? { ecom_supply: true }
                  : { ecom_supply: false, ecom_gstin: undefined, ecom_9_5: false })}
              />
              Supplied through e-commerce operator
            </label>
          </div>
          {invoice.ecom_supply && (
            <>
              <div className="f c3">
                <label>ECO GSTIN (etin) <b>*</b></label>
                <input
                  value={invoice.ecom_gstin || ''}
                  onChange={(e) => updateInvoice({ ecom_gstin: e.target.value.toUpperCase() })}
                  placeholder="27AAGCM1234P1Z7"
                />
              </div>
              <div className="f c3">
                <label>&nbsp;</label>
                <label className="opts" style={{ minHeight: 32 }} title="ECO is liable to pay tax (restaurants, cabs, housekeeping). Routes to Table 15.">
                  <input
                    type="checkbox"
                    checked={!!invoice.ecom_9_5}
                    onChange={(e) => updateInvoice({ ecom_9_5: e.target.checked })}
                  />
                  U/s 9(5) — ECO pays tax
                </label>
              </div>
            </>
          )}
        </div>

        {isExport && (
          <div className="row" style={{ marginTop: 14 }}>
            <div className="f c3">
              <label>Payment type</label>
              <select
                value={invoice.export_type || 'WOPAY'}
                onChange={(e) => updateInvoice({ export_type: e.target.value as 'WPAY' | 'WOPAY' })}
              >
                <option value="WPAY">With Payment (IGST)</option>
                <option value="WOPAY">Without Payment (LUT/Bond)</option>
              </select>
            </div>
            <div className="f c3">
              <label>Port code</label>
              <input
                value={invoice.port_code || ''}
                onChange={(e) => updateInvoice({ port_code: e.target.value })}
                placeholder="e.g. INBOM4"
              />
            </div>
            <div className="f c3">
              <label>Shipping bill no.</label>
              <input
                value={invoice.shipping_bill_no || ''}
                onChange={(e) => updateInvoice({ shipping_bill_no: e.target.value })}
              />
            </div>
            <div className="f c3">
              <label>Shipping bill date</label>
              <input
                type="date"
                value={invoice.shipping_bill_date || ''}
                onChange={(e) => updateInvoice({ shipping_bill_date: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>
    );
  }

  // Purchase options
  const { fields, updateField, mode } = props;
  const isImport = fields.bucket === 'IMPG' || fields.bucket === 'IMPG_SEZ';

  return (
    <section className="dw-section">
      <div className="shead"><h2 className="dw-h">Options</h2></div>
      <div className="opts" style={{ gap: 28 }}>
        {mode === 'purchase_invoice' && (
          <>
            <label>
              <input type="checkbox" checked={fields.itcEligible} onChange={(e) => updateField('itcEligible', e.target.checked)} />
              ITC Eligible
            </label>
            {['B2B', 'URD', 'IMPS'].includes(fields.bucket) && (
              <label>
                <input type="checkbox" checked={fields.rcmApplicable} onChange={(e) => updateField('rcmApplicable', e.target.checked)} />
                RCM
              </label>
            )}
          </>
        )}
        <div className="opts" style={{ gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey)' }}>Tax</span>
          <div className="seg">
            <button
              type="button"
              className={fields.supplyType === 'inter' ? 'on' : ''}
              onClick={() => updateField('supplyType', 'inter')}
            >
              IGST
            </button>
            <button
              type="button"
              className={fields.supplyType === 'intra' ? 'on' : ''}
              onClick={() => updateField('supplyType', 'intra')}
            >
              CGST + SGST
            </button>
          </div>
        </div>
        <button type="button" className="toggle" onClick={() => updateField('showAdvanced', !fields.showAdvanced)}>
          Advanced {fields.showAdvanced ? '▾' : '▸'}
        </button>
      </div>

      {fields.showAdvanced && (
        <div className="row" style={{ marginTop: 14 }}>
          {mode === 'purchase_invoice' && (
            <>
              <div className="f c4">
                <label>ITC Status</label>
                <select value={fields.itcStatus} onChange={(e) => updateField('itcStatus', e.target.value)}>
                  <option value="ELIGIBLE_FULL">Full</option>
                  <option value="ELIGIBLE_PARTIAL">Partial</option>
                  <option value="BLOCKED_17_5">Blocked 17(5)</option>
                  <option value="INELIGIBLE_EXEMPT">Exempt</option>
                  <option value="INELIGIBLE_PERSONAL">Personal</option>
                  <option value="INELIGIBLE_NO_DOC">No Doc</option>
                  <option value="PENDING_2B">Pending 2B</option>
                  <option value="REVERSED_42">Rule 42</option>
                  <option value="REVERSED_43">Rule 43</option>
                </select>
              </div>
              <div className="f c4">
                <label>&nbsp;</label>
                <label className="opts" style={{ minHeight: 32 }}>
                  <input type="checkbox" checked={fields.capitalGoods} onChange={(e) => updateField('capitalGoods', e.target.checked)} />
                  Capital Goods
                </label>
              </div>
            </>
          )}

          {isImport && (
            <>
              <div className="f c4">
                <label>Bill of Entry No <b>*</b></label>
                <input value={fields.billOfEntryNo} onChange={(e) => updateField('billOfEntryNo', e.target.value)} />
              </div>
              <div className="f c4">
                <label>Bill of Entry Date <b>*</b></label>
                <input type="date" value={fields.billOfEntryDate} onChange={(e) => updateField('billOfEntryDate', e.target.value)} />
              </div>
              <div className="f c4">
                <label>Port Code</label>
                <input value={fields.portCode} onChange={(e) => updateField('portCode', e.target.value)} placeholder="INBOM4" />
              </div>
            </>
          )}

          <div className="f c12">
            <label>Narration</label>
            <input value={fields.narration} onChange={(e) => updateField('narration', e.target.value)} />
          </div>
        </div>
      )}
    </section>
  );
}
