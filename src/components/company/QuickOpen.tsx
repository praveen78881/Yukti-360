'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useEntityConfig } from '@/hooks/useEntityConfig';
import { Kbd, Keys } from '@/components/layout/ShortcutHelp';
import { prefetchRoute } from '@/lib/routePrefetch';
import {
  assignMnemonics, companyHref, isGoToKey, menuDestinations, searchDestinations, type Destination,
} from '@/lib/shortcuts';

interface GoToPaletteProps {
  open: boolean;
  companyId: string;
  /** This company's menu — the only pages Go to offers. */
  destinations: Destination[];
  onSelect: (d: Destination) => void;
  onClose: () => void;
  /** The "Keyboard shortcuts" link in the footer. */
  onShowHelp: () => void;
}

/** Go to (Ctrl/⌘ K): type to filter this company's menu, ↑/↓ to move, Enter to
 *  open, Esc to close. Each page's menu letter is shown beside it. A
 *  hand-rolled overlay in the app's modal pattern (veil + `ca-modal-panel`). */
export function GoToPalette({ open, ...rest }: GoToPaletteProps) {
  if (!open) return null;
  return createPortal(<GoToPanel {...rest} />, document.body);
}

function GoToPanel({ companyId, destinations, onSelect, onClose, onShowHelp }: Omit<GoToPaletteProps, 'open'>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigated = useRef(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const matches = useMemo(() => searchDestinations(destinations, query), [destinations, query]);
  const mnemonics = useMemo(() => assignMnemonics(destinations), [destinations]);
  const activeIndex = Math.min(active, matches.length - 1);
  const current: Destination | undefined = matches[activeIndex];

  // The field takes focus on open. Closed without going anywhere, focus goes
  // back where it was; after a jump it is left on the new page, so the next
  // shortcut works straight away.
  useEffect(() => {
    const returnFocus = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      if (!navigated.current && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, []);

  const select = (d: Destination) => {
    navigated.current = true;
    onSelect(d);
  };

  // Keep the highlighted row in view, and start loading its page meanwhile.
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    if (current) prefetchRoute(companyHref(companyId, current.path));
  }, [current, companyId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); // move the highlight, not the caret
      if (!matches.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((activeIndex + step + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (current) select(current);
    } else if (e.key === 'Escape') {
      e.stopPropagation(); // this Esc is Go to's alone
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault(); // the field is the only stop in here
    } else if (isGoToKey(e.nativeEvent)) {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[3px] flex items-start justify-center px-4 pt-[12vh] pb-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to a page"
        // Clicks inside keep the cursor in the field.
        onMouseDown={(e) => { if (e.target !== inputRef.current) e.preventDefault(); }}
        className="ca-modal-panel bg-white w-full max-w-[560px] max-h-[76vh] flex flex-col overflow-hidden"
      >
        <div className="px-4 pt-4 pb-3 border-b border-[var(--cream)]">
          <p className="eyebrow mb-2">Go to</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-3)]" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
              placeholder="Type a page name…"
              aria-label="Go to a page"
              role="combobox"
              aria-expanded="true"
              aria-controls="goto-list"
              aria-autocomplete="list"
              aria-activedescendant={current ? `goto-opt-${activeIndex}` : undefined}
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-[10px] border-[1.5px] border-[var(--sand)] bg-[var(--cream-2)] pl-9 pr-14 text-[14px] text-[var(--ink)] outline-none transition-[background-color,border-color,box-shadow] duration-[160ms] focus:border-[var(--slate-blue)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,69,127,0.12)]"
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><Kbd>Esc</Kbd></span>
          </div>
        </div>

        <ul
          ref={listRef}
          id="goto-list"
          role="listbox"
          aria-label="Pages"
          className={`flex-1 min-h-0 overflow-y-auto ${matches.length ? 'p-2' : ''}`}
        >
          {matches.map((d, i) => {
            const on = i === activeIndex;
            const key = mnemonics.get(d.path);
            return (
              <li
                key={d.path}
                id={`goto-opt-${i}`}
                role="option"
                aria-selected={on}
                onMouseMove={() => { if (!on) setActive(i); }}
                onClick={() => select(d)}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2 cursor-pointer transition-colors duration-[160ms] ${on ? 'bg-[var(--navy-soft)]' : ''}`}
              >
                <span className={`truncate text-[13.5px] font-semibold ${on ? 'text-[var(--navy)]' : 'text-[var(--ink-2)]'}`}>{d.label}</span>
                {d.section && (
                  <span className="hidden sm:inline shrink-0 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">{d.section}</span>
                )}
                <span className="flex-1" />
                {key && <Keys keys={key.keys} />}
              </li>
            );
          })}
        </ul>
        {matches.length === 0 && (
          <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-3)]">
            No page in this company&rsquo;s menu matches &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--cream)] text-[11.5px] text-[var(--ink-3)]">
          <span className="inline-flex items-center gap-1.5"><Keys keys={['↑', '↓']} /> move</span>
          <span className="inline-flex items-center gap-1.5"><Kbd>Enter</Kbd> open</span>
          <button
            type="button"
            onClick={onShowHelp}
            className="ml-auto rounded-[8px] px-2 py-1 text-[11.5px] font-semibold text-[var(--navy)] transition-colors duration-[160ms] hover:bg-[var(--navy-soft)]"
          >
            Keyboard shortcuts
          </button>
        </div>
      </div>
    </div>
  );
}

/* The inline search box the preserved dashboard (_dashboard-legacy.tsx) mounts.
   It offers the same pages as Go to — this company's menu, nothing it hides —
   and leaves Ctrl/⌘ K to Go to, which now owns that key everywhere. */
export function QuickOpen({ companyId }: { companyId: string }) {
  const navigate = useNavigate();
  const { company } = useCompany();
  const { config } = useEntityConfig();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const destinations = useMemo(
    () => (company && config ? menuDestinations(config.nav, company.entity_type) : []),
    [company, config],
  );
  const matches = useMemo(
    () => (query.trim() ? searchDestinations(destinations, query).slice(0, 8) : []),
    [destinations, query],
  );

  const go = (d: Destination) => {
    setQuery('');
    setOpen(false);
    navigate(companyHref(companyId, d.path));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && matches.length) { e.preventDefault(); go(matches[active] ?? matches[0]); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur(); }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search & open… try 'tall' → Tally, 'bal' → Balance Sheet, 'gst'…"
          className="w-full h-12 pl-11 pr-4 text-sm bg-white border border-gray-200 rounded-2xl shadow-[0_10px_30px_-16px_rgba(8,40,48,0.25)] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400 transition-colors"
        />
      </div>

      {open && matches.length > 0 && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-[0_28px_60px_-22px_rgba(8,40,48,0.30)] overflow-hidden py-1.5">
          {matches.map((d, i) => (
            <button
              key={d.path}
              // onMouseDown (not onClick) so it fires before the input's onBlur closes the list
              onMouseDown={(e) => { e.preventDefault(); go(d); }}
              onMouseEnter={() => setActive(i)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                i === active ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={`text-sm font-semibold truncate ${i === active ? 'text-blue-700' : 'text-gray-800'}`}>{d.label}</span>
                {d.section && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 shrink-0">{d.section}</span>}
              </span>
              {i === active
                ? <CornerDownLeft className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                : <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
