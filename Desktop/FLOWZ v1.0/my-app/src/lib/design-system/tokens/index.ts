/**
 * Design System Tokens - Central Export
 *
 * This file exports all design system tokens for easy import throughout the application.
 *
 * Usage:
 * import { cardTokens, badgeTokens, motionTokens, typographyTokens } from '@/lib/design-system/tokens';
 *
 * Or import specific items:
 * import { getBadgeClasses, cardAnimationVariants } from '@/lib/design-system/tokens';
 */

// Typography Tokens
export {
  typographyTokens,
  getTypographyClass,
} from './typography';

// Card Tokens
export {
  cardTokens,
  cardBaseStyles,
  cardGradientPresets,
  cardAnimationVariants,
  cardHoverEffects,
  cardIconStyles,
  premiumActionCardStyles,
  statusColors,
  getPremiumActionClasses,
  getIconGradientClasses,
  getStatusClasses,
  type CardStyle,
  type CardColorPreset,
} from './cards';

// Badge Tokens
export {
  badgeTokens,
  badgeVariantStyles,
  badgeSizeStyles,
  badgeBaseStyles,
  badgePresets,
  getBadgeClasses,
  getIndicatorClasses,
  getIconClasses,
  type BadgeVariant,
  type BadgeSize,
  type BadgePreset,
} from './badges';

// Motion Tokens
export {
  motionTokens,
  easings,
  durations,
  staggerDelays,
  transitions,
  variants,
  createStaggerContainer,
  createStaggerItem,
  createIndexedStagger,
} from './motion';

// Layer & Platform Tokens
export {
  layerTokens,
  zIndex,
  getZIndexClass,
  platformColors,
  getPlatformConfig,
} from './layers';

// ============================================
// COMBINED DESIGN SYSTEM OBJECT
// ============================================

import { typographyTokens } from './typography';
import { cardTokens } from './cards';
import { badgeTokens } from './badges';
import { motionTokens } from './motion';
import { layerTokens } from './layers';

/**
 * Complete Design System Tokens
 * Access all tokens from a single object
 */
export const designSystem = {
  typography: typographyTokens,
  cards: cardTokens,
  badges: badgeTokens,
  motion: motionTokens,
  layers: layerTokens,
} as const;

export default designSystem;
