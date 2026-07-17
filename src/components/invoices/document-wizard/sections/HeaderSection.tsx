import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from '../useDocumentState';

interface SalesHeaderProps {
  kind: 'sales';
  invoice: InvoiceV2Draft;
  updateInvoice: (u: Partial<InvoiceV2Draft>) => void;
  mode: DocumentMode;
  invalidFields?: string[];
}

interface PurchaseHeaderProps {
  kind: 'purchase';
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  mode: DocumentMode;
  invalidFields?: string[];
}

type HeaderSectionProps = SalesHeaderProps | PurchaseHeaderProps;

function fcls(base: string, invalidFields: string[] | undefined, key: string) {
  return `f ${base}${invalidFields?.includes(key) ? ' err' : ''}`;
}

export function HeaderSection(props: HeaderSectionProps) {
  if (props.kind === 'sales') {
    const { invoice, updateInvoice, mode, invalidFields } = props;
    return (
      <section className="dw-section">
        <div className="shead"><h2 className="dw-h">Header</h2></div>
        <div className="row">
          <div className="f c4">
            <label>{mode === 'sales_return' ? 'CN No' : 'Invoice No'} <b>*</b></label>
            <input
              value={invoice.invoice_no}
              onChange={(e) => updateInvoice({ invoice_no: e.target.value })}
              placeholder={mode === 'sales_return' ? 'e.g. CN-001' : 'e.g. INV-001'}
            />
          </div>
          <div className={fcls('c4', invalidFields, 'invoice_date')}>
            <label>Date <b>*</b></label>
            <input
              type="date"
              value={invoice.invoice_date}
              onChange={(e) => updateInvoice({ invoice_date: e.target.value, period: e.target.value.slice(0, 7) })}
            />
            <span className="msg">Date is required</span>
          </div>
        </div>
      </section>
    );
  }

  // Purchase header
  const { fields, updateField, mode, invalidFields } = props;
  return (
    <section className="dw-section">
      <div className="shead"><h2 className="dw-h">Header</h2></div>
      <div className="row">
        <div className={fcls('c4', invalidFields, 'invoiceDate')}>
          <label>{mode === 'purchase_return' ? 'Debit Note Date' : 'Invoice date'} <b>*</b></label>
          <input
            type="date"
            value={fields.invoiceDate}
            onChange={(e) => updateField('invoiceDate', e.target.value)}
          />
          <span className="msg">Date is required</span>
        </div>
        {mode === 'purchase_return' ? (
          <div className="f c4">
            <label>Debit Note No</label>
            <input
              value={fields.vendorInvoiceNo}
              onChange={(e) => updateField('vendorInvoiceNo', e.target.value)}
              placeholder="Leave blank to auto-generate (DN-…)"
            />
          </div>
        ) : (
          <div className={fcls('c4', invalidFields, 'vendorInvoiceNo')}>
            <label>Vendor invoice no. <b>*</b></label>
            <input
              value={fields.vendorInvoiceNo}
              onChange={(e) => updateField('vendorInvoiceNo', e.target.value)}
              placeholder="e.g. GST/2024/0042"
            />
            <span className="msg">Vendor invoice number is required</span>
          </div>
        )}
      </div>
    </section>
  );
}
