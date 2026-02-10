import { memo } from "react";
import { Sparkles } from "lucide-react";
import { DescriptionStructureBuilder } from "@/components/description-builder";
import { blocksToLegacyOptions as blocksToLegacy, legacyOptionsToBlocks as legacyToBlocks } from "@/types/descriptionStructure";
import { ModularGenerationSettings } from "@/types/imageGeneration";

interface BatchGenerationExpertTabProps {
    settings: ModularGenerationSettings;
    onSettingsChange: (settings: ModularGenerationSettings) => void;
}

export const BatchGenerationExpertTab = memo(function BatchGenerationExpertTab({
    settings,
    onSettingsChange,
}: BatchGenerationExpertTabProps) {
    return (
        <div className="space-y-6 mt-0">
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div>
                        <h4 className="text-sm font-semibold">Mode Architecte</h4>
                        <p className="text-xs text-muted-foreground">Définissez la structure exacte de vos descriptions</p>
                    </div>
                </div>

                <DescriptionStructureBuilder
                    blocks={settings.structure_options.blocks || legacyToBlocks({
                        h2_titles: settings.structure_options.h2_titles,
                        benefits_list: settings.structure_options.benefits_list,
                        benefits_count: settings.structure_options.benefits_count,
                        specs_table: settings.structure_options.specs_table,
                        cta: settings.structure_options.cta,
                    })}
                    onChange={(blocks) => {
                        const legacyOptions = blocksToLegacy(blocks);
                        onSettingsChange({
                            ...settings,
                            structure_options: {
                                ...settings.structure_options,
                                ...legacyOptions,
                                blocks,
                                useBlockBuilder: true,
                            }
                        });
                    }}
                />
            </div>
        </div>
    );
});
