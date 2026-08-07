/**
 * GSTR-3B source: THE OFFLINE BACKBONE — the whole month built from the
 * company's own books, reconciled against the accounting ledger accounts.
 *
 * ZERO NETWORK. This source never needs a taxpayer session and never returns
 * `needsSession`. Everything it reads is already on the device:
 *   • the sales register  (invoices v2)      → `listInvoicesV2`
 *   • the purchase register                  → `listPurchaseInvoices`
 *   • the journal                            → `listJournalEntries`
 *
 * It reuses the existing engines rather than re-deriving them:
 *   • `computeGSTR3BFromInvoices` — signed outward totals (credit notes reduce,
 *     cancelled excluded, sales-side debit notes reverse ITC) and the ITC
 *     eligibility rules. It is called once per Table-3.1 bucket so the sign /
 *     cancellation / eligibility logic lives in exactly one place.
 *   • `computeAllBalances`        — journal ledger balances for the tie-out.
 *
 * Fields filled (everything the books can genuinely evidence):
 *     txval31a  taxNonRcm    — taxable outward supplies + tax on them
 *     txval31b               — zero-rated (exports / SEZ)
 *     txval31c               — nil-rated + exempt outward
 *     txval31e               — non-GST outward
 *     txval31d  taxRcm       — inward supplies liable to reverse charge + tax
 *     itcNonRcm              — ITC availed, other than RCM (net of reversals)
 *     itcRcm                 — ITC on the RCM tax paid
 *     inward5Exmp            — Table 5 composition / exempt / nil inward
 *     inward5NonGst          — Table 5 non-GST inward
 * Never touched (CA-entered): interest, lateFee, openItc, cashOffset.
 *
 * The ledger tie-out NEVER adjusts a figure. When the books total and the
 * journal ledger movement disagree it is reported in `patch.notes` as
 * "books vs ledger: output tax differs by ₹X" so the CA decides.
 */

import {
  round2,
  calendarMonthRangeIso,
  type Split4,
  type Gstr3bMonthData,
} from '@/lib/accounting/gstr3bJson';
import { computeGSTR3BFromInvoices } from '@/lib/accounting/gstComputeFromInvoices';
import {
  listInvoicesV2,
  listPurchaseInvoices,
  type InvoiceV2,
  type PurchaseInvoice,
} from '@/lib/accounting/gstInvoices';
import { computeAllBalances, type JournalEntry } from '@/lib/accounting/computeEngine';
import { listJournalEntries } from '@/lib/offlineDb';
import { parsePeriod } from '@/lib/gst/sandbox/period';
import type { Gstr3bPatch, Gstr3bSourceFn, SourceResult } from './types';

/* ── ledger groups (exact Schedule-III strings from src/lib/coa.ts) ───────── */

/** Output-side GST liability groups — compared against 3.1(a)+3.1(d) tax. */
export const GST_OUTPUT_LEDGER_GROUPS: readonly string[] = [
  'GST — Output Tax',
  'GST — RCM',
  'GST — Advances',
];

/** Input-side GST groups — compared against total ITC availed. */
export const GST_INPUT_LEDGER_GROUPS: readonly string[] = [
  'GST — Input Tax Credit',
];

/** Fields this source is authoritative for (provenance / UI badging). */
export const ACCOUNTS_FIELDS = [
  'txval31a', 'txval31b', 'txval31c', 'txval31e',
  'txval31d', 'taxNonRcm', 'taxRcm',
  'itcNonRcm', 'itcRcm',
  'inward5Exmp', 'inward5NonGst',
] as const;

/* ── tiny helpers ─────────────────────────────────────────────────────────── */

function num(x: unknown): number {
  const n = typeof x === 'string' ? parseFloat(x) : (x as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

const zero4 = (): Split4 => ({ igst: 0, cgst: 0, sgst: 0, cess: 0 });

const r4 = (s: Split4): Split4 => ({
  igst: round2(s.igst), cgst: round2(s.cgst), sgst: round2(s.sgst), cess: round2(s.cess),
});

const sum4 = (s: Split4): number => s.igst + s.cgst + s.sgst + s.cess;

function inr(n: number): string {
  const v = Math.abs(round2(n));
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── outward classification ───────────────────────────────────────────────── */

/**
 * Documents that carry no outward supply at all.
 *  • DELIVERY_CHALLAN — movement of goods, not a supply.
 *  • PAYMENT_VOUCHER  — the recipient's RCM self-invoice; it is an INWARD
 *    supply and is picked up by the 3.1(d) pass, never by 3.1(a).
 */
function isNonOutwardDoc(inv: InvoiceV2): boolean {
  return inv.doc_type === 'DELIVERY_CHALLAN' || inv.doc_type === 'PAYMENT_VOUCHER';
}

/**
 * Whole-document zero rating for 3.1(b): physical exports and SEZ supplies,
 * with or without payment of tax. DEEMED EXPORT is deliberately NOT zero-rated
 * — deemed exports are reported in 3.1(a) (same rule as the GSTR-1 source).
 */
function isZeroRatedDoc(inv: InvoiceV2): boolean {
  if (inv.buyer_type === 'OVERSEAS' || inv.buyer_type === 'SEZ') return true;
  if (inv.invoice_type === 'SEWP' || inv.invoice_type === 'SEWOP') return true;
  if (inv.gstr1_table === 'EXP' || inv.gstr1_table === 'EXPA') return true;
  if (inv.gstr1_table === 'SEWP' || inv.gstr1_table === 'SEWOP') return true;
  if (inv.bos_reason === 'EXPORT_LUT') return true;
  if (inv.cdnur_type === 'EXPWP' || inv.cdnur_type === 'EXPWOP') return true;
  return false;
}

interface Portions {
  /** 3.1(a) — taxable */
  taxable: number;
  /** 3.1(b) — zero-rated portion sitting inside an otherwise domestic document */
  zero: number;
  /** 3.1(c) — nil-rated + exempt */
  nilExempt: number;
  /** 3.1(e) — non-GST */
  nonGst: number;
  /** true when the bill-of-supply reason had to stand in for line-level natures */
  usedBosFallback: boolean;
}

/**
 * Split ONE document's `total_taxable` across the 3.1 lines.
 *
 * Line-level `supply_nature` is the authority when items are present (it is
 * what `recalculateInvoiceTotals` itself uses); the invoice-level
 * nil_rated_value / exempt_value / non_gst_value totals are the fallback for
 * legacy rows saved without items. A BILL_OF_SUPPLY whose lines say nothing is
 * classified from `bos_reason` — a bill of supply is never a taxable supply.
 */
function splitDocument(inv: InvoiceV2): Portions {
  const total = num(inv.total_taxable);
  const out: Portions = { taxable: 0, zero: 0, nilExempt: 0, nonGst: 0, usedBosFallback: false };

  const items = Array.isArray(inv.items) ? inv.items : [];
  if (items.length) {
    for (const it of items) {
      const v = num(it.taxable_value);
      if (it.supply_nature === 'ZERO_RATED') out.zero += v;
      else if (it.supply_nature === 'NIL_RATED' || it.supply_nature === 'EXEMPT') out.nilExempt += v;
      else if (it.supply_nature === 'NON_GST') out.nonGst += v;
    }
  } else {
    out.nilExempt = num(inv.nil_rated_value) + num(inv.exempt_value);
    out.nonGst = num(inv.non_gst_value);
  }

  if (inv.doc_type === 'BILL_OF_SUPPLY' && out.zero + out.nilExempt + out.nonGst === 0) {
    out.usedBosFallback = true;
    if (inv.bos_reason === 'NON_GST') out.nonGst = total;
    else if (inv.bos_reason === 'MRP_INCLUSIVE') out.usedBosFallback = false; // MRP-inclusive IS taxable
    else out.nilExempt = total; // COMPOSITION / EXEMPT / NIL_RATED / unspecified
  }

  // Never let the classified portions exceed the document value.
  const classified = out.zero + out.nilExempt + out.nonGst;
  out.taxable = total - classified;
  if (out.taxable < 0) {
    out.taxable = 0;
    if (classified > 0 && total >= 0) {
      const k = total / classified;
      out.zero *= k; out.nilExempt *= k; out.nonGst *= k;
    }
  }
  return out;
}

/* ── the computation (pure — takes month-filtered data) ───────────────────── */

export interface AccountsMonthResult {
  values: Partial<Gstr3bMonthData>;
  notes: string[];
  /** Nothing at all in the books for the month. */
  empty: boolean;
}

/**
 * Build the month from already month-filtered registers + journal entries.
 * Exported so it can be unit-/smoke-tested without any storage.
 */
export function computeAccountsMonth(
  sales: InvoiceV2[],
  purchases: PurchaseInvoice[],
  entries: JournalEntry[],
): AccountsMonthResult {
  const notes: string[] = [];

  /* 1 ── outward: split the register into a zero-rated set and the rest.
         Sales-side DEBIT_NOTEs stay in the main set: the engine excludes them
         from outward supplies and uses them as the ITC reversal. */
  const live = sales.filter((s) => s.status !== 'CANCELLED');
  const outwardDocs = live.filter((s) => !isNonOutwardDoc(s));
  const zeroDocs = outwardDocs.filter((s) => s.doc_type !== 'DEBIT_NOTE' && isZeroRatedDoc(s));
  const zeroIds = new Set(zeroDocs.map((s) => s.id));
  const mainDocs = outwardDocs.filter((s) => !zeroIds.has(s.id));

  /* 2 ── purchases: RCM is a separate world (3.1(d) + ISRC credit). */
  const rcmPurchases = purchases.filter((p) => !!p.rcm_applicable);
  const nonRcmPurchases = purchases.filter((p) => !p.rcm_applicable);

  /* 3 ── the engines. */
  const main = computeGSTR3BFromInvoices(mainDocs, nonRcmPurchases);
  const zero = computeGSTR3BFromInvoices(zeroDocs, []);
  const rcmItc = computeGSTR3BFromInvoices([], rcmPurchases);

  /* 4 ── the parts the engine does not model: 3.1(b)/(c)/(e) and cess. */
  let zeroInMain = 0, nilExempt = 0, nonGst = 0, cess = 0, bosFallbacks = 0;
  for (const inv of mainDocs) {
    if (inv.doc_type === 'DEBIT_NOTE') continue; // purchase-return doc, not outward
    const sign = inv.doc_type === 'CREDIT_NOTE' ? -1 : 1;
    const p = splitDocument(inv);
    zeroInMain += sign * p.zero;
    nilExempt += sign * p.nilExempt;
    nonGst += sign * p.nonGst;
    cess += sign * num(inv.total_cess);
    if (p.usedBosFallback) bosFallbacks += 1;
  }
  let zeroTotal = num(zero.outwardSupplies.taxableValue) + zeroInMain;
  for (const inv of zeroDocs) {
    // A non-GST / exempt line inside an export document still belongs on its own line.
    const sign = inv.doc_type === 'CREDIT_NOTE' ? -1 : 1;
    const items = Array.isArray(inv.items) ? inv.items : [];
    for (const it of items) {
      if (it.supply_nature === 'NON_GST') { nonGst += sign * num(it.taxable_value); zeroTotal -= sign * num(it.taxable_value); }
      else if (it.supply_nature === 'NIL_RATED' || it.supply_nature === 'EXEMPT') { nilExempt += sign * num(it.taxable_value); zeroTotal -= sign * num(it.taxable_value); }
    }
  }

  const txval31c = round2(nilExempt);
  const txval31e = round2(nonGst);
  const txval31b = round2(zeroTotal);
  const txval31a = round2(num(main.outwardSupplies.taxableValue) - nilExempt - nonGst - zeroInMain);

  const taxNonRcm = r4({
    igst: num(main.outwardSupplies.igst),
    cgst: num(main.outwardSupplies.cgst),
    sgst: num(main.outwardSupplies.sgst),
    cess,
  });

  /* 5 ── 3.1(d): RCM purchases + recipient-issued payment vouchers. */
  const paymentVouchers = live.filter((s) => s.doc_type === 'PAYMENT_VOUCHER');
  const rcmTax = zero4();
  let txval31d = 0;
  for (const p of rcmPurchases) {
    txval31d += num(p.taxable_value);
    rcmTax.igst += num(p.igst);
    rcmTax.cgst += num(p.cgst);
    rcmTax.sgst += num(p.sgst);
  }
  for (const pv of paymentVouchers) {
    txval31d += num(pv.total_taxable);
    rcmTax.igst += num(pv.total_igst);
    rcmTax.cgst += num(pv.total_cgst);
    rcmTax.sgst += num(pv.total_sgst);
    rcmTax.cess += num(pv.total_cess);
  }

  /* 6 ── Table 5 inward: exempt / nil / composition vs non-GST. */
  let inward5Exmp = 0, inward5NonGst = 0;
  for (const p of nonRcmPurchases) {
    if (p.bucket !== 'EXEMPT_NIL') continue;
    const v = num(p.taxable_value);
    if (/non[\s_-]?gst/i.test(p.purchase_sub_type ?? '')) inward5NonGst += v;
    else inward5Exmp += v;
  }

  /* 7 ── ITC. */
  const itcNonRcm = r4({
    igst: num(main.itcAvailed.igst) - num(main.itcReversed.igst),
    cgst: num(main.itcAvailed.cgst) - num(main.itcReversed.cgst),
    sgst: num(main.itcAvailed.sgst) - num(main.itcReversed.sgst),
    cess: 0,
  });
  const itcRcm = r4({
    igst: num(rcmItc.itcAvailed.igst),
    cgst: num(rcmItc.itcAvailed.cgst),
    sgst: num(rcmItc.itcAvailed.sgst),
    cess: 0,
  });

  const values: Partial<Gstr3bMonthData> = {
    txval31a, txval31b, txval31c, txval31e,
    txval31d: round2(txval31d),
    taxNonRcm,
    taxRcm: r4(rcmTax),
    itcNonRcm,
    itcRcm,
    inward5Exmp: round2(inward5Exmp),
    inward5NonGst: round2(inward5NonGst),
  };

  /* 8 ── provenance notes. */
  const docCount = outwardDocs.filter((s) => s.doc_type !== 'DEBIT_NOTE').length;
  notes.push(
    `Books: ${docCount} outward document(s), ${purchases.length} purchase(s)` +
    (rcmPurchases.length ? `, ${rcmPurchases.length} under RCM` : '') +
    (paymentVouchers.length ? `, ${paymentVouchers.length} payment voucher(s)` : '') + '.',
  );
  if (rcmPurchases.length && paymentVouchers.length) {
    notes.push('3.1(d) adds RCM purchases AND payment vouchers — check the same supply is not recorded twice.');
  }
  const zeroTax = num(zero.outwardSupplies.igst) + num(zero.outwardSupplies.cgst) + num(zero.outwardSupplies.sgst);
  if (Math.abs(zeroTax) >= 1) {
    notes.push(`Zero-rated documents carry ${inr(zeroTax)} of tax (export with payment); Table 3.1(b) in this model holds the value only — enter the IGST on the portal.`);
  }
  if (bosFallbacks) {
    notes.push(`${bosFallbacks} bill(s) of supply had no line-level supply nature — classified from the bill-of-supply reason.`);
  }

  /* 9 ── ledger tie-out (never adjusts, only reports). */
  notes.push(...ledgerCrossCheck(entries, values));

  const empty =
    sales.length === 0 && purchases.length === 0 && entries.length === 0;

  return { values, notes, empty };
}

/**
 * Compare the books totals against the journal ledger movement for the month.
 * Returns human notes only — figures are never silently adjusted.
 */
function ledgerCrossCheck(entries: JournalEntry[], values: Partial<Gstr3bMonthData>): string[] {
  const notes: string[] = [];
  if (!entries.length) return ['No journal entries in the month — ledger cross-check skipped.'];

  let balances: ReturnType<typeof computeAllBalances> = [];
  try {
    balances = computeAllBalances(entries);
  } catch {
    return ['Ledger cross-check unavailable (journal balances could not be computed).'];
  }

  let outputLedger = 0, inputLedger = 0, outAccts = 0, inAccts = 0;
  for (const b of balances) {
    const signedDr = b.balance_type === 'Dr' ? num(b.balance) : -num(b.balance);
    if (GST_OUTPUT_LEDGER_GROUPS.includes(b.account_group)) {
      outputLedger += -signedDr; // liability: net credit movement = tax charged
      outAccts += 1;
    } else if (GST_INPUT_LEDGER_GROUPS.includes(b.account_group)) {
      inputLedger += signedDr;   // asset: net debit movement = credit taken
      inAccts += 1;
    }
  }

  if (!outAccts && !inAccts) {
    return ['No GST ledger accounts posted in the month — ledger cross-check skipped.'];
  }

  const booksOutput = sum4(values.taxNonRcm ?? zero4()) + sum4(values.taxRcm ?? zero4());
  const booksItc = sum4(values.itcNonRcm ?? zero4()) + sum4(values.itcRcm ?? zero4());

  if (outAccts) {
    const d = round2(booksOutput - outputLedger);
    if (Math.abs(d) >= 1) {
      notes.push(`books vs ledger: output tax differs by ${inr(d)} (books ${d > 0 ? 'higher' : 'lower'} than ${GST_OUTPUT_LEDGER_GROUPS.join(' / ')}).`);
    } else {
      notes.push('books vs ledger: output tax ties to the GST output ledgers.');
    }
  } else {
    notes.push('No GST output-tax ledger accounts posted in the month — output tie-out skipped.');
  }

  if (inAccts) {
    const d = round2(booksItc - inputLedger);
    if (Math.abs(d) >= 1) {
      notes.push(`books vs ledger: input tax credit differs by ${inr(d)} (books ${d > 0 ? 'higher' : 'lower'} than ${GST_INPUT_LEDGER_GROUPS.join(' / ')}).`);
    } else {
      notes.push('books vs ledger: input tax credit ties to the GST input ledgers.');
    }
  } else {
    notes.push('No GST input-credit ledger accounts posted in the month — ITC tie-out skipped.');
  }

  return notes;
}

/* ── the source adapter ───────────────────────────────────────────────────── */

/**
 * Gstr3bSourceFn: the full month from the company's own books, cross-checked
 * against the journal ledger accounts.
 *
 * Always offline — `calls: 0`, never `needsSession`. An empty month returns
 * `{ ok:true, noData:true }` with an empty patch; any failure returns
 * `{ ok:false, error }`. It never throws.
 */
export const gstr3bFromAccounts: Gstr3bSourceFn = async ({
  companyId, period,
}): Promise<SourceResult> => {
  try {
    if (!companyId) return { ok: false, error: 'A company is required to read its books.' };
    if (!period || !/^\d{6}$/.test(period)) {
      return { ok: false, error: 'A return period in MMYYYY form is required.' };
    }
    const { year, month } = parsePeriod(period);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return { ok: false, error: `"${period}" is not a valid MMYYYY return period.` };
    }

    const { from, to } = calendarMonthRangeIso(year, month);
    const inMonth = (d?: string) => !!d && d >= from && d <= to;

    let sales: InvoiceV2[] = [];
    let purchases: PurchaseInvoice[] = [];
    let entries: JournalEntry[] = [];
    try { sales = listInvoicesV2(companyId).filter((s) => inMonth(s.invoice_date)); } catch { sales = []; }
    try { purchases = listPurchaseInvoices(companyId).filter((p) => inMonth(p.invoice_date)); } catch { purchases = []; }
    try { entries = listJournalEntries(companyId, { fromDate: from, toDate: to }); } catch { entries = []; }

    const { values, notes, empty } = computeAccountsMonth(sales, purchases, entries);
    const at = new Date().toISOString();

    if (empty) {
      return {
        ok: true,
        noData: true,
        patch: { source: 'accounts', values: {}, at, calls: 0, notes: `No invoices or journal entries in the books for ${period}.` },
      };
    }

    const patch: Gstr3bPatch = { source: 'accounts', values, at, calls: 0, notes: notes.join(' ') };
    return { ok: true, patch };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not build GSTR-3B from the books.' };
  }
};

export default gstr3bFromAccounts;
