-- ============================================================================
-- Migration: Extend existing workspace schema for FLOWZ MVP
-- Description: Adds missing columns, enum values, RPC, and storage bucket
--              to the pre-existing workspaces / workspace_members tables.
--              Uses IF NOT EXISTS / CREATE OR REPLACE throughout — safe to re-run.
-- ============================================================================

-- ── 1. Extend workspaces table ───────────────────────────────────────────────
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris',
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS usage_limits JSONB DEFAULT '{
    "max_products": 50,
    "max_articles": 20,
    "max_stores": 2,
    "max_ai_credits": 100
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Unique slug constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspaces_slug_key' AND conrelid = 'public.workspaces'::regclass
  ) THEN
    ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_slug_key UNIQUE (slug);
  END IF;
END$$;

-- Index on owner_id
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_workspace_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger (drop + recreate safely)
DROP TRIGGER IF EXISTS set_workspace_updated_at ON public.workspaces;
CREATE TRIGGER set_workspace_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_workspace_updated_at();

-- ── 2. Extend workspace_role enum with editor + viewer ───────────────────────
DO $$
BEGIN
  -- Add 'editor' if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'editor'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workspace_role' AND typnamespace = 'public'::regnamespace)
  ) THEN
    ALTER TYPE public.workspace_role ADD VALUE 'editor';
  END IF;

  -- Add 'viewer' if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'viewer'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workspace_role' AND typnamespace = 'public'::regnamespace)
  ) THEN
    ALTER TYPE public.workspace_role ADD VALUE 'viewer';
  END IF;
END$$;

-- ── 3. Extend workspace_members table ────────────────────────────────────────
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);

-- ── 4. Backfill owner_id from workspace_members for existing workspaces ──────
UPDATE public.workspaces w
SET owner_id = wm.user_id
FROM public.workspace_members wm
WHERE wm.workspace_id = w.id
  AND wm.role = 'owner'
  AND w.owner_id IS NULL;

-- Backfill slug for workspaces without one
UPDATE public.workspaces
SET slug = id::text
WHERE slug IS NULL;

-- ── 5. RLS: Add owner-based policies (idempotent with DROP IF EXISTS) ────────
DROP POLICY IF EXISTS "Owner can view own workspaces" ON public.workspaces;
CREATE POLICY "Owner can view own workspaces"
  ON public.workspaces FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (
    id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owner can update workspace" ON public.workspaces;
CREATE POLICY "Owner can update workspace"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create workspace" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspace"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner can delete workspace" ON public.workspaces;
CREATE POLICY "Owner can delete workspace"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- ── 6. Create get_workspace_usage RPC ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_workspace_usage(p_workspace_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_result JSONB;
BEGIN
  -- Verify caller is a member
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not a member of this workspace';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.workspaces
  WHERE id = p_workspace_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Workspace not found';
  END IF;

  SELECT jsonb_build_object(
    'products', COALESCE((SELECT count(*) FROM public.products WHERE tenant_id = v_owner_id), 0),
    'articles', COALESCE((SELECT count(*) FROM public.blog_posts WHERE tenant_id = v_owner_id), 0),
    'stores',   COALESCE((SELECT count(*) FROM public.stores   WHERE tenant_id = v_owner_id), 0),
    'members',  COALESCE((SELECT count(*) FROM public.workspace_members
                          WHERE workspace_id = p_workspace_id AND status = 'active'), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ── 7. Storage bucket for workspace logos ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-assets', 'workspace-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload workspace assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload workspace assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workspace-assets'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Anyone can view workspace assets" ON storage.objects;
CREATE POLICY "Anyone can view workspace assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workspace-assets');

DROP POLICY IF EXISTS "Users can update own workspace assets" ON storage.objects;
CREATE POLICY "Users can update own workspace assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'workspace-assets'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete own workspace assets" ON storage.objects;
CREATE POLICY "Users can delete own workspace assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'workspace-assets'
    AND auth.role() = 'authenticated'
  );
