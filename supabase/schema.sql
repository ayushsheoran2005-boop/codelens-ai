create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) <= 200),
  language text not null check (language in ('Python', 'JavaScript', 'TypeScript')),
  code text not null check (octet_length(code) <= 100000),
  findings jsonb not null default '[]'::jsonb,
  status text not null check (status in ('Complete', 'No issues')),
  source text not null default 'code' check (source in ('code', 'github')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_user_created_idx on public.reviews (user_id, created_at desc);

alter table public.reviews enable row level security;
alter table public.reviews force row level security;

drop policy if exists "Users can view their own reviews" on public.reviews;
create policy "Users can view their own reviews"
  on public.reviews for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own reviews" on public.reviews;
create policy "Users can create their own reviews"
  on public.reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own reviews" on public.reviews;
create policy "Users can delete their own reviews"
  on public.reviews for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.reviews from anon;
grant select, insert, delete on public.reviews to authenticated;
