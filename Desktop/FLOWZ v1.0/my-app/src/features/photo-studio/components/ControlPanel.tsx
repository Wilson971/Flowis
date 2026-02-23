"use client";

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, ArrowLeftRight, Play, Settings, Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MorphSurface } from '@/components/ui/morph-surface';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { PresetGrid } from './PresetGrid';
import { PresetsModal, SettingsModal, type GenerationSettings } from './modals';
import { useStudioContext } from '@/features/photo-studio/context/StudioContext';
import { useSceneGeneration } from '@/features/photo-studio/hooks/useSceneGeneration';
import { useSceneGenerationMachine } from '@/features/photo-studio/hooks/useSceneGenerationMachine';
import { useCreateGenerationSession } from '@/features/photo-studio/hooks/useGenerationSessions';
import { useBrandStyles } from '@/features/photo-studio/hooks/useBrandStyles';
import { useProductClassification } from '@/features/photo-studio/hooks/useProductClassification';
import { getPresetById } from '@/features/photo-studio/constants/scenePresets';
import { getViewPresetById } from '@/features/photo-studio/constants/viewPresets';
import { buildEnhancedPrompt, getTemperature } from '@/features/photo-studio/lib/promptBuilder';

// ---------------------------------------------------------------------------
// Prompt injection detection (same patterns as FloWriter)
// ---------------------------------------------------------------------------

const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /pretend\s+(to\s+be|you\'?re)\s+/i,
  /new\s+instructions?:/i,
  /system\s*prompt:/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
];

function containsInjection(text: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
}

// ---------------------------------------------------------------------------

type ControlPanelProps = {
  productId: string;
  productName: string;
  sourceImageUrl: string | null;
};

const DEFAULT_SETTINGS: GenerationSettings = {
  quality: 'standard',
  aspectRatio: '1:1',
  viewPresetId: 'single',
  creativityLevel: 50,
};

const QUICK_CHIPS = [
  { label: '+ Lumiere Chaude', prompt: 'warm golden hour lighting' },
  { label: '+ Vue Macro', prompt: 'macro close-up shot' },
  { label: '+ Cinematic', prompt: 'cinematic lighting, dramatic' },
];

export const ControlPanel = ({ productId, productName, sourceImageUrl }: ControlPanelProps) => {
  const {
    state,
    setSelectedPreset,
    setSelectedBrandStyle,
    setCustomPrompt,
    setIsGenerating,
    addSessionImage,
    updateSessionImage,
    setSessionImages,
    setSelectedImage,
  } = useStudioContext();

  const {
    selectedPresetId,
    selectedBrandStyleId,
    customPrompt,
    isGenerating,
    sessionImages,
  } = state;

  const machine = useSceneGenerationMachine();
  const sceneGeneration = useSceneGeneration();
  const createSession = useCreateGenerationSession();
  const { data: brandStyles } = useBrandStyles();
  const { data: classification } = useProductClassification(productId, sourceImageUrl);
  const recommendedPresetIds = classification?.suggestedSceneIds ?? [];

  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [presetsModalOpen, setPresetsModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const selectedBrandStyle = brandStyles?.find(s => s.id === selectedBrandStyleId);

  const getCreditsForQuality = (quality: string) => {
    switch (quality) {
      case 'high': return 2;
      case 'ultra': return 4;
      default: return 1;
    }
  };

  const viewPreset = getViewPresetById(settings.viewPresetId);
  const imagesCount = viewPreset?.imagesCount || 1;
  const totalCredits = getCreditsForQuality(settings.quality) * imagesCount;

  const handleChipClick = useCallback((chip: typeof QUICK_CHIPS[0]) => {
    const newPrompt = customPrompt ? `${customPrompt}, ${chip.prompt}` : chip.prompt;
    setCustomPrompt(newPrompt);
  }, [customPrompt, setCustomPrompt]);

  const handleGenerate = useCallback(async () => {
    if (!sourceImageUrl || !selectedPresetId) {
      toast.error('Selection requise', { description: 'Veuillez selectionner une mise en scene' });
      return;
    }

    // Prompt injection check
    if (customPrompt && containsInjection(customPrompt)) {
      toast.error('Prompt invalide', {
        description: 'Le texte saisi contient du contenu non autorise. Veuillez reformuler.',
      });
      return;
    }

    setIsGenerating(true, `gen-${Date.now()}`);

    try {
      const scenePreset = getPresetById(selectedPresetId);
      if (!scenePreset) throw new Error('Preset non trouve');

      const currentViewPreset = getViewPresetById(settings.viewPresetId);
      const anglesToGenerate = currentViewPreset?.angles || ['front'];
      const totalImages = anglesToGenerate.length;

      machine.startProcessing();

      toast.info(
        totalImages > 1
          ? `Creation de ${totalImages} images (angles de vue)`
          : "L'IA cree votre scene",
      );

      // Build enhanced prompt
      const basePrompt = buildEnhancedPrompt({
        productName,
        presetPromptModifier: scenePreset.promptModifier || scenePreset.description,
        presetMood: scenePreset.mood,
        quality: settings.quality,
        aspectRatio: settings.aspectRatio,
        customPrompt: customPrompt || undefined,
        brandStyle: selectedBrandStyle ?? null,
        creativity: settings.creativityLevel,
      });

      const temperature = getTemperature(settings.creativityLevel);

      // Create optimistic placeholders
      const tempIds: string[] = [];
      const timestamp = Date.now();

      for (let i = 0; i < anglesToGenerate.length; i++) {
        const tempId = `temp-${timestamp}-${i}`;
        tempIds.push(tempId);
        addSessionImage({
          id: tempId,
          url: '',
          type: 'generated',
          status: 'loading',
          createdAt: timestamp + i,
          sessionId: tempId,
        });
      }

      setSelectedImage(tempIds[0], 'generated');

      // Generate for each view angle
      for (let i = 0; i < anglesToGenerate.length; i++) {
        const viewAngle = anglesToGenerate[i];
        const tempId = tempIds[i];

        machine.setStep('generating');

        try {
          const result = await sceneGeneration.mutateAsync({
            imageUrl: sourceImageUrl,
            prompt: `${basePrompt}. Camera angle: ${viewAngle}.`,
            productName,
            temperature,
            quality: settings.quality,
            aspectRatio: settings.aspectRatio,
          });

          const newImageUrl = result.imageBase64;

          // Save session to DB
          const session = await createSession.mutateAsync({
            product_id: productId,
            source_image_url: sourceImageUrl,
            generated_image_url: newImageUrl,
            prompt_used: `${basePrompt} (${viewAngle})`,
            preset_name: `${scenePreset.name} - ${viewAngle}`,
            settings: { ...settings, viewAngle },
          });

          // Update optimistic placeholder with real data
          updateSessionImage(tempId, {
            id: session.id,
            url: newImageUrl,
            status: 'active',
            sessionId: session.id,
          });

          // Update selection to real ID
          if (state.selectedImageId === tempId) {
            setSelectedImage(session.id, 'generated');
          }

        } catch (itemError: any) {
          console.error(`Error generating angle ${viewAngle}:`, itemError);
          const currentImages = state.sessionImages;
          setSessionImages(currentImages.filter(img => img.id !== tempId));
          toast.error('Echec partiel', { description: `Impossible de generer l'angle ${viewAngle}` });
        }
      }

      toast.success(
        totalImages > 1
          ? `${totalImages} images sont pretes dans la timeline`
          : "L'image est prete dans la timeline",
      );

      machine.finishSuccess();
    } catch (error: any) {
      console.error('Generation error:', error);
      machine.fail(error.message || 'Une erreur est survenue');
      toast.error('Erreur de generation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsGenerating(false, null);
    }
  }, [
    sourceImageUrl, selectedPresetId, selectedBrandStyle, selectedBrandStyleId,
    customPrompt, productName, productId, settings,
    setIsGenerating, addSessionImage, setSelectedImage, createSession,
    sceneGeneration, machine, updateSessionImage, setSessionImages, state.selectedImageId, state.sessionImages,
  ]);

  return (
    <div className="flex flex-col h-full min-w-0 bg-card">
      {/* Product Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
          <div className="w-12 h-12 rounded-lg bg-accent overflow-hidden flex-shrink-0">
            {sourceImageUrl ? (
              <img src={sourceImageUrl} alt={productName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium leading-none uppercase tracking-wide text-primary">Produit Actuel</p>
            <p className="font-medium text-foreground truncate mt-0.5">{productName || 'Sans nom'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent">
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Center */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          <PresetGrid
            selectedPresetId={selectedPresetId}
            onSelectPreset={setSelectedPreset}
            recommendedPresetIds={recommendedPresetIds}
            onOpenModal={() => setPresetsModalOpen(true)}
            maxVisiblePresets={4}
          />

          {/* Brand Style Badge */}
          {selectedBrandStyle && (
            <div className={cn("flex items-center gap-2 p-2.5 rounded-xl", "bg-primary/10 border border-primary/20")}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Palette className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary/80 font-medium uppercase tracking-wider">Style de marque actif</p>
                  <p className="text-sm font-medium text-foreground truncate">{selectedBrandStyle.name}</p>
                </div>
                {selectedBrandStyle.brand_colors && selectedBrandStyle.brand_colors.length > 0 && (
                  <div className="flex gap-0.5 flex-shrink-0">
                    {selectedBrandStyle.brand_colors.slice(0, 3).map((color: string, i: number) => (
                      <div key={i} className="w-3 h-3 rounded-full border border-border/40" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedBrandStyle(null)} className="h-7 w-7 rounded-lg hover:bg-primary/20">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}

          {/* Quick Chips */}
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <Button
                key={chip.label}
                variant="outline"
                size="sm"
                onClick={() => handleChipClick(chip)}
                className="rounded-full text-xs bg-background/50 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
              >
                {chip.label}
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 space-y-3 border-t border-border">
        {/* MorphSurface Prompt */}
        <MorphSurface
          fullWidth
          collapsedHeight={44}
          expandedHeight={160}
          dockLabel=""
          placeholder="Decrivez votre scene ideale..."
          onSubmit={async () => {
            // Value already synced via controlled textarea onChange
          }}
          renderTrigger={({ onClick }) => (
            <button
              type="button"
              onClick={onClick}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 w-full h-full px-3 text-sm text-left",
                "text-muted-foreground hover:text-foreground transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
              <span className="flex-1 truncate">
                {customPrompt || "Decrivez votre scene ideale..."}
              </span>
            </button>
          )}
          renderContent={({ onClose }) => (
            <div className="flex flex-col h-full p-2 gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prompt de scene
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSettingsModalOpen(true)}
                    className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <span className="flex items-center gap-0.5">
                    <kbd className="w-5 h-5 bg-muted text-muted-foreground text-xs rounded flex items-center justify-center">⌘</kbd>
                    <kbd className="px-1.5 h-5 bg-muted text-muted-foreground text-xs rounded flex items-center justify-center">Enter</kbd>
                  </span>
                </div>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                name="message"
                placeholder="Decrivez votre scene ideale..."
                className={cn(
                  "flex-1 resize-none w-full text-sm outline-none p-2 rounded-xl",
                  "bg-muted/50 dark:bg-accent/50",
                  "caret-primary placeholder:text-muted-foreground",
                  "focus-visible:ring-1 focus-visible:ring-primary/30"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose()
                  if (e.key === 'Enter' && e.metaKey) onClose()
                }}
                disabled={isGenerating}
                spellCheck={false}
                autoFocus
              />
            </div>
          )}
        />

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !sourceImageUrl || !selectedPresetId}
          className="w-full h-12 text-sm font-semibold gap-2 rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300 relative overflow-hidden group"
          size="lg"
        >
          <div className="absolute inset-0 bg-primary-foreground/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <div className="relative flex items-center justify-center gap-2">
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generation...</>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform duration-300" />
                Generer
                <span className="ml-2 px-2 py-0.5 rounded-lg bg-primary-foreground/20 text-xs font-bold uppercase tracking-wider">
                  {totalCredits} Credit{totalCredits > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </Button>
      </div>

      {/* Modals */}
      <PresetsModal
        open={presetsModalOpen}
        onOpenChange={setPresetsModalOpen}
        selectedPresetId={selectedPresetId}
        onSelectPreset={setSelectedPreset}
        selectedBrandStyleId={selectedBrandStyleId}
        onSelectBrandStyle={setSelectedBrandStyle}
        recommendedPresetIds={recommendedPresetIds}
      />
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        settings={settings}
        onSettingsChange={setSettings}
        availableCredits={10}
      />
    </div>
  );
};
