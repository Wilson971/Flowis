-- ============================================================================
-- Migration: Create workspace_members table + trigger + RPC
-- Description: Team management with roles and auto-creation on signup
-- ============================================================================

-- Role and status enums
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE public.member_status AS ENUM ('active', 'invited', 'removed');

-- Table workspace_members
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.workspace_role NOT NULL DEFAULT 'viewer',
  status public.member_status NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Indexes
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_status ON public.workspace_members(status);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their workspace
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

-- Owners and admins can add members
CREATE POLICY "Admins can add members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin') AND wm.status = 'active'
    )
    -- Also allow the trigger (SECURITY DEFINER) to insert
    OR auth.uid() = user_id
  );

-- Owners and admins can update member roles
CREATE POLICY "Admins can update members"
  ON public.workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin') AND wm.status = 'active'
    )
  );

-- Owners/admins can remove members, members can leave
CREATE POLICY "Admins can remove members or self-leave"
  ON public.workspace_members FOR DELETE
  USING (
    -- Admins/owners can remove anyone
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin') AND wm.status = 'active'
    )
    -- Members can leave (remove themselves)
    OR user_id = auth.uid()
  );

-- ============================================================================
-- Add member-based SELECT policy to workspaces (complement owner-only policy)
-- ============================================================================
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (
    id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

-- ============================================================================
-- Auto-create workspace on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS trigger AS $$
DECLARE
  v_workspace_id UUID;
  v_name TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create workspace
  INSERT INTO public.workspaces (owner_id, name, slug)
  VALUES (NEW.id, v_name || '''s Workspace', NEW.id::text)
  RETURNING id INTO v_workspace_id;

  -- Add owner as member
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status, accepted_at)
  VALUES (v_workspace_id, NEW.id, 'owner', 'active', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();

-- ============================================================================
-- RPC: Get workspace usage counts for plan display
-- ============================================================================
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
    WHERE workspace_id = p_workspace_id AND user_id = auth.uid() AND status = 'active'
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
    'stores', COALESCE((SELECT count(*) FROM public.stores WHERE tenant_id = v_owner_id), 0),
    'members', COALESCE((SELECT count(*) FROM public.workspace_members WHERE workspace_id = p_workspace_id AND status = 'active'), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
