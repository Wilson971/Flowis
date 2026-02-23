import { useMutation } from '@tanstack/react-query';

export function useCancelSync() {
    return useMutation({
        mutationFn: async ({ product_ids }: { product_ids: string[] }) => {


            return { success: true };
        },
    });
}
