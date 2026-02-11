/**
 * Design System - Component Style Utilities
 *
 * Ready-to-use CSS class combinations for common UI patterns.
 * These utilities ensure consistency across all components.
 *
 * Usage:
 * import { styles } from '@/lib/design-system/styles';
 * <div className={styles.card.base}>...</div>
 */

// ============================================
// CARD STYLES
// ============================================

export const cardStyles = {
  /** Standard card with border */
  base: 'bg-card border border-border rounded-lg',

  /** Elevated card with shadow */
  elevated: 'bg-card border border-border rounded-lg shadow-md',

  /** Glass effect card */
  glass: 'bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl',

  /** Interactive card with hover effect */
  interactive: 'bg-card border border-border rounded-lg transition-all duration-200 hover:bg-muted/50',

  /** Card with lift on hover */
  lift: 'bg-card border border-border rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',

  /** Flat card without border */
  flat: 'bg-muted/50 rounded-lg',

  /** Outlined card */
  outlined: 'bg-transparent border-2 border-border rounded-lg',

  /** Glass card with interactive border glow */
  glassInteractive: 'bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl transition-all duration-200 hover:border-primary/20 hover:shadow-glow-sm cursor-pointer',

  /** Bento grid cell */
  bento: 'bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl p-6',
} as const;

// ============================================
// BUTTON STYLES (Beyond shadcn variants)
// ============================================

export const buttonStyles = {
  /** Icon button base */
  icon: 'h-9 w-9 rounded-lg transition-all duration-200',

  /** Icon button with hover */
  iconInteractive: 'h-9 w-9 rounded-lg transition-all duration-200 hover:bg-muted',

  /** Primary action button */
  primaryAction: 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',

  /** Subtle button */
  subtle: 'text-muted-foreground hover:text-foreground hover:bg-muted transition-all',

  /** Danger button */
  danger: 'text-destructive hover:bg-destructive/10 transition-all',
} as const;

// ============================================
// BADGE STYLES
// ============================================

export const badgeStyles = {
  /** Base badge styling */
  base: 'inline-flex items-center rounded-full font-semibold text-xs',

  /** Status badges */
  success: 'bg-success/15 text-success border border-success/30',
  warning: 'bg-warning/15 text-warning border border-warning/30',
  error: 'bg-destructive/15 text-destructive border border-destructive/30',
  info: 'bg-info/15 text-info border border-info/30',
  neutral: 'bg-muted text-muted-foreground border border-border',

  /** Primary badge */
  primary: 'bg-primary/15 text-primary border border-primary/30',

  /** Sizes */
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
} as const;

// ============================================
// INPUT STYLES
// ============================================

export const inputStyles = {
  /** Base input */
  base: 'bg-muted border border-border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring',

  /** Search input */
  search: 'bg-muted border-none rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground',

  /** Input with icon */
  withIcon: 'pl-10',

  /** Soft UI neumorphic input */
  softUI: 'soft-ui rounded-lg px-3 py-2 text-sm transition-all duration-200 focus:outline-none',

  /** Glass input */
  glass: 'bg-card/40 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
} as const;

// ============================================
// ICON CONTAINER STYLES
// ============================================

export const iconContainerStyles = {
  /** Small icon container */
  sm: 'w-8 h-8 rounded-lg flex items-center justify-center',

  /** Medium icon container */
  md: 'w-10 h-10 rounded-lg flex items-center justify-center',

  /** Large icon container */
  lg: 'w-12 h-12 rounded-xl flex items-center justify-center',

  /** With muted background */
  muted: 'bg-muted',

  /** With primary gradient */
  primary: 'bg-primary text-primary-foreground',

  /** With subtle background */
  subtle: 'bg-muted/50',
} as const;

// ============================================
// LAYOUT STYLES
// ============================================

export const layoutStyles = {
  /** Page container */
  pageContainer: 'container mx-auto px-4 py-6',

  /** Section spacing */
  section: 'space-y-6',

  /** Grid layouts */
  gridCols2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  gridCols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  gridCols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',

  /** Flex layouts */
  flexBetween: 'flex items-center justify-between',
  flexCenter: 'flex items-center justify-center',
  flexStart: 'flex items-center gap-2',
  flexCol: 'flex flex-col gap-4',

  /** Bento grid layout */
  bentoGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min',

  /** Bento cell spanning 2 columns */
  bentoSpan2: 'md:col-span-2',

  /** Bento cell spanning 2 rows */
  bentoSpanTall: 'row-span-2',
} as const;

// ============================================
// TEXT STYLES
// ============================================

export const textStyles = {
  /** Headings */
  h1: 'text-3xl font-bold tracking-tight',
  h2: 'text-2xl font-bold tracking-tight',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',

  /** Body text */
  body: 'text-sm text-foreground',
  bodyMuted: 'text-sm text-muted-foreground',
  bodySmall: 'text-xs text-muted-foreground',

  /** Labels */
  label: 'text-sm font-medium',
  labelSmall: 'text-xs font-medium uppercase tracking-wider text-muted-foreground',

  /** Truncate */
  truncate: 'truncate',
  lineClamp2: 'line-clamp-2',
  lineClamp3: 'line-clamp-3',
} as const;

// ============================================
// ANIMATION STYLES (CSS-based)
// ============================================

export const animationStyles = {
  /** Transitions */
  transitionFast: 'transition-all duration-150',
  transitionNormal: 'transition-all duration-200',
  transitionSlow: 'transition-all duration-300',

  /** Transform on hover */
  hoverLift: 'hover:-translate-y-0.5',
  hoverScale: 'hover:scale-[1.02]',

  /** Pulse animation */
  pulse: 'animate-pulse',

  /** Spin animation */
  spin: 'animate-spin',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Combine multiple style strings
 */
export const combineStyles = (...styles: (string | undefined | null | false)[]): string => {
  return styles.filter(Boolean).join(' ');
};

/**
 * Get badge style based on status
 */
export const getStatusBadgeStyle = (
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string => {
  return combineStyles(badgeStyles.base, badgeStyles[status], badgeStyles[size]);
};

/**
 * Get card style with optional interactive state
 */
export const getCardStyle = (
  variant: keyof typeof cardStyles = 'base',
  interactive: boolean = false
): string => {
  if (interactive && variant === 'base') {
    return cardStyles.interactive;
  }
  return cardStyles[variant];
};

// ============================================
// EXPORTS
// ============================================

export const styles = {
  card: cardStyles,
  button: buttonStyles,
  badge: badgeStyles,
  input: inputStyles,
  iconContainer: iconContainerStyles,
  layout: layoutStyles,
  text: textStyles,
  animation: animationStyles,
  combine: combineStyles,
  getStatusBadge: getStatusBadgeStyle,
  getCard: getCardStyle,
} as const;

export default styles;
