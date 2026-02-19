export function useProductSerpStatus(productId: string) {
    return {
        data: {
            isPending: false,
            progress: { current: 0, total: 0 },
        },
    };
}

export function useSerpAnalysisByProduct(productId: string) {
    return {
        data: null,
    };
}
