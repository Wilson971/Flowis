-- ============================================================
-- Schedule GSC keyword sync every 6 hours
-- Requires pg_cron and pg_net extensions
-- ============================================================

SELECT cron.schedule(
  'gsc-sync-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url', true) || '/functions/v1/gsc-sync',
    body    := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  );
  $$
);
