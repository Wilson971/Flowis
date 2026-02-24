/**
 * useWorkspacePlan - Hook pour afficher le plan et l'usage du workspace
 */

import { useQuery } from '@tanstack/react-query'
import { STALE_TIMES } from '@/lib/query-config'
import { createClient } from '@/lib/supabase/client'
import { PLAN_DEFINITIONS } from '@/constants/plans'
import type { WorkspaceUsage, WorkspacePlan } from '@/types/workspace'

// Returns 'YYYY-MM' for the current month
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

interface WorkspacePlanData {
  plan: WorkspacePlan
  planDefinition: (typeof PLAN_DEFINITIONS)[number]
  usage: WorkspaceUsage
  usagePercentages: {
    products: number
    articles: number
    stores: number
    ai_credits: number
  }
}

export function useWorkspacePlan(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['workspace-plan', workspaceId],
    queryFn: async (): Promise<WorkspacePlanData> => {
      if (!workspaceId) throw new Error('Workspace ID required')

      // Get workspace plan info
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('plan, usage_limits')
        .eq('id', workspaceId)
        .single()

      if (wsError) throw wsError

      const plan = (workspace.plan || 'free') as WorkspacePlan

      // Get current user for AI credits lookup
      const { data: { user } } = await supabase.auth.getUser()

      // Get usage counts via RPC and AI credits in parallel
      const [usageResult, aiCreditsResult] = await Promise.all([
        supabase.rpc('get_workspace_usage', { p_workspace_id: workspaceId }),
        user
          ? supabase.rpc('get_ai_credits_used', {
              p_tenant_id: user.id,
              p_month: currentMonth(),
            })
          : Promise.resolve({ data: 0, error: null }),
      ])

      if (usageResult.error) throw usageResult.error

      const usageData = (usageResult.data || { products: 0, articles: 0, stores: 0, members: 0 }) as WorkspaceUsage
      const aiCreditsUsed = (aiCreditsResult.data as number) || 0

      // Find plan definition
      const planDef = PLAN_DEFINITIONS.find(p => p.id === plan) || PLAN_DEFINITIONS[0]
      const limits = planDef.limits

      // Extend usage with AI credits
      const extendedUsage: WorkspaceUsage & { ai_credits: number } = {
        ...usageData,
        ai_credits: aiCreditsUsed,
      }

      // Calculate percentages
      const usagePercentages = {
        products: limits.max_products > 0
          ? Math.min(100, Math.round((extendedUsage.products / limits.max_products) * 100))
          : 0,
        articles: limits.max_articles > 0
          ? Math.min(100, Math.round((extendedUsage.articles / limits.max_articles) * 100))
          : 0,
        stores: limits.max_stores > 0
          ? Math.min(100, Math.round((extendedUsage.stores / limits.max_stores) * 100))
          : 0,
        ai_credits: limits.max_ai_credits > 0
          ? Math.min(100, Math.round((aiCreditsUsed / limits.max_ai_credits) * 100))
          : 0,
      }

      const usageDataFinal = extendedUsage as unknown as WorkspaceUsage

      return {
        plan,
        planDefinition: planDef,
        usage: usageDataFinal,
        usagePercentages,
      }
    },
    enabled: !!workspaceId,
    staleTime: STALE_TIMES.DETAIL,
  })
}
