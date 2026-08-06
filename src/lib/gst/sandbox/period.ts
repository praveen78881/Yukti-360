// Period helpers for GST return download — MMYYYY <-> {year, month}, the FY /
// quarter / month picker model ("like the GST dashboard"), and the availability
// gate (a return can only be pulled once the portal has generated it).

export interface PeriodParts {
  year: number;   // calendar year, e.g. 2025
  month: number;  // 1-12
}

/** "122025" -> { year: 2025, month: 12 }. */
export function parsePeriod(fp: string): PeriodParts {
  const month = parseInt(fp.slice(0, 2), 10);
  const year = parseInt(fp.slice(2), 10);
  return { year, month };
}

/** { year: 2025, month: 12 } -> "122025". */
export function toPeriod(year: number, month: number): string {
  return `${String(month).padStart(2, '0')}${year}`;
}

/** Year/month split for the API path segments (year 4-digit, month 2-digit). */
export function toApiYearMonth(fp: string): { year: string; month: string } {
  return { year: fp.slice(2), month: fp.slice(0, 2) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthShort(month: number): string {
  return MONTHS[month - 1] ?? '';
}

/** "December 2025" style label for a period. */
export function periodLabel(fp: string): string {
  const { year, month } = parsePeriod(fp);
  const long = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${long[month - 1] ?? ''} ${year}`;
}

// ── Indian financial year (Apr–Mar) & quarters ──────────────────────────────

/** The Indian FY a calendar (year, month) falls in. Apr-2025 → FY 2025-26. */
export function fyOf(year: number, month: number): { startYear: number; label: string } {
  const startYear = month >= 4 ? year : year - 1;
  return { startYear, label: `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}` };
}

/** The four calendar months of an FY quarter. Q1 = Apr,May,Jun … Q4 = Jan,Feb,Mar. */
export function quarterMonths(fyStartYear: number, quarter: 1 | 2 | 3 | 4): PeriodParts[] {
  // Q1 starts at month 4 of fyStartYear; Q4 (Jan-Mar) rolls into fyStartYear+1.
  const startMonth = (quarter - 1) * 3 + 4; // 4,7,10,13
  return [0, 1, 2].map((i) => {
    const m0 = startMonth + i; // 1-based, may exceed 12
    const month = ((m0 - 1) % 12) + 1;
    const year = m0 > 12 ? fyStartYear + 1 : fyStartYear;
    return { year, month };
  });
}

export function quarterLabel(quarter: 1 | 2 | 3 | 4): string {
  return ['Q1 (Apr–Jun)', 'Q2 (Jul–Sep)', 'Q3 (Oct–Dec)', 'Q4 (Jan–Mar)'][quarter - 1];
}

/** A list of recent FYs (startYear, label) for the dropdown, newest first. */
export function recentFinancialYears(count = 5, today = new Date()): { startYear: number; label: string }[] {
  const cur = fyOf(today.getFullYear(), today.getMonth() + 1).startYear;
  return Array.from({ length: count }, (_, i) => {
    const startYear = cur - i;
    return { startYear, label: `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}` };
  });
}

// ── Availability gate ───────────────────────────────────────────────────────
// A month's return cannot be pulled before the portal generates it:
//   • GSTR-2B is generated on the 14th of the FOLLOWING month.
//   • GSTR-2A is dynamic; we simply require the month to have ended.
// Returns { available, reason } — reason is a human note for the disabled state.

export function availability(
  type: 'GSTR2A' | 'GSTR2B',
  fp: string,
  now = new Date(),
): { available: boolean; reason: string } {
  const { year, month } = parsePeriod(fp);

  if (type === 'GSTR2B') {
    // Available from the 14th of the next month.
    const gen = new Date(year, month, 14); // month is 0-based next month here (month index == next month)
    if (now >= gen) return { available: true, reason: '' };
    return {
      available: false,
      reason: `GSTR-2B for ${periodLabel(fp)} is generated on 14-${monthShort(month === 12 ? 1 : month + 1)}-${month === 12 ? year + 1 : year}.`,
    };
  }

  // GSTR-2A: require the month to be over (i.e., we're in the next month or later).
  const monthEnd = new Date(year, month, 1); // first day of the next month
  if (now >= monthEnd) return { available: true, reason: '' };
  return {
    available: false,
    reason: `GSTR-2A for ${periodLabel(fp)} becomes available after the month ends.`,
  };
}
