-- ============================================================================
-- Migration: Create workspaces table
-- Description: Workspace entity for multi-tenant team management
-- ============================================================================

-- Table workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mon Workspace',
  slug TEXT UNIQUE,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  default_language TEXT NOT NULL DEFAULT 'fr',
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  usage_limits JSONB NOT NULL DEFAULT '{
    "max_products": 50,
    "max_articles": 20,
    "max_stores": 2,
    "max_ai_credits": 100
  }'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workspaces_owner_id ON public.workspaces(owner_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_workspace_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_workspace_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_workspace_updated_at();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Owner can always see their workspace (before members table exists)
CREATE POLICY "Owner can view own workspaces"
  ON public.workspaces FOR SELECT
  USING (owner_id = auth.uid());

-- Owner can update their workspace
CREATE POLICY "Owner can update workspace"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- Authenticated users can create a workspace
CREATE POLICY "Authenticated users can create workspace"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owner can delete their workspace
CREATE POLICY "Owner can delete workspace"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- Storage bucket for workspace assets (logos)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-assets', 'workspace-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload workspace assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workspace-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view workspace assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workspace-assets');

CREATE POLICY "Users can update own workspace assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'workspace-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own workspace assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'workspace-assets'
    AND auth.role() = 'authenticated'
  );
