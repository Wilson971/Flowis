'use client';

/**
 * CanvasStep Component
 *
 * Step 5: Rich text editing with AI actions
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Edit3,
  Wand2,
  Loader2,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Languages,
  FileText,
  ShieldCheck,
  Minus,
  Briefcase,
  PanelRightOpen,
  PanelRightClose,
  Globe,
  Eye,
  Code2,
  SpellCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { styles } from '@/lib/design-system';
import { cn, stripMarkdown } from '@/lib/utils';
import { CANVAS_ACTION_LABELS, type CanvasAIAction } from '@/types/blog-ai';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ============================================================================
// AI ACTION ICONS
// ============================================================================

const actionIcons: Record<CanvasAIAction, React.ElementType> = {
  rewrite: RefreshCw,
  improve: Zap,
  expand: ArrowUpRight,
  shorten: ArrowDownRight,
  translate: Languages,
  continue: FileText,
  factcheck: ShieldCheck,
  simplify: Minus,
  formalize: Briefcase,
  change_tone: Globe,
  correct: SpellCheck,
};

// ============================================================================
// AI ACTION BUTTON
// ============================================================================

interface AIActionButtonProps {
  action: CanvasAIAction;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

function AIActionButton({
  action,
  onClick,
  disabled,
  isLoading,
}: AIActionButtonProps) {
  const config = CANVAS_ACTION_LABELS[action];
  const Icon = actionIcons[action];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled || isLoading}
            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5 data-[state=open]:bg-primary/10"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// CANVAS STEP
// ============================================================================

interface CanvasStepProps {
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  onContentChange: (content: string) => void;
  onMetaChange: (metaTitle?: string, metaDescription?: string) => void;
  onRewrite: (text: string, action: CanvasAIAction) => Promise<string>;
  isRewriting: boolean;
}

/**
 * Clean markdown content by removing code block wrappers
 */
function cleanMarkdownContent(content: string): string {
  // Remove ```markdown or ``` at the start
  let cleaned = content.replace(/^```(?:markdown)?\s*\n?/i, '');
  // Remove ``` at the end
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  return cleaned;
}

export function CanvasStep({
  content,
  metaTitle,
  metaDescription,
  onContentChange,
  onMetaChange,
  onRewrite,
  isRewriting,
}: CanvasStepProps) {
  const [selectedText, setSelectedText] = useState('');
  const [currentAction, setCurrentAction] = useState<CanvasAIAction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clean the content for display
  const cleanedContent = useMemo(() => cleanMarkdownContent(content), [content]);

  const handleTextSelect = useCallback(() => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      // Only update if it's within our textarea
      if (text && textareaRef.current && document.activeElement === textareaRef.current) {
        setSelectedText(text);
      } else {
        // Don't clear immediately to allow clicking buttons
      }
    }, 10);
  }, []);

  const handleAIAction = useCallback(
    async (action: CanvasAIAction) => {
      if (!selectedText) return;

      setCurrentAction(action);
      try {
        const result = await onRewrite(selectedText, action);
        // Replace selected text with result
        const newContent = content.replace(selectedText, result);
        onContentChange(newContent);
        // Clear selection
        setSelectedText('');
      } finally {
        setCurrentAction(null);
      }
    },
    [selectedText, content, onRewrite, onContentChange]
  );

  // Clear selection when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        // Check if clicking a button
        const target = e.target as HTMLElement;
        if (!target.closest('button')) {
          setSelectedText('');
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-full gap-6 p-4 overflow-hidden">

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full bg-card rounded-xl border border-border/60 overflow-hidden relative">

        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-md p-0.5">
              <Button
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="h-7 px-3 text-xs gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5" />
                Éditer
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="h-7 px-3 text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Aperçu
              </Button>
            </div>
            <div className="h-4 w-[1px] bg-border" />
            <span className="text-xs text-muted-foreground">{wordCount} mots</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2 font-medium">Actions IA:</span>
            <div className="flex items-center bg-background rounded-md border border-border p-0.5 shadow-sm">
              {(Object.keys(CANVAS_ACTION_LABELS) as CanvasAIAction[]).map((action) => (
                <AIActionButton
                  key={action}
                  action={action}
                  onClick={() => handleAIAction(action)}
                  disabled={!selectedText || isRewriting}
                  isLoading={currentAction === action}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="ml-2 h-8 w-8"
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Floating Selection Tooltip - Animated (only in edit mode) */}
        <AnimatePresence>
          {selectedText && viewMode === 'edit' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-md border border-primary/20 rounded-full px-4 py-2 flex items-center gap-3"
            >
              <span className="text-xs font-medium text-primary flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                Texte sélectionné
              </span>
              <div className="h-3 w-[1px] bg-border" />
              <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                "{selectedText}"
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor / Preview Content */}
        {viewMode === 'edit' ? (
          <Textarea
            ref={textareaRef}
            value={cleanedContent}
            onChange={(e) => onContentChange(e.target.value)}
            onSelect={handleTextSelect}
            className="flex-1 resize-none border-none focus-visible:ring-0 p-8 text-base leading-relaxed font-mono bg-transparent scrollbar-thin scrollbar-thumb-muted-foreground/20"
            placeholder="Commencez à écrire ou générez du contenu..."
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-8 prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanedContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* SEO & Meta Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full flex flex-col gap-4 overflow-hidden"
          >
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex-1 overflow-y-auto">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Optimisation SEO
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Titre Meta (SERP)</Label>
                    <span className={cn(
                      "text-[10px] font-mono",
                      metaTitle?.length && metaTitle.length > 60 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {metaTitle?.length || 0}/60
                    </span>
                  </div>
                  <Input
                    value={metaTitle || ''}
                    onChange={(e) => onMetaChange(e.target.value, metaDescription)}
                    className="h-9 text-sm"
                    placeholder="Titre optimisé..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Meta Description</Label>
                    <span className={cn(
                      "text-[10px] font-mono",
                      metaDescription?.length && metaDescription.length > 160 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {metaDescription?.length || 0}/160
                    </span>
                  </div>
                  <Textarea
                    value={metaDescription || ''}
                    onChange={(e) => onMetaChange(metaTitle, e.target.value)}
                    className="min-h-[100px] text-sm resize-none"
                    placeholder="Description qui incite au clic..."
                  />
                </div>

                {/* Preview Card */}
                <div className="pt-4 border-t border-border/50">
                  <Label className="text-xs font-medium text-muted-foreground mb-3 block">Aperçu Google</Label>
                  <div className="bg-background border rounded-lg p-3 select-none">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <Globe className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-foreground font-medium">Mon Site Web</span>
                        <span className="text-[9px] text-muted-foreground">https://monsite.com/blog/...</span>
                      </div>
                    </div>
                    <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-sm font-medium hover:underline truncate">
                      {stripMarkdown(metaTitle || "Titre de votre article")}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {stripMarkdown(metaDescription || "La description de votre article apparaîtra ici dans les résultats de recherche...")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
