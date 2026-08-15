/**
 * GSTIN → party name registry (per company).
 *
 * WHY THIS EXISTS — the GST portal does not give us names everywhere:
 *
 *   GSTR-2B  returns `trdnm` (trade/legal name) on every supplier block. This is
 *            the ONLY return that carries names, so it is our best free source.
 *   GSTR-2A  returns NO name at all. Its b2b block is { ctin, cfs, cfs3b,
 *            dtcancel, fldtr1, flprdr1, inv[] } — the supplier's name is simply
 *            not part of the 2A schema, which is why the column reads blank.
 *   GSTR-1   returns NO name either. A filed GSTR-1 records only the recipient's
 *            GSTIN (`ctin`), because that is all the taxpayer files.
 *
 * So a name column can never be filled from those two returns directly. Instead
 * every name we ever learn is banked here and reused everywhere, at no API cost:
 *
 *   1. GSTR-2B downloads          — harvested automatically on every import
 *   2. GSTIN search results       — one live call each, already cached locally
 *   3. Sales / purchase invoices  — the names the CA already typed in the books
 *
 * Stored per company in entity_data (module 'gst', section 'party_names') so it
 * stays inside the company sandbox and mirrors to Supabase like everything else.
 */

import { getEntityData, upsertEntityData, listEntityData } from '@/lib/offlineDb';
import { listSearches } from './sandbox/gstinSearchStore';
import { listSalesInvoices, listPurchaseInvoices } from '@/lib/accounting/gstInvoices';

const MODULE = 'gst';
const SECTION = 'party_names';

export type PartyNameSource = 'gstr2b' | 'search' | 'books' | 'manual';

export interface PartyName {
  gstin: string;
  name: string;
  source: PartyNameSource;
  updatedAt: string;
}

/** Name lookup: uppercase GSTIN → name. */
export type PartyNameIndex = Map<string, string>;

const norm = (g: unknown): string => String(g ?? '').trim().toUpperCase();
const clean = (n: unknown): string => String(n ?? '').trim();

// ── Persistence ───────────────────────────────────────────────────────────────

function readStore(companyId: string): PartyName[] {
  const rec = getEntityData(companyId, MODULE, SECTION);
  const arr = rec?.data as PartyName[] | undefined;
  return Array.isArray(arr) ? arr : [];
}

function writeStore(companyId: string, list: PartyName[]): void {
  upsertEntityData(companyId, MODULE, SECTION, list);
}

/**
 * Trust order when two sources disagree. A name the CA typed in the books beats
 * a portal trade name (it is the name they actually use), and an explicit manual
 * override beats everything.
 */
const RANK: Record<PartyNameSource, number> = { manual: 4, books: 3, gstr2b: 2, search: 1 };

/** Learn names, keeping the higher-trust one when a GSTIN is already known. */
export function rememberPartyNames(
  companyId: string,
  entries: { gstin: string; name: string }[],
  source: PartyNameSource,
): number {
  if (!companyId || !entries.length) return 0;
  const existing = readStore(companyId);
  const byGstin = new Map(existing.map((e) => [e.gstin, e]));
  const now = new Date().toISOString();
  let changed = 0;

  for (const e of entries) {
    const gstin = norm(e.gstin);
    const name = clean(e.name);
    if (gstin.length !== 15 || !name) continue;
    const prev = byGstin.get(gstin);
    if (prev && (RANK[prev.source] > RANK[source] || (prev.source === source && prev.name === name))) continue;
    byGstin.set(gstin, { gstin, name, source, updatedAt: now });
    changed++;
  }

  if (changed) writeStore(companyId, [...byGstin.values()]);
  return changed;
}

/** Set (or correct) one name by hand — outranks every automatic source. */
export function setPartyName(companyId: string, gstin: string, name: string): void {
  rememberPartyNames(companyId, [{ gstin, name }], 'manual');
}

export function listPartyNames(companyId: string): PartyName[] {
  return readStore(companyId).sort((a, b) => a.name.localeCompare(b.name));
}

// ── Index building ────────────────────────────────────────────────────────────

/**
 * Every supplier name sitting in already-downloaded GSTR-2B records for this
 * company. 2B is the one return that ships `trdnm`, and a supplier who appears
 * in a month's 2A almost always appears in some month's 2B — so scanning ALL
 * stored periods (not just the one on screen) is what makes the name available
 * in 2A and GSTR-1.
 */
function scanStoredGstr2bNames(companyId: string): { gstin: string; name: string }[] {
  const out: { gstin: string; name: string }[] = [];
  try {
    for (const rec of listEntityData(companyId, MODULE)) {
      if (!String(rec.section ?? '').startsWith('GSTR2B_')) continue;
      const rows = (rec.data as { rows?: { supplierGstin?: string; supplierName?: string }[] } | undefined)?.rows;
      if (!Array.isArray(rows)) continue;
      for (const r of rows) {
        const g = norm(r.supplierGstin);
        const n = clean(r.supplierName);
        if (g.length === 15 && n) out.push({ gstin: g, name: n });
      }
    }
  } catch { /* store unavailable — other sources still apply */ }
  return out;
}

/**
 * Every GSTIN → name pair known for this company, merged from the saved registry,
 * the GSTIN search cache and the books. Pure read — makes no API calls.
 */
export function buildPartyNameIndex(companyId: string): PartyNameIndex {
  const idx: PartyNameIndex = new Map();
  if (!companyId) return idx;

  // Names already sitting in previously-downloaded GSTR-2B records. Without this
  // backfill, only 2B pulls made AFTER harvesting was added would light up the
  // 2A / GSTR-1 name columns — every earlier download would stay blank.
  for (const { gstin, name } of scanStoredGstr2bNames(companyId)) idx.set(gstin, name);

  // Lowest trust first, so higher-trust sources overwrite as we go.
  for (const s of listSearches(companyId)) {
    const g = norm(s.gstin);
    const n = clean(s.tradeName) || clean(s.legalName);
    if (g && n) idx.set(g, n);
  }

  for (const e of readStore(companyId)) {
    if (e.gstin && e.name) idx.set(e.gstin, e.name);
  }

  // The books are authoritative for names the CA maintains themselves.
  try {
    for (const inv of listSalesInvoices(companyId)) {
      const g = norm(inv.customer_gstin);
      const n = clean(inv.customer_name);
      if (g.length === 15 && n) idx.set(g, n);
    }
    for (const inv of listPurchaseInvoices(companyId)) {
      const g = norm(inv.vendor_gstin);
      const n = clean(inv.vendor_name);
      if (g.length === 15 && n) idx.set(g, n);
    }
  } catch { /* books not available — the portal/search names still stand */ }

  return idx;
}

/** Name for a GSTIN, or the supplied fallback (usually '' or the GSTIN itself). */
export function resolvePartyName(idx: PartyNameIndex, gstin: string, fallback = ''): string {
  return idx.get(norm(gstin)) || fallback;
}

/**
 * Pull every `trdnm` a GSTR-2B download carried into the registry, so the same
 * suppliers show a name in GSTR-2A and GSTR-1 too — where the portal sends none.
 */
export function harvestNamesFromRows(
  companyId: string,
  rows: { supplierGstin?: string; supplierName?: string }[],
): number {
  return rememberPartyNames(
    companyId,
    rows
      .filter((r) => clean(r.supplierName) && norm(r.supplierGstin).length === 15)
      .map((r) => ({ gstin: r.supplierGstin!, name: r.supplierName! })),
    'gstr2b',
  );
}
