'use client';

/**
 * TemplateCard Component
 *
 * Sidebar card for article templates:
 * - Current template indicator
 * - Quick access to template library
 * - Save as template option
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  LayoutTemplate,
  Plus,
  Star,
  ChevronRight,
  Loader2,
  BookOpen,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useArticleTemplates,
  useArticleTemplate,
  type ArticleTemplate,
} from '@/hooks/blog/useArticleTemplates';
import { TemplateLibraryDialog } from '../dialogs/TemplateLibraryDialog';
import { SaveAsTemplateDialog } from '../dialogs/SaveAsTemplateDialog';

// ============================================================================
// TYPES
// ============================================================================

interface TemplateCardProps {
  articleId: string;
  currentTemplateId?: string | null;
  className?: string;
  onTemplateApplied?: () => void;
}

// ============================================================================
// TEMPLATE PREVIEW ITEM
// ============================================================================

interface TemplatePreviewProps {
  template: ArticleTemplate;
  isActive?: boolean;
  onClick?: () => void;
}

function TemplatePreview({ template, isActive, onClick }: TemplatePreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
        'hover:bg-muted/50',
        isActive && 'bg-primary/5 border border-primary/20'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
          isActive ? 'bg-primary/10' : 'bg-muted'
        )}
      >
        <LayoutTemplate
          className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground truncate">{template.name}</span>
          {template.is_favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {template.usage_count} utilisation{template.usage_count > 1 ? 's' : ''}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TemplateCard({
  articleId,
  currentTemplateId,
  className,
  onTemplateApplied,
}: TemplateCardProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);

  // Fetch favorite templates for quick access
  const { data: favoriteTemplates, isLoading } = useArticleTemplates({ favoritesOnly: true });

  // Fetch current template if set
  const { data: currentTemplate } = useArticleTemplate(currentTemplateId || '', !!currentTemplateId);

  const displayTemplates = favoriteTemplates?.slice(0, 3) || [];

  return (
    <>
      <Card className={cn('border-border/50', className)}>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <LayoutTemplate className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Templates</h4>
                <p className="text-[10px] text-muted-foreground">
                  {currentTemplate ? currentTemplate.name : 'Aucun template'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Current Template Badge */}
              {currentTemplate && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 border border-violet-200">
                  <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200 text-[9px]">
                    Actif
                  </Badge>
                  <span className="text-xs font-medium text-violet-900 truncate">
                    {currentTemplate.name}
                  </span>
                </div>
              )}

              {/* Favorite Templates */}
              {displayTemplates.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    Favoris
                  </p>
                  {displayTemplates.map((template) => (
                    <TemplatePreview
                      key={template.id}
                      template={template}
                      isActive={template.id === currentTemplateId}
                      onClick={() => setLibraryOpen(true)}
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLibraryOpen(true)}
                  className="w-full justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Bibliotheque
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSaveAsOpen(true)}
                  className="w-full justify-start text-xs text-muted-foreground"
                >
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Sauvegarder comme template
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Template Library Dialog */}
      <TemplateLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        articleId={articleId}
        currentTemplateId={currentTemplateId}
        onTemplateApplied={onTemplateApplied}
      />

      {/* Save As Template Dialog */}
      <SaveAsTemplateDialog
        open={saveAsOpen}
        onOpenChange={setSaveAsOpen}
        articleId={articleId}
      />
    </>
  );
}

export default TemplateCard;
