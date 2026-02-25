"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowRight, ChevronRight } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import type { SeoBreakdown } from "@/lib/seo/analyzer";
import type { SeoDetailedPillars } from "@/hooks/products/useSeoGlobalScore";
import { AnimatedCounter } from "./AnimatedCounter";

interface SeoScoreHeroProps {
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
  good:   {
    bar: "from-signal-success to-signal-success/50",
    text: "text-signal-success",
    dot: "bg-signal-success",
    css: "hsl(var(--signal-success))",
    /* rgba fixe — CSS vars ne se résolvent pas dans les attributs SVG recharts */
    rgba: "rgba(34, 197, 94, 1)",
    rgbaFill: "rgba(34, 197, 94, 0.45)",
    glow: "drop-shadow-[0_0_10px_hsl(var(--signal-success)/0.5)]",
    badge: "bg-signal-success/10 text-signal-success border-signal-success/25",
  },
  medium: {
    bar: "from-signal-warning to-signal-warning/50",
    text: "text-signal-warning",
    dot: "bg-signal-warning",
    css: "hsl(var(--signal-warning))",
    rgba: "rgba(234, 179, 8, 1)",
    rgbaFill: "rgba(234, 179, 8, 0.45)",
    glow: "drop-shadow-[0_0_10px_hsl(var(--signal-warning)/0.5)]",
    badge: "bg-signal-warning/10 text-signal-warning border-signal-warning/25",
  },
  bad: {
    bar: "from-destructive to-destructive/50",
    text: "text-destructive",
    dot: "bg-destructive",
    css: "hsl(var(--destructive))",
    rgba: "rgba(239, 68, 68, 1)",
    rgbaFill: "rgba(239, 68, 68, 0.45)",
    glow: "drop-shadow-[0_0_10px_hsl(var(--destructive)/0.6)]",
    badge: "bg-destructive/10 text-destructive border-destructive/25",
  },
} as const;

/* ─── Pillar row — compact premium ──────────────────────────────── */
/*
 * Layout : [dot 6px] [label flex-1] [bar 88px h-2] [score 36px] [chevron 14px]
 * Hauteur totale : ~22px. Pas de troncature avec flex-1 + shrink-0 sur le reste.
 */
function PillarRow({
  label, score, delay, onClick,
}: {
  label: string; score: number; delay: number; onClick?: () => void;
}) {
  const st = getStatus(score);
  const c  = STATUS[st];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-150",
        onClick
          ? "cursor-pointer hover:bg-muted/50 group/row"
          : "cursor-default"
      )}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: motionTokens.durations.normal, delay }}
    >
      {/* Status dot */}
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />

      {/* Label */}
      <span className="text-xs font-medium text-muted-foreground flex-1 text-left truncate group-hover/row:text-foreground transition-colors">
        {label}
      </span>

      {/* Bar fixe 88px — gradient fade pour l'effet premium */}
      <div className="w-[88px] shrink-0 h-2 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", c.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{
            duration: motionTokens.durations.slowest,
            delay: delay + 0.1,
            ease: motionTokens.easings.smooth,
          }}
        />
      </div>

      {/* Score % */}
      <span className={cn("text-xs font-bold tabular-nums w-8 text-right shrink-0", c.text)}>
        {score}%
      </span>

      {/* Chevron */}
      <ChevronRight className={cn(
        "h-3 w-3 shrink-0 transition-all duration-150",
        onClick
          ? "text-muted-foreground/30 group-hover/row:text-foreground group-hover/row:translate-x-0.5"
          : "opacity-0 w-0"
      )} />
    </motion.button>
  );
}

/* ─── Custom radar tick ──────────────────────────────────────────── */
function RadarTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (!payload) return null;
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontSize={9} fontWeight={600}
      /* rgba neutre visible light + dark — évite le disappear des CSS vars dans SVG */
      fill="rgba(148, 163, 184, 0.9)"
      fontFamily="inherit">
      {payload.value}
    </text>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export function SeoScoreHero({
  score, breakdown, detailedPillars, analyzedProducts,
  previousPeriodChange = 0, period = "vs mois dernier",
  onDrillDown, onFixCategory, className,
}: SeoScoreHeroProps) {

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
  const C        = STATUS[globalSt];

  const radarFill = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)";

  /* ── Trend ───────────────────────────────────────────────── */
  const isPositive = previousPeriodChange > 0;
  const isNeutral  = previousPeriodChange === 0;
  const TrendIcon  = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendStyle = isNeutral
    ? "bg-muted/80 text-muted-foreground border-border"
    : isPositive
      ? "bg-signal-success/10 text-signal-success border-signal-success/25"
      : "bg-destructive/10 text-destructive border-destructive/25";

  /* ── Pillars ─────────────────────────────────────────────── */
  const p  = detailedPillars;
  const bd = breakdown;
  const fb = (agg = 0) => Math.min(100, Math.round(agg * 4));

  const pillars = useMemo(() => [
    { key: "meta_title"       as const, label: "Meta Titre",        score: p?.meta_title.avgScore       ?? fb(bd?.titles) },
    { key: "title_product"    as const, label: "Titre Produit",     score: p?.title_product.avgScore    ?? fb(bd?.titles) },
    { key: "meta_description" as const, label: "Meta Description",  score: p?.meta_description.avgScore ?? fb(bd?.descriptions) },
    { key: "description"      as const, label: "Description",       score: p?.description.avgScore      ?? fb(bd?.descriptions) },
    { key: "images"           as const, label: "Images & Alt Text", score: p?.images.avgScore           ?? fb(bd?.images) },
    { key: "slug"             as const, label: "URL / Slug",        score: p?.slug.avgScore             ?? fb(bd?.technical) },
  ], [p, bd]);

  const worstPillar = useMemo(
    () => [...pillars].sort((a, b) => a.score - b.score)[0],
    [pillars]
  );

  /* ── Radar data ──────────────────────────────────────────── */
  /* Labels courts pour éviter les chevauchements sur le radar */
  const radarData = useMemo(() => [
    { subject: "M.Titre",  score: pillars[0].score, target: 80 },
    { subject: "Titre",    score: pillars[1].score, target: 80 },
    { subject: "M.Desc.",  score: pillars[2].score, target: 80 },
    { subject: "Desc.",    score: pillars[3].score, target: 80 },
    { subject: "Images",   score: pillars[4].score, target: 80 },
    { subject: "URL",      score: pillars[5].score, target: 80 },
  ], [pillars]);

  return (
    <div
      className={cn("relative overflow-hidden h-full flex flex-col", className)}
      onClick={onDrillDown}
      role={onDrillDown ? "button" : undefined}
      tabIndex={onDrillDown ? 0 : undefined}
      aria-label={`Score SEO : ${score}/100`}
    >
      {/* Blobs ambiants premium */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-signal-success/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-destructive/15  rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4 flex flex-col h-full gap-3">

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Icon */}
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <svg viewBox="0 0 24 24" width={18} height={18} className="fill-current">
                <path d="M12 4C7.04 4 3 8.04 3 13h2c0-3.87 3.13-7 7-7s7 3.13 7 7h2c0-4.96-4.04-9-9-9zm0 4c-2.76 0-5 2.24-5 5h2c0-1.65 1.35-3 3-3s3 1.35 3 3h2c0-2.76-2.24-5-5-5zm1 4h-2v6h2V12zm-1 8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" opacity="0"/>
                <path d="M12 4C7.04 4 3 8.04 3 13h2c0-3.87 3.13-7 7-7s7 3.13 7 7h2c0-4.96-4.04-9-9-9zm0 4c-2.76 0-5 2.24-5 5h2c0-1.65 1.35-3 3-3s3 1.35 3 3h2c0-2.76-2.24-5-5-5zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase leading-none mb-0.5">
                Performance
              </p>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Score SEO</h2>
                <motion.span
                  className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide", C.badge)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {getStatusLabel(score)}
                </motion.span>
                {/* Pages analysées — inline dans le header */}
                <motion.span
                  className="text-[10px] text-muted-foreground tabular-nums"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  · {analyzedProducts} pages
                </motion.span>
              </div>
            </div>
          </div>

          <motion.div
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0", trendStyle)}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TrendIcon className="h-3 w-3" />
            {isNeutral
              ? <span>Stable</span>
              : <span className="tabular-nums">{isPositive ? "+" : ""}{previousPeriodChange} pts</span>
            }
            <span className="text-muted-foreground/60 hidden lg:inline">{period}</span>
          </motion.div>
        </div>

        {/* ══ BODY : Radar (45%) + Piliers (55%) ══════════════════ */}
        {/*
          Layout horizontal :
          - Gauche (45%) : radar spider chart + score en overlay + "X analysés"
            Le radar prend toute la hauteur de la colonne → grand et lisible
          - Droite (55%) : 6 piliers compacts sur une ligne chacun
            Bar fixe 88px → pas de troncature, label flexible

          On donne 45% au radar au lieu de 160px fixe → radar ~2× plus grand.
          La barre fixe 88px suffit pour comparer visuellement les 6 valeurs.
        */}
        <div className="flex-1 flex gap-4 min-h-0">

          {/* ─ Colonne radar (52%) ─ */}
          <div className="w-[52%] shrink-0 flex flex-col min-h-0">

            {/* Radar responsive — prend toute la hauteur disponible */}
            <div className="relative flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid
                    gridType="polygon"
                    /*
                     * rgba fixe visible light + dark.
                     * CSS var --border disparaît en dark mode dans les SVG recharts
                     * car les SVG n'héritent pas du cascade CSS de la même façon.
                     */
                    stroke="rgba(148, 163, 184, 0.25)"
                  />
                  <PolarAngleAxis
                    dataKey="subject"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tick={RadarTick as any}
                    tickLine={false}
                  />
                  {/* Ligne objectif 80 — pointillée, visible dark + light */}
                  <Radar name="target" dataKey="target"
                    stroke="rgba(148, 163, 184, 0.35)"
                    strokeDasharray="4 3" strokeWidth={1.5}
                    fill="transparent" dot={false}
                  />
                  {/* Score actuel — blanc en dark, noir en light, sans bordure */}
                  <Radar name="score" dataKey="score"
                    stroke="none" strokeWidth={0}
                    fill={radarFill} fillOpacity={1}
                    dot={false}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Score en overlay — glow premium */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.span
                  className={cn("leading-none font-light tracking-tighter", C.text, C.glow)}
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <AnimatedCounter value={score} delay={0.55} duration={1.4} className={cn(C.text)} />
                </motion.span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">
                  / 100
                </span>
              </div>
            </div>

          </div>

          {/* ─ Colonne piliers (55%) ─ */}
          {/*
            justify-center : les 6 lignes sont centrées verticalement dans
            l'espace disponible, pas collées en haut.
          */}
          <div className="flex-1 flex flex-col justify-center gap-0.5 min-w-0">
            {pillars.map((pl, i) => (
              <PillarRow
                key={pl.key}
                label={pl.label}
                score={pl.score}
                delay={0.28 + i * 0.07}
                onClick={
                  getStatus(pl.score) !== "good"
                    ? () => onFixCategory?.(pl.key)
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* ══ FOOTER CTA ══════════════════════════════════════════ */}
        {getStatus(worstPillar.score) === "bad" && (
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFixCategory?.(worstPillar.key); }}
            className={cn(
              "shrink-0 w-full flex items-center justify-between px-3 py-2 rounded-xl",
              "bg-gradient-to-r from-destructive/8 via-card/50 to-card/50",
              "border border-destructive/20 hover:border-destructive/40",
              "hover:from-destructive/12 transition-all duration-300 group/cta"
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse shrink-0" />
              <p className="text-xs font-medium text-destructive/90">
                <span className="font-bold">Priorité :</span>{" "}améliorer{" "}
                <span className="font-bold border-b border-destructive/30">{worstPillar.label}</span>
                {" "}({worstPillar.score}%)
              </p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-destructive/50 shrink-0 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </motion.button>
        )}

      </div>
    </div>
  );
}
