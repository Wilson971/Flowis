/**
 * Copilot Tool Executors
 *
 * Server-side functions that execute each tool against Supabase.
 * All queries respect RLS via the authenticated Supabase client.
 *
 * Architecture:
 * - Read tools: Direct Supabase queries
 * - Generate tools: Gemini 2.0 Flash via @google/genai
 * - Write tools: Supabase mutations + optional sync triggers
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import type {
  ToolResult,
  SearchProductsInput,
  GetProductInput,
  GetSeoScoresInput,
  GetDashboardKPIsInput,
  ListArticlesInput,
  GenerateProductContentInput,
  UpdateProductContentInput,
  PushToStoreInput,
  SuggestSeoFixInput,
  CopilotToolName,
} from "./tools";

// ============================================================================
// EXECUTOR DISPATCH
// ============================================================================

export async function executeToolCall(
  toolName: CopilotToolName,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  tenantId: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "search_products":
        return await searchProducts(supabase, tenantId, input as unknown as SearchProductsInput);
      case "get_product":
        return await getProduct(supabase, tenantId, input as unknown as GetProductInput);
      case "get_seo_scores":
        return await getSeoScores(supabase, tenantId, input as unknown as GetSeoScoresInput);
      case "get_dashboard_kpis":
        return await getDashboardKPIs(supabase, tenantId, input as unknown as GetDashboardKPIsInput);
      case "list_articles":
        return await listArticles(supabase, tenantId, input as unknown as ListArticlesInput);
      case "generate_product_content":
        return await generateProductContent(supabase, tenantId, input as unknown as GenerateProductContentInput);
      case "suggest_seo_fix":
        return await suggestSeoFix(supabase, tenantId, input as unknown as SuggestSeoFixInput);
      case "update_product_content":
        return await updateProductContent(supabase, tenantId, input as unknown as UpdateProductContentInput);
      case "push_to_store":
        return await pushToStore(supabase, tenantId, input as unknown as PushToStoreInput);
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ============================================================================
// READ TOOLS
// ============================================================================

async function searchProducts(
  supabase: SupabaseClient,
  tenantId: string,
  input: SearchProductsInput
): Promise<ToolResult> {
  const limit = Math.min(input.limit || 10, 50);

  let query = supabase
    .from("products")
    .select(
      "id, title, sku, image_url, price, stock, product_type, platform, working_content, draft_generated_content, ai_enhanced, last_synced_at, product_seo_analysis(overall_score, analyzed_at)"
    )
    .eq("tenant_id", tenantId)
    .limit(limit);

  // Text search
  if (input.query) {
    query = query.or(
      `title.ilike.%${input.query}%,sku.ilike.%${input.query}%`
    );
  }

  // Filters
  switch (input.filter) {
    case "missing_description":
      query = query.is("working_content", null);
      break;
    case "missing_seo":
      // Products without SEO analysis
      query = query.is("product_seo_analysis", null);
      break;
    case "not_synced":
      query = query.not("dirty_fields_content", "eq", "{}");
      break;
    case "with_drafts":
      query = query.not("draft_generated_content", "is", null);
      break;
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  // Post-filter for low_seo_score (requires join data)
  let results = data || [];
  if (input.filter === "low_seo_score") {
    results = results.filter(
      (p: any) => p.product_seo_analysis?.overall_score < 50
    );
  }

  return {
    success: true,
    data: {
      count: results.length,
      products: results.map((p: any) => ({
        id: p.id,
        title: p.title,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        type: p.product_type,
        has_content: !!p.working_content,
        has_draft: !!p.draft_generated_content,
        ai_enhanced: p.ai_enhanced,
        seo_score: p.product_seo_analysis?.overall_score ?? null,
        last_synced: p.last_synced_at,
      })),
    },
  };
}

async function getProduct(
  supabase: SupabaseClient,
  tenantId: string,
  input: GetProductInput
): Promise<ToolResult> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, sku, image_url, price, stock, product_type, platform, metadata, working_content, draft_generated_content, ai_enhanced, last_synced_at, dirty_fields_content, product_seo_analysis(overall_score, title_score, description_score, meta_score, analyzed_at)"
    )
    .eq("id", input.product_id)
    .eq("tenant_id", tenantId)
    .single();

  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: "Produit non trouvé" };

  return {
    success: true,
    data: {
      id: data.id,
      title: data.title,
      sku: data.sku,
      price: data.price,
      stock: data.stock,
      type: data.product_type,
      platform: data.platform,
      image_url: data.image_url,
      // Current content
      working_content: data.working_content
        ? {
            title: data.working_content.title,
            short_description: data.working_content.short_description,
            description: data.working_content.description
              ? data.working_content.description.replace(/<[^>]*>/g, "").slice(0, 500)
              : null,
            seo_title: data.working_content.seo_title,
            meta_description: data.working_content.meta_description,
          }
        : null,
      has_draft: !!data.draft_generated_content,
      ai_enhanced: data.ai_enhanced,
      seo: data.product_seo_analysis || null,
      last_synced: data.last_synced_at,
      dirty_fields: data.dirty_fields_content,
      // Metadata summary
      categories:
        data.metadata?.categories?.map((c: any) => c.name).join(", ") || null,
      status: data.metadata?.status || null,
    },
  };
}

async function getSeoScores(
  supabase: SupabaseClient,
  tenantId: string,
  input: GetSeoScoresInput
): Promise<ToolResult> {
  const limit = Math.min(input.limit || 20, 50);

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, product_seo_analysis(overall_score, title_score, description_score, meta_score, analyzed_at)"
    )
    .eq("tenant_id", tenantId)
    .not("product_seo_analysis", "is", null)
    .limit(limit);

  if (error) return { success: false, error: error.message };

  let results = (data || []).filter((p: any) => p.product_seo_analysis);

  // Filter by score range
  if (input.filter && input.filter !== "all") {
    results = results.filter((p: any) => {
      const score = p.product_seo_analysis.overall_score;
      switch (input.filter) {
        case "critical":
          return score < 40;
        case "warning":
          return score >= 40 && score <= 70;
        case "good":
          return score > 70;
        default:
          return true;
      }
    });
  }

  // Sort by score ascending (worst first)
  results.sort(
    (a: any, b: any) =>
      a.product_seo_analysis.overall_score - b.product_seo_analysis.overall_score
  );

  const scores = results.map((p: any) => p.product_seo_analysis.overall_score);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

  return {
    success: true,
    data: {
      count: results.length,
      average_score: avgScore,
      products: results.map((p: any) => ({
        id: p.id,
        title: p.title,
        overall_score: p.product_seo_analysis.overall_score,
        title_score: p.product_seo_analysis.title_score,
        description_score: p.product_seo_analysis.description_score,
        meta_score: p.product_seo_analysis.meta_score,
      })),
    },
  };
}

async function getDashboardKPIs(
  supabase: SupabaseClient,
  tenantId: string,
  input: GetDashboardKPIsInput
): Promise<ToolResult> {
  // Parallel queries for performance
  const [productsResult, blogResult, storeResult, seoResult] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, working_content, ai_enhanced", { count: "exact" })
        .eq("tenant_id", tenantId),
      supabase
        .from("blog_posts")
        .select("id, status", { count: "exact" })
        .eq("tenant_id", tenantId),
      supabase
        .from("stores")
        .select("id, name, platform, active, last_synced_at")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .limit(5),
      supabase
        .from("products")
        .select("product_seo_analysis(overall_score)")
        .eq("tenant_id", tenantId)
        .not("product_seo_analysis", "is", null),
    ]);

  const totalProducts = productsResult.count || 0;
  const products = productsResult.data || [];
  const aiOptimized = products.filter((p: any) => p.working_content).length;
  const blogPosts = blogResult.data || [];
  const stores = storeResult.data || [];

  // SEO average
  const seoScores = (seoResult.data || [])
    .map((p: any) => p.product_seo_analysis?.overall_score)
    .filter((s: any) => typeof s === "number");
  const avgSeo =
    seoScores.length > 0
      ? Math.round(seoScores.reduce((a: number, b: number) => a + b, 0) / seoScores.length)
      : 0;

  const statusCounts = blogPosts.reduce(
    (acc: Record<string, number>, p: any) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    success: true,
    data: {
      products: {
        total: totalProducts,
        ai_optimized: aiOptimized,
        coverage_percent:
          totalProducts > 0
            ? Math.round((aiOptimized / totalProducts) * 100)
            : 0,
      },
      seo: {
        average_score: avgSeo,
        analyzed_count: seoScores.length,
        critical: seoScores.filter((s: number) => s < 40).length,
        warning: seoScores.filter((s: number) => s >= 40 && s <= 70).length,
        good: seoScores.filter((s: number) => s > 70).length,
      },
      blog: {
        total: blogPosts.length,
        published: statusCounts["published"] || 0,
        draft: statusCounts["draft"] || 0,
        review: statusCounts["review"] || 0,
        scheduled: statusCounts["scheduled"] || 0,
      },
      stores: stores.map((s: any) => ({
        id: s.id,
        name: s.name,
        platform: s.platform,
        last_synced: s.last_synced_at,
      })),
    },
  };
}

async function listArticles(
  supabase: SupabaseClient,
  tenantId: string,
  input: ListArticlesInput
): Promise<ToolResult> {
  const limit = Math.min(input.limit || 20, 50);

  let query = supabase
    .from("blog_posts")
    .select("id, title, status, created_at, updated_at, word_count")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (input.status && input.status !== "all") {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      count: (data || []).length,
      articles: (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        word_count: a.word_count,
        created_at: a.created_at,
        updated_at: a.updated_at,
      })),
    },
  };
}

// ============================================================================
// GENERATE TOOLS (via Gemini)
// ============================================================================

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenAI({ apiKey });
}

async function generateProductContent(
  supabase: SupabaseClient,
  tenantId: string,
  input: GenerateProductContentInput
): Promise<ToolResult> {
  // Fetch product data
  const { data: product, error } = await supabase
    .from("products")
    .select("id, title, sku, metadata, working_content, image_url")
    .eq("id", input.product_id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !product)
    return { success: false, error: "Produit non trouvé" };

  const tone = input.tone || "professional";
  const language = input.language || "fr";
  const categories =
    product.metadata?.categories?.map((c: any) => c.name).join(", ") ||
    "Non catégorisé";

  const prompt = `Tu es un expert en e-commerce et SEO. Génère du contenu optimisé pour ce produit.

Produit: ${product.title}
SKU: ${product.sku || "N/A"}
Catégories: ${categories}
Prix: ${product.metadata?.price_html || "N/A"}
Contenu actuel: ${product.working_content?.description ? "Existant (à améliorer)" : "Aucun"}

Ton: ${tone}
Langue: ${language === "fr" ? "Français" : language}

Génère UNIQUEMENT les champs demandés au format JSON:
${JSON.stringify(input.fields)}

Règles:
- Titre SEO: 50-60 caractères
- Meta description: 120-160 caractères
- Description courte: 50-200 caractères, accrocheuse
- Description longue: 300-1000 caractères, structurée avec HTML (<p>, <strong>, <ul>)
- NE PAS utiliser de mots "robots" (exceptionnel, incontournable, révolutionnaire)
- Inclure des mots-clés naturellement

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown.`;

  const genAI = getGeminiClient();
  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const text = response.text || "";

  // Parse JSON from response
  let generated: Record<string, string>;
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    generated = JSON.parse(cleaned);
  } catch {
    return {
      success: false,
      error: "Erreur de parsing de la réponse IA",
    };
  }

  // Save as draft
  const { error: updateError } = await supabase
    .from("products")
    .update({
      draft_generated_content: {
        ...(product.working_content || {}),
        ...generated,
        _generated_at: new Date().toISOString(),
        _generated_by: "copilot",
      },
    })
    .eq("id", input.product_id)
    .eq("tenant_id", tenantId);

  if (updateError)
    return { success: false, error: updateError.message };

  return {
    success: true,
    data: {
      product_id: input.product_id,
      product_title: product.title,
      generated_fields: Object.keys(generated),
      content: generated,
      saved_as: "draft",
      note: "Le contenu est sauvegardé en brouillon. Utilisez update_product_content pour l'appliquer.",
    },
  };
}

async function suggestSeoFix(
  supabase: SupabaseClient,
  tenantId: string,
  input: SuggestSeoFixInput
): Promise<ToolResult> {
  // Fetch product with SEO data
  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, title, metadata, working_content, product_seo_analysis(overall_score, title_score, description_score, meta_score)"
    )
    .eq("id", input.product_id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !product)
    return { success: false, error: "Produit non trouvé" };

  const wc = product.working_content || {};
  const seo = product.product_seo_analysis;

  const prompt = `Tu es un expert SEO e-commerce. Analyse ce produit et donne des recommandations concrètes.

Produit: ${product.title}
Titre actuel: "${wc.title || product.title}"
Description courte: "${(wc.short_description || "").replace(/<[^>]*>/g, "").slice(0, 200)}"
Description longue: ${wc.description ? `${wc.description.replace(/<[^>]*>/g, "").slice(0, 300)}...` : "VIDE"}
Titre SEO: "${wc.seo_title || "Non défini"}"
Meta description: "${wc.meta_description || "Non défini"}"

Scores SEO actuels:
- Global: ${seo?.overall_score ?? "Non analysé"}/100
- Titre: ${seo?.title_score ?? "?"}/100
- Description: ${seo?.description_score ?? "?"}/100
- Meta: ${seo?.meta_score ?? "?"}/100

Donne tes recommandations au format JSON:
{
  "priority": "critical|high|medium|low",
  "issues": [{"field": "...", "problem": "...", "suggestion": "..."}],
  "quick_wins": ["..."],
  "estimated_score_improvement": number
}

Réponds UNIQUEMENT avec du JSON valide, sans markdown.`;

  const genAI = getGeminiClient();
  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const text = response.text || "";

  let suggestions: Record<string, unknown>;
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    suggestions = JSON.parse(cleaned);
  } catch {
    return {
      success: true,
      data: { raw_analysis: text.slice(0, 1000) },
    };
  }

  return {
    success: true,
    data: {
      product_id: input.product_id,
      product_title: product.title,
      current_score: seo?.overall_score ?? null,
      ...suggestions,
    },
  };
}

// ============================================================================
// WRITE TOOLS
// ============================================================================

async function updateProductContent(
  supabase: SupabaseClient,
  tenantId: string,
  input: UpdateProductContentInput
): Promise<ToolResult> {
  // Fetch current content
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, title, working_content")
    .eq("id", input.product_id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !product)
    return { success: false, error: "Produit non trouvé" };

  const updatedContent = {
    ...(product.working_content || {}),
    ...input.fields,
  };

  // Track which fields changed
  const changedFields = Object.keys(input.fields).filter(
    (k) => (input.fields as any)[k] !== undefined
  );

  const { error: updateError } = await supabase
    .from("products")
    .update({
      working_content: updatedContent,
      dirty_fields_content: changedFields,
      ai_enhanced: true,
    })
    .eq("id", input.product_id)
    .eq("tenant_id", tenantId);

  if (updateError)
    return { success: false, error: updateError.message };

  return {
    success: true,
    data: {
      product_id: input.product_id,
      product_title: product.title,
      updated_fields: changedFields,
      note: "Contenu mis à jour dans FLOWZ. Utilisez push_to_store pour synchroniser vers WooCommerce.",
    },
  };
}

async function pushToStore(
  supabase: SupabaseClient,
  tenantId: string,
  input: PushToStoreInput
): Promise<ToolResult> {
  if (input.product_ids.length === 0) {
    return { success: false, error: "Aucun produit spécifié" };
  }

  if (input.product_ids.length > 20) {
    return {
      success: false,
      error: "Maximum 20 produits par synchronisation via le Copilot",
    };
  }

  // Create sync queue entries
  const syncEntries = input.product_ids.map((pid) => ({
    tenant_id: tenantId,
    product_id: pid,
    action: "push_content" as const,
    status: "pending" as const,
    priority: 1,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("sync_queue")
    .insert(syncEntries);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      queued_count: input.product_ids.length,
      product_ids: input.product_ids,
      note: `${input.product_ids.length} produit(s) ajouté(s) à la file de synchronisation. La synchronisation s'effectuera dans les prochaines minutes.`,
    },
  };
}
