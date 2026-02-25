"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  WifiOff,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Camera,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionMode = "inline" | "link";
export type ActionGroup = "critical" | "important" | "suggestion";

export interface ActionItem {
  id: string;
  priority: ActionPriority;
  mode: ActionMode;
  title: string;
  description: string;
  impact?: string;
  cta: string;
  href?: string;
  onAction?: () => void;
  isActioning?: boolean;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "destructive" | "default" | "secondary" | "outline";
  group: ActionGroup;
}

export interface UseActionCenterReturn {
  actions: ActionItem[];
  topActions: ActionItem[];
  totalCount: number;
  resolvedCount: number;
  grouped: {
    critical: ActionItem[];
    important: ActionItem[];
    suggestions: ActionItem[];
  };
  isLoading: boolean;
}

interface UseActionCenterParams {
  storeId: string | null;
  isDisconnected?: boolean;
  draftsCount?: number;
  seoScore?: number;
  opportunitiesCount?: number;
  productsWithoutDescription?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const actionCenterKeys = {
  all: ["action-center"] as const,
  syncFailures: (storeId: string | null) =>
    ["action-center", "sync-failures", storeId] as const,
  unsyncArticles: ["action-center", "unsync-articles"] as const,
  seoTrend: (storeId: string | null) =>
    ["action-center", "seo-trend", storeId] as const,
  studioFailures: ["action-center", "studio-failures"] as const,
};

// ============================================================================
// PRIORITY CONFIG
// ============================================================================

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityToGroup = (p: ActionPriority): ActionGroup => {
  if (p === "critical") return "critical";
  if (p === "high") return "important";
  return "suggestion";
};

// ============================================================================
// HOOK
// ============================================================================

export function useActionCenter({
  storeId,
  isDisconnected = false,
  draftsCount = 0,
  seoScore = 0,
  opportunitiesCount = 0,
  productsWithoutDescription = 0,
}: UseActionCenterParams): UseActionCenterReturn {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // ── New data source 1: Sync failures ──
  const { data: syncFailures, isLoading: syncLoading } = useQuery({
    queryKey: actionCenterKeys.syncFailures(storeId),
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("sync_jobs")
        .select("id, error_message, created_at")
        .eq("store_id", storeId)
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!storeId,
    staleTime: 60_000,
  });

  // ── New data source 2: Unsynchronized articles ──
  const { data: unsyncCount, isLoading: unsyncLoading } = useQuery({
    queryKey: actionCenterKeys.unsyncArticles,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .is("synced_at", null);
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  // ── New data source 3: SEO trend declining ──
  const { data: seoTrend, isLoading: trendLoading } = useQuery({
    queryKey: actionCenterKeys.seoTrend(storeId),
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from("daily_snapshots")
        .select("seo_avg, snapshot_date")
        .eq("store_id", storeId)
        .order("snapshot_date", { ascending: false })
        .limit(8);
      if (error || !data || data.length < 2) return null;
      const current = data[0]?.seo_avg ?? 0;
      const weekAgo = data[Math.min(data.length - 1, 6)]?.seo_avg ?? 0;
      const decline = weekAgo - current;
      return decline > 3 ? { current, weekAgo, decline: Math.round(decline) } : null;
    },
    enabled: !!storeId,
    staleTime: 60_000,
  });

  // ── New data source 4: Studio job failures ──
  const { data: studioFailures, isLoading: studioLoading } = useQuery({
    queryKey: actionCenterKeys.studioFailures,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_jobs")
        .select("id, action, error_message, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // ── Mutations ──
  const retrySyncMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("sync_jobs")
        .update({ status: "pending", error_message: null })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionCenterKeys.syncFailures(storeId) });
      toast.success("Synchronisation relancée");
    },
    onError: () => toast.error("Impossible de relancer la synchronisation"),
  });

  const retryStudioMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("studio_jobs")
        .update({ status: "pending", error_message: null })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionCenterKeys.studioFailures });
      toast.success("Retouche photo relancée");
    },
    onError: () => toast.error("Impossible de relancer la retouche"),
  });

  // ── Assembly ──
  const actions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    // Critical: Store disconnected
    if (isDisconnected) {
      items.push({
        id: "reconnect",
        priority: "critical",
        mode: "link",
        title: "Reconnecter votre boutique",
        description: "Synchronisation impossible",
        impact: "Bloquant",
        cta: "Reconnecter",
        href: "/app/settings/stores",
        icon: WifiOff,
        badge: "Urgent",
        badgeVariant: "destructive",
        group: "critical",
      });
    }

    // Critical: Sync failures (inline)
    const failedSyncCount = syncFailures?.length ?? 0;
    if (failedSyncCount > 0) {
      items.push({
        id: "sync-failures",
        priority: "critical",
        mode: "inline",
        title: `${failedSyncCount} sync${failedSyncCount > 1 ? "s" : ""} échouée${failedSyncCount > 1 ? "s" : ""}`,
        description: "Erreur de synchronisation",
        impact: "Données désynchronisées",
        cta: "Relancer",
        onAction: () => {
          syncFailures?.forEach((job) => retrySyncMutation.mutate(job.id));
        },
        isActioning: retrySyncMutation.isPending,
        icon: RefreshCw,
        badge: "Urgent",
        badgeVariant: "destructive",
        group: "critical",
      });
    }

    // Critical: Studio failures (inline)
    const failedStudioCount = studioFailures?.length ?? 0;
    if (failedStudioCount > 0) {
      items.push({
        id: "studio-failures",
        priority: "critical",
        mode: "inline",
        title: `${failedStudioCount} retouche${failedStudioCount > 1 ? "s" : ""} échouée${failedStudioCount > 1 ? "s" : ""}`,
        description: "Photo Studio en erreur",
        impact: "Photos non traitées",
        cta: "Relancer",
        onAction: () => {
          studioFailures?.forEach((job) => retryStudioMutation.mutate(job.id));
        },
        isActioning: retryStudioMutation.isPending,
        icon: Camera,
        badge: "Urgent",
        badgeVariant: "destructive",
        group: "critical",
      });
    }

    // High: Unpublished drafts
    if (draftsCount > 5) {
      items.push({
        id: "publish-drafts",
        priority: "high",
        mode: "link",
        title: `Publier vos ${draftsCount} brouillons`,
        description: "Articles prêts à être publiés",
        impact: `↑ SEO +${Math.min(draftsCount * 2, 15)} pts estimé`,
        cta: "Voir les brouillons",
        href: "/app/blog?status=draft",
        icon: FileText,
        group: "important",
      });
    }

    // High: Low SEO score
    if (seoScore > 0 && seoScore < 60) {
      items.push({
        id: "optimize-seo",
        priority: "high",
        mode: "link",
        title: "Optimiser vos fiches produits",
        description: `Score SEO à ${Math.round(seoScore)}/100`,
        impact: "↑ Score SEO +8 pts estimé",
        cta: "Optimiser",
        href: "/app/products",
        icon: Target,
        badge: "Pro",
        badgeVariant: "secondary",
        group: "important",
      });
    }

    // High: Unsynchronized articles
    if ((unsyncCount ?? 0) > 0) {
      items.push({
        id: "unsync-articles",
        priority: "high",
        mode: "link",
        title: `${unsyncCount} article${(unsyncCount ?? 0) > 1 ? "s" : ""} non synchronisé${(unsyncCount ?? 0) > 1 ? "s" : ""}`,
        description: "Publiés mais pas sur votre boutique",
        impact: "↑ Visibilité",
        cta: "Synchroniser",
        href: "/app/blog?sync=pending",
        icon: AlertTriangle,
        group: "important",
      });
    }

    // High: SEO declining
    if (seoTrend) {
      items.push({
        id: "seo-declining",
        priority: "high",
        mode: "link",
        title: `Score SEO en baisse de -${seoTrend.decline} pts`,
        description: "Tendance sur 7 jours",
        impact: "Vérifiez les modifications récentes",
        cta: "Diagnostiquer",
        href: "/app/seo",
        icon: TrendingDown,
        group: "important",
      });
    }

    // Medium: SEO opportunities
    if (opportunitiesCount > 0) {
      items.push({
        id: "seo-opportunities",
        priority: "medium",
        mode: "link",
        title: `${opportunitiesCount} opportunités SEO`,
        description: "Keywords proches du top 10",
        impact: "↑ Trafic organique",
        cta: "Explorer",
        href: "/app/seo",
        icon: TrendingUp,
        group: "suggestion",
      });
    }

    // Low: Default actions (fill to at least 4)
    if (items.length < 4) {
      items.push({
        id: "generate-description",
        priority: "low",
        mode: "link",
        title: "Générer descriptions IA",
        description: "Création automatique",
        cta: "Générer",
        href: "/app/products",
        icon: Sparkles,
        badge: "Populaire",
        badgeVariant: "default",
        group: "suggestion",
      });
    }

    if (items.length < 4) {
      items.push({
        id: "create-blog",
        priority: "low",
        mode: "link",
        title: "Créer un article",
        description: "Contenu SEO optimisé",
        cta: "Rédiger",
        href: "/app/blog/new",
        icon: FileText,
        group: "suggestion",
      });
    }

    if (items.length < 4) {
      items.push({
        id: "photo-studio",
        priority: "low",
        mode: "link",
        title: "Photo Studio",
        description: "Retouche automatique",
        cta: "Ouvrir",
        href: "/app/photo-studio",
        icon: Camera,
        badge: "Beta",
        badgeVariant: "outline",
        group: "suggestion",
      });
    }

    // Sort by priority
    items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

    return items;
  }, [
    isDisconnected,
    syncFailures,
    studioFailures,
    draftsCount,
    seoScore,
    unsyncCount,
    seoTrend,
    opportunitiesCount,
    retrySyncMutation.isPending,
    retryStudioMutation.isPending,
  ]);

  const grouped = useMemo(() => ({
    critical: actions.filter((a) => a.group === "critical"),
    important: actions.filter((a) => a.group === "important"),
    suggestions: actions.filter((a) => a.group === "suggestion"),
  }), [actions]);

  return {
    actions,
    topActions: actions.slice(0, 4),
    totalCount: actions.length,
    resolvedCount: 0, // TODO: track resolved actions via activity_log
    grouped,
    isLoading: syncLoading || unsyncLoading || trendLoading || studioLoading,
  };
}
