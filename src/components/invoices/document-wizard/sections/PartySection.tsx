import type { ReactNode } from 'react';
import { ArrowLeftRight, MapPin } from 'lucide-react';
import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import { STATE_CODES } from '@/lib/accounting/gstInvoices';
import { WIZARD_CONFIG } from '../config';
import type { PurchaseFields } from '../useDocumentState';
import { Field, Seg } from '../ui';

interface SalesPartyProps {
  kind: 'sales';
  invoice: InvoiceV2Draft;
  updateInvoice: (u: Partial<InvoiceV2Draft>) => void;
  handleGstinChange: (value: string) => void;
  gstinError: string | null;
  gstinLocked?: boolean;
  mode: DocumentMode;
  invalidFields?: string[];
  /** UI-only registration status (the sales code derives B2B / B2C from the GSTIN). */
  registered: boolean;
  setRegistered: (v: boolean) => void;
  /** The document-number field, placed beside the party name. */
  numberSlot?: ReactNode;
}

interface PurchasePartyProps {
  kind: 'purchase';
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  gstinLocked?: boolean;
  mode: DocumentMode;
  invalidFields?: string[];
  numberSlot?: ReactNode;
}

type PartySectionProps = SalesPartyProps | PurchasePartyProps;

const STATUS_OPTIONS = [
  { v: 'reg' as const, label: 'Registered', title: 'Has a GSTIN (B2B)' },
  { v: 'unreg' as const, label: 'Unregistered', title: 'No GSTIN' },
];

function SupplyBadge({ intra }: { intra: boolean }) {
  return (
    <span className="yk-badge" title="Decided from the GSTIN and place of supply">
      <ArrowLeftRight className="h-3 w-3" aria-hidden />
      {intra ? 'Intra-state · CGST + SGST' : 'Inter-state · IGST'}
    </span>
  );
}

export function PartySection(props: PartySectionProps) {
  const config = WIZARD_CONFIG[props.mode];
  const bad = (k: string) => props.invalidFields?.includes(k);

  if (props.kind === 'sales') {
    const { invoice, updateInvoice, handleGstinChange, gstinError, gstinLocked, mode, registered, setRegistered, numberSlot } = props;
    const isReturn = mode === 'sales_return';
    const gstinMsg = gstinError || (bad('buyer_gstin') ? 'A valid 15-character GSTIN is required for a registered customer' : null);
    return (
      <div className="space-y-4">
        <div className="yk-grid-party">
          <Field label={`${config.partyLabel} name`} required error={bad('buyer_name') && 'Customer name is required'} htmlFor="dw-party-name">
            <input
              id="dw-party-name"
              className="yk-in"
              value={invoice.buyer_name}
              onChange={(e) => updateInvoice({ buyer_name: e.target.value })}
              disabled={gstinLocked}
              autoComplete="off"
            />
          </Field>
          {numberSlot}
        </div>

        {!isReturn && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="yk-lbl !mb-0">Status</span>
            <Seg
              ariaLabel="Customer GST registration"
              value={registered ? 'reg' : 'unreg'}
              options={STATUS_OPTIONS}
              disabled={gstinLocked}
              onChange={(v) => {
                if (v === 'reg') { if (!registered) setRegistered(true); }
                else if (registered) { setRegistered(false); handleGstinChange(''); }
              }}
            />
            <span className="yk-hint">{registered ? 'B2B — GSTIN required' : 'B2C — sold to a consumer / unregistered buyer'}</span>
          </div>
        )}

        <div className="yk-grid-gst">
          {(registered || isReturn) && (
            <Field label="GSTIN" required={registered && !isReturn} error={gstinMsg} htmlFor="dw-party-gstin">
              <input
                id="dw-party-gstin"
                className="yk-in mono uppercase"
                value={invoice.buyer_gstin || ''}
                onChange={(e) => handleGstinChange(e.target.value)}
                disabled={gstinLocked}
                maxLength={15}
                autoComplete="off"
              />
            </Field>
          )}
          <Field label="Place of supply" required error={bad('place_of_supply') && 'Place of supply is required'} htmlFor="dw-party-pos">
            <div className="relative">
              <MapPin className="yk-in-icon" aria-hidden />
              <select
                id="dw-party-pos"
                className="yk-in has-icon"
                value={invoice.place_of_supply}
                disabled={gstinLocked}
                onChange={(e) => {
                  const code = e.target.value;
                  updateInvoice({
                    place_of_supply: code,
                    buyer_state_code: code,
                    buyer_state: STATE_CODES[code] || '',
                  });
                }}
              >
                <option value="">Select state</option>
                {Object.entries(STATE_CODES).map(([code, name]) => (
                  <option key={code} value={code}>{code} — {name}</option>
                ))}
              </select>
            </div>
          </Field>
          <div className="yk-badge-slot"><SupplyBadge intra={invoice.supply_type === 'intra'} /></div>
        </div>
      </div>
    );
  }

  // ── Purchase ──
  const { fields, updateField, mode, numberSlot } = props;
  const isReturn = mode === 'purchase_return';
  // Registration maps onto the existing bucket: Unregistered = URD; Registered =
  // B2B (or EXEMPT_NIL when its line carries no GST — set in the items card).
  const registered = fields.bucket !== 'URD';
  const needsGstin = !isReturn && registered;
  const showPos = registered || isReturn || !fields.posState.trim() || bad('posState');
  return (
    <div className="space-y-4">
      <div className="yk-grid-party">
        <Field label={`${config.partyLabel} name`} required error={bad('vendorName') && 'Vendor name is required'} htmlFor="dw-party-name">
          <input
            id="dw-party-name"
            className="yk-in"
            disabled={isReturn}
            value={fields.vendorName}
            onChange={(e) => updateField('vendorName', e.target.value)}
            autoComplete="off"
          />
        </Field>
        {numberSlot}
      </div>

      {!isReturn && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="yk-lbl !mb-0">Status</span>
          <Seg
            ariaLabel="Vendor GST registration"
            value={registered ? 'reg' : 'unreg'}
            options={STATUS_OPTIONS}
            onChange={(v) => {
              if (v === 'reg') { if (!registered) updateField('bucket', 'B2B'); }
              else if (registered) { updateField('bucket', 'URD'); updateField('vendorGstin', ''); }
            }}
          />
          <span className="yk-hint">{registered ? 'B2B — GSTIN required' : 'No GSTIN — GST does not apply to this bill'}</span>
        </div>
      )}

      {(registered || isReturn || showPos) && (
        <div className="yk-grid-gst">
          {(registered || isReturn) && (
            <Field
              label="GSTIN"
              required={needsGstin}
              error={bad('vendorGstin') && 'A valid 15-character GSTIN is required for a registered vendor'}
              htmlFor="dw-party-gstin"
            >
              <input
                id="dw-party-gstin"
                className="yk-in mono uppercase"
                disabled={isReturn}
                value={fields.vendorGstin}
                onChange={(e) => updateField('vendorGstin', e.target.value.toUpperCase())}
                maxLength={15}
                autoComplete="off"
              />
            </Field>
          )}
          {showPos && (
            <Field label="Place of supply" required error={bad('posState') && 'Place of supply is required'} htmlFor="dw-party-pos">
              <div className="relative">
                <MapPin className="yk-in-icon" aria-hidden />
                <select
                  id="dw-party-pos"
                  className="yk-in has-icon"
                  disabled={isReturn}
                  value={fields.posState}
                  onChange={(e) => updateField('posState', e.target.value)}
                >
                  <option value="">Select state</option>
                  {Object.entries(STATE_CODES).map(([code, name]) => (
                    <option key={code} value={name}>{code} — {name}</option>
                  ))}
                </select>
              </div>
            </Field>
          )}
          {registered && <div className="yk-badge-slot"><SupplyBadge intra={fields.supplyType === 'intra'} /></div>}
        </div>
      )}
    </div>
  );
}
