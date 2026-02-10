/**
 * generate-description - Edge Function pour générer des descriptions produit
 * 
 * POST /generate-description
 * Body: {
 *   product_id: string,
 *   options?: GenerationOptions
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
    buildDescriptionPrompt,
    callOpenAI,
    sanitizeHtml,
    type ProductContext,
    type GenerationOptions,
} from "../_shared/ai-helpers.ts";

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse body
        const { product_id, options = {} } = await req.json();

        if (!product_id) {
            return new Response(
                JSON.stringify({ error: "product_id is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`[generate-description] Starting for product ${product_id}`);

        // Fetch product data
        const { data: product, error: productError } = await supabase
            .from("products")
            .select(`
                id,
                title,
                description,
                short_description,
                price,
                regular_price,
                sale_price,
                sku,
                tags,
                seo_title,
                seo_description,
                metadata
            `)
            .eq("id", product_id)
            .single();

        if (productError || !product) {
            console.error("[generate-description] Product not found:", productError);
            return new Response(
                JSON.stringify({ error: "Product not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build product context
        const productContext: ProductContext = {
            title: product.title,
            description: product.description ? sanitizeHtml(product.description) : undefined,
            short_description: product.short_description ? sanitizeHtml(product.short_description) : undefined,
            price: product.price,
            regular_price: product.regular_price,
            sale_price: product.sale_price,
            sku: product.sku,
            categories: product.metadata?.categories || [],
            tags: product.tags || [],
            attributes: product.metadata?.attributes || [],
            seo_title: product.seo_title,
            seo_description: product.seo_description,
        };

        // Build prompt
        const prompt = buildDescriptionPrompt(productContext, options as GenerationOptions);

        // Get OpenAI API key
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) {
            return new Response(
                JSON.stringify({ error: "OpenAI API key not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Generate description
        const result = await callOpenAI(prompt, openaiKey, {
            maxTokens: 800,
            temperature: 0.7,
        });

        if (!result.success) {
            console.error("[generate-description] Generation failed:", result.error);
            return new Response(
                JSON.stringify({ error: result.error }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`[generate-description] Generated ${result.content?.length} chars, ${result.tokens_used} tokens`);

        // Save to draft_generated_content
        const currentDraft = product.metadata?.draft_generated_content || {};
        const newDraft = {
            ...currentDraft,
            description: result.content,
            description_generated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from("products")
            .update({
                draft_generated_content: newDraft,
                updated_at: new Date().toISOString(),
            })
            .eq("id", product_id);

        if (updateError) {
            console.error("[generate-description] Update failed:", updateError);
            // Still return the generated content even if save failed
        }

        return new Response(
            JSON.stringify({
                success: true,
                content: result.content,
                tokens_used: result.tokens_used,
                saved: !updateError,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("[generate-description] Exception:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
