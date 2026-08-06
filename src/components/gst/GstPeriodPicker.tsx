import { useMemo } from 'react';
import {
  parsePeriod, toPeriod, fyOf, quarterMonths, quarterLabel, recentFinancialYears, monthShort,
} from '@/lib/gst/sandbox/period';

/** FY → Quarter → Month selector, mirroring the GST portal dashboard layout.
 *  `value` / `onChange` speak MMYYYY (e.g. "122025"). */
export function GstPeriodPicker({ value, onChange }: { value: string; onChange: (period: string) => void }) {
  const { year, month } = parsePeriod(value);
  const fyStart = fyOf(year, month).startYear;

  // Which quarter (1-4) the current month sits in, within its FY.
  const quarter = useMemo<1 | 2 | 3 | 4>(() => {
    for (const q of [1, 2, 3, 4] as const) {
      if (quarterMonths(fyStart, q).some((m) => m.year === year && m.month === month)) return q;
    }
    return 1;
  }, [fyStart, year, month]);

  const fys = recentFinancialYears(6);
  const months = quarterMonths(fyStart, quarter);

  const selectFy = (newFyStart: number) => {
    // Keep the same quarter+position; default to the quarter's first month.
    const m = quarterMonths(newFyStart, quarter)[0];
    onChange(toPeriod(m.year, m.month));
  };
  const selectQuarter = (q: 1 | 2 | 3 | 4) => {
    const m = quarterMonths(fyStart, q)[0];
    onChange(toPeriod(m.year, m.month));
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      {/* Financial year */}
      <div className="flex items-center gap-3">
        <span className="w-24 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Financial Year</span>
        <select
          value={fyStart}
          onChange={(e) => selectFy(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-1.5 text-sm font-semibold text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {fys.map((fy) => (
            <option key={fy.startYear} value={fy.startYear}>FY {fy.label}</option>
          ))}
        </select>
      </div>

      {/* Quarter */}
      <div className="flex items-center gap-3">
        <span className="w-24 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Quarter</span>
        <div className="flex flex-wrap gap-1.5">
          {([1, 2, 3, 4] as const).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => selectQuarter(q)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                q === quarter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {quarterLabel(q)}
            </button>
          ))}
        </div>
      </div>

      {/* Month */}
      <div className="flex items-center gap-3">
        <span className="w-24 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Month</span>
        <div className="flex flex-wrap gap-1.5">
          {months.map((m) => {
            const p = toPeriod(m.year, m.month);
            const selected = m.year === year && m.month === month;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  selected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {monthShort(m.month)} {m.year}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
