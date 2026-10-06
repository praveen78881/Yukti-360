'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/* Page title: 27px Playfair Display in mixed case — the premium serif "look"
   from the reference crop, and the widest type on the screen. The sentence
   under it is capped at ~72 characters so it never runs the width of a wide
   table. */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 gap-5">
      <div className="min-w-0">
        <h1 className="font-serif text-[27px] font-semibold tracking-[0.005em] text-[var(--ink)] leading-[1.15]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[72ch] text-[11.5px] leading-relaxed text-[var(--ink-3)]">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
