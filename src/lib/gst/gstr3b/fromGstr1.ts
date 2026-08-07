/**
 * GSTR-3B source: Table 3.1 OUTWARD supplies derived from the FILED GSTR-1
 * (+ GSTR-1A) of the same return period.
 *
 * OFFLINE FIRST. The section-wise snapshot imported by
 * `src/lib/gst/sandbox/gstr1FiledCombined.ts` is already persisted under the
 * company (entity_data → gst / `gstr1_combined_<MMYYYY>`). This adapter reads
 * THAT first and does zero network work. Only when nothing is stored AND a
 * taxpayer session token is supplied does it import from the portal; with no
 * stored data and no token it returns `{ ok:false, needsSession:true }` so an
 * offline 3B preparation is never blocked.
 *
 * It fills ONLY the outward side of `Gstr3bMonthData`:
 *     txval31a, taxNonRcm   — taxable outward supplies (other than zero-rated /
 *                             nil / exempt / non-GST)
 *     txval31b              — zero-rated (exports + SEZ)
 *     txval31c              — nil-rated + exempted
 *     txval31e              — non-GST outward
 * It never touches ITC, RCM (3.1(d)), Table 5, interest or late fee.
 */

import { round2, type Split4, type Gstr3bMonthData } from '@/lib/accounting/gstr3bJson';
import type { FiledRow, FiledSection } from '@/lib/gst/sandbox/gstr1FiledDetail';
import {
  getCombinedFiled,
  importCombinedFiled,
  saveCombinedFiled,
  type CombinedFiled,
} from '@/lib/gst/sandbox/gstr1FiledCombined';
import { toApiYearMonth } from '@/lib/gst/sandbox/period';
import type { Gstr3bPatch, Gstr3bSourceFn, SourceResult } from './types';

// ─── small helpers ───────────────────────────────────────────────────────────

function num(x: unknown): number {
  const n = typeof x === 'string' ? parseFloat(x) : (x as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}
const zero4 = (): Split4 => ({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
function addTax(acc: Split4, row: FiledRow, sign: number): void {
  acc.igst += sign * num(row.igst);
  acc.cgst += sign * num(row.cgst);
  acc.sgst += sign * num(row.sgst);
  acc.cess += sign * num(row.cess);
}
const r4 = (s: Split4): Split4 => ({
  igst: round2(s.igst), cgst: round2(s.cgst), sgst: round2(s.sgst), cess: round2(s.cess),
});

// ─── classification ──────────────────────────────────────────────────────────

/** Which Table 3.1 line a row lands on. */
type Bucket = 'a' | 'b' | 'c' | 'e';

/**
 * Supply-type codes that make a document ZERO-RATED for 3.1(b).
 * `SEWP/SEWOP` are the GSTR-1 B2B `inv_typ` codes for SEZ supplies with / without
 * payment of tax; `SEZWP/SEZWOP` are the summary/section variants; `EXPWP/EXPWOP`
 * are the CDNUR `typ` codes for export notes. `DE` (deemed export) is NOT
 * zero-rated — deemed exports are reported in 3.1(a).
 */
const ZERO_RATED_CODES = new Set(['SEWP', 'SEWOP', 'SEZWP', 'SEZWOP', 'EXPWP', 'EXPWOP', 'EXPORT']);

function isZeroRatedCode(t: string | undefined): boolean {
  return !!t && ZERO_RATED_CODES.has(String(t).trim().toUpperCase());
}

/** Credit notes REDUCE the outward figures; debit notes add. `ntty` is C/D (R = refund voucher). */
function noteSign(t: string | undefined): number {
  return String(t ?? '').trim().toUpperCase() === 'C' ? -1 : 1;
}

interface SectionRule {
  /** Base bucket when the row carries no supply-type discriminator. */
  bucket: Bucket;
  /** +1 adds, -1 subtracts. */
  sign: number;
  /** Row is a credit/debit note — take the sign from its `ntty`. */
  note?: boolean;
  /** Row may name a zero-rated supply type in `type` → re-route to 3.1(b). */
  zeroRatedByType?: boolean;
  /** Amendment section: the portal reports the REVISED value, not the delta. */
  amendment?: boolean;
  /** Advance received (11A) / adjusted (11B). */
  advance?: boolean;
  label: string;
}

/** FiledSection.key → how it feeds Table 3.1. Sections absent here are ignored. */
const RULES: Record<string, SectionRule> = {
  // Table 4 / 5 / 7 — taxable outward supplies
  b2b:    { bucket: 'a', sign: +1, zeroRatedByType: true, label: 'B2B' },
  b2cl:   { bucket: 'a', sign: +1, label: 'B2CL' },
  b2cs:   { bucket: 'a', sign: +1, label: 'B2CS' },
  // Table 6A — exports
  exp:    { bucket: 'b', sign: +1, label: 'EXP' },
  // Table 9B — credit / debit notes
  cdnr:   { bucket: 'a', sign: +1, note: true, zeroRatedByType: true, label: 'CDNR' },
  cdnur:  { bucket: 'a', sign: +1, note: true, zeroRatedByType: true, label: 'CDNUR' },
  // Amendments (Tables 9A / 9C / 10)
  b2ba:   { bucket: 'a', sign: +1, zeroRatedByType: true, amendment: true, label: 'B2BA' },
  b2cla:  { bucket: 'a', sign: +1, amendment: true, label: 'B2CLA' },
  b2csa:  { bucket: 'a', sign: +1, amendment: true, label: 'B2CSA' },
  expa:   { bucket: 'b', sign: +1, amendment: true, label: 'EXPA' },
  cdnra:  { bucket: 'a', sign: +1, note: true, zeroRatedByType: true, amendment: true, label: 'CDNRA' },
  cdnura: { bucket: 'a', sign: +1, note: true, zeroRatedByType: true, amendment: true, label: 'CDNURA' },
  // Table 8 — nil-rated / exempt / non-GST (split per row, see reducer)
  nil:    { bucket: 'c', sign: +1, label: 'NIL' },
  // Tables 11A / 11B — advances received / adjusted
  at:     { bucket: 'a', sign: +1, advance: true, label: 'AT' },
  ata:    { bucket: 'a', sign: +1, advance: true, amendment: true, label: 'ATA' },
  txpd:   { bucket: 'a', sign: -1, advance: true, label: 'TXPD' },
  txpda:  { bucket: 'a', sign: -1, advance: true, amendment: true, label: 'TXPDA' },
  // hsn / doc are summaries of the above — never added (hsn is used only as a
  // cross-check, see below).
};

// ─── the pure reducer ────────────────────────────────────────────────────────

export interface Gstr3bOutwardOptions {
  /**
   * Include Tables 11A/11B (advances received, less advances adjusted) in
   * 3.1(a). The portal's own system-generated 3B does this. Default true.
   */
  includeAdvances?: boolean;
  /**
   * Include the amendment tables (B2BA/B2CSA/CDNRA/…). They carry the REVISED
   * figure of a document belonging to an EARLIER period, not the differential,
   * so including them overstates 3.1 whenever the original was already declared.
   * Default true (matching "…and their amendments"), with a warning raised.
   */
  includeAmendments?: boolean;
}

export interface Gstr3bOutwardTotals {
  /** 3.1(a) taxable value and its tax. */
  taxable31a: number;
  tax31a: Split4;
  /** 3.1(b) zero-rated taxable value (tax is informational — 3B has no field for it). */
  taxable31b: number;
  tax31b: Split4;
  /** 3.1(c) nil-rated + exempted. */
  taxable31c: number;
  /** 3.1(e) non-GST outward. */
  taxable31e: number;
  /** Per-section contribution, for a provenance drill-in. */
  bySection: { key: string; label: string; rows: number; taxable: number; buckets: Bucket[] }[];
  /** Sections present in the snapshot but deliberately not summed. */
  ignored: string[];
  /** Non-fatal advisories the UI should surface to the CA. */
  warnings: string[];
}

function emptyTotals(): Gstr3bOutwardTotals {
  return {
    taxable31a: 0, tax31a: zero4(),
    taxable31b: 0, tax31b: zero4(),
    taxable31c: 0, taxable31e: 0,
    bySection: [], ignored: [], warnings: [],
  };
}

/**
 * Pure reducer over the parsed FILED GSTR-1 sections → Table 3.1 outward
 * figures. Never throws, never touches storage or the network, so it can be
 * exercised offline against any stored `CombinedFiled` record or a sample.
 *
 * Pass the GSTR-1 sections and the GSTR-1A sections together (concatenated) —
 * both feed the same tables.
 */
export function reduceOutwardFromFiled(
  sections: readonly FiledSection[] | null | undefined,
  options: Gstr3bOutwardOptions = {},
): Gstr3bOutwardTotals {
  const includeAdvances = options.includeAdvances !== false;
  const includeAmendments = options.includeAmendments !== false;
  const t = emptyTotals();
  if (!Array.isArray(sections)) return t;

  const amendmentSections: string[] = [];
  let hsnTaxable = 0;
  let multiRateSuspects = 0;

  for (const sec of sections) {
    if (!sec || typeof sec !== 'object') continue;
    const key = String(sec.key ?? '').toLowerCase();
    const rows: FiledRow[] = Array.isArray(sec.rows) ? sec.rows : [];

    if (key === 'hsn') {
      for (const r of rows) hsnTaxable += num(r.taxable);
      t.ignored.push('hsn (Table 12 — summary of the same supplies)');
      continue;
    }
    const rule = RULES[key];
    if (!rule) {
      if (rows.length) t.ignored.push(key || '(unnamed)');
      continue;
    }
    if (rule.amendment && !includeAmendments) { t.ignored.push(`${key} (amendments excluded)`); continue; }
    if (rule.advance && !includeAdvances) { t.ignored.push(`${key} (advances excluded)`); continue; }
    if (rule.amendment && rows.length) amendmentSections.push(rule.label);

    const buckets = new Set<Bucket>();
    let secTaxable = 0;

    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;

      // Table 8 rows carry three amounts at once and never any tax.
      if (key === 'nil') {
        const cAmt = num(row.nilAmt) + num(row.exptAmt);
        const eAmt = num(row.ngsupAmt);
        t.taxable31c += cAmt; t.taxable31e += eAmt;
        secTaxable += cAmt + eAmt;
        if (cAmt) buckets.add('c');
        if (eAmt) buckets.add('e');
        continue;
      }

      const sign = rule.sign * (rule.note ? noteSign(row.type) : 1);
      const bucket: Bucket = rule.zeroRatedByType && isZeroRatedCode(row.type) ? 'b' : rule.bucket;
      const taxable = sign * num(row.taxable);

      if (bucket === 'b') {
        t.taxable31b += taxable;
        addTax(t.tax31b, row, sign);
      } else {
        t.taxable31a += taxable;
        addTax(t.tax31a, row, sign);
      }
      buckets.add(bucket);
      secTaxable += taxable;

      // A collapsed multi-rate invoice shows tax that cannot come from the one
      // rate/taxable pair we hold (see the itms[0] caveat below).
      if (num(row.rate) > 0 && num(row.taxable) > 0) {
        const declared = Math.abs(num(row.igst) + num(row.cgst) + num(row.sgst));
        const expected = Math.abs((num(row.taxable) * num(row.rate)) / 100);
        if (expected > 0 && Math.abs(declared - expected) > Math.max(1, expected * 0.02)) multiRateSuspects++;
      }
    }

    t.bySection.push({
      key, label: sec.label || rule.label, rows: rows.length,
      taxable: round2(secTaxable), buckets: Array.from(buckets),
    });
  }

  t.taxable31a = round2(t.taxable31a);
  t.taxable31b = round2(t.taxable31b);
  t.taxable31c = round2(t.taxable31c);
  t.taxable31e = round2(t.taxable31e);
  t.tax31a = r4(t.tax31a);
  t.tax31b = r4(t.tax31b);

  if (amendmentSections.length) {
    t.warnings.push(
      `Amendment tables (${amendmentSections.join(', ')}) were added at their REVISED value. ` +
      `GSTR-1 does not carry the original figure, so if the amended documents belong to an ` +
      `earlier period only the DIFFERENCE belongs in this month's 3.1 — review before filing.`,
    );
  }
  if (multiRateSuspects) {
    t.warnings.push(
      `${multiRateSuspects} row(s) show tax inconsistent with their single rate — the filed-detail ` +
      `parser keeps only the FIRST rate line of each document, so multi-rate invoices are under-stated.`,
    );
  }
  const declaredTotal = t.taxable31a + t.taxable31b + t.taxable31c + t.taxable31e;
  if (hsnTaxable > 0 && declaredTotal < hsnTaxable * 0.95) {
    t.warnings.push(
      `Table 12 (HSN) totals ${round2(hsnTaxable)} but the 3.1 lines total ${round2(declaredTotal)} — ` +
      `cross-check for multi-rate invoices or a section that failed to import.`,
    );
  }
  return t;
}

/** Convenience: reduce a stored `CombinedFiled` (GSTR-1 + GSTR-1A together). */
export function reduceOutwardFromCombined(
  combined: Pick<CombinedFiled, 'gstr1' | 'gstr1a'> | null | undefined,
  options: Gstr3bOutwardOptions = {},
): Gstr3bOutwardTotals {
  const g1 = Array.isArray(combined?.gstr1) ? combined!.gstr1 : [];
  const g1a = Array.isArray(combined?.gstr1a) ? combined!.gstr1a : [];
  return reduceOutwardFromFiled([...g1, ...g1a], options);
}

/** The outward slice of the month model this adapter is authoritative for. */
export type Gstr3bOutwardPatchValues = Pick<
  Gstr3bMonthData, 'txval31a' | 'txval31b' | 'txval31c' | 'txval31e' | 'taxNonRcm'
>;

export function totalsToPatchValues(t: Gstr3bOutwardTotals): Gstr3bOutwardPatchValues {
  return {
    txval31a: t.taxable31a,
    txval31b: t.taxable31b,
    txval31c: t.taxable31c,
    txval31e: t.taxable31e,
    taxNonRcm: t.tax31a,
  };
}

/** The field keys this source writes — handy for the provenance legend. */
export const GSTR1_OUTWARD_FIELDS = [
  'txval31a', 'txval31b', 'txval31c', 'txval31e', 'taxNonRcm',
] as const;

// ─── the source adapter ──────────────────────────────────────────────────────

function hasSections(c: CombinedFiled | null): c is CombinedFiled {
  return !!c && ((Array.isArray(c.gstr1) && c.gstr1.length > 0) || (Array.isArray(c.gstr1a) && c.gstr1a.length > 0));
}

function summarise(t: Gstr3bOutwardTotals, origin: string, when: string): string {
  const secs = t.bySection.filter((s) => s.rows > 0).map((s) => `${s.label}:${s.rows}`).join(', ');
  const head = `Table 3.1 from ${origin}${when ? ` (${when})` : ''}.`;
  const body = secs ? ` Sections — ${secs}.` : ' No outward sections with rows.';
  return [head + body, ...t.warnings].join(' ');
}

/**
 * Gstr3bSourceFn: Table 3.1 outward supplies from the filed GSTR-1 / GSTR-1A.
 *
 * Stored snapshot → used offline, `calls: 0`.
 * No snapshot + session token → imported once, saved, `calls` = portal calls spent.
 * No snapshot + no token → `{ ok:false, needsSession:true }`.
 * Nothing filed for the period → `{ ok:true, noData:true }` with an empty patch.
 */
export const gstr1OutwardSource: Gstr3bSourceFn = async ({
  companyId, gstin, period, sessionToken,
}): Promise<SourceResult> => {
  const emptyPatch = (notes: string, calls = 0): Gstr3bPatch => ({
    source: 'gstr1', values: {}, at: new Date().toISOString(), calls, notes,
  });

  try {
    if (!companyId || !period) {
      return { ok: false, error: 'A company and a return period (MMYYYY) are required.' };
    }

    // 1 — stored first: fully offline, no portal call.
    let combined: CombinedFiled | null = null;
    try {
      combined = getCombinedFiled(companyId, period);
    } catch {
      combined = null; // storage unavailable (SSR / private mode) — fall through
    }
    let origin = 'stored GSTR-1 import';
    let calls = 0;

    // 2 — nothing stored: import only when a live session is available.
    if (!hasSections(combined)) {
      if (!sessionToken) {
        return combined
          // A snapshot exists but is empty → the period really had nothing filed.
          ? { ok: true, noData: true, patch: emptyPatch('No GSTR-1 / GSTR-1A sections filed for this period.') }
          : { ok: false, needsSession: true, error: 'No GSTR-1 imported for this period. Connect a GST session to fetch it.' };
      }
      if (!gstin) return { ok: false, error: 'GSTIN is required to import GSTR-1 from the portal.' };

      const { year, month } = toApiYearMonth(period);
      const fetched = await importCombinedFiled(gstin, year, month, sessionToken);
      calls = fetched?.calls ?? 0;
      try { saveCombinedFiled(companyId, fetched); } catch { /* cache-only failure — ignore */ }
      combined = fetched ?? null;
      origin = 'GSTR-1 imported from the portal';

      if (!hasSections(combined)) {
        return { ok: true, noData: true, patch: emptyPatch('Portal reported no GSTR-1 / GSTR-1A data for this period.', calls) };
      }
    }

    // 3 — reduce.
    const totals = reduceOutwardFromCombined(combined);
    const when = combined.importedAt ? new Date(combined.importedAt).toLocaleString('en-IN') : '';
    const patch: Gstr3bPatch = {
      source: 'gstr1',
      values: totalsToPatchValues(totals),
      at: new Date().toISOString(),
      calls,
      notes: summarise(totals, origin, when),
    };
    return { ok: true, patch };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not derive Table 3.1 from GSTR-1.' };
  }
};

export default gstr1OutwardSource;
