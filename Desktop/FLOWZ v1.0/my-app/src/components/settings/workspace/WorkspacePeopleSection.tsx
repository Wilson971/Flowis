'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteMemberSchema, type InviteMemberFormValues } from '@/schemas/workspace'
import { useWorkspace, useWorkspaceMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/workspace'
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
import { Users, UserPlus, MoreHorizontal, Shield, Loader2, Crown, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { styles, motionTokens } from '@/lib/design-system'
import { useAuth } from '@/lib/auth/AuthContext'
import type { WorkspaceMember, WorkspaceRole } from '@/types/workspace'

const ROLE_BADGE_STYLES: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin: 'bg-primary/10 text-primary border-primary/20',
  editor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
}

export default function WorkspacePeopleSection() {
  const { user } = useAuth()
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspace?.id)
  const inviteMember = useInviteMember()
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
  const canManageMembers = currentMember?.role === 'owner' || currentMember?.role === 'admin'

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

  const isLoading = wsLoading || membersLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={motionTokens.variants.staggerItem} className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className={styles.text.h2}>Membres</h2>
          <p className={styles.text.bodyMuted}>
            {members?.length || 0} membre{(members?.length || 0) > 1 ? 's' : ''} dans le workspace
          </p>
        </div>
        {canManageMembers && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <UserPlus className="mr-2 h-4 w-4" />
                Inviter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Inviter un membre</DialogTitle>
                <DialogDescription>
                  Ajoutez un utilisateur existant par son adresse email
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
                    <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} className="rounded-lg">
                      Annuler
                    </Button>
                    <Button type="submit" disabled={inviteMember.isPending} className="rounded-lg">
                      {inviteMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
      <motion.div
        variants={motionTokens.variants.staggerItem}
        className={cn(styles.card.glass, 'p-6')}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(styles.iconContainer.sm, styles.iconContainer.muted, 'bg-primary/10')}>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Équipe</h3>
            <p className={styles.text.bodySmall}>Gérez les accès et les rôles</p>
          </div>
        </div>

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
              <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatar || undefined} alt={name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {memberInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn(styles.text.label, 'text-sm')}>
                        {name}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Vous
                        </Badge>
                      )}
                    </div>
                    <p className={cn(styles.text.bodySmall, 'text-xs')}>
                      {member.profile?.email || member.profile?.job_title || ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-xs px-2 py-0.5 rounded-full', ROLE_BADGE_STYLES[member.role])}
                  >
                    {isMemberOwner && <Crown className="h-3 w-3 mr-1" />}
                    {WORKSPACE_ROLE_LABELS[member.role]?.label || member.role}
                  </Badge>

                  {canManageMembers && !isMemberOwner && !isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
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

          {(!members || members.length === 0) && (
            <div className="py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className={styles.text.bodyMuted}>Aucun membre</p>
            </div>
          )}
        </div>
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
            <AlertDialogCancel className="rounded-lg">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              {removeMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
