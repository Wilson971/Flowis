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
import { fetchImageSafe } from "@/lib/ssrf";

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
// IMAGE HELPERS
// ============================================================================

/** Maximum image size in bytes (10 MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

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

  // SEC-05: Explicit auth check BEFORE fetching job
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // 4. Fetch job (filtered by tenant_id for ownership)
  const { data: job, error: jobError } = await supabase
    .from("studio_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("tenant_id", user.id)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { success: false, error: "Job not found or access denied" },
      { status: 404 }
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
      const sourceImage = await fetchImageSafe(inputUrls[0], MAX_IMAGE_SIZE);

      for (const angle of angles) {
        const prompt = buildAnglePrompt(productName, angle);
        const result = await generateWithGemini(ai, model, sourceImage, prompt);
        if (result) outputUrls.push(result);
      }
    } else {
      // Standard: process first input image
      const prompt = buildPromptForAction(job.action, presetJson, productName);
      const sourceImage = await fetchImageSafe(inputUrls[0], MAX_IMAGE_SIZE);

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
