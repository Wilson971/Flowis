import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner"; // Using sonner

export interface GscConnection {
    id: string;
    tenant_id: string;
    email: string | null;
    is_active: boolean;
    token_expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface GscConnectionStatus {
    connected: boolean;
    email?: string;
    expires_at?: string;
    created_at?: string;
}

/**
 * Hook pour récupérer le statut de la connexion GSC
 */
export const useGscConnection = () => {
    const supabase = createClient();

    return useQuery({
        queryKey: ["gsc-connection"],
        queryFn: async (): Promise<GscConnectionStatus | null> => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error("Non authentifié");

            try {
                const { data, error } = await supabase.functions.invoke("gsc-auth", {
                    body: { path: "/status" },
                    headers: {
                        Authorization: `Bearer ${session.session.access_token}`,
                    },
                });

                if (error) {
                    console.error("GSC auth error:", error);
                    if (
                        error.message?.includes("not found") ||
                        error.message?.includes("404") ||
                        error.message?.includes("Failed to send") ||
                        error.message?.includes("Function not found")
                    ) {
                        throw new Error(
                            "L'Edge Function gsc-auth n'est pas déployée."
                        );
                    }
                    throw new Error(error.message || "Erreur lors de l'appel à l'Edge Function");
                }

                if (!data || (typeof data === 'object' && 'connected' in data && !data.connected)) {
                    return { connected: false };
                }

                return data as GscConnectionStatus;
            } catch (error: any) {
                console.error("GSC connection error:", error);
                if (error instanceof TypeError && error.message.includes("fetch")) {
                    throw new Error("Impossible de se connecter au serveur.");
                }
                if (error?.message) {
                    throw error;
                }
                throw new Error("Erreur lors de la récupération du statut GSC");
            }
        },
    });
};

/**
 * Hook pour démarrer l'authentification OAuth GSC
 */
export const useGscStartAuth = () => {
    const supabase = createClient();

    return useMutation({
        mutationFn: async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error("Non authentifié");

            try {
                const { data, error } = await supabase.functions.invoke("gsc-auth", {
                    body: { path: "/start" },
                    headers: {
                        Authorization: `Bearer ${session.session.access_token}`,
                    },
                });

                if (error) {
                    console.error("GSC start auth error:", error);
                    if (
                        error.message?.includes("not found") ||
                        error.message?.includes("404")
                    ) {
                        throw new Error("L'Edge Function gsc-auth n'est pas déployée.");
                    }
                    throw new Error(error.message || "Erreur lors de l'appel à l'Edge Function");
                }

                const authUrl = (data as any)?.authUrl;

                if (!authUrl) {
                    throw new Error("URL d'authentification manquante dans la réponse");
                }

                // Rediriger vers l'URL OAuth
                window.location.href = authUrl;
            } catch (error: any) {
                console.error("GSC start auth exception:", error);
                throw error;
            }
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};

/**
 * Hook pour rafraîchir les tokens GSC
 */
export const useGscRefresh = () => {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error("Non authentifié");

            try {
                const { data, error } = await supabase.functions.invoke("gsc-auth", {
                    body: { path: "/refresh" },
                    headers: {
                        Authorization: `Bearer ${session.session.access_token}`,
                    },
                });

                if (error) throw error;
                return data;
            } catch (error: any) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gsc-connection"] });
            toast.success("Tokens rafraîchis");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};

/**
 * Hook pour déconnecter le compte GSC
 */
export const useGscDisconnect = () => {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async () => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error("Non authentifié");

            try {
                const { data, error } = await supabase.functions.invoke("gsc-auth", {
                    body: { path: "/disconnect" },
                    headers: {
                        Authorization: `Bearer ${session.session.access_token}`,
                    },
                });

                if (error) throw error;
                return data;
            } catch (error: any) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gsc-connection"] });
            queryClient.invalidateQueries({ queryKey: ["gsc-sites"] });
            toast.success("Compte GSC déconnecté");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};

/**
 * Hook combiné pour toutes les opérations GSC
 */
export const useGscAuth = () => {
    const connection = useGscConnection();
    const startAuth = useGscStartAuth();
    const refresh = useGscRefresh();
    const disconnect = useGscDisconnect();

    return {
        connection,
        startAuth,
        refresh,
        disconnect,
        isLoading: connection.isLoading || startAuth.isPending || refresh.isPending || disconnect.isPending,
    };
};
