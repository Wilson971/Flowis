import { motion } from 'framer-motion';
import { cn } from "../../lib/utils";

/**
 * AuroraBackground Component
 *
 * Creates an animated aurora/gradient light effect in the background
 * Used in the main shell and sidebar for visual depth
 *
 * @example
 * // Single aurora layer
 * <AuroraBackground opacity={0.3} />
 *
 * @example
 * // Multiple layers for depth
 * <AuroraBackground opacity={0.3} />
 * <AuroraBackground opacity={0.15} />
 */

interface AuroraBackgroundProps {
  /** Opacity of the aurora effect (0-1) */
  opacity?: number;
  /** Additional CSS classes */
  className?: string;
}

export const AuroraBackground = ({
  opacity = 0.4,
  className
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none z-[1]", className)}
      style={{ opacity }}
    >
      {/* First aurora blob - Primary color */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 100, 0],
          scale: [1, 1.5, 0.8, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[20%] -left-[20%] w-[100%] h-[100%] rounded-full bg-primary/30 blur-[100px]"
      />

      {/* Second aurora blob - Accent color */}
      <motion.div
        animate={{
          x: [0, -120, 60, 0],
          y: [0, 90, -70, 0],
          scale: [1, 1.4, 0.7, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[30%] -right-[30%] w-[120%] h-[120%] rounded-full bg-info/20 blur-[120px]"
      />
    </div>
  );
};

/**
 * ShellAurora Component
 *
 * Positioned aurora effect specifically for the sidebar
 * Can be positioned at top, middle, or bottom
 *
 * @example
 * <ShellAurora position="top" opacity={0.6} />
 * <ShellAurora position="middle" opacity={0.4} />
 * <ShellAurora position="bottom" opacity={0.5} />
 */

interface ShellAuroraProps {
  /** Position in the sidebar */
  position: 'top' | 'middle' | 'bottom';
  /** Opacity of the effect (0-1) */
  opacity?: number;
}

export const ShellAurora = ({ position, opacity = 0.2 }: ShellAuroraProps) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return "-top-[20%] -left-[40%]";
      case 'middle':
        return "top-[40%] -left-[60%]";
      case 'bottom':
        return "-bottom-[20%] -left-[40%]";
    }
  };

  const getColorClass = () => {
    switch (position) {
      case 'top':
        return "bg-primary";
      case 'middle':
        return "bg-primary";
      case 'bottom':
        return "bg-secondary";
    }
  };

  return (
    <div
      className={cn(
        "absolute w-[500px] h-[500px] pointer-events-none z-0 overflow-visible",
        getPositionClasses()
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.15, 0.9, 1.05, 1],
          opacity: [opacity * 0.6, opacity, opacity * 0.7, opacity * 0.5, opacity * 0.6],
          rotate: [0, 360],
          x: [0, 50, 20, -40, -20, 0],
          y: [0, -30, 40, 20, -50, 0],
        }}
        transition={{
          scale: { duration: 17, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 13, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 90, repeat: Infinity, ease: "linear" },
          x: { duration: 37, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 43, repeat: Infinity, ease: "easeInOut" },
        }}
        className={cn(
          "w-full h-full rounded-full blur-[100px]",
          getColorClass()
        )}
      />
    </div>
  );
};
