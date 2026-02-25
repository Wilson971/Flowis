'use client';

/**
 * LinkBuilderCard - Internal linking suggestions sidebar card
 *
 * Uses semantic embeddings (Google text-multilingual-embedding-002 + pgvector)
 * to suggest related articles for internal linking.
 */

import React, { useState, useCallback } from 'react';
import {
  Link2,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
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
import { useArticleEditContext } from '../context';
import {
  useLinkSuggestions,
  useArticleLinkStats,
  useSaveLink,
} from '@/hooks/linkbuilder';
import { useEmbedArticle } from '@/hooks/linkbuilder';
import { cn } from '@/lib/utils';
import type { LinkSuggestion } from '@/types/linkbuilder';

// ============================================================================
// SIMILARITY BADGE
// ============================================================================

function SimilarityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 85
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : pct >= 70
        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        : 'bg-muted text-muted-foreground border-border';

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] font-bold px-1.5 py-0', color)}
    >
      {pct}%
    </Badge>
  );
}

// ============================================================================
// SUGGESTION ITEM
// ============================================================================

interface SuggestionItemProps {
  suggestion: LinkSuggestion;
  onAccept: (suggestion: LinkSuggestion) => void;
  onReject: (suggestion: LinkSuggestion) => void;
  isProcessing: boolean;
}

function SuggestionItem({ suggestion, onAccept, onReject, isProcessing }: SuggestionItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group rounded-lg border border-border/40 bg-background/50 p-3 transition-colors hover:border-border/80">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <SimilarityBadge score={suggestion.similarity} />
            <h4 className="text-xs font-semibold text-foreground truncate">
              {suggestion.title}
            </h4>
          </div>
          {suggestion.excerpt && (
            <p
              className={cn(
                'mt-1 text-[11px] text-muted-foreground leading-relaxed',
                !expanded && 'line-clamp-2'
              )}
            >
              {suggestion.excerpt}
            </p>
          )}
          {suggestion.excerpt && suggestion.excerpt.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5"
            >
              {expanded ? (
                <>
                  Réduire <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Lire plus <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onAccept(suggestion)}
                  disabled={isProcessing}
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Insérer le lien
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onReject(suggestion)}
                  disabled={isProcessing}
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Ignorer
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {suggestion.link && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={suggestion.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Voir l'article
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LINK BUILDER CARD
// ============================================================================

export function LinkBuilderCard() {
  const { articleId, article } = useArticleEditContext();
  const storeId = (article as Record<string, unknown> | undefined)?.store_id as string | undefined;

  // Hooks
  const {
    data: suggestionsData,
    isLoading: isLoadingSuggestions,
    refetch: refetchSuggestions,
    isFetching,
  } = useLinkSuggestions({
    articleId: articleId || '',
    storeId: storeId || '',
    enabled: !!articleId && !!storeId,
  });

  const { data: linkStats } = useArticleLinkStats(articleId || '', !!articleId);

  const embedMutation = useEmbedArticle();
  const saveLinkMutation = useSaveLink();

  // State
  const [showAll, setShowAll] = useState(false);

  const suggestions = suggestionsData?.suggestions || [];
  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 5);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = useCallback(() => {
    if (articleId) {
      embedMutation.mutate(articleId, {
        onSuccess: () => {
          refetchSuggestions();
        },
      });
    }
  }, [articleId, embedMutation, refetchSuggestions]);

  const handleAccept = useCallback(
    (suggestion: LinkSuggestion) => {
      if (!articleId) return;
      saveLinkMutation.mutate({
        source_article_id: articleId,
        target_article_id: suggestion.id,
        anchor_text: suggestion.title,
        similarity_score: suggestion.similarity,
        status: 'accepted',
      });
    },
    [articleId, saveLinkMutation]
  );

  const handleReject = useCallback(
    (suggestion: LinkSuggestion) => {
      if (!articleId) return;
      saveLinkMutation.mutate({
        source_article_id: articleId,
        target_article_id: suggestion.id,
        anchor_text: suggestion.title,
        similarity_score: suggestion.similarity,
        status: 'rejected',
      });
    },
    [articleId, saveLinkMutation]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  const isProcessing =
    embedMutation.isPending || saveLinkMutation.isPending || isFetching;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
      <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
              <Link2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Maillage interne
              </p>
              <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                LinkBuilder
              </h3>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRefresh}
                  disabled={isProcessing}
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isProcessing && 'animate-spin')}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Recalculer les suggestions
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-4">
        {/* Link Stats */}
        {linkStats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              {linkStats.outgoing_links} sortant{linkStats.outgoing_links !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3 rotate-180" />
              {linkStats.incoming_links} entrant{linkStats.incoming_links !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoadingSuggestions && !suggestionsData && (
          <div className="flex flex-col items-center gap-2 py-6">
            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
            <p className="text-xs text-muted-foreground">
              Analyse sémantique en cours...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingSuggestions && suggestions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">
                Aucune suggestion
              </p>
              <p className="text-[11px] text-muted-foreground max-w-[200px]">
                {!suggestionsData?.source_article.has_embedding
                  ? 'Cliquez sur le bouton refresh pour indexer cet article et découvrir des liens pertinents.'
                  : 'Aucun article similaire trouvé. Publiez plus de contenu pour enrichir le maillage.'}
              </p>
            </div>
            {!suggestionsData?.source_article.has_embedding && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={handleRefresh}
                disabled={isProcessing}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Indexer l'article
              </Button>
            )}
          </div>
        )}

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {displayedSuggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={handleAccept}
                onReject={handleReject}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}

        {/* Show more / less */}
        {suggestions.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-[11px] text-primary/70 hover:text-primary py-1"
          >
            {showAll
              ? `Afficher moins`
              : `Voir ${suggestions.length - 5} suggestion${suggestions.length - 5 > 1 ? 's' : ''} de plus`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
