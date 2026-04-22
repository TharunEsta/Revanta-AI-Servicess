create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text not null,
  role text not null,
  email text not null,
  rating integer not null check (rating between 1 and 5),
  service_used text not null,
  project_type text not null,
  review_text text not null,
  permission_to_publish boolean not null default false,
  profile_image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified_client boolean not null default true,
  submitted_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz
);

create index if not exists reviews_status_idx on public.reviews (status);
create index if not exists reviews_submitted_at_idx on public.reviews (submitted_at desc);
create index if not exists reviews_rating_idx on public.reviews (rating desc);

alter table public.reviews enable row level security;

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews
for select
using (status = 'approved');
