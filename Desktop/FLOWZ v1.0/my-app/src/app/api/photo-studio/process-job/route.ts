import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchImageSafe } from "@/lib/ssrf";
import {
  getActionHandler,
  isValidAction,
  DEFAULT_ANGLES,
} from "@/features/photo-studio/actions";
import type { ActionInput } from "@/features/photo-studio/actions";

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================================================
// COST CALCULATOR
// ============================================================================

function calculateGeminiCost(usage: {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
}) {
  const inputCost = ((usage?.promptTokenCount ?? 0) / 1_000_000) * 0.075;
  const outputCost =
    ((usage?.candidatesTokenCount ?? 0) / 1_000_000) * 0.3;
  return inputCost + outputCost;
}

// ============================================================================
// IMAGE HELPERS
// ============================================================================

/** Maximum image size in bytes (10 MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// ============================================================================
// SUPABASE STORAGE UPLOAD
// ============================================================================

const STORAGE_BUCKET = "studio-images";

async function uploadToStorage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base64Data: string,
  mimeType: string,
  productId: string,
  jobId: string,
  index: number
): Promise<string> {
  const buffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const storagePath = `products/${productId}/${jobId}_${index}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError)
    throw new Error(`Storage upload failed: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

  return publicUrl;
}

// ============================================================================
// GEMINI GENERATION
// ============================================================================

async function generateWithGemini(
  ai: InstanceType<typeof GoogleGenAI>,
  model: string,
  sourceImage: { data: string; mimeType: string },
  prompt: string,
  temperature: number,
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  jobId: string,
  imageIndex: number
): Promise<{
  url: string | null;
  usage: { promptTokenCount?: number; candidatesTokenCount?: number };
}> {
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
      temperature,
    },
  });

  const usage = {
    promptTokenCount: response.usageMetadata?.promptTokenCount,
    candidatesTokenCount: response.usageMetadata?.candidatesTokenCount,
  };

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) return { url: null, usage };

  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      const url = await uploadToStorage(
        supabase,
        part.inlineData.data,
        mime,
        productId,
        jobId,
        imageIndex
      );
      return { url, usage };
    }
  }
  return { url: null, usage };
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

export async function POST(request: NextRequest): Promise<NextResponse> {
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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
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

  const tenantId = user.id;
  const action = job.action as string;

  // 4b. Validate action via registry
  if (!isValidAction(action)) {
    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  }

  const handler = getActionHandler(action)!;

  // 4c. Quota check BEFORE processing
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { data: quota } = await supabase
    .from("studio_quotas")
    .select("generations_used, generations_limit")
    .eq("tenant_id", tenantId)
    .eq("month", currentMonth)
    .single();

  if (quota && quota.generations_used >= quota.generations_limit) {
    await supabase
      .from("studio_jobs")
      .update({ status: "failed", error_message: "Quota mensuel atteint" })
      .eq("id", jobId);

    if (job.batch_id) {
      await updateBatchProgress(supabase, job.batch_id);
    }

    return NextResponse.json(
      { success: false, error: "QUOTA_EXCEEDED" },
      { status: 429 }
    );
  }

  // 5. Mark as running
  await supabase
    .from("studio_jobs")
    .update({ status: "running" })
    .eq("id", jobId);

  const startTime = Date.now();

  try {
    // 6. Get product info
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
    const productDescription =
      (product?.working_content as Record<string, unknown>)
        ?.short_description as string | undefined;

    // 7. Resolve input image URLs with multi-source fallback
    let inputUrls: string[] = (job.input_urls || []).filter(Boolean);

    if (inputUrls.length === 0 && product) {
      const wcImages = (product.working_content as Record<string, unknown>)
        ?.images as Array<{ src: string }> | undefined;
      if (wcImages?.length) {
        inputUrls = wcImages.filter((img) => img.src).map((img) => img.src);
      }

      if (inputUrls.length === 0) {
        const metaImages = (product.metadata as Record<string, unknown>)
          ?.images as Array<{ src: string }> | undefined;
        if (metaImages?.length) {
          inputUrls = metaImages
            .filter((img) => img.src)
            .map((img) => img.src);
        }
      }

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

    // 9. Generate based on action using registry
    const outputUrls: string[] = [];
    let totalUsage = { promptTokenCount: 0, candidatesTokenCount: 0 };

    if (action === "generate_angles") {
      // Multiple angles from first source image
      const angles: string[] =
        (presetJson.angles as string[]) || DEFAULT_ANGLES;
      const sourceImage = await fetchImageSafe(inputUrls[0], MAX_IMAGE_SIZE);

      for (let i = 0; i < angles.length; i++) {
        const input: ActionInput = {
          imageBase64: sourceImage.data,
          imageMimeType: sourceImage.mimeType,
          productName,
          productDescription,
          angles: [angles[i]],
          preset: presetJson,
        };
        const prompt = handler.buildPrompt(input);
        const { url, usage } = await generateWithGemini(
          ai, model, sourceImage, prompt,
          handler.config.temperature,
          supabase, job.product_id, jobId, i
        );
        totalUsage.promptTokenCount += usage.promptTokenCount ?? 0;
        totalUsage.candidatesTokenCount += usage.candidatesTokenCount ?? 0;
        if (url) outputUrls.push(url);
      }
    } else {
      // Standard: process first input image
      const sourceImage = await fetchImageSafe(inputUrls[0], MAX_IMAGE_SIZE);
      const input: ActionInput = {
        imageBase64: sourceImage.data,
        imageMimeType: sourceImage.mimeType,
        productName,
        productDescription,
        preset: presetJson,
        userInstruction: presetJson?.instruction as string | undefined,
      };
      const prompt = handler.buildPrompt(input);

      const { url, usage } = await generateWithGemini(
        ai, model, sourceImage, prompt,
        handler.config.temperature,
        supabase, job.product_id, jobId, 0
      );
      totalUsage.promptTokenCount += usage.promptTokenCount ?? 0;
      totalUsage.candidatesTokenCount += usage.candidatesTokenCount ?? 0;
      if (url) outputUrls.push(url);
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

    // 11. Insert studio_images records
    for (const url of outputUrls) {
      await supabase.from("studio_images").insert({
        tenant_id: tenantId,
        product_id: job.product_id,
        job_id: jobId,
        storage_url: url,
        thumbnail_url: url,
        action,
        status: "draft",
        metadata: { preset: presetJson },
      });
    }

    // 12. Insert metrics
    const latencyMs = Date.now() - startTime;
    await supabase.from("studio_metrics").insert({
      tenant_id: tenantId,
      job_id: jobId,
      action,
      status: "done",
      latency_ms: latencyMs,
      gemini_tokens_input: totalUsage.promptTokenCount,
      gemini_tokens_output: totalUsage.candidatesTokenCount,
      estimated_cost_usd: calculateGeminiCost(totalUsage),
    });

    // 13. Increment quota
    await supabase.rpc("increment_studio_quota", {
      p_tenant_id: tenantId,
      p_cost: calculateGeminiCost(totalUsage),
    });

    // 14. Update batch progress
    if (job.batch_id) {
      await updateBatchProgress(supabase, job.batch_id);
    }

    return NextResponse.json({
      success: true,
      outputCount: outputUrls.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(`[Photo Studio] Job ${jobId} failed:`, message);

    // Mark job as failed
    await supabase
      .from("studio_jobs")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", jobId);

    // Insert failure metrics
    const latencyMs = Date.now() - startTime;
    await supabase.from("studio_metrics").insert({
      tenant_id: tenantId,
      job_id: jobId,
      action,
      status: "failed",
      latency_ms: latencyMs,
      gemini_tokens_input: 0,
      gemini_tokens_output: 0,
      estimated_cost_usd: 0,
      error_type: message.slice(0, 255),
    });

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
