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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aurora-blob-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(100px, -80px) scale(1.5); opacity: 0.9; }
          66% { transform: translate(-50px, 100px) scale(0.8); opacity: 0.6; }
        }
        @keyframes aurora-blob-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          33% { transform: translate(-120px, 90px) scale(1.4); opacity: 0.8; }
          66% { transform: translate(60px, -70px) scale(0.7); opacity: 0.5; }
        }
        @keyframes shell-aurora {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: var(--aurora-opacity-base); }
          25% { transform: scale(1.15) rotate(90deg) translate(50px, -30px); opacity: var(--aurora-opacity-peak); }
          50% { transform: scale(0.9) rotate(180deg) translate(20px, 40px); opacity: var(--aurora-opacity-mid); }
          75% { transform: scale(1.05) rotate(270deg) translate(-40px, 20px); opacity: var(--aurora-opacity-low); }
        }
      `}} />
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
