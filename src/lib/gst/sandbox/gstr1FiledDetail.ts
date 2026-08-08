// Round-trip: take the GST portal's FILED GSTR-1 (per section) and parse it back
// into the app's invoice-wise rows, so an imported month previews exactly like
// the app's own section views (not a raw/foreign format).
//
// Portal section shapes (observed on live test data):
//   b2b   : { b2b:  [{ ctin, inv:[{ inum, idt, val, pos, inv_typ, itms:[{itm_det:{rt,txval,iamt,camt,samt,csamt}}] }] }] }
//   b2cl  : { b2cl: [{ pos,  inv:[{ inum, idt, val,       itms:[{itm_det:{rt,txval,iamt}}] }] }] }
//   b2cs  : { b2cs: [{ sply_ty, pos, rt, txval, iamt, camt, samt, csamt, typ }] }
//   cdnr  : { cdnr: [{ ctin, nt:[{ ntnum, ntdt, val, ntty, itms:[{itm_det}] }] }] }
//   cdnur : { cdnur:[{ typ, ntty, ntnum, ntdt, val, pos, itms:[{itm_det}] }] }
//   exp   : { exp:  [{ exp_typ, inv:[{ inum, idt, val, sbnum, sbdt, itms:[{txval,rt,iamt}] }] }] }
//   hsn   : { hsn:  { data:[{ num, hsn_sc, desc, uqc, qty, txval, rt, iamt, camt, samt, csamt }] } }

import { sandboxClient } from './client';

export interface FiledRow {
  party?: string; doc?: string; date?: string; type?: string; pos?: string;
  rate?: number; taxable?: number; igst?: number; cgst?: number; sgst?: number; cess?: number; value?: number;
  hsn?: string; desc?: string; uqc?: string; qty?: number; // HSN
  odoc?: string; odate?: string;                            // amendments: original doc no / date
  nilAmt?: number; exptAmt?: number; ngsupAmt?: number;     // NIL: nil-rated / exempt / non-GST
  from?: string; to?: string; totnum?: number; cancel?: number; net?: number; // DOC issue
}
export interface FiledSection { key: string; label: string; kind: 'inv' | 'hsn' | 'nil' | 'adv' | 'doc'; rows: FiledRow[] }

const det = (itms: any): any => (Array.isArray(itms) ? (itms[0]?.itm_det ?? itms[0] ?? {}) : {});

function parseB2B(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.b2b ?? []) for (const inv of g.inv ?? []) {
    const t = det(inv.itms);
    out.push({ party: g.ctin, doc: inv.inum, date: inv.idt, type: inv.inv_typ, pos: inv.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, cgst: t.camt, sgst: t.samt, cess: t.csamt, value: inv.val });
  }
  return out;
}
function parseB2CL(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.b2cl ?? []) for (const inv of g.inv ?? []) {
    const t = det(inv.itms);
    out.push({ doc: inv.inum, date: inv.idt, pos: g.pos ?? inv.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, value: inv.val });
  }
  return out;
}
function parseB2CS(d: any): FiledRow[] {
  return (d?.b2cs ?? []).map((s: any) => ({ type: s.sply_ty, pos: s.pos, rate: s.rt, taxable: s.txval, igst: s.iamt, cgst: s.camt, sgst: s.samt, cess: s.csamt }));
}
function parseCDNR(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.cdnr ?? []) for (const n of g.nt ?? []) {
    const t = det(n.itms);
    out.push({ party: g.ctin, doc: n.ntnum, date: n.ntdt, type: n.ntty, rate: t.rt, taxable: t.txval, igst: t.iamt, cgst: t.camt, sgst: t.samt, cess: t.csamt, value: n.val });
  }
  return out;
}
function parseCDNUR(d: any): FiledRow[] {
  return (d?.cdnur ?? []).map((n: any) => { const t = det(n.itms); return { doc: n.ntnum, date: n.ntdt, type: n.ntty, pos: n.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, value: n.val }; });
}
function parseEXP(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.exp ?? []) for (const inv of g.inv ?? []) {
    const t = det(inv.itms);
    out.push({ type: g.exp_typ, doc: inv.inum, date: inv.idt, taxable: t.txval, rate: t.rt, igst: t.iamt, value: inv.val });
  }
  return out;
}
function parseHSN(d: any): FiledRow[] {
  // Portal returns the Phase-3 split (hsn_b2b/hsn_b2c); older/flat returns hsn.data.
  // Read ALL of them (the prior `.data`-only read went blind on a real split GET).
  const h = d?.hsn ?? d ?? {};
  const rows = [...(h.hsn_b2b ?? []), ...(h.hsn_b2c ?? []), ...(h.data ?? [])];
  return rows.map((r: any) => ({ hsn: r.hsn_sc, desc: r.desc, uqc: r.uqc, qty: r.qty, rate: r.rt, taxable: r.txval, igst: r.iamt, cgst: r.camt, sgst: r.samt, cess: r.csamt }));
}

// ── Amendment sections (carry the ORIGINAL doc/date reference) ───────────────
//   invoice amendments: oinum/oidt = original; inum/idt = revised
//   note amendments:    ont_num/ont_dt = original; nt_num/nt_dt = revised (underscores!)
//   aggregate amendments (b2csa/ata/txpda): omon = original month (MMYYYY), no doc no.
function parseB2BA(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.b2ba ?? []) for (const inv of g.inv ?? []) {
    const t = det(inv.itms);
    out.push({ party: g.ctin, odoc: inv.oinum, odate: inv.oidt, doc: inv.inum, date: inv.idt, type: inv.inv_typ, pos: inv.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, cgst: t.camt, sgst: t.samt, cess: t.csamt, value: inv.val });
  }
  return out;
}
function parseB2CLA(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.b2cla ?? []) for (const inv of g.inv ?? []) {
    const t = det(inv.itms);
    out.push({ odoc: inv.oinum, odate: inv.oidt, doc: inv.inum, date: inv.idt, pos: g.pos ?? inv.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, cgst: t.camt, sgst: t.samt, cess: t.csamt, value: inv.val });
  }
  return out;
}
function parseB2CSA(d: any): FiledRow[] {
  return (d?.b2csa ?? []).map((s: any) => { const t = det(s.itms); return { odate: s.omon, type: s.sply_ty ?? s.typ, pos: s.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, cgst: t.camt, sgst: t.samt, cess: t.csamt }; });
}
function parseCDNRA(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.cdnra ?? []) for (const n of g.nt ?? []) {
    const t = det(n.itms);
    out.push({ party: g.ctin, odoc: n.ont_num, odate: n.ont_dt, doc: n.nt_num, date: n.nt_dt, type: n.ntty, pos: n.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, cgst: t.camt, sgst: t.samt, cess: t.csamt, value: n.val });
  }
  return out;
}
function parseCDNURA(d: any): FiledRow[] {
  return (d?.cdnura ?? []).map((n: any) => { const t = det(n.itms); return { odoc: n.ont_num, odate: n.ont_dt, doc: n.nt_num, date: n.nt_dt, type: n.ntty, pos: n.pos, rate: t.rt, taxable: t.txval, igst: t.iamt, cess: t.csamt, value: n.val }; });
}
function parseEXPA(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const g of d?.expa ?? []) for (const inv of g.inv ?? []) {
    const t = det(inv.itms);
    out.push({ type: g.exp_typ, odoc: inv.oinum, odate: inv.oidt, doc: inv.inum, date: inv.idt, rate: t.rt, taxable: t.txval, igst: t.iamt, cess: t.csamt, value: inv.val });
  }
  return out;
}
// ── Other sections ───────────────────────────────────────────────────────────
function parseNIL(d: any): FiledRow[] {
  return (d?.nil?.inv ?? []).map((r: any) => ({ type: r.sply_ty, nilAmt: r.nil_amt, exptAmt: r.expt_amt, ngsupAmt: r.ngsup_amt }));
}
function parseAdv(d: any, key: string): FiledRow[] {   // at / ata / txpd / txpda — rate-wise advances
  const out: FiledRow[] = [];
  for (const s of d?.[key] ?? []) for (const itm of s.itms ?? []) {
    out.push({ odate: s.omon, type: s.sply_ty, pos: s.pos, rate: itm.rt, taxable: itm.ad_amt, igst: itm.iamt, cgst: itm.camt, sgst: itm.samt, cess: itm.csamt });
  }
  return out;
}
function parseDoc(d: any): FiledRow[] {
  const out: FiledRow[] = [];
  for (const dd of d?.doc_issue?.doc_det ?? []) for (const doc of dd.docs ?? []) {
    out.push({ type: String(dd.doc_num ?? ''), from: doc.from, to: doc.to, totnum: doc.totnum, cancel: doc.cancel, net: doc.net_issue });
  }
  return out;
}

// sec_nm (from summary, UPPERCASE) → { key: canonical/FiledSection key, url: endpoint
// segment when it differs from key, parse, kind }.
const SECTIONS: Record<string, { key: string; url?: string; label: string; parse: (d: any) => FiledRow[]; kind: FiledSection['kind'] }> = {
  B2B: { key: 'b2b', label: 'B2B', parse: parseB2B, kind: 'inv' },
  B2CL: { key: 'b2cl', label: 'B2CL', parse: parseB2CL, kind: 'inv' },
  B2CS: { key: 'b2cs', label: 'B2CS', parse: parseB2CS, kind: 'inv' },
  CDNR: { key: 'cdnr', label: 'CDNR', parse: parseCDNR, kind: 'inv' },
  CDNUR: { key: 'cdnur', label: 'CDNUR', parse: parseCDNUR, kind: 'inv' },
  EXP: { key: 'exp', label: 'EXP', parse: parseEXP, kind: 'inv' },
  HSN: { key: 'hsn', label: 'HSN', parse: parseHSN, kind: 'hsn' },
  // amendments
  B2BA: { key: 'b2ba', label: 'B2B (amended)', parse: parseB2BA, kind: 'inv' },
  B2CLA: { key: 'b2cla', label: 'B2CL (amended)', parse: parseB2CLA, kind: 'inv' },
  B2CSA: { key: 'b2csa', label: 'B2CS (amended)', parse: parseB2CSA, kind: 'inv' },
  CDNRA: { key: 'cdnra', label: 'CDNR (amended)', parse: parseCDNRA, kind: 'inv' },
  CDNURA: { key: 'cdnura', label: 'CDNUR (amended)', parse: parseCDNURA, kind: 'inv' },
  EXPA: { key: 'expa', label: 'EXP (amended)', parse: parseEXPA, kind: 'inv' },
  // other sections
  NIL: { key: 'nil', label: 'Nil-rated / Exempt / Non-GST', parse: parseNIL, kind: 'nil' },
  AT: { key: 'at', label: 'Advances Received', parse: (d) => parseAdv(d, 'at'), kind: 'adv' },
  ATA: { key: 'ata', label: 'Advances Received (amended)', parse: (d) => parseAdv(d, 'ata'), kind: 'adv' },
  TXPD: { key: 'txpd', url: 'txp', label: 'Advance Adjusted', parse: (d) => parseAdv(d, 'txpd'), kind: 'adv' },
  TXPDA: { key: 'txpda', url: 'txpa', label: 'Advance Adjusted (amended)', parse: (d) => parseAdv(d, 'txpda'), kind: 'adv' },
  DOC_ISSUE: { key: 'doc', url: 'doc-issue', label: 'Documents Issued', parse: parseDoc, kind: 'doc' },
};

// Summary sub-breakup codes (B2B_4A, HSN_B2B, CDNRA_SEZWP, …) have no detail
// endpoint — fold them into their parent section before fetching.
const SUB_SUFFIX = /_(4A|4B|6C|SEZWOP|SEZWP|B2B|B2C)$/;
function normalizeSec(nm: string): string {
  const u = String(nm).toUpperCase();
  if (SECTIONS[u]) return u;
  const stripped = u.replace(SUB_SUFFIX, '');
  return SECTIONS[stripped] ? stripped : u;
}

/** Every section we know how to read — used when the summary can't tell us which
 *  ones hold data (a FILED return often returns an empty pre-file `sec_sum`, so
 *  section-by-section probing is the only way to see what was actually filed). */
export const ALL_GSTR1_SECTIONS: string[] = Object.keys(SECTIONS);

/** Fetch + parse the detail for the sections that reported data in the month.
 *  `variant` selects the return: GSTR-1 or its amendment return GSTR-1A. */
export async function fetchGstr1MonthDetail(
  year: string, month: string, sessionToken: string, secNames: string[],
  variant: 'gstr1' | 'gstr1a' = 'gstr1',
): Promise<FiledSection[]> {
  const wanted = secNames.map(normalizeSec).filter((s) => SECTIONS[s]);
  const uniq = Array.from(new Set(wanted));
  const out: FiledSection[] = [];
  for (const nm of uniq) {
    const cfg = SECTIONS[nm];
    const seg = cfg.url ?? cfg.key;
    const r = variant === 'gstr1a'
      ? await sandboxClient.gstr1aSection(seg, year, month, sessionToken)
      : await sandboxClient.gstr1Section(seg, year, month, sessionToken);
    if (!r.ok) continue;
    const d = (r.data as any)?.data?.data ?? (r.data as any)?.data ?? r.data;
    if (d?.status_cd === '0' || d?.error) continue; // "no document found" etc.
    const rows = cfg.parse(d);
    if (rows.length) out.push({ key: cfg.key, label: cfg.label, kind: cfg.kind, rows });
  }
  return out;
}
