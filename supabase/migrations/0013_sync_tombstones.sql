-- ============================================================================
-- 0013 — sync_tombstones
--
-- Records rows the user has deleted, so a deletion propagates across devices and
-- a deleted voucher cannot be resurrected by another device that still holds it.
-- The client also keeps a local copy; this table is the cross-device channel.
-- ============================================================================

create table if not exists public.sync_tombstones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  table_name  text not null,
  row_id      text not null,
  deleted_at  timestamptz not null default now(),
  constraint sync_tombstones_uq unique (user_id, table_name, row_id)
);

create index if not exists sync_tombstones_user_idx
  on public.sync_tombstones (user_id);

-- Stamp user_id from the authenticated user when the client didn't set it.
create or replace function public.set_tombstone_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists a_sync_tombstones_set_user_id on public.sync_tombstones;
create trigger a_sync_tombstones_set_user_id
  before insert or update on public.sync_tombstones
  for each row execute function public.set_tombstone_user_id();

-- Row Level Security — each user sees and writes only their own tombstones.
alter table public.sync_tombstones enable row level security;

drop policy if exists sync_tombstones_all on public.sync_tombstones;
create policy sync_tombstones_all on public.sync_tombstones
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
