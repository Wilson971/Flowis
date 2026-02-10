"use client";

import React from 'react';
import {
  Settings, Sparkles, Camera, Palette,
  Square, Smartphone, Monitor, RectangleVertical, ShoppingBag,
  AlertTriangle, Image, RotateCw, Search, Focus, Home,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { GenerationQuality, AspectRatio } from '@/features/photo-studio/types/studio';
import { VIEW_PRESETS, getViewPresetById } from '@/features/photo-studio/constants/viewPresets';

export type GenerationSettings = {
  quality: GenerationQuality;
  aspectRatio: AspectRatio;
  viewPresetId: string;
  creativityLevel: number;
};

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  availableCredits?: number;
};

const QUALITY_OPTIONS = [
  { value: 'standard' as GenerationQuality, label: 'Standard', description: 'Rapide' },
  { value: 'high' as GenerationQuality, label: 'Haute qualite', description: 'Detaille' },
  { value: 'ultra' as GenerationQuality, label: 'Ultra HD', description: 'Maximum' },
];

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1' as AspectRatio, label: 'Carre (1:1)', Icon: Square, description: 'Instagram, catalogues' },
  { value: '4:5' as AspectRatio, label: 'Portrait (4:5)', Icon: Smartphone, description: 'Instagram Feed' },
  { value: '16:9' as AspectRatio, label: 'Paysage (16:9)', Icon: Monitor, description: 'Bannieres web' },
  { value: '9:16' as AspectRatio, label: 'Story (9:16)', Icon: RectangleVertical, description: 'Stories' },
  { value: '3:4' as AspectRatio, label: 'Produit (3:4)', Icon: ShoppingBag, description: 'E-commerce' },
];

const VIEW_PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  single: Image,
  'multi-3': RotateCw,
  'multi-4': RotateCw,
  details: Search,
  '360': Focus,
  lifestyle: Home,
};

export const SettingsModal = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  availableCredits = 10,
}: SettingsModalProps) => {
  const selectedPreset = getViewPresetById(settings.viewPresetId);

  const updateSetting = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Parametres de Generation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quality */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              Qualite de generation
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('quality', option.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all',
                    settings.quality === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Square className="w-4 h-4 text-muted-foreground" />
              Format de l'image
            </Label>
            <Select value={settings.aspectRatio} onValueChange={(v) => updateSetting('aspectRatio', v as AspectRatio)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIO_OPTIONS.map((option) => {
                  const IconComponent = option.Icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-3">
                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                        <span className="flex flex-col items-start">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* View presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              Angles de vue
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {VIEW_PRESETS.map((preset) => {
                const IconComponent = VIEW_PRESET_ICONS[preset.id] || Image;
                return (
                  <button
                    key={preset.id}
                    onClick={() => updateSetting('viewPresetId', preset.id)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all',
                      settings.viewPresetId === preset.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                        <IconComponent className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{preset.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{preset.description}</div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5">{preset.imagesCount} img</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedPreset && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                <span className="font-medium">Angles : </span>
                {selectedPreset.angles.join(' -> ')}
              </div>
            )}
          </div>

          {/* Creativity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Niveau de creativite
              </Label>
              <Badge variant="outline">{settings.creativityLevel}%</Badge>
            </div>
            <Slider
              value={[settings.creativityLevel]}
              onValueChange={([v]) => updateSetting('creativityLevel', v)}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fidele</span>
              <span>Creatif</span>
            </div>
            {settings.creativityLevel > 75 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Niveau eleve : le resultat peut etre moins previsible</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => onOpenChange(false)}>Appliquer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
