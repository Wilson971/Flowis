-- Migration: Create generation_sessions table for Photo Studio
-- Description: Stores AI image generation sessions linking source images to generated outputs

CREATE TABLE IF NOT EXISTS public.generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  source_image_url TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  prompt_used TEXT,
  preset_name TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gen_sessions_product ON public.generation_sessions(product_id);
CREATE INDEX idx_gen_sessions_user ON public.generation_sessions(user_id);
CREATE INDEX idx_gen_sessions_created ON public.generation_sessions(created_at DESC);

ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own generation sessions"
  ON public.generation_sessions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket for studio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-images', 'studio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload studio images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'studio-images');

CREATE POLICY "Anyone can view studio images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'studio-images');

CREATE POLICY "Users can delete own studio images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'studio-images');
