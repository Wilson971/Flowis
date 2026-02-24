import type { EditableVariation, VariationStatus } from "../../../hooks/useVariationManager";

// ============================================================================
// COLUMN CONFIGURATION
// ============================================================================

export interface GridColumn {
    key: string;
    label: string;
    defaultVisible: boolean;
    /** Fixed columns are always visible and not in the selector */
    fixed?: boolean;
}

export const GRID_COLUMNS: GridColumn[] = [
    { key: "checkbox", label: "", defaultVisible: true, fixed: true },
    { key: "image", label: "Img", defaultVisible: true },
    // Dynamic attribute columns are injected at render time
    { key: "sku", label: "SKU", defaultVisible: true },
    { key: "prix", label: "Prix", defaultVisible: true },
    { key: "promo", label: "Promo", defaultVisible: true },
    { key: "stock", label: "Stock", defaultVisible: true },
    { key: "weight", label: "Poids", defaultVisible: false },
    { key: "dimensions", label: "Dimensions", defaultVisible: false },
    { key: "gtin", label: "GTIN/EAN", defaultVisible: false },
    { key: "manageStock", label: "Gérer stock", defaultVisible: false },
    { key: "backorders", label: "Précommandes", defaultVisible: false },
    { key: "taxStatus", label: "Statut fiscal", defaultVisible: false },
    { key: "taxClass", label: "Classe taxe", defaultVisible: false },
    { key: "dateOnSaleFrom", label: "Début promo", defaultVisible: false },
    { key: "dateOnSaleTo", label: "Fin promo", defaultVisible: false },
    { key: "description", label: "Description", defaultVisible: false },
    { key: "statut", label: "Statut", defaultVisible: true },
    { key: "actions", label: "", defaultVisible: true, fixed: true },
];

export const DEFAULT_VISIBLE = new Set(
    GRID_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
);

/** Columns that appear in the selector (non-fixed) */
export const SELECTABLE_COLUMNS = GRID_COLUMNS.filter((c) => !c.fixed);

// ============================================================================
// STATUS STYLES
// ============================================================================

export const statusBorderColors: Record<VariationStatus, string> = {
    synced: "border-l-emerald-500",
    new: "border-l-blue-500",
    modified: "border-l-amber-500",
    deleted: "border-l-red-500",
};

export const statusBgColors: Record<VariationStatus, string> = {
    synced: "bg-success/5",
    new: "bg-primary/5",
    modified: "bg-amber-500/5",
    deleted: "bg-destructive/5",
};

export const statusLabels: Record<VariationStatus, string> = {
    synced: "Synchronisée",
    new: "Nouvelle",
    modified: "Modifiée",
    deleted: "Supprimée",
};

// ============================================================================
// TYPES
// ============================================================================

export interface VariationGridProps {
    variations: EditableVariation[];
    selectedIds: Set<string>;
    onToggleSelect: (localId: string) => void;
    onToggleSelectAll: () => void;
    onUpdateField: (
        localId: string,
        field: keyof EditableVariation,
        value: unknown
    ) => void;
    onDelete: (localId: string) => void;
    onOpenDetail: (localId: string) => void;
    onImageUpload?: (localId: string, file: File) => void;
    isLoading?: boolean;
    changeCounter?: number;
    uploadingVariationId?: string | null;
    /** External column visibility control */
    visibleColumns?: Set<string>;
    onVisibleColumnsChange?: (cols: Set<string>) => void;
}
