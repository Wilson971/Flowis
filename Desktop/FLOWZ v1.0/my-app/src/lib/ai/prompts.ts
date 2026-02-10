/**
 * FLOWRITER v2.0 - Centralized Prompt Templates & Input Sanitization
 *
 * This module contains all AI prompt templates and security utilities
 * for the Flowriter article generation system.
 */

// ============================================================================
// SANITIZATION CONFIGURATION
// ============================================================================

export const SANITIZE_CONFIG = {
    maxTopicLength: 500,
    maxTitleLength: 200,
    maxOutlineItems: 200,
    maxKeywords: 20,
    maxCustomInstructionsLength: 1000,
    maxBlockTitleLength: 200,
    maxContentLength: 50000,
} as const;

// ============================================================================
// PROMPT INJECTION DETECTION
// ============================================================================

/**
 * Patterns that could indicate prompt injection attempts
 * These patterns detect common techniques used to manipulate LLMs
 */
const SUSPICIOUS_PATTERNS: RegExp[] = [
    // Instruction override attempts
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
    /disregard\s+(all\s+)?(previous|above|prior)/i,
    /forget\s+(everything|all)\s+(you\s+)?(know|learned)/i,

    // Role-play injection
    /you\s+are\s+now\s+(a|an)\s+/i,
    /pretend\s+(to\s+be|you\'?re)\s+/i,
    /act\s+as\s+(if\s+)?(a|an)\s+/i,

    // System prompt leakage attempts
    /new\s+instructions?:/i,
    /system\s*prompt:/i,
    /reveal\s+(your\s+)?(system|initial)\s+prompt/i,
    /what\s+(is|are)\s+your\s+(system\s+)?instructions/i,

    // Model-specific injection tokens
    /\[INST\]/i,
    /\[\/INST\]/i,
    /<<SYS>>/i,
    /<\|im_start\|>/i,
    /<\|im_end\|>/i,
    /<\|system\|>/i,
    /<\|user\|>/i,
    /<\|assistant\|>/i,

    // Jailbreak attempts
    /jailbreak/i,
    /DAN\s*mode/i,
    /do\s+anything\s+now/i,
    /bypass\s+(safety|content)\s+(filters?|restrictions?)/i,
];

/**
 * Check if input contains suspicious patterns
 */
export function detectSuspiciousInput(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Get details about why input was flagged
 */
export function getSuspiciousPatternDetails(text: string): string[] {
    if (!text) return [];
    return SUSPICIOUS_PATTERNS
        .filter(pattern => pattern.test(text))
        .map(pattern => pattern.source);
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize text input for safe inclusion in prompts
 *
 * @param text - The input text to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text safe for prompt inclusion
 */
export function sanitizeInput(text: string, maxLength: number = 1000): string {
    if (typeof text !== 'string') return '';

    // Trim and limit length
    let sanitized = text.trim().slice(0, maxLength);

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize whitespace (collapse multiple spaces/newlines)
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Escape characters that could break prompt structure
    sanitized = sanitized
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/`/g, '\\`');

    return sanitized;
}

/**
 * Sanitize an outline item
 */
export function sanitizeOutlineItem(item: any): any {
    return {
        ...item,
        title: sanitizeInput(item.title || '', SANITIZE_CONFIG.maxBlockTitleLength),
        content: item.content
            ? sanitizeInput(item.content, SANITIZE_CONFIG.maxContentLength)
            : undefined,
    };
}

/**
 * Sanitize keywords array
 */
export function sanitizeKeywords(keywords: string[]): string[] {
    if (!Array.isArray(keywords)) return [];
    return keywords
        .slice(0, SANITIZE_CONFIG.maxKeywords)
        .map(kw => sanitizeInput(kw, 100))
        .filter(Boolean);
}

// ============================================================================
// WRITING STYLE INSTRUCTIONS
// ============================================================================

export type WritingStyle =
    | 'Journalistique'
    | 'Académique'
    | 'Tutorial'
    | 'Storytelling'
    | 'Blog Lifestyle';

export const STYLE_INSTRUCTIONS: Record<WritingStyle, string> = {
    'Journalistique':
        'Factuel et objectif. Structure pyramide inversée. Réponse aux 5W (Qui, Quoi, Où, Quand, Pourquoi). Sources citées.',
    'Académique':
        'Rigoureux et analytique. Arguments étayés par des références. Vocabulaire précis. Structure thèse-démonstration-conclusion.',
    'Tutorial':
        'Pédagogique et pratique. Instructions étape par étape. Exemples concrets. Anticipation des erreurs courantes.',
    'Storytelling':
        'Narratif et immersif. Arc narratif avec tension. Personnages ou cas concrets. Émotions et rebondissements.',
    'Blog Lifestyle':
        'Personnel et authentique. Partage d\'expérience. Conseils pratiques. Ton proche du lecteur.',
};

export function getStyleInstructions(style?: string): string {
    return STYLE_INSTRUCTIONS[style as WritingStyle] || STYLE_INSTRUCTIONS['Blog Lifestyle'];
}

// ============================================================================
// TONE INSTRUCTIONS
// ============================================================================

export type WritingTone =
    | 'Expert'
    | 'Narratif'
    | 'Minimaliste'
    | 'Inspirant'
    | 'Conversationnel';

export const TONE_INSTRUCTIONS: Record<WritingTone, string> = {
    'Expert':
        'Autoritaire et crédible. Vocabulaire technique maîtrisé. Affirmations basées sur des données.',
    'Narratif':
        'Engageant comme une histoire. Suspense et révélations. Le lecteur veut connaître la suite.',
    'Minimaliste':
        'Direct et sans fioritures. Phrases courtes. Chaque mot compte. Pas de remplissage.',
    'Inspirant':
        'Motivant et positif. Focus sur les possibilités. Encouragement à l\'action.',
    'Conversationnel':
        'Comme une discussion entre amis. Questions rhétoriques. "Tu/Vous" direct. Accessible.',
};

export function getToneInstructions(tone?: string): string {
    return TONE_INSTRUCTIONS[tone as WritingTone] || 'Professionnel et clair.';
}

// ============================================================================
// PERSONA INSTRUCTIONS
// ============================================================================

export type AudiencePersona = 'beginner' | 'intermediate' | 'expert';

export const PERSONA_INSTRUCTIONS: Record<AudiencePersona, string> = {
    'beginner':
        'Explique chaque concept. Définis les termes techniques. Utilise des analogies simples. Pas de jargon.',
    'intermediate':
        'Équilibre accessibilité et profondeur. Explique les concepts clés. Exemples variés.',
    'expert':
        'Va droit au but. Termes techniques acceptés. Niveau avancé. Pas de sur-explication.',
};

export function getPersonaInstructions(persona?: string): string {
    return PERSONA_INSTRUCTIONS[persona as AudiencePersona] || PERSONA_INSTRUCTIONS['intermediate'];
}

// ============================================================================
// ARTICLE GENERATION PROMPT
// ============================================================================

export interface ArticlePromptParams {
    topic: string;
    title: string;
    outline: Array<{ type: string; title: string; level?: number }>;
    config: {
        style?: string;
        tone?: string;
        persona?: string;
        language?: string;
        targetWordCount?: number;
        targetKeywords?: string[];
        includeTableOfContents?: boolean;
        includeFAQ?: boolean;
        customInstructions?: string;
    };
}

export function buildArticlePrompt(params: ArticlePromptParams): string {
    const { topic, title, outline, config } = params;

    // Build structure string
    const structureStr = outline.map((o, index) => {
        const blockNum = `[${index + 1}]`;
        if (o.type === 'heading') {
            const level = o.level === 3 ? 'H3' : 'H2';
            return `${blockNum} ${level}: ${o.title}`;
        }
        return `${blockNum} [${o.type.toUpperCase()}]: ${o.title}`;
    }).join("\n");

    // Calculate words per section
    const headingCount = outline.filter(o => o.type === 'heading').length;
    const wordsPerSection = Math.round((config.targetWordCount || 1500) / Math.max(headingCount, 1));

    // Get instructions
    const styleInstructions = getStyleInstructions(config.style);
    const toneInstructions = getToneInstructions(config.tone);
    const personaInstructions = getPersonaInstructions(config.persona);

    // Custom instructions section
    const customSection = config.customInstructions
        ? `\n═══════════════════════════════════════════════════════════════
INSTRUCTIONS PERSONNALISÉES
═══════════════════════════════════════════════════════════════
${config.customInstructions}\n`
        : '';

    return `Tu es un rédacteur professionnel d'élite spécialisé dans le contenu ${config.style || 'Blog'}.
Rédige un article COMPLET et CAPTIVANT en Markdown.

═══════════════════════════════════════════════════════════════
ARTICLE À RÉDIGER
═══════════════════════════════════════════════════════════════
TITRE: "${title}"
SUJET: "${topic}"
MOT-CLÉS: ${config.targetKeywords?.join(', ') || 'Aucun spécifié'}

═══════════════════════════════════════════════════════════════
STRUCTURE EXACTE À SUIVRE
═══════════════════════════════════════════════════════════════
${structureStr}

═══════════════════════════════════════════════════════════════
PARAMÈTRES D'ÉCRITURE
═══════════════════════════════════════════════════════════════
📏 LONGUEUR: ${config.targetWordCount || 1500} mots (≈${wordsPerSection} mots/section)
🎯 TON: ${config.tone || 'Expert'} - ${toneInstructions}
✍️ STYLE: ${config.style || 'Blog Lifestyle'} - ${styleInstructions}
👤 AUDIENCE: ${config.persona || 'intermediate'} - ${personaInstructions}
🌍 LANGUE: ${config.language || 'Français'}
${customSection}
═══════════════════════════════════════════════════════════════
RÈGLES IMPÉRATIVES
═══════════════════════════════════════════════════════════════
1. SUIT EXACTEMENT la structure fournie - chaque bloc doit être présent
2. Commence par une ACCROCHE captivante (question, statistique, anecdote)
3. Utilise des TRANSITIONS fluides entre sections ("Par ailleurs", "De plus", "En revanche"...)
4. Intègre naturellement les MOTS-CLÉS sans sur-optimisation
5. Pour les blocs [IMAGE]: décris brièvement le visuel idéal entre crochets
6. Pour les blocs [FAQ]: formate en Q/R avec "**Q:**" et "**R:**"
7. Pour les blocs [QUOTE]: utilise le format Markdown > citation
8. Termine par une CONCLUSION actionnable avec CTA
9. ${config.includeTableOfContents ? 'Ajoute une table des matières après l\'intro' : 'Pas de table des matières'}
10. ${config.includeFAQ ? 'La section FAQ est OBLIGATOIRE' : ''}

═══════════════════════════════════════════════════════════════
FORMAT MARKDOWN
═══════════════════════════════════════════════════════════════
- ## pour H2 (sections principales)
- ### pour H3 (sous-sections)
- **gras** pour mots importants
- *italique* pour emphase
- - pour listes à puces
- 1. pour listes numérotées
- > pour citations
- \`code\` pour termes techniques

⚠️ IMPORTANT: NE PAS utiliser de blocs de code (\`\`\`markdown ou \`\`\`).
Écris directement le contenu Markdown sans l'entourer de balises de code.

GÉNÈRE MAINTENANT l'article complet en suivant EXACTEMENT cette structure:`;
}

// ============================================================================
// TITLE GENERATION PROMPT
// ============================================================================

export function buildTitleGenerationPrompt(topic: string, language: string = 'fr'): string {
    return `Tu es un expert SEO et copywriter. Génère 5 titres d'articles optimisés pour le sujet suivant.

SUJET: "${topic}"
LANGUE: ${language === 'fr' ? 'Français' : language}

Pour chaque titre, fournis:
1. Le titre (50-60 caractères idéalement)
2. 3-5 mots-clés pertinents
3. Un score SEO estimé (0-100)
4. La difficulté de ranking (easy/medium/hard)
5. Le volume de recherche estimé (low/medium/high)

RÈGLES:
- Titres accrocheurs mais naturels
- Inclure le mot-clé principal
- Éviter le clickbait excessif
- Varier les formats (How-to, Liste, Question, Guide)

Réponds en JSON avec ce format:
{
  "titles": [
    {
      "title": "...",
      "keywords": ["...", "..."],
      "seoScore": 85,
      "difficulty": "medium",
      "searchVolume": "high"
    }
  ]
}`;
}

// ============================================================================
// OUTLINE GENERATION PROMPT
// ============================================================================

export interface OutlinePromptParams {
    topic: string;
    title: string;
    keywords: string[];
    targetWordCount: number;
    style?: string;
    tone?: string;
    includeFAQ?: boolean;
}

export function buildOutlinePrompt(params: OutlinePromptParams): string {
    const { topic, title, keywords, targetWordCount, style, tone, includeFAQ } = params;

    // Calculate optimal section count based on word count
    const sectionCount = Math.max(3, Math.min(10, Math.floor(targetWordCount / 300)));

    return `Tu es un architecte de contenu expert. Crée un plan d'article structuré et optimisé SEO.

═══════════════════════════════════════════════════════════════
ARTICLE
═══════════════════════════════════════════════════════════════
TITRE: "${title}"
SUJET: "${topic}"
MOTS-CLÉS: ${keywords.join(', ')}
LONGUEUR CIBLE: ${targetWordCount} mots
STYLE: ${style || 'Blog Lifestyle'}
TON: ${tone || 'Expert'}

═══════════════════════════════════════════════════════════════
STRUCTURE DEMANDÉE
═══════════════════════════════════════════════════════════════
- ${sectionCount} sections principales (H2)
- 2-3 sous-sections (H3) par section si pertinent
- Suggère des blocs enrichis: [TABLE], [QUOTE], [IMAGE], [CODE], [FAQ]
${includeFAQ ? '- Inclure obligatoirement une section FAQ' : ''}

═══════════════════════════════════════════════════════════════
FORMAT DE SORTIE
═══════════════════════════════════════════════════════════════
Réponds en JSON:
{
  "outline": [
    { "type": "heading", "level": 2, "title": "Introduction captivante", "seoScore": 85 },
    { "type": "paragraph", "title": "Accroche et contexte" },
    { "type": "heading", "level": 2, "title": "Section principale 1" },
    { "type": "table", "title": "Comparatif des options" },
    { "type": "heading", "level": 3, "title": "Sous-section détaillée" },
    { "type": "quote", "title": "Citation d'expert" },
    { "type": "faq", "title": "Questions fréquentes" }
  ]
}`;
}

// ============================================================================
// REWRITE/EDIT PROMPTS
// ============================================================================

export type RewriteAction =
    | 'rewrite'
    | 'improve'
    | 'expand'
    | 'shorten'
    | 'translate'
    | 'continue'
    | 'simplify'
    | 'formalize'
    | 'factcheck';

export const REWRITE_INSTRUCTIONS: Record<RewriteAction, string> = {
    'rewrite': 'Reformule ce texte en gardant le même sens mais avec de nouvelles tournures de phrases.',
    'improve': 'Améliore ce texte: clarté, style, impact. Garde le sens original.',
    'expand': 'Développe ce texte avec plus de détails, exemples et explications. Double la longueur minimum.',
    'shorten': 'Condense ce texte à l\'essentiel. Garde les points clés, supprime le superflu. Divise la longueur par 2.',
    'translate': 'Traduis ce texte de manière naturelle, pas littérale.',
    'continue': 'Continue ce texte de manière fluide et cohérente. Écris 2-3 paragraphes supplémentaires.',
    'simplify': 'Simplifie ce texte pour qu\'il soit compréhensible par un débutant. Évite le jargon.',
    'formalize': 'Reformule ce texte dans un style plus professionnel et formel.',
    'factcheck': 'Analyse ce texte et indique: 1) Les affirmations vérifiables 2) Les potentielles inexactitudes 3) Les sources recommandées.',
};

export function buildRewritePrompt(
    text: string,
    action: RewriteAction,
    context?: string,
    language: string = 'fr'
): string {
    const instruction = REWRITE_INSTRUCTIONS[action];
    const contextSection = context ? `\nCONTEXTE: ${context}` : '';

    return `Tu es un éditeur professionnel.

INSTRUCTION: ${instruction}
LANGUE: ${language === 'fr' ? 'Français' : language}
${contextSection}

TEXTE À TRAITER:
"""
${text}
"""

Réponds uniquement avec le texte modifié, sans commentaires ni explications.`;
}

// ============================================================================
// SEO ANALYSIS PROMPT
// ============================================================================

export function buildSeoAnalysisPrompt(content: string, keywords: string[]): string {
    return `Tu es un expert SEO. Analyse cet article et fournis un rapport détaillé.

CONTENU:
"""
${content.slice(0, 10000)}
"""

MOTS-CLÉS CIBLÉS: ${keywords.join(', ')}

ANALYSE DEMANDÉE:
1. Score SEO global (0-100)
2. Densité des mots-clés (avec pourcentages)
3. Analyse de la lisibilité
4. Points forts
5. Améliorations suggérées (5 max)

Réponds en JSON:
{
  "overallScore": 78,
  "keywords": [
    { "keyword": "...", "count": 5, "density": 1.2, "status": "optimal|low|high" }
  ],
  "readability": {
    "score": 85,
    "avgSentenceLength": 15,
    "avgWordLength": 5,
    "level": "intermediate"
  },
  "strengths": ["...", "..."],
  "suggestions": [
    { "type": "keyword", "priority": "high", "message": "..." }
  ]
}`;
}

// ============================================================================
// META GENERATION PROMPT
// ============================================================================

export function buildMetaPrompt(content: string, title: string, keywords: string[]): string {
    return `Tu es un expert SEO. Génère les meta tags optimisés pour cet article.

TITRE: "${title}"
MOTS-CLÉS: ${keywords.join(', ')}

CONTENU (extrait):
"""
${content.slice(0, 2000)}
"""

GÉNÈRE:
1. Meta title (50-60 caractères, inclut le mot-clé principal)
2. Meta description (150-160 caractères, call-to-action, inclut des mots-clés)

Réponds en JSON:
{
  "metaTitle": "...",
  "metaDescription": "..."
}`;
}

// ============================================================================
// BLOCK SUGGESTION PROMPT
// ============================================================================

export function buildBlockSuggestionPrompt(
    blockType: string,
    parentTitle: string,
    topic: string,
    previousContext?: string
): string {
    const typeInstructions: Record<string, string> = {
        'heading': 'un titre de section accrocheur et informatif',
        'paragraph': 'un titre décrivant le contenu du paragraphe',
        'image': 'une description courte de l\'image suggérée',
        'table': 'un titre pour le tableau comparatif ou informatif',
        'quote': 'une suggestion de citation pertinente ou source',
        'faq': 'une question fréquente pertinente',
        'code': 'un titre décrivant l\'exemple de code',
    };

    const instruction = typeInstructions[blockType] || 'un titre pertinent';

    return `Tu es un assistant de rédaction. Suggère ${instruction} pour un article.

SUJET: "${topic}"
SECTION PARENTE: "${parentTitle}"
${previousContext ? `CONTEXTE PRÉCÉDENT: "${previousContext}"` : ''}
TYPE DE BLOC: ${blockType}

Réponds avec UNE SEULE suggestion courte (max 100 caractères), sans guillemets ni ponctuation finale.`;
}
