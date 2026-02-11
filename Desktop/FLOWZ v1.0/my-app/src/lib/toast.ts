import { toast } from "sonner";

/**
 * Toast Wrapper Functions
 *
 * Standardized toast notifications with consistent styling.
 * Use these instead of calling toast() directly for consistency.
 *
 * @example
 * showSuccess("Article publié avec succès");
 * showError("Erreur de synchronisation", "Vérifiez votre connexion");
 * const id = showLoading("Génération en cours...");
 * showAIComplete("Contenu généré", "1 250 mots en 12s");
 */

export const showSuccess = (message: string, description?: string) => {
    return toast.success(message, { description });
};

export const showError = (message: string, description?: string) => {
    return toast.error(message, { description });
};

export const showWarning = (message: string, description?: string) => {
    return toast.warning(message, { description });
};

export const showInfo = (message: string, description?: string) => {
    return toast.info(message, { description });
};

export const showLoading = (message: string) => {
    return toast.loading(message);
};

export const showAIComplete = (message: string, description?: string) => {
    return toast.success(message, {
        description,
        icon: "✨",
        duration: 5000,
    });
};

export const dismissToast = (id: string | number) => {
    toast.dismiss(id);
};
