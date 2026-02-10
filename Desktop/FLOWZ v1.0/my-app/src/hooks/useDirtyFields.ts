export function useDirtyFields(productId: string) {
    return {
        data: {
            hasDraftContent: false,
            dirtyCount: 0,
        },
        isLoading: false,
    };
}
