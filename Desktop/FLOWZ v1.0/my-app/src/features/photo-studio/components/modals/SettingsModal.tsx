"use client";

import React, { useState, useEffect } from 'react';
import {
  Settings, Sparkles, Palette, Shield, Download, Gauge,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useStudioSettings,
  type StudioSettings,
} from '@/features/photo-studio/hooks/useStudioSettings';

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { settings, isLoading, updateSettings } = useStudioSettings();
  const [draft, setDraft] = useState<StudioSettings>(settings);

  // Sync draft when settings load or modal opens
  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  const update = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings.mutate(draft);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setDraft(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Paramètres du Studio
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* ── Génération ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Génération</h3>
              </div>

              {/* Quality */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Qualité</Label>
                <Select
                  value={draft.quality}
                  onValueChange={(v) => update('quality', v as StudioSettings['quality'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse — Rapide</SelectItem>
                    <SelectItem value="medium">Moyenne — Équilibré</SelectItem>
                    <SelectItem value="high">Haute — Détaillé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Température (créativité)</Label>
                  <span className="text-xs font-medium text-foreground">{draft.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[draft.temperature]}
                  onValueChange={([v]) => update('temperature', v)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fidèle</span>
                  <span>Créatif</span>
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Nombre de variantes</Label>
                  <span className="text-xs font-medium text-foreground">{draft.variants}</span>
                </div>
                <Slider
                  value={[draft.variants]}
                  onValueChange={([v]) => update('variants', v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </section>

            <Separator />

            {/* ── Classification ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Classification</h3>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Classification automatique</Label>
                <Switch
                  checked={draft.autoClassify}
                  onCheckedChange={(v) => update('autoClassify', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Auto-sélection des presets</Label>
                <Switch
                  checked={draft.presetAutoSelect}
                  onCheckedChange={(v) => update('presetAutoSelect', v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Seuil de confiance</Label>
                  <span className="text-xs font-medium text-foreground">{draft.confidenceThreshold.toFixed(1)}</span>
                </div>
                <Slider
                  value={[draft.confidenceThreshold]}
                  onValueChange={([v]) => update('confidenceThreshold', v)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </section>

            <Separator />

            {/* ── Quotas & Limites ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Quotas & Limites</h3>
              </div>

              <div className={cn(
                'rounded-xl border border-border p-4 space-y-2',
              )}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quota mensuel</span>
                  <span className="font-medium text-foreground">{draft.monthlyQuota} générations</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: '0%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Les données de consommation seront disponibles après vos premières générations.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Seuil d&apos;alerte</Label>
                  <span className="text-xs font-medium text-foreground">{Math.round(draft.alertThreshold * 100)}%</span>
                </div>
                <Slider
                  value={[draft.alertThreshold * 100]}
                  onValueChange={([v]) => update('alertThreshold', v / 100)}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </section>

            <Separator />

            {/* ── Export ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Export</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Format</Label>
                <Select
                  value={draft.exportFormat}
                  onValueChange={(v) => update('exportFormat', v as StudioSettings['exportFormat'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG — Sans perte</SelectItem>
                    <SelectItem value="jpg">JPG — Léger</SelectItem>
                    <SelectItem value="webp">WebP — Optimisé web</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Résolution</Label>
                <Select
                  value={String(draft.exportResolution)}
                  onValueChange={(v) => update('exportResolution', parseInt(v, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024">1024px</SelectItem>
                    <SelectItem value="2048">2048px</SelectItem>
                    <SelectItem value="4096">4096px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Inclure les métadonnées</Label>
                <Switch
                  checked={draft.includeMetadata}
                  onCheckedChange={(v) => update('includeMetadata', v)}
                />
              </div>
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
