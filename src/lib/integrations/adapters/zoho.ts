import * as XLSX from 'xlsx';
import type { ExternalDataset, ExternalTBRow } from '../types';
import { parseGenericTrialBalance, parseIndianAmount } from './genericTB';

/* ─────────────────────────────────────────────────────────────────────────────
   Zoho Books adapter.

   Handles the two common Zoho Books exports:
   • Journal export  — "Journal Date, Journal Number, ..., Account, Debit,
     Credit" one row per journal line → aggregated into a trial balance.
   • Trial Balance / Account Balances export — falls through to the generic
     TB parser (Zoho's TB headers "Account, Net Debit, Net Credit" are covered
     by its alias table).
   ──────────────────────────────────────────────────────────────────────────── */

function cellStr(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function headerIndex(headers: string[], ...aliases: string[]): number {
  const cells = headers.map((h) => h.toLowerCase().trim());
  for (const a of aliases) {
    const i = cells.findIndex((c) => c === a || c.includes(a));
    if (i >= 0) return i;
  }
  return -1;
}

export async function parseZohoFile(file: File): Promise<ExternalDataset> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: false, raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error('The file has no readable sheet.');
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false })
    .map((r) => (r as unknown[]).map(cellStr));

  // Locate a Zoho journal-export header row within the first few rows.
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const cells = grid[i].map((c) => c.toLowerCase());
    const hasJournal = cells.some((c) => c.includes('journal date') || c.includes('journal number') || c.includes('journal no'));
    const hasAccount = cells.some((c) => c.includes('account'));
    if (hasJournal && hasAccount) { headerRowIdx = i; break; }
  }

  if (headerRowIdx < 0) {
    // Not a journal export — treat as a Zoho trial-balance style sheet.
    return { ...(await parseGenericTrialBalance(file, 'zoho')), source: 'zoho' };
  }

  const headers = grid[headerRowIdx];
  const accountCol = headerIndex(headers, 'account name', 'account');
  const debitCol = headerIndex(headers, 'debit');
  const creditCol = headerIndex(headers, 'credit');
  const dateCol = headerIndex(headers, 'journal date', 'date');
  const journalNoCol = headerIndex(headers, 'journal number', 'journal no');
  if (accountCol < 0 || debitCol < 0 || creditCol < 0) {
    throw new Error('Zoho journal export detected, but the Account / Debit / Credit columns were not found.');
  }

  const totals = new Map<string, { debit: number; credit: number }>();
  const journalNos = new Set<string>();
  let minDate = '';
  let maxDate = '';

  for (let i = headerRowIdx + 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row) continue;
    const account = cellStr(row[accountCol]);
    if (!account || /^total\b/i.test(account)) continue;
    const debit = parseIndianAmount(row[debitCol]).value;
    const credit = parseIndianAmount(row[creditCol]).value;
    if (debit === 0 && credit === 0) continue;

    const agg = totals.get(account) || { debit: 0, credit: 0 };
    agg.debit += debit;
    agg.credit += credit;
    totals.set(account, agg);

    if (journalNoCol >= 0) {
      const jn = cellStr(row[journalNoCol]);
      if (jn) journalNos.add(jn);
    }
    if (dateCol >= 0) {
      const d = cellStr(row[dateCol]);
      if (d) {
        if (!minDate || d < minDate) minDate = d;
        if (!maxDate || d > maxDate) maxDate = d;
      }
    }
  }

  if (totals.size === 0) throw new Error('No journal lines with amounts were found in the Zoho export.');

  // Net each account to one side, like a trial balance.
  const rows: ExternalTBRow[] = Array.from(totals.entries()).map(([account, t]) => {
    const net = Math.round((t.debit - t.credit) * 100) / 100;
    return {
      account,
      debit: net > 0 ? net : 0,
      credit: net < 0 ? -net : 0,
    };
  }).filter((r) => r.debit !== 0 || r.credit !== 0);

  return {
    source: 'zoho',
    fileName: file.name,
    importedAt: new Date().toISOString(),
    rows,
    totalDebit: Math.round(rows.reduce((s, r) => s + r.debit, 0) * 100) / 100,
    totalCredit: Math.round(rows.reduce((s, r) => s + r.credit, 0) * 100) / 100,
    meta: {
      layout: 'zoho-journal-export',
      voucherCount: journalNos.size || undefined,
      minDate: minDate || undefined,
      maxDate: maxDate || undefined,
    },
  };
}
