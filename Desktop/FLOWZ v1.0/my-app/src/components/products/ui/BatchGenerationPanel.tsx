/**
 * Re-export shim — actual implementation lives in ./batch-panel/
 */
export {
    BatchGenerationPanel,
    GenerateButton,
    ContentTypeChip,
    PanelHeader,
    CONTENT_TYPES,
    CONTENT_TYPE_ICONS,
} from "./batch-panel";

export type {
    ContentType,
    AltTextProgress,
    BatchGenerationPanelProps,
    GenerateButtonProps,
} from "./batch-panel";
