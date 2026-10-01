/* Bucketing + status helpers shared by Bills Receivable and Bills Payable, so
   both pages classify identically. Pure functions over values the pages already
   have (due date, pending, amounts) — no data access, no business logic change. */

import { AGEING_RAMP, DEEMPH } from './tokens';
import { addDays, daysBetween, monthAbbr } from './format';

/* ── Bill status (for the status chip) ─────────────────────────────────── */

export type BillStatus = 'settled' | 'overdue' | 'due_soon' | 'due' | 'no_due';

export const STATUS_META: Record<BillStatus, { label: string; tone: 'ok' | 'warn' | 'bad' | 'idle' }> = {
  settled:  { label: 'Settled',     tone: 'ok' },
  overdue:  { label: 'Overdue',     tone: 'bad' },
  due_soon: { label: 'Due soon',    tone: 'warn' },
  due:      { label: 'Not yet due', tone: 'idle' },
  no_due:   { label: 'No due date', tone: 'idle' },
};

/** Status of one bill today. `pending` ≤ 0.005 ⇒ settled. Due soon = within
    `dueSoonDays` (default 7) and not overdue. */
export function deriveStatus(p: {
  pending: number;
  dueDate?: string;
  todayISO: string;
  dueSoonDays?: number;
}): BillStatus {
  if (!(p.pending > 0.005)) return 'settled';
  if (!p.dueDate) return 'no_due';
  const n = daysBetween(p.todayISO, p.dueDate); // >0 → in future
  if (n < 0) return 'overdue';
  if (n <= (p.dueSoonDays ?? 7)) return 'due_soon';
  return 'due';
}

/* ── Due-date ageing (bill level) ──────────────────────────────────────── */

export type DueBucketKey = 'not_due' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90_plus' | 'no_due';

export const DUE_BUCKETS: ReadonlyArray<{ key: DueBucketKey; label: string; color: string }> = [
  { key: 'not_due',  label: 'Not yet due',          color: AGEING_RAMP[0] },
  { key: 'd1_30',    label: '1–30 days overdue',    color: AGEING_RAMP[1] },
  { key: 'd31_60',   label: '31–60 days overdue',   color: AGEING_RAMP[2] },
  { key: 'd61_90',   label: '61–90 days overdue',   color: AGEING_RAMP[3] },
  { key: 'd90_plus', label: 'Over 90 days overdue', color: AGEING_RAMP[4] },
  { key: 'no_due',   label: 'No due date',          color: DEEMPH },
];

/** Which due-ageing bucket an OPEN bill falls in, as of `todayISO`. */
export function dueBucketOf(dueDate: string | undefined, todayISO: string): DueBucketKey {
  if (!dueDate) return 'no_due';
  const overdue = daysBetween(dueDate, todayISO); // >0 → days past due
  if (overdue <= 0) return 'not_due';
  if (overdue <= 30) return 'd1_30';
  if (overdue <= 60) return 'd31_60';
  if (overdue <= 90) return 'd61_90';
  return 'd90_plus';
}

/* ── Schedule III ageing (books level) ─────────────────────────────────── */

export type S3BucketKey = 'lessThan6Months' | 'sixMonthsTo1Year' | 'oneYearTo2Years' | 'twoYearsTo3Years' | 'moreThan3Years';

/** Keys match `ScheduleIIIAgeingBucket` in src/lib/accounting/ageingCompute.ts. */
export const SCHEDULE_III_BUCKETS: ReadonlyArray<{ key: S3BucketKey; label: string; color: string }> = [
  { key: 'lessThan6Months',  label: 'Less than 6 months', color: AGEING_RAMP[0] },
  { key: 'sixMonthsTo1Year', label: '6 months – 1 year',  color: AGEING_RAMP[1] },
  { key: 'oneYearTo2Years',  label: '1–2 years',          color: AGEING_RAMP[2] },
  { key: 'twoYearsTo3Years', label: '2–3 years',          color: AGEING_RAMP[3] },
  { key: 'moreThan3Years',   label: 'More than 3 years',  color: AGEING_RAMP[4] },
];

/* ── Due timeline: the next N weeks ────────────────────────────────────── */

export interface WeekBucket {
  start: string; // inclusive ISO
  end: string;   // inclusive ISO
  amount: number;
  count: number;
}

/** Group OPEN bills by the week their due date falls in, for the next `weeks`
    weeks starting today. Overdue bills and bills without a due date are NOT
    included (they have their own KPI/chip); anything beyond the window is
    ignored. */
export function buildWeekBuckets(
  items: ReadonlyArray<{ dueDate?: string; amount: number }>,
  todayISO: string,
  weeks = 13,
): WeekBucket[] {
  const out: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    start: addDays(todayISO, i * 7),
    end: addDays(todayISO, i * 7 + 6),
    amount: 0,
    count: 0,
  }));
  for (const it of items) {
    if (!it.dueDate || !(it.amount > 0)) continue;
    const d = daysBetween(todayISO, it.dueDate);
    if (d < 0) continue;
    const w = Math.floor(d / 7);
    if (w >= weeks) continue;
    out[w].amount += it.amount;
    out[w].count += 1;
  }
  return out;
}

/* ── Financial-year months (Apr → Mar) ─────────────────────────────────── */

export interface MonthBucket {
  key: string;         // 'YYYY-MM'
  label: string;       // 'Apr'
  longLabel: string;   // 'Apr 2025'
  outstanding: number; // still pending on bills dated in this month
  settled: number;     // billed − pending
  count: number;       // bills dated in this month
}

/** Bills DATED in each month of the financial year [fyFrom, fyTo], split into
    what is still outstanding and what has been settled (billed − pending). */
export function buildMonthBuckets(
  items: ReadonlyArray<{ date: string; total: number; pending: number }>,
  fyFrom: string,
  fyTo: string,
): MonthBucket[] {
  const startY = Number(fyFrom.slice(0, 4));
  const startM = Number(fyFrom.slice(5, 7));
  const out: MonthBucket[] = [];
  for (let i = 0; i < 12; i++) {
    const m0 = startM - 1 + i;
    const y = startY + Math.floor(m0 / 12);
    const m = (m0 % 12) + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.push({ key, label: monthAbbr(m), longLabel: `${monthAbbr(m)} ${y}`, outstanding: 0, settled: 0, count: 0 });
  }
  const idx = new Map(out.map((b, i) => [b.key, i]));
  for (const it of items) {
    if (!it.date || it.date < fyFrom || it.date > fyTo) continue;
    const i = idx.get(it.date.slice(0, 7));
    if (i === undefined) continue;
    const pending = Math.max(0, it.pending);
    out[i].outstanding += pending;
    out[i].settled += Math.max(0, it.total - pending);
    out[i].count += 1;
  }
  return out;
}

/* ── "Nice" axis maximum ───────────────────────────────────────────────── */

/** Round a maximum up to a clean value (1/2/2.5/5 × 10^k) for axis ticks. */
export function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * exp;
}
