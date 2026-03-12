import { ProductEditorContainer } from '@/features/products/components/ProductEditorContainer';

export default async function ProductEditPage(props: {
    params: Promise<{ productId: string }>;
}) {
    const params = await props.params;
    return <ProductEditorContainer productId={params.productId} />;
}
