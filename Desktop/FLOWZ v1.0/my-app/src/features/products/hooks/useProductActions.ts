import { useProductSave } from "@/hooks/products/useProductSave";
import { ProductFormValues } from "./useProductForm";
import { transformFormToSaveData, AvailableCategory } from "../utils/transformFormToSaveData";

export const useProductActions = ({
    productId,
    availableCategories = [],
}: {
    productId: string;
    availableCategories?: AvailableCategory[];
}) => {
    // useProductSave avec autoSync: false — la publication vers WooCommerce est maintenant explicite (bouton "Publier")
    const { mutateAsync, isPending, isAutoSyncing, isSaving } = useProductSave({ autoSync: false });

    const handleSave = async (data: ProductFormValues) => {
        try {
            await mutateAsync({
                productId,
                data: transformFormToSaveData(data, availableCategories),
            });
        } catch (error) {
            throw error; // Re-throw to let container handle UI (toast)
        }
    };

    return {
        handleSave,
        isSaving: isSaving,
        isAutoSyncing
    };
};
