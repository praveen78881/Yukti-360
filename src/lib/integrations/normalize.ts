/* ─────────────────────────────────────────────────────────────────────────────
   Account-name normalization + matching for the ERP Bridge.

   External ERPs name the same ledger differently ("Sundry Debtors" vs "Trade
   Receivables", "HDFC Bank A/c" vs "HDFC Bank Account"). Matching runs in
   tiers — exact → normalized → alias → conservative fuzzy — so a wrong pairing
   is far less likely than a missed one.
   ──────────────────────────────────────────────────────────────────────────── */

/** Canonical key: lowercase, strip punctuation/"a/c"/"account" noise words. */
export function normalizeAccountName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\ba\/c\b|\baccount\b|\bacct\b|\bledger\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Bidirectional alias groups — Tally-style vs Schedule III-style names. */
const ALIAS_GROUPS: string[][] = [
  ['sundry debtors', 'trade receivables', 'debtors', 'accounts receivable'],
  ['sundry creditors', 'trade payables', 'creditors', 'accounts payable'],
  ['capital', 'capital account', 'owners capital', 'proprietors capital'],
  ['sales', 'sales accounts', 'revenue from operations', 'sales account'],
  ['purchases', 'purchase accounts', 'purchases account', 'purchase account'],
  ['cash', 'cash in hand', 'cash on hand', 'cash a c'],
  ['profit and loss', 'profit loss', 'p l', 'profit and loss account', 'reserves and surplus'],
  ['duties taxes', 'duties and taxes', 'statutory liabilities'],
  ['fixed assets', 'property plant and equipment', 'ppe'],
  ['closing stock', 'inventories', 'stock in hand', 'inventory'],
  ['loans advances', 'loans and advances', 'short term loans advances'],
  ['bank od', 'bank overdraft', 'bank occ'],
];

const aliasIndex = new Map<string, number>();
ALIAS_GROUPS.forEach((group, i) => {
  for (const name of group) aliasIndex.set(normalizeAccountName(name), i);
});

export function aliasGroupOf(name: string): number | undefined {
  return aliasIndex.get(normalizeAccountName(name));
}

/** Token-set similarity in [0,1] — order-insensitive, length-tolerant. */
export function tokenSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeAccountName(a).split(' ').filter(Boolean));
  const tb = new Set(normalizeAccountName(b).split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common += 1;
  return common / Math.max(ta.size, tb.size);
}

export interface NameMatch {
  index: number;                                    // index into candidates
  kind: 'exact' | 'normalized' | 'alias' | 'fuzzy';
}

/**
 * Find the best books-side candidate for an external account name.
 * `used` lets the caller enforce one-to-one pairing.
 */
export function matchAccountName(
  external: string,
  candidates: string[],
  used: Set<number>,
): NameMatch | null {
  // exact
  for (let i = 0; i < candidates.length; i++) {
    if (used.has(i)) continue;
    if (candidates[i] === external) return { index: i, kind: 'exact' };
  }
  // case/punctuation-insensitive
  const key = normalizeAccountName(external);
  for (let i = 0; i < candidates.length; i++) {
    if (used.has(i)) continue;
    if (normalizeAccountName(candidates[i]) === key) return { index: i, kind: 'normalized' };
  }
  // alias table
  const group = aliasIndex.get(key);
  if (group !== undefined) {
    for (let i = 0; i < candidates.length; i++) {
      if (used.has(i)) continue;
      if (aliasIndex.get(normalizeAccountName(candidates[i])) === group) {
        return { index: i, kind: 'alias' };
      }
    }
  }
  // conservative fuzzy — requires a dominant, unambiguous winner
  let best = -1;
  let bestScore = 0;
  let secondScore = 0;
  for (let i = 0; i < candidates.length; i++) {
    if (used.has(i)) continue;
    const s = tokenSimilarity(external, candidates[i]);
    if (s > bestScore) { secondScore = bestScore; bestScore = s; best = i; }
    else if (s > secondScore) { secondScore = s; }
  }
  if (best >= 0 && bestScore >= 0.75 && bestScore - secondScore >= 0.2) {
    return { index: best, kind: 'fuzzy' };
  }
  return null;
}
