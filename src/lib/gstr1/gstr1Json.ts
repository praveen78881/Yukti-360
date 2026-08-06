import { GSTR1_CONFIG } from './config';
import type { GSTR1Filing, B2BItem, HSNSummary } from './types';

const r2 = (n: number): number => Math.round(n * 100) / 100;

// itm_det carries ALL tax fields (0 where not applicable). The GSTN itm_det spec lists
// rt,txval,iamt,camt,samt,csamt and the workbook amendment samples send camt:0/samt:0
// alongside iamt — so a uniform shape (never a contradiction: inter → iamt only, intra →
// camt/samt only, the others 0) is what GSTN expects.
function itmDet(d: B2BItem['itm_det']) {
  return {
    rt: d.rt,
    txval: r2(d.txval),
    iamt: r2(d.iamt ?? 0),
    camt: r2(d.camt ?? 0),
    samt: r2(d.samt ?? 0),
    csamt: r2(d.csamt ?? 0),
  };
}
const itmsOf = (itms: B2BItem[]) => itms.map((i) => ({ num: i.num, itm_det: itmDet(i.itm_det) }));

// Inter-state-only sections (b2cl, b2cla, cdnur, cdnura) — GSTN's itm_det there is
// `{ rt, txval, iamt, csamt }` with NO camt/samt (those supplies are always IGST).
function itmDetInter(d: B2BItem['itm_det']) {
  return { rt: d.rt, txval: r2(d.txval), iamt: r2(d.iamt ?? 0), csamt: r2(d.csamt ?? 0) };
}
const itmsOfInter = (itms: B2BItem[]) => itms.map((i) => ({ num: i.num, itm_det: itmDetInter(i.itm_det) }));

function hsnRow(h: HSNSummary) {
  // SAC (services, code 99xxxx) carries no unit/quantity → GSTN wants uqc "NA", qty 0.
  const isSac = /^99/.test(String(h.hsn_sc ?? ''));
  return {
    num: h.num,
    hsn_sc: h.hsn_sc,
    ...(h.desc ? { desc: h.desc } : {}),
    ...(h.user_desc ? { user_desc: h.user_desc } : {}),
    uqc: isSac ? 'NA' : h.uqc,
    qty: isSac ? 0 : r2(h.qty),
    txval: r2(h.txval),
    ...(h.rt != null ? { rt: h.rt } : {}),
    // Tax fields are ALWAYS present (0 when not applicable) — GSTN's HSN schema expects them.
    iamt: r2(h.iamt ?? 0),
    camt: r2(h.camt ?? 0),
    samt: r2(h.samt ?? 0),
    csamt: r2(h.csamt ?? 0),
  };
}

// AT / TXPD / ATA / TXPDA advance itms — the GSTN template carries ALL FOUR tax
// fields (0 where not applicable) on EVERY row. Uniform shape so sparse rows never
// drop a template-mandated zero field.
function advItm(i: { rt: number; ad_amt: number; iamt?: number; camt?: number; samt?: number; csamt?: number }) {
  return { rt: i.rt, ad_amt: r2(i.ad_amt), iamt: r2(i.iamt ?? 0), camt: r2(i.camt ?? 0), samt: r2(i.samt ?? 0), csamt: r2(i.csamt ?? 0) };
}

/**
 * Build the GSTN GSTR-1 SAVE payload from the app's filing model.
 * Every section is mapped EXPLICITLY to the request-schema shape — internal keys
 * (`id`, `isAmended`, `origInvNum/Dt` on non-amendments) are never emitted, `ntnum`
 * → `nt_num`, HSN is split into `hsn_b2b`/`hsn_b2c`, and empty tax fields are dropped.
 */
export function generateGstr1Json(filing: GSTR1Filing): string {
  const has = (a?: unknown[]) => (a?.length ?? 0) > 0;

  const envelope: Record<string, unknown> = {
    gstin: filing.gstin,
    fp: filing.period,
    version: GSTR1_CONFIG.SCHEMA_VERSION,
    hash: 'hash',
    ...(filing.gt != null ? { gt: r2(filing.gt) } : {}),
    ...(filing.cur_gt != null ? { cur_gt: r2(filing.cur_gt) } : {}),

    b2b: has(filing.b2b) ? filing.b2b.map((inv) => ({
      ctin: inv.ctin,
      inv: [{
        inum: inv.inum, idt: inv.idt, val: r2(inv.val), pos: inv.pos,
        rchrg: inv.rchrg, inv_typ: inv.inv_typ,
        ...(inv.diff_percent != null ? { diff_percent: inv.diff_percent } : {}),
        itms: itmsOf(inv.itms),
      }],
    })) : undefined,

    b2cl: has(filing.b2cl) ? filing.b2cl.map((inv) => ({
      pos: inv.pos,
      inv: [{ inum: inv.inum, idt: inv.idt, val: r2(inv.val), itms: itmsOfInter(inv.itms) }],
    })) : undefined,

    // B2CS is aggregated by (sply_ty, typ, pos, rt, etin) — GSTN rejects duplicate combos,
    // and manual + auto rows (or repeated invoices) can collide. Field set is nature-driven
    // and template-exact: INTER → iamt, INTRA → camt+samt, and csamt is ALWAYS present (?? 0).
    b2cs: has(filing.b2cs) ? (() => {
      const m = new Map<string, { sply_ty: string; typ: 'OE' | 'E'; etin?: string; pos: string; rt: number; txval: number; iamt: number; camt: number; samt: number; csamt: number; diff_percent?: number }>();
      for (const s of filing.b2cs) {
        const typ = (s.typ ?? 'OE') as 'OE' | 'E';
        const etin = typ === 'E' && s.etin ? s.etin : '';
        const key = `${s.sply_ty}|${typ}|${s.pos}|${s.rt}|${etin}`;
        const cur = m.get(key) ?? { sply_ty: s.sply_ty, typ, etin: etin || undefined, pos: s.pos, rt: s.rt, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0, diff_percent: s.diff_percent };
        cur.txval += s.txval ?? 0;
        cur.iamt += s.iamt ?? 0;
        cur.camt += s.camt ?? 0;
        cur.samt += s.samt ?? 0;
        cur.csamt += s.csamt ?? 0;
        m.set(key, cur);
      }
      return Array.from(m.values()).map((s) => ({
        sply_ty: s.sply_ty,
        typ: s.typ,
        ...(s.typ === 'E' && s.etin ? { etin: s.etin } : {}),
        pos: s.pos,
        rt: s.rt,
        txval: r2(s.txval),
        ...(s.sply_ty === 'INTER' ? { iamt: r2(s.iamt) } : { camt: r2(s.camt), samt: r2(s.samt) }),
        csamt: r2(s.csamt),
        ...(s.diff_percent != null ? { diff_percent: s.diff_percent } : {}),
      }));
    })() : undefined,

    exp: has(filing.exp) ? Array.from(
      filing.exp.reduce((g, e) => { const l = g.get(e.exp_typ) ?? []; l.push(e); g.set(e.exp_typ, l); return g; }, new Map<string, typeof filing.exp>()),
      ([exp_typ, invs]) => ({
        exp_typ,
        inv: invs.map((e) => ({
          inum: e.inum, idt: e.idt, val: r2(e.val),
          ...(e.sbnum ? { sbnum: e.sbnum } : {}),
          ...(e.sbdt ? { sbdt: e.sbdt } : {}),
          ...(e.sbpcode ? { sbpcode: e.sbpcode } : {}),
          itms: e.itms.map((i) => ({ txval: r2(i.txval), rt: i.rt, iamt: r2(i.iamt ?? 0), csamt: r2(i.csamt ?? 0) })),
        })),
      }),
    ) : undefined,

    // One group per CTIN, with `ntty` carried per NOTE (a buyer can have both a
    // credit and a debit note in the same period). Notes are schema-complete:
    // nt_num, nt_dt, ntty, pos, rchrg, inv_typ, val, itms — matching the template.
    cdnr: has(filing.cdnr) ? Array.from(
      filing.cdnr.reduce((m, n) => {
        const notes = n.nt.map((note) => ({
          nt_num: note.ntnum, nt_dt: note.ntdt, ntty: n.ntty,
          pos: note.pos ?? '', rchrg: note.rchrg ?? 'N', inv_typ: note.inv_typ ?? 'R',
          val: r2(note.val), itms: itmsOf(note.itms),
          ...(note.p_gst ? { p_gst: note.p_gst } : {}),
        }));
        const cur = m.get(n.ctin) ?? [];
        cur.push(...notes); m.set(n.ctin, cur); return m;
      }, new Map<string, unknown[]>()),
      ([ctin, nt]) => ({ ctin, nt }),
    ) : undefined,

    cdnur: has(filing.cdnur) ? filing.cdnur.map((n) => ({
      typ: n.typ, ntty: n.ntty, nt_num: n.ntnum, nt_dt: n.ntdt,
      ...(n.typ === 'B2CL' ? { pos: n.pos } : {}), // EXPWP/EXPWOP are exports — no place of supply
      val: r2(n.val),
      ...(n.inv_typ ? { inv_typ: n.inv_typ } : {}),
      ...(n.p_gst ? { p_gst: n.p_gst } : {}),
      itms: itmsOfInter(n.itms),
    })) : undefined,

    // Emit `nil` ONLY when there are rows — like every other section. An empty
    // `nil:{inv:[]}` is a GSTN structure-validation trigger (RET191106); when the
    // return has no nil/exempt/non-GST supplies the whole block must be omitted.
    nil: has(filing.nil) ? { inv: filing.nil.map((r) => ({ sply_ty: r.sply_ty, nil_amt: r2(r.nil_amt), expt_amt: r2(r.expt_amt), ngsup_amt: r2(r.ngsup_amt) })) } : undefined,

    at: has(filing.at) ? filing.at.map((a) => ({
      pos: a.pos, sply_ty: a.sply_ty,
      itms: a.itms.map(advItm),
    })) : undefined,

    txpd: has(filing.txpd) ? filing.txpd.map((a) => ({
      pos: a.pos, sply_ty: a.sply_ty,
      itms: a.itms.map(advItm),
    })) : undefined,

    // HSN is the Phase-3 (FP ≥ 052025) SPLIT shape `hsn:{ hsn_b2b:[…], hsn_b2c:[…] }`,
    // partitioned by buyer registration (server-bisect.js `hsn_split`, production-proven).
    // An EMPTY class is OMITTED (never `hsn_b2b:[]`) — GSTN structure validation rejects
    // empty arrays (RET191106); if both classes are empty the whole `hsn` key is omitted.
    // SAC rows get uqc "NA"/qty 0 via hsnRow. The legacy flat `data:[]` is REMOVED.
    hsn: has(filing.hsn) ? (() => {
      const b2bRows = filing.hsn.filter((h) => h.supplyClass === 'B2B').map(hsnRow);
      const b2cRows = filing.hsn.filter((h) => h.supplyClass !== 'B2B').map(hsnRow);
      if (!b2bRows.length && !b2cRows.length) return undefined;
      return {
        ...(b2bRows.length ? { hsn_b2b: b2bRows } : {}),
        ...(b2cRows.length ? { hsn_b2c: b2cRows } : {}),
      };
    })() : undefined,

    // DOC_ISSUE: emit a docs row ONLY when it is real (from/to non-empty and not "0",
    // totnum > 0) — the 6-class UI scaffold's placeholder rows must never reach GSTN.
    // A doc_det class with no valid rows is dropped; if none remain, the key is omitted.
    doc_issue: has(filing.doc_issue) ? (() => {
      const validRow = (x: { from?: string; to?: string; totnum?: number }) =>
        !!x.from?.trim() && !!x.to?.trim() && x.from.trim() !== '0' && x.to.trim() !== '0' && (x.totnum ?? 0) > 0;
      const classes = filing.doc_issue
        .map((d) => ({ doc_num: d.doc_num, docs: d.docs.filter(validRow).map((x) => ({ num: x.num, from: x.from, to: x.to, totnum: x.totnum, cancel: x.cancel, net_issue: x.net_issue })) }))
        .filter((d) => d.docs.length > 0);
      return classes.length ? { doc_det: classes } : undefined;
    })() : undefined,

    // ── Amendments (original refs mapped; internal keys stripped) ──
    b2ba: has(filing.b2ba) ? filing.b2ba.map((inv) => ({
      ctin: inv.ctin,
      inv: [{ oinum: inv.origInvNum ?? '', oidt: inv.origInvDt ?? '', inum: inv.inum, idt: inv.idt, val: r2(inv.val), pos: inv.pos, rchrg: inv.rchrg, inv_typ: inv.inv_typ, itms: itmsOf(inv.itms) }],
    })) : undefined,

    b2cla: has(filing.b2cla) ? filing.b2cla.map((inv) => ({
      pos: inv.pos,
      inv: [{ oinum: inv.origInvNum ?? '', oidt: inv.origInvDt ?? '', inum: inv.inum, idt: inv.idt, val: r2(inv.val), itms: itmsOfInter(inv.itms) }],
    })) : undefined,

    // B2CSA: carries the original month (omon) + a rate-wise itms[] array (per b2csa.json).
    b2csa: has(filing.b2csa) ? filing.b2csa.map((s) => ({
      omon: s.omon ?? '', sply_ty: s.sply_ty, typ: s.typ ?? 'OE',
      ...(s.typ === 'E' && s.etin ? { etin: s.etin } : {}),
      pos: s.pos,
      itms: [itmDet({ rt: s.rt, txval: s.txval, iamt: s.iamt, camt: s.camt, samt: s.samt, csamt: s.csamt })],
    })) : undefined,

    // EXPA: each inv carries oinum/oidt (the original export invoice being amended).
    expa: has(filing.expa) ? Array.from(
      filing.expa.reduce((g, e) => { const l = g.get(e.exp_typ) ?? []; l.push(e); g.set(e.exp_typ, l); return g; }, new Map<string, typeof filing.expa>()),
      ([exp_typ, invs]) => ({ exp_typ, inv: invs.map((e) => ({ oinum: e.origInvNum ?? '', oidt: e.origInvDt ?? '', inum: e.inum, idt: e.idt, val: r2(e.val),
        ...(e.sbnum ? { sbnum: e.sbnum } : {}),
        ...(e.sbdt ? { sbdt: e.sbdt } : {}),
        ...(e.sbpcode ? { sbpcode: e.sbpcode } : {}),
        itms: e.itms.map((i) => ({ txval: r2(i.txval), rt: i.rt, iamt: r2(i.iamt ?? 0), csamt: r2(i.csamt ?? 0) })) })) }),
    ) : undefined,

    // CDNRA: one group per CTIN; each note carries ont_num/ont_dt + per-note ntty, schema-complete.
    cdnra: has(filing.cdnra) ? Array.from(
      filing.cdnra.reduce((m, n) => {
        const notes = n.nt.map((note) => ({
          ont_num: note.ont_num ?? note.ntnum, ont_dt: note.ont_dt ?? note.ntdt,
          nt_num: note.ntnum, nt_dt: note.ntdt, ntty: n.ntty,
          pos: note.pos ?? '', rchrg: note.rchrg ?? 'N', inv_typ: note.inv_typ ?? 'R',
          val: r2(note.val), itms: itmsOf(note.itms),
        }));
        const cur = m.get(n.ctin) ?? [];
        cur.push(...notes); m.set(n.ctin, cur); return m;
      }, new Map<string, unknown[]>()),
      ([ctin, nt]) => ({ ctin, nt }),
    ) : undefined,

    cdnura: has(filing.cdnura) ? filing.cdnura.map((n) => ({
      typ: n.typ, ntty: n.ntty, ont_num: n.ont_num ?? n.ntnum, ont_dt: n.ont_dt ?? n.ntdt, nt_num: n.ntnum, nt_dt: n.ntdt,
      ...(n.typ === 'B2CL' ? { pos: n.pos } : {}), // EXPWP/EXPWOP are exports — no place of supply
      val: r2(n.val), itms: itmsOfInter(n.itms),
    })) : undefined,

    // ATA / TXPDA: advance amendments — omon (original month) + rate-wise itms[], same shape as at/txpd.
    ata: has(filing.ata) ? (filing.ata ?? []).map((a) => ({
      omon: a.omon, pos: a.pos, sply_ty: a.sply_ty,
      itms: a.itms.map(advItm),
    })) : undefined,

    txpda: has(filing.txpda) ? (filing.txpda ?? []).map((a) => ({
      omon: a.omon, pos: a.pos, sply_ty: a.sply_ty,
      itms: a.itms.map(advItm),
    })) : undefined,

    // ── Table 14/15 — e-commerce operator supplies (supeco). clttx = ECO collects
    // tax (u/s 52); paytx = ECO pays tax (u/s 9(5)). One row per operator GSTIN. ──
    supeco: (has(filing.supeco?.clttx) || has(filing.supeco?.paytx)) ? {
      ...(has(filing.supeco?.clttx) ? { clttx: (filing.supeco?.clttx ?? []).map((t) => ({ etin: t.etin, suppval: r2(t.suppval), igst: r2(t.igst), cgst: r2(t.cgst), sgst: r2(t.sgst), cess: r2(t.cess) })) } : {}),
      ...(has(filing.supeco?.paytx) ? { paytx: (filing.supeco?.paytx ?? []).map((t) => ({ etin: t.etin, suppval: r2(t.suppval), igst: r2(t.igst), cgst: r2(t.cgst), sgst: r2(t.sgst), cess: r2(t.cess) })) } : {}),
    } : undefined,
  };

  for (const k of Object.keys(envelope)) {
    if (envelope[k] === undefined) delete envelope[k];
  }
  return JSON.stringify(envelope, null, 2);
}
