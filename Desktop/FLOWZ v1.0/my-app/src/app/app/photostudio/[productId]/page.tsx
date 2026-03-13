import { StudioEditorPageClient } from '@/features/photo-studio/components/editor/StudioEditorPage'

interface Props {
  params: Promise<{ productId: string }>
}

export default async function PhotoStudioEditorPage({ params }: Props) {
  const { productId } = await params
  return <StudioEditorPageClient productId={productId} />
}
