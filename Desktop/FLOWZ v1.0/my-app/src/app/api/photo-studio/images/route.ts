import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ============================================================================
// GET — Fetch studio images with optional filters
// ============================================================================

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");
  const status = searchParams.get("status");
  const action = searchParams.get("action");

  let query = supabase
    .from("studio_images")
    .select("*")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  if (productId) query = query.eq("product_id", productId);
  if (status) query = query.eq("status", status);
  if (action) query = query.eq("action", action);

  const { data: images, error } = await query;

  if (error) {
    console.error("[studio-images] GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }

  return NextResponse.json({ images: images ?? [] });
}

// ============================================================================
// PATCH — Update image status (approve, publish, revoke, reject)
// ============================================================================

const VALID_ACTIONS = ["approve", "publish", "revoke", "reject"] as const;
type PatchAction = (typeof VALID_ACTIONS)[number];

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { imageIds: string[]; action: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageIds, action } = body;

  if (
    !Array.isArray(imageIds) ||
    imageIds.length === 0 ||
    !VALID_ACTIONS.includes(action as PatchAction)
  ) {
    return NextResponse.json(
      { error: "Invalid imageIds or action" },
      { status: 400 }
    );
  }

  // Cap batch size to prevent abuse
  if (imageIds.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 images per request" },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: owned, error: ownershipError } = await supabase
    .from("studio_images")
    .select("id, status, storage_url, product_id")
    .eq("tenant_id", user.id)
    .in("id", imageIds);

  if (ownershipError) {
    console.error("[studio-images] ownership check error:", ownershipError.message);
    return NextResponse.json(
      { error: "Failed to verify image ownership" },
      { status: 500 }
    );
  }

  if (!owned || owned.length !== imageIds.length) {
    return NextResponse.json(
      { error: "Some images not found or not owned" },
      { status: 403 }
    );
  }

  const patchAction = action as PatchAction;

  try {
    switch (patchAction) {
      case "approve": {
        // draft → approved
        const draftIds = owned
          .filter((img) => img.status === "draft")
          .map((img) => img.id);
        if (draftIds.length === 0) {
          return NextResponse.json(
            { error: "No draft images to approve" },
            { status: 400 }
          );
        }
        const { error } = await supabase
          .from("studio_images")
          .update({ status: "approved", approved_at: new Date().toISOString() })
          .in("id", draftIds)
          .eq("tenant_id", user.id);
        if (error) throw error;
        return NextResponse.json({ updated: draftIds.length });
      }

      case "revoke": {
        // approved → draft
        const approvedIds = owned
          .filter((img) => img.status === "approved")
          .map((img) => img.id);
        if (approvedIds.length === 0) {
          return NextResponse.json(
            { error: "No approved images to revoke" },
            { status: 400 }
          );
        }
        const { error } = await supabase
          .from("studio_images")
          .update({ status: "draft", approved_at: null })
          .in("id", approvedIds)
          .eq("tenant_id", user.id);
        if (error) throw error;
        return NextResponse.json({ updated: approvedIds.length });
      }

      case "publish": {
        // approved → published + copy to product working_content.images
        const publishable = owned.filter((img) => img.status === "approved");
        if (publishable.length === 0) {
          return NextResponse.json(
            { error: "No approved images to publish" },
            { status: 400 }
          );
        }
        const publishIds = publishable.map((img) => img.id);

        const { error: updateError } = await supabase
          .from("studio_images")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
          })
          .in("id", publishIds)
          .eq("tenant_id", user.id);
        if (updateError) throw updateError;

        // Group by product_id and append to working_content.images
        const byProduct = new Map<string, string[]>();
        for (const img of publishable) {
          const urls = byProduct.get(img.product_id) ?? [];
          urls.push(img.storage_url);
          byProduct.set(img.product_id, urls);
        }

        for (const [productId, urls] of byProduct) {
          // Fetch current working_content
          const { data: product } = await supabase
            .from("products")
            .select("working_content")
            .eq("id", productId)
            .eq("tenant_id", user.id)
            .single();

          const wc = (product?.working_content as Record<string, unknown>) ?? {};
          const existingImages = Array.isArray(wc.images) ? wc.images : [];
          const mergedImages = [...existingImages, ...urls];

          await supabase
            .from("products")
            .update({
              working_content: { ...wc, images: mergedImages },
            })
            .eq("id", productId)
            .eq("tenant_id", user.id);
        }

        return NextResponse.json({ updated: publishIds.length });
      }

      case "reject": {
        // Delete from storage + DB
        const storageUrls = owned.map((img) => img.storage_url).filter(Boolean);

        // Extract storage paths from URLs and delete from bucket
        for (const url of storageUrls) {
          try {
            const urlObj = new URL(url);
            // Path format: /storage/v1/object/public/bucket-name/path
            const match = urlObj.pathname.match(
              /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/
            );
            if (match) {
              const [, bucket, path] = match;
              await supabase.storage.from(bucket).remove([path]);
            }
          } catch {
            // Storage deletion is best-effort
            console.warn("[studio-images] Failed to delete storage object:", url);
          }
        }

        const { error } = await supabase
          .from("studio_images")
          .delete()
          .in("id", imageIds)
          .eq("tenant_id", user.id);
        if (error) throw error;

        return NextResponse.json({ deleted: imageIds.length });
      }
    }
  } catch (err) {
    console.error("[studio-images] PATCH error:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to update images" },
      { status: 500 }
    );
  }
}
