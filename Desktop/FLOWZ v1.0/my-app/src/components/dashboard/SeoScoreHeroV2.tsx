"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowRight, ChevronRight, Gauge } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import type { SeoBreakdown } from "@/lib/seo/analyzer";
import type { SeoDetailedPillars } from "@/hooks/products/useSeoGlobalScore";
import { AnimatedCounter } from "./AnimatedCounter";

interface SeoScoreHeroV2Props {
  score: number;
  breakdown?: SeoBreakdown;
  detailedPillars?: SeoDetailedPillars;
  analyzedProducts: number;
  previousPeriodChange?: number;
  period?: string;
  onDrillDown?: () => void;
  onViewImprovements?: () => void;
  onFixCategory?: (category: keyof SeoDetailedPillars) => void;
  className?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
type Status = "good" | "medium" | "bad";

const getStatus = (s: number): Status =>
  s >= 70 ? "good" : s >= 40 ? "medium" : "bad";

const getStatusLabel = (s: number) =>
  s >= 70 ? "Bon" : s >= 40 ? "Moyen" : "Critique";

const STATUS = {
  good: {
    bar: "#10b981",       // emerald-500
    barBg: "#10b98118",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600",
    rgba: "rgba(16, 185, 129, 1)",
    rgbaFill: "rgba(16, 185, 129, 0.40)",
  },
  medium: {
    bar: "#f59e0b",       // amber-500
    barBg: "#f59e0b18",
    text: "text-amber-600",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600",
    rgba: "rgba(245, 158, 11, 1)",
    rgbaFill: "rgba(245, 158, 11, 0.40)",
  },
  bad: {
    bar: "#ef4444",       // red-500
    barBg: "#ef444418",
    text: "text-red-500",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-500",
    rgba: "rgba(239, 68, 68, 1)",
    rgbaFill: "rgba(239, 68, 68, 0.40)",
  },
} as const;

/* ─── Pillar row — clean table style ─────────────────────────── */
function PillarRow({
  label, score, onClick,
}: {
  label: string; score: number; onClick?: () => void;
}) {
  const st = getStatus(score);
  const c = STATUS[st];

  return (
    <motion.button
      type="button"
      variants={motionTokens.variants.staggerItem}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "w-full flex flex-col gap-1 px-2 py-2.5",
        "transition-colors",
        onClick
          ? "cursor-pointer hover:bg-muted/30 group/row"
          : "cursor-default"
      )}
    >
      <div className="flex items-center justify-between w-full gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
          <span className="text-xs font-medium text-muted-foreground truncate group-hover/row:text-foreground transition-colors text-left">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn("text-[11px] font-semibold tabular-nums", c.text)}>{score}%</span>
          {onClick && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover/row:text-foreground group-hover/row:translate-x-0.5 transition-all" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: c.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: motionTokens.easings.smooth }}
        />
      </div>
    </motion.button>
  );
}

/* ─── Custom radar tick ─────────────────────────────────────────── */
function RadarTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (!payload) return null;
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontSize={9} fontWeight={600}
      fill="rgba(148, 163, 184, 0.9)"
      fontFamily="inherit">
      {payload.value}
    </text>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export function SeoScoreHeroV2({
  score, breakdown, detailedPillars, analyzedProducts,
  previousPeriodChange = 0, period = "vs mois dernier",
  onDrillDown, onFixCategory, className,
}: SeoScoreHeroV2Props) {

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const check = () => setIsDark(document.documentElement.classList.contains("dark") || mq.matches);
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    mq.addEventListener("change", check);
    return () => { observer.disconnect(); mq.removeEventListener("change", check); };
  }, []);

  const globalSt = getStatus(score);
  const C = STATUS[globalSt];

  const radarFill = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)";

  /* ── Trend ── */
  const isPositive = previousPeriodChange > 0;
  const isNeutral = previousPeriodChange === 0;
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral
    ? "text-muted-foreground"
    : isPositive ? "text-emerald-600" : "text-red-500";

  /* ── Pillars ── */
  const p = detailedPillars;
  const bd = breakdown;
  const fb = (agg = 0) => Math.min(100, Math.round(agg * 4));

  const pillars = useMemo(() => [
    { key: "meta_title" as const, label: "Meta Titre", score: p?.meta_title.avgScore ?? fb(bd?.titles) },
    { key: "title_product" as const, label: "Titre Produit", score: p?.title_product.avgScore ?? fb(bd?.titles) },
    { key: "meta_description" as const, label: "Meta Description", score: p?.meta_description.avgScore ?? fb(bd?.descriptions) },
    { key: "description" as const, label: "Description", score: p?.description.avgScore ?? fb(bd?.descriptions) },
    { key: "images" as const, label: "Images & Alt Text", score: p?.images.avgScore ?? fb(bd?.images) },
    { key: "slug" as const, label: "URL / Slug", score: p?.slug.avgScore ?? fb(bd?.technical) },
  ], [p, bd]);

  const worstPillar = useMemo(
    () => [...pillars].sort((a, b) => a.score - b.score)[0],
    [pillars]
  );

  /* ── Radar data ── */
  const radarData = useMemo(() => [
    { subject: "M.Titre", score: pillars[0].score, target: 80 },
    { subject: "Titre", score: pillars[1].score, target: 80 },
    { subject: "M.Desc.", score: pillars[2].score, target: 80 },
    { subject: "Desc.", score: pillars[3].score, target: 80 },
    { subject: "Images", score: pillars[4].score, target: 80 },
    { subject: "URL", score: pillars[5].score, target: 80 },
  ], [pillars]);

  return (
    <div
      className={cn("relative overflow-hidden h-full flex flex-col", className)}
      onClick={onDrillDown}
      role={onDrillDown ? "button" : undefined}
      tabIndex={onDrillDown ? 0 : undefined}
      aria-label={`Score SEO : ${score}/100`}
    >
      <div className="relative z-10 p-4 flex flex-col h-full gap-2">

        {/* ══ HEADER ═══════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
              <Gauge className="h-[18px] w-[18px] text-foreground/70" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider leading-none mb-1">
                Performance
              </p>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Score SEO</h2>
                <span className={cn("h-5 rounded-full px-2 text-[10px] font-medium border-0 inline-flex items-center", C.badge)}>
                  {getStatusLabel(score)}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono tabular-nums">
                  {analyzedProducts} pages
                </span>
              </div>
            </div>
          </div>

          {/* Trend chip */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium shrink-0",
              "bg-muted/40 ring-1 ring-border/30",
              trendColor
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {isNeutral
              ? <span>Stable</span>
              : <span className="tabular-nums">{isPositive ? "+" : ""}{previousPeriodChange} pts</span>
            }
            <span className="text-muted-foreground/40 hidden lg:inline">{period}</span>
          </div>
        </div>

        {/* ══ BODY : Radar (55%) + Pillars (45%) ════════════════ */}
        <div className="flex-1 flex gap-3 min-h-0">

          {/* ─ Radar column ─ */}
          <div className="w-[55%] shrink-0 flex flex-col min-h-0">
            <div className="relative flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <PolarGrid
                    gridType="polygon"
                    stroke="rgba(148, 163, 184, 0.25)"
                  />
                  <PolarAngleAxis
                    dataKey="subject"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tick={RadarTick as any}
                    tickLine={false}
                  />
                  <Radar name="target" dataKey="target"
                    stroke="rgba(148, 163, 184, 0.35)"
                    strokeDasharray="4 3" strokeWidth={1.5}
                    fill="transparent" dot={false}
                  />
                  <Radar name="score" dataKey="score"
                    stroke="none" strokeWidth={0}
                    fill={radarFill} fillOpacity={1}
                    dot={false}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Score overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={cn("leading-none font-semibold tracking-tight", C.text)}
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
                >
                  <AnimatedCounter value={score} delay={0.55} duration={1.4} className={cn(C.text)} />
                </span>
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1 font-medium">
                  / 100
                </span>
              </div>
            </div>
          </div>

          {/* ─ Pillars column ─ */}
          <motion.div
            className="flex-1 flex flex-col justify-center min-w-0"
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {pillars.map((pl) => (
              <PillarRow
                key={pl.key}
                label={pl.label}
                score={pl.score}
                onClick={
                  getStatus(pl.score) !== "good"
                    ? () => onFixCategory?.(pl.key)
                    : undefined
                }
              />
            ))}
          </motion.div>
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════ */}
        <div className="shrink-0 space-y-2 pt-2 border-t border-border/30">
          {/* Progress bar toward goal 70 */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progression vers <span className="font-semibold text-foreground">70/100</span></span>
            <span className={cn("font-semibold tabular-nums", C.text)}>
              {score >= 70 ? "Objectif atteint" : `+${70 - score} pts restants`}
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted/60 overflow-hidden relative">
            <div className="absolute top-0 bottom-0 w-px bg-foreground/20 z-10" style={{ left: "70%" }} />
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: C.bar }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(score, 100)}%` }}
              transition={{ duration: 1.2, delay: 0.9, ease: motionTokens.easings.smooth }}
            />
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (getStatus(worstPillar.score) === "bad") {
                onFixCategory?.(worstPillar.key);
              } else {
                onDrillDown?.();
              }
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-1.5 rounded-lg",
              "transition-colors group/cta",
              getStatus(worstPillar.score) === "bad"
                ? "bg-red-500/5 ring-1 ring-red-500/10 hover:bg-red-500/10"
                : "bg-muted/30 ring-1 ring-border/30 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                STATUS[getStatus(worstPillar.score)].dot
              )} />
              <span className="text-xs font-medium text-muted-foreground">
                Point faible : <span className="font-semibold text-foreground">{worstPillar.label}</span>{" "}
                <span className={cn("text-[10px]", STATUS[getStatus(worstPillar.score)].text)}>
                  ({worstPillar.score}%)
                </span>
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/cta:translate-x-0.5 group-hover/cta:text-foreground transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
