/**
 * useUserProfile - Hook pour la gestion du profil utilisateur
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
    id: string;
    username: string | null;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    company: string | null;
    bio: string | null;
    country: string | null;
    timezone: string | null;
    language: string | null;
    preferences: UserPreferences;
}

export interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    language?: 'fr' | 'en';
    notifications?: {
        email: boolean;
        push: boolean;
    };
}

export function useUserProfile() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const profileQuery = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Mapper les champs de la DB vers la structure UserProfile
            const profile = {
                ...data,
                preferences: {
                    theme: data.theme,
                    language: data.language,
                    notifications: data.notification_prefs
                }
            };

            return profile as UserProfile;
        }
    });

    const updateProfile = useMutation({
        mutationFn: async (updates: Partial<UserProfile>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Préparer les données pour la DB
            const dbUpdates: any = { ...updates };

            // Aplatir les préférences si elles sont présentes
            if (updates.preferences) {
                if (updates.preferences.theme) dbUpdates.theme = updates.preferences.theme;
                if (updates.preferences.language) dbUpdates.language = updates.preferences.language;
                if (updates.preferences.notifications) dbUpdates.notification_prefs = updates.preferences.notifications;

                // Supprimer l'objet imbriqué car il n'existe pas en DB
                delete dbUpdates.preferences;
            }

            const { error } = await supabase
                .from('profiles')
                .update(dbUpdates)
                .eq('id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success('Profil mis à jour');
        },
        onError: (error) => {
            toast.error('Erreur lors de la mise à jour');
            console.error('Erreur de mise à jour du profil:', error);
            if (typeof error === 'object' && error !== null && 'message' in error) {
                console.error('Détails:', (error as any).message);
            }
        }
    });

    const updateAvatar = useMutation({
        mutationFn: async (file: File) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            return publicUrl;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success('Avatar mis à jour');
        },
        onError: (error) => {
            toast.error("Erreur lors de l'upload de l'avatar");
            console.error(error);
        }
    });

    return {
        profile: profileQuery.data,
        isLoading: profileQuery.isLoading,
        updateProfile,
        updateAvatar
    };
}
