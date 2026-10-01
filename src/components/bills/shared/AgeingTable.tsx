import { formatINR } from './format';

interface AgeingTableProps {
  /** Column buckets in order, e.g. SCHEDULE_III_BUCKETS mapped to {key,label}. */
  columns: ReadonlyArray<{ key: string; label: string }>;
  /** One row per party; `values` aligned with `columns`. */
  rows: ReadonlyArray<{ name: string; values: number[]; total: number }>;
  nameHeader?: string;
  emptyText?: string;
  caption?: string;
}

/** The table-view twin of the ageing chart (every chart has one): cream-2
    header in 9.5px Oswald caps, hairline rows, money right-aligned in tabular
    figures, totals in a footer row above a heavier rule. */
export function AgeingTable({ columns, rows, nameHeader = 'Party', emptyText = 'No outstanding balances.', caption }: AgeingTableProps) {
  const colTotals = columns.map((_, i) => rows.reduce((s, r) => s + (r.values[i] || 0), 0));
  const grand = rows.reduce((s, r) => s + r.total, 0);
  return (
    <div className="overflow-x-auto">
      <table className="acc-table min-w-[680px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            <th>{nameHeader}</th>
            {columns.map((c) => (
              <th key={c.key} className="r">
                {c.label}
              </th>
            ))}
            <th className="r">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 2} className="c py-8 text-[12px] text-[var(--ink-2)]">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.name}>
                <td className="max-w-[240px] truncate font-semibold text-[var(--ink)]" title={r.name}>
                  {r.name}
                </td>
                {r.values.map((v, i) => (
                  <td key={columns[i]?.key ?? i} className="r">
                    {v ? formatINR(v, { symbol: false }) : '—'}
                  </td>
                ))}
                <td className="r font-semibold">{formatINR(r.total, { symbol: false })}</td>
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr>
              <td>Total</td>
              {colTotals.map((v, i) => (
                <td key={columns[i].key} className="r">
                  {formatINR(v, { symbol: false })}
                </td>
              ))}
              <td className="r">{formatINR(grand, { symbol: false })}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
