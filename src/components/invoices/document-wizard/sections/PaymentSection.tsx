import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from '../useDocumentState';

interface SalesPaymentProps {
  kind: 'sales';
  invoice: InvoiceV2Draft;
  updateInvoice: (u: Partial<InvoiceV2Draft>) => void;
  mode: DocumentMode;
}

interface PurchasePaymentProps {
  kind: 'purchase';
  fields: PurchaseFields;
  updateField: <K extends keyof PurchaseFields>(key: K, value: PurchaseFields[K]) => void;
  mode: DocumentMode;
}

type PaymentSectionProps = SalesPaymentProps | PurchasePaymentProps;

const MODES: Array<{ v: 'CASH' | 'ONLINE' | 'CREDIT' | 'PARTIAL'; label: string }> = [
  { v: 'CASH', label: 'Cash' },
  { v: 'ONLINE', label: 'Online' },
  { v: 'CREDIT', label: 'Credit' },
  { v: 'PARTIAL', label: 'Partial' },
];

/**
 * Left column of the "Payment & routing" paygrid (the SummarySection renders the
 * right column). Purely presentational — every setter below is the exact same
 * handler as before, so the pending/paid mapping that feeds debtors, creditors
 * and bills payable/receivable is unchanged. Partial stays a SINGLE payment.
 */
export function PaymentSection(props: PaymentSectionProps) {
  const isSales = props.kind === 'sales';
  const paymentMode = isSales ? (props.invoice.payment_mode || 'CREDIT') : props.fields.paymentMode;
  const receivedMedium = isSales ? (props.invoice.received_medium || 'BANK_TRANSFER') : props.fields.paidMedium;
  const amountReceived = isSales ? (props.invoice.amount_received || 0) : Number(props.fields.amountPaid || 0);
  const amountPending = isSales ? (props.invoice.amount_pending || 0) : Number(props.fields.amountPending || 0);
  const dueDate = isSales ? (props.invoice.due_date || '') : props.fields.dueDate;

  const setPaymentMode = (val: 'CASH' | 'ONLINE' | 'CREDIT' | 'PARTIAL') => {
    if (isSales) props.updateInvoice({ payment_mode: val });
    else props.updateField('paymentMode', val);
  };
  const setMedium = (val: 'UPI' | 'CARD' | 'CASH' | 'BANK_TRANSFER') => {
    if (isSales) props.updateInvoice({ received_medium: val });
    else props.updateField('paidMedium', val);
  };
  const setReceived = (val: number) => {
    if (isSales) props.updateInvoice({ amount_received: val });
    else props.updateField('amountPaid', String(val));
  };
  const setDueDate = (val: string) => {
    if (isSales) props.updateInvoice({ due_date: val });
    else props.updateField('dueDate', val);
  };

  const isPartial = paymentMode === 'PARTIAL';
  const isCredit = paymentMode === 'CREDIT';
  const showMedium = paymentMode === 'ONLINE' || paymentMode === 'PARTIAL';
  const inrFmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <div className="f" style={{ marginBottom: 14 }}>
        <label>Mode <b>*</b></label>
        <div className="opts">
          {MODES.map((m) => (
            <label key={m.v}>
              <input
                type="radio"
                name="dw-mode"
                checked={paymentMode === m.v}
                onChange={() => setPaymentMode(m.v)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      {(showMedium || isPartial) && (
        <div className="payrow">
          {showMedium && (
            <div className="f">
              <label>{isSales ? 'Received via' : 'Paid via'} <b>*</b></label>
              <select value={receivedMedium} onChange={(e) => setMedium(e.target.value as any)}>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Credit/Debit Card</option>
                {paymentMode === 'PARTIAL' && <option value="CASH">Cash</option>}
              </select>
            </div>
          )}
          {isPartial && (
            <div className="f">
              <label>{isSales ? 'Amount received' : 'Amount paid'} <b>*</b></label>
              <input
                type="number"
                className="num"
                value={amountReceived || ''}
                onChange={(e) => setReceived(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      )}

      {(isPartial || isCredit) && (
        <div className="row">
          <div className="f c6">
            <label>Pending amount</label>
            <input className="num" readOnly value={`₹ ${inrFmt(amountPending)}`} />
          </div>
          <div className="f c6">
            <label>Due date <b>*</b></label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      )}

      {isCredit && (
        <div className="note">
          Nothing {isSales ? 'received' : 'paid'} now. The full invoice total is pending against the due date.
        </div>
      )}
    </div>
  );
}
