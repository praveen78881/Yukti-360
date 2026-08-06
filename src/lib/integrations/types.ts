/* ─────────────────────────────────────────────────────────────────────────────
   ERP Bridge — shared types.

   An "external dataset" is a normalized trial-balance view of data exported
   from another ERP (Tally, Zoho Books, Winman, or any generic TB Excel/CSV).
   The comparison engine reconciles it against the app's own books.
   ──────────────────────────────────────────────────────────────────────────── */

export type ErpSource = 'tally' | 'zoho' | 'winman' | 'generic';

export const ERP_SOURCE_LABELS: Record<ErpSource, string> = {
  tally: 'Tally',
  zoho: 'Zoho Books',
  winman: 'Winman',
  generic: 'Excel / CSV',
};

export interface ExternalTBRow {
  account: string;
  group?: string;
  debit: number;   // closing balance debit side (0 when credit)
  credit: number;  // closing balance credit side (0 when debit)
}

export interface ExternalDataset {
  source: ErpSource;
  fileName: string;
  importedAt: string;
  rows: ExternalTBRow[];
  totalDebit: number;
  totalCredit: number;
  meta?: {
    minDate?: string;
    maxDate?: string;
    voucherCount?: number;
    layout?: string;  // which parser layout matched (for the UI/debugging)
  };
}

export type MatchKind = 'exact' | 'normalized' | 'alias' | 'fuzzy';

export type CompareStatus = 'matched' | 'mismatched' | 'only-external' | 'only-books';

export interface CompareRow {
  account: string;             // external display name (books name for only-books rows)
  booksAccount: string;        // matched books account name ('' when unmatched)
  matchKind?: MatchKind;
  externalNet: number;         // signed: +Dr / −Cr
  booksNet: number;            // signed: +Dr / −Cr
  difference: number;          // externalNet − booksNet
  status: CompareStatus;
}

export interface CompareResult {
  rows: CompareRow[];
  summary: {
    matched: number;
    mismatched: number;
    onlyExternal: number;
    onlyBooks: number;
    externalTotalDebit: number;
    externalTotalCredit: number;
    booksTotalDebit: number;
    booksTotalCredit: number;
    absoluteDifference: number;  // Σ|difference| across all rows
  };
}
