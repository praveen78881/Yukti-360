import { useState } from 'react';
import { ACCENT, AXIS_TEXT, DEEMPH, GRID } from './tokens';
import { formatINR, formatINRCompact, plural } from './format';
import { niceMax, type MonthBucket } from './buckets';
import { ChartTooltip, TipRow, rectPath, roundedTopPath, useElementWidth } from './chartKit';

interface MonthlyBarsProps {
  /** From buildMonthBuckets(...) — the 12 months of the selected FY. */
  months: MonthBucket[];
  ariaLabel: string;
  /** Series names, e.g. { outstanding: 'Still to collect', settled: 'Collected' }. */
  seriesLabels: { outstanding: string; settled: string };
  selectedKey?: string | null;
  onSelect?: (key: string | null) => void;
  noun?: string;
}

const H_TOP = 10;
const H_PLOT = 120;
const H_AXIS = 22;
const Y_AXIS_W = 56;
const GAP = 2; // surface gap between the two stacked segments

/** Bills dated in each month of the FY, as an EMPHASIS stack: the part that
    matters (still outstanding) in the accent, anchored at the baseline so its
    length reads from zero; the settled remainder in the de-emphasis grey on
    top, separated by a 2px surface gap. Two series ⇒ a legend is always shown. */
export function MonthlyBars({ months, ariaLabel, seriesLabels, selectedKey = null, onSelect, noun = 'bill' }: MonthlyBarsProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const height = H_TOP + H_PLOT + H_AXIS;
  const billed = (m: MonthBucket) => m.outstanding + m.settled;
  const peak = Math.max(0, ...months.map(billed));

  const legend = (
    <div className="mb-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-[11.5px] text-[var(--ink-2)]">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: ACCENT }} aria-hidden="true" />
        {seriesLabels.outstanding}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: DEEMPH }} aria-hidden="true" />
        {seriesLabels.settled}
      </span>
    </div>
  );

  if (!(peak > 0)) {
    return (
      <figure aria-label={ariaLabel} className="m-0">
        <div ref={ref} className="flex items-center justify-center text-[12px] text-[var(--ink-2)]" style={{ height }}>
          No bills dated in this financial year.
        </div>
      </figure>
    );
  }

  const n = months.length;
  const yMax = niceMax(peak);
  const plotW = Math.max(0, width - Y_AXIS_W - 4);
  const band = n > 0 ? plotW / n : 0;
  const barW = Math.min(24, band * 0.6);
  const yBase = H_TOP + H_PLOT;
  const yOf = (v: number) => (v / yMax) * H_PLOT;
  const labelEvery = band < 30 ? 2 : 1;
  const ticks = [0, yMax / 2, yMax];

  return (
    <figure aria-label={ariaLabel} className="m-0">
      {legend}
      <div ref={ref} className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
        {width > 0 && (
          <svg width={width} height={height} role="group" aria-label={ariaLabel}>
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
            {months.map((m, i) => {
              const x0 = Y_AXIS_W + i * band;
              const x = x0 + (band - barW) / 2;
              const hOut = yOf(m.outstanding);
              const hSet = yOf(m.settled);
              const hasSettled = hSet > 0.5;
              const selected = selectedKey === m.key;
              const dim = selectedKey !== null && !selected;
              // Bottom (outstanding): rounded only when it is the top of the column.
              const outPath = hasSettled ? rectPath(x, yBase, barW, hOut) : roundedTopPath(x, yBase, barW, hOut);
              const setBase = yBase - hOut - (hOut > 0 ? GAP : 0);
              const setPath = hasSettled ? roundedTopPath(x, setBase, barW, Math.max(0, hSet - (hOut > 0 ? GAP : 0))) : '';
              return (
                <g key={m.key} opacity={dim ? 0.35 : 1}>
                  {selected && <rect x={x0 + 1} y={H_TOP - 4} width={band - 2} height={H_PLOT + 4} rx={6} fill="var(--navy-soft)" />}
                  {outPath && <path d={outPath} fill={ACCENT} />}
                  {setPath && <path d={setPath} fill={DEEMPH} />}
                  {i % labelEvery === 0 && (
                    <text x={x0 + band / 2} y={yBase + 15} textAnchor="middle" fontSize={10} fill={AXIS_TEXT}>
                      {m.label}
                    </text>
                  )}
                  <rect
                    x={x0}
                    y={H_TOP - 4}
                    width={band}
                    height={H_PLOT + 4 + H_AXIS}
                    fill="transparent"
                    tabIndex={0}
                    role={onSelect ? 'button' : 'img'}
                    aria-pressed={onSelect ? selected : undefined}
                    aria-label={`${m.longLabel}: billed ${formatINR(billed(m))}, ${seriesLabels.outstanding.toLowerCase()} ${formatINR(m.outstanding)}, ${seriesLabels.settled.toLowerCase()} ${formatINR(m.settled)}, ${plural(m.count, noun)}`}
                    className={`outline-none focus-visible:stroke-[var(--navy)] focus-visible:[stroke-width:2] ${onSelect ? 'cursor-pointer' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onClick={onSelect ? () => onSelect(selected ? null : m.key) : undefined}
                    onKeyDown={(e) => {
                      if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onSelect(selected ? null : m.key);
                      }
                    }}
                  />
                </g>
              );
            })}
            <line x1={Y_AXIS_W} x2={width} y1={yBase} y2={yBase} stroke="var(--sand)" strokeWidth={1} />
          </svg>
        )}
        {active !== null && width > 0 && (
          <ChartTooltip x={Y_AXIS_W + active * band + band / 2} y={yBase - yOf(billed(months[active])) - 4} containerWidth={width}>
            <p className="font-mono text-[13px] font-semibold text-[var(--ink)]">{formatINR(billed(months[active]))}</p>
            <p className="text-[var(--ink-2)]">
              Billed · {months[active].longLabel} · {plural(months[active].count, noun)}
            </p>
            <TipRow color={ACCENT} label={seriesLabels.outstanding} value={formatINR(months[active].outstanding)} />
            <TipRow color={DEEMPH} label={seriesLabels.settled} value={formatINR(months[active].settled)} />
          </ChartTooltip>
        )}
      </div>
    </figure>
  );
}
