import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { GO_TO_KEYS, assignMnemonics, isGoToKey, type Destination } from '@/lib/shortcuts';

/** One key cap — a small cream chip with a sand hairline. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-[var(--sand)] bg-[var(--cream)] px-1.5 font-mono text-[10.5px] font-semibold leading-none text-[var(--ink-2)] shadow-[inset_0_-1px_0_var(--sand)]">
      {children}
    </kbd>
  );
}

/** The keys of one shortcut, side by side — a chord (Ctrl K) or a single key. */
export function Keys({ keys }: { keys: readonly string[] }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {keys.map((k, i) => <Kbd key={i}>{k}</Kbd>)}
    </span>
  );
}

interface Row { label: string; keys: readonly string[] }

interface ShortcutHelpProps {
  open: boolean;
  /** This company's menu — only the jumps it allows are listed. */
  destinations: Destination[];
  onClose: () => void;
  /** Ctrl/⌘ K pressed over the list — swap it for Go to. */
  onGoTo: () => void;
}

/** "?" — every shortcut, in the app's modal pattern: globals.css turns the
 *  `fixed inset-0 bg-black/…` wrapper into the navy veil and `ca-modal-panel`
 *  into the 14px panel with the navy top strip. */
export function ShortcutHelp({ open, ...rest }: ShortcutHelpProps) {
  if (!open) return null;
  return createPortal(<HelpPanel {...rest} />, document.body);
}

function HelpPanel({ destinations, onClose, onGoTo }: Omit<ShortcutHelpProps, 'open'>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Held in refs so an inline callback from the parent doesn't re-run the open
  // effect (and steal focus back) on every render.
  const onCloseRef = useRef(onClose);
  const onGoToRef = useRef(onGoTo);
  useEffect(() => { onCloseRef.current = onClose; onGoToRef.current = onGoTo; });

  // Focus Close on open and hand focus back after. Esc or ? closes; Ctrl/⌘ K
  // goes straight to Go to.
  useEffect(() => {
    const returnFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); }
      else if (e.key === '?') { e.preventDefault(); onCloseRef.current(); }
      else if (isGoToKey(e)) { e.preventDefault(); onGoToRef.current(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, []);

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

  const general: Row[] = [
    { label: 'Go to any page', keys: GO_TO_KEYS },
    { label: 'Search the menu', keys: ['/'] },
    { label: 'Show these shortcuts', keys: ['?'] },
  ];
  const inGoTo: Row[] = [
    { label: 'Move up and down', keys: ['↑', '↓'] },
    { label: 'Open the page', keys: ['Enter'] },
    { label: 'Close', keys: ['Esc'] },
  ];
  // The menu's highlighted letters, in menu order — the same assignment the
  // Sidebar shows and the key handler uses.
  const mnemonics = useMemo(() => assignMnemonics(destinations), [destinations]);
  const jumps: Row[] = destinations.flatMap((d) => {
    const m = mnemonics.get(d.path);
    return m ? [{ label: d.label, keys: m.keys }] : [];
  });

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
        onKeyDown={trapFocus}
        className="ca-modal-panel bg-white w-full max-w-[640px] max-h-[86vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3.5 border-b border-[var(--cream)]">
          <div className="min-w-0">
            <p className="eyebrow">Keyboard</p>
            <h2 id="shortcut-help-title" className="mt-1.5 text-[16px] tracking-[0.045em] text-[var(--ink)]">Shortcuts</h2>
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

        <div className="overflow-y-auto px-5 py-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div className="space-y-5">
            <Section title="Anywhere in a company" rows={general} />
            <Section title="In Go to" rows={inGoTo} />
          </div>
          <Section title="Jump · the highlighted letter in the menu" rows={jumps} />
        </div>

        <p className="px-5 py-3 border-t border-[var(--cream)] text-[11.5px] text-[var(--ink-3)]">
          Where pages share a letter, the second takes Ctrl + letter and the third Shift + letter.
          Single-key shortcuts pause while you type in a field.
        </p>
      </div>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section>
      <h3 className="label-caps">{title}</h3>
      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4 py-1.5 border-t border-[var(--cream)] first:border-t-0">
            <span className="text-[13px] text-[var(--ink-2)]">{r.label}</span>
            <Keys keys={r.keys} />
          </li>
        ))}
      </ul>
    </section>
  );
}
