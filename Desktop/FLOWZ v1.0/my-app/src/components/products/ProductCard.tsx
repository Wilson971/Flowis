/**
 * ProductCard - Carte produit complète avec actions et informations
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Copy,
    ExternalLink,
    RefreshCw,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Check,
    X,
    ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { SeoScoreBadge } from './SeoScoreBadge';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProductCardData {
    id: string;
    title: string;
    slug?: string;
    sku?: string;
    price?: number;
    regular_price?: number;
    sale_price?: number;
    stock_status?: 'instock' | 'outofstock' | 'onbackorder';
    stock?: number;
    image_url?: string | null;
    seo_score?: number | null;
    sync_status?: 'synced' | 'pending' | 'error' | 'modified';
    dirty_fields_count?: number;
    has_draft?: boolean;
    categories?: string[];
    platform_product_id?: string;
    store_url?: string;
}

interface ProductCardProps {
    product: ProductCardData;
    selected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onGenerate?: (id: string) => void;
    onPush?: (id: string) => void;
    onView?: (id: string) => void;
    variant?: 'default' | 'compact' | 'list';
    showActions?: boolean;
    className?: string;
}

// ============================================================================
// Status Config
// ============================================================================

const stockStatusConfig = {
    instock: { label: 'En stock', color: 'bg-success/10 text-success' },
    outofstock: { label: 'Rupture', color: 'bg-destructive/10 text-destructive' },
    onbackorder: { label: 'Commande', color: 'bg-warning/10 text-warning' },
};

const syncStatusConfig = {
    synced: { icon: CheckCircle2, label: 'Synchronisé', color: 'text-success' },
    pending: { icon: RefreshCw, label: 'En attente', color: 'text-warning' },
    error: { icon: AlertCircle, label: 'Erreur', color: 'text-destructive' },
    modified: { icon: AlertCircle, label: 'Modifié', color: 'text-warning' },
};

// ============================================================================
// Component
// ============================================================================

export function ProductCard({
    product,
    selected = false,
    onSelect,
    onEdit,
    onDelete,
    onGenerate,
    onPush,
    onView,
    variant = 'default',
    showActions = true,
    className,
}: ProductCardProps) {
    const [imageError, setImageError] = useState(false);

    const stockConfig = stockStatusConfig[product.stock_status || 'instock'];
    const syncConfig = syncStatusConfig[product.sync_status || 'synced'];
    const SyncIcon = syncConfig.icon;

    const hasModifications = (product.dirty_fields_count || 0) > 0;
    const hasSale = product.sale_price && product.sale_price < (product.regular_price || product.price || 0);

    const handleCheckboxChange = (checked: boolean) => {
        onSelect?.(product.id, checked);
    };

    // Compact variant (list item)
    if (variant === 'compact') {
        return (
            <div
                className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors',
                    selected && 'ring-2 ring-primary',
                    className
                )}
            >
                {onSelect && (
                    <Checkbox
                        checked={selected}
                        onCheckedChange={handleCheckboxChange}
                    />
                )}

                <div className="relative h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    {product.image_url && !imageError ? (
                        <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.title}</p>
                    <p className="text-xs text-muted-foreground">{product.sku || 'Sans SKU'}</p>
                </div>

                <div className="flex items-center gap-2">
                    <SeoScoreBadge score={product.seo_score} size="sm" />
                    <span className="font-medium text-sm">
                        {product.price?.toFixed(2)}€
                    </span>
                </div>

                {showActions && onEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product.id)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }

    // Default card variant
    return (
        <Card
            className={cn(
                'group relative overflow-hidden border border-border card-elevated',
                selected && 'ring-2 ring-primary border-primary',
                className
            )}
        >
            {/* Selection checkbox */}
            {onSelect && (
                <div className="absolute top-3 left-3 z-10 transition-transform group-hover:scale-110">
                    <Checkbox
                        checked={selected}
                        onCheckedChange={handleCheckboxChange}
                        className="bg-card border-border"
                    />
                </div>
            )}

            {/* Status badges */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                {hasModifications && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px] font-bold bg-warning/10 text-warning border-warning/20 uppercase tracking-widest">
                                    {product.dirty_fields_count} modif.
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{product.dirty_fields_count} champ(s) modifié(s)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {product.has_draft && (
                    <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px] font-bold bg-primary/10 text-primary border-primary/20 uppercase tracking-widest">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                    </Badge>
                )}
            </div>

            {/* Image */}
            <div className="relative aspect-square bg-muted/30 border-b border-border/50">
                {product.image_url && !imageError ? (
                    <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-10 w-10 text-muted-foreground opacity-20" />
                    </div>
                )}

                {/* Sale badge */}
                {hasSale && (
                    <Badge className="absolute bottom-3 left-3 bg-success text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">
                        Promo
                    </Badge>
                )}
            </div>

            <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-foreground line-clamp-2 leading-snug tracking-tight hover:text-primary transition-colors cursor-pointer">{product.title}</h3>
                    {product.sku && (
                        <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest">SKU: {product.sku}</p>
                    )}
                </div>

                <div className="space-y-3">
                    {/* Categories */}
                    {product.categories && product.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {product.categories.slice(0, 2).map((cat, i) => (
                                <Badge key={i} variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-muted/50 text-muted-foreground border-border/50">
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Price & Stock */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                {product.price?.toFixed(2)}€
                            </span>
                            {hasSale && product.regular_price && (
                                <span className="text-xs text-muted-foreground line-through opacity-50 tabular-nums">
                                    {product.regular_price.toFixed(2)}€
                                </span>
                            )}
                        </div>
                        <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-widest border-transparent',
                            product.stock_status === 'instock' ? 'text-success bg-success/10' :
                                'text-destructive bg-destructive/10'
                        )}>
                            {stockConfig.label}
                        </Badge>
                    </div>

                    {/* SEO Score & Sync Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/10">
                        <SeoScoreBadge score={product.seo_score} size="sm" showLabel />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                    <SyncIcon className={cn('h-4 w-4', syncConfig.color)} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">{syncConfig.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardContent>

            {showActions && (
                <CardFooter className="p-4 pt-0 flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onEdit?.(product.id)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Éditer
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onView && (
                                <DropdownMenuItem onClick={() => onView(product.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Aperçu
                                </DropdownMenuItem>
                            )}
                            {product.store_url && product.platform_product_id && (
                                <DropdownMenuItem asChild>
                                    <a
                                        href={`${product.store_url}/wp-admin/post.php?post=${product.platform_product_id}&action=edit`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Voir sur WooCommerce
                                    </a>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {onGenerate && (
                                <DropdownMenuItem onClick={() => onGenerate(product.id)}>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Générer contenu IA
                                </DropdownMenuItem>
                            )}
                            {onPush && hasModifications && (
                                <DropdownMenuItem onClick={() => onPush(product.id)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Synchroniser
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => onDelete(product.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            )}
        </Card>
    );
}

// ============================================================================
// Grid Component
// ============================================================================

export function ProductCardGrid({
    products,
    selectedIds = [],
    onSelectionChange,
    onEdit,
    onDelete,
    onGenerate,
    onPush,
    className,
}: {
    products: ProductCardData[];
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onGenerate?: (id: string) => void;
    onPush?: (id: string) => void;
    className?: string;
}) {
    const handleSelect = (id: string, selected: boolean) => {
        if (!onSelectionChange) return;

        if (selected) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter((i) => i !== id));
        }
    };

    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    selected={selectedIds.includes(product.id)}
                    onSelect={onSelectionChange ? handleSelect : undefined}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onGenerate={onGenerate}
                    onPush={onPush}
                />
            ))}
        </div>
    );
}
