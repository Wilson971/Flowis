
import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from 'next/server';

// ============================================================================
// FLOWRITER v2.0 - Node.js Runtime for Extended Timeout Support
// ============================================================================

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long-form article generation

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    retryableCodes: [429, 500, 502, 503, 504],
};

// Exponential backoff with jitter
function calculateBackoff(attempt: number): number {
    const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelay
    );
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
}

// ============================================================================
// ERROR CODES AND MESSAGES
// ============================================================================

const ERROR_CODES = {
    QUOTA_EXCEEDED: {
        code: 'QUOTA_EXCEEDED',
        message: 'Quota API dépassé. Veuillez réessayer dans quelques minutes.',
        retryable: true,
    },
    TIMEOUT: {
        code: 'TIMEOUT',
        message: 'La génération a pris trop de temps. Essayez avec un article plus court.',
        retryable: true,
    },
    NETWORK_ERROR: {
        code: 'NETWORK_ERROR',
        message: 'Erreur de connexion. Vérifiez votre connexion internet.',
        retryable: true,
    },
    CONTENT_BLOCKED: {
        code: 'CONTENT_BLOCKED',
        message: 'Le contenu a été bloqué par les filtres de sécurité. Modifiez votre sujet.',
        retryable: false,
    },
    INVALID_REQUEST: {
        code: 'INVALID_REQUEST',
        message: 'Requête invalide. Vérifiez les paramètres fournis.',
        retryable: false,
    },
    SERVICE_UNAVAILABLE: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Le service IA est temporairement indisponible. Réessayez dans quelques instants.',
        retryable: true,
    },
    UNKNOWN_ERROR: {
        code: 'UNKNOWN_ERROR',
        message: 'Une erreur inattendue est survenue. Veuillez réessayer.',
        retryable: true,
    },
} as const;

function classifyError(error: any): typeof ERROR_CODES[keyof typeof ERROR_CODES] {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.code;

    if (status === 429 || message.includes('quota') || message.includes('rate limit')) {
        return ERROR_CODES.QUOTA_EXCEEDED;
    }
    if (status === 503 || message.includes('unavailable')) {
        return ERROR_CODES.SERVICE_UNAVAILABLE;
    }
    if (message.includes('timeout') || message.includes('deadline')) {
        return ERROR_CODES.TIMEOUT;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('econnreset')) {
        return ERROR_CODES.NETWORK_ERROR;
    }
    if (message.includes('safety') || message.includes('blocked') || message.includes('harmful')) {
        return ERROR_CODES.CONTENT_BLOCKED;
    }
    if (status === 400 || message.includes('invalid')) {
        return ERROR_CODES.INVALID_REQUEST;
    }
    return ERROR_CODES.UNKNOWN_ERROR;
}

// ============================================================================
// TOKEN TRACKING & COST GUARD
// ============================================================================

interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number; // In USD
}

// Gemini 2.0 Flash pricing (approximation)
const GEMINI_PRICING = {
    inputPer1k: 0.00001,  // $0.01 per 1M tokens = $0.00001 per 1K
    outputPer1k: 0.00004, // $0.04 per 1M tokens = $0.00004 per 1K
};

/**
 * Estimate tokens from text (rough approximation: 1 token ~= 4 characters)
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Calculate estimated cost
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * GEMINI_PRICING.inputPer1k;
    const outputCost = (outputTokens / 1000) * GEMINI_PRICING.outputPer1k;
    return Math.round((inputCost + outputCost) * 1000000) / 1000000; // Round to 6 decimals
}

/**
 * Log token usage (can be extended to store in DB)
 */
function logTokenUsage(usage: TokenUsage, metadata: {
    topic?: string;
    targetWordCount?: number;
    timestamp: number;
}): void {
    // For now, just log to console - can be extended to store in database
    console.log('[FloWriter] Token Usage:', {
        ...usage,
        ...metadata,
        costFormatted: `$${usage.estimatedCost.toFixed(6)}`,
    });
}

// Daily token limit per user (if needed)
const DAILY_TOKEN_LIMIT = 500000; // 500K tokens per day

/**
 * Check if user is within daily limit (stub for future implementation)
 * In production, this would check against a database
 */
async function checkTokenLimit(userId?: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}> {
    // TODO: Implement actual tracking with database
    // For now, always allow
    return {
        allowed: true,
        remaining: DAILY_TOKEN_LIMIT,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
}

// ============================================================================
// WRITING STYLE HELPERS
// ============================================================================

function getStyleInstructions(style?: string): string {
    switch (style) {
        case 'Journalistique':
            return 'Factuel et objectif. Structure pyramide inversée. Réponse aux 5W (Qui, Quoi, Où, Quand, Pourquoi). Sources citées.';
        case 'Académique':
            return 'Rigoureux et analytique. Arguments étayés par des références. Vocabulaire précis. Structure thèse-démonstration-conclusion.';
        case 'Tutorial':
            return 'Pédagogique et pratique. Instructions étape par étape. Exemples concrets. Anticipation des erreurs courantes.';
        case 'Storytelling':
            return 'Narratif et immersif. Arc narratif avec tension. Personnages ou cas concrets. Émotions et rebondissements.';
        case 'Blog Lifestyle':
        default:
            return 'Personnel et authentique. Partage d\'expérience. Conseils pratiques. Ton proche du lecteur.';
    }
}

function getToneInstructions(tone?: string): string {
    switch (tone) {
        case 'Expert':
            return 'Autoritaire et crédible. Vocabulaire technique maîtrisé. Affirmations basées sur des données.';
        case 'Narratif':
            return 'Engageant comme une histoire. Suspense et révélations. Le lecteur veut connaître la suite.';
        case 'Minimaliste':
            return 'Direct et sans fioritures. Phrases courtes. Chaque mot compte. Pas de remplissage.';
        case 'Inspirant':
            return 'Motivant et positif. Focus sur les possibilités. Encouragement à l\'action.';
        case 'Conversationnel':
            return 'Comme une discussion entre amis. Questions rhétoriques. "Tu/Vous" direct. Accessible.';
        default:
            return 'Professionnel et clair.';
    }
}

function getPersonaInstructions(persona?: string): string {
    switch (persona) {
        case 'beginner':
            return 'Explique chaque concept. Définis les termes techniques. Utilise des analogies simples. Pas de jargon.';
        case 'expert':
            return 'Va droit au but. Termes techniques acceptés. Niveau avancé. Pas de sur-explication.';
        case 'intermediate':
        default:
            return 'Équilibre accessibilité et profondeur. Explique les concepts clés. Exemples variés.';
    }
}

// ============================================================================
// INPUT SANITIZATION (Security)
// ============================================================================

const SANITIZE_CONFIG = {
    maxTopicLength: 500,
    maxTitleLength: 200,
    maxOutlineItems: 300,
    maxKeywords: 20,
    maxCustomInstructionsLength: 1000,
};

// Patterns that could indicate prompt injection attempts
const SUSPICIOUS_PATTERNS = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
    /disregard\s+(all\s+)?(previous|above|prior)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /new\s+instructions?:/i,
    /system\s*prompt:/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /<<SYS>>/i,
    /<\|im_start\|>/i,
];

function sanitizeInput(text: string, maxLength: number = 1000): string {
    if (typeof text !== 'string') return '';

    // Trim and limit length
    let sanitized = text.trim().slice(0, maxLength);

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Escape characters that could break prompt structure
    sanitized = sanitized
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');

    return sanitized;
}

function detectSuspiciousInput(text: string): boolean {
    return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(text));
}

// Validate and sanitize request body
function validateRequest(body: any): { valid: boolean; error?: string; code?: string } {
    if (!body.topic || typeof body.topic !== 'string') {
        return { valid: false, error: 'Missing or invalid topic', code: 'INVALID_TOPIC' };
    }
    if (body.topic.length > SANITIZE_CONFIG.maxTopicLength) {
        return { valid: false, error: `Topic exceeds ${SANITIZE_CONFIG.maxTopicLength} characters`, code: 'TOPIC_TOO_LONG' };
    }
    if (detectSuspiciousInput(body.topic)) {
        return { valid: false, error: 'Topic contains invalid content', code: 'SUSPICIOUS_INPUT' };
    }

    if (!body.title || typeof body.title !== 'string') {
        return { valid: false, error: 'Missing or invalid title', code: 'INVALID_TITLE' };
    }
    if (body.title.length > SANITIZE_CONFIG.maxTitleLength) {
        return { valid: false, error: `Title exceeds ${SANITIZE_CONFIG.maxTitleLength} characters`, code: 'TITLE_TOO_LONG' };
    }
    if (detectSuspiciousInput(body.title)) {
        return { valid: false, error: 'Title contains invalid content', code: 'SUSPICIOUS_INPUT' };
    }

    if (!Array.isArray(body.outline) || body.outline.length === 0) {
        return { valid: false, error: 'Missing or invalid outline', code: 'INVALID_OUTLINE' };
    }
    if (body.outline.length > SANITIZE_CONFIG.maxOutlineItems) {
        return { valid: false, error: `Outline exceeds ${SANITIZE_CONFIG.maxOutlineItems} items`, code: 'OUTLINE_TOO_LONG' };
    }

    // Validate each outline item
    for (const item of body.outline) {
        if (item.title && detectSuspiciousInput(item.title)) {
            return { valid: false, error: 'Outline item contains invalid content', code: 'SUSPICIOUS_INPUT' };
        }
    }

    if (!body.config || typeof body.config !== 'object') {
        return { valid: false, error: 'Missing or invalid config', code: 'INVALID_CONFIG' };
    }

    // Validate custom instructions if present
    if (body.config.customInstructions) {
        if (body.config.customInstructions.length > SANITIZE_CONFIG.maxCustomInstructionsLength) {
            return { valid: false, error: 'Custom instructions too long', code: 'INSTRUCTIONS_TOO_LONG' };
        }
        if (detectSuspiciousInput(body.config.customInstructions)) {
            return { valid: false, error: 'Custom instructions contain invalid content', code: 'SUSPICIOUS_INPUT' };
        }
    }

    return { valid: true };
}

// ============================================================================
// RETRY-ENABLED STREAMING GENERATION
// ============================================================================

async function generateWithRetry(
    ai: GoogleGenAI,
    prompt: string,
    sendEvent: (data: any) => void,
    outline: any[],
    config: any
): Promise<void> {
    let lastError: any = null;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = calculateBackoff(attempt);
                sendEvent({
                    type: 'progress',
                    phase: 'analyzing',
                    section: 0,
                    sectionTitle: `Nouvelle tentative (${attempt + 1}/${RETRY_CONFIG.maxRetries})...`,
                    retryAttempt: attempt + 1,
                });
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            sendEvent({ type: 'progress', phase: 'analyzing', section: 0, sectionTitle: 'Analyse du sujet...' });

            const result = await ai.models.generateContentStream({
                model: "gemini-2.0-flash",
                contents: prompt,
            });

            let fullContent = '';
            let chunkCount = 0;
            const totalEstimatedChunks = Math.ceil((config.targetWordCount || 1500) / 10);

            // Compatibility handling for different SDK versions
            let streamIterable: any = result;
            // @ts-ignore: Check if .stream exists (new SDK)
            if (result.stream) {
                // @ts-ignore
                streamIterable = result.stream;
            }

            sendEvent({ type: 'progress', phase: 'researching', section: 0, sectionTitle: 'Recherche d\'informations...' });

            for await (const chunk of streamIterable) {
                let text = '';
                // @ts-ignore: Handle .text() (function) or .text (getter)
                if (typeof chunk.text === 'function') {
                    // @ts-ignore
                    text = chunk.text();
                } else {
                    // @ts-ignore
                    text = chunk.text;
                }

                if (text) {
                    fullContent += text;
                    chunkCount++;

                    // Send chunk
                    sendEvent({
                        type: 'chunk',
                        content: text
                    });

                    // Send progress update periodically (every 5 chunks)
                    if (chunkCount % 5 === 0) {
                        const progress = Math.min(99, Math.round((chunkCount / totalEstimatedChunks) * 100));
                        const currentSectionIndex = Math.min(
                            Math.floor((progress / 100) * outline.length),
                            outline.length - 1
                        );
                        const sectionTitle = outline[currentSectionIndex]?.title || 'Rédaction...';

                        sendEvent({
                            type: 'progress',
                            phase: progress < 30 ? 'researching' : progress < 90 ? 'writing' : 'optimizing',
                            section: currentSectionIndex + 1,
                            sectionTitle: sectionTitle,
                            progress: progress,
                            wordCount: fullContent.split(/\s+/).filter(Boolean).length,
                        });
                    }
                }
            }

            // Send optimizing phase
            sendEvent({ type: 'progress', phase: 'optimizing', section: outline.length, sectionTitle: 'Optimisation finale...' });

            // Calculate token usage
            const inputTokens = estimateTokens(prompt);
            const outputTokens = estimateTokens(fullContent);
            const tokenUsage: TokenUsage = {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                estimatedCost: calculateCost(inputTokens, outputTokens),
            };

            // Log token usage
            logTokenUsage(tokenUsage, {
                topic: config.topic,
                targetWordCount: config.targetWordCount,
                timestamp: Date.now(),
            });

            // Complete
            const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
            sendEvent({
                type: 'complete',
                meta: {
                    title: config.title,
                    description: fullContent.slice(0, 160).replace(/\n/g, ' ').trim() + '...',
                    wordCount,
                    // v2.0: Include token usage for transparency
                    tokenUsage: {
                        input: tokenUsage.inputTokens,
                        output: tokenUsage.outputTokens,
                        total: tokenUsage.totalTokens,
                    },
                }
            });

            // Success - exit retry loop
            return;

        } catch (error: any) {
            lastError = error;
            const errorInfo = classifyError(error);

            console.error(`Generation attempt ${attempt + 1} failed:`, error.message);

            // Don't retry non-retryable errors
            if (!errorInfo.retryable) {
                throw error;
            }

            // Don't retry if this is the last attempt
            if (attempt === RETRY_CONFIG.maxRetries - 1) {
                throw error;
            }
        }
    }

    // Should not reach here, but just in case
    throw lastError;
}

export async function POST(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({
            error: 'Missing API Key',
            code: 'CONFIG_ERROR'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({
            error: 'Invalid JSON body',
            code: 'INVALID_JSON'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
        return new Response(JSON.stringify({
            error: validation.error,
            code: validation.code || 'VALIDATION_ERROR'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Sanitize inputs
    const topic = sanitizeInput(body.topic, SANITIZE_CONFIG.maxTopicLength);
    const title = sanitizeInput(body.title, SANITIZE_CONFIG.maxTitleLength);
    const outline = body.outline.map((o: any) => ({
        ...o,
        title: sanitizeInput(o.title || '', 200),
    }));
    const config = {
        ...body.config,
        customInstructions: body.config.customInstructions
            ? sanitizeInput(body.config.customInstructions, SANITIZE_CONFIG.maxCustomInstructionsLength)
            : undefined,
        title, // Pass sanitized title for completion event
    };

    const ai = new GoogleGenAI({ apiKey });

    // Construct intelligent prompt based on config
    const structureStr = outline.map((o: any, index: number) => {
        const blockNum = `[${index + 1}]`;
        if (o.type === 'heading') {
            const level = o.level === 3 ? 'H3' : 'H2';
            return `${blockNum} ${level}: ${o.title}`;
        }
        return `${blockNum} [${o.type.toUpperCase()}]: ${o.title}`;
    }).join("\n");

    // Calculate words per section for better pacing
    const wordsPerSection = Math.round((config.targetWordCount || 1500) / Math.max(outline.filter((o: any) => o.type === 'heading').length, 1));

    // Style-specific writing instructions
    const styleInstructions = getStyleInstructions(config.style);
    const toneInstructions = getToneInstructions(config.tone);
    const personaInstructions = getPersonaInstructions(config.persona);

    // Build custom instructions section if provided
    const customInstructionsSection = config.customInstructions
        ? `\n═══════════════════════════════════════════════════════════════
INSTRUCTIONS PERSONNALISÉES
═══════════════════════════════════════════════════════════════
${config.customInstructions}\n`
        : '';

    const prompt = `Tu es un rédacteur professionnel d'élite spécialisé dans le contenu ${config.style || 'Blog'}.
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
${customInstructionsSection}
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

GÉNÈRE MAINTENANT l'article complet en suivant EXACTEMENT cette structure:`;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
            let isClosed = false;

            const sendEvent = (data: any) => {
                if (isClosed) return;
                try {
                    const text = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(text));
                } catch (e) {
                    console.error("Failed to send event:", e);
                }
            };

            // Send initial event to confirm connection
            sendEvent({ type: 'connected', timestamp: Date.now() });

            // Heartbeat to keep connection alive (every 10s for Node.js)
            heartbeatInterval = setInterval(() => {
                if (!isClosed) {
                    sendEvent({ type: 'heartbeat', timestamp: Date.now() });
                }
            }, 10000);

            try {
                // Use retry-enabled generation
                await generateWithRetry(ai, prompt, sendEvent, outline, config);

            } catch (error: any) {
                console.error("Generation failed after retries:", error);

                const errorInfo = classifyError(error);

                sendEvent({
                    type: 'error',
                    message: errorInfo.message,
                    code: errorInfo.code,
                    retryable: errorInfo.retryable,
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                });
            } finally {
                isClosed = true;
                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                }
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable buffering for Nginx
        },
    });
}
