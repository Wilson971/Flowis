import { z } from "zod";

// ============================================================================
// Basic Schemas
// ============================================================================

export const wooCredentialsSchema = z.object({
    platform: z.literal("woocommerce"),
    url: z
        .string()
        .min(1, "Store URL is required")
        .url("Invalid URL format")
        .refine(
            (val) => !val.includes("myshopify.com"),
            "This looks like a Shopify URL, not WooCommerce"
        ),
    key: z
        .string()
        .min(1, "Consumer Key is required")
        .refine(
            (val) => val.startsWith("ck_"),
            "Consumer Key must start with 'ck_'"
        ),
    secret: z
        .string()
        .min(1, "Consumer Secret is required")
        .refine(
            (val) => val.startsWith("cs_"),
            "Consumer Secret must start with 'cs_'"
        ),
    // Optional WordPress credentials (for blog sync)
    wp_username: z.string().optional(),
    wp_app_password: z.string().optional(),
    // Custom store name
    store_name: z.string().optional(),
});

export const shopifyCredentialsSchema = z.object({
    platform: z.literal("shopify"),
    url: z
        .string()
        .min(1, "Store URL is required")
        .refine(
            (val) => val.includes("myshopify.com") || val.includes("shopify"),
            "URL must be a valid Shopify store"
        ),
    access_token: z.string().min(1, "Access Token is required"),
});

export const connectionCredentialsSchema = z.discriminatedUnion("platform", [
    wooCredentialsSchema,
    shopifyCredentialsSchema,
]);

// ============================================================================
// Inferred Types
// ============================================================================

export type WooCredentials = z.infer<typeof wooCredentialsSchema>;
export type ShopifyCredentials = z.infer<typeof shopifyCredentialsSchema>;
export type ConnectionCredentials = z.infer<typeof connectionCredentialsSchema>;

// ============================================================================
// Output Types (for the hook)
// ============================================================================
export interface ValidateAndSaveResult {
    valid: boolean;
    message?: string;
    connection_id?: string;
    store_id?: string;
    store_name?: string;
}

export interface TriggerSyncResult {
    success: boolean;
    job_id?: string;
    message?: string;
}

export type SyncType = 'products' | 'categories' | 'posts';
