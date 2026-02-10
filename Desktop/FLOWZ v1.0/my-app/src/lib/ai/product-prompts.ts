/**
 * Product Content Generation - AI Prompt Templates
 *
 * SEO-optimized prompt builders for batch product content generation.
 * Each builder creates a prompt targeting a specific content field.
 */

import type { ModularGenerationSettings } from '@/types/imageGeneration';

// ============================================================================
// CONSTANTS
// ============================================================================

export const SEO_CONSTANTS = {
    title: { minLength: 30, maxLength: 70, optimalLength: 60 },
    seoTitle: { minLength: 30, maxLength: 60, optimalLength: 55 },
    metaDescription: { minLength: 120, maxLength: 160, optimalLength: 150 },
    shortDescription: { minLength: 50, maxLength: 300, optimalLength: 160 },
    description: { minLength: 300, maxLength: 5000, optimalLength: 1000 },
    altText: { minLength: 10, maxLength: 125, optimalLength: 80 },
} as const;

export const TONE_MAP: Record<string, string> = {
    professional: 'Professionnel et crédible. Vocabulaire précis, ton autoritaire mais accessible.',
    casual: 'Décontracté et proche du client. Tutoiement possible, ton amical.',
    luxury: 'Haut de gamme et raffiné. Vocabulaire soutenu, évocation sensorielle, exclusivité.',
    technical: 'Technique et factuel. Spécifications détaillées, données chiffrées, précision.',
    persuasive: 'Commercial et vendeur. Arguments de vente, urgence, bénéfices client, CTA.',
};

export const LANGUAGE_MAP: Record<string, string> = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
};

const POWER_WORDS_FR = [
    'exclusif', 'premium', 'garanti', 'nouveau', 'essentiel',
    'performant', 'innovant', 'optimal', 'professionnel', 'unique',
];

// ============================================================================
// PRODUCT CONTEXT BUILDER (shared across prompts)
// ============================================================================

interface ProductContext {
    title: string;
    currentDescription?: string;
    shortDescription?: string;
    categories?: string[];
    attributes?: Array<{ name: string; options?: string[] }>;
    price?: number;
    sku?: string;
    imageUrl?: string;
    tags?: string[];
}

function buildProductContext(product: ProductContext): string {
    const parts: string[] = [];

    parts.push(`NOM DU PRODUIT: "${product.title}"`);

    if (product.categories?.length) {
        parts.push(`CATÉGORIES: ${product.categories.join(' > ')}`);
    }

    if (product.price) {
        parts.push(`PRIX: ${product.price} €`);
    }

    if (product.attributes?.length) {
        const attrs = product.attributes
            .map(a => `${a.name}: ${a.options?.join(', ') || 'N/A'}`)
            .join('\n  ');
        parts.push(`ATTRIBUTS:\n  ${attrs}`);
    }

    if (product.tags?.length) {
        parts.push(`TAGS: ${product.tags.join(', ')}`);
    }

    if (product.shortDescription) {
        parts.push(`DESCRIPTION COURTE ACTUELLE: "${product.shortDescription.slice(0, 200)}"`);
    }

    if (product.currentDescription) {
        parts.push(`DESCRIPTION ACTUELLE (extrait): "${product.currentDescription.slice(0, 500)}"`);
    }

    return parts.join('\n');
}

function getToneInstruction(tone: string): string {
    return TONE_MAP[tone] || TONE_MAP.professional;
}

function getLanguageName(code: string): string {
    return LANGUAGE_MAP[code] || 'Français';
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build prompt for generating an SEO-optimized product title
 */
export function buildProductTitlePrompt(
    product: ProductContext,
    settings: ModularGenerationSettings
): string {
    const wordLimit = settings.word_limits?.title || 15;

    return `Tu es un expert SEO e-commerce. Génère un titre de produit optimisé pour le référencement.

${buildProductContext(product)}

CONTRAINTES SEO:
- Longueur: ${SEO_CONSTANTS.title.minLength}-${SEO_CONSTANTS.title.maxLength} caractères (optimal: ${SEO_CONSTANTS.title.optimalLength})
- Limite: ${wordLimit} mots maximum
- Place le mot-clé principal EN DÉBUT de titre
- Inclus un power word si possible (${POWER_WORDS_FR.slice(0, 5).join(', ')})
- Pas de majuscules excessives
- Pas de caractères spéciaux inutiles

TON: ${getToneInstruction(settings.tone)}
LANGUE: ${getLanguageName(settings.language)}

Réponds UNIQUEMENT avec le titre, sans guillemets, sans explication.`;
}

/**
 * Build prompt for generating a short product description
 */
export function buildShortDescriptionPrompt(
    product: ProductContext,
    settings: ModularGenerationSettings
): string {
    const wordLimit = settings.word_limits?.short_description || 50;

    return `Tu es un copywriter e-commerce expert. Rédige une description courte de produit percutante et orientée conversion.

${buildProductContext(product)}

CONTRAINTES:
- ${wordLimit} mots maximum
- 2-3 phrases percutantes
- Commence par le BÉNÉFICE PRINCIPAL pour le client
- Inclus un argument de vente unique (USP)
- Termine par un micro-CTA implicite
- Pas de HTML, texte brut uniquement

TON: ${getToneInstruction(settings.tone)}
LANGUE: ${getLanguageName(settings.language)}

Réponds UNIQUEMENT avec la description courte, sans guillemets.`;
}

/**
 * Build prompt for generating a full HTML product description
 */
export function buildDescriptionPrompt(
    product: ProductContext,
    settings: ModularGenerationSettings
): string {
    const wordLimit = settings.word_limits?.description || 300;
    const opts = settings.structure_options;

    // Build structure instructions from settings
    const structureParts: string[] = [];
    if (opts.h2_titles) structureParts.push('- Utilise des titres <h2> pour structurer les sections');
    if (opts.benefits_list) structureParts.push(`- Inclus une liste de ${opts.benefits_count || 5} bénéfices avec <ul><li>`);
    if (opts.specs_table) structureParts.push('- Ajoute un tableau <table> des spécifications techniques');
    if (opts.cta) structureParts.push('- Termine par un appel à l\'action (CTA) engageant');

    const structureStr = structureParts.length > 0
        ? `\nSTRUCTURE HTML DEMANDÉE:\n${structureParts.join('\n')}`
        : '';

    return `Tu es un rédacteur e-commerce expert en SEO et en conversion. Rédige une description produit complète en HTML.

${buildProductContext(product)}

CONTRAINTES SEO:
- ${wordLimit} mots environ
- Densité de mots-clés: 1-2% (naturelle, pas de bourrage)
- Utilise des synonymes et variations sémantiques du nom du produit
- Structure avec balises HTML (h2, p, ul, li, strong, table si demandé)
- Pas de balises <h1> (réservé au titre produit)
- Pas de <div>, <span>, <style>, <script>
${structureStr}

STRUCTURE TYPE:
1. <h2> Introduction / accroche (1-2 phrases captivantes)
2. <p> Paragraphe principal avec bénéfices
3. <h2> Caractéristiques / Points forts
4. <ul> Liste des bénéfices clés
${opts.specs_table ? '5. <h2> Spécifications techniques\n6. <table> Tableau des specs' : ''}
${opts.cta ? '7. <p><strong> Appel à l\'action</strong></p>' : ''}

TON: ${getToneInstruction(settings.tone)}
LANGUE: ${getLanguageName(settings.language)}
MODE: ${settings.transform_mode === 'optimize' ? 'Optimise le contenu existant' : 'Réécris entièrement le contenu'}

Réponds UNIQUEMENT avec le HTML, sans bloc de code, sans explication.`;
}

/**
 * Build prompt for generating an SEO meta title
 */
export function buildSeoTitlePrompt(
    product: ProductContext,
    settings: ModularGenerationSettings
): string {
    return `Tu es un expert SEO. Génère un meta title (balise <title>) optimisé pour ce produit e-commerce.

${buildProductContext(product)}

CONTRAINTES SEO STRICTES:
- Longueur: ${SEO_CONSTANTS.seoTitle.minLength}-${SEO_CONSTANTS.seoTitle.maxLength} caractères (Google tronque à 60)
- Le mot-clé principal DOIT être dans les 3 premiers mots
- DIFFÉRENT du titre produit (apporte une valeur ajoutée)
- Format recommandé: [Mot-clé] - [Bénéfice] | [Marque]
- Pas de majuscules excessives
- Un seul séparateur (| ou -)

TON: ${getToneInstruction(settings.tone)}
LANGUE: ${getLanguageName(settings.language)}

Réponds UNIQUEMENT avec le meta title, sans guillemets, sans explication.`;
}

/**
 * Build prompt for generating an SEO meta description
 */
export function buildMetaDescriptionPrompt(
    product: ProductContext,
    settings: ModularGenerationSettings
): string {
    return `Tu es un expert SEO e-commerce. Génère une meta description optimisée pour le référencement et le taux de clic.

${buildProductContext(product)}

CONTRAINTES SEO STRICTES:
- Longueur: ${SEO_CONSTANTS.metaDescription.minLength}-${SEO_CONSTANTS.metaDescription.maxLength} caractères (optimal: ${SEO_CONSTANTS.metaDescription.optimalLength})
- Commence par un verbe d'action ou le bénéfice principal
- Inclus le mot-clé principal naturellement
- Ajoute un CTA implicite (Découvrez, Profitez, Commandez)
- Utilise des chiffres si pertinent (prix, pourcentage, quantité)
- Crée un sentiment d'urgence ou d'exclusivité

TON: ${getToneInstruction(settings.tone)}
LANGUE: ${getLanguageName(settings.language)}

Réponds UNIQUEMENT avec la meta description, sans guillemets.`;
}

/**
 * Build prompt for generating a product SKU
 */
export function buildSkuPrompt(
    product: ProductContext,
    settings: ModularGenerationSettings
): string {
    const format = settings.sku_format || {
        pattern: 'product_name_based',
        separator: '-',
        max_length: 12,
    };

    const patternDesc = {
        category_based: `Basé sur la catégorie + identifiant unique. Ex: ELEC-TV-001`,
        product_name_based: `Basé sur le nom du produit abrégé. Ex: TISS-CIEL-BLC`,
        custom: `Code alphanumérique unique aléatoire. Ex: PRD-X8K2M`,
    };

    return `Génère un SKU (Stock Keeping Unit) pour ce produit.

NOM: "${product.title}"
${product.categories?.length ? `CATÉGORIE: ${product.categories[0]}` : ''}
${product.sku ? `SKU ACTUEL: ${product.sku}` : ''}

RÈGLES:
- Pattern: ${patternDesc[format.pattern]}
- Séparateur: "${format.separator}"
- Longueur max: ${format.max_length} caractères
${format.prefix ? `- Préfixe obligatoire: "${format.prefix}"` : ''}
- Majuscules uniquement
- Pas d'espaces, pas de caractères spéciaux sauf le séparateur
- Doit être unique et mémorisable

Réponds UNIQUEMENT avec le SKU, sans explication.`;
}

/**
 * Build prompt for generating image alt text (with optional vision)
 */
export function buildAltTextPrompt(
    product: ProductContext,
    settings: ModularGenerationSettings,
    hasImage: boolean = false
): string {
    const visionPart = hasImage
        ? `\nUne image du produit est fournie. DÉCRIS CE QUE TU VOIS dans l'image en priorité.
Mentionne: couleurs, matériaux, forme, taille apparente, contexte d'utilisation visible.`
        : `\nAucune image fournie. Génère un alt text basé uniquement sur les informations textuelles.`;

    return `Tu es un expert en accessibilité web et SEO images. Génère un texte alternatif (alt text) optimisé pour ce produit.
${visionPart}

${buildProductContext(product)}

CONTRAINTES:
- Longueur: ${SEO_CONSTANTS.altText.minLength}-${SEO_CONSTANTS.altText.maxLength} caractères
- Descriptif et factuel (pas de "image de" ou "photo de")
- Inclus le mot-clé principal naturellement
- Utile pour les lecteurs d'écran (accessibilité)
- Pas de bourrage de mots-clés
LANGUE: ${getLanguageName(settings.language)}

Réponds UNIQUEMENT avec l'alt text, sans guillemets.`;
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Clean and parse Gemini response text for a specific field type
 */
export function parseGeminiResponse(rawText: string, fieldType: string): string {
    if (!rawText) return '';

    let cleaned = rawText.trim();

    // Remove markdown code fences if present
    cleaned = cleaned.replace(/^```(?:html|text|json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');

    // Remove surrounding quotes
    cleaned = cleaned.replace(/^["']|["']$/g, '');

    // Field-specific cleaning
    switch (fieldType) {
        case 'title':
        case 'seo_title':
        case 'sku':
            // Single line, no HTML
            cleaned = cleaned.replace(/<[^>]+>/g, '').split('\n')[0].trim();
            break;

        case 'short_description':
        case 'meta_description':
        case 'alt_text':
            // Plain text, no HTML, may be multi-sentence
            cleaned = cleaned.replace(/<[^>]+>/g, '').trim();
            break;

        case 'description':
            // HTML is expected - just normalize whitespace
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
            break;
    }

    return cleaned;
}
