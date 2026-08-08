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

/** Peel the Sandbox envelope ({ code, data: … }, 2B double-wraps) down to the GSTN payload. */
function unwrap(raw: any): any {
  let p = raw;
  if (p && typeof p === 'object' && p.data && typeof p.data === 'object') p = p.data;
  // 2B is often { data: { data: { docdata … } } }
  if (p && typeof p === 'object' && p.data && typeof p.data === 'object'
      && !('docdata' in p) && !('b2b' in p)) p = p.data;
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
        docDate: str(d?.idt ?? d?.nt_dt ?? d?.ntdt),
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

  // ITC summary (2B) — best-effort from itcsumm; fall back to summing the rows.
  let itcSummary: ItcSummary | null = null;
  const s: any = p?.itcsumm;
  if (s && typeof s === 'object') {
    const src = s.itcavl ?? s.itc_avl ?? s;
    const igst = num(src.igst ?? src.iamt);
    const cgst = num(src.cgst ?? src.camt);
    const sgst = num(src.sgst ?? src.samt);
    const cess = num(src.cess ?? src.csamt);
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
