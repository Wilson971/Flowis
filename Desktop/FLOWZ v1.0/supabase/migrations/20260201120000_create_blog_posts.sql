-- Create table for Blog Posts
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  author_id uuid references auth.users(id) on delete set null,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  tags jsonb default '[]'::jsonb,
  seo_title text,
  seo_description text,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table blog_posts enable row level security;

-- Policies
create policy "Public can view published posts" on blog_posts
  for select using (status = 'published');

create policy "Authenticated users can view all posts" on blog_posts
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert posts" on blog_posts
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update posts" on blog_posts
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete posts" on blog_posts
  for delete using (auth.role() = 'authenticated');

-- Indexes
create index blog_posts_slug_idx on blog_posts(slug);
create index blog_posts_status_idx on blog_posts(status);
create index blog_posts_created_at_idx on blog_posts(created_at);
