import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ACCENT, METER_TRACK } from './tokens';

type Tone = 'ok' | 'warn' | 'bad' | 'idle';

const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-[var(--ok-soft)] text-[#245F45]',
  warn: 'bg-[var(--warn-soft)] text-[#8A530F]',
  bad: 'bg-[var(--bad-soft)] text-[#8C2E27]',
  idle: 'bg-[var(--cream)] text-[var(--ink-2)]',
};
const TONE_ICON: Record<Tone, LucideIcon> = { ok: CheckCircle2, warn: Clock, bad: AlertTriangle, idle: Info };

export interface KpiTileProps {
  /** Sentence-case label, no trailing colon. */
  label: string;
  /** Pre-formatted value, e.g. "₹12,40,000.00" or "—". */
  value: string;
  /** Small caption under the value, e.g. "8 bills · 5 customers". */
  caption?: ReactNode;
  /** Optional status pill (icon + label, never colour alone). */
  status?: { tone: Tone; label: string };
  /** Optional meter, e.g. share collected. `value` is 0..1. */
  meter?: { value: number; label: string };
  /** Makes the tile a button (e.g. "Overdue" → filter the list). */
  onClick?: () => void;
  /** Pressed state when the tile's filter is active. */
  active?: boolean;
}

/** A stat tile: label · value · caption, with optional status pill and meter.
    Values use proportional figures (the app sets tabular-nums on body, which
    makes big standalone numbers look loose — this opts back out). */
export function KpiTile({ label, value, caption, status, meter, onClick, active }: KpiTileProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {status && <StatusPill tone={status.tone} label={status.label} />}
      </div>
      <p className="mt-2 font-mono text-[21px] font-semibold leading-none text-[var(--ink)] proportional-nums">{value}</p>
      {caption && <div className="mt-1.5 text-[11.5px] leading-snug text-[var(--ink-2)]">{caption}</div>}
      {meter && (
        <div className="mt-2.5">
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clamp01(meter.value) * 100)}
            aria-label={meter.label}
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ background: METER_TRACK }}
          >
            <div className="h-full rounded-full" style={{ width: `${clamp01(meter.value) * 100}%`, background: ACCENT }} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--ink-2)]">{meter.label}</p>
        </div>
      )}
    </>
  );

  const base = 'rounded-[14px] border bg-white p-4 text-left shadow-[var(--shadow-rest)]';
  if (!onClick) return <div className={`${base} border-[var(--sand)]`}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={`${base} w-full transition-[transform,box-shadow,border-color] duration-[160ms] hover:-translate-y-px hover:shadow-[var(--shadow-lift)] ${
        active ? 'border-[var(--navy)] ring-2 ring-[var(--ring-soft)]' : 'border-[var(--sand)] hover:border-[var(--sand-2)]'
      }`}
    >
      {body}
    </button>
  );
}

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-display text-[9.5px] font-semibold uppercase tracking-[0.1em] ${TONE_CLASS[tone]}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

function clamp01(v: number) {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}

/** Four across; two below 1180px; one below 620px. */
export function KpiStrip({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 min-[620px]:grid-cols-2 min-[1180px]:grid-cols-4">{children}</div>;
}
