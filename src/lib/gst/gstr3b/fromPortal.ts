/**
 * GSTR-3B source: THE PORTAL ITSELF.
 *
 * Pulls the month's GSTR-3B exactly as it is currently saved / filed at GSTN
 * (GET /gst/compliance/tax-payer/gstrs/gstr-3b/{year}/{month}, Sandbox action
 * `gstr3bGet`) and maps the portal payload back into `Gstr3bMonthData`.
 *
 * This mapping is the EXACT INVERSE of buildGstr3bSaveJson() in
 * src/lib/accounting/gstr3bJson.ts — read the two side by side before changing
 * either:
 *   sup_details.osup_det       → txval31a + taxNonRcm
 *   sup_details.osup_zero      → txval31b
 *   sup_details.osup_nil_exmp  → txval31c
 *   sup_details.osup_nongst    → txval31e
 *   sup_details.isup_rev       → txval31d + taxRcm
 *   inward_sup.isup_details    → inward5Exmp (ty GST) / inward5NonGst (ty NONGST)
 *   itc_elg.itc_avl ty:OTH     → itcNonRcm
 *   itc_elg.itc_avl ty:ISRC    → itcRcm
 *   intr_ltfee.intr_details    → interest
 *   intr_ltfee.ltfee_details   → lateFee (CGST/SGST only)
 *   tx_pmt.pdcash[]            → cashOffset (only present once liability is offset/filed)
 *
 * ONLINE SOURCE: with no taxpayer session it returns { ok:false, needsSession:true }
 * and never throws, so offline preparation of the month is never blocked.
 *
 * Everything is defensive: any section may be missing (a nil return, a partially
 * saved draft, a shape drift at GSTN). Only sections that are actually present
 * become patch fields — absent sections are simply not claimed, so a books/2B
 * figure already in the record is not silently zeroed.
 */

import { sandboxClient } from '@/lib/gst/sandbox/client';
import { toApiYearMonth, periodLabel } from '@/lib/gst/sandbox/period';
import { round2 } from '@/lib/accounting/gstr3bJson';
import type { Gstr3bMonthData, Split4 } from '@/lib/accounting/gstr3bJson';
import type { Gstr3bPatch, Gstr3bSourceFn, SourceResult } from './types';

/* ── tiny defensive helpers ───────────────────────────────────────────────── */

function num(x: unknown): number {
  if (x == null || x === '') return 0;
  const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function isObj(x: unknown): x is Record<string, any> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

/** { iamt, camt, samt, csamt } → our Split4, rounded. */
function split4(row: Record<string, any>): Split4 {
  return {
    igst: round2(num(row.iamt)),
    cgst: round2(num(row.camt)),
    sgst: round2(num(row.samt)),
    cess: round2(num(row.csamt)),
  };
}

const MARKER_KEYS = ['sup_details', 'itc_elg', 'inward_sup', 'intr_ltfee', 'inter_sup', 'eco_dtls', 'tx_pmt', 'ret_period'];

function looksLikeGstr3b(x: unknown): boolean {
  return isObj(x) && MARKER_KEYS.some((k) => k in x);
}

/**
 * Peel the Sandbox envelope down to the GSTN payload. Responses are typically
 * { code, data: { data: { gstin, ret_period, sup_details … } } }, but the proxy
 * has also been seen returning a single wrap — so unwrap until the 3B body is
 * recognisable rather than assuming a fixed depth.
 */
export function unwrapPortalGstr3b(raw: unknown): Record<string, any> {
  let p: any = raw;
  for (let i = 0; i < 5; i++) {
    if (looksLikeGstr3b(p)) return p as Record<string, any>;
    if (isObj(p) && isObj(p.data)) { p = p.data; continue; }
    break;
  }
  return isObj(p) ? (p as Record<string, any>) : {};
}

/* ── the pure mapper (unit-testable with no network) ──────────────────────── */

/**
 * Map a portal GSTR-3B payload (raw response OR the already-unwrapped body)
 * into our month model. Returns ONLY the fields the payload actually carried —
 * never a full Gstr3bMonthData, never a throw.
 */
export function mapPortalGstr3b(raw: unknown): Partial<Gstr3bMonthData> {
  const out: Partial<Gstr3bMonthData> = {};
  let p: Record<string, any>;
  try {
    p = unwrapPortalGstr3b(raw);
  } catch {
    return out;
  }
  if (!isObj(p)) return out;

  // ── Table 3.1 — outward supplies + tax ──
  const sup = isObj(p.sup_details) ? p.sup_details : undefined;
  if (sup) {
    if (isObj(sup.osup_det)) {
      out.txval31a = round2(num(sup.osup_det.txval));
      out.taxNonRcm = split4(sup.osup_det);
    }
    if (isObj(sup.osup_zero)) out.txval31b = round2(num(sup.osup_zero.txval));
    if (isObj(sup.osup_nil_exmp)) out.txval31c = round2(num(sup.osup_nil_exmp.txval));
    if (isObj(sup.osup_nongst)) out.txval31e = round2(num(sup.osup_nongst.txval));
    if (isObj(sup.isup_rev)) {
      out.txval31d = round2(num(sup.isup_rev.txval));
      out.taxRcm = split4(sup.isup_rev);
    }
  }

  // ── Table 5 — inward supplies (composition/exempt/nil vs non-GST) ──
  // We save intra only; the portal may hold both legs, so sum inter + intra.
  const isup = isObj(p.inward_sup) && Array.isArray(p.inward_sup.isup_details)
    ? (p.inward_sup.isup_details as any[])
    : undefined;
  if (isup) {
    for (const r of isup) {
      if (!isObj(r)) continue;
      const ty = String(r.ty ?? '').trim().toUpperCase();
      const total = round2(num(r.inter) + num(r.intra));
      if (ty === 'GST') out.inward5Exmp = total;
      else if (ty === 'NONGST' || ty === 'NON-GST') out.inward5NonGst = total;
    }
  }

  // ── Table 4(A) — ITC availed: ty OTH = non-RCM, ty ISRC = RCM ──
  const itcAvl = isObj(p.itc_elg) && Array.isArray(p.itc_elg.itc_avl)
    ? (p.itc_elg.itc_avl as any[])
    : undefined;
  if (itcAvl) {
    for (const r of itcAvl) {
      if (!isObj(r)) continue;
      const ty = String(r.ty ?? '').trim().toUpperCase();
      if (ty === 'OTH') out.itcNonRcm = split4(r);
      else if (ty === 'ISRC') out.itcRcm = split4(r);
    }
  }

  // ── Table 5.1 — interest & late fee ──
  const il = isObj(p.intr_ltfee) ? p.intr_ltfee : undefined;
  if (il) {
    if (isObj(il.intr_details)) out.interest = split4(il.intr_details);
    if (isObj(il.ltfee_details)) {
      out.lateFee = {
        cgst: round2(num(il.ltfee_details.camt)),
        sgst: round2(num(il.ltfee_details.samt)),
      };
    }
  }

  // ── Table 6.1 — tax actually paid in cash (present only after offset/filing) ──
  const pdcash = isObj(p.tx_pmt) && Array.isArray(p.tx_pmt.pdcash) ? (p.tx_pmt.pdcash as any[]) : undefined;
  if (pdcash && pdcash.length) {
    const cash = pdcash.reduce(
      (a, r) => (isObj(r)
        ? { igst: a.igst + num(r.ipd), cgst: a.cgst + num(r.cpd), sgst: a.sgst + num(r.spd), cess: a.cess + num(r.cspd) }
        : a),
      { igst: 0, cgst: 0, sgst: 0, cess: 0 },
    );
    out.cashOffset = {
      igst: round2(cash.igst), cgst: round2(cash.cgst), sgst: round2(cash.sgst), cess: round2(cash.cess),
    };
  }

  return out;
}

/** Provenance/meta read off the same payload (GSTIN, period, ARN, filing status). */
export interface PortalGstr3bMeta {
  gstin?: string;
  /** MMYYYY as the portal reported it. */
  retPeriod?: string;
  arn?: string;
  /** Raw portal status string when one is present (e.g. "Filed", "SAV"). */
  status?: string;
  filed: boolean;
}

export function readPortalGstr3bMeta(raw: unknown): PortalGstr3bMeta {
  let p: Record<string, any> = {};
  try { p = unwrapPortalGstr3b(raw); } catch { /* ignore */ }
  const outer = isObj(raw) ? (raw as Record<string, any>) : {};
  const s = (v: unknown) => (v == null ? undefined : String(v).trim() || undefined);
  const arn = s(p.arn ?? p.ackNum ?? p.ack_num ?? outer.arn);
  const status = s(p.status ?? p.ret_status ?? p.filing_status ?? p.status_cd ?? p.rtn_prd_status);
  return {
    gstin: s(p.gstin),
    retPeriod: s(p.ret_period),
    arn,
    status,
    filed: !!arn || /^(filed|fld)$/i.test(status ?? ''),
  };
}

/** True when the mapped values carry at least one non-zero figure. */
export function portalGstr3bHasFigures(v: Partial<Gstr3bMonthData>): boolean {
  for (const val of Object.values(v)) {
    if (typeof val === 'number') { if (round2(val) !== 0) return true; }
    else if (isObj(val)) { if (Object.values(val).some((n) => round2(num(n)) !== 0)) return true; }
  }
  return false;
}

/* ── the source adapter ───────────────────────────────────────────────────── */

/** Portal errors that really mean "nothing filed/saved for this period yet". */
function isNoDataError(status: number, message: string, payload: unknown): boolean {
  const outer = isObj(payload) ? (payload as Record<string, any>) : {};
  const code = String(outer.error_code ?? outer.errorCode ?? outer.code ?? '');
  const text = `${message} ${code}`.toUpperCase();
  if (status === 404) return true;
  return /NO\s*(SUMMARY|RECORD|DATA|RETURN)|NOT\s*FOUND|RET3B?NODATA|RETNOTFOUND/.test(text);
}

/**
 * Import the month's GSTR-3B as it stands on the portal.
 * Consumes exactly ONE portal call.
 */
export const gstr3bFromPortal: Gstr3bSourceFn = async ({ gstin, period, sessionToken }): Promise<SourceResult> => {
  try {
    if (!sessionToken) return { ok: false, needsSession: true, error: 'GST taxpayer session required to import from the portal.' };
    if (!/^\d{6}$/.test(period || '')) return { ok: false, error: `Invalid return period "${period}" (expected MMYYYY).` };

    const { year, month } = toApiYearMonth(period);
    const at = new Date().toISOString();
    const label = periodLabel(period) || `${month}/${year}`;

    const res = await sandboxClient.gstr3bGet(year, month, sessionToken);

    const emptyPatch = (notes: string): Gstr3bPatch => ({ source: 'portal', values: {}, at, calls: 1, notes });

    if (!res.ok) {
      const msg = res.error || `Portal request failed (${res.status}).`;
      if (isNoDataError(res.status, msg, res.data)) {
        return { ok: true, noData: true, patch: emptyPatch(`No GSTR-3B on the portal for ${label}.`) };
      }
      if (res.status === 401 || res.status === 403 || /AUTH\s*4\d\d|session/i.test(msg)) {
        return { ok: false, needsSession: true, error: `Portal session rejected: ${msg}` };
      }
      return { ok: false, error: msg };
    }

    const body = unwrapPortalGstr3b(res.data);
    if (!looksLikeGstr3b(body)) {
      const msg = String((isObj(res.data) && (res.data.error || res.data.message)) || '');
      if (msg && isNoDataError(res.status, msg, res.data)) {
        return { ok: true, noData: true, patch: emptyPatch(`No GSTR-3B on the portal for ${label}.`) };
      }
      return { ok: false, error: msg || 'Portal returned an unrecognised GSTR-3B payload.' };
    }

    const values = mapPortalGstr3b(body);
    const meta = readPortalGstr3bMeta(body);

    // Provenance notes — what was actually found.
    const state = meta.filed
      ? `filed${meta.arn ? `, ARN ${meta.arn}` : ''}`
      : meta.status ? `portal status ${meta.status}` : 'saved on portal';
    const warn: string[] = [];
    if (meta.gstin && gstin && meta.gstin.toUpperCase() !== gstin.toUpperCase()) {
      warn.push(`GSTIN mismatch: portal returned ${meta.gstin}`);
    }
    if (meta.retPeriod && meta.retPeriod !== period) {
      warn.push(`period mismatch: portal returned ${meta.retPeriod}`);
    }

    if (!Object.keys(values).length || !portalGstr3bHasFigures(values)) {
      return {
        ok: true,
        noData: true,
        patch: emptyPatch(`Portal GSTR-3B for ${label} is nil/empty (${state}).${warn.length ? ` ⚠ ${warn.join('; ')}` : ''}`),
      };
    }

    const notes = `Portal GSTR-3B for ${label} (${state}); ${Object.keys(values).length} field(s) imported.`
      + (warn.length ? ` ⚠ ${warn.join('; ')}` : '');

    return { ok: true, patch: { source: 'portal', values, at, calls: 1, notes } };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unexpected error importing GSTR-3B from the portal.' };
  }
};

export default gstr3bFromPortal;
