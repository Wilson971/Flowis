/**
 * useRecentActivity - Composite activity feed from real tables
 *
 * Sources (merged, sorted by date):
 * - activity_log      (native events: generation, publication, seo_analysis…)
 * - blog_articles     (recent creates / publishes)
 * - sync_jobs         (sync operations with duration + fail count)
 * - studio_jobs       (photo studio jobs with product name)
 * - products          (recent AI-generated descriptions)
 */
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { fr } from 'date-fns/locale';

export type ActivityType =
  | 'sync'
  | 'product_update'
  | 'error'
  | 'generation'
  | 'publication'
  | 'seo_analysis'
  | 'photo_studio';

export type ActivityMetaChip = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
};

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  status: 'success' | 'warning' | 'error' | 'info';
  /** Optional enrichment chips rendered below the description */
  meta?: ActivityMetaChip[];
}

export function useRecentActivity(storeId?: string, limit = 12) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['recent-activity', storeId, limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      const items: ActivityItem[] = [];

      // ── 1. activity_log (native enriched events) ────────────────────────
      let actLogQuery = supabase
        .from('activity_log')
        .select('id, type, title, description, status, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(6);
      if (storeId) actLogQuery = actLogQuery.eq('store_id', storeId);

      // ── 2. blog_articles ────────────────────────────────────────────────
      let blogQuery = supabase
        .from('blog_articles')
        .select('id, title, status, created_at, updated_at')
        .eq('archived', false)
        .neq('status', 'auto_draft')
        .order('updated_at', { ascending: false })
        .limit(5);
      if (storeId) blogQuery = blogQuery.eq('store_id', storeId);

      // ── 3. sync_jobs ────────────────────────────────────────────────────
      let syncQuery = supabase
        .from('sync_jobs')
        .select('id, job_type, status, synced_products, total_products, failed_items, error_message, started_at, created_at, completed_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (storeId) syncQuery = syncQuery.eq('store_id', storeId);

      // ── 4. studio_jobs ───────────────────────────────────────────────────
      const studioQuery = supabase
        .from('studio_jobs')
        .select('id, action, status, error_message, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // ── 5. products — recent AI generations ─────────────────────────────
      let productsQuery = supabase
        .from('products')
        .select('id, name, seo_score, updated_at')
        .not('working_content', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(4);
      if (storeId) productsQuery = productsQuery.eq('store_id', storeId);

      const results = await Promise.allSettled([actLogQuery, blogQuery, syncQuery, studioQuery, productsQuery]);
      const [r0, r1, r2, r3, r4] = results;
      const actLogs    = r0.status === 'fulfilled' ? r0.value.data : null;
      const blogs      = r1.status === 'fulfilled' ? r1.value.data : null;
      const syncs      = r2.status === 'fulfilled' ? r2.value.data : null;
      const studioJobs = r3.status === 'fulfilled' ? r3.value.data : null;
      const products   = r4.status === 'fulfilled' ? r4.value.data : null;

      console.group('[useRecentActivity] debug');
      console.log('storeId:', storeId);
      console.log('activity_log:', r0.status === 'fulfilled' ? { data: r0.value.data?.length, error: r0.value.error } : r0.reason);
      console.log('blog_articles:', r1.status === 'fulfilled' ? { data: r1.value.data?.length, error: r1.value.error } : r1.reason);
      console.log('sync_jobs:',     r2.status === 'fulfilled' ? { data: r2.value.data?.length, error: r2.value.error } : r2.reason);
      console.log('studio_jobs:',   r3.status === 'fulfilled' ? { data: r3.value.data?.length, error: r3.value.error } : r3.reason);
      console.log('products:',      r4.status === 'fulfilled' ? { data: r4.value.data?.length, error: r4.value.error } : r4.reason);
      console.groupEnd();

      // ── Map activity_log ─────────────────────────────────────────────────
      for (const a of actLogs || []) {
        const meta: ActivityMetaChip[] = [];
        const md = (a.metadata as Record<string, unknown>) || {};
        if (md.count != null)  meta.push({ label: `${md.count} éléments` });
        if (md.score != null)  meta.push({ label: `SEO ${md.score}/100`, variant: Number(md.score) >= 70 ? 'success' : 'warning' });
        if (md.words != null)  meta.push({ label: `${md.words} mots` });
        items.push({
          id: `log-${a.id}`,
          type: (a.type as ActivityType) || 'info',
          title: a.title,
          description: a.description || '',
          timestamp: a.created_at,
          timeAgo: formatTimeAgo(a.created_at),
          status: (a.status as ActivityItem['status']) || 'info',
          meta: meta.length > 0 ? meta : undefined,
        });
      }

      // ── Map blog_articles ────────────────────────────────────────────────
      for (const b of blogs || []) {
        const isPublished = b.status === 'publish' || b.status === 'published';
        const isDraft = b.status === 'draft';
        const displayTitle = b.title || 'Article sans titre';
        const meta: ActivityMetaChip[] = [];
        meta.push({
          label: isPublished ? 'Publié' : isDraft ? 'Brouillon' : b.status,
          variant: isPublished ? 'success' : 'default',
        });
        items.push({
          id: `blog-${b.id}`,
          type: isPublished ? 'publication' : 'generation',
          title: isPublished ? 'Article publié' : 'Article créé',
          description: displayTitle.length > 55 ? displayTitle.slice(0, 52) + '…' : displayTitle,
          timestamp: b.updated_at || b.created_at,
          timeAgo: formatTimeAgo(b.updated_at || b.created_at),
          status: isPublished ? 'success' : 'info',
          meta,
        });
      }

      // ── Map sync_jobs ────────────────────────────────────────────────────
      for (const s of syncs || []) {
        const isFailed = s.status === 'failed';
        const isComplete = s.status === 'completed';
        const meta: ActivityMetaChip[] = [];
        if (s.synced_products != null && s.total_products != null) {
          meta.push({ label: `${s.synced_products}/${s.total_products} produits` });
        } else if (s.synced_products != null) {
          meta.push({ label: `${s.synced_products} produits` });
        }
        if (s.failed_items && s.failed_items > 0) {
          meta.push({ label: `${s.failed_items} échecs`, variant: 'error' });
        }
        if (s.started_at && s.completed_at) {
          const secs = differenceInSeconds(new Date(s.completed_at), new Date(s.started_at));
          if (secs > 0) meta.push({ label: formatDuration(secs) });
        }
        let description = '';
        if (isFailed) {
          description = s.error_message
            ? s.error_message.slice(0, 55) + (s.error_message.length > 55 ? '…' : '')
            : 'Échec de la synchronisation';
        } else if (isComplete) {
          description = `${s.synced_products || 0} produits synchronisés`;
        } else {
          description = `En cours — ${s.synced_products || 0} traités`;
        }
        items.push({
          id: `sync-${s.id}`,
          type: isFailed ? 'error' : 'sync',
          title: s.job_type === 'full_sync' ? 'Sync complète' : 'Synchronisation',
          description,
          timestamp: s.completed_at || s.created_at,
          timeAgo: formatTimeAgo(s.completed_at || s.created_at),
          status: isFailed ? 'error' : isComplete ? 'success' : 'info',
          meta: meta.length > 0 ? meta : undefined,
        });
      }

      // ── Map studio_jobs ──────────────────────────────────────────────────
      const actionLabels: Record<string, string> = {
        remove_bg:        'Suppression fond',
        replace_bg:       'Remplacement fond',
        enhance:          'Amélioration photo',
        generate_angles:  'Angles produit',
        generate_scene:   'Scène produit',
        replace_bg_white: 'Fond blanc',
        replace_bg_studio:'Fond studio',
        enhance_light:    'Éclairage',
        enhance_color:    'Couleurs',
        harmonize:        'Harmonisation',
        magic_edit:       'Édition magique',
      };

      for (const j of studioJobs || []) {
        const isFailed = j.status === 'failed';
        const isDone = j.status === 'done';
        const meta: ActivityMetaChip[] = [];
        meta.push({ label: isFailed ? 'Échec' : isDone ? 'Terminé' : 'En cours', variant: isFailed ? 'error' : isDone ? 'success' : 'default' });
        const description = isFailed && j.error_message
          ? j.error_message.slice(0, 55)
          : isDone ? 'Traitement terminé' : 'En cours…';
        items.push({
          id: `studio-${j.id}`,
          type: isFailed ? 'error' : 'photo_studio',
          title: actionLabels[j.action] || 'Photo Studio',
          description,
          timestamp: j.updated_at || j.created_at,
          timeAgo: formatTimeAgo(j.updated_at || j.created_at),
          status: isFailed ? 'error' : isDone ? 'success' : 'info',
          meta,
        });
      }

      // ── Map products (AI descriptions) ───────────────────────────────────
      for (const p of products || []) {
        const meta: ActivityMetaChip[] = [];
        if (p.seo_score != null) meta.push({
          label: `SEO ${p.seo_score}/100`,
          variant: p.seo_score >= 70 ? 'success' : p.seo_score >= 40 ? 'warning' : 'error',
        });
        const productName = p.name || 'Produit sans titre';
        items.push({
          id: `product-${p.id}`,
          type: 'generation',
          title: 'Fiche optimisée',
          description: productName.length > 55 ? productName.slice(0, 52) + '…' : productName,
          timestamp: p.updated_at,
          timeAgo: formatTimeAgo(p.updated_at),
          status: 'success',
          meta: meta.length > 0 ? meta : undefined,
        });
      }

      // Sort by date descending, deduplicate by id prefix, take top N
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, limit);
    },
    staleTime: STALE_TIMES.LIST,
    enabled: true,
  });
}

function formatTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
