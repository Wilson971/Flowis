import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
import { BatchGenerationPanel, CONTENT_TYPES, AltTextProgress } from "./BatchGenerationPanel";
import { BatchGenerationRightSettingsPanel } from "./BatchGenerationRightSettingsPanel";
import { ModularGenerationSettings } from "@/types/imageGeneration";

interface BatchGenerationSheetProps {
    isOpen?: boolean;
    selectedCount: number;
    onGenerate: (types: string[], enableSerpAnalysis: boolean, forceRegenerate?: boolean) => void;
    onOpenSettings: () => void;
    onClose?: () => void;
    isGenerating?: boolean;
    isAdvancedSettingsOpen?: boolean;
    pendingApprovalsCount?: number;
    syncableProductsCount?: number;
    onApproveAll?: () => void;
    onRejectAll?: () => void;
    onPushToStore?: () => void;
    onCancelSync?: () => void;
    isProcessingBulkAction?: boolean;
    altTextProgress?: AltTextProgress;
    onOpenBulkApproval?: () => void;
    sseProgressMessage?: string;
    modelName?: string;
    settings?: ModularGenerationSettings;
    onSettingsChange?: (settings: ModularGenerationSettings) => void;
    onCloseSettings?: () => void;
}

export function BatchGenerationSheet({
    isOpen = false,
    selectedCount,
    onGenerate,
    onOpenSettings,
    onClose,
    isGenerating = false,
    isAdvancedSettingsOpen = false,
    pendingApprovalsCount = 0,
    syncableProductsCount = 0,
    onApproveAll,
    onRejectAll,
    onPushToStore,
    onCancelSync,
    isProcessingBulkAction = false,
    altTextProgress,
    onOpenBulkApproval,
    sseProgressMessage,
    modelName,
    settings,
    onSettingsChange,
    onCloseSettings,
}: BatchGenerationSheetProps) {
    const isProcessingAltTexts = altTextProgress?.status === "processing";

    const [selectedTypes, setSelectedTypes] = useLocalStorage<string[]>(STORAGE_KEYS.BATCH_GENERATION_SELECTED_TYPES, {
        defaultValue: CONTENT_TYPES.filter(t => t.defaultEnabled).map(t => t.id),
    });

    const [forceRegenerate, setForceRegenerate] = useLocalStorage<boolean>(STORAGE_KEYS.BATCH_GENERATION_FORCE_REGENERATE, {
        defaultValue: false,
    });

    const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(STORAGE_KEYS.BATCH_GENERATION_COLLAPSED, {
        defaultValue: false,
    });

    // Loading Messages
    const LOADING_MESSAGES: Record<string, string> = {
        title: "Rédaction du titre...",
        short_description: "Synthèse de la description...",
        description: "Rédaction du contenu détaillé...",
        seo_title: "Optimisation du titre SEO...",
        meta_description: "Création de la méta-description...",
        sku: "Génération du SKU...",
        alt_text: "Analyse des images...",
    };

    const [progressMessage, setProgressMessage] = useState("Préparation...");

    useEffect(() => {
        if (!isGenerating) {
            setProgressMessage("Préparation...");
            return;
        }

        if (sseProgressMessage) {
            setProgressMessage(sseProgressMessage);
            return;
        }

        const activeMessages = selectedTypes
            .map(type => LOADING_MESSAGES[type])
            .filter(Boolean);

        if (activeMessages.length === 0) {
            setProgressMessage("Génération en cours...");
            return;
        }

        let currentIndex = 0;
        setProgressMessage(activeMessages[0]);

        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % activeMessages.length;
            setProgressMessage(activeMessages[currentIndex]);
        }, 2000);

        return () => clearInterval(interval);
    }, [isGenerating, selectedTypes, sseProgressMessage]);


    const toggleType = useCallback((typeId: string) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            return newTypes;
        });
    }, [setSelectedTypes]);

    if (typeof window === 'undefined') return null;

    // Determine the numeric width for the Right Settings Panel
    let settingsPanelWidth = 520;
    if (typeof window !== 'undefined') {
        const viewportWidth = window.innerWidth;
        if (viewportWidth < 1280 && viewportWidth >= 1024) {
            settingsPanelWidth = 480;
        } else if (viewportWidth < 1024) {
            settingsPanelWidth = 400; // Mobile/tablet width
        }
    }


    return (
        <>
            {createPortal(
                <BatchGenerationPanel
                    isOpen={isOpen}
                    selectedCount={selectedCount}
                    selectedTypes={selectedTypes}
                    forceRegenerate={forceRegenerate}
                    isGenerating={isGenerating}
                    isProcessingAltTexts={isProcessingAltTexts}
                    isProcessingBulkAction={isProcessingBulkAction}
                    progressMessage={progressMessage}
                    altTextProgress={altTextProgress}

                    isCollapsed={isCollapsed}
                    isHidden={isAdvancedSettingsOpen}
                    pendingApprovalsCount={pendingApprovalsCount}
                    syncableProductsCount={syncableProductsCount}

                    onToggleType={toggleType}
                    onForceRegenerateChange={setForceRegenerate}
                    onCollapseChange={setIsCollapsed}
                    onGenerate={() => {
                        onGenerate(selectedTypes, false, forceRegenerate);
                    }}
                    onOpenSettings={onOpenSettings}
                    onClose={onClose}

                    onApproveAll={onApproveAll}
                    onRejectAll={onRejectAll}
                    onPushToStore={onPushToStore}
                    onCancelSync={onCancelSync}
                    onOpenBulkApproval={onOpenBulkApproval}
                    modelName={modelName}
                />,
                document.body
            )}
            {settings && onSettingsChange && (
                <BatchGenerationRightSettingsPanel
                    isOpen={isAdvancedSettingsOpen}
                    onClose={() => onCloseSettings?.()}
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                    width={settingsPanelWidth}
                />
            )}
        </>
    );
}
