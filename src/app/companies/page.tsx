import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { listCompanies, deleteCompany, createCompany, createInitialBookPeriod, createJournalEntry, listJournalEntries } from '@/lib/offlineDb';
import { initEntityData } from '@/entities/initEntity';
import { parseJournalJson, bookPeriodFromDate, buildJournalPayload, orderForTransfer } from '@/lib/accounting/journalTransfer';
import { generateUniqueEntryCode } from '@/lib/utils/entryCodeGenerator';
import { ENTITY_TYPES, type EntityType } from '@/lib/constants/entityTypes';
import { Plus, Search, Trash2, ChevronRight, ChevronDown, Building2, PhoneCall, Phone, Award, ShieldCheck, Upload, Download, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Company } from '@/types/company';
import SignUpForm, { type UserRegistration } from './SignUpForm';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { prefetchRoute } from '@/lib/routePrefetch';

const ENTITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  sole_proprietorship: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100' },
  partnership:        { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-100' },
  llp:                { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-100' },
  opc:                { bg: 'bg-sky-50',     text: 'text-sky-700',    border: 'border-sky-100' },
  pvt_ltd:            { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-100' },
  public_ltd:         { bg: 'bg-teal-50',    text: 'text-teal-700',   border: 'border-teal-100' },
  huf:                { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100' },
  trust:              { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-100' },
  society:            { bg: 'bg-rose-50',    text: 'text-rose-700',   border: 'border-rose-100' },
  section8:           { bg: 'bg-pink-50',    text: 'text-pink-700',   border: 'border-pink-100' },
  aop_boi:            { bg: 'bg-lime-50',    text: 'text-lime-700',   border: 'border-lime-100' },
  cooperative:        { bg: 'bg-cyan-50',    text: 'text-cyan-700',   border: 'border-cyan-100' },
};

// ── SIGN-UP / REGISTRATION GATE SUSPENDED (hidden, NOT deleted) ──────────────
// The onboarding form ("Welcome to CA Studio") is turned off. The app opens
// straight on the companies list and never asks for contact details.
// TO RESTORE THE SIGN-UP GATE: set this back to true.
const REGISTRATION_GATE_ENABLED = false;

// Read registration status synchronously — runs once before the very first render.
// This means the form can NEVER appear if the user has already registered,
// regardless of navigation method (browser back, direct URL, refresh, etc.).
function readRegistration(): UserRegistration | null {
  if (typeof window === 'undefined') return null;
  try {
    const alreadyRegistered = localStorage.getItem('ca_studio_registered') === '1';
    const raw = localStorage.getItem('ca_user_registration');
    if (raw) {
      return JSON.parse(raw) as UserRegistration;
    }
    if (alreadyRegistered) {
      // Sentinel flag set but full JSON missing — treat as registered with placeholder
      return { name: '', phone: '', email: '', state: '', city: '', profession: '', expertise: [] };
    }
  } catch {
    // If anything goes wrong, fall back to showing the form
  }
  // GATE SUSPENDED: treat an unregistered visitor as registered (placeholder
  // profile) so the sign-up form never renders. Nothing is written to
  // localStorage, so flipping the flag above restores the original behaviour.
  if (!REGISTRATION_GATE_ENABLED) {
    return { name: '', phone: '', email: '', state: '', city: '', profession: '', expertise: [] };
  }
  return null;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  // Lazy initializer: localStorage is read synchronously on first render — no async delay.
  const [registrationData, setRegistrationData] = useState<UserRegistration | null>(readRegistration);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [importingCo, setImportingCo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // "New Company" is one button that opens a two-option menu (Create / Import).
  // The menu is position:fixed because the navy hero clips its overflow.
  const [newMenu, setNewMenu] = useState<{ top: number; right: number } | null>(null);
  const newBtnRef = useRef<HTMLButtonElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!newMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (newMenuRef.current?.contains(t) || newBtnRef.current?.contains(t)) return;
      setNewMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNewMenu(null); };
    const onShift = () => setNewMenu(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onShift);
    window.addEventListener('scroll', onShift, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onShift);
      window.removeEventListener('scroll', onShift, true);
    };
  }, [newMenu]);
  const toggleNewMenu = () => {
    const r = newBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    setNewMenu((m) => (m ? null : { top: r.bottom + 8, right: window.innerWidth - r.right }));
  };

  // Right-click (or the context-menu key / Shift+F10) on a company card opens
  // its options — Export company and Delete. Portalled to <body> and closed on
  // outside click, Esc, scroll, resize or window blur.
  const [cardMenu, setCardMenu] = useState<{ x: number; y: number; company: Company; viaKeyboard: boolean } | null>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const cardMenuOrigin = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!cardMenu) return;
    const close = () => setCardMenu(null);
    const onDown = (e: MouseEvent) => {
      if (cardMenuRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      close();
      cardMenuOrigin.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('blur', close);
    // Keyboard users land on the first option straight away.
    if (cardMenu.viaKeyboard) {
      requestAnimationFrame(() => cardMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    }
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('blur', close);
    };
  }, [cardMenu]);

  // Load companies list whenever we have registration data
  useEffect(() => {
    if (registrationData) {
      setCompanies(listCompanies());
      setLoading(false);
    }
  }, [registrationData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (ENTITY_TYPES[c.entity_type as EntityType]?.label ?? '').toLowerCase().includes(q) ||
      (c.entity_details?.pan ?? '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  // Guard: if not registered, show the form. Because readRegistration() runs
  // synchronously, this decision is made on the very first render — no spinner,
  // no flash, no way for a registered user to ever see this form again.
  if (!registrationData) {
    return <SignUpForm onSuccess={(data) => setRegistrationData(data)} />;
  }

  /* ── Company card options (right-click menu) ── */
  const MENU_W = 208, MENU_H = 128;
  const openCardMenu = (el: HTMLElement, company: Company, at?: { x: number; y: number }) => {
    cardMenuOrigin.current = el;
    let x: number, y: number;
    if (at) { x = at.x; y = at.y; }
    else { const r = el.getBoundingClientRect(); x = r.left + 16; y = r.top + 44; }
    x = Math.max(8, Math.min(x, window.innerWidth - MENU_W - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - MENU_H - 8));
    setCardMenu({ x, y, company, viaKeyboard: !at });
  };
  const onCardContextMenu = (e: React.MouseEvent<HTMLElement>, company: Company) => {
    e.preventDefault();
    e.stopPropagation();
    // A keyboard-invoked context menu reports no pointer position (button ≠ 2).
    const fromPointer = e.button === 2 && (e.clientX !== 0 || e.clientY !== 0);
    openCardMenu(e.currentTarget, company, fromPointer ? { x: e.clientX, y: e.clientY } : undefined);
  };
  const onCardKeyDown = (e: React.KeyboardEvent<HTMLElement>, company: Company) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      openCardMenu(e.currentTarget, company);
    }
  };
  const onCardMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const items = Array.from(cardMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : e.key === 'ArrowDown' ? (i + 1) % items.length
      : (i - 1 + items.length) % items.length;
    items[next].focus();
  };

  // Same file the Journal page's "Export JSON" produced (vaarta_journal_import_v2,
  // same keys, same pretty-printing, same filename pattern) — for ALL of the
  // company's journal entries, not a date-filtered view.
  const downloadJson = (filename: string, data: unknown) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleExportCompany = (company: Company) => {
    setCardMenu(null);
    const entries = listJournalEntries(company.id);
    if (entries.length === 0) {
      toast.error(`"${company.name}" has no journal entries to export.`);
      return;
    }
    const payload = buildJournalPayload(company.name || 'Company', entries);
    const fromDate = payload.entries[0].entry_date;
    const toDate = payload.entries[payload.entries.length - 1].entry_date;
    const filename = `journal_export_${(company.name || 'company').replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.json`;
    downloadJson(filename, payload);
    toast.success(`Exported ${payload.count} journal entr${payload.count === 1 ? 'y' : 'ies'} from "${company.name}".`);
  };

  const handleDeleteCompany = (company: Company) => {
    setCardMenu(null);
    if (!confirm(`Delete "${company.name}"?\n\nAll journal entries for this company will be permanently deleted.`)) return;
    deleteCompany(company.id);
    setCompanies(listCompanies());
    setLoading(false);
    toast.success(`${company.name} deleted`);
  };

  // Import a whole company from a vaarta_journal_import_v2 file (same structure the
  // Journal page imports/exports): create a shell company named from the file, then
  // load all its journal entries. Entity/GST details default and can be set in Settings.
  const handleImportCompany = async (file: File) => {
    setImportingCo(true);
    try {
      const raw = await file.text();
      const parsed = parseJournalJson(raw);
      if (!parsed.ok) { toast.error(parsed.error || 'Unsupported company/journal JSON.'); return; }
      if (parsed.entries.length === 0) { toast.error('No valid journal entries found in the file.'); return; }

      const name = (parsed.companyName || file.name.replace(/\.json$/i, '') || 'Imported Company').trim();
      const company = createCompany({
        name,
        entity_type: 'pvt_ltd', // default — change in Company Settings
        entity_details: {} as Company['entity_details'],
        business_nature: [],
        inventory_enabled: false,
        inventory_config: { valuationMethod: 'weighted_average', pettyCashThreshold: 5000 } as Company['inventory_config'],
        gst_status: 'unregistered' as Company['gst_status'],
        gst_details: {} as Company['gst_details'],
        tds_applicable: false,
        tcs_applicable: false,
        accounting_method: 'mercantile',
        financial_year_start: 'april',
      });
      createInitialBookPeriod(company.id);
      try { initEntityData(company); } catch { /* non-fatal */ }

      // Create entries in the canonical transfer order (the Journal's display
      // order: date, then position in the file), so a company exported from here
      // comes back in exactly the same sequence. Codes follow that same order per
      // voucher type (JE00001…, S00001…, P00001…) the way in-app entries get them;
      // they are counted locally rather than rescanning the store for every entry.
      const prefixOf = new Map<string, string>();   // voucher type → code prefix
      const nextNum = new Map<string, number>();    // code prefix  → next number
      const takeCode = (voucherType: string): { code: string; undo: () => void } => {
        let prefix = prefixOf.get(voucherType);
        if (prefix === undefined) {
          const seed = generateUniqueEntryCode(company.id, voucherType); // e.g. S00001
          prefix = seed.replace(/\d+$/, '');
          prefixOf.set(voucherType, prefix);
          if (!nextNum.has(prefix)) nextNum.set(prefix, parseInt(seed.slice(prefix.length), 10) || 1);
        }
        const p = prefix;
        const n = nextNum.get(p)!;
        nextNum.set(p, n + 1);
        return { code: p + String(n).padStart(5, '0'), undo: () => nextNum.set(p, n) };
      };

      let ok = 0, failed = 0;
      for (const item of orderForTransfer(parsed.entries)) {
        const { code, undo } = takeCode(item.voucher_type);
        try {
          createJournalEntry({
            company_id: company.id,
            entry_code: code,
            entry_date: item.entry_date,
            voucher_type: item.voucher_type,
            voucher_number: item.voucher_number ?? undefined,
            lines: item.lines as unknown as Parameters<typeof createJournalEntry>[0]['lines'],
            narration: item.narration ?? '',
            book_period: bookPeriodFromDate(item.entry_date),
            is_opening: false,
            is_closing: false,
          });
          ok += 1;
        } catch { undo(); failed += 1; }
      }
      setCompanies(listCompanies());
      toast.success(`Imported "${name}" with ${ok} entr${ok === 1 ? 'y' : 'ies'}${parsed.skipped || failed ? ` (${parsed.skipped + failed} skipped)` : ''}. Set entity & GST details in Settings.`);
      navigate(`/company/${company.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Company import failed.');
    } finally {
      setImportingCo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen app-surface">
      {/* ── Hero header ── */}
      <header className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="hero px-6 sm:px-8 py-7 flex items-center justify-between gap-4">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
          {/* The logo carries the product name — it is the heading, not typed text. */}
          <div className="relative flex items-center gap-4 min-w-0">
            <h1 className="m-0 inline-flex shrink-0 items-center rounded-[14px] bg-white px-4 py-2.5 shadow-[0_8px_24px_-12px_rgba(7,22,44,0.6)]">
              <BrandLogo height={38} />
            </h1>
            <p className="hero-muted hidden sm:block text-[12.5px] font-semibold leading-snug max-w-[24ch]">
              Professional accounting software for India
            </p>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportCompany(f); }}
            />
            {/* App-level settings. PLACEHOLDER — the user will define its use later;
                until then it only says so. Replace the onClick when that lands. */}
            <button
              type="button"
              onClick={() => toast('Settings are coming soon.')}
              title="Settings"
              aria-label="Settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-white bg-white/10 hover:bg-white/20 transition-colors duration-[160ms] cursor-pointer"
            >
              <SettingsIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              ref={newBtnRef}
              type="button"
              onClick={toggleNewMenu}
              disabled={importingCo}
              aria-haspopup="menu"
              aria-expanded={!!newMenu}
              className="btn-pill-primary cursor-pointer disabled:cursor-wait"
            >
              {importingCo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {importingCo ? 'Importing…' : 'New Company'}
              {!importingCo && (
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-[160ms] ${newMenu ? 'rotate-180' : ''}`} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* New Company → Create / Import. Same two actions as before; only the UI changed. */}
      {newMenu && (
        <div
          ref={newMenuRef}
          role="menu"
          style={{ position: 'fixed', top: newMenu.top, right: newMenu.right, zIndex: 80 }}
          className="reveal w-72 rounded-[12px] border border-[var(--sand)] bg-white p-1.5 shadow-[var(--shadow-lift)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setNewMenu(null); navigate('/companies/create'); }}
            className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors duration-[160ms] hover:bg-[var(--cream-2)] cursor-pointer"
          >
            <span className="quick-tile-icon"><Building2 className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-bold text-[var(--ink)]">Create</span>
              <span className="block text-[11.5px] text-[var(--ink-3)]">Set up a new company step by step</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setNewMenu(null); fileInputRef.current?.click(); }}
            title="Import a company from a journal JSON (vaarta_journal_import_v2)"
            className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors duration-[160ms] hover:bg-[var(--cream-2)] cursor-pointer"
          >
            <span className="quick-tile-icon"><Upload className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-bold text-[var(--ink)]">Import</span>
              <span className="block text-[11.5px] text-[var(--ink-3)]">Bring in a company from a journal file (.json)</span>
            </span>
          </button>
        </div>
      )}

      {/* Company options — right-click a card (or the context-menu key / Shift+F10) */}
      {cardMenu && createPortal(
        <div
          ref={cardMenuRef}
          role="menu"
          aria-label={`${cardMenu.company.name} — options`}
          onKeyDown={onCardMenuKeyDown}
          onContextMenu={(e) => e.preventDefault()}
          style={{ position: 'fixed', left: cardMenu.x, top: cardMenu.y, width: MENU_W, zIndex: 90 }}
          className="reveal rounded-[12px] border border-[var(--sand)] bg-white p-1.5 shadow-[var(--shadow-lift)]"
        >
          <p className="truncate px-2.5 pt-1 pb-1.5 text-[11px] font-semibold text-[var(--ink-3)]" title={cardMenu.company.name}>
            {cardMenu.company.name}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExportCompany(cardMenu.company)}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] font-semibold text-[var(--ink)] transition-colors duration-[160ms] hover:bg-[var(--cream-2)] focus-visible:bg-[var(--cream-2)] cursor-pointer"
          >
            <Download className="h-4 w-4 shrink-0 text-[var(--slate-blue)]" />
            Export company
          </button>
          <div className="my-1 h-px bg-[var(--cream)]" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDeleteCompany(cardMenu.company)}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] font-semibold text-[var(--bad)] transition-colors duration-[160ms] hover:bg-[var(--bad-soft)] focus-visible:bg-[var(--bad-soft)] cursor-pointer"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            Delete
          </button>
        </div>,
        document.body,
      )}

      {/* Full width, same side gutter as the banner above — cards start at the
          left edge and as many fit per row as the screen allows. */}
      <main className="px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>

        ) : companies.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="icon-badge mb-5" style={{ width: '4rem', height: '4rem' }}>
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No companies yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Create your first company to start managing journal entries and financial statements.
            </p>
            <Link to="/companies/create" className="btn-pill-primary">
              <Plus className="h-4 w-4" />
              Create First Company
            </Link>
          </div>

        ) : (
          <>
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {filtered.length} {filtered.length === 1 ? 'Company' : 'Companies'}
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, entity type, PAN…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-full w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* ── Cards ── */}
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
              {filtered.map(company => {
                const meta   = ENTITY_TYPES[company.entity_type as EntityType];
                const colors = ENTITY_COLORS[company.entity_type] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
                return (
                  <Link
                    key={company.id}
                    to={`/company/${company.id}`}
                    onContextMenu={(e) => onCardContextMenu(e, company)}
                    onKeyDown={(e) => onCardKeyDown(e, company)}
                    onMouseEnter={() => prefetchRoute(`/company/${company.id}`)}
                    onFocus={() => prefetchRoute(`/company/${company.id}`)}
                    className="group stat-card hover:border-blue-200 !p-5 block"
                  >
                    <div className="flex items-start mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="icon-badge icon-badge-sm mt-0.5 shrink-0"><Building2 className="h-4 w-4" /></span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors text-sm" title={company.name}>
                            {company.name}
                          </h3>
                          <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {meta?.shortLabel ?? company.entity_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      {company.entity_details?.pan && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 w-12 shrink-0">PAN</span>
                          <span className="font-mono font-medium text-gray-700 truncate">{company.entity_details.pan}</span>
                        </div>
                      )}
                      {company.gst_status !== 'unregistered' && company.gst_details?.gstin && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 w-12 shrink-0">GSTIN</span>
                          <span className="font-mono font-medium text-gray-700 truncate">{company.gst_details.gstin}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 w-12 shrink-0">Method</span>
                        <span>{company.accounting_method === 'mercantile' ? 'Accrual (Mercantile)' : 'Cash Basis'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <span className="text-[11px] text-gray-400">{fmtDate(company.created_at)}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* ── Registered Profile Details Modal ── */}
        {showDetailsModal && registrationData && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowDetailsModal(false)}>
            <div className="ca-modal-panel bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Settings</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">Registered Profile Details</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{registrationData.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block font-mono">{registrationData.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block font-mono">{registrationData.email}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{registrationData.state}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{registrationData.city}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profession</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block capitalize">
                      {registrationData.profession.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Areas of Expertise</span>
                  <div className="flex flex-wrap gap-1.5">
                    {registrationData.expertise.map(exp => (
                      <span key={exp} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-700">
                        <Award className="h-3 w-3 shrink-0" />
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button onClick={() => {
                  setShowDetailsModal(false);
                  localStorage.removeItem('ca_user_registration');
                  setRegistrationData(null);
                }} className="w-full h-11 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-xl transition-all cursor-pointer">
                  Update Registered Info
                </button>
                <button onClick={() => setShowDetailsModal(false)} className="w-full h-11 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
