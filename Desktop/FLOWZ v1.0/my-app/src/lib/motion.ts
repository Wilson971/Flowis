import { Variants } from 'framer-motion';

/**
 * @deprecated DO NOT USE THIS FILE.
 * Use `@/lib/design-system` instead.
 *
 * Import the correct tokens:
 * ```typescript
 * import { motionTokens } from '@/lib/design-system'
 * motionTokens.variants.fadeIn
 * motionTokens.variants.staggerContainer
 * motionTokens.transitions.default
 * ```
 *
 * This file is kept only for backward compatibility and will be removed.
 * See: my-app/src/lib/design-system/CONVENTIONS.md
 */

// @deprecated - use motionTokens from @/lib/design-system

// ============================================
// Container Variants
// ============================================

/**
 * Stagger Container - Animates children with delay
 * Used for grids and lists to create cascading animation effect
 *
 * @example
 * <motion.div variants={staggerContainer} initial="hidden" animate="visible">
 *   {items.map(item => (
 *     <motion.div key={item.id} variants={staggerItem}>
 *       {item}
 *     </motion.div>
 *   ))}
 * </motion.div>
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 100ms delay between each child
      delayChildren: 0,
    },
  },
};

/**
 * Stagger Item - Child animation for stagger containers
 * Slides up and fades in
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// ============================================
// Card Animations
// ============================================

/**
 * Slide In - Simple fade and slide up animation
 * Good for cards and panels
 */
export const slideIn: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Scale In - Fade and scale animation
 * Good for modals and popups
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Fade In - Simple opacity animation
 * Good for text and subtle elements
 */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================
// Page Transitions
// ============================================

/**
 * Page Transition - For route changes
 * Slides and fades between pages
 */
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.3,
    },
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Create a custom stagger container with configurable delay
 */
export const createStaggerContainer = (
  staggerDelay: number = 0.1
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0,
    },
  },
});

/**
 * Create a custom delay animation
 */
export const createDelayedAnimation = (
  delay: number = 0,
  duration: number = 0.5
): Variants => ({
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration,
      ease: 'easeOut',
    },
  },
});

// ============================================
// Hover & Tap Animations
// ============================================

/**
 * Common hover/tap animations for interactive elements
 */
export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: 'easeOut',
  },
};

export const tapScale = {
  scale: 0.95,
  transition: {
    duration: 0.1,
  },
};

export const hoverLift = {
  y: -4,
  transition: {
    duration: 0.2,
    ease: 'easeOut',
  },
};

/**
 * Card hover animation preset
 */
export const cardHover = {
  whileHover: {
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  whileTap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};
