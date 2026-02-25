import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Rate limit: 10 req/min per user
const RATE_LIMIT_CONFIG = { maxRequests: 10, windowMs: 60_000 };

const requestSchema = z.object({
  seoScore: z.number().min(0).max(100),
  coveragePercent: z.number().min(0).max(100),
  kpis: z
    .object({
      seoScorePrevMonth: z.number().nullable().optional(),
      aiOptimizedProducts: z.number().optional(),
      aiOptimizedPrevMonth: z.number().nullable().optional(),
      catalogCoveragePercent: z.number().optional(),
      blogStats: z
        .object({
          totalArticles: z.number(),
          publishedCount: z.number(),
          draftCount: z.number(),
          lastCreatedAt: z.string().nullable(),
        })
        .optional(),
      seoHealth: z
        .object({
          averageScore: z.number(),
          analyzedProductsCount: z.number(),
          criticalCount: z.number(),
          warningCount: z.number(),
          goodCount: z.number(),
          topIssue: z.string().nullable(),
        })
        .optional(),
    })
    .passthrough(),
});

const insightSchema = z.object({
  id: z.string(),
  text: z.string().max(200),
  type: z.enum(["positive", "warning", "neutral", "tip"]),
  priority: z.enum(["critical", "important", "nice-to-have"]),
  ctaLabel: z.string().optional(),
  ctaRoute: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const rl = checkRateLimit(user.id, "insights-generate", RATE_LIMIT_CONFIG);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Validate body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { seoScore, coveragePercent, kpis } = parsed.data;

    // Gemini call
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ insights: [] });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Tu es un assistant IA pour un dashboard e-commerce SaaS. Analyse ces KPIs et génère 2-3 insights actionnables en français.

DONNÉES:
- Score SEO global: ${seoScore}/100${kpis.seoScorePrevMonth != null ? ` (mois dernier: ${kpis.seoScorePrevMonth})` : ""}
- Couverture catalogue IA: ${coveragePercent}%
- Produits optimisés IA: ${kpis.aiOptimizedProducts ?? "N/A"}${kpis.aiOptimizedPrevMonth != null ? ` (mois dernier: ${kpis.aiOptimizedPrevMonth})` : ""}
${kpis.blogStats ? `- Blog: ${kpis.blogStats.publishedCount} publiés, ${kpis.blogStats.draftCount} brouillons` : ""}
${kpis.seoHealth ? `- SEO Health: ${kpis.seoHealth.criticalCount} critiques, ${kpis.seoHealth.warningCount} warnings, ${kpis.seoHealth.goodCount} bons` : ""}

RÈGLES:
- Max 2-3 insights, chacun max 120 caractères
- Priorise les problèmes actionnables
- Sois concis et direct, pas de jargon
- Chaque insight doit avoir un type (positive/warning/tip/neutral) et une priorité (critical/important/nice-to-have)
- Si pertinent, suggère une route: /app/products, /app/blog, /app/seo, /app/products?sort=seo_score

Réponds en JSON strict: { "insights": [{ "id": "gemini-1", "text": "...", "type": "warning", "priority": "important", "ctaLabel": "Voir →", "ctaRoute": "/app/products" }] }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";

    let insights: z.infer<typeof insightSchema>[] = [];
    try {
      const jsonParsed = JSON.parse(text);
      const rawInsights = jsonParsed.insights ?? jsonParsed;
      if (Array.isArray(rawInsights)) {
        insights = rawInsights
          .map((i: unknown) => insightSchema.safeParse(i))
          .filter((r) => r.success)
          .map((r) => (r as { success: true; data: z.infer<typeof insightSchema> }).data)
          .slice(0, 3);
      }
    } catch {
      // Gemini returned invalid JSON — return empty, local heuristic covers it
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("[insights/generate] Error:", error);
    return NextResponse.json({ insights: [] });
  }
}
