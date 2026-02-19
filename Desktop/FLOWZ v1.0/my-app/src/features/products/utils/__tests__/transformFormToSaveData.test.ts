import { describe, it, expect } from 'vitest';
import { transformFormToSaveData, type AvailableCategory } from '../transformFormToSaveData';
import { DEFAULT_FORM_VALUES, type ProductFormValues } from '../../schemas/product-schema';

// ============================================================================
// HELPERS
// ============================================================================

function makeForm(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
    return { ...DEFAULT_FORM_VALUES, ...overrides };
}

// ============================================================================
// TESTS
// ============================================================================

describe('transformFormToSaveData', () => {
    // ── Basic transform ────────────────────────────────────────────────
    it('transforms default form values without crashing', () => {
        const result = transformFormToSaveData(makeForm());
        expect(result).toBeDefined();
        expect(result.title).toBe('');
        expect(result.status).toBe('draft');
    });

    it('maps basic fields correctly', () => {
        const result = transformFormToSaveData(makeForm({
            title: 'Mon Produit',
            description: '<p>Description</p>',
            short_description: 'Court',
            sku: 'SKU-123',
            slug: 'mon-produit',
            status: 'publish',
        }));
        expect(result.title).toBe('Mon Produit');
        expect(result.description).toBe('<p>Description</p>');
        expect(result.short_description).toBe('Court');
        expect(result.sku).toBe('SKU-123');
        expect(result.slug).toBe('mon-produit');
        expect(result.status).toBe('publish');
    });

    // ── coerceNumber (via pricing/stock fields) ────────────────────────
    it('coerces string prices to numbers', () => {
        const result = transformFormToSaveData(makeForm({
            regular_price: '19.99',
            sale_price: '14.99',
        }));
        expect(result.regular_price).toBe(19.99);
        expect(result.sale_price).toBe(14.99);
    });

    it('coerces number prices directly', () => {
        const result = transformFormToSaveData(makeForm({
            regular_price: 25,
            sale_price: 20,
        }));
        expect(result.regular_price).toBe(25);
        expect(result.sale_price).toBe(20);
    });

    it('returns undefined for empty string prices', () => {
        const result = transformFormToSaveData(makeForm({
            regular_price: '',
            sale_price: '',
        }));
        expect(result.regular_price).toBeUndefined();
        expect(result.sale_price).toBeUndefined();
    });

    it('returns undefined for null/undefined prices', () => {
        const result = transformFormToSaveData(makeForm({
            regular_price: null,
            sale_price: undefined,
        }));
        expect(result.regular_price).toBeUndefined();
        expect(result.sale_price).toBeUndefined();
    });

    it('preserves price value of 0', () => {
        const result = transformFormToSaveData(makeForm({
            regular_price: 0,
        }));
        expect(result.regular_price).toBe(0);
    });

    // ── nonEmpty (via sku, global_unique_id) ───────────────────────────
    it('returns undefined for empty sku', () => {
        const result = transformFormToSaveData(makeForm({ sku: '' }));
        expect(result.sku).toBeUndefined();
    });

    it('returns the value for non-empty sku', () => {
        const result = transformFormToSaveData(makeForm({ sku: 'ABC-123' }));
        expect(result.sku).toBe('ABC-123');
    });

    // ── SEO with focus_keyword ─────────────────────────────────────────
    it('includes focus_keyword in SEO output', () => {
        const result = transformFormToSaveData(makeForm({
            meta_title: 'Mon Titre SEO',
            meta_description: 'Ma description SEO',
            focus_keyword: 'produit bio',
        }));
        expect(result.seo).toEqual({
            title: 'Mon Titre SEO',
            description: 'Ma description SEO',
            focus_keyword: 'produit bio',
        });
    });

    it('handles empty focus_keyword', () => {
        const result = transformFormToSaveData(makeForm({
            focus_keyword: '',
        }));
        expect(result.seo?.focus_keyword).toBe('');
    });

    // ── Categories with resolution ─────────────────────────────────────
    describe('category resolution', () => {
        const availableCategories: AvailableCategory[] = [
            { id: 'uuid-1', external_id: '10', name: 'Vêtements', slug: 'vetements' },
            { id: 'uuid-2', external_id: '20', name: 'Chaussures', slug: 'chaussures' },
            { id: 'uuid-3', external_id: '30', name: '  Accessoires  ', slug: 'accessoires' },
        ];

        it('resolves categories by trimmed name', () => {
            const result = transformFormToSaveData(
                makeForm({ categories: ['Vêtements', 'Chaussures'] }),
                availableCategories
            );
            expect(result.categories).toEqual([
                { id: '10', name: 'Vêtements', slug: 'vetements' },
                { id: '20', name: 'Chaussures', slug: 'chaussures' },
            ]);
        });

        it('resolves categories with whitespace trimming', () => {
            const result = transformFormToSaveData(
                makeForm({ categories: ['  Accessoires  '] }),
                availableCategories
            );
            expect(result.categories).toEqual([
                { id: '30', name: '  Accessoires  ', slug: 'accessoires' },
            ]);
        });

        it('returns name-only object for unknown categories', () => {
            const result = transformFormToSaveData(
                makeForm({ categories: ['Inconnu'] }),
                availableCategories
            );
            expect(result.categories).toEqual([
                { name: 'Inconnu' },
            ]);
        });

        it('handles empty categories', () => {
            const result = transformFormToSaveData(makeForm({ categories: [] }));
            expect(result.categories).toEqual([]);
        });
    });

    // ── Dimensions ─────────────────────────────────────────────────────
    it('includes dimensions when at least one value is set', () => {
        const result = transformFormToSaveData(makeForm({
            dimensions_length: '10',
            dimensions_width: '',
            dimensions_height: '',
        }));
        expect(result.dimensions).toEqual({
            length: '10', width: '', height: '',
        });
    });

    it('returns undefined dimensions when all empty', () => {
        const result = transformFormToSaveData(makeForm({
            dimensions_length: '',
            dimensions_width: '',
            dimensions_height: '',
        }));
        expect(result.dimensions).toBeUndefined();
    });

    // ── Attributes with dedup ──────────────────────────────────────────
    it('deduplicates attribute options', () => {
        const result = transformFormToSaveData(makeForm({
            attributes: [{
                name: 'Couleur',
                options: ['Rouge', 'Bleu', 'Rouge', 'Vert', 'Bleu'],
                visible: true,
                variation: true,
            }],
        }));
        expect(result.attributes?.[0].options).toEqual(['Rouge', 'Bleu', 'Vert']);
    });

    it('includes attribute id when present', () => {
        const result = transformFormToSaveData(makeForm({
            attributes: [{
                id: 42,
                name: 'Taille',
                options: ['S', 'M', 'L'],
                visible: true,
                variation: false,
            }],
        }));
        expect(result.attributes?.[0]).toMatchObject({ id: 42, name: 'Taille' });
    });

    it('omits attribute id when 0 (falsy)', () => {
        const result = transformFormToSaveData(makeForm({
            attributes: [{
                id: 0,
                name: 'Matière',
                options: ['Coton'],
                visible: true,
                variation: false,
            }],
        }));
        expect(result.attributes?.[0]).not.toHaveProperty('id');
    });

    // ── Stock fields ───────────────────────────────────────────────────
    it('coerces stock string to number', () => {
        const result = transformFormToSaveData(makeForm({ stock: '50' }));
        expect(result.stock).toBe(50);
    });

    it('coerces low_stock_amount to number or null', () => {
        const result1 = transformFormToSaveData(makeForm({ low_stock_amount: '5' }));
        expect(result1.low_stock_amount).toBe(5);

        const result2 = transformFormToSaveData(makeForm({ low_stock_amount: '' }));
        expect(result2.low_stock_amount).toBeNull();
    });

    // ── Vendor / brand mapping ─────────────────────────────────────────
    it('maps brand to vendor', () => {
        const result = transformFormToSaveData(makeForm({ brand: 'Nike' }));
        expect(result.vendor).toBe('Nike');
    });
});
