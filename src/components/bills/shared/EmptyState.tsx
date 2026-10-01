import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Optional — the user prefers few decorative icons; omit unless it helps. */
  icon?: LucideIcon;
  title: string;
  body?: ReactNode;
  /** Optional action, e.g. a "Clear filters" button. */
  action?: ReactNode;
  className?: string;
}

/** An honest empty state: say what's empty and why, calmly, with one next step. */
export function EmptyState({ icon: Icon, title, body, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      {Icon && (
        <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[11px] bg-[var(--navy-soft)] text-[var(--slate-blue)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <p className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--ink)]">{title}</p>
      {body && <div className="mt-1 max-w-[52ch] text-[12px] leading-relaxed text-[var(--ink-2)]">{body}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
