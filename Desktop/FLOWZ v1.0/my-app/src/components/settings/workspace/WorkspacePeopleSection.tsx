'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteMemberSchema, type InviteMemberFormValues } from '@/schemas/workspace'
import {
  useWorkspace,
  useWorkspaceMembers,
  useWorkspaceInvitations,
  useInviteMember,
  useCancelInvitation,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/workspace'
import { WORKSPACE_ROLE_LABELS } from '@/constants/plans'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  SettingsCard,
  SettingsHeader,
} from '@/components/settings/ui/SettingsCard'
import { Users, UserPlus, MoreHorizontal, Shield, Loader2, Crown, Mail, Clock, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-system'
import { useAuth } from '@/lib/auth/AuthContext'
import type { WorkspaceMember, WorkspaceRole } from '@/types/workspace'

const ROLE_BADGE_STYLES: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-600',
  admin: 'bg-foreground/10 text-foreground',
  editor: 'bg-emerald-500/10 text-emerald-600',
  viewer: 'bg-muted text-muted-foreground',
}

export default function WorkspacePeopleSection() {
  const { user } = useAuth()
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspace?.id)
  const { data: invitations } = useWorkspaceInvitations(workspace?.id)
  const inviteMember = useInviteMember()
  const cancelInvitation = useCancelInvitation()
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null)

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: '', role: 'editor' },
  })

  const isOwner = workspace?.owner_id === user?.id
  const currentMember = members?.find((m) => m.user_id === user?.id)
  const canManageMembers = isOwner || currentMember?.role === 'owner' || currentMember?.role === 'admin'

  const handleInvite = (data: InviteMemberFormValues) => {
    if (!workspace) return
    inviteMember.mutate(
      { workspaceId: workspace.id, email: data.email, role: data.role as WorkspaceRole },
      {
        onSuccess: () => {
          setInviteOpen(false)
          form.reset()
        },
      }
    )
  }

  const handleRoleChange = (member: WorkspaceMember, newRole: WorkspaceRole) => {
    if (!workspace) return
    updateRole.mutate({ memberId: member.id, workspaceId: workspace.id, role: newRole })
  }

  const handleRemove = () => {
    if (!removeTarget || !workspace) return
    removeMember.mutate(
      { memberId: removeTarget.id, workspaceId: workspace.id },
      { onSuccess: () => setRemoveTarget(null) }
    )
  }

  const handleCancelInvitation = (invitationId: string) => {
    if (!workspace) return
    cancelInvitation.mutate({ invitationId, workspaceId: workspace.id })
  }

  const isLoading = wsLoading || membersLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pendingInvitations = invitations || []

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Invite button */}
      <motion.div variants={motionTokens.variants.staggerItem} className="flex items-start justify-end">
        {canManageMembers && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 text-[11px] rounded-lg gap-1.5 font-medium shrink-0">
                <UserPlus className="h-3.5 w-3.5" />
                Inviter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Inviter un membre</DialogTitle>
                <DialogDescription>
                  Entrez une adresse email. Si l&apos;utilisateur n&apos;a pas encore de compte, l&apos;invitation restera en attente.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                  <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="membre@exemple.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(['admin', 'editor', 'viewer'] as const).map((role) => (
                              <SelectItem key={role} value={role}>
                                <div>
                                  <span className="font-medium">{WORKSPACE_ROLE_LABELS[role].label}</span>
                                  <span className="text-muted-foreground ml-2 text-xs">
                                    — {WORKSPACE_ROLE_LABELS[role].description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                      className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={inviteMember.isPending}
                      className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
                    >
                      {inviteMember.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Inviter
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Members list */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SettingsCard className="space-y-4">
          <SettingsHeader
            icon={Users}
            title="Équipe"
            description="Gérez les accès et les rôles"
          />

          <div className="divide-y divide-border/40">
            {members?.map((member) => {
              const name = member.profile?.full_name || member.profile?.email || 'Utilisateur'
              const avatar = member.profile?.avatar_url
              const memberInitials = name
                .split(' ')
                .slice(0, 2)
                .map((n) => n.charAt(0).toUpperCase())
                .join('')
              const isCurrentUser = member.user_id === user?.id
              const isMemberOwner = member.role === 'owner'

              return (
                <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatar || undefined} alt={name} />
                      <AvatarFallback className="text-xs bg-muted/60 text-foreground">
                        {memberInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-foreground">
                          {name}
                        </span>
                        {isCurrentUser && (
                          <Badge className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted text-muted-foreground">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.profile?.email || member.profile?.job_title || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        'h-5 rounded-full px-2 text-[10px] font-medium border-0',
                        ROLE_BADGE_STYLES[member.role]
                      )}
                    >
                      {isMemberOwner && <Crown className="h-3 w-3 mr-1" />}
                      {WORKSPACE_ROLE_LABELS[member.role]?.label || member.role}
                    </Badge>

                    {canManageMembers && !isMemberOwner && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                            Changer le rôle
                          </div>
                          {(['admin', 'editor', 'viewer'] as const)
                            .filter((r) => r !== member.role)
                            .map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => handleRoleChange(member, role)}
                                disabled={updateRole.isPending}
                              >
                                <Shield className="mr-2 h-3.5 w-3.5" />
                                {WORKSPACE_ROLE_LABELS[role].label}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setRemoveTarget(member)}
                          >
                            Retirer du workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Pending invitations */}
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between py-3 group">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-muted/40 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">
                        {invitation.email}
                      </span>
                      <Badge className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-amber-500/10 text-amber-600">
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      'h-5 rounded-full px-2 text-[10px] font-medium border-0',
                      ROLE_BADGE_STYLES[invitation.role]
                    )}
                  >
                    {WORKSPACE_ROLE_LABELS[invitation.role]?.label || invitation.role}
                  </Badge>

                  {canManageMembers && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={cancelInvitation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {(!members || members.length === 0) && pendingInvitations.length === 0 && (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun membre</p>
              </div>
            )}
          </div>
        </SettingsCard>
      </motion.div>

      {/* Remove member confirmation dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.profile?.full_name || 'Ce membre'} n&apos;aura plus accès au workspace.
              Cette action peut être annulée en le réinvitant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="h-8 text-[11px] rounded-lg gap-1.5 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
