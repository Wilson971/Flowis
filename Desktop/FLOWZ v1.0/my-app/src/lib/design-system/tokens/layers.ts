/**
 * Design System - Z-Index & Layer Tokens
 *
 * Standardized z-index scale for consistent layering.
 * All components should use these values instead of arbitrary z-index.
 *
 * Usage:
 * import { zIndex } from '@/lib/design-system/tokens/layers'
 * className={`z-${zIndex.modal}`}  // z-50
 */

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  /** z-0: Default content layer */
  base: 0,
  /** z-10: Elevated cards, sticky elements within sections */
  elevated: 10,
  /** z-20: Dropdown menus, popovers, comboboxes */
  dropdown: 20,
  /** z-30: Sticky headers, navigation bars */
  sticky: 30,
  /** z-40: Modal backdrops, full-screen overlays */
  overlay: 40,
  /** z-50: Modals, sheets, dialogs */
  modal: 50,
  /** z-[60]: Toast notifications */
  toast: 60,
  /** z-[70]: Tooltips (always on top) */
  tooltip: 70,
} as const;

/**
 * Get the Tailwind z-index class for a given layer
 */
export const getZIndexClass = (layer: keyof typeof zIndex): string => {
  const value = zIndex[layer];
  if (value <= 50) return `z-${value}`;
  return `z-[${value}]`;
};

// ============================================
// PLATFORM COLORS
// ============================================

export const platformColors = {
  shopify: {
    name: 'Shopify',
    cssVar: '--platform-shopify',
    textClass: 'text-platform-shopify',
    bgClass: 'bg-platform-shopify',
  },
  woocommerce: {
    name: 'WooCommerce',
    cssVar: '--platform-woocommerce',
    textClass: 'text-platform-woocommerce',
    bgClass: 'bg-platform-woocommerce',
  },
  wordpress: {
    name: 'WordPress',
    cssVar: '--platform-wordpress',
    textClass: 'text-platform-wordpress',
    bgClass: 'bg-platform-wordpress',
  },
  prestashop: {
    name: 'PrestaShop',
    cssVar: '--platform-prestashop',
    textClass: 'text-platform-prestashop',
    bgClass: 'bg-platform-prestashop',
  },
} as const;

/**
 * Get platform display config by key
 */
export const getPlatformConfig = (platform: keyof typeof platformColors) => {
  return platformColors[platform];
};

export const layerTokens = {
  zIndex,
  getZIndexClass,
  platformColors,
  getPlatformConfig,
} as const;

export default layerTokens;
