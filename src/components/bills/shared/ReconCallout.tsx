import type { ReactNode } from 'react';
import { formatINR } from './format';

interface ReconCalloutProps {
  /** Outstanding per the BOOKS (ledger/journal) as at `asAtLabel`. */
  booksAmount: number;
  /** Outstanding per recorded BILLS (invoice register). */
  billsAmount: number;
  asAtLabel: string;
  side: 'receivable' | 'payable';
  /** Optional action, e.g. a button that switches the ageing view to Schedule III. */
  action?: ReactNode;
}

/** Books vs bills: the ledger and the invoice register can disagree (e.g. an
    opening balance posted to a control account has no bill behind it). This
    shows both figures and the gap plainly, so nothing looks "missing". Render
    it only when |books − bills| ≥ ₹1. */
export function ReconCallout({ booksAmount, billsAmount, asAtLabel, side, action }: ReconCalloutProps) {
  const gap = booksAmount - billsAmount;
  const who = side === 'receivable' ? 'debtors' : 'creditors';
  return (
    <section
      aria-label="Books versus bills"
      className="rounded-[14px] border border-[var(--sand)] bg-[var(--cream-2)] px-4 py-3 shadow-[var(--shadow-rest)]"
      style={{ boxShadow: 'inset 3px 0 0 var(--slate-blue), var(--shadow-rest)' }}
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <Figure label={`Books · ${who}`} value={formatINR(booksAmount)} />
        <Figure label="Backed by bills" value={formatINR(billsAmount)} />
        <Figure label={gap >= 0 ? 'Not backed by a bill' : 'Bills exceed books'} value={formatINR(Math.abs(gap))} strong />
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <p className="mt-2 max-w-[80ch] text-[12px] leading-relaxed text-[var(--ink-2)]">
        As at {asAtLabel}, the ledger shows {formatINR(booksAmount)} {side === 'receivable' ? 'due from' : 'due to'} {who}, but recorded
        bills account for {formatINR(billsAmount)}. The difference usually comes from opening balances or amounts posted
        straight to the ledger without a bill — it is real in the books, just not bill-wise.
      </p>
    </section>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`mt-1 font-mono text-[15px] leading-none text-[var(--ink)] proportional-nums ${strong ? 'font-bold' : 'font-semibold'}`}>{value}</p>
    </div>
  );
}
