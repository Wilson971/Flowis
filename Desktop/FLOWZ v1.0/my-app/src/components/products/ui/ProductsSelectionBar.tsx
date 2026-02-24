/**
 * Products Selection Bar Component
 *
 * Bar shown when products are selected with bulk actions
 */

import { Sparkles, RefreshCw, X, ChevronDown, Check, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShellAurora } from "@/components/layout/AuroraBackground";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type ProductsSelectionBarProps = {
  selectedCount: number;
  onDeselect?: () => void;
  onGenerate?: () => void;
  onSync?: () => void;
  isGenerating?: boolean;
  pendingApprovalsCount?: number;
  syncableProductsCount?: number;
  onApproveAll?: () => void;
  onRejectAll?: () => void;
  onCancelSync?: () => void;
  onOpenBulkApproval?: () => void;
  isProcessingBulkAction?: boolean;
  isHidden?: boolean;
  className?: string;
};

export const ProductsSelectionBar = ({
  selectedCount,
  onDeselect,
  onGenerate,
  onSync,
  isGenerating = false,
  pendingApprovalsCount = 0,
  syncableProductsCount = 0,
  onApproveAll,
  onRejectAll,
  onCancelSync,
  onOpenBulkApproval,
  isProcessingBulkAction = false,
  isHidden = false,
  className,
}: ProductsSelectionBarProps) => {
  const [mounted, setMounted] = useState(false);
  const [cardBounds, setCardBounds] = useState<{ left: number | string; width: number | string }>({ left: 0, width: "100%" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || selectedCount === 0 || isHidden) return;

    const el = document.getElementById("main-content");
    if (!el) return;

    const updateBounds = () => {
      const rect = el.getBoundingClientRect();
      setCardBounds({ left: rect.left, width: `${rect.width}px` });
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);

    // Use ResizeObserver for sidebar toggle adjustments
    const observer = new ResizeObserver(updateBounds);
    observer.observe(el);

    return () => {
      window.removeEventListener("resize", updateBounds);
      observer.disconnect();
    };
  }, [mounted, selectedCount, isHidden]);

  if (!mounted || selectedCount === 0) return null;

  const content = (
    <AnimatePresence>
      {selectedCount > 0 && !isHidden && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            type: "spring", stiffness: 350, damping: 25,
            opacity: { duration: 0.2 }
          }}
          style={{
            position: "fixed",
            bottom: 0,
            left: cardBounds.left,
            width: cardBounds.width,
            transform: "none",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
          }}
          className="pointer-events-none"
        >
          <div className="pointer-events-auto flex justify-center w-full max-w-[820px] px-0 sm:px-3">
            <div className={cn(
              "relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 p-3 px-4 sm:px-5 bg-zinc-950/95 backdrop-blur-2xl text-white border-none rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none shadow-[0_-8px_30px_rgb(0,0,0,0.3)] w-full",
              className
            )}>
              {/* Basic Background Border */}
              <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none z-0" />

              {/* Animated Floating Glow Border */}
              <motion.div
                className="absolute inset-0 pointer-events-none border-[1.5px] border-white/40 rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none z-[5]"
                animate={{
                  opacity: [0.1, 1, 0.1],
                  boxShadow: [
                    "0 0 0 rgba(255,255,255,0), inset 0 0 0 rgba(255,255,255,0)",
                    "0 0 12px rgba(255,255,255,0.2), inset 0 0 12px rgba(255,255,255,0.1)",
                    "0 0 0 rgba(255,255,255,0), inset 0 0 0 rgba(255,255,255,0)"
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Aurora background effects with a subtle pulse */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShellAurora position="top" opacity={0.4} />
                <ShellAurora position="middle" opacity={0.3} />
                <ShellAurora position="bottom" opacity={0.4} />
              </motion.div>

              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <span className="bg-white/10 dark:bg-black/10 text-inherit text-xs font-bold px-3 py-1 rounded-full border border-white/10 dark:border-black/5 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
                </span>
                {onDeselect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeselect}
                    className="h-8 px-3 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Désélectionner
                  </Button>
                )}
              </div>

              <div className="relative z-10 flex items-center justify-end gap-2 text-white w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/10 sm:border-none">
                {onGenerate && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="h-9 px-4 text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-200 rounded-xl shadow-sm transition-all flex-1 sm:flex-none"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                        Assistant IA
                      </>
                    )}
                  </Button>
                )}

                {(pendingApprovalsCount > 0 || syncableProductsCount > 0) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessingBulkAction}
                        className="h-9 px-4 text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border-transparent rounded-xl transition-all"
                      >
                        Actions
                        <Badge className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-white text-zinc-900 border-0">
                          {pendingApprovalsCount + syncableProductsCount}
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56 z-[10000] rounded-xl relative -top-2">
                      {pendingApprovalsCount > 0 && (
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                            Approbation
                          </DropdownMenuLabel>
                          {onOpenBulkApproval && (
                            <DropdownMenuItem onClick={onOpenBulkApproval} disabled={isProcessingBulkAction} className="rounded-lg gap-2 cursor-pointer">
                              <Check className="h-4 w-4 text-success" />
                              <span className="text-xs font-medium">Approbation en masse...</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={onApproveAll} disabled={isProcessingBulkAction} className="rounded-lg gap-2 cursor-pointer">
                            <Check className="h-4 w-4 text-success" />
                            <span className="text-xs font-medium">Approuver tout</span>
                            <Badge className="ml-auto h-5 px-1.5 text-[10px] bg-success/10 text-success border-0">{pendingApprovalsCount}</Badge>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={onRejectAll} disabled={isProcessingBulkAction} className="rounded-lg gap-2 cursor-pointer">
                            <X className="h-4 w-4 text-destructive" />
                            <span className="text-xs font-medium">Rejeter tout</span>
                            <Badge className="ml-auto h-5 px-1.5 text-[10px] bg-destructive/10 text-destructive border-0">{pendingApprovalsCount}</Badge>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}
                      {pendingApprovalsCount > 0 && syncableProductsCount > 0 && <div className="mx-2 my-1 border-t border-border/40" />}
                      {syncableProductsCount > 0 && (
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                            Synchronisation
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={onSync} disabled={isProcessingBulkAction} className="rounded-lg gap-2 cursor-pointer">
                            <Upload className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium">Synchroniser tout</span>
                            <Badge className="ml-auto h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-0">{syncableProductsCount}</Badge>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={onCancelSync} disabled={isProcessingBulkAction} className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Annuler sync</span>
                            <Badge className="ml-auto h-5 px-1.5 text-[10px] bg-destructive/10 text-destructive border-0">{syncableProductsCount}</Badge>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
