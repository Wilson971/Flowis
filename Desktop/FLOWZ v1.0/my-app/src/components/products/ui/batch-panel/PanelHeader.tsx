"use client";

import { motion } from "framer-motion";
import { Sparkles, ChevronDown, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { GenerateButton } from "./GenerateButton";

interface PanelHeaderProps {
    selectedCount: number;
    isCollapsed: boolean;
    isGenerating: boolean;
    isProcessingAltTexts: boolean;
    isProcessingBulkAction: boolean;
    progressMessage: string;
    canGenerate: boolean;
    onCollapseChange: (collapsed: boolean) => void;
    onOpenSettings: () => void;
    onGenerate: () => void;
    onClose?: () => void;
}

export function PanelHeader({
    selectedCount,
    isCollapsed,
    isGenerating,
    isProcessingAltTexts,
    isProcessingBulkAction,
    progressMessage,
    canGenerate,
    onCollapseChange,
    onOpenSettings,
    onGenerate,
    onClose,
}: PanelHeaderProps) {
    return (
        <div className={cn(
            "flex items-center justify-between w-full",
            isCollapsed ? "gap-4 p-3 px-4 sm:px-5" : "px-4 pt-4 pb-3"
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-primary/10">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="min-w-0 z-10 relative">
                    <h3 className={cn(
                        "text-sm font-bold leading-tight transition-colors duration-300",
                        isCollapsed ? "text-white" : "text-foreground"
                    )}>
                        Génération IA
                    </h3>
                    <p className={cn(
                        "text-xs leading-tight transition-colors duration-300",
                        isCollapsed ? "text-white/70" : "text-muted-foreground"
                    )}>
                        {`${selectedCount} produit${selectedCount > 1 ? "s" : ""} sélectionné${selectedCount > 1 ? "s" : ""}`}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 z-10 relative">
                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenSettings}
                        className="gap-1.5 flex-shrink-0 h-8 px-2.5 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        <span className="text-xs">Paramètres</span>
                    </Button>
                )}

                {/* Collapsed: inline generate button */}
                {isCollapsed && (
                    <GenerateButton
                        canGenerate={canGenerate}
                        isGenerating={isGenerating}
                        isProcessingAltTexts={isProcessingAltTexts}
                        isProcessingBulkAction={isProcessingBulkAction}
                        progressMessage={progressMessage}
                        selectedCount={selectedCount}
                        onGenerate={onGenerate}
                    />
                )}

                <Button
                    variant={isCollapsed ? "outline" : "ghost"}
                    size={isCollapsed ? "sm" : "icon"}
                    onClick={() => onCollapseChange(!isCollapsed)}
                    className={cn(
                        "flex-shrink-0 transition-all duration-300 rounded-xl",
                        isCollapsed
                            ? "h-9 px-3 gap-1.5 bg-white/10 text-white hover:bg-white/20 border-transparent shadow-none"
                            : "h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                >
                    {isCollapsed && <span className="text-xs font-semibold">Options IA</span>}
                    <motion.div
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={motionTokens.transitions.fast}
                    >
                        <ChevronDown className={cn("h-4 w-4", isCollapsed ? "text-white" : "text-muted-foreground")} />
                    </motion.div>
                </Button>

                {onClose && !isGenerating && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className={cn(
                            "h-8 w-8 flex-shrink-0 transition-colors duration-300",
                            isCollapsed
                                ? "hover:bg-white/10 text-white/70 hover:text-white"
                                : "hover:bg-destructive/10 hover:text-destructive"
                        )}
                        title="Désélectionner tous les produits"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
