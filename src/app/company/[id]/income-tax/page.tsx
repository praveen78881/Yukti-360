'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { ENTITY_TYPES } from '@/lib/constants/entityTypes';
import type { EntityType, Company } from '@/types/company';
import { getEntityData, upsertEntityData, listJournalEntries } from '@/lib/offlineDb';
import { buildAisCsvFromBooks, downloadAisCsv } from '@/lib/accounting/aisExport';
import type { JournalEntry } from '@/lib/accounting/computeEngine';
import {
  Calculator, FileText, CheckCircle, Shield, Lock, LockKeyhole,
  Save, FileDown, MoreVertical, Cloud, FolderInput, ShieldCheck,
  Highlighter, X, AlertTriangle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImportItrModal, type ImportMode } from '@/components/itr/ImportItrModal';
import {
  validateItrInFrame, downloadItrJson, highlightItrFields, kebabifyDrillins, closeTopDrillin,
  extractItrJson,
  type ItrValResult,
} from '@/lib/itr/client';
import { setBackInterceptor } from '@/lib/appBack';
import { getMandatoryChecker, isFormReleased } from '@/lib/itr/mandatory';

/* ─────────────────────────────────────────────────────────────────────────────
   ITR filing module — year-wise (A.Y. 2026-27 and A.Y. 2025-26)

   The ITR-1 / ITR-2 / ITR-3 / ITR-4 forms are self-contained data-entry tools
   (each embeds its own tax computation + AIS import) served from
   /public/tax-utilities/, one HTML per (form, assessment year). The user picks the
   assessment year; because they are same-origin iframes we integrate the
   company/backend data by driving the iframe DOM directly on load:
     1. restore any previously-saved ITR field state (entity_data → Supabase mirror)
     2. prefill empty assessee-master fields from the company record
     3. debounced autosave of every field back into entity_data (auto-synced)
   Each assessment year saves under its own entity_data `module` key (see AY_LIST),
   so returns for different years never overwrite one another.
   ──────────────────────────────────────────────────────────────────────────── */

/** Assessment years the ITR module ships forms for, newest first. Each maps to its
 *  financial year and the entity_data `module` key its saved snapshots live under —
 *  so every year's return is stored (and cloud-synced) independently. */
const AY_LIST = [
  { ay: '2026-27', fy: '2025-26', module: 'itr_ay2627' },
  { ay: '2025-26', fy: '2024-25', module: 'itr_ay2526' },
] as const;

type ItrKey = 'itr1' | 'itr2' | 'itr3' | 'itr4' | 'itr5' | 'itr6' | 'itr7';

/** Served form path for a given assessment year. AY 2026-27 keeps the original flat
 *  filenames; other years use a year-suffixed copy in the same /tax-utilities folder.
 *  The statutory forms (ITR-5 / ITR-6 / ITR-7) ship for A.Y. 2026-27 only, so they
 *  always resolve to the flat filename regardless of the requested year. */
function itrSrc(ay: string, key: ItrKey): string {
  if (key === 'itr5' || key === 'itr6' || key === 'itr7') return `/tax-utilities/${key}.html`;
  return ay === '2026-27' ? `/tax-utilities/${key}.html` : `/tax-utilities/${key}-${ay}.html`;
}

/** Assessment years an actual data-entry tool is BUILT for. ITR-1..4 ship a
 *  year-suffixed AY 2025-26 copy; ITR-5/6/7 ship a single file that emits
 *  AssessmentYear 2026 — i.e. an A.Y. 2026-27 build with no 2025-26 variant.
 *  Serving the 2026-27 tool under a 2025-26 selection would silently produce a
 *  return stamped with the wrong assessment year, so we surface it instead. */
const TOOL_YEARS: Record<ItrKey, string[]> = {
  itr1: ['2026-27', '2025-26'],
  itr2: ['2026-27', '2025-26'],
  itr3: ['2026-27', '2025-26'],
  itr4: ['2026-27', '2025-26'],
  itr5: ['2026-27'],
  itr6: ['2026-27'],
  itr7: ['2026-27'],
};

/** True when a data-entry tool actually exists for this (form, assessment year). */
function hasToolFor(key: ItrKey, ay: string): boolean {
  return TOOL_YEARS[key].includes(ay);
}

const ITR_META: Record<ItrKey, { label: string; short: string; note: string }> = {
  itr1: { label: 'ITR-1 Sahaj', short: 'ITR-1', note: 'Salary, one house property & other sources (income ≤ ₹50L)' },
  itr2: { label: 'ITR-2', short: 'ITR-2', note: 'Capital gains, multiple properties & foreign assets — no business income' },
  itr3: { label: 'ITR-3', short: 'ITR-3', note: 'Income from business or profession (regular books)' },
  itr4: { label: 'ITR-4 Sugam', short: 'ITR-4', note: 'Presumptive business/profession u/s 44AD / 44ADA / 44AE' },
  itr5: { label: 'ITR-5', short: 'ITR-5', note: 'Firms, LLPs, AOP/BOI & co-operative societies' },
  itr6: { label: 'ITR-6', short: 'ITR-6', note: 'Companies (other than those claiming exemption u/s 11)' },
  itr7: { label: 'ITR-7', short: 'ITR-7', note: 'Trusts, societies & institutions filing u/s 139(4A)–(4D)' },
};

/** Applicable ITR forms per entity type for A.Y. 2026-27. Individual-style entities
 *  get the multi-year, multi-form workspace (ITR-1..4). */
const ENTITY_FORMS: Partial<Record<EntityType, ItrKey[]>> = {
  individual: ['itr1', 'itr2'],
  sole_proprietorship: ['itr3', 'itr4'],
  // A HUF may also file ITR-4 (Sugam) when opting for presumptive income u/s 44AD/44ADA/44AE.
  huf: ['itr2', 'itr3', 'itr4'],
};

/** Statutory single-form entities → the one A.Y. 2026-27 form they file.
 *  Firms/LLP/AOP/Co-op → ITR-5, companies → ITR-6, non-profits → ITR-7.
 *  Keyed by EntityType so an invalid key is a compile error and a newly-added
 *  entity type surfaces a missing mapping. */
const STATUTORY_ITR: Partial<Record<EntityType, ItrKey>> = {
  partnership: 'itr5',
  llp: 'itr5',
  aop_boi: 'itr5',
  cooperative: 'itr5',
  pvt_ltd: 'itr6',
  opc: 'itr6',
  public_ltd: 'itr6',
  trust: 'itr7',
  society: 'itr7',
  section8: 'itr7',
};

/** Locked-screen fallback label for any entity type without a shipped form. */
const ENTITY_ITR_MAP: Partial<Record<EntityType, string>> = {
  partnership: 'ITR-5',
  llp: 'ITR-5',
  aop_boi: 'ITR-5',
  cooperative: 'ITR-5',
  trust: 'ITR-7',
  society: 'ITR-7',
  section8: 'ITR-7',
};

/* ── DOM bridge helpers (run against the same-origin iframe window) ──────────── */

/** Normalise a stored date (ISO / dd-mm-yyyy / dd/mm/yyyy) to DD/MM/YYYY.
 *  Returns undefined for unrecognised formats so we never feed the form's
 *  DD/MM/YYYY date fields a value it would garble. */
function toDDMMYYYY(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim();
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);      // already DD/MM/YYYY
  if (m) return s;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);             // ISO YYYY-MM-DD[...]
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);            // DD-MM-YYYY
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  return undefined;
}

function fireInputChange(win: Window, el: Element) {
  const EventCtor = (win as unknown as { Event: typeof Event }).Event;
  el.dispatchEvent(new EventCtor('input', { bubbles: true }));
  el.dispatchEvent(new EventCtor('change', { bubbles: true }));
}

function setIfEmpty(win: Window, id: string, val?: string | null) {
  if (val == null || val === '') return;
  const el = win.document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  if (!el) return;

  // <select> defaults to its first option (a truthy value like "Individual"), so the
  // plain "already has a value" guard would never let us switch it. Treat a select that
  // is still on its first option as unset, and only apply a value that is a real option.
  if (el instanceof (win as unknown as { HTMLSelectElement: typeof HTMLSelectElement }).HTMLSelectElement) {
    const sel = el as HTMLSelectElement;
    if (sel.value !== (sel.options[0]?.value ?? '')) return; // user/restore already chose
    const opt = Array.from(sel.options).find((o) => o.value === val || o.text === val);
    if (!opt) return;
    sel.value = opt.value;
    fireInputChange(win, sel);
    return;
  }

  if ((el as HTMLInputElement).value) return; // never clobber existing/restored data
  (el as HTMLInputElement).value = String(val);
  fireInputChange(win, el);
}

/** Prefill assessee-master fields from the company record (only where empty). */
function prefillFromCompany(win: Window, company: Company) {
  const ed = company.entity_details || {};
  const isHuf = company.entity_type === 'huf';
  const pan = (ed.pan || '').toUpperCase();
  const status = isHuf ? 'HUF' : 'Individual';
  const dob = toDDMMYYYY(ed.dob);

  // Universal client fields (present in every form incl. ITR-4 Sugam)
  setIfEmpty(win, 'cl_name', company.name);
  setIfEmpty(win, 'cl_pan', pan);
  setIfEmpty(win, 'cl_dob', dob);
  // Statutory forms (ITR-5/7) call the formation-date field `cl_dof`; harmless no-op
  // on the individual forms (which use cl_dob). setIfEmpty skips absent ids.
  setIfEmpty(win, 'cl_dof', dob);
  setIfEmpty(win, 'cl_status', status);

  // Full assessee master (ITR-1 / ITR-2 / ITR-3)
  setIfEmpty(win, 'asr_name', company.name);
  setIfEmpty(win, 'asr_pan', pan);
  setIfEmpty(win, 'asr_status', status);
  setIfEmpty(win, 'asr_dob', dob);
  setIfEmpty(win, 'asr_flat', ed.address);
  setIfEmpty(win, 'asr_city', ed.city);
  setIfEmpty(win, 'asr_state', ed.state);
  setIfEmpty(win, 'asr_pin', ed.pincode);
  setIfEmpty(win, 'asr_mobile', ed.phone);
  setIfEmpty(win, 'asr_email', ed.email);
  setIfEmpty(win, 'asr_aadhaar', ed.aadhaar);

  // Verifier — Karta signs for a HUF
  setIfEmpty(win, 'vfr_name', isHuf ? (ed.kartaName || company.name) : company.name);
  setIfEmpty(win, 'vfr_pan', pan);
}

const SKIP_TYPES = new Set(['button', 'submit', 'file', 'reset', 'image']);

/** Snapshot every identifiable, editable field in the form. */
function collectFields(doc: Document): Record<string, string> {
  const out: Record<string, string> = {};
  doc.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')
    .forEach((el) => {
      const inp = el as HTMLInputElement;
      if (!el.id || inp.readOnly || inp.disabled || SKIP_TYPES.has(inp.type)) return;
      if (inp.type === 'checkbox' || inp.type === 'radio') out[el.id] = inp.checked ? '1' : '0';
      else out[el.id] = el.value;
    });
  return out;
}

/** Re-apply a saved snapshot to the form (overwrites, firing input/change). */
function applyFields(win: Window, fields: Record<string, string>) {
  const doc = win.document;
  const EventCtor = (win as unknown as { Event: typeof Event }).Event;
  for (const [id, val] of Object.entries(fields)) {
    const el = doc.getElementById(id) as HTMLInputElement | null;
    if (!el || el.readOnly || el.disabled) continue;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = val === '1';
    else el.value = val;
    el.dispatchEvent(new EventCtor('input', { bubbles: true }));
    el.dispatchEvent(new EventCtor('change', { bubbles: true }));
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   New A.Y. 2026-27 view — individual, sole proprietor, HUF
   ═══════════════════════════════════════════════════════════════════════════ */

function IndividualItrView({ company, forms }: { company: Company; forms: ItrKey[] }) {
  // Selected assessment year drives which forms load and which module data saves under.
  const [ay, setAy] = useState<string>(AY_LIST[0].ay);
  const meta = AY_LIST.find((y) => y.ay === ay) ?? AY_LIST[0];
  const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label ?? company.entity_type;

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col">
      {/* Header strip with the A.Y. selector */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-800">Income Tax</span>
          <span className="text-xs text-gray-400 truncate">· FY {meta.fy} · {entityLabel}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <span className="text-gray-400">Assessment Year</span>
            <select
              value={ay}
              onChange={(e) => setAy(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-700 focus:border-blue-400 focus:outline-none"
              title="Choose the assessment year to file"
            >
              {AY_LIST.map((y) => (
                <option key={y.ay} value={y.ay}>A.Y. {y.ay}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Per-year workspace. key={ay} forces a clean remount on year change, so the old
          year's pending autosaves flush under the correct module before the next mounts. */}
      <ItrYearForms key={ay} company={company} forms={forms} ay={ay} moduleKey={meta.module} />
    </div>
  );
}

/* Per-assessment-year form workspace: owns tab state and the debounced autosave/restore
   for ONE year. All persistence is keyed by `moduleKey`, so switching years never mixes
   returns. Remounted by the parent (key={ay}) whenever the year changes. */
function ItrYearForms({
  company, forms, ay, moduleKey,
}: { company: Company; forms: ItrKey[]; ay: string; moduleKey: string }) {
  const companyId = company.id;
  const [active, setActive] = useState<ItrKey>(forms[0]);
  // Lazy-mount iframes: only load a form once its tab is first opened.
  const [mounted, setMounted] = useState<Set<ItrKey>>(() => new Set([forms[0]]));
  // Frames stay hidden until onFrameLoad has hidden the tool's own action buttons —
  // otherwise "Import AIS" / "Export JSON" flash for a moment on first open.
  const [frameReady, setFrameReady] = useState<Set<ItrKey>>(new Set());
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [validatedKey, setValidatedKey] = useState<ItrKey | null>(null); // form that last passed validation
  const [valResult, setValResult] = useState<(ItrValResult & { key: ItrKey }) | null>(null); // drives the failure popup
  const winRefs = useRef<Partial<Record<ItrKey, Window>>>({});
  const timers = useRef<Partial<Record<ItrKey, number>>>({});
  const mountedRef = useRef(true);

  const openForm = (key: ItrKey) => {
    setActive(key);
    setMounted((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  };

  const pan = (company.entity_details?.pan || '').toUpperCase();

  /** Run the form's own validator PLUS the official schema-driven mandatory-field
   *  check for this exact (form, assessment year). Validation passes only when the
   *  in-form checks are clean AND every mandatory field per the ITD schema/rules is
   *  filled — until then Download JSON stays locked. */
  const doValidate = async (key: ItrKey) => {
    setMenuOpen(false);
    saveForm(key);
    const win = winRefs.current[key];
    const res = validateItrInFrame(win, key);
    if (!res.ran) { toast.error(res.error || 'This form has no validator yet.'); return; }

    // Official mandatory-field layer — built from the ITD schema + validation
    // rules for this form-year (src/lib/itr/mandatory/*).
    const mandatory: { slno: string; msg: string }[] = [];
    let mandatoryWarnings: { slno: string; msg: string }[] = [];
    try {
      const checker = await getMandatoryChecker(key, ay);
      if (checker) {
        const ext = extractItrJson(win, key);
        if (ext.ok && ext.json) {
          const rep = checker(ext.json);
          mandatory.push(
            ...rep.missing.map((m) => ({ slno: '', msg: `Mandatory field not filled: ${m.label}${m.hint ? ` (${m.hint})` : ''} — ${m.path}` })),
            ...rep.errors.map((e) => ({ slno: e.rule ?? '', msg: e.msg })),
          );
          mandatoryWarnings = rep.warnings.map((w) => ({ slno: w.rule ?? '', msg: w.msg }));
        }
      }
    } catch { /* mandatory layer is additive — never block the base validation */ }

    const allErrors = [...res.errors, ...mandatory];
    const allWarnings = [...res.warnings, ...mandatoryWarnings];
    highlightItrFields(win, res.errors, highlight);
    if (allErrors.length === 0) {
      setValidatedKey(key);
      setValResult(null);
      toast.success(allWarnings.length ? `Validation passed (${allWarnings.length} warning(s)). JSON ready to download.` : 'Validation passed — all mandatory fields are filled. JSON ready to download.');
    } else {
      setValidatedKey((k) => (k === key ? null : k));
      setValResult({ ...res, errors: allErrors, warnings: allWarnings, key });
      toast.error(`${allErrors.length} validation error(s) — fill the mandatory details and re-validate.`);
    }
  };

  /** Download the ITR JSON — only after a clean validation, and only for form-years
   *  the government has actually released. */
  const doDownload = (key: ItrKey) => {
    setMenuOpen(false);
    if (!isFormReleased(key, ay)) {
      toast.error(`${ITR_META[key].short} for A.Y. ${ay} is not yet released by the government — the ITR JSON cannot be downloaded.`);
      return;
    }
    if (!hasToolFor(key, ay)) {
      toast.error(`No A.Y. ${ay} form exists for ${ITR_META[key].short} — the JSON would be stamped A.Y. ${TOOL_YEARS[key][0]}.`);
      return;
    }
    if (validatedKey !== key) { toast.error('Validate the return first — download unlocks once it passes.'); return; }
    const r = downloadItrJson(winRefs.current[key], key, pan, ay);
    if (r.ok) toast.success('ITR JSON downloaded — ready to upload on the portal.');
    else toast.error(r.error || 'Could not build the JSON.');
  };

  const toggleHighlight = () => {
    const next = !highlight;
    setHighlight(next);
    // Re-apply against the last failure set (or clear) immediately for feedback.
    if (valResult && valResult.key === active) highlightItrFields(winRefs.current[active], valResult.errors, next);
  };

  const saveForm = useCallback((key: ItrKey) => {
    const win = winRefs.current[key];
    if (!win) return;
    try {
      const current = collectFields(win.document);
      // Merge over the previous snapshot: dynamically-added rows (extra bank accounts,
      // capital-gains rows, …) may not exist in the DOM at this moment, so a plain
      // overwrite would silently erase them from storage and the Supabase mirror. Merging
      // keeps any previously-captured keys that aren't currently present.
      const prev = (getEntityData(companyId, moduleKey, key)?.data as { fields?: Record<string, string> } | undefined)?.fields;
      const fields = prev ? { ...prev, ...current } : current;
      upsertEntityData(companyId, moduleKey, key, { fields, savedAt: new Date().toISOString(), ay });
      if (mountedRef.current) setSavedAt(new Date());
    } catch { /* ignore */ }
  }, [companyId, moduleKey, ay]);

  const onFrameLoad = useCallback((key: ItrKey, el: HTMLIFrameElement) => {
    let win: Window | null = null;
    try { win = el.contentWindow; } catch { return; }
    if (!win) return;
    winRefs.current[key] = win;

    // 0) hide the tool's own in-page action buttons — all import/export/validate now
    //    live in the shell's ⋮ menu, so the CA sees one consistent control surface.
    try {
      const d = win.document;
      const STYLE_ID = '__itr_hide_native';
      if (!d.getElementById(STYLE_ID)) {
        const s = d.createElement('style');
        s.id = STYLE_ID;
        // Every tool's own action buttons. ITR-1..4 use #exportJsonBtn/#importAisBtn,
        // ITR-5 uses #exportBtn, ITR-6/7 use #btnExport/#btnValidate — all must be
        // hidden or the tool's toolbar competes with the shell's ⋮ menu.
        s.textContent = '#exportJsonBtn,#importAisBtn,#exportBtn,#backBtn,#btnExport,#btnValidate{display:none!important;}';
        d.head.appendChild(s);
      }
    } catch { /* cross-origin/timing — ignore */ }

    // 0b) collapse each drill-in's action buttons into a ⋮ menu (matches the shell toolbar).
    try { kebabifyDrillins(win); } catch { /* ignore */ }

    // 1) restore saved snapshot, 2) prefill empty fields from company master
    try {
      const rec = getEntityData(companyId, moduleKey, key);
      const saved = rec?.data as { fields?: Record<string, string> } | undefined;
      if (saved?.fields) applyFields(win, saved.fields);
    } catch { /* ignore */ }
    try { prefillFromCompany(win, company); } catch { /* ignore */ }

    // 3) debounced autosave on any edit. The timer entry is deleted once it fires so
    //    `timers.current` only ever holds genuinely-pending saves.
    try {
      const handler = () => {
        window.clearTimeout(timers.current[key]);
        timers.current[key] = window.setTimeout(() => {
          delete timers.current[key];
          saveForm(key);
        }, 1500);
      };
      win.document.addEventListener('input', handler, true);
      win.document.addEventListener('change', handler, true);
    } catch { /* ignore */ }

    // Native buttons are hidden and state restored — safe to reveal the frame.
    setFrameReady((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, [company, companyId, moduleKey, saveForm]);

  // Shell Back button: while a drill-in is open in the active form, Back closes
  // that drill-in (one level per press, like the portal) instead of leaving the page.
  useEffect(() => setBackInterceptor(() => closeTopDrillin(winRefs.current[active])), [active]);

  // Flush only genuinely-pending autosaves on unmount (keys still holding a live timer).
  useEffect(() => {
    mountedRef.current = true; // reset on (re)mount — StrictMode runs setup twice
    const t = timers.current;
    const refs = winRefs.current;
    return () => {
      mountedRef.current = false;
      for (const key of Object.keys(t) as ItrKey[]) {
        if (t[key] == null) continue;
        window.clearTimeout(t[key]);
        delete t[key];
        if (refs[key]) saveForm(key);
      }
    };
  }, [saveForm]);

  return (
    <>
      {/* Form switcher */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex gap-1 overflow-x-auto">
          {forms.map((key) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => openForm(key)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                {ITR_META[key].label}
              </button>
            );
          })}
        </div>
        <div className="relative flex items-center gap-2 shrink-0 pl-2">
          {savedAt && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-green-600">
              <CheckCircle className="h-3 w-3" /> Saved {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {validatedKey === active && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> Validated
            </span>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            title="Actions"
            aria-label="Actions menu"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              {/* click-away backdrop */}
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-40 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                <button onClick={() => { setMenuOpen(false); setImportMode('portal'); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50">
                  <Cloud className="h-4 w-4 text-blue-600" /> Import from Portal
                </button>
                <button onClick={() => { setMenuOpen(false); setImportMode('offline'); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50">
                  <FolderInput className="h-4 w-4 text-blue-600" /> Import (Offline)
                </button>
                <button onClick={() => { setMenuOpen(false); saveForm(active); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50">
                  <Save className="h-4 w-4 text-gray-500" /> Save
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={() => doValidate(active)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Validate
                </button>
                <button onClick={() => doDownload(active)} disabled={validatedKey !== active || !isFormReleased(active, ay) || !hasToolFor(active, ay)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  title={!isFormReleased(active, ay) ? `${ITR_META[active].short} for A.Y. ${ay} is not released yet` : !hasToolFor(active, ay) ? `No A.Y. ${ay} form exists for ${ITR_META[active].short}` : validatedKey === active ? 'Download the validated ITR JSON' : 'Validate first to unlock'}>
                  <FileDown className="h-4 w-4 text-blue-600" /> Download JSON
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={toggleHighlight}
                  className="flex w-full items-center justify-between gap-2.5 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50">
                  <span className="flex items-center gap-2.5"><Highlighter className="h-4 w-4 text-amber-500" /> Highlight problem fields</span>
                  <span className={`inline-flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${highlight ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <span className={`h-3 w-3 rounded-full bg-white transition-transform ${highlight ? 'translate-x-3' : ''}`} />
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Applicability note for the active form */}
      <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-1 text-[11px] text-gray-500">
        <span className="font-semibold text-gray-600">{ITR_META[active].short}</span> — {ITR_META[active].note}
        <span className="ml-1 text-gray-400">· A.Y. {ay}</span>
      </div>

      {/* Unreleased form-year note (e.g. ITR-6 for A.Y. 2026-27) */}
      {!isFormReleased(active, ay) && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-[11px] font-semibold text-amber-800">
          {ITR_META[active].short} is not yet released by the government for A.Y. {ay} — therefore the ITR JSON cannot be downloaded.
        </div>
      )}

      {/* No data-entry tool built for this year — the form on screen belongs to a
          different assessment year, so its JSON would carry the wrong A.Y. */}
      {!hasToolFor(active, ay) && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-1.5 text-[11px] font-semibold text-red-800">
          No A.Y. {ay} data-entry form exists for {ITR_META[active].short} — the form shown is the A.Y. {TOOL_YEARS[active][0]} version, so its JSON would be stamped A.Y. {TOOL_YEARS[active][0]}. Download is disabled for this year.
        </div>
      )}

      {/* Iframes — invisible until their native buttons are hidden (no flash) */}
      <div className="relative flex-1 overflow-hidden bg-gray-50">
        {forms.filter((k) => mounted.has(k)).map((key) => (
          <iframe
            key={key}
            src={itrSrc(ay, key)}
            onLoad={(e) => onFrameLoad(key, e.currentTarget)}
            className={`absolute inset-0 h-full w-full border-none ${
              active === key ? 'z-10' : 'pointer-events-none z-0 opacity-0'
            }`}
            style={frameReady.has(key) ? undefined : { visibility: 'hidden' }}
            title={ITR_META[key].label}
          />
        ))}
        {!frameReady.has(active) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        )}
      </div>

      {importMode && (
        <ImportItrModal
          open={!!importMode}
          mode={importMode}
          onClose={() => setImportMode(null)}
          company={company}
          ay={ay}
          getWin={() => winRefs.current[active]}
        />
      )}

      {/* Validation-failure popup — lists every blocking reason so the CA can fix. */}
      {valResult && valResult.errors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-2xl bg-red-600 px-5 py-3 text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <h3 className="text-sm font-bold leading-tight">Validation failed — JSON not exported</h3>
                  <p className="text-[11px] text-red-100">{valResult.errors.length} error(s){valResult.warnings.length ? ` · ${valResult.warnings.length} warning(s)` : ''} · {ITR_META[valResult.key].short} · A.Y. {ay}</p>
                </div>
              </div>
              <button onClick={() => setValResult(null)} className="rounded-lg p-1.5 text-red-100 hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto px-5 py-4">
              {valResult.errors.map((e, i) => (
                <div key={`e${i}`} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><b>{e.slno ? `Sl.No ${e.slno}: ` : ''}</b>{e.msg}</span>
                </div>
              ))}
              {valResult.warnings.map((w, i) => (
                <div key={`w${i}`} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><b>{w.slno ? `Sl.No ${w.slno}: ` : ''}</b>{w.msg}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 bg-gray-50 px-5 py-3">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-600">
                <span className={`inline-flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${highlight ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  onClick={toggleHighlight} role="switch" aria-checked={highlight}>
                  <span className={`h-3 w-3 rounded-full bg-white transition-transform ${highlight ? 'translate-x-3' : ''}`} />
                </span>
                <Highlighter className="h-3.5 w-3.5 text-amber-500" /> Highlight problem fields in the form
              </label>
              <button onClick={() => setValResult(null)} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Company view — ITR-6 (ported unchanged from the previous module)
   ═══════════════════════════════════════════════════════════════════════════ */

function CompanyItr6View({ company }: { company: Company }) {
  const [activeTab, setActiveTab] = useState<'calc' | 'itr'>('itr');
  const [taxPayload, setTaxPayload] = useState<Record<string, number> | null>(null);
  const [showLetter, setShowLetter] = useState(false);
  const itr6Ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!company?.id) return;
    const key = `ca_itr6_notice_${company.id}`;
    if (!localStorage.getItem(key)) setShowLetter(true);
  }, [company?.id]);

  // Company-data bridge for the ITR-6 iframe to auto-fill. The sheet reads the
  // localStorage key on load and also accepts HYDRATE_ITR postMessages.
  const bridgePayload = useCallback(() => ({
    companyName: company.name,
    pan: company.entity_details?.pan || '',
    gstin: company.gst_details?.gstin || '',
    address: company.entity_details?.address || '',
    doi: company.entity_details?.dateOfIncorporation || '',
    fy: AY_LIST[0].fy,
    ay: AY_LIST[0].ay,
  }), [company]);

  // NOTE: deliberately no global localStorage bridge here — a global key would let a
  // previously-opened company's data hydrate another company's ITR-6 iframe. All
  // hydration goes through the per-iframe postMessage below (company-sandboxed).

  const hydrateItr6 = useCallback(() => {
    itr6Ref.current?.contentWindow?.postMessage(
      { type: 'HYDRATE_ITR', payload: bridgePayload() },
      window.location.origin,
    );
  }, [bridgePayload]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'TAX_DATA_UPDATED') setTaxPayload(event.data.payload);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!taxPayload || activeTab !== 'itr') return;
    itr6Ref.current?.contentWindow?.postMessage({ type: 'HYDRATE_ITR', payload: taxPayload }, '*');
  }, [activeTab, taxPayload]);

  const dismissLetter = () => {
    if (company?.id) localStorage.setItem(`ca_itr6_notice_${company.id}`, '1');
    setShowLetter(false);
  };

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col">
      {showLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-8 py-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-200" />
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                  Income Tax &amp; ITR Filing Module
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">Important Notice</h2>
              <p className="text-sm text-blue-200 mt-0.5">
                Assessment Year {AY_LIST[0].ay} &nbsp;·&nbsp; ITR-6 &nbsp;·&nbsp; Private Limited Company
              </p>
            </div>
            <div className="max-h-[58vh] overflow-y-auto px-8 py-6 space-y-4 text-sm text-gray-700 leading-relaxed">
              <p className="font-medium text-gray-900 text-base">Dear Sir / Madam,</p>
              <p>
                We extend our warmest greetings and welcome you to the{' '}
                <strong>Income Tax &amp; ITR Filing</strong> module. This module is currently in its{' '}
                <strong>final stages of deployment</strong>, and our development team is diligently working
                towards the timely integration of all applicable ITR forms.
              </p>
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                  Zero Manual Data Entry — Fully Automated
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2 text-sm text-green-900">
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                    <span>
                      <strong>Your company data is imported automatically</strong> — details, financial
                      statements, P&amp;L, balance sheet and TDS records flow directly into the ITR form.
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-green-900">
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                    <span>
                      <strong>Our AI will handle the manual work</strong> — intelligently filling, reviewing
                      and validating every schedule of your ITR form.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3.5 flex gap-3">
                <Shield className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide mb-1">
                    Your Data Security &amp; Privacy
                  </p>
                  <p className="text-gray-600">
                    All financial data is encoded using <strong>128-bit encryption</strong> and stored
                    exclusively on your device and account. Your records remain private and under your control.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Lock className="h-3.5 w-3.5" />
                128-bit encrypted &nbsp;·&nbsp; Stored locally &nbsp;·&nbsp; Fully private
              </div>
              <button
                onClick={dismissLetter}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                I Understand, Proceed →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-1.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">Income Tax</span>
          <span className="text-xs text-gray-400">· AY {AY_LIST[0].ay} · ITR-6 · {ENTITY_TYPES[company.entity_type as EntityType]?.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">AY {AY_LIST[0].ay}</span>
          <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">ITR-6</span>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-4">
        <button
          onClick={() => setActiveTab('calc')}
          className={`flex items-center gap-1.5 border-b-2 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === 'calc' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator className="h-3.5 w-3.5" /> IT Calculator
        </button>
        <button
          onClick={() => setActiveTab('itr')}
          className={`flex items-center gap-1.5 border-b-2 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === 'itr' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> ITR-6 Form
        </button>
      </div>

      {taxPayload && (
        <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-4 py-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
            <CheckCircle className="h-3 w-3" /> Tax data synced
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-gray-500">Total Income: <b className="font-mono text-gray-900">₹{(taxPayload.totalIncome || 0).toLocaleString('en-IN')}</b></span>
            <span className="text-gray-500">Tax Payable: <b className="font-mono text-red-600">₹{(taxPayload.taxPayable || 0).toLocaleString('en-IN')}</b></span>
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden bg-gray-50">
        <iframe
          src="/tax-utilities/it-calculator.html"
          className={`absolute inset-0 h-full w-full border-none ${activeTab === 'calc' ? 'z-10' : 'pointer-events-none z-0 opacity-0'}`}
          title="IT Calculator"
        />
        <iframe
          ref={itr6Ref}
          src="/tax-utilities/itr6.html"
          onLoad={hydrateItr6}
          className={`absolute inset-0 h-full w-full border-none ${activeTab === 'itr' ? 'z-10' : 'pointer-events-none z-0 opacity-0'}`}
          title="ITR-6"
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Locked "coming soon" view — entity types whose forms aren't shipped yet
   ═══════════════════════════════════════════════════════════════════════════ */

function LockedItrView({ entityLabel, applicableItr }: { entityLabel: string; applicableItr: string }) {
  return (
    <div className="flex h-[calc(100vh-60px)] flex-col">
      <div className="border-b border-gray-100 bg-white px-4 py-2 flex items-center gap-2">
        <LockKeyhole className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-800">Income Tax Returns</span>
        <span className="text-xs text-gray-400">· {entityLabel}</span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200">
            <LockKeyhole className="h-9 w-9 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{applicableItr} — Coming Soon</h2>
          <p className="text-sm text-gray-500 mb-6">Applicable for <strong>{entityLabel}</strong></p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-left space-y-3 mb-6">
            <p className="text-sm text-amber-900 leading-relaxed">
              The Income Tax &amp; ITR filing module for <strong>{entityLabel}</strong> ({applicableItr}) is
              currently under development and will be available in an upcoming release.
            </p>
            <ul className="space-y-2">
              {[
                `${applicableItr} filing with full schedule support`,
                'Auto-import from your financial statements and company records',
                'AI-assisted form filling — zero manual entry required',
                'Real-time validation before submission',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-amber-800">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="h-3.5 w-3.5" />
            <span>128-bit encrypted · Stored locally · Only accessible by you</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Router — pick the right view for the company's entity type
   ═══════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   Statutory single-form view — ITR-5 / ITR-6 / ITR-7 (A.Y. 2026-27)
   Reuses the same iframe workspace as the individual forms (ItrYearForms), which
   restores the saved snapshot, prefills master fields from the company record and
   debounce-autosaves every edit back to entity_data (cloud-synced). Because these
   forms only ship for A.Y. 2026-27 there is no year selector.
   ═══════════════════════════════════════════════════════════════════════════ */

function StatutoryItrView({ company, form }: { company: Company; form: ItrKey }) {
  // Assessment-year selector (top right). ITR-6 defaults to A.Y. 2025-26 — the
  // last version released by the government; selecting 2026-27 shows the
  // not-released note inside the workspace and blocks the JSON download.
  const [ay, setAy] = useState<string>(isFormReleased(form, AY_LIST[0].ay) ? AY_LIST[0].ay : AY_LIST[1].ay);
  const meta = AY_LIST.find((y) => y.ay === ay) ?? AY_LIST[0];
  const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label ?? company.entity_type;

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">Income Tax</span>
          <span className="truncate text-xs text-gray-400">· FY {meta.fy} · {entityLabel}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <span className="text-gray-400">Assessment Year</span>
            <select
              value={ay}
              onChange={(e) => setAy(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-700 focus:border-blue-400 focus:outline-none"
              title="Choose the assessment year to file"
            >
              {AY_LIST.map((y) => (
                <option key={y.ay} value={y.ay}>A.Y. {y.ay}</option>
              ))}
            </select>
          </label>
          <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">{ITR_META[form].short}</span>
        </div>
      </div>
      {/* key includes ay so switching years remounts under the correct module key. */}
      <ItrYearForms key={`${form}-${ay}`} company={company} forms={[form]} ay={meta.ay} moduleKey={meta.module} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Router — pick the right view for the company's entity type
   ═══════════════════════════════════════════════════════════════════════════ */

export default function IncomeTaxDashboard() {
  const { company, loading } = useCompany();

  // Purge the legacy global ITR-6 bridge key so no stale company data can ever
  // leak into another company's ITR-6 iframe (the iframe reads this key on load).
  useEffect(() => {
    try { localStorage.removeItem('ca_tax_bridge'); } catch { /* ignore */ }
  }, []);

  if (loading || !company) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const entityType = company.entity_type as EntityType;

  // 1) Individual / Sole proprietor / HUF → multi-year workspace (ITR-1..4)
  const forms = ENTITY_FORMS[entityType];
  if (forms && forms.length > 0) {
    return <IndividualItrView key={company.id} company={company} forms={forms} />;
  }

  // 2) Statutory single-form entities → ITR-5 (firms/LLP/AOP/co-op) or ITR-6 (companies).
  //    ITR-7 (trusts / societies / sec-8) is NOT yet released → locked (see step 3).
  const statForm = STATUTORY_ITR[entityType];
  if (statForm && statForm !== 'itr7') {
    return <StatutoryItrView key={company.id} company={company} form={statForm} />;
  }

  // 3) Fallback → locked "coming soon" — includes every ITR-7 entity type.
  const entityLabel = ENTITY_TYPES[entityType]?.label || entityType;
  const applicableItr = ENTITY_ITR_MAP[entityType] || 'ITR-5 / ITR-7';
  return <LockedItrView entityLabel={entityLabel} applicableItr={applicableItr} />;
}
