/**
 * CARP Tools — Projector (1 tool)
 *
 * Lets the assistant SHOW the CA a report instead of describing it: the
 * dashboard avatar captures the requested page and projects it from its visor
 * as a hologram. Tools here are synchronous, so this one only validates and
 * hands the request to whoever is listening on the projector bus; the capture
 * itself happens asynchronously in the UI. Off the dashboard nothing is
 * listening, and the tool says so rather than pretending — the model can fall
 * back to navigate_to_page.
 */

import type { ToolDeclaration, ToolExecutor } from './types';

/* ── The reports the projector can show ── */

export interface ProjectableReport {
  title: string;
  /** route under /company/:id/ */
  path: string;
}

export const PROJECTABLE_REPORTS = {
  trial_balance:     { title: 'Trial Balance',             path: 'trial-balance' },
  profit_loss:       { title: 'Profit & Loss',             path: 'profit-loss' },
  balance_sheet:     { title: 'Balance Sheet',             path: 'balance-sheet' },
  trading_account:   { title: 'Trading Account',           path: 'trading-account' },
  cash_flow:         { title: 'Cash Flow Statement',       path: 'cash-flow' },
  funds_flow:        { title: 'Funds Flow Statement',      path: 'funds-flow' },
  ratio_analysis:    { title: 'Ratio Analysis',            path: 'ratio-analysis' },
  journal:           { title: 'Journal',                   path: 'journal' },
  cash_book:         { title: 'Cash Book',                 path: 'cash-book' },
  ledger:            { title: 'Ledger',                    path: 'ledger' },
  sales_register:    { title: 'Sales Register',            path: 'sales-register' },
  purchase_register: { title: 'Purchase Register',         path: 'purchase-register' },
  debtors:           { title: 'Debtors',                   path: 'debtors' },
  creditors:         { title: 'Creditors',                 path: 'creditors' },
  fixed_assets:      { title: 'Fixed Assets',              path: 'fixed-assets' },
  depreciation:      { title: 'Depreciation',              path: 'depreciation' },
  gst_summary:       { title: 'GST Summary',               path: 'gst' },
  gstr1:             { title: 'GSTR-1',                    path: 'gst/gstr1' },
  gstr3b:            { title: 'GSTR-3B',                   path: 'gst/gstr3b' },
  itc_register:      { title: 'ITC Register',              path: 'gst/itc-register' },
  tds_register:      { title: 'TDS & TCS Register',        path: 'tds-register' },
  bank_reconciliation: { title: 'Bank Reconciliation',     path: 'brs' },
} satisfies Record<string, ProjectableReport>;

export type ProjectableKey = keyof typeof PROJECTABLE_REPORTS;

/** One slide of a projection, fully resolved. */
export interface ProjectionItem {
  key: ProjectableKey;
  title: string;
  /** route under /company/:id/, including any query string */
  path: string;
}

export interface ProjectionRequest {
  id: string;
  companyId: string;
  items: ProjectionItem[];
}

/* ── The bus: the tool emits, the dashboard projector listens ── */

type Listener = (req: ProjectionRequest) => void;
const listeners = new Set<Listener>();

export const projectorBus = {
  /** Subscribe; returns an unsubscribe. While anyone listens, the tool is live. */
  listen(fn: Listener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  get active(): boolean {
    return listeners.size > 0;
  },
  emit(req: ProjectionRequest) {
    listeners.forEach((fn) => fn(req));
  },
};

/* ── Declaration ── */

const KEYS = Object.keys(PROJECTABLE_REPORTS) as ProjectableKey[];
const MAX_SLIDES = 4;

export const projectorDeclarations: ToolDeclaration[] = [
  {
    name: 'show_on_projector',
    description:
      'SHOW the CA one or more reports from the books as a hologram projected from the assistant\'s visor. ' +
      'Use this whenever the CA asks to see, show, display, pull up or look at a report (e.g. "show me the trial balance", ' +
      '"let me see the P&L and balance sheet", "show the ledger of HDFC Bank"). Several reports may be shown at once ' +
      `(max ${MAX_SLIDES}); they appear as slides. For a single account's ledger use report "ledger" with ledger_name. ` +
      'After calling it, say in one short sentence what is on screen. Only works on the dashboard; elsewhere use navigate_to_page.',
    parameters: {
      type: 'object',
      properties: {
        reports: {
          type: 'array',
          description: 'Reports to project, in the order to show them.',
          items: { type: 'string', enum: KEYS },
        },
        ledger_name: {
          type: 'string',
          description: 'Exact account name when "ledger" is requested (e.g. "HDFC Bank"). Omit to show all ledger accounts.',
        },
      },
      required: ['reports'],
    },
  },
];

/* ── Executor ── */

export const projectorExecutors: Record<string, ToolExecutor> = {
  show_on_projector(args, companyId) {
    if (!projectorBus.active) {
      return {
        success: false,
        error: 'The projector is only available on the dashboard. Use navigate_to_page to open the report instead.',
      };
    }

    const raw = Array.isArray(args.reports) ? args.reports : [args.reports];
    const ledgerName = typeof args.ledger_name === 'string' ? args.ledger_name.trim() : '';
    const seen = new Set<string>();
    const items: ProjectionItem[] = [];
    const unknown: string[] = [];

    for (const r of raw) {
      const key = String(r ?? '').trim() as ProjectableKey;
      if (!key || seen.has(key)) continue;
      const def = PROJECTABLE_REPORTS[key];
      if (!def) { unknown.push(String(r)); continue; }
      seen.add(key);
      const isNamedLedger = key === 'ledger' && ledgerName;
      items.push({
        key,
        title: isNamedLedger ? `Ledger — ${ledgerName}` : def.title,
        path: isNamedLedger ? `${def.path}?account=${encodeURIComponent(ledgerName)}` : def.path,
      });
      if (items.length === MAX_SLIDES) break;
    }

    if (items.length === 0) {
      return {
        success: false,
        error: `Nothing to project. Valid reports: ${KEYS.join(', ')}.${unknown.length ? ` Unknown: ${unknown.join(', ')}.` : ''}`,
      };
    }

    projectorBus.emit({ id: crypto.randomUUID(), companyId, items });
    return {
      success: true,
      data: {
        projecting: items.map((i) => i.title),
        ...(unknown.length ? { skipped_unknown: unknown } : {}),
      },
      displayType: 'text',
    };
  },
};
