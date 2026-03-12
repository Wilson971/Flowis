/**
 * Copilot Tool Definitions
 *
 * Defines all tools available to the Copilot AI agent.
 * Each tool has a name, description (for the LLM), and input schema (JSON Schema).
 *
 * Architecture:
 * - Claude handles reasoning + tool selection
 * - Gemini handles long content generation (descriptions, articles)
 * - Tools execute against Supabase (RLS-protected)
 */

// ============================================================================
// TOOL INPUT TYPES
// ============================================================================

export interface SearchProductsInput {
  query?: string;
  filter?:
    | "all"
    | "missing_description"
    | "missing_seo"
    | "low_seo_score"
    | "not_synced"
    | "with_drafts";
  limit?: number;
}

export interface GetProductInput {
  product_id: string;
}

export interface GetSeoScoresInput {
  filter?: "critical" | "warning" | "good" | "all";
  limit?: number;
}

export interface GetDashboardKPIsInput {
  store_id?: string;
}

export interface ListArticlesInput {
  status?: "draft" | "published" | "review" | "scheduled" | "all";
  limit?: number;
}

export interface GenerateProductContentInput {
  product_id: string;
  fields: (
    | "title"
    | "short_description"
    | "description"
    | "seo_title"
    | "meta_description"
  )[];
  tone?: string;
  language?: string;
}

export interface UpdateProductContentInput {
  product_id: string;
  fields: {
    title?: string;
    short_description?: string;
    description?: string;
    seo_title?: string;
    meta_description?: string;
  };
}

export interface PushToStoreInput {
  product_ids: string[];
}

export interface SuggestSeoFixInput {
  product_id: string;
}

export interface SearchArticlesInput {
  query?: string;
  limit?: number;
}

// ============================================================================
// TOOL RESULT TYPE
// ============================================================================

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================================================
// TOOL DEFINITIONS (for Claude function calling)
// ============================================================================

export const COPILOT_TOOLS = [
  // ------ READ TOOLS ------
  {
    name: "search_products" as const,
    description:
      "Recherche des produits dans le catalogue. Peut filtrer par nom, par état (sans description, SEO faible, non synchronisé, avec brouillons). Retourne les produits avec leurs métadonnées, score SEO, et statut de contenu.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Terme de recherche (nom du produit, SKU)",
        },
        filter: {
          type: "string",
          enum: [
            "all",
            "missing_description",
            "missing_seo",
            "low_seo_score",
            "not_synced",
            "with_drafts",
          ],
          description:
            "Filtre prédéfini. 'missing_description' = produits sans description, 'missing_seo' = sans meta SEO, 'low_seo_score' = score < 50, 'not_synced' = modifications non poussées, 'with_drafts' = contenu IA en attente",
        },
        limit: {
          type: "number",
          description: "Nombre max de résultats (défaut: 10, max: 50)",
        },
      },
    },
  },
  {
    name: "get_product" as const,
    description:
      "Récupère les détails complets d'un produit spécifique, incluant son contenu actuel, brouillon IA, métadonnées WooCommerce, score SEO, et statut de synchronisation.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "L'identifiant UUID du produit",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "get_seo_scores" as const,
    description:
      "Récupère les scores SEO des produits. Peut filtrer par niveau: 'critical' (< 40), 'warning' (40-70), 'good' (> 70). Retourne le score global, les sous-scores (titre, description, meta), et la date d'analyse.",
    input_schema: {
      type: "object" as const,
      properties: {
        filter: {
          type: "string",
          enum: ["critical", "warning", "good", "all"],
          description: "Filtrer par niveau de score SEO",
        },
        limit: {
          type: "number",
          description: "Nombre max de résultats (défaut: 20)",
        },
      },
    },
  },
  {
    name: "get_dashboard_kpis" as const,
    description:
      "Récupère les KPIs du dashboard: santé SEO globale (score moyen, produits critiques), couverture IA du catalogue (% produits optimisés), stats blog (articles publiés/brouillons), et statut de connexion boutique.",
    input_schema: {
      type: "object" as const,
      properties: {
        store_id: {
          type: "string",
          description: "ID de la boutique (optionnel, utilise la boutique active par défaut)",
        },
      },
    },
  },
  {
    name: "list_articles" as const,
    description:
      "Liste les articles de blog avec leur statut. Peut filtrer par statut: draft, published, review, scheduled.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["draft", "published", "review", "scheduled", "all"],
          description: "Filtrer par statut d'article",
        },
        limit: {
          type: "number",
          description: "Nombre max de résultats (défaut: 20)",
        },
      },
    },
  },

  // ------ GENERATE TOOLS (via Gemini) ------
  {
    name: "generate_product_content" as const,
    description:
      "Génère du contenu IA pour un produit (titre, description courte, description longue, titre SEO, meta description). Utilise Gemini pour la génération. Le contenu est sauvegardé en brouillon (draft_generated_content), pas directement appliqué.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "L'identifiant UUID du produit",
        },
        fields: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "title",
              "short_description",
              "description",
              "seo_title",
              "meta_description",
            ],
          },
          description: "Les champs à générer",
        },
        tone: {
          type: "string",
          description:
            "Ton de voix (professional, casual, persuasive, educational, storytelling). Défaut: professional",
        },
        language: {
          type: "string",
          description: "Langue de génération (fr, en, es, de). Défaut: fr",
        },
      },
      required: ["product_id", "fields"],
    },
  },
  {
    name: "suggest_seo_fix" as const,
    description:
      "Analyse un produit et génère des suggestions SEO concrètes: amélioration du titre, de la meta description, des mots-clés, de la structure du contenu. Retourne des recommandations actionnables.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "L'identifiant UUID du produit à analyser",
        },
      },
      required: ["product_id"],
    },
  },

  // ------ WRITE TOOLS ------
  {
    name: "update_product_content" as const,
    description:
      "Met à jour le contenu d'un produit (working_content). Permet de modifier le titre, la description courte, la description longue, le titre SEO, et la meta description. Les changements sont sauvegardés dans FLOWZ mais PAS encore poussés vers WooCommerce.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "L'identifiant UUID du produit",
        },
        fields: {
          type: "object",
          properties: {
            title: { type: "string", description: "Nouveau titre" },
            short_description: {
              type: "string",
              description: "Nouvelle description courte",
            },
            description: {
              type: "string",
              description: "Nouvelle description longue (HTML autorisé)",
            },
            seo_title: { type: "string", description: "Nouveau titre SEO" },
            meta_description: {
              type: "string",
              description: "Nouvelle meta description",
            },
          },
          description:
            "Les champs à mettre à jour. Seuls les champs fournis seront modifiés.",
        },
      },
      required: ["product_id", "fields"],
    },
  },
  {
    name: "push_to_store" as const,
    description:
      "Pousse les modifications de produits vers la boutique WooCommerce/Shopify. Synchronise le working_content vers la plateforme e-commerce. Nécessite que les produits aient du contenu modifié.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_ids: {
          type: "array",
          items: { type: "string" },
          description: "Liste des IDs de produits à synchroniser",
        },
      },
      required: ["product_ids"],
    },
  },
] as const;

// Tool name union type
export type CopilotToolName = (typeof COPILOT_TOOLS)[number]["name"];

// Map tool names to their input types
export type ToolInputMap = {
  search_products: SearchProductsInput;
  get_product: GetProductInput;
  get_seo_scores: GetSeoScoresInput;
  get_dashboard_kpis: GetDashboardKPIsInput;
  list_articles: ListArticlesInput;
  generate_product_content: GenerateProductContentInput;
  update_product_content: UpdateProductContentInput;
  push_to_store: PushToStoreInput;
  suggest_seo_fix: SuggestSeoFixInput;
};
