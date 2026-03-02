'use client';

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ExternalLink, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductFormValues } from '../../../schemas/product-schema';

interface ExternalProductCardV2Props {
  className?: string;
}

export const ExternalProductCardV2 = ({ className }: ExternalProductCardV2Props) => {
  const { register, control } = useFormContext<ProductFormValues>();
  const productType = useWatch({ control, name: 'product_type' });

  if (productType !== 'external') {
    return null;
  }

  return (
    <Card className={cn('rounded-xl border-border/40 bg-card relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-background/20 pointer-events-none" />

      <CardHeader className="pb-3 px-4 pt-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
            <ExternalLink className="h-4.5 w-4.5 text-foreground/70" />
          </div>
          <h4 className="text-[15px] font-semibold tracking-tight text-foreground">
            Produit externe
          </h4>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 pt-0 relative z-10">
        {/* External URL */}
        <div className="space-y-1.5">
          <Label htmlFor="external_url" className="text-[13px] font-medium text-foreground">
            URL du produit
          </Label>
          <Input
            id="external_url"
            type="url"
            {...register('external_url')}
            placeholder="https://exemple.com/produit"
            className="rounded-lg text-sm"
          />
          <p className="text-[11px] text-muted-foreground/60">
            URL vers le site externe ou le produit peut etre achete
          </p>
        </div>

        {/* Button Text */}
        <div className="space-y-1.5">
          <Label htmlFor="button_text" className="text-[13px] font-medium text-foreground">
            Texte du bouton
          </Label>
          <Input
            id="button_text"
            {...register('button_text')}
            placeholder="Acheter sur le site partenaire"
            className="rounded-lg text-sm"
          />
          <p className="text-[11px] text-muted-foreground/60">
            Texte affiche sur le bouton d&apos;achat (par defaut: &quot;Acheter&quot;)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
