-- ============================================================================
-- Migration: Seed workspaces for existing users
-- Description: Creates workspaces and owner memberships for users who signed up
--              before the workspace trigger was added
-- ============================================================================

-- Create workspaces for existing users who don't have one
INSERT INTO public.workspaces (owner_id, name, slug)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) || '''s Workspace',
  u.id::text
FROM auth.users u
WHERE u.id NOT IN (SELECT owner_id FROM public.workspaces)
ON CONFLICT (slug) DO NOTHING;

-- Add owners as members for any workspace missing its owner membership
INSERT INTO public.workspace_members (workspace_id, user_id, role, status, accepted_at)
SELECT w.id, w.owner_id, 'owner', 'active', now()
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = w.id AND wm.user_id = w.owner_id
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;
