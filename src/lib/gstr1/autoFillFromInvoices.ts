import { GSTR1_CONFIG } from './config';
import type { InvoiceV2 } from '@/lib/accounting/gstInvoices';
import type {
  GSTR1Filing, B2BInvoice, B2CLInvoice, B2CSSummary,
  EXPInvoice, CDNRNote, CDNURNote, HSNSummary, SupecoTx, NilSummary,
} from './types';

/** Convert YYYY-MM-DD → DD-MM-YYYY */
function toDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

/**
 * Normalize an HSN/SAC code to a GSTN-valid length (4, 6, or 8 digits) by left-padding
 * with zeros to the next valid length. GSTN rejects any other length (e.g. 5-digit
 * "45435" → "045435"). Codes already 4/6/8 are unchanged; >8 is left as-is so the
 * blocking HSN validation surfaces it. Non-digits are stripped; empty → "".
 */
export function normalizeHsnCode(code: string | undefined | null): string {
  const d = (code ?? '').replace(/\D/g, '');
  if (d.length === 0) return '';
  if (d.length === 5) return d.padStart(6, '0');
  if (d.length === 7) return d.padStart(8, '0');
  if (d.length < 4) return d.padStart(4, '0');
  return d; // 4 / 6 / 8 kept; >8 left for validation to block
}

/**
 * Auto-fill GSTR-1 sections from InvoiceV2 register data.
 * Replaces the old `autoFillFromEntries` (journal-based) approach.
 */
export function autoFillFromInvoices(
  invoices: InvoiceV2[],
  filing: GSTR1Filing,
  companyStateCode: string,
): GSTR1Filing {
  const [mm, yyyy] = [filing.period.slice(0, 2), filing.period.slice(2)];
  const monthStr = `${yyyy}-${mm}`;

  // Filter to this period, exclude cancelled
  const active = invoices.filter(
    (inv) => inv.invoice_date.startsWith(monthStr) && inv.status !== 'CANCELLED',
  );

  const b2b: B2BInvoice[] = [];
  const b2cl: B2CLInvoice[] = [];
  const b2csMap = new Map<string, B2CSSummary>();
  const exp: EXPInvoice[] = [];
  const cdnrMap = new Map<string, CDNRNote>();
  const cdnur: CDNURNote[] = [];
  const hsnMap = new Map<string, { hsn_sc: string; rt: number; supplyClass: 'B2B' | 'B2C'; desc: string; user_desc: string; uqc: string; qty: number; val: number; txval: number; iamt: number; camt: number; samt: number; csamt: number }>();

  for (const inv of active) {
    const idt = toDDMMYYYY(inv.invoice_date);
    const pos = inv.place_of_supply || inv.buyer_state_code || companyStateCode;
    const itms = inv.items.map((item, idx) => ({
      num: idx + 1,
      itm_det: {
        rt: item.gst_rate,
        txval: item.taxable_value,
        iamt: item.igst || undefined,
        camt: item.cgst || undefined,
        samt: item.sgst || undefined,
        csamt: item.cess || undefined,
      },
    }));

    // Aggregate HSN from all sales-type invoices. Table 12 (Phase-3, FP ≥ 052025)
    // splits by buyer registration: registered buyer (has GSTIN) → hsn_b2b, else hsn_b2c.
    if (inv.doc_type === 'TAX_INVOICE' || inv.doc_type === 'BILL_OF_SUPPLY') {
      const supplyClass: 'B2B' | 'B2C' = inv.buyer_gstin && inv.buyer_gstin.trim() ? 'B2B' : 'B2C';
      for (const item of inv.items) {
        // Pad odd-length HSN (e.g. 5-digit "45435" → "045435") so it's a valid 4/6/8.
        const hsn = normalizeHsnCode(item.hsn) || 'N/A';
        const rt = item.gst_rate ?? 0;
        // SAC (services, code 99xxxx) has no unit of measure → GSTN wants uqc "NA", qty 0.
        const isSac = /^99/.test(hsn);
        // HSN (Table 12) is a RATE-WISE, per-supply-class summary → one row per
        // (HSN code + rate + B2B/B2C); the rate rides straight off the invoice line.
        const key = `${hsn}|${rt}|${supplyClass}`;
        // user_desc = the first item description encountered for this HSN key (GSTN user_desc).
        const cur = hsnMap.get(key) ?? { hsn_sc: hsn, rt, supplyClass, desc: hsn === 'N/A' ? 'Not specified' : `HSN ${hsn}`, user_desc: (item.description || '').trim(), uqc: isSac ? 'NA' : (item.uqc || 'NOS'), qty: 0, val: 0, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
        cur.qty += isSac ? 0 : item.qty;
        cur.val += item.line_total;
        cur.txval += item.taxable_value;
        cur.iamt += item.igst;
        cur.camt += item.cgst;
        cur.samt += item.sgst;
        cur.csamt += item.cess;
        hsnMap.set(key, cur);
      }
    }

    // ── B2B (incl. SEZ / Deemed-Export tables, which ride the b2b array with their inv_typ) ──
    if ((inv.gstr1_table === 'B2B' || inv.gstr1_table === 'SEWP' || inv.gstr1_table === 'SEWOP' || inv.gstr1_table === 'DE') && inv.doc_type === 'TAX_INVOICE') {
      b2b.push({
        id: inv.id,
        ctin: inv.buyer_gstin || '',
        inv_typ: (inv.invoice_type === 'CBW' ? 'R' : inv.invoice_type) || 'R',
        inum: inv.invoice_no,
        idt,
        val: inv.total_amount,
        pos,
        rchrg: inv.reverse_charge ? 'Y' : 'N',
        itms,
      });
    }

    // ── B2CL ──
    else if (inv.gstr1_table === 'B2CL' && inv.doc_type === 'TAX_INVOICE') {
      b2cl.push({
        id: inv.id,
        inum: inv.invoice_no,
        idt,
        val: inv.total_amount,
        pos,
        itms,
      });
    }

    // ── B2CS ──
    else if (inv.gstr1_table === 'B2CS' && inv.doc_type === 'TAX_INVOICE') {
      const sply_ty: 'INTRA' | 'INTER' = inv.supply_type === 'inter' ? 'INTER' : 'INTRA';
      for (const item of inv.items) {
        const key = `${pos}_${item.gst_rate}_${sply_ty}`;
        const existing = b2csMap.get(key);
        if (existing) {
          existing.txval += item.taxable_value;
          if (item.igst) existing.iamt = (existing.iamt ?? 0) + item.igst;
          if (item.cgst) existing.camt = (existing.camt ?? 0) + item.cgst;
          if (item.sgst) existing.samt = (existing.samt ?? 0) + item.sgst;
          if (item.cess) existing.csamt = (existing.csamt ?? 0) + item.cess;
        } else {
          b2csMap.set(key, {
            id: `b2cs_${key}`,
            sply_ty,
            typ: 'OE',              // GSTN-required: OE = ordinary (non-e-commerce). Set so the pre-check passes.
            pos,
            rt: item.gst_rate,
            txval: item.taxable_value,
            iamt: item.igst || undefined,
            camt: item.cgst || undefined,
            samt: item.sgst || undefined,
            csamt: item.cess || undefined,
          });
        }
      }
    }

    // ── EXP ──
    else if (inv.gstr1_table === 'EXP' && inv.doc_type === 'TAX_INVOICE') {
      exp.push({
        id: inv.id,
        exp_typ: inv.export_type || 'WPAY',
        inum: inv.invoice_no,
        idt,
        val: inv.total_amount,
        sbnum: inv.shipping_bill_no,
        sbdt: inv.shipping_bill_date ? toDDMMYYYY(inv.shipping_bill_date) : undefined,
        sbpcode: inv.port_code,
        itms: inv.items.map((item) => ({
          txval: item.taxable_value,
          rt: item.gst_rate,
          iamt: item.igst || undefined,
          csamt: item.cess || undefined,
        })),
      });
    }

    // ── CDNR ──
    else if (inv.gstr1_table === 'CDNR' && (inv.doc_type === 'CREDIT_NOTE' || inv.doc_type === 'DEBIT_NOTE')) {
      const ctin = inv.buyer_gstin || '';
      const ntty: 'C' | 'D' = inv.doc_type === 'CREDIT_NOTE' ? 'C' : 'D';
      // Group per buyer AND note type — credit and debit notes must not share a group's ntty.
      const existing = cdnrMap.get(`${ctin}_${ntty}`);
      // pos (Place of Supply) + inv_typ carried so CDNR notes are schema-complete.
      const ntEntry = { ntnum: inv.invoice_no, ntdt: idt, val: inv.total_amount, pos, inv_typ: 'R' as const, itms };
      if (existing) {
        existing.nt.push(ntEntry);
      } else {
        cdnrMap.set(`${ctin}_${ntty}`, {
          id: `cdnr_${ctin}_${inv.id}`,
          ctin,
          ntty,
          nt: [ntEntry],
        });
      }
    }

    // ── CDNUR ──
    else if (inv.gstr1_table === 'CDNUR' && (inv.doc_type === 'CREDIT_NOTE' || inv.doc_type === 'DEBIT_NOTE')) {
      cdnur.push({
        id: inv.id,
        ntty: inv.doc_type === 'CREDIT_NOTE' ? 'C' : 'D',
        typ: inv.cdnur_type || 'B2CL',
        ntnum: inv.invoice_no,
        ntdt: idt,
        val: inv.total_amount,
        pos,
        itms,
      });
    }
  }

  // Build HSN summary array (each row tagged B2B/B2C for the Phase-3 split emit)
  const hsn: HSNSummary[] = Array.from(hsnMap.values()).map((v, idx) => ({
    id: `hsn_${v.hsn_sc}_${v.rt}_${v.supplyClass}`,
    num: idx + 1,
    hsn_sc: v.hsn_sc,
    desc: v.desc,
    user_desc: v.user_desc || undefined,
    uqc: v.uqc,
    qty: v.qty,
    val: v.val,
    txval: v.txval,
    rt: v.rt,                    // rate carried through from the invoice — no manual entry
    supplyClass: v.supplyClass,  // → hsn_b2b vs hsn_b2c
    iamt: v.iamt,
    camt: v.camt,
    samt: v.samt,
    csamt: v.csamt,
  }));

  // ── SUPECO (Table 14/15): aggregate ECO-flagged supplies by operator GSTIN. ──
  // The invoice-level flag drives routing: u/s 9(5) (ECO pays) → paytx (Table 15);
  // regular ECO-facilitated (supplier pays, TCS u/s 52) → clttx (Table 14).
  const clttxMap = new Map<string, SupecoTx>();
  const paytxMap = new Map<string, SupecoTx>();
  for (const inv of active) {
    if (!inv.ecom_supply || !inv.ecom_gstin) continue;
    const m = inv.ecom_9_5 ? paytxMap : clttxMap;
    const etin = inv.ecom_gstin;
    const cur = m.get(etin) ?? { id: `supeco_${inv.ecom_9_5 ? 'p' : 'c'}_${etin}`, etin, suppval: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };
    for (const item of inv.items) {
      cur.suppval += item.taxable_value;
      cur.igst += item.igst; cur.cgst += item.cgst; cur.sgst += item.sgst; cur.cess += item.cess;
    }
    m.set(etin, cur);
  }
  const supeco = { clttx: Array.from(clttxMap.values()), paytx: Array.from(paytxMap.values()) };

  // ── NIL (Table 8): aggregate nil-rated / exempt / non-GST lines into the 4 buckets. ──
  // ADDITIVE: only produces rows when a line carries a non-taxable supply_nature. An
  // all-taxable return leaves nilAuto empty → filing.nil passes through untouched
  // (byte-identical to before). Manual nil rows already on the filing win per sply_ty.
  const NIL_FIELD = { NIL_RATED: 'nil_amt', EXEMPT: 'expt_amt', NON_GST: 'ngsup_amt' } as const;
  const nilMap = new Map<NilSummary['sply_ty'], NilSummary>();
  for (const inv of active) {
    if (inv.doc_type !== 'TAX_INVOICE' && inv.doc_type !== 'BILL_OF_SUPPLY') continue;
    const intra = inv.supply_type !== 'inter';
    const b2x = inv.buyer_gstin && inv.buyer_gstin.trim() ? 'B2B' : 'B2C';
    const sply_ty = `${intra ? 'INTRA' : 'INTR'}${b2x}` as NilSummary['sply_ty'];
    for (const item of inv.items) {
      const field = NIL_FIELD[item.supply_nature as keyof typeof NIL_FIELD];
      if (!field) continue;
      const cur = nilMap.get(sply_ty) ?? { id: `nil_${sply_ty}`, sply_ty, nil_amt: 0, expt_amt: 0, ngsup_amt: 0 };
      cur[field] += item.taxable_value;
      nilMap.set(sply_ty, cur);
    }
  }
  const nilAuto = Array.from(nilMap.values());
  const nil = nilAuto.length
    ? [...filing.nil, ...nilAuto.filter((a) => !filing.nil.some((m) => m.sply_ty === a.sply_ty))]
    : filing.nil;

  return {
    ...filing,
    b2b,
    b2cl,
    b2cs: Array.from(b2csMap.values()),
    exp,
    cdnr: Array.from(cdnrMap.values()),
    cdnur,
    hsn,
    supeco,
    nil,
  };
}
