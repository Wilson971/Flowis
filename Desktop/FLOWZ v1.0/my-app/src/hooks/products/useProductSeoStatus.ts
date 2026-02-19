export function useProductSeoStatus(productId: string) {
    return {
        data: {
            isPending: false,
            progress: { current: 0, total: 0 },
        },
    };
}
