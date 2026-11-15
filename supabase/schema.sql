-- Horizen database schema for Supabase
-- Run this entire file in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text default '',
  avatar_url text,
  role text not null default 'member' check (role in ('member','moderator','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  location text,
  category text not null default 'Nature',
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), '[^a-zA-Z0-9_]', '', 'g')) || '_' || substr(new.id::text,1,5)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.stories enable row level security;
alter table public.reports enable row level security;

create policy "Profiles are public to read" on public.profiles for select using (true);
create policy "Members update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Posts are public to read" on public.posts for select using (true);
create policy "Members create own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Owners or admins delete posts" on public.posts for delete using (
  auth.uid() = user_id or exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'))
);
create policy "Owners or admins update posts" on public.posts for update using (
  auth.uid() = user_id or exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'))
);

create policy "Likes are public to read" on public.likes for select using (true);
create policy "Members like as themselves" on public.likes for insert with check (auth.uid() = user_id);
create policy "Members remove own likes" on public.likes for delete using (auth.uid() = user_id);

create policy "Comments are public to read" on public.comments for select using (true);
create policy "Members comment as themselves" on public.comments for insert with check (auth.uid() = user_id);
create policy "Owners or moderators remove comments" on public.comments for delete using (
  auth.uid() = user_id or exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'))
);

create policy "Stories are public to read" on public.stories for select using (true);
create policy "Members publish own stories" on public.stories for insert with check (auth.uid() = user_id);
create policy "Owners or moderators delete stories" on public.stories for delete using (
  auth.uid() = user_id or exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'))
);

create policy "Members create reports" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "Members see own reports" on public.reports for select using (
  auth.uid() = reporter_id or exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'))
);
create policy "Moderators manage reports" on public.reports for update using (
  exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'))
);

-- Storage: create a PUBLIC bucket named "photos" in Storage > Buckets.
-- Then add the policies below. Public read is needed for the public gallery.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('photos','photos',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Public can view Horizen photos" on storage.objects
for select using (bucket_id = 'photos');
create policy "Signed-in members upload to their own folder" on storage.objects
for insert to authenticated with check (
  bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Members delete own photos" on storage.objects
for delete to authenticated using (
  bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
);

-- IMPORTANT: after creating your account, promote your own profile to admin
-- by running this in SQL Editor with your sign-up email:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');

-- Helpful indexes for the community feed and moderation queue.
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_category_idx on public.posts(category);
create index if not exists comments_post_created_idx on public.comments(post_id,created_at);
create index if not exists reports_status_created_idx on public.reports(status,created_at desc);
create index if not exists stories_created_at_idx on public.stories(created_at desc);

-- Members may update only their own profile fields through the client.
-- Do not expose role editing in the public client; founder role changes are done in SQL.
drop policy if exists "Members update own profile" on public.profiles;
create policy "Members update own profile fields" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));
