import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// Couleurs d'accent pour chaque type de bloc
const BLOCK_ACCENT_COLORS: Record<DescriptionBlockType, string> = {
    heading_h1: 'text-violet-500',
    heading_h2: 'text-primary',
    heading_h3: 'text-cyan-500',
    paragraph: 'text-slate-400',
    benefits_list: 'text-emerald-500',
    specs_table: 'text-amber-500',
    cta: 'text-rose-500',
    separator: 'text-muted-foreground',
};

const BLOCK_ACCENT_BG: Record<DescriptionBlockType, string> = {
    heading_h1: 'bg-violet-500/10',
    heading_h2: 'bg-primary/10',
    heading_h3: 'bg-cyan-500/10',
    paragraph: 'bg-slate-500/10',
    benefits_list: 'bg-emerald-500/10',
    specs_table: 'bg-amber-500/10',
    cta: 'bg-rose-500/10',
    separator: 'bg-muted',
};

export const BlockConfigSheet = ({ block, open, onClose, onSave }: Props) => {
    const [config, setConfig] = useState<BlockConfig>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!mounted) return null;

    const Icon = block ? BLOCK_ICONS[block.type] : null;
    const accentColor = block ? BLOCK_ACCENT_COLORS[block.type] : 'text-primary';
    const accentBg = block ? BLOCK_ACCENT_BG[block.type] : 'bg-primary/10';

    const content = (
        <AnimatePresence>
            {open && block && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[10000] lg:hidden"
                        onClick={onClose}
                    />

                    {/* Desktop backdrop (subtle) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[10000] hidden lg:block"
                        onClick={onClose}
                    />

                    {/* Floating Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: 'spring', stiffness: 350, damping: 25,
                            opacity: { duration: 0.2 },
                        }}
                        className="fixed right-4 top-4 bottom-4 bg-card/90 backdrop-blur-2xl border border-border/50 shadow-2xl z-[10001] flex flex-col rounded-2xl overflow-hidden"
                        style={{ width: '400px', maxWidth: 'calc(100vw - 2rem)' }}
                    >
                        {/* Multi-layer glassmorphism */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/3 pointer-events-none" />
                        <div
                            className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none"
                            style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 50%)' }}
                        />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col h-full">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-border/50 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {Icon && (
                                        <div className={`p-2 rounded-lg ${accentBg}`}>
                                            <Icon className={`h-4 w-4 ${accentColor}`} />
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-base font-semibold tracking-tight">
                                            {BLOCK_TYPE_LABELS[block.type]}
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {BLOCK_TYPE_DESCRIPTIONS[block.type]}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mr-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Scrollable Body */}
                            <ScrollArea className="flex-1 overflow-auto min-h-0">
                                <div className="px-6 py-6 space-y-6">

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
                                                        <SelectItem value="benefits">Avantages &amp; bénéfices</SelectItem>
                                                        <SelectItem value="usage">Utilisation &amp; conseils</SelectItem>
                                                        <SelectItem value="conclusion">Conclusion &amp; récap</SelectItem>
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
                                        <div className="py-8 text-center">
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                                <Minus className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Le séparateur n'a pas de configuration spécifique.
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Il ajoute une ligne de séparation visuelle.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Footer */}
                            <div className="p-4 border-t border-border/50 bg-card/95 backdrop-blur-sm">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={onClose} className="flex-1">
                                        Annuler
                                    </Button>
                                    <Button onClick={handleSave} className="flex-1 gap-2">
                                        <Save className="h-3.5 w-3.5" />
                                        Enregistrer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};
