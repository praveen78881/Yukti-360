import { X } from 'lucide-react';
import { formatINR, plural } from './format';

interface PartyFocusBarProps {
  name: string;
  gstin?: string;
  /** Open amount for this party in the current view. */
  outstanding: number;
  billCount: number;
  /** Age of the oldest open bill, in days (optional). */
  oldestDays?: number;
  /** "customer" | "vendor". */
  noun: string;
  onClear: () => void;
}

/** Shown above the bill list when a party is picked (from the concentration
    chart or a row): who, how much, how many — and one way out. */
export function PartyFocusBar({ name, gstin, outstanding, billCount, oldestDays, noun, onClear }: PartyFocusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[12px] border border-[var(--navy)] bg-[var(--navy-soft)] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="eyebrow !text-[var(--navy-2)]">Showing one {noun}</p>
        <p className="mt-0.5 truncate text-[13.5px] font-bold text-[var(--ink)]" title={name}>
          {name}
        </p>
      </div>
      {gstin && <span className="code-pill">{gstin}</span>}
      <div className="flex items-center gap-5 text-[12px] text-[var(--ink-2)]">
        <span>
          <span className="font-mono font-semibold text-[var(--ink)]">{formatINR(outstanding)}</span> open
        </span>
        <span>{plural(billCount, 'bill')}</span>
        {oldestDays !== undefined && oldestDays > 0 && <span>oldest {plural(oldestDays, 'day')}</span>}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--sand)] bg-white px-3 text-[12px] font-semibold text-[var(--ink-2)] transition-colors duration-[160ms] hover:border-[var(--sand-2)] hover:text-[var(--ink)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        Show all {noun}s
      </button>
    </div>
  );
}
