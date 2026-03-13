'use client'

import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { StudioEditorProvider, useStudioEditor } from '../../context/StudioEditorContext'
import { EditorHeader } from './EditorHeader'
import { EditorLayout } from './EditorLayout'

function EditorContent() {
  const { state, dispatch } = useStudioEditor()
  const supabase = createClient()

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', state.productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', state.productId)
        .single()
      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <EditorHeader
        productName={product?.title ?? 'Produit'}
        mode={state.mode}
        onModeChange={(mode) => dispatch({ type: 'SET_MODE', mode })}
        onPublish={() => {/* TODO */}}
      />
      <EditorLayout
        sidebar={<div className="p-4 text-sm text-muted-foreground">Sidebar placeholder</div>}
        canvas={<div className="flex items-center justify-center h-full text-muted-foreground">Canvas placeholder</div>}
        adjustmentsPanel={<div className="p-4 text-sm text-muted-foreground">Adjustments placeholder</div>}
        footer={<div className="flex items-center justify-center h-full text-muted-foreground">Footer placeholder</div>}
        showAdjustments={state.showAdjustmentsPanel}
      />
    </>
  )
}

export function StudioEditorPageClient({ productId }: { productId: string }) {
  return (
    <StudioEditorProvider productId={productId}>
      <EditorContent />
    </StudioEditorProvider>
  )
}
