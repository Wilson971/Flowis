import { ProductEditorContainer } from '@/features/products/components/ProductEditorContainer';
import { ProductEditorContainerV2 } from '@/features/products/components/ProductEditorContainerV2';

export default async function ProductEditPage(props: {
    params: Promise<{ productId: string }>;
    searchParams: Promise<{ v?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const useV1 = searchParams.v === "1";
    const Container = useV1 ? ProductEditorContainer : ProductEditorContainerV2;
    return <Container productId={params.productId} />;
}
