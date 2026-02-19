'use client';

/**
 * PublishToWCPanel - Sheet panel for publishing articles to WooCommerce
 *
 * Features:
 * - WooCommerce category and tag selection
 * - Status choice (draft / publish / pending)
 * - Article preview card
 * - Push confirmation with loading state
 * - Retry on failure
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Loader2,
  Send,
  Check,
  AlertCircle,
  Tag,
  FolderOpen,
  Eye,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useWordPressSync } from '@/hooks/blog/useWordPressSync';
import { WCPreviewCard } from './WCPreviewCard';
import type { WCCategory, WCTag } from '@/types/blog';

// ============================================================================
// TYPES
// ============================================================================

interface PublishToWCPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImageUrl?: string;
  category?: string;
  tags?: string[];
}

type PushState = 'idle' | 'pushing' | 'success' | 'error';

// ============================================================================
// CATEGORY SELECTOR
// ============================================================================

function CategorySelector({
  categories,
  selected,
  onToggle,
  isLoading,
}: {
  categories: WCCategory[];
  selected: number[];
  onToggle: (id: number) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        Aucune categorie trouvee sur WordPress
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onToggle(cat.id)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors',
            selected.includes(cat.id)
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'hover:bg-muted/50 text-foreground'
          )}
        >
          <span className="font-medium">{cat.name}</span>
          {selected.includes(cat.id) && <Check className="h-3 w-3" />}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// TAG SELECTOR
// ============================================================================

function TagSelector({
  tags,
  selected,
  onToggle,
  isLoading,
}: {
  tags: WCTag[];
  selected: number[];
  onToggle: (id: number) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        Aucun tag trouve sur WordPress
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          onClick={() => onToggle(tag.id)}
          className={cn(
            'cursor-pointer text-[10px] transition-colors',
            selected.includes(tag.id)
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'hover:bg-muted/50'
          )}
        >
          {tag.name}
          {selected.includes(tag.id) && <Check className="h-2.5 w-2.5 ml-1" />}
        </Badge>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PublishToWCPanel({
  open,
  onOpenChange,
  articleId,
  title,
  excerpt,
  content,
  featuredImageUrl,
  category,
  tags = [],
}: PublishToWCPanelProps) {
  // WordPress sync hook
  const {
    isConfigured,
    siteName,
    categories: wpCategories,
    tags: wpTags,
    isLoadingCategories,
    isLoadingTags,
    pushToWordPress,
    isPushing,
    config,
  } = useWordPressSync({ articleId });

  // Local state
  const [wcStatus, setWcStatus] = useState<'draft' | 'publish' | 'pending'>(
    config?.default_status || 'draft'
  );
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    config?.default_category_id ? [config.default_category_id] : []
  );
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [pushState, setPushState] = useState<PushState>('idle');
  const [pushError, setPushError] = useState<string | null>(null);

  // Reset state when panel opens
  useEffect(() => {
    if (open) {
      setPushState('idle');
      setPushError(null);
      setWcStatus(config?.default_status || 'draft');
      setSelectedCategories(
        config?.default_category_id ? [config.default_category_id] : []
      );
      setSelectedTags([]);
    }
  }, [open, config]);

  // Toggle category
  const toggleCategory = useCallback((id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  // Toggle tag
  const toggleTag = useCallback((id: number) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  // Handle push
  const handlePush = useCallback(async () => {
    if (!articleId) return;

    setPushState('pushing');
    setPushError(null);

    try {
      await pushToWordPress({
        articleId,
        status: wcStatus,
        categoryId: selectedCategories[0] || undefined,
      });
      setPushState('success');
      // Auto close after 2s on success
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setPushState('error');
      setPushError(
        err instanceof Error ? err.message : 'Erreur lors de la publication'
      );
    }
  }, [articleId, wcStatus, selectedCategories, pushToWordPress, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-lg font-extrabold">
            Publier sur WooCommerce
          </SheetTitle>
          <SheetDescription className="text-xs">
            {isConfigured
              ? `Publier vers ${siteName || 'votre boutique WordPress'}`
              : 'WordPress non configure - allez dans les parametres du store'}
          </SheetDescription>
        </SheetHeader>

        {!isConfigured ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  WordPress non configure
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configurez vos identifiants WordPress dans les parametres
                  du store pour publier des articles.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Apercu
                </Label>
                <WCPreviewCard
                  title={title}
                  excerpt={excerpt}
                  content={content}
                  featuredImageUrl={featuredImageUrl}
                  category={category}
                  tags={tags}
                  status={wcStatus}
                />
              </div>

              <Separator />

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Statut sur WordPress
                </Label>
                <Select value={wcStatus} onValueChange={(v) => setWcStatus(v as typeof wcStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="publish">Publie immediatement</SelectItem>
                    <SelectItem value="pending">En attente de relecture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Categories */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Categories WordPress
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] ml-1">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Label>
                <CategorySelector
                  categories={wpCategories || []}
                  selected={selectedCategories}
                  onToggle={toggleCategory}
                  isLoading={isLoadingCategories}
                />
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags WordPress
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] ml-1">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Label>
                <TagSelector
                  tags={wpTags || []}
                  selected={selectedTags}
                  onToggle={toggleTag}
                  isLoading={isLoadingTags}
                />
              </div>

              {/* Error message */}
              {pushState === 'error' && pushError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-destructive">Echec de la publication</p>
                      <p className="text-[11px] text-destructive/80 mt-0.5">{pushError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success message */}
              {pushState === 'success' && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-600">
                      Article publie sur WordPress !
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <SheetFooter className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 font-bold text-xs uppercase tracking-widest"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePush}
              disabled={!isConfigured || isPushing || pushState === 'success'}
              className="flex-1 h-10 font-extrabold text-xs uppercase tracking-widest shadow-[0_0_20px_-5px_var(--primary)]"
            >
              {isPushing || pushState === 'pushing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : pushState === 'success' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Publie !
                </>
              ) : pushState === 'error' ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Reessayer
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
