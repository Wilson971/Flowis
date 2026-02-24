import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    SlidersHorizontal, CheckCircle2,
    Sparkles, RefreshCw,
    Package, Euro, ShoppingCart, Target, Layers
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
    priceRangeFilter?: string;
    priceMinFilter?: string;
    priceMaxFilter?: string;
    salesFilter?: string;
    seoScoreFilter?: string;
    onStatusChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    onCategoryChange?: (value: string) => void;
    onAiStatusChange?: (value: string) => void;
    onSyncStatusChange?: (value: string) => void;
    onStockChange?: (value: string) => void;
    onPriceRangeChange?: (value: string) => void;
    onPriceMinChange?: (value: string) => void;
    onPriceMaxChange?: (value: string) => void;
    onSalesChange?: (value: string) => void;
    onSeoScoreChange?: (value: string) => void;
    onReset: () => void;
}

const statusOptions = [
    { value: "all", label: "Tous" },
    { value: "publish", label: "Publié", color: "bg-emerald-500" },
    { value: "draft", label: "Brouillon", color: "bg-amber-500" },
    { value: "pending", label: "Attente", color: "bg-primary" },
    { value: "private", label: "Privé", color: "bg-muted-foreground" },
];

interface FilterSection {
    key: string;
    label: string;
    icon: React.ElementType;
    options: { value: string; label: string }[];
    currentValue: string;
    onChange: (value: string) => void;
}

export const ProductsFilter = ({
    statusFilter,
    typeFilter,
    categoryFilter,
    categories,
    aiStatusFilter,
    syncStatusFilter,
    stockFilter,
    priceRangeFilter,
    priceMinFilter,
    priceMaxFilter,
    salesFilter,
    seoScoreFilter,
    onStatusChange,
    onTypeChange,
    onCategoryChange,
    onAiStatusChange,
    onSyncStatusChange,
    onStockChange,
    onPriceRangeChange,
    onPriceMinChange,
    onPriceMaxChange,
    onSalesChange,
    onSeoScoreChange,
    onReset,
}: ProductsFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localPriceMin, setLocalPriceMin] = useState(priceMinFilter || '');
    const [localPriceMax, setLocalPriceMax] = useState(priceMaxFilter || '');

    const isPriceActive = (priceRangeFilter && priceRangeFilter !== 'all') || priceMinFilter || priceMaxFilter;

    const advancedFiltersCount =
        (typeFilter !== "all" ? 1 : 0) +
        (categoryFilter && categoryFilter !== "all" ? 1 : 0) +
        (aiStatusFilter && aiStatusFilter !== "all" ? 1 : 0) +
        (syncStatusFilter && syncStatusFilter !== "all" ? 1 : 0) +
        (stockFilter && stockFilter !== "all" ? 1 : 0) +
        (isPriceActive ? 1 : 0) +
        (salesFilter && salesFilter !== "all" ? 1 : 0) +
        (seoScoreFilter && seoScoreFilter !== "all" ? 1 : 0);

    const filterSections: FilterSection[] = [
        {
            key: 'type', label: 'Type de produit', icon: Layers,
            options: [
                { value: "all", label: "Tous" },
                { value: "simple", label: "Simple" },
                { value: "variable", label: "Variable" },
            ],
            currentValue: typeFilter,
            onChange: onTypeChange,
        },
        {
            key: 'ai_status', label: 'Contenu IA', icon: Sparkles,
            options: [
                { value: "all", label: "Tous" },
                { value: "optimized", label: "Optimisé IA" },
                { value: "not_optimized", label: "Non optimisé" },
                { value: "has_draft", label: "Brouillon en attente" },
            ],
            currentValue: aiStatusFilter || 'all',
            onChange: (v) => onAiStatusChange?.(v),
        },
        {
            key: 'sync_status', label: 'Synchronisation', icon: RefreshCw,
            options: [
                { value: "all", label: "Tous" },
                { value: "synced", label: "Synchronisé" },
                { value: "pending", label: "Modif. en attente" },
                { value: "never", label: "Jamais synchronisé" },
            ],
            currentValue: syncStatusFilter || 'all',
            onChange: (v) => onSyncStatusChange?.(v),
        },
        {
            key: 'stock', label: 'Stock', icon: Package,
            options: [
                { value: "all", label: "Tous" },
                { value: "in_stock", label: "En stock" },
                { value: "low_stock", label: "Stock faible" },
                { value: "out_of_stock", label: "Rupture" },
            ],
            currentValue: stockFilter || 'all',
            onChange: (v) => onStockChange?.(v),
        },
        {
            key: 'seo_score', label: 'Score SEO', icon: Target,
            options: [
                { value: "all", label: "Tous" },
                { value: "excellent", label: "Excellent (80+)" },
                { value: "good", label: "Bon (50–79)" },
                { value: "low", label: "Faible (<50)" },
                { value: "none", label: "Non analysé" },
            ],
            currentValue: seoScoreFilter || 'all',
            onChange: (v) => onSeoScoreChange?.(v),
        },
        {
            key: 'sales', label: 'Ventes', icon: ShoppingCart,
            options: [
                { value: "all", label: "Toutes" },
                { value: "no_sales", label: "Aucune vente" },
                { value: "1-10", label: "1 – 10 ventes" },
                { value: "11-50", label: "11 – 50 ventes" },
                { value: "50+", label: "50+ ventes" },
            ],
            currentValue: salesFilter || 'all',
            onChange: (v) => onSalesChange?.(v),
        },
    ];

    if (categories && categories.length > 0) {
        filterSections.push({
            key: 'category', label: 'Catégorie', icon: Layers,
            options: [
                { value: "all", label: "Toutes" },
                ...categories.map(cat => ({ value: cat, label: cat })),
            ],
            currentValue: categoryFilter || 'all',
            onChange: (v) => onCategoryChange?.(v),
        });
    }

    const priceRangeOptions = [
        { value: "all", label: "Tous les prix" },
        { value: "0-25", label: "0 – 25 €" },
        { value: "25-50", label: "25 – 50 €" },
        { value: "50-100", label: "50 – 100 €" },
        { value: "100-500", label: "100 – 500 €" },
        { value: "500+", label: "500 € +" },
        { value: "custom", label: "Personnalisé" },
    ];

    return (
        <div className="flex items-center gap-2">
            {/* Status segmented control */}
            <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onStatusChange(option.value)}
                        className={cn(
                            "px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5",
                            statusFilter === option.value
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {statusFilter === option.value && option.color && (
                            <div className={cn("h-1.5 w-1.5 rounded-full", option.color)} />
                        )}
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Single "Filtres" popover */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-8 text-xs gap-1.5",
                            advancedFiltersCount > 0 && "border-primary/50 text-primary"
                        )}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filtres
                        {advancedFiltersCount > 0 && (
                            <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                                {advancedFiltersCount}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="p-3 pb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Filtres avancés</span>
                        {advancedFiltersCount > 0 && (
                            <button
                                onClick={onReset}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Tout effacer
                            </button>
                        )}
                    </div>
                    <Separator />
                    <div className="py-1 max-h-[400px] overflow-y-auto">
                        {filterSections.map((section) => (
                            <FilterSectionRow key={section.key} section={section} />
                        ))}
                        <PriceSectionRow
                            currentValue={priceRangeFilter || 'all'}
                            priceOptions={priceRangeOptions}
                            localPriceMin={localPriceMin}
                            localPriceMax={localPriceMax}
                            onPriceRangeChange={(v) => {
                                onPriceRangeChange?.(v);
                                if (v !== 'custom') {
                                    onPriceMinChange?.('');
                                    onPriceMaxChange?.('');
                                    setLocalPriceMin('');
                                    setLocalPriceMax('');
                                }
                            }}
                            onLocalMinChange={setLocalPriceMin}
                            onLocalMaxChange={setLocalPriceMax}
                            onApplyCustom={() => {
                                onPriceMinChange?.(localPriceMin || '');
                                onPriceMaxChange?.(localPriceMax || '');
                            }}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

// --- Accordion-style filter section ---

function FilterSectionRow({ section }: { section: FilterSection }) {
    const [expanded, setExpanded] = useState(false);
    const isActive = section.currentValue !== 'all';
    const activeLabel = section.options.find(o => o.value === section.currentValue)?.label;
    const Icon = section.icon;

    return (
        <div>
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/60 transition-colors",
                    expanded && "bg-muted/40"
                )}
            >
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{section.label}</span>
                </div>
                <span className={cn(
                    "text-xs",
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                    {isActive ? activeLabel : 'Tous'}
                </span>
            </button>
            {expanded && (
                <div className="px-2 pb-1">
                    {section.options.map(option => (
                        <button
                            key={option.value}
                            onClick={() => {
                                section.onChange(option.value);
                                setExpanded(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors",
                                section.currentValue === option.value
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {section.currentValue === option.value && (
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                            )}
                            <span className={cn(section.currentValue !== option.value && "ml-5")}>
                                {option.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function PriceSectionRow({
    currentValue, priceOptions, localPriceMin, localPriceMax,
    onPriceRangeChange, onLocalMinChange, onLocalMaxChange, onApplyCustom,
}: {
    currentValue: string;
    priceOptions: { value: string; label: string }[];
    localPriceMin: string;
    localPriceMax: string;
    onPriceRangeChange: (v: string) => void;
    onLocalMinChange: (v: string) => void;
    onLocalMaxChange: (v: string) => void;
    onApplyCustom: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isActive = currentValue !== 'all';
    const activeLabel = currentValue === 'custom'
        ? `${localPriceMin || '0'}€ – ${localPriceMax || '∞'}€`
        : priceOptions.find(o => o.value === currentValue)?.label;

    return (
        <div>
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/60 transition-colors",
                    expanded && "bg-muted/40"
                )}
            >
                <div className="flex items-center gap-2">
                    <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Prix</span>
                </div>
                <span className={cn(
                    "text-xs",
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                    {isActive ? activeLabel : 'Tous'}
                </span>
            </button>
            {expanded && (
                <div className="px-2 pb-1">
                    {priceOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onPriceRangeChange(option.value);
                                if (option.value !== 'custom') setExpanded(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors",
                                currentValue === option.value
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {currentValue === option.value && (
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                            )}
                            <span className={cn(currentValue !== option.value && "ml-5")}>
                                {option.label}
                            </span>
                        </button>
                    ))}
                    {currentValue === 'custom' && (
                        <div className="border-t border-border mt-1.5 pt-2 px-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Input type="number" placeholder="Min €" value={localPriceMin}
                                    onChange={(e) => onLocalMinChange(e.target.value)} className="h-7 text-xs" />
                                <span className="text-muted-foreground text-xs">–</span>
                                <Input type="number" placeholder="Max €" value={localPriceMax}
                                    onChange={(e) => onLocalMaxChange(e.target.value)} className="h-7 text-xs" />
                            </div>
                            <Button size="sm" className="w-full h-7 text-xs" onClick={onApplyCustom}>
                                Appliquer
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
