"use client";

/**
 * StudioFilterBar
 *
 * Photo Studio-specific filter bar matching ProductsFilter patterns.
 * Provides status, platform, and image count filters.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Layers,
  CheckCircle2,
  X,
  ImageIcon,
  Loader2,
  XCircle,
  CircleDashed,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudioStatusFilter =
  | "all"
  | "done"
  | "running"
  | "failed"
  | "none";

export type PlatformFilter = "all" | "woocommerce" | "shopify";

export type ImageCountFilter = "all" | "no_image" | "1_5" | "6_plus";

interface StudioFilterBarProps {
  statusFilter: StudioStatusFilter;
  platformFilter: PlatformFilter;
  imageCountFilter: ImageCountFilter;
  onStatusChange: (value: StudioStatusFilter) => void;
  onPlatformChange: (value: PlatformFilter) => void;
  onImageCountChange: (value: ImageCountFilter) => void;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: Array<{
  value: StudioStatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dotColor?: string;
}> = [
  { value: "all", label: "Tous", icon: Layers },
  {
    value: "done",
    label: "Traite",
    icon: CheckCircle2,
    dotColor: "text-success",
  },
  {
    value: "running",
    label: "En cours",
    icon: Loader2,
    dotColor: "text-info",
  },
  {
    value: "failed",
    label: "Erreur",
    icon: XCircle,
    dotColor: "text-destructive",
  },
  {
    value: "none",
    label: "Non traite",
    icon: CircleDashed,
    dotColor: "text-muted-foreground",
  },
];

const PLATFORM_OPTIONS: Array<{ value: PlatformFilter; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "shopify", label: "Shopify" },
];

const IMAGE_COUNT_OPTIONS: Array<{
  value: ImageCountFilter;
  label: string;
}> = [
  { value: "all", label: "Toutes" },
  { value: "no_image", label: "Sans image" },
  { value: "1_5", label: "1-5 images" },
  { value: "6_plus", label: "6+ images" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioFilterBar({
  statusFilter,
  platformFilter,
  imageCountFilter,
  onStatusChange,
  onPlatformChange,
  onImageCountChange,
  onReset,
}: StudioFilterBarProps) {
  const activeFiltersCount =
    (statusFilter !== "all" ? 1 : 0) +
    (platformFilter !== "all" ? 1 : 0) +
    (imageCountFilter !== "all" ? 1 : 0);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {/* Status toggle */}
      <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5",
              statusFilter === option.value
                ? "bg-background text-foreground border border-border shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {statusFilter === option.value && option.dotColor && (
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-current",
                  option.dotColor
                )}
              />
            )}
            {option.label}
          </button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Platform popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 border-dashed text-xs",
              platformFilter !== "all" &&
                "bg-primary/5 border-primary/50 text-primary border-solid"
            )}
          >
            <Store className="mr-2 h-3.5 w-3.5" />
            Plateforme
            {platformFilter !== "all" && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-2 h-4"
                />
                <span className="font-bold">
                  {
                    PLATFORM_OPTIONS.find(
                      (p) => p.value === platformFilter
                    )?.label
                  }
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-2">
            {PLATFORM_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => onPlatformChange(option.value)}
                className={cn(
                  "flex items-center px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-muted",
                  platformFilter === option.value &&
                    "bg-muted font-medium"
                )}
              >
                {platformFilter === option.value && (
                  <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />
                )}
                <span
                  className={cn(
                    platformFilter !== option.value && "ml-5"
                  )}
                >
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Image count popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 border-dashed text-xs",
              imageCountFilter !== "all" &&
                "bg-primary/5 border-primary/50 text-primary border-solid"
            )}
          >
            <ImageIcon className="mr-2 h-3.5 w-3.5" />
            Images
            {imageCountFilter !== "all" && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-2 h-4"
                />
                <span className="font-bold">
                  {
                    IMAGE_COUNT_OPTIONS.find(
                      (i) => i.value === imageCountFilter
                    )?.label
                  }
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-2">
            {IMAGE_COUNT_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => onImageCountChange(option.value)}
                className={cn(
                  "flex items-center px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-muted",
                  imageCountFilter === option.value &&
                    "bg-muted font-medium"
                )}
              >
                {imageCountFilter === option.value && (
                  <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />
                )}
                <span
                  className={cn(
                    imageCountFilter !== option.value && "ml-5"
                  )}
                >
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Reset */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
          <Badge variant="secondary" size="sm" className="ml-1.5">
            {activeFiltersCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
