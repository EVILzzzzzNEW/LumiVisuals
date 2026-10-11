-- LumiVisuals Supabase schema — run once in Supabase SQL Editor.
-- Profiles: one row per auth user. Launcher codes: one-time login approval.

create table if not exists profiles (
  uid uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text default 'Player',
  avatar text default 'assets/logo.png',
  hours numeric default 0,
  version text default 'minimal',
  accent text default 'white',
  ram int default 4,
  updated timestamptz default now()
);

create table if not exists launcher_codes (
  code text primary key,
  uid uuid references auth.users(id) on delete cascade,
  name text,
  avatar text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table launcher_codes enable row level security;

drop policy if exists "own profile read" on profiles;
create policy "own profile read" on profiles for select using (auth.uid() = uid);
drop policy if exists "own profile write" on profiles;
create policy "own profile write" on profiles for all using (auth.uid() = uid) with check (auth.uid() = uid);

drop policy if exists "own codes" on launcher_codes;
create policy "own codes" on launcher_codes for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- Storage: create bucket "avatars" (public) in Dashboard → Storage, then:
-- make it public so <img> tags load; uploads restricted by policy below is optional.
-- If you prefer private bucket, add select policy; public is simplest for avatars.
