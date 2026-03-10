import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const inviteSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { workspaceId, email, role } = parsed.data

    // Authenticate caller
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Verify caller is owner/admin of workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les droits pour inviter des membres' },
        { status: 403 }
      )
    }

    // Check if user already exists in profiles
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (targetProfile) {
      // User exists → add directly to workspace_members
      const { data: existing } = await supabase
        .from('workspace_members')
        .select('id, status')
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetProfile.id)
        .maybeSingle()

      if (existing?.status === 'active') {
        return NextResponse.json(
          { error: 'Cet utilisateur est déjà membre du workspace' },
          { status: 409 }
        )
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('workspace_members')
          .update({
            role,
            status: 'active',
            invited_by: user.id,
            invited_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspaceId,
            user_id: targetProfile.id,
            role,
            status: 'active',
            invited_by: user.id,
          })

        if (insertError) throw insertError
      }

      return NextResponse.json({ type: 'direct' })
    }

    // User doesn't exist → check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('workspace_invitations')
      .select('id, status, expires_at')
      .eq('workspace_id', workspaceId)
      .eq('email', email)
      .maybeSingle()

    if (existingInvite?.status === 'pending' && new Date(existingInvite.expires_at) > new Date()) {
      return NextResponse.json(
        { error: 'Une invitation est déjà en attente pour cet email' },
        { status: 409 }
      )
    }

    // Create or update invitation record (UNIQUE on workspace_id, email)
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

    if (existingInvite) {
      const { error: updateError } = await supabase
        .from('workspace_invitations')
        .update({
          role,
          status: 'pending',
          invite_token: newToken,
          invited_by: user.id,
          expires_at: newExpiry,
        })
        .eq('id', existingInvite.id)

      if (updateError) throw updateError
    } else {
      const { error: inviteError } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email,
          role,
          status: 'pending',
          invite_token: newToken,
          invited_by: user.id,
          expires_at: newExpiry,
        })

      if (inviteError) throw inviteError
    }

    // Send invitation email via Supabase Auth admin
    const adminClient = createAdminClient()
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''

    // Try invite (new user), fallback to magic link (existing auth user)
    const { error: inviteEmailError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/app/overview`,
      data: {
        invited_to_workspace: workspaceId,
        invited_role: role,
      },
    })

    if (inviteEmailError) {
      // User probably already exists in auth.users — try magic link instead
      const { error: magicLinkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${origin}/auth/callback?next=/app/overview` },
      })

      if (magicLinkError) {
        console.error('[workspace/invite] Email send failed:', inviteEmailError.message, '|', magicLinkError.message)
        return NextResponse.json({
          type: 'invitation',
          warning: `Invitation créée mais l'email n'a pas pu être envoyé (${inviteEmailError.message})`,
        })
      }
    }

    return NextResponse.json({ type: 'invitation' })
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('[workspace/invite] Error:', message)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
