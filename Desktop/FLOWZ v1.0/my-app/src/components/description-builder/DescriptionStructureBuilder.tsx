import { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layers, Sparkles, RotateCcw, Info } from 'lucide-react';
import { SortableBlockItem } from './SortableBlockItem';
import { BlockPalette } from './BlockPalette';
import { BlockConfigSheet } from './BlockConfigSheet';
import type { DescriptionBlock, DescriptionBlockType, BlockConfig } from '@/types/descriptionStructure';
import {
    createBlock,
    STRUCTURE_PRESETS,
    legacyOptionsToBlocks,
} from '@/types/descriptionStructure';

type Props = {
    blocks: DescriptionBlock[];
    onChange: (blocks: DescriptionBlock[]) => void;
    disabled?: boolean;
};

export const DescriptionStructureBuilder = ({ blocks, onChange, disabled }: Props) => {
    const [configBlock, setConfigBlock] = useState<DescriptionBlock | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string>('');

    // Sensors pour le drag & drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Gestion du drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);

            const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
                ...block,
                order: index,
            }));

            onChange(reorderedBlocks);
        }
    }, [blocks, onChange]);

    // Ajouter un bloc
    const handleAddBlock = useCallback((type: DescriptionBlockType) => {
        const newBlock = createBlock(type, blocks.length);
        onChange([...blocks, newBlock]);
    }, [blocks, onChange]);

    // Supprimer un bloc
    const handleRemoveBlock = useCallback((blockId: string) => {
        const filteredBlocks = blocks
            .filter((b) => b.id !== blockId)
            .map((block, index) => ({ ...block, order: index }));
        onChange(filteredBlocks);
    }, [blocks, onChange]);

    // Toggle un bloc
    const handleToggleBlock = useCallback((blockId: string) => {
        const updatedBlocks = blocks.map((b) =>
            b.id === blockId ? { ...b, enabled: !b.enabled } : b
        );
        onChange(updatedBlocks);
    }, [blocks, onChange]);

    // Configurer un bloc
    const handleConfigureBlock = useCallback((block: DescriptionBlock) => {
        setConfigBlock(block);
    }, []);

    // Sauvegarder la config d'un bloc
    const handleSaveConfig = useCallback((blockId: string, config: BlockConfig) => {
        const updatedBlocks = blocks.map((b) =>
            b.id === blockId ? { ...b, config } : b
        );
        onChange(updatedBlocks);
    }, [blocks, onChange]);

    // Appliquer un preset
    const handleApplyPreset = useCallback((presetKey: string) => {
        const preset = STRUCTURE_PRESETS[presetKey as keyof typeof STRUCTURE_PRESETS];
        if (preset) {
            // Créer des copies avec de nouveaux IDs
            const newBlocks = preset.blocks.map((block, index) => ({
                ...block,
                id: `${block.id}-${Date.now()}-${index}`,
                order: index,
            }));
            onChange(newBlocks);
            setSelectedPreset(presetKey);
        }
    }, [onChange]);

    // Reset aux valeurs par défaut
    const handleReset = useCallback(() => {
        const defaultBlocks = legacyOptionsToBlocks({
            h2_titles: true,
            benefits_list: true,
            benefits_count: 5,
            specs_table: false,
            cta: true,
        });
        onChange(defaultBlocks);
        setSelectedPreset('');
    }, [onChange]);

    const enabledCount = blocks.filter((b) => b.enabled).length;
    const blockIds = blocks.map((b) => b.id);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Structure de la description</span>
                    <Badge variant="secondary" className="text-xs">
                        {enabledCount} bloc{enabledCount > 1 ? 's' : ''} actif{enabledCount > 1 ? 's' : ''}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={disabled}
                    className="h-8 text-xs gap-1.5"
                >
                    <RotateCcw className="h-3 w-3" />
                    Réinitialiser
                </Button>
            </div>

            {/* Info */}
            <Alert className="bg-muted/50 border-muted-foreground/20">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                    Glissez-déposez les blocs pour définir l'ordre de génération. Chaque bloc peut être configuré individuellement.
                </AlertDescription>
            </Alert>

            {/* Presets */}
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Select value={selectedPreset} onValueChange={handleApplyPreset} disabled={disabled}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Appliquer un preset..." />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(STRUCTURE_PRESETS).map(([key, preset]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                                <div className="flex flex-col">
                                    <span className="font-medium">{preset.name}</span>
                                    <span className="text-muted-foreground">{preset.description}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Liste des blocs */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {blocks.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                Aucun bloc défini. Ajoutez des blocs ci-dessous.
                            </div>
                        ) : (
                            blocks.map((block, index) => (
                                <SortableBlockItem
                                    key={block.id}
                                    block={block}
                                    index={index}
                                    onToggle={() => handleToggleBlock(block.id)}
                                    onConfigure={() => handleConfigureBlock(block)}
                                    onRemove={() => handleRemoveBlock(block.id)}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Palette d'ajout */}
            <BlockPalette
                onAddBlock={handleAddBlock}
                existingTypes={blocks.map((b) => b.type)}
                disabled={disabled}
            />

            {/* Sheet de configuration */}
            <BlockConfigSheet
                block={configBlock}
                open={!!configBlock}
                onClose={() => setConfigBlock(null)}
                onSave={handleSaveConfig}
            />
        </div>
    );
};
