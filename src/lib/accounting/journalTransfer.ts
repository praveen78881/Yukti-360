// Journal transfer format — the single source of truth for import/export shape.
// Structure (v2), matching the certified sample `ambugo_journal_import.json`:
//   { schema:'vaarta_journal_import_v2', company_name, exported_at, count,
//     entries:[ { entry_date, voucher_type, voucher_number, narration,
//                 lines:[ { account_name, account_group, nature, debit, credit } ] } ] }
// Used by the Companies page: right-click a company → Export company writes this
// file; New Company → Import reads it back into a new company.
//
// ORDER is part of the contract: files are written in `orderForTransfer` order
// (the Journal page's display order) and imports create entries in that same
// order, so an exported company re-imports in exactly the same sequence.

export const JOURNAL_SCHEMA = 'vaarta_journal_import_v2';
const JOURNAL_SCHEMA_LEGACY = 'vaarta_journal_import_v1';

export type JournalNature = 'asset' | 'liability' | 'capital' | 'revenue' | 'expense';

export interface TransferLine {
  account_name: string;
  account_group: string;
  nature: JournalNature;
  debit: number;
  credit: number;
}
export interface TransferEntry {
  entry_date: string;      // YYYY-MM-DD
  voucher_type: string;
  voucher_number: string | null;
  narration: string;
  lines: TransferLine[];
}
export interface JournalPayload {
  schema: string;
  company_name: string;
  exported_at: string;
  count: number;
  entries: TransferEntry[];
}

// Minimal shape of a stored journal entry (offlineDb JournalEntry is a superset).
interface SourceEntry {
  entry_date: string;
  voucher_type: string;
  voucher_number?: string | null;
  narration?: string;
  lines?: Array<{ account_name?: string; account_group?: string; nature?: string; debit?: number; credit?: number }>;
}

const num = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/**
 * Canonical transfer order — the order the Journal page shows: entry date
 * ascending (compared the same way listJournalEntries sorts), and entries on the
 * same date kept in the order given. The tie-break is the explicit original
 * position, so the result never depends on the engine's sort stability.
 * Export writes files in this order and import creates entries in it, which is
 * what makes export → import reproduce the same sequence.
 */
export function orderForTransfer<T extends { entry_date: string }>(entries: readonly T[]): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.entry_date.localeCompare(b.entry.entry_date) || a.index - b.index)
    .map((x) => x.entry);
}

/** Build the v2 export payload from stored entries (drops app-internal fields). */
export function buildJournalPayload(companyName: string, entries: SourceEntry[], exportedAt = new Date().toISOString()): JournalPayload {
  const out: TransferEntry[] = orderForTransfer(entries).map((e) => ({
    entry_date: e.entry_date,
    voucher_type: e.voucher_type,
    voucher_number: e.voucher_number ?? null,
    narration: e.narration ?? '',
    lines: (e.lines ?? []).map((l) => ({
      account_name: String(l.account_name ?? '').trim(),
      account_group: String(l.account_group ?? '').trim(),
      nature: l.nature as JournalNature,
      debit: num(l.debit),
      credit: num(l.credit),
    })),
  }));
  return { schema: JOURNAL_SCHEMA, company_name: companyName, exported_at: exportedAt, count: out.length, entries: out };
}

const isNature = (n: unknown): n is JournalNature =>
  n === 'asset' || n === 'liability' || n === 'capital' || n === 'revenue' || n === 'expense';

/** Validate + normalize one line; returns null if unusable. */
function normalizeLine(line: any): TransferLine | null {
  const account_name = String(line?.account_name ?? '').trim();
  const account_group = String(line?.account_group ?? '').trim();
  const nature = line?.nature;
  if (!account_name || !account_group || !isNature(nature)) return null;
  return { account_name, account_group, nature, debit: num(line?.debit), credit: num(line?.credit) };
}

export interface ParsedJournal {
  ok: boolean;
  error?: string;
  schema?: string;
  companyName?: string;   // v2 (company_name) — used to name an imported company / warn on mismatch
  companyId?: string;     // v1 (company_id)  — legacy cross-company guard
  entries: TransferEntry[];
  skipped: number;        // entries dropped as invalid
}

/** Parse a journal JSON string (accepts v2 and legacy v1). Never throws. */
export function parseJournalJson(raw: string): ParsedJournal {
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return { ok: false, error: 'File is not valid JSON.', entries: [], skipped: 0 }; }
  const schema: string | undefined = parsed?.schema;
  if (schema && schema !== JOURNAL_SCHEMA && schema !== JOURNAL_SCHEMA_LEGACY) {
    return { ok: false, error: `Unsupported schema "${schema}". Expected ${JOURNAL_SCHEMA}.`, entries: [], skipped: 0 };
  }
  const rawEntries: any[] = Array.isArray(parsed?.entries) ? parsed.entries : [];
  let skipped = 0;
  const entries: TransferEntry[] = [];
  for (const it of rawEntries) {
    const lines = Array.isArray(it?.lines) ? it.lines.map(normalizeLine).filter((l: TransferLine | null): l is TransferLine => !!l) : [];
    if (!it?.entry_date || !it?.voucher_type || lines.length === 0) { skipped += 1; continue; }
    entries.push({
      entry_date: String(it.entry_date),
      voucher_type: String(it.voucher_type),
      voucher_number: it.voucher_number === undefined ? null : (it.voucher_number ?? null),
      narration: it.narration ?? '',
      lines,
    });
  }
  return {
    ok: true,
    schema,
    companyName: parsed?.company_name ? String(parsed.company_name) : undefined,
    companyId: parsed?.company_id ? String(parsed.company_id) : undefined,
    entries,
    skipped,
  };
}

/** Financial-year label ('2025-2026') from an entry date, for book_period. */
export function bookPeriodFromDate(entryDate: string): string {
  const d = new Date(`${entryDate}T00:00:00`);
  const m = d.getMonth(); const y = d.getFullYear();
  const start = m < 3 ? y - 1 : y;
  return `${start}-${start + 1}`;
}
