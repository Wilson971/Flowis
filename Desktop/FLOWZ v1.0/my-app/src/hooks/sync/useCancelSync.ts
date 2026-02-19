import { useMutation } from '@tanstack/react-query';

export function useCancelSync() {
    return useMutation({
        mutationFn: async ({ product_ids }: { product_ids: string[] }) => {
            console.log('Cancel sync for', product_ids);
            return { success: true };
        },
    });
}
