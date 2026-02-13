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
    // useProductSave avec autoSync: true pour synchroniser automatiquement vers WooCommerce
    const { mutateAsync, isPending, isAutoSyncing, isSaving } = useProductSave({ autoSync: true });

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
