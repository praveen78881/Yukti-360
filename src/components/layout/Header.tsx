import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Menu } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { ENTITY_TYPES, type EntityType } from '@/lib/constants/entityTypes';
import { runBackInterceptor } from '@/lib/appBack';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { company, loading } = useCompany();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* Back lives here rather than in a strip under the header, so no page pays
     vertical space for it. Hidden on the company root (/company/:id — two
     segments), which is where Back would have nowhere to go. */
  const segments = pathname.split('/').filter(Boolean);
  const canGoBack = segments.length > 2;
  const goBack = () => {
    // a page may own this press (close a drill-in/overlay) — let it claim it first
    if (runBackInterceptor()) return;
    navigate(-1);
  };

  if (loading) {
    return (
      <header className="frost-top h-14 flex items-center px-5 shrink-0 z-30">
        <div className="h-3 w-28 rounded-full bg-[var(--cream)] animate-pulse" />
      </header>
    );
  }

  if (!company) return null;

  const meta = ENTITY_TYPES[company.entity_type as EntityType];

  /* 56px frosted bar. Edges drawn with light, not lines — the hairline lives
     inside the shadow (see .frost-top), never as a border. */
  return (
    <header className="frost-top h-14 flex items-center px-5 gap-2.5 shrink-0 z-30 sticky top-0 select-none">
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--slate-blue)] hover:bg-[var(--navy-soft)] hover:text-[var(--navy)] transition-colors duration-[160ms] shrink-0"
          title="Toggle sidebar"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" strokeWidth={1.7} />
        </button>
      )}

      {/* The logo carries the product name, so it is the title — never typed text.
          Like the company name, it leads back to the companies page. */}
      <Link
        to="/companies"
        title="Back to companies"
        aria-label="Yukti 360 — back to companies"
        className="shrink-0 mr-1 rounded-[8px] px-1 py-0.5 -mx-1 transition-opacity duration-[160ms] hover:opacity-80"
      >
        <BrandLogo height={24} />
      </Link>
      <span className="hidden sm:block h-5 w-px bg-[var(--sand)] shrink-0" aria-hidden="true" />

      {canGoBack && (
        <button
          onClick={goBack}
          className="inline-flex h-8 items-center gap-1 pl-2 pr-3 rounded-full font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-2)] hover:bg-[var(--navy-soft)] hover:text-[var(--navy)] transition-colors duration-[160ms] shrink-0 cursor-pointer"
          title="Back"
          aria-label="Back"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      {/* The company name is the only way back to the companies page. */}
      <Link
        to="/companies"
        title="Back to companies"
        className="font-serif text-[16px] font-bold text-[var(--ink)] truncate max-w-[150px] sm:max-w-[320px] rounded-[8px] px-1.5 py-1 -mx-1.5 hover:text-[var(--navy)] hover:bg-[var(--navy-soft)] transition-colors duration-[160ms]"
      >
        {company.name}
      </Link>

      <span className="code-pill hidden sm:inline-flex shrink-0 !text-[10px] !tracking-[0.1em] uppercase">
        {meta?.shortLabel ?? company.entity_type}
      </span>

      <div className="flex-1" />
    </header>
  );
}
