/* The document-number field. The date itself lives in the wizard's top bar as a
   bold, click-to-change chip (DocumentWizard). Same fields and handlers as before. */
import { Hash } from 'lucide-react';
import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from '../useDocumentState';
import { Field } from '../ui';

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

export function HeaderSection(props: HeaderSectionProps) {
  if (props.kind === 'sales') {
    const { invoice, updateInvoice, mode } = props;
    const isReturn = mode === 'sales_return';
    return (
      <Field label={isReturn ? 'Credit note no.' : 'Invoice no.'} hint="Leave blank for the next number in the series" htmlFor="dw-doc-no">
        <div className="relative">
          <Hash className="yk-in-icon" aria-hidden />
          <input
            id="dw-doc-no"
            className="yk-in has-icon mono"
            value={invoice.invoice_no}
            onChange={(e) => updateInvoice({ invoice_no: e.target.value })}
            autoComplete="off"
          />
        </div>
      </Field>
    );
  }

  const { fields, updateField, mode, invalidFields } = props;
  if (mode === 'purchase_return') {
    return (
      <Field label="Debit note no." hint="Leave blank to auto-generate (DN-…)" htmlFor="dw-doc-no">
        <div className="relative">
          <Hash className="yk-in-icon" aria-hidden />
          <input
            id="dw-doc-no"
            className="yk-in has-icon mono"
            value={fields.vendorInvoiceNo}
            onChange={(e) => updateField('vendorInvoiceNo', e.target.value)}
            autoComplete="off"
          />
        </div>
      </Field>
    );
  }
  return (
    <Field
      label="Vendor invoice no."
      required
      error={invalidFields?.includes('vendorInvoiceNo') && 'Vendor invoice number is required'}
      htmlFor="dw-doc-no"
    >
      <div className="relative">
        <Hash className="yk-in-icon" aria-hidden />
        <input
          id="dw-doc-no"
          className="yk-in has-icon mono"
          value={fields.vendorInvoiceNo}
          onChange={(e) => updateField('vendorInvoiceNo', e.target.value)}
          autoComplete="off"
        />
      </div>
    </Field>
  );
}
