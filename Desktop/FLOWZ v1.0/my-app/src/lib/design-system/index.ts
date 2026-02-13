/**
 * FLOWZ Design System
 *
 * Central export for all design system utilities, tokens, and styles.
 *
 * Usage:
 * import { styles, designSystem, motionTokens } from '@/lib/design-system';
 */

// Export all tokens
export * from './tokens';
export { default as designSystem } from './tokens';

// Export style utilities
export * from './styles';
export { default as styles } from './styles';

// Export card theme system
export * from './card-themes';
export { cardThemes, productCardThemes, getCardThemeClasses, getProductCardTheme } from './card-themes';
