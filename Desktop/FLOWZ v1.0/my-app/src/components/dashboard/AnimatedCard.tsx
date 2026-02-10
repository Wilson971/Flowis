import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from "../../lib/utils";
import { staggerItem } from "../../lib/motion";

/**
 * AnimatedCard Component
 *
 * A wrapper component for dashboard cards that automatically applies:
 * - Stagger animation when part of a grid
 * - Optional glassmorphism effect
 * - Consistent border radius and spacing
 * - Custom delay for fine-tuned animation timing
 *
 * @example
 * // Basic usage in a grid
 * <AnimatedCard>
 *   <YourCardContent />
 * </AnimatedCard>
 *
 * @example
 * // With glassmorphism and custom delay
 * <AnimatedCard glassmorphism delay={0.3}>
 *   <YourCardContent />
 * </AnimatedCard>
 *
 * @example
 * // Custom index for stagger (useful for explicit control)
 * <AnimatedCard index={0}>
 *   <FirstCard />
 * </AnimatedCard>
 * <AnimatedCard index={1}>
 *   <SecondCard />
 * </AnimatedCard>
 */

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Card content */
  children: React.ReactNode;

  /** Apply glassmorphism effect (backdrop blur + subtle border) */
  glassmorphism?: boolean;

  /** Custom animation delay in seconds (overrides index-based delay) */
  delay?: number;

  /** Index for stagger animation (auto-calculated if in stagger container) */
  index?: number;

  /** Additional CSS classes */
  className?: string;
}

export const AnimatedCard = ({
  children,
  glassmorphism = false,
  delay,
  index,
  className,
  ...motionProps
}: AnimatedCardProps) => {
  // Create custom variants with delay if specified
  const customVariants = delay
    ? {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay,
          duration: 0.4,
          ease: 'easeOut' as any,
        },
      },
    }
    : staggerItem;

  return (
    <motion.div
      className={cn(
        // Base card styles
        'rounded-2xl overflow-hidden',

        // Glassmorphism effect
        glassmorphism && 'glassmorphism',

        // Additional classes
        className
      )}
      variants={customVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedCardGrid Component
 *
 * A grid container that automatically applies stagger animation to its AnimatedCard children
 *
 * @example
 * <AnimatedCardGrid>
 *   <AnimatedCard>Card 1</AnimatedCard>
 *   <AnimatedCard>Card 2</AnimatedCard>
 *   <AnimatedCard>Card 3</AnimatedCard>
 * </AnimatedCardGrid>
 */

interface AnimatedCardGridProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each card animation in seconds */
  staggerDelay?: number;
}

export const AnimatedCardGrid = ({
  children,
  className,
  staggerDelay = 0.1,
}: AnimatedCardGridProps) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0,
          },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};
