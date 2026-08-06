import {
  decodeTallyText,
  parseTallyXml,
  parseTallyJson,
  ledgerBalancesAsAt,
  type TallyDataset,
} from '@/lib/tally/tallyParser';
import type { ExternalDataset, ExternalTBRow } from '../types';

/* ─────────────────────────────────────────────────────────────────────────────
   Tally adapter — thin wrapper over the existing Tally parsers.

   Accepts Tally XML (masters and/or day book), Tally JSON, or a Tally PDF
   trial balance, and converts closing ledger balances as at `toDate` into the
   ERP Bridge's normalized trial-balance shape.
   ──────────────────────────────────────────────────────────────────────────── */

async function readDataset(file: File): Promise<TallyDataset> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    const { parseTallyPdf } = await import('@/lib/tally/pdfExtract');
    return parseTallyPdf(file);
  }
  const text = decodeTallyText(await file.arrayBuffer());
  if (name.endsWith('.json') || text.trimStart().startsWith('{') || text.trimStart().startsWith('[')) {
    return parseTallyJson(text, file.name);
  }
  return parseTallyXml(text, file.name);
}

export async function parseTallyFile(file: File, toDate?: string): Promise<ExternalDataset> {
  const ds = await readDataset(file);
  const asAt = toDate || ds.maxDate || '9999-12-31';
  const balances = ledgerBalancesAsAt(ds, asAt);

  const rows: ExternalTBRow[] = balances
    .filter((b) => Math.round(b.signed * 100) !== 0)
    .map((b) => ({
      account: b.name,
      group: b.group || undefined,
      debit: b.signed > 0 ? Math.round(b.signed * 100) / 100 : 0,
      credit: b.signed < 0 ? Math.round(-b.signed * 100) / 100 : 0,
    }));

  if (rows.length === 0) {
    throw new Error('No ledgers with balances were found in the Tally file. Export masters + day book (XML) or a trial-balance PDF.');
  }

  return {
    source: 'tally',
    fileName: file.name,
    importedAt: new Date().toISOString(),
    rows,
    totalDebit: Math.round(rows.reduce((s, r) => s + r.debit, 0) * 100) / 100,
    totalCredit: Math.round(rows.reduce((s, r) => s + r.credit, 0) * 100) / 100,
    meta: {
      minDate: ds.minDate || undefined,
      maxDate: ds.maxDate || undefined,
      voucherCount: ds.vouchers.length || undefined,
      layout: 'tally-ledger-balances',
    },
  };
}
