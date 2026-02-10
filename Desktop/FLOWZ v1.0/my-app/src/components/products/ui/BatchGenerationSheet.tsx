import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
import { BatchGenerationPanel, CONTENT_TYPES, AltTextProgress } from "./BatchGenerationPanel";

interface BatchGenerationSheetProps {
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
}

export function BatchGenerationSheet({
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
}: BatchGenerationSheetProps) {
    console.log('[BatchGenerationSheet] Render', { selectedCount });

    const isProcessingAltTexts = altTextProgress?.status === "processing";

    const [selectedTypes, setSelectedTypes] = useLocalStorage<string[]>(STORAGE_KEYS.BATCH_GENERATION_SELECTED_TYPES, {
        defaultValue: CONTENT_TYPES.filter(t => t.defaultEnabled).map(t => t.id),
    });

    const [forceRegenerate, setForceRegenerate] = useLocalStorage<boolean>(STORAGE_KEYS.BATCH_GENERATION_FORCE_REGENERATE, {
        defaultValue: false,
    });

    const [shouldPush, setShouldPush] = useState(false);
    const [sheetWidth, setSheetWidth] = useState("100%");
    const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(STORAGE_KEYS.BATCH_GENERATION_COLLAPSED, {
        defaultValue: false,
    });

    // Layout Responsiveness
    useEffect(() => {
        const updateLayout = () => {
            if (!isAdvancedSettingsOpen) {
                setShouldPush(false);
                setSheetWidth("100%");
                return;
            }

            const viewportWidth = window.innerWidth;
            let rightSheetWidth = 520;

            if (viewportWidth < 1024) {
                setShouldPush(false);
                setSheetWidth("0");
                return;
            } else if (viewportWidth < 1280) {
                rightSheetWidth = 480;
            }

            const availableWidth = viewportWidth - rightSheetWidth;
            const shouldUsePush = availableWidth >= 820;

            setShouldPush(shouldUsePush);

            if (shouldUsePush) {
                setSheetWidth(`${rightSheetWidth}px`);
            } else {
                setSheetWidth("0px"); // Hide if not enough space and settings open
            }
        };

        updateLayout();
        window.addEventListener("resize", updateLayout);
        return () => window.removeEventListener("resize", updateLayout);
    }, [isAdvancedSettingsOpen]);

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

        // Use real SSE progress message when available
        if (sseProgressMessage) {
            setProgressMessage(sseProgressMessage);
            return;
        }

        // Fallback to cycling messages
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

    return createPortal(
        <BatchGenerationPanel
            selectedCount={selectedCount}
            selectedTypes={selectedTypes}
            forceRegenerate={forceRegenerate}
            isGenerating={isGenerating}
            isProcessingAltTexts={isProcessingAltTexts}
            isProcessingBulkAction={isProcessingBulkAction}
            progressMessage={progressMessage}
            altTextProgress={altTextProgress}

            isCollapsed={isCollapsed}
            sheetWidth={sheetWidth}
            shouldPush={shouldPush}
            pendingApprovalsCount={pendingApprovalsCount}
            syncableProductsCount={syncableProductsCount}

            onToggleType={toggleType}
            onForceRegenerateChange={setForceRegenerate}
            onCollapseChange={setIsCollapsed}
            onGenerate={() => {
                console.log('[BatchGenerationSheet] onGenerate fired', { selectedTypes, forceRegenerate });
                onGenerate(selectedTypes, false, forceRegenerate);
            }}
            onOpenSettings={onOpenSettings}
            onClose={onClose}

            onApproveAll={onApproveAll}
            onRejectAll={onRejectAll}
            onPushToStore={onPushToStore}
            onCancelSync={onCancelSync}
            onOpenBulkApproval={onOpenBulkApproval}
        />,
        document.body
    );
}
