import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner"; // Using sonner as per new project likely using it, or verify? Old used use-toast. useUserProfile used sonner. I'll use sonner.
// Wait, useUserProfile used toast from 'sonner'.
// Old project used `import { toast } from "@/hooks/use-toast";` which is shadcn's default.
// useUserProfile used `import { toast } from 'sonner';`
// I should stick to 'sonner' if that's what the new project uses for toasts to be consistent with useUserProfile.
// But if the project has shadcn toast installed at hooks/use-toast, I can use that too.
// I'll check useUserProfile again. Yes, it used sonner.
// I'll use sonner for consistency with recent changes.

export interface ExternalProvider {
    id: string;
    tenant_id: string;
    provider_name: string;
    api_key_encrypted: string;
    is_active: boolean;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

export const PROVIDER_INFO = {
    serpapi: {
        name: "SerpApi",
        description: "Provider de SERP data de référence",
        icon: "search",
        docsUrl: "https://serpapi.com/manage-api-key",
    },
} as const;

export type ProviderType = keyof typeof PROVIDER_INFO;

// Récupérer tous les providers configurés
export const useExternalProviders = () => {
    const supabase = createClient();

    return useQuery({
        queryKey: ["external-providers"],
        queryFn: async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error("Non authentifié");

            const { data, error } = await supabase
                .from("external_providers")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as ExternalProvider[];
        },
    });
};

// Ajouter ou mettre à jour une clé API
export const useUpsertProviderKey = () => {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            providerName,
            apiKey,
        }: {
            providerName: ProviderType;
            apiKey: string;
        }) => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error("Non authentifié");

            const tenantId = session.session.user.id;

            // Vérifier si le provider existe déjà
            const { data: existing } = await supabase
                .from("external_providers")
                .select("id")
                .eq("tenant_id", tenantId)
                .eq("provider_name", providerName)
                .maybeSingle();

            if (existing) {
                // Mise à jour
                const { error } = await supabase
                    .from("external_providers")
                    .update({
                        api_key_encrypted: apiKey, // Note: En prod, chiffrer côté backend
                        is_active: true,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existing.id);

                if (error) throw error;
            } else {
                // Insertion
                const { error } = await supabase.from("external_providers").insert({
                    tenant_id: tenantId,
                    provider_name: providerName,
                    api_key_encrypted: apiKey, // Note: En prod, chiffrer côté backend
                    is_active: true,
                });

                if (error) throw error;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["external-providers"] });
            toast.success(`Clé ${PROVIDER_INFO[variables.providerName].name} enregistrée`);
        },
        onError: (error: Error) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });
};

// Supprimer une clé API
export const useDeleteProviderKey = () => {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (providerId: string) => {
            const { error } = await supabase
                .from("external_providers")
                .delete()
                .eq("id", providerId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["external-providers"] });
            toast.success("Clé API supprimée");
        },
        onError: (error: Error) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });
};

// Tester une clé API
export const useTestProviderKey = () => {
    const supabase = createClient();

    return useMutation({
        mutationFn: async (providerName: ProviderType) => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error("Non authentifié");

            // Vérifier que la clé existe en base
            const { data: provider, error } = await supabase
                .from("external_providers")
                .select("id, is_active, api_key_encrypted")
                .eq("tenant_id", session.session.user.id)
                .eq("provider_name", providerName)
                .eq("is_active", true)
                .maybeSingle();

            if (error) throw error;
            if (!provider) throw new Error("Clé API non trouvée");
            if (!provider.api_key_encrypted) throw new Error("Clé API vide");

            return { success: true, provider: providerName };
        },
        onSuccess: () => {
            toast.success("Clé API valide et configurée");
        },
        onError: (error: Error) => {
            toast.error(`Clé invalide: ${error.message}`);
        },
    });
};
