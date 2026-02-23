/**
 * Batch Product Content Generation - SSE Streaming API Route
 *
 * Processes products sequentially, generating AI content for selected fields.
 * Streams progress via Server-Sent Events (SSE).
 * Supports Gemini Vision for image analysis (alt text generation).
 *
 * Pattern replicated from: /api/flowriter/stream/route.ts
 */

import { GoogleGenAI } from '@google/genai';
import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchImageSafe } from '@/lib/ssrf';
import { batchGenerationRequestSchema } from '@/schemas/batch-generation';
import {
    buildProductTitlePrompt,
    buildShortDescriptionPrompt,
    buildDescriptionPrompt,
    buildSeoTitlePrompt,
    buildMetaDescriptionPrompt,
    buildSkuPrompt,
    buildAltTextPrompt,
    parseGeminiResponse,
} from '@/lib/ai/product-prompts';
import type { ModularGenerationSettings } from '@/types/imageGeneration';

// ============================================================================
// RUNTIME CONFIG
// ============================================================================

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for batch processing

// ============================================================================
// RETRY CONFIG (from FloWriter)
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

function classifyError(error: any): { retryable: boolean; code: string; message: string } {
    const msg = error.message?.toLowerCase() || '';
    const status = error.status || error.code;

    if (status === 429 || msg.includes('quota') || msg.includes('rate limit')) {
        return { retryable: true, code: 'QUOTA_EXCEEDED', message: 'Quota API dépassé' };
    }
    if (status === 503 || msg.includes('unavailable')) {
        return { retryable: true, code: 'SERVICE_UNAVAILABLE', message: 'Service IA indisponible' };
    }
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harmful')) {
        return { retryable: false, code: 'CONTENT_BLOCKED', message: 'Contenu bloqué par les filtres de sécurité' };
    }
    if (msg.includes('timeout') || msg.includes('deadline')) {
        return { retryable: true, code: 'TIMEOUT', message: 'Timeout de l\'API' };
    }
    return { retryable: true, code: 'UNKNOWN', message: error.message || 'Erreur inconnue' };
}

// ============================================================================
// IMAGE FETCHING (uses shared SSRF protection from @/lib/ssrf)
// ============================================================================

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

// ============================================================================
// GEMINI CALL WITH RETRY
// ============================================================================

async function callGeminiWithRetry(
    ai: GoogleGenAI,
    prompt: string,
    imageData?: { data: string; mimeType: string } | null
): Promise<string> {
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            let result;

            if (imageData) {
                // Vision call with image
                result = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: {
                        parts: [
                            { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
                            { text: prompt },
                        ],
                    },
                });
            } else {
                // Text-only call
                result = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: prompt,
                });
            }

            const text = result.text || '';
            if (!text) throw new Error('Empty response from Gemini');
            return text;
        } catch (error: any) {
            const classified = classifyError(error);

            if (!classified.retryable || attempt === RETRY_CONFIG.maxRetries) {
                throw error;
            }

            const backoff = calculateBackoff(attempt);
            await new Promise((resolve) => setTimeout(resolve, backoff));
        }
    }
    throw new Error('Max retries exceeded');
}

// ============================================================================
// PRODUCT CONTEXT EXTRACTOR
// ============================================================================

interface ProductRow {
    id: string;
    title: string;
    image_url?: string;
    price?: number;
    sku?: string;
    product_type?: string;
    metadata?: any;
    working_content?: any;
    draft_generated_content?: any;
}

function extractProductContext(product: ProductRow) {
    const meta = product.metadata || {};
    const working = product.working_content || {};

    return {
        title: working.title || product.title,
        currentDescription: working.description || meta.description || '',
        shortDescription: working.short_description || meta.short_description || '',
        categories: meta.categories?.map((c: any) => c.name || c).filter(Boolean) || [],
        attributes: meta.attributes?.map((a: any) => ({
            name: a.name,
            options: a.options,
        })) || [],
        price: product.price || meta.price || meta.regular_price,
        sku: product.sku || meta.sku,
        imageUrl: product.image_url || meta.images?.[0]?.src,
        tags: meta.tags?.map((t: any) => t.name || t).filter(Boolean) || [],
    };
}

// ============================================================================
// FIELD GENERATION
// ============================================================================

type FieldType = 'title' | 'short_description' | 'description' | 'seo_title' | 'meta_description' | 'sku' | 'alt_text';

function buildPromptForField(
    fieldType: FieldType,
    productCtx: ReturnType<typeof extractProductContext>,
    settings: ModularGenerationSettings,
    hasImage: boolean,
    storeName?: string
): string {
    switch (fieldType) {
        case 'title':
            return buildProductTitlePrompt(productCtx, settings);
        case 'short_description':
            return buildShortDescriptionPrompt(productCtx, settings);
        case 'description':
            return buildDescriptionPrompt(productCtx, settings);
        case 'seo_title':
            return buildSeoTitlePrompt(productCtx, settings, storeName);
        case 'meta_description':
            return buildMetaDescriptionPrompt(productCtx, settings);
        case 'sku':
            return buildSkuPrompt(productCtx, settings);
        case 'alt_text':
            return buildAltTextPrompt(productCtx, settings, hasImage);
    }
}

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    // 1. Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[batch-generation] GEMINI_API_KEY not configured');
        return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // 2. Authenticate user (before body parsing — SEC-04)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error('[batch-generation] Auth failed:', authError?.message);
        return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }
    // 3. Parse and validate request body
    let body: any;
    try {
        body = await request.json();
    } catch {
        console.error('[batch-generation] Invalid JSON body');
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = batchGenerationRequestSchema.safeParse(body);
    if (!validation.success) {
        console.error('[batch-generation] Validation failed:', validation.error.flatten());
        return Response.json(
            { error: 'Validation failed', details: validation.error.flatten() },
            { status: 400 }
        );
    }
    const { product_ids, content_types, settings, store_id } = validation.data;

    // Verify store ownership (stores table uses tenant_id, not user_id)
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, tenant_id, name')
        .eq('id', store_id)
        .eq('tenant_id', user.id)
        .single();

    if (storeError || !store) {
        console.error('[batch-generation] Store not found or access denied:', storeError?.message);
        return Response.json({ error: 'Boutique non trouvée ou accès refusé' }, { status: 403 });
    }
    // 4. Determine enabled content types
    const enabledTypes = (Object.entries(content_types) as [FieldType, boolean | undefined][])
        .filter(([, enabled]) => enabled)
        .map(([type]) => type);

    if (enabledTypes.length === 0) {
        return Response.json({ error: 'Aucun type de contenu sélectionné' }, { status: 400 });
    }

    // 5. Create batch job in DB (real schema requires tenant_id and content_types columns)
    const { data: batchJob, error: jobError } = await supabase
        .from('batch_jobs')
        .insert({
            tenant_id: user.id,
            store_id,
            content_types: content_types as any,
            status: 'pending',
            total_items: product_ids.length,
            processed_items: 0,
            successful_items: 0,
            failed_items: 0,
            settings: {
                generation_settings: settings,
                enabled_types: enabledTypes,
            },
        })
        .select('id')
        .single();

    if (jobError || !batchJob) {
        console.error('[batch-generation] Failed to create batch job:', jobError?.message);
        return Response.json({ error: 'Impossible de créer le batch job' }, { status: 500 });
    }
    // 6. Create batch job items
    const items = product_ids.map((pid) => ({
        batch_job_id: batchJob.id,
        product_id: pid,
        status: 'pending' as const,
    }));

    const { error: itemsError } = await supabase.from('batch_job_items').insert(items);
    if (itemsError) {
        return Response.json({ error: 'Impossible de créer les items du batch' }, { status: 500 });
    }

    // 7. Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey });

    // 8. Return SSE stream
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let isClosed = false;
            let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

            const sendEvent = (data: any) => {
                if (isClosed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch {
                    isClosed = true;
                }
            };

            try {
                // Connected event
                sendEvent({
                    type: 'connected',
                    batch_job_id: batchJob.id,
                    total: product_ids.length,
                    enabled_types: enabledTypes,
                    timestamp: Date.now(),
                });

                // Heartbeat every 10s
                heartbeatInterval = setInterval(() => {
                    if (!isClosed) sendEvent({ type: 'heartbeat', timestamp: Date.now() });
                }, 10000);

                // Update batch job to running (DB enum: pending/running/completed/failed/partial)
                await supabase
                    .from('batch_jobs')
                    .update({ status: 'running', started_at: new Date().toISOString() })
                    .eq('id', batchJob.id);

                let successCount = 0;
                let failCount = 0;

                // Process each product sequentially
                for (let i = 0; i < product_ids.length; i++) {
                    if (isClosed) break;

                    const productId = product_ids[i];

                    sendEvent({
                        type: 'product_start',
                        product_id: productId,
                        index: i + 1,
                        total: product_ids.length,
                    });

                    // Update item status (batch_job_items has no started_at column)
                    await supabase
                        .from('batch_job_items')
                        .update({ status: 'processing' })
                        .eq('batch_job_id', batchJob.id)
                        .eq('product_id', productId);

                    try {
                        // Fetch product data
                        const { data: product, error: prodError } = await supabase
                            .from('products')
                            .select('id, title, image_url, price, sku, product_type, metadata, working_content, draft_generated_content')
                            .eq('id', productId)
                            .eq('store_id', store_id)
                            .single();

                        if (prodError || !product) {
                            throw new Error(`Produit ${productId} non trouvé`);
                        }

                        const productCtx = extractProductContext(product);

                        // Fetch image if needed for vision
                        let imageBase64: { data: string; mimeType: string } | null = null;
                        if (settings.image_analysis && productCtx.imageUrl) {
                            imageBase64 = await fetchImageSafe(productCtx.imageUrl, MAX_IMAGE_SIZE).catch(() => null);
                        }

                        // Generate each enabled field
                        const draft: Record<string, any> = {};

                        for (const fieldType of enabledTypes) {
                            if (isClosed) break;

                            sendEvent({
                                type: 'field_start',
                                product_id: productId,
                                field: fieldType,
                                index: i + 1,
                                total: product_ids.length,
                            });

                            // Map field to draft structure
                            if (fieldType === 'alt_text') {
                                // Generate alt text for ALL product images
                                // UI expects: { images: [{ id, src, alt }] }
                                const meta = product.metadata || {};
                                const working = product.working_content || {};
                                const productImages: Array<{ id?: string | number; src?: string; alt?: string }> =
                                    working.images || meta.images || [];

                                if (productImages.length > 0) {
                                    const draftImages: Array<{ id?: string | number; src: string; alt: string }> = [];

                                    for (let imgIdx = 0; imgIdx < productImages.length; imgIdx++) {
                                        if (isClosed) break;
                                        const img = productImages[imgIdx] as any;
                                        const imgSrc = img.src || img.url || '';

                                        // Fetch each image for vision analysis if enabled
                                        let imgBase64: { data: string; mimeType: string } | null = null;
                                        if (settings.image_analysis && imgSrc) {
                                            imgBase64 = await fetchImageSafe(imgSrc, MAX_IMAGE_SIZE).catch(() => null);
                                        }

                                        const imgPrompt = buildPromptForField(
                                            'alt_text',
                                            productCtx,
                                            settings,
                                            !!imgBase64
                                        );
                                        const rawAlt = await callGeminiWithRetry(
                                            ai,
                                            imgPrompt,
                                            imgBase64
                                        );
                                        const parsedAlt = parseGeminiResponse(rawAlt, 'alt_text');

                                        draftImages.push({
                                            id: img.id,
                                            src: imgSrc,
                                            alt: parsedAlt,
                                        });
                                    }

                                    draft.images = draftImages;
                                } else if (productCtx.imageUrl) {
                                    // Fallback: single image from image_url
                                    let fallbackBase64: { data: string; mimeType: string } | null = null;
                                    if (settings.image_analysis) {
                                        fallbackBase64 = await fetchImageSafe(productCtx.imageUrl, MAX_IMAGE_SIZE).catch(() => null);
                                    }
                                    const fallbackPrompt = buildPromptForField('alt_text', productCtx, settings, !!fallbackBase64);
                                    const rawAlt = await callGeminiWithRetry(ai, fallbackPrompt, fallbackBase64);
                                    const parsedAlt = parseGeminiResponse(rawAlt, 'alt_text');
                                    draft.images = [{ src: productCtx.imageUrl, alt: parsedAlt }];
                                }
                            } else {
                                const prompt = buildPromptForField(
                                    fieldType,
                                    productCtx,
                                    settings,
                                    false,
                                    store.name
                                );

                                const rawText = await callGeminiWithRetry(ai, prompt, null);
                                const parsed = parseGeminiResponse(rawText, fieldType);

                                if (fieldType === 'seo_title') {
                                    draft.seo = { ...(draft.seo || {}), title: parsed };
                                } else if (fieldType === 'meta_description') {
                                    draft.seo = { ...(draft.seo || {}), description: parsed };
                                } else {
                                    draft[fieldType] = parsed;
                                }
                            }

                            // Build preview for the field_complete event
                            let fieldPreview = '';
                            if (fieldType === 'alt_text') {
                                const altCount = draft.images?.length || 0;
                                fieldPreview = `${altCount} alt text(s) générés`;
                            } else if (fieldType === 'seo_title') {
                                fieldPreview = (draft.seo?.title || '').slice(0, 100);
                            } else if (fieldType === 'meta_description') {
                                fieldPreview = (draft.seo?.description || '').slice(0, 100);
                            } else {
                                fieldPreview = (draft[fieldType] || '').slice(0, 100);
                            }

                            sendEvent({
                                type: 'field_complete',
                                product_id: productId,
                                field: fieldType,
                                preview: fieldPreview,
                            });
                        }

                        // Write draft to product
                        const existingDraft = product.draft_generated_content || {};
                        const mergedDraft = { ...existingDraft, ...draft };
                        if (draft.seo) {
                            mergedDraft.seo = { ...(existingDraft.seo || {}), ...draft.seo };
                        }
                        // For images (alt text), replace entirely (not merge)
                        if (draft.images) {
                            mergedDraft.images = draft.images;
                        }

                        await supabase
                            .from('products')
                            .update({ draft_generated_content: mergedDraft })
                            .eq('id', productId);

                        // Mark item as completed (updated_at handled by trigger)
                        await supabase
                            .from('batch_job_items')
                            .update({ status: 'completed' })
                            .eq('batch_job_id', batchJob.id)
                            .eq('product_id', productId);

                        successCount++;

                        // Update batch job counters
                        await supabase
                            .from('batch_jobs')
                            .update({
                                processed_items: i + 1,
                                successful_items: successCount,
                                failed_items: failCount,
                            })
                            .eq('id', batchJob.id);

                        sendEvent({
                            type: 'product_complete',
                            product_id: productId,
                            index: i + 1,
                            total: product_ids.length,
                            fields_generated: enabledTypes.length,
                        });

                    } catch (productError: any) {
                        failCount++;
                        const errMsg = productError.message || 'Erreur inconnue';

                        // Mark item as failed (no completed_at column in real schema)
                        await supabase
                            .from('batch_job_items')
                            .update({
                                status: 'failed',
                                error_message: errMsg.slice(0, 500),
                            })
                            .eq('batch_job_id', batchJob.id)
                            .eq('product_id', productId);

                        // Update batch job counters
                        await supabase
                            .from('batch_jobs')
                            .update({
                                processed_items: i + 1,
                                successful_items: successCount,
                                failed_items: failCount,
                            })
                            .eq('id', batchJob.id);

                        sendEvent({
                            type: 'product_error',
                            product_id: productId,
                            index: i + 1,
                            total: product_ids.length,
                            error: errMsg,
                        });

                        // Continue to next product (don't abort batch)
                    }
                }

                // Final status
                const finalStatus = failCount === product_ids.length
                    ? 'failed'
                    : failCount > 0
                        ? 'completed' // partial success still marked completed
                        : 'completed';

                await supabase
                    .from('batch_jobs')
                    .update({
                        status: finalStatus,
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', batchJob.id);

                sendEvent({
                    type: 'batch_complete',
                    batch_job_id: batchJob.id,
                    total: product_ids.length,
                    successful: successCount,
                    failed: failCount,
                    status: finalStatus,
                });

            } catch (fatalError: any) {
                // Fatal error (not per-product)
                await supabase
                    .from('batch_jobs')
                    .update({
                        status: 'failed',
                        error_message: fatalError.message?.slice(0, 500),
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', batchJob.id);

                sendEvent({
                    type: 'error',
                    message: fatalError.message || 'Erreur fatale',
                    code: classifyError(fatalError).code,
                });
            } finally {
                isClosed = true;
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                try { controller.close(); } catch { /* already closed */ }
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
