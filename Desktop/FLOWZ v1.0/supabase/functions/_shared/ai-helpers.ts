/**
 * AI Helpers - Utilitaires pour la génération IA
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationOptions {
    language?: string;
    tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal';
    maxLength?: number;
    focusKeyword?: string;
    includeEmojis?: boolean;
    style?: string;
}

export interface ProductContext {
    title: string;
    description?: string;
    short_description?: string;
    price?: number;
    regular_price?: number;
    sale_price?: number;
    sku?: string;
    categories?: string[];
    tags?: string[];
    attributes?: Array<{ name: string; options: string[] }>;
    brand?: string;
    image_url?: string;
    seo_title?: string;
    seo_description?: string;
}

export interface GenerationResult {
    success: boolean;
    content?: string;
    error?: string;
    tokens_used?: number;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

const TONE_INSTRUCTIONS: Record<string, string> = {
    professional: "Utilise un ton professionnel et factuel. Sois précis et informatif.",
    casual: "Utilise un ton décontracté et accessible. Sois amical et engageant.",
    enthusiastic: "Utilise un ton enthousiaste et dynamique. Montre l'excitation pour le produit.",
    formal: "Utilise un ton formel et élégant. Sois raffiné et prestigieux.",
};

const LANGUAGE_NAMES: Record<string, string> = {
    fr: "français",
    en: "anglais",
    es: "espagnol",
    de: "allemand",
    it: "italien",
};

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

export function buildDescriptionPrompt(
    product: ProductContext,
    options: GenerationOptions = {}
): string {
    const language = LANGUAGE_NAMES[options.language || 'fr'] || 'français';
    const tone = TONE_INSTRUCTIONS[options.tone || 'professional'];
    const maxLength = options.maxLength || 800;
    const keyword = options.focusKeyword;

    let prompt = `Tu es un expert en rédaction e-commerce SEO. 
Génère une description de produit optimisée pour le SEO en ${language}.

PRODUIT:
- Titre: ${product.title}
${product.short_description ? `- Résumé: ${product.short_description}` : ''}
${product.categories?.length ? `- Catégories: ${product.categories.join(', ')}` : ''}
${product.price ? `- Prix: ${product.price}€` : ''}
${product.brand ? `- Marque: ${product.brand}` : ''}
${product.attributes?.length ? `- Caractéristiques: ${product.attributes.map(a => `${a.name}: ${a.options.join(', ')}`).join('; ')}` : ''}

INSTRUCTIONS:
${tone}
- Longueur maximum: ${maxLength} caractères
- Structure le texte avec des paragraphes courts
- Mets en avant les bénéfices pour le client
- Inclus des mots-clés naturellement pour le SEO
${keyword ? `- Mot-clé principal à intégrer naturellement: "${keyword}"` : ''}
${options.includeEmojis ? '- Tu peux utiliser des emojis pertinents' : '- N\'utilise pas d\'emojis'}

Génère uniquement la description, sans titre ni formatage Markdown.`;

    return prompt;
}

export function buildSeoTitlePrompt(
    product: ProductContext,
    options: GenerationOptions = {}
): string {
    const language = LANGUAGE_NAMES[options.language || 'fr'] || 'français';
    const keyword = options.focusKeyword;

    let prompt = `Tu es un expert SEO e-commerce.
Génère un titre SEO optimisé en ${language} pour cette fiche produit.

PRODUIT:
- Titre actuel: ${product.title}
${product.categories?.length ? `- Catégories: ${product.categories.join(', ')}` : ''}
${product.brand ? `- Marque: ${product.brand}` : ''}

INSTRUCTIONS:
- Maximum 60 caractères (avec espaces)
- Inclus le mot-clé principal en début de titre si possible
- Rends le titre attractif et descriptif
- Évite le bourrage de mots-clés
${keyword ? `- Mot-clé principal: "${keyword}"` : ''}

Génère uniquement le titre SEO, rien d'autre.`;

    return prompt;
}

export function buildMetaDescriptionPrompt(
    product: ProductContext,
    options: GenerationOptions = {}
): string {
    const language = LANGUAGE_NAMES[options.language || 'fr'] || 'français';
    const keyword = options.focusKeyword;

    let prompt = `Tu es un expert SEO e-commerce.
Génère une meta description optimisée en ${language} pour cette fiche produit.

PRODUIT:
- Titre: ${product.title}
${product.short_description ? `- Résumé: ${product.short_description}` : ''}
${product.categories?.length ? `- Catégories: ${product.categories.join(', ')}` : ''}
${product.price ? `- Prix: ${product.price}€` : ''}

INSTRUCTIONS:
- Exactement entre 150 et 160 caractères (avec espaces)
- Inclus un appel à l'action
- Mentionne un bénéfice clé
- Rends le texte engageant pour maximiser le CTR
${keyword ? `- Intègre naturellement le mot-clé: "${keyword}"` : ''}

Génère uniquement la meta description, rien d'autre.`;

    return prompt;
}

export function buildImageAltPrompt(
    product: ProductContext,
    imageContext: { position?: number; isMain?: boolean } = {}
): string {
    const position = imageContext.position ?? 1;
    const isMain = imageContext.isMain ?? position === 1;

    let prompt = `Tu es un expert en accessibilité web et SEO images.
Génère un texte alternatif (alt text) descriptif pour une image de produit e-commerce.

PRODUIT:
- Titre: ${product.title}
${product.categories?.length ? `- Catégories: ${product.categories.join(', ')}` : ''}
${product.brand ? `- Marque: ${product.brand}` : ''}

CONTEXTE IMAGE:
- Position: Image ${position}${isMain ? ' (image principale)' : ''}

INSTRUCTIONS:
- Maximum 125 caractères
- Décris ce que montre probablement l'image
- Inclus le nom du produit
- Sois descriptif mais concis
- Évite de commencer par "Image de" ou "Photo de"

Génère uniquement le alt text, rien d'autre.`;

    return prompt;
}

export function buildShortDescriptionPrompt(
    product: ProductContext,
    options: GenerationOptions = {}
): string {
    const language = LANGUAGE_NAMES[options.language || 'fr'] || 'français';
    const tone = TONE_INSTRUCTIONS[options.tone || 'professional'];

    let prompt = `Tu es un expert en rédaction e-commerce.
Génère une description courte accrocheuse en ${language} pour cette fiche produit.

PRODUIT:
- Titre: ${product.title}
${product.description ? `- Description longue: ${product.description.substring(0, 300)}...` : ''}
${product.categories?.length ? `- Catégories: ${product.categories.join(', ')}` : ''}
${product.price ? `- Prix: ${product.price}€` : ''}

INSTRUCTIONS:
${tone}
- Maximum 160 caractères
- Mets en avant le bénéfice principal
- Crée un sentiment d'urgence ou de désir
- Une ou deux phrases maximum

Génère uniquement la description courte, rien d'autre.`;

    return prompt;
}

// ============================================================================
// API HELPERS
// ============================================================================

export async function callOpenAI(
    prompt: string,
    apiKey: string,
    options: { maxTokens?: number; temperature?: number } = {}
): Promise<GenerationResult> {
    const maxTokens = options.maxTokens || 500;
    const temperature = options.temperature || 0.7;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Tu es un assistant expert en e-commerce et SEO. Tu génères du contenu de haute qualité, optimisé pour le référencement et la conversion.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: maxTokens,
                temperature,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[callOpenAI] Error:", error);
            return {
                success: false,
                error: `OpenAI API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        const tokensUsed = data.usage?.total_tokens;

        if (!content) {
            return {
                success: false,
                error: "No content generated",
            };
        }

        return {
            success: true,
            content,
            tokens_used: tokensUsed,
        };
    } catch (error) {
        console.error("[callOpenAI] Exception:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function truncateToLength(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength - 20) {
        return truncated.substring(0, lastSpace).trim();
    }

    return truncated.trim();
}

export function sanitizeHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}
