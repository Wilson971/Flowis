-- Schedule inspect-batch edge function every 5 minutes
-- Processes 20 URLs per site per run — handles any store size automatically
-- Sites with no uninspected URLs are skipped automatically

-- Remove existing 2h schedule if you want to replace it (optional)
-- SELECT cron.unschedule('gsc-indexation-2h');

SELECT cron.schedule(
    'gsc-inspect-batch-5min',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/inspect-batch',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := jsonb_build_object('batchSize', 20)
    );
    $$
);
