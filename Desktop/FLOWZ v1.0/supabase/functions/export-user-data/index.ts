import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  // ---- Auth: verify JWT ----
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // ---- Collect user data in parallel ----
    const [profileRes, storesRes, productsRes, postsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, full_name, first_name, last_name, avatar_url, website, email, phone, job_title, company, bio, country, timezone, language, theme, created_at, updated_at')
        .eq('id', user.id)
        .single(),

      supabase
        .from('stores')
        .select('id, name, platform, status, created_at, updated_at')
        .eq('tenant_id', user.id)
        .limit(100),

      supabase
        .from('products')
        .select('id, title, status, created_at, updated_at')
        .eq('tenant_id', user.id)
        .limit(200),

      supabase
        .from('blog_posts')
        .select('id, title, status, created_at, updated_at, published_at')
        .eq('tenant_id', user.id)
        .limit(200),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      profile: profileRes.data ?? null,
      stores: storesRes.data ?? [],
      products: productsRes.data ?? [],
      blog_posts: postsRes.data ?? [],
      _note: 'This export was generated in accordance with RGPD / GDPR Article 20 (Data Portability). Sensitive credentials (API keys) are excluded.',
    }

    const filename = `flowz-export-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[export-user-data] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
