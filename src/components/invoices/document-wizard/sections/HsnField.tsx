/* One HSN / SAC cell, shared by the sales item rows and the purchase item row.
   It checks the format as you type (4, 6 or 8 digits) and asks the GST portal
   for matches: by code once three digits are in, or — while the code is still
   blank — by the item's description, so a code can be picked rather than
   remembered. Picking a match also fills an empty description with the
   portal's wording. The portal is a convenience only: offline, this is a plain
   validated input. */
import { useEffect, useRef, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { hsnSacProblem, searchHsnByCode, searchHsnByDescription, type HsnHit } from '@/lib/gst/hsnLookup';

interface HsnFieldProps {
  value: string;
  onChange: (code: string) => void;
  /** The item's description: searched while the code is blank, filled when empty. */
  description?: string;
  onSuggestDescription?: (description: string) => void;
  /** Set by the parent's save-time validation. */
  invalid?: boolean;
  ariaLabel: string;
}

const DEBOUNCE_MS = 450;
const MAX_HITS = 8;

/** The portal shouts goods descriptions in capitals; give them sentence case. */
function tidy(s: string): string {
  return s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s;
}

export function HsnField({ value, onChange, description, onSuggestDescription, invalid, ariaLabel }: HsnFieldProps) {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hits, setHits] = useState<HsnHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [matched, setMatched] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  /** The code just picked from the list — not looked up again until it changes. */
  const picked = useRef<string | null>(null);

  const digits = value.replace(/\D/g, '');
  const problem = hsnSacProblem(value);
  const showBad = !!invalid || (touched && problem !== null);
  const byDescription = digits.length < 3;

  // Look things up only while the cell has focus, after a pause in typing.
  useEffect(() => {
    if (!focused) return;
    const text = (description || '').trim();
    if (byDescription ? text.length < 3 : picked.current === digits) {
      setOpen(false);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      const found = byDescription
        ? await searchHsnByDescription(text, ctl.signal)
        : await searchHsnByCode(digits, ctl.signal);
      if (id !== requestId.current) return;
      setHits(found.slice(0, MAX_HITS));
      setActive(0);
      setOpen(found.length > 0);
      if (!byDescription) setMatched(found.find((h) => h.code === digits)?.description ?? null);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [digits, description, focused, byDescription]);

  // The rows scroll inside their card, so the list floats at viewport
  // coordinates; a scroll outside it or a resize closes it rather than letting
  // it drift away from the cell.
  useEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const r = inputRef.current?.getBoundingClientRect();
    if (r) setMenuPos({ top: r.bottom + 4, left: r.left });
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const pick = (h: HsnHit) => {
    picked.current = h.code;
    onChange(h.code);
    if (onSuggestDescription && !(description || '').trim()) onSuggestDescription(tidy(h.description));
    setMatched(h.description);
    setOpen(false);
    setTouched(true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(hits[active]);
    } else if (e.key === 'Escape') {
      // Closes the list only — the wizard's own Escape must not fire too.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="yk-hsn">
      <input
        ref={inputRef}
        aria-label={ariaLabel}
        className={`yk-in sm mono ${showBad ? 'bad' : ''}`}
        value={value}
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-invalid={showBad || undefined}
        title={showBad && problem ? problem : matched ? tidy(matched) : undefined}
        onChange={(e) => {
          setMatched(null);
          onChange(e.target.value.replace(/\D/g, '').slice(0, 8));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setTouched(true);
        }}
        onKeyDown={onKeyDown}
      />
      {showBad ? (
        <CircleAlert className="yk-hsn-bad" aria-hidden />
      ) : matched ? (
        <Check className="yk-hsn-ok" aria-hidden />
      ) : null}
      {open && menuPos && hits.length > 0 && (
        <div ref={menuRef} className="yk-hsn-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          {byDescription && <div className="yk-hsn-hint">Matches for “{(description || '').trim()}”</div>}
          <ul role="listbox" aria-label="HSN / SAC matches">
            {hits.map((h, i) => (
              <li
                key={h.code}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'on' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(h);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <b>{h.code}</b>
                <span>{tidy(h.description)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
