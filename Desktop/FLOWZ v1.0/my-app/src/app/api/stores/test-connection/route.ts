import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateExternalUrl } from '@/lib/ssrf'
import { z } from 'zod'

const testConnectionSchema = z.object({
  shop_url: z.string().url('URL de boutique invalide'),
  api_key: z.string().min(1).optional(),
  api_secret: z.string().optional(),
  platform: z.enum(['woocommerce', 'shopify']).default('woocommerce'),
})

export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * POST /api/stores/test-connection
 * Tests connectivity to a WooCommerce / Shopify store.
 * Body: { shop_url: string, api_key: string, api_secret: string, platform: 'woocommerce' | 'shopify' }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Corps de requête invalide' }, { status: 400 })
  }

  const parsed = testConnectionSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues?.[0]?.message || 'Données invalides' }, { status: 400 })
  }

  const { shop_url, api_key, api_secret, platform } = parsed.data

  // SSRF protection — block internal/private URLs
  const urlValidation = validateExternalUrl(shop_url)
  if (!urlValidation.valid) {
    return NextResponse.json({ success: false, message: `URL non autorisée: ${urlValidation.error}` }, { status: 400 })
  }

  // Normalize shop URL
  const baseUrl = shop_url.replace(/\/$/, '')

  try {
    if (platform === 'woocommerce') {
      if (!api_key || !api_secret) {
        return NextResponse.json({ success: false, message: 'Consumer Key et Consumer Secret requis' }, { status: 400 })
      }

      // Test WooCommerce API connection via system_status
      const credentials = Buffer.from(`${api_key}:${api_secret}`).toString('base64')
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)

      let response: Response
      try {
        response = await fetch(`${baseUrl}/wp-json/wc/v3/system_status`, {
          headers: {
            Authorization: `Basic ${credentials}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      if (response.ok) {
        const data = await response.json()
        const storeName = data?.settings?.title || 'WooCommerce Store'
        return NextResponse.json({
          success: true,
          message: `Connexion réussie — ${storeName}`,
        })
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          success: false,
          message: 'Identifiants incorrects — vérifiez votre Consumer Key et Consumer Secret.',
        }, { status: 401 })
      }

      return NextResponse.json({
        success: false,
        message: `Erreur HTTP ${response.status} — vérifiez l'URL de votre boutique.`,
      }, { status: 502 })
    }

    if (platform === 'shopify') {
      if (!api_key) {
        return NextResponse.json({ success: false, message: 'Access Token requis pour Shopify' }, { status: 400 })
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)

      let response: Response
      try {
        response = await fetch(`${baseUrl}/admin/api/2024-01/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': api_key,
            Accept: 'application/json',
          },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      if (response.ok) {
        const data = await response.json()
        const shopName = data?.shop?.name || 'Shopify Store'
        return NextResponse.json({ success: true, message: `Connexion réussie — ${shopName}` })
      }

      return NextResponse.json({
        success: false,
        message: `Erreur HTTP ${response.status} — vérifiez vos credentials Shopify.`,
      })
    }

    return NextResponse.json({ success: false, message: 'Plateforme non supportée' }, { status: 400 })
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json({ success: false, message: 'Délai de connexion dépassé — vérifiez l\'URL.' })
    }
    console.error('[test-connection] Connection error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, message: 'Impossible de joindre la boutique. Vérifiez l\'URL et vos identifiants.' })
  }
}
