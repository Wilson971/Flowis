'use client';

import React, { useState, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Link2,
  TrendingUp,
  ShoppingBag,
  Shuffle,
  Plus,
  X,
  Package,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductFormValues } from '../../../schemas/product-schema';

interface LinkedProduct {
  id: number;
  name?: string;
}

interface LinkedProductsCardV2Props {
  availableProducts?: LinkedProduct[];
  isLoadingProducts?: boolean;
  className?: string;
}

export const LinkedProductsCardV2 = ({
  availableProducts = [],
  isLoadingProducts = false,
  className,
}: LinkedProductsCardV2Props) => {
  const { setValue, control, getValues } = useFormContext<ProductFormValues>();

  const upsellIds = useWatch({ control, name: 'upsell_ids' }) || [];
  const crossSellIds = useWatch({ control, name: 'cross_sell_ids' }) || [];
  const relatedIds = useWatch({ control, name: 'related_ids' }) || [];

  const [newUpsellId, setNewUpsellId] = useState('');
  const [newCrossSellId, setNewCrossSellId] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    upsell: true,
    crosssell: false,
    related: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getProductName = useCallback(
    (id: number) => {
      const product = availableProducts.find((p) => p.id === id);
      return product?.name || `#${id}`;
    },
    [availableProducts]
  );

  const addProduct = useCallback(
    (field: 'upsell_ids' | 'cross_sell_ids', idString: string) => {
      const id = parseInt(idString, 10);
      if (isNaN(id) || id <= 0) return;

      const currentIds = getValues(field) || [];
      if (!currentIds.includes(id)) {
        setValue(field, [...currentIds, id], { shouldDirty: true });
      }
    },
    [getValues, setValue]
  );

  const removeProduct = useCallback(
    (field: 'upsell_ids' | 'cross_sell_ids' | 'related_ids', id: number) => {
      const currentIds = getValues(field) || [];
      setValue(
        field,
        currentIds.filter((i: number) => i !== id),
        { shouldDirty: true }
      );
    },
    [getValues, setValue]
  );

  const renderChips = (
    ids: number[],
    field: 'upsell_ids' | 'cross_sell_ids' | 'related_ids',
    emptyText: string
  ) => {
    if (!ids || ids.length === 0) {
      return (
        <p className="text-[11px] text-muted-foreground/60 italic py-1">
          {emptyText}
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <Badge
            key={id}
            variant="secondary"
            className="text-[10px] h-6 gap-1.5 pr-1 bg-muted/40 hover:bg-muted/60 rounded-lg"
          >
            <Package className="h-3 w-3" />
            <span className="max-w-[100px] truncate">
              {getProductName(id)}
            </span>
            <button
              type="button"
              onClick={() => removeProduct(field, id)}
              className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>
    );
  };

  const renderAddInput = (
    field: 'upsell_ids' | 'cross_sell_ids',
    value: string,
    onChange: (v: string) => void
  ) => (
    <div className="flex gap-2 mt-2">
      <Input
        type="number"
        placeholder="ID produit"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg text-sm h-8 flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 rounded-lg"
        onClick={() => {
          addProduct(field, value);
          onChange('');
        }}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <Card className={cn('rounded-xl border-border/40 bg-card relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-background/20 pointer-events-none" />

      <CardHeader className="pb-2 px-4 pt-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
            <Link2 className="h-4.5 w-4.5 text-foreground/70" />
          </div>
          <h4 className="text-[15px] font-semibold tracking-tight text-foreground">
            Produits lies
          </h4>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 relative z-10">
        {/* Upsells */}
        <Collapsible open={openSections.upsell} onOpenChange={() => toggleSection('upsell')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 text-[13px] font-medium text-foreground border-t border-border/20">
            <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground/60 transition-transform', openSections.upsell && 'rotate-90')} />
            <TrendingUp className="h-3.5 w-3.5 text-foreground/60" />
            Ventes incitatives
            <span className="text-[10px] text-muted-foreground/60 tabular-nums ml-auto">{upsellIds.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            {renderChips(upsellIds, 'upsell_ids', 'Aucun produit upsell')}
            {renderAddInput('upsell_ids', newUpsellId, setNewUpsellId)}
          </CollapsibleContent>
        </Collapsible>

        {/* Cross-sells */}
        <Collapsible open={openSections.crosssell} onOpenChange={() => toggleSection('crosssell')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 text-[13px] font-medium text-foreground border-t border-border/20">
            <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground/60 transition-transform', openSections.crosssell && 'rotate-90')} />
            <ShoppingBag className="h-3.5 w-3.5 text-foreground/60" />
            Ventes croisees
            <span className="text-[10px] text-muted-foreground/60 tabular-nums ml-auto">{crossSellIds.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            {renderChips(crossSellIds, 'cross_sell_ids', 'Aucun produit cross-sell')}
            {renderAddInput('cross_sell_ids', newCrossSellId, setNewCrossSellId)}
          </CollapsibleContent>
        </Collapsible>

        {/* Related (read-only) */}
        <Collapsible open={openSections.related} onOpenChange={() => toggleSection('related')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 text-[13px] font-medium text-foreground border-t border-border/20">
            <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground/60 transition-transform', openSections.related && 'rotate-90')} />
            <Shuffle className="h-3.5 w-3.5 text-foreground/60" />
            Produits similaires
            <span className="text-[10px] text-muted-foreground/60 tabular-nums ml-auto">{relatedIds.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            <p className="text-[11px] text-muted-foreground/60 mb-2">
              Generes automatiquement par WooCommerce (lecture seule)
            </p>
            {renderChips(relatedIds, 'related_ids', 'Aucun produit similaire detecte')}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
