import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCompany } from '@/hooks/useCompany';
import { useEntityConfig } from '@/hooks/useEntityConfig';
import { useWorkspaceFiles } from '@/hooks/useWorkspaceFiles';
import { addFile, deleteFile, updateFile } from '@/lib/workspaceDb';
import type { WorkspaceFile } from '@/lib/carp/tools/types';
import {
  BookOpen, Wallet, Coins, ClipboardList, ClipboardMinus,
  FileText, Users, Scale, TrendingUp, TrendingDown, BarChart3,
  Building2, ArrowRightLeft, Receipt, Briefcase, RefreshCw,
  Landmark, ScrollText, Home, PiggyBank, FileQuestion,
  ClipboardCheck, Building, Banknote, Calculator, FileSpreadsheet,
  IndianRupee, Clock, ArrowLeftRight, ShieldCheck, Globe, Percent,
  FileCheck, FileSignature, PieChart, Link2, CheckSquare, Package,
  Settings, Sparkles, FolderOpen, File, FileCode, FilePlus, FileUp,
  Trash2, Pencil, Check, X, LayoutGrid, Search, LogOut, type LucideIcon,
  ChevronDown, ChevronsLeft, ChevronsRight, ChevronsUpDown, LayoutDashboard,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { clearLocalDataOnSignOut } from '@/lib/sync/cloudSync';
import { ENTITY_TYPES, type EntityType } from '@/lib/constants/entityTypes';
import { BrandLogo } from './BrandLogo';
import { prefetchRoute } from '@/lib/routePrefetch';

interface NavItem { label: string; href: string; icon: LucideIcon }
/** `standalone` groups render as a single top-level link (no heading row). */
interface NavGroup { heading: string; items: NavItem[]; standalone?: boolean }
interface SidebarProps {
  /** Kept for API compatibility — the nav no longer carries an Aleza launcher. */
  onAlezaToggle?: () => void;
}

type AccessMode = 'professional' | 'business';
const ACCESS_MODE_KEY = 'ca_access_mode';
/** Which nav groups the viewer has opened — a per-browser convenience only. */
const NAV_GROUPS_KEY = 'yukti_nav_groups';

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── group icon tile ── purely decorative: each nav group heading reads as a
      rounded row with a small tile rather than a bare ruled label ── */
const GROUP_ICONS: Record<string, LucideIcon> = {
  CORE: BookOpen,
  REGISTERS: ClipboardList,
  LEDGERS: Users,
  'FINANCIAL STATEMENTS': BarChart3,
  INTEGRATIONS: ArrowLeftRight,
  'SPECIAL ACCOUNTS': Briefcase,
  'TAX & COMPLIANCE': Percent,
  INVENTORY: Package,
  'BULK WORKFLOW': LayoutGrid,
  WORKSPACE: FolderOpen,
};
function groupIcon(heading: string): LucideIcon {
  return GROUP_ICONS[heading] ?? LayoutGrid;
}

/* ── file type icon ── */
function fileIcon(type: WorkspaceFile['type']) {
  if (type === 'csv') return FileSpreadsheet;
  if (type === 'json') return FileCode;
  if (type === 'markdown') return FileText;
  return File;
}

/* ── Context Menu ── */
interface CtxMenu {
  x: number; y: number;
  kind: 'workspace-bg' | 'file';
  file?: WorkspaceFile;
}

export const Sidebar = React.memo(function Sidebar(_props: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { company, companyId, loading } = useCompany();
  const { config } = useEntityConfig();
  const wsFiles = useWorkspaceFiles(companyId);

  const [ctx, setCtx] = useState<CtxMenu | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null); // fileId
  const [renameVal, setRenameVal] = useState('');
  const ctxRef = useRef<HTMLDivElement>(null);

  // Access mode is chosen on the login page and persisted. The sidebar only
  // reads it here (defaults to Professional = full menu).
  const [mode] = useState<AccessMode>(() => {
    if (typeof window === 'undefined') return 'professional';
    return localStorage.getItem(ACCESS_MODE_KEY) === 'business' ? 'business' : 'professional';
  });

  // Quick search — type the start of a menu entry to jump to it.
  const [query, setQuery] = useState('');

  // Signed-in user (shown as a chip in the sidebar footer).
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null)).catch(() => {});
  }, []);

  const entityMeta = company ? ENTITY_TYPES[company.entity_type as EntityType] : undefined;

  /* close context menu on outside click or Escape */
  useEffect(() => {
    if (!ctx) return;
    const close = () => setCtx(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtx(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [ctx]);

  /* block native context menu everywhere */
  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    return () => document.removeEventListener('contextmenu', block);
  }, []);

  const openWorkspaceBg = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, kind: 'workspace-bg' });
  }, []);

  const openFileCtx = useCallback((e: React.MouseEvent, file: WorkspaceFile) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, kind: 'file', file });
  }, []);

  const handleNewFile = useCallback(() => {
    if (!companyId) return;
    setCtx(null);
    const name = `untitled-${Date.now()}.txt`;
    const f = addFile(companyId, { name, type: 'text', content: '' });
    navigate(`/company/${companyId}/folders?file=${f.id}`);
  }, [companyId, navigate]);

  const handleDeleteFile = useCallback((file: WorkspaceFile) => {
    if (!companyId) return;
    setCtx(null);
    deleteFile(companyId, file.id);
    if (pathname.includes('/folders')) {
      navigate(`/company/${companyId}/folders`);
    }
  }, [companyId, pathname, navigate]);

  const startRename = useCallback((file: WorkspaceFile) => {
    setCtx(null);
    setRenaming(file.id);
    setRenameVal(file.name);
  }, []);

  const commitRename = useCallback(() => {
    if (!companyId || !renaming || !renameVal.trim()) { setRenaming(null); return; }
    updateFile(companyId, renaming, { name: renameVal.trim() });
    setRenaming(null);
  }, [companyId, renaming, renameVal]);

  /* nav groups (memoised, no workspace items here) */
  const groups = useMemo(() => {
    if (!config || !companyId) return null;
    const base = `/company/${companyId}`;
    const nav = config.nav;

    // An individual only ever needs their return and TDS/TCS — no books,
    // registers, statements, GST or inventory.
    if (company?.entity_type === 'individual') {
      return [{ heading: 'TAX & COMPLIANCE', items: [
        { label: 'Income Tax', href: `${base}/income-tax`, icon: Calculator },
        { label: 'TDS & TCS', href: `${base}/tds-register`, icon: FileSpreadsheet },
      ] }] as NavGroup[];
    }

    // Both Professional and Business now see the full (unlocked) menu.
    const g: NavGroup[] = [];

    g.push({ heading: 'CORE', items: [
      ...(nav.journal ? [{ label: 'Journal', href: `${base}/journal`, icon: BookOpen }] : []),
      ...(nav.cashBook ? [{ label: 'Cash Book', href: `${base}/cash-book`, icon: Wallet }] : []),
    ]});

    const registerItems: NavItem[] = [];
    if (nav.purchaseRegister !== 'never') registerItems.push({ label: 'Purchase', href: `${base}/purchase-register`, icon: ClipboardList });
    if (nav.salesRegister !== 'never') registerItems.push({ label: 'Sales', href: `${base}/sales-register`, icon: ClipboardList });
    if (nav.purchaseReturns !== 'never') registerItems.push({ label: 'Purchase Returns', href: `${base}/purchase-returns`, icon: ClipboardMinus });
    if (nav.salesReturns !== 'never') registerItems.push({ label: 'Sales Returns', href: `${base}/sales-returns`, icon: ClipboardMinus });
    if (nav.billsReceivable) registerItems.push({ label: 'Bills Receivable', href: `${base}/bills-receivable`, icon: FileText });
    if (nav.billsPayable) registerItems.push({ label: 'Bills Payable', href: `${base}/bills-payable`, icon: FileText });
    if (registerItems.length > 0) g.push({ heading: 'REGISTERS', items: registerItems });

    // Ledger is one standalone link (user request, 2026-09-27) — Debtors and
    // Creditors are no longer listed; their pages still exist at their URLs.
    if (nav.ledger) g.push({ heading: 'LEDGER', standalone: true, items: [
      { label: 'Ledger', href: `${base}/ledger`, icon: ScrollText },
    ] });

    const fsItems: NavItem[] = [];
    if (nav.trialBalance) fsItems.push({ label: 'Trial Balance', href: `${base}/trial-balance`, icon: Scale });
    if (nav.tradingAccount !== 'never') {
      fsItems.push({ label: 'Trading Account', href: `${base}/trading-account`, icon: TrendingUp });
    }
    if (nav.profitLoss) fsItems.push({ label: 'Profit & Loss', href: `${base}/profit-loss`, icon: BarChart3 });
    if (nav.plAppropriation) fsItems.push({ label: 'P&L Appropriation', href: `${base}/pl-appropriation`, icon: BarChart3 });
    if (nav.balanceSheet) {
      fsItems.push({ label: 'Balance Sheet', href: `${base}/balance-sheet`, icon: Building2 });
      // Balance Sheet Notes page removed from nav — notes open by clicking a
      // particular inside the Balance Sheet itself (BsNotesDrawer).
    }
    if (nav.cashFlowStatement !== 'never') fsItems.push({ label: 'Cash Flow Statement', href: `${base}/cash-flow`, icon: ArrowRightLeft });
    // Funds Flow Statement removed from the nav (user request, 2026-09-27); page still at /funds-flow.
    if (nav.ratioAnalysis) fsItems.push({ label: 'Ratio Analysis', href: `${base}/ratio-analysis`, icon: BarChart3 });
    if (nav.incomeExpenditure) fsItems.push({ label: 'Income & Expenditure', href: `${base}/income-expenditure`, icon: Receipt });
    if (nav.receiptsPayments) fsItems.push({ label: 'Receipts & Payments', href: `${base}/receipts-payments`, icon: Receipt });

    if (fsItems.length > 0) g.push({ heading: 'FINANCIAL STATEMENTS', items: fsItems });

    const specialItems: NavItem[] = [];
    if (nav.partnersCapital) specialItems.push({ label: "Partners' Capital", href: `${base}/partners-capital`, icon: Briefcase });
    if (nav.revaluation) specialItems.push({ label: 'Revaluation Account', href: `${base}/revaluation`, icon: RefreshCw });
    if (nav.realisation) specialItems.push({ label: 'Realisation Account', href: `${base}/realisation`, icon: FileText });
    // Share Capital and Debentures are no longer listed here (user request,
    // 2026-09-27). Their pages still exist at /share-capital and /debentures.
    if (nav.kartaCapital) specialItems.push({ label: "Karta's Capital", href: `${base}/karta-capital`, icon: Home });
    if (nav.fundAccounts) specialItems.push({ label: 'Fund Accounts', href: `${base}/fund-accounts`, icon: PiggyBank });
    if (nav.incompleteRecords) specialItems.push({ label: 'Incomplete Records', href: `${base}/incomplete-records`, icon: FileQuestion });
    if (nav.memberRegister) specialItems.push({ label: 'Member Register', href: `${base}/member-register`, icon: ClipboardCheck });
    if (specialItems.length > 0) g.push({ heading: 'SPECIAL ACCOUNTS', items: specialItems });

    const taxItems: NavItem[] = [];
    if (nav.gst !== 'never') taxItems.push({ label: 'GST', href: `${base}/gst`, icon: Receipt });
    if (nav.incomeTax || nav.taxComputation) taxItems.push({ label: 'Income Tax', href: `${base}/income-tax`, icon: Calculator });
    // TDS and TCS are now one combined register (single screen, both grids inside).
    if (nav.tdsRegister !== 'never' || nav.tcsRegister !== 'never') taxItems.push({ label: 'TDS & TCS', href: `${base}/tds-register`, icon: FileSpreadsheet });
    if (nav.advanceTax) taxItems.push({ label: 'Advance Tax', href: `${base}/advance-tax`, icon: IndianRupee });
    if (nav.deferredTax) taxItems.push({ label: 'Deferred Tax', href: `${base}/deferred-tax`, icon: Clock });
    if (nav.brs) taxItems.push({ label: 'Bank Reconciliation', href: `${base}/brs`, icon: ArrowLeftRight });
    if (nav.bankImport) taxItems.push({ label: 'Bank Import', href: `${base}/bank-import`, icon: FileUp });
    if (nav.audit !== 'never') taxItems.push({ label: 'Audit', href: `${base}/audit`, icon: ShieldCheck });
    if (taxItems.length > 0) g.push({ heading: 'TAX & COMPLIANCE', items: taxItems });

    // AUDIT & REPORTS section removed

    if (nav.inventory !== 'never') {
      g.push({ heading: 'INVENTORY', items: [{ label: 'Inventory', href: `${base}/inventory`, icon: Package }] });
    }

    g.push({ heading: 'BULK WORKFLOW', items: [
      { label: 'Bank Statement Importer', href: `${base}/bulk-workspace`, icon: LayoutGrid },
    ]});

    // Integrations — Tally viewer + cross-ERP import & reconciliation. Last of
    // the groups, just above Workspace (the user's chosen position).
    g.push({ heading: 'INTEGRATIONS', items: [
      { label: 'Tally', href: `${base}/tally`, icon: FileText },
      { label: 'ERP Bridge', href: `${base}/erp-bridge`, icon: ArrowLeftRight },
    ] });

    return g;
  }, [config, companyId, company, mode]);

  // Filtered menu entries for the quick-search box (start-of-word matches first).
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q || !groups) return [];
    const seen = new Set<string>();
    const all = groups.flatMap((grp) => grp.items).filter((it) => {
      if (seen.has(it.href)) return false;
      seen.add(it.href);
      return true;
    });
    return all
      .filter((it) => it.label.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStart = a.label.toLowerCase().startsWith(q) ? 0 : 1;
        const bStart = b.label.toLowerCase().startsWith(q) ? 0 : 1;
        return aStart - bStart || a.label.localeCompare(b.label);
      });
  }, [q, groups]);

  /* ── Group open/closed state. The group holding the current page always opens,
        so the navy "you are here" pill is never hidden inside a shut group. ── */
  const isHrefActive = useCallback(
    (href: string) => pathname === href || pathname?.startsWith(href + '/'),
    [pathname],
  );
  const activeHeading = useMemo(
    () => groups?.find((g) => g.items.some((it) => isHrefActive(it.href)))?.heading ?? null,
    [groups, isHrefActive],
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(NAV_GROUPS_KEY) || '{}') ?? {}; } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(openGroups)); } catch { /* storage blocked */ }
  }, [openGroups]);
  useEffect(() => {
    if (!activeHeading) return;
    setOpenGroups((o) => (activeHeading in o ? o : { ...o, [activeHeading]: true }));
  }, [activeHeading]);

  const searchRef = useRef<HTMLInputElement>(null);

  if (loading || !groups) {
    return (
      <aside className="w-full side-surface h-full shrink-0 flex flex-col min-h-0">
        <div className="px-3 pt-3.5 pb-2.5">
          <div className="h-9 rounded-[10px] bg-[var(--cream-2)] border-[1.5px] border-[var(--sand)]" />
        </div>
        <div className="p-3 space-y-2 flex-1 overflow-y-auto min-h-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-[var(--cream)] rounded-[10px] animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  const base = `/company/${companyId}`;
  const dashActive = pathname === base;
  const settingsActive = pathname === `${base}/settings`;
  const showWorkspace = mode !== 'business' && company?.entity_type !== 'individual';
  const wsActive = pathname.includes('/folders');
  const isGroupOpen = (h: string) =>
    openGroups[h] ?? (h === activeHeading || h === 'CORE' || (h === 'WORKSPACE' && wsActive));
  const toggleGroup = (h: string) => setOpenGroups((o) => ({ ...o, [h]: !isGroupOpen(h) }));

  /* Workspace file row */
  const renderFile = (f: WorkspaceFile) => {
    const fileHref = `${base}/folders?file=${f.id}`;
    const isActive = pathname.includes('/folders') && pathname.includes(f.id) ||
      (typeof window !== 'undefined' && window.location.search.includes(f.id));
    return (
      <div key={f.id} className="relative" onContextMenu={(e) => openFileCtx(e, f)}>
        {renaming === f.id ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1">
            <input
              autoFocus
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(null);
              }}
              onBlur={commitRename}
              aria-label="File name"
              className="flex-1 min-w-0 text-xs border-[1.5px] border-[var(--slate-blue)] rounded-[8px] px-1.5 py-0.5 bg-white focus:outline-none"
            />
          </div>
        ) : (
          <Link to={fileHref} className={`nav-pill ${isActive ? 'nav-pill-active' : ''}`}>
            <span className="truncate text-xs">{f.name}</span>
          </Link>
        )}
      </div>
    );
  };

  /** `top` = a top-level link (standalone group): it leads with the icon tile
      like the group rows. Items inside a group stay text only. */
  const navItemLink = (item: NavItem, onClick?: () => void, top = false) => {
    const active = isHrefActive(item.href);
    const Icon = item.icon;
    return (
      <Link key={item.href} to={item.href} onClick={onClick} onMouseEnter={() => prefetchRoute(item.href)} onFocus={() => prefetchRoute(item.href)} className={`nav-pill ${top ? 'nav-top' : ''} ${active ? 'nav-pill-active' : ''}`}>
        {top && <span className="nav-group-tile"><Icon className="h-[15px] w-[15px]" /></span>}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  /* Custom context menu — portalled: the nav's frosted surface creates a
     containing block that would otherwise trap a fixed-position menu. */
  const ctxMenu = ctx ? (
    <div
      ref={ctxRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ position: 'fixed', left: ctx.x, top: ctx.y, zIndex: 9999 }}
      className="bg-white border border-[var(--sand)] rounded-[12px] shadow-[var(--shadow-lift)] py-1.5 min-w-[160px] text-[13px] overflow-hidden"
    >
      {ctx.kind === 'workspace-bg' && (
        <CtxItem label="New file" onClick={handleNewFile} />
      )}
      {ctx.kind === 'file' && ctx.file && (
        <>
          <CtxItem label="Rename" onClick={() => startRename(ctx.file!)} />
          <div className="my-1 border-t border-[var(--cream)]" />
          <CtxItem label="Delete" onClick={() => handleDeleteFile(ctx.file!)} danger />
        </>
      )}
    </div>
  ) : null;

  /* The panel — navigation items only, text only. The logo and the company
     name live in the top bar; opening/closing belongs to the bookmark tab. */
  return (
    <>
      <aside className="side-surface w-full h-full shrink-0 flex flex-col min-h-0" aria-label="Main navigation">
        {/* Quick search — type the start of an entry to float it to the top */}
        <div className="px-3 pt-3.5 pb-2.5 shrink-0">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches.length) { navigate(matches[0].href); setQuery(''); }
              if (e.key === 'Escape') setQuery('');
            }}
            placeholder="Search menu…"
            aria-label="Search menu"
            className="w-full h-9 px-3 text-[13px] bg-[var(--cream-2)] border-[1.5px] border-[var(--sand)] rounded-[10px] focus:outline-none focus:bg-white focus:border-[var(--slate-blue)] focus:shadow-[0_0_0_3px_rgba(23,69,127,0.12)] placeholder:text-[var(--ink-3)] transition-[background-color,border-color,box-shadow] duration-[160ms]"
          />
        </div>

        <nav className="list-fade flex-1 min-h-0 overflow-y-auto px-2 pt-1 pb-3">
          {q ? (
            /* ── Search results (matches float to the top) ── */
            <div>
              <p className="nav-heading-static">
                Results{matches.length ? ` · ${matches.length}` : ''}
              </p>
              {matches.length === 0
                ? <p className="text-[11.5px] text-[var(--ink-3)] px-2.5 py-1">No matching menu items</p>
                : matches.map((item) => navItemLink(item, () => setQuery('')))}
            </div>
          ) : (
            <>
              <Link to={base} onMouseEnter={() => prefetchRoute(base)} onFocus={() => prefetchRoute(base)} className={`nav-pill nav-top mb-1 ${dashActive ? 'nav-pill-active' : ''}`}>
                <span className="nav-group-tile"><LayoutDashboard className="h-[15px] w-[15px]" /></span>
                <span>Dashboard</span>
              </Link>

              {groups.map((group) => {
                if (group.standalone && group.items[0]) {
                  return <div key={group.heading} className="mt-0.5">{navItemLink(group.items[0], undefined, true)}</div>;
                }
                const open = isGroupOpen(group.heading);
                const GIcon = groupIcon(group.heading);
                return (
                  <div key={group.heading} className="mt-0.5">
                    <button
                      type="button"
                      className="nav-group-row gap-2.5"
                      data-active={group.heading === activeHeading}
                      aria-expanded={open}
                      onClick={() => toggleGroup(group.heading)}
                    >
                      <span className="nav-group-tile"><GIcon className="h-[15px] w-[15px]" /></span>
                      <span className="flex-1 min-w-0 truncate text-left">{titleCase(group.heading)}</span>
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--ink-3)] transition-transform duration-[200ms] ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="nav-collapse" data-open={open}>
                      <div inert={!open}>
                        <div className="nav-items">
                          {group.items.map((item) => navItemLink(item))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* WORKSPACE — file tree (hidden in Business mode and for individuals) */}
              {showWorkspace && (() => {
                const open = isGroupOpen('WORKSPACE');
                return (
                  <div className="mt-0.5" onContextMenu={openWorkspaceBg}>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="nav-group-row flex-1 min-w-0 gap-2.5"
                        data-active={wsActive}
                        aria-expanded={open}
                        onClick={() => toggleGroup('WORKSPACE')}
                      >
                        <span className="nav-group-tile"><FolderOpen className="h-[15px] w-[15px]" /></span>
                        <span className="flex-1 min-w-0 truncate text-left">Workspace</span>
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--ink-3)] transition-transform duration-[200ms] ${open ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNewFile}
                        className="shrink-0 rounded-[8px] px-2 py-1 text-[11.5px] font-semibold text-[var(--navy)] hover:bg-[var(--navy-soft)] transition-colors duration-[160ms]"
                      >
                        New file
                      </button>
                    </div>
                    <div className="nav-collapse" data-open={open}>
                      <div inert={!open}>
                        <div className="nav-items">
                          {wsFiles.length === 0
                            ? <p className="text-[11.5px] text-[var(--ink-3)] px-2.5 py-1">No files yet</p>
                            : wsFiles.map(renderFile)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </nav>

        {/* Footer — settings / sign out */}
        <div className="px-2 pt-2 pb-2.5 shrink-0 shadow-[0_-1px_0_rgba(212,226,240,0.7)]">
          {userEmail && (
            <p className="px-2.5 pb-1.5 text-[11px] font-medium text-[var(--ink-3)] truncate" title={userEmail}>{userEmail}</p>
          )}
          <Link to={`${base}/settings`} onMouseEnter={() => prefetchRoute(`${base}/settings`)} onFocus={() => prefetchRoute(`${base}/settings`)} className={`nav-pill nav-top ${settingsActive ? 'nav-pill-active' : ''}`}>
            <span className="nav-group-tile"><Settings className="h-[15px] w-[15px]" /></span>
            <span>Settings</span>
          </Link>
          {/* SIGN OUT SUSPENDED while login is disabled. With no login screen this
              button only wipes local data and bounces back to /companies, so it is
              force-hidden even if Supabase is later configured.
              TO RESTORE: change `false &&` back to `isSupabaseConfigured &&`. */}
          {false && isSupabaseConfigured && (
            <button
              onClick={async () => { try { await supabase?.auth.signOut(); } catch { /* ignore */ } clearLocalDataOnSignOut(); navigate('/auth'); }}
              className="w-full nav-pill hover:bg-[var(--bad-soft)] hover:text-[var(--bad)]"
            >
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {ctxMenu && createPortal(ctxMenu, document.body)}
    </>
  );
});

function CtxItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3.5 py-1.5 text-[13px] transition-colors duration-[160ms] text-left ${
        danger ? 'text-[var(--bad)] hover:bg-[var(--bad-soft)]' : 'text-[var(--ink-2)] hover:bg-[var(--cream-2)]'
      }`}
    >
      {label}
    </button>
  );
}
