import { Banknote, Smartphone, Clock3, SplitSquareHorizontal, type LucideIcon } from 'lucide-react';
import type { DocumentMode } from '../types';
import type { InvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from '../useDocumentState';
import { DateChip, Field, inr } from '../ui';

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

const MODES: Array<{ v: 'CASH' | 'ONLINE' | 'CREDIT' | 'PARTIAL'; label: string; sub: string; icon: LucideIcon }> = [
  { v: 'CASH', label: 'Cash', sub: 'Settled in cash now', icon: Banknote },
  { v: 'ONLINE', label: 'Online', sub: 'Bank, UPI or card now', icon: Smartphone },
  { v: 'CREDIT', label: 'Credit', sub: 'Pay later, by due date', icon: Clock3 },
  { v: 'PARTIAL', label: 'Partial', sub: 'Split into two parts', icon: SplitSquareHorizontal },
];

type Medium = 'UPI' | 'CARD' | 'CASH' | 'BANK_TRANSFER';

/**
 * Payment. Purely presentational — every setter below is the exact same handler
 * as before, so the pending/paid mapping that feeds debtors, creditors and bills
 * payable/receivable is unchanged.
 *
 * PARTIAL is shown as two legs. The saved record still holds ONE paid leg
 * (medium + amount) and the balance as pending on credit — so leg 2 is limited
 * to Credit until the posting path supports a second paid mode.
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
  const setMedium = (val: Medium) => {
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
  const isOnline = paymentMode === 'ONLINE';
  const paidWord = isSales ? 'Received' : 'Paid';

  return (
    <div className="space-y-4" data-testid="payment">
      <div className="yk-paymodes" role="radiogroup" aria-label="Payment mode">
        {MODES.map((m) => {
          const on = paymentMode === m.v;
          return (
            <button
              key={m.v}
              type="button"
              role="radio"
              aria-checked={on}
              className={`yk-paymode ${on ? 'on' : ''}`}
              onClick={() => setPaymentMode(m.v)}
            >
              <m.icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="yk-paymode-l">{m.label}</span>
                <span className="yk-paymode-s">{m.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {isOnline && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={`${paidWord} via`} required htmlFor="dw-pay-medium">
            <select id="dw-pay-medium" className="yk-in" value={receivedMedium} onChange={(e) => setMedium(e.target.value as Medium)}>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Credit / debit card</option>
            </select>
          </Field>
        </div>
      )}

      {isCredit && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Pending">
            <div className="yk-readout num" data-testid="payment-pending">₹ {inr(amountPending)}</div>
          </Field>
          <Field label="Due date" required>
            <DateChip size="md" label="Due date" value={dueDate} onChange={setDueDate} testId="due-date" />
          </Field>
        </div>
      )}

      {isPartial && (
        <div className="yk-legs" data-testid="payment-legs">
          <div className="yk-leg">
            <span className="yk-leg-n" aria-hidden>1</span>
            <Field label="Mode" required htmlFor="dw-pay-medium">
              <select id="dw-pay-medium" className="yk-in" value={receivedMedium} onChange={(e) => setMedium(e.target.value as Medium)}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Credit / debit card</option>
              </select>
            </Field>
            <Field label="Amount" required htmlFor="dw-pay-amt">
              <input
                id="dw-pay-amt"
                type="number"
                className="yk-in num"
                value={amountReceived || ''}
                onChange={(e) => setReceived(Number(e.target.value))}
              />
            </Field>
            <span />
          </div>
          <div className="yk-leg">
            <span className="yk-leg-n" aria-hidden>2</span>
            <Field label="Mode" htmlFor="dw-pay-medium-2" hint="A second paid mode needs a posting update — the balance stays on credit for now">
              <select id="dw-pay-medium-2" className="yk-in" value="CREDIT" onChange={() => { /* credit only for now */ }}>
                <option value="CREDIT">Credit — pay later</option>
                <option value="CASH" disabled>Cash</option>
                <option value="BANK_TRANSFER" disabled>Bank transfer</option>
                <option value="UPI" disabled>UPI</option>
                <option value="CARD" disabled>Credit / debit card</option>
              </select>
            </Field>
            <Field label="Amount">
              <div className="yk-readout num" data-testid="payment-pending">₹ {inr(amountPending)}</div>
            </Field>
            <Field label="Due date" required>
              <DateChip size="md" label="Due date" value={dueDate} onChange={setDueDate} testId="due-date" />
            </Field>
          </div>
        </div>
      )}

      {isCredit && (
        <p className="yk-note">Nothing {isSales ? 'received' : 'paid'} now — the full bill is pending against the due date.</p>
      )}
    </div>
  );
}
