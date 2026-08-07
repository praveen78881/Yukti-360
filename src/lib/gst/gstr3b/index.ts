/**
 * GSTR-3B source registry.
 *
 * One import site for the whole GSTR-3B wiring: the contract (types + store) and
 * every source adapter, plus an ordered, UI-ready description of the sources so a
 * page can render the "fill this month from…" menu without knowing any adapter's
 * file name.
 *
 * OFFLINE-FIRST: `online: false` sources (books & accounts) never need a taxpayer
 * session. The `online: true` ones are still allowed to answer from their own
 * local cache with `calls: 0` — the flag only says "hand me a session token if you
 * have one"; it never gates the click. When such a source genuinely cannot answer
 * offline it returns `{ ok:false, needsSession:true }`, which the caller turns
 * into a "connect the portal" prompt. Nothing here throws.
 */

import type { Gstr3bSource, Gstr3bSourceFn } from './types';
import { ONLINE_SOURCES } from './types';

import { gstr3bFromPortal } from './fromPortal';
import { gstr1OutwardSource } from './fromGstr1';
import { gstr2bItcSource } from './fromGstr2b';
import { gstr3bFromLedgers } from './fromLedgers';
import { gstr3bFromAccounts } from './fromAccounts';

/* ── the contract ─────────────────────────────────────────────────────────── */
export type {
  Gstr3bSource, Gstr3bSourceFn, Gstr3bPatch, SourceResult,
  Gstr3bFieldKey, Gstr3bStatus, Gstr3bPeriodRecord,
} from './types';
export { ONLINE_SOURCES, applyPatch } from './types';
export {
  getGstr3bPeriod, getOrCreateGstr3bPeriod, saveGstr3bPeriod,
  applyGstr3bPatch, markGstr3bFiled,
} from './store';

/* ── the adapters (real exported names) ───────────────────────────────────── */
export { gstr3bFromPortal } from './fromPortal';
export { gstr1OutwardSource } from './fromGstr1';
export { gstr2bItcSource } from './fromGstr2b';
export { gstr3bFromLedgers } from './fromLedgers';
export { gstr3bFromAccounts } from './fromAccounts';

/* ── the menu ─────────────────────────────────────────────────────────────── */

export interface Gstr3bSourceEntry {
  /** Matches `Gstr3bPatch.source`, so provenance keys straight off this list. */
  source: Gstr3bSource;
  /** Menu label. */
  label: string;
  /** One-line explanation of what the source fills. */
  hint: string;
  /** Needs a taxpayer session to reach the portal (may still answer from cache). */
  online: boolean;
  run: Gstr3bSourceFn;
}

/** Menu order: portal first (it is the authoritative copy), books last. */
export const GSTR3B_SOURCES: readonly Gstr3bSourceEntry[] = [
  {
    source: 'portal',
    label: 'Import from portal (GSTR-3B)',
    hint: 'The 3B already saved/filed on the portal for this period.',
    online: true,
    run: gstr3bFromPortal,
  },
  {
    source: 'gstr1',
    label: 'From GSTR-1',
    hint: 'Outward supplies 3.1(a)/(b)/(c)/(e) and the tax on them.',
    online: true,
    run: gstr1OutwardSource,
  },
  {
    source: 'gstr2b',
    label: 'From GSTR-2B',
    hint: 'Eligible ITC — Table 4(A) non-RCM and RCM.',
    online: true,
    run: gstr2bItcSource,
  },
  {
    source: 'ledgers',
    label: 'From ledgers',
    hint: 'Opening ITC balance and cash paid against this period.',
    online: true,
    run: gstr3bFromLedgers,
  },
  {
    source: 'accounts',
    label: 'From books & accounts',
    hint: 'The whole month from your own invoices and journal — always offline.',
    online: false,
    run: gstr3bFromAccounts,
  },
] as const;

/** Human label for a provenance chip / cell badge. */
export const SOURCE_LABELS: Record<Gstr3bSource, string> = {
  portal: 'Portal 3B',
  gstr1: 'GSTR-1',
  gstr2b: 'GSTR-2B',
  ledgers: 'Ledgers',
  // Two book-based fills with different scope — the labels must say which is which.
  // 'accounts' = the full per-month source (all tables + ledger tie-out).
  // 'books'    = the header "Load from books" button, which quick-fills 3.1(a),
  //              output tax and ITC across every month of the FY at once.
  accounts: 'Books & accounts (this month)',
  books: 'Books quick-fill (all months)',
  manual: 'Manual',
};

/** True when the source needs a session handed to it (cache may still answer). */
export const isOnlineSource = (s: Gstr3bSource): boolean => ONLINE_SOURCES.has(s);

/** Look a menu entry up by its provenance key. */
export const findGstr3bSource = (s: Gstr3bSource): Gstr3bSourceEntry | undefined =>
  GSTR3B_SOURCES.find((e) => e.source === s);
