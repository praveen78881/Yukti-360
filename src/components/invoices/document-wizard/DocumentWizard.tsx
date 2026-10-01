import { useState } from 'react';
import { Building2, Users, Package, Percent, Scale, Wallet, FileText, Plus, X, ShoppingCart, ReceiptText } from 'lucide-react';
import type { DocumentWizardProps } from './types';
import { WIZARD_CONFIG, GSTR1_TABLE_LABELS } from './config';
import { STATE_CODES, gstinIsValid } from '@/lib/accounting/gstInvoices';
import { useDocumentState, type PurchaseFields } from './useDocumentState';
import { useCompany } from '@/hooks/useCompany';
import { HeaderSection } from './sections/HeaderSection';
import { PartySection } from './sections/PartySection';
import { OriginalInvoiceSection } from './sections/OriginalInvoiceSection';
import { LineItemsSection } from './sections/LineItemsSection';
import { PurchaseItemSection } from './sections/PurchaseItemSection';
import { OptionsSection } from './sections/OptionsSection';
import { PaymentSection } from './sections/PaymentSection';
import { SummarySection } from './sections/SummarySection';
import { TdsTcsPanel } from './TdsTcsPanel';
import { Card, DateChip, Field, inr } from './ui';
import './wizard-skin.css';

export function DocumentWizard({
  mode,
  companyId,
  sellerStateCode,
  initialInvoice,
  initialPurchase,
  onClose,
  onSave,
}: DocumentWizardProps) {
  const config = WIZARD_CONFIG[mode];
  const { company } = useCompany();
  const companyGstin = company?.gst_details?.gstin || '';
  const companyStateCode = companyGstin.length >= 2 ? companyGstin.slice(0, 2) : '';
  const companyStateName = (companyStateCode && STATE_CODES[companyStateCode]) || company?.entity_details?.state || '';
  const companyPan = company?.entity_details?.pan || '';
  const companyTan = (company?.entity_details as { tan?: string } | undefined)?.tan || '';

  const state = useDocumentState(
    mode,
    companyId,
    sellerStateCode,
    companyStateName,
    initialInvoice,
    initialPurchase,
  );

  // UI-only: the customer's registration status. The sales code derives B2B / B2C
  // from the GSTIN itself; this only decides whether the GSTIN field is shown.
  const [salesRegistered, setSalesRegistered] = useState(
    () => state.kind === 'sales' && !!state.invoice.buyer_gstin?.trim(),
  );
  // UI-layer checks, added on top of the state's own validation.
  const [uiInvalid, setUiInvalid] = useState<string[]>([]);

  const isEditing = !!(initialInvoice?.id || initialPurchase?.id);
  const invalidFields = [...state.invalidFields, ...uiInvalid.filter((f) => !state.invalidFields.includes(f))];

  const uiChecks = (): string[] => {
    if (state.kind === 'purchase') {
      // A registered vendor needs a GSTIN even when its line carries no GST
      // (B2B is already enforced by the state itself).
      if (mode === 'purchase_invoice' && state.fields.bucket === 'EXEMPT_NIL' && !gstinIsValid(state.fields.vendorGstin)) return ['vendorGstin'];
      return [];
    }
    if (mode === 'sales_invoice' && salesRegistered && !gstinIsValid(state.invoice.buyer_gstin)) return ['buyer_gstin'];
    return [];
  };

  const handleSave = () => {
    const errs = uiChecks();
    setUiInvalid(errs);
    if (errs.length) return;
    const ok = state.save();
    if (ok) {
      onSave();
      onClose();
    }
  };

  const isSales = state.kind === 'sales';
  const docDate = isSales ? state.invoice.invoice_date : state.fields.invoiceDate;
  const setDocDate = (v: string) => {
    if (state.kind === 'sales') state.updateInvoice({ invoice_date: v, period: v.slice(0, 7) });
    else state.updateField('invoiceDate', v);
  };
  const dateInvalid = invalidFields.includes(isSales ? 'invoice_date' : 'invoiceDate');
  const dateLabel = mode === 'purchase_return' ? 'Debit note date' : mode === 'sales_return' ? 'Credit note date' : 'Invoice date';

  const purchaseRegistered = state.kind === 'purchase' && state.fields.bucket !== 'URD';
  const partyGstin = isSales ? state.invoice.buyer_gstin : state.fields.vendorGstin;
  const t = state.totals;
  const gstTotal = t.cgst + t.sgst + t.igst + (isSales ? (t as { cess: number }).cess : 0);
  const saveLabel = isEditing
    ? 'Update'
    : mode === 'purchase_invoice' ? 'Save purchase'
      : mode === 'sales_invoice' ? 'Save invoice'
        : mode === 'purchase_return' ? 'Save debit note' : 'Save credit note';
  const TitleIcon = isSales ? ReceiptText : ShoppingCart;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="ca-modal-panel dw-modal flex h-full w-full max-w-[1180px] max-h-[94vh] flex-col overflow-hidden bg-white">
        {/* ── Top bar: title · bold click-to-change date · close ── */}
        <div className="dw-skin yk-top">
          <div className="flex min-w-0 items-center gap-3">
            <span className="yk-tile lg"><TitleIcon className="h-[18px] w-[18px]" aria-hidden /></span>
            <div className="min-w-0">
              <h2 className="yk-title">{isEditing ? `Edit ${config.title}` : config.title}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {config.showGstr1Badge && state.kind === 'sales' ? (
                  <span className="yk-pill">{GSTR1_TABLE_LABELS[state.totals.gstr1Table] || state.totals.gstr1Table}</span>
                ) : (
                  <span className="yk-sub">{isSales ? 'Outward supply' : 'Inward supply from a vendor'}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <DateChip label={dateLabel} value={docDate} onChange={setDocDate} invalid={dateInvalid} testId="doc-date" />
            <button type="button" onClick={onClose} className="yk-icon-btn" aria-label="Close" title="Close">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
        {dateInvalid && <p className="dw-skin yk-top-err" role="alert">The {dateLabel.toLowerCase()} is required</p>}

        {/* ── Form ── */}
        <div className="dw-skin yk-body">
          <div className="yk-stack">
            {/* Party */}
            <Card icon={isSales ? Users : Building2} title={config.partyLabel} testId="card-party">
              {state.kind === 'sales' ? (
                <PartySection
                  kind="sales"
                  invoice={state.invoice}
                  updateInvoice={state.updateInvoice}
                  handleGstinChange={state.handleGstinChange}
                  gstinError={state.gstinError}
                  gstinLocked={state.gstinLocked}
                  mode={mode}
                  invalidFields={invalidFields}
                  registered={salesRegistered || mode === 'sales_return'}
                  setRegistered={(v) => { setSalesRegistered(v); setUiInvalid((u) => u.filter((f) => f !== 'buyer_gstin')); }}
                  numberSlot={<HeaderSection kind="sales" invoice={state.invoice} updateInvoice={state.updateInvoice} mode={mode} invalidFields={invalidFields} />}
                />
              ) : (
                <PartySection
                  kind="purchase"
                  fields={state.fields}
                  updateField={function updatePartyField<K extends keyof PurchaseFields>(k: K, v: PurchaseFields[K]) {
                    state.updateField(k, v);
                    if (k === 'vendorGstin' || k === 'bucket') setUiInvalid((u) => u.filter((f) => f !== 'vendorGstin'));
                  }}
                  gstinLocked={state.gstinLocked}
                  mode={mode}
                  invalidFields={invalidFields}
                  numberSlot={<HeaderSection kind="purchase" fields={state.fields} updateField={state.updateField} mode={mode} invalidFields={invalidFields} />}
                />
              )}
            </Card>

            {/* Original invoice (returns only) */}
            {config.showOriginalInvoice && (
              <Card icon={FileText} title="Original invoice">
                <div className="dw-legacy">
                  {state.kind === 'sales' ? (
                    <OriginalInvoiceSection kind="sales" invoice={state.invoice} updateInvoice={state.updateInvoice} existingInvoices={state.existingInvoices} selectOriginalInvoice={state.selectOriginalInvoice} mode={mode} invalidFields={invalidFields} />
                  ) : (
                    <OriginalInvoiceSection kind="purchase" fields={state.fields} updateField={state.updateField} existingPurchases={state.existingPurchases} selectOriginalPurchase={state.selectOriginalPurchase} mode={mode} invalidFields={invalidFields} />
                  )}
                </div>
              </Card>
            )}

            {/* Items */}
            {config.multiLineItems && state.kind === 'sales' ? (
              <Card
                icon={Package}
                title="Items"
                sub="Products or services on this invoice"
                testId="card-items"
                action={(
                  <button type="button" className="yk-add" onClick={state.addItem} aria-label="Add item" title="Add item">
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                )}
              >
                <LineItemsSection invoice={state.invoice} updateItem={state.updateItem} addItem={state.addItem} removeItem={state.removeItem} />
              </Card>
            ) : state.kind === 'purchase' ? (
              <Card icon={Package} title="Item" sub="Product or service on this bill" testId="card-items">
                <PurchaseItemSection fields={state.fields} updateField={state.updateField} mode={mode} invalidFields={invalidFields} totals={state.totals} />
              </Card>
            ) : null}

            {/* GST details — for a purchase only when the vendor is registered */}
            {state.kind === 'sales' ? (
              <Card icon={Percent} title="GST details" testId="card-gst">
                <OptionsSection kind="sales" invoice={state.invoice} updateInvoice={state.updateInvoice} sellerStateCode={sellerStateCode} mode={mode} />
              </Card>
            ) : (purchaseRegistered || mode === 'purchase_return') ? (
              <Card icon={Percent} title="GST details" testId="card-gst">
                <OptionsSection kind="purchase" fields={state.fields} updateField={state.updateField} mode={mode} />
              </Card>
            ) : null}

            {/* TDS / TCS — for reference only (never saved, never in the bill) */}
            {(mode === 'purchase_invoice' || mode === 'sales_invoice') && (
              <Card icon={Scale} title="TDS / TCS" sub="Optional — for reference while entering" testId="card-tds-tcs">
                <TdsTcsPanel
                  side={isSales ? 'sales' : 'purchase'}
                  taxable={t.taxable}
                  invoiceValue={t.total}
                  partyGstin={partyGstin}
                  companyPan={companyPan}
                  companyTan={companyTan}
                />
              </Card>
            )}

            {/* Payment */}
            <Card icon={Wallet} title="Payment" testId="card-payment">
              {state.kind === 'sales' ? (
                <PaymentSection kind="sales" invoice={state.invoice} updateInvoice={state.updateInvoice} mode={mode} />
              ) : (
                <>
                  <PaymentSection kind="purchase" fields={state.fields} updateField={state.updateField} mode={mode} />
                  <div className="mt-4">
                    <Field label="Narration (optional)" htmlFor="dw-narration">
                      <input
                        id="dw-narration"
                        className="yk-in"
                        value={state.fields.narration}
                        onChange={(e) => state.updateField('narration', e.target.value)}
                      />
                    </Field>
                  </div>
                </>
              )}
            </Card>

            {/* Bill summary */}
            <Card icon={ReceiptText} title="Summary" testId="card-summary">
              {state.kind === 'sales' ? (
                <SummarySection kind="sales" totals={state.totals} mode={mode} />
              ) : (
                <SummarySection kind="purchase" totals={state.totals} mode={mode} />
              )}
            </Card>
          </div>
        </div>

        {/* ── Footer: totals always in view + actions ── */}
        <div className="dw-skin yk-foot">
          <div className="yk-foot-figs" aria-live="polite">
            <span><em>Taxable</em><b className="num">{inr(t.taxable)}</b></span>
            <span><em>GST</em><b className="num">{inr(gstTotal)}</b></span>
            <span className="tot"><em>Total</em><b className="num" data-testid="footer-total">₹ {inr(t.total)}</b></span>
          </div>
          <div className="yk-foot-msg" role="status">
            {invalidFields.length > 0 ? 'Fill in the highlighted fields' : state.error}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" className="yk-btn ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="yk-btn primary" onClick={handleSave} data-testid="wizard-save">{saveLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
