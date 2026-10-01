/* One HSN / SAC cell, shared by the sales item rows and the purchase item row.
   It checks the format as you type (4, 6 or 8 digits), asks the GST portal for
   matches — by code once three digits are in, or, while the code is still
   blank, by the item's description — and, once a code is complete, confirms
   with the portal that it exists: a well-formed code the portal does not know
   is flagged "Please enter a valid HSN number". Picking a match also fills an
   empty description with the portal's wording. The portal is a convenience:
   offline, this is a plain format-checked input. */
import { useEffect, useRef, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import {
  HSN_NOT_GENUINE, hsnSacProblem, hsnVerdict, isValidHsnSac,
  searchHsnByCode, searchHsnByDescription, verifyHsn, type HsnHit,
} from '@/lib/gst/hsnLookup';

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
  /** The portal's answer for the current code: true, false, or null (could not ask). */
  const [verdict, setVerdict] = useState<boolean | null | undefined>(undefined);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  /** The code just picked from the list — not looked up again until it changes. */
  const picked = useRef<string | null>(null);
  // Set on mount as well as cleared on unmount: in development React mounts,
  // unmounts and mounts again, and the ref must come back true.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const digits = value.replace(/\D/g, '');
  const problem = hsnSacProblem(value);
  // The save path may have asked the portal meanwhile (hsnVerdict), so read both.
  const notGenuine = problem === null && digits !== '' && (verdict === false || hsnVerdict(digits) === false);
  const showBad = !!invalid || (touched && problem !== null) || notGenuine;
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
      if (!byDescription) {
        setMatched(found.find((h) => h.code === digits)?.description ?? null);
        if (isValidHsnSac(digits)) setVerdict(hsnVerdict(digits));
      }
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
    setVerdict(true);
    setOpen(false);
    setTouched(true);
  };

  // Leaving the cell with a complete code asks the portal whether it exists.
  const onBlur = () => {
    setFocused(false);
    setTouched(true);
    if (!isValidHsnSac(digits)) return;
    verifyHsn(digits).then((v) => { if (alive.current) setVerdict(v); });
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

  const title = problem && touched ? problem
    : notGenuine ? HSN_NOT_GENUINE
    : matched ? tidy(matched)
    : undefined;

  return (
    <div ref={wrapRef} className="yk-hsn">
      <div className="yk-hsn-in">
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
        title={title}
        onChange={(e) => {
          setMatched(null);
          setVerdict(undefined);
          onChange(e.target.value.replace(/\D/g, '').slice(0, 8));
        }}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {showBad ? (
        <CircleAlert className="yk-hsn-bad" aria-hidden />
      ) : matched || verdict === true ? (
        <Check className="yk-hsn-ok" aria-hidden />
      ) : null}
      </div>
      {notGenuine && !open && (
        <span className="yk-hsn-msg" role="alert">{HSN_NOT_GENUINE}</span>
      )}
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
