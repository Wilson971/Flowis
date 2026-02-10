import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, ChevronUp, Check, X, RefreshCw, Upload,
    XCircle, ImageIcon, Maximize2, Minimize2, Zap, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ContentType {
    id: string;
    label: string;
    defaultEnabled: boolean;
}

export const CONTENT_TYPES: ContentType[] = [
    { id: "title", label: "Titre produit", defaultEnabled: true },
    { id: "short_description", label: "Description courte", defaultEnabled: true },
    { id: "description", label: "Description complète", defaultEnabled: true },
    { id: "seo_title", label: "Titre SEO", defaultEnabled: true },
    { id: "meta_description", label: "Méta-description", defaultEnabled: true },
    { id: "sku", label: "SKU", defaultEnabled: false },
    { id: "alt_text", label: "Alt text images", defaultEnabled: false },
];

export type AltTextProgress = {
    current: number;
    total: number;
    status: "idle" | "processing" | "completed" | "error";
    message?: string;
    successCount: number;
    errorCount: number;
};

interface BatchGenerationPanelProps {
    selectedCount: number;
    selectedTypes: string[];
    forceRegenerate: boolean;
    isGenerating: boolean;
    isProcessingAltTexts: boolean;
    isProcessingBulkAction: boolean;
    progressMessage: string;
    altTextProgress?: AltTextProgress;

    isCollapsed: boolean;
    sheetWidth: string;
    shouldPush: boolean;
    pendingApprovalsCount: number;
    syncableProductsCount: number;

    onToggleType: (typeId: string) => void;
    onForceRegenerateChange: (checked: boolean) => void;
    onCollapseChange: (collapsed: boolean) => void;
    onGenerate: () => void;
    onOpenSettings: () => void;
    onClose?: () => void;

    onApproveAll?: () => void;
    onRejectAll?: () => void;
    onPushToStore?: () => void;
    onCancelSync?: () => void;
    onOpenBulkApproval?: () => void;
}

export function BatchGenerationPanel({
    selectedCount,
    selectedTypes,
    forceRegenerate,
    isGenerating,
    isProcessingAltTexts,
    isProcessingBulkAction,
    progressMessage,
    altTextProgress,
    isCollapsed,
    sheetWidth,
    shouldPush,
    pendingApprovalsCount,
    syncableProductsCount,
    onToggleType,
    onForceRegenerateChange,
    onCollapseChange,
    onGenerate,
    onOpenSettings,
    onClose,
    onApproveAll,
    onRejectAll,
    onPushToStore,
    onCancelSync,
    onOpenBulkApproval,
}: BatchGenerationPanelProps) {
    const showForceRegenerate = selectedTypes.includes("alt_text");
    const canGenerate = selectedCount > 0 && selectedTypes.length > 0;

    // Use memoized or simple derived values

    return (
        <AnimatePresence>
            {selectedCount > 0 && sheetWidth !== "0" && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{
                        y: 0,
                        opacity: 1,
                    }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{
                        duration: 0.24,
                        ease: [0.2, 0.8, 0.2, 1],
                        width: { duration: 0.24, delay: 0.04 }
                    }}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: shouldPush ? sheetWidth : 0,
                        transform: "none",
                        width: "100%",
                        maxWidth: "800px",
                        margin: "0 auto",
                        zIndex: 9999,
                        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                    }}
                    className="pointer-events-none"
                >
                    <div className="pointer-events-auto px-3">
                        <div
                            className="rounded-xl border-2 border-border bg-card/95 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                        >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                            <div className="relative z-10 p-4">
                                {/* Header */}
                                <div className={cn(
                                    "flex items-center justify-between",
                                    !isCollapsed && "mb-4 pb-3 border-b border-border"
                                )}>
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-primary/10 shadow-sm">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold leading-none">
                                                Génération IA
                                            </h3>
                                            <p className="text-xs leading-none text-muted-foreground mt-0.5">
                                                {selectedCount} produit{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!isCollapsed && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={onOpenSettings}
                                                className="gap-1.5 flex-shrink-0 h-8 px-2 hover:bg-primary/10"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                <span className="text-xs">Paramètres</span>
                                            </Button>
                                        )}

                                        {isCollapsed && (
                                            <Button
                                                size="sm"
                                                disabled={!canGenerate || isGenerating || isProcessingBulkAction}
                                                onClick={onGenerate}
                                                className={cn(
                                                    "gap-2 px-3 h-8 font-bold text-xs shadow-md shadow-primary/30",
                                                    "bg-primary text-primary-foreground",
                                                    "hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]",
                                                    "active:scale-[0.98]",
                                                    "transition-all duration-200",
                                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                                    isGenerating && "animate-pulse"
                                                )}
                                            >
                                                {isProcessingAltTexts ? (
                                                    <>
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                        >
                                                            <ImageIcon className="h-3.5 w-3.5" />
                                                        </motion.div>
                                                        <span>Alt texts...</span>
                                                    </>
                                                ) : isGenerating ? (
                                                    <>
                                                        <motion.div
                                                            animate={{
                                                                scale: [1, 1.2, 1],
                                                                rotate: [0, 180, 360]
                                                            }}
                                                            transition={{
                                                                duration: 1.5,
                                                                repeat: Infinity,
                                                                ease: "easeInOut"
                                                            }}
                                                        >
                                                            <Zap className="h-3.5 w-3.5" />
                                                        </motion.div>
                                                        <span className="inline-block min-w-[80px] text-left">
                                                            <AnimatePresence mode="wait">
                                                                <motion.span
                                                                    key={progressMessage}
                                                                    initial={{ opacity: 0, y: 5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -5 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="block truncate"
                                                                >
                                                                    {progressMessage}
                                                                </motion.span>
                                                            </AnimatePresence>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                        <span>GÉNÉRER ({selectedCount})</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onCollapseChange(!isCollapsed)}
                                            className="h-8 w-8 hover:bg-primary/10 flex-shrink-0"
                                        >
                                            {isCollapsed ? (
                                                <Maximize2 className="h-4 w-4" />
                                            ) : (
                                                <Minimize2 className="h-4 w-4" />
                                            )}
                                        </Button>

                                        {onClose && !isGenerating && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={onClose}
                                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                                title="Désélectionner tous les produits"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Content - Hidden when collapsed */}
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold leading-none">Types de contenu</Label>
                                                    <Badge variant="outline" className="text-[10px] leading-none px-1.5 py-0 bg-primary/5 border-primary/20 text-primary">
                                                        {selectedTypes.length}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {CONTENT_TYPES.map((type) => {
                                                        const isSelected = selectedTypes.includes(type.id);
                                                        return (
                                                            <div
                                                                key={type.id}
                                                                className={cn(
                                                                    "flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 cursor-pointer",
                                                                    isSelected
                                                                        ? "bg-primary/5 border-primary/30 shadow-sm"
                                                                        : "bg-background border-border hover:border-primary/20"
                                                                )}
                                                                onClick={() => !isGenerating && onToggleType(type.id)}
                                                            >
                                                                <Checkbox
                                                                    id={type.id}
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => onToggleType(type.id)}
                                                                    disabled={isGenerating}
                                                                    className="flex-shrink-0 h-4 w-4"
                                                                />
                                                                <label
                                                                    htmlFor={type.id}
                                                                    className={cn(
                                                                        "text-xs font-medium leading-none cursor-pointer flex-1",
                                                                        isSelected ? "text-foreground" : "text-muted-foreground",
                                                                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                    )}
                                                                >
                                                                    {type.label}
                                                                </label>
                                                                {isSelected && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {showForceRegenerate && (
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer mb-3",
                                                        forceRegenerate
                                                            ? "bg-orange-500/10 border-orange-500/30"
                                                            : "bg-background border-border hover:border-orange-500/20"
                                                    )}
                                                    onClick={() => !isGenerating && onForceRegenerateChange(!forceRegenerate)}
                                                >
                                                    <Checkbox
                                                        id="force-regenerate"
                                                        checked={forceRegenerate}
                                                        onCheckedChange={(checked) => onForceRegenerateChange(!!checked)}
                                                        disabled={isGenerating}
                                                        className="flex-shrink-0 h-4 w-4"
                                                    />
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor="force-regenerate"
                                                            className={cn(
                                                                "text-xs font-medium leading-none cursor-pointer",
                                                                forceRegenerate ? "text-orange-600" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            Forcer la regénération
                                                        </label>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            Régénère même les images ayant déjà un alt text
                                                        </p>
                                                    </div>
                                                    {forceRegenerate && (
                                                        <RefreshCw className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                            )}

                                            {!canGenerate && (
                                                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
                                                    <p className="text-xs leading-none text-amber-500 font-medium">
                                                        Sélectionnez au moins un type
                                                    </p>
                                                </div>
                                            )}

                                            <AnimatePresence>
                                                {isProcessingAltTexts && altTextProgress && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10, height: 0 }}
                                                        animate={{ opacity: 1, y: 0, height: "auto" }}
                                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                                        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                                                        className="mb-3 overflow-hidden"
                                                    >
                                                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 relative overflow-hidden">
                                                            <motion.div
                                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none"
                                                                animate={{ x: ["-100%", "200%"] }}
                                                                transition={{
                                                                    duration: 2,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut"
                                                                }}
                                                            />

                                                            <div className="relative z-10">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <motion.div
                                                                        className="p-1 rounded bg-primary/10"
                                                                        animate={{
                                                                            scale: [1, 1.1, 1],
                                                                        }}
                                                                        transition={{
                                                                            duration: 1.5,
                                                                            repeat: Infinity,
                                                                            ease: "easeInOut"
                                                                        }}
                                                                    >
                                                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                                    </motion.div>
                                                                    <span className="text-xs font-medium text-foreground">
                                                                        Génération des alt texts
                                                                    </span>
                                                                </div>

                                                                <Progress value={altTextProgress.total > 0 ? (altTextProgress.current / altTextProgress.total) * 100 : 0} className="h-1.5" />

                                                                <div className="flex justify-between mt-1.5">
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        {altTextProgress.message || `${altTextProgress.current}/${altTextProgress.total} images`}
                                                                    </p>
                                                                    {(altTextProgress.successCount > 0 || altTextProgress.errorCount > 0) && (
                                                                        <p className="text-[10px] flex items-center gap-2">
                                                                            <span className="text-emerald-500 inline-flex items-center gap-0.5">
                                                                                <Check className="h-2.5 w-2.5" />
                                                                                {altTextProgress.successCount}
                                                                            </span>
                                                                            {altTextProgress.errorCount > 0 && (
                                                                                <span className="text-red-500 inline-flex items-center gap-0.5">
                                                                                    <X className="h-2.5 w-2.5" />
                                                                                    {altTextProgress.errorCount}
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {selectedTypes.length} type{selectedTypes.length > 1 ? "s" : ""}
                                                </p>

                                                <div className="flex gap-2">
                                                    <DropdownMenu>
                                                        <ButtonGroup>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={pendingApprovalsCount === 0 && syncableProductsCount === 0}
                                                                className="relative h-8 text-xs px-3"
                                                            >
                                                                Actions
                                                                {(pendingApprovalsCount > 0 || syncableProductsCount > 0) && (
                                                                    <Badge
                                                                        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] font-bold leading-none bg-primary text-primary-foreground border border-background"
                                                                    >
                                                                        {pendingApprovalsCount + syncableProductsCount}
                                                                    </Badge>
                                                                )}
                                                            </Button>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 px-0">
                                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                        </ButtonGroup>

                                                        <DropdownMenuContent align="end" side="top" className="w-64">
                                                            {pendingApprovalsCount > 0 && (
                                                                <DropdownMenuGroup>
                                                                    {onOpenBulkApproval && (
                                                                        <DropdownMenuItem
                                                                            onClick={onOpenBulkApproval}
                                                                            disabled={isProcessingBulkAction}
                                                                        >
                                                                            <Check className="h-4 w-4 text-emerald-500 mr-2" />
                                                                            Approbation en masse...
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={onApproveAll}
                                                                        disabled={isProcessingBulkAction}
                                                                    >
                                                                        <Check className="h-4 w-4 text-emerald-500 mr-2" />
                                                                        Approuver tout ({pendingApprovalsCount})
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={onRejectAll}
                                                                        disabled={isProcessingBulkAction}
                                                                    >
                                                                        <X className="h-4 w-4 text-red-500 mr-2" />
                                                                        Rejeter tout ({pendingApprovalsCount})
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuGroup>
                                                            )}

                                                            {pendingApprovalsCount > 0 && syncableProductsCount > 0 && (
                                                                <DropdownMenuSeparator />
                                                            )}

                                                            {syncableProductsCount > 0 && (
                                                                <DropdownMenuGroup>
                                                                    <DropdownMenuItem
                                                                        onClick={onPushToStore}
                                                                        disabled={isProcessingBulkAction}
                                                                    >
                                                                        <Upload className="h-4 w-4 text-blue-500 mr-2" />
                                                                        Synchroniser ({syncableProductsCount})
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={onCancelSync}
                                                                        disabled={isProcessingBulkAction}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        Annuler sync ({syncableProductsCount})
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuGroup>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <Button
                                                        size="sm"
                                                        disabled={!canGenerate || isGenerating || isProcessingBulkAction}
                                                        onClick={onGenerate}
                                                        className={cn(
                                                            "gap-2 px-4 h-8 font-bold text-xs shadow-md shadow-primary/30",
                                                            "bg-primary text-primary-foreground",
                                                            "hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]",
                                                            "active:scale-[0.98]",
                                                            "transition-all duration-200",
                                                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                                            isGenerating && "animate-pulse"
                                                        )}
                                                    >
                                                        {isProcessingAltTexts ? (
                                                            <>
                                                                <motion.div
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                                >
                                                                    <ImageIcon className="h-3.5 w-3.5" />
                                                                </motion.div>
                                                                <span>Alt texts...</span>
                                                            </>
                                                        ) : isGenerating ? (
                                                            <>
                                                                <motion.div
                                                                    animate={{
                                                                        scale: [1, 1.2, 1],
                                                                        rotate: [0, 180, 360]
                                                                    }}
                                                                    transition={{
                                                                        duration: 1.5,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut"
                                                                    }}
                                                                >
                                                                    <Zap className="h-3.5 w-3.5" />
                                                                </motion.div>
                                                                <span className="inline-block min-w-[120px] text-left">
                                                                    <AnimatePresence mode="wait">
                                                                        <motion.span
                                                                            key={progressMessage}
                                                                            initial={{ opacity: 0, y: 5 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -5 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="block truncate"
                                                                        >
                                                                            {progressMessage}
                                                                        </motion.span>
                                                                    </AnimatePresence>
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="h-3.5 w-3.5" />
                                                                <span>GÉNÉRER ({selectedCount})</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
