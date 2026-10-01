import { useState } from 'react';
import { ACCENT, AXIS_TEXT, GRID } from './tokens';
import { formatDateShort, formatINR, formatINRCompact, plural } from './format';
import { niceMax, type WeekBucket } from './buckets';
import { ChartTooltip, TipRow, roundedTopPath, useElementWidth } from './chartKit';

interface DueTimelineProps {
  /** From buildWeekBuckets(...) — week 0 starts today. */
  weeks: WeekBucket[];
  /** "Receivables falling due, next 13 weeks". */
  ariaLabel: string;
  /** Selected week index (filters the list), or null. */
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
  /** Word for the items in tooltips: 'bill' → "3 bills". */
  noun?: string;
}

const H_TOP = 18;   // room for the one direct label
const H_PLOT = 116;
const H_AXIS = 22;  // x-axis band is INSIDE the container height (never clipped)
const Y_AXIS_W = 56;

/** Amounts falling due per week for the next N weeks — one series, one hue,
    columns ≤ 24px with a 4px rounded cap, square at the baseline; hairline
    solid grid; one direct label (the peak); per-column hover + focus tooltip
    with a hit area the full width of the week. Overdue amounts are NOT here —
    they're a status, shown in the KPI tile and the bill chips. */
export function DueTimeline({ weeks, ariaLabel, selectedIndex = null, onSelect, noun = 'bill' }: DueTimelineProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const total = weeks.reduce((s, w) => s + w.amount, 0);
  const height = H_TOP + H_PLOT + H_AXIS;

  if (!(total > 0)) {
    return (
      <div ref={ref} className="flex items-center justify-center text-[12px] text-[var(--ink-2)]" style={{ height }}>
        Nothing falls due in the next {weeks.length} weeks.
      </div>
    );
  }

  const n = weeks.length;
  const yMax = niceMax(Math.max(...weeks.map((w) => w.amount)));
  const plotW = Math.max(0, width - Y_AXIS_W - 4);
  const band = n > 0 ? plotW / n : 0;
  const barW = Math.min(24, band * 0.62);
  const yBase = H_TOP + H_PLOT;
  const yOf = (v: number) => (v / yMax) * H_PLOT;
  const peak = weeks.reduce((best, w, i) => (w.amount > weeks[best].amount ? i : best), 0);
  const labelEvery = Math.max(1, Math.ceil(52 / Math.max(1, band)));
  const ticks = [0, yMax / 2, yMax];
  const shown = active ?? null;

  return (
    <figure aria-label={ariaLabel} className="m-0">
      <div ref={ref} className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
        {width > 0 && (
          <svg width={width} height={height} role="group" aria-label={ariaLabel}>
            {/* Recessive grid + y ticks */}
            {ticks.map((t) => {
              const y = yBase - yOf(t);
              return (
                <g key={t}>
                  <line x1={Y_AXIS_W} x2={width} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
                  <text x={Y_AXIS_W - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill={AXIS_TEXT} className="font-mono">
                    {formatINRCompact(t)}
                  </text>
                </g>
              );
            })}

            {weeks.map((w, i) => {
              const x0 = Y_AXIS_W + i * band;
              const h = yOf(w.amount);
              const x = x0 + (band - barW) / 2;
              const selected = selectedIndex === i;
              const dim = selectedIndex !== null && !selected;
              const label = i === 0 ? 'Today' : formatDateShort(w.start);
              return (
                <g key={w.start}>
                  {selected && <rect x={x0 + 1} y={H_TOP - 6} width={band - 2} height={H_PLOT + 6} rx={6} fill="var(--navy-soft)" />}
                  <path d={roundedTopPath(x, yBase, barW, h)} fill={ACCENT} opacity={dim ? 0.35 : 1} />
                  {i === peak && w.amount > 0 && (
                    <text x={x + barW / 2} y={yBase - h - 6} textAnchor="middle" fontSize={10.5} fill={AXIS_TEXT} className="font-mono">
                      {formatINRCompact(w.amount)}
                    </text>
                  )}
                  {i % labelEvery === 0 && (
                    <text x={x0 + band / 2} y={yBase + 15} textAnchor="middle" fontSize={10} fill={AXIS_TEXT}>
                      {label}
                    </text>
                  )}
                  {/* Hit area: the whole week band, bigger than the mark. */}
                  <rect
                    x={x0}
                    y={H_TOP - 6}
                    width={band}
                    height={H_PLOT + 6 + H_AXIS}
                    fill="transparent"
                    tabIndex={0}
                    role={onSelect ? 'button' : 'img'}
                    aria-pressed={onSelect ? selected : undefined}
                    aria-label={`${formatDateShort(w.start)} to ${formatDateShort(w.end)}: ${formatINR(w.amount)} due across ${plural(w.count, noun)}`}
                    className={`outline-none focus-visible:stroke-[var(--navy)] focus-visible:[stroke-width:2] ${onSelect ? 'cursor-pointer' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onClick={onSelect ? () => onSelect(selected ? null : i) : undefined}
                    onKeyDown={(e) => {
                      if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onSelect(selected ? null : i);
                      }
                    }}
                  />
                </g>
              );
            })}
            <line x1={Y_AXIS_W} x2={width} y1={yBase} y2={yBase} stroke="var(--sand)" strokeWidth={1} />
          </svg>
        )}
        {shown !== null && width > 0 && (
          <ChartTooltip x={Y_AXIS_W + shown * band + band / 2} y={yBase - yOf(weeks[shown].amount) - 4} containerWidth={width}>
            <p className="font-mono text-[13px] font-semibold text-[var(--ink)]">{formatINR(weeks[shown].amount)}</p>
            <TipRow color={ACCENT} label={`${formatDateShort(weeks[shown].start)} – ${formatDateShort(weeks[shown].end)}`} value={plural(weeks[shown].count, noun)} />
          </ChartTooltip>
        )}
      </div>
    </figure>
  );
}
