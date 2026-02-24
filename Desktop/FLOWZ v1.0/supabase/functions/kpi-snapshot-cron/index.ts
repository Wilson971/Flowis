/**
 * kpi-snapshot-cron — Edge Function
 *
 * Scheduled daily to capture KPI snapshots for all tenants.
 * Runs with service_role key → bypasses RLS.
 *
 * Metrics captured per store:
 *   - seo_avg_score
 *   - ai_optimized_products  (working_content IS NOT NULL)
 *   - total_products
 *   - published_blog_posts
 *   - total_blog_posts
 *
 * Also captures a global (store_id = null) snapshot per tenant.
 *
 * Deploy: supabase functions deploy kpi-snapshot-cron --no-verify-jwt
 * Cron:   set up via pg_cron calling this function daily at 00:05 UTC
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const METRICS = [
  "seo_avg_score",
  "ai_optimized_products",
  "total_products",
  "published_blog_posts",
  "total_blog_posts",
] as const;

type MetricName = (typeof METRICS)[number];

interface SnapshotRow {
  tenant_id: string;
  store_id: string | null;
  snapshot_date: string; // ISO date YYYY-MM-DD
  metric_name: MetricName;
  metric_value: number;
}

Deno.serve(async (req: Request) => {
  // Only accept POST (called by pg_cron via net.http_post)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // ── 1. Get all active tenants via stores ──────────────────
    const { data: stores, error: storesErr } = await supabase
      .from("stores")
      .select("id, tenant_id")
      .eq("connection_status", "connected");

    if (storesErr) throw storesErr;
    if (!stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active stores found", snapshots: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const snapshots: SnapshotRow[] = [];

    // ── 2. Per-store metrics ──────────────────────────────────
    for (const store of stores) {
      const storeId = store.id as string;
      const tenantId = store.tenant_id as string;

      // Parallel queries for this store
      const [
        { count: totalProducts },
        { count: aiOptimized },
        { data: seoData },
        { count: publishedBlog },
        { count: totalBlog },
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId),

        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .not("working_content", "is", null),

        supabase
          .from("product_seo_analysis")
          .select("overall_score")
          .in(
            "product_id",
            (
              await supabase
                .from("products")
                .select("id")
                .eq("store_id", storeId)
            ).data?.map((p: { id: string }) => p.id) ?? []
          ),

        supabase
          .from("blog_articles")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .in("status", ["publish", "published"])
          .eq("archived", false),

        supabase
          .from("blog_articles")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .eq("archived", false)
          .neq("status", "auto_draft"),
      ]);

      const scores = (seoData ?? []) as { overall_score: number }[];
      const avgSeo =
        scores.length > 0
          ? scores.reduce((sum, r) => sum + (r.overall_score ?? 0), 0) /
            scores.length
          : 0;

      const storeMetrics: Record<MetricName, number> = {
        seo_avg_score: Math.round(avgSeo * 10) / 10,
        ai_optimized_products: aiOptimized ?? 0,
        total_products: totalProducts ?? 0,
        published_blog_posts: publishedBlog ?? 0,
        total_blog_posts: totalBlog ?? 0,
      };

      for (const [metric, value] of Object.entries(storeMetrics)) {
        snapshots.push({
          tenant_id: tenantId,
          store_id: storeId,
          snapshot_date: today,
          metric_name: metric as MetricName,
          metric_value: value,
        });
      }
    }

    // ── 3. Global per-tenant metrics ──────────────────────────
    const tenantIds = [...new Set(stores.map((s) => s.tenant_id as string))];

    for (const tenantId of tenantIds) {
      const [
        { count: totalProducts },
        { count: aiOptimized },
        { data: seoData },
        { count: publishedBlog },
        { count: totalBlog },
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),

        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .not("working_content", "is", null),

        supabase
          .from("product_seo_analysis")
          .select("overall_score")
          .in(
            "product_id",
            (
              await supabase
                .from("products")
                .select("id")
                .eq("tenant_id", tenantId)
            ).data?.map((p: { id: string }) => p.id) ?? []
          ),

        supabase
          .from("blog_articles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .in("status", ["publish", "published"])
          .eq("archived", false),

        supabase
          .from("blog_articles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("archived", false)
          .neq("status", "auto_draft"),
      ]);

      const scores = (seoData ?? []) as { overall_score: number }[];
      const avgSeo =
        scores.length > 0
          ? scores.reduce((sum, r) => sum + (r.overall_score ?? 0), 0) /
            scores.length
          : 0;

      const globalMetrics: Record<MetricName, number> = {
        seo_avg_score: Math.round(avgSeo * 10) / 10,
        ai_optimized_products: aiOptimized ?? 0,
        total_products: totalProducts ?? 0,
        published_blog_posts: publishedBlog ?? 0,
        total_blog_posts: totalBlog ?? 0,
      };

      for (const [metric, value] of Object.entries(globalMetrics)) {
        snapshots.push({
          tenant_id: tenantId,
          store_id: null,
          snapshot_date: today,
          metric_name: metric as MetricName,
          metric_value: value,
        });
      }
    }

    // ── 4. Upsert all snapshots ───────────────────────────────
    if (snapshots.length > 0) {
      const { error: upsertErr } = await supabase
        .from("kpi_snapshots")
        .upsert(snapshots, {
          onConflict: "tenant_id,store_id,snapshot_date,metric_name",
          ignoreDuplicates: false,
        });

      if (upsertErr) throw upsertErr;
    }

    return new Response(
      JSON.stringify({
        message: "KPI snapshots captured successfully",
        date: today,
        snapshots: snapshots.length,
        stores: stores.length,
        tenants: tenantIds.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[kpi-snapshot-cron] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
