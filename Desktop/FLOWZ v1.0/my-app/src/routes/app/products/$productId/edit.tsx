import { createFileRoute } from '@tanstack/react-router';
import { ProductEditorContainer } from '@/features/products/components/ProductEditorContainer';

export const Route = createFileRoute('/app/products/$productId/edit')({
  component: ProductEditPage,
});

function ProductEditPage() {
  const { productId } = Route.useParams();
  return <ProductEditorContainer productId={productId} />;
}
