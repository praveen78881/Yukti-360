import { AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { STATUS_META, type BillStatus } from './buckets';

const ICONS: Record<BillStatus, LucideIcon> = {
  settled: CheckCircle2,
  overdue: AlertTriangle,
  due_soon: Clock,
  due: CalendarClock,
  no_due: CircleDashed,
};

/* Status is never colour alone: every chip carries an icon AND a label, on the
   soft/solid pair of its colour (dark text tones, ≥ 5.3:1 on their fills). */
const TONE: Record<'ok' | 'warn' | 'bad' | 'idle', string> = {
  ok: 'bg-[var(--ok-soft)] text-[#245F45]',
  warn: 'bg-[var(--warn-soft)] text-[#8A530F]',
  bad: 'bg-[var(--bad-soft)] text-[#8C2E27]',
  idle: 'bg-[var(--cream)] text-[var(--ink-2)]',
};

interface StatusChipProps {
  status: BillStatus;
  /** Optional detail appended after the label, e.g. "12 d". */
  detail?: string;
  className?: string;
}

/** Bill status pill: Settled · Overdue · Due soon · Not yet due · No due date. */
export function StatusChip({ status, detail, className = '' }: StatusChipProps) {
  const meta = STATUS_META[status];
  const Icon = ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.08em] ${TONE[meta.tone]} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {meta.label}
      {detail && <span className="font-mono normal-case tracking-normal opacity-90">· {detail}</span>}
    </span>
  );
}

interface TagProps {
  children: string;
  /** Hover/assistive explanation, e.g. "Brought forward from an earlier year". */
  title?: string;
  className?: string;
}

/** Small neutral tag for secondary facts: "Part-paid", "B/F", "Draft",
    "Cancelled", "Debit note" — never a status colour. */
export function Tag({ children, title, className = '' }: TagProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center whitespace-nowrap rounded-full border border-[var(--sand)] bg-white px-1.5 py-px font-display text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-2)] ${className}`}
    >
      {children}
    </span>
  );
}
