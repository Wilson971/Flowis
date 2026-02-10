export type ModularContentType =
    | 'title'
    | 'short_description'
    | 'description'
    | 'seo_title'
    | 'meta_description'
    | 'sku'
    | 'alt_text';

import { DescriptionBlock } from './descriptionStructure';

export interface ModularGenerationSettings {
    provider: string;
    model: string;
    tone: string;
    language: string;
    word_limits: {
        title?: number;
        short_description?: number;
        description?: number;
        seo_title?: number;
        meta_description?: number;
    };
    image_analysis: boolean;
    transform_mode: 'optimize' | 'rewrite';
    sku_format?: {
        pattern: 'category_based' | 'product_name_based' | 'custom';
        separator: string;
        max_length: number;
        prefix?: string;
    };
    structure_options: {
        h2_titles: boolean;
        benefits_list: boolean;
        benefits_count: number;
        specs_table: boolean;
        cta: boolean;
        blocks?: DescriptionBlock[];
        useBlockBuilder?: boolean;
    };
}

export interface ModularBatchRequest {
    product_ids: string[];
    content_types: Partial<Record<ModularContentType, boolean>>;
    settings: ModularGenerationSettings;
    store_id: string;
}

export interface ModularBatchResponse {
    batch_job_id: string;
    total: number;
}
