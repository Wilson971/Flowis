import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  store_id: z.string().uuid(),
})

export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * POST /api/stores/health-check
 * Tests connectivity of an existing store by reading its credentials from the DB.
 * Updates platform_connections.connection_health accordingly.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }

  // Rate limit
  const { rateLimitOrNull, RATE_LIMIT_HEALTH_CHECK } = await import('@/lib/rate-limit');
  const rlResponse = rateLimitOrNull(user.id, 'stores/health-check', RATE_LIMIT_HEALTH_CHECK);
  if (rlResponse) return rlResponse;

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Corps invalide' }, { status: 400 })
  }

  const parsed = schema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'store_id invalide' }, { status: 400 })
  }

  const { store_id } = parsed.data

  // M5 fix: Add tenant_id filter + explicit columns instead of select(*)
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select(`
      id,
      name,
      platform,
      platform_connections(
        id,
        shop_url,
        credentials_encrypted
      )
    `)
    .eq('id', store_id)
    .eq('tenant_id', user.id)
    .maybeSingle()

  if (storeError) {
    console.error('[health-check] Store query error:', storeError.message, storeError.code, storeError.details)
    return NextResponse.json({
      success: false,
      message: 'Erreur de requête boutique',
    }, { status: 500 })
  }

  if (!store) {
    return NextResponse.json({ success: false, message: 'Boutique introuvable' }, { status: 404 })
  }

  // Normalize connection (same pattern as useStores)
  const conn = Array.isArray(store.platform_connections)
    ? store.platform_connections[0]
    : store.platform_connections

  if (!conn?.shop_url) {
    return NextResponse.json({ success: false, message: 'Aucune connexion configurée pour cette boutique' }, { status: 400 })
  }

  // Extract credentials from JSONB
  let creds: Record<string, string> = {}
  if (conn.credentials_encrypted) {
    try {
      creds = typeof conn.credentials_encrypted === 'string'
        ? JSON.parse(conn.credentials_encrypted)
        : conn.credentials_encrypted as Record<string, string>
    } catch {
      return NextResponse.json({ success: false, message: 'Credentials invalides' }, { status: 400 })
    }
  }
  const apiKey = creds.consumer_key || creds.api_key || ''
  const apiSecret = creds.consumer_secret || creds.api_secret || ''
  const accessToken = creds.access_token || ''
  const baseUrl = conn.shop_url.replace(/\/$/, '')
  const platform = (store.platform || '').toLowerCase()

  const startTime = Date.now()
  let health: 'healthy' | 'unhealthy' = 'unhealthy'
  let message = ''
  let responseTimeMs = 0

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      if (platform === 'woocommerce') {
        // Build auth headers
        const headers: HeadersInit = { Accept: 'application/json' }
        if (apiKey.startsWith('ck_')) {
          // Use query params for ck_ keys
          const url = new URL(`${baseUrl}/wp-json/wc/v3/system_status`)
          url.searchParams.set('consumer_key', apiKey)
          url.searchParams.set('consumer_secret', apiSecret)
          const res = await fetch(url.toString(), { headers, signal: controller.signal })
          responseTimeMs = Date.now() - startTime
          if (res.ok) {
            health = 'healthy'
            message = `Connexion OK (${responseTimeMs}ms)`
          } else {
            message = `HTTP ${res.status}`
          }
        } else {
          headers['Authorization'] = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
          const res = await fetch(`${baseUrl}/wp-json/wc/v3/system_status`, {
            headers,
            signal: controller.signal,
          })
          responseTimeMs = Date.now() - startTime
          if (res.ok) {
            health = 'healthy'
            message = `Connexion OK (${responseTimeMs}ms)`
          } else {
            message = `HTTP ${res.status}`
          }
        }
      } else if (platform === 'shopify') {
        const res = await fetch(`${baseUrl}/admin/api/2024-01/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken || apiKey,
            Accept: 'application/json',
          },
          signal: controller.signal,
        })
        responseTimeMs = Date.now() - startTime
        if (res.ok) {
          health = 'healthy'
          message = `Connexion OK (${responseTimeMs}ms)`
        } else {
          message = `HTTP ${res.status}`
        }
      } else {
        message = `Plateforme "${platform}" non supportée`
      }
    } finally {
      clearTimeout(timeout)
    }
  } catch (err: unknown) {
    responseTimeMs = Date.now() - startTime
    if (err instanceof Error && err.name === 'AbortError') {
      message = 'Délai dépassé (10s)'
    } else {
      message = err instanceof Error ? err.message : 'Erreur inconnue'
    }
  }

  // Update platform_connections health
  const { error: updateError } = await supabase
    .from('platform_connections')
    .update({
      connection_health: health,
      last_heartbeat_at: new Date().toISOString(),
      heartbeat_error: health === 'healthy' ? null : message,
    })
    .eq('id', conn.id)

  if (updateError) {
    console.error('[health-check] Failed to update connection health:', updateError.message)
  }

  return NextResponse.json({
    success: health === 'healthy',
    health,
    message,
    response_time_ms: responseTimeMs,
    store_name: store.name,
  })
}
