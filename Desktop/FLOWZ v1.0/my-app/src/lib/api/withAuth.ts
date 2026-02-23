import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient, User } from '@supabase/supabase-js'

export interface AuthContext {
  supabase: SupabaseClient
  user: User
  tenantId: string
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse>

/**
 * Wraps an API route handler with authentication.
 * Returns 401 if user is not authenticated.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        )
      }

      return handler(req, { supabase, user, tenantId: user.id })
    } catch (err) {
      console.error('[withAuth] Unexpected error:', err)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }
  }
}
