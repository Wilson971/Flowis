/**
 * Products Selection Bar Component
 *
 * Bar shown when products are selected with bulk actions
 */

import { Sparkles, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProductsSelectionBarProps = {
  selectedCount: number;
  onDeselect?: () => void;
  onGenerate?: () => void;
  onSync?: () => void;
  isGenerating?: boolean;
  className?: string;
};

export const ProductsSelectionBar = ({
  selectedCount,
  onDeselect,
  onGenerate,
  onSync,
  isGenerating = false,
  className,
}: ProductsSelectionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border border-border rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="bg-white/10 dark:bg-black/10 text-inherit text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/10 dark:border-black/10">
          {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
        </span>
        {onDeselect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselect}
            className="h-8 px-3 text-[11px] font-semibold text-white/70 dark:text-zinc-600 hover:text-white dark:hover:text-zinc-900 hover:bg-white/10 dark:hover:bg-black/5"
          >
            <X className="h-3 w-3 mr-1.5" />
            Tout désélectionner
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap text-white dark:text-zinc-900">
        {onGenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="h-8 text-[11px] font-bold bg-white text-zinc-900 border-white hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:border-zinc-900 dark:hover:bg-zinc-800"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1.5" />
                Générer avec l'IA
              </>
            )}
          </Button>
        )}
        {onSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            className="h-8 text-[11px] font-bold bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300 dark:hover:bg-zinc-300"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Synchroniser
          </Button>
        )}
      </div>
    </div>
  );
};
