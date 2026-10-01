import { ACCENT, METER_TRACK } from './tokens';

interface PartPaidBarProps {
  /** Amount received (receivable) or paid (payable). */
  paid: number;
  /** Bill total. */
  total: number;
  /** "received" or "paid" — used in the accessible label. */
  verb?: 'received' | 'paid';
  /** Show the percentage text beside the bar (default true). */
  showLabel?: boolean;
  className?: string;
}

/** Thin meter: how much of a bill has been settled. The unfilled track is a
    lighter step of the fill's own ramp, so the state reads across the bar.
    The percentage is also printed, so the value never depends on colour. */
export function PartPaidBar({ paid, total, verb = 'received', showLabel = true, className = '' }: PartPaidBarProps) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, paid / total)) : 0;
  const pct = Math.round(ratio * 100);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% ${verb}`}
        className="h-1 w-full min-w-[40px] overflow-hidden rounded-full"
        style={{ background: METER_TRACK }}
      >
        <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: ACCENT }} />
      </div>
      {showLabel && <span className="shrink-0 font-mono text-[10.5px] text-[var(--ink-2)]">{pct}%</span>}
    </div>
  );
}
