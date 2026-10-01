'use client';

import { useMemo, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { PageHeader } from '@/components/layout/PageHeader';
import { AddBankAccountDialog } from '@/components/banking/AddBankAccountDialog';
import { getBankDetails, maskAccountNumber } from '@/components/banking/bankDetails';
import { computeAllBalances } from '@/lib/accounting/computeEngine';
import { computeLedger } from '@/lib/accounting/ledgerCompute';
import { normalizeAccountName } from '@/lib/chartOfAccounts';
import { getCustomAccounts } from '@/lib/offlineDb';
import { LEDGER_GROUPS, classifyAccount, getGroupById, type LedgerGroup } from '@/lib/coa';
import { Landmark, Plus, Wallet } from 'lucide-react';

function inr(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const drCr = (signed: number) => (signed >= 0 ? 'Dr' : 'Cr');
const keyOf = (name: string) => normalizeAccountName(name).toLowerCase();

const BANK_GROUP = getGroupById('bank_accounts')!;
const CASH_GROUP = getGroupById('cash_in_hand')!;
// Lines carry the Schedule III sub-group ('Bank Balances') or, from the bulk
// workflow, the Tally-style label ('Bank Accounts') — both name the group.
const groupNames = (g: LedgerGroup) => [g.scheduleIII, g.label];
const KNOWN_GROUPS = new Set(LEDGER_GROUPS.flatMap(groupNames));

/** Bank, cash or neither — by the ledger's group, so "Bank Charges" (Finance
 *  Costs) and "Bank Overdraft" (Short-term Borrowings) are not listed. The
 *  name decides only when the group says nothing: blank, 'Auto', the legacy
 *  'Cash & Bank', or anything else outside the chart. */
function bankCashKind(group: string, name: string): 'bank' | 'cash' | null {
  if (groupNames(BANK_GROUP).includes(group)) return 'bank';
  if (groupNames(CASH_GROUP).includes(group)) return 'cash';
  if (KNOWN_GROUPS.has(group)) return null;
  const guess = classifyAccount(name)?.id;
  if (guess === BANK_GROUP.id) return 'bank';
  if (guess === CASH_GROUP.id || (!guess && /\bcash\b/i.test(name))) return 'cash';
  return null;
}

export default function BankAccountsPage() {
  const { company, companyId, loading } = useCompany();
  const { entries, loading: entriesLoading } = useJournalEntries({ companyId: companyId || '', enabled: !!companyId });
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Bumped after an account is added — the account registry raises no change event.
  const [registryTick, setRegistryTick] = useState(0);

  // Posted bank & cash ledgers, plus registered ones with no postings yet (at
  // nil): a bank account added here has no entries until it is first used.
  const accounts = useMemo(() => {
    if (!companyId) return [];
    const custom = getCustomAccounts(companyId);
    const details = getBankDetails(companyId);
    const idOf = new Map(custom.map((a) => [keyOf(a.name), a.id]));
    const posted = computeAllBalances(entries).map((b) => ({
      name: b.account_name,
      group: b.account_group,
      signed: b.balance_type === 'Dr' ? b.balance : -b.balance,
      hasEntries: true,
    }));
    const seen = new Set(posted.map((a) => keyOf(a.name)));
    const unused = custom
      .filter((a) => !seen.has(keyOf(a.name)))
      .map((a) => ({ name: a.name, group: a.account_group, signed: 0, hasEntries: false }));
    return [...posted, ...unused]
      .flatMap((a) => {
        const kind = bankCashKind(a.group, a.name);
        return kind ? [{ ...a, kind, details: details.get(idOf.get(keyOf(a.name)) ?? '') }] : [];
      })
      .sort((a, b) => Math.abs(b.signed) - Math.abs(a.signed));
  }, [companyId, entries, registryTick]);

  const totalBank = accounts.filter((a) => a.kind === 'bank').reduce((s, a) => s + a.signed, 0);
  const totalCash = accounts.filter((a) => a.kind === 'cash').reduce((s, a) => s + a.signed, 0);
  const hasBank = accounts.some((a) => a.kind === 'bank');

  const ledgerRows = useMemo(() => (selected ? computeLedger(entries, selected) : []), [entries, selected]);

  if (loading || entriesLoading || !company || !companyId) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Bank Accounts" description="Bank & cash ledgers with balances and transactions">
        <button type="button" onClick={() => setAdding(true)} className="btn-pill-primary">
          <Plus className="h-4 w-4" /> Add Bank Account
        </button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="Bank Balances" value={`₹${inr(Math.abs(totalBank))}`} suffix={drCr(totalBank)} />
        <Kpi label="Cash in Hand" value={`₹${inr(Math.abs(totalCash))}`} suffix={drCr(totalCash)} />
        <Kpi label="Accounts" value={String(accounts.length)} />
      </div>

      {/* Account list */}
      <section className="panel" aria-label="Bank and cash accounts">
        <header className="panel-head">
          <h2>Bank &amp; Cash Accounts</h2>
        </header>
        {accounts.length === 0 ? (
          <NoAccounts onAdd={() => setAdding(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="acc-table min-w-[680px]">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th>A/c No.</th>
                  <th>IFSC</th>
                  <th className="r">Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const bankLine = [a.details?.bank_name, a.details?.branch].filter(Boolean).join(' · ');
                  // Bank rows say "not known" with a dash; for cash the columns don't apply.
                  const unknown = a.kind === 'bank' ? <span className="text-[var(--ink-3)]">—</span> : null;
                  return (
                    <tr key={a.name} onClick={() => setSelected(a.name)}
                      className={`cursor-pointer ${selected === a.name ? '!bg-[var(--navy-soft)]/50' : ''}`}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {a.kind === 'bank'
                            ? <Landmark className="h-4 w-4 shrink-0 text-[var(--slate-blue)]" />
                            : <Wallet className="h-4 w-4 shrink-0 text-[var(--slate-blue)]" />}
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--ink)]">{a.name}</p>
                            {bankLine && <p className="text-[11px] text-[var(--ink-3)]">{bankLine}</p>}
                          </div>
                          {!a.hasEntries && <span className="status-idle">No entries</span>}
                        </div>
                      </td>
                      <td>{a.kind === 'bank' ? 'Bank' : 'Cash'}</td>
                      <td>{a.details?.account_number ? <span className="code-pill">{maskAccountNumber(a.details.account_number)}</span> : unknown}</td>
                      <td>{a.details?.ifsc ? <span className="code-pill">{a.details.ifsc}</span> : unknown}</td>
                      <td className="r">
                        {a.hasEntries
                          ? <>{inr(Math.abs(a.signed))} <span className="text-[10px] text-[var(--ink-3)]">{drCr(a.signed)}</span></>
                          : <span className="text-[var(--ink-3)]">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {!hasBank && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-wrap items-center gap-3 py-1">
                        <span className="quick-tile-icon !h-8 !w-8"><Landmark className="h-4 w-4" /></span>
                        <p className="min-w-0 flex-1 text-[12.5px]">No bank account yet — add the company's current or savings account.</p>
                        <button type="button" onClick={() => setAdding(true)} className="btn-pill-outline !h-8">
                          <Plus className="h-3.5 w-3.5" /> Add Bank Account
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Selected account bank book */}
      {selected && (
        <section className="panel" aria-label={`${selected} transactions`}>
          <header className="panel-head">
            <h2 className="min-w-0 truncate">{selected} — Transactions</h2>
            <button type="button" onClick={() => setSelected(null)}
              className="shrink-0 rounded-[8px] px-2 py-1 text-[11.5px] font-semibold text-[var(--navy)] transition-colors duration-[160ms] hover:bg-[var(--navy-soft)]">
              Close
            </button>
          </header>
          <div className="overflow-x-auto">
            <table className="acc-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th>Voucher</th>
                  <th className="r">Deposit (Dr)</th>
                  <th className="r">Withdrawal (Cr)</th>
                  <th className="r">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.length === 0 ? (
                  <tr><td colSpan={6}><p className="py-8 text-center text-[var(--ink-3)]">No transactions for this account yet.</p></td></tr>
                ) : ledgerRows.map((r, i) => (
                  <tr key={i}>
                    <td><span className="font-mono">{r.date}</span></td>
                    <td className="max-w-[260px] truncate">{r.particulars}</td>
                    <td>{r.voucher_type}</td>
                    <td className="r">{r.debit ? inr(r.debit) : '—'}</td>
                    <td className="r">{r.credit ? inr(r.credit) : '—'}</td>
                    <td className="r font-semibold">{inr(r.running_balance)} {r.balance_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {adding && (
        <AddBankAccountDialog
          companyId={companyId}
          onCreated={() => { setAdding(false); setRegistryTick((t) => t + 1); }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

/** Stat tile — eyebrow label over an Inter figure (the bills KpiTile look). */
function Kpi({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--sand)] bg-white p-4 shadow-[var(--shadow-rest)]">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-mono text-[21px] font-semibold leading-none text-[var(--ink)] proportional-nums">
        {value}
        {suffix && <span className="ml-1 text-[11px] font-medium text-[var(--ink-3)]">{suffix}</span>}
      </p>
    </div>
  );
}

/** No bank or cash ledger at all yet — the one thing to do here is add the bank account. */
function NoAccounts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="icon-badge mb-4"><Landmark className="h-5 w-5" /></span>
      <h3>No bank accounts yet</h3>
      <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-[var(--ink-2)]">
        Add the company's current or savings account. It becomes a ledger under Bank Accounts,
        ready for receipts, payments and bank reconciliation.
      </p>
      <button type="button" onClick={onAdd} className="btn-pill-primary mt-5">
        <Plus className="h-4 w-4" /> Add Bank Account
      </button>
    </div>
  );
}
