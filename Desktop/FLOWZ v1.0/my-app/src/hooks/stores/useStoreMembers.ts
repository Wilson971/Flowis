/**
 * useStoreMembers — Scope 8
 *
 * Gestion des membres et invitations d'une boutique :
 * - useStoreMembers(storeId) — liste les membres avec leur rôle
 * - useStoreInvitations(storeId) — liste les invitations en attente
 * - useInviteStoreMember() — crée une invitation par email
 * - useUpdateMemberRole() — modifie le rôle d'un membre
 * - useRemoveStoreMember() — retire un membre
 * - useCancelInvitation() — annule une invitation
 * - useStoreAuditLog(storeId) — historique des actions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type {
    StoreMember,
    StoreMemberRole,
    StoreInvitation,
    StoreAuditLogEntry,
} from '@/types/store';

// ============================================================================
// QUERY KEYS
// ============================================================================

const MEMBERS_KEY = (storeId: string) => ['store-members', storeId] as const;
const INVITATIONS_KEY = (storeId: string) => ['store-invitations', storeId] as const;
const AUDIT_KEY = (storeId: string) => ['store-audit-log', storeId] as const;

// ============================================================================
// QUERIES
// ============================================================================

export function useStoreMembers(storeId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: MEMBERS_KEY(storeId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_members')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return (data ?? []) as StoreMember[];
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.LIST,
    });
}

export function useStoreInvitations(storeId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: INVITATIONS_KEY(storeId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_invitations')
                .select('*')
                .eq('store_id', storeId)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data ?? []) as StoreInvitation[];
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.LIST,
    });
}

export function useStoreAuditLog(storeId: string, limit = 20) {
    const supabase = createClient();

    return useQuery({
        queryKey: AUDIT_KEY(storeId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_audit_log')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data ?? []) as StoreAuditLogEntry[];
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.DETAIL,
    });
}

// ============================================================================
// MUTATIONS
// ============================================================================

interface InviteParams {
    storeId: string;
    email: string;
    role: Exclude<StoreMemberRole, 'owner'>;
}

export function useInviteStoreMember() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId, email, role }: InviteParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Check if already member
            const { data: existing } = await supabase
                .from('store_invitations')
                .select('id')
                .eq('store_id', storeId)
                .eq('email', email)
                .is('accepted_at', null)
                .maybeSingle();

            if (existing) {
                throw new Error(`Une invitation est déjà en attente pour ${email}`);
            }

            const { data, error } = await supabase
                .from('store_invitations')
                .insert({
                    store_id: storeId,
                    tenant_id: user.id,
                    email,
                    role,
                    invited_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            // Log audit
            await supabase.from('store_audit_log').insert({
                store_id: storeId,
                tenant_id: user.id,
                user_id: user.id,
                action: 'member_invited',
                details: { email, role },
            });

            return data as StoreInvitation;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY(data.store_id) });
            toast.success('Invitation envoyée', {
                description: `Un lien d'invitation a été créé pour ${data.email}`,
            });
        },
        onError: (error: Error) => {
            toast.error('Erreur d\'invitation', { description: error.message });
        },
    });
}

interface UpdateRoleParams {
    storeId: string;
    memberId: string;
    role: StoreMemberRole;
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId, memberId, role }: UpdateRoleParams) => {
            const { error } = await supabase
                .from('store_members')
                .update({ role })
                .eq('id', memberId)
                .eq('store_id', storeId);

            if (error) throw error;

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('store_audit_log').insert({
                    store_id: storeId,
                    tenant_id: user.id,
                    user_id: user.id,
                    action: 'member_role_updated',
                    details: { member_id: memberId, new_role: role },
                });
            }
        },
        onSuccess: (_data, { storeId }) => {
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY(storeId) });
            toast.success('Rôle mis à jour');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

interface RemoveMemberParams {
    storeId: string;
    memberId: string;
}

export function useRemoveStoreMember() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId, memberId }: RemoveMemberParams) => {
            const { error } = await supabase
                .from('store_members')
                .delete()
                .eq('id', memberId)
                .eq('store_id', storeId);

            if (error) throw error;

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('store_audit_log').insert({
                    store_id: storeId,
                    tenant_id: user.id,
                    user_id: user.id,
                    action: 'member_removed',
                    details: { member_id: memberId },
                });
            }
        },
        onSuccess: (_data, { storeId }) => {
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY(storeId) });
            toast.success('Membre retiré');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

export function useCancelInvitation() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId, invitationId }: { storeId: string; invitationId: string }) => {
            const { error } = await supabase
                .from('store_invitations')
                .delete()
                .eq('id', invitationId)
                .eq('store_id', storeId);

            if (error) throw error;
        },
        onSuccess: (_data, { storeId }) => {
            queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY(storeId) });
            toast.success('Invitation annulée');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}
