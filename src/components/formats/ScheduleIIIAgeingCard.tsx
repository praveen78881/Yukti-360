'use client';

import type { AgeingBasis, AgeingRow, ScheduleIIIAgeingBucket } from '@/lib/accounting/ageingCompute';
import { AGEING_BASIS_CAPTION, AGEING_BASIS_OPTIONS } from '@/components/bills/ageingBasis';
import { SegmentedToggle } from '@/components/bills/shared/FilterBar';

function inr(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type BucketKey = Exclude<keyof ScheduleIIIAgeingBucket, 'total'>;

/** Youngest first. "Not Yet Due" only exists on the due-date basis. */
const COLUMNS: ReadonlyArray<{ key: BucketKey; label: string }> = [
  { key: 'notYetDue', label: 'Not Yet Due' },
  { key: 'lessThan6Months', label: '< 6 Months' },
  { key: 'sixMonthsTo1Year', label: '6m - 1 Year' },
  { key: 'oneYearTo2Years', label: '1 - 2 Years' },
  { key: 'twoYearsTo3Years', label: '2 - 3 Years' },
  { key: 'moreThan3Years', label: '> 3 Years' },
];

interface Props {
  title: string;
  rows: AgeingRow[];
  asAt: string;
  nameHeader?: string;
  emptyText?: string;
  /** What `rows` were aged from. With `onBasisChange`, the header carries the "Age by" toggle. */
  basis?: AgeingBasis;
  onBasisChange?: (basis: AgeingBasis) => void;
  /** Makes rows clickable, e.g. to open a party drawer. */
  onSelect?: (accountName: string) => void;
  selectedName?: string | null;
}

/** Schedule III (2021) ageing table — < 6m / 6m-1y / 1-2y / 2-3y / > 3y, plus "Not yet due" when aged from the due date. */
export function ScheduleIIIAgeingCard({
  title,
  rows,
  asAt,
  nameHeader = 'Party Name',
  emptyText = 'No outstanding balances.',
  basis = 'bill',
  onBasisChange,
  onSelect,
  selectedName,
}: Props) {
  const columns = basis === 'due' ? COLUMNS : COLUMNS.slice(1);
  const sum = (key: BucketKey) => rows.reduce((s, r) => s + (r.scheduleIIIAgeing?.[key] || 0), 0);
  const total = rows.reduce((s, r) => s + (r.scheduleIIIAgeing?.total || 0), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-100 px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          {onBasisChange && <p className="mt-0.5 text-[11px] text-gray-500">{AGEING_BASIS_CAPTION[basis]}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {onBasisChange && (
            <div className="flex items-center gap-2">
              <span className="eyebrow">Age by</span>
              <SegmentedToggle label="Age by" options={AGEING_BASIS_OPTIONS} value={basis} onChange={onBasisChange} />
            </div>
          )}
          <span className="text-[11px] text-gray-400">As at {asAt}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full text-xs ${basis === 'due' ? 'min-w-[800px]' : 'min-w-[700px]'}`}>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{nameHeader}</th>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">{c.label}</th>
              ))}
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-xs text-gray-400">{emptyText}</td>
              </tr>
            ) : (
              <>
                {rows.map((row) => {
                  const s3 = row.scheduleIIIAgeing;
                  if (!s3) return null;
                  const selected = selectedName === row.accountName;
                  return (
                    <tr
                      key={row.accountName}
                      onClick={onSelect ? () => onSelect(row.accountName) : undefined}
                      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter') onSelect(row.accountName); } : undefined}
                      tabIndex={onSelect ? 0 : undefined}
                      className={`border-t border-gray-50 transition-colors ${onSelect ? 'cursor-pointer' : ''} ${selected ? 'bg-blue-50/60' : 'hover:bg-gray-50/60'}`}
                    >
                      <td className="px-4 py-2.5 text-[11px] font-semibold text-gray-800 max-w-[200px] truncate">{row.accountName}</td>
                      {columns.map((c) => {
                        const v = s3[c.key];
                        return <td key={c.key} className="px-3 py-2.5 text-right font-mono text-[11px] text-gray-700">{v ? inr(v) : '-'}</td>;
                      })}
                      <td className="px-4 py-2.5 text-right font-mono text-[11px] font-bold text-gray-900">{inr(s3.total)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 bg-gray-50/50 font-bold">
                  <td className="px-4 py-2.5 text-[11px] text-gray-700">Total</td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-right font-mono text-[11px] text-gray-900">{inr(sum(c.key))}</td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-mono text-[11px] text-gray-900">{inr(total)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
