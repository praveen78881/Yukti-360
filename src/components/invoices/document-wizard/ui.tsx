/* Shared presentation primitives for the document wizard (sales + purchase).
   Pure UI: every value/onChange is supplied by the caller from the existing
   wizard state — nothing here holds or derives accounting data. */
import { useRef, type ReactNode } from 'react';
import { CalendarDays, type LucideIcon } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-27" → "27 Sep 2026" (display only; the stored value stays ISO). */
export function fmtDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

export function inr(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** A date shown as bold text; clicking anywhere on it opens the native picker.
    The real <input type="date"> sits invisibly underneath so the picker anchors
    to the chip, and keyboard users can still reach it. */
export function DateChip({
  value, onChange, label, invalid, size = 'lg', testId,
}: {
  value: string;
  onChange: (iso: string) => void;
  label: string;
  invalid?: boolean;
  size?: 'lg' | 'md';
  testId?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch { /* fall back below */ }
    }
    el.focus();
    el.click();
  };
  const text = fmtDate(value);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={open}
        aria-label={`${label}: ${text || 'not set'} — change date`}
        data-testid={testId}
        className={`yk-date ${size === 'md' ? 'md' : ''} ${invalid ? 'bad' : ''}`}
      >
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
        {text && <span>{text}</span>}
      </button>
      <input
        ref={ref}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden
        className="yk-date-native"
        data-testid={testId ? `${testId}-input` : undefined}
      />
    </span>
  );
}

/** Segmented control — one of N. */
export function Seg<T extends string>({
  value, onChange, options, ariaLabel, disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ v: T; label: ReactNode; title?: string }>;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="yk-seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          title={o.title}
          disabled={disabled}
          className={value === o.v ? 'on' : ''}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** On/off switch. */
export function Switch({
  checked, onChange, label, disabled, testId,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`yk-switch ${checked ? 'on' : ''}`}
    >
      <span />
    </button>
  );
}

/** Label + control + inline error. */
export function Field({
  label, required, error, hint, children, className = '', htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string | false | null;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={`yk-field ${error ? 'bad' : ''} ${className}`}>
      <label className="yk-lbl" htmlFor={htmlFor}>
        {label}
        {required && <span className="yk-req" aria-hidden> *</span>}
      </label>
      {children}
      {error ? <span className="yk-err" role="alert">{error}</span> : hint ? <span className="yk-hint">{hint}</span> : null}
    </div>
  );
}

/** White section card with an icon-tile header. */
export function Card({
  icon: Icon, title, sub, action, children, className = '', testId, bodyHidden,
}: {
  icon?: LucideIcon;
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
  /** Keep the body mounted (its state survives) but hidden. */
  bodyHidden?: boolean;
}) {
  return (
    <section className={`yk-card ${className}`} data-testid={testId}>
      <header className="yk-card-h">
        {Icon && <span className="yk-tile"><Icon className="h-4 w-4" aria-hidden /></span>}
        <div className="min-w-0 flex-1">
          <h3 className="yk-card-t">{title}</h3>
          {sub && <p className="yk-card-s">{sub}</p>}
        </div>
        {action}
      </header>
      <div className="yk-card-b" hidden={bodyHidden}>{children}</div>
    </section>
  );
}
