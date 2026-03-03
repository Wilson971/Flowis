'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Sparkles, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motionTokens } from '@/lib/design-system';
import { cn } from '@/lib/utils';

interface DraftReviewBannerProps {
  draftFields: string[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

const fieldLabelMap: Record<string, string> = {
  title: 'Titre',
  description: 'Description',
  short_description: 'Description courte',
  'seo.title': 'SEO Titre',
  'seo.description': 'SEO Description',
  'seo.slug': 'SEO Slug',
};

function getFieldLabel(field: string): string {
  return fieldLabelMap[field] ?? field;
}

export function DraftReviewBanner({
  draftFields,
  onAcceptAll,
  onRejectAll,
  isAccepting = false,
  isRejecting = false,
}: DraftReviewBannerProps) {
  const isLoading = isAccepting || isRejecting;

  return (
    <AnimatePresence>
      {draftFields.length > 0 && (
        <motion.div
          variants={motionTokens.variants.slideUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4'
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                {draftFields.length} proposition{draftFields.length > 1 ? 's' : ''} IA en attente
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {draftFields.map((field) => (
                <Badge
                  key={field}
                  variant="secondary"
                  className="rounded-full text-xs"
                >
                  {getFieldLabel(field)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRejectAll}
              disabled={isLoading}
              className="rounded-lg"
            >
              {isRejecting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="mr-1.5 h-3.5 w-3.5" />
              )}
              Tout rejeter
            </Button>
            <Button
              size="sm"
              onClick={onAcceptAll}
              disabled={isLoading}
              className="rounded-lg"
            >
              {isAccepting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Tout accepter
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
