import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Gemini function-calling tool declarations
// ---------------------------------------------------------------------------

export const copilotTools = [
  {
    functionDeclarations: [
      {
        name: "get_products",
        description:
          "Search or list products. Supports optional text search, limit, and maximum SEO score filter.",
        parameters: {
          type: "object" as const,
          properties: {
            search: {
              type: "string",
              description: "Optional text to search in product titles",
            },
            limit: {
              type: "number",
              description: "Max number of products to return (default 20)",
            },
            seo_max_score: {
              type: "number",
              description:
                "Only return products with seo_score <= this value",
            },
          },
          required: [],
        },
      },
      {
        name: "get_product_detail",
        description: "Get full details for a single product by its ID.",
        parameters: {
          type: "object" as const,
          properties: {
            product_id: {
              type: "string",
              description: "The UUID of the product",
            },
          },
          required: ["product_id"],
        },
      },
      {
        name: "get_blog_posts",
        description:
          "List blog articles, optionally filtered by status (draft, published, scheduled).",
        parameters: {
          type: "object" as const,
          properties: {
            status: {
              type: "string",
              description: "Filter by post status: draft, published, scheduled",
            },
            limit: {
              type: "number",
              description: "Max number of posts to return (default 20)",
            },
          },
          required: [],
        },
      },
      {
        name: "seo_audit",
        description:
          "Quick SEO audit across all products. Returns average score, critical count, and optionally the worst-scoring products.",
        parameters: {
          type: "object" as const,
          properties: {
            scope: {
              type: "string",
              description:
                "'all' for global stats, 'worst' for products scoring below 50",
            },
          },
          required: [],
        },
      },
      {
        name: "get_dashboard_kpis",
        description:
          "Global KPIs: total products, total articles, average SEO score, drafts count, published count.",
        parameters: {
          type: "object" as const,
          properties: {},
          required: [],
        },
      },
      {
        name: "get_priority_actions",
        description:
          "Recommended actions based on low SEO scores, old drafts, and failed syncs.",
        parameters: {
          type: "object" as const,
          properties: {},
          required: [],
        },
      },
      {
        name: "keyword_suggestions",
        description:
          "Get SEO keyword suggestions for a given topic. Gemini will generate relevant keywords.",
        parameters: {
          type: "object" as const,
          properties: {
            topic: {
              type: "string",
              description: "The topic or niche to generate keyword ideas for",
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "get_gsc_performance",
        description:
          "Retrieve Google Search Console performance data for a given period.",
        parameters: {
          type: "object" as const,
          properties: {
            period: {
              type: "string",
              description: "Time period: '7d', '28d', or '3m' (default '28d')",
            },
          },
          required: [],
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Server-side tool execution
// ---------------------------------------------------------------------------

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  tenantId: string,
  supabase: SupabaseClient
): Promise<unknown> {
  switch (name) {
    // ---- Products ----------------------------------------------------------
    case "get_products": {
      const limit = (args.limit as number) || 20;
      let query = supabase
        .from("products")
        .select("id, title, price, stock_quantity, seo_score, status, sku")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (args.search) {
        query = query.ilike("title", `%${args.search}%`);
      }
      if (args.seo_max_score !== undefined) {
        query = query.lte("seo_score", args.seo_max_score as number);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { products: data, count: data?.length ?? 0 };
    }

    case "get_product_detail": {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", args.product_id as string)
        .eq("tenant_id", tenantId)
        .single();

      if (error) throw error;
      return data;
    }

    // ---- Blog --------------------------------------------------------------
    case "get_blog_posts": {
      const limit = (args.limit as number) || 20;
      let query = supabase
        .from("blog_posts")
        .select(
          "id, title, status, created_at, updated_at, word_count, meta_description"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (args.status) {
        query = query.eq("status", args.status as string);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { posts: data, count: data?.length ?? 0 };
    }

    // ---- SEO Audit ---------------------------------------------------------
    case "seo_audit": {
      const scope = (args.scope as string) || "all";

      const { data: products, error } = await supabase
        .from("products")
        .select("id, title, seo_score")
        .eq("tenant_id", tenantId);

      if (error) throw error;

      const scores = (products ?? [])
        .map((p) => p.seo_score as number | null)
        .filter((s): s is number => s !== null);

      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      const critical = (products ?? []).filter(
        (p) => p.seo_score !== null && (p.seo_score as number) < 50
      );

      const result: Record<string, unknown> = {
        total_products: products?.length ?? 0,
        average_seo_score: avg,
        critical_count: critical.length,
      };

      if (scope === "worst") {
        result.worst_products = critical
          .sort(
            (a, b) => ((a.seo_score as number) ?? 0) - ((b.seo_score as number) ?? 0)
          )
          .slice(0, 10);
      }

      return result;
    }

    // ---- Dashboard KPIs ----------------------------------------------------
    case "get_dashboard_kpis": {
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
            .not("seo_score", "is", null),
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

      const seoScores = (seoRes.data ?? []).map(
        (p) => p.seo_score as number
      );
      const avgSeo =
        seoScores.length > 0
          ? Math.round(
              seoScores.reduce((a, b) => a + b, 0) / seoScores.length
            )
          : 0;

      return {
        total_products: productsRes.count ?? 0,
        total_articles: postsRes.count ?? 0,
        average_seo_score: avgSeo,
        drafts: draftsRes.count ?? 0,
        published: publishedRes.count ?? 0,
      };
    }

    // ---- Priority Actions --------------------------------------------------
    case "get_priority_actions": {
      const [lowSeoRes, oldDraftsRes, failedSyncsRes] = await Promise.all([
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

      const actions: string[] = [];

      if ((lowSeoRes.data?.length ?? 0) > 0) {
        actions.push(
          `${lowSeoRes.data!.length} product(s) with SEO score below 50 need optimization`
        );
      }
      if ((oldDraftsRes.data?.length ?? 0) > 0) {
        actions.push(
          `${oldDraftsRes.data!.length} draft article(s) could be finalized and published`
        );
      }
      if ((failedSyncsRes.data?.length ?? 0) > 0) {
        actions.push(
          `${failedSyncsRes.data!.length} sync(s) failed and may need a retry`
        );
      }

      return {
        actions,
        low_seo_products: lowSeoRes.data ?? [],
        old_drafts: oldDraftsRes.data ?? [],
        failed_syncs: failedSyncsRes.data ?? [],
      };
    }

    // ---- Keyword Suggestions -----------------------------------------------
    case "keyword_suggestions": {
      return {
        note: "Gemini will generate keyword suggestions based on its knowledge.",
        topic: args.topic as string,
      };
    }

    // ---- GSC Performance ---------------------------------------------------
    case "get_gsc_performance": {
      const period = (args.period as string) || "28d";

      const { data, error } = await supabase
        .from("stores")
        .select("gsc_data")
        .eq("tenant_id", tenantId)
        .not("gsc_data", "is", null)
        .limit(1)
        .single();

      if (error) throw error;

      return {
        period,
        gsc_data: data?.gsc_data ?? null,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
