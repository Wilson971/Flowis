import { describe, it, expect } from 'vitest';

// ============================================================================
// We test the pure helper functions from useVariationManager.ts
// Since attributeKey and on_sale logic are module-internal,
// we replicate them here for isolated testing.
// ============================================================================

// Replica of attributeKey from useVariationManager.ts
function attributeKey(attrs: { name: string; option: string }[]): string {
    return [...attrs]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => `${a.name}:${a.option}`)
        .join('|');
}

// Replica of on_sale NaN guard logic from useVariationManager.ts
function computeOnSale(salePrice: string): boolean {
    return !!salePrice && parseFloat(salePrice) > 0;
}

// ============================================================================
// attributeKey
// ============================================================================

describe('attributeKey', () => {
    it('returns empty string for no attributes', () => {
        expect(attributeKey([])).toBe('');
    });

    it('produces consistent key regardless of attribute order', () => {
        const attrs1 = [
            { name: 'Taille', option: 'M' },
            { name: 'Couleur', option: 'Rouge' },
        ];
        const attrs2 = [
            { name: 'Couleur', option: 'Rouge' },
            { name: 'Taille', option: 'M' },
        ];
        expect(attributeKey(attrs1)).toBe(attributeKey(attrs2));
    });

    it('produces different keys for different options', () => {
        const key1 = attributeKey([{ name: 'Couleur', option: 'Rouge' }]);
        const key2 = attributeKey([{ name: 'Couleur', option: 'Bleu' }]);
        expect(key1).not.toBe(key2);
    });

    it('sorts attributes alphabetically by name', () => {
        const key = attributeKey([
            { name: 'Z-Attr', option: 'val' },
            { name: 'A-Attr', option: 'val' },
        ]);
        expect(key).toBe('A-Attr:val|Z-Attr:val');
    });

    it('handles special characters in values', () => {
        const key = attributeKey([{ name: 'Couleur', option: 'Rouge/Bleu' }]);
        expect(key).toBe('Couleur:Rouge/Bleu');
    });
});

// ============================================================================
// on_sale NaN guard
// ============================================================================

describe('on_sale NaN guard (computeOnSale)', () => {
    it('returns false for empty string', () => {
        expect(computeOnSale('')).toBe(false);
    });

    it('returns false for "0"', () => {
        expect(computeOnSale('0')).toBe(false);
    });

    it('returns false for "0.00"', () => {
        expect(computeOnSale('0.00')).toBe(false);
    });

    it('returns true for positive price', () => {
        expect(computeOnSale('14.99')).toBe(true);
    });

    it('returns false for negative price', () => {
        expect(computeOnSale('-5')).toBe(false);
    });

    it('returns false for non-numeric string (NaN guard)', () => {
        // "abc" is truthy, but parseFloat("abc") is NaN, NaN > 0 is false
        expect(computeOnSale('abc')).toBe(false);
    });

    it('returns true for string with leading spaces', () => {
        expect(computeOnSale('  9.99  ')).toBe(true);
    });
});
