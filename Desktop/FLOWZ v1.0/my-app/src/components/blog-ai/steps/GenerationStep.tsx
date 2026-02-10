'use client';

/**
 * GenerationStep Component
 *
 * Step 4: AI article generation with streaming progress
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Brain,
  Search,
  Pencil,
  CheckCircle,
  Clock,
  Terminal,
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { Progress } from '@/components/ui/progress';
import { styles } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import type { ArticleData, GenerationProgress, GenerationPhase } from '@/types/blog-ai';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// PHASE CONFIGURATION
// ============================================================================

const phaseConfig: Record<
  GenerationPhase,
  { label: string; icon: React.ElementType; color: string }
> = {
  idle: { label: 'En attente', icon: Clock, color: 'text-muted-foreground' },
  analyzing: { label: 'Analyse du sujet', icon: Brain, color: 'text-primary' },
  researching: { label: 'Recherche d\'informations', icon: Search, color: 'text-primary' },
  writing: { label: 'Rédaction en cours', icon: Pencil, color: 'text-primary' },
  optimizing: { label: 'Optimisation SEO', icon: Sparkles, color: 'text-primary' },
  complete: { label: 'Terminé', icon: CheckCircle, color: 'text-success' },
  error: { label: 'Erreur', icon: Clock, color: 'text-destructive' },
};

// ============================================================================
// PHASE INDICATOR
// ============================================================================

interface PhaseIndicatorProps {
  phase: GenerationPhase;
  isActive: boolean;
  isComplete: boolean;
  isPending: boolean;
}

function PhaseIndicator({ phase, isActive, isComplete, isPending }: PhaseIndicatorProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border',
        isActive ? 'bg-background border-primary/20 shadow-sm scale-102 translate-x-1' : 'border-transparent',
        isPending && 'opacity-50'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm',
          isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/10',
          isComplete && 'bg-success/10 text-success',
          isPending && 'bg-muted text-muted-foreground'
        )}
      >
        {isActive ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isComplete ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {config.label}
        </span>
        {isActive && (
          <span className="text-[10px] text-muted-foreground animate-pulse">Traitement en cours...</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// GENERATION STEP
// ============================================================================

interface GenerationStepProps {
  articleData: ArticleData;
  progress: GenerationProgress;
  onStartGeneration: () => Promise<void>;
  isLoading: boolean;
}

export function GenerationStep({
  articleData,
  progress,
  onStartGeneration,
  isLoading,
}: GenerationStepProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const isComplete = progress.phase === 'complete';
  const isError = progress.phase === 'error';
  const hasStarted = progress.phase !== 'idle';

  // Track elapsed time in real-time
  useEffect(() => {
    if (hasStarted && !isComplete && !isError) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - (startTimeRef.current || Date.now()));
      }, 100);
      return () => clearInterval(interval);
    } else if (!hasStarted) {
      startTimeRef.current = null;
      setElapsedTime(0);
    }
  }, [hasStarted, isComplete, isError]);

  // Auto-scroll as content streams in
  useEffect(() => {
    if (contentRef.current && progress.streamedContent) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [progress.streamedContent]);

  // Calculate progress percentage
  const progressPercent =
    progress.totalSections > 0
      ? (progress.currentSection / progress.totalSections) * 100
      : 0;

  const phases: GenerationPhase[] = [
    'analyzing',
    'researching',
    'writing',
    'optimizing',
  ];

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  if (!hasStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center border border-primary/20">
            <Sparkles className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Prêt à rédiger ?</h2>
          <p className="text-muted-foreground text-lg">
            L'IA a tout ce qu'il faut. Elle va maintenant analyser, rechercher et rédiger votre article de
            <span className="font-semibold text-foreground mx-1">~{articleData.config.targetWordCount} mots</span>
            sur le sujet
            <span className="font-semibold text-foreground mx-1">"{articleData.topic}"</span>.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
          <div className="p-4 rounded-xl border bg-card/50 text-center">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Ton</p>
            <p className="font-medium">{articleData.config.tone}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card/50 text-center">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Style</p>
            <p className="font-medium">{articleData.config.style}</p>
          </div>
          <div className="p-4 rounded-xl border bg-card/50 text-center">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Langue</p>
            <p className="font-medium uppercase">{articleData.config.language}</p>
          </div>
        </div>

        <Button
          onClick={onStartGeneration}
          disabled={isLoading}
          size="lg"
          className="h-14 px-8 text-lg gap-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Initialisation...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Lancer la rédaction magique
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Left Column: Progress & Status */}
      <div className="lg:col-span-3 lg:border-r border-border/50 pr-6 space-y-6">
        <div className="space-y-4">
          {phases.map((phase) => {
            const phaseIndex = phases.indexOf(phase);
            const currentPhaseIndex = phases.indexOf(progress.phase as GenerationPhase);

            return (
              <PhaseIndicator
                key={phase}
                phase={phase}
                isActive={progress.phase === phase}
                isComplete={progress.phase === 'complete' || currentPhaseIndex > phaseIndex}
                isPending={progress.phase !== 'complete' && currentPhaseIndex < phaseIndex}
              />
            );
          })}
        </div>

        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">
            <Clock className="w-4 h-4" />
            <span>Statistiques</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Temps écoulé:</span>
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mots générés:</span>
            <span className="font-mono text-primary font-bold">{progress.streamedContent?.split(/\s+/).filter(Boolean).length || 0}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Terminal/Preview */}
      <div className="lg:col-span-9 flex flex-col h-full overflow-hidden space-y-4">

        {/* Active Action Bar */}
        <div className={cn(
          "flex items-center justify-between bg-card border rounded-lg p-3",
          isError ? "border-destructive/60 bg-destructive/5" : "border-border/60"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isComplete ? "bg-success" : isError ? "bg-destructive" : "bg-primary animate-pulse"
            )} />
            <span className={cn(
              "text-sm font-medium",
              isError ? "text-destructive" : "text-muted-foreground"
            )}>
              {isError
                ? `Erreur: ${progress.error || "Une erreur est survenue"}`
                : isComplete
                  ? "Génération terminée avec succès"
                  : progress.currentSectionTitle || "Initialisation..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(isComplete || isError) && (
              <Button
                variant={isError ? "destructive" : "outline"}
                size="sm"
                onClick={onStartGeneration}
                className="h-7 text-xs gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                {isError ? "Réessayer" : "Relancer"}
              </Button>
            )}
            {!isComplete && !isError && (
              <Badge variant="outline" className="font-mono text-xs">
                {Math.round(progressPercent)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Terminal View */}
        <div className="flex-1 relative rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">flowriter-engine.log</span>
          </div>

          <div
            ref={contentRef}
            className="flex-1 p-6 overflow-y-auto font-serif text-lg leading-relaxed text-foreground/90 scrollbar-thin scrollbar-thumb-muted-foreground/20"
          >
            {isError ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-destructive">Erreur de génération</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {progress.error || "Une erreur inattendue s'est produite lors de la génération de l'article."}
                  </p>
                </div>
                {progress.streamedContent && (
                  <div className="w-full mt-4 p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Contenu généré avant l'erreur:</p>
                    <div className="prose prose-neutral dark:prose-invert max-w-none prose-sm whitespace-pre-wrap font-sans opacity-60">
                      {progress.streamedContent}
                    </div>
                  </div>
                )}
              </div>
            ) : progress.streamedContent ? (
              <MarkdownRenderer
                content={progress.streamedContent}
                className="font-sans"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="font-mono text-sm">Waiting for input stream...</p>
              </div>
            )}

            {/* Cursor blinking at end */}
            {!isComplete && !isError && progress.streamedContent && (
              <span className="inline-block w-2 h-5 bg-primary align-middle animate-pulse ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
