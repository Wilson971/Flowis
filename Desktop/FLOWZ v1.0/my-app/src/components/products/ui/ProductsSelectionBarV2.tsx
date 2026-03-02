/**
 * Products Selection Bar V2 — Vercel Pro Pattern
 * Fixed z-index scale, themed colors, motionTokens
 * NOTE: This is a floating bottom bar — uses dark hardcoded styling (same exception as App Shell)
 */

"use client";

import { Sparkles, RefreshCw, X, Check, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { motionTokens } from "@/lib/design-system";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type ProductsSelectionBarV2Props = {
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

export const ProductsSelectionBarV2 = ({
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
}: ProductsSelectionBarV2Props) => {
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={motionTokens.transitions.spring}
          style={{
            position: "fixed",
            bottom: 0,
            left: cardBounds.left,
            width: cardBounds.width,
            transform: "none",
            zIndex: 50,
            display: "flex",
            justifyContent: "center",
          }}
          className="pointer-events-none"
        >
          <div className="pointer-events-auto flex justify-center w-full max-w-[820px] px-0 sm:px-3">
            {/* Dark floating bar — hardcoded dark like App Shell */}
            <div className={cn(
              "relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4",
              "p-3 px-4 sm:px-6",
              "bg-[#0e0e0e]/95 backdrop-blur-2xl text-white",
              "border border-white/10 rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none",
              "shadow-xl w-full",
              className
            )}>
              {/* Left — selection count */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="h-5 rounded-full px-2.5 text-[10px] font-medium bg-white/10 text-white/90 border-0 inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {selectedCount} selectionne{selectedCount > 1 ? "s" : ""}
                </span>
                {onDeselect && (
                  <button
                    onClick={onDeselect}
                    className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Right — actions */}
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/10 sm:border-none">
                {onGenerate && (
                  <Button
                    size="sm"
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="h-8 text-[11px] rounded-lg gap-1.5 font-medium bg-white text-[#0e0e0e] hover:bg-white/90 flex-1 sm:flex-none"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Generation...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Assistant IA
                      </>
                    )}
                  </Button>
                )}

                {(pendingApprovalsCount > 0 || syncableProductsCount > 0) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isProcessingBulkAction}
                        className="h-8 text-[11px] rounded-lg gap-1.5 font-medium bg-white/10 text-white hover:bg-white/20 border-0"
                      >
                        Actions
                        <span className="h-5 rounded-full px-1.5 text-[10px] font-medium bg-white text-[#0e0e0e] border-0 inline-flex items-center ml-1">
                          {pendingApprovalsCount + syncableProductsCount}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56 z-[60] rounded-xl relative -top-2">
                      {pendingApprovalsCount > 0 && (
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                            Approbation
                          </DropdownMenuLabel>
                          {onOpenBulkApproval && (
                            <DropdownMenuItem onClick={onOpenBulkApproval} disabled={isProcessingBulkAction} className="text-[13px] gap-2 cursor-pointer">
                              <Check className="h-4 w-4 text-success" />
                              Approbation en masse...
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={onApproveAll} disabled={isProcessingBulkAction} className="text-xs gap-2 cursor-pointer">
                            <Check className="h-4 w-4 text-success" />
                            Approuver tout
                            <span className="ml-auto h-5 rounded-full px-1.5 text-xs font-medium bg-success/10 text-success border-0 inline-flex items-center">
                              {pendingApprovalsCount}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={onRejectAll} disabled={isProcessingBulkAction} className="text-xs gap-2 cursor-pointer">
                            <X className="h-4 w-4 text-destructive" />
                            Rejeter tout
                            <span className="ml-auto h-5 rounded-full px-1.5 text-xs font-medium bg-destructive/10 text-destructive border-0 inline-flex items-center">
                              {pendingApprovalsCount}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}
                      {pendingApprovalsCount > 0 && syncableProductsCount > 0 && (
                        <div className="mx-2 my-1 border-t border-border/40" />
                      )}
                      {syncableProductsCount > 0 && (
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                            Synchronisation
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={onSync} disabled={isProcessingBulkAction} className="text-[13px] gap-2 cursor-pointer">
                            <Upload className="h-4 w-4 text-foreground/70" />
                            Synchroniser tout
                            <span className="ml-auto h-5 rounded-full px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0 inline-flex items-center">
                              {syncableProductsCount}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={onCancelSync} disabled={isProcessingBulkAction} className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive">
                            <XCircle className="h-4 w-4" />
                            Annuler sync
                            <span className="ml-auto h-5 rounded-full px-1.5 text-xs font-medium bg-destructive/10 text-destructive border-0 inline-flex items-center">
                              {syncableProductsCount}
                            </span>
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
