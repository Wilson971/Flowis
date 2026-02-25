-- Schedule auto-index edge function every hour
-- Processes sites with auto_index_new or auto_index_updated enabled
-- Inspects: new URLs (no status row) + updated URLs (lastmod > inspected_at)

SELECT cron.schedule(
    'gsc-auto-index-hourly',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/auto-index',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);
