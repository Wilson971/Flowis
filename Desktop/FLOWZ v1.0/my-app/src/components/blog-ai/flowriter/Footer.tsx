'use client';

import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Cloud, CloudOff } from 'lucide-react';
import { FlowriterStep } from '@/types/blog-ai';
import { cn } from '@/lib/utils';
import type { FooterProps } from './types';

export function Footer({
  currentStep,
  totalSteps,
  canGoBack,
  canGoForward,
  isLoading,
  showResetButton,
  isSyncing,
  syncError,
  lastSyncTime,
  onBack,
  onNext,
  onResetOpen,
}: FooterProps) {
  return (
    <div className="px-12 py-5 bg-background flex items-center justify-between mt-auto border-t border-border/50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Phase {currentStep} / {totalSteps}
          </div>

          {/* Sync Status Indicator */}
          <div
            className={cn(
              "flex items-center gap-1.5 text-[10px] transition-all duration-300",
              isSyncing ? "text-primary" : syncError ? "text-destructive" : "text-muted-foreground/40"
            )}
            title={syncError || (lastSyncTime ? `Dernière sync: ${lastSyncTime.toLocaleTimeString('fr-FR')}` : 'Synchronisation automatique')}
          >
            {isSyncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : syncError ? (
              <CloudOff className="w-3 h-3" />
            ) : (
              <Cloud className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {isSyncing ? 'Sync...' : syncError ? 'Erreur' : 'Auto-save'}
            </span>
          </div>
        </div>

        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={cn(
            "h-10 px-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-xs font-bold flex items-center gap-2",
            !canGoBack && "opacity-0 pointer-events-none"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Reset Button */}
        {showResetButton && (
          <button
            onClick={onResetOpen}
            disabled={isLoading}
            className={cn(
              "h-10 px-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-xs font-medium flex items-center gap-2",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            title="Recommencer le workflow"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Recommencer</span>
          </button>
        )}

        <button
          onClick={onNext}
          disabled={!canGoForward}
          className={cn(
            "h-12 px-8 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
            canGoForward
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          {currentStep === FlowriterStep.FINALIZE ? 'Complete Generation' : 'Next Step'}
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
