"use client";

import React, { useEffect, useMemo } from 'react';
import { Dialog, DialogContentFullscreen } from '@/components/ui/dialog';
import { SceneStudioLayout } from './SceneStudioLayout';
import { StudioContextProvider, useStudioContext } from '@/features/photo-studio/context/StudioContext';
import { usePublishGenerationSession, useGenerationSessions } from '@/features/photo-studio/hooks/useGenerationSessions';
import { useSaveGeneratedImage } from '@/features/photo-studio/hooks/useSaveGeneratedImage';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { SourceImageItem } from './modals';

export type StudioProduct = {
  id: string;
  name: string;
  images?: Array<{ id?: string; src: string; alt?: string }>;
};

type SceneStudioDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: StudioProduct | null;
  onSaveImage?: (imageUrl: string, productId: string) => void;
};

// Inner component that uses the context
const SceneStudioDialogInner = ({
  open,
  onOpenChange,
  product,
  onSaveImage,
}: SceneStudioDialogProps) => {
  const queryClient = useQueryClient();
  const {
    state,
    setCurrentProduct,
    setSelectedImage,
    updateSessionImage,
    closeStudio,
  } = useStudioContext();

  const { selectedImageId, selectedImageType, sessionImages } = state;

  const publishSession = usePublishGenerationSession();
  const saveImage = useSaveGeneratedImage();
  const { data: dbSessions = [], isLoading: isSessionsLoading, isFetched: isSessionsFetched } = useGenerationSessions(product?.id || '');

  const [isPublishing, setIsPublishing] = React.useState(false);
  const isDataReady = !isSessionsLoading && isSessionsFetched;

  const prevOpenRef = React.useRef(open);
  const prevProductIdRef = React.useRef(product?.id);

  const handleCloseCleanup = (isOpen: boolean) => {
    if (!isOpen) {
      closeStudio();
    }
    onOpenChange(isOpen);
  };

  useEffect(() => {
    const isNewOpen = open && !prevOpenRef.current;
    const isNewProduct = product?.id !== prevProductIdRef.current;
    prevOpenRef.current = open;
    prevProductIdRef.current = product?.id;

    if (open && product && (isNewOpen || isNewProduct)) {
      setCurrentProduct(product.id);
      setSelectedImage(null, null);
    }
  }, [open, product?.id, setCurrentProduct, setSelectedImage]);

  const handlePublish = async () => {
    if (!product || !selectedImageId || selectedImageType !== 'generated') {
      toast.error('Selection requise', { description: 'Veuillez selectionner une image generee' });
      return;
    }

    setIsPublishing(true);

    try {
      const dbSession = dbSessions.find(s => s.id === selectedImageId);
      const storeImage = sessionImages.find(img => img.id === selectedImageId);

      let imageUrl = dbSession?.generated_image_url || storeImage?.url;
      const sessionId = dbSession?.id || storeImage?.sessionId || selectedImageId;

      if (!imageUrl) {
        throw new Error('Image introuvable. Veuillez regenerer.');
      }

      toast.info('Publication en cours...', { description: "Traitement et upload de l'image..." });

      // If base64, upload to storage first
      if (imageUrl.startsWith('data:')) {
        try {
          const fetchResponse = await fetch(imageUrl);
          const blob = await fetchResponse.blob();
          const extension = blob.type.split('/')[1] || 'png';
          const fileName = `${product.id}/studio-ai-${Date.now()}.${extension}`;

          const supabase = createClient();
          const { error: uploadError } = await supabase.storage
            .from('studio-images')
            .upload(fileName, blob, { contentType: blob.type, upsert: false });

          if (uploadError) {
            throw new Error(uploadError.message || "Echec de l'upload vers le storage.");
          }

          const { data: { publicUrl } } = supabase.storage
            .from('studio-images')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        } catch (uploadErr: any) {
          if (uploadErr instanceof Error) throw uploadErr;
          throw new Error(uploadErr?.message || "Echec de l'upload de l'image generee vers le cloud.");
        }
      }

      toast.info('Ajout a la galerie...', { description: 'Mise a jour du produit...' });

      // Save image to product catalog
      if (onSaveImage) {
        await onSaveImage(imageUrl, product.id);
      } else {
        try {
          await saveImage.mutateAsync({
            imageBase64: imageUrl,
            productId: product.id,
          });
        } catch (saveErr: any) {
          throw new Error(saveErr?.message || "Echec de la sauvegarde de l'image.");
        }
      }

      // Mark session as published
      try {
        await publishSession.mutateAsync({ sessionId, productId: product.id });
      } catch (publishError: any) {
        console.warn('Could not mark session as published:', publishError?.message || publishError);
      }

      updateSessionImage(selectedImageId, { status: 'published' });
      toast.success('Image publiee !', { description: "L'image a ete ajoutee a la galerie du produit" });

      if (product?.id) {
        await queryClient.invalidateQueries({ queryKey: ["generation-sessions", product.id] });
      }
    } catch (error: any) {
      toast.error('Erreur de publication', { description: error.message || "Impossible de publier l'image" });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBack = () => {
    closeStudio();
    onOpenChange(false);
  };

  const sourceImages: SourceImageItem[] = useMemo(() => {
    if (!product?.images) return [];
    return product.images.map((img, index) => ({
      id: img.id || `img-${index}`,
      src: img.src,
      alt: img.alt || `Image ${index + 1}`,
      isPrimary: index === 0,
    }));
  }, [product?.images]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleCloseCleanup}>
      <DialogContentFullscreen
        className="overflow-hidden p-0"
        ariaTitle="AI Scene Studio"
        ariaDescription={`Studio de generation d'images pour ${product.name}`}
      >
        <SceneStudioLayout
          productId={product.id}
          productName={product.name}
          sourceImages={sourceImages}
          onBack={handleBack}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          isDataReady={isDataReady}
          isLoadingOverlayVisible={!isDataReady}
        />
      </DialogContentFullscreen>
    </Dialog>
  );
};

// Outer component that wraps with StudioContextProvider
export const SceneStudioDialog = (props: SceneStudioDialogProps) => {
  if (!props.open) return null;
  return (
    <StudioContextProvider>
      <SceneStudioDialogInner {...props} />
    </StudioContextProvider>
  );
};
