-- Run in the Supabase SQL Editor as a project owner.
-- Images are public to display; writes are restricted to users in public.admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resort-media', 'resort-media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_admin_media_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin_media_user() from public, anon;
grant execute on function public.is_admin_media_user() to authenticated;

drop policy if exists "Resort media is publicly readable" on storage.objects;
create policy "Resort media is publicly readable"
on storage.objects for select to public
using (bucket_id = 'resort-media');

drop policy if exists "Admins can upload resort media" on storage.objects;
create policy "Admins can upload resort media"
on storage.objects for insert to authenticated
with check (bucket_id = 'resort-media' and public.is_admin_media_user());

drop policy if exists "Admins can update resort media" on storage.objects;
create policy "Admins can update resort media"
on storage.objects for update to authenticated
using (bucket_id = 'resort-media' and public.is_admin_media_user())
with check (bucket_id = 'resort-media' and public.is_admin_media_user());

drop policy if exists "Admins can delete resort media" on storage.objects;
create policy "Admins can delete resort media"
on storage.objects for delete to authenticated
using (bucket_id = 'resort-media' and public.is_admin_media_user());

create table if not exists public.experience_images (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  image_url text not null,
  storage_path text not null unique,
  alt_text_en text,
  alt_text_ar text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists experience_images_gallery_idx
  on public.experience_images (experience_id, sort_order, created_at);
create unique index if not exists experience_images_one_primary_idx
  on public.experience_images (experience_id) where is_primary;
alter table public.experience_images enable row level security;
revoke all on public.experience_images from public, anon, authenticated;
grant all on public.experience_images to service_role;

alter table public.room_images add column if not exists storage_path text;
