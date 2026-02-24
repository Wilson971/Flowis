export interface ContentType {
    id: string;
    label: string;
    defaultEnabled: boolean;
}

export type AltTextProgress = {
    current: number;
    total: number;
    status: "idle" | "processing" | "completed" | "error";
    message?: string;
    successCount: number;
    errorCount: number;
};

export interface BatchGenerationPanelProps {
    isOpen?: boolean;
    selectedCount: number;
    selectedTypes: string[];
    forceRegenerate: boolean;
    isGenerating: boolean;
    isProcessingAltTexts: boolean;
    isProcessingBulkAction: boolean;
    progressMessage: string;
    altTextProgress?: AltTextProgress;

    isCollapsed: boolean;
    isHidden: boolean;
    pendingApprovalsCount: number;
    syncableProductsCount: number;

    modelName?: string;

    onToggleType: (typeId: string) => void;
    onForceRegenerateChange: (checked: boolean) => void;
    onCollapseChange: (collapsed: boolean) => void;
    onGenerate: () => void;
    onOpenSettings: () => void;
    onClose?: () => void;

    onApproveAll?: () => void;
    onRejectAll?: () => void;
    onPushToStore?: () => void;
    onCancelSync?: () => void;
    onOpenBulkApproval?: () => void;
}

export interface GenerateButtonProps {
    canGenerate: boolean;
    isGenerating: boolean;
    isProcessingAltTexts: boolean;
    isProcessingBulkAction: boolean;
    progressMessage: string;
    selectedCount: number;
    onGenerate: () => void;
}
