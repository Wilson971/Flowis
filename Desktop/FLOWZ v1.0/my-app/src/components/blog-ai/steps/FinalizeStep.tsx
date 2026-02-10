'use client';

/**
 * FinalizeStep Component
 *
 * Step 6: Final success screen and publishing options
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Eye,
  FileText,
  Copy,
  Download,
  Clipboard,
  BadgeCheck,
  Globe,
  Loader2,
  Save,
  Database,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { cn } from '@/lib/utils';
import type { ArticleData, SeoAnalysisResult } from '@/types/blog-ai';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ============================================================================
// ARTICLE PREVIEW DIALOG (Preserved)
// ============================================================================

interface ArticlePreviewProps {
  content: string;
  title: string;
}

function ArticlePreview({ content, title }: ArticlePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-colors">
          <Eye className="w-5 h-5" />
          <span>View full article</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 outline-none border-border bg-background">
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle>Article Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-8 bg-surface-1">
          <article className="max-w-4xl mx-auto bg-background p-12 rounded-xl border border-border">
            <h1 className="text-4xl font-black mb-8">{title}</h1>
            <MarkdownRenderer content={content} />
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// FINALIZE STEP
// ============================================================================

interface FinalizeStepProps {
  articleData: ArticleData;
  seoAnalysis: SeoAnalysisResult | null;
  onAnalyzeSeo: () => Promise<void>;
  onSaveDraft: () => Promise<void>;
  onSchedule: (date: Date) => Promise<void>;
  onPublish: () => Promise<void>;
  isAnalyzing: boolean;
  isSaving: boolean;
  isPublishing: boolean;
}

export function FinalizeStep({
  articleData,
  onSaveDraft,
  onPublish,
  isSaving,
  isPublishing,
}: FinalizeStepProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(articleData.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveDraft = async () => {
    await onSaveDraft();
    setIsSaved(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-10">

      {/* Success Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-1 rounded-[2.5rem] p-6 mb-6 text-center flex flex-col items-center gap-6 border border-border"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center text-foreground border border-border animate-in zoom-in-50 duration-500">
            <BadgeCheck className="w-12 h-12 stroke-[1.5]" />
          </div>
          <div className="text-xs font-black uppercase tracking-[0.5em] text-primary ml-[0.5em]">Flowriter</div>
        </div>

        <div className="max-w-[500px] flex flex-col gap-3">
          <h2 className="text-4xl font-black text-foreground tracking-tight">Publication Ready</h2>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed">
            Your article has been generated and optimized for search performance.
          </p>
        </div>

        <div className="flex gap-4">
          <ArticlePreview content={articleData.content} title={articleData.title} />
        </div>
      </motion.div>

      {/* Primary Save Action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 mb-6 border border-primary/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Database className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-lg">Sauvegarder l'article</h3>
              <p className="text-sm text-muted-foreground">Enregistrer dans votre bibliothèque d'articles</p>
            </div>
          </div>
          <Button
            onClick={handleSaveDraft}
            disabled={isSaving || isSaved}
            className={cn(
              "h-12 px-8 text-sm font-bold rounded-xl transition-all duration-300",
              isSaved
                ? "bg-success text-success-foreground hover:bg-success/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Sauvegardé !
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Sauvegarder en brouillon
              </>
            )}
          </Button>
        </div>
        {isSaved && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-success mt-3 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Article sauvegardé ! Retrouvez-le dans "Tous les articles"
          </motion.p>
        )}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-backwards">

        {/* Export Section */}
        <section className="flex flex-col gap-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Assets & Offline</h3>
          <div className="grid gap-3">

            {/* PDF Export */}
            <button className="flex items-center justify-between p-6 bg-surface-1 rounded-3xl border border-border transition-all duration-300 group text-left">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-muted text-muted-foreground rounded-2xl group-hover:bg-destructive/10 group-hover:text-destructive transition-colors border border-transparent group-hover:border-destructive/20">
                  <FileText className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">Portable Document</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">PDF Format</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
            </button>

            {/* DOCX Export */}
            <button className="flex items-center justify-between p-6 bg-surface-1 rounded-3xl border border-border transition-all duration-300 group text-left">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-muted text-muted-foreground rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-transparent group-hover:border-primary/20">
                  <FileText className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">Microsoft Word</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">DOCX Format</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className={cn(
                "flex items-center justify-between p-6 rounded-3xl border transition-all duration-300 group text-left",
                isCopied
                  ? "bg-success/10 border-success/30"
                  : "bg-surface-1 border-border"
              )}
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl transition-colors",
                  isCopied
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                )}>
                  {isCopied ? <Check className="w-6 h-6 stroke-[1.5]" /> : <Copy className="w-6 h-6 stroke-[1.5]" />}
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">{isCopied ? 'Copié !' : 'Contenu brut'}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Presse-papier</p>
                </div>
              </div>
              <Clipboard className={cn(
                "w-5 h-5 transition-colors",
                isCopied ? "text-success" : "text-muted-foreground/30 group-hover:text-foreground"
              )} />
            </button>

          </div>
        </section>

        {/* Publish Section */}
        <section className="flex flex-col gap-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Native Sync</h3>
          <div className="grid gap-3">

            {/* WordPress */}
            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/20">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-background rounded-2xl border border-border">
                  <Globe className="w-6 h-6 text-foreground stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">WordPress CMS</p>
                  <span className="text-[9px] font-black uppercase tracking-widest text-success">Authenticated</span>
                </div>
              </div>
              <Button
                onClick={onPublish}
                disabled={isPublishing}
                className="h-10 px-6 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Now'}
              </Button>
            </div>

            {/* Shopify */}
            <div className="flex items-center justify-between p-6 bg-surface-1 rounded-3xl border border-border opacity-60 grayscale">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-2xl">
                  <div className="font-black text-muted-foreground">S</div>
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">Shopify Store</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sync Disabled</p>
                </div>
              </div>
              <button className="h-10 px-6 bg-muted text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest rounded-full cursor-not-allowed">Inactive</button>
            </div>

            {/* Ghost */}
            <div className="flex items-center justify-between p-6 bg-surface-1 rounded-3xl border border-border opacity-60 grayscale">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-2xl">
                  <div className="font-black text-muted-foreground">G</div>
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">Ghost Portal</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sync Disabled</p>
                </div>
              </div>
              <button className="h-10 px-6 bg-muted text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest rounded-full cursor-not-allowed">Inactive</button>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
