/**
 * Design System - Motion Tokens
 *
 * Standardized Framer Motion animations for consistent UI behavior.
 * All components should use these variants instead of defining custom animations.
 *
 * Usage:
 * import { motionTokens } from '@/lib/design-system/tokens';
 * <motion.div variants={motionTokens.variants.fadeIn} initial="hidden" animate="visible">
 */

import { Variants, Transition } from 'framer-motion';

// ============================================
// EASING FUNCTIONS
// ============================================

export const easings = {
  /** Smooth, natural easing for most animations */
  smooth: [0.23, 1, 0.32, 1] as const,
  /** Bouncy easing for playful interactions */
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  /** Quick snap for instant feedback */
  snap: [0.4, 0, 0.2, 1] as const,
  /** Gentle ease-out for exits */
  gentle: [0, 0, 0.2, 1] as const,
  /** Standard ease-in-out */
  standard: [0.4, 0, 0.2, 1] as const,
} as const;

// ============================================
// DURATION PRESETS
// ============================================

export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.4,
  slower: 0.5,
  slowest: 0.6,
} as const;

// ============================================
// STAGGER DELAYS
// ============================================

export const staggerDelays = {
  fast: 0.05,
  normal: 0.08,
  slow: 0.1,
  slower: 0.15,
} as const;

// ============================================
// BASE TRANSITIONS
// ============================================

export const transitions: Record<string, Transition> = {
  /** Default smooth transition */
  default: {
    duration: durations.normal,
    ease: easings.smooth,
  },
  /** Fast transition for micro-interactions */
  fast: {
    duration: durations.fast,
    ease: easings.snap,
  },
  /** Slow transition for emphasis */
  slow: {
    duration: durations.slow,
    ease: easings.smooth,
  },
  /** Spring-based transition */
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },
  /** Gentle spring for subtle movements */
  gentleSpring: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
  },
} as const;

// ============================================
// ANIMATION VARIANTS
// ============================================

export const variants = {
  // ------------------------------------------
  // FADE ANIMATIONS
  // ------------------------------------------

  /** Simple fade in */
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: transitions.default,
    },
    exit: { opacity: 0 },
  } as Variants,

  /** Fade in with slight scale */
  fadeInScale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: transitions.default,
    },
    exit: { opacity: 0, scale: 0.95 },
  } as Variants,

  // ------------------------------------------
  // SLIDE ANIMATIONS
  // ------------------------------------------

  /** Slide in from bottom */
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, y: 20 },
  } as Variants,

  /** Slide in from top */
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, y: -20 },
  } as Variants,

  /** Slide in from left */
  slideLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, x: -20 },
  } as Variants,

  /** Slide in from right */
  slideRight: {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, x: 20 },
  } as Variants,

  // ------------------------------------------
  // STAGGERED ANIMATIONS (for lists/grids)
  // ------------------------------------------

  /** Staggered container - use with staggered children */
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelays.normal,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelays.fast,
        staggerDirection: -1,
      },
    },
  } as Variants,

  /** Staggered item - slide up */
  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, y: 10 },
  } as Variants,

  /** Staggered item - slide from left */
  staggerItemLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, x: -10 },
  } as Variants,

  /** Staggered item - slide from right */
  staggerItemRight: {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, x: 10 },
  } as Variants,

  /** Staggered item - scale */
  staggerItemScale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: transitions.default,
    },
    exit: { opacity: 0, scale: 0.9 },
  } as Variants,

  // ------------------------------------------
  // CUSTOM INDEX-BASED STAGGER
  // Use with custom={index} prop
  // ------------------------------------------

  /** Staggered slide up with custom delay */
  staggeredSlideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * staggerDelays.normal,
        duration: durations.normal,
        ease: easings.smooth,
      },
    }),
  } as Variants,

  /** Staggered slide from left with custom delay */
  staggeredSlideLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * staggerDelays.normal,
        duration: durations.normal,
        ease: easings.smooth,
      },
    }),
  } as Variants,

  /** Staggered slide from right with custom delay */
  staggeredSlideRight: {
    hidden: { opacity: 0, x: 20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * staggerDelays.normal,
        duration: durations.normal,
        ease: easings.smooth,
      },
    }),
  } as Variants,

  /** Staggered scale with custom delay */
  staggeredScale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * staggerDelays.normal,
        duration: durations.normal,
        ease: easings.smooth,
      },
    }),
  } as Variants,

  // ------------------------------------------
  // MODAL/OVERLAY ANIMATIONS
  // ------------------------------------------

  /** Modal backdrop */
  backdrop: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: durations.fast },
    },
    exit: {
      opacity: 0,
      transition: { duration: durations.fast },
    },
  } as Variants,

  /** Modal content */
  modal: {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: transitions.default,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: durations.fast },
    },
  } as Variants,

  /** Dropdown menu */
  dropdown: {
    hidden: { opacity: 0, scale: 0.95, y: -5 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: durations.fast, ease: easings.snap },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -5,
      transition: { duration: durations.instant },
    },
  } as Variants,

  /** Tooltip */
  tooltip: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: durations.instant },
    },
    exit: { opacity: 0, scale: 0.9 },
  } as Variants,

  // ------------------------------------------
  // INTERACTIVE STATES
  // ------------------------------------------

  /** Button tap effect */
  tap: {
    scale: 0.98,
    transition: { duration: durations.instant },
  },

  /** Hover lift effect */
  hoverLift: {
    y: -2,
    transition: transitions.fast,
  },

  /** Hover scale effect */
  hoverScale: {
    scale: 1.02,
    transition: transitions.fast,
  },

  // ------------------------------------------
  // 2026 REFACTORING - NEW VARIANTS
  // ------------------------------------------

  /** Deep press scale for CTA buttons */
  pressScale: {
    scale: 0.96,
    transition: { duration: durations.instant },
  },

  /** Subtle slide up (8px) for micro-interactions */
  slideUpSmall: {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, y: -4 },
  } as Variants,

  /** Bento grid item entry */
  bentoItem: {
    hidden: { opacity: 0, scale: 0.95, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * staggerDelays.fast,
        duration: durations.normal,
        ease: easings.smooth,
      },
    }),
  } as Variants,

  /** Count-up number animation trigger */
  countUp: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: durations.slow,
        ease: easings.smooth,
      },
    },
  } as Variants,

  // ------------------------------------------
  // LOADING STATES
  // ------------------------------------------

  /** Skeleton pulse */
  skeleton: {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as Variants,

  /** Spinner rotation */
  spinner: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  } as Variants,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a staggered container variant with custom timing
 */
export const createStaggerContainer = (
  staggerDelay: number = staggerDelays.normal,
  initialDelay: number = 0.1
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: initialDelay,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerDelay / 2,
      staggerDirection: -1,
    },
  },
});

/**
 * Create a custom staggered item variant
 */
export const createStaggerItem = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20
): Variants => {
  const offset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: -distance },
    right: { x: distance },
  }[direction];

  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: transitions.default,
    },
    exit: { opacity: 0, ...offset },
  };
};

/**
 * Create indexed stagger variant for custom={index} usage
 */
export const createIndexedStagger = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20,
  delay: number = staggerDelays.normal
): Variants => {
  const offset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: -distance },
    right: { x: distance },
  }[direction];

  return {
    hidden: { opacity: 0, ...offset },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        delay: i * delay,
        duration: durations.normal,
        ease: easings.smooth,
      },
    }),
  };
};

// ============================================
// EXPORTS
// ============================================

export const motionTokens = {
  easings,
  durations,
  staggerDelays,
  transitions,
  variants,
  createStaggerContainer,
  createStaggerItem,
  createIndexedStagger,
} as const;

export default motionTokens;
