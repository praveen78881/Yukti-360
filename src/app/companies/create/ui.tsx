/* ─────────────────────────────────────────────────────────────────────────────
   Presentational pieces for the create-company wizard. No state, no data —
   the page owns all of that. Styled on the app's navy system (globals.css).
   ──────────────────────────────────────────────────────────────────────────── */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, Check, X, type LucideIcon } from 'lucide-react';

/* ── Field well ── pale cream-2 at rest, white + slate-blue ring on focus ── */
export const inp =
  'h-10 w-full rounded-[10px] border-[1.5px] border-[var(--sand)] bg-[var(--cream-2)] px-3 text-[14px] text-[var(--ink)] ' +
  'placeholder:text-[var(--ink-3)] transition-[background-color,border-color,box-shadow] duration-[160ms] ' +
  'hover:border-[var(--sand-2)] focus:outline-none focus:bg-white focus:border-[var(--slate-blue)] ' +
  'focus:shadow-[0_0_0_3px_rgba(23,69,127,0.12)]';
export const inpErr = '!border-[var(--bad)] !shadow-[0_0_0_3px_rgba(178,59,51,0.14)] field-error';
export const mono = 'font-mono tracking-[0.04em] uppercase';

export function Field({
  label, error, hint, children, span2, icon: Icon, optional,
}: {
  label: string; error?: string; hint?: string; children: ReactNode; span2?: boolean;
  icon?: LucideIcon; optional?: boolean;
}) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 flex items-center gap-1.5 font-display text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-2)]">
        {Icon && <Icon className="h-3 w-3 text-[var(--slate-blue)]" />}
        {label}
        {optional && <span className="font-sans text-[10px] font-medium normal-case tracking-normal text-[var(--ink-3)]">optional</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[var(--bad)]">
          <AlertCircle className="h-3 w-3" />{error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-[var(--ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
}

/* Controlled text input that PRESERVES the caret position even when the value is
   transformed on every keystroke (UPPERCASE, digit-stripping). Without this,
   React re-assigns input.value after the transform and the caret jumps to the end,
   so editing in the middle of a PAN/CIN/GSTIN was impossible. */
type TextInputProps = {
  value: string;
  onValueChange: (v: string) => void;
  transform?: (raw: string) => string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export function TextInput({ value, onValueChange, transform, ...rest }: TextInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const caretPos = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caretPos.current !== null && ref.current) {
      const pos = caretPos.current;
      try { ref.current.setSelectionRange(pos, pos); } catch { /* input type without selection support */ }
      caretPos.current = null;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const raw = el.value;
    const rawCaret = el.selectionStart ?? raw.length;
    const next = transform ? transform(raw) : raw;
    // New caret = length of the transformed text that precedes the original caret.
    caretPos.current = transform ? transform(raw.slice(0, rawCaret)).length : rawCaret;
    onValueChange(next);
  };

  return <input ref={ref} value={value} onChange={handleChange} {...rest} />;
}

export const toUpper = (s: string) => s.toUpperCase();
export const digitsOnly = (s: string) => s.replace(/\D/g, '');

/* ── A question on one line: icon + prompt on the left, the answer on the right ── */
export function QuestionRow({
  icon: Icon, title, hint, children, error,
}: { icon: LucideIcon; title: string; hint?: string; children: ReactNode; error?: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="quick-tile-icon !h-9 !w-9"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-[var(--ink)] leading-tight">{title}</p>
          {hint && <p className="mt-0.5 text-[11.5px] text-[var(--ink-3)]">{hint}</p>}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 pl-12 text-[11px] font-semibold text-[var(--bad)]">
          <AlertCircle className="h-3 w-3" />{error}
        </p>
      )}
    </div>
  );
}

/* ── Yes / No as a two-segment pill ── */
export function YesNo({
  value, onChange, name, yesLabel = 'Yes', noLabel = 'No',
}: { value: boolean | null; onChange: (v: boolean) => void; name: string; yesLabel?: string; noLabel?: string }) {
  const seg = (on: boolean) =>
    `inline-flex h-8 items-center gap-1.5 rounded-full px-4 font-display text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-[160ms] ${
      on ? 'bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]' : 'text-[var(--ink-2)] hover:text-[var(--navy)]'
    }`;
  return (
    <div role="radiogroup" aria-label={name} id={name}
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--sand)] bg-[var(--cream-2)] p-1">
      <button type="button" role="radio" aria-checked={value === true} className={seg(value === true)} onClick={() => onChange(true)}>
        <Check className="h-3.5 w-3.5" />{yesLabel}
      </button>
      <button type="button" role="radio" aria-checked={value === false} className={seg(value === false)} onClick={() => onChange(false)}>
        <X className="h-3.5 w-3.5" />{noLabel}
      </button>
    </div>
  );
}

/* ── Segmented choice (two or three short options) ── */
export function Segmented<T extends string>({
  value, options, onChange, label,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label}
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--sand)] bg-[var(--cream-2)] p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`h-8 rounded-full px-4 font-display text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-[160ms] ${
              on ? 'bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]' : 'text-[var(--ink-2)] hover:text-[var(--navy)]'
            }`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── On/off row — a real switch, not a bare checkbox ── */
export function SwitchRow({
  icon: Icon, title, caption, on, onChange, locked, lockedCaption,
}: {
  icon: LucideIcon; title: string; caption: string; on: boolean; onChange: (v: boolean) => void;
  locked?: boolean; lockedCaption?: string;
}) {
  return (
    <button
      type="button" role="switch" aria-checked={on} disabled={locked}
      onClick={() => onChange(!on)}
      className={`flex w-full items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition-[background-color,border-color] duration-[160ms] ${
        on ? 'border-[var(--navy)]/40 bg-[var(--navy-soft)]/55' : 'border-[var(--sand)] bg-white hover:border-[var(--sand-2)]'
      } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className="quick-tile-icon !h-9 !w-9"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-[var(--ink)] leading-tight">{title}</span>
        <span className="mt-0.5 block text-[11.5px] text-[var(--ink-3)]">{locked && lockedCaption ? lockedCaption : caption}</span>
      </span>
      <span aria-hidden className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-[160ms] ${on ? 'bg-[var(--navy)]' : 'bg-[var(--sand-2)]'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(24,44,70,0.25)] transition-transform duration-[160ms] ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

/* ── A selectable card (ITR forms, business nature) ── */
export function ChoiceCard({
  icon: Icon, title, caption, selected, onClick, tag,
}: { icon: LucideIcon; title: string; caption: string; selected: boolean; onClick: () => void; tag?: string }) {
  return (
    <button
      type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`group relative flex w-full items-start gap-3 rounded-[12px] border p-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-[160ms] ${
        selected
          ? 'border-[var(--navy)] bg-[var(--navy-soft)]/60 shadow-[0_0_0_3px_rgba(23,69,127,0.10)]'
          : 'border-[var(--sand)] bg-white hover:-translate-y-px hover:border-[var(--sand-2)] hover:shadow-[var(--shadow-rest)]'
      }`}
    >
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-[160ms] ${
        selected ? 'bg-[linear-gradient(158deg,var(--navy),var(--navy-2))] text-white shadow-[var(--shadow-navy)]' : 'bg-[var(--navy-soft)] text-[var(--navy)]'
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-[14px] font-semibold uppercase tracking-[0.05em] text-[var(--ink)]">{title}</span>
          {tag && <span className="code-pill !px-2 !py-0 !text-[10px]">{tag}</span>}
        </span>
        <span className="mt-1 block text-[12px] leading-snug text-[var(--ink-2)]">{caption}</span>
      </span>
      <span className={`absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full transition-all duration-[160ms] ${
        selected ? 'bg-[var(--navy)] text-white' : 'border-[1.5px] border-[var(--sand-2)] bg-white text-transparent'
      }`}>
        <Check className="h-3 w-3" strokeWidth={2.6} />
      </span>
    </button>
  );
}

/* ── Chip toggle (multi-select, e.g. nature of business) ── */
export function Chip({ icon: Icon, label, on, onClick }: { icon: LucideIcon; label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors duration-[160ms] ${
        on ? 'border-[var(--navy)] bg-[var(--navy)] text-white shadow-[var(--shadow-navy)]'
           : 'border-[var(--sand)] bg-white text-[var(--ink-2)] hover:border-[var(--sand-2)] hover:text-[var(--navy)]'
      }`}>
      <Icon className="h-3.5 w-3.5" />{label}
    </button>
  );
}

/* ── Divider with a small caps caption, to group questions inside a step ── */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="eyebrow">{title}</span>
        <span className="h-px flex-1 bg-[var(--cream)]" />
      </div>
      {children}
    </section>
  );
}
