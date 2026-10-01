import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { CalcBlock, CalcPart, ComponentLines, RatioCalc } from './ratioCalc';

/* Pop-up showing how a ratio was actually worked out, with the real figures.
 * Hand-rolled overlay (the app's convention): globals.css turns the
 * `fixed inset-0 bg-black/…` wrapper into the navy veil and `ca-modal-panel`
 * into the 14px panel with the navy top strip and lifted shadow. */

const CATEGORY_LABEL: Record<string, string> = {
  liquidity: 'Liquidity ratio',
  solvency: 'Solvency ratio',
  profitability: 'Profitability ratio',
  efficiency: 'Efficiency ratio',
};

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2,
});
/** ₹ with Indian grouping; zero shows as ₹0.00 so the arithmetic reads cleanly. */
const inr = (n: number) => inrFmt.format(Math.abs(n) < 0.005 ? 0 : n);
const plainNum = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const figure = (n: number, money: boolean) => (money ? inr(n) : plainNum(n));

interface Props {
  label: string;
  category: string;
  display: string;
  calc: RatioCalc;
  lines: ComponentLines | null;
  from: string;
  to: string;
  onClose: () => void;
}

export function RatioCalcModal({ label, category, display, calc, lines, from, to, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on open; Esc closes from anywhere.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Keep Tab / Shift+Tab inside the panel.
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = [...panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )];
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const op = calc.kind === 'percent' ? '÷' : '÷';
  const working = calc.quotient === null
    ? null
    : calc.kind === 'percent'
      ? `${figure(calc.numerator.total, calc.numerator.money)} ${op} ${figure(calc.denominator.total, calc.denominator.money)} × 100 = ${calc.quotient.toFixed(4)} %`
      : `${figure(calc.numerator.total, calc.numerator.money)} ${op} ${figure(calc.denominator.total, calc.denominator.money)} = ${calc.quotient.toFixed(4)}`;
  const roundingNote = calc.kind === 'days' ? 'rounded to the nearest day' : 'rounded to 2 decimals';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ratio-calc-title"
        onKeyDown={trapFocus}
        className="ca-modal-panel bg-white w-full max-w-[580px] max-h-[86vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3.5 border-b border-[var(--cream)]">
          <div className="min-w-0">
            <p className="eyebrow">{CATEGORY_LABEL[category] ?? 'Ratio'}</p>
            <h2 id="ratio-calc-title" className="mt-1.5 text-[16px] tracking-[0.045em] text-[var(--ink)]">{label}</h2>
            <p className="mt-1 text-[11.5px] text-[var(--ink-3)]">
              For <span className="font-mono tabular-nums">{from}</span> to <span className="font-mono tabular-nums">{to}</span>
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[var(--ink-3)] transition-colors duration-[160ms] hover:bg-[var(--cream-2)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex items-baseline justify-between gap-4 rounded-[12px] border border-[var(--sand)] bg-[var(--cream-2)] px-4 py-3">
            <span className="label-caps">Result</span>
            <span className="font-mono text-[26px] font-semibold leading-none tabular-nums text-[var(--ink)]">{display}</span>
          </div>

          <BlockView block={calc.numerator} lines={lines} />
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--sand)]" />
            <span className="font-mono text-[15px] text-[var(--ink-3)]">÷</span>
            <span className="h-px flex-1 bg-[var(--sand)]" />
          </div>
          <BlockView block={calc.denominator} lines={lines} />

          <div className="rounded-[12px] border border-[var(--sand)] px-4 py-3">
            <p className="label-caps">Working</p>
            {working ? (
              <>
                <p className="mt-2 font-mono text-[14px] tabular-nums text-[var(--ink)] [overflow-wrap:anywhere]">{working}</p>
                <p className="mt-1.5 text-[11.5px] text-[var(--ink-3)]">
                  Shown as <span className="font-mono tabular-nums text-[var(--ink-2)]">{display}</span> — {roundingNote}.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-[var(--ink-2)]">{calc.unavailable}</p>
            )}
          </div>

          {calc.closingForAverage && (
            <p className="text-[11.5px] leading-relaxed text-[var(--ink-3)]">
              Period-end balances are used here — no previous-period balances are supplied to average with.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockView({ block, lines }: { block: CalcBlock; lines: ComponentLines | null }) {
  const multi = block.parts.length > 1;
  return (
    <section>
      <p className="label-caps">{block.title}</p>
      <ul className="mt-2 rounded-[12px] border border-[var(--sand)] bg-white">
        {block.parts.map((part, i) => (
          <PartRow key={`${part.label}-${i}`} part={part} lines={lines} first={i === 0} />
        ))}
        {multi && (
          <li className="flex items-baseline justify-between gap-4 border-t-[1.5px] border-[var(--sand-2)] bg-[var(--cream-2)] px-4 py-2.5 rounded-b-[12px]">
            <span className="text-[13px] font-bold text-[var(--ink)]">{block.title}</span>
            <span className="font-mono text-[14px] font-semibold tabular-nums text-[var(--ink)]">{figure(block.total, block.money)}</span>
          </li>
        )}
      </ul>
    </section>
  );
}

function PartRow({ part, lines, first }: { part: CalcPart; lines: ComponentLines | null; first: boolean }) {
  const [open, setOpen] = useState(false);
  const accounts = part.source && lines
    ? lines[part.source].filter(l => Math.abs(l.amount) >= 0.005).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    : [];
  const canExpand = accounts.length > 0;
  const sign = part.op ? (part.op === '−' ? '−' : '+') : null;

  return (
    <li className={first ? '' : 'border-t border-[var(--cream)]'}>
      <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
        <div className="min-w-0 flex items-baseline gap-2">
          <span className="w-3 shrink-0 font-mono text-[13px] text-[var(--ink-3)]" aria-hidden="true">{sign ?? ''}</span>
          <span className="text-[13px] text-[var(--ink-2)]">
            {sign === '−' && <span className="sr-only">less </span>}
            {part.label}
          </span>
          {canExpand && (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--navy)] transition-colors duration-[160ms] hover:bg-[var(--navy-soft)]"
            >
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
              <ChevronDown className={`h-3 w-3 transition-transform duration-[160ms] ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <span className="font-mono text-[14px] tabular-nums text-[var(--ink)] shrink-0">{figure(part.value, part.money)}</span>
      </div>
      {canExpand && open && (
        <ul className="mx-4 mb-2.5 max-h-56 overflow-y-auto rounded-[10px] bg-[var(--cream-2)] py-1">
          {accounts.map((a, i) => (
            <li key={`${a.account}-${i}`} className="flex items-baseline justify-between gap-4 px-3 py-1">
              <span className="min-w-0 text-[12px] text-[var(--ink-2)] [overflow-wrap:anywhere]">
                {a.account}
                <span className="ml-1.5 text-[10.5px] text-[var(--ink-3)]">{a.group}</span>
              </span>
              <span className="font-mono text-[12.5px] tabular-nums text-[var(--ink-2)] shrink-0">{inr(a.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
