-- Schedule gsc-indexation-cron edge function every 2 hours
-- Requires pg_cron and pg_net extensions (already enabled for gsc-sync)

SELECT cron.schedule(
    'gsc-indexation-2h',
    '15 */2 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/gsc-indexation-cron',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);
