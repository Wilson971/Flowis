import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimitOrNull } from "@/lib/rate-limit"
import type { CopilotNotification } from "@/types/copilot"

export const runtime = "nodejs"

const RATE_LIMIT = { maxRequests: 20, windowMs: 60_000 }

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  // H2 fix: Add rate limiting
  const rateLimited = rateLimitOrNull(user.id, "copilot-notifications", RATE_LIMIT)
  if (rateLimited) return rateLimited

  // Load user notification preferences
  const { data: settings } = await supabase
    .from("copilot_settings")
    .select("notifications")
    .eq("tenant_id", user.id)
    .single()

  // M3 fix: Safely parse JSONB notifications preferences
  const rawPrefs = settings?.notifications as Record<string, unknown> | null | undefined
  const prefsEnabled = rawPrefs?.enabled !== false
  const types = (typeof rawPrefs?.types === "object" && rawPrefs.types !== null
    ? rawPrefs.types
    : {}) as Record<string, boolean | undefined>

  if (!prefsEnabled) return Response.json({ notifications: [] })

  const notifications: CopilotNotification[] = []

  // SEO Critical
  if (types.seo_critical !== false) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user.id)
      .lt("seo_score", 50)

    if (count && count > 0) {
      notifications.push({
        id: "seo_critical",
        type: "seo_critical",
        message: `${count} produit${count > 1 ? "s" : ""} avec un score SEO critique`,
        priority: count >= 5 ? "urgent" : "normal",
        data: { count },
      })
    }
  }

  // Drafts forgotten (> 7 days)
  if (types.drafts_forgotten !== false) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user.id)
      .eq("status", "draft")
      .lt("updated_at", sevenDaysAgo)

    if (count && count > 0) {
      notifications.push({
        id: "drafts_forgotten",
        type: "drafts_forgotten",
        message: `${count} brouillon${count > 1 ? "s" : ""} en attente depuis plus d'une semaine`,
        priority: "normal",
        data: { count },
      })
    }
  }

  // Sync failed
  if (types.sync_failed !== false) {
    const { count } = await supabase
      .from("sync_queue")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user.id)
      .eq("status", "failed")

    if (count && count > 0) {
      notifications.push({
        id: "sync_failed",
        type: "sync_failed",
        message: `${count} synchronisation${count > 1 ? "s" : ""} echouee${count > 1 ? "s" : ""}`,
        priority: "urgent",
        data: { count },
      })
    }
  }

  // Sort by priority (urgent first), limit to 5
  const sorted = notifications
    .sort((a, b) => (a.priority === "urgent" ? -1 : 1) - (b.priority === "urgent" ? -1 : 1))
    .slice(0, 5)

  return Response.json({ notifications: sorted })
}
