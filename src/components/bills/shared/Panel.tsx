import type { ReactNode } from 'react';

interface PanelProps {
  /** Oswald caps panel heading. */
  title: string;
  /** Optional one-line sentence under the title. */
  description?: string;
  /** Right-aligned header actions (toggles, filters, small buttons). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Padding etc. for the body; defaults to the design system's panel body. */
  bodyClassName?: string;
}

/** A design-system panel: white, 14px radius, hairline border, resting shadow,
    header strip with an Oswald caps title. Panels never nest. */
export function Panel({ title, description, actions, children, className = '', bodyClassName = 'panel-body' }: PanelProps) {
  return (
    <section className={`panel ${className}`} aria-label={title}>
      <header className="panel-head">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {description && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--ink-2)]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
