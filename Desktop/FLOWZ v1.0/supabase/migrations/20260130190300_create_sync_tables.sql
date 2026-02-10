-- Create sync_jobs table
create table if not exists public.sync_jobs (
    id uuid not null default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    job_type text not null default 'import_products',
    status text not null default 'pending', -- pending, discovering, syncing, completed, failed, cancelled
    current_phase text default 'discovery', -- discovery, categories, products, posts, completed
    
    -- Totals (Manifest)
    total_categories integer default 0,
    total_products integer default 0,
    total_variations integer default 0,
    total_posts integer default 0,
    
    -- Progress
    synced_categories integer default 0,
    synced_products integer default 0,
    synced_variations integer default 0,
    synced_posts integer default 0,
    failed_items integer default 0,
    
    -- Metadata
    config jsonb default '{}'::jsonb,
    result jsonb default null,
    error_message text default null,
    
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    constraint sync_jobs_pkey primary key (id)
);

-- Enable RLS for sync_jobs
alter table public.sync_jobs enable row level security;

-- Create sync_logs table
create table if not exists public.sync_logs (
    id uuid not null default gen_random_uuid(),
    job_id uuid not null references public.sync_jobs(id) on delete cascade,
    message text not null,
    type text not null default 'info', -- info, success, warning, error
    metadata jsonb default null,
    created_at timestamp with time zone default now(),
    
    constraint sync_logs_pkey primary key (id)
);

-- Enable RLS for sync_logs
alter table public.sync_logs enable row level security;

-- Policies for sync_jobs (Authenticated users can view/create their own store jobs)
-- Assuming stores are already secured by RLS, we can check store ownership implicitly or explicitly
-- For simplicity in this step, we allow authenticated users to do everything on jobs linked to stores they have access to.

create policy "Users can view sync jobs for their stores"
    on public.sync_jobs for select
    using ( exists ( select 1 from public.stores where stores.id = sync_jobs.store_id ) );

create policy "Users can insert sync jobs for their stores"
    on public.sync_jobs for insert
    with check ( exists ( select 1 from public.stores where stores.id = sync_jobs.store_id ) );

create policy "Users can update sync jobs for their stores"
    on public.sync_jobs for update
    using ( exists ( select 1 from public.stores where stores.id = sync_jobs.store_id ) );

-- Policies for sync_logs
create policy "Users can view sync logs for their jobs"
    on public.sync_logs for select
    using ( exists ( select 1 from public.sync_jobs where sync_jobs.id = sync_logs.job_id ) );

create policy "Users can insert sync logs for their jobs"
    on public.sync_logs for insert
    with check ( exists ( select 1 from public.sync_jobs where sync_jobs.id = sync_logs.job_id ) );

-- Enable Realtime for sync_jobs to support progress UI
alter publication supabase_realtime add table sync_jobs;
