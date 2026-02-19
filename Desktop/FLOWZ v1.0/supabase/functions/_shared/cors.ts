/**
 * CORS configuration for Supabase Edge Functions
 *
 * Whitelisted origins only — no wildcard.
 */

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://flowz.app',
    'https://app.flowz.app',
    'https://staging.flowz.app',
];

/**
 * Build CORS headers for a given request origin.
 * Returns the origin if whitelisted, otherwise rejects.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Vary': 'Origin',
    };
}

/**
 * @deprecated Use getCorsHeaders(req) instead for origin-aware CORS.
 * Kept for backward compatibility — defaults to empty origin (blocks all).
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Handle CORS preflight (OPTIONS) request.
 * Returns a Response for OPTIONS, or null for other methods.
 */
export const handleCors = (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: getCorsHeaders(req) });
    }
    return null;
};
