import type { JournalEntry } from './computeEngine';

/** One contra journal line of a ledger posting (the other side of the entry). */
export interface LedgerContraLine {
  account: string;
  debit: number;
  credit: number;
}

export interface LedgerRow {
  date: string;
  entry_id: string;
  entry_code: string;
  particulars: string;
  voucher_type: string;
  debit: number;
  credit: number;
  running_balance: number;
  balance_type: 'Dr' | 'Cr';
  /**
   * Every contra line of the entry, in entry line order — lets a view list the
   * other accounts line by line instead of the comma-joined `particulars`.
   * Additive: `particulars` and every figure above are unchanged.
   */
  contra?: LedgerContraLine[];
  /**
   * True when the contra lines are an exact split of this posting: this line is
   * alone on its side and every contra line sits on the opposite side, so their
   * amounts add up to this row's debit/credit. False means a "Sundries" posting
   * (contra lines on both sides) — the contra amounts are detail only.
   */
  contra_is_split?: boolean;
}

export function computeLedger(
  entries: JournalEntry[],
  accountName: string
): LedgerRow[] {
  const rows: LedgerRow[] = [];
  let runningDebit = 0;
  let runningCredit = 0;

  const isAllSales = accountName === 'All Sales Accounts';
  const isAllPurchases = accountName === 'All Purchase Accounts';

  for (const entry of entries) {
    const matchingLines = entry.lines.filter(l => {
      if (isAllSales) return l.account_group === 'Revenue from Operations';
      if (isAllPurchases) return l.account_group === 'Purchases of Stock-in-Trade';
      return l.account_name === accountName;
    });

    if (matchingLines.length === 0) continue;

    for (const line of matchingLines) {
      const contraLines = entry.lines.filter(l => {
        if (isAllSales) return l.account_group !== 'Revenue from Operations';
        if (isAllPurchases) return l.account_group !== 'Purchases of Stock-in-Trade';
        return l.account_name !== accountName;
      });
      const otherAccounts = contraLines.map(l => l.account_name);

      const isDebitSide = (line.debit || 0) > 0;
      const posted = isDebitSide ? (line.debit || 0) : (line.credit || 0);
      const onOppositeSide = (l: { debit?: number; credit?: number }) =>
        isDebitSide ? (l.credit || 0) > 0 && !((l.debit || 0) > 0) : (l.debit || 0) > 0 && !((l.credit || 0) > 0);
      const oppositeSum = contraLines.reduce((s, l) => s + (isDebitSide ? (l.credit || 0) : (l.debit || 0)), 0);
      const isZeroLine = (l: { debit?: number; credit?: number }) => !(l.debit || 0) && !(l.credit || 0);
      const contraIsSplit =
        contraLines.length > 0 &&
        contraLines.every(l => isZeroLine(l) || onOppositeSide(l)) &&
        Math.abs(oppositeSum - posted) < 0.005;

      let particulars = otherAccounts.length === 1
        ? otherAccounts[0]
        : 'Sundries (' + otherAccounts.join(', ') + ')';

      if (isAllSales || isAllPurchases) {
        particulars = `${line.account_name} (${particulars})`;
      }

      runningDebit += line.debit || 0;
      runningCredit += line.credit || 0;
      const diff = runningDebit - runningCredit;

      rows.push({
        date: entry.entry_date,
        entry_id: entry.id,
        entry_code: entry.entry_code,
        particulars,
        voucher_type: entry.voucher_type,
        debit: line.debit || 0,
        credit: line.credit || 0,
        running_balance: Math.abs(diff),
        balance_type: diff >= 0 ? 'Dr' : 'Cr',
        contra: contraLines.map(l => ({ account: l.account_name, debit: l.debit || 0, credit: l.credit || 0 })),
        contra_is_split: contraIsSplit,
      });
    }
  }
  return rows;
}

export function computeLedgerTFormat(
  entries: JournalEntry[],
  accountName: string
): { debitSide: LedgerRow[]; creditSide: LedgerRow[] } {
  const allRows = computeLedger(entries, accountName);
  return {
    debitSide: allRows.filter(r => r.debit > 0),
    creditSide: allRows.filter(r => r.credit > 0),
  };
}
