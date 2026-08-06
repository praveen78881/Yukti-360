import * as XLSX from 'xlsx';
import type { ErpSource, ExternalDataset, ExternalTBRow } from '../types';

/* ─────────────────────────────────────────────────────────────────────────────
   Generic trial-balance Excel/CSV adapter (also serves Winman exports).

   Tolerant header detection — handles the common Indian TB layouts:
   • Account | Debit | Credit
   • Particulars / Head of Account | Dr | Cr
   • Account | Closing Dr | Closing Cr   (Winman-style working TB)
   • Account | Balance | Dr/Cr indicator
   • Account | Balance (signed, +Dr / −Cr)
   Total/summary rows are skipped.
   ──────────────────────────────────────────────────────────────────────────── */

const ACCOUNT_HEADERS = [
  'account name', 'account head', 'head of account', 'account', 'particulars',
  'ledger name', 'ledger', 'name of account', 'head', 'description',
];
const DEBIT_HEADERS = ['closing dr', 'closing debit', 'debit balance', 'debit amount', 'net debit', 'debit', 'dr amount', 'dr'];
const CREDIT_HEADERS = ['closing cr', 'closing credit', 'credit balance', 'credit amount', 'net credit', 'credit', 'cr amount', 'cr'];
const BALANCE_HEADERS = ['closing balance', 'net balance', 'balance', 'amount'];
const INDICATOR_HEADERS = ['dr/cr', 'dr / cr', 'drcr', 'type', 'indicator', 'balance type'];
const GROUP_HEADERS = ['group', 'account group', 'primary group', 'under', 'category'];

const TOTAL_ROW = /^(grand\s+)?total\b|^totals?$|^closing\s+total/i;

function cellStr(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

/** '1,23,456.78', '₹ 1,234', '(500)', '1234 Dr' → number (abs) + optional side. */
export function parseIndianAmount(raw: unknown): { value: number; side?: 'Dr' | 'Cr' } {
  let s = cellStr(raw);
  if (!s) return { value: 0 };
  let side: 'Dr' | 'Cr' | undefined;
  if (/\bdr\.?$/i.test(s)) { side = 'Dr'; s = s.replace(/\bdr\.?$/i, ''); }
  else if (/\bcr\.?$/i.test(s)) { side = 'Cr'; s = s.replace(/\bcr\.?$/i, ''); }
  let negative = false;
  if (/^\(.*\)$/.test(s.trim())) { negative = true; s = s.trim().slice(1, -1); }
  const n = parseFloat(s.replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(n)) return { value: 0, side };
  const value = Math.round(Math.abs(n) * 100) / 100;
  return { value, side: side ?? (negative || n < 0 ? 'Cr' : undefined) };
}

function findCol(headerRow: string[], aliases: string[]): number {
  const cells = headerRow.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    // prefer exact header match, then substring
    let idx = cells.findIndex((c) => c === alias);
    if (idx >= 0) return idx;
    idx = cells.findIndex((c) => c.includes(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

interface Layout {
  headerRowIdx: number;
  account: number;
  group: number;
  debit: number;
  credit: number;
  balance: number;
  indicator: number;
  kind: string;
}

function detectLayout(rows: string[][]): Layout | null {
  const scanLimit = Math.min(rows.length, 15);
  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i];
    if (!row || row.filter(Boolean).length < 2) continue;
    const account = findCol(row, ACCOUNT_HEADERS);
    if (account < 0) continue;
    const debit = findCol(row, DEBIT_HEADERS);
    const credit = findCol(row, CREDIT_HEADERS);
    const balance = findCol(row, BALANCE_HEADERS);
    const indicator = findCol(row, INDICATOR_HEADERS);
    const group = findCol(row, GROUP_HEADERS);
    if (debit >= 0 && credit >= 0 && debit !== credit) {
      return { headerRowIdx: i, account, group, debit, credit, balance: -1, indicator: -1, kind: 'debit-credit-columns' };
    }
    if (balance >= 0) {
      return { headerRowIdx: i, account, group, debit: -1, credit: -1, balance, indicator, kind: indicator >= 0 ? 'balance-with-indicator' : 'signed-balance' };
    }
  }
  return null;
}

export async function parseGenericTrialBalance(file: File, source: ErpSource = 'generic'): Promise<ExternalDataset> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: false, raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error('The file has no readable sheet.');
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false })
    .map((r) => (r as unknown[]).map(cellStr));

  const layout = detectLayout(grid);
  if (!layout) {
    throw new Error(
      'Could not find a trial-balance header row. Expected columns like "Account / Particulars" with "Debit & Credit" (or "Balance").'
    );
  }

  const rows: ExternalTBRow[] = [];
  for (let i = layout.headerRowIdx + 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row) continue;
    const account = cellStr(row[layout.account]);
    if (!account || TOTAL_ROW.test(account)) continue;

    let debit = 0;
    let credit = 0;
    if (layout.kind === 'debit-credit-columns') {
      debit = parseIndianAmount(row[layout.debit]).value;
      credit = parseIndianAmount(row[layout.credit]).value;
    } else {
      const parsed = parseIndianAmount(row[layout.balance]);
      let side = parsed.side;
      if (layout.indicator >= 0) {
        const ind = cellStr(row[layout.indicator]).toLowerCase();
        if (ind.startsWith('d')) side = 'Dr';
        else if (ind.startsWith('c')) side = 'Cr';
      }
      if (side === 'Cr') credit = parsed.value;
      else debit = parsed.value;
    }

    if (debit === 0 && credit === 0) continue;
    rows.push({
      account,
      group: layout.group >= 0 ? cellStr(row[layout.group]) || undefined : undefined,
      debit,
      credit,
    });
  }

  if (rows.length === 0) throw new Error('No account rows with balances were found in the file.');

  return {
    source,
    fileName: file.name,
    importedAt: new Date().toISOString(),
    rows,
    totalDebit: Math.round(rows.reduce((s, r) => s + r.debit, 0) * 100) / 100,
    totalCredit: Math.round(rows.reduce((s, r) => s + r.credit, 0) * 100) / 100,
    meta: { layout: layout.kind },
  };
}
