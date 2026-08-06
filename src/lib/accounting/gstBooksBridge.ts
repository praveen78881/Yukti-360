import { listJournalEntries } from '@/lib/offlineDb';
import { listInvoicesV2, listPurchaseInvoices } from './gstInvoices';
import { computeGSTR3BFromInvoices } from './gstComputeFromInvoices';
import type { GSTR3BSummary } from './gstCompute';
import {
  GST_VOUCHER,
  accumulateGstr1Line,
  accumulateItcFromPurchaseLine,
  pickCreditorPartyName,
  pickDebtorPartyName,
} from './gstSystem';
import type { JournalEntry } from './computeEngine';

/* ─────────────────────────────────────────────────────────────────────────────
   GST Books Bridge — the PARALLEL wire from the journal to GST.

   The existing circuit (invoice wizard → invoice stores → GSTR-1/3B/ITC pages)
   is left completely untouched. This module runs a second, independent wire
   from the same battery (the journal): it derives GST figures straight from
   journal entries using the SAME account-mapping conventions as gstSystem.ts
   ("Output CGST/SGST/IGST", "Input CGST/SGST/IGST", Revenue from Operations,
   Trade Receivables/Payables, SLS/PUR vouchers), then reconciles the two wires.

   Nothing here writes to the invoice stores or the journal — read-only on both.
   ──────────────────────────────────────────────────────────────────────────── */

export interface BooksGstEntryRow {
  entryId: string;
  entryCode: string;
  date: string;
  voucherType: string;
  voucherNumber: string;
  partyName: string;
  gstin: string;
  kind: 'outward' | 'inward';
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  /** true = this entry is already represented in the invoice register (old wire). */
  bridged: boolean;
}

interface TaxTotals { taxableValue: number; cgst: number; sgst: number; igst: number }

export interface BooksGstResult {
  rows: BooksGstEntryRow[];
  booksOutward: TaxTotals;
  booksInward: TaxTotals;
  /** Same period, computed from the invoice registers (the old wire) — untouched logic. */
  invoiceRegister: GSTR3BSummary;
  /** Books-only entries the invoice register knows nothing about. */
  unbridged: {
    outwardCount: number;
    inwardCount: number;
    outwardTax: number;
    inwardTax: number;
  };
  /** Books minus invoice-register, per figure — the wiring gap, quantified. */
  gap: {
    outwardTaxable: number;
    outwardTax: number;
    itc: number;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function sumTax(t: { cgst: number; sgst: number; igst: number }): number {
  return t.cgst + t.sgst + t.igst;
}

export function computeBooksGst(companyId: string, fromDate?: string, toDate?: string): BooksGstResult {
  const entries = listJournalEntries(companyId, { fromDate, toDate }) as unknown as JournalEntry[];

  // ── Old-wire linkage: which journal entries the invoice register already covers.
  const sales = listInvoicesV2(companyId);
  const purchases = listPurchaseInvoices(companyId);
  const linkedJournalIds = new Set<string>();
  const invoiceNos = new Set<string>();
  for (const inv of sales) {
    // linked_journal_id is not on the InvoiceV2 type but is persisted by some
    // creation paths (e.g. the manual-entry GST capture) — read it defensively.
    const linked = (inv as { linked_journal_id?: string }).linked_journal_id;
    if (linked) linkedJournalIds.add(linked);
    if (inv.invoice_no) invoiceNos.add(inv.invoice_no);
  }
  for (const p of purchases) {
    if (p.linked_journal_id) linkedJournalIds.add(p.linked_journal_id);
    if (p.invoice_no) invoiceNos.add(p.invoice_no);
    if (p.vendor_invoice_no) invoiceNos.add(p.vendor_invoice_no);
  }
  const isBridged = (e: JournalEntry): boolean =>
    linkedJournalIds.has(e.id) ||
    Boolean(e.voucher_number && invoiceNos.has(e.voucher_number) &&
      ['SLS', 'PUR', 'CN', 'DN'].includes(e.voucher_type));

  // ── Books wire: walk every entry with the gstSystem mapping conventions.
  const rows: BooksGstEntryRow[] = [];
  const booksOutward: TaxTotals = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
  const booksInward: TaxTotals = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };

  for (const entry of entries) {
    // Outward side (sales): revenue credits + Output GST credits.
    const out = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
    for (const line of entry.lines) accumulateGstr1Line(line, out);
    const outTax = sumTax(out);
    // GST-relevant when output tax exists, or it is an SLS voucher with taxable value
    // (the exact rule the journal GST engine has always used).
    if (outTax > 0 || (entry.voucher_type === GST_VOUCHER.SALES && out.taxableValue > 0)) {
      const bridged = isBridged(entry);
      rows.push({
        entryId: entry.id,
        entryCode: entry.entry_code,
        date: entry.entry_date,
        voucherType: entry.voucher_type,
        voucherNumber: entry.voucher_number || '',
        partyName: pickDebtorPartyName(entry.lines),
        gstin: entry.party_gstin ?? '',
        kind: 'outward',
        taxableValue: r2(out.taxableValue),
        cgst: r2(out.cgst),
        sgst: r2(out.sgst),
        igst: r2(out.igst),
        totalTax: r2(outTax),
        bridged,
      });
      booksOutward.taxableValue += out.taxableValue;
      booksOutward.cgst += out.cgst;
      booksOutward.sgst += out.sgst;
      booksOutward.igst += out.igst;
    }

    // Inward side (purchases): Input GST debits; taxable approximated from the
    // entry's expense/purchase debits net of the tax itself.
    const itc = { cgst: 0, sgst: 0, igst: 0 };
    for (const line of entry.lines) accumulateItcFromPurchaseLine(line, itc);
    const inTax = sumTax(itc);
    if (inTax > 0 || entry.voucher_type === GST_VOUCHER.PURCHASE) {
      let inwardTaxable = 0;
      for (const line of entry.lines) {
        if (line.debit > 0 && (line.nature === 'expense' || line.nature === 'asset') &&
            !line.account_name.toLowerCase().includes('gst')) {
          inwardTaxable += line.debit;
        }
      }
      if (inTax > 0 || inwardTaxable > 0) {
        const bridged = isBridged(entry);
        rows.push({
          entryId: entry.id,
          entryCode: entry.entry_code,
          date: entry.entry_date,
          voucherType: entry.voucher_type,
          voucherNumber: entry.voucher_number || '',
          partyName: pickCreditorPartyName(entry.lines),
          gstin: entry.party_gstin ?? '',
          kind: 'inward',
          taxableValue: r2(inwardTaxable),
          cgst: r2(itc.cgst),
          sgst: r2(itc.sgst),
          igst: r2(itc.igst),
          totalTax: r2(inTax),
          bridged,
        });
        booksInward.taxableValue += inwardTaxable;
        booksInward.cgst += itc.cgst;
        booksInward.sgst += itc.sgst;
        booksInward.igst += itc.igst;
      }
    }
  }

  // ── Old wire, same period — existing logic reused untouched for comparison.
  const inRange = (d: string) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  const invoiceRegister = computeGSTR3BFromInvoices(
    sales.filter((s) => inRange(s.invoice_date)),
    purchases.filter((p) => inRange(p.invoice_date)),
  );

  const unbridgedRows = rows.filter((row) => !row.bridged);
  const outwardOnly = unbridgedRows.filter((row) => row.kind === 'outward');
  const inwardOnly = unbridgedRows.filter((row) => row.kind === 'inward');

  return {
    rows: rows.sort((a, b) => b.date.localeCompare(a.date)),
    booksOutward: {
      taxableValue: r2(booksOutward.taxableValue),
      cgst: r2(booksOutward.cgst),
      sgst: r2(booksOutward.sgst),
      igst: r2(booksOutward.igst),
    },
    booksInward: {
      taxableValue: r2(booksInward.taxableValue),
      cgst: r2(booksInward.cgst),
      sgst: r2(booksInward.sgst),
      igst: r2(booksInward.igst),
    },
    invoiceRegister,
    unbridged: {
      outwardCount: outwardOnly.length,
      inwardCount: inwardOnly.length,
      outwardTax: r2(outwardOnly.reduce((s, row) => s + row.totalTax, 0)),
      inwardTax: r2(inwardOnly.reduce((s, row) => s + row.totalTax, 0)),
    },
    gap: {
      outwardTaxable: r2(booksOutward.taxableValue - invoiceRegister.outwardSupplies.taxableValue),
      outwardTax: r2(
        sumTax(booksOutward) -
        (invoiceRegister.outwardSupplies.cgst + invoiceRegister.outwardSupplies.sgst + invoiceRegister.outwardSupplies.igst),
      ),
      itc: r2(sumTax(booksInward) - sumTax(invoiceRegister.itcAvailed)),
    },
  };
}
