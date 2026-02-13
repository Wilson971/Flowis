import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Combobox } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import {
    Filter, X, CheckCircle2, FileText, Clock, ShieldAlert, Layers,
    Sparkles, FileCheck, FilePlus, FileX, RefreshCw, AlertCircle,
    Package, PackageCheck, PackageX, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductsFilterProps {
    statusFilter: string;
    typeFilter: string;
    categoryFilter?: string;
    categories?: string[];
    aiStatusFilter?: string;
    syncStatusFilter?: string;
    stockFilter?: string;
    onStatusChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    onCategoryChange?: (value: string) => void;
    onAiStatusChange?: (value: string) => void;
    onSyncStatusChange?: (value: string) => void;
    onStockChange?: (value: string) => void;
    onReset: () => void;
}

export const ProductsFilter = ({
    statusFilter,
    typeFilter,
    categoryFilter,
    categories,
    aiStatusFilter,
    syncStatusFilter,
    stockFilter,
    onStatusChange,
    onTypeChange,
    onCategoryChange,
    onAiStatusChange,
    onSyncStatusChange,
    onStockChange,
    onReset,
}: ProductsFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const statusOptions = [
        { value: "all", label: "Tous", icon: Layers },
        { value: "publish", label: "Publié", icon: CheckCircle2, color: "text-emerald-500" },
        { value: "draft", label: "Brouillon", icon: FileText, color: "text-amber-500" },
        { value: "pending", label: "Attente", icon: Clock, color: "text-blue-500" },
        { value: "private", label: "Privé", icon: ShieldAlert, color: "text-slate-500" },
    ];

    const typeOptions = [
        { value: "all", label: "Tous les types" },
        { value: "simple", label: "Simple" },
        { value: "variable", label: "Variable" },
    ];

    const aiStatusOptions = [
        { value: "all", label: "Tous", icon: Layers },
        { value: "optimized", label: "Optimisé IA", icon: Sparkles, color: "text-violet-500" },
        { value: "not_optimized", label: "Non optimisé", icon: FileX, color: "text-slate-500" },
        { value: "has_draft", label: "Brouillon en attente", icon: FilePlus, color: "text-amber-500" },
    ];

    const syncStatusOptions = [
        { value: "all", label: "Tous", icon: Layers },
        { value: "synced", label: "Synchronisé", icon: CheckCircle2, color: "text-emerald-500" },
        { value: "pending", label: "Modif. en attente", icon: AlertCircle, color: "text-amber-500" },
        { value: "never", label: "Jamais synchronisé", icon: Clock, color: "text-slate-500" },
    ];

    const stockOptions = [
        { value: "all", label: "Tous", icon: Layers },
        { value: "in_stock", label: "En stock", icon: PackageCheck, color: "text-emerald-500" },
        { value: "low_stock", label: "Stock faible", icon: AlertTriangle, color: "text-amber-500" },
        { value: "out_of_stock", label: "Rupture", icon: PackageX, color: "text-red-500" },
    ];

    const activeFiltersCount =
        (statusFilter !== "all" ? 1 : 0) +
        (typeFilter !== "all" ? 1 : 0) +
        (categoryFilter && categoryFilter !== "all" ? 1 : 0) +
        (aiStatusFilter && aiStatusFilter !== "all" ? 1 : 0) +
        (syncStatusFilter && syncStatusFilter !== "all" ? 1 : 0) +
        (stockFilter && stockFilter !== "all" ? 1 : 0);

    const hasActiveFilters = activeFiltersCount > 0;

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border mr-2">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onStatusChange(option.value)}
                        className={cn(
                            "px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 flex items-center gap-2",
                            statusFilter === option.value
                                ? "bg-background text-foreground border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        {statusFilter === option.value && (
                            <div className={cn("h-1.5 w-1.5 rounded-full bg-current",
                                option.value === 'publish' ? 'text-emerald-500' :
                                    option.value === 'draft' ? 'text-amber-500' :
                                        option.value === 'pending' ? 'text-blue-500' :
                                            'text-zinc-500'
                            )} />
                        )}
                        {option.label}
                    </button>
                ))}
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Filtre Contenu IA */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 border-dashed text-xs",
                            aiStatusFilter && aiStatusFilter !== "all" &&
                                "bg-violet-500/10 border-violet-500/50 text-violet-600 border-solid"
                        )}
                    >
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Contenu IA
                        {aiStatusFilter && aiStatusFilter !== "all" && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <span className="font-bold">
                                    {aiStatusOptions.find(a => a.value === aiStatusFilter)?.label}
                                </span>
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-2">
                        {aiStatusOptions.map(option => (
                            <div
                                key={option.value}
                                onClick={() => onAiStatusChange && onAiStatusChange(option.value)}
                                className={cn(
                                    "flex items-center px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted",
                                    aiStatusFilter === option.value && "bg-muted font-medium"
                                )}
                            >
                                {aiStatusFilter === option.value && (
                                    <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />
                                )}
                                <span className={cn(aiStatusFilter !== option.value && "ml-5")}>
                                    {option.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Filtre État de synchronisation */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 border-dashed text-xs",
                            syncStatusFilter && syncStatusFilter !== "all" &&
                                "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 border-solid"
                        )}
                    >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Sync
                        {syncStatusFilter && syncStatusFilter !== "all" && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <span className="font-bold">
                                    {syncStatusOptions.find(s => s.value === syncStatusFilter)?.label}
                                </span>
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                    <div className="p-2">
                        {syncStatusOptions.map(option => (
                            <div
                                key={option.value}
                                onClick={() => onSyncStatusChange && onSyncStatusChange(option.value)}
                                className={cn(
                                    "flex items-center px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted",
                                    syncStatusFilter === option.value && "bg-muted font-medium"
                                )}
                            >
                                {syncStatusFilter === option.value && (
                                    <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />
                                )}
                                <span className={cn(syncStatusFilter !== option.value && "ml-5")}>
                                    {option.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Filtre Stock */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 border-dashed text-xs",
                            stockFilter && stockFilter !== "all" &&
                                "bg-blue-500/10 border-blue-500/50 text-blue-600 border-solid"
                        )}
                    >
                        <Package className="mr-2 h-3.5 w-3.5" />
                        Stock
                        {stockFilter && stockFilter !== "all" && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <span className="font-bold">
                                    {stockOptions.find(st => st.value === stockFilter)?.label}
                                </span>
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-2">
                        {stockOptions.map(option => (
                            <div
                                key={option.value}
                                onClick={() => onStockChange && onStockChange(option.value)}
                                className={cn(
                                    "flex items-center px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted",
                                    stockFilter === option.value && "bg-muted font-medium"
                                )}
                            >
                                {stockFilter === option.value && (
                                    <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />
                                )}
                                <span className={cn(stockFilter !== option.value && "ml-5")}>
                                    {option.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Filtre Type (existant) */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 border-dashed text-xs",
                            typeFilter !== "all" && "bg-primary/5 border-primary/50 text-primary border-solid"
                        )}
                    >
                        <Layers className="mr-2 h-3.5 w-3.5" />
                        Type
                        {typeFilter !== "all" && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <span className="font-bold">{typeOptions.find(t => t.value === typeFilter)?.label}</span>
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-2">
                        {typeOptions.map(option => (
                            <div
                                key={option.value}
                                onClick={() => onTypeChange(option.value)}
                                className={cn(
                                    "flex items-center px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted",
                                    typeFilter === option.value && "bg-muted font-medium"
                                )}
                            >
                                {option.value === typeFilter && <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />}
                                <span className={cn(option.value !== typeFilter && "ml-5")}>{option.label}</span>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {categories && categories.length > 0 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 border-dashed text-xs",
                                categoryFilter && categoryFilter !== "all" && "bg-primary/5 border-primary/50 text-primary border-solid"
                            )}
                        >
                            <Filter className="mr-2 h-3.5 w-3.5" />
                            Catégorie
                            {categoryFilter && categoryFilter !== "all" && (
                                <>
                                    <Separator orientation="vertical" className="mx-2 h-4" />
                                    <span className="font-bold">{categoryFilter}</span>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <div className="p-2">
                            <div
                                onClick={() => onCategoryChange && onCategoryChange("all")}
                                className={cn(
                                    "flex items-center px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted",
                                    (!categoryFilter || categoryFilter === "all") && "bg-muted font-medium"
                                )}
                            >
                                {(!categoryFilter || categoryFilter === "all") && <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />}
                                <span className={cn((categoryFilter && categoryFilter !== "all") && "ml-5")}>Toutes</span>
                            </div>
                            {categories.map(cat => (
                                <div
                                    key={cat}
                                    onClick={() => onCategoryChange && onCategoryChange(cat)}
                                    className={cn(
                                        "flex items-center px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted",
                                        categoryFilter === cat && "bg-muted font-medium"
                                    )}
                                >
                                    {categoryFilter === cat && <CheckCircle2 className="mr-2 h-3 w-3 text-primary" />}
                                    <span className={cn(categoryFilter !== cat && "ml-5")}>{cat}</span>
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4 mr-1" />
                    Reset
                </Button>
            )}
        </div>
    );
};
