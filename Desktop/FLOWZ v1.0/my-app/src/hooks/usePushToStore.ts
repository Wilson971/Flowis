import { useMutation } from '@tanstack/react-query';

export function usePushToStore() {
    return useMutation({
        mutationFn: async ({ product_ids }: { product_ids: string[] }) => {
            console.log('Push to store', product_ids);
            return { success: true };
        },
    });
}
