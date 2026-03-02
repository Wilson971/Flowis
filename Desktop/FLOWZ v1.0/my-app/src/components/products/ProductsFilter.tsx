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
    Package, Euro, ShoppingCart, Target, Layers, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

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
    missingContentFilter?: string;
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
    onMissingContentChange?: (value: string) => void;
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
    missingContentFilter,
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
    onMissingContentChange,
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
        (seoScoreFilter && seoScoreFilter !== "all" ? 1 : 0) +
        (missingContentFilter && missingContentFilter !== "all" ? 1 : 0);

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
        {
            key: 'missing_content', label: 'Contenu manquant', icon: AlertCircle,
            options: [
                { value: "all", label: "Tous" },
                { value: "no_short_description", label: "Sans desc. courte" },
                { value: "no_description", label: "Sans desc. longue" },
                { value: "no_seo_title", label: "Sans meta titre" },
                { value: "no_seo_description", label: "Sans meta desc." },
                { value: "no_sku", label: "Sans SKU" },
            ],
            currentValue: missingContentFilter || 'all',
            onChange: (v) => onMissingContentChange?.(v),
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
            {/* Status segmented control — Vercel Pro */}
            <div className="flex items-center gap-0.5 border-b border-border/40">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onStatusChange(option.value)}
                        className={cn(
                            "relative px-3 py-2 text-[13px] font-medium transition-colors flex items-center gap-1.5",
                            statusFilter === option.value
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {option.color && (
                            <div className={cn(
                                "h-1.5 w-1.5 rounded-full transition-opacity",
                                option.color,
                                statusFilter === option.value ? "opacity-100" : "opacity-0"
                            )} />
                        )}
                        {option.label}
                        {statusFilter === option.value && (
                            <motion.div
                                layoutId="productsStatusTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                                transition={motionTokens.transitions.fast}
                            />
                        )}
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
                            "h-7 text-[11px] rounded-lg gap-1.5 font-medium border-border/60 hover:bg-accent hover:text-accent-foreground",
                            advancedFiltersCount > 0 && "border-foreground/20 text-foreground"
                        )}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filtres
                        {advancedFiltersCount > 0 && (
                            <span className="h-5 rounded-full px-1.5 text-[10px] font-medium bg-foreground/10 text-foreground border-0 inline-flex items-center justify-center min-w-[20px]">
                                {advancedFiltersCount}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 rounded-xl border-border/40 shadow-lg" align="start">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-semibold tracking-tight text-foreground">Filtres avances</span>
                        {advancedFiltersCount > 0 && (
                            <button
                                onClick={onReset}
                                className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
                            >
                                Effacer
                            </button>
                        )}
                    </div>
                    <div className="mx-4 border-t border-border/30" />
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
                    "w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors hover:bg-muted/30",
                    expanded && "bg-muted/20"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="font-medium text-foreground">{section.label}</span>
                </div>
                <span className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground/50"
                )}>
                    {isActive ? activeLabel : 'Tous'}
                </span>
            </button>
            {expanded && (
                <div className="px-3 pb-2">
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
                                    ? "bg-muted/60 text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            {section.currentValue === option.value && (
                                <div className="h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                            )}
                            <span className={cn(section.currentValue !== option.value && "ml-3.5")}>
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
                    "w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors hover:bg-muted/30",
                    expanded && "bg-muted/20"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <Euro className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="font-medium text-foreground">Prix</span>
                </div>
                <span className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground/50"
                )}>
                    {isActive ? activeLabel : 'Tous'}
                </span>
            </button>
            {expanded && (
                <div className="px-3 pb-2">
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
                                    ? "bg-muted/60 text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            {currentValue === option.value && (
                                <div className="h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                            )}
                            <span className={cn(currentValue !== option.value && "ml-3.5")}>
                                {option.label}
                            </span>
                        </button>
                    ))}
                    {currentValue === 'custom' && (
                        <div className="border-t border-border/30 mt-2 pt-2.5 px-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Input type="number" placeholder="Min €" value={localPriceMin}
                                    onChange={(e) => onLocalMinChange(e.target.value)} className="h-7 text-[11px] rounded-lg border-border/60" />
                                <span className="text-muted-foreground/40 text-[11px]">–</span>
                                <Input type="number" placeholder="Max €" value={localPriceMax}
                                    onChange={(e) => onLocalMaxChange(e.target.value)} className="h-7 text-[11px] rounded-lg border-border/60" />
                            </div>
                            <Button size="sm" className="w-full h-7 text-[11px] rounded-lg font-medium" onClick={onApplyCustom}>
                                Appliquer
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
