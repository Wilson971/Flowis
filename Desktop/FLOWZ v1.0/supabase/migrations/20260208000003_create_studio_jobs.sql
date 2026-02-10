-- Migration: Create studio_jobs table for Photo Studio batch processing
-- Description: Tracks individual and batch image processing jobs with status lifecycle

CREATE TABLE IF NOT EXISTS public.studio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  input_urls TEXT[] DEFAULT '{}',
  output_urls TEXT[],
  preset_settings JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_studio_jobs_user ON public.studio_jobs(user_id);
CREATE INDEX idx_studio_jobs_product ON public.studio_jobs(product_id);
CREATE INDEX idx_studio_jobs_batch ON public.studio_jobs(batch_id);
CREATE INDEX idx_studio_jobs_status ON public.studio_jobs(status);

ALTER TABLE public.studio_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own studio jobs"
  ON public.studio_jobs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
