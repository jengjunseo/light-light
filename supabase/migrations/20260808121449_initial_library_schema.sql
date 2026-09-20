-- Light Novel Collection is intentionally a single-user app without authentication.
-- The anon policies below match that product decision. Deploy only behind a trusted URL.

create table public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.works (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.series(id) on delete set null,
  volume_number integer check (volume_number is null or volume_number >= 0),
  title text not null check (char_length(trim(title)) > 0),
  status text not null default 'unread' check (status in ('unread', 'reading', 'completed', 'paused')),
  cover_image_url text not null default '',
  synopsis_source text not null default '',
  synopsis_generated text not null default '',
  namuwiki_url text not null default '',
  google_search_url text not null default '',
  custom_links jsonb not null default '[]'::jsonb check (jsonb_typeof(custom_links) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volume_requires_series check (series_id is not null or volume_number is null)
);

create table public.memos (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index works_series_volume_idx on public.works(series_id, volume_number);
create index works_status_idx on public.works(status);
create index works_updated_at_idx on public.works(updated_at desc);
create index works_title_lower_idx on public.works(lower(title));
create index series_title_lower_idx on public.series(lower(title));
create index memos_work_updated_idx on public.memos(work_id, updated_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger works_set_updated_at
before update on public.works
for each row execute function public.set_updated_at();

create trigger memos_set_updated_at
before update on public.memos
for each row execute function public.set_updated_at();

create function public.detach_series_works()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.works
  set series_id = null, volume_number = null
  where series_id = old.id;
  return old;
end;
$$;

create trigger series_detach_works
before delete on public.series
for each row execute function public.detach_series_works();

revoke all on table public.series, public.works, public.memos from anon, authenticated;
grant select, insert, update, delete on table public.series, public.works, public.memos to anon, authenticated;

alter table public.series enable row level security;
alter table public.works enable row level security;
alter table public.memos enable row level security;

create policy "personal app access to series"
on public.series for all to anon, authenticated
using (true) with check (true);

create policy "personal app access to works"
on public.works for all to anon, authenticated
using (true) with check (true);

create policy "personal app access to memos"
on public.memos for all to anon, authenticated
using (true) with check (true);
