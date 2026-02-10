'use client';

/**
 * ConfigStep Component v2.0
 *
 * Step 2: Article configuration (tone, style, length, presets, custom instructions)
 * Now includes persona presets and custom instructions field
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  Check,
  Globe,
  AlignLeft,
  User2,
  MessageSquare,
  BookOpen,
  Sparkles,
  Zap,
  GraduationCap,
  Pen,
  Target,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { styles } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import {
  TONE_OPTIONS,
  STYLE_OPTIONS,
  PERSONA_OPTIONS,
} from '@/types/blog-ai';
import type { ArticleConfig } from '@/types/blog';

// ============================================================================
// PERSONA PRESETS (Quick Setup)
// ============================================================================

interface PersonaPreset {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  config: Partial<ArticleConfig>;
}

const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: 'expert-seo',
    label: 'Expert SEO',
    description: 'Optimisé pour le référencement',
    icon: Target,
    config: {
      tone: 'Expert',
      style: 'Blog Lifestyle',
      persona: 'intermediate',
      targetWordCount: 2000,
      includeTableOfContents: true,
      includeFAQ: true,
    },
  },
  {
    id: 'beginner-friendly',
    label: 'Vulgarisation',
    description: 'Accessible à tous les niveaux',
    icon: Sparkles,
    config: {
      tone: 'Conversationnel',
      style: 'Tutorial',
      persona: 'beginner',
      targetWordCount: 1500,
      includeTableOfContents: true,
      includeFAQ: false,
    },
  },
  {
    id: 'storyteller',
    label: 'Storytelling',
    description: 'Narratif et engageant',
    icon: Pen,
    config: {
      tone: 'Narratif',
      style: 'Storytelling',
      persona: 'intermediate',
      targetWordCount: 1800,
      includeTableOfContents: false,
      includeFAQ: false,
    },
  },
  {
    id: 'academic',
    label: 'Académique',
    description: 'Rigoureux et structuré',
    icon: GraduationCap,
    config: {
      tone: 'Expert',
      style: 'Académique',
      persona: 'expert',
      targetWordCount: 2500,
      includeTableOfContents: true,
      includeFAQ: false,
    },
  },
];

// ============================================================================
// OPTION CARD
// ============================================================================

interface OptionCardProps {
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ElementType;
}

function OptionCard({ label, description, isSelected, onClick, icon: Icon }: OptionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md h-full flex flex-col group",
        isSelected
          ? "bg-primary/5 border-primary shadow-sm"
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {Icon ? <Icon className="w-4 h-4" /> : <div className="w-4 h-4" />}
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <span className={cn("font-semibold text-sm", isSelected ? "text-primary" : "text-foreground")}>
          {label}
        </span>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PRESET CARD
// ============================================================================

interface PresetCardProps {
  preset: PersonaPreset;
  isSelected: boolean;
  onSelect: () => void;
}

function PresetCard({ preset, isSelected, onSelect }: PresetCardProps) {
  const Icon = preset.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-md group w-full",
        isSelected
          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className={cn("font-semibold text-sm block", isSelected ? "text-primary" : "text-foreground")}>
            {preset.label}
          </span>
          <p className="text-xs text-muted-foreground truncate">
            {preset.description}
          </p>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-auto">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// CONFIG STEP
// ============================================================================

interface ConfigStepProps {
  config: ArticleConfig & { customInstructions?: string; presetPersona?: string };
  keywords: string[];
  onUpdateConfig: (config: Partial<ArticleConfig & { customInstructions?: string; presetPersona?: string }>) => void;
  onToggleKeyword: (keyword: string) => void;
}

export function ConfigStep({
  config,
  keywords,
  onUpdateConfig,
  onToggleKeyword,
}: ConfigStepProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    config.presetPersona || null
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle preset selection
  const handlePresetSelect = (preset: PersonaPreset) => {
    setSelectedPreset(preset.id);
    onUpdateConfig({
      ...preset.config,
      presetPersona: preset.id,
    });
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
          <Sliders className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration de la rédaction</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Choisissez un preset rapide ou personnalisez chaque aspect de votre article.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <Label className="text-base font-semibold">Configuration rapide</Label>
          <Badge variant="outline" className="text-[10px]">Recommandé</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PERSONA_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset === preset.id}
              onSelect={() => handlePresetSelect(preset)}
            />
          ))}
        </div>
      </div>

      {/* Toggle Advanced */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Sliders className="w-3 h-3" />
          {showAdvanced ? 'Masquer les options avancées' : 'Afficher les options avancées'}
        </button>
      </div>

      {/* Advanced Options (Collapsible) */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column: Style & Tone */}
            <div className="space-y-8">
              {/* Tone Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <Label className="text-base font-semibold">Ton de l'article</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TONE_OPTIONS.slice(0, 4).map((option) => (
                    <OptionCard
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      isSelected={config.tone === option.value}
                      onClick={() => {
                        setSelectedPreset(null);
                        onUpdateConfig({ tone: option.value, presetPersona: undefined });
                      }}
                      icon={MessageSquare}
                    />
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <Label className="text-base font-semibold">Style d'écriture</Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {STYLE_OPTIONS.slice(0, 4).map((option) => (
                    <OptionCard
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      isSelected={config.style === option.value}
                      onClick={() => {
                        setSelectedPreset(null);
                        onUpdateConfig({ style: option.value, presetPersona: undefined });
                      }}
                      icon={BookOpen}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Audience & Technicals */}
            <div className="space-y-8">
              {/* Target Audience */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-primary" />
                  <Label className="text-base font-semibold">Audience cible</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PERSONA_OPTIONS.slice(0, 4).map((option) => (
                    <OptionCard
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      isSelected={config.persona === option.value}
                      onClick={() => {
                        setSelectedPreset(null);
                        onUpdateConfig({ persona: option.value, presetPersona: undefined });
                      }}
                      icon={User2}
                    />
                  ))}
                </div>
              </div>

              {/* Word Count */}
              <div className="space-y-6 pt-2 border-t border-border/50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-primary" />
                      <Label className="text-base font-semibold">Longueur cible</Label>
                    </div>
                    <Badge variant="outline" className="text-sm font-semibold border-primary/20 bg-primary/5 text-primary">
                      {config.targetWordCount} mots
                    </Badge>
                  </div>

                  <div className="px-1">
                    <Slider
                      value={[config.targetWordCount]}
                      onValueChange={([value]) => {
                        setSelectedPreset(null);
                        onUpdateConfig({ targetWordCount: value, presetPersona: undefined });
                      }}
                      min={500}
                      max={5000}
                      step={100}
                      className="w-full cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground px-1 font-medium">
                    <span>Rapide (500)</span>
                    <span>Standard (1500)</span>
                    <span>Approfondi (3000+)</span>
                  </div>
                </div>
              </div>

              {/* Language & Options */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Langue</Label>
                    <Select
                      value={config.language}
                      onValueChange={(value) => onUpdateConfig({ language: value })}
                    >
                      <SelectTrigger className="w-full">
                        <Globe className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium block mb-3">Options structurelles</Label>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground font-normal">Table des matières</Label>
                      <Switch
                        checked={config.includeTableOfContents}
                        onCheckedChange={(checked) =>
                          onUpdateConfig({ includeTableOfContents: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground font-normal">Section FAQ</Label>
                      <Switch
                        checked={config.includeFAQ}
                        onCheckedChange={(checked) =>
                          onUpdateConfig({ includeFAQ: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom Instructions */}
      <div className="space-y-4 pt-6 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Pen className="w-4 h-4 text-primary" />
          <Label className="text-base font-semibold">Instructions personnalisées</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Ajoutez des directives spécifiques pour personnaliser le style de rédaction.
                  Ex: "Utilise le vouvoiement", "Évite le jargon technique", "Inclus des exemples concrets"
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="outline" className="text-[10px] ml-auto">Optionnel</Badge>
        </div>
        <Textarea
          value={config.customInstructions || ''}
          onChange={(e) => onUpdateConfig({ customInstructions: e.target.value })}
          placeholder="Ex: Utilise le vouvoiement. Évite le jargon technique. Inclus des exemples concrets de la vie quotidienne..."
          className="min-h-[100px] resize-none text-sm"
          maxLength={1000}
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Directives supplémentaires pour l'IA</span>
          <span>{(config.customInstructions || '').length}/1000</span>
        </div>
      </div>

      {/* Keywords Summary */}
      {keywords.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold">Mots-clés inclus:</span>
            <span className="text-xs text-muted-foreground">({keywords.length} sélectionnés)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="pl-2 pr-1 py-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => onToggleKeyword(keyword)}
              >
                {keyword}
                <span className="ml-1.5 opacity-40">×</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
