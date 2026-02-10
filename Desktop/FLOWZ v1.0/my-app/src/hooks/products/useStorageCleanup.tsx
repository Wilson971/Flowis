import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

interface CleanupResult {
    user_id: string | null;
    deleted_by_retention: number;
    deleted_by_limit: number;
    storage_files_deleted: number;
    storage_paths: string[];
    errors: string[];
}

interface CleanupResponse {
    success: boolean;
    message: string;
    totals: {
        deleted_by_retention: number;
        deleted_by_limit: number;
        storage_files_deleted: number;
        total_users_processed: number;
    };
    results: CleanupResult[];
    errors: string[];
    execution_time_ms: number;
}

/**
 * Hook pour déclencher le cleanup manuel des images studio
 */
export const useStorageCleanup = () => {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (options?: { dryRun?: boolean }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/cleanup-studio-storage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    trigger: "manual",
                    dryRun: options?.dryRun || false,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erreur lors du cleanup");
            }

            const data: CleanupResponse = await response.json();
            return data;
        },
        onSuccess: (data) => {
            const total = data.totals.deleted_by_retention + data.totals.deleted_by_limit;
            const filesDeleted = data.totals.storage_files_deleted;

            if (total === 0 && filesDeleted === 0) {
                toast.info("Aucun fichier à nettoyer", {
                    description: "Tous vos fichiers sont à jour."
                });
            } else {
                // Using sonner syntax if possible, or plain text if components not supported in title/desc easily without custom component
                // Sonner supports JSX in description usually, or as the main message.
                // Simplified for reliability:
                toast.success("Nettoyage terminé", {
                    description: `${total} entrées supprimées, ${filesDeleted} fichiers supprimés du stockage.`
                });
            }

            // Invalider les queries pour rafraîchir les données
            queryClient.invalidateQueries({ queryKey: ["studio-generated-assets"] });
            queryClient.invalidateQueries({ queryKey: ["generation-sessions"] });
        },
        onError: (error: any) => {
            toast.error("Erreur de nettoyage", {
                description: error.message || "Une erreur est survenue lors du nettoyage"
            });
        },
    });
};

/**
 * Hook pour récupérer les statistiques de stockage
 */
export const useStorageStats = (productId?: string) => {
    const supabase = createClient();

    return useQuery({
        queryKey: ["storage-stats", productId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");

            let query = supabase
                .from("studio_generated_assets")
                .select("id, status, created_at, image_url")
                .eq("user_id", user.id);

            if (productId) {
                query = query.eq("product_id", productId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("❌ [useStorageCleanup] Error:", error);
                throw error;
            }

            const now = new Date();
            const stats = {
                total: data?.length || 0,
                published: data?.filter((a) => a.status === "added_to_catalog").length || 0,
                unpublished: data?.filter((a) => a.status === "generated").length || 0,
                deleted: data?.filter((a) => a.status === "deleted").length || 0,
                generating: data?.filter((a) => a.status === "generating").length || 0,
                old_unpublished: data?.filter((a) => {
                    if (a.status !== "generated") return false;
                    const created = new Date(a.created_at);
                    const daysOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                    return daysOld > 7;
                }).length || 0,
            };

            return stats;
        },
        enabled: true,
        staleTime: 30 * 1000, // 30 secondes
    });
};
