import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider'; // Missing component, will use Input for now or create slider? Sample used Slider.
import { Badge } from '@/components/ui/badge';
import { Heading1, Heading2, Heading3, AlignLeft, ListChecks, Table2, MousePointerClick, Minus } from 'lucide-react';
import type { DescriptionBlock, DescriptionBlockType, BlockConfig, BulletStyle, CtaStyle } from '@/types/descriptionStructure';
import { BLOCK_TYPE_LABELS, BLOCK_TYPE_DESCRIPTIONS } from '@/types/descriptionStructure';

type Props = {
    block: DescriptionBlock | null;
    open: boolean;
    onClose: () => void;
    onSave: (blockId: string, config: BlockConfig) => void;
};

// Mapping des icônes
const BLOCK_ICONS: Record<DescriptionBlockType, React.ComponentType<{ className?: string }>> = {
    heading_h1: Heading1,
    heading_h2: Heading2,
    heading_h3: Heading3,
    paragraph: AlignLeft,
    benefits_list: ListChecks,
    specs_table: Table2,
    cta: MousePointerClick,
    separator: Minus,
};

export const BlockConfigSheet = ({ block, open, onClose, onSave }: Props) => {
    const [config, setConfig] = useState<BlockConfig>({});

    useEffect(() => {
        if (block) {
            setConfig({ ...block.config });
        }
    }, [block]);

    const handleSave = () => {
        if (block) {
            onSave(block.id, config);
            onClose();
        }
    };

    const updateConfig = <K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    if (!block) return null;

    const Icon = BLOCK_ICONS[block.type];

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent side="right" className="w-[400px] sm:max-w-[400px]" style={{ zIndex: 1200 }}>
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-left">{BLOCK_TYPE_LABELS[block.type]}</SheetTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {BLOCK_TYPE_DESCRIPTIONS[block.type]}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Configuration des Headings */}
                    {(block.type === 'heading_h1' || block.type === 'heading_h2' || block.type === 'heading_h3') && (
                        <>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="include-keyword" className="text-sm font-medium">
                                        Inclure le mot-clé focus
                                    </Label>
                                    <Switch
                                        id="include-keyword"
                                        checked={config.includeKeyword ?? true}
                                        onCheckedChange={(checked) => updateConfig('includeKeyword', checked)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Le mot-clé principal sera inclus dans ce titre pour le SEO
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="placeholder" className="text-sm font-medium">
                                    Template (optionnel)
                                </Label>
                                <Input
                                    id="placeholder"
                                    value={config.placeholder || ''}
                                    onChange={(e) => updateConfig('placeholder', e.target.value)}
                                    placeholder="Ex: Découvrez {product_name}"
                                    className="h-9"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Variables : {'{product_name}'}, {'{brand}'}, {'{category}'}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Configuration du Paragraphe */}
                    {block.type === 'paragraph' && (
                        <>
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                    Objectif de mots : {config.wordCount || 50}
                                </Label>
                                {/* Fallback Input since Slider missing */}
                                <Input
                                    type="number"
                                    value={config.wordCount || 50}
                                    onChange={(e) => updateConfig('wordCount', parseInt(e.target.value))}
                                    min={25}
                                    max={150}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>25 mots</span>
                                    <span>150 mots</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Focus du contenu</Label>
                                <Select
                                    value={config.focusOn || 'intro'}
                                    onValueChange={(value) => updateConfig('focusOn', value as 'intro' | 'benefits' | 'usage' | 'conclusion')}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="intro">Introduction / Présentation</SelectItem>
                                        <SelectItem value="benefits">Avantages & bénéfices</SelectItem>
                                        <SelectItem value="usage">Utilisation & conseils</SelectItem>
                                        <SelectItem value="conclusion">Conclusion & récap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {/* Configuration de la Liste de bénéfices */}
                    {block.type === 'benefits_list' && (
                        <>
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                    Nombre de puces : {config.itemCount || 5}
                                </Label>
                                {/* Fallback Input since Slider missing */}
                                <Input
                                    type="number"
                                    value={config.itemCount || 5}
                                    onChange={(e) => updateConfig('itemCount', parseInt(e.target.value))}
                                    min={2}
                                    max={10}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>2 puces</span>
                                    <span>10 puces</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Style des puces</Label>
                                <Select
                                    value={config.bulletStyle || 'checkmark'}
                                    onValueChange={(value) => updateConfig('bulletStyle', value as BulletStyle)}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bullet">• Puces classiques</SelectItem>
                                        <SelectItem value="checkmark">✓ Coches</SelectItem>
                                        <SelectItem value="numbered">1. Numérotée</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {/* Configuration du Tableau */}
                    {block.type === 'specs_table' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Nombre de colonnes</Label>
                                <Select
                                    value={String(config.columns || 2)}
                                    onValueChange={(value) => updateConfig('columns', Number(value))}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2">2 colonnes (Caractéristique / Valeur)</SelectItem>
                                        <SelectItem value="3">3 colonnes (avec Détails)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="show-header" className="text-sm font-medium">
                                    Afficher l'en-tête du tableau
                                </Label>
                                <Switch
                                    id="show-header"
                                    checked={config.showHeader ?? true}
                                    onCheckedChange={(checked) => updateConfig('showHeader', checked)}
                                />
                            </div>
                        </>
                    )}

                    {/* Configuration du CTA */}
                    {block.type === 'cta' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Style du CTA</Label>
                                <Select
                                    value={config.ctaStyle || 'button'}
                                    onValueChange={(value) => updateConfig('ctaStyle', value as CtaStyle)}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="button">Bouton proéminent</SelectItem>
                                        <SelectItem value="link">Lien textuel</SelectItem>
                                        <SelectItem value="banner">Bannière complète</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cta-text" className="text-sm font-medium">
                                    Texte du CTA (suggestion)
                                </Label>
                                <Input
                                    id="cta-text"
                                    value={config.ctaText || ''}
                                    onChange={(e) => updateConfig('ctaText', e.target.value)}
                                    placeholder="Ex: Acheter maintenant"
                                    className="h-9"
                                />
                            </div>
                        </>
                    )}

                    {/* Séparateur - pas de config */}
                    {block.type === 'separator' && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            Le séparateur n'a pas de configuration spécifique.
                            <br />
                            Il ajoute une ligne de séparation visuelle.
                        </div>
                    )}
                </div>

                <SheetFooter className="pt-4 border-t gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Annuler
                    </Button>
                    <Button onClick={handleSave} className="flex-1">
                        Enregistrer
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
