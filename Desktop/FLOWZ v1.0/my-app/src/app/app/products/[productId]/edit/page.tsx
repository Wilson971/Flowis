import { ProductEditorContainerV2 } from '@/features/products/components/ProductEditorContainerV2';

export default async function ProductEditPage(props: {
    params: Promise<{ productId: string }>;
}) {
    const params = await props.params;
    return <ProductEditorContainerV2 productId={params.productId} />;
}
