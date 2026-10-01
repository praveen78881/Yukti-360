'use client';

/* ─────────────────────────────────────────────────────────────────────────────
   ItrFrame — hosts one Yukti ITR build, filling the content area edge to edge.

   The form owns everything: UI, computation, validation, JSON export/import.
   This component's whole job is the surround — restore the saved draft on
   load, seed identity from the company master, and debounce-autosave the
   form's own `S` state back into entity_data. It never touches tax logic.

   Sizing: width comes free (the layout's <main> is flex-1, so collapsing the
   sidebar reflows it). Height is measured from the iframe's own top edge to
   the viewport bottom, which self-corrects whether or not the tab strip is
   present and survives window resizes. The negative margins cancel <main>'s
   p-4 so the form sits flush against the app chrome.
   ──────────────────────────────────────────────────────────────────────────── */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Company } from '@/types/company';
import { itrSrc, ITR_META, type ItrKey } from '../lib/itrForms';
import { loadSnapshot, saveSnapshot } from '../lib/itrPersistence';
import { prefillFromCompany } from '../lib/itrPrefill';
import { isReady, readState, writeState } from '../lib/itrBridge';
import { ItrTabs } from './ItrTabs';

const AUTOSAVE_MS = 1500;
const BOOT_POLL_MS = 150;
const BOOT_TIMEOUT_MS = 15000;
const MIN_HEIGHT = 320;

interface Props {
  companyId: string;
  company: Company;
  itrKey: ItrKey;
  forms: ItrKey[];
  onSelect: (k: ItrKey) => void;
}

export function ItrFrame({ companyId, company, itrKey, forms, onSelect }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef<ReturnType<typeof setTimeout> | null>(null);
  const booted = useRef(false);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [flash, setFlash] = useState<string | null>(null);

  /* ---- fill the remaining viewport height, and keep filling it ---- */
  useLayoutEffect(() => {
    const measure = () => {
      const el = frameRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setHeight(Math.max(MIN_HEIGHT, Math.round(window.innerHeight - top)));
    };
    measure();
    window.addEventListener('resize', measure);
    // the sidebar/Aleza panel animate their width; re-measure as the box settles
    const ro = new ResizeObserver(measure);
    const host = frameRef.current?.parentElement?.parentElement;
    if (host) ro.observe(host);
    const t = window.setTimeout(measure, 350);
    return () => { window.removeEventListener('resize', measure); ro.disconnect(); clearTimeout(t); };
  }, [forms.length]);

  const say = useCallback((msg: string) => {
    setFlash(msg);
    if (fade.current) clearTimeout(fade.current);
    fade.current = setTimeout(() => setFlash(null), 2200);
  }, []);

  const flush = useCallback(() => {
    if (!booted.current) return;
    const state = readState(frameRef.current);
    if (!state) return;
    saveSnapshot(companyId, itrKey, state);
    say('Saved');
  }, [companyId, itrKey, say]);

  const onLoad = useCallback(() => {
    booted.current = false;
    const started = Date.now();

    /* The build paints on DOMContentLoaded; poll until `S` exists rather than
       guessing a fixed delay. */
    const wait = window.setInterval(() => {
      const frame = frameRef.current;
      if (!isReady(frame)) {
        if (Date.now() - started > BOOT_TIMEOUT_MS) {
          window.clearInterval(wait);
          say('Form did not initialise');
        }
        return;
      }
      window.clearInterval(wait);
      booted.current = true;

      const snap = loadSnapshot(companyId, itrKey);
      const restored = snap ? writeState(frame, snap.state) : 0;
      const filled = prefillFromCompany(frame, company);
      if (restored) say('Draft restored');
      else if (filled) say(`Prefilled ${filled} field${filled === 1 ? '' : 's'}`);

      const doc = frame?.contentDocument;
      if (!doc) return;
      const onEdit = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, AUTOSAVE_MS);
      };
      doc.addEventListener('input', onEdit, true);
      doc.addEventListener('change', onEdit, true);
      doc.addEventListener('click', onEdit, true);   // grid +Add / delete rows
    }, BOOT_POLL_MS);
  }, [companyId, company, itrKey, flush, say]);

  // flush a pending edit when switching forms or leaving the page
  useEffect(() => () => {
    if (timer.current) { clearTimeout(timer.current); flush(); }
  }, [flush]);

  return (
    /* -m-4 cancels <main>'s p-4 on all four sides so the form sits flush
       against the header, with no gap above the Yukti title bar */
    <div className="-m-4 relative">
      <ItrTabs forms={forms} active={itrKey} onSelect={onSelect} />
      <iframe
        ref={frameRef}
        key={itrKey}
        src={itrSrc(itrKey)}
        onLoad={onLoad}
        title={`${ITR_META[itrKey].label} — A.Y. 2026-27`}
        style={{ height }}
        className="block w-full border-0 bg-white"
      />
      {flash && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md
                        bg-slate-900/80 text-white text-[11px] font-medium shadow-lg">
          {flash}
        </div>
      )}
    </div>
  );
}
