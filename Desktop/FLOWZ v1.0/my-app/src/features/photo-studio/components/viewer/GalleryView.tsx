"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudioImage } from "../../hooks/useStudioImages";

// ============================================================================
// Types
// ============================================================================

interface GalleryViewProps {
  images: StudioImage[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onImageClick: (image: StudioImage) => void;
}

// ============================================================================
// Helpers
// ============================================================================

const statusColors: Record<StudioImage["status"], string> = {
  draft: "bg-muted-foreground",
  approved: "bg-emerald-500",
  published: "bg-primary",
};

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Component
// ============================================================================

export function GalleryView({
  images,
  isLoading,
  selectedIds,
  onSelectionChange,
  onImageClick,
}: GalleryViewProps) {
  function toggleSelection(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className={cn(styles.text.bodyMuted)}>No images found.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Image Grid */}
      <motion.div
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        {images.map((image) => {
          const isSelected = selectedIds.has(image.id);

          return (
            <motion.div
              key={image.id}
              variants={motionTokens.variants.staggerItem}
              className={cn(
                styles.card.interactive,
                "group relative overflow-hidden rounded-xl cursor-pointer",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => onImageClick(image)}
            >
              {/* Checkbox Overlay */}
              <div
                className={cn(
                  "absolute top-2 left-2 z-10 transition-opacity",
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(image.id)}
                  className="h-5 w-5 border-2 border-background bg-background/80 backdrop-blur-sm"
                />
              </div>

              {/* Image */}
              <div className="aspect-square overflow-hidden">
                <Image
                  src={image.thumbnail_url ?? image.storage_url}
                  alt={`${image.action} result`}
                  width={300}
                  height={300}
                  className={cn(
                    "h-full w-full object-cover transition-transform",
                    "group-hover:scale-105"
                  )}
                  style={{ transitionDuration: `${motionTokens.durations.normal * 1000}ms` }}
                />
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {formatAction(image.action)}
                  </Badge>
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0",
                      statusColors[image.status]
                    )}
                    title={image.status}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Floating Selection Bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={motionTokens.transitions.fast}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-30",
            "flex items-center gap-3 px-4 py-2 rounded-xl",
            "bg-card/90 backdrop-blur-xl border border-border shadow-lg"
          )}
        >
          <span className={cn(styles.text.label)}>
            {selectedIds.size} selected
          </span>
        </motion.div>
      )}
    </div>
  );
}
