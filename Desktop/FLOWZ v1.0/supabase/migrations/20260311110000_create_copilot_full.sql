-- =============================================================
-- Copilot Tables: conversations, messages, settings, memory
-- =============================================================

-- 1. copilot_conversations
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 2. copilot_messages
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tool_calls jsonb,
  feedback jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. copilot_settings (one row per tenant)
CREATE TABLE IF NOT EXISTS public.copilot_settings (
  tenant_id uuid PRIMARY KEY,
  personality jsonb NOT NULL DEFAULT '{"style": "balanced", "tone": "friendly"}'::jsonb,
  autonomy jsonb NOT NULL DEFAULT '{"light": "auto", "medium": "confirm", "heavy": "confirm"}'::jsonb,
  notifications jsonb NOT NULL DEFAULT '{"enabled": true, "types": {"seo_critical": true, "drafts_forgotten": true, "gsc_performance": true, "sync_failed": true, "batch_complete": true, "products_unpublished": false}}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. copilot_memory
CREATE TABLE IF NOT EXISTS public.copilot_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT 'auto',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX idx_copilot_conversations_tenant
  ON public.copilot_conversations (tenant_id, updated_at DESC);

CREATE INDEX idx_copilot_conversations_active
  ON public.copilot_conversations (tenant_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_copilot_messages_conversation
  ON public.copilot_messages (conversation_id, created_at ASC);

CREATE INDEX idx_copilot_memory_tenant
  ON public.copilot_memory (tenant_id);

-- =============================================================
-- Row Level Security
-- =============================================================

ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_memory ENABLE ROW LEVEL SECURITY;

-- conversations: full CRUD
CREATE POLICY "copilot_conversations_select" ON public.copilot_conversations
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "copilot_conversations_insert" ON public.copilot_conversations
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "copilot_conversations_update" ON public.copilot_conversations
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "copilot_conversations_delete" ON public.copilot_conversations
  FOR DELETE USING (tenant_id = auth.uid());

-- messages: SELECT/INSERT via conversation ownership
CREATE POLICY "copilot_messages_select" ON public.copilot_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.copilot_conversations c
      WHERE c.id = conversation_id AND c.tenant_id = auth.uid()
    )
  );

CREATE POLICY "copilot_messages_insert" ON public.copilot_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.copilot_conversations c
      WHERE c.id = conversation_id AND c.tenant_id = auth.uid()
    )
  );

-- settings: SELECT/INSERT/UPDATE
CREATE POLICY "copilot_settings_select" ON public.copilot_settings
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "copilot_settings_insert" ON public.copilot_settings
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "copilot_settings_update" ON public.copilot_settings
  FOR UPDATE USING (tenant_id = auth.uid());

-- memory: SELECT/INSERT/DELETE
CREATE POLICY "copilot_memory_select" ON public.copilot_memory
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "copilot_memory_insert" ON public.copilot_memory
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "copilot_memory_delete" ON public.copilot_memory
  FOR DELETE USING (tenant_id = auth.uid());

-- =============================================================
-- updated_at triggers
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_copilot_conversations_updated_at
  BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_copilot_settings_updated_at
  BEFORE UPDATE ON public.copilot_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
