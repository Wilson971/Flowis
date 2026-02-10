"use client";

import React from 'react';
import { ArrowLeft, Upload, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudioContext } from '@/features/photo-studio/context/StudioContext';

type ActionBarProps = {
  productName: string;
  onBack?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  isDataReady?: boolean;
};

export const ActionBar = ({
  productName,
  onBack,
  onPublish,
  isPublishing = false,
  isDataReady = true,
}: ActionBarProps) => {
  const { state } = useStudioContext();
  const { selectedImageId, selectedImageType, isGenerating } = state;

  const canPublish = selectedImageType === 'generated' && selectedImageId && !isGenerating && isDataReady;

  return (
    <div className="flex items-center justify-between px-4 h-full">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{productName}</span>
          <Badge variant="secondary" className="text-xs">Studio</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isGenerating && (
          <Badge variant="outline" className="text-xs gap-1.5">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Generation en cours...
          </Badge>
        )}
        {!isDataReady && !isGenerating && (
          <Badge variant="warning" className="text-xs gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Chargement des images...
          </Badge>
        )}
        <Button
          onClick={onPublish}
          disabled={!canPublish || isPublishing}
          className={cn(
            "gap-2 transition-all duration-200",
            (canPublish && !isPublishing) && "shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
          )}
          size="sm"
        >
          {isPublishing ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Publication...</>
          ) : (
            <><Upload className="w-4 h-4" />Publier vers la Boutique</>
          )}
        </Button>
      </div>
    </div>
  );
};
