import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import { STATE_CODES } from '@/lib/accounting/gstInvoices';
import { WIZARD_CONFIG } from '../config';
import type { PurchaseFields } from '../useDocumentState';

interface SalesPartyProps {
  kind: 'sales';
  invoice: InvoiceV2Draft;
  updateInvoice: (u: Partial<InvoiceV2Draft>) => void;
  handleGstinChange: (value: string) => void;
  gstinError: string | null;
  gstinLocked?: boolean;
  mode: DocumentMode;
  invalidFields?: string[];
}

interface PurchasePartyProps {
  kind: 'purchase';
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  gstinLocked?: boolean;
  mode: DocumentMode;
  invalidFields?: string[];
}

type PartySectionProps = SalesPartyProps | PurchasePartyProps;

function fcls(base: string, invalidFields: string[] | undefined, key: string) {
  return `f ${base}${invalidFields?.includes(key) ? ' err' : ''}`;
}

export function PartySection(props: PartySectionProps) {
  const config = WIZARD_CONFIG[props.mode];

  if (props.kind === 'sales') {
    const { invoice, updateInvoice, handleGstinChange, gstinError, gstinLocked, invalidFields } = props;
    return (
      <section className="dw-section">
        <div className="shead"><h2 className="dw-h">{config.partyLabel}</h2></div>
        <div className="row">
          <div className={fcls('c5', invalidFields, 'buyer_name')}>
            <label>{config.partyLabel} name <b>*</b></label>
            <input
              value={invoice.buyer_name}
              onChange={(e) => updateInvoice({ buyer_name: e.target.value })}
              disabled={gstinLocked}
              placeholder={`${config.partyLabel} name`}
            />
            <span className="msg">Party name is required</span>
          </div>
          <div className={`f c3${gstinError ? ' err' : ''}`}>
            <label>GSTIN</label>
            <input
              className="mono"
              style={{ textTransform: 'uppercase' }}
              value={invoice.buyer_gstin || ''}
              onChange={(e) => handleGstinChange(e.target.value)}
              disabled={gstinLocked}
              maxLength={15}
              placeholder={gstinLocked ? (invoice.buyer_gstin ? '' : 'Unregistered (from original)') : 'Auto-detects B2B / B2C'}
            />
            <span className="msg">{gstinError || 'Invalid GSTIN'}</span>
          </div>
          <div className={fcls('c4', invalidFields, 'place_of_supply')}>
            <label>Place of supply <b>*</b></label>
            <select
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
            <span className="msg">Place of supply is required</span>
          </div>
        </div>
      </section>
    );
  }

  // Purchase party
  const { fields, updateField, mode, gstinLocked: _gstinLocked, invalidFields } = props;
  const needsGstin = fields.bucket === 'B2B' || (fields.bucket === 'CDNR' && !!fields.vendorGstin);
  return (
    <section className="dw-section">
      <div className="shead"><h2 className="dw-h">{config.partyLabel}</h2></div>
      <div className="row">
        <div className={fcls('c5', invalidFields, 'vendorName')}>
          <label>{config.partyLabel} name <b>*</b></label>
          <input
            disabled={mode === 'purchase_return'}
            value={fields.vendorName}
            onChange={(e) => updateField('vendorName', e.target.value)}
            placeholder="Supplier name"
          />
          <span className="msg">Vendor name is required</span>
        </div>
        <div className={fcls('c3', invalidFields, 'vendorGstin')}>
          <label>GSTIN {needsGstin ? <b>*</b> : null}</label>
          <input
            className="mono"
            style={{ textTransform: 'uppercase' }}
            disabled={mode === 'purchase_return'}
            value={fields.vendorGstin}
            onChange={(e) => updateField('vendorGstin', e.target.value.toUpperCase())}
            placeholder="27ABCDE1234F1Z5"
            maxLength={15}
          />
          <span className="msg">Valid GSTIN required for B2B</span>
        </div>
        <div className={fcls('c4', invalidFields, 'posState')}>
          <label>Place of supply <b>*</b></label>
          <select
            disabled={mode === 'purchase_return'}
            value={fields.posState}
            onChange={(e) => updateField('posState', e.target.value)}
          >
            <option value="">Select state</option>
            {Object.entries(STATE_CODES).map(([code, name]) => (
              <option key={code} value={name}>{code} — {name}</option>
            ))}
          </select>
          <span className="msg">Place of supply is required</span>
        </div>
      </div>
    </section>
  );
}
