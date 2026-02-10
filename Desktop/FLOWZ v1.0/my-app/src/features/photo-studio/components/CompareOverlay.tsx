"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CompareOverlayProps = {
  sourceUrl: string;
  generatedUrl: string;
  sourceName?: string;
  generatedName?: string;
  className?: string;
  transitionType?: 'cut' | 'fade';
};

export const CompareOverlay = ({
  sourceUrl,
  generatedUrl,
  sourceName = 'Source',
  generatedName = 'Genere',
  className,
  transitionType = 'cut',
}: CompareOverlayProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsPressed(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handlePointerUp = useCallback(() => { setIsPressed(false); }, []);
  const handlePointerLeave = useCallback(() => { setIsPressed(false); }, []);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const currentImageUrl = isPressed ? sourceUrl : generatedUrl;
  const currentImageName = isPressed ? sourceName : generatedName;
  const isShowingSource = isPressed;

  return (
    <div
      className={cn("relative", className)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative">
        <img
          src={currentImageUrl}
          alt={currentImageName}
          className={cn("max-w-full max-h-full object-contain", transitionType === 'fade' && "transition-opacity duration-100")}
          style={{ opacity: transitionType === 'cut' ? 1 : undefined, maxWidth: '700px', maxHeight: '700px' }}
          draggable={false}
        />
        {isHovering && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isPressed ? "default" : "secondary"}
                    size="sm"
                    className={cn("gap-2 shadow-xl border", !isPressed && "bg-background/95 hover:bg-background text-foreground")}
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e); }}
                  >
                    <Eye className={cn("w-4 h-4", isPressed && "animate-pulse")} />
                    {isPressed ? "Relachez" : "Comparer"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">Maintenez pour voir l'image originale</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <div className={cn(
          "absolute bottom-3 left-1/2 -translate-x-1/2",
          "px-3 py-1.5 rounded-full text-xs font-medium",
          "flex items-center gap-2 transition-all duration-200",
          "shadow-lg",
          isShowingSource
            ? "bg-background text-foreground border border-border"
            : "bg-success text-success-foreground border border-success/30"
        )}>
          {isShowingSource ? (
            <><ImageIcon className="w-3.5 h-3.5" /><span>{sourceName}</span></>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /><span>{generatedName}</span></>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareOverlay;
