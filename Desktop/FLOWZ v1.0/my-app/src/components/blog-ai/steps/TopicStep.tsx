'use client';

/**
 * TopicStep Component
 *
 * Step 1: Topic input and title suggestions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Check, LineChart, Zap, ShieldCheck, Search, FileEdit, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TitleSuggestion } from '@/types/blog-ai';

// ============================================================================
// TITLE SUGGESTION CARD
// ============================================================================

interface TitleCardProps {
  suggestion: TitleSuggestion;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function TitleCard({ suggestion, isSelected, onSelect, index }: TitleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        "relative rounded-2xl p-6 cursor-pointer transition-all duration-300 group overflow-hidden flex items-center gap-6",
        isSelected
          ? "bg-primary-muted border border-primary/30"
          : "bg-surface-1 hover:bg-surface-2 border border-border"
      )}
    >
      {/* Selection state accent */}
      {isSelected && (
        <motion.div
          layoutId="title-accent"
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
        />
      )}

      {/* Checkbox-style indicator */}
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300",
        isSelected ? "bg-primary border-primary scale-110" : "border-border group-hover:border-muted-foreground/30"
      )}>
        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
      </div>

      <div className="flex-1 space-y-2">
        <h3 className={cn(
          "text-lg font-bold leading-tight transition-colors duration-300",
          isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}>
          {suggestion.title}
        </h3>

        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tighter overflow-hidden">
          <span className={cn(
            isSelected ? "text-success" : "text-muted-foreground/60 group-hover:text-muted-foreground"
          )}>
            SEO {suggestion.seoScore}%
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className={cn(
            isSelected ? "text-foreground" : "text-muted-foreground/50"
          )}>
            {suggestion.difficulty} difficulty
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className={cn(
            isSelected ? "text-foreground" : "text-muted-foreground/50"
          )}>
            Volume: {suggestion.searchVolume}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// TOPIC STEP
// ============================================================================

interface TopicStepProps {
  topic: string;
  titleSuggestions: TitleSuggestion[];
  selectedTitle: string;
  selectedKeywords: string[];
  onTopicChange: (topic: string) => void;
  onGenerateTitles: (topic: string) => Promise<void>;
  onSelectTitle: (title: string) => void;
  onToggleKeyword: (keyword: string) => void;
  isLoading: boolean;
}

export function TopicStep({
  topic,
  titleSuggestions,
  selectedTitle,
  selectedKeywords,
  onTopicChange,
  onGenerateTitles,
  onSelectTitle,
  onToggleKeyword,
  isLoading,
}: TopicStepProps) {
  const [localTopic, setLocalTopic] = useState(topic);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localTopic.trim()) {
      onTopicChange(localTopic.trim());
      onGenerateTitles(localTopic.trim());
    }
  };

  const hasSuggestions = titleSuggestions.length > 0;

  return (
    <div className="w-full pb-10">

      {!hasSuggestions ? (
        // INITIAL STATE: Hero Input
        <div className="px-8 py-4 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center mb-6 ring-4 ring-primary/10">
              <Sparkles className="w-10 h-10 fill-primary-foreground" />
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-foreground tracking-tighter mb-2">
              Flow<span className="text-primary">riter</span>
            </h1>
            <div className="h-1.5 w-20 bg-primary rounded-full mb-8" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">What would you like to talk about?</h2>
          <p className="text-muted-foreground text-base mb-6 leading-relaxed max-w-md">
            Describe your subject clearly. Our AI will analyze search trends to propose high-ranking titles for you.
          </p>

          <form onSubmit={handleSubmit} className="w-full relative group mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <input
              className="block w-full pl-12 pr-4 py-4 bg-surface-1 rounded-2xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border border-border text-lg"
              placeholder="Ex: Best practices for e-commerce SEO"
              type="text"
              value={localTopic}
              onChange={(e) => setLocalTopic(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </form>

          <button
            onClick={handleSubmit}
            disabled={!localTopic.trim() || isLoading}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            {isLoading ? 'Generating Ideas...' : 'Generate Titles'}
          </button>

          {/* Feature Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            <div className="p-5 rounded-2xl bg-surface-1 border border-border flex items-start gap-4 transition-all">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Real-time Analysis</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Instant scoring based on search volume.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-1 border border-border flex items-start gap-4 transition-all">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Lightning Fast</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Generate dozens of titles in seconds.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-1 border border-border flex items-start gap-4 transition-all">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Plagiarism Free</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">100% original content ideas.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // RESULTS STATE (Suggestions)
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-3xl mx-auto">
          <div className="text-center">
            <Badge variant="neutral" className="mb-4 text-[10px] font-black uppercase tracking-widest px-3 py-1">
              Ref: {topic}
            </Badge>
            <h2 className="text-3xl font-black tracking-tight mb-2 text-foreground">Select your Angle</h2>
            <p className="text-muted-foreground text-sm font-medium">Which perspective should we adopt for this article?</p>
          </div>

          <div className="grid gap-3">
            {titleSuggestions.map((suggestion, index) => (
              <TitleCard
                key={suggestion.id || index}
                suggestion={suggestion}
                isSelected={selectedTitle === suggestion.title}
                onSelect={() => onSelectTitle(suggestion.title)}
                index={index}
              />
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGenerateTitles(topic)}
              disabled={isLoading}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshButtonIcon isLoading={isLoading} />
              Generate New Ideas
            </Button>
          </div>
        </div>
      )}

      {/* Selected Keywords Preview (only visible if title selected) */}
      {selectedTitle && selectedKeywords.length > 0 && hasSuggestions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-8 rounded-3xl bg-surface-1 border border-border max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 rounded-full bg-surface-1 border border-border flex items-center justify-center">
              <Target className="w-4 h-4 text-foreground" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Strategic Keywords</h4>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className="bg-surface-1 border text-muted-foreground hover:text-destructive cursor-pointer px-4 py-2 rounded-xl transition-all font-bold text-xs border-border"
                onClick={() => onToggleKeyword(keyword)}
              >
                {keyword}
                <span className="ml-2 text-muted-foreground/30">×</span>
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function RefreshButtonIcon({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin mr-1.5" />;
  return <Sparkles className="h-3 w-3 mr-1.5" />;
}
