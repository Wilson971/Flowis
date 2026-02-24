import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { RETRY_CONFIG, calculateBackoff, classifyError } from "@/lib/ai/retry";

export const runtime = "nodejs";
export const maxDuration = 30;

// ============================================================================
// Validation
// ============================================================================

const requestSchema = z.object({
    field: z.enum([
        "meta_title",
        "meta_description",
        "title",
        "short_description",
        "description",
        "slug",
    ]),
    current_value: z.string().max(10000).default(""),
    product_title: z.string().max(500).default(""),
    product_description: z.string().max(5000).optional().default(""),
    focus_keyword: z.string().max(100).optional().default(""),
    store_name: z.string().max(200).optional().default(""),
    gsc_keywords: z.array(z.object({
        query: z.string().optional().default(""),
        impressions: z.coerce.number().default(0),
        position: z.coerce.number().default(0),
    })).max(10).optional(),
});

// ============================================================================
// Field-specific prompt instructions
// ============================================================================

const FIELD_INSTRUCTIONS: Record<string, { role: string; constraints: string; idealLength: string }> = {
    meta_title: {
        role: "titre SEO (meta title)",
        constraints: "Doit contenir le mot-clé principal, être accrocheur et unique. Ne pas dépasser 60 caractères. IMPORTANT: Chaque suggestion DOIT se terminer par ' | {nom_boutique}' (pipe + nom de la boutique). Le comptage des 60 caractères inclut ce suffixe.",
        idealLength: "50-60 caractères (incluant le suffixe ' | nom_boutique')",
    },
    meta_description: {
        role: "meta-description SEO",
        constraints: "Doit contenir un appel à l'action (CTA), le mot-clé principal, et inciter au clic. Ne pas dépasser 160 caractères.",
        idealLength: "130-160 caractères",
    },
    title: {
        role: "titre produit (H1)",
        constraints: "Doit être descriptif, contenir le mot-clé principal, et être attractif pour l'acheteur.",
        idealLength: "30-60 caractères",
    },
    short_description: {
        role: "description courte produit",
        constraints: "Résumé vendeur du produit. Doit mettre en avant les bénéfices principaux.",
        idealLength: "100-200 caractères",
    },
    description: {
        role: "description longue produit",
        constraints: "Doit être structurée avec des sous-titres, des listes de bénéfices, et inclure le mot-clé naturellement.",
        idealLength: "400-800 caractères",
    },
    slug: {
        role: "slug URL",
        constraints: "Doit être court, en minuscules, avec des tirets. Contenir le mot-clé principal. Format: mot1-mot2-mot3.",
        idealLength: "3-5 mots séparés par des tirets",
    },
};

// ============================================================================
// POST handler
// ============================================================================

export async function POST(request: NextRequest) {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Per-request rate limiting
    const { checkRateLimit, RATE_LIMIT_SEO_SUGGEST } = await import('@/lib/rate-limit');
    const rateLimit = checkRateLimit(user.id, 'seo-suggest', RATE_LIMIT_SEO_SUGGEST);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Trop de requêtes. Veuillez patienter.', code: 'RATE_LIMITED' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
        );
    }

    // Validate body
    let body: z.infer<typeof requestSchema>;
    try {
        const raw = await request.json();
        body = requestSchema.parse(raw);
    } catch (e) {
        const zodErrors = e instanceof z.ZodError ? e.issues.map(i => `${i.path.join('.')}: ${i.message}`) : [];
        return NextResponse.json({ error: "Requête invalide", details: zodErrors }, { status: 400 });
    }

    const { field, current_value, product_title, product_description, focus_keyword, store_name, gsc_keywords } = body;
    const instructions = FIELD_INSTRUCTIONS[field];

    if (!instructions) {
        return NextResponse.json({ error: "Champ non supporté" }, { status: 400 });
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
    }

    // Build prompt
    const storeNameSuffix = field === "meta_title" && store_name ? ` | ${store_name}` : "";
    const storeInstruction = field === "meta_title" && store_name
        ? `\n- OBLIGATOIRE: Chaque suggestion doit se terminer par " | ${store_name}". Ce suffixe compte dans la limite de caractères.`
        : "";

    const gscContext = gsc_keywords && gsc_keywords.length > 0
        ? `\n**Données Google Search Console (vraies recherches utilisateurs) :**\n` +
          gsc_keywords.slice(0, 5).map(kw =>
              `- "${kw.query}" — ${kw.impressions} impressions, position ${kw.position.toFixed(1)}`
          ).join('\n')
        : '';

    const gscInstruction = gsc_keywords && gsc_keywords.length > 0
        ? '\n- IMPORTANT: Utilise les termes des requêtes GSC comme source de vérité pour les intentions de recherche réelles. Intègre naturellement les mots ayant le plus d\'impressions.'
        : '';

    const prompt = `Tu es un expert SEO e-commerce francophone. Génère exactement 3 suggestions optimisées pour le ${instructions.role} d'un produit.

**Produit:** ${product_title}
${product_description ? `**Description:** ${product_description.substring(0, 500)}` : ""}
${focus_keyword ? `**Mot-clé principal:** ${focus_keyword}` : ""}
${store_name ? `**Boutique:** ${store_name}` : ""}${gscContext}
**Valeur actuelle:** "${current_value || "(vide)"}"

**Contraintes:**
- ${instructions.constraints}
- Longueur idéale: ${instructions.idealLength}
- Langue: français
- Ton: professionnel et vendeur${storeInstruction}${gscInstruction}

**Format de réponse (JSON strict, rien d'autre):**
[
  { "text": "suggestion 1", "rationale": "explication courte" },
  { "text": "suggestion 2", "rationale": "explication courte" },
  { "text": "suggestion 3", "rationale": "explication courte" }
]

Réponds UNIQUEMENT avec le JSON, sans markdown, sans backticks, sans texte autour.`;

    // Call Gemini with retry
    const ai = new GoogleGenAI({ apiKey });

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt,
                config: {
                    temperature: 0.8,
                    maxOutputTokens: 1024,
                },
            });

            const text = response.text?.trim() || "";

            // Parse JSON from response (handle potential markdown wrapping)
            let cleanText = text;
            if (cleanText.startsWith("```")) {
                cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            }

            let suggestions: Array<{ text: string; rationale: string }>;
            try {
                suggestions = JSON.parse(cleanText);
            } catch {
                return NextResponse.json(
                    { error: "Réponse IA invalide" },
                    { status: 502 }
                );
            }

            if (!Array.isArray(suggestions) || suggestions.length === 0) {
                return NextResponse.json(
                    { error: "Aucune suggestion générée" },
                    { status: 502 }
                );
            }

            return NextResponse.json({
                suggestions: suggestions.slice(0, 3).map((s) => ({
                    text: String(s.text || ""),
                    rationale: String(s.rationale || ""),
                })),
                field,
            });
        } catch (error) {
            const classified = classifyError(error);

            if (!classified.retryable || attempt === RETRY_CONFIG.maxRetries) {
                return NextResponse.json(
                    { error: classified.message, code: classified.code },
                    { status: 502 }
                );
            }

            await new Promise((r) => setTimeout(r, calculateBackoff(attempt)));
        }
    }

    return NextResponse.json({ error: "Échec après plusieurs tentatives" }, { status: 502 });
}
