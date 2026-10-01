import type { JournalEntry } from './computeEngine';

/** Legacy 30/60/90/180 buckets (retained for backward compatibility). */
export interface AgeingBucket {
  /** Not aged yet: dated after the as-at date (bill basis) or not yet due (due basis). */
  current: number;
  days_0_30: number;
  days_31_60: number;
  days_61_90: number;
  days_91_180: number;
  days_over_180: number;
  total: number;
}

/** Schedule III (2021) amendment: outstanding ageing buckets. */
export interface ScheduleIIIAgeingBucket {
  /** Due-date basis only: open bills whose due date is after the as-at date. */
  notYetDue?: number;
  lessThan6Months: number;
  sixMonthsTo1Year: number;
  oneYearTo2Years: number;
  twoYearsTo3Years: number;
  moreThan3Years: number;
  total: number;
}

export interface AgeingRow {
  accountName: string;
  ageing: AgeingBucket;
  /** Schedule III format when format === 'schedule_iii'. */
  scheduleIIIAgeing?: ScheduleIIIAgeingBucket;
  /** Disputed amount (when entries/lines carry is_disputed). */
  disputedAmount?: number;
  /** Undisputed amount. */
  undisputedAmount?: number;
}

/** What an open bill is aged from: its bill (entry) date, or its due date. */
export type AgeingBasis = 'bill' | 'due';

export interface AgeingOptions {
  /** Defaults to 'bill'. */
  basis?: AgeingBasis;
  /** Due dates keyed by voucher number — a journal entry posted from an invoice
      carries the invoice number as its voucher number. Read only for the 'due'
      basis; a bill without a due date is aged from its bill date. */
  dueDates?: ReadonlyMap<string, string>;
}

/** Due dates by invoice number, for `AgeingOptions.dueDates`. Invoices without
    one (cash / online bills, or none entered) are left out. */
export function dueDatesByVoucher(invoices: Iterable<{ invoice_no?: string; due_date?: string }>): Map<string, string> {
  const map = new Map<string, string>();
  for (const inv of invoices) {
    if (inv.invoice_no && inv.due_date) map.set(inv.invoice_no, inv.due_date);
  }
  return map;
}

const DAYS_6M = 183;
const DAYS_1Y = 365;
const DAYS_2Y = 730;
const DAYS_3Y = 1095;

function buildAgeing(
  entries: JournalEntry[],
  asAtDate: string,
  groupNames: string[],
  debitIsCreation: boolean,
  format: 'legacy' | 'schedule_iii' = 'legacy',
  { basis = 'bill', dueDates }: AgeingOptions = {}
): AgeingRow[] {
  const asAt = new Date(asAtDate);
  type Inv = { date: Date; amount: number; disputed?: boolean };
  const partyMap = new Map<string, { invoices: Inv[] }>();

  // Payments settle the earliest bills first on either basis, so each bill's
  // open amount — and so the party total — is identical; the basis only moves
  // the date an open bill is aged from.
  const agedFrom = (entry: JournalEntry): Date => {
    const due = basis === 'due' && entry.voucher_number ? dueDates?.get(entry.voucher_number) : undefined;
    const dueDate = due ? new Date(due) : null;
    return dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : new Date(entry.entry_date);
  };

  for (const entry of entries) {
    const entryDisputed = (entry as { is_disputed?: boolean }).is_disputed ?? false;
    for (const line of entry.lines) {
      if (!groupNames.includes(line.account_group)) continue;
      const disputed = (line as { disputed?: boolean }).disputed ?? entryDisputed;

      if (!partyMap.has(line.account_name)) {
        partyMap.set(line.account_name, { invoices: [] });
      }
      const party = partyMap.get(line.account_name)!;

      const creation = debitIsCreation ? (line.debit || 0) : (line.credit || 0);
      const settlement = debitIsCreation ? (line.credit || 0) : (line.debit || 0);

      if (creation > 0) {
        party.invoices.push({ date: agedFrom(entry), amount: creation, disputed });
      } else if (settlement > 0) {
        let remaining = settlement;
        for (const inv of party.invoices) {
          if (remaining <= 0) break;
          const reduce = Math.min(inv.amount, remaining);
          inv.amount -= reduce;
          remaining -= reduce;
        }
      }
    }
  }

  const results: AgeingRow[] = [];
  for (const [accountName, data] of partyMap) {
    const ageing: AgeingBucket = { current: 0, days_0_30: 0, days_31_60: 0, days_61_90: 0, days_91_180: 0, days_over_180: 0, total: 0 };
    const s3: ScheduleIIIAgeingBucket = { lessThan6Months: 0, sixMonthsTo1Year: 0, oneYearTo2Years: 0, twoYearsTo3Years: 0, moreThan3Years: 0, total: 0 };
    if (basis === 'due') s3.notYetDue = 0;
    let disputedAmount = 0, undisputedAmount = 0;

    for (const inv of data.invoices) {
      if (inv.amount <= 0) continue;
      const daysDiff = Math.floor((asAt.getTime() - inv.date.getTime()) / 86400000);
      if (inv.disputed) disputedAmount += inv.amount; else undisputedAmount += inv.amount;

      if (daysDiff < 0) ageing.current += inv.amount;
      else if (daysDiff <= 30) ageing.days_0_30 += inv.amount;
      else if (daysDiff <= 60) ageing.days_31_60 += inv.amount;
      else if (daysDiff <= 90) ageing.days_61_90 += inv.amount;
      else if (daysDiff <= 180) ageing.days_91_180 += inv.amount;
      else ageing.days_over_180 += inv.amount;
      ageing.total += inv.amount;

      if (basis === 'due' && daysDiff < 0) s3.notYetDue = (s3.notYetDue ?? 0) + inv.amount;
      else if (daysDiff < DAYS_6M) s3.lessThan6Months += inv.amount;
      else if (daysDiff < DAYS_1Y) s3.sixMonthsTo1Year += inv.amount;
      else if (daysDiff < DAYS_2Y) s3.oneYearTo2Years += inv.amount;
      else if (daysDiff < DAYS_3Y) s3.twoYearsTo3Years += inv.amount;
      else s3.moreThan3Years += inv.amount;
      s3.total += inv.amount;
    }

    if (ageing.total > 0) {
      results.push({
        accountName,
        ageing,
        scheduleIIIAgeing: format === 'schedule_iii' ? s3 : undefined,
        disputedAmount: disputedAmount > 0 ? disputedAmount : undefined,
        undisputedAmount: undisputedAmount > 0 ? undisputedAmount : undefined,
      });
    }
  }
  return results;
}

export function computeDebtorAgeing(entries: JournalEntry[], asAtDate: string, format: 'legacy' | 'schedule_iii' = 'legacy', options: AgeingOptions = {}): AgeingRow[] {
  return buildAgeing(entries, asAtDate, ['Trade Receivables', 'Sundry Debtors'], true, format, options);
}

export function computeCreditorAgeing(entries: JournalEntry[], asAtDate: string, format: 'legacy' | 'schedule_iii' = 'legacy', options: AgeingOptions = {}): AgeingRow[] {
  return buildAgeing(entries, asAtDate, ['Trade Payables', 'Sundry Creditors'], false, format, options);
}

/** Schedule III: ageing of Capital Work in Progress (and intangibles under development) by period of incurrence. */
export function computeCWIPAgeing(entries: JournalEntry[], asAtDate: string): AgeingRow[] {
  return buildAgeing(entries, asAtDate, ['Capital Work in Progress'], true, 'schedule_iii');
}
