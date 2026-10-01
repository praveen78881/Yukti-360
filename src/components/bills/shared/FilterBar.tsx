import type { ReactNode } from 'react';
import { Check, Search, X } from 'lucide-react';

/* Filters are standard UI, not chart marks: one row, left-aligned, ABOVE
   everything they scope. Selection uses navy-soft + navy ("you are here"). */

export function FilterRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

interface SearchFieldProps {
  value: string;
  onChange: (v: string) => void;
  /** Accessible name, e.g. "Search bills by party, bill no or GSTIN". */
  label: string;
  placeholder?: string;
  className?: string;
}

export function SearchField({ value, onChange, label, placeholder, className = '' }: SearchFieldProps) {
  return (
    <div className={`relative min-w-[200px] flex-1 sm:max-w-[320px] ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-3)]" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onChange(''); }}
        aria-label={label}
        placeholder={placeholder}
        className="h-9 w-full rounded-[10px] border-[1.5px] border-[var(--sand)] bg-[var(--cream-2)] pl-9 pr-8 text-[13px] text-[var(--ink)] outline-none transition-[background-color,border-color,box-shadow] duration-[160ms] focus:border-[var(--slate-blue)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,69,127,0.12)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-3)] hover:bg-[var(--navy-soft)] hover:text-[var(--navy)]"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export interface ChipOption<K extends string> {
  key: K;
  label: string;
  count?: number;
}

interface FilterChipsProps<K extends string> {
  options: ReadonlyArray<ChipOption<K>>;
  value: K;
  onChange: (key: K) => void;
  /** Accessible group name, e.g. "Filter by status". */
  label: string;
}

/** Single-choice pill group (All · Overdue · Due soon · Part-paid · Settled). */
export function FilterChips<K extends string>({ options, value, onChange, label }: FilterChipsProps<K>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-colors duration-[160ms] ${
              on
                ? 'border-[var(--navy)] bg-[var(--navy-soft)] text-[var(--navy-2)]'
                : 'border-[var(--sand)] bg-white text-[var(--ink-2)] hover:border-[var(--sand-2)] hover:text-[var(--ink)]'
            }`}
          >
            {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {o.label}
            {o.count !== undefined && <span className="font-mono text-[11px] font-medium tabular-nums opacity-80">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

interface SegmentedToggleProps<K extends string> {
  options: ReadonlyArray<{ key: K; label: string }>;
  value: K;
  onChange: (key: K) => void;
  label: string;
}

/** Compact two/three-way view switch, e.g. "By due date | Schedule III". */
export function SegmentedToggle<K extends string>({ options, value, onChange, label }: SegmentedToggleProps<K>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-[var(--sand)] bg-[var(--cream-2)] p-[3px]">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={`h-7 rounded-full px-3 font-display text-[10.5px] font-semibold uppercase tracking-[0.1em] transition-colors duration-[160ms] ${
              on ? 'bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface SortSelectProps<K extends string> {
  options: ReadonlyArray<{ key: K; label: string }>;
  value: K;
  onChange: (key: K) => void;
  label?: string;
}

/** Sort control as a native select (keyboard + screen-reader friendly). */
export function SortSelect<K extends string>({ options, value, onChange, label = 'Sort bills' }: SortSelectProps<K>) {
  return (
    <label className="inline-flex items-center gap-2 text-[12px] text-[var(--ink-2)]">
      <span className="eyebrow">Sort</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as K)}
        className="h-8 rounded-[10px] border-[1.5px] border-[var(--sand)] bg-white px-2.5 text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--slate-blue)] focus:shadow-[0_0_0_3px_rgba(23,69,127,0.12)]"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
