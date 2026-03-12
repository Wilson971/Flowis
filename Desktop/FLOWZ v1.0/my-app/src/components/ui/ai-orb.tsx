"use client";

import { cn } from "@/lib/utils";

type OrbState = "idle" | "hover" | "active" | "generating";

interface AIOrbProps {
  state?: OrbState;
  /** @deprecated Use state prop instead */
  active?: boolean;
  size?: number;
  className?: string;
}

/* ──────────────────────────────────────────────────────────
 * Keyframes — injected once via <style> in the component.
 * Each layer has its own animation set to create organic,
 * phase-shifted motion that never looks mechanical.
 * ────────────────────────────────────────────────────────── */
const ORB_KEYFRAMES = `
  @keyframes orb-drift-a {
    0%   { border-radius: 30% 70% 70% 30% / 30% 52% 48% 70%; transform: rotate(0deg) scale(1); }
    20%  { border-radius: 58% 42% 34% 66% / 63% 32% 68% 37%; }
    40%  { border-radius: 42% 58% 64% 36% / 48% 61% 39% 52%; transform: rotate(144deg) scale(1.04); }
    60%  { border-radius: 66% 34% 45% 55% / 35% 55% 45% 65%; }
    80%  { border-radius: 36% 64% 56% 44% / 57% 44% 56% 43%; transform: rotate(288deg) scale(0.98); }
    100% { border-radius: 30% 70% 70% 30% / 30% 52% 48% 70%; transform: rotate(360deg) scale(1); }
  }
  @keyframes orb-drift-b {
    0%   { border-radius: 70% 30% 34% 66% / 52% 66% 34% 48%; transform: rotate(0deg) scale(1.02); }
    25%  { border-radius: 42% 58% 62% 38% / 38% 48% 52% 62%; transform: rotate(90deg) scale(0.96); }
    50%  { border-radius: 56% 44% 38% 62% / 64% 36% 64% 36%; transform: rotate(180deg) scale(1.05); }
    75%  { border-radius: 38% 62% 56% 44% / 44% 56% 44% 56%; transform: rotate(270deg) scale(0.97); }
    100% { border-radius: 70% 30% 34% 66% / 52% 66% 34% 48%; transform: rotate(360deg) scale(1.02); }
  }
  @keyframes orb-breathe {
    0%, 100% { transform: scale(0.82); opacity: var(--breathe-lo); }
    50%      { transform: scale(1.08); opacity: var(--breathe-hi); }
  }
  @keyframes orb-corona {
    0%, 100% { transform: scale(1); opacity: var(--corona-lo); }
    50%      { transform: scale(1.25); opacity: var(--corona-hi); }
  }
  @keyframes orb-flicker {
    0%, 100% { opacity: 0.6; }
    30%      { opacity: 1; }
    60%      { opacity: 0.75; }
    85%      { opacity: 0.95; }
  }
  @keyframes orb-ring-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orb-particle-orbit {
    0%   { transform: rotate(0deg)   translateX(var(--orbit-r)) rotate(0deg)   scale(1); opacity: 0.8; }
    25%  { transform: rotate(90deg)  translateX(var(--orbit-r)) rotate(-90deg) scale(1.3); opacity: 1; }
    50%  { transform: rotate(180deg) translateX(var(--orbit-r)) rotate(-180deg) scale(0.7); opacity: 0.6; }
    75%  { transform: rotate(270deg) translateX(var(--orbit-r)) rotate(-270deg) scale(1.1); opacity: 0.9; }
    100% { transform: rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg) scale(1); opacity: 0.8; }
  }
`;

/* ──────────────────────────────────────────────────────────
 * Per-state configuration tokens
 * ────────────────────────────────────────────────────────── */
const STATE = {
  idle: {
    driftA: "orb-drift-a 16s ease-in-out infinite",
    driftB: "orb-drift-b 20s ease-in-out infinite reverse",
    breathe: "orb-breathe 5s ease-in-out infinite",
    corona: "orb-corona 6s ease-in-out infinite",
    ring: "orb-ring-spin 24s linear infinite",
    breatheLo: 0.25,
    breatheHi: 0.55,
    coronaLo: 0.05,
    coronaHi: 0.15,
    chromaA: "rgba(0, 210, 255, 0.35)",
    chromaB: "rgba(120, 0, 255, 0.3)",
    nucleusColor: "rgba(0, 230, 255, 0.45)",
    nucleusBlur: 0.16,
    dotGlow: "0 0 3px rgba(0,220,255,0.3)",
    dotBright: 0.6,
    ringOpacity: 0.12,
    particleOpacity: 0,
    scale: 1,
  },
  hover: {
    driftA: "orb-drift-a 8s ease-in-out infinite",
    driftB: "orb-drift-b 10s ease-in-out infinite reverse",
    breathe: "orb-breathe 3s ease-in-out infinite",
    corona: "orb-corona 3.5s ease-in-out infinite",
    ring: "orb-ring-spin 12s linear infinite",
    breatheLo: 0.4,
    breatheHi: 0.75,
    coronaLo: 0.12,
    coronaHi: 0.3,
    chromaA: "rgba(0, 230, 255, 0.6)",
    chromaB: "rgba(140, 0, 255, 0.55)",
    nucleusColor: "rgba(0, 242, 255, 0.7)",
    nucleusBlur: 0.2,
    dotGlow: "0 0 6px rgba(0,242,255,0.5), 0 0 12px rgba(120,0,255,0.15)",
    dotBright: 0.8,
    ringOpacity: 0.3,
    particleOpacity: 0,
    scale: 1.12,
  },
  active: {
    driftA: "orb-drift-a 7s ease-in-out infinite",
    driftB: "orb-drift-b 9s ease-in-out infinite reverse",
    breathe: "orb-breathe 3.5s ease-in-out infinite",
    corona: "orb-corona 4s ease-in-out infinite",
    ring: "orb-ring-spin 8s linear infinite",
    breatheLo: 0.5,
    breatheHi: 0.85,
    coronaLo: 0.15,
    coronaHi: 0.35,
    chromaA: "rgba(0, 242, 255, 0.75)",
    chromaB: "rgba(130, 0, 255, 0.65)",
    nucleusColor: "#00f2ff",
    nucleusBlur: 0.22,
    dotGlow: "0 0 8px rgba(0,242,255,0.7), 0 0 16px rgba(100,0,255,0.2)",
    dotBright: 0.9,
    ringOpacity: 0.4,
    particleOpacity: 0,
    scale: 1,
  },
  generating: {
    driftA: "orb-drift-a 2.8s ease-in-out infinite",
    driftB: "orb-drift-b 3.4s ease-in-out infinite reverse",
    breathe: "orb-breathe 1.4s ease-in-out infinite",
    corona: "orb-corona 1.6s ease-in-out infinite",
    ring: "orb-ring-spin 2s linear infinite",
    breatheLo: 0.6,
    breatheHi: 1,
    coronaLo: 0.25,
    coronaHi: 0.55,
    chromaA: "#00f2ff",
    chromaB: "#8b00ff",
    nucleusColor: "#00f2ff",
    nucleusBlur: 0.25,
    dotGlow: "0 0 10px rgba(0,242,255,0.9), 0 0 24px rgba(120,0,255,0.35), 0 0 40px rgba(0,210,255,0.15)",
    dotBright: 1,
    ringOpacity: 0.6,
    particleOpacity: 1,
    scale: 1.05,
  },
} as const;

export function AIOrb({ state: stateProp, active, size = 24, className }: AIOrbProps) {
  const state: OrbState = stateProp ?? (active ? "active" : "idle");
  const s = STATE[state];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
      style={{
        width: size,
        height: size,
        transform: `scale(${s.scale})`,
        transition: "transform 400ms cubic-bezier(0.23, 1, 0.32, 1)",
        // CSS custom properties for keyframe access
        "--breathe-lo": s.breatheLo,
        "--breathe-hi": s.breatheHi,
        "--corona-lo": s.coronaLo,
        "--corona-hi": s.coronaHi,
        "--orbit-r": `${size * 0.42}px`,
      } as React.CSSProperties}
    >
      <style>{ORB_KEYFRAMES}</style>

      {/* ── Layer 1: Corona — outermost atmospheric glow ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -size * 0.5,
          background: `radial-gradient(circle, ${s.chromaA} 0%, ${s.chromaB} 40%, transparent 70%)`,
          filter: `blur(${size * 0.25}px)`,
          animation: s.corona,
          transition: "background 500ms ease",
        }}
      />

      {/* ── Layer 2: Chroma membrane A — primary morphing blob ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: -size * 0.08,
          background: `linear-gradient(135deg, ${s.chromaA}, ${s.chromaB})`,
          mixBlendMode: "screen",
          opacity: 0.7,
          animation: s.driftA,
          transition: "opacity 500ms ease, background 500ms ease",
        }}
      />

      {/* ── Layer 3: Chroma membrane B — counter-rotating secondary blob ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: -size * 0.06,
          background: `linear-gradient(315deg, ${s.chromaB}, ${s.chromaA})`,
          mixBlendMode: "screen",
          opacity: 0.5,
          animation: s.driftB,
          transition: "opacity 500ms ease, background 500ms ease",
        }}
      />

      {/* ── Layer 4: Orbital ring — thin conic gradient ring ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: -size * 0.12,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, ${s.chromaA}, transparent 25%, ${s.chromaB}, transparent 75%, ${s.chromaA})`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(1, size * 0.04)}px), black calc(100% - ${Math.max(1, size * 0.04)}px))`,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(1, size * 0.04)}px), black calc(100% - ${Math.max(1, size * 0.04)}px))`,
          opacity: s.ringOpacity,
          animation: s.ring,
          transition: "opacity 500ms ease",
        }}
      />

      {/* ── Layer 5: Nucleus — blurred glowing core ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: size * 0.15,
          borderRadius: "50%",
          background: s.nucleusColor,
          filter: `blur(${size * s.nucleusBlur}px)`,
          animation: s.breathe,
          transition: "background 400ms ease, filter 400ms ease",
        }}
      />

      {/* ── Layer 6: Inner seed — crisp luminous center ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,${s.dotBright}), ${s.nucleusColor})`,
          boxShadow: s.dotGlow,
          transition: "box-shadow 400ms ease, background 400ms ease",
          animation: state === "generating" ? "orb-flicker 0.8s ease-in-out infinite" : undefined,
        }}
      />

      {/* ── Layer 7: Specular highlight — glass-like reflection ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.14,
          height: size * 0.1,
          top: size * 0.22,
          left: size * 0.28,
          background: `rgba(255,255,255,${0.25 + s.dotBright * 0.25})`,
          filter: "blur(0.5px)",
          transform: "rotate(-20deg)",
          transition: "background 400ms ease",
        }}
      />

      {/* ── Layer 8: Orbiting particles — only visible when generating ── */}
      {state === "generating" && (
        <>
          {[0, 120, 240].map((deg) => (
            <div
              key={deg}
              className="absolute pointer-events-none"
              style={{
                width: Math.max(2, size * 0.08),
                height: Math.max(2, size * 0.08),
                borderRadius: "50%",
                background: "#00f2ff",
                boxShadow: "0 0 4px #00f2ff, 0 0 8px rgba(0,242,255,0.4)",
                top: "50%",
                left: "50%",
                marginTop: -Math.max(1, size * 0.04),
                marginLeft: -Math.max(1, size * 0.04),
                opacity: s.particleOpacity,
                animation: `orb-particle-orbit ${1.8 + (deg / 360) * 0.6}s linear infinite`,
                animationDelay: `${-deg / 360 * 1.8}s`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
