-- ============================================================================
-- CA Studio — LEGACY single-user schema.  ⚠️ DO NOT RUN ON A REAL DEPLOYMENT.
--
-- SUPERSEDED by supabase/migrations/0001_core.sql (multi-tenant, per-user RLS
-- scoped to auth.uid()). This file predates auth and its tables/policies would
-- grant the public anon key full access to ALL tenants' data. The guard below
-- aborts if the real multi-tenant schema is already present.
--
-- Kept only for local single-user experimentation. Prefer the migrations.
-- ============================================================================

-- Abort if the multi-tenant journal_entries (has a user_id column) already exists,
-- so this legacy file can never attach permissive policies to the real table.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'journal_entries'
      and column_name = 'user_id'
  ) then
    raise exception 'Refusing to run legacy schema.sql: multi-tenant schema detected. Use supabase/migrations instead.';
  end if;
end $$;

-- ── Chart of accounts (per company) ─────────────────────────────────────────
create table if not exists public.accounts (
  id            uuid primary key default gen_random_uuid(),
  company_id    text not null,
  name          text not null,
  account_group text not null default '',
  nature        text not null check (nature in ('asset','liability','capital','revenue','expense')),
  created_at    timestamptz not null default now(),
  unique (company_id, name)
);
create index if not exists accounts_company_idx on public.accounts (company_id);

-- ── Journal entries (vouchers) ──────────────────────────────────────────────
create table if not exists public.journal_entries (
  id                 uuid primary key default gen_random_uuid(),
  company_id         text not null,
  entry_code         text not null,
  entry_date         date not null,
  voucher_type       text not null,
  voucher_number     text,
  narration          text not null default '',
  book_period        text not null default '',
  is_opening         boolean not null default false,
  is_closing         boolean not null default false,
  party_gstin        text,
  deductee_pan       text,
  tds_deposit_status text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists je_company_date_idx on public.journal_entries (company_id, entry_date);
create unique index if not exists je_company_code_idx on public.journal_entries (company_id, entry_code);

-- ── Journal lines (Dr/Cr legs) ──────────────────────────────────────────────
-- account_id links to accounts(*) for the nested select; the denormalised
-- account_name/group/nature columns let the compute layer work without the join.
create table if not exists public.journal_lines (
  id                  uuid primary key default gen_random_uuid(),
  entry_id            uuid not null references public.journal_entries(id) on delete cascade,
  account_id          uuid references public.accounts(id),
  account_name        text not null,
  account_group       text not null default '',
  nature              text not null,
  debit               numeric not null default 0,
  credit              numeric not null default 0,
  hsn_code            text,
  tds_section         text,
  tds_rate            numeric,
  tcs_section         text,
  tcs_rate            numeric,
  inventory_sub_lines jsonb,
  line_order          int not null default 0
);
create index if not exists jl_entry_idx   on public.journal_lines (entry_id);
create index if not exists jl_account_idx on public.journal_lines (account_id);

-- ── keep updated_at fresh ───────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists je_set_updated_at on public.journal_entries;
create trigger je_set_updated_at before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- RLS is ENABLED with NO permissive policy → default-deny for the anon key.
-- The dangerous `anon all ... using(true)` policies have been REMOVED: they
-- exposed every user's rows to any holder of the public anon key. If you truly
-- need local single-user access, add auth.uid()-scoped policies against a
-- user_id column instead (see supabase/migrations/0001_core.sql).
alter table public.accounts        enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines   enable row level security;

drop policy if exists "anon all" on public.accounts;
drop policy if exists "anon all" on public.journal_entries;
drop policy if exists "anon all" on public.journal_lines;
