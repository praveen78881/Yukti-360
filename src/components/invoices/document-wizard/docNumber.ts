/* Display-only preview of the software's own document number, shown under the
   date in the wizard's top bar. Mirrors the numbering the save path applies
   (gstInvoices.ts nextInvoiceNo / nextInvoiceNoV2 — module-private there) using
   only the exported list functions. Nothing here is saved: the real number is
   still assigned on save by the existing code. (A configurable scheme is due to
   come from company Settings later.) */
import { listInvoicesV2, listPurchaseInvoices, type DocType } from '@/lib/accounting/gstInvoices';

function fyShort(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const start = d.getMonth() < 3 ? y - 1 : y;
  return `${String(start).slice(2)}${String(start + 1).slice(2)}`;
}

function nextIn(numbers: string[], prefix: string): string {
  const seq = numbers
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number.parseInt(n.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n));
  return `${prefix}${String((seq.length ? Math.max(...seq) : 0) + 1).padStart(5, '0')}`;
}

/** Purchase voucher number the next saved purchase (or debit note) will get. */
export function previewPurchaseNo(companyId: string, dateIso: string, isDebitNote: boolean): string {
  const fy = fyShort(dateIso);
  if (!fy) return '';
  const prefix = `${isDebitNote ? 'DN' : 'PUR'}-${fy}-`;
  return nextIn(listPurchaseInvoices(companyId).map((p) => p.invoice_no || ''), prefix);
}

const V2_PREFIX: Record<DocType, string> = {
  TAX_INVOICE: 'INV',
  BILL_OF_SUPPLY: 'BOS',
  CREDIT_NOTE: 'CN',
  DEBIT_NOTE: 'DN',
  RECEIPT_VOUCHER: 'RV',
  REFUND_VOUCHER: 'RF',
  PAYMENT_VOUCHER: 'PV',
  DELIVERY_CHALLAN: 'DC',
};

/** Sales document number a blank "invoice no." will be given on save. */
export function previewSalesNo(companyId: string, docType: DocType, dateIso: string): string {
  const fy = fyShort(dateIso);
  if (!fy) return '';
  const prefix = `${V2_PREFIX[docType] ?? 'INV'}/${fy}/`;
  return nextIn(listInvoicesV2(companyId).map((i) => i.invoice_no || ''), prefix);
}
