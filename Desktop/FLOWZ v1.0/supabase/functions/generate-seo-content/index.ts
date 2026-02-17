/**
 * generate-seo-content - Edge Function pour générer le contenu SEO (titre et meta description)
 * 
 * POST /generate-seo-content
 * Body: {
 *   product_id: string,
 *   type: 'title' | 'description' | 'both',
 *   options?: GenerationOptions
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
    buildSeoTitlePrompt,
    buildMetaDescriptionPrompt,
    callOpenAI,
    sanitizeHtml,
    type ProductContext,
    type GenerationOptions,
} from "../_shared/ai-helpers.ts";

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: getCorsHeaders(req) });
    }

    try {
        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        const { product_id, type = 'both', options = {} } = await req.json();

        if (!product_id) {
            return new Response(
                JSON.stringify({ error: "product_id is required" }),
                { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        console.log(`[generate-seo-content] Starting for product ${product_id}, type: ${type}`);

        // Fetch product
        const { data: product, error: productError } = await supabase
            .from("products")
            .select(`
                id,
                title,
                description,
                short_description,
                price,
                tags,
                seo_title,
                seo_description,
                metadata,
                draft_generated_content
            `)
            .eq("id", product_id)
            .single();

        if (productError || !product) {
            return new Response(
                JSON.stringify({ error: "Product not found" }),
                { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        const productContext: ProductContext = {
            title: product.title,
            description: product.description ? sanitizeHtml(product.description) : undefined,
            short_description: product.short_description ? sanitizeHtml(product.short_description) : undefined,
            price: product.price,
            categories: product.metadata?.categories || [],
            tags: product.tags || [],
            seo_title: product.seo_title,
            seo_description: product.seo_description,
        };

        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) {
            return new Response(
                JSON.stringify({ error: "OpenAI API key not configured" }),
                { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
            );
        }

        const results: { seo_title?: string; seo_description?: string; tokens_used: number } = {
            tokens_used: 0,
        };

        // Generate SEO title
        if (type === 'title' || type === 'both') {
            const prompt = buildSeoTitlePrompt(productContext, options as GenerationOptions);
            const result = await callOpenAI(prompt, openaiKey, {
                maxTokens: 100,
                temperature: 0.6,
            });

            if (result.success && result.content) {
                results.seo_title = result.content;
                results.tokens_used += result.tokens_used || 0;
            }
        }

        // Generate meta description
        if (type === 'description' || type === 'both') {
            const prompt = buildMetaDescriptionPrompt(productContext, options as GenerationOptions);
            const result = await callOpenAI(prompt, openaiKey, {
                maxTokens: 200,
                temperature: 0.6,
            });

            if (result.success && result.content) {
                results.seo_description = result.content;
                results.tokens_used += result.tokens_used || 0;
            }
        }

        console.log(`[generate-seo-content] Generated, ${results.tokens_used} tokens used`);

        // Save to draft_generated_content
        const currentDraft = product.draft_generated_content || {};
        const newDraft = {
            ...currentDraft,
            ...(results.seo_title && {
                seo_title: results.seo_title,
                seo_title_generated_at: new Date().toISOString(),
            }),
            ...(results.seo_description && {
                seo_description: results.seo_description,
                seo_description_generated_at: new Date().toISOString(),
            }),
        };

        const { error: updateError } = await supabase
            .from("products")
            .update({
                draft_generated_content: newDraft,
                updated_at: new Date().toISOString(),
            })
            .eq("id", product_id);

        return new Response(
            JSON.stringify({
                success: true,
                seo_title: results.seo_title,
                seo_description: results.seo_description,
                tokens_used: results.tokens_used,
                saved: !updateError,
            }),
            { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("[generate-seo-content] Exception:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
    }
});
