import { useState, type ReactNode } from 'react';
import { formatINR } from './format';
import { ChartTooltip, TipRow, useElementWidth } from './chartKit';

export interface AgeingSegment {
  key: string;
  label: string;
  amount: number;
  /** Fixed per bucket (from DUE_BUCKETS / SCHEDULE_III_BUCKETS) — colour follows
      the bucket, never its rank, so filtering never repaints survivors. */
  color: string;
  /** Optional number of bills / parties in the bucket, shown in the tooltip. */
  count?: number;
  countNoun?: string;
}

interface AgeingBarProps {
  segments: AgeingSegment[];
  /** Describes the chart for assistive tech, e.g. "Receivables by due-date ageing". */
  ariaLabel: string;
  /** Currently selected bucket (filters the list), or null. */
  selectedKey?: string | null;
  /** Makes legend rows buttons; clicking the selected one clears it. */
  onSelect?: (key: string | null) => void;
  /** Shown instead of the chart when every segment is zero. */
  emptyText?: string;
  /** Optional line under the legend, e.g. "As at 31 Mar 2026". */
  footnote?: ReactNode;
}

/** Part-to-whole of an outstanding amount across ORDINAL ageing buckets: one
    proportional bar (2px surface gaps between segments, square at the left
    baseline, 4px rounded data-end) + a legend that is also the table of values
    and the keyboard-accessible control. */
export function AgeingBar({ segments, ariaLabel, selectedKey = null, onSelect, emptyText = 'Nothing outstanding.', footnote }: AgeingBarProps) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.amount), 0);
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ key: string; x: number } | null>(null);

  if (!(total > 0)) {
    return <p className="py-6 text-center text-[12px] text-[var(--ink-2)]">{emptyText}</p>;
  }

  const visible = segments.filter((s) => s.amount > 0);
  const lastKey = visible[visible.length - 1]?.key;
  const hovered = hover ? segments.find((s) => s.key === hover.key) : undefined;

  return (
    <figure aria-label={ariaLabel} className="m-0">
      <div ref={ref} className="relative">
        {/* The bar — mouse gets per-segment tooltips; keyboard uses the legend. */}
        <div className="flex h-5 w-full gap-[2px]" aria-hidden="true" onMouseLeave={() => setHover(null)}>
          {visible.map((s) => {
            const dim = selectedKey && selectedKey !== s.key;
            return (
              <div
                key={s.key}
                className={`h-full transition-opacity duration-[160ms] ${s.key === lastKey ? 'rounded-r-[4px]' : ''} ${onSelect ? 'cursor-pointer' : ''}`}
                style={{ flexGrow: s.amount, flexBasis: 0, minWidth: 3, background: s.color, opacity: dim ? 0.3 : 1 }}
                onMouseMove={(e) => {
                  const box = e.currentTarget.parentElement!.getBoundingClientRect();
                  setHover({ key: s.key, x: e.clientX - box.left });
                }}
                onClick={onSelect ? () => onSelect(selectedKey === s.key ? null : s.key) : undefined}
              />
            );
          })}
        </div>
        {hover && hovered && (
          <ChartTooltip x={hover.x} y={0} containerWidth={width}>
            <p className="font-mono text-[13px] font-semibold text-[var(--ink)]">{formatINR(hovered.amount)}</p>
            <TipRow color={hovered.color} label={hovered.label} value={`${pct(hovered.amount, total)}%`} />
            {hovered.count !== undefined && (
              <p className="mt-0.5 text-[var(--ink-2)]">
                {hovered.count} {hovered.countNoun ?? 'bills'}
              </p>
            )}
          </ChartTooltip>
        )}
      </div>

      {/* Legend = value table = keyboard control. */}
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-0.5 min-[720px]:grid-cols-2">
        {segments.map((s) => {
          const selected = selectedKey === s.key;
          const content = (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: s.color }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-left text-[12px] text-[var(--ink-2)]">{s.label}</span>
              <span className="font-mono text-[12px] font-semibold tabular-nums text-[var(--ink)]">{s.amount > 0 ? formatINR(s.amount) : '—'}</span>
              <span className="w-10 text-right font-mono text-[11px] tabular-nums text-[var(--ink-2)]">{s.amount > 0 ? `${pct(s.amount, total)}%` : ''}</span>
            </>
          );
          const cls = `flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 ${selected ? 'bg-[var(--navy-soft)]' : ''}`;
          return onSelect ? (
            <button
              key={s.key}
              type="button"
              disabled={!(s.amount > 0)}
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : s.key)}
              className={`${cls} transition-colors duration-[160ms] enabled:hover:bg-[var(--cream-2)] disabled:cursor-default`}
            >
              {content}
            </button>
          ) : (
            <div key={s.key} className={cls}>
              {content}
            </div>
          );
        })}
      </div>
      {footnote && <figcaption className="mt-2 px-2 text-[11px] text-[var(--ink-2)]">{footnote}</figcaption>}
    </figure>
  );
}

function pct(v: number, total: number): string {
  const p = (v / total) * 100;
  return p >= 10 || p === 0 ? p.toFixed(0) : p.toFixed(1);
}
