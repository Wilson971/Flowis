/**
 * Product Content Generation - AI Prompt Templates
 *
 * SEO-optimized prompt builders for batch product content generation.
 * Each builder creates a prompt targeting a specific content field.
 */

import type { ModularGenerationSettings } from '@/types/imageGeneration';
import { detectPromptInjection, sanitizeUserInput } from '@/lib/ai/prompt-safety';

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
// BANNED WORDS — words that sound robotic/AI-generated
// ============================================================================

const BANNED_WORDS_FR = [
    'exceptionnel', 'incontournable', 'révolutionnaire', 'unique en son genre',
    'incroyable', 'fantastique', 'de qualité supérieure', 'haut de gamme',
    'sublimez', 'transcendez', 'réinventez', "n'attendez plus",
    'game-changer', 'cutting-edge', 'seamless',
];

const BANNED_WORDS_EN = [
    'elevate', 'transform', 'unlock', 'game-changer', 'seamless',
    'cutting-edge', 'leverage', 'harness', 'incredible', 'amazing',
    'fantastic', 'wonderful', 'revolutionary',
];

// ============================================================================
// COPYWRITING FRAMEWORKS
// ============================================================================

const FRAMEWORKS = {
    PAS: `FRAMEWORK PAS (Problème → Agitation → Solution):
- Identifie le problème concret que le client rencontre au quotidien
- Amplifie pourquoi ne rien faire n'est pas une option (frustration, perte de temps, inconfort)
- Présente le produit comme LA réponse, avec des bénéfices spécifiques et concrets`,

    FAB: `FRAMEWORK FAB (Caractéristique → Avantage → Bénéfice):
- Pour chaque caractéristique clé, explique l'avantage technique
- Traduis immédiatement cet avantage en bénéfice concret pour la vie du client
- Commence toujours par le bénéfice, pas par la caractéristique technique`,

    BAB: `FRAMEWORK BAB (Avant → Après → Pont):
- Décris la situation actuelle insatisfaisante du client (1-2 phrases)
- Peins le tableau de sa vie améliorée avec ce produit (détails sensoriels)
- Explique comment le produit rend cette transformation possible`,
} as const;

/**
 * Select the best copywriting framework based on product context
 */
function selectFramework(product: ProductContext): string {
    // Technical products with specs → FAB
    if (product.attributes && product.attributes.length >= 3) {
        return FRAMEWORKS.FAB;
    }
    // Products with existing description suggesting lifestyle → BAB
    if (product.categories?.some(c =>
        /décor|lifestyle|mode|beauté|maison|jardin/i.test(c)
    )) {
        return FRAMEWORKS.BAB;
    }
    // Default: PAS works for most products
    return FRAMEWORKS.PAS;
}

// ============================================================================
// SHARED QUALITY RULES — injected into all content prompts
// ============================================================================

function getBannedWordsRule(language: string): string {
    const words = language === 'en' ? BANNED_WORDS_EN : BANNED_WORDS_FR;
    return `MOTS INTERDITS (ne JAMAIS utiliser) : ${words.join(', ')}`;
}

const SHARED_QUALITY_RULES = `
QUALITÉ RÉDACTIONNELLE (CRITIQUE — appliquer systématiquement):
- ANTI-RÉPÉTITION : le nom complet du produit apparaît UNE SEULE FOIS (premier titre ou première phrase). Ensuite, utilise des pronoms (il, ce, celui-ci), des synonymes ou des périphrases
- La marque et le modèle ne doivent JAMAIS apparaître plus de 2 fois dans tout le texte
- INTERDIT de répéter un même mot (hors articles/prépositions) plus de 2 fois dans tout le texte
- Varie le vocabulaire : synonymes, périphrases, termes du même champ sémantique
- RYTHME : alterne phrases courtes (3-8 mots), moyennes (8-15 mots) et longues (15-25 mots). Jamais 2 phrases consécutives de même longueur
- Ne commence JAMAIS deux phrases consécutives par le même mot
- Traduis CHAQUE caractéristique technique en bénéfice concret pour le client
- Utilise "vous/votre" naturellement pour impliquer le lecteur
- NE JAMAIS inclure le prix, réductions ou montants en euros
- Écris comme un vendeur passionné qui connaît le produit, pas comme une IA qui reformule des fiches techniques`;

// ============================================================================
// PRODUCT CONTEXT BUILDER (shared across prompts)
// ============================================================================

export interface ProductContext {
    title: string;
    currentDescription?: string;
    shortDescription?: string;
    categories?: string[];
    attributes?: Array<{ name: string; options?: string[] }>;
    price?: number | string;
    sku?: string;
    imageUrl?: string;
    tags?: string[];
}

/**
 * Sanitize a product text field: strip injection patterns and control chars.
 * Returns empty string if injection is detected (field is omitted from context).
 */
function safeProductField(value: string, maxLen: number = 500): string {
    if (!value) return '';
    if (detectPromptInjection(value)) return '';
    return sanitizeUserInput(value, maxLen);
}

function buildProductContext(product: ProductContext): string {
    const parts: string[] = [];

    const safeTitle = safeProductField(product.title, 200);
    parts.push(`NOM DU PRODUIT: "${safeTitle}"`);

    if (product.categories?.length) {
        const safeCats = product.categories
            .map(c => safeProductField(c, 100))
            .filter(Boolean);
        if (safeCats.length) parts.push(`CATÉGORIES: ${safeCats.join(' > ')}`);
    }

    // M3 fix: price is NOT included in prompt context (rule: never mention price)

    if (product.attributes?.length) {
        const attrs = product.attributes
            .map(a => {
                const name = safeProductField(a.name, 100);
                const opts = a.options?.map(o => safeProductField(o, 100)).filter(Boolean).join(', ') || 'N/A';
                return name ? `${name}: ${opts}` : '';
            })
            .filter(Boolean)
            .join('\n  ');
        if (attrs) parts.push(`ATTRIBUTS:\n  ${attrs}`);
    }

    if (product.tags?.length) {
        const safeTags = product.tags
            .map(t => safeProductField(t, 100))
            .filter(Boolean);
        if (safeTags.length) parts.push(`TAGS: ${safeTags.join(', ')}`);
    }

    if (product.shortDescription) {
        const safe = safeProductField(product.shortDescription, 200);
        if (safe) parts.push(`DESCRIPTION COURTE ACTUELLE: "${safe}"`);
    }

    if (product.currentDescription) {
        const safe = safeProductField(product.currentDescription, 500);
        if (safe) parts.push(`DESCRIPTION ACTUELLE (extrait): "${safe}"`);
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

    return `Tu es un vendeur passionné qui connaît parfaitement ce produit. Rédige une accroche courte qui donne envie d'acheter — comme si tu parlais à un client en boutique.

${buildProductContext(product)}

CONTRAINTES:
- ${wordLimit} mots maximum
- 2-3 phrases percutantes
- Commence par le BÉNÉFICE PRINCIPAL pour le client (pas par le nom du produit)
- Inclus un argument de vente unique (USP)
- Termine par un micro-CTA implicite
- Pas de HTML, texte brut uniquement

${SHARED_QUALITY_RULES}
${getBannedWordsRule(settings.language)}

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
    const framework = selectFramework(product);

    // Build structure instructions from settings
    const structureParts: string[] = [];
    if (opts.h2_titles) structureParts.push('- Utilise des titres <h2> pour structurer les sections');
    if (opts.benefits_list) structureParts.push(`- Inclus une liste de ${opts.benefits_count || 5} bénéfices avec <ul><li>`);
    if (opts.specs_table) structureParts.push('- Ajoute un tableau <table> des spécifications techniques');
    if (opts.cta) structureParts.push('- Termine par un appel à l\'action (CTA) engageant');

    const structureStr = structureParts.length > 0
        ? `\nSTRUCTURE HTML DEMANDÉE:\n${structureParts.join('\n')}`
        : '';

    return `Tu es un rédacteur e-commerce chevronné. Tu écris comme un humain passionné par les produits, pas comme une IA. Ton objectif : que le client se projette et ait envie d'acheter.

${buildProductContext(product)}

${framework}

CONTRAINTES SEO:
- ${wordLimit} mots environ
- Densité de mots-clés: 1-2% (naturelle, pas de bourrage)
- Utilise au moins 5 synonymes ou termes du même champ sémantique que le produit
- Structure avec balises HTML (h2, p, ul, li, strong, table si demandé)
- Pas de balises <h1> (réservé au titre produit)
- Pas de <div>, <span>, <style>, <script>
${structureStr}

${SHARED_QUALITY_RULES}
${getBannedWordsRule(settings.language)}

STRUCTURE DES LISTES À PUCES:
- Chaque puce doit suivre le format : caractéristique concrète → bénéfice pour le client
- Commence chaque puce par un mot DIFFÉRENT (verbe d'action varié)
- Pas de structure parallèle systématique — varie les formulations

TITRES <h2>:
- Chaque titre doit apporter un angle DIFFÉRENT (pas de reformulations)
- Interdiction de reprendre le nom du produit dans plus d'un seul titre

HUMANISATION:
- Inclus au moins un détail sensoriel (toucher, visuel, sensation d'usage)
- Inclus un cas d'usage concret tiré de la vie quotidienne
- Tu peux inclure une concession honnête si pertinent ("ce n'est pas le plus léger, mais...")

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
    settings: ModularGenerationSettings,
    storeName?: string,
    gscKeywords?: Array<{ query: string; impressions: number; position: number }>
): string {
    const storeInstruction = storeName
        ? `\n- OBLIGATOIRE: Le meta title DOIT se terminer par " | ${storeName}". Ce suffixe compte dans la limite de caractères.`
        : '';

    const gscContext = gscKeywords && gscKeywords.length > 0
        ? `\nDONNÉES GOOGLE SEARCH CONSOLE (vraies recherches) :\n` +
          gscKeywords.slice(0, 5).map(kw =>
              `  - "${kw.query}" — ${kw.impressions} impressions, pos. ${kw.position.toFixed(1)}`
          ).join('\n') +
          `\nUtilise ces termes réels comme base pour le meta title.`
        : '';

    return `Tu es un expert SEO. Génère un meta title (balise <title>) optimisé pour ce produit e-commerce.

${buildProductContext(product)}
${storeName ? `BOUTIQUE: ${storeName}` : ''}${gscContext}

CONTRAINTES SEO STRICTES:
- Longueur: ${SEO_CONSTANTS.seoTitle.minLength}-${SEO_CONSTANTS.seoTitle.maxLength} caractères (Google tronque à 60)
- Le mot-clé principal DOIT être dans les 3 premiers mots
- DIFFÉRENT du titre produit (apporte une valeur ajoutée)
- Format recommandé: [Mot-clé] - [Bénéfice] | [Nom Boutique]
- Pas de majuscules excessives
- Un seul séparateur (| ou -)${storeInstruction}

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
    return `Tu es un copywriter SEO. Rédige une meta description qui donne envie de cliquer — comme un pitch de 2 phrases à un client pressé.

${buildProductContext(product)}

CONTRAINTES SEO:
- Longueur: ${SEO_CONSTANTS.metaDescription.minLength}-${SEO_CONSTANTS.metaDescription.maxLength} caractères (optimal: ${SEO_CONSTANTS.metaDescription.optimalLength})
- Commence par le bénéfice principal ou un verbe d'action fort
- Inclus le mot-clé principal une seule fois, naturellement
- Termine par un CTA implicite (un verbe d'action, pas un "cliquez ici")
- NE JAMAIS inclure le prix, réductions ou montants en euros

QUALITÉ RÉDACTIONNELLE:
- Ne mentionne le nom du produit qu'UNE SEULE FOIS — utilise ensuite un pronom ou un synonyme
- Ne répète JAMAIS un mot ou un nombre déjà présent dans la phrase
- Fusionne les infos redondantes (marque, modèle, catégorie) en une seule mention fluide
- Chaque mot doit compter — aucun remplissage
- Écris de façon naturelle, comme un vendeur qui résume le produit en une phrase

${getBannedWordsRule(settings.language)}

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
// GEMINI GENERATION CONFIG
// ============================================================================

/**
 * Get optimal Gemini generation config per field type.
 * Higher temperature = more creative/varied text, less repetitive.
 */
export function getGenerationConfig(fieldType: string): { temperature: number; topP: number; frequencyPenalty: number } {
    switch (fieldType) {
        case 'title':
        case 'seo_title':
        case 'sku':
            // Titles need precision, low creativity
            return { temperature: 0.6, topP: 0.85, frequencyPenalty: 0.2 };

        case 'short_description':
        case 'meta_description':
        case 'alt_text':
            // Short copy needs creativity + anti-repetition
            return { temperature: 0.8, topP: 0.9, frequencyPenalty: 0.4 };

        case 'description':
            // Long descriptions need max creativity and vocabulary diversity
            return { temperature: 0.85, topP: 0.92, frequencyPenalty: 0.5 };

        default:
            return { temperature: 0.7, topP: 0.9, frequencyPenalty: 0.3 };
    }
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
            // HTML is expected — sanitize: allow only safe tags, strip event handlers & dangerous attrs
            cleaned = cleaned
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
                .replace(/<object[\s\S]*?<\/object>/gi, '')
                .replace(/<embed[\s\S]*?>/gi, '')
                .replace(/<link[\s\S]*?>/gi, '')
                .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
                .replace(/\bon\w+\s*=\s*\S+/gi, '')
                .replace(/javascript\s*:/gi, '')
                .replace(/data\s*:/gi, 'data_blocked:')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            break;
    }

    return cleaned;
}
