import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings, Trash2, Heading1, Heading2, Heading3, AlignLeft, ListChecks, Table2, MousePointerClick, Minus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DescriptionBlock, DescriptionBlockType } from '@/types/descriptionStructure';
import { BLOCK_TYPE_LABELS } from '@/types/descriptionStructure';

type Props = {
    block: DescriptionBlock;
    index: number;
    onToggle: () => void;
    onConfigure: () => void;
    onRemove: () => void;
};

// Mapping des icônes Lucide pour chaque type de bloc
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

// Couleurs pour les badges de type
const BLOCK_COLORS: Record<DescriptionBlockType, string> = {
    heading_h1: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400 dark:border-violet-800',
    heading_h2: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
    heading_h3: 'bg-cyan-500/10 text-cyan-700 border-cyan-200 dark:text-cyan-400 dark:border-cyan-800',
    paragraph: 'bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-400 dark:border-slate-700',
    benefits_list: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
    specs_table: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
    cta: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800',
    separator: 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400 dark:border-gray-700',
};

// Descriptions courtes pour afficher les configurations
const getConfigSummary = (block: DescriptionBlock): string | null => {
    const { type, config } = block;

    switch (type) {
        case 'benefits_list':
            return `${config.itemCount || 5} puces`;
        case 'specs_table':
            return `${config.columns || 2} colonnes`;
        case 'paragraph':
            return config.focusOn ? `${config.focusOn}` : null;
        case 'cta':
            return config.ctaStyle || null;
        default:
            return null;
    }
};

export const SortableBlockItem = ({ block, index, onToggle, onConfigure, onRemove }: Props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = BLOCK_ICONS[block.type];
    const configSummary = getConfigSummary(block);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 bg-card transition-all duration-200",
                isDragging && "opacity-50 border-primary shadow-lg scale-[1.02] z-50",
                !block.enabled && "opacity-60 bg-muted/30",
                "hover:border-primary/40"
            )}
        >
            {/* Handle de drag */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors"
                aria-label="Réorganiser"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Numéro d'ordre */}
            <span className="w-6 h-6 rounded-full bg-muted text-xs font-medium flex items-center justify-center flex-shrink-0">
                {index + 1}
            </span>

            {/* Icône et infos du bloc */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge
                    variant="outline"
                    className={cn("px-2 py-1 flex items-center gap-1.5", BLOCK_COLORS[block.type])}
                >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{BLOCK_TYPE_LABELS[block.type]}</span>
                </Badge>

                {configSummary && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                        ({configSummary})
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <Switch
                    checked={block.enabled}
                    onCheckedChange={onToggle}
                    aria-label={block.enabled ? "Désactiver" : "Activer"}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onConfigure}
                    className="h-8 w-8"
                    aria-label="Configurer"
                >
                    <Settings className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Supprimer"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
