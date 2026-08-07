/**
 * GSTR-3B source: THE ELECTRONIC LEDGERS (cash + credit/ITC).
 *
 * Brings the two ledger-derived figures of the month into `Gstr3bMonthData`:
 *
 *   openItc     ITC (electronic credit ledger) closing balance as at the day
 *               BEFORE the return period starts — i.e. the opening credit the
 *               month starts with, split igst/cgst/sgst/cess.
 *   cashOffset  Tax actually discharged in CASH for this return period —
 *               the TAX component (`tx`) of the electronic-cash-ledger DEBITS
 *               tagged with this `ret_period`.
 *
 * OFFLINE-FIRST. The Electronic Ledgers page (src/components/gst/LedgersPanel.tsx)
 * already caches every statement it downloads to entity_data under
 * module `gst_ledgers`, section = GSTIN:
 *
 *   { balance?: { payload, as_on },
 *     ranges?: { "YYYY-MM_YYYY-MM": { cash?: Stmt, itc?: Stmt, liability?, updated_at } } }
 *   Stmt = { rows[], op_bal, cl_bal, first_from, last_to, last_updated }   // dates DD/MM/YYYY
 *
 * This adapter reads that cache FIRST and works with no session at all when the
 * CA has already downloaded the ledgers for the relevant window. It only calls
 * the portal when a `sessionToken` is present AND the cache cannot answer, and
 * it then writes what it fetched back into the SAME cache (same shape, same
 * range key the panel uses) so the next run — and the ledgers page — is offline.
 *
 * Never throws. No session + nothing cached → { ok:false, needsSession:true }.
 *
 * ── Ledger row shapes this depends on (as rendered verbatim by LedgersPanel) ──
 *   ITC  rows : { dt:"DD/MM/YYYY", tr_typ:"Cr"|"Dr", ref_no, ret_period, desc,
 *                 igstTaxAmt…, igstTaxBal, cgstTaxBal, sgstTaxBal, cessTaxBal }
 *          op_bal/cl_bal : { igstTaxBal, cgstTaxBal, sgstTaxBal, cessTaxBal, tot_rng_bal }
 *          → the *Bal fields are the RUNNING closing balance after that row.
 *   CASH rows : { dpt_dt:"DD/MM/YYYY", tr_typ:"Cr"|"Dr", refNo, ret_period, desc,
 *                 igst:{tx,intr,fee,pen,oth,tot}, cgst:{…}, sgst:{…}, cess:{…} }
 *          → only `tx` is tax; intr/fee/pen/oth are interest, late fee, penalty,
 *            other — they are NOT part of Table 6.1's "tax paid in cash".
 */

import { sandboxClient } from '@/lib/gst/sandbox/client';
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';
import { parsePeriod, periodLabel } from '@/lib/gst/sandbox/period';
import { round2 } from '@/lib/accounting/gstr3bJson';
import type { Gstr3bMonthData, Split4 } from '@/lib/accounting/gstr3bJson';
import type { Gstr3bPatch, Gstr3bSourceFn, SourceResult } from './types';

/** entity_data module the Electronic Ledgers page caches under (section = GSTIN). */
export const LEDGER_CACHE_MODULE = 'gst_ledgers';

/* ── shapes (mirror LedgersPanel's cache exactly; all fields optional/defensive) ── */

export interface LedgerStmt {
  rows: any[];
  op_bal?: any;
  cl_bal?: any;
  first_from?: string; // DD/MM/YYYY
  last_to?: string;    // DD/MM/YYYY
  last_updated?: string;
}
export interface LedgerRange {
  cash?: LedgerStmt;
  itc?: LedgerStmt;
  liability?: { months: Record<string, any>; last_updated?: string };
  updated_at?: string;
}
export interface LedgerStore {
  balance?: { payload: any; as_on: string };
  ranges?: Record<string, LedgerRange>;
}

/* ── tiny defensive helpers ─────────────────────────────────────────────────── */

function num(x: unknown): number {
  if (x == null || x === '') return 0;
  const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function isObj(x: unknown): x is Record<string, any> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}
const z4 = (): Split4 => ({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
const r4 = (s: Split4): Split4 => ({
  igst: round2(s.igst), cgst: round2(s.cgst), sgst: round2(s.sgst), cess: round2(s.cess),
});
const nonZero4 = (s: Split4) => round2(s.igst) !== 0 || round2(s.cgst) !== 0 || round2(s.sgst) !== 0 || round2(s.cess) !== 0;

const dd2 = (n: number) => String(n).padStart(2, '0');
/** Date → "DD/MM/YYYY" (the format every ledger endpoint requires). */
export function fmtDmy(d: Date): string {
  return `${dd2(d.getDate())}/${dd2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
/** "DD/MM/YYYY" (or "DD-MM-YYYY") → local-midnight Date, or null. */
export function parseDmy(s: unknown): Date | null {
  const m = String(s ?? '').match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isFinite(d.getTime()) ? d : null;
}
const ymOf = (d: Date) => `${d.getFullYear()}-${dd2(d.getMonth() + 1)}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const DAY = 86400000;

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * Normalise whatever the portal put in `ret_period` to MMYYYY.
 * Seen in the wild: "072026", "07/2026", "2026-07", "Jul-2026", "-", "".
 */
export function normRetPeriod(v: unknown): string | null {
  const s = String(v ?? '').trim();
  if (!s || s === '-') return null;
  let m = s.match(/^(\d{2})(\d{4})$/);                      // 072026
  if (m) return m[1] + m[2];
  m = s.match(/^(\d{4})[-/]?(\d{2})$/);                     // 2026-07 / 202607
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return m[2] + m[1];
  m = s.match(/^(\d{1,2})[-/](\d{4})$/);                    // 7/2026
  if (m) return dd2(Number(m[1])) + m[2];
  m = s.match(/^([A-Za-z]{3,})[-\s/]*(\d{4})$/);            // Jul-2026
  if (m) {
    const pre = m[1].slice(0, 3).toLowerCase();
    const i = MONTH_NAMES.findIndex((n) => n.startsWith(pre));
    if (i >= 0) return dd2(i + 1) + m[2];
  }
  return null;
}

/* ── interval coverage (do the cached statements actually span what we need?) ── */

interface Span { a: number; b: number }

/** True when [a,b] is fully inside the union of `spans` (gaps of ≤1 day bridged). */
export function spansCover(spans: Span[], a: number, b: number): boolean {
  if (b < a) return true;
  const sorted = spans.filter((s) => s.b >= s.a).sort((x, y) => x.a - y.a);
  let curA: number | null = null, curB = 0;
  for (const s of sorted) {
    if (curA == null) { curA = s.a; curB = s.b; continue; }
    if (s.a <= curB + DAY) { curB = Math.max(curB, s.b); continue; }
    if (curA <= a && curB >= b) return true;
    curA = s.a; curB = s.b;
  }
  return curA != null && curA <= a && curB >= b;
}

function stmtSpan(s: LedgerStmt | undefined): Span | null {
  const a = parseDmy(s?.first_from), b = parseDmy(s?.last_to);
  return a && b ? { a: a.getTime(), b: b.getTime() } : null;
}

/* ── pure derivations (unit-testable, no network, no storage) ────────────────── */

const itcBal4 = (o: unknown): Split4 => (isObj(o)
  ? { igst: num(o.igstTaxBal), cgst: num(o.cgstTaxBal), sgst: num(o.sgstTaxBal), cess: num(o.cessTaxBal) }
  : z4());

/**
 * Opening ITC for the period from one ITC statement: the running closing
 * balance of the LAST transaction dated strictly before `periodStart`, or the
 * statement's op_bal when the statement itself starts on/after that point.
 * Returns null when the statement cannot answer (starts after the period, or
 * stops before the day the opening is measured on).
 */
export function openItcFromItcStatement(stmt: LedgerStmt | undefined, periodStart: Date): { value: Split4; exact: boolean } | null {
  if (!stmt) return null;
  const from = parseDmy(stmt.first_from);
  const to = parseDmy(stmt.last_to);
  const ps = periodStart.getTime();
  if (!from || from.getTime() > ps) return null;                 // begins after the opening point
  const exact = from.getTime() === ps;                            // op_bal IS the month's opening
  if (!exact && (!to || to.getTime() < ps - DAY)) return null;    // gap before the period → unusable
  if (!isObj(stmt.op_bal) && !(Array.isArray(stmt.rows) && stmt.rows.length)) return null;

  if (exact) return { value: r4(itcBal4(stmt.op_bal)), exact: true };

  const prior = (Array.isArray(stmt.rows) ? stmt.rows : [])
    .filter(isObj)
    .map((r) => ({ r, t: parseDmy(r.dt ?? r.dt_of_tr ?? r.date)?.getTime() ?? NaN }))
    .filter((x) => Number.isFinite(x.t) && x.t < ps)
    .sort((x, y) => x.t - y.t);                                   // stable → portal order kept per day

  const last = prior.length ? prior[prior.length - 1].r : null;
  return { value: r4(last ? itcBal4(last) : itcBal4(stmt.op_bal)), exact: false };
}

const cashHeadTax = (h: unknown): number => {
  if (isObj(h)) return 'tx' in h ? num(h.tx) : num(h.tot);        // `tot` only as a shape-drift fallback
  return num(h);
};

/**
 * Tax paid in cash for `period` (MMYYYY) from cash-ledger rows: the `tx`
 * component of every DEBIT tagged with that return period. `matched` counts the
 * rows used; `tagged` counts rows that carried any parseable ret_period at all
 * (0 ⇒ the ledger isn't tagging periods, so the figure is not trustworthy).
 */
export function cashOffsetFromCashRows(rows: any[], period: string): { value: Split4; matched: number; tagged: number } {
  const acc = z4();
  let matched = 0, tagged = 0;
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!isObj(r)) continue;
    const rp = normRetPeriod(r.ret_period ?? r.retPeriod ?? r.ret_prd);
    if (rp) tagged++;
    if (rp !== period) continue;
    if (String(r.tr_typ ?? '').trim().toLowerCase() !== 'dr') continue;   // credits are deposits, not payments
    acc.igst += cashHeadTax(r.igst); acc.cgst += cashHeadTax(r.cgst);
    acc.sgst += cashHeadTax(r.sgst); acc.cess += cashHeadTax(r.cess);
    matched++;
  }
  return { value: r4(acc), matched, tagged };
}

/** De-duplicate cash rows pooled from overlapping cached ranges. */
function dedupeCashRows(rows: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const r of rows) {
    if (!isObj(r)) continue;
    const k = [r.refNo ?? r.ref_no ?? '', r.dpt_dt ?? r.rpt_dt ?? '', r.dpt_time ?? '', r.ret_period ?? '', r.tr_typ ?? '', r.tot_tr_amt ?? '', r.desc ?? ''].join('|');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

/* ── portal response unwrapping (mirrors LedgersPanel's reads) ───────────────── */

/** Cash statement body: res.data.data.data → { op_bal, cl_bal, tr[] }. */
export function unwrapCash(res: any): Record<string, any> | null {
  const cands = [res?.data?.data?.data, res?.data?.data, res?.data];
  for (const c of cands) if (isObj(c) && ('tr' in c || 'op_bal' in c || 'cl_bal' in c)) return c;
  return null;
}
/** ITC statement body: res.data.data.data.itcLdgDtls (or one wrap up). */
export function unwrapItc(res: any): Record<string, any> | null {
  const cands = [
    res?.data?.data?.data?.itcLdgDtls, res?.data?.data?.itcLdgDtls, res?.data?.itcLdgDtls,
    res?.data?.data?.data, res?.data?.data,
  ];
  for (const c of cands) if (isObj(c) && ('tr' in c || 'op_bal' in c || 'cl_bal' in c)) return c;
  return null;
}
/** Portal-level error inside a 200 envelope (status_cd "0" / error object). */
function apiErr(res: any): string | null {
  const d = res?.data?.data ?? res?.data;
  if (isObj(d) && (String(d.status_cd) === '0' || d.error)) {
    return String(d.error?.message || d.error?.error_cd || d.error || 'ledger error');
  }
  return res?.ok ? null : String(res?.error || `request failed (${res?.status ?? 0})`);
}
function isAuthErr(res: any, msg: string): boolean {
  return res?.status === 401 || res?.status === 403 || /AUTH\s*4\d\d|invalid\s*token|session/i.test(msg);
}
/** LG9087-style "nothing in this window" is data, not failure. */
function isNoRecordsErr(msg: string): boolean {
  return /LG9087|no\s*(records?|data|liabilit|transaction)/i.test(msg);
}

/* ── cache access ────────────────────────────────────────────────────────────── */

function readLedgerStore(companyId: string, gstin: string): LedgerStore {
  try {
    return (getEntityData(companyId, LEDGER_CACHE_MODULE, gstin)?.data as LedgerStore) ?? {};
  } catch {
    return {};
  }
}

/* ── the source adapter ──────────────────────────────────────────────────────── */

/**
 * Pull `openItc` + `cashOffset` for the month out of the electronic ledgers.
 * Consumes 0 portal calls when the ledgers page has already cached the window;
 * otherwise exactly 2 (cash + ITC) when a session is available.
 */
export const gstr3bFromLedgers: Gstr3bSourceFn = async ({ companyId, gstin, period, sessionToken }): Promise<SourceResult> => {
  try {
    if (!/^\d{6}$/.test(period || '')) return { ok: false, error: `Invalid return period "${period}" (expected MMYYYY).` };
    if (!companyId) return { ok: false, error: 'companyId is required to read the cached ledgers.' };
    if (!gstin) return { ok: false, error: 'Company GSTIN is not set — the electronic ledgers are keyed by GSTIN.' };

    const { year, month } = parsePeriod(period);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    const nextMonthEnd = new Date(year, month + 1, 0);
    const today = startOfDay(new Date());
    const label = periodLabel(period) || period;
    const at = new Date().toISOString();

    // Window we need on the CASH side: the period plus the following month —
    // the 3B for a month is normally paid by the 20th of the next one.
    const cashWantTo = new Date(Math.min(nextMonthEnd.getTime(), Math.max(today.getTime(), periodEnd.getTime())));
    const cashNeedTo = new Date(Math.min(cashWantTo.getTime(), today.getTime()));

    let calls = 0;
    let store = readLedgerStore(companyId, gstin);
    const notes: string[] = [];
    let usedApi = false;

    /** Derive both figures from whatever is in `store` right now. */
    const derive = () => {
      const ranges = Object.values(store.ranges ?? {});

      // openItc — prefer a statement that starts exactly on the 1st (op_bal is
      // then the month's opening verbatim); else the newest usable one.
      let best: { value: Split4; exact: boolean; updated: number } | null = null;
      for (const rg of ranges) {
        const got = openItcFromItcStatement(rg?.itc, periodStart);
        if (!got) continue;
        const updated = Date.parse(rg?.itc?.last_updated ?? rg?.updated_at ?? '') || 0;
        if (!best || (got.exact && !best.exact) || (got.exact === best.exact && updated > best.updated)) {
          best = { ...got, updated };
        }
      }

      // cashOffset — pool every cached cash statement, de-dupe, then match on
      // ret_period. Only trusted when the cached spans actually cover the
      // period → payment window.
      const cashSpans = ranges.map((rg) => stmtSpan(rg?.cash)).filter((s): s is Span => !!s);
      const covered = spansCover(cashSpans, periodStart.getTime(), cashNeedTo.getTime());
      const pooled = dedupeCashRows(ranges.flatMap((rg) => (Array.isArray(rg?.cash?.rows) ? rg!.cash!.rows : [])));
      const cash = cashOffsetFromCashRows(pooled, period);

      return { openItc: best, covered, cash, hasCashData: cashSpans.length > 0 };
    };

    let d = derive();
    const needItc = !d.openItc;
    const needCash = !d.covered;

    // ── portal fallback: only when the cache cannot answer AND we have a session ──
    if ((needItc || needCash) && sessionToken) {
      const from = fmtDmy(periodStart);
      const to = fmtDmy(cashNeedTo < periodStart ? periodStart : cashNeedTo);
      const [cashR, itcR] = await Promise.all([
        sandboxClient.ledgerCash(from, to, sessionToken),
        sandboxClient.ledgerItc(from, to, sessionToken),
      ]);
      calls = 2;
      usedApi = true;

      const cErr = apiErr(cashR), iErr = apiErr(itcR);
      if ((cErr && isAuthErr(cashR, cErr)) || (iErr && isAuthErr(itcR, iErr))) {
        return { ok: false, needsSession: true, error: `Portal session rejected: ${cErr || iErr}` };
      }
      if (cErr && iErr && !isNoRecordsErr(cErr) && !isNoRecordsErr(iErr)) {
        return { ok: false, error: `Electronic ledgers unavailable — cash: ${cErr}; ITC: ${iErr}` };
      }
      if (cErr) notes.push(`cash ledger: ${cErr}`);
      if (iErr) notes.push(`ITC ledger: ${iErr}`);

      const cashBody = cErr ? null : unwrapCash(cashR.data);
      const itcBody = iErr ? null : unwrapItc(itcR.data);
      const rg: LedgerRange = { updated_at: at };
      if (cashBody) rg.cash = { rows: Array.isArray(cashBody.tr) ? cashBody.tr : [], op_bal: cashBody.op_bal, cl_bal: cashBody.cl_bal, first_from: from, last_to: to, last_updated: at };
      if (itcBody) rg.itc = { rows: Array.isArray(itcBody.tr) ? itcBody.tr : [], op_bal: itcBody.op_bal, cl_bal: itcBody.cl_bal, first_from: from, last_to: to, last_updated: at };

      // Fold into the SAME cache the ledgers page uses (same range-key convention),
      // so the next run — and that page — need no session. Never fatal.
      const key = `${ymOf(periodStart)}_${ymOf(cashNeedTo < periodStart ? periodStart : cashNeedTo)}`;
      store = { ...store, ranges: { ...(store.ranges ?? {}), [key]: { ...(store.ranges?.[key] ?? {}), ...rg } } };
      try { upsertEntityData(companyId, LEDGER_CACHE_MODULE, gstin, store); } catch { /* read-only storage → in-memory only */ }

      d = derive();
    }

    // ── nothing usable ──
    if (!d.openItc && !d.covered) {
      if (!sessionToken) {
        return {
          ok: false,
          needsSession: true,
          error: `No cached electronic ledgers covering ${label}. Connect the GST session, or download the ledgers for ${label} on the Electronic Ledgers page first.`,
        };
      }
      const why = notes.length ? ` (${notes.join('; ')})` : '';
      return { ok: true, noData: true, patch: { source: 'ledgers', values: {}, at, calls, notes: `Electronic ledgers hold nothing for ${label}${why}.` } };
    }

    // ── build the patch: claim ONLY what is genuinely backed by the ledgers ──
    const values: Partial<Gstr3bMonthData> = {};
    if (d.openItc) {
      values.openItc = d.openItc.value;
      notes.push(d.openItc.exact
        ? `openItc = credit-ledger opening balance at the start of ${label} (portal op_bal)`
        : `openItc = credit-ledger running balance carried to the day before ${label}`);
    } else {
      notes.push('openItc not claimed — no credit-ledger statement covering the opening date is cached');
    }

    if (d.covered) {
      values.cashOffset = d.cash.value;
      if (d.cash.matched) notes.push(`cashOffset = tax component of ${d.cash.matched} cash-ledger debit(s) tagged ret_period ${period}`);
      else if (d.cash.tagged) notes.push(`cashOffset = 0 — no cash-ledger debit tagged ret_period ${period} yet (3B not offset/paid)`);
      else notes.push(`cashOffset = 0 — cash ledger carries no ret_period tags in this window`);
    } else if (d.hasCashData) {
      notes.push(`cashOffset not claimed — cached cash ledger does not span ${fmtDmy(periodStart)}–${fmtDmy(cashNeedTo)}`);
    } else {
      notes.push('cashOffset not claimed — no cash-ledger statement cached');
    }

    if (!Object.keys(values).length) {
      return { ok: true, noData: true, patch: { source: 'ledgers', values: {}, at, calls, notes: notes.join('; ') } };
    }

    const src = usedApi ? 'portal ledgers' : 'cached ledgers';
    const zeroOnly = !Object.values(values).some((v) => nonZero4(v as Split4));
    const patch: Gstr3bPatch = {
      source: 'ledgers',
      values,
      at,
      calls,
      notes: `${src} · ${label}${zeroOnly ? ' (all nil)' : ''} — ${notes.join('; ')}`,
    };
    return { ok: true, patch };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unexpected error reading the electronic ledgers.' };
  }
};

export default gstr3bFromLedgers;
