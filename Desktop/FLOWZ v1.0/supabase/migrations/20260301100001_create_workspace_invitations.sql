-- ============================================================================
-- Migration: Create workspace_invitations table + auto-accept on signup
-- Description: Allows inviting users by email even if they don't have an account
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        public.workspace_role NOT NULL DEFAULT 'editor',
  invited_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_workspace_invitations_workspace ON public.workspace_invitations(workspace_id);
CREATE INDEX idx_workspace_invitations_email ON public.workspace_invitations(email);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Owner/admin of workspace can manage invitations
CREATE POLICY "workspace_invitations_select" ON public.workspace_invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin') AND wm.status = 'active'
    )
    OR workspace_id IN (
      SELECT w.id FROM public.workspaces w WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_invitations_insert" ON public.workspace_invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin') AND wm.status = 'active'
    )
    OR workspace_id IN (
      SELECT w.id FROM public.workspaces w WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_invitations_delete" ON public.workspace_invitations
  FOR DELETE USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin') AND wm.status = 'active'
    )
    OR workspace_id IN (
      SELECT w.id FROM public.workspaces w WHERE w.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Trigger: Auto-accept pending workspace invitations on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_accept_workspace_invitations()
RETURNS trigger AS $$
BEGIN
  -- Find pending invitations for this email and create memberships
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status, invited_by, accepted_at)
  SELECT
    wi.workspace_id,
    NEW.id,
    wi.role,
    'active',
    wi.invited_by,
    now()
  FROM public.workspace_invitations wi
  WHERE wi.email = NEW.email
    AND wi.accepted_at IS NULL
    AND wi.expires_at > now()
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- Mark invitations as accepted
  UPDATE public.workspace_invitations
  SET accepted_at = now()
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_accept_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_accept_workspace_invitations();

-- ============================================================================
-- Fix: Ensure workspace owner always has a membership row
-- (for users whose seed migration may not have run)
-- ============================================================================
INSERT INTO public.workspace_members (workspace_id, user_id, role, status, accepted_at)
SELECT w.id, w.owner_id, 'owner', 'active', now()
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = w.id AND wm.user_id = w.owner_id
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;
