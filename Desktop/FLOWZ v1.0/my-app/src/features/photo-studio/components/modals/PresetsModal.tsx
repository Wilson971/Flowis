"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Check, Sparkles, Images } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllPresets } from '@/features/photo-studio/constants/scenePresets';

type PresetsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  selectedBrandStyleId: string | null;
  onSelectBrandStyle: (styleId: string) => void;
  recommendedPresetIds?: string[];
};

const PRESET_CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'studio', label: 'Studio' },
  { id: 'nature', label: 'Nature' },
  { id: 'luxury', label: 'Luxe' },
  { id: 'creative', label: 'Creatif' },
];

const getPresetCategory = (preset: any): string => {
  return preset.sceneCategory || preset.category || 'studio';
};

const getPresetThumbnail = (preset: any): string => {
  return preset.thumbnailUrl || preset.thumbnail || 'https://picsum.photos/200';
};

export const PresetsModal = ({
  open,
  onOpenChange,
  selectedPresetId,
  onSelectPreset,
  selectedBrandStyleId,
  onSelectBrandStyle,
  recommendedPresetIds = [],
}: PresetsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const allPresets = useMemo(() => getAllPresets(), []);

  const filteredPresets = useMemo(() => {
    let presets = [...allPresets];
    if (activeCategory !== 'all') {
      presets = presets.filter(p => getPresetCategory(p) === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      presets = presets.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        getPresetCategory(p).toLowerCase().includes(query)
      );
    }
    return presets.sort((a, b) => {
      const aRec = recommendedPresetIds.includes(a.id) ? 0 : 1;
      const bRec = recommendedPresetIds.includes(b.id) ? 0 : 1;
      return aRec - bRec;
    });
  }, [allPresets, searchQuery, activeCategory, recommendedPresetIds]);

  const handleSelect = (presetId: string) => {
    onSelectPreset(presetId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Bibliotheque
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="scenes" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 border-b border-border bg-muted/30">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger
                value="scenes"
                className={cn(
                  "gap-2 px-4 py-2.5 rounded-none border-b-2 data-[state=active]:shadow-none",
                  "data-[state=active]:border-primary data-[state=inactive]:border-transparent",
                  "data-[state=active]:bg-transparent"
                )}
              >
                <Images className="w-4 h-4" />
                Scenes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="scenes" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher une mise en scene..." className="pl-10" />
                {searchQuery && (
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery('')}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-b border-border bg-muted/20">
              <div className="flex flex-wrap gap-2">
                {PRESET_CATEGORIES.map((cat) => (
                  <Button key={cat.id} variant={activeCategory === cat.id ? 'default' : 'outline'} size="sm" className="h-8" onClick={() => setActiveCategory(cat.id)}>
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1 px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  const isRecommended = recommendedPresetIds.includes(preset.id);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelect(preset.id)}
                      className={cn(
                        'relative group rounded-xl overflow-hidden border-2 transition-all duration-200',
                        'hover:shadow-lg hover:scale-[1.02]',
                        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="aspect-[4/3] relative">
                        <img src={getPresetThumbnail(preset)} alt={preset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {isRecommended && (
                          <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 text-[10px]">Recommande</Badge>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="font-semibold text-white text-sm">{preset.name}</h3>
                          <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{preset.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredPresets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Aucune mise en scene trouvee</p>
                  <Button variant="link" className="mt-2" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
                    Reinitialiser les filtres
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
