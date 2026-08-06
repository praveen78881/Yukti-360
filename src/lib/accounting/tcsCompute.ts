import type { JournalEntry } from '@/lib/accounting/computeEngine';

/* ─────────────────────────────────────────────────────────────────────────────
   TCS Register — derived from journal entries (books-wired).

   A journal entry contributes a TCS row when it credits a TCS liability ledger
   (account name contains "tcs", group Statutory Liabilities / Duties & Taxes).
   Section and rate come from the line's tcs_section / tcs_rate when the entry
   captured them, otherwise the rate is inferred from the sale value.
   ──────────────────────────────────────────────────────────────────────────── */

export interface TCSRegisterRow {
  date: string;
  buyerName: string;
  pan: string;
  section: string;
  saleAmount: number;
  tcsRate: number;
  tcsAmount: number;
  status: 'collected' | 'deposited' | 'pending';
}

const TCS_GROUPS = new Set(['Statutory Liabilities', 'Duties & Taxes']);

function isTcsLiabilityLine(accountName: string, accountGroup: string): boolean {
  return accountName.toLowerCase().includes('tcs') && TCS_GROUPS.has(accountGroup);
}

/** Infer the TCS section from an account name like "TCS Payable — 206C(1H)". */
function sectionFromAccountName(name: string): string {
  const m = name.match(/206C\s*\(?\s*(1H?|1G|1F|1C?)\s*\)?/i);
  return m ? `206C(${m[1].toUpperCase()})` : '';
}

export function computeTCSRegister(entries: JournalEntry[]): TCSRegisterRow[] {
  const rows: TCSRegisterRow[] = [];

  for (const entry of entries) {
    let tcsAmount = 0;
    let buyerName = '';
    let saleAmount = 0;
    let section = '';
    let declaredRate = 0;

    for (const line of entry.lines) {
      if (isTcsLiabilityLine(line.account_name, line.account_group)) {
        tcsAmount += line.credit || 0;
        if (!section) section = line.tcs_section || sectionFromAccountName(line.account_name);
        if (!declaredRate && line.tcs_rate) declaredRate = line.tcs_rate;
      } else if (line.debit > 0 && (line.account_group === 'Trade Receivables' || line.account_group === 'Sundry Debtors')) {
        buyerName = line.account_name;
        saleAmount += line.debit;
      } else if (line.credit > 0 && (line.account_group === 'Revenue from Operations' || line.account_group === 'Sales' || line.account_group === 'Revenue')) {
        saleAmount += line.credit;
      }
    }

    if (tcsAmount > 0) {
      const grossSale = saleAmount > tcsAmount ? saleAmount - tcsAmount : saleAmount;
      const rate = declaredRate > 0
        ? declaredRate
        : grossSale > 0 ? (tcsAmount / grossSale) * 100 : 0;
      rows.push({
        date: entry.entry_date,
        buyerName,
        pan: '',
        section,
        saleAmount: grossSale,
        tcsRate: Math.round(rate * 100) / 100,
        tcsAmount,
        status: 'collected',
      });
    }
  }

  return rows;
}
