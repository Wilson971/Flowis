import { Plus, Heading1, Heading2, Heading3, AlignLeft, ListChecks, Table2, MousePointerClick, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DescriptionBlockType } from '@/types/descriptionStructure';
import { BLOCK_TYPE_LABELS } from '@/types/descriptionStructure';

type Props = {
    onAddBlock: (type: DescriptionBlockType) => void;
    existingTypes: DescriptionBlockType[];
    disabled?: boolean;
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

// Couleurs pour les boutons
const BLOCK_BUTTON_COLORS: Record<DescriptionBlockType, string> = {
    heading_h1: 'hover:bg-primary/10 hover:text-primary hover:border-primary/30',
    heading_h2: 'hover:bg-primary/10 hover:text-primary hover:border-primary/30',
    heading_h3: 'hover:bg-primary/10 hover:text-primary hover:border-primary/30',
    paragraph: 'hover:bg-muted-foreground/10 hover:text-muted-foreground hover:border-muted-foreground/30',
    benefits_list: 'hover:bg-success/10 hover:text-success hover:border-success/30',
    specs_table: 'hover:bg-warning/10 hover:text-warning hover:border-warning/30',
    cta: 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30',
    separator: 'hover:bg-muted-foreground/10 hover:text-muted-foreground hover:border-muted-foreground/30',
};

// Ordre d'affichage des blocs
const BLOCK_ORDER: DescriptionBlockType[] = [
    'heading_h1',
    'heading_h2',
    'heading_h3',
    'paragraph',
    'benefits_list',
    'specs_table',
    'cta',
    'separator',
];

// Blocs qui ne peuvent être ajoutés qu'une seule fois
const UNIQUE_BLOCKS: DescriptionBlockType[] = ['heading_h1', 'specs_table', 'cta'];

export const BlockPalette = ({ onAddBlock, existingTypes, disabled }: Props) => {
    const canAddBlock = (type: DescriptionBlockType): boolean => {
        if (UNIQUE_BLOCKS.includes(type) && existingTypes.includes(type)) {
            return false;
        }
        return true;
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full border-dashed h-10 gap-2"
                    disabled={disabled}
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un bloc
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="center">
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                        Choisir un type de bloc
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {BLOCK_ORDER.map((type) => {
                            const Icon = BLOCK_ICONS[type];
                            const isDisabled = !canAddBlock(type);

                            return (
                                <Button
                                    key={type}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => !isDisabled && onAddBlock(type)}
                                    disabled={isDisabled}
                                    className={cn(
                                        "h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left transition-all",
                                        BLOCK_BUTTON_COLORS[type],
                                        isDisabled && "opacity-40 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-xs font-medium truncate">
                                            {BLOCK_TYPE_LABELS[type]}
                                        </span>
                                    </div>
                                    {isDisabled && (
                                        <span className="text-[10px] text-muted-foreground">
                                            Déjà ajouté
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
