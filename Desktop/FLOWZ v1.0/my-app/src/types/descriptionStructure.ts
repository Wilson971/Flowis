/**
 * Types pour le système de blocs de structure de description
 * Compatible avec le système de génération existant (structure_options)
 */

// Types de blocs disponibles
export type DescriptionBlockType =
    | 'heading_h1'
    | 'heading_h2'
    | 'heading_h3'
    | 'paragraph'
    | 'benefits_list'
    | 'specs_table'
    | 'cta'
    | 'separator';

// Style pour les listes à puces
export type BulletStyle = 'bullet' | 'checkmark' | 'numbered';

// Style pour les CTA
export type CtaStyle = 'button' | 'link' | 'banner';

// Configuration spécifique par type de bloc
export type BlockConfig = {
    // Pour les headings
    placeholder?: string;          // Ex: "Découvrez {product_name}"
    includeKeyword?: boolean;      // Inclure le mot-clé focus

    // Pour benefits_list
    itemCount?: number;            // Nombre de puces (1-10)
    bulletStyle?: BulletStyle;

    // Pour specs_table
    columns?: number;              // 2 ou 3 colonnes
    showHeader?: boolean;

    // Pour CTA
    ctaStyle?: CtaStyle;
    ctaText?: string;              // Ex: "Acheter maintenant"

    // Pour paragraph
    wordCount?: number;            // Objectif de mots
    focusOn?: 'intro' | 'benefits' | 'usage' | 'conclusion';
};

// Un bloc de description
export type DescriptionBlock = {
    id: string;                    // UUID unique
    type: DescriptionBlockType;
    enabled: boolean;
    order: number;
    config: BlockConfig;
};

// Structure complète avec rétrocompatibilité
export type StructureOptionsWithBlocks = {
    // Legacy (pour rétrocompatibilité avec le système actuel)
    h2_titles: boolean;
    benefits_list: boolean;
    benefits_count: number;
    specs_table: boolean;
    cta: boolean;

    // Nouveau système de blocs
    blocks?: DescriptionBlock[];
    useBlockBuilder?: boolean;     // Toggle entre ancien/nouveau système
};

// Labels pour l'UI
export const BLOCK_TYPE_LABELS: Record<DescriptionBlockType, string> = {
    heading_h1: 'Titre H1',
    heading_h2: 'Sous-titre H2',
    heading_h3: 'Sous-titre H3',
    paragraph: 'Paragraphe',
    benefits_list: 'Liste de bénéfices',
    specs_table: 'Tableau caractéristiques',
    cta: 'Appel à l\'action',
    separator: 'Séparateur',
};

// Descriptions pour l'UI
export const BLOCK_TYPE_DESCRIPTIONS: Record<DescriptionBlockType, string> = {
    heading_h1: 'Titre principal du produit',
    heading_h2: 'Sous-titre pour structurer le contenu',
    heading_h3: 'Sous-titre secondaire',
    paragraph: 'Bloc de texte descriptif',
    benefits_list: 'Liste à puces des avantages',
    specs_table: 'Tableau des caractéristiques techniques',
    cta: 'Bouton ou lien d\'incitation',
    separator: 'Ligne de séparation visuelle',
};

// Icônes pour chaque type (noms Lucide)
export const BLOCK_TYPE_ICONS: Record<DescriptionBlockType, string> = {
    heading_h1: 'Heading1',
    heading_h2: 'Heading2',
    heading_h3: 'Heading3',
    paragraph: 'AlignLeft',
    benefits_list: 'ListChecks',
    specs_table: 'Table2',
    cta: 'MousePointerClick',
    separator: 'Minus',
};

// Configuration par défaut pour chaque type de bloc
export const DEFAULT_BLOCK_CONFIGS: Record<DescriptionBlockType, BlockConfig> = {
    heading_h1: { includeKeyword: true },
    heading_h2: { includeKeyword: true },
    heading_h3: { includeKeyword: false },
    paragraph: { wordCount: 50 },
    benefits_list: { itemCount: 5, bulletStyle: 'checkmark' },
    specs_table: { columns: 2, showHeader: true },
    cta: { ctaStyle: 'button', ctaText: 'Acheter maintenant' },
    separator: {},
};

// Presets de structures prédéfinies
export const STRUCTURE_PRESETS = {
    ecommerce_complet: {
        name: 'E-commerce complet',
        description: 'Structure optimisée pour les fiches produit e-commerce',
        blocks: [
            { id: 'preset-h2-1', type: 'heading_h2' as DescriptionBlockType, enabled: true, order: 0, config: { includeKeyword: true } },
            { id: 'preset-para-1', type: 'paragraph' as DescriptionBlockType, enabled: true, order: 1, config: { wordCount: 50, focusOn: 'intro' as const } },
            { id: 'preset-benefits', type: 'benefits_list' as DescriptionBlockType, enabled: true, order: 2, config: { itemCount: 5, bulletStyle: 'checkmark' as BulletStyle } },
            { id: 'preset-specs', type: 'specs_table' as DescriptionBlockType, enabled: true, order: 3, config: { columns: 2, showHeader: true } },
            { id: 'preset-cta', type: 'cta' as DescriptionBlockType, enabled: true, order: 4, config: { ctaStyle: 'button' as CtaStyle, ctaText: 'Ajouter au panier' } },
        ],
    },
    minimal: {
        name: 'Minimal',
        description: 'Structure légère et concise',
        blocks: [
            { id: 'preset-para-min', type: 'paragraph' as DescriptionBlockType, enabled: true, order: 0, config: { wordCount: 100 } },
            { id: 'preset-benefits-min', type: 'benefits_list' as DescriptionBlockType, enabled: true, order: 1, config: { itemCount: 3, bulletStyle: 'bullet' as BulletStyle } },
        ],
    },
    technique: {
        name: 'Technique',
        description: 'Focus sur les spécifications techniques',
        blocks: [
            { id: 'preset-h2-tech', type: 'heading_h2' as DescriptionBlockType, enabled: true, order: 0, config: { includeKeyword: true } },
            { id: 'preset-specs-tech', type: 'specs_table' as DescriptionBlockType, enabled: true, order: 1, config: { columns: 3, showHeader: true } },
            { id: 'preset-para-tech', type: 'paragraph' as DescriptionBlockType, enabled: true, order: 2, config: { wordCount: 75, focusOn: 'usage' as const } },
            { id: 'preset-cta-tech', type: 'cta' as DescriptionBlockType, enabled: true, order: 3, config: { ctaStyle: 'link' as CtaStyle } },
        ],
    },
    storytelling: {
        name: 'Storytelling',
        description: 'Structure narrative engageante',
        blocks: [
            { id: 'preset-h2-story', type: 'heading_h2' as DescriptionBlockType, enabled: true, order: 0, config: { includeKeyword: true } },
            { id: 'preset-para-intro', type: 'paragraph' as DescriptionBlockType, enabled: true, order: 1, config: { wordCount: 75, focusOn: 'intro' as const } },
            { id: 'preset-h3-story', type: 'heading_h3' as DescriptionBlockType, enabled: true, order: 2, config: {} },
            { id: 'preset-benefits-story', type: 'benefits_list' as DescriptionBlockType, enabled: true, order: 3, config: { itemCount: 4, bulletStyle: 'checkmark' as BulletStyle } },
            { id: 'preset-para-conclu', type: 'paragraph' as DescriptionBlockType, enabled: true, order: 4, config: { wordCount: 50, focusOn: 'conclusion' as const } },
            { id: 'preset-cta-story', type: 'cta' as DescriptionBlockType, enabled: true, order: 5, config: { ctaStyle: 'banner' as CtaStyle } },
        ],
    },
};

// Fonction utilitaire pour générer un ID unique
export const generateBlockId = (): string => {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Fonction pour créer un nouveau bloc avec config par défaut
export const createBlock = (type: DescriptionBlockType, order: number): DescriptionBlock => ({
    id: generateBlockId(),
    type,
    enabled: true,
    order,
    config: { ...DEFAULT_BLOCK_CONFIGS[type] },
});

// Fonction pour convertir les blocs en structure_options legacy (rétrocompatibilité)
export const blocksToLegacyOptions = (blocks: DescriptionBlock[]): Omit<StructureOptionsWithBlocks, 'blocks' | 'useBlockBuilder'> => {
    const enabledBlocks = blocks.filter(b => b.enabled);
    const benefitsBlock = enabledBlocks.find(b => b.type === 'benefits_list');

    return {
        h2_titles: enabledBlocks.some(b => b.type === 'heading_h2'),
        benefits_list: !!benefitsBlock,
        benefits_count: benefitsBlock?.config.itemCount || 5,
        specs_table: enabledBlocks.some(b => b.type === 'specs_table'),
        cta: enabledBlocks.some(b => b.type === 'cta'),
    };
};

// Fonction pour convertir les options legacy en blocs
export const legacyOptionsToBlocks = (opts: Omit<StructureOptionsWithBlocks, 'blocks' | 'useBlockBuilder'>): DescriptionBlock[] => {
    const blocks: DescriptionBlock[] = [];
    let order = 0;

    if (opts.h2_titles) {
        blocks.push({
            id: generateBlockId(),
            type: 'heading_h2',
            enabled: true,
            order: order++,
            config: { includeKeyword: true },
        });
    }

    // Toujours ajouter un paragraphe d'intro
    blocks.push({
        id: generateBlockId(),
        type: 'paragraph',
        enabled: true,
        order: order++,
        config: { wordCount: 50, focusOn: 'intro' },
    });

    if (opts.benefits_list) {
        blocks.push({
            id: generateBlockId(),
            type: 'benefits_list',
            enabled: true,
            order: order++,
            config: { itemCount: opts.benefits_count || 5, bulletStyle: 'checkmark' },
        });
    }

    if (opts.specs_table) {
        blocks.push({
            id: generateBlockId(),
            type: 'specs_table',
            enabled: true,
            order: order++,
            config: { columns: 2, showHeader: true },
        });
    }

    if (opts.cta) {
        blocks.push({
            id: generateBlockId(),
            type: 'cta',
            enabled: true,
            order: order++,
            config: { ctaStyle: 'button', ctaText: 'Acheter maintenant' },
        });
    }

    return blocks;
};

