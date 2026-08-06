// Adapters: turn the app's book-derived returns into Sandbox Save request bodies.
// These are thin transforms over the EXISTING builders — no schema is re-implemented.

import type { GSTR1Filing } from '@/lib/gstr1/types';
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';
import { buildGstr3bPortalJson, type Gstr3bFormState } from '@/lib/accounting/gstr3bJson';

/** Rough current-period turnover = sum of taxable values across the filing.
 *  A sensible default for gt/cur_gt that the CA can override before saving. */
export function estimateReturnTurnover(filing: GSTR1Filing): number {
  let t = 0;
  const sumItms = (itms?: Array<any>) => {
    for (const i of itms ?? []) t += Number(i?.itm_det?.txval ?? i?.txval ?? 0) || 0;
  };
  for (const inv of filing.b2b ?? []) sumItms(inv.itms);
  for (const inv of filing.b2cl ?? []) sumItms(inv.itms as any);
  for (const s of filing.b2cs ?? []) t += Number(s.txval ?? 0) || 0;
  for (const e of filing.exp ?? []) sumItms(e.itms as any);
  for (const n of filing.cdnr ?? []) for (const nt of n.nt ?? []) sumItms(nt.itms);
  for (const n of filing.cdnur ?? []) sumItms(n.itms);
  return Math.round(t * 100) / 100;
}

/**
 * Consolidated GSTR-1 Save body — ALL sections in one object (the "upload
 * everything at once" body). Reuses generateGstr1Json, then:
 *   • drops portal-JSON-only keys (version, hash),
 *   • adds gt / cur_gt (turnover headers) — CA-editable, default = estimate.
 */
export function buildGstr1SaveBody(
  filing: GSTR1Filing,
  opts: { gt?: number; cur_gt?: number } = {},
): Record<string, unknown> {
  const env = JSON.parse(generateGstr1Json(filing)) as Record<string, unknown>;
  delete env.version;
  delete env.hash;
  const est = estimateReturnTurnover(filing);
  env.gt = opts.gt ?? est;
  env.cur_gt = opts.cur_gt ?? est;
  return env; // fp already = filing.period; gstin present (harmless), all populated sections included
}

/** How many populated sections a save body carries — for the confirm dialog. */
export function countSaveSections(body: Record<string, unknown>): { section: string; count: number }[] {
  const out: { section: string; count: number }[] = [];
  for (const [k, v] of Object.entries(body)) {
    if (['gstin', 'fp', 'gt', 'cur_gt'].includes(k)) continue;
    if (Array.isArray(v)) { if (v.length) out.push({ section: k.toUpperCase(), count: v.length }); }
    else if (v && typeof v === 'object') {
      const o = v as any;
      // hsn ships as a { hsn_b2b, hsn_b2c } split — count both classes together.
      const inner = o.data ?? o.doc_det ?? o.inv
        ?? ((o.hsn_b2b || o.hsn_b2c) ? [...(o.hsn_b2b ?? []), ...(o.hsn_b2c ?? [])] : undefined);
      if (Array.isArray(inner) && inner.length) out.push({ section: k.toUpperCase(), count: inner.length });
    }
  }
  return out;
}

/** GSTR-3B Save body — the portal JSON minus the path/session-carried keys. */
export function buildGstr3bSaveBody(
  gstin: string,
  retPeriodMmYyyy: string,
  form: Gstr3bFormState,
): Record<string, unknown> {
  const body = buildGstr3bPortalJson(gstin, retPeriodMmYyyy, form);
  delete (body as any).gstin;     // session identifies the taxpayer
  delete (body as any).ret_period; // period is in the URL path
  return body;
}
