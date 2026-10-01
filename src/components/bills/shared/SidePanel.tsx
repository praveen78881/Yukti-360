import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  /** Small caps line above the heading, e.g. "Bill". */
  eyebrow?: string;
  /** Main heading, e.g. the bill number. */
  heading: ReactNode;
  /** Optional element right of the heading (a status chip). */
  headingAside?: ReactNode;
  children: ReactNode;
}

/** Right-hand detail drawer, portalled to <body> (so no transformed ancestor
    can trap it). Navy-tinted veil, lifted shadow, slides in over 280ms,
    Esc closes, focus moves to the close button and returns on close.
    Deliberately NOT a `.ca-modal-panel` — that class styles centred modals. */
export function SidePanel({ open, onClose, eyebrow, heading, headingAside, children }: SidePanelProps) {
  const [shown, setShown] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  // Held in a ref so an inline `onClose={() => …}` from the page doesn't
  // re-run the open effect every render (which would keep stealing focus).
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeRef.current?.focus();
    });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      setShown(false);
      returnFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-[rgba(10,31,62,0.32)] backdrop-blur-[2px] transition-opacity duration-[280ms]"
        style={{ opacity: shown ? 1 : 0 }}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof heading === 'string' ? heading : eyebrow ?? 'Details'}
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-[var(--sand)] bg-white shadow-[var(--shadow-lift)] transition-transform duration-[280ms]"
        style={{ transform: shown ? 'translateX(0)' : 'translateX(24px)', transitionTimingFunction: 'cubic-bezier(0.2,0.8,0.3,1)' }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--cream)] px-5 py-4" style={{ boxShadow: 'inset 0 3px 0 var(--navy)' }}>
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[16px]">{heading}</h2>
              {headingAside}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[var(--ink-3)] transition-colors duration-[160ms] hover:bg-[var(--cream-2)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

/** A label/value pair for the drawer body. */
export function DetailField({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <div className={`mt-1 text-[12.5px] font-semibold text-[var(--ink)] ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

/** One line of the drawer's money breakdown (label left, amount right). */
export function MoneyLine({ label, value, tone = 'ink', strong }: { label: string; value: string; tone?: 'ink' | 'muted' | 'bad' | 'ok'; strong?: boolean }) {
  const color = { ink: 'text-[var(--ink)]', muted: 'text-[var(--ink-2)]', bad: 'text-[var(--bad)]', ok: 'text-[var(--ok)]' }[tone];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-[12px] ${strong ? 'font-bold text-[var(--ink)]' : 'text-[var(--ink-2)]'}`}>{label}</span>
      <span className={`font-mono tabular-nums ${strong ? 'text-[14px] font-bold' : 'text-[12px] font-semibold'} ${color}`}>{value}</span>
    </div>
  );
}
