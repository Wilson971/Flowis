import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, ChevronDown, Check, X, RefreshCw, Upload,
    XCircle, ImageIcon, Zap, Settings,
    Type, FileText, Search, Hash, AlignLeft, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

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
    { id: "sku", label: "Génération SKU", defaultEnabled: false },
    { id: "alt_text", label: "Alt text images", defaultEnabled: false },
];

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
    title: Type,
    short_description: AlignLeft,
    description: FileText,
    seo_title: Globe,
    meta_description: Search,
    sku: Hash,
    alt_text: ImageIcon,
};

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

    modelName?: string;

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
    modelName = "Gemini 2.0 Flash",
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

    return (
        <AnimatePresence>
            {selectedCount > 0 && sheetWidth !== "0" && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{
                        duration: 0.24,
                        ease: motionTokens.easings.smooth,
                        width: { duration: 0.24, delay: 0.04 }
                    }}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: shouldPush ? sheetWidth : 0,
                        transform: "none",
                        width: "100%",
                        maxWidth: "820px",
                        margin: "0 auto",
                        zIndex: 9999,
                        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                    }}
                    className="pointer-events-none"
                >
                    <div className="pointer-events-auto px-3">
                        <div className="rounded-xl border border-border/50 bg-card/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                            {/* Multi-layer glassmorphism effects */}
                            {/* Glass reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                            {/* Primary accent glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/3 pointer-events-none" />
                            {/* Border light effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 50%)' }} />

                            <div className="relative z-10">
                                {/* ── Header ── */}
                                <div className={cn(
                                    "flex items-center justify-between px-4 pt-4",
                                    !isCollapsed && "pb-3"
                                )}>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 rounded-xl bg-primary/10">
                                            <Sparkles className="h-4.5 w-4.5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold leading-tight text-foreground">
                                                Génération IA
                                            </h3>
                                            <p className="text-xs text-muted-foreground leading-tight">
                                                {`${selectedCount} produit${selectedCount > 1 ? "s" : ""} sélectionné${selectedCount > 1 ? "s" : ""}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
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
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onCollapseChange(!isCollapsed)}
                                            className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                                        >
                                            <motion.div
                                                animate={{ rotate: isCollapsed ? 180 : 0 }}
                                                transition={motionTokens.transitions.fast}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </motion.div>
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

                                {/* ── Expandable Content ── */}
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            {/* Divider */}
                                            <div className="mx-4 border-t border-border" />

                                            <div className="px-4 pt-4 pb-4 space-y-4">
                                                {/* Question heading */}
                                                <p className="text-sm font-medium text-foreground">
                                                    Que voulez-vous générer ?
                                                </p>

                                                {/* ── Content Type Chips Grid ── */}
                                                <div className="flex flex-wrap gap-2.5">
                                                    {CONTENT_TYPES.map((type) => {
                                                        const isSelected = selectedTypes.includes(type.id);
                                                        const Icon = CONTENT_TYPE_ICONS[type.id] || FileText;

                                                        return (
                                                            <motion.button
                                                                key={type.id}
                                                                type="button"
                                                                onClick={() => !isGenerating && onToggleType(type.id)}
                                                                disabled={isGenerating}
                                                                whileTap={motionTokens.variants.tap}
                                                                className={cn(
                                                                    "relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200",
                                                                    "cursor-pointer select-none overflow-hidden",
                                                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                                                    isSelected
                                                                        ? "bg-primary/5 border-primary/40 shadow-sm backdrop-blur-sm"
                                                                        : "bg-card/80 border-border hover:border-primary/25 hover:bg-primary/[0.02] backdrop-blur-sm"
                                                                )}
                                                            >
                                                                {/* Glass shine on selected */}
                                                                {isSelected && (
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                                                )}

                                                                {/* Icon container */}
                                                                <div className={cn(
                                                                    "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                                                                    isSelected
                                                                        ? "bg-primary/15 backdrop-blur-sm"
                                                                        : "bg-muted/80"
                                                                )}>
                                                                    <Icon className={cn(
                                                                        "h-4 w-4 transition-colors duration-200 relative z-10",
                                                                        isSelected ? "text-primary" : "text-muted-foreground"
                                                                    )} />
                                                                </div>

                                                                {/* Label */}
                                                                <span className={cn(
                                                                    "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                                                                    isSelected ? "text-foreground" : "text-muted-foreground"
                                                                )}>
                                                                    {type.label}
                                                                </span>

                                                                {/* Active dot indicator */}
                                                                {isSelected && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        exit={{ scale: 0 }}
                                                                        transition={motionTokens.transitions.spring}
                                                                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card"
                                                                    />
                                                                )}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>

                                                {/* ── Force Regenerate (alt_text) ── */}
                                                {showForceRegenerate && (
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                                                            forceRegenerate
                                                                ? "bg-warning/10 border-warning/30"
                                                                : "bg-card border-border hover:border-warning/20"
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
                                                        <div className="flex-1 min-w-0">
                                                            <label
                                                                htmlFor="force-regenerate"
                                                                className={cn(
                                                                    "text-xs font-medium leading-none cursor-pointer",
                                                                    forceRegenerate ? "text-warning" : "text-muted-foreground"
                                                                )}
                                                            >
                                                                Forcer la regénération
                                                            </label>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                Régénère même les images ayant déjà un alt text
                                                            </p>
                                                        </div>
                                                        {forceRegenerate && (
                                                            <RefreshCw className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── No type selected warning ── */}
                                                {!canGenerate && (
                                                    <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                                                        <p className="text-xs text-warning font-medium">
                                                            Sélectionnez au moins un type de contenu
                                                        </p>
                                                    </div>
                                                )}

                                                {/* ── Alt Text Progress ── */}
                                                <AnimatePresence>
                                                    {isProcessingAltTexts && altTextProgress && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={motionTokens.transitions.default}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 relative overflow-hidden">
                                                                {/* Shimmer effect */}
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
                                                                            className="p-1 rounded-lg bg-primary/10"
                                                                            animate={{ scale: [1, 1.1, 1] }}
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
                                                                                <span className="text-success inline-flex items-center gap-0.5">
                                                                                    <Check className="h-2.5 w-2.5" />
                                                                                    {altTextProgress.successCount}
                                                                                </span>
                                                                                {altTextProgress.errorCount > 0 && (
                                                                                    <span className="text-destructive inline-flex items-center gap-0.5">
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

                                                {/* ── Footer: Model info + Actions + Generate ── */}
                                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                                    {/* Model indicator */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                                        <span className="text-xs text-muted-foreground">
                                                            Modèle: <span className="font-medium text-foreground">{modelName}</span>
                                                        </span>
                                                    </div>

                                                    {/* Actions + Generate */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Bulk Actions Dropdown */}
                                                        {(pendingApprovalsCount > 0 || syncableProductsCount > 0) && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className={cn(
                                                                            "relative h-9 text-xs px-4 gap-2 rounded-xl font-semibold",
                                                                            "border-border/50 bg-card/50 backdrop-blur-sm",
                                                                            "text-foreground hover:text-foreground",
                                                                            "hover:bg-card hover:border-primary/30 hover:shadow-sm",
                                                                            "transition-all duration-200",
                                                                            "[&_.action-badge]:hover:bg-primary/10 [&_.action-badge]:hover:text-primary"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span>Actions</span>
                                                                            <Badge
                                                                                className="action-badge h-5 px-1.5 text-[10px] font-bold bg-primary/10 text-primary border-0"
                                                                            >
                                                                                {pendingApprovalsCount + syncableProductsCount}
                                                                            </Badge>
                                                                        </div>
                                                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>

                                                                <DropdownMenuContent align="end" side="top" className="w-60 z-[10000] rounded-xl border-border/50 bg-popover/95 backdrop-blur-lg shadow-xl p-1.5">
                                                                    {pendingApprovalsCount > 0 && (
                                                                        <DropdownMenuGroup>
                                                                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-2.5 py-1.5">
                                                                                Approbation
                                                                            </DropdownMenuLabel>
                                                                            {onOpenBulkApproval && (
                                                                                <DropdownMenuItem
                                                                                    onClick={onOpenBulkApproval}
                                                                                    disabled={isProcessingBulkAction}
                                                                                    className="rounded-lg px-2.5 py-2 gap-2.5"
                                                                                >
                                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-success/10">
                                                                                        <Check className="h-3.5 w-3.5 text-success" />
                                                                                    </div>
                                                                                    <span className="text-xs font-medium">Approbation en masse...</span>
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            <DropdownMenuItem
                                                                                onClick={onApproveAll}
                                                                                disabled={isProcessingBulkAction}
                                                                                className="rounded-lg px-2.5 py-2 gap-2.5"
                                                                            >
                                                                                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-success/10">
                                                                                    <Check className="h-3.5 w-3.5 text-success" />
                                                                                </div>
                                                                                <span className="text-xs font-medium">Approuver tout</span>
                                                                                <Badge className="ml-auto h-5 px-1.5 text-[10px] font-semibold bg-success/10 text-success border-0">
                                                                                    {pendingApprovalsCount}
                                                                                </Badge>
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={onRejectAll}
                                                                                disabled={isProcessingBulkAction}
                                                                                className="rounded-lg px-2.5 py-2 gap-2.5"
                                                                            >
                                                                                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-destructive/10">
                                                                                    <X className="h-3.5 w-3.5 text-destructive" />
                                                                                </div>
                                                                                <span className="text-xs font-medium">Rejeter tout</span>
                                                                                <Badge className="ml-auto h-5 px-1.5 text-[10px] font-semibold bg-destructive/10 text-destructive border-0">
                                                                                    {pendingApprovalsCount}
                                                                                </Badge>
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuGroup>
                                                                    )}

                                                                    {pendingApprovalsCount > 0 && syncableProductsCount > 0 && (
                                                                        <div className="mx-2.5 my-1.5 border-t border-border/40" />
                                                                    )}

                                                                    {syncableProductsCount > 0 && (
                                                                        <DropdownMenuGroup>
                                                                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-2.5 py-1.5">
                                                                                Synchronisation
                                                                            </DropdownMenuLabel>
                                                                            <DropdownMenuItem
                                                                                onClick={onPushToStore}
                                                                                disabled={isProcessingBulkAction}
                                                                                className="rounded-lg px-2.5 py-2 gap-2.5"
                                                                            >
                                                                                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                                                                                    <Upload className="h-3.5 w-3.5 text-primary" />
                                                                                </div>
                                                                                <span className="text-xs font-medium">Synchroniser</span>
                                                                                <Badge className="ml-auto h-5 px-1.5 text-[10px] font-semibold bg-primary/10 text-primary border-0">
                                                                                    {syncableProductsCount}
                                                                                </Badge>
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={onCancelSync}
                                                                                disabled={isProcessingBulkAction}
                                                                                className="rounded-lg px-2.5 py-2 gap-2.5 text-destructive focus:text-destructive"
                                                                            >
                                                                                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-destructive/10">
                                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                                </div>
                                                                                <span className="text-xs font-medium">Annuler sync</span>
                                                                                <Badge className="ml-auto h-5 px-1.5 text-[10px] font-semibold bg-destructive/10 text-destructive border-0">
                                                                                    {syncableProductsCount}
                                                                                </Badge>
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuGroup>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}

                                                        {/* Generate CTA */}
                                                        <GenerateButton
                                                            canGenerate={canGenerate}
                                                            isGenerating={isGenerating}
                                                            isProcessingAltTexts={isProcessingAltTexts}
                                                            isProcessingBulkAction={isProcessingBulkAction}
                                                            progressMessage={progressMessage}
                                                            selectedCount={selectedCount}
                                                            onGenerate={onGenerate}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Collapsed: minimal bottom padding */}
                                {isCollapsed && <div className="pb-4" />}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ── Generate Button (reused in header collapsed + footer expanded) ── */
function GenerateButton({
    canGenerate,
    isGenerating,
    isProcessingAltTexts,
    isProcessingBulkAction,
    progressMessage,
    selectedCount,
    onGenerate,
}: {
    canGenerate: boolean;
    isGenerating: boolean;
    isProcessingAltTexts: boolean;
    isProcessingBulkAction: boolean;
    progressMessage: string;
    selectedCount: number;
    onGenerate: () => void;
}) {
    return (
        <Button
            size="sm"
            disabled={!canGenerate || isGenerating || isProcessingBulkAction}
            onClick={onGenerate}
            className={cn(
                "gap-2.5 px-5 h-9 font-bold text-xs rounded-xl relative overflow-hidden",
                "bg-primary text-primary-foreground",
                "shadow-sm shadow-primary/20",
                "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
                "active:scale-[0.98]",
                "transition-all duration-200",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm",
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
                    <span className="inline-block min-w-[100px] text-left">
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
                    <span>Générer ({selectedCount})</span>
                </>
            )}
        </Button>
    );
}
