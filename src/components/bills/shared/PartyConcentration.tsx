import { ACCENT, DEEMPH } from './tokens';
import { formatINR, plural } from './format';

export interface PartyDatum {
  name: string;
  amount: number;
  count: number;
  gstin?: string;
}

interface PartyConcentrationProps {
  /** All parties with an open amount; the component sorts and folds the tail. */
  parties: PartyDatum[];
  /** Show this many parties before folding the rest into "Others". */
  maxRows?: number;
  selected?: string | null;
  onSelect?: (name: string | null) => void;
  /** 'customer' | 'vendor' — used in the fold row and labels. */
  noun?: string;
  emptyText?: string;
}

/** Who holds the money: one horizontal bar per party, ONE series ⇒ one hue and
    no legend box (the panel title names it). Bars are thin, square at the left
    baseline with a 4px rounded end; the value and share sit in text beside the
    bar, never inside it. The tail folds into "Others" instead of more rows. */
export function PartyConcentration({
  parties,
  maxRows = 8,
  selected = null,
  onSelect,
  noun = 'party',
  emptyText = 'No open balances.',
}: PartyConcentrationProps) {
  const sorted = [...parties].filter((p) => p.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = sorted.reduce((s, p) => s + p.amount, 0);
  if (!(total > 0)) return <p className="py-6 text-center text-[12px] text-[var(--ink-2)]">{emptyText}</p>;

  const head = sorted.slice(0, maxRows);
  const tail = sorted.slice(maxRows);
  const tailAmount = tail.reduce((s, p) => s + p.amount, 0);
  const max = head[0]?.amount || 1;

  return (
    <ul className="m-0 list-none space-y-0.5 p-0" aria-label={`Open balance by ${noun}`}>
      {head.map((p) => {
        const isSel = selected === p.name;
        const row = (
          <>
            <span className="min-w-0 flex-[0_1_38%] truncate text-left text-[12.5px] text-[var(--ink)]" title={p.name}>
              {p.name}
            </span>
            <span className="relative h-2 min-w-[40px] flex-1" aria-hidden="true">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px]"
                style={{ width: `${Math.max(1.5, (p.amount / max) * 100)}%`, background: ACCENT, opacity: selected && !isSel ? 0.35 : 1 }}
              />
            </span>
            <span className="w-[118px] shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-[var(--ink)]">{formatINR(p.amount)}</span>
            <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--ink-2)]">{share(p.amount, total)}</span>
          </>
        );
        const cls = `flex w-full items-center gap-3 rounded-[8px] px-2 py-1.5 ${isSel ? 'bg-[var(--navy-soft)]' : ''}`;
        return (
          <li key={p.name}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={isSel}
                title={`${p.name} — ${plural(p.count, 'bill')}`}
                onClick={() => onSelect(isSel ? null : p.name)}
                className={`${cls} transition-colors duration-[160ms] hover:bg-[var(--cream-2)]`}
              >
                {row}
              </button>
            ) : (
              <div className={cls}>{row}</div>
            )}
          </li>
        );
      })}
      {tail.length > 0 && (
        <li className="flex items-center gap-3 px-2 py-1.5">
          <span className="min-w-0 flex-[0_1_38%] truncate text-[12.5px] text-[var(--ink-2)]">Others ({plural(tail.length, noun)})</span>
          <span className="relative h-2 min-w-[40px] flex-1" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${Math.max(1.5, (tailAmount / max) * 100)}%`, background: DEEMPH }} />
          </span>
          <span className="w-[118px] shrink-0 text-right font-mono text-[12px] tabular-nums text-[var(--ink-2)]">{formatINR(tailAmount)}</span>
          <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--ink-2)]">{share(tailAmount, total)}</span>
        </li>
      )}
    </ul>
  );
}

function share(v: number, total: number): string {
  const p = (v / total) * 100;
  return `${p >= 10 ? p.toFixed(0) : p.toFixed(1)}%`;
}
