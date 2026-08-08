/**
 * GSTR-3B wiring contract.
 *
 * The GSTR-3B return for one month is assembled from several independent
 * sources. Every source implements the SAME shape — it returns a PATCH over the
 * month's figures plus provenance — so the page can offer them interchangeably,
 * show where each number came from, and let the CA override any of it by hand.
 *
 * OFFLINE-FIRST: sources are split into two classes.
 *   • Offline sources (books, accounts) need NO portal session and always work.
 *   • Online sources (portal 3B import, GSTR-1 filed, GSTR-2B, ledgers) need a
 *     taxpayer session; when absent they must return { ok:false, needsSession:true }
 *     and NEVER throw, so offline preparation is never blocked.
 *
 * The canonical per-month figure model is `Gstr3bMonthData` in
 * src/lib/accounting/gstr3bJson.ts — the same model the summary matrix edits and
 * the portal save-JSON is built from. Sources never invent their own shape.
 */

import type { Gstr3bMonthData } from '@/lib/accounting/gstr3bJson';

/** Where a figure came from. 'manual' = typed by the CA and never auto-overwritten. */
export type Gstr3bSource = 'books' | 'accounts' | 'gstr1' | 'gstr2b' | 'ledgers' | 'portal' | 'manual';

/** True for sources that require a live GST taxpayer session. */
export const ONLINE_SOURCES: ReadonlySet<Gstr3bSource> = new Set<Gstr3bSource>(['gstr1', 'gstr2b', 'ledgers', 'portal']);

/** Which fields of the month a source filled, for provenance display. */
export type Gstr3bFieldKey = keyof Gstr3bMonthData;

export interface Gstr3bPatch {
  source: Gstr3bSource;
  /** Only the fields this source is authoritative for. */
  values: Partial<Gstr3bMonthData>;
  /** ISO timestamp the data was produced/fetched. */
  at: string;
  /** Portal API calls consumed (drives the credit meter); 0 for offline sources. */
  calls?: number;
  /** Short human notes, e.g. "GSTR-1 filed 11-Jul-2026, 42 B2B invoices". */
  notes?: string;
}

export interface SourceResult {
  ok: boolean;
  patch?: Gstr3bPatch;
  /** Set when the source needs a taxpayer session that isn't available. */
  needsSession?: boolean;
  /** Set when the portal simply has nothing for this period (not an error). */
  noData?: boolean;
  error?: string;
}

/** Every source adapter implements this signature. */
export type Gstr3bSourceFn = (args: {
  companyId: string;
  gstin: string;
  /** Return period, MMYYYY. */
  period: string;
  /** Taxpayer session token; undefined when offline. */
  sessionToken?: string;
}) => Promise<SourceResult>;

/** Filing lifecycle of one month's 3B. */
export type Gstr3bStatus = 'draft' | 'imported' | 'filed';

/** What we persist per (company, period). */
export interface Gstr3bPeriodRecord {
  gstin: string;
  /** MMYYYY */
  period: string;
  data: Gstr3bMonthData;
  status: Gstr3bStatus;
  /** field → the source that last wrote it (so the UI can badge each row). */
  provenance: Partial<Record<Gstr3bFieldKey, Gstr3bSource>>;
  /** Per-source last-applied info, newest wins. */
  applied: { source: Gstr3bSource; at: string; notes?: string }[];
  updatedAt: string;
  /** ARN once filed on the portal. */
  arn?: string;
}

/** Merge a patch into a record: manual entries are never clobbered by an
 *  automatic source, and provenance is recorded per field.
 *
 *  `force` overrides that protection — it is what a deliberate RE-IMPORT does,
 *  so a CA who wants the portal's figures back can always get them. Only ever
 *  set it from an explicit user action, never from an automatic run. */
export function applyPatch(
  rec: Gstr3bPeriodRecord,
  patch: Gstr3bPatch,
  opts: { force?: boolean } = {},
): Gstr3bPeriodRecord {
  const data = { ...rec.data };
  const provenance = { ...rec.provenance };
  for (const [k, v] of Object.entries(patch.values)) {
    const key = k as Gstr3bFieldKey;
    if (!opts.force && provenance[key] === 'manual' && patch.source !== 'manual') continue; // CA's value wins
    (data as Record<string, unknown>)[key] = v;
    provenance[key] = patch.source;
  }
  return {
    ...rec,
    data,
    provenance,
    applied: [{ source: patch.source, at: patch.at, notes: patch.notes }, ...rec.applied.filter((a) => a.source !== patch.source)].slice(0, 8),
    status: rec.status === 'filed' ? 'filed' : patch.source === 'portal' ? 'imported' : rec.status,
    updatedAt: new Date().toISOString(),
  };
}
