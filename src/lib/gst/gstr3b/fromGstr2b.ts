/**
 * GSTR-3B source: Table 4 INPUT TAX CREDIT derived from the GSTR-2B of the same
 * return period.
 *
 * OFFLINE FIRST. The GSTR-2B downloaded by the GST download feature is already
 * persisted under the company (entity_data → gst / `GSTR2B_<MMYYYY>`, see
 * `src/lib/gst/sandbox/store.ts`). This adapter reads THAT first and does zero
 * network work. Only when nothing is stored AND a taxpayer session token is
 * supplied does it pull 2B from the portal (1 call) and cache it; with no stored
 * data and no token it returns `{ ok:false, needsSession:true }` so an offline
 * 3B preparation is never blocked.
 *
 * It fills ONLY the ITC side of `Gstr3bMonthData`:
 *     itcNonRcm  — Table 4(A)(5) "All other ITC"      → itc_avl ty:OTH
 *     itcRcm     — Table 4(A)(3) ITC on inward supplies liable to reverse charge
 *                                                      → itc_avl ty:ISRC
 * It never touches outward supplies, RCM liability (3.1(d)), Table 5, interest,
 * late fee, opening ITC or cash offset.
 *
 * MODEL LIMITATION (documented choice): `Gstr3bMonthData` carries only the two
 * ITC buckets above — it has no slot for 4(A)(1) import of goods, 4(A)(2) import
 * of services or 4(A)(4) ISD credit. Import (IMPG / IMPGSEZ) and ISD rows are
 * therefore folded into `itcNonRcm` (the OTH bucket) and the counts are reported
 * in the patch notes and in `Gstr3bItcTotals.byBucket` so the CA can re-split
 * them by hand before filing if the portal form is being matched line-by-line.
 */

import { round2, type Split4, type Gstr3bMonthData } from '@/lib/accounting/gstr3bJson';
import type { GstDownloadRecord, GstInvoiceRow, ItcSummary } from '@/lib/gst/sandbox/types';
import { getDownload, saveDownload } from '@/lib/gst/sandbox/store';
import { isNoData, parseReturn } from '@/lib/gst/sandbox/parsers';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { toApiYearMonth } from '@/lib/gst/sandbox/period';
import type { Gstr3bPatch, Gstr3bSourceFn, SourceResult } from './types';

// ─── small helpers ───────────────────────────────────────────────────────────

function num(x: unknown): number {
  const n = typeof x === 'string' ? parseFloat(x) : (x as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}
const zero4 = (): Split4 => ({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
const r4 = (s: Split4): Split4 => ({
  igst: round2(s.igst), cgst: round2(s.cgst), sgst: round2(s.sgst), cess: round2(s.cess),
});
const sum4 = (s: Split4): number => s.igst + s.cgst + s.sgst + s.cess;
function addTax(acc: Split4, row: GstInvoiceRow, sign: number): void {
  acc.igst += sign * num(row.igst);
  acc.cgst += sign * num(row.cgst);
  acc.sgst += sign * num(row.sgst);
  acc.cess += sign * num(row.cess);
}
const up = (x: unknown): string => String(x ?? '').trim().toUpperCase();

// ─── classification ──────────────────────────────────────────────────────────

/** Where a row's credit lands in our two-bucket model. */
export type ItcBucket = 'OTH' | 'RCM';

/** What kind of document a 2A/2B section holds — drives bucketing & notes. */
type Kind = 'supply' | 'isd' | 'import';

interface SectionRule {
  kind: Kind;
  /** Row is a credit/debit note: the sign comes from its note type (C = −1). */
  note?: boolean;
  /** Amendment table — carries the REVISED document, not the differential. */
  amendment?: boolean;
  label: string;
}

/**
 * `GstInvoiceRow.section` (as emitted by `sandbox/parsers.ts`) → how it feeds
 * Table 4. Sections absent here are listed in `ignoredSections` and never summed
 * (TDS / TCS / ECOM carry no ITC of their own).
 */
const RULES: Record<string, SectionRule> = {
  B2B:     { kind: 'supply', label: 'B2B invoices' },
  B2BA:    { kind: 'supply', amendment: true, label: 'B2B amendments' },
  CDN:     { kind: 'supply', note: true, label: 'Credit/debit notes' },
  CDNA:    { kind: 'supply', note: true, amendment: true, label: 'Credit/debit note amendments' },
  CDNR:    { kind: 'supply', note: true, label: 'Credit/debit notes (registered)' },
  CDNRA:   { kind: 'supply', note: true, amendment: true, label: 'Credit/debit note amendments (registered)' },
  ISD:     { kind: 'isd', label: 'ISD credit' },
  ISDA:    { kind: 'isd', amendment: true, label: 'ISD amendments' },
  IMPG:    { kind: 'import', label: 'Import of goods (BoE)' },
  IMPGSEZ: { kind: 'import', label: 'Import of goods from SEZ (BoE)' },
};

/** Credit notes REDUCE available ITC; debit notes add. 2B uses `typ`/`ntty` = C|D. */
function noteSign(docType: string | undefined): number {
  return up(docType).startsWith('C') ? -1 : 1;
}

/** A row is ITC-ineligible only when the record explicitly says so (`itcavl` = N). */
export function isItcIneligible(row: GstInvoiceRow): boolean {
  const v = up(row.itcAvailable);
  return v === 'N' || v === 'NO' || v === 'FALSE';
}

/** Reverse-charge flag as reported by the supplier (`rev` / `rchrg` = Y|N). */
function isReverseCharge(row: GstInvoiceRow): boolean {
  return up(row.reverseCharge).startsWith('Y');
}

// ─── the pure reducer ────────────────────────────────────────────────────────

export interface Gstr3bItcOptions {
  /**
   * Include the amendment tables (B2BA / CDNRA / ISDA). GSTR-2B reports the
   * REVISED document, not the differential, so when the original invoice was
   * already availed in an earlier month only the difference belongs here.
   * Default true (matching the portal's own 2B ITC summary), with a warning.
   */
  includeAmendments?: boolean;
  /**
   * Count rows the 2B marks ITC-NOT-available (`itcavl = N`). Default false —
   * ineligible credit must never reach Table 4(A). Provided only so a UI can
   * show "what if" totals; leave it off for filing.
   */
  includeIneligible?: boolean;
  /** Fold IMPG / IMPGSEZ bill-of-entry IGST into `itcNonRcm`. Default true. */
  includeImports?: boolean;
  /** Fold ISD credit into `itcNonRcm`. Default true. */
  includeIsd?: boolean;
}

export interface ItcBucketBreakup {
  /** 'supply-oth' | 'supply-rcm' | 'isd' | 'import' */
  key: 'supply-oth' | 'supply-rcm' | 'isd' | 'import';
  label: string;
  bucket: ItcBucket;
  rows: number;
  tax: Split4;
}

export interface Gstr3bItcTotals {
  /** Table 4(A)(5) — all other ITC (domestic B2B ± notes, plus ISD & imports). */
  itcNonRcm: Split4;
  /** Table 4(A)(3) — ITC on inward supplies liable to reverse charge. */
  itcRcm: Split4;
  /** Per-source-line contribution, so the UI can explain the OTH bucket. */
  byBucket: ItcBucketBreakup[];
  /** Per-section drill-in for provenance. */
  bySection: { section: string; label: string; rows: number; counted: number; excluded: number; tax: Split4 }[];
  /** Row counts actually summed vs dropped as ITC-ineligible. */
  eligibleRows: number;
  ineligibleRows: number;
  /** Tax on the dropped rows (Table 4(D) territory — informational only). */
  ineligibleTax: Split4;
  /** Ineligibility reasons with counts, e.g. "POS rule" → 3. */
  ineligibleByReason: { reason: string; rows: number }[];
  /** Sections present in the download but not summed (TDS/TCS/ECOM/unknown). */
  ignoredSections: string[];
  /** 2B headline ITC (all buckets together) when the record carries it. */
  summaryTotal: number | null;
  /** Our derived total (itcNonRcm + itcRcm), for the cross-check. */
  derivedTotal: number;
  /** Non-fatal advisories the UI should surface to the CA. */
  warnings: string[];
}

function emptyItcTotals(): Gstr3bItcTotals {
  return {
    itcNonRcm: zero4(), itcRcm: zero4(),
    byBucket: [], bySection: [],
    eligibleRows: 0, ineligibleRows: 0, ineligibleTax: zero4(), ineligibleByReason: [],
    ignoredSections: [], summaryTotal: null, derivedTotal: 0, warnings: [],
  };
}

/**
 * Pure reducer: normalised GSTR-2B rows (+ the record's ITC summary, used only
 * as a cross-check / last-resort fallback) → Table 4 ITC figures.
 *
 * Never throws, never touches storage or the network, so it can be exercised
 * offline against any stored `GstDownloadRecord` or a hand-built sample.
 */
export function reduceItcFromGstr2b(
  rows: readonly GstInvoiceRow[] | null | undefined,
  itcSummary?: ItcSummary | null,
  options: Gstr3bItcOptions = {},
): Gstr3bItcTotals {
  const includeAmendments = options.includeAmendments !== false;
  const includeIneligible = options.includeIneligible === true;
  const includeImports = options.includeImports !== false;
  const includeIsd = options.includeIsd !== false;

  const t = emptyItcTotals();
  const list: GstInvoiceRow[] = Array.isArray(rows) ? rows.filter((r) => !!r && typeof r === 'object') : [];

  const buckets: Record<ItcBucketBreakup['key'], ItcBucketBreakup> = {
    'supply-oth': { key: 'supply-oth', label: 'Domestic inward supplies (B2B ± notes)', bucket: 'OTH', rows: 0, tax: zero4() },
    'supply-rcm': { key: 'supply-rcm', label: 'Inward supplies liable to reverse charge', bucket: 'RCM', rows: 0, tax: zero4() },
    isd: { key: 'isd', label: 'ISD credit (folded into OTH)', bucket: 'OTH', rows: 0, tax: zero4() },
    import: { key: 'import', label: 'Import of goods (folded into OTH)', bucket: 'OTH', rows: 0, tax: zero4() },
  };

  const perSection = new Map<string, { section: string; label: string; rows: number; counted: number; excluded: number; tax: Split4 }>();
  const ignored = new Set<string>();
  const reasons = new Map<string, number>();
  const amendmentLabels = new Set<string>();
  let amendmentRows = 0;
  let unsignedNotes = 0;

  for (const row of list) {
    const section = up(row.section);
    const rule = RULES[section];
    if (!rule) {
      if (section) ignored.add(section);
      continue;
    }
    if (rule.amendment && !includeAmendments) { ignored.add(`${section} (amendments excluded)`); continue; }
    if (rule.kind === 'import' && !includeImports) { ignored.add(`${section} (imports excluded)`); continue; }
    if (rule.kind === 'isd' && !includeIsd) { ignored.add(`${section} (ISD excluded)`); continue; }

    let sec = perSection.get(section);
    if (!sec) {
      sec = { section, label: rule.label, rows: 0, counted: 0, excluded: 0, tax: zero4() };
      perSection.set(section, sec);
    }
    sec.rows++;

    // ITC-ineligible rows never reach Table 4(A).
    if (isItcIneligible(row) && !includeIneligible) {
      sec.excluded++;
      t.ineligibleRows++;
      addTax(t.ineligibleTax, row, 1);
      const reason = String(row.itcReason ?? '').trim() || 'Marked ITC not available';
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
      continue;
    }

    const sign = rule.note ? noteSign(row.docType) : 1;
    if (rule.note && !up(row.docType)) unsignedNotes++;

    const target: ItcBucketBreakup['key'] =
      rule.kind === 'import' ? 'import'
      : rule.kind === 'isd' ? 'isd'
      : isReverseCharge(row) ? 'supply-rcm'
      : 'supply-oth';

    const dest = target === 'supply-rcm' ? t.itcRcm : t.itcNonRcm;
    addTax(dest, row, sign);
    addTax(buckets[target].tax, row, sign);
    buckets[target].rows++;

    addTax(sec.tax, row, sign);
    sec.counted++;
    t.eligibleRows++;
    if (rule.amendment) { amendmentRows++; amendmentLabels.add(rule.label); }
  }

  t.itcNonRcm = r4(t.itcNonRcm);
  t.itcRcm = r4(t.itcRcm);
  t.ineligibleTax = r4(t.ineligibleTax);
  t.byBucket = Object.values(buckets).filter((b) => b.rows > 0).map((b) => ({ ...b, tax: r4(b.tax) }));
  t.bySection = Array.from(perSection.values()).map((s) => ({ ...s, tax: r4(s.tax) }));
  t.ignoredSections = Array.from(ignored);
  t.ineligibleByReason = Array.from(reasons.entries())
    .map(([reason, n]) => ({ reason, rows: n }))
    .sort((a, b) => b.rows - a.rows);
  t.derivedTotal = round2(sum4(t.itcNonRcm) + sum4(t.itcRcm));
  t.summaryTotal = itcSummary && Number.isFinite(itcSummary.total) ? round2(num(itcSummary.total)) : null;

  // Last resort: a stored record that kept only the headline itcsumm (no rows).
  // We cannot split RCM out of a single total, so it all lands in OTH — flagged.
  const summarySplit: Split4 | null = itcSummary
    ? { igst: num(itcSummary.igst), cgst: num(itcSummary.cgst), sgst: num(itcSummary.sgst), cess: num(itcSummary.cess) }
    : null;
  if (!t.eligibleRows && !t.ineligibleRows && summarySplit && sum4(summarySplit) !== 0) {
    t.itcNonRcm = r4(summarySplit);
    t.derivedTotal = round2(sum4(t.itcNonRcm));
    t.warnings.push(
      'The stored GSTR-2B has no invoice rows — the headline 2B ITC summary was used and placed ' +
      'entirely in 4(A)(5) "All other ITC". Re-download the 2B to split reverse-charge credit out.',
    );
    return t;
  }

  if (amendmentRows) {
    t.warnings.push(
      `${amendmentRows} amendment row(s) (${Array.from(amendmentLabels).join(', ')}) were added at their ` +
      'REVISED value. GSTR-2B does not carry the original figure, so where the original document was ' +
      'already availed in an earlier month only the DIFFERENCE belongs in this Table 4 — review before filing.',
    );
  }
  if (unsignedNotes) {
    t.warnings.push(
      `${unsignedNotes} credit/debit note row(s) carry no note type — treated as DEBIT notes (added). ` +
      'Check them: a credit note must reduce ITC.',
    );
  }
  if (t.ineligibleRows && !includeIneligible) {
    t.warnings.push(
      `${t.ineligibleRows} row(s) marked "ITC not available" in the 2B were EXCLUDED ` +
      `(tax ${round2(sum4(t.ineligibleTax))}). Report them under Table 4(D) if required.`,
    );
  }
  if (sum4(t.itcRcm) === 0 && t.eligibleRows > 0) {
    t.warnings.push(
      'No reverse-charge rows in this 2B. GSTR-2B only shows RCM supplies reported by REGISTERED suppliers — ' +
      'RCM on unregistered purchases / imported services never appears here and must be added from books.',
    );
  }
  // Cross-check against the 2B headline. `itcSummary` is the ITC-AVAILABLE total
  // when the download carried `itcsumm`, but parsers.ts falls back to summing ALL
  // rows (ineligible included, notes unsigned) when it did not — so accept either
  // reading and warn only when the headline matches neither.
  if (t.summaryTotal != null && t.summaryTotal > 0) {
    const tol = Math.max(1, t.summaryTotal * 0.01);
    const withInelig = t.derivedTotal + sum4(t.ineligibleTax);
    const gap = Math.min(Math.abs(t.summaryTotal - t.derivedTotal), Math.abs(t.summaryTotal - withInelig));
    if (gap > tol) {
      t.warnings.push(
        `2B headline ITC ${t.summaryTotal} vs rows ${round2(t.derivedTotal)} eligible ` +
        `(${round2(withInelig)} including ineligible) — difference ${round2(gap)}; a section may be ` +
        'unparsed or a note unsigned. Reconcile before filing.',
      );
    }
  }
  return t;
}

/** Convenience: reduce a stored `GstDownloadRecord` (must be a GSTR-2B). */
export function reduceItcFromDownload(
  rec: Pick<GstDownloadRecord, 'rows' | 'itcSummary'> | null | undefined,
  options: Gstr3bItcOptions = {},
): Gstr3bItcTotals {
  return reduceItcFromGstr2b(rec?.rows, rec?.itcSummary ?? null, options);
}

/** The ITC slice of the month model this adapter is authoritative for. */
export type Gstr3bItcPatchValues = Pick<Gstr3bMonthData, 'itcNonRcm' | 'itcRcm'>;

export function itcTotalsToPatchValues(t: Gstr3bItcTotals): Gstr3bItcPatchValues {
  return { itcNonRcm: t.itcNonRcm, itcRcm: t.itcRcm };
}

/** The field keys this source writes — handy for the provenance legend. */
export const GSTR2B_ITC_FIELDS = ['itcNonRcm', 'itcRcm'] as const;

// ─── the source adapter ──────────────────────────────────────────────────────

function hasRows(rec: GstDownloadRecord | null): boolean {
  return !!rec && Array.isArray(rec.rows) && rec.rows.length > 0;
}

function hasSummary(rec: GstDownloadRecord | null): boolean {
  const s = rec?.itcSummary;
  return !!s && (num(s.igst) !== 0 || num(s.cgst) !== 0 || num(s.sgst) !== 0 || num(s.cess) !== 0);
}

function summarise(t: Gstr3bItcTotals, origin: string, when: string): string {
  const secs = t.bySection.filter((s) => s.rows > 0).map((s) => `${s.section}:${s.rows}`).join(', ');
  const folded = t.byBucket
    .filter((b) => (b.key === 'isd' || b.key === 'import') && b.rows > 0)
    .map((b) => `${b.key === 'isd' ? 'ISD' : 'imports'} ${b.rows} row(s) / ${round2(sum4(b.tax))}`);
  const parts = [
    `Table 4 ITC from ${origin}${when ? ` (${when})` : ''}.`,
    secs ? `Sections — ${secs}.` : 'No ITC-bearing sections with rows.',
    `${t.eligibleRows} eligible row(s) counted, ${t.ineligibleRows} ineligible row(s) excluded.`,
    `4(A)(5) other ITC ${round2(sum4(t.itcNonRcm))}, 4(A)(3) RCM ITC ${round2(sum4(t.itcRcm))}.`,
  ];
  if (folded.length) {
    parts.push(`Folded into 4(A)(5) for want of a separate field: ${folded.join('; ')}.`);
  }
  return [...parts, ...t.warnings].join(' ');
}

/** Portal error text that means the taxpayer session is gone, not a data problem. */
function looksLikeSessionError(status: number, error?: string): boolean {
  return status === 401 || /AUTH403|AUTH4033|session|expired|re-?login/i.test(error || '');
}

/**
 * Gstr3bSourceFn: Table 4 ITC from the GSTR-2B of the period.
 *
 * Stored 2B → used offline, `calls: 0`.
 * No stored 2B + session token → downloaded once (1 call), cached, then reduced.
 * No stored 2B + no token → `{ ok:false, needsSession:true }`.
 * Empty 2B for the period → `{ ok:true, noData:true }` with an empty patch.
 * Anything else that goes wrong → `{ ok:false, error }`. Never throws.
 */
export const gstr2bItcSource: Gstr3bSourceFn = async ({
  companyId, gstin, period, sessionToken,
}): Promise<SourceResult> => {
  const emptyPatch = (notes: string, calls = 0): Gstr3bPatch => ({
    source: 'gstr2b', values: {}, at: new Date().toISOString(), calls, notes,
  });

  try {
    if (!companyId || !period) {
      return { ok: false, error: 'A company and a return period (MMYYYY) are required.' };
    }

    // 1 — stored first: fully offline, no portal call.
    let rec: GstDownloadRecord | null = null;
    try {
      rec = getDownload(companyId, 'GSTR2B', period);
    } catch {
      rec = null; // storage unavailable (SSR / private mode) — fall through
    }
    let origin = 'stored GSTR-2B download';
    let calls = 0;

    // 2 — nothing usable stored: download only when a live session is available.
    if (!hasRows(rec) && !hasSummary(rec)) {
      if (rec?.noData) {
        return { ok: true, noData: true, patch: emptyPatch('GSTR-2B for this period is empty — no ITC to claim from 2B.') };
      }
      if (!sessionToken) {
        return { ok: false, needsSession: true, error: 'No GSTR-2B downloaded for this period. Connect a GST session to fetch it.' };
      }
      if (!gstin) return { ok: false, error: 'GSTIN is required to download GSTR-2B from the portal.' };

      const { year, month } = toApiYearMonth(period);
      const res = await sandboxClient.fetchReturn('GSTR2B', year, month, sessionToken);
      calls = 1;
      if (!res?.ok) {
        if (looksLikeSessionError(res?.status ?? 0, res?.error)) {
          return { ok: false, needsSession: true, error: res?.error || 'The GST taxpayer session has expired — sign in again.' };
        }
        return { ok: false, error: res?.error || 'GSTR-2B download failed.' };
      }

      const noData = isNoData(res.data);
      const { rows, itcSummary } = parseReturn('GSTR2B', res.data);
      rec = {
        type: 'GSTR2B', period, gstin, rows, itcSummary, noData,
        raw: res.data, fetchedAt: new Date().toISOString(),
      };
      try { saveDownload(companyId, rec); } catch { /* cache-only failure — ignore */ }
      origin = 'GSTR-2B downloaded from the portal';

      if (!hasRows(rec) && !hasSummary(rec)) {
        return { ok: true, noData: true, patch: emptyPatch('Portal reported no GSTR-2B data for this period.', calls) };
      }
    }

    // 3 — reduce.
    const totals = reduceItcFromDownload(rec);
    const when = rec?.fetchedAt ? new Date(rec.fetchedAt).toLocaleString('en-IN') : '';
    const patch: Gstr3bPatch = {
      source: 'gstr2b',
      values: itcTotalsToPatchValues(totals),
      at: new Date().toISOString(),
      calls,
      notes: summarise(totals, origin, when),
    };
    return { ok: true, patch };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not derive Table 4 ITC from GSTR-2B.' };
  }
};

export default gstr2bItcSource;
