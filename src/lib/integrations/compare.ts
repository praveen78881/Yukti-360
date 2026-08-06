import { computeTrialBalance } from '@/lib/accounting/trialBalance';
import { matchAccountName } from './normalize';
import type { CompareResult, CompareRow, ExternalDataset } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
   ERP Bridge — reconciliation engine.

   Compares an external ERP's trial balance against the books ("balance per
   books" from the journal via computeTrialBalance). Matching is one-to-one:
   each books account pairs with at most one external row.
   ──────────────────────────────────────────────────────────────────────────── */

const TOLERANCE = 0.01;

export function compareWithBooks(
  companyId: string,
  external: ExternalDataset,
  range?: { fromDate?: string; toDate?: string },
): CompareResult {
  const books = computeTrialBalance(companyId, range?.fromDate, range?.toDate);
  const booksNames = books.rows.map((r) => r.account_name);
  const used = new Set<number>();
  const rows: CompareRow[] = [];

  for (const ext of external.rows) {
    const externalNet = Math.round((ext.debit - ext.credit) * 100) / 100;
    const match = matchAccountName(ext.account, booksNames, used);
    if (!match) {
      rows.push({
        account: ext.account,
        booksAccount: '',
        externalNet,
        booksNet: 0,
        difference: externalNet,
        status: 'only-external',
      });
      continue;
    }
    used.add(match.index);
    const b = books.rows[match.index];
    const booksNet = Math.round((b.balance_type === 'Dr' ? b.balance : -b.balance) * 100) / 100;
    const difference = Math.round((externalNet - booksNet) * 100) / 100;
    rows.push({
      account: ext.account,
      booksAccount: b.account_name,
      matchKind: match.kind,
      externalNet,
      booksNet,
      difference,
      status: Math.abs(difference) <= TOLERANCE ? 'matched' : 'mismatched',
    });
  }

  // Books accounts the external ERP doesn't have at all.
  books.rows.forEach((b, i) => {
    if (used.has(i) || Math.round(b.balance * 100) === 0) return;
    const booksNet = Math.round((b.balance_type === 'Dr' ? b.balance : -b.balance) * 100) / 100;
    rows.push({
      account: b.account_name,
      booksAccount: b.account_name,
      externalNet: 0,
      booksNet,
      difference: -booksNet,
      status: 'only-books',
    });
  });

  const statusRank: Record<CompareRow['status'], number> = {
    mismatched: 0, 'only-external': 1, 'only-books': 2, matched: 3,
  };
  rows.sort((a, b) =>
    statusRank[a.status] - statusRank[b.status] || Math.abs(b.difference) - Math.abs(a.difference));

  return {
    rows,
    summary: {
      matched: rows.filter((r) => r.status === 'matched').length,
      mismatched: rows.filter((r) => r.status === 'mismatched').length,
      onlyExternal: rows.filter((r) => r.status === 'only-external').length,
      onlyBooks: rows.filter((r) => r.status === 'only-books').length,
      externalTotalDebit: external.totalDebit,
      externalTotalCredit: external.totalCredit,
      booksTotalDebit: Math.round(books.totalDebit * 100) / 100,
      booksTotalCredit: Math.round(books.totalCredit * 100) / 100,
      absoluteDifference: Math.round(rows.reduce((s, r) => s + Math.abs(r.difference), 0) * 100) / 100,
    },
  };
}
