-- Atomic increment for GSC inspection quota counter
-- Prevents race conditions when multiple inspect-batch calls run concurrently

CREATE OR REPLACE FUNCTION public.increment_gsc_inspection_count(
    p_site_id UUID,
    p_count INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gsc_indexation_settings
    SET daily_inspection_count = daily_inspection_count + p_count
    WHERE site_id = p_site_id
      AND quota_reset_date = CURRENT_DATE::TEXT;

    -- If no row matched (new day or missing row), upsert with the count
    IF NOT FOUND THEN
        INSERT INTO public.gsc_indexation_settings (site_id, daily_inspection_count, quota_reset_date)
        VALUES (p_site_id, p_count, CURRENT_DATE::TEXT)
        ON CONFLICT (site_id) DO UPDATE
        SET daily_inspection_count = p_count,
            quota_reset_date = CURRENT_DATE::TEXT;
    END IF;
END;
$$;
