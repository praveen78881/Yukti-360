/**
 * CARP Tools — Account Queries (5 tools)
 */

import { listJournalEntries, getCustomAccounts, registerCustomAccount } from '@/lib/offlineDb';
import { getMasterCOAAccounts } from '@/lib/coa';
import type { ToolDeclaration, ToolResult, ToolExecutor } from './types';

/* ── Declarations ── */

export const queriesDeclarations: ToolDeclaration[] = [
  {
    name: 'get_chart_of_accounts',
    description: 'Get the full chart of accounts you MUST reuse from before posting entries: (1) accounts already in use in this company\'s books, (2) custom accounts registered for this company, and (3) the standard master palette. ALWAYS call this before creating/updating journal entries and reuse an existing account\'s exact name + group + nature. Only if nothing fits, call create_account.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_account',
    description: 'Register a NEW ledger account — ONLY when no existing account in get_chart_of_accounts fits. Choose the correct group (Schedule III sub-group like "Trade Receivables", "Revenue from Operations", "Cash & Cash Equivalents") and nature (asset/liability/capital/revenue/expense) from the master palette. The account then persists and can be reused.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Account name (no "A/c" suffix)' },
        account_group: { type: 'string', description: 'Schedule III sub-group / account group' },
        nature: { type: 'string', description: 'asset | liability | capital | revenue | expense' },
      },
      required: ['name', 'account_group', 'nature'],
    },
  },
  {
    name: 'list_accounts',
    description: 'List all unique account names from journal entries with their groups and natures. Useful for discovering what accounts exist.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_account_balance',
    description: 'Get the closing balance of a specific account as of a date.',
    parameters: {
      type: 'object',
      properties: {
        account_name: { type: 'string', description: 'Account name to check' },
        as_of_date: { type: 'string', description: 'Balance as of this date (YYYY-MM-DD). Omit for all-time.' },
      },
      required: ['account_name'],
    },
  },
  {
    name: 'get_financial_summary',
    description: 'Get a quick financial summary: total revenue, expenses, profit/loss, assets, liabilities for a date range.',
    parameters: {
      type: 'object',
      properties: {
        from_date: { type: 'string' },
        to_date: { type: 'string' },
      },
      required: ['from_date', 'to_date'],
    },
  },
];

/* ── Executors ── */

export const queriesExecutors: Record<string, ToolExecutor> = {
  get_chart_of_accounts(_args, companyId) {
    // 1) Accounts already used in this company's books.
    const entries = listJournalEntries(companyId);
    const used = new Map<string, { group: string; nature: string }>();
    for (const e of entries) {
      for (const l of e.lines) {
        if (!used.has(l.account_name)) used.set(l.account_name, { group: l.account_group, nature: l.nature });
      }
    }
    // 2) Custom accounts registered for this company (persist across JE deletion).
    const custom = getCustomAccounts(companyId).map((a) => ({ name: a.name, group: a.account_group, nature: a.nature }));
    // 3) The standard master palette (grouped by sub-group to stay compact).
    const masterByGroup: Record<string, string[]> = {};
    for (const a of getMasterCOAAccounts()) {
      (masterByGroup[a.subGroup] ||= []).push(a.name);
    }
    return {
      success: true,
      data: {
        inUse: Array.from(used.entries()).map(([name, i]) => ({ name, ...i })),
        custom,
        masterPaletteByGroup: masterByGroup,
        rule: 'REUSE an existing account (inUse or custom) with its EXACT name + group + nature whenever one fits. The master palette shows the standard names/groups to prefer. Only call create_account when nothing suitable exists.',
      },
      displayType: 'json',
    };
  },

  create_account(args, companyId) {
    const name = String(args.name ?? '').trim();
    const group = String(args.account_group ?? '').trim();
    const nature = String(args.nature ?? '').trim();
    if (!name || !group || !nature) {
      return { success: false, error: 'name, account_group and nature are all required to create an account.' };
    }
    registerCustomAccount(companyId, name, group, nature);
    return { success: true, data: { created: name, group, nature }, displayType: 'confirmation' };
  },

  list_accounts(_args, companyId) {
    const entries = listJournalEntries(companyId);
    const accounts = new Map<string, { group: string; nature: string }>();
    for (const e of entries) {
      for (const l of e.lines) {
        if (!accounts.has(l.account_name)) {
          accounts.set(l.account_name, { group: l.account_group, nature: l.nature });
        }
      }
    }
    return {
      success: true,
      data: Array.from(accounts.entries()).map(([name, info]) => ({ name, ...info })),
      displayType: 'table',
    };
  },

  get_account_balance(args, companyId) {
    const entries = listJournalEntries(companyId, {
      toDate: args.as_of_date as string | undefined,
    });
    const accountName = args.account_name as string;
    let balance = 0;
    for (const e of entries) {
      for (const l of e.lines) {
        if (l.account_name === accountName) {
          balance += l.debit - l.credit;
        }
      }
    }
    return {
      success: true,
      data: { account: accountName, balance: Math.round(balance * 100) / 100, as_of: args.as_of_date || 'all time' },
      displayType: 'json',
    };
  },

  get_financial_summary(args, companyId) {
    const entries = listJournalEntries(companyId, {
      fromDate: args.from_date as string,
      toDate: args.to_date as string,
    });

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const e of entries) {
      for (const l of e.lines) {
        const nature = l.nature;
        if (nature === 'revenue') {
          totalRevenue += l.credit - l.debit;
        } else if (nature === 'expense') {
          totalExpenses += l.debit - l.credit;
        } else if (nature === 'asset') {
          totalAssets += l.debit - l.credit;
        } else if (nature === 'liability' || nature === 'capital') {
          totalLiabilities += l.credit - l.debit;
        }
      }
    }

    return {
      success: true,
      data: {
        period: `${args.from_date} to ${args.to_date}`,
        totalEntries: entries.length,
        revenue: Math.round(totalRevenue * 100) / 100,
        expenses: Math.round(totalExpenses * 100) / 100,
        profitOrLoss: Math.round((totalRevenue - totalExpenses) * 100) / 100,
        totalAssets: Math.round(totalAssets * 100) / 100,
        totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      },
      displayType: 'json',
    };
  },
};
