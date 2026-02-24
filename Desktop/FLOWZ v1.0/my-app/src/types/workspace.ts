/**
 * Workspace types for multi-tenant team management
 */

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type MemberStatus = 'active' | 'invited' | 'suspended'
export type WorkspacePlan = 'free' | 'pro' | 'enterprise'

export interface Workspace {
  id: string
  owner_id: string
  name: string
  slug: string | null
  logo_url: string | null
  currency: string
  default_language: string
  timezone: string
  plan: WorkspacePlan
  usage_limits: UsageLimits
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface UsageLimits {
  max_products: number
  max_articles: number
  max_stores: number
  max_ai_credits: number
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  status: MemberStatus
  invited_by: string | null
  invited_at: string | null
  accepted_at: string | null
  created_at: string
  // Joined from profiles
  profile?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
    job_title: string | null
  }
}

export interface WorkspaceUsage {
  products: number
  articles: number
  stores: number
  members: number
}

export interface InviteMemberParams {
  workspaceId: string
  email: string
  role: WorkspaceRole
}

export interface UpdateMemberRoleParams {
  memberId: string
  workspaceId: string
  role: WorkspaceRole
}

export interface RemoveMemberParams {
  memberId: string
  workspaceId: string
}

export interface PlanDefinition {
  id: WorkspacePlan
  name: string
  price: string
  description: string
  limits: UsageLimits
  features: string[]
  highlighted?: boolean
}
