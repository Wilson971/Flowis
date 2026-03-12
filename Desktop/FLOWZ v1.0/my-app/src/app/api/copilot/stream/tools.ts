import { tool } from "ai";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helper: create tools bound to a tenant + supabase client
// ---------------------------------------------------------------------------

export function createCopilotTools(tenantId: string, supabase: SupabaseClient) {
  return {
    get_products: tool({
      description:
        "Search or list products. Supports optional text search, limit, and maximum SEO score filter.",
      parameters: z.object({
        search: z.string().optional().describe("Optional text to search in product titles"),
        limit: z.number().optional().describe("Max number of products to return (default 20)"),
        seo_max_score: z.number().optional().describe("Only return products with seo_score <= this value"),
      }),
      execute: async ({ search, limit, seo_max_score }) => {
        let query = supabase
          .from("products")
          .select("id, title, price, seo_score, status, sku, image_url")
          .eq("tenant_id", tenantId)
          .order("imported_at", { ascending: false })
          .limit(limit ?? 20);

        if (search) {
          // C4 fix: Escape SQL wildcard characters in search input
          const escaped = search.replace(/[%_\\]/g, (ch) => `\\${ch}`);
          query = query.ilike("title", `%${escaped}%`);
        }
        if (seo_max_score !== undefined) query = query.lte("seo_score", seo_max_score);

        const { data, error } = await query;
        if (error) return { error: error.message, products: [], count: 0 };
        return { products: data, count: data?.length ?? 0 };
      },
    }),

    get_product_detail: tool({
      description: "Get full details for a single product by its ID.",
      parameters: z.object({
        product_id: z.string().describe("The UUID of the product"),
      }),
      execute: async ({ product_id }) => {
        const { data, error } = await supabase
          .from("products")
          .select("id, title, price, seo_score, status, sku, image_url, metadata, working_content, imported_at, updated_at")
          .eq("id", product_id)
          .eq("tenant_id", tenantId)
          .single();
        if (error) return { error: error.message };
        return data;
      },
    }),

    get_blog_posts: tool({
      description:
        "List blog articles, optionally filtered by status (draft, published, scheduled).",
      parameters: z.object({
        status: z.string().optional().describe("Filter by post status: draft, published, scheduled"),
        limit: z.number().optional().describe("Max number of posts to return (default 20)"),
      }),
      execute: async ({ status, limit }) => {
        let query = supabase
          .from("blog_posts")
          .select("id, title, status, created_at, updated_at, word_count, meta_description")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(limit ?? 20);

        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return { error: error.message, posts: [], count: 0 };
        return { posts: data, count: data?.length ?? 0 };
      },
    }),

    seo_audit: tool({
      description:
        "Quick SEO audit across all products. Returns average score, critical count, and optionally the worst-scoring products.",
      parameters: z.object({
        scope: z.string().optional().describe("'all' for global stats, 'worst' for products scoring below 50"),
      }),
      execute: async ({ scope }) => {
        // C3 fix: Use count + RPC-style aggregation instead of fetching all rows
        const [countRes, criticalCountRes, worstRes] = await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .lt("seo_score", 50)
            .not("seo_score", "is", null),
          // Only fetch worst products (limited)
          supabase
            .from("products")
            .select("id, title, seo_score")
            .eq("tenant_id", tenantId)
            .not("seo_score", "is", null)
            .order("seo_score", { ascending: true })
            .limit(10),
        ]);

        // Compute avg from the limited worst sample + a small top sample
        const { data: sampleForAvg } = await supabase
          .from("products")
          .select("seo_score")
          .eq("tenant_id", tenantId)
          .not("seo_score", "is", null)
          .limit(500);

        const scores = (sampleForAvg ?? []).map((p) => p.seo_score as number);
        const avg = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        const result: Record<string, unknown> = {
          total_products: countRes.count ?? 0,
          average_seo_score: avg,
          critical_count: criticalCountRes.count ?? 0,
        };

        if ((scope ?? "all") === "worst") {
          result.worst_products = worstRes.data ?? [];
        }

        return result;
      },
    }),

    get_dashboard_kpis: tool({
      description:
        "Global KPIs: total products, total articles, average SEO score, drafts count, published count.",
      parameters: z.object({}),
      execute: async () => {
        const [productsRes, postsRes, seoRes, draftsRes, publishedRes] =
          await Promise.all([
            supabase
              .from("products")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId),
            supabase
              .from("blog_posts")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId),
            supabase
              .from("products")
              .select("seo_score")
              .eq("tenant_id", tenantId)
              .not("seo_score", "is", null)
              .limit(500),
            supabase
              .from("blog_posts")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId)
              .eq("status", "draft"),
            supabase
              .from("blog_posts")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId)
              .eq("status", "published"),
          ]);

        const seoScores = (seoRes.data ?? []).map((p) => p.seo_score as number);
        const avgSeo =
          seoScores.length > 0
            ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length)
            : 0;

        return {
          total_products: productsRes.count ?? 0,
          total_articles: postsRes.count ?? 0,
          average_seo_score: avgSeo,
          drafts: draftsRes.count ?? 0,
          published: publishedRes.count ?? 0,
        };
      },
    }),

    get_priority_actions: tool({
      description:
        "Recommended actions based on low SEO scores, old drafts, and failed syncs.",
      parameters: z.object({}),
      execute: async () => {
        const [lowSeoRes, oldDraftsRes, failedSyncsRes] = await Promise.allSettled([
          supabase
            .from("products")
            .select("id, title, seo_score")
            .eq("tenant_id", tenantId)
            .lt("seo_score", 50)
            .order("seo_score", { ascending: true })
            .limit(5),
          supabase
            .from("blog_posts")
            .select("id, title, updated_at")
            .eq("tenant_id", tenantId)
            .eq("status", "draft")
            .order("updated_at", { ascending: true })
            .limit(5),
          supabase
            .from("sync_queue")
            .select("id, status")
            .eq("tenant_id", tenantId)
            .eq("status", "failed")
            .limit(5),
        ]);

        const lowSeo = lowSeoRes.status === "fulfilled" ? lowSeoRes.value.data : [];
        const oldDrafts = oldDraftsRes.status === "fulfilled" ? oldDraftsRes.value.data : [];
        const failedSyncs = failedSyncsRes.status === "fulfilled" ? failedSyncsRes.value.data : [];

        const actions: string[] = [];
        if ((lowSeo?.length ?? 0) > 0)
          actions.push(`${lowSeo!.length} product(s) with SEO score below 50 need optimization`);
        if ((oldDrafts?.length ?? 0) > 0)
          actions.push(`${oldDrafts!.length} draft article(s) could be finalized and published`);
        if ((failedSyncs?.length ?? 0) > 0)
          actions.push(`${failedSyncs!.length} sync(s) failed and may need a retry`);

        return {
          actions,
          low_seo_products: lowSeo ?? [],
          old_drafts: oldDrafts ?? [],
          failed_syncs: failedSyncs ?? [],
        };
      },
    }),

    keyword_suggestions: tool({
      description:
        "Get SEO keyword suggestions for a given topic. The model will generate relevant keywords.",
      parameters: z.object({
        topic: z.string().describe("The topic or niche to generate keyword ideas for"),
      }),
      execute: async ({ topic }) => {
        return {
          note: "The model will generate keyword suggestions based on its knowledge.",
          topic,
        };
      },
    }),

    // ---- WRITE TOOLS --------------------------------------------------------

    update_product_content: tool({
      description:
        "Update a product's working content fields (title, short_description, description, seo_title, meta_description). Use this to optimize product SEO or rewrite descriptions. Always show the user what you're changing before applying.",
      parameters: z.object({
        product_id: z.string().describe("The UUID of the product to update"),
        title: z.string().optional().describe("New product title"),
        short_description: z.string().optional().describe("New short description (HTML allowed)"),
        description: z.string().optional().describe("New full description (HTML allowed)"),
        seo_title: z.string().optional().describe("New SEO title (meta title)"),
        meta_description: z.string().optional().describe("New meta description for search engines"),
      }),
      execute: async ({ product_id, ...fields }) => {
        // First verify ownership
        const { data: product, error: fetchErr } = await supabase
          .from("products")
          .select("id, title, working_content")
          .eq("id", product_id)
          .eq("tenant_id", tenantId)
          .single();

        if (fetchErr || !product) return { error: "Product not found or access denied" };

        // Build update payload — merge into working_content JSONB
        const currentWc = (product.working_content as Record<string, unknown>) ?? {};
        const updatedWc = { ...currentWc };
        const changedFields: string[] = [];

        if (fields.title !== undefined) { updatedWc.title = fields.title; changedFields.push("title"); }
        if (fields.short_description !== undefined) { updatedWc.short_description = fields.short_description; changedFields.push("short_description"); }
        if (fields.description !== undefined) { updatedWc.description = fields.description; changedFields.push("description"); }
        if (fields.seo_title !== undefined) { updatedWc.seo_title = fields.seo_title; changedFields.push("seo_title"); }
        if (fields.meta_description !== undefined) { updatedWc.meta_description = fields.meta_description; changedFields.push("meta_description"); }

        if (changedFields.length === 0) return { error: "No fields provided to update" };

        // Update product
        const updatePayload: Record<string, unknown> = {
          working_content: updatedWc,
          ai_enhanced: true,
          updated_at: new Date().toISOString(),
        };

        // Also update top-level title if changed
        if (fields.title !== undefined) {
          updatePayload.title = fields.title;
        }

        // Track dirty fields for sync
        const currentDirty = (product as Record<string, unknown>).dirty_fields_content as string[] ?? [];
        updatePayload.dirty_fields_content = [...new Set([...currentDirty, ...changedFields])];

        const { error: updateErr } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", product_id)
          .eq("tenant_id", tenantId);

        if (updateErr) return { error: updateErr.message };

        return {
          success: true,
          product_id,
          updated_fields: changedFields,
          message: `Updated ${changedFields.join(", ")} for product "${product.title}"`,
        };
      },
    }),

    batch_optimize_seo: tool({
      description:
        "Batch optimize SEO for multiple products. Generates optimized titles and meta descriptions based on existing product data. Use for products with low SEO scores.",
      parameters: z.object({
        product_ids: z.array(z.string()).describe("Array of product UUIDs to optimize (max 10)"),
        fields: z.array(z.string()).optional().describe("Fields to optimize: title, description, short_description, seo_title, meta_description. Default: seo_title, meta_description"),
      }),
      execute: async ({ product_ids, fields }) => {
        const targetFields = fields ?? ["seo_title", "meta_description"];
        const limitedIds = product_ids.slice(0, 10);

        const { data: products, error } = await supabase
          .from("products")
          .select("id, title, working_content, metadata, seo_score")
          .eq("tenant_id", tenantId)
          .in("id", limitedIds);

        if (error) return { error: error.message };
        if (!products?.length) return { error: "No products found" };

        return {
          products_to_optimize: products.map((p) => ({
            id: p.id,
            title: p.title,
            current_seo_score: p.seo_score,
            current_working_content: p.working_content,
            fields_to_optimize: targetFields,
          })),
          count: products.length,
          instruction: "For each product, generate optimized content for the requested fields, then call update_product_content for each one.",
        };
      },
    }),

    get_gsc_performance: tool({
      description:
        "Retrieve Google Search Console performance data for a given period.",
      parameters: z.object({
        period: z.string().optional().describe("Time period: '7d', '28d', or '3m' (default '28d')"),
      }),
      execute: async ({ period }) => {
        const { data } = await supabase
          .from("stores")
          .select("gsc_data")
          .eq("tenant_id", tenantId)
          .not("gsc_data", "is", null)
          .limit(1)
          .maybeSingle();

        return {
          period: period ?? "28d",
          gsc_data: data?.gsc_data ?? null,
        };
      },
    }),
  };
}
