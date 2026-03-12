import { cn } from "../../lib/utils";

/**
 * AuroraBackground Component
 *
 * Creates an animated aurora/gradient light effect in the background
 * Uses CSS animations instead of Framer Motion to avoid GPU/CPU drain
 */

interface AuroraBackgroundProps {
  opacity?: number;
  className?: string;
}

export const AuroraBackground = ({
  opacity = 0.4,
  className
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none z-[1] motion-reduce:hidden", className)}
      style={{ opacity }}
    >
      {/* First aurora blob - Primary color */}
      <div
        className="absolute -top-[20%] -left-[20%] w-[100%] h-[100%] will-change-transform"
        style={{ animation: 'aurora-blob-1 25s ease-in-out infinite' }}
      >
        <div className="w-full h-full rounded-full bg-primary/30 blur-[100px]" />
      </div>

      {/* Second aurora blob - Accent color */}
      <div
        className="absolute top-[30%] -right-[30%] w-[120%] h-[120%] will-change-transform"
        style={{ animation: 'aurora-blob-2 30s ease-in-out infinite' }}
      >
        <div className="w-full h-full rounded-full bg-info/20 blur-[120px]" />
      </div>
    </div>
  );
};

interface ShellAuroraProps {
  position: 'top' | 'middle' | 'bottom';
  opacity?: number;
}

export const ShellAurora = ({ position, opacity = 0.2 }: ShellAuroraProps) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top': return "-top-[20%] -left-[40%]";
      case 'middle': return "top-[40%] -left-[60%]";
      case 'bottom': return "-bottom-[20%] -left-[40%]";
    }
  };

  const getColorClass = () => {
    switch (position) {
      case 'top': return "bg-primary";
      case 'middle': return "bg-primary";
      case 'bottom': return "bg-secondary";
    }
  };

  return (
    <div
      className={cn(
        "absolute w-[500px] h-[500px] pointer-events-none z-0 overflow-visible motion-reduce:hidden",
        getPositionClasses()
      )}
    >
      <div
        className="w-full h-full will-change-transform"
        style={{
          animation: 'shell-aurora 40s ease-in-out infinite',
          ['--aurora-opacity-base' as string]: `${opacity * 0.6}`,
          ['--aurora-opacity-peak' as string]: `${opacity}`,
          ['--aurora-opacity-mid' as string]: `${opacity * 0.7}`,
          ['--aurora-opacity-low' as string]: `${opacity * 0.5}`,
        }}
      >
        <div className={cn("w-full h-full rounded-full blur-[100px]", getColorClass())} />
      </div>
    </div>
  );
};
