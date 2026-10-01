/* Formatting helpers for the Bills pages. Pure functions — no data access. */

const INR_2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const INR_0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹1,00,40,000.00 — Indian grouping. `symbol:false` drops the ₹. */
export function formatINR(n: number, opts: { decimals?: 0 | 2; symbol?: boolean } = {}): string {
  const { decimals = 2, symbol = true } = opts;
  const v = Number.isFinite(n) ? n : 0;
  const body = (decimals === 0 ? INR_0 : INR_2).format(Math.abs(v));
  return `${v < 0 ? '−' : ''}${symbol ? '₹' : ''}${body}`;
}

/** Compact Indian units for axes and tight spots: ₹1.00 Cr · ₹12.5 L · ₹8.4 K · ₹640. */
export function formatINRCompact(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e7) return `${sign}₹${trim(a / 1e7)} Cr`;
  if (a >= 1e5) return `${sign}₹${trim(a / 1e5)} L`;
  if (a >= 1e3) return `${sign}₹${trim(a / 1e3)} K`;
  return `${sign}₹${INR_0.format(a)}`;
}
function trim(x: number): string {
  return x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1).replace(/\.0$/, '') : x.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-09-27' → '27 Sep 2026'. Empty/invalid → '—'. */
export function formatDate(iso?: string): string {
  const p = parseISO(iso);
  return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : '—';
}
/** '2026-09-27' → '27 Sep'. */
export function formatDateShort(iso?: string): string {
  const p = parseISO(iso);
  return p ? `${p.d} ${MONTHS[p.m - 1]}` : '—';
}
/** 1-based month → 'Apr'. */
export function monthAbbr(m: number): string {
  return MONTHS[(m - 1 + 12) % 12];
}

function parseISO(iso?: string): { y: number; m: number; d: number } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

/** Today's LOCAL calendar date as YYYY-MM-DD (never UTC — after midnight in
    India a UTC date is still "yesterday"). */
export function localISODate(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Whole days from `fromISO` to `toISO` (positive when `toISO` is later).
    Date-only arithmetic in UTC so DST/timezones never shift the count. */
export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO);
  const b = parseISO(toISO);
  if (!a || !b) return 0;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

/** Add whole days to an ISO date. */
export function addDays(iso: string, days: number): string {
  const p = parseISO(iso);
  if (!p) return iso;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** "in 5 days" · "today" · "12 days overdue" relative to `todayISO`. */
export function relativeDue(dueISO: string | undefined, todayISO: string): string {
  if (!dueISO) return 'No due date';
  const n = daysBetween(todayISO, dueISO);
  if (n === 0) return 'Due today';
  if (n > 0) return `in ${n} day${n === 1 ? '' : 's'}`;
  return `${-n} day${n === -1 ? '' : 's'} overdue`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
