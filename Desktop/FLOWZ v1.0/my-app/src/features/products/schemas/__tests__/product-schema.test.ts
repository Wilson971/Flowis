import { describe, it, expect } from 'vitest';
import {
    ProductFormSchema,
    DEFAULT_FORM_VALUES,
    PRODUCT_TYPE_DEFAULT,
    PRODUCT_FORM_FIELDS,
    HTML_FIELDS,
    NUMERIC_FIELDS,
} from '../product-schema';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

describe('ProductFormSchema', () => {
    it('validates DEFAULT_FORM_VALUES with a title', () => {
        // DEFAULT_FORM_VALUES has title:"" which is invalid (min 1)
        // This is intentional: defaults are pre-fill, not valid submissions
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test Product',
        });
        expect(result.success).toBe(true);
    });

    it('rejects DEFAULT_FORM_VALUES without title (empty string)', () => {
        const result = ProductFormSchema.safeParse(DEFAULT_FORM_VALUES);
        expect(result.success).toBe(false);
    });

    it('requires title (non-empty)', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: '',
        });
        expect(result.success).toBe(false);
    });

    it('requires product_type (string)', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            product_type: undefined,
        });
        expect(result.success).toBe(false);
    });

    it('accepts valid stock_status enum values', () => {
        for (const value of ['instock', 'outofstock', 'onbackorder'] as const) {
            const result = ProductFormSchema.safeParse({
                ...DEFAULT_FORM_VALUES,
                title: 'Test',
                stock_status: value,
            });
            expect(result.success).toBe(true);
        }
    });

    it('rejects invalid stock_status', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            stock_status: 'invalid_status',
        });
        expect(result.success).toBe(false);
    });

    it('accepts valid tax_status enum values', () => {
        for (const value of ['taxable', 'shipping', 'none'] as const) {
            const result = ProductFormSchema.safeParse({
                ...DEFAULT_FORM_VALUES,
                title: 'Test',
                tax_status: value,
            });
            expect(result.success).toBe(true);
        }
    });

    it('rejects invalid tax_status', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            tax_status: 'exempt',
        });
        expect(result.success).toBe(false);
    });

    it('accepts valid catalog_visibility enum values', () => {
        for (const value of ['visible', 'catalog', 'search', 'hidden'] as const) {
            const result = ProductFormSchema.safeParse({
                ...DEFAULT_FORM_VALUES,
                title: 'Test',
                catalog_visibility: value,
            });
            expect(result.success).toBe(true);
        }
    });

    it('rejects invalid catalog_visibility', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            catalog_visibility: 'private',
        });
        expect(result.success).toBe(false);
    });

    it('accepts union types for prices (number or string)', () => {
        const withNumber = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            regular_price: 19.99,
        });
        expect(withNumber.success).toBe(true);

        const withString = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            regular_price: '19.99',
        });
        expect(withString.success).toBe(true);
    });

    it('accepts null for nullable fields', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            sku: null,
            permalink: null,
            average_rating: null,
        });
        expect(result.success).toBe(true);
    });
});

// ============================================================================
// DEFAULT VALUES
// ============================================================================

describe('DEFAULT_FORM_VALUES', () => {
    it('has correct product_type default', () => {
        expect(DEFAULT_FORM_VALUES.product_type).toBe(PRODUCT_TYPE_DEFAULT);
        expect(DEFAULT_FORM_VALUES.product_type).toBe('simple');
    });

    it('has focus_keyword field', () => {
        expect(DEFAULT_FORM_VALUES).toHaveProperty('focus_keyword');
        expect(DEFAULT_FORM_VALUES.focus_keyword).toBe('');
    });

    it('has empty arrays for collections', () => {
        expect(DEFAULT_FORM_VALUES.categories).toEqual([]);
        expect(DEFAULT_FORM_VALUES.tags).toEqual([]);
        expect(DEFAULT_FORM_VALUES.images).toEqual([]);
        expect(DEFAULT_FORM_VALUES.attributes).toEqual([]);
        expect(DEFAULT_FORM_VALUES.upsell_ids).toEqual([]);
        expect(DEFAULT_FORM_VALUES.cross_sell_ids).toEqual([]);
        expect(DEFAULT_FORM_VALUES.related_ids).toEqual([]);
    });

    it('has sensible boolean defaults', () => {
        expect(DEFAULT_FORM_VALUES.manage_stock).toBe(false);
        expect(DEFAULT_FORM_VALUES.on_sale).toBe(false);
        expect(DEFAULT_FORM_VALUES.featured).toBe(false);
        expect(DEFAULT_FORM_VALUES.virtual).toBe(false);
        expect(DEFAULT_FORM_VALUES.downloadable).toBe(false);
        expect(DEFAULT_FORM_VALUES.purchasable).toBe(true);
        expect(DEFAULT_FORM_VALUES.reviews_allowed).toBe(true);
        expect(DEFAULT_FORM_VALUES.sold_individually).toBe(false);
    });

    it('uses empty strings (not null) for Input-registered fields', () => {
        // Fields registered on <Input> must be "" not null to avoid isDirty false positive
        expect(DEFAULT_FORM_VALUES.sku).toBe('');
        expect(DEFAULT_FORM_VALUES.global_unique_id).toBe('');
        expect(DEFAULT_FORM_VALUES.regular_price).toBe('');
        expect(DEFAULT_FORM_VALUES.sale_price).toBe('');
    });
});

// ============================================================================
// DERIVED CONSTANTS
// ============================================================================

describe('PRODUCT_FORM_FIELDS', () => {
    it('contains all schema keys', () => {
        const schemaKeys = Object.keys(ProductFormSchema.shape);
        expect(PRODUCT_FORM_FIELDS).toEqual(schemaKeys);
    });

    it('includes focus_keyword', () => {
        expect(PRODUCT_FORM_FIELDS).toContain('focus_keyword');
    });
});

describe('HTML_FIELDS', () => {
    it('contains description and short_description', () => {
        expect(HTML_FIELDS).toContain('description');
        expect(HTML_FIELDS).toContain('short_description');
    });
});

describe('NUMERIC_FIELDS', () => {
    it('contains price and stock fields', () => {
        expect(NUMERIC_FIELDS).toContain('regular_price');
        expect(NUMERIC_FIELDS).toContain('sale_price');
        expect(NUMERIC_FIELDS).toContain('stock');
    });
});

// ============================================================================
// ATTRIBUTE SCHEMA
// ============================================================================

describe('ProductFormSchema — attributes', () => {
    it('validates attributes with required name', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            attributes: [
                { name: '', options: [], visible: true, variation: false },
            ],
        });
        expect(result.success).toBe(false);
    });

    it('accepts valid attributes', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            attributes: [
                { name: 'Couleur', options: ['Rouge', 'Bleu'], visible: true, variation: true, position: 0 },
                { name: 'Taille', options: ['S', 'M', 'L'], visible: true, variation: true },
            ],
        });
        expect(result.success).toBe(true);
    });

    it('applies default values for optional attribute fields', () => {
        const result = ProductFormSchema.safeParse({
            ...DEFAULT_FORM_VALUES,
            title: 'Test',
            attributes: [{ name: 'Color' }],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            const attr = result.data.attributes[0];
            expect(attr.options).toEqual([]);
            expect(attr.visible).toBe(true);
            expect(attr.variation).toBe(false);
        }
    });
});
