import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPromptModifier,
} from "@/features/photo-studio/constants/scenePresets";
import {
  VIEW_ANGLE_PROMPTS,
  type ViewAngle,
} from "@/features/photo-studio/types/studio";

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildPromptForAction(
  action: string,
  presetJson: Record<string, unknown>,
  productName: string
): string {
  switch (action) {
    case "remove_bg":
      return `Remove the background from this product image of "${productName}". Replace the background with a clean, pure white (#FFFFFF) background. Preserve all product details, textures, shadows, and colors exactly as they are. Professional product photography cutout.`;

    case "enhance":
      return `Enhance this product image of "${productName}" for professional e-commerce use. Improve lighting balance, color accuracy, sharpness, contrast and overall image quality. Make it look like a professional studio photograph. Keep the product exactly as it is — only improve the image quality.`;

    case "replace_bg": {
      const presetId = presetJson?.scenePresetId as string | undefined;
      const modifier = presetId
        ? getPromptModifier(presetId)
        : "on a clean, modern professional background";
      return `Edit this product image of "${productName}". Place the product ${modifier}. Keep the product clearly visible and the main focus. Do not alter the product itself, only change the background and environment. Professional e-commerce photography.`;
    }

    case "generate_scene": {
      const presetId = presetJson?.scenePresetId as string | undefined;
      const modifier = presetId
        ? getPromptModifier(presetId)
        : "in a professional lifestyle setting";
      return `Create a professional e-commerce lifestyle scene for this "${productName}". ${modifier}. The product should be the clear focal point. Professional product photography quality. Photorealistic.`;
    }

    case "generate_angles":
      return `Generate a professional product photograph of "${productName}", front view, facing the camera directly. Professional studio lighting, clean white background.`;

    default:
      return `Edit this product image of "${productName}" for professional e-commerce use. Improve the overall quality and presentation.`;
  }
}

function buildAnglePrompt(productName: string, angle: string): string {
  const angleDesc =
    VIEW_ANGLE_PROMPTS[angle as ViewAngle] || "front view, facing the camera";
  return `Generate a professional product photograph of "${productName}", ${angleDesc}. Professional studio lighting, clean white background. High resolution e-commerce product photography.`;
}

// ============================================================================
// IMAGE HELPERS + SSRF PROTECTION
// ============================================================================

/** Maximum image size in bytes (10 MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * Blocked IP ranges for SSRF protection.
 */
const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private class B
  /^192\.168\./,               // Private class C
  /^169\.254\./,               // Link-local / cloud metadata
  /^0\./,                      // Current network
  /^::1$/,                     // IPv6 loopback
  /^fc00:/i,                   // IPv6 private
  /^fe80:/i,                   // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  'instance-data',
];

function validateImageUrl(urlString: string): void {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid image URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/HTTPS image URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.some(h => hostname === h || hostname.endsWith('.' + h))) {
    throw new Error('Access to internal hosts is not allowed');
  }

  if (BLOCKED_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
    throw new Error('Access to private IP ranges is not allowed');
  }
}

async function fetchImageFromUrl(
  imageUrl: string
): Promise<{ data: string; mimeType: string }> {
  validateImageUrl(imageUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(imageUrl, {
      headers: { Accept: "image/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error(`Image too large: ${Math.round(buffer.byteLength / 1024 / 1024)}MB (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
    }

    return {
      data: Buffer.from(buffer).toString("base64"),
      mimeType: response.headers.get("content-type") || "image/jpeg",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================================
// GEMINI GENERATION
// ============================================================================

async function generateWithGemini(
  ai: InstanceType<typeof GoogleGenAI>,
  model: string,
  sourceImage: { data: string; mimeType: string },
  prompt: string
): Promise<string | null> {
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: sourceImage.mimeType,
            data: sourceImage.data,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 0.6,
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) return null;

  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }
  return null;
}

// ============================================================================
// BATCH PROGRESS UPDATER
// ============================================================================

async function updateBatchProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
) {
  try {
    const { data: jobs } = await supabase
      .from("studio_jobs")
      .select("status")
      .eq("batch_id", batchId);

    if (!jobs) return;

    const total = jobs.length;
    const done = jobs.filter((j) => j.status === "done").length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const processed = done + failed;

    const batchStatus = processed >= total ? "completed" : "processing";

    await supabase
      .from("batch_jobs")
      .update({
        status: batchStatus,
        processed_items: processed,
        successful_items: done,
        failed_items: failed,
      })
      .eq("id", batchId);
  } catch (err) {
    console.error("[Photo Studio] Failed to update batch progress:", err);
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  // 1. Parse request
  let body: { jobId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { jobId } = body;
  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "jobId is required" },
      { status: 400 }
    );
  }

  // 2. Validate Gemini key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[Photo Studio] GEMINI_API_KEY is not configured");
    return NextResponse.json(
      { success: false, error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  // 3. Supabase client (authenticated via cookies)
  const supabase = await createClient();

  // 4. Fetch job
  const { data: job, error: jobError } = await supabase
    .from("studio_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { success: false, error: "Job not found or access denied" },
      { status: 404 }
    );
  }

  // SEC-05: Explicit auth + ownership check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }
  if (job.tenant_id !== user.id) {
    return NextResponse.json(
      { success: false, error: "Access denied" },
      { status: 403 }
    );
  }

  if (job.status !== "pending") {
    return NextResponse.json(
      { success: false, error: `Job already ${job.status}` },
      { status: 409 }
    );
  }

  // 5. Mark as running
  await supabase
    .from("studio_jobs")
    .update({ status: "running" })
    .eq("id", jobId);

  try {
    // 6. Get product info (include all image source fields)
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("title, metadata, working_content, image_url")
      .eq("id", job.product_id)
      .single();

    if (productError) {
      console.error(
        `[Photo Studio] Job ${jobId}: failed to fetch product ${job.product_id}:`,
        productError.message
      );
    }

    const productName = product?.title || "Product";

    // 7. Resolve input image URLs with multi-source fallback
    let inputUrls: string[] = (job.input_urls || []).filter(Boolean);

    if (inputUrls.length === 0 && product) {
      // Priority 1: working_content.images (active working copy)
      const wcImages = (product.working_content as Record<string, unknown>)
        ?.images as Array<{ src: string }> | undefined;
      if (wcImages?.length) {
        inputUrls = wcImages.filter((img) => img.src).map((img) => img.src);
      }

      // Priority 2: metadata.images (original synced data)
      if (inputUrls.length === 0) {
        const metaImages = (product.metadata as Record<string, unknown>)
          ?.images as Array<{ src: string }> | undefined;
        if (metaImages?.length) {
          inputUrls = metaImages
            .filter((img) => img.src)
            .map((img) => img.src);
        }
      }

      // Priority 3: image_url (single featured image field)
      if (inputUrls.length === 0 && product.image_url) {
        inputUrls = [product.image_url as string];
      }
    }

    if (inputUrls.length === 0) {
      throw new Error(
        "Aucune image source disponible pour ce produit. Verifiez que le produit possede au moins une image."
      );
    }

    // 8. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash-image";

    const presetJson =
      (job.preset_json as Record<string, unknown>) || {};

    // 9. Generate based on action
    const outputUrls: string[] = [];

    if (job.action === "generate_angles") {
      // Multiple angles from first source image
      const angles: string[] = (presetJson.angles as string[]) || [
        "front",
        "three_quarter_left",
        "three_quarter_right",
        "top",
      ];
      const sourceImage = await fetchImageFromUrl(inputUrls[0]);

      for (const angle of angles) {
        const prompt = buildAnglePrompt(productName, angle);
        const result = await generateWithGemini(ai, model, sourceImage, prompt);
        if (result) outputUrls.push(result);
      }
    } else {
      // Standard: process first input image
      const prompt = buildPromptForAction(job.action, presetJson, productName);
      const sourceImage = await fetchImageFromUrl(inputUrls[0]);

      const result = await generateWithGemini(ai, model, sourceImage, prompt);
      if (result) outputUrls.push(result);
    }

    if (outputUrls.length === 0) {
      throw new Error("Le modele n'a genere aucune image");
    }

    // 10. Update job as done
    await supabase
      .from("studio_jobs")
      .update({
        status: "done",
        output_urls: outputUrls,
      })
      .eq("id", jobId);

    // 11. Update batch progress
    if (job.batch_id) {
      await updateBatchProgress(supabase, job.batch_id);
    }

    return NextResponse.json({
      success: true,
      outputCount: outputUrls.length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue";
    console.error(`[Photo Studio] Job ${jobId} failed:`, message);

    // Mark job as failed
    await supabase
      .from("studio_jobs")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", jobId);

    // Update batch progress even on failure
    if (job.batch_id) {
      await updateBatchProgress(supabase, job.batch_id);
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
