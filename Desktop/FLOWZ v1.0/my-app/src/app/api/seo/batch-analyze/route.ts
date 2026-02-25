import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateProductSeoScore, computeSeoBreakdown } from "@/lib/seo/analyzer";
import type { ProductSeoInput } from "@/types/seo";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 50;

/**
 * POST /api/seo/batch-analyze
 *
 * Batch-analyzes products that have no seo_score yet.
 * Processes up to 50 products per call to avoid timeouts.
 * Returns { analyzed, remaining }.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    let storeId: string;
    try {
        const body = await req.json();
        storeId = body.store_id;
        if (!storeId || typeof storeId !== "string") {
            return NextResponse.json({ error: "store_id required" }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify store ownership via tenant_id
    const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id, tenant_id")
        .eq("id", storeId)
        .single();

    if (storeError || !store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Fetch products needing analysis: no seo_score OR no seo_breakdown
    const { data: products, error: fetchError } = await supabase
        .from("products")
        .select("id, title, working_content, metadata")
        .eq("store_id", storeId)
        .or("seo_score.is.null,seo_breakdown.is.null")
        .limit(BATCH_SIZE);

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
        return NextResponse.json({ analyzed: 0, remaining: 0 });
    }

    let analyzed = 0;

    for (const product of products) {
        const wc = (product.working_content ?? {}) as Record<string, unknown>;
        const meta = (product.metadata ?? {}) as Record<string, unknown>;
        const images = (wc.images ?? meta.images ?? []) as Array<{ src?: string; alt?: string }>;

        const input: ProductSeoInput = {
            title: (wc.title as string) ?? (product.title as string) ?? "",
            short_description: (wc.short_description as string) ?? (meta.short_description as string) ?? "",
            description: (wc.description as string) ?? (meta.description as string) ?? "",
            meta_title: (wc.meta_title as string) ?? (meta.meta_title as string) ?? "",
            meta_description: (wc.meta_description as string) ?? (meta.meta_description as string) ?? "",
            slug: (wc.slug as string) ?? (meta.slug as string) ?? (wc.permalink as string) ?? "",
            images,
            focus_keyword: ((wc.seo as Record<string, unknown>)?.focus_keyword as string) ?? "",
        };

        const result = calculateProductSeoScore(input);
        const breakdown = computeSeoBreakdown(result.criteria);

        const { error: updateError } = await supabase
            .from("products")
            .update({
                seo_score: result.overall,
                seo_breakdown: breakdown,
            })
            .eq("id", product.id);

        if (!updateError) {
            analyzed++;
        }
    }

    // Count remaining unscored
    const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .is("seo_score", null);

    return NextResponse.json({
        analyzed,
        remaining: count ?? 0,
    });
}
