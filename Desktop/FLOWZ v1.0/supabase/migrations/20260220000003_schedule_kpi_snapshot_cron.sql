-- ============================================================
-- Migration: schedule_kpi_snapshot_cron
-- Date: 2026-02-20
-- Purpose: Schedule daily KPI snapshot capture at 00:05 UTC
--          using pg_cron + pg_net to POST to the edge function.
--
-- IMPORTANT: The edge function must be deployed with:
--   supabase functions deploy kpi-snapshot-cron --no-verify-jwt
--
-- To set the service_role_key for pg_cron calls:
--   Run in SQL Editor:
--   ALTER DATABASE postgres SET app.service_role_key = '<your-service-role-key>';
-- ============================================================

-- Remove any existing job with the same name (idempotent)
SELECT cron.unschedule('kpi-snapshot-daily')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'kpi-snapshot-daily'
);

-- Schedule: every day at 00:05 UTC
SELECT cron.schedule(
    'kpi-snapshot-daily',
    '5 0 * * *',
    $$
    SELECT net.http_post(
        url     := 'https://yslkblnkxkthwjjzbktx.supabase.co/functions/v1/kpi-snapshot-cron',
        body    := '{}'::jsonb,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        )
    );
    $$
);
