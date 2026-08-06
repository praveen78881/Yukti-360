import { parseGenericTrialBalance } from './adapters/genericTB';
import { parseTallyFile } from './adapters/tallyAdapter';
import { parseZohoFile } from './adapters/zoho';
import type { ErpSource, ExternalDataset } from './types';

export * from './types';
export { compareWithBooks } from './compare';
export { normalizeAccountName } from './normalize';

/* ─────────────────────────────────────────────────────────────────────────────
   ERP Bridge — entry point. Dispatches an uploaded export file to the adapter
   for the selected source ERP.
   ──────────────────────────────────────────────────────────────────────────── */

export async function parseExternalFile(
  source: ErpSource,
  file: File,
  opts?: { toDate?: string },
): Promise<ExternalDataset> {
  switch (source) {
    case 'tally':
      return parseTallyFile(file, opts?.toDate);
    case 'zoho':
      return parseZohoFile(file);
    case 'winman':
      return parseGenericTrialBalance(file, 'winman');
    case 'generic':
    default:
      return parseGenericTrialBalance(file, 'generic');
  }
}
