"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import {
  Eraser,
  Image,
  Sparkles,
  RotateCcw,
  Box,
  RefreshCw,
  CircleDot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useStudioImages,
  type StudioImage,
} from "@/features/photo-studio/hooks/useStudioImages";

// ============================================================================
// Types
// ============================================================================

export interface SessionTimelineProps {
  productId: string;
  activeImageUrl: string | null;
  onImageSelect: (image: StudioImage) => void;
  onRegenerate: (image: StudioImage) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  return `il y a ${days}j`;
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const imageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (imageDate.getTime() === today.getTime()) return "Aujourd'hui";
  if (imageDate.getTime() === yesterday.getTime()) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  remove_bg: Eraser,
  replace_bg: Image,
  replace_bg_white: Image,
  replace_bg_studio: Image,
  replace_bg_marble: Image,
  replace_bg_wood: Image,
  enhance: Sparkles,
  enhance_light: Sparkles,
  enhance_color: Sparkles,
  generate_angles: RotateCcw,
  generate_scene: Box,
  harmonize: Sparkles,
  magic_edit: Sparkles,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted-foreground",
  approved: "bg-blue-500",
  published: "bg-emerald-500",
};

// ============================================================================
// Component
// ============================================================================

export function SessionTimeline({
  productId,
  activeImageUrl,
  onImageSelect,
  onRegenerate,
}: SessionTimelineProps) {
  const { images, isLoading } = useStudioImages({ productId });

  const grouped = useMemo(() => {
    if (!images.length) return [];

    const sorted = [...images].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const groups: { label: string; images: StudioImage[] }[] = [];
    let currentLabel = "";

    for (const img of sorted) {
      const label = getDateGroup(img.created_at);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, images: [] });
      }
      groups[groups.length - 1].images.push(img);
    }

    return groups;
  }, [images]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-20 h-20 flex-shrink-0 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="flex items-center justify-center px-4 py-4">
        <p className={cn(styles.text.bodyMuted, "text-sm")}>
          Aucune generation pour ce produit
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="overflow-x-auto scrollbar-hide">
        <motion.div
          className="flex items-end gap-4 px-4 py-2"
          variants={motionTokens.variants.staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {grouped.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground px-1">
                {group.label}
              </span>
              <div className="flex items-center gap-2">
                {group.images.map((image) => {
                  const isActive = image.storage_url === activeImageUrl;
                  const ActionIcon =
                    ACTION_ICONS[image.action] ?? CircleDot;
                  const statusColor =
                    STATUS_COLORS[image.status] ?? STATUS_COLORS.draft;

                  return (
                    <motion.div
                      key={image.id}
                      variants={motionTokens.variants.staggerItem}
                      className="relative group flex-shrink-0"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onImageSelect(image)}
                            className={cn(
                              "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                              isActive
                                ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-105"
                                : "border-border/50 hover:border-primary/50 hover:shadow-md"
                            )}
                          >
                            <img
                              src={
                                image.thumbnail_url ?? image.storage_url
                              }
                              alt={image.action}
                              className="w-full h-full object-cover"
                            />

                            {/* Action icon badge */}
                            <div className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 shadow-sm">
                              <ActionIcon className="w-3 h-3 text-foreground" />
                            </div>

                            {/* Status dot */}
                            <div
                              className={cn(
                                "absolute bottom-1 left-1 w-2 h-2 rounded-full ring-1 ring-background",
                                statusColor
                              )}
                            />

                            {/* Regenerate on hover */}
                            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRegenerate(image);
                                }}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{image.action}</p>
                          <p className="text-muted-foreground">
                            {formatRelativeTime(image.created_at)}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Timestamp label */}
                      <p className="text-center text-[10px] text-muted-foreground mt-1 truncate w-20">
                        {formatRelativeTime(image.created_at)}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
