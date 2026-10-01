/* Keyboard shortcuts inside a company (issue #10).
 *
 *   Ctrl K  (⌘K on a Mac)   Go to — every page in this company's menu
 *   /                       Search the menu (opens the nav first if it is shut)
 *   a letter                Open the menu item whose highlighted letter it is:
 *                           P is Purchase. The second page on that letter takes
 *                           Ctrl P (Purchase Returns), the third Shift P.
 *   ?                       List the shortcuts
 *
 * Chosen to keep out of the browser's and the OS's way: nothing on Ctrl+N/T/W
 * (the browser keeps those), nothing on Ctrl+A/C/F/G/H/J/L/O/R/U/V/X/Y/Z
 * (editing, find, history, address bar, reload …), no F-keys, nothing on Alt
 * (Alt+letter opens the browser's menus on Windows, Alt+←/→ is Back/Forward)
 * and nothing on Ctrl+Alt — that is AltGr on Indian keyboards, where AltGr+4
 * types ₹. Plain and Shift letters never fire while you type in a field or an
 * IME is composing, nothing fires over an open dialog, and Escape and the
 * arrow keys always pass through.
 *
 * Pages come from menuDestinations(), which applies the Sidebar's own rules, so
 * no shortcut can open a page this company's menu hides.
 */

import { useEffect, useRef } from 'react';
import type { EntityConfig } from '@/lib/entityConfig';

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export interface Destination {
  label: string;
  /** Under /company/:id — '' is the dashboard. */
  path: string;
  /** The menu group it sits in, shown beside it in Go to. */
  section?: string;
  /** More words Go to matches on ("tb", "p&l" …). */
  keywords?: string;
}

/** The Sidebar's access-mode key — Business mode leaves the Workspace out. */
const ACCESS_MODE_KEY = 'ca_access_mode';

export function companyHref(companyId: string, path: string): string {
  return path ? `/company/${companyId}/${path}` : `/company/${companyId}`;
}

/** Every page this company's menu shows, in menu order. Mirrors the groups
 *  Sidebar.tsx builds from config.nav — keep the two in step. What the menu
 *  leaves out (Debtors, Creditors, Funds Flow, BS Notes, Share Capital,
 *  Debentures, and anything the entity's flags turn off) is never listed. */
export function menuDestinations(nav: EntityConfig['nav'], entityType: string): Destination[] {
  const list: Destination[] = [{ label: 'Dashboard', path: '', keywords: 'home overview assistant' }];
  const add = (section: string | undefined, label: string, path: string, keywords?: string) => {
    list.push({ section, label, path, keywords });
  };

  if (entityType === 'individual') {
    // An individual's menu is their return and TDS/TCS — nothing else.
    add('Tax & Compliance', 'Income Tax', 'income-tax', 'itr return computation');
    add('Tax & Compliance', 'TDS & TCS', 'tds-register', 'tds tcs');
  } else {
    if (nav.journal) add('Core', 'Journal', 'journal', 'entries vouchers day book');
    if (nav.cashBook) add('Core', 'Cash Book', 'cash-book');

    const reg = 'Registers';
    if (nav.purchaseRegister !== 'never') add(reg, 'Purchase Register', 'purchase-register', 'purchases');
    if (nav.salesRegister !== 'never') add(reg, 'Sales Register', 'sales-register', 'invoices');
    if (nav.purchaseReturns !== 'never') add(reg, 'Purchase Returns', 'purchase-returns', 'debit notes');
    if (nav.salesReturns !== 'never') add(reg, 'Sales Returns', 'sales-returns', 'credit notes');
    if (nav.billsReceivable) add(reg, 'Bills Receivable', 'bills-receivable');
    if (nav.billsPayable) add(reg, 'Bills Payable', 'bills-payable');

    if (nav.ledger) add(undefined, 'Ledger', 'ledger', 'accounts ledgers');

    const fs = 'Financial Statements';
    if (nav.trialBalance) add(fs, 'Trial Balance', 'trial-balance', 'tb');
    if (nav.tradingAccount !== 'never') add(fs, 'Trading Account', 'trading-account', 'gross profit');
    if (nav.profitLoss) add(fs, 'Profit & Loss', 'profit-loss', 'p&l pl income statement');
    if (nav.plAppropriation) add(fs, 'P&L Appropriation', 'pl-appropriation');
    if (nav.balanceSheet) add(fs, 'Balance Sheet', 'balance-sheet', 'bs schedule iii');
    if (nav.cashFlowStatement !== 'never') add(fs, 'Cash Flow Statement', 'cash-flow', 'cfs');
    if (nav.ratioAnalysis) add(fs, 'Ratio Analysis', 'ratio-analysis', 'ratios');
    if (nav.incomeExpenditure) add(fs, 'Income & Expenditure', 'income-expenditure');
    if (nav.receiptsPayments) add(fs, 'Receipts & Payments', 'receipts-payments');

    const sp = 'Special Accounts';
    if (nav.partnersCapital) add(sp, "Partners' Capital", 'partners-capital');
    if (nav.revaluation) add(sp, 'Revaluation Account', 'revaluation');
    if (nav.realisation) add(sp, 'Realisation Account', 'realisation');
    if (nav.kartaCapital) add(sp, "Karta's Capital", 'karta-capital', 'huf');
    if (nav.fundAccounts) add(sp, 'Fund Accounts', 'fund-accounts');
    if (nav.incompleteRecords) add(sp, 'Incomplete Records', 'incomplete-records');
    if (nav.memberRegister) add(sp, 'Member Register', 'member-register');

    const tax = 'Tax & Compliance';
    if (nav.gst !== 'never') add(tax, 'GST', 'gst', 'gstr itc e-way returns');
    if (nav.incomeTax || nav.taxComputation) add(tax, 'Income Tax', 'income-tax', 'itr return computation');
    if (nav.tdsRegister !== 'never' || nav.tcsRegister !== 'never') add(tax, 'TDS & TCS', 'tds-register', 'tds tcs');
    if (nav.advanceTax) add(tax, 'Advance Tax', 'advance-tax');
    if (nav.deferredTax) add(tax, 'Deferred Tax', 'deferred-tax');
    if (nav.audit !== 'never') add(tax, 'Audit', 'audit');

    if (nav.inventory !== 'never') add(undefined, 'Inventory', 'inventory', 'stock');

    const bank = 'Banking';
    if (nav.brs || nav.bankImport) add(bank, 'Bank Accounts', 'bank-accounts', 'banks');
    if (nav.brs) add(bank, 'Bank Reconciliation', 'brs', 'brs');
    if (nav.bankImport) add(bank, 'Bank Import', 'bank-import', 'statement upload');
    add(bank, 'Bank Statement Importer', 'bulk-workspace', 'bulk');
    add('Integrations', 'Tally', 'tally', 'import xml');
    add('Integrations', 'ERP Bridge', 'erp-bridge', 'erp import');

    let business = false;
    try { business = localStorage.getItem(ACCESS_MODE_KEY) === 'business'; } catch { /* storage blocked */ }
    if (!business) add(undefined, 'Workspace', 'folders', 'files folders');
  }

  list.push({ label: 'Settings', path: 'settings', keywords: 'preferences' });
  return list;
}

/** Go to's filter. The label starting with what was typed comes first, then a
 *  start-of-word match on every word typed (label or keywords), then the text
 *  anywhere; menu order within each. An empty query lists the whole menu. */
export function searchDestinations(list: Destination[], query: string): Destination[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const typed = q.split(/\s+/);
  return list
    .map((d, i) => {
      const label = d.label.toLowerCase();
      const text = `${label} ${d.keywords ?? ''}`.toLowerCase();
      const words = text.split(/[\s/()-]+/);
      const rank = label.startsWith(q) ? 0
        : typed.every((t) => words.some((w) => w.startsWith(t))) ? 1
        : text.includes(q) ? 2
        : -1;
      return { d, i, rank };
    })
    .filter((x) => x.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.d);
}

/* ── Menu mnemonics ──────────────────────────────────────────────────────── */

export type MnemonicTier = 0 | 1 | 2;

export interface Mnemonic {
  /** Lower-case: the first letter of the menu label. */
  letter: string;
  /** 0 = the letter alone, 1 = Ctrl (⌘ on a Mac) + letter, 2 = Shift + letter. */
  tier: MnemonicTier;
  /** As printed on this keyboard — for key caps and aria-keyshortcuts. */
  keys: readonly string[];
}

/** Letters free to take Ctrl + letter. The rest belong to the browser or to
 *  editing: Ctrl+A/C/V/X/Y/Z, Ctrl+F find, Ctrl+G find next, Ctrl+H history,
 *  Ctrl+J downloads, Ctrl+K is Go to, Ctrl+L address bar, Ctrl+N/T/W can't be
 *  caught, Ctrl+O open, Ctrl+R reload, Ctrl+U source. Ctrl+P (print) and
 *  Ctrl+S (save page) are taken over: the app has its own PDF, and nothing to
 *  save. */
const CTRL_TIER_LETTERS = new Set(['b', 'd', 'e', 'i', 'm', 'p', 'q', 's']);
const CTRL_LABEL = IS_MAC ? '⌘' : 'Ctrl';

/** The key for each page, by path: the first page on a letter (in menu order)
 *  gets the letter itself, the second Ctrl + letter — or Shift + letter when
 *  the browser owns that Ctrl key — and the third Shift + letter. A fourth
 *  page on the same letter has no key; Go to still finds it. */
export function assignMnemonics(list: Destination[]): Map<string, Mnemonic> {
  const next = new Map<string, number>(); // letter → the tier the next page on it gets
  const out = new Map<string, Mnemonic>();
  for (const d of list) {
    const first = d.label.match(/[a-z]/i);
    if (!first) continue;
    const letter = first[0].toLowerCase();
    let tier = next.get(letter) ?? 0;
    if (tier === 1 && !CTRL_TIER_LETTERS.has(letter)) tier = 2;
    next.set(letter, tier + 1);
    if (tier > 2) continue;
    const cap = letter.toUpperCase();
    out.set(d.path, {
      letter,
      tier: tier as MnemonicTier,
      keys: tier === 0 ? [cap] : tier === 1 ? [CTRL_LABEL, cap] : ['Shift', cap],
    });
  }
  return out;
}

/** Go to's chord as printed on this keyboard, and for aria-keyshortcuts. */
export const GO_TO_KEYS: readonly string[] = IS_MAC ? ['⌘', 'K'] : ['Ctrl', 'K'];
export const GO_TO_ARIA = IS_MAC ? 'Meta+K' : 'Control+K';

/** The letter a key types, lower-cased. When the input language isn't Latin
 *  (Hindi InScript …) it goes by the key's place instead, so P still works. */
export function letterOf(e: KeyboardEvent): string {
  if (/^[a-z]$/i.test(e.key)) return e.key.toLowerCase();
  if (/^[^\x00-\x7f]+$/.test(e.key) && /^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
  return '';
}

/** Ctrl+K (⌘K on a Mac) and nothing more: Ctrl+Shift+K is Firefox's console,
 *  Ctrl+Alt is AltGr, and a Mac's Ctrl+K deletes to the end of the line. */
export function isGoToKey(e: KeyboardEvent): boolean {
  const mod = IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  return mod && !e.altKey && !e.shiftKey && letterOf(e) === 'k';
}

const NON_TEXT_INPUTS = new Set(['button', 'checkbox', 'color', 'file', 'image', 'radio', 'range', 'reset', 'submit']);

/** The key is going into a field, so single-key shortcuts stay out of it. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return !!target.closest('[role="textbox"], [role="searchbox"], [role="combobox"]');
}

/* The app's overlays are hand-rolled (see MODALS in globals.css), so look for
   the marks they share: the panel class, dialog roles, and the veil. */
const DIALOG_SELECTOR = [
  '.ca-modal-panel',
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[aria-modal="true"]',
  '[class*="inset-0"][class*="bg-black/"]',
  '[class*="inset-0"][class*="bg-slate-900/"]',
].join(', ');

/** A dialog, drawer or veil is up — shortcuts leave the keyboard to it. A veil
 *  kept in the page while closed (faded, click-through) doesn't count. */
export function isDialogOpen(): boolean {
  for (const el of document.querySelectorAll<HTMLElement>(DIALOG_SELECTOR)) {
    const style = getComputedStyle(el);
    if (style.visibility !== 'hidden' && style.pointerEvents !== 'none' && el.getClientRects().length > 0) return true;
  }
  return false;
}

const MODIFIER_KEYS = new Set(['Alt', 'AltGraph', 'CapsLock', 'Control', 'Meta', 'OS', 'Shift']);

export interface ShortcutHandlers {
  /** Ctrl/⌘ K */
  onGoTo: () => void;
  /** / */
  onSearchMenu: () => void;
  /** ? */
  onHelp: () => void;
  /** A menu letter at a tier (0 plain, 1 Ctrl/⌘, 2 Shift) — true when it opened a page. */
  onMnemonic: (letter: string, tier: MnemonicTier) => boolean;
}

/** Listens for the shortcuts above for as long as the caller is mounted. */
export function useShortcutKeys(handlers: ShortcutHandlers): void {
  const latest = useRef(handlers);
  useEffect(() => { latest.current = handlers; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Something nearer the key already used it, or an IME is composing.
      if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
      const h = latest.current;
      const richText = e.target instanceof HTMLElement && e.target.isContentEditable;

      // Ctrl/⌘ K types nothing, so it works from a field too — but not from a
      // rich-text editor, where it conventionally means "insert link".
      if (isGoToKey(e)) {
        if (richText || isDialogOpen()) return;
        e.preventDefault(); // or the browser jumps to its address bar
        if (!e.repeat) h.onGoTo();
        return;
      }

      const letter = letterOf(e);

      // Ctrl + letter (⌘ on a Mac) types nothing in a plain field either, so it
      // works there too — not in a rich-text editor, where Ctrl+B/I are bold
      // and italic. A letter no page has stays with the browser.
      const ctrlHeld = IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      if (ctrlHeld && !e.altKey && !e.shiftKey && letter && CTRL_TIER_LETTERS.has(letter)) {
        if (richText || isDialogOpen()) return;
        if (e.repeat) { e.preventDefault(); return; }
        if (h.onMnemonic(letter, 1)) e.preventDefault();
        return;
      }

      // The rest are single keys (Shift at most): never with Ctrl, Alt or ⌘
      // held, never while typing, never over a dialog.
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || MODIFIER_KEYS.has(e.key)) return;
      if (isTypingTarget(e.target) || isDialogOpen()) return;
      if (e.key === '/') { e.preventDefault(); h.onSearchMenu(); return; }
      if (e.key === '?') { e.preventDefault(); h.onHelp(); return; }
      if (letter && h.onMnemonic(letter, e.shiftKey ? 2 : 0)) e.preventDefault();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
