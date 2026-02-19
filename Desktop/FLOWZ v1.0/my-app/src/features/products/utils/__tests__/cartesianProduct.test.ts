import { describe, it, expect } from 'vitest';
import { cartesianProduct } from '../cartesianProduct';

describe('cartesianProduct', () => {
    it('returns empty array for empty input', () => {
        expect(cartesianProduct([])).toEqual([]);
    });

    it('returns empty array if any sub-array is empty', () => {
        expect(cartesianProduct([['Red', 'Blue'], []])).toEqual([]);
        expect(cartesianProduct([[], ['S', 'M']])).toEqual([]);
    });

    it('returns single-element combos for one array', () => {
        expect(cartesianProduct([['Red', 'Blue', 'Green']])).toEqual([
            ['Red'],
            ['Blue'],
            ['Green'],
        ]);
    });

    it('produces correct cartesian product for two arrays', () => {
        const result = cartesianProduct([['Red', 'Blue'], ['S', 'M', 'L']]);
        expect(result).toEqual([
            ['Red', 'S'],
            ['Red', 'M'],
            ['Red', 'L'],
            ['Blue', 'S'],
            ['Blue', 'M'],
            ['Blue', 'L'],
        ]);
    });

    it('produces correct cartesian product for three arrays', () => {
        const result = cartesianProduct([['A', 'B'], ['1', '2'], ['X']]);
        expect(result).toEqual([
            ['A', '1', 'X'],
            ['A', '2', 'X'],
            ['B', '1', 'X'],
            ['B', '2', 'X'],
        ]);
    });

    it('handles single-element arrays', () => {
        const result = cartesianProduct([['Only'], ['One']]);
        expect(result).toEqual([['Only', 'One']]);
    });

    it('correctly calculates combo count', () => {
        // 3 * 2 * 4 = 24 combos
        const result = cartesianProduct([
            ['A', 'B', 'C'],
            ['1', '2'],
            ['X', 'Y', 'Z', 'W'],
        ]);
        expect(result).toHaveLength(24);
    });
});
