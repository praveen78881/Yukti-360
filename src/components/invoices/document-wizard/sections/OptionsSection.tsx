/* "GST details" — the same options and handlers as before, laid out as switches
   and segmented controls. Nothing here computes tax; each control writes the same
   field the previous screen wrote. */
import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import { STATE_CODES, getSupplyCategory, applySupplyCategory, type SupplyCategory } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from '../useDocumentState';
import { DateChip, Field, Seg, Switch } from '../ui';

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

function Opt({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="yk-opt">
      <div className="min-w-0">
        <p className="yk-opt-l">{label}</p>
        {hint && <p className="yk-opt-h">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function OptionsSection(props: OptionsSectionProps) {
  // Initialised once per mount (a wizard's kind never changes while open).
  const [isExport, setIsExport] = useState(() => props.kind === 'sales' && props.invoice.buyer_type === 'OVERSEAS');

  if (props.kind === 'sales') {
    const { invoice, updateInvoice, sellerStateCode } = props;
    const isIgst = invoice.supply_type === 'inter';
    // Supply-category (invoice-type) picker for registered/business supplies.
    const supplyCat = getSupplyCategory(invoice);
    const showSupplyCat = !isExport && !!invoice.buyer_gstin?.trim();
    const isSez = supplyCat === 'SEZ_WP' || supplyCat === 'SEZ_WOP';

    return (
      <div className="space-y-3" data-testid="sales-gst-options">
        <div className="yk-opt-grid">
          <Opt label="Tax split" hint={invoice.force_igst ? 'Set manually' : 'Auto-detected'}>
            <Seg
              ariaLabel="Tax split"
              value={isIgst ? 'igst' : 'cgst'}
              disabled={isExport}
              options={[{ v: 'igst', label: 'IGST' }, { v: 'cgst', label: 'CGST + SGST' }]}
              onChange={(v) => {
                if (v === 'igst') updateInvoice({ force_igst: true, supply_type: 'inter', is_intra_state: false });
                else updateInvoice({ force_igst: false, supply_type: 'intra', is_intra_state: true });
              }}
            />
          </Opt>
          <Opt label="Reverse charge (RCM)" hint="Recipient pays the tax">
            <Switch checked={invoice.reverse_charge} onChange={(v) => updateInvoice({ reverse_charge: v })} label="Reverse charge" />
          </Opt>
          <Opt label="Export" hint="Overseas customer">
            <Switch
              checked={isExport}
              label="Export"
              onChange={(checked) => {
                setIsExport(checked);
                if (checked) {
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
          </Opt>
          <Opt label="Through an e-commerce operator" hint="Feeds GSTR-1 Table 14 / 15">
            <Switch
              checked={!!invoice.ecom_supply}
              label="Supplied through e-commerce operator"
              onChange={(v) => updateInvoice(v ? { ecom_supply: true } : { ecom_supply: false, ecom_gstin: undefined, ecom_9_5: false })}
            />
          </Opt>
        </div>

        {showSupplyCat && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)]">
            <Field label="Invoice type" htmlFor="dw-supply-cat">
              <select id="dw-supply-cat" className="yk-in" value={supplyCat} onChange={(e) => updateInvoice(applySupplyCategory(e.target.value as SupplyCategory))}>
                <option value="REGULAR_B2B">Regular</option>
                <option value="SEZ_WP">SEZ — with payment (SEWP)</option>
                <option value="SEZ_WOP">SEZ — without payment (SEWOP)</option>
                <option value="DEEMED_EXPORT">Deemed Export (DE)</option>
              </select>
            </Field>
          </div>
        )}
        {showSupplyCat && isSez && (
          <p className="yk-warn"><AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden /> SEZ supply — treated as inter-state (IGST). Verify the SEZ recipient before filing.</p>
        )}

        {invoice.ecom_supply && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-commerce operator GSTIN (etin)" required htmlFor="dw-eco-gstin">
              <input id="dw-eco-gstin" className="yk-in mono uppercase" value={invoice.ecom_gstin || ''} onChange={(e) => updateInvoice({ ecom_gstin: e.target.value.toUpperCase() })} />
            </Field>
            <Opt label="U/s 9(5) — operator pays tax" hint="Restaurants, cabs, housekeeping → Table 15">
              <Switch checked={!!invoice.ecom_9_5} onChange={(v) => updateInvoice({ ecom_9_5: v })} label="U/s 9(5) — ECO pays tax" />
            </Opt>
          </div>
        )}

        {isExport && (
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Payment type" htmlFor="dw-exp-type">
              <select id="dw-exp-type" className="yk-in" value={invoice.export_type || 'WOPAY'} onChange={(e) => updateInvoice({ export_type: e.target.value as 'WPAY' | 'WOPAY' })}>
                <option value="WPAY">With payment (IGST)</option>
                <option value="WOPAY">Without payment (LUT / bond)</option>
              </select>
            </Field>
            <Field label="Port code" htmlFor="dw-exp-port">
              <input id="dw-exp-port" className="yk-in mono uppercase" value={invoice.port_code || ''} onChange={(e) => updateInvoice({ port_code: e.target.value })} />
            </Field>
            <Field label="Shipping bill no." htmlFor="dw-exp-sb">
              <input id="dw-exp-sb" className="yk-in mono" value={invoice.shipping_bill_no || ''} onChange={(e) => updateInvoice({ shipping_bill_no: e.target.value })} />
            </Field>
            <Field label="Shipping bill date">
              <DateChip size="md" label="Shipping bill date" value={invoice.shipping_bill_date || ''} onChange={(v) => updateInvoice({ shipping_bill_date: v })} />
            </Field>
          </div>
        )}
      </div>
    );
  }

  // ── Purchase ──
  const { fields, updateField, mode } = props;
  const isImport = fields.bucket === 'IMPG' || fields.bucket === 'IMPG_SEZ';
  const isInvoice = mode === 'purchase_invoice';

  return (
    <div className="space-y-3" data-testid="purchase-gst-options">
      <div className="yk-opt-grid">
        <Opt label="Tax split" hint="Auto-detected">
          <Seg
            ariaLabel="Tax split"
            value={fields.supplyType === 'inter' ? 'inter' : 'intra'}
            options={[{ v: 'inter', label: 'IGST' }, { v: 'intra', label: 'CGST + SGST' }]}
            onChange={(v) => updateField('supplyType', v)}
          />
        </Opt>
        {isInvoice && (
          <Opt label="Input tax credit" hint="Eligible to claim ITC">
            <Switch checked={fields.itcEligible} onChange={(v) => updateField('itcEligible', v)} label="ITC eligible" />
          </Opt>
        )}
        {isInvoice && ['B2B', 'URD', 'IMPS'].includes(fields.bucket) && (
          <Opt label="Reverse charge (RCM)" hint="We pay the tax to the government">
            <Switch checked={fields.rcmApplicable} onChange={(v) => updateField('rcmApplicable', v)} label="RCM" />
          </Opt>
        )}
      </div>

      <button type="button" className="yk-disclose" aria-expanded={fields.showAdvanced} onClick={() => updateField('showAdvanced', !fields.showAdvanced)}>
        More GST options <ChevronDown className={`h-3.5 w-3.5 transition-transform ${fields.showAdvanced ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {fields.showAdvanced && (
        <div className="grid gap-3 sm:grid-cols-3">
          {isInvoice && (
            <>
              <Field label="ITC status" htmlFor="dw-itc-status">
                <select id="dw-itc-status" className="yk-in" value={fields.itcStatus} onChange={(e) => updateField('itcStatus', e.target.value)}>
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
              </Field>
              <Opt label="Capital goods" hint="Asset purchase">
                <Switch checked={fields.capitalGoods} onChange={(v) => updateField('capitalGoods', v)} label="Capital goods" />
              </Opt>
            </>
          )}
          {isImport && (
            <>
              <Field label="Bill of entry no." required htmlFor="dw-boe-no">
                <input id="dw-boe-no" className="yk-in mono" value={fields.billOfEntryNo} onChange={(e) => updateField('billOfEntryNo', e.target.value)} />
              </Field>
              <Field label="Bill of entry date" required>
                <DateChip size="md" label="Bill of entry date" value={fields.billOfEntryDate} onChange={(v) => updateField('billOfEntryDate', v)} />
              </Field>
              <Field label="Port code" htmlFor="dw-boe-port">
                <input id="dw-boe-port" className="yk-in mono uppercase" value={fields.portCode} onChange={(e) => updateField('portCode', e.target.value)} />
              </Field>
            </>
          )}
        </div>
      )}
    </div>
  );
}
