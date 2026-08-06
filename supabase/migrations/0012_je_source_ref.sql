-- ============================================================================
-- 0012 — journal_entries.source_ref
--
-- Optional provenance marker mirrored from the app's JournalEntry.source_ref
-- (e.g. 'bulk_suspense:<id>' for bank-import allocations). Lets a source flow
-- find and reverse exactly the entries it created, preventing double-posting
-- when a bank-import row is re-classified.
-- ============================================================================

alter table public.journal_entries
  add column if not exists source_ref text;

create index if not exists journal_entries_source_ref_idx
  on public.journal_entries (source_ref)
  where source_ref is not null;
