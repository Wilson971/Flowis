import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchImageSafe } from '@/lib/ssrf';
import { detectPromptInjection } from '@/lib/ai/prompt-safety';

// ============================================================================
// PHOTO STUDIO - Image Generation API Route
// ============================================================================

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for image generation

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableCodes: [429, 500, 502, 503, 504],
};

function calculateBackoff(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  );
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

// ============================================================================
// ERROR CODES (French messages for FLOWZ UI)
// ============================================================================

const ERROR_CODES = {
  QUOTA_EXCEEDED: {
    code: 'QUOTA_EXCEEDED',
    message: 'Quota API dépassé. Veuillez réessayer dans quelques minutes.',
    retryable: true,
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'La génération a pris trop de temps. Essayez avec une image plus petite.',
    retryable: true,
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Erreur de connexion. Vérifiez votre connexion internet.',
    retryable: true,
  },
  CONTENT_BLOCKED: {
    code: 'CONTENT_BLOCKED',
    message: 'Le contenu a été bloqué par les filtres de sécurité. Modifiez votre prompt.',
    retryable: false,
  },
  INVALID_REQUEST: {
    code: 'INVALID_REQUEST',
    message: 'Requête invalide. Vérifiez les paramètres fournis.',
    retryable: false,
  },
  IMAGE_FETCH_FAILED: {
    code: 'IMAGE_FETCH_FAILED',
    message: "Impossible de récupérer l'image source. Vérifiez l'URL.",
    retryable: false,
  },
  NO_IMAGE_GENERATED: {
    code: 'NO_IMAGE_GENERATED',
    message: "Le modèle n'a pas généré d'image. Essayez un prompt différent.",
    retryable: true,
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

function classifyError(error: any): (typeof ERROR_CODES)[keyof typeof ERROR_CODES] {
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

// Prompt injection detection imported from @/lib/ai/prompt-safety
const containsInjection = detectPromptInjection;

// ============================================================================
// REQUEST / RESPONSE TYPES
// ============================================================================

interface GenerateRequest {
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  quality?: string;
  aspectRatio?: string;
  action?: string;
}

interface GenerateResponse {
  success: true;
  imageBase64: string;
  model: string;
  textResponse?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

// ============================================================================
// IMAGE HELPERS
// ============================================================================

/** Maximum image size in bytes (10 MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** Maximum base64 string length (~13.3 MB for 10 MB binary) */
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_SIZE * 1.37);

/**
 * Extract base64 data and mimeType from a data URL.
 * Supports format: data:<mimeType>;base64,<data>
 */
function parseBase64DataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }
  // If no data URL prefix, assume raw base64 JPEG
  return {
    mimeType: 'image/jpeg',
    data: dataUrl,
  };
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse | ErrorResponse>> {
  const startTime = Date.now();

  // ---- Authentication: verify user session ----
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Non authentifié. Veuillez vous connecter.',
          retryable: false,
        },
      },
      { status: 401 }
    );
  }

  // ---- Per-request rate limiting ----
  const { checkRateLimit, RATE_LIMIT_PHOTO_STUDIO } = await import('@/lib/rate-limit');
  const rateLimit = checkRateLimit(user.id, 'photo-studio', RATE_LIMIT_PHOTO_STUDIO);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'RATE_LIMITED',
          message: 'Trop de requêtes. Veuillez patienter avant de relancer.',
          retryable: true,
        },
      },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // ---- Validate API key ----
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Photo Studio] GEMINI_API_KEY is not configured');
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Clé API non configurée. Contactez l\'administrateur.',
          retryable: false,
        },
      },
      { status: 500 }
    );
  }

  // ---- Parse request body ----
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false as const,
        error: ERROR_CODES.INVALID_REQUEST,
      },
      { status: 400 }
    );
  }

  const {
    imageUrl,
    imageBase64,
    prompt,
    model = 'gemini-2.5-flash-image',
    temperature = 0.6,
  } = body;

  // ---- Validate required fields ----
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Le prompt est requis pour la génération.',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }

  // ---- Prompt injection check (defense in depth) ----
  if (containsInjection(prompt)) {
    console.warn(`[Photo Studio] Prompt injection detected from user ${user.id}`);
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Le prompt contient du contenu non autorisé.',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }

  if (!imageUrl && !imageBase64) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Une image source est requise (URL ou base64).',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }

  // ---- Validate base64 size to prevent memory exhaustion ----
  if (imageBase64 && imageBase64.length > MAX_BASE64_LENGTH) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INVALID_REQUEST',
          message: `Image trop volumineuse (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB).`,
          retryable: false,
        },
      },
      { status: 400 }
    );
  }

  // ---- Resolve source image ----
  let imageData: string;
  let imageMimeType: string;

  try {
    if (imageUrl) {
      const fetched = await fetchImageSafe(imageUrl, MAX_IMAGE_SIZE);
      imageData = fetched.data;
      imageMimeType = fetched.mimeType;
    } else {
      const parsed = parseBase64DataUrl(imageBase64!);
      imageData = parsed.data;
      imageMimeType = parsed.mimeType;
    }
  } catch (err: any) {
    console.error('[Photo Studio] Image resolution failed:', err.message);
    return NextResponse.json(
      {
        success: false as const,
        error: ERROR_CODES.IMAGE_FETCH_FAILED,
      },
      { status: 400 }
    );
  }

  // ---- Initialize Gemini client ----
  const ai = new GoogleGenAI({ apiKey });

  // ---- Call Gemini with retry logic ----
  let lastError: any = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = calculateBackoff(attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imageMimeType,
                data: imageData,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          temperature,
        },
      });

      // ---- Extract generated image from response ----
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw Object.assign(new Error('No candidates in response'), {
          code: 'NO_IMAGE_GENERATED',
        });
      }

      const parts = candidates[0].content?.parts;
      if (!parts || parts.length === 0) {
        throw Object.assign(new Error('No parts in response content'), {
          code: 'NO_IMAGE_GENERATED',
        });
      }

      // Find the image part (inlineData) and optional text part
      let generatedImageData: string | null = null;
      let generatedMimeType: string = 'image/png';
      let textResponse: string | undefined;

      for (const part of parts) {
        if (part.inlineData?.data) {
          generatedImageData = part.inlineData.data;
          generatedMimeType = part.inlineData.mimeType || 'image/png';
        }
        if (part.text) {
          textResponse = part.text;
        }
      }

      if (!generatedImageData) {
        throw Object.assign(new Error('No image data in response parts'), {
          code: 'NO_IMAGE_GENERATED',
        });
      }

      // Persist AI usage to DB (fire-and-forget — fixed estimate for image gen)
      supabase.from('ai_usage').insert({
        tenant_id: user.id,
        feature: 'photo_studio',
        tokens_input: 500,
        tokens_output: 500,
        month: new Date().toISOString().slice(0, 7),
      }).then(({ error }) => {
        if (error) console.error('[Photo Studio] Failed to log AI usage:', error);
      });

      return NextResponse.json({
        success: true as const,
        imageBase64: `data:${generatedMimeType};base64,${generatedImageData}`,
        model,
        ...(textResponse ? { textResponse } : {}),
      });
    } catch (err: any) {
      lastError = err;
      const classified = classifyError(err);

      console.error(
        `[Photo Studio] Attempt ${attempt + 1} failed:`,
        err.message,
        `(classified: ${classified.code})`
      );

      // Do not retry non-retryable errors
      if (!classified.retryable) {
        return NextResponse.json(
          {
            success: false as const,
            error: classified,
          },
          { status: classified.code === 'CONTENT_BLOCKED' ? 400 : 422 }
        );
      }

      // If this was the last attempt, fall through to final error
      if (attempt === RETRY_CONFIG.maxRetries) {
        break;
      }
    }
  }

  // ---- All retries exhausted ----
  const classified = classifyError(lastError);
  const elapsed = Date.now() - startTime;
  console.error(
    `[Photo Studio] All retries exhausted after ${elapsed}ms. Last error:`,
    lastError?.message
  );

  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: classified.code,
        message: classified.message,
        retryable: false, // No more retries available
      },
    },
    { status: 503 }
  );
}
