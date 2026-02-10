/**
 * useScheduleStoreDeletion - Hook pour planifier la suppression d'une boutique
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ScheduleDeletionParams } from '@/types/store';

const DELETION_GRACE_PERIOD_DAYS = 7;

export function useScheduleStoreDeletion() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId, confirmation }: ScheduleDeletionParams) => {
            if (confirmation !== 'SUPPRIMER') {
                throw new Error('Confirmation invalide. Tapez SUPPRIMER pour confirmer.');
            }

            // Try edge function first
            try {
                const { data, error } = await supabase.functions.invoke('schedule-store-deletion', {
                    body: { store_id: storeId },
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error || 'Failed to schedule deletion');

                return data;
            } catch {
                // Fallback: Schedule deletion directly
                const now = new Date();
                const deletionDate = new Date(now.getTime() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

                const { error } = await supabase
                    .from('stores')
                    .update({
                        status: 'pending_deletion',
                        active: false,
                        deletion_scheduled_at: now.toISOString(),
                        deletion_execute_at: deletionDate.toISOString(),
                        updated_at: now.toISOString(),
                    })
                    .eq('id', storeId);

                if (error) throw error;

                return {
                    success: true,
                    deletion_execute_at: deletionDate.toISOString(),
                };
            }
        },
        onSuccess: (data) => {
            const deletionDate = new Date(data.deletion_execute_at);
            const formattedDate = format(deletionDate, "d MMMM 'à' HH:mm", { locale: fr });

            toast.success('Suppression planifiée', {
                description: `La boutique sera supprimée le ${formattedDate}`,
            });
            queryClient.invalidateQueries({ queryKey: ['stores'] });
        },
        onError: (error: Error) => {
            toast.error('Erreur de planification', {
                description: error.message || 'Impossible de planifier la suppression',
            });
        },
    });
}
