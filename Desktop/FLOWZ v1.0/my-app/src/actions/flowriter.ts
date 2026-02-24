'use server'

import { GoogleGenAI, Type } from "@google/genai";
import { BlockType, TitleSuggestion, HeadingLevel, SeoAnalysisResult, OutlineItem } from "@/types/blog-ai";

const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

// ============================================================================
// INTELLIGENT STRUCTURE HELPERS
// ============================================================================

/**
 * Calculate optimal number of sections based on word count
 * Rule: ~250-400 words per main section
 */
function calculateOptimalSections(wordCount: number): { main: number; sub: number } {
    if (wordCount <= 500) {
        return { main: 2, sub: 0 }; // Very short: intro + conclusion only
    } else if (wordCount <= 800) {
        return { main: 3, sub: 1 }; // Short: 3 sections, 1 subsection
    } else if (wordCount <= 1200) {
        return { main: 4, sub: 2 }; // Medium: 4 sections
    } else if (wordCount <= 1800) {
        return { main: 5, sub: 4 }; // Standard: 5 sections with subsections
    } else if (wordCount <= 2500) {
        return { main: 6, sub: 6 }; // Long: 6 sections
    } else if (wordCount <= 3500) {
        return { main: 7, sub: 8 }; // Very long: 7 sections
    } else {
        return { main: 8, sub: 10 }; // Pillar content: 8+ sections
    }
}

/**
 * Get structure guidance based on writing style
 */
function getStyleStructureGuidance(style?: string): string {
    switch (style) {
        case 'Journalistique':
            return 'Structure pyramide inversée: info clé en premier, détails ensuite. Sections courtes et factuelles.';
        case 'Académique':
            return 'Structure thèse-antithèse-synthèse. Sections avec argumentation rigoureuse et références.';
        case 'Tutorial':
            return 'Structure étape par étape numérotée. Inclure des blocs code/image pour chaque étape.';
        case 'Storytelling':
            return 'Structure narrative: situation initiale → problème → solution → résolution. Arc narratif.';
        case 'Blog Lifestyle':
        default:
            return 'Structure conversationnelle avec anecdotes. Paragraphes courts, visuels fréquents.';
    }
}

/**
 * Get heading style guidance based on tone
 */
function getToneGuidance(tone?: string): string {
    switch (tone) {
        case 'Expert':
            return 'Titres précis et techniques. Vocabulaire spécialisé.';
        case 'Narratif':
            return 'Titres intrigants et accrocheurs. Style storytelling.';
        case 'Minimaliste':
            return 'Titres courts et directs. Pas de fioritures.';
        case 'Inspirant':
            return 'Titres motivants et positifs. Orientés bénéfices.';
        case 'Conversationnel':
            return 'Titres sous forme de questions ou interpellations. Style familier.';
        default:
            return 'Titres clairs et professionnels.';
    }
}

/**
 * Get complexity guidance based on target persona
 */
function getPersonaGuidance(persona?: string): string {
    switch (persona) {
        case 'beginner':
            return 'Explications détaillées, définitions des termes, exemples simples. Éviter le jargon.';
        case 'expert':
            return 'Aller droit au but, termes techniques acceptés, exemples avancés.';
        case 'intermediate':
        default:
            return 'Équilibre entre accessibilité et profondeur. Expliquer les concepts clés.';
    }
}

// ============================================================================
// v2.0: SEMANTIC STRUCTURE FRAMEWORK
// ============================================================================

/**
 * Get semantic structure template based on content type
 * This ensures logical flow: Hook → Context → Core → Proof → Action
 */
function getSemanticStructureTemplate(style?: string, wordCount?: number): string {
    const isLong = (wordCount || 1500) >= 2000;

    switch (style) {
        case 'Journalistique':
            return `
STRUCTURE PYRAMIDE INVERSÉE (Journalistique):
1. ACCROCHE: Fait principal en une phrase percutante
2. ESSENTIEL: Qui, Quoi, Où, Quand, Pourquoi (5W)
3. CONTEXTE: Background et enjeux
4. DÉTAILS: Approfondissement chronologique
5. PERSPECTIVES: Réactions, suite possible
${isLong ? '6. ENCADRÉ: Focus spécifique ou interview' : ''}`;

        case 'Académique':
            return `
STRUCTURE THÈSE-DÉMONSTRATION (Académique):
1. INTRODUCTION: Problématique et annonce du plan
2. ÉTAT DE L'ART: Ce qu'on sait déjà (avec bloc [TABLE] comparatif)
3. ANALYSE: Argumentation principale avec sous-sections
4. DISCUSSION: Limites et contre-arguments
5. CONCLUSION: Synthèse et ouvertures
${isLong ? '6. ANNEXES: Méthodologie ou données complémentaires' : ''}`;

        case 'Tutorial':
            return `
STRUCTURE ÉTAPE PAR ÉTAPE (Tutorial):
1. INTRODUCTION: Objectif et prérequis (avec bloc [TABLE] des prérequis)
2. PRÉPARATION: Configuration/Setup nécessaire
3. ÉTAPES PRINCIPALES: Blocs numérotés avec [CODE] ou [IMAGE] chacun
4. VÉRIFICATION: Tests et validation (avec [CODE] de test)
5. DÉPANNAGE: Erreurs courantes en [FAQ]
6. CONCLUSION: Résumé et ressources`;

        case 'Storytelling':
            return `
STRUCTURE NARRATIVE (Storytelling):
1. ACCROCHE: Scène d'ouverture immersive
2. CONTEXTE: Présentation du personnage/situation (avec [QUOTE])
3. PROBLÈME: L'obstacle ou le défi rencontré
4. TENTATIVES: Les essais et échecs (tension narrative)
5. RÉVÉLATION: Le tournant décisif
6. RÉSOLUTION: La solution et ses résultats
7. LEÇON: Ce qu'on en retient (avec [QUOTE] inspirante)`;

        case 'Blog Lifestyle':
        default:
            return `
STRUCTURE AIDA ENRICHIE (Blog):
1. ACCROCHE: Question ou stat surprenante (Attention)
2. PROBLÈME: Le pain point du lecteur (Intérêt)
3. SOLUTION: Ce qu'on va apprendre (Désir)
4. CONTENU PRINCIPAL: 3-5 points clés avec [TABLE] ou [IMAGE]
5. PREUVES: Témoignages ou stats (avec [QUOTE])
${isLong ? '6. FAQ: Questions fréquentes' : ''}
7. CONCLUSION: CTA et prochaine étape (Action)`;
    }
}

/**
 * Get rich block suggestions based on article type
 */
function getBlockSuggestions(style?: string, wordCount?: number): string {
    const count = wordCount || 1500;

    let blocks = `
BLOCS NON-TEXTUELS RECOMMANDÉS:`;

    if (style === 'Tutorial') {
        blocks += `
- [CODE] : 2-4 exemples de code minimum
- [IMAGE] : Captures d'écran pour chaque étape importante
- [TABLE] : 1 tableau des prérequis + 1 résumé des commandes`;
    } else if (style === 'Académique') {
        blocks += `
- [TABLE] : Comparatif obligatoire des approches/études
- [QUOTE] : 2-3 citations de sources fiables
- [IMAGE] : 1 graphique ou schéma explicatif`;
    } else if (style === 'Journalistique') {
        blocks += `
- [QUOTE] : Citation d'expert obligatoire
- [TABLE] : Chiffres clés ou timeline si pertinent
- [IMAGE] : Photo/infographie principale`;
    } else {
        // Blog Lifestyle / Storytelling
        blocks += `
- [IMAGE] : ${count >= 2000 ? '3-4 visuels' : '1-2 visuels'} illustratifs
- [QUOTE] : 1-2 citations inspirantes ou témoignages
- [TABLE] : Comparatif si applicable (pros/cons, avant/après)`;
    }

    if (count >= 2500) {
        blocks += `
- [FAQ] : Section 5-7 questions obligatoire pour articles longs`;
    }

    return blocks;
}

export async function generateTitleSuggestionsWithSEOAction(topic: string): Promise<TitleSuggestion[]> {
    const ai = getClient();

    const prompt = `Tu es un expert SEO. Génère 5 titres d'articles optimisés pour le sujet : "${topic}".

Pour chaque titre, fournis :
- title: Le titre accrocheur et optimisé SEO
- keywords: 3-5 mots-clés pertinents extraits du titre
- seoScore: Score SEO estimé (0-100) basé sur la structure et les mots-clés
- difficulty: Difficulté de positionnement ("easy", "medium", "hard")
- searchVolume: Volume de recherche estimé ("low", "medium", "high")

Retourne un JSON array.`;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                            seoScore: { type: Type.NUMBER },
                            difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
                            searchVolume: { type: Type.STRING, enum: ["low", "medium", "high"] }
                        },
                        required: ["title", "keywords", "seoScore", "difficulty", "searchVolume"]
                    }
                }
            }
        });

        if (result.text) {
            const suggestions = JSON.parse(result.text);
            return suggestions.map((s: any, i: number) => ({
                ...s,
                id: s.id || `title-${Date.now()}-${i}`
            })) as TitleSuggestion[];
        }
        return [];
    } catch (error) {
        console.error("Error generating title suggestions:", error);
        return [{
            id: `fallback-${Date.now()}`,
            title: `Guide complet : ${topic}`,
            keywords: [topic],
            seoScore: 70,
            difficulty: 'medium',
            searchVolume: 'medium'
        }];
    }
}

/**
 * Intelligent outline generation that adapts structure based on config
 * - Word count determines number of sections
 * - Style determines structure approach
 * - Tone influences heading style
 */
export async function generateOutlineAction(
    topic: string,
    title: string,
    keywords: string[] = [],
    config?: {
        targetWordCount?: number;
        tone?: string;
        style?: string;
        persona?: string;
        includeTableOfContents?: boolean;
        includeFAQ?: boolean;
    }
): Promise<OutlineItem[]> {
    const ai = getClient();

    // Calculate optimal structure based on word count
    const wordCount = config?.targetWordCount || 1500;
    const sectionsCount = calculateOptimalSections(wordCount);
    const depth = wordCount >= 2000 ? 'profonde avec sous-sections H3' : 'concise avec principalement des H2';

    // Style-specific structure guidance
    const styleGuidance = getStyleStructureGuidance(config?.style);
    const toneGuidance = getToneGuidance(config?.tone);
    const personaGuidance = getPersonaGuidance(config?.persona);

    // Get semantic structure and block suggestions
    const semanticStructure = getSemanticStructureTemplate(config?.style, wordCount);
    const blockSuggestions = getBlockSuggestions(config?.style, wordCount);

    const prompt = `Tu es un architecte de contenu expert en SEO et en expérience utilisateur.

═══════════════════════════════════════════════════════════════
CONTEXTE DE L'ARTICLE
═══════════════════════════════════════════════════════════════
- Titre: "${title}"
- Sujet: "${topic}"
- Mots-clés cibles: ${keywords.join(', ') || 'Aucun spécifié'}
- Nombre de mots cible: ${wordCount} mots

═══════════════════════════════════════════════════════════════
PARAMÈTRES DE STYLE
═══════════════════════════════════════════════════════════════
- Style: ${config?.style || 'Blog Lifestyle'} → ${styleGuidance}
- Ton: ${config?.tone || 'Expert'} → ${toneGuidance}
- Audience: ${config?.persona || 'intermediate'} → ${personaGuidance}

═══════════════════════════════════════════════════════════════
STRUCTURE SÉMANTIQUE À SUIVRE (OBLIGATOIRE)
═══════════════════════════════════════════════════════════════
${semanticStructure}

═══════════════════════════════════════════════════════════════
BLOCS RICHES À INCLURE
═══════════════════════════════════════════════════════════════
${blockSuggestions}

═══════════════════════════════════════════════════════════════
CONTRAINTES TECHNIQUES
═══════════════════════════════════════════════════════════════
- ${sectionsCount.main} sections H2 MAXIMUM (ajusté pour ${wordCount} mots)
- ${sectionsCount.sub} sous-sections H3 MAXIMUM au total
- Profondeur: ${depth}
- ${wordCount < 1000 ? 'Structure CONCISE - privilégier H2 sans H3' : 'Structure RICHE avec H3 et blocs variés'}
${config?.includeFAQ ? '- FAQ OBLIGATOIRE avec 4-6 questions en fin d\'article' : ''}
${config?.includeTableOfContents ? '- Structure hiérarchique claire pour table des matières' : ''}

═══════════════════════════════════════════════════════════════
TYPES DE BLOCS
═══════════════════════════════════════════════════════════════
- "heading" : Titres H2 (sections) et H3 (sous-sections) - level 2 ou 3
- "paragraph" : Blocs de texte
- "image" : Visuels (décrire brièvement le contenu idéal)
- "quote" : Citations d'experts, stats marquantes
- "faq" : Questions-réponses
- "table" : Tableaux comparatifs ou données
- "code" : Exemples de code (si pertinent pour le sujet)

═══════════════════════════════════════════════════════════════
RÈGLES DE QUALITÉ
═══════════════════════════════════════════════════════════════
1. Chaque section H2 DOIT être suivie d'au moins un bloc de contenu
2. Varier les types de blocs pour engager le lecteur
3. Les blocs [IMAGE] doivent décrire le visuel souhaité
4. Les blocs [TABLE] doivent indiquer les colonnes/données
5. Les blocs [QUOTE] doivent suggérer le type de source
6. Inclure MINIMUM ${wordCount >= 2000 ? '3' : '1'} bloc(s) non-texte ([TABLE], [IMAGE], [QUOTE], etc.)

Retourne un tableau JSON structuré avec:
- title: Titre/description du bloc
- type: Type du bloc
- level: 2 ou 3 (seulement pour headings)
`;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            level: { type: Type.NUMBER },
                            type: { type: Type.STRING, enum: ["heading", "paragraph", "image", "quote", "faq", "table", "code"] }
                        },
                        required: ["title", "type"]
                    }
                }
            }
        });

        if (result.text) {
            const rawData = JSON.parse(result.text);
            return rawData.map((item: any, index: number) => ({
                id: `node-${index}-${Date.now()}`,
                title: item.title,
                type: item.type as BlockType,
                level: item.type === 'heading' ? (item.level === 3 ? HeadingLevel.H3 : HeadingLevel.H2) : undefined,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error generating outline:", error);
        throw error;
    }
}


export async function generateBlockSuggestionAction(
    articleTitle: string,
    articleTopic: string,
    blockType: BlockType,
    parentHeadingContext: string | null = null,
    previousBlockContext: string | null = null
): Promise<string> {
    const ai = getClient();
    const TIMEOUT_MS = 10000; // 10 seconds timeout




    const contextDesc = parentHeadingContext
        ? `Le bloc est situé dans la section : "${parentHeadingContext}"`
        : `Le bloc est au début de l'article sur : "${articleTopic || 'Sujet général'}"`;

    const prevDesc = previousBlockContext
        ? `Il suit directement un bloc parlant de : "${previousBlockContext}"`
        : "";

    let specificInstruction = "";
    switch (blockType) {
        case 'paragraph': specificInstruction = "Suggère un bref résumé (1 phrase) de ce que ce paragraphe devrait couvrir."; break;
        case 'image': specificInstruction = "Décris brièvement une image pertinente, infographie ou illustration pour cette section."; break;
        case 'quote': specificInstruction = "Suggère quel type d'expert ou quelle statistique serait pertinent de citer ici."; break;
        case 'faq': specificInstruction = "Suggère UNE question pertinente que le lecteur se pose à ce stade."; break;
        case 'table': specificInstruction = "Suggère un titre pour un tableau comparatif ou de données utile ici."; break;
        case 'code': specificInstruction = "Décris quel exemple de code serait utile ici."; break;
        case 'heading': specificInstruction = "Suggère un titre de section accrocheur."; break;
    }

    const prompt = `
    Rôle : Assistant éditorial expert.
    Titre Article : "${articleTitle || 'Sans titre'}"
    Sujet : "${articleTopic || ''}"
    ${contextDesc}
    ${prevDesc}
    
    Tâche : Donne un titre/description court et précis pour un nouveau bloc de type [${blockType}].
    ${specificInstruction}

    Format : Réponds UNIQUEMENT par le texte suggéré (max 10-15 mots). Pas de guillemets, pas de "Voici une suggestion".
    `;

    try {
        const fetchPromise = ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout Gemini API")), TIMEOUT_MS)
        );

        // @ts-ignore - Promise race typing can be tricky with GoogleGenAI types
        const result: any = await Promise.race([fetchPromise, timeoutPromise]);

        const text = result.text?.trim();



        return text || `Nouveau ${blockType}`;

    } catch (error) {
        console.error("[ServerAction] Block suggestion failed:", error);
        return `Nouveau ${blockType}`;
    }
}

export async function analysisSeoAction(content: string, keywords: string[] = []): Promise<SeoAnalysisResult> {
    const ai = getClient();
    const prompt = `Analyse ce contenu SEO. Mots-clés: ${keywords.join(', ')}.
   Format JSON: score (0-100), readability (0-100), keywords array, suggestions array.`;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [prompt, content.substring(0, 10000)],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        readability: { type: Type.NUMBER },
                        keywords: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, count: { type: Type.NUMBER }, density: { type: Type.NUMBER }, inTitle: { type: Type.BOOLEAN }, inHeadings: { type: Type.BOOLEAN }, inMeta: { type: Type.BOOLEAN } } } },
                        suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['warning', 'info', 'success', 'error'] }, message: { type: Type.STRING } } } },
                        linkingSuggestions: { type: Type.OBJECT, properties: { internal: { type: Type.ARRAY, items: { type: Type.STRING } }, external: { type: Type.ARRAY, items: { type: Type.STRING } } } }
                    }
                }
            }
        });

        if (result.text) {
            const parsed = JSON.parse(result.text);
            // Transform to match SeoAnalysisResult if needed
            return {
                overallScore: parsed.score || 0,
                keywordDensity: parsed.keywords?.[0]?.density || 0,
                readabilityScore: parsed.readability || 0,
                structureScore: 80, // Default or calculated
                keywords: parsed.keywords || [],
                suggestions: (parsed.suggestions || []).map((s: any) => ({
                    type: s.type === 'error' ? 'error' : s.type === 'warning' ? 'warning' : 'success',
                    text: s.message
                })),
                linkingSuggestions: parsed.linkingSuggestions || { internal: [], external: [] }
            };
        }
        throw new Error("No analysis");
    } catch (e) {
        return {
            overallScore: 75,
            keywordDensity: 0,
            readabilityScore: 80,
            structureScore: 80,
            keywords: [],
            suggestions: [{ type: 'success', text: "Analyse indisponible." }],
            linkingSuggestions: { internal: [], external: [] }
        };
    }
}

// ============================================================================
// v2.0: ENHANCED REWRITE ACTIONS (Magic Commands)
// ============================================================================

const REWRITE_PROMPTS: Record<string, (text: string, context?: string, language?: string) => string> = {
    rewrite: (text, context) => `Tu es un éditeur professionnel. Reformule ce texte en gardant EXACTEMENT le même sens mais avec des tournures de phrases différentes et plus fluides.
${context ? `Contexte: ${context}` : ''}

Texte à reformuler:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte reformulé, sans commentaires.`,

    improve: (text, context) => `Tu es un éditeur expert. Améliore ce texte pour le rendre plus:
- Clair et compréhensible
- Engageant et percutant
- Bien structuré

Garde le sens original mais améliore la qualité d'écriture.
${context ? `Contexte: ${context}` : ''}

Texte à améliorer:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte amélioré.`,

    expand: (text, context) => `Tu es un rédacteur expert. Développe ce texte en ajoutant:
- Plus de détails et d'explications
- Des exemples concrets
- Des transitions fluides

Objectif: Doubler la longueur tout en gardant la cohérence.
${context ? `Contexte: ${context}` : ''}

Texte à développer:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte développé.`,

    shorten: (text, context) => `Tu es un éditeur. Condense ce texte en gardant UNIQUEMENT:
- Les informations essentielles
- Les points clés
- Le message principal

Objectif: Diviser la longueur par 2 minimum.
${context ? `Contexte: ${context}` : ''}

Texte à condenser:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte condensé.`,

    translate: (text, context, language) => `Tu es un traducteur professionnel. Traduis ce texte de manière naturelle, pas littérale.
Langue cible: ${language || 'anglais'}
${context ? `Contexte: ${context}` : ''}

Texte à traduire:
"""
${text}
"""

Réponds UNIQUEMENT avec la traduction.`,

    continue: (text, context) => `Tu es un rédacteur. Continue ce texte de manière fluide et cohérente.
Écris 2-3 paragraphes supplémentaires qui s'enchaînent naturellement.
Garde le même ton et style.
${context ? `Contexte: ${context}` : ''}

Texte à continuer:
"""
${text}
"""

Réponds UNIQUEMENT avec la suite du texte (sans répéter l'original).`,

    correct: (text, context) => `Tu es un correcteur professionnel. Corrige les fautes d'orthographe, de grammaire et de syntaxe de ce texte.
Ne change pas le style ni le ton.
${context ? `Contexte: ${context}` : ''}

Texte à corriger:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte corrigé.`,

    simplify: (text, context) => `Tu es un vulgarisateur. Simplifie ce texte pour qu'il soit compréhensible par un débutant complet:
- Pas de jargon technique
- Phrases courtes et simples
- Analogies avec la vie quotidienne
${context ? `Contexte: ${context}` : ''}

Texte à simplifier:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte simplifié.`,

    change_tone: (text, context) => {
        const toneMatch = context?.match(/ton\s+(\w+)/i);
        const tone = (toneMatch?.[1] || 'professional').toLowerCase();

        const toneDescriptions: Record<string, string> = {
            // UI Options
            expert: 'professionnel, autoritaire et expert',
            narratif: 'narratif, engageant et immersif (storytelling)',
            minimaliste: 'concis, direct et aller à l\'essentiel',
            inspirant: 'motivant, positif et inspirant',
            conversationnel: 'amical, accessible et conversationnel',

            // Legacy/Generic Options
            professional: 'professionnel et formel, avec un vocabulaire soutenu',
            casual: 'décontracté et accessible, comme une conversation entre amis',
            persuasive: 'persuasif et convaincant, orienté vers action',
            informative: 'informatif et pédagogique, clair et factuel',
            friendly: 'amical et chaleureux, engageant et personnel',
            formal: 'très formel et institutionnel, style corporate',
        };

        const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;

        return `Tu es un éditeur expert en tonalité. Réécris ce texte avec un ton ${toneDesc}.
Garde le même sens mais adapte le style, le vocabulaire et les tournures de phrases.
${context ? `Instructions supplémentaires: ${context}` : ''}

Texte à adapter:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte adapté.`;
    },

    formalize: (text, context) => `Tu es un rédacteur corporate. Reformule ce texte dans un style professionnel et formel:
- Vocabulaire soutenu
- Tournures professionnelles
- Ton neutre et objectif
${context ? `Contexte: ${context}` : ''}

Texte à formaliser:
"""
${text}
"""

Réponds UNIQUEMENT avec le texte formalisé.`,

    factcheck: (text, context) => `Tu es un fact-checker. Analyse ce texte et fournis:
1. Les AFFIRMATIONS vérifiables qu'il contient
2. Les potentielles INEXACTITUDES ou exagérations
3. Les SOURCES recommandées pour vérification
${context ? `Contexte: ${context}` : ''}

Texte à analyser:
"""
${text}
"""

Réponds avec une analyse structurée.`,
};

export async function rewriteTextAction(
    text: string,
    action: string,
    context?: string,
    language?: string
): Promise<string> {
    const ai = getClient();

    // Get the specific prompt for this action
    const promptBuilder = REWRITE_PROMPTS[action];
    if (!promptBuilder) {
        console.error(`Unknown rewrite action: ${action} `);
        return text;
    }

    const prompt = promptBuilder(text, context, language);

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });
        return result.text?.trim() || text;
    } catch (e) {
        console.error(`Rewrite action ${action} failed: `, e);
        return text;
    }
}

export async function generateMetaAction(title: string, content: string, keywords: string[] = []): Promise<{ title: string; description: string }> {
    const ai = getClient();
    const prompt = `SEO Meta Tags.Title: ${title}.Keywords: ${keywords.join(',')}.Content: ${content.substring(0, 500)}.
     JSON { title, description }.`;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                    }
                }
            }
        });
        if (result.text) return JSON.parse(result.text);
        return { title: title, description: "Description auto-generated" };
    } catch (e) {
        return { title, description: "" };
    }
}
