/**
 * Activity Log utility — fire-and-forget insert into activity_log table.
 * Used by hooks to track user actions for the dashboard activity feed.
 */
import { createClient } from '@/lib/supabase/client';

export type ActivityLogType =
    | 'sync'
    | 'generation'
    | 'publication'
    | 'product_edit'
    | 'seo_analysis'
    | 'photo_studio';

export type ActivityLogStatus = 'success' | 'warning' | 'error' | 'info';

interface LogActivityParams {
    type: ActivityLogType;
    title: string;
    description?: string;
    status?: ActivityLogStatus;
    storeId?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity log insertion.
 * Never throws — silently fails if table doesn't exist or insert fails.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        const supabase = createClient();
        await supabase.from('activity_log').insert({
            type: params.type,
            title: params.title,
            description: params.description ?? null,
            status: params.status ?? 'info',
            store_id: params.storeId ?? null,
            metadata: params.metadata ?? {},
        });
    } catch {
        // Silent — activity logging should never block user flows
    }
}
