/**
 * Cartesian product of multiple arrays.
 * Used to generate all variation combinations from product attributes.
 *
 * Example:
 *   cartesianProduct([["Red", "Blue"], ["S", "M", "L"]])
 *   → [["Red","S"], ["Red","M"], ["Red","L"], ["Blue","S"], ["Blue","M"], ["Blue","L"]]
 */
export function cartesianProduct(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [];
    if (arrays.some((a) => a.length === 0)) return [];

    return arrays.reduce<string[][]>(
        (acc, options) =>
            acc.flatMap((combo) => options.map((opt) => [...combo, opt])),
        [[]]
    );
}
