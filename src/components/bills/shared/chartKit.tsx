/* Internal building blocks for the Bills charts (not exported from index). */

import { useEffect, useState, type ReactNode } from 'react';

/** Measure an element's content width (ResizeObserver) so SVG charts render in
    real pixels — text never stretches, marks keep their spec widths. A callback
    ref, so it re-observes when a chart swaps between its empty and filled
    markup (a different element mounts). */
export function useElementWidth<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!el) return;
    const measure = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return { ref: setEl, width };
}

/** Column path: 4px rounded data-end at the top, square at the baseline. */
export function roundedTopPath(x: number, yBase: number, w: number, h: number, r = 4): string {
  if (h <= 0 || w <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  const y = yBase - h;
  return `M${x},${yBase} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${yBase} Z`;
}

/** Plain rect path (for a stacked segment that isn't the top one). */
export function rectPath(x: number, yBase: number, w: number, h: number): string {
  if (h <= 0 || w <= 0) return '';
  return `M${x},${yBase} L${x},${yBase - h} L${x + w},${yBase - h} L${x + w},${yBase} Z`;
}

interface TooltipProps {
  /** Anchor point in the container's coordinate space (px). */
  x: number;
  y: number;
  /** Container width, to keep the tooltip inside it. */
  containerWidth: number;
  children: ReactNode;
}

/** One tooltip style for every chart: white card, lifted shadow, value first
    (strong), label second. Positioned above the anchor, clamped to the box.
    React escapes all text, so labels from data are always inserted safely. */
export function ChartTooltip({ x, y, containerWidth, children }: TooltipProps) {
  const W = 200;
  const left = Math.max(4, Math.min(containerWidth - W - 4, x - W / 2));
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute z-10 rounded-[10px] border border-[var(--sand)] bg-white px-2.5 py-2 text-[11.5px] shadow-[var(--shadow-lift)]"
      style={{ left, top: Math.max(0, y - 8), width: W, transform: 'translateY(-100%)' }}
    >
      {children}
    </div>
  );
}

/** A tooltip row keyed by a short line of the series colour (not a box). */
export function TipRow({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      {color && <span className="h-[2px] w-3 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />}
      <span className="text-[var(--ink-2)]">{label}</span>
      <span className="ml-auto font-mono font-semibold text-[var(--ink)]">{value}</span>
    </div>
  );
}
