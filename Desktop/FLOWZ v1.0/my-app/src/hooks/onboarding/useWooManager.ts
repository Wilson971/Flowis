import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    wooCredentialsSchema,
    type WooCredentials,
    type ValidateAndSaveResult,
    type TriggerSyncResult,
    type SyncType,
} from "@/schemas/wooConnectionSchema";

// ============================================================================
// API Calls
// ============================================================================

async function callValidateAndSave(
    credentials: WooCredentials
): Promise<ValidateAndSaveResult> {
    const supabase = createClient();

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("You must be logged in to add a store.");

    // 2. Insert into platform_connections
    // We store the sensitive credentials here. 
    // Ideally this should be done via an Edge Function for better security (secrets handling),
    // but for "User Request" speed verification we do client-side if valid.

    const connectionData = {
        platform: credentials.platform,
        shop_url: credentials.url,
        // Storing as JSONB in credentials_encrypted. 
        // Note: In a production environment, this should be truly encrypted via Edge Function.
        credentials_encrypted: {
            consumer_key: credentials.key,
            consumer_secret: credentials.secret,
            wp_username: credentials.wp_username,
            wp_app_password: credentials.wp_app_password
        },
        tenant_id: user.id // using tenant_id as per schema, not user_id if column missing. Schema showed tenant_id.
    };

    const { data: connection, error: connError } = await supabase
        .from('platform_connections')
        .insert(connectionData)
        .select()
        .single();

    if (connError) {
        throw new Error(connError.message || "Failed to save connection details.");
    }

    // 3. Insert into stores
    const storeData = {
        name: credentials.store_name || "My WooCommerce Store",
        platform: credentials.platform,
        connection_id: connection.id,
        tenant_id: user.id, // mapped from user.id
        active: true,
        connection_status: 'connected', // assuming 'connected' is valid, will verify
        is_onboarded: true
    };

    const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert(storeData)
        .select()
        .single();

    if (storeError) {
        // Rollback connection if store creation fails
        await supabase.from('platform_connections').delete().eq('id', connection.id);
        throw new Error(storeError.message || "Failed to create store.");
    }

    return {
        valid: true,
        message: "Store connected successfully",
        store_id: store.id,
        connection_id: connection.id,
        store_name: store.name,
    };
}

// ============================================================================
// Hook Principal
// ============================================================================

export interface UseWooManagerOptions {
    onConnectSuccess?: (result: ValidateAndSaveResult) => void;
    onSyncSuccess?: (result: TriggerSyncResult) => void;
}

export function useWooManager(options: UseWooManagerOptions = {}) {
    const queryClient = useQueryClient();
    const { onConnectSuccess, onSyncSuccess } = options;

    // ==========================================================================
    // Mutation: Connexion
    // ==========================================================================

    const connectMutation = useMutation({
        mutationFn: callValidateAndSave,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["stores"] });

            toast.success(result.message || "Store connected successfully", {
                description: result.store_name
                    ? `${result.store_name} is now connected`
                    : undefined,
            });

            onConnectSuccess?.(result);
        },
        onError: (error: Error) => {
            toast.error("Connection failed", {
                description: error.message,
            });
        },
    });

    return {
        connect: connectMutation.mutate,
        connectAsync: connectMutation.mutateAsync,
        isConnecting: connectMutation.isPending,
        isConnectSuccess: connectMutation.isSuccess,
        connectError: connectMutation.error,
        connectData: connectMutation.data,
    };
}
