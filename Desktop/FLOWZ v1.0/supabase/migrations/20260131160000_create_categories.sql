-- Create product_categories table if not exists
create table if not exists public.product_categories (
    id uuid not null default gen_random_uuid(),
    parent_id uuid references public.product_categories(id) on delete set null,
    name text not null,
    slug text not null,
    description text,
    image_url text,
    platform_ids jsonb default '{}'::jsonb, -- Store specific mapping
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    constraint product_categories_pkey primary key (id),
    constraint product_categories_slug_unique unique (slug)
);

-- Enable RLS
alter table public.product_categories enable row level security;

-- Policies (Simplified for now - authenticated users have full access)
create policy "Authenticated users can view categories"
    on public.product_categories for select
    using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert categories"
    on public.product_categories for insert
    with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update categories"
    on public.product_categories for update
    using ( auth.role() = 'authenticated' );

create policy "Authenticated users can delete categories"
    on public.product_categories for delete
    using ( auth.role() = 'authenticated' );

-- Create index for parent_id for faster tree traversal
create index if not exists product_categories_parent_id_idx on public.product_categories(parent_id);
