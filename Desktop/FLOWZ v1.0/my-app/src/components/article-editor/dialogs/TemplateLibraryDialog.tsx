'use client';

/**
 * TemplateLibraryDialog Component
 *
 * Full template library dialog:
 * - Browse all templates
 * - Filter by category
 * - Preview template
 * - Apply template to article
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutTemplate,
  Search,
  Star,
  Trash2,
  ChevronRight,
  Loader2,
  FileText,
  Check,
  FolderOpen,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  useArticleTemplates,
  useTemplateCategories,
  useApplyTemplateToArticle,
  useToggleTemplateFavorite,
  useDeleteArticleTemplate,
  type ArticleTemplate,
} from '@/hooks/blog/useArticleTemplates';

// ============================================================================
// TYPES
// ============================================================================

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  currentTemplateId?: string | null;
  onTemplateApplied?: () => void;
}

// ============================================================================
// TEMPLATE LIST ITEM
// ============================================================================

interface TemplateListItemProps {
  template: ArticleTemplate;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function TemplateListItem({
  template,
  isActive,
  isSelected,
  onSelect,
  onToggleFavorite,
  onDelete,
}: TemplateListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left',
        isSelected
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-background border-border/50 hover:bg-muted/50 hover:border-border',
        isActive && !isSelected && 'border-violet-200 bg-violet-50/50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          isSelected ? 'bg-primary/10' : isActive ? 'bg-violet-100' : 'bg-muted'
        )}
      >
        <LayoutTemplate
          className={cn(
            'w-5 h-5',
            isSelected ? 'text-primary' : isActive ? 'text-violet-600' : 'text-muted-foreground'
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-foreground">{template.name}</span>
          {isActive && (
            <Badge variant="outline" className="text-[9px] bg-violet-100 text-violet-700 border-violet-200">
              Actif
            </Badge>
          )}
          {template.is_favorite && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          )}
        </div>
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {template.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {template.category && (
            <>
              <span className="flex items-center gap-1">
                <FolderOpen className="w-3 h-3" />
                {template.category}
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            </>
          )}
          <span>{template.usage_count} utilisation{template.usage_count > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="h-8 w-8"
        >
          <Star
            className={cn(
              'w-4 h-4',
              template.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'
            )}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-8 w-8 text-muted-foreground hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <ChevronRight
          className={cn(
            'w-4 h-4 transition-transform',
            isSelected ? 'text-primary rotate-90' : 'text-muted-foreground'
          )}
        />
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TemplateLibraryDialog({
  open,
  onOpenChange,
  articleId,
  currentTemplateId,
  onTemplateApplied,
}: TemplateLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Hooks
  const { data: templates, isLoading } = useArticleTemplates({ enabled: open });
  const { data: categories } = useTemplateCategories();
  const applyTemplate = useApplyTemplateToArticle();
  const toggleFavorite = useToggleTemplateFavorite();
  const deleteTemplate = useDeleteArticleTemplate();

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates || [];

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [templates, categoryFilter, searchQuery]);

  const selectedTemplate = filteredTemplates.find((t) => t.id === selectedTemplateId);

  const handleApply = async () => {
    if (!selectedTemplateId) return;

    try {
      await applyTemplate.mutateAsync({
        templateId: selectedTemplateId,
        articleId,
      });
      onTemplateApplied?.();
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteTemplate.mutateAsync(deleteConfirmId);
      if (selectedTemplateId === deleteConfirmId) {
        setSelectedTemplateId(null);
      }
      setDeleteConfirmId(null);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[80vh] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Bibliotheque de templates
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {templates?.length || 0} template{(templates?.length || 0) > 1 ? 's' : ''} disponible{(templates?.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Template List */}
            <div className="w-full lg:w-[400px] border-r border-border flex flex-col">
              {/* Filters */}
              <div className="p-4 border-b border-border space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {categories && categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        <SelectValue placeholder="Toutes les categories" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* List */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || categoryFilter !== 'all'
                          ? 'Aucun template correspondant'
                          : 'Aucun template'}
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredTemplates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <TemplateListItem
                            template={template}
                            isActive={template.id === currentTemplateId}
                            isSelected={selectedTemplateId === template.id}
                            onSelect={() => setSelectedTemplateId(template.id)}
                            onToggleFavorite={() =>
                              toggleFavorite.mutate({
                                id: template.id,
                                isFavorite: !template.is_favorite,
                              })
                            }
                            onDelete={() => setDeleteConfirmId(template.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Preview */}
            <div className="flex-1 bg-muted/20 hidden lg:flex flex-col">
              {selectedTemplate ? (
                <>
                  <div className="p-4 border-b border-border">
                    <h3 className="font-bold text-lg">{selectedTemplate.name}</h3>
                    {selectedTemplate.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    {selectedTemplate.content_template ? (
                      <div className="prose prose-sm max-w-none rounded-lg bg-background p-4 border border-border">
                        <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/80">
                          {selectedTemplate.content_template.slice(0, 2000)}
                          {selectedTemplate.content_template.length > 2000 && '...'}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Ce template n'a pas de contenu predefini
                        </p>
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 border-t border-border">
                    <Button
                      onClick={handleApply}
                      disabled={applyTemplate.isPending}
                      className="w-full"
                    >
                      {applyTemplate.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Appliquer ce template
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <LayoutTemplate className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      Selectionnez un template pour le previsualiser
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Le template sera definitivement supprime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default TemplateLibraryDialog;
