// Pure flatteners: Sandbox GSTR-2A / 2B JSON -> normalised invoice rows + ITC summary.
//
// These follow the documented GSTN 2A/2B schema. They are intentionally
// DEFENSIVE (tolerant of envelope nesting and per-item vs invoice-level tax) and
// keep the raw JSON alongside, so nothing is lost if a shape differs — reconcile
// against the first live pull before trusting edge sections.

import type { GstInvoiceRow, GstReturnType, ItcSummary } from './types';

function num(x: unknown): number {
  if (x == null) return 0;
  const n = typeof x === 'string' ? parseFloat(x) : (x as number);
  return Number.isFinite(n) ? n : 0;
}
function str(x: unknown): string {
  return x == null ? '' : String(x);
}

/** Peel the Sandbox envelope down to the object that actually holds the sections.
 *
 *  Depth varies by return, so a fixed number of hops is wrong:
 *    2A: { code, data: { status_cd, data: { b2b … } } }            → 2 hops
 *    2B: { code, data: { status_cd, data: { chksum, data: {        → 3 hops
 *           gstin, rtnprd, itcsumm, docdata: { b2b … } } } } }
 *  (verified against the official Sandbox response schema for gstr-2b/document).
 *  Descend through `.data` until we reach a level that carries `docdata` or a
 *  known section — peeling a fixed 2 levels made every 2B read as nil. */
function unwrap(raw: any): any {
  let p = raw;
  for (let hop = 0; hop < 6; hop++) {
    if (!p || typeof p !== 'object') break;
    if ('docdata' in p) return p;
    if (ALL_SECTIONS.some((k) => k in p)) return p;
    if (p.data && typeof p.data === 'object') { p = p.data; continue; }
    break;
  }
  return p ?? {};
}

const ALL_SECTIONS = ['b2b', 'b2ba', 'cdn', 'cdna', 'cdnr', 'cdnra', 'cdnur', 'cdnura',
  'isd', 'isda', 'impg', 'impgsez', 'tcs', 'tds', 'ecom', 'ecoma'];

/** GSTN business-failure envelope: HTTP 200 with { data: { status_cd:'0', error } }.
 *  These are NOT transport errors, so the HTTP layer reports success — but the
 *  request genuinely failed and the reason must be shown, never mistaken for an
 *  empty period. */
export function gstnBusinessError(raw: any): { code: string; message: string } | null {
  const envelope = raw?.data ?? raw;
  const err = envelope?.error ?? envelope?.data?.error;
  const statusCd = String(envelope?.status_cd ?? envelope?.data?.status_cd ?? '');
  if (!err && statusCd !== '0') return null;
  if (!err) return null;
  return {
    code: str(err.error_cd ?? err.errorCode ?? ''),
    message: str(err.message ?? err.error_desc ?? 'The GST portal rejected the request.'),
  };
}

/** GSTN codes / messages that genuinely mean "this period is empty", not a failure. */
const NO_DATA_CODES = new Set(['RET13509', 'RET11416', 'RT-3BAS1009', 'RET2B1023', 'RET2B1016']);

/** True when a business error is really just "nothing filed for this period". */
export function isNoDataError(e: { code: string; message: string } | null): boolean {
  if (!e) return false;
  return NO_DATA_CODES.has(e.code.toUpperCase()) || /no\s*(data|records?)\s*(found|available)?/i.test(e.message);
}

/** True when the portal returned an empty period (no populated section). */
export function isNoData(raw: any): boolean {
  const p = unwrap(raw);
  const doc = p?.docdata ?? p;
  return !ALL_SECTIONS.some((k) => Array.isArray(doc?.[k]) && doc[k].length > 0);
}

/** Sum tax from per-item detail (2A style) or invoice-level fields (2B style). */
function invoiceTax(inv: any): Pick<GstInvoiceRow, 'taxableValue' | 'igst' | 'cgst' | 'sgst' | 'cess'> {
  if (Array.isArray(inv?.itms) && inv.itms.length) {
    let t = 0, i = 0, c = 0, s = 0, ce = 0;
    for (const it of inv.itms) {
      const d = it?.itm_det ?? it ?? {};
      t += num(d.txval); i += num(d.iamt); c += num(d.camt); s += num(d.samt); ce += num(d.csamt);
    }
    return { taxableValue: t, igst: i, cgst: c, sgst: s, cess: ce };
  }
  return {
    taxableValue: num(inv?.txval),
    igst: num(inv?.igst ?? inv?.iamt),
    cgst: num(inv?.cgst ?? inv?.camt),
    sgst: num(inv?.sgst ?? inv?.samt),
    cess: num(inv?.cess ?? inv?.csamt),
  };
}

/** Supplier-keyed sections (b2b/cdnr/isd…): each supplier holds an invoice/note array. */
function parseSupplierSection(list: any[] | undefined, section: string, docKey: 'inv' | 'nt'): GstInvoiceRow[] {
  const rows: GstInvoiceRow[] = [];
  for (const sup of list ?? []) {
    const supplierGstin = str(sup?.ctin);
    const supplierName = str(sup?.trdnm ?? sup?.lgnm ?? sup?.cfnm);
    for (const d of sup?.[docKey] ?? []) {
      rows.push({
        section,
        supplierGstin,
        supplierName,
        docNo: str(d?.inum ?? d?.nt_num ?? d?.ntnum),
        // 2A uses idt / nt_dt; 2B uses a plain `dt` on every document.
        docDate: str(d?.idt ?? d?.nt_dt ?? d?.ntdt ?? d?.dt),
        docType: str(d?.typ ?? d?.ntty ?? ''),
        pos: str(d?.pos ?? ''),
        reverseCharge: str(d?.rev ?? d?.rchrg ?? ''),
        invoiceValue: num(d?.val),
        ...invoiceTax(d),
        itcAvailable: d?.itcavl != null ? str(d.itcavl) : undefined,
        itcReason: d?.rsn != null && str(d.rsn) ? str(d.rsn) : undefined,
      });
    }
  }
  return rows;
}

/** Credit/debit notes to UNREGISTERED persons: a flat note list, no ctin grouping. */
function parseFlatNotes(list: any[] | undefined, section: string): GstInvoiceRow[] {
  return (list ?? []).map((d: any) => ({
    section,
    supplierGstin: str(d?.ctin ?? ''),
    supplierName: str(d?.trdnm ?? d?.lgnm ?? ''),
    docNo: str(d?.nt_num ?? d?.ntnum ?? d?.inum),
    docDate: str(d?.nt_dt ?? d?.ntdt ?? d?.idt),
    docType: str(d?.ntty ?? d?.typ ?? ''),
    pos: str(d?.pos ?? ''),
    reverseCharge: str(d?.rev ?? d?.rchrg ?? ''),
    invoiceValue: num(d?.val),
    ...invoiceTax(d),
  }));
}

/** TDS deducted (GSTR-2A TDS): one row per deductor, no invoice document. */
function parseTds(list: any[] | undefined): GstInvoiceRow[] {
  return (list ?? []).map((d: any) => ({
    section: 'TDS',
    supplierGstin: str(d?.gstin_ded ?? d?.ctin ?? ''),
    supplierName: str(d?.trdnm ?? d?.lgnm ?? ''),
    docNo: '', docDate: str(d?.dt ?? ''), docType: '', pos: '', reverseCharge: '',
    invoiceValue: num(d?.amt_ded),
    taxableValue: num(d?.amt_ded),
    igst: num(d?.iamt), cgst: num(d?.camt), sgst: num(d?.samt), cess: 0,
  }));
}

/** TCS collected (GSTR-2A TCS): one row per e-commerce operator. */
function parseTcs(list: any[] | undefined): GstInvoiceRow[] {
  return (list ?? []).map((d: any) => ({
    section: 'TCS',
    supplierGstin: str(d?.etin ?? d?.ctin ?? ''),
    supplierName: str(d?.trdnm ?? d?.lgnm ?? ''),
    docNo: str(d?.m_id ?? ''), docDate: '', docType: '', pos: '', reverseCharge: '',
    invoiceValue: num(d?.sup_val),
    taxableValue: num(d?.tx_val),
    igst: num(d?.iamt), cgst: num(d?.camt), sgst: num(d?.samt), cess: num(d?.csamt),
  }));
}

/** Import of goods (IMPG / IMPGSEZ): flat bill-of-entry rows, IGST only. */
function parseImpg(list: any[] | undefined, section: string): GstInvoiceRow[] {
  const rows: GstInvoiceRow[] = [];
  for (const e of list ?? []) {
    rows.push({
      section,
      supplierGstin: str(e?.ctin ?? ''),
      supplierName: str(e?.trdnm ?? ''),
      docNo: str(e?.benum ?? ''),
      docDate: str(e?.bedt ?? ''),
      docType: str(e?.portcode ?? ''),
      pos: '',
      reverseCharge: '',
      invoiceValue: num(e?.val),
      taxableValue: num(e?.txval),
      igst: num(e?.igst ?? e?.iamt),
      cgst: 0,
      sgst: 0,
      cess: num(e?.cess ?? e?.csamt),
    });
  }
  return rows;
}

/** Flatten a 2A or 2B response into rows + (2B) ITC summary. */
export function parseReturn(_type: GstReturnType, raw: any): { rows: GstInvoiceRow[]; itcSummary: ItcSummary | null } {
  const p = unwrap(raw);
  const doc = p?.docdata ?? p; // 2B nests sections under docdata; 2A has them at top
  const rows: GstInvoiceRow[] = [
    ...parseSupplierSection(doc?.b2b, 'B2B', 'inv'),
    ...parseSupplierSection(doc?.b2ba, 'B2BA', 'inv'),
    ...parseSupplierSection(doc?.cdn, 'CDN', 'nt'),
    ...parseSupplierSection(doc?.cdna, 'CDNA', 'nt'),
    ...parseSupplierSection(doc?.cdnr, 'CDNR', 'nt'),
    ...parseSupplierSection(doc?.cdnra, 'CDNRA', 'nt'),
    ...parseSupplierSection(doc?.isd, 'ISD', 'inv'),
    ...parseSupplierSection(doc?.isda, 'ISDA', 'inv'),
    ...parseImpg(doc?.impg, 'IMPG'),
    ...parseImpg(doc?.impgsez, 'IMPGSEZ'),
    // Sections isNoData() counts but that previously produced no rows — a period
    // holding only these looked "downloaded" while the table stayed empty.
    ...parseSupplierSection(doc?.ecom, 'ECOM', 'inv'),
    ...parseSupplierSection(doc?.ecoma, 'ECOMA', 'inv'),
    ...parseFlatNotes(doc?.cdnur, 'CDNUR'),
    ...parseFlatNotes(doc?.cdnura, 'CDNURA'),
    ...parseTds(doc?.tds),
    ...parseTcs(doc?.tcs),
  ];

  // ITC summary (2B). itcsumm.itcavl is NOT a flat tax object — it splits into
  // nonrevsup / isdsup / revsup / imports / othersup, each carrying its own
  // igst/cgst/sgst/cess. Reading it as flat returned zeros for every KPI, so sum
  // the buckets. (Shape verified against the official gstr-2b response schema.)
  let itcSummary: ItcSummary | null = null;
  const s: any = (p?.itcsumm ?? p?.data?.itcsumm);
  if (s && typeof s === 'object') {
    const avl: any = s.itcavl ?? s.itc_avl ?? s;
    let igst = 0, cgst = 0, sgst = 0, cess = 0;
    const add = (o: any) => {
      igst += num(o?.igst ?? o?.iamt); cgst += num(o?.cgst ?? o?.camt);
      sgst += num(o?.sgst ?? o?.samt); cess += num(o?.cess ?? o?.csamt);
    };
    const buckets = ['nonrevsup', 'isdsup', 'revsup', 'imports', 'othersup']
      .map((k) => avl?.[k]).filter((b) => b && typeof b === 'object');
    if (buckets.length) buckets.forEach(add);
    else add(avl);                       // older/flat shape
    if (igst || cgst || sgst || cess) itcSummary = { igst, cgst, sgst, cess, total: igst + cgst + sgst + cess };
  }
  if (!itcSummary && rows.length) {
    const t = rows.reduce((a, r) => ({
      igst: a.igst + r.igst, cgst: a.cgst + r.cgst, sgst: a.sgst + r.sgst, cess: a.cess + r.cess,
    }), { igst: 0, cgst: 0, sgst: 0, cess: 0 });
    itcSummary = { ...t, total: t.igst + t.cgst + t.sgst + t.cess };
  }

  return { rows, itcSummary };
}
